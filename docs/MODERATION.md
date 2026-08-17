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

`src/handlers/automod.ts` runs at the top of `messageCreate`, before the level logic, so a deleted
message never grants experience. Both rules (`moderation.auto_moderation.invite` and
`.links`) support ignored channels, ignored roles, a moderator exemption, message deletion and a
punishment. The link filter additionally honours the `ignore_links` domain whitelist.

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

## Configuration

Guild settings live under the `moderation.*` paths (see `scripts/generate-schema.ts`):

- `moderation.moderation_roles`, `moderation.log_channel`, `moderation.dm_notify`
- `moderation.warn_expiry`, `moderation.warn_thresholds`
- `moderation.forms.report`, `moderation.forms.appeal`
- `moderation.auto_moderation.invite`, `moderation.auto_moderation.links`

Set `DASHBOARD_URL` in the environment so the bot can put the appeal link into the direct messages
it sends to punished members, and so `/mod link` can print the form links.

After changing a path, run `npm run generate:schema`, add the column to `prisma/schema.prisma`,
create a migration and copy the schema, the generated mapping and the types to the dashboard
repository — both projects share the same database.
