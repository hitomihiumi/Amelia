import { Button } from "../../types/helpers";
import {
  ButtonInteraction,
  Client,
  GuildMember,
  MessageFlagsBitField,
  PermissionFlagsBits,
} from "discord.js";
import { Guild } from "../../helpers";
import {
  applyPlan,
  claimPlan,
  hasAiAccess,
  loadAiSettings,
  outcomeEmbed,
  PLAN_BUTTON_ID,
  readPlan,
  remember,
  userTurn,
} from "../../helpers/ai";
import { t } from "../../i18n/helpers";

/**
 * The buttons under something the AI prepared for an administrator (`helpers/ai/tools/plan.ts`).
 * The custom id carries the plan: `I_ai:plan|<planId>|apply` or `…|cancel`.
 *
 * Only the administrator the plan was made for can press them, and they still have to be an
 * administrator when they do. A plan runs once: whoever claims it first gets it.
 */
module.exports = {
  customId: PLAN_BUTTON_ID,
  run: async (client: Client, interaction: ButtonInteraction) => {
    if (!interaction.guild || !(interaction.member instanceof GuildMember)) return;

    const guild = new Guild(client, interaction.guild);
    const lang = (await guild.get("settings.language")) as string;
    const [, planId, action] = interaction.customId.split("|");

    const tell = (text: string) =>
      interaction.reply({ content: text, flags: MessageFlagsBitField.Flags.Ephemeral });

    /** What the confirmation said, without the hint about the button under it. */
    const shownLines = () =>
      (interaction.message.embeds[0]?.description ?? "")
        .split("\n")
        .filter((line) => line.trim() && !line.startsWith("-# "));

    const expire = async () => {
      await interaction.update({
        embeds: [outcomeEmbed(client, lang, "expired", shownLines())],
        components: [],
      });
      await interaction.followUp({
        content: t(client, lang, "ai.actions.expired"),
        flags: MessageFlagsBitField.Flags.Ephemeral,
      });
    };

    const plan = planId ? await readPlan(planId) : null;
    if (!plan || plan.guildId !== interaction.guild.id) return expire();

    if (interaction.user.id !== plan.userId) {
      return tell(t(client, lang, "ai.actions.not_yours", `<@${plan.userId}>`));
    }

    if (action === "cancel") {
      await claimPlan(planId);
      return interaction.update({
        embeds: [outcomeEmbed(client, lang, "cancelled", shownLines())],
        components: [],
      });
    }

    // The same conditions as when the plan was made: they may have changed in the minutes between.
    if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
      return tell(t(client, lang, "ai.actions.no_permission"));
    }
    if (!(await hasAiAccess(interaction.guild.id))) {
      return tell(t(client, lang, "ai.premium_required"));
    }
    const settings = await loadAiSettings(guild);
    if (!settings.options.actions) return tell(t(client, lang, "ai.actions.switched_off"));

    if (!(await claimPlan(planId))) return expire();

    await interaction.deferUpdate();

    const results = await applyPlan(
      {
        client,
        discordGuild: interaction.guild,
        guild,
        member: interaction.member,
        channelId: plan.channelId,
        lang,
      },
      plan,
    );

    const failed = results.filter((result) => !result.ok).length;
    const state = failed === 0 ? "applied" : failed === results.length ? "failed" : "partial";
    const lines = results.map((result) => result.line);

    await interaction
      .editReply({ embeds: [outcomeEmbed(client, lang, state, lines)], components: [] })
      .catch(() => null);

    // The conversation goes on knowing how it ended, so "now undo that" has something to refer to.
    if (settings.options.short_term) {
      await remember(
        plan.channelId,
        userTurn(interaction.member.displayName, "(pressed Apply)", interaction.user.id),
        `[the queued changes were confirmed and ran: ${lines.join("; ")}]`,
      ).catch(() => null);
    }
  },
} as Button;
