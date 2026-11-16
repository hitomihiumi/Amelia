import {
  ActionRowBuilder,
  type MessageActionRowComponentBuilder,
  type MessageCreateOptions,
  PermissionFlagsBits,
} from "discord.js";
import {
  type ButtonCustom,
  type EmbedCustom,
  LAYOUT_LIMITS,
  type LayoutCustom,
  type ModalCustom,
  SCENARIO_LIMITS,
  type ScenarioCustom,
  type SelectMenuCustom,
} from "../../../types/helpers";
import { generateID } from "../../../handlers/functions";
import { CustomButton } from "../../custom/CustomButton";
import { CustomEmbed } from "../../custom/CustomEmbed";
import { buildLayoutPayload } from "../../custom/CustomLayout";
import { CustomSelectMenu } from "../../custom/CustomSelectMenu";
import { awaitedComponentIds } from "../../custom/scenarioFlow";
import { parseLoose, resolveChannel, resolveRole } from "./spec";
import type { ComponentKind, GuildStore, SendOp, StepResult, ToolContext } from "./types";

/**
 * Custom components (`/custom …` and the dashboard's builder) for the AI: embeds, buttons, select
 * menus, modals and scenarios can be created, changed and deleted, layouts can be listed and sent.
 * The checks are the ones the dashboard runs when it saves, so nothing the AI stores is something
 * the builder would refuse.
 */

interface KindInfo {
  /** Where the collection is stored. */
  path: string;
  /** The middle part of a generated id (`CI_<token>_<guild>_<random>`). */
  token: string;
  max: number;
  /** What the model has to know to write one. */
  schema: string;
}

const PLACEHOLDERS =
  "Texts may use placeholders: {user.mention} {user.name} {user.displayName} {user.avatar} {guild.name} {guild.icon} {channel.mention} {date} {time}";

export const COMPONENT_KINDS: Record<ComponentKind, KindInfo> = {
  embed: {
    path: "utils.components.embed",
    token: "embed",
    max: 25,
    schema: `{name, title?, description?, color? "#RRGGBB", author? {name, icon_url?, url?}, thumbnail? link, image? link, fields? [{name, value, inline?}] (≤25), footer? {text, icon_url?}, timestamp? bool}. Needs a title, a description, fields or an image. ${PLACEHOLDERS}`,
  },
  button: {
    path: "utils.components.buttons",
    token: "btn",
    max: 25,
    schema:
      "{name, label ≤80, style PRIMARY|SECONDARY|SUCCESS|DANGER|LINK, emoji?, url? (LINK only, required for it), disabled?}. A button does something only when a scenario uses it as its trigger.",
  },
  select_menu: {
    path: "utils.components.selectMenus",
    token: "select",
    max: 25,
    schema:
      "{name, placeholder? ≤150, minValues?, maxValues?, disabled?, options: [{label ≤100, value ≤100, description? ≤100, emoji?, default?}] (1..25, unique values)}",
  },
  modal: {
    path: "utils.components.modals",
    token: "modal",
    max: 25,
    schema:
      "{title ≤45, fields: [{name ≤45, type short|long, placeholder? ≤100, min?, max? ≤4000, required bool}] (1..5)}. Scenarios read the answers by position: {input.0}, {input.1} …",
  },
  scenario: {
    path: "utils.components.scenarios",
    token: "scenario",
    max: SCENARIO_LIMITS.MAX_SCENARIOS_PER_GUILD,
    schema: `{name, description?, enabled bool, trigger: {type button|select_menu|modal_submit, componentId} | null, steps: [{id, name?, action, conditions? [condition], conditionLogic? and|or, onSuccess? stepId, onFailure? stepId, stopOnFailure? bool, onInteraction? {componentId: stepId}}] (1..${SCENARIO_LIMITS.MAX_STEPS_PER_SCENARIO}), cooldown? seconds, maxExecutionsPerUser?, executionPeriod? seconds, allowedRoles? [roleId], deniedRoles? [roleId], allowedChannels? [channelId], variables? {name: text}}.
Steps run in order; give each a short unique id. action is one of:
 {type: "reply"|"send_message"|"edit_message", content?, embeds? [embedId], buttons? [buttonId], selectMenus? [menuId], layoutId?, channelId? (send_message only, default the same channel), ephemeral? (reply)}
 {type: "send_dm", content?, embeds? [embedId]}
 {type: "show_modal", modalId}
 {type: "add_role"|"remove_role", roleId}
 {type: "create_thread", threadName, autoArchiveDuration? 60|1440|4320|10080}
 {type: "set_variable", variableName, variableValue}
 {type: "delete_message", deleteOriginal? bool, deleteDelay? ms}
condition: {type user|input|variable|role|channel|selected, field? (input: answer index "0"; variable: its name), operator equals|not_equals|contains|not_contains|starts_with|ends_with|greater_than|less_than|has_role|not_has_role|in_channel|not_in_channel|is_empty|is_not_empty, value}
onInteraction continues the scenario when the member answers a modal or presses a button/menu that this step showed.
Extra placeholders: {input.0} {input.0.label} {selected.value} {selected.label} {var.<name>}. ${PLACEHOLDERS}`,
  },
  layout: {
    path: "utils.components.layouts",
    token: "layout",
    max: LAYOUT_LIMITS.MAX_LAYOUTS_PER_GUILD,
    schema:
      "Layouts (Components V2) are built in the dashboard. Here they can only be listed, sent and deleted.",
  },
};

