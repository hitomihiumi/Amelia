# Database Documentation Index

Welcome to the Amelia Bot Database System documentation. This guide covers the multi-layer architecture providing type-safe, efficient data access.

## 📚 Documentation Structure

### [1. DATABASE_OVERVIEW.md](./DATABASE_OVERVIEW.md) - Start Here! 🚀
**Overview of the entire system architecture**

- Architecture layers (Guild → Cache → DBGuild → Prisma → PostgreSQL)
- Key features and concepts
- Directory structure
- Path system introduction
- Quick start guide
- Best practices

**Read this first to understand how everything connects.**

---

### [2. DATABASE_USAGE.md](./DATABASE_USAGE.md) - How to Use
**Complete guide to using the wrapper classes**

- Guild class usage
  - Getting, setting, adding/subtracting values
  - Working with arrays
  - Other operations
  
- User class usage
  - Same operations as Guild
  - User-specific patterns
  
- Cache system
  - Guild cache usage
  - User cache usage
  - Cache patterns
  
- Event handlers patterns
  - Voice state updates
  - Message creation
  
- Type safety
  - Literal vs dynamic paths
  - Compile-time checking
  
- Performance tips
  - Parent paths
  - Batch updates
  - Caching
  - Parallel operations
  
- Common patterns
  - Initialization
  - Check and update
  - Transactions
  
- Error handling
- Thread safety

**Use this when writing code that accesses the database.**

---

### [3. DATABASE_CACHE.md](./DATABASE_CACHE.md) - Cache Layer
**Deep dive into caching system**

- Cache architecture (MongoDB + wrappers)
- TempCache class
  - Purpose and use cases
  - Basic operations
  - Difference from main DB
  
- Cache generic wrapper
  - Type-safe operations
  
- Guild cache patterns
  - Caching data
  - Lifetime management
  
- User cache patterns
  - Voice tracking
  - Cooldown management
  - Session state
  
- MongoDB connection
  - Configuration
  - Data structure
  - TTL expiration
  
- Performance characteristics
  - Speed comparisons
  - When to use cache
  
- Advanced patterns
  - Distributed cache
  - Cache invalidation
  - Cache warming
  - Conditional updates
  
- Troubleshooting

**Use this to understand and optimize caching.**

---

### [4. DATABASE_DEVELOPMENT.md](./DATABASE_DEVELOPMENT.md) - Adding Fields
**Guide for developers adding new features**

- Adding new fields step-by-step
  - Update Prisma schema
  - Add field to mapping
  - Generate mappings
  - Create migration
  - Apply changes
  - Use the new field
  
- Practical example: Adding JTC creator role
  
- Parent paths
  - Automatic detection
  - Explicit declaration
  - Usage
  
- Database migrations
  - Understanding migrations
  - Creating migrations
  - Applying migrations
  - Checking status
  - Resetting database
  
- Prisma commands reference
  - Generation
  - Migrations
  - Validation
  
- Batch operations
  - Bulk insert
  - Bulk update
  - Bulk delete
  
- Data backup and export
- Database queries
- Performance optimization
- Common issues and solutions
- Best practices

**Use this when adding new database fields or features.**

---

### [5. DATABASE_MAPPINGS.md](./DATABASE_MAPPINGS.md) - Path System
**Understanding the path mapping system**

- Overview of path mapping
  - Components
  - Storage
  - Generation
  
- Types of paths
  - Leaf paths (single fields)
  - Parent paths (field groups)
  - Dynamic paths (JSON fields)
  
- Guild mapping reference
  - Settings
  - Join-to-Create
  - Levels
  - Custom
  - Permissions
  
- User mapping reference
  - Level system
  - Economy
  - Ranking
  - Custom
  
- Cache mapping reference
  - Guild cache paths
  - User cache paths
  
- Mapping generation process
  - Input, processing, output
  
- Adding new paths
  - Step-by-step guide
  
- Parent path detection
  - How it works
  - Manual definition
  - Using parent paths
  
- Path validation
  - Compile-time
  - Runtime
  
- Performance considerations
- Troubleshooting
- Best practices

**Use this to understand the mapping system and add custom paths.**

---

### [6. DATABASE_TROUBLESHOOTING.md](./DATABASE_TROUBLESHOOTING.md) - Problem Solving
**Solutions to common problems**

#### Common Errors (with solutions)
1. "Unknown path" error
2. "PrismaClientValidationError"
3. Type mismatch error
4. "Cannot read properties of null"
5. "DATABASE_URL not set"
6. MongoDB connection issues
7. "Migration Lock" error
8. Field not found after migration
9. Performance issues
10. Cache not persisting

#### Debugging Steps
- Enable debug logging
- Verify in Prisma Studio
- Test direct database queries
- Check type definitions
- Collect debug info

#### Getting Help
- What to include in bug reports

**Use this when something isn't working.**

---

## 🎯 Quick Navigation

### I want to...

**Get started quickly**
→ [DATABASE_OVERVIEW.md](./DATABASE_OVERVIEW.md) → [DATABASE_USAGE.md](./DATABASE_USAGE.md)

**Use Guild/User classes**
→ [DATABASE_USAGE.md](./DATABASE_USAGE.md)

**Work with cache**
→ [DATABASE_CACHE.md](./DATABASE_CACHE.md)

**Add a new field**
→ [DATABASE_DEVELOPMENT.md](./DATABASE_DEVELOPMENT.md)

**Understand paths**
→ [DATABASE_MAPPINGS.md](./DATABASE_MAPPINGS.md)

**Fix an error**
→ [DATABASE_TROUBLESHOOTING.md](./DATABASE_TROUBLESHOOTING.md)

