import {
  SelectMenuCustom,
  SelectMenuOptionCustom,
  SlashCommand,
  SCENARIO_LIMITS,
} from "../../types/helpers";
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
  LabelBuilder,
} from "discord.js";
import { Guild, customUtil } from "../../helpers";
import { generateID } from "../../handlers/functions";
import fuse from "fuse.js";
import { t } from "../../i18n/helpers";
import { defaultPermissions } from "../../helpers";

type ViewType = "main" | "list" | "edit" | "options" | "option_edit" | "emoji";

module.exports = {
  name: "selectmenu",
  description: "👆 Menu for creating and configuring custom select menus",
  cooldown: 5,
  locale: {
    ru: "👆 Меню создания и настройки кастомных селект меню",
    uk: "👆 Меню створення та налаштування кастомних селект меню",
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
    const lang = await guild.get("settings.language");

    let page = 0;
    let emojiPage = 0;
    let currentView: ViewType = "main";
    let _schema = schemaDefault(generateID(guild.guild.id, "select"));
    let currentOptionIndex = 0;
    let _search = "";
    const EMOJIS_PER_PAGE = 25;

    const updateMessage = async () => {
      const embed = buildEmbed(client, lang, _schema, currentView, currentOptionIndex);
      const components = buildComponents(
        client,
        lang,
        _schema,
        currentView,
        currentOptionIndex,
        await getSelectMenus(guild),
        page,
        _search,
        interaction.guild!,
        emojiPage,
        EMOJIS_PER_PAGE,
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
          case "NI_select:base":
            if (i.values[0] === "create") {
              await i.deferUpdate();
              _schema = schemaDefault(generateID(guild.guild.id, "select"));
              currentView = "edit";
            } else if (i.values[0] === "edit") {
              await i.deferUpdate();
              currentView = "list";
            }
            await updateMessage();
            break;

          case "NI_select:select":
            await i.deferUpdate();
            const menus = await getSelectMenus(guild);
            const selected = menus.find((m) => m.id === i.values[0]);
            if (selected) {
              _schema = { ...selected, options: [...selected.options] };
              currentView = "edit";
            }
            await updateMessage();
            break;

          case "NI_select:options_select":
            if (i.values[0] === "add") {
              if (_schema.options.length >= SCENARIO_LIMITS.MAX_SELECT_MENU_OPTIONS) {
                await i.reply({
                  content: t(client, lang, "commands.selectmenu.messages.max_options"),
                  flags: MessageFlagsBitField.Flags.Ephemeral,
                });
                return;
              }
              await i.deferUpdate();
              const newOption: SelectMenuOptionCustom = {
                label: "Option",
                value: generateID(guild.guild.id, "opt"),
                default: false,
              };
              _schema.options.push(newOption);
              currentOptionIndex = _schema.options.length - 1;
              currentView = "option_edit";
            } else {
              await i.deferUpdate();
              currentOptionIndex = parseInt(i.values[0]);
              currentView = "option_edit";
            }
            await updateMessage();
            break;

          case "NI_select:emoji_select":
            await i.deferUpdate();
            const selectedEmoji = interaction.guild?.emojis.cache.get(i.values[0]);
            if (selectedEmoji && _schema.options[currentOptionIndex]) {
              _schema.options[currentOptionIndex].emoji = selectedEmoji.animated
                ? `<a:${selectedEmoji.name}:${selectedEmoji.id}>`
                : `<:${selectedEmoji.name}:${selectedEmoji.id}>`;
            }
            currentView = "option_edit";
            emojiPage = 0;
            await updateMessage();
            break;
        }
      }

      // Button handlers
      if (i.isButton()) {
        switch (i.customId) {
          case "NI_select:back":
            await i.deferUpdate();
            if (currentView === "emoji") {
              currentView = "option_edit";
              emojiPage = 0;
            } else if (currentView === "option_edit") {
              currentView = "options";
            } else if (currentView === "options") {
              currentView = "edit";
            } else if (currentView === "edit" || currentView === "list") {
              currentView = "main";
              _schema = schemaDefault(generateID(guild.guild.id, "select"));
            }
            await updateMessage();
            break;

          case "NI_select:save":
            await i.deferUpdate();
            // Validate
            const validation = customUtil.CustomSelectMenu.validate(_schema);
            if (!validation.valid) {
              await i.followUp({
                content: `❌ ${validation.errors.join("\n")}`,
                flags: MessageFlagsBitField.Flags.Ephemeral,
              });
              return;
            }

            const menus = await getSelectMenus(guild);
            const existingIndex = menus.findIndex((m) => m.id === _schema.id);
            if (existingIndex !== -1) {
              menus[existingIndex] = _schema;
            } else {
              menus.push(_schema);
            }
            await setSelectMenus(guild, menus);
            currentView = "main";
            _schema = schemaDefault(generateID(guild.guild.id, "select"));
            await updateMessage();
            break;

          case "NI_select:delete":
            await i.deferUpdate();
            const allMenus = await getSelectMenus(guild);
            const filtered = allMenus.filter((m) => m.id !== _schema.id);
            await setSelectMenus(guild, filtered);
            currentView = "main";
            _schema = schemaDefault(generateID(guild.guild.id, "select"));
            await updateMessage();
            break;

          case "NI_select:preview":
            await i.deferUpdate();
            if (_schema.options.length === 0) {
              await i.followUp({
                content: t(client, lang, "commands.selectmenu.messages.no_options"),
                flags: MessageFlagsBitField.Flags.Ephemeral,
              });
              return;
            }
            const customMenu = new customUtil.CustomSelectMenu(_schema);
            const previewRow =
              new ActionRowBuilder<MessageActionRowComponentBuilder>().setComponents(
                customMenu.getPreviewSelectMenu(),
              );
            await i.followUp({
              content: t(client, lang, "commands.selectmenu.messages.preview"),
              components: [previewRow],
              flags: MessageFlagsBitField.Flags.Ephemeral,
            });
            break;

          case "NI_select:name": {
            const result = await showTextModal(i, "name", client, lang, _schema.name);
            if (result.submitted) {
              _schema.name = result.value || "Unnamed Menu";
              await updateMessage();
            }
            break;
          }

          case "NI_select:placeholder": {
            const result = await showTextModal(i, "placeholder", client, lang, _schema.placeholder);
            if (result.submitted) {
              _schema.placeholder = result.value || "Select an option";
              await updateMessage();
            }
            break;
          }

          case "NI_select:minmax": {
            const result = await showMinMaxModal(
              i,
              client,
              lang,
              _schema.minValues,
              _schema.maxValues,
            );
            if (result.submitted) {
              _schema.minValues = Math.max(0, Math.min(result.min, _schema.options.length || 1));
              _schema.maxValues = Math.max(1, Math.min(result.max, _schema.options.length || 1));
              await updateMessage();
            }
            break;
          }

          case "NI_select:disabled":
            await i.deferUpdate();
            _schema.disabled = !_schema.disabled;
            await updateMessage();
            break;

          case "NI_select:options":
            await i.deferUpdate();
            currentView = "options";
            await updateMessage();
            break;

          case "NI_select:page_prev":
            await i.deferUpdate();
            page = Math.max(0, page - 1);
            await updateMessage();
            break;

          case "NI_select:page_next":
            await i.deferUpdate();
            const totalMenus = await getSelectMenus(guild);
            const maxPage = Math.ceil(totalMenus.length / 25) - 1;
            page = Math.min(maxPage, page + 1);
            await updateMessage();
            break;

          case "NI_select:search": {
            const searchResult = await showSearchModal(i, client, lang);
            if (searchResult.submitted) {
              _search = searchResult.value || "";
              page = 0;
              await updateMessage();
            }
            break;
          }

          // Option edit buttons
          case "NI_select:opt_label": {
            const result = await showTextModal(
              i,
              "opt_label",
              client,
              lang,
              _schema.options[currentOptionIndex]?.label,
            );
            if (result.submitted && _schema.options[currentOptionIndex]) {
              _schema.options[currentOptionIndex].label = result.value || "Option";
              await updateMessage();
            }
            break;
          }

          case "NI_select:opt_value": {
            const result = await showTextModal(
              i,
              "opt_value",
              client,
              lang,
              _schema.options[currentOptionIndex]?.value,
            );
            if (result.submitted && _schema.options[currentOptionIndex]) {
              _schema.options[currentOptionIndex].value =
                result.value || `option_${currentOptionIndex}`;
              await updateMessage();
            }
            break;
          }

          case "NI_select:opt_description": {
            const result = await showTextModal(
              i,
              "opt_description",
              client,
              lang,
              _schema.options[currentOptionIndex]?.description,
            );
            if (result.submitted && _schema.options[currentOptionIndex]) {
              _schema.options[currentOptionIndex].description = result.value || undefined;
              await updateMessage();
            }
            break;
          }

          case "NI_select:opt_emoji":
            await i.deferUpdate();
            currentView = "emoji";
            emojiPage = 0;
            await updateMessage();
            break;

          case "NI_select:opt_emoji_clear":
            await i.deferUpdate();
            if (_schema.options[currentOptionIndex]) {
              _schema.options[currentOptionIndex].emoji = undefined;
            }
            await updateMessage();
            break;

          case "NI_select:opt_default":
            await i.deferUpdate();
            if (_schema.options[currentOptionIndex]) {
              // If maxValues is 1, clear other defaults
              if (_schema.maxValues === 1) {
                _schema.options.forEach((opt, idx) => {
                  opt.default = idx === currentOptionIndex ? !opt.default : false;
                });
              } else {
                _schema.options[currentOptionIndex].default =
                  !_schema.options[currentOptionIndex].default;
              }
            }
            await updateMessage();
            break;

          case "NI_select:opt_delete":
            await i.deferUpdate();
            _schema.options.splice(currentOptionIndex, 1);
            currentView = "options";
            currentOptionIndex = 0;
            await updateMessage();
            break;

          case "NI_select:opt_up":
            await i.deferUpdate();
            if (currentOptionIndex > 0) {
              const temp = _schema.options[currentOptionIndex];
              _schema.options[currentOptionIndex] = _schema.options[currentOptionIndex - 1];
              _schema.options[currentOptionIndex - 1] = temp;
              currentOptionIndex--;
            }
            await updateMessage();
            break;

          case "NI_select:opt_down":
            await i.deferUpdate();
            if (currentOptionIndex < _schema.options.length - 1) {
              const temp = _schema.options[currentOptionIndex];
              _schema.options[currentOptionIndex] = _schema.options[currentOptionIndex + 1];
              _schema.options[currentOptionIndex + 1] = temp;
              currentOptionIndex++;
            }
            await updateMessage();
            break;

          case "NI_select:emoji_prev":
            await i.deferUpdate();
            emojiPage = Math.max(0, emojiPage - 1);
            await updateMessage();
            break;

          case "NI_select:emoji_next":
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
function schemaDefault(id: string): SelectMenuCustom {
  return {
    id,
    name: "New Select Menu",
    placeholder: "Select an option",
    minValues: 1,
    maxValues: 1,
    disabled: false,
    options: [],
  };
}

async function getSelectMenus(guild: Guild): Promise<SelectMenuCustom[]> {
  return (await guild.get("utils.components.selectMenus")) as SelectMenuCustom[];
}

async function setSelectMenus(guild: Guild, menus: SelectMenuCustom[]): Promise<void> {
  await guild.set("utils.components.selectMenus", menus);
}

function buildEmbed(
  client: Client,
  lang: string,
  schema: SelectMenuCustom,
  view: ViewType,
  optionIndex: number,
): EmbedBuilder {
  const embed = new EmbedBuilder().setColor(client.holder.colors.default);

  switch (view) {
    case "main":
      embed
        .setTitle(t(client, lang, "commands.selectmenu.embeds.base.title"))
        .setDescription(t(client, lang, "commands.selectmenu.embeds.base.description"));
      break;

    case "list":
      embed
        .setTitle(t(client, lang, "commands.selectmenu.embeds.list.title"))
        .setDescription(t(client, lang, "commands.selectmenu.embeds.list.description"));
      break;

    case "edit":
      embed
        .setTitle(t(client, lang, "commands.selectmenu.embeds.edit.title"))
        .setDescription(t(client, lang, "commands.selectmenu.embeds.edit.description"))
        .addFields(
          {
            name: t(client, lang, "commands.selectmenu.embeds.edit.fields.name"),
            value: schema.name || "Unnamed",
            inline: true,
          },
          {
            name: t(client, lang, "commands.selectmenu.embeds.edit.fields.placeholder"),
            value: schema.placeholder || "Not set",
            inline: true,
          },
          {
            name: t(client, lang, "commands.selectmenu.embeds.edit.fields.options_count"),
            value: String(schema.options.length),
            inline: true,
          },
          {
            name: t(client, lang, "commands.selectmenu.embeds.edit.fields.min_values"),
            value: String(schema.minValues || 1),
            inline: true,
          },
          {
            name: t(client, lang, "commands.selectmenu.embeds.edit.fields.max_values"),
            value: String(schema.maxValues || 1),
            inline: true,
          },
          {
            name: t(client, lang, "commands.selectmenu.embeds.edit.fields.disabled"),
            value: schema.disabled ? "✅" : "❌",
            inline: true,
          },
        );
      break;

    case "options":
      embed
        .setTitle(t(client, lang, "commands.selectmenu.embeds.options.title"))
        .setDescription(t(client, lang, "commands.selectmenu.embeds.options.description"));
      if (schema.options.length > 0) {
        schema.options.forEach((opt, index) => {
          embed.addFields({
            name: `${index + 1}. ${opt.label}${opt.default ? " ⭐" : ""}`,
            value: `Value: \`${opt.value}\`${opt.description ? `\nDesc: ${opt.description}` : ""}`,
            inline: true,
          });
        });
      }
      break;

    case "option_edit":
      const option = schema.options[optionIndex];
      embed
        .setTitle(t(client, lang, "commands.selectmenu.embeds.option_edit.title"))
        .setDescription(t(client, lang, "commands.selectmenu.embeds.option_edit.description"))
        .addFields(
          {
            name: t(client, lang, "commands.selectmenu.embeds.option_edit.fields.label"),
            value: option?.label || "Not set",
            inline: true,
          },
          {
            name: t(client, lang, "commands.selectmenu.embeds.option_edit.fields.value"),
            value: option?.value || "Not set",
            inline: true,
          },
          {
            name: t(client, lang, "commands.selectmenu.embeds.option_edit.fields.description"),
            value: option?.description || "Not set",
            inline: true,
          },
          {
            name: t(client, lang, "commands.selectmenu.embeds.option_edit.fields.emoji"),
            value: option?.emoji ? String(option.emoji) : "Not set",
            inline: true,
          },
          {
            name: t(client, lang, "commands.selectmenu.embeds.option_edit.fields.default"),
            value: option?.default ? "✅" : "❌",
            inline: true,
          },
        );
      break;

    case "emoji":
      embed
        .setTitle(t(client, lang, "commands.selectmenu.embeds.emoji.title"))
        .setDescription(t(client, lang, "commands.selectmenu.embeds.emoji.description"));
      break;
  }

  return embed;
}

function buildComponents(
  client: Client,
  lang: string,
  schema: SelectMenuCustom,
  view: ViewType,
  optionIndex: number,
  allMenus: SelectMenuCustom[],
  page: number,
  search: string,
  guild: any,
  emojiPage: number,
  emojisPerPage: number,
): ActionRowBuilder<MessageActionRowComponentBuilder>[] {
  const rows: ActionRowBuilder<MessageActionRowComponentBuilder>[] = [];

  switch (view) {
    case "main":
      rows.push(
        new ActionRowBuilder<MessageActionRowComponentBuilder>().setComponents(
          new StringSelectMenuBuilder()
            .setCustomId("NI_select:base")
            .setPlaceholder(t(client, lang, "commands.selectmenu.select_menus.base.placeholder"))
            .setOptions(
              new StringSelectMenuOptionBuilder()
                .setValue("create")
                .setLabel(t(client, lang, "commands.selectmenu.select_menus.base.options.create"))
                .setEmoji("➕"),
              new StringSelectMenuOptionBuilder()
                .setValue("edit")
                .setLabel(t(client, lang, "commands.selectmenu.select_menus.base.options.edit"))
                .setEmoji("📝"),
            ),
        ),
      );
      break;

    case "list":
      let menuList = [...allMenus];
      if (search) {
        const fuseSearch = new fuse(menuList, { keys: ["name", "placeholder"] });
        menuList = fuseSearch.search(search).map((r) => r.item);
      }

      const selectMenu = new StringSelectMenuBuilder()
        .setCustomId("NI_select:select")
        .setPlaceholder(t(client, lang, "commands.selectmenu.select_menus.list.placeholder"));

      if (menuList.length > 0) {
        menuList.slice(page * 25, page * 25 + 25).forEach((menu) => {
          selectMenu.addOptions(
            new StringSelectMenuOptionBuilder()
              .setValue(menu.id)
              .setLabel(menu.name || "Unnamed")
              .setDescription(`${menu.options.length} options`),
          );
        });
      } else {
        selectMenu
          .addOptions(
            new StringSelectMenuOptionBuilder()
              .setValue("none")
              .setLabel(t(client, lang, "commands.selectmenu.select_menus.list.no_menus")),
          )
          .setDisabled(true);
      }

      rows.push(new ActionRowBuilder<MessageActionRowComponentBuilder>().setComponents(selectMenu));

      rows.push(
        new ActionRowBuilder<MessageActionRowComponentBuilder>().setComponents(
          new ButtonBuilder()
            .setCustomId("NI_select:page_prev")
            .setEmoji("⬅️")
            .setStyle(ButtonStyle.Primary)
            .setDisabled(page === 0),
          new ButtonBuilder()
            .setCustomId("NI_select:page_info")
            .setLabel(`${page + 1}/${Math.ceil(allMenus.length / 25) || 1}`)
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(true),
          new ButtonBuilder()
            .setCustomId("NI_select:search")
            .setEmoji("🔍")
            .setStyle(ButtonStyle.Secondary),
          new ButtonBuilder()
            .setCustomId("NI_select:page_next")
            .setEmoji("➡️")
            .setStyle(ButtonStyle.Primary)
            .setDisabled(page >= Math.ceil(allMenus.length / 25) - 1),
          new ButtonBuilder()
            .setCustomId("NI_select:back")
            .setEmoji("🔙")
            .setStyle(ButtonStyle.Secondary),
        ),
      );
      break;

    case "edit":
      rows.push(
        new ActionRowBuilder<MessageActionRowComponentBuilder>().setComponents(
          new ButtonBuilder()
            .setCustomId("NI_select:name")
            .setLabel(t(client, lang, "commands.selectmenu.buttons.name"))
            .setStyle(ButtonStyle.Secondary)
            .setEmoji("🏷️"),
          new ButtonBuilder()
            .setCustomId("NI_select:placeholder")
            .setLabel(t(client, lang, "commands.selectmenu.buttons.placeholder"))
            .setStyle(ButtonStyle.Secondary)
            .setEmoji("💭"),
          new ButtonBuilder()
            .setCustomId("NI_select:minmax")
            .setLabel(t(client, lang, "commands.selectmenu.buttons.minmax"))
            .setStyle(ButtonStyle.Secondary)
            .setEmoji("🔢"),
          new ButtonBuilder()
            .setCustomId("NI_select:disabled")
            .setLabel(t(client, lang, "commands.selectmenu.buttons.disabled"))
            .setStyle(schema.disabled ? ButtonStyle.Success : ButtonStyle.Secondary)
            .setEmoji("🚫"),
        ),
      );

      rows.push(
        new ActionRowBuilder<MessageActionRowComponentBuilder>().setComponents(
          new ButtonBuilder()
            .setCustomId("NI_select:options")
            .setLabel(t(client, lang, "commands.selectmenu.buttons.options"))
            .setStyle(ButtonStyle.Primary)
            .setEmoji("📋"),
          new ButtonBuilder()
            .setCustomId("NI_select:preview")
            .setLabel(t(client, lang, "commands.selectmenu.buttons.preview"))
            .setStyle(ButtonStyle.Primary)
            .setEmoji("👁️"),
        ),
      );

      rows.push(
        new ActionRowBuilder<MessageActionRowComponentBuilder>().setComponents(
          new ButtonBuilder()
            .setCustomId("NI_select:save")
            .setLabel(t(client, lang, "commands.selectmenu.buttons.save"))
            .setStyle(ButtonStyle.Success)
            .setEmoji("💾"),
          new ButtonBuilder()
            .setCustomId("NI_select:delete")
            .setLabel(t(client, lang, "commands.selectmenu.buttons.delete"))
            .setStyle(ButtonStyle.Danger)
            .setEmoji("🗑️"),
          new ButtonBuilder()
            .setCustomId("NI_select:back")
            .setLabel(t(client, lang, "commands.selectmenu.buttons.back"))
            .setStyle(ButtonStyle.Secondary)
            .setEmoji("🔙"),
        ),
      );
      break;

    case "options":
      const optionsMenu = new StringSelectMenuBuilder()
        .setCustomId("NI_select:options_select")
        .setPlaceholder(t(client, lang, "commands.selectmenu.select_menus.options.placeholder"));

      if (schema.options.length > 0) {
        schema.options.forEach((opt, index) => {
          optionsMenu.addOptions(
            new StringSelectMenuOptionBuilder()
              .setValue(String(index))
              .setLabel(`${index + 1}. ${opt.label}`)
              .setDescription(opt.description || opt.value),
          );
        });
      }

      if (schema.options.length < SCENARIO_LIMITS.MAX_SELECT_MENU_OPTIONS) {
        optionsMenu.addOptions(
          new StringSelectMenuOptionBuilder()
            .setValue("add")
            .setLabel(t(client, lang, "commands.selectmenu.select_menus.options.add"))
            .setEmoji("➕"),
        );
      }

      if (optionsMenu.options.length === 0) {
        optionsMenu.addOptions(
          new StringSelectMenuOptionBuilder()
            .setValue("add")
            .setLabel(t(client, lang, "commands.selectmenu.select_menus.options.add"))
            .setEmoji("➕"),
        );
      }

      rows.push(
        new ActionRowBuilder<MessageActionRowComponentBuilder>().setComponents(optionsMenu),
      );

      rows.push(
        new ActionRowBuilder<MessageActionRowComponentBuilder>().setComponents(
          new ButtonBuilder()
            .setCustomId("NI_select:back")
            .setLabel(t(client, lang, "commands.selectmenu.buttons.back"))
            .setStyle(ButtonStyle.Secondary)
            .setEmoji("🔙"),
        ),
      );
      break;

    case "option_edit":
      rows.push(
        new ActionRowBuilder<MessageActionRowComponentBuilder>().setComponents(
          new ButtonBuilder()
            .setCustomId("NI_select:opt_label")
            .setLabel(t(client, lang, "commands.selectmenu.buttons.opt_label"))
            .setStyle(ButtonStyle.Secondary)
            .setEmoji("📝"),
          new ButtonBuilder()
            .setCustomId("NI_select:opt_value")
            .setLabel(t(client, lang, "commands.selectmenu.buttons.opt_value"))
            .setStyle(ButtonStyle.Secondary)
            .setEmoji("🔑"),
          new ButtonBuilder()
            .setCustomId("NI_select:opt_description")
            .setLabel(t(client, lang, "commands.selectmenu.buttons.opt_description"))
            .setStyle(ButtonStyle.Secondary)
            .setEmoji("📄"),
        ),
      );

      rows.push(
        new ActionRowBuilder<MessageActionRowComponentBuilder>().setComponents(
          new ButtonBuilder()
            .setCustomId("NI_select:opt_emoji")
            .setLabel(t(client, lang, "commands.selectmenu.buttons.opt_emoji"))
            .setStyle(ButtonStyle.Secondary)
            .setEmoji("😀"),
          new ButtonBuilder()
            .setCustomId("NI_select:opt_emoji_clear")
            .setLabel(t(client, lang, "commands.selectmenu.buttons.clear_emoji"))
            .setStyle(ButtonStyle.Secondary)
            .setEmoji("🗑️")
            .setDisabled(!schema.options[optionIndex]?.emoji),
          new ButtonBuilder()
            .setCustomId("NI_select:opt_default")
            .setLabel(t(client, lang, "commands.selectmenu.buttons.opt_default"))
            .setStyle(
              schema.options[optionIndex]?.default ? ButtonStyle.Success : ButtonStyle.Secondary,
            )
            .setEmoji("⭐"),
        ),
      );

      rows.push(
        new ActionRowBuilder<MessageActionRowComponentBuilder>().setComponents(
          new ButtonBuilder()
            .setCustomId("NI_select:opt_up")
            .setEmoji("⬆️")
            .setStyle(ButtonStyle.Primary)
            .setDisabled(optionIndex === 0),
          new ButtonBuilder()
            .setCustomId("NI_select:opt_down")
            .setEmoji("⬇️")
            .setStyle(ButtonStyle.Primary)
            .setDisabled(optionIndex >= schema.options.length - 1),
          new ButtonBuilder()
            .setCustomId("NI_select:opt_delete")
            .setLabel(t(client, lang, "commands.selectmenu.buttons.delete"))
            .setStyle(ButtonStyle.Danger)
            .setEmoji("🗑️"),
          new ButtonBuilder()
            .setCustomId("NI_select:back")
            .setLabel(t(client, lang, "commands.selectmenu.buttons.back"))
            .setStyle(ButtonStyle.Secondary)
            .setEmoji("🔙"),
        ),
      );
      break;

    case "emoji":
      const guildEmojis = Array.from(guild.emojis.cache.values());
      const startIndex = emojiPage * emojisPerPage;
      const pageEmojis = guildEmojis.slice(startIndex, startIndex + emojisPerPage);

      if (pageEmojis.length > 0) {
        const emojiSelect = new StringSelectMenuBuilder()
          .setCustomId("NI_select:emoji_select")
          .setPlaceholder(t(client, lang, "commands.selectmenu.select_menus.emoji.placeholder"));

        pageEmojis.forEach((emoji: any) => {
          emojiSelect.addOptions(
            new StringSelectMenuOptionBuilder()
              .setValue(emoji.id)
              .setLabel(emoji.name || "emoji")
              .setEmoji({ id: emoji.id, animated: emoji.animated }),
          );
        });

        rows.push(
          new ActionRowBuilder<MessageActionRowComponentBuilder>().setComponents(emojiSelect),
        );
      }

      rows.push(
        new ActionRowBuilder<MessageActionRowComponentBuilder>().setComponents(
          new ButtonBuilder()
            .setCustomId("NI_select:emoji_prev")
            .setEmoji("⬅️")
            .setStyle(ButtonStyle.Primary)
            .setDisabled(emojiPage === 0),
          new ButtonBuilder()
            .setCustomId("NI_select:emoji_page")
            .setLabel(`${emojiPage + 1}/${Math.ceil(guildEmojis.length / emojisPerPage) || 1}`)
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(true),
          new ButtonBuilder()
            .setCustomId("NI_select:emoji_next")
            .setEmoji("➡️")
            .setStyle(ButtonStyle.Primary)
            .setDisabled(emojiPage >= Math.ceil(guildEmojis.length / emojisPerPage) - 1),
          new ButtonBuilder()
            .setCustomId("NI_select:back")
            .setEmoji("🔙")
            .setStyle(ButtonStyle.Secondary),
        ),
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
  currentValue?: string,
): Promise<{ value: string | null; submitted: boolean }> {
  const labels: Record<string, string> = {
    name: t(client, lang, "commands.selectmenu.modals.name.label"),
    placeholder: t(client, lang, "commands.selectmenu.modals.placeholder.label"),
    opt_label: t(client, lang, "commands.selectmenu.modals.opt_label.label"),
    opt_value: t(client, lang, "commands.selectmenu.modals.opt_value.label"),
    opt_description: t(client, lang, "commands.selectmenu.modals.opt_description.label"),
  };

  const modalId = `NI_select:modal:${field}:${Date.now()}`;

  const modal = new ModalBuilder()
    .setTitle(labels[field] || field)
    .setCustomId(modalId)
    .setLabelComponents(
      new LabelBuilder().setLabel(labels[field] || field).setTextInputComponent(
        new TextInputBuilder()
          .setCustomId("NI_select:input")
          .setStyle(TextInputStyle.Short)
          .setRequired(field !== "opt_description")
          .setValue(currentValue || "")
          .setMaxLength(100),
      ),
    );

  await interaction.showModal(modal);

  try {
    const submitted = await interaction.awaitModalSubmit({
      filter: (i: any) => i.customId === modalId && i.user.id === interaction.user.id,
      time: 300000,
    });

    await submitted.deferUpdate();
    const value = submitted.fields.getTextInputValue("NI_select:input") || null;
    return { value, submitted: true };
  } catch {
    return { value: null, submitted: false };
  }
}

async function showMinMaxModal(
  interaction: any,
  client: Client,
  lang: string,
  minValue?: number,
  maxValue?: number,
): Promise<{ min: number; max: number; submitted: boolean }> {
  const modalId = `NI_select:modal:minmax:${Date.now()}`;

  const modal = new ModalBuilder()
    .setTitle(t(client, lang, "commands.selectmenu.modals.minmax.title"))
    .setCustomId(modalId)
    .setLabelComponents(
      new LabelBuilder()
        .setLabel(t(client, lang, "commands.selectmenu.modals.minmax.min_label"))
        .setTextInputComponent(
          new TextInputBuilder()
            .setCustomId("NI_select:min")
            .setStyle(TextInputStyle.Short)
            .setRequired(true)
            .setValue(String(minValue || 1))
            .setMaxLength(2),
        ),
      new LabelBuilder()
        .setLabel(t(client, lang, "commands.selectmenu.modals.minmax.max_label"))
        .setTextInputComponent(
          new TextInputBuilder()
            .setCustomId("NI_select:max")
            .setStyle(TextInputStyle.Short)
            .setRequired(true)
            .setValue(String(maxValue || 1))
            .setMaxLength(2),
        ),
    );

  await interaction.showModal(modal);

  try {
    const submitted = await interaction.awaitModalSubmit({
      filter: (i: any) => i.customId === modalId && i.user.id === interaction.user.id,
      time: 300000,
    });

    await submitted.deferUpdate();
    const min = parseInt(submitted.fields.getTextInputValue("NI_select:min")) || 1;
    const max = parseInt(submitted.fields.getTextInputValue("NI_select:max")) || 1;
    return { min, max, submitted: true };
  } catch {
    return { min: 1, max: 1, submitted: false };
  }
}

async function showSearchModal(
  interaction: any,
  client: Client,
  lang: string,
): Promise<{ value: string | null; submitted: boolean }> {
  const modalId = `NI_select:modal:search:${Date.now()}`;

  const modal = new ModalBuilder()
    .setTitle(t(client, lang, "commands.selectmenu.modals.search.title"))
    .setCustomId(modalId)
    .setLabelComponents(
      new LabelBuilder()
        .setLabel(t(client, lang, "commands.selectmenu.modals.search.label"))
        .setTextInputComponent(
          new TextInputBuilder()
            .setCustomId("NI_select:input")
            .setStyle(TextInputStyle.Short)
            .setRequired(false)
            .setMaxLength(100),
        ),
    );

  await interaction.showModal(modal);

  try {
    const submitted = await interaction.awaitModalSubmit({
      filter: (i: any) => i.customId === modalId && i.user.id === interaction.user.id,
      time: 300000,
    });

    await submitted.deferUpdate();
    const value = submitted.fields.getTextInputValue("NI_select:input") || null;
    return { value, submitted: true };
  } catch {
    return { value: null, submitted: false };
  }
}