export const WRITABLE_KINDS: ComponentKind[] = [
  "embed",
  "button",
  "select_menu",
  "modal",
  "scenario",
];

/** The components of a server as they will be once the changes queued so far are confirmed. */
export class ComponentLibrary {
  private lists = new Map<ComponentKind, any[]>();
  constructor(private guild: GuildStore) {}

  async items(kind: ComponentKind): Promise<any[]> {
    let list = this.lists.get(kind);
    if (!list) {
      const stored = await this.guild.get(COMPONENT_KINDS[kind].path);
      list = Array.isArray(stored) ? [...stored] : [];
      this.lists.set(kind, list);
    }
    return list;
  }

  async find(kind: ComponentKind, id: string): Promise<any | null> {
    return (await this.items(kind)).find((item) => item.id === id) ?? null;
  }

  async put(kind: ComponentKind, item: { id: string }): Promise<void> {
    const list = await this.items(kind);
    const index = list.findIndex((existing) => existing.id === item.id);
    if (index >= 0) list[index] = item;
    else list.push(item);
  }

  async remove(kind: ComponentKind, id: string): Promise<boolean> {
    const list = await this.items(kind);
    const index = list.findIndex((existing) => existing.id === id);
    if (index < 0) return false;
    list.splice(index, 1);
    return true;
  }

  /** Write one collection back. */
  async store(kind: ComponentKind): Promise<void> {
    await this.guild.set(COMPONENT_KINDS[kind].path, await this.items(kind));
  }
}

export function componentLabel(kind: ComponentKind, item: any): string {
  return String((kind === "modal" ? item?.title : item?.name) || item?.id || "?");
}

const LINK = /^https?:\/\/\S+$/i;
const PLACEHOLDER = /\{[\w.]+\}/;
const isLink = (value: unknown) =>
  typeof value === "string" && (LINK.test(value) || PLACEHOLDER.test(value));
const COLOR = /^#?[0-9a-f]{6}$/i;

const str = (value: unknown): string | undefined =>
  typeof value === "string" && value.trim()
    ? value
    : typeof value === "number"
      ? String(value)
      : undefined;
const flag = (value: unknown): boolean | undefined =>
  typeof value === "boolean" ? value : undefined;
const num = (value: unknown): number | undefined =>
  typeof value === "number" && Number.isFinite(value)
    ? value
    : typeof value === "string" && /^\d+$/.test(value.trim())
      ? Number(value)
      : undefined;
const strings = (value: unknown): string[] | undefined =>
  Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string" && item.length > 0)
    : undefined;

/** Drop the keys that are undefined, so a stored component has no noise in it. */
function compact<T extends Record<string, unknown>>(value: T): T {
  return Object.fromEntries(Object.entries(value).filter(([, item]) => item !== undefined)) as T;
}

type Checked<T> = { ok: true; item: T } | { ok: false; errors: string[] };

function checkEmbed(raw: any, id: string): Checked<EmbedCustom> {
  const errors: string[] = [];
  const fields = Array.isArray(raw.fields)
    ? raw.fields.map((field: any) =>
        compact({
          name: str(field?.name) ?? "",
          value: str(field?.value) ?? "",
          inline: flag(field?.inline),
        }),
      )
    : [];

  const item = compact({
    id,
    name: str(raw.name) ?? str(raw.title)?.slice(0, 100) ?? "Embed",
    title: str(raw.title),
    description: str(raw.description),
    color: str(raw.color),
    author: str(raw.author?.name)
      ? compact({
          name: str(raw.author.name)!,
          icon_url: str(raw.author.icon_url),
          url: str(raw.author.url),
        })
      : undefined,
    thumbnail: str(raw.thumbnail),
    fields,
    image: str(raw.image),
    footer: str(raw.footer?.text ?? (typeof raw.footer === "string" ? raw.footer : undefined))
      ? compact({
          text: str(raw.footer?.text ?? raw.footer)!,
          icon_url: str(raw.footer?.icon_url),
        })
      : undefined,
    timestamp: flag(raw.timestamp) ?? false,
  }) as EmbedCustom;

  if (item.name.length > 100) errors.push("name: at most 100 characters");
  if (item.title && item.title.length > 256) errors.push("title: at most 256 characters");
  if (item.description && item.description.length > 4096)
    errors.push("description: at most 4096 characters");
  if (item.color && !COLOR.test(String(item.color)))
    errors.push('color: expected a hex colour like "#5865F2"');
  if (item.color && !String(item.color).startsWith("#")) item.color = `#${item.color}` as any;
  if (item.author) {
    if (item.author.name.length > 256) errors.push("author.name: at most 256 characters");
    if (item.author.icon_url && !isLink(item.author.icon_url))
      errors.push("author.icon_url: expected a link");
    if (item.author.url && !isLink(item.author.url)) errors.push("author.url: expected a link");
  }
  if (item.image && !isLink(item.image)) errors.push("image: expected a link");
  if (item.thumbnail && !isLink(item.thumbnail)) errors.push("thumbnail: expected a link");
  if (item.footer) {
    if (item.footer.text.length > 2048) errors.push("footer.text: at most 2048 characters");
    if (item.footer.icon_url && !isLink(item.footer.icon_url))
      errors.push("footer.icon_url: expected a link");
  }
  if (fields.length > SCENARIO_LIMITS.MAX_EMBED_FIELDS) {
    errors.push(`fields: at most ${SCENARIO_LIMITS.MAX_EMBED_FIELDS}`);
  }
  fields.forEach((field: { name: string; value: string }, index: number) => {
    if (!field.name || field.name.length > 256)
      errors.push(`fields[${index}].name: 1 to 256 characters`);
    if (!field.value || field.value.length > 1024)
      errors.push(`fields[${index}].value: 1 to 1024 characters`);
  });
  if (!item.title && !item.description && fields.length === 0 && !item.image && !item.author) {
    errors.push("an embed needs a title, a description, fields or an image");
  }

  return errors.length > 0 ? { ok: false, errors } : { ok: true, item };
}

