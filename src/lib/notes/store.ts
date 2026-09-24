import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { readNativeStore, writeNativeStore } from "../native-store.ts";
import { mergeNotes } from "./merge.ts";
import { SAMPLE_IDS, sampleNotes } from "./samples.ts";
import type { Note, NoteVersion } from "./types.ts";

const FAULT_LOG_ID = "wisp.fault-log";

/** How long a deleted note stays recoverable in Trash before it's purged for good. */
export const TRASH_RETENTION_MS = 30 * 24 * 60 * 60 * 1000;

/** Local edit-history depth per note, and the pause between edits before a new
 * checkpoint is worth keeping (otherwise every keystroke would snapshot). */
export const HISTORY_MAX = 5;
export const HISTORY_MIN_GAP_MS = 30 * 1000;

export type NotesState = {
  notes: Record<string, Note>;
  selectedId: string | null;
  query: string;
  activeTag: string | null;
  panelOpen: boolean;
  searchOpen: boolean;
  guideOpen: boolean;
  devicesOpen: boolean;
  settingsOpen: boolean;
  trashOpen: boolean;
  hasHydrated: boolean;
  setHasHydrated: (value: boolean) => void;
  seedIfEmpty: () => void;
  setQuery: (query: string) => void;
  setActiveTag: (tag: string | null) => void;
  setSelectedId: (id: string | null) => void;
  setPanelOpen: (open: boolean) => void;
  setSearchOpen: (open: boolean) => void;
  setGuideOpen: (open: boolean) => void;
  setDevicesOpen: (open: boolean) => void;
  setSettingsOpen: (open: boolean) => void;
  setTrashOpen: (open: boolean) => void;
  createNote: () => string;
  updateNote: (
    id: string,
    patch: Partial<Pick<Note, "heading" | "body" | "tags" | "pinned">>,
  ) => void;
  deleteNote: (id: string) => void;
  restoreNote: (note: Note) => void;
  restoreVersion: (id: string, index: number) => void;
  permanentlyDeleteNote: (id: string) => void;
  purgeExpiredTrash: (now?: number) => number;
  importNotes: (incoming: unknown) => { applied: number; skipped: number };
  clearStarterNotes: () => void;
  mergeRemote: (remote: unknown) => { applied: number; skipped: number };
  appendFaultLog: (line: string) => void;
  snapshot: (id: string) => Note | undefined;
};

function now() {
  return Date.now();
}

/**
 * The history entry a content edit should add, if any — pure and testable.
 * Returns the unchanged history when the edit doesn't touch heading/body, or
 * when the last edit was too recent to be worth a separate checkpoint.
 */
export function withHistoryCheckpoint(
  existing: Note,
  patch: Partial<Pick<Note, "heading" | "body">>,
  nowMs: number,
): NoteVersion[] | undefined {
  const nextHeading = patch.heading ?? existing.heading;
  const nextBody = patch.body ?? existing.body;
  if (nextHeading === existing.heading && nextBody === existing.body) {
    return existing.history;
  }
  if (nowMs - existing.updatedAt < HISTORY_MIN_GAP_MS) return existing.history;
  const entry: NoteVersion = {
    heading: existing.heading,
    body: existing.body,
    updatedAt: existing.updatedAt,
  };
  return [entry, ...(existing.history ?? [])].slice(0, HISTORY_MAX);
}

/** Pure so it's directly testable without touching the persisted store. */
export function purgeExpiredNotes(
  notes: Record<string, Note>,
  nowMs: number,
  retentionMs = TRASH_RETENTION_MS,
): { notes: Record<string, Note>; purged: number } {
  let purged = 0;
  const next = { ...notes };
  for (const [id, note] of Object.entries(next)) {
    if (note.deletedAt != null && nowMs - note.deletedAt > retentionMs) {
      delete next[id];
      purged += 1;
    }
  }
  return purged === 0 ? { notes, purged: 0 } : { notes: next, purged };
}

