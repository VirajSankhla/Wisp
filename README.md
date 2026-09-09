# Wisp

**Notes that stay at the edge.**

Wisp is a tiny, heading-first notes app. Write a heading. Tuck it away. Get back to whatever you were doing.

There is **no account**. There is **no Google or X login**. Connecting another phone or laptop is a **one-time code** (about 70–80 characters) or a **QR** of that same code.

It is free to run. You can use it in the browser, install it as an app from the browser, or host it yourself.

---

## If you only want to *use* Wisp (no coding)

You do not need Git, Node, or an .exe to start.

1. Open Wisp in a browser (the live site you were given, or a copy someone hosted).
2. **Install it so it behaves like software:**

| Device | What to do | What you get |
| --- | --- | --- |
| **Windows / Mac / Chromebook** | Chrome or Edge → install icon in the address bar, **or** menu → **Install Wisp** / **Cast, save, and share → Install page as app** | A standalone window. This *is* the Windows/Mac app. Offline, in the taskbar / Dock. |
| **Android** | Chrome → menu → **Install app** or **Add to Home screen** | An icon on the home screen. Full-screen, offline. |
| **iPhone / iPad** | **Safari** (not Chrome) → Share → **Add to Home Screen** | An icon on the home screen. Offline. iOS does not allow a third-party swipe-from-the-edge overlay, and you cannot sideload a random `.ipa` without Apple’s store. |

3. Use it. Notes stay on that device. No sign-up.

### Put the same notes on your phone and laptop

1. On the first device, tap the phone icon (**Devices**).
2. Tap **Show a code**. A QR and a `WISP.…` code appear. Copy the code (it is 50–100 characters, one-time, 5 minutes).
3. On the second device, open the same Wisp → **Devices** → **Enter a code** → paste. Or scan the QR with the phone camera into a note, then paste (or scan if the browser can).
4. Then **Save notes for the other device** on one screen and **Receive notes** on the other.

That is the only “login.” There is no Google, no X, no email.

---

## Classic `.exe` (Windows) and `.apk` (Android)

**Today, the install-from-browser path above is the supported way to get Wisp as an app.** It is free, has no store, and needs no compiler.

A real installer file (`.exe`, `.dmg`, `.apk`) is the **same Wisp UI** wrapped with:

- **Desktop** — [Tauri](https://v2.tauri.app/) → `.exe` (Windows), `.dmg` (Mac), `.AppImage` (Linux)
- **Android** — [Capacitor](https://capacitorjs.com/) → `.apk`

Those wrappers are not a second notes app. If you (or a friend who can run Node) build them once, you can put the files on GitHub Releases or a USB stick and everyone else just downloads.

### Build a Windows `.exe`

On a Windows PC with Node 22+ and [Rust](https://rustup.rs/):

```sh
npm install
npm install -D @tauri-apps/cli
npx tauri init          # app name: Wisp, URL: the built web app
npx tauri build
```

The installer lands in `src-tauri/target/release/bundle/nsis/` (`.exe`).

Mac: `npx tauri build` → `.dmg`. Linux: `.AppImage` / `.deb`.

### Build an Android `.apk`

On a machine with Node 22+ and [Android Studio](https://developer.android.com/studio) (free):

```sh
npm install
npm install @capacitor/core @capacitor/cli @capacitor/android
npx cap init Wisp com.wisp.notes --web-dir dist
npm run build
npx cap add android
npx cap copy
npx cap open android
```

In Android Studio: **Build → Build Bundle(s) / APK(s) → Build APK(s)**. Share that `.apk`. Android will warn that it is from outside the Play Store — that is normal for a personal app.

### iPhone

You **cannot** honestly ship a random `.ipa` the way you ship an `.apk`. Apple requires a paid developer account and TestFlight / App Store for other people’s phones.

For iPhone, use **Safari → Add to Home Screen**. That is the free, supported install.

---

## Host it yourself (fully free)

No paid API, no Google client id, no X app, no database, no account server.

### Fastest: run it on your machine

Needs [Node.js 22+](https://nodejs.org/) (free).

```sh
git clone <this-repo>
cd <this-repo>
npm install
npm run dev
```

Open `http://localhost:8080`. That is Wisp. Put it behind any free tunnel or just use it on the LAN.

Production-style:

```sh
npm run build
npx vite preview --host 0.0.0.0 --port 8080
```

### Free public host

Because this is a normal Node/Vite app, you can deploy the build to any free static/Node host you already like (Cloudflare Pages, Netlify, Vercel, GitHub Pages with a Node build, a $0 home Raspberry Pi). You do **not** need to turn on their auth products. Do not set Google/X keys — Wisp will not use them.

### Docker (optional)

```dockerfile
FROM node:22-alpine
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build
EXPOSE 8080
CMD ["npx", "vite", "preview", "--host", "0.0.0.0", "--port", "8080"]
```

```sh
docker build -t wisp .
docker run -p 8080:8080 wisp
```

Put notes on another disk by keeping backups in a folder you choose (`D:\Wisp`, `~/Wisp`, a USB stick). The browser still holds the live copy; the backup file is yours.

---

## What Wisp is

- Right-edge glass panel, tucked handle, live note count
- Swipe in from the right on a phone
- Heading-only list (tags hidden until you search `#tag`)
- Instant capture (`N`), search (`/` or `Ctrl+K`), tuck (`Esc`)
- Offline on the device
- JSON backup (`wisp.backup.v1`)
- Device connection by **code or QR only**

```
N        →   New note
/        →   Search
#ideas   →   Find ideas
Esc      →   Disappear
```

---

## Privacy, honestly

Notes live on the device first. A backup or a connected-device snapshot moves because **you** saved or opened a file. There is no analytics and no identity provider.

The connection code is short-lived. After both devices use it, they share an encrypted vault key stored locally. The code itself is not a password you keep.

---

## Develop

```sh
npm install
npm run dev
npm run typecheck
npm test
npm run lint
npm run build
```

```
src/components/wisp/     panel, list, editor, guide, devices
src/lib/notes/           Note model, store, search, backup
src/lib/pairing/         connection code, QR, encrypted snapshots
```

---

## Non-goals

Not Notion, Evernote, a social network, an AI chatbot, or an account SaaS. The simplicity is the product.

Fork it. Host it. Install it. Write it down. Let it disappear again.
