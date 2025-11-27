# Database Usage Guide

## Getting Started with Wrapper Classes

### Guild Class

The `Guild` class is a high-level wrapper around `DBGuild` with cache awareness.

```typescript
import { Guild } from "../helpers";
import { Client, Guild as DiscordGuild } from "discord.js";

const guild = new Guild(client: Client, discordGuild: DiscordGuild);
```

#### Basic Operations

**Get Data**
```typescript
// Get single field
const prefix = await guild.get("settings.prefix");
// Result: "!" (string)

// Get parent path (all related fields)
const jtc = await guild.get("utils.join_to_create");
// Result: {
//   enabled: false,
//   channel: null,
//   category: null,
//   default_name: "%{VAR}% channel"
// }

// Get nested field
const ignoreChannels = await guild.get("utils.levels.ignore_channels");
// Result: ["123456789", "987654321"] (string[])
```

**Set Data**
```typescript
// Set single field
await guild.set("settings.prefix", "!");

// Set nested field
await guild.set("utils.join_to_create.enabled", true);

// Set object (parent path)
await guild.set("utils.join_to_create", {
  enabled: true,
  channel: "1234567890",
  category: "0987654321",
  default_name: "New Channel"
});
```

**Numeric Operations**
```typescript
// Add to a number (XP, money, etc.)
await guild.add("some.numeric.field", 100);

// Subtract from a number
await guild.sub("some.numeric.field", 50);
```

**Array Operations**
```typescript
// Push to array
await guild.push("utils.levels.ignore_channels", "new_channel_id");

// Remove from array - use get, modify, set
const channels = await guild.get("utils.levels.ignore_channels");
const updated = channels.filter(ch => ch !== "to_remove");
await guild.set("utils.levels.ignore_channels", updated);
```

**Other Operations**
```typescript
// Check if field exists
const exists = await guild.has("utils.join_to_create.enabled");

// Delete field
await guild.delete("some.field");

// Get all data (returns full Prisma Guild object)
const allData = await guild.all();
```

### User Class

The `User` class is a high-level wrapper around `DBUser` with cache awareness.

```typescript
import { User } from "../helpers";
import { Client, User as DiscordUser, Guild as DiscordGuild } from "discord.js";

const user = new User(client: Client, discordUser: DiscordUser, discordGuild: DiscordGuild);
```

#### Basic Operations

**Get Data**
```typescript
// Get single field
const level = await user.get("level.level");
// Result: 5 (number)

// Get parent path
const levelData = await user.get("level");
// Result: {
//   xp: 1500,
//   total_xp: 15000,
//   level: 5,
//   voice_time: 3600000,
//   message_count: 250
// }

// Get nested field
const wallet = await user.get("economy.balance.wallet");
// Result: 5000 (number)
```

**Set Data**
```typescript
// Set single field
await user.set("level.level", 10);

// Set parent path (all related fields)
await user.set("level", {
  xp: 2000,
  total_xp: 20000,
  level: 10,
  voice_time: 7200000,
  message_count: 500
});
```

**Numeric Operations**
```typescript
// Add XP
await user.add("level.xp", 100);
await user.add("level.total_xp", 100);

// Subtract money
await user.sub("economy.balance.wallet", 50);
```

**Other Operations**
```typescript
// Check if field exists
const hasLevel = await user.has("level.level");

// Delete field
await user.delete("some.field");

// Get all data
const allData = await user.all();
```

## Cache System

The `Guild` and `User` classes include built-in cache support for temporary data.

### Using Guild Cache

```typescript
const guild = new Guild(client, discordGuild);

// Get from cache
const guildSettings = await guild.cache.get("temp.settings");

// Set in cache
await guild.cache.set("temp.settings", { someData: true });

// Check if exists in cache
const exists = await guild.cache.has("temp.settings");

// Delete from cache
await guild.cache.delete("temp.settings");

// Get all cache data
const allCache = await guild.cache.all();

// Clear entire cache
await guild.cache.clear();
```

### Using User Cache

```typescript
const user = new User(client, discordUser, discordGuild);

// Track voice time temporarily
const voiceStart = Date.now();
await user.cache.set("temp.voice_time", voiceStart);

// Later, retrieve and calculate duration
const startTime = await user.cache.get("temp.voice_time");
const duration = Date.now() - startTime;

// Clear temp data after processing
await user.cache.delete("temp.voice_time");
```

## Event Handlers Pattern

### In Voice State Update Event

```typescript
import { Client, VoiceState } from "discord.js";
import { Guild, User } from "../helpers";

module.exports = async (client: Client, oldState: VoiceState, newState: VoiceState) => {
  if (!newState.guild || !newState.member) return;

  const guild = new Guild(client, newState.guild);
  const user = guild.getUser(newState.member.user.id);

  // Get voice XP settings
  const voiceSettings = await guild.get("utils.levels.voice_xp");
  
  if (!voiceSettings.enabled) return;

  // Track when user joins
  if (!oldState.channelId && newState.channelId) {
    await user.cache.set("temp.voice_time", Date.now());
  }

  // Calculate XP when user leaves
  if (oldState.channelId && !newState.channelId) {
    const voiceTime = await user.cache.get("temp.voice_time");
    
    if (voiceTime) {
      const duration = Date.now() - voiceTime;
      const xpEarned = Math.floor(duration / 1000 / 60); // XP per minute
      
      await user.add("level.xp", xpEarned);
      await user.add("level.voice_time", duration);
      await user.cache.delete("temp.voice_time");
    }
  }
};
```

