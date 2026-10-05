import { Client, Guild } from "discord.js";
import { Guild as GuildClass } from "../../helpers/Guild";
import { reconcileAutoModeration } from "../../handlers/autoModeration";

module.exports = async (client: Client, guild: Guild) => {
  new GuildClass(client, guild);
  await reconcileAutoModeration(client, guild);
};
