import { TranslationSchema, TranslationKey } from "../types/i18n/TranslationSchema";

/**
 * Метаданные языка
 */
export interface LanguageMetadata {
  name: string;
  code: string;
  flag: string;
  nativeName: string;
}

/**
 * Улучшенный класс для работы с переводами
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
   * Получить перевод по ключу с поддержкой переменных
   * @param key - Ключ перевода (типобезопасный)
   * @param args - Переменные для подстановки
   * @returns Переведенная строка
   */
  public t(key: TranslationKey, ...args: any[]): string {
    const value = this.getByPath(key);

    if (value === undefined) {
      console.warn(`Translation key "${key}" not found for language "${this.metadata.code}"`);

      // Попытка получить из fallback языка
      if (this.fallback) {
        return this.fallback.t(key, ...args);
      }

      return `[Missing: ${key}]`;
    }

    // Подстановка переменных
    return this.replaceVariables(value, args);
  }

  /**
   * Проверить существование ключа перевода
   * @param key - Ключ перевода
   */
  public has(key: TranslationKey): boolean {
    return this.getByPath(key) !== undefined;
  }

  /**
   * Получить все переводы (для отладки)
   */
  public getAll(): TranslationSchema {
    return this.translations;
  }

  /**
   * Обновить переводы
   * @param translations - Новые переводы
   */
  public update(translations: Partial<TranslationSchema>): void {
    this.translations = this.deepMerge(this.translations, translations) as TranslationSchema;
  }

  /**
   * Получить значение по пути (например, "common.error.title")
   */
  private getByPath(path: string): string | undefined {
    const keys = path.split('.');
    let current: any = this.translations;

    for (const key of keys) {
      if (current && typeof current === 'object' && key in current) {
        current = current[key];
      } else {
        return undefined;
      }
    }

    return typeof current === 'string' ? current : undefined;
  }

  /**
   * Заменить переменные в строке
   * Поддерживает: {0}, {1}, {2} или %{VAR}%
   */
  private replaceVariables(text: string, args: any[]): string {
    let result = text;

    // Замена {0}, {1}, {2} и т.д.
    args.forEach((arg, index) => {
      result = result.replace(new RegExp(`\\{${index}\\}`, 'g'), String(arg));
    });

    // Замена %{VAR}% (обратная совместимость)
    args.forEach((arg) => {
      result = result.replace(/%\{VAR\}%/, String(arg));
    });

    return result;
  }

  /**
   * Глубокое слияние объектов
   */
  private deepMerge(target: any, source: any): any {
    const output = { ...target };

    if (this.isObject(target) && this.isObject(source)) {
      Object.keys(source).forEach(key => {
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
   * Проверка является ли значение объектом
   */
  private isObject(item: any): boolean {
    return item && typeof item === 'object' && !Array.isArray(item);
  }
}

/**
 * Менеджер языков
 */
export class I18nManager {
  private languages: Map<string, I18n> = new Map();
  private defaultLanguage: string = 'en';

  /**
   * Зарегистрировать язык
   */
  public register(language: I18n): void {
    this.languages.set(language.metadata.code, language);
  }

  /**
   * Установить язык по умолчанию
   */
  public setDefault(code: string): void {
    if (!this.languages.has(code)) {
      throw new Error(`Language "${code}" is not registered`);
    }
    this.defaultLanguage = code;
  }

  /**
   * Получить язык по коду
   */
  public get(code: string): I18n | undefined {
    return this.languages.get(code);
  }

  /**
   * Получить язык по умолчанию
   */
  public getDefault(): I18n {
    const lang = this.languages.get(this.defaultLanguage);
    if (!lang) {
      throw new Error(`Default language "${this.defaultLanguage}" is not registered`);
    }
    return lang;
  }

  /**
   * Получить все зарегистрированные языки
   */
  public getAll(): I18n[] {
    return Array.from(this.languages.values());
  }

  /**
   * Проверить существование языка
   */
  public has(code: string): boolean {
    return this.languages.has(code);
  }

  /**
   * Получить список кодов языков
   */
  public getCodes(): string[] {
    return Array.from(this.languages.keys());
  }
}

