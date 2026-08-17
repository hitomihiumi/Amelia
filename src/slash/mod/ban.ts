import { SlashCommand } from "../../types/helpers";
import { Client, ChatInputCommandInteraction, PermissionsBitField } from "discord.js";
import { defaultPermissions } from "../../helpers";
import {
  ensureCanActOn,
  parseDuration,
  prepareModeration,
  replyError,
  replySuccess,
  resolveReason,
} from "../../helpers/moderation";
import { t } from "../../i18n/helpers";

module.exports = {
  name: "ban",
  description: "🔨 Ban a user, permanently or for a limited time.",
  cooldown: 3,
  locale: {
    ru: "🔨 Забанить пользователя навсегда или на время.",
    uk: "🔨 Заблокувати користувача назавжди або на час.",
  },
  options: [
    {
      name: "user",
      description: "User to ban",
      required: true,
      type: "USER",
      local: { ru: "Пользователь для бана", uk: "Користувач для блокування" },
    },
    {
      name: "duration",
      description: "Ban duration, for example 7d. Leave empty for a permanent ban",
      required: false,
      type: "STRING",
      local: {
        ru: "Длительность бана, например 7d. Пусто — навсегда",
        uk: "Тривалість блокування, наприклад 7d. Порожньо — назавжди",
      },
    },
    {
      name: "reason",
      description: "Reason for the ban",
      required: false,
      type: "STRING",
      local: { ru: "Причина бана", uk: "Причина блокування" },
    },
    {
      name: "delete_days",
      description: "Delete the messages of this user from the last N days (0-7)",
      required: false,
      type: "INTEGER",
      min: 0,
      max: 7,
      local: {
        ru: "Удалить сообщения пользователя за последние N дней (0-7)",
        uk: "Видалити повідомлення користувача за останні N днів (0-7)",
      },
    },
  ],
  permissions: {
    bot: [...defaultPermissions, PermissionsBitField.Flags.BanMembers],
  },
  run: async (client: Client, interaction: ChatInputCommandInteraction) => {
    const ctx = await prepareModeration(client, interaction);
    if (!ctx) return;

    const user = interaction.options.getUser("user", true);
    const durationRaw = interaction.options.getString("duration");
    const duration = durationRaw ? parseDuration(durationRaw) : null;

    if (durationRaw && !duration) {
      return replyError(
        client,
        interaction,
        ctx.lang,
        t(client, ctx.lang, "moderation.errors.invalid_duration"),
      );
    }

    // The user may already be gone from the server — that is a valid ban target.
    const member = await ctx.service.fetchMember(user.id);
    if (member && !(await ensureCanActOn(client, interaction, ctx, member))) return;

    const existingBan = await interaction.guild!.bans.fetch(user.id).catch(() => null);
    if (existingBan) {
      return replyError(
        client,
        interaction,
        ctx.lang,
        t(client, ctx.lang, "commands.mod.ban.already"),
      );
    }

    await interaction.deferReply();

    const deleteDays = interaction.options.getInteger("delete_days") ?? 0;

    const result = await ctx.service.punish({
      type: "ban",
      targetId: user.id,
      moderatorId: interaction.user.id,
      reason: resolveReason(client, interaction, ctx.lang),
      duration,
      deleteMessageSeconds: deleteDays * 24 * 60 * 60,
    });

    if (!result.ok) {
      return replyError(client, interaction, ctx.lang, result.error);
    }

    const message = duration
      ? t(
          client,
          ctx.lang,
          "commands.mod.ban.temporary",
          user.toString(),
          await ctx.service.formatDuration(duration, ctx.lang),
          String(result.case.caseNumber),
        )
      : t(
          client,
          ctx.lang,
          "commands.mod.ban.success",
          user.toString(),
          String(result.case.caseNumber),
        );

    await replySuccess(client, interaction, ctx.lang, message);
  },
} as SlashCommand;
