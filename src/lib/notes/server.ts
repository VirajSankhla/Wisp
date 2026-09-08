import { createServerFn } from "@tanstack/react-start";
import { authMiddleware } from "@/lib/auth/middleware";
import { getSql } from "@/lib/db";
import { clampNoteTime, isStaleWrite } from "./clock.ts";
import { noteSchema } from "./schema.ts";
import { shouldPurgeTombstone, tombstoneRetentionMs } from "./tombstones.ts";
import type { Note } from "./types.ts";

type NoteRow = {
  id: string;
  heading: string;
  body: string;
  tags_json: string;
  pinned: boolean | number | string;
  updated_at_ms: number | string;
  deleted_at_ms: number | string | null;
};

function asNumber(value: number | string | null | undefined): number | null {
  if (value == null) return null;
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : null;
}

function rowToNote(row: NoteRow): Note {
  let tags: string[] = [];
  try {
    const parsed: unknown = JSON.parse(row.tags_json || "[]");
    if (Array.isArray(parsed)) {
      tags = parsed.filter((t): t is string => typeof t === "string");
    }
  } catch {
    tags = [];
  }
  return {
    id: row.id,
    heading: row.heading,
    body: row.body,
    tags,
    pinned: row.pinned === true || row.pinned === 1 || row.pinned === "t",
    updatedAt: asNumber(row.updated_at_ms) ?? 0,
    deletedAt: asNumber(row.deleted_at_ms),
  };
}

export const listNotes = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const sql = await getSql();
    const retention = tombstoneRetentionMs();
    if (retention != null) {
      const cutoff = Date.now() - retention;
      await sql`
        delete from notes
        where user_id = ${context.userId}
          and deleted_at_ms is not null
          and deleted_at_ms < ${cutoff}
      `;
    }
    const rows = await sql<NoteRow>`
      select id, heading, body, tags_json, pinned, updated_at_ms, deleted_at_ms
      from notes
      where user_id = ${context.userId}
    `;
    return rows.map(rowToNote);
  });

export const upsertNote = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown) => noteSchema.parse(input))
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    const now = Date.now();
    const updatedAt = clampNoteTime(data.updatedAt, now);
    let deletedAt = data.deletedAt;
    if (deletedAt != null) deletedAt = clampNoteTime(deletedAt, now);

    const existing = await sql<{ updated_at_ms: number | string }>`
      select updated_at_ms from notes
      where id = ${data.id} and user_id = ${context.userId}
    `;
    const stored = asNumber(existing[0]?.updated_at_ms);
    if (isStaleWrite(updatedAt, stored)) {
      return { ok: true as const, ignored: true as const };
    }

    if (shouldPurgeTombstone(deletedAt, now, tombstoneRetentionMs()) && stored != null) {
      await sql`
        delete from notes
        where id = ${data.id} and user_id = ${context.userId}
      `;
      return { ok: true as const, purged: true as const };
    }

    const tagsJson = JSON.stringify(data.tags);
    await sql`
      insert into notes (
        id, user_id, heading, body, tags_json, pinned, updated_at_ms, deleted_at_ms
      )
      values (
        ${data.id},
        ${context.userId},
        ${data.heading},
        ${data.body},
        ${tagsJson},
        ${data.pinned},
        ${updatedAt},
        ${deletedAt}
      )
      on conflict (id, user_id) do update set
        heading = excluded.heading,
        body = excluded.body,
        tags_json = excluded.tags_json,
        pinned = excluded.pinned,
        updated_at_ms = excluded.updated_at_ms,
        deleted_at_ms = excluded.deleted_at_ms
    `;
    return { ok: true as const };
  });
