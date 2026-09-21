<p align="center">
  <img src="screenshots/wisp-icon.png" width="96" height="96" alt="Wisp" />
</p>

<h1 align="center">Wisp</h1>

<p align="center"><strong>A tiny personal memory at the edge of the screen.</strong></p>

<p align="center">Write a heading. Tuck it away. Pull it back when you need it.</p>

<p align="center">
  <a href="https://github.com/VirajSankhla/Wisp/releases/latest"><img src="https://img.shields.io/github/v/release/VirajSankhla/Wisp?include_prereleases&label=latest" alt="release" /></a>
  <a href="https://github.com/VirajSankhla/Wisp/releases"><img src="https://img.shields.io/github/downloads/VirajSankhla/Wisp/total?label=downloads" alt="downloads" /></a>
  <a href="https://github.com/VirajSankhla/Wisp/stargazers"><img src="https://img.shields.io/github/stars/VirajSankhla/Wisp?style=flat" alt="stars" /></a>
</p>

Wisp is **personal-first and local-first**. Offline. No account. No Wisp cloud. Fonts, icons, and the flame animation all live in the app — the only network trip is the optional API you add for sync.

```
N          new note
/          search headings and #tags
Esc        tuck it away
```

The list is headings only. Tags stay hidden until you search them. Pin from the list or the editor — pinned notes sit at the top.

<p align="center">
  <img src="screenshots/qa-tucked.png" width="280" alt="Tucked to the edge" />
  <img src="screenshots/qa-open.png" width="280" alt="Open panel" />
  <img src="screenshots/qa-qr.png" width="280" alt="Pairing QR" />
</p>

---

## Use it (no coding)

Open Wisp in a browser. Notes stay on that device. That is enough.

| Device | Install | Edge drop |
| --- | --- | --- |
| **Windows** | [`.exe` from Releases](https://github.com/VirajSankhla/Wisp/releases) | Devices → **Enable edge tab**. Always-on-top drop over other windows. A browser install cannot do this. |
| **Mac** | build from source (Tauri) | Same edge tab as Windows. |
| **Android** | [`.apk`](https://github.com/VirajSankhla/Wisp/releases) | Devices → **Enable edge tab** → allow *Display over other apps*. Hides while Wisp is open; appears when you leave. |
| **iPhone / iPad** | Safari → Share → **Add to Home Screen** | Not possible. Apple does not allow a third-party overlay. |

No sign-up. No Google. No X.

---

## native-16 → this build

| | native-16 | now |
| --- | --- | --- |
| Drop over Wisp | Hidden while the app is open | Stays on the right edge |
| Live notes | Needed to leave the app | Overlay and list merge as you type |
| Overlay **+** | New note vanished / panel glitched | Opens the heading field; panel resizes |
| Windows overlay | 44px window with the full list crammed in | Drop first, click to open; density no longer collapses an open panel |

---

## `.apk` and `.exe`

1. Open **[Releases](https://github.com/VirajSankhla/Wisp/releases)**.
2. **Android:** `app-debug.apk` (rename to `Wisp.apk` if you want). Allow *Install unknown apps*.
3. **Windows:** `Wisp_…_x64-setup.exe`.
4. If Releases looks empty, the build is still on **[Actions](https://github.com/VirajSankhla/Wisp/actions)**.

### Android / Windows edge drop

**Android:** Devices → **Enable edge tab** → allow *Display over other apps*. Leave Wisp. The droplet sits on the right of the *whole* phone.

The drop hides while Wisp is open (you already have the full list). Leave the app: the drop sits on the right. Notes in the overlay are the same notes as in the app.

Settings (gear): Compact / Regular / Large for the drop, and 3 / 4 / 5 visible headings.

---

## Same notes on phone and laptop

**You do not need an API.** One device is the default.

### Optional API (auto, any network)

Easiest free start: [jsonbin.io](https://jsonbin.io)

1. Create a bin, leave it as `{}`. Copy the id and **X-Master-Key**.
2. Devices → URL `https://api.jsonbin.io/v3/b/YOUR_BIN_ID` → header `X-Master-Key: YOUR_KEY` → **Save API**.
3. **Show a code**. Scan on the other device. After that they match on cellular too.

Payload is encrypted. Wisp does not host the bin.

| Host | URL | Header |
| --- | --- | --- |
| JSONBin | `https://api.jsonbin.io/v3/b/<id>` | `X-Master-Key: …` |
| jsonstorage.net | `https://jsonstorage.net/api/items/<id>` | optional |
| Your server | any GET+PUT JSON `https://…` | one `Name: value` line |

No API? **Send notes / Receive notes** moves an encrypted packet by hand.

---

## What the QR is

Not a login. Not a Wisp database.

| Code | Meaning |
| --- | --- |
| `WISP.…` | Short lock (~70–80 characters, 5 minutes). |
| `WISP2.…` | That lock **plus** your API URL. |

---

## Insights (this repo)

Snapshot from GitHub on 17 Sep 2026 (traffic is the last 14 days GitHub reports):

| | |
| --- | --- |
| Stars | 1 |
| Forks | 0 |
| Clones | 90 (35 unique machines) |
| Views | 8 (2 unique visitors) |
| Created | 8 Sep 2026 |

Numbers move. Badges at the top stay live.

---

## Host it yourself

No paid API, no OAuth, no database.

```sh
git clone https://github.com/VirajSankhla/Wisp.git
cd Wisp
npm install
npm run dev
```

`http://localhost:8080`

```sh
npm run build
npx vite preview --host 0.0.0.0 --port 8080
```

```sh
docker build -t wisp .
docker run -p 8080:8080 wisp
```

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
src/components/wisp/     panel, list, overlay, desktop drop, settings
src/lib/notes/           store, search, backup, fault log
src/lib/prefs.ts         density + overlay rows
src/lib/pairing/         lock, invite, optional API
plugins/wisp-overlay/    Android edge tab
src-tauri/icons/icon.png the droplet (EXE + APK launcher)
```

---

## Non-goals

Not Notion, Evernote, a social network, an AI chatbot, or an account SaaS. The simplicity is the product.

Fork it. Host it. Install it. Write it down. Let it disappear again.
