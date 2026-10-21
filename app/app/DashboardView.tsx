import Link from "next/link";
import { Icon } from "@/components/Icon";
import { Mascot } from "@/components/Mascot";
import { campaignProgress, monthGrid, objectiveStatus, weeklyCounts, type ObjectiveStatus } from "@/lib/dashboard";
import { formatMoney } from "@/lib/money";
import type { StrategyVersion } from "@/lib/repo";

const STATUS: Record<ObjectiveStatus, string> = { en_cours: "En cours", proche: "Échéance proche", echu: "Échu" };
const WEEKDAYS = ["L", "M", "M", "J", "V", "S", "D"];

/** Pastille de plateforme: initiale sur une couleur stable dérivée du nom. */
function platformTone(p: string): string {
  const tones = ["tone-blue", "tone-orange", "tone-sky", "tone-night"];
  return tones[[...p].reduce((h, c) => h + c.charCodeAt(0), 0) % tones.length];
}

/** Anneau d'avancement (0 → 1). */
function Ring({ value }: { value: number }) {
  const c = 2 * Math.PI * 15;
  return (
    <svg className="ring" viewBox="0 0 36 36" width="36" height="36" aria-hidden="true">
      <circle cx="18" cy="18" r="15" fill="none" strokeWidth="4" className="ring-bg" />
      <circle cx="18" cy="18" r="15" fill="none" strokeWidth="4" strokeLinecap="round" className="ring-fg" strokeDasharray={`${c * value} ${c}`} transform="rotate(-90 18 18)" />
    </svg>
  );
}

