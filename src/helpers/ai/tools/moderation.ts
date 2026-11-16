import {
  ChannelType,
  type GuildMember,
  type Message,
  PermissionFlagsBits,
  type TextChannel,
} from "discord.js";
import { prisma } from "../../../database";
import { t } from "../../../i18n/helpers";
import { botCanActOn, canActOn } from "../../moderation/checks";
import { MAX_TIMEOUT_SECONDS, parseDuration } from "../../moderation/duration";
import { ModerationService } from "../../moderation/ModerationService";
import { parseLoose, resolveChannel } from "./spec";
import type { ModerationAction, ModerationOp, StepResult, ToolContext } from "./types";

/**
 * Moderation for the AI: the same actions as the `/mod` commands, through the same service, so a
 * case, the log entry, the DM and the warn escalation come out exactly as they do for a command.
 * The administrator who asked is the moderator of the case and their place in the role hierarchy
 * is what counts.
 */

export const MODERATION_ACTIONS: ModerationAction[] = [
  "warn",
  "mute",
  "kick",
  "ban",
  "unmute",
  "unban",
  "unwarn",
  "note",
  "purge",
  "slowmode",
];

const ICON: Record<ModerationAction, string> = {
  warn: "⚠️",
  mute: "🔇",
  kick: "👢",
  ban: "🔨",
  unmute: "🔊",
  unban: "🕊️",
  unwarn: "↩️",
  note: "📝",
  purge: "🧹",
  slowmode: "🐢",
};

const MAX_SLOWMODE_SECONDS = 21600;
const PURGE_MAX_AGE_MS = 14 * 24 * 60 * 60 * 1000;
const SNOWFLAKE = /^\d{17,20}$/;

type Found = { ok: true; id: string; member: GuildMember | null } | { ok: false; error: string };

/** A user by id, mention or name. Someone who left the server can only be named by id. */
async function resolveUser(ctx: ToolContext, raw: unknown): Promise<Found> {
  const input = String(raw ?? "").trim();
  if (!input) return { ok: false, error: "user is required" };

  const id = /^<@!?(\d{17,20})>$/.exec(input)?.[1] ?? (SNOWFLAKE.test(input) ? input : null);
  if (id) {
    const member = await ctx.discordGuild.members.fetch(id).catch(() => null);
    if (member) return { ok: true, id, member };
    const user = await ctx.client.users.fetch(id).catch(() => null);
    return user ? { ok: true, id, member: null } : { ok: false, error: `no user with id ${id}` };
  }

  const query = input.replace(/^@/, "");
  const found = await ctx.discordGuild.members.search({ query, limit: 6 }).catch(() => null);
  const matches = [...(found?.values() ?? [])];
  const exact = matches.filter((member) =>
    [member.displayName, member.user.username, member.user.globalName]
      .filter(Boolean)
      .some((name) => String(name).toLowerCase() === query.toLowerCase()),
  );
  const pool = exact.length > 0 ? exact : matches;

  if (pool.length === 1) return { ok: true, id: pool[0].id, member: pool[0] };
  if (pool.length === 0) return { ok: false, error: `no member named "${input}" on this server` };
  return {
    ok: false,
    error: `"${input}" matches several members: ${pool
      .map((member) => `${member.displayName} (@${member.user.username}, ${member.id})`)
      .join(", ")}. Ask which one, or use the id.`,
  };
}

/** Seconds from "30m", "2h", "7d" or a plain number of minutes. */
function seconds(raw: unknown): number | null {
  if (raw === null || raw === undefined || raw === "") return null;
  return parseDuration(String(raw));
}

const BLOCKED: Record<string, string> = {
  self: "the administrator cannot do this to themselves",
  bot: "this cannot be done to the bot itself",
  owner: "this cannot be done to the server owner",
  hierarchy: "the administrator's highest role is not above that member's",
};

function hasPermission(ctx: ToolContext, permission: bigint): boolean {
  return ctx.discordGuild.members.me?.permissions.has(permission) ?? false;
}

function targetChannel(
  ctx: ToolContext,
  raw: unknown,
): { ok: true; channel: TextChannel } | { ok: false; error: string } {
  const found = resolveChannel(ctx.discordGuild, raw ?? ctx.channelId, "text");
  if (!found.ok) return found;
  const channel = ctx.discordGuild.channels.cache.get(found.item.id);
  if (!channel || !("bulkDelete" in channel))
    return { ok: false, error: "that channel cannot be moderated this way" };
  return { ok: true, channel: channel as TextChannel };
}

