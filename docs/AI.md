# AI chat

Amelia can chat with the members of a server. The answers come from Google's **Gemma 4** models
(`31B` and `26B`) through the Gemini API, using a free key from Google AI Studio. Everything is
off until the bot has a key **and** a server turns the AI on.

## Setup

1. Create a key in [Google AI Studio](https://aistudio.google.com/apikey).
2. Put it into `.env` and restart the bot:

   ```env
   GEMINI_API_KEY=your-key
   ```

3. On the server an administrator runs `/setting ai` (or uses **AI chat** in the dashboard) and
   turns the chat on.

### Environment

| Variable | Default | |
| --- | --- | --- |
| `GEMINI_API_KEY` | – | Key of Google AI Studio. Without it the AI is off everywhere. |
| `AI_MODEL_31B` | `gemma-4-31b-it` | Model id of the larger model. |
| `AI_MODEL_26B` | `gemma-4-26b-a4b-it` | Model id of the smaller (mixture of experts) model. |
| `AI_MODEL_RPM` | `15` | Requests per minute the bot sends to **each** model. |
| `AI_MODEL_RPD` | `1000` | Requests per day the bot sends to **each** model. |
| `AI_MODEL_TPM` | `15000` | Tokens per minute the bot spends on **each** model. |
| `AI_MAX_OUTPUT_TOKENS` | `700` | Longest answer, in tokens. |
| `AI_REQUEST_TIMEOUT_MS` | `45000` | How long to wait for the API. |
| `GEMINI_API_BASE` | Google's `v1beta` endpoint | Only for tests or a proxy. |

The three quota variables are the **bot's own ceiling**. Look up the real limits of your key in
the AI Studio rate-limit dashboard and keep these numbers at or below them. Free-tier limits differ
between models and change over time, which is why they are not hard-coded.

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
| Messages per member per minute | server (1–20) | 3 |
| Messages per member per day | server (1–500) | 40 |
| Messages per server per day | server (1–5000) | 400 |
| One request at a time per member | built in | – |
| Requests per minute, per day and tokens per minute **per model** | `.env`, shared by all servers | 15 / 1000 / 15000 |

- A request is checked against all member and server counters in one atomic step: a request
  refused by one limit does not use up the others.
- The model counters are shared by every server, so one busy community cannot burn the whole
  key. The daily model counter follows Google's reset at midnight Pacific time.
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
| `src/helpers/ai/gemini.ts` | Gemini API client. |
| `src/helpers/ai/persona.ts` | Personality and rules. |
| `src/helpers/ai/memory.ts` | Conversation memory. |
| `src/types/helpers/AiSchema.ts` | Settings type, mirrored in the dashboard (`src/lib/db/types/Ai.ts`). |
