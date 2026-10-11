import dns from "node:dns/promises";
import net from "node:net";

/** Pictures bigger than this are refused: a banner is a 960×540 image, not a photo album. */
const MAX_BYTES = 8 * 1024 * 1024;
const TIMEOUT_MS = 10_000;
const MAX_REDIRECTS = 3;
const CACHE_TTL_MS = 10 * 60_000;
const CACHE_SIZE = 40;

const cache = new Map<string, { at: number; data: Buffer | null }>();

/** Addresses a banner picture must never be fetched from: the bot's own network. */
function isPrivateAddress(address: string): boolean {
  if (net.isIPv4(address)) {
    const [a, b] = address.split(".").map(Number);
    return (
      a === 0 ||
      a === 10 ||
      a === 127 ||
      (a === 100 && b >= 64 && b <= 127) ||
      (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168) ||
      a >= 224
    );
  }
  if (net.isIPv6(address)) {
    const lower = address.toLowerCase();
    if (lower === "::1" || lower === "::") return true;
    if (lower.startsWith("fe80") || lower.startsWith("fc") || lower.startsWith("fd")) return true;
    // IPv4 mapped addresses (::ffff:10.0.0.1)
    const mapped = /^::ffff:(\d+\.\d+\.\d+\.\d+)$/.exec(lower);
    return mapped ? isPrivateAddress(mapped[1]) : false;
  }
  return true;
}

async function assertPublic(url: URL): Promise<void> {
  if (url.protocol !== "https:") throw new Error("only https links are allowed");
  const host = url.hostname.replace(/^\[|\]$/g, "");
  if (net.isIP(host)) {
    if (isPrivateAddress(host)) throw new Error("private address");
    return;
  }
  const records = await dns.lookup(host, { all: true });
  if (records.length === 0 || records.some((record) => isPrivateAddress(record.address))) {
    throw new Error("private address");
  }
}

async function download(link: string): Promise<Buffer> {
  let url = new URL(link);

  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    await assertPublic(url);

    const response = await fetch(url, {
      redirect: "manual",
      signal: AbortSignal.timeout(TIMEOUT_MS),
      headers: { Accept: "image/*" },
    });

    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get("location");
      if (!location) throw new Error("redirect without a location");
      url = new URL(location, url);
      continue;
    }
    if (!response.ok) throw new Error(`status ${response.status}`);

    const type = response.headers.get("content-type") ?? "";
    if (!type.startsWith("image/")) throw new Error("not a picture");

    const length = Number(response.headers.get("content-length") ?? 0);
    if (length > MAX_BYTES) throw new Error("picture is too big");

    const data = Buffer.from(await response.arrayBuffer());
    if (data.byteLength > MAX_BYTES) throw new Error("picture is too big");
    return data;
  }

  throw new Error("too many redirects");
}

/**
 * Downloads a picture the server owner linked to. The bot fetches it itself, from public
 * addresses only, so a banner cannot be used to make the bot call its own network.
 * Returns null when the picture cannot be loaded; the layer is then skipped.
 */
export async function fetchBannerImage(link: string): Promise<Buffer | null> {
  const hit = cache.get(link);
  if (hit && Date.now() - hit.at < CACHE_TTL_MS) return hit.data;

  let data: Buffer | null = null;
  try {
    data = await download(link);
  } catch {
    data = null;
  }

  if (cache.size >= CACHE_SIZE) cache.delete(cache.keys().next().value as string);
  cache.set(link, { at: Date.now(), data });
  return data;
}
