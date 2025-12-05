import { SelectMenu, FindTeamGame, IModalField } from "../../types/helpers";
import { Guild } from "../../helpers";
import {
  GuildMember,
  StringSelectMenuInteraction,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
  ModalActionRowComponentBuilder,
  MessageFlags,
  EmbedBuilder,
  TextChannel,
  ButtonBuilder,
  ButtonStyle,
  MessageActionRowComponentBuilder,
} from "discord.js";
import { t } from "../../i18n/helpers";

module.exports = {
  customId: "I_find_team:select",
  options: {
    public: true,
  },
  run: async (client, interaction: StringSelectMenuInteraction) => {
    if (!interaction.guild) return;
    if (!(interaction.member instanceof GuildMember)) return;

    const guild = new Guild(client, interaction.guild);
    const lang = await guild.get("settings.language");

    const settings = await guild.get("utils.find_team");

    if (!settings.enabled) {
      return await interaction.reply({
        content: "This feature is currently disabled.",
        flags: MessageFlags.Ephemeral,
      });
    }

    const gameId = interaction.values[0];
    const game = settings.games.find((g: FindTeamGame) => g.id === gameId);

    if (!game) {
      return await interaction.reply({
        content: "Game not found.",
        flags: MessageFlags.Ephemeral,
      });
    }

    // Build the modal with game's custom fields
    const modal = new ModalBuilder()
      .setTitle(game.modal.title)
      .setCustomId(`NI_find_team:modal:${gameId}`);

    if (game.modal.fields.length > 0) {
      game.modal.fields.forEach((field: IModalField) => {
        const textInput = new TextInputBuilder()
          .setCustomId(`field_${field.id}`)
          .setLabel(field.name)
          .setStyle(field.type === "long" ? TextInputStyle.Paragraph : TextInputStyle.Short)
          .setRequired(field.required);

        if (field.placeholder) textInput.setPlaceholder(field.placeholder);
        if (field.min && field.min > 0) textInput.setMinLength(field.min);
        if (field.max && field.max > 0) textInput.setMaxLength(field.max);

        modal.addComponents(
          new ActionRowBuilder<ModalActionRowComponentBuilder>().addComponents(textInput),
        );
      });
    } else {
      // Add a default field if no custom fields are configured
      modal.addComponents(
        new ActionRowBuilder<ModalActionRowComponentBuilder>().addComponents(
          new TextInputBuilder()
            .setCustomId("field_default")
            .setLabel("Description")
            .setStyle(TextInputStyle.Paragraph)
            .setPlaceholder("Describe what you're looking for...")
            .setRequired(true)
            .setMinLength(10)
            .setMaxLength(1000),
        ),
      );
    }

    await interaction.showModal(modal);

    try {
      const modalSubmit = await interaction.awaitModalSubmit({
        time: 10 * 60 * 1000, // 10 minutes
        filter: (i) =>
          i.user.id === interaction.user.id && i.customId === `NI_find_team:modal:${gameId}`,
      });

      if (!settings.send_channel) {
        return await modalSubmit.reply({
          content: "Results channel is not configured.",
          flags: MessageFlags.Ephemeral,
        });
      }

      const sendChannel = interaction.guild.channels.cache.get(
        settings.send_channel,
      ) as TextChannel;
      if (!sendChannel) {
        return await modalSubmit.reply({
          content: "Results channel not found.",
          flags: MessageFlags.Ephemeral,
        });
      }

      // Build the result embed
      const resultEmbed = new EmbedBuilder()
        .setTitle(t(client, lang, "commands.games.embeds.find_team_result.default_title"))
        .setColor(client.holder.colors.default)
        .setTimestamp()
        .setAuthor({
          name: interaction.user.username,
          iconURL: interaction.user.displayAvatarURL(),
        });

      // Add organizer field
      resultEmbed.addFields({
        name: t(client, lang, "commands.games.embeds.find_team_result.fields.organizer"),
        value: `<@${interaction.user.id}>`,
        inline: true,
      });

      // Add voice channel field if user is in voice
      const voiceChannel = interaction.member.voice.channel;
      if (voiceChannel) {
        resultEmbed.addFields({
          name: t(client, lang, "commands.games.embeds.find_team_result.fields.voice_channel"),
          value: `<#${voiceChannel.id}>`,
          inline: true,
        });
      }

      // Add custom fields from modal
      if (game.modal.fields.length > 0) {
        game.modal.fields.forEach((field: IModalField) => {
          const value = modalSubmit.fields.getTextInputValue(`field_${field.id}`);
          if (value) {
            resultEmbed.addFields({
              name: field.name,
              value: value,
              inline: false,
            });
          }
        });
      } else {
        const defaultValue = modalSubmit.fields.getTextInputValue("field_default");
        if (defaultValue) {
          resultEmbed.addFields({
            name: "Description",
            value: defaultValue,
            inline: false,
          });
        }
      }

      // Add game emoji to footer
      if (game.emoji) {
        resultEmbed.setFooter({
          text: `${game.emoji} ${game.name}`,
        });
      } else {
        resultEmbed.setFooter({
          text: `🎮 ${game.name}`,
        });
      }

      // Build components - add Join Voice button if user is in voice channel
      const components: ActionRowBuilder<MessageActionRowComponentBuilder>[] = [];

      if (voiceChannel) {
        const inviteUrl = `https://discord.com/channels/${interaction.guild.id}/${voiceChannel.id}`;
        components.push(
          new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(
            new ButtonBuilder()
              .setLabel(t(client, lang, "commands.games.buttons.join"))
              .setStyle(ButtonStyle.Link)
              .setURL(inviteUrl)
              .setEmoji("🔊"),
          ),
        );
      }

      // Build message content with role ping if configured
      let content: string | undefined;
      if (game.role) {
        content = `<@&${game.role}>`;
      }

      await sendChannel.send({
        content,
        embeds: [resultEmbed],
        components,
      });

      await modalSubmit.reply({
        content: `✅ Your request has been posted in <#${settings.send_channel}>!`,
        flags: MessageFlags.Ephemeral,
      });
    } catch (error) {
      // Modal timed out or was dismissed - no action needed
    }
  },
} as SelectMenu;
