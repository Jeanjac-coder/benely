import { test } from "node:test";
import assert from "node:assert/strict";
import { optimize } from "../lib/optimizer.ts";

const plan = [
  { channel: "WhatsApp", budgetShare: 0.5, monthlyTarget: 50 },
  { channel: "Facebook", budgetShare: 0.5, monthlyTarget: 50 },
];

test("déplace le budget du canal le moins efficace vers le plus efficace", () => {
  const r = optimize(plan, [
    { channel: "WhatsApp", spend: 50_000, conversions: 80 },
    { channel: "Facebook", spend: 50_000, conversions: 20 },
  ], 100_000);
  const fb = r.adjustments.find((a) => a.channel === "Facebook")!;
  const wa = r.adjustments.find((a) => a.channel === "WhatsApp")!;
  assert.ok(fb.toShare < fb.fromShare && wa.toShare > wa.fromShare);
  assert.ok(Math.abs(fb.fromShare - fb.toShare - (wa.toShare - wa.fromShare)) < 1e-9);
  assert.equal(r.analysis.find((a) => a.channel === "Facebook")!.status, "behind");
});

test("signale les canaux sans données et le dépassement de budget", () => {
  const r = optimize(plan, [{ channel: "WhatsApp", spend: 120_000, conversions: 50 }], 100_000);
  assert.ok(r.alerts.some((a) => a.includes("Dépassement")));
  assert.ok(r.alerts.some((a) => a.includes("Facebook")));
  assert.equal(r.adjustments.length, 0);
});
