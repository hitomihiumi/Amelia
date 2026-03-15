import { Manifest } from "../../types/helpers";
import { InteractionContextType, PermissionsBitField } from "discord.js";

export const manifest = {
  name: "eco",
  description: "🏦 Category sub-commands for economy",
  locale: {
    ru: "🏦 Категория экономических саб-команд",
    uk: "🏦 Категорія економічних саб-команд",
  },
  permissions: {},
  commands: {},
  context: [InteractionContextType.Guild],
} as Manifest;
