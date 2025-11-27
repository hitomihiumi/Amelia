# Path Mapping System

## Overview

The path mapping system translates human-readable paths to Prisma database fields. It's a crucial part of the type-safe database access layer.

```
"utils.join_to_create.enabled"  ──>  Prisma Field: "jtcEnabled"
                                  ──>  Type: Boolean
                                  ──>  Default: false
```

## How Mappings Work

### Path Components

A path consists of three components:

```
"utils.join_to_create.enabled"
 │     │                │
 │     │                └── Field name
 │     └───────────────────── Group/Category
 └────────────────────────── Section
```

### Mapping Storage

Mappings are defined in `scripts/generate-schema.ts`:

```typescript
const guildSchemaMap: Record<string, SchemaField> = {
  "utils.join_to_create.enabled": {
    prismaField: "jtcEnabled",        // Actual Prisma field
    prismaType: "Boolean",             // Prisma field type
    default: "false",                  // Default value
    description: "JTC enabled status"  // Documentation
  }
};
```

### Generated Mappings

After running `npm run generate:schema`, the mappings are generated:

**In `src/database/mappings/GuildMapping.ts`:**
```typescript
export const GuildPathMap = {
  "utils.join_to_create.enabled": "jtcEnabled",
  "utils.join_to_create.channel": "jtcChannel",
  // ... more mappings
};

export type GuildCacheKey = keyof typeof GuildPathMap;
```

**In `src/types/helpers/SchemaKeys.ts`:**
```typescript
export type GuildSchemaKey = 
  | "utils.join_to_create.enabled"
  | "utils.join_to_create.channel"
  | // ... all other paths
  | "settings.prefix";

export interface GuildSchema {
  "utils.join_to_create.enabled": boolean;
  "utils.join_to_create.channel": string | null;
  // ... more fields
  "settings.prefix": string;
}
```

## Types of Paths

### 1. Leaf Paths (Single Fields)

Access individual database fields:

```typescript
// Get single field
const prefix = await guild.get("settings.prefix");
// Type: string

// Set single field
await guild.set("settings.prefix", "!");

// Check existence
const exists = await guild.has("settings.prefix");
```

### 2. Parent Paths (Field Groups)

Access multiple related fields at once:

```typescript
// Get all JTC-related fields
const jtc = await guild.get("utils.join_to_create");
// Type: { enabled: boolean; channel: string | null; category: string | null; default_name: string }

// Set all at once
await guild.set("utils.join_to_create", {
  enabled: true,
  channel: "123",
  category: "456",
  default_name: "new name"
});
```

### 3. Dynamic Paths (Custom Objects)

Access dynamic JSON fields:

```typescript
// Get permission for specific command
const banPerm = await guild.get("permissions.commands.ban");
// Type: any (Prisma JSON type)

// Set permission
await guild.set("permissions.commands.ban", {
  name: "ban",
  roles: [{ id: "123", type: "allow" }]
});
```

## Guild Mapping Reference

### Settings Section

```typescript
"settings.prefix"           → jtcPrefix           (string)
"settings.language"        → language            (string) [optional]
```

### Utils - Join to Create

```typescript
"utils.join_to_create.enabled"      → jtcEnabled      (boolean)
"utils.join_to_create.channel"      → jtcChannel      (string | null)
"utils.join_to_create.category"     → jtcCategory     (string | null)
"utils.join_to_create.default_name" → jtcDefaultName  (string)
```

### Utils - Levels

```typescript
"utils.levels.enabled"          → levelsEnabled        (boolean)
"utils.levels.ignore_channels"  → levelsIgnoreChannels (string[])
"utils.levels.voice_xp_enabled" → voiceXpEnabled       (boolean)
"utils.levels.message_xp"       → messageXp            (number)
```

### Utils - Custom

```typescript
"utils.custom.join_message"     → customJoinMessage    (string | null)
"utils.custom.leave_message"    → customLeaveMessage   (string | null)
```

### Permissions

```typescript
"permissions.commands"          → permissions.commands  (JSON)
"permissions.roles"             → permissions.roles     (JSON)
```

## User Mapping Reference

### Level System

```typescript
"level.xp"              → xp           (number)
"level.total_xp"        → totalXp      (number)
"level.level"           → level        (number)
"level.voice_time"      → voiceTime    (number)
"level.message_count"   → messageCount (number)
```

### Economy

```typescript
"economy.balance.wallet" → walletBalance (number)
"economy.balance.bank"   → bankBalance   (number)
"economy.daily_streak"   → dailyStreak   (number)
```

### Ranking

```typescript
"rank.user_rank"        → userRank       (number)
"rank.weekly_rank"      → weeklyRank     (number)
```

### Custom User Data

```typescript
"custom.field_name"     → custom.field_name  (JSON)
```

## Cache Mapping Reference

### Guild Cache

```typescript
"temp.level_settings"       → Cached level settings
"temp.permissions"          → Cached permissions
"temp.voice_check"          → Voice activity check
```

### User Cache

```typescript
"temp.voice_time"           → Voice channel join time
"temp.last_message"         → Last message timestamp
"temp.cooldown.command"     → Command cooldown
"temp.session_data"         → Session-specific data
```

## Mapping Generation Process

### Input: Schema Map

```typescript
// In scripts/generate-schema.ts
const guildSchemaMap = {
  "settings.prefix": {
    prismaField: "prefix",
    prismaType: "String",
    default: '"!"'
  },
  "utils.join_to_create.enabled": {
    prismaField: "jtcEnabled",
    prismaType: "Boolean",
    default: "false"
  }
};
```

