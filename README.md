# Benely

Plateforme SaaS d'IA de stratégie marketing et communication pour les entreprises africaines (marché pilote: Côte d'Ivoire, puis Afrique francophone).

Stack: Next.js 14 (App Router, TypeScript) · Supabase (Auth, Postgres avec RLS) · API Claude (sortie JSON structurée et validée par Zod).
Architecture et suivi du cahier des charges: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

## Mise en route

1. Créer un projet Supabase, puis appliquer les migrations de `supabase/migrations/` dans l'ordre (éditeur SQL ou `supabase db push`).
2. Dans Supabase → Authentication → URL Configuration, ajouter `https://<votre-domaine>/auth/callback` (et `http://localhost:3000/auth/callback` en local) aux URL de redirection.
3. Configurer l'environnement:
   ```bash
   cp .env.example .env.local
   # NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY, ANTHROPIC_API_KEY
   # Paiement: CINETPAY_API_KEY et CINETPAY_SITE_ID, ou BILLING_PROVIDER=simulation en local
   ```
4. Lancer:
   ```bash
   npm install
   npm run dev
   ```

Toutes les variables sont décrites dans `.env.example`. Variables optionnelles de l'IA: `ANTHROPIC_MODEL` (défaut `claude-opus-5-5`), `ANTHROPIC_EFFORT` (défaut `medium`), `BENELY_WEB_RESEARCH=1` pour sourcer l'étude de marché par recherche web.

## Mise en production

- **Paiement CinetPay:** renseigner `CINETPAY_API_KEY` et `CINETPAY_SITE_ID`. L'URL de notification (`https://<domaine>/api/billing/notify`) est transmise automatiquement à chaque paiement. Un abonnement n'est activé qu'après vérification du paiement auprès de CinetPay, montant et devise compris.
- **Tâche planifiée:** `vercel.json` appelle `/api/cron/billing` toutes les heures (expiration des abonnements, revérification des paiements en attente). Définir `CRON_SECRET`.
- **Factures:** renseigner les mentions légales du vendeur (`BENELY_LEGAL_*`) et la mention de TVA applicable.
- **Premier super-administrateur:** après son inscription, exécuter dans l'éditeur SQL
  `insert into platform_admins (user_id) select id from auth.users where email = 'vous@exemple.ci';`
  L'administration est ensuite accessible sur `/admin`.

## Vérifications

```bash
npm run typecheck
npm test                                   # logique métier, schémas IA, chaîne de génération (modèle simulé)
DATABASE_URL=postgres://... npm run test:db  # isolation multi-tenant et facturation, sur une base Postgres JETABLE
# Les tests d'export utilisent pdftotext et pdfinfo (poppler-utils).
```

## Parcours

Inscription → création de l'organisation → profil, questions complémentaires et synthèse validée → génération en six étapes (diagnostic, marché, stratégie, marque, plan média, contenu) avec contrôle de cohérence → édition versionnée, calendrier, budget, saisie des performances → exports PDF, Word, Excel → abonnement payé par Mobile Money ou carte.