async function describe(ctx: ToolContext, op: ModerationOp): Promise<string> {
  const service = new ModerationService(ctx.client, ctx.discordGuild);
  const head =
    op.action === "slowmode"
      ? t(ctx.client, ctx.lang, "ai.actions.slowmode")
      : await service.typeName(op.action, ctx.lang);
  const parts: string[] = [`${ICON[op.action]} **${head}**`];

  if (op.action === "unwarn") parts.push(`#${op.caseNumber}`);
  if (op.channelId) parts.push(`<#${op.channelId}>`);
  if (op.userId) parts.push(`<@${op.userId}>`);
  if (op.action === "purge") parts.push(`× ${op.amount}`);
  if (op.action === "slowmode" && !op.duration)
    parts.push(t(ctx.client, ctx.lang, "ai.actions.off"));
  if (op.duration) parts.push(`· ${await service.formatDuration(op.duration, ctx.lang)}`);
  if (op.deleteDays) parts.push(`· 🗑️ ${op.deleteDays}d`);
  if (op.reason) parts.push(`— ${op.reason.replace(/\s+/g, " ").slice(0, 200)}`);
  return parts.join(" ");
}

export type PreparedModeration =
  | { ok: true; op: ModerationOp; line: string }
  | { ok: false; errors: string[] };

/** Check a moderation action before it is queued: the target, the hierarchy, what the bot may do. */
export async function prepareModeration(
  ctx: ToolContext,
  args: Record<string, unknown>,
): Promise<PreparedModeration> {
  const action = String(args.action ?? "") as ModerationAction;
  if (!MODERATION_ACTIONS.includes(action)) {
    return { ok: false, errors: [`action must be one of ${MODERATION_ACTIONS.join(", ")}`] };
  }

  const fail = (error: string): PreparedModeration => ({ ok: false, errors: [error] });
  const reason =
    typeof args.reason === "string" && args.reason.trim() ? args.reason.trim().slice(0, 400) : null;
  const op: ModerationOp = { type: "moderate", action, reason };

  if (action === "slowmode") {
    const target = targetChannel(ctx, args.channel);
    if (!target.ok) return fail(target.error);
    if (target.channel.type !== ChannelType.GuildText)
      return fail("slowmode works in text channels only");
    const raw = String(args.duration ?? "").trim();
    const delay = raw === "0" || raw === "off" ? 0 : seconds(raw);
    if (delay === null || delay > MAX_SLOWMODE_SECONDS)
      return fail("duration: 0 to switch it off, at most 6h");
    if (!hasPermission(ctx, PermissionFlagsBits.ManageChannels))
      return fail("I need the Manage Channels permission");
    op.channelId = target.channel.id;
    op.duration = delay;
    op.reason = null;
    return { ok: true, op, line: await describe(ctx, op) };
  }

  if (action === "purge") {
    const target = targetChannel(ctx, args.channel);
    if (!target.ok) return fail(target.error);
    const amount = Number(parseLoose(args.amount));
    if (!Number.isInteger(amount) || amount < 1 || amount > 100)
      return fail("amount: 1 to 100 messages");
    if (!hasPermission(ctx, PermissionFlagsBits.ManageMessages))
      return fail("I need the Manage Messages permission");
    if (args.user) {
      const user = await resolveUser(ctx, args.user);
      if (!user.ok) return fail(user.error);
      op.userId = user.id;
    }
    op.channelId = target.channel.id;
    op.amount = amount;
    op.reason = null;
    return { ok: true, op, line: await describe(ctx, op) };
  }

  const service = new ModerationService(ctx.client, ctx.discordGuild);

  if (action === "unwarn") {
    const caseNumber = Number(parseLoose(args.case));
    if (!Number.isInteger(caseNumber) || caseNumber < 1)
      return fail("case: the number of the warn case is required");
    const entry = await service.getCase(caseNumber);
    if (!entry) return fail(`case #${caseNumber} does not exist`);
    if (!entry.active || entry.type !== "warn")
      return fail(`case #${caseNumber} is not an active warn`);
    op.caseNumber = caseNumber;
    op.userId = entry.targetId;
    return { ok: true, op, line: await describe(ctx, op) };
  }

  const user = await resolveUser(ctx, args.user);
  if (!user.ok) return fail(user.error);
  op.userId = user.id;
  const { member } = user;

  if (["warn", "mute", "kick", "ban"].includes(action) && member) {
    const blocked = canActOn(ctx.member, member);
    if (blocked) return fail(BLOCKED[blocked]);
  }
  if (["mute", "kick", "unmute"].includes(action) && !member)
    return fail("that user is not on this server");
  if (["mute", "kick", "ban"].includes(action) && member && !botCanActOn(member)) {
    return fail("my highest role is not above that member's, so I cannot do this");
  }

  if (action === "mute") {
    const duration = seconds(args.duration);
    if (!duration)
      return fail('duration is required for a mute, like "30m", "2h" or "7d" (at most 28d)');
    if (!hasPermission(ctx, PermissionFlagsBits.ModerateMembers))
      return fail("I need the Moderate Members permission");
    if ((member!.communicationDisabledUntilTimestamp ?? 0) > Date.now())
      return fail("that member is already muted");
    op.duration = Math.min(duration, MAX_TIMEOUT_SECONDS);
  }

  if (action === "kick" && !hasPermission(ctx, PermissionFlagsBits.KickMembers)) {
    return fail("I need the Kick Members permission");
  }

  if (action === "ban" || action === "unban") {
    if (!hasPermission(ctx, PermissionFlagsBits.BanMembers))
      return fail("I need the Ban Members permission");
    const banned = await ctx.discordGuild.bans.fetch(user.id).catch(() => null);
    if (action === "ban" && banned) return fail("that user is already banned");
    if (action === "unban" && !banned) return fail("that user is not banned");
  }

  if (action === "ban") {
    if (args.duration) {
      const duration = seconds(args.duration);
      if (!duration) return fail('duration: like "7d", or leave it out for a permanent ban');
      op.duration = duration;
    }
    const days = Number(parseLoose(args.delete_days ?? 0));
    if (!Number.isInteger(days) || days < 0 || days > 7) return fail("delete_days: 0 to 7");
    op.deleteDays = days;
  }

  if (action === "unmute" && (member!.communicationDisabledUntilTimestamp ?? 0) <= Date.now()) {
    return fail("that member is not muted");
  }

  if (action === "note" && !reason) return fail("reason: the text of the note is required");

  return { ok: true, op, line: await describe(ctx, op) };
}

