import {
  ScenarioCustom,
  ScenarioStep,
  ScenarioAction,
  ScenarioCondition,
  SCENARIO_LIMITS,
  EmbedCustom,
  ModalCustom,
} from "../../types/helpers";
import {
  Client,
  ButtonInteraction,
  StringSelectMenuInteraction,
  ModalSubmitInteraction,
  GuildMember,
  TextChannel,
  MessageFlags,
  ChannelType,
} from "discord.js";
import { Guild } from "../Guild";
import { CustomEmbed, VariableContext } from "./CustomEmbed";
import { CustomModal } from "./CustomModal";

interface ExecutionContext {
  client: Client;
  interaction: ButtonInteraction | StringSelectMenuInteraction | ModalSubmitInteraction;
  guildWrapper: Guild;
  executionCount: number;
  visitedSteps: Set<string>;
  // Variable context fields
  user?: {
    id: string;
    name: string;
    displayName: string;
    mention: string;
    avatar: string;
  };
  channel?: {
    id: string;
    name: string;
    mention: string;
  };
  guildInfo?: {
    id: string;
    name: string;
    icon: string | null;
  };
  input?: Array<{ value: string; label: string }>;
  selected?: {
    value: string;
    label: string;
  };
  variables?: Record<string, string>;
}

interface CooldownEntry {
  userId: string;
  scenarioId: string;
  timestamp: number;
  executionCount: number;
}

// In-memory cooldown storage
const cooldownMap = new Map<string, CooldownEntry>();

export class ScenarioRunner {
  private scenario: ScenarioCustom;
  private context: ExecutionContext;

  constructor(scenario: ScenarioCustom, context: ExecutionContext) {
    this.scenario = scenario;
    this.context = context;
  }

  /**
   * Convert ExecutionContext to VariableContext for CustomEmbed
   */
  private toVariableContext(): VariableContext {
    return {
      user: this.context.user,
      channel: this.context.channel,
      guild: this.context.guildInfo,
      input: this.context.input,
      selected: this.context.selected,
      variables: this.context.variables,
    };
  }

