# Contrat commun — « Fénoir » (survie à La Réunion)

Trois pièces écrites en parallèle doivent s'emboîter :
- le **système** `lakour-survie` (dossier `systems/lakour-survie/`) : les règles, l'horloge du monde, la simulation, les données ;
- le **module de contenu** `lakour-fenoir` (dossier `modules/lakour-fenoir/`) : La Réunion (régions, sites d'abri, routes),
  les installations, les savoir-faire, les factions, les événements, les guides et les tables ;
- le **MJ IA** (`modules/lakour-mj-ia/`, sous-module) : l'adaptateur `lakour-survie` et les outils `survie_*`.

Ce fichier est la seule source de vérité de leurs échanges. Foundry v14 (14.369). Tout en français, textes **originaux** :
rien de *The Walking Dead* (ni série, ni BD, ni jeux), rien du jeu de rôle de Free League, aucun nom de personnage, de lieu
inventé ou de règle repris d'une œuvre existante. La géographie réelle de La Réunion (communes, cirques, routes, sites
naturels, centrales) est un fait : on peut la nommer. Pas de marque commerciale réelle dans les noms de sites
(« l'hypermarché de Savanna », pas une enseigne).

## 0. Le jeu en une page

**Fénoir** (« la nuit », en créole) : un mal inconnu, *le Gris*, transforme les morts en **Livides**. Les joueurs vivent à
La Réunion et débarquent **au jour zéro** : tout marche encore, rien ne va plus. Le temps avance **avec leurs actions** ;
le monde extérieur avance avec lui (réseaux qui tombent, villes qui se vident ou se remplissent de Livides, bandes qui
naissent, cyclones, éruption). Ils cherchent le meilleur endroit pour un **abri**, l'aménagent, vivent de **ressources**
qui s'épuisent. Deux voies, aussi valables l'une que l'autre :
1. **Repartir** : quand l'endroit est épuisé ou intenable, déménager ailleurs, en emportant ce qu'on peut porter, ses
   **compétences** (qui ont progressé) et ses **plans** (ce qu'on a déjà su construire se reconstruit plus vite). Le lieu
   d'arrivée a changé depuis la dernière fois qu'on l'a vu : les renseignements sont datés.
2. **S'enraciner** : viser l'**autonomie** (eau de pluie et captage, potager, élevage, bassin, panneaux solaires,
   batteries, pico-hydro, galeries souterraines, tunnel de lave aménagé) pour ne plus jamais avoir à bouger. La prospérité
   se voit et s'entend : elle attire bandes et hordes ; la discrétion (souterrain, camouflage) et la défense la protègent.

Joueurs : **solo** (un humain avec le MJ IA, éventuellement des compagnons IA), **groupe d'humains**, ou **1 à 5 humains et
des compagnons IA**. Le meneur est le MJ IA ou un MJ humain : le système fonctionne sans IA (fenêtres du MJ).

Ton : survie réaliste et humaine, entraide et dilemmes, horreur sobre (pas de gore complaisant), la beauté de l'île en
contrepoint (cirques, lagon, letchis de décembre, brume des Hauts). Créole réunionnais en touches légères dans les
dialogues, toujours compréhensible.

**Le twist original (règle du monde)** : la chaleur humide des Bas décompose les Livides en quelques mois ; le frais des
Hauts et des cirques les conserve bien plus longtemps. Au début, les Hauts semblent sûrs (peu peuplés) et les villes du
littoral sont l'enfer ; des mois plus tard, le littoral se vide de Livides mais se remplit de bandes humaines, et les Hauts
gardent leurs vieux Livides, lents et nombreux. Le « meilleur endroit » change avec le temps : c'est le moteur des
déménagements.

## 1. Règles du système (logique pure, `systems/lakour-survie/logique/`)

### 1.1 Le test
- Réserve de **d6** = niveau de la compétence (0 à 5) + 1 + bonus (outil adapté +1, aide d'un autre +1, situation ±1 ou ±2)
  − malus d'état (§1.3). Minimum 1 dé, maximum 10.
- Chaque **5 ou 6** est un **succès**. Difficulté = succès requis : `normale` 1, `difficile` 2, `extreme` 3
  (`facile` : 1 succès avec +1 dé). Réussite si succès ≥ requis ; **marge** = succès − requis.
- **Forcer** (une fois par test) : relancer tous les dés qui ne sont pas des succès, au prix de **1 fatigue**. Un test forcé
  qui échoue encore donne une **complication** (le MJ en choisit une : bruit, outil cassé, blessure légère, temps perdu).
- **Progression** : un test **qui comptait** (danger, enjeu) donne une **marque** à sa compétence s'il est **échoué** ou
  **forcé** (on apprend de ses erreurs et de ses efforts). Quand les marques atteignent `2 × (niveau + 1)`, la compétence
  monte de 1 (max 5) et les marques repartent à 0. Le MJ peut aussi donner une marque après une scène marquante.

Fonctions (logique/des.mjs) : `reserve({ niveau, bonus, malus })`, `lancer(n, hasard)`, `compter(des)`,
`resoudreTest({ niveau, difficulte, bonus, malus, forcer, hasard })` →
`{ des, desForces, succes, requis, reussite, marge, force, complication, marque }`.

### 1.2 Compétences (clés stables)
`endurance` (porter, creuser, courir, résister), `combat` (corps à corps), `tir`, `discretion`, `vigilance` (repérer,
monter la garde), `bricolage` (réparer, construire, électricité, mécanique), `survie` (eau, cultures, pêche, chasse,
orientation, plantes), `soins`, `parole` (convaincre, négocier, apaiser, commander), `conduite` (véhicules, deux-roues,
bateau).

### 1.3 État d'un survivant
- `blessures` 0 à 4 (0 indemne, 1 égratigné, 2 blessé, 3 grièvement, 4 mourant : un test de soins difficile dans le quart,
  sinon mort). Malus : −1 dé à 2, −2 à 3.
- `fatigue` 0 à 5. Malus : −1 dé à 3 et 4, −2 à 5. Une nuit de repos à l'abri : −2 ; un quart de repos : −1.
- `moral` 0 à 5 (5 = solide). À 1 : −1 dé ; à 0 : le personnage craque (refuse, fuit, s'effondre : scène de MJ).
- `faim` et `soif` : jours sans manger / quarts sans boire. Soif ≥ 4 quarts : +1 fatigue par quart ; faim ≥ 2 jours :
  +1 fatigue par jour, moral −1.
- `infection` : `{ atteint, stade 0..6, depuis (quart) }`. Une **morsure** ou une griffure profonde d'un Livide : test
  `soins` **extrême** dans le quart (lavage, cautérisation, amputation selon l'endroit, décrite par le MJ) ; échec :
  infecté. Le stade monte de 1 tous les 2 quarts ; à 6, la personne meurt et se relève Livide au quart suivant si rien n'est
  fait. Aucun remède connu (le monde pourra en révéler plus tard : c'est au MJ). Les compagnons et PNJ suivent la même règle.
- `savoirs` : objets `savoir` possédés (§3.3). `marques` par compétence.

### 1.4 Le temps
- Unité : le **quart** (6 heures). 4 quarts par jour : `matin` (6 h–12 h), `apres-midi`, `soir`, `nuit`.
  `horloge.quart` = nombre de quarts depuis le jour zéro à 6 h. Jour = `floor(quart / 4)`, moment = `quart % 4`.
- `dateDepart` (réglage monde, ISO, défaut `"2026-12-04"`) : date réelle du jour zéro ; la date de jeu en découle.
  Saisons de La Réunion : **été austral / saison des pluies et des cyclones** de novembre à avril, **hiver austral / saison
  sèche et fraîche** de mai à octobre. Fruits de saison (letchis en décembre-janvier, mangues de novembre à janvier) : bonus
  de cueillette.
- **Coût en temps** des actions (indicatif, le MJ ajuste) : fouiller un lieu 1 quart ; explorer une région 1 à 2 quarts ;
  monter la garde 1 quart ; voyager selon la route (§2.2) ; construire selon l'installation (quarts de travail ÷ bras).
- `avancer(n)` fait passer n quarts : à chaque quart, l'**effet du quart** (infection, soif, garde, bruit qui retombe) ; à
  chaque changement de jour, l'**effet du jour** (consommation, production, pertes, simulation du monde, événements).

### 1.5 Phases de la crise (selon le jour, modulées par la simulation)
| Phase | Jours | Ce qui se passe |
|---|---|---|
| `jour-zero` | 0–1 | Premiers cas, rumeurs, urgences saturées, embouteillages, réseaux encore là. |
| `panique` | 2–6 | Couvre-feu, évacuations, pillages, rotations d'avions et de bateaux, premières coupures. |
| `effondrement` | 7–20 | Électricité, eau courante, carburant, téléphone tombent région par région (dates tirées au début, §2.3). |
| `silence` | 21–59 | Plus d'autorité ; groupes et bandes s'organisent ; hordes errantes. |
| `apres` | 60+ | Les Livides des Bas se décomposent ; les bandes humaines dominent le littoral ; les Hauts restent froids et peuplés de Livides anciens. |

### 1.6 Ressources du groupe (stocks de l'abri, entiers)
`eau` (1 = un jour d'eau pour une personne), `nourriture` (1 = un jour de repas), `carburant` (1 = 10 litres),
`medicaments` (1 = de quoi traiter une blessure ou une fièvre), `munitions` (1 = un chargeur ou une poignée de
cartouches), `materiaux` (bois, tôle, ciment, grillage : 1 = une brouette), `pieces` (électronique, mécanique,
électrique : 1 = une caisse), `graines` (1 = de quoi semer une planche), `energie` (kWh stockés, plafonnés par les
batteries).
- **Consommation quotidienne** : par personne 1 eau (1,5 dans les Bas en saison chaude) et 1 nourriture.
- **Pertes** : sans réserve étanche ni séchoir/fumoir, 5 % de la nourriture (arrondi à l'entier supérieur s'il y en a) se
  gâte chaque jour (chaleur humide).
- **Production** : celle des installations (§3.2), chaque jour, selon leurs conditions (pluie, soleil, rivière, saison,
  délai de croissance, énergie disponible).
- **Autonomie** : un jour où eau, nourriture et énergie nettes (production − consommation − pertes) sont ≥ 0 sans aucune
  fouille compte comme **jour autonome** ; `joursAutonomes` (consécutifs) et `autonome` (≥ 7) sont publics. Le MJ le raconte.

### 1.7 Bruit, visibilité, menaces
- **Bruit** de l'abri (0 à 10, retombe de 2 par quart) : coup de feu +2 (rafale +4), groupe électrogène +2 par quart
  allumé, moteur +1, chantier +1, cri / alarme +2. **Visibilité** (0 à 10, calculée) : lumières la nuit, fumée,
  cultures visibles, taille du groupe, installations voyantes, moins la discrétion du site et du camouflage.
- Chaque jour, la simulation tire les **menaces** pour l'abri : hordes de passage (selon l'infestation, les hordes proches et
  le bruit cumulé), visite d'une bande ou d'un groupe (selon les factions de la région et la visibilité), animaux, accidents.
- **Assaut contre l'abri** : réserve de **défense** (défense de l'abri + meilleur `vigilance` de la garde) contre la
  **force** de la menace (nombre de d6 de la menace, mêmes succès 5–6). Marge ≥ 0 : repoussée (dégâts mineurs possibles) ;
  marge −1 : une installation endommagée et une blessure ; marge ≤ −2 : **brèche** (scène de combat, risque de devoir fuir).
- **Rencontres** pendant les sorties : Livides (nombre), humains (faction, intentions), animaux (chiens errants), dangers
  (radier en crue, éboulement, incendie). Combat simple : chaque succès de `combat`/`tir` met un Livide hors d'état ; chaque
  Livide restant attaque (1 d6 chacun : 6 = touche ; une touche = 1 blessure et, sur un 6 au d6 de morsure, morsure).
  Tirer fait du bruit (+2 par échange).

## 2. Le monde

### 2.1 Région (contenu, `lakour-fenoir`)
```
{
  cle: "saint-denis",                 // identifiant stable
  nom: "Saint-Denis",
  zone: "littoral" | "hauts" | "cirque" | "volcan" | "foret",
  altitude: Number,                   // altitude moyenne en m (décomposition des Livides, §0)
  population: 0..5,                   // densité humaine au jour zéro (infestation de départ, pillage)
  climat: { soleil: 0..3, pluie: 0..3 },   // l'Ouest sec et ensoleillé, l'Est très pluvieux
  description: HTML,                  // ce qu'on y voit au jour zéro (texte original)
  apres: HTML,                        // ce qu'elle devient, en grandes lignes (pour le MJ)
  ressources: { nourriture, eau, carburant, medicaments, munitions, materiaux, pieces, graines },  // réserves pillables au jour zéro (unités)
  nature: { cueillette, gibier, peche, bois },   // ressources naturelles (renouvelables) par jour et leur plafond
  infrastructures: { electricite: [jourMin, jourMax], eau: [jourMin, jourMax], carburant: [min, max], telephone: [min, max] },
                                      // fenêtre où chaque réseau tombe dans la région (tiré au début de la partie) ;
                                      // electricite: null = ne tombe pas toute seule (micro-hydro local, ex. un îlet)
  dangers: [String],                  // clés d'événements propres (crue, eboulement, eruption, incendie…)
  factionsDepart: [ { faction, force } ],
  sites: [cle de site],
  voisins: [ { region, route, km, terrain: "route" | "piste" | "sentier" | "mer", quartsPied, quartsVehicule|null,
              coupure: [cle d'événement] } ],
  repere: { x, y }                    // position sur la carte de l'île (pixels de la scène « Carte de La Réunion »)
}
```
Une quinzaine de régions couvrent l'île : Saint-Denis, Sainte-Marie et l'aéroport, Le Port et La Possession, la route du
Littoral, Saint-Paul et la côte Ouest (Saint-Gilles, lagon), les Hauts de l'Ouest (Maïdo, Tévelave), Saint-Leu et l'Étang-Salé,
Saint-Louis et Saint-Pierre, Le Tampon et la Plaine des Cafres, Saint-Joseph et le Sud sauvage (Saint-Philippe, Grand Brûlé),
le Piton de la Fournaise et la Plaine des Sables, l'Est (Saint-André, Saint-Benoît, Sainte-Rose), la Plaine des Palmistes et
Bélouve, et les trois cirques : **Cilaos**, **Salazie**, **Mafate** (sans route : sentiers ou hélicoptère).

### 2.2 Site d'abri (contenu)
```
{
  cle: "college-hauts-saint-paul", region: "saint-paul", nom, description: HTML,
  type: "maison" | "case-creole" | "immeuble" | "ecole" | "commerce" | "ferme" | "gite" | "ilet" | "caserne" | "hopital"
      | "port" | "phare" | "tunnel-de-lave" | "galerie" | "usine" | "eglise" | "autre",
  capacite: Number,                   // personnes logées sans aménagement
  defense: 0..5, discretion: 0..5,    // de base
  eau: "aucune" | "citerne" | "riviere" | "source" | "puits" | "reseau",
  sol: 0..3,                          // terre cultivable (0 = béton)
  soleil: 0..3,                       // ensoleillement utile (ombre, falaise, toit)
  souterrain: 0..3,                   // potentiel de galeries (roche saine, cave, tunnel de lave existant = 3)
  acces: 0..3,                        // facilité d'accès (véhicule) — utile pour fuir, dangereux pour être trouvé
  stocks: { …ressources },            // ce qu'on trouve sur place à l'installation (une fois)
  atouts: [String], defauts: [String],// en clair, pour le MJ et les joueurs
  installationsDepart: [ { installation, niveau } ]   // ce qui existe déjà (citerne d'une case, mur d'une caserne…)
}
```
Deux à quatre sites par région (une cinquantaine), de toutes sortes : la case créole à varangue, le collège sur la colline,
le supermarché, la caserne, le gîte de montagne, l'îlet de Mafate, le phare, la ferme des Hauts, la distillerie, la centrale
hydroélectrique, un **tunnel de lave** du Sud (abri souterrain rare, frais et discret, sans eau ni soleil), etc.

### 2.3 État du monde (SECRET, simulé par le système)
```
monde: {
  graine: String,                     // graine du hasard de la partie
  jour: Number,                       // dernier jour simulé
  coupures: { region: { electricite, eau, carburant, telephone } },   // jour de coupure tiré (null = jamais)
  regions: { cle: {
    infestation: Number 0..5 (réel),
    pillage: { …ressources restantes },
    nature: { cueillette, gibier, peche, bois },   // stock naturel courant (se régénère vers le plafond)
    factions: { faction: force 0..5 },
    routes: { regionVoisine: "ouverte" | "difficile" | "coupee" },
    evenements: [ { cle, depuis, jusqua } ],       // crue, incendie, éboulement, coulée de lave, cyclone…
    abrisAbandonnes: [ { site, depuis, installations, occupe: faction|null } ]
  } },
  hordes: [ { id, region, taille 1..5, cap: regionVoisine|null, depuis } ],
  cyclone: null | { nom, alerte: "pre-alerte" | "orange" | "rouge" | "passe", arrivee: jour, force 1..3, trajectoire: [region] },
  eruption: null | { debut, fin, regions },
  journalSecret: [ { jour, texte, cle, params } ]  // ce qui s'est passé hors de la vue des joueurs (pour le MJ) ; cle/params : traduction (§2.3 faits)
}
```
**Simulation d'un jour** (`logique/monde.mjs`, `simulerJour(monde, contenu, hasard, jour, bruitParRegion)` → `{ monde, faits }`,
pure, déterministe pour une graine) :
- **Infestation** : monte vite dans les régions peuplées pendant `panique` et `effondrement` (vers `population`),
  puis, à partir de `apres`, **décroît** dans les régions basses (altitude < 400 m : −0,045 par jour) et bien plus lentement
  en altitude ; les hordes l'augmentent là où elles passent.
- **Hordes** : naissent dans les régions à infestation ≥ 4 (phase `effondrement` et après), se déplacent d'une région
  voisine à l'autre par les routes ouvertes, attirées par le **bruit** cumulé (celui du groupe compris) ; se dispersent avec
  le temps et la chaleur.
- **Pillage** : chaque jour, les autres survivants prennent une part des réserves (selon population et phase) ; les
  réserves ne reviennent jamais (sauf `nature`, qui se régénère selon la saison).
- **Réseaux** : tombent au jour tiré ; `carburant` ne revient jamais.
- **Factions** : grossissent, s'affaiblissent, se déplacent, occupent les abris abandonnés (§2.4).
- **Météo** : en saison des pluies, cyclone possible (pré-alerte 2 jours avant, alerte orange la veille, rouge le jour) ;
  fortes pluies : routes « difficile » ou « coupée » (radiers submergés, éboulements de la route du Littoral, de Cilaos, de
  Salazie) ; l'éruption de la Fournaise peut couper la route des Laves dans le Sud-Est.
- **faits** : liste d'événements datés `{ jour, region, cle, public: Boolean, texte, params, cleTexte? }`. `public` = ce que
  le groupe peut voir ou entendre d'où il est (fumée d'un incendie voisin, coups de feu, la radio s'il en a une) ; le reste
  va au journal secret. `texte` est le français de la logique (repli) ; la couche Foundry affiche
  `LAKOUR_SURVIE.Faits.<cleTexte ?? cle>` avec `params` dans la langue de chaque navigateur (`logique/textes.mjs`,
  `scripts/donnees.mjs` `localiser`, `game.lakourSurvie.localiser`). Les menaces, rencontres et motifs de refus
  (`motif`/`motifs`) portent de même `{ cle, params, texte }`.

### 2.4 Renseignements (PUBLIC) : ce que le groupe croit savoir
```
renseignements: { region: {
  vu: jour | null,                     // dernière observation directe (ou "radio" : moins fiable)
  source: "vu" | "radio" | "rumeur",
  infestation: "inconnue" | "calme" | "presente" | "dense" | "grouillante",   // bande lue au moment `vu`
  pillage: "inconnu" | "intact" | "entame" | "maigre" | "vide",
  electricite, eau: Boolean | null, routes: { voisine: etat }, factions: [faction], notes: String
} }
```
Mis à jour par `explorer`, `fouiller`, `voyager` (la région où l'on passe), la radio et le MJ. **Le MJ (et l'IA) voient le
réel et le connu ; les joueurs ne voient que le connu, daté.** Un déménagement se prépare sur des renseignements qui
vieillissent : c'est voulu.

### 2.5 Factions (contenu)
`{ cle, nom, description: HTML, attitude: "hostile" | "mefiante" | "neutre" | "amicale", regionsDepart, croissance,
ressources préférées, ce qu'elles veulent, comment traiter avec elles }`. Originales : par exemple un reliquat
militarisé autour du port, une coopérative de planteurs des Hauts, des récupérateurs du littoral, des pêcheurs du Sud, une
communauté religieuse, les familles des îlets de Mafate, des bandes de pillards. Noms et textes inventés.

### 2.6 Événements (contenu)
`{ cle, nom, type: "meteo" | "reseau" | "horde" | "humain" | "accident" | "decouverte" | "abri" | "fete",
phases: [phase], zones: [zone], saisons: ["pluies" | "seche"], poids, public: Boolean, texte: HTML, effets: { … } }` :
la simulation en tire les effets simples (route coupée, stock perdu, infestation +1…) ; le MJ raconte le reste.

## 3. Documents Foundry

### 3.1 Acteurs
**Actor `survivant`** (personnage joueur, compagnon IA ou PNJ nommé)
```
system: {
  competences: { endurance: { niveau 0..5, marques }, combat, tir, discretion, vigilance, bricolage, survie, soins, parole, conduite },
  blessures: 0..4, fatigue: 0..5, moral: 0..5 (défaut 4), faim: Number, soif: Number,
  infection: { atteint: Boolean, stade: 0..6, depuis: Number },
  passe: String,            // ce qu'il était le jour zéro (métier, vie) — clé d'un « passé » du contenu ou texte libre
  age: Number, lien: String,// lien avec le groupe
  vivant: Boolean = true, livide: Boolean = false,
  charge: Number,           // unités portées (inventaire de route)
  notes: HTML
}
```
**Actor `abri`** (un par abri occupé ou abandonné connu ; l'abri courant est `groupe.abri`)
```
system: {
  site: String, region: String,
  installeLe: Number (quart), abandonneLe: Number|null,
  stocks: { eau, nourriture, carburant, medicaments, munitions, materiaux, pieces, graines, energie },
  nature: { cueillette, gibier, peche, bois },   // alentours (copie de la région à l'arrivée, puis entamée par le groupe)
  sol: Number,              // fertilité restante (baisse sans compost)
  bruit: 0..10,
  degats: Number,           // dégâts structurels non réparés
  notes: HTML
}
```
Les **installations** sont des objets `installation` incorporés à l'abri ; la défense, la discrétion, la capacité, la
visibilité et la production se **calculent** (`logique/abri.mjs`, `bilanAbri(abri, contenu, conditions)`).

### 3.2 Objet `installation`
```
system: {
  cle: String, categorie: "defense" | "eau" | "nourriture" | "energie" | "vie" | "souterrain" | "stockage" | "communication",
  description: HTML,
  niveau: 0..niveauMax (0 = en chantier), niveauMax: Number,
  chantier: { fait: Number, requis: Number },     // quarts de travail faits / requis pour le niveau suivant
  etat: 0..3,                                     // 0 intacte, 3 hors service (à réparer)
  niveaux: [ {                                    // un par niveau, du 1 au niveauMax
    cout: { materiaux, pieces, graines, … , travail: Number (quarts-personne) },
    requiert: { savoirs: [cle], site: { eau: [valeurs], sol: min, soleil: min, souterrain: min }, installations: [ { cle, niveau } ] },
    effets: {
      production: { eau, nourriture, energie, medicaments },   // par jour
      conditions: { pluie: Boolean (×climat.pluie), soleil: Boolean (×climat.soleil × saison), riviere: Boolean, delai: jours avant la première récolte },
      consommation: { energie, carburant, eau },
      defense, discretion, capacite, visibilite, bruit, stockage: { ressource: plafond }, protectionCyclone: 0..3,
      soins: Number (bonus aux tests de soins), moral: Number (confort), conservation: Boolean (supprime les pertes),
      sol: Number (compost : fertilité regagnée par jour), renseignements: Boolean (radio)
    }
  } ]
}
```
Une trentaine d'installations : barricades, palissade, mur, tour de guet, fossé et pièges, chiens de garde, porte blindée ;
citerne de pluie, filtre à sable et charbon, bouilleur solaire, captage de source, pompe manuelle ; potager, serre, verger
(délai long), basse-cour, cabris, bassin à tilapias, ruches, compost ; panneaux solaires, batteries, pico-hydro sur rivière,
groupe électrogène (carburant, bruit), éolienne de récupération ; séchoir/fumoir, réserve étanche, atelier, infirmerie,
dortoir, cuisine commune ; radio, antenne ; **galerie souterraine** en quatre niveaux (cave étayée, galerie, réseau,
refuge complet : discrétion, défense, protection cyclonique, capacité) ; **aménagement d'un tunnel de lave**.

### 3.3 Objet `savoir` (savoir-faire acquis, gardé d'un abri à l'autre)
`system: { cle, description: HTML, apprentissage: HTML (comment l'acquérir : passé, livre trouvé, enseignement d'un PNJ,
réussir un chantier), effets: HTML }`. Exemples : électricité solaire, maraîchage tropical, plomberie et filtration,
maçonnerie, mécanique, premiers secours avancés, pêche au lagon, élevage, conserverie, étaiement et galeries, radio.
**Plans** : chaque installation construite au moins une fois par le groupe entre dans `groupe.plans` : la reconstruire ailleurs
coûte **25 % de matériaux en moins** et **la moitié du travail**. C'est la « meilleure compétence » qui fait repartir plus fort.

### 3.4 Autres objets
`ressource` (non : les stocks sont des nombres), `equipement` : `{ cle, description, bonus: { competence: n }, charge, usure,
munitions }` (armes, outils, véhicules légers, radio portative, panneaux démontables…). `passe` : `{ cle, description,
competences: { cle: niveau }, savoirs: [cle], equipement: [cle] }` (ce que chaque survivant était au jour zéro :
infirmière, électricien, pêcheur, planteur de canne, gendarme, étudiante, guide de montagne, mécanicien, cuisinière de
camion-bar, retraité de la marine…).

## 4. État de la partie et secrets

- Réglage monde **`lakour-survie.partie`** (PUBLIC, écrit par le seul MJ actif) :
```
{
  partie: String, demarree: Boolean,
  horloge: { quart: Number },
  phase: String,
  groupe: { abri: acteurId|"" , membres: [acteurId], pnj: [ { id, nom, passe, etat, travail: Boolean } ],
            plans: [cle d'installation], region: cle, enRoute: null | { de, vers, route, reste (quarts), transport } },
  renseignements: { … §2.4 },
  joursAutonomes: Number, autonome: Boolean,
  alertes: [ { quart, type, texte, cle?, params? } ],  // ce que le groupe sait : alerte cyclonique entendue, horde aperçue…
  journal: [ { quart, texte, cle?, params? } ]         // chronique publique (les 200 dernières entrées) ; cle/params : traduction à
                                                       // l'affichage (clé sans point : LAKOUR_SURVIE.Faits.*, avec point : LAKOUR_SURVIE.*) ;
                                                       // `texte` : repli (français de la logique, ou traduction au moment de l'écriture)
}
```
- Le **monde réel** (§2.3) est SECRET : réglage monde **`lakour-survie.coffre`** = l'état du monde **scellé** avec le coffre du
  MJ IA (`game.modules.get("lakour-mj-ia").api.coffre.sceller(contenu)` / `ouvrirScelle(scelle)`), réécrit après chaque
  action qui le change (actions toutes publiques : pas de rythme à cacher). En mémoire chez le MJ actif, gardé aussi en réglage
  **client** `lakour-survie.monde` rangé par [monde][userId] (rechargement rapide). Sans le moteur (module coupé) : réglage monde
  `lakour-survie.mondeClair` et un avertissement permanent au MJ (« les joueurs peuvent lire l'état du monde »).
  Tant que le monde n'est pas ouvert chez le MJ actif, rien ne s'écrit (`ecritureBloquee`), comme aux Veillées.
- Les **acteurs** et leurs objets sont publics (ce n'est pas un jeu de secrets entre joueurs) ; joueurs **propriétaires** de leur
  survivant, **observateurs** de l'abri courant (ils voient stocks et installations, n'écrivent pas : tout passe par le MJ).

## 5. API du système : `game.lakourSurvie` (prête au `ready`)

Les fonctions qui écrivent ne marchent que chez le MJ actif (sinon erreur claire `LAKOUR_SURVIE.Erreurs.PasMJActif`).
```
contenu()                                   -> { regions, sites, installations, savoirs, factions, evenements, passes, equipements }
                                               (le registre rempli par le module de contenu, §6)
etat()                                      -> copie de l'état public
monde()                                     -> copie du monde réel (MJ actif, coffre ouvert ; null sinon)
quand()                                     -> { quart, jour, moment, date: "AAAA-MM-JJ", dateTexte, saison, phase }
demarrer({ dateDepart?, graine?, region, membres: [acteurId], pnj? })
                                            -> nouvelle partie : tire les coupures, initialise le monde, place le groupe
avancer({ quarts, raison })                 -> { quand, faits: [publics], alertes, bilan } ; journal
test({ acteurId, competence, difficulte, bonus, malus, forcer, titre, compte: Boolean })
                                            -> { …resoudreTest, texte } ; message au chat avec les dés ; marque si `compte`
forcer({ messageId })                       -> force un test déjà lancé (bouton de la carte de chat)
explorer({ region, membres, quarts })       -> { renseignement, rencontre|null, faits }
fouiller({ region, site?, cible?: ressource, membres, quarts, prudence: "discret" | "normal" | "rapide" })
                                            -> { butin: { ressource: n }, rencontre|null, bruit, faits }
installer({ site, abriId? })                -> crée ou reprend l'acteur abri, stocks du site, installations de départ
construire({ installation, membres, quarts }) -> { chantier, termine: Boolean, niveau } (coûts payés au premier quart)
reparer({ installationId, membres, quarts })
voyager({ vers, transport: "pied" | "vehicule" | "bateau", membres, charge })
                                            -> { arrivee: Boolean, quarts, rencontre|null, faits } (routes réelles, pas connues)
demenager({ site, emporter: { ressource: n }, transport })   -> abandonne l'abri courant (gardé comme abri abandonné), voyage, s'installe
ajuster({ stocks?: { ressource: delta }, acteurId?, etat?: { blessures, fatigue, moral, faim, soif }, raison })
blesser({ acteurId, n, morsure }) / soigner({ acteurId, soigneurId }) / infecter({ acteurId })
marquer({ acteurId, competence })           -> { niveau, marques, monte: Boolean }
assaut({ force, type, description })        -> résolution §1.7, { marge, issue, degats, blesses }
rencontre({ region, type? })                -> tire une rencontre selon l'état réel
renseigner({ region, … })                   -> le MJ corrige ou ajoute un renseignement (radio, rumeur, PNJ)
bilan()                                     -> { production, consommation, net, autonomie, defense, discretion, visibilite, capacite,
                                                 joursDeStocks: { eau, nourriture }, alertes }
```
Hooks : `lakourSurvie.avance` (quand, faits publics), `lakourSurvie.etat` (état public), `lakourSurvie.pret` (api).
Socket `system.lakour-survie` : joueurs → MJ actif : `demande` (un joueur propose une action depuis le tableau de bord :
`{ type: "fouiller" | "explorer" | "construire" | "garde" | "repos" | "voyager", details }`, relayée au MJ et au MJ IA).

## 6. Le module de contenu `lakour-fenoir`

- `contenu/*.mjs` (sources) → `outils/fabriquer-fenoir.mjs` → `src/` (JSON) → `packs/` (LevelDB, `fvtt package pack`), comme
  les autres mondes ; `assets/donnees.json` : le registre (régions, sites, routes, installations, savoirs, factions,
  événements, passés, équipements) que le système charge.
- Enregistrement : au hook `setup`, le système appelle `Hooks.callAll("lakourSurvie.enregistrer", registre)` ; le module y
  répond `registre.ajouter(donnees)` (importées de `assets/donnees.json` par `fetch` au `init`, ou d'un `scripts/donnees.mjs`
  généré). Le système valide le registre (clés uniques, références existantes) et prévient le MJ des erreurs.
- Compendiums : `installations`, `savoirs`, `equipements`, `passes` (Item, système `lakour-survie`) ; `survivants`
  (prétirés et PNJ, Actor) ; `journaux` (guide du joueur, guide du MJ, régions de l'île, factions, chronologie de la crise,
  aide de jeu « premier jour ») ; `tables` (rencontres par zone et par phase, fouilles, rumeurs de la radio, complications,
  noms créoles) ; `scenes` (la **carte de La Réunion** avec les repères des régions ; quelques plans d'abris).
- `assets/monde/fond.jpg` (fond du monde), `assets/cartes/reunion.webp` (carte), `assets/jetons/` (jetons).
- Fêtes (socle du moteur `api.fetes`) : Noël et le jour de l'an en plein été austral, **le 20 décembre (fête de la liberté,
  abolition de l'esclavage)**, Dipavali, le Nouvel An chinois, la fête des letchis, Halloween ; une ligne de contexte pour
  le narrateur (ce que la fête devient dans le monde d'après), jamais de règle cachée.

## 7. MJ IA (sous-module `lakour-mj-ia`)

- `scripts/adaptateurs.js` : adaptateur `"lakour-survie"` (`typePnj: "survivant"`, `competences()` = les 10 compétences,
  `lancer(acteur, cle, reglages)` = `api.test` avec la difficulté convertie (`facile` → normale +1 dé ; `routiniere`/
  `exigeante` → normale ; `difficile` → difficile ; `ardue`/`tres-ardue` → extreme), `lancerDirect` idem sans fenêtre,
  `resumer(acteur)` = compétences, état, infection, savoirs ; `consignes` = le rôle du narrateur de Fénoir).
- `scripts/contenus.js`, `reinitialiser.js` : `"lakour-survie": "lakour-fenoir"`.
- `scripts/outils-survie.js` (outils `systemes: ["lakour-survie"]`) : `survie_etat` (état public + monde réel MJ, résumé
  court), `survie_avancer`, `survie_test` (ou demander_jet générique), `survie_explorer`, `survie_fouiller`, `survie_installer`,
  `survie_construire`, `survie_voyager`, `survie_demenager`, `survie_ajuster`, `survie_blessure` (blesser/soigner/infecter),
  `survie_assaut`, `survie_renseigner`, `survie_bilan`. Chaque outil appelle `game.lakourSurvie` et rend un texte court
  pour l'IA, qui sépare **[connu des joueurs]** et **[secret MJ]**.
- `scripts/contexte.js` : l'état du jeu donné à l'IA à chaque tour : jour, moment, date, phase, stocks et jours de stocks,
  production nette, alertes, membres (état), renseignements de la région courante et des voisines (connus), et en secret le
  réel de ces mêmes régions et les menaces qui approchent.
- Les compagnons IA : génériques (drapeau `flags.lakour-mj-ia.compagnon`), leur résumé vient de l'adaptateur.
- Fêtes : ligne de narrateur propre à Fénoir (`fetes-logique.js`).

## 8. Essais (node:test, `essais/`)

Logique pure (dés, temps, ressources, abri, installations, simulation du monde sur 200 jours avec une graine fixe :
invariants — rien de négatif, infestation dans [0, 5], hordes dans des régions voisines, réseaux tombés dans leur fenêtre,
décomposition des Bas après le jour 60, autonomie atteignable avec citerne + potager + solaire dans une région ensoleillée),
contenu (toutes les références résolues, chaque région atteignable depuis toutes les autres, chaque site a une région,
chaque installation a des niveaux cohérents), API sur une doublure de Foundry (comme `essais/doublures/foundry-loups.mjs` des
Veillées), MJ IA (adaptateur, outils, contexte : le secret ne fuit jamais dans ce que voient les joueurs), batteries de
mutations sur les règles clés. `node modules/lakour-mj-ia/outils/valider-foundry.mjs modules/lakour-fenoir lakour-survie <ref>`.

## 9. Ce que Fénoir reprend des trois autres mondes (ajout du 2026-11-04)

Jordan veut que Fénoir profite de tout ce qui a été fait ailleurs. Rien n'est recopié en double : on réutilise le moteur, et on
adapte ce qui vit dans un autre système ou module.

**Du moteur MJ IA (gratuit, à brancher et à vérifier)** : voix du narrateur et des compagnons, écoute des joueurs, compagnons
IA et **pilote automatique** (partie qui continue avec les seuls compagnons, utile en solo), mémoire de campagne, chronique,
**Carnet** (le registre des **contacts** pour les survivants rencontrés et les PNJ des factions, le tableau d'**enquête** pour
les mystères du Gris), **horloges** (réputation `rep-<faction>` auprès de chaque faction, comme à Warcraft ; fronts de menace),
`creer_scene` + placement + pièces (plans d'abris générés par l'IA), vue 3D, coffre, **fêtes**, `lancer_table` sans doublon avec
les données des résultats (`flags.lakour-fenoir.appel`), guide d'utilisation installé.

**De Warcraft (module lakour-warcraft)** :
- l'**établi** → l'**atelier de fabrication** du système (`logique/fabrication.mjs`, fenêtre `Atelier`) : recettes
  `{ cle, nom, cout: { materiaux, pieces, … }, travail (quarts), competence, difficulte, requiert: { savoirs, installation },
  produit: { equipement | ressource, n } }` (arc et flèches, arbalète, lance, pièges, filtre portatif, alambic, poêle de
  masse, chauffe-eau solaire, vélo-cargo, réchaud à bois, munitions rechargées, savon, compost accéléré…) ; contenu
  `recettes.mjs` ;
- les **contrats** → les **appels radio et demandes des factions** : tables de missions (escorte, récupération de
  médicaments, réparation d'une pompe, sauvetage, échange) avec récompense (ressources) et points de réputation de
  faction, tirées par le MJ IA (trois par semaine de jeu quand le groupe a une radio) ;
- les **réputations** → paliers d'attitude des factions (hostile, méfiante, neutre, amicale, alliée) suivis par horloges
  `rep-<faction>` que l'installateur du module crée, avec ce que chaque palier ouvre (troc, refuge, savoir enseigné) ;
- les **afflictions** → **maladies et blessures persistantes** (`logique/maladies.mjs`, objets `affliction` :
  `{ cle, categorie: "maladie" | "blessure" | "psychique", contagion, incubation, duree, effets (malus de dés, fatigue),
  soin: { competence, difficulte, medicaments }, aggravation }`) : dengue, chikungunya, leptospirose (eau des ravines),
  gastro-entérite (eau non traitée), plaie infectée, fracture, brûlure, piqûre de scolopendre, coup de chaleur, choc
  après une perte ; les conditions de vie de l'abri (eau traitée, moustiques, infirmerie) en changent le risque ;
- les **montures** → les **véhicules et montures** (`equipement` de type véhicule : charge, carburant par quart, bruit,
  terrains possibles : voiture, 4×4, scooter, vélo, vélo-cargo, kayak, barque à moteur, âne ou cheval de la Plaine des Cafres) ;
- aventures, one-shot, campagne → un **scénario d'ouverture** (le jour zéro, plusieurs points de départ), un **one-shot**
  (une soirée : une expédition), une **campagne en fronts** (menaces qui avancent avec l'horloge) ;
- cartes de lieux génériques et `plans.json` → **cartes de lieux** de Fénoir (case créole, collège, station-service,
  supermarché, gîte, tunnel de lave, îlet) au format du moteur, pour placer les jetons ;
- **jetons** game-icons (survivants par passé, Livides, factions, animaux, véhicules) et `figurants.json` ;
- le **bestiaire** → les **Livides** et les animaux : Livide frais, Livide des Hauts (ancien, conservé par le froid), noyé
  du lagon, brûlé, coureur (rare, les premiers jours), chiens errants, cochons marrons ; chacun avec son nombre de dés
  d'attaque et sa résistance (succès pour le mettre hors d'état).

**D'Imperium (module lakour-40k)** :
- la jauge **Exposition** et ses automatismes → les **paliers de visibilité** de l'abri : quand la visibilité franchit un
  palier à la hausse, le MJ (ou le MJ IA) reçoit en privé une carte avec une table d'événements de ce palier (rumeurs,
  éclaireurs, visite, assaut) ;
- « Entre deux mandats » → **la vie au camp** : journal visible des activités de temps calme (enseigner un savoir, réparer,
  cultiver, monter la garde, soigner, raconter, fêter) avec leur test et leur coût en quarts ;
- générateurs et tables narratives → générateurs de **survivant rencontré**, de **site fouillé** et de **rumeur**.

**Des Veillées (système lakour-loups)** :
- le **bandeau** → le **bandeau de survie** (en haut de l'écran, chez tous) : jour, moment, date, météo, phase, stocks en
  jours, alertes ; le **signal** (tintement chez un joueur à qui l'on demande quelque chose) ;
- l'**ambiance** → sons du moteur par moment et météo (nuit, pluie, cyclone, tension pendant un assaut) ;
- l'**immersion** → lumière de la scène qui suit le moment de la journée, pluie (effet météo de Foundry) en fortes pluies et
  cyclone, léger tremblement à un assaut ou une brèche ;
- les **chroniques** → « Chroniques de Fénoir » : journal lisible de tous, un chapitre par abri (où, combien de jours, ce qu'on
  y a bâti, qui est tombé) ;
- l'**infobulle** des jetons (état d'un survivant : blessures, fatigue, infection connue).

**Fêtes** (socle `api.fetes`, comme les trois autres) : Noël et le jour de l'an en plein été austral, le 20 décembre (fête de
la liberté), Dipavali, le Nouvel An chinois, Cavadee, Pâques, la fête des letchis, le 14 juillet, la fête de la musique, la
Toussaint et Halloween ; carte du jour, image de fête, ligne du narrateur (ce que la fête devient dans le monde d'après) et
un petit effet **public** : fêter la fête au camp redonne 1 de moral à chacun (une fois par fête, coût : une ration de plus
par personne).

## 10. Création des survivants « à la RimWorld », recrues et histoires (ajout du 2026-11-04)

Inspiration de *RimWorld* pour la MÉCANIQUE seulement (aucun texte, nom ou trait recopié) : des personnages tirés au sort
mais cohérents, dont les compétences, passions, traits et histoire pèsent sur les besoins du groupe ; des recrues qui
comblent les manques.

### 10.1 Ce qui fait un survivant (s'ajoute au §3.1)
```
system: {
  …,
  enfance: String,                       // clé d'une enfance (contenu enfances.mjs) : où et comment il a grandi
  passe: String,                         // clé du passé adulte (le métier du jour zéro, §3.4)
  passions: { competence: 0 | 1 | 2 },   // 0 aucune, 1 intérêt (marques x1,5), 2 passion (marques x2, +1 moral par jour où il a
                                         //   fait une tâche de sa passion, -1 s'il en est privé 7 jours)
  traits: [String],                      // clés de traits (contenu traits.mjs), 1 à 3, jamais deux incompatibles
  incapacites: [String],                 // tâches ou compétences qu'il refuse ou ne sait pas faire (« violence », « soins »,
                                         //   « travaux lourds »…), venues de l'enfance, du passé ou d'un trait
  statut: "joueur" | "compagnon" | "recrue" | "pnj",
  tache: String,                         // tâche du jour (§10.3)
  histoire: { journal: uuid | "" }       // son journal d'histoire (§10.5)
}
```
- **Enfance** (une vingtaine, réunionnaises et d'ailleurs : enfant des Hauts de Salazie, gamin du Port, fille de pêcheur de
  Saint-Pierre, enfance zoreil arrivée à dix ans, enfant de la cité à Saint-Denis, enfance à Mayotte ou à Madagascar…) et
  **passé** (le métier) donnent chacun des **modificateurs de compétences** (+1 ou +2, parfois -1), parfois un savoir, une
  incapacité, un équipement de départ et des phrases d'histoire. Un libellé genré porte `genre: "f" | "m"` (vide = neutre)
  et, s'il existe, `nomAutre`, le libellé pour l'autre genre (« Agricultrice des Hauts » / « Agriculteur des Hauts ») ; les
  prénoms du registre sont rangés par genre (`noms.prenomsF`, `prenomsM`, `prenomsMixtes`).
- **Traits** (une trentaine) : `{ cle, nom, description, effets: { competences: {cle: ±n}, moral, fatigue, peur, besoins,
  taches: { tache: ±n }, social, special }, incompatibles: [cle], poids }`. Exemples de mécaniques (noms originaux à
  écrire par le contenu) : main verte (+1 aux cultures), nerfs d'acier (ne craque pas à moral 0 une fois), incapable de
  violence, claustrophobe (malus dans les galeries et le tunnel de lave), lève-tôt, gros mangeur (1,5 ration), sobre (0,75),
  insomniaque, optimiste ou pessimiste (moral), robuste ou fragile (blessures), asthmatique (fatigue à l'effort, fumée),
  croyant (moral aux fêtes religieuses), solitaire (moral -1 au-delà de 6 personnes), têtu, généreux, chapardeur, ancien
  fumeur (manque), sang-froid (tir), maladroit (bricolage -1), débrouillard (fouille +1), protecteur.
- **Âge** (16 à 75) : les jeunes progressent plus vite (une marque de plus toutes les 3 sous 25 ans), les anciens partent
  avec plus de niveaux et moins d'endurance.

### 10.2 Générateur (`logique/generation.mjs`)
- `genererSurvivant(contenu, hasard, { age?, enfance?, passe?, traits?, region?, statut, verrous?, favoriser?: { competence: poids } })`
  -> données complètes d'un survivant (compétences = enfance + passé + traits, plafonnées à 5 ; 1 à 2 passions tirées en
  penchant vers les compétences fortes ; 1 à 3 traits compatibles ; incapacités ; équipement ; une **graine d'histoire** :
  les phrases de l'enfance et du passé, la région, l'âge, un proche perdu ou cherché au jour zéro). Le **genre** : l'enfance
  est tirée d'abord, puis un passé du même genre (ou neutre), puis un prénom de ce genre ; `genre` est rendu avec le
  survivant. Sous verrous contradictoires, le genre d'un nom gardé l'emporte (sinon celui du passé) et l'élément qui
  contredit s'affiche sous son `nomAutre` (`nomAccorde(def, genre)`, l'endroit unique : fiche, fenêtre de création, MJ IA).
- **Création d'un joueur** (fenêtre « Créer un survivant » du système, et outil `creer_survivant` du MJ IA) : tirer, puis
  **relancer** tout ou partie en **verrouillant** ce qu'on garde (nom, âge, enfance, passé, traits), ou choisir chaque
  élément. Un **budget** évite les super-héros : somme des niveaux entre 10 et 16 pour un humain de départ (réglage du MJ).
  Affichage : compétences avec flammes de passion, traits avec infobulles, incapacités en rouge, aperçu de l'histoire.
- `besoinsDuGroupe(membres, abri, contenu, etat)` -> pour chaque **tâche** (§10.3) : compétence requise, meilleur niveau du
  groupe, couverture (`couvert` / `faible` / `manquant`), urgence (blessés sans soigneur, chantier prévu sans bricoleur,
  potager sans jardinier, factions sans négociateur, pas de garde la nuit) et le **profil recherché**.
- **Recrues** : `genererRecrue(contenu, hasard, { besoins, region, phase })` tire un survivant en **favorisant** les
  compétences manquantes du groupe (par des poids, pour garder des surprises), avec une raison d'être là et un **prix** (ce
  qu'il demande, un défaut, une méfiance, un proche à sauver, un trait gênant). Rencontres humaines et appels radio peuvent
  proposer une recrue. `recruter({ recrue, parleurId })` : test de `parole` (difficulté selon l'attitude et les besoins),
  l'acteur `survivant` créé (statut `recrue`), ajouté au groupe. Une recrue part si son moral reste à 0 trois jours.
  `ajouterMembre({ acteurId, statut })` ajoute au groupe un survivant existant (compagnon IA arrivé en cours de partie).

### 10.3 Tâches du jour (les priorités de travail, simplifiées)
Chaque membre a une **tâche** par jour : `garde`, `cultures`, `elevage`, `chantier`, `atelier`, `cuisine`, `soins`, `eau`,
`peche`, `chasse`, `fouille`, `repos`, `enseigner` (une marque par jour à l'élève si le maître a 2 niveaux de plus). La
production des installations qui demandent des bras (`effets.bras: { tache, nombre }`) dépend de qui y travaille (x0,5 sans
personne, x1 au niveau requis, +10 % par niveau au-dessus, +10 % avec la passion). Une tâche tenue une semaine donne une
marque (x passion). Les joueurs choisissent la tâche de leur survivant ; le MJ (ou le MJ IA) celle des compagnons et des
recrues, ou la « répartition automatique » qui suit `besoinsDuGroupe`. `assigner({ acteurId, tache })` dans l'API ; le
tableau de bord montre la grille membres x tâches.

### 10.4 Contenu (`lakour-fenoir`)
`enfances.mjs` (~20), `traits.mjs` (~30), passés enrichis (modificateurs, incapacités, phrases d'histoire), noms et surnoms
créoles, raisons d'être là des recrues (table), prix des recrues (table), modèles de phrases d'histoire.

### 10.5 Histoire de chaque personnage (40k, Warcraft, Fénoir ; pas les Veillées)
Commun, dans le MOTEUR : chaque personnage joueur et chaque compagnon IA (et, au choix, une recrue ou un PNJ important) a un
**journal « Histoire de <nom> »** dans un dossier « Histoires des personnages », avec :
- **« Qui il est »** (lisible de tous) : origine, famille, ce qu'il faisait, son apparence, ses manières ;
- **« Son histoire »** (lisible de tous) : le passé raconté, ce qui l'a amené là ;
- **« Ce qu'il garde pour lui »** (son joueur et le MJ seulement, par la propriété de la page ; le guide dit honnêtement que
  Foundry livre les documents à tous les navigateurs : ce n'est pas un coffre) : un secret, une peur, ce qu'il cherche ;
- **« Chapitres »**, que le MJ IA complète au fil de la campagne (un paragraphe après chaque événement marquant).
Écrite par le MJ IA à la création du personnage (outil `histoire_personnage` : écrire, compléter, ajouter un chapitre), à
partir du contenu du monde (40k : origine, faction, rôle, monde natal ; Warcraft : peuple, historique, classe, faction ;
Fénoir : enfance, passé, traits, région, âge, proche perdu), en posant d'abord au joueur deux ou trois questions courtes
(ou en inventant s'il le demande). Pour un compagnon IA, écrite à sa création et **résumée dans sa personnalité** (le champ
`histoire` des compagnons) : il en parle, s'en souvient, agit selon elle. Le résumé d'un personnage donné au MJ IA en cite
une ligne. L'acteur garde l'uuid du journal (`flags.lakour-mj-ia.histoire`). Sans IA : le journal se crée avec ses quatre
pages vides et des questions pour aider le joueur.
