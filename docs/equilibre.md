# Équilibre de Fénoir

## Les quatre lots du 2026-11-13 et leur fusion

Les chiffres de chaque lot et leurs raisons sont dans leur propre fichier (gardés tels que leurs auteurs les ont écrits) :

| Lot | Fichier | Ce qu'il règle | Contrat |
|---|---|---|---|
| Fêtes, lune, relève, autel | [`equilibre-fetes.md`](equilibre-fetes.md) | la lune et la nuit, la chaleur, le gain et le coût de chaque fête, les liens chez les autres, la mort, le deuil, le repos, l'autel, la relève et les jeunes de 16 à 18 ans | §11 |
| Marché, carnet, préjugés, Ladi Lafé | [`equilibre-marche.md`](equilibre-marche.md) | la part, le cours, la première confiance, l'usure des préjugés, le carnet de crédit, le marché forain, la trêve, l'accueil, la rumeur | §12 |
| Les deux savoirs, l'île en mouvement | [`equilibre-savoirs.md`](equilibre-savoirs.md) | les sœurs lontan, les gramounes, livres et cahiers, jardins et boutures, le gaz et l'eau chaude, le cyclone vécu, les chiens, les routes sans carburant | §13 |
| L'esprit, le sens moral, l'autorité | [`equilibre-moral.md`](equilibre-moral.md) | le tirage de l'esprit, l'esprit au jour le jour, les actes moraux, la porte, les chefs | §14 |

La fusion (branche `fusion-lots`) n'ajoute **aucun chiffre** : elle branche les lots entre eux avec des règles qui existaient
déjà (contrat §15) : le marché fait porter des actes moraux (colporter, mentir, attaquer), la fête des autres use les
préjugés, les jeunes ne mènent pas et votent à moitié, les gramounes et les gens du marché ont un esprit, chaque religion a ses
fêtes. Rien de cela ne joue dans le simulateur (il ne troque pas, ne vote pas et ne recrute pas de gramoune).

### Mesures après fusion (2026-11-13)

Même code de mesure des deux côtés : `node essais/outils/simuler-parties.mjs --parties 300 --graine <g>` (300 parties de
200 jours par cas, 16 cas, 4 800 parties), joué sur `principale` (3c8c750) et sur `fusion-lots`, graines 1 et 2.

**Vivants à J200** (graine 1 | graine 2) :

| Cas | `principale` | fusion |
|---|---|---|
| passif × 1 | 14 % \| 13 % | 14 % \| 18 % |
| passif × 2 | 12 % \| 12 % | 15 % \| 17 % |
| passif × 4 | 11 % \| 13 % | 14 % \| 15 % |
| passif × 6 | 10 % \| 8 % | 13 % \| 14 % |
| nomade × 1 | 55 % \| 57 % | 58 % \| 57 % |
| nomade × 2 | 76 % \| 71 % | 74 % \| 78 % |
| nomade × 4 | 82 % \| 88 % | 85 % \| 88 % |
| nomade × 6 | 79 % \| 80 % | 86 % \| 81 % |
| enraciné × 1 | 61 % \| 56 % | 54 % \| 54 % |
| enraciné × 2 | 71 % \| 69 % | 72 % \| 68 % |
| enraciné × 4 | 83 % \| 83 % | 84 % \| 81 % |
| enraciné × 6 | 89 % \| 90 % | 89 % \| 88 % |
| mixte × 1 | 58 % \| 60 % | 59 % \| 60 % |
| mixte × 2 | 76 % \| 78 % | 69 % \| 74 % |
| mixte × 4 | 85 % \| 84 % | 82 % \| 83 % |
| mixte × 6 | 83 % \| 82 % | 83 % \| 84 % |

**Autres écarts** (graine 1 | graine 2, `principale` → fusion) :

- **Autonomie** : l'enraciné × 4 l'atteint moins souvent (76 % → 71 % | 76 % → 67 %), le mixte × 4 aussi (38 % → 28 % |
  38 % → 34 %) ; les passifs plus souvent (× 4 : 28 % → 35 % | 29 % → 35 %).
