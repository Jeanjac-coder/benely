import { createClient } from "@supabase/supabase-js";
import Link from "next/link";
import { Fragment } from "react";
import { Logo } from "@/components/Logo";
import { Icon, type IconName } from "@/components/Icon";
import { Mascot, type Pose } from "@/components/Mascot";
import { BenJourney } from "@/components/BenJourney";
import { Flags } from "@/components/Flags";
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
  { id: "starter", name: "Starter", price_monthly: 9900, currency: "XOF", quotas: { generations: 2, regenerations: 20, exports: 10, members: 2 } },
  { id: "business", name: "Business", price_monthly: 14900, currency: "XOF", quotas: { generations: 6, regenerations: 60, exports: 50, members: 5 } },
  { id: "enterprise", name: "Enterprise", price_monthly: null, currency: "XOF", quotas: { generations: null, regenerations: null, exports: null, members: null } },
];

const PLAN_TEXT: Record<string, string> = {
  starter: "Idéal pour lancer votre marketing en solo ou en petite équipe.",
  business: "Pour les PME et startups qui veulent accélérer, avec un accompagnement renforcé.",
  enterprise: "Pour les groupes et agences qui pilotent plusieurs marques.",
};

// Avantages affichés sous les quotas de chaque offre.
const PLAN_EXTRAS: Record<string, string[]> = {
  starter: [],
  business: ["Support 24h/24", "Experts IA spécialisés à chaque étape", "Suivi des résultats et réallocation du budget"],
  enterprise: ["Support 24h/24", "Interlocuteur dédié", "Multi-marques et multi-organisations", "Onboarding et formation de vos équipes", "Facturation et conditions sur mesure"],
};

const PLAN_CTA: Record<string, string> = { starter: "Choisir Starter", business: "Choisir Business" };

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

const MARQUEE = ["WhatsApp Business", "Instagram", "Orange Money", "Facebook", "TikTok", "MTN MoMo", "LinkedIn", "Wave", "Google", "Moov Money", "SMS", "Site web"];

const STEPS: readonly { icon: IconName; tag: string; title: string; text: string; pose: Pose }[] = [
  { icon: "profile", pose: "think", tag: "Étape 1 · 10 minutes", title: "Comprendre", text: "Vous répondez à quelques questions simples sur votre activité. Vous validez la synthèse avant d'aller plus loin." },
  { icon: "strategy", pose: "point", tag: "Étape 2 · Quelques minutes", title: "Planifier", text: "Audit, marché, clients cibles, marque, plan média et calendrier : un plan complet, cohérent de bout en bout." },
  { icon: "wallet", pose: "happy", tag: "Étape 3 · Clé en main", title: "Lancer", text: "Budget réparti par canal, campagnes prêtes à démarrer et publications déjà rédigées." },
  { icon: "chart", pose: "surprised", tag: "Étape 4 · En continu", title: "Améliorer", text: "Vous saisissez vos résultats : Benely repère ce qui marche et vous dit où réinvestir." },
];

const DELIVERABLES = ["Audit marketing", "Étude de marché", "Analyse concurrentielle", "SWOT", "Objectifs SMART", "Segmentation", "Personas", "Positionnement", "Plateforme de marque", "Stratégie digitale", "Plan de communication", "Plan média", "Campagnes", "Tunnel de conversion", "Calendrier éditorial", "Budget par canal", "KPIs", "Plan d'action"];

/** Flèche dans une pastille ronde, à la fin des boutons principaux. */
const Arrow = () => <span className="arr" aria-hidden="true"><Icon name="arrow-up-right" size={16} /></span>;

const NAV = [
  { href: "#fonctionnement", label: "Comment ça marche" },
  { href: "#pourquoi", label: "Pourquoi Benely" },
  { href: "#livrables", label: "Ce que vous recevez" },
  { href: "#tarifs", label: "Tarifs" },
];

