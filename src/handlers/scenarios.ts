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
import { ScenarioCustom } from "../types/helpers";
import { t } from "../i18n/helpers";

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

    // Find matching scenario
    const matchingScenario = scenarios?.find(
      (s) =>
        s.enabled &&
        s.trigger.type === triggerType &&
        s.trigger.componentId === interaction.customId,
    );

    if (matchingScenario) {
      // Execute the scenario
      const result = await ScenarioRunner.run(
        client,
        interaction as ButtonInteraction | StringSelectMenuInteraction | ModalSubmitInteraction,
        matchingScenario,
        guild,
      );

      if (!result.success && result.error) {
        // If the interaction hasn't been responded to, send error message
        if (!interaction.replied && !interaction.deferred) {
          await interaction.reply({
            content: `❌ ${result.error}`,
            flags: MessageFlagsBitField.Flags.Ephemeral,
          });
        }
      }

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
  return scenarios.find((s) => s.trigger.componentId === componentId);
}
