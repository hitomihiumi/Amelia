# Database API Reference

Complete API documentation for all database classes and methods.

## Guild Class

### Constructor
```typescript
new Guild(client: Client, guild: Guild as DiscordGuild): Guild
```

Creates a Guild wrapper instance.

**Parameters:**
- `client` - Discord.js Client instance
- `guild` - Discord.js Guild instance

**Example:**
```typescript
import { Guild } from "../helpers";
const guild = new Guild(client, discordGuild);
```

---

### Properties

#### `guild`
```typescript
guild: DiscordGuild
```
The underlying Discord.js Guild object.

#### `client`
```typescript
client: Client
```
The Discord.js Client instance.

#### `cache`
```typescript
cache: Cache<GuildCache, GuildCacheKey>
```
MongoDB cache for temporary data.

---

### Methods

#### `get<K extends LiteralGuildSchemaKey>(path: K): Promise<GetSchemaValueType<GuildSchema, K>>`

Get a value by path with full type safety.

**Parameters:**
- `path` - Type-safe path to the field

**Returns:** Promise resolving to the field value with correct type

**Examples:**
```typescript
// Single field - type is string
const prefix = await guild.get("settings.prefix");

// Parent path - type is object with all children
const jtc = await guild.get("utils.join_to_create");
// Type: { enabled: boolean; channel: string | null; ... }
```

#### `get(path: string): Promise<any>`

Get a value using dynamic path (less type safety).

**Parameters:**
- `path` - String path to field

**Returns:** Promise resolving to any value

**Examples:**
```typescript
const pathFromUser = userInput;
const value = await guild.get(pathFromUser);
```

---

#### `set<K extends LiteralGuildSchemaKey>(path: K, value: GetSchemaValueType<GuildSchema, K>): Promise<void>`

Set a value with type checking.

**Parameters:**
- `path` - Type-safe path to field
- `value` - Value with correct type

**Returns:** Promise that resolves when complete

**Examples:**
```typescript
// Set single field
await guild.set("settings.prefix", "!");

// Set parent path (all children)
await guild.set("utils.join_to_create", {
  enabled: true,
  channel: "123",
  category: "456",
  default_name: "New Channel"
});
```

#### `set(path: string, value: any): Promise<void>`

Set using dynamic path.

**Parameters:**
- `path` - String path
- `value` - Any value

**Returns:** Promise that resolves when complete

---

#### `add(path: string, value: number): Promise<void>`

Add to a numeric field (only for paths with number type).

**Parameters:**
- `path` - Path to numeric field
- `value` - Number to add

**Returns:** Promise that resolves when complete

**Examples:**
```typescript
// Add to numeric field
await guild.add("some.numeric.field", 100);

// Only works with numbers
// This will error if path is not numeric
```

---

#### `sub(path: string, value: number): Promise<void>`

Subtract from a numeric field.

**Parameters:**
- `path` - Path to numeric field
- `value` - Number to subtract

**Returns:** Promise that resolves when complete

**Examples:**
```typescript
// Subtract from numeric field
await guild.sub("some.numeric.field", 50);
```

---

#### `push(path: string, value: any): Promise<void>`

Push item to array field.

**Parameters:**
- `path` - Path to array field
- `value` - Item to push

**Returns:** Promise that resolves when complete

**Examples:**
```typescript
// Add channel to ignore list
await guild.push("utils.levels.ignore_channels", "channel_id");
```

---

#### `delete(path: string): Promise<void>`

Delete a field.

**Parameters:**
- `path` - Path to field

**Returns:** Promise that resolves when complete

**Examples:**
```typescript
await guild.delete("some.field");
```

---

#### `has(path: string): Promise<boolean>`

Check if a field exists.

**Parameters:**
- `path` - Path to check

**Returns:** Promise resolving to boolean

**Examples:**
```typescript
const exists = await guild.has("settings.prefix");
if (exists) {
  const value = await guild.get("settings.prefix");
}
```

---

#### `all(): Promise<PrismaGuild | null>`

Get all guild data.

**Returns:** Promise resolving to full Prisma Guild object

**Examples:**
```typescript
const allData = await guild.all();
console.log(allData.prefix, allData.jtcEnabled);
```

---

#### `getUser(userId: string): User`

Get User wrapper for a specific user in this guild.

**Parameters:**
- `userId` - Discord user ID

**Returns:** User instance

**Examples:**
```typescript
const user = guild.getUser("991777093312585808");
const level = await user.get("level.level");
```

---

## User Class

### Constructor
```typescript
new User(
  client: Client,
  user: User as DiscordUser,
  guild: Guild as DiscordGuild
): User
```

Creates a User wrapper instance.

**Parameters:**
- `client` - Discord.js Client instance
- `user` - Discord.js User instance
- `guild` - Discord.js Guild instance

