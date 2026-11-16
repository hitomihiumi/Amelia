import { ChannelType } from "discord.js";
import { t } from "../../../i18n/helpers";
import {
  COMPONENT_KINDS,
  ComponentLibrary,
  componentLabel,
  describeSend,
  prepareComponent,
  prepareSend,
  usagesOf,
  WRITABLE_KINDS,
} from "./components";
import { MODERATION_ACTIONS, prepareModeration } from "./moderation";
import {
  commandNames,
  describeSection,
  planSettings,
  SECTION_IDS,
  type SettingDiff,
} from "./settings";
import { parseLoose } from "./spec";
import type {
  ComponentKind,
  Plan,
  PlanStep,
  SettingOp,
  ToolCall,
  ToolContext,
  ToolDeclaration,
  ToolSession,
} from "./types";

/**
 * The tools a server administrator's message gives the model. Reading tools answer at once.
 * Everything that changes something only adds a step to a plan: the plan is shown to the
 * administrator and runs when they press the button (see `plan.ts`).
 */

const ALL_KINDS = Object.keys(COMPONENT_KINDS) as ComponentKind[];

const string = (description: string, values?: readonly string[]) => ({
  type: "STRING",
  description,
  ...(values ? { enum: values } : {}),
});
const integer = (description: string) => ({ type: "INTEGER", description });
const idList = (description: string) => ({ type: "ARRAY", description, items: { type: "STRING" } });

export const TOOL_DECLARATIONS: ToolDeclaration[] = [
  {
    name: "settings_get",
    description:
      "Show the bot settings of one section on this server: every key, what it accepts and its current value. Call it before settings_set.",
    parameters: {
      type: "OBJECT",
      properties: { section: string("Section to show", SECTION_IDS) },
      required: ["section"],
    },
  },
  {
    name: "settings_set",
    description:
      "Queue changes of bot settings for the administrator to confirm. Keys come from settings_get. Channels and roles may be ids or exact names.",
    parameters: {
      type: "OBJECT",
      properties: {
        changes: {
          type: "ARRAY",
          items: {
            type: "OBJECT",
            properties: {
              key: string("Setting key, e.g. utils.levels.enabled"),
              value: string(
                'New value as text or JSON: true, 30, "text", null, ["id1","id2"], {"a":1}',
              ),
              op: string(
                "set replaces the value (default); add / remove change items of a list or map",
                ["set", "add", "remove"],
              ),
            },
            required: ["key", "value"],
          },
        },
      },
      required: ["changes"],
    },
  },
  {
    name: "find",
    description:
      "Look up channels, roles, members or command names of this server by a part of the name. Returns ids.",
    parameters: {
      type: "OBJECT",
      properties: {
        type: string("What to look for", ["channel", "role", "member", "command"]),
        query: string("Part of the name; empty lists everything (not for members)"),
      },
      required: ["type"],
    },
  },
  {
    name: "moderate",
    description:
      "Queue a moderation action for the administrator to confirm. warn/mute/kick/ban/unmute/unban/note need user; unwarn needs case; purge deletes recent messages of a channel; slowmode sets a channel's delay.",
    parameters: {
      type: "OBJECT",
      properties: {
        action: string("The action", MODERATION_ACTIONS),
        user: string("Member id, mention or name"),
        duration: string(
          'Like "30m", "2h", "7d". Required for mute, optional for ban, the delay for slowmode ("0" = off)',
        ),
        reason: string("Reason, or the text of a note"),
        delete_days: integer("ban: delete the user's messages of the last 0-7 days"),
        case: integer("unwarn: number of the warn case"),
        amount: integer("purge: how many recent messages to look through, 1-100"),
        channel: string("purge / slowmode: channel, default the current one"),
      },
      required: ["action"],
    },
  },
  {
    name: "components_list",
    description:
      "List the custom components of one kind on this server (id and name) together with the JSON format of that kind. Call it before component_save.",
    parameters: {
      type: "OBJECT",
      properties: { kind: string("Kind of component", ALL_KINDS) },
      required: ["kind"],
    },
  },
  {
    name: "component_get",
    description: "The full JSON of one custom component.",
    parameters: {
      type: "OBJECT",
      properties: { kind: string("Kind of component", ALL_KINDS), id: string("Its id") },
      required: ["kind", "id"],
    },
  },
  {
    name: "component_save",
    description:
      "Queue creating a custom component, or changing one when id is given (the fields in data replace the stored ones, lists are replaced whole). Returns its id, which later calls of this turn may already use.",
    parameters: {
      type: "OBJECT",
      properties: {
        kind: string("Kind of component", WRITABLE_KINDS),
        data: string("The component as a JSON object, in the format components_list shows"),
        id: string("Id of the component to change; leave out to create one"),
      },
      required: ["kind", "data"],
    },
  },
  {
    name: "component_delete",
    description: "Queue deleting a custom component.",
    parameters: {
      type: "OBJECT",
      properties: { kind: string("Kind of component", ALL_KINDS), id: string("Its id") },
      required: ["kind", "id"],
    },
  },
  {
    name: "message_send",
    description:
      "Queue posting a message made of custom components to a channel: text and/or embeds, with buttons and select menus, or one layout on its own.",
    parameters: {
      type: "OBJECT",
      properties: {
        channel: string("Channel id or name, default the current one"),
        content: string("Plain text of the message"),
        embeds: idList("Embed ids, up to 10"),
        buttons: idList("Button ids"),
        menus: idList("Select menu ids, up to 5"),
        layout: string("Layout id; then nothing else may be given"),
      },
    },
  },
];

