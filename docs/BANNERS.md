# Server banners and level-up announcements

Both are edited in the dashboard (`hitomihiumi/amelia-dashboard`); the bot reads the same database.

## Level-up announcements

`utils.levels.message` (`levelsMessageEnabled`, `levelsMessageChannel`, `levelsMessageContent`,
`levelsMessageDelete`) describes the announcement. The bot builds it in
`src/helpers/levelAnnouncement.ts`:

- a text, an embed, the level-up card, or any mix of them;
- the card is attached to the message, or shown inside the embed when there is one;
- placeholders: the usual `{user.*}`, `{channel.*}`, `{guild.*}`, `{date}`, `{time}` plus
  `{level}`, `{level.prev}`, `{xp.total}`, `{messages}` and `{reward.role}`;
- `delete` is the number of seconds until the message is removed, `0` keeps it;
- without a text and an embed the bot sends the congratulation it always sent.

The announcement now respects the switch. The migration turns it on for every server that has
levels on, so nobody loses their announcements.

## Server banners

`utils.banners` (`banner*` columns of `Guild`) holds the banners of a server and the settings of the
updater. A banner is plain data (`src/types/helpers/Banner.ts`): a 960×540 canvas with a background
and a list of layers (text, shape, image, avatar, progress bar).

`src/handlers/serverBanner.ts` checks the servers once a minute. For every server that has the
feature on and an active banner whose interval has passed it

1. collects the statistics (`src/helpers/banner/stats.ts`),
2. draws the banner (`src/helpers/banner/render.tsx`),
3. sets it with `guild.setBanner`, unless the picture did not change,
4. writes the result to `bannerStatus` for the dashboard.

The dashboard asks for an update at once by writing the time to `bannerRefreshRequest`.

Requirements: the server needs the `BANNER` feature (boost level 2) and the bot needs the Manage
Server permission. When one is missing, the error is shown in the dashboard and the bot retries once
an hour.

### Statistics

| Placeholder | Source |
| --- | --- |
| `{members}` | `guild.memberCount` |
| `{members.online}` | Discord's approximate presence count (`with_counts`), no privileged intent |
| `{voice.members}` | members connected to a voice channel |
| `{boosts}`, `{boost.tier}` | server boosts |
| `{messages.today}`, `{messages.week}`, `{joins.today}`, `{leaves.today}` | `GuildStat` |
| `{channels}`, `{roles}` | the server |
| `{top.name}`, `{top.avatar}`, `{top.messages}` | the most active member |
| `{date}`, `{time}` | in the time zone of the banner |

The most active member is the one who wrote the most over the last 60 or 120 minutes
(`utils.banners.activity_window`). Messages are counted in ten minute buckets in Redis
(`src/helpers/banner/activity.ts`) and kept for three hours.

### Pictures

Links to pictures are downloaded by the bot itself (`src/helpers/banner/images.ts`): `https` only,
public addresses only, 8 MB at most.
