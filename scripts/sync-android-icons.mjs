#!/usr/bin/env node
import { cpSync, existsSync } from "node:fs";
import { join } from "node:path";

const ROOT = join(import.meta.dirname, "..");
const SRC_ANDROID = join(ROOT, "src-tauri/icons/android");
const DEST_RES = join(ROOT, "android/app/src/main/res");
const densities = ["mdpi", "hdpi", "xhdpi", "xxhdpi", "xxxhdpi"];

if (!existsSync(SRC_ANDROID)) {
  console.warn("Wisp Android icon set missing at src-tauri/icons/android");
  process.exit(0);
}

// `tauri icon` already renders a correctly-sized, padded icon per density
// (plus an adaptive-icon foreground with the safe-zone inset baked in).
// Copying those in place of Capacitor's placeholder icons, rather than
// stretching one flat 512x512 PNG over every slot, keeps the launcher icon
// crisp and keeps the adaptive icon from looking zoomed/cropped.
for (const density of densities) {
  const srcDir = join(SRC_ANDROID, `mipmap-${density}`);
  const destDir = join(DEST_RES, `mipmap-${density}`);
  if (!existsSync(srcDir) || !existsSync(destDir)) continue;
  for (const name of ["ic_launcher.png", "ic_launcher_round.png", "ic_launcher_foreground.png"]) {
    const src = join(srcDir, name);
    if (existsSync(src)) cpSync(src, join(destDir, name));
  }
}

for (const name of ["ic_launcher.xml", "ic_launcher_round.xml"]) {
  const src = join(SRC_ANDROID, "mipmap-anydpi-v26/ic_launcher.xml");
  const dest = join(DEST_RES, "mipmap-anydpi-v26", name);
  if (existsSync(src) && existsSync(dest)) cpSync(src, dest);
}

const backgroundSrc = join(SRC_ANDROID, "values/ic_launcher_background.xml");
const backgroundDest = join(DEST_RES, "values/ic_launcher_background.xml");
if (existsSync(backgroundSrc) && existsSync(backgroundDest)) {
  cpSync(backgroundSrc, backgroundDest);
}

console.log("Copied Wisp's density-correct Android launcher icons");
