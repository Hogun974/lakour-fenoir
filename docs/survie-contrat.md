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
  `soins` **extrême** dans le quart (lavage, cautérisation, amputation selon l'endroit, décrite par le MJ), **difficile** si
  le soignant y met un médicament (consommé) ou si l'abri a une infirmerie en service (son bonus de soins compte) :
  `difficulteMorsure({ medicament, infirmerie })` (depuis le 2026-11-05 ; avant, extrême toujours) ; difficile aussi avec une
  **décoction de zerbaz** (`DECOCTION` : 1 plante de l'abri, consommée) ou une **trousse de secours / un sac d'intervention**
  que porte le soignant (équipement de catégorie `soin`, non consommé) : `difficulteMorsure({ medicament, infirmerie, trousse,
  decoction })` ; médicament et décoction donnent chacun +1 dé et se cumulent, outil et infirmerie au plus +2 ensemble :
  `bonusMorsure({ medicament, decoction, outil, infirmerie })` (2026-11-05, « Médicaments et zerbaz », docs/equilibre.md) ;
  jamais plus facile que difficile ; échec : infecté. Le stade monte de 1 tous les 2 quarts ; à 6, la personne meurt et se relève Livide au quart suivant si rien n'est
  fait. Aucun remède connu (le monde pourra en révéler plus tard : c'est au MJ). Les compagnons et PNJ suivent la même règle.
  **Seul le porteur du Gris se relève** (décision de Jordan du 2026-11-17, comme dans Fénoir 3D) : un mort qui porte le Gris
  (`infection.atteint`) se relève au quart suivant quelle que soit sa mort (le Gris, ses blessures, la soif…), sauf corps
  traité (`corpsTraites` d'`avancer`) ; un mort sans le Gris reste mort. Sur l'autel, un mort relevé est « à retrouver »
  avant le repos (`morts[].livide`, §11).
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
électrique : 1 = une caisse), `graines` (1 = de quoi semer une planche), `plantes` (plantes médicinales, les « zerbaz » :
1 = une brassée ; elles se cueillent et ne se pillent pas, plafond de base 12 ; depuis le 2026-11-05), `energie` (kWh
stockés, plafonnés par les batteries). `energie` et `plantes` n'ont pas de réserve dans les régions (`RESSOURCES_NON_PILLABLES`).
- **Consommation quotidienne** : par personne 1 eau (1,5 dans les Bas en saison chaude) et 1 nourriture.
- **Pertes** : sans réserve étanche ni séchoir/fumoir, 5 % de la nourriture (arrondi à l'entier supérieur s'il y en a) se
  gâte chaque jour (chaleur humide).
- **Production** : celle des installations (§3.2), chaque jour, selon leurs conditions (pluie, soleil, rivière, saison,
  délai de croissance, énergie disponible).
- **Autonomie** : un jour où eau, nourriture et énergie nettes (production − consommation − pertes) sont ≥ 0 sans aucune
  fouille compte comme **jour autonome** ; `joursAutonomes` (consécutifs) et `autonome` (≥ 7) sont publics. Le MJ le raconte.
- **Plafonds** : stockage de base de l'abri plus le `stockage` des installations ; au-delà, l'excédent est perdu. Ils
  s'appliquent dès l'installation (stocks trouvés sur le site, ou laissés dans un abri repris, plus ce que le groupe apporte :
  `installerAbri` rend `perdus`), puis à chaque journée de l'abri.

### 1.7 Bruit, visibilité, menaces
- **Bruit** de l'abri (0 à 10, retombe de 2 par quart) : coup de feu +2 (rafale +4), groupe électrogène +2 par quart
  allumé, moteur +1, chantier +1, cri / alarme +2. **Visibilité** (0 à 10, calculée) : lumières la nuit, fumée,
  cultures visibles, taille du groupe, installations voyantes, moins la discrétion du site et du camouflage.
- Chaque jour, la simulation tire les **menaces** pour l'abri : hordes de passage (selon l'infestation, les hordes proches et
  le bruit cumulé), visite d'une bande ou d'un groupe (selon les factions de la région et la visibilité), animaux, accidents.
- **Assaut contre l'abri** : réserve de **défense** (défense de l'abri + meilleur `vigilance` de la garde, avec son bonus
  comme pour un test à l'abri §1.1 : outil et installations, tour de guet ou chiens de garde dressés, au plus +2 ; sans garde
  présent, pas de bonus : `vigilanceDeGarde`, `bilanAbri(...).bonus`) contre la
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
  graine: String,                     // graine du hasard de la partie (32 caractères hexadécimaux : 128 bits, voir plus bas)
  graineEssai?: true,                 // graine courte donnée exprès (essais, simulateur) : gardée telle quelle
  incubations: { acteurId: [affliction en incubation] },   // maladies pas encore déclarées (§9) : jamais sur l'acteur
  notesAbris: { acteurId: String },   // notes secrètes du MJ sur un abri (jamais sur l'acteur abri, que les joueurs observent)
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
**Le hasard** (`logique/hasard.mjs`, révisé le 2026-11-05) : la graine d'une partie est tirée par `crypto.getRandomValues`
(`graineSure()` : 128 bits, 32 caractères hexadécimaux) ; chaque flux (`deriverHasard(graine, …cles)` : « jour|J », « radio|J »,
« maladies|J », « fouille|quart|n »…) part des 128 premiers bits de **SHA-256** (`graine|cles`, `logique/sha256.mjs`, synchrone,
éprouvé contre les vecteurs de la norme) puis d'un générateur **sfc32** à état de 128 bits. Les annonces publiques (radio,
coupures) ne permettent donc ni de retrouver la graine ni de rejouer la simulation. Avant : FNV-1a 32 bits puis mulberry32, soit
2³² mondes possibles, qu'un joueur pouvait tous essayer. La logique reste déterministe pour une graine donnée (essais,
simulateur). `api.demarrer` refuse une graine de moins de 32 caractères (`GraineCourte`), sauf `essai: true` ; une partie
plus ancienne dont la graine est courte continue, et reçoit une graine sûre à sa prochaine écriture (`graineRenforceeLe`) :
les jours déjà simulés restent, seuls les tirages à venir changent.

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
- **Glanage de passage** (2026-11-05) : toute fouille d'une région (pillage, ciblée ou non) ramasse aussi
  `ceil(0,055 × membres × quarts × prudence × (cueillette + pêche + gibier par jour))` (0,06 avant le rééquilibrage du 2026-11-13) de nourriture, pris dans la `nature`
  des alentours de l'abri (si c'est sa région) ou de la région (`fouiller` rend `glane`, compris dans `butin`). Ce qui est
  glané ne revient qu'à la régénération de la nature : une région où personne n'a glané depuis longtemps est pleine, celle
  qu'on vient de vider ne rend presque plus rien ; c'est ce qui se renouvelle pour qui bouge. En quittant un abri
  (`demenager`), la nature de la région garde la trace des alentours exploités (la plus basse des deux).
- **Trousses et hôpitaux** (2026-11-05) : une fouille de la région (pillage) a 1,5 % de chances par membre et par quart
  (× 2,5 en cherchant des médicaments, au plus 50 %) de trouver une trousse de secours oubliée : +1 médicament, hors des
  réserves de la région (`fouiller` rend `trousse`) ; jamais dans une région sans médicament au jour zéro. Fouiller un site de
  type `hopital` : médicaments × 3 (`REGLES_ACTIONS.fouille.sites`).
- **Plantes médicinales** (2026-11-05) : la fouille des alentours de cible `plantes` rend `ceil(0,5 × membres × quarts ×
  prudence)` plantes, prises sur la `cueillette` de la nature ; une cueillette ordinaire (cible `cueillette`) rapporte en plus
  `arrondiHasard(0,2 × membres × quarts)` plantes, sans entamer la nature ; × 2 si un des cueilleurs a le savoir
  `REGLES_ACTIONS.plantes.savoir` (`zerbaz` ; `fouiller({ …, savoirs })`). Ni l'une ni l'autre ne compte comme une fouille.
- **Réseaux** : tombent au jour tiré ; `carburant` ne revient jamais.
- **Factions** : grossissent, s'affaiblissent, se déplacent, occupent les abris abandonnés (§2.4). Une région vide (pillage
  sous 10 %) les affaiblit, mais jamais sous **0,5** dans leurs régions de départ (`factionsDepart` ; ou leur force de départ si
  elle était plus basse) : depuis le 2026-11-05, il reste des bandes et des visites la deuxième année (avant, toutes
  s'éteignaient entre J600 et J720).
- **Événements du contenu** (§2.6) : 35 % de chances par jour d'en tirer un (25 % jusqu'au 2026-11-05).
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
  vu: jour | null,                     // dernière nouvelle (observation, radio ou rumeur)
  vuDirect: jour | null,               // dernière observation directe (source « vu ») : seule elle lit pillage et routes
  source: "vu" | "radio" | "rumeur",
  infestation: "inconnue" | "calme" | "presente" | "dense" | "grouillante",   // bande lue au moment `vu`
  pillage: "inconnu" | "intact" | "entame" | "maigre" | "vide",
  electricite, eau: Boolean | null, routes: { voisine: etat }, factions: [faction], notes: String
} }
```
Mis à jour par `explorer`, `fouiller`, `voyager` (la région où l'on passe), la radio et le MJ. **Le MJ (et l'IA) voient le
réel et le connu ; les joueurs ne voient que le connu, daté.** Un déménagement se prépare sur des renseignements qui
vieillissent : c'est voulu. Une nouvelle par radio rajeunit `vu`, pas `vuDirect` : le pillage et les routes gardent l'âge
de la dernière visite (`ageDirect` ; un ancien renseignement sans `vuDirect` dont la source est « vu » est daté par `vu`).

### 2.5 Factions (contenu)
`{ cle, nom, description: HTML, attitude: "hostile" | "mefiante" | "neutre" | "amicale", regionsDepart, croissance,
ressources préférées, ce qu'elles veulent, comment traiter avec elles }`. Originales : par exemple un reliquat
militarisé autour du port, une coopérative de planteurs des Hauts, des récupérateurs du littoral, des pêcheurs du Sud, une
communauté religieuse, les familles des îlets de Mafate, des bandes de pillards. Noms et textes inventés.

### 2.6 Événements (contenu)
`{ cle, nom, type: "meteo" | "reseau" | "horde" | "humain" | "accident" | "decouverte" | "abri" | "fete",
phases: [phase], zones: [zone], saisons: ["pluies" | "seche"], poids, public: Boolean, texte: HTML, effets: { … } }` :
la simulation en tire les effets simples (route coupée, stock perdu, infestation +1…) ; le MJ raconte le reste.
Les événements météo nommés d'après un danger fin d'une région (`eboulement-cilaos`, radiers, houle, incendie de forêt…)
ne tombent que dans les régions dont c'est un danger.

Ajouts du 2026-11-05 (parties longues) : une réparation trop courte pour finir un point s'accumule (`reparation` de
l'abri) ; une petite production (moins d'une unité par jour : ruches, infirmerie) s'accumule (`reliquats`) ; les chiens
de garde et autres installations qui mangent consomment après les personnes et s'arrêtent s'il ne reste rien ; un abri
occupé par une faction redevient libre quand elle tombe sous 0,5 de force dans la région.

**Effets `abri` des événements** (tranché le 2026-11-05) : `effets.abri = { stocks: { ressource: ±n }, degats, moral,
blessure, decouverte: { ressource: n } }`.
- **Quel abri** : celui où vit le groupe. Un événement de type `abri` (fuite de citerne, rats, maladie du potager, dispute…)
  arrive à l'abri du groupe, dans sa région (s'il est dans les `zones` de l'événement) ; un groupe sans abri ne le tire pas.
  Un événement d'un autre type (sécheresse, gel, eau trouble, pillards, scolopendre, découvertes…) touche l'abri du groupe
  seulement s'il tombe dans la région de cet abri. Le fait de l'événement porte alors `effetsAbri`.
