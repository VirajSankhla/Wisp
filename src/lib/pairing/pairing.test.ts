import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { isPairingCodeShape, mintPairingCode, normalizePairingCode } from "./codes.ts";
import { generateIdentity } from "./crypto.ts";
import {
  consumeAccept,
  createOffer,
  encodeEnvelope,
  makeAccept,
  parseOffer,
} from "./session.ts";

describe("pairing codes", () => {
  it("mints a high-entropy WSP-XXXX-XXXX-XXXX-XXXX code", () => {
    const a = mintPairingCode();
    const b = mintPairingCode();
    assert.notEqual(a.code, b.code);
    assert.notEqual(a.secret, b.secret);
    assert.equal(isPairingCodeShape(a.code), true);
    assert.equal(a.secret.length > 20, true);
  });

  it("normalizes spacing and case", () => {
    assert.equal(
      normalizePairingCode("wsp 7k4p 92mx abcd efgh"),
      "WSP-7K4P-92MX-ABCD-EFGH",
    );
  });
});

describe("device pairing handshake", () => {
  it("pairs two peers in both directions without reusing the offer", async () => {
    const laptop = await generateIdentity("Wisp on Windows");
    const phone = await generateIdentity("Wisp on Android");
    const stored = createOffer(laptop);
    const qr = encodeEnvelope(stored.offer);
    const offer = parseOffer(qr);
    assert.equal(offer.device.name, "Wisp on Windows");

    const accept = await makeAccept(phone, offer);
    const trusted = await consumeAccept(stored, accept);
    assert.equal(trusted.id, phone.id);
    assert.equal(trusted.name, "Wisp on Android");

    await assert.rejects(() => consumeAccept(stored, accept), /already used/);
  });

  it("rejects an expired offer", async () => {
    const laptop = await generateIdentity("Laptop");
    const phone = await generateIdentity("Phone");
    const stored = createOffer(laptop, 1_000, 5_000);
    await assert.rejects(
      () => makeAccept(phone, stored.offer, 20_000),
      /expired/,
    );
  });

  it("rejects pairing a device with itself", async () => {
    const only = await generateIdentity("Solo");
    const stored = createOffer(only);
    await assert.rejects(() => makeAccept(only, stored.offer), /itself/);
  });

  it("does not treat the pairing secret as a permanent credential", () => {
    const a = mintPairingCode();
    const b = mintPairingCode();
    assert.notEqual(a.secret, b.secret);
    assert.match(a.code, /^WSP-/);
    assert.equal(a.secret.includes(a.code), false);
  });
});
