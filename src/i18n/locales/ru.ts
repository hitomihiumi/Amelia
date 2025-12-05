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
          description: "Просматривайте и покупайте роли за вашу валюту. Выберите роль ниже для покупки.",
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
