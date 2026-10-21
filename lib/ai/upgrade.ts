import type { Deliverables } from "./schemas.ts";

type Loose = Record<string, unknown>;
const obj = (v: unknown): Loose => (typeof v === "object" && v !== null && !Array.isArray(v) ? (v as Loose) : {});
const arr = (v: unknown): Loose[] => (Array.isArray(v) ? v.map(obj) : []);

/**
 * Complète une stratégie enregistrée avant l'arrivée de la méthodologie Benely avec les champs
 * ajoutés depuis (valeurs vides ou « non précisé »): elle reste lisible, modifiable et exportable.
 * Les valeurs existantes ne sont jamais modifiées.
 */
export function upgradeDeliverables(raw: unknown): Deliverables {
  const d = obj(raw);
  const diagnostic = obj(d.diagnostic), strategy = obj(d.strategy), branding = obj(d.branding), media = obj(d.media);
  return {
    ...d,
    diagnostic: {
      internalAudit: { offer: "", resources: "", performance: "", brandIdentity: "" },
      pestel: [],
      methodologyAudit: [],
      ...diagnostic,
    },
    strategy: {
      insights: [],
      ...strategy,
      smartObjectives: arr(strategy.smartObjectives).map((o) => ({ funnelStage: "non_precise", ...o })),
      personas: arr(strategy.personas).map((p) => ({ trigger: "", quote: "", ...p })),
    },
    branding: { positioningStatement: "", bigIdea: "", ...branding },
    media: {
      budgetLogic: "",
      trackingChecklist: [],
      ...media,
      channels: arr(media.channels).map((c) => ({ category: "non_precise", ...c })),
    },
  } as unknown as Deliverables;
}
