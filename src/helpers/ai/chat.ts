import { type AiSettings, clampLimits } from "../../types/helpers";
import {
  AI_MAX_OUTPUT_TOKENS_CODE,
  AI_MAX_OUTPUT_TOKENS_TOOLS,
  AI_MAX_TOOL_ROUNDS,
  modelOrder,
  type AiModel,
} from "./config";
import { type CodeFile, formatCodeFiles } from "./files";
import {
  GeminiError,
  generate,
  modelTakesTools,
  type AiImage,
  type GenerateOptions,
  type ToolExchange,
} from "./gemini";
import { sanitizeReply } from "./format";
import { getAiConfig, hasAiAccess } from "./globalConfig";
import { forgetFact, recall, rememberFact, type Recalled } from "./longTerm";
import { extractMarkers } from "./memoryText";
import {
  coolDownModel,
  lockUser,
  recordTokens,
  takeModelSlot,
  takeUserSlot,
  unlockUser,
  type LimitRefusal,
} from "./limiter";
import { loadMemory, type MemoryTurn, remember, userTurn } from "./memory";
import { buildSystemPrompt, languageName } from "./persona";
import type { Plan, ToolRuntime } from "./tools/types";

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
  /** Pictures of the message, already downloaded. */
  images?: AiImage[];
  /** Pictures that were attached but could not be loaded. */
  imagesFailed?: number;
  /** Pictures that were attached while the server has looking at pictures switched off. */
  imagesOff?: number;
  /** Code and text files of the message, already downloaded. */
  files?: CodeFile[];
  /** Files that were attached but could not be read (too big, binary, not downloadable). */
  filesFailed?: number;
  /** Files that were attached while the server has reading code files switched off. */
  filesOff?: number;
  /** Language code of the server. */
  lang: string;
  settings: Pick<AiSettings, "model" | "persona" | "limits" | "options">;
  /**
   * Tools to act on the server with. Only given when the member is an administrator; the caller
   * is the one who knows. Left out, the AI only chats.
   */
  tools?: ToolRuntime | null;
}

export type AiChatResult =
  | {
      ok: true;
      /** The answer. It can be empty when there is a plan to show instead. */
      text: string;
      model: AiModel;
      /** Notes about the member that were stored or updated by this answer. */
      remembered: number;
      /** Changes the AI prepared with its tools. They wait for the administrator to confirm them. */
      plan: Plan | null;
    }
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

/** What to tell the model about pictures and files that are, or are not, part of the message. */
function attachmentNotes(request: AiChatRequest): string {
  const notes: string[] = [];
  const files = request.files ?? [];
  if (files.length > 0) {
    notes.push(
      `[the message has ${files.length} file(s): ${files.map((file) => file.name).join(", ")}]`,
    );
  }
  if (request.filesFailed) {
    notes.push(
      `[${request.filesFailed} file(s) could not be read: too big, not text, or not downloadable]`,
    );
  }
  if (request.filesOff) {
    notes.push(
      `[${request.filesOff} file(s) attached, but reading code files is switched off on this server]`,
    );
  }
  const shown = request.images?.length ?? 0;
  if (shown > 0) notes.push(`[the message has ${shown} picture${shown === 1 ? "" : "s"}]`);
  if (request.imagesFailed) notes.push(`[${request.imagesFailed} picture(s) could not be loaded]`);
  if (request.imagesOff) {
    notes.push(
      `[${request.imagesOff} picture(s) attached, but looking at pictures is switched off on this server]`,
    );
  }
  return notes.length > 0 ? `\n${notes.join(" ")}` : "";
}

function turnFor(request: AiChatRequest): MemoryTurn {
  const text = request.replyTo
    ? `(replying to ${request.replyTo.name}: "${request.replyTo.text}")\n${request.text}`
    : request.text;
  return userTurn(request.userName, `${text}${attachmentNotes(request)}`, request.userId);
}

/** The other people in the recent conversation, newest first, whose notes may help. */
function participants(turns: MemoryTurn[], speakerId: string): { id: string; name: string }[] {
  const seen = new Map<string, string>();
  for (const turn of [...turns].reverse()) {
    if (turn.role !== "user" || !turn.uid || turn.uid === speakerId || seen.has(turn.uid)) continue;
    seen.set(turn.uid, turn.name ?? "someone");
    if (seen.size === 3) break;
  }
  return [...seen].map(([id, name]) => ({ id, name }));
}

/** At most this many notes are taken from one answer. */
const MAX_NOTES_PER_ANSWER = 3;

/** Apply the model's `[[remember]]` and `[[forget]]` markers. A failure here never costs the answer. */
async function applyNotes(
  guildId: string,
  userId: string,
  remember: string[],
  forget: string[],
): Promise<number> {
  let changed = 0;
  try {
    for (const fact of forget.slice(0, MAX_NOTES_PER_ANSWER)) {
      if (await forgetFact(guildId, userId, fact)) changed++;
    }
    for (const fact of remember.slice(0, MAX_NOTES_PER_ANSWER)) {
      const outcome = await rememberFact(guildId, userId, fact);
      if (outcome === "stored" || outcome === "updated") changed++;
    }
  } catch (error) {
    console.error("[AI] Could not write long-term memory:".red, error);
  }
  return changed;
}

/** Calls of one answer that are run; a model that sends more is told to send the rest later. */
const MAX_CALLS_PER_ROUND = 8;

/**
 * What the channel remembers of an answer. A plan is part of it, so "make it 10 instead" a
 * minute later still has something to refer to.
 */
