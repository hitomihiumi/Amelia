import { Manifest } from "../../types/helpers";
import { InteractionContextType, PermissionsBitField } from "discord.js";

export const manifest = {
  name: "user",
  description: "Category sub-commands for viewing user information",
  locale: {
    ru: "Категория саб-команд для просмотра информации о пользователе",
  },
  permissions: {},
  commands: {},
  context: [InteractionContextType.Guild],
} as Manifest;
