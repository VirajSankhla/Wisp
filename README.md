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

Wisp does not run a cloud. You can still keep both devices in sync if **you** point them at an API you control (JSONBin, a gist, your own server). The payload is always encrypted.

1. On one device, **Devices** → paste an API URL that accepts **GET** and **PUT** of JSON. Optional header, e.g. `X-Master-Key: …`. Tap **Save API**.
2. Tap **Show a code**. The QR is a `WISP2.…` invite: lock + that URL.
3. On the other device, **Enter a code** → paste or scan. It stores the lock and the API.
4. After that, both sides pull/push the sealed blob over the internet — mobile data is fine. No same-Wi-Fi requirement.

You can also paste the same API URL on both devices and only share a short `WISP.…` lock.

No API? **Send notes / Receive notes** still moves an encrypted packet by hand.

---

## Classic `.exe` (Windows) and `.apk` (Android)

**Fastest: install from the browser** (table above). That needs no GitHub files at all.

**Want a real installer file from GitHub, no source on your laptop:**

1. Open **[Releases](https://github.com/VirajSankhla/Wisp/releases)**.
2. Download `Wisp_…_x64-setup.exe` for Windows, and `app-debug.apk` (rename to `Wisp.apk`) for Android.
**Android overlay:** install the `.apk`, then Wisp → Devices → Enable edge tab. Allow *Display over other apps*. A tab sits on the right of the whole phone, over other apps. The browser install cannot do this. iPhone cannot do this.

Those files are built by GitHub’s computers (Actions), not on your machine. You never clone the repo.

If the Releases page is empty, the latest build is still running: **[Actions](https://github.com/VirajSankhla/Wisp/actions)**. Signed-in you can also download the workflow artifacts there.

### There is no Wisp database behind the QR

The QR is **not a login to a Wisp server**. Wisp does not host your notes.

- Each device keeps notes in **its own storage**.
- A short `WISP.…` code is only the encryption lock (5 minutes to join).
- A `WISP2.…` invite is that lock plus **your** API URL.
- The API (if you add one) stores an **encrypted blob**. Wisp never sends headings in the clear.
- Offline, notes still live on the device. Packet send still works without an API.

No Wisp connection string. No Wisp account. Your API key, if any, stays on your devices.

### Build the installers yourself (optional)

GitHub Actions (`.github/workflows/release-native.yml`) is the supported way.

Locally, after `npm install` + `npm run build`:

```sh
npm run native:dist
npx tauri build --bundles nsis   # Windows .exe (needs a Windows machine or the Actions runner)
npx cap add android && npx cap copy android
# then Android Studio → Build APK
```


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
