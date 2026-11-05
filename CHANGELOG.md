# Changements

Deux numéros de version avancent ensemble : celui du **système** `lakour-survie` et celui du **module de contenu**
`lakour-fenoir` (le module anglais `lakour-fenoir-en` et le monde vierge `la-kour-fenoir` portent celui du module). Chaque
publication GitHub (étiquette `v<version du système>`) emporte le tout. Le moteur commun `lakour-mj-ia` a son propre journal
dans [son dépôt](https://github.com/Hogun974/lakour-mj-ia).

## Non publié

- **Sécurité** (revue du 2026-11-05) : graine de 128 bits (`crypto.getRandomValues`), flux dérivés par SHA-256 et générateur
  sfc32 (avant : 2³² mondes, qu'un joueur pouvait retrouver d'après la radio ; les résultats chiffrés des simulations
  changent, l'équilibre n'est pas recalé) ; graine courte refusée au démarrage, renforcée dans une ancienne partie ; seuls les
  messages d'un MJ font foi (forcer, demandes de test), un test de joueur ne compte que sur demande du MJ ; champs réservés au
  MJ vérifiés par le serveur (`gmOnlyFields`), HTML nettoyé avant affichage ; incubations et notes secrètes des abris au
  coffre ; plus de copie du monde réel dans le navigateur du MJ ; bilan et météo publics tirés du connu ; création validée
  chez le MJ ; propositions limitées ; messages sans émetteur ignorés. Textes des recrues et des besoins du groupe localisés,
  cinq faits des événements d'abri traduits. README : section sécurité.
- **Parties longues** (`essais/outils/parties-longues.mjs`, 440 parties d'un an contrôlées chaque jour) et six corrections :
  la radio ne rajeunit plus le pillage (`vuDirect`, âge du pillage au tableau) ; une réparation trop courte s'accumule ;
  les chiens de garde mangent ; une petite production (médicaments des ruches et de l'infirmerie) s'accumule ; un abri
  d'une faction disparue redevient libre ; les événements météo des régions (éboulements, radiers, houle, incendie)
  arrivent enfin. Le simulateur ne donnait plus de jour gratuit au nomade : son équilibre est remesuré.
- **Monde vierge** remis au niveau du contenu (14 journaux, carte de La Réunion, guides du MJ IA en français et en
  anglais) ; essais sur GitHub Actions et release à blanc à la main ; fabricant aux écritures atomiques.
- **Monde vierge `la-kour-fenoir`** (`monde/`) : manifeste, description, fond, système et modules actifs, un seul compte
  Gamemaster sans mot de passe ; empaqueté par l'outil commun du moteur (`npm run empaqueter-monde`), qui refuse toute fuite.
- Création : prénoms accordés au genre de l'enfance et du passé (`nomAutre`, `nomAccorde`), générateur revu ; `oublier()`
  remet aussi la partie publique, le coffre et le clair à zéro.
- Préparation de la publication : manifestes étoffés (`url`, `manifest`, `download`, `readme`, `bugs`, `changelog`,
  `license`, `media`, auteur avec adresse, modules recommandés), README en français et en anglais, script d'empaquetage
  `outils/empaqueter-paquets.mjs`, workflow de publication sur étiquette `v*`, liste de contrôle `docs/publication.md`,
  liste des captures `docs/captures/LISEZ-MOI.md`.
- Équilibrage en cours des installations, des régions et des sites ; fêtes et traduction anglaise en relecture.

## Système 0.1.0 · Contenu 0.2.0 — 4 novembre 2026

- **Le livre de l'île** : un journal d'univers lisible des joueurs, installé avec les guides, treize pages à lire avant la
  première nuit : l'île avant, le dernier mois ordinaire, le jour zéro, ce qu'on croit savoir des Livides et ce qu'on
  apprendra peut-être, l'île qui change, les gens d'après, vivre à Fénoir, des portraits, des rumeurs et des mystères, un
  lexique créole, la première nuit. Version anglaise « The Book of the Island ».
- **Module anglais `lakour-fenoir-en`** engendré en entier des mêmes sources (`npm run fabriquer-fenoir-en`) : registre,
  compendiums, cartes et plans traduits, identité du module portée par le script (`scripts/identite.js`), essais de
  traduction.
- Faits, alertes et journal du monde localisés (clés `LAKOUR_SURVIE.Faits.*`, français et anglais) ; onze images de fêtes
  (Noël, jour de l'an, Pâques, Toussaint et Halloween, fête de la musique, 20 décembre, 14 juillet, Dipavali, Nouvel An
  chinois, Cavadee, letchis), générées localement.
- Compatibilité vérifiée avec Foundry 14.370 ; moteur MJ IA 0.40.0.

## Système 0.1.0 · Contenu 0.1.0 — 4 novembre 2026

- Première version dans ce dépôt. **Contrat** `docs/survie-contrat.md` entre les trois pièces.
- **Système `lakour-survie`**, logique pure éprouvée en Node : tests à dés de 6, forcer et marques, état d'un survivant
  (blessures, fatigue, moral, faim, soif, infection), temps en quarts, phases de la crise, ressources et pertes, bilan de
  l'abri et installations en niveaux, bruit, visibilité et menaces, simulation du monde (infestation, hordes, pillage,
  réseaux, factions, météo, cyclones, éruption), renseignements datés, maladies, atelier, création des survivants « à la
  RimWorld » (enfances, passés, passions, traits, incapacités, budget, verrous), recrues et tâches du jour.
- **Couche Foundry** du système : fiches de survivant et d'abri, fenêtre de création, bandeau de survie, tableau de bord du
  groupe, atelier, fenêtre du MJ, coffre du MJ IA pour le monde réel, lumière et météo qui suivent le jeu, ambiances
  sonores, chroniques, signal « à toi », interface en français et en anglais.
- **Module de contenu `lakour-fenoir`** : seize régions de La Réunion et leurs routes, une cinquantaine de sites d'abri,
  installations, savoir-faire, passés, enfances, traits, équipement et véhicules, recettes, maladies, factions et
  réputations, événements, bestiaire, prétirés et PNJ, tables du MJ, guides du joueur et du MJ, scénario d'ouverture,
  one-shot, campagne en fronts, fêtes ; **carte de La Réunion** (tracé IGN, relief, routes et sentiers OpenStreetMap) et
  cartes de lieux ; jetons ; fond du monde.
- Moteur MJ IA en sous-module : adaptateur `lakour-survie`, outils `survie_*`, compagnons, contexte joueur/secret.
