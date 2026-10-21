// Méthodologie Benely (table methodology_documents): référence principale de l'audit et des stratégies.

/** Les dix étapes de la méthodologie, dans l'ordre: elles forment la grille d'audit systématique. */
export const METHODOLOGY_STEPS = [
  "diagnostic_audit",
  "objectifs",
  "cible",
  "positionnement",
  "choix_strategiques",
  "plan_action",
  "budget_ressources",
  "mise_en_oeuvre",
  "mesure_kpis",
  "optimisation",
] as const;
export type MethodologyStep = (typeof METHODOLOGY_STEPS)[number];

export const METHODOLOGY_STEP_LABELS: Record<MethodologyStep, string> = {
  diagnostic_audit: "1. Diagnostic et audit",
  objectifs: "2. Définition des objectifs",
  cible: "3. Connaissance de la cible",
  positionnement: "4. Positionnement et plateforme de marque",
  choix_strategiques: "5. Choix stratégiques",
  plan_action: "6. Plan d'action opérationnel",
  budget_ressources: "7. Budget et ressources",
  mise_en_oeuvre: "8. Mise en œuvre",
  mesure_kpis: "9. Mesure et KPIs",
  optimisation: "10. Optimisation continue",
};

export const AUDIT_STATUSES = ["conforme", "partiel", "absent", "inconnu"] as const;
export const AUDIT_STATUS_LABELS: Record<(typeof AUDIT_STATUSES)[number], string> = {
  conforme: "Conforme", partiel: "Partiel", absent: "Absent", inconnu: "Inconnu",
};

export const PESTEL_FACTORS = ["politique", "economique", "social", "technologique", "ecologique", "legal"] as const;
export const FUNNEL_STAGES = ["notoriete", "acquisition", "conversion", "fidelisation", "non_precise"] as const;
export const CHANNEL_CATEGORIES = ["owned", "earned", "paid", "non_precise"] as const;

/** Version de la méthodologie figée dans une génération (stockée avec l'entrée du job). */
export interface Methodology {
  version: number;
  title: string;
  content: string;
}

export const PESTEL_LABELS: Record<(typeof PESTEL_FACTORS)[number], string> = {
  politique: "Politique", economique: "Économique", social: "Social", technologique: "Technologique", ecologique: "Écologique", legal: "Légal",
};
export const FUNNEL_LABELS: Record<(typeof FUNNEL_STAGES)[number], string> = {
  notoriete: "Notoriété", acquisition: "Acquisition", conversion: "Conversion", fidelisation: "Fidélisation", non_precise: "Non précisée",
};
export const CHANNEL_CATEGORY_LABELS: Record<(typeof CHANNEL_CATEGORIES)[number], string> = {
  owned: "Owned (possédé)", earned: "Earned (gagné)", paid: "Paid (payant)", non_precise: "Non précisée",
};