**Example:**
```typescript
import { User } from "../helpers";
const user = new User(client, discordUser, discordGuild);
```

---

### Properties

#### `user`
```typescript
user: DiscordUser
```
The underlying Discord.js User object.

#### `guild`
```typescript
guild: Guild
```
The Discord.js Guild object.

#### `client`
```typescript
client: Client
```
The Discord.js Client instance.

#### `cache`
```typescript
cache: Cache<UserCache, UserCacheKey>
```
MongoDB cache for temporary data.

#### `history`
```typescript
history: DBHistory
```
History tracking for user data changes.

---

### Methods

All methods are identical to Guild class, but operate on user data:

#### `get<K extends LiteralUserSchemaKey>(path: K): Promise<GetSchemaValueType<UserSchema, K>>`

Get user data by path.

**Examples:**
```typescript
const level = await user.get("level.level");
const levelData = await user.get("level");
const xp = await user.get("level.xp");
```

---

#### `set<K extends LiteralUserSchemaKey>(path: K, value: GetSchemaValueType<UserSchema, K>): Promise<void>`

Set user data.

**Examples:**
```typescript
await user.set("level.level", 10);
await user.set("level", {
  xp: 1500,
  total_xp: 15000,
  level: 5,
  voice_time: 3600000,
  message_count: 250
});
```

---

#### `add(path: string, value: number): Promise<void>`

Add to user numeric field.

**Examples:**
```typescript
await user.add("level.xp", 100);
await user.add("economy.balance.wallet", 50);
```

---

#### `sub(path: string, value: number): Promise<void>`

Subtract from user numeric field.

**Examples:**
```typescript
await user.sub("economy.balance.wallet", 50);
```

---

#### `push(path: string, value: any): Promise<void>`

Push to user array field.

**Examples:**
```typescript
await user.push("custom.array_field", "item");
```

---

#### `delete(path: string): Promise<void>`

Delete user field.

**Examples:**
```typescript
await user.delete("custom.field");
```

---

#### `has(path: string): Promise<boolean>`

Check if user field exists.

**Examples:**
```typescript
const hasLevel = await user.has("level.level");
```

---

#### `all(): Promise<PrismaUser | null>`

Get all user data.

**Returns:** Full Prisma User object

**Examples:**
```typescript
const allData = await user.all();
console.log(allData.xp, allData.level);
```

---

## Cache Class

Generic cache wrapper with type safety.

### Constructor
```typescript
new Cache<TSchema, TKey extends string = string>(
  namespace: string,
  identifier: string,
  pathMap: PathMap
): Cache<TSchema, TKey>
```

**Parameters:**
- `namespace` - Cache namespace (e.g., "guild_temp", "user_temp")
- `identifier` - Unique identifier (e.g., guildId, "userId:guildId")
- `pathMap` - Path mapping object

**Note:** Usually created automatically by Guild/User classes.

---

### Methods

#### `get<K extends LiteralSchemaKey<TSchema>>(path: K): Promise<GetSchemaValueType<TSchema, K>>`

Get cache value with type safety.

**Returns:** Promise resolving to cached value or null

**Examples:**
```typescript
const voiceTime = await user.cache.get("temp.voice_time");
// Type: number | null
```

---

#### `set<K extends LiteralSchemaKey<TSchema>>(path: K, value: GetSchemaValueType<TSchema, K>): Promise<void>`

Set cache value with type checking.

**Examples:**
```typescript
await user.cache.set("temp.voice_time", Date.now());
```

---

#### `add(path: string, value: number): Promise<void>`

Add to numeric cache field.

**Examples:**
```typescript
await user.cache.add("temp.xp_bonus", 1.5);
```

---

#### `sub(path: string, value: number): Promise<void>`

Subtract from numeric cache field.

**Examples:**
```typescript
await user.cache.sub("temp.xp_bonus", 0.5);
```

---

#### `push(path: string, value: any): Promise<void>`

Push to cache array field.

**Examples:**
```typescript
await user.cache.push("temp.actions", { action: "ban", timestamp: Date.now() });
```

---

#### `delete(path: string): Promise<void>`

Delete cache field.

**Examples:**
```typescript
await user.cache.delete("temp.voice_time");
```

---

#### `has(path: string): Promise<boolean>`

Check if cache field exists.

**Examples:**
```typescript
const exists = await user.cache.has("temp.voice_time");
```

---

#### `all(): Promise<Record<string, any> | null>`

Get all cache data.

**Returns:** All cache object or null if empty

**Examples:**
```typescript
const allCache = await user.cache.all();
```

---

#### `clear(): Promise<void>`

Clear all cache data.

**Examples:**
```typescript
await user.cache.clear();
```

---

## Type Definitions

### Path Types

