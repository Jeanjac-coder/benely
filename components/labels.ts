import { AUDIT_STATUS_LABELS, AUDIT_STATUSES, CHANNEL_CATEGORIES, CHANNEL_CATEGORY_LABELS, FUNNEL_LABELS, FUNNEL_STAGES, METHODOLOGY_STEP_LABELS, METHODOLOGY_STEPS, PESTEL_FACTORS, PESTEL_LABELS } from "@/lib/methodology";

// Libellés français des clés des livrables, utilisés par l'affichage et l'éditeur génériques.
export const LABELS: Record<string, string> = {
  diagnostic: "Audit marketing", market: "Étude de marché", strategy: "Stratégie", branding: "Plateforme de marque", media: "Plan média et campagnes", content: "Contenu et calendrier",
  summary: "Synthèse", maturity: "Maturité marketing", strengths: "Forces", weaknesses: "Faiblesses", keyChallenges: "Enjeux clés", missingData: "Données manquantes", assumptions: "Hypothèses",
  overview: "Vue d'ensemble", marketSize: "Taille du marché", trends: "Tendances", consumerBehavior: "Comportements des consommateurs", competitors: "Concurrents", swot: "SWOT",
  opportunities: "Opportunités", threats: "Menaces", statement: "Affirmation", nature: "Nature", source: "Source", sourceDate: "Date de la source",
  name: "Nom", positioning: "Positionnement", smartObjectives: "Objectifs SMART", objective: "Objectif", metric: "Indicateur", target: "Cible", unit: "Unité", deadline: "Échéance", rationale: "Justification",
  segments: "Segments", description: "Description", priority: "Priorité", personas: "Personas", age: "Âge", occupation: "Activité", needs: "Besoins", frictions: "Freins", channels: "Canaux", languages: "Langues",
  marketingStrategy: "Stratégie marketing", digitalStrategy: "Stratégie digitale", communicationStrategy: "Stratégie de communication", actionPlan: "Plan d'action", period: "Période", actions: "Actions", owner: "Responsable", kpi: "KPI",
  promise: "Promesse", mission: "Mission", vision: "Vision", values: "Valeurs", personality: "Personnalité", tone: "Ton", keyMessages: "Messages clés", audience: "Audience", message: "Message", taglines: "Signatures", dos: "À faire", donts: "À éviter",
  channel: "Canal", budgetShare: "Part du budget", role: "Rôle", monthlyTarget: "Objectif mensuel", campaigns: "Campagnes", creatives: "Créations recommandées", startDate: "Début", durationDays: "Durée (jours)", budget: "Budget", kpis: "KPI estimés", estimate: "Estimation",
  funnel: "Tunnel de conversion", stage: "Étape", forecastDisclaimer: "Avertissement", pillars: "Piliers éditoriaux", share: "Part", entries: "Calendrier éditorial",
  internalAudit: "Audit interne", offer: "Offre", resources: "Ressources", performance: "Performance historique", brandIdentity: "Identité de marque",
  pestel: "Analyse PESTEL", factor: "Facteur", finding: "Constat", impact: "Impact", methodologyAudit: "Grille d'audit (méthodologie Benely)", status: "Statut", recommendation: "Recommandation",
  funnelStage: "Étape du parcours client", trigger: "Déclencheur d'achat", quote: "Citation type", insights: "Insights consommateurs",
  positioningStatement: "Positionnement", bigIdea: "Big idea", category: "Type de canal", budgetLogic: "Logique budgétaire", trackingChecklist: "Check-list de tracking",
  date: "Date", platform: "Plateforme", theme: "Thème", format: "Format", text: "Texte", cta: "Appel à l'action",
};

export const ENUMS: Record<string, string[]> = {
  nature: ["fait", "estimation", "hypothese"],
  maturity: ["debutant", "intermediaire", "avance"],
  priority: ["principale", "secondaire"],
  step: [...METHODOLOGY_STEPS],
  status: [...AUDIT_STATUSES],
  factor: [...PESTEL_FACTORS],
  funnelStage: [...FUNNEL_STAGES],
  category: [...CHANNEL_CATEGORIES],
};

export const NATURE_LABEL: Record<string, string> = { fait: "Fait", estimation: "Estimation", hypothese: "Hypothèse" };

/** Libellés des valeurs d'énumération (sélecteurs de l'éditeur et affichage). */
export const OPTION_LABELS: Record<string, string> = {
  ...NATURE_LABEL, debutant: "Débutant", intermediaire: "Intermédiaire", avance: "Avancé", principale: "Principale", secondaire: "Secondaire",
  ...METHODOLOGY_STEP_LABELS, ...AUDIT_STATUS_LABELS, ...PESTEL_LABELS, ...FUNNEL_LABELS, ...CHANNEL_CATEGORY_LABELS,
};

export const label = (k: string) => LABELS[k] ?? k;
