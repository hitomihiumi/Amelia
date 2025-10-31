import { Command, Levels } from "../../types/helpers";
import { Client, ChannelType, Message, AttachmentBuilder } from "discord.js";
import { Guild } from "../../helpers";
import { onCoolDown, escapeRegex, getNextLevelXP } from "../../handlers/functions";
import { t } from "../../i18n/helpers";
import { LevelCard } from "../../helpers/canvas/LevelCard";

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
  if (!prefixRegex.test(message.content)) {

      const levelS = (await guild.get("utils.levels")) as Levels;

      if (levelS.enabled) {
          const member = guild.getUser(message.author.id);

          const rand = Math.floor(Math.random() * 2) + 1;

          await member.add("level.total_xp", rand);
          await member.add("level.xp", rand);
          await member.add("level.message_count", 1);

          if (getNextLevelXP(await member.get("level.level")) <= (await member.get("level.xp"))) {
              await member.add("level.level", 1);
              await member.set("level.xp", 0);

              const card = new LevelCard({
                  avatar: message.author.displayAvatarURL({ size: 512, extension: "png" }),
                  data: {
                      level: await member.get("level.level"),
                  },
                  displayOptions: await member.get("custom.level_up"),
              });

              const buffer = await card.render();
              if (!buffer) return;

              const attachment = new AttachmentBuilder(buffer, { name: "levelup.png" });

              return message.reply({
                  content: t(client, lang, "events.message_create.level_up", message.member),
                  files: [attachment],
              });
          }
      }

      return;
  }

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