- **Première faim** de l'enraciné seul bien plus tard (médiane J21 → J78 | J21 → J65).
- **Assauts sérieux par mois après J30** de l'enraciné × 4 un peu moins nombreux (2,71 → 2,48 | 2,82 → 2,60) ; Hauts contre Bas
  après J90 inchangé dans son sens (Hauts 3,31 → 3,15 assauts par mois, Bas 2,11 → 2,09, graine 1).
- **Fins par « départ de tous »** (règle du simulateur : un survivant à moral 0 cinq jours de suite, sans faim, s'en va) plus
  fréquentes dans presque tous les cas, sur 300 parties : nomade × 4 2 → 12 | 4 → 13, nomade × 2 4 → 11 | 4 → 12, enraciné × 2
  2 → 7 | 1 → 8, mixte × 2 1 → 7 | 2 → 5. Sans doute l'esprit du lot moral (celui qui lâche, le regard éteint), qui pousse
  quelques survivants au fond quand le reste du groupe tient mieux ; la cause n'est pas isolée ici (lot par lot).
- Les écarts de deux à quatre points changent de sens d'une graine à l'autre (le bruit du tirage, ± 3 points sur 300 parties) ;
  ceux qui tiennent sur les deux graines : passifs +2 à +6, autonomie de l'enraciné × 4 −5 à −9, première faim de l'enraciné
  seul repoussée, plus de départs, enraciné seul −2 à −7.

**La borne du nomade** (`essais/survie-equilibre.test.mjs` : 20 parties, graine « 1 », au plus 95 % de vivants à J200, au
moins la moitié des fins après J90) rejouée sur 40 tirages (graines 1 à 40, 20 parties chacune, mêmes bornes) :

| | Vivants à J200 (800 parties) | Tirages hors des bornes | Pourquoi |
|---|---|---|---|
| `principale` | 680/800 (85 %) | 2/40 | deux tirages où les deux fins tombent avant J90 |
| fusion | 708/800 (89 %) | 4/40 | trois tirages à 20/20 vivants (au-dessus de 95 %), un où la seule fin tombe avant J90 |

L'essai (graine « 1 ») passe : 17/20. Mais un tirage sur dix environ tomberait hors de la borne de 95 % si la graine de l'essai
changeait : le nomade × 4 survit mieux après la fusion (85 % → 89 % sur ces 800 parties ; le lot moral seul le mesurait à 91 %
sur 300 parties, graine 2). **À trancher par Jordan**, sans retouche ici : garder ce surcroît (le moral « central », voulu) et
desserrer la borne (0,95 → 1, ou mesurer sur 100 parties), ou ramener le nomade vers 85 % (les leviers sont dans
`equilibre-moral.md` § 6).

**Parties longues** (`node essais/outils/parties-longues.mjs --graines 40`, 11 scénarios × 40 graines, 365 jours) :

| Scénario | Médiane | Vivants à J365 | Autonomes (jour médian) | Brèches par partie |
|---|---|---|---|---|
| sedentaire-4 | J180 → J226 | 9/40 → 14/40 | 15 (J66) → 14 (J61) | 3.05 → 2.03 |
| sedentaire-2 | J166 → J147 | 12/40 → 10/40 | 14 (J11) → 15 (J11) | 2.65 → 2.1 |
| seul-enracine | J232 → J246 | 9/40 → 11/40 | 24 (J8) → 26 (J12) | 1.95 → 2.05 |
| seul-sedentaire | J118 → J134 | 8/40 → 10/40 | 17 (J7) → 18 (J7) | 2.6 → 2.2 |
| seul-nomade | J249 → J365 | 13/40 → 20/40 | 0 (J—) → 0 (J—) | 1.9 → 1.6 |
| compagnons | J365 → J365 | 24/40 → 25/40 | 24 (J61) → 22 (J50) | 2.7 → 2.23 |
| humains-4 | J365 → J321 | 26/40 → 19/40 | 26 (J62) → 29 (J62) | 2.85 → 3.03 |
| recrues | J273 → J355 | 11/40 → 18/40 | 21 (J39) → 23 (J56) | 2.08 → 2.25 |
| sans-recrues | J249 → J302 | 14/40 → 16/40 | 25 (J37) → 24 (J37) | 2.1 → 1.9 |
| nomade-4 | J280 → J365 | 10/40 → 20/40 | 0 (J—) → 3 (J72) | 2.55 → 2.33 |
| mixte-4 | J365 → J365 | 24/40 → 25/40 | 20 (J105) → 14 (J95) | 2.35 → 2.25 |

Aucune anomalie relevée par les contrôles du jour, avant comme après (valeurs impossibles, impasses, chantiers bloqués, textes
sans clé ou sans traduction). Sur un an, le **nomade × 4 ne finit plus par manquer** comme avant : 10/40 → 20/40 vivants à J365
(médiane J280 → J365 ; le commentaire de l'essai d'équilibre disait « 9/40 vivants à J365 ») ; le nomade seul aussi (13/40 →
20/40) et les recrues (11/40 → 18/40) ; les humains × 4 enracinés, eux, reculent (26/40 → 19/40, médiane J365 → J321). Sur 40
graines, le bruit est de ± 3 parties environ : ces écarts-là le dépassent. **À trancher par Jordan** (rien n'a été retouché).

## Médicaments et zerbaz (appliqué le 2026-11-05, après la section suivante)

Constat (section suivante, « Reste ouvert ») : l'infection tue d'abord les survivants seuls ; la morsure est « difficile » avec
un médicament, mais l'abri d'un solo n'en a que 2 % des jours. Jordan a demandé **plus de médicaments trouvables** et la
possibilité de **se soigner par les plantes**. Mesures avant et après, même code de mesure : `node essais/outils/parties-longues.mjs
--graines 40` et `node essais/outils/simuler-parties.mjs --rapide` (les tableaux de remèdes sont nouveaux : pour l'« avant »,
la même mesure a été rejouée sur le code d'avant).

**Règles ajoutées** (logique `systems/lakour-survie/logique/`, contrat §1.3, §1.6, §2.3, §3.3, §9) :

1. **Trousses de secours** (`actions.mjs`, `REGLES_ACTIONS.fouille.trousse`) : une fouille de la région (pillage) a 1,5 % de
   chances par membre et par quart (× 2,5 en cherchant des médicaments, au plus 50 %) de tomber sur une trousse oubliée (boîte
   à gants, armoire de salle de bains) : +1 médicament, qui ne sort pas des réserves de la région (la population les vide en
   deux mois) ; une région sans médicament au jour zéro n'en cache pas. Fouiller un site de type « hopital » : médicaments × 3.
   Essayé à 2,5 % : le nomade seul en trouvait 12 par an, les groupes sédentaires n'en profitaient pas.
2. **Plantes médicinales, les « zerbaz »** : nouvelle ressource `plantes` (constantes, une brassée ; plafond de base 12 ; ne se
   pille pas, comme l'énergie). Une cueillette (fouille des alentours, cible `cueillette`) rapporte en plus `arrondiHasard(0,2 ×
   membres × quarts)` plantes sans entamer la nature ; la fouille « plantes » (cible `plantes`) en rapporte `ceil(0,5 × membres ×
   quarts × prudence)`, prises sur la cueillette des alentours. Le savoir **Zerbaz et tisanes** (`zerbaz`, contenu ; donné par
   trois enfances — Hauts de Salazie, tamoule de Saint-André, Sud sauvage — et le passé d'apiculteur) double les plantes cueillies.
   Quatre sites ont un jardin de zerbaz (2 à 4 plantes en stock).
3. **Tisanes** (recette `tisanes` du contenu, remaniée : avant, une graine, le savoir « premiers secours avancés » et une
   infirmerie) : 2 plantes, 1 quart, test de survie normal (+1 dé avec le savoir des zerbaz) → 1 **médicament** (fièvres
   légères, maux de ventre, plaie, maladie qui demande un médicament : tout ce que fait un médicament).
4. **Morsure** (`survivant.mjs`, `difficulteMorsure`, `bonusMorsure`, `DECOCTION`) : difficile aussi avec une **décoction de
   zerbaz** (1 plante de l'abri, consommée) ou une **trousse de secours / un sac d'intervention** que porte le soignant (non
   consommé : son bonus d'outil compte, comme pour tout test) ; un médicament et une décoction donnent chacun +1 dé et se
   cumulent (outil et infirmerie : au plus +2 ensemble). C'est le cumul qui donne une chance à un soignant sans métier : soins 0,
   difficile, 2 dés : 11 % ; 3 dés : 26 %. Jamais plus facile que difficile, et rien ne guérit un infecté.
5. **Simulateur** (`simuler-parties.mjs`, `REMEDES`), comme un groupe raisonnable : il garde son dernier médicament pour une
   morsure (les soins du soir d'un simple blessé ne l'entament pas) ; sans médicament et avec moins de 3 plantes, ses cueilleurs
   vont d'abord à la cueillette (si elle vaut au moins la moitié de la pêche ou du gibier, et jamais quand la nourriture manque) ;
   le soir, sans médicament et avec 3 plantes (il en garde une pour une décoction), le meilleur en survie prépare une tisane. Une
   réserve de 2 ou 3 médicaments (tisanes préparées plus tôt) faisait autant pour les solos et donnait 1,5 vivant de plus sur 40
   aux groupes de 4 : pas gardée. Le simulateur compte maintenant morsures, morsures aidées et soignées, trousses, plantes,
   tisanes et jours d'abri avec un médicament (tableau « Remèdes », dans les deux outils de mesure).

**Parties d'un an** (40 graines par scénario, g0 à g39 ; avant → après) :

| Scénario (365 jours) | Vivants à J365 | Fin médiane | Fins par l'infection | Morsures soignées / morsures | Jours d'abri avec un médicament |
|---|---|---|---|---|---|
| Sédentaire à 4 | 12 → 13 | J143 → J166 | 6 → 3 | — → 16/51 | — → 79 % |
| Sédentaire à 2 | 8 → 12 | J160 → J221 | 13 → 7 | — → 13/28 | — → 73 % |
| **Seul, enraciné** | 9 → 8 | J225 → J227 | **10 → 9** | — → 4/13 | — → 47 % |
| **Seul, sédentaire** | 11 → 17 | J171 → J319 | **11 → 7** | — → 5/12 | 2 % → 59 % |
| Seul, nomade | 9 → 17 | J177 → J254 | 20 → 15 | — → 6/21 | — → 85 % |
| 2 humains + 2 compagnons | 23 → 23 | J365 → J365 | 6 → 8 | — → 25/52 | — → 85 % |
| **4 humains (enraciné)** | **17 → 26** | J278 → J365 | 10 → 4 | — → 20/40 | — → 88 % |
| 2 qui recrutent | 15 → 13 | J296 → J311 | 3 → 2 | — → 12/45 | — → 83 % |
| 2 sans recruter | 13 → 10 | J260 → J251 | 12 → 7 | — → 6/20 | — → 73 % |
| Nomade à 4 | 10 → 9 | J254 → J246 | 7 → 7 | — → 20/59 | — → 78 % |
| Mixte à 4 | 21 → 21 | J365 → J365 | 4 → 5 | — → 27/62 | — → 85 % |

Le code d'avant, rejoué avec les mêmes compteurs (simulateur, 80 parties d'un an par cas) : médicament 2 % des jours d'abri
(solo sédentaire), 1 % (solo enraciné, enraciné à 4), 58 % (nomade seul) ; morsures soignées 2/37 (solo sédentaire), 0/24 (solo
enraciné), 11/102 (enraciné à 4). Après : un médicament la moitié des jours chez un solo, 80 à 90 % chez un groupe ; un solo
cueille 17 à 21 plantes et prépare une ou deux tisanes par an, un nomade trouve 7 à 8 trousses.

**Le bruit des 40 graines.** Le hasard d'une partie change dès qu'une règle tire un dé de plus (une trousse, une plante) : à 40
graines, un scénario bouge de ± 3 vivants sans qu'aucune règle ne change (le code d'avant donne 36/80 vivants à l'enraciné à 4
sur les graines g0 à g79, 42/80 et 43/80 sur deux autres séries). Mesure de contrôle sur **240 graines** (séries g, h et i de
80, `--serie`, ramenées sur 40) :

| Scénario (240 parties d'un an, ramenées sur 40) | Vivants avant → après | Fins par l'infection avant → après |
|---|---|---|
| Seul, sédentaire | 8,5 → 12,5 | 15,2 → 12,2 (−20 %) |
| Seul, enraciné | 7,5 → 8,7 | 14,3 → 12,5 (−13 %) |
| 4 humains (enraciné) | 20,2 → 24,2 | — |

- **Solos** : moins de morts par l'infection, surtout le sédentaire (il cueille et reste) ; l'enraciné seul gagne moins (il
  déménage deux fois par an et repart d'alentours inconnus ; 13 morsures sur 40 parties, toutes aidées, 4 soignées). La limite reste le
  soignant : la moitié des solos ont 0 en soins, et une morsure aidée ne se soigne alors qu'à 11 – 26 %. Le nomade seul passe de
  9 à 17 vivants (trousses : un médicament 85 % des jours).
- **Groupes de 4** : l'enraciné à 4 passe de 17 à 26 vivants à J365 sur les graines g0 – g39 (de 20 à 24 sur 240 graines : la
  série g était basse avant) ; il soigne la moitié de ses morsures avec un soignant de métier et un médicament presque toujours
  là. Au-dessus de ~25 sur g0 – g39, en dessous sur 240 graines : à surveiller. Le levier le plus doux, s'il faut le baisser :
  la cueillette de plantes (0,2 → 0,1 par membre et par quart).

**Simulateur rapide** (`--rapide`, 20 parties par cas, 200 jours ; avant → après) : enraciné à 4, 14/20 → 15/20 vivants à
J200, 14/20 → 12/20 autonomes (J61 → J57), 4,57 → 4,27 assauts par mois après J30 (2,77 → 2,52 sérieux) ; nomade à 4, 17/20 →
19/20 vivants (80 → 81 sur 100 parties : le hasard des 20) ; solo enraciné 10/20 → 11/20 ; Hauts 3,3 → 3,2 et Bas 2,2 → 2,1
assauts par mois après J90. `essais/survie-equilibre.test.mjs` : borne du nomade « au plus 90 % de vivants à J200 » portée à
95 % (19/20 dans ces 20 parties ; 81/100 sur 100 parties, l'enraciné 84/100 ; sur un an, le nomade à 4 finit toujours par
manquer : 9/40 vivants à J365). Les autres bornes sont inchangées.

**Essais** : `essais/survie-remedes.test.mjs` (cueillette des plantes et savoir, cueillette ordinaire, trousses dans les
fouilles, hôpital, décoction et trousse pour une morsure, recette des tisanes du contenu, traductions, solo sédentaire du
simulateur qui cueille et prépare).

**Reste ouvert** :
- les solos sans métier de soins : au-delà, les leviers sont hors des remèdes (forcer le test d'une morsure, que le simulateur
  ne fait jamais et qu'un joueur ferait toujours : 2 dés difficile → 31 % ; des rencontres qu'un solo évite mieux) ;
- l'enraciné à 4 à 26/40 sur les graines de référence (24/40 sur 240) : la cueillette de plantes est le premier levier ;
- le nomade ne cueille pas (il n'a pas de cueilleur quand il est seul) : ses remèdes viennent des trousses.

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
- l'infection des solos (ci-dessus ; **traité depuis**, section « Médicaments et zerbaz ») : si Jordan veut la baisser, les leviers sont hors de la règle de morsure (plus de
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
