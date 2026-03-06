import {
  defaultDisplayOptions,
  LevelCardDisplayOptions,
  ProfileCardDisplayOptions,
  RankCardDisplayOptions,
  SlashCommand,
} from "../../types/helpers";
import {
  AttachmentBuilder,
  ButtonStyle,
  Client,
  CommandInteraction,
  LabelBuilder,
  MessageFlagsBitField,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
} from "discord.js";
import { defaultPermissions, Guild, User } from "../../helpers";
import { t } from "../../i18n/helpers";
import { isHexColor } from "../../handlers/functions";
import { RankCard } from "../../helpers/canvas/RankCard";
import { ProfileCard } from "../../helpers/canvas/ProfileCard";
import { LevelCard } from "../../helpers/canvas/LevelCard";
import { TranslationSchema } from "../../types/i18n/TranslationSchema";

module.exports = {
  name: "appearance",
  description: "Allows you to customize the appearance of the rank card and other elements.",
  cooldown: 5,
  locale: {
    ru: "Позволяет настроить внешний вид рангаовой карточки и других элементов.",
    uk: "Дозволяє налаштувати зовнішній вигляд картки рангу та інших елементів.",
  },
  options: [],
  permissions: {
    bot: [...defaultPermissions],
  },
  run: async (client: Client, interaction: CommandInteraction) => {
    if (!interaction.guild) return;

    await interaction.deferReply({ flags: MessageFlagsBitField.Flags.Ephemeral });

    const guild = new Guild(client, interaction.guild);

    const user = guild.getUser(interaction.user.id);

    const lang = await guild.get("settings.language");

    let opt: "rank" | "profile" | "level_up" = "rank";

    let data: RankCardDisplayOptions | ProfileCardDisplayOptions | LevelCardDisplayOptions;

    const embed = client.holder.utils.fastEmbed({
      title: t(client, lang, "commands.appearance.embeds.base.title"),
      description: t(client, lang, "commands.appearance.embeds.base.description"),
    });

    const row = client.holder.utils.fastRow([
      client.holder.utils.fastStringSelect({
        custom_id: "NI_appearance:select",
        placeholder: t(client, lang, "commands.appearance.select_menus.base.placeholder"),
        type: 3,
        options: [
          {
            label: t(client, lang, "commands.appearance.select_menus.base.options.rank"),
            value: "rank",
          },
          {
            label: t(client, lang, "commands.appearance.select_menus.base.options.profile"),
            value: "profile",
          },
          {
            label: t(client, lang, "commands.appearance.select_menus.base.options.level_up"),
            value: "level_up",
          },
        ],
      }),
    ]);

    const color = client.holder.utils.fastRow([
      client.holder.utils.fastStringSelect({
        custom_id: "NI_appearance:color_select",
        placeholder: t(client, lang, "commands.appearance.select_menus.color.placeholder"),
        type: 3,
        options: [
          {
            label: t(client, lang, "commands.appearance.select_menus.color.options.bg_color"),
            value: "bg_color",
          },
          {
            label: t(
              client,
              lang,
              "commands.appearance.select_menus.color.options.first_component",
            ),
            value: "first_component",
          },
          {
            label: t(
              client,
              lang,
              "commands.appearance.select_menus.color.options.second_component",
            ),
            value: "second_component",
          },
          {
            label: t(
              client,
              lang,
              "commands.appearance.select_menus.color.options.third_component",
            ),
            value: "third_component",
          },
        ],
      }),
    ]);

    const main_buttons = client.holder.utils.fastRow(
      client.holder.utils.fastButtons(
        {
          custom_id: "NI_appearance:mode",
          label: t(client, lang, "commands.appearance.buttons.mode"),
          style: ButtonStyle.Secondary,
          type: 2,
          disabled: true,
        },
        {
          custom_id: "NI_appearance:url",
          label: t(client, lang, "commands.appearance.buttons.url"),
          style: ButtonStyle.Primary,
          type: 2,
          disabled: true,
        },
        {
          custom_id: "NI_appearance:reset",
          label: t(client, lang, "commands.appearance.buttons.reset"),
          style: ButtonStyle.Danger,
          type: 2,
        },
      ),
    );

    const profile_buttons = client.holder.utils.fastRow(
      client.holder.utils.fastButtons(
        {
          custom_id: "NI_appearance:bio",
          label: t(client, lang, "commands.appearance.buttons.bio"),
          style: ButtonStyle.Primary,
          type: 2,
        },
        {
          custom_id: "NI_appearance:padding",
          label: t(client, lang, "commands.appearance.buttons.icons_padding"),
          style: ButtonStyle.Secondary,
          type: 2,
        },
      ),
    );

    let profile_icons;

    let msg = await interaction.editReply({ embeds: [embed], components: [row] });

    const filter = (i: any) => i.user.id === interaction.user.id;

    const collector = msg.createMessageComponentCollector({ filter, time: 600000 });

    collector.on("collect", async (i) => {
      if (i.isButton()) {
        if (i.customId === "NI_appearance:reset") {
          await i.deferUpdate();
          data = {
            ...data,
            ...defaultDisplayOptions[opt],
          };
          await mostUsedQueries[`set${opt}`](user, data);

          await i.update({
            embeds: [embedUpdate(opt, client, lang, data)],
          });
        } else if (i.customId === "NI_appearance:bio") {
          const modal = new ModalBuilder()
            .setTitle(t(client, lang, "commands.appearance.modals.bio.title"))
            .setCustomId("NI_appearance:modal:bio")
            .setLabelComponents(
              new LabelBuilder()
                .setLabel(t(client, lang, "commands.appearance.modals.bio.label"))
                .setTextInputComponent(
                  new TextInputBuilder()
                    .setCustomId("NI_appearance:text:bio_value")
                    .setStyle(TextInputStyle.Paragraph)
                    .setRequired(true)
                    .setMaxLength(400),
                ),
            );

          await i.showModal(modal);

          await i
            .awaitModalSubmit({
              time: 5 * 60 * 1000,
              filter: (si: any) =>
                si.user.id === interaction.user.id && si.customId === "NI_appearance:modal:bio",
            })
            .then(async (int) => {
              await int.deferUpdate();
              const bio_value = int.fields.getTextInputValue("NI_appearance:text:bio_value");

              data = data as ProfileCardDisplayOptions;
              if ("bio" in data) {
                data.bio = bio_value;
              }
              await mostUsedQueries[`set${opt}`](user, data);

              await int.editReply({
                embeds: [embedUpdate(opt, client, lang, data)],
                files: [await imageUpdate(opt, interaction.user, client, data)],
              });
            });
        } else if (i.customId === "NI_appearance:padding") {
          const modal = new ModalBuilder()
            .setTitle(t(client, lang, "commands.appearance.modals.icons_padding.title"))
            .setCustomId("NI_appearance:modal:padding")
            .setLabelComponents(
              new LabelBuilder()
                .setLabel(t(client, lang, "commands.appearance.modals.icons_padding.label"))
                .setTextInputComponent(
                  new TextInputBuilder()
                    .setCustomId("NI_appearance:text:padding_value")
                    .setPlaceholder("0-10")
                    .setStyle(TextInputStyle.Short)
                    .setRequired(true)
                    .setMaxLength(2),
                ),
            );

          await i.showModal(modal);

          await i
            .awaitModalSubmit({
              time: 5 * 60 * 1000,
              filter: (si: any) =>
                si.user.id === interaction.user.id && si.customId === "NI_appearance:modal:padding",
            })
            .then(async (int) => {
              await int.deferUpdate();
              const padding_value = int.fields.getTextInputValue(
                "NI_appearance:text:padding_value",
              );
              const padding_number = parseInt(padding_value);
              if (isNaN(padding_number)) {
                return int.followUp({
                  content: t(client, lang, "commands.appearance.messages.error.invalid_padding"),
                  flags: MessageFlagsBitField.Flags.Ephemeral,
                });
              }

              if (padding_number < 0 || padding_number > 10) {
                return int.followUp({
                  content: t(client, lang, "commands.appearance.messages.error.invalid_padding"),
                  flags: MessageFlagsBitField.Flags.Ephemeral,
                });
              }

              data = data as ProfileCardDisplayOptions;
              if ("icons_padding" in data) {
                data.icons_padding = padding_number;
              }
              await mostUsedQueries[`set${opt}`](user, data);

              await int.editReply({
                embeds: [embedUpdate(opt, client, lang, data)],
                files: [await imageUpdate(opt, interaction.user, client, data)],
              });
            });
        }
      } else if (i.isStringSelectMenu()) {
        if (i.customId === "NI_appearance:select") {
          await i.deferUpdate();
          const selected = i.values[0];
          opt = selected as "rank" | "profile" | "level_up";
          data = await mostUsedQueries[`get${opt}`](user);
          let components = [row, color, main_buttons];
          if (opt === "profile") {
            profile_icons = updateIconsRow(data as ProfileCardDisplayOptions, client, lang);
            components.push(profile_buttons, profile_icons);
          }
          await i.editReply({
            embeds: [embedUpdate(selected as "rank" | "profile" | "level_up", client, lang, data)],
            components: components,
            files: [await imageUpdate(opt, interaction.user, client, data)],
          });
        } else if (i.customId === "NI_appearance:color_select") {
          const selected = i.values[0];
          let modal = new ModalBuilder()
            .setTitle(t(client, lang, "commands.appearance.modals.color.title"))
            .setCustomId("NI_appearance:modal:colors")
            .setLabelComponents(
              new LabelBuilder()
                .setLabel(t(client, lang, "commands.appearance.modals.color.label"))
                .setTextInputComponent(
                  new TextInputBuilder()
                    .setCustomId("NI_appearance:text:color_value")
                    .setPlaceholder("#FFFFFF")
                    .setStyle(TextInputStyle.Short)
                    .setRequired(true)
                    .setMinLength(4)
                    .setMaxLength(7),
                ),
            );

          await i.showModal(modal);

          await i
            .awaitModalSubmit({
              time: 5 * 60 * 1000,
              filter: (si: any) =>
                si.user.id === interaction.user.id && si.customId === "NI_appearance:modal:colors",
            })
            .then(async (int) => {
              await int.deferUpdate();
              const color_value = int.fields.getTextInputValue("NI_appearance:text:color_value");

              if (!isHexColor(color_value))
                return int.followUp({
                  content: t(client, lang, "commands.appearance.messages.error.invalid_color"),
                  flags: MessageFlagsBitField.Flags.Ephemeral,
                });

              data.solid[
                selected as "bg_color" | "first_component" | "second_component" | "third_component"
              ] = color_value;

              await mostUsedQueries[`set${opt}`](user, data);

              await int.editReply({
                embeds: [embedUpdate(opt, client, lang, data)],
                files: [await imageUpdate(opt, interaction.user, client, data)],
              });
            });
        } else if (i.customId === "NI_appearance:icons_select") {
          await i.deferUpdate();
          const selected = i.values[0];
          const [action, posX, posY] = selected.split("_");
          if (!("icons" in data)) return;
          if (action === "add") {
            const availableIcons = Object.keys(client.holder.assets.profileIcons).filter(
              (icon) =>
                !(data as ProfileCardDisplayOptions).icons.find(
                  (i) =>
                    i.name === icon && i.pos[0] === parseInt(posX) && i.pos[1] === parseInt(posY),
                ),
            ) as Array<keyof TranslationSchema["icons"]>;
            if (availableIcons.length === 0) {
              return i.followUp({
                content: t(client, lang, "commands.appearance.messages.error.no_available_icons"),
                flags: MessageFlagsBitField.Flags.Ephemeral,
              });
            }
            data.icons.push({
              name: availableIcons[0],
              pos: [parseInt(posX), parseInt(posY)],
            });
          } else if (action === "remove") {
            data.icons = data.icons.filter(
              (i) => !(i.pos[0] === parseInt(posX) && i.pos[1] === parseInt(posY)),
            );
          }
          await mostUsedQueries[`set${opt}`](user, data);
          profile_icons = updateIconsRow(data as ProfileCardDisplayOptions, client, lang);
          await i.editReply({
            embeds: [embedUpdate(opt, client, lang, data)],
            components: [row, color, main_buttons, profile_buttons, profile_icons],
            files: [await imageUpdate(opt, interaction.user, client, data)],
          });
        }
      }
    });
  },
} as SlashCommand;

