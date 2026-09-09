import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { BACKUP_KIND, buildBackup, parseBackup } from "./backup.ts";
import type { Note } from "./types.ts";

const note: Note = {
  id: "n1",
  heading: "Hello",
  body: "World",
  tags: ["ideas"],
  pinned: false,
  updatedAt: 100,
  deletedAt: null,
};

describe("parseBackup", () => {
  it("accepts a valid wisp.backup.v1 document", () => {
    const result = parseBackup({
      kind: BACKUP_KIND,
      exportedAt: 200,
      notes: [note],
    });
    assert.equal(result.ok, true);
  });

  it("rejects a raw array and the wrong kind", () => {
    assert.equal(parseBackup([note]).ok, false);
    assert.equal(
      parseBackup({ kind: "noter.backup.v0", exportedAt: 1, notes: [note] }).ok,
      false,
    );
  });

  it("omits tombstones from a built backup", () => {
    const backup = buildBackup({
      n1: note,
      n2: { ...note, id: "n2", deletedAt: 9 },
    });
    assert.equal(backup.notes.length, 1);
  });
});
