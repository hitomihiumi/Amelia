import { SlashCommand } from "../../types/helpers";
import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelSelectMenuBuilder,
  ChannelType,
  Client,
  CommandInteraction,
  LabelBuilder,
  MessageFlagsBitField,
  ModalBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  TextInputBuilder,
  TextInputStyle,
} from "discord.js";
import { defaultPermissions, Guild } from "../../helpers";
import { t } from "../../i18n/helpers";
import {
  AI_MODEL_CHOICES,
  AI_PERSONA_MAX_LENGTH,
  type AiLimits,
  type AiModelChoice,
  type AiSettings,
  clampLimits,
  isPremiumActive,
  limitBounds,
  type PremiumSettings,
} from "../../types/helpers";
import { getAiConfig, getPremium, isAiConfigured, loadAiSettings } from "../../helpers/ai";

const CHANNEL_TYPES = [
  ChannelType.GuildText,
  ChannelType.GuildAnnouncement,
  ChannelType.GuildForum,
];

const LIMIT_FIELDS = ["user_per_minute", "user_per_day", "guild_per_day"] as const;

function channelList(client: Client, lang: string, ids: string[]): string {
  return ids.length > 0
    ? ids.map((id) => `<#${id}>`).join(" ")
    : t(client, lang, "ai.setting.none");
}

/** Who the AI is unlocked for, and until when. */
function premiumLine(client: Client, lang: string, premium: PremiumSettings): string {
  return premium.until
    ? t(
        client,
        lang,
        "ai.setting.premium_until",
        `<t:${Math.floor(new Date(premium.until).getTime() / 1000)}:D>`,
      )
    : t(client, lang, "ai.setting.premium_forever");
}

/** What a server without premium sees instead of the settings. */
function buildLockedEmbed(client: Client, lang: string) {
  return client.holder.utils.fastEmbed({
    title: t(client, lang, "ai.setting.title"),
    description: `${t(client, lang, "ai.setting.description")}\n\n${t(client, lang, "ai.premium_required")}`,
  });
}

function buildEmbed(client: Client, lang: string, settings: AiSettings, premium: PremiumSettings) {
  const warning = isAiConfigured() ? "" : `\n\n${t(client, lang, "ai.setting.warning_no_key")}`;

  return client.holder.utils.fastEmbed({
    title: t(client, lang, "ai.setting.title"),
    description: `${t(client, lang, "ai.setting.description")}\n\n> ${t(client, lang, "ai.setting.privacy")}${warning}`,
    fields: [
      {
        name: t(client, lang, "ai.setting.fields.status"),
        value: `${
          settings.enabled
            ? t(client, lang, "ai.setting.enabled")
            : t(client, lang, "ai.setting.disabled")
        }\n${premiumLine(client, lang, premium)}`,
        inline: true,
      },
      {
        name: t(client, lang, "ai.setting.fields.model"),
        value: t(client, lang, `ai.setting.models.${settings.model}`),
        inline: true,
      },
      {
        name: t(client, lang, "ai.setting.fields.limits"),
        value: t(
          client,
          lang,
          "ai.setting.limits_format",
          settings.limits.user_per_minute,
          settings.limits.user_per_day,
          settings.limits.guild_per_day,
        ),
      },
      {
        name: t(client, lang, "ai.setting.fields.channels"),
        value: channelList(client, lang, settings.channels),
      },
      {
        name: t(client, lang, "ai.setting.fields.ignored"),
        value: channelList(client, lang, settings.ignore_channels),
      },
      {
        name: t(client, lang, "ai.setting.fields.persona"),
        value: settings.persona
          ? `>>> ${settings.persona.slice(0, 500)}${settings.persona.length > 500 ? "…" : ""}`
          : t(client, lang, "ai.setting.persona_default"),
      },
    ],
  });
}

