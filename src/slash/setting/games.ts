import { FindTeamGame, IModalField, SlashCommand } from "../../types/helpers";
import {
  Client,
  CommandInteraction,
  PermissionsBitField,
  EmbedBuilder,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder,
  MessageActionRowComponentBuilder,
  MessageFlagsBitField,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  LabelBuilder,
  ChannelSelectMenuBuilder,
  ChannelType,
  RoleSelectMenuBuilder,
  TextChannel,
  AttachmentBuilder,
} from "discord.js";
import { defaultPermissions, Guild, canvasUtil } from "../../helpers";
import { t } from "../../i18n/helpers";
import { generateID } from "../../handlers/functions";

interface FindTeamSettings {
  enabled: boolean;
  channel: string | null;
  send_channel: string | null;
  select_placeholder: string | null;
  embed: {
    title: string | null;
    description: string | null;
    color: string | null;
    thumbnail: string | null;
    image: string | null;
    footer: string | null;
  };
  games: FindTeamGame[];
}

type ViewType = "main" | "channels" | "embed" | "games" | "game_edit" | "field_edit" | "game_emoji";

module.exports = {
  name: "games",
  description: "Setting up the search for teammates.",
  cooldown: 5,
  locale: {
    ru: "Настройка системы поиска напарников.",
    uk: "Налаштування системи пошуку напарників.",
  },
  options: [],
  permissions: {
    bot: [...defaultPermissions, PermissionsBitField.Flags.ManageChannels],
  },
  key: null,
  run: async (client: Client, interaction: CommandInteraction) => {
    if (!interaction.guild) return;

    await interaction.deferReply({ flags: MessageFlagsBitField.Flags.Ephemeral });

    const guild = new Guild(client, interaction.guild);
    const lang = await guild.get("settings.language");

    let settings = await mostUsedQueries.getSettings(guild);
    let currentView: ViewType = "main";
    let currentGameIndex = 0;
    let currentFieldIndex = 0;
    let emojiPage = 0;
    const EMOJIS_PER_PAGE = 25;

    const components = buildComponents(
      client,
      lang,
      settings,
      currentView,
      currentGameIndex,
      currentFieldIndex,
      interaction.guild,
      emojiPage,
      EMOJIS_PER_PAGE,
    );
    let embed = buildEmbed(client, lang, settings, currentView);
    let attachment: AttachmentBuilder | null = null;

    const msg = await interaction.editReply({ embeds: [embed], components });

    const filter = (i: any) => i.user.id === interaction.user.id;
    const collector = msg.createMessageComponentCollector({ filter, time: 600000 });

    collector.on("collect", async (i) => {
      // Button handlers
      if (i.isButton()) {
        switch (i.customId) {
          case "NI_games:toggle":
            settings.enabled = !settings.enabled;
            await mostUsedQueries.setEnabled(guild, settings.enabled);
            embed = buildEmbed(client, lang, settings, currentView);
            await i.update({
              embeds: [embed],
              components: buildComponents(
                client,
                lang,
                settings,
                currentView,
                currentGameIndex,
                currentFieldIndex,
                interaction.guild,
                emojiPage,
                EMOJIS_PER_PAGE,
              ),
            });
            break;

          case "NI_games:back":
            if (currentView === "field_edit") {
              currentView = "game_edit";
            } else if (currentView === "game_edit") {
              currentView = "games";
            } else if (currentView === "game_emoji") {
              currentView = "game_edit";
              emojiPage = 0;
            } else {
              currentView = "main";
            }
            embed = buildEmbed(
              client,
              lang,
              settings,
              currentView,
              currentGameIndex,
              currentFieldIndex,
            );
            await i.update({
              embeds: [embed],
              components: buildComponents(
                client,
                lang,
                settings,
                currentView,
                currentGameIndex,
                currentFieldIndex,
                interaction.guild,
                emojiPage,
                EMOJIS_PER_PAGE,
              ),
              files: [],
            });
            break;

          case "NI_games:setup":
            await i.deferUpdate();
            try {
              // Create category
              const category = await interaction.guild!.channels.create({
                name: "Find Team",
                type: ChannelType.GuildCategory,
              });

              // Create select menu channel
              const selectChannel = await interaction.guild!.channels.create({
                name: "find-teammates",
                type: ChannelType.GuildText,
                parent: category.id,
              });

              // Create results channel
              const resultsChannel = await interaction.guild!.channels.create({
                name: "team-requests",
                type: ChannelType.GuildText,
                parent: category.id,
              });

              settings.channel = selectChannel.id;
              settings.send_channel = resultsChannel.id;
              await mostUsedQueries.setChannel(guild, selectChannel.id);
              await mostUsedQueries.setSendChannel(guild, resultsChannel.id);

              await i.followUp({
                content: t(client, lang, "commands.games.messages.setup_success"),
                flags: MessageFlagsBitField.Flags.Ephemeral,
              });

              embed = buildEmbed(client, lang, settings, currentView);
              await interaction.editReply({
                embeds: [embed],
                components: buildComponents(
                  client,
                  lang,
                  settings,
                  currentView,
                  currentGameIndex,
                  currentFieldIndex,
                  interaction.guild,
                  emojiPage,
                  EMOJIS_PER_PAGE,
                ),
              });
            } catch (error) {
              await i.followUp({
                content: t(client, lang, "commands.games.messages.setup_error"),
                flags: MessageFlagsBitField.Flags.Ephemeral,
              });
            }
            break;

          case "NI_games:send_embed":
            await i.deferUpdate();
            if (settings.channel) {
              try {
                const channel = interaction.guild!.channels.cache.get(
                  settings.channel,
                ) as TextChannel;
                if (channel) {
                  const sendEmbed = new EmbedBuilder();
                  if (settings.embed.title) sendEmbed.setTitle(settings.embed.title);
                  if (settings.embed.description)
                    sendEmbed.setDescription(settings.embed.description);
                  if (settings.embed.color) sendEmbed.setColor(settings.embed.color as any);
                  if (settings.embed.thumbnail) sendEmbed.setThumbnail(settings.embed.thumbnail);
                  if (settings.embed.image) sendEmbed.setImage(settings.embed.image);
                  if (settings.embed.footer) sendEmbed.setFooter({ text: settings.embed.footer });

                  const selectMenu = new StringSelectMenuBuilder()
                    .setCustomId("I_find_team:select")
                    .setPlaceholder(
                      settings.select_placeholder ||
                        t(
                          client,
                          lang,
                          "commands.games.select_menus.find_team.default_placeholder",
                        ),
                    )
                    .setMinValues(1)
                    .setMaxValues(1);

                  if (settings.games.length > 0) {
                    settings.games.forEach((game) => {
                      const option = new StringSelectMenuOptionBuilder()
                        .setValue(game.id)
                        .setLabel(game.name);
                      if (game.emoji) option.setEmoji(game.emoji as any);
                      selectMenu.addOptions(option);
                    });
                  } else {
                    selectMenu.addOptions(
                      new StringSelectMenuOptionBuilder()
                        .setValue("none")
                        .setLabel("No games configured"),
                    );
                    selectMenu.setDisabled(true);
                  }

                  const row =
                    new ActionRowBuilder<MessageActionRowComponentBuilder>().setComponents(
                      selectMenu,
                    );

                  await channel.send({ embeds: [sendEmbed], components: [row] });
                  await i.followUp({
                    content: t(
                      client,
                      lang,
                      "commands.games.messages.embed_sent",
                      `<#${channel.id}>`,
                    ),
                    flags: MessageFlagsBitField.Flags.Ephemeral,
                  });
                }
              } catch (error) {
                console.error(error);
              }
            }
            break;

          case "NI_games:delete_game":
            settings.games.splice(currentGameIndex, 1);
            await mostUsedQueries.setGames(guild, settings.games);
            currentView = "games";
            currentGameIndex = 0;
            embed = buildEmbed(client, lang, settings, currentView);
            await i.update({
              embeds: [embed],
              components: buildComponents(
                client,
                lang,
                settings,
                currentView,
                currentGameIndex,
                currentFieldIndex,
                interaction.guild,
                emojiPage,
                EMOJIS_PER_PAGE,
              ),
              files: [],
            });
            break;

          case "NI_games:edit_name":
            await showModal(i, "game_name", client, lang, settings.games[currentGameIndex]?.name);
            break;

          case "NI_games:edit_emoji":
            currentView = "game_emoji";
            emojiPage = 0;
            embed = buildEmbed(client, lang, settings, currentView, currentGameIndex);
            await i.update({
              embeds: [embed],
              components: buildComponents(
                client,
                lang,
                settings,
                currentView,
                currentGameIndex,
                currentFieldIndex,
                interaction.guild,
                emojiPage,
                EMOJIS_PER_PAGE,
              ),
              files: [],
            });
            break;

          case "NI_games:reset_emoji":
            settings.games[currentGameIndex].emoji = "🎮";
            await mostUsedQueries.setGames(guild, settings.games);
            embed = buildEmbed(client, lang, settings, currentView, currentGameIndex);
            await i.update({
              embeds: [embed],
              components: buildComponents(
                client,
                lang,
                settings,
                currentView,
                currentGameIndex,
                currentFieldIndex,
                interaction.guild,
                emojiPage,
                EMOJIS_PER_PAGE,
              ),
              files: [],
            });
            break;

          case "NI_games:emoji_prev":
            emojiPage = Math.max(0, emojiPage - 1);
            embed = buildEmbed(client, lang, settings, currentView, currentGameIndex);
            await i.update({
              embeds: [embed],
              components: buildComponents(
                client,
                lang,
                settings,
                currentView,
                currentGameIndex,
                currentFieldIndex,
                interaction.guild,
                emojiPage,
                EMOJIS_PER_PAGE,
              ),
            });
            break;

          case "NI_games:emoji_next":
            const totalEmojis = interaction.guild?.emojis.cache.size || 0;
            const maxPage = Math.ceil(totalEmojis / EMOJIS_PER_PAGE) - 1;
            emojiPage = Math.min(maxPage, emojiPage + 1);
            embed = buildEmbed(client, lang, settings, currentView, currentGameIndex);
            await i.update({
              embeds: [embed],
              components: buildComponents(
                client,
                lang,
                settings,
                currentView,
                currentGameIndex,
                currentFieldIndex,
                interaction.guild,
                emojiPage,
                EMOJIS_PER_PAGE,
              ),
            });
            break;

          case "NI_games:edit_modal_title":
            await showModal(
              i,
              "game_modal_title",
              client,
              lang,
              settings.games[currentGameIndex]?.modal?.title,
            );
            break;

          case "NI_games:delete_field":
            settings.games[currentGameIndex].modal.fields.splice(currentFieldIndex, 1);
            await mostUsedQueries.setGames(guild, settings.games);
            currentView = "game_edit";
            currentFieldIndex = 0;
            embed = buildEmbed(client, lang, settings, currentView, currentGameIndex);
            await i.update({
              embeds: [embed],
              components: buildComponents(
                client,
                lang,
                settings,
                currentView,
                currentGameIndex,
                currentFieldIndex,
                interaction.guild,
                emojiPage,
                EMOJIS_PER_PAGE,
              ),
              files: [],
            });
            break;

          case "NI_games:edit_label":
            await showModal(
              i,
              "field_label",
              client,
              lang,
              settings.games[currentGameIndex]?.modal?.fields[currentFieldIndex]?.name,
            );
            break;

          case "NI_games:edit_placeholder":
            await showModal(
              i,
              "field_placeholder",
              client,
              lang,
              settings.games[currentGameIndex]?.modal?.fields[currentFieldIndex]?.placeholder,
            );
            break;

          case "NI_games:toggle_style": {
            const fieldData = settings.games[currentGameIndex].modal.fields[currentFieldIndex];
            fieldData.type = fieldData.type === "short" ? "long" : "short";
            await mostUsedQueries.setGames(guild, settings.games);
            const fieldEmbedResult = await buildFieldEmbed(
              embed,
              client,
              lang,
              settings,
              currentGameIndex,
              currentFieldIndex,
            );
            embed = fieldEmbedResult.embed;
            attachment = fieldEmbedResult.attachment;
            await i.update({
              embeds: [embed],
              components: buildComponents(
                client,
                lang,
                settings,
                currentView,
                currentGameIndex,
                currentFieldIndex,
                interaction.guild,
                emojiPage,
                EMOJIS_PER_PAGE,
              ),
              files: [attachment],
            });
            break;
          }

          case "NI_games:edit_sizes":
            await showSizesModal(
              i,
              client,
              lang,
              settings.games[currentGameIndex]?.modal?.fields[currentFieldIndex],
            );
            break;

          case "NI_games:toggle_required": {
            settings.games[currentGameIndex].modal.fields[currentFieldIndex].required =
              !settings.games[currentGameIndex].modal.fields[currentFieldIndex].required;
            await mostUsedQueries.setGames(guild, settings.games);
            const fieldEmbedResult2 = await buildFieldEmbed(
              embed,
              client,
              lang,
              settings,
              currentGameIndex,
              currentFieldIndex,
            );
            embed = fieldEmbedResult2.embed;
            attachment = fieldEmbedResult2.attachment;
            await i.update({
              embeds: [embed],
              components: buildComponents(
                client,
                lang,
                settings,
                currentView,
                currentGameIndex,
                currentFieldIndex,
                interaction.guild,
                emojiPage,
                EMOJIS_PER_PAGE,
              ),
              files: [attachment],
            });
            break;
          }

          case "NI_games:preview":
            await i.deferUpdate();
            const previewEmbed = new EmbedBuilder()
              .setTitle(
                settings.embed.title || t(client, lang, "commands.games.embeds.preview.title"),
              )
              .setDescription(
                settings.embed.description ||
                  t(client, lang, "commands.games.embeds.preview.description"),
              )
              .setFooter({ text: t(client, lang, "commands.games.embeds.preview.footer") });
            if (settings.embed.color) previewEmbed.setColor(settings.embed.color as any);
            if (settings.embed.thumbnail) previewEmbed.setThumbnail(settings.embed.thumbnail);
            if (settings.embed.image) previewEmbed.setImage(settings.embed.image);

            await i.followUp({
              embeds: [previewEmbed],
              flags: MessageFlagsBitField.Flags.Ephemeral,
            });
            break;

          case "NI_games:field_preview": {
            const modalData = settings.games[currentGameIndex].modal;
            if (modalData.fields.length > 0) {
              const { customUtil: customUtilModule } = await import("../../helpers");
              const customModal = new customUtilModule.CustomModal({
                id: "preview",
                title: modalData.title,
                fields: modalData.fields,
              });
              await i.showModal(customModal.getModal());
            } else {
              await i.reply({
                content: t(client, lang, "commands.games.messages.max_fields") as string,
                flags: MessageFlagsBitField.Flags.Ephemeral,
              });
            }
            break;
          }
        }

        // Handle modal submissions for buttons
        if (
          [
            "NI_games:edit_name",
            "NI_games:edit_modal_title",
            "NI_games:edit_label",
            "NI_games:edit_placeholder",
          ].includes(i.customId)
        ) {
          try {
            const modalSubmit = await i.awaitModalSubmit({
              time: 5 * 60 * 1000,
              filter: (si: any) => si.user.id === interaction.user.id,
            });

            await modalSubmit.deferUpdate();
            const value = modalSubmit.fields.getTextInputValue("NI_games:input");

            switch (i.customId) {
              case "NI_games:edit_name":
                settings.games[currentGameIndex].name = value;
                break;
              case "NI_games:edit_modal_title":
                settings.games[currentGameIndex].modal.title = value;
                break;
              case "NI_games:edit_label":
                settings.games[currentGameIndex].modal.fields[currentFieldIndex].name = value;
                break;
              case "NI_games:edit_placeholder":
                settings.games[currentGameIndex].modal.fields[currentFieldIndex].placeholder =
                  value;
                break;
            }

            await mostUsedQueries.setGames(guild, settings.games);

            // Show field preview image for field edits
            if (["NI_games:edit_label", "NI_games:edit_placeholder"].includes(i.customId)) {
              const fieldEmbedResult = await buildFieldEmbed(
                embed,
                client,
                lang,
                settings,
                currentGameIndex,
                currentFieldIndex,
              );
              embed = fieldEmbedResult.embed;
              attachment = fieldEmbedResult.attachment;
              await interaction.editReply({
                embeds: [embed],
                components: buildComponents(
                  client,
                  lang,
                  settings,
                  currentView,
                  currentGameIndex,
                  currentFieldIndex,
                  interaction.guild,
                  emojiPage,
                  EMOJIS_PER_PAGE,
                ),
                files: [attachment],
              });
            } else {
              embed = buildEmbed(
                client,
                lang,
                settings,
                currentView,
                currentGameIndex,
                currentFieldIndex,
              );
              await interaction.editReply({
                embeds: [embed],
                components: buildComponents(
                  client,
                  lang,
                  settings,
                  currentView,
                  currentGameIndex,
                  currentFieldIndex,
                  interaction.guild,
                  emojiPage,
                  EMOJIS_PER_PAGE,
                ),
                files: [],
              });
            }
          } catch (error) {
            // Modal timed out or was dismissed
          }
        }

        if (i.customId === "NI_games:edit_sizes") {
          try {
            const modalSubmit = await i.awaitModalSubmit({
              time: 5 * 60 * 1000,
              filter: (si: any) => si.user.id === interaction.user.id,
            });

            await modalSubmit.deferUpdate();
            const min = parseInt(modalSubmit.fields.getTextInputValue("NI_games:min")) || 0;
            const max = parseInt(modalSubmit.fields.getTextInputValue("NI_games:max")) || 0;

            settings.games[currentGameIndex].modal.fields[currentFieldIndex].min = Math.max(
              0,
              Math.min(min, 4000),
            );
            settings.games[currentGameIndex].modal.fields[currentFieldIndex].max = Math.max(
              0,
              Math.min(max, 4000),
            );

            await mostUsedQueries.setGames(guild, settings.games);
            const fieldEmbedResult = await buildFieldEmbed(
              embed,
              client,
              lang,
              settings,
              currentGameIndex,
              currentFieldIndex,
            );
            embed = fieldEmbedResult.embed;
            attachment = fieldEmbedResult.attachment;
            await interaction.editReply({
              embeds: [embed],
              components: buildComponents(
                client,
                lang,
                settings,
                currentView,
                currentGameIndex,
                currentFieldIndex,
                interaction.guild,
                emojiPage,
                EMOJIS_PER_PAGE,
              ),
              files: [attachment],
            });
          } catch (error) {
            // Modal timed out or was dismissed
          }
        }
      }

      // String Select Menu handlers
      if (i.isStringSelectMenu()) {
        switch (i.customId) {
          case "NI_games:main_menu":
            currentView = i.values[0] as ViewType;
            embed = buildEmbed(client, lang, settings, currentView);
            await i.update({
              embeds: [embed],
              components: buildComponents(
                client,
                lang,
                settings,
                currentView,
                currentGameIndex,
                currentFieldIndex,
                interaction.guild,
                emojiPage,
                EMOJIS_PER_PAGE,
              ),
              files: [],
            });
            break;

          case "NI_games:emoji_select": {
            const selectedEmojiId = i.values[0];
            const selectedEmoji = interaction.guild?.emojis.cache.get(selectedEmojiId);
            if (selectedEmoji) {
              settings.games[currentGameIndex].emoji = selectedEmoji.animated
                ? `<a:${selectedEmoji.name}:${selectedEmoji.id}>`
                : `<:${selectedEmoji.name}:${selectedEmoji.id}>`;
              await mostUsedQueries.setGames(guild, settings.games);

              await i.reply({
                content: (t(client, lang, "commands.games.messages.emoji_set") as string).replace(
                  "{0}",
                  String(settings.games[currentGameIndex].emoji),
                ),
                flags: MessageFlagsBitField.Flags.Ephemeral,
              });

              embed = buildEmbed(client, lang, settings, currentView, currentGameIndex);
              await interaction.editReply({
                embeds: [embed],
                components: buildComponents(
                  client,
                  lang,
                  settings,
                  currentView,
                  currentGameIndex,
                  currentFieldIndex,
                  interaction.guild,
                  emojiPage,
                  EMOJIS_PER_PAGE,
                ),
                files: [],
              });
            }
            break;
          }

          case "NI_games:embed_menu":
            const embedField = i.values[0];
            if (embedField === "placeholder") {
              await showModal(
                i,
                "select_placeholder",
                client,
                lang,
                settings.select_placeholder || undefined,
              );
            } else {
              await showEmbedModal(i, embedField, client, lang, settings.embed);
            }

            try {
              const modalSubmit = await i.awaitModalSubmit({
                time: 5 * 60 * 1000,
                filter: (si: any) => si.user.id === interaction.user.id,
              });

              await modalSubmit.deferUpdate();
              const value = modalSubmit.fields.getTextInputValue("NI_games:input") || null;

              if (embedField === "placeholder") {
                settings.select_placeholder = value;
                await mostUsedQueries.setSelectPlaceholder(guild, value);
              } else if (embedField === "color") {
                if (value && !/^#[0-9A-Fa-f]{6}$/.test(value)) {
                  await modalSubmit.followUp({
                    content: t(client, lang, "commands.games.messages.invalid_color"),
                    flags: MessageFlagsBitField.Flags.Ephemeral,
                  });
                  return;
                }
                settings.embed.color = value;
                await mostUsedQueries.setEmbed(guild, settings.embed);
              } else if (embedField === "thumbnail" || embedField === "image") {
                if (value && !isValidUrl(value)) {
                  await modalSubmit.followUp({
                    content: t(client, lang, "commands.games.messages.invalid_url"),
                    flags: MessageFlagsBitField.Flags.Ephemeral,
                  });
                  return;
                }
                (settings.embed as any)[embedField] = value;
                await mostUsedQueries.setEmbed(guild, settings.embed);
              } else {
                (settings.embed as any)[embedField] = value;
                await mostUsedQueries.setEmbed(guild, settings.embed);
              }

              embed = buildEmbed(client, lang, settings, currentView);
              await interaction.editReply({
                embeds: [embed],
                components: buildComponents(
                  client,
                  lang,
                  settings,
                  currentView,
                  currentGameIndex,
                  currentFieldIndex,
                  interaction.guild,
                  emojiPage,
                  EMOJIS_PER_PAGE,
                ),
                files: [],
              });
            } catch (error) {
              // Modal timed out
            }
            break;

          case "NI_games:games_menu":
            if (i.values[0] === "add") {
              if (settings.games.length >= 25) {
                await i.reply({
                  content: t(client, lang, "commands.games.messages.max_games"),
                  flags: MessageFlagsBitField.Flags.Ephemeral,
                });
                return;
              }

              await showModal(i, "game_name", client, lang);

              try {
                const modalSubmit = await i.awaitModalSubmit({
                  time: 5 * 60 * 1000,
                  filter: (si: any) => si.user.id === interaction.user.id,
                });

                await modalSubmit.deferUpdate();
                const name = modalSubmit.fields.getTextInputValue("NI_games:input");

                const newGame: FindTeamGame = {
                  id: generateID(interaction.guild!.id, "game"),
                  name,
                  emoji: "🎮",
                  role: null,
                  modal: {
                    title: name,
                    fields: [],
                  },
                };

                settings.games.push(newGame);
                await mostUsedQueries.setGames(guild, settings.games);

                currentGameIndex = settings.games.length - 1;
                currentView = "game_edit";

                embed = buildEmbed(client, lang, settings, currentView, currentGameIndex);
                await interaction.editReply({
                  embeds: [embed],
                  components: buildComponents(
                    client,
                    lang,
                    settings,
                    currentView,
                    currentGameIndex,
                    currentFieldIndex,
                    interaction.guild,
                    emojiPage,
                    EMOJIS_PER_PAGE,
                  ),
                  files: [],
                });
              } catch (error) {
                // Modal timed out
              }
            } else {
              currentGameIndex = settings.games.findIndex((g) => g.id === i.values[0]);
              currentView = "game_edit";
              embed = buildEmbed(client, lang, settings, currentView, currentGameIndex);
              await i.update({
                embeds: [embed],
                components: buildComponents(
                  client,
                  lang,
                  settings,
                  currentView,
                  currentGameIndex,
                  currentFieldIndex,
                  interaction.guild,
                  emojiPage,
                  EMOJIS_PER_PAGE,
                ),
                files: [],
              });
            }
            break;

          case "NI_games:fields_menu":
            if (i.values[0] === "main") {
              currentView = "game_edit";
              embed = buildEmbed(client, lang, settings, currentView, currentGameIndex);
              await i.update({
                embeds: [embed],
                components: buildComponents(
                  client,
                  lang,
                  settings,
                  currentView,
                  currentGameIndex,
                  currentFieldIndex,
                  interaction.guild,
                  emojiPage,
                  EMOJIS_PER_PAGE,
                ),
                files: [],
              });
            } else if (i.values[0] === "add") {
              if (settings.games[currentGameIndex].modal.fields.length >= 5) {
                await i.reply({
                  content: t(client, lang, "commands.games.messages.max_fields"),
                  flags: MessageFlagsBitField.Flags.Ephemeral,
                });
                return;
              }

              await showModal(i, "field_label", client, lang);

              try {
                const modalSubmit = await i.awaitModalSubmit({
                  time: 5 * 60 * 1000,
                  filter: (si: any) => si.user.id === interaction.user.id,
                });

                await modalSubmit.deferUpdate();
                const label = modalSubmit.fields.getTextInputValue("NI_games:input");

                const newField: IModalField = {
                  id: generateID(interaction.guild!.id, "field"),
                  name: label,
                  type: "short",
                  placeholder: "",
                  min: 0,
                  max: 100,
                  required: false,
                };

                settings.games[currentGameIndex].modal.fields.push(newField);
                await mostUsedQueries.setGames(guild, settings.games);

                currentFieldIndex = settings.games[currentGameIndex].modal.fields.length - 1;
                currentView = "field_edit";

                const fieldEmbedResult = await buildFieldEmbed(
                  embed,
                  client,
                  lang,
                  settings,
                  currentGameIndex,
                  currentFieldIndex,
                );
                embed = fieldEmbedResult.embed;
                attachment = fieldEmbedResult.attachment;
                await interaction.editReply({
                  embeds: [embed],
                  components: buildComponents(
                    client,
                    lang,
                    settings,
                    currentView,
                    currentGameIndex,
                    currentFieldIndex,
                    interaction.guild,
                    emojiPage,
                    EMOJIS_PER_PAGE,
                  ),
                  files: [attachment],
                });
              } catch (error) {
                // Modal timed out
              }
            } else {
              currentFieldIndex = settings.games[currentGameIndex].modal.fields.findIndex(
                (f) => f.id === i.values[0],
              );
              currentView = "field_edit";
              const fieldEmbedResult = await buildFieldEmbed(
                embed,
                client,
                lang,
                settings,
                currentGameIndex,
                currentFieldIndex,
              );
              embed = fieldEmbedResult.embed;
              attachment = fieldEmbedResult.attachment;
              await i.update({
                embeds: [embed],
                components: buildComponents(
                  client,
                  lang,
                  settings,
                  currentView,
                  currentGameIndex,
                  currentFieldIndex,
                  interaction.guild,
                  emojiPage,
                  EMOJIS_PER_PAGE,
                ),
                files: [attachment],
              });
            }
            break;
        }
      }

      // Channel Select Menu handlers
      if (i.isChannelSelectMenu()) {
        if (i.customId === "NI_games:select_channel") {
          settings.channel = i.values[0];
          await mostUsedQueries.setChannel(guild, i.values[0]);
          await i.reply({
            content: t(client, lang, "commands.games.messages.channel_set", `<#${i.values[0]}>`),
            flags: MessageFlagsBitField.Flags.Ephemeral,
          });
          embed = buildEmbed(client, lang, settings, currentView);
          await interaction.editReply({
            embeds: [embed],
            components: buildComponents(
              client,
              lang,
              settings,
              currentView,
              currentGameIndex,
              currentFieldIndex,
              interaction.guild,
              emojiPage,
              EMOJIS_PER_PAGE,
            ),
            files: [],
          });
        } else if (i.customId === "NI_games:send_channel") {
          settings.send_channel = i.values[0];
          await mostUsedQueries.setSendChannel(guild, i.values[0]);
          await i.reply({
            content: t(
              client,
              lang,
              "commands.games.messages.send_channel_set",
              `<#${i.values[0]}>`,
            ),
            flags: MessageFlagsBitField.Flags.Ephemeral,
          });
          embed = buildEmbed(client, lang, settings, currentView);
          await interaction.editReply({
            embeds: [embed],
            components: buildComponents(
              client,
              lang,
              settings,
              currentView,
              currentGameIndex,
              currentFieldIndex,
              interaction.guild,
              emojiPage,
              EMOJIS_PER_PAGE,
            ),
            files: [],
          });
        }
      }

      // Role Select Menu handlers
      if (i.isRoleSelectMenu()) {
        if (i.customId === "NI_games:edit_role") {
          settings.games[currentGameIndex].role = i.values[0] || null;
          await mostUsedQueries.setGames(guild, settings.games);
          embed = buildEmbed(client, lang, settings, currentView, currentGameIndex);
          await i.update({
            embeds: [embed],
            components: buildComponents(
              client,
              lang,
              settings,
              currentView,
              currentGameIndex,
              currentFieldIndex,
              interaction.guild,
              emojiPage,
              EMOJIS_PER_PAGE,
            ),
            files: [],
          });
        }
      }
    });

    collector.on("end", async () => {
      try {
        await interaction.editReply({ components: [] });
      } catch (error) {
        // Message might be deleted
      }
    });
  },
} as SlashCommand;

