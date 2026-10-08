import { prisma } from "../../database/prisma";
import { AI_MEMORY_MAX_PER_USER } from "../../types/helpers";
import { FORGET_MATCH, normalizeMemory, rejectMemory, SAME_MEMORY, similarity } from "./memoryText";

/**
 * Long-term memory: lasting things members said about themselves, kept in the database per
 * server and member. The model proposes them (see `extractMarkers`); nothing is stored that
 * `rejectMemory` refuses, and a member can read and delete their own notes at any time.
 */

/** Notes about the person talking that go into one prompt, and about each other participant. */
const RECALL_SPEAKER = 10;
const RECALL_OTHER = 3;

export interface MemoryRow {
  id: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

export type RememberOutcome = "stored" | "updated" | "duplicate" | "rejected";

export async function listMemories(guildId: string, userId: string): Promise<MemoryRow[]> {
  return prisma.aiMemory.findMany({
    where: { guildId, userId },
    orderBy: { updatedAt: "desc" },
    select: { id: true, content: true, createdAt: true, updatedAt: true },
  });
}

export async function countMemories(guildId: string): Promise<number> {
  return prisma.aiMemory.count({ where: { guildId } });
}

/** Keep one note about a member. A note that says the same as an old one replaces it. */
export async function rememberFact(
  guildId: string,
  userId: string,
  raw: string,
): Promise<RememberOutcome> {
  const content = normalizeMemory(raw);
  if (rejectMemory(content)) return "rejected";

  const existing = await prisma.aiMemory.findMany({
    where: { guildId, userId },
    select: { id: true, content: true, uses: true, lastUsedAt: true },
  });

  let closest: (typeof existing)[number] | null = null;
  let best = 0;
  for (const note of existing) {
    const score = similarity(note.content, content);
    if (score > best) {
      best = score;
      closest = note;
    }
  }

  if (closest && best >= SAME_MEMORY) {
    if (closest.content === content) return "duplicate";
    await prisma.aiMemory.update({ where: { id: closest.id }, data: { content } });
    return "updated";
  }

  // Full: the note that has been useful least, and for the longest time, makes room.
  if (existing.length >= AI_MEMORY_MAX_PER_USER) {
    const [oldest] = [...existing].sort(
      (a, b) => a.uses - b.uses || a.lastUsedAt.getTime() - b.lastUsedAt.getTime(),
    );
    await prisma.aiMemory.delete({ where: { id: oldest.id } });
  }

  await prisma.aiMemory.create({ data: { guildId, userId, content } });
  return "stored";
}

/** Drop the note a member asked to be forgotten, found by how close it is to what they said. */
export async function forgetFact(guildId: string, userId: string, raw: string): Promise<boolean> {
  const wanted = normalizeMemory(raw);
  if (!wanted) return false;

  const notes = await prisma.aiMemory.findMany({
    where: { guildId, userId },
    select: { id: true, content: true },
  });

  let closest: (typeof notes)[number] | null = null;
  let best = 0;
  for (const note of notes) {
    const score = similarity(note.content, wanted);
    if (score > best) {
      best = score;
      closest = note;
    }
  }

  if (!closest || best < FORGET_MATCH) return false;
  await prisma.aiMemory.delete({ where: { id: closest.id } });
  return true;
}

/** Delete one note. Only the member's own, in the server given. */
export async function deleteMemory(guildId: string, userId: string, id: string): Promise<boolean> {
  const { count } = await prisma.aiMemory.deleteMany({ where: { id, guildId, userId } });
  return count > 0;
}

export async function clearUserMemories(guildId: string, userId: string): Promise<number> {
  const { count } = await prisma.aiMemory.deleteMany({ where: { guildId, userId } });
  return count;
}

export async function clearGuildMemories(guildId: string): Promise<number> {
  const { count } = await prisma.aiMemory.deleteMany({ where: { guildId } });
  return count;
}

/** Everything the AI knows, for the prompt: the speaker's notes and a few of the others'. */
export interface Recalled {
  speaker: string[];
  others: { name: string; facts: string[] }[];
}

export async function recall(
  guildId: string,
  speakerId: string,
  others: { id: string; name: string }[],
): Promise<Recalled> {
  const ids = [speakerId, ...others.map((other) => other.id)];
  const rows = await prisma.aiMemory.findMany({
    where: { guildId, userId: { in: ids } },
    orderBy: { updatedAt: "desc" },
    select: { id: true, userId: true, content: true },
  });

  const take = (userId: string, limit: number) =>
    rows.filter((row) => row.userId === userId).slice(0, limit);

  const speaker = take(speakerId, RECALL_SPEAKER);
  const named = others
    .map((other) => ({ name: other.name, rows: take(other.id, RECALL_OTHER) }))
    .filter((other) => other.rows.length > 0);

  const used = [...speaker, ...named.flatMap((other) => other.rows)].map((row) => row.id);
  if (used.length > 0) {
    await prisma.aiMemory.updateMany({
      where: { id: { in: used } },
      data: { lastUsedAt: new Date(), uses: { increment: 1 } },
    });
  }

  return {
    speaker: speaker.map((row) => row.content),
    others: named.map((other) => ({ name: other.name, facts: other.rows.map((r) => r.content) })),
  };
}
