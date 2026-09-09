import { fromB64, toB64, asSource } from "./bytes.ts";

const VAULT_KEY = "wisp.vault.v1";

export type StoredVault = {
  id: string;
  createdAt: number;
  key: JsonWebKey;
  /** Raw 48-byte connection secret, so this device can invite others to the same vault. */
  secret: string;
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

const HKDF_SALT = new TextEncoder().encode("wisp.pair.v1");
const HKDF_INFO = new TextEncoder().encode("notes-vault");

export async function deriveVaultKey(secret: Uint8Array): Promise<CryptoKey> {
  const base = await crypto.subtle.importKey("raw", asSource(secret), "HKDF", false, [
    "deriveKey",
  ]);
  return crypto.subtle.deriveKey(
    { name: "HKDF", hash: "SHA-256", salt: HKDF_SALT, info: HKDF_INFO },
    base,
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"],
  );
}

export async function importVaultKey(jwk: JsonWebKey): Promise<CryptoKey> {
  return crypto.subtle.importKey("jwk", jwk, { name: "AES-GCM" }, false, [
    "encrypt",
    "decrypt",
  ]);
}

export function loadVault(): StoredVault | null {
  const row = readJson<StoredVault>(VAULT_KEY);
  if (!row?.id || !row.key || !row.secret) return null;
  return row;
}

export async function saveVaultFromSecret(secret: Uint8Array): Promise<StoredVault> {
  const key = await deriveVaultKey(secret);
  const jwk = await crypto.subtle.exportKey("jwk", key);
  const row: StoredVault = {
    id: toB64(secret.slice(0, 8)),
    createdAt: Date.now(),
    key: jwk,
    secret: toB64(secret),
  };
  localStorage.setItem(VAULT_KEY, JSON.stringify(row));
  return row;
}

export function clearVault() {
  if (typeof localStorage === "undefined") return;
  localStorage.removeItem(VAULT_KEY);
}

export function vaultSecret(vault: StoredVault): Uint8Array {
  return fromB64(vault.secret);
}

export function hasVault(): boolean {
  return loadVault() != null;
}