const BUTTON_STYLES = ["PRIMARY", "SECONDARY", "SUCCESS", "DANGER", "LINK"] as const;

function checkButton(raw: any, id: string): Checked<ButtonCustom> {
  const errors: string[] = [];
  const style = String(raw.style ?? "PRIMARY").toUpperCase() as ButtonCustom["style"];
  const item = compact({
    id,
    name: str(raw.name) ?? str(raw.label) ?? "Button",
    label: str(raw.label) ?? "",
    style,
    emoji: str(raw.emoji),
    url: str(raw.url),
    disabled: flag(raw.disabled) ?? false,
  }) as ButtonCustom;

  if (!item.label || item.label.length > 80) errors.push("label: 1 to 80 characters");
  if (item.name.length > 100) errors.push("name: at most 100 characters");
  if (!BUTTON_STYLES.includes(style)) errors.push(`style: one of ${BUTTON_STYLES.join(", ")}`);
  if (style === "LINK" && !item.url) errors.push("a LINK button needs a url");
  if (style === "LINK" && item.url && !isLink(item.url))
    errors.push("url: expected an http(s) link");
  if (style !== "LINK" && item.url) errors.push("only a LINK button can have a url");
  if (item.emoji && String(item.emoji).length > 64) errors.push("emoji: not an emoji");

  return errors.length > 0 ? { ok: false, errors } : { ok: true, item };
}

function checkSelectMenu(raw: any, id: string): Checked<SelectMenuCustom> {
  const errors: string[] = [];
  const options = Array.isArray(raw.options)
    ? raw.options.map((option: any) =>
        compact({
          label: str(option?.label) ?? "",
          value: str(option?.value) ?? str(option?.label) ?? "",
          description: str(option?.description),
          emoji: str(option?.emoji),
          default: flag(option?.default),
        }),
      )
    : [];

  const item = compact({
    id,
    name: str(raw.name) ?? str(raw.placeholder)?.slice(0, 100) ?? "Select menu",
    placeholder: str(raw.placeholder),
    minValues: num(raw.minValues),
    maxValues: num(raw.maxValues),
    disabled: flag(raw.disabled) ?? false,
    options,
  }) as SelectMenuCustom;

  if (item.name.length > 100) errors.push("name: at most 100 characters");
  if (item.placeholder && item.placeholder.length > 150)
    errors.push("placeholder: at most 150 characters");
  if (item.minValues != null && (item.minValues < 0 || item.minValues > 25))
    errors.push("minValues: 0 to 25");
  if (item.maxValues != null && (item.maxValues < 1 || item.maxValues > 25))
    errors.push("maxValues: 1 to 25");
  if (item.minValues != null && item.maxValues != null && item.minValues > item.maxValues) {
    errors.push("minValues cannot be above maxValues");
  }
  if (options.length === 0) errors.push("options: at least one");
  if (options.length > SCENARIO_LIMITS.MAX_SELECT_MENU_OPTIONS) {
    errors.push(`options: at most ${SCENARIO_LIMITS.MAX_SELECT_MENU_OPTIONS}`);
  }
  if (item.maxValues != null && item.maxValues > options.length && options.length > 0) {
    errors.push("maxValues cannot be above the number of options");
  }
  const seen = new Set<string>();
  options.forEach((option: any, index: number) => {
    if (!option.label || option.label.length > 100)
      errors.push(`options[${index}].label: 1 to 100 characters`);
    if (!option.value || option.value.length > 100)
      errors.push(`options[${index}].value: 1 to 100 characters`);
    if (seen.has(option.value))
      errors.push(`options[${index}].value: "${option.value}" is used twice`);
    seen.add(option.value);
    if (option.description && option.description.length > 100) {
      errors.push(`options[${index}].description: at most 100 characters`);
    }
  });

  return errors.length > 0 ? { ok: false, errors } : { ok: true, item };
}

