/** @jsx createElement */
import {
  Filters,
  FontWeight,
  Gradient,
  Group,
  ImageLayer,
  MorphLayer,
  TextLayer,
  createElement,
} from "@nmmty/lazycanvas";
import {
  BANNER_HEIGHT,
  BANNER_WIDTH,
  BannerBackground,
  BannerLayer,
  BannerStats,
  ServerBanner,
} from "../../types/helpers";
import { createScene, renderScene } from "../canvas/scene";
import { loadBannerImage } from "./images";
import { fillBannerText, metricValue } from "./placeholders";

/**
 * Draws a banner. The dashboard draws the same banner in the browser for its preview
 * (`src/components/banners/bannerScene.tsx` there), so the two builders change together.
 */

type Node = ReturnType<typeof createElement>;

const box = (layer: BannerLayer) => ({
  position: "absolute" as const,
  left: Math.round(layer.x),
  top: Math.round(layer.y),
  width: Math.round(layer.width),
  height: Math.round(layer.height),
});

const radiusOf = (radius: number, layer: BannerLayer) =>
  Math.round(Math.min(radius, layer.width / 2, layer.height / 2));

/** Start and end of a CSS-style linear gradient (0° is up, 90° is right) across the banner. */
export function gradientLine(angle: number) {
  const rad = (angle * Math.PI) / 180;
  const dx = Math.sin(rad);
  const dy = -Math.cos(rad);
  const half = (Math.abs(BANNER_WIDTH * dx) + Math.abs(BANNER_HEIGHT * dy)) / 2;
  const cx = BANNER_WIDTH / 2;
  const cy = BANNER_HEIGHT / 2;
  return {
    from: { x: cx - dx * half, y: cy - dy * half },
    to: { x: cx + dx * half, y: cy + dy * half },
  };
}

const full = {
  position: "absolute" as const,
  left: 0,
  top: 0,
  width: BANNER_WIDTH,
  height: BANNER_HEIGHT,
};
const fullSize = { width: BANNER_WIDTH, height: BANNER_HEIGHT, radius: { all: 0 } };

async function backgroundNodes(
  background: BannerBackground,
  stats: BannerStats,
  timezone: string,
  guildId: string,
): Promise<Node[]> {
  if (background.type === "gradient") {
    const line = gradientLine(background.angle);
    const gradient = new Gradient()
      .setType("linear")
      .setPoints(line.from, line.to)
      .setStops({ offset: 0, color: background.from }, { offset: 1, color: background.to });
    return [<MorphLayer layout={full} size={fullSize} color={gradient} />];
  }

  if (background.type === "image") {
    const src = await loadBannerImage(fillBannerText(background.src, stats, timezone), guildId);
    const nodes: Node[] = [<MorphLayer layout={full} size={fullSize} color={background.color} />];
    if (src) {
      // A blurred picture fades at its edges, so it is drawn a little larger than the banner.
      const bleed = background.blur > 0 ? background.blur * 2 : 0;
      nodes.push(
        <ImageLayer
          layout={{
            position: "absolute",
            left: -bleed,
            top: -bleed,
            width: BANNER_WIDTH + bleed * 2,
            height: BANNER_HEIGHT + bleed * 2,
          }}
          size={{ width: BANNER_WIDTH + bleed * 2, height: BANNER_HEIGHT + bleed * 2 }}
          src={src}
          placeholder={false}
          filter={background.blur > 0 ? Filters.blur(background.blur) : undefined}
        />,
      );
      if (background.dim > 0) {
        nodes.push(
          <MorphLayer
            layout={full}
            size={fullSize}
            color={background.color}
            opacity={background.dim / 100}
          />,
        );
      }
    }
    return nodes;
  }

  return [<MorphLayer layout={full} size={fullSize} color={background.color} />];
}

