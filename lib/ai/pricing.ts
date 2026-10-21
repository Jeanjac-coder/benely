// Tarifs publics en USD par million de jetons (entrée, sortie), pour estimer le coût IA par client.
const PRICES: Record<string, [number, number]> = {
  "claude-fable-5-1": [10, 50],
  "claude-opus-5-5": [4, 20],
  "claude-opus-5": [5, 25],
  "claude-sonnet-5-5": [2, 10],
  "claude-haiku-5-5": [0.1, 0.5],
};

/** Coût estimé en USD; un modèle inconnu est compté au tarif Opus (estimation prudente). */
export function estimateCostUsd(model: string, inputTokens: number, outputTokens: number): number {
  const key = Object.keys(PRICES).find((k) => model === k || model.startsWith(`${k}-`));
  const [i, o] = PRICES[key ?? "claude-opus-5-5"];
  return (inputTokens * i + outputTokens * o) / 1_000_000;
}

/** Taux de conversion indicatif pour comparer coût IA et prix des offres en FCFA. */
export const USD_TO_XOF = Number(process.env.USD_TO_XOF ?? 600);
