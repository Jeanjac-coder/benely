import Link from "next/link";
import { today } from "@/lib/calendar";
import { requireContext } from "@/lib/context";
import { formatMoney } from "@/lib/money";
import { latestStrategy } from "@/lib/repo";

export default async function Dashboard() {
  const ctx = await requireContext();
  const [{ data: profile }, current] = await Promise.all([
    ctx.supabase.from("company_profiles").select("validated_at").eq("org_id", ctx.org.id).maybeSingle(),
    latestStrategy(ctx),
  ]);

  if (!current) {
    return (
      <>
        <h1>Bienvenue, {ctx.org.name}</h1>
        <div className="card">
          <ol>
            <li>{profile?.validated_at ? "✓ Profil validé" : <Link href="/app/profile">Compléter et valider votre profil</Link>}</li>
            <li>{profile?.validated_at ? <Link href="/app/generate">Générer votre stratégie</Link> : "Générer votre stratégie"}</li>
          </ol>
        </div>
      </>
    );
  }

  const d = current.version.deliverables;
  const { data: perf } = await ctx.supabase.from("performance_entries").select("spend, conversions").eq("strategy_id", current.strategy.id);
  const spent = (perf ?? []).reduce((s, p) => s + Number(p.spend), 0);
  const results = (perf ?? []).reduce((s, p) => s + p.conversions, 0);
  const upcoming = d.content.entries.filter((e) => e.date >= today()).sort((a, b) => a.date.localeCompare(b.date)).slice(0, 5);
  const errors = current.version.issues.filter((i) => i.severity === "error").length;

  return (
    <>
      <h1>{current.strategy.title}</h1>
      <p className="muted small">Version {current.version.version} · période du {d.meta.period.start} au {d.meta.period.end}</p>
      <div className="kpis">
        <div className="kpi">Budget mensuel<b>{formatMoney(d.meta.monthlyBudget, d.meta.currency)}</b></div>
        <div className="kpi">Dépensé (saisi)<b>{formatMoney(spent, d.meta.currency)}</b></div>
        <div className="kpi">Résultats saisis<b>{results}</b></div>
        <div className="kpi">Campagnes<b>{d.media.campaigns.length}</b></div>
        <div className="kpi">Publications planifiées<b>{d.content.entries.length}</b></div>
        <div className="kpi">Points à corriger<b className={errors ? "err" : "ok"}>{errors}</b></div>
      </div>
      <section className="card">
        <h2>Objectifs</h2>
        <div className="table-wrap"><table>
          <thead><tr><th>Objectif</th><th>Cible</th><th>Échéance</th></tr></thead>
          <tbody>{d.strategy.smartObjectives.map((o, i) => <tr key={i}><td>{o.objective}</td><td>{o.target.toLocaleString("fr-FR")} {o.unit}</td><td>{o.deadline}</td></tr>)}</tbody>
        </table></div>
      </section>
      <section className="card">
        <h2>Prochaines publications</h2>
        {upcoming.length === 0 ? <p className="muted">Aucune publication à venir.</p> :
          <ul>{upcoming.map((e, i) => <li key={i}><b>{e.date}</b> · {e.platform} · {e.theme}</li>)}</ul>}
        <Link href="/app/calendar">Voir le calendrier</Link>
      </section>
      <section className="card">
        <h2>Campagnes</h2>
        <ul>{d.media.campaigns.map((c, i) => <li key={i}><b>{c.name}</b> — {c.objective} · {formatMoney(c.budget, d.meta.currency)} · dès le {c.startDate}</li>)}</ul>
        <p className="muted small">{d.media.forecastDisclaimer}</p>
      </section>
      <section className="card">
        <h2>Plan d'action</h2>
        {d.strategy.actionPlan.map((p, i) => <div key={i}><h3>{p.period}</h3><ul>{p.actions.map((a, j) => <li key={j}>{a}</li>)}</ul></div>)}
      </section>
    </>
  );
}
