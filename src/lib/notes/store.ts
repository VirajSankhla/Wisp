import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { readNativeStore, writeNativeStore } from "../native-store.ts";
import { mergeNotes } from "./merge.ts";
import { SAMPLE_IDS, sampleNotes } from "./samples.ts";
import type { Note } from "./types.ts";

const FAULT_LOG_ID = "wisp.fault-log";

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
  createNote: () => string;
  updateNote: (
    id: string,
    patch: Partial<Pick<Note, "heading" | "body" | "tags" | "pinned">>,
  ) => void;
  deleteNote: (id: string) => void;
  restoreNote: (note: Note) => void;
  importNotes: (incoming: unknown) => { applied: number; skipped: number };
  clearStarterNotes: () => void;
  mergeRemote: (remote: unknown) => { applied: number; skipped: number };
  appendFaultLog: (line: string) => void;
  snapshot: (id: string) => Note | undefined;
};

function now() {
  return Date.now();
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
              }),
        }),
      setSearchOpen: (open) =>
        set({
          searchOpen: open,
          guideOpen: false,
          devicesOpen: false,
          settingsOpen: false,
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
        const next: Note = { ...existing, ...patch, updatedAt: now() };
        set((s) => ({ notes: { ...s.notes, [id]: next } }));
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
