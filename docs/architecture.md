# Wisp architecture

Wisp is personal-first. The person running it is the product. There is no
requirement for a centrally hosted Wisp service.

## Modes

```
                 Wisp
                  │
        ┌─────────┴─────────┐
        │                   │
     Device A            Device B
        │                   │
        └─────────┬─────────┘
                  │
              Pairing
                  │
          optional sync
                  │
        ┌─────────┴─────────┐
        │                   │
   direct/local         self-hosted
      sync                  sync
```

### Mode 1 — local only (works now)

The browser (or a future native shell) holds notes in device storage.
No account. No internet. No server.

PWA path: Zustand persist → `localStorage` key `wisp.notes.v1`.
Future Tauri path: the same `Note` model, written as files in a
user-chosen directory (the author likes `D:\Wisp`; that must never be
hard-coded).

### Mode 2 — paired devices (trust + signed snapshots)

QR / code pairing establishes a **device-to-device trust relationship**
(Ed25519 keys). The pairing secret expires in five minutes and is
single-use. It is not the permanent credential.

Both devices are peers. There is no master.

After they trust each other, notes move as a signed file:

```
Device A                         Device B
   │                                │
   │  wisp.peer-sync.v1             │
   │  (Ed25519 signed snapshot)     │
   └──────────────►─────────────────┘
              verify + LWW merge
```

The other machine **rejects** the file unless the signing key matches a
device it already paired. A failed or expired pairing never writes notes.

This is **not** live P2P and it does not need a Wisp-operated relay.
Until a local-network or self-hosted transport exists, the signed file
(or a regular backup, or optional sign-in) is how two screens share
memory.

Live WebRTC / LAN sync is **not implemented yet**.

### Mode 3 — self-hosted sync (planned)

A sync service the operator runs. Laptops and phones talk to *their*
server. No central Wisp cloud is required. See [self-hosting.md](self-hosting.md).

## What works now

| Layer | Implementation |
|---|---|
| UI | React 19 overlay panel (`src/components/wisp/`) |
| Notes | Zustand + localStorage (`src/lib/notes/`) |
| Search | Client-side heading/body/`#tag` (`search.ts`) |
| Optional cloud | Better Auth (Google/X) + `listNotes` / `upsertNote` |
| Pairing trust | `src/lib/pairing/` — offer QR, accept QR, trusted device list |
| Peer snapshots | `wisp.peer-sync.v1` signed with the device key, LWW merge |
| Backup | Strict `wisp.backup.v1` JSON |

## Last-write-wins timestamps

Local edits stamp `updatedAt` with the **device clock** so offline use
does not depend on a server.

On the sync server (`src/lib/notes/clock.ts`):

1. Clamp client times more than **5 minutes in the future** to `now + skew`.
2. Ignore writes whose clamped time is older than the stored row.

An absurd future timestamp cannot lock a note forever. A note written
on an airplane yesterday still wins against an older copy, because the
past is not clamped.

Tombstones (`deletedAt`) use the same ordering. They are kept forever
unless the operator sets `WISP_TOMBSTONE_RETENTION_MS` on **their**
server. Default: never purge. A device offline longer than that window
may resurrect a note — that is the operator’s tradeoff.

There are **no product quotas** (note count, storage, write rate).
Validation (max heading/body/tag *shape*) is not a quota.

## Native boundary (not a rewrite)

```
PWA                         Tauri (planned)
 ↓                           ↓
browser-local persistence    native filesystem
                             user-selected Wisp directory
```

The React UI stays. Tauri adds always-on-top, global hotkey, tray,
startup, and a configurable data directory. Capacitor adds an Android
app / widget / quick capture. iOS cannot do a system-wide edge overlay;
Add to Home Screen is the honest path.

See also: [self-hosting.md](self-hosting.md), [native.md](native.md).
