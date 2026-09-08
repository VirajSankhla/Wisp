import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { shouldPurgeTombstone, tombstoneRetentionMs } from "./tombstones.ts";

describe("tombstoneRetentionMs", () => {
  it("defaults to keep-forever when unset", () => {
    assert.equal(tombstoneRetentionMs({}), null);
    assert.equal(tombstoneRetentionMs({ WISP_TOMBSTONE_RETENTION_MS: "0" }), null);
    assert.equal(tombstoneRetentionMs({ WISP_TOMBSTONE_RETENTION_MS: "nope" }), null);
  });

  it("reads a positive operator-configured window", () => {
    assert.equal(
      tombstoneRetentionMs({ WISP_TOMBSTONE_RETENTION_MS: "86400000" }),
      86_400_000,
    );
  });
});

describe("shouldPurgeTombstone", () => {
  it("never purges live notes or when retention is off", () => {
    assert.equal(shouldPurgeTombstone(null, 100, 10), false);
    assert.equal(shouldPurgeTombstone(1, 100, null), false);
  });

  it("purges only tombstones older than the window", () => {
    assert.equal(shouldPurgeTombstone(50, 100, 10), true);
    assert.equal(shouldPurgeTombstone(95, 100, 10), false);
  });
});
