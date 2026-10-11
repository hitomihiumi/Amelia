/** @jsx createElement */
import { ImageLayer, MorphLayer, createElement } from "@nmmty/lazycanvas";
import { prisma } from "../../database";

/**
 * The picture behind a card. It was cut to the size of the card when the member uploaded it, so it
 * is drawn as it is, with the corners of the card, and darkened by `dim` percent so the text on
 * top stays readable. Replaces the coloured blobs the card is otherwise decorated with.
 */
export function cardBackgroundLayers(
  background: Buffer,
  dim: number,
  width: number,
  height: number,
  radius: number,
) {
  const layout = { position: "absolute" as const, left: 0, top: 0, width, height };
  const size = { width, height, radius: { all: radius } };
  const darkness = Math.min(100, Math.max(0, dim)) / 100;

  return [
    <ImageLayer layout={layout} size={size} src={background} placeholder={false} />,
    ...(darkness > 0
      ? [<MorphLayer layout={layout} size={size} color="#000000" opacity={darkness} />]
      : []),
  ];
}

const UPLOAD = /^upload:([A-Za-z0-9_-]{10,40})$/;

/**
 * The picture a member chose for one of their cards, or null when the card has none (or its
 * picture is gone). `mode` is the member's switch for it; the picture of another member is never
 * handed out.
 */
export async function loadCardBackground(
  options: { mode: boolean; url: string | null },
  userId: string,
  kind: "rank" | "profile" | "level_up",
): Promise<Buffer | null> {
  const id = options.mode && options.url ? UPLOAD.exec(options.url)?.[1] : null;
  if (!id) return null;

  const row = await prisma.cardBackground
    .findFirst({ where: { id, userId, kind }, select: { data: true } })
    .catch(() => null);
  return row ? Buffer.from(row.data) : null;
}
