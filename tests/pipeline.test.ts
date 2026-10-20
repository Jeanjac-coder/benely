import { test } from "node:test";
import assert from "node:assert/strict";
import { checkCoherence } from "../lib/ai/coherence.ts";
import { AiError } from "../lib/ai/client.ts";
import { assemble, nextStep, runStep, type JobOutputs } from "../lib/ai/pipeline.ts";
import type { JobInput } from "../lib/ai/prompts.ts";
import { STEPS, type Step } from "../lib/ai/schemas.ts";
import { EMPTY_PROFILE } from "../lib/profile.ts";
import { sample } from "./fixtures.ts";

const input: JobInput = {
  profile: { ...EMPTY_PROFILE, name: "Kôkô Jus", sector: "Boissons", products: "Jus", clientele: "Jeunes", objectives: "Ventes", monthlyBudget: 200_000 },
  answers: {},
  summary: "Kôkô Jus vend des jus locaux à Abidjan.",
  period: { start: "2026-11-01", end: "2026-11-30" },
};

test("enchaîne les six étapes, chacune recevant les livrables précédents, puis assemble", async () => {
  const fixture = sample();
  fixture.media.channels[0].budgetShare = 3; // le modèle renvoie des parts non normalisées
  fixture.media.channels[1].budgetShare = 2;
  const seen: { step: Step; instruction: string }[] = [];
  const fake = (async (_schema: unknown, _system: string, _context: string, instruction: string) => {
    const step = STEPS[seen.length];
    seen.push({ step, instruction });
    return { data: fixture[step], usage: { model: "fake", inputTokens: 1, outputTokens: 1 } };
  }) as Parameters<typeof runStep>[3];

  let outputs: JobOutputs = {};
  for (let step = nextStep(outputs); step; step = nextStep(outputs)) outputs = (await runStep(step, input, outputs, fake)).outputs;

  assert.deepEqual(seen.map((s) => s.step), [...STEPS]);
  assert.match(seen[2].instruction, /Livrable déjà produit: market/);
  assert.match(seen[5].instruction, /Livrable déjà produit: media/);
  const d = assemble(input, outputs);
  assert.deepEqual(d.media.channels.map((c) => c.budgetShare), [0.6, 0.4]);
  assert.equal(d.meta.monthlyBudget, 200_000);
  assert.deepEqual(checkCoherence(d).filter((i) => i.severity === "error"), []);
});

test("T13: une étape en échec laisse les précédentes intactes et se relance", async () => {
  const fixture = sample();
  const failing = (async () => { throw new AiError("Le service IA est momentanément saturé.", true); }) as Parameters<typeof runStep>[3];
  const ok = (async () => ({ data: fixture.market, usage: { model: "fake", inputTokens: 1, outputTokens: 1 } })) as Parameters<typeof runStep>[3];
  const outputs: JobOutputs = { diagnostic: fixture.diagnostic };
  await assert.rejects(runStep("market", input, outputs, failing), (e: AiError) => e.retryable && /saturé/.test(e.message));
  assert.equal(nextStep(outputs), "market");
  const r = await runStep("market", input, outputs, ok);
  assert.equal(nextStep(r.outputs), "strategy");
});

test("assemble refuse une génération incomplète", () => {
  assert.throws(() => assemble(input, { diagnostic: sample().diagnostic }), /Étape manquante: market/);
});
