# Database Troubleshooting Guide

## Common Errors and Solutions

### 1. "Unknown path" Error

#### Error Message
```
Error: Unknown guild path: settings.customfield
Error: Unknown user path: level.custom_level
```

#### Causes
- Path doesn't exist in mapping
- Typo in path name
- Mapping not regenerated
- Field added to Prisma but not to mapping

#### Solutions

**Solution 1: Check Spelling**
```typescript
// ❌ Wrong
const value = await guild.get("settings.custmfield");

// ✅ Correct
const value = await guild.get("settings.customfield");
```

**Solution 2: Regenerate Mappings**
```bash
npm run generate:schema
npm run build
```

**Solution 3: Add to Mapping**
If the field should exist:
```typescript
// In scripts/generate-schema.ts
"settings.customfield": {
  prismaField: "customField",
  prismaType: "String",
  default: '""'
}
```

Then regenerate:
```bash
npm run generate:schema
npm run prisma:migrate -- --name add_customfield
```

---

### 2. "PrismaClientValidationError" in Select Statement

#### Error Message
```
Invalid `prisma.guild.findUnique()` invocation
Unknown field `permissions` for select statement on model `Guild`
```

#### Causes
- Field doesn't exist in Prisma schema
- Field was removed but mapping still references it
- Prisma client not regenerated
- Wrong field name in mapping

#### Solutions

**Solution 1: Verify Field Exists in Schema**
```bash
# Check prisma/schema.prisma
# Look for the missing field
```

**Solution 2: Regenerate Prisma Client**
```bash
npm run prisma:generate
npm run build
```

**Solution 3: Update Mapping**
```typescript
// In scripts/generate-schema.ts
// Ensure mapping field matches Prisma schema
"permissions.commands": {
  prismaField: "permissions",  // Must exist in schema!
  prismaType: "Json",
  default: "{}"
}
```

**Solution 4: Check Field Type**
```prisma
// Prisma schema
model Guild {
  // ✅ Correct - Json field for custom data
  permissions Json
  
  // ❌ Wrong - String field can't be queried as object
  permissionsJson String
}
```

---

### 3. Type Mismatch Error

#### Error Message
```
Type 'string' is not assignable to type 'boolean'
Type 'number' is not assignable to type 'string | null'
```

#### Causes
- Using wrong value type
- Path points to different type field
- Mapping type incorrect

#### Solutions

**Solution 1: Check Path Type**
```typescript
// ✅ Correct - boolean field
await guild.set("utils.join_to_create.enabled", true);

// ❌ Wrong - expected boolean
await guild.set("utils.join_to_create.enabled", "true");
```

**Solution 2: Verify Mapping Type**
```typescript
// In scripts/generate-schema.ts
"utils.join_to_create.enabled": {
  prismaField: "jtcEnabled",
  prismaType: "Boolean",  // ← Must match actual type!
  default: "false"
}
```

**Solution 3: Cast if Needed**
```typescript
// If value is from user input (string)
const userInput = "true";
const boolValue = userInput === "true";
await guild.set("utils.join_to_create.enabled", boolValue);
```

---

### 4. "Cannot read properties of null"

#### Error Message
```
TypeError: Cannot read properties of null (reading 'members')
TypeError: Cannot read properties of null (reading 'has')
```

#### Causes
- Accessing property on null object
- Missing null checks
- Unsafe optional chaining
- Guild/User not initialized properly

#### Solutions

**Solution 1: Use Optional Chaining**
```typescript
// ❌ Bad - can be null
const size = channel.members.size;

// ✅ Good - safe access
const size = channel?.members?.size ?? 0;
```

**Solution 2: Add Null Checks**
```typescript
// ❌ Bad
function process(guild: Guild | null) {
  const data = guild.get("settings.prefix");
}

// ✅ Good
function process(guild: Guild | null) {
  if (!guild) return;
  const data = guild.get("settings.prefix");
}
```

