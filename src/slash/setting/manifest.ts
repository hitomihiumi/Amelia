import { Manifest } from "../../types/helpers";
import { InteractionContextType, PermissionsBitField } from "discord.js";

export const manifest = {
  name: "setting",
  description: "Category sub-commands for bot settings",
  locale: {
    ru: "Категория саб-команд для настройки бота",
  },
  permissions: {
    user: PermissionsBitField.Flags.Administrator,
  },
  commands: {},
  context: [InteractionContextType.Guild],
} as Manifest;