function embedUpdate(
  opt: "rank" | "profile" | "level_up",
  client: Client,
  lang: string,
  data: RankCardDisplayOptions | ProfileCardDisplayOptions | LevelCardDisplayOptions,
) {
  return client.holder.utils.fastEmbed({
    title: t(client, lang, `commands.appearance.embeds.${opt}.title`),
    description: t(client, lang, `commands.appearance.embeds.${opt}.description`),
    fields: [
      {
        name: t(client, lang, "commands.appearance.embeds.fields.bg_color.name"),
        value: t(
          client,
          lang,
          "commands.appearance.embeds.fields.bg_color.value",
          data.solid.bg_color,
        ),
        inline: true,
      },
      {
        name: t(client, lang, "commands.appearance.embeds.fields.first_component.name"),
        value: t(
          client,
          lang,
          "commands.appearance.embeds.fields.first_component.value",
          data.solid.first_component,
        ),
        inline: true,
      },
      {
        name: t(client, lang, "commands.appearance.embeds.fields.second_component.name"),
        value: t(
          client,
          lang,
          "commands.appearance.embeds.fields.second_component.value",
          data.solid.second_component,
        ),
        inline: true,
      },
      {
        name: t(client, lang, "commands.appearance.embeds.fields.third_component.name"),
        value: t(
          client,
          lang,
          "commands.appearance.embeds.fields.third_component.value",
          data.solid.third_component,
        ),
        inline: true,
      },
    ],
    image: {
      url: `attachment://${opt}.png`,
    },
  });
}

