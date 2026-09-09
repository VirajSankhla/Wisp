import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  encodeConnectionCode,
  isConnectionCodeShape,
  mintConnectionCode,
  parseConnectionCode,
} from "./codes.ts";

describe("connection codes", () => {
  it("mints a 50–100 character WISP. code", () => {
    const a = mintConnectionCode();
    const b = mintConnectionCode();
    assert.notEqual(a.code, b.code);
    assert.equal(a.code.startsWith("WISP."), true);
    assert.equal(a.code.length >= 50, true);
    assert.equal(a.code.length <= 100, true);
    assert.equal(isConnectionCodeShape(a.code), true);
  });

  it("round-trips and rejects an expired code", () => {
    const offer = mintConnectionCode(1_000, 5_000);
    const parsed = parseConnectionCode(offer.code, 2_000);
    assert.equal(parsed.secret.length, 48);
    assert.throws(() => parseConnectionCode(offer.code, 20_000), /expired/);
  });

  it("re-issues a fresh 5-minute code for the same secret", () => {
    const offer = mintConnectionCode(1_000, 5_000);
    const later = encodeConnectionCode(offer.secret, 2_000, 5_000);
    assert.notEqual(later, offer.code);
    const parsed = parseConnectionCode(later, 3_000);
    assert.deepEqual(parsed.secret, offer.secret);
  });

  it("rejects garbage and does not treat the code as a login", () => {
    assert.throws(() => parseConnectionCode("google-oauth-token"), /not a Wisp/);
    assert.throws(() => parseConnectionCode("WISP.????"), /damaged|not a Wisp/);
  });
});
