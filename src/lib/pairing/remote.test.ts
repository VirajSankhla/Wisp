import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { mintConnectionCode } from "./codes.ts";
import { encodeInvite, parseInvite } from "./invite.ts";
import { unwrapRemoteBody } from "./remote.ts";
import { PEER_SYNC_KIND } from "./sync.ts";

describe("remote API invites", () => {
  it("round-trips a lock plus API URL through a QR invite", () => {
    const offer = mintConnectionCode();
    const code = encodeInvite(offer.secret, {
      url: "https://api.example.com/v3/b/abc",
      header: "X-Master-Key: secret",
    });
    assert.equal(code.startsWith("WISP2."), true);
    const parsed = parseInvite(code);
    assert.deepEqual(parsed.secret, offer.secret);
    assert.equal(parsed.remote.url, "https://api.example.com/v3/b/abc");
    assert.equal(parsed.remote.header, "X-Master-Key: secret");
  });

  it("unwraps JSONBin-style envelopes", () => {
    const inner = { v: 1, kind: PEER_SYNC_KIND, vaultId: "x", exportedAt: 1, iv: "a", data: "b" };
    assert.equal(unwrapRemoteBody({ record: inner }), inner);
    assert.equal(unwrapRemoteBody(inner), inner);
  });
});
