import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { mergeNotes } from "./merge.ts";
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

describe("mergeNotes", () => {
  const local: Record<string, Note> = {
    keep: note({ id: "keep", heading: "Local", updatedAt: 200 }),
  };

  it("leaves local notes intact when remote is empty", () => {
    assert.deepEqual(mergeNotes(local, []).notes, local);
    assert.deepEqual(mergeNotes(local, null).notes, local);
  });

  it("does not let an older remote row overwrite a newer local one", () => {
    const { notes } = mergeNotes(local, [
      note({ id: "keep", heading: "Remote stale", updatedAt: 10 }),
    ]);
    assert.equal(notes.keep?.heading, "Local");
  });
});
