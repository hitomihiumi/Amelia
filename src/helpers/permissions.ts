import { PermissionsBitField } from "discord.js";

export const defaultPermissions = [
  PermissionsBitField.Flags.SendMessages,
  PermissionsBitField.Flags.EmbedLinks,
  PermissionsBitField.Flags.AttachFiles,
];
