import { Client, GatewayIntentBits, Partials, Collection, ColorResolvable } from "discord.js";
import "dotenv/config";
import "@hitomihiumi/colors.ts";
import { fastEmbed, foldersCheck, fullEmbed, reVar } from "./handlers/functions";
import { FileWatcher } from "@hitomihiumi/filewatcher";
import { commandLoader } from "./handlers/cmdLoaders";
import { initializeI18n } from "./i18n/locales";
import { prisma, DatabaseService } from "./database";
import { emojis } from "./emoji/emojis";

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
  },
  colors: {
    default: "#4a3f66",
    error: "#ff6b7f",
    success: "#6bff97",
    info: "#7dd8ff",
  },
  emojis,
};

// Connect to database before loading handlers
(async () => {
  await DatabaseService.connect();

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

  await client.login(process.env.PRODACTION ? process.env.TOKEN : process.env.DEV_TOKEN);
})();
