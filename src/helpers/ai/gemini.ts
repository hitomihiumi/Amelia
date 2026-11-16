import axios, { AxiosError } from "axios";
import { AI_API_BASE, AI_MAX_OUTPUT_TOKENS, AI_REQUEST_TIMEOUT_MS, type AiModel } from "./config";
import { parseJson } from "./json";
import type { ToolCall, ToolDeclaration } from "./tools/types";

/** An image sent along with a turn, base64 encoded as the API wants it. */
export interface AiImage {
  mimeType: string;
  data: string;
}

/** One turn of the conversation sent to the model. */
export interface AiTurn {
  role: "user" | "model";
  text: string;
  /** Pictures of the turn. Only the newest user turn carries any. */
  images?: AiImage[];
  /** Text sent with the turn but never kept in memory, such as the contents of attached files. */
  extra?: string;
}

/**
 * One round of tool use that already happened in this request: what the model asked for and what
 * the tools answered. It is sent back so the model can go on from there.
 */
export interface ToolExchange {
  /** The model's turn exactly as the API returned it (calls, thoughts and their signatures). */
  modelContent: unknown;
  responses: { call: ToolCall; response: Record<string, unknown> }[];
}

export interface GenerateOptions {
  maxOutputTokens?: number;
  temperature?: number;
  /** Functions the model may call instead of answering. */
  tools?: ToolDeclaration[];
  /** Earlier rounds of this request, oldest first. */
  exchanges?: ToolExchange[];
}

export interface GenerateResult {
  text: string;
  /** Tokens the request used, prompt and answer together. */
  totalTokens: number;
  /** The model could not take the images, so it answered without seeing them. */
  imagesDropped: boolean;
  /** Functions the model wants run before it answers. Empty when the text is the answer. */
  calls: ToolCall[];
  /** The model's turn as the API returned it, to send back with the results of the calls. */
  modelContent: unknown;
  /** Tools were asked for, but this model does not take them: it answered without. */
  toolsDropped: boolean;
}

export type GeminiFailure =
  /** 429: the key's quota for this model is spent. */
  | { kind: "quota"; retryAfter: number }
  /** The model refused to answer (safety filter, empty answer). */
  | { kind: "blocked" }
  /** Network error, timeout or a 5xx: worth trying another model. */
  | { kind: "unavailable"; status: number | null }
  /** Bad key or a request the API rejects: another model will not help. */
  | { kind: "fatal"; status: number | null; message: string };

export class GeminiError extends Error {
  constructor(public failure: GeminiFailure) {
    super(`Gemini request failed: ${failure.kind}`);
  }
}

/** Behaviour of the API that differs between models, learned from its errors. */
const quirks = {
  /** The model rejected `thinkingConfig`. */
  noThinking: new Set<string>(),
  /** The model rejected `systemInstruction`; the prompt goes into the first turn instead. */
  noSystemInstruction: new Set<string>(),
  /** The model rejected pictures; they are left out and the question says so. */
  noImages: new Set<string>(),
  /** The model rejected function declarations; it only chats. */
  noTools: new Set<string>(),
};

/** Whether a model is known to refuse tools, so the prompt does not promise them. */
export function modelTakesTools(model: AiModel): boolean {
  return !quirks.noTools.has(model.id);
}

/** Added to the question when the pictures had to be left out, so the answer does not pretend. */
const IMAGES_DROPPED_NOTE =
  "\n(The image or images of this message could not be processed and you cannot see them. Say so instead of guessing what they show.)";

/**
 * The API wants the conversation to start with the user and to alternate.
 * Neighbouring turns of the same role are merged, and a leading model turn is dropped.
 */
export function normalizeTurns(turns: AiTurn[]): AiTurn[] {
  const merged: AiTurn[] = [];
  for (const turn of turns) {
    if (!turn.text.trim()) continue;
    const last = merged[merged.length - 1];
    if (last && last.role === turn.role) {
      last.text += `\n${turn.text}`;
      if (turn.images?.length) last.images = [...(last.images ?? []), ...turn.images];
      if (turn.extra) last.extra = last.extra ? `${last.extra}\n\n${turn.extra}` : turn.extra;
    } else {
      merged.push({ ...turn });
    }
  }
  while (merged.length > 0 && merged[0].role !== "user") merged.shift();
  return merged;
}

function buildBody(
  model: AiModel,
  system: string,
  turns: AiTurn[],
  useThinking: boolean,
  options: GenerateOptions,
) {
  const useSystem = !quirks.noSystemInstruction.has(model.id);
  const dropImages = quirks.noImages.has(model.id);
  const normalized = normalizeTurns(turns);
  const hadImages = normalized.some((turn) => turn.images?.length);

  const contents: { role: string; parts: Record<string, unknown>[] }[] = normalized.map(
    (turn, index) => {
      const note =
        dropImages && hadImages && index === normalized.length - 1 ? IMAGES_DROPPED_NOTE : "";
      return {
        role: turn.role,
        parts: [
          { text: turn.text + (turn.extra ? `\n\n${turn.extra}` : "") + note },
          ...(dropImages
            ? []
            : (turn.images ?? []).map((image) => ({
                inlineData: { mimeType: image.mimeType, data: image.data },
              }))),
        ] as Record<string, unknown>[],
      };
    },
  );

  if (!useSystem && contents.length > 0) {
    contents[0].parts[0].text = `${system}\n\n---\n\n${String(contents[0].parts[0].text)}`;
  }

  const useTools = Boolean(options.tools?.length) && !quirks.noTools.has(model.id);
  if (useTools) {
    for (const exchange of options.exchanges ?? []) {
      contents.push(exchange.modelContent as (typeof contents)[number]);
      contents.push({
        role: "user",
        parts: exchange.responses.map(({ call, response }) => ({
          functionResponse: { name: call.name, response, ...(call.id ? { id: call.id } : {}) },
        })),
      });
    }
  }

  const generationConfig: Record<string, unknown> = {
    maxOutputTokens: options.maxOutputTokens ?? AI_MAX_OUTPUT_TOKENS,
    temperature: options.temperature ?? 0.9,
    topP: 0.95,
  };
  // Chat wants quick answers, so the reasoning phase is switched off where the model allows it.
  if (useThinking) generationConfig.thinkingConfig = { thinkingLevel: "minimal" };

  return {
    ...(useSystem ? { systemInstruction: { parts: [{ text: system }] } } : {}),
    contents,
    generationConfig,
    ...(useTools ? { tools: [{ functionDeclarations: options.tools }] } : {}),
  };
}

