import type { Message } from "discord.js";
import { createToolSession } from "./session";
import type { ToolContext, ToolRuntime } from "./types";

export * from "./types";
export * from "./plan";
export { TOOL_DECLARATIONS, createToolSession } from "./session";

/**
 * Mentions reach the model as names (`@Mira`, `#rules`), which is what a chat needs. To act on
 * them it needs the ids behind the names, so they are listed next to the message.
 */
export function mentionNotes(message: Message, botId: string): string | null {
  const notes: string[] = [];

  for (const [id, user] of message.mentions.users) {
    if (id === botId) continue;
    const name = message.mentions.members?.get(id)?.displayName ?? user.displayName;
    notes.push(`@${name} = user ${id}`);
  }
  for (const [id, role] of message.mentions.roles) notes.push(`@${role.name} = role ${id}`);
  for (const [id, channel] of message.mentions.channels) {
    if ("name" in channel && channel.name) notes.push(`#${channel.name} = channel ${id}`);
  }

  return notes.length > 0 ? `[ids: ${notes.slice(0, 20).join("; ")}]` : null;
}

/** The tools for one message of an administrator. The caller has checked that they are one. */
export function createToolRuntime(ctx: ToolContext, notes: string | null = null): ToolRuntime {
  return { notes, start: () => createToolSession(ctx) };
}
