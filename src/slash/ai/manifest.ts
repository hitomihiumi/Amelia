import { Manifest } from "../../types/helpers";
import { InteractionContextType } from "discord.js";

export const manifest = {
  name: "ai",
  description: "🤖 Category sub-commands for chatting with the AI",
  locale: {
    ru: "🤖 Категория саб-команд для общения с ИИ",
    uk: "🤖 Категорія саб-команд для спілкування зі ШІ",
  },
  permissions: {},
  commands: {},
  context: [InteractionContextType.Guild],
} as Manifest;
