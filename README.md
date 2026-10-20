# Benely

Plateforme SaaS d'IA de stratégie marketing et communication pour les entreprises africaines (marché pilote: Côte d'Ivoire, puis Afrique francophone).

Stack: Next.js 14 (App Router, TypeScript) · Supabase (Auth, Postgres avec RLS) · API Claude (sortie JSON structurée et validée par Zod).
Architecture et suivi du cahier des charges: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

## Mise en route

1. Créer un projet Supabase, puis appliquer la migration `supabase/migrations/0001_init.sql` (éditeur SQL ou `supabase db push`).
2. Dans Supabase → Authentication → URL Configuration, ajouter `https://<votre-domaine>/auth/callback` (et `http://localhost:3000/auth/callback` en local) aux URL de redirection.
3. Configurer l'environnement:
   ```bash
   cp .env.example .env.local
   # NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, ANTHROPIC_API_KEY
   ```
4. Lancer:
   ```bash
   npm install
   npm run dev
   ```

Variables optionnelles: `ANTHROPIC_MODEL` (défaut `claude-opus-5-5`), `ANTHROPIC_EFFORT` (défaut `medium`), `BENELY_WEB_RESEARCH=1` pour sourcer l'étude de marché par recherche web.

## Vérifications

```bash
npm run typecheck
npm test                                   # logique métier, schémas IA, chaîne de génération (modèle simulé)
DATABASE_URL=postgres://... npm run test:db  # isolation multi-tenant (RLS) sur une base Postgres JETABLE
```

## Parcours

Inscription → création de l'organisation → profil, questions complémentaires et synthèse validée → génération en six étapes (diagnostic, marché, stratégie, marque, plan média, contenu) avec contrôle de cohérence → édition versionnée, calendrier, budget, saisie des performances.
