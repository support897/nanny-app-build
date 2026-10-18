import assert from "node:assert/strict";
import { planRequest, planDecision, planBlockLanding, planPointer, clashLine } from "./calendar-actions.js";
let n = 0; const t = (name, fn) => { fn(); n += 1; console.log("ok -", name); };
const now = "2026-10-15T00:00:00.000Z";
const req = { id: "R1", kind: "extra", askedBy: "f1", day: "Tue", start: "09:00", end: "12:00", state: "waiting" };
t("request: born waiting, closed shape", () => { const p = planRequest({ pairId: "p", kind: "extra", askedBy: "f1", day: "Tue", start: "09:00", end: "12:00", nowIso: now }); assert.equal(p.ok, true); assert.equal(p.data.state, "waiting"); });
t("request: a week change must carry its version", () => { assert.equal(planRequest({ pairId: "p", kind: "week-change", askedBy: "c1", nowIso: now }).ok, false); });
t("decide: the asker can never decide their own", () => { assert.equal(planDecision(req, "f1", true).ok, false); });
t("decide: the other side accepts, stamped", () => { const p = planDecision(req, "c1", true); assert.equal(p.ok, true); assert.equal(p.patch.decidedBy, "c1"); });
t("landing: only the accepter lands, and only an equal block", () => {
  const accepted = { ...req, state: "accepted", decidedBy: "c1" };
  assert.equal(planBlockLanding({ pairId: "p", request: accepted, block: { day: "Thu", start: "09:00", end: "12:00", kind: "extra" }, actorUid: "c1", otherUid: "f1", nowIso: now }).reason, "day-mismatch");
  const good = planBlockLanding({ pairId: "p", request: accepted, block: { day: "Tue", start: "09:00", end: "12:00", kind: "extra" }, actorUid: "c1", otherUid: "f1", nowIso: now });
  assert.equal(good.ok, true); assert.equal(good.data.sourceRequest, "R1");
  assert.equal(planBlockLanding({ pairId: "p", request: accepted, block: { day: "Tue", start: "09:00", end: "12:00", kind: "extra" }, actorUid: "f1", otherUid: "c1", nowIso: now }).reason, "only-the-accepter-lands");
});
t("pointer: formation is free, later moves bind to the accepted change", () => {
  assert.equal(planPointer({ pairId: "p", versionId: "v1", effectiveFrom: "2026-10-15", actorUid: "f1", nowIso: now }).formation, true);
  const bound = { id: "R9", kind: "week-change", state: "accepted", decidedBy: "f1", askedBy: "c1", proposedVersionId: "v2", effectiveFrom: "2026-11-02" };
  assert.equal(planPointer({ pairId: "p", versionId: "v2", effectiveFrom: "2026-11-03", actorUid: "f1", nowIso: now, boundRequest: bound, current: { versionId: "v1" } }).reason, "values-must-equal-proposal");
  const mv = planPointer({ pairId: "p", versionId: "v2", effectiveFrom: "2026-11-02", actorUid: "f1", nowIso: now, boundRequest: bound, current: { versionId: "v1" } });
  assert.equal(mv.ok, true); assert.equal(mv.data.boundRequest, "R9");
});
t("PIN C: the clash line speaks before any tap", () => { const line = clashLine(req, [{ day: "Tue", start: "15:00", end: "17:00", state: "live" }]); assert.ok(line && line.includes("already has a one time block")); assert.equal(clashLine(req, []), null); });
console.log(`\nALL ${n} calendar-action checks passed`);
