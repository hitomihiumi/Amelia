import {
  APIEmbed,
  Client,
  Guild as DiscordGuild,
  GuildAuditLogsEntry,
  AuditLogEvent,
  PartialUser,
  PermissionsBitField,
  User,
  WebhookClient,
} from "discord.js";
import { prisma } from "../../database";
import { Guild } from "../Guild";
import {
  AUDIT_EVENT_COLOR,
  AuditEventKey,
  AuditSettings,
  resolveAuditEvent,
} from "../../types/helpers";
import { t } from "../../i18n/helpers";

/** Webhook clients live as long as the process; one per channel. */
const webhookCache = new Map<string, WebhookClient>();

/** Serializes sends per channel so bursts of events do not hit the rate limit. */
const channelQueue = new Map<string, Promise<unknown>>();

/**
 * Reasons for deletions the bot itself performed, so `messageDelete` can say
 * "Auto moderation: Links" instead of leaving the field empty.
 */
const deletionReasons = new Map<string, { reason: string; expires: number }>();
const DELETION_REASON_TTL = 15_000;

export interface AuditLine {
  label: string;
  value: string;
}

export interface AuditPayload {
  /** Bold headline of the entry, already localized. */
  header: string;
  /** Short `label: value` lines rendered under the headline. */
  lines?: AuditLine[];
  /** Bigger blocks (message content, diffs) rendered as embed fields. */
  fields?: { name: string; value: string; inline?: boolean }[];
  thumbnail?: string | null;
  /** Footer text, usually the id of the subject. */
  footer?: string;
  /** Channel the event happened in — checked against the ignore list. */
  sourceChannelId?: string | null;
  /** Subject of the event — checked against the ignored roles and bots. */
  subject?: { bot?: boolean; roleIds?: string[] } | null;
}

/**
 * Audit log writer.
 *
 * Entries are delivered through channel webhooks: they are cheap, keep the log
 * visually separate from the bot's own messages and survive restarts because the
 * credentials are stored in `GuildWebhook`.
 */
export class AuditLogger {
  public client: Client;
  public discordGuild: DiscordGuild;
  public guild: Guild;

  constructor(client: Client, discordGuild: DiscordGuild) {
    this.client = client;
    this.discordGuild = discordGuild;
    this.guild = new Guild(client, discordGuild);
  }

  /** Remember why the bot deleted a message (auto moderation, purge). */
  public static markDeletion(messageId: string, reason: string): void {
    deletionReasons.set(messageId, { reason, expires: Date.now() + DELETION_REASON_TTL });

    // Opportunistic cleanup keeps the map from growing on busy servers.
    for (const [id, entry] of deletionReasons) {
      if (entry.expires < Date.now()) deletionReasons.delete(id);
    }
  }

  /** Consume the stored reason for a deletion, if there is one. */
  public static takeDeletionReason(messageId: string): string | null {
    const entry = deletionReasons.get(messageId);
    if (!entry) return null;

    deletionReasons.delete(messageId);
    return entry.expires >= Date.now() ? entry.reason : null;
  }

  public async settings(): Promise<AuditSettings> {
    return (await this.guild.get("audit")) as AuditSettings;
  }

  public async language(): Promise<string> {
    return await this.guild.get("settings.language");
  }

  /** Translate an audit key in the guild language. */
  public async t(key: string, ...args: any[]): Promise<string> {
    return t(this.client, await this.language(), key as any, ...args);
  }

  /**
   * Post an entry. Silently does nothing when the log, the event or the target
   * is filtered out — callers do not have to check anything themselves.
   */
  public async log(event: AuditEventKey, payload: AuditPayload): Promise<void> {
    try {
      const settings = await this.settings();
      if (!settings?.enabled) return;

      const config = resolveAuditEvent(settings.events, event);
      if (!config.enabled) return;

      if (payload.sourceChannelId && settings.ignore_channels?.includes(payload.sourceChannelId)) {
        return;
      }
      if (settings.ignore_bots && payload.subject?.bot) return;
      if (
        payload.subject?.roleIds?.length &&
        settings.ignore_roles?.some((role) => payload.subject!.roleIds!.includes(role))
      ) {
        return;
      }

      const channelId = config.channel || settings.channel;
      if (!channelId) return;

      await this.enqueue(channelId, settings, this.buildEmbed(event, payload));
    } catch (error) {
      console.error(`[Audit] Failed to log ${event}:`, error);
    }
  }

  private buildEmbed(event: AuditEventKey, payload: AuditPayload): APIEmbed {
    const lines = [`**${payload.header}**`];

    for (const line of payload.lines ?? []) {
      lines.push(`**${line.label}:** ${line.value}`);
    }

    const embed: APIEmbed = {
      color: AUDIT_EVENT_COLOR[event],
      description: lines.join("\n").slice(0, 4000),
      timestamp: new Date().toISOString(),
    };

    if (payload.fields?.length) {
      embed.fields = payload.fields.map((field) => ({
        name: field.name.slice(0, 256),
        value: field.value.slice(0, 1024),
        inline: field.inline,
      }));
    }

    if (payload.thumbnail) embed.thumbnail = { url: payload.thumbnail };
    if (payload.footer) embed.footer = { text: payload.footer.slice(0, 2048) };

    return embed;
  }

