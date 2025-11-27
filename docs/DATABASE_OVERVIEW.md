# Database System Overview

## 📋 Introduction

The Amelia bot uses a comprehensive, type-safe database system built on **Prisma ORM** with PostgreSQL. This system provides a multi-layer architecture designed for ease of use, type safety, and maintainability.

### Architecture Layers

```
┌─────────────────────────────────────────┐
│   Guild & User Helper Classes           │  User-facing API
│   (type-safe, cache-aware)              │  (High-level)
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│   Cache Layer (MongoDB)                 │  Optional caching
│   (TempCache for temporary data)        │  (Low-level)
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│   Database Wrapper Classes              │  Main DB layer
│   (DBGuild, DBUser)                     │  (Type-safe, mapped)
│   - Path mapping & validation           │
│   - Nested field access                 │
│   - Automatic field translation         │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│   Prisma ORM                            │  Database abstraction
│   - Generated client                    │  (Auto-generated)
│   - Schema validation                   │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│   PostgreSQL Database                   │  Data storage
└─────────────────────────────────────────┘
```

## 🎯 Key Features

### ✨ Type-Safe Paths
- Full TypeScript support with intellisense
- Compile-time path validation
- Automatic return type inference

### 🔄 Automatic Path Mapping
- Nested paths converted to flat Prisma fields
- Parent path support for batch operations
- Automatic field detection

### 💾 Dual Database Support
- **Primary**: PostgreSQL (via Prisma)
- **Secondary**: MongoDB (via TempCache for temporary data)

### 🚀 Performance Optimized
- Batch operations reduce DB queries
- Parallel processing with Promise.all()
- Efficient caching strategies

### 🛡️ Automatic Code Generation
- Schema mapping generation
- Type definitions from Prisma schema
- No manual field mapping needed

## 📁 Directory Structure

```
src/
├── database/
│   ├── DBGuild.ts           # Primary Guild DB wrapper
│   ├── DBUser.ts            # Primary User DB wrapper
│   ├── DBHistory.ts         # History tracking
│   ├── TempCache.ts         # MongoDB temporary cache
│   ├── mongodb.ts           # MongoDB connection
│   ├── prisma.ts            # Prisma client singleton
│   └── mappings/
│       ├── GuildMapping.ts   # Guild path → Prisma field mappings
│       └── UserMapping.ts    # User path → Prisma field mappings
│
├── helpers/
│   ├── Guild.ts             # Guild wrapper (cache-aware)
│   ├── User.ts              # User wrapper (cache-aware)
│   └── Cache.ts             # Generic cache wrapper
│
└── types/helpers/
    ├── SchemaKeys.ts        # Type-safe path definitions
    └── index.ts             # Export all types

scripts/
└── generate-schema.ts       # Auto-generates mappings

prisma/
├── schema.prisma            # Database schema
└── migrations/              # Database migrations
```

## 🔑 Key Concepts

### 1. Path System
Paths use dot-notation to access nested database fields:
```
"settings.prefix"              // Single field
"utils.join_to_create"         // Parent path (returns all child fields)
"permissions.commands.ban"     // Deep nested path
```

### 2. Mapping System
Translates human-readable paths to Prisma fields:
```
Path: "utils.join_to_create.enabled"
↓
Prisma Field: "jtcEnabled"
Prisma Type: "Boolean"
```

### 3. Type Inference
Return types are automatically inferred from paths:
```typescript
const prefix = await guild.get("settings.prefix");
// TypeScript knows this is string!

const jtc = await guild.get("utils.join_to_create");
// TypeScript knows this is JoinToCreateData!
```

## 📚 Documentation Files

- **DATABASE_OVERVIEW.md** (this file) - Architecture and concepts
- **DATABASE_USAGE.md** - How to use Guild/User classes
- **DATABASE_CACHE.md** - Cache layer and TempCache
- **DATABASE_DEVELOPMENT.md** - Adding new fields and migrations
- **DATABASE_MAPPINGS.md** - Understanding path mappings
- **DATABASE_TROUBLESHOOTING.md** - Common issues and solutions

## 🚀 Quick Start

### Getting Data
```typescript
const guild = new Guild(client, discordGuild);
const prefix = await guild.get("settings.prefix");
```

### Setting Data
```typescript
await guild.set("settings.prefix", "!");
```

### Working with Numbers
```typescript
const user = new User(client, discordUser, discordGuild);
await user.add("level.xp", 100);
```

### Working with Cache
```typescript
// Get from cache
const voiceTime = await user.cache.get("temp.voice_time");

// Set in cache
await user.cache.set("temp.voice_time", Date.now());
```

## 🔗 Important Links

- [Prisma Documentation](https://www.prisma.io/docs/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [MongoDB Documentation](https://docs.mongodb.com/)

## ⚙️ Configuration

Database connection is configured via `.env` file:
```
DATABASE_URL="postgresql://user:password@localhost:5432/amelia"
MONGODB_URL="mongodb://user:password@localhost:27017/amelia"
```

## 📊 Database Schema Overview

### Core Models
- **Guild**: Server-wide settings and configurations
- **User**: User-specific data per guild
- **History**: Audit logs for data changes

### Data Categories

**Guild Data:**
- Settings (prefix, language, etc.)
- Utilities (levels, join-to-create, etc.)
- Permissions (command & role permissions)
- Custom configurations

**User Data:**
- Level information (XP, level, voice time)
- Economy (wallet, bank, daily streak)
- Custom user settings

## 🎓 Best Practices

1. ✅ Always use the wrapper classes (`Guild`, `User`)
2. ✅ Use parent paths for batch operations
3. ✅ Cache frequently accessed data
4. ✅ Use TypeScript paths for compile-time validation
5. ✅ Check field existence with `has()` before unsafe operations

6. ❌ Don't use `DBGuild`/`DBUser` directly in events
7. ❌ Don't modify mapping files manually
8. ❌ Don't bypass the type system with `any`
9. ❌ Don't make multiple sequential DB calls when batch is possible
10. ❌ Don't forget to await async operations

## 📞 Support

For issues or questions:
1. Check the troubleshooting guide (DATABASE_TROUBLESHOOTING.md)
2. Review the API reference (DATABASE_USAGE.md)
3. Check the mapping documentation (DATABASE_MAPPINGS.md)

---

**Last Updated**: November 27, 2025
**Version**: 2.0

