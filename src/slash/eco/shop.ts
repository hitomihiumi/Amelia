import { SlashCommand } from "../../types/helpers";
import {
  Client,
  CommandInteraction,
  EmbedBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  MessageActionRowComponentBuilder,
  ButtonBuilder,
  ButtonStyle,
  MessageFlagsBitField,
} from "discord.js";
import { defaultPermissions, Guild, User } from "../../helpers";
import { t } from "../../i18n/helpers";

const ITEMS_PER_PAGE = 10;

module.exports = {
  name: "shop",
  description: "Browse and purchase roles from the shop.",
  cooldown: 5,
  locale: {
    ru: "Просмотр и покупка ролей в магазине.",
    uk: "Перегляд та покупка ролей у магазині.",
  },
  options: [],
  permissions: {
    bot: defaultPermissions,
  },
  run: async (client: Client, interaction: CommandInteraction) => {
    if (!interaction.guild || !interaction.isChatInputCommand()) return;

    await interaction.deferReply();

    const guild = new Guild(client, interaction.guild);
    const user = new User(client, interaction.user, interaction.guild);
    const lang = await guild.get("settings.language");

    // Get shop settings
    const shopRoles = await guild.get("economy.shop.roles");
    const currency = await guild.get("economy.currency");
    const currencyEmoji = currency.emoji || "💰";

    if (!shopRoles || shopRoles.length === 0) {
      return interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setColor(client.holder.colors.error)
            .setDescription(t(client, lang, "commands.shop.messages.empty")),
        ],
      });
    }

    let currentPage = 0;
    const totalPages = Math.ceil(shopRoles.length / ITEMS_PER_PAGE);

    // Build initial embed and components
    const { embed, components } = buildShopView(
      client,
      lang,
      shopRoles,
      currentPage,
      totalPages,
      currencyEmoji,
      interaction.guild,
    );

    const msg = await interaction.editReply({ embeds: [embed], components });

    const filter = (i: any) => i.user.id === interaction.user.id;
    const collector = msg.createMessageComponentCollector({ filter, time: 300000 });

    collector.on("collect", async (i) => {
      if (i.isButton()) {
        if (i.customId === "NI_shop:prev") {
          currentPage = Math.max(0, currentPage - 1);
        } else if (i.customId === "NI_shop:next") {
          currentPage = Math.min(totalPages - 1, currentPage + 1);
        }

        const { embed, components } = buildShopView(
          client,
          lang,
          shopRoles,
          currentPage,
          totalPages,
          currencyEmoji,
          interaction.guild!,
        );
        await i.update({ embeds: [embed], components });
      } else if (i.isStringSelectMenu() && i.customId === "NI_shop:buy") {
        const roleId = i.values[0];
        const shopRole = shopRoles.find((r: any) => r.role === roleId);

        if (!shopRole) {
          await i.reply({
            content: t(client, lang, "commands.shop.messages.role_not_found"),
            flags: MessageFlagsBitField.Flags.Ephemeral,
          });
          return;
        }

        // Check if user already has the role
        const member = interaction.guild!.members.cache.get(interaction.user.id);
        if (member?.roles.cache.has(roleId)) {
          await i.reply({
            content: t(client, lang, "commands.shop.messages.already_owned"),
            flags: MessageFlagsBitField.Flags.Ephemeral,
          });
          return;
        }

        // Calculate price with discount
        const now = Date.now();
        let finalPrice = shopRole.price;
        const hasDiscount = shopRole.discount && shopRole.discount.amount > 0;
        const isDiscountActive =
          hasDiscount &&
          (!shopRole.discount.starts_at || shopRole.discount.starts_at <= now) &&
          (!shopRole.discount.expires_at || shopRole.discount.expires_at > now);

        if (isDiscountActive) {
          finalPrice = Math.floor(shopRole.price * (1 - shopRole.discount.amount / 100));
        }

        // Check user balance
        const balance = await user.get("economy.balance.wallet");
        if (balance < finalPrice) {
          await i.reply({
            content: t(
              client,
              lang,
              "commands.shop.messages.insufficient_funds",
              `${currencyEmoji} ${finalPrice.toLocaleString()}`,
              `${currencyEmoji} ${balance.toLocaleString()}`,
            ),
            flags: MessageFlagsBitField.Flags.Ephemeral,
          });
          return;
        }

        // Process purchase
        try {
          // Deduct balance
          await user.set("economy.balance.wallet", balance - finalPrice);

          // Add role to user
          const role = interaction.guild!.roles.cache.get(roleId);
          if (role) {
            await member?.roles.add(role);
          }

          // Success message
          const successEmbed = new EmbedBuilder()
            .setColor(client.holder.colors.success)
            .setTitle(t(client, lang, "commands.shop.embeds.purchase.title"))
            .setDescription(
              t(
                client,
                lang,
                "commands.shop.messages.purchase_success",
                `<@&${roleId}>`,
                `${currencyEmoji} ${finalPrice.toLocaleString()}`,
              ),
            )
            .addFields({
              name: t(client, lang, "commands.shop.embeds.purchase.fields.new_balance"),
              value: `${currencyEmoji} ${(balance - finalPrice).toLocaleString()}`,
              inline: true,
            });

          await i.reply({
            embeds: [successEmbed],
            flags: MessageFlagsBitField.Flags.Ephemeral,
          });
        } catch (error) {
          console.error("Shop purchase error:", error);
          // Refund if role assignment failed
          await user.set("economy.balance.wallet", balance);
          await i.reply({
            content: t(client, lang, "commands.shop.messages.purchase_error"),
            flags: MessageFlagsBitField.Flags.Ephemeral,
          });
        }
      }
    });

    collector.on("end", async () => {
      try {
        const { embed } = buildShopView(
          client,
          lang,
          shopRoles,
          currentPage,
          totalPages,
          currencyEmoji,
          interaction.guild!,
        );
        await interaction.editReply({ embeds: [embed], components: [] });
      } catch (error) {
        // Message might be deleted
      }
    });
  },
} as SlashCommand;

