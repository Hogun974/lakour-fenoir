# Équilibre du lot « ateliers » (2026-11-17)

Lot 6 de l'inventaire du jeu 3D (`images-essais/INVENTAIRE-3D-POUR-FVTT.md`) : les outils, les ateliers et les recettes, traduits pour
un jeu de table. Ce fichier donne les chiffres retenus, leurs raisons et les mesures ; la règle est dans le contrat
(`docs/survie-contrat.md` §24), la logique dans `systems/lakour-survie/logique/armes.mjs` et `fabrication.mjs`, le contenu dans
`modules/lakour-fenoir/contenu/ateliers.mjs` et `recettes-3d.mjs`. Rien n'est retiré ni renommé.

**Laissé de côté (temps réel, propre au jeu vidéo)** : la vitesse d'un coup d'outil et l'élan d'une arme (FVTT ne compte pas les
coups), la marche ralentie par le bouclier (× 0,92 et × 0,88 : FVTT n'a pas de vitesse de marche par personne), le plein de la
tronçonneuse (40 coups, 70 révisée : FVTT ne compte pas le carburant d'un outil), la portée des armes en mètres, les « remises »
où l'on range les transports (lot 7), les terrains interdits que FVTT ne connaît pas (boue, escalier, sous-bois : seuls route, piste,
sentier et mer existent), les poids en kilos (FVTT compte en charges, environ 15 kg la charge).

## 1. Les ateliers

| Chiffre | Valeur | Le 3D | Pourquoi |
|---|---|---|---|
| Métiers | 9 : coin du feu, établi, forge, vannerie, couture, case à tisanes, mécanique, électricité, distillerie | les mêmes | la liste du 3D, telle quelle |
| Niveaux | 3, le matériau fait le niveau | pierre sèche ou bambou / bois sous tôle / parpaing | « c'est le matériau qui fait le niveau » |
| Coût du niveau 1 | 2 ou 3 matières de l'île (`ile`, le bois des alentours) pour les six ateliers lontan ; tôle de récupération (1 à 3 matériaux, 1 ou 2 pièces) pour la mécanique, l'électricité, la distillerie | ateliers.json, ramené au barème « ce qu'un objet vaut dans une ressource de Fénoir » | on commence avec ce que l'île donne ; l'atelier de FVTT coûte 4 matériaux et 2 pièces : un niveau 1 de métier coûte moins, mais ne sert qu'un métier |
| Coût des niveaux 2 et 3 | 4-5 matériaux (+ pièces) ; 5-8 matériaux, 1-4 pièces, maçonnerie | idem | « de plus en plus coûteux » (un essai le vérifie) |
| Travail | 4, 8, 14 quarts-personne | 30, 60, 120 coups | l'ordre de l'atelier de FVTT (8 puis 12) |
| Au-dessus du niveau demandé | +1 dé et × 1,5 de vitesse par niveau, au plus +2 et × 2 | même chose | gardé ; les dés entrent dans le plafond des aides de FVTT (outil + installation ≤ 2) |
| L'atelier de FVTT | sert d'établi, de mécanique et d'électricité à son niveau | « à l'atelier du métier, au même niveau » | les parties en cours gardent toutes leurs recettes |
| Cuisine commune, gazinière | servent de coin du feu, niveau 1 | — | on ne bâtit pas deux feux pour faire un savon |
| Visibilité, odeur | aucune au repos | — | un atelier qu'on n'utilise pas ne fume ni ne sent ; la fumée et le bruit viennent du travail (ligne suivante). Un premier essai leur donnait la visibilité et l'odeur de la cuisine commune : voir § 7 |
| Bruit d'une recette | forge 2 (niveau 1) ou 3 (niveau 2), aménagements 2, motoculteur 2 | bruit de la recette | ajouté au bruit de l'abri pendant le travail, comme une action |

**Des recettes d'avant changent d'atelier** (l'inventaire) : bocaux et boucané, savon, poêle de masse au coin du feu ; alcool
désinfectant à la distillerie. C'est plus exigeant que FVTT d'avant ; la cuisine commune et la gazinière, présentes dans beaucoup de
sites et de parties, servent de coin du feu. L'alcool de canne (carburant) reste sans installation (son alambic de fortune est dans
la recette) : à trancher.

**Des ateliers sont déjà là** sur 20 sites (forges de sucrerie et de chantier, garages du fret et de la caserne, cuisines de cantine
des collèges, alambic du Tévelave, vannerie de Saint-Philippe, case à tisanes de Bellemène et de Hell-Bourg…), et dix sites portent
des plans du lot (« le plan se trouve là où le savoir vivait »).

## 2. Les outils en trois qualités

| Chiffre | Valeur | Le 3D | Pourquoi |
|---|---|---|---|
| Bonus d'un outil forgé | celui de FVTT (sabre à canne, couteau, pelle et pioche, pied-de-biche gardés tels quels) ; neufs : hache, masse +1 bricolage +1 combat, marteau, scie, truelle, pince +1 bricolage, gratte +1 survie, lance +2 combat | « la valeur de Fénoir reste sur l'objet qui était là » | gardé |
| Récupération | le même bonus | atouts 0, vitesse 0,7 | FVTT ne compte pas la vitesse d'un coup : la différence passe dans la solidité |
| Fortune | un dé de moins, jamais sous 0 (le plus souvent aucun) | atouts −1 | gardé ; un outil de fortune ouvre surtout les recettes qui demandent l'outil |
| Usages | forgé 40, récupération 20, fortune 6 (un usage = un quart de travail avec l'outil, une fabrication, un combat) | solidité 1 / 0,5 / 0,15 ; hache 400 coups, une trentaine d'arbres | un quart d'abattage fait 2 à 4 arbres ; 40 quarts ≈ 30 arbres ou 40 fabrications |
| Réparation de fortune | 1 matériau, un quart ; ½, ¼, ⅛ des usages ; trois fois | idem | gardé ; un forgé tient ainsi ~75 usages, un de fortune ~12 |
| Pierre à aiguiser | ¼ des usages d'une lame, hors des trois réparations, sans coût | un ingrédient de la tronçonneuse révisée | lui donne un usage à la table |
| Trouvé en fouillant | fortune 60 %, récupération 30 %, forgé 10 % ; au palier 4 : 43 / 36 / 21 % | `factures.json` | gardé (`qualiteTrouvee`, table du MJ ; le lot « fouille » le branchera) |
| La lance de récupération et forgée | +2 combat | 2 atouts (comme le fusil) | gardé : à deux mètres d'une bouche qui mord, sans munitions ni bruit ; à confirmer |

**Ce qui ne s'use pas** : tout objet sans qualité ni usages (les armes blanches et outils d'avant que le lot ne range pas : batte,
barre à mine, caisse à outils, arcs, arbalètes). **Ce qui s'use déjà** : les outils rangés (couteau, sabre à canne, pelle et pioche,
pied-de-biche : forgés ; lance de fortune), le bouclier de tôle (12 usages), les armes à feu (fusil 40, carabine 60, pistolet 50,
fusil d'assaut 60), la tronçonneuse (25). Seules les fabrications usent automatiquement ; le reste, le MJ le compte (`userOutil`).

**Le chemin depuis rien** (une personne, sans plan) : éclat de basalte (1 quart) → hache de fortune (2) → forge de pierre sèche (4, et
3 matières de l'île) → meule de charbon (4) → marteau forgé (2) → forge de tôle (8) → hache forgée (4) : 25 quarts-personne, six jours
d'une personne, ou deux jours à trois. Une hache de récupération à l'établi (2 quarts) est le raccourci pour qui a un établi et de la
ferraille.

## 3. Les suites, le bouclier doublé, l'enrayage

| Objet | FVTT | Le 3D |
|---|---|---|
| Arc renforcé | tir +2 | 2 atouts (1) |
| Arbalète d'acier à levier | tir +2 | 2 atouts (1), se retend en 2,5 s |
| Bouclier doublé et cerclé | combat +1, parade 4 (4-6 : 50 %), 3 charges, 30 usages | parade 45 % (tôle 30 %), 300 coups (120) |
| Fusil de chasse remis en état | tir +3, 70 usages, s'enraye sur trois 1 | 3 atouts, enrayage 1 % |
| Carabine .22 et pistolet remis en état | tir +2, 100 et 85 usages | 2 atouts |
| Tronçonneuse révisée | bricolage +2, bruit 2 (au lieu de 3), 40 usages | bruit 2, 400 coups (250) |

Le bouclier de tôle du lot « corps » ne change pas (parade 5, un tiers). Le doublé pare la moitié des touches (essai :
3 000 tirages, 50 % contre 33 %).

**L'enrayage.** Le 3D compte un tir à la fois (fusil 4 %, carabine et pistolet 3 %, remis en état 1 %, × 3 au bout de l'usure) ;
FVTT résout un échange de tirs en un test. La règle « au moins deux 1 au test » donne, selon la réserve :

| Dés au test | Arme d'origine | Usée (les 2 comptent) | Remise en état | Remise et usée |
|---|---|---|---|---|
| 2 | 2,8 % | 11,1 % | 0 % | 0 % |
| 3 | 7,4 % | 25,9 % | 0,5 % | 3,7 % |
| 4 | 13,2 % | 40,7 % | 1,6 % | 11,1 % |
| 5 | 19,6 % | 53,9 % | 3,5 % | 21,0 % |

Un échange de tirs de deux ou trois coups, dans le 3D : 7,8 à 11,5 % pour le fusil, 2 à 3 % remis en état, 23 à 32 % usé. Les
chiffres de FVTT tombent dans ces fourchettes à 3 et 4 dés (la réserve d'un tireur moyen avec son arme). Plus de dés, plus de risque :
un bon tireur tire plus longtemps, donc plus de coups. Le test enrayé est un échec qui ne se force pas.

## 4. Les recettes

**103 recettes ajoutées** (l'inventaire : « environ 88 », plus les outils en trois qualités et les suites décidés le 16 novembre),
**138 en tout**. Elles sont converties au barème du 3D (« Ce qu'un objet vaut dans une ressource de Fénoir ») : un matériau = un
tronc, quatre planches, ferrailles, fils de fer ou tissus, deux tôles ou bambous, cinq cordes, dix seaux de terre ou bottes de
chaume, vingt branches, gaulettes ou galets, cinquante feuilles de vacoa, cent clous, vingt charbons ; une pièce = un ressort, une
cellule, deux câbles, tuyaux ou lots de composants, quatre boîtes de vis ou chambres à air ; dix cannes, du miel ou de la cire = une
nourriture ; une brassée de zerbaz = une plante. Arrondi à l'unité, au moins une (sauf deux galets ramassés). Le travail du 3D est
gardé.

**Ce qui est une matière travaillée** (un objet que d'autres recettes consomment) : charbon de bois (trois sacs par meule, un par
ouvrage de forge), sel (deux bocaux), vinaigre de canne (deux), huile de bancoul (une bouteille), rhum de canne (deux), cendre
tamisée (trois seaux), roue de bois cerclée, régulateur de charge. Ils donnent leur couleur aux chaînes (la meule avant la forge, le
sel avant le boucané, l'huile avant les lampes et les armes remises en état) sans nouvelle ressource dans les stocks.

**Ce qui ne devient pas une recette** (déjà compté dans les matériaux et les pièces de FVTT) : débiter des planches, la poutre, les
bardeaux, les chevilles, les clous forgés, les pointes de fil de fer, la corde de vacoa, le tissu de vacoa, le torchis, la chaux de
coquillages, le mortier de chaux, le manche d'outil, le câble de récupération, le tuyau de bambou, les rustines, les cellules d'un
panneau. Dans FVTT, un matériau *est* déjà un tronc ou quatre planches : une recette « 1 matériau → 1 matériau » ne ferait rien.
La chaux, le torchis et le mortier reviendront avec les matériaux de construction du lot 7 (« bâtir »).

**Doublons écartés** : la natte de vacoa, la corde de choka, les tisanes, les moustiquaires, les recettes des repères (lot « cartes »)
existaient ; le carburant de canne et le kit moteur à l'alcool du 3D sont l'alcool de canne et le moteur modifié de FVTT (lot
« savoirs »). L'échelle de bambou, les engrais (cendre, purin), le paillis, les solutions nutritives, le fourrage, le grain et la
nourriture à poissons vont avec le vivant (lot 8) et la défense en hauteur (lot 7).

**Les remèdes faits à la main** ne sont pas des médicaments (ce qui les garde hors du marché) : chacun vise des maux (la tisane
d'ayapana la gastro-entérite, la citronnelle la dengue et le chikungunya, le cataplasme les plaies, piqûres et brûlures, le baume la
brûlure et la gale, l'eau salée et sucrée la gastro et le coup de chaleur, l'attelle la fracture, la lessive de cendre la gale, le
sirop de miel les fièvres longues, la tisane de la gramoune le ventre, les fièvres et la chaleur), donne un dé au soin et, sauf le
sirop, tient lieu d'un médicament. Aucun ne vise le Gris. Deux plantes et une eau font deux tisanes d'ayapana, qui épargnent deux
médicaments contre la gastro : c'est leur intérêt, et il ne vaut que pour ces maux.

**L'eau** : l'eau bouillie (1 matériau, 1 quart, au coin du feu) traite l'eau de l'abri un jour ; l'eau javellisée (1 médicament,
une bouteille de Javel, à l'abri) une semaine. Le risque des maladies de l'eau tombe alors comme avec un filtre (× 0,2).

## 5. Le marché : aucune rente

La borne du lot « marché » : une recette ne rapporte pas plus de **3 parts par quart de travail**, dans aucune phase. Le lot ajoute
deux cas que l'ancien essai ne voyait pas, **le plan** (¾ des ressources, la moitié du travail) **et le meilleur atelier** (× 2) ; et
il compte les objets consommés à leur valeur (`valeurObjet`). Essai : `essais/contenu-ateliers.test.mjs` (toutes les recettes, cinq
phases, deux saisons, avec le plan s'il peut être connu, au meilleur atelier).

| Recette | Pire cas, parts par quart | Où |
|---|---|---|
| semences triées | 3 | « après », sans plan (déjà là) |
| rimèd lontan | 3 | panique, avec le plan (cahier d'une gramoune) — **avant : 6** |
| pansements de fortune | 1,8 | panique |
| savon | 1,75 | panique, coin du feu de niveau 3 — **avant : 3,5** |
| tisanes | 1,5 | panique |
| cari au feu de bois | 1 | jour zéro, coin du feu de niveau 3 |
| les armes remises en état | 0 à −0,4 | — |
| tout le reste | ≤ 0,5 | — |

Deux corrections : le **savon** (2 → 3 quarts : cendre, lessive, cuisson) devenait une rente au coin du feu de niveau 3 (3,5 parts
par quart) ; le **rimèd lontan** (2 → 4 quarts : sirops, frictions, bains de feuilles) en était une depuis le lot « plans » pour qui
avait le cahier d'une gramoune (6 parts par quart, le plan divisant le travail). Les objets faits à l'atelier valent le coût de leur
recette (le lot 10), sauf les armes remises en état et la tronçonneuse révisée, au barème : fusil 25, carabine 21, pistolet 21,
tronçonneuse 27 (l'arme d'origine plus le ressort et l'huile, ramenés en parts comme le barème du 3D).

## 6. Transports

Une charge ≈ 15 kg (la charrette à bœufs de FVTT porte 40, celle du 3D 600 kg). Charrette à bras 8 (120 kg), chariot de
récupération 10 (150), vélo et remorque 7 (le vélo 3, la remorque 60 kg), motoculteur 2 seul, 32 avec sa remorque (500), utilitaire
électrique 20 (300), 36 avec sa remorque (+250) ; aucun ne passe les sentiers ; les plus larges ne se faufilent pas. Le motoculteur
boit ½ carburant par quart et fait 4 de bruit ; l'utilitaire 2 unités d'énergie (3 avec la remorque) et 0 de bruit. L'entretien
(rustines, huile, vis) est dit au MJ dans la description : FVTT n'use pas encore les véhicules (lot 7, l'entretien).

## 7. Mesures

Simulateur (`node essais/outils/simuler-parties.mjs --parties 300 --graine <g>`), 16 cas (4 stratégies × 1, 2, 4, 6 membres),
**300 parties par cas**, **graines 1 et 2**, 200 jours ; avant : le code de `lots-ateliers` au départ (vague2), après : ce lot.

| Cas | Graine 1 : médiane, vivants à J200 (avant → après) | Graine 2 : médiane, vivants (avant → après) | Premier essai, graine 1 : vivants |
|---|---|---|---|
| passif × 1 | 28 → 28 ; 13 % → 14 % | 31 → 30 ; 15 % → 15 % | 13 % |
| passif × 2 | 22 → 22 ; 13 % → 12 % | 22 → 22 ; 14 % → 13 % | 11 % |
| passif × 4 | 18 → 18 ; 12 % → 12 % | 18 → 18 ; 13 % → 14 % | 11 % |
| passif × 6 | 15 → 15 ; 11 % → 11 % | 15 → 15 ; 11 % → 12 % | 10 % |
| nomade × 1 | 200 → 200 ; 56 % → 56 % | 200 → 200 ; 56 % → 52 % | 54 % |
| nomade × 2 | 200 → 200 ; 72 % → 72 % | 200 → 200 ; 74 % → 73 % | 69 % |
| nomade × 4 | 200 → 200 ; 78 % → 81 % | 200 → 200 ; 85 % → 85 % | 83 % |
| nomade × 6 | 200 → 200 ; 82 % → 80 % | 200 → 200 ; 80 % → 82 % | 81 % |
| enracine × 1 | 200 → 200 ; 55 % → 55 % | 200 → 200 ; 54 % → 56 % | 58 % |
| enracine × 2 | 200 → 200 ; 78 % → 78 % | 200 → 200 ; 74 % → 73 % | 78 % |
| enracine × 4 | 200 → 200 ; 88 % → 87 % | 200 → 200 ; 84 % → 84 % | 85 % |
| enracine × 6 | 200 → 200 ; 84 % → 84 % | 200 → 200 ; 87 % → 87 % | 83 % |
| mixte × 1 | 200 → 200 ; 58 % → 57 % | 200 → 200 ; 57 % → 58 % | 57 % |
| mixte × 2 | 200 → 200 ; 74 % → 74 % | 200 → 200 ; 76 % → 76 % | 71 % |
| mixte × 4 | 200 → 200 ; 84 % → 81 % | 200 → 200 ; 86 % → 88 % | 79 % |
| mixte × 6 | 200 → 200 ; 86 % → 85 % | 200 → 200 ; 86 % → 87 % | 84 % |

**Lecture.** Les médianes ne bougent pas ; la part de vivants à J200 varie de −4 à +3 points selon le cas, dans les deux sens, et pas
dans le même sens d'une graine à l'autre : c'est le bruit du tirage (des installations de plus sur 20 sites décalent les tirages
des dégâts et des cyclones). Un essai tenu à part l'a montré : en retirant des sites les ateliers déjà là, les parties sont
**identiques** à l'avant, partie pour partie.

**Le premier essai** (dernière colonne) donnait aux ateliers la visibilité et l'odeur de la cuisine commune, et le simulateur
comptait chaque installation d'un site pour le choisir (+1 pour l'enraciné, +0,3 pour le nomade) : les groupes allaient s'installer
dans les sucreries et les collèges à atelier, qu'il n'utilise pas, et plus visibles (mixte × 4 : 84 % → 79 % de vivants ; passif × 4 :
Q3 63 → 24 jours). Deux corrections : **un atelier au repos ne fume ni ne sent** (la fumée et le bruit viennent du travail, le bruit
de la recette) ; **le simulateur ne compte plus les ateliers** dans le score d'un site (`INSTALLATIONS_NON_JOUEES`, comme le gaz du
lot « savoirs »), puisqu'il ne fabrique pas à l'atelier.

**Ce que le simulateur ne joue pas** : il ne fabrique que des tisanes (sans installation, sans outil, inchangées), ne tire pas, ne
pare pas, n'use pas ses outils : le lot ne pèse sur lui que par le savon et les bocaux qu'il ne fait pas, et par l'eau traitée qu'il
ne fait pas. Les mesures vérifient qu'il ne change rien à ce qu'il jouait ; les chiffres propres au lot sont ceux des sections 1 à 6
(rentes, enrayage, parade : calculés et éprouvés par les essais).

## 8. À trancher

- **L'échec d'une fabrication** : FVTT rend la moitié du coût (arrondie au supérieur) et le lot garde cette règle ; les objets
  demandés, eux, ne se perdent jamais. La mission disait « ne fait pas perdre les ingrédients » : si Jordan veut que rien ne se perde,
  c'est une ligne dans `fabriquer`.
- **Les recettes qui passent à un atelier** (savon, bocaux, poêle de masse, alcool désinfectant) : plus exigeant pour une partie en
  cours sans cuisine commune ni gazinière ; l'alcool de canne reste sans atelier.
- **La lance de récupération et forgée à +2** au combat (le 3D : 2 atouts).
- **Les matériaux de construction** (planches, chaux, torchis, mortier, bardeaux) : pas de recette tant que FVTT compte en
  matériaux ; à reprendre avec le lot 7.
- **Les dix questions du 3D** (`recettes-et-constructions.md`, l. 430-454) : les mots créoles sont gardés (gratte, bertel, tente,
  vouve, boucan, capeline, savates) ; la hache de fortune est gardée ; la chaux de corail n'est pas portée ; la charrette à bœufs
  seule (pas de cabri de trait) ; le rhum arrangé vaut la moitié d'un alcool désinfectant (deux bouteilles pour un médicament) ; la
  liste des plans est gardée, en rabais.
