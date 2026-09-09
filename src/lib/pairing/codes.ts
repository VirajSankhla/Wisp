import { fromB64, randomBytes, toB64 } from "./bytes.ts";

export const CODE_PREFIX = "WISP.";
export const OFFER_TTL_MS = 5 * 60 * 1000;
const VERSION = 1;
const SECRET_BYTES = 48;
const PACKED_LEN = 1 + 4 + SECRET_BYTES;

export class PairingError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PairingError";
  }
}

export type ConnectionOffer = {
  code: string;
  secret: Uint8Array;
  exp: number;
};

/**
 * A ~77-character one-time connection code.
 * Format: WISP.<base64url of version + expiry + 48 random bytes>
 * Valid 5 minutes. Not a permanent password — the app derives a vault key
 * from it and then forgets the code.
 */
export function encodeConnectionCode(
  secret: Uint8Array,
  now = Date.now(),
  ttlMs = OFFER_TTL_MS,
): string {
  if (secret.length !== SECRET_BYTES) {
    throw new PairingError("Bad connection secret");
  }
  const expSec = Math.floor((now + ttlMs) / 1000);
  const packed = new Uint8Array(PACKED_LEN);
  packed[0] = VERSION;
  packed[1] = (expSec >>> 24) & 0xff;
  packed[2] = (expSec >>> 16) & 0xff;
  packed[3] = (expSec >>> 8) & 0xff;
  packed[4] = expSec & 0xff;
  packed.set(secret, 5);
  return `${CODE_PREFIX}${toB64(packed)}`;
}

export function mintConnectionCode(
  now = Date.now(),
  ttlMs = OFFER_TTL_MS,
): ConnectionOffer {
  const secret = randomBytes(SECRET_BYTES);
  return {
    code: encodeConnectionCode(secret, now, ttlMs),
    secret,
    exp: now + ttlMs,
  };
}

export function normalizeConnectionCode(raw: string): string {
  return raw.trim().replace(/\s+/g, "");
}

export function parseConnectionCode(
  raw: string,
  now = Date.now(),
): { secret: Uint8Array; exp: number } {
  const text = normalizeConnectionCode(raw);
  if (!text.startsWith(CODE_PREFIX)) {
    throw new PairingError("That is not a Wisp connection code");
  }
  let packed: Uint8Array;
  try {
    packed = fromB64(text.slice(CODE_PREFIX.length));
  } catch {
    throw new PairingError("That code is damaged");
  }
  if (packed.length !== PACKED_LEN || packed[0] !== VERSION) {
    throw new PairingError("That is not a Wisp connection code");
  }
  const expSec =
    ((packed[1] << 24) | (packed[2] << 16) | (packed[3] << 8) | packed[4]) >>> 0;
  const exp = expSec * 1000;
  if (now > exp) throw new PairingError("This connection code has expired");
  return { secret: packed.slice(5), exp };
}

export function isConnectionCodeShape(raw: string): boolean {
  const text = normalizeConnectionCode(raw);
  return (
    text.startsWith(CODE_PREFIX) &&
    text.length >= 50 &&
    text.length <= 100
  );
}
