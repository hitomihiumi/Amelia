import { SlashCommand } from "../../types/helpers";
import {
  Client,
  ChatInputCommandInteraction,
  Message,
  MessageFlagsBitField,
  PermissionsBitField,
  TextChannel,
} from "discord.js";
import { defaultPermissions } from "../../helpers";
import { prepareModeration, replyError } from "../../helpers/moderation";
import { t } from "../../i18n/helpers";

/** Discord refuses to bulk delete messages older than 14 days. */
const MAX_AGE_MS = 14 * 24 * 60 * 60 * 1000;

module.exports = {
  name: "purge",
  description: "🧹 Bulk delete recent messages in this channel.",
  cooldown: 5,
  locale: {
    ru: "🧹 Массово удалить последние сообщения в этом канале.",
    uk: "🧹 Масово видалити останні повідомлення в цьому каналі.",
  },
  options: [
    {
      name: "amount",
      description: "How many messages to scan (1-100)",
      required: true,
      type: "INTEGER",
      min: 1,
      max: 100,
      local: {
        ru: "Сколько сообщений просмотреть (1-100)",
        uk: "Скільки повідомлень переглянути (1-100)",
      },
    },
    {
      name: "user",
      description: "Only delete messages from this user",
      required: false,
      type: "USER",
      local: {
        ru: "Удалять только сообщения этого пользователя",
        uk: "Видаляти лише повідомлення цього користувача",
      },
    },
    {
      name: "contains",
      description: "Only delete messages containing this text",
      required: false,
      type: "STRING",
      local: {
        ru: "Удалять только сообщения с этим текстом",
        uk: "Видаляти лише повідомлення з цим текстом",
      },
    },
  ],
  permissions: {
    bot: [...defaultPermissions, PermissionsBitField.Flags.ManageMessages],
  },
  run: async (client: Client, interaction: ChatInputCommandInteraction) => {
    const ctx = await prepareModeration(client, interaction);
    if (!ctx) return;

    const channel = interaction.channel;
    if (!channel || !("bulkDelete" in channel)) {
      return replyError(
        client,
        interaction,
        ctx.lang,
        t(client, ctx.lang, "commands.mod.purge.empty"),
      );
    }

    await interaction.deferReply({ flags: MessageFlagsBitField.Flags.Ephemeral });

    const amount = interaction.options.getInteger("amount", true);
    const user = interaction.options.getUser("user");
    const contains = interaction.options.getString("contains")?.toLowerCase();

    const fetched = await channel.messages.fetch({ limit: amount });
    const now = Date.now();

    const target = fetched.filter((message: Message) => {
      if (now - message.createdTimestamp >= MAX_AGE_MS) return false;
      if (message.pinned) return false;
      if (user && message.author.id !== user.id) return false;
      if (contains && !message.content.toLowerCase().includes(contains)) return false;
      return true;
    });

    if (target.size === 0) {
      return replyError(
        client,
        interaction,
        ctx.lang,
        t(client, ctx.lang, "commands.mod.purge.empty"),
      );
    }

    const deleted = await (channel as TextChannel).bulkDelete(target, true).catch(() => null);

    if (!deleted || deleted.size === 0) {
      return replyError(
        client,
        interaction,
        ctx.lang,
        t(client, ctx.lang, "commands.mod.purge.too_old"),
      );
    }

    await ctx.service.punish({
      type: "purge",
      targetId: user?.id ?? interaction.user.id,
      moderatorId: interaction.user.id,
      reason: `#${(channel as TextChannel).name} • ${deleted.size}`,
    });

    await interaction.editReply({
      embeds: [
        client.holder.embed.success(
          ctx.lang,
          t(client, ctx.lang, "commands.mod.purge.success", String(deleted.size)),
        ),
      ],
    });
  },
} as SlashCommand;