  /** Keep one in-flight request per channel. */
  private async enqueue(
    channelId: string,
    settings: AuditSettings,
    embed: APIEmbed,
  ): Promise<void> {
    const previous = channelQueue.get(channelId) ?? Promise.resolve();

    const next = previous
      .catch(() => undefined)
      .then(() => this.deliver(channelId, settings, embed));

    channelQueue.set(channelId, next);
    await next;
  }

  private async deliver(
    channelId: string,
    settings: AuditSettings,
    embed: APIEmbed,
  ): Promise<void> {
    const webhook = await this.resolveWebhook(channelId, settings);
    if (!webhook) return;

    const payload = {
      embeds: [embed],
      username: settings.webhook?.name || this.client.user?.username,
      avatarURL: settings.webhook?.avatar || this.client.user?.displayAvatarURL(),
      allowedMentions: { parse: [] as never[] },
    };

    try {
      await webhook.send(payload);
    } catch (error: any) {
      // The webhook was deleted in Discord — drop it and try once with a new one.
      if (error?.code === 10015 || error?.status === 401 || error?.status === 404) {
        await this.forgetWebhook(channelId);

        const recreated = await this.resolveWebhook(channelId, settings);
        if (recreated) await recreated.send(payload).catch(() => null);
        return;
      }

      throw error;
    }
  }

  private cacheKey(channelId: string): string {
    return `${this.discordGuild.id}:${channelId}`;
  }

  /** Existing webhook for the channel, or a freshly created one. */
  private async resolveWebhook(
    channelId: string,
    settings: AuditSettings,
  ): Promise<WebhookClient | null> {
    const cached = webhookCache.get(this.cacheKey(channelId));
    if (cached) return cached;

    const stored = await prisma.guildWebhook.findUnique({
      where: { guildId_channelId: { guildId: this.discordGuild.id, channelId } },
    });

    if (stored) {
      const client = new WebhookClient({ id: stored.webhookId, token: stored.token });
      webhookCache.set(this.cacheKey(channelId), client);
      return client;
    }

    return await this.createWebhook(channelId, settings);
  }

  private async createWebhook(
    channelId: string,
    settings: AuditSettings,
  ): Promise<WebhookClient | null> {
    const channel = await this.discordGuild.channels.fetch(channelId).catch(() => null);
    if (!channel || !channel.isTextBased() || channel.isThread()) return null;

    const me = this.discordGuild.members.me;
    if (!me?.permissionsIn(channel).has(PermissionsBitField.Flags.ManageWebhooks)) {
      console.error(`[Audit] Missing Manage Webhooks in #${channel.name}`);
      return null;
    }

    try {
      const webhook = await channel.createWebhook({
        name: settings.webhook?.name || this.client.user?.username || "Audit log",
        avatar: settings.webhook?.avatar || this.client.user?.displayAvatarURL(),
        reason: "Audit log",
      });

      if (!webhook.token) return null;

      await prisma.guildWebhook.upsert({
        where: { guildId_channelId: { guildId: this.discordGuild.id, channelId } },
        update: { webhookId: webhook.id, token: webhook.token },
        create: {
          guildId: this.discordGuild.id,
          channelId,
          webhookId: webhook.id,
          token: webhook.token,
        },
      });

      const client = new WebhookClient({ id: webhook.id, token: webhook.token });
      webhookCache.set(this.cacheKey(channelId), client);
      return client;
    } catch (error) {
      console.error("[Audit] Failed to create a webhook:", error);
      return null;
    }
  }

  private async forgetWebhook(channelId: string): Promise<void> {
    webhookCache.delete(this.cacheKey(channelId));

    await prisma.guildWebhook
      .deleteMany({ where: { guildId: this.discordGuild.id, channelId } })
      .catch(() => null);
  }

  /**
   * Who performed an action and why, taken from the Discord audit log.
   * Returns `null` when the bot cannot read it or nothing recent matches.
   */
  public async fetchExecutor(
    type: AuditLogEvent,
    targetId: string,
  ): Promise<{ executor: User | PartialUser | null; reason: string | null } | null> {
    const me = this.discordGuild.members.me;
    if (!me?.permissions.has(PermissionsBitField.Flags.ViewAuditLog)) return null;

    try {
      const logs = await this.discordGuild.fetchAuditLogs({ type, limit: 5 });

      const entry = logs.entries.find(
        (candidate: GuildAuditLogsEntry) =>
          (candidate.target as { id?: string } | null)?.id === targetId &&
          Date.now() - candidate.createdTimestamp < 10_000,
      );

      if (!entry) return null;

      return { executor: entry.executor ?? null, reason: entry.reason ?? null };
    } catch {
      return null;
    }
  }
}
