import Link from "next/link";
import { STEPS } from "@/lib/ai/schemas";
import { requireContext } from "@/lib/context";
import { Generator } from "./Generator";

export default async function GeneratePage() {
  const ctx = await requireContext();
  const [{ data: profile }, { data: job }] = await Promise.all([
    ctx.supabase.from("company_profiles").select("validated_at").eq("org_id", ctx.org.id).maybeSingle(),
    ctx.supabase.from("generation_jobs").select("id, status, error, outputs").eq("org_id", ctx.org.id).neq("status", "succeeded")
      .order("created_at", { ascending: false }).limit(1).maybeSingle(),
  ]);
  if (!profile?.validated_at) {
    return <><h1>Génération</h1><div className="card"><p>Validez d'abord la synthèse de votre profil.</p><Link href="/app/profile">Aller au profil</Link></div></>;
  }
  const pending = job ? { id: job.id, status: job.status as string, error: job.error as string | null, completed: STEPS.filter((s) => job.outputs?.[s]) } : null;
  return <Generator pending={pending} />;
}
