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
              default: "💰 (Default)",
            },
            shop_roles: {
              name: "Shop Roles",
              none: "No roles configured",
              format: "{0} - {1}",
            },
          },
        },
        currency: {
          title: "Currency Settings",
          description: "Configure the currency emoji used throughout the economy system.",
          fields: {
            current: {
              name: "Current Currency",
              default: "💰 (Default)",
            },
          },
        },
        shop: {
          title: "Role Shop Settings",
          description:
            "Manage roles that users can purchase with their currency. Select a role to manage its discount.",
          fields: {
            roles: {
              name: "Available Roles",
              none: "No roles in shop",
              format: "{0} - **{1}**",
              discount_format: "{0} - ~~{1}~~ **{2}** ({3}% off)",
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
