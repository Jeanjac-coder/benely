# Benely — architecture V1

Référence: cahier des charges « Plateforme SaaS IA de stratégie marketing et communication », v1.0.

## Choix techniques

| Couche | Cahier des charges | Retenu | Raison |
|---|---|---|---|
| Frontend | Next.js, React, TypeScript, Tailwind, shadcn/ui | Next.js 14, React, TypeScript, CSS simple | Tailwind/shadcn à introduire avec les maquettes validées (phase UX/UI). |
| Backend / API | Python, FastAPI | Route handlers Next.js | Une seule base de code TypeScript pour le MVP; un service Python pourra porter l'analytique V2. |
| Données | PostgreSQL | Supabase Postgres + RLS | Isolation multi-tenant appliquée par la base elle-même. |
| Auth / stockage | Supabase Auth / Storage | Supabase Auth et Storage | Logos des organisations dans un bucket privé, protégé par la RLS. `@supabase/ssr` gère la session en cookie (rafraîchie par le middleware); `@supabase/server` vérifie le jeton côté serveur (JWKS) et crée le client service. |
| IA | OpenAI, LangGraph | API Claude, workflows orchestrés en code | Décision validée au cadrage; les « agents » V1 sont des workflows spécialisés sur un même modèle (§6). |
| Paiement | Prestataire compatible avec les pays cibles | CinetPay (Orange Money, MTN, Moov, Wave, carte; XOF) | Basé en Côte d'Ivoire. Interface `PaymentProvider`: un autre prestataire s'ajoute sans modifier le reste. |

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
lib/export/            Modèle de document commun, rendus PDF / DOCX / XLSX, facture
lib/billing/           Offres et quotas, statut d'abonnement, prestataire CinetPay, confirmation des paiements
lib/admin.ts           Accès super-administrateur et journal d'audit
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

## Abonnements et paiements (module 09)

- **Offres:** Essai (14 jours, créé automatiquement), Starter 9 900 FCFA, Business 19 900 FCFA, Enterprise sur devis. Prix et quotas (générations, régénérations, exports, collaborateurs) sont modifiables depuis l'administration.
- **Paiement:** `POST /api/billing/checkout` crée un paiement « en attente » puis redirige vers CinetPay. L'activation se fait uniquement dans la fonction SQL `confirm_payment`, réservée au rôle service. Elle n'est appelée qu'après vérification auprès du prestataire (`/v2/payment/check`), montant et devise comparés à l'offre. La notification du prestataire, la page de retour et la tâche planifiée déclenchent cette même vérification; l'activation est idempotente.
- **Renouvellement:** le Mobile Money ne permet pas le prélèvement automatique. L'utilisateur renouvelle en payant un mois de plus: un renouvellement anticipé s'ajoute à la période en cours. Un bandeau prévient 5 jours avant l'échéance.
- **Échéance:** passé l'échéance, 3 jours de grâce (« paiement en retard ») puis expiration. Les générations, régénérations et exports sont alors suspendus; les données restent consultables.
- **Résiliation:** effective en fin de période, annulable par le propriétaire.
- **Changement d'offre:** effet immédiat pour un mois, sans prorata de la période en cours.
- **Factures:** numérotation continue `BEN-AAAA-NNNNNN`, PDF téléchargeable par le propriétaire et les administrateurs.

## Administration (module 10)

Accès réservé aux comptes de la table `platform_admins`; les autres reçoivent une page introuvable. Elle couvre:
- la vue d'ensemble: revenu récurrent, encaissements, coût IA, erreurs, conversion essai → payant;
- les organisations: offre, échéance, coût IA et marge estimée, ajustement manuel d'abonnement avec motif obligatoire;
- les utilisateurs, les offres et quotas, les paiements;
- la consommation IA par organisation et par étape;
- les prompts en lecture: ils sont versionnés avec le code;
- les incidents et journaux techniques (`app_events`) et le journal d'audit des opérations sensibles.

L'administration n'affiche que des métadonnées: profils et stratégies des clients n'y sont pas consultables.

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
| 08 Livrables et exports | Fait: édition, historique des versions, exports PDF, DOCX et XLSX à l'unité ou en dossier complet, avec logo et nom de l'entreprise. |
| 09 Abonnements et paiements | Fait avec CinetPay (Mobile Money et carte): offres, quotas, factures, renouvellement, résiliation, échecs de paiement. Rappels par e-mail ou SMS: à faire. |
| 10 Administration | Fait: utilisateurs, organisations, offres, paiements, consommation IA, prompts (lecture), incidents et audit. Édition des prompts depuis l'interface: non prévue (revue de code). |

## Recette

| ID | Couverture actuelle |
|---|---|
| T01 Inscription, T02 Profil | Parcours implémenté; à valider sur un projet Supabase. |
| T03–T06 Diagnostic, SWOT, stratégie, calendrier | Chaîne testée avec un modèle simulé (`tests/pipeline.test.ts`); qualité à évaluer sur des entreprises pilotes. |
| T07 Budget | `tests/budget.test.ts`. |
| T08 Édition, T12 Reconnexion | Versions persistées en base; à valider de bout en bout. |
| T09 Export | `tests/export.test.ts`: PDF, DOCX et XLSX relus après génération (texte, sections, calendrier, logo). |
| T10 Paiement | `supabase/tests/billing_test.sql` (activation après confirmation, idempotence, renouvellement, échec, expiration, tentatives client refusées) et `tests/billing.test.ts` (intégration CinetPay simulée). À valider avec un compte CinetPay de test. |
| T11 Isolation | `supabase/tests/rls_test.sql`. |
| T13 Erreur IA | `tests/pipeline.test.ts` + messages et relance dans l'interface. |
