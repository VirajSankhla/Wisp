import { BACKUP_KIND, backupSchema, noteFromParsed } from "./schema.ts";
import type { Note } from "./types.ts";
import { buildZip } from "./zip.ts";

export { BACKUP_KIND };

export type WispBackup = {
  kind: typeof BACKUP_KIND;
  exportedAt: number;
  notes: Note[];
};

export type ParseBackupResult =
  | { ok: true; notes: Note[]; exportedAt: number }
  | { ok: false; error: string };

export function buildBackup(notes: Record<string, Note>): WispBackup {
  return {
    kind: BACKUP_KIND,
    exportedAt: Date.now(),
    notes: Object.values(notes)
      .filter((n) => !n.deletedAt)
      .map(({ history: _history, ...note }) => note),
  };
}

export function parseBackup(raw: unknown): ParseBackupResult {
  const parsed = backupSchema.safeParse(raw);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    const path = first?.path?.length ? first.path.join(".") : "file";
    return {
      ok: false,
      error: `Not a Wisp backup (${path}: ${first?.message ?? "invalid"})`,
    };
  }
  return {
    ok: true,
    exportedAt: parsed.data.exportedAt,
    notes: parsed.data.notes.map(noteFromParsed),
  };
}

export function noteToMarkdown(note: Note): string {
  const title = note.heading.trim() || "Untitled";
  const tags = note.tags.length
    ? `\n\n${note.tags.map((t) => `#${t}`).join(" ")}`
    : "";
  return `# ${title}\n\n${note.body.trim()}${tags}\n`;
}

function triggerDownload(filename: string, blob: Blob) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function downloadBackup(notes: Record<string, Note>) {
  const payload = buildBackup(notes);
  const stamp = new Date(payload.exportedAt).toISOString().slice(0, 10);
  triggerDownload(
    `wisp-backup-${stamp}.json`,
    new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" }),
  );
}

function slugify(heading: string): string {
  const slug = (heading.trim() || "note")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);
  return slug || "note";
}

export function downloadMarkdown(note: Note) {
  triggerDownload(
    `${slugify(note.heading)}.md`,
    new Blob([noteToMarkdown(note)], { type: "text/markdown" }),
  );
}

/** One .md file per note, named uniquely, oldest write wins the bare slug. */
export function buildMarkdownZipEntries(notes: Note[]) {
  const used = new Set<string>();
  return notes.map((note) => {
    const base = slugify(note.heading);
    let name = `${base}.md`;
    let n = 2;
    while (used.has(name)) {
      name = `${base}-${n}.md`;
      n += 1;
    }
    used.add(name);
    return { name, content: new TextEncoder().encode(noteToMarkdown(note)) };
  });
}

export function downloadMarkdownZip(notes: Record<string, Note>) {
  const live = Object.values(notes)
    .filter((n) => !n.deletedAt)
    .sort((a, b) => a.heading.localeCompare(b.heading));
  const zip = buildZip(buildMarkdownZipEntries(live));
  const stamp = new Date().toISOString().slice(0, 10);
  triggerDownload(
    `wisp-notes-${stamp}.zip`,
    new Blob([zip as BlobPart], { type: "application/zip" }),
  );
}
