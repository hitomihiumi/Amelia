import { History as PrismaHistory } from '@prisma/client';
import { Guild, Client } from 'discord.js';
import { prisma } from '../database/prisma';

/**
 * History action types
 */
export enum HistoryType {
  ECONOMY = 'economy',
  MODERATION = 'moderation',
  LEVELS = 'levels',
  SETTINGS = 'settings',
  CUSTOM = 'custom',
}

/**
 * History action interface
 */
export interface HistoryAction {
  type: HistoryType;
  action: string;
  data: any;
  userId?: string;
}

/**
 * Database History wrapper for tracking actions
 */
export class DBHistory {
  public client: Client;
  public guild: Guild;

  constructor(client: Client, guild: Guild) {
    this.client = client;
    this.guild = guild;
  }

  /**
   * Add a history entry
   */
  public async add(action: HistoryAction): Promise<PrismaHistory> {
    return await prisma.history.create({
      data: {
        guildId: this.guild.id,
        userId: action.userId,
        type: action.type,
        action: action.action,
        data: action.data,
      },
    });
  }

  /**
   * Get history entries by type
   */
  public async getByType(type: HistoryType, limit: number = 100): Promise<PrismaHistory[]> {
    return await prisma.history.findMany({
      where: {
        guildId: this.guild.id,
        type,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
    });
  }

  /**
   * Get history entries by user
   */
  public async getByUser(userId: string, limit: number = 100): Promise<PrismaHistory[]> {
    return await prisma.history.findMany({
      where: {
        guildId: this.guild.id,
        userId,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
    });
  }

  /**
   * Get all history entries
   */
  public async getAll(limit: number = 100): Promise<PrismaHistory[]> {
    return await prisma.history.findMany({
      where: {
        guildId: this.guild.id,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
    });
  }

  /**
   * Clear history older than specified days
   */
  public async clear(days: number = 30): Promise<number> {
    const date = new Date();
    date.setDate(date.getDate() - days);

    const result = await prisma.history.deleteMany({
      where: {
        guildId: this.guild.id,
        createdAt: {
          lt: date,
        },
      },
    });

    return result.count;
  }

  /**
   * Delete all history for guild
   */
  public async deleteAll(): Promise<number> {
    const result = await prisma.history.deleteMany({
      where: {
        guildId: this.guild.id,
      },
    });

    return result.count;
  }
}

