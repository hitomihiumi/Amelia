import { type AiSettings, clampLimits } from "../../types/helpers";
import { modelOrder, type AiModel } from "./config";
import { GeminiError, generate, type AiTurn } from "./gemini";
import { sanitizeReply } from "./format";
import { getAiConfig, hasAiAccess } from "./globalConfig";
import {
  coolDownModel,
  lockUser,
  recordTokens,
  takeModelSlot,
  takeUserSlot,
  unlockUser,
  type LimitRefusal,
} from "./limiter";
import { loadMemory, remember, userTurn } from "./memory";
import { buildSystemPrompt, languageName } from "./persona";

export interface AiChatRequest {
  guildId: string;
  guildName: string;
  channelId: string;
  channelName: string | null;
  userId: string;
  userName: string;
  /** What the member said, with mentions already turned into names. */
  text: string;
  /** The message being replied to, when there is one: who wrote it and what. */
  replyTo?: { name: string; text: string } | null;
  /** Language code of the server. */
  lang: string;
  settings: Pick<AiSettings, "model" | "persona" | "limits">;
}

export type AiChatResult =
  | { ok: true; text: string; model: AiModel }
  /** The AI chat is a premium feature and the server has no active premium. */
  | { ok: false; reason: "premium" }
  /** The member already has a request running. */
  | { ok: false; reason: "busy" }
  /** A limit of the member or the server is spent. */
  | { ok: false; reason: "rate_limited"; refusal: LimitRefusal }
  /** The key's quota is spent on every model this server may use. */
  | { ok: false; reason: "quota" }
  /** Every model failed or the model refused to answer. */
  | { ok: false; reason: "unavailable" | "blocked" | "error" };

function turnFor(request: AiChatRequest): AiTurn {
  const text = request.replyTo
    ? `(replying to ${request.replyTo.name}: "${request.replyTo.text}")\n${request.text}`
    : request.text;
  return userTurn(request.userName, text);
}

/**
 * One AI exchange, start to finish: limits, model choice with fallback, the call
 * and the conversation memory. Both the message handler and `/ai ask` go through it.
 */
export async function chat(request: AiChatRequest): Promise<AiChatResult> {
  const { guildId, userId, channelId, settings } = request;

  if (!(await hasAiAccess(guildId))) return { ok: false, reason: "premium" };

  if (!(await lockUser(guildId, userId))) return { ok: false, reason: "busy" };

  try {
    // A server cannot give itself more than the administrators allow, whatever it has stored.
    const limits = clampLimits(settings.limits, (await getAiConfig()).caps);
    const taken = await takeUserSlot(guildId, userId, limits);
    if ("refusal" in taken) return { ok: false, reason: "rate_limited", refusal: taken.refusal };

    const system = buildSystemPrompt({
      guildName: request.guildName,
      channelName: request.channelName,
      languageName: languageName(request.lang),
      serverPersona: settings.persona,
    });
    const userMessage = turnFor(request);
    const turns = [...(await loadMemory(channelId)), userMessage];

    let failure: "quota" | "unavailable" = "quota";
    let reachedModel = false;

    for (const model of modelOrder(settings.model)) {
      const slot = await takeModelSlot(model.key);
      if (!slot) continue;

      try {
        const result = await generate(model, system, turns);
        const text = sanitizeReply(result.text);
        reachedModel = true;

        await recordTokens(model.key, result.totalTokens);
        if (!text) return { ok: false, reason: "blocked" };

        await remember(channelId, userMessage, text);
        return { ok: true, text, model };
      } catch (error) {
        if (!(error instanceof GeminiError)) {
          console.error("[AI] Unexpected error:".red, error);
          await slot.refund();
          return { ok: false, reason: "error" };
        }

        const { failure: cause } = error;
        if (cause.kind === "quota") {
          // The key's real limit is lower than the bot's own ceiling: stop using the model for a while.
          await coolDownModel(model.key, cause.retryAfter);
          console.warn(
            `[AI] ${model.id} is out of quota, cooling down ${cause.retryAfter}s`.yellow,
          );
          failure = "quota";
          continue;
        }

        if (cause.kind === "unavailable") {
          // The API never counted this one.
          await slot.refund();
          console.warn(`[AI] ${model.id} is unavailable (status ${cause.status})`.yellow);
          failure = "unavailable";
          continue;
        }

        reachedModel = true;
        if (cause.kind === "blocked") return { ok: false, reason: "blocked" };

        console.error(`[AI] ${model.id} request rejected (${cause.status}): ${cause.message}`.red);
        return { ok: false, reason: "error" };
      }
    }

    // Nothing was answered: the member's request does not count against them.
    if (!reachedModel) await taken.slot.refund();
    return { ok: false, reason: failure };
  } finally {
    await unlockUser(guildId, userId);
  }
}
