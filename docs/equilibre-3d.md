# Rééquilibrage d'après les douze lots du jeu 3D (2026-11-17, branche `equilibre-3d`)

Les douze lots portés du jeu 3D (vagues 1, 2 et 3, contrat §16 à §29) ont déplacé l'équilibre : sur un an, les groupes qui restent sur
place mouraient davantage depuis la vague 3, les passifs perdaient quelques points à J200, la part musulmane au tirage était presque le
double de son poids. Cette passe retrouve l'équilibre d'origine (`equilibre.md`, « Rééquilibrage du 2026-11-13 ») **sans changer une
règle de fond ni retirer une nouveauté**. Il n'y a qu'un chiffre du jeu qui change (le tirage de la foi) ; le reste était le
**simulateur qui jouait mal des nouveautés** : il a été corrigé, pas le jeu.

## 1. Comment c'est mesuré

Cinq états, chacun avec son propre simulateur : `principale` (a243e96, avant les douze lots), `vague1`, `vague2`, `vague3` (7db43e9),
et **après** (cette branche).

- **Un an** : `parties-longues.mjs`, 40 graines par série, **six séries** (g à l : 240 parties par scénario, ramenées sur 40). À 240
  parties, un scénario bouge de ± 1,3 sur 40 sans qu'aucune règle ne change ; deux variantes jouées sur les mêmes graines s'écartent
  moins (beaucoup de parties restent identiques).
- **200 jours** : `simuler-parties.mjs --parties 300`, **graines 1, 2 et 3** (16 cas, 14 400 parties par état).
- **Le nomade × 6** : 300 parties, graines 1 à 6 (1 800 parties).
- **La borne du nomade** : l'essai « le nomade à 4 » (20 parties) rejoué sur 40 graines (1 à 40), mêmes bornes.
- **La part de chaque lot** : deux façons. (1) **Couper une règle** sur `vague3` (option `--couper` des deux outils, nouvelle :
  `COUPURES` de `simuler-parties.mjs`, jamais dans le jeu) et rejouer les mêmes graines. (2) **Rejouer chaque étape de la fusion de la
  vague 3** (après ateliers, fouille, bâtir, vivant, paradis, doublons) : une coupure retire une règle, l'étape montre aussi ce que le
  simulateur fait des installations nouvelles.

## 2. La part de chaque lot dans la perte des sédentaires

### 2.1 Une règle coupée à la fois (sur `vague3`, un an, vivants sur 40, écart à `vague3`)

| | sedentaire-4 | sedentaire-2 | seul-sedentaire | humains-4 | compagnons | recrues | sans-recrues |
|---|---|---|---|---|---|---|---|
| `vague3` | 12,3 | 11,8 | 7,0 | 23,7 | 27,3 | 20,0 | 16,7 |
| soif-betes | 12,3 (+0,0) | 12,0 (+0,2) | 7,3 (+0,3) | 23,8 (+0,2) | 27,7 (+0,3) | 20,0 (+0,0) | 17,0 (+0,3) |
| usure | 13,5 (+1,2) | 12,8 (+1,0) | 8,2 (+1,2) | 23,0 (−0,7) | 27,3 (+0,0) | 19,3 (−0,7) | 17,0 (+0,3) |
| cyclone-tole | 12,7 (+0,3) | 12,0 (+0,2) | 7,2 (+0,2) | 23,5 (−0,2) | 27,0 (−0,3) | 20,2 (+0,2) | 16,7 (+0,0) |
| cyclone-materiaux | 13,2 (+0,8) | 12,5 (+0,7) | 6,8 (−0,2) | 23,8 (+0,2) | 27,2 (−0,2) | 19,5 (−0,5) | 17,0 (+0,3) |
| chaleur | 13,0 (+0,7) | 11,8 (+0,0) | 7,0 (+0,0) | 25,2 (+1,5) | 28,5 (+1,2) | 20,7 (+0,7) | 16,8 (+0,2) |
| agglutines | 12,3 (+0,0) | 11,8 (+0,0) | 7,0 (+0,0) | 23,7 (+0,0) | 27,3 (+0,0) | 20,0 (+0,0) | 16,7 (+0,0) |
| corps | 12,7 (+0,3) | 11,7 (−0,2) | 7,0 (+0,0) | 24,0 (+0,3) | 27,3 (+0,0) | 20,3 (+0,3) | 16,7 (+0,0) |
| hygiene | 12,5 (+0,2) | 11,8 (+0,0) | 7,0 (+0,0) | 23,5 (−0,2) | 27,5 (+0,2) | 19,8 (−0,2) | 16,7 (+0,0) |
| odeur | 13,8 (+1,5) | 11,3 (−0,5) | 7,2 (+0,2) | 24,3 (+0,7) | 28,7 (+1,3) | 20,7 (+0,7) | 16,8 (+0,2) |
| sans-lieux | 12,3 (+0,0) | 12,2 (+0,3) | 7,0 (+0,0) | 25,2 (+1,5) | 26,8 (−0,5) | 19,5 (−0,5) | 16,8 (+0,2) |
| tout | 16,0 (+3,7) | 15,3 (+3,5) | 9,0 (+2,0) | 25,7 (+2,0) | 29,8 (+2,5) | 21,3 (+1,3) | 19,5 (+2,8) |
| `vague2` | 13,3 (+1,0) | 13,0 (+1,2) | 10,3 (+3,3) | 26,2 (+2,5) | 27,3 (+0,0) | 18,3 (−1,7) | 19,0 (+2,3) |

