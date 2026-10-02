import { SlashCommand } from "../../types/helpers";
import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  Client,
  CommandInteraction,
  ComponentType,
  EmbedBuilder,
  MessageFlags,
} from "discord.js";
import { defaultPermissions, Guild } from "../../helpers";
import { prisma } from "../../database";
import { t, tObject } from "../../i18n/helpers";
import { formatTime } from "../../handlers/functions";

interface LeaderboardEntry {
  userId: string;
  level: number;
  xp: number;
  totalXp: number;
  voiceTime: number;
  wallet: number;
  bank: number;
}

type SortBy = "level" | "voice" | "coins";

function styleFor(sortBy: SortBy, check: SortBy) {
  return sortBy === check ? ButtonStyle.Success : ButtonStyle.Secondary;
}

module.exports = {
  name: "leaderboard",
  description: "🎩 Show server user leaderboard",
  cooldown: 5,
  locale: {
    ru: "🎩 Общий рейтинг пользователей сервера",
    uk: "🎩 Загальний рейтинг користувачів сервера",
  },
  options: [],
  permissions: {
    bot: [...defaultPermissions],
  },
  key: null,
  run: async (client: Client, interaction: CommandInteraction) => {
    if (!interaction.guild) return;
    const guild = new Guild(client, interaction.guild);

    const lang = await guild.get("settings.language");

    let page = 0;
    const limit = 10;
    const guildId = interaction.guild.id;
    let sortBy: SortBy = "level";
    const emoji = (await guild.get("economy.currency.emoji")) || client.holder.emojis.discord.gems;

    const dataObj = await membersData(page, limit, guildId, sortBy);
    let memberData = dataObj.results;
    const total = dataObj.total;

    const embed = buildLeaderboardEmbed(
      client,
      lang,
      sortBy,
      memberData,
      page,
      limit,
      total,
      guild,
      emoji,
    );

    const prevButton = new ButtonBuilder()
      .setCustomId("NI_leaderboard:prev")
      .setEmoji("◀")
      .setStyle(ButtonStyle.Primary)
      .setDisabled(page === 0);
    const nextButton = new ButtonBuilder()
      .setCustomId("NI_leaderboard:next")
      .setEmoji("▶")
      .setStyle(ButtonStyle.Primary)
      .setDisabled((page + 1) * limit >= total);

    const levelBtn = new ButtonBuilder()
      .setCustomId("NI_leaderboard:sort_level")
      .setLabel(t(client, lang, "commands.leaderboard.buttons.level"))
      .setEmoji("🧙")
      .setStyle(styleFor(sortBy, "level"));
    const voiceBtn = new ButtonBuilder()
      .setCustomId("NI_leaderboard:sort_voice")
      .setLabel(t(client, lang, "commands.leaderboard.buttons.voice"))
      .setEmoji("🎤")
      .setStyle(styleFor(sortBy, "voice"));
    const coinsBtn = new ButtonBuilder()
      .setCustomId("NI_leaderboard:sort_coins")
      .setLabel(t(client, lang, "commands.leaderboard.buttons.coins"))
      .setEmoji(emoji)
      .setStyle(styleFor(sortBy, "coins"));

    const rowNavigation = new ActionRowBuilder<ButtonBuilder>().addComponents(
      prevButton,
      nextButton,
    );
    const rowSort = new ActionRowBuilder<ButtonBuilder>().addComponents(
      levelBtn,
      voiceBtn,
      coinsBtn,
    );

    await interaction.reply({
      embeds: [embed],
      components: [rowSort, rowNavigation],
    });

    const message = await interaction.fetchReply();

    const collector = message.createMessageComponentCollector({
      componentType: ComponentType.Button,
      time: 2 * 60_000,
    });

    collector.on("collect", async (i) => {
      if (i.user.id !== interaction.user.id) {
        await i.reply({ content: "Not your leaderboard.", flags: MessageFlags.Ephemeral });
        return;
      }

      await i.deferUpdate();

      const id = i.customId;
      if (id === "NI_leaderboard:prev") {
        page = Math.max(0, page - 1);
      } else if (id === "NI_leaderboard:next") {
        page = page + 1;
      } else if (id.startsWith("NI_leaderboard:sort_")) {
        const newSort = id.replace("NI_leaderboard:sort_", "") as SortBy;
        if (newSort !== sortBy) {
          sortBy = newSort;
          page = 0;
        }
      }

      const newDataObj = await membersData(page, limit, guildId, sortBy);
      memberData = newDataObj.results;
      const newTotal = newDataObj.total;

      const newEmbed = buildLeaderboardEmbed(
        client,
        lang,
        sortBy,
        memberData,
        page,
        limit,
        newTotal,
        guild,
        emoji,
      );

      const prev = new ButtonBuilder()
        .setCustomId("NI_leaderboard:prev")
        .setLabel("◀")
        .setStyle(ButtonStyle.Primary)
        .setDisabled(page === 0);
      const next = new ButtonBuilder()
        .setCustomId("NI_leaderboard:next")
        .setLabel("▶")
        .setStyle(ButtonStyle.Primary)
        .setDisabled((page + 1) * limit >= newTotal);

      const levelB = new ButtonBuilder()
        .setCustomId("NI_leaderboard:sort_level")
        .setLabel(t(client, lang, "commands.leaderboard.buttons.level"))
        .setEmoji("🧙")
        .setStyle(styleFor(sortBy, "level"));
      const voiceB = new ButtonBuilder()
        .setCustomId("NI_leaderboard:sort_voice")
        .setLabel(t(client, lang, "commands.leaderboard.buttons.voice"))
        .setEmoji("🎤")
        .setStyle(styleFor(sortBy, "voice"));
      const coinsB = new ButtonBuilder()
        .setCustomId("NI_leaderboard:sort_coins")
        .setLabel(t(client, lang, "commands.leaderboard.buttons.coins"))
        .setEmoji(emoji)
        .setStyle(styleFor(sortBy, "coins"));

      const navRow = new ActionRowBuilder<ButtonBuilder>().addComponents(prev, next);
      const sortRow = new ActionRowBuilder<ButtonBuilder>().addComponents(levelB, voiceB, coinsB);

      await message.edit({ embeds: [newEmbed], components: [sortRow, navRow] });
    });

    collector.on("end", async () => {
      const disablePrev = new ButtonBuilder()
        .setCustomId("NI_leaderboard:prev")
        .setLabel("◀")
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(true);
      const disableNext = new ButtonBuilder()
        .setCustomId("NI_leaderboard:next")
        .setLabel("▶")
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(true);
      const disableLevel = new ButtonBuilder()
        .setCustomId("NI_leaderboard:sort_level")
        .setLabel(t(client, lang, "commands.leaderboard.buttons.level"))
        .setEmoji("🧙")
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(true);
      const disableVoice = new ButtonBuilder()
        .setCustomId("NI_leaderboard:sort_voice")
        .setLabel(t(client, lang, "commands.leaderboard.buttons.voice"))
        .setEmoji("🎤")
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(true);
      const disableCoins = new ButtonBuilder()
        .setCustomId("NI_leaderboard:sort_coins")
        .setLabel(t(client, lang, "commands.leaderboard.buttons.coins"))
        .setEmoji(emoji)
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(true);

      const navRow = new ActionRowBuilder<ButtonBuilder>().addComponents(disablePrev, disableNext);
      const sortRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
        disableLevel,
        disableVoice,
        disableCoins,
      );

      try {
        await message.edit({ components: [sortRow, navRow] });
      } catch {
        // ignore
      }
    });
  },
} as SlashCommand;

