import { SlashCommand, ModerationCaseType } from "../../types/helpers";
import { Client, ChatInputCommandInteraction, EmbedBuilder } from "discord.js";
import { defaultPermissions } from "../../helpers";
import { prepareModeration } from "../../helpers/moderation";
import { t } from "../../i18n/helpers";

const PER_PAGE = 10;

module.exports = {
  name: "cases",
  description: "📚 Show the moderation history of a user or of the whole server.",
  cooldown: 3,
  locale: {
    ru: "📚 Показать историю модерации пользователя или всего сервера.",
    uk: "📚 Показати історію модерації користувача або всього сервера.",
  },
  options: [
    {
      name: "user",
      description: "Filter by user",
      required: false,
      type: "USER",
      local: { ru: "Фильтр по пользователю", uk: "Фільтр за користувачем" },
    },
    {
      name: "page",
      description: "Page number",
      required: false,
      type: "INTEGER",
      min: 1,
      max: 1000,
      local: { ru: "Номер страницы", uk: "Номер сторінки" },
    },
  ],
  permissions: {
    bot: defaultPermissions,
  },
  run: async (client: Client, interaction: ChatInputCommandInteraction) => {
    const ctx = await prepareModeration(client, interaction);
    if (!ctx) return;

    await interaction.deferReply();

    const user = interaction.options.getUser("user");
    const page = Math.max(1, interaction.options.getInteger("page") ?? 1) - 1;

    const { entries, total } = await ctx.service.listCases(user?.id ?? null, page, PER_PAGE);
    const pages = Math.max(1, Math.ceil(total / PER_PAGE));

    const embed = new EmbedBuilder()
      .setColor(client.holder.colors.default)
      .setTitle(
        t(
          client,
          ctx.lang,
          "commands.mod.cases.title",
          user ? user.displayName : interaction.guild!.name,
        ),
      );

    if (entries.length === 0) {
      embed.setDescription(t(client, ctx.lang, "commands.mod.cases.empty"));
    } else {
      const lines: string[] = [];

      for (const entry of entries) {
        lines.push(
          t(
            client,
            ctx.lang,
            "commands.mod.cases.entry",
            String(entry.caseNumber),
            await ctx.service.typeName(entry.type as ModerationCaseType, ctx.lang),
            String(Math.floor(entry.createdAt.getTime() / 1000)),
            `<@${entry.targetId}>`,
          ),
        );
      }

      embed.setDescription(lines.join("\n"));
    }

    embed.setFooter({
      text: t(
        client,
        ctx.lang,
        "commands.mod.cases.footer",
        String(page + 1),
        String(pages),
        String(total),
      ),
    });

    await interaction.editReply({ embeds: [embed] });
  },
} as SlashCommand;
