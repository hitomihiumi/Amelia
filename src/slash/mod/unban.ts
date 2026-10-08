import { SlashCommand } from "../../types/helpers";
import {Client, ChatInputCommandInteraction, PermissionsBitField, MessageFlagsBitField} from "discord.js";
import { defaultPermissions } from "../../helpers";
import {
  prepareModeration,
  replyError,
  replySuccess,
  resolveReason,
} from "../../helpers/moderation";
import { prisma } from "../../database";
import { t } from "../../i18n/helpers";

module.exports = {
  name: "unban",
  description: "✅ Lift a ban.",
  cooldown: 3,
  locale: {
    ru: "✅ Снять бан с пользователя.",
    uk: "✅ Зняти блокування з користувача.",
  },
  options: [
    {
      name: "user",
      description: "User to unban",
      required: true,
      type: "USER",
      local: { ru: "Пользователь для разбана", uk: "Користувач для розблокування" },
    },
    {
      name: "reason",
      description: "Reason for the unban",
      required: false,
      type: "STRING",
      local: { ru: "Причина разбана", uk: "Причина розблокування" },
    },
  ],
  permissions: {
    bot: [...defaultPermissions, PermissionsBitField.Flags.BanMembers],
  },
  run: async (client: Client, interaction: ChatInputCommandInteraction) => {
    const ctx = await prepareModeration(client, interaction);
    if (!ctx) return;

    const user = interaction.options.getUser("user", true);

    const ban = await interaction.guild!.bans.fetch(user.id).catch(() => null);
    if (!ban) {
      return replyError(
        client,
        interaction,
        ctx.lang,
        t(client, ctx.lang, "moderation.errors.not_banned"),
      );
    }

    await interaction.deferReply({ flags: MessageFlagsBitField.Flags.Ephemeral });

    const reason = resolveReason(client, interaction, ctx.lang);

    // Prefer revoking the stored case so the ban case is closed as well.
    const storedBan = await prisma.moderationCase.findFirst({
      where: {
        guildId: interaction.guild!.id,
        targetId: user.id,
        type: "ban",
        active: true,
      },
      orderBy: { caseNumber: "desc" },
    });

    const result = storedBan
      ? await ctx.service.revoke({
          caseNumber: storedBan.caseNumber,
          moderatorId: interaction.user.id,
          reason,
        })
      : await (async () => {
          await interaction.guild!.bans.remove(user.id, reason).catch(() => null);
          return await ctx.service.punish({
            type: "unban",
            targetId: user.id,
            moderatorId: interaction.user.id,
            reason,
          });
        })();

    if (!result.ok) {
      return replyError(client, interaction, ctx.lang, result.error);
    }

    await replySuccess(
      client,
      interaction,
      ctx.lang,
      t(
        client,
        ctx.lang,
        "commands.mod.unban.success",
        user.toString(),
        String(result.case.caseNumber),
      ),
    );
  },
} as SlashCommand;
