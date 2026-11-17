# Équilibre du lot 10 : le marché chiffré, la porte, la religion et la table de gestion (2026-11-17)

Les chiffres du lot 10 du portage du jeu 3D (contrat §22) et leurs raisons. Ils sont dans le système : `REGLES_MARCHE.boutique`,
`.etal`, `.plan` (`logique/marche.mjs`), `REGLES_PORTE.suites` (`porte.mjs`), `ATTITUDES_RENCONTRE`, `TENTATIVES_PAR_JOUR`
(`generation.mjs`), `REGLES_ESPRIT.conversion` (`esprit.mjs`), `REGLES_RANGS` (`chefs.mjs`), `PRIORITE_MAX`, `PRIORITE_DEFAUT`
(`gestion.mjs`) ; et dans le contenu : les poids des religions (`contenu/religions.mjs`), le barème des objets
(`contenu/communaute.mjs`). Essais : `essais/survie-communaute.test.mjs` (logique), `survie-api-communaute.test.mjs` (API),
`contenu-communaute.test.mjs` (contenu et traduction).

Jordan a validé « tout maintenant » : les chiffres marqués « à valider » dans le jeu 3D sont repris tels quels, convertis au système
de FVTT (une part = un jour de nourriture = 2 au barème du jeu 3D ; la jauge de −40..40 ramenée à −10..10).

## 1. La liste commune des religions

| Religion (clé commune) | Ancienne clé de FVTT | Poids du jeu 3D (14/11) | Poids retenu | Fêtes | Observance |
|---|---|---|---|---|---|
| Catholique (`catholique`) | — | 46 | **45** | Noël, Pâques, la Toussaint | calme |
| Hindoue (`hindoue`) | `hindouisme-tamoul` | 16 | 16 | Dipavali, Cavadee, Nouvel An tamoul, marche sur le feu, Pongal | calme |
| Aucune (`aucune`) | — | 14 | 14 | — | (l'ancrage) |
| Hindoue catholique (`hindoue-catholique`) | (`plusieurs` : catholique + hindouisme tamoul) | 10 | 10 | celles des deux | calme |
| Musulmane (`musulmane`) | `islam` | 7 | 7 | ramadan, Aïd el-Kebir | calme |
| Protestante (`protestante`) | `evangelique` | 4 | 4 | Noël, Pâques | objet (la Bible) |
| Bouddhiste (`bouddhiste`) | `culte-chinois` | 3 | 3 | Nouvel An chinois | calme |
| Servis kabaré (`servis-kabare`) | `ancetres-malgaches` | — | **1** | la fête de la Liberté (20 décembre) | calme |
| Plusieurs à la fois (`plusieurs`) | — | — | **0** (se choisit) | celles qu'on tient | la plus exigeante |

**Pourquoi cette liste.** C'est celle que Jordan a validée pour le jeu 3D, avec ses noms (« hindoue catholique », « bouddhiste » tout
court), et elle suit mieux l'île que celle de FVTT : le catholicisme de la plupart des cases, l'hindouisme des Malbars, la double
appartenance malbare la plus courante (église et temple), l'islam des Z'arabes, des Comoriens et des Mahorais, les protestants
(surtout évangéliques), les bouddhistes chinois, et une part croissante sans religion. Deux ajouts au jeu 3D :

- **le servis kabaré** (1, pris sur la part catholique) : le culte des ancêtres venu de Madagascar et d'Afrique se pratique à
  La Réunion, presque toujours **en plus** de la messe ; rares sont ceux qui le donnent comme leur seule religion, d'où le poids 1. Le
  jeu de table l'avait (trois prétirés et PNJ, la fête de la Liberté) : le retirer aurait effacé une part de l'île ;
- **« plusieurs à la fois »** reste une entrée spéciale qu'on choisit sur la fiche (catholique et servis kabaré, bouddhiste et
  catholique…), sans se tirer : la religion double la plus répandue, « hindoue catholique », tient sa place au tirage.

