# Self-hosting Wisp

Wisp is meant to be cloned and run by the person who uses it. There is no
required cloud and **no Google / X login**.

## Works today, fully free

- Local-only use in the browser / installed PWA.
- `npm install` then `npm run dev` or `npm run build` + `npx vite preview`.
- JSON backup (`wisp.backup.v1`).
- Device connection: a 50–100 character `WISP.` code or QR. No accounts.

## Operator knobs

None required. Do not set OAuth keys. Do not set `DATABASE_URL` unless you
are doing something of your own — stock Wisp does not need a database.

## Data you own

- Browser: `localStorage` keys `wisp.notes.v1`, `wisp.vault.v1`.
- Backup files: JSON you can keep on any disk (`D:\Wisp`, `~/Wisp`, a USB).
