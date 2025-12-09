# Database Documentation

## Architecture

### Hybrid Database System
- **PostgreSQL** - User settings, guild configuration, metadata
- **MongoDB** - User level/economy data, guild components (custom modals, buttons, etc.), temporary cache

### Automatic Routing
DBGuild class automatically routes requests:
- `utils.components.*` → MongoDB (modals, embed, buttons, selectMenus, scenarios)
- Everything else → PostgreSQL

DBUser class automatically routes requests:
- `level.*` → MongoDB
- `economy.*` → MongoDB  
- Everything else → PostgreSQL

## Quick Start

### Guild Data

```typescript
import { Guild } from "./helpers";

const guild = new Guild(client, discordGuild);

// Get settings
const prefix = await guild.get("settings.prefix");
const language = await guild.get("settings.language");

// Update settings
await guild.set("settings.prefix", "!");
await guild.set("settings.language", "en");

// Parent paths return all children
const settings = await guild.get("settings");
// { prefix: "!", language: "en" }

// Level system settings
await guild.set("utils.levels.enabled", true);
await guild.set("utils.levels.ignore_channels", ["123", "456"]);

// Custom components (stored in MongoDB for better performance)
const modals = await guild.get("utils.components.modals");
const buttons = await guild.get("utils.components.buttons");
await guild.set("utils.components.modals", [...modals, newModal]);
```

### User Data

```typescript
import { User } from "./helpers";

const user = new User(client, discordUser, guild);

// Level system (MongoDB)
await user.add("level.xp", 50);
await user.add("level.message_count", 1);
const xp = await user.get("level.xp");
const level = await user.get("level.level");

// Get all level data at once
const levelData = await user.get("level");
// { xp: 150, total_xp: 500, level: 3, voice_time: 1200, message_count: 45 }

// Economy system (MongoDB)
await user.add("economy.balance.wallet", 100);
await user.sub("economy.balance.wallet", 50);
await user.set("economy.timeout.work", Date.now() + 3600000);

// Custom settings (PostgreSQL)
await user.set("custom.profile.bio", "Hello world!");
await user.set("custom.rank.mode", true);
```

## Data Storage

### PostgreSQL Tables

#### Guild Model
```typescript
// Settings
"settings.prefix" // string, default "a."
"settings.language" // string, default "ru"

// Join to Create
"utils.join_to_create.enabled" // boolean
"utils.join_to_create.channel" // string | null
"utils.join_to_create.category" // string | null
"utils.join_to_create.default_name" // string

// Levels
"utils.levels.enabled" // boolean
"utils.levels.ignore_channels" // string[]
"utils.levels.ignore_roles" // string[]
"utils.levels.level_roles" // Json object
"utils.levels.message.enabled" // boolean
"utils.levels.message.channel" // string | null

// Economy
"economy.currency_emoji" // string | null
"economy.shop_roles" // Json array
"economy.work.enabled" // boolean
"economy.work.cooldown" // number (seconds)
```

#### User Model
```typescript
// Custom card settings
"custom.balance.number" // string, unique
"custom.balance.mode" // boolean
"custom.profile.bio" // string
"custom.rank.color" // string | null

// Presets
"presets.jtc" // Json array
```

### MongoDB Collections

#### user_data (Persistent)
```typescript
{
  _id: "userId:guildId",
  data: {
    level: {
      xp: 0,
      total_xp: 0,
      level: 1,
      voice_time: 0,
      message_count: 0
    },
    economy: {
      balance: {
        wallet: 0,
        bank: 0
      },
      inventory: {
        custom: {
          roles: [],
          items: []
        }
      },
      timeout: {
        work: 0,
        timely: 0,
        daily: 0,
        weekly: 0,
        rob: 0
      }
    }
  },
  mapPaths: [], // Tracks Map structures
  updatedAt: Date
}
```

#### user_temp (24h TTL)
```typescript
{
  _id: "userId:guildId",
  data: {
    temp: {
      games: { /* game state */ },
      voice_time: 0
    }
  },
  updatedAt: Date
}
```

## CRUD Operations

### Get

```typescript
// Single value
const xp = await user.get("level.xp"); // number

// Parent path (all children)
const balance = await user.get("economy.balance");
// { wallet: 1000, bank: 5000 }

// Nested parent
const economy = await user.get("economy");
// { balance: {...}, inventory: {...}, timeout: {...} }
```

### Set

```typescript
// Single value
await user.set("level.xp", 100);
await user.set("custom.profile.bio", "My bio");

// Arrays
await user.set("utils.levels.ignore_channels", ["123", "456"]);
```

### Add/Sub (Numeric)

```typescript
// Add XP
await user.add("level.xp", 50);
await user.add("level.total_xp", 50);

// Subtract balance
await user.sub("economy.balance.wallet", 100);

// Add voice time
await user.add("level.voice_time", 60);
```

