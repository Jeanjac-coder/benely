import { ProfileSchema } from "./profile";
import type { JobInput } from "./ai/prompts";
import type { OrgContext } from "./context";
import type { Period } from "./ai/schemas";
import { logEvent } from "./events";
import type { Methodology } from "./methodology";
import { supabaseAdmin } from "./supabase/admin";

/** Entrée de génération construite à partir du profil validé de l'organisation. */
export async function loadJobInput(ctx: OrgContext, period: Period): Promise<JobInput | string> {
  const { data: row } = await ctx.supabase.from("company_profiles").select("data, answers, summary, validated_at").eq("org_id", ctx.org.id).single();
  if (!row?.validated_at || !row.summary) return "Validez d'abord la synthèse de votre profil.";
  const profile = ProfileSchema.safeParse(row.data);
  if (!profile.success) return "Profil incomplet.";
  const methodology = await activeMethodology(ctx.org.id);
  return { profile: profile.data, answers: row.answers ?? {}, summary: row.summary, period, methodology };
}

/**
 * Méthodologie Benely active (table methodology_documents, lue avec le rôle service car réservée
 * à l'administration). Elle est copiée dans l'entrée du job: toutes les étapes utilisent la même version.
 */
export async function activeMethodology(orgId?: string): Promise<Methodology | null> {
  try {
    const { data, error } = await supabaseAdmin().from("methodology_documents").select("version, title, content").eq("active", true).maybeSingle();
    if (error) throw new Error(error.message);
    if (!data) await logEvent("warning", "generation", "Aucune méthodologie active: génération sans document de référence.", { orgId });
    return data ?? null;
  } catch (e) {
    await logEvent("error", "generation", `Méthodologie illisible: ${(e as Error).message}`, { orgId });
    return null;
  }
}
