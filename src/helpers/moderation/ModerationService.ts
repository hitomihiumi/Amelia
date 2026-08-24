import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  Client,
  EmbedBuilder,
  Guild as DiscordGuild,
  GuildMember,
  MessageActionRowComponentBuilder,
  SendableChannels,
  User,
} from "discord.js";
import { ModerationCase, ModerationSubmission } from "@prisma/client";
import { prisma, HistoryType } from "../../database";
import { Guild } from "../Guild";
import {
  ModerationCaseSource,
  ModerationCaseType,
  ModerationSubmissionAnswer,
  ModerationSubmissionKind,
  ModerationSubmissionStatus,
  PunishmentType,
  WarnThreshold,
} from "../../types/helpers";
import { formatTime } from "../../handlers/functions";
import { t, tObject } from "../../i18n/helpers";
import { botCanActOn } from "./checks";
import { MAX_TIMEOUT_SECONDS } from "./duration";

export interface PunishInput {
  type: ModerationCaseType;
  /** Target user id — the member does not have to be on the server (bans). */
  targetId: string;
  moderatorId: string;
  reason: string;
  /** Duration in seconds. Only used by `mute` and `ban`. */
  duration?: number | null;
  evidence?: string[];
  source?: ModerationCaseSource;
  /** Messages to delete on ban, in seconds (Discord accepts up to 7 days). */
  deleteMessageSeconds?: number;
  /** Skip the escalation check (used by the escalation itself to avoid loops). */
  skipEscalation?: boolean;
}

export type PunishResult =
  | { ok: true; case: ModerationCase; escalated?: ModerationCase | null }
  | { ok: false; error: string };

export interface RevokeInput {
  caseNumber: number;
  moderatorId: string;
  reason: string;
}

const REVOKE_TYPE: Partial<Record<ModerationCaseType, ModerationCaseType>> = {
  warn: "unwarn",
  mute: "unmute",
  ban: "unban",
};

/**
 * Central moderation engine.
 *
 * Every moderation action — slash commands, auto moderation and dashboard
 * submissions alike — goes through this class so that cases, the moderation
 * log, direct messages and warn escalation stay consistent.
 */
export class ModerationService {
  public client: Client;
  public discordGuild: DiscordGuild;
  public guild: Guild;

  constructor(client: Client, discordGuild: DiscordGuild) {
    this.client = client;
    this.discordGuild = discordGuild;
    this.guild = new Guild(client, discordGuild);
  }

  private async lang(): Promise<string> {
    return await this.guild.get("settings.language");
  }

  /**
   * Allocate the next per-guild case number.
   * The increment happens in a single atomic update, so parallel actions
   * never receive the same number.
   */
  private async nextCaseNumber(): Promise<number> {
    await prisma.guild.upsert({
      where: { id: this.discordGuild.id },
      update: {},
      create: { id: this.discordGuild.id },
    });

    const row = await prisma.guild.update({
      where: { id: this.discordGuild.id },
      data: { modCaseSeq: { increment: 1 } },
      select: { modCaseSeq: true },
    });

    return row.modCaseSeq;
  }

  /** Translate a case type ("warn" → "Warn"). */
  public async typeName(type: ModerationCaseType, lang?: string): Promise<string> {
    const language = lang ?? (await this.lang());
    return t(this.client, language, `moderation.types.${type}` as any);
  }

  /** Human readable duration, e.g. "2 hours". */
  public async formatDuration(seconds: number, lang?: string): Promise<string> {
    const language = lang ?? (await this.lang());
    return formatTime(seconds * 1000, language, tObject(this.client, language, "time_units"), {
      full: true,
    });
  }

