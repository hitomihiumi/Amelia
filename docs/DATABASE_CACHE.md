# Cache Layer Documentation

## Overview

The cache system provides a two-tier architecture:

1. **MongoDB TempCache** - Temporary data storage (session-specific, auto-expiring)
2. **Guild/User Cache Wrappers** - Type-safe interface for cache operations

```
┌─────────────────────────────┐
│ Guild.cache / User.cache    │  Wrapper API
│ (Cache<T, K>)              │  Type-safe interface
└────────────┬────────────────┘
             │
┌────────────▼────────────────┐
│ TempCache<PathMap>          │  Implementation
│ (MongoDB wrapper)           │  Path mapping
└────────────┬────────────────┘
             │
┌────────────▼────────────────┐
│ MongoDB Collection          │  Storage
└─────────────────────────────┘
```

## TempCache Class

### Purpose

Stores temporary, session-specific data in MongoDB. Ideal for:
- Voice channel join times
- Cooldown tracking
- Session-specific state
- Rate limiting counters
- Temporary user preferences

### Key Differences from DB Operations

| Feature | TempCache | DBGuild/DBUser |
|---------|-----------|-----------------|
| Storage | MongoDB | PostgreSQL |
| Persistence | Temporary | Permanent |
| Speed | Very fast | Standard |
| Type Safety | Path-mapped | Full with types |
| Use Case | Session data | Core data |
| Auto-expire | Yes (TTL) | No |

### Basic Operations

```typescript
import { TempCache } from "../database";
import { UserPathMap } from "../database/mappings/UserMapping";

// Create instance
const cache = new TempCache<typeof UserPathMap>("user_temp", "userId:guildId", UserPathMap);

// Get value
const voiceTime = await cache.get("temp.voice_time");

// Set value
await cache.set("temp.voice_time", Date.now());

// Add to number
await cache.add("temp.xp_multiplier", 1.5);

// Push to array
await cache.push("temp.ignored_users", "userId");

// Delete field
await cache.delete("temp.voice_time");

// Check existence
const exists = await cache.has("temp.voice_time");

// Get all data
const allTemp = await cache.all();

// Clear all
await cache.clear();
```

## Cache Generic Class

### Type-Safe Wrapper

Provides compile-time type checking for cache operations:

```typescript
import { Cache } from "../helpers";
import { UserCache, UserCacheKey } from "../types/helpers";

// Create cache instance
const cache = new Cache<UserCache, UserCacheKey>("user_temp", "userId:guildId", UserPathMap);

// Type-safe get
const voiceTime = await cache.get("temp.voice_time");
// TypeScript knows this is number | null

// Type-safe set
await cache.set("temp.voice_time", Date.now());
// Error if type doesn't match! ✅

// Error - type mismatch caught at compile time
await cache.set("temp.voice_time", "not a number"); // ❌ Type error
```

## Guild Cache Usage

### Getting Cached Data

```typescript
import { Guild } from "../helpers";

const guild = new Guild(client, discordGuild);

// Get guild cache
const settings = await guild.cache.get("temp.level_settings");

// Get all cache
const allCache = await guild.cache.all();
```

### Setting Cached Data

```typescript
// Cache guild settings
const levelSettings = await guild.get("utils.levels");
await guild.cache.set("temp.level_settings", levelSettings);

// Cache permissions
const permissions = await guild.get("permissions");
await guild.cache.set("temp.permissions", permissions);
```

### Cache Lifetime Pattern

```typescript
import { Guild } from "../helpers";

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

async function getLevelSettings(guild: Guild) {
  const cacheKey = "temp.level_settings";
  
  // Try to get from cache
  const cached = await guild.cache.get(cacheKey);
  if (cached) {
    return cached;
  }
  
  // Not in cache, get from DB
  const fresh = await guild.get("utils.levels");
  
  // Cache it (TTL handled by MongoDB)
  await guild.cache.set(cacheKey, fresh);
  
  return fresh;
}
```

## User Cache Usage

### Voice Time Tracking

```typescript
import { Guild } from "../helpers";

const guild = new Guild(client, discordGuild);
const user = guild.getUser(userId);

// When user joins voice channel
await user.cache.set("temp.voice_time", Date.now());

// When user leaves voice channel
const voiceTime = await user.cache.get("temp.voice_time");

if (voiceTime) {
  const duration = Date.now() - voiceTime;
  const xp = Math.floor(duration / 1000 / 60); // XP per minute
  
  await user.add("level.xp", xp);
  await user.add("level.voice_time", duration);
  await user.cache.delete("temp.voice_time");
}
```

### Cooldown Management

```typescript
async function checkCooldown(user: User, commandName: string, cooldownMs: number): Promise<boolean> {
  const cooldownKey = `temp.cooldown.${commandName}`;
  const lastUsed = await user.cache.get(cooldownKey);
  
  if (lastUsed && Date.now() - lastUsed < cooldownMs) {
    return false; // Still on cooldown
  }
  
  // Update cooldown
  await user.cache.set(cooldownKey, Date.now());
  return true; // Can use command
}
```

### Session-Specific State