function retryAfterSeconds(error: AxiosError): number {
  const header = Number(error.response?.headers?.["retry-after"]);
  if (Number.isFinite(header) && header > 0) return header;

  // The error body of a 429 carries the delay as "retryDelay": "34s".
  const details = (error.response?.data as any)?.error?.details;
  if (Array.isArray(details)) {
    for (const detail of details) {
      const match = /^(\d+(?:\.\d+)?)s$/.exec(detail?.retryDelay ?? "");
      if (match) return Math.ceil(Number(match[1]));
    }
  }
  return 60;
}

function errorMessage(error: AxiosError): string {
  return String((error.response?.data as any)?.error?.message ?? error.message ?? "");
}

/**
 * Ask a model for the next reply of the conversation.
 * Throws a {@link GeminiError} that says whether another model is worth trying.
 */
export async function generate(
  model: AiModel,
  system: string,
  turns: AiTurn[],
  options: GenerateOptions = {},
): Promise<GenerateResult> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new GeminiError({ kind: "fatal", status: null, message: "No API key" });

  const wantsTools = Boolean(options.tools?.length);

  // A few retries, one for each thing a model may reject: thinking, a system instruction, images, tools.
  for (let attempt = 0; attempt < 5; attempt++) {
    const body = buildBody(model, system, turns, !quirks.noThinking.has(model.id), options);

    try {
      const { data } = await axios.post(`${AI_API_BASE}/models/${model.id}:generateContent`, body, {
        headers: { "x-goog-api-key": apiKey, "Content-Type": "application/json" },
        timeout: AI_REQUEST_TIMEOUT_MS,
        // Ids in the arguments of a call must survive as written, see `parseJson`.
        transformResponse: (raw) => {
          if (typeof raw !== "string") return raw;
          try {
            return parseJson(raw);
          } catch {
            return raw;
          }
        },
      });

      const candidate = data?.candidates?.[0];
      const parts: any[] = candidate?.content?.parts ?? [];
      // Parts marked as thoughts are the model's reasoning, not part of the answer.
      const text = String(
        parts
          .filter((part: any) => !part?.thought && typeof part?.text === "string")
          .map((part: any) => part.text)
          .join(""),
      ).trim();

      const toolsDropped = wantsTools && quirks.noTools.has(model.id);
      const calls: ToolCall[] = toolsDropped
        ? []
        : parts
            .filter((part: any) => typeof part?.functionCall?.name === "string")
            .map((part: any) => ({
              name: part.functionCall.name,
              args:
                part.functionCall.args && typeof part.functionCall.args === "object"
                  ? part.functionCall.args
                  : {},
              ...(part.functionCall.id ? { id: String(part.functionCall.id) } : {}),
            }));

      if (!text && calls.length === 0) throw new GeminiError({ kind: "blocked" });

      return {
        text,
        totalTokens: Number(data?.usageMetadata?.totalTokenCount ?? 0),
        imagesDropped: quirks.noImages.has(model.id) && turns.some((turn) => turn.images?.length),
        calls,
        modelContent: { role: "model", parts },
        toolsDropped,
      };
    } catch (error) {
      if (error instanceof GeminiError) throw error;
      if (!axios.isAxiosError(error)) throw error;

      const status = error.response?.status ?? null;
      const message = errorMessage(error);

      if (status === 429) {
        throw new GeminiError({ kind: "quota", retryAfter: retryAfterSeconds(error) });
      }

      if (status === 400) {
        if (/thinking/i.test(message) && !quirks.noThinking.has(model.id)) {
          quirks.noThinking.add(model.id);
          continue;
        }
        if (
          /(system|developer) instruction/i.test(message) &&
          !quirks.noSystemInstruction.has(model.id)
        ) {
          quirks.noSystemInstruction.add(model.id);
          continue;
        }
        if (wantsTools && /function|tool/i.test(message) && !quirks.noTools.has(model.id)) {
          // Either this model has no function calling or it refuses our declarations. The bot
          // goes on as a plain chat, and the log says why the tools are gone.
          console.warn(
            `[AI] ${model.id} does not accept tools, continuing without: ${message}`.yellow,
          );
          quirks.noTools.add(model.id);
          continue;
        }
        if (
          /image|mime|inline[_ ]?data|media|vision|multimodal/i.test(message) &&
          turns.some((turn) => turn.images?.length) &&
          !quirks.noImages.has(model.id)
        ) {
          quirks.noImages.add(model.id);
          continue;
        }
      }

      // 5xx, timeouts and dropped connections are the model's problem, not the request's.
      if (status === null || status >= 500 || status === 408) {
        throw new GeminiError({ kind: "unavailable", status });
      }

      throw new GeminiError({ kind: "fatal", status, message });
    }
  }

  throw new GeminiError({ kind: "fatal", status: 400, message: "Request was rejected" });
}
