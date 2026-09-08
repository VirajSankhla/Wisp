import { BACKUP_KIND, backupSchema, noteFromParsed } from "./schema.ts";
import type { Note } from "./types.ts";

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
    notes: Object.values(notes).filter((n) => !n.deletedAt),
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

export function downloadMarkdown(note: Note) {
  const slug = (note.heading.trim() || "note")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);
  triggerDownload(
    `${slug || "note"}.md`,
    new Blob([noteToMarkdown(note)], { type: "text/markdown" }),
  );
}