- **Effets simples, appliqués par la logique** (`avancer`, après la journée de l'abri ; `subirEvenementAbri`) : les stocks
  perdus (`stocks` négatifs ; jamais sous 0 : on perd ce qu'il y a) et les dégâts de l'abri (`degats`). Chacun donne un fait
  `{ cle, params, texte }` : `abri-evenement-pertes` `{ nom, pertes: { ressource: n } }` (ce qui a vraiment été perdu),
  `abri-evenement-degats` `{ nom, degats }` ; public (journal) si le groupe est à l'abri, sinon au journal secret.
- **Le reste, au MJ, à raconter, sans effet automatique** : `moral` (non nul), `blessure` (qui, comment), `decouverte` et une
  quantité positive de `stocks` (une trouvaille qu'il faut aller chercher) : faits secrets `abri-a-raconter-moral`
  `{ nom, moral }` (signé, « -1 »), `abri-a-raconter-blessure` `{ nom, n }`, `abri-a-raconter-decouverte` `{ nom, decouverte }`,
  au journal secret et dans `aRaconter` du résultat d'`avancer`. Le MJ (ou le MJ IA) les applique s'il le veut avec
  `ajuster`, `blesser`. Les autres champs (`bruit`…) sont ignorés.
- Le cyclone du contenu (`abri: { degats, moral }`) reste décrit pour le MJ : la simulation tire le cyclone elle-même et en
  applique les dégâts (protection cyclonique comprise).

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
      sol: Number (compost : fertilité regagnée par jour), renseignements: Boolean (radio),
      bonus: { competence: n }   // dés aux tests à l'abri (tour de guet : vigilance +1), au plus +2 avec l'outil ; compte aussi
                                 // dans un assaut (§1.7) ; le meilleur des installations qui ne sont pas hors service
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
maçonnerie, mécanique, premiers secours avancés, pêche au lagon, élevage, conserverie, étaiement et galeries, radio, zerbaz et
tisanes (`zerbaz` : la clé que lit la logique pour la cueillette des plantes ; 2026-11-05).
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
  action qui le change (actions toutes publiques : pas de rythme à cacher). En mémoire chez le MJ actif ; le réglage **client**
  `lakour-survie.monde` (localStorage du MJ, rangé par [monde][userId]) n'en garde une copie que tant qu'une écriture attend
  d'être scellée (clé ou API du moteur absente), effacée dès le scellement (révision du 2026-11-05 : avant, une copie en clair y
  restait toujours). Au rechargement, le monde se rouvre depuis le coffre. Sans le moteur (module coupé) : réglage monde
  `lakour-survie.mondeClair` et un avertissement permanent au MJ (« les joueurs peuvent lire l'état du monde »).
  Tant que le monde n'est pas ouvert chez le MJ actif, rien ne s'écrit (`ecritureBloquee`), comme aux Veillées.
- Ce que Foundry v14 livre à **tous** les navigateurs : réglages du monde, acteurs, objets, journaux, messages (le serveur ne trie
  pas les documents selon les droits). Rien de secret n'y va donc : maladies en **incubation** (`monde.incubations`, l'acteur ne
  porte que les afflictions déclarées), **notes du MJ sur un abri** (`monde.notesAbris`, `api.noterAbri` ; les notes de la
  fiche d'abri sont lues par les joueurs ; d'anciennes notes y sont mises au secret par `api.migrerNotesAbris`, au `ready`).
  L'instantané public du **bilan** (`etat.bilan`) et la **météo** (`etat.meteo`) ne lisent que ce que le groupe sait : loin de
  l'abri, les réseaux de sa région sont ceux du dernier renseignement ; en route, pas le temps de la région d'arrivée.
- **Intégrité** (Foundry v14 vérifie côté serveur les `documentTypes` du system.json) : `gmOnlyFields` réserve au MJ tous les
  champs des acteurs et des objets du système, sauf `notes` du survivant (son propriétaire écrit aussi son nom, son portrait,
  son jeton) ; `htmlFields` fait nettoyer le HTML par le serveur ; les fiches le nettoient aussi avant affichage
  (`foundry.utils.cleanHTML`). Côté client, `preUpdateActor` / `preCreateItem` / `preUpdateItem` refusent poliment, et le MJ
  actif retire un objet qu'un joueur aurait créé sur un survivant ou un abri (`scripts/garde.mjs`).
- **Requêtes des joueurs** (socket, `scripts/demandes.mjs`) : l'émetteur donné par le serveur fait foi, un message sans émetteur est
  ignoré ; seuls les messages de chat écrits par un MJ (`message.author.isGM`, auteur fixé par le serveur) comptent pour
  `forcer` et pour les demandes de test. Le test d'un joueur est « normale » et ne compte pas (aucune marque, jamais forcé
  d'emblée), sauf s'il répond à une **demande ouverte** d'un MJ (carte `demanderTest`, ou carte de jet du MJ IA
  `data-lakour-jet`, réglages convertis comme au §7) : elle fixe difficulté et dés, fait compter le test, une fois. Une création
  est validée chez le MJ (enfance et passé connus, passé permis à cet âge, passions comme le générateur les donne, toutes les
  incapacités imposées) ; trois propositions par minute au plus par joueur.
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
demarrer({ dateDepart?, graine?, essai?, region, membres: [acteurId], pnj? })
                                            -> nouvelle partie : tire les coupures, initialise le monde, place le groupe
                                               (graine vide : graine sûre ; sinon 32 caractères au moins, ou essai: true)
avancer({ quarts, raison })                 -> { quand, faits: [publics], alertes, bilan } ; journal
test({ acteurId, competence, difficulte, bonus, malus, forcer, titre, compte: Boolean })
                                            -> { …resoudreTest, texte } ; message au chat avec les dés ; marque si `compte`
forcer({ messageId })                       -> force un test déjà lancé (bouton de la carte de chat ; carte écrite par un MJ)
demanderTest({ acteurId, competence, difficulte, titre })  -> carte « Demande de test » ouverte jusqu'au test du joueur (§4)
noterAbri({ abriId, notes }) / notesAbri(abriId)            -> notes secrètes du MJ sur un abri (monde scellé)
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
  `recettes.mjs` ; la recette `tisanes` (2 plantes → 1 médicament, survie normale, sans savoir requis) est celle que le
  simulateur prépare (2026-11-05) ;
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
  compétences manquantes du groupe (par des poids, pour garder des surprises), puis, pour chaque compétence manquante qu'il
  n'a pas (et qu'aucune incapacité ne lui interdit), lui donne une chance sur deux de l'avoir au **niveau 2** (`RECRUE_MANQUE`,
  2026-11-05 : une recrue venue pendant un manque le comble 56 à 97 % du temps selon la compétence, au lieu de 24 à 37 % pour
  la discrétion, la vigilance, le bricolage et les soins), avec une raison d'être là et un **prix** (ce
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

## 11. Le temps de l'île et la mort (lot « fetes », ajout du 2026-11-13)

Familles 1 et 6 du remue-méninges de Fénoir 3D. Chiffres et raisons : `docs/equilibre-fetes.md`. Rien de magique : tout agit par le
moral, le bruit, la lumière, les stocks, l'hygiène, le sang-froid et les liens.

- **Logique** (`systems/lakour-survie/logique/`) : `lune.mjs` (lune, clarté de la nuit 0 à 3, ciel couvert, effets de la nuit dehors,
  chaleur, signes du paysage, date lue), `souvenirs.mjs` (souvenirs de fête, de vœu et d'autel ; deuil ; `espritDuJour` : le plafond du
  moral), `fetes.mjs` (effet d'une fête : `effetDeFete`, coût, liens, `participer`), `releve.mjs` (relève, jeunes de 16 à 18 ans, morts,
  repos, autel). `feter` (etat.mjs) applique l'effet d'une fête du contenu ; sans effet, celui d'avant (+1 moral, une ration).
  `avancer` : les morts du temps qui passe s'inscrivent (`etat.morts`) avec un choc de −1 moral, le deuil et les souvenirs jouent sur
  le plafond du moral (`effetJour({ esprit })`), la lueur s'ajoute à la visibilité (`bilanAbri` : `conditions.lueur`), l'hygiène
  divise le risque des maladies (`conditionsVie.hygiene`). `fouiller`, `tirerRencontre`, `voyager` prennent une `clarte` facultative
  (sans elle, le tirage d'avant) ; `voyager` des `porteurs` ; `travailleursParTache` le jour (l'âge des jeunes).
- **Contenu** : chaque fête du registre porte `effet` (forme de `logique/fetes.mjs`), `gain` et `cout` (textes), `communautes` ;
  quatre fêtes s'ajoutent (`ramadan`, `aid-el-kebir`, `nouvel-an-tamoul`, `marche-sur-le-feu`, sans image pour l'instant :
  `image: ""`) ; installation `autel-des-morts` (`effets.autel`) ; journaux « Les fêtes de Fénoir » (gain et coût, la fête des
  autres), « Le temps de l'île » (joueurs), pages « La mort, la relève et l'autel » (guide du joueur) et « Le temps de l'île, les
  fêtes et les morts » (guide du MJ).
