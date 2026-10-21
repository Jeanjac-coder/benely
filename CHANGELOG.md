# Journal des versions

## Non publié

### Interface
- Nouvelle identité visuelle selon la charte Benely: logo, palette (Electra, Almond, Tangerine, Firecracker, Whisper, Azure), typographie Inter / Inter Display.
- Page d'accueil refondue: hero Electra avec aperçu du tableau de bord, étapes en cartes colorées, livrables, section Afrique, tarifs lus depuis la base.
- Application: barre latérale avec icônes et page active, sélecteur d'organisation et offre en cours, onglets en pilule, barre d'étapes du profil, frise de progression de la génération, indicateurs colorés.
- Pages d'accès (connexion, inscription, organisation, invitation) en deux colonnes avec panneau de marque.
- Exports PDF, Word, Excel et factures aux couleurs de la charte.
- Icône d'onglet et icône Apple à partir du symbole « B ».
- Mascotte (5 poses) intégrée: guide interactif dans le hero (change de pose et de bulle au clic), apparitions dans les cartes, la bande promotionnelle, les tarifs, l'appel à l'action, la connexion, le tableau de bord vide et la génération (réfléchit pendant le calcul, surprise en cas d'erreur).
- Animations: titre révélé mot par mot, trait dessiné, cartes flottantes et curseur autour de l'aperçu, graphiques qui se tracent, bandeau défilant des canaux, apparitions au défilement, survols animés. Toutes désactivées avec « réduire les animations ».

## 1.0.0 — 21 octobre 2026

Première version de Benely, copilote IA de stratégie marketing et communication pour les entreprises africaines (marché pilote: Côte d'Ivoire).

### Fonctionnalités
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
