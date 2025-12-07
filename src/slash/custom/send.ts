import {
  SlashCommand,
  EmbedCustom,
  ButtonCustom,
  SelectMenuCustom,
} from "../../types/helpers";
import {
  Client,
  EmbedBuilder,
  ButtonBuilder,
  ActionRowBuilder,
  MessageActionRowComponentBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  ButtonStyle,
  ChatInputCommandInteraction,
  MessageFlagsBitField,
  TextChannel,
  ChannelSelectMenuBuilder,
  ChannelType,
} from "discord.js";
import { Guild, customUtil } from "../../helpers";
import { t } from "../../i18n/helpers";
import { defaultPermissions } from "../../helpers/permissions";

type ViewType = "main" | "select_embeds" | "select_buttons" | "select_selectmenus" | "select_channel" | "preview";

interface MessageComposition {
  content: string | null;
  embeds: EmbedCustom[];
  buttons: ButtonCustom[];
  selectMenus: SelectMenuCustom[];
  channelId: string | null;
}

module.exports = {
  name: "send",
  description: "Compose and send messages with custom components",
  cooldown: 5,
  locale: {
    ru: "Собрать и отправить сообщение с кастомными компонентами",
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

    let currentView: ViewType = "main";
    let composition: MessageComposition = {
      content: null,
      embeds: [],
      buttons: [],
      selectMenus: [],
      channelId: null,
    };
    let embedPage = 0;
    let buttonPage = 0;
    let selectMenuPage = 0;
    const ITEMS_PER_PAGE = 25;

    const updateMessage = async () => {
      const embed = await buildEmbed(client, lang, composition, currentView, guild);
      const components = await buildComponents(
        client,
        lang,
        composition,
        currentView,
        guild,
        embedPage,
        buttonPage,
        selectMenuPage,
        ITEMS_PER_PAGE
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
      try {
        // String Select Menu handlers
        if (i.isStringSelectMenu()) {
          switch (i.customId) {
            case "NI_send:main_menu":
              switch (i.values[0]) {
                case "content":
                  const contentResult = await showContentModal(i);
                  if (contentResult.submitted) {
                    composition.content = contentResult.value;
                    await updateMessage();
                  }
                  break;
                case "embeds":
                  await i.deferUpdate();
                  currentView = "select_embeds";
                  await updateMessage();
                  break;
                case "buttons":
                  await i.deferUpdate();
                  currentView = "select_buttons";
                  await updateMessage();
                  break;
                case "selectmenus":
                  await i.deferUpdate();
                  currentView = "select_selectmenus";
                  await updateMessage();
                  break;
                case "channel":
                  await i.deferUpdate();
                  currentView = "select_channel";
                  await updateMessage();
                  break;
              }
              break;

            case "NI_send:select_embeds": {
              await i.deferUpdate();
              const embeds = await getEmbeds(guild);
              const selectedIds = i.values;
              composition.embeds = embeds.filter((e) => selectedIds.includes(e.id));
              currentView = "main";
              await updateMessage();
              break;
            }

            case "NI_send:select_buttons": {
              await i.deferUpdate();
              const buttons = await getButtons(guild);
              const selectedIds = i.values;
              composition.buttons = buttons.filter((b) => selectedIds.includes(b.id));
              currentView = "main";
              await updateMessage();
              break;
            }

            case "NI_send:select_selectmenus": {
              await i.deferUpdate();
              const selectMenus = await getSelectMenus(guild);
              const selectedIds = i.values;
              composition.selectMenus = selectMenus.filter((s) => selectedIds.includes(s.id));
              currentView = "main";
              await updateMessage();
              break;
            }
          }
        }

        // Channel Select Menu handlers
        if (i.isChannelSelectMenu()) {
          if (i.customId === "NI_send:select_channel") {
            await i.deferUpdate();
            composition.channelId = i.values[0];
            currentView = "main";
            await updateMessage();
          }
        }

        // Button handlers
        if (i.isButton()) {
          switch (i.customId) {
            case "NI_send:back":
              await i.deferUpdate();
              currentView = "main";
              await updateMessage();
              break;

            case "NI_send:clear_embeds":
              await i.deferUpdate();
              composition.embeds = [];
              await updateMessage();
              break;

            case "NI_send:clear_buttons":
              await i.deferUpdate();
              composition.buttons = [];
              await updateMessage();
              break;

            case "NI_send:clear_selectmenus":
              await i.deferUpdate();
              composition.selectMenus = [];
              await updateMessage();
              break;

            case "NI_send:clear_content":
              await i.deferUpdate();
              composition.content = null;
              await updateMessage();
              break;

            case "NI_send:clear_channel":
              await i.deferUpdate();
              composition.channelId = null;
              await updateMessage();
              break;

            case "NI_send:preview":
              await i.deferUpdate();
              currentView = "preview";
              await updateMessage();
              break;

            case "NI_send:send": {
              await i.deferUpdate();

              // Validate
              if (!composition.channelId) {
                await i.followUp({
                  content: "❌ Please select a channel to send the message to.",
                  flags: MessageFlagsBitField.Flags.Ephemeral,
                });
                return;
              }

              if (!composition.content && composition.embeds.length === 0) {
                await i.followUp({
                  content: "❌ Please add content or at least one embed.",
                  flags: MessageFlagsBitField.Flags.Ephemeral,
                });
                return;
              }

              const channel = interaction.guild?.channels.cache.get(composition.channelId) as TextChannel;
              if (!channel) {
                await i.followUp({
                  content: "❌ Channel not found or inaccessible.",
                  flags: MessageFlagsBitField.Flags.Ephemeral,
                });
                return;
              }

              try {
                // Build message
                const messagePayload: any = {};

                if (composition.content) {
                  messagePayload.content = composition.content;
                }

                if (composition.embeds.length > 0) {
                  messagePayload.embeds = composition.embeds.map((e) => {
                    const customEmbed = new customUtil.CustomEmbed(e);
                    return customEmbed.getEmbed();
                  });
                }

                // Build components (max 5 rows)
                const rows: ActionRowBuilder<MessageActionRowComponentBuilder>[] = [];

                // Add buttons (up to 5 per row)
                if (composition.buttons.length > 0) {
                  const buttonChunks = chunkArray(composition.buttons, 5);
                  for (const chunk of buttonChunks.slice(0, 5 - composition.selectMenus.length)) {
                    const row = new ActionRowBuilder<MessageActionRowComponentBuilder>();
                    for (const btn of chunk) {
                      const customButton = new customUtil.CustomButton(btn);
                      row.addComponents(customButton.getButton());
                    }
                    rows.push(row);
                  }
                }

                // Add select menus (one per row)
                for (const menu of composition.selectMenus.slice(0, 5 - rows.length)) {
                  const customMenu = new customUtil.CustomSelectMenu(menu);
                  const row = new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(
                    customMenu.getSelectMenu()
                  );
                  rows.push(row);
                }

                if (rows.length > 0) {
                  messagePayload.components = rows;
                }

                await channel.send(messagePayload);

                await i.followUp({
                  content: `✅ Message sent to <#${composition.channelId}>!`,
                  flags: MessageFlagsBitField.Flags.Ephemeral,
                });

                // Reset composition
                composition = {
                  content: null,
                  embeds: [],
                  buttons: [],
                  selectMenus: [],
                  channelId: null,
                };
                currentView = "main";
                await updateMessage();
              } catch (error) {
                console.error("[Send Command] Error:", error);
                await i.followUp({
                  content: "❌ Failed to send message. Check bot permissions.",
                  flags: MessageFlagsBitField.Flags.Ephemeral,
                });
              }
              break;
            }

            case "NI_send:embed_prev":
              await i.deferUpdate();
              embedPage = Math.max(0, embedPage - 1);
              await updateMessage();
              break;

            case "NI_send:embed_next": {
              await i.deferUpdate();
              const embeds = await getEmbeds(guild);
              const maxPage = Math.ceil(embeds.length / ITEMS_PER_PAGE) - 1;
              embedPage = Math.min(maxPage, embedPage + 1);
              await updateMessage();
              break;
            }

            case "NI_send:button_prev":
              await i.deferUpdate();
              buttonPage = Math.max(0, buttonPage - 1);
              await updateMessage();
              break;

            case "NI_send:button_next": {
              await i.deferUpdate();
              const buttons = await getButtons(guild);
              const maxPage = Math.ceil(buttons.length / ITEMS_PER_PAGE) - 1;
              buttonPage = Math.min(maxPage, buttonPage + 1);
              await updateMessage();
              break;
            }

            case "NI_send:selectmenu_prev":
              await i.deferUpdate();
              selectMenuPage = Math.max(0, selectMenuPage - 1);
              await updateMessage();
              break;

            case "NI_send:selectmenu_next": {
              await i.deferUpdate();
              const selectMenus = await getSelectMenus(guild);
              const maxPage = Math.ceil(selectMenus.length / ITEMS_PER_PAGE) - 1;
              selectMenuPage = Math.min(maxPage, selectMenuPage + 1);
              await updateMessage();
              break;
            }
          }
        }
      } catch (error) {
        console.error("[Send Command] Error:", error);
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
function chunkArray<T>(arr: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
}

async function getEmbeds(guild: Guild): Promise<EmbedCustom[]> {
  return (await guild.get("utils.components.embed")) as EmbedCustom[];
}

async function getButtons(guild: Guild): Promise<ButtonCustom[]> {
  return (await guild.get("utils.components.buttons")) as ButtonCustom[];
}

async function getSelectMenus(guild: Guild): Promise<SelectMenuCustom[]> {
  return (await guild.get("utils.components.selectMenus")) as SelectMenuCustom[];
}

async function showContentModal(interaction: any): Promise<{ value: string | null; submitted: boolean }> {
  const modalId = `NI_send:modal:content:${Date.now()}`;

  const modal = new (await import("discord.js")).ModalBuilder()
    .setTitle("Edit Message Content")
    .setCustomId(modalId)
    .setComponents(
      new ActionRowBuilder<any>().setComponents(
        new (await import("discord.js")).TextInputBuilder()
          .setCustomId("NI_send:input")
          .setLabel("Message content")
          .setStyle((await import("discord.js")).TextInputStyle.Paragraph)
          .setRequired(false)
          .setMaxLength(2000)
      )
    );

  await interaction.showModal(modal);

  try {
    const submitted = await interaction.awaitModalSubmit({
      filter: (i: any) => i.customId === modalId && i.user.id === interaction.user.id,
      time: 300000,
    });

    await submitted.deferUpdate();
    const value = submitted.fields.getTextInputValue("NI_send:input") || null;
    return { value, submitted: true };
  } catch {
    return { value: null, submitted: false };
  }
}

async function buildEmbed(
  client: Client,
  lang: string,
  composition: MessageComposition,
  view: ViewType,
  guild: Guild
): Promise<EmbedBuilder> {
  const embed = new EmbedBuilder().setColor(client.holder.colors.default);

  switch (view) {
    case "main":
      embed
        .setTitle("📤 Message Composer")
        .setDescription("Create and send messages with custom embeds, buttons, and select menus.")
        .addFields(
          {
            name: "📝 Content",
            value: composition.content ? `\`${composition.content.substring(0, 50)}${composition.content.length > 50 ? "..." : ""}\`` : "Not set",
            inline: true,
          },
          {
            name: "📋 Embeds",
            value: composition.embeds.length > 0 ? `${composition.embeds.length} selected` : "None",
            inline: true,
          },
          {
            name: "🔘 Buttons",
            value: composition.buttons.length > 0 ? `${composition.buttons.length} selected` : "None",
            inline: true,
          },
          {
            name: "📋 Select Menus",
            value: composition.selectMenus.length > 0 ? `${composition.selectMenus.length} selected` : "None",
            inline: true,
          },
          {
            name: "📢 Channel",
            value: composition.channelId ? `<#${composition.channelId}>` : "Not set",
            inline: true,
          }
        );
      break;

    case "select_embeds":
      embed
        .setTitle("📋 Select Embeds")
        .setDescription("Choose embeds to include in your message (max 10).");
      break;

    case "select_buttons":
      embed
        .setTitle("🔘 Select Buttons")
        .setDescription("Choose buttons to include in your message (max 25, 5 per row).");
      break;

    case "select_selectmenus":
      embed
        .setTitle("📋 Select Menus")
        .setDescription("Choose select menus to include in your message (max 5, one per row).");
      break;

    case "select_channel":
      embed
        .setTitle("📢 Select Channel")
        .setDescription("Choose the channel to send the message to.");
      break;

    case "preview":
      embed
        .setTitle("👁️ Preview")
        .setDescription("This is a preview of your message composition.\n\n**Note:** The actual message will be sent to the selected channel.");

      if (composition.content) {
        embed.addFields({
          name: "Content",
          value: composition.content.substring(0, 1024),
        });
      }

      if (composition.embeds.length > 0) {
        embed.addFields({
          name: "Embeds",
          value: composition.embeds.map((e) => `• ${e.name || e.title || "Unnamed"}`).join("\n").substring(0, 1024),
        });
      }

      if (composition.buttons.length > 0) {
        embed.addFields({
          name: "Buttons",
          value: composition.buttons.map((b) => `• ${b.label || b.name || "Unnamed"}`).join("\n").substring(0, 1024),
        });
      }

      if (composition.selectMenus.length > 0) {
        embed.addFields({
          name: "Select Menus",
          value: composition.selectMenus.map((s) => `• ${s.name || "Unnamed"}`).join("\n").substring(0, 1024),
        });
      }
      break;
  }

  return embed;
}

async function buildComponents(
  client: Client,
  lang: string,
  composition: MessageComposition,
  view: ViewType,
  guild: Guild,
  embedPage: number,
  buttonPage: number,
  selectMenuPage: number,
  itemsPerPage: number
): Promise<ActionRowBuilder<MessageActionRowComponentBuilder>[]> {
  const rows: ActionRowBuilder<MessageActionRowComponentBuilder>[] = [];

  switch (view) {
    case "main": {
      // Main menu select
      const mainSelect = new StringSelectMenuBuilder()
        .setCustomId("NI_send:main_menu")
        .setPlaceholder("What would you like to do?")
        .addOptions(
          new StringSelectMenuOptionBuilder().setLabel("Edit Content").setValue("content").setEmoji("📝"),
          new StringSelectMenuOptionBuilder().setLabel("Select Embeds").setValue("embeds").setEmoji("📋"),
          new StringSelectMenuOptionBuilder().setLabel("Select Buttons").setValue("buttons").setEmoji("🔘"),
          new StringSelectMenuOptionBuilder().setLabel("Select Menus").setValue("selectmenus").setEmoji("📋"),
          new StringSelectMenuOptionBuilder().setLabel("Select Channel").setValue("channel").setEmoji("📢")
        );
      rows.push(new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(mainSelect));

      // Clear buttons
      const clearRow = new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(
        new ButtonBuilder()
          .setCustomId("NI_send:clear_content")
          .setLabel("Clear Content")
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(!composition.content),
        new ButtonBuilder()
          .setCustomId("NI_send:clear_embeds")
          .setLabel("Clear Embeds")
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(composition.embeds.length === 0),
        new ButtonBuilder()
          .setCustomId("NI_send:clear_buttons")
          .setLabel("Clear Buttons")
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(composition.buttons.length === 0),
        new ButtonBuilder()
          .setCustomId("NI_send:clear_selectmenus")
          .setLabel("Clear Menus")
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(composition.selectMenus.length === 0)
      );
      rows.push(clearRow);

      // Preview and send buttons
      const actionRow = new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(
        new ButtonBuilder()
          .setCustomId("NI_send:preview")
          .setLabel("Preview")
          .setStyle(ButtonStyle.Primary)
          .setEmoji("👁️"),
        new ButtonBuilder()
          .setCustomId("NI_send:send")
          .setLabel("Send Message")
          .setStyle(ButtonStyle.Success)
          .setEmoji("📤")
          .setDisabled(!composition.channelId || (!composition.content && composition.embeds.length === 0))
      );
      rows.push(actionRow);
      break;
    }

    case "select_embeds": {
      const embeds = await getEmbeds(guild);
      const start = embedPage * itemsPerPage;
      const pageEmbeds = embeds.slice(start, start + itemsPerPage);

      if (pageEmbeds.length > 0) {
        const select = new StringSelectMenuBuilder()
          .setCustomId("NI_send:select_embeds")
          .setPlaceholder("Select embeds (max 10)")
          .setMinValues(0)
          .setMaxValues(Math.min(10, pageEmbeds.length));

        for (const emb of pageEmbeds) {
          const isSelected = composition.embeds.some((e) => e.id === emb.id);
          select.addOptions(
            new StringSelectMenuOptionBuilder()
              .setLabel(emb.name || emb.title || "Unnamed")
              .setValue(emb.id)
              .setDefault(isSelected)
          );
        }

        rows.push(new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(select));
      }

      // Pagination and back
      const navRow = new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(
        new ButtonBuilder()
          .setCustomId("NI_send:embed_prev")
          .setLabel("◀")
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(embedPage === 0),
        new ButtonBuilder()
          .setCustomId("NI_send:embed_next")
          .setLabel("▶")
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(start + itemsPerPage >= embeds.length),
        new ButtonBuilder()
          .setCustomId("NI_send:back")
          .setLabel("Back")
          .setStyle(ButtonStyle.Danger)
      );
      rows.push(navRow);
      break;
    }

    case "select_buttons": {
      const buttons = await getButtons(guild);
      const start = buttonPage * itemsPerPage;
      const pageButtons = buttons.slice(start, start + itemsPerPage);

      if (pageButtons.length > 0) {
        const select = new StringSelectMenuBuilder()
          .setCustomId("NI_send:select_buttons")
          .setPlaceholder("Select buttons (max 25)")
          .setMinValues(0)
          .setMaxValues(Math.min(25, pageButtons.length));

        for (const btn of pageButtons) {
          const isSelected = composition.buttons.some((b) => b.id === btn.id);
          select.addOptions(
            new StringSelectMenuOptionBuilder()
              .setLabel(btn.label || btn.name || "Unnamed")
              .setValue(btn.id)
              .setDefault(isSelected)
          );
        }

        rows.push(new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(select));
      }

      // Pagination and back
      const navRow = new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(
        new ButtonBuilder()
          .setCustomId("NI_send:button_prev")
          .setLabel("◀")
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(buttonPage === 0),
        new ButtonBuilder()
          .setCustomId("NI_send:button_next")
          .setLabel("▶")
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(start + itemsPerPage >= buttons.length),
        new ButtonBuilder()
          .setCustomId("NI_send:back")
          .setLabel("Back")
          .setStyle(ButtonStyle.Danger)
      );
      rows.push(navRow);
      break;
    }

    case "select_selectmenus": {
      const selectMenus = await getSelectMenus(guild);
      const start = selectMenuPage * itemsPerPage;
      const pageMenus = selectMenus.slice(start, start + itemsPerPage);

      if (pageMenus.length > 0) {
        const select = new StringSelectMenuBuilder()
          .setCustomId("NI_send:select_selectmenus")
          .setPlaceholder("Select menus (max 5)")
          .setMinValues(0)
          .setMaxValues(Math.min(5, pageMenus.length));

        for (const menu of pageMenus) {
          const isSelected = composition.selectMenus.some((s) => s.id === menu.id);
          select.addOptions(
            new StringSelectMenuOptionBuilder()
              .setLabel(menu.name || "Unnamed")
              .setValue(menu.id)
              .setDefault(isSelected)
          );
        }

        rows.push(new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(select));
      }

      // Pagination and back
      const navRow = new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(
        new ButtonBuilder()
          .setCustomId("NI_send:selectmenu_prev")
          .setLabel("◀")
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(selectMenuPage === 0),
        new ButtonBuilder()
          .setCustomId("NI_send:selectmenu_next")
          .setLabel("▶")
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(start + itemsPerPage >= selectMenus.length),
        new ButtonBuilder()
          .setCustomId("NI_send:back")
          .setLabel("Back")
          .setStyle(ButtonStyle.Danger)
      );
      rows.push(navRow);
      break;
    }

    case "select_channel": {
      const channelSelect = new ChannelSelectMenuBuilder()
        .setCustomId("NI_send:select_channel")
        .setPlaceholder("Select a channel")
        .setChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement);
      rows.push(new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(channelSelect));

      const backRow = new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(
        new ButtonBuilder()
          .setCustomId("NI_send:back")
          .setLabel("Back")
          .setStyle(ButtonStyle.Danger)
      );
      rows.push(backRow);
      break;
    }

    case "preview": {
      const backRow = new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(
        new ButtonBuilder()
          .setCustomId("NI_send:back")
          .setLabel("Back")
          .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
          .setCustomId("NI_send:send")
          .setLabel("Send Message")
          .setStyle(ButtonStyle.Success)
          .setEmoji("📤")
          .setDisabled(!composition.channelId || (!composition.content && composition.embeds.length === 0))
      );
      rows.push(backRow);
      break;
    }
  }

  return rows;
}

