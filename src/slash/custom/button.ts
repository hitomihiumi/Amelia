import { ButtonCustom, SlashCommand } from "../../types/helpers";
import {
  Client,
  EmbedBuilder,
  ButtonBuilder,
  ActionRowBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  MessageActionRowComponentBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  ButtonStyle,
  ChatInputCommandInteraction,
  MessageFlagsBitField,
} from "discord.js";
import { Guild, customUtil } from "../../helpers";
import { generateID } from "../../handlers/functions";
import fuse from "fuse.js";
import { t } from "../../i18n/helpers";
import { defaultPermissions } from "../../helpers/permissions";

type ViewType = "main" | "list" | "edit" | "emoji";

const STYLE_OPTIONS: { value: ButtonCustom["style"]; label: string; emoji: string }[] = [
  { value: "PRIMARY", label: "Primary (Blue)", emoji: "🔵" },
  { value: "SECONDARY", label: "Secondary (Gray)", emoji: "⚪" },
  { value: "SUCCESS", label: "Success (Green)", emoji: "🟢" },
  { value: "DANGER", label: "Danger (Red)", emoji: "🔴" },
  { value: "LINK", label: "Link", emoji: "🔗" },
];

module.exports = {
  name: "button",
  description: "Menu for creating and configuring custom buttons",
  cooldown: 5,
  locale: {
    ru: "Меню создания и настройки кастомных кнопок",
  },
  options: [],
  permissions: {
    bot: [...defaultPermissions],
  },
  key: null,
  run: async (client: Client, interaction: ChatInputCommandInteraction) => {
    if (!interaction.guild) return;

    await interaction.deferReply({ flags: [MessageFlagsBitField.Flags.Ephemeral] });

    const guild = new Guild(client, interaction.guild);
    const lang = (await guild.get("settings.language")) as string;

    let page = 0;
    let emojiPage = 0;
    let currentView: ViewType = "main";
    let _schema = schemaDefault(generateID(guild.guild.id, "btn"));
    let _search = "";
    const EMOJIS_PER_PAGE = 25;

    const updateMessage = async () => {
      const embed = buildEmbed(client, lang, _schema, currentView);
      const components = buildComponents(
        client,
        lang,
        _schema,
        currentView,
        await getButtons(guild),
        page,
        _search,
        interaction.guild!,
        emojiPage,
        EMOJIS_PER_PAGE
      );
      await interaction.editReply({ embeds: [embed], components });
    };

    await updateMessage();

    const filter = (i: any) => i.user.id === interaction.user.id;
    const collector = interaction.channel!.createMessageComponentCollector({
      filter,
      time: 600000,
    });

    collector.on("collect", async (i) => {
      // String Select Menu handlers
      if (i.isStringSelectMenu()) {
        switch (i.customId) {
          case "NI_button:base":
            if (i.values[0] === "create") {
              await i.deferUpdate();
              _schema = schemaDefault(generateID(guild.guild.id, "btn"));
              currentView = "edit";
            } else if (i.values[0] === "edit") {
              await i.deferUpdate();
              currentView = "list";
            }
            await updateMessage();
            break;

          case "NI_button:select":
            await i.deferUpdate();
            const buttons = await getButtons(guild);
            const selected = buttons.find((b) => b.id === i.values[0]);
            if (selected) {
              _schema = { ...selected };
              currentView = "edit";
            }
            await updateMessage();
            break;

          case "NI_button:style":
            await i.deferUpdate();
            _schema.style = i.values[0] as ButtonCustom["style"];
            // Clear URL if not LINK style
            if (_schema.style !== "LINK") {
              _schema.url = undefined;
            }
            await updateMessage();
            break;

          case "NI_button:emoji_select":
            const selectedEmoji = interaction.guild?.emojis.cache.get(i.values[0]);
            if (selectedEmoji) {
              _schema.emoji = selectedEmoji.animated
                ? `<a:${selectedEmoji.name}:${selectedEmoji.id}>`
                : `<:${selectedEmoji.name}:${selectedEmoji.id}>`;
            }
            currentView = "edit";
            emojiPage = 0;
            await i.deferUpdate();
            await updateMessage();
            break;
        }
      }

      // Button handlers
      if (i.isButton()) {
        switch (i.customId) {
          case "NI_button:back":
            await i.deferUpdate();
            if (currentView === "emoji") {
              currentView = "edit";
              emojiPage = 0;
            } else if (currentView === "edit" || currentView === "list") {
              currentView = "main";
              _schema = schemaDefault(generateID(guild.guild.id, "btn"));
            }
            await updateMessage();
            break;

          case "NI_button:save":
            await i.deferUpdate();
            // Validate
            const validation = customUtil.CustomButton.validate(_schema);
            if (!validation.valid) {
              await i.followUp({
                content: `❌ ${validation.errors.join("\n")}`,
                flags: MessageFlagsBitField.Flags.Ephemeral,
              });
              return;
            }

            const buttons = await getButtons(guild);
            const existingIndex = buttons.findIndex((b) => b.id === _schema.id);
            if (existingIndex !== -1) {
              buttons[existingIndex] = _schema;
            } else {
              buttons.push(_schema);
            }
            await setButtons(guild, buttons);
            currentView = "main";
            _schema = schemaDefault(generateID(guild.guild.id, "btn"));
            await updateMessage();
            break;

          case "NI_button:delete":
            await i.deferUpdate();
            const allButtons = await getButtons(guild);
            const filtered = allButtons.filter((b) => b.id !== _schema.id);
            await setButtons(guild, filtered);
            currentView = "main";
            _schema = schemaDefault(generateID(guild.guild.id, "btn"));
            await updateMessage();
            break;

          case "NI_button:preview":
            await i.deferUpdate();
            const customButton = new customUtil.CustomButton(_schema);
            const previewRow = new ActionRowBuilder<MessageActionRowComponentBuilder>().setComponents(
              customButton.getPreviewButton()
            );
            await i.followUp({
              content: t(client, lang, "commands.button.messages.preview") as string,
              components: [previewRow],
              flags: MessageFlagsBitField.Flags.Ephemeral,
            });
            break;

          case "NI_button:label": {
            const result = await showTextModal(i, "label", client, lang, _schema.label);
            if (result.submitted) {
              _schema.label = result.value || "Button";
              await updateMessage();
            }
            break;
          }

          case "NI_button:url": {
            const result = await showTextModal(i, "url", client, lang, _schema.url);
            if (result.submitted) {
              _schema.url = result.value || undefined;
              await updateMessage();
            }
            break;
          }

          case "NI_button:name": {
            const result = await showTextModal(i, "name", client, lang, _schema.name);
            if (result.submitted) {
              _schema.name = result.value || "Unnamed Button";
              await updateMessage();
            }
            break;
          }

          case "NI_button:emoji":
            await i.deferUpdate();
            currentView = "emoji";
            emojiPage = 0;
            await updateMessage();
            break;

          case "NI_button:emoji_clear":
            await i.deferUpdate();
            _schema.emoji = undefined;
            await updateMessage();
            break;

          case "NI_button:disabled":
            await i.deferUpdate();
            _schema.disabled = !_schema.disabled;
            await updateMessage();
            break;

          case "NI_button:page_prev":
            await i.deferUpdate();
            page = Math.max(0, page - 1);
            await updateMessage();
            break;

          case "NI_button:page_next":
            await i.deferUpdate();
            const totalButtons = await getButtons(guild);
            const maxPage = Math.ceil(totalButtons.length / 25) - 1;
            page = Math.min(maxPage, page + 1);
            await updateMessage();
            break;

          case "NI_button:search": {
            const searchResult = await showSearchModal(i, client, lang);
            if (searchResult.submitted) {
              _search = searchResult.value || "";
              page = 0;
              await updateMessage();
            }
            break;
          }

          case "NI_button:emoji_prev":
            await i.deferUpdate();
            emojiPage = Math.max(0, emojiPage - 1);
            await updateMessage();
            break;

          case "NI_button:emoji_next":
            await i.deferUpdate();
            const totalEmojis = interaction.guild?.emojis.cache.size || 0;
            const maxEmojiPage = Math.ceil(totalEmojis / EMOJIS_PER_PAGE) - 1;
            emojiPage = Math.min(maxEmojiPage, emojiPage + 1);
            await updateMessage();
            break;
        }
      }
    });

    collector.on("end", async () => {
      try {
        await interaction.editReply({ components: [] });
      } catch {}
    });
  },
} as SlashCommand;

