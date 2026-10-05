# Moderation

The moderation system covers punishments, the case log, auto moderation and the report / appeal
forms that members fill in on the dashboard.

## Cases

Every action is stored as a numbered case in the `ModerationCase` table. Numbers are per guild and
allocated atomically through the `Guild.modCaseSeq` counter, so parallel actions never collide.

| Type | Created by | Active |
| --- | --- | --- |
| `warn` | `/mod warn`, auto moderation | until revoked or expired |
| `mute` | `/mod mute`, auto moderation, escalation | until the Discord time out ends or it is revoked |
| `kick` | `/mod kick`, auto moderation, escalation | no |
| `ban` | `/mod ban`, auto moderation, escalation | until revoked or, for temporary bans, until `expiresAt` |
| `note` | `/mod note` | no |
| `unwarn` / `unmute` / `unban` | revocations | no |
| `purge` | `/mod purge` | no |

Cases are mirrored into the generic `History` table (`HistoryType.MODERATION`) and posted to the
channel configured in `moderation.log_channel`.

Everything goes through `ModerationService` (`src/helpers/moderation/ModerationService.ts`):
commands, auto moderation, the submission buttons and the scheduler all call the same methods, so
the case log, the direct messages and the escalation stay consistent.

## Commands

All subcommands live under `/mod` and require either a role from `moderation.moderation_roles` or
the `Moderate Members` permission.

| Command | Description |
| --- | --- |
| `/mod warn <user> [reason]` | Warn a member and run the escalation check |
| `/mod unwarn <case> [reason]` | Revoke any active case by its number |
| `/mod mute <user> <duration> [reason]` | Discord time out, capped at 28 days |
| `/mod unmute <user> [reason]` | Remove the time out |
| `/mod kick <user> [reason]` | Kick a member |
| `/mod ban <user> [duration] [reason] [delete_days]` | Permanent or temporary ban |
| `/mod unban <user> [reason]` | Lift a ban |
| `/mod note <user> <text>` | Private note, no punishment |
| `/mod case <number>` | Show one case |
| `/mod cases [user] [page]` | Browse the case log |
| `/mod purge <amount> [user] [contains]` | Bulk delete recent messages |
| `/mod slowmode <duration> [channel]` | Set the slowmode of a channel |
| `/mod link` | Print the links to the report and appeal forms |

Durations accept `30m`, `2h30m`, `7d`; a bare number is read as minutes.

## Warn escalation

`moderation.warn_thresholds` holds rules of the shape `{ count, punishment: { type, time, reason } }`.
When a warn brings a member to exactly `count` active warns, the punishment is applied
automatically. `moderation.warn_expiry` (days, `0` = never) controls how long a warn keeps counting.

## Auto moderation

Auto moderation runs on **Discord's native AutoMod**. The settings in `moderation.auto_moderation`
(edited in the dashboard) are the source of truth; each enabled rule becomes an AutoMod rule of the
server. Discord itself blocks the message, posts the alert and applies the timeout, before the
message is even visible, and it keeps doing so while the bot is offline. The bot adds what AutoMod
cannot do: it answers Discord's execution event with a numbered case, the moderation log entry and
the direct message, and applies `warn`, `kick` and `ban`.

| Kind | Discord trigger | What it catches |
| --- | --- | --- |
| `invite` | keyword, regex (`INVITE_REGEX`) | invites to other servers |
| `links` | keyword `*http://*`, `*https://*` + allow list | links, minus the whitelist |
| `keywords` | keyword (words, wildcards, regex) | a custom word list |
| `profanity` | keyword preset | Discord's lists: profanity, sexual content, slurs |
| `mention_spam` | mention spam | too many mentions in one message, raid detection |
| `spam` | spam | Discord's spam content detection |

Every rule has ignored channels (up to 50), ignored roles (up to 20, shared with the moderator roles
when "moderators are exempt" is on), a message for the author of a blocked message, an alert
channel and a punishment. Members with Administrator or Manage Server are never touched by AutoMod.

### How the pieces fit

- `src/helpers/moderation/autoModeration.ts` turns the settings into rule bodies
  (`buildAutoModRule`), validates them against Discord's limits and keeps the server in sync
  (`syncAutoModeration`) through a small transport. The dashboard has a mirrored copy
  (`src/lib/moderation/autoModeration.ts`); keep both in sync.
