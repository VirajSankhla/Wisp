import { clampNoteTime, isStaleWrite } from "./clock.ts";
import { noteFromParsed, noteSchema } from "./schema.ts";
import type { Note } from "./types.ts";

export type MergeStats = {
  notes: Record<string, Note>;
  applied: number;
  skipped: number;
};

/**
 * Drop anything that is not a well-shaped note, then clamp absurd future
 * timestamps. Never throws — a bad row is skipped so a failed sync cannot
 * wipe or corrupt the local set.
 */
export function sanitizeNote(input: unknown, now = Date.now()): Note | null {
  const parsed = noteSchema.safeParse(input);
  if (!parsed.success) return null;
  const note = noteFromParsed(parsed.data);
  const updatedAt = clampNoteTime(note.updatedAt, now);
  const deletedAt =
    note.deletedAt == null ? null : clampNoteTime(note.deletedAt, now);
  return { ...note, updatedAt, deletedAt };
}

export function mergeNotes(
  local: Record<string, Note>,
  incoming: unknown,
  now = Date.now(),
): MergeStats {
  if (!Array.isArray(incoming)) {
    return { notes: local, applied: 0, skipped: 0 };
  }
  const notes = { ...local };
  let applied = 0;
  let skipped = 0;
  for (const item of incoming) {
    const next = sanitizeNote(item, now);
    if (!next) {
      skipped += 1;
      continue;
    }
    const existing = notes[next.id];
    if (existing && isStaleWrite(next.updatedAt, existing.updatedAt)) {
      skipped += 1;
      continue;
    }
    notes[next.id] = next;
    applied += 1;
  }
  return { notes, applied, skipped };
}
