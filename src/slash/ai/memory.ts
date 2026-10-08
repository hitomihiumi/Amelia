import { SlashCommand } from "../../types/helpers";
import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChatInputCommandInteraction,
  Client,
  MessageFlagsBitField,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
} from "discord.js";
import { defaultPermissions, Guild } from "../../helpers";
import { t } from "../../i18n/helpers";
import {
  clearUserMemories,
  deleteMemory,
  hasAiAccess,
  listMemories,
  loadAiSettings,
  type MemoryRow,
} from "../../helpers/ai";

/** Discord lets a select menu hold 25 options. */
const SHOWN = 25;

module.exports = {
  name: "memory",
  description: "🧠 See what Amelia remembers about you, and make her forget it.",
  cooldown: 5,
  locale: {
    ru: "🧠 Посмотреть, что Амелия помнит о тебе, и заставить её это забыть.",
    uk: "🧠 Подивитися, що Амелія пам'ятає про тебе, і змусити її це забути.",
  },
  options: [],
  permissions: {
    bot: [...defaultPermissions],
  },
  run: async (client: Client, interaction: ChatInputCommandInteraction) => {
    if (!interaction.guild) return;

    const guild = new Guild(client, interaction.guild);
    const lang = (await guild.get("settings.language")) as string;
    const guildId = interaction.guild.id;
    const userId = interaction.user.id;

    if (!(await hasAiAccess(guildId))) {
      return interaction.reply({
        content: t(client, lang, "ai.premium_required"),
        flags: MessageFlagsBitField.Flags.Ephemeral,
      });
    }

    await interaction.deferReply({ flags: MessageFlagsBitField.Flags.Ephemeral });

    const settings = await loadAiSettings(guild);
    let notes = await listMemories(guildId, userId);

    const render = () => {
      const shown = notes.slice(0, SHOWN);
      const lines =
        shown.length > 0
          ? shown.map((note, index) => `${index + 1}. ${note.content}`).join("\n")
          : t(client, lang, "ai.memory.empty");
      const switchedOff = settings.options.long_term
        ? ""
        : `\n\n${t(client, lang, "ai.memory.switched_off")}`;

      const embed = client.holder.utils.fastEmbed({
        title: t(client, lang, "ai.memory.title"),
        description: `${t(client, lang, "ai.memory.description")}\n\n${lines}${switchedOff}`,
      });

      if (shown.length === 0) return { embeds: [embed], components: [] };

      const select = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
        new StringSelectMenuBuilder()
          .setCustomId("NI_ai_memory:forget_one")
          .setPlaceholder(t(client, lang, "ai.memory.forget_one"))
          .addOptions(
            shown.map((note: MemoryRow, index) =>
              new StringSelectMenuOptionBuilder()
                .setValue(note.id)
                .setLabel(`${index + 1}. ${note.content}`.slice(0, 100)),
            ),
          ),
      );
      const buttons = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
          .setCustomId("NI_ai_memory:forget_all")
          .setStyle(ButtonStyle.Danger)
          .setLabel(t(client, lang, "ai.memory.forget_all")),
      );

      return { embeds: [embed], components: [select, buttons] };
    };

    const message = await interaction.editReply(render());

    const collector = message.createMessageComponentCollector({
      filter: (i) => i.user.id === userId,
      time: 600000,
    });

    collector.on("collect", async (i) => {
      if (i.isStringSelectMenu() && i.customId === "NI_ai_memory:forget_one") {
        await deleteMemory(guildId, userId, i.values[0]);
        notes = await listMemories(guildId, userId);
        return i.update(render());
      }

      if (i.isButton() && i.customId === "NI_ai_memory:forget_all") {
        const count = await clearUserMemories(guildId, userId);
        notes = [];
        await i.update(render());
        return i.followUp({
          content: t(client, lang, "ai.memory.forgot_all", count),
          flags: MessageFlagsBitField.Flags.Ephemeral,
        });
      }
    });
  },
} as SlashCommand;