### Push (Arrays)

```typescript
// Add to array
await user.push("economy.inventory.custom.roles", "roleId");
await guild.push("utils.levels.ignore_channels", "channelId");

// MongoDB handles duplicates automatically
```

### Has

```typescript
// Check existence
if (await user.has("level.xp")) {
  const xp = await user.get("level.xp");
}

if (await guild.has("utils.levels.enabled")) {
  // Level system configured
}
```

### Delete

```typescript
// Delete field
await user.delete("custom.profile.bio");
await guild.delete("utils.join_to_create.channel");
```

## Cache System

### Temp Cache (User)

```typescript
const user = new User(client, discordUser, guild);

// Cache is automatically initialized
await user.cache.set("temp.voice_time", Date.now());
await user.cache.add("temp.voice_time", 60);

const voiceTime = await user.cache.get("temp.voice_time");
```

### Temp Cache (Guild)

```typescript
const guild = new Guild(client, discordGuild);

// Store temporary data
await guild.cache.set("temp.active_giveaways", new Map());
const giveaways = await guild.cache.get("temp.active_giveaways");
```

### Map Support

```typescript
// Maps are automatically handled
const map = new Map([["key1", "value1"], ["key2", "value2"]]);
await user.cache.set("temp.my_map", map);

// Retrieved as Map (not array)
const retrieved = await user.cache.get("temp.my_map");
retrieved.get("key1"); // "value1"
```

## Common Patterns

### Level Up System

```typescript
// Message XP gain
const xpGain = Math.floor(Math.random() * 4) + 2;
await user.add("level.xp", xpGain);
await user.add("level.total_xp", xpGain);
await user.add("level.message_count", 1);

// Check level up
const currentLevel = await user.get("level.level");
const currentXP = await user.get("level.xp");
const requiredXP = getNextLevelXP(currentLevel);

if (currentXP >= requiredXP) {
  await user.add("level.level", 1);
  await user.set("level.xp", 0);
  // Award level role, send message, etc.
}
```

### Voice Time Tracking

```typescript
// On voice join
await user.cache.set("temp.voice_time", Date.now());

// On voice leave
const joinTime = await user.cache.get("temp.voice_time");
if (joinTime) {
  const elapsed = Math.floor((Date.now() - joinTime) / 1000);
  await user.add("level.voice_time", elapsed);
  await user.cache.delete("temp.voice_time");
}
```

### Economy Operations

```typescript
// Work command
const workTimeout = await user.get("economy.timeout.work");
if (Date.now() < workTimeout) {
  // Still on cooldown
  return;
}

const earnings = Math.floor(Math.random() * 400) + 100;
await user.add("economy.balance.wallet", earnings);
await user.set("economy.timeout.work", Date.now() + 1800000); // 30 min
```

### Shop System

```typescript
// Buy role
const price = 1000;
const wallet = await user.get("economy.balance.wallet");

if (wallet < price) {
  return; // Not enough money
}

await user.sub("economy.balance.wallet", price);
await user.push("economy.inventory.custom.roles", roleId);
```

## Type Safety

### Literal Paths (Type-checked)

```typescript
// ✅ Type-safe - auto-completion works
const xp = await user.get("level.xp"); // number
const bio = await user.get("custom.profile.bio"); // string

// ❌ TypeScript error - invalid path
await user.get("invalid.path");
```

### Dynamic Paths

```typescript
// ✅ Works but no type checking
const path = `economy.timeout.${commandName}`;
await user.set(path, Date.now());
```

### Generic Return Types

```typescript
// Specify return type if needed
const data = await user.get<number>("level.xp");
const settings = await guild.get<{prefix: string}>("settings");
```

## Performance Tips

### Batch Reads (Parent Paths)

```typescript
// ❌ Bad - 3 queries
const xp = await user.get("level.xp");
const level = await user.get("level.level");
const totalXp = await user.get("level.total_xp");

// ✅ Good - 1 query
const levelData = await user.get("level");
const { xp, level, total_xp } = levelData;
```

### Use add() Instead of get/set

```typescript
// ❌ Bad - 2 operations
const xp = await user.get("level.xp");
await user.set("level.xp", xp + 50);

// ✅ Good - 1 operation
await user.add("level.xp", 50);
```

### Cache Frequently Accessed Data

```typescript
// Use temp cache for session data
const guildSettings = await guild.cache.get("temp.settings");
if (!guildSettings) {
  const settings = await guild.get("settings");
  await guild.cache.set("temp.settings", settings);
}
```

## Migration

### Check Current Storage

