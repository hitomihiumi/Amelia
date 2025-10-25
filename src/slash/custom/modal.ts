import { ModalCustom, SlashCommand } from "../../types/helpers";
import {
  Client,
  PermissionsBitField,
  EmbedBuilder,
  ButtonBuilder,
  ActionRowBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ModalActionRowComponentBuilder,
  MessageActionRowComponentBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  ButtonStyle,
  StringSelectMenuInteraction,
  AttachmentBuilder,
  ButtonInteraction,
  ChatInputCommandInteraction,
  MessageFlagsBitField,
} from "discord.js";
import { Guild, canvasUtil, customUtil } from "../../helpers";
import { generateID } from "../../handlers/functions";
import fuse from "fuse.js";
import { t } from "../../i18n/helpers";

module.exports = {
  name: "modal",
  description: "Menu for creating and configuring custom modals",
  cooldown: 5,
  locale: {
    ru: "Меню создания и настройки кастомных модальных окон",
  },
  options: [],
  permissions: {
    bot: [PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.EmbedLinks],
  },
  key: null,
  run: async (client: Client, interaction: ChatInputCommandInteraction) => {
    if (!interaction.guild) return;

    await interaction.deferReply({ flags: [MessageFlagsBitField.Flags.Ephemeral] });

    let guild = new Guild(client, interaction.guild);

    let lang = (await guild.get(`settings.language`)) as string;
    let page = 0;
    let _schema = schema();
    _schema.id = generateID(guild.guild.id, "modal");
    let field = 0;
    let _back = "";
    let _search = "";

    let embed = new EmbedBuilder()
      .setTitle(t(client, lang, "commands.modal.embeds.base.title"))
      .setDescription(t(client, lang, "commands.modal.embeds.base.description"))
      .setColor(client.holder.colors.default);

    let base = new ActionRowBuilder<MessageActionRowComponentBuilder>().setComponents(
      new StringSelectMenuBuilder()
        .setCustomId("NI_modal:base")
        .setPlaceholder(t(client, lang, "commands.modal.select_menus.base.placeholder"))
        .setMaxValues(1)
        .setOptions(
          new StringSelectMenuOptionBuilder()
            .setValue("NI_modal:base:add")
            .setLabel(t(client, lang, "commands.modal.select_menus.base.options.create.label"))
            .setEmoji("➕")
            .setDescription(
              t(client, lang, "commands.modal.select_menus.base.options.create.description"),
            ),
          new StringSelectMenuOptionBuilder()
            .setValue("NI_modal:base:edit")
            .setLabel(t(client, lang, "commands.modal.select_menus.base.options.edit.label"))
            .setEmoji("📝")
            .setDescription(
              t(client, lang, "commands.modal.select_menus.base.options.edit.description"),
            ),
        ),
    );

    let searchrow = await modalList(client, lang, guild);

    let editrow = [
      new ActionRowBuilder<MessageActionRowComponentBuilder>().setComponents(
        new ButtonBuilder()
          .setCustomId("NI_modal:edit:title")
          .setLabel(t(client, lang, "commands.modal.buttons.edit_modal.title"))
          .setStyle(ButtonStyle.Secondary)
          .setEmoji("📝"),
        new ButtonBuilder()
          .setCustomId("NI_modal:edit:preview")
          .setLabel(t(client, lang, "commands.modal.buttons.edit_modal.preview"))
          .setStyle(ButtonStyle.Primary)
          .setEmoji("👁️"),
        new ButtonBuilder()
          .setCustomId("NI_modal:edit:back")
          .setLabel(t(client, lang, "commands.modal.buttons.edit_modal.back"))
          .setStyle(ButtonStyle.Secondary)
          .setEmoji("🔙"),
      ),
      new ActionRowBuilder<MessageActionRowComponentBuilder>().setComponents(
        new ButtonBuilder()
          .setCustomId("NI_modal:edit:delete")
          .setLabel(t(client, lang, "commands.modal.buttons.edit_modal.delete"))
          .setStyle(ButtonStyle.Danger)
          .setEmoji("🗑️"),
        new ButtonBuilder()
          .setCustomId("NI_modal:edit:save")
          .setLabel(t(client, lang, "commands.modal.buttons.edit_modal.save"))
          .setStyle(ButtonStyle.Success)
          .setEmoji("💾"),
      ),
    ];

    let editfieldrow = [
      new ActionRowBuilder<MessageActionRowComponentBuilder>().setComponents(
        new ButtonBuilder()
          .setCustomId("NI_modal:edit:label")
          .setLabel(t(client, lang, "commands.modal.buttons.edit_field.label"))
          .setStyle(ButtonStyle.Secondary)
          .setEmoji("📝"),
        new ButtonBuilder()
          .setCustomId("NI_modal:edit:placeholder")
          .setLabel(t(client, lang, "commands.modal.buttons.edit_field.placeholder"))
          .setStyle(ButtonStyle.Secondary)
          .setEmoji("💭"),
        new ButtonBuilder()
          .setCustomId("NI_modal:edit:style")
          .setLabel(t(client, lang, "commands.modal.buttons.edit_field.style"))
          .setStyle(ButtonStyle.Secondary)
          .setEmoji("🎨"),
      ),
      new ActionRowBuilder<MessageActionRowComponentBuilder>().setComponents(
        new ButtonBuilder()
          .setCustomId("NI_modal:edit:sizes")
          .setLabel(t(client, lang, "commands.modal.buttons.edit_field.sizes"))
          .setStyle(ButtonStyle.Secondary)
          .setEmoji("📏"),
        new ButtonBuilder()
          .setCustomId("NI_modal:edit:required")
          .setLabel(t(client, lang, "commands.modal.buttons.edit_field.required"))
          .setStyle(ButtonStyle.Secondary)
          .setEmoji("*️⃣"),
        new ButtonBuilder()
          .setCustomId("NI_modal:edit:field_delete")
          .setLabel(t(client, lang, "commands.modal.buttons.edit_field.delete"))
          .setStyle(ButtonStyle.Danger)
          .setEmoji("🗑️"),
      ),
    ];

    let msg = await interaction.editReply({ embeds: [embed], components: [base] });

    const filter = (i: any) => i.user.id === interaction.user.id;

    const collector = msg.createMessageComponentCollector({ filter, time: 600000 });

    collector.on("collect", async (i) => {
      if (i instanceof StringSelectMenuInteraction) {
        await i.deferUpdate();
        switch (i.customId) {
          case "NI_modal:base":
            switch (i.values[0]) {
              case "NI_modal:base:add":
                embed
                  .setTitle(t(client, lang, "commands.modal.embeds.edit.title"))
                  .setDescription(t(client, lang, "commands.modal.embeds.edit.description"))
                  .addFields({
                    name: t(client, lang, "commands.modal.embeds.edit.field.name"),
                    value: t(client, lang, "commands.modal.embeds.edit.field.value", _schema.title),
                  });
                await i.editReply({
                  embeds: [embed],
                  components: [...editrow, fieldList(client, lang, _schema)],
                });
                break;
              case "NI_modal:base:edit":
                embed
                  .setTitle(t(client, lang, "commands.modal.embeds.search.title"))
                  .setDescription(t(client, lang, "commands.modal.embeds.search.description"));
                await i.editReply({ embeds: [embed], components: searchrow });
                break;
            }
            _back = i.values[0];
            break;
          case "NI_modal:select":
            _schema = schema(
              (await mostUsedQueries.getModals(guild)).find(
                (m: ModalCustom) => m.id === i.values[0].split(":")[2],
              ),
            );
            embed
              .setTitle(t(client, lang, "commands.modal.embeds.edit.title"))
              .setDescription(t(client, lang, "commands.modal.embeds.edit.description"))
              .addFields({
                name: t(client, lang, "commands.modal.embeds.edit.field.name"),
                value: t(client, lang, "commands.modal.embeds.edit.field.value", _schema.title),
              });
            await i.editReply({
              embeds: [embed],
              components: [...editrow, fieldList(client, lang, _schema)],
            });
            _back = i.customId;
            break;
          case "NI_modal:select_field":
            if (i.values[0] === "NI_modal:select_field:main") {
              delete embed.data.fields;
              delete embed.data.image;

              embed
                .setTitle(t(client, lang, "commands.modal.embeds.edit.title"))
                .setDescription(t(client, lang, "commands.modal.embeds.edit.description"))
                .addFields({
                  name: t(client, lang, "commands.modal.embeds.edit.field.name"),
                  value: t(client, lang, "commands.modal.embeds.edit.field.value", _schema.title),
                });
              await i.editReply({
                embeds: [embed],
                components: [...editrow, fieldList(client, lang, _schema)],
                files: [],
              });
            } else {
              if (i.values[0] === "NI_modal:select_field:add") {
                _schema.fields.push({
                  id: generateID(guild.guild.id, "field"),
                  name: "Field",
                  type: "short",
                  placeholder: "",
                  min: 0,
                  max: 0,
                  required: false,
                });

                field = _schema.fields.length - 1;
              } else {
                field = _schema.fields.findIndex((f) => f.id === i.values[0].split(":")[2]);
              }

              let fieldEmbed = await modalFieldEmbed(embed, client, lang, _schema, field);
              embed = fieldEmbed.embed;

              await i.editReply({
                embeds: [embed],
                components: [fieldList(client, lang, _schema), ...editfieldrow],
                files: [fieldEmbed.attachment],
              });
            }
            break;
        }
      } else if (i instanceof ButtonInteraction) {
        if (i.customId === "NI_modal:page:prev") {
          page--;
          if (page > Math.ceil((await mostUsedQueries.getModals(guild)).length / 25))
            page = Math.ceil((await mostUsedQueries.getModals(guild)).length / 25) - 1;

          searchrow = await modalList(client, lang, guild, page);
          // @ts-ignore
          searchrow[1].components[1].setLabel(
            `${page + 1}/${Math.ceil((await mostUsedQueries.getModals(guild)).length / 25)}`,
          );

          await i.update({ embeds: [embed], components: searchrow });
        } else if (i.customId === "NI_modal:page:next") {
          page++;
          if (page > Math.ceil((await mostUsedQueries.getModals(guild)).length / 25))
            page = Math.ceil((await mostUsedQueries.getModals(guild)).length / 25) - 1;

          searchrow = await modalList(client, lang, guild, page);
          // @ts-ignore
          searchrow[1].components[1].setLabel(
            `${page + 1}/${Math.ceil((await mostUsedQueries.getModals(guild)).length / 25) || 1}`,
          );

          await i.update({ embeds: [embed], components: searchrow });
        } else if (i.customId === "NI_modal:page:jump") {
          let modal = new ModalBuilder()
            .setTitle(t(client, lang, "commands.modal.modals.jump.title"))
            .setCustomId("NI_modal:modal:jump")
            .setComponents(
              new ActionRowBuilder<ModalActionRowComponentBuilder>().setComponents(
                new TextInputBuilder()
                  .setCustomId("NI_modal:text:jump")
                  .setLabel(t(client, lang, "commands.modal.modals.jump.label"))
                  .setPlaceholder(
                    `1-${Math.ceil((await mostUsedQueries.getModals(guild)).length / 25) || 1}`,
                  )
                  .setStyle(TextInputStyle.Short),
              ),
            );

          await i.showModal(modal);

          const submit = await i.awaitModalSubmit({
            time: 5 * 60 * 1000,
            filter: (si: any) =>
              si.user.id === interaction.user.id && si.customId === "NI_modal:modal:jump",
          });

          let jump = parseInt(submit.fields.getTextInputValue("NI_modal:text:jump")) - 1;

          page =
            jump < 0
              ? 0
              : jump > Math.ceil((await mostUsedQueries.getModals(guild)).length / 25)
                ? Math.ceil((await mostUsedQueries.getModals(guild)).length / 25)
                : jump;

          searchrow = await modalList(client, lang, guild, page);
          // @ts-ignore
          searchrow[1].components[1].setLabel(
            `${page + 1}/${Math.ceil((await mostUsedQueries.getModals(guild)).length / 25) || 1}`,
          );

          // @ts-ignore
          submit.update({ components: searchrow });
        } else if (i.customId === "NI_modal:page:search") {
          let modal = new ModalBuilder()
            .setTitle(t(client, lang, "commands.modal.modals.search.title"))
            .setCustomId("NI_modal:modal:search")
            .setComponents(
              new ActionRowBuilder<ModalActionRowComponentBuilder>().setComponents(
                new TextInputBuilder()
                  .setCustomId("NI_modal:text:search")
                  .setLabel(t(client, lang, "commands.modal.modals.search.label"))
                  .setStyle(TextInputStyle.Short),
              ),
            );

          await i.showModal(modal);

          const submit = await i.awaitModalSubmit({
            time: 5 * 60 * 1000,
            filter: (si: any) =>
              si.user.id === interaction.user.id && si.customId === "NI_modal:modal:search",
          });

          _search = submit.fields.getTextInputValue("NI_modal:text:search");

          page = 0;

          searchrow = await modalList(client, lang, guild, page, _search);

          _back = i.customId;

          // @ts-ignore
          searchrow[1].components[1].setLabel(
            `${page + 1}/${Math.ceil((await mostUsedQueries.getModals(guild)).length / 25)}`,
          );

          delete embed.data.fields;

          embed.addFields({
            name: t(client, lang, "commands.modal.embeds.search.field.name"),
            value: t(client, lang, "commands.modal.embeds.search.field.value", _search),
          });
          // @ts-ignore
          submit.update({ embeds: [embed], components: searchrow });
        } else if (i.customId === "NI_modal:edit:title") {
          let modal = new ModalBuilder()
            .setTitle(t(client, lang, "commands.modal.modals.edit.title"))
            .setCustomId("NI_modal:modal:title")
            .setComponents(
              new ActionRowBuilder<ModalActionRowComponentBuilder>().setComponents(
                new TextInputBuilder()
                  .setCustomId("NI_modal:text:title")
                  .setLabel(t(client, lang, "commands.modal.modals.edit.label"))
                  .setPlaceholder(_schema.title)
                  .setStyle(TextInputStyle.Short)
                  .setRequired(true)
                  .setMinLength(1)
                  .setMaxLength(45),
              ),
            );

          await i.showModal(modal);

          const submit = await i.awaitModalSubmit({
            time: 5 * 60 * 1000,
            filter: (si: any) =>
              si.user.id === interaction.user.id && si.customId === "NI_modal:modal:title",
          });

          _schema.title = submit.fields.getTextInputValue("NI_modal:text:title");

          delete embed.data.fields;

          embed.addFields({
            name: t(client, lang, "commands.modal.embeds.edit.field.name"),
            value: t(client, lang, "commands.modal.embeds.edit.field.value", _schema.title),
          });

          // @ts-ignore
          submit.update({
            embeds: [embed],
            components: [...editrow, fieldList(client, lang, _schema)],
          });
        } else if (i.customId === "NI_modal:edit:preview") {
          await i.showModal(new customUtil.CustomModal(_schema).getModal());
        } else if (i.customId === "NI_modal:edit:save") {
          let modals = (await mostUsedQueries.getModals(guild)) as Array<ModalCustom>;

          if (modals.findIndex((m) => m.id === _schema.id) === -1) {
            modals.push(_schema);
          } else {
            modals[modals.findIndex((m) => m.id === _schema.id)] = _schema;
          }

          await mostUsedQueries.setModals(guild, modals);

          _schema = schema();

          delete embed.data.fields;

          embed
            .setTitle(t(client, lang, "commands.modal.embeds.base.title"))
            .setDescription(t(client, lang, "commands.modal.embeds.base.description"));
          await i.update({ embeds: [embed], components: [base] });
        } else if (i.customId === "NI_modal:edit:delete") {
          let modals = (await mostUsedQueries.getModals(guild)) as Array<ModalCustom>;

          modals = modals.filter((m) => m.id !== _schema.id);

          await mostUsedQueries.setModals(guild, modals);

          _schema = schema();

          delete embed.data.fields;

          embed
            .setTitle(t(client, lang, "commands.modal.embeds.base.title"))
            .setDescription(t(client, lang, "commands.modal.embeds.base.description"));
          await i.update({ embeds: [embed], components: [base] });
        } else if (i.customId === "NI_modal:edit:back") {
          switch (_back) {
            case "NI_modal:base:add":
              _back = "";
              delete embed.data.fields;
              embed
                .setTitle(t(client, lang, "commands.modal.embeds.base.title"))
                .setDescription(t(client, lang, "commands.modal.embeds.base.description"))
                .setColor(client.holder.colors.default);
              await i.update({ embeds: [embed], components: [base] });
              break;
            case "NI_modal:base:edit":
              _back = "";
              embed
                .setTitle(t(client, lang, "commands.modal.embeds.base.title"))
                .setDescription(t(client, lang, "commands.modal.embeds.base.description"));
              await i.update({ embeds: [embed], components: [base] });
              break;
            case "NI_modal:page:search":
              _back = "";

              searchrow = await modalList(client, lang, guild, page, _search);

              // @ts-ignore
              searchrow[1].components[1].setLabel(
                `${page + 1}/${Math.ceil((await mostUsedQueries.getModals(guild)).length / 25) || 1}`,
              );

              delete embed.data.fields;

              embed
                .setTitle(t(client, lang, "commands.modal.embeds.search.title"))
                .setDescription(t(client, lang, "commands.modal.embeds.search.description"))
                .addFields({
                  name: t(client, lang, "commands.modal.embeds.search.field.name"),
                  value: t(client, lang, "commands.modal.embeds.search.field.value", _search),
                });

              // @ts-ignore
              await i.update({ embeds: [embed], components: searchrow });
              break;
            case "NI_modal:select":
              _back = "";

              searchrow = await modalList(client, lang, guild, page);

              // @ts-ignore
              searchrow[1].components[1].setLabel(
                `${page + 1}/${Math.ceil((await mostUsedQueries.getModals(guild)).length / 25) || 1}`,
              );

              delete embed.data.fields;

              embed
                .setTitle(t(client, lang, "commands.modal.embeds.search.title"))
                .setDescription(t(client, lang, "commands.modal.embeds.search.description"));

              await i.update({ embeds: [embed], components: searchrow });
              break;
            default:
              _back = "";
              delete embed.data.fields;
              embed
                .setTitle(t(client, lang, "commands.modal.embeds.base.title"))
                .setDescription(t(client, lang, "commands.modal.embeds.base.description"))
                .setColor(client.holder.colors.default);
              await i.update({ embeds: [embed], components: [base] });
              break;
          }
        } else if (i.customId === "NI_modal:edit:label") {
          let modal = new ModalBuilder()
            .setTitle(t(client, lang, "commands.modal.modals.edit_field.label.title"))
            .setCustomId("NI_modal:modal:label")
            .setComponents(
              new ActionRowBuilder<ModalActionRowComponentBuilder>().setComponents(
                new TextInputBuilder()
                  .setCustomId("NI_modal:text:label")
                  .setLabel(t(client, lang, "commands.modal.modals.edit_field.label.label"))
                  .setPlaceholder(_schema.fields[field].name)
                  .setStyle(TextInputStyle.Short)
                  .setRequired(true)
                  .setMinLength(1)
                  .setMaxLength(45),
              ),
            );

          await i.showModal(modal);

          const submit = await i.awaitModalSubmit({
            time: 5 * 60 * 1000,
            filter: (si: any) =>
              si.user.id === interaction.user.id && si.customId === "NI_modal:modal:label",
          });

          _schema.fields[field].name = submit.fields.getTextInputValue("NI_modal:text:label");

          let fieldEmbed = await modalFieldEmbed(embed, client, lang, _schema, field);
          embed = fieldEmbed.embed;

          // @ts-ignore
          submit.update({
            embeds: [embed],
            components: [fieldList(client, lang, _schema), ...editfieldrow],
            files: [fieldEmbed.attachment],
          });
        } else if (i.customId === "NI_modal:edit:placeholder") {
          let modal = new ModalBuilder()
            .setTitle(t(client, lang, "commands.modal.modals.edit_field.placeholder.title"))
            .setCustomId("NI_modal:modal:placeholder")
            .setComponents(
              new ActionRowBuilder<ModalActionRowComponentBuilder>().setComponents(
                new TextInputBuilder()
                  .setCustomId("NI_modal:text:placeholder")
                  .setLabel(t(client, lang, "commands.modal.modals.edit_field.placeholder.label"))
                  .setPlaceholder(_schema.fields[field].placeholder || "")
                  .setStyle(TextInputStyle.Short)
                  .setRequired(true)
                  .setMinLength(1)
                  .setMaxLength(100),
              ),
            );

          await i.showModal(modal);

          const submit = await i.awaitModalSubmit({
            time: 5 * 60 * 1000,
            filter: (si: any) =>
              si.user.id === interaction.user.id && si.customId === "NI_modal:modal:placeholder",
          });

          _schema.fields[field].placeholder = submit.fields.getTextInputValue(
            "NI_modal:text:placeholder",
          );

          let fieldEmbed = await modalFieldEmbed(embed, client, lang, _schema, field);
          embed = fieldEmbed.embed;

          // @ts-ignore
          submit.update({
            embeds: [embed],
            components: [fieldList(client, lang, _schema), ...editfieldrow],
            files: [fieldEmbed.attachment],
          });
        } else if (i.customId === "NI_modal:edit:style") {
          if (_schema.fields[field].type === "short") {
            _schema.fields[field].type = "long";
          } else {
            _schema.fields[field].type = "short";
          }

          let fieldEmbed = await modalFieldEmbed(embed, client, lang, _schema, field);
          embed = fieldEmbed.embed;

          // @ts-ignore
          i.update({
            embeds: [embed],
            components: [fieldList(client, lang, _schema), ...editfieldrow],
            files: [fieldEmbed.attachment],
          });
        } else if (i.customId === "NI_modal:edit:sizes") {
          let modal = new ModalBuilder()
            .setTitle(t(client, lang, "commands.modal.modals.edit_field.sizes.title"))
            .setCustomId("NI_modal:modal:sizes")
            .setComponents(
              new ActionRowBuilder<ModalActionRowComponentBuilder>().setComponents(
                new TextInputBuilder()
                  .setCustomId("NI_modal:text:min")
                  .setLabel(t(client, lang, "commands.modal.modals.edit_field.sizes.min"))
                  .setPlaceholder(`${_schema.fields[field].min}` || "0")
                  .setStyle(TextInputStyle.Short)
                  .setRequired(true)
                  .setMinLength(1)
                  .setMaxLength(4),
              ),
              new ActionRowBuilder<ModalActionRowComponentBuilder>().setComponents(
                new TextInputBuilder()
                  .setCustomId("NI_modal:text:max")
                  .setLabel(t(client, lang, "commands.modal.modals.edit_field.sizes.max"))
                  .setPlaceholder(`${_schema.fields[field].max}` || "0")
                  .setStyle(TextInputStyle.Short)
                  .setRequired(true)
                  .setMinLength(1)
                  .setMaxLength(4),
              ),
            );

          await i.showModal(modal);

          const submit = await i.awaitModalSubmit({
            time: 5 * 60 * 1000,
            filter: (si: any) =>
              si.user.id === interaction.user.id && si.customId === "NI_modal:modal:sizes",
          });

          let min = parseInt(submit.fields.getTextInputValue("NI_modal:text:min"));
          let max = parseInt(submit.fields.getTextInputValue("NI_modal:text:max"));

          if (min < 0) min = 0;
          if (max < 0) max = 0;

          if (min > max) {
            let temp = min;
            min = max;
            max = temp;
          }

          if (min < 4000) min = 3999;
          if (max < 4000) max = 4000;

          _schema.fields[field].min = min;
          _schema.fields[field].max = max;

          let fieldEmbed = await modalFieldEmbed(embed, client, lang, _schema, field);
          embed = fieldEmbed.embed;

          // @ts-ignore
          submit.update({
            embeds: [embed],
            components: [fieldList(client, lang, _schema), ...editfieldrow],
            files: [fieldEmbed.attachment],
          });
        } else if (i.customId === "NI_modal:edit:required") {
          _schema.fields[field].required = !_schema.fields[field].required;

          let fieldEmbed = await modalFieldEmbed(embed, client, lang, _schema, field);
          embed = fieldEmbed.embed;

          // @ts-ignore
          i.update({
            embeds: [embed],
            components: [fieldList(client, lang, _schema), ...editfieldrow],
            files: [fieldEmbed.attachment],
          });
        } else if (i.customId === "NI_modal:edit:field_delete") {
          _schema.fields.splice(field, 1);

          field = 0;

          delete embed.data.fields;
          delete embed.data.image;

          embed
            .setTitle(t(client, lang, "commands.modal.embeds.edit.title"))
            .setDescription(t(client, lang, "commands.modal.embeds.edit.description"))
            .addFields({
              name: t(client, lang, "commands.modal.embeds.edit.field.name"),
              value: t(client, lang, "commands.modal.embeds.edit.field.value", _schema.title),
            });
          await i.update({
            embeds: [embed],
            components: [...editrow, fieldList(client, lang, _schema)],
            files: [],
          });
        }
      }
    });
  },
} as SlashCommand;

