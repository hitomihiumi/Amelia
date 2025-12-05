/**
 * Schema Generator
 * Generates Prisma schema and path mappings from TypeScript interfaces
 */

import * as fs from "fs";
import * as path from "path";

interface SchemaField {
  prismaField: string;
  prismaType: string;
  default?: string;
  optional?: boolean;
  isArray?: boolean;
}

interface PathMapping {
  [path: string]: {
    field: string;
    children?: string[];
  };
}

/**
 * Guild schema mapping based on GuildSchema interface
 */
const guildSchemaMap: Record<string, SchemaField> = {
  // Settings
  "settings.prefix": {
    prismaField: "prefix",
    prismaType: "String",
    default: '"a."',
  },
  "settings.language": {
    prismaField: "language",
    prismaType: "String",
    default: '"ru"',
  },

  // Join to Create
  "utils.join_to_create.enabled": {
    prismaField: "jtcEnabled",
    prismaType: "Boolean",
    default: "false",
  },
  "utils.join_to_create.channel": {
    prismaField: "jtcChannel",
    prismaType: "String",
    optional: true,
  },
  "utils.join_to_create.category": {
    prismaField: "jtcCategory",
    prismaType: "String",
    optional: true,
  },
  "utils.join_to_create.default_name": {
    prismaField: "jtcDefaultName",
    prismaType: "String",
    default: '"%{VAR}% channel"',
  },

  // Counter
  "utils.counter.enabled": {
    prismaField: "counterEnabled",
    prismaType: "Boolean",
    default: "false",
  },
  "utils.counter.category": {
    prismaField: "counterCategory",
    prismaType: "String",
    optional: true,
  },
  "utils.counter.channels": {
    prismaField: "counterChannels",
    prismaType: "Json",
    default: '"{}"',
  },

  // Levels
  "utils.levels.enabled": {
    prismaField: "levelsEnabled",
    prismaType: "Boolean",
    default: "false",
  },
  "utils.levels.ignore_channels": {
    prismaField: "levelsIgnoreChannels",
    prismaType: "String",
    isArray: true,
    default: "[]",
  },
  "utils.levels.ignore_roles": {
    prismaField: "levelsIgnoreRoles",
    prismaType: "String",
    isArray: true,
    default: "[]",
  },
  "utils.levels.level_roles": {
    prismaField: "levelsRoles",
    prismaType: "Json",
    default: '"{}"',
  },
  "utils.levels.message.enabled": {
    prismaField: "levelsMessageEnabled",
    prismaType: "Boolean",
    default: "false",
  },
  "utils.levels.message.channel": {
    prismaField: "levelsMessageChannel",
    prismaType: "String",
    optional: true,
  },
  "utils.levels.message.content": {
    prismaField: "levelsMessageContent",
    prismaType: "Json",
    default: '"{}"',
  },
  "utils.levels.message.delete": {
    prismaField: "levelsMessageDelete",
    prismaType: "Int",
    default: "15",
  },

  // Find Team
  "utils.find_team.enabled": {
    prismaField: "findTeamEnabled",
    prismaType: "Boolean",
    default: "false",
  },
  "utils.find_team.channel": {
    prismaField: "findTeamChannel",
    prismaType: "String",
    optional: true,
  },
  "utils.find_team.send_channel": {
    prismaField: "findTeamSendChannel",
    prismaType: "String",
    optional: true,
  },
  "utils.find_team.games": {
    prismaField: "findTeamGames",
    prismaType: "Json",
    default: '"[]"',
  },

  // Components
  "utils.components.modals": {
    prismaField: "customModals",
    prismaType: "Json",
    default: '"[]"',
  },
  "utils.components.embed": {
    prismaField: "customEmbeds",
    prismaType: "Json",
    default: '"[]"',
  },
  "utils.components.buttons": {
    prismaField: "customButtons",
    prismaType: "Json",
    default: '"[]"',
  },

  // Giveaways
  "utils.giveaways": {
    prismaField: "giveaways",
    prismaType: "Json",
    default: '"[]"',
  },

  // Economy
  "economy.currency.emoji": {
    prismaField: "currencyEmoji",
    prismaType: "String",
    optional: true,
  },
  "economy.currency.id": {
    prismaField: "currencyId",
    prismaType: "String",
    optional: true,
  },
  "economy.shop.roles": {
    prismaField: "shopRoles",
    prismaType: "Json",
    default: '"[]"',
  },

  // Economy Income
  "economy.income.work.enabled": {
    prismaField: "workEnabled",
    prismaType: "Boolean",
    default: "false",
  },
  "economy.income.work.cooldown": {
    prismaField: "workCooldown",
    prismaType: "Int",
    default: "1800",
  },
  "economy.income.work.min": {
    prismaField: "workMin",
    prismaType: "Int",
    default: "100",
  },
  "economy.income.work.max": {
    prismaField: "workMax",
    prismaType: "Int",
    default: "500",
  },
  "economy.income.timely.enabled": {
    prismaField: "timelyEnabled",
    prismaType: "Boolean",
    default: "false",
  },
  "economy.income.timely.amount": {
    prismaField: "timelyAmount",
    prismaType: "Int",
    default: "400",
  },
  "economy.income.daily.enabled": {
    prismaField: "dailyEnabled",
    prismaType: "Boolean",
    default: "false",
  },
  "economy.income.daily.amount": {
    prismaField: "dailyAmount",
    prismaType: "Int",
    default: "800",
  },
  "economy.income.weekly.enabled": {
    prismaField: "weeklyEnabled",
    prismaType: "Boolean",
    default: "false",
  },
  "economy.income.weekly.amount": {
    prismaField: "weeklyAmount",
    prismaType: "Int",
    default: "3000",
  },
  "economy.income.level_up.enabled": {
    prismaField: "levelUpEnabled",
    prismaType: "Boolean",
    default: "false",
  },
  "economy.income.level_up.amount": {
    prismaField: "levelUpAmount",
    prismaType: "Int",
    default: "250",
  },
  "economy.income.bump.enabled": {
    prismaField: "bumpEnabled",
    prismaType: "Boolean",
    default: "false",
  },
  "economy.income.bump.amount": {
    prismaField: "bumpAmount",
    prismaType: "Int",
    default: "350",
  },
  "economy.income.rob.enabled": {
    prismaField: "robEnabled",
    prismaType: "Boolean",
    default: "false",
  },
  "economy.income.rob.cooldown": {
    prismaField: "robCooldown",
    prismaType: "Int",
    default: "3600",
  },
  "economy.income.rob.income": {
    prismaField: "robIncome",
    prismaType: "Json",
    default: '"{\\"min\\":100,\\"max\\":500,\\"type\\":\\"fixed\\"}"',
  },
  "economy.income.rob.punishment": {
    prismaField: "robPunishment",
    prismaType: "Json",
    default: '"{\\"min\\":10,\\"max\\":50,\\"type\\":\\"fixed\\",\\"fail_chance\\":25}"',
  },

  // Moderation
  "moderation.moderation_roles": {
    prismaField: "moderationRoles",
    prismaType: "String",
    isArray: true,
    default: "[]",
  },

  // Auto Moderation - Invites
  "moderation.auto_moderation.invite.enabled": {
    prismaField: "inviteEnabled",
    prismaType: "Boolean",
    default: "false",
  },
  "moderation.auto_moderation.invite.ignore_channels": {
    prismaField: "inviteIgnoreChannels",
    prismaType: "String",
    isArray: true,
    default: "[]",
  },
  "moderation.auto_moderation.invite.ignore_roles": {
    prismaField: "inviteIgnoreRoles",
    prismaType: "String",
    isArray: true,
    default: "[]",
  },
  "moderation.auto_moderation.invite.delete_message": {
    prismaField: "inviteDeleteMessage",
    prismaType: "Boolean",
    default: "false",
  },
  "moderation.auto_moderation.invite.moderation_immune": {
    prismaField: "inviteModerationImmune",
    prismaType: "Boolean",
    default: "false",
  },
  "moderation.auto_moderation.invite.punishment": {
    prismaField: "invitePunishment",
    prismaType: "Json",
    default: '"{\\"type\\":\\"warn\\",\\"time\\":0,\\"reason\\":\\"Auto moderation\\"}"',
  },

  // Auto Moderation - Links
  "moderation.auto_moderation.links.enabled": {
    prismaField: "linksEnabled",
    prismaType: "Boolean",
    default: "false",
  },
  "moderation.auto_moderation.links.ignore_channels": {
    prismaField: "linksIgnoreChannels",
    prismaType: "String",
    isArray: true,
    default: "[]",
  },
  "moderation.auto_moderation.links.ignore_roles": {
    prismaField: "linksIgnoreRoles",
    prismaType: "String",
    isArray: true,
    default: "[]",
  },
  "moderation.auto_moderation.links.ignore_links": {
    prismaField: "linksIgnoreLinks",
    prismaType: "String",
    isArray: true,
    default: "[]",
  },
  "moderation.auto_moderation.links.delete_message": {
    prismaField: "linksDeleteMessage",
    prismaType: "Boolean",
    default: "false",
  },
  "moderation.auto_moderation.links.moderation_immune": {
    prismaField: "linksModerationImmune",
    prismaType: "Boolean",
    default: "false",
  },
  "moderation.auto_moderation.links.punishment": {
    prismaField: "linksPunishment",
    prismaType: "Json",
    default: '"{\\"type\\":\\"warn\\",\\"time\\":0,\\"reason\\":\\"Auto moderation\\"}"',
  },

  // Permissions
  "permissions.commands": {
    prismaField: "commandPermissions",
    prismaType: "Json",
    default: '"{}"',
  },

  "temp.join_to_create.map": {
    prismaField: "jtcTempMap",
    prismaType: "Json",
    default: '"{}"',
  },
};

