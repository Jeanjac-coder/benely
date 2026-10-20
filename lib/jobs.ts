import { ProfileSchema } from "./profile";
import type { JobInput } from "./ai/prompts";
import type { OrgContext } from "./context";
import type { Period } from "./ai/schemas";

/** Entrée de génération construite à partir du profil validé de l'organisation. */
export async function loadJobInput(ctx: OrgContext, period: Period): Promise<JobInput | string> {
  const { data: row } = await ctx.supabase.from("company_profiles").select("data, answers, summary, validated_at").eq("org_id", ctx.org.id).single();
  if (!row?.validated_at || !row.summary) return "Validez d'abord la synthèse de votre profil.";
  const profile = ProfileSchema.safeParse(row.data);
  if (!profile.success) return "Profil incomplet.";
  return { profile: profile.data, answers: row.answers ?? {}, summary: row.summary, period };
}
