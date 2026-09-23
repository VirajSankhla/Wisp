import { mintConnectionCode } from "./codes.ts";
import { PEER_SYNC_KIND, buildPeerSync, encodePeerSync, openPeerSync } from "./sync.ts";
import { loadVault, saveVaultFromSecret } from "./vault.ts";
import { useNotesStore } from "../notes/store.ts";

const REMOTE_KEY = "wisp.remote.v1";

export type RemoteSync = {
  url: string;
  header: string;
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

export function loadRemote(): RemoteSync | null {
  const row = readJson<RemoteSync>(REMOTE_KEY);
  if (!row?.url) return null;
  return { url: row.url, header: row.header ?? "" };
}

export function saveRemote(remote: RemoteSync) {
  localStorage.setItem(
    REMOTE_KEY,
    JSON.stringify({ url: remote.url.trim(), header: remote.header.trim() }),
  );
}

export function clearRemote() {
  localStorage.removeItem(REMOTE_KEY);
}

export async function ensureVaultForRemote() {
  if (loadVault()) return;
  const offer = mintConnectionCode();
  await saveVaultFromSecret(offer.secret);
}

/** Save the API, then merge anything already there and push this device's notes. */
export async function connectAndPush(remote: RemoteSync): Promise<"pushed" | "saved"> {
  saveRemote(remote);
  await ensureVaultForRemote();
  try {
    await pullRemote();
  } catch {
    /* empty bin or offline */
  }
  try {
    await pushRemote();
    return "pushed";
  } catch {
    return "saved";
  }
}

export function validateRemoteUrl(raw: string): string {
  const url = raw.trim();
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new Error("That is not a URL");
  }
  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
    throw new Error("Use an http(s) URL");
  }
  return parsed.toString();
}

function extraHeaders(headerLine: string): Record<string, string> {
  const text = headerLine.trim();
  if (!text) return {};
  const cut = text.indexOf(":");
  if (cut <= 0) return {};
  const name = text.slice(0, cut).trim();
  const value = text.slice(cut + 1).trim();
  if (!name || !value) return {};
  if (/^(host|origin|cookie|connection)$/i.test(name)) return {};
  return { [name]: value };
}

export function unwrapRemoteBody(data: unknown): unknown {
  if (!data || typeof data !== "object") return data;
  const row = data as Record<string, unknown>;
  if (row.kind === PEER_SYNC_KIND) return row;
  if (row.record) return unwrapRemoteBody(row.record);
  if (row.body && typeof row.body === "object") return unwrapRemoteBody(row.body);
  return data;
}

async function request(
  remote: RemoteSync,
  method: "GET" | "PUT",
  body?: string,
): Promise<string> {
  const headers: Record<string, string> = {
    accept: "application/json, text/plain, */*",
    ...extraHeaders(remote.header),
  };
  if (method === "PUT") headers["content-type"] = "application/json";
  const res = await fetch(remote.url, {
    method,
    headers,
    body: method === "PUT" ? body : undefined,
  });
  if (!res.ok) throw new Error(`Sync API ${res.status}`);
  return res.text();
}

export async function pullRemote(): Promise<{ exportedAt: number } | null> {
  const remote = loadRemote();
  if (!remote || !loadVault()) return null;
  const text = await request(remote, "GET");
  if (!text.trim()) return null;
  let parsed: unknown;
  try {
    parsed = unwrapRemoteBody(JSON.parse(text));
  } catch {
    return null;
  }
  const opened = await openPeerSync(parsed);
  if (!opened.ok) return null;
  useNotesStore.getState().mergeRemote(opened.notes);
  return { exportedAt: opened.exportedAt };
}

export async function pushRemote() {
  const remote = loadRemote();
  const vault = loadVault();
  if (!remote || !vault) return;
  const bundle = await buildPeerSync(useNotesStore.getState().notes);
  await request(remote, "PUT", encodePeerSync(bundle));
  return bundle.exportedAt;
}

let lastPush = 0;

export async function remoteTick() {
  if (!loadRemote() || !loadVault()) return;
  let pulledAt = 0;
  try {
    const pulled = await pullRemote();
    if (pulled) pulledAt = pulled.exportedAt;
  } catch {
    /* offline or API down — local notes stay */
  }
  try {
    const newest = Math.max(
      ...Object.values(useNotesStore.getState().notes).map((n) => n.updatedAt),
      0,
    );
    if (newest > pulledAt || newest > lastPush) {
      const at = await pushRemote();
      if (at) lastPush = at;
    }
  } catch {
    /* push later */
  }
}

export function startRemoteSync() {
  void remoteTick();
  const id = window.setInterval(() => void remoteTick(), 8000);
  return () => window.clearInterval(id);
}
