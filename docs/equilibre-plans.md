# Équilibre du lot « plans » (2026-11-17)

Lot 4 de l'inventaire du jeu 3D (`images-essais/INVENTAIRE-3D-POUR-FVTT.md`) : la famille 7 « Les plans », jamais portée jusqu'ici,
pour un jeu de table sans cycles. Ce fichier donne les chiffres retenus et leurs raisons ; la règle est dans le contrat
(`docs/survie-contrat.md` §21) et dans la logique (`systems/lakour-survie/logique/plans.mjs`, avec un crochet dans `actions.mjs`
(la fouille « plans ») et deux dans `etat.mjs` (la fenêtre qui s'ouvre, l'eau du cyclone sur l'étagère)). Rien n'est retiré ni
renommé : `groupe.plans` garde son sens et ses clés (une installation construite une fois y entre comme avant) ; les champs nouveaux
ont une valeur par défaut ; une partie d'avant ce lot continue sans rien faire (un cahier dicté d'avant devient un plan unique).

**Décision de Jordan du 17 novembre 2026** : les plans restent un **rabais**. Un plan connu fait bâtir avec 25 % de matériaux en
moins et la moitié du travail (`PLANS` d'`abri.mjs`, inchangé), et fabriquer de même pour une recette. **Aucune installation, aucune
recette n'exige un plan trouvé** (l'essai du contenu le vérifie : aucun `requiert.plan` nulle part).

**Laissé de côté (cycles du serveur du 3D)** : la remise à zéro et la chance d'y garder un plan, les verrous et leurs malus, la
folie du verrou, la rareté mesurée sur le serveur (« moins de joueurs le connaissent »), le carnet mis à l'abri avant la remise à
zéro, les pages déchirées des plans perdus au cycle suivant, le gardien Livide d'un plan rare, la chance aux plans amassée par une
vie de Livide. Rien de cela n'a de sens sans cycles.

## 1. Le carnet et ce que le groupe connaît

**Règle.** Le carnet du groupe, c'est `groupe.plans` : des clés d'installation (comme avant) et, nouveau, des clés de recette
`recette:<clé>`. Ce que le groupe **connaît** (et qui donne le rabais) = le carnet ∪ ce que ses membres **vivants** savent **par
cœur** (`system.plans` du survivant) ∪ les **plans uniques** qu'il a en main (portés par un membre, ou sur l'étagère de l'abri où il
se trouve).

**Pourquoi un carnet qui ne se perd pas.** Dans le 3D, les plans meurent avec le survivant sauf par le carnet ; c'est le moteur des
cycles. À la table, `groupe.plans` est déjà « la meilleure compétence qu'on emporte » (contrat §0, « Repartir »), et le groupe
survit à ses morts par la relève : faire perdre le carnet casserait une règle en place et punirait la voie nomade. Ce qui se perd,
ce sont les **papiers** (§5) et ce qu'un mort savait **par cœur**.

**Fabriquer une recette ne l'inscrit pas au carnet** (contrairement à une installation bâtie). Raison : les recettes existantes
ont été équilibrées sans rabais (`docs/equilibre.md`) ; inscrire chaque recette faite une fois changerait tout l'atelier d'un coup.
Le rabais d'une recette ne vient donc que d'un papier lu, d'un plan unique ou d'un plan appris par cœur. Point laissé à Jordan.

## 2. Rareté et valeur

**Rareté** : de 0 à 100, entre un minimum et un maximum propres à chaque plan (les bornes du 3D quand le plan y a un équivalent :
la cuisine commune 10-35 comme le four à pain, le puits à balancier 30-55 (le puits du 3D : 30-60), le moteur à l'alcool 60-90
comme le kit alcool, le cahier de tisanes 90-100 comme le cahier de la gramoune ; les autres, par analogie). Un plan que le registre ne décrit pas (une barricade, l'autel) a la rareté 10-30.

**Rareté courante** : la moyenne, puis **un quart de l'écart jusqu'au minimum de moins par copie sortie du groupe** (donnée,
troquée), jamais sous le minimum. C'est la seule part de la « rareté du serveur » qui a un sens à la table (le 3D : « partager un plan
diminue sa rareté, mais un plan rare reste un plan rare », décidé par Jordan). Un plan unique ne circule pas : sa rareté reste la
moyenne.