`soif-betes` : les bêtes ne boivent plus (lot 8) ; `usure` : ni entretien ni panne (lot 7) ; `cyclone-tole` : la tôle au cyclone comme
avant le lot 7 (25 % par point) ; `cyclone-materiaux` : tous les matériaux ainsi ; `chaleur` : la chaleur d'un lieu ne monte plus (lot 9,
donc ni arrivants, ni agglutinés, ni hordes attirées) ; `agglutines` : aucun arrivant ne reste ; `corps` : les corps frais ne salissent ni
ne sentent ; `hygiene` : l'abri ne se salit plus (lot « corps ») ; `odeur` : l'odeur n'attire plus rien (lot « sens ») ; `sans-lieux` : la
fouille d'avant le lot 5 ; `tout` : les sept premières ensemble (sans les agglutinés ni les lieux).

**Les passifs à J200** (vivants en %, moyenne des graines 1 à 3, 900 parties par cas) :

| | passif × 1 | passif × 2 | passif × 4 | passif × 6 |
|---|---|---|---|---|
| `principale` | 13,2 | 13,3 | 13,1 | 10,6 |
| `vague3` | 10,0 | 10,1 | 10,0 | 6,8 |
| cyclone-tole | 10,1 | 10,1 | 10,0 | 6,8 |
| cyclone-materiaux | 10,9 | 10,9 | 10,4 | 6,9 |
| soif-betes | 10,3 | 10,4 | 10,4 | 8,4 |
| usure | 11,7 | 12,0 | 11,1 | 7,0 |
| chaleur | 10,0 | 10,1 | 10,0 | 6,8 |
| odeur | 10,0 | 10,1 | 10,0 | 6,8 |
| hygiene | 10,0 | 10,1 | 10,0 | 6,8 |
| tout | 12,8 | 13,1 | 12,0 | 9,3 |
| le passif entretient (seul) | 11,4 | 11,4 | 11,2 | 7,0 |
| **après** (tout le rééquilibrage) | 11,7 | 11,6 | 11,6 | 7,1 |

### 2.2 Étape par étape (fusion de la vague 3, un an, vivants sur 40, écart à `vague2`)

| | sedentaire-4 | sedentaire-2 | seul-sedentaire | humains-4 | compagnons |
|---|---|---|---|---|---|
| `vague2` | 13,3 | 13,0 | 10,3 | 26,2 | 27,3 |
| + ateliers | 13,5 (+0,2) | 13,3 (+0,3) | 10,5 (+0,2) | 25,3 (−0,8) | 28,3 (+1,0) |
| + fouille | 13,5 (+0,2) | 12,8 (−0,2) | 10,5 (+0,2) | 24,8 (−1,3) | 28,8 (+1,5) |
| + bâtir | 15,5 (+2,2) | 15,0 (+2,0) | 11,5 (+1,2) | 24,0 (−2,2) | 29,3 (+2,0) |
| + vivant | 13,2 (−0,2) | 11,8 (−1,2) | 6,8 (−3,5) | 25,3 (−0,8) | 28,5 (+1,2) |
| + paradis | 12,7 (−0,7) | 12,0 (−1,0) | 6,8 (−3,5) | 22,7 (−3,5) | 28,5 (+1,2) |
| + doublons | 12,3 (−1,0) | 12,0 (−1,0) | 6,8 (−3,5) | 23,7 (−2,5) | 28,5 (+1,2) |
| `vague3` | 12,3 (−1,0) | 11,8 (−1,2) | 7,0 (−3,3) | 23,7 (−2,5) | 27,3 (+0,0) |

