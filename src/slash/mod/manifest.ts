import { Manifest } from "../../types/helpers";
import { InteractionContextType, PermissionsBitField } from "discord.js";

export const manifest = {
  name: "mod",
  description: "🛡️ Category sub-commands for moderation",
  locale: {
    ru: "🛡️ Категория саб-команд для модерации",
    uk: "🛡️ Категорія саб-команд для модерації",
  },
  permissions: {
    user: PermissionsBitField.Flags.ModerateMembers,
  },
  commands: {},
  context: [InteractionContextType.Guild],
} as Manifest;
