import { Pin } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Note } from "@/lib/notes/types";
import { relativeTime } from "./relative-time";
import { useNotesStore } from "@/lib/notes/store";

function Row({
  note,
  selected,
  onSelect,
}: {
  note: Note;
  selected: boolean;
  onSelect: (id: string) => void;
}) {
  const heading = note.heading.trim() || "Untitled";
  return (
    <li>
      <div
        className={cn(
          "flex w-full items-center gap-1 rounded-xl pr-1 transition-colors duration-150",
          selected ? "bg-fg/8" : "hover:bg-fg/5",
        )}
      >
        <button
          type="button"
          onClick={() => onSelect(note.id)}
          className="flex min-w-0 flex-1 items-baseline gap-3 px-3 py-3 text-left"
        >
          <span className="min-w-0 flex-1">
            <span className="flex items-center gap-2">
              {note.pinned ? (
                <Pin
                  className="size-3 shrink-0 fill-pin text-pin"
                  strokeWidth={2}
                  aria-hidden
                />
              ) : null}
              <span
                className={cn(
                  "truncate font-display text-note leading-snug tracking-tight",
                  note.heading.trim() ? "text-fg" : "text-muted italic",
                )}
              >
                {heading}
              </span>
            </span>
          </span>
          <span className="shrink-0 font-sans text-xs tabular-nums text-subtle">
            {relativeTime(note.updatedAt)}
          </span>
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            useNotesStore.getState().updateNote(note.id, { pinned: !note.pinned });
          }}
          aria-label={note.pinned ? "Unpin" : "Pin"}
          className={cn(
            "grid size-9 shrink-0 place-items-center rounded-full",
            note.pinned ? "text-pin" : "text-subtle hover:text-fg",
          )}
        >
          <Pin className={cn("size-3.5", note.pinned ? "fill-pin" : "")} />
        </button>
      </div>
    </li>
  );
}

export function NoteList({
  notes,
  selectedId,
  searching,
  onSelect,
}: {
  notes: Note[];
  selectedId: string | null;
  searching: boolean;
  onSelect: (id: string) => void;
}) {
  if (notes.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center px-6 py-16 text-center">
        <p className="font-display text-xl text-fg">Nothing here</p>
        <p className="mt-2 max-w-xs text-sm leading-relaxed text-muted">
          {searching
            ? "No headings or tags match. Clear search to see everything."
            : "Write a heading. That single line is the whole index."}
        </p>
      </div>
    );
  }

  const pinned = notes.filter((n) => n.pinned);
  const rest = notes.filter((n) => !n.pinned);
  const showHeads = pinned.length > 0 && rest.length > 0 && !searching;

  return (
    <div className="flex flex-col px-1 pb-2">
      {showHeads ? (
        <p className="px-3 pt-2 pb-1 text-xs font-medium tracking-wide text-subtle uppercase">
          Pinned
        </p>
      ) : null}
      <ul className="flex flex-col">
        {pinned.map((note) => (
          <Row
            key={note.id}
            note={note}
            selected={note.id === selectedId}
            onSelect={onSelect}
          />
        ))}
      </ul>
      {showHeads ? (
        <p className="px-3 pt-3 pb-1 text-xs font-medium tracking-wide text-subtle uppercase">
          Latest
        </p>
      ) : null}
      <ul className="flex flex-col">
        {rest.map((note) => (
          <Row
            key={note.id}
            note={note}
            selected={note.id === selectedId}
            onSelect={onSelect}
          />
        ))}
      </ul>
    </div>
  );
}