async function layerNodes(
  layer: BannerLayer,
  stats: BannerStats,
  timezone: string,
  guildId: string,
): Promise<Node[]> {
  const opacity = layer.opacity / 100;

  switch (layer.type) {
    case "shape":
      return [
        <MorphLayer
          layout={box(layer)}
          size={{
            width: Math.round(layer.width),
            height: Math.round(layer.height),
            radius: { all: radiusOf(layer.radius, layer) },
          }}
          color={layer.color}
          opacity={opacity}
        />,
        ...(layer.stroke_color && layer.stroke_width > 0
          ? [
              <MorphLayer
                layout={box(layer)}
                size={{
                  width: Math.round(layer.width),
                  height: Math.round(layer.height),
                  radius: { all: radiusOf(layer.radius, layer) },
                }}
                color={layer.stroke_color}
                stroke={{ width: layer.stroke_width }}
                opacity={opacity}
              />,
            ]
          : []),
      ];

    case "text": {
      const text = fillBannerText(layer.text, stats, timezone);
      if (!text) return [];
      const justify =
        layer.align === "center" ? "center" : layer.align === "right" ? "flex-end" : "flex-start";
      return [
        <Group
          layout={{
            ...box(layer),
            flexDirection: "row",
            alignItems: "center",
            justifyContent: justify,
          }}
        >
          <TextLayer
            text={text}
            font={{ family: layer.font, size: layer.size, weight: FontWeight.Regular }}
            color={layer.color}
            align={layer.align}
            baseline="middle"
            shadow={layer.shadow ? { color: "#000000", blur: 4, offsetY: 1 } : undefined}
            opacity={opacity}
          />
        </Group>,
      ];
    }

    case "image":
    case "avatar": {
      const link =
        layer.type === "avatar"
          ? layer.source === "top_member"
            ? (stats.top?.avatar ?? "")
            : stats.guild_icon
          : fillBannerText(layer.src, stats, timezone);
      const picture = link ? await loadBannerImage(link, guildId) : null;
      const radius = radiusOf(layer.radius, layer);
      const size = {
        width: Math.round(layer.width),
        height: Math.round(layer.height),
        radius: { all: radius },
      };

      const nodes: Node[] = [];
      if (layer.type === "avatar" && layer.border_width > 0) {
        nodes.push(
          <MorphLayer
            layout={box(layer)}
            size={size}
            color={layer.border_color}
            stroke={{ width: layer.border_width }}
            opacity={opacity}
          />,
        );
      }
      nodes.push(
        picture ? (
          <ImageLayer
            layout={box(layer)}
            size={size}
            src={picture}
            placeholder={false}
            opacity={opacity}
          />
        ) : (
          // No picture (nobody has written yet, the link is broken): a quiet stand-in.
          <MorphLayer
            layout={box(layer)}
            size={size}
            color="rgba(255,255,255,0.12)"
            opacity={opacity}
          />
        ),
      );
      return nodes;
    }

    case "progress": {
      const ratio = Math.min(1, Math.max(0, metricValue(stats, layer.metric) / layer.goal));
      const width = Math.round(layer.width);
      const height = Math.round(layer.height);
      const radius = radiusOf(layer.radius, layer);
      // Never narrower than its own height, or the rounded ends would turn into a blob.
      const filled = ratio === 0 ? 0 : Math.max(Math.min(height, width), Math.round(width * ratio));
      return [
        <MorphLayer
          layout={box(layer)}
          size={{ width, height, radius: { all: radius } }}
          color={layer.track_color}
          opacity={opacity}
        />,
        ...(filled > 0
          ? [
              <MorphLayer
                layout={{ ...box(layer), width: filled }}
                size={{ width: filled, height, radius: { all: radius } }}
                color={layer.color}
                opacity={opacity}
              />,
            ]
          : []),
      ];
    }
  }
}

/** Renders the banner to a PNG. */
export async function renderBanner(
  banner: ServerBanner,
  stats: BannerStats,
  guildId: string,
): Promise<Buffer> {
  const scene = createScene(BANNER_WIDTH, BANNER_HEIGHT);

  const nodes: Node[] = await backgroundNodes(banner.background, stats, banner.timezone, guildId);
  for (const layer of banner.layers) {
    if (!layer.visible) continue;
    nodes.push(...(await layerNodes(layer, stats, banner.timezone, guildId)));
  }

  scene.load(
    <Group layout={{ width: BANNER_WIDTH, height: BANNER_HEIGHT, position: "relative" }}>
      {nodes}
    </Group>,
  );

  return renderScene(scene);
}
