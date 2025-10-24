import { Manifest } from "../../types/helpers";
import { InteractionContextType, PermissionsBitField } from "discord.js";

export const manifest = {
  name: "custom",
  description: "Category sub-commands for creating custom bot elements",
  locale: {
    ru: "Категория саб-команд для создания кастомных элементов бота",
  },
  permissions: {
    user: PermissionsBitField.Flags.Administrator,
  },
  commands: {},
  context: [InteractionContextType.Guild],
} as Manifest;
