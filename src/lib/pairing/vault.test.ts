import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { mintConnectionCode, parseConnectionCode } from "./codes.ts";
import { buildPeerSync, openPeerSync } from "./sync.ts";
import { clearVault, saveVaultFromSecret } from "./vault.ts";
import type { Note } from "../notes/types.ts";

const store = new Map<string, string>();
// @ts-expect-error node has no localStorage; pairing vault needs a stand-in
globalThis.localStorage = {
  getItem: (k: string) => store.get(k) ?? null,
  setItem: (k: string, v: string) => {
    store.set(k, v);
  },
  removeItem: (k: string) => {
    store.delete(k);
  },
};

const note: Note = {
  id: "a",
  heading: "Shared",
  body: "hello",
  tags: [],
  pinned: false,
  updatedAt: 1,
  deletedAt: null,
};

describe("shared vault from a connection code", () => {
  it("lets two devices that share a code open the same snapshot", async () => {
    store.clear();
    const offer = mintConnectionCode();
    const parsed = parseConnectionCode(offer.code);
    await saveVaultFromSecret(offer.secret);
    const bundle = await buildPeerSync({ a: note });
    clearVault();

    await saveVaultFromSecret(parsed.secret);
    const opened = await openPeerSync(bundle);
    assert.equal(opened.ok, true);
    if (opened.ok) assert.equal(opened.notes[0]?.heading, "Shared");
    clearVault();
  });

  it("rejects a snapshot when this device never connected", async () => {
    store.clear();
    const result = await openPeerSync({
      v: 1,
      kind: "wisp.peer-sync.v1",
      vaultId: "x",
      exportedAt: 1,
      iv: "aa",
      data: "bb",
    });
    assert.equal(result.ok, false);
  });
});
