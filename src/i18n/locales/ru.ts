import { TranslationSchema } from "../../types/i18n/TranslationSchema";

/**
 * Russian language package
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
          empty: "Пусто",
          category: "Категория",
          channel: "Канал",
          default_name: "Название по умолчанию",
        },
      },
      buttons: {
        enable: "Включить",
        disable: "Выключить",
        setup: "Авто установка",
        set_channel: "Установить канал",
        change_name: "Изменить название",
      },
      select_menus: {
        channel: {
          placeholder: "Выберите канал для Join to Create",
        },
      },
      modals: {
        change_name: {
          title: "Изменить название по умолчанию",
          label: "Название канала по умолчанию",
          placeholder: "например: Канал {username}",
        },
      },
      messages: {
        channel: {
          set: "Выберите канал для Join to Create",
          success: "Канал Join to Create установлен на {0}",
          error: "Ошибка при установке канала Join to Create",
        },
        setup: {
          success: "Функция Join to Create успешно настроена!",
          error: "Ошибка при автоматической настройке Join to Create",
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
      messages: {
        no_fields: "В этом модальном окне нет полей.",
      },
    },
    rank: {
      error: "Произошла ошибка при создании карточки ранга",
      success: "Ранговая карта {0}:",
    },
    profile: {
      error: "Произошла ошибка при создании профиля пользователя",
      success: "Профиль пользователя {0}:",
    },
    balance: {
      error: "Произошла ошибка при создании карточки баланса",
      success: "Карточка баланса {0}:",
    },
    work: {
      messages: {
        disabled: "❌ Команда работы отключена на этом сервере.",
        cooldown: "⏰ Вы слишком устали для работы! Попробуйте через **{0}**.",
        success: "{0} и заработал {1}!",
      },
    },
    timely: {
      messages: {
        disabled: "❌ Ежечасная награда отключена на этом сервере.",
        cooldown: "⏰ Вы уже получили ежечасную награду! Попробуйте через **{0}**.",
        success: "💵 Вы получили ежечасную награду в размере {0}!",
      },
    },
    daily: {
      messages: {
        disabled: "❌ Ежедневная награда отключена на этом сервере.",
        cooldown: "⏰ Вы уже получили ежедневную награду! Попробуйте через **{0}**.",
        success: "💵 Вы получили ежедневную награду в размере {0}!",
      },
    },
    weekly: {
      messages: {
        disabled: "❌ Еженедельная награда отключена на этом сервере.",
        cooldown: "⏰ Вы уже получили еженедельную награду! Попробуйте через **{0}**.",
        success: "💵 Вы получили еженедельную награду в размере {0}!",
      },
    },
    rob: {
      messages: {
        disabled: "❌ Команда ограбления отключена на этом сервере.",
        cooldown: "⏰ Вам нужно затаиться на некоторое время! Попробуйте через **{0}**.",
        self: "❌ Вы не можете ограбить себя!",
        bot: "❌ Вы не можете ограбить бота!",
        no_money: "❌ У {0} нет денег для кражи!",
        success: "🎭 Вы успешно ограбили {0} и украли {1}!",
        fail: "🚔 Вас поймали при попытке ограбить {0}, и вы заплатили штраф {1}!",
      },
    },
    bank: {
      messages: {
        invalid_amount: "❌ Пожалуйста, введите корректную сумму.",
        insufficient_wallet: "❌ У вас недостаточно денег в кошельке! У вас только {0}.",
        insufficient_bank: "❌ У вас недостаточно денег в банке! У вас только {0}.",
        no_money_wallet: "❌ У вас нет денег в кошельке для депозита.",
        no_money_bank: "❌ У вас нет денег в банке для снятия.",
        deposit_success: "🏦 Успешно положено {0} на ваш банковский счёт!",
        withdraw_success: "💵 Успешно снято {0} с вашего банковского счёта!",
      },
      fields: {
        wallet: "💳 Кошелёк",
        bank: "🏦 Банк",
      },
    },
    shop: {
      embeds: {
        main: {
          title: "🛒 Магазин ролей",
          description:
            "Просматривайте и покупайте роли за вашу валюту. Выберите роль ниже для покупки.",
          fields: {
            roles: "Доступные роли",
          },
          footer: "Страница {0} из {1}",
        },
        purchase: {
          title: "✅ Покупка успешна!",
          fields: {
            new_balance: "Новый баланс",
          },
        },
      },
      messages: {
        empty: "🏪 Магазин пуст! Нет доступных ролей для покупки.",
        role_not_found: "❌ Эта роль больше не доступна в магазине.",
        already_owned: "❌ У вас уже есть эта роль!",
        insufficient_funds: "❌ У вас недостаточно денег! Цена: {0}, Ваш баланс: {1}",
        purchase_success: "🎉 Вы успешно приобрели {0} за {1}!",
        purchase_error: "❌ Произошла ошибка при обработке покупки. Ваш баланс был возвращён.",
      },
      select_menus: {
        buy: {
          placeholder: "Выберите роль для покупки",
        },
      },
    },
    appearance: {
      embeds: {
        base: {
          title: "Настройки внешнего вида",
          description: "Ниже, выберите вид какого элемента вы хотите настроить",
        },
        rank: {
          title: "Настройки внешнего вида ранговой карты",
          description: "Настройка внешнего вида вашей ранговой карты",
        },
        level_up: {
          title: "Настройки внешнего вида карточки повышения уровня",
          description: "Настройка внешнего вида вашей карточки повышения уровня",
        },
        profile: {
          title: "Настройки внешнего вида профиля пользователя",
          description: "Настройка внешнего вида вашего профиля пользователя",
        },
        fields: {
          bg_color: {
            name: "Цвет фона",
            value: "{0}",
          },
          first_component: {
            name: "Первый компонент",
            value: "{0}",
          },
          second_component: {
            name: "Второй компонент",
            value: "{0}",
          },
          third_component: {
            name: "Третий компонент",
            value: "{0}",
          },
        },
      },
      select_menus: {
        base: {
          placeholder: "Выберите элемент для настройки",
          options: {
            rank: "Ранговая карта",
            level_up: "Карточка повышения уровня",
            profile: "Профиль пользователя",
          },
        },
        color: {
          placeholder: "Выберите элемент цвет которого вы хотите изменить",
          options: {
            bg_color: "Цвет фона",
            first_component: "Первый компонент",
            second_component: "Второй компонент",
            third_component: "Третий компонент",
          },
        },
        icons: {
          placeholder: "Выберите место иконки для настройки",
          options: {
            empty: {
              label: "Пустое место",
            },
            remove: {
              description: "Убрать иконку из профиля",
            },
            add: {
              description: "Добавить иконку в профиль",
            },
          },
        },
      },
      buttons: {
        mode: "Режим",
        url: "Установить URL",
        reset: "Сброс",
        icons_padding_x: "Отступь по X",
        icons_padding_y: "Отступь по Y",
        bio: "Биография",
      },
      modals: {
        color: {
          title: "Изменить цвет",
          label: "Введите цвет в формате HEX",
        },
        url: {
          title: "Установить URL фона",
          label: "Введите URL изображения",
        },
        bio: {
          title: "Изменить биографию",
          label: "Введите вашу биографию",
        },
        icons_padding: {
          title: "Изменение отступа",
          x: {
            label: "Введите отступ по X в пикселях",
          },
          y: {
            label: "Введите отступ по Y в пикселях",
          },
        },
      },
      messages: {
        error: {
          invalid_color: "Пожалуйста, введите корректный цвет в формате HEX",
          invalid_url: "Пожалуйста, введите корректный URL изображения",
          invalid_padding: "Пожалуйста, введите корректное число для отступа",
          no_available_icons: "У вас нет доступных иконок для добавления",
        },
      },
    },
    language: {
      embeds: {
        base: {
          title: "Настройки языка",
          description: "Выберите язык для использования на этом сервере",
        },
      },
      select_menus: {
        placeholder: "Выберите язык",
        options: {
          en: {
            description: "Установить язык на английский",
          },
          ru: {
            description: "Установить язык на русский",
          },
        },
      },
      messages: {
        success: "Язык сервера установлен на **{0}**",
      },
    },

    levels: {
      embeds: {
        base: {
          title: "Настройки системы уровней",
          description:
            "Настройка системы уровней на вашем сервере. Вы можете включить или отключить систему уровней, а также настроить игнорируемые каналы и роли, а также ролевые награды за уровни.",
          fields: {
            status: {
              name: "Статус",
              enabled: "✅ Включено",
              disabled: "❌ Выключено",
            },
            ignored_channels: {
              name: "Игнорируемые каналы",
              none: "Нет",
            },
            ignored_roles: {
              name: "Игнорируемые роли",
              none: "Нет",
            },
            level_roles: {
              name: "Награды за уровень",
              none: "Нет",
              level_format: "Уровень {0}: {1}",
            },
          },
        },
        ignore: {
          title: "Игнорируемые каналы и роли",
          description:
            "Настройка каналов и ролей, которые будут игнорироваться системой уровней. Пользователи не будут получать опыт за сообщения в этих каналах или если у них есть эти роли. Максимум по 25 каналов и ролей.",
          fields: {
            ignored_channels: {
              name: "Игнорируемые каналы",
              none: "Нет",
            },
            ignored_roles: {
              name: "Игнорируемые роли",
              none: "Нет",
            },
          },
        },
        level_roles: {
          title: "Ролевые награды за уровни",
          description:
            "Настройка наград за уровень, которые пользователи будут получать при достижении определенных уровней. Вы можете назначить роли на определенные уровни, и когда пользователь достигнет этого уровня, он автоматически получит соответствующую роль.",
          fields: {
            current_roles: {
              name: "Текущие награды за уровень",
              none: "Награды за уровень не настроены",
              level_format: "**Уровень {0}:** {1}",
            },
          },
        },
      },
      buttons: {
        enable: "Включить систему уровней",
        disable: "Выключить систему уровней",
        back: "← Назад",
        add_level_role: "Добавить награду за уровень",
        remove_level_role: "Удалить награду за уровень",
        cancel: "Отмена",
      },
      select_menus: {
        main: {
          placeholder: "Выберите действие",
          options: {
            ignore: {
              label: "Игнорируемые каналы и роли",
              description: "Настройка игнорируемых каналов и ролей",
            },
            level_roles: {
              label: "Награды за уровни",
              description: "Настройка наград ролями за достижение уровней",
            },
          },
        },
        ignore_channel: {
          placeholder: "Выберите канал(ы) для игнорирования",
        },
        ignore_role: {
          placeholder: "Выберите роль(и) для игнорирования",
        },
        level_role: {
          placeholder: "Выберите роль для управления",
        },
        select_role: {
          placeholder: "Выберите роль для этого уровня",
        },
      },
      modals: {
        add_level_role: {
          title: "Добавить награду за уровень",
          level: {
            label: "Уровень",
            placeholder: "Введите номер уровня (например, 5)",
          },
        },
        remove_level_role: {
          title: "Удалить награду за уровень",
          level: {
            label: "Уровень",
            placeholder: "Введите номер уровня для удаления",
          },
        },
      },
      messages: {
        max_channels: "Вы можете игнорировать максимум 25 каналов.",
        max_roles: "Вы можете игнорировать максимум 25 ролей.",
        invalid_level: "Неверный номер уровня. Пожалуйста, введите число от 1 до 999.",
        role_not_found: "Роль не найдена. Пожалуйста, проверьте ID роли.",
        level_role_not_found: "Ролевая награда не найдена.",
        select_role_for_level: "Выберите роль для уровня **{0}**:",
        role_added: "Роль {1} была добавлена для уровня **{0}**!",
        cancelled: "Действие отменено.",
      },
    },

    economy: {
      embeds: {
        base: {
          title: "Настройки экономики",
          description:
            "Настройка экономической системы вашего сервера. Управление валютой, магазином и источниками дохода.",
          fields: {
            currency: {
              name: "Валюта",
              value: "{0}",
              default: "{0} (По умолчанию)",
            },
            shop_roles: {
              name: "Роли в магазине",
              none: "Роли не настроены",
              format: "{0} - {1} {2}",
            },
          },
        },
        currency: {
          title: "Настройки валюты",
          description: "Настройка эмодзи валюты, используемой в экономической системе.",
          fields: {
            current: {
              name: "Текущая валюта",
              default: "{0} (По умолчанию)",
            },
          },
        },
        currency_emoji: {
          title: "Выбор эмодзи валюты",
          description: "Выберите эмодзи с вашего сервера для использования в качестве валюты.",
          footer: "Страница {0} из {1}",
        },
        shop: {
          title: "Магазин ролей",
          description:
            "Управление ролями, которые пользователи могут приобрести за валюту. Выберите роль для управления скидкой.",
          fields: {
            roles: {
              name: "Доступные роли",
              none: "Ролей в магазине нет",
              format: "{0} - **{1}**",
              discount_format: "{0} - ~~{1}~~ **{2}** ({3}% скидка)",
              discount_active: "🏷️ Активна",
              discount_scheduled: "⏰ Запланировано: {0}",
              discount_expired: "❌ Истекла",
            },
          },
        },
        income: {
          title: "Настройки доходов",
          description: "Выберите источник дохода для настройки.",
        },
        work: {
          title: "Настройки работы",
          description: "Настройка команды работы, позволяющей пользователям зарабатывать валюту.",
          fields: {
            status: {
              name: "Статус",
              enabled: "✅ Включено",
              disabled: "❌ Выключено",
            },
            cooldown: {
              name: "Перезарядка",
              value: "{0} секунд",
            },
            reward: {
              name: "Диапазон награды",
              value: "{0} - {1}",
            },
          },
        },
        timely: {
          title: "Настройки Timely",
          description: "Настройка команды timely для регулярных наград.",
          fields: {
            status: {
              name: "Статус",
              enabled: "✅ Включено",
              disabled: "❌ Выключено",
            },
            amount: {
              name: "Количество",
              value: "{0}",
            },
          },
        },
        daily: {
          title: "Настройки Daily",
          description: "Настройка команды ежедневной награды.",
          fields: {
            status: {
              name: "Статус",
              enabled: "✅ Включено",
              disabled: "❌ Выключено",
            },
            amount: {
              name: "Количество",
              value: "{0}",
            },
          },
        },
        weekly: {
          title: "Настройки Weekly",
          description: "Настройка команды еженедельной награды.",
          fields: {
            status: {
              name: "Статус",
              enabled: "✅ Включено",
              disabled: "❌ Выключено",
            },
            amount: {
              name: "Количество",
              value: "{0}",
            },
          },
        },
        level_up: {
          title: "Награда за уровень",
          description: "Настройка валютных наград за повышение уровня.",
          fields: {
            status: {
              name: "Статус",
              enabled: "✅ Включено",
              disabled: "❌ Выключено",
            },
            amount: {
              name: "Количество",
              value: "{0}",
            },
          },
        },
        bump: {
          title: "Награда за бамп",
          description: "Настройка валютных наград за бамп сервера.",
          fields: {
            status: {
              name: "Статус",
              enabled: "✅ Включено",
              disabled: "❌ Выключено",
            },
            amount: {
              name: "Количество",
              value: "{0}",
            },
          },
        },
        rob: {
          title: "Настройки ограбления",
          description: "Настройка команды ограбления, позволяющей пользователям воровать у других.",
          fields: {
            status: {
              name: "Статус",
              enabled: "✅ Включено",
              disabled: "❌ Выключено",
            },
            cooldown: {
              name: "Перезарядка",
              value: "{0} секунд",
            },
            income: {
              name: "Доход при успехе",
              value: "{0} - {1} ({2})",
            },
            punishment: {
              name: "Штраф",
              value: "{0} - {1} ({2})",
            },
            fail_chance: {
              name: "Шанс провала",
              value: "{0}%",
            },
          },
        },
      },
      buttons: {
        back: "← Назад",
        toggle: "Переключить",
        enable: "Включить",
        disable: "Выключить",
        edit: "Редактировать",
        add_role: "Добавить роль",
        remove_role: "Удалить роль",
        set_emoji: "Установить эмодзи",
        reset_emoji: "Сбросить эмодзи",
        set_discount: "Установить скидку",
        remove_discount: "Убрать скидку",
      },
      select_menus: {
        main: {
          placeholder: "Выберите категорию настроек",
          options: {
            currency: {
              label: "Валюта",
              description: "Настройка эмодзи валюты",
            },
            shop: {
              label: "Магазин ролей",
              description: "Управление ролями в магазине",
            },
            income: {
              label: "Источники дохода",
              description: "Настройка команд заработка",
            },
          },
        },
        income: {
          placeholder: "Выберите источник дохода",
          options: {
            work: {
              label: "Работа",
              description: "Настройка команды работы",
            },
            timely: {
              label: "Timely",
              description: "Настройка timely наград",
            },
            daily: {
              label: "Daily",
              description: "Настройка ежедневных наград",
            },
            weekly: {
              label: "Weekly",
              description: "Настройка еженедельных наград",
            },
            level_up: {
              label: "Уровень",
              description: "Настройка наград за уровень",
            },
            bump: {
              label: "Бамп",
              description: "Настройка наград за бамп",
            },
            rob: {
              label: "Ограбление",
              description: "Настройка команды ограбления",
            },
          },
        },
        shop_role: {
          placeholder: "Выберите роль для добавления",
        },
        manage_role: {
          placeholder: "Выберите роль для управления",
        },
        emoji: {
          placeholder: "Выберите эмодзи для валюты",
        },
      },
      modals: {
        currency: {
          title: "Установить эмодзи валюты",
          emoji: {
            label: "Эмодзи",
            placeholder: "Введите эмодзи (например, 💰 или ID кастомного эмодзи)",
          },
        },
        shop_role: {
          title: "Добавить роль в магазин",
          price: {
            label: "Цена",
            placeholder: "Введите цену для этой роли",
          },
        },
        discount: {
          title: "Установить скидку",
          amount: {
            label: "Процент скидки",
            placeholder: "Введите процент скидки (например, 20)",
          },
          starts_at: {
            label: "Дата начала (необязательно)",
            placeholder: "ГГГГ-ММ-ДД ЧЧ:ММ или оставьте пустым",
          },
          expires_at: {
            label: "Дата окончания (необязательно)",
            placeholder: "ГГГГ-ММ-ДД ЧЧ:ММ или оставьте пустым",
          },
        },
        remove_role: {
          title: "Удалить роль из магазина",
          role: {
            label: "ID роли",
            placeholder: "Введите ID роли для удаления",
          },
        },
        work: {
          title: "Настройки работы",
          cooldown: {
            label: "Перезарядка (секунды)",
            placeholder: "Введите перезарядку в секундах",
          },
          min: {
            label: "Минимальная награда",
            placeholder: "Введите минимальную награду",
          },
          max: {
            label: "Максимальная награда",
            placeholder: "Введите максимальную награду",
          },
        },
        simple_amount: {
          title: "Установить количество",
          amount: {
            label: "Количество",
            placeholder: "Введите количество награды",
          },
        },
        rob: {
          title: "Перезарядка ограбления",
          cooldown: {
            label: "Перезарядка (секунды)",
            placeholder: "Введите перезарядку в секундах",
          },
        },
        rob_income: {
          title: "Настройки дохода при ограблении",
          min: {
            label: "Минимум",
            placeholder: "Введите минимальное количество",
          },
          max: {
            label: "Максимум",
            placeholder: "Введите максимальное количество",
          },
          type: {
            label: "Тип (percentage/fixed)",
            placeholder: "Введите 'percentage' или 'fixed'",
          },
        },
        rob_punishment: {
          title: "Настройки штрафа при ограблении",
          min: {
            label: "Минимум",
            placeholder: "Введите минимальное количество",
          },
          max: {
            label: "Максимум",
            placeholder: "Введите максимальное количество",
          },
          type: {
            label: "Тип (percentage/fixed)",
            placeholder: "Введите 'percentage' или 'fixed'",
          },
          fail_chance: {
            label: "Шанс провала (%)",
            placeholder: "Введите шанс провала в процентах (0-100)",
          },
        },
      },
      messages: {
        invalid_emoji: "Неверный эмодзи. Пожалуйста, введите корректный эмодзи.",
        invalid_number: "Неверное число. Пожалуйста, введите корректное число.",
        invalid_type: "Неверный тип. Введите 'percentage' или 'fixed'.",
        invalid_date: "Неверный формат даты. Используйте формат ГГГГ-ММ-ДД ЧЧ:ММ.",
        role_added: "Роль {0} добавлена в магазин за **{1}**!",
        role_removed: "Роль удалена из магазина.",
        role_not_found: "Роль не найдена в магазине.",
        currency_set: "Валюта установлена на {0}",
        currency_reset: "Валюта сброшена на значение по умолчанию.",
        settings_updated: "Настройки обновлены.",
        discount_set: "Скидка **{0}%** установлена для {1}!",
        discount_removed: "Скидка удалена с роли.",
        select_role_to_manage: "Выберите роль для управления скидкой.",
      },
    },

    games: {
      embeds: {
        base: {
          title: "Настройки поиска напарников",
          description: "Настройте систему поиска напарников для вашего сервера.",
          fields: {
            status: {
              name: "Статус",
              enabled: "✅ Включено",
              disabled: "❌ Отключено",
            },
            channel: {
              name: "Канал с меню",
              value: "<#{0}>",
              none: "Не установлен",
            },
            send_channel: {
              name: "Канал для результатов",
              value: "<#{0}>",
              none: "Не установлен",
            },
            games_count: {
              name: "Игры",
              value: "{0} игр настроено",
            },
          },
        },
        embed_settings: {
          title: "Настройки эмбеда",
          description: "Настройте эмбед, который будет отправлен с меню выбора.",
          fields: {
            title: {
              name: "Заголовок",
              value: "{0}",
              none: "Не установлен",
            },
            description: {
              name: "Описание",
              value: "{0}",
              none: "Не установлено",
            },
            color: {
              name: "Цвет",
              value: "{0}",
              none: "По умолчанию",
            },
            thumbnail: {
              name: "Миниатюра",
              value: "[Ссылка]({0})",
              none: "Не установлена",
            },
            image: {
              name: "Изображение",
              value: "[Ссылка]({0})",
              none: "Не установлено",
            },
            footer: {
              name: "Подпись",
              value: "{0}",
              none: "Не установлена",
            },
          },
        },
        games_list: {
          title: "Список игр",
          description: "Управление играми для поиска напарников.",
          fields: {
            games: {
              name: "Настроенные игры",
              none: "Игры не настроены",
              format: "{0} {1}",
            },
          },
        },
        game_edit: {
          title: "Редактирование игры: {0}",
          description: "Настройте параметры игры и поля модального окна.",
          fields: {
            name: {
              name: "Название",
              value: "{0}",
            },
            emoji: {
              name: "Эмодзи",
              value: "{0}",
              none: "Не установлен",
            },
            role: {
              name: "Роль для пинга",
              value: "<@&{0}>",
              none: "Не установлена",
            },
            modal_title: {
              name: "Заголовок модального окна",
              value: "{0}",
            },
            fields_count: {
              name: "Поля",
              value: "{0} полей настроено",
            },
          },
        },
        game_field_edit: {
          title: "Редактирование поля",
          description: "Настройте параметры поля модального окна.",
          fields: {
            name: {
              name: "Название",
              value: "{0}",
            },
            placeholder: {
              name: "Плейсхолдер",
              value: "{0}",
            },
            style: {
              name: "Стиль",
              value: "{0}",
            },
            sizes: {
              name: "Ограничения символов",
              value: "Мин: {0}, Макс: {1}",
            },
            required: {
              name: "Обязательное",
              value: "{0}",
            },
          },
        },
        preview: {
          title: "Предпросмотр",
          description: "Так будет выглядеть эмбед.",
          footer: "Предпросмотр - Не отправлено",
        },
        game_emoji: {
          title: "Выбор эмодзи",
          description: "Выберите эмодзи с этого сервера для использования в игре.",
          fields: {
            current: {
              name: "Текущий эмодзи",
            },
            game: {
              name: "Игра",
            },
          },
        },
        find_team_result: {
          default_title: "Ищу напарников!",
          fields: {
            organizer: "Организатор",
            voice_channel: "Голосовой канал",
          },
        },
      },
      buttons: {
        enable: "Включить",
        disable: "Отключить",
        back: "Назад",
        setup: "Авто-настройка",
        send_embed: "Отправить эмбед",
        add_game: "Добавить игру",
        delete_game: "Удалить игру",
        edit_name: "Изменить название",
        edit_emoji: "Изменить эмодзи",
        edit_role: "Изменить роль",
        edit_modal_title: "Изменить заголовок",
        add_field: "Добавить поле",
        delete_field: "Удалить поле",
        edit_label: "Изменить название",
        edit_placeholder: "Изменить плейсхолдер",
        toggle_style: "Изменить стиль",
        edit_sizes: "Изменить размеры",
        toggle_required: "Обязательное",
        preview: "Предпросмотр",
        join: "Присоединиться",
        reset_emoji: "Сбросить на стандартный",
      },
      select_menus: {
        main: {
          placeholder: "Выберите опцию",
          options: {
            channels: {
              label: "Настройки каналов",
              description: "Настроить каналы для меню и результатов",
            },
            embed: {
              label: "Настройки эмбеда",
              description: "Настроить внешний вид эмбеда",
            },
            games: {
              label: "Игры",
              description: "Управление доступными играми",
            },
          },
        },
        embed: {
          placeholder: "Выберите свойство для редактирования",
          options: {
            title: {
              label: "Заголовок",
              description: "Изменить заголовок эмбеда",
            },
            description: {
              label: "Описание",
              description: "Изменить описание эмбеда",
            },
            color: {
              label: "Цвет",
              description: "Изменить цвет эмбеда",
            },
            thumbnail: {
              label: "Миниатюра",
              description: "Изменить URL миниатюры",
            },
            image: {
              label: "Изображение",
              description: "Изменить URL изображения",
            },
            footer: {
              label: "Подпись",
              description: "Изменить текст подписи",
            },
            placeholder: {
              label: "Плейсхолдер меню",
              description: "Изменить текст плейсхолдера меню",
            },
          },
        },
        games: {
          placeholder: "Выберите игру для редактирования",
          options: {
            add: {
              label: "Добавить игру",
              description: "Добавить новую игру в список",
            },
          },
        },
        game_fields: {
          placeholder: "Выберите поле для редактирования",
          options: {
            main: {
              label: "Настройки игры",
              description: "Вернуться к настройкам игры",
            },
            add: {
              label: "Добавить поле",
              description: "Добавить новое поле в модальное окно",
            },
          },
        },
        select_channel: {
          placeholder: "Выберите канал для меню",
        },
        send_channel: {
          placeholder: "Выберите канал для результатов",
        },
        find_team: {
          placeholder: "Выберите игру",
          default_placeholder: "Выберите игру для поиска напарников",
        },
        emoji: {
          placeholder: "Выберите эмодзи",
        },
      },
      modals: {
        embed_title: {
          title: "Изменить заголовок",
          label: "Заголовок",
          placeholder: "Введите заголовок эмбеда",
        },
        embed_description: {
          title: "Изменить описание",
          label: "Описание",
          placeholder: "Введите описание эмбеда",
        },
        embed_color: {
          title: "Изменить цвет",
          label: "Цвет (Hex)",
          placeholder: "#FF5733",
        },
        embed_thumbnail: {
          title: "Изменить миниатюру",
          label: "URL изображения",
          placeholder: "https://example.com/image.png",
        },
        embed_image: {
          title: "Изменить изображение",
          label: "URL изображения",
          placeholder: "https://example.com/image.png",
        },
        embed_footer: {
          title: "Изменить подпись",
          label: "Текст подписи",
          placeholder: "Введите текст подписи",
        },
        select_placeholder: {
          title: "Изменить плейсхолдер",
          label: "Текст плейсхолдера",
          placeholder: "Выберите игру...",
        },
        game_name: {
          title: "Название игры",
          label: "Название",
          placeholder: "Введите название игры",
        },
        game_emoji: {
          title: "Эмодзи игры",
          label: "Эмодзи",
          placeholder: "🎮 или кастомный эмодзи",
        },
        game_modal_title: {
          title: "Заголовок модального окна",
          label: "Заголовок",
          placeholder: "Поиск напарников - {game}",
        },
        field_label: {
          title: "Название поля",
          label: "Название",
          placeholder: "Введите название поля",
        },
        field_placeholder: {
          title: "Плейсхолдер поля",
          label: "Плейсхолдер",
          placeholder: "Введите текст плейсхолдера",
        },
        field_sizes: {
          title: "Ограничения символов",
          min_label: "Минимум символов",
          max_label: "Максимум символов",
          placeholder: "Введите число",
        },
      },
      messages: {
        channel_set: "Канал для меню установлен на {0}",
        send_channel_set: "Канал для результатов установлен на {0}",
        embed_sent: "Эмбед отправлен в {0}",
        embed_updated: "Настройка эмбеда обновлена.",
        game_added: "Игра **{0}** добавлена!",
        game_deleted: "Игра удалена.",
        game_updated: "Игра обновлена.",
        field_added: "Поле добавлено.",
        field_deleted: "Поле удалено.",
        field_updated: "Поле обновлено.",
        invalid_color: "Неверный цвет. Используйте формат hex (например, #FF5733).",
        invalid_url: "Неверный URL. Введите корректный URL изображения.",
        invalid_emoji: "Неверный эмодзи. Введите корректный эмодзи.",
        max_games: "Максимум 25 игр.",
        max_fields: "Максимум 5 полей в модальном окне.",
        setup_success: "Авто-настройка завершена! Каналы настроены.",
        setup_error: "Не удалось создать каналы. Проверьте права бота.",
        not_in_voice: "Вы должны быть в голосовом канале для использования этой функции.",
        emoji_set: "Эмодзи установлен на {0}",
        no_fields: "Нет настроенных полей для этой игры. Сначала добавьте поле.",
      },
    },

    backup: {
      embeds: {
        main: {
          title: "Бэкап сервера",
          description:
            "Создавайте и восстанавливайте бэкапы сервера. Бэкапы включают роли (с правами и участниками) и каналы (с правами).",
          fields: {
            backups_count: {
              name: "Доступные бэкапы",
              value: "{0} бэкапов",
            },
            warning: {
              name: "⚠️ Важно",
              value:
                "Бэкапы **не включают**:\n• Сообщения в каналах\n• Аватар и баннер сервера\n• Настройки сервера (название, уровень верификации и т.д.)\n• Эмодзи и стикеры\n• Боты и интеграции",
            },
          },
        },
        create: {
          title: "Создание бэкапа",
          description: "Создайте новый бэкап ролей и каналов вашего сервера.",
          fields: {
            roles: {
              name: "Роли",
              value: "{0} ролей будет сохранено",
            },
            channels: {
              name: "Каналы",
              value: "{0} каналов будет сохранено",
            },
            info: {
              name: "Что будет сохранено",
              value:
                "• Названия ролей, цвета, права и участники\n• Названия каналов, типы, позиции и права\n• Структура категорий",
            },
          },
        },
        list: {
          title: "Список бэкапов",
          description: "Выберите бэкап для просмотра деталей или восстановления.",
          roles: "ролей",
          channels: "каналов",
          fields: {
            backups: {
              name: "Ваши бэкапы",
            },
            empty: {
              name: "Нет бэкапов",
              value: "Вы ещё не создали ни одного бэкапа. Создайте его, чтобы начать!",
            },
          },
        },
        view: {
          title: "Бэкап: {0}",
          no_description: "Описание отсутствует",
          fields: {
            created: {
              name: "Создан",
            },
            created_by: {
              name: "Создал",
            },
            roles: {
              name: "Роли",
            },
            channels: {
              name: "Каналы",
            },
          },
        },
        restore_confirm: {
          title: "⚠️ Подтверждение восстановления",
          description: "Вы уверены, что хотите восстановить этот бэкап?",
          fields: {
            warning: {
              name: "Предупреждение",
              value:
                "Это действие **восстановит роли и каналы** из бэкапа. Существующие роли (с таким же названием и цветом) и каналы (с таким же названием, типом и категорией) **не будут дублироваться**.",
            },
            actions: {
              name: "Будет выполнено:",
              value:
                "• Создание недостающих ролей или использование существующих\n• Обновление прав существующих ролей\n• Назначение ролей участникам, которые должны их иметь\n• Создание недостающих каналов или пропуск существующих\n• Восстановление прав каналов для новых каналов",
            },
          },
        },
        brutal_confirm: {
          title: "💀 БРУТАЛЬНОЕ ВОССТАНОВЛЕНИЕ - ОПАСНОСТЬ",
          description:
            "**ЭТО РАЗРУШИТЕЛЬНОЕ ДЕЙСТВИЕ!**\n\nВы абсолютно уверены, что хотите выполнить брутальное восстановление?",
          fields: {
            warning: {
              name: "⚠️ КРИТИЧЕСКОЕ ПРЕДУПРЕЖДЕНИЕ",
              value:
                "Это действие **НЕОБРАТИМО**! Все ваши текущие роли и каналы будут **БЕЗВОЗВРАТНО УДАЛЕНЫ**!",
            },
            deletion: {
              name: "🗑️ Будет удалено:",
              value:
                "• **ВСЕ** роли (кроме @everyone и управляемых/ботовых ролей)\n• **ВСЕ** каналы и категории (кроме текущего канала)\n• Все права каналов\n• Все назначения ролей",
            },
            actions: {
              name: "После удаления:",
              value:
                "• Все роли из бэкапа будут воссозданы\n• Все каналы из бэкапа будут воссозданы\n• Роли будут назначены участникам\n• Права каналов будут восстановлены",
            },
          },
        },
      },
      buttons: {
        create: "Создать бэкап",
        back: "Назад",
        restore: "Восстановить",
        brutal_restore: "Брутальное восстановление",
        delete: "Удалить",
        confirm_restore: "Да, восстановить",
        confirm_brutal: "УДАЛИТЬ ВСЁ И ВОССТАНОВИТЬ",
        cancel: "Отмена",
      },
      select_menus: {
        main: {
          placeholder: "Выберите действие",
          options: {
            create: {
              label: "Создать бэкап",
              description: "Создать новый бэкап сервера",
            },
            list: {
              label: "Просмотр бэкапов",
              description: "Просмотр и управление существующими бэкапами",
            },
          },
        },
        list: {
          placeholder: "Выберите бэкап для просмотра",
        },
      },
      modals: {
        create: {
          title: "Создание бэкапа",
          name: {
            label: "Название бэкапа",
            placeholder: "Введите название для этого бэкапа",
          },
          description: {
            label: "Описание (необязательно)",
            placeholder: "Введите описание для этого бэкапа",
          },
        },
      },
      messages: {
        created: "Бэкап **{0}** успешно создан!",
        deleted: "Бэкап удалён.",
        restored: "Бэкап **{0}** успешно восстановлен!",
        restore_failed:
          "Не удалось восстановить бэкап. Некоторые роли или каналы могли не быть созданы.",
        brutal_restored:
          "💀 Брутальное восстановление **{0}** завершено! Все предыдущие роли и каналы были удалены и воссозданы из бэкапа.",
        brutal_restore_failed:
          "💀 Брутальное восстановление не удалось. Некоторые роли или каналы могли быть удалены, но не воссозданы. Проверьте права бота.",
        not_found: "Бэкап не найден.",
      },
    },

    embed: {
      embeds: {
        base: {
          title: "📋 Управление эмбедами",
          description: "Создавайте и управляйте кастомными эмбедами для вашего сервера",
        },
        list: { title: "📋 Ваши эмбеды", description: "Выберите эмбед для редактирования" },
        edit: {
          title: "✏️ Редактирование эмбеда",
          description: "Настройте ваш кастомный эмбед",
          fields: {
            name: "Название",
            title: "Заголовок",
            color: "Цвет",
            fields_count: "Поля",
            timestamp: "Время",
          },
        },
        fields: { title: "📋 Поля эмбеда", description: "Управление полями эмбеда (макс. 25)" },
        field_edit: {
          title: "📝 Редактирование поля",
          description: "Настройте это поле",
          fields: { name: "Название", value: "Значение", inline: "В ряд" },
        },
        author: {
          title: "👤 Настройки автора",
          description: "Настройка автора эмбеда",
          fields: { name: "Имя", icon: "URL иконки", url: "URL" },
        },
        footer: {
          title: "📎 Настройки подвала",
          description: "Настройка подвала эмбеда",
          fields: { text: "Текст", icon: "URL иконки" },
        },
      },
      select_menus: {
        base: {
          placeholder: "Что вы хотите сделать?",
          options: { create: "Создать эмбед", edit: "Редактировать эмбед" },
        },
        list: { placeholder: "Выберите эмбед", no_embeds: "Эмбеды не найдены" },
        edit: {
          placeholder: "Что редактировать?",
          options: {
            name: "Название",
            title: "Заголовок",
            description: "Описание",
            color: "Цвет",
            thumbnail: "Миниатюра",
            image: "Изображение",
            author: "Автор",
            footer: "Подвал",
            fields: "Поля",
            timestamp: "Время",
          },
        },
        fields: { placeholder: "Выберите поле", add: "Добавить поле" },
      },
      buttons: {
        preview: "Предпросмотр",
        save: "Сохранить",
        delete: "Удалить",
        back: "Назад",
        clear: "Очистить",
        field_name: "Название",
        field_value: "Значение",
        field_inline: "В ряд",
        author_name: "Имя",
        author_icon: "Иконка",
        author_url: "URL",
        footer_text: "Текст",
        footer_icon: "Иконка",
      },
      modals: {
        title: { label: "Заголовок эмбеда" },
        description: { label: "Описание эмбеда" },
        color: { label: "Цвет (HEX)" },
        name: { label: "Название эмбеда" },
        thumbnail: { label: "URL миниатюры" },
        image: { label: "URL изображения" },
        author_name: { label: "Имя автора" },
        author_icon: { label: "URL иконки автора" },
        author_url: { label: "URL автора" },
        footer_text: { label: "Текст подвала" },
        footer_icon: { label: "URL иконки подвала" },
        field_name: { label: "Название поля" },
        field_value: { label: "Значение поля" },
        search: { title: "Поиск эмбедов", label: "Поисковый запрос" },
      },
      messages: { max_fields: "Максимум 25 полей на эмбед" },
    },
    button: {
      embeds: {
        base: {
          title: "🔘 Управление кнопками",
          description: "Создавайте и управляйте кастомными кнопками",
        },
        list: { title: "🔘 Ваши кнопки", description: "Выберите кнопку для редактирования" },
        edit: {
          title: "✏️ Редактирование кнопки",
          description: "Настройте вашу кастомную кнопку",
          fields: {
            name: "Название",
            label: "Текст",
            style: "Стиль",
            emoji: "Эмодзи",
            url: "URL",
            disabled: "Отключена",
          },
        },
        emoji: { title: "😀 Выберите эмодзи", description: "Выберите эмодзи для кнопки" },
      },
      select_menus: {
        base: {
          placeholder: "Что вы хотите сделать?",
          options: { create: "Создать кнопку", edit: "Редактировать кнопку" },
        },
        list: { placeholder: "Выберите кнопку", no_buttons: "Кнопки не найдены" },
        style: { placeholder: "Выберите стиль кнопки" },
        emoji: { placeholder: "Выберите эмодзи" },
      },
      buttons: {
        name: "Название",
        label: "Текст",
        emoji: "Эмодзи",
        url: "URL",
        disabled: "Отключена",
        preview: "Предпросмотр",
        save: "Сохранить",
        delete: "Удалить",
        back: "Назад",
        clear_emoji: "Убрать эмодзи",
      },
      modals: {
        label: { label: "Текст кнопки" },
        url: { label: "URL кнопки" },
        name: { label: "Название кнопки" },
        search: { title: "Поиск кнопок", label: "Поисковый запрос" },
      },
      messages: { preview: "Предпросмотр кнопки:" },
    },
    selectmenu: {
      embeds: {
        base: {
          title: "📋 Управление селект меню",
          description: "Создавайте и управляйте кастомными селект меню",
        },
        list: { title: "📋 Ваши селект меню", description: "Выберите меню для редактирования" },
        edit: {
          title: "✏️ Редактирование меню",
          description: "Настройте ваше кастомное меню",
          fields: {
            name: "Название",
            placeholder: "Плейсхолдер",
            options_count: "Опции",
            min_values: "Мин. значений",
            max_values: "Макс. значений",
            disabled: "Отключено",
          },
        },
        options: { title: "📋 Опции меню", description: "Управление опциями меню (макс. 25)" },
        option_edit: {
          title: "📝 Редактирование опции",
          description: "Настройте эту опцию",
          fields: {
            label: "Текст",
            value: "Значение",
            description: "Описание",
            emoji: "Эмодзи",
            default: "По умолчанию",
          },
        },
        emoji: { title: "😀 Выберите эмодзи", description: "Выберите эмодзи для опции" },
      },
      select_menus: {
        base: {
          placeholder: "Что вы хотите сделать?",
          options: { create: "Создать меню", edit: "Редактировать меню" },
        },
        list: { placeholder: "Выберите меню", no_menus: "Меню не найдены" },
        options: { placeholder: "Выберите опцию", add: "Добавить опцию" },
        emoji: { placeholder: "Выберите эмодзи" },
      },
      buttons: {
        name: "Название",
        placeholder: "Плейсхолдер",
        minmax: "Мин/Макс",
        disabled: "Отключено",
        options: "Опции",
        preview: "Предпросмотр",
        save: "Сохранить",
        delete: "Удалить",
        back: "Назад",
        opt_label: "Текст",
        opt_value: "Значение",
        opt_description: "Описание",
        opt_emoji: "Эмодзи",
        clear_emoji: "Убрать",
        opt_default: "По умолчанию",
      },
      modals: {
        name: { label: "Название меню" },
        placeholder: { label: "Текст плейсхолдера" },
        opt_label: { label: "Текст опции" },
        opt_value: { label: "Значение опции" },
        opt_description: { label: "Описание опции" },
        minmax: {
          title: "Мин/Макс значений",
          min_label: "Минимум выборов",
          max_label: "Максимум выборов",
        },
        search: { title: "Поиск меню", label: "Поисковый запрос" },
      },
      messages: {
        max_options: "Максимум 25 опций на меню",
        no_options: "Добавьте хотя бы одну опцию",
        preview: "Предпросмотр меню:",
      },
    },
    send: {
      embeds: {
        main: {
          title: "📤 Конструктор сообщений",
          description: "Создавайте и отправляйте сообщения с кастомными эмбедами, кнопками и меню.",
        },
        select_embeds: {
          title: "📋 Выбор эмбедов",
          description: "Выберите эмбеды для включения в сообщение (макс. 10).",
        },
        select_buttons: {
          title: "🔘 Выбор кнопок",
          description: "Выберите кнопки для включения в сообщение (макс. 25, 5 в ряд).",
        },
        select_selectmenus: {
          title: "📋 Выбор меню",
          description: "Выберите меню для включения в сообщение (макс. 5, по одному в ряд).",
        },
        select_channel: {
          title: "📢 Выбор канала",
          description: "Выберите канал для отправки сообщения.",
        },
        preview: { title: "👁️ Предпросмотр", description: "Это предпросмотр вашего сообщения." },
      },
      fields: {
        content: "Содержимое",
        embeds: "Эмбеды",
        buttons: "Кнопки",
        selectmenus: "Меню",
        channel: "Канал",
        not_set: "Не задано",
        none: "Нет",
        selected: "выбрано",
      },
      buttons: {
        edit_content: "Редактировать",
        select_embeds: "Выбрать эмбеды",
        select_buttons: "Выбрать кнопки",
        select_menus: "Выбрать меню",
        select_channel: "Выбрать канал",
        clear_content: "Очистить текст",
        clear_embeds: "Очистить эмбеды",
        clear_buttons: "Очистить кнопки",
        clear_menus: "Очистить меню",
        preview: "Предпросмотр",
        send: "Отправить",
        back: "Назад",
      },
      messages: {
        sent: "Сообщение отправлено в {0}!",
        no_channel: "Пожалуйста, выберите канал для отправки сообщения.",
        no_content: "Пожалуйста, добавьте текст или хотя бы один эмбед.",
        channel_not_found: "Канал не найден или недоступен.",
        send_failed: "Не удалось отправить сообщение. Проверьте права бота.",
      },
    },
    scenario: {
      embeds: {
        main: {
          title: "📜 Конструктор сценариев",
          description:
            "Создавайте пользовательские сценарии взаимодействия, которые срабатывают по нажатию кнопок, выбору в меню или отправке модальных окон.\n\n**Возможности:**\n• Цепочки действий\n• Условная логика\n• Переменные и плейсхолдеры",
        },
        list: {
          title: "📋 Ваши сценарии",
          description: "Выберите сценарий для редактирования или создайте новый.",
        },
        edit: {
          title: "✏️ Редактирование: {0}",
          fields: {
            status: "Статус",
            steps: "Шаги",
            trigger: "Триггер",
            cooldown: "Откат",
            id: "ID",
          },
        },
        trigger: {
          title: "🎯 Настройка триггера",
          description: "Настройте, что запускает этот сценарий.",
          fields: { type: "Тип", component_id: "ID компонента" },
        },
        steps: {
          title: "📝 Шаги",
          description:
            "Управляйте шагами сценария. Шаги выполняются по порядку, если не указано ветвление.",
          fields: { no_steps: "Нет шагов", add_step: "Добавьте шаг для начала" },
        },
        step_edit: {
          title: "📝 Шаг {0}: {1}",
          description: "Настройте действие и условия этого шага.",
          fields: {
            action_type: "Тип действия",
            conditions: "Условия",
            stop_on_failure: "Стоп при ошибке",
            on_success: "При успехе",
            on_failure: "При ошибке",
          },
        },
        action: {
          title: "⚡ Действие: {0}",
          description: "Настройте параметры действия.",
          fields: {
            content: "Содержимое",
            ephemeral: "Эфемерное",
            channel: "Канал",
            embed_id: "ID эмбеда",
            modal_id: "ID модального окна",
            role: "Роль",
            thread_name: "Название ветки",
            auto_archive: "Авто-архивация",
            dm_content: "Содержимое ЛС",
            dm_embed: "Эмбед ЛС",
            variable_name: "Имя переменной",
            variable_value: "Значение переменной",
            delete_original: "Удалить оригинал",
            current_channel: "Текущий канал",
          },
        },
        conditions: {
          title: "🔀 Условия",
          description_and: "Логика: **И** - Все условия должны пройти",
          description_or: "Логика: **ИЛИ** - Любое условие должно пройти",
          fields: { no_conditions: "Этот шаг будет выполнен всегда" },
        },
        condition_edit: {
          title: "🔀 Условие {0}",
          fields: { type: "Тип", field: "Поле", operator: "Оператор", value: "Значение" },
        },
        restrictions: {
          title: "🔒 Ограничения",
          description: "Настройте, кто может использовать этот сценарий и как часто.",
          fields: {
            cooldown: "Откат",
            max_executions: "Макс. выполнений",
            execution_period: "Период выполнения",
            allowed_roles: "Разрешённые роли",
            denied_roles: "Запрещённые роли",
            everyone: "Все",
            unlimited: "Без ограничений",
            na: "Н/Д",
          },
        },
        select_component: {
          title: "🔍 Выбор компонента",
          description: "Выберите компонент для использования.",
        },
        select_role: { title: "👥 Выбор роли", description: "Выберите роль для этого действия." },
        select_channel: {
          title: "📺 Выбор канала",
          description: "Выберите канал для этого действия.",
        },
      },
      select_menus: {
        base: {
          placeholder: "Что вы хотите сделать?",
          options: { create: "Создать сценарий", edit: "Редактировать сценарий" },
        },
        list: { placeholder: "Выберите сценарий", no_scenarios: "Сценарии не найдены" },
        edit: {
          placeholder: "Что вы хотите редактировать?",
          options: {
            name: "Название",
            description: "Описание",
            trigger: "Триггер",
            steps: "Шаги",
            restrictions: "Ограничения",
            enable: "Включить",
            disable: "Отключить",
          },
        },
        trigger_type: { placeholder: "Выберите тип триггера" },
        trigger_component: { placeholder: "Выберите ID компонента" },
        steps: { placeholder: "Выберите или добавьте шаг", add: "Добавить шаг" },
        action_type: { placeholder: "Выберите тип действия" },
        action_component: { placeholder: "Выберите компонент" },
        conditions: { placeholder: "Выберите или добавьте условие", add: "Добавить условие" },
        condition_type: { placeholder: "Тип условия" },
        condition_operator: { placeholder: "Оператор" },
        condition_logic: {
          placeholder: "Логика условий",
          and: "И - Все должны пройти",
          or: "ИЛИ - Любое должно пройти",
        },
        next_step: { placeholder: "При успехе: перейти к...", continue: "Продолжить к следующему" },
        fail_step: { placeholder: "При ошибке: перейти к..." },
      },
      buttons: {
        save: "Сохранить",
        delete: "Удалить",
        back: "Назад",
        step_name: "Название",
        step_action: "Действие",
        step_conditions: "Условия",
        stop_on_fail: "Стоп при ошибке",
        action_content: "Содержимое",
        action_ephemeral: "Эфемерное",
        action_channel: "Канал",
        action_select_modal: "Выбрать модальное окно",
        action_select_embed: "Выбрать эмбед",
        action_select_role: "Выбрать роль",
        action_thread_name: "Название ветки",
        action_dm_content: "Содержимое ЛС",
        action_dm_embed: "Эмбед ЛС",
        action_var_name: "Имя переменной",
        action_var_value: "Значение",
        action_delete_original: "Удалить оригинал",
        condition_field: "Поле",
        condition_value: "Значение",
        cooldown: "Откат",
        max_uses: "Макс. использований",
        period: "Период",
      },
      modals: {
        name: { title: "Редактирование названия", label: "Название сценария" },
        description: { title: "Редактирование описания", label: "Описание" },
        search: { title: "Поиск сценариев", label: "Поисковый запрос" },
        step_name: { title: "Редактирование названия шага", label: "Название шага" },
        action_content: { title: "Редактирование содержимого", label: "Содержимое сообщения" },
        thread_name: { title: "Редактирование названия ветки", label: "Название ветки" },
        dm_content: { title: "Редактирование содержимого ЛС", label: "Содержимое ЛС" },
        var_name: { title: "Редактирование имени переменной", label: "Имя переменной" },
        var_value: { title: "Редактирование значения", label: "Значение переменной" },
        condition_value: { title: "Редактирование значения условия", label: "Значение" },
        condition_field: { title: "Редактирование имени поля", label: "Имя поля" },
        cooldown: { title: "Редактирование отката", label: "Откат (секунды)" },
        max_executions: { title: "Макс. выполнений", label: "Макс. выполнений на пользователя" },
        execution_period: { title: "Период выполнения", label: "Период (секунды)" },
      },
      messages: {
        max_scenarios: "Максимум {0} сценариев на сервер",
        max_steps: "Максимум {0} шагов на сценарий",
        no_trigger: "Пожалуйста, установите триггер-компонент",
        no_steps: "Пожалуйста, добавьте хотя бы один шаг",
      },
      action_types: {
        reply: "Ответить на взаимодействие",
        send_message: "Отправить сообщение в канал",
        send_embed: "Отправить эмбед",
        show_modal: "Показать модальное окно",
        add_role: "Добавить роль",
        remove_role: "Удалить роль",
        create_thread: "Создать ветку",
        send_dm: "Отправить ЛС",
        set_variable: "Установить переменную",
        edit_message: "Редактировать сообщение",
        delete_message: "Удалить сообщение",
      },
      trigger_types: {
        button: "Нажатие кнопки",
        select_menu: "Выбор в меню",
        modal_submit: "Отправка модального окна",
      },
      condition_operators: {
        equals: "Равно",
        not_equals: "Не равно",
        contains: "Содержит",
        not_contains: "Не содержит",
        starts_with: "Начинается с",
        ends_with: "Заканчивается на",
        greater_than: "Больше чем",
        less_than: "Меньше чем",
        has_role: "Имеет роль",
        not_has_role: "Не имеет роль",
        in_channel: "В канале",
        not_in_channel: "Не в канале",
        is_empty: "Пусто",
        is_not_empty: "Не пусто",
      },
      hints: {
        title: "📝 Переменные-маркеры",
        description:
          "Используйте эти маркеры в содержимом сообщений, полях эмбедов и ЛС. Они будут заменены на реальные значения при выполнении сценария.",
        categories: {
          user: "**👤 Переменные пользователя**",
          channel: "**📺 Переменные канала**",
          guild: "**🏠 Переменные сервера**",
          input: "**📝 Переменные модального окна**",
          selected: "**📋 Переменные выбора меню**",
          variables: "**📦 Пользовательские переменные**",
        },
        variables: {
          user_id: "`{user.id}` - ID пользователя",
          user_name: "`{user.name}` - Имя пользователя",
          user_displayName: "`{user.displayName}` - Отображаемое имя",
          user_mention: "`{user.mention}` - Упоминание пользователя (@user)",
          user_avatar: "`{user.avatar}` - URL аватара",
          channel_id: "`{channel.id}` - ID канала",
          channel_name: "`{channel.name}` - Название канала",
          channel_mention: "`{channel.mention}` - Упоминание канала (#channel)",
          guild_id: "`{guild.id}` - ID сервера",
          guild_name: "`{guild.name}` - Название сервера",
          guild_icon: "`{guild.icon}` - URL иконки сервера",
          input_field: "`{input.0}` - Значение первого поля модального окна (0, 1, 2...)",
          input_label: "`{input.0.label}` - Название первого поля модального окна",
          selected_value: "`{selected.value}` - Значение выбранной опции",
          selected_label: "`{selected.label}` - Название выбранной опции",
          var_custom: "`{variables.name}` - Пользовательская переменная (замените name на имя переменной)",
        },
        button: "Показать переменные",
      },
    },
  },

  events: {
    message_create: {
      prefix: "Мой префикс: **{0}**",
      cooldown: "Пожалуйста, подождите **{0}с** перед повторным использованием **{1}**",
      level_up: "Поздравляю, {0}, вы получили новый уроверь!",
    },
    interaction_create: {
      cooldown: "Пожалуйста, подождите **{0}с** перед повторным использованием **{1}**",
      component_permission: "Этот компонент не для вас!",
      component_not_active: "Этот компонент больше не активен",
      scenario_not_found:
        "⚠️ Для этого компонента не назначен сценарий. Пожалуйста, настройте сценарий для этой кнопки/меню в настройках сценариев.",
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

  icons: {
    empty: "Пустое место",
  },
};
