# Native shells

The React UI is the product. Native wrappers only add an OS icon.

## Use it without compiling (recommended)

Install from the browser. That produces a real app window on Windows, Mac,
ChromeOS, and Android, and a home-screen icon on iPhone. See the README.

## `.exe` / `.dmg` — Tauri (planned wrapper)

```sh
npm install -D @tauri-apps/cli
npx tauri init
npx tauri build
```

Ask for a **configurable data directory**. Never hard-code `D:\Wisp`.

## `.apk` — Capacitor (planned wrapper)

```sh
npm install @capacitor/core @capacitor/cli @capacitor/android
npx cap init Wisp com.wisp.notes --web-dir dist
npx cap add android
npx cap open android
```

## iOS

Add to Home Screen from Safari. A public `.ipa` is not a free sideload.
