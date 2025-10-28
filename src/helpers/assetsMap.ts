import path from "node:path";
import { Font, FontWeight } from "@nmmty/lazycanvas";

export const assetsMap: Record<string, string> = {
  microphone: path.resolve(__dirname, "../../assets/img/mic.png"),
};

export const fontMap: Record<string, Font> = {
  wdxllubrifont: new Font()
    .setFamily("WDXL Lubrifont")
    .setWeight(FontWeight.Regular)
    .setPath(path.resolve(__dirname, "../../assets/fonts/WDXLLubrifontSC.ttf")),
};

export const iconsMap: Record<string, string> = {};