**Les fiches existantes** gardent leur clé : chaque ancienne clé est un alias (contenu : `alias`), lu partout sous la nouvelle
(`cleReligion`, l'index du contenu) ; les phrases d'histoire gardent leurs clés de groupe. Ce qu'on écrit de neuf l'est sous la nouvelle
clé. Trois PNJ et prétirés passent de « plusieurs (catholique + hindouisme tamoul) » à « hindoue catholique » ; les autres changent
seulement de clé.

**Le tirage dans FVTT.** Les affinités par enfance de FVTT (une enfance rend une religion plus probable, jamais une règle) sont gardées.
Sur 5 000 survivants tirés (mêmes graines), avant → après :

| | catholique | hindoue | aucune | musulmane | hindoue catholique / plusieurs | protestante | bouddhiste | servis kabaré |
|---|---|---|---|---|---|---|---|---|
| avant (FVTT) | 39,0 | 12,4 | 15,6 | 10,3 | 10,2 (plusieurs) | 4,7 | 4,1 | 3,6 |
| après | 41,1 | 15,2 | 13,8 | 12,8 | 9,0 | 3,5 | 3,5 | 1,1 |

Les croyants pratiquants restent 38 à 39 % ; ceux dont l'observance tient à un objet (la Bible) passent de 112 à 69 sur 5 000.

**Un écart à signaler** : la part musulmane tirée (12,8 %) dépasse le poids (7) parce que trois enfances sur vingt-quatre de FVTT
(comorienne du Chaudron, à Mayotte, z'arabe de Saint-Pierre) font près de 9 % des tirages et rendent l'islam douze fois plus probable.
Ce n'est pas la liste qui pousse, c'est la part de ces enfances (voir « À trancher »).

## 2. Changer de religion

| Règle | Chiffre | Pourquoi |
|---|---|---|
| durée de la conversion | **30 jours** | « un bonus et un malus provisoires des deux religions » (Jordan, 14/11) : un mois, le temps de deux fêtes ou d'un carême |
| le bonus provisoire | les deux religions comptent pour prier ensemble (observance sur la route) et pour les fêtes (+1 moral au pratiquant) | il a encore ses habitudes et déjà ses nouveaux frères |
| le malus provisoire | l'observance la plus exigeante des deux ; le plafond du pratiquant reste à 0 (au lieu de +1) | il n'a « qu'une part » de la nouvelle foi : elle ne le porte pas encore |
| ce qui se sait | quitter sa religion, ou en changer deux fois en moins d'un an : une rumeur vraie, portée « quartier », 90 jours | « quitter une religion, ou en changer souvent, se sait par Ladi Lafé » |

Rien d'autre : aucune religion n'a d'effet propre, la conversion ne passe que par le moral et les observances.

## 3. Le marché chiffré

### Le barème du jeu 3D et le cours de FVTT

| Bien | Jeu 3D (barème) | ramené en parts (÷ 2) | Cours de FVTT, jour zéro | FVTT, le silence |
|---|---|---|---|---|
| eau | 1 | 0,5 | 1 (0,5 aux pluies) | idem |
| nourriture | 2 | 1 | 1 | 1 |
| plantes | 2 | 1 | 2 | 3 |
| matériaux | 2 | 1 | 2 | 2 |
| graines | 3 | 1,5 | 2 | 2 |
| carburant | 4 | 2 | 4 | 8 |
| munitions | 5 | 2,5 | 3 | 4,5 |
| pièces | 5 | 2,5 | 3 | 4,5 |
| médicaments | 6 | 3 | 5 | 7,5 |
| énergie | 3 | 1,5 | — (ne se troque pas) | — |

**Le cours de FVTT est gardé.** Le jeu 3D le dit lui-même : son barème est « une valeur fixe par ressource », sans phase ni saison.
Le cours de FVTT bouge avec la crise, et il a été rééquilibré le 13 novembre pour casser les rentes de l'atelier (plantes à 2 : au
barème du jeu 3D, deux plantes à 1 font une tisane qui vaut 3, +1 part par quart, la rente d'avant ; `equilibre-marche.md`). L'ordre
des biens est le même (eau < nourriture < matériaux, plantes < graines < carburant < munitions, pièces < médicaments) ; FVTT paie plus
cher ce qui se fait rare, ce qui est voulu.

**Ce qui entre** : la **valeur des objets** (`valeurObjet`) : le barème du jeu 3D pour ce qu'on ne fabrique pas et les bêtes vivantes
(fusil de chasse 20 parts, carabine et pistolet 17,5, tronçonneuse 22,5 ; poule et lapin 4, cabri 10, porcelet 12,5, veau moka 20,
essaim 7,5 ; cartes 3 à 6), sinon le coût de la recette au cours (sans le travail, comme le jeu 3D) ; la **valeur d'un plan**
(`valeurPlan`) : (6 + 0,4 × rareté) × 3 s'il est unique, ÷ 2 (le four à pain du jeu 3D ≈ 7,5 parts, le cahier unique de la
gramoune ≈ 66). Les plans restent un rabais (décision du 17/11) : leur valeur est ce qu'ils font économiser.

### La marge du commerçant

| Client | Confiance | Il vend à | Il rachète à | Plafond du carnet (10 parts) |
|---|---|---|---|---|
| réputation −10, parole 1 | 0,75 | 1,67 × | 0,45 × | 7,5 |
| réputation −5, parole 1 | 0,875 | 1,43 × | 0,53 × | 8,5 |
| inconnu (0), parole 1 | 1 | 1,25 × | 0,60 × | 10 |
| inconnu (0), parole 3 | 1,06 | 1,18 × | 0,64 × | 10,5 |
| réputation +5, parole 1 | 1,075 | 1,16 × | 0,65 × | 10,5 |
| réputation +10 (ou +5 et parole 5) | 1,15 | 1,09 × | 0,69 × | 11,5 |

- **La réputation, pas le sens moral** : dans le jeu 3D, la confiance suit la jauge rouge/bleu du client ; dans FVTT, un PNJ ne voit
  jamais cette jauge (contrat §14), seulement la réputation (ce que les témoins ont vu). C'est donc elle qui compte.
- **La borne de 1,15** reste sous √(1,25 / 0,6) ≈ 1,44 : acheter puis revendre au même commerçant coûte toujours (au mieux, on
  récupère 0,69 / 1,09 = 63 %).
- **Avec les préjugés** (§12) : la majoration des préjugés s'ajoute (× 1,25, × 1,5, × 2). Un préjugé léger chez le commerçant pèse
  autant que de passer d'une réputation nulle à −10 (1,25 → 1,56 contre 1,67) ; les deux se cumulent, ce qui est voulu : le préjugé
  est une affaire personnelle du commerçant, la réputation, ce que tout le quartier sait. Au troc de la main à la main (sans boutique),
  rien ne change : la majoration seule.
- **Un commerçant est resté dans 30 % des boutiques** (`ouvrirBoutique({ tirer: true })`).
- **La dette qui traîne** : 30 jours dans les deux jeux, rien à changer (`REGLES_MARCHE.carnet.traine`).

### L'étal

| Règle | Chiffre | Pourquoi |
|---|---|---|
| passants par jour de marché | 3 | une matinée de marché forain ; un étal ne vide pas un stock en un jour |
| chance qu'un passant prenne une unité | 0,5 au cours, × (cours / prix)², au plus 0,95 | au cours, 1,5 unité par jour de marché (six par mois) |
| recette par passant | 0,5 au cours ; 0,67 au mieux, à 0,7 × le cours ; 0,25 à deux fois le cours | brader fait vendre plus mais chaque unité rapporte moins : ni rente ni arbitrage |
| vol sans gardien | 10 % par jour de marché, le quart du bien le plus fourni | « un étal peut se faire voler » ; environ un vol tous les deux mois et demi |
| vol avec gardien | 2 % | quelqu'un du groupe reste (le MJ décide ce qu'il ne fait pas d'autre) |

Payé au cours dans le bien qu'on demande (`contre`), les fractions restent dans la caisse. Acheter à la boutique (1,25 × au moins
1,09) puis revendre à l'étal (au plus le cours) perd toujours.

