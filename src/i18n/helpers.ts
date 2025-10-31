import { Client } from "discord.js";
import { TranslationKey } from "../types/i18n/TranslationSchema";

/**
 * Helper for getting translations from the client
 * @param client - Discord client
 * @param lang - Language code
 * @param key - Translation key
 * @param args - Arguments for substitution
 * @returns Translated string
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
 * Helper for getting the i18n object
 * @param client - Discord client
 * @param lang - Language code
 */
export function getI18n(client: Client, lang: string) {
  return client.holder.i18n.get(lang) || client.holder.i18n.getDefault();
}
