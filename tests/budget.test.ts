import { test } from "node:test";
import assert from "node:assert/strict";
import { amounts, normalizeShares, scaleBudgets, setShare } from "../lib/budget.ts";
import { applyBudget } from "../lib/strategy-edit.ts";
import { sample } from "./fixtures.ts";

const sum = (xs: { budgetShare: number }[]) => xs.reduce((s, x) => s + x.budgetShare, 0);
const base = [
  { channel: "WhatsApp", budgetShare: 0.4 },
  { channel: "Facebook", budgetShare: 0.4 },
  { channel: "TikTok", budgetShare: 0.2 },
];

test("T07: modifier une part recalcule les autres en gardant 100 %", () => {
  const r = setShare(base, 0, 0.6);
  assert.equal(r[0].budgetShare, 0.6);
  assert.ok(Math.abs(sum(r) - 1) < 1e-9);
  assert.ok(Math.abs(r[1].budgetShare / r[2].budgetShare - 2) < 1e-9, "proportions des autres conservées");
});

test("les canaux verrouillés ne bougent pas et plafonnent la part possible", () => {
  const r = setShare(base, 0, 0.95, new Set([2]));
  assert.equal(r[2].budgetShare, 0.2);
  assert.ok(Math.abs(r[0].budgetShare - 0.8) < 1e-9);
  assert.ok(Math.abs(sum(r) - 1) < 1e-9);
});

test("normalisation et montants", () => {
  const n = normalizeShares([{ channel: "a", budgetShare: 2 }, { channel: "b", budgetShare: 2 }, { channel: "c", budgetShare: -1 }]);
  assert.deepEqual(n.map((x) => x.budgetShare), [0.5, 0.5, 0]);
  assert.deepEqual(amounts(n, 150_000).map((x) => x.amount), [75_000, 75_000, 0]);
  assert.deepEqual(normalizeShares([{ channel: "a", budgetShare: 0 }, { channel: "b", budgetShare: 0 }]).map((x) => x.budgetShare), [0.5, 0.5]);
});

test("les campagnes suivent un changement de budget mensuel", () => {
  assert.deepEqual(scaleBudgets([{ budget: 100_000 }, { budget: 50_000 }], 200_000, 100_000).map((c) => c.budget), [50_000, 25_000]);
});

test("T07: applyBudget recalcule parts et campagnes", () => {
  const d = applyBudget(sample(), 100_000, { "WhatsApp Business": 3, TikTok: 1 });
  assert.deepEqual(d.media.channels.map((c) => c.budgetShare), [0.75, 0.25]);
  assert.equal(d.media.campaigns[0].budget, 75_000);
  assert.equal(d.meta.monthlyBudget, 100_000);
});
