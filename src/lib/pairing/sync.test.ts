import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { Note } from "../notes/types.ts";
import { generateIdentity } from "./crypto.ts";
import { PEER_SYNC_KIND, buildPeerSync, verifyPeerSync } from "./sync.ts";

function note(id: string, heading: string, updatedAt: number): Note {
  return {
    id,
    heading,
    body: "body",
    tags: ["ideas"],
    pinned: false,
    updatedAt,
    deletedAt: null,
  };
}

describe("peer-sync snapshots", () => {
  it("round-trips a signed snapshot between two paired devices", async () => {
    const laptop = await generateIdentity("Wisp on Windows");
    const phone = await generateIdentity("Wisp on Android");
    const bundle = await buildPeerSync(laptop, {
      a: note("a", "From laptop", 10),
      b: { ...note("b", "Gone", 20), deletedAt: 20 },
    });
    assert.equal(bundle.kind, PEER_SYNC_KIND);
    assert.equal(bundle.notes.length, 2);
    assert.equal(
      bundle.notes.some((n) => n.deletedAt != null),
      true,
    );

    const verified = await verifyPeerSync(bundle, [
      { id: laptop.id, name: laptop.name, publicKey: laptop.publicKey },
    ]);
    assert.equal(verified.ok, true);
    if (verified.ok) {
      assert.equal(verified.bundle.from.name, "Wisp on Windows");
      assert.equal(verified.bundle.notes[0]?.heading, "From laptop");
    }

    const asPhone = await verifyPeerSync(bundle, [
      { id: phone.id, name: phone.name, publicKey: phone.publicKey },
    ]);
    assert.equal(asPhone.ok, false);
  });

  it("rejects a snapshot from a device that is not trusted", async () => {
    const stranger = await generateIdentity("Stranger");
    const bundle = await buildPeerSync(stranger, {
      a: note("a", "Nope", 1),
    });
    const result = await verifyPeerSync(bundle, []);
    assert.equal(result.ok, false);
    if (!result.ok) assert.match(result.error, /not from a device you have paired/);
  });

  it("rejects a tampered note list even if the sender id is trusted", async () => {
    const laptop = await generateIdentity("Laptop");
    const bundle = await buildPeerSync(laptop, {
      a: note("a", "Original", 1),
    });
    const tampered = {
      ...bundle,
      notes: [note("a", "Injected", 1)],
    };
    const result = await verifyPeerSync(tampered, [
      { id: laptop.id, name: laptop.name, publicKey: laptop.publicKey },
    ]);
    assert.equal(result.ok, false);
    if (!result.ok) assert.match(result.error, /signature/i);
  });

  it("rejects a swapped public key for a known device id", async () => {
    const laptop = await generateIdentity("Laptop");
    const impostor = await generateIdentity("Impostor");
    const bundle = await buildPeerSync(impostor, {
      a: note("a", "Hi", 1),
    });
    const spoofed = {
      ...bundle,
      from: {
        id: laptop.id,
        name: laptop.name,
        publicKey: impostor.publicKey,
      },
    };
    const result = await verifyPeerSync(spoofed, [
      { id: laptop.id, name: laptop.name, publicKey: laptop.publicKey },
    ]);
    assert.equal(result.ok, false);
  });

  it("rejects a raw backup file pretending to be a peer snapshot", async () => {
    const result = await verifyPeerSync(
      { kind: "wisp.backup.v1", exportedAt: 1, notes: [] },
      [],
    );
    assert.equal(result.ok, false);
  });
});