- **Survivant** : `ageJour` (jour de jeu où l'âge a été noté ; 0 par défaut).
- **État public** (`lakour-survie.partie`, tous champs facultatifs) : `morts: [{ id, nom, quart, region, retrouve, repos, livide }]`,
  `souvenirs`, `liens: { factions, communautes, renom }`, `participations`, `releves`, `autel: { honoreLe }`, `ciel: { jour, region,
  soir, nuit }` (couvert), `calendrier: { exacte }` (le groupe sait-il la date ?).
- **API** : `quand()` rend en plus `lune`, `clarte`, `couvert`, `chaleur`, `signes`, `dateExacte`, `dateLue` ; `test({ dehors })` ;
  `feter({ fete, option, pour, avec })` ; `participer({ fete, communaute, faction, membres })` (crochet `lakourSurvie.participation`) ;
  `voeu({ acteurId, issue })` ; `candidatsReleve({ mortId })` ; `releve({ mortId, candidat, userId, action })` ; `morts()` ;
  `autel({ action, mort, nom })` ; `recruter({ …, faction })` ; `assaut({ …, horde })` (sang-froid).
- **Moteur** (`lakour-mj-ia`, branche du lot) : fêtes « sur demande » au socle (seul un monde qui les décline les voit) ; outils
  `survie_feter` (choix, vœux, cadeau, abri voisin ; vœu tenu ou rompu), `survie_participer`, `survie_releve` (avec `confier`),
  `survie_autel` ; l'état du jeu dit la lune, la date lue, l'autel, les souvenirs et les liens.
## 12. Le marché et le Ladi Lafé (ajout du 2026-11-13, lot « marche »)

Repris du jeu 3D (complément, famille 8 : le marché et les préjugés au marché ; famille 1 : les foires devenues marchés de troc
saisonniers sous trêve, les oratoires rouges ; famille 3 : le Ladi Lafé, les objets marqués). Chiffres et raisons :
`docs/equilibre-marche.md` ; écriture des préjugés : `docs/metissage.md`.

### 12.1 Règles (logique pure, `logique/marche.mjs`)
- **Quatre stades** : troc de la main à la main (toujours), boutique et carnet de crédit (un commerçant PNJ), marché forain (deux
  communautés au moins dans la région, une route ouverte : jour fixe, terrain à personne, conseil avec une voix par bastion,
  cours affiché, litiges, trêve), foire (trois jours, une fois l'an, autour d'une récolte). `stadesDuMarche(…)`.
- **Troc seulement** : le cours (`coursDuJour({ phase, saison, recolte, ajustements })`) donne la valeur de chaque bien en
  **parts** (une part = un jour de nourriture) ; l'énergie ne se troque pas. `valeurBiens`, `evaluerTroc({ donne, recoit, cours,
  majoration })`, `appliquerTroc(stocks, { donne, recoit })`.
- **Préjugés** : un trait d'un PNJ, `{ cible, poids 1..3, dit, echanges, fetes, dementis }`, jamais une propriété d'une
  communauté ; **aucune origine ne donne de bonus ni de malus** ; le système ne connaît l'origine de personne : le MJ dit quels
  préjugés s'éveillent (`cibles`). `premiereConfiance({ prejuges, cibles, rumeurs, palier })` -> `{ poids, majoration, credit,
  parole }` ; `userPrejuges(prejuges, { cibles, echanges, fete, dementi })` (un cran par 3 échanges honnêtes, par fête partagée,
  par démenti).
- **Carnet** : `carnetVide`, `prendreACredit`, `rendreAuCarnet`, `effacerDettes`, `dettesQuiTrainent`, `plafondCredit`,
  `solderAuNouvelAn` (les dettes se soldent au Nouvel An chinois).
- **Marché forain** : `creerMarche`, `estJourDeMarche`, `rompreTreve` (rumeur vraie sur toute l'île, réputation − 3 par bastion du
  conseil), `retablirTreve`, `trancherLitige`, `tenirJourDeMarche` (l'abri qui accueille : bruit, réputation), `signatureDuMarche`
  (visibilité + 2 : `bilanAbri(…, { signature })`).
- **Ladi Lafé** : `lancerRumeur(public, secret, …)` -> la rumeur publique (sujet, texte, portée, jour) et sa vérité au secret
  (`{ vraie, auteur, malveillant }`) ; `rumeursContre` (ce qui pèse sur la première confiance) ; `dementirRumeur` (une preuve ; une
  rumeur vraie ne se dément pas ; un mensonge malveillant démenti fait courir une rumeur vraie sur son auteur). Le résultat
  désigne le **colporteur** (lien avec une jauge de sens moral à venir).
- **Objets marqués** : `reclamerObjet({ marque, signeReclamant, signePossesseur, temoins })` (la marque, puis les témoins, puis
  parole contre parole).
- **Chaque jour** : `journeeDuMarche({ marche, secret, jour, dateDepart, fetes })` (jours de marché, foires finies, Nouvel An chinois,
  dettes qui traînent, rumeurs éteintes). `evenementsDeMarche(contenu, { stade, saison, phase })` : les événements de type
  `marche`, que **la simulation du monde ne tire jamais** (`monde.mjs`).

### 12.2 Données
- État public : `etat.marche = { boutiques: [carnet], marches: [marché], rumeurs: [rumeur publique], signe, prochain }` (absent
  d'une partie plus ancienne : `marcheDe(etat)` rend un marché vide). Secret : `monde.marche = { rumeurs: { id: { vraie, auteur,
  malveillant } } }`.
- Acteur `survivant` : `system.prejuges` (liste, vide par défaut). Objet `equipement` : `system.marque` (le signe d'une
  communauté, vide par défaut). Tous deux réservés au MJ (`gmOnlyFields`).
- Contenu (`contenu/marche.mjs`) : `communautes` (les cibles possibles d'un préjugé), `marchands` (les gens du marché, de toutes
  les communautés, avec leurs préjugés et l'événement qui les dément), `marches` (marchés forains possibles), `foires` (mois,
  région, récolte) ; événements de type `marche` (`stades`, `effets.dementi`, `effets.cours`…) ; paliers de réputation avec leur
  effet au troc (`reputations.paliers[].marche`).

### 12.3 API (`scripts/api-marche.mjs`, étalée dans `game.lakourSurvie`)
Lecture : `marche()`, `coursDuJour({ recolte, ajustements, marche })`, `stadesDuMarche({ region })`, `confiance({ pnjId, cibles,
faction })`, `evaluerTroc({ donne, recoit, pnjId, cibles, faction, marche })`, `trancherLitige({ voix })`,
`evenementDeMarche({ stade })`.
Écriture (MJ actif, monde ouvert) : `troquer({ donne, recoit, pnjId, cibles, faction, marche, accepter })`, `ouvrirBoutique({ nom,
tenancier, region })`, `crediter({ boutique, biens, pnjId, cibles, faction })`, `rendre({ boutique, biens, cibles })`,
`effacerDette({ boutique, debiteur })`, `solderCarnet({ boutique, remises })`, `ouvrirMarche({ modele | foire | nom, jourSemaine,
bastions, hote })`, `fermerMarche`, `accueillir({ marche, hote })`, `rompreTreve({ marche, par })`, `retablirTreve`,
`rumeur({ sujet, texte, vraie, malveillant, auteur, portee, contre })`, `dementir({ id, preuve })`, `dementirPrejuge({ cible, pnj })`,
`prejuges({ acteurId, prejuges })`, `creerMarchand({ cle })`, `signe({ signe })`, `marquerObjet({ acteurId, objetId, signe })`,
`reclamer({ acteurId, objetId, reclamant, signeReclamant, temoins })` ; `feter({ fete, invites })` use les préjugés des PNJ
invités. Chaque jour d'`avancer` : la journée du marché ; la réputation gagnée ou perdue s'écrit dans les horloges
`rep-<faction>` du moteur (`api.horloges.avancer`) quand il les tient. Fenêtres : onglet **Marché** de la fenêtre du MJ (avec la
vérité des rumeurs) et du tableau de bord (le cours, le carnet du groupe, les marchés, ce qui se dit ; jamais la vérité).
## 13. Les deux savoirs et l'île en mouvement (lot « savoirs », 2026-11-13)

Chiffres et raisons : `docs/equilibre-savoirs.md`. Logique : `logique/savoirs.mjs` (nouveau), `abri.mjs`, `actions.mjs`,
`monde.mjs`, `etat.mjs`, `maladies.mjs`. Rien n'est retiré ni renommé ; les champs nouveaux ont une valeur par défaut.

### 13.1 Ressources (§1.6)
- `gaz` (1 = un kilo ; une bouteille en fait 13), pillable : réserves des régions (contenu `ressources.gaz`), stocks des sites,
  plafond de base 26. Une partie d'avant le gaz le reçoit à la part qui reste des autres réserves (`completerPillage`, appelé
  par `simulerJour`).
- `boutures` (plafond 30) et `biocarburant` (carburant maison, 1 = 10 L, plafond 10) : non pillables. Les boutures sont
  repiquées chaque soir dans un potager, jardin créole, serre ou verger en service (elles deviennent des graines), sinon un tiers
  meurt (`repiquerBoutures`, appelé par `journeeAbri`, qui rend `boutures: { repiquees, mortes }`).

### 13.2 Installations (§3.2)
- Champs nouveaux de la définition : `arbre` (`"moderne"` | `"lontan"`), `role` (défaut : sa clé), `rang` (défaut : 0, 1 pour une
  lontan). **Sœurs** : les installations d'un même rôle ne s'additionnent pas ; la première par rang qui peut marcher est en
  service, les autres en secours (`bilan.secours: [{ cle, role }]`, ni production, ni consommation, ni effet structurel ;
  stockage et capacité gardés). Une sœur arrêtée au délestage (carburant, gaz, énergie, eau, nourriture) laisse la place à la
  suivante et garde sa raison dans `bilan.arrets`.
- `effets.consommation.gaz` : servi après le carburant, par ordre de priorité ; `bilan.consommation.gaz`, `bilan.net.gaz` (absents
  quand nuls).
- Coût `ile` (matières de l'île) : pris sur `abri.nature.bois` (`peutConstruire` lit `abri.nature`, `ouvrirChantier` rend
  `nature`) ; une lontan se répare avec (`reparerInstallation(…, { ile })` → `cout.ile`). `boisDisponible`, `prendreIle`.
- Bilan : `conditions.chien` (moral +1 sauf chiens de garde en service, vigilance +1 en bonus), `conditions.confort` (somme des
  `effets.moral` des objets des présents, au plus +1 au moral), `abri.vegetation: { n, depuis }` (visibilité + n − 1 par
  15 jours), `abri.lumiereLe` (visibilité +1 ce jour-là).
- Alentours au-dessus du plafond (`regenererNature`) : plus de repousse, le surplus se perd chaque jour (`POURRISSEMENT`).

### 13.3 Cyclone (§2.3)
- `passageCyclone(abri, installations, contenu, { force, protection, prepare, jour, depots }, hasard)` (remplace l'appel de
  `subirCyclone` dans `avancer`, qui reste) : préparation (+1 de protection, rien d'emporté) ou pertes (matériaux, plantes,
  boutures), eau des fuites et `abri.eauDouteuse` (3 jours : `facteurRisque(…, { eauDouteuse })` × 2 sans eau traitée), bois et
  fruits tombés au-dessus du plafond, `abri.vegetation`, un dépôt tiré dans le registre `depotsCyclone` (stocks posés ; menace
  rendue dans les menaces du jour, clé `menace-depot` ; moral rendu au MJ). `abri.preparation: { jour, fait, requis }`
  (`travailPreparation`, `preparationValable` : 5 jours) est consommée au passage.
- Simulation : le jour rouge, bois tombé dans la région et pistes et sentiers coupés par des arbres (événement
  `arbres-tombes`, dans `EVENEMENTS_SIMULES` et `EVENEMENTS_SYSTEME`) ; `sousLeVacarme(monde, region, jour)` : le bruit ne compte
  ni pour les menaces ni pour les hordes. `deroulementCyclone(cyclone, region, hasard)` : quatre quarts (rafales, accalmie, œil,
  retour) et leurs malus dehors (`DEHORS_CYCLONE`).
- Éruption : tirée la veille (`debut` = jour + 1), fait secret `eruption-premices` `{ regions }`.
- `avancer(…, { options: { chien, confort } })` : un chien à l'abri donne l'alerte `chien-agite-cyclone` à la pré-alerte d'un
  cyclone dont la trajectoire passe sur l'abri, `chien-agite-volcan` aux prémices d'une éruption dans sa région ou une voisine.
  Journal : `cyclone-prepare`, `cyclone-emportes`, `cyclone-citerne`, `cyclone-arbres`, `cyclone-depot`, `boutures-mortes`,
  `savoir-perdu` (une gramoune meurt sans cahier).

### 13.4 Savoirs, gramoune, chien (`savoirs.mjs`)
- `ARBRES`, `arbreDe`, `savoirsParArbre`, `autonomieComplete({ autonome, savoirs, contenu })` (2 savoirs de chaque arbre).
- `estGramoune(system, contenu)` (60 ans et plus, un savoir lontan), `dureeApprentissage`, `veilleeApprentissage(eleve, { savoir,
  source: "livre" | "cahier" | "maitre", maitre, livre: { enseigne }, contenu, energie })` → `{ ok, motifs, system, fait, requis,
  termine, lumiere }` ; `gagnerConfiance(confiance, test)` ; `veilleeDictee(gramoune, { contenu })` ; `veilleeChien(chien,
  test)`.
- Survivant (§3.1) : `confiance` (0..5, défaut 0), `apprentissage` (`{ savoir, source, fait, requis }` | null), `dictee`
  (`{ fait, requis, cahier }` | null). Abri : `vegetation`, `eauDouteuse`, `preparation`, `lumiereLe`. Installation : `arbre`,
  `role`, `rang`. Savoir : `arbre`. Équipement : `enseigne` (savoirs qu'un livre ou un cahier apprend), `auteur`. Catégorie
  d'équipement nouvelle : `animal` (le chien du groupe).

### 13.5 Fouilles et routes (`actions.mjs`)
- Cibles de fouille `jardins` (les jardins des cases de la région, `jardinsDisponibles`, `monde.regions[r].jardinsPris`) et
  `livres` (`chanceLivre`, `tirerSavoirDeLivre`, `monde.regions[r].livresTrouves`) : `fouiller` rend `livre` (clé d'un savoir ou
  null) et un fait `livre-trouve`.
- Rencontres : `tirerRencontre(…, { facteur })` ; sur la route dès l'effondrement, meutes (animaux × 2, 3 à 7).
- Véhicules (registre, `normaliserEquipement`) : `source`, `lenteur`, `pente: { descente, montee }`, `large` ;
  `dureeEtape(v, transport, etat, denivele)` ; `voyager(…, { reserves })` vérifie la `source` du véhicule (refus
  `voyage-source`) et rend `source`, `verrous` (`tirerVerrous`) et `siphonne` ; le temps des verrous est compris dans `quarts`.

### 13.6 API (§5) et fenêtres
- Nouvelles fonctions : `preparerCyclone({ membres, quarts })`, `apprendre({ acteurId, savoir, source, maitreId })`,
  `gagnerConfiance({ acteurId, parleurId })`, `dicter({ gramouneId, scribeId })`, `apprivoiser({ acteurId })` (chacune une
  veillée ou un temps de travail, qui fait passer le temps), `cyclone()` (le déroulé du jour au MJ actif, monde ouvert),
  `savoirsDuGroupe()`. `genererRecrue({ region, gramoune })` présente une gramoune du registre (`gramounes`) comme recrue ;
  `fouiller` accepte `jardins` et `livres` (le livre va au premier fouilleur) ; `voyager` prend l'énergie, le biocarburant ou
  le bois sec selon le véhicule, et met le carburant siphonné dans ce que le groupe porte ; `construire` et `reparer` prennent
  les matières de l'île aux alentours. `bilan()` : `secours`, `savoirs` (`autonomieComplete`), aussi dans l'instantané public.
- Fenêtre du MJ : onglet « Savoirs et cyclone » (déroulé du cyclone, préparer, veillées, confiance, dictée, chien) ; gramoune
  dans le formulaire des recrues ; cibles « jardins » et « livres ». Fiche d'abri : sœurs en secours, installations lontan,
  savoir-faire du groupe et autonomie complète. État public : `groupe.chienErrant` (`{ confiance, region }` | null).
- Registre du contenu : `depotsCyclone`, `gramounes`.
## 14. L'esprit sur le corps, le sens moral et l'autorité (ajout du 2026-11-13, lot « moral »)

Tiré du complément du jeu 3D (familles 2 et 3), validé par Jordan. Logique : `logique/esprit.mjs`, `moralite.mjs`, `porte.mjs`,
`chefs.mjs` ; chiffres et raisons : `docs/equilibre-moral.md`. **Rien n'est magique** : la foi agit par le moral, le jeu ne confirme
ni ne dément rien ; les croyances et les préjugés sont ceux des personnages ; aucune religion ni aucune origine ne donne de bonus
ni de malus propre.

### 14.1 Champs d'un survivant (s'ajoutent au §3.1 et au §10.1 ; tous réservés au MJ, `gmOnlyFields`)
```
system: {
  …,
  regard: "epreuve" | "refaire" | "vivre" | "",   // vide : esprit pas encore tiré (fiche d'avant) : AUCUN effet de ce §14
  religion: cle | "aucune" | "plusieurs" | "",     // une religion du contenu (registre `religions`)
  religions: [cle],                                // « plusieurs » : deux ou trois religions
  pratique: Boolean,                               // pratiquant (religion ou ancrage)
  ancrage: cle | "",                               // ce qui fait tenir un non-croyant (registre `ancrages`)
  sensMoral: −10..10 (0),                          // du rouge (exclure, trahir) au bleu (accueillir, aider)
  reputation: −10..10 (0),                         // ce que les témoins en ont vu ; ce que les autres connaissent
  autorite: 0..5 (2),                              // à quel point il est obéi quand il mène
  esprit: { joursSansObservance, enFaute, reconfortLe, joursBas, lacher 0..3, chance 0..3, joursSansNourriture, nourriSuite,
            nourri: { epreuve, refaire, vivre }, ancragePerdu, revolte, projet, joursNourris, joursFaim }   // compteurs (espritDe)
}
```
Le générateur les tire (`genererSurvivant` : `tirerEsprit` sur un flux de hasard à part, `options.hasardEsprit`) ; la création
garde la religion, la pratique, l'ancrage et le regard choisis (verrou « esprit » ; `generer({ verrous: { regard, religion,
religions, pratique, ancrage } })`) ; un tirage venu d'un joueur est refusé si sa jauge dépasse ±6, son autorité 4, ou si sa
réputation n'est pas nulle (`tirageDuGenerateur`).

### 14.2 Contenu (registre)
- `religions` : `{ cle, nom, description, observance: { besoin: "calme" | "objet" | "rien", texte }, fetes: [clé de fête],
  poids, affinites: { enfance: facteur }, special?: "aucune" | "plusieurs" }` ; « aucune » et « plusieurs » sont deux entrées
  spéciales. `ancrages` : `{ cle, nom, description, besoin, texte, poids }`.
- `traits[].effets` peut porter `sensMoral`, `autorite`, `regard: { regard: poids }`, `croyant`, `pratique` (au tirage seulement).
- `factions[].sensMoralChef` : le sens moral de qui mène la bande devant l'abri.

### 14.3 Ce que fait le temps (`avancer`, à chaque jour ; seulement pour un esprit tiré)
Plafond du moral + `plafondEsprit` (pratiquant +1, en faute −1 ; regard éteint −1 ; entente ±1) ; journée de l'esprit
(`journeeEsprit` : observances, réconfort, regard nourri, celui qui lâche) ; faux bruits la nuit à l'abri (`fauxBruit`, +1 fatigue) ;
le chef (`etat.groupe.chef`) gagne ou perd de l'autorité (`autoriteDuJour`) et, trop bas, ses crises (`crisesAutorite`) ; le
malaise des bleus dans un groupe rouge ; la porte (`journeePorte`) ; l'alerte d'un tribut dû. Faits nouveaux (clés
`esprit-*`, `porte-*`, `autorite-*`, `desertion`, `crise-*`, `malaise-couleur`, `tribut-du`, `chef-*`) dans `CLES_TEXTES`.
Un départ (« un matin, il n'est plus là ») ou une désertion retirent le membre comme une recrue à bout ; « au bord » (un
joueur), une scission ou un renversement vont au MJ (journal secret, `aRaconter`, avis à l'écran).

### 14.4 État public et monde secret
- Public (`lakour-survie.partie`) : `groupe.chef`, `groupe.entente` (−3..3), `groupe.accueilLe`, `groupe.feteLe` ;
  `porte: [{ id, jour, nom, age, genre, profil, bouches, demande: message, apporte, revient }]` (ce que le groupe voit) ;
  `votes: [{ id, quart, question, acte, voix, resultat, decide }]` (10) ; `tributs: [{ id, bande, faction, demande, tousLes,
  prochain, payes, etat: "actif" | "allie" | "rompu" }]` ; `communautes: [{ id, nom, membres, statuts, stocks?, plans, region,
  abri, depuis, entente }]` (les groupes séparés).
- Secret (monde scellé) : `porte: { id: { survivant, profil, bouches } }` (la vraie couleur du visiteur), `porteSuites` (feu,
  retour), `trahis`, `bandes: { tributId: { sensMoral, force } }`, la décision du chef de chaque menace « bande » ou « visite »
  (`menaces[].chef`).

### 14.5 API (`game.lakourSurvie`, écritures au MJ actif, monde ouvert)
```
communaute()                                   -> { chef, entente, reputation, couleur (MJ), porte, tributs, votes, communautes, liste }
acteMoral({ acteurId | acteurs, acte | delta, circonstances, temoins = true, voteId, journal })
                                               -> le POINT D'ENTRÉE du sens moral (la rumeur : acte « colporter » ; logique :
                                                  deplacerSensMoral, deplacerReputation, acteMoral, acteCollectif)
