// Condense une sélection d'agents de github.com/msitarzewski/agency-agents (licence MIT)
// en un module TypeScript embarqué: lib/ai/agents.generated.ts.
// Usage: node scripts/sync-agents.mjs <chemin du dépôt cloné>
import { readFileSync, writeFileSync } from "node:fs";
import { execSync } from "node:child_process";
import path from "node:path";

const REPO = "https://github.com/msitarzewski/agency-agents";
const root = process.argv[2];
if (!root) {
  console.error("Usage: node scripts/sync-agents.mjs <chemin du dépôt agency-agents>");
  process.exit(1);
}

// Agents retenus: ceux qui couvrent les six étapes de génération de Benely.
const FILES = [
  "marketing/marketing-growth-hacker.md",
  "research/research-synthesist.md",
  "product/product-trend-researcher.md",
  "marketing/marketing-social-media-strategist.md",
  "sales/sales-offer-lead-gen-strategist.md",
  "design/design-brand-guardian.md",
  "design/design-visual-storyteller.md",
  "paid-media/paid-media-paid-social-strategist.md",
  "paid-media/paid-media-creative-strategist.md",
  "marketing/marketing-tiktok-strategist.md",
  "marketing/marketing-content-creator.md",
  "marketing/marketing-instagram-curator.md",
  "marketing/marketing-carousel-growth-engine.md",
];

// Sections utiles au raisonnement; on écarte l'outillage, les gabarits de code et les exemples.
const KEEP = /identity|role|mission|capabilit|skills|rules|decision|success|framework|methodolog|principles|standards|strateg/i;
const DROP = /tool|api|stack|workflow|memory|learning|communication style|example|integration|deliverables$/i;
const MAX = 4500;

function condense(md) {
  const fm = md.match(/^---\n([\s\S]*?)\n---\n/);
  const meta = Object.fromEntries((fm?.[1] ?? "").split("\n").map((l) => l.split(/:\s(.*)/s)).filter((p) => p.length > 1).map(([k, v]) => [k.trim(), v.trim()]));
  let body = fm ? md.slice(fm[0].length) : md;
  body = body.replace(/```[\s\S]*?```/g, "").replace(/\p{Extended_Pictographic}️?/gu, "");
  const sections = body.split(/\n(?=## )/);
  const kept = [];
  for (const s of sections) {
    const heading = (s.match(/^## (.*)/)?.[1] ?? "").trim();
    if (!heading || (KEEP.test(heading) && !DROP.test(heading))) {
      kept.push(s.replace(/^# .*\n/, "").replace(/\n{3,}/g, "\n\n").trim());
    }
  }
  let text = kept.filter(Boolean).join("\n\n").replace(/^# .*$/gm, "").replace(/^(#+) +/gm, "$1 ").replace(/\n{3,}/g, "\n\n").trim();
  if (text.length > MAX) text = text.slice(0, text.lastIndexOf("\n", MAX)).trim();
  return { name: meta.name ?? "", description: meta.description ?? "", text };
}

const commit = execSync("git rev-parse --short HEAD", { cwd: root }).toString().trim();
const agents = {};
for (const file of FILES) {
  const id = path.basename(file, ".md");
  agents[id] = { ...condense(readFileSync(path.join(root, file), "utf8")), source: `${REPO}/blob/${commit}/${file}` };
}

const out = `// Fichier généré par scripts/sync-agents.mjs — ne pas modifier à la main.
// Source: ${REPO} (commit ${commit}), licence MIT, © 2025 AgentLand Contributors.
// Voir lib/ai/agents/LICENSE-agency-agents.txt.

export interface AgentProfile { name: string; description: string; text: string; source: string }

export const AGENTS = ${JSON.stringify(agents, null, 2)} as const satisfies Record<string, AgentProfile>;

export type AgentId = keyof typeof AGENTS;
`;
writeFileSync("lib/ai/agents.generated.ts", out);
writeFileSync("lib/ai/agents/LICENSE-agency-agents.txt", readFileSync(path.join(root, "LICENSE"), "utf8"));
console.log(`${FILES.length} agents écrits depuis ${commit}.`);
for (const [id, a] of Object.entries(agents)) console.log(`  ${id}: ${a.text.length} caractères`);
