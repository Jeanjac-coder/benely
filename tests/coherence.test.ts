import { test } from "node:test";
import assert from "node:assert/strict";
import { checkCoherence, checkMethodology } from "../lib/ai/coherence.ts";
import { upgradeDeliverables } from "../lib/ai/upgrade.ts";
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

test("méthodologie: l'échantillon conforme ne produit ni erreur ni avertissement méthodologique", () => {
  // Seule remarque attendue: le mix n'a pas de canal « earned » (simple information).
  assert.deepEqual(checkMethodology(sample()).map((i) => i.severity), ["info"]);
});

test("méthodologie: étapes d'audit manquantes = erreur; PESTEL, RACE, piliers incomplets = avertissements", () => {
  const d = sample();
  d.diagnostic.methodologyAudit = d.diagnostic.methodologyAudit.slice(0, 8);
  d.diagnostic.pestel = d.diagnostic.pestel.slice(0, 4);
  d.strategy.smartObjectives = d.strategy.smartObjectives.slice(0, 2);
  d.content.pillars = d.content.pillars.slice(0, 1);
  d.media.trackingChecklist = [];
  const issues = checkMethodology(d);
  const err = issues.find((i) => i.severity === "error")!;
  assert.match(err.message, /9\. Mesure et KPIs, 10\. Optimisation continue/);
  for (const re of [/PESTEL incomplète: ecologique, legal/, /RACE\): conversion, fidelisation/, /3 à 5 piliers/, /tracking/]) assert.ok(issues.some((i) => re.test(i.message)), re.source);
});

test("méthodologie: une stratégie antérieure est complétée et signalée sans erreur bloquante", () => {
  const old = sample() as unknown as Record<string, Record<string, unknown>>;
  delete old.diagnostic.methodologyAudit; delete old.diagnostic.pestel; delete old.branding.bigIdea;
  const d = upgradeDeliverables(old);
  assert.equal(d.branding.bigIdea, "");
  assert.ok(DeliverablesSchema.safeParse(d).success);
  const issues = checkMethodology(d);
  assert.ok(issues.some((i) => /antérieure à la méthodologie/.test(i.message)));
  assert.equal(issues.filter((i) => i.severity === "error").length, 0);
});
