// Configuration par pays: injectée dans les prompts et utilisée pour les valeurs par défaut.
export interface CountryContext {
  name: string;
  currency: string;
  languages: string[];
  zones: string[];
  payments: string;
  channels: string;
  notes: string;
}

export const COUNTRIES: Record<string, CountryContext> = {
  CI: {
    name: "Côte d'Ivoire", currency: "XOF",
    languages: ["Français", "Nouchi", "Dioula", "Baoulé"],
    zones: ["Grand Abidjan", "Bouaké", "Yamoussoukro", "San-Pédro", "Korhogo", "Daloa", "National"],
    payments: "Orange Money, MTN MoMo, Moov Money, Wave, cartes bancaires",
    channels: "WhatsApp Business, Facebook, TikTok, Instagram, LinkedIn (B2B), radio, affichage urbain",
    notes: "Marché pilote. Abidjan concentre l'essentiel du pouvoir d'achat; forte adoption du mobile money; le nouchi fonctionne bien en contenu social grand public.",
  },
  SN: {
    name: "Sénégal", currency: "XOF",
    languages: ["Français", "Wolof"],
    zones: ["Dakar", "Thiès", "Saint-Louis", "Touba", "National"],
    payments: "Wave, Orange Money, Free Money",
    channels: "WhatsApp, Facebook, TikTok, Instagram, radio, influenceurs locaux",
    notes: "Wave domine les paiements; le wolof est très performant en audio et vidéo.",
  },
  CM: {
    name: "Cameroun", currency: "XAF",
    languages: ["Français", "Anglais", "Pidgin"],
    zones: ["Douala", "Yaoundé", "Bafoussam", "National"],
    payments: "MTN MoMo, Orange Money",
    channels: "Facebook, WhatsApp, TikTok, radio",
    notes: "Bilinguisme à gérer selon les régions; Douala et Yaoundé sont les pôles principaux.",
  },
  BF: {
    name: "Burkina Faso", currency: "XOF",
    languages: ["Français", "Mooré", "Dioula"],
    zones: ["Ouagadougou", "Bobo-Dioulasso", "National"],
    payments: "Orange Money, Moov Money",
    channels: "Facebook, WhatsApp, radio",
    notes: "Radio très influente; budgets marketing généralement contraints.",
  },
  ML: {
    name: "Mali", currency: "XOF",
    languages: ["Français", "Bambara"],
    zones: ["Bamako", "Sikasso", "National"],
    payments: "Orange Money, Moov Money",
    channels: "Facebook, WhatsApp, TikTok, radio",
    notes: "Le bambara est la langue véhiculaire; contenu audio et vidéo privilégié.",
  },
  BJ: {
    name: "Bénin", currency: "XOF",
    languages: ["Français", "Fon", "Yoruba"],
    zones: ["Cotonou", "Porto-Novo", "Parakou", "National"],
    payments: "MTN MoMo, Moov Money, Celtiis Cash",
    channels: "Facebook, WhatsApp, TikTok",
    notes: "Cotonou concentre l'activité commerciale.",
  },
  TG: {
    name: "Togo", currency: "XOF",
    languages: ["Français", "Éwé", "Kabiyè"],
    zones: ["Lomé", "Kara", "National"],
    payments: "T-Money, Flooz",
    channels: "Facebook, WhatsApp, TikTok",
    notes: "Lomé concentre l'activité commerciale.",
  },
};

export const DEFAULT_COUNTRY = "CI";

export function countryContext(code: string): CountryContext {
  return COUNTRIES[code] ?? COUNTRIES[DEFAULT_COUNTRY];
}
