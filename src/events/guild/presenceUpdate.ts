import { Client, Presence } from "discord.js";

module.exports = async (client: Client, oldPresence: Presence, newPresence: Presence) => {
  if (!newPresence.activities) return;
  if (!newPresence.guild) return;
};
