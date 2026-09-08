import { OFFER_TTL_MS, mintPairingCode, normalizePairingCode } from "./codes.ts";
import {
  type DeviceIdentity,
  type PublicDevice,
  canonicalJson,
  fromB64,
  signPayload,
  toB64,
  randomBytes,
  verifyPayload,
} from "./crypto.ts";

export const OFFER_KIND = "wisp.pair.offer.v1";
export const ACCEPT_KIND = "wisp.pair.accept.v1";

export type PairOffer = {
  v: 1;
  kind: typeof OFFER_KIND;
  code: string;
  device: PublicDevice;
  nonce: string;
  exp: number;
};

export type PairAccept = {
  v: 1;
  kind: typeof ACCEPT_KIND;
  code: string;
  nonce: string;
  device: PublicDevice;
  sig: string;
};

export type StoredOffer = {
  offer: PairOffer;
  secret: string;
  used: boolean;
};

export class PairingError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PairingError";
  }
}

export function createOffer(
  identity: DeviceIdentity,
  now = Date.now(),
  ttlMs = OFFER_TTL_MS,
): StoredOffer {
  const { code, secret } = mintPairingCode();
  const offer: PairOffer = {
    v: 1,
    kind: OFFER_KIND,
    code,
    device: {
      id: identity.id,
      name: identity.name,
      publicKey: identity.publicKey,
    },
    nonce: toB64(randomBytes(24)),
    exp: now + ttlMs,
  };
  return { offer, secret, used: false };
}

export function encodeEnvelope(value: object): string {
  return `WISP1.${toB64(new TextEncoder().encode(JSON.stringify(value)))}`;
}

export function decodeEnvelope(raw: string): unknown {
  const text = raw.trim();
  if (text.startsWith("WISP1.")) {
    const json = new TextDecoder().decode(fromB64(text.slice("WISP1.".length)));
    return JSON.parse(json) as unknown;
  }
  return JSON.parse(text) as unknown;
}

function isOffer(value: unknown): value is PairOffer {
  if (!value || typeof value !== "object") return false;
  const o = value as PairOffer;
  return o.v === 1 && o.kind === OFFER_KIND && typeof o.code === "string";
}

function isAccept(value: unknown): value is PairAccept {
  if (!value || typeof value !== "object") return false;
  const o = value as PairAccept;
  return o.v === 1 && o.kind === ACCEPT_KIND && typeof o.sig === "string";
}

export function parseOffer(raw: string): PairOffer {
  const value = decodeEnvelope(raw);
  if (!isOffer(value)) throw new PairingError("That is not a Wisp pairing offer");
  return { ...value, code: normalizePairingCode(value.code) };
}

export function parseAccept(raw: string): PairAccept {
  const value = decodeEnvelope(raw);
  if (!isAccept(value)) {
    throw new PairingError("That is not a Wisp pairing confirmation");
  }
  return { ...value, code: normalizePairingCode(value.code) };
}

function acceptPayload(accept: Omit<PairAccept, "sig">): string {
  return canonicalJson({
    v: accept.v,
    kind: accept.kind,
    code: accept.code,
    nonce: accept.nonce,
    device: accept.device,
  });
}

export async function makeAccept(
  identity: DeviceIdentity,
  offer: PairOffer,
  now = Date.now(),
): Promise<PairAccept> {
  if (now > offer.exp) throw new PairingError("This pairing code has expired");
  if (offer.device.id === identity.id) {
    throw new PairingError("You cannot pair a device with itself");
  }
  const unsigned: Omit<PairAccept, "sig"> = {
    v: 1,
    kind: ACCEPT_KIND,
    code: offer.code,
    nonce: offer.nonce,
    device: {
      id: identity.id,
      name: identity.name,
      publicKey: identity.publicKey,
    },
  };
  const sig = await signPayload(identity.privateKey, acceptPayload(unsigned));
  return { ...unsigned, sig };
}

export async function consumeAccept(
  stored: StoredOffer,
  accept: PairAccept,
  now = Date.now(),
): Promise<PublicDevice> {
  if (stored.used) throw new PairingError("This pairing code was already used");
  if (now > stored.offer.exp) throw new PairingError("This pairing code has expired");
  if (normalizePairingCode(accept.code) !== stored.offer.code) {
    throw new PairingError("Pairing code does not match");
  }
  if (accept.nonce !== stored.offer.nonce) {
    throw new PairingError("Pairing nonce does not match");
  }
  if (accept.device.id === stored.offer.device.id) {
    throw new PairingError("You cannot pair a device with itself");
  }
  const unsigned: Omit<PairAccept, "sig"> = {
    v: accept.v,
    kind: accept.kind,
    code: accept.code,
    nonce: accept.nonce,
    device: accept.device,
  };
  const ok = await verifyPayload(
    accept.device.publicKey,
    acceptPayload(unsigned),
    accept.sig,
  );
  if (!ok) throw new PairingError("Pairing confirmation signature is invalid");
  stored.used = true;
  return accept.device;
}
