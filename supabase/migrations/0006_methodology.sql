-- Méthodologie Benely: document de référence pour l'audit et l'élaboration des stratégies.
-- Une seule version active à la fois; chaque génération enregistre la version utilisée.
create table public.methodology_documents (
  id uuid primary key default gen_random_uuid(),
  version int not null unique,
  title text not null,
  content text not null,              -- Markdown
  source_filename text,
  active boolean not null default false,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);
create unique index methodology_documents_one_active on public.methodology_documents ((active)) where active;

alter table public.methodology_documents enable row level security;
-- Lecture et gestion réservées aux super-administrateurs; la génération lit le document via le rôle service.
create policy methodology_admin_read on public.methodology_documents for select using ((select public.is_platform_admin()));
create policy methodology_admin_write on public.methodology_documents for all using ((select public.is_platform_admin())) with check ((select public.is_platform_admin()));

insert into public.methodology_documents (version, title, content, source_filename, active) values (
  1,
  'Stratégie marketing : processus détaillé étape par étape',
  $methodo$# Stratégie marketing : processus détaillé étape par étape

*21 octobre 2026*

## Introduction

Une stratégie marketing réellement impactante résulte toujours du même enchaînement rigoureux : diagnostic, objectifs, cible, positionnement, choix tactiques, exécution, mesure, optimisation. Sauter une étape — se jeter sur les canaux avant d’avoir clarifié la cible et le positionnement, par exemple — explique la majorité des campagnes qui dispersent leur budget sans résultat. Les dix étapes ci-dessous détaillent la méthode, les livrables attendus et des repères concrets pour chacune.

## 1. Diagnostic et audit

Tout diagnostic commence par rassembler les faits avant de juger : ce que l’entreprise maîtrise (audit interne), ce qui s’impose à elle (audit externe), puis la synthèse qui hiérarchise les priorités.

### Audit interne

- **Offre** : gamme de produits/services, positionnement prix, qualité perçue par les clients, stade du cycle de vie (lancement, croissance, maturité, déclin)
- **Ressources** : budget disponible, taille et compétences de l’équipe marketing, outils et technologies en place (CRM, analytics, automation)
- **Performance historique** : évolution des ventes sur 12-24 mois, trafic et sources d’acquisition, taux de conversion par canal, ROI des campagnes passées
- **Identité de marque** : cohérence visuelle et verbale actuelle, niveau de notoriété (spontanée et assistée), image perçue versus image souhaitée

### Audit externe

**Analyse PESTEL** — passer en revue les six familles de facteurs qui échappent au contrôle de l’entreprise mais influencent son marché :

| Facteur | Questions à se poser | Exemple d’impact |
| --- | --- | --- |
| Politique | Réglementations, stabilité, politiques fiscales | Nouvelle loi encadrant la publicité du secteur |
| Économique | Pouvoir d’achat, inflation, taux de change | Baisse du pouvoir d’achat réduisant le panier moyen |
| Social | Démographie, valeurs, modes de consommation | Montée de la consommation responsable |
| Technologique | Innovations, automatisation, nouveaux canaux | Émergence de l’IA générative dans le parcours d’achat |
| Écologique | Contraintes environnementales, attentes RSE | Pression des consommateurs sur l’empreinte carbone |
| Légal | Droit du travail, protection des données, normes | RGPD et contraintes sur le tracking publicitaire |

**Analyse concurrentielle** — pour chaque concurrent direct et indirect, documenter :

| Critère | Ce qu’on cherche à savoir |
| --- | --- |
| Positionnement | Promesse, territoire de marque, cible visée |
| Pricing | Niveau de prix, politique de remises |
| Canaux utilisés | Présence media, réseaux sociaux, SEO/SEA |
| Part de voix | Volume de communication par rapport au marché |
| Forces et faiblesses perçues | Avis clients, notes, retours terrain |

**Tendances du marché** : évolutions de la demande, nouveaux entrants, signaux faibles à surveiller (recherches Google Trends, rapports sectoriels, réseaux sociaux).

### Synthèse SWOT

La matrice SWOT croise l’interne (maîtrisable) et l’externe (subi) :

|  | Favorable | Défavorable |
| --- | --- | --- |
| **Interne** | Forces : atouts différenciants, avantages concurrentiels réels | Faiblesses : limites internes, retards, manques de ressources |
| **Externe** | Opportunités : tendances à saisir, marchés à exploiter | Menaces : risques concurrentiels, réglementaires, économiques |

### Enjeux prioritaires

Le diagnostic se conclut par 3 à 5 enjeux hiérarchisés (jamais plus) : les points sur lesquels la stratégie devra impérativement agir pour avoir un effet réel sur le business.

## 2. Définition des objectifs

Les objectifs marketing découlent toujours des objectifs business, jamais l’inverse : une agence qui part des tactiques avant des objectifs construit une stratégie sans boussole.

### Des objectifs business aux objectifs marketing

Un objectif business (ex. : +15% de chiffre d’affaires, lancement d’un nouveau marché, gain de parts de marché) se décline en objectifs marketing mesurables : notoriété, acquisition de leads, taux de conversion, fidélisation.

### La méthode SMART

| Lettre | Signification | Question à se poser | Exemple |
| --- | --- | --- | --- |
| S | Spécifique | L’objectif est-il précis et sans ambiguïté ? | Augmenter le trafic organique du site |
| M | Mesurable | Quel indicateur et quelle valeur cible ? | +30% de sessions organiques |
| A | Atteignable | Les ressources permettent-elles de l’atteindre ? | Cohérent avec le budget SEO alloué |
| R | Réaliste | L’objectif est-il pertinent pour le business ? | Le trafic organique sert l’objectif d’acquisition |
| T | Temporel | Sur quelle échéance ? | D’ici 6 mois |

Objectif final type : « Augmenter le trafic organique du site de 30% en 6 mois grâce au SEO. »

### Hiérarchiser selon l’entonnoir (framework RACE)

Les objectifs se répartissent sur les quatre étapes du parcours client, selon le modèle RACE (Reach, Act, Convert, Engage) :

| Étape | Objectif marketing | Exemples de KPI |
| --- | --- | --- |
| Reach (Notoriété) | Faire connaître la marque | Impressions, reach, part de voix |
| Act (Acquisition) | Générer de l’intérêt et du trafic qualifié | Visites, leads, taux de clic |
| Convert (Conversion) | Transformer l’intérêt en vente | Taux de conversion, coût par acquisition |
| Engage (Fidélisation) | Retenir et faire revenir le client | Taux de rétention, NPS, valeur vie client |

Une stratégie équilibrée fixe des objectifs sur chacune des quatre étapes plutôt que de tout concentrer sur la conversion à court terme.

## 3. Connaissance de la cible

Une stratégie parle à quelqu’un de précis, jamais à « tout le monde » : la segmentation et les personas sont ce qui permet de rendre chaque message pertinent.

### Segmentation du marché

| Type de segmentation | Critères | Exemple |
| --- | --- | --- |
| Démographique | Âge, genre, revenu, CSP, situation familiale | Femmes 25-40 ans, cadres urbaines |
| Comportementale | Fréquence d’achat, fidélité, usage du produit | Acheteurs réguliers vs occasionnels |
| Psychographique | Valeurs, style de vie, centres d’intérêt | Sensibles à l’écoresponsabilité |
| Géographique | Zone, climat, densité urbaine | Grandes métropoles francophones |

### Construire des personas

Chaque persona principal (2 à 4 suffisent généralement) rassemble :

- **Identité** : prénom fictif, âge, profession, situation de vie
- **Objectifs et besoins** : ce qu’il cherche à accomplir
- **Freins et objections** : ce qui l’empêche d’acheter ou de s’engager
- **Habitudes média** : réseaux sociaux utilisés, moments de consommation de contenu
- **Déclencheur d’achat** : l’événement ou l’émotion qui le pousse à agir
- **Citation type** : une phrase qui résume sa frustration ou son attente

### Cartographier le parcours client

| Étape | Ce que fait le client | État émotionnel | Points de contact | Opportunité marketing |
| --- | --- | --- | --- | --- |
| Prise de conscience | Identifie un besoin ou un problème | Curiosité, inconfort | Réseaux sociaux, recherche Google, bouche-à-oreille | Contenu éducatif, SEO |
| Considération | Compare les options disponibles | Hésitation, recherche de réassurance | Site web, avis clients, comparateurs | Preuve sociale, contenu comparatif |
| Décision | Choisit et passe à l’achat | Besoin de confiance | Page produit, service client, checkout | Simplicité du parcours, réassurance |
| Fidélisation | Utilise le produit, envisage de racheter | Satisfaction ou déception | Email, support, communauté | Programme de fidélité, contenu d’usage |
| Recommandation | Parle de la marque autour de lui | Fierté ou frustration | Réseaux sociaux, avis | Incitation au partage, UGC |

### Insights consommateurs

L’objectif de cette étape est de dégager 1 à 2 insights forts — une vérité humaine non évidente sur la cible — qui nourriront ensuite le positionnement et le message créatif. Un insight se distingue d’une simple observation : « les clients veulent gagner du temps » est une observation ; « ils se sentent coupables de déléguer » est un insight.

## 4. Positionnement et plateforme de marque

Le positionnement est le choix le plus engageant de toute la stratégie : il détermine ce que la marque décide de ne pas être autant que ce qu’elle est.

### Formuler le positionnement

Une formule simple pour tester la clarté d’un positionnement :

« Pour \[cible\], \[marque\] est la \[catégorie\] qui \[bénéfice différenciant\], parce que \[preuve / raison de croire\]. »

Un bon positionnement est différenciant (le concurrent ne peut pas dire la même chose), pertinent (il répond à un vrai besoin de la cible) et crédible (l’entreprise peut réellement le prouver).

### Value Proposition Canvas

Cet outil confronte la cible et l’offre :

| Côté client | Côté offre |
| --- | --- |
| Tâches à accomplir (fonctionnelles, sociales, émotionnelles) | Produits et services proposés |
| Douleurs : freins, risques, frustrations | « Antidouleurs » : comment l’offre réduit ces frictions |
| Gains recherchés : bénéfices attendus | « Créateurs de gains » : comment l’offre produit ces bénéfices |

L’ajustement (fit) est trouvé quand chaque douleur a son antidouleur et chaque gain recherché a son créateur de gain correspondant.

### Plateforme de marque

- **Mission** : pourquoi la marque existe, au-delà du profit
- **Vision** : le futur que la marque veut contribuer à créer
- **Valeurs** : les principes non négociables qui guident les décisions
- **Personnalité** : si la marque était une personne, comment se comporterait-elle (archétypes utiles ici : le héros, le sage, le rebelle, le créateur…)
- **Ton de voix** : vocabulaire, niveau de langage, humour ou sérieux, tutoiement ou vouvoiement

### Territoire créatif et big idea

La big idea est l’idée directrice qui structure toute la communication sur plusieurs mois ou années — un fil rouge mémorable, pas un simple slogan. Elle doit être suffisamment large pour se décliner sur tous les canaux et formats, et suffisamment précise pour rester reconnaissable.

## 5. Choix stratégiques

Cette étape traduit le positionnement en décisions concrètes : quel mix, quels canaux, quel contenu, avec quel budget.

### Le mix marketing (4P / 7P)

| Levier | Question clé | Exemple de décision |
| --- | --- | --- |
| Produit | Que vend-on exactement ? | Gamme, fonctionnalités, packaging |
| Prix | À quel niveau et selon quelle logique ? | Prix premium, freemium, abonnement |
| Distribution (Place) | Où et comment le client y accède-t-il ? | E-commerce direct, retail, marketplaces |
| Promotion | Comment en parle-t-on ? | Mix média, contenu, relations presse |
| Personnes (People) | Qui porte l’expérience client ? | Formation des équipes, service client |
| Process | Quel est le parcours d’achat/usage ? | Simplicité du tunnel de conversion |
| Preuve physique | Quels éléments tangibles rassurent ? | Avis clients, showroom, packaging |

### Le modèle owned / earned / paid

| Catégorie | Définition | Exemples de canaux | Avantage principal |
| --- | --- | --- | --- |
| Owned | Canaux possédés par la marque | Site web, réseaux sociaux, CRM, blog | Contrôle total, coût marginal faible |
| Earned | Visibilité gagnée sans achat média direct | Relations presse, bouche-à-oreille, UGC, influence organique | Forte crédibilité perçue |
| Paid | Visibilité achetée | SEA, social ads, display, partenariats médias, influence rémunérée | Rapidité et scalabilité |

Une stratégie robuste combine les trois : le paid génère la portée rapide, l’owned capitalise sur l’audience dans la durée, l’earned apporte la crédibilité que la publicité seule ne peut pas acheter.

### Stratégie de contenu

- **Piliers éditoriaux** : 3 à 5 thématiques récurrentes alignées sur les attentes de la cible et l’expertise de la marque
- **Formats** : article, vidéo courte, podcast, infographie, étude de cas — choisis selon les habitudes de consommation de la cible
- **Fréquence** : calendrier réaliste tenant compte des ressources de production disponibles

### Arbitrages budgétaires par canal

Le choix des canaux se fait selon trois critères croisés : l’atteinte de la cible (la cible y est-elle vraiment présente ?), le potentiel de retour (ROI historique ou sectoriel) et la cohérence avec l’objectif de l’étape du funnel visée. Le détail de la répartition budgétaire est traité à l’étape 7.

## 6. Plan d’action opérationnel

C’est l’étape où la stratégie devient exécutable : qui fait quoi, quand, avec quel livrable.

### Du plan tactique au calendrier

Le plan tactique détaille, pour chaque canal retenu, les actions concrètes à mener sur la période (ex. : 3 campagnes social ads, 2 livres blancs, 1 partenariat influence). Il se traduit en deux calendriers complémentaires :

- **Calendrier éditorial** : contenus à produire, date de publication, canal, responsable
- **Calendrier de campagnes** : actions payantes et temps forts commerciaux, avec dates de lancement et de fin

### Briefs créatifs

Chaque livrable (visuel, vidéo, copywriting) part d’un brief écrit incluant : objectif de la création, cible visée, message clé unique, ton, contraintes de format par canal, et exemples de références visuelles.

### Répartition des responsabilités (RACI)

| Tâche | Responsable (R) | Approbateur (A) | Consulté (C) | Informé (I) |
| --- | --- | --- | --- | --- |
| Création des visuels | Designer | Directeur créatif | Chef de marque | Équipe commerciale |
| Achat média | Média planneur | Directeur marketing | Agence média | Direction générale |
| Publication social media | Community manager | Responsable social media | Juridique (si besoin) | Équipe marketing |

### Phases de campagne

| Phase | Objectif | Durée indicative | Actions types |
| --- | --- | --- | --- |
| Teasing | Susciter la curiosité sans tout dévoiler | 1-2 semaines avant le lancement | Comptes à rebours, indices, contenu mystère |
| Lancement | Maximiser la visibilité au moment clé | Jour J à J+7 | Communiqué de presse, campagne média intensive |
| Amplification | Prolonger la portée et toucher les retardataires | J+7 à J+30 | Relais influenceurs, retargeting, UGC |
| Bilan | Mesurer et capitaliser | Après la campagne | Analyse des KPIs, rapport, enseignements |

### Rétroplanning

Le rétroplanning part de la date de lancement et remonte dans le temps pour fixer les échéances de chaque livrable (validation créative, production, trafic management, tests techniques), avec une marge de sécurité d’au moins 10% du temps total prévu.

## 7. Budget et ressources

Un budget mal réparti ruine une bonne stratégie aussi sûrement qu’une mauvaise stratégie bien financée.

### Méthodes de répartition budgétaire

- **Par objectif** : part du budget allouée à chaque étape du funnel (notoriété, acquisition, conversion, fidélisation)
- **Par canal** : arbitrage entre owned, earned et paid selon leur potentiel de retour respectif
- **Test-and-learn** : réserver 10 à 15% du budget pour tester de nouveaux canaux ou formats avant d’investir massivement

### Arbitrer entre notoriété et performance

Un repère largement utilisé dans l’industrie est la règle 60/40 (ou 70/30 selon la maturité de la marque) : une majorité du budget en construction de marque (notoriété, mémorisation) et le reste en activation directe (performance, conversion). Une marque jeune ou en acquisition pure penchera davantage vers la performance ; une marque établie cherchant à défendre ses parts de marché investira davantage en notoriété.

### Exemple indicatif de répartition par canal

| Canal | Part du budget (exemple) | Logique |
| --- | --- | --- |
| Social ads (paid) | 30% | Acquisition rapide et ciblée |
| SEA | 20% | Captation de la demande existante |
| Contenu et SEO (owned) | 20% | Actif durable, coût marginal décroissant |
| Relations presse et influence (earned) | 15% | Crédibilité et portée organique |
| Production créative | 15% | Qualité des livrables sur tous les canaux |

Cette répartition est un point de départ à ajuster selon le secteur, la maturité de la marque et les objectifs prioritaires.

### Prévision du ROI

Pour chaque levier, estimer un ROI prévisionnel simple :

ROI = (Gain généré − Coût de l’investissement) / Coût de l’investissement

Cette estimation, même approximative, permet d’arbitrer entre canaux a priori et de fixer une référence pour l’évaluation a posteriori.

## 8. Mise en œuvre

La meilleure stratégie échoue si son exécution n’est pas coordonnée entre les équipes.

### Lancement coordonné

Toutes les actions prévues au calendrier démarrent selon le rétroplanning validé, avec un point de synchronisation final (« go/no-go ») 48 à 72h avant le lancement pour vérifier que chaque livrable est prêt.

### Coordination entre équipes

- **Création** : production des contenus et visuels dans les délais
- **Média** : paramétrage et suivi des campagnes payantes
- **Data** : mise en place du tracking avant le lancement, jamais après
- **Community management** : veille et réactivité sur les canaux sociaux pendant les temps forts

### Gouvernance et pilotage

Un comité de pilotage (hebdomadaire en phase de lancement, mensuel en régime de croisière) réunit les responsables de chaque équipe pour partager l’avancement, lever les blocages et ajuster le plan si besoin.

### Gestion des risques

| Risque | Impact potentiel | Mitigation |
| --- | --- | --- |
| Retard de production créative | Décalage du lancement | Marge de sécurité dans le rétroplanning |
| Sous-performance d’un canal | Objectifs non atteints | Budget test-and-learn, bascule rapide vers un autre canal |
| Bad buzz ou crise | Atteinte à l’image de marque | Procédure de gestion de crise pré-établie, validation juridique en amont |

## 9. Mesure et KPIs

Ce qui n’est pas mesuré ne peut pas être piloté : chaque objectif de l’étape 2 doit avoir son ou ses indicateurs associés.

### KPIs par objectif

| Objectif | KPI | Formule / définition | Outil de suivi |
| --- | --- | --- | --- |
| Notoriété | Reach, impressions | Nombre de personnes/vues uniques touchées | Outils natifs des plateformes publicitaires |
| Notoriété | Part de voix | Volume de mentions de la marque / volume total du secteur | Outils de social listening |
| Acquisition | Trafic qualifié | Nombre de sessions depuis les canaux marketing | Google Analytics / équivalent |
| Acquisition | Coût par lead (CPL) | Dépense média / nombre de leads générés | CRM, plateformes publicitaires |
| Conversion | Taux de conversion | Nombre de conversions / nombre de visiteurs | Analytics, CRM |
| Conversion | Coût par acquisition (CPA) | Dépense totale / nombre de clients acquis | CRM |
| Fidélisation | Taux de rétention | Clients actifs en fin de période / clients actifs en début de période | CRM |
| Fidélisation | Net Promoter Score (NPS) | % promoteurs − % détracteurs | Enquêtes de satisfaction |
| Fidélisation | Valeur vie client (LTV) | Revenu moyen par client × durée de vie moyenne | CRM, analyse financière |

### Outils de tracking

Le tracking (pixels publicitaires, UTM, CRM, outils d’analytics) doit être installé et testé avant le lancement, jamais pendant ou après. Une check-list de tracking fait partie des livrables du plan d’action (étape 6).

### Structure de reporting

- **Fréquence** : hebdomadaire en phase de lancement, mensuelle ou trimestrielle en régime de croisière
- **Format** : dashboard synthétique avec les KPIs prioritaires en un coup d’œil, complété d’une analyse qualitative
- **Destinataires** : adapter le niveau de détail selon l’audience (opérationnel vs direction)

Un bon reporting répond toujours à trois questions : où en est-on par rapport à l’objectif, qu’est-ce qui explique l’écart, et quelle action en découle.

## 10. Optimisation continue

Une stratégie marketing n’est jamais figée : elle s’ajuste en continu à partir de la donnée collectée.

### Tests A/B

1.  Formuler une hypothèse claire (« un visuel avec visage humain convertit mieux qu’un visuel produit seul »)
2.  Isoler une seule variable à la fois (visuel, accroche, canal, cible)
3.  Diffuser les deux versions simultanément, sur un échantillon suffisant pour une significativité statistique
4.  Analyser le résultat et généraliser l’apprentissage à l’ensemble de la campagne

### Analyse des écarts

Comparer systématiquement les résultats obtenus aux objectifs fixés à l’étape 2, en distinguant les écarts dus à l’exécution (ex. : retard de production) de ceux dus à la stratégie elle-même (ex. : mauvais ciblage).

### Boucle d’itération

La logique Build-Measure-Learn (construire, mesurer, apprendre) s’applique au marketing comme au produit : chaque cycle de campagne doit nourrir le suivant. Les ajustements portent sur trois leviers principaux : le budget (réallouer vers ce qui performe), le ciblage (affiner les segments ou personas), et la création (itérer sur les messages et formats).

### Capitaliser sur les apprentissages

Chaque campagne se termine par un bilan documenté (ce qui a fonctionné, ce qui n’a pas fonctionné, pourquoi) versé dans une base de connaissance partagée, pour que chaque nouvelle stratégie parte des enseignements de la précédente plutôt que de repartir de zéro.

## En résumé : ce qui fait une stratégie impactante

- **Une idée directrice forte**, plutôt qu’un empilement de tactiques déconnectées
- **Une cohérence totale** entre tous les points de contact : même message, même ton, partout
- **Des décisions pilotées par la donnée**, du diagnostic initial à l’optimisation continue
- **Une capacité à itérer vite**, plutôt qu’à figer un plan rigide sur 12 mois

### Erreurs fréquentes à éviter

- Sauter l’étape de diagnostic et se jeter directement sur les tactiques
- Fixer des objectifs vagues, non mesurables ou non priorisés
- Parler à « tout le monde » faute de personas clairement définis
- Multiplier les canaux sans cohérence de message ni de budget suffisant par canal
- Ne mesurer qu’en fin de campagne, sans point d’étape pour ajuster en cours de route$methodo$,
  'Strategie_marketing_-_processus_detaille.docx',
  true
);
