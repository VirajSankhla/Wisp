import { i as TSS_SERVER_FUNCTION, r as createServerFn } from "./ssr.mjs";
import { r as getSql } from "./db-Ryn8ErAx.mjs";
import { a as isStaleWrite, i as clampNoteTime, n as authMiddleware, s as noteSchema } from "./schema-C1plirbH.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/server-WVx0ngHi.js
var createServerRpc = (serverFnMeta, splitImportFn) => {
	const url = "/_serverFn/" + serverFnMeta.id;
	return Object.assign(splitImportFn, {
		url,
		serverFnMeta,
		[TSS_SERVER_FUNCTION]: true
	});
};
/**
* Tombstones stay until a self-host operator opts in.
*
* They are required so a device that was offline during a delete still learns
* the note is gone, instead of uploading a resurrection.
*
* Set WISP_TOMBSTONE_RETENTION_MS (milliseconds) on the *sync server* to purge
* tombstones older than that window. Unset or 0 = keep forever (the default).
* A device offline longer than the retention window may resurrect a note.
*/
function tombstoneRetentionMs(env = process.env) {
	const raw = env.WISP_TOMBSTONE_RETENTION_MS?.trim();
	if (!raw) return null;
	const n = Number(raw);
	if (!Number.isFinite(n) || n <= 0) return null;
	return n;
}
function shouldPurgeTombstone(deletedAtMs, now, retentionMs) {
	if (retentionMs == null || deletedAtMs == null) return false;
	return now - deletedAtMs > retentionMs;
}
function asNumber(value) {
	if (value == null) return null;
	const n = typeof value === "number" ? value : Number(value);
	return Number.isFinite(n) ? n : null;
}
function rowToNote(row) {
	let tags = [];
	try {
		const parsed = JSON.parse(row.tags_json || "[]");
		if (Array.isArray(parsed)) tags = parsed.filter((t) => typeof t === "string");
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
		deletedAt: asNumber(row.deleted_at_ms)
	};
}
var listNotes_createServerFn_handler = createServerRpc({
	id: "1dcf70a1722ebc3930865cdaa4175ef71d73f64ad9f432c9ec9ff7ef684fe2b7",
	name: "listNotes",
	filename: "src/lib/notes/server.ts"
}, (opts) => listNotes.__executeServer(opts));
var listNotes = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(listNotes_createServerFn_handler, async ({ context }) => {
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
	return (await sql`
      select id, heading, body, tags_json, pinned, updated_at_ms, deleted_at_ms
      from notes
      where user_id = ${context.userId}
    `).map(rowToNote);
});
var upsertNote_createServerFn_handler = createServerRpc({
	id: "e78c2f532e390e54d95e521d0d8844a3a23ea4b9937fc7f812104c6218f7a030",
	name: "upsertNote",
	filename: "src/lib/notes/server.ts"
}, (opts) => upsertNote.__executeServer(opts));
var upsertNote = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => noteSchema.parse(input)).handler(upsertNote_createServerFn_handler, async ({ context, data }) => {
	const sql = await getSql();
	const now = Date.now();
	const updatedAt = clampNoteTime(data.updatedAt, now);
	let deletedAt = data.deletedAt;
	if (deletedAt != null) deletedAt = clampNoteTime(deletedAt, now);
	const stored = asNumber((await sql`
      select updated_at_ms from notes
      where id = ${data.id} and user_id = ${context.userId}
    `)[0]?.updated_at_ms);
	if (isStaleWrite(updatedAt, stored)) return {
		ok: true,
		ignored: true
	};
	if (shouldPurgeTombstone(deletedAt, now, tombstoneRetentionMs()) && stored != null) {
		await sql`
        delete from notes
        where id = ${data.id} and user_id = ${context.userId}
      `;
		return {
			ok: true,
			purged: true
		};
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
	return { ok: true };
});
//#endregion
export { listNotes_createServerFn_handler, upsertNote_createServerFn_handler };