**Solution 3: Initialize Objects**
```typescript
// ❌ Bad - guild might be null
const data = await guild.get("settings.prefix");

// ✅ Good - verify guild exists
if (!discordGuild) return;
const guild = new Guild(client, discordGuild);
const data = await guild.get("settings.prefix");
```

---

### 5. "DATABASE_URL not set"

#### Error Message
```
PrismaConfigEnvError: Missing required environment variable: DATABASE_URL
```

#### Causes
- `.env` file not created
- DATABASE_URL not in `.env`
- Wrong environment variable name
- `.env` not loaded by application

#### Solutions

**Solution 1: Create .env File**
```bash
# In project root, create .env:
touch .env
```

**Solution 2: Set DATABASE_URL**
```env
# .env file
DATABASE_URL="postgresql://user:password@localhost:5432/amelia"
MONGODB_URL="mongodb://user:password@localhost:27017/amelia"
```

**Solution 3: Verify Connection String**
```
postgresql://user:password@host:port/database

user      → PostgreSQL username
password  → PostgreSQL password
host      → Server address (localhost)
port      → PostgreSQL port (5432)
database  → Database name
```

**Solution 4: Load .env**
```bash
# If using Node.js
npm install dotenv
```

```typescript
// In main bot file
import dotenv from "dotenv";
dotenv.config();
```

---

### 6. MongoDB Connection Issues

#### Error Message
```
Error: connect ECONNREFUSED 127.0.0.1:27017
MongooseError: Cannot connect to MongoDB
```

#### Causes
- MongoDB not running
- Wrong connection string
- MongoDB port not accessible
- Authentication failed

#### Solutions

**Solution 1: Start MongoDB**
```bash
# On Windows
net start MongoDB

# On Linux/Mac
brew services start mongodb-community

# Using Docker
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

**Solution 2: Verify Connection String**
```env
# Format: mongodb://[username:password@]host:port/database
MONGODB_URL="mongodb://localhost:27017/amelia"

# With authentication
MONGODB_URL="mongodb://user:password@localhost:27017/amelia"
```

**Solution 3: Check MongoDB Service**
```bash
# Test connection
mongo mongodb://localhost:27017

# Or with newer mongo client
mongosh mongodb://localhost:27017
```

---

### 7. "Migration Lock" Error

#### Error Message
```
Error: Migration engine error: database is locked
```

#### Causes
- Another migration running
- Another bot instance running
- Incomplete previous migration
- Database connection issue

#### Solutions

**Solution 1: Wait for Current Migration**
```bash
# Wait a few seconds for ongoing migration to complete
# Check if another bot is running
ps aux | grep amelia
```

**Solution 2: Stop Other Instances**
```bash
# Kill other running instances
pkill -f "node.*amelia"
```

**Solution 3: Reset Migration (Development Only)**
```bash
# ⚠️ WARNING: This is destructive!
npm run prisma:reset
```

**Solution 4: Check Database Connection**
```bash
# Verify database is accessible
npx prisma validate

# Check connection
npx prisma db execute --stdin < /dev/null
```

---

### 8. Field Not Found After Migration

#### Error Message
```
Error: Column "customField" does not exist
Column "custom_field" not found on model "Guild"
```

#### Causes
- Migration not applied
- Schema out of sync with database
- Typo in field name
- Database not migrated to production

#### Solutions

**Solution 1: Apply Pending Migrations**
```bash
# Apply all migrations
npm run prisma:deploy

# Or locally
npx prisma migrate deploy
```

**Solution 2: Check Migration Status**
```bash
# See pending migrations
npx prisma migrate status
```

**Solution 3: Regenerate Client**
```bash
npm run prisma:generate
npm run build
```

**Solution 4: Verify in Schema**
```bash
# Check field name matches exactly
# prisma/schema.prisma should have:
customField String @default("")

# Or if snake_case:
custom_field String @default("")
```

---

### 9. Performance Issues - Slow Queries

#### Symptoms
- Application running slowly
- Database operations taking >1 second
- High CPU/memory usage

#### Solutions

**Solution 1: Use Parent Paths**
```typescript
// ❌ 4 queries
const x = await guild.get("utils.join_to_create.enabled");
const y = await guild.get("utils.join_to_create.channel");
const z = await guild.get("utils.join_to_create.category");

