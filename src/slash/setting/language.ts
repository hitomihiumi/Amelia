import { SlashCommand } from "../../types/helpers";
import {
  Client,
  CommandInteraction,
  MessageFlagsBitField,
  PermissionsBitField,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
} from "discord.js";
import { defaultPermissions, Guild } from "../../helpers";
import { t } from "../../i18n/helpers";

module.exports = {
  name: "language",
  description: "Setting the bot language on the server.",
  cooldown: 5,
  locale: {
    ru: "Настройка языка бота на сервере.",
    uk: "Налаштування мови бота на сервері.",
  },
  options: [],
  permissions: {
    bot: [...defaultPermissions],
  },
  key: null,
  run: async (client: Client, interaction: CommandInteraction) => {
    if (!interaction.guild) return;
    let guild = new Guild(client, interaction.guild);

    const lang = await guild.get("settings.language");

    await interaction.deferReply({ flags: MessageFlagsBitField.Flags.Ephemeral });

    let embed = client.holder.utils.fastEmbed({
      title: t(client, lang, "commands.language.embeds.base.title"),
      description: t(client, lang, "commands.language.embeds.base.description"),
    });

    let row = client.holder.utils.fastRow([
      new StringSelectMenuBuilder()
        .setCustomId("NI_language:select")
        .setPlaceholder(t(client, lang, "commands.language.select_menus.placeholder"))
        .addOptions(
          client.holder.i18n.getCodes().map((code) => {
            return new StringSelectMenuOptionBuilder()
              .setLabel(
                t(
                  client,
                  code,
                  `commands.language.select_menus.options.${code as "en" | "ru" | "uk"}.label`,
                ),
              )
              .setValue(code)
              .setEmoji(client.holder.i18n.get(code)?.metadata.flag || "🏳️")
              .setDescription(
                t(
                  client,
                  lang,
                  `commands.language.select_menus.options.${code as "en" | "ru" | "uk"}.description`,
                ),
              );
          }),
        ),
    ]);

    const msg = await interaction.editReply({ embeds: [embed], components: [row] });

    const filter = (i: any) => i.user.id === interaction.user.id;

    const collector = msg.createMessageComponentCollector({ filter, time: 600000 });

    collector.on("collect", async (i) => {
      if (i.isStringSelectMenu()) {
        await i.deferUpdate();
        const selectedLang = i.values[0];

        await guild.set("settings.language", selectedLang);

        await i.followUp({
          content: t(client, selectedLang, "commands.language.messages.success", selectedLang),
          flags: MessageFlagsBitField.Flags.Ephemeral,
        });

        await i.editReply({
          embeds: [
            client.holder.utils.fastEmbed({
              title: t(client, selectedLang, "commands.language.embeds.base.title"),
              description: t(client, selectedLang, "commands.language.embeds.base.description"),
            }),
          ],
        });
      }
    });
  },
} as SlashCommand;