```typescript
async function trackUserAction(user: User, action: string) {
  const actionsKey = "temp.session_actions";
  let actions = await user.cache.get(actionsKey) || [];
  
  actions.push({
    action,
    timestamp: Date.now()
  });
  
  await user.cache.set(actionsKey, actions);
  
  // Auto-expire after session ends or TTL
}
```

## MongoDB Connection

### Configuration

```env
# .env file
MONGODB_URL="mongodb://user:password@localhost:27017/amelia"
```

### Connection Management

```typescript
import { mongoDBClient } from "../database/mongodb";

// Connection is automatic on first use
// mongoDBClient() returns connected client

// Collections are auto-created on first write
// TTL indexes are created in TempCache
```

### Data Structure

MongoDB stores data as:
```json
{
  "_id": "user_temp:userId:guildId",
  "namespace": "user_temp",
  "identifier": "userId:guildId",
  "data": {
    "temp": {
      "voice_time": 1234567890,
      "cooldown": {
        "ban": 1234567890
      }
    }
  },
  "createdAt": "2025-11-27T10:00:00Z",
  "updatedAt": "2025-11-27T10:05:00Z",
  "expiresAt": "2025-11-27T10:10:00Z"  // TTL field
}
```

### TTL Expiration

All temporary cache data automatically expires after MongoDB TTL:

```typescript
// Default TTL: 1 hour (3600 seconds)
// Configured in TempCache class
// Database indexes handle automatic cleanup
```

## Performance Characteristics

### Speed Comparison

| Operation | PostgreSQL | MongoDB | Speedup |
|-----------|-----------|---------|---------|
| Get | 10-50ms | 1-10ms | 5-10x ✨ |
| Set | 15-50ms | 5-15ms | 3-10x ✨ |
| Delete | 15-50ms | 5-15ms | 3-10x ✨ |
| Batch Get | 50-100ms | 10-30ms | 5-10x ✨ |

### When to Use Cache

✅ **Use MongoDB Cache for:**
- Session-specific data (voice time, cooldowns)
- Frequently accessed temporary data
- Data that should auto-expire
- High-frequency read/write patterns
- Non-critical temporary state

❌ **Use PostgreSQL DB for:**
- Permanent user data (levels, economy)
- Guild settings
- Data that needs transactions
- Audit-critical information
- Data requiring backups

## Advanced Patterns

### Distributed Cache

When running multiple bot shards:

```typescript
// Cache is shared across all shards via MongoDB
// All shards can safely access the same cache

// Shard 1
await user.cache.set("temp.action", "processing");

// Shard 2 (can access the same data)
const action = await user.cache.get("temp.action");
```

### Cache Invalidation

```typescript
async function updateUserAndInvalidateCache(user: User, updateData: any) {
  // Update database
  await Promise.all(
    Object.entries(updateData).map(([key, value]) =>
      user.set(key, value)
    )
  );
  
  // Invalidate related cache
  await user.cache.delete("temp.level_data");
  await user.cache.delete("temp.user_profile");
}
```

### Cache Warming

```typescript
async function warmCache(guild: Guild) {
  const [levelSettings, permissions, jtcSettings] = await Promise.all([
    guild.get("utils.levels"),
    guild.get("permissions"),
    guild.get("utils.join_to_create")
  ]);
  
  await Promise.all([
    guild.cache.set("temp.level_settings", levelSettings),
    guild.cache.set("temp.permissions", permissions),
    guild.cache.set("temp.jtc_settings", jtcSettings)
  ]);
}
```

### Conditional Cache Update

```typescript
async function setCacheIfChanged(user: User, key: string, newValue: any) {
  const oldValue = await user.cache.get(key);
  
  if (oldValue !== newValue) {
    await user.cache.set(key, newValue);
    return true; // Changed
  }
  
  return false; // No change
}
```

## Troubleshooting

### MongoDB Connection Issues

```typescript
// Error: Cannot connect to MongoDB
// Solution: Check MONGODB_URL in .env

// Error: Connection timeout
// Solution: Verify MongoDB is running and accessible

// Error: TTL indexes not created
// Solution: TempCache creates them automatically on first write
```

### Cache Inconsistency

```typescript
// Problem: Cache has stale data
// Solution: Delete and refresh

await user.cache.delete("temp.level_data");
const fresh = await user.get("level");
await user.cache.set("temp.level_data", fresh);
```

### Memory Issues

```typescript
// Problem: MongoDB uses too much memory
// Solution: 
// 1. Clear expired data manually
await mongoDBClient().collection("cache").deleteMany({
  expiresAt: { $lt: new Date() }
});

// 2. Set shorter TTL in TempCache
// 3. Clear cache periodically with cron job
```

## Best Practices

1. ✅ Use cache for temporary session data only
2. ✅ Always check cache before DB for performance
3. ✅ Implement cache expiration strategy
4. ✅ Invalidate cache when updating main DB
5. ✅ Use parallel operations with Promise.all()

6. ❌ Don't store permanent data in cache
7. ❌ Don't rely on cache for critical operations
8. ❌ Don't forget to handle cache misses
9. ❌ Don't use cache for large data objects
10. ❌ Don't mix cache and DB without invalidation

---

**Last Updated**: November 27, 2025
**Version**: 2.0

