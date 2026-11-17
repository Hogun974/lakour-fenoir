# Équilibre du lot « Bâtir et défendre » (2026-11-17)

Lot 7 de l'inventaire du jeu 3D (`images-essais/INVENTAIRE-3D-POUR-FVTT.md`) : les matériaux, l'entretien, les défenses « comme les
anciens châteaux, avec les moyens du bord », les Livides devant un abri, les ouvrages de tous les jours, l'énergie et l'eau en plus,
la cave qui s'éboule. Ce fichier donne les chiffres retenus, leurs raisons et les mesures ; la règle est dans le contrat
(`docs/survie-contrat.md` §26) et dans la logique (`systems/lakour-survie/logique/ouvrages.mjs`, avec des crochets dans `abri.mjs` et
`etat.mjs`). Rien n'est retiré ni renommé ; les chiffres de production, de défense et de coût des installations d'avant ne bougent
pas.

**Laissé de côté (physique, temps réel, serveur)** : les pièces de 2 m × 2,5 m, la solidité en points, la tenue au sol, la statique
et l'effondrement, les câbles et les tuyaux posés point par point (et donc le tableau électrique, la prise, le robinet, la rigole de
bambou : un réseau physique), la perte en ligne, l'inspection des liaisons enterrées, les secondes de retenue d'une fosse, la portée
d'une cloche en mètres, le coffre et l'armoire à outils (des places d'objets : FVTT ne range pas les objets à l'abri), la nature du sol
(terre, caillou, roche : le travail ×1,6 et ×3 du 3D ; FVTT a déjà le `souterrain` du site et ses coûts), la limite de trois niveaux
de cave (la galerie de FVTT en a déjà quatre, contrat §3.2).

**Doublons écartés** (déjà dans FVTT) : la gouttière de bambou (`citerne-lontan`), le tuyau de bambou (`conduite-de-bambou`), le
garde-manger et le grenier sur pilotis (`garde-manger-lontan`, dont la description est déjà « un grenier sur pilotis »), la cuisinière
à gaz (`gaziniere`), le chauffe-eau posé (`eau-chaude-solaire`), la ruche en tronc (`ruches-en-tronc`), l'étagère aux cahiers (lot 4),
les latrines, le lavoir et la douche (lot « corps »), le rang de pieux (`palissade-de-bambou`), l'éolienne petite (l'éolienne de
récupération de FVTT est déjà « la plus petite source de courant »). **Laissés aux autres lots** : le clapier, la soue, l'étable, le
bassin à camarons, l'aquaponie, les bacs et la serre hydroponiques, le jardin de zerbaz, la treille à chouchou, la bananeraie, le carreau
de canne (lot 8) ; les ateliers par métier, les transports et leur charge (lot 6) ; démonter (lot 5) ; la haie replantée pour cacher
l'abri (lot 9 : le mécanisme `pousse` de ce lot est prêt pour elle).

## 1. Les matériaux

| Famille | Cyclone | Feu | Pluie | Livides | Chance par point de cyclone (× 0,5) |
|---|---|---|---|---|---|
| Paille et torchis | 0,9 | 1 | 0,6 | 0,7 | 45 % |
| Bambou et vacoa | 0,7 | 0,9 | 0,4 | 0,6 | 35 % |
| Bois sous tôle | 0,5 | 0,8 | 0,2 | 0,4 | **25 % (la chance d'avant)** |
| Tôle de récupération | 0,8 | 0,1 | 0,3 | 0,5 | 40 % |
| Pierre sèche | 0,2 | 0 | 0,1 | 0,1 | 10 % |
| Parpaing et béton | 0,05 | 0 | 0 | 0,05 | 2,5 % |

Les parts sont celles du jeu 3D (« Bâtir par pièces »). **Pourquoi × 0,5** : le cyclone de FVTT donnait 25 % par point de dégâts à
toute installation exposée ; le bois sous tôle, la case ordinaire, garde exactement ce chiffre, et une installation sans matériau dit
aussi. Les installations d'avant ont reçu le matériau du 3D (`OUVRAGES_EXISTANTS`) : la citerne et les panneaux en tôle (plus
fragiles au vent qu'avant), le captage, la pico-hydro et le mur en pierre (beaucoup moins), le potager en bambou. **L'exposition ne
change pas** (eau, nourriture, énergie, défense) sauf pour ce qui se dit `expose` : la paillote du boucan, la salle verte, la remise de
chaume, les claies, la touffe de bambous.

**Le feu** n'existait pas sur l'abri : `incendieAbri` (API `incendie`), au MJ. Chance par point de force = 0,5 × part au feu (paille
50 %, bois 40 %, tôle 5 %, pierre 0). Force 1 à 3 ; à 2 et plus, l'abri prend force − 1 dégâts. Aucun feu ne se tire seul : le MJ le
déclare (table « Le feu à l'abri — d'où il vient »), une bande peut le porter (porte.mjs a déjà sa rancune « feu »).

**La pluie use le torchis** : un jour où il pleut au moins la moitié du jour, l'entretien d'une installation dont la part à la pluie
atteint 0,6 (la paille et le torchis seulement) avance d'un jour. Dans l'Est, un boucan s'entretient donc à peu près tous les 20 jours
au lieu de 30. **La tôle qui claque sous la pluie** et **la tôle qui s'envole et blesse** sont dites au MJ (journal « Bâtir et
entretenir ») sans règle : à l'abri pendant un cyclone, on est dedans.

