import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { CLOCK_SKEW_MS } from "./clock.ts";
import { mergeNotes, sanitizeNote } from "./merge.ts";
import type { Note } from "./types.ts";

function note(partial: Partial<Note> & Pick<Note, "id">): Note {
  return {
    heading: "H",
    body: "B",
    tags: [],
    pinned: false,
    updatedAt: 100,
    deletedAt: null,
    ...partial,
  };
}

describe("sanitizeNote", () => {
  it("accepts a well-shaped note and rejects garbage", () => {
    const ok = sanitizeNote(note({ id: "a", updatedAt: 50 }), 1_000);
    assert.equal(ok?.id, "a");
    assert.equal(sanitizeNote({ heading: "nope" }), null);
    assert.equal(sanitizeNote(null), null);
  });

  it("clamps an absurd future timestamp", () => {
    const now = 1_700_000_000_000;
    const far = now + 10 * 365 * 86400 * 1000;
    const got = sanitizeNote(note({ id: "a", updatedAt: far }), now);
    assert.equal(got?.updatedAt, now + CLOCK_SKEW_MS);
  });
});

describe("mergeNotes", () => {
  const local: Record<string, Note> = {
    keep: note({ id: "keep", heading: "Local", updatedAt: 200 }),
    older: note({ id: "older", heading: "Local old", updatedAt: 50 }),
  };

  it("leaves local notes intact when remote is empty or not an array", () => {
    assert.deepEqual(mergeNotes(local, []).notes, local);
    assert.equal(mergeNotes(local, []).applied, 0);
    assert.deepEqual(mergeNotes(local, null).notes, local);
    assert.deepEqual(mergeNotes(local, undefined).notes, local);
    assert.deepEqual(mergeNotes(local, { notes: [] }).notes, local);
  });

  it("does not let an older remote row overwrite a newer local one", () => {
    const { notes, skipped } = mergeNotes(local, [
      note({ id: "keep", heading: "Remote stale", updatedAt: 10 }),
    ]);
    assert.equal(notes.keep?.heading, "Local");
    assert.equal(skipped, 1);
  });

  it("applies a newer remote row and a brand-new id", () => {
    const { notes, applied } = mergeNotes(local, [
      note({ id: "keep", heading: "Remote wins", updatedAt: 400 }),
      note({ id: "fresh", heading: "New", updatedAt: 1 }),
    ]);
    assert.equal(notes.keep?.heading, "Remote wins");
    assert.equal(notes.fresh?.heading, "New");
    assert.equal(notes.older?.heading, "Local old");
    assert.equal(applied, 2);
  });

  it("lets a newer tombstone hide a live local note", () => {
    const { notes } = mergeNotes(local, [
      note({ id: "keep", updatedAt: 500, deletedAt: 500 }),
    ]);
    assert.equal(notes.keep?.deletedAt, 500);
  });

  it("skips invalid rows instead of throwing", () => {
    const { notes, skipped, applied } = mergeNotes(local, [
      { id: "x" },
      note({ id: "fresh", heading: "ok", updatedAt: 1 }),
    ]);
    assert.equal(notes.fresh?.heading, "ok");
    assert.equal(notes.keep?.heading, "Local");
    assert.equal(skipped, 1);
    assert.equal(applied, 1);
  });
});
