import { Client, Guild } from "discord.js";
import { prisma } from "../database";

/** Counters are kept in memory and written in one go, so a busy server costs one query a minute. */
const FLUSH_MS = 60_000;

/** Server snapshots (names, member counts) are refreshed this often. */
const PRESENCE_MS = 10 * 60_000;

/** Daily counters older than this are deleted; the admin panel shows 30 days. */
const RETENTION_DAYS = 90;

type Counter = "commands" | "components" | "messages" | "joins" | "leaves";

interface Bucket {
  guildId: string;
  day: Date;
  counters: Record<Counter, number>;
  commands: Map<string, number>;
}

/** Midnight UTC of a moment: the day a counter belongs to. */
function dayOf(date = new Date()): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

let buckets = new Map<string, Bucket>();

function bucketFor(guildId: string): Bucket {
  const day = dayOf();
  const key = `${guildId}|${day.getTime()}`;
  let bucket = buckets.get(key);
  if (!bucket) {
    bucket = {
      guildId,
      day,
      counters: { commands: 0, components: 0, messages: 0, joins: 0, leaves: 0 },
      commands: new Map(),
    };
    buckets.set(key, bucket);
  }
  return bucket;
}

function count(guildId: string | null | undefined, counter: Counter): void {
  if (!guildId) return;
  bucketFor(guildId).counters[counter] += 1;
}

async function flush(): Promise<void> {
  if (buckets.size === 0) return;

  const pending = buckets;
  buckets = new Map();

  for (const bucket of pending.values()) {
    try {
      const { guildId, day, counters } = bucket;
      await prisma.guildStat.upsert({
        where: { guildId_day: { guildId, day } },
        create: { guildId, day, ...counters },
        update: {
          commands: { increment: counters.commands },
          components: { increment: counters.components },
          messages: { increment: counters.messages },
          joins: { increment: counters.joins },
          leaves: { increment: counters.leaves },
        },
      });

      for (const [name, total] of bucket.commands) {
        await prisma.commandStat.upsert({
          where: { guildId_day_name: { guildId, day, name } },
          create: { guildId, day, name, count: total },
          update: { count: { increment: total } },
        });
      }
    } catch (error) {
      console.error("[GuildStats] Failed to write the counters, keeping them for the next try:", error);
      // Put the numbers back, so a database hiccup does not lose them.
      const key = `${bucket.guildId}|${bucket.day.getTime()}`;
      const current = bucketFor(bucket.guildId);
      if (current.day.getTime() !== bucket.day.getTime()) buckets.set(key, bucket);
      else {
        for (const name of Object.keys(bucket.counters) as Counter[]) current.counters[name] += bucket.counters[name];
        for (const [command, total] of bucket.commands)
          current.commands.set(command, (current.commands.get(command) ?? 0) + total);
      }
    }
  }
}

async function savePresence(guild: Guild): Promise<void> {
  const data = {
    name: guild.name,
    icon: guild.icon,
    ownerId: guild.ownerId,
    memberCount: guild.memberCount,
    locale: guild.preferredLocale,
    boostTier: Number(guild.premiumTier),
    leftAt: null,
  };

  await prisma.guildPresence.upsert({
    where: { id: guild.id },
    create: { id: guild.id, joinedAt: guild.joinedAt ?? new Date(), ...data },
    update: data,
  });
}

async function syncPresence(client: Client): Promise<void> {
  const guilds = [...client.guilds.cache.values()];
  for (const guild of guilds) await savePresence(guild);

  if (guilds.length === 0) return;

  // Servers that removed the bot while it was offline.
  await prisma.guildPresence.updateMany({
    where: { leftAt: null, id: { notIn: guilds.map((guild) => guild.id) } },
    data: { leftAt: new Date() },
  });
}

/**
 * Collects what the admin panel's Servers page shows: the list of servers the bot is in and
 * per-day usage counters (commands, messages, joins and leaves).
 */
module.exports = (client: Client) => {
  const safely = (label: string, task: () => Promise<unknown>) => () =>
    task().catch((error) => console.error(`[GuildStats] ${label}:`, error));

  client.on("clientReady", () => {
    safely("presence sync", () => syncPresence(client))();
    setInterval(safely("presence sync", () => syncPresence(client)), PRESENCE_MS).unref?.();
    setInterval(safely("flush", flush), FLUSH_MS).unref?.();
    setInterval(
      safely("cleanup", async () => {
        const before = dayOf(new Date(Date.now() - RETENTION_DAYS * 86_400_000));
        await prisma.guildStat.deleteMany({ where: { day: { lt: before } } });
        await prisma.commandStat.deleteMany({ where: { day: { lt: before } } });
      }),
      6 * 3_600_000,
    ).unref?.();
  });

  client.on("guildCreate", (guild) => void safely("guild join", () => savePresence(guild))());
  client.on("guildUpdate", (_old, guild) => void safely("guild update", () => savePresence(guild))());
  client.on(
    "guildDelete",
    (guild) =>
      void safely("guild leave", () =>
        prisma.guildPresence.updateMany({ where: { id: guild.id }, data: { leftAt: new Date() } }),
      )(),
  );

  client.on("interactionCreate", (interaction) => {
    if (!interaction.guildId) return;

    if (interaction.isChatInputCommand()) {
      const bucket = bucketFor(interaction.guildId);
      bucket.counters.commands += 1;
      const sub = interaction.options.getSubcommand(false);
      const name = sub ? `${interaction.commandName} ${sub}` : interaction.commandName;
      bucket.commands.set(name, (bucket.commands.get(name) ?? 0) + 1);
    } else if (interaction.isMessageComponent() || interaction.isModalSubmit()) {
      count(interaction.guildId, "components");
    }
  });

  client.on("messageCreate", (message) => {
    if (message.author.bot) return;
    count(message.guildId, "messages");
  });

  client.on("guildMemberAdd", (member) => {
    if (!member.user.bot) count(member.guild.id, "joins");
  });
  client.on("guildMemberRemove", (member) => {
    if (!member.user?.bot) count(member.guild.id, "leaves");
  });

  // Write what is left when the process is asked to stop.
  for (const signal of ["SIGINT", "SIGTERM"]) process.once(signal, () => void flush());
};
