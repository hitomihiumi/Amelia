import { SlashCommand } from "../../types/helpers";
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
  RoleSelectMenuBuilder,
} from "discord.js";
import { defaultPermissions, Guild } from "../../helpers";
import { t } from "../../i18n/helpers";
import { GuildSchema } from "../../types/helpers";
import { GuildEmoji } from "discord.js";

type EconomySettings = GuildSchema["economy"];
type IncomeType = "work" | "timely" | "daily" | "weekly" | "level_up" | "bump" | "rob";
type ViewType =
  | "main"
  | "currency"
  | "currency_emoji"
  | "shop"
  | "shop_manage"
  | "income"
  | IncomeType;

module.exports = {
  name: "economy",
  description: "🏦 Setting up the economy system on the server.",
  cooldown: 5,
  locale: {
    ru: "🏦 Настройка экономической системы на сервере.",
    uk: "🏦 Налаштування економічної системи на сервері.",
  },
  options: [],
  permissions: {
    bot: [...defaultPermissions, PermissionsBitField.Flags.ManageRoles],
  },
  run: async (client: Client, interaction: CommandInteraction) => {
    if (!interaction.guild) return;

    await interaction.deferReply({ flags: MessageFlagsBitField.Flags.Ephemeral });

    const guild = new Guild(client, interaction.guild);
    const lang = await guild.get("settings.language");

    let settings = await mostUsedQueries.getEconomySettings(guild);
    let currentView: ViewType = "main";
    let selectedRoleId: string | null = null;
    let emojiPage = 0;
    const EMOJIS_PER_PAGE = 25;

    const components = buildComponents(
      client,
      lang,
      settings,
      currentView,
      selectedRoleId,
      interaction.guild,
      emojiPage,
      EMOJIS_PER_PAGE,
    );
    let embed = buildEmbed(
      client,
      lang,
      settings,
      currentView,
      selectedRoleId,
      interaction.guild,
      emojiPage,
      EMOJIS_PER_PAGE,
    );

    const msg = await interaction.editReply({ embeds: [embed], components });

    const filter = (i: any) => i.user.id === interaction.user.id;
    const collector = msg.createMessageComponentCollector({ filter, time: 600000 });

    collector.on("collect", async (i) => {
      if (i.isButton()) {
        if (i.customId === "NI_economy:back") {
          // Navigate back based on current view
          if (
            ["work", "timely", "daily", "weekly", "level_up", "bump", "rob"].includes(currentView)
          ) {
            currentView = "income";
          } else if (currentView === "shop_manage") {
            currentView = "shop";
            selectedRoleId = null;
          } else if (currentView === "currency_emoji") {
            currentView = "currency";
          } else {
            currentView = "main";
          }

          const components = buildComponents(
            client,
            lang,
            settings,
            currentView,
            selectedRoleId,
            interaction.guild,
            emojiPage,
            EMOJIS_PER_PAGE,
          );
          embed = buildEmbed(
            client,
            lang,
            settings,
            currentView,
            selectedRoleId,
            interaction.guild,
            emojiPage,
            EMOJIS_PER_PAGE,
          );
          await i.update({ embeds: [embed], components });
        } else if (i.customId === "NI_economy:reset_emoji") {
          settings.currency.emoji = null;
          settings.currency.id = null;
          await mostUsedQueries.setCurrency(guild, null, null);

          const components = buildComponents(
            client,
            lang,
            settings,
            currentView,
            selectedRoleId,
            interaction.guild,
            emojiPage,
            EMOJIS_PER_PAGE,
          );
          embed = buildEmbed(
            client,
            lang,
            settings,
            currentView,
            selectedRoleId,
            interaction.guild,
            emojiPage,
            EMOJIS_PER_PAGE,
          );

          await i.update({ embeds: [embed], components });
          await i.followUp({
            content: t(client, lang, "commands.economy.messages.currency_reset"),
            flags: MessageFlagsBitField.Flags.Ephemeral,
          });
        } else if (i.customId === "NI_economy:set_emoji") {
          currentView = "currency_emoji";
          emojiPage = 0;

          const components = buildComponents(
            client,
            lang,
            settings,
            currentView,
            selectedRoleId,
            interaction.guild,
            emojiPage,
            EMOJIS_PER_PAGE,
          );
          embed = buildEmbed(
            client,
            lang,
            settings,
            currentView,
            selectedRoleId,
            interaction.guild,
            emojiPage,
            EMOJIS_PER_PAGE,
          );
          await i.update({ embeds: [embed], components });
        } else if (i.customId === "NI_economy:emoji_prev") {
          emojiPage = Math.max(0, emojiPage - 1);

          const components = buildComponents(
            client,
            lang,
            settings,
            currentView,
            selectedRoleId,
            interaction.guild,
            emojiPage,
            EMOJIS_PER_PAGE,
          );
          embed = buildEmbed(
            client,
            lang,
            settings,
            currentView,
            selectedRoleId,
            interaction.guild,
            emojiPage,
            EMOJIS_PER_PAGE,
          );
          await i.update({ embeds: [embed], components });
        } else if (i.customId === "NI_economy:emoji_next") {
          const totalEmojis = interaction.guild?.emojis.cache.size || 0;
          const maxPage = Math.ceil(totalEmojis / EMOJIS_PER_PAGE) - 1;
          emojiPage = Math.min(maxPage, emojiPage + 1);

          const components = buildComponents(
            client,
            lang,
            settings,
            currentView,
            selectedRoleId,
            interaction.guild,
            emojiPage,
            EMOJIS_PER_PAGE,
          );
          embed = buildEmbed(
            client,
            lang,
            settings,
            currentView,
            selectedRoleId,
            interaction.guild,
            emojiPage,
            EMOJIS_PER_PAGE,
          );
          await i.update({ embeds: [embed], components });
        } else if (i.customId === "NI_economy:remove_role") {
          const modal = new ModalBuilder()
            .setTitle(t(client, lang, "commands.economy.modals.remove_role.title"))
            .setCustomId("NI_economy:remove_role_modal")
            .setLabelComponents(
              new LabelBuilder()
                .setLabel(t(client, lang, "commands.economy.modals.remove_role.role.label"))
                .setTextInputComponent(
                  new TextInputBuilder()
                    .setRequired(true)
                    .setMinLength(17)
                    .setMaxLength(20)
                    .setStyle(TextInputStyle.Short)
                    .setCustomId("NI_economy:role_id")
                    .setPlaceholder(
                      t(client, lang, "commands.economy.modals.remove_role.role.placeholder"),
                    ),
                ),
            );

          await i.showModal(modal);

          await i
            .awaitModalSubmit({
              time: 5 * 60 * 1000,
              filter: (int: any) =>
                int.user.id === interaction.user.id &&
                int.customId === "NI_economy:remove_role_modal",
            })
            .then(async (int) => {
              const roleId = int.fields.getTextInputValue("NI_economy:role_id");

              const roleIndex = settings.shop.roles.findIndex((r) => r.role === roleId);
              if (roleIndex === -1) {
                await int.reply({
                  content: t(client, lang, "commands.economy.messages.role_not_found"),
                  flags: MessageFlagsBitField.Flags.Ephemeral,
                });
                return;
              }

              settings.shop.roles.splice(roleIndex, 1);
              await mostUsedQueries.setShopRoles(guild, settings.shop.roles);

              const components = buildComponents(
                client,
                lang,
                settings,
                currentView,
                selectedRoleId,
              );
              embed = buildEmbed(
                client,
                lang,
                settings,
                currentView,
                selectedRoleId,
                interaction.guild,
                emojiPage,
                EMOJIS_PER_PAGE,
              );

              await int.reply({
                content: t(client, lang, "commands.economy.messages.role_removed"),
                flags: MessageFlagsBitField.Flags.Ephemeral,
              });
              await interaction.editReply({ embeds: [embed], components });
            })
            .catch(() => {});
        } else if (i.customId.startsWith("NI_economy:toggle_")) {
          const incomeType = i.customId.replace("NI_economy:toggle_", "") as IncomeType;

          switch (incomeType) {
            case "work":
              settings.income.work.enabled = !settings.income.work.enabled;
              await mostUsedQueries.setIncomeEnabled(guild, "work", settings.income.work.enabled);
              break;
            case "timely":
              settings.income.timely.enabled = !settings.income.timely.enabled;
              await mostUsedQueries.setIncomeEnabled(
                guild,
                "timely",
                settings.income.timely.enabled,
              );
              break;
            case "daily":
              settings.income.daily.enabled = !settings.income.daily.enabled;
              await mostUsedQueries.setIncomeEnabled(guild, "daily", settings.income.daily.enabled);
              break;
            case "weekly":
              settings.income.weekly.enabled = !settings.income.weekly.enabled;
              await mostUsedQueries.setIncomeEnabled(
                guild,
                "weekly",
                settings.income.weekly.enabled,
              );
              break;
            case "level_up":
              settings.income.level_up.enabled = !settings.income.level_up.enabled;
              await mostUsedQueries.setIncomeEnabled(
                guild,
                "level_up",
                settings.income.level_up.enabled,
              );
              break;
            case "bump":
              settings.income.bump.enabled = !settings.income.bump.enabled;
              await mostUsedQueries.setIncomeEnabled(guild, "bump", settings.income.bump.enabled);
              break;
            case "rob":
              settings.income.rob.enabled = !settings.income.rob.enabled;
              await mostUsedQueries.setIncomeEnabled(guild, "rob", settings.income.rob.enabled);
              break;
          }

          const components = buildComponents(
            client,
            lang,
            settings,
            currentView,
            selectedRoleId,
            interaction.guild,
            emojiPage,
            EMOJIS_PER_PAGE,
          );
          embed = buildEmbed(
            client,
            lang,
            settings,
            currentView,
            selectedRoleId,
            interaction.guild,
            emojiPage,
            EMOJIS_PER_PAGE,
          );
          await i.update({ embeds: [embed], components });
        } else if (i.customId === "NI_economy:edit_work") {
          const modal = new ModalBuilder()
            .setTitle(t(client, lang, "commands.economy.modals.work.title"))
            .setCustomId("NI_economy:work_modal")
            .setLabelComponents(
              new LabelBuilder()
                .setLabel(t(client, lang, "commands.economy.modals.work.cooldown.label"))
                .setTextInputComponent(
                  new TextInputBuilder()
                    .setRequired(true)
                    .setMinLength(1)
                    .setMaxLength(10)
                    .setStyle(TextInputStyle.Short)
                    .setCustomId("NI_economy:cooldown")
                    .setPlaceholder(
                      t(client, lang, "commands.economy.modals.work.cooldown.placeholder"),
                    )
                    .setValue(settings.income.work.cooldown.toString()),
                ),
              new LabelBuilder()
                .setLabel(t(client, lang, "commands.economy.modals.work.min.label"))
                .setTextInputComponent(
                  new TextInputBuilder()
                    .setRequired(true)
                    .setMinLength(1)
                    .setMaxLength(10)
                    .setStyle(TextInputStyle.Short)
                    .setCustomId("NI_economy:min")
                    .setPlaceholder(t(client, lang, "commands.economy.modals.work.min.placeholder"))
                    .setValue(settings.income.work.min.toString()),
                ),
              new LabelBuilder()
                .setLabel(t(client, lang, "commands.economy.modals.work.max.label"))
                .setTextInputComponent(
                  new TextInputBuilder()
                    .setRequired(true)
                    .setMinLength(1)
                    .setMaxLength(10)
                    .setStyle(TextInputStyle.Short)
                    .setCustomId("NI_economy:max")
                    .setPlaceholder(t(client, lang, "commands.economy.modals.work.max.placeholder"))
                    .setValue(settings.income.work.max.toString()),
                ),
            );

          await i.showModal(modal);

          await i
            .awaitModalSubmit({
              time: 5 * 60 * 1000,
              filter: (int: any) =>
                int.user.id === interaction.user.id && int.customId === "NI_economy:work_modal",
            })
            .then(async (int) => {
              const cooldown = Number.parseInt(int.fields.getTextInputValue("NI_economy:cooldown"));
              const min = Number.parseInt(int.fields.getTextInputValue("NI_economy:min"));
              const max = Number.parseInt(int.fields.getTextInputValue("NI_economy:max"));

              if (Number.isNaN(cooldown) || Number.isNaN(min) || Number.isNaN(max)) {
                await int.reply({
                  content: t(client, lang, "commands.economy.messages.invalid_number"),
                  flags: MessageFlagsBitField.Flags.Ephemeral,
                });
                return;
              }

              settings.income.work.cooldown = cooldown;
              settings.income.work.min = min;
              settings.income.work.max = max;

              await mostUsedQueries.setWorkSettings(guild, cooldown, min, max);

              const components = buildComponents(
                client,
                lang,
                settings,
                currentView,
                selectedRoleId,
              );
              embed = buildEmbed(
                client,
                lang,
                settings,
                currentView,
                selectedRoleId,
                interaction.guild,
                emojiPage,
                EMOJIS_PER_PAGE,
              );

              await int.reply({
                content: t(client, lang, "commands.economy.messages.settings_updated"),
                flags: MessageFlagsBitField.Flags.Ephemeral,
              });
              await interaction.editReply({ embeds: [embed], components });
            })
            .catch(() => {});
        } else if (i.customId.startsWith("NI_economy:edit_amount_")) {
          const incomeType = i.customId.replace("NI_economy:edit_amount_", "") as
            | "timely"
            | "daily"
            | "weekly"
            | "level_up"
            | "bump";

          const modal = new ModalBuilder()
            .setTitle(t(client, lang, "commands.economy.modals.simple_amount.title"))
            .setCustomId(`NI_economy:amount_modal_${incomeType}`)
            .setLabelComponents(
              new LabelBuilder()
                .setLabel(t(client, lang, "commands.economy.modals.simple_amount.amount.label"))
                .setTextInputComponent(
                  new TextInputBuilder()
                    .setRequired(true)
                    .setMinLength(1)
                    .setMaxLength(10)
                    .setStyle(TextInputStyle.Short)
                    .setCustomId("NI_economy:amount")
                    .setPlaceholder(
                      t(client, lang, "commands.economy.modals.simple_amount.amount.placeholder"),
                    )
                    .setValue(settings.income[incomeType].amount.toString()),
                ),
            );

          await i.showModal(modal);

          await i
            .awaitModalSubmit({
              time: 5 * 60 * 1000,
              filter: (int: any) =>
                int.user.id === interaction.user.id &&
                int.customId === `NI_economy:amount_modal_${incomeType}`,
            })
            .then(async (int) => {
              const amount = Number.parseInt(int.fields.getTextInputValue("NI_economy:amount"));

              if (Number.isNaN(amount)) {
                await int.reply({
                  content: t(client, lang, "commands.economy.messages.invalid_number"),
                  flags: MessageFlagsBitField.Flags.Ephemeral,
                });
                return;
              }

              settings.income[incomeType].amount = amount;
              await mostUsedQueries.setIncomeAmount(guild, incomeType, amount);

              const components = buildComponents(
                client,
                lang,
                settings,
                currentView,
                selectedRoleId,
              );
              embed = buildEmbed(
                client,
                lang,
                settings,
                currentView,
                selectedRoleId,
                interaction.guild,
                emojiPage,
                EMOJIS_PER_PAGE,
              );

              await int.reply({
                content: t(client, lang, "commands.economy.messages.settings_updated"),
                flags: MessageFlagsBitField.Flags.Ephemeral,
              });
              await interaction.editReply({ embeds: [embed], components });
            })
            .catch(() => {});
        } else if (i.customId === "NI_economy:edit_rob_cooldown") {
          const modal = new ModalBuilder()
            .setTitle(t(client, lang, "commands.economy.modals.rob.title"))
            .setCustomId("NI_economy:rob_cooldown_modal")
            .setLabelComponents(
              new LabelBuilder()
                .setLabel(t(client, lang, "commands.economy.modals.rob.cooldown.label"))
                .setTextInputComponent(
                  new TextInputBuilder()
                    .setRequired(true)
                    .setMinLength(1)
                    .setMaxLength(10)
                    .setStyle(TextInputStyle.Short)
                    .setCustomId("NI_economy:cooldown")
                    .setPlaceholder(
                      t(client, lang, "commands.economy.modals.rob.cooldown.placeholder"),
                    )
                    .setValue(settings.income.rob.cooldown.toString()),
                ),
            );

          await i.showModal(modal);

          await i
            .awaitModalSubmit({
              time: 5 * 60 * 1000,
              filter: (int: any) =>
                int.user.id === interaction.user.id &&
                int.customId === "NI_economy:rob_cooldown_modal",
            })
            .then(async (int) => {
              const cooldown = Number.parseInt(int.fields.getTextInputValue("NI_economy:cooldown"));

              if (Number.isNaN(cooldown)) {
                await int.reply({
                  content: t(client, lang, "commands.economy.messages.invalid_number"),
                  flags: MessageFlagsBitField.Flags.Ephemeral,
                });
                return;
              }

              settings.income.rob.cooldown = cooldown;
              await guild.set("economy.income.rob.cooldown", cooldown);

              const components = buildComponents(
                client,
                lang,
                settings,
                currentView,
                selectedRoleId,
              );
              embed = buildEmbed(
                client,
                lang,
                settings,
                currentView,
                selectedRoleId,
                interaction.guild,
                emojiPage,
                EMOJIS_PER_PAGE,
              );

              await int.reply({
                content: t(client, lang, "commands.economy.messages.settings_updated"),
                flags: MessageFlagsBitField.Flags.Ephemeral,
              });
              await interaction.editReply({ embeds: [embed], components });
            })
            .catch(() => {});
        } else if (i.customId === "NI_economy:edit_rob_income") {
          const modal = new ModalBuilder()
            .setTitle(t(client, lang, "commands.economy.modals.rob_income.title"))
            .setCustomId("NI_economy:rob_income_modal")
            .setLabelComponents(
              new LabelBuilder()
                .setLabel(t(client, lang, "commands.economy.modals.rob_income.min.label"))
                .setTextInputComponent(
                  new TextInputBuilder()
                    .setRequired(true)
                    .setMinLength(1)
                    .setMaxLength(10)
                    .setStyle(TextInputStyle.Short)
                    .setCustomId("NI_economy:min")
                    .setPlaceholder(
                      t(client, lang, "commands.economy.modals.rob_income.min.placeholder"),
                    )
                    .setValue(settings.income.rob.income.min.toString()),
                ),
              new LabelBuilder()
                .setLabel(t(client, lang, "commands.economy.modals.rob_income.max.label"))
                .setTextInputComponent(
                  new TextInputBuilder()
                    .setRequired(true)
                    .setMinLength(1)
                    .setMaxLength(10)
                    .setStyle(TextInputStyle.Short)
                    .setCustomId("NI_economy:max")
                    .setPlaceholder(
                      t(client, lang, "commands.economy.modals.rob_income.max.placeholder"),
                    )
                    .setValue(settings.income.rob.income.max.toString()),
                ),
              new LabelBuilder()
                .setLabel(t(client, lang, "commands.economy.modals.rob_income.type.label"))
                .setTextInputComponent(
                  new TextInputBuilder()
                    .setRequired(true)
                    .setMinLength(5)
                    .setMaxLength(10)
                    .setStyle(TextInputStyle.Short)
                    .setCustomId("NI_economy:type")
                    .setPlaceholder(
                      t(client, lang, "commands.economy.modals.rob_income.type.placeholder"),
                    )
                    .setValue(settings.income.rob.income.type),
                ),
            );

          await i.showModal(modal);

          await i
            .awaitModalSubmit({
              time: 5 * 60 * 1000,
              filter: (int: any) =>
                int.user.id === interaction.user.id &&
                int.customId === "NI_economy:rob_income_modal",
            })
            .then(async (int) => {
              const min = Number.parseInt(int.fields.getTextInputValue("NI_economy:min"));
              const max = Number.parseInt(int.fields.getTextInputValue("NI_economy:max"));
              const type = int.fields.getTextInputValue("NI_economy:type").toLowerCase();

              if (Number.isNaN(min) || Number.isNaN(max)) {
                await int.reply({
                  content: t(client, lang, "commands.economy.messages.invalid_number"),
                  flags: MessageFlagsBitField.Flags.Ephemeral,
                });
                return;
              }

              if (type !== "percentage" && type !== "fixed") {
                await int.reply({
                  content: t(client, lang, "commands.economy.messages.invalid_type"),
                  flags: MessageFlagsBitField.Flags.Ephemeral,
                });
                return;
              }

              settings.income.rob.income.min = min;
              settings.income.rob.income.max = max;
              settings.income.rob.income.type = type as "percentage" | "fixed";

              await guild.set("economy.income.rob.income", { min, max, type });

              const components = buildComponents(
                client,
                lang,
                settings,
                currentView,
                selectedRoleId,
              );
              embed = buildEmbed(
                client,
                lang,
                settings,
                currentView,
                selectedRoleId,
                interaction.guild,
                emojiPage,
                EMOJIS_PER_PAGE,
              );

              await int.reply({
                content: t(client, lang, "commands.economy.messages.settings_updated"),
                flags: MessageFlagsBitField.Flags.Ephemeral,
              });
              await interaction.editReply({ embeds: [embed], components });
            })
            .catch(() => {});
        } else if (i.customId === "NI_economy:edit_rob_punishment") {
          const modal = new ModalBuilder()
            .setTitle(t(client, lang, "commands.economy.modals.rob_punishment.title"))
            .setCustomId("NI_economy:rob_punishment_modal")
            .setLabelComponents(
              new LabelBuilder()
                .setLabel(t(client, lang, "commands.economy.modals.rob_punishment.min.label"))
                .setTextInputComponent(
                  new TextInputBuilder()
                    .setRequired(true)
                    .setMinLength(1)
                    .setMaxLength(10)
                    .setStyle(TextInputStyle.Short)
                    .setCustomId("NI_economy:min")
                    .setPlaceholder(
                      t(client, lang, "commands.economy.modals.rob_punishment.min.placeholder"),
                    )
                    .setValue(settings.income.rob.punishment.min.toString()),
                ),
              new LabelBuilder()
                .setLabel(t(client, lang, "commands.economy.modals.rob_punishment.max.label"))
                .setTextInputComponent(
                  new TextInputBuilder()
                    .setRequired(true)
                    .setMinLength(1)
                    .setMaxLength(10)
                    .setStyle(TextInputStyle.Short)
                    .setCustomId("NI_economy:max")
                    .setPlaceholder(
                      t(client, lang, "commands.economy.modals.rob_punishment.max.placeholder"),
                    )
                    .setValue(settings.income.rob.punishment.max.toString()),
                ),
              new LabelBuilder()
                .setLabel(t(client, lang, "commands.economy.modals.rob_punishment.type.label"))
                .setTextInputComponent(
                  new TextInputBuilder()
                    .setRequired(true)
                    .setMinLength(5)
                    .setMaxLength(10)
                    .setStyle(TextInputStyle.Short)
                    .setCustomId("NI_economy:type")
                    .setPlaceholder(
                      t(client, lang, "commands.economy.modals.rob_punishment.type.placeholder"),
                    )
                    .setValue(settings.income.rob.punishment.type),
                ),
              new LabelBuilder()
                .setLabel(
                  t(client, lang, "commands.economy.modals.rob_punishment.fail_chance.label"),
                )
                .setTextInputComponent(
                  new TextInputBuilder()
                    .setRequired(true)
                    .setMinLength(1)
                    .setMaxLength(3)
                    .setStyle(TextInputStyle.Short)
                    .setCustomId("NI_economy:fail_chance")
                    .setPlaceholder(
                      t(
                        client,
                        lang,
                        "commands.economy.modals.rob_punishment.fail_chance.placeholder",
                      ),
                    )
                    .setValue(settings.income.rob.punishment.fail_chance.toString()),
                ),
            );

          await i.showModal(modal);

          await i
            .awaitModalSubmit({
              time: 5 * 60 * 1000,
              filter: (int: any) =>
                int.user.id === interaction.user.id &&
                int.customId === "NI_economy:rob_punishment_modal",
            })
            .then(async (int) => {
              const min = Number.parseInt(int.fields.getTextInputValue("NI_economy:min"));
              const max = Number.parseInt(int.fields.getTextInputValue("NI_economy:max"));
              const type = int.fields.getTextInputValue("NI_economy:type").toLowerCase();
              const failChance = Number.parseInt(
                int.fields.getTextInputValue("NI_economy:fail_chance"),
              );

              if (Number.isNaN(min) || Number.isNaN(max) || Number.isNaN(failChance)) {
                await int.reply({
                  content: t(client, lang, "commands.economy.messages.invalid_number"),
                  flags: MessageFlagsBitField.Flags.Ephemeral,
                });
                return;
              }

              if (type !== "percentage" && type !== "fixed") {
                await int.reply({
                  content: t(client, lang, "commands.economy.messages.invalid_type"),
                  flags: MessageFlagsBitField.Flags.Ephemeral,
                });
                return;
              }

              settings.income.rob.punishment.min = min;
              settings.income.rob.punishment.max = max;
              settings.income.rob.punishment.type = type as "percentage" | "fixed";
              settings.income.rob.punishment.fail_chance = failChance;

              await guild.set("economy.income.rob.punishment", {
                min,
                max,
                type,
                fail_chance: failChance,
              });

              const components = buildComponents(
                client,
                lang,
                settings,
                currentView,
                selectedRoleId,
              );
              embed = buildEmbed(
                client,
                lang,
                settings,
                currentView,
                selectedRoleId,
                interaction.guild,
                emojiPage,
                EMOJIS_PER_PAGE,
              );

              await int.reply({
                content: t(client, lang, "commands.economy.messages.settings_updated"),
                flags: MessageFlagsBitField.Flags.Ephemeral,
              });
              await interaction.editReply({ embeds: [embed], components });
            })
            .catch(() => {});
        } else if (i.customId === "NI_economy:set_discount") {
          if (!selectedRoleId) return;

          const modal = new ModalBuilder()
            .setTitle(t(client, lang, "commands.economy.modals.discount.title"))
            .setCustomId("NI_economy:discount_modal")
            .setLabelComponents(
              new LabelBuilder()
                .setLabel(t(client, lang, "commands.economy.modals.discount.amount.label"))
                .setTextInputComponent(
                  new TextInputBuilder()
                    .setRequired(true)
                    .setMinLength(1)
                    .setMaxLength(3)
                    .setStyle(TextInputStyle.Short)
                    .setCustomId("NI_economy:discount_amount")
                    .setPlaceholder(
                      t(client, lang, "commands.economy.modals.discount.amount.placeholder"),
                    ),
                ),
              new LabelBuilder()
                .setLabel(t(client, lang, "commands.economy.modals.discount.starts_at.label"))
                .setTextInputComponent(
                  new TextInputBuilder()
                    .setRequired(false)
                    .setMinLength(0)
                    .setMaxLength(16)
                    .setStyle(TextInputStyle.Short)
                    .setCustomId("NI_economy:discount_starts")
                    .setPlaceholder(
                      t(client, lang, "commands.economy.modals.discount.starts_at.placeholder"),
                    ),
                ),
              new LabelBuilder()
                .setLabel(t(client, lang, "commands.economy.modals.discount.expires_at.label"))
                .setTextInputComponent(
                  new TextInputBuilder()
                    .setRequired(false)
                    .setMinLength(0)
                    .setMaxLength(16)
                    .setStyle(TextInputStyle.Short)
                    .setCustomId("NI_economy:discount_expires")
                    .setPlaceholder(
                      t(client, lang, "commands.economy.modals.discount.expires_at.placeholder"),
                    ),
                ),
            );

          await i.showModal(modal);

          await i
            .awaitModalSubmit({
              time: 5 * 60 * 1000,
              filter: (int: any) =>
                int.user.id === interaction.user.id && int.customId === "NI_economy:discount_modal",
            })
            .then(async (int) => {
              const amountStr = int.fields.getTextInputValue("NI_economy:discount_amount");
              const startsAtStr = int.fields.getTextInputValue("NI_economy:discount_starts");
              const expiresAtStr = int.fields.getTextInputValue("NI_economy:discount_expires");

              const amount = Number.parseInt(amountStr);
              if (Number.isNaN(amount) || amount < 1 || amount > 100) {
                await int.reply({
                  content: t(client, lang, "commands.economy.messages.invalid_number"),
                  flags: MessageFlagsBitField.Flags.Ephemeral,
                });
                return;
              }

              let startsAt: number | null = null;
              let expiresAt: number | null = null;

              if (startsAtStr && startsAtStr.trim()) {
                const parsed = Date.parse(startsAtStr.replace(" ", "T"));
                if (Number.isNaN(parsed)) {
                  await int.reply({
                    content: t(client, lang, "commands.economy.messages.invalid_date"),
                    flags: MessageFlagsBitField.Flags.Ephemeral,
                  });
                  return;
                }
                startsAt = parsed;
              }

              if (expiresAtStr && expiresAtStr.trim()) {
                const parsed = Date.parse(expiresAtStr.replace(" ", "T"));
                if (Number.isNaN(parsed)) {
                  await int.reply({
                    content: t(client, lang, "commands.economy.messages.invalid_date"),
                    flags: MessageFlagsBitField.Flags.Ephemeral,
                  });
                  return;
                }
                expiresAt = parsed;
              }

              const roleIndex = settings.shop.roles.findIndex((r) => r.role === selectedRoleId);
              if (roleIndex !== -1) {
                settings.shop.roles[roleIndex].discount = {
                  amount,
                  starts_at: startsAt,
                  expires_at: expiresAt,
                };
                await mostUsedQueries.setShopRoles(guild, settings.shop.roles);
              }

              const components = buildComponents(
                client,
                lang,
                settings,
                currentView,
                selectedRoleId,
              );
              embed = buildEmbed(
                client,
                lang,
                settings,
                currentView,
                selectedRoleId,
                interaction.guild,
                emojiPage,
                EMOJIS_PER_PAGE,
              );

              await int.reply({
                content: t(
                  client,
                  lang,
                  "commands.economy.messages.discount_set",
                  amount.toString(),
                  `<@&${selectedRoleId}>`,
                ),
                flags: MessageFlagsBitField.Flags.Ephemeral,
              });
              await interaction.editReply({ embeds: [embed], components });
            })
            .catch(() => {});
        } else if (i.customId === "NI_economy:remove_discount") {
          if (!selectedRoleId) return;

          const roleIndex = settings.shop.roles.findIndex((r) => r.role === selectedRoleId);
          if (roleIndex !== -1) {
            settings.shop.roles[roleIndex].discount = {
              amount: 0,
              starts_at: null,
              expires_at: null,
            };
            await mostUsedQueries.setShopRoles(guild, settings.shop.roles);
          }

          const components = buildComponents(
            client,
            lang,
            settings,
            currentView,
            selectedRoleId,
            interaction.guild,
            emojiPage,
            EMOJIS_PER_PAGE,
          );
          embed = buildEmbed(
            client,
            lang,
            settings,
            currentView,
            selectedRoleId,
            interaction.guild,
            emojiPage,
            EMOJIS_PER_PAGE,
          );

          await i.update({ embeds: [embed], components });
          await i.followUp({
            content: t(client, lang, "commands.economy.messages.discount_removed"),
            flags: MessageFlagsBitField.Flags.Ephemeral,
          });
        }
      } else if (i.isStringSelectMenu()) {
        if (i.customId === "NI_economy:main_menu") {
          currentView = i.values[0] as "currency" | "shop" | "income";

          const components = buildComponents(
            client,
            lang,
            settings,
            currentView,
            selectedRoleId,
            interaction.guild,
            emojiPage,
            EMOJIS_PER_PAGE,
          );
          embed = buildEmbed(
            client,
            lang,
            settings,
            currentView,
            selectedRoleId,
            interaction.guild,
            emojiPage,
            EMOJIS_PER_PAGE,
          );
          await i.update({ embeds: [embed], components });
        } else if (i.customId === "NI_economy:income_menu") {
          currentView = i.values[0] as IncomeType;

          const components = buildComponents(
            client,
            lang,
            settings,
            currentView,
            selectedRoleId,
            interaction.guild,
            emojiPage,
            EMOJIS_PER_PAGE,
          );
          embed = buildEmbed(
            client,
            lang,
            settings,
            currentView,
            selectedRoleId,
            interaction.guild,
            emojiPage,
            EMOJIS_PER_PAGE,
          );
          await i.update({ embeds: [embed], components });
        } else if (i.customId === "NI_economy:manage_role") {
          selectedRoleId = i.values[0];
          currentView = "shop_manage";

          const components = buildComponents(
            client,
            lang,
            settings,
            currentView,
            selectedRoleId,
            interaction.guild,
            emojiPage,
            EMOJIS_PER_PAGE,
          );
          embed = buildEmbed(
            client,
            lang,
            settings,
            currentView,
            selectedRoleId,
            interaction.guild,
            emojiPage,
            EMOJIS_PER_PAGE,
          );
          await i.update({ embeds: [embed], components });
        } else if (i.customId === "NI_economy:emoji_select") {
          const selectedEmojiId = i.values[0];
          const selectedEmoji = interaction.guild?.emojis.cache.get(selectedEmojiId);

          if (selectedEmoji) {
            const emojiStr = selectedEmoji.animated
              ? `<a:${selectedEmoji.name}:${selectedEmoji.id}>`
              : `<:${selectedEmoji.name}:${selectedEmoji.id}>`;

            settings.currency.emoji = emojiStr;
            settings.currency.id = selectedEmoji.id;

            await mostUsedQueries.setCurrency(guild, settings.currency.emoji, settings.currency.id);

            currentView = "currency";

            const components = buildComponents(
              client,
              lang,
              settings,
              currentView,
              selectedRoleId,
              interaction.guild,
              emojiPage,
              EMOJIS_PER_PAGE,
            );
            embed = buildEmbed(
              client,
              lang,
              settings,
              currentView,
              selectedRoleId,
              interaction.guild,
              emojiPage,
              EMOJIS_PER_PAGE,
            );

            await i.update({ embeds: [embed], components });
            await i.followUp({
              content: t(client, lang, "commands.economy.messages.currency_set", emojiStr),
              flags: MessageFlagsBitField.Flags.Ephemeral,
            });
          }
        }
      } else if (i.isRoleSelectMenu()) {
        if (i.customId === "NI_economy:add_shop_role") {
          const roleId = i.values[0];

          // Check if role already exists
          if (settings.shop.roles.some((r) => r.role === roleId)) {
            await i.reply({
              content: t(
                client,
                lang,
                "commands.economy.messages.role_added",
                `<@&${roleId}>`,
                "0",
              ),
              flags: MessageFlagsBitField.Flags.Ephemeral,
            });
            return;
          }

          const modal = new ModalBuilder()
            .setTitle(t(client, lang, "commands.economy.modals.shop_role.title"))
            .setCustomId("NI_economy:shop_role_modal")
            .setLabelComponents(
              new LabelBuilder()
                .setLabel(t(client, lang, "commands.economy.modals.shop_role.price.label"))
                .setTextInputComponent(
                  new TextInputBuilder()
                    .setRequired(true)
                    .setMinLength(1)
                    .setMaxLength(10)
                    .setStyle(TextInputStyle.Short)
                    .setCustomId("NI_economy:price")
                    .setPlaceholder(
                      t(client, lang, "commands.economy.modals.shop_role.price.placeholder"),
                    ),
                ),
            );

          await i.showModal(modal);

          await i
            .awaitModalSubmit({
              time: 5 * 60 * 1000,
              filter: (int: any) =>
                int.user.id === interaction.user.id &&
                int.customId === "NI_economy:shop_role_modal",
            })
            .then(async (int) => {
              const price = Number.parseInt(int.fields.getTextInputValue("NI_economy:price"));

              if (Number.isNaN(price) || price < 0) {
                await int.reply({
                  content: t(client, lang, "commands.economy.messages.invalid_number"),
                  flags: MessageFlagsBitField.Flags.Ephemeral,
                });
                return;
              }

              settings.shop.roles.push({
                role: roleId,
                price,
                discount: { amount: 0, starts_at: null, expires_at: null },
              });
              await mostUsedQueries.setShopRoles(guild, settings.shop.roles);

              const components = buildComponents(
                client,
                lang,
                settings,
                currentView,
                selectedRoleId,
              );
              embed = buildEmbed(
                client,
                lang,
                settings,
                currentView,
                selectedRoleId,
                interaction.guild,
                emojiPage,
                EMOJIS_PER_PAGE,
              );

              await int.reply({
                content: t(
                  client,
                  lang,
                  "commands.economy.messages.role_added",
                  `<@&${roleId}>`,
                  price.toString(),
                ),
                flags: MessageFlagsBitField.Flags.Ephemeral,
              });
              await interaction.editReply({ embeds: [embed], components });
            })
            .catch(() => {});
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
  settings: EconomySettings,
  view: ViewType,
  selectedRoleId: string | null = null,
  guildObj: import("discord.js").Guild | null = null,
  emojiPage: number = 0,
  emojisPerPage: number = 25,
): EmbedBuilder {
  const embed = new EmbedBuilder().setColor(client.holder.colors.default);

  if (view === "main") {
    embed
      .setTitle(t(client, lang, "commands.economy.embeds.base.title"))
      .setDescription(t(client, lang, "commands.economy.embeds.base.description"))
      .addFields(
        {
          name: t(client, lang, "commands.economy.embeds.base.fields.currency.name"),
          value:
            settings.currency.emoji ||
            t(
              client,
              lang,
              "commands.economy.embeds.base.fields.currency.default",
              client.holder.emojis.discord.gems,
            ),
          inline: true,
        },
        {
          name: t(client, lang, "commands.economy.embeds.base.fields.shop_roles.name"),
          value:
            settings.shop.roles.length > 0
              ? settings.shop.roles
                  .map((r) =>
                    t(
                      client,
                      lang,
                      "commands.economy.embeds.base.fields.shop_roles.format",
                      `<@&${r.role}>`,
                      r.price.toString(),
                      settings.currency.emoji || client.holder.emojis.discord.gems,
                    ),
                  )
                  .join("\n")
              : t(client, lang, "commands.economy.embeds.base.fields.shop_roles.none"),
          inline: false,
        },
      );
  } else if (view === "currency") {
    embed
      .setTitle(t(client, lang, "commands.economy.embeds.currency.title"))
      .setDescription(t(client, lang, "commands.economy.embeds.currency.description"))
      .addFields({
        name: t(client, lang, "commands.economy.embeds.currency.fields.current.name"),
        value:
          settings.currency.emoji ||
          t(
            client,
            lang,
            "commands.economy.embeds.currency.fields.current.default",
            client.holder.emojis.discord.gems,
          ),
        inline: true,
      });
  } else if (view === "currency_emoji") {
    const emojis = guildObj?.emojis.cache;
    const totalEmojis = emojis?.size || 0;
    const totalPages = Math.ceil(totalEmojis / emojisPerPage) || 1;

    embed
      .setTitle(t(client, lang, "commands.economy.embeds.currency_emoji.title"))
      .setDescription(t(client, lang, "commands.economy.embeds.currency_emoji.description"))
      .setFooter({
        text: t(
          client,
          lang,
          "commands.economy.embeds.currency_emoji.footer",
          (emojiPage + 1).toString(),
          totalPages.toString(),
        ),
      });
  } else if (view === "shop") {
    embed
      .setTitle(t(client, lang, "commands.economy.embeds.shop.title"))
      .setDescription(t(client, lang, "commands.economy.embeds.shop.description"))
      .addFields({
        name: t(client, lang, "commands.economy.embeds.shop.fields.roles.name"),
        value:
          settings.shop.roles.length > 0
            ? settings.shop.roles
                .map((r) => formatRoleWithDiscount(client, lang, r, settings))
                .join("\n")
            : t(client, lang, "commands.economy.embeds.shop.fields.roles.none"),
        inline: false,
      });
  } else if (view === "shop_manage" && selectedRoleId) {
    const role = settings.shop.roles.find((r) => r.role === selectedRoleId);
    if (role) {
      const discountStatus = getDiscountStatus(client, lang, role);
      const discountedPrice =
        role.discount.amount > 0
          ? Math.floor(role.price * (1 - role.discount.amount / 100))
          : role.price;

      embed
        .setTitle(t(client, lang, "commands.economy.embeds.shop.title"))
        .setDescription(t(client, lang, "commands.economy.messages.select_role_to_manage"))
        .addFields(
          {
            name: "Role",
            value: `<@&${role.role}>`,
            inline: true,
          },
          {
            name: "Price",
            value:
              role.discount.amount > 0
                ? `~~${role.price}~~ **${discountedPrice}**`
                : `**${role.price}**`,
            inline: true,
          },
          {
            name: "Discount",
            value: role.discount.amount > 0 ? `${role.discount.amount}% ${discountStatus}` : "None",
            inline: true,
          },
        );

      if (role.discount.starts_at) {
        embed.addFields({
          name: "Starts At",
          value: `<t:${Math.floor(role.discount.starts_at / 1000)}:F>`,
          inline: true,
        });
      }
      if (role.discount.expires_at) {
        embed.addFields({
          name: "Expires At",
          value: `<t:${Math.floor(role.discount.expires_at / 1000)}:F>`,
          inline: true,
        });
      }
    }
  } else if (view === "income") {
    embed
      .setTitle(t(client, lang, "commands.economy.embeds.income.title"))
      .setDescription(t(client, lang, "commands.economy.embeds.income.description"));
  } else if (view === "work") {
    embed
      .setTitle(t(client, lang, "commands.economy.embeds.work.title"))
      .setDescription(t(client, lang, "commands.economy.embeds.work.description"))
      .addFields(
        {
          name: t(client, lang, "commands.economy.embeds.work.fields.status.name"),
          value: settings.income.work.enabled
            ? t(client, lang, "commands.economy.embeds.work.fields.status.enabled")
            : t(client, lang, "commands.economy.embeds.work.fields.status.disabled"),
          inline: true,
        },
        {
          name: t(client, lang, "commands.economy.embeds.work.fields.cooldown.name"),
          value: t(
            client,
            lang,
            "commands.economy.embeds.work.fields.cooldown.value",
            settings.income.work.cooldown.toString(),
          ),
          inline: true,
        },
        {
          name: t(client, lang, "commands.economy.embeds.work.fields.reward.name"),
          value: t(
            client,
            lang,
            "commands.economy.embeds.work.fields.reward.value",
            settings.income.work.min.toString(),
            settings.income.work.max.toString(),
          ),
          inline: true,
        },
      );
  } else if (view === "timely") {
    embed
      .setTitle(t(client, lang, "commands.economy.embeds.timely.title"))
      .setDescription(t(client, lang, "commands.economy.embeds.timely.description"))
      .addFields(
        {
          name: t(client, lang, "commands.economy.embeds.timely.fields.status.name"),
          value: settings.income.timely.enabled
            ? t(client, lang, "commands.economy.embeds.timely.fields.status.enabled")
            : t(client, lang, "commands.economy.embeds.timely.fields.status.disabled"),
          inline: true,
        },
        {
          name: t(client, lang, "commands.economy.embeds.timely.fields.amount.name"),
          value: t(
            client,
            lang,
            "commands.economy.embeds.timely.fields.amount.value",
            settings.income.timely.amount.toString(),
          ),
          inline: true,
        },
      );
  } else if (view === "daily") {
    embed
      .setTitle(t(client, lang, "commands.economy.embeds.daily.title"))
      .setDescription(t(client, lang, "commands.economy.embeds.daily.description"))
      .addFields(
        {
          name: t(client, lang, "commands.economy.embeds.daily.fields.status.name"),
          value: settings.income.daily.enabled
            ? t(client, lang, "commands.economy.embeds.daily.fields.status.enabled")
            : t(client, lang, "commands.economy.embeds.daily.fields.status.disabled"),
          inline: true,
        },
        {
          name: t(client, lang, "commands.economy.embeds.daily.fields.amount.name"),
          value: t(
            client,
            lang,
            "commands.economy.embeds.daily.fields.amount.value",
            settings.income.daily.amount.toString(),
          ),
          inline: true,
        },
      );
  } else if (view === "weekly") {
    embed
      .setTitle(t(client, lang, "commands.economy.embeds.weekly.title"))
      .setDescription(t(client, lang, "commands.economy.embeds.weekly.description"))
      .addFields(
        {
          name: t(client, lang, "commands.economy.embeds.weekly.fields.status.name"),
          value: settings.income.weekly.enabled
            ? t(client, lang, "commands.economy.embeds.weekly.fields.status.enabled")
            : t(client, lang, "commands.economy.embeds.weekly.fields.status.disabled"),
          inline: true,
        },
        {
          name: t(client, lang, "commands.economy.embeds.weekly.fields.amount.name"),
          value: t(
            client,
            lang,
            "commands.economy.embeds.weekly.fields.amount.value",
            settings.income.weekly.amount.toString(),
          ),
          inline: true,
        },
      );
  } else if (view === "level_up") {
    embed
      .setTitle(t(client, lang, "commands.economy.embeds.level_up.title"))
      .setDescription(t(client, lang, "commands.economy.embeds.level_up.description"))
      .addFields(
        {
          name: t(client, lang, "commands.economy.embeds.level_up.fields.status.name"),
          value: settings.income.level_up.enabled
            ? t(client, lang, "commands.economy.embeds.level_up.fields.status.enabled")
            : t(client, lang, "commands.economy.embeds.level_up.fields.status.disabled"),
          inline: true,
        },
        {
          name: t(client, lang, "commands.economy.embeds.level_up.fields.amount.name"),
          value: t(
            client,
            lang,
            "commands.economy.embeds.level_up.fields.amount.value",
            settings.income.level_up.amount.toString(),
          ),
          inline: true,
        },
      );
  } else if (view === "bump") {
    embed
      .setTitle(t(client, lang, "commands.economy.embeds.bump.title"))
      .setDescription(t(client, lang, "commands.economy.embeds.bump.description"))
      .addFields(
        {
          name: t(client, lang, "commands.economy.embeds.bump.fields.status.name"),
          value: settings.income.bump.enabled
            ? t(client, lang, "commands.economy.embeds.bump.fields.status.enabled")
            : t(client, lang, "commands.economy.embeds.bump.fields.status.disabled"),
          inline: true,
        },
        {
          name: t(client, lang, "commands.economy.embeds.bump.fields.amount.name"),
          value: t(
            client,
            lang,
            "commands.economy.embeds.bump.fields.amount.value",
            settings.income.bump.amount.toString(),
          ),
          inline: true,
        },
      );
  } else if (view === "rob") {
    embed
      .setTitle(t(client, lang, "commands.economy.embeds.rob.title"))
      .setDescription(t(client, lang, "commands.economy.embeds.rob.description"))
      .addFields(
        {
          name: t(client, lang, "commands.economy.embeds.rob.fields.status.name"),
          value: settings.income.rob.enabled
            ? t(client, lang, "commands.economy.embeds.rob.fields.status.enabled")
            : t(client, lang, "commands.economy.embeds.rob.fields.status.disabled"),
          inline: true,
        },
        {
          name: t(client, lang, "commands.economy.embeds.rob.fields.cooldown.name"),
          value: t(
            client,
            lang,
            "commands.economy.embeds.rob.fields.cooldown.value",
            settings.income.rob.cooldown.toString(),
          ),
          inline: true,
        },
        {
          name: t(client, lang, "commands.economy.embeds.rob.fields.income.name"),
          value: t(
            client,
            lang,
            "commands.economy.embeds.rob.fields.income.value",
            settings.income.rob.income.min.toString(),
            settings.income.rob.income.max.toString(),
            settings.income.rob.income.type,
          ),
          inline: true,
        },
        {
          name: t(client, lang, "commands.economy.embeds.rob.fields.punishment.name"),
          value: t(
            client,
            lang,
            "commands.economy.embeds.rob.fields.punishment.value",
            settings.income.rob.punishment.min.toString(),
            settings.income.rob.punishment.max.toString(),
            settings.income.rob.punishment.type,
          ),
          inline: true,
        },
        {
          name: t(client, lang, "commands.economy.embeds.rob.fields.fail_chance.name"),
          value: t(
            client,
            lang,
            "commands.economy.embeds.rob.fields.fail_chance.value",
            settings.income.rob.punishment.fail_chance.toString(),
          ),
          inline: true,
        },
      );
  }

  return embed;
}

function buildComponents(
  client: Client,
  lang: string,
  settings: EconomySettings,
  view: ViewType,
  selectedRoleId: string | null = null,
  guildObj: import("discord.js").Guild | null = null,
  emojiPage: number = 0,
  emojisPerPage: number = 25,
): ActionRowBuilder<MessageActionRowComponentBuilder>[] {
  const components: ActionRowBuilder<MessageActionRowComponentBuilder>[] = [];

  if (view === "main") {
    const menuRow = new ActionRowBuilder<MessageActionRowComponentBuilder>().setComponents(
      new StringSelectMenuBuilder()
        .setCustomId("NI_economy:main_menu")
        .setPlaceholder(t(client, lang, "commands.economy.select_menus.main.placeholder"))
        .setOptions(
          new StringSelectMenuOptionBuilder()
            .setLabel(t(client, lang, "commands.economy.select_menus.main.options.currency.label"))
            .setDescription(
              t(client, lang, "commands.economy.select_menus.main.options.currency.description"),
            )
            .setValue("currency"),
          new StringSelectMenuOptionBuilder()
            .setLabel(t(client, lang, "commands.economy.select_menus.main.options.shop.label"))
            .setDescription(
              t(client, lang, "commands.economy.select_menus.main.options.shop.description"),
            )
            .setValue("shop"),
          new StringSelectMenuOptionBuilder()
            .setLabel(t(client, lang, "commands.economy.select_menus.main.options.income.label"))
            .setDescription(
              t(client, lang, "commands.economy.select_menus.main.options.income.description"),
            )
            .setValue("income"),
        ),
    );
    components.push(menuRow);
  } else if (view === "currency") {
    const buttonRow = new ActionRowBuilder<MessageActionRowComponentBuilder>().setComponents(
      new ButtonBuilder()
        .setCustomId("NI_economy:set_emoji")
        .setLabel(t(client, lang, "commands.economy.buttons.set_emoji"))
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId("NI_economy:reset_emoji")
        .setLabel(t(client, lang, "commands.economy.buttons.reset_emoji"))
        .setStyle(ButtonStyle.Danger)
        .setDisabled(!settings.currency.emoji),
      new ButtonBuilder()
        .setCustomId("NI_economy:back")
        .setLabel(t(client, lang, "commands.economy.buttons.back"))
        .setStyle(ButtonStyle.Secondary),
    );
    components.push(buttonRow);
  } else if (view === "currency_emoji") {
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
        .setCustomId("NI_economy:emoji_select")
        .setPlaceholder(t(client, lang, "commands.economy.select_menus.emoji.placeholder"))
        .setOptions(
          pageEmojis.map((emoji) =>
            new StringSelectMenuOptionBuilder()
              .setLabel(emoji.name || "Unknown")
              .setValue(emoji.id)
              .setEmoji({ id: emoji.id, animated: emoji.animated || false }),
          ),
        );

      const selectRow = new ActionRowBuilder<MessageActionRowComponentBuilder>().setComponents(
        emojiSelectMenu,
      );
      components.push(selectRow);
    }

    // Pagination buttons
    const buttonRow = new ActionRowBuilder<MessageActionRowComponentBuilder>().setComponents(
      new ButtonBuilder()
        .setCustomId("NI_economy:emoji_prev")
        .setLabel("◀")
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(emojiPage === 0),
      new ButtonBuilder()
        .setCustomId("NI_economy:emoji_next")
        .setLabel("▶")
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(emojiPage >= totalPages - 1),
      new ButtonBuilder()
        .setCustomId("NI_economy:back")
        .setLabel(t(client, lang, "commands.economy.buttons.back"))
        .setStyle(ButtonStyle.Secondary),
    );
    components.push(buttonRow);
  } else if (view === "shop") {
    const roleSelectRow = new ActionRowBuilder<MessageActionRowComponentBuilder>().setComponents(
      new RoleSelectMenuBuilder()
        .setCustomId("NI_economy:add_shop_role")
        .setPlaceholder(t(client, lang, "commands.economy.select_menus.shop_role.placeholder"))
        .setMinValues(1)
        .setMaxValues(1),
    );

    // Add manage role select menu if there are roles in shop
    if (settings.shop.roles.length > 0) {
      const manageRoleRow = new ActionRowBuilder<MessageActionRowComponentBuilder>().setComponents(
        new StringSelectMenuBuilder()
          .setCustomId("NI_economy:manage_role")
          .setPlaceholder(t(client, lang, "commands.economy.select_menus.manage_role.placeholder"))
          .setOptions(
            settings.shop.roles.map((r) => {
              const discountInfo = r.discount.amount > 0 ? ` | -${r.discount.amount}%` : "";
              return new StringSelectMenuOptionBuilder()
                .setLabel(`${r.price}${discountInfo}`)
                .setDescription(`Role ID: ${r.role}`)
                .setValue(r.role)
                .setEmoji(settings.currency?.id || client.holder.emojis.discord.gems);
            }),
          ),
      );
      components.push(manageRoleRow);
    }

    const buttonRow = new ActionRowBuilder<MessageActionRowComponentBuilder>().setComponents(
      new ButtonBuilder()
        .setCustomId("NI_economy:remove_role")
        .setLabel(t(client, lang, "commands.economy.buttons.remove_role"))
        .setStyle(ButtonStyle.Danger)
        .setDisabled(settings.shop.roles.length === 0),
      new ButtonBuilder()
        .setCustomId("NI_economy:back")
        .setLabel(t(client, lang, "commands.economy.buttons.back"))
        .setStyle(ButtonStyle.Secondary),
    );
    components.push(roleSelectRow, buttonRow);
  } else if (view === "shop_manage" && selectedRoleId) {
    const role = settings.shop.roles.find((r) => r.role === selectedRoleId);
    const hasDiscount = role && role.discount.amount > 0;

    const buttonRow = new ActionRowBuilder<MessageActionRowComponentBuilder>().setComponents(
      new ButtonBuilder()
        .setCustomId("NI_economy:set_discount")
        .setLabel(t(client, lang, "commands.economy.buttons.set_discount"))
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId("NI_economy:remove_discount")
        .setLabel(t(client, lang, "commands.economy.buttons.remove_discount"))
        .setStyle(ButtonStyle.Danger)
        .setDisabled(!hasDiscount),
      new ButtonBuilder()
        .setCustomId("NI_economy:back")
        .setLabel(t(client, lang, "commands.economy.buttons.back"))
        .setStyle(ButtonStyle.Secondary),
    );
    components.push(buttonRow);
  } else if (view === "income") {
    const menuRow = new ActionRowBuilder<MessageActionRowComponentBuilder>().setComponents(
      new StringSelectMenuBuilder()
        .setCustomId("NI_economy:income_menu")
        .setPlaceholder(t(client, lang, "commands.economy.select_menus.income.placeholder"))
        .setOptions(
          new StringSelectMenuOptionBuilder()
            .setLabel(t(client, lang, "commands.economy.select_menus.income.options.work.label"))
            .setDescription(
              t(client, lang, "commands.economy.select_menus.income.options.work.description"),
            )
            .setValue("work"),
          new StringSelectMenuOptionBuilder()
            .setLabel(t(client, lang, "commands.economy.select_menus.income.options.timely.label"))
            .setDescription(
              t(client, lang, "commands.economy.select_menus.income.options.timely.description"),
            )
            .setValue("timely"),
          new StringSelectMenuOptionBuilder()
            .setLabel(t(client, lang, "commands.economy.select_menus.income.options.daily.label"))
            .setDescription(
              t(client, lang, "commands.economy.select_menus.income.options.daily.description"),
            )
            .setValue("daily"),
          new StringSelectMenuOptionBuilder()
            .setLabel(t(client, lang, "commands.economy.select_menus.income.options.weekly.label"))
            .setDescription(
              t(client, lang, "commands.economy.select_menus.income.options.weekly.description"),
            )
            .setValue("weekly"),
          new StringSelectMenuOptionBuilder()
            .setLabel(
              t(client, lang, "commands.economy.select_menus.income.options.level_up.label"),
            )
            .setDescription(
              t(client, lang, "commands.economy.select_menus.income.options.level_up.description"),
            )
            .setValue("level_up"),
          new StringSelectMenuOptionBuilder()
            .setLabel(t(client, lang, "commands.economy.select_menus.income.options.bump.label"))
            .setDescription(
              t(client, lang, "commands.economy.select_menus.income.options.bump.description"),
            )
            .setValue("bump"),
          new StringSelectMenuOptionBuilder()
            .setLabel(t(client, lang, "commands.economy.select_menus.income.options.rob.label"))
            .setDescription(
              t(client, lang, "commands.economy.select_menus.income.options.rob.description"),
            )
            .setValue("rob"),
        ),
    );
    const buttonRow = new ActionRowBuilder<MessageActionRowComponentBuilder>().setComponents(
      new ButtonBuilder()
        .setCustomId("NI_economy:back")
        .setLabel(t(client, lang, "commands.economy.buttons.back"))
        .setStyle(ButtonStyle.Secondary),
    );
    components.push(menuRow, buttonRow);
  } else if (view === "work") {
    const buttonRow = new ActionRowBuilder<MessageActionRowComponentBuilder>().setComponents(
      new ButtonBuilder()
        .setCustomId("NI_economy:toggle_work")
        .setLabel(
          settings.income.work.enabled
            ? t(client, lang, "commands.economy.buttons.disable")
            : t(client, lang, "commands.economy.buttons.enable"),
        )
        .setStyle(settings.income.work.enabled ? ButtonStyle.Danger : ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId("NI_economy:edit_work")
        .setLabel(t(client, lang, "commands.economy.buttons.edit"))
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId("NI_economy:back")
        .setLabel(t(client, lang, "commands.economy.buttons.back"))
        .setStyle(ButtonStyle.Secondary),
    );
    components.push(buttonRow);
  } else if (
    view === "timely" ||
    view === "daily" ||
    view === "weekly" ||
    view === "level_up" ||
    view === "bump"
  ) {
    const incomeData = settings.income[view];
    const buttonRow = new ActionRowBuilder<MessageActionRowComponentBuilder>().setComponents(
      new ButtonBuilder()
        .setCustomId(`NI_economy:toggle_${view}`)
        .setLabel(
          incomeData.enabled
            ? t(client, lang, "commands.economy.buttons.disable")
            : t(client, lang, "commands.economy.buttons.enable"),
        )
        .setStyle(incomeData.enabled ? ButtonStyle.Danger : ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId(`NI_economy:edit_amount_${view}`)
        .setLabel(t(client, lang, "commands.economy.buttons.edit"))
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId("NI_economy:back")
        .setLabel(t(client, lang, "commands.economy.buttons.back"))
        .setStyle(ButtonStyle.Secondary),
    );
    components.push(buttonRow);
  } else if (view === "rob") {
    const buttonRow1 = new ActionRowBuilder<MessageActionRowComponentBuilder>().setComponents(
      new ButtonBuilder()
        .setCustomId("NI_economy:toggle_rob")
        .setLabel(
          settings.income.rob.enabled
            ? t(client, lang, "commands.economy.buttons.disable")
            : t(client, lang, "commands.economy.buttons.enable"),
        )
        .setStyle(settings.income.rob.enabled ? ButtonStyle.Danger : ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId("NI_economy:edit_rob_cooldown")
        .setLabel("Cooldown")
        .setStyle(ButtonStyle.Primary),
    );
    const buttonRow2 = new ActionRowBuilder<MessageActionRowComponentBuilder>().setComponents(
      new ButtonBuilder()
        .setCustomId("NI_economy:edit_rob_income")
        .setLabel("Income")
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId("NI_economy:edit_rob_punishment")
        .setLabel("Punishment")
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId("NI_economy:back")
        .setLabel(t(client, lang, "commands.economy.buttons.back"))
        .setStyle(ButtonStyle.Secondary),
    );
    components.push(buttonRow1, buttonRow2);
  }

  return components;
}

const mostUsedQueries = {
  getEconomySettings: async (guild: Guild) => {
    return await guild.get("economy");
  },
  setCurrency: async (guild: Guild, emoji: string | null, id: string | null) => {
    return await guild.set("economy.currency", { emoji, id });
  },
  setShopRoles: async (guild: Guild, roles: EconomySettings["shop"]["roles"]) => {
    return await guild.set("economy.shop.roles", roles);
  },
  setIncomeEnabled: async (guild: Guild, type: IncomeType, enabled: boolean) => {
    return await guild.set(`economy.income.${type}.enabled`, enabled);
  },
  setWorkSettings: async (guild: Guild, cooldown: number, min: number, max: number) => {
    await guild.set("economy.income.work.cooldown", cooldown);
    await guild.set("economy.income.work.min", min);
    await guild.set("economy.income.work.max", max);
    return;
  },
  setIncomeAmount: async (
    guild: Guild,
    type: "timely" | "daily" | "weekly" | "level_up" | "bump",
    amount: number,
  ) => {
    return await guild.set(`economy.income.${type}.amount`, amount);
  },
};

// Helper function to format role with discount
function formatRoleWithDiscount(
  client: Client,
  lang: string,
  role: EconomySettings["shop"]["roles"][0],
  settings: EconomySettings,
): string {
  const now = Date.now();
  const hasDiscount = role.discount.amount > 0;
  const isActive =
    hasDiscount &&
    (!role.discount.starts_at || role.discount.starts_at <= now) &&
    (!role.discount.expires_at || role.discount.expires_at > now);

  if (!hasDiscount) {
    return t(
      client,
      lang,
      "commands.economy.embeds.shop.fields.roles.format",
      `<@&${role.role}>`,
      role.price.toString(),
      settings.currency.emoji || client.holder.emojis.discord.gems,
    );
  }

  const discountedPrice = Math.floor(role.price * (1 - role.discount.amount / 100));

  if (isActive) {
    return t(
      client,
      lang,
      "commands.economy.embeds.shop.fields.roles.discount_format",
      `<@&${role.role}>`,
      role.price.toString(),
      discountedPrice.toString(),
      settings.currency.emoji || client.holder.emojis.discord.gems,
      role.discount.amount.toString(),
    );
  }

  // Has discount but not active yet or expired
  return t(
    client,
    lang,
    "commands.economy.embeds.shop.fields.roles.format",
    `<@&${role.role}>`,
    role.price.toString(),
  );
}

// Helper function to get discount status text
function getDiscountStatus(
  client: Client,
  lang: string,
  role: EconomySettings["shop"]["roles"][0],
): string {
  const now = Date.now();

  if (role.discount.amount === 0) {
    return "";
  }

  if (role.discount.starts_at && role.discount.starts_at > now) {
    return t(
      client,
      lang,
      "commands.economy.embeds.shop.fields.roles.discount_scheduled",
      `<t:${Math.floor(role.discount.starts_at / 1000)}:R>`,
    );
  }

  if (role.discount.expires_at && role.discount.expires_at <= now) {
    return t(client, lang, "commands.economy.embeds.shop.fields.roles.discount_expired");
  }

  return t(client, lang, "commands.economy.embeds.shop.fields.roles.discount_active");
}
