import type { Claim, Deliverables, Step } from "../ai/schemas.ts";
import { STEP_LABELS, STEPS } from "../ai/schemas.ts";
import { formatMoney } from "../money.ts";

export type Block =
  | { kind: "h"; text: string }
  | { kind: "p"; text: string; label?: string }
  | { kind: "list"; items: string[]; label?: string }
  | { kind: "table"; columns: string[]; rows: string[][]; label?: string };

export interface Section { id: Step; title: string; blocks: Block[] }

export interface Logo { data: Uint8Array; type: "png" | "jpg"; width: number; height: number }

export interface ExportDoc {
  title: string;
  company: string;
  subtitle: string;
  generatedAt: string;
  logo: Logo | null;
  sections: Section[];
}

const NATURE: Record<Claim["nature"], string> = { fait: "Fait", estimation: "Estimation", hypothese: "Hypothèse" };
const pct = (x: number) => `${Math.round(x * 100)} %`;
const nonEmpty = (b: Block) => (b.kind === "list" ? b.items.length > 0 : b.kind === "table" ? b.rows.length > 0 : b.text.trim().length > 0);
const claimRow = (c: Claim) => [c.statement, NATURE[c.nature], [c.source, c.sourceDate].filter(Boolean).join(", ") || "—"];

function sectionBlocks(step: Step, d: Deliverables): Block[] {
  const money = (n: number) => formatMoney(n, d.meta.currency);
  switch (step) {
    case "diagnostic": {
      const x = d.diagnostic;
      return [
        { kind: "p", text: x.summary },
        { kind: "p", label: "Maturité marketing", text: { debutant: "Débutant", intermediaire: "Intermédiaire", avance: "Avancé" }[x.maturity] },
        { kind: "list", label: "Forces", items: x.strengths },
        { kind: "list", label: "Faiblesses", items: x.weaknesses },
        { kind: "list", label: "Enjeux clés", items: x.keyChallenges },
        { kind: "list", label: "Données manquantes", items: x.missingData },
        { kind: "list", label: "Hypothèses retenues", items: x.assumptions },
      ];
    }
    case "market": {
      const x = d.market;
      return [
        { kind: "p", text: x.overview },
        { kind: "table", label: "Marché et consommateurs", columns: ["Affirmation", "Nature", "Source"], rows: [x.marketSize, ...x.trends, ...x.consumerBehavior].map(claimRow) },
        { kind: "table", label: "Concurrents", columns: ["Concurrent", "Positionnement", "Forces", "Faiblesses", "Nature"], rows: x.competitors.map((c) => [c.name, c.positioning, c.strengths.join("; "), c.weaknesses.join("; "), NATURE[c.nature]]) },
        { kind: "list", label: "SWOT — Forces", items: x.swot.strengths },
        { kind: "list", label: "SWOT — Faiblesses", items: x.swot.weaknesses },
        { kind: "list", label: "SWOT — Opportunités", items: x.swot.opportunities },
        { kind: "list", label: "SWOT — Menaces", items: x.swot.threats },
        { kind: "list", label: "Sources consultées", items: d.meta.sources.map((s) => `${s.title} — ${s.url}${s.date ? ` (${s.date})` : ""}`) },
      ];
    }
    case "strategy": {
      const x = d.strategy;
      return [
        { kind: "table", label: "Objectifs SMART", columns: ["Objectif", "Indicateur", "Cible", "Échéance", "Justification"], rows: x.smartObjectives.map((o) => [o.objective, o.metric, `${o.target.toLocaleString("fr-FR")} ${o.unit}`, o.deadline, o.rationale]) },
        { kind: "table", label: "Segmentation", columns: ["Segment", "Description", "Priorité"], rows: x.segments.map((s) => [s.name, s.description, s.priority]) },
        ...x.personas.flatMap((p): Block[] => [
          { kind: "h", text: `Persona — ${p.name} (${p.age}, ${p.occupation})` },
          { kind: "p", text: p.description },
          { kind: "list", label: "Besoins", items: p.needs },
          { kind: "list", label: "Freins", items: p.frictions },
          { kind: "p", label: "Canaux et langues", text: `${p.channels.join(", ")} — ${p.languages.join(", ")}` },
        ]),
        { kind: "p", label: "Positionnement", text: x.positioning },
        { kind: "p", label: "Stratégie marketing", text: x.marketingStrategy },
        { kind: "p", label: "Stratégie digitale", text: x.digitalStrategy },
        { kind: "p", label: "Stratégie de communication", text: x.communicationStrategy },
        { kind: "table", label: "Plan d'action", columns: ["Période", "Actions", "Responsable", "KPI"], rows: x.actionPlan.map((a) => [a.period, a.actions.join("\n"), a.owner, a.kpi]) },
      ];
    }
    case "branding": {
      const x = d.branding;
      return [
        { kind: "p", label: "Promesse", text: x.promise },
        { kind: "p", label: "Mission", text: x.mission },
        { kind: "p", label: "Vision", text: x.vision },
        { kind: "list", label: "Valeurs", items: x.values },
        { kind: "list", label: "Personnalité", items: x.personality },
        { kind: "p", label: "Ton", text: x.tone },
        { kind: "table", label: "Messages clés", columns: ["Audience", "Message"], rows: x.keyMessages.map((m) => [m.audience, m.message]) },
        { kind: "list", label: "Signatures proposées", items: x.taglines },
        { kind: "list", label: "À faire", items: x.dos },
        { kind: "list", label: "À éviter", items: x.donts },
      ];
    }
    case "media": {
      const x = d.media;
      return [
        { kind: "table", label: `Répartition du budget mensuel (${money(d.meta.monthlyBudget)})`, columns: ["Canal", "Part", "Montant mensuel", "Rôle", "KPI", "Objectif mensuel"],
          rows: x.channels.map((c) => [c.channel, pct(c.budgetShare), money(Math.round(c.budgetShare * d.meta.monthlyBudget)), c.role, c.kpi, c.monthlyTarget.toLocaleString("fr-FR")]) },
        { kind: "table", label: "Campagnes", columns: ["Campagne", "Objectif", "Cible", "Canaux", "Message", "Début", "Durée", "Budget", "KPI estimés"],
          rows: x.campaigns.map((c) => [c.name, c.objective, c.target, c.channels.join(", "), c.message, c.startDate, `${c.durationDays} j`, money(c.budget), c.kpis.map((k) => `${k.name}: ${k.estimate.toLocaleString("fr-FR")} ${k.unit}`).join("\n")]) },
        { kind: "table", label: "Créations recommandées", columns: ["Campagne", "Créations"], rows: x.campaigns.map((c) => [c.name, c.creatives.join("\n")]) },
        { kind: "table", label: "Tunnel de conversion", columns: ["Étape", "Actions", "KPI"], rows: x.funnel.map((f) => [f.stage, f.actions.join("\n"), f.kpi]) },
        { kind: "p", label: "Avertissement", text: x.forecastDisclaimer },
      ];
    }
    case "content": {
      const x = d.content;
      return [
        { kind: "table", label: "Piliers éditoriaux", columns: ["Pilier", "Part", "Description"], rows: x.pillars.map((p) => [p.name, pct(p.share), p.description]) },
        { kind: "table", label: `Calendrier éditorial du ${d.meta.period.start} au ${d.meta.period.end}`, columns: ["Date", "Plateforme", "Objectif", "Thème", "Format", "Texte", "Appel à l'action", "KPI"],
          rows: [...x.entries].sort((a, b) => a.date.localeCompare(b.date)).map((e) => [e.date, e.platform, e.objective, e.theme, e.format, e.text, e.cta, e.kpi]) },
      ];
    }
  }
}

