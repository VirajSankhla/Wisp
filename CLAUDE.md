# Wisp — development rules

Wisp is a personal-first, local-first, offline-first, heading-first,
edge-first notes app. There is no account. There is no Google or X login.

## Do

- Keep notes working with no internet and no server.
- Connect devices only with a 50–100 character `WISP.` code or the same
  code inside a QR. That code expires in five minutes and is not a password.
- Keep the edge panel, tucked handle, mobile swipe, heading-only list,
  hidden tags, shortcuts, and backup.
- Validate shapes (Zod). That is not a usage quota.

## Do not

- Add Google, X, email, or any other identity-provider login.
- Add subscriptions, billing, analytics, telemetry, or tracking.
- Add artificial note/storage/write quotas.
- Assume a central Wisp server must exist.
- Render note HTML (`dangerouslySetInnerHTML` on user content).
- Hard-code `D:\Wisp` as the data directory for everyone.
- Rewrite Wisp into Notion, Evernote, a task manager, or a social product.
