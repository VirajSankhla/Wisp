#!/usr/bin/env node
/**
 * Build a static folder Tauri / Capacitor can wrap.
 * Wisp is client-side (localStorage). Native shells just need the built UI.
 */
import { spawn } from "node:child_process";
import {
  cpSync,
  existsSync,
  mkdirSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { join } from "node:path";

const ROOT = join(import.meta.dirname, "..");
const STATIC = join(ROOT, ".vercel/output/static");
const OUT = join(ROOT, "native-dist");
const PORT = Number(process.env.NATIVE_PREVIEW_PORT || 8081);

function findAsset(prefix, ext) {
  if (!existsSync(join(STATIC, "assets"))) return null;
  return readdirSync(join(STATIC, "assets")).find(
    (f) => f.startsWith(prefix) && f.endsWith(ext),
  );
}

function shellHtml() {
  const css = findAsset("styles-", ".css");
  const js = findAsset("index-", ".js");
  if (!css || !js) {
    throw new Error("Production assets missing — run npm run build first");
  }
  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
    <title>Wisp</title>
    <meta name="theme-color" content="#12110F" />
    <link rel="icon" type="image/svg+xml" href="./favicon.svg" />
    <link rel="stylesheet" href="./assets/${css}" />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Figtree:wght@400;500;600&family=Fraunces:opsz,wght@9..144,500;9..144,600&display=swap" />
  </head>
  <body>
    <script type="module" src="./assets/${js}"></script>
  </body>
</html>
`;
}

async function waitFor(url, timeoutMs = 90000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url);
      if (res.ok) return true;
    } catch {
      /* not up yet */
    }
    await new Promise((r) => setTimeout(r, 300));
  }
  return false;
}

async function prerenderHtml() {
  if (process.platform === "win32" || process.env.NATIVE_FALLBACK_HTML === "1") {
    return shellHtml();
  }
  const child = spawn(
    process.execPath,
    [join(ROOT, "scripts/preview.mjs"), "restart"],
    { cwd: ROOT, stdio: "pipe" },
  );
  const exited = new Promise((resolve) => child.once("exit", resolve));
  try {
    const ok = await waitFor(`http://127.0.0.1:${PORT}/`);
    if (!ok) {
      console.warn("[native-dist] preview not ready, using shell HTML");
      return shellHtml();
    }
    const html = await (await fetch(`http://127.0.0.1:${PORT}/`)).text();
    return html.replaceAll('href="/', 'href="./').replaceAll('src="/', 'src="./');
  } catch (err) {
    console.warn("[native-dist] preview failed, using shell HTML", err);
    return shellHtml();
  } finally {
    child.kill("SIGTERM");
    await Promise.race([exited, new Promise((r) => setTimeout(r, 500))]);
  }
}

if (process.env.SKIP_PREPARE === "1" && existsSync(join(OUT, "index.html"))) {
  console.log("[native-dist] skip, already present");
  process.exit(0);
}

if (!existsSync(STATIC)) {
  console.error("[native-dist] run npm run build first");
  process.exit(1);
}

rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });
cpSync(STATIC, OUT, { recursive: true });

const html = await prerenderHtml();
writeFileSync(join(OUT, "index.html"), html);
console.log("[native-dist] wrote", OUT, "html bytes", html.length);
