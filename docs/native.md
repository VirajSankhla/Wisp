# Native shells

The React UI is the product. Native wrappers add an OS icon — and on Android, an edge overlay over other apps.

## Android overlay (game-bar)

Only the **.apk** can sit on top of other apps. A PWA / iPhone install cannot.

1. Install `Wisp.apk`.
2. Open Wisp → Devices → **Enable edge tab**.
3. Allow **Display over other apps**.
4. Leave Wisp. A tab stays on the right edge of the whole phone.
5. Tap it to pull notes out. Hide it from the notification if you want it gone.

## `.exe` / `.apk`

GitHub Actions (`.github/workflows/release-native.yml`) builds them.
