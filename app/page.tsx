import { createClient } from "@supabase/supabase-js";
import Link from "next/link";
import { Logo } from "@/components/Logo";
import { Icon, type IconName } from "@/components/Icon";
import { Mascot, type Pose } from "@/components/Mascot";
import { MascotGuide } from "@/components/MascotGuide";
import { Reveal } from "@/components/Reveal";
import { Socials } from "@/components/Socials";
import { ThemeToggle } from "@/components/ThemeToggle";
import { CONTACT_EMAIL } from "@/lib/site";
import { QUOTA_LABELS, type Plan, type QuotaKind } from "@/lib/billing/plans";
import { formatMoney } from "@/lib/money";

export const revalidate = 3600;

// Valeurs de repli si la base n'est pas joignable (prévisualisation sans configuration).
const FALLBACK: Pick<Plan, "id" | "name" | "price_monthly" | "currency" | "quotas">[] = [
  { id: "starter", name: "Starter", price_monthly: 9900, currency: "XOF", quotas: { generations: 2, regenerations: 20, exports: 10, members: 1 } },
  { id: "business", name: "Business", price_monthly: 19900, currency: "XOF", quotas: { generations: 6, regenerations: 60, exports: 50, members: 5 } },
  { id: "enterprise", name: "Enterprise", price_monthly: null, currency: "XOF", quotas: { generations: null, regenerations: null, exports: null, members: null } },
];

const PLAN_TEXT: Record<string, string> = {
  starter: "Pour les entrepreneurs et petites structures.",
  business: "Pour les PME et startups qui pilotent plusieurs campagnes.",
  enterprise: "Pour les groupes et agences: volumes et accompagnement sur mesure.",
};

async function plans() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL, key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return FALLBACK;
  try {
    const { data } = await createClient(url, key).from("plans").select("id, name, price_monthly, currency, quotas").eq("public", true).order("sort");
    return data?.length ? (data as typeof FALLBACK) : FALLBACK;
  } catch {
    return FALLBACK;
  }
}

const MARQUEE = ["WhatsApp Business", "Orange Money", "TikTok", "MTN MoMo", "Facebook", "Wave", "Instagram", "Moov Money", "LinkedIn", "Radio", "Affichage", "SMS"];

const STEPS: readonly { icon: IconName; tag: string; title: string; text: string; pose: Pose }[] = [
  { icon: "profile", pose: "think", tag: "Étape 1 · 10 min", title: "Comprendre", text: "Un questionnaire qui s'adapte à vos réponses, puis une synthèse que vous validez." },
  { icon: "strategy", pose: "point", tag: "Étape 2 · IA", title: "Planifier", text: "Diagnostic, marché, personas, marque, plan média et calendrier, cohérents entre eux." },
  { icon: "wallet", pose: "happy", tag: "Étape 3 · Budget", title: "Exécuter", text: "Budget en FCFA réparti par canal, campagnes prêtes, publications rédigées." },
  { icon: "chart", pose: "surprised", tag: "Étape 4 · Suivi", title: "Piloter", text: "Vous saisissez vos résultats, Benely détecte les écarts et propose où réallouer." },
];

const STATS = [
  { value: "6", label: "étapes, du diagnostic au plan d'action" },
  { value: "18", label: "livrables marketing générés" },
  { value: "7", label: "pays d'Afrique francophone" },
  { value: "14 j", label: "d'essai gratuit, sans carte" },
];

const DELIVERABLES = ["Diagnostic marketing", "Étude de marché", "Analyse concurrentielle", "SWOT", "Objectifs SMART", "Segmentation", "Personas", "Positionnement", "Plateforme de marque", "Stratégie digitale", "Plan de communication", "Plan média", "Campagnes", "Tunnel de conversion", "Calendrier éditorial", "Budget par canal", "KPIs", "Plan d'action"];

/** Flèche dans une pastille ronde, à la fin des boutons principaux. */
const Arrow = () => <span className="arr" aria-hidden="true"><Icon name="arrow-up-right" size={16} /></span>;

