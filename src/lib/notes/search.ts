import { FAULT_LOG_ID } from "./fault-log.ts";
import type { Note } from "./types.ts";

export function parseQuery(raw: string): { text: string; tags: string[] } {
  const tags: string[] = [];
  const text = raw
    .replace(/#([^\s#]+)/g, (_, tag: string) => {
      tags.push(tag.toLowerCase());
      return " ";
    })
    .replace(/\s+/g, " ")
    .trim();
  return { text, tags };
}

export function noteMatches(
  note: Note,
  query: string,
  activeTag: string | null,
): boolean {
  if (note.deletedAt) return false;
  if (note.id === FAULT_LOG_ID) return false;
  const { text, tags } = parseQuery(query);
  if (
    activeTag &&
    !note.tags.some((t) => t.toLowerCase() === activeTag.toLowerCase())
  ) {
    return false;
  }
  for (const tag of tags) {
    if (!note.tags.some((t) => t.toLowerCase() === tag)) return false;
  }
  if (!text) return true;
  const hay = `${note.heading} ${note.body} ${note.tags.join(" ")}`.toLowerCase();
  return hay.includes(text.toLowerCase());
}

export type TextSegment = { text: string; match: boolean };

/** Splits `text` on case-insensitive occurrences of `needle` for highlighting. */
export function highlightSegments(text: string, needle: string): TextSegment[] {
  const trimmed = needle.trim();
  if (!trimmed) return [{ text, match: false }];
  const lower = text.toLowerCase();
  const needleLower = trimmed.toLowerCase();
  const segments: TextSegment[] = [];
  let i = 0;
  while (i < text.length) {
    const idx = lower.indexOf(needleLower, i);
    if (idx === -1) {
      segments.push({ text: text.slice(i), match: false });
      break;
    }
    if (idx > i) segments.push({ text: text.slice(i, idx), match: false });
    segments.push({ text: text.slice(idx, idx + trimmed.length), match: true });
    i = idx + trimmed.length;
  }
  return segments;
}

export function collectTags(notes: Note[]): string[] {
  const set = new Map<string, string>();
  for (const note of notes) {
    if (note.deletedAt || note.id === FAULT_LOG_ID) continue;
    for (const tag of note.tags) {
      const key = tag.toLowerCase();
      if (!set.has(key)) set.set(key, tag);
    }
  }
  return [...set.values()].sort((a, b) => a.localeCompare(b));
}

export function visibleNotes(
  notes: Record<string, Note>,
  query: string,
  activeTag: string | null,
): Note[] {
  return Object.values(notes)
    .filter((n) => noteMatches(n, query, activeTag))
    .sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
      return b.updatedAt - a.updatedAt;
    });
}
