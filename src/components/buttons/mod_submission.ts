import { Button } from "../../types/helpers";
import {
  ButtonInteraction,
  Client,
  GuildMember,
  LabelBuilder,
  MessageFlagsBitField,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
} from "discord.js";
import { Guild } from "../../helpers";
import { ModerationService, isModerator } from "../../helpers/moderation";
import { t } from "../../i18n/helpers";

/**
 * Buttons under a report/appeal posted in the moderation channel.
 * The custom id carries the submission: `I_mod:sub|<submissionId>|<action>`.
 */
module.exports = {
  customId: "I_mod:sub",
  run: async (client: Client, interaction: ButtonInteraction) => {
    if (!interaction.guild || !(interaction.member instanceof GuildMember)) return;

    const guild = new Guild(client, interaction.guild);
    const lang = await guild.get("settings.language");

    if (!(await isModerator(guild, interaction.member))) {
      return interaction.reply({
        embeds: [
          client.holder.embed.error(lang, t(client, lang, "moderation.errors.no_permission")),
        ],
        flags: MessageFlagsBitField.Flags.Ephemeral,
      });
    }

    const [, submissionId, action] = interaction.customId.split("|");

    if (!submissionId || !action) return;

    if (action === "claim") {
      const service = new ModerationService(client, interaction.guild);
      const result = await service.resolveSubmission(
        submissionId,
        "in_review",
        interaction.user.id,
        null,
      );

      return interaction.reply({
        embeds: [
          result.ok
            ? client.holder.embed.success(
                lang,
                t(client, lang, "moderation.submission.claimed", interaction.user.toString()),
              )
            : client.holder.embed.error(lang, result.error),
        ],
        flags: MessageFlagsBitField.Flags.Ephemeral,
      });
    }

    if (action !== "approve" && action !== "reject") return;

    const modal = new ModalBuilder()
      .setCustomId(`I_mod:sub_resolve|${submissionId}|${action}`)
      .setTitle(
        t(
          client,
          lang,
          action === "approve"
            ? "moderation.submission.modal.approve_title"
            : "moderation.submission.modal.reject_title",
        ),
      )
      .setLabelComponents(
        new LabelBuilder()
          .setLabel(t(client, lang, "moderation.submission.modal.response_label"))
          .setTextInputComponent(
            new TextInputBuilder()
              .setCustomId("response")
              .setStyle(TextInputStyle.Paragraph)
              .setRequired(false)
              .setMaxLength(1000)
              .setPlaceholder(
                t(client, lang, "moderation.submission.modal.response_placeholder").slice(0, 100),
              ),
          ),
      );

    await interaction.showModal(modal);
  },
} as Button;