interface ShopRole {
  role: string;
  price: number;
  discount: {
    amount: number;
    starts_at: number | null;
    expires_at: number | null;
  };
}

function buildShopView(
  client: Client,
  lang: string,
  shopRoles: ShopRole[],
  currentPage: number,
  totalPages: number,
  currencyEmoji: string,
  guild: import("discord.js").Guild,
): { embed: EmbedBuilder; components: ActionRowBuilder<MessageActionRowComponentBuilder>[] } {
  const startIndex = currentPage * ITEMS_PER_PAGE;
  const endIndex = Math.min(startIndex + ITEMS_PER_PAGE, shopRoles.length);
  const pageRoles = shopRoles.slice(startIndex, endIndex);
  const now = Date.now();

  // Build embed
  const embed = new EmbedBuilder()
    .setColor(client.holder.colors.default)
    .setTitle(t(client, lang, "commands.shop.embeds.main.title"))
    .setDescription(t(client, lang, "commands.shop.embeds.main.description"));

  // Add roles to embed
  const roleLines: string[] = [];
  for (const shopRole of pageRoles) {
    const role = guild.roles.cache.get(shopRole.role);
    const roleName = role ? `<@&${shopRole.role}>` : `Unknown Role (${shopRole.role})`;

    const hasDiscount = shopRole.discount && shopRole.discount.amount > 0;
    const isDiscountActive =
      hasDiscount &&
      (!shopRole.discount.starts_at || shopRole.discount.starts_at <= now) &&
      (!shopRole.discount.expires_at || shopRole.discount.expires_at > now);

    let priceStr: string;
    if (isDiscountActive) {
      const discountedPrice = Math.floor(shopRole.price * (1 - shopRole.discount.amount / 100));
      priceStr = `~~${currencyEmoji} ${shopRole.price.toLocaleString()}~~ **${currencyEmoji} ${discountedPrice.toLocaleString()}** (-${shopRole.discount.amount}%)`;
    } else {
      priceStr = `${currencyEmoji} ${shopRole.price.toLocaleString()}`;
    }

    roleLines.push(`${roleName}\n${priceStr}`);
  }

  embed.addFields({
    name: t(client, lang, "commands.shop.embeds.main.fields.roles"),
    value: roleLines.join("\n\n") || t(client, lang, "commands.shop.messages.empty"),
  });

  if (totalPages > 1) {
    embed.setFooter({
      text: t(
        client,
        lang,
        "commands.shop.embeds.main.footer",
        (currentPage + 1).toString(),
        totalPages.toString(),
      ),
    });
  }

  // Build components
  const components: ActionRowBuilder<MessageActionRowComponentBuilder>[] = [];

  // Role select menu
  if (pageRoles.length > 0) {
    const selectOptions = pageRoles.map((shopRole) => {
      const role = guild.roles.cache.get(shopRole.role);
      const roleName = role?.name || `Unknown (${shopRole.role})`;

      const hasDiscount = shopRole.discount && shopRole.discount.amount > 0;
      const isDiscountActive =
        hasDiscount &&
        (!shopRole.discount.starts_at || shopRole.discount.starts_at <= now) &&
        (!shopRole.discount.expires_at || shopRole.discount.expires_at > now);

      let priceDescription: string;
      if (isDiscountActive) {
        const discountedPrice = Math.floor(shopRole.price * (1 - shopRole.discount.amount / 100));
        priceDescription = `${discountedPrice.toLocaleString()} (was ${shopRole.price.toLocaleString()})`;
      } else {
        priceDescription = shopRole.price.toLocaleString();
      }

      return new StringSelectMenuOptionBuilder()
        .setLabel(roleName.substring(0, 100))
        .setDescription(priceDescription.substring(0, 100))
        .setValue(shopRole.role);
    });

    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId("NI_shop:buy")
      .setPlaceholder(t(client, lang, "commands.shop.select_menus.buy.placeholder"))
      .setOptions(selectOptions);

    components.push(
      new ActionRowBuilder<MessageActionRowComponentBuilder>().setComponents(selectMenu),
    );
  }

  // Pagination buttons
  if (totalPages > 1) {
    const buttonRow = new ActionRowBuilder<MessageActionRowComponentBuilder>().setComponents(
      new ButtonBuilder()
        .setCustomId("NI_shop:prev")
        .setLabel("◀")
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(currentPage === 0),
      new ButtonBuilder()
        .setCustomId("NI_shop:next")
        .setLabel("▶")
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(currentPage >= totalPages - 1),
    );
    components.push(buttonRow);
  }

  return { embed, components };
}