  /**
   * Main entry point to run a scenario
   */
  static async run(
    client: Client,
    interaction: ButtonInteraction | StringSelectMenuInteraction | ModalSubmitInteraction,
    scenario: ScenarioCustom,
    guildWrapper: Guild,
  ): Promise<{ success: boolean; error?: string }> {
    // Check if scenario is enabled
    if (!scenario.enabled) {
      return { success: false, error: "Scenario is disabled" };
    }

    const member = interaction.member as GuildMember;
    if (!member) {
      return { success: false, error: "Could not resolve member" };
    }

    // Check role restrictions
    if (scenario.deniedRoles && scenario.deniedRoles.length > 0) {
      if (scenario.deniedRoles.some((roleId) => member.roles.cache.has(roleId))) {
        return { success: false, error: "You don't have permission to use this" };
      }
    }

    if (scenario.allowedRoles && scenario.allowedRoles.length > 0) {
      if (!scenario.allowedRoles.some((roleId) => member.roles.cache.has(roleId))) {
        return { success: false, error: "You don't have permission to use this" };
      }
    }

    // Check channel restrictions
    if (scenario.allowedChannels && scenario.allowedChannels.length > 0) {
      if (!scenario.allowedChannels.includes(interaction.channelId!)) {
        return { success: false, error: "This cannot be used in this channel" };
      }
    }

    // Check cooldown
    const cooldownKey = `${interaction.user.id}:${scenario.id}`;
    const cooldownEntry = cooldownMap.get(cooldownKey);

    if (cooldownEntry && scenario.cooldown) {
      const timePassed = (Date.now() - cooldownEntry.timestamp) / 1000;
      if (timePassed < scenario.cooldown) {
        const remaining = Math.ceil(scenario.cooldown - timePassed);
        return {
          success: false,
          error: `Please wait ${remaining} seconds before using this again`,
        };
      }
    }

    // Check execution limit
    if (scenario.maxExecutionsPerUser && scenario.executionPeriod) {
      if (cooldownEntry) {
        const periodPassed = (Date.now() - cooldownEntry.timestamp) / 1000;
        if (periodPassed < scenario.executionPeriod) {
          if (cooldownEntry.executionCount >= scenario.maxExecutionsPerUser) {
            return { success: false, error: "You have reached the maximum number of uses" };
          }
        }
      }
    }

    // Build execution context
    const context: ExecutionContext = {
      client,
      interaction,
      guildWrapper,
      executionCount: 0,
      visitedSteps: new Set(),
      user: {
        id: interaction.user.id,
        name: interaction.user.username,
        displayName: member.displayName,
        mention: `<@${interaction.user.id}>`,
        avatar: interaction.user.displayAvatarURL(),
      },
      channel: interaction.channel
        ? {
            id: interaction.channel.id,
            name: (interaction.channel as TextChannel).name || "DM",
            mention: `<#${interaction.channel.id}>`,
          }
        : undefined,
      guildInfo: interaction.guild
        ? {
            id: interaction.guild.id,
            name: interaction.guild.name,
            icon: interaction.guild.iconURL(),
          }
        : undefined,
      variables: { ...scenario.variables },
    };

    // Add input/selected context based on interaction type
    if (interaction.isModalSubmit()) {
      context.input = [];
      const modal = await guildWrapper.get(`utils.components.modals`).then((modals) => (modals as ModalCustom[]).find((m) => m.id === interaction.customId));
      if (!modal) {
        return { success: false, error: "Modal configuration not found" };
      }
      // Convert fields to array and preserve order
      const fieldsArray = Array.from(interaction.fields.fields.values());
      fieldsArray.forEach((field) => {
        context.input!.push({
          value: (field as any).value || "",
          label: modal.fields.filter(m => m.id === (field as any).customId)[0].name || "", // customId contains the field identifier
        });
      });
    } else if (interaction.isStringSelectMenu()) {
      context.selected = {
        value: interaction.values[0],
        label: interaction.values[0], // Label not directly available, using value
      };
    }

    const runner = new ScenarioRunner(scenario, context);
    const result = await runner.execute();

    // Update cooldown
    cooldownMap.set(cooldownKey, {
      userId: interaction.user.id,
      scenarioId: scenario.id,
      timestamp: Date.now(),
      executionCount: (cooldownEntry?.executionCount || 0) + 1,
    });

    return result;
  }

  /**
   * Execute the scenario steps
   */
  private async execute(): Promise<{ success: boolean; error?: string }> {
    if (this.scenario.steps.length === 0) {
      return { success: false, error: "Scenario has no steps" };
    }

    // Sort steps by order
    const sortedSteps = [...this.scenario.steps].sort((a, b) => a.order - b.order);
    let currentStep: ScenarioStep | undefined = sortedSteps[0];

    while (currentStep) {
      // Check execution limit
      if (this.context.executionCount >= SCENARIO_LIMITS.MAX_EXECUTIONS_PER_RUN) {
        return { success: false, error: "Maximum execution steps reached" };
      }

      // Check for infinite loop
      if (this.context.visitedSteps.has(currentStep.id)) {
        // Allow re-visiting steps but track count
        const visitCount = Array.from(this.context.visitedSteps).filter(
          (id) => id === currentStep!.id,
        ).length;
        if (visitCount > 5) {
          return { success: false, error: "Potential infinite loop detected" };
        }
      }

      this.context.visitedSteps.add(currentStep.id);
      this.context.executionCount++;

      // Evaluate conditions
      let conditionsPassed = true;
      if (currentStep.conditions && currentStep.conditions.length > 0) {
        conditionsPassed = this.evaluateConditions(
          currentStep.conditions,
          currentStep.conditionLogic || "and",
        );
      }

      let nextStepId: string | undefined;

      if (conditionsPassed) {
        // Execute action
        const actionResult = await this.executeAction(currentStep.action);
        if (!actionResult.success) {
          if (currentStep.stopOnFailure) {
            return actionResult;
          }
        }
        nextStepId = currentStep.onSuccess;
      } else {
        nextStepId = currentStep.onFailure;
        if (!nextStepId && currentStep.stopOnFailure) {
          return { success: false, error: "Conditions not met" };
        }
      }

      // Find next step
      if (nextStepId) {
        currentStep = this.scenario.steps.find((s) => s.id === nextStepId);
      } else {
        // Move to next step in order
        const currentIndex = sortedSteps.indexOf(currentStep);
        currentStep = sortedSteps[currentIndex + 1];
      }
    }

    return { success: true };
  }

