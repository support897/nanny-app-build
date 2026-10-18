import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join } from "node:path";
import { chromium } from "playwright-core";
const MIME = { ".html": "text/html", ".js": "text/javascript", ".mjs": "text/javascript", ".css": "text/css", ".png": "image/png", ".svg": "image/svg+xml", ".ttf": "font/ttf" };
const root = new URL("..", import.meta.url).pathname;
const server = createServer(async (req, res) => {
  try { const p = decodeURIComponent(new URL(req.url, "http://x").pathname); const data = await readFile(join(root, p)); res.writeHead(200, { "Content-Type": MIME[extname(p)] || "application/octet-stream" }); res.end(data); }
  catch { res.writeHead(404); res.end("no"); }
});
await new Promise((r) => server.listen(8944, r));
const browser = await chromium.launch({ executablePath: "/home/hatch/.cache/ms-playwright/chromium-1187/chrome-linux/chrome", args: ["--disable-dev-shm-usage", "--no-sandbox"] });
const page = await (await browser.newContext({ viewport: { width: 390, height: 844 }, locale: "es-ES" })).newPage();
await page.goto("http://localhost:8944/app2/index.html", { waitUntil: "networkidle" });
console.log("HOME ES:", JSON.stringify((await page.evaluate(() => document.getElementById("surface-home").innerText)).slice(0, 200)));
await page.click("#menuBtn");
await page.waitForTimeout(300);
await page.evaluate(() => { document.querySelector('[data-group="finding"]')?.click(); });
await page.waitForTimeout(200);
await page.click('[data-nav="find"]');
await page.waitForTimeout(600);
const txt = await page.evaluate(() => document.querySelector("#surface-find, #view-find, main")?.innerText || document.body.innerText);
console.log("FIND ES:", JSON.stringify(txt.slice(0, 330)));
await page.screenshot({ path: "lang-home-find-es.png" });
await browser.close(); server.close();