function buildComponents(client: Client, lang: string, settings: AiSettings, guild: Guild) {
  const known = (ids: string[]) => ids.filter((id) => guild.guild.channels.cache.has(id));

  const buttons = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId("NI_ai:toggle")
      .setStyle(settings.enabled ? ButtonStyle.Danger : ButtonStyle.Success)
      .setLabel(
        t(
          client,
          lang,
          settings.enabled ? "ai.setting.buttons.disable" : "ai.setting.buttons.enable",
        ),
      ),
    new ButtonBuilder()
      .setCustomId("NI_ai:persona")
      .setStyle(ButtonStyle.Secondary)
      .setLabel(t(client, lang, "ai.setting.buttons.persona")),
    new ButtonBuilder()
      .setCustomId("NI_ai:limits")
      .setStyle(ButtonStyle.Secondary)
      .setLabel(t(client, lang, "ai.setting.buttons.limits")),
  );

  const model = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId("NI_ai:model")
      .setPlaceholder(t(client, lang, "ai.setting.select_menus.model.placeholder"))
      .addOptions(
        AI_MODEL_CHOICES.map((choice) =>
          new StringSelectMenuOptionBuilder()
            .setValue(choice)
            .setLabel(t(client, lang, `ai.setting.select_menus.model.options.${choice}.label`))
            .setDescription(
              t(client, lang, `ai.setting.select_menus.model.options.${choice}.description`),
            )
            .setDefault(choice === settings.model),
        ),
      ),
  );

  const channelMenu = (id: string, placeholder: string, selected: string[]) => {
    const menu = new ChannelSelectMenuBuilder()
      .setCustomId(id)
      .setPlaceholder(placeholder)
      .setChannelTypes(CHANNEL_TYPES)
      .setMinValues(0)
      .setMaxValues(25);
    if (selected.length > 0) menu.setDefaultChannels(selected);
    return new ActionRowBuilder<ChannelSelectMenuBuilder>().addComponents(menu);
  };

  return [
    buttons,
    model,
    channelMenu(
      "NI_ai:channels",
      t(client, lang, "ai.setting.select_menus.channels.placeholder"),
      known(settings.channels),
    ),
    channelMenu(
      "NI_ai:ignored",
      t(client, lang, "ai.setting.select_menus.ignored.placeholder"),
      known(settings.ignore_channels),
    ),
  ];
}

function boundsText(bounds: ReturnType<typeof limitBounds>): string {
  return LIMIT_FIELDS.map((field) => `${bounds[field].min}–${bounds[field].max}`).join(", ");
}

