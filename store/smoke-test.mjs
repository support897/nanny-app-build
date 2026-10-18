// Smoke test for the wrapped web copy (store/www), the exact files Capacitor ships.
// Serves store/www and walks the golden path. Run: node smoke-test.mjs
import { chromium } from "/home/hatch/node_modules/playwright-core/index.mjs";
import { spawn } from "node:child_process";

const HERE = new URL(".", import.meta.url).pathname;
const PORT = 8924;
const server = spawn("python3", ["-m", "http.server", String(PORT), "--bind", "127.0.0.1"], { cwd: HERE + "www", stdio: "ignore" });
await new Promise((r) => setTimeout(r, 1500));

let pass = 0, fail = 0;
const check = (name, ok) => { console.log((ok ? "PASS " : "FAIL ") + name); ok ? pass++ : fail++; };

const browser = await chromium.launch({ executablePath: "/home/hatch/.cache/ms-playwright/chromium-1187/chrome-linux/chrome" });
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));

async function navTo(page, v) {
  const btn = page.locator('[data-nav="' + v + '"]');
  if (!(await btn.isVisible())) {
    await page.evaluate((view) => {
      const b = document.querySelector('[data-nav="' + view + '"]');
      const items = b && b.closest('.navGroupItems');
      const head = items && items.parentElement.querySelector('.navGroupHead');
      if (head) head.click();
    }, v);
  }
  await btn.click();
}
page.setDefaultTimeout(9000);
try {
  await page.goto(`http://127.0.0.1:${PORT}/index.html`, { waitUntil: "domcontentloaded" });
  check("wrapped copy loads with the app title", (await page.title()) === "Caresits");
  await page.click("#startNext");
  await page.click("#startNext");
  await page.click('[data-role="aupair"]');
  await page.click("#startNext");
  await page.fill("#startName", "Smoke Family");
  await page.fill("#startSuburb", "Paddington");
  await page.click("#startNext");
  await page.click("#sidebarToggle");
  await navTo(page, 'find');
  check("wrapped store copy starts with an empty directory", (await page.locator("#main").innerText()).includes("No carers have joined yet"));
  await navTo(page, 'children');
  await page.fill("#kName", "Mila");
  await page.click("#kAdd");
  await navTo(page, 'daystory');
  await page.click('[data-tile="meal"]');
  await page.fill("#tileNote", "Smoke meal");
  await page.click("#tileSave");
  check("wrapped copy logs a day story entry", (await page.locator(".storyItem").count()) >= 1);
  check("no page errors in the wrapped copy", errors.length === 0);
} finally {
  await browser.close();
  server.kill();
}
console.log(`SMOKE PASS ${pass} FAIL ${fail}`);
process.exit(fail ? 1 : 0);