// Helper functions
function schemaDefault(id: string): ButtonCustom {
  return {
    id,
    name: "New Button",
    label: "Button",
    style: "PRIMARY",
    disabled: false,
  };
}

async function getButtons(guild: Guild): Promise<ButtonCustom[]> {
  return (await guild.get("utils.components.buttons")) as ButtonCustom[];
}

async function setButtons(guild: Guild, buttons: ButtonCustom[]): Promise<void> {
  await guild.set("utils.components.buttons", buttons);
}

function buildEmbed(
  client: Client,
  lang: string,
  schema: ButtonCustom,
  view: ViewType
): EmbedBuilder {
  const embed = new EmbedBuilder().setColor(client.holder.colors.default);

  switch (view) {
    case "main":
      embed
        .setTitle(t(client, lang, "commands.button.embeds.base.title") as string)
        .setDescription(t(client, lang, "commands.button.embeds.base.description") as string);
      break;

    case "list":
      embed
        .setTitle(t(client, lang, "commands.button.embeds.list.title") as string)
        .setDescription(t(client, lang, "commands.button.embeds.list.description") as string);
      break;

    case "edit":
      embed
        .setTitle(t(client, lang, "commands.button.embeds.edit.title") as string)
        .setDescription(t(client, lang, "commands.button.embeds.edit.description") as string)
        .addFields(
          {
            name: t(client, lang, "commands.button.embeds.edit.fields.name") as string,
            value: schema.name || "Unnamed",
            inline: true,
          },
          {
            name: t(client, lang, "commands.button.embeds.edit.fields.label") as string,
            value: schema.label || "Not set",
            inline: true,
          },
          {
            name: t(client, lang, "commands.button.embeds.edit.fields.style") as string,
            value: schema.style,
            inline: true,
          },
          {
            name: t(client, lang, "commands.button.embeds.edit.fields.emoji") as string,
            value: schema.emoji ? String(schema.emoji) : "Not set",
            inline: true,
          },
          {
            name: t(client, lang, "commands.button.embeds.edit.fields.url") as string,
            value: schema.url || "Not set",
            inline: true,
          },
          {
            name: t(client, lang, "commands.button.embeds.edit.fields.disabled") as string,
            value: schema.disabled ? "✅" : "❌",
            inline: true,
          }
        );
      break;

    case "emoji":
      embed
        .setTitle(t(client, lang, "commands.button.embeds.emoji.title") as string)
        .setDescription(t(client, lang, "commands.button.embeds.emoji.description") as string);
      break;
  }

  return embed;
}

