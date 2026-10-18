// Country packs — data integrity (node, no browser).
// Sources of record: next-phase/COUNTRY-PACKS-REFRESH-2026-10-17.md
// (official sources, re-verified 17 Oct 2026) + PHASE1-RESEARCH.md
// §11.3 + §12. Run: node countries-tests.mjs
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
Object.defineProperty(globalThis, "navigator", { value: { language: "en-AU" }, configurable: true });
globalThis.localStorage = { _m: {}, getItem(k) { return this._m[k] ?? null; }, setItem(k, v) { this._m[k] = v; } };
const { COUNTRIES, COUNTRY_NAMES, packById, packByName, auJurisdiction, checkFor } = await import("./countries.js");
const { STRINGS } = await import("./lang.js");

let n = 0; const ck = (name, fn) => { fn(); n++; console.log("ok -", name); };

ck("there are exactly 21 country packs", () => assert.equal(COUNTRIES.length, 21));
ck("pack ids and names are unique", () => {
  assert.equal(new Set(COUNTRIES.map((c) => c.id)).size, 21);
  assert.equal(new Set(COUNTRIES.map((c) => c.name)).size, 21);
  assert.equal(COUNTRY_NAMES.length, 21);
});
ck("every pack carries a check name, a cost text and a could not verify list", () => {
  for (const c of COUNTRIES) {
    assert.ok(c.checkName && c.checkName.length > 3, c.id);
    assert.ok(typeof c.costText === "string" && c.costText.length > 0, c.id);
    assert.ok(Array.isArray(c.cnv), c.id);
  }
});
ck("a cost cell that is not verified says could not verify, never a guess", () => {
  for (const c of COUNTRIES) if (!c.costVerified) assert.ok(c.costText.includes("Could not verify"), c.id);
  assert.equal(packById("NO").costVerified, false); // Norway's fee: the known gap
});
ck("every pack points at an official source (Australia at jurisdiction level)", () => {
  for (const c of COUNTRIES) {
    if (c.jurisdictions) for (const j of c.jurisdictions) assert.ok(j.checkUrl.startsWith("https://"), c.id + "/" + j.id);
    else assert.ok(c.checkUrl.startsWith("https://"), c.id);
  }
});
ck("Australia expands to its 8 jurisdictions, each with check name, cost and source", () => {
  const au = packById("AU");
  assert.equal(au.jurisdictions.length, 8);
  assert.deepEqual(au.jurisdictions.map((j) => j.id).sort(), ["ACT", "NSW", "NT", "QLD", "SA", "TAS", "VIC", "WA"]);
  for (const j of au.jurisdictions) {
    assert.ok(j.checkName.length > 3, j.id);
    assert.ok(j.costText.length > 0, j.id);
  }
});
ck("register kind: only Australia is a register country", () => {
  for (const c of COUNTRIES) assert.equal(c.register, c.id === "AU", c.id);
});
ck("inside Australia every jurisdiction has a free checker except the ACT, which confirms by email", () => {
  for (const j of packById("AU").jurisdictions) assert.equal(j.register, j.id !== "ACT", j.id);
});
ck("the US pack carries the caution and no stipend figure anywhere", () => {
  const us = packById("US");
  assert.equal(us.caution, true);
  assert.ok(us.aupairScheme);
  assert.ok(!JSON.stringify(us).includes("195.75"));
  assert.ok(us.aupairNote === null || !/\$\s?\d/.test(us.aupairNote));
});
ck("the US caution words in the language layer carry no figure either", () => {
  const s = STRINGS.en["country.usCaution"];
  assert.ok(s && s.length > 20);
  assert.ok(!s.includes("$") && !/\d/.test(s));
});
ck("au pair scheme flags match the design (scheme countries only)", () => {
  const scheme = COUNTRIES.filter((c) => c.aupairScheme).map((c) => c.id).sort();
  assert.deepEqual(scheme, ["AT", "BE", "CH", "DE", "DK", "FR", "NL", "SE", "US"]);
});
ck("user facing pack words carry no dash characters", () => {
  for (const c of COUNTRIES) {
    for (const s of [c.name, c.checkName, c.costText, c.aupairNote || ""]) assert.ok(!s.includes("-"), c.id + ": " + s);
    for (const j of c.jurisdictions || []) for (const s of [j.name, j.checkName, j.costText]) assert.ok(!s.includes("-"), j.id + ": " + s);
  }
});
ck("the new language keys exist in English and Spanish, dash free", () => {
  for (const k of ["q.country", "country.title", "country.registerLine", "country.sightedLine", "country.officialLink", "country.payWage", "country.payPocket", "country.payPocketHint", "country.usCaution"]) {
    assert.ok(STRINGS.en[k], k);
    assert.ok(STRINGS.es[k], k);
    assert.ok(!STRINGS.en[k].includes("-"), k);
  }
});
ck("postcode resolves the jurisdiction (2021 is NSW, 4000 is QLD, 7000 is TAS)", () => {
  assert.equal(auJurisdiction("2021").id, "NSW");
  assert.equal(auJurisdiction("4000").checkName, "Blue Card");
  assert.equal(auJurisdiction("7000").id, "TAS");
  assert.equal(auJurisdiction("0800").id, "NT");
  assert.equal(auJurisdiction("2600").id, "ACT");
  assert.equal(auJurisdiction(""), null);
});
ck("checkFor speaks the jurisdiction facts, and the ACT falls back to sighted", () => {
  const au = packById("AU");
  const nsw = checkFor(au, "2021");
  assert.equal(nsw.register, true); assert.ok(nsw.costText.includes("$112")); assert.equal(nsw.place, "New South Wales");
  const act = checkFor(au, "2600");
  assert.equal(act.register, false);
  const nat = checkFor(au, "");
  assert.equal(nat.register, true); assert.equal(nat.place, null);
  assert.equal(checkFor(packById("DE"), "").register, false);
});
ck("pack lookup works by name and by id", () => {
  assert.equal(packByName("Germany").id, "DE");
  assert.equal(packByName("Nope"), null);
  assert.equal(packById("ZZ"), null);
});
ck("the journey wires the country step and the pack pay words", () => {
  const src = readFileSync(new URL("./journey.js", import.meta.url), "utf8");
  assert.ok(src.includes("COUNTRY_NAMES") && src.includes("countryStep") && src.includes("payHelp") && src.includes("country: a.country"));
  const save = readFileSync(new URL("./account-save.js", import.meta.url), "utf8");
  assert.ok(save.includes("country: bundle.country"));
  const trust = readFileSync(new URL("./trust.js", import.meta.url), "utf8");
  assert.ok(trust.includes("checkFor") && trust.includes("countryCard"));
});

console.log(`\nALL ${n} country pack checks passed`);