ajusterEsprit({ acteurId, regard, religion, religions, pratique, ancrage, sensMoral, reputation, autorite, chance, ancragePerdu })
tirerEsprit({ acteurId, forcer })              -> tire l'esprit d'une fiche qui n'en a pas
entente({ delta, raison }) / chef({ acteurId }) / parole({ tenue, raison })
voter({ question, acte, voix, circonstances }) -> les voix données, les autres d'après leur jauge (voixAuto)
decider({ voteId, decision })                  -> le chef suit le vote ou non (autorité)
porte({ visiteurId, decision: "accueillir" | "refuser" | "trahir", voteId, circonstances })
frapper({ profil })                            -> quelqu'un frappe, tout de suite
tribut({ tributId, paye })                     -> payé, augmenté, alliance, ou révolte (menace)
resoudreMenace({ id, action: "assaut" | "ecarter" | "ultimatum" | "rejoindre" })
separer({ partants, abriVaAux, nom }) / fusionner({ communauteId }) / lireSigne()
```
Un test qui compte consomme un point de chance (un dé de plus, carte « Un coup de chance ») ; celui qui lâche perd un dé en
parole ; en assaut, l'autorité du chef présent donne ±1 dé de défense. Réglage monde `visibiliteSensMoral` : « soi » (défaut :
chacun voit sa couleur, les autres la réputation), « tous », « mj ».

### 14.6 Fenêtres
Fiche de survivant : section « L'esprit » (regard, religion ou ancrage, pratique, en faute, sens moral selon le réglage,
réputation, autorité, signes, et pour le MJ chance et projet d'un enfant ; tout se règle à la main ; bouton « Tirer l'esprit »).
Création : regard, religion (plusieurs), ancrage, pratique, et la couleur et l'autorité tirées. Fiche d'abri : la liste à la
porte et ceux qui attendent. Fenêtre du MJ : onglet « Communauté » (chef, parole, entente, couleur réelle et réputation du groupe,
membres, porte et vraie couleur des visiteurs, votes, acte, signe, tributs, séparation et fusion) ; onglet « Menaces » : la
décision du chef de bande, avec « Accepter l'ultimatum » et « À la porte ».

## 15. Jointures entre les quatre lots (fusion du 2026-11-13)

Les quatre lots (§11 à §14) ont été écrits côte à côte ; leur fusion les branche là où chacun avait laissé un point d'accroche.
Aucun chiffre nouveau : chaque jointure applique une règle qui existait déjà dans l'un des lots.

- **Le marché pousse vers le rouge** (§12 -> §14, `scripts/api-marche.mjs`, par `porterActe` de l'API) : la rumeur
  (`rumeur({ auteur })`) fait porter l'acte « colporter » à son colporteur ; un mensonge démenti (`dementir`) fait porter « mentir »
  à son auteur ; un objet que le groupe disait sien, démenti par une marque ou des témoins (`reclamer`, `menteur: "possesseur"`),
  fait porter « mentir » à qui le porte ; rompre la trêve (`rompreTreve({ par })`) fait porter « attaquer » (frapper dans le
  périmètre des gens qui ne menaçaient pas) ; `troquer({ prejuge })` : qui joue d'un préjugé pour le prix porte « colporter ».
  L'auteur peut être `"groupe"` (ses membres présents), l'id ou le nom d'un survivant ; un PNJ inconnu ou une faction ne portent
  rien. Ces fonctions rendent en plus `sens` (le résultat de l'acte, ou `null`). Fenêtre du MJ, onglet Marché : « Qui joue d'un
  préjugé pour le prix ».
- **La fête des autres use les préjugés** (§11 -> §12) : `participer({ …, pnj })` : chaque préjugé des PNJ qui y voient le groupe
  perd un cran, comme une fête partagée au camp (`feter({ invites })`) ; rend `prejuges`. Fenêtre du MJ : les PNJ invités d'une
  fête au camp et ceux qui voient le groupe chez les autres.
- **Les jeunes de 16 à 18 ans** (§11 -> §14) : `chef({ acteurId })` refuse un jeune (`peutEtreChef` ; erreur
  `Erreurs.ChefJeune`) ; `voter` pèse chaque voix par `poidsVote` (un jeune : une demi-voix ; `resoudreVote(voix, poids)`, sans
  poids : 1 par voix, comme avant) ; `crisesAutorite` ne désigne jamais un jeune comme successeur.
- **Les gramounes et les gens du marché ont un esprit** (§13, §12 -> §14) : `esprit: { regard, religion, religions, pratique,
  ancrage, sensMoral, autorite }` dans `contenu.gramounes` et `contenu.marchands`, écrit d'après leur histoire (jamais d'après leur
  origine). `genererRecrue({ gramoune })` le rend dans le tirage, avec les **préjugés** de la gramoune (§12, tirés de ses notes ;
  `creerSurvivant` les garde pour une recrue, jamais pour un survivant de joueur) ; `creerMarchand` le pose sur l'acteur.
- **Les fêtes de chaque religion** (§11 -> §14) : l'islam fête le ramadan et l'Aïd el-Kebir ; l'hindouisme tamoul, aussi le Nouvel
  An tamoul et la marche sur le feu (`religions[].fetes`) : un pratiquant y gagne 1 de moral de plus quand le groupe la fête.
- **Collisions de noms réglées à la fusion** : `api.signe({ signe })` reste le signe du groupe (marché) ; lire un signe (§14)
  devient `api.lireSigne()` ; l'erreur d'un groupe séparé inconnu devient `Erreurs.GroupeInconnu` (`Erreurs.CommunauteInconnue`
  reste la communauté d'une fête, §11). Le gaz, les boutures et le biocarburant (§13) n'ont pas de cours au marché
  (`RESSOURCES_HORS_COURS`) : ils ne se troquent pas au cours tant qu'on ne leur en a pas donné un.

## 16. Les histoires des survivants (lot 11 du portage du jeu 3D, 2026-11-17)

Les phrases d'histoire écrites pour Fénoir 3D (`donnees/histoires/` du jeu 3D, décision de Jordan des 14 et 15 novembre :
« beaucoup plus d'histoires, beaucoup de natifs de La Réunion ») entrent dans le jeu de table. Elles complètent la graine
d'histoire du §10.2 et le journal du §10.5. **Aucune n'a d'effet de jeu** : ni dé, ni moral, ni règle ; l'origine d'un survivant
ne décide de rien (guide du métissage, `docs/metissage.md`). Chiffres et raisons : `docs/equilibre-histoires.md`.

### 16.1 Contenu (`lakour-fenoir`, `contenu/histoires.mjs` ; registre : famille `histoires`)
```
histoires: [{
  cle: "enfance:enfant-de-cilaos" | "passe:…" | "trait:…" | "religion:…" | "regard:…" | "generation",
  type: "enfance" | "passe" | "trait" | "religion" | "regard" | "generation",
  pour: [clé],              // les clés du contenu à qui le groupe parle (vide pour « generation ») ; une religion donne la clé
                            //   de FVTT puis celle du jeu 3D (« hindouisme-tamoul », « hindoue ») pour la liste commune du lot 10
  avec?: [[clé]],           // religion trouvée par « plusieurs » : de chaque liste, l'une au moins dans ses religions
  phrases: [{
    sujet: String,          // une histoire ne prend jamais deux phrases du même sujet ; « lieu » ouvre l'enfance, « metier » le passé
    texte: String,          // accordé entre accolades, le féminin d'abord : « {Elle|Il} est né{e|} à Cilaos »
    marques?: [String], exclut?: [String],   // « nee-ailleurs » : né hors de l'île
    age?: [min, max],       // la tranche d'âge où la phrase vaut
    pratique?: true,        // seulement pour un croyant pratiquant (§14)
    foi?: [clé]             // seulement si sa religion, ou l'une des siennes, est dans la liste
  }]
}]
```
- 24 enfances (8 à 11 phrases chacune), 17 passés (7 ou 8), 32 traits (une), 8 religions (deux), 3 regards (deux), 18 phrases de
  génération : 440 phrases. Une phrase de passé ne dit rien de l'enfance, des parents ni du lieu de naissance.
- Anglais : les mêmes groupes dans `contenu/en/registre.json` (« registre/histoires/<clé> », champ `phrases.<n>.texte`),
  accordés de même (« {She|He} was born in Cilaos ») ; les mots créoles rares ont leur sens à côté.
- Le fabricant vérifie la forme (accolades bien formées dans les deux genres, 150 caractères au plus par phrase, en français et
  en anglais) et que chaque enfance, passé et trait a ses phrases.

### 16.2 Tirage (`logique/histoires.mjs`, logique pure)
- `composerHistoire(contenu, fiche, { hasard? })` -> `{ phrases: [texte accordé], cles: ["enfance:enfant-de-cilaos/3", …] }` ou
  `null` (genre inconnu, enfance ou passé sans phrases). `fiche` : `{ nom, age, genre, enfance, passe, traits, religion,
  religions, pratique, regard }`. Dans l'ordre : une phrase de lieu de l'enfance, une autre de l'enfance, une phrase de métier
  du passé, une autre du passé, puis 65 fois sur 100 une de plus (un trait, la foi, le regard ou la génération) ; 520 caractères
  au plus (on retire par la fin, jamais sous 3 phrases).
- Cohérence : jamais deux phrases du même sujet ni deux qui s'excluent ; l'âge ; une enfance d'origine « ailleurs » porte la
  marque « nee-ailleurs » ; « pratique » et « foi » suivent l'esprit du §14 (un esprit non tiré n'en prend aucune).
- Hasard : un flux à part, `deriverHasard("histoire", nom, âge, genre, enfance, passé)`. La même fiche donne la même histoire ;
  aucun autre tirage du générateur ne bouge (les survivants, recrues et parties d'avant restent les mêmes).
- `phrasesParCles(contenu, cles, genre)` relit des phrases gardées dans un genre et dans la langue du contenu ;
  `clesDeLaFiche(contenu, fiche, cles)` : vrai si des phrases gardées vont toujours à la fiche (son enfance, son passé, ses
  traits, sa foi, son regard, son âge) ; `histoireDe(contenu, fiche, { cles })` : les phrases gardées si elles vont, sinon celles
  de la fiche. `accorder(texte, genre)`, `verifierHistoires(contenu)`, `HISTOIRE` (les bornes).
- `genererSurvivant` (§10.2) : `histoire.graine.phrases` reçoit ces phrases et `histoire.graine.cles` leurs clés ; sans elles,
  les phrases de l'enfance et du passé, comme avant.

### 16.3 Foundry (`scripts/histoires.mjs`)
- `creerSurvivant` garde les clés du tirage dans `flags.lakour-survie.phrasesHistoire` (au plus 5, seulement si elles vont à la
  fiche créée : un tirage dont le MJ IA a changé le passé ne garde pas celles de l'autre métier) ; la graine
  (`flags.lakour-survie.graine`, et `flags.lakour-mj-ia.graineHistoire` quand le moteur est actif) porte les phrases, comme
  l'aperçu de la fenêtre de création.
- `api.histoireDuSurvivant({ acteurId | acteur })` (lecture, partout) -> `{ phrases, cles }` : les phrases gardées tant qu'elles
  vont à sa fiche, sinon celles de sa fiche (un survivant d'avant ce lot a donc aussi la sienne).
- `system.graineHistoire` (survivant ; calculée, jamais stockée) : la graine gardée, sinon l'histoire de la fiche. Le moteur la
  lit d'abord (`materiauHistoire`).
- **Journal « Histoire de… »** (§10.5) : quand le moteur le crée pour un survivant, le MJ qui l'a créé écrit l'histoire dans la
  page « Portrait » (crochet `createJournalEntry`), tant que cette page n'a que ses questions d'aide. Les autres pages gardent
  les leurs ; une page déjà écrite ne se réécrit jamais. Le MJ IA l'écrit ensuite à sa façon ou la complète.

## 17. Affaires, récits et fêtes (lot 12, 2026-11-17)

Repris du jeu 3D, validé par Jordan (« tout maintenant ») :
- `docs/propositions/histoire-et-quetes.md`, §2 à §4 et §6.2 ;
- `donnees/fetes/base.json` et `crates/fenoir-regles/src/fetes.rs`.

Chiffres et raisons : `docs/equilibre-affaires.md`. Rien n'est retiré ni renommé ; le moteur n'est pas touché.

**Le ton.**
- Les préjugés sont dans la bouche des personnages, et une rumeur sur une communauté est toujours fausse.
- Aucune origine ne joue dans les règles ; la foi n'a aucun effet propre.
- Les sujets délicats (l'affaire « Rendre à la lave », l'enfant du front du remède) suivent la décision de Jordan du
  17 novembre : rien de montré, aucun enfant mis en danger, le malaise vient de ce qu'on comprend.

### 17.1 Contenu (`modules/lakour-fenoir/contenu/affaires.mjs`)
- **Données et fabrique.**
  - `DONNEES_AFFAIRES` : les affaires, les arrivées, les supports, les figures, les bruits, les Livides en fête, les libellés, les
    pages.
  - `construireAffaires(D, N)` les fabrique : le registre, les journaux, les tables, la page du livre et les arrivées.
  - Les libellés et les noms (`NOMS_DU_CONTENU`) lui sont donnés : la fabrique rejoue à l'identique, et la traduction s'en sert.
  - `LOT_AFFAIRES` est le lot publié.
- **Registre `affaires`** (23) :
  ```
  { cle, numero, titre, taille: "bruit" | "affaire" | "grande-affaire" | "front", famille, regions ([] : partout), sites, factions,
    front: "" | "comptable" | "garnison" | "hauts" | "fournaise" | "remede", foire,
    naissance: { mois: [1..12], phases: [phase], fete: clé, cran: 1..6, declencheurs: ["refus-a-la-porte" | "date-perdue"] },
    apprendre, demande, malTourner, change, garde,
    verites: { vraie | exageree | perimee | fausse | piege: { poids, texte } },
    pente: { tousLes: jours, crans: [texte] },
    issues: [{ cle, titre, texte, effets }] (3 à 5),
    voix: [texte] (3 au moins), traces, ton }
  ```
- **Effets d'une issue**, tous facultatifs (`EFFETS_ISSUE`) :
  - `reputation: { faction: ±n }` ;
  - `acte` : un acte du §14 ;
  - `front: ±n` : le front de l'affaire ;
  - `stocks: { ressource: ±n }` ;
  - `savoir` : une clé de savoir ;
  - `plan` : une clé d'installation ;
  - `renom`, `moral`, `entente`, `autorite`, `visibilite` : ±n ;
  - `recrue`, `depart`, `prejuge`, `horde` : `true` ;
  - `rumeur` : `true` ou `"dementie"` ;
  - `voie` : `"ouverte"` ;
  - `fete` : une clé de fête ;
  - `voeu` : `"tenu"` ou `"rompu"`.
- **Registre `regions[].arrivee`** : ce qu'on comprend en arrivant dans la région, une ligne pour le MJ.
- **Journaux du MJ.**
  - « Les affaires de l'île » : une introduction, puis une page par affaire.
  - « Mener une affaire » :
    - la méthode, les tailles, la vérité, la pente et les horloges, les issues, les voix et les traces ;
    - les sujets délicats et la règle de respect des fêtes ;
    - les arrivées, les figures, les supports de récit.
- **Tables nouvelles.**
  - `affaires-ce-qui-se-raconte` (drapeau `affaires`) ;
  - six supports `recit-<support>` (drapeau `recit`) : lieu figé, journal d'un mort, cahier commun, écrit des murs, objet déplacé,
    nature ;
  - `figures-de-l-ile`, `bruits-de-l-ile`, `livides-en-fete` (drapeau `fetes: "livides"`).
  - La radio et les oratoires gardent leurs tables (`rumeurs-radio`, `oratoires-rouges`).
- **Autres journaux.**
  - Le livre de l'île gagne la page « Les signes des murs », avant « La première nuit ».
  - Le guide du MJ, page « Les outils du MJ », gagne une ligne.
  - La campagne, front 5 : le cran 3 et une ligne de ton sont récrits sobrement.

### 17.2 Logique (`systems/lakour-survie/logique/affaires.mjs`, lecture seule)
- **Constantes** : `TAILLES_AFFAIRE`, `VERITES_AFFAIRE`, `FRONTS_CAMPAGNE`, `CRANS_FRONT`, `DECLENCHEURS_AFFAIRE`, `EFFETS_ISSUE`,
  `RESSOURCES_ISSUE`.
- **Lire les affaires** : `affairesDe(contenu)`, `affaireDe(contenu, cle)`.
- **`affairePossible(a, ctx)` et `affairesPossibles(contenu, ctx)`**, avec
  `ctx = { region, mois, phase, fetes, fronts, declencheurs, closes }`.
  - Un champ absent ne filtre pas.
  - Un déclencheur, lui, doit être dit.
- **`tirerVerite(a, hasard)`** : `{ cle, texte, poids }`.
- **`tirerAffaire(contenu, ctx, hasard, { cle })`** : `{ cle, numero, titre, taille, front, verite, voix, pente, possibles }`, ou
  `null`.
- **`cranDeLaPente(a, jours)`** : `{ cran, texte, fin }`.
- **`issueDe(a, cle)`** : une copie de l'issue.
- **`erreursAffaire(a, contenu)`** : les erreurs, contre le registre. Le fabricant et les essais s'en servent.

### 17.3 API (`game.lakourSurvie`, lecture)
- **`affaires({ region, mois, phase, fronts, declencheurs, closes, horizon = 30 })`** : `{ contexte, affaires: [{ cle, numero,
  titre, taille, front, regions }] }`. Le contexte se complète seul :
  - la région du groupe ;
  - le mois et la phase du jour de jeu ;
  - les fêtes du jour et des `horizon` jours suivants ;
  - les crans lus dans les horloges du moteur `front-<front>`. Les `fronts` donnés l'emportent.
- **`tirerAffaire({ cle, ...contexte })`** : la vérité tirée est au MJ seul.
- **`penteAffaire({ cle, jours })`**, **`issueAffaire({ cle, issue })`**.
- **Rien n'est écrit dans la partie.** Une affaire en cours se tient dans une horloge du moteur (« affaire-<clé> », un segment par
  cran) ou dans les notes du MJ.

### 17.4 Fêtes et foire
- **Fêtes hors du socle** (`FETES_HORS_SOCLE` dans `scripts/fetes.js`) : `pongal` et `fete-du-miel-vert`.
  - **Leur date.** Elles portent leur propre date, dans la forme que lit `fetesDuJeu` :
    - Pongal : `date: "01-14"`, `avant: 1`, `apres: 2` ;
    - le miel vert : `dates`, le dernier samedi de janvier de 2000 à 2100, `apres: 1`.
  - **Pas déclinées auprès du moteur** : ni `declinaisons()`, ni `declinaisonsDeFete` de `main.js`.
  - **Vues quand même.** `fetesDuJour` du module les ajoute, avec ou sans le socle. Le système les voit, les annonce et les fête.
  - **Ce que vérifie le fabricant** :
    - une fête hors du socle a sa date ;
    - une fête du socle n'en a pas ;
    - une fête que le socle connaîtrait un jour devrait perdre la sienne.
  - **Pongal et la religion** : Pongal s'ajoute aux fêtes de l'hindouisme tamoul.
- **`ambiance`**, pour chaque fête : ce qu'on voit et ce qu'on trouve, dit dans le journal « Les fêtes de Fénoir ». La période se
  lit désormais dans `periode` ; l'alias `date`, non énumérable, ne sert plus qu'aux fêtes du socle.
- **Foire** `foire-de-bras-panon` : dans l'Est, en mai, sa récolte est la nourriture.

### 17.5 MJ IA (le moteur n'est pas touché ; besoins écrits pour son dépôt)
- **Un outil `survie_affaire`**, avec trois actions :
  - « tirer » : `api.tirerAffaire`. Il ouvre une horloge « affaire-<clé> » d'autant de segments que de crans, et garde la vérité au
    secret.
  - « avancer » : un cran de la pente, avec son texte.
  - « clore » : avec l'issue (`api.issueAffaire`), il applique les effets avec les outils existants.
- **Le contexte** :
  - les affaires en cours (titre, cran ; la vérité en secret) ;
  - la ligne d'arrivée de la région où le groupe entre.
- **Les consignes** :
  - ne jamais dire la vérité d'une affaire ;
  - donner la nouvelle avec sa provenance ;
  - les sujets délicats et la règle de respect.
- **Le socle des fêtes** : Pongal et le miel vert « sur demande ». Le contenu retirera alors leur date.

## 18. Percevoir dans le noir, le vent et la pluie (lot « sens », 2026-11-17)

Lot 2 de l'inventaire du jeu 3D : la famille 4 « Percevoir dans le noir » et la famille 11 « La voix de l'île », pour une table
(rien en temps réel : ni écholocalisation affichée, ni états d'éveil suivis Livide par Livide). Chiffres et raisons :
`docs/equilibre-sens.md`. Logique : `logique/sens.mjs` (nouveau), crochets dans `abri.mjs`, `monde.mjs`, `actions.mjs`, `etat.mjs`.
Rien n'est retiré ni renommé ; les champs nouveaux ont une valeur par défaut ; une odeur nulle ne change aucun tirage.

### 18.1 Règles (logique pure, `logique/sens.mjs`)
- **Pluie** : `pleutAuQuart({ graine, quart, region, contenu, dateDepart, monde?, hauts? })` (flux « pluie|quart|région », 65 % commun
  à l'île : « pluie|quart ») ; chance `chanceDePluie(mm, saison)` ; `pluieAnnuelle(region, { hauts })` lit `climat.pluieAn: { bas,
  hauts }` (sinon `climat.pluie`) ; une intempérie en cours (`intemperiesDuJour`) fait pleuvoir ; `pluieDuJour` (part du jour).
- **Ravines** : `eauDesHauts` (8 quarts), `etatRavine` → `"a-sec" | "basse" | "coule" | "en-crue"`, `ravineDuJour({ …, jour, ravine })`
  → `{ etats, etat, hydro, eau }`. Site : `ravine: "temporaire"` (absent : permanente).
- **Brume** : `brumeAuQuart({ altitude, moment })`. **Vent** : `ventDuQuart({ graine, quart, dateDepart })` → `{ cap, vers, de, force,
  mot }` (flux « vent|quart », toute l'île).
- **Odeur** : `odeurAbri({ installations, souillure, sang, morts, altitude, pluie })` → `{ odeur, betes, sources, attenuee }` ;
  `mortsSansRepos(etat, region, jour)`. Installation : `effets.odeur` (cuisine commune, séchoir et fumoir, basse-cour, enclos à
  cabris).
- **Habitude du noir** (survivant, `system.noir: { nuits, nuitLe, lumiereLe }`) : `noirDe`, `palierNoir` (2, 6, 14, 30 nuits),
  `palierNoirEffectif(system, quart)`, `compterNuitNoire(system, { quart, lumiere })`, `allumerDansLeNoir`, `texteNoir` ;
  `desDuNoir(competence, { clarte, palier, ecoute: "" | "yeux-fermes" | "active" })` → `{ des, bruit, immobile }` ;
  `desDuTemps(competence, { pluie, brume })`.
- **Livides** : bestiaire `perception: { vue, ouie, odorat, froid, obstacle, attaques }` ; `perceptionDe(contenu, cle)`,
  `desFaceALivide(perception, { nuit, vent: "vers-lui" | "vers-moi", bruit, altitude })` ; `ETATS_EVEIL` ;
  `corpsDesLivides({ jour, altitude })`.
- **Rue nettoyée** : `nettoyerLieu(nettoyes, { region, site, jour, tues })`, `facteurNettoyage(nettoyes, { region, site, jour })`.
- **Timise** : `chanceTimise({ zone, jour })`. **Musique** : `veilleeMusique({ air, jour, derniere })`, `bruitDesMusiciens(systemes,
  contenu)` (ancrage `bruit`), `momentMusical({ … })`, `voixDeLaRegion(region)`, `VOIX_DES_ZONES`, `PORTEES`, `REGLES_SENS`.

### 18.2 Branchements
- `bilanAbri(…, conditions)` : `conditions.ravine` (pico-hydro × hydro ; eau d'une rivière × eau), `conditions.pluie`, `souillure`,
  `sang`, `morts` (odeur), `musique` (bruit) ; le bilan rend `odeur`, `odeurBetes`, `odeurSources` et, au bord d'une rivière, `ravine`.
- `tirerMenaces(…, { odeur, odeurBetes })` : horde + 2 % par point, errants + 1 %, chiens + 0,5 % (odeur des bêtes).
- `fouiller(…, { facteurRencontre })` : les rencontres d'une fouille × ce facteur (défaut 1).
- `avancer` : les conditions de l'abri portent pluie, ravine, morts, musicien ; l'odeur va aux menaces ; au quart de nuit,
  l'habitude du noir (options `lumiere`, `lumiereEnRoute`), les grenouilles qui se taisent (une fois par horde : `monde.silences`,
  secret), la Timise (flux « timise|jour »). Faits : `noir-palier-1` à `4`, `grenouilles-silence` (aussi en alerte, type
  `silence`), `noir-horde-entendue`, `timise`, `timise-reconnue` (`CLES_TEXTES`).

### 18.3 État, API et fenêtres
- État public : `temps: { quart, region, pluie, brume, vent }` (écrit par le MJ actif à chaque écriture ; pas la graine),
  `nettoyes: [{ region, site, jour, tues }]`, `groupe.musiqueLe`. `meteo.temps` peut valoir `"averse"` et `"brume"` (bandeau, scène :
  pluie et brouillard, ambiance sonore « pluie »). `cielDe` : un quart de nuit où il pleut est couvert. L'instantané du bilan porte
  `odeur`, `odeurBetes`, `odeurSources`, `ravine`.
- `quand()` rend en plus `pluie`, `brume`, `vent`, `voix`. `test({ …, ecoute })` (MJ seulement) ; le résultat porte `temps`, `noir`,
  `bruitEcoute`. `avancer({ …, lumiere, lumiereEnRoute })`. `fouiller` applique le nettoyage du lieu.
- Nouvelles fonctions : `sens()` (lecture : temps, odeur, ravine, corps, habitude de chacun, lieux nettoyés, moment musical),
  `approche({ creature, vent, bruit })` (lecture), `noir({ acteurId, action: "lumiere" | "nuit" | "regler", nuits })`,
  `nettoyer({ region, site, tues })`, `jouer({ musiciens, air: "doux" | "fort" })` (MJ actif, monde ouvert).
- Survivant : `noir` (objet, vide par défaut ; `gmOnlyFields`). Fiche : l'habitude du noir. Fenêtre du MJ, onglet Partie : bloc
  « Les sens » et formulaires « L'habitude du noir », « Un lieu nettoyé », « Une veillée en musique ».
- Contenu : `regions[].climat.pluieAn`, `sites[].ravine`, `bestiaire[].perception`, `installations[].niveaux[].effets.odeur`,
  `ancrages[].bruit` ; tables « La nuit — ce qu'on entend », « La nuit — les signes », « Ce que porte le vent », « Les contes des
  anciens », « Un Livide intrigué — ce qu'il fait », « La ravine après la pluie », « La voix de l'île — musique du soir » ; journal du
  MJ « Percevoir dans le noir » ; page « La nuit, le vent et la pluie » (guide du joueur) ; page « La nuit et ses voix » (livre de
  l'île).

## 19. Le corps, le sommeil et l'hygiène (lot 1 du portage du jeu 3D, 2026-11-17)

Lot 1 de l'inventaire du jeu 3D : la famille 2 « L'esprit sur le corps » (dormir et bivouaquer, le manque de sommeil, les besoins
naturels et les maladies), les chutes (famille 9) et le bouclier. Décisions de Jordan des 14, 16 et 17 novembre (« tout
maintenant ») ; rien en temps réel. Chiffres et raisons : `docs/equilibre-corps.md`. Logique : `logique/corps.mjs` (nouveau),
crochets dans `maladies.mjs`, `survivant.mjs`, `abri.mjs`, `actions.mjs`, `etat.mjs`. Rien n'est retiré ni renommé : une fiche
sans `veille`, un abri sans `souillure`, un contenu sans symptômes marchent comme avant.

### 19.1 Règles (logique pure, `logique/corps.mjs`)
- **Sommeil** (survivant `veille` : quarts éveillés depuis le dernier sommeil, 0 à 12) : `SOMMEIL`, `etatSommeil(veille)` →
  `"repose" | "en-manque" (≥ 3) | "epuise" (≥ 4) | "terrasse" (≥ 7)` ; `malusSommeil(system, malusFatigue)` : épuisé −1 dé,
  terrassé −2 dés, fatigue et sommeil ensemble au plus −2 (`malusEtat` rend `sommeil`) ; `quartDeSommeil(system, { dort, insomnie })`
  (un quart de sommeil efface 4 quarts à l'abri, 3 au bivouac, 2 au sol, un de moins avec l'insomnie ; terrassé, on dort de force
  au sol ; événements `epuise`, `endormi`) ; `dormir(system, { quarts, lieu, insomnie })` ; `lieuDeSommeil({ nuit, matin, aLAbri,
  enRoute, garde, repos, bivouac, lieu, dort, eveille, veille })` : la nuit à l'abri, la garde (et qui n'a pas dormi) le matin,
  l'épuisé au premier quart où l'on s'arrête, en route on marche, arrêté dehors au bivouac ou au sol, le quart de repos ; loin de
  l'abri, la tâche « garde » ne tient personne debout (seule la veille demandée).
- **Bivouac** : `jugerBivouac({ pente, ravine, route, bati, couvert, feu, lumiere, bruit, livides, souille })` →
  `{ jugement: "sur" | "expose" | "dangereux", raisons }` ; `sommeilAuBivouac(jugement, equipe)` ; `BIVOUAC.rencontre` (× 0,5 / 1 / 2,
  pour une rencontre de nuit que le MJ tire).
- **Chutes** : `chute({ hauteur, eau, reception })` → `{ hauteur, amorti, blessures, mourant, mort, fracture, recu }` (3 m une
  blessure, une de plus tous les 3 m, mourant à 12 m, mort à 25 m ; 1,5 m d'eau retire 15 m ; se recevoir retire une blessure ;
  fracture à 6 m et plus sans se recevoir) ; `chuteDeLivide` → `{ chancelle, rampe }` ; `appliquerChute(system, resultat)`.
- **Hygiène** (abri `souillure`) : `HYGIENE`, `souillureDuJour({ souillure, personnes, latrines, surpeuplement, pluie })`,
  `insalubrite(souillure)` (0 à 3 : propre, ordinaire, sale, insalubre), `niveauHygiene(latrines, toilette)`, `menage(souillure,
  { quarts, bras })`, `risqueInsalubrite(niveau, toilette)`, `salubre(hygiene, insalubrite)`, `tirerInsalubrite(survivants, defs,
  { niveau, toilette }, hasard)` (chaque personne, avec la chance du niveau, attrape une affliction à poids `insalubrite`).
- **Bouclier** : `parer(touches, seuil, hasard)` → `{ parees, passent, des }` ; `paradeDe(equipements)` ;
  `resoudreCombat({ …, parade })` : chaque touche d'un Livide est parée sur un dé ≥ seuil ; une touche parée ne blesse ni ne mord ;
  le résultat porte `parees`, `desParade`. Sans bouclier, rien n'est tiré.
- **Symptômes** (`maladies.mjs`) : `symptomesAffliction(def, stade)`, `reconnue(def, savoirs)`, `insomnieDe(system, defs)`,
  `symptomesDuGris(contenu, stade)`, `grisReconnu(contenu, { savoirs, temoin })`, `nomSymptome`, `nomsSymptomes`,
  `morsureMuette(system, quart)` (deux quarts), `ceQueVoientLesJoueurs(system, contenu, { savoirs, grisConnu, quart })` →
  `{ maux: [{ cle, nom, stade, symptomes, reconnue }], gris, morsure }`. `moralDuStade(def, stade)` : le moral qu'un stade coûte,
  à raconter (la logique ne l'applique pas). `facteurRisque(def, { …, salubre })` : l'eau × 0,5 ; contagion × 0,75 dans `tirerMaladies`.

### 19.2 Branchements
- `effetQuart(system, quart, { …, dort, insomnie })` compte le sommeil (absent : pas compté, comme avant).
- `avancer` : à chaque quart, `lieuDeSommeil` pour chacun ; options `dorment`, `eveilles`, `bivouac`, `lieuSommeil` ; une nuit au
  bivouac −1 fatigue. Faits publics `survivant-epuise`, `survivant-endormi`. Le Gris et les maux que le groupe ne reconnaît pas se
  disent par leurs signes (`survivant-gris-signes`, `survivant-mort-fievre`, `survivant-declaree-signes`, `-aggravee-signes`,
  `-guerie-signes`) ; le nom et le stade vont au journal secret. Un mordu qui se relève devant le groupe : `groupe.grisConnu`.
  Chaque jour : l'abri salubre (`conditionsVie.salubre`), puis le tirage de l'insalubrité (flux « insalubrite|jour »).
- `bilanAbri` : `latrines`, `toilette`, `hygiene`, `souillure`, `insalubrite` ; un abri sale (insalubrité ≥ 2) sent comme un abri
  surpeuplé (odeur, §18). `journeeAbri` rend la `souillure` du lendemain (personnes, latrines, surpeuplement, `conditions.pluie`).
- `feter` : une fête à effet `hygiene` (le grand ménage) remet `souillure` à 0.

### 19.3 Contenu
- Afflictions : `symptomes: { active, aggravee }`, `effetsStade: { active|aggravee: { moral, insomnie } }`, `evidente`,
  `diagnostic: [savoir]`, `insalubrite` (poids), `siBlesse`. Registre : `symptomes: [{ cle, nom }]` (30, traduits) et
  `gris: { diagnostic, stades: [{ symptomes }] × 6 }`.
- Installations (`contenu/hygiene.mjs`) : `effets.hygiene` ; rôle « latrines » (feuillées 1 lontan, latrines sèches 2 lontan,
  fosse maçonnée 3 moderne, qui prend de l'eau), rôle « toilette » (lavoir 1 lontan, douche 2 moderne).
- Équipement : `parade` (bouclier de tôle 5), `bivouac` (tente, natte de vacoa).
- Journal du MJ « Le corps, le sommeil et l'hygiène » ; table « Un bivouac — ce qui vient la nuit » ; page « Dormir, se laver,
  tomber » du guide du joueur ; l'état d'un survivant (sommeil, faim et soif qui ne tuent pas) ; le bestiaire (bouclier, Livide qui
  rampe).

### 19.4 État, API et fenêtres
- Survivant : `veille` (entier), `morsure` (`{ quart }` ou null) ; abri : `souillure` ; équipement : `parade`, `bivouac` ; affliction :
  les champs du §19.3 (tous `gmOnlyFields`). L'instantané public du bilan porte `hygiene`, `latrines`, `toilette`, `insalubrite`
  (pas la souillure chiffrée).
- API (`scripts/api-corps.mjs`) : `corps()`, `symptomes({ acteurId })` (un MJ voit en plus les noms et le stade), `bivouac(criteres)`
  (lecture) ; `dormir({ acteurId | membres, quarts, lieu })`, `soignerMorsure({ acteurId, soigneurId, medicament, decoction })`
  (carte du test chuchotée aux MJ, issue au journal secret, `morsure` posée sur la fiche), `chute({ acteurId, hauteur, eau, tester,
  reception, livide })`, `menage({ membres, quarts })`, `parer({ acteurId, touches })`, `grisConnu({ connu })` (MJ actif, monde
  ouvert). `avancer({ …, dorment, eveilles, lieuSommeil })` ; le groupe porte-t-il de quoi bivouaquer : lu sur l'équipement.
  `infecter` note au journal secret. `testDirect({ …, secret })` et `chat(…, { secret })` chuchotent aux MJ.
- Fiche du survivant : le sommeil ; pour un joueur, les maux par leurs signes (nommés s'il les reconnaît), le Gris par ses signes,
  la morsure pansée, jamais la jauge du Gris. Infobulle et tableau : le Gris et les noms au MJ seul. Fiche de l'abri : l'hygiène et
  l'insalubrité. Fenêtre du MJ, onglet Partie : bloc « Le corps » et formulaires « Soigner une morsure », « Une chute », « Le ménage
  de l'abri », « Dormir ».

## 20. Le jour qu'on croit, les cartes et les calendriers (lot « cartes », 2026-11-17)

Lot 3 de l'inventaire du jeu 3D : la famille 1 du complément, « Savoir quel jour et quelle heure il est », « Les cartes et les
calendriers se trouvent », leurs déclinaisons, « Le journal est un livre » et « Lire, copier et perdre un journal », pour une table.
Le lot fêtes (§11) avait posé la date de jeu, la lune et la date lue dans la nature ; ce paragraphe y ajoute ce que le groupe
**croit**. Chiffres et raisons : `docs/equilibre-cartes.md`. Logique : `logique/reperes.mjs` (nouveau), crochets dans `etat.mjs`.
API : `scripts/api-reperes.mjs` (nouveau), crochets dans `api.mjs`. Contenu : `contenu/reperes.mjs` (nouveau). Rien n'est retiré
ni renommé : `etat.calendrier.exacte`, `quand().dateExacte` et `quand().dateLue` gardent leur sens ; un champ nouveau a sa valeur
par défaut ; le compte tire dans son propre flux de hasard (« compte|jour ») et ne change aucun autre tirage.

### 20.1 Règles (logique pure, `logique/reperes.mjs`)
- **Le compte des jours** (`etat.compte`, public : ce que le groupe croit) :
  `{ jourCru, certitude: "sur" | "a-peu-pres" | "perdu", noteLe, oublieLe, joursSansNoter, marge, encoches, teneur (acteurId), recu: { de, le, annonce } | null }`.
  `compteDepart(jour, teneur)`, `compteDe(etat)` (une partie d'avant le lot : sûr si `calendrier.exacte` n'est pas `false`, perdu
  sinon), `jourConnu`, `ecartDuCompte(c, jour)` (au MJ), `peutNoter(system)`, `noteDuJour(c, jour, { teneur, present, hasard })`
  (raisons : `note`, `tenu`, `oublie`, `sans-teneur`, `absent`, `mort`, `empeche`, `moral`), `finDuJour(c, jour, { note, support,
  hasard })`, `savoirLeJour`, `recevoirJour(c, { jourAnnonce, jour, de, marge })`, `journeeCompte(c, { jour, exacte, support,
  teneur, present, hasard })` → `{ compte, note, evenement: "retrouve" | "doute" | "perdu" | "manque" | null }`, `texteCompte`,
  `REGLES_COMPTE`, `CERTITUDES`.
- **La lune sur un calendrier** : `lireLaLune(c, { jour, dateDepart, calendrier: { annee, lunes, marees }, hasard })` →
  `{ ok, motif, compte, trouve, avant, autreAnnee }` (le mois cru ; perdu, le mois de la nature ; une autre année fausse le jour).
- **L'heure** : `heureLue({ moment, couvert, pluie, sousTerre, exacte, cadran })` → `{ exacte, marge, cle }` ; `SOLEIL`,
  `MARGES_HEURE`, `soleilDuMois(mois)`.
- **Les repères** (équipements de catégorie `repere`, champ `repere`) : `TYPES_REPERE` (`carte`, `calendrier`, `montre`, `planche`,
  `cadran`, `cahier`, `encre`), `RARETES_REPERE`, `ANNEES_CALENDRIER` (`courante`, `postes`, `passee`), `TERRAINS_CARTE`,
  `LIEUX_REPERE` (les types de sites et `region`), `repereDe`, `reperesDuContenu`, `resoudreRepere(def, { jour, dateDepart, region,
  contenu, hasard })` (l'année d'un calendrier, les régions, la moitié, l'annotation et l'impression d'une carte),
  `calendrierValable(rep, annee)`, `supportDuCompte(reperes, annee)`, `calendrierPourLaLune`, `aUneMontre`, `aUnCadran`,
  `ceQueDisentLesCartes(cartes, contenu)` → `{ region: { routes: { voisine: etat }, sources: [{ nom, imprimee }], notes } }`,
  `tirerRepere(contenu, { lieu, hasard })`, `chanceRepere`, `CHANCE_REPERE_MAX`, `erreursRepere(def, contenu)`.
- **Le journal d'un mort** : `journalAuDeces(compte, plans)`, `lireJournalDuMort(etat, ref, { jour, region })`,
  `renseignementsDuJournal(renseignements, lus, { jour, contenu })` (source `journal`, ajoutée à `SOURCES_RENSEIGNEMENT` :
  l'infestation, l'eau, le courant, une note).

### 20.2 Branchements
- `creerPartie` : `compte: compteDepart(0, membres[0])`.
- `avancer` (étape 7 bis, chaque jour) : le téléphone de la région du groupe ou la radio de l'abri remettent le compte juste ;
  sinon `journeeCompte` (option `reperes: { calendriers: [année], planche }`). Faits publics `compte-retrouve`, `compte-doute`,
  `compte-perdu`, `compte-manque*` ; une alerte de type `compte` quand il se perd. Étape 1 bis : un membre qui meurt garde
  `etat.morts[].journal: { jourCru, certitude, plans }`.
- Écriture (`terminer`) : `etat.compte` est posé (migration) et remis juste par le téléphone ou la radio, avant `etat.calendrier`.
- `fouiller` (API) : une fouille d'un lieu tire un repère (flux « repere|quart|lieu »), créé sur le premier fouilleur ; le
  résultat porte `repere: { cle, nom, acteurId, objetId } | null`.
- `participer` (API) : la fête des autres rend le jour à un groupe qui ne le sait plus (`jourAppris`).
- `affaires()` : le déclencheur `date-perdue` s'ajoute de lui-même quand le compte est perdu.

### 20.3 État, API et fenêtres
- Équipement : `repere` (objet, `null` par défaut ; `gmOnlyFields`). Catégorie d'équipement `repere` (`CATEGORIES_EQUIPEMENT`).
- `quand()` rend en plus `compte: { certitude, marge, jourCru, teneur }` (ce que le groupe sait : sûr avec le téléphone ou la
  radio), `dateDuGroupe`, `jourDuGroupe` (`null` : perdu), `heureLue`, `heureDuGroupe` (vide si l'heure n'est pas sue).
- Nouvelles fonctions : `reperes()` (lecture : compte, heure, soleil, support, objets du groupe, ce que disent ses cartes,
  calendrier pour la lune, montre, cadran, fêtes à venir sur le calendrier des fêtes, journaux lisibles ; `compte.ecart` au MJ
  seul) ; écritures (MJ actif, monde ouvert) : `compte({ action: "teneur" | "noter" | "oublier" | "regler", acteurId, date, jour,
  certitude })`, `donnerDate({ de, a, date, jour, mensonge })` (`a` vide : le groupe reçoit ; sinon il donne, et un mensonge court
  par le Ladi Lafé : rumeur fausse et malveillante, auteur au secret ; démentie, « mentir »), `lireLaLune({ objetId })`,
  `donnerRepere({ acteurId, cle })`, `copierCarte({ objetId, acteurId })` (un cahier cousu, une encre usée, un quart),
  `lireJournal({ mortId } | { de, date, jour, depuis, plans, renseignements })` (un quart).
- Bandeau : les joueurs voient la date et le numéro du jour que le groupe croit, et l'heure seulement s'ils la savent ; le MJ, le
  vrai. Tableau de bord : le compte, les cartes et calendriers du groupe, les fêtes à venir ; dans les renseignements, les routes
  « d'après la carte » et ses notes ; sur la carte de l'île, une route vue d'après une carte en pointillé fin. Fenêtre du MJ, onglet
  Partie : bloc « Le jour qu'on croit » (le vrai jour, l'écart) et formulaires « Le compte des jours », « Un jour donné ou reçu »,
  « Lire la lune sur un calendrier », « Une carte ou un calendrier », « Recopier une carte », « Lire un journal ». Fiche d'objet : ce
  que dit le repère.
- Contenu : 17 équipements (`contenu/reperes.mjs` : 6 cartes, 5 calendriers, la montre, la planche des jours, le cadran solaire,
  l'encre de suie, le cahier cousu, la copie de carte), 4 recettes, tables « Le jour qu'on vous donne » et « Ce qu'un mort a écrit
  sur sa carte » (drapeau `reperes`), journal du MJ « Le jour qu'on croit », page « Le jour qu'on croit, les cartes et les
  calendriers » (guide du joueur). Le fabricant vérifie la forme des repères (`erreursRepere`) et la chance par lieu.

## 21. Les plans (lot 4 « Les plans », 2026-11-17)

Lot 4 de l'inventaire du jeu 3D : la famille 7 « Les plans », sans rien de ce qui tient aux cycles du serveur (remise à zéro,
verrous, chance de garder un plan). Chiffres et raisons : `docs/equilibre-plans.md`. Logique : `logique/plans.mjs` (nouveau), un
crochet dans `actions.mjs` (`fouiller`, cible `plans`), deux dans `etat.mjs` (`avancer` : la fenêtre qui s'ouvre, l'eau du cyclone
sur l'étagère). **Décision de Jordan du 2026-11-17 : un plan reste un rabais** (25 % de matériaux en moins, la moitié du travail :
`PLANS` d'`abri.mjs`, inchangé) ; **aucune installation, aucune recette n'exige un plan trouvé.** Rien n'est retiré ni renommé.

### 21.1 Clés, carnet, ce que le groupe connaît
- Une clé de plan au carnet (`groupe.plans`, §4) : la clé d'une installation (comme avant), ou `recette:<clé>` pour une recette.
  Une installation terminée y entre comme avant ; **fabriquer une recette ne l'y inscrit pas**.
- Ce que le groupe **connaît** (le rabais) : `plansConnus({ carnet, parCoeur, uniques })` = le carnet ∪ ce que ses membres vivants
  savent par cœur (`system.plans` du survivant) ∪ les plans des **plans uniques** en main (portés par un membre vivant, ou sur
  l'étagère de l'abri quand le groupe y est). `construire`, `peutConstruire`, `fabriquer`, `peutFabriquer` s'en servent ;
  `recetteAvecPlan(recette, connus)` rend la recette au rabais (`plan: true`).
- Lire : `savoirsDuPlan(contenu, cle)` (le premier niveau de l'installation, ou la recette), `peutLirePlan(contenu, cle, savoirs)`.
- Apprendre par cœur : `veilleePlan(eleve, { cle, contenu, connus })`, `veilleesPourApprendre(def)` = 1 + rareté moyenne ÷ 25.

### 21.2 Registre (contenu, `contenu/plans.mjs`)
```
plans: [{ cle, installation | recette, rarete: [min, max], lieux: [type de site], savoirs?: [cle] }      // ordinaires : une cible
      | { cle, unique: true, nom, description, rarete, couvre: [clé du carnet], objet: clé d'équipement, enseigne: [savoir], lieux }]
lieuxAPlans: [{ cle, nom, region, site?, description, retour (jours),
                garde: { type: "milieu" | "livides", texte, test?: { competence, difficulte }, rencontre?: { creature, nombre: [min, max] } },
                fenetre: { saison?: "seche" | "pluies", lune?: phase, apresCyclone?: jours, horsEruption?: jours }, fenetreTexte,
                tirage: [{ plan: clé du registre, poids }] }]
sites[].plans: [clé du registre]   // les plans propres d'un site (« là où le savoir vivait »), même rares
```
- Un plan dont le minimum atteint 50 est **rare** : jamais dans un lieu ordinaire. `planPourCle` donne aussi un plan (rareté 10-30) à
  toute installation ou recette que le registre ne décrit pas. `erreursPlans(contenu)` vérifie tout (fabricant, essais).
- Installation `etagere-aux-cahiers` (`effets.bibliotheque: { places, protege }`, 12 puis 24 papiers) ; équipements `copie-de-plan`,
  `carnet-du-fontainier`, `cahier-de-l-electricien` (le cahier de tisanes prend `cahier-de-gramoune`).

### 21.3 Papiers, rareté, valeur
- Équipement (§3.4) : `plans: [clé du carnet]` (les plans qu'un papier porte ; vide : pas un papier), `unique: ""` | clé du plan
  unique | `"cahier-dicte"`. `papierDe(system, contenu)` : un cahier dicté d'avant ce lot (sans `plans`) en reçoit d'après ce qu'il
  enseigne (`plansDuCahierDicte`). Survivant (§3.1) : `plans: [clé]` (par cœur), `planEnCours: { plan, fait, requis } | null`.
  Tous réservés au MJ (`gmOnlyFields`).
- `rareteCourante(def, circulation)` : la moyenne, moins un quart de l'écart jusqu'au minimum par copie sortie du groupe ;
  `valeurPlan(def, { circulation })` = arrondi de `3 + 0,2 × rareté`, × 3 unique (en parts, lu par le marché du lot 10) ;
  `faireCirculer`, `valeurPapier`.

### 21.4 Trouver
- `fouiller({ cible: "plans", connus })` : `chanceDePlan({ site, n, prudence })`, `plansDuLieu`, `chercherPlan` ; rend `plan` (clé du
  registre ou null) et le fait public `plan-trouve` ; le site se repose (`monde.plans.lieux`). Compte comme une fouille.
- Lieux à plans : `fenetreLieu(lieu, { jour, dateDepart, cyclones, eruption })`, `fenetresQuiSouvrent`, `etatLieuAPlans`,
  `tirerDuLieu(monde, contenu, lieu, hasard, { jour, dateDepart, connus })` (un plan parmi plusieurs ; revenir après `retour` jours ;
  un plan unique une fois : `monde.plans.uniques`), `noterCyclone`.
- `avancer`, chaque jour : la date du cyclone qui frappe (`monde.plans.cyclones`) ; un lieu dont la fenêtre s'ouvre : fait secret
  `plans-fenetre` `{ lieu, quand }` (journal secret, jamais public) ; un cyclone qui abîme un abri non préparé gâte un papier de
  l'étagère (`etagere-perte-eau`, pas dans le coffre).

### 21.5 État, API et fenêtres
- État public : `plans: { circulation: { clé du registre: n }, etagere: [{ id, name, img, system }] }` (absent d'une partie d'avant :
  `plansDeLEtat` rend du vide). Secret : `monde.plans = { lieux, uniques, rares: { lieu: { prochain, tires } }, cyclones }`.
- API (`scripts/api-plans.mjs`, étalée dans `game.lakourSurvie`). Lecture : `plans()`, `valeurPlan({ cle })`, `lieuxAPlans()`.
  Écriture (MJ actif, monde ouvert) : `lieuAPlans({ lieu, membres, quarts = 2 })` (la garde passée), `lirePlan({ objetId })`,
  `copierPlan({ cle, acteurId })`, `enseignerPlan({ acteurId, cle })`, `rangerPlan({ objetId })`, `prendrePlan({ id, acteurId })`,
  `perdreEtagere({ cause: "vol" | "feu" | "eau" })`, `donnerPlan({ objetId, contre, a })`, `recevoirPlan({ cle, acteurId, contre, de })`,
  `noterPlan({ cle })` (une issue d'affaire `plan`, §17), `reprendrePlans({ deId, aId })` (les papiers d'un mort). `fouiller` rend
  `plan` ; `assaut` rend `papiersVoles` (une brèche faite par des vivants) ; `demenager` emporte l'étagère ; `dicter` écrit un cahier
  unique avec ses plans ; `construire` et `fabriquer` rendent `plan`.
- Fenêtre du MJ, onglet Savoirs : bloc « Les plans » (carnet, par cœur, papiers, étagère, lieux et leur fenêtre) et ses formulaires ;
  cible de fouille « Plans ». Tableau de bord : les plans connus (recettes comprises). Fiches : un papier dit ses plans, l'étagère
  ses places ; un survivant, ce qu'il sait par cœur. Journal du MJ « Les plans » ; page « Les plans » du guide du joueur ; tables
  « Lieu à plans — … » (une par lieu), « Plans — à quoi ça ressemble », « Plans — ce qui se raconte ».

## 22. Le marché chiffré, la porte, la religion et la table de gestion (lot 10 du portage du jeu 3D, 2026-11-17)

Lot 10 de l'inventaire du jeu 3D, validé par Jordan (« tout maintenant ») : la marge du commerçant et l'étal (famille 7), la porte
(complément « 4 quinquies bis »), la religion (famille 2) et la table de gestion de l'abri (famille 9). Chiffres et raisons :
`docs/equilibre-communaute.md`. Rien n'est magique ; **aucune religion ni aucune origine n'a d'effet propre** ; rien n'est retiré
ni renommé : les anciennes clés de religion restent des alias, les champs nouveaux de l'état ont une valeur par défaut.

### 22.1 La liste commune des religions (contenu `religions.mjs`, logique `esprit.mjs`)
- **Une seule liste pour les deux jeux** (décision de Jordan du 17 novembre) : les clés et les poids du jeu 3D (validés le 14 novembre),
  plus le servis kabaré : `catholique` 45, `hindoue` 16, `aucune` 14, `hindoue-catholique` 10, `musulmane` 7, `protestante` 4,
  `bouddhiste` 3, `servis-kabare` 1 (sur 100). `plusieurs` reste une entrée spéciale, choisie sur la fiche (poids 0 : elle ne se tire
  plus). Une religion porte `alias: [anciennes clés]` et, pour une religion double, `composee: [clés]`.
- **Alias** : `hindouisme-tamoul` → `hindoue`, `islam` → `musulmane`, `evangelique` → `protestante`, `culte-chinois` → `bouddhiste`,
  `ancetres-malgaches` → `servis-kabare`. L'index du contenu (`indexer`) mène un alias à sa religion ; `cleReligion(cle, contenu)`
  rend la clé d'aujourd'hui ; un tirage, un verrou, `ajusterEsprit`, un tirage venu du MJ IA écrivent la clé d'aujourd'hui ; une fiche
  qui garde une ancienne clé marche comme avant (observance, plafond, fêtes, phrases d'histoire, listes des fenêtres).
- `religionsDe(s, contenu?, jour?)` : la religion (ou celles de « plusieurs ») sous les clés d'aujourd'hui, les deux religions d'une
  religion double, et pendant une conversion l'ancienne aussi. `coreligionnaires(a, b, contenu?, jour?)`, `soutienDe(s, contenu,
  jour?)`, `plafondEsprit(s, contenu, { …, jour })` la suivent. Les phrases d'histoire (§16) gardent leurs clés de groupe
  (`religion:hindouisme-tamoul/1`) : leur `pour` porte l'ancienne clé puis la nouvelle.
- **Changer de religion** : `changerDeReligion(s, { religion, religions, jour }, contenu)` → `{ ok, motif, system, avant, quitte,
  souvent }`. Pendant `REGLES_ESPRIT.conversion.jours` (30), les deux religions comptent pour prier ensemble et pour les fêtes,
  l'observance la plus exigeante s'impose et le plafond du pratiquant reste à 0 (au lieu de +1) ; `journeeEsprit` clôt la conversion
  (fait `esprit-conversion-faite`, au MJ). Champs dans `system.esprit` (`espritDe`) : `religionAvant`, `religionsAvant`, `convertiLe`,
  `conversions` (jours).

### 22.2 Le marché chiffré (`marche.mjs`)
- `REGLES_MARCHE.boutique` : `commercantReste(hasard)` (30 %) ; `confianceDuCommercant({ reputation, parole })` (0,75 à 1,15 selon
  la **réputation**, × 1 + 3 % par niveau de parole au-dessus de 1, bornée 0,25..1,15) ; `prixDuCommercant` (vente 1,25 / confiance,
  achat 0,6 × confiance) ; `evaluerALaBoutique({ donne, recoit, cours, reputation, parole, majoration })` ; `plafondCredit(carnet,
  debiteur, confiance, facteur)` et `prendreACredit({ …, facteur })` (le plafond × la confiance, à la demi-part).
- `valeurObjet(cle, contenu, cours)` → `{ valeur, source: "bareme" | "recette" | "" }` ; `valeurPlan({ rarete, unique })` (celle du lot
  plans depuis la fusion vague2, §23).
- L'étal : `creerEtal`, `chanceVenteEtal`, `journeeEtal(etal, { cours, hasard })`, `releverEtal` ; `REGLES_MARCHE.etal` ;
  `journeeDuMarche({ …, cours, hasard })` fait vendre les étals les jours de leur marché (faits `etal-vend`, `etal-vole`).
  État public : `marche.etals: [{ id, marche, biens, prix, contre, caisse, gardien, vendus, vols, depuis }]` (vide par défaut).

### 22.3 La porte et l'inconnu (`porte.mjs`, `generation.mjs`, `moralite.mjs`)
- La suite d'un refus suit le jeu 3D : `chancesDuRefus(sensMoral)` → il comprend 60 fois sur 100 ; rancune (feu) 20 × (1 − couleur),
  retour 20 × (1 + couleur), couleur = jauge / 10 (`REGLES_PORTE.suites.comprend, rancune, retour`).
- `ATTITUDES_RENCONTRE` (amicale 25, neutre 45, méfiante 22, hostile 8), `tirerAttitude(hasard)` ; `genererRecrue` rend `attitude`
  (flux à part : la recrue ne change pas). `TENTATIVES_PAR_JOUR` (1) : l'API compte les tentatives du jour (`recruter` rend
  `tentative`, `insiste`) ; elle n'interdit rien, le MJ tranche.
- Les homonymes : `genererSurvivant(…, { nomsPris })` ne tire pas un nom déjà porté (sans homonyme, aucun tirage ne change ; un nom
  gardé par verrou reste) ; `genererRecrue({ nomsPris })`, `tirerVisiteur({ nomsPris })` ; `cleDeNom(nom)`. Le témoin d'un acte :
  `enfantsTemoins(membres, auteurs)` : jamais l'auteur.

### 22.4 Les rangs et le passage (`chefs.mjs`)
- `RANGS` (chef, second, membre, nouveau), `REGLES_RANGS` (3 seconds au plus, nouveau 7 jours) ; `rangDuMembre(etat, id, jour)`,
  `secondsDe`, `estNouveau`, `noterArrivee`, `admettre`, `nommerSecond(etat, id, { retirer, jour, membre })` (refus : `rang-*`).
- `rangsDuJour(etat, survivants, { jour, partis })` (dans `avancer`) : un mort, un parti, un relevé perdent leur rang ; le chef
  mort, le premier second vivant et adulte prend la tête (fait public `chef-succede`), sinon plus de chef (`chef-perdu`) ; les
  nouveaux d'une semaine deviennent membres. `crisesAutorite({ …, seconds })` désigne d'abord un second.
- `accordDePassage(etat, communauteId, { ouvert, jour })` : `communautes[].passage` (Boolean), `passageLe` ; faits
  `passage-ouvert`, `passage-ferme`.
- État public : `groupe.seconds: [id]`, `groupe.nouveaux: { id: jour }`, `groupe.tentatives: { "nom|parleur|jour": n }` (le jour
  seulement).

### 22.5 La table de gestion (`gestion.mjs`, nouveau)
- La grille : `groupe.priorites: { acteurId: { tache: 0..4 } }` (0 : jamais ; 1 d'abord) ; `PRIORITE_MAX`, `TACHES_GRILLE`,
  `grilleDe`, `grilleParDefaut(system, tacheRepartie)` (sa tâche de la répartition en 1, ce qu'il sait faire en 3), `reglerPriorites`,
  `effacerPriorites`, `travailDisponible(situation)`, `situationDeLAbri(membres, abri, contenu)` (les bras des installations),
  `tacheParPriorite(system, grille, disponible, contenu)` (la priorité, puis le meilleur niveau), `repartirParPriorites(membres,
  etat, { besoins, abri, contenu, situation })` (jamais un joueur).
- Les quotas : `groupe.quotas: [{ id, acteurId, tache, jours, semaine, fait, depuis }]` ; `poserQuota`, `retirerQuota`,
  `suivreQuotas(etat, membres, jour)` (dans `avancer` ; bilans des semaines closes, **sans punition**), `etatDuQuota`, `semaineDe`.
- Les corvées : `contenu.corvees: [{ cle, nom, tache, description }]` (26) ; `groupe.corvees: { acteurId: cle }` ; `corveesDe`,
  `donnerCorvee`, `verifierCorvees`. Aucun effet de jeu.
- La répartition automatique de l'API (`repartirAuto`, avant chaque `avancer`) suit la grille d'un membre qui en a une, même sans le
  réglage `repartitionAuto` ; avec le réglage, la grille par défaut pour les autres.

### 22.6 API (`scripts/api-gestion.mjs`, `api-marche.mjs`, `api.mjs` ; écritures au MJ actif, monde ouvert)
```
tableDeGestion()                                   -> { jour, semaine, disponible, membres: [{ id, nom, statut, rang, actif, tache,
                                                      corvee, grille, grillePropre, prendrait, niveaux }], quotas, seconds, stocks }
corvees({ tache })                                 -> [{ cle, nom, tache, description }]
priorites({ acteurId, grille, effacer }) / quota({ acteurId, tache, jours, retirer }) / corvee({ acteurId, corvee })
second({ acteurId, retirer }) / admettre({ acteurId }) / passage({ communauteId, ouvert })
convertir({ acteurId, religion, religions, lieu }) -> { religion, religions, avant, quitte, souvent, rumeur }
evaluerTroc({ …, boutique, parleurId }) / troquer({ …, boutique, parleurId }) / crediter({ …, parleurId }) -> la marge, le facteur
ouvrirBoutique({ …, tirer })                       -> { ok, boutique } (tirer : un commerçant n'est resté que 30 fois sur 100)
tenirEtal({ marche, biens, prix, contre, gardien }) / releverEtal({ etal, fermer })
valeurObjet({ cle }) / valeurPlan({ rarete, unique })
```
- `communaute()` rend en plus `seconds` et `rangs` ; `genererRecrue()` rend `attitude` ; `recruter` rend `tentative`, `insiste` ;
  `acteMoral({ acteurs })` accepte un nom (refusé s'il est porté par deux survivants). Un nom dit à `rumeur`, `dementir`, `troquer`
  (`prejuge`), `rompreTreve` se cherche d'abord dans le groupe ; un nom porté par deux survivants ne désigne personne
  (`survivantDesigne`, donnees.mjs). `generer()` évite les noms des survivants du monde (`nomsDesSurvivants`).
- Un témoin n'est jamais l'auteur : `porterActe` passe ses porteurs à `temoignageEnfants`.
- Quitter sa religion, ou en changer une deuxième fois dans l'année : une rumeur vraie au Ladi Lafé (`rumeur-quitte-sa-foi`,
  `rumeur-change-souvent`, portée « quartier »).

### 22.7 Fenêtres et contenu
- Fenêtre du MJ : onglet **Groupe**, la table de gestion (grille membre × tâche, ce que chacun prendrait, les quotas, les stocks,
  quota, corvée) et l'attitude tirée de la recrue ; onglet **Communauté**, le rang de chacun, la conversion en cours, les seconds,
  admettre, l'accord de passage, changer de religion ; onglet **Marché**, la boutique et qui parle au troc, « un commerçant est-il
  resté ? », l'étal, la caisse, la valeur d'un objet. Tableau de bord : les quotas, le rang et la corvée de chacun.
- Contenu (`contenu/communaute.mjs`) : `corvees` (26), `bareme.objets` (armes, tronçonneuse, cartes, bêtes vivantes, en parts) ;
  tables « La communauté — le départ préparé » et « La religion — ce qu'on dit de celui qui en change » ; pages « La table de
  gestion, les rangs et le marché » (guide du joueur) et « Mener la table de gestion, le marché chiffré et la porte » (guide du MJ,
  avec la liste de priorités d'un PNJ croisé : partir, fuir, écouter, boire, manger, dormir, faire sa tâche, errer).

## 23. Jointures entre les lots corps, cartes, plans et communauté (fusion vague2, 2026-11-17)

Les quatre lots (§19 à §22) ont été écrits côte à côte sur `vague1` ; leur fusion les branche là où chacun avait laissé un point
d'accroche. Aucune règle nouvelle : chaque jointure applique une règle qui existait déjà dans l'un des lots. Essais :
`essais/survie-jointures-vague2.test.mjs`.

- **La valeur d'un plan** (§21 -> §22). `valeurPlan` existait des deux côtés (`plans.mjs`, `marche.mjs`) : une seule reste, celle du
  lot plans (`3 + 0,2 × rareté courante`, × 3 unique, en parts entières, au moins 1). Elle prend un plan du registre ou la forme du
  marché `{ rarete: nombre, unique }` (une rareté en un nombre vaut `[r, r]`). `REGLES_MARCHE.plan` n'existe plus. API :
  `valeurPlan({ cle })` ou `valeurPlan({ rarete, unique })` (→ `{ cle, unique, rarete, valeur, … }`).
- **Le troc et la boutique comptent les objets** : `evaluerTroc` et `evaluerALaBoutique` prennent `objets: { donne, recoit }` (des
  parts, comptées comme les biens ; à la boutique, à la marge du commerçant). API `evaluerTroc({ …, objetsDonnes: [objetId],
  plansRecus: [clé de plan], objetsRecus: [clé d'objet] })` : un papier porté vaut son plan (`valeurPapier`), un autre objet
  `valeurObjet` ; le résultat rend `objets: { donne, recoit, detail }`. `valeurObjet({ objetId })` dit ce que vaut un objet porté
  (un papier : son plan) ; `valeurObjet({ cle })` d'un objet de plan unique (carnet, cahier) : son plan.
- **Le journal d'un mort** (§20 -> §21). À sa mort, son journal garde le carnet du groupe ET les plans qu'il savait par cœur (« les
  plans qu'il a appris ») : ils meurent avec lui, sauf ce qu'en garde le journal tant qu'on peut le lire. `lireJournal` : ses plans
  suivent la règle du lot plans (lus au carnet si le groupe sait les lire, sinon une copie au premier vivant, à lire plus tard :
  `papier`) ; sur le corps d'un mort, les papiers qu'il portait passent à un vivant (`reprendrePlans` ; `papiers`). Le journal
  d'un inconnu accepte un plan de recette (`recette:<clé>`).
- **Les repères au barème** (§20 -> §22) : les clés du lot cartes (le barème du lot 10 portait celles du jeu 3D). Carte routière 6,
  carte de randonnée 4, carte ancienne 3, calendrier des postes 1,5, vieux calendrier 1 (jeu 3D ÷ 2) ; au plus près pour ceux que
  le jeu 3D n'a pas : plan de ville 4, moitié de carte 3, carte annotée 6, copie de carte 3, calendriers de l'année, des marées et
  des fêtes 1,5, montre 3. La planche des jours, le cadran, l'encre et le cahier cousu valent leur recette. La **tente** (de quoi
  bivouaquer, §19) vaut 5 (le « bivouac » du jeu 3D).
- **Les religions et les fêtes** (§22 -> §14) : la fête d'un pratiquant suit `religionsDe(…, contenu)` (anciennes clés comprises) ;
  essai : le bouddhiste, sous `culte-chinois` comme sous `bouddhiste`, gagne 1 de plus au Nouvel An chinois.
- **Le grand ménage** (§19) : le gain du Nouvel An chinois dit que l'abri est lavé de toute sa souillure (ce que `feter` faisait déjà).

## 25. Fouiller, démonter et récolter l'île (lot 5 du portage du jeu 3D, 2026-11-17)

Lot 5 de l'inventaire du jeu 3D : la famille 6 (« plus ou moins pillé, jamais vide », décision du 15 novembre) et la famille 9 (les
bâtiments réels et leurs tables, démonter ce qui existe, les bêtes trouvées, les gisements et leur repousse), pour une table : rien en
gestes ni en mètres, des quarts-personne et des ressources entières. Chiffres et raisons : `docs/equilibre-fouille.md`. Logique :
`logique/fouilles.mjs` (nouveau), crochets dans `actions.mjs` (`fouiller`), `etat.mjs` (`avancer`), `moralite.mjs` (un acte). API :
`scripts/api-fouilles.mjs` (nouveau), crochets dans `api.mjs`. Contenu : `contenu/fouilles.mjs` (nouveau). Rien n'est retiré ni
renommé : la fouille d'une région, des sites, des jardins, des livres, des plans, des repères, la nuit noire et la rue nettoyée sont
celles d'avant ; une partie d'avant le lot n'a ni lieux vus (`etat.lieux` absent), ni lieux au monde (`monde.lieux`), ni bêtes.

### 25.1 Registre (contenu, `contenu/fouilles.mjs`)
```
objetsFouille: [{ cle, nom, ressource, par, convoite } | { cle, nom, equipement, repli: { ressource, par }, convoite }]
                                     // par objets pour une unité ; un équipement que le registre n'a pas encore compte en repli
genresFouille: [{ cle, nom, description, batiments, gestes, travail (quarts-personne), nombre: { base, parPopulation }, route?,
                  lots: [{ objet, q: [min, max], chance, risque? }], betes: [{ bete, chance }],
                  demontage: { rend: { materiaux, pieces }, travail, bruit } | null, culte? }]          // 24 genres
betesTrouvees: [{ cle, nom, description, nombre: [min, max], tient (quarts), viande, enclos: [installation], sansOutil: "file" | "pique" }]
gisements: [{ cle, nom, description, produits: [{ objet, q }], parQuart, repousse (jours), altitudeMax?, bruit, outils, renvoi? }]
milieux: [{ cle, nom, description, gisements: [{ gisement, part }] }]
regions[].milieux: [cle de milieu] ; sites[].genre (vide : un tunnel, une galerie), sites[].ecart (Boolean)
equipements[].capture: [cle de bête]  // cage, sac de goni, corde, enfumoir ; la corde de choka (lot « savoirs »)
```
`erreursFouilles(contenu)` vérifie tout (fabricant, essais) : objets, chances, quantités, bêtes, enclos, gisements, milieux, genres
des sites ; un lieu de culte ne rend rien de convoité hors l'eau.

### 25.2 Règles (logique pure, `logique/fouilles.mjs`)
- **Les lieux** : `lieuxDeLaRegion(contenu, region)` → `{ genre: nombre }` (base + parPopulation × population ; garages, stations et
  voitures seulement là où passe une route) ; `lieuxDuGenre` → `[{ cle: "<région>:<genre>:<n>", ecart }]` (les derniers à l'écart :
  0,15 + 0,17 × (5 − population)) ; `lieuDeCle` (aussi `site:<site>`) ; `choisirLieu` (une clé, un site, ou le prochain lieu d'un genre,
  à l'écart si demandé, ceux qu'on a commencés d'abord).
- **Le degré de pillage** : `degrePillage({ graine, lieu, regionDef, regMonde })` = `prisDeLaRegion` (la part perdue de la nourriture,
  de l'eau, des médicaments, des munitions et du carburant de la région) × (0,6 + 0,8 × `villeDuLieu`) ± 0,2 (flux « pillage|<clé> »)
  − 0,03 × infestation, borné 0..1 ; il ne redescend jamais (`visiterLieu`). `motDuPillage` → `MOTS_PILLAGE` (`intact`, `a-peine`,
  `deja`, `retourne`, `sac` ; seuils 0,15 / 0,4 / 0,65 / 0,85).
- **Le contenu** : tiré à la première visite (flux « lieu|<clé> », `tirerLotsDuLieu` : chance + risque × `palierDeRisque`) ; le
  pillage (`pillerLots`, de d0 à d1) emporte le convoité à 1,1 × degré (au plus 0,9), le reste à 0,5 × degré, et entame un lot resté ;
  au moins un lot reste (`lotGaranti`), et un lieu fouillé jusqu'au bout rend au moins une unité. `convertirObjets` → `{ butin,
  equipements, garantis }`.
- **Fouiller un lieu** : `fouillerLieu(monde, contenu, hasard, { region, lieu, site, genre, ecart, membres, quarts, prudence, jour,
  equipements })` → `{ ok, motif, monde, cle, lieu (public : lieuPublic), trouve: [{ objet, q }], butin, equipements: [{ cle, n }], bete,
  culte, travail, bruit }`. Le travail fait (membres × quarts × allure 0,6 / 1 / 1,5) prend sa part du lieu ; le butin pillable vient
  des réserves de la région (`monde.regions[r].pillage`) ; un lieu fouillé jusqu'au bout est `fini`. Refus : `lieu-genre-inconnu`,
  `lieu-aucun`, `lieu-ailleurs`, `lieu-demonte-deja`, `lieu-fini`.
- **Les bêtes** : `tirerBeteDuLieu` (une au plus) × (1 − degré)² ; `prendBete(contenu, equipements, bete)` ; issue `prise`, `file` ou
  `pique` (l'essaim reste). État public `groupe.betes: [{ id, cle, nombre, prisLe, jusqua, enclos, abri }]` : `ajouterBete`,
  `expirerBetes` (la viande), `enclore` (une installation de `enclos` en service ; refus `bete-sans-enclos`), `retirerBete` (abattre ou
  relâcher), `betesDuGroupe`.
- **Démonter** : `demonterLieu(…)` (un lieu pas fini se fouille d'abord ; `demontage.rend` au prorata du travail, deux fois plus lent
  sans un outil de `REGLES_FOUILLES.demontage.outils` ; refus `lieu-indemontable`, `lieu-site`) ; `demontageInstallation(instance, def)`
  → `{ rend, travail }` (la moitié des coûts des niveaux faits, `ile` en matériaux ; un tiers du travail).
- **Récolter** : `gisementsDeRegion`, `gisementsDisponibles(monde, contenu, region, jour)`, `recolterGisement(…, { gisement, membres,
  quarts, jour, dateDepart, equipements })` (`parQuart` gisements par quart-personne, la moitié sans outil ; retour après `repousse` jours,
  ÷ 0,4 en saison sèche ; `monde.gisements[région][gisement] = [jour de retour]`) ; `recoltable` ; refus `gisement-aucun`,
  `gisement-renvoi` (zerbaz, jardins, eau, décombres, sel : ils se prennent autrement), `gisement-epuise`, `gisement-rien`.

### 25.3 Branchements
- `fouiller(…, { cible: "lieu" | "demonter" | "matieres", genre, ecart, lieu, gisement, equipements, dateDepart })` : même forme de
  résultat, plus `{ ok, motif, lieu, cleLieu, trouve, equipements, bete, culte, rendu, gisement }` ; un refus (`ok: false`) ne change
  rien et ne tire pas de rencontre. Fouiller un lieu, c'est fouiller la région : le glanage de passage et la trousse oubliée (§2.3) y
  viennent aussi (`glane`, `trousse`) ; le bruit d'un démontage entre dans la rencontre (celui d'une fouille va à l'abri, comme avant).
  « lieu » et « demonter » comptent comme une fouille (`fouille: true`), « matieres » non. Faits : `fouille-lieu`, `demontage-lieu`, `lieu-demonte`, `recolte`,
  `bete-prise`, `bete-file`, `bete-pique` (publics) ; `fouille-culte` (secret : un lieu de culte, au MJ de juger).
- `avancer` : une bête hors d'un enclos dont le délai est passé meurt ; sa viande va à l'abri (le groupe y est) ou à `groupe.porte` ;
  fait `bete-morte`.
- `ACTES_MORAUX["prendre-au-culte"]` = −1 (le même pour tous ; jamais d'après la religion ni l'origine).

### 25.4 État, API et fenêtres
- État public : `lieux: { clé: { region, genre, n, ecart, site, mot, fait, travail, fini, demonte, demontage, vuLe } }` (jamais le degré
  ni ce qui reste dedans), `groupe.betes`. Secret (monde scellé) : `monde.lieux` (degré, lots restants, bête), `monde.gisements`.
- `fouiller({ cible, genre, ecart, lieu, gisement, site })` : les objets trouvés sont créés sur le premier fouilleur ; une bête prise va
  au groupe, l'essaim pique le premier fouilleur (une blessure) ; le rappel d'un lieu de culte va au journal secret ; le résultat porte
  en plus `lieu`, `trouve`, `objets`, `bete`, `culte`, `gisement`. Lecture : `lieux({ region })` (les genres, les lieux vus ; au MJ, le
  degré réel), `gisements({ region })` (milieux, gisements ; au MJ, ce qui est disponible), `betes()`. Écriture (MJ actif, monde ouvert) :
  `enclore({ id })`, `abattre({ id })`, `relacher({ id })`, `demonter({ installationId, membres })` (le temps passe : ⌈travail ÷ bras⌉
  quarts ; le plan reste au carnet).
- Équipement (§3.4) : `capture: [clé de bête]` (`gmOnlyFields`).
- Fenêtre du MJ, onglet Actions : cibles « Un lieu », « Démonter un lieu », « Matières de l'île », le genre de lieu de la région, « à
  l'écart », le gisement ; formulaires « Démonter une installation » et « Les bêtes prises » (mettre à l'enclos, abattre, relâcher).
- Contenu : 95 objets, 24 genres, 6 bêtes, 16 gisements, 11 milieux ; équipements `corde`, `sac-de-goni`, `cage`, `enfumoir` et trois
  recettes ; 37 tables (« Fouille — … » par genre, « Récolte — … » par milieu, ce qu'on lit en arrivant, une bête dans la cour) ;
  journal du MJ « Fouiller, démonter, récolter » ; page « Fouiller, démonter, récolter » du guide du joueur.
- Simulateur (`essais/outils/simuler-parties.mjs`) : il fouille des lieux quand sa région est maigre, récolte et démonte quand le bois
  manque à l'enraciné ; `--sans-lieux` rejoue la fouille d'avant le lot.