async function modalList(
  client: Client,
  lang: string,
  guild: Guild,
  page: number = 0,
  search?: string,
) {
  let arr = (await mostUsedQueries.getModals(guild)) as Array<ModalCustom>;

  if (search) {
    let fuseSearch = new fuse(arr, {
      keys: ["title"],
    });

    arr = fuseSearch.search(search).map((res) => res.item);
  }

  let select = new StringSelectMenuBuilder()
    .setCustomId("NI_modal:select")
    .setPlaceholder(t(client, lang, "commands.modal.select_menus.select.placeholder"))
    .setMaxValues(1);

  if (arr.length) {
    arr.slice(page * 25, page * 25 + 24).forEach((modal) => {
      select.addOptions(
        new StringSelectMenuOptionBuilder()
          .setValue(`NI_modal:select:` + modal.id)
          .setLabel(modal.title)
          .setDescription(`ID: ${modal.id}`),
      );
    });
  }

  if (select.options.length === 0) {
    select
      .addOptions(
        new StringSelectMenuOptionBuilder()
          .setValue("NI_modal:select:none")
          .setLabel("No modals found")
          .setEmoji("❌"),
      )
      .setDisabled(true);
  }

  return [
    new ActionRowBuilder<MessageActionRowComponentBuilder>().setComponents(select),
    new ActionRowBuilder<MessageActionRowComponentBuilder>().setComponents(
      new ButtonBuilder()
        .setCustomId("NI_modal:page:prev")
        .setEmoji("⬅️")
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId("NI_modal:page:jump")
        .setLabel(
          `${page + 1}/${Math.ceil((await mostUsedQueries.getModals(guild)).length / 25) || 1}`,
        )
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId("NI_modal:page:search")
        .setEmoji("🔍")
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(arr.length < 26),
      new ButtonBuilder()
        .setCustomId("NI_modal:page:next")
        .setEmoji("➡️")
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId("NI_modal:edit:back")
        .setLabel(t(client, lang, "commands.modal.buttons.edit_modal.back"))
        .setStyle(ButtonStyle.Secondary)
        .setEmoji("🔙"),
    ),
  ];
}