/**
 * User schema mapping based on UserSchema interface
 */
const userSchemaMap: Record<string, SchemaField> = {
  // Custom Balance
  "custom.balance.number": {
    prismaField: "balanceNumber",
    prismaType: "String",
  },
  "custom.balance.mode": {
    prismaField: "balanceMode",
    prismaType: "Boolean",
    default: "false",
  },
  "custom.balance.solid": {
    prismaField: "balanceSolid",
    prismaType: "Json",
    default:
      '"{\\"bg_color\\":\\"#000000\\",\\"first_component\\":\\"#ffffff\\",\\"second_component\\":\\"#C30F45\\",\\"third_component\\":\\"#422242\\"}"',
  },
  "custom.balance.url": {
    prismaField: "balanceUrl",
    prismaType: "String",
    optional: true,
  },

  // Custom Profile
  "custom.profile.bio": {
    prismaField: "profileBio",
    prismaType: "String",
    default: '""',
  },
  "custom.profile.mode": {
    prismaField: "profileMode",
    prismaType: "Boolean",
    default: "false",
  },
  "custom.profile.solid": {
    prismaField: "profileSolid",
    prismaType: "Json",
    default:
      '"{\\"bg_color\\":\\"#000000\\",\\"first_component\\":\\"#422242\\",\\"second_component\\":\\"#C30F45\\",\\"third_component\\":\\"#422242\\"}"',
  },
  "custom.profile.url": {
    prismaField: "profileUrl",
    prismaType: "String",
    optional: true,
  },
  "custom.profile.color": {
    prismaField: "profileColor",
    prismaType: "String",
    optional: true,
  },
  "custom.profile.icons": {
    prismaField: "profileIcons",
    prismaType: "Json",
    default: '"[]"',
  },
  "custom.profile.icons_padding": {
    prismaField: "profileIconsPadding",
    prismaType: "Json",
    default: '"{\\"x\\":10,\\"y\\":10}"',
  },

  // Custom Rank
  "custom.rank.mode": {
    prismaField: "rankMode",
    prismaType: "Boolean",
    default: "false",
  },
  "custom.rank.solid": {
    prismaField: "rankSolid",
    prismaType: "Json",
    default:
      '"{\\"bg_color\\":\\"#000000\\",\\"first_component\\":\\"#ffffff\\",\\"second_component\\":\\"#C30F45\\",\\"third_component\\":\\"#422242\\"}"',
  },
  "custom.rank.url": {
    prismaField: "rankUrl",
    prismaType: "String",
    optional: true,
  },
  "custom.rank.color": {
    prismaField: "rankColor",
    prismaType: "String",
    optional: true,
  },

  // Custom Level Up
  "custom.level_up.mode": {
    prismaField: "levelupMode",
    prismaType: "Boolean",
    default: "false",
  },
  "custom.level_up.solid": {
    prismaField: "levelupSolid",
    prismaType: "Json",
    default:
      '"{\\"bg_color\\":\\"#000000\\",\\"first_component\\":\\"#ffffff\\",\\"second_component\\":\\"#422242\\",\\"third_component\\":\\"#C30F45\\"}"',
  },
  "custom.level_up.url": {
    prismaField: "levelupUrl",
    prismaType: "String",
    optional: true,
  },

  // Custom Badges
  "custom.badges": {
    prismaField: "customBadges",
    prismaType: "Json",
    default: '"[]"',
  },

  // Temp
  "temp.games": {
    prismaField: "tempGames",
    prismaType: "Json",
    default: '"{}"',
  },
  "temp.voice_time": {
    prismaField: "tempVoiceTime",
    prismaType: "Int",
    default: "0",
  },

  // Presets
  "presets.jtc": {
    prismaField: "jtcPresets",
    prismaType: "Json",
    default: '"[]"',
  },
};

