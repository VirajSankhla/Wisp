import { generateIdentity, type DeviceIdentity, type PublicDevice } from "./crypto.ts";
import {
  createOffer,
  encodeEnvelope,
  type PairOffer,
  type StoredOffer,
} from "./session.ts";

const DEVICE_KEY = "wisp.device.v1";
const TRUST_KEY = "wisp.trusted.v1";
const OFFER_KEY = "wisp.pairing.offer.v1";

export type TrustedDevice = PublicDevice & {
  pairedAt: number;
};

function readJson<T>(key: string): T | null {
  if (typeof localStorage === "undefined") return null;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function writeJson(key: string, value: unknown) {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(key, JSON.stringify(value));
}

export async function loadIdentity(): Promise<DeviceIdentity> {
  const existing = readJson<DeviceIdentity>(DEVICE_KEY);
  if (existing?.id && existing.privateKey && existing.publicKey) return existing;
  const created = await generateIdentity();
  writeJson(DEVICE_KEY, created);
  return created;
}

export function listTrusted(): TrustedDevice[] {
  return readJson<TrustedDevice[]>(TRUST_KEY) ?? [];
}

export function rememberTrusted(device: PublicDevice, now = Date.now()): TrustedDevice {
  const row: TrustedDevice = { ...device, pairedAt: now };
  const next = listTrusted().filter((d) => d.id !== device.id);
  next.push(row);
  writeJson(TRUST_KEY, next);
  return row;
}

export function forgetTrusted(id: string) {
  writeJson(
    TRUST_KEY,
    listTrusted().filter((d) => d.id !== id),
  );
}

export function saveOpenOffer(stored: StoredOffer) {
  writeJson(OFFER_KEY, stored);
}

export function loadOpenOffer(): StoredOffer | null {
  return readJson<StoredOffer>(OFFER_KEY);
}

export function clearOpenOffer() {
  if (typeof localStorage === "undefined") return;
  localStorage.removeItem(OFFER_KEY);
}

export async function startOffer(): Promise<{ offer: PairOffer; qr: string; code: string }> {
  const identity = await loadIdentity();
  const stored = createOffer(identity);
  saveOpenOffer(stored);
  return {
    offer: stored.offer,
    qr: encodeEnvelope(stored.offer),
    code: stored.offer.code,
  };
}
