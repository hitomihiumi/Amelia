import axios from "axios";
import type { AiImage } from "./gemini";

/**
 * Pictures for the model. Only attachments of the message itself are used, downloaded from
 * Discord's own CDN and nowhere else, so what the AI looks at can never be a link someone
 * pointed the bot at. Anything over the limits, or not a plain PNG, JPEG or WebP, is skipped.
 */

function envInt(name: string, fallback: number): number {
  const value = Number.parseInt(process.env[name] ?? "", 10);
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

/** Pictures looked at per message. */
export const AI_MAX_IMAGES = envInt("AI_MAX_IMAGES", 3);
/** Largest single picture, in bytes. */
export const AI_MAX_IMAGE_BYTES = envInt("AI_MAX_IMAGE_BYTES", 4 * 1024 * 1024);
/** All pictures of one message together, in bytes: they travel inside the request. */
const MAX_TOTAL_BYTES = AI_MAX_IMAGE_BYTES * 2;
const DOWNLOAD_TIMEOUT_MS = 10_000;

/** Hosts Discord serves attachments from. */
const DISCORD_CDN = /(^|\.)discordapp\.(com|net)$/i;

export interface AttachmentInfo {
  url: string;
  contentType: string | null;
  size: number;
}

/** The format of a picture by its first bytes, whatever the sender claimed. */
export function sniffImage(bytes: Uint8Array): AiImage["mimeType"] | null {
  if (
    bytes.length >= 8 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47
  ) {
    return "image/png";
  }
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return "image/jpeg";
  }
  if (
    bytes.length >= 12 &&
    String.fromCharCode(...bytes.subarray(0, 4)) === "RIFF" &&
    String.fromCharCode(...bytes.subarray(8, 12)) === "WEBP"
  ) {
    return "image/webp";
  }
  return null;
}

/** Attachments that may be a picture the model can read, before anything is downloaded. */
export function pickCandidates(attachments: AttachmentInfo[]): AttachmentInfo[] {
  return attachments
    .filter((attachment) => {
      if (attachment.size > AI_MAX_IMAGE_BYTES) return false;
      // The type Discord reports is only a hint; an unknown one is still checked after download.
      if (attachment.contentType && !/^image\/(png|jpe?g|webp)/i.test(attachment.contentType)) {
        return false;
      }
      try {
        const url = new URL(attachment.url);
        return url.protocol === "https:" && DISCORD_CDN.test(url.hostname);
      } catch {
        return false;
      }
    })
    .slice(0, AI_MAX_IMAGES);
}

export interface FetchedImages {
  images: AiImage[];
  /** Attachments that looked like pictures but could not be used. */
  skipped: number;
}

/** Download the pictures among a message's attachments. Never throws; failures are counted. */
export async function fetchImages(attachments: AttachmentInfo[]): Promise<FetchedImages> {
  const candidates = pickCandidates(attachments);

  const results = await Promise.all(
    candidates.map(async (attachment): Promise<AiImage | null> => {
      try {
        const { data } = await axios.get<ArrayBuffer>(attachment.url, {
          responseType: "arraybuffer",
          timeout: DOWNLOAD_TIMEOUT_MS,
          maxContentLength: AI_MAX_IMAGE_BYTES,
          maxBodyLength: AI_MAX_IMAGE_BYTES,
          // A redirect could lead off Discord's CDN.
          maxRedirects: 0,
        });
        const bytes = new Uint8Array(data);
        const mimeType = sniffImage(bytes);
        if (!mimeType) return null;
        return { mimeType, data: Buffer.from(bytes).toString("base64") };
      } catch {
        return null;
      }
    }),
  );

  const images: AiImage[] = [];
  let total = 0;
  for (const image of results) {
    if (!image) continue;
    const size = Math.floor((image.data.length * 3) / 4);
    if (total + size > MAX_TOTAL_BYTES) continue;
    total += size;
    images.push(image);
  }

  return { images, skipped: candidates.length - images.length };
}