  /**
   * Apply a punishment: perform the Discord action, store the case,
   * notify the target and write the moderation log.
   */
  public async punish(input: PunishInput): Promise<PunishResult> {
    const lang = await this.lang();
    const source = input.source ?? "command";
    const member = await this.fetchMember(input.targetId);

    if (["mute", "kick"].includes(input.type) && !member) {
      return { ok: false, error: t(this.client, lang, "moderation.errors.member_not_found") };
    }

    if (member && ["mute", "kick", "ban"].includes(input.type) && !botCanActOn(member)) {
      return { ok: false, error: t(this.client, lang, "moderation.errors.hierarchy") };
    }

    let duration = input.duration ?? null;
    if (input.type === "mute") {
      if (!duration) duration = 3600;
      duration = Math.min(duration, MAX_TIMEOUT_SECONDS);
    }
    if (input.type !== "mute" && input.type !== "ban") duration = null;

    const caseNumber = await this.nextCaseNumber();
    const expiresAt = duration ? new Date(Date.now() + duration * 1000) : null;

    const created = await prisma.moderationCase.create({
      data: {
        guildId: this.discordGuild.id,
        caseNumber,
        type: input.type,
        targetId: input.targetId,
        moderatorId: input.moderatorId,
        reason: input.reason,
        evidence: input.evidence ?? [],
        duration,
        expiresAt,
        source,
        // Notes and revocations are informational, they are never "active".
        active: !["note", "unwarn", "unmute", "unban", "purge"].includes(input.type),
      },
    });

    // The DM has to go out before a kick/ban, otherwise there is no mutual guild left.
    await this.notifyTarget(created, lang);

    const performed = await this.performDiscordAction(input, member, duration);
    if (!performed.ok) {
      await prisma.moderationCase.delete({ where: { id: created.id } });
      return {
        ok: false,
        error: t(this.client, lang, "moderation.errors.action_failed", performed.error),
      };
    }

    await this.writeHistory(created);
    await this.log(created, lang);

    let escalated: ModerationCase | null = null;
    if (input.type === "warn" && !input.skipEscalation) {
      escalated = await this.escalate(input.targetId, lang);
    }

    return { ok: true, case: created, escalated };
  }

  /** Execute the actual Discord side effect of a punishment. */
  private async performDiscordAction(
    input: PunishInput,
    member: GuildMember | null,
    duration: number | null,
  ): Promise<{ ok: true } | { ok: false; error: string }> {
    try {
      switch (input.type) {
        case "mute":
          await member!.timeout((duration ?? 3600) * 1000, input.reason);
          break;
        case "kick":
          await member!.kick(input.reason);
          break;
        case "ban":
          await this.discordGuild.bans.create(input.targetId, {
            reason: input.reason,
            deleteMessageSeconds: input.deleteMessageSeconds ?? 0,
          });
          break;
        default:
          break;
      }
      return { ok: true };
    } catch (error: any) {
      return { ok: false, error: error?.message ?? "unknown error" };
    }
  }

  /**
   * Revoke an active case: lift the punishment in Discord and store the
   * counterpart case (unwarn / unmute / unban).
   */
  public async revoke(input: RevokeInput): Promise<PunishResult> {
    const lang = await this.lang();

    const target = await prisma.moderationCase.findUnique({
      where: {
        guildId_caseNumber: { guildId: this.discordGuild.id, caseNumber: input.caseNumber },
      },
    });

    if (!target) {
      return {
        ok: false,
        error: t(this.client, lang, "moderation.errors.case_not_found", input.caseNumber),
      };
    }
    if (!target.active) {
      return {
        ok: false,
        error: t(this.client, lang, "moderation.errors.case_inactive", input.caseNumber),
      };
    }

    const revokeType = REVOKE_TYPE[target.type as ModerationCaseType];
    if (!revokeType) {
      return {
        ok: false,
        error: t(this.client, lang, "moderation.errors.case_inactive", input.caseNumber),
      };
    }

    const lifted = await this.liftPunishment(
      target.type as ModerationCaseType,
      target.targetId,
      input.reason,
    );
    if (!lifted.ok) {
      return {
        ok: false,
        error: t(this.client, lang, "moderation.errors.action_failed", lifted.error),
      };
    }

    await prisma.moderationCase.update({
      where: { id: target.id },
      data: {
        active: false,
        revokedAt: new Date(),
        revokedBy: input.moderatorId,
        revokeReason: input.reason,
      },
    });

    const caseNumber = await this.nextCaseNumber();
    const created = await prisma.moderationCase.create({
      data: {
        guildId: this.discordGuild.id,
        caseNumber,
        type: revokeType,
        targetId: target.targetId,
        moderatorId: input.moderatorId,
        reason: input.reason,
        source: "command",
        active: false,
      },
    });

    await this.notifyRevocation(created, lang);
    await this.writeHistory(created);
    await this.log(created, lang);

    return { ok: true, case: created };
  }

