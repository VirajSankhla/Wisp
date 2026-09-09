import { chromium } from "playwright";
import { readFileSync, writeFileSync } from "node:fs";

const svg = readFileSync("/workspace/.grok/favicon.svg.tmp", "utf8");
const sizes = [16, 32, 64, 180, 192, 512];

const browser = await chromium.launch({ args: ["--disable-web-security"] });
for (const size of sizes) {
  const page = await browser.newPage({
    viewport: { width: size, height: size },
    deviceScaleFactor: 1,
  });
  await page.setContent(
    `<!doctype html><html><head><style>
      html,body{margin:0;padding:0;width:${size}px;height:${size}px;background:#000;overflow:hidden}
      svg{display:block;width:${size}px;height:${size}px}
    </style></head><body>${svg}</body></html>`,
    { waitUntil: "load" },
  );
  const buf = await page.screenshot({ type: "png", omitBackground: false });
  writeFileSync(`/workspace/.grok/favicon-${size}.png`, buf);
  await page.close();
}
await browser.close();
console.log("wrote", sizes.map((s) => `favicon-${s}.png`).join(", "));
