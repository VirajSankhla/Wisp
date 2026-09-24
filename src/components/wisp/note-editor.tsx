"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowUpRight, ChevronLeft, Download, History, Pin, RotateCcw, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { downloadMarkdown } from "@/lib/notes/backup";
import { parseNoteLinks, resolveNoteLinks } from "@/lib/notes/links";
import { useNotesStore } from "@/lib/notes/store";
import { cn } from "@/lib/utils";
import type { Note } from "@/lib/notes/types";
import { relativeTime } from "./relative-time";

export function NoteEditor({
  note,
  onBack,
  onChange,
  onDelete,
  onTogglePin,
}: {
  note: Note;
  onBack: () => void;
  onChange: (patch: Partial<Pick<Note, "heading" | "body" | "tags">>) => void;
  onDelete: () => void;
  onTogglePin: () => void;
}) {
  const headingRef = useRef<HTMLTextAreaElement>(null);
  const [tagDraft, setTagDraft] = useState("");
  const [savedFlash, setSavedFlash] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const skipFlash = useRef(true);
  const allNotes = useNotesStore((s) => s.notes);
  const linkedNotes = useMemo(
    () =>
      resolveNoteLinks(parseNoteLinks(note.body), Object.values(allNotes)).filter(
        (link) => link.note && link.note.id !== note.id,
      ),
    [note.body, note.id, allNotes],
  );

  useEffect(() => {
    const el = headingRef.current;
    if (el) {
      el.style.height = "auto";
      el.style.height = `${el.scrollHeight}px`;
      if (!note.heading) el.focus();
    }
  }, [note.id, note.heading]);

  useEffect(() => {
    if (skipFlash.current) {
      skipFlash.current = false;
      return;
    }
    setSavedFlash(true);
    const t = window.setTimeout(() => setSavedFlash(false), 900);
    return () => window.clearTimeout(t);
  }, [note.updatedAt]);

  useEffect(() => {
    skipFlash.current = true;
    setTagDraft("");
    setShowHistory(false);
  }, [note.id]);

  function commitTag() {
    const next = tagDraft.trim().replace(/^#/, "").slice(0, 40);
    if (!next) {
      setTagDraft("");
      return;
    }
    if (note.tags.length >= 24) {
      setTagDraft("");
      return;
    }
    if (!note.tags.some((t) => t.toLowerCase() === next.toLowerCase())) {
      onChange({ tags: [...note.tags, next] });
    }
    setTagDraft("");
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
        <span
          className={cn(
            "ml-1 text-xs text-subtle transition-opacity duration-300",
            savedFlash ? "opacity-100" : "opacity-0",
          )}
        >
          Saved
        </span>
        <div className="ml-auto flex items-center">
          {note.history?.length ? (
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={() => setShowHistory((v) => !v)}
              aria-label={showHistory ? "Close history" : "View history"}
            >
              <History className={cn("size-4", showHistory ? "text-accent" : "")} />
            </Button>
          ) : null}
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={() => {
              downloadMarkdown(note);
              toast("Markdown downloaded");
            }}
            aria-label="Download as Markdown"
          >
            <Download className="size-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={onTogglePin}
            aria-label={note.pinned ? "Unpin" : "Pin"}
          >
            <Pin className={cn("size-4", note.pinned ? "fill-pin text-pin" : "")} />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={onDelete}
            aria-label="Delete note"
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      </div>

      {showHistory ? (
        <div className="min-h-0 flex-1 overflow-y-auto px-3 py-2">
          <p className="px-2 pb-2 text-xs font-medium tracking-wide text-subtle uppercase">
            Earlier versions
          </p>
          <ul className="flex flex-col gap-1">
            {note.history?.map((version, index) => (
              <li
                key={version.updatedAt}
                className="flex items-center gap-2 rounded-xl px-2 py-2 hover:bg-fg/5"
              >
                <div className="min-w-0 flex-1">
                  <p
                    className={cn(
                      "truncate font-display text-note leading-snug tracking-tight",
                      version.heading.trim() ? "text-fg" : "text-muted italic",
                    )}
                  >
                    {version.heading.trim() || "Untitled"}
                  </p>
                  <p className="text-xs text-subtle">{relativeTime(version.updatedAt)}</p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    useNotesStore.getState().restoreVersion(note.id, index);
                    setShowHistory(false);
                    toast("Version restored");
                  }}
                >
                  <RotateCcw className="size-3.5" />
                  Restore
                </Button>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <>
          <textarea
            ref={headingRef}
            value={note.heading}
            onChange={(e) => onChange({ heading: e.target.value.slice(0, 240) })}
            placeholder="Heading"
            rows={1}
            maxLength={240}
            className="mt-1 min-h-12 w-full resize-none bg-transparent px-4 font-display text-display-note leading-tight tracking-tight text-fg placeholder:text-subtle focus:outline-none"
            onInput={(e) => {
              const el = e.currentTarget;
              el.style.height = "auto";
              el.style.height = `${el.scrollHeight}px`;
            }}
          />

          <textarea
            value={note.body}
            onChange={(e) => onChange({ body: e.target.value.slice(0, 20_000) })}
            placeholder="The rest, if you need it."
            maxLength={20000}
            className="min-h-32 flex-1 resize-none bg-transparent px-4 py-3 text-sm leading-relaxed text-fg placeholder:text-subtle focus:outline-none"
          />

          {linkedNotes.length > 0 ? (
            <div className="border-t border-border px-4 py-3">
              <p className="mb-2 text-xs font-medium tracking-wide text-subtle uppercase">
                Linked notes
              </p>
              <div className="flex flex-wrap gap-1.5">
                {linkedNotes.map(({ note: linked }) => (
                  <button
                    key={linked!.id}
                    type="button"
                    onClick={() => useNotesStore.getState().setSelectedId(linked!.id)}
                    className="inline-flex h-8 items-center gap-1 rounded-full bg-fg/6 px-3 text-xs text-muted hover:text-fg"
                  >
                    {linked!.heading.trim() || "Untitled"}
                    <ArrowUpRight className="size-3" />
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          <div className="border-t border-border px-4 py-3">
            <p className="mb-2 text-xs font-medium tracking-wide text-subtle uppercase">
              Tags — used in search, hidden in the list
            </p>
            <div className="flex flex-wrap items-center gap-1.5">
              {note.tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex h-8 items-center gap-1 rounded-full bg-fg/6 pl-2.5 pr-1 text-xs text-muted"
                >
                  {tag}
                  <button
                    type="button"
                    className="grid size-6 place-items-center rounded-full hover:bg-fg/10 hover:text-fg"
                    onClick={() =>
                      onChange({ tags: note.tags.filter((t) => t !== tag) })
                    }
                    aria-label={`Remove ${tag}`}
                  >
                    <X className="size-3" />
                  </button>
                </span>
              ))}
              <input
                value={tagDraft}
                onChange={(e) => setTagDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === ",") {
                    e.preventDefault();
                    commitTag();
                  }
                }}
                onBlur={commitTag}
                placeholder={note.tags.length ? "Add" : "Add a tag"}
                className="h-8 min-w-28 flex-1 bg-transparent text-xs text-fg placeholder:text-subtle focus:outline-none"
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
