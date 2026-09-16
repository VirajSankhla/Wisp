"use client";

import { useEffect, useMemo, useRef } from "react";
import { Plus, X } from "lucide-react";
import { collapseNativeOverlay, reportOverlaySize } from "@/lib/overlay";
import { FAULT_LOG_ID } from "@/lib/notes/fault-log";
import { visibleNotes } from "@/lib/notes/search";
import { useNotesStore } from "@/lib/notes/store";
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
        .slice(0, 12),
    [notes],
  );

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const send = () => {
      try {
        reportOverlaySize(el);
      } catch {
        /* keep the bubbles even if the native window cannot shrink */
      }
    };
    send();
    const ro = new ResizeObserver(send);
    ro.observe(el);
    return () => ro.disconnect();
  }, [selectedId, list.length, hasHydrated]);

  function close() {
    useNotesStore.getState().setSelectedId(null);
    collapseNativeOverlay();
  }

  return (
    <div
      ref={rootRef}
      className="flex w-fit max-w-[280px] flex-col items-end gap-2 px-2 py-2"
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

      {!hasHydrated ? (
        <div className={cn(bubble, "h-10 w-36")} />
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
        <div className="flex max-h-[46vh] w-fit max-w-[280px] flex-col items-end gap-1.5 overflow-y-auto">
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
                    "max-w-[260px] px-3.5 py-2 text-left font-display text-[16px] leading-snug tracking-tight",
                    note.heading.trim() ? "" : "italic text-muted",
                  )}
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
}: {
  heading: string;
  body: string;
  onHeading: (value: string) => void;
  onBody: (value: string) => void;
  onBack: () => void;
}) {
  return (
    <div className="flex w-[260px] max-w-[260px] flex-col items-end gap-1.5">
      <button
        type="button"
        onClick={onBack}
        className={cn(bubble, "px-3 py-1 text-xs text-muted")}
      >
        Headings
      </button>
      <textarea
        value={heading}
        onChange={(e) => onHeading(e.target.value)}
        placeholder="Heading"
        rows={1}
        className={cn(
          bubble,
          "w-full resize-none px-3.5 py-2.5 font-display text-[18px] leading-snug placeholder:text-muted/70 focus:outline-none",
        )}
      />
      <textarea
        value={body}
        onChange={(e) => onBody(e.target.value)}
        placeholder="Write…"
        rows={Math.min(8, Math.max(2, body.split("\n").length + 1))}
        className={cn(
          bubble,
          "w-full resize-none px-3.5 py-2.5 text-[15px] leading-relaxed text-fg/90 placeholder:text-subtle focus:outline-none",
        )}
      />
    </div>
  );
}
