# Database Development Guide

## Adding New Fields

### Step 1: Update Prisma Schema

Edit `prisma/schema.prisma` and add your new field:

```prisma
model Guild {
  id String @id
  
  // Existing fields...
  jtcEnabled Boolean @default(false)
  
  // New field
  customField String @default("")
  
  @@map("guilds")
}
```

### Step 2: Add Field to Mapping

Edit `scripts/generate-schema.ts` and add the field to the schema map:

```typescript
const guildSchemaMap: Record<string, SchemaField> = {
  // Existing mappings...
  
  "utils.custom.field_name": {
    prismaField: "customField",
    prismaType: "String",
    default: '""',
    description: "Description of the field"
  }
};
```

### Step 3: Run Schema Generation

```bash
# Generate TypeScript mappings and types
npm run generate:schema
```

This will:
- ✅ Create `src/database/mappings/GuildMapping.ts`
- ✅ Update `src/types/helpers/SchemaKeys.ts`
- ✅ Generate path validation types

### Step 4: Create Database Migration

```bash
# Create a new migration
npm run prisma:migrate -- --name add_custom_field
```

This will:
- ✅ Create migration file
- ✅ Apply schema changes
- ✅ Update Prisma client

### Step 5: Update Schema in Database

```bash
# Deploy migration to production
npm run prisma:deploy
```

Or locally:
```bash
# Apply all pending migrations
npx prisma migrate deploy
```

### Step 6: Use the New Field

```typescript
import { Guild } from "../helpers";

const guild = new Guild(client, discordGuild);

// Get the new field
const value = await guild.get("utils.custom.field_name");

// Set the new field
await guild.set("utils.custom.field_name", "value");

// TypeScript knows the type! 🎯
```

## Example: Adding Join-to-Create Field

### Scenario
We want to add a "creator_role" field to join-to-create settings.

### Implementation

**1. Update Prisma Schema**
```prisma
model Guild {
  // ...
  jtcEnabled Boolean @default(false)
  jtcChannel String?
  jtcCategory String?
  jtcDefaultName String @default("%{VAR}% channel")
  jtcCreatorRole String? // New field
  
  @@map("guilds")
}
```

**2. Add to Mapping**
```typescript
// In scripts/generate-schema.ts
"utils.join_to_create.creator_role": {
  prismaField: "jtcCreatorRole",
  prismaType: "String?",
  default: "null",
  description: "Role ID to assign to JTC channel creator"
},
```

**3. Generate**
```bash
npm run generate:schema
```

**4. Migrate**
```bash
npm run prisma:migrate -- --name add_jtc_creator_role
```

**5. Use**
```typescript
const jtc = await guild.get("utils.join_to_create");
console.log(jtc.creator_role); // TypeScript knows it's string | null

await guild.set("utils.join_to_create.creator_role", "roleId");
```

## Parent Paths

### Creating Parent Paths Automatically

The mapping generator automatically detects parent paths. If you have:

```typescript
"utils.join_to_create.enabled"
"utils.join_to_create.channel"
"utils.join_to_create.category"
"utils.join_to_create.default_name"
```

You can query all of them at once:

```typescript
const jtc = await guild.get("utils.join_to_create");
// Returns all child fields as object
```

### Parent Path Requirements

For parent paths to work:
1. All child fields must share the same prefix
2. Fields must be at the same nesting level
3. Generator detects them automatically

### Declaring Parent Paths Explicitly

In `scripts/generate-schema.ts`, you can declare parent paths:

```typescript
const parentPaths: Record<string, string[]> = {
  "utils.join_to_create": [
    "enabled",
    "channel",
    "category",
    "default_name",
    "creator_role"
  ],
  "level": [
    "xp",
    "total_xp",
    "level",
    "voice_time",
    "message_count"
  ]
};
```

## Database Migrations

### Understanding Migrations

Migrations are version-controlled SQL scripts that modify your database schema.

```
prisma/migrations/
├── 20251024211114_base/
│   └── migration.sql          # Initial schema
├── 20251120004624_update/
│   └── migration.sql          # Schema updates
└── migration_lock.toml        # Prevents concurrent migrations
```

### Creating a Migration

```bash
# After changing prisma/schema.prisma:
npm run prisma:migrate -- --name describe_what_changed
```

Example:
```bash
npm run prisma:migrate -- --name add_economy_fields
```

This creates:
```
prisma/migrations/20251127120000_add_economy_fields/migration.sql
```

### Migration SQL Example

```sql
-- Example migration file
-- CreateTable
CREATE TABLE "guilds" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "prefix" TEXT NOT NULL DEFAULT '!',
    "jtcEnabled" BOOLEAN NOT NULL DEFAULT false,
    "jtcChannel" TEXT,
    "jtcCategory" TEXT
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "guildId" TEXT NOT NULL,
    "xp" INTEGER NOT NULL DEFAULT 0,
    
    CONSTRAINT "users_pkey" PRIMARY KEY ("id","guildId")
);

-- CreateIndex
CREATE INDEX "users_guildId_idx" ON "users"("guildId");
```

### Applying Migrations

**Development:**
```bash
# Auto-apply any pending migrations
npx prisma migrate dev
```

