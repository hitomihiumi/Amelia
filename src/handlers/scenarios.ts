import {
  Client,
  ButtonInteraction,
  StringSelectMenuInteraction,
  ModalSubmitInteraction,
  Interaction,
  MessageFlagsBitField,
} from "discord.js";
import { Guild } from "../helpers";
import { ScenarioRunner } from "../helpers";
import { ScenarioRunOptions, ScenarioRunResult } from "../helpers/custom/ScenarioRunner";
import { findContinuation } from "../helpers/custom/scenarioFlow";
import { ScenarioCustom } from "../types/helpers";
import { t } from "../i18n/helpers";

type ScenarioInteraction = ButtonInteraction | StringSelectMenuInteraction | ModalSubmitInteraction;

/**
 * Make sure the interaction is answered. Discord shows its generic "Something went wrong" when a
 * scenario ends without a reply (a roles-only scenario, a step that failed on its own...).
 */
async function ensureAnswered(interaction: ScenarioInteraction, failure?: string): Promise<void> {
  if (interaction.replied || interaction.deferred) return;

  try {
    if (failure) {
      await interaction.reply({
        content: `❌ ${failure}`,
        flags: MessageFlagsBitField.Flags.Ephemeral,
      });
    } else if (
      interaction.isButton() ||
      interaction.isStringSelectMenu() ||
      (interaction.isModalSubmit() && interaction.isFromMessage())
    ) {
      await interaction.deferUpdate();
    } else {
      // A modal opened from a command has no message to update: answer and take the answer back
      await interaction.deferReply({ flags: MessageFlagsBitField.Flags.Ephemeral });
      await interaction.deleteReply();
    }
  } catch (error) {
    console.warn("[ScenarioHandler] Could not acknowledge the interaction:", error);
  }
}

/** Run a scenario and always leave the interaction answered, whatever the outcome. */
async function runScenario(
  client: Client,
  interaction: ScenarioInteraction,
  scenario: ScenarioCustom,
  guild: Guild,
  options?: ScenarioRunOptions,
): Promise<void> {
  let result: ScenarioRunResult;
  try {
    result = await ScenarioRunner.run(client, interaction, scenario, guild, options);
  } catch (error: any) {
    console.error(
      `[ScenarioHandler] Scenario "${scenario.name}" (${scenario.id}) crashed on "${interaction.customId}":`,
      error,
    );
    result = { success: false, error: "Something went wrong while running this scenario" };
  }

  if (!result.success && result.error) {
    console.warn(
      `[ScenarioHandler] Scenario "${scenario.name}" (${scenario.id}) stopped on "${interaction.customId}": ${result.error}`,
    );
  }

  await ensureAnswered(interaction, result.success ? result.softError : result.error);
}

/**
 * Handle scenario interactions
 * Returns true if a scenario was executed or handled, false otherwise
 */
export async function handleScenarioInteraction(
  client: Client,
  interaction: Interaction,
): Promise<boolean> {
  // Only handle button, select menu, and modal interactions
  if (
    !interaction.isButton() &&
    !interaction.isStringSelectMenu() &&
    !interaction.isModalSubmit()
  ) {
    return false;
  }

  // Skip interactions with internal prefixes (NI_ = Not Intercepted, I_ = Intercepted but handled)
  if (interaction.customId.startsWith("NI_")) {
    return false;
  }

  // Ensure we're in a guild
  if (!interaction.guild) {
    return false;
  }

  try {
    const guild = new Guild(client, interaction.guild);
    const lang = (await guild.get("settings.language")) || "en";
    const scenarios = await guild.get("utils.components.scenarios");

    // Determine trigger type
    let triggerType: "button" | "select_menu" | "modal_submit";
    if (interaction.isButton()) {
      triggerType = "button";
    } else if (interaction.isStringSelectMenu()) {
      triggerType = "select_menu";
    } else {
      triggerType = "modal_submit";
    }

    const typedInteraction = interaction as ScenarioInteraction;

    // An answer to a step that showed this component (the modal of a Show Modal step, a button or
    // select menu of a message step) continues that scenario from the step it is wired to
    const hasContinuations = scenarios?.some((s) => s.steps?.some((st) => st.onInteraction));
    const continuation = hasContinuations
      ? findContinuation(scenarios, interaction.customId, {
          buttons: await guild.get("utils.components.buttons"),
          selectMenus: await guild.get("utils.components.selectMenus"),
          layouts: await guild.get("utils.components.layouts"),
        })
      : undefined;

    if (continuation) {
      await runScenario(client, typedInteraction, continuation.scenario, guild, {
        startStepId: continuation.targetStepId,
      });
      return true;
    }

    // Find matching scenario
    const matchingScenario = scenarios?.find(
      (s) =>
        s.enabled &&
        s.trigger?.type === triggerType &&
        s.trigger?.componentId === interaction.customId,
    );

    if (matchingScenario) {
      await runScenario(client, typedInteraction, matchingScenario, guild);
      return true;
    }

    // Check if this is a custom component without a trigger
    const isCustomComponent = await checkIfCustomComponent(
      guild,
      interaction.customId,
      triggerType,
    );

    if (isCustomComponent) {
      // This is a custom component but no scenario is assigned to it
      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply({
          content: t(client, lang, "events.interaction_create.scenario_not_found") as string,
          flags: MessageFlagsBitField.Flags.Ephemeral,
        });
      }
      return true; // We handled it (by showing the message)
    }

    return false;
  } catch (error) {
    console.error("[ScenarioHandler] Error:", error);
    return false;
  }
}

/**
 * Check if a component ID belongs to a custom component created via the bot
 */
async function checkIfCustomComponent(
  guild: Guild,
  componentId: string,
  triggerType: "button" | "select_menu" | "modal_submit",
): Promise<boolean> {
  try {
    if (triggerType === "button") {
      const buttons = await guild.get("utils.components.buttons");
      return buttons?.some((b) => b.id === componentId) || false;
    } else if (triggerType === "select_menu") {
      const selectMenus = await guild.get("utils.components.selectMenus");
      return selectMenus?.some((s) => s.id === componentId) || false;
    } else if (triggerType === "modal_submit") {
      // Check if this modal ID exists in custom modals
      const modals = await guild.get("utils.components.modals");
      return modals?.some((m) => m.id === componentId) || false;
    }
    return false;
  } catch {
    return false;
  }
}

/**
 * Get all scenarios for a guild
 */
export async function getGuildScenarios(
  client: Client,
  guildId: string,
): Promise<ScenarioCustom[]> {
  try {
    const discordGuild = client.guilds.cache.get(guildId);
    if (!discordGuild) return [];

    const guild = new Guild(client, discordGuild);
    return await guild.get("utils.components.scenarios");
  } catch {
    return [];
  }
}

/**
 * Find scenario by component ID
 */
export async function findScenarioByComponentId(
  client: Client,
  guildId: string,
  componentId: string,
): Promise<ScenarioCustom | undefined> {
  const scenarios = await getGuildScenarios(client, guildId);
  return scenarios.find((s) => s.trigger?.componentId === componentId);
}