function buildComponents(
  client: Client,
  lang: string,
  schema: ButtonCustom,
  view: ViewType,
  allButtons: ButtonCustom[],
  page: number,
  search: string,
  guild: any,
  emojiPage: number,
  emojisPerPage: number
): ActionRowBuilder<MessageActionRowComponentBuilder>[] {
  const rows: ActionRowBuilder<MessageActionRowComponentBuilder>[] = [];

  switch (view) {
    case "main":
      rows.push(
        new ActionRowBuilder<MessageActionRowComponentBuilder>().setComponents(
          new StringSelectMenuBuilder()
            .setCustomId("NI_button:base")
            .setPlaceholder(t(client, lang, "commands.button.select_menus.base.placeholder") as string)
            .setOptions(
              new StringSelectMenuOptionBuilder()
                .setValue("create")
                .setLabel(t(client, lang, "commands.button.select_menus.base.options.create") as string)
                .setEmoji("➕"),
              new StringSelectMenuOptionBuilder()
                .setValue("edit")
                .setLabel(t(client, lang, "commands.button.select_menus.base.options.edit") as string)
                .setEmoji("📝")
            )
        )
      );
      break;

    case "list":
      let buttonList = [...allButtons];
      if (search) {
        const fuseSearch = new fuse(buttonList, { keys: ["name", "label"] });
        buttonList = fuseSearch.search(search).map((r) => r.item);
      }

      const selectMenu = new StringSelectMenuBuilder()
        .setCustomId("NI_button:select")
        .setPlaceholder(t(client, lang, "commands.button.select_menus.list.placeholder") as string);

      if (buttonList.length > 0) {
        buttonList.slice(page * 25, page * 25 + 25).forEach((button) => {
          selectMenu.addOptions(
            new StringSelectMenuOptionBuilder()
              .setValue(button.id)
              .setLabel(button.name || "Unnamed")
              .setDescription(`${button.label} (${button.style})`)
          );
        });
      } else {
        selectMenu
          .addOptions(
            new StringSelectMenuOptionBuilder()
              .setValue("none")
              .setLabel(t(client, lang, "commands.button.select_menus.list.no_buttons") as string)
          )
          .setDisabled(true);
      }

      rows.push(
        new ActionRowBuilder<MessageActionRowComponentBuilder>().setComponents(selectMenu)
      );

      rows.push(
        new ActionRowBuilder<MessageActionRowComponentBuilder>().setComponents(
          new ButtonBuilder()
            .setCustomId("NI_button:page_prev")
            .setEmoji("⬅️")
            .setStyle(ButtonStyle.Primary)
            .setDisabled(page === 0),
          new ButtonBuilder()
            .setCustomId("NI_button:page_info")
            .setLabel(`${page + 1}/${Math.ceil(allButtons.length / 25) || 1}`)
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(true),
          new ButtonBuilder()
            .setCustomId("NI_button:search")
            .setEmoji("🔍")
            .setStyle(ButtonStyle.Secondary),
          new ButtonBuilder()
            .setCustomId("NI_button:page_next")
            .setEmoji("➡️")
            .setStyle(ButtonStyle.Primary)
            .setDisabled(page >= Math.ceil(allButtons.length / 25) - 1),
          new ButtonBuilder()
            .setCustomId("NI_button:back")
            .setEmoji("🔙")
            .setStyle(ButtonStyle.Secondary)
        )
      );
      break;

    case "edit":
      // Style select menu
      rows.push(
        new ActionRowBuilder<MessageActionRowComponentBuilder>().setComponents(
          new StringSelectMenuBuilder()
            .setCustomId("NI_button:style")
            .setPlaceholder(t(client, lang, "commands.button.select_menus.style.placeholder") as string)
            .setOptions(
              STYLE_OPTIONS.map((opt) =>
                new StringSelectMenuOptionBuilder()
                  .setValue(opt.value)
                  .setLabel(opt.label)
                  .setEmoji(opt.emoji)
                  .setDefault(schema.style === opt.value)
              )
            )
        )
      );

      // Edit buttons row 1
      rows.push(
        new ActionRowBuilder<MessageActionRowComponentBuilder>().setComponents(
          new ButtonBuilder()
            .setCustomId("NI_button:name")
            .setLabel(t(client, lang, "commands.button.buttons.name") as string)
            .setStyle(ButtonStyle.Secondary)
            .setEmoji("🏷️"),
          new ButtonBuilder()
            .setCustomId("NI_button:label")
            .setLabel(t(client, lang, "commands.button.buttons.label") as string)
            .setStyle(ButtonStyle.Secondary)
            .setEmoji("📝"),
          new ButtonBuilder()
            .setCustomId("NI_button:emoji")
            .setLabel(t(client, lang, "commands.button.buttons.emoji") as string)
            .setStyle(ButtonStyle.Secondary)
            .setEmoji("😀"),
          new ButtonBuilder()
            .setCustomId("NI_button:url")
            .setLabel(t(client, lang, "commands.button.buttons.url") as string)
            .setStyle(ButtonStyle.Secondary)
            .setEmoji("🔗")
            .setDisabled(schema.style !== "LINK")
        )
      );

      // Edit buttons row 2
      rows.push(
        new ActionRowBuilder<MessageActionRowComponentBuilder>().setComponents(
          new ButtonBuilder()
            .setCustomId("NI_button:disabled")
            .setLabel(t(client, lang, "commands.button.buttons.disabled") as string)
            .setStyle(schema.disabled ? ButtonStyle.Success : ButtonStyle.Secondary)
            .setEmoji("🚫"),
          new ButtonBuilder()
            .setCustomId("NI_button:preview")
            .setLabel(t(client, lang, "commands.button.buttons.preview") as string)
            .setStyle(ButtonStyle.Primary)
            .setEmoji("👁️")
        )
      );

      // Action buttons
      rows.push(
        new ActionRowBuilder<MessageActionRowComponentBuilder>().setComponents(
          new ButtonBuilder()
            .setCustomId("NI_button:save")
            .setLabel(t(client, lang, "commands.button.buttons.save") as string)
            .setStyle(ButtonStyle.Success)
            .setEmoji("💾"),
          new ButtonBuilder()
            .setCustomId("NI_button:delete")
            .setLabel(t(client, lang, "commands.button.buttons.delete") as string)
            .setStyle(ButtonStyle.Danger)
            .setEmoji("🗑️"),
          new ButtonBuilder()
            .setCustomId("NI_button:back")
            .setLabel(t(client, lang, "commands.button.buttons.back") as string)
            .setStyle(ButtonStyle.Secondary)
            .setEmoji("🔙")
        )
      );
      break;

    case "emoji":
      const guildEmojis = Array.from(guild.emojis.cache.values());
      const startIndex = emojiPage * emojisPerPage;
      const pageEmojis = guildEmojis.slice(startIndex, startIndex + emojisPerPage);

      if (pageEmojis.length > 0) {
        const emojiSelect = new StringSelectMenuBuilder()
          .setCustomId("NI_button:emoji_select")
          .setPlaceholder(t(client, lang, "commands.button.select_menus.emoji.placeholder") as string);

        pageEmojis.forEach((emoji: any) => {
          emojiSelect.addOptions(
            new StringSelectMenuOptionBuilder()
              .setValue(emoji.id)
              .setLabel(emoji.name || "emoji")
              .setEmoji({ id: emoji.id, animated: emoji.animated })
          );
        });

        rows.push(
          new ActionRowBuilder<MessageActionRowComponentBuilder>().setComponents(emojiSelect)
        );
      }

      rows.push(
        new ActionRowBuilder<MessageActionRowComponentBuilder>().setComponents(
          new ButtonBuilder()
            .setCustomId("NI_button:emoji_prev")
            .setEmoji("⬅️")
            .setStyle(ButtonStyle.Primary)
            .setDisabled(emojiPage === 0),
          new ButtonBuilder()
            .setCustomId("NI_button:emoji_page")
            .setLabel(`${emojiPage + 1}/${Math.ceil(guildEmojis.length / emojisPerPage) || 1}`)
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(true),
          new ButtonBuilder()
            .setCustomId("NI_button:emoji_next")
            .setEmoji("➡️")
            .setStyle(ButtonStyle.Primary)
            .setDisabled(emojiPage >= Math.ceil(guildEmojis.length / emojisPerPage) - 1),
          new ButtonBuilder()
            .setCustomId("NI_button:emoji_clear")
            .setLabel(t(client, lang, "commands.button.buttons.clear_emoji") as string)
            .setStyle(ButtonStyle.Danger)
            .setEmoji("🗑️"),
          new ButtonBuilder()
            .setCustomId("NI_button:back")
            .setEmoji("🔙")
            .setStyle(ButtonStyle.Secondary)
        )
      );
      break;
  }

  return rows;
}