function checkModal(raw: any, id: string, guildId: string): Checked<ModalCustom> {
  const errors: string[] = [];
  const fields = Array.isArray(raw.fields)
    ? raw.fields.map((field: any) =>
        compact({
          id: str(field?.id) ?? generateID(guildId, "field"),
          name: str(field?.name) ?? str(field?.label) ?? "",
          placeholder: str(field?.placeholder),
          type: field?.type === "long" || field?.type === "paragraph" ? "long" : "short",
          min: num(field?.min),
          max: num(field?.max),
          required: flag(field?.required) ?? true,
        }),
      )
    : [];

  const item = { id, title: str(raw.title) ?? str(raw.name) ?? "", fields } as ModalCustom;

  if (!item.title || item.title.length > 45) errors.push("title: 1 to 45 characters");
  if (fields.length === 0) errors.push("fields: at least one");
  if (fields.length > 5) errors.push("fields: at most 5");
  const seen = new Set<string>();
  fields.forEach((field: any, index: number) => {
    if (seen.has(field.id)) errors.push(`fields[${index}].id: used twice`);
    seen.add(field.id);
    if (!field.name || field.name.length > 45)
      errors.push(`fields[${index}].name: 1 to 45 characters`);
    if (field.placeholder && field.placeholder.length > 100) {
      errors.push(`fields[${index}].placeholder: at most 100 characters`);
    }
    if (field.min != null && (field.min < 0 || field.min > 4000))
      errors.push(`fields[${index}].min: 0 to 4000`);
    if (field.max != null && (field.max < 1 || field.max > 4000))
      errors.push(`fields[${index}].max: 1 to 4000`);
    if (field.min != null && field.max != null && field.min > field.max) {
      errors.push(`fields[${index}]: min cannot be above max`);
    }
  });

  return errors.length > 0 ? { ok: false, errors } : { ok: true, item };
}

const TRIGGER_KIND: Record<string, ComponentKind> = {
  button: "button",
  select_menu: "select_menu",
  modal_submit: "modal",
};

const ACTION_TYPES = new Set([
  "show_modal",
  "send_message",
  "send_embed",
  "add_role",
  "remove_role",
  "create_thread",
  "send_dm",
  "set_variable",
  "edit_message",
  "delete_message",
  "reply",
]);
const MESSAGE_ACTIONS = new Set(["send_message", "send_embed", "reply", "edit_message", "send_dm"]);
const CONDITION_TYPES = new Set(["user", "input", "variable", "role", "channel", "selected"]);
const CONDITION_OPERATORS = new Set([
  "equals",
  "not_equals",
  "contains",
  "not_contains",
  "starts_with",
  "ends_with",
  "greater_than",
  "less_than",
  "has_role",
  "not_has_role",
  "in_channel",
  "not_in_channel",
  "is_empty",
  "is_not_empty",
]);

/** A list of roles or channels given by id or name, as ids. */
function resolveMany(
  ctx: ToolContext,
  raw: unknown,
  what: "role" | "channel",
  where: string,
  errors: string[],
): string[] | undefined {
  if (!Array.isArray(raw)) return undefined;
  const out: string[] = [];
  for (const item of raw) {
    const found =
      what === "role"
        ? resolveRole(ctx.discordGuild, item)
        : resolveChannel(ctx.discordGuild, item, "any");
    if (found.ok) out.push(found.item.id);
    else errors.push(`${where}: ${found.error}`);
  }
  return out;
}

