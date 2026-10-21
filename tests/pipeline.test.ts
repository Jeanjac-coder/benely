import { test } from "node:test";
import assert from "node:assert/strict";
import { checkCoherence } from "../lib/ai/coherence.ts";
import { AiError } from "../lib/ai/client.ts";
import { AGENTS } from "../lib/ai/agents.generated.ts";
import { STEP_AGENTS, stepExperts } from "../lib/ai/expertise.ts";
import { assemble, nextStep, runStep, type JobOutputs } from "../lib/ai/pipeline.ts";
import { buildContext, instruction, SYSTEM, type JobInput } from "../lib/ai/prompts.ts";
import { METHODOLOGY_STEP_LABELS, METHODOLOGY_STEPS } from "../lib/methodology.ts";
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
  // Chaque étape reçoit la méthode de ses experts, puis la consigne en dernier.
  assert.match(seen[3].instruction, /### Brand Guardian/);
  assert.match(seen[4].instruction, /### Ad Creative Strategist/);
  assert.match(seen[5].instruction, /### Content Creator/);
  for (const s of seen) assert.ok(s.instruction.indexOf("## Consigne") > s.instruction.indexOf("## Méthode des experts"));
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

test("experts: chaque étape mobilise des fiches existantes et non vides", () => {
  for (const step of STEPS) {
    assert.ok(STEP_AGENTS[step].length >= 2, step);
    for (const id of STEP_AGENTS[step]) assert.ok(AGENTS[id].text.length > 500, id);
    assert.equal(stepExperts(step).length, STEP_AGENTS[step].length);
  }
  // Les gabarits de code et l'outillage sont écartés du texte injecté.
  for (const a of Object.values(AGENTS)) assert.doesNotMatch(a.text, /```/);
});

test("méthodologie: le document actif est injecté dans le contexte et l'audit couvre les 10 étapes", async () => {
  const withDoc: JobInput = { ...input, methodology: { version: 3, title: "Méthode", content: "## 1. Diagnostic et audit\\nRègle maison." } };
  const ctx = buildContext(withDoc);
  assert.match(ctx, /Méthodologie Benely \(référence principale, version 3/);
  assert.match(ctx, /Règle maison/);
  assert.doesNotMatch(buildContext(input), /Méthodologie Benely/);
  assert.match(SYSTEM, /référence principale/);
  const audit = instruction("diagnostic", withDoc, {});
  for (const s of METHODOLOGY_STEPS) assert.ok(audit.includes(METHODOLOGY_STEP_LABELS[s]), s);
  // La version utilisée est enregistrée avec la stratégie.
  const fixture = sample();
  let outputs: JobOutputs = {};
  const fake = (async (_s: unknown, _sys: string, _c: string, ask: string) => {
    const step = STEPS.find((x) => !outputs[x])!;
    assert.ok(ask.includes("## Consigne"));
    return { data: fixture[step], usage: { model: "fake", inputTokens: 1, outputTokens: 1 } };
  }) as Parameters<typeof runStep>[3];
  for (let step = nextStep(outputs); step; step = nextStep(outputs)) outputs = (await runStep(step, withDoc, outputs, fake)).outputs;
  assert.equal(assemble(withDoc, outputs).meta.methodologyVersion, 3);
});
