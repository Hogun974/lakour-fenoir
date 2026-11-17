# Équilibre du lot « corps » (2026-11-17)

Lot 1 de l'inventaire du jeu 3D (`images-essais/INVENTAIRE-3D-POUR-FVTT.md`) : le corps, le sommeil et l'hygiène, plus les chutes et
le bouclier, traduits pour un jeu de table. Ce fichier donne les chiffres retenus, leurs raisons et les mesures ; la règle est dans
le contrat (`docs/survie-contrat.md` §19) et dans la logique (`systems/lakour-survie/logique/corps.mjs`, avec des crochets dans
`maladies.mjs`, `survivant.mjs`, `abri.mjs`, `actions.mjs` et `etat.mjs`). Rien n'est retiré ni renommé : une fiche sans `veille`,
un abri sans `souillure` et un contenu sans symptômes marchent comme avant.

**Laissé de côté (temps réel, propre au jeu vidéo)** : les heures et les minutes (on compte en quarts), les vitesses de marche (le
bouclier qui ralentit de 8 %, le manque de sommeil qui ralentit de 10 à 25 %), l'endurance et la vie en pourcentages (le 3D les lit
sur la fiche de Fénoir : la table a déjà ses dés), les deux envies (vessie, ventre) et les accidents, la souillure portée à 12 m, le
flou de l'heure lue dans le ciel, la règle « à plusieurs, la nuit ne passe que si tout le monde dort » (une règle de serveur : à la
table, le temps avance avec les actions), le risque tiré à chaque ration et à chaque repos (la table tire une fois par jour).

## 1. Le sommeil

**Règle** : `veille` compte les quarts passés éveillé depuis le dernier sommeil.

| Chiffre | Valeur | Le 3D | Pourquoi |
|---|---|---|---|
| En manque | 3 quarts (18 h) | 16 h sans gêne | une journée faite : la nuit qui suit, on bâille ; rien aux dés |
| Épuisé | 4 quarts (24 h) | 24 h | une nuit blanche : −1 dé |
| Terrassé | 7 quarts (42 h) | 40 h | −2 dés, et l'on dort de force le quart suivant, au sol, même de garde |
| Effacé par quart de sommeil | abri 4, bivouac 3, sol 2 | bivouac 3 h, sol 2 h par heure | une nuit à l'abri remet à zéro ; au bivouac, une journée ; au sol, il manque un quart par jour |
| Fatigue + sommeil | au plus −2 dés | plancher commun d'endurance (40 %) | « branché sur la fatigue » : les deux usures ne s'additionnent pas au-delà de −2 |
| Insomnie | un quart effacé de moins | `sommeil` × 1,3 et plus | gale, choc d'une perte, fièvres aggravées, tétanos, fracture et brûlure aggravées |
| Nuit au bivouac | −1 fatigue | — | à l'abri, la nuit retire déjà 2 ; au sol, rien |

**Qui dort, et quand** (`lieuDeSommeil`) : la nuit à l'abri, ceux qui ne veillent pas ; **la garde, et quiconque n'a pas dormi de la
nuit, dort le matin à l'abri** ; **épuisé, on rattrape au premier quart où l'on s'arrête** ; en route, la nuit, on marche (le
voyage avance : c'est déjà ce que disait le lot « sens », qui compte ces nuits dans l'habitude du noir) ; arrêté hors de l'abri, au bivouac ou au sol ; le quart de repos.

**Pourquoi la garde dort le matin, et pourquoi elle ne récupère pas de fatigue en dormant.** Un premier essai ne faisait dormir le
matin que la tâche « garde » : quand le simulateur faisait tourner la garde, celui qui avait veillé la veille et changeait de tâche
le matin restait debout jusqu'au soir (épuisé, −1 dé, toute la journée). Dans une vraie rotation, celui qui a veillé dort le
matin : la règle le dit donc pour quiconque n'a pas dormi de la nuit. Sa fatigue, elle, ne change pas (la garde reste une
corvée) : le sommeil rattrape la veille, pas l'effort, et l'équilibre des assauts (la vigilance de la garde) ne bouge pas.

**Deux corrections après les premières mesures.** (1) Loin de l'abri, la tâche « garde » gardait le survivant debout la nuit, en
route comme au bivouac : le simulateur, qui garde les tâches d'un jour à l'autre, avait des gardes nomades terrassés après chaque
déménagement (nomade × 6 : 44 nuits blanches et 9 endormis par partie). Loin de l'abri, seule la veille demandée tient debout. (2)
Celui qui a veillé la nuit d'avant un départ marchait toute la journée sans dormir : **épuisé, on rattrape au premier quart où l'on
s'arrête**, de jour, là où l'on est. La nuit blanche coûte donc un dé jusqu'à la halte, pas trois jours.