async function checkScenario(
  ctx: ToolContext,
  library: ComponentLibrary,
  raw: any,
  id: string,
  existing: ScenarioCustom | null,
): Promise<Checked<ScenarioCustom>> {
  const errors: string[] = [];
  const guildId = ctx.discordGuild.id;
  const ids = {
    embed: new Set((await library.items("embed")).map((item) => item.id)),
    button: new Set((await library.items("button")).map((item) => item.id)),
    select_menu: new Set((await library.items("select_menu")).map((item) => item.id)),
    modal: new Set((await library.items("modal")).map((item) => item.id)),
    layout: new Set((await library.items("layout")).map((item) => item.id)),
  };
  const known = (set: Set<string>, value: string | undefined, where: string, what: string) => {
    if (value && !set.has(value)) errors.push(`${where}: there is no ${what} with id "${value}"`);
  };

  let trigger: ScenarioCustom["trigger"] = null;
  if (raw.trigger && typeof raw.trigger === "object") {
    const kind = TRIGGER_KIND[String(raw.trigger.type)];
    const componentId = str(raw.trigger.componentId);
    if (!kind) errors.push("trigger.type: button, select_menu or modal_submit");
    else if (!componentId) errors.push("trigger.componentId is required");
    else {
      known(
        ids[kind as "button" | "select_menu" | "modal"],
        componentId,
        "trigger.componentId",
        kind,
      );
      trigger = { type: raw.trigger.type, componentId };
    }
  }

  const rawSteps: any[] = Array.isArray(raw.steps) ? raw.steps : [];
  if (rawSteps.length === 0) errors.push("steps: at least one");
  if (rawSteps.length > SCENARIO_LIMITS.MAX_STEPS_PER_SCENARIO) {
    errors.push(`steps: at most ${SCENARIO_LIMITS.MAX_STEPS_PER_SCENARIO}`);
  }

  const steps = rawSteps.map((step, index) => {
    const where = `steps[${index}]`;
    const source = step?.action && typeof step.action === "object" ? step.action : {};
    const type = String(source.type ?? "");
    if (!ACTION_TYPES.has(type)) errors.push(`${where}.action.type: unknown action "${type}"`);

    const action: Record<string, unknown> = { type };
    if (type === "show_modal") {
      action.modalId = str(source.modalId);
      if (!action.modalId) errors.push(`${where}: show_modal needs modalId`);
      known(ids.modal, action.modalId as string, `${where}.modalId`, "modal");
    } else if (MESSAGE_ACTIONS.has(type)) {
      const layoutId = str(source.layoutId);
      if (layoutId) {
        action.layoutId = layoutId;
        known(ids.layout, layoutId, `${where}.layoutId`, "layout");
      } else {
        action.content = str(source.content) ?? str(source.dmContent);
        action.embeds = strings(source.embeds) ?? [];
        action.buttons = strings(source.buttons) ?? [];
        action.selectMenus = strings(source.selectMenus) ?? [];
        (action.embeds as string[]).forEach((item) =>
          known(ids.embed, item, `${where}.embeds`, "embed"),
        );
        (action.buttons as string[]).forEach((item) =>
          known(ids.button, item, `${where}.buttons`, "button"),
        );
        (action.selectMenus as string[]).forEach((item) =>
          known(ids.select_menu, item, `${where}.selectMenus`, "select menu"),
        );
        if (action.content && String(action.content).length > 2000) {
          errors.push(`${where}.content: at most 2000 characters`);
        }
        if (
          !action.content &&
          (action.embeds as string[]).length === 0 &&
          type !== "edit_message"
        ) {
          errors.push(`${where}: a message needs content, an embed or a layout`);
        }
        if ((action.embeds as string[]).length > 10) errors.push(`${where}.embeds: at most 10`);
      }
      if (type === "reply") action.ephemeral = flag(source.ephemeral) ?? false;
      if (type === "send_message" && str(source.channelId)) {
        const found = resolveChannel(ctx.discordGuild, source.channelId, "text");
        if (found.ok) action.channelId = found.item.id;
        else errors.push(`${where}.channelId: ${found.error}`);
      }
    } else if (type === "add_role" || type === "remove_role") {
      const found = resolveRole(ctx.discordGuild, source.roleId);
      if (found.ok) action.roleId = found.item.id;
      else errors.push(`${where}.roleId: ${found.error}`);
    } else if (type === "create_thread") {
      action.threadName = str(source.threadName);
      if (!action.threadName) errors.push(`${where}: create_thread needs threadName`);
      else if (String(action.threadName).length > 100)
        errors.push(`${where}.threadName: at most 100 characters`);
      const archive = num(source.autoArchiveDuration);
      if (archive != null) {
        if ([60, 1440, 4320, 10080].includes(archive)) action.autoArchiveDuration = archive;
        else errors.push(`${where}.autoArchiveDuration: 60, 1440, 4320 or 10080`);
      }
    } else if (type === "set_variable") {
      action.variableName = str(source.variableName);
      action.variableValue =
        typeof source.variableValue === "string"
          ? source.variableValue
          : String(source.variableValue ?? "");
      if (!action.variableName) errors.push(`${where}: set_variable needs variableName`);
      else if (String(action.variableName).length > SCENARIO_LIMITS.MAX_VARIABLE_NAME_LENGTH) {
        errors.push(
          `${where}.variableName: at most ${SCENARIO_LIMITS.MAX_VARIABLE_NAME_LENGTH} characters`,
        );
      }
      if (String(action.variableValue).length > SCENARIO_LIMITS.MAX_VARIABLE_VALUE_LENGTH) {
        errors.push(
          `${where}.variableValue: at most ${SCENARIO_LIMITS.MAX_VARIABLE_VALUE_LENGTH} characters`,
        );
      }
    } else if (type === "delete_message") {
      action.deleteOriginal = flag(source.deleteOriginal) ?? true;
      const delay = num(source.deleteDelay);
      if (delay != null) action.deleteDelay = Math.min(delay, 600_000);
    }

    const conditions = Array.isArray(step?.conditions)
      ? step.conditions.map((condition: any, conditionIndex: number) => {
          const at = `${where}.conditions[${conditionIndex}]`;
          if (!CONDITION_TYPES.has(condition?.type)) errors.push(`${at}.type: unknown`);
          if (!CONDITION_OPERATORS.has(condition?.operator)) errors.push(`${at}.operator: unknown`);
          if (
            (condition?.type === "input" || condition?.type === "variable") &&
            !str(condition?.field)
          ) {
            errors.push(`${at}: type ${condition.type} needs field`);
          }
          let value = String(condition?.value ?? "");
          // Role and channel checks compare ids, so a name is looked up here.
          if (condition?.type === "role" && value) {
            const found = resolveRole(ctx.discordGuild, value);
            if (found.ok) value = found.item.id;
            else errors.push(`${at}.value: ${found.error}`);
          }
          if (condition?.type === "channel" && value) {
            const found = resolveChannel(ctx.discordGuild, value, "any");
            if (found.ok) value = found.item.id;
            else errors.push(`${at}.value: ${found.error}`);
          }
          return compact({
            type: condition?.type,
            field: str(condition?.field),
            operator: condition?.operator,
            value,
          });
        })
      : undefined;

    return compact({
      id: str(step?.id) ?? generateID(guildId, "step"),
      order: index,
      name: str(step?.name)?.slice(0, 100),
      action,
      conditions: conditions && conditions.length > 0 ? conditions : undefined,
      conditionLogic: step?.conditionLogic === "or" ? "or" : conditions?.length ? "and" : undefined,
      onSuccess: str(step?.onSuccess),
      onFailure: str(step?.onFailure),
      stopOnFailure: flag(step?.stopOnFailure),
      onInteraction:
        step?.onInteraction &&
        typeof step.onInteraction === "object" &&
        !Array.isArray(step.onInteraction)
          ? (step.onInteraction as Record<string, string>)
          : undefined,
    });
  });

  const stepIds = new Set<string>();
  for (const step of steps) {
    if (stepIds.has(step.id)) errors.push(`steps: the id "${step.id}" is used twice`);
    stepIds.add(step.id);
  }

  const flowLibrary = {
    buttons: (await library.items("button")) as ButtonCustom[],
    layouts: (await library.items("layout")) as LayoutCustom[],
  };
  steps.forEach((step, index) => {
    const where = `steps[${index}]`;
    for (const key of ["onSuccess", "onFailure"] as const) {
      const target = step[key] as string | undefined;
      if (!target) continue;
      if (!stepIds.has(target)) errors.push(`${where}.${key}: there is no step "${target}"`);
      if (target === step.id) errors.push(`${where}.${key}: a step cannot point at itself`);
    }
    const shown = new Set(awaitedComponentIds(step.action as any, flowLibrary));
    for (const [componentId, target] of Object.entries(step.onInteraction ?? {})) {
      if (typeof target !== "string" || !stepIds.has(target)) {
        errors.push(`${where}.onInteraction: there is no step "${String(target)}"`);
      } else if (target === step.id) {
        errors.push(`${where}.onInteraction: a step cannot point at itself`);
      }
      if (!shown.has(componentId)) {
        errors.push(
          `${where}.onInteraction: this step does not show the component "${componentId}"`,
        );
      }
    }
  });

  const variables: Record<string, string> = {};
  if (raw.variables && typeof raw.variables === "object" && !Array.isArray(raw.variables)) {
    for (const [name, value] of Object.entries(raw.variables)) {
      if (name.length > SCENARIO_LIMITS.MAX_VARIABLE_NAME_LENGTH)
        errors.push(`variables: the name "${name}" is too long`);
      if (String(value).length > SCENARIO_LIMITS.MAX_VARIABLE_VALUE_LENGTH)
        errors.push(`variables.${name}: too long`);
      variables[name] = String(value);
    }
  }

  const cooldown = num(raw.cooldown);
  if (cooldown != null && cooldown !== 0 && cooldown < SCENARIO_LIMITS.MIN_COOLDOWN) {
    errors.push(`cooldown: at least ${SCENARIO_LIMITS.MIN_COOLDOWN}`);
  }

  const name = str(raw.name) ?? "";
  if (!name || name.length > 100) errors.push("name: 1 to 100 characters");

  const now = Date.now();
  const item = compact({
    id,
    name,
    description: str(raw.description)?.slice(0, 500),
    enabled: flag(raw.enabled) ?? true,
    trigger,
    variables: Object.keys(variables).length > 0 ? variables : undefined,
    steps,
    maxExecutionsPerUser: num(raw.maxExecutionsPerUser),
    executionPeriod: num(raw.executionPeriod),
    cooldown: cooldown || undefined,
    allowedRoles: resolveMany(ctx, raw.allowedRoles, "role", "allowedRoles", errors),
    deniedRoles: resolveMany(ctx, raw.deniedRoles, "role", "deniedRoles", errors),
    allowedChannels: resolveMany(ctx, raw.allowedChannels, "channel", "allowedChannels", errors),
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
    createdBy: existing?.createdBy ?? ctx.member.id,
  }) as unknown as ScenarioCustom;

  // One component can start one scenario only, or a click would be ambiguous.
  if (trigger) {
    const clash = ((await library.items("scenario")) as ScenarioCustom[]).find(
      (other) => other.id !== id && other.trigger?.componentId === trigger!.componentId,
    );
    if (clash)
      errors.push(`trigger: the scenario "${clash.name}" already starts from this component`);
  }

  return errors.length > 0 ? { ok: false, errors } : { ok: true, item };
}

