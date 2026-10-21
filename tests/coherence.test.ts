import { test } from "node:test";
import assert from "node:assert/strict";
import { checkCoherence } from "../lib/ai/coherence.ts";
import { DeliverablesSchema } from "../lib/ai/schemas.ts";
import { sample } from "./fixtures.ts";
import { presetPeriod, targetEntryCount, validatePeriod } from "../lib/calendar.ts";

test("le jeu d'exemple respecte le schéma et ne remonte aucune erreur", () => {
  assert.ok(DeliverablesSchema.safeParse(sample()).success);
  assert.deepEqual(checkCoherence(sample()).filter((i) => i.severity === "error"), []);
});

test("détecte budget dépassé, parts incohérentes, dates hors période et faits non sourcés", () => {
  const d = sample();
  d.media.campaigns[0].budget = 900_000;
  d.media.channels[0].budgetShare = 0.9;
  d.content.entries.push({ ...d.content.entries[0], date: "2027-01-10", platform: "Radio" });
  d.market.trends[0].source = null;
  const msgs = checkCoherence(d).map((i) => i.message).join("\n");
  assert.match(msgs, /dépasse le budget/);
  assert.match(msgs, /totalisent 130/);
  assert.match(msgs, /hors de la période/);
  assert.match(msgs, /Radio/);
  assert.match(msgs, /sans source/);
});

test("périodes du calendrier", () => {
  assert.deepEqual(presetPeriod("7j", "2026-11-01"), { start: "2026-11-01", end: "2026-11-07" });
  assert.equal(presetPeriod("3m", "2026-11-01").end, "2027-01-30");
  assert.equal(validatePeriod({ start: "2026-11-01", end: "2027-03-01" }), "La période ne peut pas dépasser 92 jours.");
  assert.ok(validatePeriod({ start: "2026-11-05", end: "2026-11-01" }));
  assert.equal(targetEntryCount({ start: "2026-11-01", end: "2026-11-30" }), 15);
});
