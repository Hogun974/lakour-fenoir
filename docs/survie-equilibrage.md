# Équilibrage de Fénoir (2026-11-04)

Des parties entières jouées par le simulateur `essais/outils/simuler-parties.mjs`, avec la logique pure de `lakour-survie` et le
vrai contenu de `lakour-fenoir` (`assets/donnees.json`), pour mesurer l'équilibre contre les objectifs du contrat
(`docs/survie-contrat.md` §1, §1.6, §2.3, §9), puis ajuster les nombres par petites touches. Tout est reproductible :

```
node essais/outils/simuler-parties.mjs --parties 200 --graine 1          # 16 cas × 200 parties (≈ 45 s sur 12 fils)
node essais/outils/simuler-parties.mjs --rapide                          # 20 parties par cas (l'essai survie-equilibre.test.mjs)
node essais/outils/simuler-parties.mjs --journal --cas enracine-4 --graine 3   # une partie racontée jour par jour
```
Options : `--jours 200`, `--cas nomade-4,enracine-1`, `--fils N`, `--json fichier`. La graine fixe donne les mêmes parties quel
que soit le nombre de fils ; la région de départ tourne sur les seize régions (12 à 13 parties par région et par cas).

## 1. Le simulateur

**Le groupe** : 1, 2, 4 ou 6 survivants tirés par le générateur (§10.2, budget 10–16), avec leurs savoir-faire et, s'ils en
ont un, leur véhicule. **Quatre stratégies** simples et plausibles :

- **passif** : s'installe sur le site le plus sûr de sa région, monte la garde, ne fait rien d'autre (la mesure de référence du
  contrat : « un groupe de 4 passif en ville tient 7 à 14 jours ») ;
- **nomade** : fouille sa région tant qu'elle rapporte ; quand les stocks passent sous 3 jours dans une région maigre, ou que deux
  fouilles de suite rapportent moins d'une unité par fouilleur, déménage vers la voisine la mieux renseignée (pillage intact,
  infestation calme), à pied ou en véhicule ; depuis le 2026-11-05 (`docs/equilibre.md`), il reste glaner tant que les
  alentours ont au moins 70 % de leur nourriture naturelle (et 3 jours par personne) et deux jours d'eau, et fouille au moins
  le jour de son arrivée ;
- **enraciné** : choisit le meilleur site accessible (eau, sol, soleil, discrétion, installations déjà là ; sa région et ses
  voisines), s'y installe et construit dans l'ordre eau (captage, pompe, citerne, filtre), potager, panneaux, batteries, barricades,
  réserve étanche, séchoir, compost, basse-cour, cabris, galerie, camouflage, palissade, tour de guet, infirmerie… ce que le site,
  les savoir-faire et les stocks permettent ; ne fouille que les alentours (cueillette, pêche, gibier, bois), sauf fouille ciblée
  de sa région quand un matériau manque au chantier ou que l'eau ou la nourriture tombent sous 3 jours ; quand sa région n'a plus
  d'eau à trouver et que le site n'en donne pas assez, il cherche un site avec de l'eau ;
- **mixte** : nomade, puis enraciné après deux déménagements.

**Chaque jour** : tâches données par `repartir` (répartition automatique), la stratégie gardant la garde et les bras des
installations présentes et envoyant les autres travailler ; deux quarts de travail (fouille, chantier à `avancerChantier`,
réparations) ; soins le soir (test de soins du meilleur soigneur, un médicament s'il y en a — le dernier gardé pour une
morsure, sauf pour un blessé grave —, un mourant stabilisé sur un test difficile ; puis, sans médicament et avec 3 plantes, une
tisane : `REMEDES`, 2026-11-05) ; garde la nuit ; fêtes fêtées quand le calendrier du socle en donne une ; puis `avancer` quatre quarts et les
menaces rendues sont résolues (`resoudreAssaut` ; brèche : une installation abîmée, l'abri +2 dégâts, un échange de combat ;
une bande qui entre emporte 30 % des vivres).