### Processing

The generator:
1. **Creates Path Map** - Maps paths to Prisma fields
2. **Generates Types** - Creates TypeScript interfaces
3. **Detects Parents** - Identifies parent paths automatically
4. **Validates Schema** - Checks schema validity

### Output Files

```typescript
// 1. Path → Field mapping
export const GuildPathMap = {
  "settings.prefix": "prefix",
  "utils.join_to_create.enabled": "jtcEnabled"
};

// 2. Type definitions
export interface GuildSchema {
  "settings.prefix": string;
  "utils.join_to_create.enabled": boolean;
}

// 3. Path validators
export type GuildSchemaKey = 
  | "settings.prefix"
  | "utils.join_to_create.enabled";
```

## Adding New Paths

### Step 1: Update Schema Map

In `scripts/generate-schema.ts`:

```typescript
const guildSchemaMap: Record<string, SchemaField> = {
  // Existing...
  
  // New path
  "utils.my_feature.enabled": {
    prismaField: "myFeatureEnabled",
    prismaType: "Boolean",
    default: "false",
    description: "My feature toggle"
  }
};
```

### Step 2: Update Prisma Schema

In `prisma/schema.prisma`:

```prisma
model Guild {
  // ... existing fields
  
  myFeatureEnabled Boolean @default(false)
}
```

### Step 3: Generate

```bash
npm run generate:schema
```

This creates:
- ✅ Path mapping entry
- ✅ TypeScript type
- ✅ Runtime validation

### Step 4: Migrate

```bash
npm run prisma:migrate -- --name add_my_feature_enabled
```

### Step 5: Use

```typescript
const enabled = await guild.get("utils.my_feature.enabled");
await guild.set("utils.my_feature.enabled", true);
```

## Parent Path Detection

### How It Works

Parent paths are automatically detected when multiple child paths share a prefix:

```typescript
// These child paths:
"utils.join_to_create.enabled"
"utils.join_to_create.channel"
"utils.join_to_create.category"
"utils.join_to_create.default_name"

// Automatically create parent path:
"utils.join_to_create"
```

### Manual Parent Path Definition

You can also explicitly define parent paths:

```typescript
const parentPaths: Record<string, string[]> = {
  "utils.join_to_create": [
    "enabled",
    "channel",
    "category",
    "default_name"
  ]
};
```

### Using Parent Paths

```typescript
// Get all children
const jtc = await guild.get("utils.join_to_create");
console.log(jtc);
// {
//   enabled: false,
//   channel: null,
//   category: null,
//   default_name: "%{VAR}% channel"
// }

// Set all children
await guild.set("utils.join_to_create", {
  enabled: true,
  channel: "123",
  category: "456",
  default_name: "New"
});

// Query only some children
const partial = await guild.get("utils.join_to_create");
if (partial.enabled) {
  // Process enabled JTC
}
```

## Path Validation

### Compile-Time Validation

TypeScript catches invalid paths:

```typescript
// ✅ Valid path - no error
const prefix = await guild.get("settings.prefix");

// ❌ Invalid path - TypeScript error!
const invalid = await guild.get("settings.nonexistent");
//                                ^^^^^^^^^^^^^^^^^^^^^^
// Error: Argument of type '"settings.nonexistent"' is not assignable to...
```

### Runtime Validation

When using dynamic paths:

```typescript
const pathString = userInput;
const value = await guild.get(pathString as any);

// Still safe - TempCache validates path structure
// Returns null or throws if path is invalid
```

## Performance Considerations

### Query Optimization

**Use parent paths:**
```typescript
// ❌ Bad - 4 separate queries
const enabled = await guild.get("utils.join_to_create.enabled");
const channel = await guild.get("utils.join_to_create.channel");
const category = await guild.get("utils.join_to_create.category");
const name = await guild.get("utils.join_to_create.default_name");

// ✅ Good - 1 query
const jtc = await guild.get("utils.join_to_create");
const { enabled, channel, category, default_name: name } = jtc;
```

### Caching Strategy

```typescript
// Cache frequently accessed related fields
const settings = await guild.get("utils.levels");
await guild.cache.set("temp.level_settings", settings);

// Use cache for repeated access
const cached = await guild.cache.get("temp.level_settings");
if (!cached) {
  const fresh = await guild.get("utils.levels");
  await guild.cache.set("temp.level_settings", fresh);
}
```

## Troubleshooting

### "Unknown path" Error

```
Error: Unknown guild path: settings.nonexistent
```

**Solution:**
1. Check path spelling
2. Verify path exists in `guildSchemaMap`
3. Run `npm run generate:schema`
4. Rebuild: `npm run build`

### Type Mismatch

```
Error: Type 'string' is not assignable to type 'boolean'
```

**Solution:**
1. Check path type in mapping
2. Use correct value type
3. Check Prisma schema field type

### Parent Path Not Working

```
const data = await guild.get("utils.join_to_create");
// Returns undefined
```

**Solution:**
1. Ensure all child paths are in mapping
2. Rebuild type cache
3. Check path exists in schema

## Best Practices

1. ✅ Use literal paths for type safety
2. ✅ Use parent paths for batches
3. ✅ Document custom paths
4. ✅ Keep mapping organized
5. ✅ Use descriptive path names

6. ❌ Don't modify generated files manually
7. ❌ Don't use invalid paths
8. ❌ Don't bypass type system with `any`
9. ❌ Don't forget to regenerate after changes
10. ❌ Don't mix path naming conventions

---

**Last Updated**: November 27, 2025
**Version**: 2.0