- The dashboard syncs on every save and shows what Discord refused. The bot never overwrites a rule
  on its own: at startup and when it joins a server (`reconcileAutoModeration`) it only creates the
  rules of settings that have none yet (servers that used the old bot-side filters get theirs on the
  first start) and switches a setting off when its rule was deleted in Discord.
- `src/handlers/autoModeration.ts` handles `autoModerationActionExecution`. Discord sends one event
  per executed action, so exactly one is answered (the timeout if there is one, else the block, else
  the alert; see `autoModDriver`). A timeout configured as the `mute` punishment is applied by
  Discord itself for the `invite`, `links` and `keywords` rules; the bot only records the case
  (`skipDiscordAction`). For the other kinds, Discord offers no timeout action, so the bot applies it.
- A rule always needs at least one action. When neither "block message", an alert channel nor a native
  timeout is configured, the message is blocked anyway.
- Rule ids are stored in `moderation.auto_moderation.rules`. Rules made by hand in Discord are not
  ours and never produce cases.

The bot needs the **Manage Server** permission to manage the rules (and **Moderate Members** for
timeouts) and the `AutoModerationExecution` intent to hear about them.

Discord's limits worth knowing: 6 keyword-type rules per server (we use 3), 1 rule each of the spam,
word list and mention spam type (a server's own rule of the same type makes ours fail with an error
shown in the dashboard), 1000 words of 60 characters, 10 regex patterns of 260 characters
(Rust syntax, no look-around).

### Link whitelist patterns

`ignore_links` holds glob patterns, not plain prefixes (`src/helpers/moderation/linkPatterns.ts`).
Only `*` is a wildcard. Discord only knows `*` at the start and end of a word, so every pattern is
translated into allow-list words (`linkPatternToAllowWords`) that pin the host boundary:
`youtube.com` becomes `*://youtube.com`, `*://youtube.com/*`, `*.youtube.com` and `*.youtube.com/*`
(a looser `*youtube.com*` would let `notyoutube.com` and `youtube.com.evil.xyz` through). That costs
two to four of Discord's 100 allow-list entries per pattern. A wildcard in the middle of a pattern
cannot be expressed and is rejected when saving.

| Pattern | Matches |
| --- | --- |
| `youtube.com` | the domain, every subdomain, every path |
| `*.wikipedia.org` | subdomains only |
| `discord.com/channels/*` | that path and everything below it |
| `*docs*` | any link containing `docs` |

`isLinkIgnored` still exists for the dashboard's tester, but Discord's matcher has the final word,
so the tester is an approximation.

## Temporary punishments

Mutes use the native Discord time out and expire on their own. Temporary bans and expiring warns
are handled by `src/handlers/moderationScheduler.ts`, which checks once a minute and lifts bans
whose `expiresAt` has passed.

## Reports and appeals

Members fill in the forms on the dashboard (`/submit/<guild id>/report` and `.../appeal`). The
dashboard stores the submission and posts it to the configured channel with three buttons handled
by the bot:

- `I_mod:sub|<submissionId>|claim` — mark as in review
- `I_mod:sub|<submissionId>|approve`
- `I_mod:sub|<submissionId>|reject`

Approve and reject open a modal (`I_mod:sub_resolve|<submissionId>|<action>`) asking for the
response that is sent to the author. Approving an appeal revokes the appealed case, which lifts the
ban or time out in Discord.

Component ids carry their payload after a pipe; `interactionCreate` resolves handlers by the part
before the first pipe, so one registered component serves every submission.

## Audit log

Moderation actions land in the moderation log channel; everything else that happens on the server
is covered by the separate audit log — see [AUDIT.md](./AUDIT.md).

## Configuration

Guild settings live under the `moderation.*` paths (see `scripts/generate-schema.ts`):

- `moderation.moderation_roles`, `moderation.log_channel`, `moderation.dm_notify`
- `moderation.warn_expiry`, `moderation.warn_thresholds`
- `moderation.forms.report`, `moderation.forms.appeal`
- `moderation.auto_moderation.{invite,links,keywords,profanity,mention_spam,spam}` and
  `moderation.auto_moderation.rules` (the ids of the Discord rules)

Set `DASHBOARD_URL` in the environment so the bot can put the appeal link into the direct messages
it sends to punished members, and so `/mod link` can print the form links.

After changing a path, run `npm run generate:schema`, add the column to `prisma/schema.prisma`,
create a migration and copy the schema, the generated mapping and the types to the dashboard
repository — both projects share the same database.