  /**
   * Evaluate conditions based on logic (AND/OR)
   */
  private evaluateConditions(conditions: ScenarioCondition[], logic: "and" | "or"): boolean {
    const results = conditions.map((condition) => this.evaluateCondition(condition));

    if (logic === "and") {
      return results.every((r) => r);
    } else {
      return results.some((r) => r);
    }
  }

  /**
   * Evaluate a single condition
   */
  private evaluateCondition(condition: ScenarioCondition): boolean {
    let value: string = "";

    // Get the value to compare
    switch (condition.type) {
      case "user":
        value = this.context.user?.id || "";
        break;
      case "input":
        // field is now expected to be an index (0, 1, 2...) or "0.label" for label access
        const fieldParts = (condition.field || "0").split(".");
        const fieldIndex = parseInt(fieldParts[0], 10);
        if (!isNaN(fieldIndex) && this.context.input?.[fieldIndex]) {
          if (fieldParts[1] === "label") {
            value = this.context.input[fieldIndex].label;
          } else {
            value = this.context.input[fieldIndex].value;
          }
        }
        break;
      case "variable":
        value = this.context.variables?.[condition.field || ""] || "";
        break;
      case "selected":
        value = this.context.selected?.value || "";
        break;
      case "role":
        // For role checks, we check if user has the role
        const member = this.context.interaction.member as GuildMember;
        if (!member) return false;

        if (condition.operator === "has_role") {
          return member.roles.cache.has(condition.value);
        } else if (condition.operator === "not_has_role") {
          return !member.roles.cache.has(condition.value);
        }
        return false;
      case "channel":
        value = this.context.channel?.id || "";
        break;
    }

    // Evaluate operator
    switch (condition.operator) {
      case "equals":
        return value === condition.value;
      case "not_equals":
        return value !== condition.value;
      case "contains":
        return value.includes(condition.value);
      case "not_contains":
        return !value.includes(condition.value);
      case "starts_with":
        return value.startsWith(condition.value);
      case "ends_with":
        return value.endsWith(condition.value);
      case "greater_than":
        return parseFloat(value) > parseFloat(condition.value);
      case "less_than":
        return parseFloat(value) < parseFloat(condition.value);
      case "in_channel":
        return this.context.channel?.id === condition.value;
      case "not_in_channel":
        return this.context.channel?.id !== condition.value;
      case "is_empty":
        return !value || value.length === 0;
      case "is_not_empty":
        return Boolean(value && value.length > 0);
      default:
        return false;
    }
  }

  /**
   * Execute a scenario action
   */
  private async executeAction(
    action: ScenarioAction,
  ): Promise<{ success: boolean; error?: string }> {
    const interaction = this.context.interaction;

    try {
      switch (action.type) {
        case "show_modal":
          return await this.actionShowModal(action);
        case "send_message":
        case "reply":
          return await this.actionSendMessage(action);
        case "send_embed":
          return await this.actionSendEmbed(action);
        case "add_role":
          return await this.actionAddRole(action);
        case "remove_role":
          return await this.actionRemoveRole(action);
        case "create_thread":
          return await this.actionCreateThread(action);
        case "send_dm":
          return await this.actionSendDM(action);
        case "set_variable":
          return this.actionSetVariable(action);
        case "edit_message":
          return await this.actionEditMessage(action);
        case "delete_message":
          return await this.actionDeleteMessage(action);
        default:
          return { success: false, error: `Unknown action type: ${action.type}` };
      }
    } catch (error: any) {
      console.error(`[ScenarioRunner] Action error:`, error);
      return { success: false, error: error.message };
    }
  }

