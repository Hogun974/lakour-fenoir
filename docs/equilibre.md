# Équilibre de Fénoir

## Appliqué le 2026-11-05

Jordan a demandé de « faire au mieux » sur les propositions ci-dessous (§ « À décider », gardé pour l'historique) : cinq sont
appliquées, le budget de départ (5) n'a pas changé. Mesures **avant** et **après**, même code de mesure, mêmes graines :
`node essais/outils/parties-longues.mjs --graines 40` (440 parties d'un an) et `node essais/outils/simuler-parties.mjs --rapide`.

**Ce qui change** (logique `systems/lakour-survie/logique/`, contrat `docs/survie-contrat.md` §1.3, §2.3, §10.2) :

1. **Glanage de passage** (`actions.mjs`, `REGLES_ACTIONS.glanage`) : toute fouille d'une région (pillage, ciblée ou non)
   ramasse aussi `ceil(0,06 × membres × quarts × prudence × (cueillette + pêche + gibier par jour))` de nourriture, pris dans
   la nature des alentours de l'abri (si c'est sa région) ou de la région ; elle ne revient qu'à la régénération de la nature
   (0,15 à 0,25 × rendement par jour). Une région où l'on n'a pas glané depuis longtemps est pleine ; celle qu'on vient de
   vider ne rend presque plus rien. `demenager` laisse à la région la nature des alentours exploités (la plus basse des deux) :
   avant, revenir dans une région rendait des alentours intacts. Le simulateur (`simuler-parties.mjs`) : le nomade fouille au
   moins le jour de son arrivée, et reste glaner tant que les alentours ont 70 % de leur nourriture naturelle (et 3 jours par
   personne) et deux jours d'eau (`natureRiche`, `natureEntamee`) ; avant, arrivé sans vivres, il repartait le jour même,
   chaque jour, jusqu'à la faim. Taux essayés : 0,04 à 0,1 ; à 0,08 – 0,1, le nomade tenait aussi bien que l'enraciné à 4.
2. **Événements du contenu** à 35 % par jour (`REGLES_MONDE.evenementContenu`, 0,25 avant) : l'enraciné à 4 revient à
   4,6 assauts par mois après J30 (2,8 sérieux). Bornes de `essais/survie-equilibre.test.mjs` inchangées pour l'enraciné.
3. **Factions** : une région vide les affaiblit toujours de 0,01 par jour, mais jamais sous **0,5** dans leurs régions de
   départ (`factionsDepart`, ou leur force de départ si elle était plus basse ; `REGLES_MONDE.faction.plancher`, `declin`).
   Choisi plutôt que « décliner seulement si la nature est épuisée » : la nature reste presque toujours pleine (les autres n'y
   prennent que 0,2 × rendement × pop/5), les factions n'auraient alors plus jamais décliné.
4. **Recrues** (`generation.mjs`, `RECRUE_MANQUE`) : pour chaque compétence manquante du groupe que la recrue n'a pas (et
   qu'aucune incapacité ne lui interdit), une chance sur deux de l'avoir au niveau 2.
5. (Budget de départ : rien.)
6. **Morsure** (`survivant.mjs`, `difficulteMorsure`) : test de soins **difficile** si le soignant y met un médicament
   (consommé ; le simulateur lui garde son dé de plus) ou si l'abri a une infirmerie en service (son bonus compte),
   **extrême** sinon. Alerte « morsure » (fr, en) et guide des règles (journaux, jumeau anglais) mis à jour.
7. **Fêtes lunaires** (moteur `lakour-mj-ia`, `scripts/fetes-logique.js`) : calculées pour toute année (phases de la lune de
   Meeus, zodiaque sidéral de Lahiri) au lieu d'une table qui s'arrêtait en 2036 ; le calcul redonne les 33 relevés de 2026 –
   2036 et le Nouvel An chinois jusqu'en 2050. **La « Dipavali » du 4 décembre 2026** : la date (8 novembre 2026) et la
   fenêtre (du 5 au 11) étaient justes ; c'était la date RÉELLE (le 5 novembre, jour de l'essai) et non la date de jeu. Au
   chargement d'un monde neuf, le moteur calcule sa fête (et pose sa carte) aussitôt après son crochet `pret`, avant que le
   système ait pu forcer son réglage `fete` à la fête du jour de jeu (écriture asynchrone). Corrigé : le moteur accepte une
   date de monde (`api.fetes.sourceDeDate`), que le système branche au crochet `pret` (`scripts/fetes.mjs`,
   `brancherDateDuJeu`, `revoirFeteDuJeu` à chaque changement d'état) ; avec elle, le réglage `fete` reste à « auto ». Le
   sous-module `modules/lakour-mj-ia` n'est pas remonté : tant qu'il ne l'est pas, l'ancien chemin (réglage forcé) reste.

**Parties d'un an** (40 graines par scénario ; avant → après) :

| Scénario (365 jours) | Vivants à J365 | Fin médiane | Fins par l'infection | Première cause de fin, après |
|---|---|---|---|---|
| Sédentaire à 4 | 13 → 12 | J199 → J143 | 8 → 6 | soif 16 |
| Sédentaire à 2 | 10 → 8 | J165 → J160 | 16 → 13 | infection 13 |
| Seul, enraciné | 12 → 9 | J238 → J225 | 15 → 10 | soif 11, infection 10 |
| Seul, sédentaire | 6 → 11 | J122 → J171 | 11 → 11 | infection 11 |
| Seul, nomade | **0 → 9** | J172 → J177 | 15 → 20 | infection 20 |
| 2 humains + 2 compagnons | 26 → 23 | J365 → J365 | 6 → 6 | infection 6 |
| 4 humains (enraciné) | 20 → 17 | J365 → J278 | 8 → 10 | soif 11, infection 10 |
| 2 qui recrutent | 17 → 15 | J340 → J296 | 4 → 3 | soif 15 |
| 2 sans recruter | 13 → 13 | J309 → J260 | 8 → 12 | infection 12 |
| **Nomade à 4** | **0 → 10** | **J159 → J254** | 2 → 7 | faim 10 (avant : faim 31) |
| Mixte à 4 | 24 → 21 | J365 → J365 | 8 → 4 | soif 6 |

- **Nomade** : 10/40 vivants à J365 (visé : 8 à 15), fin médiane J254 (visé : > J240), en dessous de l'enraciné à 4 (17/40) ;
  7 déménagements par an au lieu de 38 départs affamés. À J200 (simulateur, 100 parties), il tient autant que l'enraciné
  (80 % contre 79 %) : c'est la deuxième moitié de l'année qui les départage. Le nomade seul passe de 0 à 9 vivants.
- **Assauts** : enraciné à 4, 4,03 → 4,57 assauts par mois après J30 (2,77 → 2,77 sérieux) ; Hauts 3,3 et Bas 2,2 après J90
  (inchangés). Le prix : moins de vivants chez les enracinés et sédentaires de 4 (−1 à −3 sur 40) ; plus de hordes au
  3e trimestre (sédentaire à 4 : 3,1 → 3,9 par mois).
- **Factions** (le monde seul, deux ans, graine seul-1) : force totale à J720 0,1 dans 1 région → **11,7 dans 15 régions**.
  Dans les parties de deux ans (16 graines, `--jours 730`, par mois au 8e trimestre) : 2 humains + 2 compagnons, bandes
  0 → 0,09 et visites 0 → 0,27 ; sédentaire à 4, bandes 0 → 0,22, visites 0 → 0,11 ; mixte, visites 0 → 0,59. Au plancher
  de 0,5, une bande reste rare (0,4 % × 0,5 × (1 + visibilité) par jour) : les visites des factions neutres et amicales
  dominent la deuxième année.
- **Recrues** (« 2 qui recrutent », recrues venues pendant un manque qui le comblent) : discrétion 24 → 72 %, vigilance 26 →
  52 %, soins 37 → 79 %, bricolage 31 → 71 % (survie 76 → 87 %, parole 72 → 97 %) ; somme des niveaux d'une recrue 9,2 → 10,1.
- **Infection** : pas d'effet mesurable chez « Seul, sédentaire » (11 fins sur 40 avant comme après). Le simulateur montre
  pourquoi : l'abri d'un solo n'a de médicament que 2 % des jours (ils partent dans les soins du soir et les chantiers), il
  n'a presque jamais d'infirmerie, et la moitié des survivants ont 0 en soins (un dé : même « difficile » est impossible
  sans le dé du médicament). Sur 13 morsures de solo en 40 parties, 12 sans médicament. Une fouille ciblée « médicaments »
  par semaine, essayée dans le simulateur, donnait plus de rencontres, donc plus de morsures (13 fins au lieu de 11) : pas
  gardée. Avec un médicament ou une infirmerie, une morsure se soigne à 11 – 41 % selon le soignant (3,7 – 11 % avant).

**Simulateur rapide** (`--rapide`, 20 parties par cas, 200 jours ; avant → après) : enraciné à 4, 18/20 → 14/20 vivants à
J200, 13/20 → 14/20 autonomes (J61), 4,03 → 4,57 assauts par mois (2,77 sérieux) ; nomade à 4, 2/20 → 17/20, fin médiane
J170 → J200, 36,5 → 6,4 déménagements ; solo enraciné 10/20 → 10/20. `essais/survie-equilibre.test.mjs` : bornes du nomade
ajustées (au plus 90 % de vivants à J200 au lieu de 85 % ; au moins 4 déménagements au lieu de 8 : il reste glaner des
alentours frais au lieu de repartir affamé chaque jour) ; les autres bornes sont inchangées.

**Reste ouvert** :
- l'infection des solos (ci-dessus) : si Jordan veut la baisser, les leviers sont hors de la règle de morsure (plus de
  médicaments dans les sites et les fouilles, une trousse de secours qui compterait comme un médicament, des rencontres
  qu'un solo évite mieux : le simulateur ne sait que se battre ou se cacher) ;
- les enracinés et sédentaires de 4 perdent 1 à 3 vivants sur 40 avec les assauts remontés ; à surveiller avec les effets
  `abri` des événements, plus fréquents eux aussi (35 % au lieu de 25 %) ;
- la soif reste la première cause de fin des sédentaires (pas de source dans la région) : non traité ;
- les bandes de la deuxième année sont rares ; un plancher plus haut (0,75 – 1) les rendrait plus présentes ;
- le sous-module `modules/lakour-mj-ia` est à remonter (fêtes lunaires calculées, `sourceDeDate`) ;
- le budget de départ (proposition 5) : rien de changé, comme demandé.

## À décider (mesures et propositions du 2026-11-05, avant application)

Mesures du 2026-11-05 : 440 parties d'un an (11 scénarios × 40 graines, `node essais/outils/parties-longues.mjs --graines 40`),
après les six corrections de la logique. **Remesuré le 2026-11-05** après la correction des trois écarts (effets `abri` des
événements appliqués, stocks plafonnés dès l'installation, tour de guet dans l'assaut) : entre crochets, la mesure d'avant
quand elle a changé. Rien de ce qui suit n'est appliqué : ce sont des propositions.

| Scénario (365 jours) | Vivants à J365 | Fin médiane | Autonomes (jour médian) | Première cause de mort |
|---|---|---|---|---|
| Sédentaire à 4 | 11/40 [13] | J180 [J183] | 18 (J61) [17 (J59)] | soif (pas de source dans la région) |
| Seul, sédentaire | 10/40 [12] | J144 [J88] | 18 (J7) | infection |
| Seul, nomade | 0/40 | J163 [J160] | 2 | infection, faim |
| 2 humains + 2 compagnons | 26/40 [24] | J365 | 29 (J61) [28] | infection |
| 4 humains | 21/40 [26] | J365 | 29 (J45) | soif |
| 2 qui recrutent | 12/40 [17] | J262 [J304] | 21 (J22) | soif |
| 2 sans recruter | 13/40 [14] | J265 | 25 (J59) | infection |
| Nomade à 4 | 0/40 | J163 [J165] | 5 [3] | faim |
| Mixte à 4 | 27/40 [29] | J365 | 17 (J89) [J107] | assaut, soif, infection (5, 4, 3) [infection] |

Ce que coûtent les effets `abri` des événements (fuite de citerne −10 eau, rats −6 nourriture, maladie du potager −4,
sécheresse −5 eau, gel −2, eau trouble −3, pillards −5 ; au moins 2,6 pertes par partie en moyenne) : la même mesure SANS les appliquer
(mais avec les deux autres corrections et le nouveau tirage des événements) donne 159 groupes vivants à J365 sur 440 (base :
157) ; en les appliquant, 141. Les pertes de stocks retirent donc environ 18 survies sur 440 (−4 points), surtout aux
sédentaires et enracinés qui vivent au plus juste (4 humains −4, recrues −4) ; la tour de guet et les plafonds ne changent
rien de visible. Le simulateur rapide (`simuler-parties.mjs --rapide`, 320 parties de 200 jours) reste dans les bornes de
`essais/survie-equilibre.test.mjs` : enraciné à 4, 16/20 vivants à J200, 13/20 autonomes (J62), 4,25 assauts par mois
après J30 dont 2,39 sérieux, 0,45 brèche par partie [0,8] ; nomade à 4, 1/20 vivants, fin médiane J171 [J168] ; solo
enraciné 14/20 [13/20] ; après J90, Hauts 3,24 assauts par mois, Bas 2,09 [3,09 et 2,24]. Piste si c'est trop dur :
réduire les `stocks` des événements `abri` du contenu, ou leur `poids`, plutôt que la règle.

1. **Le mixte domine, le nomade pur ne tient jamais un an.** Même avec un pillage divisé par 4 après J60, sa fin médiane
   ne passe que de J169 à J228. Piste : une ressource qui se renouvelle pour qui bouge (cueillette, pêche, glanage).
2. **Moins d'assauts** depuis que les événements météo des régions arrivent (ils prennent la place d'autres événements) :
   l'enraciné à 4 passe de 5,0 à 3,9 assauts par mois. Remonter `evenementContenu` de 0,25 à 0,35 le ramène à 4,45
   (2,84 sérieux).
