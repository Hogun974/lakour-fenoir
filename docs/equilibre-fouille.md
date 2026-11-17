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