  /** Lift a punishment in Discord. Missing targets are not an error. */
  private async liftPunishment(
    type: ModerationCaseType,
    targetId: string,
    reason: string,
  ): Promise<{ ok: true } | { ok: false; error: string }> {
    try {
      if (type === "mute") {
        const member = await this.fetchMember(targetId);
        if (member?.communicationDisabledUntilTimestamp) {
          await member.timeout(null, reason);
        }
      } else if (type === "ban") {
        const ban = await this.discordGuild.bans.fetch(targetId).catch(() => null);
        if (ban) await this.discordGuild.bans.remove(targetId, reason);
      }
      return { ok: true };
    } catch (error: any) {
      return { ok: false, error: error?.message ?? "unknown error" };
    }
  }

  /**
   * Apply the configured escalation once a member reaches a warn threshold.
   * Returns the escalation case, if one was created.
   */
  public async escalate(targetId: string, lang: string): Promise<ModerationCase | null> {
    const thresholds = ((await this.guild.get("moderation.warn_thresholds")) ||
      []) as WarnThreshold[];
    if (!Array.isArray(thresholds) || thresholds.length === 0) return null;

    const activeWarns = await this.countActiveWarns(targetId);

    // Highest matching threshold wins, so a single warn cannot trigger two punishments.
    const matched = thresholds
      .filter((rule) => rule && typeof rule.count === "number" && rule.count === activeWarns)
      .sort((a, b) => b.count - a.count)[0];

    if (!matched?.punishment) return null;

    const punishment = matched.punishment;
    const type = punishment.type as unknown as ModerationCaseType;
    if (!["mute", "kick", "ban"].includes(type)) return null;

    const result = await this.punish({
      type,
      targetId,
      moderatorId: this.client.user?.id ?? "AUTOMOD",
      reason:
        punishment.reason ||
        t(this.client, lang, "moderation.escalation.reason", String(activeWarns)),
      duration: punishment.time || null,
      source: "automod",
      skipEscalation: true,
    });

    return result.ok ? result.case : null;
  }

  /** Number of warns that still count towards escalation. */
  public async countActiveWarns(targetId: string): Promise<number> {
    const expiryDays = (await this.guild.get("moderation.warn_expiry")) as number;

    const createdAt =
      expiryDays && expiryDays > 0
        ? { gte: new Date(Date.now() - expiryDays * 24 * 60 * 60 * 1000) }
        : undefined;

    return await prisma.moderationCase.count({
      where: {
        guildId: this.discordGuild.id,
        targetId,
        type: "warn",
        active: true,
        ...(createdAt ? { createdAt } : {}),
      },
    });
  }

  /** Mirror the case into the generic history table. */
  private async writeHistory(entry: ModerationCase): Promise<void> {
    try {
      await this.guild.history.add({
        type: HistoryType.MODERATION,
        action: entry.type,
        data: {
          caseNumber: entry.caseNumber,
          targetId: entry.targetId,
          moderatorId: entry.moderatorId,
          reason: entry.reason,
          duration: entry.duration,
          source: entry.source,
        },
      });
    } catch (error) {
      console.error("[Moderation] Failed to write history:", error);
    }
  }

  /** Build the embed used both in the moderation log and in `/mod case`. */
  public async buildCaseEmbed(entry: ModerationCase, lang?: string): Promise<EmbedBuilder> {
    const language = lang ?? (await this.lang());
    const typeName = await this.typeName(entry.type as ModerationCaseType, language);

    const moderator =
      entry.moderatorId === "AUTOMOD"
        ? t(this.client, language, "moderation.sources.automod")
        : `<@${entry.moderatorId}>`;

    const embed = new EmbedBuilder()
      .setColor(
        entry.active ? (this.client.holder.colors.error as any) : this.client.holder.colors.default,
      )
      .setTitle(
        t(this.client, language, "moderation.case.title", String(entry.caseNumber), typeName),
      )
      .addFields(
        {
          name: t(this.client, language, "moderation.case.user"),
          value: `<@${entry.targetId}> (\`${entry.targetId}\`)`,
          inline: true,
        },
        {
          name: t(this.client, language, "moderation.case.moderator"),
          value: moderator,
          inline: true,
        },
        {
          name: t(this.client, language, "moderation.case.reason"),
          value: entry.reason || t(this.client, language, "moderation.case.no_reason"),
        },
      )
      .setTimestamp(entry.createdAt);

    if (entry.duration) {
      embed.addFields({
        name: t(this.client, language, "moderation.case.duration"),
        value: await this.formatDuration(entry.duration, language),
        inline: true,
      });
    }

    if (entry.expiresAt) {
      embed.addFields({
        name: t(this.client, language, "moderation.case.expires"),
        value: `<t:${Math.floor(entry.expiresAt.getTime() / 1000)}:R>`,
        inline: true,
      });
    }

    embed.addFields({
      name: t(this.client, language, "moderation.case.source"),
      value: t(this.client, language, `moderation.sources.${entry.source}` as any),
      inline: true,
    });

    const evidence = Array.isArray(entry.evidence) ? (entry.evidence as string[]) : [];
    if (evidence.length) {
      embed.addFields({
        name: t(this.client, language, "moderation.case.evidence"),
        value: evidence.slice(0, 5).join("\n").slice(0, 1024),
      });
    }

    if (entry.revokedAt) {
      embed.addFields({
        name: t(this.client, language, "moderation.case.status"),
        value: `${t(this.client, language, "moderation.case.revoked")} • <@${entry.revokedBy}>`,
      });
    }

    return embed;
  }

