import { n as createMiddleware } from "./ssr.mjs";
import { L as string, N as number, O as array, P as object, j as literal, k as boolean } from "../_libs/@better-auth/core+[...].mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/schema-C1plirbH.js
/**
* Auth middleware for server functions — the standard way to get the caller's
* verified user id. When deployed the session cookie is same-origin and rides
* along automatically. In the live preview the client also forwards the bearer
* token (partitioned cookies) via the `.client` hook below — call sites do not
* thread it themselves.
*
*   import { createServerFn } from "@tanstack/react-start";
*   import { getSql } from "@/lib/db";
*   import { authMiddleware } from "@/lib/auth/middleware";
*
*   export const listTodos = createServerFn({ method: "GET" })
*     .middleware([authMiddleware])
*     .handler(async ({ context }) => {
*       const sql = await getSql();
*       return sql`select * from todos where user_id = ${context.userId}`;
*     });
*
* Signed out with auth on (live preview included) -> throws `UnauthorizedError`
* (see `verify.server.ts`). With auth disabled (`VITE_AUTH_ENABLED=false`, the
* shipped default) it resolves the shared dev user — but throws instead when a
* `DATABASE_URL` is also set, so an app without sign-in must not use this at
* all. On the auth-on path, use it on every server function that touches
* per-user data and scope every query by `context.userId`.
*/
var authMiddleware = createMiddleware({ type: "function" }).client(async ({ next }) => {
	const { getBearerToken } = await import("./client-B40BzJxt.mjs").then((n) => n.n).then((n) => n.n);
	return next({ sendContext: { bearerToken: getBearerToken() ?? void 0 } });
}).server(async ({ next, context }) => {
	const { assertSameSiteRequest } = await import("./isolation.server-CGNg1r0B.mjs");
	const { requireUserId } = await import("./verify.server-l_xIpMes.mjs");
	assertSameSiteRequest();
	return next({ context: { userId: await requireUserId(context.bearerToken) } });
});
/**
* Timestamp policy for last-write-wins.
*
* Local edits stamp `updatedAt` with the device clock so offline work does not
* depend on a server. The server (and any future peer sync) then:
*   1. Clamps unreasonably *future* times to now + CLOCK_SKEW_MS
*   2. Rejects writes whose clamped time is older than the stored row
*
* A year-9999 timestamp therefore cannot lock a note forever. A note edited
* yesterday on an airplane still wins against an older cloud copy, because we
* only clamp the future — the past is legitimate offline history.
*
* 5 minutes of skew covers ordinary clock drift without letting a client mint
* a permanent "newest" value.
*/
var CLOCK_SKEW_MS = 3e5;
function clampNoteTime(clientTs, now = Date.now()) {
	if (!Number.isFinite(clientTs) || clientTs < 0) return now;
	const max = now + CLOCK_SKEW_MS;
	return clientTs > max ? max : Math.floor(clientTs);
}
function isStaleWrite(incoming, existing) {
	if (existing == null) return false;
	return incoming < existing;
}
var noteSchema = object({
	id: string().min(1).max(80),
	heading: string().max(240),
	body: string().max(2e4),
	tags: array(string().min(1).max(40)).max(24),
	pinned: boolean(),
	updatedAt: number().int().nonnegative(),
	deletedAt: number().int().nonnegative().nullable()
});
var BACKUP_KIND = "wisp.backup.v1";
var backupSchema = object({
	kind: literal(BACKUP_KIND),
	exportedAt: number().int().nonnegative(),
	notes: array(noteSchema)
});
function noteFromParsed(data) {
	return {
		id: data.id,
		heading: data.heading,
		body: data.body,
		tags: data.tags,
		pinned: data.pinned,
		updatedAt: data.updatedAt,
		deletedAt: data.deletedAt
	};
}
//#endregion
export { isStaleWrite as a, clampNoteTime as i, authMiddleware as n, noteFromParsed as o, backupSchema as r, noteSchema as s, BACKUP_KIND as t };
