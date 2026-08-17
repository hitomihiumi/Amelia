import { SlashCommand } from "../../types/helpers";
import { Client, ChatInputCommandInteraction } from "discord.js";
import { defaultPermissions } from "../../helpers";
import { prepareModeration, replyError, replySuccess } from "../../helpers/moderation";
import { t } from "../../i18n/helpers";

module.exports = {
  name: "note",
  description: "📝 Attach a private note to a user without punishing them.",
  cooldown: 3,
  locale: {
    ru: "📝 Добавить пользователю заметку без наказания.",
    uk: "📝 Додати користувачу нотатку без покарання.",
  },
  options: [
    {
      name: "user",
      description: "User the note is about",
      required: true,
      type: "USER",
      local: { ru: "Пользователь, о котором заметка", uk: "Користувач, про якого нотатка" },
    },
    {
      name: "text",
      description: "Note text",
      required: true,
      type: "STRING",
      local: { ru: "Текст заметки", uk: "Текст нотатки" },
    },
  ],
  permissions: {
    bot: defaultPermissions,
  },
  run: async (client: Client, interaction: ChatInputCommandInteraction) => {
    const ctx = await prepareModeration(client, interaction);
    if (!ctx) return;

    await interaction.deferReply();

    const user = interaction.options.getUser("user", true);

    const result = await ctx.service.punish({
      type: "note",
      targetId: user.id,
      moderatorId: interaction.user.id,
      reason: interaction.options.getString("text", true),
    });

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
        "commands.mod.note.success",
        user.toString(),
        String(result.case.caseNumber),
      ),
    );
  },
} as SlashCommand;