**Mesuré** : le malus du sommeil coupé seul (graine 1, 300 parties, nomade × 2, nomade × 6, mixte × 6) donne exactement les mêmes
parties : les nuits blanches du simulateur tombent en route, là où il ne fait pas de test. Il ne pèse que sur la table (une
veillée, une marche de nuit, une garde sans relève).

**Ce que ça change à l'équilibre** : rien pour un groupe qui vit à son abri (on y dort chaque nuit, la garde chaque matin). La
nuit blanche arrive en route de nuit, dans une veillée (`eveilles`) et dehors sans rien pour bivouaquer.

## 2. Le bivouac

Jugement en mots (`jugerBivouac`), critères du 3D : dangereux (pente raide, lit d'une ravine, Livides à portée) ; exposé (route à
moins de 60 m, bâti, à découvert, pente douce ; feu, lumière, bruit ; endroit souillé) ; sûr. Dangereux : on y dort comme au sol.
Une rencontre de nuit que le MJ tire vaut × 0,5 (sûr), × 1 (exposé), × 2 (dangereux) ; la table « Un bivouac — ce qui vient la
nuit » se tire une fois, deux fois en gardant le pire, ou deux fois en gardant les deux. **Rien d'automatique** : le monde n'a pas
de rencontre de nuit hors de l'abri, et ce lot n'en ajoute pas (les tirages du monde ne bougent pas).

## 3. Les chutes

