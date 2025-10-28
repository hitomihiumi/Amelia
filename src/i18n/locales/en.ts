import { TranslationSchema } from "../../types/i18n/TranslationSchema";

/**
 * Английский языковой пакет (базовый/fallback)
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
          category: "Category",
          channel: "Channel",
          default_name: "Default Name",
        },
      },
      buttons: {
        enable: "Enable",
        disable: "Disable",
        change_name: "Change Name",
      },
      modals: {
        change_name: {
          title: "Change Default Name",
          label: "Default channel name",
          placeholder: "e.g. {username}'s Channel",
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
  },

  events: {
    message_create: {
      prefix: "My prefix is **{0}**",
      cooldown: "Please wait **{0}s** before using **{1}** again",
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
};
