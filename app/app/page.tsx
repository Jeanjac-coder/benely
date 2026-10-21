import Link from "next/link";
import { Mascot } from "@/components/Mascot";
import { today } from "@/lib/calendar";
import { requireContext } from "@/lib/context";
import { latestStrategy } from "@/lib/repo";
import { DashboardView } from "./DashboardView";

export default async function Dashboard() {
  const ctx = await requireContext();
  const [{ data: profile }, current] = await Promise.all([
    ctx.supabase.from("company_profiles").select("validated_at").eq("org_id", ctx.org.id).maybeSingle(),
    latestStrategy(ctx),
  ]);

  if (!current) {
    const validated = Boolean(profile?.validated_at);
    return (
      <>
        <h1>Bienvenue{ctx.firstName ? `, ${ctx.firstName}` : ""} !</h1>
        <div className="card empty">
          <Mascot pose={validated ? "point" : "wave"} height={170} motion="float" />
          <div>
            <h2>{validated ? "Tout est prêt pour votre stratégie !" : "Commençons par faire connaissance."}</h2>
            <p className="muted">{validated
              ? "Votre profil est validé. Lancez la génération: diagnostic, marché, marque, plan média et calendrier en quelques minutes."
              : "Quelques questions sur votre entreprise, votre marché et votre budget, puis vous validez la synthèse."}</p>
            <ol className="stepper">
              <li data-state={validated ? "done" : "current"}><span>{validated ? "✓" : 1}</span>Profil validé</li>
              <li data-state={validated ? "current" : "todo"}><span>2</span>Stratégie générée</li>
            </ol>
            <Link href={validated ? "/app/generate" : "/app/profile"} className="btn">{validated ? "Générer ma stratégie" : "Compléter mon profil"}</Link>
          </div>
        </div>
      </>
    );
  }

  const { data: perf } = await ctx.supabase.from("performance_entries").select("spend, conversions").eq("strategy_id", current.strategy.id);
  return (
    <DashboardView
      firstName={ctx.firstName}
      title={current.strategy.title}
      version={current.version}
      spent={(perf ?? []).reduce((s, p) => s + Number(p.spend), 0)}
      results={(perf ?? []).reduce((s, p) => s + p.conversions, 0)}
      now={today()}
    />
  );
}
