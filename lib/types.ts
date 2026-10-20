export type CompanySize = "startup" | "pme" | "grande";

export interface CompanyProfile {
  name: string;
  sector: string;
  country: string;
  size: CompanySize;
  offer: string;
  objective: string;
  monthlyBudget: number; // USD
  channelsInUse: string[];
  languages: string[];
  competitors: string;
}

export interface ChannelPlan {
  channel: string;
  budgetShare: number; // 0..1, sums to 1
  role: string;
  targetKpi: string;
  targetValue: number; // monthly leads/conversions expected from this channel
}

export interface Persona {
  name: string;
  description: string;
  needs: string;
  channels: string[];
}

export interface Strategy {
  marketStudy: string;
  swot: { strengths: string[]; weaknesses: string[]; opportunities: string[]; threats: string[] };
  competitors: { name: string; positioning: string; weakness: string }[];
  personas: Persona[];
  segmentation: string;
  positioning: string;
  brand: { promise: string; tone: string; values: string[] };
  channels: ChannelPlan[];
  contentStrategy: string;
  editorialCalendar: { week: number; theme: string; formats: string[] }[];
  funnel: { stage: string; action: string; kpi: string }[];
  kpis: { name: string; target: number; unit: string }[];
  executionPlan: { period: string; actions: string[] }[];
}

export interface ChannelActual {
  channel: string;
  spend: number;
  conversions: number;
}
