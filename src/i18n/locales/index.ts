import { I18n, I18nManager } from "../I18n";
import { en } from "./en";
import { ru } from "./ru";

/**
 * Initialize the translation system
 */
export function initializeI18n(): I18nManager {
  const manager = new I18nManager();

  // Create English language (base/fallback)
  const enLang = new I18n(
    {
      name: "English",
      code: "en",
      flag: "🇬🇧",
      nativeName: "English",
    },
    en,
  );

  // Create Russian language with fallback to English
  const ruLang = new I18n(
    {
      name: "Russian",
      code: "ru",
      flag: "🇷🇺",
      nativeName: "Русский",
    },
    ru,
    enLang, // Fallback to English
  );

  // Register languages
  manager.register(enLang);
  manager.register(ruLang);

  // Set English as the default language
  manager.setDefault("en");

  return manager;
}

// Export languages for direct use (if needed)
export { en, ru };
