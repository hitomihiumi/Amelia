import { Client } from "discord.js";
import { MongoDBService } from "../database";
import { Manifest, SlashCommand } from "../types/helpers";
import * as packageJson from "../../package.json";

/** How often the heartbeat is refreshed. The website treats it as stale after 90s. */
const INTERVAL_MS = 30_000;

export const STATUS_COLLECTION = "bot_status";

interface StatusDocument {
  _id: string;
  shardId: number;
  status: "online" | "offline";
  ping: number;
  guildCount: number;
  memberCount: number;
  commandCount: number;
  uptimeMs: number;
  startedAt: Date;
  version: string;
  updatedAt: Date;
}

/** Slash commands, counting every subcommand of a category separately. */
function countCommands(client: Client): number {
  let total = 0;

  for (const entry of client.holder.cmds.slashCommands.values()) {
    const manifest = entry as unknown as Manifest;

    if (manifest?.commands && typeof manifest.commands === "object") {
      total += Object.keys(manifest.commands).length;
      continue;
    }

    if ((entry as unknown as SlashCommand)?.name) total += 1;
  }

  return total;
}

async function writeHeartbeat(client: Client, status: "online" | "offline"): Promise<void> {
  const shardId = client.shard?.ids[0] ?? 0;
  const now = new Date();

  const document: StatusDocument = {
    _id: `shard:${shardId}`,
    shardId,
    status,
    ping: Math.max(0, Math.round(client.ws.ping)),
    guildCount: client.guilds.cache.size,
    memberCount: client.guilds.cache.reduce((sum, guild) => sum + (guild.memberCount ?? 0), 0),
    commandCount: countCommands(client),
    uptimeMs: client.uptime ?? 0,
    startedAt: new Date(now.getTime() - (client.uptime ?? 0)),
    version: String(packageJson.version),
    updatedAt: now,
  };

  await MongoDBService.getCollection<StatusDocument>(STATUS_COLLECTION).updateOne(
    { _id: document._id },
    { $set: document },
    { upsert: true },
  );
}

/**
 * Publishes the metrics the website status page and the landing statistics read.
 *
 * The bot has no HTTP API, so the numbers travel through the MongoDB cache both
 * projects already share.
 */
module.exports = (client: Client) => {
  client.on("clientReady", () => {
    const tick = () => {
      writeHeartbeat(client, "online").catch((error) => {
        console.error("[Status] Failed to write the heartbeat:", error);
      });
    };

    tick();
    const timer = setInterval(tick, INTERVAL_MS);
    timer.unref?.();
  });
};

/** Mark the bot as offline, so a planned restart shows up immediately. */
export async function markOffline(client: Client): Promise<void> {
  try {
    await writeHeartbeat(client, "offline");
  } catch (error) {
    console.error("[Status] Failed to mark the bot offline:", error);
  }
}