**Production:**
```bash
# Apply migrations without prompts
npm run prisma:deploy
```

### Checking Migration Status

```bash
# See pending migrations
npx prisma migrate status
```

### Resetting Database (Development Only)

```bash
# ⚠️ DANGER: This deletes all data!
npx prisma migrate reset
```

This is useful when:
- You want a fresh development database
- You're testing migrations
- You've made mistakes and want to start over

## Prisma Commands Reference

### Generation

```bash
# Generate Prisma client from schema
npm run prisma:generate

# Open Prisma Studio (visual DB editor)
npm run prisma:studio

# Format schema file
npx prisma format
```

### Migrations

```bash
# Create migration from schema changes
npm run prisma:migrate -- --name migration_name

# Create migration without applying
npx prisma migrate dev --create-only

# Apply all pending migrations
npm run prisma:deploy

# Check migration status
npx prisma migrate status

# Revert last migration (dev only)
npx prisma migrate resolve --rolled-back migration_name
```

### Schema Validation

```bash
# Validate schema syntax
npx prisma validate
```

## Updating Mappings Only

If you're only updating path-to-field mappings without changing Prisma schema:

```typescript
// In scripts/generate-schema.ts, update mappings:
"utils.custom.new_path": {
  prismaField: "existingPrismaField",
  prismaType: "String",
  default: '""'
}
```

Then:
```bash
# Only generate mappings, no database changes
npm run generate:schema
```

## Batch Operations

### Bulk Insert

```typescript
import { prisma } from "../database/prisma";

// Insert multiple guilds
const guilds = await prisma.guild.createMany({
  data: [
    { id: "123", prefix: "!" },
    { id: "456", prefix: "?" }
  ]
});
```

### Bulk Update

```typescript
// Update all guilds with specific condition
await prisma.guild.updateMany({
  where: { jtcEnabled: false },
  data: { jtcEnabled: true }
});
```

### Bulk Delete

```typescript
// Delete users without activity in 30 days
const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

await prisma.user.deleteMany({
  where: {
    updatedAt: { lt: thirtyDaysAgo }
  }
});
```

## Data Backup and Export

### Export Guild Data

```typescript
import { prisma } from "../database/prisma";
import fs from "fs";

async function backupGuilds() {
  const guilds = await prisma.guild.findMany();
  const backup = {
    timestamp: new Date().toISOString(),
    count: guilds.length,
    data: guilds
  };
  
  fs.writeFileSync(
    `backups/guilds-${Date.now()}.json`,
    JSON.stringify(backup, null, 2)
  );
}
```

### Import Guild Data

```typescript
async function restoreGuilds(backupFile: string) {
  const backup = JSON.parse(fs.readFileSync(backupFile, "utf-8"));
  
  for (const guild of backup.data) {
    await prisma.guild.upsert({
      where: { id: guild.id },
      update: guild,
      create: guild
    });
  }
}
```

## Database Queries

### Using Raw SQL

```typescript
import { prisma } from "../database/prisma";

// When you need raw SQL for performance
const result = await prisma.$queryRaw`
  SELECT * FROM guilds WHERE jtcEnabled = true
`;
```

### Using QueryRaw for Mutations

```typescript
// Execute raw SQL mutation
const result = await prisma.$executeRaw`
  UPDATE guilds SET prefix = '!' WHERE prefix = '?'
`;
```

## Performance Optimization

### Indexing

Prisma creates indexes automatically for:
- Primary keys
- Unique constraints
- Foreign keys

Add custom indexes in schema:

```prisma
model Guild {
  id String @id
  prefix String @default("!")
  
  // Create index for faster queries
  @@index([prefix])
}
```

### Query Optimization

```typescript
// ❌ Bad - Fetches all fields
const guild = await prisma.guild.findUnique({
  where: { id: "123" }
});

// ✅ Good - Fetches only needed fields
const guild = await prisma.guild.findUnique({
  where: { id: "123" },
  select: { prefix: true, jtcEnabled: true }
});
```

## Common Issues and Solutions

### "Error: Field not found"

```
Error: Unknown field `customField` for select statement
```

**Solution:**
1. Check field exists in Prisma schema
2. Run `npm run prisma:generate`
3. Rebuild project: `npm run build`

### "Migration Lock"

```
Error: Migration engine error: database is locked
```

**Solution:**
1. No other migrations running
2. Check if another bot instance is running
3. Restart database if needed

### "Type Mismatch"

```
Error: Type 'string' is not assignable to type 'number'
```

**Solution:**
1. Check field type in mapping
2. Verify Prisma schema field type
3. Use correct type in code

## Best Practices

1. ✅ Always create meaningful migration names
2. ✅ Test migrations in development first
3. ✅ Keep schema documentation updated
4. ✅ Use parent paths for related fields
5. ✅ Version control all migrations

6. ❌ Don't skip migrations
7. ❌ Don't manually edit migration files
8. ❌ Don't mix Prisma and raw SQL unnecessarily
9. ❌ Don't forget to test migrations
10. ❌ Don't rush into production deployments

---

**Last Updated**: November 27, 2025
**Version**: 2.0