function buildEmbed(
  client: Client,
  lang: string,
  settings: FindTeamSettings,
  view: ViewType,
  gameIndex?: number,
  fieldIndex?: number,
): EmbedBuilder {
  const embed = new EmbedBuilder().setColor(client.holder.colors.default);

  switch (view) {
    case "main":
      embed
        .setTitle(t(client, lang, "commands.games.embeds.base.title"))
        .setDescription(t(client, lang, "commands.games.embeds.base.description"))
        .addFields(
          {
            name: t(client, lang, "commands.games.embeds.base.fields.status.name"),
            value: settings.enabled
              ? t(client, lang, "commands.games.embeds.base.fields.status.enabled")
              : t(client, lang, "commands.games.embeds.base.fields.status.disabled"),
            inline: true,
          },
          {
            name: t(client, lang, "commands.games.embeds.base.fields.channel.name"),
            value: settings.channel
              ? t(client, lang, "commands.games.embeds.base.fields.channel.value", settings.channel)
              : t(client, lang, "commands.games.embeds.base.fields.channel.none"),
            inline: true,
          },
          {
            name: t(client, lang, "commands.games.embeds.base.fields.send_channel.name"),
            value: settings.send_channel
              ? t(
                  client,
                  lang,
                  "commands.games.embeds.base.fields.send_channel.value",
                  settings.send_channel,
                )
              : t(client, lang, "commands.games.embeds.base.fields.send_channel.none"),
            inline: true,
          },
          {
            name: t(client, lang, "commands.games.embeds.base.fields.games_count.name"),
            value: t(
              client,
              lang,
              "commands.games.embeds.base.fields.games_count.value",
              settings.games.length,
            ),
            inline: true,
          },
        );
      break;

    case "channels":
      embed
        .setTitle(t(client, lang, "commands.games.embeds.base.title"))
        .setDescription(t(client, lang, "commands.games.embeds.base.description"))
        .addFields(
          {
            name: t(client, lang, "commands.games.embeds.base.fields.channel.name"),
            value: settings.channel
              ? t(client, lang, "commands.games.embeds.base.fields.channel.value", settings.channel)
              : t(client, lang, "commands.games.embeds.base.fields.channel.none"),
            inline: true,
          },
          {
            name: t(client, lang, "commands.games.embeds.base.fields.send_channel.name"),
            value: settings.send_channel
              ? t(
                  client,
                  lang,
                  "commands.games.embeds.base.fields.send_channel.value",
                  settings.send_channel,
                )
              : t(client, lang, "commands.games.embeds.base.fields.send_channel.none"),
            inline: true,
          },
        );
      break;

    case "embed":
      embed
        .setTitle(t(client, lang, "commands.games.embeds.embed_settings.title"))
        .setDescription(t(client, lang, "commands.games.embeds.embed_settings.description"))
        .addFields(
          {
            name: t(client, lang, "commands.games.embeds.embed_settings.fields.title.name"),
            value: settings.embed.title
              ? t(
                  client,
                  lang,
                  "commands.games.embeds.embed_settings.fields.title.value",
                  settings.embed.title,
                )
              : t(client, lang, "commands.games.embeds.embed_settings.fields.title.none"),
            inline: true,
          },
          {
            name: t(client, lang, "commands.games.embeds.embed_settings.fields.description.name"),
            value: settings.embed.description
              ? t(
                  client,
                  lang,
                  "commands.games.embeds.embed_settings.fields.description.value",
                  settings.embed.description.substring(0, 50) +
                    (settings.embed.description.length > 50 ? "..." : ""),
                )
              : t(client, lang, "commands.games.embeds.embed_settings.fields.description.none"),
            inline: true,
          },
          {
            name: t(client, lang, "commands.games.embeds.embed_settings.fields.color.name"),
            value: settings.embed.color
              ? t(
                  client,
                  lang,
                  "commands.games.embeds.embed_settings.fields.color.value",
                  settings.embed.color,
                )
              : t(client, lang, "commands.games.embeds.embed_settings.fields.color.none"),
            inline: true,
          },
          {
            name: t(client, lang, "commands.games.embeds.embed_settings.fields.thumbnail.name"),
            value: settings.embed.thumbnail
              ? t(
                  client,
                  lang,
                  "commands.games.embeds.embed_settings.fields.thumbnail.value",
                  settings.embed.thumbnail,
                )
              : t(client, lang, "commands.games.embeds.embed_settings.fields.thumbnail.none"),
            inline: true,
          },
          {
            name: t(client, lang, "commands.games.embeds.embed_settings.fields.image.name"),
            value: settings.embed.image
              ? t(
                  client,
                  lang,
                  "commands.games.embeds.embed_settings.fields.image.value",
                  settings.embed.image,
                )
              : t(client, lang, "commands.games.embeds.embed_settings.fields.image.none"),
            inline: true,
          },
          {
            name: t(client, lang, "commands.games.embeds.embed_settings.fields.footer.name"),
            value: settings.embed.footer
              ? t(
                  client,
                  lang,
                  "commands.games.embeds.embed_settings.fields.footer.value",
                  settings.embed.footer,
                )
              : t(client, lang, "commands.games.embeds.embed_settings.fields.footer.none"),
            inline: true,
          },
        );
      break;

    case "games":
      embed
        .setTitle(t(client, lang, "commands.games.embeds.games_list.title"))
        .setDescription(t(client, lang, "commands.games.embeds.games_list.description"));

      if (settings.games.length > 0) {
        const gamesText = settings.games
          .map((game) =>
            t(
              client,
              lang,
              "commands.games.embeds.games_list.fields.games.format",
              game.emoji || "🎮",
              game.name,
            ),
          )
          .join("\n");
        embed.addFields({
          name: t(client, lang, "commands.games.embeds.games_list.fields.games.name"),
          value: gamesText,
        });
      } else {
        embed.addFields({
          name: t(client, lang, "commands.games.embeds.games_list.fields.games.name"),
          value: t(client, lang, "commands.games.embeds.games_list.fields.games.none"),
        });
      }
      break;

    case "game_edit":
      if (gameIndex !== undefined && settings.games[gameIndex]) {
        const game = settings.games[gameIndex];
        embed
          .setTitle(t(client, lang, "commands.games.embeds.game_edit.title", game.name))
          .setDescription(t(client, lang, "commands.games.embeds.game_edit.description"))
          .addFields(
            {
              name: t(client, lang, "commands.games.embeds.game_edit.fields.name.name"),
              value: t(
                client,
                lang,
                "commands.games.embeds.game_edit.fields.name.value",
                game.name,
              ),
              inline: true,
            },
            {
              name: t(client, lang, "commands.games.embeds.game_edit.fields.emoji.name"),
              value: game.emoji
                ? t(client, lang, "commands.games.embeds.game_edit.fields.emoji.value", game.emoji)
                : t(client, lang, "commands.games.embeds.game_edit.fields.emoji.none"),
              inline: true,
            },
            {
              name: t(client, lang, "commands.games.embeds.game_edit.fields.role.name"),
              value: game.role
                ? t(client, lang, "commands.games.embeds.game_edit.fields.role.value", game.role)
                : t(client, lang, "commands.games.embeds.game_edit.fields.role.none"),
              inline: true,
            },
            {
              name: t(client, lang, "commands.games.embeds.game_edit.fields.modal_title.name"),
              value: t(
                client,
                lang,
                "commands.games.embeds.game_edit.fields.modal_title.value",
                game.modal.title,
              ),
              inline: true,
            },
            {
              name: t(client, lang, "commands.games.embeds.game_edit.fields.fields_count.name"),
              value: t(
                client,
                lang,
                "commands.games.embeds.game_edit.fields.fields_count.value",
                game.modal.fields.length,
              ),
              inline: true,
            },
          );
      }
      break;

    case "field_edit":
      if (
        gameIndex !== undefined &&
        fieldIndex !== undefined &&
        settings.games[gameIndex]?.modal?.fields[fieldIndex]
      ) {
        const field = settings.games[gameIndex].modal.fields[fieldIndex];
        embed
          .setTitle(t(client, lang, "commands.games.embeds.game_field_edit.title"))
          .setDescription(t(client, lang, "commands.games.embeds.game_field_edit.description"))
          .addFields(
            {
              name: t(client, lang, "commands.games.embeds.game_field_edit.fields.name.name"),
              value: t(
                client,
                lang,
                "commands.games.embeds.game_field_edit.fields.name.value",
                field.name,
              ),
              inline: true,
            },
            {
              name: t(
                client,
                lang,
                "commands.games.embeds.game_field_edit.fields.placeholder.name",
              ),
              value: t(
                client,
                lang,
                "commands.games.embeds.game_field_edit.fields.placeholder.value",
                field.placeholder || "-",
              ),
              inline: true,
            },
            {
              name: t(client, lang, "commands.games.embeds.game_field_edit.fields.style.name"),
              value: t(
                client,
                lang,
                "commands.games.embeds.game_field_edit.fields.style.value",
                field.type,
              ),
              inline: true,
            },
            {
              name: t(client, lang, "commands.games.embeds.game_field_edit.fields.sizes.name"),
              value: t(
                client,
                lang,
                "commands.games.embeds.game_field_edit.fields.sizes.value",
                field.min,
                field.max,
              ),
              inline: true,
            },
            {
              name: t(client, lang, "commands.games.embeds.game_field_edit.fields.required.name"),
              value: t(
                client,
                lang,
                "commands.games.embeds.game_field_edit.fields.required.value",
                field.required ? "✅" : "❌",
              ),
              inline: true,
            },
          );
      }
      break;

    case "game_emoji":
      if (gameIndex !== undefined && settings.games[gameIndex]) {
        const game = settings.games[gameIndex];
        embed
          .setTitle(t(client, lang, "commands.games.embeds.game_emoji.title") as string)
          .setDescription(t(client, lang, "commands.games.embeds.game_emoji.description") as string)
          .addFields(
            {
              name: t(
                client,
                lang,
                "commands.games.embeds.game_emoji.fields.current.name",
              ) as string,
              value: String(game.emoji || "🎮"),
              inline: true,
            },
            {
              name: t(client, lang, "commands.games.embeds.game_emoji.fields.game.name") as string,
              value: game.name,
              inline: true,
            },
          );
      }
      break;
  }

  return embed;
}