  private substituteVariables(text: string): string {
    if (!text) return text;

    let result = text;

    // User variables
    if (this.context.user) {
      result = result
        .replace(/{user\.id}/g, this.context.user.id)
        .replace(/{user\.name}/g, this.context.user.name)
        .replace(/{user\.displayName}/g, this.context.user.displayName)
        .replace(/{user\.mention}/g, this.context.user.mention)
        .replace(/{user\.avatar}/g, this.context.user.avatar);
    }

    // Channel variables
    if (this.context.channel) {
      result = result
        .replace(/{channel\.id}/g, this.context.channel.id)
        .replace(/{channel\.name}/g, this.context.channel.name)
        .replace(/{channel\.mention}/g, this.context.channel.mention);
    }

    // Guild variables
    if (this.context.guildInfo) {
      result = result
        .replace(/{guild\.id}/g, this.context.guildInfo.id)
        .replace(/{guild\.name}/g, this.context.guildInfo.name)
        .replace(/{guild\.icon}/g, this.context.guildInfo.icon || "");
    }

    // Input variables (by index: {input.0}, {input.0.label}, {input.1}, etc.)
    if (this.context.input) {
      this.context.input.forEach((field, index) => {
        // Replace {input.N} with field value
        result = result.replace(new RegExp(`\\{input\\.${index}\\}`, "g"), field.value);
        // Replace {input.N.label} with field label
        result = result.replace(new RegExp(`\\{input\\.${index}\\.label\\}`, "g"), field.label);
        // Replace {input.N.value} with field value (explicit)
        result = result.replace(new RegExp(`\\{input\\.${index}\\.value\\}`, "g"), field.value);
      });
    }

    // Selected variables
    if (this.context.selected) {
      result = result
        .replace(/{selected\.value}/g, this.context.selected.value)
        .replace(/{selected\.label}/g, this.context.selected.label);
    }

    // Custom variables
    if (this.context.variables) {
      for (const [key, value] of Object.entries(this.context.variables)) {
        result = result.replace(new RegExp(`{var\\.${key}}`, "g"), value);
      }
    }

    // Date/time
    const now = new Date();
    result = result
      .replace(/{date}/g, now.toLocaleDateString())
      .replace(/{time}/g, now.toLocaleTimeString())
      .replace(/{timestamp}/g, Math.floor(now.getTime() / 1000).toString());

    return result;
  }

  private async actionShowModal(
    action: ScenarioAction,
  ): Promise<{ success: boolean; error?: string }> {
    if (!action.modalId) {
      return { success: false, error: "Modal ID is required" };
    }

    const modals = (await this.context.guildWrapper.get(
      "utils.components.modals",
    )) as ModalCustom[];
    const modalData = modals.find((m) => m.id === action.modalId);

    if (!modalData) {
      return { success: false, error: "Modal not found" };
    }

    const modal = new CustomModal(modalData);
    const interaction = this.context.interaction;

    if ("showModal" in interaction) {
      await interaction.showModal(modal.getModal());
      return { success: true };
    }

    return { success: false, error: "Cannot show modal for this interaction type" };
  }