/** Tableau de bord d'une stratégie générée (affichage seul, données chargées par la page). */
export function DashboardView({ firstName, title, version, spent, results, now }: {
  firstName: string; title: string; version: Pick<StrategyVersion, "version" | "deliverables" | "issues">; spent: number; results: number; now: string;
}) {
  const d = version.deliverables;
  const dates = d.content.entries.map((e) => e.date);
  const upcoming = d.content.entries.filter((e) => e.date >= now).sort((a, b) => a.date.localeCompare(b.date)).slice(0, 4);
  const errors = version.issues.filter((i) => i.severity === "error").length;
  const weeks = weeklyCounts(dates, d.meta.period, now);
  const peak = Math.max(1, ...weeks.map((w) => w.count));
  const top = weeks.reduce((a, b) => (b.count > a.count ? b : a), weeks[0]);
  const month = monthGrid(now, dates);
  const spentShare = d.meta.monthlyBudget > 0 ? Math.min(1, spent / d.meta.monthlyBudget) : 0;
  const fmtDay = (s: string) => new Date(`${s}T00:00:00Z`).toLocaleDateString("fr-FR", { day: "numeric", month: "short", timeZone: "UTC" });

  return (
    <div className="dash">
      <header className="dash-head">
        <div>
          <h1>Bonjour{firstName ? ` ${firstName}` : ""} <span className="wave" aria-hidden="true">👋</span></h1>
          <p className="muted">{title} · version {version.version} · du {fmtDay(d.meta.period.start)} au {fmtDay(d.meta.period.end)}</p>
        </div>
        <div className="row">
          <Link href="/app/strategy" className="btn btn-ghost">Voir la stratégie</Link>
          <Link href="/app/generate" className="btn btn-orange btn-pill">Nouvelle génération <span className="arr" aria-hidden="true"><Icon name="arrow-up-right" size={16} /></span></Link>
        </div>
      </header>

      <div className="tiles">
        <Link href="/app/budget" className="tile t-blue">
          <span className="tile-top"><span className="tile-ico"><Icon name="wallet" /></span>Budget mensuel<Icon name="arrow-up-right" size={16} /></span>
          <b>{formatMoney(d.meta.monthlyBudget, d.meta.currency)}</b>
          <span className="meter"><i style={{ width: `${spentShare * 100}%` }} /></span>
          <small>{formatMoney(spent, d.meta.currency)} dépensés (saisis)</small>
        </Link>
        <Link href="/app/performance" className="tile t-orange">
          <span className="tile-top"><span className="tile-ico"><Icon name="chart" /></span>Résultats saisis<Icon name="arrow-up-right" size={16} /></span>
          <b>{results.toLocaleString("fr-FR")}</b>
          <small>conversions déclarées</small>
        </Link>
        <Link href="/app/calendar" className="tile t-night">
          <span className="tile-top"><span className="tile-ico"><Icon name="calendar" /></span>Publications<Icon name="arrow-up-right" size={16} /></span>
          <b>{d.content.entries.length}</b>
          <small>{d.media.campaigns.length} campagne{d.media.campaigns.length > 1 ? "s" : ""} planifiée{d.media.campaigns.length > 1 ? "s" : ""}</small>
        </Link>
        <Link href="/app/strategy" className={`tile ${errors ? "t-alert" : "t-light"}`}>
          <span className="tile-top"><span className="tile-ico"><Icon name={errors ? "alert" : "check"} /></span>Cohérence<Icon name="arrow-up-right" size={16} /></span>
          <b>{errors}</b>
          <small>{errors ? "point(s) à corriger" : "aucun point bloquant"}</small>
        </Link>
      </div>

      <div className="dash-grid">
        <div className="dash-main">
          <section className="panel">
            <div className="panel-head">
              <div><h2>Rythme de publication</h2><p className="muted small">Publications prévues par semaine sur la période</p></div>
              {top && top.count > 0 && <span className="chip"><Icon name="arrow-up-right" size={14} /> pic: {top.count} la semaine du {top.label}</span>}
            </div>
            <div className="bars" role="img" aria-label={`Publications par semaine: ${weeks.map((w) => `${w.label} ${w.count}`).join(", ")}`}>
              {weeks.map((w, i) => (
                <div key={w.start} className={`bar ${w.current ? "is-current" : ""} ${w === top && w.count > 0 ? "is-top" : ""}`} style={{ "--h": `${(w.count / peak) * 100}%`, "--d": `${i * 60}ms` } as React.CSSProperties}>
                  {w === top && w.count > 0 && <span className="tip">{w.count} publication{w.count > 1 ? "s" : ""}</span>}
                  <i />
                  <small>{w.label}</small>
                </div>
              ))}
            </div>
          </section>

          <div className="dash-split">
            <section className="panel">
              <div className="panel-head"><h2>Prochaines publications</h2><Link href="/app/calendar" className="small">Tout voir</Link></div>
              {upcoming.length === 0 ? <p className="muted">Aucune publication à venir.</p> : (
                <ul className="list">
                  {upcoming.map((e, i) => (
                    <li key={i}>
                      <span className={`sq ${platformTone(e.platform)}`}>{e.platform.charAt(0).toUpperCase()}</span>
                      <span className="grow"><b>{e.theme}</b><small>{e.platform} · {e.format}</small></span>
                      <span className="date">{fmtDay(e.date)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
            <section className="panel">
              <div className="panel-head"><h2>Piliers éditoriaux</h2></div>
              <ul className="pillars">
                {d.content.pillars.map((p, i) => (
                  <li key={i}><span className="row" style={{ justifyContent: "space-between" }}><b>{p.name}</b><span className="muted small">{Math.round(p.share * 100)} %</span></span><span className="meter"><i style={{ width: `${p.share * 100}%` }} /></span></li>
                ))}
              </ul>
            </section>
          </div>

          <section className="panel">
            <div className="panel-head"><h2>Campagnes</h2><Link href="/app/budget" className="small">Budget</Link></div>
            <ul className="list campaigns">
              {d.media.campaigns.map((c, i) => {
                const p = campaignProgress(c, now);
                return (
                  <li key={i}>
                    <span className={`sq ${i % 2 ? "tone-orange" : "tone-blue"}`}><Icon name="spark" /></span>
                    <span className="grow"><b>{c.name}</b><small>{c.objective}</small></span>
                    <span className="cell"><small>Budget</small><b>{formatMoney(c.budget, d.meta.currency)}</b></span>
                    <span className="cell hide-sm"><small>Début</small><b>{fmtDay(c.startDate)}</b></span>
                    <span className="progress-cell"><Ring value={p} /><b>{Math.round(p * 100)} %</b></span>
                  </li>
                );
              })}
            </ul>
            <p className="muted small" style={{ margin: "10px 0 0" }}>{d.media.forecastDisclaimer}</p>
          </section>
        </div>

        <aside className="dash-side">
          <section className="promo-card">
            <div>
              <span className="kicker on-dark">Votre copilote</span>
              <h2>BEN veille sur votre plan</h2>
              <p>Saisissez vos résultats: BEN repère les écarts et propose où réallouer le budget.</p>
              <Link href="/app/performance" className="btn btn-orange btn-sm">Saisir mes résultats</Link>
            </div>
            <Mascot pose="point" height={130} motion="float" />
          </section>

          <section className="panel mini-cal">
            <div className="panel-head"><h2>{month.title}</h2><Link href="/app/calendar" className="small">Calendrier</Link></div>
            <div className="cal-grid">
              {WEEKDAYS.map((w, i) => <span key={i} className="dow">{w}</span>)}
              {month.days.map((x) => (
                <span key={x.day} className={`cal-day ${x.inMonth ? "" : "out"} ${x.today ? "today" : ""} ${x.count ? "has" : ""}`} title={x.count ? `${x.count} publication(s)` : undefined}>
                  {Number(x.day.slice(8))}
                </span>
              ))}
            </div>
          </section>

          <section className="panel">
            <div className="panel-head"><h2>Objectifs</h2><Link href="/app/strategy" className="small">Détails</Link></div>
            <ul className="list objectives">
              {d.strategy.smartObjectives.map((o, i) => {
                const st = objectiveStatus(o.deadline, now);
                return (
                  <li key={i}>
                    <span className={`sq ${["tone-blue", "tone-orange", "tone-sky", "tone-night"][i % 4]}`}><Icon name="tag" /></span>
                    <span className="grow"><b>{o.objective}</b><small>{o.target.toLocaleString("fr-FR")} {o.unit} · {fmtDay(o.deadline)}</small></span>
                    <span className={`status s-${st}`}>{STATUS[st]}</span>
                  </li>
                );
              })}
            </ul>
          </section>
        </aside>
      </div>

      <section className="panel">
        <div className="panel-head"><h2>Plan d'action</h2></div>
        <div className="plan">
          {d.strategy.actionPlan.map((p, i) => (
            <div key={i} className="plan-step"><span className="plan-n">{i + 1}</span><div><h3>{p.period}</h3><ul>{p.actions.map((a, j) => <li key={j}>{a}</li>)}</ul><small className="muted">{p.owner} · KPI: {p.kpi}</small></div></div>
          ))}
        </div>
      </section>
    </div>
  );
}
