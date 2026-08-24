import { SlashCommand } from "../../types/helpers";
import {
  Client,
  ChatInputCommandInteraction,
  ChannelType,
  PermissionsBitField,
  TextChannel, MessageFlags, MessageFlagsBitField,
} from "discord.js";
import { defaultPermissions } from "../../helpers";
import {
  parseDuration,
  prepareModeration,
  replyError,
  replySuccess,
} from "../../helpers/moderation";
import { t } from "../../i18n/helpers";

/** Discord allows up to 6 hours of slowmode. */
const MAX_SLOWMODE_SECONDS = 21600;

module.exports = {
  name: "slowmode",
  description: "🐌 Set the slowmode of a channel.",
  cooldown: 3,
  locale: {
    ru: "🐌 Настроить медленный режим канала.",
    uk: "🐌 Налаштувати повільний режим каналу.",
  },
  options: [
    {
      name: "duration",
      description: "Slowmode duration, for example 10s or 5m. Use 0 to disable",
      required: true,
      type: "STRING",
      local: {
        ru: "Длительность, например 10s или 5m. 0 — отключить",
        uk: "Тривалість, наприклад 10s або 5m. 0 — вимкнути",
      },
    },
    {
      name: "channel",
      description: "Channel to configure (defaults to the current one)",
      required: false,
      type: "CHANNEL",
      local: {
        ru: "Канал для настройки (по умолчанию текущий)",
        uk: "Канал для налаштування (за замовчуванням поточний)",
      },
    },
  ],
  permissions: {
    bot: [...defaultPermissions, PermissionsBitField.Flags.ManageChannels],
  },
  run: async (client: Client, interaction: ChatInputCommandInteraction) => {
    const ctx = await prepareModeration(client, interaction);
    if (!ctx) return;

    const raw = interaction.options.getString("duration", true).trim();
    const seconds = raw === "0" ? 0 : parseDuration(raw);

    if (seconds === null || seconds > MAX_SLOWMODE_SECONDS) {
      return replyError(
        client,
        interaction,
        ctx.lang,
        t(client, ctx.lang, "moderation.errors.invalid_duration"),
      );
    }

    const channel = interaction.options.getChannel("channel") ?? interaction.channel;

    if (!channel || channel.type !== ChannelType.GuildText) {
      return replyError(
        client,
        interaction,
        ctx.lang,
        t(client, ctx.lang, "moderation.errors.action_failed", "invalid channel"),
      );
    }

    await interaction.deferReply({ flags: MessageFlagsBitField.Flags.Ephemeral });

    const updated = await (channel as TextChannel)
      .setRateLimitPerUser(seconds, `Slowmode by ${interaction.user.tag}`)
      .catch((error: any) => ({ error: error?.message ?? "unknown error" }) as const);

    if (updated && "error" in updated) {
      return replyError(
        client,
        interaction,
        ctx.lang,
        t(client, ctx.lang, "moderation.errors.action_failed", updated.error),
      );
    }

    await replySuccess(
      client,
      interaction,
      ctx.lang,
      seconds === 0
        ? t(client, ctx.lang, "commands.mod.slowmode.disabled")
        : t(
            client,
            ctx.lang,
            "commands.mod.slowmode.success",
            await ctx.service.formatDuration(seconds, ctx.lang),
          ),
    );
  },
} as SlashCommand;
