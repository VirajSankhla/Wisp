"use client";

import { ChevronLeft, RotateCcw, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useNotesStore } from "@/lib/notes/store";
import { cn } from "@/lib/utils";
import { relativeTime } from "./relative-time";

export function TrashPanel({ onBack }: { onBack: () => void }) {
  const notes = useNotesStore((s) => s.notes);
  const trashed = Object.values(notes)
    .filter((n) => n.deletedAt != null)
    .sort((a, b) => (b.deletedAt ?? 0) - (a.deletedAt ?? 0));

  function restore(id: string) {
    const note = useNotesStore.getState().notes[id];
    if (!note) return;
    useNotesStore.getState().restoreNote({ ...note, deletedAt: null, updatedAt: Date.now() });
    toast("Note restored");
  }

  function deleteForever(id: string) {
    useNotesStore.getState().permanentlyDeleteNote(id);
    toast("Deleted for good");
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex items-center gap-1 px-2 pt-1">
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={onBack}
          aria-label="Back to headings"
        >
          <ChevronLeft className="size-5" />
        </Button>
        <h2 className="font-display text-lg tracking-tight">Trash</h2>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-3 py-3">
        {trashed.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center px-6 py-16 text-center">
            <p className="font-display text-xl text-fg">Trash is empty</p>
            <p className="mt-2 max-w-xs text-sm leading-relaxed text-muted">
              Deleted notes sit here for 30 days before they're gone for good.
            </p>
          </div>
        ) : (
          <ul className="flex flex-col gap-1">
            {trashed.map((note) => (
              <li
                key={note.id}
                className="flex items-center gap-1 rounded-xl px-2 py-2 hover:bg-fg/5"
              >
                <div className="min-w-0 flex-1">
                  <p
                    className={cn(
                      "truncate font-display text-note leading-snug tracking-tight",
                      note.heading.trim() ? "text-fg" : "text-muted italic",
                    )}
                  >
                    {note.heading.trim() || "Untitled"}
                  </p>
                  <p className="text-xs text-subtle">
                    Deleted {relativeTime(note.deletedAt ?? note.updatedAt)}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => restore(note.id)}
                  aria-label="Restore note"
                >
                  <RotateCcw className="size-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => deleteForever(note.id)}
                  aria-label="Delete forever"
                  className="text-danger hover:text-danger"
                >
                  <Trash2 className="size-4" />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
