# Native shells (planned)

The React UI in `src/components/wisp/` is the product. Native wrappers
add OS capabilities. They must not become a second notes app.

## Desktop — Tauri

Target experience:

- always-on-top right-edge panel
- tucked edge handle
- global hotkey for instant capture
- system tray
- optional start-on-login
- native filesystem for notes
- **configurable data directory**

Suggested default on the author’s machine: `D:\Wisp`.

That path is **not** universal. First-run should ask, and honour:

```
C:\Wisp
E:\Wisp
D:\Apps\Wisp
/home/user/Wisp
```

PWA code must not pretend it has that filesystem. Browser storage stays
browser storage.

This repository does not yet contain a `src-tauri/` crate. When it
lands, keep one `Note` type shared with the web app.

## Android — Capacitor

Keep the current PWA install path.

Later:

```
React Wisp
    ↓
Capacitor
    ↓
Android
    ├── app
    ├── widget
    └── quick capture
```

A floating bubble / overlay is an Android-only maybe. **Do not promise
an iOS system-wide edge overlay** — it is not available to third-party
apps. iPhone: Add to Home Screen.

## Data compatibility

Same `Note` JSON as `wisp.backup.v1` and `wisp.peer-sync.v1`. A file written
on desktop should import on the PWA and the other way around.
