import { Manifest } from "../../types/helpers";
import { InteractionContextType, PermissionsBitField } from "discord.js";

export const manifest = {
    name: "bot",
    description: "🤖 Category sub-commands for bot information",
    locale: {
        ru: "🤖 Категория саб-команд с информацией о боте",
        uk: "🤖 Категорія саб-команд з інформацією про бота",
    },
    permissions: {},
    commands: {},
    context: [InteractionContextType.Guild],
} as Manifest;