async function imageUpdate(
  opt: "rank" | "profile" | "level_up",
  user: import("discord.js").User,
  client: Client,
  displayOptions: RankCardDisplayOptions | ProfileCardDisplayOptions | LevelCardDisplayOptions,
) {
  let attachment: AttachmentBuilder;
  switch (opt) {
    case "rank":
      const rank = new RankCard({
        avatar: user.displayAvatarURL({ size: 512, extension: "png" }),
        username: user.username,
        globalName: user.globalName || user.username,
        data: {
          level: 999,
          total_xp: 999999,
          xp: 2500000,
          message_count: 99999,
          voice_time: 99999999,
          rank: 1,
        },
        displayOptions: displayOptions as RankCardDisplayOptions,
      }, client);
      attachment = new AttachmentBuilder(await rank.render(), { name: "rank.png" });
      break;
    case "profile":
      const profile = new ProfileCard({
        avatar: user.displayAvatarURL({ size: 512, extension: "png" }),
        username: user.username,
        globalName: user.globalName || user.username,
        data: {
          level: 999,
          total_xp: 999999,
          xp: 2500000,
          message_count: 99999,
          voice_time: 99999999,
          rank: 1,
        },
        displayOptions: displayOptions as ProfileCardDisplayOptions,
      }, client);
      attachment = new AttachmentBuilder(await profile.render(), { name: "profile.png" });
      break;
    case "level_up":
      const level = new LevelCard({
        avatar: user.displayAvatarURL({ size: 512, extension: "png" }),
        data: {
          level: 999,
        },
        displayOptions: displayOptions as LevelCardDisplayOptions,
      });
      attachment = new AttachmentBuilder(await level.render(), { name: "level_up.png" });
      break;
  }
  return attachment;
}