async function showTextModal(
  interaction: any,
  field: string,
  client: Client,
  lang: string,
  currentValue?: string
): Promise<{ value: string | null; submitted: boolean }> {
  const labels: Record<string, string> = {
    label: t(client, lang, "commands.button.modals.label.label") as string,
    url: t(client, lang, "commands.button.modals.url.label") as string,
    name: t(client, lang, "commands.button.modals.name.label") as string,
  };

  const modalId = `NI_button:modal:${field}:${Date.now()}`;

  const modal = new ModalBuilder()
    .setTitle(labels[field] || field)
    .setCustomId(modalId)
    .setComponents(
      new ActionRowBuilder<any>().setComponents(
        new TextInputBuilder()
          .setCustomId("NI_button:input")
          .setLabel(labels[field] || field)
          .setStyle(TextInputStyle.Short)
          .setRequired(field !== "url")
          .setValue(currentValue || "")
          .setMaxLength(field === "url" ? 512 : 80)
      )
    );

  await interaction.showModal(modal);

  try {
    const submitted = await interaction.awaitModalSubmit({
      filter: (i: any) => i.customId === modalId && i.user.id === interaction.user.id,
      time: 300000,
    });

    await submitted.deferUpdate();
    const value = submitted.fields.getTextInputValue("NI_button:input") || null;
    return { value, submitted: true };
  } catch {
    return { value: null, submitted: false };
  }
}

async function showSearchModal(
  interaction: any,
  client: Client,
  lang: string
): Promise<{ value: string | null; submitted: boolean }> {
  const modalId = `NI_button:modal:search:${Date.now()}`;

  const modal = new ModalBuilder()
    .setTitle(t(client, lang, "commands.button.modals.search.title") as string)
    .setCustomId(modalId)
    .setComponents(
      new ActionRowBuilder<any>().setComponents(
        new TextInputBuilder()
          .setCustomId("NI_button:input")
          .setLabel(t(client, lang, "commands.button.modals.search.label") as string)
          .setStyle(TextInputStyle.Short)
          .setRequired(false)
          .setMaxLength(100)
      )
    );

  await interaction.showModal(modal);

  try {
    const submitted = await interaction.awaitModalSubmit({
      filter: (i: any) => i.customId === modalId && i.user.id === interaction.user.id,
      time: 300000,
    });

    await submitted.deferUpdate();
    const value = submitted.fields.getTextInputValue("NI_button:input") || null;
    return { value, submitted: true };
  } catch {
    return { value: null, submitted: false };
  }
}