export function buildDoc(d: Deliverables, info: { company: string; version: number; logo: Logo | null; generatedAt?: Date }, steps: Step[] = [...STEPS]): ExportDoc {
  const only = steps.length === 1 ? STEP_LABELS[steps[0]] : null;
  return {
    title: only ?? "Stratégie marketing et communication",
    company: info.company,
    subtitle: `Version ${info.version} · période du ${d.meta.period.start} au ${d.meta.period.end}`,
    generatedAt: (info.generatedAt ?? new Date()).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" }),
    logo: info.logo,
    sections: STEPS.filter((s) => steps.includes(s)).map((s) => ({ id: s, title: STEP_LABELS[s], blocks: sectionBlocks(s, d).filter(nonEmpty) })),
  };
}

/** Lit le type et les dimensions d'un logo PNG ou JPEG; null pour tout autre format. */
export function readLogo(data: Uint8Array): Logo | null {
  const dv = new DataView(data.buffer, data.byteOffset, data.byteLength);
  if (data.length > 24 && dv.getUint32(0) === 0x89504e47) return { data, type: "png", width: dv.getUint32(16), height: dv.getUint32(20) };
  if (data.length > 4 && dv.getUint16(0) === 0xffd8) {
    let i = 2;
    while (i + 9 < data.length) {
      if (data[i] !== 0xff) return null;
      const marker = data[i + 1];
      const len = dv.getUint16(i + 2);
      if (marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker)) {
        return { data, type: "jpg", height: dv.getUint16(i + 5), width: dv.getUint16(i + 7) };
      }
      i += 2 + len;
    }
  }
  return null;
}

export function fileName(company: string, ext: string, date = new Date()): string {
  const slug = company.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^A-Za-z0-9]+/g, "-").replace(/^-|-$/g, "") || "entreprise";
  return `Benely-${slug}-${date.toISOString().slice(0, 10)}.${ext}`;
}
