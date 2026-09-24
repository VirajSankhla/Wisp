import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { highlightSegments, parseQuery } from "./search.ts";

describe("parseQuery", () => {
  it("splits #tags out of the free-text search", () => {
    assert.deepEqual(parseQuery("ideas #howto #wisp"), {
      text: "ideas",
      tags: ["howto", "wisp"],
    });
  });
});

describe("highlightSegments", () => {
  it("returns one unmatched segment for an empty needle", () => {
    assert.deepEqual(highlightSegments("Hello world", ""), [
      { text: "Hello world", match: false },
    ]);
  });

  it("splits around a case-insensitive match", () => {
    assert.deepEqual(highlightSegments("Hello World", "world"), [
      { text: "Hello ", match: false },
      { text: "World", match: true },
    ]);
  });

  it("matches every occurrence", () => {
    assert.deepEqual(highlightSegments("na na na", "na"), [
      { text: "na", match: true },
      { text: " ", match: false },
      { text: "na", match: true },
      { text: " ", match: false },
      { text: "na", match: true },
    ]);
  });

  it("returns one unmatched segment when the needle isn't present", () => {
    assert.deepEqual(highlightSegments("Hello world", "xyz"), [
      { text: "Hello world", match: false },
    ]);
  });
});
