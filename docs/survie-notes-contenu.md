# Notes du contenu « Fénoir » (module lakour-fenoir) pour la logique (systems/lakour-survie)

Complément de `docs/survie-contrat.md` : ce que le contenu a ajouté aux formes du contrat, les repères chiffrés qu'il vise, et ce
que le système doit savoir pour lire `modules/lakour-fenoir/assets/donnees.json`. Tout est vérifié par
`outils/fabriquer-fenoir.mjs` (fonctions exportées) et `essais/contenu-fenoir.test.mjs`. Le registre passe aussi
`logique/contenu.mjs#verifierContenu` sans erreur.

## 1. Repères d'équilibre retenus

- Un groupe de **4** consomme **4 eau** (6 dans les Bas en saison des pluies, 1,5 par personne sous 400 m) et **4 nourriture** par jour.
- Facteurs de saison (comme `abri.mjs`) : pluie × 1 (pluies) / × 0,5 (sèche) ; soleil × 1 / × 0,8, et × soleil du site / 3.
- **Citerne de pluie** : 1 / 2 / 3 eau par jour × climat.pluie (stockage 30 / 60 / 120).
- **Captage de source** : 4 / 8 eau ; **pompe manuelle** (puits) : 4 / 8 ; **filtre** (eau brute) : 2 / 4 ; **bouilleur solaire** : 1 / 2 × soleil.
- **Potager** : 2 / 4 / 6 nourriture par jour après 30 jours, consomme 1 / 2 / 2 eau ; **serre** 2 / 4 ; **verger** 2 (240 j) / 4 (365 j) ;
  basse-cour 1 / 2 (20 j) ; cabris 1 (30 j) / 3 (60 j) ; tilapias 1 / 3 (60 j, le niveau 2 consomme 1 kWh) ; ruches 1 (45 j).
- **Panneaux solaires** : 2 / 4 / 6 kWh par jour × soleil ; **batteries** : 5 / 15 / 30 kWh ; **pico-hydro** 4 / 10 kWh (rivière) ;
  groupe électrogène 8 kWh pour 1 carburant et +2 de bruit ; éolienne 1 / 2.
- Consommateurs d'énergie : 1 kWh par jour chacun (poste radio, infirmerie 2, atelier 2, bassin 2, galerie 4, tunnel 3).
- **Compost** : sol +0,02 / +0,05 par jour.
- Les **effets d'un niveau sont TOTAUX** (ils remplacent ceux du niveau précédent), comme le dit `abri.mjs`.
- Les installations de départ d'un site (`installationsDepart`) sont **déjà en production** : un verger de départ a ses arbres
  adultes (le délai est passé) ; le système doit poser `termineLe` assez loin dans le passé.

Cinq **voies d'autonomie** (registre `autonomie.voies`) sont vérifiées en saison des pluies et en saison sèche avec ces règles
(`bilanVoie`) : la ferme des Hauts (Plaine des Cafres), l'îlet de Mafate (La Nouvelle), la case de l'Ouest sec (Bellemène), la
vallée de la Langevin (pico-hydro), le refuge sous la ferme d'Îlet à Cordes (galerie souterraine niveau 4, camouflage 3).
La voie défensive et discrète : `autonomie.voieDefensive`.

## 2. Champs ajoutés aux formes du contrat