  /** Post a case to the configured moderation log channel. */
  public async log(entry: ModerationCase, lang?: string): Promise<void> {
    const channelId = (await this.guild.get("moderation.log_channel")) as string | null;
    if (!channelId) return;

    const channel = await this.fetchTextChannel(channelId);
    if (!channel) return;

    try {
      await channel.send({ embeds: [await this.buildCaseEmbed(entry, lang)] });
    } catch (error) {
      console.error("[Moderation] Failed to write the moderation log:", error);
    }
  }

  /** Tell the punished user what happened, when DM notifications are enabled. */
  private async notifyTarget(entry: ModerationCase, lang: string): Promise<void> {
    if (!(await this.guild.get("moderation.dm_notify"))) return;
    if (["note", "purge"].includes(entry.type)) return;

    const typeName = await this.typeName(entry.type as ModerationCaseType, lang);

    const embed = new EmbedBuilder()
      .setColor(this.client.holder.colors.error as any)
      .setDescription(
        t(this.client, lang, "moderation.dm.applied", typeName, this.discordGuild.name),
      )
      .addFields(
        {
          name: t(this.client, lang, "moderation.dm.reason"),
          value: entry.reason || t(this.client, lang, "moderation.case.no_reason"),
        },
        {
          name: t(this.client, lang, "moderation.dm.case"),
          value: `#${entry.caseNumber}`,
          inline: true,
        },
      );

    if (entry.duration) {
      embed.addFields({
        name: t(this.client, lang, "moderation.dm.duration"),
        value: await this.formatDuration(entry.duration, lang),
        inline: true,
      });
    }

    const appealUrl = this.appealUrl();
    if (appealUrl) {

      embed.setFooter({
        text: t(this.client, lang, "moderation.dm.appeal_footer"),
      })

      return await this.sendDM(entry.targetId, embed, new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(
          new ButtonBuilder()
              .setLabel(t(this.client, lang, "moderation.dm.appeal_button"))
              .setStyle(ButtonStyle.Link)
              .setURL(appealUrl)
      ));
    }

    await this.sendDM(entry.targetId, embed);
  }

  private async notifyRevocation(entry: ModerationCase, lang: string): Promise<void> {
    if (!(await this.guild.get("moderation.dm_notify"))) return;

    const embed = new EmbedBuilder()
      .setColor(this.client.holder.colors.success as any)
      .setDescription(t(this.client, lang, "moderation.dm.revoked", this.discordGuild.name))
      .addFields({
        name: t(this.client, lang, "moderation.dm.reason"),
        value: entry.reason || t(this.client, lang, "moderation.case.no_reason"),
      });

    await this.sendDM(entry.targetId, embed);
  }

  /** Public URL of the appeal form, when the dashboard address is configured. */
  public appealUrl(): string | null {
    const base = process.env.DASHBOARD_URL;
    if (!base) return null;
    return `${base.replace(/\/+$/, "")}/submit/${this.discordGuild.id}/appeal`;
  }

  /** Public URL of the report form, when the dashboard address is configured. */
  public reportUrl(): string | null {
    const base = process.env.DASHBOARD_URL;
    if (!base) return null;
    return `${base.replace(/\/+$/, "")}/submit/${this.discordGuild.id}/report`;
  }

  private async sendDM(userId: string, embed: EmbedBuilder, action?: ActionRowBuilder<MessageActionRowComponentBuilder>): Promise<void> {
    try {
      const user: User = await this.client.users.fetch(userId);
      await user.send({ embeds: [embed], components: action ? [action] : [] });
    } catch {
      // Closed DMs are expected and must never break a moderation action.
    }
  }

