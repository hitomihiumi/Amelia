import { SlashCommand } from "../../types/helpers";
import { Client, CommandInteraction, ContainerBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js";
import { defaultPermissions, Guild } from "../../helpers";
import {t} from "../../i18n/helpers";
import {MessageFlags} from "discord-api-types/v10";
import os from "os";
import axios from "axios";
import * as packageJson from "../../../package.json";

module.exports = {
    name: "stats",
    description: "📊 Get bot statistics",
    cooldown: 5,
    locale: {
        ru: "📊 Получить статистику бота",
        uk: "📊 Відобразити статистику бота",
    },
    options: [],
    permissions: {
        bot: [...defaultPermissions],
    },
    key: null,
    run: async (client: Client, interaction: CommandInteraction) => {
        if (!interaction.guild) return;
        let guild = new Guild(client, interaction.guild);

        const lang = await guild.get("settings.language");

        let totalGuilds = 0;
        let totalMembers = 0;

        if (client.shard) {
            totalGuilds = await client.shard.broadcastEval(client => client.guilds.cache.size).then(results => results.reduce((acc, count) => acc + count, 0));
            totalMembers = await client.shard.broadcastEval(client => client.guilds.cache.reduce((acc, guild) => acc + guild.memberCount, 0)).then(results => results.reduce((acc, count) => acc + count, 0));
        } else {
            totalGuilds = client.guilds.cache.size;
            totalMembers = client.guilds.cache.reduce((acc, guild) => acc + guild.memberCount, 0);
        }

        let githubStars = 0;
        let githubForks = 0;
        let githubIssues = 0;
        let githubName = "";
        let githubHtmlUrl = "https://github.com/hitomihiumi/Amelia";

        try {
          const { data } = await axios.get("https://api.github.com/repos/hitomihiumi/Amelia");

          githubStars = data.stargazers_count;
          githubForks = data.forks;
          githubIssues = data.open_issues;
          githubName = data.full_name;
          githubHtmlUrl = data.html_url;
        } catch (e) {
          console.error(e);
        }
        
        let latestVersion = "Unknown";
        let isLatestVersion = true;
        try {
          const { data } = await axios.get("https://api.github.com/repos/hitomihiumi/Amelia/releases/latest");
          latestVersion = data.tag_name;
          const currentVersionStr = Array.isArray(packageJson.version) ? packageJson.version[0] : packageJson.version;
          if (latestVersion !== `v${currentVersionStr}` && latestVersion !== currentVersionStr) {
            isLatestVersion = false;
          }
        } catch (e) {
          console.error(e);
        }

        // Calculate system metrics
        const totalRAM = (os.totalmem() / 1024 / 1024 / 1024).toFixed(2);
        const usedRAM = (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2);
        const uptimeSeconds = process.uptime();
        const days = Math.floor(uptimeSeconds / (3600 * 24));
        const hours = Math.floor(uptimeSeconds % (3600 * 24) / 3600);
        const minutes = Math.floor(uptimeSeconds % 3600 / 60);
        
        let uptimeString = "";
        if (days > 0) uptimeString += `${days}d `;
        if (hours > 0) uptimeString += `${hours}h `;
        uptimeString += `${minutes}m`;

        const cpuLoad = os.loadavg()[0].toFixed(2);

        const container = new ContainerBuilder()
            .setAccentColor(client.holder.colors.default as number)
            .addTextDisplayComponents(
                (text) => text.setContent(
                    `# 📊 ${t(client, lang, "commands.stats.title")}\n` +
                    `### 🌐 Discord\n` +
                    ` - **${t(client, lang, "commands.stats.total_guilds")}**: ${totalGuilds}\n` +
                    ` - **${t(client, lang, "commands.stats.total_members")}**: ${totalMembers}\n` +
                    ` - **${t(client, lang, "commands.stats.total_shards")}**: ${Number(client.shard?.count || 0)}`
                )
            ).addSeparatorComponents((separator) => separator);
        
        container.addTextDisplayComponents(
            (text) => text.setContent(
                `### 💻 ${t(client, lang, "commands.stats.system.title")}\n` +
                ` - **${t(client, lang, "commands.stats.system.cpu")}**: \`${cpuLoad}%\`\n` +
                ` - **${t(client, lang, "commands.stats.system.ram")}**: \`${usedRAM} MB / ${totalRAM} GB\`\n` +
                ` - **${t(client, lang, "commands.stats.system.nodejs")}**: \`${process.version}\`\n` +
                ` - **${t(client, lang, "commands.stats.system.uptime")}**: \`${uptimeString}\`\n` +
                ` - **${t(client, lang, "commands.stats.system.platform")}**: \`${process.platform}\`\n`
            )
        ).addSeparatorComponents((separator) => separator)
        .addTextDisplayComponents(
            (text) => text.setContent(
                `### 📦 ${t(client, lang, "commands.stats.version.title")}\n` +
                ` - **${t(client, lang, "commands.stats.version.current")}**: ${packageJson.version}\n` +
                ` - **${t(client, lang, "commands.stats.version.latest")}**: [${latestVersion}](${githubHtmlUrl}/releases/tag/${latestVersion})` + (!isLatestVersion ? `\n> ${t(client, lang, "commands.stats.version.latest_description")}` : "")
            )
        ).addSeparatorComponents((separator) => separator)
            .addTextDisplayComponents(
                (text) => text.setContent(
                    `### 🐱 ${t(client, lang, "commands.stats.github.title")}\n` +
                    ` - **${t(client, lang, "commands.stats.github.name")}**: \`${githubName}\` \n` +
                    `- :star: **${t(client, lang, "commands.stats.github.stars")}**: \`${githubStars}\`\n` +
                    `- :fork_and_knife: **${t(client, lang, "commands.stats.github.forks")}**: \`${githubForks}\`\n` +
                    `- :bug: **${t(client, lang, "commands.stats.github.issues")}**: \`${githubIssues}\``
                )
            );

        const buttonsRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
            new ButtonBuilder()
                .setLabel(t(client, lang, "commands.stats.buttons.invite"))
                .setStyle(ButtonStyle.Link)
                .setURL(`https://discord.com/api/oauth2/authorize?client_id=${client.user?.id}&permissions=8&scope=bot%20applications.commands`),
            new ButtonBuilder()
                .setLabel(t(client, lang, "commands.stats.buttons.github"))
                .setStyle(ButtonStyle.Link)
                .setURL("https://github.com/hitomihiumi/Amelia")
        );

        await interaction.reply({
            components: [container, buttonsRow],
            flags: MessageFlags.IsComponentsV2,
        });

    },
} as SlashCommand;
