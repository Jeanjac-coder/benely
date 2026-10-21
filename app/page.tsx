import { createClient } from "@supabase/supabase-js";
import Link from "next/link";
import { Icon } from "@/components/Icon";
import { Logo } from "@/components/Logo";
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

const STEPS = [
  { color: "electra", tags: ["Étape 1", "10 minutes"], title: "Comprendre", text: "Un questionnaire qui s'adapte à vos réponses, puis une synthèse que vous validez.", visual: ["Secteur: Boissons", "Zone: Grand Abidjan", "Budget: 150 000 FCFA / mois"] },
  { color: "almond", tags: ["Étape 2", "IA"], title: "Planifier", text: "Diagnostic, marché, personas, marque, plan média et calendrier, cohérents entre eux.", visual: ["✓ Diagnostic", "✓ Étude de marché", "✓ Plateforme de marque", "… Calendrier éditorial"] },
  { color: "azure", tags: ["Étape 3", "Budget"], title: "Exécuter", text: "Budget en FCFA réparti par canal, campagnes prêtes, publications rédigées.", visual: ["WhatsApp Business · 40 %", "TikTok · 35 %", "Facebook · 25 %"] },
  { color: "firecracker", tags: ["Étape 4", "Suivi"], title: "Piloter", text: "Vous saisissez vos résultats, Benely détecte les écarts et propose où réallouer.", visual: ["TikTok: coût par client −32 %", "→ +15 % de budget suggéré"] },
] as const;

const DELIVERABLES = ["Diagnostic marketing", "Étude de marché", "Analyse concurrentielle", "SWOT", "Objectifs SMART", "Segmentation", "Personas", "Positionnement", "Plateforme de marque", "Stratégie digitale", "Plan de communication", "Plan média", "Campagnes", "Tunnel de conversion", "Calendrier éditorial", "Budget par canal", "KPIs", "Plan d'action"];