## 4. La porte et l'inconnu

**Les pas du sens moral** : accueillir +5, refuser −5 sur −40..40 dans le jeu 3D, soit ±1,25 sur −10..10 ; FVTT garde **±1**
(`ACTES_MORAUX`), la jauge étant entière. Rien ne change.

**La suite d'un refus** (alignée sur le jeu 3D) :

| Jauge du refusé | Avant (FVTT) : part / feu / revient | Après : part / feu / revient |
|---|---|---|
| −10 | 30 / 70 / 0 | 60 / 40 / 0 |
| −5 | 30 / 70 / 0 | 60 / 30 / 10 |
| −3 | 30 / 70 / 0 | 60 / 26 / 14 |
| 0 | 75 / 10 / 15 | 60 / 20 / 20 |
| +3 | 40 / 0 / 60 | 60 / 14 / 26 |
| +5 | 40 / 0 / 60 | 60 / 10 / 30 |
| +10 | 40 / 0 / 60 | 60 / 0 / 40 |

Pourquoi : la règle du jeu 3D est continue (pas de marche à ±3) et plus sobre : la plupart des refusés comprennent, et la couleur ne
fait que pencher. Le feu d'un refusé rouge tombe de 70 à 30–40 % : refuser un dur reste risqué sans être une condamnation. Le
simulateur n'ouvre jamais la porte : aucune mesure n'en bouge.

