# Équilibre du lot « sens » (2026-11-17)

Lot 2 de l'inventaire du jeu 3D (`images-essais/INVENTAIRE-3D-POUR-FVTT.md`) : la famille 4 « Percevoir dans le noir » et la
famille 11 « La voix de l'île », traduites pour un jeu de table. Ce fichier donne les chiffres retenus et leurs raisons ; la règle
est dans le contrat (`docs/survie-contrat.md` §18) et dans la logique (`systems/lakour-survie/logique/sens.mjs`, avec des crochets
dans `abri.mjs`, `monde.mjs`, `actions.mjs` et `etat.mjs`). Rien n'est retiré ni renommé : une partie en cours continue (champs
nouveaux à valeur par défaut, tirages d'avant gardés quand rien de neuf n'entre en jeu).

**Laissé de côté (temps réel, propre au jeu vidéo)** : l'écholocalisation affichée, les indices envoyés deux fois par seconde, les
couleurs de la « vision » dans le noir, les états d'éveil suivis Livide par Livide, la nuée, le roulèr qui bat quand on est repéré,
les délais en secondes. Ils deviennent ce qu'une table sait faire : des mots pour le MJ, des dés, un journal.

## 1. La pluie par région (microclimats)

**Règle** : à chaque quart, il pleut avec la chance `0,30 × (mm / 1 500)^0,8` en saison des pluies, `0,10 × …` en saison sèche,
bornée de 2 % à 90 % (repris tel quel du 3D, `climat::chance_de_pluie`). Les mm d'une année sont ceux du 3D, Bas puis Hauts
(au-dessus de 1 200 m), portés au registre (`regions[].climat.pluieAn`) ; une région prend la valeur de son altitude, entre les
deux. Le temps vient de la mer : 65 % du tirage est commun à l'île (un tirage de l'île choisi avec 65 % de chances, sinon celui de
la région ; chaque marge reste uniforme, la chance annoncée est la vraie). Une intempérie en cours (fortes pluies, crue,
éboulement, cyclone) : il pleut.

Mesuré (5 graines, 120 jours de chaque saison) : Saint-Paul 600 mm, il pleut 15 % des quarts en saison des pluies et 4 % en saison
sèche ; Saint-Denis 1 775 mm, 34 % et 11 % ; l'Est 3 940 mm, 65 % et 21 % ; Cilaos 2 500 mm, 49 % et 15 % ; Salazie 4 500 mm, 73 % et
23 % ; la Plaine des Palmistes 5 750 mm, 88 % et 29 % ; la Fournaise 6 000 mm, 91 % et 30 %. Ce sont les ordres de grandeur du 3D,
« à vérifier sur les normales de Météo-France » : ils restent des chiffres de jeu.

