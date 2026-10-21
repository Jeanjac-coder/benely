import { z } from "zod";

export const SIZES = { solo: "Entrepreneur individuel", startup: "Startup", pme: "PME", grande: "Grande entreprise", agence: "Agence" } as const;
export const MARKETS = { b2c: "Particuliers (B2C)", b2b: "Entreprises (B2B)", b2b2c: "Mixte" } as const;

export const ProfileSchema = z.object({
  name: z.string().trim().min(1, "Nom requis"),
  country: z.string().min(2),
  zones: z.array(z.string()),
  sector: z.string().trim().min(1, "Secteur requis"),
  products: z.string().trim().min(1, "Produits ou services requis"),
  size: z.enum(Object.keys(SIZES) as [keyof typeof SIZES, ...(keyof typeof SIZES)[]]),
  market: z.enum(Object.keys(MARKETS) as [keyof typeof MARKETS, ...(keyof typeof MARKETS)[]]),
  clientele: z.string().trim().min(1, "Clientèle requise"),
  competitors: z.string(),
  channels: z.array(z.string()),
  salesChannels: z.array(z.string()),
  objectives: z.string().trim().min(1, "Objectifs requis"),
  monthlyBudget: z.number().positive("Budget mensuel requis"),
  currency: z.string().min(3),
  teamSize: z.number().int().nonnegative(),
  resources: z.string(),
  languages: z.array(z.string()),
});

export type Profile = z.infer<typeof ProfileSchema>;

export const EMPTY_PROFILE: Profile = {
  name: "", country: "CI", zones: [], sector: "", products: "", size: "pme", market: "b2c",
  clientele: "", competitors: "", channels: [], salesChannels: [], objectives: "",
  monthlyBudget: 0, currency: "XOF", teamSize: 0, resources: "", languages: ["Français"],
};

/** Fusionne des données partielles (ex. JSON stocké) avec les valeurs par défaut. */
export function withDefaults(data: unknown): Profile {
  return { ...EMPTY_PROFILE, ...(data && typeof data === "object" ? (data as Partial<Profile>) : {}) };
}