  public async fetchMember(userId: string): Promise<GuildMember | null> {
    return await this.discordGuild.members.fetch(userId).catch(() => null);
  }

  private async fetchTextChannel(channelId: string): Promise<SendableChannels | null> {
    const channel = await this.discordGuild.channels.fetch(channelId).catch(() => null);
    if (!channel || !channel.isTextBased() || !channel.isSendable()) return null;
    return channel;
  }

  public async getCase(caseNumber: number): Promise<ModerationCase | null> {
    return await prisma.moderationCase.findUnique({
      where: { guildId_caseNumber: { guildId: this.discordGuild.id, caseNumber } },
    });
  }

  public async listCases(
    targetId: string | null,
    page: number,
    perPage = 10,
  ): Promise<{ entries: ModerationCase[]; total: number }> {
    const where = {
      guildId: this.discordGuild.id,
      ...(targetId ? { targetId } : {}),
    };

    const [entries, total] = await Promise.all([
      prisma.moderationCase.findMany({
        where,
        orderBy: { caseNumber: "desc" },
        skip: page * perPage,
        take: perPage,
      }),
      prisma.moderationCase.count({ where }),
    ]);

    return { entries, total };
  }

  // ---------------------------------------------------------------------------
  // Submissions (reports & appeals)
  // ---------------------------------------------------------------------------

  /** Embed shown in the moderation channel for a report/appeal. */
  public async buildSubmissionEmbed(
    submission: ModerationSubmission,
    lang?: string,
  ): Promise<EmbedBuilder> {
    const language = lang ?? (await this.lang());
    const kind = submission.kind as ModerationSubmissionKind;
    const status = submission.status as ModerationSubmissionStatus;

    const colors: Record<ModerationSubmissionStatus, any> = {
      pending: this.client.holder.colors.info,
      in_review: this.client.holder.colors.default,
      approved: this.client.holder.colors.success,
      rejected: this.client.holder.colors.error,
    };

    const embed = new EmbedBuilder()
      .setColor(colors[status] ?? this.client.holder.colors.info)
      .setTitle(
        t(
          this.client,
          language,
          "moderation.submission.title",
          t(this.client, language, `moderation.submission.kinds.${kind}` as any),
          String(submission.number),
        ),
      )
      .setTimestamp(submission.createdAt);

    embed.addFields({
      name: t(this.client, language, "moderation.submission.author"),
      value: submission.authorId
        ? `<@${submission.authorId}> (\`${submission.authorId}\`)`
        : t(this.client, language, "moderation.submission.anonymous"),
      inline: true,
    });

    if (submission.targetId) {
      embed.addFields({
        name: t(this.client, language, "moderation.submission.target"),
        value: `<@${submission.targetId}> (\`${submission.targetId}\`)`,
        inline: true,
      });
    }

    if (submission.caseId) {
      const related = await prisma.moderationCase.findUnique({ where: { id: submission.caseId } });
      if (related) {
        embed.addFields({
          name: t(this.client, language, "moderation.submission.case"),
          value: `#${related.caseNumber} • ${await this.typeName(
            related.type as ModerationCaseType,
            language,
          )}`,
          inline: true,
        });
      }
    }

    const answers = Array.isArray(submission.answers)
      ? (submission.answers as unknown as ModerationSubmissionAnswer[])
      : [];

    for (const answer of answers.slice(0, 15)) {
      const value =
        answer.value === null || answer.value === "" ? "—" : String(answer.value).slice(0, 1024);
      embed.addFields({ name: String(answer.label).slice(0, 256), value });
    }

    embed.addFields({
      name: t(this.client, language, "moderation.submission.status"),
      value: t(this.client, language, `moderation.submission.statuses.${status}` as any),
      inline: true,
    });

    if (submission.handledBy) {
      embed.addFields({
        name: t(this.client, language, "moderation.submission.handled_by"),
        value: `<@${submission.handledBy}>`,
        inline: true,
      });
    }

    if (submission.response) {
      embed.addFields({
        name: t(this.client, language, "moderation.submission.response"),
        value: submission.response.slice(0, 1024),
      });
    }

    return embed;
  }