export default async function Landing() {
  const offers = await plans();
  return (
    <div className="site">
      <header className="site-nav">
        <Logo />
        <nav className="links" aria-label="Sections">
          <a href="#fonctionnement">Fonctionnement</a>
          <a href="#afrique">Pensé pour l'Afrique</a>
          <a href="#livrables">Livrables</a>
          <a href="#tarifs">Tarifs</a>
        </nav>
        <div className="actions">
          <ThemeToggle />
          <Link href="/auth/login" className="btn btn-ghost">Se connecter</Link>
          <Link href="/auth/signup" className="btn btn-orange btn-pill">Commencer <Arrow /></Link>
          <details className="mobile-menu">
            <summary className="icon-btn" aria-label="Menu">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h10" /></svg>
            </summary>
            <nav className="panel" aria-label="Menu">
              <a href="#fonctionnement">Fonctionnement</a>
              <a href="#afrique">Pensé pour l'Afrique</a>
              <a href="#livrables">Livrables</a>
              <a href="#tarifs">Tarifs</a>
              <Link href="/auth/login">Se connecter</Link>
              <Link href="/auth/signup" className="btn btn-orange">Commencer l'essai gratuit</Link>
            </nav>
          </details>
        </div>
      </header>

      <section className="hero">
        <div className="clouds" aria-hidden="true"><i /><i /><i /><i /><i /></div>
        <div className="hero-grid">
          <div className="hero-copy">
            <span className="eyebrow"><span className="dot" /> Copilote marketing IA · Côte d'Ivoire & Afrique francophone</span>
            <h1 aria-label="Votre direction marketing, propulsée par l'IA.">
              <span aria-hidden="true">
                <span className="w" style={{ "--i": 0 } as React.CSSProperties}>Votre</span>{" "}
                <span className="w" style={{ "--i": 1 } as React.CSSProperties}>direction</span>{" "}
                <span className="w" style={{ "--i": 2 } as React.CSSProperties}>marketing,</span>{" "}
                <span className="w" style={{ "--i": 3 } as React.CSSProperties}>propulsée</span>{" "}
                <span className="w" style={{ "--i": 4 } as React.CSSProperties}>par</span>{" "}
                <span className="w hl" style={{ "--i": 5 } as React.CSSProperties}>l'IA.</span>
              </span>
            </h1>
            <p className="lead">Benely analyse votre entreprise et votre marché, construit une stratégie complète, puis l'ajuste avec vos résultats. Pour les PME, startups, grandes entreprises et agences.</p>
            <div className="ctas">
              <Link href="/auth/signup" className="btn btn-orange btn-pill btn-lg">Commencer gratuitement <Arrow /></Link>
              <a href="#fonctionnement" className="btn btn-glass btn-lg">Comment ça marche</a>
            </div>
            <div className="trust"><span><Icon name="check" size={16} /> 14 jours gratuits</span><span><Icon name="check" size={16} /> Orange Money · MTN · Moov · Wave</span><span><Icon name="check" size={16} /> Budgets en FCFA</span></div>
          </div>

          <div className="hero-visual" aria-hidden="true">
            <div className="sky-card">
              <div className="sky-card-inner">
                <div className="cloud-seat"><i /><i /><i /></div>
                <MascotGuide height={210} />
              </div>
            </div>
            <div className="floaty f1">
              <span className="label">Budget du mois <em>Actif</em></span>
              <b>150 000 <small>FCFA</small></b>
              <div className="split"><i style={{ width: "40%" }} /><i style={{ width: "35%" }} /><i style={{ width: "25%" }} /></div>
              <small className="legend">WhatsApp 40 % · TikTok 35 % · Facebook 25 %</small>
            </div>
            <div className="floaty f2">
              <span className="label">Nouveaux clients <em className="up">↑ +32 %</em></span>
              <b>124</b>
              <svg viewBox="0 0 160 44" width="160" height="44"><path className="chart-line" d="M0 38 L20 32 L40 34 L60 24 L80 27 L100 16 L120 19 L140 8 L160 4" fill="none" strokeWidth="2.5" /></svg>
            </div>
            <div className="floaty f3">
              <span className="wa-av">W</span>
              <span>« Je veux commander ! »<small>WhatsApp Business · 09:41</small></span>
            </div>
          </div>
        </div>
      </section>

      <section className="stats" aria-label="Benely en chiffres">
        {STATS.map((s, i) => (
          <div key={s.label} data-reveal style={{ "--d": `${i * 80}ms` } as React.CSSProperties}><b>{s.value}</b><span>{s.label}</span></div>
        ))}
      </section>

      <div className="marquee" aria-label="Canaux et moyens de paiement pris en compte">
        <div className="track">{[...MARQUEE, ...MARQUEE].map((m, i) => <span key={i} aria-hidden={i >= MARQUEE.length || undefined}>{m}</span>)}</div>
      </div>

      <section className="section" id="afrique">
        <div className="center-head" data-reveal>
          <span className="kicker">Pensé pour l'Afrique</span>
          <h2 className="big">Un copilote <span className="chip-ico blue"><Icon name="spark" size={18} /></span> qui parle à vos clients <span className="soft">là où ils sont <span className="chip-ico orange"><Icon name="globe" size={18} /></span> et comme ils paient.</span></h2>
        </div>
        <div className="bento">
          <article className="bento-card b-sky" data-reveal>
            <Mascot pose="wave" height={190} motion="float" className="b-ben" />
            <div className="b-note"><b>WhatsApp, TikTok, radio</b><span>Les canaux qui comptent ici, pas ceux d'ailleurs.</span></div>
          </article>
          <article className="bento-card b-soft" data-reveal style={{ "--d": "80ms" } as React.CSSProperties}>
            <span className="b-label">Transparence</span>
            <b className="b-num">100 %</b>
            <div className="b-badges"><span className="badge badge-fait">Fait</span><span className="badge badge-estimation">Estimation</span><span className="badge badge-hypothese">Hypothèse</span></div>
            <p>Chaque affirmation est qualifiée: vous savez ce qui est sûr et ce qui reste à vérifier.</p>
          </article>
          <div className="b-col">
            <article className="bento-card b-orange" data-reveal style={{ "--d": "160ms" } as React.CSSProperties}>
              <span className="b-label">Monnaie locale</span>
              <b className="b-num">FCFA</b>
              <p>Budgets et campagnes calculés dans votre devise, selon le pouvoir d'achat réel.</p>
            </article>
            <article className="bento-card b-night" data-reveal style={{ "--d": "240ms" } as React.CSSProperties}>
              <span className="b-label">Pays couverts</span>
              <b className="b-num">7</b>
            </article>
          </div>
        </div>
      </section>

      <section className="section steps-band" id="fonctionnement">
        <div className="clouds" aria-hidden="true"><i /><i /><i /></div>
        <div className="center-head on-dark" data-reveal>
          <span className="kicker">Comment ça marche</span>
          <h2 className="big">Du diagnostic au pilotage, une seule plateforme.</h2>
          <p>Quatre étapes simples pour passer de l'intuition à une stratégie chiffrée.</p>
        </div>
        <div className="step-cards">
          {STEPS.map((s, i) => (
            <article key={s.title} className="step" data-reveal style={{ "--d": `${i * 90}ms` } as React.CSSProperties}>
              <span className="step-ico"><Icon name={s.icon} size={22} /></span>
              <span className="step-tag">{s.tag}</span>
              <h3>{s.title}</h3>
              <p>{s.text}</p>
              <Link href="/auth/signup" className="btn btn-dark btn-pill btn-sm">Essayer <Arrow /></Link>
              <Mascot pose={s.pose} height={104} motion="none" className="peek" />
            </article>
          ))}
        </div>
      </section>

      <section className="section" id="livrables">
        <div className="center-head" data-reveal>
          <span className="kicker">Livrables</span>
          <h2 className="big">Tout un département marketing, <span className="soft">en un dossier.</span></h2>
          <p className="muted">Modifiez, régénérez, exportez en PDF, Word ou Excel.</p>
        </div>
        <div className="chips" data-reveal>{DELIVERABLES.map((d) => <span key={d}><Icon name="check" size={15} /> {d}</span>)}</div>
      </section>

      <section className="section">
        <div className="promo" data-reveal>
          <div className="copy">
            <span className="kicker on-orange">Votre copilote</span>
            <h2>BEN ne vous lâche pas.</h2>
            <p>Il signale les données manquantes, sépare les faits des hypothèses et vous prévient quand une campagne décroche.</p>
            <Link href="/auth/signup" className="btn btn-dark btn-pill">Rencontrer BEN <Arrow /></Link>
          </div>
          <div className="mascots" aria-hidden="true">
            <Mascot pose="think" height={170} motion="sway" />
            <Mascot pose="wave" height={220} motion="float" />
            <Mascot pose="point" height={180} motion="sway" style={{ animationDelay: "-1.2s" }} />
          </div>
        </div>
      </section>

      <section className="section" id="tarifs">
        <div className="center-head" data-reveal>
          <span className="kicker">Tarifs</span>
          <h2 className="big">Simple, en FCFA, <span className="soft">sans engagement.</span></h2>
          <p className="muted">14 jours d'essai gratuit. Paiement par Orange Money, MTN MoMo, Moov Money, Wave ou carte bancaire.</p>
        </div>
        <div className="pricing">
          {offers.map((p) => (
            <article key={p.id} className={`price ${p.id === "business" ? "featured" : ""}`} data-reveal>
              {p.id === "business" && <Mascot pose="point" height={100} motion="float" className="perch" />}
              <div className="row" style={{ justifyContent: "space-between" }}>
                <h3>{p.name}</h3>
                {p.id === "business" && <span className="badge badge-sun">Le plus choisi</span>}
              </div>
              <p className="plan-text">{PLAN_TEXT[p.id] ?? ""}</p>
              <div className="amount">{p.price_monthly ? <>{formatMoney(p.price_monthly, p.currency)} <small>/ mois</small></> : "Sur devis"}</div>
              <ul>{(Object.keys(QUOTA_LABELS) as QuotaKind[]).map((k) => <li key={k}><Icon name="check" size={16} /> {QUOTA_LABELS[k]}: {p.quotas[k] ?? "illimité"}</li>)}</ul>
              {p.price_monthly
                ? <Link href="/auth/signup" className={`btn btn-pill ${p.id === "business" ? "btn-orange" : "btn-dark"}`}>Commencer <Arrow /></Link>
                : <a href={`mailto:${CONTACT_EMAIL}`} className="btn btn-ghost">Nous contacter</a>}
            </article>
          ))}
        </div>
      </section>

      <section className="cta-band" data-reveal>
        <div className="blobs" aria-hidden="true"><i /><i /><i /></div>
        <Mascot pose="happy" height={150} motion="bounce" className="jump" />
        <h2>Tout commence par un diagnostic.</h2>
        <p>Découvrez en quelques minutes où agir en priorité.</p>
        <Link href="/auth/signup" className="btn btn-orange btn-pill btn-lg">Lancer mon diagnostic <Arrow /></Link>
      </section>

      <footer className="footer">
        <div className="cols">
          <Logo variant="white" height={26} href={null} />
          <Socials />
        </div>
        <div className="cols small">
          <span>© {new Date().getFullYear()} Benely · Abidjan</span>
          <span className="row"><Link href="/auth/login">Connexion</Link><Link href="/auth/signup">Créer un compte</Link><a href={`mailto:${CONTACT_EMAIL}`}>Contact</a></span>
        </div>
      </footer>
      <Reveal />
    </div>
  );
}
