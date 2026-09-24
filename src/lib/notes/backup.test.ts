import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { BACKUP_KIND, buildBackup, buildMarkdownZipEntries, parseBackup } from "./backup.ts";
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

describe("buildMarkdownZipEntries", () => {
  it("names one .md file per note from its heading", () => {
    const entries = buildMarkdownZipEntries([
      note,
      { ...note, id: "n2", heading: "Second note" },
    ]);
    assert.deepEqual(
      entries.map((e) => e.name),
      ["hello.md", "second-note.md"],
    );
  });

  it("de-duplicates notes that slugify to the same name", () => {
    const entries = buildMarkdownZipEntries([
      { ...note, heading: "" },
      { ...note, id: "n2", heading: "" },
      { ...note, id: "n3", heading: "" },
    ]);
    assert.deepEqual(
      entries.map((e) => e.name),
      ["note.md", "note-2.md", "note-3.md"],
    );
  });

  it("encodes each note as markdown with its heading and body", () => {
    const [entry] = buildMarkdownZipEntries([note]);
    const text = new TextDecoder().decode(entry!.content);
    assert.match(text, /^# Hello/);
    assert.match(text, /World/);
  });
});