**Ce que la pluie change** (et seulement cela, pour ne pas toucher à l'équilibre des récoltes) :
- dehors, pluie ou brume : **vigilance −1, discrétion +1** (le 3D : la pluie ôte 60 % à l'ouïe et la moitié de la vue ; un dé est
  l'unité de la table). Les deux ne se cumulent pas ;
- un quart de nuit où il pleut a le **ciel couvert** (la lune cachée : `cielDe`) ;
- l'**odeur** de l'abri baisse d'un point les jours où il pleut la moitié du temps ;
- les **ravines** (§2).

**Écarté** : faire suivre la citerne et le potager à la pluie du jour. `climat.pluie` en tient déjà compte en moyenne (production
× pluie × saison) ; la pluie du jour n'ajouterait que du hasard à des bilans déjà réglés (`docs/equilibre.md`). Point laissé à
Jordan.

## 2. Les ravines

**Règle** (repris du 3D, `EAU_QUI_RESTE`, `EAU_QUI_FAIT_COULER`) : l'eau des Hauts d'une région est la pluie de ses Hauts sur les
8 quarts d'avant, chacun comptant moitié moins que le suivant (0 à 1). Une ravine **temporaire** coule au-dessus de 0,15 ; une
**permanente** est **basse** en saison sèche sous 0,05 (deux jours sans pluie là-haut) ; une intempérie en cours la met **en crue**.

**Effets, par quart puis en moyenne sur le jour** :

| État | Pico-hydro | Eau du site et captage sur la rivière | Pourquoi |
|---|---|---|---|
| à sec | × 0 | × 0,25 | les vasques qui restent : un abri ne meurt pas de soif d'un coup |
| basse | × 0,75 | × 1 | le débit d'étiage (le 3D : 0,5) ; 12 d'eau par jour restent largement assez |
| coule | × 1 | × 1 | comme avant |
| en crue | × 0 | × 1 | on ferme la prise d'eau ; la crue coupe déjà les radiers (routes) |

**Une seule ravine temporaire** dans le contenu : la Grande Chaloupe, dont la fiche disait déjà « la ravine est sèche en saison
sèche ». Les six autres sites à rivière (Langevin, Rivière de l'Est, Bois-Rouge, le Gol, Marla) sont permanents, comme dans l'île.

Mesuré : la Grande Chaloupe est à sec 22 % des jours en saison des pluies (pico-hydro × 0,81 en moyenne, eau × 0,86) et 83 % en
saison sèche (pico-hydro × 0,31, eau × 0,48 : 6 d'eau par jour au lieu de 12). La Langevin, permanente : pico-hydro × 1 en saison
des pluies (hors crues), × 0,93 en saison sèche. La voie d'autonomie « La vallée de la Langevin » reste donc à l'équilibre.

## 3. La brume et le vent

- **Brume** au-dessus de **1 000 m**, l'après-midi et le soir (le 3D : de 13 h à 20 h, au-dessus de 1 000 m). Elle compte comme la
  pluie dehors. Le Tampon, la Plaine des Palmistes, Cilaos, Mafate, les Hauts de l'Ouest et la Fournaise l'ont ; Salazie (900 m)
  non : c'est l'altitude moyenne de la région qui compte.
- **Vent** : un par quart, pour toute l'île (le 3D : « tiré de la graine et du quart »), cap vers l'ouest-nord-ouest ± 50°, force
  0,25 à 0,55 en saison sèche, 0,05 à 0,40 en saison des pluies, × 0,6 le soir et la nuit. Il ne fait rien aux dés : il dit de quel
  côté l'abri « sent » et sert au MJ (approcher un Livide au vent ou sous le vent, §6). Mots : calme (< 0,15), brise (< 0,35), vent.

## 4. L'odeur de l'abri

**Échelle 0 à 4**, comme un palier : ce qui sent **au-delà d'un groupe ordinaire**. Un abri ordinaire est à 0, si bien que
l'équilibre des menaces (`docs/survie-equilibrage.md`) ne bouge pas pour lui.

- **Installations** (`effets.odeur`, deux points au plus) : cuisine commune au feu de bois (cuisine 80 m, feu 120 m dans le 3D),
  séchoir et fumoir, basse-cour, enclos à cabris. La gazinière n'a pas d'odeur : elle cuit sans fumée, et c'est sa sœur moderne ;
  quand le gaz manque, la cuisine commune prend le relais, et l'abri se met à sentir.
- **Souillure** : un point quand l'abri est surpeuplé (en attendant l'insalubrité du lot 1, qui pourra passer
  `conditions.souillure`).
- **Sang** : un point quand le MJ le dit (`conditions.sang`).
- **Hauts** (≥ 400 m) : −1 (le 3D : × 0,35). **Pluie** la moitié du jour ou plus : −1 (le 3D : −60 %).

**Ce qu'elle fait** : chaque point ajoute **2 %** par jour à la horde de la région (comme la visibilité) et **1 %** aux Livides
errants. Les **bêtes** (chiens errants) sentent aussi les **morts sans repos** près de l'abri depuis moins de 15 jours (un point
de plus pour elles) : chaque point ajoute **0,5 %** par jour. Les Livides ignorent l'odeur d'un corps (le 3D : « les Livides
l'ignorent ; elle ne sert qu'au nez du survivant »).

Mesuré (Saint-Paul, visibilité 3, bruit 1, 300 jours, 5 graines), menaces par mois : odeur 0 : horde 0,38, errants 1,24,
chiens 0,52 ; odeur 2 (cuisine commune et basse-cour) : 0,52, 1,52, 0,88 ; odeur 4 : 0,68, 1,92, 1,18. Un premier essai à 1 % par
point pour les chiens doublait leurs visites à odeur 2 (1,18 par mois) : ramené à 0,5 %.

Une odeur nulle ne change aucun tirage (le même nombre de tirages, les mêmes seuils) : un monde d'avant le lot donne les mêmes
menaces.

## 5. S'habituer au noir

- **Paliers après 2, 6, 14 et 30 nuits** (le 3D, tels quels). Une nuit compte quand on est **debout dans le noir** au quart de
  nuit : en route, ou de garde (tâche « garde » ou `veille`) à un abri qui n'est pas éclairé (veillée à la lumière du jour, lueur
  d'une fête, `avancer({ lumiere: true })`). Une seule par nuit. Dormir ne compte pas (le 3D : « debout, sans lumière sur soi ni à
  moins de 15 m »).
- **Ce que donnent les paliers** : la direction (et la Timise reconnue) ; la distance et **+1 dé en vigilance la nuit dehors** ;
  ce qui marche (le MJ le dit ; le système l'écrit pour une horde) ; l'écoute active (**+1 dé de plus, et un bruit**).
- **Pourquoi un seul dé avant l'écoute active** : la nuit noire ôte un dé à tout (`lune.mjs`). « Chaque palier donne un dé
  jusqu'à compenser la nuit noire » ne pouvait donc donner qu'un dé : on le place au palier 2 (six nuits, une semaine de garde),
  et l'on fait des autres paliers ce qu'ils sont dans le 3D, des informations. La nuit et l'habitude ensemble ne dépassent
  jamais +1 (en pleine lumière, la nuit donne déjà +1).
- **Allumer** : un palier de moins jusqu'à la fin de la nuit (deux quarts), et la nuit ne compte pas (le 3D : 0,5 h de jeu ; un
  quart en fait six).
- **Fermer les yeux** : +1 dé en vigilance (le 3D : ouïe × 1,6), rien d'autre ce tour-là. Réservé au MJ (le joueur le demande).

Mesuré : une garde chaque nuit atteint le palier 2 en six jours, le palier 4 en un mois.

## 6. Les Livides

- **Sens par sorte** (`bestiaire[].perception`, du 3D) : frais vue 0,6 ; des Hauts vue 0,3, sans odorat, figé par le froid la
  nuit au-dessus de 400 m ; noyé vue 0,2 ; brûlé aveugle, ouïe 1,2 ; coureur vue 1, deux attaques. Les textes `sens` du bestiaire
  sont mis d'accord (le noyé, le brûlé et le coureur sentent ; la faiblesse du brûlé dit qu'il suit aussi l'odeur).
- **Approcher ou fuir** (`desFaceALivide`) : en dés de discrétion, bornés à ±2 : +1 s'il voit mal de jour, ±1 contre un aveugle
  selon le bruit, −1 contre le coureur, −1 de plus contre une ouïe fine si l'on fait du bruit, −1 si le vent lui porte votre
  odeur, +1 au vent de lui, +2 s'il est figé par le froid.
- **Les cinq états** (figé, errant, intrigué, en poursuite, acharné) et la règle « percevoir n'est pas voir » restent des mots
  pour le MJ : le système ne suit pas chaque Livide.
- **Les corps** : frais jusqu'à 20 jours d'âge dans les Bas, desséchés jusqu'à 60, puis en lambeaux ; dans les Hauts, frais 45 jours
  puis desséchés, jamais en lambeaux. L'âge compte depuis le jour 10 (la plupart se sont relevés dans les trois premières semaines).
  Description seulement : la vitesse (1 ; 0,8 ; 0,55) est un mot pour le MJ ; la décroissance des Bas est déjà dans l'infestation.
- **Une rue nettoyée se repeuple de 7 % par jour** (le 3D) : `facteurNettoyage` multiplie les rencontres d'une fouille au même
  lieu par `1 − 0,75 × min(1, tenus / 20)`, où `tenus` = les Livides abattus × 0,93 par jour écoulé. Vingt abattus : 0,25 le jour
  même, 0,75 au bout de deux semaines, 0,92 au bout d'un mois. Le plancher de 0,25 laisse toujours une chance de rencontre (un
  vivant, un errant qui passe).

