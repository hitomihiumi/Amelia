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
  LabelBuilder,
  ColorResolvable,
} from "discord.js";
import { Guild, customUtil } from "../../helpers";
import { generateID } from "../../handlers/functions";
import fuse from "fuse.js";
import { t } from "../../i18n/helpers";
import { defaultPermissions } from "../../helpers/permissions";

type ViewType = "main" | "list" | "edit" | "fields" | "field_edit" | "author" | "footer";

module.exports = {
  name: "embed",
  description: "Menu for creating and configuring custom embeds",
  cooldown: 5,
  locale: {
    ru: "Меню создания и настройки кастомных эмбедов",
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
        _search
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
                const result = await showTextModal(i, i.values[0], client, lang, (_schema as any)[i.values[0]]);
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
                  content: t(client, lang, "commands.embed.messages.max_fields") as string,
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
            i.customId.split(":").pop() || ""
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
            } else if (currentView === "fields" || currentView === "author" || currentView === "footer") {
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
              embeds: [customEmbed.getEmbed()],
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
            const result = await showTextModal(i, "author_name", client, lang, _schema.author?.name);
            if (result.submitted) {
              _schema.author = _schema.author || { name: "" };
              _schema.author.name = result.value || "";
              await updateMessage();
            }
            break;
          }
          case "NI_embed:author_icon": {
            const result = await showTextModal(i, "author_icon", client, lang, _schema.author?.icon_url);
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
            const result = await showTextModal(i, "footer_text", client, lang, _schema.footer?.text);
            if (result.submitted) {
              _schema.footer = _schema.footer || { text: "" };
              _schema.footer.text = result.value || "";
              await updateMessage();
            }
            break;
          }
          case "NI_embed:footer_icon": {
            const result = await showTextModal(i, "footer_icon", client, lang, _schema.footer?.icon_url);
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
              _schema.fields?.[currentFieldIndex]?.name
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
              _schema.fields?.[currentFieldIndex]?.value
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
              _schema.fields[currentFieldIndex].inline =
                !_schema.fields[currentFieldIndex].inline;
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
  fieldIndex: number
): EmbedBuilder {
  const embed = new EmbedBuilder().setColor(client.holder.colors.default);

  switch (view) {
    case "main":
      embed
        .setTitle(t(client, lang, "commands.embed.embeds.base.title") as string)
        .setDescription(t(client, lang, "commands.embed.embeds.base.description") as string);
      break;

    case "list":
      embed
        .setTitle(t(client, lang, "commands.embed.embeds.list.title") as string)
        .setDescription(t(client, lang, "commands.embed.embeds.list.description") as string);
      break;

    case "edit":
      embed
        .setTitle(t(client, lang, "commands.embed.embeds.edit.title") as string)
        .setDescription(t(client, lang, "commands.embed.embeds.edit.description") as string)
        .addFields(
          {
            name: t(client, lang, "commands.embed.embeds.edit.fields.name") as string,
            value: schema.name || "Unnamed",
            inline: true,
          },
          {
            name: t(client, lang, "commands.embed.embeds.edit.fields.title") as string,
            value: schema.title || "Not set",
            inline: true,
          },
          {
            name: t(client, lang, "commands.embed.embeds.edit.fields.color") as string,
            value: String(schema.color) || "Not set",
            inline: true,
          },
          {
            name: t(client, lang, "commands.embed.embeds.edit.fields.fields_count") as string,
            value: String(schema.fields?.length || 0),
            inline: true,
          },
          {
            name: t(client, lang, "commands.embed.embeds.edit.fields.timestamp") as string,
            value: schema.timestamp ? "✅" : "❌",
            inline: true,
          }
        );
      break;

    case "fields":
      embed
        .setTitle(t(client, lang, "commands.embed.embeds.fields.title") as string)
        .setDescription(t(client, lang, "commands.embed.embeds.fields.description") as string);
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
        .setTitle(t(client, lang, "commands.embed.embeds.field_edit.title") as string)
        .setDescription(t(client, lang, "commands.embed.embeds.field_edit.description") as string)
        .addFields(
          {
            name: t(client, lang, "commands.embed.embeds.field_edit.fields.name") as string,
            value: field?.name || "Not set",
            inline: true,
          },
          {
            name: t(client, lang, "commands.embed.embeds.field_edit.fields.value") as string,
            value: field?.value?.substring(0, 100) || "Not set",
            inline: true,
          },
          {
            name: t(client, lang, "commands.embed.embeds.field_edit.fields.inline") as string,
            value: field?.inline ? "✅" : "❌",
            inline: true,
          }
        );
      break;

    case "author":
      embed
        .setTitle(t(client, lang, "commands.embed.embeds.author.title") as string)
        .setDescription(t(client, lang, "commands.embed.embeds.author.description") as string)
        .addFields(
          {
            name: t(client, lang, "commands.embed.embeds.author.fields.name") as string,
            value: schema.author?.name || "Not set",
            inline: true,
          },
          {
            name: t(client, lang, "commands.embed.embeds.author.fields.icon") as string,
            value: schema.author?.icon_url ? "✅ Set" : "❌ Not set",
            inline: true,
          },
          {
            name: t(client, lang, "commands.embed.embeds.author.fields.url") as string,
            value: schema.author?.url ? "✅ Set" : "❌ Not set",
            inline: true,
          }
        );
      break;

    case "footer":
      embed
        .setTitle(t(client, lang, "commands.embed.embeds.footer.title") as string)
        .setDescription(t(client, lang, "commands.embed.embeds.footer.description") as string)
        .addFields(
          {
            name: t(client, lang, "commands.embed.embeds.footer.fields.text") as string,
            value: schema.footer?.text || "Not set",
            inline: true,
          },
          {
            name: t(client, lang, "commands.embed.embeds.footer.fields.icon") as string,
            value: schema.footer?.icon_url ? "✅ Set" : "❌ Not set",
            inline: true,
          }
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
  search: string
): ActionRowBuilder<MessageActionRowComponentBuilder>[] {
  const rows: ActionRowBuilder<MessageActionRowComponentBuilder>[] = [];

  switch (view) {
    case "main":
      rows.push(
        new ActionRowBuilder<MessageActionRowComponentBuilder>().setComponents(
          new StringSelectMenuBuilder()
            .setCustomId("NI_embed:base")
            .setPlaceholder(t(client, lang, "commands.embed.select_menus.base.placeholder") as string)
            .setOptions(
              new StringSelectMenuOptionBuilder()
                .setValue("create")
                .setLabel(t(client, lang, "commands.embed.select_menus.base.options.create") as string)
                .setEmoji("➕"),
              new StringSelectMenuOptionBuilder()
                .setValue("edit")
                .setLabel(t(client, lang, "commands.embed.select_menus.base.options.edit") as string)
                .setEmoji("📝")
            )
        )
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
        .setPlaceholder(t(client, lang, "commands.embed.select_menus.list.placeholder") as string);

      if (embedList.length > 0) {
        embedList.slice(page * 25, page * 25 + 25).forEach((embed) => {
          selectMenu.addOptions(
            new StringSelectMenuOptionBuilder()
              .setValue(embed.id)
              .setLabel(embed.name || "Unnamed")
              .setDescription(`ID: ${embed.id}`)
          );
        });
      } else {
        selectMenu
          .addOptions(
            new StringSelectMenuOptionBuilder()
              .setValue("none")
              .setLabel(t(client, lang, "commands.embed.select_menus.list.no_embeds") as string)
          )
          .setDisabled(true);
      }

      rows.push(
        new ActionRowBuilder<MessageActionRowComponentBuilder>().setComponents(selectMenu)
      );

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
            .setStyle(ButtonStyle.Secondary)
        )
      );
      break;

    case "edit":
      rows.push(
        new ActionRowBuilder<MessageActionRowComponentBuilder>().setComponents(
          new StringSelectMenuBuilder()
            .setCustomId("NI_embed:edit_menu")
            .setPlaceholder(t(client, lang, "commands.embed.select_menus.edit.placeholder") as string)
            .setOptions(
              new StringSelectMenuOptionBuilder()
                .setValue("name")
                .setLabel(t(client, lang, "commands.embed.select_menus.edit.options.name") as string)
                .setEmoji("🏷️"),
              new StringSelectMenuOptionBuilder()
                .setValue("title")
                .setLabel(t(client, lang, "commands.embed.select_menus.edit.options.title") as string)
                .setEmoji("📝"),
              new StringSelectMenuOptionBuilder()
                .setValue("description")
                .setLabel(t(client, lang, "commands.embed.select_menus.edit.options.description") as string)
                .setEmoji("📄"),
              new StringSelectMenuOptionBuilder()
                .setValue("color")
                .setLabel(t(client, lang, "commands.embed.select_menus.edit.options.color") as string)
                .setEmoji("🎨"),
              new StringSelectMenuOptionBuilder()
                .setValue("thumbnail")
                .setLabel(t(client, lang, "commands.embed.select_menus.edit.options.thumbnail") as string)
                .setEmoji("🖼️"),
              new StringSelectMenuOptionBuilder()
                .setValue("image")
                .setLabel(t(client, lang, "commands.embed.select_menus.edit.options.image") as string)
                .setEmoji("📷"),
              new StringSelectMenuOptionBuilder()
                .setValue("author")
                .setLabel(t(client, lang, "commands.embed.select_menus.edit.options.author") as string)
                .setEmoji("👤"),
              new StringSelectMenuOptionBuilder()
                .setValue("footer")
                .setLabel(t(client, lang, "commands.embed.select_menus.edit.options.footer") as string)
                .setEmoji("📎"),
              new StringSelectMenuOptionBuilder()
                .setValue("fields")
                .setLabel(t(client, lang, "commands.embed.select_menus.edit.options.fields") as string)
                .setEmoji("📋"),
              new StringSelectMenuOptionBuilder()
                .setValue("timestamp")
                .setLabel(t(client, lang, "commands.embed.select_menus.edit.options.timestamp") as string)
                .setEmoji("🕐")
            )
        )
      );

      rows.push(
        new ActionRowBuilder<MessageActionRowComponentBuilder>().setComponents(
          new ButtonBuilder()
            .setCustomId("NI_embed:preview")
            .setLabel(t(client, lang, "commands.embed.buttons.preview") as string)
            .setStyle(ButtonStyle.Primary)
            .setEmoji("👁️"),
          new ButtonBuilder()
            .setCustomId("NI_embed:save")
            .setLabel(t(client, lang, "commands.embed.buttons.save") as string)
            .setStyle(ButtonStyle.Success)
            .setEmoji("💾"),
          new ButtonBuilder()
            .setCustomId("NI_embed:delete")
            .setLabel(t(client, lang, "commands.embed.buttons.delete") as string)
            .setStyle(ButtonStyle.Danger)
            .setEmoji("🗑️"),
          new ButtonBuilder()
            .setCustomId("NI_embed:back")
            .setLabel(t(client, lang, "commands.embed.buttons.back") as string)
            .setStyle(ButtonStyle.Secondary)
            .setEmoji("🔙")
        )
      );
      break;

    case "fields":
      const fieldsMenu = new StringSelectMenuBuilder()
        .setCustomId("NI_embed:fields_select")
        .setPlaceholder(t(client, lang, "commands.embed.select_menus.fields.placeholder") as string);

      if (schema.fields && schema.fields.length > 0) {
        schema.fields.forEach((field, index) => {
          fieldsMenu.addOptions(
            new StringSelectMenuOptionBuilder()
              .setValue(String(index))
              .setLabel(`${index + 1}. ${field.name}`)
              .setDescription(field.value.substring(0, 50))
          );
        });
      }

      if ((schema.fields?.length || 0) < SCENARIO_LIMITS.MAX_EMBED_FIELDS) {
        fieldsMenu.addOptions(
          new StringSelectMenuOptionBuilder()
            .setValue("add")
            .setLabel(t(client, lang, "commands.embed.select_menus.fields.add") as string)
            .setEmoji("➕")
        );
      }

      if (fieldsMenu.options.length === 0) {
        fieldsMenu
          .addOptions(
            new StringSelectMenuOptionBuilder()
              .setValue("add")
              .setLabel(t(client, lang, "commands.embed.select_menus.fields.add") as string)
              .setEmoji("➕")
          );
      }

      rows.push(
        new ActionRowBuilder<MessageActionRowComponentBuilder>().setComponents(fieldsMenu)
      );

      rows.push(
        new ActionRowBuilder<MessageActionRowComponentBuilder>().setComponents(
          new ButtonBuilder()
            .setCustomId("NI_embed:back")
            .setLabel(t(client, lang, "commands.embed.buttons.back") as string)
            .setStyle(ButtonStyle.Secondary)
            .setEmoji("🔙")
        )
      );
      break;

    case "field_edit":
      rows.push(
        new ActionRowBuilder<MessageActionRowComponentBuilder>().setComponents(
          new ButtonBuilder()
            .setCustomId("NI_embed:field_name")
            .setLabel(t(client, lang, "commands.embed.buttons.field_name") as string)
            .setStyle(ButtonStyle.Secondary)
            .setEmoji("📝"),
          new ButtonBuilder()
            .setCustomId("NI_embed:field_value")
            .setLabel(t(client, lang, "commands.embed.buttons.field_value") as string)
            .setStyle(ButtonStyle.Secondary)
            .setEmoji("📄"),
          new ButtonBuilder()
            .setCustomId("NI_embed:field_inline")
            .setLabel(t(client, lang, "commands.embed.buttons.field_inline") as string)
            .setStyle(schema.fields?.[fieldIndex]?.inline ? ButtonStyle.Success : ButtonStyle.Secondary)
            .setEmoji("↔️")
        )
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
            .setLabel(t(client, lang, "commands.embed.buttons.delete") as string)
            .setStyle(ButtonStyle.Danger)
            .setEmoji("🗑️"),
          new ButtonBuilder()
            .setCustomId("NI_embed:back")
            .setLabel(t(client, lang, "commands.embed.buttons.back") as string)
            .setStyle(ButtonStyle.Secondary)
            .setEmoji("🔙")
        )
      );
      break;

    case "author":
      rows.push(
        new ActionRowBuilder<MessageActionRowComponentBuilder>().setComponents(
          new ButtonBuilder()
            .setCustomId("NI_embed:author_name")
            .setLabel(t(client, lang, "commands.embed.buttons.author_name") as string)
            .setStyle(ButtonStyle.Secondary)
            .setEmoji("📝"),
          new ButtonBuilder()
            .setCustomId("NI_embed:author_icon")
            .setLabel(t(client, lang, "commands.embed.buttons.author_icon") as string)
            .setStyle(ButtonStyle.Secondary)
            .setEmoji("🖼️"),
          new ButtonBuilder()
            .setCustomId("NI_embed:author_url")
            .setLabel(t(client, lang, "commands.embed.buttons.author_url") as string)
            .setStyle(ButtonStyle.Secondary)
            .setEmoji("🔗")
        )
      );

      rows.push(
        new ActionRowBuilder<MessageActionRowComponentBuilder>().setComponents(
          new ButtonBuilder()
            .setCustomId("NI_embed:author_clear")
            .setLabel(t(client, lang, "commands.embed.buttons.clear") as string)
            .setStyle(ButtonStyle.Danger)
            .setEmoji("🗑️"),
          new ButtonBuilder()
            .setCustomId("NI_embed:back")
            .setLabel(t(client, lang, "commands.embed.buttons.back") as string)
            .setStyle(ButtonStyle.Secondary)
            .setEmoji("🔙")
        )
      );
      break;

    case "footer":
      rows.push(
        new ActionRowBuilder<MessageActionRowComponentBuilder>().setComponents(
          new ButtonBuilder()
            .setCustomId("NI_embed:footer_text")
            .setLabel(t(client, lang, "commands.embed.buttons.footer_text") as string)
            .setStyle(ButtonStyle.Secondary)
            .setEmoji("📝"),
          new ButtonBuilder()
            .setCustomId("NI_embed:footer_icon")
            .setLabel(t(client, lang, "commands.embed.buttons.footer_icon") as string)
            .setStyle(ButtonStyle.Secondary)
            .setEmoji("🖼️")
        )
      );

      rows.push(
        new ActionRowBuilder<MessageActionRowComponentBuilder>().setComponents(
          new ButtonBuilder()
            .setCustomId("NI_embed:footer_clear")
            .setLabel(t(client, lang, "commands.embed.buttons.clear") as string)
            .setStyle(ButtonStyle.Danger)
            .setEmoji("🗑️"),
          new ButtonBuilder()
            .setCustomId("NI_embed:back")
            .setLabel(t(client, lang, "commands.embed.buttons.back") as string)
            .setStyle(ButtonStyle.Secondary)
            .setEmoji("🔙")
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
    title: t(client, lang, "commands.embed.modals.title.label") as string,
    description: t(client, lang, "commands.embed.modals.description.label") as string,
    color: t(client, lang, "commands.embed.modals.color.label") as string,
    name: t(client, lang, "commands.embed.modals.name.label") as string,
    thumbnail: t(client, lang, "commands.embed.modals.thumbnail.label") as string,
    image: t(client, lang, "commands.embed.modals.image.label") as string,
    author_name: t(client, lang, "commands.embed.modals.author_name.label") as string,
    author_icon: t(client, lang, "commands.embed.modals.author_icon.label") as string,
    author_url: t(client, lang, "commands.embed.modals.author_url.label") as string,
    footer_text: t(client, lang, "commands.embed.modals.footer_text.label") as string,
    footer_icon: t(client, lang, "commands.embed.modals.footer_icon.label") as string,
    field_name: t(client, lang, "commands.embed.modals.field_name.label") as string,
    field_value: t(client, lang, "commands.embed.modals.field_value.label") as string,
  };

  const isLong = ["description", "field_value"].includes(field);
  const modalId = `NI_embed:modal:${field}:${Date.now()}`;

  const modal = new ModalBuilder()
    .setTitle(labels[field] || field)
    .setCustomId(modalId)
    .setComponents(
      new ActionRowBuilder<any>().setComponents(
        new TextInputBuilder()
          .setCustomId("NI_embed:input")
          .setLabel(labels[field] || field)
          .setStyle(isLong ? TextInputStyle.Paragraph : TextInputStyle.Short)
          .setRequired(false)
          .setValue(currentValue || "")
          .setMaxLength(isLong ? 4000 : 256)
      )
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
  lang: string
): Promise<{ value: string | null; submitted: boolean }> {
  const modalId = `NI_embed:modal:search:${Date.now()}`;

  const modal = new ModalBuilder()
    .setTitle(t(client, lang, "commands.embed.modals.search.title") as string)
    .setCustomId(modalId)
    .setComponents(
      new ActionRowBuilder<any>().setComponents(
        new TextInputBuilder()
          .setCustomId("NI_embed:input")
          .setLabel(t(client, lang, "commands.embed.modals.search.label") as string)
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
    const value = submitted.fields.getTextInputValue("NI_embed:input") || null;
    return { value, submitted: true };
  } catch {
    return { value: null, submitted: false };
  }
}

