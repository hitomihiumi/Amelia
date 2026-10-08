import { type AiSettings, clampLimits } from "../../types/helpers";
import { AI_MAX_OUTPUT_TOKENS_CODE, modelOrder, type AiModel } from "./config";
import { type CodeFile, formatCodeFiles } from "./files";
import { GeminiError, generate, type AiImage } from "./gemini";
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
}

export type AiChatResult =
  | {
      ok: true;
      text: string;
      model: AiModel;
      /** Notes about the member that were stored or updated by this answer. */
      remembered: number;
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
    const system = buildSystemPrompt({
      guildName: request.guildName,
      channelName: request.channelName,
      languageName: languageName(request.lang),
      serverPersona: settings.persona,
      longTermMemory: longTerm,
      recalled,
      speakerName: request.userName,
      hasImages: images.length > 0,
      hasFiles: files.length > 0,
    });
    const userMessage = turnFor({ ...request, images, files });
    // The files travel with this message only: they are not part of what the channel remembers.
    const turns = [...recent, { ...userMessage, images, extra: formatCodeFiles(files) }];
    const generateOptions = files.length > 0 ? { maxOutputTokens: AI_MAX_OUTPUT_TOKENS_CODE } : {};

    let failure: "quota" | "unavailable" = "quota";
    let reachedModel = false;

    for (const model of modelOrder(settings.model)) {
      const slot = await takeModelSlot(model.key);
      if (!slot) continue;

      try {
        const result = await generate(model, system, turns, generateOptions);
        // The markers are taken out of every answer, whether or not this server keeps notes.
        const markers = extractMarkers(result.text);
        const text = sanitizeReply(markers.text);
        reachedModel = true;

        await recordTokens(model.key, result.totalTokens);
        if (!text) return { ok: false, reason: "blocked" };

        const remembered = longTerm
          ? await applyNotes(guildId, userId, markers.remember, markers.forget)
          : 0;
        if (shortTerm) await remember(channelId, userMessage, text);
        return { ok: true, text, model, remembered };
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