module.exports = {
  name: "ai",
  description: "🤖 Setting up the AI chat on the server.",
  cooldown: 5,
  locale: {
    ru: "🤖 Настройка чата с ИИ на сервере.",
    uk: "🤖 Налаштування чату зі ШІ на сервері.",
  },
  options: [],
  permissions: {
    bot: [...defaultPermissions],
  },
  run: async (client: Client, interaction: CommandInteraction) => {
    if (!interaction.guild) return;

    await interaction.deferReply({ flags: MessageFlagsBitField.Flags.Ephemeral });

    const guild = new Guild(client, interaction.guild);
    const lang = (await guild.get("settings.language")) as string;

    // The AI chat is a premium feature, handed out by the bot's administrators.
    const premium = await getPremium(interaction.guild.id);
    if (!isPremiumActive(premium)) {
      await interaction.editReply({ embeds: [buildLockedEmbed(client, lang)] });
      return;
    }

    let settings = await loadAiSettings(guild);
    let caps = (await getAiConfig()).caps;

    // The server sees the limits that really apply, under the administrators' ceilings.
    const render = () => ({
      embeds: [
        buildEmbed(
          client,
          lang,
          { ...settings, limits: clampLimits(settings.limits, caps) },
          premium,
        ),
      ],
      components: buildComponents(client, lang, settings, guild),
    });

    const msg = await interaction.editReply(render());

    const collector = msg.createMessageComponentCollector({
      filter: (i) => i.user.id === interaction.user.id,
      time: 600000,
    });

    collector.on("collect", async (i) => {
      if (i.isButton()) {
        if (i.customId === "NI_ai:toggle") {
          settings.enabled = !settings.enabled;
          await guild.set("ai.enabled", settings.enabled);
          return i.update(render());
        }

        if (i.customId === "NI_ai:persona") {
          const input = new TextInputBuilder()
            .setCustomId("NI_ai:persona_text")
            .setStyle(TextInputStyle.Paragraph)
            .setRequired(false)
            .setMaxLength(AI_PERSONA_MAX_LENGTH)
            .setPlaceholder(t(client, lang, "ai.setting.modals.persona.placeholder").slice(0, 100));
          if (settings.persona) input.setValue(settings.persona);

          await i.showModal(
            new ModalBuilder()
              .setTitle(t(client, lang, "ai.setting.modals.persona.title"))
              .setCustomId("NI_ai:persona_modal")
              .setLabelComponents(
                new LabelBuilder()
                  .setLabel(t(client, lang, "ai.setting.modals.persona.label"))
                  .setTextInputComponent(input),
              ),
          );

          const submitted = await i
            .awaitModalSubmit({
              time: 5 * 60 * 1000,
              filter: (m) =>
                m.user.id === interaction.user.id && m.customId === "NI_ai:persona_modal",
            })
            .catch(() => null);
          if (!submitted) return;

          const text = submitted.fields.getTextInputValue("NI_ai:persona_text").trim();
          settings.persona = text || null;
          await guild.set("ai.persona", settings.persona);

          await submitted.deferUpdate();
          await submitted.editReply(render());
          return submitted.followUp({
            content: t(
              client,
              lang,
              text ? "ai.setting.messages.persona_saved" : "ai.setting.messages.persona_reset",
            ),
            flags: MessageFlagsBitField.Flags.Ephemeral,
          });
        }

        if (i.customId === "NI_ai:limits") {
          caps = (await getAiConfig()).caps;
          const bounds = limitBounds(caps);
          const current = clampLimits(settings.limits, caps);

          const modal = new ModalBuilder()
            .setTitle(t(client, lang, "ai.setting.modals.limits.title"))
            .setCustomId("NI_ai:limits_modal");

          for (const field of LIMIT_FIELDS) {
            modal.addLabelComponents(
              new LabelBuilder()
                .setLabel(t(client, lang, `ai.setting.modals.limits.${field}`))
                .setTextInputComponent(
                  new TextInputBuilder()
                    .setCustomId(`NI_ai:${field}`)
                    .setStyle(TextInputStyle.Short)
                    .setRequired(true)
                    .setMinLength(1)
                    .setMaxLength(4)
                    .setValue(String(current[field])),
                ),
            );
          }

          await i.showModal(modal);

          const submitted = await i
            .awaitModalSubmit({
              time: 5 * 60 * 1000,
              filter: (m) =>
                m.user.id === interaction.user.id && m.customId === "NI_ai:limits_modal",
            })
            .catch(() => null);
          if (!submitted) return;

          const limits = {} as AiLimits;
          let valid = true;
          for (const field of LIMIT_FIELDS) {
            const raw = submitted.fields.getTextInputValue(`NI_ai:${field}`).trim();
            const value = /^\d+$/.test(raw) ? Number.parseInt(raw, 10) : Number.NaN;
            const { min, max } = bounds[field];
            if (!(value >= min && value <= max)) valid = false;
            limits[field] = value;
          }

          await submitted.deferUpdate();

          if (!valid) {
            return submitted.followUp({
              content: t(client, lang, "ai.setting.messages.limits_invalid", boundsText(bounds)),
              flags: MessageFlagsBitField.Flags.Ephemeral,
            });
          }

          settings.limits = limits;
          await guild.set("ai.limits", limits);

          await submitted.editReply(render());
          return submitted.followUp({
            content: t(client, lang, "ai.setting.messages.limits_saved"),
            flags: MessageFlagsBitField.Flags.Ephemeral,
          });
        }
      } else if (i.isStringSelectMenu() && i.customId === "NI_ai:model") {
        const choice = i.values[0] as AiModelChoice;
        if (!AI_MODEL_CHOICES.includes(choice)) return i.deferUpdate();

        settings.model = choice;
        await guild.set("ai.model", choice);
        return i.update(render());
      } else if (i.isChannelSelectMenu()) {
        if (i.customId === "NI_ai:channels") {
          settings.channels = i.values;
          await guild.set("ai.channels", i.values);
          return i.update(render());
        }

        if (i.customId === "NI_ai:ignored") {
          settings.ignore_channels = i.values;
          await guild.set("ai.ignore_channels", i.values);
          return i.update(render());
        }
      }
    });
  },
} as SlashCommand;
