# Équilibre du lot « moral » : l'esprit sur le corps, le sens moral et l'autorité

Lot tiré du complément du jeu 3D (familles 2 « L'esprit sur le corps » et 3 « Le sens moral et l'autorité »), validé par Jordan le
2026-11-13. Les règles sont dans le système (`systems/lakour-survie/logique/esprit.mjs`, `moralite.mjs`, `porte.mjs`, `chefs.mjs` ;
contrat §11) ; ce fichier donne leurs **chiffres** et leurs **raisons**, puis ce qu'ils changent aux parties simulées. Chaque
chiffre est une constante nommée (`REGLES_ESPRIT`, `ACTES_MORAUX`, `REGLES_PORTE`, `REGLES_TRIBUT`, `REGLES_AUTORITE`…) : le
changer ne demande qu'une ligne.

Principe tenu partout : **rien n'est magique**. La foi et l'ancrage n'agissent que sur le moral (un plafond, un réconfort) ;
la chance du trahi n'est qu'un dé de plus ; le jeu ne dit jamais d'où ils viennent. Une fiche d'avant ce lot (regard vide) ne
voit **aucun** de ces effets tant que le MJ ne tire pas son esprit.

## 1. Le tirage

| Quoi | Chiffre | Pourquoi |
|---|---|---|
| Regard | épreuve 1, refaire le monde 1, vivre 1,2 ; les traits penchent (`effets.regard`) | trois façons de tenir, à peu près égales ; « Soleil dedans » penche vers vivre, « Nuage noir » et « Âme de pèlerin » vers l'épreuve, « Doigts de terre » et « Cœur de kour » vers refaire |
| Religion | poids du contenu (catholique 5, hindouisme tamoul 1,5, plusieurs 1,2, islam 0,6, évangélique 0,6, chinois 0,4, ancêtres 0,4, aucune 2) × affinité de l'enfance | une île catholique à 40 %, où beaucoup croient à plusieurs choses ; l'enfance (tamoule, comorienne, chinoise…) rend une religion plus probable, sans jamais rien imposer ni rien changer aux règles |
| Pratiquant | 40 %, 60 % dès 60 ans ; « Âme de pèlerin » +40 % | les anciens pratiquent davantage |
| Ancrage | seul le non-croyant en tire un (photo 3, carnet 2, routine 2, sport 2, instrument 1, plante 1) | le complément cite photo, carnet, routine, sport |
| Sens moral de départ | −2..+2 (1, 2, 3, 2, 1), plus les traits, borné à ±6 | personne ne naît saint ni monstre : « Main ouverte » +3, « Bras tendu » +2, « Doigts crochus » −2, « Brute épaisse » −2, « Œil froid » −1… |
| Autorité de départ | 1 + (parole ≥ 3) + (40 ans et plus) ± 1, plus les traits, bornée à 0..4 | « Sang de basalte » et « Tête de bois » +1, « Case à part » −1 |
| Flux de hasard | à part (`deriverHasard("esprit", …)`) | les survivants, recrues et parties tirés avant ce lot restent identiques (un essai le vérifie) |

Les 6 prétirés et les 11 PNJ ont leur esprit choisi à la main d'après leur histoire (jamais d'après leur origine).

## 2. L'esprit au jour le jour (`REGLES_ESPRIT`)

| Règle | Chiffre | Pourquoi |
|---|---|---|
| Pratiquant | plafond du moral +1 ; 3 jours sans observance : « en faute », −1 de moral une fois et plafond −1 jusqu'à la reprise | « gagne plus mais tient ses observances » ; trois jours, c'est un voyage, pas un oubli |
| Observance | « calme » : à l'abri, ou en route avec un coreligionnaire pratiquant ; « objet » (Bible, photo, carnet…) : tant qu'il n'est pas perdu | prier ensemble sur la route ; perdre l'objet, c'est perdre l'ancrage |
| Non-pratiquant | rien chaque jour ; une fois par semaine, à moral 1 ou moins : +1 | « gagne peu, ne risque rien » |
| Fête de sa religion | +1 de moral de plus au pratiquant (en plus du +1 de chacun) ; entente +1 | les fêtes du métissage donnent le tempo ; la fête rapproche |
| Regard nourri | tous les deux jours nourris : +1 (sans dépasser le plafond, et seulement à moral 2 ou plus) | à 1 jour, le regard rendait tout le moral perdu à la faim ; au fond, c'est le groupe qui retient, pas soi |
| Regard éteint | 7 jours sans ce qui le nourrit : plafond −1 jusqu'au prochain jour nourri | le revers du regard : un « vivre » sur la route, un « refaire » sans chantier s'éteignent un peu |
| Regard qui change | 14 jours sans, moral ≤ 2 : il bascule vers le regard le plus nourri pendant ce temps | « il peut changer en cours de partie » |
| Entente | −3..+3 ; ≥ 2 : plafond +1, ≤ −2 : plafond −1, pour qui n'est pas seul | la communauté a un effet, bon ou mauvais |
| Faux bruits | la nuit à l'abri, moral 0 : 50 %, 1 : 35 %, 2 : 20 %, −10 points par autre présent (au plus 3) ; +1 fatigue | « plus le moral est bas… la présence des autres les fait taire » |
| Celui qui lâche | moral ≤ 1 : +1 jour au fond (sauf 2 autres présents et entente ≥ 0) ; moral ≥ 2 : −2 ; signes à 2, 4, 6 jours ; départ à 8 (compagnon, recrue, PNJ) | les signes avant, le groupe qui retient ; un joueur ne part jamais seul (le MJ est prévenu) |
| Signes | mange moins : le repas ne lui rend plus de moral ; parle moins : −1 dé en parole ; donne ses affaires : au MJ | d'abord essayé en demi-ration : le groupe y gagnait des vivres (15 parties de nomades sur 300 sauvées par… celui qui lâche), retiré |
| Chance du trahi | +1 point (au plus 3), un dé de plus au prochain test qui compte | « lui y voit le ciel ; le jeu ne le dit pas » |

