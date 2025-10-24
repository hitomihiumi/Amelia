import { Command } from "../../types/helpers";
import * as DJS from "discord.js";
import { inspect } from "util";
import { Guild, User } from "../../helpers";

module.exports = {
  name: `eval`,
  category: `Owner`,
  aliases: [`evaluate`, "evaluate", "eval"],
  description: `Тестовая команда!`,
  allowedUsers: ["991777093312585808"],
  cooldown: 0,
  run: async (client, message, args) => {
    try {
      const guild = new Guild(client, message.guild as DJS.Guild);
      const user = new User(client, message.author as DJS.User, message.guild as DJS.Guild);

      let evaled;

      if (args.join(` `).includes(`token`)) return console.log(`ERROR NO TOKEN GRABBING ;)`.red);

      evaled = await eval(args.join(` `));

      let string = inspect(evaled);

      if (string.includes(client.token as string))
        return console.log(`ERROR NO TOKEN GRABBING ;)`.red);

      let evalEmbed = new DJS.EmbedBuilder()
        .setTitle(`${client?.user?.username}`)
        .setColor(client.holder.colors.default);

      const splitDescription = splitMessage(string, {
        maxLength: 4000,
        char: `\n`,
        prepend: ``,
        append: ``,
      });

      let embeds: any[] = [];

      for (const m of splitDescription) {
        evalEmbed.setDescription(`\`\`\`` + m + `\`\`\``);
        embeds.push(evalEmbed);
      }
      message.reply({ embeds: embeds });
    } catch (e: any) {
      return message.reply({
        embeds: [
          new DJS.EmbedBuilder()
            .setColor(client.holder.colors.error)
            .setTitle(`ОШИБКА | Кажется в боте произошла какая-то ошибка`)
            .setDescription(
              `\`\`\`${e.message ? String(e.message).substr(0, 2000) : String(e).substr(0, 2000)}\`\`\``,
            ),
        ],
      });
    }
  },
} as Command;

function splitMessage(
  text: any,
  { maxLength = 2_000, char = "\n", prepend = "", append = "" } = {},
) {
  text = verifyString(text);
  if (text.length <= maxLength) return [text];
  let splitText = [text];
  if (Array.isArray(char)) {
    while (char.length > 0 && splitText.some((elem) => elem.length > maxLength)) {
      const currentChar = char.shift();
      if (currentChar instanceof RegExp) {
        splitText = splitText.flatMap((chunk) => chunk.match(currentChar));
      } else {
        splitText = splitText.flatMap((chunk) => chunk.split(currentChar));
      }
    }
  } else {
    splitText = text.split(char);
  }
  if (splitText.some((elem) => elem.length > maxLength)) throw new RangeError("SPLIT_MAX_LEN");
  const messages = [];
  let msg = "";
  for (const chunk of splitText) {
    if (msg && (msg + char + chunk + append).length > maxLength) {
      messages.push(msg + append);
      msg = prepend;
    }
    msg += (msg && msg !== prepend ? char : "") + chunk;
  }
  return messages.concat(msg).filter((m) => m);
}

function verifyString(
  data: any,
  error = Error,
  errorMessage = `Expected a string, got ${data} instead.`,
  allowEmpty = true,
) {
  if (typeof data !== "string") throw new error(errorMessage);
  if (!allowEmpty && data.length === 0) throw new error(errorMessage);
  return data;
}
