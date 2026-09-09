import { asSource, fromB64, randomBytes, toB64 } from "./bytes.ts";
import { noteSchema } from "../notes/schema.ts";
import type { Note } from "../notes/types.ts";
import { importVaultKey, loadVault } from "./vault.ts";

export const PEER_SYNC_KIND = "wisp.peer-sync.v1" as const;

export type PeerSync = {
  v: 1;
  kind: typeof PEER_SYNC_KIND;
  vaultId: string;
  exportedAt: number;
  iv: string;
  data: string;
};

export type OpenPeerSync =
  | { ok: true; notes: Note[]; exportedAt: number }
  | { ok: false; error: string };

function stableNote(note: Note): Note {
  return {
    id: note.id,
    heading: note.heading,
    body: note.body,
    tags: note.tags,
    pinned: note.pinned,
    updatedAt: note.updatedAt,
    deletedAt: note.deletedAt,
  };
}

export async function buildPeerSync(
  notes: Record<string, Note>,
  now = Date.now(),
): Promise<PeerSync> {
  const vault = loadVault();
  if (!vault) throw new Error("This device is not connected yet");
  const key = await importVaultKey(vault.key);
  const payload = JSON.stringify(
    Object.values(notes)
      .map(stableNote)
      .filter((n) => noteSchema.safeParse(n).success),
  );
  const iv = randomBytes(12);
  const cipher = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv: asSource(iv) },
    key,
    new TextEncoder().encode(payload),
  );
  return {
    v: 1,
    kind: PEER_SYNC_KIND,
    vaultId: vault.id,
    exportedAt: now,
    iv: toB64(iv),
    data: toB64(new Uint8Array(cipher)),
  };
}

export async function openPeerSync(raw: unknown): Promise<OpenPeerSync> {
  if (!raw || typeof raw !== "object") {
    return { ok: false, error: "Not a Wisp device snapshot" };
  }
  const o = raw as PeerSync;
  if (o.v !== 1 || o.kind !== PEER_SYNC_KIND || typeof o.data !== "string") {
    return { ok: false, error: "Not a Wisp device snapshot (wisp.peer-sync.v1)" };
  }
  const vault = loadVault();
  if (!vault) {
    return { ok: false, error: "Connect this device with a code first" };
  }
  if (o.vaultId && o.vaultId !== vault.id) {
    return { ok: false, error: "This snapshot is from a different Wisp connection" };
  }
  try {
    const key = await importVaultKey(vault.key);
    const plain = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: asSource(fromB64(o.iv)) },
      key,
      asSource(fromB64(o.data)),
    );
    const notes = JSON.parse(new TextDecoder().decode(plain)) as unknown;
    if (!Array.isArray(notes)) {
      return { ok: false, error: "Snapshot notes were unreadable" };
    }
    return { ok: true, notes: notes as Note[], exportedAt: o.exportedAt };
  } catch {
    return { ok: false, error: "Could not open that snapshot with this connection" };
  }
}

function triggerDownload(filename: string, blob: Blob) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function downloadPeerSync(bundle: PeerSync) {
  const stamp = new Date(bundle.exportedAt).toISOString().slice(0, 10);
  triggerDownload(
    `wisp-sync-${stamp}.json`,
    new Blob([JSON.stringify(bundle, null, 2)], { type: "application/json" }),
  );
}
