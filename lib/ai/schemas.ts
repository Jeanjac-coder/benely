import { z } from "zod";
import { CHANNEL_CATEGORIES, FUNNEL_STAGES, METHODOLOGY_STEPS, PESTEL_FACTORS, AUDIT_STATUSES } from "../methodology.ts";

// Pas de min/max numériques dans ces schémas: ils servent de format de sortie structurée.
// Les bornes sont contrôlées après coup par lib/ai/coherence.ts.

const Nature = z.enum(["fait", "estimation", "hypothese"]).describe("fait = vérifiable et sourcé; estimation = ordre de grandeur raisonné; hypothese = supposition à valider");
export const Claim = z.object({
  statement: z.string(),
  nature: Nature,
  source: z.string().nullable().describe("Titre ou URL de la source, null si aucune"),
  sourceDate: z.string().nullable().describe("Date de la source (AAAA-MM ou AAAA-MM-JJ), null si inconnue"),
});
export type Claim = z.infer<typeof Claim>;

export const DiagnosticSchema = z.object({
  summary: z.string(),
  maturity: z.enum(["debutant", "intermediaire", "avance"]),
  internalAudit: z.object({
    offer: z.string().describe("Gamme, positionnement prix, qualité perçue, stade du cycle de vie"),
    resources: z.string().describe("Budget, équipe et compétences marketing, outils en place"),
    performance: z.string().describe("Ventes 12-24 mois, sources d'acquisition, conversion par canal, ROI passé (ou données manquantes)"),
    brandIdentity: z.string().describe("Cohérence visuelle et verbale, notoriété, image perçue vs souhaitée"),
  }),
  pestel: z.array(z.object({
    factor: z.enum(PESTEL_FACTORS),
    finding: z.string(),
    impact: z.string(),
  })).describe("Exactement un élément par facteur PESTEL (6)"),
  strengths: z.array(z.string()),
  weaknesses: z.array(z.string()),
  keyChallenges: z.array(z.string()).describe("3 à 5 enjeux prioritaires, hiérarchisés du plus au moins important"),
  methodologyAudit: z.array(z.object({
    step: z.enum(METHODOLOGY_STEPS),
    status: z.enum(AUDIT_STATUSES).describe("Situation actuelle de l'entreprise sur cette étape de la méthodologie"),
    finding: z.string(),
    recommendation: z.string(),
  })).describe("Grille d'audit: exactement une ligne par étape de la méthodologie (10), dans l'ordre"),
  missingData: z.array(z.string()),
  assumptions: z.array(z.string()),
});

export const MarketSchema = z.object({
  overview: z.string(),
  marketSize: Claim,
  trends: z.array(Claim),
  consumerBehavior: z.array(Claim),
  competitors: z.array(z.object({
    name: z.string(),
    positioning: z.string(),
    strengths: z.array(z.string()),
    weaknesses: z.array(z.string()),
    nature: Nature,
  })),
  swot: z.object({
    strengths: z.array(z.string()),
    weaknesses: z.array(z.string()),
    opportunities: z.array(z.string()),
    threats: z.array(z.string()),
  }),
});

export const StrategySchema = z.object({
  smartObjectives: z.array(z.object({
    objective: z.string(),
    metric: z.string(),
    target: z.number(),
    unit: z.string(),
    deadline: z.string().describe("AAAA-MM-JJ"),
    rationale: z.string(),
    funnelStage: z.enum(FUNNEL_STAGES).describe("Étape du parcours client (modèle RACE) visée par l'objectif"),
  })),
  segments: z.array(z.object({ name: z.string(), description: z.string(), priority: z.enum(["principale", "secondaire"]) })),
  personas: z.array(z.object({
    name: z.string(),
    age: z.string(),
    occupation: z.string(),
    description: z.string(),
    needs: z.array(z.string()),
    frictions: z.array(z.string()),
    channels: z.array(z.string()),
    languages: z.array(z.string()),
    trigger: z.string().describe("Déclencheur d'achat"),
    quote: z.string().describe("Citation type résumant sa frustration ou son attente"),
  })),
  insights: z.array(z.string()).describe("1 à 2 insights consommateurs: vérités humaines non évidentes, pas de simples observations"),
  positioning: z.string(),
  marketingStrategy: z.string(),
  digitalStrategy: z.string(),
  communicationStrategy: z.string(),
  actionPlan: z.array(z.object({ period: z.string(), actions: z.array(z.string()), owner: z.string(), kpi: z.string() })),
});

