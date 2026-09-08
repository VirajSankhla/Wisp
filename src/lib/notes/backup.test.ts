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
    if (result.ok) {
      assert.equal(result.notes.length, 1);
      assert.equal(result.notes[0]?.heading, "Hello");
    }
  });

  it("rejects a raw array (must be the backup envelope)", () => {
    const result = parseBackup([note]);
    assert.equal(result.ok, false);
  });

  it("rejects the wrong kind", () => {
    const result = parseBackup({
      kind: "noter.backup.v0",
      exportedAt: 1,
      notes: [note],
    });
    assert.equal(result.ok, false);
  });

  it("rejects a note that exceeds schema limits", () => {
    const result = parseBackup({
      kind: BACKUP_KIND,
      exportedAt: 1,
      notes: [{ ...note, heading: "x".repeat(241) }],
    });
    assert.equal(result.ok, false);
  });

  it("omits tombstones from a built backup", () => {
    const backup = buildBackup({
      n1: note,
      n2: { ...note, id: "n2", deletedAt: 9 },
    });
    assert.equal(backup.kind, BACKUP_KIND);
    assert.equal(backup.notes.length, 1);
    assert.equal(backup.notes[0]?.id, "n1");
  });
});