## 2. L'entretien

**Règle** : passé son délai sans soin, une installation perd un cran (le `FACTEUR_ETAT` d'avant : 100 %, 75 %, 50 %, hors service ;
le 3D fait de même : « un point perdu par délai d'entretien dépassé »). Celles qui s'encrassent ne perdent pas d'état : elles
produisent moins, ou plus du tout, jusqu'au nettoyage. Un soin rattrape un cran perdu faute de soin, pas une casse.

| Installation | Tous les (jours) | Travail | Autre | Le 3D |
|---|---|---|---|---|
| Palissade, antenne, chemin de ronde, portail de bois dur | 90 | 1 quart | | 90 j, 3 à 6 coups |
| Citerne, captage, chauffe-eau solaire, galerie et tunnel (2 quarts) | 60 | 1 | | 60 j, 4 à 6 coups |
| Fossé, camouflage, réserve, bouilleur, garde-manger, boucan, claies, chausse-trapes | 30 | 1 | | 30 j |
| Compost | 15 | 1 | | 15 j |
| Gouttières de bambou 20, conduite de bambou 15, palissade de bambou 60 | | 1 | | 15 à 20 j |
| Panneaux solaires | 12 | 1 | encrassés : × 0,5, lavés par la pluie ; panne 0,4 %/j | sales en 12 j, −50 %, la pluie lave |
| Pico-hydro | 8 | 1 | encrassée : s'arrête ; panne 0,4 %/j | 8 j, s'arrête |
| Roue à aubes | 6 | 1 | s'arrête ; panne 0,6 %/j | 6 j |
| Pompe électrique | 10 | 1 | s'arrête ; panne 0,6 %/j | 10 j |
| Groupe électrogène | 30 | 1 | panne 1 %/j | 1 % |
| Éolienne | 30 | 1 | panne 0,6 %/j | 0,6 % |
| Batteries | 90 | 1 | panne 0,2 %/j ; un cran tous les 400 jours | 400 cycles, 0,2 % |
| Éclairage électrique | 90 | 1 | panne 1 %/j | 1 % |

**Un quart de soin** : le 3D compte en coups (2 à 6) ; un quart de FVTT (six heures) fait 5 coups environ (la palissade : 60 coups ↔
12 quarts). Un soin d'un quart est donc généreux ; il reste un vrai temps de la journée de quelqu'un.

**Qui soigne** : ceux qui sont à la tâche de l'installation (ses bras), sinon ceux qui sont **au chantier**, à l'abri, un quart chacun
par jour, au plus en retard d'abord ; ou à la demande (`entretenir`). **Pourquoi les installations à bras n'ont pas d'entretien à
part** (potager, filtre, pompe à bras, élevages, atelier, infirmerie, tour, séchoir) : ceux qui y travaillent la tiennent, et sans eux
elle produit déjà moitié moins (§10.3) ; une seconde peine aurait compté deux fois le même oubli. **Pourquoi l'hygiène n'en a pas** :
le ménage (lot « corps ») et la souillure font déjà ce travail.

**Les pannes** se tirent dans un flux de hasard à part (« ouvrages|jour ») : aucun autre tirage de la partie ne bouge. **Une partie
d'avant le lot** : le délai part du premier jour où le système voit l'installation, rien ne casse d'un coup.

## 3. Les défenses et les Livides devant l'abri

| Ouvrage | Coût | Effet | Le 3D |
|---|---|---|---|
| Haie de choka (lontan, sœur des barricades) | 2 île, 4 quarts | défense 1 **après 180 jours** ; regarnit le bois des alentours (0,2/j) | fermée en 180 j, de la fibre |
| Chausse-trapes (lontan, sœur du fossé) | 2 île, 4 quarts | piège 1 | 20 % de blesser |
| Fossé et pièges (d'avant) | inchangé | défense 1 puis 2 (inchangée), **+ piège 1 puis 2** | fosse 35 %, se comble à 5 par niveau |
| Douves (rivière ou source) | 2 matériaux, 30 quarts | défense 1, piège 2 | |
| Cloche d'alarme (lontan) | 1 matériau, 1 île, 2 quarts | vigilance +1 ; sonnée : bruit +2 | bruit 4, alerte et attire |
| Herse (moderne) / portail de bois dur (lontan) | 6 mat. 2 pièces 10 q / 5 île 12 q | défense 1, **porte** | « une porte fermée se frappe » |
| Passerelle relevée (sur le fossé) | 3 île, 6 quarts | défense 1, porte | |
| Porte blindée (d'avant) | inchangée | défense 1 (inchangée), **porte** | |
| Chemin de ronde (sur la palissade) | 4 matériaux, 8 quarts | défense 1, **hauteur** | un défenseur seul y tient cinq Livides |
| Meurtrière de basalte (pierre sèche) | 6 quarts | défense 1, tir +1 à l'abri | |
| Enceintes de palettes / d'épaves (sœurs de la palissade) | 4 mat. 6 q / 3 mat. 20 q | défense 1 / 2, visibilité 2 / 3 | |

**La double enceinte** du 3D existe déjà : la palissade et le mur (deux rôles) s'additionnent ; les enceintes de palettes et
d'épaves, sœurs de la palissade, la remplacent quand elle manque ou tombe, sans s'y ajouter.

**Les pièges** ôtent leur force à celle d'un assaut de Livides, jamais sous 1 : un dé de menace de moins vaut, en espérance, un dé de
défense de plus (un tiers de succès). **La fosse se comble** au-delà de quatre fois sa force (« cinq Livides par niveau » du 3D, une
force de FVTT valant un peu plus d'un Livide) : elle prend un cran d'état, à vider. **Les vivants voient les pièges** (la description
du fossé le disait déjà) : contre une bande ou des chiens, rien.

**La hauteur** (décision de Jordan du 16 novembre : un Livide ne monte pas à l'échelle, un vivant à plus de 2 m n'est plus frappé) :
devant des Livides, avec un garde présent et un chemin de ronde qui n'est pas hors service, une brèche devient « endommagée », sans
blessé ; c'est le chemin de ronde qui prend le coup (ses appuis). Il ne change rien d'autre : la marge, les dégâts ordinaires, la
défense restent ceux d'avant. **Le chemin de ronde n'est donné qu'à l'ouvrage nouveau** : la tour de guet et le mur d'avant le
mériteraient aussi (le mur a « un chemin de ronde » dans sa description), mais cela aurait changé l'équilibre des abris qui les ont
déjà ; point laissé à Jordan.

**La porte et l'enceinte** : quand un assaut de Livides tenus dehors (l'issue « endommagée ») abîme une installation, c'est la porte
(elle se frappe toujours), sinon une installation de défense, plus souvent la plus fragile (le tirage est pondéré par la part aux
Livides), sinon n'importe laquelle, plus souvent ce qui est fragile. **Une fois entrés** (une brèche), ils cassent ce qui est dedans :
n'importe quelle installation, plus souvent la plus fragile. Avant le lot, le coup tombait au hasard sur n'importe quelle installation :
le potager et la citerne prenaient les coups de l'enceinte. Contre des vivants ou des bêtes, toujours au hasard.

**Pourquoi la brèche frappe dedans** : une brèche, c'est qu'ils sont entrés ; ils cassent ce qu'ils trouvent, pas la clôture qu'ils
viennent de passer. Mesuré (graine 1, 300 parties), viser l'enceinte ou viser au hasard comme avant donne le même nombre de brèches
(enraciné seul : 1,56 et 1,55 par partie ; à quatre : 1,79 et 1,75) : la règle ne change pas l'équilibre, elle protège seulement les
cultures et l'eau des coups portés dehors. Le simulateur répare l'enceinte avant le reste (un groupe raisonnable rebouche le trou par
où ils frappent).

## 4. Les ouvrages de tous les jours, l'eau et l'énergie

| Ouvrage | Coût | Effet | Raison |
|---|---|---|---|
| Puits creusé (lontan, site sans eau, à citerne ou au réseau, de la terre) | 2 île, 24 quarts ; niveau 2 : pierre sèche, 10 q | eau 2 puis 3 (bras : eau) | le 3D 3 puis 5 : moins, parce qu'un puits rend l'eau sûre partout, toute l'année, sans pluie ni pièce |
| Bassin de pierre / cuve en hauteur (sœurs) | 2 île 10 q / 4 mat. 1 pièce 12 q | eau gardée 40 puis 80 / 60 et moral +1 | le 3D |
| Jarres filtrantes (sœur du filtre) | 1 île, 3 quarts | eau 1 | le 3D ; le filtre en donne 2 |
| Pompe électrique (sœur de la pompe à bras, passe d'abord) | 2 mat. 3 pièces 6 q | eau 6, prend 1 énergie, s'encrasse en 10 j | le 3D (6 eau, 1 énergie) ; sans courant, la pompe à bras reprend |
| Foyer à trois roches (sœur de la cuisine) | 1 île, 1 quart | moral 1, visibilité 2 | le 3D |
| Four à pain (lontan) | 3 île, 12 quarts | moral 1, visibilité 1 | le 3D ; le pain des fêtes reste au MJ |
| Boucan (sœur du séchoir) | 4 île, 6 quarts | conservation, visibilité 1 | le 3D (40 coups, 8 quarts, « se voit +2 ») ; 6 quarts et visibilité 1 comme le séchoir qu'il remplace : la conservation sans matériaux fouillés |
| Claies de séchage | 1 île, 2 quarts | plantes gardées +12 | le 3D (20) ; la base des plantes est 12 |
| Cellier de pierre (sœur de la réserve) | 2 île, 16 quarts | conservation, nourriture gardée +40 | le 3D (80 coups) |
| Râtelier à bois / abri à matériaux | 1 île 2 q, puis 1 mat. 6 q / 3 mat. 10 q | matériaux gardés +10, +25 / +40 | le 3D (abri à matériaux 40) |
| Four à chaux (maçonnerie) | 4 île, 12 quarts | matériaux 0,25 par jour (bras : atelier) | la chaux du 3D (recette à plan) devient un four : le mortier sans ciment |
| Paillasses / lits de bois (sœurs du dortoir) | 1 puis 2 île / 2 mat. 4 q | couchages 2 puis 4 / 2 et moral 1 | sœurs : le moral ne s'additionne pas à celui du dortoir, les couchages si |
| Grande table, coin de prière | 3 mat. 6 q / 1 mat. 2 q | moral 1 | le 3D |
| Tableau des corvées | 1 mat., 1 quart | parole +1 à l'abri | le 3D |
| Salle verte (lontan) | 3 île, 6 quarts | moral 1, visibilité 1, `fete` 1 (lot 12) | le 3D |
| Lampes à huile / éclairage électrique (sœurs) | 1 île 1 q / 1 mat. 2 pièces 3 q | moral 1, visibilité 1 / 2, l'abri éclairé ; l'électrique vigilance +1 et 1 énergie | le 3D |
| Remises à charrettes / à vélos / à recharge | 4 île 9 q / 2 mat. 5 q / 2 mat. 4 pièces 12 q | places 3 / 6 / 2 (lot 6) ; la recharge prend 2 énergie | le 3D |
| Roue à aubes (rivière) | 3 mat. 2 pièces 12 q | énergie 2, s'encrasse en 6 j | le 3D |
| Digesteur à biogaz (enclos à cabris, plomberie) | 4 mat. 2 pièces 18 q ; niveau 2 : maçonnerie | **gaz** 0,5 puis 1 par jour, prend 1 eau | le 3D donnait 1 d'énergie ; l'inventaire demandait du gaz (la ressource du §13) : une gazinière en prend 1 |
| Touffe de bambous | 1 île, 3 quarts | bois des alentours +0,5 par jour, après 180 jours | le 3D (0,5 « matériaux » après 180 j) : ici des matières de l'île, ce qui sert aux lontan |

**La fumée du boucan** : avec la visibilité 2 du 3D, le boucan bâti tôt (avant le séchoir) faisait monter les visites des bandes
(leur chance croît avec la visibilité de l'abri, monde.mjs) et donc les brèches de l'enraciné (graine 1, 300 parties : seul 1,31 →
1,56 par partie, à quatre 1,55 → 1,79). À 1, comme le séchoir-fumoir : 1,42 et 1,66, dans le bruit.

**Pourquoi tant de « moral 1 »** : le plafond du moral est 3 + le confort de l'abri, au plus 5 ; au-delà de deux points de confort,
rien ne s'ajoute. Les sœurs (foyer, lampes, lits) ne s'additionnent pas à leur moderne.

**Le coin de prière** est commun à toutes les fois (l'inventaire le proposait ainsi) : +1 au moral, rien de propre à une religion
(décision de Jordan du 17 novembre : aucune religion n'a d'effet). L'observance « calme » du §14 se tient déjà à l'abri ; le coin de
prière n'y ajoute rien de mécanique, il donne un lieu à la scène.

## 5. La cave qui s'éboule

Le 3D : 25 % par cellule menacée, « à la fin du creusement et à chaque jour de jeu », une blessure qui ne tue pas, la cellule se
rebouche. La table : **25 % au moment d'achever un niveau** d'une installation souterraine **sans le savoir « étaiement et
galeries »**, plus 25 % sur un site à rivière (« on ne creuse pas près d'une eau qui court » : un risque, pas une interdiction, pour ne
fermer aucun site d'avant). Un éboulement : une blessure qui ne tue pas (au plus « grièvement blessé ») à l'un de ceux qui creusent, et
**la dernière cellule à recreuser** (6 quarts : une cellule du 3D, 30 coups) ; le niveau s'achève quand on l'a refaite (un nouveau
tirage). Le niveau 1 de la galerie ne demande aucun savoir : c'est là que le risque mord ; les niveaux suivants demandent déjà
l'étaiement. Une fois achevée, la cave est étayée (ses matériaux le paient) : le risque « à chaque jour de jeu » du 3D, qui tient à des
cellules creusées sans étai, n'a pas d'équivalent.

**Deux essais écartés** (graine 1, 300 parties). (1) Un tirage par jour de creusement, la moitié du chantier perdue : un enraciné à
quatre qui creusait sa cave sans savoir étayer prenait deux éboulements par partie, donc deux blessures (chaque éboulement rallongeait
le chantier, qui en attirait un autre). (2) Un tirage par jour, une cellule perdue : encore 1,9 éboulement par partie à quatre, 3,2 à
six, donc autant de blessés (et un blessé garde mal : la vigilance de la garde baisse avec ses blessures). Le simulateur avait aussi
essayé de ne pas creuser sans savoir étayer : la cave perdue (discrétion, protection du cyclone, conservation) coûtait autant. Le tirage
« à la fin du creusement » garde le risque sans en faire un piège : 0,1 éboulement par partie à quatre, 0,2 à six, et les vivants à
J200 de l'enraciné à quatre reviennent (83 → 86 %, même graine, le reste égal).

## 6. Ce que fait le simulateur

`essais/outils/simuler-parties.mjs`, comme un groupe raisonnable :

- **L'entretien** est celui de la logique (`avancer` : ceux qui sont au chantier ou à la tâche d'une installation la soignent ; ceux
  qui bâtissent ou réparent soignent donc en passant). Quand il n'y a rien à bâtir ni à réparer, qu'un entretien est dû et que personne
  n'est au chantier, un libre y passe un quart (`entretenirInstallation`) puis repart à sa journée. **Premier essai** : un libre mis au
  chantier pour toute la journée ; chez le solo, c'était une journée sans cueillir ni réparer, à chaque entretien.
- **Les réparations** : l'enceinte d'abord (les installations de défense), puis le reste ; une installation lontan abîmée se répare avec
  le bois des alentours (avant le lot, le simulateur la réparait sans rien prendre).
- **Un assaut de Livides** passe devant les ouvrages (`forceDevantOuvrages`, `issueDevantOuvrages`, `cibleDesDegats`), une cloche
  sonne ; un assaut de bande ou de bêtes comme avant.
- **Creuser** une galerie sans l'étaiement : l'éboulement se tire quand un niveau s'achève (flux « eboulement|jour »), une blessure qui
  ne tue pas à l'un de ceux qui creusent, la dernière cellule à recreuser.
- **Les remèdes** : toutes les deux semaines, un enraciné qui n'a plus aucun remède ni de quoi en faire envoie son meilleur en survie
  cueillir des zerbaz pour la journée, avant de bâtir (`REMEDES.cueilletteTousLes`). **Pourquoi** : avec les chantiers du lot, les
  jours d'abri avec un médicament du solo sédentaire (l'essai « le solo sédentaire cueille des zerbaz… », 32 parties de 120 jours)
  tombaient de 27,5 % à 18,7 %. Le boucan surtout : la réserve ne pourrit plus, le solo a moins faim, il passe ses journées au chantier
  et ne cueille plus en passant (sans le boucan : 24,7 %). Une cueillette tous les 7 jours donnait 36,8 %, tous les 10 jours 34,1 %,
  **tous les 14 jours 26,2 %** : retenu, le plus près d'avant.
- **L'ordre de construction** de l'enraciné (`ORDRE_ENRACINE`) prend les ouvrages lontan qui servent tôt : les **jarres filtrantes**
  après le filtre (si le filtre n'a pas pu se faire, faute de matériaux), le **puits creusé** là où le site n'a ni source, ni rivière, ni
  puits et seulement quand l'eau de l'abri ne suffit pas (après les barricades : des jours de pioche), le **boucan** juste après le premier potager (la conservation sans matériaux fouillés) ; la **réserve
  étanche** et le **séchoir** passent après la basse-cour et l'enclos (le boucan conserve déjà). Il ne bâtit pas une sœur lontan d'une
  installation qui tient déjà son rôle aussi bien ou mieux (les jarres quand le filtre est là ; les latrines sèches, meilleures que les
  feuillées, se bâtissent).

## 7. Les mesures

Même code de mesure des deux côtés : `node essais/outils/simuler-parties.mjs --parties 300 --graine <g>` (16 cas × 300 parties de
200 jours), joué sur `vague2` (commit 98790e2, **avant** le lot) et sur `lots-batir` (**après**), **graines 1 et 2** (9 600 parties
de chaque côté). Dans chaque case : graine 1 · graine 2 (moyenne).

| Cas | Vivants à J200, avant | après | Autonomes, avant | après | 1re faim, avant | après | Fins par départ (%), avant | après |
|---|---|---|---|---|---|---|---|---|
| passif × 1 | 13 · 15 (14,0) | 9 · 11 (10,0) | 37 · 36 | 37 · 36 | J17 · J17 | J17 · J17 | 0 · 1 | 0 · 1 |
| passif × 2 | 13 · 14 (13,5) | 10 · 11 (10,5) | 31 · 34 | 31 · 34 | J10 · J10 | J10 · J10 | 0 · 0 | 0 · 1 |
| passif × 4 | 12 · 13 (12,5) | 9 · 11 (10,0) | 28 · 29 | 28 · 29 | J7 · J7 | J7 · J7 | 0 · 0 | 0 · 0 |
| passif × 6 | 11 · 11 (11,0) | 9 · 8 (8,5) | 21 · 22 | 20 · 22 | J5 · J5 | J5 · J5 | 0 · 0 | 0 · 0 |
| nomade × 1 | 56 · 56 (56,0) | 54 · 54 (54,0) | 1 · 2 | 1 · 2 | J189 · J200 | J200 · J200 | 1 · 2 | 2 · 2 |
| nomade × 2 | 72 · 74 (73,0) | 71 · 71 (71,0) | 1 · 1 | 1 · 1 | J64 · J70 | J65 · J88 | 4 · 4 | 4 · 5 |
| nomade × 4 | 78 · 85 (81,5) | 78 · 83 (80,5) | 3 · 4 | 3 · 3 | J117 · J122 | J122 · J122 | 3 · 2 | 3 · 2 |
| nomade × 6 | 82 · 80 (81,0) | 83 · 76 (79,5) | 1 · 1 | 1 · 1 | J131 · J136 | J126 · J129 | 2 · 6 | 2 · 6 |
| enracine × 1 | 55 · 54 (54,5) | 61 · 65 (63,0) | 70 · 67 | 81 · 76 | J21 · J29 | J21 · J21 | 1 · 1 | 1 · 1 |
| enracine × 2 | 78 · 74 (76,0) | 75 · 77 (76,0) | 54 · 51 | 56 · 54 | J21 · J21 | J17 · J17 | 1 · 0 | 1 · 0 |
| enracine × 4 | 88 · 84 (86,0) | 89 · 85 (87,0) | 72 · 74 | 75 · 74 | J28 · J27 | J28 · J29 | 0 · 1 | 0 · 0 |
| enracine × 6 | 84 · 87 (85,5) | 86 · 88 (87,0) | 73 · 72 | 75 · 75 | J17 · J17 | J21 · J21 | 1 · 1 | 1 · 1 |
| mixte × 1 | 58 · 57 (57,5) | 59 · 59 (59,0) | 19 · 14 | 30 · 27 | J111 · J114 | J108 · J115 | 0 · 0 | 0 · 0 |
| mixte × 2 | 74 · 76 (75,0) | 71 · 79 (75,0) | 18 · 21 | 23 · 27 | J56 · J58 | J57 · J54 | 2 · 0 | 2 · 0 |
| mixte × 4 | 84 · 86 (85,0) | 82 · 85 (83,5) | 37 · 37 | 43 · 42 | J58 · J65 | J58 · J65 | 2 · 1 | 2 · 1 |
| mixte × 6 | 86 · 86 (86,0) | 88 · 87 (87,5) | 46 · 46 | 49 · 48 | J57 · J54 | J58 · J52 | 2 · 1 | 1 · 1 |

**Ce que le lot fait dans le simulateur** (moyenne par partie sur les deux graines ; les ouvrages : parties sur 600 où l'abri final
en a un) :

| Cas | Brèches / partie, avant | après | Éboulements / partie | Quarts d'entretien à part / partie | Cueillettes de remèdes / partie | Ouvrages du lot bâtis (parties sur 600) |
|---|---|---|---|---|---|---|
| passif × 1 | 0,45 | 0,44 | 0,00 | 0,00 | 0,00 | boucan 0, jarre-filtrante 0, puits-creuse 0 |
| passif × 2 | 0,34 | 0,33 | 0,00 | 0,00 | 0,00 | boucan 0, jarre-filtrante 0, puits-creuse 0 |
| passif × 4 | 0,33 | 0,30 | 0,00 | 0,00 | 0,00 | boucan 0, jarre-filtrante 0, puits-creuse 0 |
| passif × 6 | 0,28 | 0,25 | 0,00 | 0,00 | 0,00 | boucan 0, jarre-filtrante 0, puits-creuse 0 |
| nomade × 1 | 1,19 | 1,17 | 0,00 | 0,00 | 0,00 | boucan 0, jarre-filtrante 0, puits-creuse 0 |
| nomade × 2 | 1,35 | 1,34 | 0,00 | 0,00 | 0,00 | boucan 0, jarre-filtrante 0, puits-creuse 0 |
| nomade × 4 | 1,53 | 1,51 | 0,00 | 0,00 | 0,00 | boucan 0, jarre-filtrante 0, puits-creuse 0 |
| nomade × 6 | 1,59 | 1,56 | 0,00 | 0,00 | 0,00 | boucan 0, jarre-filtrante 0, puits-creuse 0 |
| enracine × 1 | 1,29 | 1,43 | 0,01 | 0,14 | 4,96 | boucan 321, jarre-filtrante 272, puits-creuse 58 |
| enracine × 2 | 1,18 | 1,21 | 0,02 | 0,18 | 2,03 | boucan 366, jarre-filtrante 332, puits-creuse 48 |
| enracine × 4 | 1,47 | 1,64 | 0,13 | 1,77 | 1,57 | boucan 477, jarre-filtrante 439, puits-creuse 64 |
| enracine × 6 | 1,83 | 1,67 | 0,24 | 2,33 | 0,45 | boucan 546, jarre-filtrante 471, puits-creuse 9 |
| mixte × 1 | 1,17 | 1,21 | 0,00 | 0,00 | 1,22 | boucan 189, jarre-filtrante 173, puits-creuse 43 |
| mixte × 2 | 1,06 | 1,16 | 0,00 | 0,01 | 0,83 | boucan 257, jarre-filtrante 241, puits-creuse 72 |
| mixte × 4 | 1,58 | 1,70 | 0,05 | 0,32 | 0,60 | boucan 440, jarre-filtrante 357, puits-creuse 54 |
| mixte × 6 | 1,81 | 1,80 | 0,14 | 0,87 | 0,44 | boucan 535, jarre-filtrante 346, puits-creuse 5 |

**Lecture.**
- **L'autonomie de l'enraciné remonte**, sans rien retirer : seul 70 · 67 → 81 · 76 (68,5 → 78,5 %, au-dessus de la cible de 72) ; à
  deux 54 · 51 → 56 · 54 (52,5 → 55 %, vers la cible de 58 sans l'atteindre) ; à quatre et six, 73 → 74,5 et 72,5 → 75. Le levier :
  le **boucan**, qui conserve sans matériaux fouillés (la réserve ne pourrit plus de 5 % par jour, ce qui empêchait un petit groupe de
  tenir un bilan net positif), puis les **jarres** et le **puits** là où l'eau manque. Le mixte en profite aussi (× 1 : 16,5 → 28,5 %).
- **À deux, ce qui manque encore** : dans Mafate surtout (la moitié des parties non autonomes), l'enraciné à deux a son captage, son
  potager et son boucan, mais pas de basse-cour ni d'enclos (les matériaux), et son potager produit à moitié (personne aux cultures à
  deux) ; des abris d'élevage lontan (lot 8) l'aideraient.
- **Les vivants à J200** : l'enraciné y gagne (seul 54,5 → 63 % : moins de soif, grâce au puits ; les autres à ±1,5), le mixte et le
  nomade ne bougent pas au-delà du bruit (± 2). **Le passif perd 3 à 4 points** (14 → 10 % seul) : il ne répare rien, et le cyclone
  abîme désormais plus souvent la tôle de sa citerne et le bambou de son potager (graine 1 : passifs ayant vécu un cyclone, vivants à
  J200 34 → 22 % ; sans cyclone, 6 → 6 %). C'est la règle des matériaux, appliquée à qui ne fait rien.
- **Les brèches** de l'enraciné seul et à quatre montent un peu (1,29 → 1,43 ; 1,47 → 1,64 par partie), à six elles baissent. Une
  part venait de la fumée du boucan (§4, corrigée) ; le reste n'a pas été isolé : ni la cible des coups (§3), ni l'entretien, ni le
  cyclone ne l'expliquent seuls (essais d'une variable à la fois, graine 1). Sans effet sur les vivants, qui montent.
- **L'entretien** se fait presque tout seul (ceux qui bâtissent soignent en passant) : quelques quarts à part par partie. Les
  **éboulements** sont rares (0,1 à 0,2 par partie à quatre et six, ceux qui creusent sans savoir étayer).
- **Les remèdes** de l'enraciné : jours d'abri avec un médicament seul 43 · 46 → 48 · 47 %, à deux 69 · 68 → 75 · 74 % (la cueillette
  de remèdes toutes les deux semaines compense les journées prises par les chantiers).
- **La première faim** de l'enraciné à deux avance un peu (J21 → J17) : le puits et les jarres prennent les premières journées ; sans
  effet sur les vivants.

## 8. À trancher (Jordan)

1. **Le coin de prière** : un seul lieu commun à toutes les fois (fait : +1 au moral, aucun effet propre à une religion), ou un lieu par
   religion (question 6 du 3D) ?
2. **La hauteur pour la tour de guet et le mur** : seul le chemin de ronde nouveau évite la brèche des Livides. La tour de guet (« une
   échelle qu'on remonte ») et le mur d'enceinte (« avec un chemin de ronde ») le mériteraient ; les leur donner rendrait plus sûrs
   les abris qui les ont déjà (l'enraciné surtout).
3. **L'eau traitée** : le contrat (§1.6, abri.mjs) dit qu'une installation à effet `eauTraitee` (filtre, bouilleur) rend l'eau sûre,
   mais aucune installation du contenu ne porte ce drapeau, ni avant ce lot ni dans ce lot (les jarres filtrantes non plus, pour rester
   cohérentes avec le filtre). Seul le réseau public traite l'eau. Le poser sur le filtre, le bouilleur et les jarres baisserait les
   maladies de l'eau des abris qui en ont : c'est un changement d'équilibre, à décider.
4. **Le digesteur** fait du gaz (0,5 puis 1 par jour : l'inventaire le demandait pour la ressource du §13) et non de l'énergie
   comme dans le 3D.
5. **Le puits creusé** donne 2 puis 3 d'eau (le 3D : 3 puis 5).
6. **La cave** : 25 % au moment d'achever un niveau sans l'étaiement, la dernière cellule à recreuser ; près d'une eau qui court, un risque et non une
   interdiction.
7. **Les installations à bras n'ont pas d'entretien à part** (le potager, le filtre, les élevages…) : leurs bras les tiennent.
8. **La haie de choka** est la sœur lontan des barricades (elle les remplace, elle ne s'y ajoute pas), comme dans le 3D (« répond à
   barricades »). En faire un ouvrage à part (qui s'additionne) la rendrait plus utile, une fois fermée.
9. **Le boucan se voit comme un séchoir** (visibilité 1, le 3D dit 2) : à 2, bâti tôt, il attirait les bandes (§4).
10. **Le simulateur cueille des zerbaz** toutes les deux semaines quand il n'a plus de remède (§6) : sans cela, les chantiers du lot
    privaient le solo de ses tisanes. C'est une règle du simulateur, pas du jeu ; elle touche aussi les mesures des autres lots.
11. **Le cyclone selon le matériau** : la tôle (citerne, panneaux, barricades) et le bambou (potager) y perdent plus qu'avant ; le
    passif, qui ne répare rien, perd 3 à 4 points de vivants à J200 (§7). Garder les parts du 3D, ou les adoucir pour la tôle ?
    **Mesuré depuis** (rééquilibrage d'après les douze lots, `equilibre-3d.md`) : la tôle coupée seule ne change rien aux passifs
    (0,0 point) ni aux sédentaires ; tous les matériaux à 25 % rendent 0,1 à 0,9 point. Ce qui touchait le passif était l'usure (il ne
    soignait jamais) : le simulateur lui fait passer un quart sur un entretien dû, comme l'enraciné oisif. Parts du 3D gardées.
