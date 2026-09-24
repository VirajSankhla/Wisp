import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildZip, crc32 } from "./zip.ts";

function readU32(bytes: Uint8Array, offset: number): number {
  return (
    bytes[offset]! |
    (bytes[offset + 1]! << 8) |
    (bytes[offset + 2]! << 16) |
    (bytes[offset + 3]! << 24)
  ) >>> 0;
}

function readU16(bytes: Uint8Array, offset: number): number {
  return bytes[offset]! | (bytes[offset + 1]! << 8);
}

/** Minimal local-file-header reader — enough to round-trip what buildZip writes. */
function readLocalEntries(zip: Uint8Array) {
  const out: { name: string; content: Uint8Array; crc: number }[] = [];
  let offset = 0;
  while (offset < zip.length && readU32(zip, offset) === 0x04034b50) {
    const crc = readU32(zip, offset + 14);
    const size = readU32(zip, offset + 18);
    const nameLen = readU16(zip, offset + 26);
    const extraLen = readU16(zip, offset + 28);
    const nameStart = offset + 30;
    const dataStart = nameStart + nameLen + extraLen;
    const name = new TextDecoder().decode(zip.slice(nameStart, nameStart + nameLen));
    const content = zip.slice(dataStart, dataStart + size);
    out.push({ name, content, crc });
    offset = dataStart + size;
  }
  return out;
}

describe("crc32", () => {
  it("matches the well-known checksum for an empty input and for ascii text", () => {
    assert.equal(crc32(new Uint8Array()), 0);
    assert.equal(crc32(new TextEncoder().encode("123456789")), 0xcbf43926);
  });
});

describe("buildZip", () => {
  it("round-trips file names and contents", () => {
    const entries = [
      { name: "a.md", content: new TextEncoder().encode("# Heading\n\nBody text.") },
      { name: "b.md", content: new TextEncoder().encode("") },
    ];
    const zip = buildZip(entries, new Date(2026, 0, 1));
    const read = readLocalEntries(zip);
    assert.equal(read.length, 2);
    assert.equal(read[0]!.name, "a.md");
    assert.equal(new TextDecoder().decode(read[0]!.content), "# Heading\n\nBody text.");
    assert.equal(read[0]!.crc, crc32(entries[0]!.content));
    assert.equal(read[1]!.name, "b.md");
    assert.equal(read[1]!.content.length, 0);
  });

  it("ends with a valid end-of-central-directory signature", () => {
    const zip = buildZip([{ name: "only.md", content: new TextEncoder().encode("x") }]);
    assert.equal(readU32(zip, zip.length - 22), 0x06054b50);
  });

  it("rejects duplicate entry names", () => {
    const dupe = [
      { name: "a.md", content: new Uint8Array() },
      { name: "a.md", content: new Uint8Array() },
    ];
    assert.throws(() => buildZip(dupe));
  });

  it("builds an empty archive with just an end-of-central-directory record", () => {
    const zip = buildZip([]);
    assert.equal(zip.length, 22);
    assert.equal(readU32(zip, 0), 0x06054b50);
  });
});
