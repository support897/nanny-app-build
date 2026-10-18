import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join } from "node:path";
import { chromium } from "playwright-core";
const MIME = { ".html": "text/html", ".js": "text/javascript", ".mjs": "text/javascript", ".css": "text/css", ".png": "image/png", ".svg": "image/svg+xml", ".ttf": "font/ttf" };
const root = new URL("..", import.meta.url).pathname;
const server = createServer(async (req, res) => {
  try {
    let p = decodeURIComponent(new URL(req.url, "http://x").pathname);
    if (p === "/") p = "/app2/door.html";
    const file = join(root, p);
    const data = await readFile(file);
    res.writeHead(200, { "Content-Type": MIME[extname(file)] || "application/octet-stream" });
    res.end(data);
  } catch { res.writeHead(404); res.end("no"); }
});
await new Promise((r) => server.listen(8941, r));
const browser = await chromium.launch({ executablePath: "/home/hatch/.cache/ms-playwright/chromium-1187/chrome-linux/chrome", args: ["--disable-dev-shm-usage", "--no-sandbox"] });
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, locale: "vi-VN" });
const page = await ctx.newPage();
await page.goto("http://localhost:8941/app2/door.html", { waitUntil: "networkidle" });
await page.waitForTimeout(400);
const doorText = await page.evaluate(() => document.body.innerText);
console.log("DOOR VI:", JSON.stringify(doorText.slice(0, 190)));
await page.screenshot({ path: "lang-door-vi.png" });
await page.evaluate(() => sessionStorage.setItem("caresits-tour", "1"));
await page.click("#demoBtn");
await page.waitForTimeout(900);
const tourText = await page.evaluate(() => document.getElementById("tourPop")?.innerText || document.body.innerText.slice(0, 200));
console.log("TOUR VI:", JSON.stringify(String(tourText).slice(0, 220)));
await page.screenshot({ path: "lang-tour-vi.png" });
const navText = await page.evaluate(() => { document.querySelector("#menuBtn")?.click(); return document.getElementById("menu")?.innerText.slice(0, 200); });
await page.waitForTimeout(300);
console.log("NAV VI:", JSON.stringify(navText));
await page.screenshot({ path: "lang-nav-vi.png" });
await browser.close(); server.close();