**L'attitude d'un inconnu** (jeu 3D) : amicale 25 %, neutre 45 %, méfiante 22 %, hostile 8 % ; tirée avec la recrue (flux à part) et
proposée au MJ ; elle règle la difficulté de la recruter (facile, normale, difficile, extrême). **Une tentative par jour** : le jeu 3D
l'impose ; à la table, le système compte les tentatives et le rappelle, le MJ tranche (une scène d'insistance se joue).

## 5. Les rangs et la table de gestion

| Règle | Chiffre | Pourquoi |
|---|---|---|
| seconds | 3 au plus, dans l'ordre de succession | un groupe de table compte 3 à 8 personnes |
| nouveau | 7 jours, ou admis plus tôt | « nouveaux » du jeu 3D ; une semaine sous le même toit |
| succession | le premier second vivant et adulte ; sinon plus de chef | « le second succède au chef » ; « la mort coûte le rang » |
| crise d'autorité | le successeur est d'abord un second | idem ; sans second, le plus écouté, comme avant |
| priorités | 0 (jamais) à 4 ; 1 d'abord | le jeu 3D ; à égalité, le meilleur niveau |
| grille par défaut | la tâche de la répartition en 1, ce qu'il sait faire en 3 | `PRIORITE_DE_LA_REPARTITION`, `PRIORITE_D_ORIGINE` du jeu 3D |
| quotas | 1 à 7 jours par semaine, suivis, sans punition | « un quota est une demande suivie et affichée, sans punition automatique » |
| corvées | 26, de la couleur | `taches.json` du jeu 3D ; aucune n'a d'effet |

**La correspondance tâche → compétence** (jeu 3D, `JOURNAL.md`) a été vérifiée contre le §10.3 : fouiller en discrétion, récolter et
soigner une bête en survie (cultures, élevage), bâtir et réparer en bricolage (chantier, atelier), commercer en parole (négociation),
garder en vigilance : **identique**, rien à changer. **Les PNJ apprennent comme les joueurs** : une tâche tenue sept jours donne une
marque à tout membre, joueur ou non (déjà le cas, `etat.mjs`).

Le simulateur ne nomme ni chef ni second, ne pose ni grille ni quota : ces règles ne déplacent aucune de ses mesures.

## 6. Les deux défauts de la fusion de la vague 1

- **Le témoin n'est jamais l'auteur** : un jeune de 16 ou 17 ans qui colporte (ou fait tout autre acte) le porte et ne réagit plus en
  « enfant témoin » à son propre acte (`enfantsTemoins`, `porterActe` → `temoignageEnfants`). Les autres jeunes présents restent
  témoins ; un jeune qui a voté contre un acte du groupe ne le porte pas et en est témoin.
