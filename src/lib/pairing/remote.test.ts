import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { mintConnectionCode } from "./codes.ts";
import { encodeInvite, parseInvite } from "./invite.ts";
import { buildJsonBinRemote, unwrapRemoteBody } from "./remote.ts";
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

describe("buildJsonBinRemote", () => {
  it("builds a URL and header from a bare bin id and key", () => {
    const remote = buildJsonBinRemote("abc123", "secretKey");
    assert.equal(remote.url, "https://api.jsonbin.io/v3/b/abc123");
    assert.equal(remote.header, "X-Master-Key: secretKey");
  });

  it("extracts the bin id from a full URL pasted from the dashboard", () => {
    const remote = buildJsonBinRemote(
      "https://api.jsonbin.io/v3/b/abc123",
      "secretKey",
    );
    assert.equal(remote.url, "https://api.jsonbin.io/v3/b/abc123");
  });

  it("strips an X-Master-Key: prefix if pasted along with the key", () => {
    const remote = buildJsonBinRemote("abc123", "X-Master-Key: secretKey");
    assert.equal(remote.header, "X-Master-Key: secretKey");
  });

  it("is empty when the id or key is blank", () => {
    assert.equal(buildJsonBinRemote("", "key").url, "");
    assert.equal(buildJsonBinRemote("abc123", "").header, "");
  });
});
