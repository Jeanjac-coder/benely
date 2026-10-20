// Contexte marché par pays, injecté dans le prompt pour ancrer la stratégie.
export interface CountryContext {
  languages: string[];
  payments: string;
  channels: string;
  notes: string;
}

export const COUNTRIES: Record<string, CountryContext> = {
  "Côte d'Ivoire": {
    languages: ["Français", "Nouchi", "Dioula"],
    payments: "Orange Money, MTN MoMo, Wave",
    channels: "WhatsApp, Facebook, TikTok, radio, affichage Abidjan",
    notes: "Abidjan concentre l'essentiel du pouvoir d'achat; forte pénétration mobile money.",
  },
  Sénégal: {
    languages: ["Français", "Wolof"],
    payments: "Wave, Orange Money, Free Money",
    channels: "WhatsApp, Facebook, TikTok, Instagram, influenceurs locaux",
    notes: "Wave domine les paiements; contenu en wolof très performant à l'oral.",
  },
  Nigeria: {
    languages: ["Anglais", "Pidgin", "Yoruba", "Igbo", "Hausa"],
    payments: "Paystack, Flutterwave, virements bancaires, OPay",
    channels: "Instagram, X, WhatsApp, TikTok, YouTube",
    notes: "Marché très concurrentiel; sensibilité forte au prix et à la preuve sociale.",
  },
  Kenya: {
    languages: ["Anglais", "Swahili"],
    payments: "M-Pesa",
    channels: "WhatsApp, Facebook, X, TikTok, Instagram",
    notes: "M-Pesa est le standard; USSD et SMS restent efficaces hors Nairobi.",
  },
  Ghana: {
    languages: ["Anglais", "Twi"],
    payments: "MTN MoMo, Vodafone Cash",
    channels: "WhatsApp, Instagram, Facebook, radio",
    notes: "Forte culture radio et bouche-à-oreille; WhatsApp Business central.",
  },
  Cameroun: {
    languages: ["Français", "Anglais", "Pidgin"],
    payments: "MTN MoMo, Orange Money",
    channels: "Facebook, WhatsApp, TikTok, radio",
    notes: "Bilinguisme à gérer; Douala et Yaoundé sont les pôles principaux.",
  },
  Maroc: {
    languages: ["Français", "Arabe", "Darija"],
    payments: "Carte bancaire, CMI, cash on delivery",
    channels: "Instagram, Facebook, TikTok, YouTube, Google",
    notes: "Paiement à la livraison très répandu; Darija en contenu social.",
  },
  Autre: {
    languages: [],
    payments: "À préciser",
    channels: "WhatsApp, Facebook, TikTok",
    notes: "Pays non listé: adapter selon les informations fournies.",
  },
};
