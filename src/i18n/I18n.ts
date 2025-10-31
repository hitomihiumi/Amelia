import { TranslationSchema, TranslationKey } from "../types/i18n/TranslationSchema";

/**
 * Language metadata
 */
export interface LanguageMetadata {
  name: string;
  code: string;
  flag: string;
  nativeName: string;
}

/**
 * Enhanced class for working with translations
 */
export class I18n {
  public readonly metadata: LanguageMetadata;
  private translations: TranslationSchema;
  private fallback?: I18n;

  constructor(metadata: LanguageMetadata, translations: TranslationSchema, fallback?: I18n) {
    this.metadata = metadata;
    this.translations = translations;
    this.fallback = fallback;
  }

  /**
   * Get translation by key with variable substitution support
   * @param key - Translation key (type-safe)
   * @param args - Variables for substitution
   * @returns Translated string
   */
  public t(key: TranslationKey, ...args: any[]): string {
    const value = this.getByPath(key);

    if (value === undefined) {
      console.warn(`Translation key "${key}" not found for language "${this.metadata.code}"`);

      // Try to get from fallback language
      if (this.fallback) {
        return this.fallback.t(key, ...args);
      }

      return `[Missing: ${key}]`;
    }

    // Replace variables
    return this.replaceVariables(value, args);
  }

  /**
   * Check if translation key exists
   * @param key - Translation key
   */
  public has(key: TranslationKey): boolean {
    return this.getByPath(key) !== undefined;
  }

  /**
   * Get all translations (for debugging)
   */
  public getAll(): TranslationSchema {
    return this.translations;
  }

  /**
   * Update translations
   * @param translations - New translations
   */
  public update(translations: Partial<TranslationSchema>): void {
    this.translations = this.deepMerge(this.translations, translations) as TranslationSchema;
  }

  /**
   * Get value by path (for example, "common.error.title")
   */
  private getByPath(path: string): string | undefined {
    const keys = path.split(".");
    let current: any = this.translations;

    for (const key of keys) {
      if (current && typeof current === "object" && key in current) {
        current = current[key];
      } else {
        return undefined;
      }
    }

    return typeof current === "string" ? current : undefined;
  }

  /**
   * Replace variables in string
   * Supports: {0}, {1}, {2} or %{VAR}%
   */
  private replaceVariables(text: string, args: any[]): string {
    let result = text;

    // Replace {0}, {1}, {2}, etc.
    args.forEach((arg, index) => {
      result = result.replace(new RegExp(`\\{${index}\\}`, "g"), String(arg));
    });

    // Replace %{VAR}% (backward compatibility)
    args.forEach((arg) => {
      result = result.replace(/%\{VAR\}%/, String(arg));
    });

    return result;
  }

  /**
   * Deep merge objects
   */
  private deepMerge(target: any, source: any): any {
    const output = { ...target };

    if (this.isObject(target) && this.isObject(source)) {
      Object.keys(source).forEach((key) => {
        if (this.isObject(source[key])) {
          if (!(key in target)) {
            output[key] = source[key];
          } else {
            output[key] = this.deepMerge(target[key], source[key]);
          }
        } else {
          output[key] = source[key];
        }
      });
    }

    return output;
  }

  /**
   * Check if value is an object
   */
  private isObject(item: any): boolean {
    return item && typeof item === "object" && !Array.isArray(item);
  }
}

/**
 * Language manager
 */
export class I18nManager {
  private languages: Map<string, I18n> = new Map();
  private defaultLanguage: string = "en";

  /**
   * Register a language
   */
  public register(language: I18n): void {
    this.languages.set(language.metadata.code, language);
  }

  /**
   * Set default language
   */
  public setDefault(code: string): void {
    if (!this.languages.has(code)) {
      throw new Error(`Language "${code}" is not registered`);
    }
    this.defaultLanguage = code;
  }

  /**
   * Get language by code
   */
  public get(code: string): I18n | undefined {
    return this.languages.get(code);
  }

  /**
   * Get default language
   */
  public getDefault(): I18n {
    const lang = this.languages.get(this.defaultLanguage);
    if (!lang) {
      throw new Error(`Default language "${this.defaultLanguage}" is not registered`);
    }
    return lang;
  }

  /**
   * Get all registered languages
   */
  public getAll(): I18n[] {
    return Array.from(this.languages.values());
  }

  /**
   * Check if language exists
   */
  public has(code: string): boolean {
    return this.languages.has(code);
  }

  /**
   * Get list of language codes
   */
  public getCodes(): string[] {
    return Array.from(this.languages.keys());
  }
}
