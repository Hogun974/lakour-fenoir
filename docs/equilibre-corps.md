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

MESURES