- **Région (§2.1)** : `nature.<cle> = { parJour, plafond }` (forme que `natureRegion` accepte). `infrastructures.electricite: null`
  pour Mafate (panneaux de chaque case). Voisins : un seul par région voisine ; champ facultatif **`variante`** `{ route, terrain,
  km, quartsPied }` : un autre passage, plus lent, quand la route principale est coupée (chemin des Anglais pour la route du
  Littoral, Dos d'Âne pour la Rivière des Galets). Temps de trajet : entiers, au moins 1 quart.
- **Registre** : familles en plus de celles du §5 : `routes` (chaque liaison une fois), `recettes`, `afflictions`, `bestiaire`,
  `enfances`, `traits`, `reputations` (`paliers`, `factions`, `horloges`), `visibilite` (paliers 3, 5, 7, 9 et leur table),
  `camp` (activités du temps calme), `recrues` (`raisons`, `prix`), `histoire` (`proche`, `matin`), `noms` (`prenoms`, `surnoms`,
  `cyclones`), `autonomie` (`voies`, `voieDefensive`, `bras`), `fetes`.
- **Installation (§3.2)** : `effets.bonus: { competence: n }` (dés en plus : atelier → bricolage, tour de guet → vigilance,
  antenne → parole) ; `effets.bras: { tache, nombre } | null` (§10.3) sur les installations qui demandent des travailleurs.
  Les coûts peuvent citer `nourriture` (chiens, basse-cour) ou `medicaments` (infirmerie). Productions fractionnaires possibles
  (`medicaments: 0.1` des ruches et de l'infirmerie 2) : à cumuler jour après jour.
- **Événement (§2.6)** : `effets` dans le vocabulaire de `monde.mjs` (`infestation`, `pillage`, `route`, `duree`, `horde`, `faction`,
  `force`, `nature`) et un champ **`effets.abri`** que la simulation ignore : `{ stocks: { r: −n }, degats, blessure, moral, bruit,
  decouverte: { r: n } }`, indications pour le MJ (ou le MJ IA, par `ajuster`) quand l'événement touche l'abri du groupe.
- **Faction (§2.5)** : `croissance` (par jour), `ressourcesPreferees`, `veulent`, `traiter` (HTML), `chef`, `signe`.
- **Équipement (§3.4)** : `categorie` (`arme`, `arme-a-feu`, `outil`, `soin`, `transport`, `communication`, `energie`, `vie`, `livre`),
  `bruit` (ajouté quand on s'en sert), `munitions` = unités consommées par échange de tirs (null hors arme à feu),
  `transport: { mode: "vehicule" | "bateau" | "pied", places, chargeMax, carburantParQuart, terrains: [..], bruit }` pour les
  véhicules et montures (âne, cheval : mode `pied`, terrains `sentier` compris), `effets` (forme d'un effet d'installation) pour
  les panneaux démontables, la batterie nomade, les radios (`renseignements`), le poêle de masse (`moral`).
- **Passé (§3.4 et §10)** : `accroche` (HTML), `region` (départ suggéré), `incapacites`, `histoire` (phrases). `competences` sont
  les modificateurs du passé (0 à 3).
- **Recette, affliction** : formes de `fabrication.mjs` et `maladies.mjs`. Les objets du compendium ont les types **`recette`** et
  **`affliction`** : le système doit déclarer ces types d'objet (template.json / system.json), sinon Foundry rejettera ces deux
  compendiums. Affliction : `prevention` (HTML) en plus.
- **Bestiaire** : `{ cle, nom, categorie: "livide" | "animal" | "humain", des, resistance, vitesse, sens, zones, phases, description,
  comportement, faiblesse, competences }`. Les acteurs du compendium `bestiaire` sont des `survivant` (`livide: true` pour un
  Livide) avec la fiche dans `flags.lakour-fenoir.bestiaire`.
- **Survivant (§10.1)** : prétirés et PNJ ont `enfance`, `passions`, `traits`, `incapacites`, `statut` (`joueur` / `pnj`), `tache: ""`,
  `histoire: { journal: "" }`. Les prétirés portent `flags.lakour-fenoir.pretire` ; budget vérifié 10 à 16.
- **Enfance** : `{ cle, nom, origine: "reunion" | "ailleurs", region, description, modificateurs: { competence: −1..+2 }, savoirs,
  incapacites, equipement, histoire: [phrases], poids }`.
- **Trait** : `{ cle, nom, description, effets: { competences, moral, fatigue, peur: { lieu, malus } | null, besoins: { nourriture:
  facteur }, taches: { tache: ±n }, social: { seuil, moral } | null, special }, incompatibles, incapacites, poids }`.
  Incompatibilités symétriques. `peur.lieu` : `souterrain`, `hauteur`, `mer`. Clés `special` à appliquer par la logique ou le MJ :
  `nerfs-d-acier` (ne craque pas à moral 0, une fois), `souterrain-a-l-aise`, `matin`, `nuit`, `robuste` (la première blessure d'un
  combat ne compte que pour une égratignure), `fragile` (la première blessure compte un cran de plus), `asthme` (+1 fatigue après
  course, chantier, incendie), `fetes-religieuses` (+1 moral aux fêtes religieuses), `tetu`, `genereux`, `chapardeur`, `manque`
  (−1 moral après 7 jours sans tabac), `sang-froid`, `protecteur`, `sensible` (−2 moral à la mort d'un compagnon), `langues`,
  `marcheur` (un quart de moins sur les longs trajets en sentier).
- **Incapacités** (vocabulaire, `aides.mjs#INCAPACITES`) : `violence`, `soins`, `travaux-lourds`, `conduite`, `parole`, `cultures`,
  `nuit`, chacune avec les compétences et tâches qu'elle interdit.
- **Tâches** (§10.3) et compétence de chacune : `aides.mjs#COMPETENCE_TACHE`.
- **Appels et demandes** : données dans `flags.lakour-fenoir.appel = { type, recompense: { ressource: n }, faction | null, reputation }`
  de chaque résultat ; tables `appels-radio` et `demandes-<faction>` (drapeau `flags.lakour-fenoir.appels`).
- **Réputations** : horloges `rep-<faction>` (type `reputation`), départ selon l'attitude (hostile −8, méfiante −2, neutre 0,
  amicale 5), paliers `[{ nom, min }]` : Hostile −20, Méfiante −4, Neutre 0, Amicale 5, Alliée 10. Assurées par `scripts/main.js`
  (api.horloges.assurer) chez le MJ actif.
- **Visibilité** : paliers 3 (on parle de vous), 5 (éclaireurs), 7 (visite), 9 (assaut) ; table `visibilite-<palier>` chacune.
- **Fêtes** : `scripts/fetes.js`. `moteur` = la fête du calendrier réel du moteur déclinée (noel, nouvel-an, paques, halloween,
  musique) ou null ; `date` "MM-JJ" ou `dates` par année ; fenêtre `avant` / `apres` ; `image` assets/fetes/<cle>.jpg (à produire) ;
  `effet` : +1 moral à chacun, une fois par fête, une ration de plus par personne. `fetesDuJour(dateDeJeu)` donne les fêtes du
  calendrier DU JEU (20 décembre, Dipavali, Nouvel An chinois, Cavadee, letchis, 14 juillet, Toussaint n'existent pas au
  calendrier du moteur : à brancher côté système / MJ IA sur la date de jeu).

## 3. Enregistrement

`scripts/main.js` lance le `fetch` de `assets/donnees.json` à l'« init ». Au crochet `lakourSurvie.enregistrer`, si les données sont
là, `registre.ajouter(donnees)` ; sinon le module ajoute dès l'arrivée et passe la promesse à `registre.attendre?.(promesse)` : le
système peut proposer `attendre` pour être sûr (ou tolérer un `ajouter` tardif avant le `ready`).

## 4. Hors du périmètre de cette livraison

- Images : `assets/cartes/reunion.webp`, `assets/fetes/*.jpg`, `assets/monde/fond.jpg` (chemins posés, fichiers à produire).
- Jetons : seules les icônes déjà copiées dans `modules/lakour-mj-ia/outils/game-icons/` sont utilisées ; il n'y en a pas pour
  les véhicules (relancer `outils/fabriquer-jetons-fenoir.mjs --source <archive game-icons>` après avoir ajouté des icônes).
