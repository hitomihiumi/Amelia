# Audit log

The audit log records what happens on a server and posts it to a channel through a webhook.
Everything is configured from the dashboard (**Moderation → Audit log**); the bot only reads the
configuration and writes the entries.

## Why webhooks

Entries are delivered with a channel webhook instead of a normal message:

- the log looks separate from the bot's own messages and can carry its own name and avatar;
- webhooks have their own rate limit budget, so a burst of joins does not delay commands.

Credentials are stored in the `GuildWebhook` table, keyed by `(guildId, channelId)`. The dashboard
creates a webhook when the settings are saved, and `AuditLogger` creates any that are still missing
when an event fires. If Discord answers `10015 Unknown Webhook` (someone deleted it by hand), the
row is dropped and the webhook is recreated on the spot.

## Events

| Category | Events |
| --- | --- |
| Members | `member_join`, `member_leave`, `member_roles`, `member_nickname`, `member_ban`, `member_unban`, `member_kick`, `member_timeout` |
| Messages | `message_delete`, `message_edit`, `message_bulk_delete` |
| Voice | `voice_join`, `voice_leave`, `voice_move` |
| Server | `channel_create`, `channel_delete`, `channel_update`, `role_create`, `role_delete`, `role_update`, `guild_update` |

Each key has a switch and an optional channel override in `audit.events`; an event without an entry
there is on as soon as the log itself is enabled (`resolveAuditEvent` in
`src/types/helpers/AuditSchema.ts`).

Kicks are not a gateway event: `guildMemberRemove` asks the Discord audit log whether the departure
was a kick and logs `member_kick` instead of `member_leave` when it was.

## Writing an entry

```ts
const audit = new AuditLogger(client, guild);

await audit.log("member_join", {
  header: await audit.t("audit.events.member_join", `<@${member.id}>`, member.user.username),
  lines: [{ label: await audit.t("audit.fields.registered"), value: absoluteDate(created) }],
  thumbnail: member.user.displayAvatarURL({ size: 256 }),
  footer: await audit.t("audit.footer.member", member.id),
  subject: { bot: member.user.bot, roleIds: [...member.roles.cache.keys()] },
});
```

`log()` checks the master switch, the per-event switch and the ignore lists (`ignore_channels`,
`ignore_roles`, `ignore_bots`) before sending, so callers never have to. Sends are serialized per
channel.

Deletions performed by the bot itself carry a reason: auto moderation calls
`AuditLogger.markDeletion(messageId, reason)` right before deleting, and `messageDelete` picks it
up within 15 seconds and renders it as “Reason: Auto moderation: Links”.

## Message content

Discord sends only the new version of an edited message, and no content at all for a deleted one —
the old text comes from the discord.js cache. The client is therefore configured with a larger
message cache and a sweeper:

```ts
makeCache: Options.cacheWithLimits({ ...Options.DefaultMakeCacheSettings, MessageManager: 500 }),
sweepers: { ...Options.DefaultSweeperSettings, messages: { interval: 3600, lifetime: 43200 } },
```

Messages that are older than that, or that predate the last restart, are logged with
“content unavailable”. Persisting them would mean writing every message to MongoDB; the collection
and one insert in `messageCreate` are all it would take if that becomes necessary.

## Permissions

- **Manage Webhooks** in every channel the log posts to.
- **View Audit Log** on the server, to name the moderator behind bans, kicks and role changes.
  Without it those entries are still written, just without the moderator and the reason.

## Configuration paths

`audit.enabled`, `audit.channel`, `audit.ignore_channels`, `audit.ignore_roles`,
`audit.ignore_bots`, `audit.webhook.name`, `audit.webhook.avatar`, `audit.events`.
