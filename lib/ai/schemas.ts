import { z } from "zod";

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
  strengths: z.array(z.string()),
  weaknesses: z.array(z.string()),
  keyChallenges: z.array(z.string()),
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
  })),
  positioning: z.string(),
  marketingStrategy: z.string(),
  digitalStrategy: z.string(),
  communicationStrategy: z.string(),
  actionPlan: z.array(z.object({ period: z.string(), actions: z.array(z.string()), owner: z.string(), kpi: z.string() })),
});

export const BrandingSchema = z.object({
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
}

export type Deliverables = StepOutputs & { meta: Meta };

export const DeliverablesSchema = z.object({
  ...STEP_SCHEMAS,
  meta: z.object({
    monthlyBudget: z.number().positive(),
    currency: z.string(),
    period: z.object({ start: z.string(), end: z.string() }),
    sources: z.array(SourceSchema),
  }),
});
