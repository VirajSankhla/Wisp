import { randomBytes, toB64 } from "./crypto.ts";

const ALPHABET = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";

export const PAIR_CODE_PREFIX = "WSP";
export const OFFER_TTL_MS = 5 * 60 * 1000;

/** 80 bits of entropy as WSP-XXXX-XXXX-XXXX-XXXX. Pairing only — never a device password. */
export function formatPairingCode(bytes: Uint8Array): string {
  let bits = 0;
  let acc = 0;
  let out = "";
  for (const b of bytes) {
    acc = (acc << 8) | b;
    bits += 8;
    while (bits >= 5) {
      bits -= 5;
      out += ALPHABET[(acc >> bits) & 31];
    }
  }
  if (bits > 0) out += ALPHABET[(acc << (5 - bits)) & 31];
  const body = out.slice(0, 16);
  return `${PAIR_CODE_PREFIX}-${body.slice(0, 4)}-${body.slice(4, 8)}-${body.slice(8, 12)}-${body.slice(12, 16)}`;
}

export function mintPairingCode(): { code: string; secret: string } {
  const bytes = randomBytes(10);
  return { code: formatPairingCode(bytes), secret: toB64(randomBytes(32)) };
}

export function normalizePairingCode(raw: string): string {
  return raw
    .trim()
    .toUpperCase()
    .replace(/[^0-9A-Z]/g, "")
    .replace(/^WSP/, "WSP-")
    .replace(/^WSP-([A-Z0-9]{4})([A-Z0-9]{4})([A-Z0-9]{4})([A-Z0-9]{4})$/, "WSP-$1-$2-$3-$4");
}

export function isPairingCodeShape(code: string): boolean {
  return /^WSP-[0-9A-Z]{4}-[0-9A-Z]{4}-[0-9A-Z]{4}-[0-9A-Z]{4}$/.test(
    normalizePairingCode(code),
  );
}
