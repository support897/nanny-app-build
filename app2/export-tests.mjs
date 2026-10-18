import assert from "node:assert/strict";
import { gatherExport, exportFilename } from "./export.js";
// F10 (Test desk build 8 retest): the resolved in progress draft
// shape is a valid questionnaire space; the browser side legs
// (live getter, draft fallback, precedence) live in
// export-walk-tests.mjs. This file moves 12 -> 13 for it.
let n = 0; const t = (name, fn) => { fn(); n += 1; console.log("ok -", name); };
const now = "2026-10-15T00:00:00.000Z";
const answers12 = Object.fromEntries(Array.from({ length: 12 }, (_, i) => ["q" + (i + 1), "yes"]));
const full = {
  me: { uid: "f1", side: "family", name: "Sam" },
  profile: { name: "Sam", side: "family", postcode: "2021" },
  questionnaire: { side: "family", answers: answers12, strengths: {}, card: { side: "family" } },
  children: [{ id: "k1", name: "Mila" }, { id: "k2", name: "Leo" }],
  dayStory: [{ note: "a" }, { note: "b" }, { note: "c" }, { note: "d" }, { note: "e" }],
  messages: [{ text: "one", mine: true }, { text: "two", mine: true }, { text: "three", mine: true }],
  calendar: { pairId: "p1", blocks: [] },
  nowIso: now,
};
t("full: the copy has exactly the seven keys in order", () => { const out = gatherExport(full); assert.deepEqual(Object.keys(out), ["profile", "answers", "children", "dayStory", "messagesSent", "calendar", "summary"]); });
t("full: profile, answers and calendar pass through from the real data", () => { const out = gatherExport(full); assert.deepEqual(out.profile, { uid: "f1", side: "family", name: "Sam", postcode: "2021" }); assert.deepEqual(out.answers, answers12); assert.deepEqual(out.calendar, { pairId: "p1", blocks: [] }); });
t("full: children, day story and sent messages keep their real items", () => { const out = gatherExport(full); assert.equal(out.children.length, 2); assert.equal(out.dayStory.length, 5); assert.equal(out.messagesSent.length, 3); assert.deepEqual(out.messagesSent, full.messages); });
t("full: summary counts come from the actual data", () => { const out = gatherExport(full); assert.ok(out.summary.includes("Profile: Sam, family")); assert.ok(out.summary.includes("Answers: 12 saved")); assert.ok(out.summary.includes("Children: 2")); assert.ok(out.summary.includes("Day Story: 5 notes")); assert.ok(out.summary.includes("Messages sent: 3")); assert.ok(out.summary.includes("Pair calendar: in this copy")); });
t("full: a made on line leads only when a time is given", () => { const out = gatherExport(full); assert.equal(out.summary[0].startsWith("Made on "), true); assert.equal(out.summary.length, 7); const plain = gatherExport({ children: [] }); assert.equal(plain.summary.some((line) => line.startsWith("Made on ")), false); });
t("empty: nulls and empty lists, nothing invented", () => { const out = gatherExport({}); assert.equal(out.profile, null); assert.equal(out.answers, null); assert.deepEqual(out.children, []); assert.deepEqual(out.dayStory, []); assert.deepEqual(out.messagesSent, []); assert.equal(out.calendar, null); });
t("empty: the summary honestly says each section is not in this copy", () => { const out = gatherExport({}); assert.deepEqual(out.summary, ["Profile: not in this copy", "Answers: not in this copy", "Children: not in this copy", "Day Story: not in this copy", "Messages sent: not in this copy", "Pair calendar: not in this copy"]); });
t("messages: the sent count counts only the given messages array", () => { const mine = [{ text: "hi", mine: true }, { text: "again", mine: true }]; const out = gatherExport({ messages: mine }); assert.equal(out.messagesSent.length, 2); assert.ok(out.summary.includes("Messages sent: 2")); });
t("presence: a given empty list counts as zero, not as missing", () => { const out = gatherExport({ children: [], dayStory: [], messages: [] }); assert.ok(out.summary.includes("Children: 0")); assert.ok(out.summary.includes("Day Story: 0 notes")); assert.ok(out.summary.includes("Messages sent: 0")); });
t("answers: a missing questionnaire gives null answers and an honest line", () => { const out = gatherExport({ questionnaire: { side: "family" } }); assert.equal(out.answers, null); assert.ok(out.summary.includes("Answers: not in this copy")); });
t("summary: no line carries a dash character", () => { for (const out of [gatherExport(full), gatherExport({})]) { for (const line of out.summary) { assert.equal(line.includes("-"), false, line); assert.equal(line.includes("—"), false, line); assert.equal(line.includes("–"), false, line); } } });
t("filename: the exact name, with no hyphen character", () => { assert.equal(exportFilename(), "CaresittersMyData.json"); assert.equal(exportFilename().includes("-"), false); });
t("draft shape: a questionnaire carrying only answers (the resolved draft) exports those answers", () => { const out = gatherExport({ questionnaire: { answers: { postcode: "2021", childrenBands: ["1-3"] } } }); assert.deepEqual(out.answers, { postcode: "2021", childrenBands: ["1-3"] }); assert.ok(out.summary.includes("Answers: 2 saved")); });
console.log(`\nALL ${n} export checks passed`);