const QUEUED =
  "Queued, NOT applied. The administrator sees it under your message and must press Apply. Tell them what you prepared.";

class Session implements ToolSession {
  declarations = TOOL_DECLARATIONS;

  private steps: PlanStep[] = [];
  private settingOps: SettingOp[] = [];
  private library: ComponentLibrary;

  constructor(private ctx: ToolContext) {
    this.library = new ComponentLibrary(ctx.guild);
  }

  async execute(call: ToolCall): Promise<Record<string, unknown>> {
    try {
      const args = (call.args && typeof call.args === "object" ? call.args : {}) as Record<
        string,
        unknown
      >;
      switch (call.name) {
        case "settings_get":
          return await this.settingsGet(args);
        case "settings_set":
          return await this.settingsSet(args);
        case "find":
          return await this.find(args);
        case "moderate":
          return await this.moderate(args);
        case "components_list":
          return await this.componentsList(args);
        case "component_get":
          return await this.componentGet(args);
        case "component_save":
          return await this.componentSave(args);
        case "component_delete":
          return await this.componentDelete(args);
        case "message_send":
          return await this.messageSend(args);
        default:
          return { error: `there is no tool "${call.name}"` };
      }
    } catch (error) {
      console.error(`[AI] Tool ${call.name} failed:`.red, error);
      return { error: "the tool failed unexpectedly; tell the administrator it did not work" };
    }
  }

  async plan(): Promise<Plan | null> {
    return this.steps.length > 0 ? { steps: this.steps } : null;
  }

  private kind(raw: unknown, allowed: ComponentKind[]): ComponentKind | null {
    const kind = String(raw ?? "") as ComponentKind;
    return allowed.includes(kind) ? kind : null;
  }

  private kindName(kind: ComponentKind): string {
    return t(this.ctx.client, this.ctx.lang, `ai.actions.kinds.${kind}`);
  }

  private async settingsGet(args: Record<string, unknown>) {
    const text = await describeSection(this.ctx, String(args.section ?? ""));
    return text
      ? { settings: text }
      : { error: `section must be one of ${SECTION_IDS.join(", ")}` };
  }

  private async settingsSet(args: Record<string, unknown>) {
    const parsed = parseLoose(args.changes);
    const changes = (Array.isArray(parsed) ? parsed : parsed ? [parsed] : []).filter(
      (change): change is Record<string, unknown> => Boolean(change) && typeof change === "object",
    );
    if (changes.length === 0) return { error: "changes must be a list of {key, value, op?}" };

    const fresh: SettingOp[] = changes.map((change) => ({
      key: String(change.key ?? ""),
      op: change.op === "add" || change.op === "remove" ? change.op : "set",
      value: change.value,
    }));

    // Planned together with what is queued already, so the rules see the settings as they will be.
    const planned = await planSettings(this.ctx, [...this.settingOps, ...fresh]);
    if (!planned.ok) return { error: planned.errors.join("; "), queued: false };

    this.settingOps = planned.plan.ops;
    this.setSettingsStep(planned.plan.diffs);
    return {
      queued: planned.plan.diffs.slice(-fresh.length).map((diff) => diff.line),
      note: QUEUED,
    };
  }

  /** All setting changes of a turn are one step, kept where the first of them was queued. */
  private setSettingsStep(diffs: SettingDiff[]) {
    const step: PlanStep = {
      op: { type: "settings", ops: this.settingOps },
      lines: diffs.map((diff) => `⚙️ ${diff.line}`),
    };
    const index = this.steps.findIndex((existing) => existing.op.type === "settings");
    if (index >= 0) this.steps[index] = step;
    else this.steps.push(step);
  }

