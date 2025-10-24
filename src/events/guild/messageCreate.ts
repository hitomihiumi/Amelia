import { Command } from "../../types/helpers";
import { Client, ChannelType, Message } from "discord.js";
import { Guild } from "../../helpers";
import { onCoolDown, escapeRegex } from "../../handlers/functions";
import { t } from "../../i18n/helpers";

module.exports = async (client: Client, message: Message) => {
  if (message.author.bot) return;
  if (!client.user) return;
  if (message.channel.type === ChannelType.DM) return;
  if (message.partial) await message.fetch();
  if (!message.guild) return;

  const guild = new Guild(client, message.guild);

  const lang = await guild.get("settings.language");

  const prefix = await guild.get("settings.prefix");
  const prefixRegex = new RegExp(`^(<@!?${client.user.id}>|${escapeRegex(prefix)})\\s*`);
  if (!prefixRegex.test(message.content)) return;

  // @ts-ignore
  const [, matchedPrefix] = message.content.match(prefixRegex);
  const args = message.content.slice(matchedPrefix.length).trim().split(/ +/).filter(Boolean);
  const commandName = args.shift()?.toLowerCase() as string;

  if (!commandName || commandName.length === 0) {
    if (matchedPrefix.includes(client.user.id)) {
      return message.reply(t(client, lang, "events.message_create.prefix", prefix));
    }
  }

  const command =
    (client.holder.cmds.commands.get(commandName) as unknown as Command) ||
    (client.holder.cmds.aliases.get(commandName) as unknown as Command);
  if (!command) return;

  if (command) {
    if (onCoolDown(message, command, client)) {
      return message.reply({
        embeds: [
          client.holder.embed.error(
            lang,
            t(
              client,
              lang,
              "events.message_create.cooldown",
              onCoolDown(message, command, client),
              command.name,
            ),
          ),
        ],
      });
    }
    if (command.allowedUsers.length > 0 && !command.allowedUsers.includes(message.author.id)) {
      return;
    }
    await command.run(client, message, args);
  }
};