- **Pas d'homonyme** : le générateur ne tire plus le nom d'un survivant déjà là (le groupe, le monde, ceux qui attendent à la porte) ;
  sans homonyme, aucun tirage ne change (le nom n'est retiré que s'il est pris). Et un nom porté par deux survivants ne désigne plus
  personne (la rumeur, l'acte, le préjugé joué au troc) : jamais le mauvais.

Les essais de `survie-api-esprit.test.mjs` et `survie-jointures.test.mjs` qui contournaient ces défauts par des graines fixes restent
verts ; leurs graines ne sont plus nécessaires, elles restent pour que les essais soient reproductibles.

## 7. Mesures : avant et après le lot

Même code de mesure des deux côtés, sur la branche `vague1` au départ du lot (commit a3a2965) et après le lot : 200 jours,
`simuler-parties.mjs --parties 300 --graine 1, 2, 3` (300 parties par cas, 14 400 par état) ; un an, `parties-longues.mjs
--graines 40 --serie g, h, i` (120 parties par scénario).

Ce qui peut bouger dans le simulateur : seulement le **tirage de la religion** (poids, affinités, « plusieurs » remplacée par la
religion double), qui change qui pratique et quelle observance il tient. Le simulateur n'ouvre pas la porte, ne troque pas, ne nomme
ni chef ni second et ne pose ni grille ni quota : le reste du lot ne le touche pas.

| Cas | Vivants à J200 avant (g1 | g2 | g3) | après | 1re faim avant | après | autonomes avant | après | départ de tous avant | après |
|---|---|---|---|---|---|---|---|---|
| passif × 1 | 12 % \| 15 % \| 12 % (moy. 13.0) | 13 % \| 15 % \| 12 % (moy. 13.3) | J17 \| J17 \| J16 | J17 \| J17 \| J16 | 37 \| 36 \| 35 | 37 \| 36 \| 35 | 0 % \| 1 % \| 1 % | 0 % \| 1 % \| 1 % |
| passif × 2 | 13 % \| 14 % \| 14 % (moy. 13.7) | 13 % \| 14 % \| 14 % (moy. 13.7) | J10 \| J10 \| J10 | J10 \| J10 \| J10 | 31 \| 34 \| 35 | 31 \| 34 \| 35 | 0 % \| 0 % \| 0 % | 0 % \| 0 % \| 0 % |
| passif × 4 | 12 % \| 14 % \| 14 % (moy. 13.3) | 12 % \| 13 % \| 13 % (moy. 12.7) | J7 \| J7 \| J7 | J7 \| J7 \| J7 | 28 \| 29 \| 28 | 28 \| 29 \| 28 | 0 % \| 0 % \| 0 % | 0 % \| 0 % \| 0 % |
| passif × 6 | 11 % \| 11 % \| 10 % (moy. 10.7) | 11 % \| 11 % \| 10 % (moy. 10.7) | J5 \| J5 \| J5 | J5 \| J5 \| J5 | 21 \| 22 \| 20 | 21 \| 22 \| 20 | 0 % \| 0 % \| 0 % | 0 % \| 0 % \| 0 % |
| nomade × 1 | 55 % \| 56 % \| 54 % (moy. 55.0) | 56 % \| 57 % \| 55 % (moy. 56.0) | J186 \| J200 \| J198 | J189 \| J200 \| J198 | 1 \| 2 \| 2 | 1 \| 2 \| 2 | 1 % \| 2 % \| 1 % | 1 % \| 2 % \| 1 % |
| nomade × 2 | 71 % \| 73 % \| 76 % (moy. 73.3) | 71 % \| 73 % \| 76 % (moy. 73.3) | J61 \| J65 \| J65 | J64 \| J65 \| J65 | 1 \| 1 \| 3 | 1 \| 1 \| 3 | 3 % \| 4 % \| 3 % | 3 % \| 4 % \| 2 % |
| nomade × 4 | 81 % \| 80 % \| 85 % (moy. 82.0) | 79 % \| 82 % \| 85 % (moy. 82.0) | J115 \| J124 \| J124 | J115 \| J124 \| J124 | 3 \| 3 \| 4 | 3 \| 3 \| 5 | 3 % \| 2 % \| 3 % | 3 % \| 1 % \| 3 % |
| nomade × 6 | 81 % \| 82 % \| 85 % (moy. 82.7) | 81 % \| 82 % \| 84 % (moy. 82.3) | J132 \| J137 \| J138 | J132 \| J136 \| J138 | 2 \| 0 \| 1 | 2 \| 0 \| 1 | 4 % \| 3 % \| 3 % | 3 % \| 3 % \| 4 % |
| enracine × 1 | 57 % \| 56 % \| 53 % (moy. 55.3) | 58 % \| 56 % \| 53 % (moy. 55.7) | J21 \| J28 \| J26 | J21 \| J28 \| J26 | 72 \| 72 \| 72 | 72 \| 72 \| 72 | 1 % \| 0 % \| 2 % | 1 % \| 0 % \| 2 % |
| enracine × 2 | 75 % \| 73 % \| 70 % (moy. 72.7) | 75 % \| 73 % \| 70 % (moy. 72.7) | J21 \| J21 \| J27 | J21 \| J21 \| J27 | 58 \| 56 \| 55 | 58 \| 56 \| 55 | 1 % \| 1 % \| 1 % | 1 % \| 1 % \| 1 % |
| enracine × 4 | 88 % \| 82 % \| 85 % (moy. 85.0) | 87 % \| 82 % \| 85 % (moy. 84.7) | J21 \| J21 \| J21 | J21 \| J21 \| J21 | 76 \| 74 \| 72 | 76 \| 74 \| 72 | 0 % \| 1 % \| 0 % | 0 % \| 1 % \| 0 % |
| enracine × 6 | 87 % \| 86 % \| 89 % (moy. 87.3) | 87 % \| 86 % \| 89 % (moy. 87.3) | J17 \| J17 \| J17 | J17 \| J17 \| J17 | 70 \| 70 \| 69 | 70 \| 71 \| 70 | 1 % \| 2 % \| 1 % | 1 % \| 2 % \| 1 % |
| mixte × 1 | 56 % \| 59 % \| 56 % (moy. 57.0) | 56 % \| 59 % \| 56 % (moy. 57.0) | J115 \| J115 \| J115 | J115 \| J115 \| J115 | 19 \| 14 \| 19 | 19 \| 14 \| 19 | 0 % \| 0 % \| 1 % | 0 % \| 0 % \| 1 % |
| mixte × 2 | 75 % \| 76 % \| 81 % (moy. 77.3) | 75 % \| 75 % \| 80 % (moy. 76.7) | J56 \| J58 \| J58 | J56 \| J58 \| J58 | 20 \| 21 \| 19 | 20 \| 21 \| 20 | 2 % \| 1 % \| 1 % | 2 % \| 0 % \| 1 % |
| mixte × 4 | 84 % \| 86 % \| 87 % (moy. 85.7) | 84 % \| 85 % \| 87 % (moy. 85.3) | J77 \| J58 \| J66 | J72 \| J58 \| J66 | 33 \| 38 \| 41 | 33 \| 39 \| 41 | 3 % \| 1 % \| 1 % | 3 % \| 1 % \| 1 % |
| mixte × 6 | 86 % \| 83 % \| 83 % (moy. 84.0) | 86 % \| 84 % \| 83 % (moy. 84.3) | J58 \| J51 \| J54 | J58 \| J51 \| J53 | 49 \| 44 \| 42 | 49 \| 44 \| 42 | 1 % \| 2 % \| 3 % | 1 % \| 2 % \| 3 % |

| Scénario (365 jours) | vivants à la fin, avant (g · h · i) | après |
|---|---|---|
| sedentaire-4 | 14.7 (17 · 13 · 14) | 14.7 (17 · 13 · 14) |
| sedentaire-2 | 11.3 (9 · 10 · 15) | 11.3 (9 · 10 · 15) |
| seul-enracine | 12.0 (11 · 15 · 10) | 12.0 (11 · 15 · 10) |
| seul-sedentaire | 9.3 (9 · 9 · 10) | 9.3 (9 · 9 · 10) |
| seul-nomade | 17.0 (19 · 17 · 15) | 18.0 (20 · 19 · 15) |
| compagnons | 26.7 (26 · 27 · 27) | 26.7 (25 · 28 · 27) |
| humains-4 | 29.3 (29 · 28 · 31) | 28.7 (28 · 28 · 30) |
| recrues | 18.7 (20 · 18 · 18) | 18.0 (19 · 17 · 18) |
| sans-recrues | 18.3 (19 · 18 · 18) | 18.0 (18 · 18 · 18) |
| nomade-4 | 19.7 (17 · 19 · 23) | 18.7 (16 · 18 · 22) |
| mixte-4 | 25.3 (27 · 27 · 22) | 25.0 (26 · 27 · 22) |

**Lecture.** Aucun écart au-delà du bruit des graines : à J200, tous les cas restent à un point près (nomade × 1 +1, passif × 4
−0,6, mixte × 2 −0,6 ; les autres à ±0,4) ; la première faim, l'autonomie et les fins par départ ne bougent pas (un point au plus
sur une graine). Sur un an, les écarts tiennent dans une ou deux parties sur quarante (nomade seul +1,0, nomade × 4 −1,0, humains × 4
−0,7, recrues −0,7) : moins que l'écart d'une série à l'autre pour un même scénario (3 à 6 parties). La borne du nomade
(`survie-equilibre.test.mjs`) reste dans ses bornes. Aucun chiffre d'équilibre n'est donc à reprendre.

## À trancher (Jordan)

- **La part musulmane tirée** (12,8 % pour un poids de 7) : elle vient des trois enfances musulmanes de FVTT (près de 9 % des tirages).
  Pour retrouver ~7 %, deux voies : baisser le poids de ces enfances au tirage, ou l'affinité (× 12 → × 4 : environ 11 %). Rien n'est
  changé tant que Jordan n'a pas dit.
- **Le servis kabaré** dans la liste commune (1 sur 100) : à reporter dans le jeu 3D (sa clé `servis-kabare`), ou à retirer des
  deux jeux (les fiches qui le portent garderaient leur clé, lue comme un alias).
- **La suite d'un refus** alignée sur le jeu 3D : le refusé rouge allume moins souvent le feu (30–40 % au lieu de 70 %).
- **Le cours de FVTT gardé** plutôt que le barème fixe du jeu 3D (les rentes de l'atelier) : à confirmer.
- **Une tentative par jour** : comptée et rappelée, pas interdite ; à rendre stricte si Jordan le veut.
