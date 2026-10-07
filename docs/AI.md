# AI chat

Amelia can chat with the members of a server. The answers come from Google's **Gemma 4** models
(`31B` and `26B`) through the Gemini API, using a free key from Google AI Studio. Everything is
off until the bot has a key, the server has **premium** and a server administrator turns the AI on.

## Setup

1. Create a key in [Google AI Studio](https://aistudio.google.com/apikey).
2. Put it into `.env` and restart the bot:

   ```env
   GEMINI_API_KEY=your-key
   ```

3. Check the limits of the key in the admin panel (**AI & premium**, see below).
4. Give a server premium from the same page.
5. On that server an administrator runs `/setting ai` (or uses **AI chat** in the dashboard) and
   turns the chat on.

## Premium

The AI chat is a premium feature. For now premium is not sold: the administrators of the bot
(the Discord ids in the dashboard's `ADMIN_USER_IDS`, the same people who get the admin panel) give it
out personally.

- **Give or take it away** in the dashboard's admin panel → **AI & premium** → *Premium servers*.
  Enter the server id, an optional end date and a note (who it is for and why; only administrators
  see it). A server without an end date keeps premium until it is revoked.
- It takes effect at once: the bot reads premium from the database on every request.
- Without premium `/setting ai` shows a notice instead of the settings, `/ai ask` and `/ai usage`
  answer that the feature is premium, and mentions or chat channels get no answer at all. The
  server's own settings are kept, so turning premium back on restores them.
- Premium is stored on the server (`Guild.premium`, `premiumUntil`, `premiumNote`), so the same
  switch can unlock other features later.

### Environment

| Variable | Default | |
| --- | --- | --- |
| `GEMINI_API_KEY` | – | Key of Google AI Studio. Without it the AI is off everywhere. |
| `AI_MODEL_31B` | `gemma-4-31b-it` | Model id of the larger model. |
| `AI_MODEL_26B` | `gemma-4-26b-a4b-it` | Model id of the smaller (mixture of experts) model. |
| `AI_MODEL_RPM` | `10` | Requests per minute per model, used until the admin panel has saved its own. |
| `AI_MODEL_RPD` | `14400` | Requests per day per model, used until the admin panel has saved its own. |
| `AI_MODEL_TPM` | `15000` | Tokens per minute per model, used until the admin panel has saved its own. |
| `AI_MAX_OUTPUT_TOKENS` | `700` | Longest answer, in tokens. |
| `AI_REQUEST_TIMEOUT_MS` | `45000` | How long to wait for the API. |
| `GEMINI_API_BASE` | Google's `v1beta` endpoint | Only for tests or a proxy. |

The quota is the **bot's own ceiling**, kept at or below what the key allows. Both Gemma 4 models
of the free key allow 14,400 requests a day and 10 requests a minute, which are the defaults; the
token numbers are not known for sure, so check them in the AI Studio rate-limit dashboard. Day-to-day the quota
lives in the admin panel (below), the environment variables are only the starting values.

## How the bot decides to answer

- A message that **mentions** the bot (`@Amelia how are you?`).
- A **reply** to one of the bot's AI answers.
- **Any message in a chat channel**, except the ones that are clearly between other people (they
  mention someone else or reply to another member).
- `/ai ask` works everywhere the AI is not ignored.

A mention that starts with a prefix command (`@Amelia somecommand`) still runs the command; text
that is not a command goes to the AI. Channels in the *ignored* list never get an answer. The AI
only **chats**: it has no tools and cannot moderate, change settings or ping anyone (answers are
sent with mentions switched off and `@everyone`/`@here` are defused).

## Personality

The bot's own character and the rules that always apply live in
`src/helpers/ai/persona.ts`. That is the place to change who Amelia is for every server.

Each server can add **extra instructions** (up to 1500 characters) in `/setting ai` → *Personality*
or in the dashboard. They adjust tone and topics and are placed before the hard rules, so a server
cannot switch the safety rules off. Members' messages reach the model as `Name: text` and are
declared to be chat, not instructions.

The bot answers in the language of the member and falls back to the server language.

## Models

Each server picks one of:

| Choice | Behaviour |
| --- | --- |
| `auto` (default) | Gemma 4 31B first. When its quota is spent, cooling down or it fails, Gemma 4 26B answers instead. |
| `31b` | Only the 31B model. |
| `26b` | Only the 26B model. |

Using both models in `auto` also doubles the daily quota the free key gives.

## Rate limits

Counters live in Redis, so they hold across shards and restarts. They are fixed windows: the
minute counter restarts every minute, daily ones at 00:00 UTC.

| Limit | Set by | Default |
| --- | --- | --- |
| Messages per member per minute | server, up to the ceiling | 3 |
| Messages per member per day | server, up to the ceiling | 40 |
| Messages per server per day | server, up to the ceiling | 400 |
| One request at a time per member | built in | – |
| Requests per minute, per day and tokens per minute **per model** | admin panel, shared by all servers | 10 / 14400 / 15000 |

**Ceilings** are the highest values a server may give itself, also set in the admin panel
(default 20 per minute and 500 per day for a member, 5000 per day for a server). They are applied
when the bot counts a request, so lowering one takes effect at once even for servers that saved a
higher number earlier; `/setting ai` and the dashboard only accept values up to them.

### Admin panel

Dashboard → admin panel → **AI & premium** (visible to the bot administrators only):

- **Model quota**: requests per minute, requests per day and tokens per minute for each of the two
  models. The bot picks changes up within about 30 seconds, no restart needed. Until something is
  saved there the `AI_MODEL_*` variables apply, and a stored number that is out of range is ignored
  in favour of them.
- **Ceilings for servers**: the three limits above.
- **Premium servers**: give, change or revoke premium (see *Premium*).

- A request is checked against all member and server counters in one atomic step: a request
  refused by one limit does not use up the others.
- The model counters are shared by every server, so one busy community cannot burn the whole
  key. The per-minute limit of a model is a **sliding** 60 second window, so it never lets more than
  that many requests through in any 60 seconds, not even around the turn of a minute. The daily
  model counter follows Google's reset at midnight Pacific time.
- A request to a model that failed with a timeout or a server error keeps its slot, since Google
  may have counted it.
- When the API answers `429`, the model is put on a cooldown for the delay the API asked for, on
  every shard, and the other model takes over in `auto`.
- A request that never reached a model (quota spent, API down) is given back to the member.
- A member who hits a limit gets one notice with the time it resets, then a ⏳ reaction until the
  window passes, instead of a wall of warnings.
- `/ai usage` shows how much of the limits the member and the server have used.

## Memory

The bot remembers the last six exchanges **per channel** for 30 minutes, so replies can refer to
what was said a moment ago. It lives in Redis only and expires on its own; `/ai reset` (needs
*Manage Messages*) clears it early. When a message replies to another message, that message is
included as context.

## Privacy

Messages addressed to the bot are sent to Google's Gemini API. The free tier of the Gemini API
may use submitted content to improve Google's products, so make sure the community is fine with
that before turning the AI on, and don't enable it where private conversations happen. The
dashboard and `/setting ai` say this as well.

## Commands

| Command | Who | |
| --- | --- | --- |
| `/setting ai` | Administrators | Turn the chat on or off, model, chat and ignored channels, personality, limits. |
| `/ai ask <message>` | Everyone | Talk to the bot with a command. |
| `/ai usage` | Everyone | Own usage of the limits. |
| `/ai reset` | Manage Messages | Make the bot forget the conversation in the channel. |

## Where the code is

| | |
| --- | --- |
| `src/helpers/ai/handler.ts` | Decides if a message is meant for the AI and sends the answer. |
| `src/helpers/ai/chat.ts` | One exchange: limits, model fallback, memory. |
| `src/helpers/ai/limiter.ts` | Redis rate limiting. |
| `src/helpers/ai/globalConfig.ts` | Quota and ceilings from the admin panel, premium lookup. |
| `src/helpers/ai/gemini.ts` | Gemini API client. |
| `src/helpers/ai/persona.ts` | Personality and rules. |
| `src/helpers/ai/memory.ts` | Conversation memory. |
| `src/types/helpers/AiSchema.ts` | Settings type, mirrored in the dashboard (`src/lib/db/types/Ai.ts`). |