// ✅ 1 query
const data = await guild.get("utils.join_to_create");
```

**Solution 2: Use Cache**
```typescript
// Check cache first
let settings = await guild.cache.get("temp.levels");

if (!settings) {
  settings = await guild.get("utils.levels");
  await guild.cache.set("temp.levels", settings);
}
```

**Solution 3: Batch Operations**
```typescript
// ❌ Multiple set calls
await user.set("level.xp", 100);
await user.set("level.level", 5);
await user.set("level.total_xp", 1000);

// ✅ Single set call
await user.set("level", {
  xp: 100,
  level: 5,
  total_xp: 1000
});
```

**Solution 4: Add Indexes**
```prisma
// In prisma/schema.prisma
model Guild {
  id String @id
  prefix String @default("!")
  
  // Add index for frequently filtered field
  @@index([prefix])
}
```

---

### 10. Cache Not Persisting

#### Symptoms
- Cache data disappears unexpectedly
- Cache operations returning null
- MongoDB cache not working

#### Solutions

**Solution 1: Check MongoDB Connection**
```bash
# Verify MongoDB is running
mongo --eval "db.adminCommand('ping')"
```

**Solution 2: Verify Cache Path**
```typescript
// Use correct cache path
const voiceTime = await user.cache.get("temp.voice_time");

// NOT this - different key structure
const wrong = await user.cache.get("voice_time");
```

**Solution 3: Check TTL Configuration**
```typescript
// Cache might be expiring too quickly
// In TempCache.ts, check TTL setting
// Default is 1 hour (3600 seconds)

// For longer retention, manually manage expiration
await guild.cache.set("temp.data", value);
// Data will auto-expire after TTL
```

**Solution 4: Clear and Retry**
```typescript
// Clear cache and reset
await user.cache.clear();

// Re-add data
await user.cache.set("temp.voice_time", Date.now());
```

---

## Debugging Steps

### 1. Enable Debug Logging

```typescript
// Add logging to event
import { Guild } from "../helpers";

module.exports = async (client: Client, oldState, newState) => {
  if (!newState.guild) return;
  
  console.log("[Debug] Guild ID:", newState.guild.id);
  
  const guild = new Guild(client, newState.guild);
  console.log("[Debug] Guild object created");
  
  try {
    const levels = await guild.get("utils.levels");
    console.log("[Debug] Levels:", levels);
  } catch (error) {
    console.error("[Debug] Error getting levels:", error.message);
  }
};
```

### 2. Verify Data in Prisma Studio

```bash
# Open interactive database viewer
npm run prisma:studio

# Browse and modify data directly
# Check if fields exist and have correct values
```

### 3. Test Direct Database Query

```bash
# Connect to database directly
psql postgresql://user:password@localhost:5432/amelia

# Check if table exists
\dt guilds

# Check data
SELECT * FROM guilds LIMIT 1;

# Check specific field
SELECT id, "prefix" FROM guilds LIMIT 5;
```

### 4. Check Type Definitions

```bash
# Generate types and check output
npm run generate:schema

# Verify generated files exist
ls src/database/mappings/
ls src/types/helpers/

# Check if types look correct
cat src/types/helpers/SchemaKeys.ts
```

---

## Getting Help

When reporting issues, include:

1. **Error Message** - Full stack trace
2. **Steps to Reproduce** - What triggers the error
3. **Environment** - Node version, OS, database
4. **Logs** - Application and database logs
5. **Code Sample** - Minimal example that fails

### Debug Info Collection

```bash
# Collect system info
echo "Node: $(node --version)"
echo "NPM: $(npm --version)"
echo "Platform: $(uname -a)"

# Check environment
cat .env | grep DATABASE

# Check database status
psql -c "\l"  # List databases
```

---

**Last Updated**: November 27, 2025
**Version**: 2.0