**Ce que la logique laisse au MJ et que le simulateur tranche** (ses règles, `REGLES_SIMULATEUR`) : mort de soif après 12 quarts
sans boire et de faim après 10 jours sans manger (la logique ne fait que fatiguer) ; un survivant dont le moral reste à 0 cinq
jours de suite quitte le groupe, sauf s'il a faim ; dépassés en nombre, les fouilleurs tentent de passer inaperçus (test de
discrétion du moins discret) avant de se battre ; une rencontre vaut un échange de combat (chacun se bat une fois contre quatre
adversaires au plus), puis le groupe se replie ; une morsure vaut un test de soins extrême (difficile avec un médicament de
l'abri ou une infirmerie, depuis le 2026-11-05 ; aussi avec une décoction de zerbaz ou une trousse que porte le soignant, et
médicament et décoction +1 dé chacun : `difficulteMorsure`, `bonusMorsure`), sinon infection ; sans médicament, les
cueilleurs vont d'abord à la cueillette (nourriture et plantes) ; les corps sont toujours traités (pas de relève) ; après une
brèche, si les Livides restants sont plus nombreux que les valides, le groupe fuit
(déménagement forcé) ; un malade aggravé (malus ≥ 3), épuisé et affamé meurt. Depuis le rééquilibrage du 2026-11-13
(`docs/equilibre.md`) : le soir, à l'abri, le groupe donne le repos à ses morts retrouvés (sans quoi le deuil pesait jusqu'au
bout de la partie) ; le gaz, les boutures et le biocarburant, que le simulateur ne joue pas, ne comptent plus dans le score
d'un site (les 13 kg de gaz sous l'évier faisaient choisir une maison plutôt qu'un bon site).

**Mesures** par cas (stratégie × taille) : jours de survie (quartiles), vivants à J200, première faim, autonomie (part et jour),
déménagements, installations, causes de fin, cyclones, éruptions et hordes vécus, assauts par mois après J30 (sérieux : force
≥ 3), brèches, rencontres, jours sans eau et sans nourriture, ressource limitante, blocages de chantier ; par région de départ ;
Hauts contre Bas après J90.

## 2. Objectifs et verdict

