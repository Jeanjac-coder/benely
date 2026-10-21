# Journal des versions

## Non publié

### Interface
- Textes du site réécrits pour la conversion, sur un ton rassurant: nouvelle accroche, navigation (« Comment ça marche », « Pourquoi Benely », « Ce que vous recevez », « Tarifs », « Connexion », « Essai gratuit »), preuves de réassurance (14 jours gratuits, sans carte bancaire, sans engagement), étapes, offres et appels à l'action. « Diagnostic » devient « Audit » dans tout le site, l'application et les exports. Radio retirée des textes au profit d'Instagram et Facebook.
- Drapeaux des 7 pays couverts (SVG) dans les chiffres clés, le bento et le pied de page.
- BEN voyageur: il quitte le hero, accompagne la lecture en 3D (rotation, inclinaison selon la vitesse de défilement, changement de pose) puis se pose sur le pied de page. Désactivé avec « réduire les animations » et sur petit écran.
- Police Geist (Google Fonts, embarquée) à la place de Sora.
- Tableau de bord refondu (inspirations CRM et Eduplex): barre latérale sombre avec onglet actif orange, tuiles colorées (budget et consommation, résultats, publications, cohérence), histogramme du rythme de publication avec pic mis en valeur, prochaines publications, piliers éditoriaux, campagnes avec anneau d'avancement, carte copilote BEN, mini-calendrier du mois, objectifs avec statut d'échéance et plan d'action en étapes.
- Refonte « ciel »: nouvelle palette orange (#FF5400 → #FF9E00) et bleue dérivée du bleu du logo #0F11F4 (#5759F8 → #05065E), police Sora. Hero en panneau de ciel avec nuages, BEN assis sur un nuage et cartes flottantes (budget, nouveaux clients, WhatsApp); chiffres clés; bento « Pensé pour l'Afrique »; étapes en cartes blanches sur fond bleu nuit; boutons en pilule avec flèche ronde; tarifs et appel final redessinés. Exports PDF, Word, Excel et factures aux nouvelles couleurs.
- Nouvelle identité visuelle selon la charte Benely: logo, palette (Electra, Almond, Tangerine, Firecracker, Whisper, Azure), typographie Inter / Inter Display.
- Page d'accueil refondue: hero Electra avec aperçu du tableau de bord, étapes en cartes colorées, livrables, section Afrique, tarifs lus depuis la base.
- Application: barre latérale avec icônes et page active, sélecteur d'organisation et offre en cours, onglets en pilule, barre d'étapes du profil, frise de progression de la génération, indicateurs colorés.
- Pages d'accès (connexion, inscription, organisation, invitation) en deux colonnes avec panneau de marque.
- Exports PDF, Word, Excel et factures aux couleurs de la charte.
- Icône d'onglet et icône Apple à partir du symbole « B ».
- Mascotte (5 poses) intégrée: guide interactif dans le hero (change de pose et de bulle au clic), apparitions dans les cartes, la bande promotionnelle, les tarifs, l'appel à l'action, la connexion, le tableau de bord vide et la génération (réfléchit pendant le calcul, surprise en cas d'erreur).
- Nouvelle palette (Cobalt Blue, Night Sky, Periwinkle, Pastel Blue, Turquoise, Pastel Peach, Clementine, Nectar, Yellow Dahlia…), glassmorphisme (navigation, cartes, menus, cartes flottantes) et mode sombre (selon le système ou au choix, mémorisé).
- Mobile: navigation d'accueil avec menu déroulant, BEN dans le hero, application avec barre supérieure et menu, mises en page resserrées.
- Connexion: « BIENVENUE », BEN qui salue, carte de formulaire en verre, connexion avec Google; prénom et nom demandés à l'inscription (table `profiles`), modifiables dans Paramètres, affichés dans l'application et l'équipe.
- Écran de chargement animé avec BEN et indicateurs de chargement dans les boutons.
- Liens vers Facebook, Instagram et TikTok (pied de page, connexion).
- La mascotte s'appelle BEN.
- Animations: titre révélé mot par mot, trait dessiné, cartes flottantes et curseur autour de l'aperçu, graphiques qui se tracent, bandeau défilant des canaux, apparitions au défilement, survols animés. Toutes désactivées avec « réduire les animations ».

## 1.0.0 — 21 octobre 2026

Première version de Benely, copilote IA de stratégie marketing et communication pour les entreprises africaines (marché pilote: Côte d'Ivoire).

### Technique
- Authentification côté serveur avec `@supabase/server`: le jeton de session (cookie géré par `@supabase/ssr`) est vérifié localement avec les clés publiques du projet, sans appel à Supabase Auth à chaque requête; repli automatique sur `auth.getUser()` si la vérification locale est impossible. Le client « service » est créé par `createAdminClient`.

### Fonctionnalités
- Méthodologie Benely: le document « Stratégie marketing : processus détaillé étape par étape » est stocké en base (versionné) et sert de référence principale à toutes les générations. Audit systématique pour chaque utilisateur: audit interne, PESTEL, enjeux hiérarchisés et grille d'audit en 10 étapes (statut, constat, recommandation). Livrables enrichis (étape du parcours RACE par objectif, déclencheur et citation des personas, insights, positionnement formulé, big idea, canaux owned/earned/paid, logique budgétaire, check-list de tracking), contrôle de conformité automatique, version de méthodologie affichée sur chaque stratégie, page d'administration pour publier une nouvelle version.
- Offres: Business à 14 900 FCFA par mois avec support 24h/24 et avantages mis en avant; Starter avec 2 collaborateurs; Enterprise avec support 24h/24, interlocuteur dédié, multi-marques, formation et facturation sur mesure (migration `0005`, appliquée sur le projet BENELY).
- Experts IA: chaque étape de génération mobilise des fiches d'experts issues d'agency-agents (licence MIT) — Growth Hacker, Research Synthesist, Trend Researcher, Brand Guardian, Visual Storyteller, Paid Social Strategist, Ad Creative Strategist, TikTok Strategist, Content Creator, Instagram Curator… — injectées comme méthode de travail et adaptées au contexte africain. Les experts mobilisés s'affichent pendant la génération. Mise à jour: `npm run agents:sync <dépôt cloné>`.
- **Comptes et organisations:** inscription avec vérification e-mail, connexion, mot de passe oublié, organisations multiples (agences), rôles propriétaire / administrateur / collaborateur, invitations par lien. Données strictement isolées entre organisations.
- **Profil et diagnostic:** profil d'entreprise, questions complémentaires adaptées aux réponses, synthèse modifiable à valider avant génération.
- **Génération stratégique par IA:** diagnostic, étude de marché et concurrence, SWOT, objectifs SMART, segmentation, personas, positionnement, stratégies marketing / digitale / communication, plan d'action, plateforme de marque, plan média et campagnes, stratégie de contenu et calendrier éditorial. Faits, estimations et hypothèses distingués; contrôle de cohérence entre livrables; génération par étapes, reprenable, avec erreurs explicites.
- **Édition:** modification champ par champ, régénération d'un livrable, historique et restauration des versions.
- **Calendrier:** 7 jours, 30 jours, 3 mois ou période libre.
- **Budget:** FCFA par défaut, répartition ajustable avec verrouillage, recalcul des montants et des campagnes.
- **Tableau de bord et performances:** synthèse, objectifs, campagnes, prochaines publications; saisie mensuelle des résultats et réallocation suggérée.
- **Exports:** PDF, Word et Excel, à l'unité ou en dossier complet, avec logo et nom de l'entreprise.
- **Abonnements:** essai de 14 jours, offres Starter (9 900 FCFA), Business (19 900 FCFA), Enterprise sur devis; quotas; paiement Mobile Money et carte via CinetPay; factures; renouvellement, résiliation, gestion des échecs de paiement.
- **Administration:** utilisateurs, organisations, offres et quotas, paiements, consommation et coût IA, prompts, incidents, journal d'audit.

### Limites connues
- Langue de l'interface: français uniquement.
- Performances saisies manuellement (intégrations publicitaires prévues en V2).
- Invitations et rappels d'échéance non envoyés par e-mail: le lien d'invitation est à transmettre.
- Pas de suppression d'organisation en libre-service (conservation des factures à cadrer).
- Interface sans maquettes validées (Tailwind / shadcn à introduire avec la phase UX/UI).
