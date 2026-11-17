# Équilibre du lot « vivant » (2026-11-17)

Lot 8 de l'inventaire du jeu 3D (`images-essais/INVENTAIRE-3D-POUR-FVTT.md`) : le vivant de l'abri, élevage, cultures et bêtes de
l'île, et le chien qui prévient sans attirer, traduits pour un jeu de table. Ce fichier donne les chiffres retenus, leurs raisons et
les mesures ; la règle est dans le contrat (`docs/survie-contrat.md` §27) et dans la logique (`systems/lakour-survie/logique/vivant.mjs`,
le chien dans `savoirs.mjs`, des crochets dans `abri.mjs` et `etat.mjs`). Rien n'est retiré ni renommé : un abri sans `vivant` a des
cheptels pleins et en santé ; la production de base de la basse-cour, de l'enclos à cabris, du bassin à tilapias et des ruches ne
change pas.

**Ce qui guide les chiffres** (Jordan, 16 novembre) : « une simulation où, seul, c'est très compliqué de tout faire, et où le groupe
fait vraiment la différence » ; et pour ce lot : l'élevage et les cultures nourrissent l'autonomie, mais **l'autonomie complète reste le
but d'une longue partie, pas un acquis rapide**.

**Laissé de côté (temps réel, propre au jeu vidéo)** : les bêtes dessinées une à une, leur allure selon la santé, la nuit des bêtes,
les carcasses qui restent à l'écran ; la portée de l'eau (12 m) et les rigoles posées point par point ; les réserves de grain et de
fourrage en objets (`grain`, `fourrage`, `pâtée`, `solution nutritive` : la table compte en ressources entières, et ce que mangent
les bêtes se lit dans ce que le groupe a, voir § 2) ; les jeunes qui grandissent (55 % de l'adulte) ; la lampe de culture ; les
mailles de 250 m des bêtes en liberté et leurs distances de fuite au mètre ; les produits en objets (lait, œufs, fumier, cuir : ils
sont dans la production de base, le sol et le récit) ; les réglages du serveur (`monde.cultures`, `monde.elevage`, `monde.betes_sauvages`).

## 1. Une seule règle pour tout ce qui vit

| Chiffre | FVTT | Le 3D | Pourquoi |
|---|---|---|---|
| Santé | 0 à 3, entière | 0 à 1 | l'échelle de FVTT (l'état d'une installation, le moral) ; un MJ la lit d'un coup d'œil |
| Un manque | −1 par jour et par manque | soif 0,34 à 0,5, faim 0,1 à 0,3, eau sale 0,2 à 0,4… par jour (sur 1) | sur 3, un jour de soif coûte 1 à 1,5 ; on garde 1 pour tous, et les manques s'additionnent (soif et faim : −2) |
| Un jour sans aucun mal | +1 | +0,2 (sur 1) | 0,6 sur 3 ; arrondi à 1 pour la table (un cheptel se remet en deux ou trois jours) |
| À 0 de santé | un tiers meurt chaque jour, au moins une bête | même chose | repris tel quel |
| Vigueur (production) | santé 2 et 3 : entière ; 1 : moitié ; 0 : rien | entière au-dessus de 0,5, puis en proportion | 0,5 sur 1 = 1,5 sur 3 |
| Se reproduire | santé 2 au moins, pas malade, deux bêtes, une place | 0,6 de santé | 1,8 sur 3, arrondi à 2 |
| Hors de son altitude | production ½, aucune naissance | demi-croissance, demi-production, pas de naissance | repris ; tilapia sous 900 m, anguille sous 1 200 m, camaron sous 500 m (le piment et la salade ne sont pas suivis : les bacs portent un seul genre de plants) |
| Maladie (chance par jour) | celle de l'espèce (1 à 3 %) × l'insalubrité de l'abri (propre ¼, ordinaire ½, sale ¾, insalubre 1) | 1 à 3 % tout à fait sale, le quart quand c'est propre | branchée sur l'insalubrité du lot « corps » (§19) : un abri propre protège aussi les bêtes |
| Malade | −1 de santé tous les deux jours | 0,1 à 0,2 par jour (sur 1) | 0,3 à 0,6 sur 3 : un demi-point par jour |
| La maladie passe seule | 10 % par jour | non (il faut le remède) | **ajout de FVTT** : sans lui, un groupe sans plantes perdait toujours son cheptel ; à la table, le MJ ne suit pas une maladie sans fin. Le remède reste bien meilleur (§ 4) |
| Le cri (bruit) | +1 par cheptel qui a eu faim ou soif, +2 au plus | + 1 quand il a faim ou soif | repris ; borné pour ne pas faire de l'élevage la première source de bruit |

**Les manques** (`MANQUES_VIVANT`) : la soif (l'installation s'arrête faute d'eau : les personnes boivent d'abord, comme pour le
potager ; ou on l'a éteinte : personne ne la remplit), la faim (§ 2), la panne (hors service, ou sans courant), l'eau sale (§ 3), l'ombre (des plants sans soleil ; les bacs et la
serre demandent un site au soleil, elle n'arrive donc qu'à la main du MJ), la surpopulation (plus de têtes que de places : seulement
quand on en met trop à la main ; les naissances s'arrêtent aux places).

## 2. Ce que mangent les bêtes, et l'eau

Le 3D nourrit chaque cheptel d'objets fabriqués (grain, fourrage, pâtée, solution) qu'il faut cuisiner. La table n'a pas ces objets,
et ajouter une consommation de nourriture aux installations de base aurait changé leur production nette (la règle du lot : « sans
changer leur production de base »). La faim se lit donc dans ce que le groupe a et fait :

| Ce qu'elle mange | Qui | Elle a faim quand… | Pourquoi |
|---|---|---|---|
| les restes | poules, cochons, poissons | personne n'a mangé ce jour-là, ou personne n'était à l'abri | les épluchures, les restes du cari, le son : tant qu'on cuisine quelque chose, il y en a ; quand les gens n'ont plus rien du tout, les bêtes non plus ; quand le groupe part, personne ne les nourrit. Un premier essai donnait faim aux bêtes dès que le groupe manquait d'une ration : les poules mouraient dans chaque disette, juste quand on en avait besoin (enracinés de six : 97 jours-cheptel de faim sur 32 parties) |
| l'herbe | lapins, cabris, bœufs | le site n'a pas de terre (sol 0 : un immeuble, un hangar, un port) et personne n'est à l'élevage | elles broutent ; sur le béton, il faut quelqu'un pour couper l'herbe ailleurs |
| la solution | plants hors-sol | aucun compost en service (compost, latrines sèches, étable, soue, clapier : tout ce qui rend du sol) | la solution nutritive est le jus du compost |

**L'eau est exigée pour tout ce qui boit** (décision de Jordan du 16 novembre) : la basse-cour boit ½ (le 3D : 0,5), l'enclos à cabris 1
(le 3D : 1), le clapier ¼ puis ½, la soue ½, l'étable 1, l'aquaponie ½ (« deux fois moins d'eau » qu'un potager), les bacs 1, la
serre hors-sol 2 ; le bassin à camarons est sur la rivière (l'eau qui court) ; le bassin à tilapias boit déjà 1. **Un cheptel vide ne
boit pas.**

**La pluie arrose ce qui pousse à ciel ouvert** (proposé dans le 3D, validé le 17) : un jour où il a plu la moitié des quarts au moins
(`conditions.pluie` ≥ 0,5, la pluie du lot « sens »), le potager, le jardin créole, le verger, la treille, la bananeraie et le jardin de
zerbaz ne prennent pas d'eau. Ni la serre, ni les bacs, ni les enclos.

**La voie d'autonomie de la ferme des Hauts** (vérifiée par le fabricant) passait juste (+0,13 d'eau en saison sèche) : avec les cabris
et les poules qui boivent, elle passait à −1,37. Elle prend le **jardin créole** (qui boit peu) au lieu du potager : +0,63 en saison
sèche, et 7 nourriture au lieu de 8 (toujours ≥ 0). C'est aussi ce que ferait une ferme des Hauts en hiver. Les quatre autres voies ne
bougent pas.

## 3. Le soin de tous les jours

| Chiffre | FVTT | Le 3D | Pourquoi |
|---|---|---|---|
| Bassin à tilapias, niveau 1 | à curer tous les 20 jours | « se cure en 20 jours, à la pelle » | repris |
| Bassin à tilapias, niveau 2 (la pompe) | tous les 8 jours | bassin à pompe : filtre bouché en 8 jours | le niveau 2 de FVTT est le bassin à pompe du 3D |
| Aquaponie | tous les 30 jours ; **deux jours sans pompe : tout meurt** | 30 jours ; « deux jours sans pompe tuent tout » | repris |
| Bacs de culture | tous les 12 jours | bouché en 12 jours | repris |
| Serre hors-sol | tous les 8 jours | rampe : 8 jours | repris |
| Qui le fait | quiconque est à la tâche du genre (élevage pour les bêtes et les poissons, cultures pour les plants), chaque jour | un travail (6, 5, 4 coups) | la table a déjà ses tâches du jour (§10.3) : on ne compte pas les coups. Sans personne à la tâche, l'eau se salit (un manque) ; `curer` le fait à la main (un quart) |
| Resemer les plants | une graine pour six plants, un semis par jour, à la tâche « cultures » | 4 à 6 graines par souche | une graine = « de quoi semer une planche » (§1.6) |

## 4. Les gestes du groupe

| Geste | FVTT | Le 3D | Pourquoi |
|---|---|---|---|
| Soigner un cheptel | un quart, le remède, un test de survie normale (+1 dé avec l'élevage, le maraîchage pour les plants) | 2 de travail, le remède | le test de la table ; un échec consomme le remède |
| Le remède | une tisane de zerbaz (1 plante) pour les bêtes et les essaims ; l'eau changée (4 eau) pour les poissons ; la lessive de cendre (1 de bois des alentours) pour les plants | tisane, sel, lessive de cendre | la table n'a ni sel ni lessive en objets (le lot 6 pourra les fabriquer : jointure) ; on les dit avec ce qu'elle a |
| Abattre | la viande d'une tête : poule, lapin 1 ; cabri 6 ; cochon 10 ; bœuf moka 20 ; quatre tilapias, deux camarons ou deux anguilles 1 | poule 1, lapin 1, cabri 6, cochon 10, bœuf 20 ; un poisson, deux camarons par prélèvement | une ration = un jour de repas (§1.6) : un tilapia ne nourrit pas une personne un jour |

## 5. Les installations du vivant

**Ce qui existait** (basse-cour, enclos à cabris, bassin à tilapias, ruches) garde sa production de base. Le cheptel au **plein** la
donne entière ; les **places** laissent la marge des naissances, qu'on abat.

| Installation | Espèce | Places, plein (niveau 1 ; niveau 2) | Départ (achevée par le groupe) | Le 3D |
|---|---|---|---|---|
| Basse-cour | poule | 6, 4 ; 12, 8 | 3 | 8 places |
| Enclos à cabris | cabri | 4, 2 ; 6, 4 | 2 | 6 places |
| Bassin à tilapias | tilapia | 30, 20 ; 40, 30 | 12 alevins | 30 places (90 avec la pompe) |
| Ruches, ruches en tronc | essaim | 1, 1 | 1 | 1 |

Une installation **trouvée sur un site**, ou d'une partie d'avant le lot, est pleine. Une installation que le groupe **vient
d'achever** commence avec son départ : il faut des naissances, ou des bêtes trouvées, pour qu'elle donne à plein. Au niveau 2, le
plein monte : il faut deux fois plus de poules, de cabris. C'est ce qui fait de l'élevage une affaire de mois.

**Les installations nouvelles** (`contenu/vivant.mjs`), coûts ramenés à FVTT (un « coup » du 3D ≈ un cinquième de quart-personne ;
les matières de l'île pour ce qui est lontan) :

| Installation | Coût | Ce qu'elle donne | Le 3D | Pourquoi |
|---|---|---|---|---|
| Clapier | 3 matériaux, 1 nourriture, 4 quarts ; 5 et 6 avec l'élevage | 1 puis 2 nourriture après 45 jours ; ¼ puis ½ eau ; un peu de fumier | 1 puis 2 ; 20 et 30 coups | repris ; « de la viande sans bruit » (aucun bruit, aucune odeur) |
| Soue à cochons | 6 matériaux, 8 quarts, élevage | rien chaque jour (du fumier) ; un cochon abattu, 10 | idem ; vivres 1 par jour | les restes (§ 2) ; **commence vide** : un porcelet trouvé, un cochon marron pris |
| Étable (lontan) | 6 de l'île, 2 matériaux, 16 quarts, élevage, de la terre | 1 nourriture (le lait) après 30 jours, du fumier, 1 eau | 2 laits (un lait de cabri = la moitié d'une ration dans Fénoir) | **commence vide** : deux bœufs moka à trouver dans les Hauts ; ce ne sont pas des montures |
| Bassin à camarons (lontan) | 2 de l'île, 2 matériaux, 12 quarts, rivière ou source | 1 nourriture après 90 jours | camaron 90 jours, anguille 150 | l'espèce suit l'altitude (camarons sous 500 m, anguilles plus haut) |
| Aquaponie (moderne) | 8 matériaux, 4 pièces, 18 quarts, élevage et plomberie, soleil | 3 nourriture après 60 jours ; ½ eau, 1 énergie | 3 poissons et 8 brèdes | à la hauteur du bassin à tilapias de niveau 2, qui demande un potager |
| Bacs de culture en bambou (lontan, rôle « hors-sol ») | 3 de l'île, 1 graine, 4 quarts, soleil, compost | 1 nourriture après 12 jours ; 1 eau | 4 brèdes | sans terre ; un bac rapide, peu |
| Serre hors-sol (moderne, rôle « hors-sol ») | 10 matériaux, 4 pièces, 2 graines, 16 quarts, maraîchage et plomberie, soleil, compost | 4 nourriture après 20 jours ; 2 eau, 1 énergie ; maladie × 0,34 ; visible | cinq fois le bac | ramené à 4 : sans terre ni fumier, elle ne doit pas passer le potager de niveau 3 (6) ; sœurs : les deux ne s'additionnent pas |
| Jardin de zerbaz (lontan) | 2 de l'île, 2 graines, 6 quarts, zerbaz, de la terre | 1 plante par jour après 30 jours ; 1 eau | une brassée par jour après 30 jours | repris (le plafond des plantes reste 12) |
| Treille à chouchou (lontan) | 3 de l'île, 1 graine, 4 quarts | 1 nourriture après 90 jours ; 1 eau | idem | repris |
| Bananeraie (lontan) | 2 de l'île, 2 graines, 6 quarts, compost | 2 nourriture après 300 jours ; 1 eau | idem | repris : la récompense d'une très longue partie |
| Carreau de canne (lontan) | 2 de l'île, 2 graines, 8 quarts, terre et soleil | 1 nourriture après 365 jours ; visible | idem | repris ; la canne de l'alambic (lot 6) |

| Espèce | Naissances par jour et par couple | Une bête met… |
|---|---|---|
| poule | 0,08 | douze jours par couple |
| lapin | 0,1 | dix jours |
| cabri | 0,02 | cinquante jours |
| cochon | 0,03 | un mois |
| bœuf moka | 0,004 | huit mois |
| tilapia | 0,05 | vingt jours |
| camaron, anguille | 0,02 ; 0,01 | (tous les taux du 3D) |

## 6. Les bêtes portées, les bêtes en liberté

| Chiffre | FVTT | Le 3D | Pourquoi |
|---|---|---|---|
| Hors d'un enclos | poule, lapin 4 quarts ; porcelet 5 ; cabri 6 ; bœuf 8 ; essaim, poissons 2 | 24 h, 30 h, 36 h, 48 h, 12 h | en quarts de 6 h ; les poissons (absents du 3D) comme l'essaim |
| Une bête morte | sa viande (aux stocks de l'abri si le groupe y est, sinon à ce qu'il porte) | idem | « une bête morte se mange encore » |
| Prendre une bête | survie, facile pour une poule, normale sinon ; l'outil de l'espèce ; ratée ou sans l'outil : elle file, et les autres avec ; un essaim sans enfumoir pique (une blessure) et reste | idem | repris ; l'outil ne s'use pas |
| Les outils | cage de bambou, sac de goni (poule, lapin ; sac : porcelet) ; corde de choka (cabri, cochon, bœuf) ; enfumoir (essaim) ; collets et nasses (poissons) | cage, sac de goni, corde, enfumoir | la corde et les nasses existaient : on leur donne ce qu'elles prennent |
| Chasser | combat ou tir, normale, difficile si elle fuit ; la viande ; un tir : +2 au bruit de l'abri | l'épreuve de l'arme | repris |
| Les bêtes en liberté | poule marronne (3 à 7), lapins (2 à 5), cabris marrons (3 à 6), bœufs moka (2 à 4), et le cochon marron (2 à 5) ; dès l'effondrement | mêmes groupes ; selon le milieu | par zone de FVTT (`zones`, `poids`) ; six tables « Les bêtes de l'île » |

**Elles ne sont pas des créatures** : la logique ne les fait jamais combattre ni ne les tire dans les rencontres (la catégorie « bete »
reste hors de `creatures`) ; aucun tirage du monde ne bouge.

## 7. Le chien qui prévient sans attirer

| Chiffre | FVTT | Le 3D | Pourquoi |
|---|---|---|---|
| Flair | 44 m de jour, 22 m la nuit | 20 + 6 × 4 = 44 m, 22 m la nuit | repris (`alerteDuChien`, pour le MJ) |
| Aboie | sous 5 m : bruit 2 | sous 5 m, bruit de force 2 | repris |
| Mène | s'arrête à 14 m du Livide | idem | repris |
| La garde | +1 dé de vigilance par le chien, **en plus** d'une tour de guet (au plus +2), sans bruit ; aussi au bivouac et en marche, pour tout le groupe | il tourne autour de son maître, l'avis va au maître | avant ce lot, le chien comptait « comme une installation » (le meilleur des deux : rien de plus avec une tour) ; « prévenir sans attirer » vaut désormais quelque chose ; au plus +2 comme un outil et une installation |
| L'alerte | à l'abri, il grogne quand une horde ou des Livides viennent (une alerte, sans bruit) | l'avis au maître une fois par demi-heure | les menaces restent au MJ ; le groupe sait seulement que quelque chose vient |

**Gagner sa confiance** reste ce que le lot « savoirs » avait réglé (`CHIEN.seuil` 5, +1 par veillée réussie, +2 avec une marge de 2 ;
une veillée par quart) : le 3D en demande trois repas espacés de 4 h. Voir « À trancher ».

## 8. Les mesures

**Comment c'est mesuré** (`docs/equilibre.md`) : le simulateur de parties (`essais/outils/simuler-parties.mjs`), **300 parties par cas,
graines 1 et 2** (4 800 parties par graine et par état : seize cas, quatre stratégies de 1, 2, 4 et 6 survivants), 200 jours ; **avant**
le lot (`vague2` au commit 98790e2, dans une copie de travail à part) et **après** (cette branche). Pour l'année : les parties longues
(`essais/outils/parties-longues.mjs --graines 20`, onze scénarios, 365 jours), avant et après.

**Ce que fait le simulateur, après** : les cheptels sont ceux de la logique (santé, manques, naissances, maladie : `avancer`) ;
l'enraciné bâtit aussi un clapier, un jardin de zerbaz, une treille, une bananeraie, des bacs de culture et l'aquaponie (`ORDRE_VIVANT`),
pas la soue ni l'étable (elles commencent vides et le simulateur ne capture pas de bêtes) ; le soir, il soigne un cheptel malade s'il a le
remède, et abat ce qui dépasse le plein quand l'enclos est plein ou que les vivres manquent (moins de deux jours) ; jamais sous deux
bêtes. Il ne nourrit pas mieux ses bêtes quand il a faim : les poules ont faim avec lui.

**200 jours** (en %, graine 1 \| graine 2 ; 300 parties par cas et par graine) :

| Cas | Vivants à J200 : avant | après | Autonomes : avant | après | Jour médian de l'autonomie : avant | après | 1re faim (médiane) : avant | après |
|---|---|---|---|---|---|---|---|---|
| passif × 1 | 13 \| 15 (moy. 14.0) | 12 \| 14 (moy. 13.0) | 37 \| 36 | 37 \| 36 | J12 \| J13 | J12 \| J13 | J17 \| J17 | J17 \| J17 |
| passif × 2 | 13 \| 14 (moy. 13.5) | 13 \| 14 (moy. 13.5) | 31 \| 34 | 32 \| 34 | J21 \| J21 | J21 \| J21 | J10 \| J10 | J10 \| J10 |
| passif × 4 | 12 \| 13 (moy. 12.5) | 12 \| 13 (moy. 12.5) | 28 \| 29 | 29 \| 29 | J24 \| J24 | J24 \| J23 | J7 \| J7 | J7 \| J7 |
| passif × 6 | 11 \| 11 (moy. 11.0) | 10 \| 9 (moy. 9.5) | 21 \| 22 | 18 \| 18 | J29 \| J27 | J27 \| J27 | J5 \| J5 | J5 \| J5 |
| nomade × 1 | 56 \| 56 (moy. 56.0) | 55 \| 56 (moy. 55.5) | 1 \| 2 | 1 \| 2 | J155 \| J102 | J155 \| J102 | J189 \| J200 | J189 \| J200 |
| nomade × 2 | 72 \| 74 (moy. 73.0) | 71 \| 74 (moy. 72.5) | 1 \| 1 | 1 \| 1 | J123 \| J82 | J123 \| J82 | J64 \| J70 | J61 \| J65 |
| nomade × 4 | 78 \| 85 (moy. 81.5) | 80 \| 81 (moy. 80.5) | 3 \| 4 | 2 \| 3 | J108 \| J112 | J97 \| J112 | J117 \| J122 | J121 \| J124 |
| nomade × 6 | 82 \| 80 (moy. 81.0) | 81 \| 80 (moy. 80.5) | 1 \| 1 | 1 \| 0 | J82 \| J109 | J82 \| — | J131 \| J136 | J132 \| J135 |
| enracine × 1 | 55 \| 54 (moy. 54.5) | 56 \| 57 (moy. 56.5) | 70 \| 67 | 71 \| 68 | J8 \| J8 | J15 \| J8 | J21 \| J29 | J21 \| J29 |
| enracine × 2 | 78 \| 74 (moy. 76.0) | 76 \| 74 (moy. 75.0) | 54 \| 51 | 50 \| 50 | J15 \| J15 | J15 \| J15 | J21 \| J21 | J21 \| J21 |
| enracine × 4 | 88 \| 84 (moy. 86.0) | 87 \| 80 (moy. 83.5) | 72 \| 74 | 72 \| 74 | J52 \| J58 | J52 \| J56 | J28 \| J27 | J28 \| J28 |
| enracine × 6 | 84 \| 87 (moy. 85.5) | 86 \| 89 (moy. 87.5) | 73 \| 72 | 81 \| 78 | J72 \| J72 | J71 \| J74 | J17 \| J17 | J17 \| J17 |
| mixte × 1 | 58 \| 57 (moy. 57.5) | 58 \| 55 (moy. 56.5) | 19 \| 14 | 21 \| 17 | J82 \| J78 | J92 \| J93 | J111 \| J114 | J108 \| J115 |
| mixte × 2 | 74 \| 76 (moy. 75.0) | 74 \| 74 (moy. 74.0) | 18 \| 21 | 19 \| 20 | J87 \| J84 | J90 \| J79 | J56 \| J58 | J56 \| J58 |
| mixte × 4 | 84 \| 86 (moy. 85.0) | 81 \| 84 (moy. 82.5) | 37 \| 37 | 35 \| 36 | J105 \| J100 | J107 \| J100 | J58 \| J65 | J63 \| J58 |
| mixte × 6 | 86 \| 86 (moy. 86.0) | 85 \| 85 (moy. 85.0) | 46 \| 46 | 52 \| 49 | J124 \| J121 | J128 \| J128 | J57 \| J54 | J54 \| J58 |

| Cas | Installations : avant | après | Jours sans nourriture : avant | après | Jours sans eau : avant | après | Assauts par mois après J30 : avant | après | Fins par départ : avant | après |
|---|---|---|---|---|---|---|---|---|---|---|
| passif × 1 | 0 \| 0 | 0 \| 0 | 25.5 \| 28.4 | 24.8 \| 26.5 | 1.4 \| 1.3 | 1.3 \| 1.3 | 1.98 \| 2.09 | 1.99 \| 2.08 | 1 \| 3 | 2 \| 4 |
| passif × 2 | 0 \| 0 | 0 \| 0 | 40.9 \| 44.1 | 42.1 \| 45 | 1.5 \| 1.5 | 1.4 \| 1.3 | 2.13 \| 1.93 | 2.1 \| 1.9 | 1 \| 1 | 1 \| 1 |
| passif × 4 | 0 \| 0 | 0 \| 0 | 36.8 \| 40.7 | 37.6 \| 39.8 | 1.6 \| 1.4 | 1.7 \| 1.5 | 2.23 \| 2.19 | 2.19 \| 2.22 | 0 \| 0 | 0 \| 0 |
| passif × 6 | 0 \| 0 | 0 \| 0 | 35 \| 38.1 | 31.5 \| 31.5 | 2.3 \| 2 | 2.2 \| 2.1 | 2.13 \| 2.28 | 2.09 \| 2.25 | 1 \| 0 | 2 \| 2 |
| nomade × 1 | 0 \| 0 | 0 \| 0 | 17.2 \| 18.3 | 17.6 \| 18.1 | 0.2 \| 0.2 | 0.2 \| 0.2 | 2.17 \| 2.17 | 2.15 \| 2.17 | 2 \| 5 | 2 \| 5 |
| nomade × 2 | 0 \| 0 | 0 \| 0 | 48.2 \| 54.3 | 46.5 \| 52.6 | 0.3 \| 0.3 | 0.3 \| 0.3 | 2.21 \| 2.22 | 2.21 \| 2.21 | 12 \| 11 | 12 \| 12 |
| nomade × 4 | 0 \| 0 | 0 \| 0 | 36.8 \| 34.6 | 35.8 \| 32.8 | 0.3 \| 0.3 | 0.4 \| 0.3 | 2.49 \| 2.49 | 2.45 \| 2.43 | 8 \| 6 | 8 \| 12 |
| nomade × 6 | 0 \| 0 | 0 \| 0 | 23.2 \| 26.3 | 23.5 \| 26.1 | 0.5 \| 0.6 | 0.5 \| 0.6 | 2.84 \| 2.83 | 2.84 \| 2.8 | 6 \| 18 | 9 \| 17 |
| enracine × 1 | 9.5 \| 9.4 | 11 \| 11.5 | 21 \| 23 | 21.7 \| 22.7 | 0.7 \| 0.6 | 0.6 \| 0.6 | 2.74 \| 2.58 | 2.46 \| 2.5 | 2 \| 2 | 4 \| 4 |
| enracine × 2 | 7.8 \| 7.5 | 9.1 \| 8.8 | 41.9 \| 39.3 | 38.7 \| 40.2 | 0.3 \| 0.6 | 0.4 \| 0.6 | 2.52 \| 2.49 | 2.45 \| 2.38 | 4 \| 1 | 3 \| 1 |
| enracine × 4 | 17.2 \| 17.1 | 20.2 \| 19.8 | 29.8 \| 23.9 | 30.2 \| 28.8 | 0.4 \| 0.5 | 0.6 \| 0.5 | 4.21 \| 4.23 | 4.04 \| 4.35 | 1 \| 2 | 0 \| 2 |
| enracine × 6 | 22 \| 21.6 | 25 \| 24.7 | 28.8 \| 26.9 | 22.5 \| 25.5 | 0.5 \| 0.3 | 0.3 \| 0.3 | 5.54 \| 5.53 | 5.42 \| 5.27 | 4 \| 2 | 1 \| 0 |
| mixte × 1 | 1.9 \| 2 | 2.5 \| 2.5 | 13 \| 11.8 | 12.9 \| 11.7 | 0.2 \| 0.4 | 0.3 \| 0.4 | 2.17 \| 2.17 | 2.16 \| 2.19 | 1 \| 0 | 2 \| 1 |
| mixte × 2 | 2.8 \| 2.9 | 3.8 \| 3.7 | 31.2 \| 29.5 | 30.5 \| 29 | 0.8 \| 0.8 | 0.7 \| 0.7 | 2.18 \| 2.12 | 2.2 \| 2.09 | 6 \| 1 | 6 \| 1 |
| mixte × 4 | 8.8 \| 9.2 | 10 \| 10 | 34.4 \| 36 | 32 \| 37.5 | 0.4 \| 0.5 | 0.6 \| 0.5 | 3.04 \| 2.89 | 2.98 \| 2.74 | 7 \| 3 | 8 \| 4 |
| mixte × 6 | 14.5 \| 15.1 | 16.6 \| 17.3 | 36.4 \| 37.3 | 33.3 \| 33.2 | 0.4 \| 0.7 | 0.5 \| 0.6 | 3.75 \| 3.85 | 3.82 \| 3.89 | 6 \| 4 | 7 \| 5 |

| Cas (après) | Cheptels à la fin | Têtes | Naissances | Bêtes mortes | Maladies | Soins réussis | Viande abattue |
|---|---|---|---|---|---|---|---|
| passif × 1 | 0.1 \| 0.1 | 0.1 \| 0.1 | 0.2 \| 0.2 | 0.1 \| 0.1 | 0 \| 0 | 0 \| 0 | 0.8 \| 0.9 |
| passif × 2 | 0.1 \| 0.1 | 0.1 \| 0.1 | 0.2 \| 0.3 | 0.1 \| 0.1 | 0 \| 0 | 0 \| 0 | 1.3 \| 1.4 |
| passif × 4 | 0.1 \| 0.1 | 0.1 \| 0.1 | 0.2 \| 0.2 | 0.1 \| 0.1 | 0.1 \| 0 | 0 \| 0 | 1.1 \| 1.3 |
| passif × 6 | 0.1 \| 0.1 | 0.1 \| 0.1 | 0.1 \| 0.1 | 0.1 \| 0.1 | 0 \| 0 | 0 \| 0 | 0.6 \| 0.6 |
| nomade × 1 | 0.2 \| 0.2 | 0.3 \| 0.3 | 0.3 \| 0.3 | 0.2 \| 0.2 | 0 \| 0.1 | 0 \| 0 | 1 \| 1.1 |
| nomade × 2 | 0.2 \| 0.1 | 0.2 \| 0.1 | 0.6 \| 0.4 | 0.3 \| 0.3 | 0.1 \| 0.1 | 0 \| 0 | 2.6 \| 2 |
| nomade × 4 | 0.1 \| 0.2 | 0.1 \| 0.1 | 0.5 \| 0.5 | 0.5 \| 0.6 | 0.1 \| 0.1 | 0 \| 0.1 | 1.8 \| 1.9 |
| nomade × 6 | 0.1 \| 0.1 | 0.1 \| 0.1 | 0.3 \| 0.3 | 0.6 \| 0.7 | 0.1 \| 0.1 | 0.1 \| 0.1 | 0.5 \| 0.4 |
| enracine × 1 | 0.8 \| 1 | 1.3 \| 1.8 | 7.9 \| 10 | 8.5 \| 8.8 | 0.6 \| 0.7 | 0.3 \| 0.3 | 8.4 \| 10.4 |
| enracine × 2 | 0.8 \| 1 | 1.2 \| 1.6 | 6.9 \| 7.8 | 7.1 \| 6.4 | 0.4 \| 0.5 | 0.3 \| 0.3 | 7.8 \| 9 |
| enracine × 4 | 2.5 \| 2.6 | 9.6 \| 9.9 | 32.5 \| 31.9 | 5 \| 4.7 | 1.7 \| 1.7 | 1.5 \| 1.4 | 32.9 \| 32.4 |
| enracine × 6 | 3.5 \| 3.5 | 16.9 \| 17.3 | 52.5 \| 51.5 | 3.2 \| 2.5 | 2.6 \| 2.6 | 2.4 \| 2.4 | 51.4 \| 50.8 |
| mixte × 1 | 0.3 \| 0.3 | 0.5 \| 0.5 | 1.1 \| 1.2 | 1.8 \| 1.7 | 0.1 \| 0.1 | 0 \| 0 | 1.8 \| 2.1 |
| mixte × 2 | 0.4 \| 0.4 | 0.4 \| 0.7 | 1.5 \| 1.3 | 2.4 \| 2.2 | 0.2 \| 0.2 | 0.1 \| 0.1 | 2.3 \| 2.2 |
| mixte × 4 | 1.2 \| 1 | 4.2 \| 3.7 | 10.4 \| 8.5 | 1.5 \| 1.5 | 0.5 \| 0.5 | 0.4 \| 0.4 | 10.4 \| 9.1 |
| mixte × 6 | 2.3 \| 2.5 | 10 \| 10.8 | 24.7 \| 24.4 | 1.9 \| 1.8 | 1.2 \| 1.3 | 1.1 \| 1.1 | 23.2 \| 23 |

**Un an** (parties longues, 20 graines par scénario, 365 jours) :

| Scénario | Vivants à la fin : avant | après | Autonomes (jour médian) : avant | après | Autonomes à la fin : avant | après | Installations : avant | après | Jours sans nourriture : avant | après | Jours sans eau : avant | après |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| sedentaire-4 | 8/20 | 8/20 | 7 (J68) | 6 (J100) | 3 | 1 | 11 | 11.7 | 78.9 | 75.7 | 3.5 | 3.1 |
| sedentaire-2 | 6/20 | 4/20 | 7 (J12) | 6 (J12) | 4 | 1 | 5.9 | 6.7 | 76.1 | 71.4 | 1.1 | 1.5 |
| seul-enracine | 4/20 | 6/20 | 11 (J8) | 11 (J8) | 4 | 2 | 7.9 | 10.6 | 40.7 | 40.7 | 1.2 | 0.8 |
| seul-sedentaire | 6/20 | 4/20 | 8 (J9) | 7 (J9) | 5 | 3 | 7 | 7.8 | 70.9 | 60 | 0.4 | 1.1 |
| seul-nomade | 11/20 | 11/20 | 0 (J—) | 0 (J—) | 0 | 0 | 0 | 0 | 97.4 | 96.9 | 0.5 | 0.5 |
| compagnons | 14/20 | 13/20 | 12 (J66) | 14 (J64) | 3 | 2 | 15.4 | 18.7 | 56.6 | 50.8 | 0.5 | 0.6 |
| humains-4 | 13/20 | 13/20 | 13 (J50) | 15 (J54) | 4 | 4 | 13.9 | 16.3 | 74.3 | 67.9 | 0.8 | 0.7 |
| recrues | 10/20 | 9/20 | 7 (J20) | 10 (J89) | 1 | 2 | 12.3 | 12.8 | 117.8 | 79.7 | 1.4 | 0.3 |
| sans-recrues | 11/20 | 12/20 | 12 (J35) | 12 (J35) | 5 | 3 | 7 | 9.7 | 72.3 | 74.3 | 1.4 | 1.1 |
| nomade-4 | 10/20 | 12/20 | 1 (J72) | 1 (J72) | 0 | 0 | 0 | 0 | 111.9 | 123.4 | 0.6 | 0.4 |
| mixte-4 | 11/20 | 13/20 | 9 (J120) | 10 (J113) | 2 | 2 | 9.7 | 13.5 | 110.5 | 84.1 | 1 | 1 |

Aucune anomalie dans les parties longues (avant comme après) : pas de valeur négative, pas de texte sans clé ni sans traduction (les
clés `vivant-*` et `chien-grogne` sont produites et traduites).

## 9. Ce que le lot change à l'équilibre

Trois passes du simulateur ont été jetées avant celle-ci, chacune pour une raison écrite ici : (1) l'enraciné plantait des bacs, une
treille, une bananeraie qui boivent sans avoir l'eau (soif en hausse : il ne les bâtit plus que sur un surplus d'eau, comme le lavoir) ;
(2) en sécheresse, il gardait tout son cheptel (il n'en garde plus qu'un couple) ; (3) les poules avaient faim dès qu'il manquait une
ration au groupe et mouraient dans chaque disette (la règle des restes, § 2) ; et un bac de culture vide ne se ressemait plus.

- **La survie à J200** ne bouge pas pour les passifs, les nomades et les mixtes de un à deux ; elle **monte** pour les enracinés de six
  (85,5 → 87,5 %) et de un (54,5 → 56,5 %) ; elle **baisse d'environ deux points** pour les enracinés de quatre (86 → 83,5 %) et les
  mixtes de quatre (85 → 82,5 %), dans le bruit des deux graines à la graine 1, net à la graine 2 (84 → 80) : plus de morts de soif
  (15 | 19 → 20 | 22 sur 300). C'est le prix de « l'eau exigée pour tout ce qui boit » : les poules et les cabris boivent la réserve qui
  tenait les mauvais jours. Les assauts, les jours sans eau, les fins par départ ne changent pas.
- **Les cultures et l'élevage nourrissent** : à six, les jours sans nourriture baissent (28,8 | 26,9 → 22,5 | 25,5 pour les enracinés,
  36,4 | 37,3 → 33,3 | 33,2 pour les mixtes) ; sur un an, nettement (groupes de quatre 74,3 → 67,9 ; compagnons 56,6 → 50,8 ; mixtes
  110,5 → 84,1 ; recrues 117,8 → 79,7). Les enracinés de quatre et six bâtissent 3 installations de plus, abattent 32 à 51 rations de
  viande sur 200 jours et finissent avec 2,5 à 3,5 cheptels (10 à 17 têtes).
- **L'autonomie reste le but d'une longue partie** : plus de groupes de six l'atteignent (enracinés 73 | 72 → 81 | 78 %, mixtes
  46 | 46 → 52 | 49 %), à quatre autant qu'avant, et **jamais plus tôt** (jour médian J52 | J58 → J52 | J56 à quatre, J72 → J71 | J74 à
  six) ; sur un an, deux groupes de quatre de plus sur vingt l'atteignent, plus tard (J50 → J54), et **la tenir jusqu'au bout de l'année
  reste rare** (1 à 4 groupes sur 20 ; les sédentaires la gardent un peu moins : leurs bêtes boivent et tombent malades). Un abri trouvé
  avec ses installations est autonome tout de suite (J8 pour l'enraciné seul, avant comme après) : c'est le site, pas le lot.
- **À un ou deux, on choisit ce qu'on laisse tomber** : personne n'est à l'élevage ni aux cultures (le simulateur garde ses deux bras pour
  la garde et les vivres) ; les bacs s'encrassent, les cheptels ne grandissent pas (1,2 à 1,8 tête à la fin), leurs morts égalent leurs
  naissances. À quatre et six, ils prospèrent (32 à 52 naissances par partie).
