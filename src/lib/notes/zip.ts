/**
 * Minimal ZIP writer — STORE method only, no compression. Good enough for
 * exporting a handful of small text files without pulling in a dependency.
 */

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[n] = c >>> 0;
  }
  return table;
})();

export function crc32(data: Uint8Array): number {
  let crc = 0xffffffff;
  for (let i = 0; i < data.length; i++) {
    crc = (CRC_TABLE[(crc ^ data[i]) & 0xff] ?? 0) ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

export type ZipEntry = { name: string; content: Uint8Array };

class ByteWriter {
  private parts: number[] = [];

  u16(value: number) {
    this.parts.push(value & 0xff, (value >>> 8) & 0xff);
  }

  u32(value: number) {
    this.parts.push(
      value & 0xff,
      (value >>> 8) & 0xff,
      (value >>> 16) & 0xff,
      (value >>> 24) & 0xff,
    );
  }

  bytes(data: Uint8Array) {
    for (const b of data) this.parts.push(b);
  }

  get length() {
    return this.parts.length;
  }

  done(): Uint8Array {
    return Uint8Array.from(this.parts);
  }
}

function concat(chunks: Uint8Array[]): Uint8Array {
  const total = chunks.reduce((sum, c) => sum + c.length, 0);
  const out = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    out.set(chunk, offset);
    offset += chunk.length;
  }
  return out;
}

function dosDateTime(date: Date): { time: number; date: number } {
  const time =
    ((date.getHours() & 0x1f) << 11) |
    ((date.getMinutes() & 0x3f) << 5) |
    ((Math.floor(date.getSeconds() / 2)) & 0x1f);
  const dosYear = Math.max(0, date.getFullYear() - 1980);
  const dosDate =
    ((dosYear & 0x7f) << 9) | (((date.getMonth() + 1) & 0xf) << 5) | (date.getDate() & 0x1f);
  return { time, date: dosDate };
}

/** Deterministic per-entry name — throws on duplicate names (caller de-dupes). */
export function buildZip(entries: ZipEntry[], now = new Date()): Uint8Array {
  const seen = new Set<string>();
  for (const entry of entries) {
    if (seen.has(entry.name)) throw new Error(`Duplicate zip entry name: ${entry.name}`);
    seen.add(entry.name);
  }

  const { time, date } = dosDateTime(now);
  const fileChunks: Uint8Array[] = [];
  const centralChunks: Uint8Array[] = [];
  let offset = 0;

  for (const entry of entries) {
    const nameBytes = new TextEncoder().encode(entry.name);
    const crc = crc32(entry.content);
    const size = entry.content.length;

    const local = new ByteWriter();
    local.u32(0x04034b50);
    local.u16(20);
    local.u16(0);
    local.u16(0);
    local.u16(time);
    local.u16(date);
    local.u32(crc);
    local.u32(size);
    local.u32(size);
    local.u16(nameBytes.length);
    local.u16(0);
    local.bytes(nameBytes);
    const localBytes = local.done();

    fileChunks.push(localBytes, entry.content);

    const centralEntry = new ByteWriter();
    centralEntry.u32(0x02014b50);
    centralEntry.u16(20);
    centralEntry.u16(20);
    centralEntry.u16(0);
    centralEntry.u16(0);
    centralEntry.u16(time);
    centralEntry.u16(date);
    centralEntry.u32(crc);
    centralEntry.u32(size);
    centralEntry.u32(size);
    centralEntry.u16(nameBytes.length);
    centralEntry.u16(0);
    centralEntry.u16(0);
    centralEntry.u16(0);
    centralEntry.u16(0);
    centralEntry.u32(0);
    centralEntry.u32(offset);
    centralEntry.bytes(nameBytes);
    centralChunks.push(centralEntry.done());

    offset += localBytes.length + size;
  }

  const centralStart = offset;
  const centralBytes = concat(centralChunks);

  const end = new ByteWriter();
  end.u32(0x06054b50);
  end.u16(0);
  end.u16(0);
  end.u16(entries.length);
  end.u16(entries.length);
  end.u32(centralBytes.length);
  end.u32(centralStart);
  end.u16(0);

  return concat([...fileChunks, centralBytes, end.done()]);
}