```typescript
// Level/economy data stored in MongoDB
await user.get("level.xp"); // MongoDB
await user.get("economy.balance.wallet"); // MongoDB

// Custom settings in PostgreSQL
await user.get("custom.profile.bio"); // PostgreSQL
await guild.get("settings.prefix"); // PostgreSQL
```

### Migrate Existing Data

```bash
# Backup databases
pg_dump amelia > backup.sql
mongodump --uri="mongodb://..." --out=./backup

# Run migration
npm run migrate:mongodb

# Verify
mongosh "mongodb://..."
use amelia_cache
db.user_data.findOne()
```

## Troubleshooting

### Data Not Persisting

```typescript
// ✅ Make sure to use await
await user.set("level.xp", 100); // Not user.set(...)

// ✅ Check MongoDB connection
import { MongoDBService } from "./database";
console.log(MongoDBService.isConnectedToMongoDB());
```

### Type Errors

```typescript
// Regenerate Prisma client
npm run prisma:generate

// Regenerate schema mappings
npm run generate:schema
```

### Performance Issues

```typescript
// Use parent paths to reduce queries
const level = await user.get("level"); // 1 query
// Instead of multiple get calls

// Check MongoDB indexes
db.user_data.getIndexes()
```

## Examples

### Complete Level System

```typescript
// events/guild/messageCreate.ts
const levelSettings = await guild.get("utils.levels");

if (!levelSettings.enabled) return;

const user = guild.getUser(message.author.id);
const xpGain = Math.floor(Math.random() * 4) + 2;

await user.add("level.xp", xpGain);
await user.add("level.total_xp", xpGain);
await user.add("level.message_count", 1);

const currentLevel = await user.get("level.level");
const currentXP = await user.get("level.xp");

if (currentXP >= getNextLevelXP(currentLevel)) {
  await user.add("level.level", 1);
  await user.set("level.xp", 0);
  
  // Send level up message
  message.channel.send(`GG! You reached level ${currentLevel + 1}!`);
}
```

### Complete Economy Command

```typescript
// slash/economy/work.ts
async execute(interaction) {
  const user = guild.getUser(interaction.user.id);
  const guildSettings = await guild.get("economy.work");
  
  if (!guildSettings.enabled) {
    return interaction.reply("Work disabled");
  }
  
  const timeout = await user.get("economy.timeout.work");
  const now = Date.now();
  
  if (now < timeout) {
    const remaining = Math.ceil((timeout - now) / 1000);
    return interaction.reply(`Wait ${remaining}s`);
  }
  
  const earnings = Math.floor(
    Math.random() * (guildSettings.max - guildSettings.min)
  ) + guildSettings.min;
  
  await user.add("economy.balance.wallet", earnings);
  await user.set("economy.timeout.work", now + (guildSettings.cooldown * 1000));
  
  interaction.reply(`You earned ${earnings}!`);
}
```

### Rank Command

```typescript
// slash/user/rank.ts
async execute(interaction) {
  const user = guild.getUser(interaction.user.id);
  
  // Single query for all level data
  const levelData = await user.get("level");
  
  const card = new RankCard({
    avatar: interaction.user.displayAvatarURL(),
    data: {
      level: levelData.level,
      xp: levelData.xp,
      total_xp: levelData.total_xp
    },
    displayOptions: await user.get("custom.rank")
  });
  
  const buffer = await card.build();
  interaction.reply({ files: [buffer] });
}
```

## API Reference

### User Methods
- `get(path)` - Get value by path
- `set(path, value)` - Set value by path
- `add(path, value)` - Add to numeric value
- `sub(path, value)` - Subtract from numeric value
- `push(path, value)` - Push to array
- `delete(path)` - Delete field
- `has(path)` - Check if exists
- `all()` - Get all PostgreSQL data

### Guild Methods
Same as User methods

### Cache Methods
- `get(path)` - Get cached value
- `set(path, value)` - Set cached value
- `add(path, value)` - Add to numeric
- `sub(path, value)` - Subtract from numeric
- `push(path, value)` - Push to array
- `delete(path)` - Delete cached value
- `has(path)` - Check if cached
- `clear()` - Clear all cache
- `all()` - Get all cache data

## Summary

**Storage:**
- Level/Economy → MongoDB (fast, scalable)
- Settings/Custom → PostgreSQL (relational, structured)
- Temp data → MongoDB with TTL (auto-cleanup)

**Key Points:**
- Always use `await` with database operations
- Use parent paths for batch reads
- Use `add()`/`sub()` instead of get/set for numbers
- MongoDB handles level/economy automatically
- PostgreSQL handles everything else
- Type-safe with literal paths
- Dynamic paths work but skip type checking

**Migration:**
- `npm run migrate:mongodb` - Migrate data
- Zero code changes needed
- Fully backward compatible
- Rollback available if needed

