import { normalizeShares } from "../budget.ts";
import { countryContext } from "../africa.ts";
import { generateStructured, type Usage } from "./client.ts";
import { buildContext, instruction, SYSTEM, type JobInput } from "./prompts.ts";
import { RESEARCH_ENABLED, webResearch } from "./research.ts";
import { STEP_SCHEMAS, STEPS, type Deliverables, type Source, type Step, type StepOutputs } from "./schemas.ts";

/** Sorties accumulées d'une génération; `_sources` regroupe les sources web consultées. */
export type JobOutputs = Partial<StepOutputs> & { _sources?: Source[] };

export function nextStep(outputs: JobOutputs): Step | null {
  return STEPS.find((s) => !outputs[s]) ?? null;
}

/** Exécute une étape: recherche externe éventuelle, génération structurée, post-traitement. */
export async function runStep(step: Step, input: JobInput, outputs: JobOutputs, generate: typeof generateStructured = generateStructured): Promise<{ outputs: JobOutputs; usage: Usage[] }> {
  const usage: Usage[] = [];
  let research: string | undefined;
  let sources = outputs._sources ?? [];
  if (step === "market" && RESEARCH_ENABLED) {
    const p = input.profile;
    const r = await webResearch(`${p.sector} — ${p.products} — ${countryContext(p.country).name} (${p.zones.join(", ") || "national"}). Concurrents cités: ${p.competitors || "aucun"}.`);
    research = r.notes;
    sources = r.sources;
    usage.push(r.usage);
  }
  const { data, usage: u } = await generate(STEP_SCHEMAS[step], SYSTEM, buildContext(input), instruction(step, input, outputs, research));
  usage.push(u);
  const output = step === "media" ? { ...data, channels: normalizeShares((data as StepOutputs["media"]).channels) } : data;
  return { outputs: { ...outputs, [step]: output, _sources: sources }, usage };
}

export function assemble(input: JobInput, outputs: JobOutputs): Deliverables {
  for (const s of STEPS) if (!outputs[s]) throw new Error(`Étape manquante: ${s}`);
  const { _sources, ...steps } = outputs;
  return {
    ...(steps as StepOutputs),
    meta: { monthlyBudget: input.profile.monthlyBudget, currency: input.profile.currency, period: input.period, sources: _sources ?? [] },
  };
}
