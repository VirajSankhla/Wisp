import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { collectTags, noteMatches, parseQuery, visibleNotes } from "./search.ts";
import type { Note } from "./types.ts";

function note(partial: Partial<Note> & Pick<Note, "id" | "heading">): Note {
  return {
    body: "",
    tags: [],
    pinned: false,
    updatedAt: 1,
    deletedAt: null,
    ...partial,
  };
}

describe("parseQuery", () => {
  it("pulls #tags out of the typed query", () => {
    assert.deepEqual(parseQuery("hello #ideas #work"), {
      text: "hello",
      tags: ["ideas", "work"],
    });
  });
});

describe("noteMatches / visibleNotes", () => {
  const ideas = note({
    id: "1",
    heading: "Steal later",
    body: "a thought",
    tags: ["ideas"],
    updatedAt: 10,
  });
  const howto = note({
    id: "2",
    heading: "Headings are the index",
    tags: ["howto"],
    pinned: true,
    updatedAt: 5,
  });
  const gone = note({
    id: "3",
    heading: "Deleted",
    tags: ["ideas"],
    deletedAt: 9,
    updatedAt: 9,
  });

  it("hides tombstones and filters by #tag without showing tags in the list data", () => {
    assert.equal(noteMatches(ideas, "#ideas", null), true);
    assert.equal(noteMatches(howto, "#ideas", null), false);
    assert.equal(noteMatches(gone, "#ideas", null), false);
    const list = visibleNotes({ 1: ideas, 2: howto, 3: gone }, "", null);
    assert.deepEqual(
      list.map((n) => n.id),
      ["2", "1"],
    );
    assert.equal(list.some((n) => n.tags.length > 0 && n.heading === "Steal later"), true);
  });

  it("matches heading text and an active tag together", () => {
    assert.equal(noteMatches(ideas, "steal", "ideas"), true);
    assert.equal(noteMatches(ideas, "steal", "howto"), false);
    assert.equal(noteMatches(howto, "index", null), true);
  });

  it("collects unique tags from live notes only", () => {
    assert.deepEqual(collectTags([ideas, howto, gone]), ["howto", "ideas"]);
  });
});
