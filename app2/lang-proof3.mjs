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
await new Promise((r) => server.listen(8943, r));
const browser = await chromium.launch({ executablePath: "/home/hatch/.cache/ms-playwright/chromium-1187/chrome-linux/chrome", args: ["--disable-dev-shm-usage", "--no-sandbox"] });
const page = await (await browser.newContext({ viewport: { width: 390, height: 844 }, locale: "es-ES" })).newPage();
// Walk the family journey straight to the first expansion page (page 6).
await page.goto("http://localhost:8943/app2/journey.html", { waitUntil: "networkidle" });
await page.evaluate(() => {
  const draft = { side: "family", page: 5, answers: {}, strengths: {} };
  localStorage.setItem("caresits-app2-draft", JSON.stringify(draft));
});
await page.reload({ waitUntil: "networkidle" });
await page.waitForTimeout(500);
const txt = await page.evaluate(() => document.getElementById("journey")?.innerText || "");
console.log("EXPANSION PAGE ES:", JSON.stringify(txt.slice(0, 420)));
await page.screenshot({ path: "lang-expansion-es.png" });
await browser.close(); server.close();
