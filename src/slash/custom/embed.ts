import { EmbedCustom, EmbedField, SlashCommand, SCENARIO_LIMITS } from "../../types/helpers";
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
  LabelBuilder, TextChannel,
} from "discord.js";
import { Guild, customUtil } from "../../helpers";
import { generateID } from "../../handlers/functions";
import fuse from "fuse.js";
import { t, tObject } from "../../i18n/helpers";
import { defaultPermissions } from "../../helpers";

type ViewType = "main" | "list" | "edit" | "fields" | "field_edit" | "author" | "footer";

module.exports = {
  name: "embed",
  description: "📋 Menu for creating and configuring custom embeds",
  cooldown: 5,
  locale: {
    ru: "📋 Меню создания и настройки кастомных эмбедов",
    uk: "📋 Меню створення та налаштування кастомних ембедів",
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
    let currentView: ViewType = "main";
    let _schema = schemaDefault(generateID(guild.guild.id, "embed"));
    let currentFieldIndex = 0;
    let _search = "";

    const updateMessage = async () => {
      const embed = buildEmbed(client, lang, _schema, currentView, currentFieldIndex);
      const components = buildComponents(
        client,
        lang,
        _schema,
        currentView,
        currentFieldIndex,
        await getEmbeds(guild),
        page,
        _search,
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
          case "NI_embed:base":
            if (i.values[0] === "create") {
              await i.deferUpdate();
              _schema = schemaDefault(generateID(guild.guild.id, "embed"));
              currentView = "edit";
            } else if (i.values[0] === "edit") {
              await i.deferUpdate();
              currentView = "list";
            }
            await updateMessage();
            break;

          case "NI_embed:select":
            await i.deferUpdate();
            const embeds = await getEmbeds(guild);
            const selected = embeds.find((e) => e.id === i.values[0]);
            if (selected) {
              _schema = { ...selected };
              currentView = "edit";
            }
            await updateMessage();
            break;

          case "NI_embed:edit_menu":
            switch (i.values[0]) {
              case "title":
              case "description":
              case "color":
              case "name":
              case "thumbnail":
              case "image": {
                const result = await showTextModal(
                  i,
                  i.values[0],
                  client,
                  lang,
                  (_schema as any)[i.values[0]],
                );
                if (result.submitted) {
                  if (i.values[0] === "color") {
                    if (result.value && /^#[0-9A-Fa-f]{6}$/.test(result.value)) {
                      _schema.color = result.value as any;
                    }
                  } else {
                    (_schema as any)[i.values[0]] = result.value || undefined;
                  }
                  await updateMessage();
                }
                break;
              }
              case "author":
                currentView = "author";
                await i.deferUpdate();
                await updateMessage();
                break;
              case "footer":
                currentView = "footer";
                await i.deferUpdate();
                await updateMessage();
                break;
              case "fields":
                currentView = "fields";
                await i.deferUpdate();
                await updateMessage();
                break;
              case "timestamp":
                _schema.timestamp = !_schema.timestamp;
                await i.deferUpdate();
                await updateMessage();
                break;
            }
            break;

          case "NI_embed:fields_select":
            if (i.values[0] === "add") {
              if ((_schema.fields?.length || 0) >= SCENARIO_LIMITS.MAX_EMBED_FIELDS) {
                await i.reply({
                  content: t(client, lang, "commands.embed.messages.max_fields"),
                  flags: MessageFlagsBitField.Flags.Ephemeral,
                });
                return;
              }
              await i.deferUpdate();
              _schema.fields = _schema.fields || [];
              _schema.fields.push({ name: "Field", value: "Value", inline: false });
              currentFieldIndex = _schema.fields.length - 1;
              currentView = "field_edit";
            } else {
              await i.deferUpdate();
              currentFieldIndex = parseInt(i.values[0]);
              currentView = "field_edit";
            }
            await updateMessage();
            break;
        }

        // Handle modal submissions for text inputs
        if (
          ["title", "description", "color", "name", "thumbnail", "image"].includes(
            i.customId.split(":").pop() || "",
          )
        ) {
          return; // Modal will be handled separately
        }
      }

      // Button handlers
      if (i.isButton()) {
        switch (i.customId) {
          case "NI_embed:back":
            await i.deferUpdate();
            if (currentView === "field_edit") {
              currentView = "fields";
            } else if (
              currentView === "fields" ||
              currentView === "author" ||
              currentView === "footer"
            ) {
              currentView = "edit";
            } else if (currentView === "edit" || currentView === "list") {
              currentView = "main";
              _schema = schemaDefault(generateID(guild.guild.id, "embed"));
            }
            await updateMessage();
            break;

          case "NI_embed:save":
            await i.deferUpdate();
            const embeds = await getEmbeds(guild);
            const existingIndex = embeds.findIndex((e) => e.id === _schema.id);
            if (existingIndex !== -1) {
              embeds[existingIndex] = _schema;
            } else {
              embeds.push(_schema);
            }
            await setEmbeds(guild, embeds);
            currentView = "main";
            _schema = schemaDefault(generateID(guild.guild.id, "embed"));
            await updateMessage();
            break;

          case "NI_embed:delete":
            await i.deferUpdate();
            const allEmbeds = await getEmbeds(guild);
            const filtered = allEmbeds.filter((e) => e.id !== _schema.id);
            await setEmbeds(guild, filtered);
            currentView = "main";
            _schema = schemaDefault(generateID(guild.guild.id, "embed"));
            await updateMessage();
            break;

          case "NI_embed:preview":
            await i.deferUpdate();
            const customEmbed = new customUtil.CustomEmbed(_schema);
            await i.followUp({
              embeds: [customEmbed.getEmbed({
                user: {
                  id: interaction.user.id,
                  name: interaction.user.username,
                  displayName: interaction.user.displayName,
                  mention: `<@${interaction.user.id}>`,
                  avatar: interaction.user.displayAvatarURL(),
                },
                channel: interaction.channel
                    ? {
                      id: interaction.channel.id,
                      name: (interaction.channel as TextChannel).name || "DM",
                      mention: `<#${interaction.channel.id}>`,
                    }
                    : undefined,
                guild: interaction.guild
                    ? {
                      id: interaction.guild.id,
                      name: interaction.guild.name,
                      icon: interaction.guild.iconURL(),
                    }
                    : undefined,
              })],
              flags: MessageFlagsBitField.Flags.Ephemeral,
            });
            break;

          case "NI_embed:page_prev":
            await i.deferUpdate();
            page = Math.max(0, page - 1);
            await updateMessage();
            break;

          case "NI_embed:page_next":
            await i.deferUpdate();
            const totalEmbeds = await getEmbeds(guild);
            const maxPage = Math.ceil(totalEmbeds.length / 25) - 1;
            page = Math.min(maxPage, page + 1);
            await updateMessage();
            break;

          case "NI_embed:search": {
            const searchResult = await showSearchModal(i, client, lang);
            if (searchResult.submitted) {
              _search = searchResult.value || "";
              page = 0;
              await updateMessage();
            }
            break;
          }

          // Author buttons
          case "NI_embed:author_name": {
            const result = await showTextModal(
              i,
              "author_name",
              client,
              lang,
              _schema.author?.name,
            );
            if (result.submitted) {
              _schema.author = _schema.author || { name: "" };
              _schema.author.name = result.value || "";
              await updateMessage();
            }
            break;
          }
          case "NI_embed:author_icon": {
            const result = await showTextModal(
              i,
              "author_icon",
              client,
              lang,
              _schema.author?.icon_url,
            );
            if (result.submitted) {
              _schema.author = _schema.author || { name: "" };
              _schema.author.icon_url = result.value || undefined;
              await updateMessage();
            }
            break;
          }
          case "NI_embed:author_url": {
            const result = await showTextModal(i, "author_url", client, lang, _schema.author?.url);
            if (result.submitted) {
              _schema.author = _schema.author || { name: "" };
              _schema.author.url = result.value || undefined;
              await updateMessage();
            }
            break;
          }
          case "NI_embed:author_clear":
            await i.deferUpdate();
            _schema.author = undefined;
            await updateMessage();
            break;

          // Footer buttons
          case "NI_embed:footer_text": {
            const result = await showTextModal(
              i,
              "footer_text",
              client,
              lang,
              _schema.footer?.text,
            );
            if (result.submitted) {
              _schema.footer = _schema.footer || { text: "" };
              _schema.footer.text = result.value || "";
              await updateMessage();
            }
            break;
          }
          case "NI_embed:footer_icon": {
            const result = await showTextModal(
              i,
              "footer_icon",
              client,
              lang,
              _schema.footer?.icon_url,
            );
            if (result.submitted) {
              _schema.footer = _schema.footer || { text: "" };
              _schema.footer.icon_url = result.value || undefined;
              await updateMessage();
            }
            break;
          }
          case "NI_embed:footer_clear":
            await i.deferUpdate();
            _schema.footer = undefined;
            await updateMessage();
            break;

          // Field buttons
          case "NI_embed:field_name": {
            const result = await showTextModal(
              i,
              "field_name",
              client,
              lang,
              _schema.fields?.[currentFieldIndex]?.name,
            );
            if (result.submitted && _schema.fields?.[currentFieldIndex]) {
              _schema.fields[currentFieldIndex].name = result.value || "Field";
              await updateMessage();
            }
            break;
          }
          case "NI_embed:field_value": {
            const result = await showTextModal(
              i,
              "field_value",
              client,
              lang,
              _schema.fields?.[currentFieldIndex]?.value,
            );
            if (result.submitted && _schema.fields?.[currentFieldIndex]) {
              _schema.fields[currentFieldIndex].value = result.value || "Value";
              await updateMessage();
            }
            break;
          }
          case "NI_embed:field_inline":
            await i.deferUpdate();
            if (_schema.fields?.[currentFieldIndex]) {
              _schema.fields[currentFieldIndex].inline = !_schema.fields[currentFieldIndex].inline;
            }
            await updateMessage();
            break;
          case "NI_embed:field_delete":
            await i.deferUpdate();
            _schema.fields?.splice(currentFieldIndex, 1);
            currentView = "fields";
            await updateMessage();
            break;
          case "NI_embed:field_up":
            await i.deferUpdate();
            if (currentFieldIndex > 0 && _schema.fields) {
              const temp = _schema.fields[currentFieldIndex];
              _schema.fields[currentFieldIndex] = _schema.fields[currentFieldIndex - 1];
              _schema.fields[currentFieldIndex - 1] = temp;
              currentFieldIndex--;
            }
            await updateMessage();
            break;
          case "NI_embed:field_down":
            await i.deferUpdate();
            if (_schema.fields && currentFieldIndex < _schema.fields.length - 1) {
              const temp = _schema.fields[currentFieldIndex];
              _schema.fields[currentFieldIndex] = _schema.fields[currentFieldIndex + 1];
              _schema.fields[currentFieldIndex + 1] = temp;
              currentFieldIndex++;
            }
            await updateMessage();
            break;

          case "NI_embed:show_hints": {
            // Build hints message using scenario hints (shared)
            const hints = tObject(client, lang, "commands.scenario.hints");

            const hintsContent = [
              `## ${hints.title}`,
              hints.description,
              "",
              hints.categories.user,
              hints.variables.user_id,
              hints.variables.user_name,
              hints.variables.user_displayName,
              hints.variables.user_mention,
              hints.variables.user_avatar,
              "",
              hints.categories.channel,
              hints.variables.channel_id,
              hints.variables.channel_name,
              hints.variables.channel_mention,
              "",
              hints.categories.guild,
              hints.variables.guild_id,
              hints.variables.guild_name,
              hints.variables.guild_icon,
              "",
              hints.categories.input,
              hints.variables.input_field,
              hints.variables.input_label,
              "",
              hints.categories.selected,
              hints.variables.selected_value,
              hints.variables.selected_label,
              "",
              hints.categories.variables,
              hints.variables.var_custom,
            ].join("\n");

            await i.reply({
              content: hintsContent,
              flags: MessageFlagsBitField.Flags.Ephemeral,
            });
            break;
          }
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
function schemaDefault(id: string): EmbedCustom {
  return {
    id,
    name: "New Embed",
    title: "Embed Title",
    description: "Embed description goes here",
    color: "#5865F2",
    fields: [],
    timestamp: false,
  };
}

async function getEmbeds(guild: Guild): Promise<EmbedCustom[]> {
  return (await guild.get("utils.components.embed")) as EmbedCustom[];
}

async function setEmbeds(guild: Guild, embeds: EmbedCustom[]): Promise<void> {
  await guild.set("utils.components.embed", embeds);
}

function buildEmbed(
  client: Client,
  lang: string,
  schema: EmbedCustom,
  view: ViewType,
  fieldIndex: number,
): EmbedBuilder {
  const embed = new EmbedBuilder().setColor(client.holder.colors.default);

  switch (view) {
    case "main":
      embed
        .setTitle(t(client, lang, "commands.embed.embeds.base.title"))
        .setDescription(t(client, lang, "commands.embed.embeds.base.description"));
      break;

    case "list":
      embed
        .setTitle(t(client, lang, "commands.embed.embeds.list.title"))
        .setDescription(t(client, lang, "commands.embed.embeds.list.description"));
      break;

    case "edit":
      embed
        .setTitle(t(client, lang, "commands.embed.embeds.edit.title"))
        .setDescription(t(client, lang, "commands.embed.embeds.edit.description"))
        .addFields(
          {
            name: t(client, lang, "commands.embed.embeds.edit.fields.name"),
            value: schema.name || "Unnamed",
            inline: true,
          },
          {
            name: t(client, lang, "commands.embed.embeds.edit.fields.title"),
            value: schema.title || "Not set",
            inline: true,
          },
          {
            name: t(client, lang, "commands.embed.embeds.edit.fields.color"),
            value: String(schema.color) || "Not set",
            inline: true,
          },
          {
            name: t(client, lang, "commands.embed.embeds.edit.fields.fields_count"),
            value: String(schema.fields?.length || 0),
            inline: true,
          },
          {
            name: t(client, lang, "commands.embed.embeds.edit.fields.timestamp"),
            value: schema.timestamp ? "✅" : "❌",
            inline: true,
          },
        );
      break;

    case "fields":
      embed
        .setTitle(t(client, lang, "commands.embed.embeds.fields.title"))
        .setDescription(t(client, lang, "commands.embed.embeds.fields.description"));
      if (schema.fields && schema.fields.length > 0) {
        schema.fields.forEach((field, index) => {
          embed.addFields({
            name: `${index + 1}. ${field.name}`,
            value: `${field.value.substring(0, 50)}${field.value.length > 50 ? "..." : ""} ${field.inline ? "(inline)" : ""}`,
          });
        });
      }
      break;

    case "field_edit":
      const field = schema.fields?.[fieldIndex];
      embed
        .setTitle(t(client, lang, "commands.embed.embeds.field_edit.title"))
        .setDescription(t(client, lang, "commands.embed.embeds.field_edit.description"))
        .addFields(
          {
            name: t(client, lang, "commands.embed.embeds.field_edit.fields.name"),
            value: field?.name || "Not set",
            inline: true,
          },
          {
            name: t(client, lang, "commands.embed.embeds.field_edit.fields.value"),
            value: field?.value?.substring(0, 100) || "Not set",
            inline: true,
          },
          {
            name: t(client, lang, "commands.embed.embeds.field_edit.fields.inline"),
            value: field?.inline ? "✅" : "❌",
            inline: true,
          },
        );
      break;

    case "author":
      embed
        .setTitle(t(client, lang, "commands.embed.embeds.author.title"))
        .setDescription(t(client, lang, "commands.embed.embeds.author.description"))
        .addFields(
          {
            name: t(client, lang, "commands.embed.embeds.author.fields.name"),
            value: schema.author?.name || "Not set",
            inline: true,
          },
          {
            name: t(client, lang, "commands.embed.embeds.author.fields.icon"),
            value: schema.author?.icon_url ? "✅ Set" : "❌ Not set",
            inline: true,
          },
          {
            name: t(client, lang, "commands.embed.embeds.author.fields.url"),
            value: schema.author?.url ? "✅ Set" : "❌ Not set",
            inline: true,
          },
        );
      break;

    case "footer":
      embed
        .setTitle(t(client, lang, "commands.embed.embeds.footer.title"))
        .setDescription(t(client, lang, "commands.embed.embeds.footer.description"))
        .addFields(
          {
            name: t(client, lang, "commands.embed.embeds.footer.fields.text"),
            value: schema.footer?.text || "Not set",
            inline: true,
          },
          {
            name: t(client, lang, "commands.embed.embeds.footer.fields.icon"),
            value: schema.footer?.icon_url ? "✅ Set" : "❌ Not set",
            inline: true,
          },
        );
      break;
  }

  return embed;
}

function buildComponents(
  client: Client,
  lang: string,
  schema: EmbedCustom,
  view: ViewType,
  fieldIndex: number,
  allEmbeds: EmbedCustom[],
  page: number,
  search: string,
): ActionRowBuilder<MessageActionRowComponentBuilder>[] {
  const rows: ActionRowBuilder<MessageActionRowComponentBuilder>[] = [];

  switch (view) {
    case "main":
      rows.push(
        new ActionRowBuilder<MessageActionRowComponentBuilder>().setComponents(
          new StringSelectMenuBuilder()
            .setCustomId("NI_embed:base")
            .setPlaceholder(t(client, lang, "commands.embed.select_menus.base.placeholder"))
            .setOptions(
              new StringSelectMenuOptionBuilder()
                .setValue("create")
                .setLabel(t(client, lang, "commands.embed.select_menus.base.options.create"))
                .setEmoji("➕"),
              new StringSelectMenuOptionBuilder()
                .setValue("edit")
                .setLabel(t(client, lang, "commands.embed.select_menus.base.options.edit"))
                .setEmoji("📝"),
            ),
        ),
      );
      break;

    case "list":
      let embedList = [...allEmbeds];
      if (search) {
        const fuseSearch = new fuse(embedList, { keys: ["name", "title"] });
        embedList = fuseSearch.search(search).map((r) => r.item);
      }

      const selectMenu = new StringSelectMenuBuilder()
        .setCustomId("NI_embed:select")
        .setPlaceholder(t(client, lang, "commands.embed.select_menus.list.placeholder"));

      if (embedList.length > 0) {
        embedList.slice(page * 25, page * 25 + 25).forEach((embed) => {
          selectMenu.addOptions(
            new StringSelectMenuOptionBuilder()
              .setValue(embed.id)
              .setLabel(embed.name || "Unnamed")
              .setDescription(`ID: ${embed.id}`),
          );
        });
      } else {
        selectMenu
          .addOptions(
            new StringSelectMenuOptionBuilder()
              .setValue("none")
              .setLabel(t(client, lang, "commands.embed.select_menus.list.no_embeds")),
          )
          .setDisabled(true);
      }

      rows.push(new ActionRowBuilder<MessageActionRowComponentBuilder>().setComponents(selectMenu));

      rows.push(
        new ActionRowBuilder<MessageActionRowComponentBuilder>().setComponents(
          new ButtonBuilder()
            .setCustomId("NI_embed:page_prev")
            .setEmoji("⬅️")
            .setStyle(ButtonStyle.Primary)
            .setDisabled(page === 0),
          new ButtonBuilder()
            .setCustomId("NI_embed:page_info")
            .setLabel(`${page + 1}/${Math.ceil(allEmbeds.length / 25) || 1}`)
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(true),
          new ButtonBuilder()
            .setCustomId("NI_embed:search")
            .setEmoji("🔍")
            .setStyle(ButtonStyle.Secondary),
          new ButtonBuilder()
            .setCustomId("NI_embed:page_next")
            .setEmoji("➡️")
            .setStyle(ButtonStyle.Primary)
            .setDisabled(page >= Math.ceil(allEmbeds.length / 25) - 1),
          new ButtonBuilder()
            .setCustomId("NI_embed:back")
            .setEmoji("🔙")
            .setStyle(ButtonStyle.Secondary),
        ),
      );
      break;

    case "edit":
      rows.push(
        new ActionRowBuilder<MessageActionRowComponentBuilder>().setComponents(
          new StringSelectMenuBuilder()
            .setCustomId("NI_embed:edit_menu")
            .setPlaceholder(t(client, lang, "commands.embed.select_menus.edit.placeholder"))
            .setOptions(
              new StringSelectMenuOptionBuilder()
                .setValue("name")
                .setLabel(t(client, lang, "commands.embed.select_menus.edit.options.name"))
                .setEmoji("🏷️"),
              new StringSelectMenuOptionBuilder()
                .setValue("title")
                .setLabel(t(client, lang, "commands.embed.select_menus.edit.options.title"))
                .setEmoji("📝"),
              new StringSelectMenuOptionBuilder()
                .setValue("description")
                .setLabel(t(client, lang, "commands.embed.select_menus.edit.options.description"))
                .setEmoji("📄"),
              new StringSelectMenuOptionBuilder()
                .setValue("color")
                .setLabel(t(client, lang, "commands.embed.select_menus.edit.options.color"))
                .setEmoji("🎨"),
              new StringSelectMenuOptionBuilder()
                .setValue("thumbnail")
                .setLabel(t(client, lang, "commands.embed.select_menus.edit.options.thumbnail"))
                .setEmoji("🖼️"),
              new StringSelectMenuOptionBuilder()
                .setValue("image")
                .setLabel(t(client, lang, "commands.embed.select_menus.edit.options.image"))
                .setEmoji("📷"),
              new StringSelectMenuOptionBuilder()
                .setValue("author")
                .setLabel(t(client, lang, "commands.embed.select_menus.edit.options.author"))
                .setEmoji("👤"),
              new StringSelectMenuOptionBuilder()
                .setValue("footer")
                .setLabel(t(client, lang, "commands.embed.select_menus.edit.options.footer"))
                .setEmoji("📎"),
              new StringSelectMenuOptionBuilder()
                .setValue("fields")
                .setLabel(t(client, lang, "commands.embed.select_menus.edit.options.fields"))
                .setEmoji("📋"),
              new StringSelectMenuOptionBuilder()
                .setValue("timestamp")
                .setLabel(t(client, lang, "commands.embed.select_menus.edit.options.timestamp"))
                .setEmoji("🕐"),
            ),
        ),
      );

      rows.push(
        new ActionRowBuilder<MessageActionRowComponentBuilder>().setComponents(
          new ButtonBuilder()
            .setCustomId("NI_embed:preview")
            .setLabel(t(client, lang, "commands.embed.buttons.preview"))
            .setStyle(ButtonStyle.Primary)
            .setEmoji("👁️"),
          new ButtonBuilder()
            .setCustomId("NI_embed:show_hints")
            .setLabel(t(client, lang, "commands.scenario.hints.button"))
            .setStyle(ButtonStyle.Secondary)
            .setEmoji("📝"),
          new ButtonBuilder()
            .setCustomId("NI_embed:save")
            .setLabel(t(client, lang, "commands.embed.buttons.save"))
            .setStyle(ButtonStyle.Success)
            .setEmoji("💾"),
          new ButtonBuilder()
            .setCustomId("NI_embed:delete")
            .setLabel(t(client, lang, "commands.embed.buttons.delete"))
            .setStyle(ButtonStyle.Danger)
            .setEmoji("🗑️"),
          new ButtonBuilder()
            .setCustomId("NI_embed:back")
            .setLabel(t(client, lang, "commands.embed.buttons.back"))
            .setStyle(ButtonStyle.Secondary)
            .setEmoji("🔙"),
        ),
      );
      break;

    case "fields":
      const fieldsMenu = new StringSelectMenuBuilder()
        .setCustomId("NI_embed:fields_select")
        .setPlaceholder(t(client, lang, "commands.embed.select_menus.fields.placeholder"));

      if (schema.fields && schema.fields.length > 0) {
        schema.fields.forEach((field, index) => {
          fieldsMenu.addOptions(
            new StringSelectMenuOptionBuilder()
              .setValue(String(index))
              .setLabel(`${index + 1}. ${field.name}`)
              .setDescription(field.value.substring(0, 50)),
          );
        });
      }

      if ((schema.fields?.length || 0) < SCENARIO_LIMITS.MAX_EMBED_FIELDS) {
        fieldsMenu.addOptions(
          new StringSelectMenuOptionBuilder()
            .setValue("add")
            .setLabel(t(client, lang, "commands.embed.select_menus.fields.add"))
            .setEmoji("➕"),
        );
      }

      if (fieldsMenu.options.length === 0) {
        fieldsMenu.addOptions(
          new StringSelectMenuOptionBuilder()
            .setValue("add")
            .setLabel(t(client, lang, "commands.embed.select_menus.fields.add"))
            .setEmoji("➕"),
        );
      }

      rows.push(new ActionRowBuilder<MessageActionRowComponentBuilder>().setComponents(fieldsMenu));

      rows.push(
        new ActionRowBuilder<MessageActionRowComponentBuilder>().setComponents(
          new ButtonBuilder()
            .setCustomId("NI_embed:back")
            .setLabel(t(client, lang, "commands.embed.buttons.back"))
            .setStyle(ButtonStyle.Secondary)
            .setEmoji("🔙"),
        ),
      );
      break;

    case "field_edit":
      rows.push(
        new ActionRowBuilder<MessageActionRowComponentBuilder>().setComponents(
          new ButtonBuilder()
            .setCustomId("NI_embed:field_name")
            .setLabel(t(client, lang, "commands.embed.buttons.field_name"))
            .setStyle(ButtonStyle.Secondary)
            .setEmoji("📝"),
          new ButtonBuilder()
            .setCustomId("NI_embed:field_value")
            .setLabel(t(client, lang, "commands.embed.buttons.field_value"))
            .setStyle(ButtonStyle.Secondary)
            .setEmoji("📄"),
          new ButtonBuilder()
            .setCustomId("NI_embed:field_inline")
            .setLabel(t(client, lang, "commands.embed.buttons.field_inline"))
            .setStyle(
              schema.fields?.[fieldIndex]?.inline ? ButtonStyle.Success : ButtonStyle.Secondary,
            )
            .setEmoji("↔️"),
        ),
      );

      rows.push(
        new ActionRowBuilder<MessageActionRowComponentBuilder>().setComponents(
          new ButtonBuilder()
            .setCustomId("NI_embed:field_up")
            .setEmoji("⬆️")
            .setStyle(ButtonStyle.Primary)
            .setDisabled(fieldIndex === 0),
          new ButtonBuilder()
            .setCustomId("NI_embed:field_down")
            .setEmoji("⬇️")
            .setStyle(ButtonStyle.Primary)
            .setDisabled(fieldIndex >= (schema.fields?.length || 1) - 1),
          new ButtonBuilder()
            .setCustomId("NI_embed:field_delete")
            .setLabel(t(client, lang, "commands.embed.buttons.delete"))
            .setStyle(ButtonStyle.Danger)
            .setEmoji("🗑️"),
          new ButtonBuilder()
            .setCustomId("NI_embed:back")
            .setLabel(t(client, lang, "commands.embed.buttons.back"))
            .setStyle(ButtonStyle.Secondary)
            .setEmoji("🔙"),
        ),
      );
      break;

    case "author":
      rows.push(
        new ActionRowBuilder<MessageActionRowComponentBuilder>().setComponents(
          new ButtonBuilder()
            .setCustomId("NI_embed:author_name")
            .setLabel(t(client, lang, "commands.embed.buttons.author_name"))
            .setStyle(ButtonStyle.Secondary)
            .setEmoji("📝"),
          new ButtonBuilder()
            .setCustomId("NI_embed:author_icon")
            .setLabel(t(client, lang, "commands.embed.buttons.author_icon"))
            .setStyle(ButtonStyle.Secondary)
            .setEmoji("🖼️"),
          new ButtonBuilder()
            .setCustomId("NI_embed:author_url")
            .setLabel(t(client, lang, "commands.embed.buttons.author_url"))
            .setStyle(ButtonStyle.Secondary)
            .setEmoji("🔗"),
        ),
      );

      rows.push(
        new ActionRowBuilder<MessageActionRowComponentBuilder>().setComponents(
          new ButtonBuilder()
            .setCustomId("NI_embed:author_clear")
            .setLabel(t(client, lang, "commands.embed.buttons.clear"))
            .setStyle(ButtonStyle.Danger)
            .setEmoji("🗑️"),
          new ButtonBuilder()
            .setCustomId("NI_embed:back")
            .setLabel(t(client, lang, "commands.embed.buttons.back"))
            .setStyle(ButtonStyle.Secondary)
            .setEmoji("🔙"),
        ),
      );
      break;

    case "footer":
      rows.push(
        new ActionRowBuilder<MessageActionRowComponentBuilder>().setComponents(
          new ButtonBuilder()
            .setCustomId("NI_embed:footer_text")
            .setLabel(t(client, lang, "commands.embed.buttons.footer_text"))
            .setStyle(ButtonStyle.Secondary)
            .setEmoji("📝"),
          new ButtonBuilder()
            .setCustomId("NI_embed:footer_icon")
            .setLabel(t(client, lang, "commands.embed.buttons.footer_icon"))
            .setStyle(ButtonStyle.Secondary)
            .setEmoji("🖼️"),
        ),
      );

      rows.push(
        new ActionRowBuilder<MessageActionRowComponentBuilder>().setComponents(
          new ButtonBuilder()
            .setCustomId("NI_embed:footer_clear")
            .setLabel(t(client, lang, "commands.embed.buttons.clear"))
            .setStyle(ButtonStyle.Danger)
            .setEmoji("🗑️"),
          new ButtonBuilder()
            .setCustomId("NI_embed:back")
            .setLabel(t(client, lang, "commands.embed.buttons.back"))
            .setStyle(ButtonStyle.Secondary)
            .setEmoji("🔙"),
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
    title: t(client, lang, "commands.embed.modals.title.label"),
    description: t(client, lang, "commands.embed.modals.description.label"),
    color: t(client, lang, "commands.embed.modals.color.label"),
    name: t(client, lang, "commands.embed.modals.name.label"),
    thumbnail: t(client, lang, "commands.embed.modals.thumbnail.label"),
    image: t(client, lang, "commands.embed.modals.image.label"),
    author_name: t(client, lang, "commands.embed.modals.author_name.label"),
    author_icon: t(client, lang, "commands.embed.modals.author_icon.label"),
    author_url: t(client, lang, "commands.embed.modals.author_url.label"),
    footer_text: t(client, lang, "commands.embed.modals.footer_text.label"),
    footer_icon: t(client, lang, "commands.embed.modals.footer_icon.label"),
    field_name: t(client, lang, "commands.embed.modals.field_name.label"),
    field_value: t(client, lang, "commands.embed.modals.field_value.label"),
  };

  const isLong = ["description", "field_value"].includes(field);
  const modalId = `NI_embed:modal:${field}:${Date.now()}`;

  const modal = new ModalBuilder()
    .setTitle(labels[field] || field)
    .setCustomId(modalId)
    .setLabelComponents(
      new LabelBuilder().setLabel(labels[field] || field).setTextInputComponent(
        new TextInputBuilder()
          .setCustomId("NI_embed:input")
          .setStyle(isLong ? TextInputStyle.Paragraph : TextInputStyle.Short)
          .setRequired(false)
          .setValue(currentValue || "")
          .setMaxLength(isLong ? 4000 : 256),
      ),
    );

  await interaction.showModal(modal);

  try {
    const submitted = await interaction.awaitModalSubmit({
      filter: (i: any) => i.customId === modalId && i.user.id === interaction.user.id,
      time: 300000,
    });

    await submitted.deferUpdate();
    const value = submitted.fields.getTextInputValue("NI_embed:input") || null;
    return { value, submitted: true };
  } catch {
    return { value: null, submitted: false };
  }
}

async function showSearchModal(
  interaction: any,
  client: Client,
  lang: string,
): Promise<{ value: string | null; submitted: boolean }> {
  const modalId = `NI_embed:modal:search:${Date.now()}`;

  const modal = new ModalBuilder()
    .setTitle(t(client, lang, "commands.embed.modals.search.title"))
    .setCustomId(modalId)
    .setLabelComponents(
      new LabelBuilder()
        .setLabel(t(client, lang, "commands.embed.modals.search.label"))
        .setTextInputComponent(
          new TextInputBuilder()
            .setCustomId("NI_embed:input")
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
    const value = submitted.fields.getTextInputValue("NI_embed:input") || null;
    return { value, submitted: true };
  } catch {
    return { value: null, submitted: false };
  }
}
