/**
 * Simplified link patterns for the auto moderation whitelist.
 *
 * Server administrators are not expected to write regular expressions, so the
 * whitelist accepts a tiny glob syntax instead: `*` stands for "anything", every
 * other character is literal. The pattern is compiled into an anchored RegExp,
 * which keeps matching predictable and makes catastrophic backtracking
 * impossible.
 *
 * This module is mirrored in the dashboard repository
 * (`src/lib/moderation/linkPatterns.ts`) — keep both copies in sync.
 *
 *   youtube.com            → the domain, every subdomain, every path
 *   *.wikipedia.org        → subdomains only
 *   discord.com/channels/* → only links pointing at a channel
 *   *docs*                 → any link containing "docs"
 */

/** Longest pattern accepted from the dashboard. */
export const MAX_PATTERN_LENGTH = 200;

/** More wildcards than this is always a mistake, and slows matching down. */
const MAX_WILDCARDS = 10;

/** Anything that may follow a host or a path: `/page`, `?query`, `#anchor`. */
const OPTIONAL_TAIL = "(?:[/?#].*)?";

/** Subdomain prefix used when the pattern is a bare domain. */
const SUBDOMAIN_PREFIX = "(?:[a-z0-9-]+\\.)*";

const compiled = new Map<string, RegExp | null>();

/**
 * Bring a link or a pattern to the shape used for matching: lower case, without
 * the scheme, without `www.` and without a trailing slash.
 */
export function normalizeLink(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/^[a-z][a-z0-9+.-]*:\/\//, "")
    .replace(/^www\./, "")
    .replace(/\/+$/, "");
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Compile a whitelist pattern into an anchored RegExp.
 * Returns `null` when the pattern is empty or obviously invalid.
 */
export function compileLinkPattern(pattern: string): RegExp | null {
  if (compiled.has(pattern)) return compiled.get(pattern) ?? null;

  const result = build(pattern);
  compiled.set(pattern, result);
  return result;
}

function build(pattern: string): RegExp | null {
  const cleaned = normalizeLink(pattern).replace(/\*{2,}/g, "*");

  if (!cleaned || /\s/.test(cleaned)) return null;
  if (cleaned.length > MAX_PATTERN_LENGTH) return null;
  if ((cleaned.match(/\*/g)?.length ?? 0) > MAX_WILDCARDS) return null;

  // Only `*` is a wildcard: URLs are full of `?`, so treating it as one would
  // silently turn query strings into wildcards.
  const body = escapeRegExp(cleaned).replace(/\\\*/g, ".*");

  // A bare domain covers its subdomains as well, which is what "ignore
  // youtube.com" means to everyone who is not writing regular expressions.
  const isBareDomain = !cleaned.includes("*") && !cleaned.includes("/");
  const head = isBareDomain ? `${SUBDOMAIN_PREFIX}${body}` : body;

  // A pattern always covers the deeper paths and the query string of what it
  // matched: "example.com/blog" is meant to cover "example.com/blog/post".
  try {
    return new RegExp(`^${head}${OPTIONAL_TAIL}$`);
  } catch {
    return null;
  }
}

/**
 * Check a link against the whitelist.
 * Returns the pattern that matched, or `null` when the link is not ignored.
 */
export function isLinkIgnored(link: string, patterns: string[]): string | null {
  const normalized = normalizeLink(link);
  if (!normalized) return null;

  for (const pattern of patterns) {
    const regex = compileLinkPattern(pattern);
    if (regex?.test(normalized)) return pattern;
  }

  return null;
}

/**
 * Validate a pattern coming from the dashboard.
 * Returns an error message, or `null` when the pattern is usable.
 */
export function validateLinkPattern(pattern: string): string | null {
  const cleaned = normalizeLink(pattern);

  if (!cleaned) return "Pattern cannot be empty.";
  if (/\s/.test(cleaned)) return `"${pattern}" cannot contain spaces.`;
  if (cleaned.length > MAX_PATTERN_LENGTH) {
    return `"${pattern}" is longer than ${MAX_PATTERN_LENGTH} characters.`;
  }
  if ((cleaned.match(/\*/g)?.length ?? 0) > MAX_WILDCARDS) {
    return `"${pattern}" uses more than ${MAX_WILDCARDS} wildcards.`;
  }
  if (!compileLinkPattern(pattern)) return `"${pattern}" is not a valid pattern.`;

  return null;
}