function fieldList(client: Client, lang: string, modal: ModalCustom) {
  let select = new StringSelectMenuBuilder()
    .setCustomId("NI_modal:select_field")
    .setPlaceholder(t(client, lang, "commands.modal.select_menus.select_field.placeholder"))
    .setMaxValues(1)
    .addOptions(
      new StringSelectMenuOptionBuilder()
        .setValue(`NI_modal:select_field:main`)
        .setLabel(t(client, lang, "commands.modal.select_menus.select_field.options.main.label"))
        .setDescription(
          t(client, lang, "commands.modal.select_menus.select_field.options.main.description"),
        )
        .setEmoji("🏠"),
    );

  if (modal.fields.length) {
    modal.fields.forEach((field) => {
      select.addOptions(
        new StringSelectMenuOptionBuilder()
          .setValue(`NI_modal:select_field:` + field.id)
          .setLabel(field.name)
          .setDescription(`ID: ${field.id}`),
      );
    });
  }

  if (select.options.length < 5) {
    select.addOptions(
      new StringSelectMenuOptionBuilder()
        .setValue(`NI_modal:select_field:add`)
        .setLabel(t(client, lang, "commands.modal.select_menus.select_field.options.add.label"))
        .setEmoji("➕")
        .setDescription(
          t(client, lang, "commands.modal.select_menus.select_field.options.add.description"),
        ),
    );
  }

  return new ActionRowBuilder<MessageActionRowComponentBuilder>().setComponents(select);
}

