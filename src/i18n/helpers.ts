import { Client } from "discord.js";
import { TranslationKey } from "../types/i18n/TranslationSchema";

/**
 * Хелпер для получения переводов из клиента
 * @param client - Discord клиент
 * @param lang - Код языка
 * @param key - Ключ перевода
 * @param args - Аргументы для подстановки
 * @returns Переведенная строка
 */
export function t(client: Client, lang: string, key: TranslationKey, ...args: any[]): string {
  const i18n = client.holder.i18n.get(lang);

  if (!i18n) {
    console.warn(`Language "${lang}" not found, using default`);
    return client.holder.i18n.getDefault().t(key, ...args);
  }

  return i18n.t(key, ...args);
}

/**
 * Хелпер для получения объекта i18n
 * @param client - Discord клиент
 * @param lang - Код языка
 */
export function getI18n(client: Client, lang: string) {
  return client.holder.i18n.get(lang) || client.holder.i18n.getDefault();
}

