import assert from "node:assert/strict";
import { planDeviceRegister, planDeviceDeactivate, planKindToggle, devicePath, pushAvailable, registerPush } from "./push.js";
import { routeWrite } from "./live.js";
let n = 0; const t = (name, fn) => { fn(); n += 1; console.log("ok -", name); };
const now = "2026-10-17T05:00:00.000Z";

t("devicePath: the doc lives under the card, in the fold's geography", () => {
  assert.equal(devicePath("u1", "d1"), "profiles/u1/devices/d1");
  assert.equal(devicePath("", "d1"), null);
  assert.equal(devicePath("u1", ""), null);
});

t("register: a first registration writes the full fenced shape", () => {
  const p = planDeviceRegister({ uid: "u1", deviceId: "d1", token: "tok123", platform: "ios", nowIso: now });
  assert.equal(p.ok, true);
  assert.equal(p.path, "profiles/u1/devices/d1");
  assert.deepEqual(p.data, {
    token: "tok123", platform: "ios", active: true,
    kinds: { message: true, reminder: true },
    createdAt: now, lastSeenAt: now, updatedAt: now,
  });
  assert.deepEqual(Object.keys(p.data).sort(), ["active", "createdAt", "kinds", "lastSeenAt", "platform", "token", "updatedAt"]);
});

t("register: a token refresh keeps the first createdAt and the member's switches", () => {
  const existing = { createdAt: "2026-10-01T00:00:00.000Z", kinds: { message: false, reminder: true } };
  const p = planDeviceRegister({ uid: "u1", deviceId: "d1", token: "newtok", platform: "android", existing, nowIso: now });
  assert.equal(p.data.token, "newtok");
  assert.equal(p.data.createdAt, "2026-10-01T00:00:00.000Z");
  assert.equal(p.data.lastSeenAt, now);
  assert.deepEqual(p.data.kinds, { message: false, reminder: true });
  assert.equal(p.data.active, true);
});

t("register: broken kinds in an existing doc fall back per kind, never wholesale", () => {
  const p = planDeviceRegister({ uid: "u1", deviceId: "d1", token: "t", platform: "web", existing: { kinds: { message: "yes" } }, nowIso: now });
  assert.deepEqual(p.data.kinds, { message: true, reminder: true });
});

t("register: missing pieces are refused", () => {
  assert.equal(planDeviceRegister({ deviceId: "d1", token: "t", platform: "ios", nowIso: now }).ok, false);
  assert.equal(planDeviceRegister({ uid: "u1", token: "t", platform: "ios", nowIso: now }).ok, false);
  assert.equal(planDeviceRegister({ uid: "u1", deviceId: "d1", platform: "ios", nowIso: now }).ok, false);
  assert.equal(planDeviceRegister({ uid: "u1", deviceId: "d1", token: "t", platform: "smoke-signal", nowIso: now }).ok, false);
});

t("deactivate: sign out stamps this device inactive, nothing else", () => {
  const p = planDeviceDeactivate({ uid: "u1", deviceId: "d1", nowIso: now });
  assert.equal(p.ok, true);
  assert.equal(p.path, "profiles/u1/devices/d1");
  assert.deepEqual(p.patch, { active: false, updatedAt: now });
  assert.equal(planDeviceDeactivate({ uid: "u1", nowIso: now }).ok, false);
});

t("toggle: one kind flips, the other stands, the whole kinds map rides", () => {
  const p = planKindToggle({ uid: "u1", deviceId: "d1", kind: "message", on: false, current: { message: true, reminder: true }, nowIso: now });
  assert.equal(p.ok, true);
  assert.deepEqual(p.data, { kinds: { message: false, reminder: true }, updatedAt: now });
  const q = planKindToggle({ uid: "u1", deviceId: "d1", kind: "reminder", on: false, current: undefined, nowIso: now });
  assert.deepEqual(q.data.kinds, { message: true, reminder: false });
});

t("toggle: a kind outside the two is refused", () => {
  assert.equal(planKindToggle({ uid: "u1", deviceId: "d1", kind: "marketing", on: true, nowIso: now }).ok, false);
});

t("router: device writes merge at the planner's path", () => {
  const r = routeWrite("device", { path: "profiles/u1/devices/d1", data: { token: "t" } }, "u1");
  assert.equal(r.ok, true); assert.equal(r.op, "merge"); assert.equal(r.path, "profiles/u1/devices/d1");
});

t("router: device-off updates the signed in member's own device doc", () => {
  const r = routeWrite("device-off", { deviceId: "d1", patch: { active: false, updatedAt: now } }, "u1");
  assert.equal(r.ok, true); assert.equal(r.op, "update"); assert.equal(r.path, "profiles/u1/devices/d1");
  assert.deepEqual(r.data, { active: false, updatedAt: now });
});

t("router: a signed out device write is refused like every kind", () => {
  assert.equal(routeWrite("device", { path: "profiles/u1/devices/d1", data: {} }, "").ok, false);
  assert.equal(routeWrite("device-off", { deviceId: "d1", patch: {} }, "").ok, false);
});

t("seam: with no native shell the seam reports unavailable and the app stands quiet", async () => {
  assert.equal(pushAvailable(), false);
  assert.deepEqual(await registerPush(), { state: "unavailable" });
});

console.log(`\nALL ${n} push checks passed`);
