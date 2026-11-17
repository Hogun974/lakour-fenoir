# Équilibre du lot « fouille » (lot 5 : fouiller, démonter et récolter l'île)

Contrat : `docs/survie-contrat.md` §25. Logique : `systems/lakour-survie/logique/fouilles.mjs` ; contenu :
`modules/lakour-fenoir/contenu/fouilles.mjs`. Sources du jeu 3D (lecture seule) : `paquets/base/jeu/fouilles.json`, `sources.json`,
`docs/equilibre.md` (« Les lieux plus ou moins pillés », « La fouille par genre », « Les bêtes trouvées en fouillant », « Ce qu'un
gisement rend », « Les cases de l'île »), `docs/formats/batiments.md`, le complément (familles 6 et 9).

## Ce qui ne change pas

La fouille d'une région (au hasard des lieux), des sites, des jardins, des livres, des plans, des repères, la nuit noire qui l'enrichit
et la rue nettoyée qui se repeuple sont celles d'avant, chiffre pour chiffre. Le lot ajoute trois cibles à côté (`lieu`, `demonter`,
`matieres`) : un groupe qui ne s'en sert pas joue exactement comme avant (le simulateur `--sans-lieux` rend les mêmes parties que la
branche de départ, graine pour graine).

## Les unités

Une ressource de Fénoir vaut **deux matériaux du jeu 3D** : une brouette, c'est huit planches, quatre tôles, huit parpaings, deux cents
clous, quatre bambous, quarante galets. Le jeu 3D ramenait un « matériau » à un tronc, quatre planches ou cent clous ; mais ses tables
ont été écrites « pour quelques décombres » (sa propre note : l'abondance reste à régler), et un mur de Fénoir coûte 15 matériaux là où
le mur du jeu 3D en coûte une dizaine d'objets. Les vivres : deux conserves ou deux rations sèches pour un jour de nourriture, deux
bouteilles pour un jour d'eau ; les soins : quatre pansements, deux flacons d'alcool, deux sachets de soluté pour un médicament (un
médicament de Fénoir traite une blessure ou une fièvre). Les quantités des lots restent celles du jeu 3D, en objets : c'est la table
de conversion (`par`) qui les ramène en ressources, et le journal du MJ la donne en entier (« Ce qu'un objet vaut en ressources »).

## Les chiffres

| Chiffre | Valeur | Raison |
|---|---|---|
| Degré de pillage | `pris × (0,6 + 0,8 × ville) ± 0,2 − 0,03 × infestation`, borné 0..1 | Le jeu 3D : 0,5 ± 0,3 selon la ville, ± 0,2 de hasard, − 0,04 par palier de risque, fixe. Fénoir a un monde qui avance : `pris` (la part des vivres que la région a déjà perdue, que la simulation fait monter chaque jour) remplace la constante 0,5. Au jour zéro, rien n'est pillé ; à J21, Saint-Denis a perdu 75 % de ses vivres, Mafate 31 % : un lieu de Saint-Denis se lit « tout a été retourné », une case de Mafate « à peine passé ». À mi-parcours (pris 0,5), une pleine ville donne 0,7, un écart 0,35 : les deux plages du jeu 3D (0,6-1 et 0-0,4). |
| Place d'un lieu (ville) | 0,3 + 0,15 par point de population (au plus 1) ; à l'écart 0,1 | Saint-Denis et Saint-Pierre (5) : 1 ; Cilaos (1) : 0,45 ; un écart : 0,1. |
| Part des lieux à l'écart | 0,15 + 0,17 × (5 − population) | Une case sur sept à l'écart à Saint-Denis ; toutes à Mafate. |
| Le risque | − 0,03 par point d'infestation | Le jeu 3D : − 0,04 par palier (au plus 0,16) ; ici l'infestation réelle (0 à 5), au plus 0,15. |
| Les mots | seuils 0,15, 0,4, 0,65, 0,85 | Ceux du jeu 3D. |
| Ce qu'on emporte | convoité 1,1 × degré (au plus 0,9) ; le reste 0,5 × degré ; un lot resté perd la moitié de cette chance | Ceux du jeu 3D. Le convoité de Fénoir : vivres, eau, soins, munitions, carburant, gaz, outils et armes. |
| Jamais vide | un lot non convoité reste, à sa plus petite quantité ; un lieu fouillé jusqu'au bout rend au moins une unité | La décision de Jordan ; une unité, parce qu'un rouleau de bâche seul ne fait pas une brouette, et que « jamais vide » doit se voir dans les stocks. |
| Travail d'un lieu | environ un quart-personne pour cinq gestes du jeu 3D (1 à 4) | Une case : 2 ; une supérette : 4. Fouiller une région prend un quart par lieu au hasard ; un lieu choisi se fouille en entier en une demi-journée à deux. |
| Allure | discret 0,6, normal 1, rapide 1,5 du travail ; bruit 0 / 1 / 3 | Le bruit est celui de la fouille d'une région ; la vitesse dit ce que la discrétion coûte. |
| Lieux par région | base + parPopulation × population, par genre | Saint-Denis : 38 cases, 42 maisons, 5 pharmacies, 6 supérettes ; Mafate : 8 cases, une école, une chapelle, aucun garage ni voiture (pas de route). |
| Bêtes | chance du jeu 3D × (1 − degré)² | Celles du jeu 3D (déjà divisées par deux par Jordan après un premier essai) ; seize fois plus rares en pleine ville que dans un écart. |
| Délai hors d'un enclos | poule, lapin 4 quarts ; porcelet 5 ; cabri 6 ; veau 8 ; essaim 2 | Le jeu 3D : 24 à 48 h, 12 h pour l'essaim, au quart près. |
| Viande | poule, lapin 1 ; porcelet 4 ; cabri 6 ; veau 10 | Le jeu 3D (« 1 viande », « 6 viandes ») : une viande pour un jour de nourriture. |
| Démonter un lieu | la moitié du coût, en ressources de Fénoir : case de bois 12 matériaux (16 quarts-personne), case de tôle 4 (6), maison en dur 21 et 1 pièce (32), voiture 1 et 3 pièces (6) | Le jeu 3D : casser rend la moitié (case de bois : 55 planches, 220 clous, 8 tôles, 4 troncs ; maison : 90 parpaings, 20 ciments, 16 tôles, 10 ferrailles). Environ 0,75 matériau par quart-personne : moins que le bois des alentours (0,5 à 2,5), mais il en reste en ville quand la forêt est loin ; et c'est bruyant (+1 ou +2 par quart). |
| Sans outil | deux fois plus lent | Le jeu 3D demande un pied-de-biche ou une masse ; une table ne bloque pas, elle ralentit. |
| Démonter une installation | la moitié des coûts, tous niveaux ; un tiers du travail | La règle du jeu 3D ; le tiers : défaire va plus vite que bâtir. |
| Récolte | `parQuart` gisements par quart-personne (1 à 6), la moitié sans outil ; repousse du jeu 3D, ÷ 0,4 en saison sèche | Bambou 60 jours, vacoa 30, coquillages 5, basalte 120 ; environ 1 à 2,3 matériaux par quart-personne. |
| Nombre de gisements | la somme des parts (centièmes) des milieux de la région | Saint-Denis : 15 touffes de bambou, 22 galets, 8 argiles. |
| Glanage et trousse | ceux de la fouille d'une région (0,055 et 1,5 % par quart-personne), aussi dans un lieu | Fouiller un lieu, c'est fouiller la région : sans eux, le nomade qui passait aux lieux d'une région vide perdait ce qui se renouvelle pour qui bouge, et mourait plus (mesure ci-dessous). Pas en démontant, ni en récoltant. |
| Bruit et rencontres | la fouille d'un lieu : le bruit de l'allure va à l'abri, comme avant ; le démontage : son bruit (+1 ou +2) entre aussi dans la rencontre (+10 % par point) | Un chantier s'entend dans la rue ; une fouille ne fait pas plus de bruit qu'avant. |
| Qualité d'un outil trouvé | 60 / 30 / 10 % au calme, 43 / 36 / 21 % au palier 4 | Décision de Jordan du 16 novembre ; elle attend le champ `qualite` du lot 6. |

Ce qui n'est pas porté : le temps réel (gestes, mètres, le coup d'œil à 12 m), le retour des lieux au cycle du serveur, la vérité « un
lieu fouillé l'est pour tous » (une table n'a qu'un groupe), les réglages du serveur (`monde.pillage`, `monde.fouille`). Les cartes et
les calendriers ne sont pas dans les tables : ils ont leur propre tirage (lot « cartes ») ; les plans aussi (lot « plans »).

## L'abondance des tables

Au calme (degré 0), une fois converties, les tables rendent de 0,9 à 4,8 ressources par quart-personne (sans le gaz) : une boutique
4,8, une supérette 4,0, un hangar 3,4, une pharmacie 2,7 (dont 2,3 médicaments), une case 1,5, un lieu de culte 0,9. La fouille d'une
région en rend au plus 6 par quart-personne, et beaucoup moins quand ses réserves baissent (1,5 % de la réserve) : à Mafate, 0,9
nourriture par quart. Choisir un lieu sert donc surtout quand la région est maigre, ou pour un besoin précis (des médicaments dans une
pharmacie, des outils dans une quincaillerie), et dans les écarts. Un essai (`contenu-fouilles.test.mjs`) garde chaque genre entre 0,5
et 6.

### Ce qu'un lieu rend, selon le jour et la place (mesuré)

La journée du jeu 3D (« une journée dans un écart rend trois fois plus de vivres qu'en ville »), refaite pour une table : 30 mondes
(graines « mesure-0 » à « mesure-29 »), la simulation de l'île jour après jour (les autres survivants pillent), et à J0, J7, J21, J60
la fouille complète d'un lieu de chaque sorte (un lieu différent par monde), en ressources de Fénoir. Script :
`mesure-lieux.mjs` (hors dépôt, dans le carnet de l'agent ; il appelle `fouillerLieu` sur le vrai contenu).

| Lieu | Jour | Degré moyen | Vivres (nourriture + eau) | Médicaments | Tout (sans le gaz) | Par quart-personne |
|---|---|---|---|---|---|---|
| saint-denis, case | J0 | 0.04 | 1.0 | 0.2 | 3.3 | 1.67 |
| saint-denis, case écart | J0 | 0.05 | 1.3 | 0.4 | 3.6 | 1.82 |
| saint-denis, maison | J0 | 0.04 | 1.3 | 0.4 | 4.4 | 2.18 |
| saint-denis, pharmacie | J0 | 0.05 | 0.3 | 4.2 | 4.9 | 2.45 |
| cilaos, case | J0 | 0.04 | 0.8 | 0.2 | 2.4 | 1.22 |
| cilaos, case écart | J0 | 0.05 | 1.2 | 0.3 | 3.3 | 1.63 |
| cilaos, maison | J0 | 0.03 | 1.0 | 0.6 | 5.2 | 2.62 |
| mafate, case écart | J0 | 0.06 | 1.1 | 0.1 | 3.3 | 1.63 |
| saint-denis, case | J7 | 0.48 | 0.6 | 0.1 | 2.3 | 1.15 |
| saint-denis, case écart | J7 | 0.18 | 1.1 | 0.4 | 3.6 | 1.78 |
| saint-denis, maison | J7 | 0.51 | 0.3 | 0.3 | 3.5 | 1.73 |
| saint-denis, pharmacie | J7 | 0.51 | 0.1 | 1.5 | 2.1 | 1.03 |
| cilaos, case | J7 | 0.12 | 0.8 | 0.2 | 2.3 | 1.15 |
| cilaos, case écart | J7 | 0.09 | 1.1 | 0.3 | 3.0 | 1.48 |
| cilaos, maison | J7 | 0.10 | 0.9 | 0.5 | 4.8 | 2.42 |
| mafate, case écart | J7 | 0.12 | 1.0 | 0.0 | 2.8 | 1.40 |
| saint-denis, case | J21 | 0.87 | 0.1 | 0.1 | 1.0 | 0.48 |
| saint-denis, case écart | J21 | 0.36 | 0.8 | 0.3 | 2.9 | 1.43 |
| saint-denis, maison | J21 | 0.90 | 0.1 | 0.0 | 2.3 | 1.17 |
| saint-denis, pharmacie | J21 | 0.91 | 0.0 | 0.5 | 1.1 | 0.53 |
| cilaos, case | J21 | 0.26 | 0.5 | 0.2 | 2.1 | 1.07 |
| cilaos, case écart | J21 | 0.18 | 1.0 | 0.2 | 2.8 | 1.38 |
| cilaos, maison | J21 | 0.23 | 0.7 | 0.4 | 4.3 | 2.15 |
| mafate, case écart | J21 | 0.21 | 0.8 | 0.2 | 2.8 | 1.38 |
| saint-denis, case | J60 | 1.00 | 0.1 | 0.1 | 1.0 | 0.52 |
| saint-denis, case écart | J60 | 0.49 | 0.5 | 0.2 | 2.2 | 1.10 |
| saint-denis, maison | J60 | 1.00 | 0.1 | 0.0 | 2.1 | 1.07 |
| saint-denis, pharmacie | J60 | 1.00 | 0.0 | 0.5 | 1.1 | 0.55 |
| cilaos, case | J60 | 0.47 | 0.3 | 0.1 | 1.6 | 0.82 |
| cilaos, case écart | J60 | 0.32 | 0.6 | 0.2 | 2.3 | 1.13 |
| cilaos, maison | J60 | 0.44 | 0.3 | 0.4 | 2.9 | 1.45 |
| mafate, case écart | J60 | 0.35 | 0.5 | 0.1 | 2.4 | 1.22 |

- **La ville se vide vite** : à Saint-Denis, la case moyenne se lit « déjà passé » à J7 (0,48) et « il ne reste presque rien » à J21
  (0,87) ; c'est la simulation de Fénoir (la ville a perdu 75 % de ses vivres à J21), pas le lot. Cilaos reste « à peine passé » jusqu'à
  J21, Mafate aussi.
- **L'écart vaut le détour** : à J21, une case à l'écart de Saint-Denis rend huit fois plus de vivres qu'une case du centre (0,8 contre
  0,1) ; à J60, cinq fois. Au jour zéro, tout se vaut.
- **Jamais vide** : même à J60 en pleine ville (degré 1), une case rend une ressource, une maison deux (du linge, des câbles, de la tôle).
- **La pharmacie** : 4,2 médicaments au jour zéro, 1,5 à J7, 0,5 ensuite (les pansements qui restent), et parfois une trousse de
  secours. Dans une grande ville, au début, la fouille de la région ciblée sur les médicaments rend davantage (1,5 % × 2,5 des
  réserves, jusqu'à 6 par quart-personne) : la fouille d'un lieu ne remplace pas celle d'une région, elle prend le relais quand la
  région s'épuise, et elle sert là où la région est pauvre.

## Le simulateur

`essais/outils/simuler-parties.mjs` joue les nouveautés comme un groupe raisonnable (`LIEUX_DU_BESOIN`, `A_DEMONTER`) :
- quand le renseignement de sa région dit « vide » et que la fouille de la région ne rendrait plus une unité par fouilleur de ce qu'il
  cherche (1,5 % de ce qui reste, × 2,5 en ciblant), ou qu'il cherche des médicaments, il fouille un **lieu** du genre qui sert son
  besoin (supérette, boutique, case pour manger ; pharmacie, centre de santé pour les médicaments), à l'écart d'abord ; pour juger
  s'il reste ou part, il compte ce qui nourrit et désaltère ;
- l'enraciné à qui il manque des matériaux et dont les alentours n'ont plus de bois **récolte** les matières de l'île, sinon
  **démonte** une case de tôle, une case, une remise, une épave ;
- il ne prend pas les bêtes et ne garde pas les objets trouvés (outils, armes) : ce que la fouille d'un lieu rend en plus de la
  fouille d'une région n'est pas compté dans ses chances ;
- `--sans-lieux` (et `parties-longues.mjs --sans-lieux`) rejoue la fouille d'avant le lot : vérifié, 120 parties sur 120 identiques à
  la branche de départ (même jour de fin, même cause, même première faim, même autonomie, mêmes déménagements).

### Ce qui a été essayé, et pourquoi la règle a changé

1. **Le nomade fouillait des lieux dès que sa région était « maigre »** (règle d'abord sans glanage dans un lieu) : la survie du nomade
   à J200 tombait de 72-82 % à 23-26 %, sa première faim de J117 à J45. Il ne glanait plus en fouillant (le glanage de passage n'était
   que dans la fouille d'une région) : c'est pourtant « ce qui se renouvelle pour qui bouge », le levier du nomade (`docs/equilibre.md`).
   **Changement de règle** : fouiller un lieu, c'est fouiller la région ; le glanage et la trousse oubliée y viennent aussi.
2. **Avec le glanage, toujours dès « maigre »** : nomade × 1, 2, 4, 6 à 53, 75, 73, 66 % (150 parties, graine 1) contre 56, 73, 81,
   83 % : dans une région « maigre » (10 à 40 % des réserves), la fouille de la région rend encore 1,5 % de ce qui reste, plus que les
   lieux mis à sac de la ville. Un groupe raisonnable ne quitte la fouille de la région que quand elle ne rend plus rien : **le
   simulateur passe aux lieux quand la région est « vide »** (ou pour des médicaments).
3. **Le bruit de la fouille d'un lieu dans la rencontre** (+10 % par point) : retiré ; comme pour une région, il va à l'abri. Seul le
   démontage, bruyant, attire dans la rencontre.
4. **Dès « vide »** (deux graines de 300 parties, plus la graine 3 pour le nomade et l'enraciné) : rien ne bougeait chez l'enraciné et
   le mixte, mais le nomade seul perdait 3 à 4 points sur les trois graines (56 → 52, 56 → 53, 55 → 51) et à six 2 à 3 (82 → 80,
   80 → 77, 80 → 77) : le renseignement « vide » dit que la région a perdu 90 % de ses réserves, pas qu'il n'y reste rien de ce qu'on
   cherche (l'eau dure plus que les conserves) ; une fouille ciblée de la région en rendait encore plus qu'un lieu mis à sac. **Le
   simulateur passe aux lieux quand la région ne rendrait plus une unité par fouilleur** : c'est ce que ferait un groupe qui voit ses
   fouilles revenir vides. Mesures ci-dessous.

## Les mesures

**200 jours** : `node essais/outils/simuler-parties.mjs --parties 300 --graine 1` puis `--graine 2` (16 cas, 4 800 parties par
graine, 9 600 en tout), **avant** (la branche de départ `vague2`, commit 98790e2, rejouée aussi par `--sans-lieux`) et **après** (le lot :
règle et simulateur). Chaque cellule : graine 1 | graine 2.

| Cas | Vivants à J200 : avant | après | Première faim (médiane) : avant | après | Autonomes : avant | après | Déménagements : avant | après |
|---|---|---|---|---|---|---|---|---|
| passif × 1 | 13 \| 15 (moy. 14.0) | 13 \| 15 (moy. 14.0) | J17 \| J17 | J17 \| J17 | 37 \| 36 | 37 \| 36 | 0.3 \| 0.3 | 0.3 \| 0.3 |
| passif × 2 | 13 \| 14 (moy. 13.5) | 13 \| 14 (moy. 13.5) | J10 \| J10 | J10 \| J10 | 31 \| 34 | 31 \| 34 | 0.2 \| 0.2 | 0.2 \| 0.2 |
| passif × 4 | 12 \| 13 (moy. 12.5) | 12 \| 13 (moy. 12.5) | J7 \| J7 | J7 \| J7 | 28 \| 29 | 28 \| 29 | 0.2 \| 0.1 | 0.2 \| 0.1 |
| passif × 6 | 11 \| 11 (moy. 11.0) | 11 \| 11 (moy. 11.0) | J5 \| J5 | J5 \| J5 | 21 \| 22 | 21 \| 22 | 0.1 \| 0.1 | 0.1 \| 0.1 |
| nomade × 1 | 56 \| 56 (moy. 56.0) | 58 \| 57 (moy. 57.5) | J189 \| J200 | J187 \| J200 | 1 \| 2 | 1 \| 2 | 2.4 \| 2.3 | 2.4 \| 2.3 |
| nomade × 2 | 72 \| 74 (moy. 73.0) | 74 \| 75 (moy. 74.5) | J64 \| J70 | J64 \| J65 | 1 \| 1 | 1 \| 1 | 2.7 \| 2.6 | 2.7 \| 2.6 |
| nomade × 4 | 78 \| 85 (moy. 81.5) | 82 \| 85 (moy. 83.5) | J117 \| J122 | J119 \| J131 | 3 \| 4 | 2 \| 3 | 5.4 \| 5.7 | 5.7 \| 6 |
| nomade × 6 | 82 \| 80 (moy. 81.0) | 83 \| 81 (moy. 82.0) | J131 \| J136 | J122 \| J131 | 1 \| 1 | 1 \| 1 | 11.2 \| 11.5 | 11.7 \| 12 |
| enracine × 1 | 55 \| 54 (moy. 54.5) | 55 \| 55 (moy. 55.0) | J21 \| J29 | J21 \| J29 | 70 \| 67 | 70 \| 67 | 1.6 \| 1.5 | 1.6 \| 1.5 |
| enracine × 2 | 78 \| 74 (moy. 76.0) | 78 \| 74 (moy. 76.0) | J21 \| J21 | J21 \| J21 | 54 \| 51 | 54 \| 51 | 1.3 \| 1.3 | 1.3 \| 1.3 |
| enracine × 4 | 88 \| 84 (moy. 86.0) | 87 \| 84 (moy. 85.5) | J28 \| J27 | J27 \| J27 | 72 \| 74 | 73 \| 73 | 1.3 \| 1.3 | 1.3 \| 1.2 |
| enracine × 6 | 84 \| 87 (moy. 85.5) | 85 \| 87 (moy. 86.0) | J17 \| J17 | J17 \| J17 | 73 \| 72 | 73 \| 72 | 1.3 \| 1.2 | 1.3 \| 1.2 |
| mixte × 1 | 58 \| 57 (moy. 57.5) | 58 \| 59 (moy. 58.5) | J111 \| J114 | J95 \| J114 | 19 \| 14 | 18 \| 18 | 2.1 \| 2.2 | 2.1 \| 2.3 |
| mixte × 2 | 74 \| 76 (moy. 75.0) | 75 \| 76 (moy. 75.5) | J56 \| J58 | J56 \| J58 | 18 \| 21 | 18 \| 21 | 3 \| 2.9 | 2.8 \| 2.9 |
| mixte × 4 | 84 \| 86 (moy. 85.0) | 85 \| 87 (moy. 86.0) | J58 \| J65 | J61 \| J57 | 37 \| 37 | 35 \| 39 | 3.1 \| 3.1 | 3.1 \| 3.1 |
| mixte × 6 | 86 \| 86 (moy. 86.0) | 84 \| 87 (moy. 85.5) | J57 \| J54 | J57 \| J52 | 46 \| 46 | 49 \| 49 | 3.2 \| 3.3 | 3.2 \| 3.2 |

**Graine 3** (300 parties par cas, nomade et enraciné ; avant | après) : vivants à J200, nomade × 1 55 | 53, × 2 76 | 76, × 4 83 | 85,
× 6 80 | 82 ; enraciné × 1 52 | 52, × 2 74 | 75, × 4 85 | 85, × 6 88 | 88 ; première faim de l'enraciné J21, J28, J21, J17 avant comme
après.

**Ce que le simulateur fait du lot** (par partie, graine 1 | graine 2) : lieux fouillés, nomade × 1 40 | 41, × 2 48 | 49, × 4 57 | 57,
× 6 55 | 51 ; mixte × 1 22 | 18, × 6 8 | 9 ; enraciné 0,4 à 1,8. Récoltes : enraciné × 6, 0,5 | 0,6. Démontages : aucun (l'enraciné
trouve toujours du bois, ou des matières de l'île, avant d'en venir là ; le démontage sert à la table, pas au simulateur).

**Lecture.**
- **La première faim de l'enraciné ne bouge pas** : J21 | J29 seul, J21 à deux, J27 à quatre, J17 à six (cible : J21 à J28 ; à six,
  J17, comme avant le lot). Il ne fouille presque pas de lieux : ses alentours et sa région le nourrissent.
- **La survie à J200 ne bouge pas** au-delà du bruit du hasard : de −1 à +2 points selon le cas. Partie par partie (graine 1), le
  nomade seul gagne 26 parties et en perd 19 parmi celles où il a fouillé des lieux (les 76 autres sont identiques à l'avant) ; à
  quatre, 28 et 17 ; à six, 31 et 28.
- **Les deux voies restent aussi valables l'une que l'autre** : à quatre, nomade 83,5 % contre enraciné 85,5 % (81,5 contre 86
  avant) ; à six, 82 contre 86 (81 contre 85,5) ; à deux, 74,5 contre 76 (73 contre 76) ; seul, 57,5 contre 55 (56 contre 54,5).
- **La première faim du nomade** reste celle d'avant (J119 | J131 à quatre au lieu de J117 | J122 ; J122 | J131 à six au lieu de
  J131 | J136).

**Un an** (`node essais/outils/parties-longues.mjs --graines 16`, sans puis avec les lieux : 16 parties par scénario, vivants au
jour 365) : aucune anomalie, aucune impasse.

| Scénario | avant (`--sans-lieux`) | après |
|---|---|---|
| sedentaire-4 | 6 | 7 |
| sedentaire-2 | 6 | 6 |
| seul-enracine | 2 | 2 |
| seul-sedentaire | 6 | 5 |
| seul-nomade | 9 | 10 |
| compagnons | 13 | 13 |
| humains-4 | 11 | 10 |
| recrues | 8 | 8 |
| sans-recrues | 10 | 10 |
| nomade-4 | 9 | 9 |
| mixte-4 | 9 | 10 |
