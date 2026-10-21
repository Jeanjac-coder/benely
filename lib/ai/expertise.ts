import { AGENTS, type AgentId } from "./agents.generated.ts";
import type { Step } from "./schemas.ts";

/**
 * Experts mobilisés à chaque étape. Leurs fiches (agency-agents, licence MIT) sont injectées
 * dans la demande comme méthode de travail; le schéma de sortie et le contexte africain priment.
 */
export const STEP_AGENTS: Record<Step, readonly AgentId[]> = {
  diagnostic: ["marketing-growth-hacker", "research-synthesist"],
  market: ["product-trend-researcher", "research-synthesist"],
  strategy: ["marketing-growth-hacker", "marketing-social-media-strategist", "sales-offer-lead-gen-strategist"],
  branding: ["design-brand-guardian", "design-visual-storyteller"],
  media: ["paid-media-paid-social-strategist", "paid-media-creative-strategist", "marketing-tiktok-strategist"],
  content: ["marketing-content-creator", "marketing-tiktok-strategist", "marketing-instagram-curator", "marketing-carousel-growth-engine"],
};

/** Noms affichés aux utilisateurs pendant la génération. */
export function stepExperts(step: Step): string[] {
  return STEP_AGENTS[step].map((id) => AGENTS[id].name);
}

/** Bloc « méthode des experts » ajouté à la demande d'une étape. */
export function expertiseBlock(step: Step): string {
  const profiles = STEP_AGENTS[step].map((id) => `### ${AGENTS[id].name}\n${AGENTS[id].text}`).join("\n\n");
  return `## Méthode des experts mobilisés pour cette étape
Applique les exigences, cadres et critères de qualité des fiches ci-dessous (en anglais) pour élever le niveau du livrable.
Adapte-les au contexte de l'entreprise et du pays: ignore les plateformes, outils ou pratiques absents du marché local, et privilégie les canaux réellement utilisés (WhatsApp, TikTok, Facebook, radio, mobile money…).
Elles ne remplacent ni la méthodologie Benely, qui reste la référence principale, ni les principes de Benely (faits, estimations, hypothèses), ni le format de sortie demandé.

${profiles}`;
}