function buildLeaderboardEmbed(
  client: Client,
  lang: string,
  sortBy: SortBy,
  users: LeaderboardEntry[],
  page: number,
  limit: number,
  total: number,
  guild: Guild,
  emoji: string,
): EmbedBuilder {
  const embed = new EmbedBuilder()
    .setTitle(t(client, lang, `commands.leaderboard.embeds.${sortBy}.title`))
    .setColor(client.holder.colors.default)
    .setThumbnail(guild.guild.iconURL())
    .setFooter({
      text: t(
        client,
        lang,
        "commands.leaderboard.embeds.footer",
        page + 1,
        Math.max(1, Math.ceil(total / limit)),
        total,
      ),
    });

  let pos = page * limit;
  let desc = "";
  for (const usr of users) {
    pos++;
    const userMention = `<@${usr.userId}>`;
    desc +=
      t(client, lang, `commands.leaderboard.embeds.${sortBy}.field.name`, pos, userMention) + "\n";

    if (sortBy === "level") {
      desc +=
        t(client, lang, `commands.leaderboard.embeds.${sortBy}.field.value`, usr.level, usr.xp) +
        "\n";
    } else if (sortBy === "voice") {
      const time = usr.voiceTime;
      desc +=
        t(
          client,
          lang,
          `commands.leaderboard.embeds.${sortBy}.field.value`,
          formatTime(time, lang, tObject(client, lang, "time_units"), { full: true }),
        ) + "\n";
    } else {
      const totalCoins = usr.wallet + usr.bank;
      desc +=
        t(client, lang, `commands.leaderboard.embeds.${sortBy}.field.value`, totalCoins, emoji) +
        "\n";
    }
  }

  embed.setDescription(
    desc || t(client, lang, "commands.leaderboard.embeds.level.description") || "",
  );

  return embed;
}

async function membersData(
  page: number,
  limit: number,
  guildId: string,
  sortBy: SortBy = "level",
): Promise<{ results: LeaderboardEntry[]; total: number }> {
  const where = { guildId };
  const total = await prisma.user.count({ where });

  const select = {
    userId: true,
    level: true,
    xp: true,
    totalXp: true,
    voiceTime: true,
    wallet: true,
    bank: true,
  };

  if (sortBy === "coins") {
    // The coins board sorts by wallet + bank, which is not a single column —
    // fetch the guild and rank in memory. Guilds hold hundreds, not millions.
    const rows = await prisma.user.findMany({ where, select });
    const results = rows
      .sort((a, b) => b.wallet + b.bank - (a.wallet + a.bank))
      .slice(page * limit, page * limit + limit);
    return { results, total };
  }

  const orderBy =
    sortBy === "voice" ? { voiceTime: "desc" as const } : { totalXp: "desc" as const };

  const results = await prisma.user.findMany({
    where,
    select,
    orderBy,
    skip: page * limit,
    take: limit,
  });

  return { results, total };
}