- **Ce qui tue les bêtes** (diagnostic, 24 à 32 parties par cas) : à un et deux, l'eau sale des bacs que personne ne rince ; partout,
  la maladie, peu (1,6 à 2,3 par partie pour les enracinés de quatre et six, soignée presque toujours quand le groupe a une plante) ; la
  faim des poules quand le groupe n'a plus rien du tout (après la correction des restes, § 2 : 9 jours-cheptel sur 24 parties à six au
  lieu de 97 sur 32).

## 10. Les écarts au jeu 3D, et ce qui reste à trancher

- **La maladie passe seule** une fois sur dix par jour (le 3D demande le remède) : sans cela, un groupe sans plantes perdait toujours son
  cheptel, et le MJ suivait une maladie sans fin. À trancher : la garder, ou exiger le remède.
- **Les bêtes ne mangent rien des stocks** (le 3D : grain, fourrage, pâtée, solution en objets) : elles vivent des restes, de l'herbe, du
  compost (§ 2). C'est ce qui garde la production de base inchangée. À trancher si l'on veut un jour des rations de bêtes.
- **La serre hors-sol donne 4** (le 3D : cinq fois le bac, soit 5) : au-dessus, elle passait le potager de niveau 3 sans terre ni fumier.
- **Le chien se gagne en cinq crans** (lot « savoirs », 13 novembre ; le 3D : trois repas espacés de 4 h). Inchangé ici. À trancher :
  ramener `CHIEN.seuil` à 3.
