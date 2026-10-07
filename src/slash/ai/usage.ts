import { SlashCommand } from "../../types/helpers";
import { ChatInputCommandInteraction, Client, MessageFlagsBitField } from "discord.js";
import { defaultPermissions, Guild } from "../../helpers";
import { t } from "../../i18n/helpers";
import { clampLimits } from "../../types/helpers";
import { getAiConfig, getUsage, hasAiAccess, loadAiSettings } from "../../helpers/ai";

module.exports = {
  name: "usage",
  description: "📊 See how much of your AI chat limits you have used.",
  cooldown: 5,
  locale: {
    ru: "📊 Посмотреть, сколько лимитов чата с ИИ ты использовал.",
    uk: "📊 Подивитися, скільки лімітів чату зі ШІ ти використав.",
  },
  options: [],
  permissions: {
    bot: [...defaultPermissions],
  },
  run: async (client: Client, interaction: ChatInputCommandInteraction) => {
    if (!interaction.guild) return;

    const guild = new Guild(client, interaction.guild);
    const lang = (await guild.get("settings.language")) as string;
    const settings = await loadAiSettings(guild);

    const blocked = !(await hasAiAccess(interaction.guild.id))
      ? "ai.premium_required"
      : !settings.enabled
        ? "ai.disabled"
        : null;
    if (blocked) {
      return interaction.reply({
        content: t(client, lang, blocked),
        flags: MessageFlagsBitField.Flags.Ephemeral,
      });
    }

    // The limits that really apply, under the ceilings of the administrators.
    const limits = clampLimits(settings.limits, (await getAiConfig()).caps);
    const usage = await getUsage(interaction.guild.id, interaction.user.id, limits);

    await interaction.reply({
      embeds: [
        client.holder.utils.fastEmbed({
          title: t(client, lang, "ai.usage.title"),
          description: t(
            client,
            lang,
            "ai.usage.description",
            usage.user_minute.used,
            usage.user_minute.limit,
            usage.user_day.used,
            usage.user_day.limit,
            usage.guild_day.used,
            usage.guild_day.limit,
          ),
        }),
      ],
      flags: MessageFlagsBitField.Flags.Ephemeral,
    });
  },
} as SlashCommand;
