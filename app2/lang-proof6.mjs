// Desk proof for the account page act: Spanish chrome, the legal
// paragraphs standing in English (the fence), on the real page.
import { chromium } from "playwright-core";
import http from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join } from "node:path";
const ROOT = join(import.meta.dirname, "..");
const MIME = { ".html": "text/html", ".js": "text/javascript", ".mjs": "text/javascript", ".css": "text/css", ".png": "image/png", ".ttf": "font/ttf", ".svg": "image/svg+xml" };
const srv = http.createServer(async (req, res) => {
  try {
    let p = decodeURIComponent(req.url.split("?")[0]); if (p === "/") p = "/accounts/account.html";
    const body = await readFile(join(ROOT, p));
    res.writeHead(200, { "content-type": MIME[extname(p)] || "application/octet-stream" }); res.end(body);
  } catch { res.writeHead(404); res.end("nf"); }
});
await new Promise((r) => srv.listen(8946, r));
const browser = await chromium.launch({ executablePath: "/home/hatch/.cache/ms-playwright/chromium-1187/chrome-linux/chrome", args: ["--disable-dev-shm-usage", "--no-sandbox"] });
const ctx = await browser.newContext({ locale: "es-ES", viewport: { width: 390, height: 844 } });
const page = await ctx.newPage();
await page.goto("http://localhost:8946/accounts/account.html", { waitUntil: "domcontentloaded" });
await page.waitForTimeout(700);
const h1 = await page.textContent("h1");
const signIn = await page.textContent("#doorsCard h2");
const google = await page.textContent("#doorGoogle");
const taste = await page.textContent('[data-i18n="legal.taste"]');
const del1 = await page.textContent('[data-i18n="legal.delete1"]');
const delBtn = await page.textContent("#deleteBtn");
console.log("H1:", h1);
console.log("SIGNIN:", signIn, "| GOOGLE BTN:", google);
console.log("TASTE (must stay English):", (taste || "").slice(0, 60) + "...");
console.log("DELETE (must stay English):", (del1 || "").slice(0, 60) + "...");
console.log("DELETE BTN:", delBtn);
await page.screenshot({ path: new URL("./lang-account-es.png", import.meta.url).pathname });
await browser.close(); srv.close();
const ok = /Tu cuenta de Caresitters/.test(h1 || "") && /Iniciar sesión/.test(signIn || "") && /Continuar con Google/.test(google || "")
  && /Finding is paid from day one/.test(taste || "") && /Only you can delete/.test(del1 || "") && /Borrar mi cuenta/.test(delBtn || "");
if (!ok) { console.error("PROOF FAILED"); process.exit(1); }
console.log("ACCOUNT PAGE PROOF PASSED: Spanish chrome, legal words standing in English");
