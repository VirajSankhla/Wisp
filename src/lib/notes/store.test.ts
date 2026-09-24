import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  HISTORY_MAX,
  HISTORY_MIN_GAP_MS,
  purgeExpiredNotes,
  TRASH_RETENTION_MS,
  withHistoryCheckpoint,
} from "./store.ts";
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

describe("withHistoryCheckpoint", () => {
  const base = note({
    id: "a",
    heading: "Old heading",
    body: "Old body",
    updatedAt: 1_000_000,
  });

  it("leaves history untouched when the patch doesn't change heading or body", () => {
    const history = withHistoryCheckpoint(base, {}, 2_000_000);
    assert.equal(history, base.history);
  });

  it("checkpoints the old content when enough time has passed", () => {
    const nowMs = base.updatedAt + HISTORY_MIN_GAP_MS + 1;
    const history = withHistoryCheckpoint(base, { heading: "New heading" }, nowMs);
    assert.deepEqual(history, [
      { heading: "Old heading", body: "Old body", updatedAt: base.updatedAt },
    ]);
  });

  it("skips the checkpoint when the last edit was too recent", () => {
    const nowMs = base.updatedAt + HISTORY_MIN_GAP_MS - 1;
    const history = withHistoryCheckpoint(base, { heading: "New heading" }, nowMs);
    assert.equal(history, undefined);
  });

  it("caps history at HISTORY_MAX, dropping the oldest entry", () => {
    const full = {
      ...base,
      history: Array.from({ length: HISTORY_MAX }, (_, i) => ({
        heading: `v${i}`,
        body: "",
        updatedAt: i,
      })),
    };
    const nowMs = full.updatedAt + HISTORY_MIN_GAP_MS + 1;
    const history = withHistoryCheckpoint(full, { heading: "Newest" }, nowMs);
    assert.equal(history?.length, HISTORY_MAX);
    assert.equal(history?.[0]?.heading, "Old heading");
    assert.equal(history?.at(-1)?.heading, `v${HISTORY_MAX - 2}`);
  });
});
