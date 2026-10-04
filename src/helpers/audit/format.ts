import { GuildMember, PartialUser, Role, User } from "discord.js";

/** `@mention (username)` — the shape used in every audit headline. */
export function describeUser(user: User | PartialUser | GuildMember | null): string {
  if (!user) return "—";

  const resolved = "user" in user ? user.user : user;
  return `<@${resolved.id}> (${resolved.username ?? resolved.id})`;
}

/** Discord renders its own timestamps in the reader's locale. */
export function absoluteDate(timestamp: number | Date | null): string {
  if (!timestamp) return "—";

  const seconds = Math.floor((timestamp instanceof Date ? timestamp.getTime() : timestamp) / 1000);
  return `<t:${seconds}:D> (<t:${seconds}:R>)`;
}

export function channelMention(channelId: string | null | undefined): string {
  return channelId ? `<#${channelId}>` : "—";
}

export function roleMentions(roles: Role[], fallback: string): string {
  if (roles.length === 0) return fallback;
  return roles
    .map((role) => `<@&${role.id}>`)
    .join(", ")
    .slice(0, 1024);
}

/** Message content in a code block, trimmed to what an embed field can hold. */
export function contentBlock(content: string): string {
  const trimmed = content.length > 950 ? `${content.slice(0, 950)}…` : content;
  return `\`\`\`\n${trimmed.replace(/```/g, "``ˋ")}\n\`\`\``;
}

/**
 * Old and new content as a diff block, the way JuniperBot renders edits:
 * removed lines prefixed with `-`, added lines with `+`.
 */
export function diffBlock(before: string, after: string): string {
  const format = (value: string, prefix: string) =>
    value
      .split("\n")
      .map((line) => `${prefix}${line}`)
      .join("\n");

  const body = `${format(before, "-")}\n${format(after, "+")}`;
  const trimmed = body.length > 950 ? `${body.slice(0, 950)}…` : body;

  return `\`\`\`diff\n${trimmed.replace(/```/g, "``ˋ")}\n\`\`\``;
}
