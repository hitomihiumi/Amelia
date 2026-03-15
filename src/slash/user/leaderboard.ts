import { SlashCommand, UserSchema } from "../../types/helpers";
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
import { MongoDBService } from "../../database";
import { t } from "../../i18n/helpers";
import type { Filter } from "mongodb";
import { formatTime } from "../../handlers/functions";

interface User {
  _id: string;
  data: {
    economy?: {
      balance?: {
        wallet?: number;
        bank?: number;
      };
    };
    level?: {
      total_xp?: number;
      voice_time?: number;
      level?: number;
      xp?: number;
    };
  };
  totalCoins?: number;
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
  users: User[],
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
    const userMention = `<@${usr._id.split(":")[0]}>`;
    desc +=
      t(client, lang, `commands.leaderboard.embeds.${sortBy}.field.name`, pos, userMention) + "\n";

    if (sortBy === "level") {
      const lvl = usr.data?.level?.level ?? 0;
      const xp = usr.data?.level?.xp ?? 0;
      desc += t(client, lang, `commands.leaderboard.embeds.${sortBy}.field.value`, lvl, xp) + "\n";
    } else if (sortBy === "voice") {
      const time = usr.data?.level?.voice_time ?? 0;
      desc +=
        t(
          client,
          lang,
          `commands.leaderboard.embeds.${sortBy}.field.value`,
          formatTime(time, lang, client, { full: true }),
        ) + "\n";
    } else {
      const totalCoins =
        typeof (usr as any).totalCoins === "number"
          ? (usr as any).totalCoins
          : (usr.data?.economy?.balance?.wallet ?? 0) + (usr.data?.economy?.balance?.bank ?? 0);
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
): Promise<{ results: User[]; total: number }> {
  const collection = MongoDBService.getCollection<UserSchema>("user_data");
  const filter = { _id: { $regex: `:${guildId}$` } } as unknown as Filter<UserSchema>;

  const total = await collection.countDocuments(filter);

  if (sortBy === "level") {
    const results = (await collection
      .find(filter)
      .sort({ "data.level.total_xp": -1 })
      .skip(page * limit)
      .limit(limit)
      .toArray()) as unknown as User[];
    return { results, total };
  } else if (sortBy === "voice") {
    const results = (await collection
      .find(filter)
      .sort({ "data.level.voice_time": -1 })
      .skip(page * limit)
      .limit(limit)
      .toArray()) as unknown as User[];
    return { results, total };
  } else {
    const pipeline = [
      { $match: filter },
      {
        $addFields: {
          totalCoins: { $add: ["$data.economy.balance.wallet", "$data.economy.balance.bank"] },
        },
      },
      { $sort: { totalCoins: -1 } },
      { $skip: page * limit },
      { $limit: limit },
    ];
    const results = (await collection.aggregate(pipeline).toArray()) as unknown as User[];
    return { results, total };
  }
}
