import type Anthropic from "@anthropic-ai/sdk";
import { anthropic, MODEL, toAiError, type Usage } from "./client.ts";
import type { Source } from "./schemas.ts";

export const RESEARCH_ENABLED = process.env.BENELY_WEB_RESEARCH === "1";

/**
 * Recherche web préalable à l'étude de marché. Renvoie des notes et les sources consultées,
 * qui sont ensuite fournies à l'étape « market » pour qu'elle cite ses sources.
 */
export async function webResearch(brief: string): Promise<{ notes: string; sources: Source[]; usage: Usage }> {
  const messages: Anthropic.MessageParam[] = [{
    role: "user",
    content: `Recherche des informations récentes et vérifiables pour une étude de marché:\n${brief}\n\n` +
      "Cherche: taille et croissance du marché, tendances, comportements des consommateurs, principaux concurrents locaux et leurs offres. " +
      "Rédige des notes factuelles en français, chaque fait suivi de sa source (titre, URL, date). Signale quand aucune donnée fiable n'existe.",
  }];
  const sources = new Map<string, Source>();
  const notes: string[] = [];
  let inputTokens = 0, outputTokens = 0, model = MODEL;
  try {
    // pause_turn: le serveur rend la main pendant une longue recherche; on relance tel quel.
    for (let i = 0; i < 3; i++) {
      const res = await anthropic().messages.create({
        model: MODEL,
        max_tokens: 16000,
        output_config: { effort: "low" },
        tools: [{ type: "web_search_20260209", name: "web_search", max_uses: 6 }],
        messages,
      });
      model = res.model;
      inputTokens += res.usage.input_tokens;
      outputTokens += res.usage.output_tokens;
      for (const b of res.content) {
        if (b.type === "text") notes.push(b.text);
        if (b.type === "web_search_tool_result" && Array.isArray(b.content)) {
          for (const r of b.content) sources.set(r.url, { title: r.title, url: r.url, date: r.page_age ?? null });
        }
      }
      if (res.stop_reason !== "pause_turn") break;
      messages.push({ role: "assistant", content: res.content });
    }
  } catch (e) {
    throw toAiError(e);
  }
  return { notes: notes.join("").trim(), sources: [...sources.values()], usage: { model, inputTokens, outputTokens } };
}
