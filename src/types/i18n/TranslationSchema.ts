import { SchemaKey } from "../helpers";

/**
 * Base structure of a language package
 * All languages should implement this structure
 */
export interface TranslationSchema {
  // General translations
  common: {
    error: {
      title: string;
      unknown: string;
      permission_denied: string;
      cooldown: string;
    };
    success: {
      title: string;
    };
    info: {
      title: string;
    };
  };

  // Commands
  commands: {
    permissions: {
      embeds: {
        base: {
          title: string;
          description: string;
        };
        command: {
          title: string;
          description: string;
        };
        role: {
          title: string;
          description: string;
        };
      };
      buttons: {
        back: string;
        submit: string;
        delete: string;
        allow: string;
        deny: string;
      };
      select_menus: {
        commands: {
          placeholder: string;
          description: string;
        };
        permissions: {
          placeholder: string;
        };
        roles: {
          placeholder: string;
          allow: string;
          deny: string;
          add: string;
        };
        role: {
          placeholder: string;
        };
      };
      modals: {
        jump: {
          title: string;
          label: string;
        };
      };
      messages: {
        role: {
          error: string;
        };
      };
    };

    jtc: {
      embeds: {
        title: string;
        description: string;
        fields: {
          status: {
            status: string;
            enabled: string;
            disabled: string;
          };
          empty: string;
          category: string;
          channel: string;
          default_name: string;
        };
      };
      buttons: {
        enable: string;
        disable: string;
        setup: string;
        set_channel: string;
        change_name: string;
      };
      select_menus: {
        channel: {
          placeholder: string;
        };
      };
      modals: {
        change_name: {
          title: string;
          label: string;
          placeholder: string;
        };
      };
      messages: {
        channel: {
          set: string;
          error: string;
          success: string;
        };
        setup: {
          error: string;
          success: string;
        };
      };
    };

    modal: {
      embeds: {
        base: {
          title: string;
          description: string;
        };
        edit: {
          title: string;
          description: string;
          field: {
            name: string;
            value: string;
          };
        };
        edit_field: {
          title: string;
          description: string;
          fields: {
            name: {
              name: string;
              value: string;
            };
            placeholder: {
              name: string;
              value: string;
            };
            style: {
              name: string;
              value: string;
            };
            sizes: {
              name: string;
              value: string;
            };
            required: {
              name: string;
              value: string;
            };
          };
        };
        search: {
          title: string;
          description: string;
          field: {
            name: string;
            value: string;
          };
        };
      };
      buttons: {
        edit_modal: {
          title: string;
          preview: string;
          back: string;
          delete: string;
          save: string;
        };
        edit_field: {
          label: string;
          placeholder: string;
          style: string;
          sizes: string;
          required: string;
          delete: string;
        };
      };
      select_menus: {
        base: {
          placeholder: string;
          options: {
            create: {
              label: string;
              description: string;
            };
            edit: {
              label: string;
              description: string;
            };
          };
        };
        select: {
          placeholder: string;
        };
        select_field: {
          placeholder: string;
          options: {
            main: {
              label: string;
              description: string;
            };
            add: {
              label: string;
              description: string;
            };
          };
        };
      };
      modals: {
        jump: {
          title: string;
          label: string;
        };
        search: {
          title: string;
          label: string;
        };
        edit: {
          title: string;
          label: string;
        };
        edit_field: {
          label: {
            title: string;
            label: string;
          };
          placeholder: {
            title: string;
            label: string;
          };
          sizes: {
            title: string;
            min: string;
            max: string;
          };
        };
      };
    };

    rank: {
      error: string;
      success: string;
    };

    profile: {
      error: string;
      success: string;
    };

    appearance: {
      embeds: {
        base: {
          title: string;
          description: string;
        };
        rank: {
          title: string;
          description: string;
        };
        level_up: {
          title: string;
          description: string;
        };
        profile: {
          title: string;
          description: string;
        };
        fields: {
          bg_color: {
            name: string;
            value: string;
          };
          first_component: {
            name: string;
            value: string;
          };
          second_component: {
            name: string;
            value: string;
          };
          third_component: {
            name: string;
            value: string;
          };
        };
      };
      select_menus: {
        base: {
          placeholder: string;
          options: {
            rank: string;
            profile: string;
            level_up: string;
          };
        };
        color: {
          placeholder: string;
          options: {
            bg_color: string;
            first_component: string;
            second_component: string;
            third_component: string;
          };
        };
        icons: {
          placeholder: string;
          options: {
            empty: {
              label: string;
            };
            remove: {
              description: string;
            };
            add: {
              description: string;
            };
          };
        };
      };
      buttons: {
        mode: string;
        url: string;
        reset: string;
        icons_padding_x: string;
        icons_padding_y: string;
        bio: string;
      };
      modals: {
        color: {
          title: string;
          label: string;
        };
        url: {
          title: string;
          label: string;
        };
        bio: {
          title: string;
          label: string;
        };
        icons_padding: {
          title: string;
          x: {
            label: string;
          };
          y: {
            label: string;
          };
        };
      };
      messages: {
        error: {
          invalid_color: string;
          invalid_url: string;
          invalid_padding: string;
          no_available_icons: string;
        };
      };
    };

    language: {
      embeds: {
        base: {
          title: string;
          description: string;
        };
      };
      select_menus: {
        placeholder: string;
        options: {
          en: {
            description: string;
          };
          ru: {
            description: string;
          };
        };
      };
      messages: {
        success: string;
      };
    };

    levels: {
      embeds: {
        base: {
          title: string;
          description: string;
          fields: {
            status: {
              name: string;
              enabled: string;
              disabled: string;
            };
            ignored_channels: {
              name: string;
              none: string;
            };
            ignored_roles: {
              name: string;
              none: string;
            };
            level_roles: {
              name: string;
              none: string;
              level_format: string;
            };
          };
        };
        ignore: {
          title: string;
          description: string;
          fields: {
            ignored_channels: {
              name: string;
              none: string;
            };
            ignored_roles: {
              name: string;
              none: string;
            };
          };
        };
        level_roles: {
          title: string;
          description: string;
          fields: {
            current_roles: {
              name: string;
              none: string;
              level_format: string;
            };
          };
        };
      };
      buttons: {
        enable: string;
        disable: string;
        back: string;
        add_level_role: string;
        remove_level_role: string;
        cancel: string;
      };
      select_menus: {
        main: {
          placeholder: string;
          options: {
            ignore: {
              label: string;
              description: string;
            };
            level_roles: {
              label: string;
              description: string;
            };
          };
        };
        ignore_channel: {
          placeholder: string;
        };
        ignore_role: {
          placeholder: string;
        };
        level_role: {
          placeholder: string;
        };
        select_role: {
          placeholder: string;
        };
      };
      modals: {
        add_level_role: {
          title: string;
          level: {
            label: string;
            placeholder: string;
          };
        };
        remove_level_role: {
          title: string;
          level: {
            label: string;
            placeholder: string;
          };
        };
      };
      messages: {
        max_channels: string;
        max_roles: string;
        invalid_level: string;
        role_not_found: string;
        level_role_not_found: string;
        select_role_for_level: string;
        role_added: string;
        cancelled: string;
      };
    };
  };

