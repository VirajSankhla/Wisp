/**
 * Signed note snapshots between already-paired devices.
 *
 * This is not live P2P and it does not need a Wisp relay. After two machines
 * trust each other, one writes a `wisp.peer-sync.v1` file, the other opens it.
 * The signature is checked against the Ed25519 key stored at pairing time.
 *
 * Notes in the file are plaintext (same as a backup). The signature answers
 * "did this come from a device I already paired?", not "is this encrypted".
 */

import { noteSchema } from "../notes/schema.ts";
import type { Note } from "../notes/types.ts";
import {
  canonicalJson,
  publicKeyFingerprint,
  signPayload,
  verifyPayload,
  type DeviceIdentity,
  type PublicDevice,
} from "./crypto.ts";

export const PEER_SYNC_KIND = "wisp.peer-sync.v1" as const;

export type PeerSync = {
  v: 1;
  kind: typeof PEER_SYNC_KIND;
  from: PublicDevice;
  exportedAt: number;
  notes: Note[];
  sig: string;
};

export type VerifyPeerSyncResult =
  | { ok: true; bundle: PeerSync }
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

function unsignedPayload(bundle: Omit<PeerSync, "sig">): string {
  return canonicalJson({
    v: bundle.v,
    kind: bundle.kind,
    from: bundle.from,
    exportedAt: bundle.exportedAt,
    notes: bundle.notes,
  });
}

function asPublicDevice(value: unknown): PublicDevice | null {
  if (!value || typeof value !== "object") return null;
  const o = value as PublicDevice;
  if (typeof o.id !== "string" || !o.id) return null;
  if (typeof o.name !== "string" || !o.name) return null;
  if (!o.publicKey || typeof o.publicKey !== "object") return null;
  return {
    id: o.id,
    name: o.name,
    publicKey: o.publicKey,
  };
}

function asPeerSync(value: unknown): Omit<PeerSync, "sig"> & { sig: string } | null {
  if (!value || typeof value !== "object") return null;
  const o = value as PeerSync;
  if (o.v !== 1 || o.kind !== PEER_SYNC_KIND) return null;
  if (typeof o.sig !== "string" || !o.sig) return null;
  if (typeof o.exportedAt !== "number" || !Number.isFinite(o.exportedAt)) return null;
  if (!Array.isArray(o.notes)) return null;
  const from = asPublicDevice(o.from);
  if (!from) return null;
  return {
    v: 1,
    kind: PEER_SYNC_KIND,
    from,
    exportedAt: o.exportedAt,
    notes: o.notes,
    sig: o.sig,
  };
}

export async function buildPeerSync(
  identity: DeviceIdentity,
  notes: Record<string, Note>,
  now = Date.now(),
): Promise<PeerSync> {
  const payloadNotes = Object.values(notes)
    .map(stableNote)
    .filter((n) => noteSchema.safeParse(n).success);
  const unsigned: Omit<PeerSync, "sig"> = {
    v: 1,
    kind: PEER_SYNC_KIND,
    from: {
      id: identity.id,
      name: identity.name,
      publicKey: identity.publicKey,
    },
    exportedAt: now,
    notes: payloadNotes,
  };
  const sig = await signPayload(identity.privateKey, unsignedPayload(unsigned));
  return { ...unsigned, sig };
}

export async function verifyPeerSync(
  raw: unknown,
  trusted: PublicDevice[],
): Promise<VerifyPeerSyncResult> {
  const bundle = asPeerSync(raw);
  if (!bundle) {
    return { ok: false, error: "Not a Wisp device snapshot (wisp.peer-sync.v1)" };
  }
  const peer = trusted.find((d) => d.id === bundle.from.id);
  if (!peer) {
    return {
      ok: false,
      error: "This snapshot is not from a device you have paired",
    };
  }
  if (
    publicKeyFingerprint(peer.publicKey) !==
    publicKeyFingerprint(bundle.from.publicKey)
  ) {
    return { ok: false, error: "Device key does not match the paired key" };
  }
  const unsigned: Omit<PeerSync, "sig"> = {
    v: bundle.v,
    kind: bundle.kind,
    from: bundle.from,
    exportedAt: bundle.exportedAt,
    notes: bundle.notes,
  };
  const ok = await verifyPayload(
    peer.publicKey,
    unsignedPayload(unsigned),
    bundle.sig,
  );
  if (!ok) {
    return { ok: false, error: "Snapshot signature is invalid" };
  }
  return { ok: true, bundle };
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
  const slug = bundle.from.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 32);
  const stamp = new Date(bundle.exportedAt).toISOString().slice(0, 10);
  triggerDownload(
    `wisp-from-${slug || "device"}-${stamp}.json`,
    new Blob([JSON.stringify(bundle, null, 2)], { type: "application/json" }),
  );
}
