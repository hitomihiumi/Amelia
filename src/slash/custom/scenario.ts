import {
  ScenarioCustom,
  ScenarioStep,
  ScenarioAction,
  ScenarioCondition,
  SlashCommand,
  SCENARIO_LIMITS,
  ScenarioActionType,
  ScenarioConditionOperator,
  ScenarioTriggerType,
  ModalCustom,
  EmbedCustom,
  ButtonCustom,
  SelectMenuCustom,
} from "../../types/helpers";
import {
  Client,
  EmbedBuilder,
  ButtonBuilder,
  ActionRowBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  MessageActionRowComponentBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  ButtonStyle,
  ChatInputCommandInteraction,
  MessageFlagsBitField,
  RoleSelectMenuBuilder,
  ChannelSelectMenuBuilder,
  ChannelType,
  LabelBuilder,
} from "discord.js";
import { Guild } from "../../helpers";
import { generateID } from "../../handlers/functions";
import fuse from "fuse.js";
import { t } from "../../i18n/helpers";
import { defaultPermissions } from "../../helpers";

type ViewType =
  | "main"
  | "list"
  | "edit"
  | "trigger"
  | "steps"
  | "step_edit"
  | "action"
  | "conditions"
  | "condition_edit"
  | "restrictions"
  | "select_component"
  | "select_role"
  | "select_channel";

const ACTION_TYPES: { value: ScenarioActionType; label: string; emoji: string }[] = [
  { value: "reply", label: "Reply to interaction", emoji: "💬" },
  { value: "send_message", label: "Send message to channel", emoji: "📤" },
  { value: "send_embed", label: "Send embed", emoji: "📋" },
  { value: "show_modal", label: "Show modal", emoji: "📝" },
  { value: "add_role", label: "Add role", emoji: "➕" },
  { value: "remove_role", label: "Remove role", emoji: "➖" },
  { value: "create_thread", label: "Create thread", emoji: "🧵" },
  { value: "send_dm", label: "Send DM", emoji: "✉️" },
  { value: "set_variable", label: "Set variable", emoji: "📦" },
  { value: "edit_message", label: "Edit message", emoji: "✏️" },
  { value: "delete_message", label: "Delete message", emoji: "🗑️" },
];

const CONDITION_OPERATORS: { value: ScenarioConditionOperator; label: string }[] = [
  { value: "equals", label: "Equals" },
  { value: "not_equals", label: "Not equals" },
  { value: "contains", label: "Contains" },
  { value: "not_contains", label: "Not contains" },
  { value: "starts_with", label: "Starts with" },
  { value: "ends_with", label: "Ends with" },
  { value: "greater_than", label: "Greater than" },
  { value: "less_than", label: "Less than" },
  { value: "has_role", label: "Has role" },
  { value: "not_has_role", label: "Doesn't have role" },
  { value: "in_channel", label: "In channel" },
  { value: "not_in_channel", label: "Not in channel" },
  { value: "is_empty", label: "Is empty" },
  { value: "is_not_empty", label: "Is not empty" },
];

const TRIGGER_TYPES: { value: ScenarioTriggerType; label: string; emoji: string }[] = [
  { value: "button", label: "Button click", emoji: "🔘" },
  { value: "select_menu", label: "Select menu", emoji: "📋" },
  { value: "modal_submit", label: "Modal submit", emoji: "📝" },
];