/**
 * Build path hierarchy to support parent paths
 */
function buildPathHierarchy(schemaMap: Record<string, SchemaField>): PathMapping {
  const hierarchy: PathMapping = {};
  const paths = Object.keys(schemaMap);

  // Add all leaf paths
  for (const fullPath of paths) {
    const field = schemaMap[fullPath];
    hierarchy[fullPath] = {
      field: field.prismaField,
    };
  }

  // Build all parent paths (including intermediate ones)
  const parentPaths = new Map<string, Set<string>>();

  for (const fullPath of paths) {
    const parts = fullPath.split(".");

    // Build all possible parent paths for this leaf
    for (let i = 1; i < parts.length; i++) {
      const parentPath = parts.slice(0, i).join(".");
      const childKey = parts[i]; // The immediate child key

      if (!parentPaths.has(parentPath)) {
        parentPaths.set(parentPath, new Set());
      }
      parentPaths.get(parentPath)!.add(childKey);
    }
  }

  // Also check if any existing path is a parent of another path (for direct children like utils.giveaways)
  for (const fullPath of paths) {
    const parts = fullPath.split(".");
    if (parts.length >= 2) {
      // Check if this path's parent should have it as a direct child
      const parentPath = parts.slice(0, -1).join(".");
      const childKey = parts[parts.length - 1];

      // If the parent path is not a leaf path, add this as a child
      if (!schemaMap[parentPath]) {
        if (!parentPaths.has(parentPath)) {
          parentPaths.set(parentPath, new Set());
        }
        parentPaths.get(parentPath)!.add(childKey);
      }
    }
  }

  // Add parent paths with their children
  for (const [parentPath, childrenSet] of parentPaths) {
    // Skip if this is a leaf path (already added above)
    if (schemaMap[parentPath]) continue;

    hierarchy[parentPath] = {
      field: "", // Parent paths don't map to a single field
      children: Array.from(childrenSet).sort(),
    };
  }

  return hierarchy;
}