function buildComponents(
  client: Client,
  lang: string,
  settings: FindTeamSettings,
  view: ViewType,
  gameIndex?: number,
  fieldIndex?: number,
  guildObj?: import("discord.js").Guild | null,
  emojiPage: number = 0,
  emojisPerPage: number = 25,
): ActionRowBuilder<MessageActionRowComponentBuilder>[] {
  const components: ActionRowBuilder<MessageActionRowComponentBuilder>[] = [];

  switch (view) {
    case "main":
      components.push(
        new ActionRowBuilder<MessageActionRowComponentBuilder>().setComponents(
          new ButtonBuilder()
            .setCustomId("NI_games:toggle")
            .setLabel(
              settings.enabled
                ? t(client, lang, "commands.games.buttons.disable")
                : t(client, lang, "commands.games.buttons.enable"),
            )
            .setStyle(settings.enabled ? ButtonStyle.Danger : ButtonStyle.Success),
          new ButtonBuilder()
            .setCustomId("NI_games:setup")
            .setLabel(t(client, lang, "commands.games.buttons.setup"))
            .setStyle(ButtonStyle.Primary),
          new ButtonBuilder()
            .setCustomId("NI_games:send_embed")
            .setLabel(t(client, lang, "commands.games.buttons.send_embed"))
            .setStyle(ButtonStyle.Primary)
            .setDisabled(!settings.channel || settings.games.length === 0),
        ),
      );

      if (settings.enabled) {
        components.push(
          new ActionRowBuilder<MessageActionRowComponentBuilder>().setComponents(
            new StringSelectMenuBuilder()
              .setCustomId("NI_games:main_menu")
              .setPlaceholder(t(client, lang, "commands.games.select_menus.main.placeholder"))
              .setOptions(
                new StringSelectMenuOptionBuilder()
                  .setLabel(
                    t(client, lang, "commands.games.select_menus.main.options.channels.label"),
                  )
                  .setDescription(
                    t(
                      client,
                      lang,
                      "commands.games.select_menus.main.options.channels.description",
                    ),
                  )
                  .setValue("channels"),
                new StringSelectMenuOptionBuilder()
                  .setLabel(t(client, lang, "commands.games.select_menus.main.options.embed.label"))
                  .setDescription(
                    t(client, lang, "commands.games.select_menus.main.options.embed.description"),
                  )
                  .setValue("embed"),
                new StringSelectMenuOptionBuilder()
                  .setLabel(t(client, lang, "commands.games.select_menus.main.options.games.label"))
                  .setDescription(
                    t(client, lang, "commands.games.select_menus.main.options.games.description"),
                  )
                  .setValue("games"),
              ),
          ),
        );
      }
      break;

    case "channels":
      components.push(
        new ActionRowBuilder<MessageActionRowComponentBuilder>().setComponents(
          new ChannelSelectMenuBuilder()
            .setCustomId("NI_games:select_channel")
            .setPlaceholder(
              t(client, lang, "commands.games.select_menus.select_channel.placeholder"),
            )
            .setChannelTypes(ChannelType.GuildText),
        ),
        new ActionRowBuilder<MessageActionRowComponentBuilder>().setComponents(
          new ChannelSelectMenuBuilder()
            .setCustomId("NI_games:send_channel")
            .setPlaceholder(t(client, lang, "commands.games.select_menus.send_channel.placeholder"))
            .setChannelTypes(ChannelType.GuildText),
        ),
        new ActionRowBuilder<MessageActionRowComponentBuilder>().setComponents(
          new ButtonBuilder()
            .setCustomId("NI_games:back")
            .setLabel(t(client, lang, "commands.games.buttons.back"))
            .setStyle(ButtonStyle.Secondary),
        ),
      );
      break;

    case "embed":
      components.push(
        new ActionRowBuilder<MessageActionRowComponentBuilder>().setComponents(
          new StringSelectMenuBuilder()
            .setCustomId("NI_games:embed_menu")
            .setPlaceholder(t(client, lang, "commands.games.select_menus.embed.placeholder"))
            .setOptions(
              new StringSelectMenuOptionBuilder()
                .setLabel(t(client, lang, "commands.games.select_menus.embed.options.title.label"))
                .setDescription(
                  t(client, lang, "commands.games.select_menus.embed.options.title.description"),
                )
                .setValue("title"),
              new StringSelectMenuOptionBuilder()
                .setLabel(
                  t(client, lang, "commands.games.select_menus.embed.options.description.label"),
                )
                .setDescription(
                  t(
                    client,
                    lang,
                    "commands.games.select_menus.embed.options.description.description",
                  ),
                )
                .setValue("description"),
              new StringSelectMenuOptionBuilder()
                .setLabel(t(client, lang, "commands.games.select_menus.embed.options.color.label"))
                .setDescription(
                  t(client, lang, "commands.games.select_menus.embed.options.color.description"),
                )
                .setValue("color"),
              new StringSelectMenuOptionBuilder()
                .setLabel(
                  t(client, lang, "commands.games.select_menus.embed.options.thumbnail.label"),
                )
                .setDescription(
                  t(
                    client,
                    lang,
                    "commands.games.select_menus.embed.options.thumbnail.description",
                  ),
                )
                .setValue("thumbnail"),
              new StringSelectMenuOptionBuilder()
                .setLabel(t(client, lang, "commands.games.select_menus.embed.options.image.label"))
                .setDescription(
                  t(client, lang, "commands.games.select_menus.embed.options.image.description"),
                )
                .setValue("image"),
              new StringSelectMenuOptionBuilder()
                .setLabel(t(client, lang, "commands.games.select_menus.embed.options.footer.label"))
                .setDescription(
                  t(client, lang, "commands.games.select_menus.embed.options.footer.description"),
                )
                .setValue("footer"),
              new StringSelectMenuOptionBuilder()
                .setLabel(
                  t(client, lang, "commands.games.select_menus.embed.options.placeholder.label"),
                )
                .setDescription(
                  t(
                    client,
                    lang,
                    "commands.games.select_menus.embed.options.placeholder.description",
                  ),
                )
                .setValue("placeholder"),
            ),
        ),
        new ActionRowBuilder<MessageActionRowComponentBuilder>().setComponents(
          new ButtonBuilder()
            .setCustomId("NI_games:preview")
            .setLabel(t(client, lang, "commands.games.buttons.preview"))
            .setStyle(ButtonStyle.Primary),
          new ButtonBuilder()
            .setCustomId("NI_games:back")
            .setLabel(t(client, lang, "commands.games.buttons.back"))
            .setStyle(ButtonStyle.Secondary),
        ),
      );
      break;

    case "games":
      const gamesSelect = new StringSelectMenuBuilder()
        .setCustomId("NI_games:games_menu")
        .setPlaceholder(t(client, lang, "commands.games.select_menus.games.placeholder"))
        .addOptions(
          new StringSelectMenuOptionBuilder()
            .setLabel(t(client, lang, "commands.games.select_menus.games.options.add.label"))
            .setDescription(
              t(client, lang, "commands.games.select_menus.games.options.add.description"),
            )
            .setValue("add")
            .setEmoji("➕"),
        );

      settings.games.forEach((game) => {
        gamesSelect.addOptions(
          new StringSelectMenuOptionBuilder()
            .setLabel(game.name)
            .setValue(game.id)
            .setEmoji((game.emoji as any) || "🎮"),
        );
      });

      components.push(
        new ActionRowBuilder<MessageActionRowComponentBuilder>().setComponents(gamesSelect),
        new ActionRowBuilder<MessageActionRowComponentBuilder>().setComponents(
          new ButtonBuilder()
            .setCustomId("NI_games:back")
            .setLabel(t(client, lang, "commands.games.buttons.back"))
            .setStyle(ButtonStyle.Secondary),
        ),
      );
      break;

    case "game_edit":
      if (gameIndex !== undefined && settings.games[gameIndex]) {
        const game = settings.games[gameIndex];

        // Fields select menu
        const fieldsSelect = new StringSelectMenuBuilder()
          .setCustomId("NI_games:fields_menu")
          .setPlaceholder(t(client, lang, "commands.games.select_menus.game_fields.placeholder"))
          .addOptions(
            new StringSelectMenuOptionBuilder()
              .setLabel(
                t(client, lang, "commands.games.select_menus.game_fields.options.main.label"),
              )
              .setDescription(
                t(client, lang, "commands.games.select_menus.game_fields.options.main.description"),
              )
              .setValue("main")
              .setEmoji("🏠"),
            new StringSelectMenuOptionBuilder()
              .setLabel(
                t(client, lang, "commands.games.select_menus.game_fields.options.add.label"),
              )
              .setDescription(
                t(client, lang, "commands.games.select_menus.game_fields.options.add.description"),
              )
              .setValue("add")
              .setEmoji("➕"),
          );

        game.modal.fields.forEach((field) => {
          fieldsSelect.addOptions(
            new StringSelectMenuOptionBuilder().setLabel(field.name).setValue(field.id),
          );
        });

        components.push(
          new ActionRowBuilder<MessageActionRowComponentBuilder>().setComponents(fieldsSelect),
          new ActionRowBuilder<MessageActionRowComponentBuilder>().setComponents(
            new ButtonBuilder()
              .setCustomId("NI_games:edit_name")
              .setLabel(t(client, lang, "commands.games.buttons.edit_name"))
              .setStyle(ButtonStyle.Secondary),
            new ButtonBuilder()
              .setCustomId("NI_games:edit_emoji")
              .setLabel(t(client, lang, "commands.games.buttons.edit_emoji"))
              .setStyle(ButtonStyle.Secondary),
            new ButtonBuilder()
              .setCustomId("NI_games:edit_modal_title")
              .setLabel(t(client, lang, "commands.games.buttons.edit_modal_title"))
              .setStyle(ButtonStyle.Secondary),
          ),
          new ActionRowBuilder<MessageActionRowComponentBuilder>().setComponents(
            new RoleSelectMenuBuilder()
              .setCustomId("NI_games:edit_role")
              .setPlaceholder(t(client, lang, "commands.games.buttons.edit_role"))
              .setMinValues(0)
              .setMaxValues(1),
          ),
          new ActionRowBuilder<MessageActionRowComponentBuilder>().setComponents(
            new ButtonBuilder()
              .setCustomId("NI_games:delete_game")
              .setLabel(t(client, lang, "commands.games.buttons.delete_game"))
              .setStyle(ButtonStyle.Danger),
            new ButtonBuilder()
              .setCustomId("NI_games:back")
              .setLabel(t(client, lang, "commands.games.buttons.back"))
              .setStyle(ButtonStyle.Secondary),
          ),
        );
      }
      break;

    case "field_edit":
      if (gameIndex !== undefined && fieldIndex !== undefined) {
        components.push(
          new ActionRowBuilder<MessageActionRowComponentBuilder>().setComponents(
            new ButtonBuilder()
              .setCustomId("NI_games:edit_label")
              .setLabel(t(client, lang, "commands.games.buttons.edit_label"))
              .setStyle(ButtonStyle.Secondary),
            new ButtonBuilder()
              .setCustomId("NI_games:edit_placeholder")
              .setLabel(t(client, lang, "commands.games.buttons.edit_placeholder"))
              .setStyle(ButtonStyle.Secondary),
            new ButtonBuilder()
              .setCustomId("NI_games:toggle_style")
              .setLabel(t(client, lang, "commands.games.buttons.toggle_style"))
              .setStyle(ButtonStyle.Secondary),
          ),
          new ActionRowBuilder<MessageActionRowComponentBuilder>().setComponents(
            new ButtonBuilder()
              .setCustomId("NI_games:edit_sizes")
              .setLabel(t(client, lang, "commands.games.buttons.edit_sizes"))
              .setStyle(ButtonStyle.Secondary),
            new ButtonBuilder()
              .setCustomId("NI_games:toggle_required")
              .setLabel(t(client, lang, "commands.games.buttons.toggle_required"))
              .setStyle(ButtonStyle.Secondary),
          ),
          new ActionRowBuilder<MessageActionRowComponentBuilder>().setComponents(
            new ButtonBuilder()
              .setCustomId("NI_games:delete_field")
              .setLabel(t(client, lang, "commands.games.buttons.delete_field"))
              .setStyle(ButtonStyle.Danger),
            new ButtonBuilder()
              .setCustomId("NI_games:back")
              .setLabel(t(client, lang, "commands.games.buttons.back"))
              .setStyle(ButtonStyle.Secondary),
          ),
        );
      }
      break;

    case "game_emoji": {
      // Build paginated emoji select menu
      const emojis = guildObj?.emojis.cache;
      const emojiArray = emojis ? Array.from(emojis.values()) : [];
      const totalEmojis = emojiArray.length;
      const totalPages = Math.ceil(totalEmojis / emojisPerPage) || 1;

      const startIndex = emojiPage * emojisPerPage;
      const endIndex = Math.min(startIndex + emojisPerPage, totalEmojis);
      const pageEmojis = emojiArray.slice(startIndex, endIndex);

      if (pageEmojis.length > 0) {
        const emojiSelectMenu = new StringSelectMenuBuilder()
          .setCustomId("NI_games:emoji_select")
          .setPlaceholder(
            t(client, lang, "commands.games.select_menus.emoji.placeholder") as string,
          )
          .setOptions(
            pageEmojis.map((emoji) =>
              new StringSelectMenuOptionBuilder()
                .setLabel(emoji.name || "Unknown")
                .setValue(emoji.id)
                .setEmoji({ id: emoji.id, animated: emoji.animated || false }),
            ),
          );

        components.push(
          new ActionRowBuilder<MessageActionRowComponentBuilder>().setComponents(emojiSelectMenu),
        );
      }

      // Pagination buttons
      components.push(
        new ActionRowBuilder<MessageActionRowComponentBuilder>().setComponents(
          new ButtonBuilder()
            .setCustomId("NI_games:emoji_prev")
            .setLabel("◀")
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(emojiPage === 0),
          new ButtonBuilder()
            .setCustomId("NI_games:emoji_page")
            .setLabel(`${emojiPage + 1}/${totalPages}`)
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(true),
          new ButtonBuilder()
            .setCustomId("NI_games:emoji_next")
            .setLabel("▶")
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(emojiPage >= totalPages - 1),
        ),
        new ActionRowBuilder<MessageActionRowComponentBuilder>().setComponents(
          new ButtonBuilder()
            .setCustomId("NI_games:reset_emoji")
            .setLabel(t(client, lang, "commands.games.buttons.reset_emoji") as string)
            .setStyle(ButtonStyle.Danger),
          new ButtonBuilder()
            .setCustomId("NI_games:back")
            .setLabel(t(client, lang, "commands.games.buttons.back"))
            .setStyle(ButtonStyle.Secondary),
        ),
      );
      break;
    }
  }

  return components;
}

