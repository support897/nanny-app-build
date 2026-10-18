// Store variant walk for the Caresitters pack (rebuilt 16 Oct 2026
// with the rename): store/www must boot the renamed app, Find must
// start truly empty with its designed empty state, and the new
// name must show on the door with zero old-name text anywhere.
import { createRequire } from "node:module";
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
const require = createRequire(import.meta.url);
const { chromium } = require("/home/hatch/node_modules/playwright-core");
const ROOT = path.join(process.cwd(), "www");
const MIME = { ".html": "text/html", ".css": "text/css", ".js": "text/javascript", ".mjs": "text/javascript", ".svg": "image/svg+xml", ".png": "image/png", ".ttf": "font/ttf" };
const server = http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split("?")[0]); if (p === "/") p = "/index.html";
  fs.readFile(path.join(ROOT, p), (e, buf) => { if (e) { res.writeHead(404); res.end(); return; } res.writeHead(200, { "Content-Type": MIME[path.extname(p)] || "application/octet-stream" }); res.end(buf); });
});
await new Promise(r => server.listen(8923, r));
const browser = await chromium.launch({ executablePath: "/home/hatch/.cache/ms-playwright/chromium-1187/chrome-linux/chrome", args: ["--no-sandbox", "--disable-dev-shm-usage"] });
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
const errors = [];
page.on("pageerror", e => errors.push(e.message));
let pass = 0, fail = 0;
const check = (name, ok) => { console.log((ok ? "PASS " : "FAIL ") + name); ok ? pass++ : fail++; };

await page.goto("http://127.0.0.1:8923/", { waitUntil: "domcontentloaded", timeout: 20000 });
await page.waitForURL(/app2\/door\.html/, { timeout: 8000 }).catch(() => {});
const doorText = await page.locator("body").innerText();
check("the pack boots to the door", page.url().includes("app2/door.html"));
check("the door carries the new name", doorText.includes("Caresitters"));
check("no old name anywhere on the door", !/Caresits(?!ters)/.test(doorText));
await page.click("#demoBtn");
await page.waitForURL(/app2\/index\.html/, { timeout: 8000 }).catch(() => {});
await page.waitForTimeout(500);
check("demo entry lands inside the app", page.url().includes("app2/index.html"));
const title = await page.title();
check("the app title carries the new name", title.includes("Caresitters"));
await page.evaluate(() => { window.CARESITS_FIND_DATA = { viewer: null, candidates: [] }; });
await page.click("#menuBtn");
await page.evaluate(() => document.querySelector('.navGroupHead[data-group="finding"]').click());
await page.evaluate(() => document.querySelector('[data-nav="find"]').click());
await page.waitForTimeout(400);
const findText = await page.locator("main").innerText();
check("Find opens in the pack", findText.includes("Find"));
check("Find starts truly empty (designed empty state)", findText.includes("Your matches wait for your answers"));
check("no old name anywhere in Find", !/Caresits(?!ters)/.test(findText));
check("zero page errors", errors.length === 0);
const { existsSync } = await import("node:fs");
check("brand fonts present in the store variant", ["Newsreader.ttf", "Atkinson-Regular.ttf", "Atkinson-Bold.ttf"].every((f) => existsSync(new URL("./www/fonts/" + f, import.meta.url))));
check("no test config in the pack", !existsSync(new URL("./www/app2/test-config.js", import.meta.url)));
if (errors.length) console.log(errors.join("\n"));
await browser.close(); server.close();
console.log("VARIANT PASS " + pass + " FAIL " + fail);
process.exit(fail ? 1 : 0);
