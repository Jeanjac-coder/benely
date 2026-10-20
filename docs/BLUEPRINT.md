# Benely — Blueprint produit

Copilote stratégique Marketing & Communication propulsé par l'IA pour les entreprises africaines (startups, PME, grandes entreprises).

## 1. Boucle produit

```
Onboarding → Collecte de contexte → Génération de stratégie → Exécution → Mesure → Détection d'écarts → Ajustement → (boucle)
```

La valeur n'est pas le plan initial mais la boucle continue: la plateforme compare les résultats réels aux objectifs et réajuste budgets, contenus et priorités.

## 2. Modules

| Module | Contenu | État MVP |
|---|---|---|
| Onboarding | Profil entreprise, pays, budget, objectifs, canaux, langues, concurrents | Fait |
| Moteur de stratégie | Étude de marché, SWOT, concurrence, personas, segmentation, positionnement, marque, canaux, contenu, calendrier, tunnel, budget, KPIs, plan d'exécution | Fait (Claude, sortie JSON) |
| Contexte Afrique | Langues, mobile money, canaux dominants par pays | Fait (7 pays + « Autre ») |
| Suivi de performance | Saisie dépenses/conversions par canal, écarts vs objectifs | Fait (saisie manuelle) |
| Optimiseur | Réallocation budgétaire plafonnée par cycle, alertes | Fait (règles déterministes, testé) |
| Connecteurs de données | Meta Ads, Google Ads, TikTok, GA4, WhatsApp Business, mobile money | À faire |
| Veille concurrentielle | Collecte automatique (réseaux, sites, bibliothèques publicitaires) | À faire |
| Génération de contenu | Posts, scripts, visuels, traductions (français, anglais, langues locales) | À faire |
| Comptes & équipes | Auth, multi-tenant, rôles, facturation | À faire |

## 3. Architecture cible

- **Front**: Next.js, mobile-first, léger (réseaux lents, forfaits data limités), PWA.
- **API / orchestration**: routes serveur, file de jobs pour les générations longues et les synchronisations.
- **IA**: API Claude. Génération structurée (JSON validé), puis analyse périodique des performances. Les décisions chiffrées (réallocation) restent déterministes et auditables; l'IA explique et propose.
- **Données**: Postgres (multi-tenant, row-level security) pour profils, stratégies versionnées, métriques, historique des ajustements. Le MVP utilise `localStorage` pour rester sans backend.
- **Ingestion**: connecteurs API ad platforms + analytics, normalisés en une table `channel_metrics(date, channel, spend, impressions, clicks, conversions)`.
- **Sécurité**: clés API côté serveur uniquement, chiffrement des jetons de connecteurs, journal des actions automatiques.

## 4. Spécificités africaines à intégrer

- Mobile-first, WhatsApp comme canal commercial central, USSD/SMS hors zones urbaines.
- Mobile money (Orange Money, MTN MoMo, Wave, M-Pesa) dans le tunnel de conversion.
- Multilinguisme: français, anglais, pidgin, wolof, swahili, haoussa, etc.
- Pouvoir d'achat: budgets en USD et devise locale, offres adaptées aux paliers de prix locaux.
- Différences pays/villes, radio et affichage en complément du digital.
- Fiabilité des données: indiquer les hypothèses, ne pas inventer de statistiques; enrichir progressivement avec des sources locales vérifiées.

## 5. Décisions automatiques: garde-fous

- Plafond de variation de budget par cycle (15 % de la part d'un canal).
- Les ajustements sont proposés, validés par l'utilisateur dans un premier temps; l'automatisation complète viendra avec les connecteurs d'écriture.
- Historique des ajustements et de leur effet pour apprendre ce qui marche par secteur et pays.

## 6. Roadmap

1. **MVP (ce dépôt)**: onboarding, stratégie complète, suivi manuel, optimiseur.
2. **V1**: auth, base Postgres, stratégies versionnées, export PDF, tableaux de bord.
3. **V2**: connecteurs Meta/Google/TikTok/GA4, import automatique des métriques, alertes e-mail/WhatsApp.
4. **V3**: veille concurrentielle, génération de contenu multilingue, publication programmée.
5. **V4**: apprentissage inter-entreprises (données agrégées et anonymisées), benchmarks par secteur et pays, pilotage semi-automatique des campagnes.

## 7. Modèle économique (hypothèse)

Abonnement par palier (Starter / Growth / Enterprise) selon le nombre de marques, connecteurs et volume de générations; paiement par mobile money et carte; prix indexés au pouvoir d'achat local.

## 8. Risques

- Qualité des données de marché disponibles: prévoir sources locales et validation humaine.
- Dépendance aux API des plateformes publicitaires (quotas, politiques).
- Confiance: expliquer chaque recommandation et garder l'utilisateur dans la boucle.
