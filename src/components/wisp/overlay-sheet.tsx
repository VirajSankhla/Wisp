"use client";

import { useEffect, useMemo, useRef } from "react";
import { Plus, Trash2, X } from "lucide-react";
import { collapseNativeOverlay, reportOverlaySize, revealNativeOverlay } from "@/lib/overlay";
import { FAULT_LOG_ID } from "@/lib/notes/fault-log";
import { visibleNotes } from "@/lib/notes/search";
import { useNotesStore } from "@/lib/notes/store";
import { applyPrefs } from "@/lib/prefs";
import { cn } from "@/lib/utils";
import { WispMark } from "./mark";

const bubble =
  "rounded-[22px] bg-black/45 text-fg shadow-[0_8px_24px_-12px_rgb(0_0_0_/_0.55)] ring-1 ring-white/16 backdrop-blur-2xl";

export function OverlaySheet() {
  const rootRef = useRef<HTMLDivElement>(null);
  const notes = useNotesStore((s) => s.notes);
  const selectedId = useNotesStore((s) => s.selectedId);
  const hasHydrated = useNotesStore((s) => s.hasHydrated);
  const selected = selectedId ? notes[selectedId] : undefined;
  const list = useMemo(
    () =>
      visibleNotes(notes, "", null)
        .filter((n) => n.id !== FAULT_LOG_ID)
        .slice(0, 24),
    [notes],
  );

  useEffect(() => {
    applyPrefs();
    const w = window as Window & { __wispCreateNote?: () => void };
    w.__wispCreateNote = () => useNotesStore.getState().createNote();
    return () => {
      delete w.__wispCreateNote;
    };
  }, []);

  useEffect(() => {
    const el = rootRef.current;
    if (!el || !hasHydrated) return;
    let revealed = false;
    const send = () => {
      try {
        if (!revealed) {
          revealed = true;
          revealNativeOverlay(el);
        } else {
          reportOverlaySize(el);
        }
      } catch {
        /* native window stays at last size */
      }
    };
    const id = requestAnimationFrame(() => requestAnimationFrame(send));
    return () => cancelAnimationFrame(id);
  }, [hasHydrated]);

  function close() {
    useNotesStore.getState().setSelectedId(null);
    collapseNativeOverlay();
  }

  function removeSelected() {
    if (!selected) return;
    useNotesStore.getState().deleteNote(selected.id);
    useNotesStore.getState().setSelectedId(null);
  }

  return (
    <div
      ref={rootRef}
      className="flex w-[280px] max-w-[280px] flex-col items-end gap-2 px-2 py-2"
    >
      <div className={cn(bubble, "flex items-center gap-0.5 px-1 py-0.5")}>
        <button
          type="button"
          onClick={close}
          aria-label="Hide Wisp"
          className="grid size-8 place-items-center rounded-full text-muted hover:text-fg"
        >
          <X className="size-3.5" />
        </button>
        <WispMark className="mx-1 size-3.5 text-accent" />
        <button
          type="button"
          onClick={() => useNotesStore.getState().createNote()}
          aria-label="New note"
          className="grid size-8 place-items-center rounded-full text-accent"
        >
          <Plus className="size-3.5" />
        </button>
      </div>

      {!hasHydrated ? null : selected && !selected.deletedAt ? (
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
          onDelete={removeSelected}
        />
      ) : (
        <div
          className="flex w-full max-w-[264px] flex-col items-end gap-1.5 overflow-y-auto overscroll-contain"
          style={{ maxHeight: "var(--overlay-list-max, 170px)" }}
        >
          {list.length === 0 ? (
            <div
              className={cn(
                bubble,
                "px-3.5 py-2 font-display text-[15px] text-muted",
              )}
            >
              Empty — tap +
            </div>
          ) : (
            list.map((note) => {
              const heading = note.heading.trim() || "Untitled";
              return (
                <button
                  key={note.id}
                  type="button"
                  onClick={() => useNotesStore.getState().setSelectedId(note.id)}
                  className={cn(
                    bubble,
                    "w-full max-w-[264px] px-3.5 py-2 text-left font-display leading-snug tracking-tight",
                    note.heading.trim() ? "" : "italic text-muted",
                  )}
                  style={{ fontSize: "var(--overlay-heading, 16px)" }}
                >
                  {heading}
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

function OverlayNote({
  heading,
  body,
  onHeading,
  onBody,
  onBack,
  onDelete,
}: {
  heading: string;
  body: string;
  onHeading: (value: string) => void;
  onBody: (value: string) => void;
  onBack: () => void;
  onDelete: () => void;
}) {
  return (
    <div
      className="flex w-full max-w-[264px] flex-col items-end gap-1.5 overflow-y-auto overscroll-contain"
      style={{ maxHeight: "var(--overlay-list-max, 170px)" }}
    >
      <div className="flex w-full items-center justify-end gap-1">
        <button
          type="button"
          onClick={onBack}
          className={cn(bubble, "px-3 py-1 text-xs text-muted")}
        >
          Headings
        </button>
        <button
          type="button"
          onClick={onDelete}
          aria-label="Delete note"
          className={cn(bubble, "grid size-8 place-items-center text-danger")}
        >
          <Trash2 className="size-3.5" />
        </button>
      </div>
      <textarea
        value={heading}
        onChange={(e) => onHeading(e.target.value.slice(0, 240))}
        placeholder="Heading"
        rows={1}
        className={cn(
          bubble,
          "w-full resize-none px-3.5 py-2 font-display leading-snug placeholder:text-muted/70 focus:outline-none",
        )}
        style={{ fontSize: "var(--overlay-heading, 16px)" }}
      />
      <textarea
        value={body}
        onChange={(e) => onBody(e.target.value.slice(0, 20_000))}
        placeholder="Write…"
        rows={3}
        className={cn(
          bubble,
          "min-h-[4.5rem] w-full resize-none px-3.5 py-2 text-[14px] leading-relaxed text-fg/90 placeholder:text-subtle focus:outline-none",
        )}
      />
    </div>
  );
}