/** Carry out a confirmed moderation action. Everything is checked again, time has passed. */
export async function applyModeration(ctx: ToolContext, op: ModerationOp): Promise<StepResult> {
  const line = await describe(ctx, op);
  const failed = (error: string): StepResult => ({ ok: false, line: `❌ ${line}: ${error}` });
  const service = new ModerationService(ctx.client, ctx.discordGuild);
  const reason = op.reason || t(ctx.client, ctx.lang, "moderation.case.no_reason");
  const moderatorId = ctx.member.id;

  try {
    if (op.action === "slowmode") {
      const channel = ctx.discordGuild.channels.cache.get(op.channelId ?? "") as
        | TextChannel
        | undefined;
      if (!channel || channel.type !== ChannelType.GuildText) return failed("the channel is gone");
      await channel.setRateLimitPerUser(op.duration ?? 0, `Slowmode by ${ctx.member.user.tag}`);
      return { ok: true, line: `✅ ${line}` };
    }

    if (op.action === "purge") {
      const channel = ctx.discordGuild.channels.cache.get(op.channelId ?? "") as
        | TextChannel
        | undefined;
      if (!channel || !("bulkDelete" in channel)) return failed("the channel is gone");
      const fetched = await channel.messages.fetch({ limit: op.amount ?? 1 });
      const now = Date.now();
      const target = fetched.filter(
        (message: Message) =>
          now - message.createdTimestamp < PURGE_MAX_AGE_MS &&
          !message.pinned &&
          (!op.userId || message.author.id === op.userId),
      );
      const deleted = target.size > 0 ? await channel.bulkDelete(target, true) : null;
      if (!deleted || deleted.size === 0)
        return failed(t(ctx.client, ctx.lang, "commands.mod.purge.empty"));
      await service.punish({
        type: "purge",
        targetId: op.userId ?? moderatorId,
        moderatorId,
        reason: `#${channel.name} • ${deleted.size}`,
      });
      return { ok: true, line: `✅ ${line} → ${deleted.size}` };
    }

    if (op.action === "unwarn") {
      const result = await service.revoke({ caseNumber: op.caseNumber ?? 0, moderatorId, reason });
      return result.ok ? { ok: true, line: `✅ ${line}` } : failed(result.error);
    }

    const targetId = op.userId ?? "";
    const member = await service.fetchMember(targetId);

    if (["warn", "mute", "kick", "ban"].includes(op.action) && member) {
      const blocked = canActOn(ctx.member, member);
      if (blocked) return failed(t(ctx.client, ctx.lang, `moderation.errors.${blocked}`));
    }

    if (op.action === "unmute" || op.action === "unban") {
      const type = op.action === "unmute" ? "mute" : "ban";
      const stored = await prisma.moderationCase.findFirst({
        where: { guildId: ctx.discordGuild.id, targetId, type, active: true },
        orderBy: { caseNumber: "desc" },
      });

      if (stored) {
        const result = await service.revoke({ caseNumber: stored.caseNumber, moderatorId, reason });
        return result.ok ? { ok: true, line: `✅ ${line}` } : failed(result.error);
      }

      // Punished by hand in Discord: there is no case to close, only the punishment to lift.
      if (op.action === "unmute") await member?.timeout(null, reason);
      else await ctx.discordGuild.bans.remove(targetId, reason);
      const result = await service.punish({ type: op.action, targetId, moderatorId, reason });
      return result.ok ? { ok: true, line: `✅ ${line}` } : failed(result.error);
    }

    const result = await service.punish({
      type: op.action,
      targetId,
      moderatorId,
      reason,
      duration: op.duration ?? null,
      deleteMessageSeconds: (op.deleteDays ?? 0) * 24 * 60 * 60,
    });
    if (!result.ok) return failed(result.error);

    const escalated = result.escalated
      ? ` → ${await service.typeName(result.escalated.type as any, ctx.lang)} (#${result.escalated.caseNumber})`
      : "";
    return { ok: true, line: `✅ ${line} · #${result.case.caseNumber}${escalated}` };
  } catch (error: any) {
    console.error("[AI] Moderation action failed:".red, error);
    return failed(String(error?.message ?? error).slice(0, 200));
  }
}