function memoryOf(text: string, plan: Plan | null): string {
  if (!plan) return text;
  const lines = plan.steps.flatMap((step) => step.lines).slice(0, 12);
  return `${text}\n[queued for the administrator's confirmation, not applied yet: ${lines.join("; ")}]`.trim();
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

    const {
      short_term: shortTerm,
      long_term: longTerm,
      images: imagesOn,
      code: codeOn,
    } = settings.options;

    const recent = shortTerm ? await loadMemory(channelId) : [];

    let recalled: Recalled | undefined;
    if (longTerm) {
      try {
        recalled = await recall(guildId, userId, participants(recent, userId));
      } catch (error) {
        console.error("[AI] Could not read long-term memory:".red, error);
      }
    }

    const images = imagesOn ? (request.images ?? []) : [];
    const files = codeOn ? (request.files ?? []) : [];
    const runtime = request.tools ?? null;

    // The prompt promises tools only when the request really carries them.
    const promptFor = (canAct: boolean) =>
      buildSystemPrompt({
        guildName: request.guildName,
        channelName: request.channelName,
        languageName: languageName(request.lang),
        serverPersona: settings.persona,
        longTermMemory: longTerm,
        recalled,
        speakerName: request.userName,
        hasImages: images.length > 0,
        hasFiles: files.length > 0,
        canAct,
      });
    const userMessage = turnFor({ ...request, images, files });
    // The files and the ids behind mentions travel with this message only: they are not part of
    // what the channel remembers.
    const turnsFor = (canAct: boolean) => [
      ...recent,
      {
        ...userMessage,
        images,
        extra: [formatCodeFiles(files), canAct ? runtime?.notes : null]
          .filter(Boolean)
          .join("\n\n"),
      },
    ];
    const baseOptions: GenerateOptions =
      files.length > 0 ? { maxOutputTokens: AI_MAX_OUTPUT_TOKENS_CODE } : {};
    const toolOptions: GenerateOptions = {
      maxOutputTokens: Math.max(AI_MAX_OUTPUT_TOKENS_TOOLS, baseOptions.maxOutputTokens ?? 0),
      // Calls have to be exact; the chat around them can stay lively.
      temperature: 0.6,
    };

    let failure: "quota" | "unavailable" = "quota";
    let reachedModel = false;

    for (const model of modelOrder(settings.model)) {
      let slot = await takeModelSlot(model.key);
      if (!slot) continue;

      // Every model starts with a clean plan: what an earlier one queued is not carried over.
      let session = runtime && modelTakesTools(model) ? runtime.start() : null;
      const exchanges: ToolExchange[] = [];
      let answer = "";
      // The model could not finish (no quota left for another round): show what it queued so far.
      let cutShort = false;

      try {
        for (let round = 1; ; round++) {
          const result = await generate(
            model,
            promptFor(session !== null),
            turnsFor(session !== null),
            session ? { ...toolOptions, tools: session.declarations, exchanges } : baseOptions,
          );
          reachedModel = true;
          await recordTokens(model.key, result.totalTokens);

          if (session && result.toolsDropped) {
            // The model turned out not to take tools, and answered a prompt that promised them.
            // Ask again as plain chat, so it does not claim to have prepared anything.
            session = null;
            exchanges.length = 0;
            slot = await takeModelSlot(model.key);
            if (!slot) {
              cutShort = true;
              break;
            }
            continue;
          }

          answer = result.text;
          if (!session || result.calls.length === 0) break;

          const responses: ToolExchange["responses"] = [];
          for (const [index, call] of result.calls.entries()) {
            responses.push({
              call,
              response:
                index < MAX_CALLS_PER_ROUND
                  ? await session.execute(call)
                  : { error: "too many calls at once, send the rest in the next step" },
            });
          }
          exchanges.push({ modelContent: result.modelContent, responses });

          if (round >= AI_MAX_TOOL_ROUNDS) {
            cutShort = true;
            break;
          }
          // Every round is a request of its own against the quota of the key.
          slot = await takeModelSlot(model.key);
          if (!slot) {
            cutShort = true;
            break;
          }
        }

        const plan = session ? await session.plan() : null;
        // The markers are taken out of every answer, whether or not this server keeps notes.
        const markers = extractMarkers(answer);
        const text = sanitizeReply(markers.text);

        if (!text && !plan) {
          if (!cutShort) return { ok: false, reason: "blocked" };
          // This model ran out of quota or rounds with nothing to show: the next one may manage.
          failure = "quota";
          continue;
        }

        const remembered = longTerm
          ? await applyNotes(guildId, userId, markers.remember, markers.forget)
          : 0;
        if (shortTerm) await remember(channelId, userMessage, memoryOf(text, plan));
        return { ok: true, text, model, remembered, plan };
      } catch (error) {
        if (!(error instanceof GeminiError)) {
          console.error("[AI] Unexpected error:".red, error);
          await slot?.refund();
          return { ok: false, reason: "error" };
        }

        const { failure: cause } = error;

        // A later round failed, but the earlier ones already queued something worth showing.
        const plan = session && exchanges.length > 0 ? await session.plan() : null;
        if (plan && cause.kind !== "fatal") {
          if (cause.kind === "quota") await coolDownModel(model.key, cause.retryAfter);
          if (shortTerm) await remember(channelId, userMessage, memoryOf("", plan));
          return { ok: true, text: "", model, remembered: 0, plan };
        }

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
          // The slot stays used: a timeout or a 5xx may still have counted at Google, and the
          // per-minute limit of the key is a hard one.
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