export type Prepared =
  | { ok: true; item: Record<string, any>; created: boolean }
  | { ok: false; errors: string[] };

/**
 * Check what the model wants to store. With an id the stored component is the base and the given
 * fields replace its own; without one a new component with a fresh id is made.
 */
export async function prepareComponent(
  ctx: ToolContext,
  library: ComponentLibrary,
  kind: ComponentKind,
  data: unknown,
  id?: string | null,
): Promise<Prepared> {
  if (!WRITABLE_KINDS.includes(kind)) {
    return {
      ok: false,
      errors: [`${kind}s cannot be created or changed here: ${COMPONENT_KINDS[kind].schema}`],
    };
  }
  const parsed = parseLoose(data);
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    return { ok: false, errors: ["data must be a JSON object"] };
  }

  const list = await library.items(kind);
  const existing = id ? (list.find((item) => item.id === id) ?? null) : null;
  if (id && !existing) return { ok: false, errors: [`there is no ${kind} with id "${id}"`] };
  if (!existing && list.length >= COMPONENT_KINDS[kind].max) {
    return {
      ok: false,
      errors: [`this server already has the maximum of ${COMPONENT_KINDS[kind].max} ${kind}s`],
    };
  }

  const merged = { ...(existing ?? {}), ...(parsed as Record<string, unknown>) };
  const itemId = existing?.id ?? generateID(ctx.discordGuild.id, COMPONENT_KINDS[kind].token);

  const checked =
    kind === "embed"
      ? checkEmbed(merged, itemId)
      : kind === "button"
        ? checkButton(merged, itemId)
        : kind === "select_menu"
          ? checkSelectMenu(merged, itemId)
          : kind === "modal"
            ? checkModal(merged, itemId, ctx.discordGuild.id)
            : await checkScenario(ctx, library, merged, itemId, existing);

  if (!checked.ok) return checked;
  return { ok: true, item: checked.item as Record<string, any>, created: !existing };
}