### In Message Create Event

```typescript
import { Client, Message } from "discord.js";
import { Guild, User } from "../helpers";

module.exports = async (client: Client, message: Message) => {
  if (message.author.bot || !message.guild) return;

  const guild = new Guild(client, message.guild);
  const user = guild.getUser(message.author.id);

  // Get level settings
  const levelSettings = await guild.get("utils.levels");
  
  if (!levelSettings.enabled) return;

  // Increment message count
  await user.add("level.message_count", 1);

  // Add message XP
  const messageXP = levelSettings.message_xp ?? 1;
  await user.add("level.xp", messageXP);
};
```

## Type Safety with Paths

### Literal Paths vs Dynamic Paths

**Literal Paths** (Full type safety at compile time):
```typescript
// Good - TypeScript knows the return type!
const prefix = await guild.get("settings.prefix");
// Inferred type: string

const jtc = await guild.get("utils.join_to_create");
// Inferred type: JoinToCreateData

// Error! Path doesn't exist - caught at compile time ❌
const wrong = await guild.get("settings.nonexistent");
```

**Dynamic Paths** (Runtime validation only):
```typescript
// When you have a path as a variable
const pathString = userInput; // e.g., "settings.prefix"
const value = await guild.get(pathString);
// Type: any (no compile-time checking)

// You can still set with proper value
await guild.set(pathString as any, "!");
```

## Performance Tips

### 1. Use Parent Paths When Possible

```typescript
// ❌ Bad - Multiple DB queries
const xp = await user.get("level.xp");
const total = await user.get("level.total_xp");
const level = await user.get("level.level");

// ✅ Good - Single DB query
const levelData = await user.get("level");
const { xp, total_xp: total, level } = levelData;
```

### 2. Batch Updates

```typescript
// ❌ Bad - Multiple set operations
await user.set("level.xp", 1500);
await user.set("level.level", 5);
await user.set("level.total_xp", 15000);

// ✅ Good - Single set operation
await user.set("level", {
  xp: 1500,
  level: 5,
  total_xp: 15000,
  voice_time: 3600000,
  message_count: 250
});
```

### 3. Cache Frequently Accessed Data

```typescript
// Cache level settings after loading guild
const guildSettings = await guild.get("utils.levels");
await guild.cache.set("temp.level_settings", guildSettings);

// Use cached version in event handlers
const cachedSettings = await guild.cache.get("temp.level_settings");
if (!cachedSettings) {
  // Refresh if expired
  const fresh = await guild.get("utils.levels");
  await guild.cache.set("temp.level_settings", fresh);
}
```

### 4. Use Parallel Operations

```typescript
// ✅ Good - Parallel processing
const [guildData, userData] = await Promise.all([
  guild.get("utils.levels"),
  user.get("level")
]);

// ✅ Good - Parallel updates
await Promise.all([
  user.add("level.xp", 100),
  user.add("level.voice_time", 60000)
]);
```

## Common Patterns

### Initialize User Data

```typescript
async function ensureUserData(user: User) {
  const userData = await user.all();
  
  if (!userData) {
    // Create default data
    await user.set("level", {
      xp: 0,
      total_xp: 0,
      level: 0,
      voice_time: 0,
      message_count: 0
    });
  }
}
```

### Check and Update

```typescript
async function updateIfChanged(user: User, path: string, newValue: any) {
  const current = await user.get(path);
  
  if (current !== newValue) {
    await user.set(path, newValue);
    return true;
  }
  
  return false;
}
```

### Transactional Operations

```typescript
async function transferMoney(fromUser: User, toUser: User, amount: number) {
  try {
    await Promise.all([
      fromUser.sub("economy.balance.wallet", amount),
      toUser.add("economy.balance.wallet", amount)
    ]);
    return true;
  } catch (error) {
    console.error("Transfer failed:", error);
    return false;
  }
}
```

## Error Handling

```typescript
import { User } from "../helpers";

async function safeGetUserData(user: User, path: string) {
  try {
    const value = await user.get(path);
    return value;
  } catch (error) {
    if (error.message.includes("Unknown user path")) {
      console.error(`Invalid path: ${path}`);
      return null;
    }
    
    if (error.message.includes("PrismaClientValidationError")) {
      console.error("Database validation failed:", error);
      return null;
    }
    
    console.error("Unexpected error:", error);
    throw error;
  }
}
```

## Thread Safety

All operations are safe to use in parallel event handlers:

```typescript
// Safe - Prisma handles isolation
const [result1, result2] = await Promise.all([
  user.add("level.xp", 100),    // Multiple users
  otherUser.add("level.xp", 50)  // Same user in different tasks
]);

// Prisma automatically handles:
// ✅ Transaction isolation
// ✅ Concurrent access
// ✅ Database locks
```

---

**Last Updated**: November 27, 2025
**Version**: 2.0

