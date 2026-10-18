// Copies the CURRENT app (the app2 line, exactly the set the web
// host ships) into store/www for the Capacitor wrap. Rebuilt for
// the Caresitters rename (16 Oct 2026): the pack now wraps the same
// bytes the host serves, in the same layout, so the store build
// and the web build are one app. The retired certified line's file
// list is gone with it. Fences held: no test config ships, the
// retire service worker rides as the host's does, and the copy
// must carry the new name with zero old-name display strings.
import { copyFileSync, mkdirSync, readFileSync, rmSync, readdirSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "..");
const www = join(here, "www");

rmSync(www, { recursive: true, force: true });
mkdirSync(www, { recursive: true });

const copy = (from, to) => {
  mkdirSync(dirname(join(www, to)), { recursive: true });
  copyFileSync(join(root, from), join(www, to));
  console.log("copied", to);
};

// Root of the pack, mirroring the host.
copy("store/swap-root-index.html", "index.html");
copy("icon.svg", "icon.svg");
copy("privacy.html", "privacy.html");
copy("store/service-worker-kill.js", "service-worker.js");

// The app2 ship set, DERIVED from the tree (17 Oct 2026 fix: the
// hand-kept list from the swap era silently missed every file the
// later waves added: door.css, the language tables, export, bin,
// photo, resume, countries, prices, push). Every app file ships;
// test material and the battery-only config never do.
const SHIP_EXT = [".html", ".js", ".css"];
const SKIP = (n) => n === "test-config.js" || !SHIP_EXT.some((e) => n.endsWith(e)) || n.includes("tests") || n.startsWith("lang-proof") || n.startsWith("home-") || n.startsWith("price-proof");
for (const f of readdirSync(join(root, "app2"))) {
  if (SKIP(f)) continue;
  const p = join(root, "app2", f);
  if (statSync(p).isFile()) copy(join("app2", f), join("app2", f));
}
for (const b of readdirSync(join(root, "app2", "bunny"))) {
  if (b.endsWith(".png")) copy(join("app2", "bunny", b), join("app2", "bunny", b));
}
// Accounts + fonts + the engine, at the paths the app expects.
for (const f of ["account.html", "account.js", "firebase-config.js"]) copy(join("accounts", f), join("accounts", f));
// The vendored Firebase SDK (18 Oct 2026): the packaged app must
// never load code from a CDN at runtime, so the SDK ships inside.
for (const f of readdirSync(join(root, "accounts", "sdk"))) {
  if (f.endsWith(".js")) copy(join("accounts", "sdk", f), join("accounts", "sdk", f));
}
for (const f of ["Newsreader.ttf", "Atkinson-Regular.ttf", "Atkinson-Bold.ttf"]) copy(join("fonts", f), join("fonts", f));
copy("next-phase/engine/engine.mjs", "next-phase/engine/engine.mjs");

// Guards: the copy must be the renamed app, and nothing else.
const walk = (dir) => readdirSync(dir).flatMap((n) => {
  const p = join(dir, n);
  return statSync(p).isDirectory() ? walk(p) : [p];
});
let bad = 0;
for (const p of walk(www)) {
  const rel = p.slice(www.length + 1);
  if (rel.includes("test-config")) { console.error("SYNC FAIL: test config in the pack:", rel); bad++; }
  if (/\.(html|js|mjs|css|svg|md)$/.test(rel)) {
    const text = readFileSync(p, "utf8");
    if (/Caresits(?!ters)/.test(text)) { console.error("SYNC FAIL: old name still shows in", rel); bad++; }
  }
}
if (!readFileSync(join(www, "app2", "lang.js"), "utf8").includes("Caresitters")) { console.error("SYNC FAIL: new name missing from the language layer"); bad++; }
if (bad) process.exit(1);
console.log("STORE SYNC READY: store/www carries the renamed app (Caresitters), host layout, no test config");