## 3. Le sens moral (`ACTES_MORAUX`, `moralite.mjs`)

| Acte | Jauge | Réputation (témoins) |
|---|---|---|
| exclure, colporter, mentir (démenti) | −1 | −1 (0 avec circonstances atténuantes) |
| abandonner, attaquer | −2 | −2 (−1) |
| trahir | −3 | −3 (−1) |
| accueillir, aider, partager, épargner, rendre | +1 | +1 (0) |

- Jauge et réputation de −10 à +10 ; bandes : rouge ≤ −6, plutôt rouge −5..−2, entre deux −1..+1, plutôt bleu +2..+5, bleu ≥ +6.
- Les circonstances atténuantes ne changent que la réputation (moitié, vers zéro) : « même avec des circonstances atténuantes ».
- Acte du groupe : le chef qui décide et tous ceux qui ne s'y sont pas opposés le portent ; qui a voté contre est épargné.
- Les voix qu'on ne joue pas (compagnons, recrues, PNJ) suivent la jauge (et « refaire » penche vers l'accueil ; les circonstances
  font fermer les tièdes).
- Enfant témoin (moins de 18 ans) : il imite le bleu (+1) ; devant le rouge, s'il a plus de cœur (soins, parole, survie) que de
  poing (combat, tir, discrétion), il se révolte (+1, une révolte) ; sinon il imite (−1). Trois révoltes : projet de départ
  (vengeance ou ailleurs), et le MJ apprend quels adultes bleus (jauge ≥ 3, pas le chef) pourraient l'aider.
- Aucune couleur n'est gratuite : un membre bleu (≥ 4) dans un groupe rouge (moyenne ≤ −3) perd 1 moral par semaine.

## 4. La porte (`REGLES_PORTE`)

| Règle | Chiffre | Pourquoi |
|---|---|---|
| Quelqu'un frappe (groupe à l'abri, esprit tiré) | panique 5 %, effondrement 7 %, silence 6 %, après 4 % par jour ; × (1 + 8 % par point de visibilité) ; × couleur (bleu 1,6 … rouge 0,6) | le bleu attire, et ce qui se voit attire ; un à cinq visiteurs par mois selon la phase, la visibilité et la couleur |
| Profils | bleu : réfugiés 3, familles 2, blessés 1,5, durs 0,3 … rouge : réfugiés 0,6, familles 0,3, blessés 0,3, durs 3 | « le bleu attire les réfugiés (des bouches en plus), le rouge attire les durs » |
| Famille | 1 à 3 bouches en plus (PNJ nourris par l'abri) | le prix du bleu |
| Dur | jauge −3, combat et tir +1 | |
| Attente | 2 jours, puis il repart | |
| Refus | jauge ≤ −3 : feu 70 % (bruit +4 dans 1 à 3 jours, il rougit) ; ≥ +3 : retour 60 % (dans 2 à 5 jours, avec 2 des choses qui manquent, il bleuit) ; entre : feu 10 %, retour 15 %, sinon il part | les quatre suites du complément ; le feu passe par le bruit, déjà lu par les hordes et les menaces |
| Liste à la porte | eau et nourriture pour 7 jours de consommation, médicaments 2, munitions 2, matériaux 4, pièces 2, graines 2, carburant 1, plantes 2 ; les 4 plus urgentes | « ce qui lui manque vraiment, d'après ses stocks » |

## 5. Les chefs (`chefs.mjs`)

- **Chef de bande** : poids par décision selon m = jauge/5 (−2..2) et r = force de la bande / (défense + valides) :
  attaquer (r ≥ 1 : 2, sinon 0,5) × (1 + rouge) ; ultimatum (r ≥ 0,8 : 1,5, sinon 0,3) × (1 + rouge/2) ; négocier 1 + bleu/2
  (+0,5 si plus faible) ; passer 0,8 (+1 si r < 0,6) + bleu × 0,3 ; rejoindre (2 × faim + seul) × (bleu ou neutre : 1, rouge : 0,3)
  × (plus faible : 1, sinon 0,3). Une réputation de groupe bleue (≥ 2) : rejoindre × 1,5, ultimatum × 1,3 (on le croit doux) ;
  rouge (≤ −2) : attaquer × 0,7, passer × 1,3. Le chef d'une faction part de son `sensMoralChef` (contenu : Sans-Lune −7,
  Garnison −2, Ferrailleurs −1, Pèlerins 0, Coopérative, Barques et Familles +1, Dispensaire +6), à ±2 près.