## 7. Les signes de la nuit

- **Les grenouilles se taisent** quand une horde entre dans la région du groupe : un fait public et une alerte, **une fois par
  horde** (les identifiants restent au monde secret, `monde.silences`). Celui qui a le palier 3 entend aussi les pas.
- **La Timise** : chance par nuit selon la zone (littoral 1 %, Hauts et forêt 3 %, cirque 3,5 %, volcan 2 %), × 1 + 0,5 par mois
  après le jour 60, au plus × 3 (l'île éteinte rend la nuit aux pétrels). Mesuré dans un cirque : 30 nuits la première année, 38 la
  deuxième. Un premier réglage (6 % dans un cirque) donnait une nuit sur six : trop pour le journal.
- **Les faux bruits** du moral bas (`esprit.mjs`) restent tels quels ; les tables de la nuit (« ce qu'on entend », « les signes »)
  s'y mêlent.

## 8. La musique

- **Veillée en musique** (`jouer`) : +1 moral à tout le groupe, **au plus une fois par semaine** (une petite fête : les fêtes
  donnent +1 à un coût ; une veillée chaque soir aurait tenu le moral au plafond pour rien), et du bruit à l'abri : +1 (un air tout
  bas, palier 2, 30 m), +3 (à pleine voix avec le roulèr, palier 3, 90 m : « le séga s'entend de loin, donc il attire »).
- **L'ancrage « instrument »** (pratiquant) : +1 au bruit de l'abri, chaque quart où il est présent, le plus fort des musiciens et
  non la somme. Raison : le texte de l'ancrage le disait déjà (« le bruit attire, il le sait ; il joue quand même ») ; un point de
  bruit permanent ajoute 4 % à la horde et un dixième aux errants, comme un poulailler.
- **Les moments de musique** et la **voix des régions** sont des indices pour le narrateur (MJ humain ou MJ IA) : rien dans les
  règles.

## 9. Ce qui ne change pas

Les paliers de bruit et de visibilité, les menaces d'un abri sans odeur, les récoltes, les fouilles d'un lieu jamais nettoyé, la
nuit et la chaleur (`lune.mjs`), les faux bruits : tels qu'avant le lot. Le tirage de la simulation du monde (`hasardDuJour`) n'est
pas touché : la pluie, le vent et la Timise ont leurs propres flux (« pluie|quart|région », « vent|quart », « timise|jour »).