function updateIconsRow(data: ProfileCardDisplayOptions, client: Client, lang: string) {
  return client.holder.utils.fastRow([
    client.holder.utils.fastStringSelect({
      custom_id: "NI_appearance:icons_select",
      placeholder: t(client, lang, "commands.appearance.select_menus.icons.placeholder"),
      type: 3,
      options: [
        ...[
          [0, 0],
          [0, 1],
          [0, 2],
          [0, 3],
          [1, 0],
          [1, 1],
          [1, 2],
          [1, 3],
          [2, 0],
          [2, 1],
          [2, 2],
          [2, 3],
        ].map((pos) => {
          const icon = data.icons.find((i) => i.pos[0] === pos[0] && i.pos[1] === pos[1]);
          if (icon) {
            return {
              label: t(client, lang, `icons.${icon.name}`),
              value: `remove_${pos[0]}_${pos[1]}`,
              description: t(
                client,
                lang,
                "commands.appearance.select_menus.icons.options.remove.description",
              ),
            };
          } else {
            return {
              label: t(client, lang, `commands.appearance.select_menus.icons.options.empty.label`),
              value: `add_${pos[0]}_${pos[1]}`,
              description: t(
                client,
                lang,
                "commands.appearance.select_menus.icons.options.add.description",
              ),
            };
          }
        }),
      ],
    }),
  ]);
}

const mostUsedQueries = {
  getrank: async (user: User) => {
    return (await user.get("custom.rank")) as RankCardDisplayOptions;
  },
  getprofile: async (user: User) => {
    return (await user.get("custom.profile")) as ProfileCardDisplayOptions;
  },
  getlevel_up: async (user: User) => {
    return (await user.get("custom.level_up")) as LevelCardDisplayOptions;
  },
  setrank: async (user: User, data: Partial<RankCardDisplayOptions>) => {
    await user.set("custom.rank.mode", data.mode || false);
    await user.set("custom.rank.solid", data.solid || defaultDisplayOptions.rank.solid);
    await user.set("custom.rank.url", data.url || null);
    await user.set("custom.rank.color", data.color || null);
    return;
  },
  setprofile: async (user: User, data: Partial<ProfileCardDisplayOptions>) => {
    await user.set("custom.profile.mode", data.mode || false);
    await user.set("custom.profile.solid", data.solid || defaultDisplayOptions.profile.solid);
    await user.set("custom.profile.url", data.url || null);
    await user.set("custom.profile.color", data.color || null);
    await user.set("custom.profile.bio", data.bio || "");
    await user.set("custom.profile.icons", data.icons || []);
    await user.set(
      "custom.profile.icons_padding",
      data.icons_padding || defaultDisplayOptions.profile.icons_padding,
    );
    return;
  },
  setlevel_up: async (user: User, data: Partial<LevelCardDisplayOptions>) => {
    await user.set("custom.level_up.mode", data.mode || false);
    await user.set("custom.level_up.solid", data.solid || defaultDisplayOptions.level_up.solid);
    await user.set("custom.level_up.url", data.url || null);
    return;
  },
};