### 2.3 Ce qu'il faut en retenir

- **Le seul sédentaire** (10,3 → 7,0) meurt **de soif** (17 → 56 fins sur 240), pas d'infection (78 → 71) ni d'assauts (50 → 46).
  C'est **l'étape du lot 8** (vivant) : 11,5 → 6,8. Aucune règle coupée seule ne le rend (l'usure +1,2, les bêtes qui boivent +0,3) :
  c'est le **simulateur** qui bâtissait une treille, une bananeraie, des bacs, un jardin de zerbaz, une basse-cour sur le surplus d'eau
  **de la saison des pluies** ; à la saison sèche, ils buvaient la réserve (sur 29 solos morts de soif, séries g, h, i : 29 avaient une
  citerne, 18 une treille et une bananeraie, 16 une basse-cour).
- **Les sédentaires à deux et à quatre** : même cause (lot 8, −1,2 et −2,3), plus le lot 9 (−0,5) ; le lot 7 les avait d'abord aidés
  (+2,0 : le boucan conserve, le puits creusé abreuve). En règles coupées : l'usure (+1,2), l'odeur (+1,5 à quatre : le boucan, la soue,
  l'étable sentent), le cyclone sur tous les matériaux (+0,8).
- **Les humains × 4** (26,2 → 23,7) : surtout **le lot 9** (−2,6 à son étape ; la chaleur coupée : +1,5), le prix du paradis voulu par
  ce lot (« l'enracinement paie le paradis de quelques points », `equilibre-paradis.md` § 6.1), plus la soif du lot 8.
- **Les compagnons** ne perdaient rien sur 240 parties (27,3 → 27,3) : le « 14 → 10 sur 20 » de `equilibre-vague3.md` était le bruit
  de vingt graines.
- **Les passifs** (13,1 → 10,0 % à quatre, 10,6 → 6,8 % à six) : **l'usure** (le passif ne soigne jamais : sa citerne et son captage
  tombent hors service en deux cents jours), puis les bêtes du site qui boivent (à six) ; **la tôle au cyclone n'y est pour rien**
  (0,0) ; la chaleur, l'odeur, l'hygiène non plus (le passif reste silencieux, sa chaleur ne monte pas).
- **Les agglutinés** ne jouent jamais dans le simulateur (coupés : mêmes parties) : les rondes et la tournée les tiennent.

## 3. Ce qui change

### 3.1 Le simulateur (il jouait mal des nouveautés ; aucune règle du jeu ne change)

| Ce qu'il faisait | Ce qu'il fait | Lot | Pourquoi |
|---|---|---|---|
| bâtissait ce qui boit (vivant, hygiène à eau) sur le surplus d'eau **du jour** ; la basse-cour et l'enclos à cabris, jamais regardés | sur le surplus du jour **et de la saison sèche** (bilan sans délestage), basse-cour, enclos et bassin compris | 8 | le surplus de la saison des pluies buvait la réserve de la saison sèche : les sédentaires mouraient de soif |
| en sécheresse, gardait un couple de chaque cheptel | quand le bilan d'eau est aussi négatif, mange tout ce qui boit | 8 | un enclos boit autant avec deux bêtes qu'avec dix (seul un cheptel vide ne boit pas) : garder le couple ne sauvait pas une goutte |
| le passif ne faisait rien que la garde | il passe un quart sur un entretien dû, le geste de l'enraciné oisif | 7 | l'entretien n'existait pas quand le passif a été défini ; sans lui, sa citerne tombait hors service |
| seul ou à deux, l'enraciné creusait feuillées et latrines avant l'eau et le potager | une fois autonome | « corps » | ces chantiers coûtaient deux points d'autonomie à deux ; seul ou à deux, l'abri reste « ordinaire » sans latrines |
| — | option `--couper` (mesure) | — | trouver la part de chaque règle |

Essayé et écarté : cesser d'arroser les plants du vivant en sécheresse (avec le jugement sur la saison sèche, il ne se déclenchait plus :
mêmes parties sur 3 120) ; la basse-cour jugée sur le surplus du jour seulement (sans effet : 7,0 → 7,0 pour le seul sédentaire).

### 3.2 Le jeu : un seul chiffre

| Chiffre | Avant | Après | Pourquoi |
|---|---|---|---|
| Affinité de la foi musulmane pour les enfances à Mayotte, comorienne du Chaudron, z'arabe de Saint-Pierre (`religions.mjs`) | × 12 | **× 2** | le poids 7 compte déjà ces familles de l'île ; à × 12, quatre sur cinq de ces enfances tiraient l'islam |
| Poids au tirage de ces trois enfances (`enfances.mjs`) | 1 | **0,5** | même à × 1, elles portaient la part à 8,5 % : il fallait aussi qu'elles soient moins fréquentes |

**La part musulmane** (5 000 tirages par graine, graines `foi-1` à `foi-15`, 75 000 tirages) : **13,3 % → 8,0 %** (de 7,3 à 8,7 % selon la
graine) ; ces trois enfances font 4,8 % des tirages au lieu de 9,3 %, et deux sur cinq tirent l'islam (quatre sur cinq avant). Essayé :
× 1,5 et 0,5 (7,6 % sur dix graines, une sur trois) ; × 2 et 0,4 (7,6 %) ; × 3 et 0,3 (8,0 %, mais ces enfances à 3,2 % des tirages) ;
× 2 et 1 (9,9 %) ; × 1 et 1 (8,5 %). Gardé × 2 et 0,5 : le plus près de 7 à 8 % sur quinze graines, avec des enfances encore présentes.

Préparés puis laissés (la correction du simulateur suffisait aux sédentaires) : la chaleur plus lente (`parJour` 0,05 → 0,04) et les
hordes moins attirées par elle (0,01 → 0,005 par point), arrêtés avant la fin de leur mesure ; l'entretien une fois et demie moins
souvent, mesuré sur les passifs (+1,0 point à J200, autant que faire entretenir le passif, mais pour tout le monde).

## 4. Les mesures

### 4.1 Un an (vivants sur 40, six séries, 240 parties par scénario)

| | sedentaire-4 | sedentaire-2 | seul-enracine | seul-sedentaire | seul-nomade | compagnons | humains-4 | recrues | sans-recrues | nomade-4 | mixte-4 | rallumer-4 | sans-rondes-4 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| `principale` | 13,5 (+0,2) | 13,0 (+0,0) | 10,8 (−1,7) | 10,3 (+0,0) | 15,8 (+0,2) | 27,0 (−0,3) | 25,7 (−0,5) | 18,7 (+0,3) | 18,0 (−1,0) | 18,8 (−1,7) | 24,2 (+1,7) | — | — |
| `vague1` | 14,0 (+0,7) | 12,8 (−0,2) | 11,2 (−1,3) | 10,2 (−0,2) | 15,2 (−0,5) | 26,0 (−1,3) | 27,8 (+1,7) | 18,7 (+0,3) | 17,8 (−1,2) | 21,2 (+0,7) | 24,3 (+1,8) | — | — |
| `vague2` | 13,3 | 13,0 | 12,5 | 10,3 | 15,7 | 27,3 | 26,2 | 18,3 | 19,0 | 20,5 | 22,5 | — | — |
| `vague3` | 12,3 (−1,0) | 11,8 (−1,2) | 11,8 (−0,7) | 7,0 (−3,3) | 16,2 (+0,5) | 27,3 (+0,0) | 23,7 (−2,5) | 20,0 (+1,7) | 16,7 (−2,3) | 21,5 (+1,0) | 26,2 (+3,7) | 20,8 | 24,0 |
| **après** | 15,8 (+2,5) | 15,5 (+2,5) | 12,3 (−0,2) | 10,8 (+0,5) | 16,7 (+1,0) | 27,0 (−0,3) | 24,5 (−1,7) | 21,0 (+2,7) | 20,3 (+1,3) | 22,8 (+2,3) | 25,5 (+3,0) | 21,3 | 24,5 |

**Fins par la soif, l'infection et les assauts** (sur 240) :

| Scénario | `principale` | `vague2` | `vague3` | après |
|---|---|---|---|---|
| seul-sedentaire | 21 · 74 · 49 | 17 · 78 · 50 | 56 · 71 · 46 | 22 · 76 · 50 |
| sedentaire-2 | 54 · 54 · 19 | 52 · 43 · 24 | 79 · 49 · 12 | 51 · 46 · 16 |
| sedentaire-4 | 97 · 35 · 13 | 82 · 38 · 21 | 99 · 34 · 17 | 77 · 38 · 17 |
| humains-4 | 36 · 19 · 11 | 36 · 21 · 7 | 45 · 25 · 9 | 31 · 23 · 17 |
| compagnons | 37 · 20 · 6 | 33 · 17 · 12 | 30 · 22 · 10 | 26 · 21 · 15 |

### 4.2 Deux cents jours (graine 1 · 2 · 3, 300 parties par cas et par graine ; vivants et autonomes en %, entre parenthèses la moyenne des vivants)

| Cas | vivants : `principale` | `vague3` | après | autonomes : `principale` | `vague3` | après | 1re faim : `principale` | `vague3` | après |
|---|---|---|---|---|---|---|---|---|---|
| passif × 1 | 13 · 15 · 12 (13,2) | 9 · 11 · 10 (10,0) | **11 · 12 · 11 (11,7)** | 37 · 36 · 35 | 37 · 36 · 34 | 37 · 36 · 34 | J17 · J17 · J16 | J17 · J17 · J16 | J17 · J17 · J16 |
| passif × 2 | 13 · 14 · 14 (13,3) | 9 · 12 · 10 (10,1) | **10 · 14 · 11 (11,6)** | 31 · 34 · 35 | 32 · 34 · 36 | 32 · 34 · 36 | J10 · J10 · J10 | J10 · J10 · J10 | J10 · J10 · J10 |
| passif × 4 | 12 · 13 · 14 (13,1) | 9 · 11 · 10 (10,0) | **12 · 11 · 12 (11,6)** | 28 · 29 · 28 | 30 · 29 · 29 | 30 · 29 · 29 | J7 · J7 · J7 | J7 · J7 · J7 | J7 · J7 · J7 |
| passif × 6 | 11 · 11 · 10 (10,6) | 8 · 5 · 7 (6,8) | **9 · 5 · 7 (7,1)** | 21 · 22 · 20 | 18 · 18 · 18 | 19 · 20 · 19 | J5 · J5 · J5 | J5 · J5 · J5 | J5 · J5 · J5 |
| nomade × 1 | 55 · 57 · 54 (55,3) | 57 · 54 · 50 (53,6) | **59 · 54 · 49 (53,8)** | 1 · 2 · 2 | 0 · 1 · 2 | 0 · 1 · 2 | J189 · J200 · J200 | J200 · J200 · J200 | J200 · J200 · J200 |
| nomade × 2 | 71 · 73 · 75 (73,0) | 75 · 74 · 76 (74,9) | **76 · 73 · 73 (73,7)** | 1 · 1 · 3 | 0 · 2 · 3 | 0 · 2 · 3 | J66 · J82 · J69 | J65 · J67 · J65 | J65 · J65 · J65 |
| nomade × 4 | 81 · 82 · 85 (82,7) | 84 · 81 · 84 (83,1) | **83 · 80 · 85 (82,9)** | 3 · 3 · 4 | 3 · 2 · 2 | 3 · 1 · 2 | J115 · J124 · J131 | J121 · J127 · J124 | J126 · J127 · J125 |
| nomade × 6 | 84 · 86 · 82 (84,0) | 81 · 80 · 84 (81,8) | **81 · 81 · 82 (81,1)** | 2 · 0 · 0 | 2 · 0 · 0 | 2 · 0 · 0 | J132 · J142 · J133 | J128 · J129 · J132 | J122 · J131 · J129 |
| enraciné × 1 | 57 · 56 · 54 (55,8) | 57 · 60 · 59 (58,6) | **57 · 63 · 61 (60,4)** | 73 · 72 · 73 | 79 · 76 · 77 | 79 · 76 · 77 | J21 · J28 · J21 | J21 · J21 · J21 | J21 · J21 · J21 |
| enraciné × 2 | 77 · 71 · 72 (73,3) | 73 · 74 · 74 (73,9) | **77 · 77 · 77 (76,7)** | 59 · 57 · 57 | 58 · 53 · 56 | 59 · 57 · 58 | J21 · J21 · J21 | J17 · J17 · J17 | J17 · J17 · J17 |
| enraciné × 4 | 88 · 85 · 88 (87,1) | 83 · 83 · 84 (83,6) | **83 · 84 · 87 (84,6)** | 77 · 75 · 71 | 72 · 71 · 73 | 71 · 73 · 75 | J21 · J21 · J21 | J29 · J29 · J28 | J29 · J29 · J28 |
| enraciné × 6 | 87 · 87 · 90 (88,1) | 84 · 84 · 81 (83,1) | **83 · 85 · 84 (84,2)** | 72 · 75 · 74 | 68 · 67 · 66 | 67 · 70 · 67 | J17 · J17 · J17 | J21 · J21 · J22 | J21 · J21 · J22 |
| mixte × 1 | 59 · 60 · 54 (57,7) | 59 · 59 · 56 (58,1) | **57 · 59 · 57 (57,7)** | 21 · 17 · 17 | 27 · 36 · 28 | 28 · 34 · 29 | J115 · J115 · J115 | J107 · J108 · J115 | J107 · J115 · J115 |
| mixte × 2 | 73 · 75 · 78 (75,6) | 78 · 78 · 79 (78,2) | **78 · 80 · 79 (79,1)** | 19 · 21 · 21 | 28 · 28 · 25 | 30 · 29 · 27 | J57 · J59 · J65 | J57 · J54 · J50 | J58 · J53 · J54 |
| mixte × 4 | 84 · 86 · 87 (85,8) | 83 · 83 · 86 (84,2) | **82 · 84 · 87 (84,4)** | 32 · 40 · 39 | 39 · 42 · 44 | 41 · 43 · 47 | J69 · J67 · J66 | J58 · J58 · J65 | J58 · J58 · J65 |
| mixte × 6 | 85 · 84 · 83 (83,9) | 83 · 84 · 79 (82,2) | **84 · 83 · 81 (82,9)** | 47 · 44 · 40 | 48 · 41 · 48 | 47 · 43 · 49 | J65 · J52 · J55 | J58 · J56 · J56 | J58 · J55 · J55 |

### 4.3 Le nomade × 6 et la borne du nomade

**Fins par départ du nomade × 6** (graines 1 à 6, 1 800 parties) : `principale` 56, `vague1` 56, `vague2` 83, `vague3` 68, **après 61**
(de 6 à 17 selon la graine, de 3 à 19 sur tous les états). L'écart de `vague2` (le lot « corps ») ne tient plus sur `vague3` ; les départs
de membres restent ceux d'avant (98 % des partants ont 3 de fatigue ou plus, 73 à 88 % sont blessés, 66 à 74 % malades, chikungunya
d'abord ; 8 à 19 % ont passé une nuit blanche depuis le lot « corps »). Rien n'a été changé pour eux.

**La borne du nomade** (`survie-equilibre.test.mjs`, 40 tirages de 20 parties, graines 1 à 40, mêmes bornes) : `principale` 667/800 et
2/40 (`equilibre.md`) ; `vague3` **662/800 (83 %), 1/40** hors bornes (g15 : 20/20 vivants) ; après **671/800 (84 %), 2/40** (g15 et
g35 : 20/20 vivants). La borne de 95 % n'a pas été élargie.

**L'essai d'équilibre** (graine « 1 », 20 parties) : nomade × 4 16/20 vivants, 6,3 déménagements, 3 fins sur 4 après J90 ; enraciné × 4
15/20, 13/20 autonomes (J46), 3,6 assauts par mois après J30 dont 1,9 sérieux ; solo enraciné 14/20, médiane J200 ; passif × 4 première
faim J7, fin médiane J17 ; Hauts 2,8 assauts par mois après J90, Bas 2,0. Les bornes n'ont pas bougé.

**Les rentes du marché** : l'essai qui les borne à 3 parts par quart de travail reste vert (rien n'y a été touché).