/**
 * Generate mapping file
 */
function generateMapping(
  name: string,
  schemaMap: Record<string, SchemaField>,
  outputPath: string,
): void {
  const hierarchy = buildPathHierarchy(schemaMap);

  const content = `/**
 * Auto-generated ${name} path mapping
 * DO NOT EDIT MANUALLY - Generated by scripts/generate-schema.ts
 */

export interface PathMap {
  [path: string]: {
    field: string;
    children?: string[];
  };
}

export const ${name}PathMap: PathMap = ${JSON.stringify(hierarchy, null, 2)};

export const ${name}FieldMap: Record<string, string> = ${JSON.stringify(
    Object.fromEntries(Object.entries(schemaMap).map(([path, field]) => [path, field.prismaField])),
    null,
    2,
  )};
`;

  fs.writeFileSync(outputPath, content, "utf-8");
  console.log(`✓ Generated ${name} mapping at ${outputPath}`);
}

/**
 * Main execution
 */
function main(): void {
  console.log("🔧 Generating schema mappings...\n");

  const mappingsDir = path.join(__dirname, "..", "src", "database", "mappings");
  if (!fs.existsSync(mappingsDir)) {
    fs.mkdirSync(mappingsDir, { recursive: true });
  }

  // Generate Guild mapping
  generateMapping("Guild", guildSchemaMap, path.join(mappingsDir, "GuildMapping.ts"));

  // Generate User mapping
  generateMapping("User", userSchemaMap, path.join(mappingsDir, "UserMapping.ts"));

  console.log("\n✅ All mappings generated successfully!");
}

main();
