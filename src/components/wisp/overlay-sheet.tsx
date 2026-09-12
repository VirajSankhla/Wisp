"use client";

import { useMemo } from "react";
import { Plus, X } from "lucide-react";
import { collapseNativeOverlay } from "@/lib/overlay";
import { visibleNotes } from "@/lib/notes/search";
import { useNotesStore } from "@/lib/notes/store";
import { cn } from "@/lib/utils";
import { WispMark } from "./mark";

export function OverlaySheet() {
  const notes = useNotesStore((s) => s.notes);
  const selectedId = useNotesStore((s) => s.selectedId);
  const hasHydrated = useNotesStore((s) => s.hasHydrated);
  const selected = selectedId ? notes[selectedId] : undefined;
  const list = useMemo(() => visibleNotes(notes, "", null), [notes]);

  function close() {
    useNotesStore.getState().setSelectedId(null);
    collapseNativeOverlay();
  }

  return (
    <div className="flex h-full min-h-0 flex-col p-1">
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[28px] bg-[#12110f]/42 shadow-[0_18px_50px_-18px_rgb(0_0_0_/_0.55)] ring-1 ring-white/14 backdrop-blur-2xl">
        <header className="flex items-center gap-1 px-2 pt-2 pb-1">
          <button
            type="button"
            onClick={close}
            aria-label="Hide Wisp"
            className="grid size-9 place-items-center rounded-full text-muted hover:bg-fg/8 hover:text-fg"
          >
            <X className="size-4" />
          </button>
          <WispMark className="size-4 text-accent" />
          <span className="flex-1" />
          <button
            type="button"
            onClick={() => useNotesStore.getState().createNote()}
            aria-label="New note"
            className="grid size-9 place-items-center rounded-full text-accent hover:bg-fg/8"
          >
            <Plus className="size-4" />
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-1 pb-2">
          {!hasHydrated ? (
            <div className="space-y-2 px-3 py-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-9 overflow-hidden rounded-lg bg-fg/8">
                  <div className="wisp-shimmer h-full w-full" />
                </div>
              ))}
            </div>
          ) : selected && !selected.deletedAt ? (
            <OverlayNote
              heading={selected.heading}
              body={selected.body}
              onHeading={(heading) =>
                useNotesStore.getState().updateNote(selected.id, { heading })
              }
              onBody={(body) =>
                useNotesStore.getState().updateNote(selected.id, { body })
              }
              onBack={() => useNotesStore.getState().setSelectedId(null)}
            />
          ) : (
            <ul className="px-1">
              {list.length === 0 ? (
                <li className="px-3 py-8 text-center text-sm text-muted">
                  Empty. Tap + for a heading.
                </li>
              ) : (
                list.map((note) => {
                  const heading = note.heading.trim() || "Untitled";
                  return (
                    <li key={note.id}>
                      <button
                        type="button"
                        onClick={() =>
                          useNotesStore.getState().setSelectedId(note.id)
                        }
                        className="flex w-full items-center rounded-2xl px-3 py-2.5 text-left hover:bg-fg/8"
                      >
                        <span
                          className={cn(
                            "truncate font-display text-[17px] leading-snug tracking-tight",
                            note.heading.trim() ? "text-fg" : "italic text-muted",
                          )}
                        >
                          {heading}
                        </span>
                      </button>
                    </li>
                  );
                })
              )}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

function OverlayNote({
  heading,
  body,
  onHeading,
  onBody,
  onBack,
}: {
  heading: string;
  body: string;
  onHeading: (value: string) => void;
  onBody: (value: string) => void;
  onBack: () => void;
}) {
  return (
    <div className="flex min-h-0 flex-1 flex-col px-3 pb-2">
      <button
        type="button"
        onClick={onBack}
        className="mb-1 self-start rounded-full px-2 py-1 text-xs text-muted hover:text-fg"
      >
        Headings
      </button>
      <textarea
        value={heading}
        onChange={(e) => onHeading(e.target.value)}
        placeholder="Heading"
        rows={1}
        className="min-h-10 w-full resize-none bg-transparent font-display text-xl leading-tight text-fg placeholder:text-muted/70 focus:outline-none"
      />
      <textarea
        value={body}
        onChange={(e) => onBody(e.target.value)}
        placeholder="Write…"
        className="mt-2 min-h-0 flex-1 resize-none bg-transparent text-[15px] leading-relaxed text-fg/90 placeholder:text-subtle focus:outline-none"
      />
    </div>
  );
}