- **Les chiens de garde** (l'installation) aboient toujours (bruit 1) : seul le chien du groupe « prévient sans attirer ». À trancher : les
  chiens de garde dressés (niveau 2, avec l'élevage) pourraient se taire aussi (bruit 0).
- **Le cheval de la Plaine des Cafres** (équipement de transport depuis le 4 novembre, repris des montures de Warcraft) va plus vite
  qu'à pied : c'est une monture ; le 3D dit que les animaux ne sont pas des montures (§4.4 de son brief), sauf la traction (l'âne de
  bât, la charrette à bœufs). Ce lot n'y touche pas. À trancher.
- **La voie de la ferme des Hauts** prend le jardin créole au lieu du potager (§ 2).
- **La peau, le lait, les œufs, le fumier** ne sont pas des objets : le lait et les œufs sont dans la production, le fumier dans le sol, la
  peau se raconte.

## 11. Les jointures avec les lots qui tournent en même temps

- **Lot 5 (fouille)** (lu dans sa copie, commit 36d5ff4, sans y toucher) : il tient lui aussi `etat.groupe.betes`, sous la forme
  `{ id, cle, nombre, prisLe, jusqua, enclos, abri }` ; ce lot a pris **la même forme** (`porterBete`, `betesPortees`, `betesQuiMeurent`)
  pour qu'il n'y ait qu'une liste, et ses clés `porcelet` et `veau-moka` sont des **alias** des espèces `cochon` et `boeuf-moka`. À la
  fusion : garder **une seule** expiration des bêtes portées dans `avancer` (`expirerBetes` du lot 5 ou `betesQuiMeurent` d'ici, pas les
  deux) ; son `enclore` (qui laisse la bête dans la liste, « à l'enclos ») devient `mettreEnEnclos` d'ici (la bête rejoint le cheptel de
  son espèce et quitte la liste) ; les enclos de ses bêtes trouvées (`betesTrouvees[].enclos` : le porcelet et le veau dans l'enclos à
  cabris, faute de mieux) deviennent la soue et l'étable ; ses noms exportés (`ajouterBete`, `betesDuGroupe`, `enclore`, `retirerBete`)
  ne se heurtent à aucun nom d'ici. Les outils : il crée `corde`, `cage`, `sac-de-goni`, `enfumoir` ; ce lot crée `cage-de-bambou`,
  `sac-de-goni`, `enfumoir` : **`sac-de-goni` et `enfumoir` sont en double** (clés et recettes), à ne garder qu'une fois ; les espèces
  d'ici acceptent déjà `cage` et `corde`.
- **Lot 6 (recettes)** (lu dans sa copie) : il crée aussi `cage-de-bambou`, `sac-de-goni` et `enfumoir` (`ateliers.mjs`) et la
  recette `cage-de-bambou` (`recettes-3d.mjs`) : **trois lots pour les mêmes outils**, à fusionner en une seule définition (garder le
  champ `capture` d'ici). Le sel de mer et la lessive de cendre pourraient devenir le remède des poissons et des plants
  (`especes[].remede.cout`) ; la canne du carreau de canne (aujourd'hui de la nourriture) peut nourrir l'alambic (rhum, vinaigre,
  carburant de canne) ; la charrette à bœufs et l'étable (traction).
- **Lot 7 (bâtir)** : l'entretien et l'encrassement génériques (`entretien: { tousLes, travail }`) recouvrent `effets.vivant.filtre` :
  garder l'un des deux pour les bassins, les bacs et l'aquaponie ; le matériau des installations nouvelles (clapier, soue : bois sous
  tôle ; étable, bacs : bambou et vacoa ; bassins : pierre sèche ou parpaing) ; le digesteur à biogaz demande l'enclos à cabris (lire
  `abri.vivant["enclos-a-cabris"].tetes > 0`) ; les pertes d'un assaut (`betesPerdues`, `pertesDAssaut`) sont appelées dans
  `assautInterne` à côté des papiers volés ; les crochets de `abri.mjs` (production, eau, bruit, chien) sont à garder à la fusion.
- **Lot 9 (paradis)** : le cri des bêtes s'ajoute au bruit de l'abri, l'élevage à son odeur : la chaleur du lieu peut les lire ; une ronde
  peut trouver une clôture pliée, une bête échappée (table « Un cheptel — ce qui arrive »).
