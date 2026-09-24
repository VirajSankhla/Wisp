import { FAULT_LOG_ID } from "./fault-log.ts";
import type { Note } from "./types.ts";

const LINK_RE = /\[\[([^[\]]+)\]\]/g;

/** Unique `[[Heading]]` targets in a note body, in first-seen order. */
export function parseNoteLinks(body: string): string[] {
  const seen = new Set<string>();
  const targets: string[] = [];
  for (const match of body.matchAll(LINK_RE)) {
    const target = match[1]!.trim();
    if (!target) continue;
    const key = target.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    targets.push(target);
  }
  return targets;
}

export type ResolvedLink = { target: string; note: Note | null };

/** Matches each `[[Heading]]` target to a live note by exact heading (case-insensitive). */
export function resolveNoteLinks(targets: string[], notes: Note[]): ResolvedLink[] {
  const byHeading = new Map<string, Note>();
  for (const note of notes) {
    if (note.deletedAt || note.id === FAULT_LOG_ID) continue;
    const key = note.heading.trim().toLowerCase();
    if (key && !byHeading.has(key)) byHeading.set(key, note);
  }
  return targets.map((target) => ({
    target,
    note: byHeading.get(target.toLowerCase()) ?? null,
  }));
}
