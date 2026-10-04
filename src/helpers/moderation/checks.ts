import { GuildMember, PermissionsBitField } from "discord.js";
import { Guild } from "../Guild";

/**
 * Reasons a moderator is not allowed to act on a member.
 * Every value maps to a `moderation.errors.*` translation key.
 */
export type ActionBlockReason = "self" | "bot" | "owner" | "hierarchy";

/**
 * A member is a moderator when they hold one of the configured moderation roles,
 * or when Discord already grants them moderation permissions.
 */
export async function isModerator(guild: Guild, member: GuildMember): Promise<boolean> {
  if (member.id === member.guild.ownerId) return true;

  if (
    member.permissions.has(PermissionsBitField.Flags.Administrator) ||
    member.permissions.has(PermissionsBitField.Flags.ModerateMembers)
  ) {
    return true;
  }

  const roles = (await guild.get("moderation.moderation_roles")) || [];
  return roles.some((roleId) => member.roles.cache.has(roleId));
}

/**
 * Check whether `moderator` may act on `target`.
 * Returns `null` when the action is allowed.
 */
export function canActOn(moderator: GuildMember, target: GuildMember): ActionBlockReason | null {
  if (moderator.id === target.id) return "self";
  if (target.id === target.client.user?.id) return "bot";
  if (target.id === target.guild.ownerId) return "owner";

  // The guild owner always outranks everyone else.
  if (moderator.id === moderator.guild.ownerId) return null;

  if (target.roles.highest.position >= moderator.roles.highest.position) return "hierarchy";

  return null;
}

/**
 * Check whether the bot itself is high enough in the hierarchy to act on `target`.
 */
export function botCanActOn(target: GuildMember): boolean {
  const me = target.guild.members.me;
  if (!me) return false;
  if (target.id === target.guild.ownerId) return false;
  return me.roles.highest.position > target.roles.highest.position;
}
