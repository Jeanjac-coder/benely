import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import type { z } from "zod";

export const MODEL = process.env.ANTHROPIC_MODEL || "claude-opus-5-5";
type Effort = "low" | "medium" | "high" | "xhigh" | "max";
const EFFORT = (process.env.ANTHROPIC_EFFORT as Effort | undefined) || "medium";

let client: Anthropic | null = null;
export function anthropic(): Anthropic {
  return (client ??= new Anthropic());
}

/** Erreur IA présentable à l'utilisateur; `retryable` indique si une relance a du sens. */
export class AiError extends Error {
  readonly retryable: boolean;
  constructor(message: string, retryable: boolean) {
    super(message);
    this.retryable = retryable;
  }
}

export interface Usage { model: string; inputTokens: number; outputTokens: number }

export function toAiError(e: unknown): AiError {
  if (e instanceof AiError) return e;
  if (e instanceof Anthropic.AuthenticationError || e instanceof Anthropic.PermissionDeniedError) {
    return new AiError("Le service IA n'est pas correctement configuré. Contactez l'administrateur.", false);
  }
  if (e instanceof Anthropic.RateLimitError) return new AiError("Le service IA est momentanément saturé. Réessayez dans une minute.", true);
  if (e instanceof Anthropic.BadRequestError) return new AiError("La requête envoyée au service IA a été rejetée.", false);
  if (e instanceof Anthropic.APIConnectionError) return new AiError("Connexion au service IA impossible. Vérifiez la connexion et relancez.", true);
  if (e instanceof Anthropic.APIError) return new AiError("Le service IA a rencontré une erreur temporaire. Relancez l'étape.", true);
  return new AiError("Erreur inattendue pendant la génération. Relancez l'étape.", true);
}

/**
 * Appel unique au modèle avec sortie JSON contrainte et validée par le schéma Zod.
 * `context` est stable pour toute une génération: il est mis en cache entre les étapes.
 */
export async function generateStructured<S extends z.ZodType>(
  schema: S,
  system: string,
  context: string,
  instruction: string,
): Promise<{ data: z.infer<S>; usage: Usage }> {
  let res;
  try {
    res = await anthropic().beta.messages.parse({
      model: MODEL,
      max_tokens: 16000,
      // Si le modèle principal décline, l'API relance la requête sur un modèle de repli adapté.
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      output_config: { effort: EFFORT, format: betaZodOutputFormat(schema) },
      system: [{ type: "text", text: system, cache_control: { type: "ephemeral" } }],
      messages: [{
        role: "user",
        content: [
          { type: "text", text: context, cache_control: { type: "ephemeral" } },
          { type: "text", text: instruction },
        ],
      }],
    });
  } catch (e) {
    throw toAiError(e);
  }
  if (res.stop_reason === "refusal") throw new AiError("Le modèle a refusé de traiter cette demande. Reformulez le profil puis relancez.", false);
  if (res.stop_reason === "max_tokens") throw new AiError("La réponse a dépassé la taille maximale. Réduisez la période du calendrier ou relancez.", true);
  if (!res.parsed_output) throw new AiError("La réponse ne respecte pas le format attendu. Relancez l'étape.", true);
  return {
    data: res.parsed_output as z.infer<S>,
    usage: { model: res.model, inputTokens: res.usage.input_tokens, outputTokens: res.usage.output_tokens },
  };
}
