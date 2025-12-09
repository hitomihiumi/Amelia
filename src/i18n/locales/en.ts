import { TranslationSchema } from "../../types/i18n/TranslationSchema";

/**
 * English language package (base/fallback)
 */
export const en: TranslationSchema = {
  common: {
    error: {
      title: "Error",
      unknown: "An unknown error occurred",
      permission_denied: "You don't have permission to do this",
      cooldown: "Please wait {0} seconds before using **{1}** again",
    },
    success: {
      title: "Success",
    },
    info: {
      title: "Information",
    },
  },

  commands: {
    permissions: {
      embeds: {
        base: {
          title: "Permission Management",
          description: "Configure command permissions for this server",
        },
        command: {
          title: "Permissions for {0}",
          description: "**Description:** {1}",
        },
        role: {
          title: "Role Configuration: {0}",
          description: "Configure role: {1}",
        },
      },
      buttons: {
        back: "Back",
        submit: "Submit",
        delete: "Delete",
        allow: "Allow",
        deny: "Deny",
      },
      select_menus: {
        commands: {
          placeholder: "Select a command",
          description: "Custom permissions configured",
        },
        permissions: {
          placeholder: "Select permission level",
        },
        roles: {
          placeholder: "Select a role",
          allow: "Allowed",
          deny: "Denied",
          add: "Add Role",
        },
        role: {
          placeholder: "Select a role to configure",
        },
      },
      modals: {
        jump: {
          title: "Jump to Page",
          label: "Page number",
        },
      },
      messages: {
        role: {
          error: "Error configuring role",
        },
      },
    },
    jtc: {
      embeds: {
        title: "Join to Create Settings",
        description: "Configure the Join to Create feature for your server",
        fields: {
          status: {
            status: "Status",
            enabled: "✅ Enabled",
            disabled: "❌ Disabled",
          },
          empty: "Empty",
          category: "Category",
          channel: "Channel",
          default_name: "Default Name",
        },
      },
      buttons: {
        enable: "Enable",
        disable: "Disable",
        setup: "Auto-Setup",
        set_channel: "Set Channel",
        change_name: "Change Name",
      },
      select_menus: {
        channel: {
          placeholder: "Select a channel",
        },
      },
      modals: {
        change_name: {
          title: "Change Default Name",
          label: "Default channel name",
          placeholder: "e.g. {username}'s Channel",
        },
      },
      messages: {
        channel: {
          set: "Choose channel to set Join to Create",
          success: "Join to Create channel set to {0}",
          error: "Error setting Join to Create channel",
        },
        setup: {
          success: "Join to Create has been set up successfully",
          error: "Error during Join to Create setup",
        },
      },
    },
    modal: {
      embeds: {
        base: {
          title: "Custom Modal Management",
          description: "Create and manage custom modals for your server",
        },
        edit: {
          title: "Edit Modal",
          description: "Configure your custom modal",
          field: {
            name: "Modal Title",
            value: "**Title:** {0}",
          },
        },
        edit_field: {
          title: "Edit Field",
          description: "Configure modal field",
          fields: {
            name: {
              name: "Field Label",
              value: "**Label:** {0}",
            },
            placeholder: {
              name: "Placeholder",
              value: "**Placeholder:** {0}",
            },
            style: {
              name: "Style",
              value: "**Style:** {0}",
            },
            sizes: {
              name: "Size Limits",
              value: "**Min:** {0} | **Max:** {1}",
            },
            required: {
              name: "Required",
              value: "**Required:** {0}",
            },
          },
        },
        search: {
          title: "Search Modals",
          description: "Search for modals by name",
          field: {
            name: "Search Query",
            value: "**Query:** {0}",
          },
        },
      },
      buttons: {
        edit_modal: {
          title: "Edit Title",
          preview: "Preview",
          back: "Back",
          delete: "Delete",
          save: "Save",
        },
        edit_field: {
          label: "Edit Label",
          placeholder: "Edit Placeholder",
          style: "Change Style",
          sizes: "Edit Size",
          required: "Toggle Required",
          delete: "Delete Field",
        },
      },
      select_menus: {
        base: {
          placeholder: "What would you like to do?",
          options: {
            create: {
              label: "Create Modal",
              description: "Create a new custom modal",
            },
            edit: {
              label: "Edit Modal",
              description: "Edit an existing modal",
            },
          },
        },
        select: {
          placeholder: "Select a modal to edit",
        },
        select_field: {
          placeholder: "Select a field to edit",
          options: {
            main: {
              label: "Main Settings",
              description: "Edit modal title and basic settings",
            },
            add: {
              label: "Add Field",
              description: "Add a new field to this modal",
            },
          },
        },
      },
      modals: {
        jump: {
          title: "Jump to Page",
          label: "Enter page number",
        },
        search: {
          title: "Search Modals",
          label: "Enter search query",
        },
        edit: {
          title: "Edit Modal Title",
          label: "Modal title",
        },
        edit_field: {
          label: {
            title: "Edit Field Label",
            label: "Field label",
          },
          placeholder: {
            title: "Edit Placeholder",
            label: "Placeholder text",
          },
          sizes: {
            title: "Edit Field Size",
            min: "Minimum length",
            max: "Maximum length",
          },
        },
      },
    },
    rank: {
      error: "An error occurred while generating the rank card.",
      success: "{0}'s rank card:",
    },
    profile: {
      error: "An error occurred while generating the profile card.",
      success: "{0}'s profile card:",
    },
    balance: {
      error: "An error occurred while generating the balance card.",
      success: "{0}'s balance card:",
    },
    work: {
      messages: {
        disabled: "❌ The work command is currently disabled on this server.",
        cooldown: "⏰ You're too tired to work! Try again in **{0}**.",
        success: "{0} and earned {1}!",
      },
    },
    timely: {
      messages: {
        disabled: "❌ The timely reward is currently disabled on this server.",
        cooldown: "⏰ You've already claimed your hourly reward! Try again in **{0}**.",
        success: "💵 You claimed your hourly reward of {0}!",
      },
    },
    daily: {
      messages: {
        disabled: "❌ The daily reward is currently disabled on this server.",
        cooldown: "⏰ You've already claimed your daily reward! Try again in **{0}**.",
        success: "💵 You claimed your daily reward of {0}!",
      },
    },
    weekly: {
      messages: {
        disabled: "❌ The weekly reward is currently disabled on this server.",
        cooldown: "⏰ You've already claimed your weekly reward! Try again in **{0}**.",
        success: "💵 You claimed your weekly reward of {0}!",
      },
    },
    rob: {
      messages: {
        disabled: "❌ The rob command is currently disabled on this server.",
        cooldown: "⏰ You need to lay low for a while! Try again in **{0}**.",
        self: "❌ You can't rob yourself!",
        bot: "❌ You can't rob a bot!",
        no_money: "❌ {0} doesn't have any money to steal!",
        success: "🎭 You successfully robbed {0} and got away with {1}!",
        fail: "🚔 You got caught trying to rob {0} and paid a fine of {1}!",
      },
    },
    bank: {
      messages: {
        invalid_amount: "❌ Please enter a valid amount.",
        insufficient_wallet: "❌ You don't have enough money in your wallet! You only have {0}.",
        insufficient_bank: "❌ You don't have enough money in your bank! You only have {0}.",
        no_money_wallet: "❌ You don't have any money in your wallet to deposit.",
        no_money_bank: "❌ You don't have any money in your bank to withdraw.",
        deposit_success: "🏦 Successfully deposited {0} into your bank account!",
        withdraw_success: "💵 Successfully withdrew {0} from your bank account!",
      },
      fields: {
        wallet: "💳 Wallet",
        bank: "🏦 Bank",
      },
    },
    shop: {
      embeds: {
        main: {
          title: "🛒 Role Shop",
          description:
            "Browse and purchase roles using your currency. Select a role below to buy it.",
          fields: {
            roles: "Available Roles",
          },
          footer: "Page {0} of {1}",
        },
        purchase: {
          title: "✅ Purchase Successful!",
          fields: {
            new_balance: "New Balance",
          },
        },
      },
      messages: {
        empty: "🏪 The shop is empty! No roles are available for purchase.",
        role_not_found: "❌ This role is no longer available in the shop.",
        already_owned: "❌ You already own this role!",
        insufficient_funds: "❌ You don't have enough money! Price: {0}, Your balance: {1}",
        purchase_success: "🎉 You have successfully purchased {0} for {1}!",
        purchase_error:
          "❌ An error occurred while processing your purchase. Your balance has been refunded.",
      },
      select_menus: {
        buy: {
          placeholder: "Select a role to purchase",
        },
      },
    },
    appearance: {
      embeds: {
        base: {
          title: "Appearance Settings",
          description: "Choose which appearance settings to configure",
        },
        rank: {
          title: "Rank Card",
          description: "Configure the appearance of your rank card",
        },
        level_up: {
          title: "Level Up Card",
          description: "Configure the appearance of your level up card",
        },
        profile: {
          title: "Profile Card",
          description: "Configure the appearance of your profile card",
        },
        fields: {
          bg_color: {
            name: "Background Color",
            value: "{0}",
          },
          first_component: {
            name: "First Component",
            value: "{0}",
          },
          second_component: {
            name: "Second Component",
            value: "{0}",
          },
          third_component: {
            name: "Third Component",
            value: "{0}",
          },
        },
      },
      select_menus: {
        base: {
          placeholder: "Select the card you want to customize",
          options: {
            rank: "Rank Card",
            level_up: "Level Up Card",
            profile: "Profile Card",
          },
        },
        color: {
          placeholder: "Select the component you want to customize",
          options: {
            bg_color: "Background Color",
            first_component: "First Component",
            second_component: "Second Component",
            third_component: "Third Component",
          },
        },
        icons: {
          placeholder: "Select an icon to manage",
          options: {
            empty: {
              label: "No Icon Configured",
            },
            remove: {
              description: "Remove the current icon",
            },
            add: {
              description: "Add a new icon",
            },
          },
        },
      },
      buttons: {
        mode: "Toggle Mode",
        url: "Set BG URL",
        reset: "Reset",
        icons_padding_x: "Padding X",
        icons_padding_y: "Padding Y",
        bio: "Set Bio",
      },
      modals: {
        color: {
          title: "Set Color",
          label: "Enter a HEX color code",
        },
        url: {
          title: "Set Background URL",
          label: "Enter a valid image URL",
        },
        bio: {
          title: "Set Bio",
          label: "Enter your profile bio",
        },
        icons_padding: {
          title: "Set Icons Padding",
          x: {
            label: "Set padding for X in pixels",
          },
          y: {
            label: "Set padding for Y in pixels",
          },
        },
      },
      messages: {
        error: {
          invalid_color: "Please provide a valid HEX color code.",
          invalid_url: "Please provide a valid image URL.",
          invalid_padding: "Please provide a valid number for padding.",
          no_available_icons: "You have no available icons to add.",
        },
      },
    },
    language: {
      embeds: {
        base: {
          title: "Language Settings",
          description: "Select the language for this server",
        },
      },
      select_menus: {
        placeholder: "Select a language",
        options: {
          en: {
            description: "Set language to English",
          },
          ru: {
            description: "Set language to Russian",
          },
        },
      },
      messages: {
        success: "Server language set to **{0}**",
      },
    },
    levels: {
      embeds: {
        base: {
          title: "Leveling System Settings",
          description:
            "Configure the leveling system for your server. Enable or disable the system, set ignored channels and roles, and manage level-based role rewards.",
          fields: {
            status: {
              name: "Status",
              enabled: "✅ Enabled",
              disabled: "❌ Disabled",
            },
            ignored_channels: {
              name: "Ignored Channels",
              none: "None",
            },
            ignored_roles: {
              name: "Ignored Roles",
              none: "None",
            },
            level_roles: {
              name: "Level Roles",
              none: "None",
              level_format: "Level {0}: {1}",
            },
          },
        },
        ignore: {
          title: "Ignored Channels and Roles",
          description:
            "Configure channels and roles that the leveling system will ignore. Users will not earn experience points in the specified channels or if they have the specified roles. Maximum of 25 channels and 25 roles can be ignored.",
          fields: {
            ignored_channels: {
              name: "Ignored Channels",
              none: "None",
            },
            ignored_roles: {
              name: "Ignored Roles",
              none: "None",
            },
          },
        },
        level_roles: {
          title: "Level Role Rewards",
          description:
            "Manage role rewards that users will receive upon reaching specific levels. You can assign roles to levels, and users will be granted these roles when they reach the corresponding level.",
          fields: {
            current_roles: {
              name: "Current Level Roles",
              none: "No level roles configured",
              level_format: "**Level {0}:** {1}",
            },
          },
        },
      },
      buttons: {
        enable: "Enable Leveling System",
        disable: "Disable Leveling System",
        back: "← Back",
        add_level_role: "Add Level Role",
        remove_level_role: "Remove Level Role",
        cancel: "Cancel",
      },
      select_menus: {
        main: {
          placeholder: "Select a settings category",
          options: {
            ignore: {
              label: "Ignored Channels and Roles",
              description: "Configure ignored channels and roles",
            },
            level_roles: {
              label: "Level Role Rewards",
              description: "Manage level-based role rewards",
            },
          },
        },
        ignore_channel: {
          placeholder: "Choose channel(s) to ignore",
        },
        ignore_role: {
          placeholder: "Choose role(s) to ignore",
        },
        level_role: {
          placeholder: "Choose a level role to manage",
        },
        select_role: {
          placeholder: "Select a role for this level",
        },
      },
      modals: {
        add_level_role: {
          title: "Add Level Role",
          level: {
            label: "Level",
            placeholder: "Enter level number (e.g., 5)",
          },
        },
        remove_level_role: {
          title: "Remove Level Role",
          level: {
            label: "Level",
            placeholder: "Enter level number to remove",
          },
        },
      },
      messages: {
        max_channels: "You can only ignore up to 25 channels.",
        max_roles: "You can only ignore up to 25 roles.",
        invalid_level: "Invalid level number. Please enter a number between 1 and 999.",
        role_not_found: "Role not found. Please check the role ID.",
        level_role_not_found: "Level role not found.",
        select_role_for_level: "Select a role for level **{0}**:",
        role_added: "Role {1} has been added for level **{0}**!",
        cancelled: "Action cancelled.",
      },
    },

    economy: {
      embeds: {
        base: {
          title: "Economy Settings",
          description:
            "Configure the economy system for your server. Manage currency, shop, and income settings.",
          fields: {
            currency: {
              name: "Currency",
              value: "{0}",
              default: "{0} (Default)",
            },
            shop_roles: {
              name: "Shop Roles",
              none: "No roles configured",
              format: "{0} - {1} {2}",
            },
          },
        },
        currency: {
          title: "Currency Settings",
          description: "Configure the currency emoji used throughout the economy system.",
          fields: {
            current: {
              name: "Current Currency",
              default: "{0} (Default)",
            },
          },
        },
        currency_emoji: {
          title: "Select Currency Emoji",
          description: "Choose an emoji from your server to use as currency.",
          footer: "Page {0} of {1}",
        },
        shop: {
          title: "Role Shop Settings",
          description:
            "Manage roles that users can purchase with their currency. Select a role to manage its discount.",
          fields: {
            roles: {
              name: "Available Roles",
              none: "No roles in shop",
              format: "{0} - **{1}** {2}",
              discount_format: "{0} - ~~{1}~~ **{2}** {3} ({4}% off)",
              discount_active: "🏷️ Active",
              discount_scheduled: "⏰ Scheduled: {0}",
              discount_expired: "❌ Expired",
            },
          },
        },
        income: {
          title: "Income Settings",
          description: "Select an income source to configure.",
        },
        work: {
          title: "Work Settings",
          description: "Configure the work command that allows users to earn currency.",
          fields: {
            status: {
              name: "Status",
              enabled: "✅ Enabled",
              disabled: "❌ Disabled",
            },
            cooldown: {
              name: "Cooldown",
              value: "{0} seconds",
            },
            reward: {
              name: "Reward Range",
              value: "{0} - {1}",
            },
          },
        },
        timely: {
          title: "Timely Settings",
          description: "Configure the timely command for regular rewards.",
          fields: {
            status: {
              name: "Status",
              enabled: "✅ Enabled",
              disabled: "❌ Disabled",
            },
            amount: {
              name: "Amount",
              value: "{0}",
            },
          },
        },
        daily: {
          title: "Daily Settings",
          description: "Configure the daily reward command.",
          fields: {
            status: {
              name: "Status",
              enabled: "✅ Enabled",
              disabled: "❌ Disabled",
            },
            amount: {
              name: "Amount",
              value: "{0}",
            },
          },
        },
        weekly: {
          title: "Weekly Settings",
          description: "Configure the weekly reward command.",
          fields: {
            status: {
              name: "Status",
              enabled: "✅ Enabled",
              disabled: "❌ Disabled",
            },
            amount: {
              name: "Amount",
              value: "{0}",
            },
          },
        },
        level_up: {
          title: "Level Up Reward",
          description: "Configure currency rewards for leveling up.",
          fields: {
            status: {
              name: "Status",
              enabled: "✅ Enabled",
              disabled: "❌ Disabled",
            },
            amount: {
              name: "Amount",
              value: "{0}",
            },
          },
        },
        bump: {
          title: "Bump Reward",
          description: "Configure currency rewards for bumping the server.",
          fields: {
            status: {
              name: "Status",
              enabled: "✅ Enabled",
              disabled: "❌ Disabled",
            },
            amount: {
              name: "Amount",
              value: "{0}",
            },
          },
        },
        rob: {
          title: "Rob Settings",
          description: "Configure the rob command that allows users to steal from others.",
          fields: {
            status: {
              name: "Status",
              enabled: "✅ Enabled",
              disabled: "❌ Disabled",
            },
            cooldown: {
              name: "Cooldown",
              value: "{0} seconds",
            },
            income: {
              name: "Success Income",
              value: "{0} - {1} ({2})",
            },
            punishment: {
              name: "Punishment",
              value: "{0} - {1} ({2})",
            },
            fail_chance: {
              name: "Fail Chance",
              value: "{0}%",
            },
          },
        },
      },
      buttons: {
        back: "← Back",
        toggle: "Toggle",
        enable: "Enable",
        disable: "Disable",
        edit: "Edit Settings",
        add_role: "Add Role",
        remove_role: "Remove Role",
        set_emoji: "Set Emoji",
        reset_emoji: "Reset Emoji",
        set_discount: "Set Discount",
        remove_discount: "Remove Discount",
      },
      select_menus: {
        main: {
          placeholder: "Select a settings category",
          options: {
            currency: {
              label: "Currency",
              description: "Configure currency emoji",
            },
            shop: {
              label: "Role Shop",
              description: "Manage purchasable roles",
            },
            income: {
              label: "Income Sources",
              description: "Configure income commands",
            },
          },
        },
        income: {
          placeholder: "Select an income source",
          options: {
            work: {
              label: "Work",
              description: "Configure work command",
            },
            timely: {
              label: "Timely",
              description: "Configure timely rewards",
            },
            daily: {
              label: "Daily",
              description: "Configure daily rewards",
            },
            weekly: {
              label: "Weekly",
              description: "Configure weekly rewards",
            },
            level_up: {
              label: "Level Up",
              description: "Configure level up rewards",
            },
            bump: {
              label: "Bump",
              description: "Configure bump rewards",
            },
            rob: {
              label: "Rob",
              description: "Configure rob command",
            },
          },
        },
        shop_role: {
          placeholder: "Select a role to add",
        },
        manage_role: {
          placeholder: "Select a role to manage",
        },
        emoji: {
          placeholder: "Select an emoji as currency",
        },
      },
      modals: {
        currency: {
          title: "Set Currency Emoji",
          emoji: {
            label: "Emoji",
            placeholder: "Enter an emoji (e.g., 💰 or custom emoji ID)",
          },
        },
        shop_role: {
          title: "Add Shop Role",
          price: {
            label: "Price",
            placeholder: "Enter the price for this role",
          },
        },
        discount: {
          title: "Set Discount",
          amount: {
            label: "Discount Percentage",
            placeholder: "Enter discount percentage (e.g., 20)",
          },
          starts_at: {
            label: "Start Date (optional)",
            placeholder: "YYYY-MM-DD HH:MM or leave empty",
          },
          expires_at: {
            label: "End Date (optional)",
            placeholder: "YYYY-MM-DD HH:MM or leave empty",
          },
        },
        remove_role: {
          title: "Remove Shop Role",
          role: {
            label: "Role ID",
            placeholder: "Enter the role ID to remove",
          },
        },
        work: {
          title: "Work Settings",
          cooldown: {
            label: "Cooldown (seconds)",
            placeholder: "Enter cooldown in seconds",
          },
          min: {
            label: "Minimum Reward",
            placeholder: "Enter minimum reward amount",
          },
          max: {
            label: "Maximum Reward",
            placeholder: "Enter maximum reward amount",
          },
        },
        simple_amount: {
          title: "Set Amount",
          amount: {
            label: "Amount",
            placeholder: "Enter the reward amount",
          },
        },
        rob: {
          title: "Rob Cooldown",
          cooldown: {
            label: "Cooldown (seconds)",
            placeholder: "Enter cooldown in seconds",
          },
        },
        rob_income: {
          title: "Rob Income Settings",
          min: {
            label: "Minimum",
            placeholder: "Enter minimum amount",
          },
          max: {
            label: "Maximum",
            placeholder: "Enter maximum amount",
          },
          type: {
            label: "Type (percentage/fixed)",
            placeholder: "Enter 'percentage' or 'fixed'",
          },
        },
        rob_punishment: {
          title: "Rob Punishment Settings",
          min: {
            label: "Minimum",
            placeholder: "Enter minimum amount",
          },
          max: {
            label: "Maximum",
            placeholder: "Enter maximum amount",
          },
          type: {
            label: "Type (percentage/fixed)",
            placeholder: "Enter 'percentage' or 'fixed'",
          },
          fail_chance: {
            label: "Fail Chance (%)",
            placeholder: "Enter fail chance percentage (0-100)",
          },
        },
      },
      messages: {
        invalid_emoji: "Invalid emoji. Please enter a valid emoji.",
        invalid_number: "Invalid number. Please enter a valid number.",
        invalid_type: "Invalid type. Please enter 'percentage' or 'fixed'.",
        invalid_date: "Invalid date format. Please use YYYY-MM-DD HH:MM format.",
        role_added: "Role {0} has been added to the shop for **{1}**!",
        role_removed: "Role has been removed from the shop.",
        role_not_found: "Role not found in the shop.",
        currency_set: "Currency has been set to {0}",
        currency_reset: "Currency has been reset to default.",
        settings_updated: "Settings have been updated.",
        discount_set: "Discount of **{0}%** has been set for {1}!",
        discount_removed: "Discount has been removed from the role.",
        select_role_to_manage: "Select a role to manage its discount.",
      },
    },

    games: {
      embeds: {
        base: {
          title: "Find Team Settings",
          description: "Configure the teammate finder system for your server.",
          fields: {
            status: {
              name: "Status",
              enabled: "✅ Enabled",
              disabled: "❌ Disabled",
            },
            channel: {
              name: "Select Menu Channel",
              value: "<#{0}>",
              none: "Not set",
            },
            send_channel: {
              name: "Results Channel",
              value: "<#{0}>",
              none: "Not set",
            },
            games_count: {
              name: "Games",
              value: "{0} games configured",
            },
          },
        },
        embed_settings: {
          title: "Embed Settings",
          description: "Configure the embed that will be sent with the select menu.",
          fields: {
            title: {
              name: "Title",
              value: "{0}",
              none: "Not set",
            },
            description: {
              name: "Description",
              value: "{0}",
              none: "Not set",
            },
            color: {
              name: "Color",
              value: "{0}",
              none: "Default",
            },
            thumbnail: {
              name: "Thumbnail",
              value: "[Link]({0})",
              none: "Not set",
            },
            image: {
              name: "Image",
              value: "[Link]({0})",
              none: "Not set",
            },
            footer: {
              name: "Footer",
              value: "{0}",
              none: "Not set",
            },
          },
        },
        games_list: {
          title: "Games List",
          description: "Manage games available for teammate search.",
          fields: {
            games: {
              name: "Configured Games",
              none: "No games configured",
              format: "{0} {1}",
            },
          },
        },
        game_edit: {
          title: "Edit Game: {0}",
          description: "Configure game settings and modal fields.",
          fields: {
            name: {
              name: "Name",
              value: "{0}",
            },
            emoji: {
              name: "Emoji",
              value: "{0}",
              none: "Not set",
            },
            role: {
              name: "Ping Role",
              value: "<@&{0}>",
              none: "Not set",
            },
            modal_title: {
              name: "Modal Title",
              value: "{0}",
            },
            fields_count: {
              name: "Fields",
              value: "{0} fields configured",
            },
          },
        },
        game_field_edit: {
          title: "Edit Field",
          description: "Configure modal field settings.",
          fields: {
            name: {
              name: "Label",
              value: "{0}",
            },
            placeholder: {
              name: "Placeholder",
              value: "{0}",
            },
            style: {
              name: "Style",
              value: "{0}",
            },
            sizes: {
              name: "Character Limits",
              value: "Min: {0}, Max: {1}",
            },
            required: {
              name: "Required",
              value: "{0}",
            },
          },
        },
        preview: {
          title: "Preview",
          description: "This is how the embed will look.",
          footer: "Preview - Not sent",
        },
        game_emoji: {
          title: "Select Emoji",
          description: "Select an emoji from this server to use for the game.",
          fields: {
            current: {
              name: "Current Emoji",
            },
            game: {
              name: "Game",
            },
          },
        },
        find_team_result: {
          default_title: "Looking for Teammates!",
          fields: {
            organizer: "Organizer",
            voice_channel: "Voice Channel",
          },
        },
      },
      buttons: {
        enable: "Enable",
        disable: "Disable",
        back: "Back",
        setup: "Auto-Setup",
        send_embed: "Send Embed",
        add_game: "Add Game",
        delete_game: "Delete Game",
        edit_name: "Edit Name",
        edit_emoji: "Edit Emoji",
        edit_role: "Edit Role",
        edit_modal_title: "Edit Modal Title",
        add_field: "Add Field",
        delete_field: "Delete Field",
        edit_label: "Edit Label",
        edit_placeholder: "Edit Placeholder",
        toggle_style: "Toggle Style",
        edit_sizes: "Edit Sizes",
        toggle_required: "Toggle Required",
        preview: "Preview",
        join: "Join Voice",
        reset_emoji: "Reset to Default",
      },
      select_menus: {
        main: {
          placeholder: "Select an option",
          options: {
            channels: {
              label: "Channel Settings",
              description: "Configure select menu and results channels",
            },
            embed: {
              label: "Embed Settings",
              description: "Configure the embed appearance",
            },
            games: {
              label: "Games",
              description: "Manage available games",
            },
          },
        },
        embed: {
          placeholder: "Select embed property to edit",
          options: {
            title: {
              label: "Title",
              description: "Edit embed title",
            },
            description: {
              label: "Description",
              description: "Edit embed description",
            },
            color: {
              label: "Color",
              description: "Edit embed color",
            },
            thumbnail: {
              label: "Thumbnail",
              description: "Edit thumbnail image URL",
            },
            image: {
              label: "Image",
              description: "Edit main image URL",
            },
            footer: {
              label: "Footer",
              description: "Edit embed footer text",
            },
            placeholder: {
              label: "Select Menu Placeholder",
              description: "Edit the select menu placeholder text",
            },
          },
        },
        games: {
          placeholder: "Select a game to edit",
          options: {
            add: {
              label: "Add New Game",
              description: "Add a new game to the list",
            },
          },
        },
        game_fields: {
          placeholder: "Select a field to edit",
          options: {
            main: {
              label: "Game Settings",
              description: "Return to game settings",
            },
            add: {
              label: "Add Field",
              description: "Add a new modal field",
            },
          },
        },
        select_channel: {
          placeholder: "Select the channel for the select menu",
        },
        send_channel: {
          placeholder: "Select the channel for results",
        },
        find_team: {
          placeholder: "Select a game",
          default_placeholder: "Choose a game to find teammates",
        },
        emoji: {
          placeholder: "Select an emoji",
        },
      },
      modals: {
        embed_title: {
          title: "Edit Embed Title",
          label: "Title",
          placeholder: "Enter embed title",
        },
        embed_description: {
          title: "Edit Embed Description",
          label: "Description",
          placeholder: "Enter embed description",
        },
        embed_color: {
          title: "Edit Embed Color",
          label: "Color (Hex)",
          placeholder: "#FF5733",
        },
        embed_thumbnail: {
          title: "Edit Thumbnail",
          label: "Image URL",
          placeholder: "https://example.com/image.png",
        },
        embed_image: {
          title: "Edit Image",
          label: "Image URL",
          placeholder: "https://example.com/image.png",
        },
        embed_footer: {
          title: "Edit Footer",
          label: "Footer Text",
          placeholder: "Enter footer text",
        },
        select_placeholder: {
          title: "Edit Placeholder",
          label: "Placeholder Text",
          placeholder: "Choose a game...",
        },
        game_name: {
          title: "Game Name",
          label: "Name",
          placeholder: "Enter game name",
        },
        game_emoji: {
          title: "Game Emoji",
          label: "Emoji",
          placeholder: "🎮 or custom emoji",
        },
        game_modal_title: {
          title: "Modal Title",
          label: "Title",
          placeholder: "Looking for teammates - {game}",
        },
        field_label: {
          title: "Field Label",
          label: "Label",
          placeholder: "Enter field label",
        },
        field_placeholder: {
          title: "Field Placeholder",
          label: "Placeholder",
          placeholder: "Enter placeholder text",
        },
        field_sizes: {
          title: "Field Character Limits",
          min_label: "Minimum Characters",
          max_label: "Maximum Characters",
          placeholder: "Enter a number",
        },
      },
      messages: {
        channel_set: "Select menu channel has been set to {0}",
        send_channel_set: "Results channel has been set to {0}",
        embed_sent: "Embed has been sent to {0}",
        embed_updated: "Embed setting has been updated.",
        game_added: "Game **{0}** has been added!",
        game_deleted: "Game has been deleted.",
        game_updated: "Game has been updated.",
        field_added: "Field has been added.",
        field_deleted: "Field has been deleted.",
        field_updated: "Field has been updated.",
        invalid_color: "Invalid color. Please use hex format (e.g., #FF5733).",
        invalid_url: "Invalid URL. Please enter a valid image URL.",
        invalid_emoji: "Invalid emoji. Please enter a valid emoji.",
        max_games: "You can only have up to 25 games.",
        max_fields: "You can only have up to 5 fields per modal.",
        setup_success: "Auto-setup complete! Channels have been configured.",
        setup_error: "Failed to create channels. Please check bot permissions.",
        not_in_voice: "You must be in a voice channel to use this feature.",
        emoji_set: "Emoji has been set to {0}",
        no_fields: "No fields configured for this game. Add a field first.",
      },
    },

    backup: {
      embeds: {
        main: {
          title: "Server Backup",
          description:
            "Create and restore server backups. Backups include roles (with permissions and members) and channels (with permissions).",
          fields: {
            backups_count: {
              name: "Available Backups",
              value: "{0} backups",
            },
            warning: {
              name: "⚠️ Important",
              value:
                "Backups **do not** include:\n• Messages in channels\n• Server avatar and banner\n• Server settings (name, verification level, etc.)\n• Emojis and stickers\n• Bots and integrations",
            },
          },
        },
        create: {
          title: "Create Backup",
          description: "Create a new backup of your server's roles and channels.",
          fields: {
            roles: {
              name: "Roles",
              value: "{0} roles will be saved",
            },
            channels: {
              name: "Channels",
              value: "{0} channels will be saved",
            },
            info: {
              name: "What will be saved",
              value:
                "• Role names, colors, permissions, and members\n• Channel names, types, positions, and permissions\n• Category structure",
            },
          },
        },
        list: {
          title: "Backup List",
          description: "Select a backup to view details or restore.",
          roles: "roles",
          channels: "channels",
          fields: {
            backups: {
              name: "Your Backups",
            },
            empty: {
              name: "No Backups",
              value: "You haven't created any backups yet. Create one to get started!",
            },
          },
        },
        view: {
          title: "Backup: {0}",
          no_description: "No description provided",
          fields: {
            created: {
              name: "Created",
            },
            created_by: {
              name: "Created By",
            },
            roles: {
              name: "Roles",
            },
            channels: {
              name: "Channels",
            },
          },
        },
        restore_confirm: {
          title: "⚠️ Confirm Restore",
          description: "Are you sure you want to restore this backup?",
          fields: {
            warning: {
              name: "Warning",
              value:
                "This action will **restore roles and channels** from the backup. Existing roles (with same name and color) and channels (with same name, type and category) will **not be duplicated**.",
            },
            actions: {
              name: "This will:",
              value:
                "• Create missing roles or use existing ones\n• Update permissions for existing roles\n• Assign roles to members who should have them\n• Create missing channels or skip existing ones\n• Restore channel permissions for new channels",
            },
          },
        },
        brutal_confirm: {
          title: "💀 BRUTAL RESTORE - DANGER",
          description:
            "**THIS IS A DESTRUCTIVE ACTION!**\n\nAre you absolutely sure you want to perform a brutal restore?",
          fields: {
            warning: {
              name: "⚠️ CRITICAL WARNING",
              value:
                "This action is **IRREVERSIBLE**! All your current roles and channels will be **PERMANENTLY DELETED**!",
            },
            deletion: {
              name: "🗑️ Will be deleted:",
              value:
                "• **ALL** roles (except @everyone and managed/bot roles)\n• **ALL** channels and categories (except the current channel)\n• All channel permissions\n• All role assignments",
            },
            actions: {
              name: "After deletion:",
              value:
                "• All roles from backup will be recreated\n• All channels from backup will be recreated\n• Roles will be assigned to members\n• Channel permissions will be restored",
            },
          },
        },
      },
      buttons: {
        create: "Create Backup",
        back: "Back",
        restore: "Restore",
        brutal_restore: "Brutal Restore",
        delete: "Delete",
        confirm_restore: "Yes, Restore",
        confirm_brutal: "DELETE ALL & RESTORE",
        cancel: "Cancel",
      },
      select_menus: {
        main: {
          placeholder: "Select an action",
          options: {
            create: {
              label: "Create Backup",
              description: "Create a new server backup",
            },
            list: {
              label: "View Backups",
              description: "View and manage existing backups",
            },
          },
        },
        list: {
          placeholder: "Select a backup to view",
        },
      },
      modals: {
        create: {
          title: "Create Backup",
          name: {
            label: "Backup Name",
            placeholder: "Enter a name for this backup",
          },
          description: {
            label: "Description (optional)",
            placeholder: "Enter a description for this backup",
          },
        },
      },
      messages: {
        created: "Backup **{0}** has been created successfully!",
        deleted: "Backup has been deleted.",
        restored: "Backup **{0}** has been restored successfully!",
        restore_failed:
          "Failed to restore backup. Some roles or channels may not have been created.",
        brutal_restored:
          "💀 Brutal restore of **{0}** completed! All previous roles and channels have been deleted and recreated from backup.",
        brutal_restore_failed:
          "💀 Brutal restore failed. Some roles or channels may have been deleted but not recreated. Check bot permissions.",
        not_found: "Backup not found.",
      },
    },

    embed: {
      embeds: {
        base: {
          title: "📋 Custom Embed Management",
          description: "Create and manage custom embeds for your server",
        },
        list: { title: "📋 Your Embeds", description: "Select an embed to edit" },
        edit: {
          title: "✏️ Edit Embed",
          description: "Configure your custom embed",
          fields: {
            name: "Name",
            title: "Title",
            color: "Color",
            fields_count: "Fields",
            timestamp: "Timestamp",
          },
        },
        fields: { title: "📋 Embed Fields", description: "Manage embed fields (max 25)" },
        field_edit: {
          title: "📝 Edit Field",
          description: "Configure this field",
          fields: { name: "Name", value: "Value", inline: "Inline" },
        },
        author: {
          title: "👤 Author Settings",
          description: "Configure embed author",
          fields: { name: "Name", icon: "Icon URL", url: "URL" },
        },
        footer: {
          title: "📎 Footer Settings",
          description: "Configure embed footer",
          fields: { text: "Text", icon: "Icon URL" },
        },
      },
      select_menus: {
        base: {
          placeholder: "What would you like to do?",
          options: { create: "Create Embed", edit: "Edit Embed" },
        },
        list: { placeholder: "Select an embed", no_embeds: "No embeds found" },
        edit: {
          placeholder: "What to edit?",
          options: {
            name: "Name",
            title: "Title",
            description: "Description",
            color: "Color",
            thumbnail: "Thumbnail",
            image: "Image",
            author: "Author",
            footer: "Footer",
            fields: "Fields",
            timestamp: "Timestamp",
          },
        },
        fields: { placeholder: "Select a field", add: "Add Field" },
      },
      buttons: {
        preview: "Preview",
        save: "Save",
        delete: "Delete",
        back: "Back",
        clear: "Clear",
        field_name: "Name",
        field_value: "Value",
        field_inline: "Inline",
        author_name: "Name",
        author_icon: "Icon",
        author_url: "URL",
        footer_text: "Text",
        footer_icon: "Icon",
      },
      modals: {
        title: { label: "Embed title" },
        description: { label: "Embed description" },
        color: { label: "Color (HEX)" },
        name: { label: "Embed name" },
        thumbnail: { label: "Thumbnail URL" },
        image: { label: "Image URL" },
        author_name: { label: "Author name" },
        author_icon: { label: "Author icon URL" },
        author_url: { label: "Author URL" },
        footer_text: { label: "Footer text" },
        footer_icon: { label: "Footer icon URL" },
        field_name: { label: "Field name" },
        field_value: { label: "Field value" },
        search: { title: "Search Embeds", label: "Search query" },
      },
      messages: { max_fields: "Maximum 25 fields per embed" },
    },
    button: {
      embeds: {
        base: {
          title: "🔘 Custom Button Management",
          description: "Create and manage custom buttons",
        },
        list: { title: "🔘 Your Buttons", description: "Select a button to edit" },
        edit: {
          title: "✏️ Edit Button",
          description: "Configure your custom button",
          fields: {
            name: "Name",
            label: "Label",
            style: "Style",
            emoji: "Emoji",
            url: "URL",
            disabled: "Disabled",
          },
        },
        emoji: { title: "😀 Select Emoji", description: "Choose an emoji for the button" },
      },
      select_menus: {
        base: {
          placeholder: "What would you like to do?",
          options: { create: "Create Button", edit: "Edit Button" },
        },
        list: { placeholder: "Select a button", no_buttons: "No buttons found" },
        style: { placeholder: "Select button style" },
        emoji: { placeholder: "Select an emoji" },
      },
      buttons: {
        name: "Name",
        label: "Label",
        emoji: "Emoji",
        url: "URL",
        disabled: "Disabled",
        preview: "Preview",
        save: "Save",
        delete: "Delete",
        back: "Back",
        clear_emoji: "Clear Emoji",
      },
      modals: {
        label: { label: "Button label" },
        url: { label: "Button URL" },
        name: { label: "Button name" },
        search: { title: "Search Buttons", label: "Search query" },
      },
      messages: { preview: "Button preview:" },
    },
    selectmenu: {
      embeds: {
        base: {
          title: "📋 Custom Select Menu Management",
          description: "Create and manage custom select menus",
        },
        list: { title: "📋 Your Select Menus", description: "Select a menu to edit" },
        edit: {
          title: "✏️ Edit Select Menu",
          description: "Configure your custom select menu",
          fields: {
            name: "Name",
            placeholder: "Placeholder",
            options_count: "Options",
            min_values: "Min Values",
            max_values: "Max Values",
            disabled: "Disabled",
          },
        },
        options: { title: "📋 Menu Options", description: "Manage menu options (max 25)" },
        option_edit: {
          title: "📝 Edit Option",
          description: "Configure this option",
          fields: {
            label: "Label",
            value: "Value",
            description: "Description",
            emoji: "Emoji",
            default: "Default",
          },
        },
        emoji: { title: "😀 Select Emoji", description: "Choose an emoji for the option" },
      },
      select_menus: {
        base: {
          placeholder: "What would you like to do?",
          options: { create: "Create Menu", edit: "Edit Menu" },
        },
        list: { placeholder: "Select a menu", no_menus: "No menus found" },
        options: { placeholder: "Select an option", add: "Add Option" },
        emoji: { placeholder: "Select an emoji" },
      },
      buttons: {
        name: "Name",
        placeholder: "Placeholder",
        minmax: "Min/Max",
        disabled: "Disabled",
        options: "Options",
        preview: "Preview",
        save: "Save",
        delete: "Delete",
        back: "Back",
        opt_label: "Label",
        opt_value: "Value",
        opt_description: "Description",
        opt_emoji: "Emoji",
        clear_emoji: "Clear",
        opt_default: "Default",
      },
      modals: {
        name: { label: "Menu name" },
        placeholder: { label: "Placeholder text" },
        opt_label: { label: "Option label" },
        opt_value: { label: "Option value" },
        opt_description: { label: "Option description" },
        minmax: {
          title: "Min/Max Values",
          min_label: "Minimum selections",
          max_label: "Maximum selections",
        },
        search: { title: "Search Menus", label: "Search query" },
      },
      messages: {
        max_options: "Maximum 25 options per menu",
        no_options: "Add at least one option",
        preview: "Select menu preview:",
      },
    },
    send: {
      embeds: {
        main: {
          title: "📤 Message Composer",
          description: "Create and send messages with custom embeds, buttons, and select menus.",
        },
        select_embeds: {
          title: "📋 Select Embeds",
          description: "Choose embeds to include in your message (max 10).",
        },
        select_buttons: {
          title: "🔘 Select Buttons",
          description: "Choose buttons to include in your message (max 25, 5 per row).",
        },
        select_selectmenus: {
          title: "📋 Select Menus",
          description: "Choose select menus to include in your message (max 5, one per row).",
        },
        select_channel: {
          title: "📢 Select Channel",
          description: "Choose the channel to send the message to.",
        },
        preview: {
          title: "👁️ Preview",
          description: "This is a preview of your message composition.",
        },
      },
      fields: {
        content: "Content",
        embeds: "Embeds",
        buttons: "Buttons",
        selectmenus: "Select Menus",
        channel: "Channel",
        not_set: "Not set",
        none: "None",
        selected: "selected",
      },
      buttons: {
        edit_content: "Edit Content",
        select_embeds: "Select Embeds",
        select_buttons: "Select Buttons",
        select_menus: "Select Menus",
        select_channel: "Select Channel",
        clear_content: "Clear Content",
        clear_embeds: "Clear Embeds",
        clear_buttons: "Clear Buttons",
        clear_menus: "Clear Menus",
        preview: "Preview",
        send: "Send Message",
        back: "Back",
      },
      messages: {
        sent: "Message sent to {0}!",
        no_channel: "Please select a channel to send the message to.",
        no_content: "Please add content or at least one embed.",
        channel_not_found: "Channel not found or inaccessible.",
        send_failed: "Failed to send message. Check bot permissions.",
      },
    },
    scenario: {
      embeds: {
        main: {
          title: "📜 Scenario Builder",
          description:
            "Create custom interaction flows that trigger on button clicks, select menu selections, or modal submissions.\n\n**Features:**\n• Chain multiple actions\n• Add conditional logic\n• Use variables and placeholders",
        },
        list: {
          title: "📋 Your Scenarios",
          description: "Select a scenario to edit or create a new one.",
        },
        edit: {
          title: "✏️ Editing: {0}",
          fields: {
            status: "Status",
            steps: "Steps",
            trigger: "Trigger",
            cooldown: "Cooldown",
            id: "ID",
          },
        },
        trigger: {
          title: "🎯 Trigger Configuration",
          description: "Configure what triggers this scenario.",
          fields: { type: "Type", component_id: "Component ID" },
        },
        steps: {
          title: "📝 Steps",
          description:
            "Manage scenario steps. Steps are executed in order unless you specify branching.",
          fields: { no_steps: "No steps", add_step: "Add a step to get started" },
        },
        step_edit: {
          title: "📝 Step {0}: {1}",
          description: "Configure this step's action and conditions.",
          fields: {
            action_type: "Action Type",
            conditions: "Conditions",
            stop_on_failure: "Stop on Failure",
            on_success: "On Success",
            on_failure: "On Failure",
          },
        },
        action: {
          title: "⚡ Action: {0}",
          description: "Configure the action parameters.",
          fields: {
            content: "Content",
            ephemeral: "Ephemeral",
            channel: "Channel",
            embed_id: "Embed ID",
            modal_id: "Modal ID",
            role: "Role",
            thread_name: "Thread Name",
            auto_archive: "Auto-Archive",
            dm_content: "DM Content",
            dm_embed: "DM Embed",
            variable_name: "Variable Name",
            variable_value: "Variable Value",
            delete_original: "Delete Original",
            current_channel: "Current channel",
          },
        },
        conditions: {
          title: "🔀 Conditions",
          description_and: "Logic: **AND** - All conditions must pass",
          description_or: "Logic: **OR** - Any condition must pass",
          fields: { no_conditions: "This step will always execute" },
        },
        condition_edit: {
          title: "🔀 Condition {0}",
          fields: { type: "Type", field: "Field", operator: "Operator", value: "Value" },
        },
        restrictions: {
          title: "🔒 Restrictions",
          description: "Configure who can use this scenario and how often.",
          fields: {
            cooldown: "Cooldown",
            max_executions: "Max Executions",
            execution_period: "Execution Period",
            allowed_roles: "Allowed Roles",
            denied_roles: "Denied Roles",
            everyone: "Everyone",
            unlimited: "Unlimited",
            na: "N/A",
          },
        },
        select_component: {
          title: "🔍 Select Component",
          description: "Select a component to use.",
        },
        select_role: { title: "👥 Select Role", description: "Select a role for this action." },
        select_channel: {
          title: "📺 Select Channel",
          description: "Select a channel for this action.",
        },
      },
      select_menus: {
        base: {
          placeholder: "What would you like to do?",
          options: { create: "Create Scenario", edit: "Edit Scenario" },
        },
        list: { placeholder: "Select a scenario", no_scenarios: "No scenarios found" },
        edit: {
          placeholder: "What do you want to edit?",
          options: {
            name: "Name",
            description: "Description",
            trigger: "Trigger",
            steps: "Steps",
            restrictions: "Restrictions",
            enable: "Enable",
            disable: "Disable",
          },
        },
        trigger_type: { placeholder: "Select trigger type" },
        trigger_component: { placeholder: "Select component ID" },
        steps: { placeholder: "Select or add a step", add: "Add Step" },
        action_type: { placeholder: "Select action type" },
        action_component: { placeholder: "Select component" },
        conditions: { placeholder: "Select or add condition", add: "Add Condition" },
        condition_type: { placeholder: "Condition type" },
        condition_operator: { placeholder: "Operator" },
        condition_logic: {
          placeholder: "Condition logic",
          and: "AND - All must pass",
          or: "OR - Any must pass",
        },
        next_step: { placeholder: "On success: go to...", continue: "Continue to next step" },
        fail_step: { placeholder: "On failure: go to..." },
      },
      buttons: {
        save: "Save",
        delete: "Delete",
        back: "Back",
        step_name: "Name",
        step_action: "Action",
        step_conditions: "Conditions",
        stop_on_fail: "Stop on Fail",
        action_content: "Content",
        action_ephemeral: "Ephemeral",
        action_channel: "Channel",
        action_select_modal: "Select Modal",
        action_select_embed: "Select Embed",
        action_select_role: "Select Role",
        action_thread_name: "Thread Name",
        action_dm_content: "DM Content",
        action_dm_embed: "DM Embed",
        action_var_name: "Variable Name",
        action_var_value: "Variable Value",
        action_delete_original: "Delete Original",
        condition_field: "Field",
        condition_value: "Value",
        cooldown: "Cooldown",
        max_uses: "Max Uses",
        period: "Period",
      },
      modals: {
        name: { title: "Edit Scenario Name", label: "Scenario name" },
        description: { title: "Edit Description", label: "Description" },
        search: { title: "Search Scenarios", label: "Search query" },
        step_name: { title: "Edit Step Name", label: "Step name" },
        action_content: { title: "Edit Message Content", label: "Message content" },
        thread_name: { title: "Edit Thread Name", label: "Thread name" },
        dm_content: { title: "Edit DM Content", label: "DM content" },
        var_name: { title: "Edit Variable Name", label: "Variable name" },
        var_value: { title: "Edit Variable Value", label: "Variable value" },
        condition_value: { title: "Edit Condition Value", label: "Value" },
        condition_field: { title: "Edit Field Name", label: "Field name" },
        cooldown: { title: "Edit Cooldown", label: "Cooldown (seconds)" },
        max_executions: { title: "Max Executions", label: "Max executions per user" },
        execution_period: { title: "Execution Period", label: "Period (seconds)" },
      },
      messages: {
        max_scenarios: "Maximum {0} scenarios per guild",
        max_steps: "Maximum {0} steps per scenario",
        no_trigger: "Please set a trigger component",
        no_steps: "Please add at least one step",
      },
      action_types: {
        reply: "Reply to interaction",
        send_message: "Send message to channel",
        send_embed: "Send embed",
        show_modal: "Show modal",
        add_role: "Add role",
        remove_role: "Remove role",
        create_thread: "Create thread",
        send_dm: "Send DM",
        set_variable: "Set variable",
        edit_message: "Edit message",
        delete_message: "Delete message",
      },
      trigger_types: {
        button: "Button click",
        select_menu: "Select menu",
        modal_submit: "Modal submit",
      },
      condition_operators: {
        equals: "Equals",
        not_equals: "Not equals",
        contains: "Contains",
        not_contains: "Not contains",
        starts_with: "Starts with",
        ends_with: "Ends with",
        greater_than: "Greater than",
        less_than: "Less than",
        has_role: "Has role",
        not_has_role: "Doesn't have role",
        in_channel: "In channel",
        not_in_channel: "Not in channel",
        is_empty: "Is empty",
        is_not_empty: "Is not empty",
      },
    },
  },

  events: {
    message_create: {
      prefix: "My prefix is **{0}**",
      cooldown: "Please wait **{0}s** before using **{1}** again",
      level_up: "Congratulations {0}, you have leveled up!",
    },
    interaction_create: {
      cooldown: "Please wait **{0}s** before using **{1}** again",
      component_permission: "This component is not for you!",
      component_not_active: "This component is no longer active",
      scenario_not_found:
        "⚠️ This component has no scenario assigned. Please configure a scenario for this button/menu in the scenario settings.",
    },
  },

  functions: {
    permission_check: {
      commands: {
        bot_permission: "I need the following permissions to execute **{0}**: {1}",
        user_permission: "You need **{1}** permission to use **{0}**",
        extended_permission: {
          role: {
            denied: "You have a role that denies access to this command: {0}",
            any_role: "You need one of these roles to use this command: {0}",
          },
        },
      },
      components: {
        bot_permission: "I need the following permissions: {0}",
      },
      component: {
        user_permission: "You need **{0}** permission to use this component",
      },
    },
    join_to_create: {
      preset: {
        placeholder: "Select a preset",
        default_description: "Default channel preset",
        add: "No Preset",
        add_description: "Create channel without preset",
      },
      embed: {
        title: "Channel Settings",
        description: "Manage your voice channel settings",
      },
      up_select: {
        placeholder: "Channel Settings",
        options: {
          rename: {
            label: "Rename Channel",
            description: "Change the channel name",
          },
          bitrate: {
            label: "Set Bitrate",
            description: "Adjust audio quality",
          },
          limit: {
            label: "User Limit",
            description: "Set maximum number of users",
          },
          owner: {
            label: "Transfer Ownership",
            description: "Transfer channel ownership to another user",
          },
        },
      },
      down_select: {
        placeholder: "Channel Permissions",
        options: {
          open: {
            label: "Open Channel",
            description: "Allow everyone to join",
          },
          close: {
            label: "Close Channel",
            description: "Prevent new users from joining",
          },
          add: {
            label: "Add User/Role",
            description: "Grant access to specific users or roles",
          },
          remove: {
            label: "Remove User/Role",
            description: "Revoke access from users or roles",
          },
          show: {
            label: "Show Channel",
            description: "Make channel visible to everyone",
          },
          hide: {
            label: "Hide Channel",
            description: "Hide channel from non-members",
          },
        },
      },
      modals: {
        rename: {
          title: "Rename Channel",
          label: "New channel name",
          success: "Channel renamed to **{0}**",
        },
        bitrate: {
          title: "Set Bitrate",
          label: "Bitrate (kbps)",
          placeholder: "8 - {0}",
          success: "Bitrate set to **{0} kbps**",
          isnan: "Please enter a valid number between 8 and {0}",
          less: "Bitrate must be at least 8 kbps",
        },
        limit: {
          title: "Set User Limit",
          label: "User limit",
          placeholder: "0 = unlimited",
          success: "User limit set to **{0}**",
          isnan: "Please enter a valid number",
          less: "User limit cannot be negative",
        },
      },
      select_menus: {
        owner: {
          msg: "Select a new owner for this channel",
          placeholder: "Select a user",
        },
        add: {
          msg: "Select users or roles to add to the channel",
          placeholder: {
            user: "Select users",
            role: "Select roles",
          },
        },
        remove: {
          msg: "Select users or roles to remove from the channel",
          placeholder: {
            user: "Select users",
            role: "Select roles",
          },
        },
      },
      errors: {
        not_owner: "You are not the owner of this channel!",
        yourself: "You cannot transfer ownership to yourself!",
      },
      msg: {
        owner: "Channel ownership transferred to {0}",
        open: "Channel is now open to everyone",
        close: "Channel is now closed",
        show: "Channel is now visible to everyone",
        hide: "Channel is now hidden",
        add: {
          role: "Added roles to channel: {0}",
          user: "Added users to channel: {0}",
        },
        remove: {
          role: "Removed roles from channel: {0}",
          user: "Removed users from channel: {0}",
        },
      },
    },
  },

  permissions: {
    add_reactions: "Add Reactions",
    administrator: "Administrator",
    attach_files: "Attach Files",
    ban_members: "Ban Members",
    change_nickname: "Change Nickname",
    connect: "Connect to Voice",
    create_instant_invite: "Create Invite",
    deafen_members: "Deafen Members",
    embed_links: "Embed Links",
    kick_members: "Kick Members",
    manage_channels: "Manage Channels",
    manage_emojis_and_stickers: "Manage Emojis and Stickers",
    manage_events: "Manage Events",
    manage_guild: "Manage Server",
    manage_messages: "Manage Messages",
    manage_nicknames: "Manage Nicknames",
    manage_roles: "Manage Roles",
    manage_threads: "Manage Threads",
    manage_webhooks: "Manage Webhooks",
    mention_everyone: "Mention Everyone",
    moderate_members: "Timeout Members",
    move_members: "Move Members",
    mute_members: "Mute Members",
    priority_speaker: "Priority Speaker",
    read_message_history: "Read Message History",
    request_to_speak: "Request to Speak",
    send_messages: "Send Messages",
    send_messages_in_threads: "Send Messages in Threads",
    send_tts_messages: "Send TTS Messages",
    speak: "Speak",
    stream: "Video",
    use_application_commands: "Use Application Commands",
    use_embedded_activities: "Use Activities",
    use_external_emojis: "Use External Emojis",
    use_external_stickers: "Use External Stickers",
    use_vad: "Use Voice Activity",
    view_audit_log: "View Audit Log",
    view_channel: "View Channels",
    view_guild_insights: "View Server Insights",
  },

  icons: {
    empty: "No Icon Configured",
  },
};
