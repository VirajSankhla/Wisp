/** Device identity and pairing signatures. Long-term keys never equal the pairing code. */

export type DeviceIdentity = {
  id: string;
  name: string;
  publicKey: JsonWebKey;
  privateKey: JsonWebKey;
  createdAt: number;
};

export type PublicDevice = {
  id: string;
  name: string;
  publicKey: JsonWebKey;
};

const ALGO = { name: "Ed25519" } as const;

function bytesToB64(bytes: Uint8Array): string {
  let s = "";
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function b64ToBytes(b64: string): Uint8Array {
  const pad = "=".repeat((4 - (b64.length % 4)) % 4);
  const normalized = b64.replace(/-/g, "+").replace(/_/g, "/") + pad;
  const bin = atob(normalized);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i += 1) out[i] = bin.charCodeAt(i);
  return out;
}

export function randomBytes(n: number): Uint8Array {
  const out = new Uint8Array(n);
  crypto.getRandomValues(out);
  return out;
}

export function toB64(bytes: Uint8Array): string {
  return bytesToB64(bytes);
}

export function fromB64(b64: string): Uint8Array {
  return b64ToBytes(b64);
}

export function guessDeviceName(): string {
  if (typeof navigator === "undefined") return "Wisp";
  const ua = navigator.userAgent;
  let os = "this device";
  if (/Windows/i.test(ua)) os = "Windows";
  else if (/Mac OS X/i.test(ua)) os = "macOS";
  else if (/Android/i.test(ua)) os = "Android";
  else if (/iPhone|iPad/i.test(ua)) os = "iOS";
  else if (/Linux/i.test(ua)) os = "Linux";
  return `Wisp on ${os}`;
}

export async function generateIdentity(
  name = guessDeviceName(),
): Promise<DeviceIdentity> {
  const pair = (await crypto.subtle.generateKey(ALGO, true, [
    "sign",
    "verify",
  ])) as CryptoKeyPair;
  const publicKey = await crypto.subtle.exportKey("jwk", pair.publicKey);
  const privateKey = await crypto.subtle.exportKey("jwk", pair.privateKey);
  return {
    id: crypto.randomUUID(),
    name,
    publicKey,
    privateKey,
    createdAt: Date.now(),
  };
}

async function importPrivate(jwk: JsonWebKey): Promise<CryptoKey> {
  return crypto.subtle.importKey("jwk", jwk, ALGO, false, ["sign"]);
}

async function importPublic(jwk: JsonWebKey): Promise<CryptoKey> {
  return crypto.subtle.importKey("jwk", jwk, ALGO, false, ["verify"]);
}

export async function signPayload(
  privateKey: JsonWebKey,
  payload: string,
): Promise<string> {
  const key = await importPrivate(privateKey);
  const sig = await crypto.subtle.sign(
    ALGO,
    key,
    new TextEncoder().encode(payload),
  );
  return bytesToB64(new Uint8Array(sig));
}

export async function verifyPayload(
  publicKey: JsonWebKey,
  payload: string,
  signature: string,
): Promise<boolean> {
  try {
    const key = await importPublic(publicKey);
    const sig = b64ToBytes(signature);
    return await crypto.subtle.verify(
      ALGO,
      key,
      sig as BufferSource,
      new TextEncoder().encode(payload),
    );
  } catch {
    return false;
  }
}

export function publicKeyFingerprint(jwk: JsonWebKey): string {
  return `${jwk.kty ?? ""}:${jwk.crv ?? ""}:${jwk.x ?? ""}`;
}

export function canonicalJson(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) {
    return `[${value.map((v) => canonicalJson(v)).join(",")}]`;
  }
  const obj = value as Record<string, unknown>;
  const keys = Object.keys(obj).sort();
  return `{${keys.map((k) => `${JSON.stringify(k)}:${canonicalJson(obj[k])}`).join(",")}}`;
}
