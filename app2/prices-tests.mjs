import assert from "node:assert/strict";
const { ANCHORS, ANCHOR_DISPLAY, BANDS, COUNTRY_BAND, countryToBand, priceFor, localiseSentence } = await import("./prices.js");
let n = 0; const ck = (name, fn) => { fn(); n++; console.log("ok -", name); };

// The §3 Caresits schedule, every cell, read off
// GLOBAL-PRICING.md §3: one representative country per band.
const BAND_COUNTRY = { A: "US", B: "UK", C: "JP", D: "ZA", E: "PH", F: "IN" };
const SCHEDULE = {
  finding: { A: "$9.99", B: "€7.99", C: "¥1,100", D: "R$31.90", E: "₱249", F: "₹299" },
  plus: { A: "$16.99", B: "€12.99", C: "¥1,900", D: "R$52.90", E: "₱419", F: "₹499" },
  pass: { A: "$31.99", B: "€24.99", C: "¥3,600", D: "R$103.90", E: "₱829", F: "₹999" },
};
for (const plan of ["finding", "plus", "pass"]) {
  ck(`the ${plan} schedule stands in all six bands (6 cells)`, () => {
    for (const band of ["A", "B", "C", "D", "E", "F"]) {
      assert.equal(BANDS[band].display[plan], SCHEDULE[plan][band], `${plan} band ${band}`);
      assert.equal(priceFor(plan, BAND_COUNTRY[band]).display, SCHEDULE[plan][band], `${plan} via ${BAND_COUNTRY[band]}`);
    }
  });
}

ck("the A$ anchors are hers and unchanged", () => {
  assert.deepEqual(ANCHORS, { finding: 14.95, plus: 24.95, pass: 49 });
  assert.deepEqual(ANCHOR_DISPLAY, { finding: "A$14.95", plus: "A$24.95", pass: "A$49" });
});

ck("the band factors are the §2 factors", () => {
  assert.deepEqual(Object.fromEntries(Object.entries(BANDS).map(([b, v]) => [b, v.factor])),
    { A: 1.00, B: 0.90, C: 0.75, D: 0.60, E: 0.45, F: 0.35 });
});

// Worth = AU anchor × band factor, two decimals (her page rule).
const WORTH = {
  finding: { A: "A$14.95", B: "A$13.46", C: "A$11.21", D: "A$8.97", E: "A$6.73", F: "A$5.23" },
  plus: { A: "A$24.95", B: "A$22.46", C: "A$18.71", D: "A$14.97", E: "A$11.23", F: "A$8.73" },
  pass: { A: "A$49.00", B: "A$44.10", C: "A$36.75", D: "A$29.40", E: "A$22.05", F: "A$17.15" },
};
for (const plan of ["finding", "plus", "pass"]) {
  ck(`the ${plan} worth line follows anchor × factor in every band`, () => {
    for (const band of ["A", "B", "C", "D", "E", "F"]) {
      assert.equal(priceFor(plan, BAND_COUNTRY[band]).worth, WORTH[plan][band], `${plan} band ${band}`);
    }
  });
}

ck("Mexico stands in Band F, by her word", () => {
  assert.equal(countryToBand("MX"), "F");
  assert.equal(countryToBand("Mexico"), "F");
  assert.equal(priceFor("finding", "MX").display, "₹299");
  assert.equal(priceFor("finding", "MX").worth, "A$5.23");
});

ck("Australia shows the A$ anchors, with no worth line", () => {
  for (const plan of ["finding", "plus", "pass"]) {
    assert.equal(priceFor(plan, "AU").display, ANCHOR_DISPLAY[plan], plan);
    assert.equal(priceFor(plan, "AU").worth, null, plan);
    assert.equal(priceFor(plan, "Australia").display, ANCHOR_DISPLAY[plan], plan);
    assert.equal(priceFor(plan, "Australia").worth, null, plan);
  }
});

ck("an unknown or unsourced country shows the A$ anchors", () => {
  assert.equal(countryToBand("XX"), null);
  assert.equal(priceFor("finding", "XX").display, "A$14.95");
  assert.equal(priceFor("finding", "XX").worth, null);
  assert.equal(priceFor("finding", null).display, "A$14.95");
  assert.equal(priceFor("finding", undefined).worth, null);
  // Ireland is a country pack with no sourced band in the
  // 16 country PPP table: it defaults, and says so in the data.
  assert.equal(countryToBand("IE"), null);
  assert.equal(priceFor("plus", "Ireland").display, "A$24.95");
});

ck("country names and ids resolve to the same band", () => {
  assert.equal(countryToBand("DE"), "B");
  assert.equal(countryToBand("Germany"), "B");
  assert.equal(countryToBand("Japan"), "C");
  assert.equal(countryToBand("Spain"), "C");
  assert.equal(countryToBand("South Africa"), "D");
  assert.equal(countryToBand("France"), "B");
  assert.equal(countryToBand("United Kingdom"), "B");
  assert.equal(countryToBand("United States"), "A");
  assert.equal(countryToBand("New Zealand"), "A");
  assert.equal(countryToBand("Brazil"), "D");
  assert.equal(countryToBand("India"), "F");
});

ck("every pack country with a sourced band is in the map", () => {
  const sourced = ["AU", "US", "NZ", "UK", "CA", "DE", "FR", "NL", "AT", "BE", "JP", "ES", "ZA"];
  for (const id of sourced) assert.ok(COUNTRY_BAND[id], id);
  const unsourced = ["IE", "IT", "DK", "NO", "SE", "CH", "HK", "AE"];
  for (const id of unsourced) assert.equal(COUNTRY_BAND[id], undefined, id);
});

ck("the sentence swap leaves Australia word for word", () => {
  const s = "Finding is A$14.95 a month, and you can stop any time.";
  assert.equal(localiseSentence(s, "finding", "AU", "worth A$14.95"), s);
  assert.equal(localiseSentence(s, "finding", null, "worth A$14.95"), s);
  assert.equal(localiseSentence(s, "finding", "IE", "worth A$14.95"), s);
});

ck("the sentence swap puts the band price and its worth in place", () => {
  const s = "Finding is A$14.95 a month, and you can stop any time.";
  const p = priceFor("finding", "Germany");
  assert.equal(localiseSentence(s, "finding", "Germany", `worth ${p.worth}`),
    "Finding is €7.99 (worth A$13.46) a month, and you can stop any time.");
  const s2 = "Family Plus is the everything plan: A$24.95 a month, with the first month free.";
  const p2 = priceFor("plus", "JP");
  assert.equal(localiseSentence(s2, "plus", "JP", `worth ${p2.worth}`),
    "Family Plus is the everything plan: ¥1,900 (worth A$18.71) a month, with the first month free.");
});

ck("a sentence with no anchor figure in it is never touched", () => {
  const s = "You found someone worth writing to";
  assert.equal(localiseSentence(s, "finding", "DE", "worth A$13.46"), s);
});

ck("an unknown plan returns nothing, never a made up price", () => {
  assert.equal(priceFor("gold", "DE"), null);
});

console.log(`\nALL ${n} prices checks passed`);