## 5. Les cibles

| Cible (`equilibre.md`) | Avant les lots | `vague3` | Après |
|---|---|---|---|
| Survie à J200, enraciné × 4 / nomade × 4 (les deux voies proches) | 87,1 / 82,7 % | 83,6 / 83,1 % | 84,6 / 82,9 % |
| Survie à J200, enraciné × 2 / × 6, mixte × 4 | 73,3 / 88,1 / 85,8 % | 73,9 / 83,1 / 84,2 % | 76,7 / 84,2 / 84,4 % |
| Survie à J200, passif × 4 | 13,1 % | 10,0 % | 11,6 % |
| Sur un an, humains × 4 / nomade × 4 (la voie enracinée plus sûre) | 25,7 / 18,8 sur 40 | 23,7 / 21,5 | 24,5 / 22,8 |
| Sur un an, sédentaires (× 4, × 2, seul) | 13,5 · 13,0 · 10,3 | 12,3 · 11,8 · 7,0 | 15,8 · 15,5 · 10,8 |
| Autonomie, enraciné × 2 (cible ~58 %) / × 4 | 57,7 / 74,3 % | 55,7 / 72,0 % | 58,0 / 73,0 % |
| Première faim, enraciné × 1 / × 4 (vers J21–J28) | J21–J28 / J21 | J21 / J28–J29 | J21 / J28–J29 |
| Rallumer l'île ne rend pas la partie plus facile (un an) | — | rallumer-4 20,8 contre humains-4 23,7 | 21,3 contre 24,5 |
| L'autonomie complète, but d'une longue partie | — | — | aucune production ni aucun coût n'a bougé ; seul ce que le simulateur bâtit a changé |

