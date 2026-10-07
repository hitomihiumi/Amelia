import { SlashCommand } from "../../types/helpers";
import { ChatInputCommandInteraction, Client, MessageFlagsBitField } from "discord.js";
import { defaultPermissions, Guild } from "../../helpers";
import { t } from "../../i18n/helpers";
import {
  chat,
  describeFailure,
  hasAiAccess,
  isAiConfigured,
  loadAiSettings,
  markAiReply,
  splitReply,
} from "../../helpers/ai";

module.exports = {
  name: "ask",
  description: "💬 Ask Amelia something.",
  cooldown: 3,
  locale: {
    ru: "💬 Задать вопрос Амелии.",
    uk: "💬 Поставити запитання Амелії.",
  },
  options: [
    {
      name: "message",
      description: "What do you want to say to her?",
      required: true,
      type: "STRING",
      local: {
        ru: "Что ты хочешь ей сказать?",
        uk: "Що ти хочеш їй сказати?",
      },
    },
  ],
  permissions: {
    bot: [...defaultPermissions],
  },
  run: async (client: Client, interaction: ChatInputCommandInteraction) => {
    if (!interaction.guild || !interaction.channel) return;

    const guild = new Guild(client, interaction.guild);
    const lang = (await guild.get("settings.language")) as string;
    const refuse = (
      key: "ai.not_configured" | "ai.premium_required" | "ai.disabled" | "ai.channel_ignored",
    ) =>
      interaction.reply({
        content: t(client, lang, key),
        flags: MessageFlagsBitField.Flags.Ephemeral,
      });

    if (!isAiConfigured()) return refuse("ai.not_configured");
    if (!(await hasAiAccess(interaction.guild.id))) return refuse("ai.premium_required");

    const settings = await loadAiSettings(guild);
    if (!settings.enabled) return refuse("ai.disabled");

    const channel = interaction.channel;
    const parentId = "parentId" in channel ? channel.parentId : null;
    if (
      settings.ignore_channels.includes(channel.id) ||
      (parentId && settings.ignore_channels.includes(parentId))
    ) {
      return refuse("ai.channel_ignored");
    }

    await interaction.deferReply();

    const member = interaction.guild.members.cache.get(interaction.user.id);
    const text = interaction.options.getString("message", true);

    const result = await chat({
      guildId: interaction.guild.id,
      guildName: interaction.guild.name,
      channelId: channel.id,
      channelName: "name" in channel ? channel.name : null,
      userId: interaction.user.id,
      userName: member?.displayName ?? interaction.user.displayName,
      text,
      lang,
      settings,
    });

    if (!result.ok) {
      const notice = describeFailure(client, lang, result) ?? t(client, lang, "ai.failure.error");
      await interaction.deleteReply().catch(() => null);
      return interaction.followUp({ content: notice, flags: MessageFlagsBitField.Flags.Ephemeral });
    }

    const [first, ...rest] = splitReply(result.text).slice(0, 2);
    const options = { allowedMentions: { parse: [] as never[] } };

    const sent = await interaction.editReply({ content: first, ...options });
    await markAiReply(sent.id);

    for (const chunk of rest) {
      const followUp = await interaction.followUp({ content: chunk, ...options });
      await markAiReply(followUp.id);
    }
  },
} as SlashCommand;
