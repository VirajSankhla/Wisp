import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { parseNoteLinks, resolveNoteLinks } from "./links.ts";
import type { Note } from "./types.ts";

function note(patch: Partial<Note> & { id: string; heading: string }): Note {
  return {
    body: "",
    tags: [],
    pinned: false,
    updatedAt: 0,
    deletedAt: null,
    ...patch,
  };
}

describe("parseNoteLinks", () => {
  it("extracts [[targets]] in first-seen order", () => {
    assert.deepEqual(
      parseNoteLinks("See [[Ideas worth stealing]] and also [[Groceries]]."),
      ["Ideas worth stealing", "Groceries"],
    );
  });

  it("de-duplicates case-insensitively, keeping the first casing", () => {
    assert.deepEqual(parseNoteLinks("[[Groceries]] ... [[groceries]]"), ["Groceries"]);
  });

  it("ignores empty brackets and returns nothing for plain text", () => {
    assert.deepEqual(parseNoteLinks("[[ ]] just text"), []);
    assert.deepEqual(parseNoteLinks("no links here"), []);
  });

  it("doesn't span across a stray closing bracket", () => {
    assert.deepEqual(parseNoteLinks("[[a]] text ]] [[b]]"), ["a", "b"]);
  });
});

describe("resolveNoteLinks", () => {
  const groceries = note({ id: "g", heading: "Groceries" });
  const ideas = note({ id: "i", heading: "Ideas worth stealing" });
  const deleted = note({ id: "d", heading: "Gone", deletedAt: 1 });

  it("matches a target to a note by heading, case-insensitively", () => {
    const resolved = resolveNoteLinks(["groceries"], [groceries, ideas]);
    assert.equal(resolved[0]!.note, groceries);
  });

  it("leaves an unmatched target with note: null", () => {
    const resolved = resolveNoteLinks(["Nonexistent"], [groceries]);
    assert.equal(resolved[0]!.note, null);
  });

  it("never resolves to a deleted note", () => {
    const resolved = resolveNoteLinks(["Gone"], [deleted]);
    assert.equal(resolved[0]!.note, null);
  });
});
