import { Modal } from "../../types/helpers";
import { Client, GuildMember, MessageFlagsBitField, ModalSubmitInteraction } from "discord.js";
import { Guild } from "../../helpers";
import { ModerationService, isModerator } from "../../helpers/moderation";
import { t } from "../../i18n/helpers";

/**
 * Response modal shown after pressing Approve/Reject on a submission.
 * Custom id: `I_mod:sub_resolve|<submissionId>|<approve|reject>`.
 */
module.exports = {
  customId: "I_mod:sub_resolve",
  run: async (client: Client, interaction: ModalSubmitInteraction) => {
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
    if (!submissionId || (action !== "approve" && action !== "reject")) return;

    await interaction.deferReply({ flags: MessageFlagsBitField.Flags.Ephemeral });

    const response = interaction.fields.getTextInputValue("response")?.trim() || null;
    const service = new ModerationService(client, interaction.guild);

    const result = await service.resolveSubmission(
      submissionId,
      action === "approve" ? "approved" : "rejected",
      interaction.user.id,
      response,
    );

    await interaction.editReply({
      embeds: [
        result.ok
          ? client.holder.embed.success(
              lang,
              t(
                client,
                lang,
                `moderation.submission.statuses.${action === "approve" ? "approved" : "rejected"}`,
              ),
            )
          : client.holder.embed.error(lang, result.error),
      ],
    });
  },
} as Modal;
