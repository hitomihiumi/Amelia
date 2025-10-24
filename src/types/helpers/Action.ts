import { ColorResolvable, EmojiResolvable } from "discord.js";

export interface ModalCustom {
  id: string;
  title: string;
  fields: IModalField[];
}

export interface IModalField {
  id: string;
  name: string;
  placeholder?: string;
  type: "short" | "long";
  min?: number;
  max?: number;
  required: boolean;
}

export interface EmbedCustom {
  id: string;
  title?: string;
  description?: string;
  color?: ColorResolvable;
  author?: {
    name: string;
    icon_url?: string;
    url?: string;
  };
  thumbnail?: string;
  fields?: Field[];
  image?: string;
  footer?: {
    text: string;
    icon_url?: string;
  };
  timestamp?: Date;
}

export interface Field {
  name: string;
  value: string;
  inline?: boolean;
}

export interface ButtonCustom {
  id: string;
  label: string;
  style: "PRIMARY" | "SECONDARY" | "SUCCESS" | "DANGER" | "LINK";
  emoji?: string | EmojiResolvable;
  url?: string;
  disabled?: boolean;
}
