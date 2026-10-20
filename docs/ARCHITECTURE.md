# Benely — architecture V1

Référence: cahier des charges « Plateforme SaaS IA de stratégie marketing et communication », v1.0.

## Choix techniques

| Couche | Cahier des charges | Retenu | Raison |
|---|---|---|---|
| Frontend | Next.js, React, TypeScript, Tailwind, shadcn/ui | Next.js 14, React, TypeScript, CSS simple | Tailwind/shadcn à introduire avec les maquettes validées (phase UX/UI). |
| Backend / API | Python, FastAPI | Route handlers Next.js | Une seule base de code TypeScript pour le MVP; un service Python pourra porter l'analytique V2. |
| Données | PostgreSQL | Supabase Postgres + RLS | Isolation multi-tenant appliquée par la base elle-même. |
| Auth / stockage | Supabase Auth / Storage | Supabase Auth | Storage arrivera avec les logos pour les exports. |
| IA | OpenAI, LangGraph | API Claude, workflows orchestrés en code | Décision validée au cadrage; les « agents » V1 sont des workflows spécialisés sur un même modèle (§6). |

## Organisation du code

```
lib/ai/schemas.ts      Schémas Zod des six livrables (= format de sortie imposé au modèle)
lib/ai/prompts.ts      Prompt système, contexte entreprise/pays, consignes par étape
lib/ai/client.ts       Appel Claude (sortie structurée, repli serveur en cas de refus, erreurs explicites)
lib/ai/research.ts     Recherche web optionnelle pour sourcer l'étude de marché
lib/ai/pipeline.ts     Exécution d'une étape et assemblage des livrables
lib/ai/coherence.ts    Contrôles déterministes de cohérence entre livrables
lib/questionnaire.ts   Questions complémentaires dynamiques, données manquantes, synthèse
lib/budget.ts          Répartition budgétaire (parts, verrous, montants)
lib/optimizer.ts       Écarts aux objectifs et réallocation suggérée
lib/context.ts         Utilisateur, organisation active et rôle
supabase/migrations    Schéma, fonctions et politiques RLS
```

## Chaîne de génération (§6)

Collecte (profil + questionnaire) → synthèse validée par l'utilisateur → identification des données manquantes → recherche externe (si activée) → six étapes: diagnostic, marché, stratégie, marque, plan média, contenu → contrôle de cohérence → sauvegarde en version 1 → édition.

- **Asynchrone avec progression:** `POST /api/jobs` crée une génération; le navigateur appelle `POST /api/jobs/:id/run` étape par étape. Chaque appel est court, l'état est persisté, une génération peut être reprise après fermeture de la page, et deux exécutions simultanées sont empêchées.
- **Fiabilité:** chaque affirmation de l'étude de marché porte sa nature (fait, estimation, hypothèse) et sa source. Les contrôles de cohérence signalent notamment les faits non sourcés, les budgets dépassés, les parts qui ne totalisent pas 100 %, les dates hors période et les canaux absents du plan média.
- **Erreurs (T13):** les erreurs du service IA sont traduites en messages explicites; l'étape en échec se relance sans perdre les précédentes.
- **Coûts:** la consommation de jetons est enregistrée par organisation et par étape (`ai_usage`), le contexte entreprise est mis en cache entre étapes.

## Isolation des données (§3, §9, T11)

Toutes les tables métier portent `org_id`; les politiques RLS limitent lecture et écriture aux membres de l'organisation. Des clés étrangères composites `(strategy_id, org_id)` empêchent de rattacher une donnée à la stratégie d'une autre organisation. Rôles: propriétaire, administrateur (gère membres et invitations), collaborateur. Le test `supabase/tests/rls_test.sql` vérifie ces règles.

## Couverture du V1

| Module | État |
|---|---|
| 01 Authentification et comptes | Fait: inscription avec vérification e-mail, connexion, réinitialisation, organisations multiples, invitations par lien, rôles. Envoi des invitations par e-mail: à faire. |
| 02 Profil et diagnostic | Fait: profil, questionnaire dynamique, synthèse modifiable à valider. |
| 03 Génération stratégique | Fait: diagnostic, marché, SWOT, concurrence, personas, segmentation, positionnement, objectifs SMART, stratégies marketing/digitale/communication, plan d'action, marque. |
| 04 Contenu | Fait: piliers et calendrier sur 7 jours, 30 jours, 3 mois ou période libre; chaque entrée complète; modification et régénération. |
| 05 Campagnes | Fait: conception de campagnes avec estimations présentées comme telles. |
| 06 Budget | Fait: FCFA par défaut et multidevise, parts ajustables avec verrouillage, recalcul des montants et des campagnes. |
| 07 Tableau de bord | Fait: synthèse, objectifs, campagnes, prochaines publications, plan d'action; saisie manuelle des performances. |
| 08 Livrables et exports | Édition et historique des versions faits. Exports PDF, DOCX, XLSX: à faire. |
| 09 Abonnements et paiements | À faire (choix du prestataire Mobile Money à valider). |
| 10 Administration | À faire (la consommation IA est déjà enregistrée). |

## Recette

| ID | Couverture actuelle |
|---|---|
| T01 Inscription, T02 Profil | Parcours implémenté; à valider sur un projet Supabase. |
| T03–T06 Diagnostic, SWOT, stratégie, calendrier | Chaîne testée avec un modèle simulé (`tests/pipeline.test.ts`); qualité à évaluer sur des entreprises pilotes. |
| T07 Budget | `tests/budget.test.ts`. |
| T08 Édition, T12 Reconnexion | Versions persistées en base; à valider de bout en bout. |
| T09 Export, T10 Paiement | Non implémentés. |
| T11 Isolation | `supabase/tests/rls_test.sql`. |
| T13 Erreur IA | `tests/pipeline.test.ts` + messages et relance dans l'interface. |