**Valeur au troc** (en parts : une part = un jour de nourriture, l'unité du cours du marché, §12) : `3 + 0,2 × rareté courante`, arrondie,
**× 3 pour un plan unique**. C'est le barème du 3D (`6 + 0,4 × rareté`, × 3 unique) ramené en parts : au barème du 3D, la nourriture
vaut 2, au cours de FVTT 1 ; on divise par deux. Exemples (rareté moyenne) : potager 6, citerne de pluie 6, panneaux solaires 12,
pico-hydro 19, gazogène 19, cahier de tisanes 66.

Ce que ça représente : un plan courant vaut un médicament (5 parts) ; un plan rare, deux jours de vivres du groupe ; un plan unique,
une petite fortune (le 3D : « plus qu'un cabri »). Le rabais d'un plan rare paie ce prix : la pico-hydro au niveau 1 passe de
6 pièces et 16 quarts-personne à 5 pièces et 8 ; la galerie souterraine complète (quatre niveaux) économise 13 matériaux, 1 pièce
et 107 quarts-personne.

## 3. Trouver en fouillant

**Chance** d'une fouille « plans » d'un site, selon son type (le 3D : quincaillerie 30 %, hangar et garage 25 %, école et entrepôt
20 %, case 8 %) : commerce et usine 25 %, école 20 %, caserne, phare et port 15 %, hôpital et ferme 12 %, gîte, îlet et « autre »
10 %, case et maison 8 %, immeuble 6 %, église et galerie 5 %, tunnel de lave 3 % ; sans site (la région) 4 %. Elle vaut pour
**deux quarts-personne** et suit `√(membres × quarts / 2)`, au plus × 2 ; × 0,75 discret, × 1,25 rapide ; jamais plus de 60 %.
Mesuré : un commerce rend un plan à 18 % pour un fouilleur un quart, 25 % pour deux, 35 % pour quatre, 50 % pour huit
quarts-personne ; une case 6 %, 8 %, 11 %, 16 %.

Pourquoi la racine : le 3D tire une fois par fouille d'un bâtiment, quelle que soit l'équipe ; à la table, plus de monde et plus de
temps doivent aider, sans qu'une équipe de huit vide une quincaillerie de ses plans en un quart.

**Retour** : après un plan trouvé, le site ne rend plus de plan pendant 3 jours (commerce, usine), 4 (école, port, caserne, et par
défaut), 5 (case, maison, immeuble) ; 2 pour une fouille de la région. Ce sont les 3 à 5 jours du 3D (« récolté plusieurs fois »,
décidé par Jordan le 16 novembre).

**Ce qu'on tire** : les plans ordinaires dont les lieux contiennent le type du site, au poids `(110 − rareté moyenne) / 10` (un plan
courant pèse 9 à 10, un plan à 50 de rareté 6) ; **un plan rare (minimum ≥ 50) ne se trouve jamais dans un lieu ordinaire** ; les
**plans propres du site** (« le plan se trouve là où le savoir vivait » : la pico-hydro dans les centrales, le gazogène à la sucrerie
du Gol, l'antenne au phare de Bel-Air, 34 sites) même rares, au poids × 3 ; un plan **déjà au carnet** pèse moitié moins (on en
trouve une copie, à troquer). Un **plan unique** du registre que le type de site autorise (le cahier de tisanes, dans les cases)
pèse un dixième de tout le reste, une seule fois dans la partie : environ un plan trouvé sur onze dans une case, soit 0,7 % par
fouille de deux quarts-personne.

## 4. Les lieux à plans rares

Sept lieux, chacun gardé (par l'île : une gorge, une crête, un sentier, un tunnel ; ou par des Livides plus nombreux qu'ailleurs),
chacun avec trois à cinq plans à tirer, dont au moins un rare, et une table du MJ pondérée de même :

| Lieu | Région | Garde | Fenêtre | Retour |
|---|---|---|---|---|
| La salle des machines de Takamaka | l'Est | l'île, endurance difficile | saison sèche | 30 jours |
| Le relais des crêtes du Maïdo | Hauts de l'Ouest | l'île, survie difficile, 2 à 5 Livides des Hauts | saison sèche | 30 |
| L'îlet sans route de Roche-Plate | Mafate | l'île, endurance difficile, 1 à 4 Livides des Hauts | toujours | 45 |
| La station agronomique de Bassin-Plat | Saint-Pierre | Livides, discrétion difficile, 6 à 12 frais | nouvelle lune | 30 |
| Le laboratoire de la distillerie de Bois-Rouge | l'Est | Livides, discrétion difficile, 2 à 4 coureurs | nouvelle lune | 30 |
| Les tunnels de lave de l'Enclos | la Fournaise | l'île, endurance difficile | hors éruption (+ 3 jours) | 40 |
| Les conteneurs éventrés du Port Est | Le Port | Livides, endurance normale, 3 à 8 noyés | 7 jours après un cyclone | 20 |

**Une visite tire toujours un plan** (la garde est le prix : le système ne la joue pas, le MJ si) ; un plan déjà tiré là pèse
quatre fois moins (le 3D : « on peut revenir pour tenter les autres plans ») ; un plan unique n'en sort qu'une fois. Le retour (20
à 45 jours) laisse le temps à la fenêtre de se refermer. Deux visites coûtent deux quarts chacune.

**Les fenêtres** (« certains lieux ne s'atteignent qu'à certains moments », validé pour FVTT) : saison sèche (mai à octobre), nouvelle
lune (la phase « nouvelle » de `lune.mjs`, trois à quatre jours par mois), dans les 1 à 7 jours qui suivent un cyclone sur la
région (la date est gardée au monde secret, `monde.plans.cyclones`), entre deux coulées (jamais pendant une éruption ni dans les
trois jours qui suivent). Le jour où une fenêtre s'ouvre, le **journal secret** l'écrit (« La fenêtre s'ouvre ») ; rien de public :
le MJ en fait courir le bruit s'il veut (table « Plans — ce qui se raconte »). C'est l'événement « la fenêtre s'ouvre » de
l'inventaire, sans tirage (il ne change aucun hasard de la partie).

**Les « Livides plus durs »** du 3D tiennent au fil rouge, secret et non écrit (inventaire §3) : on prend ici les Livides qui
existent (les Livides des Hauts conservés par le froid, les coureurs, les noyés), en plus grand nombre.

## 5. Papiers : lire, copier, apprendre par cœur, l'étagère

**Lire** un plan demande le savoir-faire de son premier niveau (ou de la recette) : la pico-hydro l'hydraulique rurale, le gazogène
les moteurs de fortune, le potager rien. Un plan trouvé est lu tout de suite si quelqu'un du groupe sait ; sinon le papier reste,
« pour plus tard ou pour un autre » (le 3D, famille 1), et se lit en **une veillée** quand quelqu'un a appris.

**Copier** : une veillée (un quart) à l'abri, avec de la lumière comme une veillée de lecture (une unité d'énergie, sinon une
bougie et l'abri se voit ce soir-là). Le papier lui-même n'est pas compté : un cahier d'écolier ne manque pas avant longtemps, et
une ressource « papier » n'aurait servi qu'à cela. On copie ce qui est au carnet ou sur une copie ordinaire ; **jamais un plan
unique**.

**Apprendre par cœur** : `1 + rareté moyenne ÷ 25` veillées (1 pour le potager, 2 pour les panneaux solaires, 4 pour la pico-hydro
comme pour un plan unique), à l'abri, avec de la lumière, et le savoir-faire qu'il demande. « Un plan enseigné à un PNJ survit par
lui » (le 3D, à valider, validé pour FVTT) : tant que celui qui l'a appris vit et reste au groupe, le groupe le connaît, même si le
papier brûle ou si le cahier unique est volé. Il meurt avec lui.

**L'étagère aux cahiers** (installation de stockage) : niveau 1, deux planches et une caisse, 2 matériaux et 3 quarts-personne,
**12 papiers** ; niveau 2, un coffre étanche et caché, 4 matériaux, 1 pièce, 6 quarts-personne, **24 papiers**, protégé.
- **Vol** : une brèche faite par des vivants (pas une horde ni des Livides) emporte 1 à 3 papiers, au plus 1 du coffre.
- **Feu** : la moitié des papiers (arrondie au-dessus), rien dans le coffre. Le système n'a pas d'incendie d'abri : le MJ le décide
  (« L'étagère brûle ou est volée »).
- **Eau** : un cyclone qui abîme un abri qu'on n'a pas préparé gâte un papier, rien dans le coffre (flux de hasard à part,
  « etagere|jour »).
- **Déménagement** : les papiers partent avec le groupe (ils ne pèsent rien) ; le 3D laisse le carnet dans l'abri abandonné, mais à
  la table c'est une perte que personne ne choisirait.

## 6. Les plans uniques

Trois au registre, un seul exemplaire chacun dans la partie : le **cahier de tisanes d'une gramoune** (90-100, tisanes et rimèd
lontan, apprend les zerbaz ; dans une case), le **carnet du fontainier** (85-100, captage, conduite de bambou, citerne lontan, puits à
balancier, apprend l'hydraulique rurale ; à l'îlet de Roche-Plate), le **cahier de l'électricien de la centrale** (85-100, pico-hydro,
batteries, panneaux solaires, apprend l'électricité solaire ; à la salle des machines de Takamaka). Ils couvrent plusieurs plans
parce qu'un plan unique est le trésor de la famille 7 ; ils ne donnent pourtant que le rabais ordinaire.

Le **cahier dicté** d'une gramoune (lot « savoirs ») « devient un plan unique » : il couvre les installations **lontan** et les
recettes dont un niveau demande un savoir qu'elle a dicté (et les tisanes si elle sait les zerbaz). Chaque gramoune ne dicte qu'un
cahier : chacun est unique. Un cahier écrit avant ce lot l'est aussi (ses plans se déduisent de ce qu'il enseigne).

## 7. Ce qui n'est pas là

- **Les plans vendus par la boutique** (l'assortiment de sept plans du 3D) et leur marge : le marché chiffré est le lot 10. La valeur
  d'un plan (`valeurPlan`) et la circulation sont prêtes pour lui.
- **Les plans des installations et recettes à venir** (four à pain, four à chaux, digesteur à biogaz, hache et sabre forgés, régulateur
  de charge, charrette, utilitaire électrique) : leurs installations et recettes viennent des lots 6 et 7. Celui qui les ajoute ajoute
  leur plan au registre (`contenu/plans.mjs`) ; le fabricant vérifie le reste.
- **Le journal retrouvé sur le corps** : le lot 3 ; `reprendrePlans({ deId, aId })` lui sert de point d'entrée pour les papiers du mort.
