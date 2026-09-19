import { readNativeStore, readNativeStoreAsync, writeNativeStore } from "../native-store";
import { useNotesStore } from "./store";
import type { Note } from "./types";

const NAME = "wisp.notes.v1";

function notesFromRaw(raw: string): Note[] | null {
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

export async function pullNativeNotes() {
  const raw =
    readNativeStore(NAME) || (await readNativeStoreAsync(NAME)) || "";
  if (!raw) return;
  const notes = notesFromRaw(raw);
  if (!notes?.length) return;
  const overlay =
    typeof window !== "undefined" &&
    new URLSearchParams(window.location.search).get("overlay") === "1";
  if (overlay) {
    const map: Record<string, Note> = {};
    for (const note of notes) map[note.id] = note;
    useNotesStore.setState({ notes: map });
    return;
  }
  useNotesStore.getState().mergeRemote(notes);
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
  void pullNativeNotes().then(() => {
    last = readNativeStore(NAME) || localStorage.getItem(NAME) || "";
  });
  const unsub = useNotesStore.subscribe(() => {
    pushNativeNotes();
  });
  const id = window.setInterval(() => {
    const raw = readNativeStore(NAME);
    if (!raw || raw === last) return;
    last = raw;
    void pullNativeNotes();
  }, 400);
  return () => {
    unsub();
    window.clearInterval(id);
  };
}
