import { inPeriod, parseDay, periodDays } from "../calendar.ts";
import type { Deliverables, Step } from "./schemas.ts";

export interface Issue {
  severity: "info" | "warning" | "error";
  section: Step | "meta";
  message: string;
}

const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]/g, "");
const matches = (a: string, b: string) => { const x = norm(a), y = norm(b); return x.length > 0 && y.length > 0 && (x.includes(y) || y.includes(x)); };

/**
 * Contrôles déterministes de cohérence entre livrables.
 * Ne modifie rien: la liste d'écarts est affichée et conservée avec la version.
 */
export function checkCoherence(d: Deliverables): Issue[] {
  const issues: Issue[] = [];
  const { meta, market, strategy, media, content, diagnostic } = d;

  for (const m of diagnostic.missingData) issues.push({ severity: "info", section: "diagnostic", message: `Donnée manquante: ${m}` });

  const unsourced = [market.marketSize, ...market.trends, ...market.consumerBehavior].filter((c) => c.nature === "fait" && !c.source);
  if (unsourced.length) issues.push({ severity: "warning", section: "market", message: `${unsourced.length} affirmation(s) présentée(s) comme des faits sans source: à vérifier ou requalifier en estimation.` });
  if (market.competitors.length === 0) issues.push({ severity: "warning", section: "market", message: "Aucun concurrent identifié." });

  if (strategy.personas.length === 0) issues.push({ severity: "error", section: "strategy", message: "Aucun persona défini." });
  for (const o of strategy.smartObjectives) {
    if (!(o.target > 0)) issues.push({ severity: "error", section: "strategy", message: `Objectif sans cible chiffrée: « ${o.objective} ».` });
    if (!parseDay(o.deadline)) issues.push({ severity: "error", section: "strategy", message: `Échéance invalide pour « ${o.objective} ».` });
    else if (o.deadline < meta.period.start) issues.push({ severity: "warning", section: "strategy", message: `Échéance antérieure à la période pour « ${o.objective} ».` });
  }

  const shareTotal = media.channels.reduce((s, c) => s + c.budgetShare, 0);
  if (media.channels.length === 0) issues.push({ severity: "error", section: "media", message: "Aucun canal dans le plan média." });
  else if (Math.abs(shareTotal - 1) > 0.01) issues.push({ severity: "error", section: "media", message: `Les parts de budget totalisent ${(shareTotal * 100).toFixed(1)} % au lieu de 100 %.` });
  if (media.channels.some((c) => c.budgetShare < 0)) issues.push({ severity: "error", section: "media", message: "Part de budget négative." });

  const months = Math.max(1, Math.ceil(periodDays(meta.period) / 30));
  const campaignTotal = media.campaigns.reduce((s, c) => s + c.budget, 0);
  if (campaignTotal > meta.monthlyBudget * months * 1.001) {
    issues.push({ severity: "error", section: "media", message: `Le budget des campagnes (${Math.round(campaignTotal)}) dépasse le budget disponible sur la période (${Math.round(meta.monthlyBudget * months)}).` });
  }
  for (const c of media.campaigns) {
    if (!parseDay(c.startDate)) issues.push({ severity: "error", section: "media", message: `Date de début invalide pour la campagne « ${c.name} ».` });
    for (const ch of c.channels) {
      if (!media.channels.some((x) => matches(x.channel, ch))) issues.push({ severity: "warning", section: "media", message: `La campagne « ${c.name} » utilise « ${ch} », absent du plan média.` });
    }
  }

  const outside = content.entries.filter((e) => !inPeriod(e.date, meta.period));
  if (outside.length) issues.push({ severity: "error", section: "content", message: `${outside.length} publication(s) hors de la période ${meta.period.start} → ${meta.period.end}.` });
  const offPlan = [...new Set(content.entries.map((e) => e.platform).filter((p) => !media.channels.some((c) => matches(c.channel, p))))];
  if (offPlan.length) issues.push({ severity: "warning", section: "content", message: `Plateformes du calendrier absentes du plan média: ${offPlan.join(", ")}.` });
  if (content.entries.length === 0) issues.push({ severity: "error", section: "content", message: "Calendrier éditorial vide." });

  return issues;
}