export default async function Landing() {
  const offers = await plans();
  return (
    <div className="site">
      <header className="site-nav">
        <Logo />
        <nav className="links" aria-label="Sections">
          {NAV.map((n) => <a key={n.href} href={n.href}>{n.label}</a>)}
        </nav>
        <div className="actions">
          <ThemeToggle />
          <Link href="/auth/login" className="btn btn-ghost">Connexion</Link>
          <Link href="/auth/signup" className="btn btn-orange btn-pill">Essai gratuit <Arrow /></Link>
          <details className="mobile-menu">
            <summary className="icon-btn" aria-label="Menu">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h10" /></svg>
            </summary>
            <nav className="panel" aria-label="Menu">
              {NAV.map((n) => <a key={n.href} href={n.href}>{n.label}</a>)}
              <Link href="/auth/login">Connexion</Link>
              <Link href="/auth/signup" className="btn btn-orange">Démarrer mon essai gratuit</Link>
            </nav>
          </details>
        </div>
      </header>

      <section className="hero">
        <div className="clouds" aria-hidden="true"><i /><i /><i /><i /><i /></div>
        <div className="hero-grid">
          <div className="hero-copy">
            <span className="eyebrow"><span className="dot" /> Copilote marketing IA · Afrique francophone</span>
            <h1 aria-label="Votre stratégie marketing complète, prête en quelques minutes.">
              <span aria-hidden="true">
                {["Votre", "stratégie", "marketing", "complète,", "prête"].map((w, i) => <Fragment key={w}><span className="w" style={{ "--i": i } as React.CSSProperties}>{w}</span>{" "}</Fragment>)}
                <span className="w hl" style={{ "--i": 5 } as React.CSSProperties}>en quelques minutes.</span>
              </span>
            </h1>
            <p className="lead">Répondez à quelques questions sur votre activité. Benely réalise l'audit de votre marketing, construit votre stratégie, votre plan média et vos publications, puis vous aide à l'ajuster selon vos résultats. Sans agence, sans jargon.</p>
            <div className="ctas">
              <Link href="/auth/signup" className="btn btn-orange btn-pill btn-lg">Démarrer gratuitement <Arrow /></Link>
              <a href="#fonctionnement" className="btn btn-glass btn-lg">Voir comment ça marche</a>
            </div>
            <div className="trust"><span><Icon name="check" size={16} /> 14 jours gratuits</span><span><Icon name="check" size={16} /> Sans carte bancaire</span><span><Icon name="check" size={16} /> Sans engagement</span></div>
          </div>

          <div className="hero-visual" aria-hidden="true">
            <div className="sky-card">
              <div className="sky-card-inner">
                <div className="cloud-seat"><i /><i /><i /></div>
                <MascotGuide height={210} />
              </div>
            </div>
            <div className="floaty f1">
              <span className="label">Plan média du mois <em>Prêt</em></span>
              <b>3 canaux</b>
              <div className="split"><i style={{ width: "40%" }} /><i style={{ width: "35%" }} /><i style={{ width: "25%" }} /></div>
              <small className="legend">WhatsApp 40 % · Instagram 35 % · Facebook 25 %</small>
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
        <div data-reveal><b>6</b><span>étapes, de l'audit au plan d'action</span></div>
        <div data-reveal style={{ "--d": "80ms" } as React.CSSProperties}><b>18</b><span>livrables prêts à l'emploi</span></div>
        <div data-reveal style={{ "--d": "160ms" } as React.CSSProperties}><b>7</b><span>pays d'Afrique francophone</span><Flags size={14} /></div>
        <div data-reveal style={{ "--d": "240ms" } as React.CSSProperties}><b>14 j</b><span>d'essai offerts, sans carte</span></div>
      </section>

      <div className="marquee" aria-label="Canaux et moyens de paiement pris en compte">
        <div className="track">{[...MARQUEE, ...MARQUEE].map((m, i) => <span key={i} aria-hidden={i >= MARQUEE.length || undefined}>{m}</span>)}</div>
      </div>

      <section className="section" id="pourquoi">
        <div className="center-head" data-reveal>
          <span className="kicker">Pourquoi Benely</span>
          <h2 className="big">Une stratégie pensée pour vos clients <span className="chip-ico blue"><Icon name="spark" size={18} /></span> <span className="soft">là où ils sont, et comme ils achètent <span className="chip-ico orange"><Icon name="globe" size={18} /></span></span></h2>
        </div>
        <div className="bento">
          <article className="bento-card b-sky" data-reveal>
            <Mascot pose="wave" height={190} motion="float" className="b-ben" />
            <div className="b-note"><b>WhatsApp, Instagram, Facebook, TikTok</b><span>Les canaux que vos clients utilisent vraiment, au quotidien.</span></div>
          </article>
          <article className="bento-card b-soft" data-reveal style={{ "--d": "80ms" } as React.CSSProperties}>
            <span className="b-label">Transparence</span>
            <b className="b-num">100 %</b>
            <div className="b-badges"><span className="badge badge-fait">Fait</span><span className="badge badge-estimation">Estimation</span><span className="badge badge-hypothese">Hypothèse</span></div>
            <p>Chaque recommandation indique s'il s'agit d'un fait, d'une estimation ou d'une hypothèse. Vous décidez en toute confiance.</p>
          </article>
          <div className="b-col">
            <article className="bento-card b-orange" data-reveal style={{ "--d": "160ms" } as React.CSSProperties}>
              <span className="b-label">Paiement local</span>
              <b className="b-num">Mobile Money</b>
              <p>Réglez votre abonnement avec Orange Money, MTN MoMo, Moov Money, Wave ou par carte.</p>
            </article>
            <article className="bento-card b-night" data-reveal style={{ "--d": "240ms" } as React.CSSProperties}>
              <span className="b-label">Pays couverts</span>
              <Flags size={18} />
              <b className="b-num">7</b>
            </article>
          </div>
        </div>
      </section>

      <section className="section steps-band" id="fonctionnement">
        <div className="clouds" aria-hidden="true"><i /><i /><i /></div>
        <div className="center-head on-dark" data-reveal>
          <span className="kicker">Comment ça marche</span>
          <h2 className="big">De l'audit aux résultats, en 4 étapes simples.</h2>
          <p>Pas besoin d'être expert : Benely vous guide pas à pas, et vous gardez la main à chaque étape.</p>
        </div>
        <div className="step-cards">
          {STEPS.map((s, i) => (
            <article key={s.title} className="step" data-reveal style={{ "--d": `${i * 90}ms` } as React.CSSProperties}>
              <span className="step-ico"><Icon name={s.icon} size={22} /></span>
              <span className="step-tag">{s.tag}</span>
              <h3>{s.title}</h3>
              <p>{s.text}</p>
              <Link href="/auth/signup" className="btn btn-dark btn-pill btn-sm">Essayer gratuitement <Arrow /></Link>
              <Mascot pose={s.pose} height={104} motion="none" className="peek" />
            </article>
          ))}
        </div>
      </section>

      <section className="section" id="livrables">
        <div className="center-head" data-reveal>
          <span className="kicker">Ce que vous recevez</span>
          <h2 className="big">Tout un service marketing, <span className="soft">réuni dans un seul dossier.</span></h2>
          <p className="muted">Modifiez chaque livrable, régénérez-le en un clic et exportez-le en PDF, Word ou Excel pour le partager avec votre équipe.</p>
        </div>
        <div className="chips" data-reveal>{DELIVERABLES.map((d) => <span key={d}><Icon name="check" size={15} /> {d}</span>)}</div>
      </section>

      <section className="section">
        <div className="promo" data-reveal>
          <div className="copy">
            <span className="kicker on-orange">Votre copilote</span>
            <h2>BEN reste à vos côtés, jour après jour.</h2>
            <p>Il vous signale les informations manquantes, distingue les faits des hypothèses et vous alerte dès qu'une campagne ralentit. Vous n'êtes jamais seul face à vos décisions.</p>
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
          <h2 className="big">Des offres simples, <span className="soft">sans engagement.</span></h2>
          <p className="muted">Commencez par 14 jours d'essai gratuit, sans carte bancaire. Payez ensuite par Orange Money, MTN MoMo, Moov Money, Wave ou carte bancaire.</p>
        </div>
        <div className="pricing">
          {offers.map((p) => (
            <article key={p.id} className={`price ${p.id === "business" ? "featured" : ""}`} data-reveal>
              {p.id === "business" && <Mascot pose="point" height={100} motion="float" className="perch" />}
              <div className="row" style={{ justifyContent: "space-between" }}>
                <h3>{p.name}</h3>
                {p.id === "business" && <span className="badge badge-sun">Recommandé</span>}
              </div>
              <p className="plan-text">{PLAN_TEXT[p.id] ?? ""}</p>
              <div className="amount">{p.price_monthly ? <>{formatMoney(p.price_monthly, p.currency)} <small>/ mois</small></> : "Sur devis"}</div>
              <ul>
                {(Object.keys(QUOTA_LABELS) as QuotaKind[]).map((k) => <li key={k}><Icon name="check" size={16} /> {QUOTA_LABELS[k]}: {p.quotas[k] ?? "illimité"}</li>)}
                {(PLAN_EXTRAS[p.id] ?? []).map((x) => <li key={x} className="extra"><Icon name="check" size={16} /> {x}</li>)}
              </ul>
              {p.price_monthly
                ? <Link href="/auth/signup" className={`btn btn-pill ${p.id === "business" ? "btn-orange" : "btn-dark"}`}>{PLAN_CTA[p.id] ?? "Choisir cette offre"} <Arrow /></Link>
                : <a href={`mailto:${CONTACT_EMAIL}`} className="btn btn-ghost">Parler à un conseiller</a>}
            </article>
          ))}
        </div>
        <p className="muted small center-note">Essai gratuit de 14 jours sur toutes les offres. Vous changez d'offre ou arrêtez quand vous voulez.</p>
      </section>

      <section className="cta-band" data-reveal>
        <div className="blobs" aria-hidden="true"><i /><i /><i /></div>
        <h2>Tout commence par un audit gratuit.</h2>
        <p>En quelques minutes, découvrez où concentrer vos efforts et votre budget.</p>
        <Link href="/auth/signup" className="btn btn-orange btn-pill btn-lg">Lancer mon audit gratuit <Arrow /></Link>
      </section>

      <footer className="footer">
        <div className="footer-ben" aria-hidden="true"><Mascot pose="happy" height={96} motion="float" /></div>
        <div className="cols">
          <div className="footer-brand">
            <Logo variant="white" height={26} href={null} />
            <p>Le copilote marketing des entreprises d'Afrique francophone.</p>
            <Flags size={14} />
          </div>
          <Socials />
        </div>
        <div className="cols small">
          <span>© {new Date().getFullYear()} Benely · Abidjan</span>
          <span className="row"><Link href="/auth/login">Connexion</Link><Link href="/auth/signup">Essai gratuit</Link><a href={`mailto:${CONTACT_EMAIL}`}>Contact</a></span>
        </div>
      </footer>
      <Reveal />
      <BenJourney />
    </div>
  );
}
