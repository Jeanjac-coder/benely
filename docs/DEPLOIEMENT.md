# Mise en ligne de la version 1.0.0

## 1. Base de données Supabase — fait

Projet **BENELY** (`amvihjwhiqgmtusuxber`, région eu-west-1): migrations `0001`, `0002` et `0003` appliquées le 21 octobre 2026, bucket `logos` créé, 4 offres chargées. Audit de sécurité Supabase: aucune fonction privilégiée accessible sans connexion.

> Sur ce projet, `0003` a été appliquée en trois étapes (`0003a_function_privileges`, `0003b_policies_initplan`, `0003c_indexes`) dont le contenu est identique à `supabase/migrations/0003_hardening.sql`.

## 2. À faire dans le tableau de bord Supabase

1. **Authentication → URL Configuration**
   - Site URL: `https://<votre-domaine>`
   - Redirect URLs: `https://<votre-domaine>/auth/callback`
2. **Authentication → Emails**: personnaliser en français les modèles « Confirm signup » et « Reset password ». Configurer un SMTP (Resend, Brevo…) avant l'ouverture: l'envoi intégré de Supabase est limité à quelques e-mails par heure.
3. **Project Settings → API Keys**: copier la clé `service_role` (secrète) pour l'étape 3.

## 3. Hébergement de l'application (Vercel)

1. Importer le dépôt GitHub `Jeanjac-coder/benely` dans Vercel (framework Next.js détecté automatiquement).
2. Renseigner les variables d'environnement (Production):

| Variable | Valeur |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://amvihjwhiqgmtusuxber.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | clé publishable `sb_publishable_…` (Project Settings → API Keys) |
| `SUPABASE_SERVICE_ROLE_KEY` | clé `service_role` — secrète |
| `ANTHROPIC_API_KEY` | clé API Claude |
| `BILLING_PROVIDER` | `cinetpay` |
| `CINETPAY_API_KEY`, `CINETPAY_SITE_ID` | identifiants du compte marchand CinetPay |
| `CRON_SECRET` | longue chaîne aléatoire |
| `BENELY_LEGAL_NAME`, `BENELY_LEGAL_ADDRESS`, `BENELY_LEGAL_IDS`, `BENELY_LEGAL_CONTACT`, `BENELY_VAT_NOTE` | mentions légales des factures |

3. Déployer. La tâche planifiée de `vercel.json` (`/api/cron/billing`, toutes les heures) est activée automatiquement; Vercel transmet `CRON_SECRET`.
4. Les générations durent jusqu'à quelques minutes par étape: un plan Vercel autorisant 300 s par fonction (Pro) est nécessaire.

## 4. Vérifications après déploiement

1. Créer un compte, confirmer l'e-mail, créer l'organisation (T01).
2. Se déclarer super-administrateur (éditeur SQL Supabase):
   `insert into platform_admins (user_id) select id from auth.users where email = 'vous@exemple.ci';`
3. Remplir le profil, valider la synthèse, lancer une génération complète (T02 à T06).
4. Modifier un livrable, changer le budget, exporter en PDF, Word et Excel (T07 à T09).
5. Payer l'offre Starter avec un compte CinetPay de test, puis vérifier l'activation et la facture (T10).
6. Ouvrir `/admin`: consommation IA de la génération, paiement, absence d'erreurs.
