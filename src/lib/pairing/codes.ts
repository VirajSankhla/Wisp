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

export type LanEndpoint = { host: string; port: number };

export type ConnectionOffer = {
  code: string;
  secret: Uint8Array;
  exp: number;
};

const LAN_BYTES = 6;
const PACKED_V2 = PACKED_LEN + LAN_BYTES;

function packLan(lan?: LanEndpoint): Uint8Array | null {
  if (!lan) return null;
  const parts = lan.host.split(".").map((p) => Number(p));
  if (parts.length !== 4 || parts.some((n) => !Number.isInteger(n) || n < 0 || n > 255)) {
    return null;
  }
  const out = new Uint8Array(LAN_BYTES);
  out[0] = parts[0];
  out[1] = parts[1];
  out[2] = parts[2];
  out[3] = parts[3];
  out[4] = (lan.port >>> 8) & 0xff;
  out[5] = lan.port & 0xff;
  return out;
}

/**
 * A ~77-character one-time connection code.
 * Format: WISP.<base64url of version + expiry + 48 random bytes>
 * Optional LAN tail (version 2) carries the phone's Wi-Fi address for auto-update.
 * Valid 5 minutes. Not a permanent password — the app derives a vault key
 * from it and then forgets the code.
 */
export function encodeConnectionCode(
  secret: Uint8Array,
  now = Date.now(),
  ttlMs = OFFER_TTL_MS,
  lan?: LanEndpoint,
): string {
  if (secret.length !== SECRET_BYTES) {
    throw new PairingError("Bad connection secret");
  }
  const extra = packLan(lan);
  const expSec = Math.floor((now + ttlMs) / 1000);
  const packed = new Uint8Array(extra ? PACKED_V2 : PACKED_LEN);
  packed[0] = extra ? 2 : VERSION;
  packed[1] = (expSec >>> 24) & 0xff;
  packed[2] = (expSec >>> 16) & 0xff;
  packed[3] = (expSec >>> 8) & 0xff;
  packed[4] = expSec & 0xff;
  packed.set(secret, 5);
  if (extra) packed.set(extra, PACKED_LEN);
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
): { secret: Uint8Array; exp: number; lan?: LanEndpoint } {
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
  const version = packed[0];
  const okLen =
    (version === 1 && packed.length === PACKED_LEN) ||
    (version === 2 && packed.length === PACKED_V2);
  if (!okLen) {
    throw new PairingError("That is not a Wisp connection code");
  }
  const expSec =
    ((packed[1] << 24) | (packed[2] << 16) | (packed[3] << 8) | packed[4]) >>> 0;
  const exp = expSec * 1000;
  if (now > exp) throw new PairingError("This connection code has expired");
  let lan: LanEndpoint | undefined;
  if (version === 2) {
    lan = {
      host: `${packed[53]}.${packed[54]}.${packed[55]}.${packed[56]}`,
      port: (packed[57] << 8) | packed[58],
    };
  }
  return { secret: packed.slice(5, 53), lan, exp };
}

export function isConnectionCodeShape(raw: string): boolean {
  const text = normalizeConnectionCode(raw);
  return (
    text.startsWith(CODE_PREFIX) &&
    text.length >= 50 &&
    text.length <= 100
  );
}