async function showModal(
  interaction: any,
  type: string,
  client: Client,
  lang: string,
  currentValue?: string,
) {
  const modalConfigs: Record<
    string,
    {
      title: string;
      label: string;
      placeholder: string;
      style?: TextInputStyle;
      maxLength?: number;
    }
  > = {
    game_name: {
      title: t(client, lang, "commands.games.modals.game_name.title"),
      label: t(client, lang, "commands.games.modals.game_name.label"),
      placeholder: t(client, lang, "commands.games.modals.game_name.placeholder"),
      maxLength: 100,
    },
    game_emoji: {
      title: t(client, lang, "commands.games.modals.game_emoji.title"),
      label: t(client, lang, "commands.games.modals.game_emoji.label"),
      placeholder: t(client, lang, "commands.games.modals.game_emoji.placeholder"),
      maxLength: 50,
    },
    game_modal_title: {
      title: t(client, lang, "commands.games.modals.game_modal_title.title"),
      label: t(client, lang, "commands.games.modals.game_modal_title.label"),
      placeholder: t(client, lang, "commands.games.modals.game_modal_title.placeholder"),
      maxLength: 45,
    },
    field_label: {
      title: t(client, lang, "commands.games.modals.field_label.title"),
      label: t(client, lang, "commands.games.modals.field_label.label"),
      placeholder: t(client, lang, "commands.games.modals.field_label.placeholder"),
      maxLength: 45,
    },
    field_placeholder: {
      title: t(client, lang, "commands.games.modals.field_placeholder.title"),
      label: t(client, lang, "commands.games.modals.field_placeholder.label"),
      placeholder: t(client, lang, "commands.games.modals.field_placeholder.placeholder"),
      maxLength: 100,
    },
    select_placeholder: {
      title: t(client, lang, "commands.games.modals.select_placeholder.title"),
      label: t(client, lang, "commands.games.modals.select_placeholder.label"),
      placeholder: t(client, lang, "commands.games.modals.select_placeholder.placeholder"),
      maxLength: 100,
    },
  };

  const config = modalConfigs[type];
  if (!config) return;

  const modal = new ModalBuilder()
    .setTitle(config.title)
    .setCustomId(`NI_games:modal:${type}`)
    .setLabelComponents(
      new LabelBuilder().setLabel(config.label).setTextInputComponent(
        new TextInputBuilder()
          .setCustomId("NI_games:input")
          .setPlaceholder(currentValue || config.placeholder)
          .setStyle(config.style || TextInputStyle.Short)
          .setMaxLength(config.maxLength || 100)
          .setRequired(false),
      ),
    );

  await interaction.showModal(modal);
}

