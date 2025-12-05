import { Client, GatewayIntentBits, Partials, Collection, ColorResolvable } from "discord.js";
import "dotenv/config";
import "@hitomihiumi/colors.ts";
import {
  fastButtons,
  fastEmbed,
  foldersCheck,
  fullEmbed,
  reVar,
  fastChannelSelect,
  fastRoleSelect,
  fastStringSelect,
  fastUserSelect,
  fastRow,
  fastStringOptions,
} from "./handlers/functions";
import { FileWatcher } from "@hitomihiumi/filewatcher";
import { commandLoader } from "./handlers/cmdLoaders";
import { initializeI18n } from "./i18n/locales";
import { prisma, DatabaseService, MongoDBService } from "./database";
import { emojis } from "./emoji/emojis";
import { iconsMap } from "./helpers/assetsMap";

foldersCheck();

const client = new Client({
  shards: "auto",
  allowedMentions: {
    parse: ["users", "roles"],
    repliedUser: false,
  },
  partials: [Partials.Message, Partials.Channel, Partials.Reaction],
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildBans,
    GatewayIntentBits.GuildEmojisAndStickers,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.GuildMessageTyping,
  ],
});

// Initialize the translation system
const i18nManager = initializeI18n();

client.holder = {
  cooldowns: new Collection(),
  cmds: {
    commands: new Collection(),
    slashCommands: new Collection(),
    aliases: new Collection(),
    cooldowns: new Collection(),
  },
  db: prisma,
  components: {
    buttons: new Collection(),
    modals: new Collection(),
    selectMenus: new Collection(),
    autocompletes: new Collection(),
  },
  i18n: i18nManager,
  embed: {
    error: (lang: string, desc: string) => {
      const i18n = i18nManager.get(lang) || i18nManager.getDefault();
      return fastEmbed(client.holder.colors.error, i18n.t("common.error.title"), desc);
    },
    success: (lang: string, desc: string) => {
      const i18n = i18nManager.get(lang) || i18nManager.getDefault();
      return fastEmbed(client.holder.colors.success, i18n.t("common.success.title"), desc);
    },
    info: (lang: string, desc: string) => {
      const i18n = i18nManager.get(lang) || i18nManager.getDefault();
      return fastEmbed(client.holder.colors.info, i18n.t("common.info.title"), desc);
    },
    fast: (color: ColorResolvable, title: string, desc: string) => {
      return fastEmbed(color, title, desc);
    },
  },
  utils: {
    reVar,
    fastEmbed: fullEmbed,
    fastButtons,
    fastStringSelect,
    fastRoleSelect,
    fastUserSelect,
    fastChannelSelect,
    fastStringOptions,
    fastRow,
  },
  colors: {
    default: "#7d7772",
    error: "#ff6b7f",
    success: "#6bff97",
    info: "#7dd8ff",
  },
  emojis,
  assets: {
    profileIcons: iconsMap,
  },
};

// Connect to database before loading handlers
(async () => {
  try {
    // Connect to PostgreSQL
    await DatabaseService.connect();

    // Connect to MongoDB for temp data cache
    await MongoDBService.connect();
  } catch (error) {
    console.error("Failed to connect to databases:".red, error);
    process.exit(1);
  }

  ["antiCrash", "events", "commands", "components", "slash", "joinToCreate"]
    .filter(Boolean)
    .forEach((handler: any) => {
      require(`./handlers/${handler}`)(client);
    });

  const watcher = new FileWatcher().setAllowedExtensions(".js", ".json");

  watcher.setHandler("./dist/slash", "change", (dir, file, relativePath) => {
    const loader = commandLoader(client);
    loader.reload(relativePath, file);
    console.log(`Reloaded ${file} in ${dir}`.green);
  });

  watcher.setMonitoredDirectories("./dist");

  watcher.startWatching();

  await client.login(Boolean(process.env.PRODACTION) ? process.env.DEV_TOKEN : process.env.TOKEN);
})();

// Graceful shutdown handler
const shutdown = async (signal: string) => {
  console.log(`\n${signal} received. Shutting down gracefully...`.yellow);

  try {
    // Disconnect from MongoDB
    await MongoDBService.disconnect();

    // Disconnect from PostgreSQL
    await DatabaseService.disconnect();

    // Destroy Discord client
    await client.destroy();

    console.log("Shutdown complete".green);
    process.exit(0);
  } catch (error) {
    console.error("Error during shutdown:".red, error);
    process.exit(1);
  }
};

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
