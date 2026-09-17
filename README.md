# Wisp

**A tiny personal memory at the edge of the screen.**

Write a heading. Tuck it away. Pull it back when you need it.

Wisp is **personal-first and local-first**. It works fully offline, with no account and no Wisp cloud. You can fork it, host it, or just use the installers.

```
N          new note
/          search headings and #tags
Esc        tuck it away
```

The list is headings only. Tags stay hidden until you search them. Pin from the list or the editor — pinned notes sit at the top.

---

## Use it (no coding)

Open Wisp in a browser. Notes stay on that device. That is enough.

| Device | Install | Overlay over other apps |
| --- | --- | --- |
| **Windows / Mac / Chromebook** | Chrome or Edge → install icon in the address bar, or **Install Wisp** | Desktop handle on the right. Browser / PWA is enough. |
| **Android** | Chrome → **Install app**, **or** the `.apk` below | **Only the `.apk`** can sit over the home screen and other apps (game-bar). |
| **iPhone / iPad** | **Safari** → Share → **Add to Home Screen** | Not possible. Apple does not allow a third-party overlay over other apps. |

No sign-up. No Google. No X.

---

## `.apk` and `.exe` from GitHub

You do not need the source. GitHub Actions builds the files.

1. Open **[Releases](https://github.com/VirajSankhla/Wisp/releases)**.
2. **Android:** download `app-debug.apk` (you can rename it `Wisp.apk`). Enable *Install unknown apps*, then open it.
3. **Windows:** download `Wisp_…_x64-setup.exe` and run it.
4. If Releases looks empty, the build is still running under **[Actions](https://github.com/VirajSankhla/Wisp/actions)**.

### Android edge tab (game-bar)

This is the whole-phone overlay. Browser install cannot do it.

1. Install the `.apk`.
2. Open Wisp → **Devices** → **Enable edge tab**.
3. Allow **Display over other apps**.
4. Leave Wisp. A small drop sits on the right of the *whole* phone.
5. Push it into the edge until it is a thin line. Tap the drop for notes — **about four headings** show, then scroll. Tap a heading to edit. Trash deletes a mistaken note. Tap outside or **×** to hide.
6. A quiet notification keeps it alive. Hide from there if you want it gone.

The overlay WebView stays loaded, so the second tap should be instant. Opening a note no longer resizes the window (content scrolls inside).

**Settings** (gear in the app, not in the overlay): Compact / Regular / Large for the drop and bubbles, and 3 / 4 / 5 visible headings. Restart the edge tab if the drop size does not update.

If something in the overlay fails, Wisp writes a **Wisp log** note (tag `wisp-log`) instead of blocking the screen.

---

## Same notes on phone and laptop

**You do not need an API for Wisp to work.** One device is the default.

There is no Wisp server behind the QR. Three ways to share:

### 1. Optional API you control (auto, any network)

Use this if you want both sides to keep matching over mobile data.

The API only stores an **encrypted blob**. Headings never go out in the clear.

**Which API?** Anything that accepts **GET** and **PUT** of JSON. Wisp does not host one. Easiest free option:

#### JSONBin (recommended to start)

1. Open [jsonbin.io](https://jsonbin.io) and create a free account.
2. **Create a bin**. Put `{}` in it and save. Copy the bin id.
3. Open **API Keys** and copy the **X-Master-Key**.
4. In Wisp → **Devices**:
   - URL: `https://api.jsonbin.io/v3/b/YOUR_BIN_ID`
   - Header: `X-Master-Key: YOUR_KEY`
   - **Save API**
5. **Show a code** on this device. Scan or paste on the other. After that they keep matching on cellular too.

The free JSONBin tier is enough for a personal vault. Do not put the master key in a public README of *your* fork if that bin is private.

#### Other hosts that work

| Host | URL shape | Header |
| --- | --- | --- |
| [JSONBin](https://jsonbin.io) | `https://api.jsonbin.io/v3/b/<id>` | `X-Master-Key: …` |
| [jsonstorage.net](https://jsonstorage.net) | `https://jsonstorage.net/api/items/<id>` | (none, or their token) |
| Your own server / Cloudflare Worker | any `https://…` that GET/PUT JSON | whatever you require, one `Name: value` line |

GitHub gists need PATCH, not PUT, so skip those unless you wrap them.

Then **Show a code**. The QR is a `WISP2.…` invite (lock + URL). Or paste the same URL on both devices and only share a short `WISP.…` lock.

### 2. Encrypted packet (no API)

**Devices** → **Send notes** on the device that has the latest copy → **Receive notes** on the other. WhatsApp, AirDrop, USB, a file — anything that moves the packet.

### 3. Stay on one device

Do nothing. Notes live in that app’s storage. Backup JSON if you want a file on disk.

---

## What the QR actually is

Not a login. Not a Wisp database.

| Code | Meaning |
| --- | --- |
| `WISP.…` | Short lock (about 70–80 characters, 5 minutes). Both devices derive the same local encryption key. |
| `WISP2.…` | That lock **plus** your API URL (and optional header). Longer; meant for the QR. |

After pairing, the code is forgotten. The vault key stays on the device.

---

## Host it yourself

No paid API, no OAuth, no database required.

```sh
git clone https://github.com/VirajSankhla/Wisp.git
cd Wisp
npm install
npm run dev
```

Open `http://localhost:8080`.

Production-style:

```sh
npm run build
npx vite preview --host 0.0.0.0 --port 8080
```

Deploy the build to any free static/Node host (Cloudflare Pages, Netlify, a home Pi). Do **not** set Google/X keys.

Keep backups wherever you want (`D:\Wisp`, a USB stick). The live copy is on the device; the backup file is yours.

### Docker

```sh
docker build -t wisp .
docker run -p 8080:8080 wisp
```

---

## Keyboard

```
N            new note
/  or ⌘K     search
#tag         filter by tag
?            guide
Esc          tuck / back
```

On a phone, swipe in from the right to open the panel (inside the app). The system-wide edge tab is Android `.apk` only.

---

## Privacy

- Notes live on the device first (`localStorage`: `wisp.notes.v1`, `wisp.vault.v1`).
- A backup or packet moves because **you** saved or opened a file.
- An optional API you add stores ciphertext only.
- No analytics. No identity provider. No Wisp account.

If Wisp hits a native fault, it appends to a **Wisp log** note on that device so you can see what happened.

---

## Develop

```sh
npm install
npm run dev          # http://localhost:8080
npm run typecheck
npm test
npm run lint
npm run build
```

Installers: `.github/workflows/release-native.yml` (Actions → **Build Wisp installers**).

```
src/components/wisp/     panel, list, editor, overlay, devices, settings
src/lib/notes/           model, store, search, backup, fault log
src/lib/prefs.ts         overlay density and visible-row count
src/lib/pairing/         lock, invite, encrypted snapshot, optional API
plugins/wisp-overlay/    Android edge tab
```

---

## Non-goals

Not Notion, Evernote, a social network, an AI chatbot, or an account SaaS. The simplicity is the product.

Fork it. Host it. Install it. Write it down. Let it disappear again.