  private async find(args: Record<string, unknown>) {
    const query = String(args.query ?? "")
      .trim()
      .replace(/^[#@]/, "")
      .toLowerCase();
    const guild = this.ctx.discordGuild;
    const matches = (name: string) => !query || name.toLowerCase().includes(query);
    const LIMIT = 30;

    switch (String(args.type ?? "")) {
      case "channel": {
        const found = [...guild.channels.cache.values()]
          .filter((item) => !item.isThread() && matches(item.name))
          .sort((a, b) => a.name.localeCompare(b.name));
        return {
          channels: found
            .slice(0, LIMIT)
            .map(
              (item) =>
                `#${item.name} (${item.id}, ${ChannelType[item.type].replace("Guild", "").toLowerCase()})`,
            ),
          more: Math.max(0, found.length - LIMIT),
        };
      }
      case "role": {
        const found = [...guild.roles.cache.values()]
          .filter((item) => item.id !== guild.id && matches(item.name))
          .sort((a, b) => b.position - a.position);
        return {
          roles: found
            .slice(0, LIMIT)
            .map((item) => `@${item.name} (${item.id}${item.managed ? ", managed" : ""})`),
          more: Math.max(0, found.length - LIMIT),
        };
      }
      case "member": {
        if (!query) return { error: "query is required to look for a member" };
        const found = await guild.members.search({ query, limit: 10 }).catch(() => null);
        return {
          members: [...(found?.values() ?? [])].map(
            (member) =>
              `${member.displayName} (@${member.user.username}, ${member.id}${member.user.bot ? ", bot" : ""})`,
          ),
        };
      }
      case "command":
        return { commands: commandNames(this.ctx.client).filter(matches) };
      default:
        return { error: "type must be channel, role, member or command" };
    }
  }

  private async moderate(args: Record<string, unknown>) {
    const prepared = await prepareModeration(this.ctx, args);
    if (!prepared.ok) return { error: prepared.errors.join("; "), queued: false };
    this.steps.push({ op: prepared.op, lines: [prepared.line] });
    return { queued: [prepared.line], note: QUEUED };
  }

  private async componentsList(args: Record<string, unknown>) {
    const kind = this.kind(args.kind, ALL_KINDS);
    if (!kind) return { error: `kind must be one of ${ALL_KINDS.join(", ")}` };
    const items = await this.library.items(kind);
    return {
      format: COMPONENT_KINDS[kind].schema,
      items: items.map((item) => `${componentLabel(kind, item)} (${item.id})`),
      limit: COMPONENT_KINDS[kind].max,
    };
  }

  private async componentGet(args: Record<string, unknown>) {
    const kind = this.kind(args.kind, ALL_KINDS);
    if (!kind) return { error: `kind must be one of ${ALL_KINDS.join(", ")}` };
    const item = await this.library.find(kind, String(args.id ?? ""));
    if (!item) return { error: `there is no ${kind} with that id; use components_list` };
    const json = JSON.stringify(item);
    return json.length > 6000
      ? { component: `${json.slice(0, 6000)}… (cut)` }
      : { component: item };
  }

  private async componentSave(args: Record<string, unknown>) {
    const kind = this.kind(args.kind, WRITABLE_KINDS);
    if (!kind) return { error: `kind must be one of ${WRITABLE_KINDS.join(", ")}` };

    const id = typeof args.id === "string" && args.id.trim() ? args.id.trim() : null;
    const prepared = await prepareComponent(this.ctx, this.library, kind, args.data, id);
    if (!prepared.ok) return { error: prepared.errors.slice(0, 12).join("; "), queued: false };

    const { item } = prepared;
    // Something created earlier in this turn and changed again is still a creation.
    const earlier = this.steps.findIndex(
      (step) =>
        step.op.type === "component_save" && step.op.kind === kind && step.op.item.id === item.id,
    );
    const created =
      prepared.created ||
      (earlier >= 0 && (this.steps[earlier].op as { created: boolean }).created);

    await this.library.put(kind, item as { id: string });
    const line = `${created ? "➕" : "✏️"} **${this.kindName(kind)}** «${componentLabel(kind, item)}»`;
    const step: PlanStep = { op: { type: "component_save", kind, item, created }, lines: [line] };
    if (earlier >= 0) this.steps[earlier] = step;
    else this.steps.push(step);

    return { id: item.id, queued: [line], note: QUEUED };
  }

  private async componentDelete(args: Record<string, unknown>) {
    const kind = this.kind(args.kind, ALL_KINDS);
    if (!kind) return { error: `kind must be one of ${ALL_KINDS.join(", ")}` };
    const id = String(args.id ?? "");
    const item = await this.library.find(kind, id);
    if (!item) return { error: `there is no ${kind} with that id; use components_list` };

    const name = componentLabel(kind, item);
    const usedBy = await usagesOf(this.library, kind, id);
    await this.library.remove(kind, id);

    // Deleting what was only queued in this turn just takes it out of the plan again.
    const queued = this.steps.findIndex(
      (step) =>
        step.op.type === "component_save" &&
        step.op.kind === kind &&
        step.op.item.id === id &&
        step.op.created,
    );
    if (queued >= 0) {
      this.steps.splice(queued, 1);
      return { removed_from_plan: name };
    }

    const line = `🗑️ **${this.kindName(kind)}** «${name}»`;
    this.steps.push({
      op: { type: "component_delete", kind, id, name },
      lines: usedBy.length > 0 ? [line, `⚠️ ${usedBy.join(", ")}`] : [line],
    });
    return {
      queued: [line],
      note: QUEUED,
      ...(usedBy.length > 0
        ? { warning: `still used by ${usedBy.join(", ")}; tell the administrator` }
        : {}),
    };
  }

  private async messageSend(args: Record<string, unknown>) {
    const prepared = await prepareSend(this.ctx, this.library, args);
    if (!prepared.ok) return { error: prepared.errors.join("; "), queued: false };
    const line = await describeSend(this.library, prepared.op);
    this.steps.push({ op: prepared.op, lines: [line] });
    return { queued: [line], note: QUEUED };
  }
}

export function createToolSession(ctx: ToolContext): ToolSession {
  return new Session(ctx);
}
