import { Client, Guild } from "discord.js";
import { Guild as GuildClass } from "../../helpers/Guild";

module.exports = async (client: Client, guild: Guild) => {
    new GuildClass(client, guild);
};
