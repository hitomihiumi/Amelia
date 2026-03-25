import { TranslationSchema } from "../../types/i18n/TranslationSchema";

/**
 * Ukrainian language package
 */
export const uk: TranslationSchema = {
  common: {
    error: {
      title: "Помилка",
      unknown: "Сталася невідома помилка",
      permission_denied: "У вас немає прав для цієї дії",
      cooldown: "Будь ласка, зачекайте {0} секунд перед повторним використанням **{1}**",
    },
    success: {
      title: "Успішно",
    },
    info: {
      title: "Інформація",
    },
  },

  commands: {
    permissions: {
      embeds: {
        base: {
          title: "Керування правами",
          description: "Налаштування прав доступу до команд на сервері",
        },
        command: {
          title: "Права для {0}",
          description: "**Опис:** {1}",
        },
        role: {
          title: "Налаштування ролі: {0}",
          description: "Налаштування ролі: {1}",
        },
      },
      buttons: {
        back: "Назад",
        submit: "Застосувати",
        delete: "Видалити",
        allow: "Дозволити",
        deny: "Заборонити",
      },
      select_menus: {
        commands: {
          placeholder: "Виберіть команду",
          description: "Налаштовані права користувача",
        },
        permissions: {
          placeholder: "Виберіть рівень прав",
        },
        roles: {
          placeholder: "Виберіть роль",
          allow: "Дозволено",
          deny: "Заборонено",
          add: "Додати роль",
        },
        role: {
          placeholder: "Виберіть роль для налаштування",
        },
      },
      modals: {
        jump: {
          title: "Перейти на сторінку",
          label: "Номер сторінки",
        },
      },
      messages: {
        role: {
          error: "Помилка налаштування ролі",
        },
      },
    },
    jtc: {
      embeds: {
        title: "Налаштування Join to Create",
        description: "Налаштування функції Join to Create для вашого сервера",
        fields: {
          status: {
            status: "Статус",
            enabled: "✅ Увімкнено",
            disabled: "❌ Вимкнено",
          },
          empty: "Пусто",
          category: "Категорія",
          channel: "Канал",
          default_name: "Назва за замовчуванням",
        },
      },
      buttons: {
        enable: "Увімкнути",
        disable: "Вимкнути",
        setup: "Авто встановлення",
        set_channel: "Встановити канал",
        change_name: "Змінити назву",
      },
      select_menus: {
        channel: {
          placeholder: "Виберіть канал для Join to Create",
        },
      },
      modals: {
        change_name: {
          title: "Змінити назву за замовчуванням",
          label: "Назва каналу за замовчуванням",
          placeholder: "наприклад: Канал %{VAR}%",
        },
      },
      messages: {
        channel: {
          set: "Виберіть канал для Join to Create",
          success: "Канал Join to Create встановлено на {0}",
          error: "Помилка при встановленні каналу Join to Create",
        },
        setup: {
          success: "Функція Join to Create успішно налаштована!",
          error: "Помилка при автоматичному налаштуванні Join to Create",
        },
      },
    },
    modal: {
      embeds: {
        base: {
          title: "Керування модальними вікнами",
          description: "Створення та керування користувацькими модальними вікнами",
        },
        edit: {
          title: "Редагування модального вікна",
          description: "Налаштуйте ваше модальне вікно",
          field: {
            name: "Заголовок модального вікна",
            value: "**Заголовок:** {0}",
          },
        },
        edit_field: {
          title: "Редагування поля",
          description: "Налаштування поля модального вікна",
          fields: {
            name: {
              name: "Назва поля",
              value: "**Назва:** {0}",
            },
            placeholder: {
              name: "Підказка",
              value: "**Підказка:** {0}",
            },
            style: {
              name: "Стиль",
              value: "**Стиль:** {0}",
            },
            sizes: {
              name: "Обмеження розміру",
              value: "**Мін:** {0} | **Макс:** {1}",
            },
            required: {
              name: "Обов'язкове",
              value: "**Обов'язкове:** {0}",
            },
          },
        },
        search: {
          title: "Пошук модальних вікон",
          description: "Знайти модальне вікно за назвою",
          field: {
            name: "Пошуковий запит",
            value: "**Запит:** {0}",
          },
        },
      },
      buttons: {
        edit_modal: {
          title: "Змінити заголовок",
          preview: "Попередній перегляд",
          back: "Назад",
          delete: "Видалити",
          save: "Зберегти",
        },
        edit_field: {
          label: "Змінити назву",
          placeholder: "Змінити підказку",
          style: "Змінити стиль",
          sizes: "Змінити розмір",
          required: "Перемкнути обов'язковість",
          delete: "Видалити поле",
        },
      },
      select_menus: {
        base: {
          placeholder: "Що ви хочете зробити?",
          options: {
            create: {
              label: "Створити модальне вікно",
              description: "Створити нове модальне вікно",
            },
            edit: {
              label: "Редагувати модальне вікно",
              description: "Змінити існуюче модальне вікно",
            },
          },
        },
        select: {
          placeholder: "Виберіть модальне вікно для редагування",
        },
        select_field: {
          placeholder: "Виберіть поле для редагування",
          options: {
            main: {
              label: "Основні налаштування",
              description: "Змінити заголовок та базові налаштування",
            },
            add: {
              label: "Додати поле",
              description: "Додати нове поле в модальне вікно",
            },
          },
        },
      },
      modals: {
        jump: {
          title: "Перейти на сторінку",
          label: "Введіть номер сторінки",
        },
        search: {
          title: "Пошук модальних вікон",
          label: "Введіть пошуковий запит",
        },
        edit: {
          title: "Змінити заголовок модального вікна",
          label: "Заголовок модального вікна",
        },
        edit_field: {
          label: {
            title: "Змінити назву поля",
            label: "Назва поля",
          },
          placeholder: {
            title: "Змінити підказку",
            label: "Текст підказки",
          },
          sizes: {
            title: "Змінити розмір поля",
            min: "Мінімальна довжина",
            max: "Максимальна довжина",
          },
        },
      },
      messages: {
        no_fields: "У цьому модальному вікні немає полів.",
      },
    },
    rank: {
      error: "Сталася помилка при створенні картки ранга",
      success: "Рангова картка {0}:",
    },
    profile: {
      error: "Сталася помилка при створенні профілю користувача",
      success: "Профіль користувача {0}:",
    },
    balance: {
      error: "Сталася помилка при створенні картки балансу",
      success: "Картка балансу {0}:",
    },
    work: {
      messages: {
        disabled: "❌ Команда роботи вимкнена на цьому сервері.",
        cooldown: "⏰ Ви занадто втомилися для роботи! Спробуйте через **{0}**.",
        success: "{0} і заробив {1}!",
      },
    },
    timely: {
      messages: {
        disabled: "❌ Щогодинна нагорода вимкнена на цьому сервері.",
        cooldown: "⏰ Ви вже отримали щогодинну нагороду! Спробуйте через **{0}**.",
        success: "💵 Ви отримали щогодинну нагороду в розмірі {0}!",
      },
    },
    daily: {
      messages: {
        disabled: "❌ Щоденна нагорода вимкнена на цьому сервері.",
        cooldown: "⏰ Ви вже отримали щоденну нагороду! Спробуйте через **{0}**.",
        success: "💵 Ви отримали щоденну нагороду в розмірі {0}!",
      },
    },
    weekly: {
      messages: {
        disabled: "❌ Щотижнева нагорода вимкнена на цьому сервері.",
        cooldown: "⏰ Ви вже отримали щотижневу нагороду! Спробуйте через **{0}**.",
        success: "💵 Ви отримали щотижневу нагороду в розмірі {0}!",
      },
    },
    rob: {
      messages: {
        disabled: "❌ Команда пограбування вимкнена на цьому сервері.",
        cooldown: "⏰ Вам потрібно зачаїтися на деякий час! Спробуйте через **{0}**.",
        self: "❌ Ви не можете пограбувати себе!",
        bot: "❌ Ви не можете пограбувати бота!",
        no_money: "❌ У {0} немає грошей для крадіжки!",
        success: "🎭 Ви успішно пограбували {0} і вкрали {1}!",
        fail: "🚔 Вас спіймали при спробі пограбувати {0}, і ви заплатили штраф {1}!",
      },
    },
    bank: {
      messages: {
        invalid_amount: "❌ Будь ласка, введіть коректну суму.",
        insufficient_wallet: "❌ У вас недостатньо грошей у гаманці! У вас тільки {0}.",
        insufficient_bank: "❌ У вас недостатньо грошей у банку! У вас тільки {0}.",
        no_money_wallet: "❌ У вас немає грошей у гаманці для депозиту.",
        no_money_bank: "❌ У вас немає грошей у банку для зняття.",
        deposit_success: "🏦 Успішно покладено {0} на ваш банківський рахунок!",
        withdraw_success: "💵 Успішно знято {0} з вашого банківського рахунку!",
      },
      fields: {
        wallet: "💳 Гаманець",
        bank: "🏦 Банк",
      },
    },
    shop: {
      embeds: {
        main: {
          title: "🛒 Магазин ролей",
          description:
            "Переглядайте та купуйте ролі за вашу валюту. Виберіть роль нижче для покупки.",
          fields: {
            roles: "Доступні ролі",
          },
          footer: "Сторінка {0} з {1}",
        },
        purchase: {
          title: "✅ Покупка успішна!",
          fields: {
            new_balance: "Новий баланс",
          },
        },
      },
      messages: {
        empty: "🏪 Магазин порожній! Немає доступних ролей для покупки.",
        role_not_found: "❌ Ця роль більше не доступна в магазині.",
        already_owned: "❌ У вас вже є ця роль!",
        insufficient_funds: "❌ У вас недостатньо грошей! Ціна: {0}, Ваш баланс: {1}",
        purchase_success: "🎉 Ви успішно придбали {0} за {1}!",
        purchase_error: "❌ Сталася помилка при обробці покупки. Ваш баланс було повернуто.",
      },
      select_menus: {
        buy: {
          placeholder: "Виберіть роль для покупки",
        },
      },
    },
    appearance: {
      embeds: {
        base: {
          title: "Налаштування зовнішнього вигляду",
          description: "Нижче, виберіть вигляд якого елемента ви хочете налаштувати",
        },
        rank: {
          title: "Налаштування зовнішнього вигляду рангової картки",
          description: "Налаштування зовнішнього вигляду вашої рангової картки",
        },
        level_up: {
          title: "Налаштування зовнішнього вигляду картки підвищення рівня",
          description: "Налаштування зовнішнього вигляду вашої картки підвищення рівня",
        },
        profile: {
          title: "Налаштування зовнішнього вигляду профілю користувача",
          description: "Налаштування зовнішнього вигляду вашого профілю користувача",
        },
        fields: {
          bg_color: {
            name: "Колір фону",
            value: "{0}",
          },
          first_component: {
            name: "Перший компонент",
            value: "{0}",
          },
          second_component: {
            name: "Другий компонент",
            value: "{0}",
          },
          third_component: {
            name: "Третій компонент",
            value: "{0}",
          },
        },
      },
      select_menus: {
        base: {
          placeholder: "Виберіть елемент для налаштування",
          options: {
            rank: "Рангова картка",
            level_up: "Картка підвищення рівня",
            profile: "Профіль користувача",
          },
        },
        color: {
          placeholder: "Виберіть елемент колір якого ви хочете змінити",
          options: {
            bg_color: "Колір фону",
            first_component: "Перший компонент",
            second_component: "Другий компонент",
            third_component: "Третій компонент",
          },
        },
        icons: {
          placeholder: "Виберіть місце іконки для налаштування",
          options: {
            empty: {
              label: "Пусте місце",
            },
            remove: {
              description: "Прибрати іконку з профілю",
            },
            add: {
              description: "Додати іконку в профіль",
            },
          },
        },
      },
      buttons: {
        mode: "Режим",
        url: "Встановити URL",
        reset: "Скидання",
        icons_padding: "Відступ іконок",
        bio: "Біографія",
      },
      modals: {
        color: {
          title: "Змінити колір",
          label: "Введіть колір у форматі HEX",
        },
        url: {
          title: "Встановити URL фону",
          label: "Введіть URL зображення",
        },
        bio: {
          title: "Змінити біографію",
          label: "Введіть вашу біографію",
        },
        icons_padding: {
          title: "Зміна відступу",
          label: "Введіть відступ у пікселях",
        },
      },
      messages: {
        error: {
          invalid_color: "Будь ласка, введіть коректний колір у форматі HEX",
          invalid_url: "Будь ласка, введіть коректний URL зображення",
          invalid_padding: "Будь ласка, введіть коректне число для відступу",
          no_available_icons: "У вас немає доступних іконок для додавання",
        },
      },
    },
    language: {
      embeds: {
        base: {
          title: "Налаштування мови",
          description: "Виберіть мову для використання на цьому сервері",
        },
      },
      select_menus: {
        placeholder: "Виберіть мову",
        options: {
          en: {
            label: "English",
            description: "Змінити мову на англійську",
          },
          ru: {
            label: "Русский",
            description: "Змінити мову на російську",
          },
          uk: {
            label: "Українська",
            description: "Змінити мову на українську",
          },
        },
      },
      messages: {
        success: "Мову сервера змінено на **{0}**",
      },
    },

    levels: {
      embeds: {
        base: {
          title: "Налаштування системи рівнів",
          description:
            "Налаштування системи рівнів на вашому сервері. Ви можете увімкнути або вимкнути систему рівнів, а також налаштувати ігноровані канали та ролі, а також рольові нагороди за рівні.",
          fields: {
            status: {
              name: "Статус",
              enabled: "✅ Увімкнено",
              disabled: "❌ Вимкнено",
            },
            ignored_channels: {
              name: "Ігноровані канали",
              none: "Немає",
            },
            ignored_roles: {
              name: "Ігноровані ролі",
              none: "Немає",
            },
            level_roles: {
              name: "Нагороди за рівень",
              none: "Немає",
              level_format: "Рівень {0}: {1}",
            },
          },
        },
        ignore: {
          title: "Ігноровані канали та ролі",
          description:
            "Налаштування каналів та ролей, які будуть ігноруватися системою рівнів. Користувачі не отримуватимуть досвід за повідомлення в цих каналах або якщо у них є ці ролі. Максимум по 25 каналів та ролей.",
          fields: {
            ignored_channels: {
              name: "Ігноровані канали",
              none: "Немає",
            },
            ignored_roles: {
              name: "Ігноровані ролі",
              none: "Немає",
            },
          },
        },
        level_roles: {
          title: "Рольові нагороди за рівні",
          description:
            "Налаштування нагород за рівень, які користувачі отримуватимуть при досягненні певних рівнів. Ви можете призначити ролі на певні рівні, і коли користувач досягне цього рівня, він автоматично отримає відповідну роль.",
          fields: {
            current_roles: {
              name: "Поточні нагороди за рівень",
              none: "Нагороди за рівень не налаштовані",
              level_format: "**Рівень {0}:** {1}",
            },
          },
        },
      },
      buttons: {
        enable: "Увімкнути систему рівнів",
        disable: "Вимкнути систему рівнів",
        back: "← Назад",
        add_level_role: "Додати нагороду за рівень",
        remove_level_role: "Видалити нагороду за рівень",
        cancel: "Скасувати",
      },
      select_menus: {
        main: {
          placeholder: "Виберіть дію",
          options: {
            ignore: {
              label: "Ігноровані канали та ролі",
              description: "Налаштування ігнорованих каналів та ролей",
            },
            level_roles: {
              label: "Нагороди за рівні",
              description: "Налаштування нагород ролями за досягнення рівнів",
            },
          },
        },
        ignore_channel: {
          placeholder: "Виберіть канал(и) для ігнорування",
        },
        ignore_role: {
          placeholder: "Виберіть роль(и) для ігнорування",
        },
        level_role: {
          placeholder: "Виберіть роль для керування",
        },
        select_role: {
          placeholder: "Виберіть роль для цього рівня",
        },
      },
      modals: {
        add_level_role: {
          title: "Додати нагороду за рівень",
          level: {
            label: "Рівень",
            placeholder: "Введіть номер рівня (наприклад, 5)",
          },
        },
        remove_level_role: {
          title: "Видалити нагороду за рівень",
          level: {
            label: "Рівень",
            placeholder: "Введіть номер рівня для видалення",
          },
        },
      },
      messages: {
        max_channels: "Ви можете ігнорувати максимум 25 каналів.",
        max_roles: "Ви можете ігнорувати максимум 25 ролей.",
        invalid_level: "Невірний номер рівня. Будь ласка, введіть число від 1 до 999.",
        role_not_found: "Роль не знайдена. Будь ласка, перевірте ID ролі.",
        level_role_not_found: "Рольова нагорода не знайдена.",
        select_role_for_level: "Виберіть роль для рівня **{0}**:",
        role_added: "Роль {1} була додана для рівня **{0}**!",
        cancelled: "Дію скасовано.",
      },
    },

    economy: {
      embeds: {
        base: {
          title: "Налаштування економіки",
          description:
            "Налаштування економічної системи вашого сервера. Керування валютою, магазином та джерелами доходу.",
          fields: {
            currency: {
              name: "Валюта",
              value: "{0}",
              default: "{0} (За замовчуванням)",
            },
            shop_roles: {
              name: "Ролі в магазині",
              none: "Ролі не налаштовані",
              format: "{0} - {1} {2}",
            },
          },
        },
        currency: {
          title: "Налаштування валюти",
          description: "Налаштування емодзі валюти, що використовується в економічній системі.",
          fields: {
            current: {
              name: "Поточна валюта",
              default: "{0} (За замовчуванням)",
            },
          },
        },
        currency_emoji: {
          title: "Вибір емодзі валюти",
          description: "Виберіть емодзі з вашого сервера для використання як валюти.",
          footer: "Сторінка {0} з {1}",
        },
        shop: {
          title: "Магазин ролей",
          description:
            "Керування ролями, які користувачі можуть придбати за валюту. Виберіть роль для керування знижкою.",
          fields: {
            roles: {
              name: "Доступні ролі",
              none: "Ролей в магазині немає",
              format: "{0} - **{1}**",
              discount_format: "{0} - ~~{1}~~ **{2}** ({3}% знижка)",
              discount_active: "🏷️ Активна",
              discount_scheduled: "⏰ Заплановано: {0}",
              discount_expired: "❌ Минула",
            },
          },
        },
        income: {
          title: "Налаштування доходів",
          description: "Виберіть джерело доходу для налаштування.",
        },
        work: {
          title: "Налаштування роботи",
          description: "Налаштування команди роботи, що дозволяє користувачам заробляти валюту.",
          fields: {
            status: {
              name: "Статус",
              enabled: "✅ Увімкнено",
              disabled: "❌ Вимкнено",
            },
            cooldown: {
              name: "Перезарядка",
              value: "{0} секунд",
            },
            reward: {
              name: "Діапазон нагороди",
              value: "{0} - {1}",
            },
          },
        },
        timely: {
          title: "Налаштування Timely",
          description: "Налаштування команди timely для регулярних нагород.",
          fields: {
            status: {
              name: "Статус",
              enabled: "✅ Увімкнено",
              disabled: "❌ Вимкнено",
            },
            amount: {
              name: "Кількість",
              value: "{0}",
            },
          },
        },
        daily: {
          title: "Налаштування Daily",
          description: "Налаштування команди щоденної нагороди.",
          fields: {
            status: {
              name: "Статус",
              enabled: "✅ Увімкнено",
              disabled: "❌ Вимкнено",
            },
            amount: {
              name: "Кількість",
              value: "{0}",
            },
          },
        },
        weekly: {
          title: "Налаштування Weekly",
          description: "Налаштування команди щотижневої нагороди.",
          fields: {
            status: {
              name: "Статус",
              enabled: "✅ Увімкнено",
              disabled: "❌ Вимкнено",
            },
            amount: {
              name: "Кількість",
              value: "{0}",
            },
          },
        },
        level_up: {
          title: "Нагорода за рівень",
          description: "Налаштування валютних нагород за підвищення рівня.",
          fields: {
            status: {
              name: "Статус",
              enabled: "✅ Увімкнено",
              disabled: "❌ Вимкнено",
            },
            amount: {
              name: "Кількість",
              value: "{0}",
            },
          },
        },
        bump: {
          title: "Нагорода за бамп",
          description: "Налаштування валютних нагород за бамп сервера.",
          fields: {
            status: {
              name: "Статус",
              enabled: "✅ Увімкнено",
              disabled: "❌ Вимкнено",
            },
            amount: {
              name: "Кількість",
              value: "{0}",
            },
          },
        },
        rob: {
          title: "Налаштування пограбування",
          description:
            "Налаштування команди пограбування, що дозволяє користувачам красти у інших.",
          fields: {
            status: {
              name: "Статус",
              enabled: "✅ Увімкнено",
              disabled: "❌ Вимкнено",
            },
            cooldown: {
              name: "Перезарядка",
              value: "{0} секунд",
            },
            income: {
              name: "Дохід при успіху",
              value: "{0} - {1} ({2})",
            },
            punishment: {
              name: "Штраф",
              value: "{0} - {1} ({2})",
            },
            fail_chance: {
              name: "Шанс провалу",
              value: "{0}%",
            },
          },
        },
      },
      buttons: {
        back: "← Назад",
        toggle: "Перемкнути",
        enable: "Увімкнути",
        disable: "Вимкнути",
        edit: "Редагувати",
        add_role: "Додати роль",
        remove_role: "Видалити роль",
        set_emoji: "Встановити емодзі",
        reset_emoji: "Скинути емодзі",
        set_discount: "Встановити знижку",
        remove_discount: "Прибрати знижку",
      },
      select_menus: {
        main: {
          placeholder: "Виберіть категорію налаштувань",
          options: {
            currency: {
              label: "Валюта",
              description: "Налаштування емодзі валюти",
            },
            shop: {
              label: "Магазин ролей",
              description: "Керування ролями в магазині",
            },
            income: {
              label: "Джерела доходу",
              description: "Налаштування команд заробітку",
            },
          },
        },
        income: {
          placeholder: "Виберіть джерело доходу",
          options: {
            work: {
              label: "Робота",
              description: "Налаштування команди роботи",
            },
            timely: {
              label: "Timely",
              description: "Налаштування timely нагород",
            },
            daily: {
              label: "Daily",
              description: "Налаштування щоденних нагород",
            },
            weekly: {
              label: "Weekly",
              description: "Налаштування щотижневих нагород",
            },
            level_up: {
              label: "Рівень",
              description: "Налаштування нагород за рівень",
            },
            bump: {
              label: "Бамп",
              description: "Налаштування нагород за бамп",
            },
            rob: {
              label: "Пограбування",
              description: "Налаштування команди пограбування",
            },
          },
        },
        shop_role: {
          placeholder: "Виберіть роль для додавання",
        },
        manage_role: {
          placeholder: "Виберіть роль для керування",
        },
        emoji: {
          placeholder: "Виберіть емодзі для валюти",
        },
      },
      modals: {
        currency: {
          title: "Встановити емодзі валюти",
          emoji: {
            label: "Емодзі",
            placeholder: "Введіть емодзі (наприклад, 💰 або ID кастомного емодзі)",
          },
        },
        shop_role: {
          title: "Додати роль в магазин",
          price: {
            label: "Ціна",
            placeholder: "Введіть ціну для цієї ролі",
          },
        },
        discount: {
          title: "Встановити знижку",
          amount: {
            label: "Відсоток знижки",
            placeholder: "Введіть відсоток знижки (наприклад, 20)",
          },
          starts_at: {
            label: "Дата початку (необов'язково)",
            placeholder: "РРРР-ММ-ДД ГГ:ХХ або залиште пустим",
          },
          expires_at: {
            label: "Дата закінчення (необов'язково)",
            placeholder: "РРРР-ММ-ДД ГГ:ХХ або залиште пустим",
          },
        },
        remove_role: {
          title: "Видалити роль з магазину",
          role: {
            label: "ID ролі",
            placeholder: "Введіть ID ролі для видалення",
          },
        },
        work: {
          title: "Налаштування роботи",
          cooldown: {
            label: "Перезарядка (секунди)",
            placeholder: "Введіть перезарядку в секундах",
          },
          min: {
            label: "Мінімальна нагорода",
            placeholder: "Введіть мінімальну нагороду",
          },
          max: {
            label: "Максимальна нагорода",
            placeholder: "Введіть максимальну нагороду",
          },
        },
        simple_amount: {
          title: "Встановити кількість",
          amount: {
            label: "Кількість",
            placeholder: "Введіть кількість нагороди",
          },
        },
        rob: {
          title: "Перезарядка пограбування",
          cooldown: {
            label: "Перезарядка (секунди)",
            placeholder: "Введіть перезарядку в секундах",
          },
        },
        rob_income: {
          title: "Налаштування доходу при пограбуванні",
          min: {
            label: "Мінімум",
            placeholder: "Введіть мінімальну кількість",
          },
          max: {
            label: "Максимум",
            placeholder: "Введіть максимальну кількість",
          },
          type: {
            label: "Тип (percentage/fixed)",
            placeholder: "Введіть 'percentage' або 'fixed'",
          },
        },
        rob_punishment: {
          title: "Налаштування штрафу при пограбуванні",
          min: {
            label: "Мінімум",
            placeholder: "Введіть мінімальну кількість",
          },
          max: {
            label: "Максимум",
            placeholder: "Введіть максимальну кількість",
          },
          type: {
            label: "Тип (percentage/fixed)",
            placeholder: "Введіть 'percentage' або 'fixed'",
          },
          fail_chance: {
            label: "Шанс провалу (%)",
            placeholder: "Введіть шанс провалу у відсотках (0-100)",
          },
        },
      },
      messages: {
        invalid_emoji: "Невірний емодзі. Будь ласка, введіть коректний емодзі.",
        invalid_number: "Невірне число. Будь ласка, введіть коректне число.",
        invalid_type: "Невірний тип. Введіть 'percentage' або 'fixed'.",
        invalid_date: "Невірний формат дати. Використовуйте формат РРРР-ММ-ДД ГГ:ХХ.",
        role_added: "Роль {0} додана в магазин за **{1}**!",
        role_removed: "Роль видалена з магазину.",
        role_not_found: "Роль не знайдена в магазині.",
        currency_set: "Валюта встановлена на {0}",
        currency_reset: "Валюта скинута на значення за замовчуванням.",
        settings_updated: "Налаштування оновлено.",
        discount_set: "Знижка **{0}%** встановлена для {1}!",
        discount_removed: "Знижка видалена з ролі.",
        select_role_to_manage: "Виберіть роль для керування знижкою.",
      },
    },

    games: {
      embeds: {
        base: {
          title: "Налаштування пошуку напарників",
          description: "Налаштуйте систему пошуку напарників для вашого сервера.",
          fields: {
            status: {
              name: "Статус",
              enabled: "✅ Увімкнено",
              disabled: "❌ Вимкнено",
            },
            channel: {
              name: "Канал з меню",
              value: "<#{0}>",
              none: "Не встановлено",
            },
            send_channel: {
              name: "Канал для результатів",
              value: "<#{0}>",
              none: "Не встановлено",
            },
            games_count: {
              name: "Ігри",
              value: "{0} ігор налаштовано",
            },
          },
        },
        embed_settings: {
          title: "Налаштування ембеду",
          description: "Налаштуйте ембед, який буде відправлений з меню вибору.",
          fields: {
            title: {
              name: "Заголовок",
              value: "{0}",
              none: "Не встановлено",
            },
            description: {
              name: "Опис",
              value: "{0}",
              none: "Не встановлено",
            },
            color: {
              name: "Колір",
              value: "{0}",
              none: "За замовчуванням",
            },
            thumbnail: {
              name: "Мініатюра",
              value: "[Посилання]({0})",
              none: "Не встановлено",
            },
            image: {
              name: "Зображення",
              value: "[Посилання]({0})",
              none: "Не встановлено",
            },
            footer: {
              name: "Підпис",
              value: "{0}",
              none: "Не встановлено",
            },
          },
        },
        games_list: {
          title: "Список ігор",
          description: "Керування іграми для пошуку напарників.",
          fields: {
            games: {
              name: "Налаштовані ігри",
              none: "Ігри не налаштовані",
              format: "{0} {1}",
            },
          },
        },
        game_edit: {
          title: "Редагування гри: {0}",
          description: "Налаштуйте параметри гри та поля модального вікна.",
          fields: {
            name: {
              name: "Назва",
              value: "{0}",
            },
            emoji: {
              name: "Емодзі",
              value: "{0}",
              none: "Не встановлено",
            },
            role: {
              name: "Роль для пінгу",
              value: "<@&{0}>",
              none: "Не встановлено",
            },
            modal_title: {
              name: "Заголовок модального вікна",
              value: "{0}",
            },
            fields_count: {
              name: "Поля",
              value: "{0} полів налаштовано",
            },
          },
        },
        game_field_edit: {
          title: "Редагування поля",
          description: "Налаштуйте параметри поля модального вікна.",
          fields: {
            name: {
              name: "Назва",
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
              name: "Обмеження символів",
              value: "Мін: {0}, Макс: {1}",
            },
            required: {
              name: "Обов'язкове",
              value: "{0}",
            },
          },
        },
        preview: {
          title: "Попередній перегляд",
          description: "Так буде виглядати ембед.",
          footer: "Попередній перегляд - Не відправлено",
        },
        game_emoji: {
          title: "Вибір емодзі",
          description: "Виберіть емодзі з цього сервера для використання в грі.",
          fields: {
            current: {
              name: "Поточний емодзі",
            },
            game: {
              name: "Гра",
            },
          },
        },
        find_team_result: {
          default_title: "Шукаю напарників!",
          fields: {
            organizer: "Організатор",
            voice_channel: "Голосовий канал",
          },
        },
      },
      buttons: {
        enable: "Увімкнути",
        disable: "Вимкнути",
        back: "Назад",
        setup: "Авто-налаштування",
        send_embed: "Відправити ембед",
        add_game: "Додати гру",
        delete_game: "Видалити гру",
        edit_name: "Змінити назву",
        edit_emoji: "Змінити емодзі",
        edit_role: "Змінити роль",
        edit_modal_title: "Змінити заголовок",
        add_field: "Додати поле",
        delete_field: "Видалити поле",
        edit_label: "Змінити назву",
        edit_placeholder: "Змінити плейсхолдер",
        toggle_style: "Змінити стиль",
        edit_sizes: "Змінити розміри",
        toggle_required: "Обов'язкове",
        preview: "Попередній перегляд",
        join: "Приєднатися",
        reset_emoji: "Скинути на стандартний",
      },
      select_menus: {
        main: {
          placeholder: "Виберіть опцію",
          options: {
            channels: {
              label: "Налаштування каналів",
              description: "Налаштувати канали для меню та результатів",
            },
            embed: {
              label: "Налаштування ембеду",
              description: "Налаштувати зовнішній вигляд ембеду",
            },
            games: {
              label: "Ігри",
              description: "Керування доступними іграми",
            },
          },
        },
        embed: {
          placeholder: "Виберіть властивість для редагування",
          options: {
            title: {
              label: "Заголовок",
              description: "Змінити заголовок ембеду",
            },
            description: {
              label: "Опис",
              description: "Змінити опис ембеду",
            },
            color: {
              label: "Колір",
              description: "Змінити колір ембеду",
            },
            thumbnail: {
              label: "Мініатюра",
              description: "Змінити URL мініатюри",
            },
            image: {
              label: "Зображення",
              description: "Змінити URL зображення",
            },
            footer: {
              label: "Підпис",
              description: "Змінити текст підпису",
            },
            placeholder: {
              label: "Плейсхолдер меню",
              description: "Змінити текст плейсхолдера меню",
            },
          },
        },
        games: {
          placeholder: "Виберіть гру для редагування",
          options: {
            add: {
              label: "Додати гру",
              description: "Додати нову гру в список",
            },
          },
        },
        game_fields: {
          placeholder: "Виберіть поле для редагування",
          options: {
            main: {
              label: "Налаштування гри",
              description: "Повернутися до налаштувань гри",
            },
            add: {
              label: "Додати поле",
              description: "Додати нове поле в модальне вікно",
            },
          },
        },
        select_channel: {
          placeholder: "Виберіть канал для меню",
        },
        send_channel: {
          placeholder: "Виберіть канал для результатів",
        },
        find_team: {
          placeholder: "Виберіть гру",
          default_placeholder: "Виберіть гру для пошуку напарників",
        },
        emoji: {
          placeholder: "Виберіть емодзі",
        },
      },
      modals: {
        embed_title: {
          title: "Змінити заголовок",
          label: "Заголовок",
          placeholder: "Введіть заголовок ембеду",
        },
        embed_description: {
          title: "Змінити опис",
          label: "Опис",
          placeholder: "Введіть опис ембеду",
        },
        embed_color: {
          title: "Змінити колір",
          label: "Колір (Hex)",
          placeholder: "#FF5733",
        },
        embed_thumbnail: {
          title: "Змінити мініатюру",
          label: "URL зображення",
          placeholder: "https://example.com/image.png",
        },
        embed_image: {
          title: "Змінити зображення",
          label: "URL зображення",
          placeholder: "https://example.com/image.png",
        },
        embed_footer: {
          title: "Змінити підпис",
          label: "Текст підпису",
          placeholder: "Введіть текст підпису",
        },
        select_placeholder: {
          title: "Змінити плейсхолдер",
          label: "Текст плейсхолдера",
          placeholder: "Виберіть гру...",
        },
        game_name: {
          title: "Назва гри",
          label: "Назва",
          placeholder: "Введіть назву гри",
        },
        game_emoji: {
          title: "Емодзі гри",
          label: "Емодзі",
          placeholder: "🎮 або кастомний емодзі",
        },
        game_modal_title: {
          title: "Заголовок модального вікна",
          label: "Заголовок",
          placeholder: "Пошук напарників - {game}",
        },
        field_label: {
          title: "Назва поля",
          label: "Назва",
          placeholder: "Введіть назву поля",
        },
        field_placeholder: {
          title: "Плейсхолдер поля",
          label: "Плейсхолдер",
          placeholder: "Введіть текст плейсхолдера",
        },
        field_sizes: {
          title: "Обмеження символів",
          min_label: "Мінімум символів",
          max_label: "Максимум символів",
          placeholder: "Введіть число",
        },
      },
      messages: {
        channel_set: "Канал для меню встановлено на {0}",
        send_channel_set: "Канал для результатів встановлено на {0}",
        embed_sent: "Ембед відправлено в {0}",
        embed_updated: "Налаштування ембеду оновлено.",
        game_added: "Гра **{0}** додана!",
        game_deleted: "Гра видалена.",
        game_updated: "Гра оновлена.",
        field_added: "Поле додано.",
        field_deleted: "Поле видалено.",
        field_updated: "Поле оновлено.",
        invalid_color: "Невірний колір. Використовуйте формат hex (наприклад, #FF5733).",
        invalid_url: "Невірний URL. Введіть коректний URL зображення.",
        invalid_emoji: "Невірний емодзі. Введіть коректний емодзі.",
        max_games: "Максимум 25 ігор.",
        max_fields: "Максимум 5 полів в модальному вікні.",
        setup_success: "Авто-налаштування завершено! Канали налаштовані.",
        setup_error: "Не вдалося створити канали. Перевірте права бота.",
        not_in_voice: "Ви повинні бути в голосовому каналі для використання цієї функції.",
        emoji_set: "Емодзі встановлено на {0}",
        no_fields: "Немає налаштованих полів для цієї гри. Спочатку додайте поле.",
      },
    },

    backup: {
      embeds: {
        main: {
          title: "Бекап сервера",
          description:
            "Створюйте та відновлюйте бекапи сервера. Бекапи включають ролі (з правами та учасниками) та канали (з правами).",
          fields: {
            backups_count: {
              name: "Доступні бекапи",
              value: "{0} бекапів",
            },
            warning: {
              name: "⚠️ Важливо",
              value:
                "Бекапи **не включають**:\n• Повідомлення в каналах\n• Аватар та банер сервера\n• Налаштування сервера (назва, рівень верифікації тощо)\n• Емодзі та стікери\n• Боти та інтеграції",
            },
          },
        },
        create: {
          title: "Створення бекапу",
          description: "Створіть новий бекап ролей та каналів вашого сервера.",
          fields: {
            roles: {
              name: "Ролі",
              value: "{0} ролей буде збережено",
            },
            channels: {
              name: "Канали",
              value: "{0} каналів буде збережено",
            },
            info: {
              name: "Що буде збережено",
              value:
                "• Назви ролей, кольори, права та учасники\n• Назви каналів, типи, позиції та права\n• Структура категорій",
            },
          },
        },
        list: {
          title: "Список бекапів",
          description: "Виберіть бекап для перегляду деталей або відновлення.",
          roles: "ролей",
          channels: "каналів",
          fields: {
            backups: {
              name: "Ваші бекапи",
            },
            empty: {
              name: "Немає бекапів",
              value: "Ви ще не створили жодного бекапу. Створіть його, щоб почати!",
            },
          },
        },
        view: {
          title: "Бекап: {0}",
          no_description: "Опис відсутній",
          fields: {
            created: {
              name: "Створено",
            },
            created_by: {
              name: "Створив",
            },
            roles: {
              name: "Ролі",
            },
            channels: {
              name: "Канали",
            },
          },
        },
        restore_confirm: {
          title: "⚠️ Підтвердження відновлення",
          description: "Ви впевнені, що хочете відновити цей бекап?",
          fields: {
            warning: {
              name: "Попередження",
              value:
                "Ця дія **відновить ролі та канали** з бекапу. Існуючі ролі (з такою ж назвою та кольором) та канали (з такою ж назвою, типом та категорією) **не будуть дублюватися**.",
            },
            actions: {
              name: "Буде виконано:",
              value:
                "• Створення відсутніх ролей або використання існуючих\n• Оновлення прав існуючих ролей\n• Призначення ролей учасникам, які повинні їх мати\n• Створення відсутніх каналів або пропуск існуючих\n• Відновлення прав каналів для нових каналів",
            },
          },
        },
        brutal_confirm: {
          title: "💀 БРУТАЛЬНЕ ВІДНОВЛЕННЯ - НЕБЕЗПЕКА",
          description:
            "**ЦЕ РУЙНІВНА ДІЯ!**\n\nВи абсолютно впевнені, що хочете виконати брутальне відновлення?",
          fields: {
            warning: {
              name: "⚠️ КРИТИЧНЕ ПОПЕРЕДЖЕННЯ",
              value:
                "Ця дія **НЕЗВОРОТНА**! Всі ваші поточні ролі та канали будуть **БЕЗПОВОРОТНО ВИДАЛЕНІ**!",
            },
            deletion: {
              name: "🗑️ Буде видалено:",
              value:
                "• **ВСІ** ролі (крім @everyone та керованих/ботових ролей)\n• **ВСІ** канали та категорії (крім поточного каналу)\n• Всі права каналів\n• Всі призначення ролей",
            },
            actions: {
              name: "Після видалення:",
              value:
                "• Всі ролі з бекапу будуть відтворені\n• Всі канали з бекапу будуть відтворені\n• Ролі будуть призначені учасникам\n• Права каналів будуть відновлені",
            },
          },
        },
      },
      buttons: {
        create: "Створити бекап",
        back: "Назад",
        restore: "Відновити",
        brutal_restore: "Брутальне відновлення",
        delete: "Видалити",
        confirm_restore: "Так, відновити",
        confirm_brutal: "ВИДАЛИТИ ВСЕ І ВІДНОВИТИ",
        cancel: "Скасувати",
      },
      select_menus: {
        main: {
          placeholder: "Виберіть дію",
          options: {
            create: {
              label: "Створити бекап",
              description: "Створити новий бекап сервера",
            },
            list: {
              label: "Перегляд бекапів",
              description: "Перегляд та керування існуючими бекапами",
            },
          },
        },
        list: {
          placeholder: "Виберіть бекап для перегляду",
        },
      },
      modals: {
        create: {
          title: "Створення бекапу",
          name: {
            label: "Назва бекапу",
            placeholder: "Введіть назву для цього бекапу",
          },
          description: {
            label: "Опис (необов'язково)",
            placeholder: "Введіть опис для цього бекапу",
          },
        },
      },
      messages: {
        created: "Бекап **{0}** успішно створено!",
        deleted: "Бекап видалено.",
        restored: "Бекап **{0}** успішно відновлено!",
        restore_failed: "Не вдалося відновити бекап. Деякі ролі або канали могли не бути створені.",
        brutal_restored:
          "💀 Брутальне відновлення **{0}** завершено! Всі попередні ролі та канали були видалені та відтворені з бекапу.",
        brutal_restore_failed:
          "💀 Брутальне відновлення не вдалося. Деякі ролі або канали могли бути видалені, але не відтворені. Перевірте права бота.",
        not_found: "Бекап не знайдено.",
      },
    },

    embed: {
      embeds: {
        base: {
          title: "📋 Керування ембедами",
          description: "Створюйте та керуйте кастомними ембедами для вашого сервера",
        },
        list: { title: "📋 Ваші ембеди", description: "Виберіть ембед для редагування" },
        edit: {
          title: "✏️ Редагування ембеду",
          description: "Налаштуйте ваш кастомний ембед",
          fields: {
            name: "Назва",
            title: "Заголовок",
            color: "Колір",
            fields_count: "Поля",
            timestamp: "Час",
          },
        },
        fields: { title: "📋 Поля ембеду", description: "Керування полями ембеду (макс. 25)" },
        field_edit: {
          title: "📝 Редагування поля",
          description: "Налаштуйте це поле",
          fields: { name: "Назва", value: "Значення", inline: "В ряд" },
        },
        author: {
          title: "👤 Налаштування автора",
          description: "Налаштування автора ембеду",
          fields: { name: "Ім'я", icon: "URL іконки", url: "URL" },
        },
        footer: {
          title: "📎 Налаштування підвалу",
          description: "Налаштування підвалу ембеду",
          fields: { text: "Текст", icon: "URL іконки" },
        },
      },
      select_menus: {
        base: {
          placeholder: "Що ви хочете зробити?",
          options: { create: "Створити ембед", edit: "Редагувати ембед" },
        },
        list: { placeholder: "Виберіть ембед", no_embeds: "Ембеди не знайдені" },
        edit: {
          placeholder: "Що редагувати?",
          options: {
            name: "Назва",
            title: "Заголовок",
            description: "Опис",
            color: "Колір",
            thumbnail: "Мініатюра",
            image: "Зображення",
            author: "Автор",
            footer: "Підвал",
            fields: "Поля",
            timestamp: "Час",
          },
        },
        fields: { placeholder: "Виберіть поле", add: "Додати поле" },
      },
      buttons: {
        preview: "Попередній перегляд",
        save: "Зберегти",
        delete: "Видалити",
        back: "Назад",
        clear: "Очистити",
        field_name: "Назва",
        field_value: "Значення",
        field_inline: "В ряд",
        author_name: "Ім'я",
        author_icon: "Іконка",
        author_url: "URL",
        footer_text: "Текст",
        footer_icon: "Іконка",
      },
      modals: {
        title: { label: "Заголовок ембеду" },
        description: { label: "Опис ембеду" },
        color: { label: "Колір (HEX)" },
        name: { label: "Назва ембеду" },
        thumbnail: { label: "URL мініатюри" },
        image: { label: "URL зображення" },
        author_name: { label: "Ім'я автора" },
        author_icon: { label: "URL іконки автора" },
        author_url: { label: "URL автора" },
        footer_text: { label: "Текст підвалу" },
        footer_icon: { label: "URL іконки підвалу" },
        field_name: { label: "Назва поля" },
        field_value: { label: "Значення поля" },
        search: { title: "Пошук ембедів", label: "Пошуковий запит" },
      },
      messages: { max_fields: "Максимум 25 полів на ембед" },
    },
    button: {
      embeds: {
        base: {
          title: "🔘 Керування кнопками",
          description: "Створюйте та керуйте кастомними кнопками",
        },
        list: { title: "🔘 Ваші кнопки", description: "Виберіть кнопку для редагування" },
        edit: {
          title: "✏️ Редагування кнопки",
          description: "Налаштуйте вашу кастомну кнопку",
          fields: {
            name: "Назва",
            label: "Текст",
            style: "Стиль",
            emoji: "Емодзі",
            url: "URL",
            disabled: "Вимкнена",
          },
        },
        emoji: { title: "😀 Виберіть емодзі", description: "Виберіть емодзі для кнопки" },
      },
      select_menus: {
        base: {
          placeholder: "Що ви хочете зробити?",
          options: { create: "Створити кнопку", edit: "Редагувати кнопку" },
        },
        list: { placeholder: "Виберіть кнопку", no_buttons: "Кнопки не знайдені" },
        style: { placeholder: "Виберіть стиль кнопки" },
        emoji: { placeholder: "Виберіть емодзі" },
      },
      buttons: {
        name: "Назва",
        label: "Текст",
        emoji: "Емодзі",
        url: "URL",
        disabled: "Вимкнена",
        preview: "Попередній перегляд",
        save: "Зберегти",
        delete: "Видалити",
        back: "Назад",
        clear_emoji: "Прибрати емодзі",
      },
      modals: {
        label: { label: "Текст кнопки" },
        url: { label: "URL кнопки" },
        name: { label: "Назва кнопки" },
        search: { title: "Пошук кнопок", label: "Пошуковий запит" },
      },
      messages: { preview: "Попередній перегляд кнопки:" },
    },
    selectmenu: {
      embeds: {
        base: {
          title: "📋 Керування селект меню",
          description: "Створюйте та керуйте кастомними селект меню",
        },
        list: { title: "📋 Ваші селект меню", description: "Виберіть меню для редагування" },
        edit: {
          title: "✏️ Редагування меню",
          description: "Налаштуйте ваше кастомне меню",
          fields: {
            name: "Назва",
            placeholder: "Плейсхолдер",
            options_count: "Опції",
            min_values: "Мін. значень",
            max_values: "Макс. значень",
            disabled: "Вимкнено",
          },
        },
        options: { title: "📋 Опції меню", description: "Керування опціями меню (макс. 25)" },
        option_edit: {
          title: "📝 Редагування опції",
          description: "Налаштуйте цю опцію",
          fields: {
            label: "Текст",
            value: "Значення",
            description: "Опис",
            emoji: "Емодзі",
            default: "За замовчуванням",
          },
        },
        emoji: { title: "😀 Виберіть емодзі", description: "Виберіть емодзі для опції" },
      },
      select_menus: {
        base: {
          placeholder: "Що ви хочете зробити?",
          options: { create: "Створити меню", edit: "Редагувати меню" },
        },
        list: { placeholder: "Виберіть меню", no_menus: "Меню не знайдені" },
        options: { placeholder: "Виберіть опцію", add: "Додати опцію" },
        emoji: { placeholder: "Виберіть емодзі" },
      },
      buttons: {
        name: "Назва",
        placeholder: "Плейсхолдер",
        minmax: "Мін/Макс",
        disabled: "Вимкнено",
        options: "Опції",
        preview: "Попередній перегляд",
        save: "Зберегти",
        delete: "Видалити",
        back: "Назад",
        opt_label: "Текст",
        opt_value: "Значення",
        opt_description: "Опис",
        opt_emoji: "Емодзі",
        clear_emoji: "Прибрати",
        opt_default: "За замовчуванням",
      },
      modals: {
        name: { label: "Назва меню" },
        placeholder: { label: "Текст плейсхолдера" },
        opt_label: { label: "Текст опції" },
        opt_value: { label: "Значення опції" },
        opt_description: { label: "Опис опції" },
        minmax: {
          title: "Мін/Макс значень",
          min_label: "Мінімум виборів",
          max_label: "Максимум виборів",
        },
        search: { title: "Пошук меню", label: "Пошуковий запит" },
      },
      messages: {
        max_options: "Максимум 25 опцій на меню",
        no_options: "Додайте хоча б одну опцію",
        preview: "Попередній перегляд меню:",
      },
    },
    send: {
      embeds: {
        main: {
          title: "📤 Конструктор повідомлень",
          description:
            "Створюйте та відправляйте повідомлення з кастомними ембедами, кнопками та меню.",
        },
        select_embeds: {
          title: "📋 Вибір ембедів",
          description: "Виберіть ембеди для включення в повідомлення (макс. 10).",
        },
        select_buttons: {
          title: "🔘 Вибір кнопок",
          description: "Виберіть кнопки для включення в повідомлення (макс. 25, 5 в ряд).",
        },
        select_selectmenus: {
          title: "📋 Вибір меню",
          description: "Виберіть меню для включення в повідомлення (макс. 5, по одному в ряд).",
        },
        select_channel: {
          title: "📢 Вибір каналу",
          description: "Виберіть канал для відправки повідомлення.",
        },
        preview: {
          title: "👁️ Попередній перегляд",
          description: "Це попередній перегляд вашого повідомлення.",
        },
      },
      fields: {
        content: "Вміст",
        embeds: "Ембеди",
        buttons: "Кнопки",
        selectmenus: "Меню",
        channel: "Канал",
        not_set: "Не задано",
        none: "Немає",
        selected: "вибрано",
      },
      buttons: {
        edit_content: "Редагувати",
        select_embeds: "Вибрати ембеди",
        select_buttons: "Вибрати кнопки",
        select_menus: "Вибрати меню",
        select_channel: "Вибрати канал",
        clear_content: "Очистити текст",
        clear_embeds: "Очистити ембеди",
        clear_buttons: "Очистити кнопки",
        clear_menus: "Очистити меню",
        preview: "Попередній перегляд",
        send: "Відправити",
        back: "Назад",
      },
      messages: {
        sent: "Повідомлення відправлено в {0}!",
        no_channel: "Будь ласка, виберіть канал для відправки повідомлення.",
        no_content: "Будь ласка, додайте текст або хоча б один ембед.",
        channel_not_found: "Канал не знайдено або недоступний.",
        send_failed: "Не вдалося відправити повідомлення. Перевірте права бота.",
      },
    },
    scenario: {
      embeds: {
        main: {
          title: "📜 Конструктор сценаріїв",
          description:
            "Створюйте користувацькі сценарії взаємодії, які спрацьовують при натисканні кнопок, виборі в меню або відправці модальних вікон.\n\n**Можливості:**\n• Ланцюжки дій\n• Умовна логіка\n• Змінні та плейсхолдери",
        },
        list: {
          title: "📋 Ваші сценарії",
          description: "Виберіть сценарій для редагування або створіть новий.",
        },
        edit: {
          title: "✏️ Редагування: {0}",
          fields: {
            status: "Статус",
            steps: "Кроки",
            trigger: "Тригер",
            cooldown: "Відкат",
            id: "ID",
          },
        },
        trigger: {
          title: "🎯 Налаштування тригера",
          description: "Налаштуйте, що запускає цей сценарій.",
          fields: { type: "Тип", component_id: "ID компонента" },
        },
        steps: {
          title: "📝 Кроки",
          description:
            "Керуйте кроками сценарію. Кроки виконуються по порядку, якщо не вказано розгалуження.",
          fields: { no_steps: "Немає кроків", add_step: "Додайте крок для початку" },
        },
        step_edit: {
          title: "📝 Крок {0}: {1}",
          description: "Налаштуйте дію та умови цього кроку.",
          fields: {
            action_type: "Тип дії",
            conditions: "Умови",
            stop_on_failure: "Стоп при помилці",
            on_success: "При успіху",
            on_failure: "При помилці",
          },
        },
        action: {
          title: "⚡ Дія: {0}",
          description: "Налаштуйте параметри дії.",
          fields: {
            content: "Вміст",
            ephemeral: "Ефемерне",
            channel: "Канал",
            embed_id: "ID ембеду",
            modal_id: "ID модального вікна",
            role: "Роль",
            thread_name: "Назва гілки",
            auto_archive: "Авто-архівація",
            dm_content: "Вміст ЛС",
            dm_embed: "Ембед ЛС",
            variable_name: "Ім'я змінної",
            variable_value: "Значення змінної",
            delete_original: "Видалити оригінал",
            current_channel: "Поточний канал",
          },
        },
        conditions: {
          title: "🔀 Умови",
          description_and: "Логіка: **І** - Всі умови повинні пройти",
          description_or: "Логіка: **АБО** - Будь-яка умова повинна пройти",
          fields: { no_conditions: "Цей крок буде виконано завжди" },
        },
        condition_edit: {
          title: "🔀 Умова {0}",
          fields: { type: "Тип", field: "Поле", operator: "Оператор", value: "Значення" },
        },
        restrictions: {
          title: "🔒 Обмеження",
          description: "Налаштуйте, хто може використовувати цей сценарій і як часто.",
          fields: {
            cooldown: "Відкат",
            max_executions: "Макс. виконань",
            execution_period: "Період виконання",
            allowed_roles: "Дозволені ролі",
            denied_roles: "Заборонені ролі",
            everyone: "Всі",
            unlimited: "Без обмежень",
            na: "Н/Д",
          },
        },
        select_component: {
          title: "🔍 Вибір компонента",
          description: "Виберіть компонент для використання.",
        },
        select_role: { title: "👥 Вибір ролі", description: "Виберіть роль для цієї дії." },
        select_channel: {
          title: "📺 Вибір каналу",
          description: "Виберіть канал для цієї дії.",
        },
      },
      select_menus: {
        base: {
          placeholder: "Що ви хочете зробити?",
          options: { create: "Створити сценарій", edit: "Редагувати сценарій" },
        },
        list: { placeholder: "Виберіть сценарій", no_scenarios: "Сценарії не знайдені" },
        edit: {
          placeholder: "Що ви хочете редагувати?",
          options: {
            name: "Назва",
            description: "Опис",
            trigger: "Тригер",
            steps: "Кроки",
            restrictions: "Обмеження",
            enable: "Увімкнути",
            disable: "Вимкнути",
          },
        },
        trigger_type: { placeholder: "Виберіть тип тригера" },
        trigger_component: { placeholder: "Виберіть ID компонента" },
        steps: { placeholder: "Виберіть або додайте крок", add: "Додати крок" },
        action_type: { placeholder: "Виберіть тип дії" },
        action_component: { placeholder: "Виберіть компонент" },
        conditions: { placeholder: "Виберіть або додайте умову", add: "Додати умову" },
        condition_type: { placeholder: "Тип умови" },
        condition_operator: { placeholder: "Оператор" },
        condition_logic: {
          placeholder: "Логіка умов",
          and: "І - Всі повинні пройти",
          or: "АБО - Будь-яка повинна пройти",
        },
        next_step: {
          placeholder: "При успіху: перейти до...",
          continue: "Продовжити до наступного",
        },
        fail_step: { placeholder: "При помилці: перейти до..." },
      },
      buttons: {
        save: "Зберегти",
        delete: "Видалити",
        back: "Назад",
        step_name: "Назва",
        step_action: "Дія",
        step_conditions: "Умови",
        stop_on_fail: "Стоп при помилці",
        action_content: "Вміст",
        action_ephemeral: "Ефемерне",
        action_channel: "Канал",
        action_select_modal: "Вибрати модальне вікно",
        action_select_embed: "Вибрати ембед",
        action_select_role: "Вибрати роль",
        action_thread_name: "Назва гілки",
        action_dm_content: "Вміст ЛС",
        action_dm_embed: "Ембед ЛС",
        action_var_name: "Ім'я змінної",
        action_var_value: "Значення",
        action_delete_original: "Видалити оригінал",
        condition_field: "Поле",
        condition_value: "Значення",
        cooldown: "Відкат",
        max_uses: "Макс. використань",
        period: "Період",
      },
      modals: {
        name: { title: "Редагування назви", label: "Назва сценарію" },
        description: { title: "Редагування опису", label: "Опис" },
        search: { title: "Пошук сценаріїв", label: "Пошуковий запит" },
        step_name: { title: "Редагування назви кроку", label: "Назва кроку" },
        action_content: { title: "Редагування вмісту", label: "Вміст повідомлення" },
        thread_name: { title: "Редагування назви гілки", label: "Назва гілки" },
        dm_content: { title: "Редагування вмісту ЛС", label: "Вміст ЛС" },
        var_name: { title: "Редагування імені змінної", label: "Ім'я змінної" },
        var_value: { title: "Редагування значення", label: "Значення змінної" },
        condition_value: { title: "Редагування значення умови", label: "Значення" },
        condition_field: { title: "Редагування імені поля", label: "Ім'я поля" },
        cooldown: { title: "Редагування відкату", label: "Відкат (секунди)" },
        max_executions: { title: "Макс. виконань", label: "Макс. виконань на користувача" },
        execution_period: { title: "Період виконання", label: "Період (секунди)" },
      },
      messages: {
        max_scenarios: "Максимум {0} сценаріїв на сервер",
        max_steps: "Максимум {0} кроків на сценарій",
        no_trigger: "Будь ласка, встановіть тригер-компонент",
        no_steps: "Будь ласка, додайте хоча б один крок",
      },
      action_types: {
        reply: "Відповісти на взаємодію",
        send_message: "Відправити повідомлення в канал",
        send_embed: "Відправити ембед",
        show_modal: "Показати модальне вікно",
        add_role: "Додати роль",
        remove_role: "Видалити роль",
        create_thread: "Створити гілку",
        send_dm: "Відправити ЛС",
        set_variable: "Встановити змінну",
        edit_message: "Редагувати повідомлення",
        delete_message: "Видалити повідомлення",
      },
      trigger_types: {
        button: "Натискання кнопки",
        select_menu: "Вибір в меню",
        modal_submit: "Відправка модального вікна",
      },
      condition_operators: {
        equals: "Дорівнює",
        not_equals: "Не дорівнює",
        contains: "Містить",
        not_contains: "Не містить",
        starts_with: "Починається з",
        ends_with: "Закінчується на",
        greater_than: "Більше ніж",
        less_than: "Менше ніж",
        has_role: "Має роль",
        not_has_role: "Не має роль",
        in_channel: "В каналі",
        not_in_channel: "Не в каналі",
        is_empty: "Пусто",
        is_not_empty: "Не пусто",
      },
      hints: {
        title: "📝 Змінні-маркери",
        description:
          "Використовуйте ці маркери у вмісті повідомлень, полях ембедів та ЛС. Вони будуть замінені на реальні значення при виконанні сценарію.",
        categories: {
          user: "**👤 Змінні користувача**",
          channel: "**📺 Змінні каналу**",
          guild: "**🏠 Змінні сервера**",
          input: "**📝 Змінні модального вікна**",
          selected: "**📋 Змінні вибору меню**",
          variables: "**📦 Користувацькі змінні**",
        },
        variables: {
          user_id: "`{user.id}` - ID користувача",
          user_name: "`{user.name}` - Ім'я користувача",
          user_displayName: "`{user.displayName}` - Відображуване ім'я",
          user_mention: "`{user.mention}` - Згадка користувача (@user)",
          user_avatar: "`{user.avatar}` - URL аватара",
          channel_id: "`{channel.id}` - ID каналу",
          channel_name: "`{channel.name}` - Назва каналу",
          channel_mention: "`{channel.mention}` - Згадка каналу (#channel)",
          guild_id: "`{guild.id}` - ID сервера",
          guild_name: "`{guild.name}` - Назва сервера",
          guild_icon: "`{guild.icon}` - URL іконки сервера",
          input_field: "`{input.0}` - Значення першого поля модального вікна (0, 1, 2...)",
          input_label: "`{input.0.label}` - Назва першого поля модального вікна",
          selected_value: "`{selected.value}` - Значення обраної опції",
          selected_label: "`{selected.label}` - Назва обраної опції",
          var_custom: "`{variables.name}` - Користувацька змінна (замініть name на ім'я змінної)",
        },
        button: "Показати змінні",
      },
    },

    leaderboard: {
      embeds: {
        footer: "Сторінка {0} з {1} — Всього користувачів: {2}",
        level: {
          title: "🏆 Таблиця лідерів рівнів",
          description: "Перегляньте топ користувачів за рівнями на цьому сервері.",
          field: {
            name: "**#{0} {1}**",
            value: "Рівень: `{0}` | Досвід: `{1}` XP",
          },
        },
        voice: {
          title: "🎤 Таблиця лідерів голосового часу",
          description: "Перегляньте топ користувачів за голосовим часом на цьому сервері.",
          field: {
            name: "**#{0} {1}**",
            value: "Голосовий час: `{0}`",
          },
        },
        coins: {
          title: "💰 Таблиця лідерів монет",
          description: "Перегляньте топ користувачів за кількістю монет на цьому сервері.",
          field: {
            name: "**#{0} {1}**",
            value: "Монети: `{0}`{1}",
          },
        },
      },
      buttons: {
        level: "Рівні",
        voice: "Голос",
        coins: "Монети",
      },
    },
    rp: {
      embeds: {
        kiss: {
          title: "💋 Поцілунок",
          description: "{0} поцілував(ла) {1} 💋",
        },
        hug: {
          title: "🤗 Обійми",
          description: "{0} обійняв(ла) {1} 🤗",
        },
        slap: {
          title: "👋 Ляпас",
          description: "{0} дав(ла) ляпаса {1} 👋",
        },
        pat: {
          title: "🐾 Погладжування",
          description: "{0} погладив(ла) {1} 🐾",
        },
        poke: {
          title: "👉 Тикання",
          description: "{0} ткнув(ла) {1} 👉",
        },
        tickle: {
          title: "😄 Лоскотання",
          description: "{0} лоскотав(ла) {1} 😄",
        },
      },
      messages: {
        no_target: "Будь ласка, вкажіть користувача для цієї дії!",
        cannot_target_yourself: "Ви не можете виконати цю дію на собі!",
      },
    },

    stats: {
      title: "Статистика бота",
      total_guilds: "Всього серверів",
      total_members: "Всього учасників",
      total_shards: "Всього фрагментів",
      github: {
        title: "Статистика GitHub",
        name: "Ім'я репозиторію",
        stars: "Зірки",
        forks: "Форки",
        issues: "Задачі",
      },
      system: {
        title: "Системні показники",
        cpu: "Навантаження процесора",
        ram: "ОЗП (Зайнято / Всього)",
        uptime: "Час роботи (Uptime)",
        nodejs: "Node.js",
        platform: "Платформа",
      },
      version: {
        title: "Версії",
        current: "Поточна версія",
        latest: "Остання версія",
        latest_description: "Нова версія доступна в репозиторії проєкту",
      },
      buttons: {
        invite: "Запросити бота",
        github: "Репозиторій на GitHub",
      }
    }
  },

  events: {
    message_create: {
      prefix: "Мій префікс: **{0}**",
      cooldown: "Будь ласка, зачекайте **{0}с** перед повторним використанням **{1}**",
      level_up: "Вітаю, {0}, ви отримали новий рівень!",
    },
    interaction_create: {
      cooldown: "Будь ласка, зачекайте **{0}с** перед повторним використанням **{1}**",
      component_permission: "Цей компонент не для вас!",
      component_not_active: "Цей компонент більше не активний",
      scenario_not_found:
        "⚠️ Для цього компонента не призначено сценарій. Будь ласка, налаштуйте сценарій для цієї кнопки/меню в налаштуваннях сценаріїв.",
    },
  },

  functions: {
    permission_check: {
      commands: {
        bot_permission: "Мені потрібні наступні права для виконання **{0}**: {1}",
        user_permission: "Вам потрібне право **{1}** для використання **{0}**",
        extended_permission: {
          role: {
            denied: "У вас є роль, яка забороняє доступ до цієї команди: {0}",
            any_role: "Вам потрібна одна з цих ролей для використання команди: {0}",
          },
        },
      },
      components: {
        bot_permission: "Мені потрібні наступні права: {0}",
      },
      component: {
        user_permission: "Вам потрібне право **{0}** для використання цього компонента",
      },
    },
    join_to_create: {
      preset: {
        placeholder: "Виберіть пресет",
        default_description: "Стандартный пресет каналу",
        add: "Без Пресету",
        add_description: "Створити канал без пресету",
      },
      embed: {
        title: "Налаштування Каналу",
        description: "Керування налаштуваннями вашого голосового каналу",
      },
      up_select: {
        placeholder: "Налаштування Каналу",
        options: {
          rename: {
            label: "Перейменувати Канал",
            description: "Змінити назву каналу",
          },
          bitrate: {
            label: "Встановити Бітрейт",
            description: "Налаштувати якість звуку",
          },
          limit: {
            label: "Ліміт Користувачів",
            description: "Встановити максимальну кількість користувачів",
          },
          owner: {
            label: "Передати Владіння",
            description: "Передати володіння каналом іншому користувачу",
          },
        },
      },
      down_select: {
        placeholder: "Права Каналу",
        options: {
          open: {
            label: "Відкрити Канал",
            description: "Дозволити всім приєднуватися",
          },
          close: {
            label: "Закрити Канал",
            description: "Заборонити новим користувачам приєднуватися",
          },
          add: {
            label: "Додати Користувача/Роль",
            description: "Надати доступ певним користувачам або ролям",
          },
          remove: {
            label: "Видалити Користувача/Роль",
            description: "Відкликати доступ у користувачів або ролей",
          },
          show: {
            label: "Показати Канал",
            description: "Зробити канал видимим для всіх",
          },
          hide: {
            label: "Приховати Канал",
            description: "Приховати канал від не-участників",
          },
        },
      },
      modals: {
        rename: {
          title: "Перейменувати канал",
          label: "Нова назва каналу",
          success: "Канал перейменовано в **{0}**",
        },
        bitrate: {
          title: "Встановити бітрейт",
          label: "Бітрейт (кбіт/с)",
          placeholder: "8 - {0}",
          success: "Бітрейт встановлено на **{0} кбіт/с**",
          isnan: "Будь ласка, введіть коректне число між 8 та {0}",
          less: "Бітрейт повинен бути не менше 8 кбіт/с",
        },
        limit: {
          title: "Встановити ліміт користувачів",
          label: "Ліміт користувачів",
          placeholder: "0 = без обмежень",
          success: "Ліміт користувачів встановлено на **{0}**",
          isnan: "Будь ласка, введіть коректне число",
          less: "Ліміт користувачів не може бути від'ємним",
        },
      },
      select_menus: {
        owner: {
          msg: "Виберіть нового власника канала",
          placeholder: "Виберіть користувача",
        },
        add: {
          msg: "Виберіть користувачів або ролі для додавання в канал",
          placeholder: {
            user: "Виберіть користувачів",
            role: "Виберіть ролі",
          },
        },
        remove: {
          msg: "Виберіть користувачів або ролі для видалення з каналу",
          placeholder: {
            user: "Виберіть користувачів",
            role: "Виберіть ролі",
          },
        },
      },
      errors: {
        not_owner: "Ви не є власником цього каналу!",
        yourself: "Ви не можете передати володіння самому собі!",
      },
      msg: {
        owner: "Володіння каналом передано {0}",
        open: "Канал тепер відкритий для всіх",
        close: "Канал тепер закритий",
        show: "Канал тепер видимий всім",
        hide: "Канал тепер прихований",
        add: {
          role: "Ролі додані в канал: {0}",
          user: "Користувачі додані в канал: {0}",
        },
        remove: {
          role: "Ролі видалені з каналу: {0}",
          user: "Користувачі видалені з каналу: {0}",
        },
      },
    },
  },

  permissions: {
    add_reactions: "Додавати реакції",
    administrator: "Адміністратор",
    attach_files: "Прикріплювати файли",
    ban_members: "Банити учасників",
    change_nickname: "Змінювати нікнейм",
    connect: "Підключатися до голосових каналів",
    create_instant_invite: "Створювати запрошення",
    deafen_members: "Вимикати звук учасникам",
    embed_links: "Вбудовувати посилання",
    kick_members: "Виганяти учасників",
    manage_channels: "Керувати каналами",
    manage_emojis_and_stickers: "Керувати емодзі та стікерами",
    manage_events: "Керувати подіями",
    manage_guild: "Керувати сервером",
    manage_messages: "Керувати повідомленнями",
    manage_nicknames: "Керувати нікнеймами",
    manage_roles: "Керувати ролями",
    manage_threads: "Керувати гілками",
    manage_webhooks: "Керувати вебхуками",
    mention_everyone: "Згадувати всіх",
    moderate_members: "Тайм-аут учасникам",
    move_members: "Переміщувати учасників",
    mute_members: "Вимикати мікрофон учасникам",
    priority_speaker: "Пріоритетний режим",
    read_message_history: "Читати історію повідомлень",
    request_to_speak: "Запитувати слово",
    send_messages: "Відправляти повідомлення",
    send_messages_in_threads: "Відправляти повідомлення в гілках",
    send_tts_messages: "Відправляти TTS повідомлення",
    speak: "Говорить",
    stream: "Відео",
    use_application_commands: "Використовувати команди додатків",
    use_embedded_activities: "Використовувати активності",
    use_external_emojis: "Використовувати зовнішні емодзі",
    use_external_stickers: "Використовувати зовнішні стікери",
    use_vad: "Використовувати режим активації голосом",
    view_audit_log: "Переглядати журнал аудиту",
    view_channel: "Переглядати канали",
    view_guild_insights: "Переглядати аналітику сервера",
  },

  icons: {
    empty: "Порожнє місце",
  },

  time_units: {
    day: {
      short: "д",
      forms: {
        one: " день",
        few: " дні",
        many: " днів",
        other: " днів",
      },
    },
    hour: {
      short: "г",
      forms: {
        one: " година",
        few: " години",
        many: " годин",
        other: " годин",
      },
    },
    minute: {
      short: "хв",
      forms: {
        one: " хвилина",
        few: " хвилини",
        many: " хвилин",
        other: " хвилин",
      },
    },
    second: {
      short: "с",
      forms: {
        one: " секунда",
        few: " секунди",
        many: " секунд",
        other: " секунд",
      },
    },
  }
};
