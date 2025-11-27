# Database Documentation - Quick Start

## 📖 What is This?

This is the complete documentation for the Amelia Bot's database system. It covers:

- ✅ Multi-layer architecture (Guild → Cache → DB → Prisma → PostgreSQL)
- ✅ Type-safe data access with compile-time validation
- ✅ Caching layer with MongoDB for performance
- ✅ Complete examples and best practices
- ✅ Troubleshooting and debugging guides

## 🚀 Start Here

### New to the database system?

1. **Read [DATABASE_OVERVIEW.md](./DATABASE_OVERVIEW.md)** (10 min)
   - Understand the architecture
   - Learn key concepts
   - Get a quick start

2. **Read [DATABASE_USAGE.md](./DATABASE_USAGE.md)** (20 min)
   - Learn how to use Guild and User classes
   - See practical examples
   - Understand performance tips

3. **Start coding!**
   - Use the examples from DATABASE_USAGE.md
   - Apply patterns to your event handlers

### Immediate answers?

- **How do I get data?** → See [DATABASE_USAGE.md](./DATABASE_USAGE.md#getting-data)
- **How do I use cache?** → See [DATABASE_CACHE.md](./DATABASE_CACHE.md)
- **I have an error** → See [DATABASE_TROUBLESHOOTING.md](./DATABASE_TROUBLESHOOTING.md)
- **How do I add new fields?** → See [DATABASE_DEVELOPMENT.md](./DATABASE_DEVELOPMENT.md)

## 📚 Documentation Files

### Main Files

| File | Purpose | For Whom |
|------|---------|----------|
| **[DATABASE.md](./DATABASE.md)** | Complete index and navigation | Everyone |
| **[DATABASE_OVERVIEW.md](./DATABASE_OVERVIEW.md)** | Architecture overview | New developers |
| **[DATABASE_USAGE.md](./DATABASE_USAGE.md)** | How to use the system | All developers |
| **[DATABASE_CACHE.md](./DATABASE_CACHE.md)** | Caching system details | Advanced users |
| **[DATABASE_DEVELOPMENT.md](./DATABASE_DEVELOPMENT.md)** | Adding new fields | Feature developers |
| **[DATABASE_MAPPINGS.md](./DATABASE_MAPPINGS.md)** | Path system internals | Advanced users |
| **[DATABASE_TROUBLESHOOTING.md](./DATABASE_TROUBLESHOOTING.md)** | Error solutions | Problem solvers |

## 🎯 I Want To...

### Use the database in my code
→ Read [DATABASE_USAGE.md](./DATABASE_USAGE.md)

**Quick example:**
```typescript
import { Guild } from "../helpers";

const guild = new Guild(client, discordGuild);
const prefix = await guild.get("settings.prefix");
await guild.set("settings.prefix", "!");
```

### Add a new field to the database
→ Read [DATABASE_DEVELOPMENT.md](./DATABASE_DEVELOPMENT.md)

**Quick steps:**
1. Add field to `prisma/schema.prisma`
2. Add mapping to `scripts/generate-schema.ts`
3. Run `npm run generate:schema`
4. Run `npm run prisma:migrate -- --name add_field`
5. Use it in code

### Work with temporary data / cache
→ Read [DATABASE_CACHE.md](./DATABASE_CACHE.md)

**Quick example:**
```typescript
// Store temporary data
await user.cache.set("temp.voice_time", Date.now());

// Retrieve temporary data
const voiceTime = await user.cache.get("temp.voice_time");
```

### Fix an error
→ Read [DATABASE_TROUBLESHOOTING.md](./DATABASE_TROUBLESHOOTING.md)

### Understand how paths work
→ Read [DATABASE_MAPPINGS.md](./DATABASE_MAPPINGS.md)

## 💡 Key Concepts (30-second version)

### Paths
Access database fields using human-readable paths:
```
"settings.prefix"              // Get bot prefix
"utils.join_to_create"         // Get all JTC settings
"level.xp"                     // Get user XP
```

### Wrapper Classes
High-level classes for database access:
```typescript
new Guild(client, guild)       // For guild data
new User(client, user, guild)  // For user data
```

### Type Safety
TypeScript knows the type of every field:
```typescript
const prefix = await guild.get("settings.prefix");
// TypeScript knows this is string ✓
```

### Cache
Fast temporary storage in MongoDB:
```typescript
await user.cache.set("temp.data", value);
await user.cache.get("temp.data");
```

## 🔧 Essential Commands

```bash
# Generate database mappings after changes
npm run generate:schema

# Create database migration
npm run prisma:migrate -- --name describe_change

# Apply migrations to database
npm run prisma:deploy

# Open visual database editor
npm run prisma:studio

# Build the project
npm run build
```

## 📝 Example: Voice XP System

```typescript
import { Guild } from "../helpers";
import { VoiceState } from "discord.js";

module.exports = async (client, oldState: VoiceState, newState: VoiceState) => {
  if (!newState.guild) return;

  const guild = new Guild(client, newState.guild);
  const user = guild.getUser(newState.member.user.id);

  // Get level settings
  const levels = await guild.get("utils.levels");
  if (!levels.enabled) return;

  // User joined voice channel
  if (!oldState.channelId && newState.channelId) {
    await user.cache.set("temp.voice_time", Date.now());
    return;
  }

  // User left voice channel
  if (oldState.channelId && !newState.channelId) {
    const voiceTime = await user.cache.get("temp.voice_time");
    if (!voiceTime) return;

    const duration = Date.now() - voiceTime;
    const xp = Math.floor(duration / 1000 / 60); // 1 XP per minute

    // Award XP
    await user.add("level.xp", xp);
    await user.add("level.total_xp", xp);
    await user.add("level.voice_time", duration);

    // Clear cache
    await user.cache.delete("temp.voice_time");
  }
};
```

## ⚠️ Common Mistakes

### ❌ Don't do this

```typescript
// Don't use DBGuild directly
const db = new DBGuild(client, guild);

// Don't forget to await
const data = guild.get("settings.prefix");

// Don't make multiple queries
const x = await guild.get("utils.join_to_create.enabled");
const y = await guild.get("utils.join_to_create.channel");

// Don't use invalid paths
const bad = await guild.get("settings.nonexistent");
```

### ✅ Do this instead

```typescript
// Use Guild wrapper
const guild = new Guild(client, discordGuild);

// Always await
const data = await guild.get("settings.prefix");

// Use parent paths
const jtc = await guild.get("utils.join_to_create");

// Use valid paths (TypeScript will catch invalid ones)
const good = await guild.get("settings.prefix");
```

## 🐛 Troubleshooting Quick Links

**"Unknown path" error?**
→ [DATABASE_TROUBLESHOOTING.md#1-unknown-path-error](./DATABASE_TROUBLESHOOTING.md#1-unknown-path-error)

**Type mismatch?**
→ [DATABASE_TROUBLESHOOTING.md#3-type-mismatch-error](./DATABASE_TROUBLESHOOTING.md#3-type-mismatch-error)

**Cannot read properties of null?**
→ [DATABASE_TROUBLESHOOTING.md#4-cannot-read-properties-of-null](./DATABASE_TROUBLESHOOTING.md#4-cannot-read-properties-of-null)

**DATABASE_URL not set?**
→ [DATABASE_TROUBLESHOOTING.md#5-database_url-not-set](./DATABASE_TROUBLESHOOTING.md#5-database_url-not-set)

**MongoDB issues?**
→ [DATABASE_TROUBLESHOOTING.md#6-mongodb-connection-issues](./DATABASE_TROUBLESHOOTING.md#6-mongodb-connection-issues)

## 🔗 Navigation

- **[Full Index](./DATABASE.md)** - Complete documentation index
- **[Overview](./DATABASE_OVERVIEW.md)** - Architecture and concepts
- **[Usage Guide](./DATABASE_USAGE.md)** - How to use the system
- **[Cache Guide](./DATABASE_CACHE.md)** - Caching system details
- **[Development Guide](./DATABASE_DEVELOPMENT.md)** - Adding fields
- **[Mapping Reference](./DATABASE_MAPPINGS.md)** - Path system
- **[Troubleshooting](./DATABASE_TROUBLESHOOTING.md)** - Problem solving

## ✨ Quick Reference

| Task | Command |
|------|---------|
| Get data | `await guild.get("path")` |
| Set data | `await guild.set("path", value)` |
| Add number | `await user.add("path", 100)` |
| Subtract | `await user.sub("path", 50)` |
| Push array | `await guild.push("path", item)` |
| Delete field | `await guild.delete("path")` |
| Check exists | `await guild.has("path")` |
| Get cache | `await user.cache.get("path")` |
| Set cache | `await user.cache.set("path", value)` |
| Clear cache | `await user.cache.clear()` |

## 📞 Need Help?

1. **Check [DATABASE_TROUBLESHOOTING.md](./DATABASE_TROUBLESHOOTING.md)** - Most errors have solutions
2. **Search in [DATABASE_USAGE.md](./DATABASE_USAGE.md)** - Examples of common patterns
3. **Read [DATABASE_CACHE.md](./DATABASE_CACHE.md)** - For caching issues
4. **Review [DATABASE_DEVELOPMENT.md](./DATABASE_DEVELOPMENT.md)** - For adding fields

---

**Happy coding! 🚀**

For detailed documentation, see [DATABASE.md](./DATABASE.md)

Last Updated: November 27, 2025 | Version: 2.0