async function showEmbedModal(
  interaction: any,
  field: string,
  client: Client,
  lang: string,
  embed: FindTeamSettings["embed"],
) {
  const modalConfigs: Record<
    string,
    {
      title: string;
      label: string;
      placeholder: string;
      style?: TextInputStyle;
      maxLength?: number;
    }
  > = {
    title: {
      title: t(client, lang, "commands.games.modals.embed_title.title"),
      label: t(client, lang, "commands.games.modals.embed_title.label"),
      placeholder: t(client, lang, "commands.games.modals.embed_title.placeholder"),
      maxLength: 256,
    },
    description: {
      title: t(client, lang, "commands.games.modals.embed_description.title"),
      label: t(client, lang, "commands.games.modals.embed_description.label"),
      placeholder: t(client, lang, "commands.games.modals.embed_description.placeholder"),
      style: TextInputStyle.Paragraph,
      maxLength: 4000,
    },
    color: {
      title: t(client, lang, "commands.games.modals.embed_color.title"),
      label: t(client, lang, "commands.games.modals.embed_color.label"),
      placeholder: t(client, lang, "commands.games.modals.embed_color.placeholder"),
      maxLength: 7,
    },
    thumbnail: {
      title: t(client, lang, "commands.games.modals.embed_thumbnail.title"),
      label: t(client, lang, "commands.games.modals.embed_thumbnail.label"),
      placeholder: t(client, lang, "commands.games.modals.embed_thumbnail.placeholder"),
      maxLength: 2000,
    },
    image: {
      title: t(client, lang, "commands.games.modals.embed_image.title"),
      label: t(client, lang, "commands.games.modals.embed_image.label"),
      placeholder: t(client, lang, "commands.games.modals.embed_image.placeholder"),
      maxLength: 2000,
    },
    footer: {
      title: t(client, lang, "commands.games.modals.embed_footer.title"),
      label: t(client, lang, "commands.games.modals.embed_footer.label"),
      placeholder: t(client, lang, "commands.games.modals.embed_footer.placeholder"),
      maxLength: 2048,
    },
  };

  const config = modalConfigs[field];
  if (!config) return;

  const currentValue = (embed as any)[field] || "";

  const modal = new ModalBuilder()
    .setTitle(config.title)
    .setCustomId(`NI_games:modal:embed_${field}`)
    .setLabelComponents(
      new LabelBuilder().setLabel(config.label).setTextInputComponent(
        new TextInputBuilder()
          .setCustomId("NI_games:input")
          .setPlaceholder(currentValue || config.placeholder)
          .setStyle(config.style || TextInputStyle.Short)
          .setMaxLength(config.maxLength || 100)
          .setRequired(false),
      ),
    );

  await interaction.showModal(modal);
}