3. **Les factions s'éteignent toutes entre J600 et J720** : la deuxième année, plus de bande ni de visite. Pistes : ne les
   faire décliner que si la nature de la région est épuisée elle aussi, ou un plancher de 0,5 dans leurs régions de départ.
4. **Les recrues comblent mal certains manques** : une recrue venue pour une compétence manquante en a au moins 2 dans 67 %
   des cas pour la survie, mais 21 % pour la vigilance, 16 % pour la discrétion, 29 % pour les soins. Pistes : poids
   « manquant » de 3 à 6, ou un niveau 2 garanti dans une compétence manquante une fois sur deux.
5. **Le budget de départ ne sert qu'à relever** : un joueur fait presque toujours 10 (12 au plus), le plafond de 16 n'est
   jamais atteint. Compagnons et recrues font 9,2 en moyenne (7 au moins).
6. **L'infection tue d'abord les survivants seuls** (18 à 19 morts sur 40) : le test de soins extrême laisse 0 à 11 % de
   chances. Piste : « difficile » avec un médicament ou une infirmerie.

Écarts relevés par les parties longues :
- corrigés le 2026-11-05 (contrat §1.6, §1.7, §2.6, §3.2) : les effets `abri` des événements du contenu s'appliquent à
  l'abri où vit le groupe (stocks perdus et dégâts par la logique, moral, blessures et trouvailles au MJ, à raconter) ; les
  stocks sont plafonnés dès l'installation ; le bonus de vigilance de la tour de guet (et des chiens dressés) compte dans un
  assaut ;
- non corrigé alors (corrigé depuis, ci-dessus, point 7) : la table lunaire du moteur s'arrête en 2036 : après mi-2036,
  Cavadee, Nouvel An chinois et Dipavali ne tombent plus.
