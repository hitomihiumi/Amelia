import {
  AttachmentBuilder,
  Client,
  EmbedBuilder,
  GuildTextBasedChannel,
  Message,
  MessageCreateOptions,
} from "discord.js";
import { LevelCard } from "./canvas/LevelCard";
import { loadCardBackground } from "./canvas/cardBackground";
import { substituteVariables, VariableContext } from "./custom/substitute";
import { t } from "../i18n/helpers";
import { LevelMessageContent, Levels } from "../types/helpers";

/** Discord's limits for the parts of an announcement. */
const LIMITS = { text: 2000, title: 256, description: 4096, footer: 2048 } as const;

const HEX_COLOR = /^#?([0-9a-f]{6})$/i;

function str(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value : null;
}

/**
 * The stored announcement as a complete object. Servers saved before the editor existed have
 * `{}` or only some of the keys; they keep the card and the reply they always got.
 */
export function normalizeLevelMessage(raw: unknown): LevelMessageContent {
  const source = (raw && typeof raw === "object" ? raw : {}) as Partial<LevelMessageContent>;
  const embed = (source.embed && typeof source.embed === "object" ? source.embed : {}) as Partial<
    LevelMessageContent["embed"]
  >;

  return {
    text: str(source.text),
    embed: {
      title: str(embed.title),
      description: str(embed.description),
      color: str(embed.color),
      thumbnail: str(embed.thumbnail),
      image: str(embed.image),
      footer: str(embed.footer),
    },
    card: source.card !== false,
    reply: source.reply !== false,
  };
}

/** Only absolute http(s) links are accepted by Discord as embed pictures. */
function link(value: string | null): string | null {
  return value && /^https?:\/\/\S+$/i.test(value) ? value : null;
}

function embedColor(value: string | null): number | undefined {
  const match = value ? HEX_COLOR.exec(value.trim()) : null;
  return match ? Number.parseInt(match[1], 16) : undefined;
}

export interface LevelAnnouncement {
  /** The message that earned the XP. */
  message: Message;
  levels: Levels;
  lang: string;
  level: number;
  totalXp: number;
  messageCount: number;
  /** The per-user colours of the level-up card (`/appearance`). */
  cardOptions: ConstructorParameters<typeof LevelCard>[0]["displayOptions"];
}

/** Where the announcement goes: the configured channel, or the one the member wrote in. */
function targetChannel(message: Message, levels: Levels): GuildTextBasedChannel | null {
  const configured = levels.message.channel
    ? message.guild?.channels.cache.get(levels.message.channel)
    : null;
  if (configured?.isTextBased() && !configured.isDMBased()) return configured;
  return message.channel.isDMBased() ? null : (message.channel as GuildTextBasedChannel);
}

/**
 * Posts the level-up announcement that the server set up in the dashboard (or `/setting levels`):
 * a text, an embed, the level-up card, or any mix of them, with placeholders filled in.
 */
export async function announceLevelUp(client: Client, data: LevelAnnouncement): Promise<void> {
  const { message, levels, lang, level } = data;
  if (!levels.message.enabled || !message.member || !message.guild) return;

  const channel = targetChannel(message, levels);
  if (!channel) return;

  const content = normalizeLevelMessage(levels.message.content);
  const user = message.author;

  const context: VariableContext = {
    user: {
      id: user.id,
      name: user.username,
      displayName: message.member.displayName,
      mention: `<@${user.id}>`,
      avatar: user.displayAvatarURL({ size: 512, extension: "png" }),
    },
    channel: { id: channel.id, name: channel.name, mention: `<#${channel.id}>` },
    guild: {
      id: message.guild.id,
      name: message.guild.name,
      icon: message.guild.iconURL({ size: 512, extension: "png" }),
    },
    level: {
      level,
      previous: level - 1,
      total_xp: data.totalXp,
      messages: data.messageCount,
      reward_role: levels.level_roles?.[level] ? `<@&${levels.level_roles[level]}>` : "",
    },
  };
  const fill = (text: string | null, max: number) =>
    text ? substituteVariables(text, context).slice(0, max) : null;

  const text = fill(content.text, LIMITS.text);
  const title = fill(content.embed.title, LIMITS.title);
  const description = fill(content.embed.description, LIMITS.description);
  const footer = fill(content.embed.footer, LIMITS.footer);
  const thumbnail = link(fill(content.embed.thumbnail, 2048));
  const image = link(fill(content.embed.image, 2048));

  const hasEmbed = Boolean(title || description || footer || thumbnail || image);

  const files: AttachmentBuilder[] = [];
  if (content.card) {
    // A card that cannot be drawn must not swallow the announcement.
    const buffer = await new LevelCard({
      avatar: context.user!.avatar,
      data: { level },
      displayOptions: data.cardOptions,
      background: await loadCardBackground(data.cardOptions, user.id, "level_up"),
    })
      .render()
      .catch(() => null);
    if (buffer) files.push(new AttachmentBuilder(buffer, { name: "levelup.png" }));
  }

  const payload: MessageCreateOptions = { files };

  if (hasEmbed) {
    const embed = new EmbedBuilder();
    if (title) embed.setTitle(title);
    if (description) embed.setDescription(description);
    if (footer) embed.setFooter({ text: footer });
    if (thumbnail) embed.setThumbnail(thumbnail);
    const color = embedColor(content.embed.color);
    if (color !== undefined) embed.setColor(color);
    // The card goes inside the embed unless the author chose a picture of their own.
    if (image) embed.setImage(image);
    else if (files.length > 0) embed.setImage("attachment://levelup.png");
    payload.embeds = [embed];
    if (text) payload.content = text;
  } else {
    // Neither a text nor an embed was written: the congratulation the bot always had.
    payload.content = text ?? t(client, lang, "events.message_create.level_up", message.member);
  }

  const sent =
    content.reply && channel.id === message.channel.id
      ? await message.reply(payload).catch(() => null)
      : await channel.send(payload).catch(() => null);

  const seconds = Number(levels.message.delete);
  if (sent && seconds > 0) {
    setTimeout(() => {
      if (sent.deletable) sent.delete().catch(() => {});
    }, seconds * 1000).unref?.();
  }
}
