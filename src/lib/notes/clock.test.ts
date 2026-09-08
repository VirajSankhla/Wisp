import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { CLOCK_SKEW_MS, clampNoteTime, isStaleWrite } from "./clock.ts";

describe("clampNoteTime", () => {
  it("keeps a legitimate past timestamp (offline edit)", () => {
    const now = 1_700_000_000_000;
    const yesterday = now - 86_400_000;
    assert.equal(clampNoteTime(yesterday, now), yesterday);
  });

  it("keeps a timestamp within the skew window", () => {
    const now = 1_700_000_000_000;
    const ahead = now + CLOCK_SKEW_MS - 1;
    assert.equal(clampNoteTime(ahead, now), ahead);
  });

  it("clamps an absurd future timestamp so it cannot dominate forever", () => {
    const now = 1_700_000_000_000;
    const far = now + 10 * 365 * 86400 * 1000;
    assert.equal(clampNoteTime(far, now), now + CLOCK_SKEW_MS);
  });

  it("replaces non-finite or negative values with now", () => {
    const now = 1_700_000_000_000;
    assert.equal(clampNoteTime(Number.NaN, now), now);
    assert.equal(clampNoteTime(-1, now), now);
  });
});

describe("isStaleWrite", () => {
  it("allows the first write and a newer write", () => {
    assert.equal(isStaleWrite(10, null), false);
    assert.equal(isStaleWrite(20, 10), false);
  });

  it("rejects an older update so it cannot overwrite newer data", () => {
    assert.equal(isStaleWrite(5, 10), true);
  });

  it("lets an equal timestamp through (deterministic last-write-wins, last apply)", () => {
    assert.equal(isStaleWrite(10, 10), false);
  });
});
