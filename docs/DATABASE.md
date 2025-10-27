# Database Schema Management System

## Description

This system provides automatic database schema management through TypeScript interfaces and automatic generation of path-to-field mappings.

## Key Features

### ✨ Automatic Mapping Generation
- Path-to-database-field mappings are generated automatically
- Support for nested paths (dot-notation)
- Support for parent paths to retrieve groups of fields

### 🔍 Type-safe Data Access
- TypeScript types for all paths
- Automatic path validation at compile time
- Clear error messages

### 🎯 Convenient API
- Simple syntax for database operations
- Support for dynamic paths in JSON fields
- Methods add, sub, push for working with numbers and arrays

## File Structure

```
src/database/
├── schemas/           # NOT USED (deprecated files)
├── mappings/          # Auto-generated mappings
│   ├── GuildMapping.ts
│   └── UserMapping.ts
├── DBGuild.ts         # Class for working with Guild
├── DBUser.ts          # Class for working with User
└── DBHistory.ts       # Class for working with History

scripts/
└── generate-schema.ts # Mapping generation script
```

## Usage

### Getting Data

#### Getting a Single Field
```typescript
const db = new DBGuild(client, guild);

// Get prefix
const prefix = await db.get("settings.prefix");

// Get JTC status
const jtcEnabled = await db.get("utils.join_to_create.enabled");
```

#### Getting a Group of Fields (Parent Path)
```typescript
// Get ALL JTC settings in one query
const jtcSettings = await db.get("utils.join_to_create");
// Result: { enabled: boolean, channel: string | null, category: string | null, default_name: string }

// Get all user level data
const levelData = await dbUser.get("level");
// Result: { xp: number, total_xp: number, level: number, voice_time: number, message_count: number }
```

### Setting Data

```typescript
const db = new DBGuild(client, guild);

// Set prefix
await db.set("settings.prefix", "!");

// Enable JTC
await db.set("utils.join_to_create.enabled", true);

// Set JTC channel
await db.set("utils.join_to_create.channel", "1234567890");
```

### Working with Numbers

```typescript
const dbUser = new DBUser(client, user, guild);

// Add XP
await dbUser.add("level.xp", 100);

// Subtract money
await dbUser.sub("economy.balance.wallet", 50);
```

### Working with Arrays

```typescript
const db = new DBGuild(client, guild);

// Add channel to ignored list
await db.push("utils.levels.ignore_channels", "1234567890");
```

### Dynamic Paths in JSON Fields

```typescript
const db = new DBGuild(client, guild);

// Get permission for a specific command
const cmdPerm = await db.get("permissions.commands.ban");

// Set permission for command
await db.set("permissions.commands.ban", {
  name: "ban",
  roles: [{ id: "123", type: "allow" }],
  permission: null
});
```

## Adding New Fields

### Step 1: Update Prisma Schema

Edit `prisma/schema.prisma`:

```prisma
model Guild {
  // ...existing fields...
  
  // New field
  newFeatureEnabled Boolean @default(false)
}
```

### Step 2: Update Mapping in generate-schema.ts

Open `scripts/generate-schema.ts` and add the new field to `guildSchemaMap`:

```typescript
const guildSchemaMap: Record<string, SchemaField> = {
  // ...existing mappings...
  
  "utils.new_feature.enabled": {
    prismaField: "newFeatureEnabled",
    prismaType: "Boolean",
    default: "false",
  },
};
```

### Step 3: Generate Mappings

```bash
npm run generate:schema
```

### Step 4: Apply Prisma Migration

```bash
npm run prisma:migrate
```

### Step 5: Use the New Field

```typescript
const enabled = await db.get("utils.new_feature.enabled");
await db.set("utils.new_feature.enabled", true);
```

## Parent Paths

The system automatically detects parent paths. When you request a parent path, the system collects all child fields:

### Example 1: Guild JTC Settings
```typescript
// Path: "utils.join_to_create"
// Child paths:
// - "utils.join_to_create.enabled"
// - "utils.join_to_create.channel"
// - "utils.join_to_create.category"
// - "utils.join_to_create.default_name"

const jtc = await db.get("utils.join_to_create");
console.log(jtc);
// {
//   enabled: false,
//   channel: null,
//   category: null,
//   default_name: "%{VAR}% channel"
// }
```

### Example 2: User Level Data
```typescript
// Path: "level"
// Child paths:
// - "level.xp"
// - "level.total_xp"
// - "level.level"
// - "level.voice_time"
// - "level.message_count"

const level = await dbUser.get("level");
console.log(level);
// {
//   xp: 1500,
//   total_xp: 15000,
//   level: 5,
//   voice_time: 3600,
//   message_count: 250
// }
```

## API Reference

### DBGuild

```typescript
class DBGuild {
  // Get value by path
  async get<T>(path: T): Promise<PathValue<T>>
  
  // Set value by path
  async set<T>(path: T, value: PathValue<T>): Promise<void>
  
  // Add to number
  async add(path: string, value: number): Promise<void>
  
  // Subtract from number
  async sub(path: string, value: number): Promise<void>
  
  // Push to array
  async push(path: string, value: any): Promise<void>
  
  // Delete field
  async delete(path: string): Promise<void>
  
  // Check existence
  async has(path: string): Promise<boolean>
  
  // Get all data
  async all(): Promise<PrismaGuild>
  
  // History
  history: DBHistory
}
```

### DBUser

```typescript
class DBUser {
  // Get value by path
  async get<T>(path: T): Promise<UserPathValue<T>>
  
  // Set value by path
  async set<T>(path: T, value: UserPathValue<T>): Promise<void>
  
  // Add to number
  async add(path: string, value: number): Promise<void>
  
  // Subtract from number
  async sub(path: string, value: number): Promise<void>
  
  // Push to array
  async push(path: string, value: any): Promise<void>
  
  // Delete field
  async delete(path: string): Promise<void>
  
  // Check existence
  async has(path: string): Promise<boolean>
  
  // Get all data
  async all(): Promise<PrismaUser>
  
  // History
  history: DBHistory
}
```

## NPM Commands

```bash
# Generate mappings
npm run generate:schema

# Generate Prisma client
npm run prisma:generate

# Create migration
npm run prisma:migrate

# Apply migrations (production)
npm run prisma:deploy

# Open Prisma Studio
npm run prisma:studio

# Build project
npm run build

# Run project
npm start
```

## Notes

1. **DO NOT edit** files in `src/database/mappings/` manually - they are auto-generated
2. Always run `npm run generate:schema` after changing mappings in `scripts/generate-schema.ts`
3. After changing Prisma schema, run `npm run prisma:generate` and `npm run prisma:migrate`
4. Use parent paths to get groups of fields in one query (more efficient)

## Troubleshooting

### "Unknown path" Error
If you get `Unknown guild path` or `Unknown user path` error:
1. Check that the path is added to `scripts/generate-schema.ts`
2. Run `npm run generate:schema`
3. Rebuild the project: `npm run build`

### Field doesn't exist in DB
If Prisma complains about a non-existent field:
1. Check that the field is added to `prisma/schema.prisma`
2. Run `npm run prisma:generate`
3. Create and apply migration: `npm run prisma:migrate`

