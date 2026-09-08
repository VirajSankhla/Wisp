# Self-hosting Wisp

Wisp is meant to be cloned, forked, and run by the person who uses it.
The author runs their own setup. You can too.

## Honest status

**Works today**

- Local-only use in the browser / PWA (no account, no server).
- Optional sign-in (Google / X via Better Auth) so a Postgres database
  can hold a per-user copy. Useful if you already deploy this stack.
- JSON backup and import (`kind: "wisp.backup.v1"`).
- Device pairing **trust** (QR + code) plus **signed note snapshots**
  (`wisp.peer-sync.v1`). Not live P2P; no Wisp relay.

**Planned — not finished**

- Direct live device-to-device note sync after pairing (LAN / WebRTC).
- A small self-hosted sync daemon that is not the current Grok/Vercel
  app-builder deploy.
- Encryption at rest for backups and native data directories.

Do not wait for a hosted Wisp cloud. There isn’t one you are required
to use.

## Run locally (this repository)

Prerequisites: Node.js 22+ and npm.

```sh
npm install
npm run dev          # http://localhost:8080
npm run typecheck
npm test
npm run lint
npm run build
```

With no `DATABASE_URL`, the optional sync API uses embedded PGLite
(wiped when the process exits). Notes in the browser survive reloads
via `localStorage` regardless.

To persist optional cloud rows, point `DATABASE_URL` at your Postgres
and run `npm run db:migrate`. Schema lives in `migrations/`.

### Operator knobs (server env)

| Variable | Default | Meaning |
|---|---|---|
| `DATABASE_URL` | unset → PGLite | Postgres for Better Auth + `notes` |
| `WISP_TOMBSTONE_RETENTION_MS` | unset (keep forever) | Purge delete-markers older than this |

Do not set a retention window unless you accept that a device offline
longer than it may resurrect a deleted note.

There is no note-count or storage quota in the product. Size the
machine instead.

## Data you actually own

- Browser: `localStorage` keys `wisp.notes.v1`, `wisp.device.v1`,
  `wisp.trusted.v1`, `wisp.pairing.offer.v1`.
- Backup files: JSON you can keep on any disk.
- Native (planned): a directory you choose. The author’s personal
  default is `D:\Wisp`. Yours can be `~/Wisp`, `E:\Notes`, anything.

## Pairing vs accounts

Pairing is how personal devices should meet. Accounts remain an
optional existing path and are not deleted. You can ignore sign-in
entirely and still use Wisp.
