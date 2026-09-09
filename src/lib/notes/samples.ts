import type { Note } from "./types.ts";

function note(
  partial: Omit<Note, "deletedAt" | "pinned"> & { pinned?: boolean },
): Note {
  return { pinned: false, deletedAt: null, ...partial };
}

export const SAMPLE_IDS = [
  "wisp-sample-heading",
  "wisp-sample-ideas",
  "wisp-sample-edge",
] as const;

export function sampleNotes(now = Date.now()): Record<string, Note> {
  const a = note({
    id: "wisp-sample-heading",
    heading: "Headings are the whole index",
    body: "The list only shows this line. Open it when you need the rest.\n\nTags stay out of the way. Search a word, or type #howto, to filter.",
    tags: ["wisp", "howto"],
    updatedAt: now - 1000 * 60 * 12,
  });
  const b = note({
    id: "wisp-sample-ideas",
    heading: "Ideas worth stealing later",
    body: "If capturing a thought takes three clicks, the thought is already gone. Keep Wisp at the edge and write the heading first.",
    tags: ["ideas", "product"],
    updatedAt: now - 1000 * 60 * 48,
  });
  const c = note({
    id: "wisp-sample-edge",
    heading: "Tuck this to the edge",
    body: "On a laptop, click the desk beside this panel and Wisp collapses to a handle. On a phone, swipe in from the right edge to bring it back.\n\nN new note · / search · Esc tuck · ? guide.",
    tags: ["howto"],
    updatedAt: now - 1000 * 60 * 90,
    pinned: true,
  });
  return { [a.id]: a, [b.id]: b, [c.id]: c };
}
