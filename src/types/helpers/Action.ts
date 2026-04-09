import { ColorResolvable, EmojiResolvable } from "discord.js";

export interface ModalCustom {
  id: string;
  title: string;
  fields: IModalField[];
}

export interface IModalField {
  id: string;
  name: string;
  placeholder?: string;
  type: "short" | "long";
  min?: number;
  max?: number;
  required: boolean;
}

export interface EmbedCustom {
  id: string;
  name: string; // Display name for management
  title?: string;
  description?: string;
  color?: ColorResolvable;
  author?: {
    name: string;
    icon_url?: string;
    url?: string;
  };
  thumbnail?: string;
  fields?: EmbedField[];
  image?: string;
  footer?: {
    text: string;
    icon_url?: string;
  };
  timestamp?: boolean;
}

export interface EmbedField {
  name: string;
  value: string;
  inline?: boolean;
}

export interface ButtonCustom {
  id: string;
  name: string; // Display name for management
  label: string;
  style: "PRIMARY" | "SECONDARY" | "SUCCESS" | "DANGER" | "LINK";
  emoji?: string | EmojiResolvable;
  url?: string;
  disabled?: boolean;
}

export interface SelectMenuOptionCustom {
  label: string;
  value: string;
  description?: string;
  emoji?: string | EmojiResolvable;
  default?: boolean;
}

export interface SelectMenuCustom {
  id: string;
  name: string; // Display name for management
  placeholder?: string;
  minValues?: number;
  maxValues?: number;
  disabled?: boolean;
  options: SelectMenuOptionCustom[];
}

// ==================== SCENARIO TYPES ====================

export type ScenarioActionType =
  | "show_modal"
  | "send_message"
  | "send_embed"
  | "add_role"
  | "remove_role"
  | "create_thread"
  | "send_dm"
  | "set_variable"
  | "edit_message"
  | "delete_message"
  | "reply";

export type ScenarioTriggerType = "button" | "select_menu" | "modal_submit";

export type ScenarioConditionOperator =
  | "equals"
  | "not_equals"
  | "contains"
  | "not_contains"
  | "starts_with"
  | "ends_with"
  | "greater_than"
  | "less_than"
  | "has_role"
  | "not_has_role"
  | "in_channel"
  | "not_in_channel"
  | "is_empty"
  | "is_not_empty";

export type ScenarioConditionType = "user" | "input" | "variable" | "role" | "channel" | "selected";

export interface ScenarioCondition {
  type: ScenarioConditionType;
  field?: string; // For input type: field ID; for variable: variable name
  operator: ScenarioConditionOperator;
  value: string;
}

export interface ScenarioAction {
  type: ScenarioActionType;
  // For show_modal
  modalId?: string;
  // For send_message/send_embed/edit_message/reply
  channelId?: string; // null = same channel
  content?: string;
  embeds?: string[];
  buttons?: string[];
  selectMenus?: string[];
  embedId?: string; // Legacy
  ephemeral?: boolean;
  // For add_role/remove_role
  roleId?: string;
  // For create_thread
  threadName?: string;
  autoArchiveDuration?: 60 | 1440 | 4320 | 10080;
  // For send_dm
  dmContent?: string; // Legacy
  dmEmbedId?: string; // Legacy
  // For set_variable
  variableName?: string;
  variableValue?: string;
  // For delete_message
  deleteOriginal?: boolean;
  deleteDelay?: number; // Delay in ms before deleting
}

export interface ScenarioStep {
  id: string;
  order: number;
  name?: string; // Optional display name
  action: ScenarioAction;
  conditions?: ScenarioCondition[];
  conditionLogic?: "and" | "or"; // How to evaluate multiple conditions
  onSuccess?: string; // Next step ID on success
  onFailure?: string; // Next step ID on failure (if conditions fail)
  stopOnFailure?: boolean; // Stop scenario if this step fails
}

export interface ScenarioCustom {
  id: string;
  name: string;
  description?: string;
  enabled: boolean;
  trigger: {
    type: ScenarioTriggerType;
    componentId: string; // ID of button/select menu/modal that triggers this
  };
  variables?: Record<string, string>; // Predefined variables
  steps: ScenarioStep[];
  // Restrictions
  maxExecutionsPerUser?: number; // Limit per user per time period
  executionPeriod?: number; // Time period in seconds for maxExecutions
  cooldown?: number; // Cooldown in seconds between executions for same user
  allowedRoles?: string[]; // Roles that can trigger this scenario (empty = all)
  deniedRoles?: string[]; // Roles that cannot trigger this scenario
  allowedChannels?: string[]; // Channels where this scenario can be triggered (empty = all)
  // Metadata
  createdAt?: number;
  updatedAt?: number;
  createdBy?: string;
}

// ==================== CONSTANTS ====================

export const SCENARIO_LIMITS = {
  MAX_SCENARIOS_PER_GUILD: 10,
  MAX_STEPS_PER_SCENARIO: 20,
  MAX_EXECUTIONS_PER_RUN: 50,
  MAX_SELECT_MENU_OPTIONS: 25,
  MAX_EMBED_FIELDS: 25,
  MIN_COOLDOWN: 1,
  MAX_VARIABLE_NAME_LENGTH: 32,
  MAX_VARIABLE_VALUE_LENGTH: 1000,
} as const;

export const VARIABLE_PLACEHOLDERS = {
  USER_ID: "{user.id}",
  USER_NAME: "{user.name}",
  USER_DISPLAY_NAME: "{user.displayName}",
  USER_MENTION: "{user.mention}",
  USER_AVATAR: "{user.avatar}",
  CHANNEL_ID: "{channel.id}",
  CHANNEL_NAME: "{channel.name}",
  CHANNEL_MENTION: "{channel.mention}",
  GUILD_ID: "{guild.id}",
  GUILD_NAME: "{guild.name}",
  GUILD_ICON: "{guild.icon}",
  DATE: "{date}",
  TIME: "{time}",
  TIMESTAMP: "{timestamp}",
} as const;