  // Events
  events: {
    message_create: {
      prefix: string;
      cooldown: string;
      level_up: string;
    };
    interaction_create: {
      cooldown: string;
      component_permission: string;
      component_not_active: string;
    };
  };

  // Functions/utilities
  functions: {
    permission_check: {
      commands: {
        bot_permission: string;
        user_permission: string;
        extended_permission: {
          role: {
            denied: string;
            any_role: string;
          };
        };
      };
      components: {
        bot_permission: string;
      };
      component: {
        user_permission: string;
      };
    };
    join_to_create: {
      preset: {
        placeholder: string;
        default_description: string;
        add: string;
        add_description: string;
      };
      embed: {
        title: string;
        description: string;
      };
      up_select: {
        placeholder: string;
        options: {
          rename: {
            label: string;
            description: string;
          };
          bitrate: {
            label: string;
            description: string;
          };
          limit: {
            label: string;
            description: string;
          };
          owner: {
            label: string;
            description: string;
          };
        };
      };
      down_select: {
        placeholder: string;
        options: {
          open: {
            label: string;
            description: string;
          };
          close: {
            label: string;
            description: string;
          };
          add: {
            label: string;
            description: string;
          };
          remove: {
            label: string;
            description: string;
          };
          show: {
            label: string;
            description: string;
          };
          hide: {
            label: string;
            description: string;
          };
        };
      };
      modals: {
        rename: {
          title: string;
          label: string;
          success: string;
        };
        bitrate: {
          title: string;
          label: string;
          placeholder: string;
          success: string;
          isnan: string;
          less: string;
        };
        limit: {
          title: string;
          label: string;
          placeholder: string;
          success: string;
          isnan: string;
          less: string;
        };
      };
      select_menus: {
        owner: {
          msg: string;
          placeholder: string;
        };
        add: {
          msg: string;
          placeholder: {
            user: string;
            role: string;
          };
        };
        remove: {
          msg: string;
          placeholder: {
            user: string;
            role: string;
          };
        };
      };
      errors: {
        not_owner: string;
        yourself: string;
      };
      msg: {
        owner: string;
        open: string;
        close: string;
        show: string;
        hide: string;
        add: {
          role: string;
          user: string;
        };
        remove: {
          role: string;
          user: string;
        };
      };
    };
  };

  // Permissions
  permissions: {
    add_reactions: string;
    administrator: string;
    attach_files: string;
    ban_members: string;
    change_nickname: string;
    connect: string;
    create_instant_invite: string;
    deafen_members: string;
    embed_links: string;
    kick_members: string;
    manage_channels: string;
    manage_emojis_and_stickers: string;
    manage_events: string;
    manage_guild: string;
    manage_messages: string;
    manage_nicknames: string;
    manage_roles: string;
    manage_threads: string;
    manage_webhooks: string;
    mention_everyone: string;
    moderate_members: string;
    move_members: string;
    mute_members: string;
    priority_speaker: string;
    read_message_history: string;
    request_to_speak: string;
    send_messages: string;
    send_messages_in_threads: string;
    send_tts_messages: string;
    speak: string;
    stream: string;
    use_application_commands: string;
    use_embedded_activities: string;
    use_external_emojis: string;
    use_external_stickers: string;
    use_vad: string;
    view_audit_log: string;
    view_channel: string;
    view_guild_insights: string;
  };

  icons: {
    empty: string;
  };
}

/**
 * Type-safe path to a translation
 */
export type TranslationKey = SchemaKey<TranslationSchema>;
