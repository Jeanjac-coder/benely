import { test } from "node:test";
import assert from "node:assert/strict";
import { EMPTY_PROFILE, type Profile } from "../lib/profile.ts";
import { buildSummary, followUps, missingData } from "../lib/questionnaire.ts";

const profile: Profile = {
  ...EMPTY_PROFILE,
  name: "Kôkô Jus", sector: "Boissons", products: "Jus de fruits locaux", market: "b2c",
  clientele: "Jeunes actifs d'Abidjan", objectives: "Augmenter les ventes de 30 %",
  monthlyBudget: 150_000, salesChannels: ["WhatsApp", "Boutique"], zones: ["Grand Abidjan"], teamSize: 1,
};

test("les questions complémentaires dépendent des réponses", () => {
  const ids = followUps(profile).map((q) => q.id);
  assert.ok(ids.includes("b2c_panier") && ids.includes("vente_paiement") && ids.includes("pdv"));
  assert.ok(ids.includes("alternatives"), "pas de concurrent: on demande les alternatives");
  assert.ok(!ids.includes("b2b_cycle"));
  const b2b = followUps({ ...profile, market: "b2b", competitors: "X", salesChannels: [] }).map((q) => q.id);
  assert.ok(b2b.includes("b2b_cycle") && !b2b.includes("b2c_panier") && !b2b.includes("alternatives"));
});

test("les données manquantes disparaissent une fois renseignées", () => {
  const before = missingData(profile, {});
  assert.ok(before.includes("Concurrents ou alternatives"));
  const after = missingData(profile, { alternatives: "Vendeuses de rue" });
  assert.ok(!after.includes("Concurrents ou alternatives"));
});

test("la synthèse reprend le profil, le budget en FCFA et les précisions", () => {
  const s = buildSummary(profile, { b2c_panier: "1 500 FCFA" });
  assert.match(s, /Kôkô Jus/);
  assert.match(s, /Côte d'Ivoire/);
  assert.match(s, /150\s000 FCFA/);
  assert.match(s, /1 500 FCFA/);
});
