// Desk proof for the QA F1 + F2 fix: the Find pool line and the
// Nearly card place line in Spanish, on a populated pool.
import { chromium } from "playwright-core";
import http from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join } from "node:path";
const ROOT = join(import.meta.dirname, "..");
const MIME = { ".html": "text/html", ".js": "text/javascript", ".mjs": "text/javascript", ".css": "text/css", ".png": "image/png", ".ttf": "font/ttf", ".svg": "image/svg+xml" };
const srv = http.createServer(async (req, res) => {
  try {
    let p = decodeURIComponent(req.url.split("?")[0]); if (p === "/") p = "/app2/index.html";
    const body = await readFile(join(ROOT, p));
    res.writeHead(200, { "content-type": MIME[extname(p)] || "application/octet-stream" }); res.end(body);
  } catch { res.writeHead(404); res.end("nf"); }
});
await new Promise((r) => srv.listen(8945, r));
const famDoc = { side: "family", level: "full", displayName: "Sam", postcode: "2021", card: {
  childrenBands: ["1-3", "3-5"], languages: ["English", "Spanish"], pets: true, smokerHousehold: false, payOffered: 38,
  scheduleNeed: { Thu: ["morning", "afternoon"], Tue: ["afternoon"] }, latE2: -3388, lngE2: 15123 },
  looking: { musts: { languages: ["English"], checksLevel: "register", maxDistanceKm: 10, tasks: ["school runs"] },
             prefs: { personality: ["warm", "patient", "playful"], activities: ["park", "reading"], tasks: ["school runs", "cooking"], cooking: true, routineStyle: "steady rhythm" } } };
const anaCard = { age: 29, nationality: "Colombian", languages: ["English", "Spanish"], smoker: false,
  experience: { "1-3": 6, "3-5": 5 }, checksLevel: "register", drives: true, ownCar: true, petsOk: true, cooking: true,
  tasks: ["school runs", "cooking"], specialNeeds: true, availability: { Thu: ["morning", "afternoon"], Tue: ["afternoon"] },
  activities: ["park", "reading", "music"], personality: ["warm", "patient", "playful"], routineStyle: "steady rhythm",
  maxDistanceKm: 12, payFloor: 32, agesAccepted: ["1-3", "3-5"], agesPreferred: ["1-3", "3-5"], latE2: -3389, lngE2: 15124 };
const ana = { side: "carer", displayName: "Ana", postcode: "2021", card: { ...anaCard }, looking: { musts: {}, prefs: {} } };
const mei = { side: "carer", displayName: "Mei", postcode: "2021", card: { ...anaCard, availability: { Tue: ["afternoon"] } }, looking: { musts: {}, prefs: {} } };
const browser = await chromium.launch({ executablePath: "/home/hatch/.cache/ms-playwright/chromium-1187/chrome-linux/chrome", args: ["--disable-dev-shm-usage", "--no-sandbox"] });
const ctx = await browser.newContext({ locale: "es-ES", viewport: { width: 390, height: 844 } });
const page = await ctx.newPage();
await page.addInitScript((data) => { window.CARESITS_FIND_DATA = data; }, { viewer: famDoc, candidates: [ana, mei] });
await page.goto("http://localhost:8945/app2/index.html", { waitUntil: "networkidle" });
await page.click("#menuBtn");
await page.evaluate(() => document.querySelector('.navGroupHead[data-group="finding"]').click());
await page.evaluate(() => document.querySelector('[data-nav="find"]').click());
await page.waitForTimeout(400);
const pool = await page.textContent(".findPool");
const place = await page.textContent(".findCard.nearly .findPlace").catch(() => "(no nearly card)");
const gate = await page.textContent(".findCard.nearly .findGate").catch(() => "");
console.log("POOL:", pool);
console.log("NEARLY PLACE:", place);
console.log("NEARLY GATE:", gate);
await page.screenshot({ path: new URL("./lang-find-pool-es.png", import.meta.url).pathname });
await browser.close(); srv.close();
if (!/cuidadoras en tu grupo/.test(pool || "") || !/Código postal 2021/.test(place || "")) { console.error("PROOF FAILED"); process.exit(1); }
console.log("QA FIX PROOF PASSED");
