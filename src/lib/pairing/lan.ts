import { publishLanSnapshot, takeLanIncoming } from "../overlay";
import { buildPeerSync, encodePeerSync, openPeerSync } from "./sync";
import type { LanEndpoint } from "./codes";
import { loadVault } from "./vault";
import { useNotesStore } from "../notes/store";

const PEER_KEY = "wisp.lan-peer.v1";
const HUB_PORT = 17892;

export type StoredPeer = LanEndpoint & { vaultId: string };

export function loadLanPeer(): StoredPeer | null {
  if (typeof localStorage === "undefined") return null;
  try {
    const raw = localStorage.getItem(PEER_KEY);
    if (!raw) return null;
    const row = JSON.parse(raw) as StoredPeer;
    if (!row.host || !row.port || !row.vaultId) return null;
    return row;
  } catch {
    return null;
  }
}

export function saveLanPeer(peer: StoredPeer) {
  localStorage.setItem(PEER_KEY, JSON.stringify(peer));
}

export function clearLanPeer() {
  localStorage.removeItem(PEER_KEY);
}

async function mergePacket(raw: string) {
  if (!raw) return;
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return;
  }
  const opened = await openPeerSync(parsed);
  if (!opened.ok) return;
  useNotesStore.getState().mergeRemote(opened.notes);
}

async function pushToPeer(peer: StoredPeer, json: string) {
  const url = `http://${peer.host}:${peer.port}/wisp/snapshot`;
  try {
    const got = await fetch(url, { method: "GET" });
    if (got.ok) await mergePacket(await got.text());
  } catch {
    return;
  }
  try {
    await fetch(url, {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: json,
    });
  } catch {
    /* phone may be asleep */
  }
}

export async function lanTick() {
  const vault = loadVault();
  if (!vault) return;
  let json = "";
  try {
    const bundle = await buildPeerSync(useNotesStore.getState().notes);
    json = encodePeerSync(bundle);
    await publishLanSnapshot(json);
  } catch {
    return;
  }
  const incoming = await takeLanIncoming();
  if (incoming) await mergePacket(incoming);
  const peer = loadLanPeer();
  if (peer && peer.vaultId === vault.id && json) {
    await pushToPeer(peer, json);
  }
}

export function startLanSync() {
  void lanTick();
  const id = window.setInterval(() => void lanTick(), 2500);
  return () => window.clearInterval(id);
}

export { HUB_PORT };
