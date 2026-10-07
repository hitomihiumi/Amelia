import axios, { AxiosError } from "axios";
import { AI_API_BASE, AI_MAX_OUTPUT_TOKENS, AI_REQUEST_TIMEOUT_MS, type AiModel } from "./config";

/** One turn of the conversation sent to the model. */
export interface AiTurn {
  role: "user" | "model";
  text: string;
}

export interface GenerateResult {
  text: string;
  /** Tokens the request used, prompt and answer together. */
  totalTokens: number;
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
};

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
    } else {
      merged.push({ ...turn });
    }
  }
  while (merged.length > 0 && merged[0].role !== "user") merged.shift();
  return merged;
}

function buildBody(model: AiModel, system: string, turns: AiTurn[], useThinking: boolean) {
  const useSystem = !quirks.noSystemInstruction.has(model.id);
  const contents = normalizeTurns(turns).map((turn) => ({
    role: turn.role,
    parts: [{ text: turn.text }],
  }));

  if (!useSystem && contents.length > 0) {
    contents[0].parts[0].text = `${system}\n\n---\n\n${contents[0].parts[0].text}`;
  }

  const generationConfig: Record<string, unknown> = {
    maxOutputTokens: AI_MAX_OUTPUT_TOKENS,
    temperature: 0.9,
    topP: 0.95,
  };
  // Chat wants quick answers, so the reasoning phase is switched off where the model allows it.
  if (useThinking) generationConfig.thinkingConfig = { thinkingLevel: "minimal" };

  return {
    ...(useSystem ? { systemInstruction: { parts: [{ text: system }] } } : {}),
    contents,
    generationConfig,
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
): Promise<GenerateResult> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new GeminiError({ kind: "fatal", status: null, message: "No API key" });

  // At most two retries: one when thinking is rejected, one when the system instruction is.
  for (let attempt = 0; attempt < 3; attempt++) {
    const body = buildBody(model, system, turns, !quirks.noThinking.has(model.id));

    try {
      const { data } = await axios.post(`${AI_API_BASE}/models/${model.id}:generateContent`, body, {
        headers: { "x-goog-api-key": apiKey, "Content-Type": "application/json" },
        timeout: AI_REQUEST_TIMEOUT_MS,
      });

      const candidate = data?.candidates?.[0];
      // Parts marked as thoughts are the model's reasoning, not part of the answer.
      const text = String(
        (candidate?.content?.parts ?? [])
          .filter((part: any) => !part?.thought && typeof part?.text === "string")
          .map((part: any) => part.text)
          .join(""),
      ).trim();

      if (!text) throw new GeminiError({ kind: "blocked" });

      return { text, totalTokens: Number(data?.usageMetadata?.totalTokenCount ?? 0) };
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