export const BrandingSchema = z.object({
  positioningStatement: z.string().describe("« Pour [cible], [marque] est la [catégorie] qui [bénéfice différenciant], parce que [preuve]. »"),
  bigIdea: z.string().describe("Idée directrice déclinable sur tous les canaux, pas un simple slogan"),
  promise: z.string(),
  mission: z.string(),
  vision: z.string(),
  values: z.array(z.string()),
  personality: z.array(z.string()),
  tone: z.string(),
  keyMessages: z.array(z.object({ audience: z.string(), message: z.string() })),
  taglines: z.array(z.string()),
  dos: z.array(z.string()),
  donts: z.array(z.string()),
});

export const MediaSchema = z.object({
  channels: z.array(z.object({
    channel: z.string(),
    budgetShare: z.number().describe("Part du budget mensuel, entre 0 et 1; la somme vaut 1"),
    category: z.enum(CHANNEL_CATEGORIES).describe("owned, earned ou paid"),
    role: z.string(),
    kpi: z.string(),
    monthlyTarget: z.number().describe("Valeur mensuelle visée pour le KPI (estimation)"),
  })),
  campaigns: z.array(z.object({
    name: z.string(),
    objective: z.string(),
    target: z.string(),
    channels: z.array(z.string()),
    message: z.string(),
    creatives: z.array(z.string()),
    startDate: z.string().describe("AAAA-MM-JJ"),
    durationDays: z.number(),
    budget: z.number().describe("Budget total de la campagne dans la devise de l'entreprise"),
    kpis: z.array(z.object({ name: z.string(), estimate: z.number(), unit: z.string() })),
  })),
  funnel: z.array(z.object({ stage: z.string(), actions: z.array(z.string()), kpi: z.string() })),
  budgetLogic: z.string().describe("Arbitrage notoriété/performance (60/40 ou 70/30 justifié), part test-and-learn (10 à 15 %), ROI prévisionnel"),
  trackingChecklist: z.array(z.string()).describe("Éléments de suivi à installer et tester avant le lancement"),
  forecastDisclaimer: z.string(),
});

export const ContentSchema = z.object({
  pillars: z.array(z.object({ name: z.string(), description: z.string(), share: z.number() })),
  entries: z.array(z.object({
    date: z.string().describe("AAAA-MM-JJ"),
    platform: z.string(),
    objective: z.string(),
    theme: z.string(),
    format: z.string(),
    text: z.string(),
    cta: z.string(),
    kpi: z.string(),
  })),
});

export const STEPS = ["diagnostic", "market", "strategy", "branding", "media", "content"] as const;
export type Step = (typeof STEPS)[number];

export const STEP_LABELS: Record<Step, string> = {
  diagnostic: "Audit marketing",
  market: "Étude de marché et concurrence",
  strategy: "Stratégie et objectifs",
  branding: "Plateforme de marque",
  media: "Plan média et campagnes",
  content: "Stratégie de contenu et calendrier",
};

export const STEP_SCHEMAS = {
  diagnostic: DiagnosticSchema,
  market: MarketSchema,
  strategy: StrategySchema,
  branding: BrandingSchema,
  media: MediaSchema,
  content: ContentSchema,
} satisfies Record<Step, z.ZodType>;

export type StepOutputs = { [K in Step]: z.infer<(typeof STEP_SCHEMAS)[K]> };

export const SourceSchema = z.object({ title: z.string(), url: z.string(), date: z.string().nullable() });
export type Source = z.infer<typeof SourceSchema>;

export interface Period { start: string; end: string }

/** Métadonnées non générées par l'IA, saisies ou calculées par la plateforme. */
export interface Meta {
  monthlyBudget: number;
  currency: string;
  period: Period;
  sources: Source[];
  /** Version de la méthodologie Benely appliquée (absente pour les stratégies antérieures). */
  methodologyVersion?: number | null;
}

export type Deliverables = StepOutputs & { meta: Meta };

export const DeliverablesSchema = z.object({
  ...STEP_SCHEMAS,
  meta: z.object({
    monthlyBudget: z.number().positive(),
    currency: z.string(),
    period: z.object({ start: z.string(), end: z.string() }),
    sources: z.array(SourceSchema),
    methodologyVersion: z.number().nullable().optional(),
  }),
});