async function showSizesModal(interaction: any, client: Client, lang: string, field?: IModalField) {
  const modal = new ModalBuilder()
    .setTitle(t(client, lang, "commands.games.modals.field_sizes.title"))
    .setCustomId("NI_games:modal:sizes")
    .setLabelComponents(
      new LabelBuilder()
        .setLabel(t(client, lang, "commands.games.modals.field_sizes.min_label"))
        .setTextInputComponent(
          new TextInputBuilder()
            .setCustomId("NI_games:min")
            .setPlaceholder(field?.min?.toString() || "0")
            .setStyle(TextInputStyle.Short)
            .setMaxLength(4)
            .setRequired(false),
        ),
      new LabelBuilder()
        .setLabel(t(client, lang, "commands.games.modals.field_sizes.max_label"))
        .setTextInputComponent(
          new TextInputBuilder()
            .setCustomId("NI_games:max")
            .setPlaceholder(field?.max?.toString() || "100")
            .setStyle(TextInputStyle.Short)
            .setMaxLength(4)
            .setRequired(false),
        ),
    );

  await interaction.showModal(modal);
}

function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

async function buildFieldEmbed(
  embed: EmbedBuilder,
  client: Client,
  lang: string,
  settings: FindTeamSettings,
  gameIndex: number,
  fieldIndex: number,
): Promise<{ embed: EmbedBuilder; attachment: AttachmentBuilder }> {
  const field = settings.games[gameIndex]?.modal?.fields[fieldIndex];

  if (!field) {
    return {
      embed: embed,
      attachment: new AttachmentBuilder(Buffer.from(""), { name: "field.png" }),
    };
  }

  // Generate canvas preview for the field
  const attachment = new AttachmentBuilder(await new canvasUtil.ModalField(field).render(), {
    name: "field.png",
  });

  // Clear existing fields and image
  embed.data.fields = [];
  embed.data.image = undefined;

  embed
    .setTitle(t(client, lang, "commands.games.embeds.game_field_edit.title"))
    .setDescription(t(client, lang, "commands.games.embeds.game_field_edit.description"))
    .addFields(
      {
        name: t(client, lang, "commands.games.embeds.game_field_edit.fields.name.name"),
        value: t(
          client,
          lang,
          "commands.games.embeds.game_field_edit.fields.name.value",
          field.name,
        ),
        inline: true,
      },
      {
        name: t(client, lang, "commands.games.embeds.game_field_edit.fields.placeholder.name"),
        value: t(
          client,
          lang,
          "commands.games.embeds.game_field_edit.fields.placeholder.value",
          field.placeholder || "-",
        ),
        inline: true,
      },
      {
        name: t(client, lang, "commands.games.embeds.game_field_edit.fields.style.name"),
        value: t(
          client,
          lang,
          "commands.games.embeds.game_field_edit.fields.style.value",
          field.type,
        ),
        inline: true,
      },
      {
        name: t(client, lang, "commands.games.embeds.game_field_edit.fields.sizes.name"),
        value: t(
          client,
          lang,
          "commands.games.embeds.game_field_edit.fields.sizes.value",
          field.min,
          field.max,
        ),
        inline: true,
      },
      {
        name: t(client, lang, "commands.games.embeds.game_field_edit.fields.required.name"),
        value: t(
          client,
          lang,
          "commands.games.embeds.game_field_edit.fields.required.value",
          field.required ? "✅" : "❌",
        ),
        inline: true,
      },
    )
    .setImage("attachment://field.png");

  return { embed, attachment };
}

const mostUsedQueries = {
  getSettings: async (guild: Guild): Promise<FindTeamSettings> => {
    return await guild.get("utils.find_team");
  },
  setEnabled: async (guild: Guild, enabled: boolean) => {
    return await guild.set("utils.find_team.enabled", enabled);
  },
  setChannel: async (guild: Guild, channel: string | null) => {
    return await guild.set("utils.find_team.channel", channel);
  },
  setSendChannel: async (guild: Guild, channel: string | null) => {
    return await guild.set("utils.find_team.send_channel", channel);
  },
  setSelectPlaceholder: async (guild: Guild, placeholder: string | null) => {
    return await guild.set("utils.find_team.select_placeholder", placeholder);
  },
  setEmbed: async (guild: Guild, embed: FindTeamSettings["embed"]) => {
    return await guild.set("utils.find_team.embed", embed);
  },
  setGames: async (guild: Guild, games: FindTeamGame[]) => {
    return await guild.set("utils.find_team.games", games);
  },
};
