import { ILanguage } from "../types/helpers";
import { reVar } from "../handlers/functions";

export class Language implements ILanguage {
  public name: string;
  public code: string;
  public flag: string;
  public version: string;
  public translations: any;

  constructor(data: any) {
    this.name = data.name;
    this.code = data.code;
    this.flag = data.flag;
    this.version = data.version;
    this.translations = data.translations;
  }

  public get(key: string) {
    return this.translations[key];
  }

  public set(key: string, value: any) {
    this.translations[key] = value;
  }

  public delete(key: string) {
    delete this.translations[key];
  }

  public has(key: string) {
    return this.translations[key] !== undefined;
  }

  public clear() {
    this.translations = {};
  }

  public update(data: any) {
    this.translations = data;
  }

  public getText(path: string, ...args: any[]): string {
    let text = path.split(".").reduce((o, i) => o[i], this.translations);
    if (!text) return "Invalid path";
    text = reVar(text, ...args);
    return text;
  }
}
