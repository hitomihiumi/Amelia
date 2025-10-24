import { I18n, I18nManager } from "../I18n";
import { en } from "./en";
import { ru } from "./ru";

/**
 * Инициализация системы переводов
 */
export function initializeI18n(): I18nManager {
  const manager = new I18nManager();

  // Создаем английский язык (базовый/fallback)
  const enLang = new I18n(
    {
      name: "English",
      code: "en",
      flag: "🇬🇧",
      nativeName: "English",
    },
    en
  );

  // Создаем русский язык с fallback на английский
  const ruLang = new I18n(
    {
      name: "Russian",
      code: "ru",
      flag: "🇷🇺",
      nativeName: "Русский",
    },
    ru,
    enLang // Fallback на английский
  );

  // Регистрируем языки
  manager.register(enLang);
  manager.register(ruLang);

  // Устанавливаем английский как язык по умолчанию
  manager.setDefault("en");

  return manager;
}

// Экспортируем языки для прямого использования (если нужно)
export { en, ru };

