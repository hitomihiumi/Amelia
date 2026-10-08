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
| `AI_MAX_FILES` | `3` | Code files read per message. |
| `AI_MAX_FILE_BYTES` | `204800` | Largest single code file, in bytes. |
| `AI_MAX_CODE_CHARS` | `30000` | Characters of code sent per message, all files together. |
| `AI_MAX_OUTPUT_TOKENS_CODE` | `1800` | Longest answer when files are attached, in tokens. |
| `AI_MAX_IMAGES` | `3` | Pictures looked at per message. |
| `AI_MAX_IMAGE_BYTES` | `4194304` | Largest single picture, in bytes. |
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

The bot has two kinds of memory. A server can switch each of them (and pictures and code files below)
on or off in `/setting ai` or in the dashboard; all are on by default.

### Short-term memory

The last six exchanges **per channel** for 30 minutes, so replies can refer to what was said a
moment ago. It lives in Redis only, expires on its own and is never written to the database.
`/ai reset` (needs *Manage Messages*) clears it early. When a message replies to another message,
that message is included as context. With it switched off every message is answered on its own.

### Long-term memory

Lasting things members say **about themselves** (a name, what they play, their pets, what they
study) are kept in the database, per server and member, and brought back in later conversations,
days later. The model proposes them: at the end of an answer it may add `[[remember: …]]` or
`[[forget: …]]`, and the bot takes those markers out before the message is shown, so no extra
request is made and the per-minute quota is not touched.

- **The member knows.** When something is stored the bot reacts to the message with 🧠.
- **The member controls it.** `/ai memory` lists their notes and deletes one or all. "Forget that I
  like cats" works in chat too. Notes of a member are deleted when they leave the server, and all
  notes of a server with its *Forget all notes* button (`/setting ai` and the dashboard).
- **What is refused**, whatever the model decided: contact details, links, number sequences like
  phone or card numbers, key-like strings, mentions, words like *password* or *token*, and anything
  that reads as an instruction to the bot ("from now on always …"). The model is also told to keep
  nothing about other people, health, money, politics or anything sexual.
- **Limits:** 160 characters per note, 30 notes per member (the note used least, and longest ago,
  makes room), 3 notes taken from one answer. A note that says the same as an old one replaces it.
- **How it is used:** the notes of the person writing and up to three other people from the recent
  conversation (10 and 3 notes each) go into the prompt, labelled as unverified things members said
  about themselves, never as instructions.

Storage is the `AiMemory` table (`guildId`, `userId`, `content`, `uses`, timestamps), deleted with
the server.

## Pictures

The bot can look at images: PNG, JPEG and WebP attachments of the message, and of the message it
replies to (so "what is this?" under someone's picture works). `/ai ask` has an `image` option too.

- Up to **3 pictures** per message and 4 MB each (`AI_MAX_IMAGES`, `AI_MAX_IMAGE_BYTES`). Pictures
  count toward the model's token budget but are one request like any other.
- They are downloaded only from Discord's own CDN (`*.discordapp.com`, `*.discordapp.net`), over
  HTTPS, without following redirects, and the format is checked by the file's first bytes, not by
  what it claims to be.
- A picture without a word is answered when it is addressed to the bot (mention, reply, `/ai ask`).
  In a chat channel it is ignored, as it is most likely meant for the people there.
- Pictures are sent with the newest message only and are not stored. Short-term memory keeps a note
  that a picture was shared, not the picture.
- The bot is told not to name real people from their faces and not to read personal data out of a
  picture.
- If a model refuses pictures the bot asks again without them and says so in the answer, and
  remembers that for the model. If looking at pictures is switched off the bot says that instead.

## Code files

The bot can read code and text files attached to a message, to explain or review them: "what does this
do?", "find the bug", "is this safe?". It reads the files of the message and of the message it replies
to, and `/ai ask` has a `file` option. A file without a word is answered when it is addressed to the bot
(mention, reply, `/ai ask`), not in a chat channel.

- **Which files.** By name: the usual source and config extensions (JavaScript, TypeScript, Python,
  Java, Kotlin, C, C++, C#, Go, Rust, Ruby, PHP, Swift, shell, SQL, HTML, CSS, JSON, YAML, TOML, XML,
  Markdown, plain text, diffs and many more) and files like `Dockerfile` and `Makefile`. Archives and
  binaries are not read, and neither are files that exist to hold secrets: `.env` (but not
  `.env.example`), `*.pem`, `*.key`, `id_rsa` and similar.
- **Limits.** Up to **3 files** of 200 KB each (`AI_MAX_FILES`, `AI_MAX_FILE_BYTES`), and **30,000
  characters** of code per message in total (`AI_MAX_CODE_CHARS`, about 8,000 tokens); the rest is cut at
  a line and the answer says it only saw the start. Lines over 400 characters are cut. Files must be UTF-8
  text: a file with NUL bytes or another encoding is skipped.
- **Where they come from.** Only Discord's own CDN over HTTPS, without redirects, like pictures.
- **Secrets are blanked out before anything leaves the bot.** Private key blocks, Discord, GitHub, AWS,
  Google, Slack and `sk-` style keys, JWTs, `password = "…"` style assignments and the password in a
  `postgres://user:password@host` URL become `[redacted]`. This is a precaution, not a guarantee: a secret
  in an unusual shape still goes through, so keep real credentials out of what you post.
- **Files are data, not instructions.** They go into the prompt in a marked block with line numbers, and
  the model is told that text in a file never changes its rules. An answer points at `file:line` and shows
  fixes as small code blocks. The bot does not run the code and says so.
- **Not kept.** The contents are sent with that one message only. Short-term memory keeps a note that a
  file was shared, and the model is told never to remember anything from a file.
- **Answers are longer.** A review gets up to 1,800 tokens (`AI_MAX_OUTPUT_TOKENS_CODE`) and up to four
  Discord messages instead of two.
- It can be switched off per server (*Code files* in `/setting ai` and the dashboard). The files go to
  Google's Gemini API with the message, like everything else the bot is asked about, so do not enable it
  for private code.

## Commands

| Command | Who | |
| --- | --- | --- |
| `/setting ai` | Administrators | Turn the chat on or off, model, chat and ignored channels, personality, limits, memory, picture and code file switches, forget all notes. |
| `/ai ask <message> [image] [file]` | Everyone | Talk to the bot with a command, optionally with a picture or a code file. |
| `/ai memory` | Everyone | See what the bot remembers about you, delete one note or all. |
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
| `src/helpers/ai/memory.ts` | Short-term memory of a channel. |
| `src/helpers/ai/longTerm.ts` | Long-term notes about members (database). |
| `src/helpers/ai/memoryText.ts` | Memory markers, what is refused, note similarity. |
| `src/helpers/ai/images.ts` | Picking and downloading pictures. |
| `src/helpers/ai/files.ts` | Code files: recognising, downloading, redacting secrets, numbering lines. |
| `src/helpers/ai/attachments.ts` | Sorts the attachments of a message into pictures and files. |
| `src/types/helpers/AiSchema.ts` | Settings type, mirrored in the dashboard (`src/lib/db/types/Ai.ts`). |
