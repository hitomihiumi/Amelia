import { NodeCanvasAdapter } from "@nmmty/adapter-node";
import { Scene } from "@nmmty/lazycanvas";
import { Fonts } from "@nmmty/lazycanvas/fonts";
import { Exporter } from "@nmmty/lazycanvas/node";
import { fontMap } from "../assetsMap";

/**
 * LazyCanvas 1.0 draws through an adapter. One instance is enough for the whole bot: it holds
 * no per-scene state, only the (process-wide) font registry of @napi-rs/canvas.
 */
export const canvasAdapter = new NodeCanvasAdapter();

/** `Path2D` of the adapter, for paths that are built by hand instead of from an SVG string. */
export const Path2D = canvasAdapter.Path2D;

// The font registry is global, so fonts are registered once here and not on every render.
for (const font of Object.values(fontMap)) {
  if (font.path) canvasAdapter.fonts.registerFromPath(font.path, font.family);
}

// Geist (cards that use `FontsList`) is opt-in since LazyCanvas 1.0.
for (const [family, weights] of Object.entries(Fonts)) {
  for (const data of Object.values(weights)) {
    canvasAdapter.fonts.register(
      typeof data === "string" ? data : Buffer.from(data).toString("base64"),
      family,
    );
  }
}

/** A scene is rendered one frame at a time and holds its layers, so every card makes its own. */
export function createScene(width: number, height: number): Scene {
  return new Scene(width, height, { adapter: canvasAdapter });
}

/** Renders the scene to a PNG. */
export async function renderScene(scene: Scene): Promise<Buffer> {
  return (await new Exporter(scene).export("png")) as Buffer;
}
