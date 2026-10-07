const ZERO_WIDTH = "​";
const DISCORD_LIMIT = 2000;

/**
 * Make a model answer safe to post: no label with the bot's own name, no way to
 * ping everyone or a role (messages are also sent with mentions switched off,
 * this keeps the text from looking like a ping).
 */
export function sanitizeReply(text: string): string {
  return text
    .replace(/^\s*(?:amelia|assistant|model)\s*:\s*/i, "")
    .replace(/@(everyone|here)/gi, `@${ZERO_WIDTH}$1`)
    .replace(/<@&(\d+)>/g, `<@${ZERO_WIDTH}&$1>`)
    .trim();
}

/** Split a long answer on line, sentence or word boundaries into Discord-sized messages. */
export function splitReply(text: string, limit = DISCORD_LIMIT): string[] {
  const chunks: string[] = [];
  let rest = text.trim();

  while (rest.length > limit) {
    const window = rest.slice(0, limit);
    let cut = Math.max(window.lastIndexOf("\n"), window.lastIndexOf(". "), window.lastIndexOf(" "));
    if (cut < limit / 2) cut = limit;
    chunks.push(rest.slice(0, cut).trim());
    rest = rest.slice(cut).trim();
  }

  if (rest) chunks.push(rest);
  return chunks;
}