/** Scenarios and layouts that would be left pointing at a component that is about to go. */
export async function usagesOf(
  library: ComponentLibrary,
  kind: ComponentKind,
  id: string,
): Promise<string[]> {
  const users: string[] = [];
  for (const scenario of (await library.items("scenario")) as ScenarioCustom[]) {
    const inTrigger = scenario.trigger?.componentId === id;
    const inSteps = scenario.steps?.some((step) =>
      JSON.stringify(step.action ?? {}).includes(`"${id}"`),
    );
    if (kind !== "scenario" && (inTrigger || inSteps)) users.push(`scenario "${scenario.name}"`);
  }
  if (kind === "button" || kind === "select_menu") {
    for (const layout of (await library.items("layout")) as LayoutCustom[]) {
      if (JSON.stringify(layout.components ?? []).includes(`"${id}"`))
        users.push(`layout "${layout.name}"`);
    }
  }
  return users;
}

export type PreparedSend = { ok: true; op: SendOp } | { ok: false; errors: string[] };

/** Check a message made of custom components before it is queued. */
export async function prepareSend(
  ctx: ToolContext,
  library: ComponentLibrary,
  args: Record<string, unknown>,
): Promise<PreparedSend> {
  const errors: string[] = [];

  const target = resolveChannel(ctx.discordGuild, args.channel ?? ctx.channelId, "text");
  if (!target.ok) errors.push(`channel: ${target.error}`);

  const content = str(args.content) ?? null;
  if (content && content.length > 2000) errors.push("content: at most 2000 characters");

  const pick = async (kind: ComponentKind, raw: unknown, max: number): Promise<string[]> => {
    const parsed = parseLoose(raw);
    const given = Array.isArray(parsed) ? parsed : parsed ? [parsed] : [];
    const out: string[] = [];
    for (const value of given) {
      const item = await library.find(kind, String(value));
      if (!item) errors.push(`there is no ${kind} with id "${String(value)}"; use components_list`);
      else if (!out.includes(item.id)) out.push(item.id);
    }
    if (out.length > max) errors.push(`at most ${max} ${kind}s in one message`);
    return out;
  };

  const embeds = await pick("embed", args.embeds, 10);
  const buttons = await pick("button", args.buttons, 25);
  const selectMenus = await pick("select_menu", args.menus, 5);
  const [layout = null] = await pick("layout", args.layout, 1);

  if (layout && (content || embeds.length || buttons.length || selectMenus.length)) {
    errors.push("a layout is sent on its own: leave out content, embeds, buttons and menus");
  }
  if (!layout && !content && embeds.length === 0) {
    errors.push("the message needs content, an embed or a layout");
  }
  if (Math.ceil(buttons.length / 5) + selectMenus.length > 5) {
    errors.push("too many components: a message has 5 rows, 5 buttons or 1 menu each");
  }

  if (errors.length > 0 || !target.ok) return { ok: false, errors };

  const problem = sendProblem(ctx, target.item.id);
  if (problem) return { ok: false, errors: [problem] };

  return {
    ok: true,
    op: { type: "send", channelId: target.item.id, content, embeds, buttons, selectMenus, layout },
  };
}