  private async actionSendMessage(
    action: ScenarioAction,
  ): Promise<{ success: boolean; error?: string }> {
    const content = action.content ? this.substituteVariables(action.content) : undefined;

    if (!content) {
      return { success: false, error: "Message content is required" };
    }

    const interaction = this.context.interaction;

    if (action.type === "reply") {
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({
          content,
          flags: action.ephemeral ? MessageFlags.Ephemeral : undefined,
        });
      } else {
        await interaction.reply({
          content,
          flags: action.ephemeral ? MessageFlags.Ephemeral : undefined,
        });
      }
    } else {
      // Send to specific channel or current channel
      const channelId = action.channelId || interaction.channelId;
      const channel = await this.context.client.channels.fetch(channelId!);

      if (channel && "send" in channel) {
        await channel.send({ content });
      } else {
        return { success: false, error: "Channel not found or cannot send messages" };
      }
    }

    return { success: true };
  }

  private async actionSendEmbed(
    action: ScenarioAction,
  ): Promise<{ success: boolean; error?: string }> {
    if (!action.embedId) {
      return { success: false, error: "Embed ID is required" };
    }

    const embeds = (await this.context.guildWrapper.get("utils.components.embed")) as EmbedCustom[];
    const embedData = embeds.find((e) => e.id === action.embedId);

    if (!embedData) {
      return { success: false, error: "Embed not found" };
    }

    const customEmbed = new CustomEmbed(embedData);
    const embed = customEmbed.getEmbed(this.toVariableContext());
    const content = action.content ? this.substituteVariables(action.content) : undefined;

    const interaction = this.context.interaction;

    if (action.channelId) {
      const channel = await this.context.client.channels.fetch(action.channelId);
      if (channel && "send" in channel) {
        await channel.send({ content, embeds: [embed] });
      } else {
        return { success: false, error: "Channel not found" };
      }
    } else {
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({
          content,
          embeds: [embed],
          flags: action.ephemeral ? MessageFlags.Ephemeral : undefined,
        });
      } else {
        await interaction.reply({
          content,
          embeds: [embed],
          flags: action.ephemeral ? MessageFlags.Ephemeral : undefined,
        });
      }
    }

    return { success: true };
  }

  private async actionAddRole(
    action: ScenarioAction,
  ): Promise<{ success: boolean; error?: string }> {
    if (!action.roleId) {
      return { success: false, error: "Role ID is required" };
    }

    const member = this.context.interaction.member as GuildMember;
    if (!member) {
      return { success: false, error: "Could not resolve member" };
    }

    try {
      await member.roles.add(action.roleId);
      return { success: true };
    } catch (error: any) {
      return { success: false, error: `Failed to add role: ${error.message}` };
    }
  }

  private async actionRemoveRole(
    action: ScenarioAction,
  ): Promise<{ success: boolean; error?: string }> {
    if (!action.roleId) {
      return { success: false, error: "Role ID is required" };
    }

    const member = this.context.interaction.member as GuildMember;
    if (!member) {
      return { success: false, error: "Could not resolve member" };
    }

    try {
      await member.roles.remove(action.roleId);
      return { success: true };
    } catch (error: any) {
      return { success: false, error: `Failed to remove role: ${error.message}` };
    }
  }

  private async actionCreateThread(
    action: ScenarioAction,
  ): Promise<{ success: boolean; error?: string }> {
    if (!action.threadName) {
      return { success: false, error: "Thread name is required" };
    }

    const channel = this.context.interaction.channel;
    if (!channel || !("threads" in channel)) {
      return { success: false, error: "Cannot create thread in this channel" };
    }

    try {
      const thread = await (channel as TextChannel).threads.create({
        name: this.substituteVariables(action.threadName),
        autoArchiveDuration: action.autoArchiveDuration || 1440,
        type: ChannelType.PublicThread,
      });

      // Store thread ID as variable for later use
      if (this.context.variables) {
        this.context.variables["thread.id"] = thread.id;
        this.context.variables["thread.mention"] = `<#${thread.id}>`;
      }

      return { success: true };
    } catch (error: any) {
      return { success: false, error: `Failed to create thread: ${error.message}` };
    }
  }

  private async actionSendDM(
    action: ScenarioAction,
  ): Promise<{ success: boolean; error?: string }> {
    const content = action.dmContent ? this.substituteVariables(action.dmContent) : undefined;

    try {
      const user = this.context.interaction.user;
      const dm = await user.createDM();

      const messageOptions: any = {};

      if (content) {
        messageOptions.content = content;
      }

      if (action.dmEmbedId) {
        const embeds = (await this.context.guildWrapper.get(
          "utils.components.embed",
        )) as EmbedCustom[];
        const embedData = embeds.find((e) => e.id === action.dmEmbedId);

        if (embedData) {
          const customEmbed = new CustomEmbed(embedData);
          messageOptions.embeds = [customEmbed.getEmbed(this.context)];
        }
      }

      if (messageOptions.content || messageOptions.embeds) {
        await dm.send(messageOptions);
      } else {
        return { success: false, error: "DM content or embed is required" };
      }

      return { success: true };
    } catch (error: any) {
      return { success: false, error: `Failed to send DM: ${error.message}` };
    }
  }

  private actionSetVariable(action: ScenarioAction): { success: boolean; error?: string } {
    if (!action.variableName) {
      return { success: false, error: "Variable name is required" };
    }

    if (action.variableName.length > SCENARIO_LIMITS.MAX_VARIABLE_NAME_LENGTH) {
      return { success: false, error: "Variable name too long" };
    }

    const value = action.variableValue ? this.substituteVariables(action.variableValue) : "";

    if (value.length > SCENARIO_LIMITS.MAX_VARIABLE_VALUE_LENGTH) {
      return { success: false, error: "Variable value too long" };
    }

    if (!this.context.variables) {
      this.context.variables = {};
    }

    this.context.variables[action.variableName] = value;
    return { success: true };
  }

  private async actionEditMessage(
    action: ScenarioAction,
  ): Promise<{ success: boolean; error?: string }> {
    const interaction = this.context.interaction;

    if (!("message" in interaction) || !interaction.message) {
      return { success: false, error: "No message to edit" };
    }

    try {
      const messageOptions: any = {};

      if (action.content) {
        messageOptions.content = this.substituteVariables(action.content);
      }

      if (action.embedId) {
        const embeds = (await this.context.guildWrapper.get(
          "utils.components.embed",
        )) as EmbedCustom[];
        const embedData = embeds.find((e) => e.id === action.embedId);

        if (embedData) {
          const customEmbed = new CustomEmbed(embedData);
          messageOptions.embeds = [customEmbed.getEmbed(this.context)];
        }
      }

      await interaction.message.edit(messageOptions);
      return { success: true };
    } catch (error: any) {
      return { success: false, error: `Failed to edit message: ${error.message}` };
    }
  }

  private async actionDeleteMessage(
    action: ScenarioAction,
  ): Promise<{ success: boolean; error?: string }> {
    const interaction = this.context.interaction;

    if (action.deleteOriginal) {
      if (!("message" in interaction) || !interaction.message) {
        return { success: false, error: "No message to delete" };
      }

      try {
        if (action.deleteDelay && action.deleteDelay > 0) {
          setTimeout(async () => {
            try {
              await interaction.message!.delete();
            } catch (e) {
              // Ignore deletion errors after delay
            }
          }, action.deleteDelay);
        } else {
          await interaction.message.delete();
        }
        return { success: true };
      } catch (error: any) {
        return { success: false, error: `Failed to delete message: ${error.message}` };
      }
    }

    return { success: true };
  }

  /**
   * Clear old cooldown entries (call periodically)
   */
  static cleanupCooldowns(): void {
    const now = Date.now();
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours

    for (const [key, entry] of cooldownMap.entries()) {
      if (now - entry.timestamp > maxAge) {
        cooldownMap.delete(key);
      }
    }
  }
}

// Setup periodic cleanup
setInterval(() => ScenarioRunner.cleanupCooldowns(), 60 * 60 * 1000); // Every hour
