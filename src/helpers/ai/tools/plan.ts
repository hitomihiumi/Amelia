import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  type Client,
  type EmbedBuilder,
  type MessageActionRowComponentBuilder,
} from "discord.js";
import { RedisService } from "../../../database/redis";
import { generateID } from "../../../handlers/functions";
import { t } from "../../../i18n/helpers";
import { applySend, ComponentLibrary, COMPONENT_KINDS } from "./components";
import { applyModeration } from "./moderation";
import { applySettings } from "./settings";
import type { Plan, PlanStep, StepResult, ToolContext } from "./types";

/**
 * A plan is what the AI prepared for an administrator: it waits in Redis for a few minutes, is
 * shown under the answer with two buttons, and runs only when the administrator who asked for it
 * presses Apply. The buttons are handled in `components/buttons/ai_plan.ts`.
 */

export const PLAN_BUTTON_ID = "I_ai:plan";
const PLAN_TTL_SECONDS = 15 * 60;

/** Room for the text of a plan in an embed (Discord allows 4096 characters). */
const MAX_LINES = 30;
const MAX_CHARS = 3600;

export interface StoredPlan extends Plan {
  guildId: string;
  /** The administrator who asked. Nobody else can confirm the plan. */
  userId: string;
  channelId: string;
  expiresAt: number;
}

const key = (id: string) => `ai:plan:${id}`;

export async function storePlan(
  plan: Plan,
  owner: { guildId: string; userId: string; channelId: string },
): Promise<{ id: string; expiresAt: number }> {
  const id = generateID();
  const expiresAt = Date.now() + PLAN_TTL_SECONDS * 1000;
  const stored: StoredPlan = { ...plan, ...owner, expiresAt };
  await RedisService.getClient().set(key(id), JSON.stringify(stored), "EX", PLAN_TTL_SECONDS);
  return { id, expiresAt };
}

export async function readPlan(id: string): Promise<StoredPlan | null> {
  const raw = await RedisService.getClient().get(key(id));
  if (!raw) return null;
  try {
    return JSON.parse(raw) as StoredPlan;
  } catch {
    return null;
  }
}

/**
 * Take a plan out of the store. Only one caller gets `true`, so two clicks, or the same click
 * seen by two shards, cannot run a plan twice.
 */
export async function claimPlan(id: string): Promise<boolean> {
  return (await RedisService.getClient().del(key(id))) === 1;
}

/** Lines cut to what an embed can hold, with a note of how many were left out. */
function fit(client: Client, lang: string, lines: string[]): string {
  const kept: string[] = [];
  let size = 0;
  for (const line of lines) {
    if (kept.length >= MAX_LINES || size + line.length + 1 > MAX_CHARS) break;
    kept.push(line);
    size += line.length + 1;
  }
  if (kept.length < lines.length) {
    kept.push(t(client, lang, "ai.actions.more", lines.length - kept.length));
  }
  return kept.join("\n");
}

/** The embed and buttons that go under the answer of the AI. */
export function planMessage(
  client: Client,
  lang: string,
  plan: Plan,
  stored: { id: string; expiresAt: number },
  userId: string,
): { embeds: EmbedBuilder[]; components: ActionRowBuilder<MessageActionRowComponentBuilder>[] } {
  const lines = plan.steps.flatMap((step) => step.lines);
  const embed = client.holder.utils.fastEmbed({
    title: t(client, lang, "ai.actions.title"),
    description: `${fit(client, lang, lines)}\n\n-# ${t(
      client,
      lang,
      "ai.actions.hint",
      `<@${userId}>`,
      `<t:${Math.floor(stored.expiresAt / 1000)}:R>`,
    )}`,
  });

  const row = new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId(`${PLAN_BUTTON_ID}|${stored.id}|apply`)
      .setLabel(t(client, lang, "ai.actions.apply"))
      .setEmoji("✅")
      .setStyle(ButtonStyle.Success),
    new ButtonBuilder()
      .setCustomId(`${PLAN_BUTTON_ID}|${stored.id}|cancel`)
      .setLabel(t(client, lang, "ai.actions.cancel"))
      .setStyle(ButtonStyle.Secondary),
  );

  return { embeds: [embed], components: [row] };
}

/** The embed a plan turns into once it ran, was cancelled or ran out of time. */
export function outcomeEmbed(
  client: Client,
  lang: string,
  state: "applied" | "partial" | "failed" | "cancelled" | "expired",
  lines: string[],
): EmbedBuilder {
  const color =
    state === "applied"
      ? client.holder.colors.success
      : state === "partial" || state === "failed"
        ? client.holder.colors.error
        : client.holder.colors.info;
  return client.holder.utils
    .fastEmbed({
      title: t(client, lang, `ai.actions.outcome.${state}`),
      description: fit(client, lang, lines) || undefined,
    })
    .setColor(color);
}

async function runStep(ctx: ToolContext, step: PlanStep): Promise<StepResult[]> {
  const { op } = step;
  const [head = ""] = step.lines;

  switch (op.type) {
    case "settings": {
      const result = await applySettings(ctx, op.ops);
      if (!result.ok) return result.errors.map((error) => ({ ok: false, line: `❌ ⚙️ ${error}` }));
      return [
        ...result.lines.map((line) => ({ ok: true, line: `✅ ⚙️ ${line}` })),
        ...result.notes.map((note) => ({ ok: true, line: `⚠️ ${note}` })),
      ];
    }

    case "component_save": {
      const library = new ComponentLibrary(ctx.guild);
      const list = await library.items(op.kind);
      const exists = list.some((item) => item.id === op.item.id);
      if (!exists && list.length >= COMPONENT_KINDS[op.kind].max) {
        return [
          {
            ok: false,
            line: `❌ ${head}: ${t(ctx.client, ctx.lang, "ai.actions.limit", COMPONENT_KINDS[op.kind].max)}`,
          },
        ];
      }
      await library.put(op.kind, op.item as { id: string });
      await library.store(op.kind);
      return [{ ok: true, line: `✅ ${head}` }];
    }

    case "component_delete": {
      const library = new ComponentLibrary(ctx.guild);
      // Already gone is what was asked for.
      if (await library.remove(op.kind, op.id)) await library.store(op.kind);
      return [{ ok: true, line: `✅ ${head}` }];
    }

    case "send":
      return [await applySend(ctx, op)];

    case "moderate":
      return [await applyModeration(ctx, op)];
  }
}

/** Run a confirmed plan, step by step. A step that fails does not stop the ones after it. */
export async function applyPlan(ctx: ToolContext, plan: Plan): Promise<StepResult[]> {
  const results: StepResult[] = [];
  for (const step of plan.steps) {
    try {
      results.push(...(await runStep(ctx, step)));
    } catch (error: any) {
      console.error("[AI] A step of a plan failed:".red, error);
      results.push({
        ok: false,
        line: `❌ ${step.lines[0] ?? ""}: ${String(error?.message ?? error).slice(0, 200)}`,
      });
    }
  }
  return results;
}
