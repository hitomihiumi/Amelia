import { SlashCommand } from "../../types/helpers";
import {
    Client,
    CommandInteraction,
    EmbedBuilder,
    ButtonBuilder,
    ButtonStyle,
    ActionRowBuilder,
    MessageActionRowComponentBuilder,
    ChannelType,
    PermissionFlagsBits,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
    ModalActionRowComponentBuilder,
    PermissionsBitField
} from "discord.js";
import { Guild } from "../../helpers";
import { t } from "../../i18n/helpers";

module.exports = {
    name: "jtc",
    description: "Setting Join To Create",
    locale: {
      "ru": "Настройка функционала Join To Create",
    },
    cooldown: 5,
    permissions: {
        bot: [PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ManageChannels, PermissionsBitField.Flags.EmbedLinks]
    },
    options: [],
    run: async (client: Client, interaction: CommandInteraction) => {
        if (!interaction.guild) return;
        let guild = new Guild(client, interaction.guild);

        const lang = guild.get("settings.language")

        let row = new ActionRowBuilder<MessageActionRowComponentBuilder>()
            .setComponents(
                new ButtonBuilder()
                    .setCustomId("NI_jtc:toggle")
                    .setLabel(`${ guild.get("utils.join_to_create.enabled") ? t(client, lang, "commands.jtc.buttons.disable") : t(client, lang, "commands.jtc.buttons.enable") }`)
                    .setStyle( guild.get("utils.join_to_create.enabled") ? ButtonStyle.Danger : ButtonStyle.Success )
            )

        let embed = new EmbedBuilder()
            .setTitle(`${t(client, lang, "commands.jtc.embeds.title")}`)
            .setColor(client.holder.colors.default)
            .setDescription(`${t(client, lang, "commands.jtc.embeds.description")}`)
            .addFields(
                { name: `${t(client, lang, "commands.jtc.embeds.fields.status.status")}`, value: `${guild.get("utils.join_to_create.enabled") ? t(client, lang, "commands.jtc.embeds.fields.status.enabled") : t(client, lang, "commands.jtc.embeds.fields.status.disabled") }`, inline: true }
            );

        if (guild.get("utils.join_to_create.enabled")) {
            embed.addFields(
                { name: `${t(client, lang, "commands.jtc.embeds.fields.category")}`, value: `<#${guild.get("utils.join_to_create.category")}>`, inline: true },
                { name: `${t(client, lang, "commands.jtc.embeds.fields.channel")}`, value: `<#${guild.get("utils.join_to_create.channel")}>`, inline: true },
                { name: `${t(client, lang, "commands.jtc.embeds.fields.default_name")}`, value: `${client.holder.utils.reVar(guild.get("utils.join_to_create.default_name"), interaction.user.displayName)}`, inline: true }
            )

            row.addComponents(
                new ButtonBuilder()
                    .setCustomId("NI_jtc:change")
                    .setLabel(`${t(client, lang, "commands.jtc.buttons.change_name")}`)
                    .setStyle(ButtonStyle.Primary)
            )
        }

        let msg = await interaction.reply({ embeds: [embed], components: [row], ephemeral: true });

        const filter = (i: any) => i.user.id === interaction.user.id;

        const collector = msg.createMessageComponentCollector({ filter, time: 600000 });

        collector.on("collect", async (i) => {
            if (i.customId === "NI_jtc:toggle") {
                if (guild.get("utils.join_to_create.enabled")) {
                    guild.set("utils.join_to_create.enabled", !guild.get("utils.join_to_create.enabled"));

                    row = new ActionRowBuilder<MessageActionRowComponentBuilder>()
                        .setComponents(
                            new ButtonBuilder()
                                .setCustomId("NI_jtc:toggle")
                                .setLabel(`${ guild.get("utils.join_to_create.enabled") ? t(client, lang, "commands.jtc.buttons.disable") : t(client, lang, "commands.jtc.buttons.enable") }`)
                                .setStyle( guild.get("utils.join_to_create.enabled") ? ButtonStyle.Danger : ButtonStyle.Success )
                        )

                    delete embed.data.fields;
                    embed.addFields(
                        { name: `${t(client, lang, "commands.jtc.embeds.fields.status.status")}`, value: `${guild.get("utils.join_to_create.enabled") ? t(client, lang, "commands.jtc.embeds.fields.status.enabled") : t(client, lang, "commands.jtc.embeds.fields.status.disabled") }`, inline: true }
                    )

                    let category = guild.guild.channels.cache.get(guild.get("utils.join_to_create.category"));
                    let channel = guild.guild.channels.cache.get(guild.get("utils.join_to_create.channel"));

                    if (category) {
                        category.delete();
                    }
                    if (channel) {
                        channel.delete();
                    }
                } else if (!guild.get("utils.join_to_create.enabled")) {
                    guild.set("utils.join_to_create.enabled", !guild.get("utils.join_to_create.enabled"));

                    row = new ActionRowBuilder<MessageActionRowComponentBuilder>()
                        .setComponents(
                            new ButtonBuilder()
                                .setCustomId("NI_jtc:toggle")
                                .setLabel(`${ guild.get("utils.join_to_create.enabled") ? t(client, lang, "commands.jtc.buttons.disable") : t(client, lang, "commands.jtc.buttons.enable") }`)
                                .setStyle( guild.get("utils.join_to_create.enabled") ? ButtonStyle.Danger : ButtonStyle.Success )
                        )

                    let category = await guild.guild.channels.create({
                        name: `Join To Create`,
                        type: ChannelType.GuildCategory,
                        permissionOverwrites: [
                            {
                                id: guild.guild.id,
                                allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.Connect],
                            }
                        ]
                    });

                    let channel = await guild.guild.channels.create({
                        name: `Join To Create`,
                        type: ChannelType.GuildVoice,
                        parent: category.id,
                        permissionOverwrites: [
                            {
                                id: guild.guild.id,
                                allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.Connect],
                            }
                        ]
                    });

                    guild.set("utils.join_to_create.category", category.id);
                    guild.set("utils.join_to_create.channel", channel.id);

                    delete embed.data.fields;
                    embed.addFields(
                        { name: `${t(client, lang, "commands.jtc.embeds.fields.status.status")}`, value: `${guild.get("utils.join_to_create.enabled") ? t(client, lang, "commands.jtc.embeds.fields.status.enabled") : t(client, lang, "commands.jtc.embeds.fields.status.disabled") }`, inline: true },
                        { name: `${t(client, lang, "commands.jtc.embeds.fields.category")}`, value: `<#${guild.get("utils.join_to_create.category")}>`, inline: true },
                        { name: `${t(client, lang, "commands.jtc.embeds.fields.channel")}`, value: `<#${guild.get("utils.join_to_create.channel")}>`, inline: true },
                        { name: `${t(client, lang, "commands.jtc.embeds.fields.default_name")}`, value: `${client.holder.utils.reVar(guild.get("utils.join_to_create.default_name"), interaction.user.displayName)}`, inline: true }
                    );

                    row.addComponents(
                        new ButtonBuilder()
                            .setCustomId("NI_jtc:change")
                            .setLabel(`${t(client, lang, "commands.jtc.buttons.change_name")}`)
                            .setStyle(ButtonStyle.Primary)
                    )
                }

                i.update({ embeds: [embed], components: [row] });
            } else if (i.customId === "NI_jtc:change") {
                let modal = new ModalBuilder()
                    .setTitle(`${t(client, lang, "commands.jtc.modals.change_name.title")}`)
                    .setCustomId("NI_jtc:change_modal")
                    .setComponents(
                        new ActionRowBuilder<ModalActionRowComponentBuilder>()
                            .setComponents(
                                new TextInputBuilder()
                                    .setRequired(true)
                                    .setMinLength(7)
                                    .setMaxLength(56)
                                    .setStyle(TextInputStyle.Short)
                                    .setCustomId("NI_jtc:change_name")
                                    .setLabel(`${t(client, lang, "commands.jtc.modals.change_name.label")}`)
                                    .setPlaceholder(`${t(client, lang, "commands.jtc.modals.change_name.placeholder")}`)
                            )
                    )

                await i.showModal(modal);

                const submit = await i.awaitModalSubmit({ time: 5 * 60 * 1000, filter: (i: any) => i.user.id === interaction.user.id && i.customId === "NI_jtc:change_modal" });

                let name = submit.fields.getTextInputValue("NI_jtc:change_name");

                guild.set("utils.join_to_create.default_name", name);

                delete embed.data.fields;

                embed.addFields(
                    { name: `${t(client, lang, "commands.jtc.embeds.fields.status.status")}`, value: `${guild.get("utils.join_to_create.enabled") ? t(client, lang, "commands.jtc.embeds.fields.status.enabled") : t(client, lang, "commands.jtc.embeds.fields.status.disabled") }`, inline: true },
                    { name: `${t(client, lang, "commands.jtc.embeds.fields.category")}`, value: `<#${guild.get("utils.join_to_create.category")}>`, inline: true },
                    { name: `${t(client, lang, "commands.jtc.embeds.fields.channel")}`, value: `<#${guild.get("utils.join_to_create.channel")}>`, inline: true },
                    { name: `${t(client, lang, "commands.jtc.embeds.fields.default_name")}`, value: `${client.holder.utils.reVar(guild.get("utils.join_to_create.default_name"), interaction.user.displayName)}`, inline: true }
                );

                // @ts-ignore
                submit.update({ embeds: [embed], components: [row] });
            }
        });

    }
} as SlashCommand;


