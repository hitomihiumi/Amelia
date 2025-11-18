import path from "node:path";
import { Font, FontWeight } from "@nmmty/lazycanvas";
import { TranslationSchema } from "../types/i18n/TranslationSchema";

export const assetsMap: Record<string, string> = {
  microphone: path.resolve(__dirname, "../../assets/img/mic.png"),
};

export const fontMap: Record<string, Font> = {
  wdxllubrifont: new Font()
    .setFamily("WDXL Lubrifont")
    .setWeight(FontWeight.Regular)
    .setPath(path.resolve(__dirname, "../../assets/fonts/WDXLLubrifontSC.ttf")),
};

export const iconsMap: Record<keyof TranslationSchema["icons"], string> = {
  empty: "",
};