```typescript
// Guild paths with compile-time checking
type GuildSchemaKey = 
  | "settings.prefix"
  | "utils.join_to_create.enabled"
  | "utils.join_to_create.channel"
  // ... all valid guild paths

// User paths
type UserSchemaKey =
  | "level.xp"
  | "level.level"
  | "economy.balance.wallet"
  // ... all valid user paths

// Cache paths
type GuildCacheKey =
  | "temp.level_settings"
  | "temp.permissions"
  // ... all valid guild cache paths

type UserCacheKey =
  | "temp.voice_time"
  | "temp.cooldown.ban"
  // ... all valid user cache paths
```

### Schema Types

```typescript
// Guild schema definition
interface GuildSchema {
  "settings.prefix": string;
  "utils.join_to_create.enabled": boolean;
  "utils.join_to_create.channel": string | null;
  "utils.join_to_create.category": string | null;
  "utils.join_to_create.default_name": string;
  // ... all other fields
}

// User schema definition
interface UserSchema {
  "level.xp": number;
  "level.total_xp": number;
  "level.level": number;
  "level.voice_time": number;
  "level.message_count": number;
  // ... all other fields
}
```

### Return Type Inference

```typescript
// Automatic type inference based on path
type ReturnType<K extends SchemaKey> = Schema[K]

// Examples:
// get("settings.prefix") → string
// get("level.xp") → number
// get("utils.join_to_create") → { enabled: boolean; channel: string | null; ... }
```

---

## Error Types

### Validation Errors

```typescript
// Path doesn't exist
Error: Unknown guild path: settings.invalid
Error: Unknown user path: invalid.path

// Type mismatch
Error: Type 'string' is not assignable to type 'number'
Error: Argument of type '...' is not assignable to type 'boolean'
```

### Database Errors

```typescript
// Field not in Prisma schema
PrismaClientValidationError: Unknown field 'invalidField' for select

// Connection error
Error: Could not connect to database
Error: Error connecting to database server

// Migration issues
Error: Migration engine error: database is locked
```

### Cache Errors

```typescript
// MongoDB connection issue
MongooseError: Cannot connect to database
Error: connect ECONNREFUSED 127.0.0.1:27017

// Cache operation failed
Error: Cache operation timed out
```

---

## Usage Examples

### Example 1: Simple Get/Set

```typescript
// Get prefix
const prefix = await guild.get("settings.prefix");
console.log(`Current prefix: ${prefix}`);

// Set prefix
await guild.set("settings.prefix", "?");
```

### Example 2: Numeric Operations

```typescript
// Add XP
await user.add("level.xp", 100);

// Subtract money
await user.sub("economy.balance.wallet", 50);

// Check level
const level = await user.get("level.level");
console.log(`User level: ${level}`);
```

### Example 3: Parent Paths

```typescript
// Get all level data at once
const levelData = await user.get("level");

// Destructure
const { xp, level, total_xp } = levelData;

// Use it
console.log(`Level ${level}: ${xp}/${getNextLevelXP(level)} XP`);
```

### Example 4: Cache Operations

```typescript
// Store voice time
await user.cache.set("temp.voice_time", Date.now());

// Later, retrieve and calculate
const startTime = await user.cache.get("temp.voice_time");
if (startTime) {
  const duration = Date.now() - startTime;
  console.log(`Voice time: ${duration}ms`);
}

// Clear after use
await user.cache.delete("temp.voice_time");
```

### Example 5: Parallel Operations

```typescript
// Get multiple values efficiently
const [prefix, levels, jtc] = await Promise.all([
  guild.get("settings.prefix"),
  guild.get("utils.levels"),
  guild.get("utils.join_to_create")
]);

// Update multiple values efficiently
await Promise.all([
  user.add("level.xp", 100),
  user.add("level.voice_time", 60000),
  user.cache.set("temp.updated", Date.now())
]);
```

### Example 6: Error Handling

```typescript
try {
  const data = await user.get("level.xp");
  console.log(`User XP: ${data}`);
} catch (error) {
  if (error.message.includes("Unknown user path")) {
    console.error("Path doesn't exist");
  } else if (error.message.includes("database")) {
    console.error("Database error");
  } else {
    console.error("Unexpected error:", error);
  }
}
```

---

## Best Practices

### ✅ DO

- Use type-safe literal paths
- Always await async operations
- Use parent paths for batches
- Cache frequently accessed data
- Use Promise.all() for parallel operations
- Handle errors appropriately

### ❌ DON'T

- Don't use DBGuild/DBUser directly
- Don't forget to await
- Don't make sequential queries for related fields
- Don't bypass type system with `any`
- Don't rely on cache for critical data
- Don't modify generated mapping files

---

**Last Updated**: November 27, 2025
**Version**: 2.0