- **Tribut** (`REGLES_TRIBUT`) : tous les 7 jours ; payé 4 fois à une bande de jauge ≥ −3 : alliance ; une bande plus rouge
  augmente sa demande de 1 tous les 3 paiements ; refuser : révolte (une menace « bande » de sa force). Demande : 2 ressources
  (les vivres et le précieux d'abord), (force/2 + 1), doublé pour l'eau et la nourriture.
- **Autorité** (`REGLES_AUTORITE`, 0..5, 2 par défaut) : parole tenue +1, manquée −1 ; 7 jours où tout le monde mange +1 ;
  3 jours de faim −1 ; vote ignoré −1 (−2 contre les deux tiers), et entente −1. À 1 ou moins, chaque semaine, 35 % qu'un
  compagnon, une recrue ou un PNJ (le moral le plus bas) déserte ; à 0, le MJ est prévenu d'une scission (4 membres ou plus) ou
  d'un renversement (le plus écouté). En assaut : chef présent à 4+ : +1 dé de défense, à 1 ou moins : −1.
- **Séparation** : stocks au prorata des têtes (le reste au plus nombreux), plans à tous, l'abri à l'un des deux. **Fusion** :
  tout réuni, entente = la plus basse des deux − 1.

## 6. Ce que cela change aux parties simulées

Le simulateur (`essais/outils/simuler-parties.mjs`) joue des groupes tirés au générateur : ils ont désormais un esprit (regard,
religion, jauge). Il ne vote pas, n'ouvre jamais la porte et n'a pas de chef : seule la partie « esprit » (famille 2) joue, plus
les quatre événements du camp ajoutés au contenu (qui changent les tirages du monde). Trois mesures : le code d'avant le lot ;
le lot sans les effets de l'esprit (règles mises à zéro : seul le contenu change) ; le lot entier.

**200 jours, 100 parties par cas (graine 1), vivants à J200 :**

| Cas | Avant le lot | Lot, esprit coupé | Lot entier |
|---|---|---|---|
| passif × 4 | 12 % | 15 % | 15 % |
| nomade × 4 | 79 % | 83 % | 90 % |
| enraciné × 1 | 57 % | 56 % | 58 % |
| enraciné × 4 | 83 % | 87 % | 87 % |
| mixte × 4 | 87 % | 82 % | 81 % |

**Nomade × 4, 300 parties (graine 2), J200** : esprit coupé 85 % (254/300), lot entier 91 % (273/300).
**Un an, 96 parties (graine 3)** : nomade × 4 de 50 % (48/96) à 60 % (58/96) ; enraciné × 4 de 57 % (55/96) à 67 % (64/96).
**Moral** (60 parties) : jours à moral ≤ 1, nomade × 4 de 7,5 % à 3,6 %, enraciné × 4 de 6,2 % à 1,1 % ; moral moyen nomade
de 3,77 à 3,62, enraciné de 4,20 à 4,31.

Lecture : l'esprit ne gonfle pas le moral moyen (le regard éteint et les fautes le tirent vers le bas), il **resserre les
extrêmes** : moins de jours au fond (réconfort, groupe qui retient, regard qui nourrit), donc moins de dés perdus au pire
moment. C'est le nomade, qui vit dans la faim et la route, qui en profite le plus. Aucune composante seule n'explique l'écart :
chacune coupée seule laisse le nomade à 90–92 % sur 300 parties ; c'est leur somme. Essayés et laissés : réconfort tous les 14
jours (91 %), plafond du pratiquant à 0 (91 %), regard nourri tous les 3 jours (pas de différence) ; retiré : la demi-ration de
celui qui lâche (voir § 2).

Les essais d'équilibre (`essais/survie-equilibre.test.mjs`, 20 parties) passent sans changer leurs bornes ; mais le nomade,
désormais à 90 % de vivants à J200, touche la borne de 95 % plus souvent (20/20 arrive une fois sur cinq environ, selon la
graine) : à surveiller au moment de fusionner les lots. **À trancher par Jordan** : garder ce surcroît de survie (le moral est
« central », voulu), ou le ramener vers 85 % (leviers : `REGLES_ESPRIT.foi.reconfortSeuil` à 0, `regard.moralMin` à 3,
`regard.plafondEteint` à −2).