  /** Action row for a submission; empty once the submission is resolved. */
  public buildSubmissionComponents(
    submission: ModerationSubmission,
    lang: string,
  ): ActionRowBuilder<MessageActionRowComponentBuilder>[] {
    if (submission.status === "approved" || submission.status === "rejected") return [];

    const row = new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId(`I_mod:sub|${submission.id}|claim`)
        .setLabel(t(this.client, lang, "moderation.submission.buttons.claim"))
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(submission.status === "in_review"),
      new ButtonBuilder()
        .setCustomId(`I_mod:sub|${submission.id}|approve`)
        .setLabel(t(this.client, lang, "moderation.submission.buttons.approve"))
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId(`I_mod:sub|${submission.id}|reject`)
        .setLabel(t(this.client, lang, "moderation.submission.buttons.reject"))
        .setStyle(ButtonStyle.Danger),
    );

    return [row];
  }

  /** Re-render the submission message in the moderation channel. */
  public async refreshSubmissionMessage(
    submission: ModerationSubmission,
    lang?: string,
  ): Promise<void> {
    if (!submission.channelId || !submission.messageId) return;

    const language = lang ?? (await this.lang());
    const channel = await this.fetchTextChannel(submission.channelId);
    if (!channel) return;

    try {
      const message = await channel.messages.fetch(submission.messageId);
      await message.edit({
        embeds: [await this.buildSubmissionEmbed(submission, language)],
        components: this.buildSubmissionComponents(submission, language),
      });
    } catch (error) {
      console.error("[Moderation] Failed to refresh a submission message:", error);
    }
  }

  /**
   * Resolve a submission (approve/reject/claim), update the channel message
   * and inform the author. Shared by the Discord buttons and the dashboard.
   */
  public async resolveSubmission(
    submissionId: string,
    status: ModerationSubmissionStatus,
    moderatorId: string,
    response: string | null,
  ): Promise<{ ok: true; submission: ModerationSubmission } | { ok: false; error: string }> {
    const lang = await this.lang();

    const submission = await prisma.moderationSubmission.findUnique({
      where: { id: submissionId },
    });

    if (!submission || submission.guildId !== this.discordGuild.id) {
      return { ok: false, error: t(this.client, lang, "moderation.submission.not_found") };
    }

    if (submission.status === "approved" || submission.status === "rejected") {
      return { ok: false, error: t(this.client, lang, "moderation.submission.already_handled") };
    }

    const updated = await prisma.moderationSubmission.update({
      where: { id: submission.id },
      data: {
        status,
        handledBy: moderatorId,
        handledAt: status === "in_review" ? submission.handledAt : new Date(),
        response: response ?? submission.response,
      },
    });

    // Approving an appeal lifts the punishment it was filed against.
    if (status === "approved" && updated.kind === "appeal" && updated.caseId) {
      const related = await prisma.moderationCase.findUnique({ where: { id: updated.caseId } });

      if (related?.active) {
        await this.revoke({
          caseNumber: related.caseNumber,
          moderatorId,
          reason: t(
            this.client,
            lang,
            "moderation.submission.title",
            t(this.client, lang, "moderation.submission.kinds.appeal"),
            String(updated.number),
          ),
        });
      }
    }

    await this.refreshSubmissionMessage(updated, lang);

    if (status === "approved" || status === "rejected") {
      await this.notifySubmissionAuthor(updated, status, lang);
    }

    return { ok: true, submission: updated };
  }

  private async notifySubmissionAuthor(
    submission: ModerationSubmission,
    status: "approved" | "rejected",
    lang: string,
  ): Promise<void> {
    const kindName = t(
      this.client,
      lang,
      `moderation.submission.kinds.${submission.kind}` as any,
    ).toLowerCase();

    const embed = new EmbedBuilder()
      .setColor(
        status === "approved"
          ? (this.client.holder.colors.success as any)
          : (this.client.holder.colors.error as any),
      )
      .setDescription(
        t(
          this.client,
          lang,
          `moderation.submission.dm.${status}` as any,
          kindName,
          this.discordGuild.name,
        ),
      );

    if (submission.response) {
      embed.addFields({
        name: t(this.client, lang, "moderation.submission.dm.response"),
        value: submission.response.slice(0, 1024),
      });
    }

    await this.sendDM(submission.authorId, embed);
  }
}

/** Convenience mapping used by auto moderation settings. */
export function punishmentTypeToCaseType(type: PunishmentType): ModerationCaseType {
  return type as unknown as ModerationCaseType;
}