| Chiffre | Valeur | Le 3D |
|---|---|---|
| Hauteur qui blesse | 3 m (1 blessure) | 3 m |
| Une blessure de plus | tous les 3 m | 3 m |
| Mourant | 12 m | 12 m |
| Mort | 25 m | 25 m (le journal donnait d'abord 15 et 40 m) |
| L'eau | 1,5 m d'eau retire 15 m (en proportion en deçà) | idem |
| Se recevoir | un test d'endurance réussi : −1 blessure (pas pour mourant ni mort) | pas de dés dans le 3D |
| Fracture | 6 m et plus sans s'être reçu | — |
| Livide | chancelle dès 3 m ; rampe à 12 m et plus | « se brise là où un survivant serait mourant » |

Se recevoir et la fracture sont des ajouts de table : un test donne prise au joueur, et l'affliction « fracture » existait déjà
(« une chute dans une ravine »). Rien d'automatique : le MJ appelle `chute`.

## 4. L'hygiène et l'insalubrité

**Règle** : `souillure` de l'abri, chaque jour : `souillure × (1 − effacement) + personnes × apport(latrines) + 0,5 × surpeuplement`.

| Chiffre | Valeur | Pourquoi |
|---|---|---|
| Apport par personne | sans latrines 1 ; feuillées 0,3 ; latrines sèches 0,1 ; fosse 0,03 | l'hygiène 0 à 3 du 3D, en part retenue (d'abord 0,4 ; 0,15 ; 0,05 : voir plus bas) |
| Effacement | 15 % par jour au sec, + 45 % × part du jour où il pleut (au plus 60 %) | une souillure dure 24 à 120 h dans le 3D, quatre fois moins sous la pluie |
| Seuils | ordinaire 6, sale 15, insalubre 30 | quatre au sec : ordinaire en 2 jours, sale en 6, jamais insalubre ; six : insalubre en 9 jours ; avec des feuillées, ordinaire (même à six) ; latrines sèches : propre (d'abord 5, 12, 25 : voir plus bas) |
| Risque | sale 0,5 %, insalubre 1,5 % par personne et par jour | le 3D : 25 % × saleté à chaque repas, boisson ou repos ; à la table, une fois par jour, beaucoup moins fort : un abri sale de quatre, une maladie par cinquante jours ; insalubre à six, une par onze jours |
| Ce qu'on attrape | gastro-entérite 6, plaie infectée 3 (un blessé), gale 2, leptospirose 1 | les poids du 3D |
| Toilette | lavoir 1, douche 2 : le risque × (1 − 0,2 × toilette) | se laver |
| Salubre | hygiène 3 et propre : eau × 0,5, contagion × 0,75 | l'abri tenu propre ; plus faible que le grand ménage du Nouvel An chinois (× 0,5 sur tout) |
| Odeur | un abri sale sent comme un abri surpeuplé (+1) | le lot « sens » attendait l'insalubrité pour sa souillure |
| Ménage | 4 de souillure par quart-personne | deux personnes, deux quarts : d'insalubre à ordinaire |

**Les installations** (sœurs lontan et moderne, `contenu/hygiene.mjs`) :

| Installation | Rôle | Hygiène | Coût | Ce qu'elle prend | Pourquoi |
|---|---|---|---|---|---|
| Feuillées (lontan) | latrines | 1 | 1 île, 2 quarts | — | une tranchée : presque rien |
| Latrines sèches (lontan) | latrines | 2 | 3 île, 4 quarts | — (sol +0,005) | planches et bambou ; le fût finit en compost (un quart du compost) |
| Fosse maçonnée (moderne) | latrines | 3 | 6 matériaux, 1 pièce, 10 quarts, maçonnerie + plomberie | 1 eau par jour | sans eau, elle s'arrête : les latrines sèches prennent le relais |
| Lavoir (lontan) | toilette | 1 | 2 île, 4 quarts | 1 eau par jour | |
| Douche (moderne) | toilette | 2 | 3 matériaux, 1 pièce, 4 quarts, plomberie | 2 eau par jour | |

Le 3D donne +1 moral au lavoir et à la douche : **écarté**, parce que l'eau chaude (chauffe-eau solaire, à gaz, au feu de bois) le
donne déjà ; les deux se seraient additionnés.

**Premières mesures, puis réglage** (graine 1, 300 parties). Avec les premiers chiffres (apport 1 / 0,4 / 0,15 / 0,05, seuils 5 /
12 / 25), sans que le simulateur creuse de latrines hors de l'enraciné, les nomades à six vivaient dans un abri insalubre :
nomade × 6, vivants à J200 81 → 70 %. Deux corrections : des seuils et des apports un peu plus doux (un groupe de quatre n'est jamais
insalubre, des feuillées suffisent à six), et, dans le simulateur, le nomade (et le mixte) à deux et plus creuse des feuillées là où
il s'installe (une demi-journée d'un seul, une matière de l'île), comme le ferait un groupe raisonnable. L'enraciné ne bâtit plus
le lavoir ni la douche : avec eux dans son ordre de construction, l'eau qu'ils prennent et les journées de chantier faisaient
baisser son autonomie (enraciné × 4 : 76 → 69 %, enraciné × 2 : 58 → 50 %). Après cela, les maladies de l'insalubrité sont rares
dans le simulateur (0,03 par partie au plus, sur 40 parties par cas) : la règle mord sur le groupe qui ne fait rien.

## 5. Les symptômes

Repris tels quels de `donnees/maladies/effets.json` : 30 symptômes, ceux de chaque affliction à ses stades actif et aggravé, le Gris
en six stades, l'évidence (fracture, brûlure, piqûre, choc) et le diagnostic (premiers secours avancés, zerbaz). Des « plusieurs
points à la fois » du 3D, la table garde ce qu'elle sait compter :

- **l'insomnie** (`sommeil` ≥ 1,3 dans le 3D) : le sommeil efface un quart de veille de moins ;
- **le moral** qu'un stade coûte (`moral` du 3D : 1 pour les aggravations, et pour le choc d'une perte) : **dans le contenu, au
  MJ** (`moralDuStade`, `symptomes()`), **pas appliqué par la logique**. Mesuré (graine 1, 300 parties) : appliqué d'office, il
  faisait partir les groupes nomades (vivants à J200, nomade × 6 : 81 → 74 % ; mixte × 6 : 86 → 80 % ; fins par départ, nomade
  × 2 : 9 → 17, mixte × 6 : 4 → 12) ; coupé seul, tout revenait (nomade × 6 82 %, mixte × 6 86 %, nomade × 2 72 %). Un point de
  moral sur cinq est trop gros pour le « 1 » du 3D, qui compte sur une échelle plus fine. Le MJ le raconte quand la scène le veut.

Les autres (vie, endurance, vitesse, soif, faim, envies, heure lue) sont des lectures de la fiche dans le 3D ; la table a déjà les
dés et la fatigue de chaque affliction. Le MJ les raconte (« une soif qui monte »).

## 6. Le bouclier

