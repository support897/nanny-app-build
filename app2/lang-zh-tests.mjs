// Simplified Chinese coverage + fence checks. Mirrors the Spanish
// legs in lang-tests.mjs, pointed at lang-q-zh.js + lang-zh-ui.js.
// The wiring that merges these as STRINGS.zh lands separately;
// until then this file proves the tables themselves.
import assert from "node:assert/strict";
Object.defineProperty(globalThis, "navigator", { value: { language: "zh-CN" }, configurable: true });
globalThis.localStorage = { _m: {}, getItem(k) { return this._m[k] ?? null; }, setItem(k, v) { this._m[k] = v; } };
const { STRINGS } = await import("./lang.js");
const { Q_EN } = await import("./lang-q.js");
const { Q_ES } = await import("./lang-q-es.js");
const { Q_ZH } = await import("./lang-q-zh.js");
const { UI_ZH } = await import("./lang-zh-ui.js");
let n = 0; const ck = (name, fn) => { fn(); n++; console.log("ok -", name); };
const CHECKS = new Set(["Register verified", "Document sighted", "Getting them now"]);
const FENCED_Q = ["q.checksLevel.o0", "q.checksLevel.o1", "q.checksLevel.o2"];
const ph = (s) => [...s.matchAll(/\{[a-z]+\}/g)].map((m) => m[0]).sort().join(",");

ck("the three fenced checks options are absent from the Chinese registry", () =>
  FENCED_Q.forEach((k) => assert.ok(!(k in Q_ZH), k)));
ck("the whole questionnaire is covered in Chinese except the fenced checks phrases", () => {
  const missing = Object.keys(Q_EN).filter((k) => !(k in Q_ZH));
  assert.deepEqual(missing.sort(), [...FENCED_Q].sort());
  assert.ok(missing.every((k) => CHECKS.has(Q_EN[k])));
});
ck("no checks phrase is translated anywhere in the Chinese registry", () =>
  assert.ok(Object.entries(Q_ZH).every(([k]) => !CHECKS.has(Q_EN[k]))));
ck("no Chinese key sits under checks. or legal. in either table", () => {
  assert.ok(Object.keys(UI_ZH).every((k) => !k.startsWith("checks.") && !k.startsWith("legal.")));
  assert.ok(Object.keys(Q_ZH).every((k) => !k.startsWith("checks.") && !k.startsWith("legal.")));
});
ck("every UI key in the Spanish table has a Chinese twin, and no extras", () => {
  const uiKeys = Object.keys(STRINGS.es).filter((k) => !(k in Q_ES));
  for (const k of uiKeys) assert.ok(UI_ZH[k], k);
  assert.deepEqual(Object.keys(UI_ZH).sort(), uiKeys.sort());
});
ck("no value in either Chinese table is empty", () => {
  for (const [k, v] of [...Object.entries(Q_ZH), ...Object.entries(UI_ZH)]) assert.ok(typeof v === "string" && v.length > 0, k);
});
ck("placeholders survive translation, key for key", () => {
  for (const [k, v] of Object.entries(Q_ZH)) assert.equal(ph(v), ph(Q_EN[k]), k);
  const uiKeys = Object.keys(STRINGS.es).filter((k) => !(k in Q_ES));
  for (const k of uiKeys) assert.equal(ph(UI_ZH[k]), ph(STRINGS.en[k]), k);
});
ck("the popup keeps its exact plan names and prices", () => {
  assert.ok(UI_ZH["popup.finding"].includes("Finding") && UI_ZH["popup.finding"].includes("A$14.95"));
  assert.ok(UI_ZH["popup.plus"].includes("Family Plus") && UI_ZH["popup.plus"].includes("A$24.95"));
});
ck("the brand name stays in Latin script on the door", () =>
  assert.ok(UI_ZH["door.join"].includes("Caresitters")));
const total = Object.keys(Q_EN).length, covered = Object.keys(Q_ZH).length;
const uiTotal = Object.keys(STRINGS.es).filter((k) => !(k in Q_ES)).length;
console.log(`registry coverage: ${covered}/${total} keys in Simplified Chinese (the rest are the fenced checks phrases)`);
console.log(`UI coverage: ${Object.keys(UI_ZH).length}/${uiTotal} keys in Simplified Chinese`);
console.log(`\nALL ${n} zh language checks passed`);
