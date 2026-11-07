# Changements

Deux numéros de version avancent ensemble : celui du **système** `lakour-survie` et celui du **module de contenu**
`lakour-fenoir` (le module anglais `lakour-fenoir-en` et le monde vierge `la-kour-fenoir` portent celui du module). Chaque
publication GitHub (étiquette `v<version du système>`) emporte le tout. Le moteur commun `lakour-mj-ia` a son propre journal
dans [son dépôt](https://github.com/Hogun974/lakour-mj-ia).

## Non publié

- **Moteur MJ IA 0.44.1** (sous-module `modules/lakour-mj-ia`) : réglage « Caméras des joueurs permises » et bloc
  « Caméras des joueurs » de la console (couper ou permettre, ajouter la vidéo au monde, donner la caméra aux joueurs ;
  le micro n'est jamais touché), modèle des compagnons IA choisi dans une liste (vide : un modèle économique du
  fournisseur actif), coût de la séance compté à chaque appel et budget respecté par le narrateur comme par les
  compagnons, pilote automatique qui ne compte que les joueurs connectés.
- README (français, anglais) : section « Ce que le moteur 0.44.1 apporte à la table », moteur requis 0.44.1. Tutoriels :
  compagnons, coût et pilote automatique dans la section du MJ IA, caméras des joueurs dans celle de la voix, deux lignes
  de dépannage, moteur 0.44.1 dans la liste des paquets.

- **Mise à jour des journaux : pages intactes mieux reconnues** (`scripts/mise-a-jour.js`, commun aux quatre modules LaKour) :
  à la création d'une page, le serveur Foundry pose sa date de modification quelques millisecondes après sa date de création
  (1 à 59 ms relevés sur LaKour). Une page importée avant les empreintes passait donc pour retouchée et n'était plus remise à
  jour. Elle compte maintenant comme intacte si elle n'a pas été modifiée plus de 5 secondes après sa création.

## Système 0.1.4 · Contenu 0.2.3 — 5 novembre 2026

- **Mise à jour commune aux quatre modules LaKour** (`scripts/mise-a-jour.js`, identique dans Fénoir, les Veillées, Warcraft et
  40k) : en plus de la 0.2.2, les pages sans clé se retrouvent par leur identifiant, les pages ajoutées ou réécrites par le
  MJ IA ne sont jamais touchées (repris des autres modules) et une page du module que le compendium n'a plus est retirée si
  personne ne l'a retouchée. Le système ne change pas, son numéro suit la publication.

## Système 0.1.3 · Contenu 0.2.2 — 5 novembre 2026

- **Mise à jour des mondes déjà installés** (`scripts/mise-a-jour.js`) : l'installateur ne sautait plus seulement les journaux
  présents, il les complète. Les pages nouvelles du compendium sont ajoutées (« Les tisanes et les zerbaz », « Médicaments,
  trousses et zerbaz »…), les pages que personne n'a retouchées reprennent le texte et le rang du compendium, les pages
  modifiées à la main restent telles quelles et sont nommées au MJ. Chaque page importée porte désormais une empreinte de son
  texte. Le numéro comparé par l'installateur était resté à 0.2.0 en contenu 0.2.1 (aucune mise à jour proposée) : un essai
  le lie maintenant à `module.json`. Le système ne change pas, son numéro suit la publication.

## Système 0.1.2 · Contenu 0.2.1 — 5 novembre 2026

- **Médicaments et zerbaz** (`docs/equilibre.md`) : une fouille trouve parfois une trousse de secours oubliée (+1 médicament,
  hors des réserves de la région ; un hôpital rend trois fois plus de médicaments) ; nouvelle ressource **plantes médicinales**
  (les zerbaz), cueillies aux alentours (fouille « plantes », ou en plus d'une cueillette), doublées par le nouveau savoir
  **Zerbaz et tisanes** (trois enfances et l'apiculteur) ; la recette **Tisanes et emplâtres** en fait des médicaments (2 plantes,
  sans savoir requis) ; morsure difficile aussi avec une décoction de zerbaz (1 plante) ou une trousse que porte le soignant,
  médicament et décoction +1 dé chacun ; pages « Les tisanes et les zerbaz » (guide du joueur) et « Médicaments, trousses et
  zerbaz » (guide du MJ), en français et en anglais ; le simulateur garde un médicament pour une morsure, cueille et prépare des
  tisanes. Solo sédentaire : 11 → 7 fins par l'infection sur 40 (−20 % sur 240 parties) ; enraciné à 4 : 17 → 26 vivants à J365
  sur les graines de référence (20 → 24 sur 240 parties).

## Système 0.1.1 · Contenu 0.2.0 — 5 novembre 2026

- **Équilibrage du 2026-11-05** (`docs/equilibre.md`) : glanage de passage (une fouille ramasse aussi ce que la nature
  offre, pris dans la nature des alentours ou de la région, qui ne se reconstitue que lentement : le nomade tient enfin un an,
  sans dépasser l'enraciné) ; événements du contenu à 35 % par jour (enraciné à 4 : 4,5 assauts par mois) ; factions jamais
  sous 0,5 dans leurs régions de départ (bandes et visites la 2e année) ; une recrue venue pendant un manque a une chance sur
  deux d'y avoir le niveau 2 ; morsure : test de soins difficile avec un médicament ou une infirmerie (extrême sinon) ; les
  fêtes du MJ IA suivent la date de jeu dès le chargement quand le moteur sait la recevoir (`sourceDeDate` : plus de carte
  de la Dipavali réelle dans une partie au 4 décembre).

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
