import { nativeStoreRev, nativeStoreRevAsync, readNativeStore, readNativeStoreAsync, writeNativeStore } from "../native-store";
import { useNotesStore } from "./store";
import type { Note } from "./types";

const NAME = "wisp.notes.v1";

function notesFromRaw(raw: string): Note[] | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as {
      state?: { notes?: Record<string, Note> };
      notes?: Record<string, Note>;
    };
    if (parsed?.state?.notes) return Object.values(parsed.state.notes);
    if (parsed?.notes) return Object.values(parsed.notes);
  } catch {
    return null;
  }
  return null;
}

function applyNotes(notes: Note[], overlay: boolean) {
  if (overlay) {
    const map: Record<string, Note> = {};
    for (const note of notes) map[note.id] = note;
    useNotesStore.setState({ notes: map });
    return;
  }
  useNotesStore.getState().mergeRemote(notes);
}

export function applyBootNotes() {
  if (typeof window === "undefined") return;
  const boot = (window as Window & { __WISP_BOOT_NOTES__?: string }).__WISP_BOOT_NOTES__;
  const raw = (typeof boot === "string" && boot) || readNativeStore(NAME);
  const notes = notesFromRaw(raw);
  if (!notes?.length) return;
  applyNotes(notes, true);
}

export async function pullNativeNotes() {
  const overlay =
    typeof window !== "undefined" &&
    new URLSearchParams(window.location.search).get("overlay") === "1";
  if (overlay) applyBootNotes();
  const raw =
    readNativeStore(NAME) || (await readNativeStoreAsync(NAME)) || "";
  if (!raw) return;
  const notes = notesFromRaw(raw);
  if (!notes?.length) return;
  applyNotes(notes, overlay);
}

export function pushNativeNotes() {
  try {
    const raw = localStorage.getItem(NAME);
    if (raw) writeNativeStore(NAME, raw);
  } catch {
    /* ignore */
  }
}

export function startStoreBridge() {
  let last = "";
  let lastRev = nativeStoreRev();
  const overlay =
    typeof window !== "undefined" &&
    new URLSearchParams(window.location.search).get("overlay") === "1";
  if (overlay) applyBootNotes();
  const tick = () => {
    void (async () => {
      const rev = await nativeStoreRevAsync();
      const raw = readNativeStore(NAME) || (await readNativeStoreAsync(NAME)) || "";
      if (!raw) return;
      if (raw === last && rev === lastRev) return;
      last = raw;
      lastRev = rev;
      await pullNativeNotes();
    })();
  };
  tick();
  const unsub = useNotesStore.subscribe(() => {
    pushNativeNotes();
  });
  const id = window.setInterval(tick, 200);
  const onSync = () => tick();
  window.addEventListener("wisp-boot-notes", onSync);
  window.addEventListener("wisp-native-sync", onSync);
  document.addEventListener("visibilitychange", onSync);
  window.addEventListener("focus", onSync);
  return () => {
    unsub();
    window.clearInterval(id);
    window.removeEventListener("wisp-boot-notes", onSync);
    window.removeEventListener("wisp-native-sync", onSync);
    document.removeEventListener("visibilitychange", onSync);
    window.removeEventListener("focus", onSync);
  };
}
