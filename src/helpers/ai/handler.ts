import { cleanContent, type Client, type Message, PermissionFlagsBits } from "discord.js";
import {
  DEFAULT_AI_LIMITS,
  type AiSettings,
  DEFAULT_AI_SETTINGS,
  normalizeAiOptions,
} from "../../types/helpers";
import { t } from "../../i18n/helpers";
import { Guild } from "../Guild";
import { chat, type AiChatResult } from "./chat";
import { isAiConfigured } from "./config";
import { sanitizeReply, splitReply } from "./format";
import { hasAiAccess } from "./globalConfig";
import { prepareAttachments, usableAttachments } from "./attachments";
import type { AttachmentInfo } from "./images";
import { shouldNotify } from "./limiter";
import { clip, isAiReply, markAiReply } from "./memory";

/** At most this many messages for one answer; the rest is cut. A review of code gets more room. */
const MAX_REPLY_MESSAGES = 2;
const MAX_REPLY_MESSAGES_CODE = 4;
const REPLY_CONTEXT_CHARS = 300;

/** Settings of a server with the defaults filled in, whatever the database holds. */
export async function loadAiSettings(guild: Guild): Promise<AiSettings> {
  const raw = ((await guild.get("ai")) ?? {}) as Partial<AiSettings>;
  return {
    ...DEFAULT_AI_SETTINGS,
    ...raw,
    channels: raw.channels ?? [],
    ignore_channels: raw.ignore_channels ?? [],
    limits: { ...DEFAULT_AI_LIMITS, ...(raw.limits ?? {}) },
    options: normalizeAiOptions(raw.options),
  };
}

/** A relative Discord timestamp, shown in the member's own language and clock. */
function inSeconds(seconds: number): string {
  return `<t:${Math.floor(Date.now() / 1000) + Math.max(1, Math.ceil(seconds))}:R>`;
}

/** The text to tell a member why they got no answer, or null when silence is better. */
export function describeFailure(
  client: Client,
  lang: string,
  result: Exclude<AiChatResult, { ok: true }>,
): string | null {
  switch (result.reason) {
    case "busy":
      return null;
    case "premium":
      return t(client, lang, "ai.premium_required");
    case "rate_limited":
      return t(
        client,
        lang,
        `ai.failure.rate_limited.${result.refusal.scope}`,
        inSeconds(result.refusal.retryAfter),
      );
    case "quota":
      return t(client, lang, "ai.failure.quota");
    case "unavailable":
      return t(client, lang, "ai.failure.unavailable");
    case "blocked":
      return t(client, lang, "ai.failure.blocked");
    default:
      return t(client, lang, "ai.failure.error");
  }
}

function inList(list: string[], message: Message): boolean {
  if (list.includes(message.channelId)) return true;
  const parentId = "parentId" in message.channel ? message.channel.parentId : null;
  return Boolean(parentId && list.includes(parentId));
}

/** What the message replies to, for the model to follow the thread of the talk. */
async function replyContext(message: Message) {
  if (!message.reference?.messageId) return null;
  try {
    const target = await message.fetchReference();
    const text = cleanContent(target.content, message.channel).trim();
    const attachments = attachmentsOf(target);
    if (!text && attachments.length === 0) return null;
    return {
      name: target.member?.displayName ?? target.author.displayName,
      text: text ? clip(text, REPLY_CONTEXT_CHARS) : "(an attachment)",
      attachments,
    };
  } catch {
    return null;
  }
}

/** The attachments of a message. */
function attachmentsOf(message: Message): AttachmentInfo[] {
  return [...message.attachments.values()].map((attachment) => ({
    url: attachment.url,
    contentType: attachment.contentType,
    size: attachment.size,
    name: attachment.name,
  }));
}

async function react(message: Message, emoji: string) {
  await message.react(emoji).catch(() => null);
}

/**
 * Answer a message with the AI, when it is meant for the bot: a mention, a reply
 * to one of the bot's AI answers, or any message in a chat channel of the server.
 *
 * Returns true when the message was taken as a request to the AI.
 */
