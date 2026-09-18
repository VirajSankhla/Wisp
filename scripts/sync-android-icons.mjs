#!/usr/bin/env node
import { cpSync, existsSync } from "node:fs";
import { join } from "node:path";

const ROOT = join(import.meta.dirname, "..");
const SRC = join(ROOT, "src-tauri/icons/icon.png");
const densities = ["mdpi", "hdpi", "xhdpi", "xxhdpi", "xxxhdpi"];

if (!existsSync(SRC)) {
  console.warn("Wisp icon missing at src-tauri/icons/icon.png");
  process.exit(0);
}

for (const density of densities) {
  const dir = join(ROOT, "android/app/src/main/res", `mipmap-${density}`);
  if (!existsSync(dir)) continue;
  for (const name of ["ic_launcher.png", "ic_launcher_round.png", "ic_launcher_foreground.png"]) {
    cpSync(SRC, join(dir, name));
  }
}

console.log("Copied Wisp EXE icon into Android launcher mipmaps");
