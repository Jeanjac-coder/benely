import Link from "next/link";

export default function Landing() {
  return (
    <main>
      <section className="hero">
        <h1>Votre direction marketing, propulsée par l'IA</h1>
        <p className="muted">Benely analyse votre entreprise et votre marché, puis construit une stratégie marketing et communication complète, adaptée aux réalités de la Côte d'Ivoire et de l'Afrique francophone: diagnostic, étude de marché, personas, plateforme de marque, plan média, calendrier éditorial et budget en FCFA.</p>
        <div className="row">
          <Link href="/auth/signup"><button>Créer un compte</button></Link>
          <Link href="/auth/login">Se connecter</Link>
        </div>
      </section>
      <section className="grid">
        <div className="card"><h2>Comprendre</h2><p>Un questionnaire qui s'adapte à vos réponses, et une synthèse que vous validez avant toute génération.</p></div>
        <div className="card"><h2>Planifier</h2><p>Objectifs SMART, stratégie, marque, campagnes et calendrier éditorial cohérents entre eux, avec les faits distingués des hypothèses.</p></div>
        <div className="card"><h2>Piloter</h2><p>Budget ajustable, suivi des résultats et recommandations de réallocation.</p></div>
        <div className="card"><h2>Pensé pour l'Afrique</h2><p>WhatsApp, mobile money, langues locales, pouvoir d'achat et différences entre villes et pays.</p></div>
      </section>
    </main>
  );
}
