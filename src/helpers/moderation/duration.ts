/**
 * Duration helpers for moderation commands.
 *
 * Formatting of an already known duration is done with `formatTime` from
 * `handlers/functions` (it is locale aware), this file only parses user input.
 */

const UNIT_SECONDS: Record<string, number> = {
  s: 1,
  m: 60,
  h: 3600,
  d: 86400,
  w: 604800,
};

const DURATION_PART = /(\d+)\s*([smhdw])/gi;

/** Discord timeouts are capped at 28 days. */
export const MAX_TIMEOUT_SECONDS = 28 * 24 * 60 * 60;

/**
 * Parse a human duration such as `30m`, `2h30m` or `7d` into seconds.
 * Returns `null` when the input cannot be parsed or is not positive.
 */
export function parseDuration(input: string | null | undefined): number | null {
  if (!input) return null;

  const normalized = input.trim().toLowerCase();
  if (!normalized) return null;

  // Bare numbers are treated as minutes, which is what most moderators expect.
  if (/^\d+$/.test(normalized)) {
    const minutes = Number(normalized);
    return minutes > 0 ? minutes * 60 : null;
  }

  DURATION_PART.lastIndex = 0;
  let total = 0;
  let matched = false;
  let consumed = 0;

  for (const match of normalized.matchAll(DURATION_PART)) {
    matched = true;
    consumed += match[0].length;
    total += Number(match[1]) * UNIT_SECONDS[match[2]];
  }

  // Reject inputs with leftovers like "2h banana"
  if (!matched || consumed !== normalized.replace(/\s+/g, "").length) return null;

  return total > 0 ? total : null;
}
