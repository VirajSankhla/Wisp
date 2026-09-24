"use client";

import { useEffect, useMemo, type RefObject } from "react";
import { CircleHelp, Plus, Search, Settings, Smartphone, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { collectTags, parseQuery, visibleNotes } from "@/lib/notes/search";
import { useNotesStore } from "@/lib/notes/store";
import { cn } from "@/lib/utils";
import { DevicesPanel } from "./devices";
import { WispGuide } from "./guide";
import { WispMark } from "./mark";
import { NoteEditor } from "./note-editor";
import { NoteList } from "./note-list";
import { SettingsPanel } from "./settings";
import { TrashPanel } from "./trash";

export function WispPanel({
  searchRef,
}: {
  searchRef: RefObject<HTMLInputElement | null>;
}) {
  const notes = useNotesStore((s) => s.notes);
  const selectedId = useNotesStore((s) => s.selectedId);
  const query = useNotesStore((s) => s.query);
  const activeTag = useNotesStore((s) => s.activeTag);
  const searchOpen = useNotesStore((s) => s.searchOpen);
  const guideOpen = useNotesStore((s) => s.guideOpen);
  const devicesOpen = useNotesStore((s) => s.devicesOpen);
  const settingsOpen = useNotesStore((s) => s.settingsOpen);
  const trashOpen = useNotesStore((s) => s.trashOpen);
  const hasHydrated = useNotesStore((s) => s.hasHydrated);
  const selected = selectedId ? notes[selectedId] : undefined;
  const showEditor = Boolean(selected && !selected.deletedAt);

  const list = useMemo(
    () => visibleNotes(notes, query, activeTag),
    [notes, query, activeTag],
  );
  const searchText = useMemo(() => parseQuery(query).text, [query]);
  const tags = useMemo(() => collectTags(Object.values(notes)), [notes]);

  useEffect(() => {
    if (searchOpen) searchRef.current?.focus();
  }, [searchOpen, searchRef]);

  function handleDelete(id: string) {
    const snap = useNotesStore.getState().snapshot(id);
    useNotesStore.getState().deleteNote(id);
    toast("Note removed", {
      action: {
        label: "Undo",
        onClick: () => {
          if (snap)
            useNotesStore.getState().restoreNote({
              ...snap,
              deletedAt: null,
              updatedAt: Date.now(),
            });
        },
      },
    });
  }

  const liveCount = Object.values(notes).filter((n) => !n.deletedAt).length;

  return (
    <div className="flex h-full min-h-0 flex-col">
      <header className="flex items-center gap-2 px-3 pt-3 pb-2">
        <div className="flex min-w-0 items-center gap-2 px-1">
          <WispMark animate className="size-5 shrink-0" />
          <span className="font-display text-lg tracking-tight">Wisp</span>
        </div>
        <div className="ml-auto flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label={settingsOpen ? "Close settings" : "Settings"}
            onClick={() =>
              useNotesStore.getState().setSettingsOpen(!settingsOpen)
            }
          >
            <Settings className="size-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label={devicesOpen ? "Close devices" : "Devices"}
            onClick={() =>
              useNotesStore.getState().setDevicesOpen(!devicesOpen)
            }
          >
            <Smartphone className="size-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label={guideOpen ? "Close guide" : "Open guide"}
            onClick={() => useNotesStore.getState().setGuideOpen(!guideOpen)}
          >
            <CircleHelp className="size-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label={searchOpen ? "Close search" : "Search"}
            onClick={() => useNotesStore.getState().setSearchOpen(!searchOpen)}
          >
            {searchOpen ? <X className="size-4" /> : <Search className="size-4" />}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label="New note"
            onClick={() => useNotesStore.getState().createNote()}
          >
            <Plus className="size-4" />
          </Button>
        </div>
      </header>

      {searchOpen ? (
        <div className="px-3 pb-2">
          <label className="sr-only" htmlFor="wisp-search">
            Search notes
          </label>
          <input
            id="wisp-search"
            ref={searchRef}
            value={query}
            onChange={(e) => useNotesStore.getState().setQuery(e.target.value)}
            placeholder="Search headings, or #tag"
            className="h-11 w-full rounded-xl bg-fg/6 px-3 text-sm text-fg placeholder:text-subtle focus:outline-none focus:ring-2 focus:ring-accent/30"
          />
          {tags.length > 0 ? (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {tags.map((tag) => {
                const on =
                  activeTag?.toLowerCase() === tag.toLowerCase() ||
                  query.toLowerCase().includes(`#${tag.toLowerCase()}`);
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() =>
                      useNotesStore
                        .getState()
                        .setActiveTag(on && activeTag === tag ? null : tag)
                    }
                    className={cn(
                      "h-8 rounded-full px-3 text-xs transition-colors duration-150",
                      on
                        ? "bg-accent text-accent-fg"
                        : "bg-fg/6 text-muted hover:text-fg",
                    )}
                  >
                    {tag}
                  </button>
                );
              })}
            </div>
          ) : null}
        </div>
      ) : null}

      <div className="min-h-0 flex-1 overflow-y-auto">
        {!hasHydrated ? (
          <div className="space-y-2 px-4 py-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-11 overflow-hidden rounded-xl bg-fg/6">
                <div className="wisp-shimmer h-full w-full" />
              </div>
            ))}
          </div>
        ) : devicesOpen ? (
          <DevicesPanel onBack={() => useNotesStore.getState().setDevicesOpen(false)} />
        ) : settingsOpen ? (
          <SettingsPanel onBack={() => useNotesStore.getState().setSettingsOpen(false)} />
        ) : trashOpen ? (
          <TrashPanel onBack={() => useNotesStore.getState().setTrashOpen(false)} />
        ) : guideOpen ? (
          <WispGuide onBack={() => useNotesStore.getState().setGuideOpen(false)} />
        ) : showEditor && selected ? (
          <NoteEditor
            note={selected}
            onBack={() => useNotesStore.getState().setSelectedId(null)}
            onChange={(patch) =>
              useNotesStore.getState().updateNote(selected.id, patch)
            }
            onDelete={() => handleDelete(selected.id)}
            onTogglePin={() =>
              useNotesStore.getState().updateNote(selected.id, {
                pinned: !selected.pinned,
              })
            }
          />
        ) : (
          <NoteList
            notes={list}
            selectedId={selectedId}
            searching={Boolean(query.trim() || activeTag)}
            query={searchText}
            onSelect={(id) => useNotesStore.getState().setSelectedId(id)}
          />
        )}
      </div>

      <footer className="flex items-center justify-between gap-3 border-t border-border px-4 py-3">
        <p className="text-xs text-muted">{liveCount} on this device</p>
        <p className="hidden text-xs text-subtle sm:block">
          N new · / search · ? guide
        </p>
      </footer>
    </div>
  );
}
