# Wisp — development rules

Wisp is a personal-first, local-first, offline-first, heading-first,
edge-first notes app. It is self-host friendly and intentionally small.

The primary user is the person running their own Wisp.

## Do

- Prefer the smallest implementation that preserves the current product.
- Keep the edge panel, tucked handle, mobile swipe, heading-only list,
  hidden tags, shortcuts, backup, and optional existing auth/sync.
- Keep notes working with no account, no internet, and no server.
- Treat pairing as “connect my devices”, not “create an account”.
- After pairing, notes move as a signed `wisp.peer-sync.v1` snapshot
  unless a later live transport exists. Do not add a Wisp-operated relay
  to make pairing “feel like SaaS sync”.
- A failed verify/import must leave local notes untouched.
- Scope any per-user SQL to the verified session `user_id`.
- Validate shapes (Zod). That is not a usage quota.

## Do not

- Rewrite Wisp, rename it, or introduce a second notes system.
- Turn it into Notion, Evernote, a task manager, an AI assistant, or a
  collaboration / social product.
- Add subscriptions, billing, analytics, telemetry, or tracking.
- Add artificial note/storage/write quotas or SaaS tiers.
- Assume a central Wisp server must exist.
- Add AI unless the owner explicitly asks.
- Render note HTML (`dangerouslySetInnerHTML` on user content).
- Hard-code `D:\Wisp` as the data directory for everyone.
- Delete or rewrite `src/lib/auth/server.ts`. Auth is optional and stays.

## Product checks before you ship a change

- Unsigned users can still create, edit, search, tuck, and backup.
- The list is still heading-only; tags still hide until search.
- A failed sync never wipes local notes.
- Pairing secrets expire and are not reused as device passwords.
- Peer snapshots from unpaired devices are rejected.