export const useNotesStore = create<NotesState>()(
  persist(
    (set, get) => ({
      notes: {},
      selectedId: null,
      query: "",
      activeTag: null,
      panelOpen: true,
      searchOpen: false,
      guideOpen: false,
      devicesOpen: false,
      settingsOpen: false,
      trashOpen: false,
      hasHydrated: false,
      setHasHydrated: (value) => set({ hasHydrated: value }),
      seedIfEmpty: () => {
        if (Object.keys(get().notes).length > 0) return;
        set({ notes: sampleNotes() });
      },
      setQuery: (query) => set({ query }),
      setActiveTag: (tag) => set({ activeTag: tag, searchOpen: true }),
      setSelectedId: (id) =>
        set({
          selectedId: id,
          guideOpen: false,
          devicesOpen: false,
          settingsOpen: false,
          trashOpen: false,
        }),
      setPanelOpen: (open) =>
        set({
          panelOpen: open,
          ...(open
            ? {}
            : {
                selectedId: null,
                searchOpen: false,
                guideOpen: false,
                devicesOpen: false,
                settingsOpen: false,
                trashOpen: false,
              }),
        }),
      setSearchOpen: (open) =>
        set({
          searchOpen: open,
          guideOpen: false,
          devicesOpen: false,
          settingsOpen: false,
          trashOpen: false,
          ...(open ? {} : { query: "", activeTag: null }),
        }),
      setGuideOpen: (open) =>
        set({
          guideOpen: open,
          ...(open
            ? {
                selectedId: null,
                searchOpen: false,
                devicesOpen: false,
                settingsOpen: false,
                trashOpen: false,
                panelOpen: true,
              }
            : {}),
        }),
      setDevicesOpen: (open) =>
        set({
          devicesOpen: open,
          ...(open
            ? {
                selectedId: null,
                searchOpen: false,
                guideOpen: false,
                settingsOpen: false,
                trashOpen: false,
                panelOpen: true,
              }
            : {}),
        }),
      setSettingsOpen: (open) =>
        set({
          settingsOpen: open,
          ...(open
            ? {
                selectedId: null,
                searchOpen: false,
                guideOpen: false,
                devicesOpen: false,
                trashOpen: false,
                panelOpen: true,
              }
            : {}),
        }),
      setTrashOpen: (open) =>
        set({
          trashOpen: open,
          ...(open
            ? {
                selectedId: null,
                searchOpen: false,
                guideOpen: false,
                devicesOpen: false,
                settingsOpen: false,
                panelOpen: true,
              }
            : {}),
        }),
      createNote: () => {
        const id = crypto.randomUUID();
        const note: Note = {
          id,
          heading: "",
          body: "",
          tags: [],
          pinned: false,
          updatedAt: now(),
          deletedAt: null,
        };
        set((s) => ({
          notes: { ...s.notes, [id]: note },
          selectedId: id,
          panelOpen: true,
          query: "",
          activeTag: null,
          searchOpen: false,
          guideOpen: false,
          devicesOpen: false,
          settingsOpen: false,
        }));
        return id;
      },
      updateNote: (id, patch) => {
        const existing = get().notes[id];
        if (!existing || existing.deletedAt) return;
        const nowMs = now();
        const history = withHistoryCheckpoint(existing, patch, nowMs);
        const next: Note = { ...existing, ...patch, updatedAt: nowMs, history };
        set((s) => ({ notes: { ...s.notes, [id]: next } }));
      },
      restoreVersion: (id, index) => {
        set((s) => {
          const existing = s.notes[id];
          const entry = existing?.history?.[index];
          if (!existing || !entry) return s;
          const snapshot: NoteVersion = {
            heading: existing.heading,
            body: existing.body,
            updatedAt: existing.updatedAt,
          };
          const history = [snapshot, ...(existing.history ?? [])].slice(0, HISTORY_MAX);
          const next: Note = {
            ...existing,
            heading: entry.heading,
            body: entry.body,
            updatedAt: now(),
            history,
          };
          return { notes: { ...s.notes, [id]: next } };
        });
      },
      deleteNote: (id) => {
        const existing = get().notes[id];
        if (!existing) return;
        const next: Note = { ...existing, deletedAt: now(), updatedAt: now() };
        set((s) => ({
          notes: { ...s.notes, [id]: next },
          selectedId: s.selectedId === id ? null : s.selectedId,
        }));
      },
      restoreNote: (note) => {
        set((s) => ({ notes: { ...s.notes, [note.id]: note } }));
      },
      permanentlyDeleteNote: (id) => {
        set((s) => {
          if (!(id in s.notes)) return s;
          const notes = { ...s.notes };
          delete notes[id];
          return { notes };
        });
      },
      purgeExpiredTrash: (nowMs = now()) => {
        let purged = 0;
        set((s) => {
          const result = purgeExpiredNotes(s.notes, nowMs);
          purged = result.purged;
          return result.purged === 0 ? s : { notes: result.notes };
        });
        return purged;
      },
      importNotes: (incoming) => {
        let applied = 0;
        let skipped = 0;
        set((s) => {
          const result = mergeNotes(s.notes, incoming);
          applied = result.applied;
          skipped = result.skipped;
          return { notes: result.notes };
        });
        return { applied, skipped };
      },
      clearStarterNotes: () => {
        set((s) => {
          const notes = { ...s.notes };
          const ts = now();
          for (const id of SAMPLE_IDS) {
            if (notes[id] && !notes[id].deletedAt) {
              notes[id] = { ...notes[id], deletedAt: ts, updatedAt: ts };
            }
          }
          return {
            notes,
            selectedId:
              s.selectedId &&
              (SAMPLE_IDS as readonly string[]).includes(s.selectedId)
                ? null
                : s.selectedId,
          };
        });
      },
      mergeRemote: (remote) => {
        let applied = 0;
        let skipped = 0;
        set((s) => {
          const result = mergeNotes(s.notes, remote);
          applied = result.applied;
          skipped = result.skipped;
          if (result.applied === 0) return s;
          return { notes: result.notes };
        });
        return { applied, skipped };
      },
      appendFaultLog: (line) => {
        const text = line.trim();
        if (!text) return;
        const stamp = new Date().toISOString().replace("T", " ").slice(0, 19);
        const chunk = `${stamp}\n${text}\n`;
        set((s) => {
          const existing = s.notes[FAULT_LOG_ID];
          const body = existing
            ? `${existing.body.trim()}\n\n${chunk}`.slice(-8000)
            : chunk;
          const note: Note = {
            id: FAULT_LOG_ID,
            heading: "Wisp log",
            body,
            tags: ["wisp-log"],
            pinned: false,
            updatedAt: now(),
            deletedAt: null,
          };
          return { notes: { ...s.notes, [FAULT_LOG_ID]: note } };
        });
      },
      snapshot: (id) => get().notes[id],
    }),
    {
      name: "wisp.notes.v1",
      storage: createJSONStorage(() => ({
        getItem: (name) => {
          try {
            const native = readNativeStore(name);
            if (native) return native;
            return localStorage.getItem(name);
          } catch {
            return localStorage.getItem(name);
          }
        },
        setItem: (name, value) => {
          localStorage.setItem(name, value);
          writeNativeStore(name, value);
        },
        removeItem: (name) => {
          localStorage.removeItem(name);
          writeNativeStore(name, "");
        },
      })),
      partialize: (state) => ({
        notes: state.notes,
        panelOpen: state.panelOpen,
      }),
      skipHydration: true,
    },
  ),
);