function schema(data?: ModalCustom): ModalCustom {
  return {
    id: data?.id || "",
    title: data?.title || "Modal",
    fields: data?.fields || [],
  };
}

async function modalFieldEmbed(
  embed: EmbedBuilder,
  client: Client,
  lang: string,
  _schema: ModalCustom,
  field: number,
) {
  delete embed.data.fields;
  delete embed.data.image;

  const attachment = new AttachmentBuilder(
    await new canvasUtil.ModalField(_schema.fields[field]).render(),
    {
      name: "field.png",
    },
  );

  embed
    .setTitle(t(client, lang, "commands.modal.embeds.edit_field.title"))
    .setDescription(t(client, lang, "commands.modal.embeds.edit_field.description"))
    .addFields(
      {
        name: t(client, lang, "commands.modal.embeds.edit_field.fields.name.name"),
        value: t(
          client,
          lang,
          "commands.modal.embeds.edit_field.fields.name.value",
          _schema.fields[field].name,
        ),
        inline: true,
      },
      {
        name: t(client, lang, "commands.modal.embeds.edit_field.fields.placeholder.name"),
        value: t(
          client,
          lang,
          "commands.modal.embeds.edit_field.fields.placeholder.value",
          _schema.fields[field].placeholder,
        ),
        inline: true,
      },
      {
        name: t(client, lang, "commands.modal.embeds.edit_field.fields.style.name"),
        value: t(
          client,
          lang,
          "commands.modal.embeds.edit_field.fields.style.value",
          _schema.fields[field].type,
        ),
      },
      {
        name: t(client, lang, "commands.modal.embeds.edit_field.fields.sizes.name"),
        value: t(
          client,
          lang,
          "commands.modal.embeds.edit_field.fields.sizes.value",
          _schema.fields[field].min,
          _schema.fields[field].max,
        ),
        inline: true,
      },
      {
        name: t(client, lang, "commands.modal.embeds.edit_field.fields.required.name"),
        value: t(
          client,
          lang,
          "commands.modal.embeds.edit_field.fields.required.value",
          _schema.fields[field].required,
        ),
        inline: true,
      },
    )
    .setImage(`attachment://field.png`);

  return { embed, attachment };
}

const mostUsedQueries = {
  getModals: async (guild: Guild) => {
    return (await guild.get("utils.components.modals")) as Array<ModalCustom>;
  },
  setModals: async (guild: Guild, modals: Array<ModalCustom>) => {
    await guild.set("utils.components.modals", modals);
  },
};