export default async function Landing() {
  const offers = await plans();
  return (
    <div className="site">
      <header className="site-nav">
        <Logo />
        <nav className="links" aria-label="Sections">
          <a href="#fonctionnement">Fonctionnement</a>
          <a href="#livrables">Livrables</a>
          <a href="#afrique">Pensé pour l'Afrique</a>
          <a href="#tarifs">Tarifs</a>
        </nav>
        <div className="actions">
          <Link href="/auth/login" className="btn btn-ghost">Se connecter</Link>
          <Link href="/auth/signup" className="btn btn-dark">Essai gratuit</Link>
        </div>
      </header>

      <section className="hero">
        <div className="grid-bg" />
        <span className="eyebrow"><span className="dot" /> Copilote marketing IA · Côte d'Ivoire & Afrique francophone</span>
        <h1>
          Votre direction marketing,{" "}
          <span className="scribble">propulsée
            <svg viewBox="0 0 300 30" preserveAspectRatio="none" aria-hidden="true"><path d="M4 22 C 70 6, 150 4, 296 14" stroke="#FF5500" strokeWidth="7" fill="none" strokeLinecap="round" /></svg>
          </span>{" "}
          par <span className="hl">l'IA</span>.
        </h1>
        <p className="lead">Benely analyse votre entreprise et votre marché, construit une stratégie complète, puis l'ajuste avec vos résultats. Pour les PME, startups, grandes entreprises et agences.</p>
        <div className="ctas">
          <Link href="/auth/signup" className="btn btn-light btn-lg">Commencer l'essai gratuit <Icon name="arrow" /></Link>
          <a href="#fonctionnement" className="btn btn-lg" style={{ background: "rgba(255,255,255,.12)", border: "1px solid rgba(255,255,255,.3)" }}>Voir comment ça marche</a>
        </div>
        <div className="trust">
          <span>14 jours gratuits</span><span>Paiement Orange Money · MTN · Moov · Wave</span><span>Budgets en FCFA</span><span>Exports PDF · Word · Excel</span>
        </div>
        <div className="sticker" aria-hidden="true">Stratégie<br />en 6 étapes</div>

        <div className="mock" aria-hidden="true">
          <div className="mock-bar"><i /><i /><i /><span className="url">app.benely.africa/tableau-de-bord</span></div>
          <div className="mock-body">
            <div className="mock-card">
              <h4>Bonjour Awa — Kôkô Jus, Abidjan</h4>
              <div className="mock-kpis">
                <div>Budget mensuel<b>150 000 F</b></div>
                <div>Nouveaux clients<b>+124</b></div>
                <div>Publications<b>16</b></div>
              </div>
              <svg viewBox="0 0 400 110" width="100%" height="110">
                <defs><linearGradient id="g" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#1010FF" stopOpacity=".25" /><stop offset="1" stopColor="#1010FF" stopOpacity="0" /></linearGradient></defs>
                <path d="M0 90 L30 80 L60 84 L90 66 L120 70 L150 52 L180 58 L210 40 L240 46 L270 30 L300 34 L330 20 L360 24 L400 8 L400 110 L0 110Z" fill="url(#g)" />
                <path d="M0 90 L30 80 L60 84 L90 66 L120 70 L150 52 L180 58 L210 40 L240 46 L270 30 L300 34 L330 20 L360 24 L400 8" stroke="#1010FF" strokeWidth="2.5" fill="none" />
                <circle cx="270" cy="30" r="5" fill="#FF5500" />
              </svg>
            </div>
            <div className="mock-card">
              <h4>Répartition du budget</h4>
              <svg viewBox="0 0 120 120" width="120" height="120" style={{ margin: "4px auto 8px", display: "block" }}>
                <circle cx="60" cy="60" r="44" fill="none" stroke="#F4F7FC" strokeWidth="18" />
                <circle cx="60" cy="60" r="44" fill="none" stroke="#1010FF" strokeWidth="18" strokeDasharray="110 277" transform="rotate(-90 60 60)" />
                <circle cx="60" cy="60" r="44" fill="none" stroke="#FFB000" strokeWidth="18" strokeDasharray="97 277" strokeDashoffset="-110" transform="rotate(-90 60 60)" />
                <circle cx="60" cy="60" r="44" fill="none" stroke="#A4D0FF" strokeWidth="18" strokeDasharray="70 277" strokeDashoffset="-207" transform="rotate(-90 60 60)" />
                <text x="60" y="66" textAnchor="middle" fontSize="20" fontWeight="800" fill="#0B0B1F">40 %</text>
              </svg>
              <div className="small"><span className="badge badge-fait">WhatsApp 40 %</span> <span className="badge badge-hypothese">TikTok 35 %</span> <span className="badge badge-estimation">Facebook 25 %</span></div>
            </div>
          </div>
        </div>
      </section>

      <section className="section" id="fonctionnement">
        <div className="section-head">
          <div><span className="kicker">Comment ça marche</span><h2 className="big">Du diagnostic au pilotage, une seule plateforme.</h2></div>
          <Link href="/auth/signup" className="btn btn-dark">Essayer gratuitement</Link>
        </div>
        <div className="cards">
          {STEPS.map((s) => (
            <article key={s.title} className={`tile ${s.color}`}>
              <div className="tags">{s.tags.map((t) => <span key={t}>{t}</span>)}</div>
              <h3>{s.title}</h3>
              <p>{s.text}</p>
              <div className="visual">{s.visual.map((v) => <div key={v}>{v}</div>)}</div>
            </article>
          ))}
        </div>
      </section>

      <section className="section" id="livrables">
        <div className="section-head">
          <div><span className="kicker">Livrables</span><h2 className="big">Tout un département marketing, en un dossier.</h2></div>
          <p className="muted" style={{ maxWidth: 380 }}>Chaque affirmation est qualifiée de fait, d'estimation ou d'hypothèse. Modifiez, régénérez, exportez en PDF, Word ou Excel.</p>
        </div>
        <div className="chips">{DELIVERABLES.map((d) => <span key={d}>{d}</span>)}</div>
      </section>

      <section className="section" id="afrique">
        <div className="africa">
          <div>
            <span className="kicker">Pensé pour l'Afrique</span>
            <h2 className="big" style={{ fontSize: "clamp(1.8rem, 3.4vw, 2.8rem)" }}>Vos clients sont sur WhatsApp, paient en Mobile Money et parlent plusieurs langues.</h2>
            <p className="muted">Benely en tient compte: canaux locaux, pouvoir d'achat, écarts entre Abidjan et l'intérieur du pays, nouchi, wolof ou dioula dans les contenus.</p>
          </div>
          <div className="grid" style={{ gap: 12 }}>
            <div className="stat"><b>FCFA</b>Budgets et campagnes dans votre devise</div>
            <div className="stat"><b>7 pays</b>Côte d'Ivoire, Sénégal, Cameroun, Burkina Faso, Mali, Bénin, Togo</div>
            <div className="stat"><b>Mobile</b>Une expérience pensée pour les connexions variables</div>
            <div className="stat"><b>Local</b>WhatsApp Business, TikTok, radio, affichage</div>
          </div>
        </div>
      </section>

      <section className="section" id="tarifs">
        <div className="section-head">
          <div><span className="kicker">Tarifs</span><h2 className="big">Simple, en FCFA, sans engagement.</h2></div>
          <p className="muted" style={{ maxWidth: 380 }}>14 jours d'essai gratuit. Paiement par Orange Money, MTN MoMo, Moov Money, Wave ou carte bancaire.</p>
        </div>
        <div className="pricing">
          {offers.map((p) => (
            <article key={p.id} className={`price ${p.id === "business" ? "featured" : ""}`}>
              <div className="row" style={{ justifyContent: "space-between" }}>
                <h3 style={{ margin: 0, fontSize: "1.3rem" }}>{p.name}</h3>
                {p.id === "business" && <span className="badge" style={{ background: "var(--firecracker)", color: "var(--ink)" }}>Le plus choisi</span>}
              </div>
              <p className="muted" style={{ margin: 0 }}>{PLAN_TEXT[p.id] ?? ""}</p>
              <div className="amount">{p.price_monthly ? <>{formatMoney(p.price_monthly, p.currency)} <small>/ mois</small></> : "Sur devis"}</div>
              <ul>{(Object.keys(QUOTA_LABELS) as QuotaKind[]).map((k) => <li key={k}>{QUOTA_LABELS[k]}: {p.quotas[k] ?? "illimité"}</li>)}</ul>
              {p.price_monthly
                ? <Link href="/auth/signup" className={`btn ${p.id === "business" ? "btn-light" : "btn-dark"}`}>Commencer</Link>
                : <a href="mailto:contact@benely.africa" className="btn btn-ghost">Nous contacter</a>}
            </article>
          ))}
        </div>
      </section>

      <section className="cta-band">
        <h2>Prêt à donner un vrai cap à votre marketing ?</h2>
        <Link href="/auth/signup" className="btn btn-dark btn-lg">Créer mon compte <Icon name="arrow" /></Link>
      </section>

      <footer className="footer">
        <Logo variant="white" height={26} />
        <span>© {new Date().getFullYear()} Benely · Abidjan</span>
        <span className="row"><Link href="/auth/login" style={{ color: "#fff" }}>Connexion</Link><a href="mailto:contact@benely.africa" style={{ color: "#fff" }}>Contact</a></span>
      </footer>
    </div>
  );
}
