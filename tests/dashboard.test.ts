import { test } from "node:test";
import assert from "node:assert/strict";
import { campaignProgress, monthGrid, objectiveStatus, weeklyCounts } from "../lib/dashboard.ts";

test("publications par semaine, du lundi au dimanche, semaine en cours repérée", () => {
  // 2026-11-01 est un dimanche: la première semaine commence le lundi 26 octobre.
  const bars = weeklyCounts(["2026-11-01", "2026-11-02", "2026-11-03", "2026-11-30"], { start: "2026-11-01", end: "2026-11-30" }, "2026-11-04");
  assert.equal(bars[0].start, "2026-10-26");
  assert.equal(bars[0].count, 1);
  assert.equal(bars[1].count, 2);
  assert.equal(bars.at(-1)!.count, 1);
  assert.deepEqual(bars.filter((b) => b.current).map((b) => b.start), ["2026-11-02"]);
  assert.deepEqual(weeklyCounts([], { start: "2026-11-30", end: "2026-11-01" }, "2026-11-04"), []);
});

test("avancement d'une campagne borné entre 0 et 1", () => {
  const c = { startDate: "2026-11-01", durationDays: 10 };
  assert.equal(campaignProgress(c, "2026-10-20"), 0);
  assert.equal(campaignProgress(c, "2026-11-06"), 0.5);
  assert.equal(campaignProgress(c, "2026-12-01"), 1);
  assert.equal(campaignProgress({ ...c, durationDays: 0 }, "2026-11-06"), 0);
});

test("statut des objectifs selon l'échéance", () => {
  assert.equal(objectiveStatus("2026-10-01", "2026-11-01"), "echu");
  assert.equal(objectiveStatus("2026-11-20", "2026-11-01"), "proche");
  assert.equal(objectiveStatus("2027-03-01", "2026-11-01"), "en_cours");
});

test("grille du mois: semaines complètes, publications comptées, aujourd'hui marqué", () => {
  const g = monthGrid("2026-11-17", ["2026-11-17", "2026-11-17", "2026-11-03"]);
  assert.equal(g.title, "Novembre 2026");
  assert.equal(g.days.length % 7, 0);
  assert.equal(g.days[0].day, "2026-10-26");
  assert.equal(g.days.find((d) => d.today)!.count, 2);
  assert.equal(g.days.filter((d) => d.inMonth).length, 30);
});