**Optimize performance**
→ [DATABASE_USAGE.md](./DATABASE_USAGE.md#performance-tips) → [DATABASE_CACHE.md](./DATABASE_CACHE.md#performance-characteristics)

**Debug an issue**
→ [DATABASE_TROUBLESHOOTING.md](./DATABASE_TROUBLESHOOTING.md#debugging-steps)

---

## 🏗️ Architecture at a Glance

```
┌─────────────────────────────────────────┐
│   Guild & User Helper Classes           │  ← Use these in your code
│   (guild.get(), user.cache.set())       │     Type-safe, cache-aware
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│   Cache Layer (MongoDB)                 │  ← Fast temporary storage
│   (TempCache, auto-expiring)            │     Session data, cooldowns
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│   Database Wrapper Classes              │  ← Core DB interaction
│   (DBGuild, DBUser)                     │     Path mapping, validation
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│   Prisma ORM                            │  ← Database abstraction
│   (Generated client, type-safe)         │     Auto-generated from schema
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│   PostgreSQL Database                   │  ← Persistent storage
└─────────────────────────────────────────┘
```

---

## 📋 File Reference

| File | Purpose | Read Time |
|------|---------|-----------|
| DATABASE_OVERVIEW.md | Architecture & concepts | 10 min |
| DATABASE_USAGE.md | How to use classes | 20 min |
| DATABASE_CACHE.md | Caching system | 15 min |
| DATABASE_DEVELOPMENT.md | Adding fields | 15 min |
| DATABASE_MAPPINGS.md | Path system | 15 min |
| DATABASE_TROUBLESHOOTING.md | Error solutions | 20 min |

**Total reading time: ~95 minutes**

---

## 🔑 Key Concepts

### Paths
Human-readable way to access database fields:
```typescript
"settings.prefix"              // Single field
"utils.join_to_create"         // Parent (all JTC fields)
"permissions.commands.ban"     // Deep nested
```

### Mappings
Translate paths to Prisma fields:
```
"utils.join_to_create.enabled" → "jtcEnabled" (Boolean)
```

### Type Safety
Compile-time validation through TypeScript:
```typescript
const prefix = await guild.get("settings.prefix");
// TypeScript knows this is string
```

### Cache
Temporary MongoDB storage for session data:
```typescript
await user.cache.set("temp.voice_time", Date.now());
```

### Wrapper Classes
High-level API for database access:
```typescript
const guild = new Guild(client, discordGuild);
await guild.get("settings.prefix");
```

---

## 🚀 Getting Started

### 1. Read Overview
Start with [DATABASE_OVERVIEW.md](./DATABASE_OVERVIEW.md) to understand the architecture.

### 2. Learn Usage
Read [DATABASE_USAGE.md](./DATABASE_USAGE.md) to see how to use Guild/User classes.

### 3. Write Code
Use the examples to access database in your event handlers.

### 4. Hit a Problem?
Check [DATABASE_TROUBLESHOOTING.md](./DATABASE_TROUBLESHOOTING.md) for solutions.

### 5. Need to Add Fields?
Follow [DATABASE_DEVELOPMENT.md](./DATABASE_DEVELOPMENT.md) for adding new features.

---

## 📞 Common Tasks

### Get guild prefix
```typescript
const prefix = await guild.get("settings.prefix");
```

### Add user XP
```typescript
await user.add("level.xp", 100);
```

### Cache voice time
```typescript
await user.cache.set("temp.voice_time", Date.now());
```

### Get all level data
```typescript
const level = await user.get("level");
console.log(level.xp, level.level);
```

### Check if field exists
```typescript
const exists = await guild.has("settings.prefix");
```

---

## 🛠️ Useful Commands

```bash
# Generate mappings and types
npm run generate:schema

# Generate Prisma client
npm run prisma:generate

# Create migration
npm run prisma:migrate -- --name migration_name

# Open database GUI
npm run prisma:studio

# Apply migrations
npm run prisma:deploy

# Build project
npm run build
```

---

## ⚠️ Important Notes

1. **Always use wrapper classes** (`Guild`, `User`) in production code
2. **Don't modify mapping files** - they're auto-generated
3. **Always await** async operations
4. **Use parent paths** for better performance
5. **Use cache** for temporary session data

---

## 📚 Related Documentation

- [Prisma Docs](https://www.prisma.io/docs/)
- [PostgreSQL Docs](https://www.postgresql.org/docs/)
- [MongoDB Docs](https://docs.mongodb.com/)
- [Discord.js Docs](https://discord.js.org/)

---

## 📝 Documentation Versions

| Version | Date | Changes |
|---------|------|---------|
| 2.0 | Nov 27, 2025 | Complete rewrite with wrapper classes, cache system |
| 1.0 | Earlier | Original database documentation |

---

## 🎓 Learning Path

### Beginner
1. [DATABASE_OVERVIEW.md](./DATABASE_OVERVIEW.md) - Understand architecture
2. [DATABASE_USAGE.md](./DATABASE_USAGE.md) - Learn basic usage
3. Start writing simple queries

### Intermediate
4. [DATABASE_CACHE.md](./DATABASE_CACHE.md) - Optimize with caching
5. [DATABASE_MAPPINGS.md](./DATABASE_MAPPINGS.md) - Understand path system
6. Implement event handlers

### Advanced
7. [DATABASE_DEVELOPMENT.md](./DATABASE_DEVELOPMENT.md) - Add new features
8. [DATABASE_TROUBLESHOOTING.md](./DATABASE_TROUBLESHOOTING.md) - Debug issues
9. Contribute optimizations

---

**Last Updated**: November 27, 2025
**Version**: 2.0
**Status**: Complete ✅

