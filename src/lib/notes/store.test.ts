import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { purgeExpiredNotes, TRASH_RETENTION_MS } from "./store.ts";
import type { Note } from "./types.ts";

function note(patch: Partial<Note> & { id: string }): Note {
  return {
    heading: "Note",
    body: "",
    tags: [],
    pinned: false,
    updatedAt: 0,
    deletedAt: null,
    ...patch,
  };
}

describe("purgeExpiredNotes", () => {
  it("removes only notes deleted longer ago than the retention window", () => {
    const now = 1_000_000_000_000;
    const result = purgeExpiredNotes(
      {
        fresh: note({ id: "fresh", deletedAt: now - 1000 }),
        old: note({ id: "old", deletedAt: now - TRASH_RETENTION_MS - 1 }),
        alive: note({ id: "alive", deletedAt: null }),
      },
      now,
    );
    assert.equal(result.purged, 1);
    assert.ok(result.notes.fresh);
    assert.ok(result.notes.alive);
    assert.equal(result.notes.old, undefined);
  });

  it("returns the same object and purged: 0 when nothing has expired", () => {
    const notes = { a: note({ id: "a", deletedAt: null }) };
    const result = purgeExpiredNotes(notes, Date.now());
    assert.equal(result.purged, 0);
    assert.equal(result.notes, notes);
  });

  it("respects a custom retention window", () => {
    const now = 1_000_000_000_000;
    const oneHour = 60 * 60 * 1000;
    const result = purgeExpiredNotes(
      { a: note({ id: "a", deletedAt: now - oneHour - 1 }) },
      now,
      oneHour,
    );
    assert.equal(result.purged, 1);
  });
});
