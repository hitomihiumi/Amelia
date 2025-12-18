import { Manifest } from "../../types/helpers";
import { InteractionContextType, PermissionsBitField } from "discord.js";

export const manifest = {
  name: "util",
  description: "Category sub-commands of various utilities",
  locale: {
    ru: "Категория саб-команд различных утилит",
    uk: "Категорія саб-команд різних утиліт",
  },
  permissions: {
    user: PermissionsBitField.Flags.Administrator,
  },
  commands: {},
  context: [InteractionContextType.Guild],
} as Manifest;