// Default schema creators
function schemaDefault(id: string): ScenarioCustom {
  return {
    id,
    name: "New Scenario",
    description: "",
    enabled: false,
    trigger: {
      type: "button",
      componentId: "",
    },
    variables: {},
    steps: [],
    cooldown: 0,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

function stepDefault(id: string, order: number): ScenarioStep {
  return {
    id,
    order,
    name: `Step ${order + 1}`,
    action: {
      type: "reply",
      content: "Hello!",
      ephemeral: true,
    },
    conditions: [],
    conditionLogic: "and",
    stopOnFailure: false,
  };
}

function conditionDefault(): ScenarioCondition {
  return {
    type: "user",
    operator: "equals",
    value: "",
  };
}

// Database helpers
async function getScenarios(guild: Guild): Promise<ScenarioCustom[]> {
  return (await guild.get("utils.components.scenarios")) as ScenarioCustom[];
}

async function setScenarios(guild: Guild, scenarios: ScenarioCustom[]): Promise<void> {
  await guild.set("utils.components.scenarios", scenarios);
}

async function getModals(guild: Guild): Promise<ModalCustom[]> {
  return (await guild.get("utils.components.modals")) as ModalCustom[];
}

async function getEmbeds(guild: Guild): Promise<EmbedCustom[]> {
  return (await guild.get("utils.components.embed")) as EmbedCustom[];
}

async function getButtons(guild: Guild): Promise<ButtonCustom[]> {
  return (await guild.get("utils.components.buttons")) as ButtonCustom[];
}

async function getSelectMenus(guild: Guild): Promise<SelectMenuCustom[]> {
  return (await guild.get("utils.components.selectMenus")) as SelectMenuCustom[];
}

module.exports = {
  name: "scenario",
  description: "Menu for creating and configuring custom scenarios",
  cooldown: 5,
  locale: {
    ru: "Меню создания и настройки сценариев взаимодействия",
  },
  options: [],
  permissions: {
    bot: [...defaultPermissions],
  },
  key: null,
  run: async (client: Client, interaction: ChatInputCommandInteraction) => {
    if (!interaction.guild) return;

    await interaction.deferReply({ flags: [MessageFlagsBitField.Flags.Ephemeral] });

    const guild = new Guild(client, interaction.guild);
    const lang = await guild.get("settings.language");

    // State variables
    let page = 0;
    let currentView: ViewType = "main";
    let _schema = schemaDefault(generateID(guild.guild.id, "scenario"));
    let currentStepIndex = 0;
    let currentConditionIndex = 0;
    let _search = "";
    let selectingFor:
      | "trigger"
      | "action_modal"
      | "action_embed"
      | "action_role"
      | "action_channel"
      | "dm_embed" = "trigger";

    // Update message function
    const updateMessage = async (files: any[] = []) => {
      const embed = await buildEmbed(
        client,
        lang,
        _schema,
        currentView,
        currentStepIndex,
        currentConditionIndex,
        guild,
      );
      const components = await buildComponents(
        client,
        lang,
        _schema,
        currentView,
        currentStepIndex,
        currentConditionIndex,
        await getScenarios(guild),
        page,
        _search,
        guild,
        selectingFor,
      );
      await interaction.editReply({ embeds: [embed], components, files });
    };

    await updateMessage();

    const filter = (i: any) => i.user.id === interaction.user.id;
    const collector = interaction.channel!.createMessageComponentCollector({
      filter,
      time: 600000,
    });

    collector.on("collect", async (i) => {
      try {
        // Handle string select menus
        if (i.isStringSelectMenu()) {
          await handleStringSelectMenu(i, {
            client,
            lang,
            guild,
            _schema,
            currentView,
            currentStepIndex,
            currentConditionIndex,
            page,
            _search,
            selectingFor,
            updateMessage,
            setSchema: (s: ScenarioCustom) => {
              _schema = s;
            },
            setView: (v: ViewType) => {
              currentView = v;
            },
            setStepIndex: (idx: number) => {
              currentStepIndex = idx;
            },
            setConditionIndex: (idx: number) => {
              currentConditionIndex = idx;
            },
            setPage: (p: number) => {
              page = p;
            },
            setSearch: (s: string) => {
              _search = s;
            },
            setSelectingFor: (f: typeof selectingFor) => {
              selectingFor = f;
            },
          });
        }

        // Handle buttons
        if (i.isButton()) {
          await handleButton(i, {
            client,
            lang,
            guild,
            interaction,
            _schema,
            currentView,
            currentStepIndex,
            currentConditionIndex,
            page,
            selectingFor,
            updateMessage,
            setSchema: (s: ScenarioCustom) => {
              _schema = s;
            },
            setView: (v: ViewType) => {
              currentView = v;
            },
            setStepIndex: (idx: number) => {
              currentStepIndex = idx;
            },
            setConditionIndex: (idx: number) => {
              currentConditionIndex = idx;
            },
            setPage: (p: number) => {
              page = p;
            },
            setSelectingFor: (f: typeof selectingFor) => {
              selectingFor = f;
            },
          });
        }

        // Handle role select menus
        if (i.isRoleSelectMenu()) {
          const roleId = i.values[0];
          if (selectingFor === "action_role") {
            _schema.steps[currentStepIndex].action.roleId = roleId;
          }
          currentView = "action";
          await i.deferUpdate();
          await updateMessage();
        }

        // Handle channel select menus
        if (i.isChannelSelectMenu()) {
          const channelId = i.values[0];
          if (selectingFor === "action_channel") {
            _schema.steps[currentStepIndex].action.channelId = channelId;
          }
          currentView = "action";
          await i.deferUpdate();
          await updateMessage();
        }
      } catch (error) {
        console.error("[Scenario Command] Error:", error);
      }
    });

    collector.on("end", async () => {
      try {
        await interaction.editReply({ components: [] });
      } catch {}
    });
  },
} as SlashCommand;

// Handler context interface
interface HandlerContext {
  client: Client;
  lang: string;
  guild: Guild;
  interaction?: ChatInputCommandInteraction;
  _schema: ScenarioCustom;
  currentView: ViewType;
  currentStepIndex: number;
  currentConditionIndex: number;
  page: number;
  _search?: string;
  selectingFor:
    | "trigger"
    | "action_modal"
    | "action_embed"
    | "action_role"
    | "action_channel"
    | "dm_embed";
  updateMessage: (files?: any[]) => Promise<void>;
  setSchema: (s: ScenarioCustom) => void;
  setView: (v: ViewType) => void;
  setStepIndex: (idx: number) => void;
  setConditionIndex: (idx: number) => void;
  setPage: (p: number) => void;
  setSearch?: (s: string) => void;
  setSelectingFor: (
    f: "trigger" | "action_modal" | "action_embed" | "action_role" | "action_channel" | "dm_embed",
  ) => void;
}

// String Select Menu Handler
async function handleStringSelectMenu(i: any, ctx: HandlerContext) {
  const {
    client,
    lang,
    guild,
    _schema,
    updateMessage,
    setSchema,
    setView,
    setStepIndex,
    setConditionIndex,
    setPage,
    setSearch,
    setSelectingFor,
  } = ctx;

  switch (i.customId) {
    case "NI_scenario:base":
      if (i.values[0] === "create") {
        const scenarios = await getScenarios(guild);
        if (scenarios.length >= SCENARIO_LIMITS.MAX_SCENARIOS_PER_GUILD) {
          await i.reply({
            content: `❌ ${(t(client, lang, "commands.scenario.messages.max_scenarios")).replace("{0}", String(SCENARIO_LIMITS.MAX_SCENARIOS_PER_GUILD))}`,
            flags: MessageFlagsBitField.Flags.Ephemeral,
          });
          return;
        }
        await i.deferUpdate();
        setSchema(schemaDefault(generateID(guild.guild.id, "scenario")));
        setView("edit");
      } else if (i.values[0] === "edit") {
        await i.deferUpdate();
        setView("list");
      }
      await updateMessage();
      break;

    case "NI_scenario:select":
      await i.deferUpdate();
      const scenarios = await getScenarios(guild);
      const selected = scenarios.find((s) => s.id === i.values[0]);
      if (selected) {
        setSchema(JSON.parse(JSON.stringify(selected)));
        setView("edit");
      }
      await updateMessage();
      break;

    case "NI_scenario:edit_menu":
      switch (i.values[0]) {
        case "trigger":
          await i.deferUpdate();
          setView("trigger");
          await updateMessage();
          return;
        case "steps":
          await i.deferUpdate();
          setView("steps");
          await updateMessage();
          return;
        case "restrictions":
          await i.deferUpdate();
          setView("restrictions");
          await updateMessage();
          return;
        case "name": {
          const result = await showTextModal(i, "name", client, lang, _schema.name);
          if (result.submitted) {
            _schema.name = result.value || "Unnamed Scenario";
            _schema.updatedAt = Date.now();
            setSchema({ ..._schema });
            await updateMessage();
          }
          return;
        }
        case "description": {
          const result = await showTextModal(i, "description", client, lang, _schema.description);
          if (result.submitted) {
            _schema.description = result.value || "N\\A";
            setSchema({ ..._schema });
            await updateMessage();
          }
          return;
        }
        case "toggle":
          await i.deferUpdate();
          _schema.enabled = !_schema.enabled;
          _schema.updatedAt = Date.now();
          setSchema({ ..._schema });
          await updateMessage();
          return;
      }
      break;

    case "NI_scenario:trigger_type":
      await i.deferUpdate();
      _schema.trigger.type = i.values[0] as ScenarioTriggerType;
      _schema.trigger.componentId = "";
      setSchema({ ..._schema });
      await updateMessage();
      break;

    case "NI_scenario:trigger_component":
      await i.deferUpdate();
      _schema.trigger.componentId = i.values[0];
      setSchema({ ..._schema });
      await updateMessage();
      break;

    case "NI_scenario:steps_select":
      if (i.values[0] === "add") {
        if (_schema.steps.length >= SCENARIO_LIMITS.MAX_STEPS_PER_SCENARIO) {
          await i.reply({
            content: `❌ ${(t(client, lang, "commands.scenario.messages.max_steps")).replace("{0}", String(SCENARIO_LIMITS.MAX_STEPS_PER_SCENARIO))}`,
            flags: MessageFlagsBitField.Flags.Ephemeral,
          });
          return;
        }
        await i.deferUpdate();
        const newStep = stepDefault(generateID(guild.guild.id, "step"), _schema.steps.length);
        _schema.steps.push(newStep);
        setStepIndex(_schema.steps.length - 1);
        setSchema({ ..._schema });
        setView("step_edit");
      } else {
        await i.deferUpdate();
        setStepIndex(parseInt(i.values[0]));
        setView("step_edit");
      }
      await updateMessage();
      break;

    case "NI_scenario:action_type":
      await i.deferUpdate();
      _schema.steps[ctx.currentStepIndex].action.type = i.values[0] as ScenarioActionType;
      setSchema({ ..._schema });
      await updateMessage();
      break;

    case "NI_scenario:action_component":
      await i.deferUpdate();
      const actionType = _schema.steps[ctx.currentStepIndex].action.type;
      if (actionType === "show_modal") {
        _schema.steps[ctx.currentStepIndex].action.modalId = i.values[0];
      } else if (actionType === "send_embed") {
        _schema.steps[ctx.currentStepIndex].action.embedId = i.values[0];
      } else if (actionType === "send_dm" && ctx.selectingFor === "dm_embed") {
        _schema.steps[ctx.currentStepIndex].action.dmEmbedId = i.values[0];
      }
      setSchema({ ..._schema });
      setView("action");
      await updateMessage();
      break;

    case "NI_scenario:conditions_select":
      await i.deferUpdate();
      if (i.values[0] === "add") {
        _schema.steps[ctx.currentStepIndex].conditions =
          _schema.steps[ctx.currentStepIndex].conditions || [];
        _schema.steps[ctx.currentStepIndex].conditions!.push(conditionDefault());
        setConditionIndex(_schema.steps[ctx.currentStepIndex].conditions!.length - 1);
        setSchema({ ..._schema });
        setView("condition_edit");
      } else {
        setConditionIndex(parseInt(i.values[0]));
        setView("condition_edit");
      }
      await updateMessage();
      break;

    case "NI_scenario:condition_type":
      await i.deferUpdate();
      _schema.steps[ctx.currentStepIndex].conditions![ctx.currentConditionIndex].type = i
        .values[0] as any;
      setSchema({ ..._schema });
      await updateMessage();
      break;

    case "NI_scenario:condition_operator":
      await i.deferUpdate();
      _schema.steps[ctx.currentStepIndex].conditions![ctx.currentConditionIndex].operator = i
        .values[0] as ScenarioConditionOperator;
      setSchema({ ..._schema });
      await updateMessage();
      break;

    case "NI_scenario:condition_logic":
      await i.deferUpdate();
      _schema.steps[ctx.currentStepIndex].conditionLogic = i.values[0] as "and" | "or";
      setSchema({ ..._schema });
      await updateMessage();
      break;

    case "NI_scenario:next_step":
      await i.deferUpdate();
      _schema.steps[ctx.currentStepIndex].onSuccess =
        i.values[0] === "none" ? undefined : i.values[0];
      setSchema({ ..._schema });
      await updateMessage();
      break;

    case "NI_scenario:fail_step":
      await i.deferUpdate();
      _schema.steps[ctx.currentStepIndex].onFailure =
        i.values[0] === "none" ? undefined : i.values[0];
      setSchema({ ..._schema });
      await updateMessage();
      break;
  }
}

// Button Handler
async function handleButton(i: any, ctx: HandlerContext) {
  const {
    client,
    lang,
    guild,
    interaction,
    _schema,
    currentView,
    updateMessage,
    setSchema,
    setView,
    setStepIndex,
    setConditionIndex,
    setPage,
    setSelectingFor,
  } = ctx;

  switch (i.customId) {
    case "NI_scenario:back":
      await i.deferUpdate();
      if (currentView === "condition_edit") {
        setView("conditions");
      } else if (currentView === "conditions") {
        setView("step_edit");
      } else if (currentView === "action") {
        setView("step_edit");
      } else if (currentView === "step_edit") {
        setView("steps");
      } else if (
        currentView === "steps" ||
        currentView === "trigger" ||
        currentView === "restrictions"
      ) {
        setView("edit");
      } else if (
        currentView === "select_component" ||
        currentView === "select_role" ||
        currentView === "select_channel"
      ) {
        setView("action");
      } else if (currentView === "edit" || currentView === "list") {
        setView("main");
        setSchema(schemaDefault(generateID(guild.guild.id, "scenario")));
      }
      await updateMessage();
      break;

    case "NI_scenario:save":
      await i.deferUpdate();
      if (!_schema.trigger.componentId) {
        await i.followUp({
          content: `❌ ${t(client, lang, "commands.scenario.messages.no_trigger")}`,
          flags: MessageFlagsBitField.Flags.Ephemeral,
        });
        return;
      }
      if (_schema.steps.length === 0) {
        await i.followUp({
          content: `❌ ${t(client, lang, "commands.scenario.messages.no_steps")}`,
          flags: MessageFlagsBitField.Flags.Ephemeral,
        });
        return;
      }

      _schema.updatedAt = Date.now();
      const scenarios = await getScenarios(guild);
      const existingIndex = scenarios.findIndex((s) => s.id === _schema.id);
      if (existingIndex !== -1) {
        scenarios[existingIndex] = _schema;
      } else {
        _schema.createdAt = Date.now();
        scenarios.push(_schema);
      }
      await setScenarios(guild, scenarios);
      setView("main");
      setSchema(schemaDefault(generateID(guild.guild.id, "scenario")));
      await updateMessage();
      break;

    case "NI_scenario:delete":
      await i.deferUpdate();
      const allScenarios = await getScenarios(guild);
      const filtered = allScenarios.filter((s) => s.id !== _schema.id);
      await setScenarios(guild, filtered);
      setView("main");
      setSchema(schemaDefault(generateID(guild.guild.id, "scenario")));
      await updateMessage();
      break;

    case "NI_scenario:page_prev":
      await i.deferUpdate();
      setPage(Math.max(0, ctx.page - 1));
      await updateMessage();
      break;

    case "NI_scenario:page_next":
      await i.deferUpdate();
      const totalScenarios = await getScenarios(guild);
      const maxPage = Math.ceil(totalScenarios.length / 25) - 1;
      setPage(Math.min(maxPage, ctx.page + 1));
      await updateMessage();
      break;

    case "NI_scenario:search": {
      const result = await showSearchModal(i, client, lang);
      if (result.submitted) {
        ctx.setSearch?.(result.value || "");
        setPage(0);
        await updateMessage();
      }
      break;
    }

    // Step edit buttons
    case "NI_scenario:step_action":
      setView("action");
      await i.deferUpdate();
      await updateMessage();
      break;

    case "NI_scenario:step_conditions":
      setView("conditions");
      await i.deferUpdate();
      await updateMessage();
      break;

    case "NI_scenario:step_name": {
      const result = await showTextModal(
        i,
        "step_name",
        client,
        lang,
        _schema.steps[ctx.currentStepIndex]?.name,
      );
      if (result.submitted && _schema.steps[ctx.currentStepIndex]) {
        _schema.steps[ctx.currentStepIndex].name =
          result.value || `Step ${ctx.currentStepIndex + 1}`;
        _schema.updatedAt = Date.now();
        setSchema({ ..._schema });
        await updateMessage();
      }
      break;
    }

    case "NI_scenario:step_delete":
      await i.deferUpdate();
      _schema.steps.splice(ctx.currentStepIndex, 1);
      // Reorder steps
      _schema.steps.forEach((step, idx) => {
        step.order = idx;
      });
      setSchema({ ..._schema });
      setView("steps");
      await updateMessage();
      break;

    case "NI_scenario:step_up":
      await i.deferUpdate();
      if (ctx.currentStepIndex > 0) {
        const temp = _schema.steps[ctx.currentStepIndex];
        _schema.steps[ctx.currentStepIndex] = _schema.steps[ctx.currentStepIndex - 1];
        _schema.steps[ctx.currentStepIndex - 1] = temp;
        _schema.steps.forEach((step, idx) => {
          step.order = idx;
        });
        setStepIndex(ctx.currentStepIndex - 1);
        setSchema({ ..._schema });
      }
      await updateMessage();
      break;

    case "NI_scenario:step_down":
      await i.deferUpdate();
      if (ctx.currentStepIndex < _schema.steps.length - 1) {
        const temp = _schema.steps[ctx.currentStepIndex];
        _schema.steps[ctx.currentStepIndex] = _schema.steps[ctx.currentStepIndex + 1];
        _schema.steps[ctx.currentStepIndex + 1] = temp;
        _schema.steps.forEach((step, idx) => {
          step.order = idx;
        });
        setStepIndex(ctx.currentStepIndex + 1);
        setSchema({ ..._schema });
      }
      await updateMessage();
      break;

    case "NI_scenario:step_stop_failure":
      await i.deferUpdate();
      _schema.steps[ctx.currentStepIndex].stopOnFailure =
        !_schema.steps[ctx.currentStepIndex].stopOnFailure;
      setSchema({ ..._schema });
      await updateMessage();
      break;

    // Action buttons
    case "NI_scenario:action_content": {
      const result = await showTextModal(
        i,
        "action_content",
        client,
        lang,
        _schema.steps[ctx.currentStepIndex]?.action?.content,
      );
      if (result.submitted && _schema.steps[ctx.currentStepIndex]) {
        _schema.steps[ctx.currentStepIndex].action.content = result.value || undefined;
        _schema.updatedAt = Date.now();
        setSchema({ ..._schema });
        await updateMessage();
      }
      break;
    }

    case "NI_scenario:action_ephemeral":
      await i.deferUpdate();
      _schema.steps[ctx.currentStepIndex].action.ephemeral =
        !_schema.steps[ctx.currentStepIndex].action.ephemeral;
      setSchema({ ..._schema });
      await updateMessage();
      break;

    case "NI_scenario:action_select_modal":
      await i.deferUpdate();
      setSelectingFor("action_modal");
      setView("select_component");
      await updateMessage();
      break;

    case "NI_scenario:action_select_embed":
      await i.deferUpdate();
      setSelectingFor("action_embed");
      setView("select_component");
      await updateMessage();
      break;

    case "NI_scenario:action_select_role":
      await i.deferUpdate();
      setSelectingFor("action_role");
      setView("select_role");
      await updateMessage();
      break;

    case "NI_scenario:action_select_channel":
      await i.deferUpdate();
      setSelectingFor("action_channel");
      setView("select_channel");
      await updateMessage();
      break;

    case "NI_scenario:action_thread_name": {
      const result = await showTextModal(
        i,
        "thread_name",
        client,
        lang,
        _schema.steps[ctx.currentStepIndex]?.action?.threadName,
      );
      if (result.submitted && _schema.steps[ctx.currentStepIndex]) {
        _schema.steps[ctx.currentStepIndex].action.threadName = result.value || undefined;
        _schema.updatedAt = Date.now();
        setSchema({ ..._schema });
        await updateMessage();
      }
      break;
    }

    case "NI_scenario:action_dm_content": {
      const result = await showTextModal(
        i,
        "dm_content",
        client,
        lang,
        _schema.steps[ctx.currentStepIndex]?.action?.dmContent,
      );
      if (result.submitted && _schema.steps[ctx.currentStepIndex]) {
        _schema.steps[ctx.currentStepIndex].action.dmContent = result.value || undefined;
        _schema.updatedAt = Date.now();
        setSchema({ ..._schema });
        await updateMessage();
      }
      break;
    }

    case "NI_scenario:action_dm_embed":
      await i.deferUpdate();
      setSelectingFor("dm_embed");
      setView("select_component");
      await updateMessage();
      break;

    case "NI_scenario:action_var_name": {
      const result = await showTextModal(
        i,
        "var_name",
        client,
        lang,
        _schema.steps[ctx.currentStepIndex]?.action?.variableName,
      );
      if (result.submitted && _schema.steps[ctx.currentStepIndex]) {
        _schema.steps[ctx.currentStepIndex].action.variableName = result.value || undefined;
        _schema.updatedAt = Date.now();
        setSchema({ ..._schema });
        await updateMessage();
      }
      break;
    }

    case "NI_scenario:action_var_value": {
      const result = await showTextModal(
        i,
        "var_value",
        client,
        lang,
        _schema.steps[ctx.currentStepIndex]?.action?.variableValue,
      );
      if (result.submitted && _schema.steps[ctx.currentStepIndex]) {
        _schema.steps[ctx.currentStepIndex].action.variableValue = result.value || undefined;
        _schema.updatedAt = Date.now();
        setSchema({ ..._schema });
        await updateMessage();
      }
      break;
    }

    case "NI_scenario:action_delete_original":
      await i.deferUpdate();
      _schema.steps[ctx.currentStepIndex].action.deleteOriginal =
        !_schema.steps[ctx.currentStepIndex].action.deleteOriginal;
      setSchema({ ..._schema });
      await updateMessage();
      break;

    // Condition buttons
    case "NI_scenario:condition_value": {
      const result = await showTextModal(
        i,
        "condition_value",
        client,
        lang,
        _schema.steps[ctx.currentStepIndex]?.conditions?.[ctx.currentConditionIndex]?.value,
      );
      if (
        result.submitted &&
        _schema.steps[ctx.currentStepIndex]?.conditions?.[ctx.currentConditionIndex]
      ) {
        _schema.steps[ctx.currentStepIndex].conditions![ctx.currentConditionIndex].value =
          result.value || "";
        _schema.updatedAt = Date.now();
        setSchema({ ..._schema });
        await updateMessage();
      }
      break;
    }

    case "NI_scenario:condition_field": {
      const result = await showTextModal(
        i,
        "condition_field",
        client,
        lang,
        _schema.steps[ctx.currentStepIndex]?.conditions?.[ctx.currentConditionIndex]?.field,
      );
      if (
        result.submitted &&
        _schema.steps[ctx.currentStepIndex]?.conditions?.[ctx.currentConditionIndex]
      ) {
        _schema.steps[ctx.currentStepIndex].conditions![ctx.currentConditionIndex].field =
          result.value || undefined;
        _schema.updatedAt = Date.now();
        setSchema({ ..._schema });
        await updateMessage();
      }
      break;
    }

    case "NI_scenario:condition_delete":
      await i.deferUpdate();
      _schema.steps[ctx.currentStepIndex].conditions?.splice(ctx.currentConditionIndex, 1);
      setSchema({ ..._schema });
      setView("conditions");
      await updateMessage();
      break;

    // Restrictions buttons
    case "NI_scenario:cooldown": {
      const result = await showTextModal(
        i,
        "cooldown",
        client,
        lang,
        String(_schema.cooldown || 0),
      );
      if (result.submitted) {
        _schema.cooldown = parseInt(result.value || "0") || 0;
        _schema.updatedAt = Date.now();
        setSchema({ ..._schema });
        await updateMessage();
      }
      break;
    }

    case "NI_scenario:max_executions": {
      const result = await showTextModal(
        i,
        "max_executions",
        client,
        lang,
        String(_schema.maxExecutionsPerUser || 0),
      );
      if (result.submitted) {
        _schema.maxExecutionsPerUser = parseInt(result.value || "0") || undefined;
        _schema.updatedAt = Date.now();
        setSchema({ ..._schema });
        await updateMessage();
      }
      break;
    }

    case "NI_scenario:execution_period": {
      const result = await showTextModal(
        i,
        "execution_period",
        client,
        lang,
        String(_schema.executionPeriod || 0),
      );
      if (result.submitted) {
        _schema.executionPeriod = parseInt(result.value || "0") || undefined;
        _schema.updatedAt = Date.now();
        setSchema({ ..._schema });
        await updateMessage();
      }
      break;
    }
  }
}

// Modal Submit Handler

// Modal show helpers
async function showTextModal(
  interaction: any,
  field: string,
  client: Client,
  lang: string,
  currentValue?: string,
): Promise<{ value: string | null; submitted: boolean }> {
  const titles: Record<string, string> = {
    name: t(client, lang, "commands.scenario.modals.name.title"),
    description: t(client, lang, "commands.scenario.modals.description.title"),
    search: t(client, lang, "commands.scenario.modals.search.title"),
    step_name: t(client, lang, "commands.scenario.modals.step_name.title"),
    action_content: t(client, lang, "commands.scenario.modals.action_content.title"),
    thread_name: t(client, lang, "commands.scenario.modals.thread_name.title"),
    dm_content: t(client, lang, "commands.scenario.modals.dm_content.title"),
    var_name: t(client, lang, "commands.scenario.modals.var_name.title"),
    var_value: t(client, lang, "commands.scenario.modals.var_value.title"),
    condition_value: t(client, lang, "commands.scenario.modals.condition_value.title"),
    condition_field: t(client, lang, "commands.scenario.modals.condition_field.title"),
    cooldown: t(client, lang, "commands.scenario.modals.cooldown.title"),
    max_executions: t(client, lang, "commands.scenario.modals.max_executions.title"),
    execution_period: t(client, lang, "commands.scenario.modals.execution_period.title"),
  };

  const labels: Record<string, string> = {
    name: t(client, lang, "commands.scenario.modals.name.label"),
    description: t(client, lang, "commands.scenario.modals.description.label"),
    search: t(client, lang, "commands.scenario.modals.search.label"),
    step_name: t(client, lang, "commands.scenario.modals.step_name.label"),
    action_content: t(client, lang, "commands.scenario.modals.action_content.label"),
    thread_name: t(client, lang, "commands.scenario.modals.thread_name.label"),
    dm_content: t(client, lang, "commands.scenario.modals.dm_content.label"),
    var_name: t(client, lang, "commands.scenario.modals.var_name.label"),
    var_value: t(client, lang, "commands.scenario.modals.var_value.label"),
    condition_value: t(client, lang, "commands.scenario.modals.condition_value.label"),
    condition_field: t(client, lang, "commands.scenario.modals.condition_field.label"),
    cooldown: t(client, lang, "commands.scenario.modals.cooldown.label"),
    max_executions: t(client, lang, "commands.scenario.modals.max_executions.label"),
    execution_period: t(client, lang, "commands.scenario.modals.execution_period.label"),
  };

  const isLong = ["description", "action_content", "dm_content", "var_value"].includes(field);
  const modalId = `NI_scenario:modal:${field}:${Date.now()}`;

  const modal = new ModalBuilder()
    .setTitle(titles[field] || field)
    .setCustomId(modalId)
    .setLabelComponents(
      new LabelBuilder().setLabel(labels[field] || field).setTextInputComponent(
        new TextInputBuilder()
          .setCustomId("NI_scenario:input")
          .setStyle(isLong ? TextInputStyle.Paragraph : TextInputStyle.Short)
          .setRequired(false)
          .setValue(currentValue || "")
          .setMaxLength(isLong ? 2000 : 100),
      ),
    );

  await interaction.showModal(modal);

  try {
    const submitted = await interaction.awaitModalSubmit({
      filter: (i: any) => i.customId === modalId && i.user.id === interaction.user.id,
      time: 300000,
    });

    await submitted.deferUpdate();
    const value = submitted.fields.getTextInputValue("NI_scenario:input") || null;
    return { value, submitted: true };
  } catch {
    return { value: null, submitted: false };
  }
}

async function showSearchModal(
  interaction: any,
  client: Client,
  lang: string,
): Promise<{ value: string | null; submitted: boolean }> {
  const modalId = `NI_scenario:modal:search:${Date.now()}`;

  const modal = new ModalBuilder()
    .setTitle(t(client, lang, "commands.scenario.modals.search.title"))
    .setCustomId(modalId)
    .setLabelComponents(
      new LabelBuilder()
        .setLabel(t(client, lang, "commands.scenario.modals.search.label"))
        .setTextInputComponent(
          new TextInputBuilder()
            .setCustomId("NI_scenario:input")

            .setStyle(TextInputStyle.Short)
            .setRequired(false)
            .setMaxLength(100),
        ),
    );

  await interaction.showModal(modal);

  try {
    const submitted = await interaction.awaitModalSubmit({
      filter: (i: any) => i.customId === modalId && i.user.id === interaction.user.id,
      time: 300000,
    });

    await submitted.deferUpdate();
    const value = submitted.fields.getTextInputValue("NI_scenario:input") || null;
    return { value, submitted: true };
  } catch {
    return { value: null, submitted: false };
  }
}

// Build embed function
async function buildEmbed(
  client: Client,
  lang: string,
  schema: ScenarioCustom,
  view: ViewType,
  stepIndex: number,
  conditionIndex: number,
  guild: Guild,
): Promise<EmbedBuilder> {
  const embed = new EmbedBuilder().setColor(client.holder.colors.default);

  switch (view) {
    case "main":
      embed
        .setTitle(t(client, lang, "commands.scenario.embeds.main.title"))
        .setDescription(t(client, lang, "commands.scenario.embeds.main.description"));
      break;

    case "list":
      embed
        .setTitle(t(client, lang, "commands.scenario.embeds.list.title"))
        .setDescription(t(client, lang, "commands.scenario.embeds.list.description"));
      break;

    case "edit":
      embed
        .setTitle(
          t(client, lang, "commands.scenario.embeds.edit.title").replace("{0}", schema.name),
        )
        .setDescription(schema.description || "N\\A")
        .addFields(
          {
            name: t(client, lang, "commands.scenario.embeds.edit.fields.status"),
            value: schema.enabled ? "✅" : "❌",
            inline: true,
          },
          {
            name: t(client, lang, "commands.scenario.embeds.edit.fields.steps"),
            value: String(schema.steps.length),
            inline: true,
          },
          {
            name: t(client, lang, "commands.scenario.embeds.edit.fields.trigger"),
            value: schema.trigger.componentId
              ? `${schema.trigger.type}: \`${schema.trigger.componentId}\``
              : t(client, lang, "commands.send.fields.not_set"),
            inline: true,
          },
          {
            name: t(client, lang, "commands.scenario.embeds.edit.fields.cooldown"),
            value: schema.cooldown
              ? `${schema.cooldown}s`
              : t(client, lang, "commands.send.fields.none"),
            inline: true,
          },
          {
            name: t(client, lang, "commands.scenario.embeds.edit.fields.id"),
            value: `\`${schema.id}\``,
            inline: true,
          },
        );
      break;

    case "trigger":
      embed
        .setTitle(t(client, lang, "commands.scenario.embeds.trigger.title"))
        .setDescription(t(client, lang, "commands.scenario.embeds.trigger.description"))
        .addFields(
          {
            name: t(client, lang, "commands.scenario.embeds.trigger.fields.type"),
            value:
              t(client, lang, `commands.scenario.trigger_types.${schema.trigger.type}`) ||
              schema.trigger.type,
            inline: true,
          },
          {
            name: t(client, lang, "commands.scenario.embeds.trigger.fields.component_id"),
            value: schema.trigger.componentId || t(client, lang, "commands.send.fields.not_set"),
            inline: true,
          },
        );
      break;

    case "steps":
      embed
        .setTitle(t(client, lang, "commands.scenario.embeds.steps.title"))
        .setDescription(t(client, lang, "commands.scenario.embeds.steps.description"));
      if (schema.steps.length > 0) {
        schema.steps.forEach((step, idx) => {
          const actionLabel =
            t(client, lang, `commands.scenario.action_types.${step.action.type}`) ||
            step.action.type;
          embed.addFields({
            name: `${idx + 1}. ${step.name || `Step ${idx + 1}`}`,
            value: `Action: ${actionLabel}\nConditions: ${step.conditions?.length || 0}`,
            inline: true,
          });
        });
      } else {
        embed.addFields({
          name: t(client, lang, "commands.scenario.embeds.steps.fields.no_steps"),
          value: t(client, lang, "commands.scenario.embeds.steps.fields.add_step"),
        });
      }
      break;

    case "step_edit":
      const step = schema.steps[stepIndex];
      if (step) {
        const actionLabel =
          t(client, lang, `commands.scenario.action_types.${step.action.type}`) || step.action.type;
        embed
          .setTitle(
            t(client, lang, "commands.scenario.embeds.step_edit.title")
              .replace("{0}", String(stepIndex + 1))
              .replace("{1}", step.name || "Unnamed"),
          )
          .setDescription(t(client, lang, "commands.scenario.embeds.step_edit.description"))
          .addFields(
            {
              name: t(client, lang, "commands.scenario.embeds.step_edit.fields.action_type"),
              value: actionLabel,
              inline: true,
            },
            {
              name: t(client, lang, "commands.scenario.embeds.step_edit.fields.conditions"),
              value: String(step.conditions?.length || 0),
              inline: true,
            },
            {
              name: t(client, lang, "commands.scenario.embeds.step_edit.fields.stop_on_failure"),
              value: step.stopOnFailure ? "✅" : "❌",
              inline: true,
            },
            {
              name: t(client, lang, "commands.scenario.embeds.step_edit.fields.on_success"),
              value: step.onSuccess
                ? `Step ID: ${step.onSuccess}`
                : t(client, lang, "commands.scenario.select_menus.next_step.continue"),
              inline: true,
            },
            {
              name: t(client, lang, "commands.scenario.embeds.step_edit.fields.on_failure"),
              value: step.onFailure
                ? `Step ID: ${step.onFailure}`
                : t(client, lang, "commands.scenario.select_menus.next_step.continue"),
              inline: true,
            },
          );
      }
      break;

    case "action":
      const currentStep = schema.steps[stepIndex];
      if (currentStep) {
        const action = currentStep.action;
        const actionLabel =
          t(client, lang, `commands.scenario.action_types.${action.type}`) || action.type;
        embed
          .setTitle(
            t(client, lang, "commands.scenario.embeds.action.title").replace("{0}", actionLabel),
          )
          .setDescription(t(client, lang, "commands.scenario.embeds.action.description"));

        const notSet = t(client, lang, "commands.send.fields.not_set");
        const currentChannel = t(
          client,
          lang,
          "commands.scenario.embeds.action.fields.current_channel",
        );

        switch (action.type) {
          case "reply":
          case "send_message":
            embed.addFields(
              {
                name: t(client, lang, "commands.scenario.embeds.action.fields.content"),
                value: action.content || notSet,
                inline: false,
              },
              {
                name: t(client, lang, "commands.scenario.embeds.action.fields.ephemeral"),
                value: action.ephemeral ? "✅" : "❌",
                inline: true,
              },
              {
                name: t(client, lang, "commands.scenario.embeds.action.fields.channel"),
                value: action.channelId ? `<#${action.channelId}>` : currentChannel,
                inline: true,
              },
            );
            break;
          case "send_embed":
            embed.addFields(
              {
                name: t(client, lang, "commands.scenario.embeds.action.fields.embed_id"),
                value: action.embedId || notSet,
                inline: true,
              },
              {
                name: t(client, lang, "commands.scenario.embeds.action.fields.ephemeral"),
                value: action.ephemeral ? "✅" : "❌",
                inline: true,
              },
              {
                name: t(client, lang, "commands.scenario.embeds.action.fields.channel"),
                value: action.channelId ? `<#${action.channelId}>` : currentChannel,
                inline: true,
              },
            );
            break;
          case "show_modal":
            embed.addFields({
              name: t(client, lang, "commands.scenario.embeds.action.fields.modal_id"),
              value: action.modalId || notSet,
              inline: true,
            });
            break;
          case "add_role":
          case "remove_role":
            embed.addFields({
              name: t(client, lang, "commands.scenario.embeds.action.fields.role"),
              value: action.roleId ? `<@&${action.roleId}>` : notSet,
              inline: true,
            });
            break;
          case "create_thread":
            embed.addFields(
              {
                name: t(client, lang, "commands.scenario.embeds.action.fields.thread_name"),
                value: action.threadName || notSet,
                inline: true,
              },
              {
                name: t(client, lang, "commands.scenario.embeds.action.fields.auto_archive"),
                value: `${action.autoArchiveDuration || 1440} minutes`,
                inline: true,
              },
            );
            break;
          case "send_dm":
            embed.addFields(
              {
                name: t(client, lang, "commands.scenario.embeds.action.fields.dm_content"),
                value: action.dmContent || notSet,
                inline: false,
              },
              {
                name: t(client, lang, "commands.scenario.embeds.action.fields.dm_embed"),
                value: action.dmEmbedId || t(client, lang, "commands.send.fields.none"),
                inline: true,
              },
            );
            break;
          case "set_variable":
            embed.addFields(
              {
                name: t(client, lang, "commands.scenario.embeds.action.fields.variable_name"),
                value: action.variableName || notSet,
                inline: true,
              },
              {
                name: t(client, lang, "commands.scenario.embeds.action.fields.variable_value"),
                value: action.variableValue || notSet,
                inline: true,
              },
            );
            break;
          case "delete_message":
            embed.addFields({
              name: t(client, lang, "commands.scenario.embeds.action.fields.delete_original"),
              value: action.deleteOriginal ? "✅" : "❌",
              inline: true,
            });
            break;
        }
      }
      break;

    case "conditions":
      const condStep = schema.steps[stepIndex];
      const condLogic =
        condStep?.conditionLogic === "or"
          ? t(client, lang, "commands.scenario.embeds.conditions.description_or")
          : t(client, lang, "commands.scenario.embeds.conditions.description_and");
      embed
        .setTitle(t(client, lang, "commands.scenario.embeds.conditions.title"))
        .setDescription(condLogic);
      if (condStep?.conditions && condStep.conditions.length > 0) {
        condStep.conditions.forEach((cond, idx) => {
          const opLabel =
            t(client, lang, `commands.scenario.condition_operators.${cond.operator}`) ||
            cond.operator;
          embed.addFields({
            name: `${t(client, lang, "commands.scenario.embeds.condition_edit.title")}`.replace(
              "{0}",
              String(idx + 1),
            ),
            value: `${t(client, lang, "commands.scenario.embeds.condition_edit.fields.type")}: ${cond.type}${cond.field ? ` (${cond.field})` : ""}\n${t(client, lang, "commands.scenario.embeds.condition_edit.fields.operator")}: ${opLabel}\n${t(client, lang, "commands.scenario.embeds.condition_edit.fields.value")}: ${cond.value || t(client, lang, "commands.send.fields.not_set")}`,
            inline: true,
          });
        });
      } else {
        embed.addFields({
          name: "ℹ️",
          value: t(client, lang, "commands.scenario.embeds.conditions.fields.no_conditions"),
        });
      }
      break;

    case "condition_edit":
      const condition = schema.steps[stepIndex]?.conditions?.[conditionIndex];
      if (condition) {
        const opLabel =
          t(client, lang, `commands.scenario.condition_operators.${condition.operator}`) ||
          condition.operator;
        embed
          .setTitle(
            t(client, lang, "commands.scenario.embeds.condition_edit.title").replace(
              "{0}",
              String(conditionIndex + 1),
            ),
          )
          .addFields(
            {
              name: t(client, lang, "commands.scenario.embeds.condition_edit.fields.type"),
              value: condition.type,
              inline: true,
            },
            {
              name: t(client, lang, "commands.scenario.embeds.condition_edit.fields.field"),
              value: condition.field || "N/A",
              inline: true,
            },
            {
              name: t(client, lang, "commands.scenario.embeds.condition_edit.fields.operator"),
              value: opLabel,
              inline: true,
            },
            {
              name: t(client, lang, "commands.scenario.embeds.condition_edit.fields.value"),
              value: condition.value || t(client, lang, "commands.send.fields.not_set"),
              inline: true,
            },
          );
      }
      break;

    case "restrictions":
      embed
        .setTitle(t(client, lang, "commands.scenario.embeds.restrictions.title"))
        .setDescription(t(client, lang, "commands.scenario.embeds.restrictions.description"))
        .addFields(
          {
            name: t(client, lang, "commands.scenario.embeds.restrictions.fields.cooldown"),
            value: schema.cooldown
              ? `${schema.cooldown}s`
              : t(client, lang, "commands.send.fields.none"),
            inline: true,
          },
          {
            name: t(client, lang, "commands.scenario.embeds.restrictions.fields.max_executions"),
            value: schema.maxExecutionsPerUser
              ? String(schema.maxExecutionsPerUser)
              : t(client, lang, "commands.scenario.embeds.restrictions.fields.unlimited"),
            inline: true,
          },
          {
            name: t(client, lang, "commands.scenario.embeds.restrictions.fields.execution_period"),
            value: schema.executionPeriod
              ? `${schema.executionPeriod}s`
              : t(client, lang, "commands.scenario.embeds.restrictions.fields.na"),
            inline: true,
          },
          {
            name: t(client, lang, "commands.scenario.embeds.restrictions.fields.allowed_roles"),
            value: schema.allowedRoles?.length
              ? schema.allowedRoles.map((r) => `<@&${r}>`).join(", ")
              : t(client, lang, "commands.scenario.embeds.restrictions.fields.everyone"),
            inline: false,
          },
          {
            name: t(client, lang, "commands.scenario.embeds.restrictions.fields.denied_roles"),
            value: schema.deniedRoles?.length
              ? schema.deniedRoles.map((r) => `<@&${r}>`).join(", ")
              : t(client, lang, "commands.send.fields.none"),
            inline: false,
          },
        );
      break;

    case "select_component":
      embed
        .setTitle(t(client, lang, "commands.scenario.embeds.select_component.title"))
        .setDescription(t(client, lang, "commands.scenario.embeds.select_component.description"));
      break;

    case "select_role":
      embed
        .setTitle(t(client, lang, "commands.scenario.embeds.select_role.title"))
        .setDescription(t(client, lang, "commands.scenario.embeds.select_role.description"));
      break;

    case "select_channel":
      embed
        .setTitle(t(client, lang, "commands.scenario.embeds.select_channel.title"))
        .setDescription(t(client, lang, "commands.scenario.embeds.select_channel.description"));
      break;
  }

  return embed;
}

// Build components function
async function buildComponents(
  client: Client,
  lang: string,
  schema: ScenarioCustom,
  view: ViewType,
  stepIndex: number,
  conditionIndex: number,
  allScenarios: ScenarioCustom[],
  page: number,
  search: string,
  guild: Guild,
  selectingFor: string,
): Promise<ActionRowBuilder<MessageActionRowComponentBuilder>[]> {
  const rows: ActionRowBuilder<MessageActionRowComponentBuilder>[] = [];

  switch (view) {
    case "main":
      rows.push(
        new ActionRowBuilder<MessageActionRowComponentBuilder>().setComponents(
          new StringSelectMenuBuilder()
            .setCustomId("NI_scenario:base")
            .setPlaceholder(t(client, lang, "commands.scenario.select_menus.base.placeholder"))
            .setOptions(
              new StringSelectMenuOptionBuilder()
                .setValue("create")
                .setLabel(t(client, lang, "commands.scenario.select_menus.base.options.create"))
                .setEmoji("➕"),
              new StringSelectMenuOptionBuilder()
                .setValue("edit")
                .setLabel(t(client, lang, "commands.scenario.select_menus.base.options.edit"))
                .setEmoji("📝"),
            ),
        ),
      );
      break;

    case "list":
      let scenarioList = [...allScenarios];
      if (search) {
        const fuseSearch = new fuse(scenarioList, { keys: ["name", "description"] });
        scenarioList = fuseSearch.search(search).map((r) => r.item);
      }

      const selectMenu = new StringSelectMenuBuilder()
        .setCustomId("NI_scenario:select")
        .setPlaceholder(t(client, lang, "commands.scenario.select_menus.list.placeholder"));

      if (scenarioList.length > 0) {
        scenarioList.slice(page * 25, page * 25 + 25).forEach((s) => {
          selectMenu.addOptions(
            new StringSelectMenuOptionBuilder()
              .setValue(s.id)
              .setLabel(s.name)
              .setDescription(`${s.enabled ? "✅" : "❌"} | ${s.steps.length} steps`),
          );
        });
      } else {
        selectMenu
          .addOptions(
            new StringSelectMenuOptionBuilder()
              .setValue("none")
              .setLabel(t(client, lang, "commands.scenario.select_menus.list.no_scenarios")),
          )
          .setDisabled(true);
      }

      rows.push(new ActionRowBuilder<MessageActionRowComponentBuilder>().setComponents(selectMenu));
      rows.push(
        new ActionRowBuilder<MessageActionRowComponentBuilder>().setComponents(
          new ButtonBuilder()
            .setCustomId("NI_scenario:page_prev")
            .setEmoji("⬅️")
            .setStyle(ButtonStyle.Primary)
            .setDisabled(page === 0),
          new ButtonBuilder()
            .setCustomId("NI_scenario:page_info")
            .setLabel(`${page + 1}/${Math.ceil(allScenarios.length / 25) || 1}`)
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(true),
          new ButtonBuilder()
            .setCustomId("NI_scenario:search")
            .setEmoji("🔍")
            .setStyle(ButtonStyle.Secondary),
          new ButtonBuilder()
            .setCustomId("NI_scenario:page_next")
            .setEmoji("➡️")
            .setStyle(ButtonStyle.Primary)
            .setDisabled(page >= Math.ceil(allScenarios.length / 25) - 1),
          new ButtonBuilder()
            .setCustomId("NI_scenario:back")
            .setEmoji("🔙")
            .setStyle(ButtonStyle.Secondary),
        ),
      );
      break;

    case "edit":
      rows.push(
        new ActionRowBuilder<MessageActionRowComponentBuilder>().setComponents(
          new StringSelectMenuBuilder()
            .setCustomId("NI_scenario:edit_menu")
            .setPlaceholder(t(client, lang, "commands.scenario.select_menus.edit.placeholder"))
            .setOptions(
              new StringSelectMenuOptionBuilder()
                .setValue("name")
                .setLabel(t(client, lang, "commands.scenario.select_menus.edit.options.name"))
                .setEmoji("🏷️"),
              new StringSelectMenuOptionBuilder()
                .setValue("description")
                .setLabel(
                  t(client, lang, "commands.scenario.select_menus.edit.options.description"),
                )
                .setEmoji("📄"),
              new StringSelectMenuOptionBuilder()
                .setValue("trigger")
                .setLabel(t(client, lang, "commands.scenario.select_menus.edit.options.trigger"))
                .setEmoji("🎯"),
              new StringSelectMenuOptionBuilder()
                .setValue("steps")
                .setLabel(t(client, lang, "commands.scenario.select_menus.edit.options.steps"))
                .setEmoji("📝"),
              new StringSelectMenuOptionBuilder()
                .setValue("restrictions")
                .setLabel(
                  t(client, lang, "commands.scenario.select_menus.edit.options.restrictions"),
                )
                .setEmoji("🔒"),
              new StringSelectMenuOptionBuilder()
                .setValue("toggle")
                .setLabel(
                  schema.enabled
                    ? t(client, lang, "commands.scenario.select_menus.edit.options.disable")
                    : t(client, lang, "commands.scenario.select_menus.edit.options.enable"),
                )
                .setEmoji(schema.enabled ? "❌" : "✅"),
            ),
        ),
      );
      rows.push(
        new ActionRowBuilder<MessageActionRowComponentBuilder>().setComponents(
          new ButtonBuilder()
            .setCustomId("NI_scenario:save")
            .setLabel(t(client, lang, "commands.scenario.buttons.save"))
            .setStyle(ButtonStyle.Success)
            .setEmoji("💾"),
          new ButtonBuilder()
            .setCustomId("NI_scenario:delete")
            .setLabel(t(client, lang, "commands.scenario.buttons.delete"))
            .setStyle(ButtonStyle.Danger)
            .setEmoji("🗑️"),
          new ButtonBuilder()
            .setCustomId("NI_scenario:back")
            .setLabel(t(client, lang, "commands.scenario.buttons.back"))
            .setStyle(ButtonStyle.Secondary)
            .setEmoji("🔙"),
        ),
      );
      break;

    case "trigger":
      rows.push(
        new ActionRowBuilder<MessageActionRowComponentBuilder>().setComponents(
          new StringSelectMenuBuilder()
            .setCustomId("NI_scenario:trigger_type")
            .setPlaceholder(
              t(client, lang, "commands.scenario.select_menus.trigger_type.placeholder"),
            )
            .setOptions(
              TRIGGER_TYPES.map((tt) =>
                new StringSelectMenuOptionBuilder()
                  .setValue(tt.value)
                  .setLabel(
                    t(client, lang, `commands.scenario.trigger_types.${tt.value}`) || tt.label,
                  )
                  .setEmoji(tt.emoji)
                  .setDefault(schema.trigger.type === tt.value),
              ),
            ),
        ),
      );

      // Component selection based on trigger type
      const components = await getComponentsForTrigger(schema.trigger.type, guild);
      if (components.length > 0) {
        const compSelect = new StringSelectMenuBuilder()
          .setCustomId("NI_scenario:trigger_component")
          .setPlaceholder(
            t(client, lang, "commands.scenario.select_menus.trigger_component.placeholder"),
          );
        components.slice(0, 25).forEach((c) => {
          compSelect.addOptions(
            new StringSelectMenuOptionBuilder()
              .setValue(c.id)
              .setLabel(c.name)
              .setDescription(`ID: ${c.id}`)
              .setDefault(schema.trigger.componentId === c.id),
          );
        });
        rows.push(
          new ActionRowBuilder<MessageActionRowComponentBuilder>().setComponents(compSelect),
        );
      }

      rows.push(
        new ActionRowBuilder<MessageActionRowComponentBuilder>().setComponents(
          new ButtonBuilder()
            .setCustomId("NI_scenario:back")
            .setLabel(t(client, lang, "commands.scenario.buttons.back"))
            .setStyle(ButtonStyle.Secondary)
            .setEmoji("🔙"),
        ),
      );
      break;

    case "steps":
      const stepsMenu = new StringSelectMenuBuilder()
        .setCustomId("NI_scenario:steps_select")
        .setPlaceholder(t(client, lang, "commands.scenario.select_menus.steps.placeholder"));

      schema.steps.forEach((stp, idx) => {
        const actionLabel =
          t(client, lang, `commands.scenario.action_types.${stp.action.type}`) || stp.action.type;
        stepsMenu.addOptions(
          new StringSelectMenuOptionBuilder()
            .setValue(String(idx))
            .setLabel(`${idx + 1}. ${stp.name || `Step ${idx + 1}`}`)
            .setDescription(actionLabel),
        );
      });

      if (schema.steps.length < SCENARIO_LIMITS.MAX_STEPS_PER_SCENARIO) {
        stepsMenu.addOptions(
          new StringSelectMenuOptionBuilder()
            .setValue("add")
            .setLabel(t(client, lang, "commands.scenario.select_menus.steps.add"))
            .setEmoji("➕"),
        );
      }

      if (stepsMenu.options.length === 0) {
        stepsMenu.addOptions(
          new StringSelectMenuOptionBuilder()
            .setValue("add")
            .setLabel(t(client, lang, "commands.scenario.select_menus.steps.add"))
            .setEmoji("➕"),
        );
      }

      rows.push(new ActionRowBuilder<MessageActionRowComponentBuilder>().setComponents(stepsMenu));
      rows.push(
        new ActionRowBuilder<MessageActionRowComponentBuilder>().setComponents(
          new ButtonBuilder()
            .setCustomId("NI_scenario:back")
            .setLabel(t(client, lang, "commands.scenario.buttons.back"))
            .setStyle(ButtonStyle.Secondary)
            .setEmoji("🔙"),
        ),
      );
      break;

    case "step_edit":
      rows.push(
        new ActionRowBuilder<MessageActionRowComponentBuilder>().setComponents(
          new ButtonBuilder()
            .setCustomId("NI_scenario:step_name")
            .setLabel(t(client, lang, "commands.scenario.buttons.step_name"))
            .setStyle(ButtonStyle.Secondary)
            .setEmoji("🏷️"),
          new ButtonBuilder()
            .setCustomId("NI_scenario:step_action")
            .setLabel(t(client, lang, "commands.scenario.buttons.step_action"))
            .setStyle(ButtonStyle.Primary)
            .setEmoji("⚡"),
          new ButtonBuilder()
            .setCustomId("NI_scenario:step_conditions")
            .setLabel(t(client, lang, "commands.scenario.buttons.step_conditions"))
            .setStyle(ButtonStyle.Primary)
            .setEmoji("🔀"),
        ),
      );

      // Next step selection
      const nextStepMenu = new StringSelectMenuBuilder()
        .setCustomId("NI_scenario:next_step")
        .setPlaceholder(t(client, lang, "commands.scenario.select_menus.next_step.placeholder"))
        .addOptions(
          new StringSelectMenuOptionBuilder()
            .setValue("none")
            .setLabel(t(client, lang, "commands.scenario.select_menus.next_step.continue"))
            .setDefault(!schema.steps[stepIndex]?.onSuccess),
        );
      schema.steps.forEach((s, idx) => {
        if (idx !== stepIndex) {
          nextStepMenu.addOptions(
            new StringSelectMenuOptionBuilder()
              .setValue(s.id)
              .setLabel(`${idx + 1}. ${s.name || `Step ${idx + 1}`}`)
              .setDefault(schema.steps[stepIndex]?.onSuccess === s.id),
          );
        }
      });
      if (nextStepMenu.options.length > 1) {
        rows.push(
          new ActionRowBuilder<MessageActionRowComponentBuilder>().setComponents(nextStepMenu),
        );
      }

      rows.push(
        new ActionRowBuilder<MessageActionRowComponentBuilder>().setComponents(
          new ButtonBuilder()
            .setCustomId("NI_scenario:step_up")
            .setEmoji("⬆️")
            .setStyle(ButtonStyle.Primary)
            .setDisabled(stepIndex === 0),
          new ButtonBuilder()
            .setCustomId("NI_scenario:step_down")
            .setEmoji("⬇️")
            .setStyle(ButtonStyle.Primary)
            .setDisabled(stepIndex >= schema.steps.length - 1),
          new ButtonBuilder()
            .setCustomId("NI_scenario:step_stop_failure")
            .setLabel(t(client, lang, "commands.scenario.buttons.stop_on_fail"))
            .setStyle(
              schema.steps[stepIndex]?.stopOnFailure ? ButtonStyle.Success : ButtonStyle.Secondary,
            ),
          new ButtonBuilder()
            .setCustomId("NI_scenario:step_delete")
            .setLabel(t(client, lang, "commands.scenario.buttons.delete"))
            .setStyle(ButtonStyle.Danger)
            .setEmoji("🗑️"),
          new ButtonBuilder()
            .setCustomId("NI_scenario:back")
            .setEmoji("🔙")
            .setStyle(ButtonStyle.Secondary),
        ),
      );
      break;

    case "action":
      const actionType = schema.steps[stepIndex]?.action?.type;

      // Action type selection
      rows.push(
        new ActionRowBuilder<MessageActionRowComponentBuilder>().setComponents(
          new StringSelectMenuBuilder()
            .setCustomId("NI_scenario:action_type")
            .setPlaceholder(
              t(client, lang, "commands.scenario.select_menus.action_type.placeholder"),
            )
            .setOptions(
              ACTION_TYPES.map((a) =>
                new StringSelectMenuOptionBuilder()
                  .setValue(a.value)
                  .setLabel(t(client, lang, `commands.scenario.action_types.${a.value}`) || a.label)
                  .setEmoji(a.emoji)
                  .setDefault(actionType === a.value),
              ),
            ),
        ),
      );

      // Action-specific buttons
      const actionButtons: ButtonBuilder[] = [];
      switch (actionType) {
        case "reply":
        case "send_message":
          actionButtons.push(
            new ButtonBuilder()
              .setCustomId("NI_scenario:action_content")
              .setLabel(t(client, lang, "commands.scenario.buttons.action_content"))
              .setStyle(ButtonStyle.Secondary)
              .setEmoji("📝"),
            new ButtonBuilder()
              .setCustomId("NI_scenario:action_ephemeral")
              .setLabel(t(client, lang, "commands.scenario.buttons.action_ephemeral"))
              .setStyle(
                schema.steps[stepIndex]?.action?.ephemeral
                  ? ButtonStyle.Success
                  : ButtonStyle.Secondary,
              )
              .setEmoji("👁️"),
          );
          if (actionType === "send_message") {
            actionButtons.push(
              new ButtonBuilder()
                .setCustomId("NI_scenario:action_select_channel")
                .setLabel(t(client, lang, "commands.scenario.buttons.action_channel"))
                .setStyle(ButtonStyle.Secondary)
                .setEmoji("📺"),
            );
          }
          break;
        case "send_embed":
          actionButtons.push(
            new ButtonBuilder()
              .setCustomId("NI_scenario:action_select_embed")
              .setLabel(t(client, lang, "commands.scenario.buttons.action_select_embed"))
              .setStyle(ButtonStyle.Secondary)
              .setEmoji("📋"),
            new ButtonBuilder()
              .setCustomId("NI_scenario:action_ephemeral")
              .setLabel(t(client, lang, "commands.scenario.buttons.action_ephemeral"))
              .setStyle(
                schema.steps[stepIndex]?.action?.ephemeral
                  ? ButtonStyle.Success
                  : ButtonStyle.Secondary,
              )
              .setEmoji("👁️"),
            new ButtonBuilder()
              .setCustomId("NI_scenario:action_select_channel")
              .setLabel(t(client, lang, "commands.scenario.buttons.action_channel"))
              .setStyle(ButtonStyle.Secondary)
              .setEmoji("📺"),
          );
          break;
        case "show_modal":
          actionButtons.push(
            new ButtonBuilder()
              .setCustomId("NI_scenario:action_select_modal")
              .setLabel(t(client, lang, "commands.scenario.buttons.action_select_modal"))
              .setStyle(ButtonStyle.Secondary)
              .setEmoji("📝"),
          );
          break;
        case "add_role":
        case "remove_role":
          actionButtons.push(
            new ButtonBuilder()
              .setCustomId("NI_scenario:action_select_role")
              .setLabel(t(client, lang, "commands.scenario.buttons.action_select_role"))
              .setStyle(ButtonStyle.Secondary)
              .setEmoji("👥"),
          );
          break;
        case "create_thread":
          actionButtons.push(
            new ButtonBuilder()
              .setCustomId("NI_scenario:action_thread_name")
              .setLabel(t(client, lang, "commands.scenario.buttons.action_thread_name"))
              .setStyle(ButtonStyle.Secondary)
              .setEmoji("🧵"),
          );
          break;
        case "send_dm":
          actionButtons.push(
            new ButtonBuilder()
              .setCustomId("NI_scenario:action_dm_content")
              .setLabel(t(client, lang, "commands.scenario.buttons.action_dm_content"))
              .setStyle(ButtonStyle.Secondary)
              .setEmoji("✉️"),
            new ButtonBuilder()
              .setCustomId("NI_scenario:action_dm_embed")
              .setLabel(t(client, lang, "commands.scenario.buttons.action_dm_embed"))
              .setStyle(ButtonStyle.Secondary)
              .setEmoji("📋"),
          );
          break;
        case "set_variable":
          actionButtons.push(
            new ButtonBuilder()
              .setCustomId("NI_scenario:action_var_name")
              .setLabel(t(client, lang, "commands.scenario.buttons.action_var_name"))
              .setStyle(ButtonStyle.Secondary)
              .setEmoji("📦"),
            new ButtonBuilder()
              .setCustomId("NI_scenario:action_var_value")
              .setLabel(t(client, lang, "commands.scenario.buttons.action_var_value"))
              .setStyle(ButtonStyle.Secondary)
              .setEmoji("✏️"),
          );
          break;
        case "delete_message":
          actionButtons.push(
            new ButtonBuilder()
              .setCustomId("NI_scenario:action_delete_original")
              .setLabel(t(client, lang, "commands.scenario.buttons.action_delete_original"))
              .setStyle(
                schema.steps[stepIndex]?.action?.deleteOriginal
                  ? ButtonStyle.Success
                  : ButtonStyle.Secondary,
              )
              .setEmoji("🗑️"),
          );
          break;
      }

      if (actionButtons.length > 0) {
        rows.push(
          new ActionRowBuilder<MessageActionRowComponentBuilder>().setComponents(
            ...actionButtons.slice(0, 5),
          ),
        );
      }

      rows.push(
        new ActionRowBuilder<MessageActionRowComponentBuilder>().setComponents(
          new ButtonBuilder()
            .setCustomId("NI_scenario:back")
            .setLabel(t(client, lang, "commands.scenario.buttons.back"))
            .setStyle(ButtonStyle.Secondary)
            .setEmoji("🔙"),
        ),
      );
      break;

    case "conditions":
      const conditionsMenu = new StringSelectMenuBuilder()
        .setCustomId("NI_scenario:conditions_select")
        .setPlaceholder(t(client, lang, "commands.scenario.select_menus.conditions.placeholder"));

      const stepConditions = schema.steps[stepIndex]?.conditions || [];
      stepConditions.forEach((cond, idx) => {
        const opLabel =
          t(client, lang, `commands.scenario.condition_operators.${cond.operator}`) ||
          cond.operator;
        conditionsMenu.addOptions(
          new StringSelectMenuOptionBuilder()
            .setValue(String(idx))
            .setLabel(`${idx + 1}. ${cond.type} ${opLabel}`)
            .setDescription(cond.value || t(client, lang, "commands.send.fields.not_set")),
        );
      });
      conditionsMenu.addOptions(
        new StringSelectMenuOptionBuilder()
          .setValue("add")
          .setLabel(t(client, lang, "commands.scenario.select_menus.conditions.add"))
          .setEmoji("➕"),
      );

      rows.push(
        new ActionRowBuilder<MessageActionRowComponentBuilder>().setComponents(conditionsMenu),
      );

      // Logic toggle
      rows.push(
        new ActionRowBuilder<MessageActionRowComponentBuilder>().setComponents(
          new StringSelectMenuBuilder()
            .setCustomId("NI_scenario:condition_logic")
            .setPlaceholder(
              t(client, lang, "commands.scenario.select_menus.condition_logic.placeholder"),
            )
            .setOptions(
              new StringSelectMenuOptionBuilder()
                .setValue("and")
                .setLabel(t(client, lang, "commands.scenario.select_menus.condition_logic.and"))
                .setDefault(schema.steps[stepIndex]?.conditionLogic !== "or"),
              new StringSelectMenuOptionBuilder()
                .setValue("or")
                .setLabel(t(client, lang, "commands.scenario.select_menus.condition_logic.or"))
                .setDefault(schema.steps[stepIndex]?.conditionLogic === "or"),
            ),
        ),
      );

      rows.push(
        new ActionRowBuilder<MessageActionRowComponentBuilder>().setComponents(
          new ButtonBuilder()
            .setCustomId("NI_scenario:back")
            .setLabel(t(client, lang, "commands.scenario.buttons.back"))
            .setStyle(ButtonStyle.Secondary)
            .setEmoji("🔙"),
        ),
      );
      break;

    case "condition_edit":
      // Type selection
      rows.push(
        new ActionRowBuilder<MessageActionRowComponentBuilder>().setComponents(
          new StringSelectMenuBuilder()
            .setCustomId("NI_scenario:condition_type")
            .setPlaceholder(
              t(client, lang, "commands.scenario.select_menus.condition_type.placeholder"),
            )
            .setOptions(
              new StringSelectMenuOptionBuilder()
                .setValue("user")
                .setLabel("User")
                .setDescription("Check user properties"),
              new StringSelectMenuOptionBuilder()
                .setValue("input")
                .setLabel("Input")
                .setDescription("Check modal input value"),
              new StringSelectMenuOptionBuilder()
                .setValue("variable")
                .setLabel("Variable")
                .setDescription("Check custom variable"),
              new StringSelectMenuOptionBuilder()
                .setValue("selected")
                .setLabel("Selected")
                .setDescription("Check selected value"),
              new StringSelectMenuOptionBuilder()
                .setValue("role")
                .setLabel("Role")
                .setDescription("Check user roles"),
              new StringSelectMenuOptionBuilder()
                .setValue("channel")
                .setLabel("Channel")
                .setDescription("Check current channel"),
            ),
        ),
      );

      // Operator selection
      rows.push(
        new ActionRowBuilder<MessageActionRowComponentBuilder>().setComponents(
          new StringSelectMenuBuilder()
            .setCustomId("NI_scenario:condition_operator")
            .setPlaceholder(
              t(client, lang, "commands.scenario.select_menus.condition_operator.placeholder"),
            )
            .setOptions(
              CONDITION_OPERATORS.map((o) =>
                new StringSelectMenuOptionBuilder()
                  .setValue(o.value)
                  .setLabel(
                    t(client, lang, `commands.scenario.condition_operators.${o.value}`) || o.label,
                  )
                  .setDefault(
                    schema.steps[stepIndex]?.conditions?.[conditionIndex]?.operator === o.value,
                  ),
              ),
            ),
        ),
      );

      rows.push(
        new ActionRowBuilder<MessageActionRowComponentBuilder>().setComponents(
          new ButtonBuilder()
            .setCustomId("NI_scenario:condition_field")
            .setLabel(t(client, lang, "commands.scenario.buttons.condition_field"))
            .setStyle(ButtonStyle.Secondary)
            .setEmoji("📋"),
          new ButtonBuilder()
            .setCustomId("NI_scenario:condition_value")
            .setLabel(t(client, lang, "commands.scenario.buttons.condition_value"))
            .setStyle(ButtonStyle.Secondary)
            .setEmoji("✏️"),
          new ButtonBuilder()
            .setCustomId("NI_scenario:condition_delete")
            .setLabel(t(client, lang, "commands.scenario.buttons.delete"))
            .setStyle(ButtonStyle.Danger)
            .setEmoji("🗑️"),
          new ButtonBuilder()
            .setCustomId("NI_scenario:back")
            .setEmoji("🔙")
            .setStyle(ButtonStyle.Secondary),
        ),
      );
      break;

    case "restrictions":
      rows.push(
        new ActionRowBuilder<MessageActionRowComponentBuilder>().setComponents(
          new ButtonBuilder()
            .setCustomId("NI_scenario:cooldown")
            .setLabel(t(client, lang, "commands.scenario.buttons.cooldown"))
            .setStyle(ButtonStyle.Secondary)
            .setEmoji("⏱️"),
          new ButtonBuilder()
            .setCustomId("NI_scenario:max_executions")
            .setLabel(t(client, lang, "commands.scenario.buttons.max_uses"))
            .setStyle(ButtonStyle.Secondary)
            .setEmoji("🔢"),
          new ButtonBuilder()
            .setCustomId("NI_scenario:execution_period")
            .setLabel(t(client, lang, "commands.scenario.buttons.period"))
            .setStyle(ButtonStyle.Secondary)
            .setEmoji("📅"),
        ),
      );
      rows.push(
        new ActionRowBuilder<MessageActionRowComponentBuilder>().setComponents(
          new ButtonBuilder()
            .setCustomId("NI_scenario:back")
            .setLabel(t(client, lang, "commands.scenario.buttons.back"))
            .setStyle(ButtonStyle.Secondary)
            .setEmoji("🔙"),
        ),
      );
      break;

    case "select_component":
      let componentList: { id: string; name: string }[] = [];
      if (selectingFor === "action_modal") {
        const modals = await getModals(guild);
        componentList = modals.map((m) => ({ id: m.id, name: m.title }));
      } else if (selectingFor === "action_embed" || selectingFor === "dm_embed") {
        const embeds = await getEmbeds(guild);
        componentList = embeds.map((e) => ({ id: e.id, name: e.name || e.title || "Unnamed" }));
      }

      if (componentList.length > 0) {
        const compMenu = new StringSelectMenuBuilder()
          .setCustomId("NI_scenario:action_component")
          .setPlaceholder(
            t(client, lang, "commands.scenario.select_menus.action_component.placeholder"),
          );
        componentList.slice(0, 25).forEach((c) => {
          compMenu.addOptions(
            new StringSelectMenuOptionBuilder()
              .setValue(c.id)
              .setLabel(c.name)
              .setDescription(`ID: ${c.id}`),
          );
        });
        rows.push(new ActionRowBuilder<MessageActionRowComponentBuilder>().setComponents(compMenu));
      }

      rows.push(
        new ActionRowBuilder<MessageActionRowComponentBuilder>().setComponents(
          new ButtonBuilder()
            .setCustomId("NI_scenario:back")
            .setLabel(t(client, lang, "commands.scenario.buttons.back"))
            .setStyle(ButtonStyle.Secondary)
            .setEmoji("🔙"),
        ),
      );
      break;

    case "select_role":
      rows.push(
        new ActionRowBuilder<MessageActionRowComponentBuilder>().setComponents(
          new RoleSelectMenuBuilder()
            .setCustomId("NI_scenario:role_select")
            .setPlaceholder(t(client, lang, "commands.scenario.embeds.select_role.description")),
        ),
      );
      rows.push(
        new ActionRowBuilder<MessageActionRowComponentBuilder>().setComponents(
          new ButtonBuilder()
            .setCustomId("NI_scenario:back")
            .setLabel(t(client, lang, "commands.scenario.buttons.back"))
            .setStyle(ButtonStyle.Secondary)
            .setEmoji("🔙"),
        ),
      );
      break;

    case "select_channel":
      rows.push(
        new ActionRowBuilder<MessageActionRowComponentBuilder>().setComponents(
          new ChannelSelectMenuBuilder()
            .setCustomId("NI_scenario:channel_select")
            .setPlaceholder(t(client, lang, "commands.scenario.embeds.select_channel.description"))
            .setChannelTypes(ChannelType.GuildText),
        ),
      );
      rows.push(
        new ActionRowBuilder<MessageActionRowComponentBuilder>().setComponents(
          new ButtonBuilder()
            .setCustomId("NI_scenario:back")
            .setLabel(t(client, lang, "commands.scenario.buttons.back"))
            .setStyle(ButtonStyle.Secondary)
            .setEmoji("🔙"),
        ),
      );
      break;
  }

  return rows;
}

// Helper to get components based on trigger type
async function getComponentsForTrigger(
  type: ScenarioTriggerType,
  guild: Guild,
): Promise<{ id: string; name: string }[]> {
  switch (type) {
    case "button":
      const buttons = await getButtons(guild);
      return buttons.map((b) => ({ id: b.id, name: b.name || b.label }));
    case "select_menu":
      const menus = await getSelectMenus(guild);
      return menus.map((m) => ({ id: m.id, name: m.name || m.placeholder || "Unnamed" }));
    case "modal_submit":
      const modals = await getModals(guild);
      return modals.map((m) => ({ id: m.id, name: m.title }));
    default:
      return [];
  }
}