/** Why the bot or the administrator cannot post in a channel, or null. */
function sendProblem(ctx: ToolContext, channelId: string): string | null {
  const channel = ctx.discordGuild.channels.cache.get(channelId);
  const me = ctx.discordGuild.members.me;
  if (!channel || !channel.isTextBased() || !("send" in channel))
    return "that is not a channel messages can be sent to";
  if (
    !me ||
    !channel
      .permissionsFor(me)
      ?.has([PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages])
  ) {
    return `I cannot send messages in #${channel.name}`;
  }
  if (
    !channel
      .permissionsFor(ctx.member)
      ?.has([PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages])
  ) {
    return `you cannot send messages in #${channel.name} yourself`;
  }
  return null;
}

/** Post a confirmed message. */
export async function applySend(ctx: ToolContext, op: SendOp): Promise<StepResult> {
  const library = new ComponentLibrary(ctx.guild);
  const problem = sendProblem(ctx, op.channelId);
  if (problem) return { ok: false, line: `❌ <#${op.channelId}>: ${problem}` };

  const channel = ctx.discordGuild.channels.cache.get(op.channelId) as any;
  const gather = async (kind: ComponentKind, ids: string[]) => {
    const items = [];
    for (const id of ids) {
      const item = await library.find(kind, id);
      if (!item) throw new Error(`the ${kind} ${id} no longer exists`);
      items.push(item);
    }
    return items;
  };

  try {
    let payload: MessageCreateOptions;

    if (op.layout) {
      const [layout] = await gather("layout", [op.layout]);
      const built = buildLayoutPayload(layout as LayoutCustom, {
        buttons: await library.items("button"),
        selectMenus: await library.items("select_menu"),
      });
      if (!built)
        return {
          ok: false,
          line: `❌ <#${op.channelId}>: the layout has nothing that can be shown`,
        };
      payload = { components: built.components, flags: built.flags };
    } else {
      const rows: ActionRowBuilder<MessageActionRowComponentBuilder>[] = [];
      const buttons = (await gather("button", op.buttons)) as ButtonCustom[];
      for (let index = 0; index < buttons.length; index += 5) {
        rows.push(
          new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(
            buttons.slice(index, index + 5).map((button) => new CustomButton(button).getButton()),
          ),
        );
      }
      for (const menu of (await gather("select_menu", op.selectMenus)) as SelectMenuCustom[]) {
        rows.push(
          new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(
            new CustomSelectMenu(menu).getSelectMenu(),
          ),
        );
      }
      payload = {
        ...(op.content ? { content: op.content } : {}),
        embeds: ((await gather("embed", op.embeds)) as EmbedCustom[]).map((embed) =>
          new CustomEmbed(embed).getEmbed(),
        ),
        components: rows.slice(0, 5),
      };
    }

    const sent = await channel.send(payload);
    return { ok: true, line: `✅ ✈️ ${sent.url}` };
  } catch (error: any) {
    return {
      ok: false,
      line: `❌ <#${op.channelId}>: ${String(error?.message ?? error).slice(0, 200)}`,
    };
  }
}

/** A short line that tells the administrator what a message will carry. */
export async function describeSend(library: ComponentLibrary, op: SendOp): Promise<string> {
  const parts: string[] = [];
  if (op.content) {
    const flat = op.content.replace(/\s+/g, " ").replace(/`/g, "'");
    parts.push(`\`${flat.length > 120 ? `${flat.slice(0, 120)}…` : flat}\``);
  }
  const names = async (kind: ComponentKind, ids: string[]) =>
    Promise.all(ids.map(async (id) => componentLabel(kind, await library.find(kind, id))));
  if (op.embeds.length) parts.push(`embeds: ${(await names("embed", op.embeds)).join(", ")}`);
  if (op.buttons.length) parts.push(`buttons: ${(await names("button", op.buttons)).join(", ")}`);
  if (op.selectMenus.length)
    parts.push(`menus: ${(await names("select_menu", op.selectMenus)).join(", ")}`);
  if (op.layout) parts.push(`layout: ${(await names("layout", [op.layout])).join("")}`);
  return `✈️ <#${op.channelId}> ← ${parts.join(" · ")}`;
}
