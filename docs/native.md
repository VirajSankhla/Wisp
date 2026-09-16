# Native shells

The React UI is the product. Native wrappers add an OS icon — and on Android, an edge overlay over other apps.

## Android overlay (game-bar)

Only the **.apk** can sit on top of other apps. A PWA / iPhone install cannot.

1. Install `app-debug.apk` from [Releases](https://github.com/VirajSankhla/Wisp/releases) (rename to `Wisp.apk` if you want).
2. Open Wisp → Devices → **Enable edge tab**.
3. Allow **Display over other apps**.
4. Leave Wisp. A drop stays on the right edge of the whole phone.
5. Push it into the edge for a thin line. Tap to pull notes out. Hide from the notification if you want it gone.

Overlay faults are written to a **Wisp log** note instead of a blocking error card.

## `.exe` / `.apk`

GitHub Actions (`.github/workflows/release-native.yml`) builds them.
