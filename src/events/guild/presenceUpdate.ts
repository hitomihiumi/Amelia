import { ModifiedClient } from "../../types/helpers";
import { Presence } from "discord.js";

module.exports = async (client: ModifiedClient, oldPresence: Presence, newPresence: Presence) => {
    if (!newPresence.activities) return;
    if (!newPresence.guild) return;
}
