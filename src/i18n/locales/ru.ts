import { TranslationSchema } from "../../types/i18n/TranslationSchema";

/**
 * Русский языковой пакет
 */
export const ru: TranslationSchema = {
  common: {
    error: {
      title: "Ошибка",
      unknown: "Произошла неизвестная ошибка",
      permission_denied: "У вас нет прав для этого действия",
      cooldown: "Пожалуйста, подождите {0} секунд перед повторным использованием **{1}**",
    },
    success: {
      title: "Успешно",
    },
    info: {
      title: "Информация",
    },
  },

  commands: {
    permissions: {
      embeds: {
        base: {
          title: "Управление правами",
          description: "Настройка прав доступа к командам на сервере",
        },
        command: {
          title: "Права для {0}",
          description: "**Описание:** {1}",
        },
        role: {
          title: "Настройка роли: {0}",
          description: "Настройка роли: {1}",
        },
      },
      buttons: {
        back: "Назад",
        submit: "Применить",
        delete: "Удалить",
        allow: "Разрешить",
        deny: "Запретить",
      },
      select_menus: {
        commands: {
          placeholder: "Выберите команду",
          description: "Настроены пользовательские права",
        },
        permissions: {
          placeholder: "Выберите уровень прав",
        },
        roles: {
          placeholder: "Выберите роль",
          allow: "Разрешено",
          deny: "Запрещено",
          add: "Добавить роль",
        },
        role: {
          placeholder: "Выберите роль для настройки",
        },
      },
      modals: {
        jump: {
          title: "Перейти на страницу",
          label: "Номер страницы",
        },
      },
      messages: {
        role: {
          error: "Ошибка настройки роли",
        },
      },
    },
    jtc: {
      embeds: {
        title: "Настройки Join to Create",
        description: "Настройка функции Join to Create для вашего сервера",
        fields: {
          status: {
            status: "Статус",
            enabled: "✅ Включено",
            disabled: "❌ Выключено",
          },
          category: "Категория",
          channel: "Канал",
          default_name: "Название по умолчанию",
        },
      },
      buttons: {
        enable: "Включить",
        disable: "Выключить",
        change_name: "Изменить название",
      },
      modals: {
        change_name: {
          title: "Изменить название по умолчанию",
          label: "Название канала по умолчанию",
          placeholder: "например: Канал {username}",
        },
      },
    },
    modal: {
      embeds: {
        base: {
          title: "Управление модальными окнами",
          description: "Создание и управление пользовательскими модальными окнами",
        },
        edit: {
          title: "Редактирование модального окна",
          description: "Настройте ваше модальное окно",
          field: {
            name: "Заголовок модального окна",
            value: "**Заголовок:** {0}",
          },
        },
        edit_field: {
          title: "Редактирование поля",
          description: "Настройка поля модального окна",
          fields: {
            name: {
              name: "Название поля",
              value: "**Название:** {0}",
            },
            placeholder: {
              name: "Подсказка",
              value: "**Подсказка:** {0}",
            },
            style: {
              name: "Стиль",
              value: "**Стиль:** {0}",
            },
            sizes: {
              name: "Ограничения размера",
              value: "**Мин:** {0} | **Макс:** {1}",
            },
            required: {
              name: "Обязательное",
              value: "**Обязательное:** {0}",
            },
          },
        },
        search: {
          title: "Поиск модальных окон",
          description: "Найти модальное окно по названию",
          field: {
            name: "Поисковый запрос",
            value: "**Запрос:** {0}",
          },
        },
      },
      buttons: {
        edit_modal: {
          title: "Изменить заголовок",
          preview: "Предпросмотр",
          back: "Назад",
          delete: "Удалить",
          save: "Сохранить",
        },
        edit_field: {
          label: "Изменить название",
          placeholder: "Изменить подсказку",
          style: "Изменить стиль",
          sizes: "Изменить размер",
          required: "Переключить обязательность",
          delete: "Удалить поле",
        },
      },
      select_menus: {
        base: {
          placeholder: "Что вы хотите сделать?",
          options: {
            create: {
              label: "Создать модальное окно",
              description: "Создать новое модальное окно",
            },
            edit: {
              label: "Редактировать модальное окно",
              description: "Изменить существующее модальное окно",
            },
          },
        },
        select: {
          placeholder: "Выберите модальное окно для редактирования",
        },
        select_field: {
          placeholder: "Выберите поле для редактирования",
          options: {
            main: {
              label: "Основные настройки",
              description: "Изменить заголовок и базовые настройки",
            },
            add: {
              label: "Добавить поле",
              description: "Добавить новое поле в модальное окно",
            },
          },
        },
      },
      modals: {
        jump: {
          title: "Перейти на страницу",
          label: "Введите номер страницы",
        },
        search: {
          title: "Поиск модальных окон",
          label: "Введите поисковый запрос",
        },
        edit: {
          title: "Изменить заголовок модального окна",
          label: "Заголовок модального окна",
        },
        edit_field: {
          label: {
            title: "Изменить название поля",
            label: "Название поля",
          },
          placeholder: {
            title: "Изменить подсказку",
            label: "Текст подсказки",
          },
          sizes: {
            title: "Изменить размер поля",
            min: "Минимальная длина",
            max: "Максимальная длина",
          },
        },
      },
    },
  },

  events: {
    message_create: {
      prefix: "Мой префикс: **{0}**",
      cooldown: "Пожалуйста, подождите **{0}с** перед повторным использованием **{1}**",
    },
    interaction_create: {
      cooldown: "Пожалуйста, подождите **{0}с** перед повторным использованием **{1}**",
      component_permission: "Этот компонент не для вас!",
      component_not_active: "Этот компонент больше не активен",
    },
  },

  functions: {
    permission_check: {
      commands: {
        bot_permission: "Мне нужны следующие права для выполнения **{0}**: {1}",
        user_permission: "Вам нужно право **{1}** для использования **{0}**",
        extended_permission: {
          role: {
            denied: "У вас есть роль, которая запрещает доступ к этой команде: {0}",
            any_role: "Вам нужна одна из этих ролей для использования команды: {0}",
          },
        },
      },
      components: {
        bot_permission: "Мне нужны следующие права: {0}",
      },
      component: {
        user_permission: "Вам нужно право **{0}** для использования этого компонента",
      },
    },
    join_to_create: {
      preset: {
        placeholder: "Выберите пресет",
        default_description: "Стандартный пресет канала",
        add: "Без Пресета",
        add_description: "Создать канал без пресета",
      },
      embed: {
        title: "Настройки Канала",
        description: "Управление настройками вашего голосового канала",
      },
      up_select: {
        placeholder: "Настройки Канала",
        options: {
          rename: {
            label: "Переименовать Канал",
            description: "Изменить название канала",
          },
          bitrate: {
            label: "Установить Битрейт",
            description: "Настроить качество звука",
          },
          limit: {
            label: "Лимит Пользователей",
            description: "Установить максимальное количество пользователей",
          },
          owner: {
            label: "Передать Владение",
            description: "Передать владение каналом другому пользователю",
          },
        },
      },
      down_select: {
        placeholder: "Права Канала",
        options: {
          open: {
            label: "Открыть Канал",
            description: "Разрешить всем присоединяться",
          },
          close: {
            label: "Закрыть Канал",
            description: "Запретить новым пользователям присоединяться",
          },
          add: {
            label: "Добавить Пользователя/Роль",
            description: "Предоставить доступ определенным пользователям или ролям",
          },
          remove: {
            label: "Удалить Пользователя/Роль",
            description: "Отозвать доступ у пользователей или ролей",
          },
          show: {
            label: "Показать Канал",
            description: "Сделать канал видимым для всех",
          },
          hide: {
            label: "Скрыть Канал",
            description: "Скрыть канал от не-участников",
          },
        },
      },
      modals: {
        rename: {
          title: "Переименовать канал",
          label: "Новое название канала",
          success: "Канал переименован в **{0}**",
        },
        bitrate: {
          title: "Установить битрейт",
          label: "Битрейт (кбит/с)",
          placeholder: "8 - {0}",
          success: "Битрейт установлен на **{0} кбит/с**",
          isnan: "Пожалуйста, введите корректное число между 8 и {0}",
          less: "Битрейт должен быть не менее 8 кбит/с",
        },
        limit: {
          title: "Установить лимит пользователей",
          label: "Лимит пользователей",
          placeholder: "0 = без ограничений",
          success: "Лимит пользователей установлен на **{0}**",
          isnan: "Пожалуйста, введите корректное число",
          less: "Лимит пользователей не может быть отрицательным",
        },
      },
      select_menus: {
        owner: {
          msg: "Выберите нового владельца канала",
          placeholder: "Выберите пользователя",
        },
        add: {
          msg: "Выберите пользователей или роли для добавления в канал",
          placeholder: {
            user: "Выберите пользователей",
            role: "Выберите роли",
          },
        },
        remove: {
          msg: "Выберите пользователей или роли для удаления из канала",
          placeholder: {
            user: "Выберите пользователей",
            role: "Выберите роли",
          },
        },
      },
      errors: {
        not_owner: "Вы не являетесь владельцем этого канала!",
        yourself: "Вы не можете передать владение самому себе!",
      },
      msg: {
        owner: "Владение каналом передано {0}",
        open: "Канал теперь открыт для всех",
        close: "Канал теперь закрыт",
        show: "Канал теперь виден всем",
        hide: "Канал теперь скрыт",
        add: {
          role: "Роли добавлены в канал: {0}",
          user: "Пользователи добавлены в канал: {0}",
        },
        remove: {
          role: "Роли удалены из канала: {0}",
          user: "Пользователи удалены из канала: {0}",
        },
      },
    },
  },

  permissions: {
    add_reactions: "Добавлять реакции",
    administrator: "Администратор",
    attach_files: "Прикреплять файлы",
    ban_members: "Банить участников",
    change_nickname: "Изменять никнейм",
    connect: "Подключаться к голосовым каналам",
    create_instant_invite: "Создавать приглашения",
    deafen_members: "Отключать звук участникам",
    embed_links: "Встраивать ссылки",
    kick_members: "Выгонять участников",
    manage_channels: "Управлять каналами",
    manage_emojis_and_stickers: "Управлять эмодзи и стикерами",
    manage_events: "Управлять событиями",
    manage_guild: "Управлять сервером",
    manage_messages: "Управлять сообщениями",
    manage_nicknames: "Управлять никнеймами",
    manage_roles: "Управлять ролями",
    manage_threads: "Управлять ветками",
    manage_webhooks: "Управлять вебхуками",
    mention_everyone: "Упоминать всех",
    moderate_members: "Тайм-аут участникам",
    move_members: "Перемещать участников",
    mute_members: "Отключать микрофон участникам",
    priority_speaker: "Приоритетный режим",
    read_message_history: "Читать историю сообщений",
    request_to_speak: "Запрашивать слово",
    send_messages: "Отправлять сообщения",
    send_messages_in_threads: "Отправлять сообщения в ветках",
    send_tts_messages: "Отправлять TTS сообщения",
    speak: "Говорить",
    stream: "Видео",
    use_application_commands: "Использовать команды приложений",
    use_embedded_activities: "Использовать активности",
    use_external_emojis: "Использовать внешние эмодзи",
    use_external_stickers: "Использовать внешние стикеры",
    use_vad: "Использовать режим активации по голосу",
    view_audit_log: "Просматривать журнал аудита",
    view_channel: "Просматривать каналы",
    view_guild_insights: "Просматривать аналитику сервера",
  },
};

