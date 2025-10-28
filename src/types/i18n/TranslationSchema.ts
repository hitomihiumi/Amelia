/**
 * Базовая структура языкового пакета
 * Все языки должны реализовывать эту структуру
 */
export interface TranslationSchema {
  // Общие переводы
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

  // Команды
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
          category: string;
          channel: string;
          default_name: string;
        };
      };
      buttons: {
        enable: string;
        disable: string;
        change_name: string;
      };
      modals: {
        change_name: {
          title: string;
          label: string;
          placeholder: string;
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
  };

  // События
  events: {
    message_create: {
      prefix: string;
      cooldown: string;
    };
    interaction_create: {
      cooldown: string;
      component_permission: string;
      component_not_active: string;
    };
  };

  // Функции/утилиты
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

  // Разрешения (permissions)
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
}

/**
 * Тип для извлечения строковых путей из объекта
 */
export type PathsToStringProps<T> = T extends string
  ? []
  : {
      [K in Extract<keyof T, string>]: [K, ...PathsToStringProps<T[K]>];
    }[Extract<keyof T, string>];

/**
 * Тип для строкового представления пути
 */
export type Join<T extends string[], D extends string> = T extends []
  ? never
  : T extends [infer F]
    ? F
    : T extends [infer F, ...infer R]
      ? F extends string
        ? `${F}${D}${Join<Extract<R, string[]>, D>}`
        : never
      : string;

/**
 * Типобезопасный путь к переводу
 */
export type TranslationKey = Join<PathsToStringProps<TranslationSchema>, ".">;
