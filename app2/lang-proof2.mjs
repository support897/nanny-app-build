import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join } from "node:path";
import { chromium } from "playwright-core";
const MIME = { ".html": "text/html", ".js": "text/javascript", ".mjs": "text/javascript", ".css": "text/css", ".png": "image/png", ".svg": "image/svg+xml", ".ttf": "font/ttf" };
const root = new URL("..", import.meta.url).pathname;
const server = createServer(async (req, res) => {
  try {
    let p = decodeURIComponent(new URL(req.url, "http://x").pathname);
    const data = await readFile(join(root, p));
    res.writeHead(200, { "Content-Type": MIME[extname(p)] || "application/octet-stream" });
    res.end(data);
  } catch { res.writeHead(404); res.end("no"); }
});
await new Promise((r) => server.listen(8942, r));
const browser = await chromium.launch({ executablePath: "/home/hatch/.cache/ms-playwright/chromium-1187/chrome-linux/chrome", args: ["--disable-dev-shm-usage", "--no-sandbox"] });
const page = await (await browser.newContext({ viewport: { width: 390, height: 844 }, locale: "es-ES" })).newPage();
await page.goto("http://localhost:8942/app2/journey.html", { waitUntil: "networkidle" });
await page.waitForTimeout(400);
console.log("WELCOME ES:", JSON.stringify((await page.evaluate(() => document.getElementById("welcome").innerText)).slice(0, 260)));
await page.click('[data-side="family"]');
await page.waitForTimeout(400);
console.log("PAGE1 ES:", JSON.stringify((await page.evaluate(() => document.getElementById("journey").innerText)).slice(0, 340)));
await page.screenshot({ path: "lang-journey-es.png" });
await browser.close(); server.close();