| Objectif (contrat) | Avant | Après | Verdict |
|---|---|---|---|
| Un groupe de 4 passif en ville tient 7 à 14 jours | première faim médiane J8 (Q1 J6) en ville, fin J18 | première faim J8 (Q1 J7), fin J18 | atteint (le quart bas touche 7) |
| Un abri bien choisi et aménagé devient autonome vers J40–J70 | enraciné × 4 : 73 % autonomes, médiane J61 (J10–J78) | 78 %, médiane J61 (J10–J83) | atteint (le quart bas J10 : sites déjà équipés, fermes et îlets) |
| L'enraciné bien joué tient 200 jours, avec au moins un assaut sérieux par mois après J30 | 60 % vivants à J200 ; 8,3 assauts par mois (5,8 sérieux), 3,9 brèches par partie | 79 % vivants ; 5,2 assauts par mois (3,5 sérieux), 1,8 brèche par partie | atteint ; la menace reste forte pour les groupes de 4 et 6 (visibilité) |
| Le nomade tient, mais finit par manquer de sites intacts après J90 | 83 % vivants à J200, 11 déménagements, 6 fins sur 35 avant J90, 3 fins par la faim | 53 % vivants, 32 déménagements, 94 fins sur 95 après J90, 52 par la faim | atteint |
| Le solo est viable mais tendu | enraciné × 1 : 25 % vivants, médiane J114 ; nomade × 1 : 34 % | enraciné × 1 : 48 %, médiane J192 ; nomade × 1 : 52 % | atteint (l'infection emporte un solo sur quatre) |
| Les Hauts plus durs que les Bas après J90 | 5,6 contre 5,3 assauts par mois (quasi égaux) | 4,1 contre 2,6 ; enraciné : 5,4 contre 2,8 | atteint |
| Aucune région de départ impossible ni gratuite | de 32 % (Sainte-Marie) à 64 % (Le Tampon, Cilaos) vivants à J200 | de 40 % (Sainte-Marie) à 69 % (Hauts de l'Ouest, Plaine des Palmistes, Cilaos, Mafate) | atteint |
| Effet du nombre de membres | enraciné 1 < 2 < 4 ≈ 6 ; nomade 4 ≈ 6 | enraciné 48 % < 71 % < 79 % ≈ 76 % ; nomade 6 (39 %) plus dur que 4 (53 %) : il faut nourrir plus de bouches en déménageant | cohérent |

## 3. Nombres changés

Tous dans `systems/lakour-survie/logique/monde.mjs` (`REGLES_MONDE`), sauf mention. Chaque touche a été mesurée sur 3 200 parties.

| Nombre | Avant | Après | Pourquoi |
|---|---|---|---|
| Menace : horde présente trouve l'abri (par jour) | 30 % + 5 %/bruit + 4 %/visibilité | 8 % + 4 %/bruit + 2 %/visibilité | huit assauts par mois sur un abri enraciné : un siège permanent, 4 brèches par partie |
| Menace : Livides errants | infestation × 4 % | infestation × 2 % | idem |
| Menace : bande hostile | 1 % × force × (1 + visibilité) | 0,4 % × force × (1 + visibilité) | idem |
| Hordes : naissance dans une région à infestation ≥ 4 | 8 % par jour | 5 % par jour | 18 hordes à l'abri par partie d'enraciné |
| Hordes des Hauts (nouveau, phase « après ») | — | infestation ≥ 2,5 en altitude : 2 % par jour | les Hauts ne formaient jamais de horde (population ≤ 3) : ils n'étaient pas plus durs que les Bas après J90 |
| Décomposition des Bas après J60 | −0,03 par jour | −0,045 par jour | les Bas gardaient une infestation > 3 jusqu'à J120 ; la chaleur nettoie plus vite (le contrat §2.3 cite 0,03 : remplacé) |
| Pillage par les autres : silence / après | 2,5 % / 1,2 % par jour (× population/5) | 3,5 % / 2 % | le nomade ne manquait jamais : 83 % vivants à J200, une fin sur trente par la faim |
| Pillage : plancher de population | — | max(population, 1,5) | les cirques et les Hauts (population 0–1) n'étaient presque jamais pillés : réserves intactes à J200 ; les réfugiés y montent |
| Usure des sites trouvés tard (nouveau, `abri.mjs`, `USURE_SITES`) | installations de départ intactes | +1 point d'état par 40 jours après le vingtième (J60 : 1, J100 : 2, J140 : hors service, à réparer) | le nomade squattait à J120 des fermes en parfait état ; cohérent avec l'abri abandonné qui s'abîme (2 %/jour) |
| Contenu : stocks des sites d'habitation des sept régions urbaines (`sites.mjs`) | nourriture 6–30, eau 5–15 | +6 à +8 nourriture, +2 à +5 eau (16 sites) | première faim du passif à J6 : une maison a au moins une semaine de garde-manger |
| Contenu : pièces des Hauts et cirques (`regions.mjs`) | Hauts de l'Ouest 40, Sud sauvage 50, Palmistes 25, Cilaos 25, Salazie 25, Mafate 10 | 50, 60, 35, 35, 35, 20 | les pièces bloquaient l'enraciné des Hauts (panneaux : 4, batteries : 3) ; Mafate a « des panneaux sur chaque toit » |

Non changés, mesurés et jugés justes : consommation (1 eau, 1,5 dans les Bas en saison des pluies ; 1 nourriture), pertes 5 %
arrondies au supérieur, productions des installations et délais, coûts et travail des chantiers, infestation de départ et montée,
cyclones (0,9 par partie de 200 jours), éruptions (0,5), rencontres (contrat §1.7), morsure et infection.

Essais mis à jour pour suivre : `essais/survie-monde.test.mjs` et `essais/survie-mutations.test.mjs` (décomposition des Bas
0,045 : 3 → 2,955).

## 4. Ce que le simulateur n'a pas pu équilibrer, et pourquoi

- **L'infection domine les fins des petits groupes** (solo nomade : 28 %, solo enraciné : 23 %, mixte × 1 : 38 %). La morsure
  (6 au d6 de touche puis 6 au d6 de morsure, test de soins extrême) est la règle du contrat ; ce qui tue, c'est le nombre de
  rencontres d'un solo qui fouille tous les jours (17 par partie). Un vrai joueur négocie, contourne, choisit ses heures : le
  simulateur se bat ou se cache seulement. Laissé tel quel : c'est le prix du solo.
- **Les groupes de 4 et 6 enracinés restent très visités** (5 à 6,5 assauts par mois, 13 à 18 hordes par partie) alors que les
  groupes de 1 et 2 sont à 3 : la visibilité (ceil(personnes/2) + potager, panneaux, serre, basse-cour) attire hordes et bandes. Le
  camouflage (−1 à −3) vient tard dans l'ordre de construction du simulateur ; un groupe qui le monte tôt aura moins de visites.
  C'est voulu par le contrat (« ce qu'on ne voit pas, on ne l'attaque pas »), pas corrigé par les nombres.
- **Matériaux et pièces limitent les chantiers** (15 jours bloqués par partie d'enraciné × 4, surtout dans les Hauts et les
  cirques, pauvres en pièces) : relevé plutôt que corrigé au-delà de +10 pièces, parce que la rareté des pièces en altitude est
  dans le texte des régions (Mafate « pauvre en tout ce qui se pille »). Le bois des alentours sert de matériaux ; les pièces ne
  viennent que du pillage.
- **Le passif de la Fournaise ou du tunnel a faim dès J2** (Q1 global J2) : ces sites n'ont rien, c'est leur description.
- **L'eau de l'Ouest** : sur un site à citerne en climat sec (pluie 1), 4 personnes ne tiennent pas (citerne 1 × pluie + saison
  sèche × 0,5) ; l'enraciné du simulateur cherche un site à source ou rivière, et c'est ce que dit « Saint-Paul et la côte Ouest »
  (« sans réseau, on vit de citernes et de forages »). Pas corrigé.
- **Hordes et assauts pour les nomades** : ils bougent trop pour être trouvés (1,3 horde par partie) ; leur menace, ce sont les
  rencontres (28 par partie) et la faim.
- La **répartition automatique** (`repartir`) donne une tâche à chacun, y compris `fouille`, `chasse`, `atelier` sans
  installation : le simulateur ne garde que la garde et les bras des installations présentes, et place les autres selon la
  stratégie. Un groupe de deux ne peut pas à la fois garder, bâtir et manger : c'est mesuré, pas corrigé.

## 5. L'essai d'équilibre

`essais/survie-equilibre.test.mjs` joue le mode rapide (20 parties par cas, graine 1, cas passif-4, nomade-4, enracine-4,
enracine-1, en 3 s sur 4 fils) et vérifie des bornes larges : passif à 4 première faim J3–J20 et fin J8–J40 ; enraciné à 4 au
moins 40 % vivants à J200, au moins 40 % autonomes avec un jour médian J25–J110, au moins 0,5 assaut sérieux par mois après J30
et au plus 12 assauts ; nomade à 4 entre 10 % et 85 % vivants, au moins 8 déménagements, au moins la moitié des fins après J90 ;
solo enraciné entre 5 % et 85 % vivants, médiane ≥ J60, et pas plus long que l'enraciné à 4 ; Hauts plus durs que Bas après
J90 ; même graine, même partie.

## 6. Tableaux AVANT (logique et contenu d'avant l'équilibrage, simulateur final, graine 1)

#### Jours de survie (200 jours au plus, 3200 parties)

| Cas | Parties | Q1 | Médiane | Q3 | Vivants à J200 | Première faim (médiane, Q1–Q3) | Autonomes (jour médian, Q1–Q3) | Déménagements | Installations |
|---|---|---|---|---|---|---|---|---|---|
| passif × 1 | 200 | 13 | 26 | 49 | 3 % | J17 (J3–J32) | 36 % (J13, J7–J15) | 0.6 | 0 |
| passif × 2 | 200 | 12 | 24 | 56 | 3 % | J9 (J3–J16) | 33 % (J21, J7–J24) | 0.4 | 0 |
| passif × 4 | 200 | 11 | 18 | 44 | 3 % | J6 (J2–J9) | 27 % (J23, J8–J30) | 0.3 | 0 |
| passif × 6 | 200 | 5 | 14 | 20 | 5 % | J4 (J2–J7) | 20 % (J28, J16–J32) | 0.2 | 0 |
| nomade × 1 | 200 | 52 | 116 | 200 | 34 % | J1 (J1–J1) | 25 % (J123, J89–J155) | 5.4 | 0 |
| nomade × 2 | 200 | 126 | 200 | 200 | 54 % | J1 (J1–J117) | 38 % (J106, J86–J141) | 8 | 0 |
| nomade × 4 | 200 | 200 | 200 | 200 | 83 % | J52 (J1–J115) | 49 % (J118, J91–J157) | 11.3 | 0 |
| nomade × 6 | 200 | 200 | 200 | 200 | 84 % | J60 (J18–J125) | 40 % (J135, J92–J165) | 13.5 | 0 |
| enracine × 1 | 200 | 65 | 114 | 200 | 25 % | J21 (J21–J81) | 80 % (J20, J9–J20) | 2.9 | 9.8 |
| enracine × 2 | 200 | 87 | 148 | 200 | 32 % | J29 (J10–J82) | 63 % (J14, J9–J69) | 2.7 | 8 |
| enracine × 4 | 200 | 126 | 200 | 200 | 60 % | J29 (J10–J67) | 73 % (J61, J10–J78) | 2.7 | 15.7 |
| enracine × 6 | 200 | 138 | 200 | 200 | 60 % | J17 (J10–J29) | 66 % (J68, J52–J90) | 2.8 | 20.3 |
| mixte × 1 | 200 | 63 | 107 | 200 | 25 % | J43 (J1–J76) | 44 % (J80, J52–J108) | 3.3 | 3.9 |
| mixte × 2 | 200 | 94 | 189 | 200 | 49 % | J50 (J1–J98) | 49 % (J91, J67–J122) | 4 | 4.7 |
| mixte × 4 | 200 | 165 | 200 | 200 | 65 % | J56 (J28–J107) | 54 % (J105, J75–J142) | 4.1 | 8.8 |
| mixte × 6 | 200 | 148 | 200 | 200 | 59 % | J49 (J32–J79) | 52 % (J111, J85–J140) | 4.2 | 13 |

#### Causes de fin

| Cas | faim | soif | brèche/assaut | rencontre | infection | maladie | départ de tous | vivants à la fin |
|---|---|---|---|---|---|---|---|---|
| passif × 1 | 48 % | 36 % | 5 % | 1 % | 7 % | 2 % | 0 % | 3 % |
| passif × 2 | 55 % | 35 % | 3 % | 0 % | 4 % | 2 % | 0 % | 3 % |
| passif × 4 | 52 % | 38 % | 2 % | 0 % | 3 % | 4 % | 0 % | 3 % |
| passif × 6 | 43 % | 49 % | 2 % | 0 % | 2 % | 1 % | 0 % | 5 % |
| nomade × 1 | 0 % | 0 % | 16 % | 7 % | 43 % | 1 % | 0 % | 34 % |
| nomade × 2 | 1 % | 0 % | 12 % | 3 % | 30 % | 2 % | 0 % | 54 % |
| nomade × 4 | 2 % | 0 % | 4 % | 1 % | 11 % | 1 % | 0 % | 83 % |
| nomade × 6 | 4 % | 0 % | 2 % | 2 % | 8 % | 1 % | 0 % | 84 % |
| enracine × 1 | 2 % | 6 % | 24 % | 3 % | 40 % | 1 % | 1 % | 25 % |
| enracine × 2 | 2 % | 11 % | 24 % | 2 % | 26 % | 4 % | 0 % | 32 % |
| enracine × 4 | 2 % | 8 % | 14 % | 2 % | 15 % | 1 % | 1 % | 60 % |
| enracine × 6 | 1 % | 8 % | 11 % | 1 % | 18 % | 2 % | 1 % | 60 % |
| mixte × 1 | 1 % | 1 % | 31 % | 4 % | 39 % | 0 % | 0 % | 25 % |
| mixte × 2 | 1 % | 5 % | 13 % | 2 % | 28 % | 2 % | 1 % | 49 % |
| mixte × 4 | 2 % | 6 % | 13 % | 1 % | 12 % | 1 % | 1 % | 65 % |
| mixte × 6 | 2 % | 6 % | 13 % | 3 % | 14 % | 1 % | 2 % | 59 % |

#### Menaces vécues et ressources

| Cas | Cyclones / partie | Éruptions / partie | Hordes à l'abri / partie | Assauts par mois après J30 (sérieux : force ≥ 3) | Brèches / partie | Rencontres / partie (évitées) | Jours sans eau | Jours sans nourriture | Ressource limitante | Blocages de chantier |
|---|---|---|---|---|---|---|---|---|---|---|
| passif × 1 | 0.3 | 0.11 | 1.32 | 4.39 (2.77) | 0.76 | 0.1 (0) | 1.4 | 13.4 | nourriture | — |
| passif × 2 | 0.28 | 0.16 | 1.29 | 4.55 (2.71) | 0.7 | 0.1 (0) | 1.9 | 25.6 | nourriture | — |
| passif × 4 | 0.19 | 0.08 | 1.23 | 5.02 (2.96) | 0.64 | 0.1 (0) | 1.5 | 21.9 | nourriture | — |
| passif × 6 | 0.21 | 0.12 | 0.88 | 3.81 (1.89) | 0.5 | 0 (0) | 2 | 28.3 | nourriture | — |
| nomade × 1 | 0.54 | 0.39 | 4.64 | 5.1 (3.14) | 2.75 | 15.4 (4.4) | 0.1 | 0.5 | nourriture | — |
| nomade × 2 | 0.88 | 0.46 | 5.3 | 4.7 (2.67) | 2.82 | 20 (5.6) | 0.2 | 1 | nourriture | — |
| nomade × 4 | 0.87 | 0.47 | 6.81 | 4.92 (2.76) | 3.36 | 32.5 (8.7) | 0.2 | 1.1 | nourriture | — |
| nomade × 6 | 0.89 | 0.48 | 7.44 | 5.19 (2.99) | 3.83 | 37 (8.9) | 0.2 | 0.8 | nourriture | — |
| enracine × 1 | 0.68 | 0.3 | 8.24 | 6.03 (3.86) | 2.84 | 6.4 (1.8) | 0.5 | 14.3 | nourriture | materiaux 835, pieces 102, graines 1 |
| enracine × 2 | 0.84 | 0.35 | 9.88 | 6.12 (4.08) | 3.08 | 12.3 (3.3) | 1 | 28.2 | nourriture | materiaux 652, pieces 165, graines 11, medicaments 4 |
| enracine × 4 | 0.87 | 0.49 | 18.2 | 8.29 (5.78) | 3.89 | 15.2 (3.7) | 0.6 | 28.9 | nourriture | materiaux 2175, pieces 1494, medicaments 57, graines 11 |
| enracine × 6 | 0.94 | 0.56 | 23.6 | 9.86 (7.22) | 5.03 | 18.5 (3.8) | 0.7 | 31.9 | nourriture | materiaux 2902, pieces 1601, graines 73, medicaments 54 |
| mixte × 1 | 0.62 | 0.31 | 6.37 | 5.51 (3.55) | 2.66 | 11.7 (3.5) | 0.1 | 6.4 | nourriture | materiaux 257, pieces 66 |
| mixte × 2 | 0.86 | 0.38 | 7.44 | 5.15 (3.16) | 3 | 16.1 (4.3) | 0.6 | 16.8 | nourriture | materiaux 308, pieces 74 |
| mixte × 4 | 0.9 | 0.48 | 10.55 | 5.91 (3.67) | 3.77 | 25.1 (6.8) | 0.6 | 22.8 | nourriture | materiaux 801, pieces 269, medicaments 6, graines 6 |
| mixte × 6 | 0.83 | 0.48 | 14.13 | 7.49 (5.12) | 4.96 | 27.1 (6) | 0.5 | 25.9 | nourriture | materiaux 1459, pieces 505, graines 36, medicaments 23 |

#### Régions de départ (toutes stratégies sauf passif)

| Région | Parties | Q1 | Médiane | Vivants à la fin | Autonomes |
|---|---|---|---|---|---|
| hauts-de-l-ouest | 156 | 135 | 200 | 54 % | 56 % |
| saint-leu | 156 | 113 | 200 | 56 % | 47 % |
| saint-pierre | 156 | 137 | 200 | 58 % | 58 % |
| le-tampon | 144 | 162 | 200 | 64 % | 66 % |
| sud-sauvage | 144 | 122 | 200 | 54 % | 70 % |
| fournaise | 144 | 114 | 200 | 51 % | 64 % |
| est | 144 | 116 | 200 | 55 % | 54 % |
| plaine-des-palmistes | 144 | 157 | 200 | 63 % | 54 % |
| cilaos | 144 | 157 | 200 | 64 % | 63 % |
| salazie | 144 | 136 | 200 | 53 % | 58 % |
| mafate | 144 | 154 | 200 | 62 % | 63 % |
| le-port | 156 | 93 | 197 | 49 % | 48 % |
| route-du-littoral | 156 | 72 | 165 | 46 % | 37 % |
| saint-paul | 156 | 94 | 162 | 40 % | 37 % |
| saint-denis | 156 | 66 | 141 | 42 % | 40 % |
| sainte-marie | 156 | 75 | 126 | 32 % | 31 % |

#### Hauts contre Bas après J90 (abris des parties encore en vie)

| Zone | Jours d'abri après J90 | Assauts par mois | Livides errants par mois |
|---|---|---|---|
| bas | 47222 | 5.25 | 1.88 |
| hauts | 116543 | 5.59 | 2.52 |

(3200 parties, graine 1, 44 s)

## 7. Tableaux APRÈS (mêmes parties, mêmes graines, logique et contenu ajustés)

#### Jours de survie (200 jours au plus, 3200 parties)

| Cas | Parties | Q1 | Médiane | Q3 | Vivants à J200 | Première faim (médiane, Q1–Q3) | Autonomes (jour médian, Q1–Q3) | Déménagements | Installations |
|---|---|---|---|---|---|---|---|---|---|
| passif × 1 | 200 | 13 | 29 | 61 | 8 % | J17 (J3–J45) | 36 % (J13, J7–J15) | 0.3 | 0 |
| passif × 2 | 200 | 12 | 24 | 96 | 9 % | J10 (J3–J16) | 34 % (J23, J7–J25) | 0.2 | 0 |
| passif × 4 | 200 | 11 | 18 | 74 | 12 % | J7 (J2–J9) | 29 % (J25, J8–J31) | 0.2 | 0 |
| passif × 6 | 200 | 6 | 15 | 20 | 9 % | J5 (J2–J7) | 21 % (J28, J16–J32) | 0.1 | 0 |
| nomade × 1 | 200 | 87 | 197 | 200 | 52 % | J1 (J1–J1) | 18 % (J100, J72–J128) | 17.2 | 0 |
| nomade × 2 | 200 | 170 | 192 | 200 | 51 % | J1 (J1–J122) | 18 % (J97, J66–J121) | 27 | 0 |
| nomade × 4 | 200 | 169 | 189 | 200 | 53 % | J108 (J1–J132) | 20 % (J80, J59–J102) | 32.2 | 0 |
| nomade × 6 | 200 | 157 | 176 | 197 | 39 % | J58 (J28–J106) | 11 % (J91, J60–J104) | 33.8 | 0 |
| enracine × 1 | 200 | 118 | 192 | 200 | 48 % | J50 (J17–J169) | 73 % (J18, J9–J20) | 1.9 | 8.3 |
| enracine × 2 | 200 | 181 | 200 | 200 | 71 % | J29 (J10–J125) | 52 % (J14, J9–J67) | 1.7 | 6.9 |
| enracine × 4 | 200 | 200 | 200 | 200 | 79 % | J23 (J10–J65) | 78 % (J61, J10–J83) | 1.6 | 15.5 |
| enracine × 6 | 200 | 200 | 200 | 200 | 76 % | J17 (J10–J29) | 75 % (J68, J50–J95) | 1.7 | 19 |
| mixte × 1 | 200 | 75 | 190 | 200 | 46 % | J65 (J1–J136) | 26 % (J84, J53–J129) | 2.7 | 2.2 |
| mixte × 2 | 200 | 194 | 200 | 200 | 72 % | J57 (J28–J138) | 27 % (J89, J61–J104) | 3.2 | 3 |
| mixte × 4 | 200 | 200 | 200 | 200 | 78 % | J65 (J29–J122) | 41 % (J109, J73–J141) | 3.4 | 7.5 |
| mixte × 6 | 200 | 197 | 200 | 200 | 75 % | J55 (J35–J83) | 37 % (J118, J98–J140) | 3.3 | 11.8 |

#### Causes de fin

| Cas | faim | soif | brèche/assaut | rencontre | infection | maladie | départ de tous | vivants à la fin |
|---|---|---|---|---|---|---|---|---|
| passif × 1 | 50 % | 37 % | 1 % | 0 % | 5 % | 1 % | 0 % | 8 % |
| passif × 2 | 55 % | 33 % | 1 % | 0 % | 3 % | 1 % | 0 % | 9 % |
| passif × 4 | 48 % | 37 % | 2 % | 0 % | 2 % | 0 % | 0 % | 12 % |
| passif × 6 | 40 % | 48 % | 0 % | 0 % | 3 % | 0 % | 0 % | 9 % |
| nomade × 1 | 1 % | 0 % | 5 % | 4 % | 28 % | 3 % | 9 % | 52 % |
| nomade × 2 | 13 % | 1 % | 3 % | 2 % | 12 % | 3 % | 17 % | 51 % |
| nomade × 4 | 26 % | 1 % | 1 % | 0 % | 2 % | 1 % | 18 % | 53 % |
| nomade × 6 | 42 % | 1 % | 0 % | 1 % | 2 % | 1 % | 16 % | 39 % |
| enracine × 1 | 2 % | 13 % | 9 % | 5 % | 23 % | 3 % | 1 % | 48 % |
| enracine × 2 | 2 % | 9 % | 6 % | 2 % | 9 % | 3 % | 0 % | 71 % |
| enracine × 4 | 1 % | 5 % | 3 % | 2 % | 10 % | 1 % | 1 % | 79 % |
| enracine × 6 | 1 % | 7 % | 4 % | 3 % | 9 % | 2 % | 0 % | 76 % |
| mixte × 1 | 0 % | 4 % | 8 % | 3 % | 38 % | 3 % | 0 % | 46 % |
| mixte × 2 | 3 % | 6 % | 2 % | 3 % | 14 % | 2 % | 0 % | 72 % |
| mixte × 4 | 2 % | 7 % | 1 % | 1 % | 11 % | 1 % | 1 % | 78 % |
| mixte × 6 | 3 % | 5 % | 5 % | 1 % | 10 % | 2 % | 2 % | 75 % |

#### Menaces vécues et ressources

| Cas | Cyclones / partie | Éruptions / partie | Hordes à l'abri / partie | Assauts par mois après J30 (sérieux : force ≥ 3) | Brèches / partie | Rencontres / partie (évitées) | Jours sans eau | Jours sans nourriture | Ressource limitante | Blocages de chantier |
|---|---|---|---|---|---|---|---|---|---|---|
| passif × 1 | 0.35 | 0.14 | 0.41 | 2.32 (0.96) | 0.47 | 0.1 (0) | 1.4 | 18.1 | nourriture | — |
| passif × 2 | 0.38 | 0.2 | 0.47 | 2.13 (0.97) | 0.39 | 0 (0) | 1.4 | 42.4 | nourriture | — |
| passif × 4 | 0.26 | 0.14 | 0.53 | 2.33 (0.96) | 0.4 | 0 (0) | 1.5 | 36.8 | nourriture | — |
| passif × 6 | 0.26 | 0.14 | 0.38 | 2.18 (0.71) | 0.28 | 0 (0) | 1.9 | 38.1 | nourriture | — |
| nomade × 1 | 0.73 | 0.37 | 1.24 | 2.55 (1.24) | 1.16 | 17.3 (4.9) | 0.1 | 0.4 | nourriture | — |
| nomade × 2 | 0.83 | 0.35 | 1.42 | 2.49 (1.22) | 0.85 | 17.9 (4.8) | 0.2 | 0.8 | nourriture | — |
| nomade × 4 | 0.73 | 0.33 | 1.34 | 2.53 (1.1) | 0.73 | 27.8 (6.9) | 0.3 | 0.6 | nourriture | — |
| nomade × 6 | 0.74 | 0.28 | 1.4 | 2.98 (1.44) | 0.9 | 30.3 (6.4) | 0.2 | 0.5 | nourriture | — |
| enracine × 1 | 0.8 | 0.41 | 4.12 | 2.92 (1.56) | 1.5 | 8.5 (2.5) | 0.6 | 18.1 | nourriture | materiaux 865, pieces 362, medicaments 10, graines 4 |
| enracine × 2 | 1 | 0.49 | 4.38 | 2.74 (1.42) | 1.4 | 15.7 (4.4) | 0.5 | 36.3 | nourriture | materiaux 667, pieces 377, graines 76, medicaments 2, nourriture 1 |
| enracine × 4 | 0.94 | 0.56 | 12.65 | 5.2 (3.45) | 1.79 | 16.7 (3.9) | 0.3 | 27.1 | nourriture | pieces 3017, materiaux 2540, medicaments 574, graines 109 |
| enracine × 6 | 1.03 | 0.57 | 17.76 | 6.65 (4.77) | 2.2 | 19.1 (3.9) | 0.4 | 28.1 | nourriture | materiaux 3119, pieces 2798, medicaments 529, graines 242 |
| mixte × 1 | 0.74 | 0.43 | 1.74 | 2.44 (1.2) | 1.31 | 14.8 (4.5) | 0.2 | 13.3 | nourriture | materiaux 69 |
| mixte × 2 | 0.92 | 0.49 | 2.23 | 2.28 (1.15) | 1.16 | 19 (5.4) | 0.5 | 27 | nourriture | materiaux 162, pieces 144, medicaments 22, graines 4 |
| mixte × 4 | 1 | 0.52 | 5.2 | 3.15 (1.71) | 1.49 | 28.5 (7.1) | 0.7 | 45.4 | nourriture | materiaux 819, pieces 712, graines 75, medicaments 56 |
| mixte × 6 | 0.9 | 0.54 | 8.1 | 4.37 (2.8) | 2.08 | 30.5 (6.8) | 0.5 | 43.7 | nourriture | materiaux 1540, pieces 946, graines 190, medicaments 176 |

#### Régions de départ (toutes stratégies sauf passif)

| Région | Parties | Q1 | Médiane | Vivants à la fin | Autonomes |
|---|---|---|---|---|---|
| saint-paul | 156 | 154 | 200 | 56 % | 26 % |
| hauts-de-l-ouest | 156 | 175 | 200 | 69 % | 42 % |
| saint-leu | 156 | 171 | 200 | 65 % | 38 % |
| saint-pierre | 156 | 174 | 200 | 66 % | 46 % |
| le-tampon | 144 | 180 | 200 | 66 % | 51 % |
| sud-sauvage | 144 | 171 | 200 | 64 % | 53 % |
| fournaise | 144 | 179 | 200 | 66 % | 58 % |
| est | 144 | 164 | 200 | 58 % | 42 % |
| plaine-des-palmistes | 144 | 177 | 200 | 69 % | 47 % |
| cilaos | 144 | 188 | 200 | 69 % | 40 % |
| salazie | 144 | 171 | 200 | 65 % | 35 % |
| mafate | 144 | 187 | 200 | 69 % | 49 % |
| le-port | 156 | 154 | 198 | 56 % | 38 % |
| saint-denis | 156 | 109 | 197 | 53 % | 28 % |
| route-du-littoral | 156 | 98 | 195 | 52 % | 24 % |
| sainte-marie | 156 | 100 | 185 | 40 % | 18 % |

#### Hauts contre Bas après J90 (abris des parties encore en vie)

| Zone | Jours d'abri après J90 | Assauts par mois | Livides errants par mois |
|---|---|---|---|
| bas | 60180 | 2.59 | 0.81 |
| hauts | 108801 | 4.12 | 1.58 |

(3200 parties, graine 1, 49 s)