export async function handleAiMessage(client: Client, message: Message, guild: Guild) {
  if (!isAiConfigured() || !client.user || !message.guild || !message.member) return false;
  if (!message.channel.isSendable()) return false;

  const settings = await loadAiSettings(guild);
  if (!settings.enabled || inList(settings.ignore_channels, message)) return false;

  const mentioned = message.mentions.has(client.user, {
    ignoreEveryone: true,
    ignoreRoles: true,
    ignoreRepliedUser: true,
  });
  const repliesToAi = Boolean(
    message.reference?.messageId && (await isAiReply(message.reference.messageId)),
  );
  const inChatChannel = inList(settings.channels, message);

  if (!mentioned && !repliesToAi) {
    if (!inChatChannel) return false;
    // In a chat channel people also talk to each other; stay out of those exchanges.
    const others = message.mentions.users.filter((user) => user.id !== client.user?.id);
    if (others.size > 0 || message.reference?.messageId) return false;
  }

  const text = cleanContent(
    message.content.replace(new RegExp(`<@!?${client.user.id}>`, "g"), ""),
    message.channel,
  ).trim();

  // A picture or file without a word is answered when it is addressed to the bot. In a chat
  // channel it is most likely a meme or a file meant for the people there, and every answer
  // costs quota.
  const ownAttachments = usableAttachments(attachmentsOf(message));
  if (!text) {
    const addressed = mentioned || repliesToAi;
    if (ownAttachments.length === 0 || !addressed) return false;
  }

  const me = message.guild.members.me;
  const channel = message.channel;
  const permissions = me && "permissionsFor" in channel ? channel.permissionsFor(me) : null;
  const canSend = channel.isThread()
    ? PermissionFlagsBits.SendMessagesInThreads
    : PermissionFlagsBits.SendMessages;
  if (!permissions?.has(canSend)) return false;

  // Premium ended since the server turned the AI on: stay silent instead of nagging in chat.
  if (!(await hasAiAccess(message.guild.id))) return false;

  const lang = (await guild.get("settings.language")) as string;

  // The model can take a while: keep the typing indicator alive until it answers.
  const sendTyping = () => channel.sendTyping().catch(() => null);
  void sendTyping();
  const typing = setInterval(sendTyping, 8000);

  let result: AiChatResult;
  let hadFiles = false;
  try {
    const replyTo = await replyContext(message);

    // Pictures and files of the message, and of the one it replies to ("review this" under a file).
    const prepared = await prepareAttachments(
      [...ownAttachments, ...usableAttachments(replyTo?.attachments ?? [])],
      settings.options,
    );
    hadFiles = prepared.files.length > 0;

    result = await chat({
      guildId: message.guild.id,
      guildName: message.guild.name,
      channelId: channel.id,
      channelName: "name" in channel ? channel.name : null,
      userId: message.author.id,
      userName: message.member.displayName,
      text,
      replyTo: replyTo ? { name: replyTo.name, text: replyTo.text } : null,
      ...prepared,
      lang,
      settings,
    });
  } finally {
    clearInterval(typing);
  }

  if (!result.ok) {
    if (result.reason === "premium") return false;

    const notice = describeFailure(client, lang, result);
    if (!notice) {
      await react(message, "⏳");
    } else if (await shouldNotify(`${message.guild.id}:${message.author.id}`)) {
      await message
        .reply({ content: notice, allowedMentions: { parse: [], repliedUser: false } })
        .catch(() => null);
    } else {
      await react(message, "⏳");
    }
    return true;
  }

  const chunks = splitReply(sanitizeReply(result.text)).slice(
    0,
    hadFiles ? MAX_REPLY_MESSAGES_CODE : MAX_REPLY_MESSAGES,
  );
  const options = { allowedMentions: { parse: [], repliedUser: false } } as const;

  const send = (content: string): Promise<Message | null> =>
    channel.send({ content, ...options }).catch(() => null);

  const sendFirst = async (content: string): Promise<Message | null> => {
    try {
      return await message.reply({ content, ...options, failIfNotExists: false });
    } catch {
      return send(content);
    }
  };

  for (const [index, chunk] of chunks.entries()) {
    const sent = index === 0 ? await sendFirst(chunk) : await send(chunk);
    if (sent) await markAiReply(sent.id);
  }

  // Tell the member when something about them was kept, so a note never appears unseen.
  if (result.remembered > 0) await react(message, "🧠");

  return true;
}