Le passif à J200 garde 1,5 point de moins qu'avant les lots (§ 6). La première faim de l'enraciné × 4 (J28–J29 au lieu de J21) vient de
`vague3` (le boucan conserve) ; elle reste dans la plage.

## 6. Ce qui reste discutable

- **Les passifs** gardent un à deux points de moins qu'avant les lots à J200 : le reste vient des bêtes de leur site qui boivent et du
  cyclone sur le bambou et la tôle. Faire entretenir le passif change un peu sa définition (« monte la garde, ne fait rien d'autre ») ;
  l'autre levier, mesuré, est l'entretien une fois et demie moins souvent (+1,0 point), qui toucherait tout le monde.
- **Les sédentaires à quatre et à deux** passent au-dessus de `vague2` sur un an (15,8 et 15,5 sur 40 contre 13,3 et 13,0) : le
  simulateur bâtissait à tort ce qui boit, et la seule correction honnête est de le faire jouer juste ; rien n'a été durci pour
  compenser. Le seul sédentaire revient (10,8 contre 10,3).
- **Les humains × 4** restent un peu sous `vague2` (24,5 contre 26,2 sur 40 ; 25,7 avant les lots) : c'est le prix du paradis (lot 9,
  −1,5 mesuré), voulu par ce lot ; les leviers (chaleur plus lente, hordes moins attirées) n'ont pas été appliqués.
- **L'enraciné × 6 à J200** reste sous `principale` (voir § 4.2) : c'est le groupe qui chauffe le plus vite (lot 9) ; le prix du paradis,
  voulu, sans levier appliqué.
- **Le prix du paradis** (lot 9) pour les groupes de quatre : la chaleur coupée rend 1,2 à 1,5 sur 40 ; c'est la limite 1 que le lot
  s'était donnée (« l'enracinement reste tenable »). À trancher : le garder tel quel ou l'adoucir (leviers préparés, § 3.2, non mesurés).
- **`sans-rondes-4` vit autant que `humains-4`** sur un an : la ronde du simulateur ne paie pas plus qu'elle ne coûte (morsures). Le
  lot 9 la mesurait déjà à peine utile (127 contre 122 sur 192).
- **Les fins par départ du nomade × 6** : 61 sur 1 800, au-dessus des 56 d'avant, dans le bruit.
- **La part musulmane** : 8,0 % ; ces trois enfances sont désormais deux fois plus rares. Une autre voie aurait été de baisser le poids
  de la religion pour les autres enfances (non demandé).