Le 3D : 30 % des touches de face (tôle), 45 % (doublé). La table : **une touche de Livide parée sur 5-6 (un tiers)**, sur 4-6 pour un
bouclier doublé (la moitié, à venir avec les suites d'armes du lot 6). Une touche parée ne blesse ni ne mord. Seulement contre les
Livides, comme dans le 3D. La marche ralentie (× 0,92) est laissée de côté ; le bouclier pèse déjà deux charges.

## 7. Les mesures

Même code de mesure des deux côtés : `node essais/outils/simuler-parties.mjs --parties 300 --graine <g>` (16 cas × 300 parties de
200 jours), joué sur `vague1` (commit a3a2965, **avant** le lot) et sur `lots-corps` (**après**), **graines 1 et 2** (9 600 parties
de chaque côté). Dans chaque case : graine 1 · graine 2 (moyenne).

| Cas | Vivants à J200, avant | après | Autonomes, avant | après | 1re faim, avant | après | Fins par départ, avant | après |
|---|---|---|---|---|---|---|---|---|
| passif × 1 | 12 · 15 (13,5) | 12 · 15 (13,5) | 37 · 36 | 37 · 36 | J17 · J17 | J17 · J17 | 1 · 3 | 1 · 3 |
| passif × 2 | 13 · 14 (13,5) | 13 · 14 (13,5) | 31 · 34 | 31 · 34 | J10 · J10 | J10 · J10 | 1 · 1 | 1 · 1 |
| passif × 4 | 12 · 14 (13,0) | 12 · 14 (13,0) | 28 · 29 | 28 · 29 | J7 · J7 | J7 · J7 | 0 · 0 | 0 · 0 |
| passif × 6 | 11 · 11 (11,0) | 11 · 11 (11,0) | 21 · 22 | 21 · 22 | J5 · J5 | J5 · J5 | 1 · 0 | 1 · 0 |
| nomade × 1 | 55 · 56 (55,5) | 55 · 56 (55,5) | 1 · 2 | 1 · 2 | J186 · J200 | J186 · J200 | 2 · 5 | 2 · 5 |
| nomade × 2 | 71 · 73 (72,0) | 72 · 74 (73,0) | 1 · 1 | 1 · 1 | J61 · J65 | J61 · J67 | 9 · 12 | 12 · 12 |
| nomade × 4 | 81 · 80 (80,5) | 78 · 84 (81,0) | 3 · 3 | 3 · 4 | J115 · J124 | J118 · J122 | 9 · 5 | 7 · 6 |
| nomade × 6 | 81 · 82 (81,5) | 82 · 80 (81,0) | 2 · 0 | 1 · 0 | J132 · J137 | J129 · J136 | 11 · 8 | 10 · 19 |
| enraciné × 1 | 57 · 56 (56,5) | 55 · 54 (54,5) | 72 · 72 | 70 · 67 | J21 · J28 | J21 · J29 | 2 · 1 | 2 · 2 |
| enraciné × 2 | 75 · 73 (74,0) | 78 · 74 (76,0) | 58 · 56 | 54 · 51 | J21 · J21 | J21 · J21 | 4 · 2 | 4 · 1 |
| enraciné × 4 | 88 · 82 (85,0) | 88 · 83 (85,5) | 76 · 74 | 72 · 74 | J21 · J21 | J27 · J28 | 1 · 2 | 2 · 2 |
| enraciné × 6 | 87 · 86 (86,5) | 83 · 87 (85,0) | 70 · 70 | 73 · 72 | J17 · J17 | J17 · J17 | 4 · 6 | 3 · 2 |
| mixte × 1 | 56 · 59 (57,5) | 58 · 57 (57,5) | 19 · 14 | 19 · 14 | J115 · J115 | J111 · J114 | 1 · 0 | 1 · 0 |
| mixte × 2 | 75 · 76 (75,5) | 73 · 76 (74,5) | 20 · 21 | 18 · 20 | J56 · J58 | J56 · J58 | 6 · 2 | 6 · 2 |
| mixte × 4 | 84 · 86 (85,0) | 84 · 86 (85,0) | 33 · 38 | 37 · 36 | J77 · J58 | J58 · J65 | 8 · 3 | 7 · 3 |
| mixte × 6 | 86 · 83 (84,5) | 86 · 86 (86,0) | 49 · 44 | 46 · 46 | J58 · J51 | J58 · J53 | 4 · 5 | 6 · 3 |

**Lecture.** Les cibles tiennent : les vivants à J200 restent à moins de 2 points de moyenne d'avant dans tous les cas (le passif,
qui ne fait rien de neuf, à l'identique ; nomade × 4 80,5 → 81,0 ; enraciné × 4 85,0 → 85,5 ; mixte × 4 85,0 → 85,0), les deux voies
restent proches, la première faim et l'autonomie restent dans leurs plages.

**Écarts relevés** (à surveiller, aucun hors du bruit de 300 parties sur la survie) :
- **L'autonomie de l'enraciné seul et à deux** baisse un peu (× 1 : 72 · 72 → 70 · 67 ; × 2 : 58 · 56 → 54 · 51). Les feuillées puis
  les latrines sèches prennent deux chantiers et du bois des alentours (matières de l'île) au moment où le petit groupe construit
  son eau et son potager ; à quatre et six, rien ne se voit (× 4 : 76 · 74 → 72 · 74 ; × 6 : 70 · 70 → 73 · 72). Leur survie ne bouge
  pas (× 2 : 74,0 → 76,0).
- **La première faim de l'enraciné × 4** recule (J21 → J27 · J28) : c'est un mieux (le site choisi et l'ordre de construction
  décalent le premier creux de vivres).
- **Les fins par départ du nomade × 6** : 11 · 8 → 10 · 19. La graine 1 ne bouge pas, la graine 2 double ; la survie, elle, ne bouge
  pas (81,5 → 81,0). Le moral appliqué d'office (§5) les faisait monter partout ; coupé, il reste cet écart sur une graine, qui peut
  être du bruit (le même cas variait de 3 à 12 entre deux états du 13 novembre). À remesurer à la fusion. **Remesuré** (rééquilibrage
  d'après les douze lots, `equilibre-3d.md`) sur 1 800 parties (graines 1 à 6) : `principale` 56, `vague1` 56, `vague2` 83,
  `vague3` 68, après le rééquilibrage 61 ; de 3 à 19 selon la graine. L'écart de `vague2` ne tient pas sur `vague3`.

**Ce que le lot fait dans le simulateur** (60 parties par cas, graine 2, comptées par le `controle` de `jouerPartie`) :

| Cas | Maladies de l'insalubrité / partie | Jours d'abri sales (insalubres) | Nuits blanches / partie | Endormis / partie | Hygiène bâtie (parties) |
|---|---|---|---|---|---|
| passif × 1 | 0,00 | 0 % (0 %) | 0,00 | 0,00 | — |
| passif × 2 | 0,00 | 0 % (0 %) | 0,12 | 0,02 | — |
| passif × 4 | 0,07 | 4 % (0 %) | 0,03 | 0,00 | — |
| passif × 6 | 0,13 | 12 % (1 %) | 0,03 | 0,00 | — |
| nomade × 1 | 0,00 | 0 % (0 %) | 2,18 | 0,12 | — |
| nomade × 2 | 0,00 | 0 % (0 %) | 3,78 | 0,27 | feuillées 15 |
| nomade × 4 | 0,03 | 0 % (0 %) | 17,28 | 0,87 | feuillées 35 |
| nomade × 6 | 0,02 | 0 % (0 %) | 45,35 | 3,63 | feuillées 30 |
| enraciné × 1 | 0,00 | 0 % (0 %) | 0,75 | 0,00 | feuillées 31, latrines sèches 29 |
| enraciné × 2 | 0,00 | 0 % (0 %) | 0,75 | 0,00 | feuillées 38, latrines sèches 36 |
| enraciné × 4 | 0,00 | 0 % (0 %) | 1,80 | 0,05 | feuillées 48, latrines sèches 47 |
| enraciné × 6 | 0,00 | 0 % (0 %) | 1,38 | 0,25 | feuillées 53, latrines sèches 53 |
| mixte × 1 | 0,00 | 0 % (0 %) | 1,38 | 0,08 | feuillées 18, latrines sèches 16 |
| mixte × 2 | 0,00 | 0 % (0 %) | 4,42 | 0,50 | feuillées 34, latrines sèches 30 |
| mixte × 4 | 0,02 | 0 % (0 %) | 8,93 | 0,73 | feuillées 46, latrines sèches 41 |
| mixte × 6 | 0,00 | 0 % (0 %) | 11,73 | 1,15 | feuillées 48, latrines sèches 45 |

- Les maladies de l'insalubrité sont rares partout (0,2 par partie au plus, pour le passif à six qui ne bâtit rien et vit dans un
  abri sale 12 % des jours) : la règle mord sur le groupe qui ne s'occupe pas de son abri, et la table en parle (journal du MJ).
- Les nuits blanches sont celles des déménagements (on marche la nuit en route) : nomade × 6, une quarantaine par partie (sept par
  personne pour douze déménagements), quelques endormis. Elles ne changent aucun résultat (§1, le malus coupé seul).
- L'enraciné bâtit des feuillées puis des latrines sèches dans presque toutes les parties ; le nomade creuse des feuillées à chaque
  site où il reste.

## 8. Ce qui ne change pas

Le tirage du monde (`hasardDuJour`), les menaces d'un abri propre, les récoltes, les fouilles, les dés d'un survivant reposé, la
morsure et le Gris (seule l'issue se tait), les fêtes (sauf le grand ménage qui nettoie l'abri). L'insalubrité a son propre flux de
hasard (« insalubrite|jour ») et ne tire rien pour un abri propre ou ordinaire. Un bouclier ne tire de dés que s'il est porté.
