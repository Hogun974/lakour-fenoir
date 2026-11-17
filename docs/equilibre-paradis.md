# Équilibre du lot « paradis » (2026-11-17)

Lot 9 de l'inventaire du jeu 3D (`images-essais/INVENTAIRE-3D-POUR-FVTT.md`) : la famille 5 du complément, « Le paradis et son
piège », et « rallumer l'île », le but d'une longue partie décidé par Jordan le 16 novembre, traduits pour un jeu de table. Ce fichier
donne les chiffres retenus, leurs raisons et les mesures ; la règle est dans le contrat (`docs/survie-contrat.md` §28) et dans la
logique (`systems/lakour-survie/logique/paradis.mjs`, avec des crochets dans `monde.mjs`, `abri.mjs`, `etat.mjs`, `generation.mjs`
et `gestion.mjs`). Rien n'est retiré ni renommé : une chaleur nulle, aucun agglutiné, aucune région rallumée ne changent aucun tirage
du monde (essai : les menaces rejouées avec le même hasard).

**Les deux limites de la mission.**
1. **La chaleur d'un lieu ne doit pas rendre l'enracinement intenable** : les deux voies doivent rester aussi valables l'une que
   l'autre.
2. **Rallumer l'île ne doit pas rendre la longue partie trop facile.**

**Laissé de côté (propre au serveur du jeu 3D)** : la remise à zéro et ce qu'on garde d'un cycle à l'autre, la désagrégation d'un abri
sans joueur connecté, le carré de 48 m autour du cahier, « on ne peut pas construire trop près d'une autre communauté » (une règle de
serveur multijoueur ; à la table, le MJ le dit), la bougie qui s'affiche à l'écran (ici, une table et un mot), la difficulté qui monte de
1 tous les 60 jours (FVTT a ses phases et la pression de la lumière). **Laissé au lot 7** (doublon sinon) : l'usure des installations,
l'encrassement et les pannes (« il se conserve : il faut le contrôler ») ; ce lot-ci n'en garde que le contrôle, par la ronde.

## 1. La chaleur d'un lieu

**Règle** : `monde.paradis.lieux[site].chaleur` (0 à 10, secrète). Le groupe n'en voit que le signe (`motChaleur`, sur l'abri).

| Chiffre | Valeur | Le 3D | Pourquoi |
|---|---|---|---|
| Monte par jour (quatre présents) | 0,05 | « monte avec le temps passé et la taille du groupe » (à valider, sans chiffre) | 2 en quarante jours (« on vous a remarqués »), 10 en deux cents ; une garde et des rondes la tiennent vers 1 à 3 |
| Taille du groupe | (personnes ÷ 4)^1,5, au plus 2 | idem | seul, un huitième ; à deux, un tiers ; à huit, deux fois. D'abord linéaire (seul un quart) : l'enraciné seul perdait 19 parties sur 192 (§ 6.1) |
| Hauts en saison sèche | × 1,25 | « l'hiver rassemble les Livides des Hauts en troupes » | la seule part saisonnière ; la transhumance, c'est surtout partir |
| Jour de bruit fort (4 et plus) | +0,05 | — | coups de feu, groupe électrogène : le bruit compte déjà pour les hordes (§1.7), ceci pour le lieu |
| Jour de silence | −0,2 | « redescend par des jours de silence » | un vrai sacrifice : ni chantier, ni atelier, ni chasse, ni fouille ; quatre jours effacent ce que seize ont fait |
| Lieu quitté | −0,08 par jour ; un agglutiné part tous les trois jours | « la transhumance entre Hauts et Bas » | un lieu à 10 est oublié en quatre mois : revenir une saison plus tard, c'est revenir dans un lieu tiède |
| Camp leurre | −2 (moitié dans la semaine d'un autre, ou vu en rentrant) ; ¾ des agglutinés le suivent | « des camps leurres » | un matériau, deux quarts, un test de discrétion : un outil de crise, pas une routine |
| Par Livide abattu en ronde | −0,4 | « des rondes régulières tiennent ce flux » | à quatre, il suffit d'en abattre un tous les huit jours pour que la chaleur ne monte plus |
| Par ronde engagée (pas la tournée) | −0,03 | — | la ronde efface aussi des traces, même vide |
| Seuil « on vous a remarqués » | 2 | — | au-dessous, ceux qui passent repartent ; au-dessus, sans ronde, une part reste |

**Ce qu'elle fait** (et ce qu'elle ne fait pas) :

| Effet | Valeur | Pourquoi |
|---|---|---|
| Arrivants par jour | (chaleur − 1) × 0,25 × min(1, infestation ÷ 2 ; au moins 0,15), au plus 6 | un lieu « oublié » ou à peine tracé n'attire personne ; une région vidée garde ses errants (15 %) |
| Horde présente qui trouve l'abri | +1 % par point au-dessus de 2 | l'inventaire : « un terme qui s'ajoute aux menaces de hordes » ; d'abord 2 % par point dès 0 : trop (§ 6.1) |
| Cap d'une horde de passage | +0,2 par point au-dessus de 2 (à côté de 1 + 2 × bruit) | « plus on reste, plus on attire » : la région d'un abri chaud tire les hordes ; d'abord 0,5 dès 0 |
| Visibilité | rien | l'inventaire : « pas à la visibilité, qui reste celle des bandes » |
| Livides errants | rien directement | ils viennent par le flux : c'est la ronde qui les prend, ou les agglutinés qui pèsent |

## 2. La ronde, la tournée, les agglutinés

| Chiffre | Valeur | Pourquoi |
|---|---|---|
| Chercher | vigilance, normale, le meilleur des rondiers | « la ronde est un vrai moment de jeu » : on voit, puis on abat |
| Vus à temps | +1 dé au combat ; ceux qu'on n'abat pas ne frappent pas | une ronde méthodique choisit son terrain : on recule. D'abord, chaque Livide resté debout frappait : les morsures de la ronde coûtaient plus que les assauts qu'elle évitait (§ 6.1, étapes 3 à 5) |
| Surpris | −1 dé ; le plus proche frappe, seulement quand l'échange n'en a abattu aucun | le danger reste (une morsure par an et par groupe qui fait la ronde, à peu près), sans être la règle |
| Par échange | trois Livides au plus | comme une brèche |
| Tournée du petit jour | la garde de la nuit, −1 dé ; sans les voir, elle reste derrière la clôture ; jamais d'indice | ce qui tient la plupart des abris gardés, sans y perdre un bras par jour (§ 6.1, étape 4) |
| Ronde manquée | 4 arrivants sur 10 restent ; 20 % des agglutinés repartent chaque jour ; au plus 8 | d'abord tous, sans départ, jusqu'à 12 : l'abri d'un groupe de deux était assiégé en dix jours (§ 6.1, étapes 1 et 2) |
| Agglutinés et menaces | +1 % d'errants par agglutiné ; +1 de force tous les cinq | d'abord 3 % et un par deux : les brèches de Livides passaient de 0,4 à 2,3 à 2,9 par partie d'un an |
| Agglutinés et chaleur | +0,005 par agglutiné et par jour | « ils attirent les suivants » ; d'abord 0,04 : la chaleur s'emballait d'elle-même |
| Indice | un sur dix (table « La ronde — ce qu'on trouve ») | le « contrôle » du paradis |

**La ronde est sur demande.** Ni les besoins du groupe, ni la répartition automatique, ni la grille par défaut ne la donnent : sinon,
chaque groupe aurait perdu un bras d'office, sans l'avoir choisi, et toutes les parties d'avant auraient changé. Le simulateur fait
faire la ronde à l'enraciné quand « ils viennent » ou quand des Livides traînent depuis deux jours, et jamais quand l'eau ou la
nourriture manquent.

## 3. Les corps

| Chiffre | Valeur | Pourquoi |
|---|---|---|
| Frais | 15 jours dans les Bas, 40 dans les Hauts comptés moitié | le lot « sens » : les Bas défont vite, les Hauts gardent, et sentent peu |
| Odeur | comme un mort sans repos, pour les bêtes seulement | le lot « sens » a décidé que les Livides ignorent l'odeur d'un corps : les corps attirent les chiens errants (+0,5 % par point d'odeur des bêtes) |
| Souillure | +0,05 par corps frais et par jour | dix corps, c'est une demi-personne sans latrines : les mouches, la gastro |
| Enterrer | 3 par quart et par bras, sans bruit | une fosse et de la chaux |
| Brûler | 10 par quart et par bras ; un bois pour cinq corps ; +2 de visibilité ce jour-là | « la fumée se voit » : les bandes regardent |
| Oubliés | après 90 jours | la liste ne grossit pas sans fin |

Le simulateur enterre un quart de travail chaque soir où quatre corps frais et plus s'entassent.

## 4. Sous terre et la haie

| Chiffre | Valeur | Pourquoi |
|---|---|---|
| Jours sans soleil | 7 : plafond du moral −1 ; 21 : −2 | « un compteur ronge le moral de ceux qui ne remontent jamais » ; comme le deuil (même place dans `effetJour`) |
| Remis à zéro | un jour dehors (fouille, chasse, pêche, eau, cultures, élevage, garde, ronde, chantier), un puits de jour, le groupe loin | ceux qui sortent ne comptent rien : c'est la cuisinière et le blessé qu'il faut faire sortir |
| Air lourd | plus des ¾ de la place | +1 fatigue au matin (la nuit repose une fois au lieu de deux) |
| Air vicié | plus de monde que de place | +2, alerte : la bougie s'étouffe |
| Puits d'air et de jour | niveau 1 : l'air d'un cran meilleur, −1 discrétion ; niveau 2 : le jour aussi, −1 discrétion, +1 visibilité | « chaque puits est un compromis » ; le fabricant refuse une discrétion qui baisse d'un niveau à l'autre : la lueur passe en visibilité |
| Haie de bambous | discrétion 1 puis 2, pousse en 60 puis 90 jours ; plie au cyclone | « le bambou plie et repousse » ; plus lente |
| Rideau de filaos | discrétion 1 puis 2, pousse en 30 puis 45 jours ; casse au cyclone (+1 d'état) | « le filao casse » ; plus vite, plus fragile |

Les haies sont les sœurs lontan du camouflage : une seule sert à la fois (le camouflage d'abord), elles ne s'ajoutent pas à lui. Le
simulateur ne les bâtit pas : l'équilibre n'en dépend pas.

## 5. Rallumer l'île

| Chiffre | Valeur | Pourquoi |
|---|---|---|
| Abri tenu | 30 jours | « une communauté y tient un abri » ; un mois, c'est une installation, pas une halte |
| Lieux gardés | chaque site de la région (sauf l'abri), nettoyé depuis moins de 90 jours | « en a nettoyé les lieux gardés » ; trois mois : il faut y retourner, la région ne se garde pas seule |
| Infestation | sous 2,5 (pas « dense ») | la bande des renseignements : les joueurs le sentent sans le chiffre ; d'abord 2 : les Hauts ne s'allumaient jamais |
| Lumière | 1 kWh produit, le réseau, ou un chantier à lumière | « y a ramené la lumière » ; une centrale relancée suffit |
| Extinction | dix jours sans abri ou sans lumière | « le noir revient si on l'abandonne » ; dix jours pour un aller-retour |
| Infestation d'une région rallumée | −0,03 par jour, plafond 1,5 ; aucune horde n'y naît ; dispersion +8 % | « devient moins dangereuse » |
| Errants autour de l'abri | × 0,5 | idem ; les fouilles aussi (rencontres × 0,5) |
| Bandes | +2 de visibilité pour elles (menace et visites) ; force +1 par 4 régions | « la lumière se voit, et les bandes viennent » ; d'abord +3 (§ 6.1) |
| Convoi attiré | 1,5 % par jour (+25 % par autre région rallumée) : la bande la plus forte d'une voisine (+0,5 de force là, −0,3 chez elle) | la pression qui monte avec l'île rallumée |
| Chantier : aide d'un allié | 2 quarts-personne par jour | « à plusieurs » : le phare (40) en 20 jours avec un allié, la centrale de l'Est (140) en 70 |

## 6. Les mesures

### 6.1 Comment on y est arrivé (sondes d'un an, enraciné, graines « sonde|0 » à « sonde|191 »)

Le premier jet suivait le complément à la lettre : chaque ronde manquée gardait tous ceux qui venaient, la chaleur pesait sur les
hordes et sur les errants dès le premier jour, chaque Livide resté debout frappait le rondier. Il rendait l'enracinement intenable.
Chaque étape ci-dessous est une partie d'un an, l'enraciné du simulateur (qui fait la ronde quand on l'a remarqué), comparée à la
même graine sans le lot (« base »).

| Étape | Ce qui change | Enraciné × 4 | Seul | Pourquoi on a continué |
|---|---|---|---|---|
| base | — | 25/32 · 71/96 · 134/192 | 26/96 · 61/192 | — |
| 1 | premier jet (0,06 par jour ; arrivants 0,35 × chaleur ; tous restent, jusqu'à 12 ; +0,04 de chaleur par agglutiné ; errants +1 %/point et +3 %/agglutiné, +1 de force par deux ; hordes +2 %/point, cap +0,5/point ; chaque Livide debout frappe) | 5/32 (sans ronde : 9/32) | — | la voie enracinée s'effondre : soif après des fuites, brèches de Livides × 7 |
| 2 | agglutinés au plus 8, la moitié reste, 15 % repartent ; +0,01 de chaleur | 8/32 (11/32) | — | idem |
| 3 | la chaleur ne pèse plus sur les errants (seulement le flux) ; hordes +1 %/point, cap +0,2/point ; agglutinés +1,5 %, +1 de force par quatre | 9/48 (22/48) | — | avec la ronde, c'est pire : les morsures de la ronde (+1,5 par groupe et par an) |
| 4 | vus à temps, ils ne frappent pas ; la tournée du petit jour de la garde | 23/48 | — | idem, moins |
| 5 | −0,4 par abattu (au lieu de 0,25), −0,03 par ronde ; la tournée ne s'engage que si elle voit ; surpris, un seul frappe | 61/96 (52/96) | 16/96 | à quatre, −10 ; seul, −10 |
| 6 | arrivants 0,25 × chaleur ; seul : un quart de la montée | 63/96 | 16/96 | seul, toujours −10 (nomade × 4 aussi : 39/96 contre 49) |
| 7 | aucun arrivant sous 1 ; surpris, il ne frappe que si l'échange n'a rien abattu | 60/96 | 17/96 | décomposé sur 192 parties : l'enraciné seul perdait 19 parties, dont 8 aux hordes et 11 au flux, sans dépasser 1,8 de chaleur |
| 8 | taille (personnes ÷ 4)^1,5 (seul un huitième) ; hordes seulement au-dessus de 2 (« remarqués ») ; 4 sur 10 restent, 20 % repartent, +1 % et un de force par cinq ; le simulateur ne fait sa ronde que quand « ils viennent » ou après deux rondes manquées | **127/192** | **59/192** | gardé |

Avec les mêmes graines, à l'étape 8 : enraciné × 2 **98/192** (base 97), nomade × 4 **93/192** (base 99). La voie enracinée paie le
paradis de quelques points (−4 % à quatre, −1 % seul, rien à deux), la voie nomade à peine moins (−3 %) : l'écart entre les deux voies
ne bouge pas (enraciné × 4 contre nomade × 4 : 134/99 avant, 127/93 après). C'est la limite 1.

**Ce que la ronde vaut** (192 parties d'un an, même tirage) : l'enraciné × 4 sans aucune ronde ni tournée vit dans 122 parties
(chaleur jusqu'à 7,5 en moyenne, 54 assauts par an au lieu de 50, 3,0 brèches au lieu de 2,8) ; avec la ronde et la tournée, 127 ;
sans le lot, 134. La ronde rend donc la moitié du prix, contre quelques morsures (0,12 par groupe et par an) et des journées de
travail. Seul, l'enraciné ne fait presque jamais de ronde (la chaleur ne passe pas 1,3) : 59 parties avec ou sans.

**La lumière.** Mesuré sur les mêmes 192 graines, l'enraciné × 4 qui rallume sa région contre le même sans rallumer, en ne
regardant que les parties où la région s'est allumée (72) :

| Lumière | Vivants (région allumée) | Sans rallumer (mêmes parties) | Menaces après la lumière (avec / sans) |
|---|---|---|---|
| aucune (ni visibilité, ni convoi ; 96 graines) | 37/37 | 35/37 | bandes 247 / 244, errants 238 / 689 |
| +1 de visibilité, convoi 1 % | 60/72 | 63/72 | bandes 602 / 445, errants 387 / 1 451 |
| **+2, convoi 1,5 %** (gardé) | **61/72** | **63/72** | bandes 747 / 445, errants 395 / 1 451, hordes 1 126 / 1 961 |
| +3, convoi 2 % (premier jet) | 56/72 | 63/72 | bandes 945 / 445, errants 375 / 1 451 |

Sans contrepoint, rallumer l'île rendait la longue partie plus facile (37 sur 37). Avec +2 et 1,5 %, une région allumée échange les
trois quarts de ses errants et 40 % de ses hordes contre 70 % de bandes en plus, et la survie ne bouge presque pas. C'est la limite 2.
Le nettoyage des lieux gardés, lui, coûte (des combats de plus) : dans les parties où la région ne s'est pas allumée, 56/120 contre
64/120.

### 6.2 Deux cents jours (`simuler-parties.mjs`, 300 parties par cas, graines 1 et 2)

« avant » : la branche sans le lot (98790e2) ; « après » : le lot, avec les rondes du simulateur. Chaque case donne la graine 1 puis
la graine 2. Les vivants et les autonomes sont en pour cent.

| Cas | Vivants à J200 : avant | après | Autonomes : avant | après | 1re faim : avant | après | Brèches par partie : avant | après | Assauts sérieux par mois après J30 : avant | après | Fins par départ : avant | après |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| passif × 1 | 13 \| 15 | 13 \| 15 | 37 \| 36 | 37 \| 36 | J17 \| J17 | J17 \| J17 | 0.43 \| 0.48 | 0.43 \| 0.48 | 0.69 \| 0.79 | 0.69 \| 0.79 | 1 \| 3 | 1 \| 3 |
| passif × 2 | 13 \| 14 | 13 \| 14 | 31 \| 34 | 31 \| 34 | J10 \| J10 | J10 \| J10 | 0.36 \| 0.31 | 0.36 \| 0.31 | 0.8 \| 0.71 | 0.8 \| 0.71 | 1 \| 1 | 1 \| 1 |
| passif × 4 | 12 \| 13 | 12 \| 13 | 28 \| 29 | 28 \| 29 | J7 \| J7 | J7 \| J7 | 0.38 \| 0.28 | 0.38 \| 0.28 | 0.85 \| 0.76 | 0.85 \| 0.76 | 0 \| 0 | 0 \| 0 |
| passif × 6 | 11 \| 11 | 11 \| 11 | 21 \| 22 | 21 \| 22 | J5 \| J5 | J5 \| J5 | 0.25 \| 0.3 | 0.25 \| 0.3 | 0.65 \| 0.86 | 0.65 \| 0.86 | 1 \| 0 | 1 \| 0 |
| nomade × 1 | 56 \| 56 | 56 \| 56 | 1 \| 2 | 1 \| 2 | J189 \| J200 | J189 \| J200 | 1.2 \| 1.19 | 1.2 \| 1.19 | 0.97 \| 0.93 | 0.97 \| 0.93 | 2 \| 5 | 2 \| 5 |
| nomade × 2 | 72 \| 74 | 72 \| 74 | 1 \| 1 | 1 \| 1 | J64 \| J70 | J64 \| J70 | 1.4 \| 1.3 | 1.41 \| 1.3 | 1.01 \| 0.98 | 1.01 \| 0.98 | 12 \| 11 | 12 \| 11 |
| nomade × 4 | 78 \| 85 | 79 \| 85 | 3 \| 4 | 3 \| 4 | J117 \| J122 | J118 \| J122 | 1.58 \| 1.48 | 1.59 \| 1.48 | 1.21 \| 1.17 | 1.24 \| 1.18 | 8 \| 6 | 8 \| 7 |
| nomade × 6 | 82 \| 80 | 81 \| 78 | 1 \| 1 | 1 \| 1 | J131 \| J136 | J128 \| J135 | 1.72 \| 1.45 | 1.77 \| 1.51 | 1.36 \| 1.35 | 1.37 \| 1.34 | 6 \| 18 | 5 \| 18 |
| enraciné × 1 | 55 \| 54 | 55 \| 54 | 70 \| 67 | 70 \| 67 | J21 \| J29 | J21 \| J29 | 1.31 \| 1.27 | 1.32 \| 1.26 | 1.27 \| 1.23 | 1.27 \| 1.23 | 2 \| 2 | 2 \| 2 |
| enraciné × 2 | 78 \| 74 | 77 \| 74 | 54 \| 51 | 54 \| 51 | J21 \| J21 | J21 \| J21 | 1.24 \| 1.11 | 1.25 \| 1.13 | 1.07 \| 1.07 | 1.06 \| 1.07 | 4 \| 1 | 4 \| 2 |
| enraciné × 4 | 88 \| 84 | 86 \| 84 | 72 \| 74 | 72 \| 74 | J28 \| J27 | J27 \| J28 | 1.55 \| 1.4 | 1.66 \| 1.51 | 2.36 \| 2.35 | 2.51 \| 2.45 | 1 \| 2 | 1 \| 1 |
| enraciné × 6 | 84 \| 87 | 85 \| 87 | 73 \| 72 | 76 \| 74 | J17 \| J17 | J17 \| J17 | 1.88 \| 1.79 | 2.11 \| 2.11 | 3.38 \| 3.35 | 3.53 \| 3.56 | 4 \| 2 | 4 \| 3 |
| mixte × 1 | 58 \| 57 | 58 \| 57 | 19 \| 14 | 19 \| 14 | J111 \| J114 | J111 \| J114 | 1.14 \| 1.21 | 1.14 \| 1.21 | 0.95 \| 1 | 0.95 \| 1 | 1 \| 0 | 1 \| 0 |
| mixte × 2 | 74 \| 76 | 74 \| 76 | 18 \| 21 | 18 \| 21 | J56 \| J58 | J56 \| J58 | 1.09 \| 1.04 | 1.09 \| 1.04 | 0.92 \| 0.89 | 0.92 \| 0.89 | 6 \| 1 | 6 \| 1 |
| mixte × 4 | 84 \| 86 | 84 \| 86 | 37 \| 37 | 36 \| 37 | J58 \| J65 | J58 \| J62 | 1.52 \| 1.63 | 1.51 \| 1.67 | 1.49 \| 1.36 | 1.53 \| 1.38 | 7 \| 3 | 8 \| 3 |
| mixte × 6 | 86 \| 86 | 86 \| 86 | 46 \| 46 | 47 \| 50 | J57 \| J54 | J57 \| J52 | 1.85 \| 1.78 | 1.97 \| 1.81 | 1.89 \| 2.05 | 2.02 \| 2.18 | 6 \| 4 | 6 \| 5 |

Moyennes des deux graines à J200 (vivants, %) : enraciné × 4 86,0 → 85,0 ; enraciné × 2 76,0 → 75,5 ; enraciné × 1 54,5 → 54,5 ;
enraciné × 6 85,5 → 86,0 ; nomade × 4 81,5 → 82,0 ; nomade × 6 81,0 → 79,5 ; mixte inchangé ; passif identique au tirage près
(le passif ne fait jamais de ronde, et sa chaleur reste sous le seuil). Tout bouge de deux points au plus : la chaleur pèse surtout après
deux cents jours, d'où les parties d'un an. Les brèches de l'enraciné × 6 montent (1,88 → 2,11) : c'est le groupe qui chauffe le plus
vite ; il vit autant.

Hauts contre Bas (graine 1) : assauts par mois 2,23 → 2,30 dans les Bas, 3,22 → 3,32 dans les Hauts ; Livides par mois 0,66 → 0,71 et
1,38 → 1,49. Les Hauts restent plus durs que les Bas, l'écart ne change pas.

### 6.3 Un an (`parties-longues.mjs`, 40 parties par scénario, séries g et h)

Deux scénarios nouveaux : `rallumer-4` (quatre enracinés qui nettoient les lieux gardés et cherchent la lumière) et `sans-rondes-4`
(les mêmes sans aucune ronde ni tournée). Contrôles : **aucune anomalie** dans les deux séries.

#### Série g

| Scénario | Vivants : avant | après | Médiane : avant | après | Autonomes : avant | après | Brèches : avant | après | Le paradis (après) |
|---|---|---|---|---|---|---|---|---|---|
| sedentaire-4 | 16/40 | 16/40 | 249 | 253 | 16 | 14 | 2.13 | 2.3 | rondes 81, chaleur max 3.1, agglutinés max 2.4, morsures 0, rallumées 0, convois 0.00 |
| sedentaire-2 | 9/40 | 8/40 | 183 | 183 | 16 | 16 | 2.6 | 2.63 | rondes 61, chaleur max 1.6, agglutinés max 0.8, morsures 0, rallumées 0, convois 0.00 |
| seul-enracine | 9/40 | 9/40 | 201 | 201 | 21 | 21 | 1.38 | 1.35 | rondes 1, chaleur max 0.9, agglutinés max 0.1, morsures 1, rallumées 0, convois 0.00 |
| seul-sedentaire | 9/40 | 8/40 | 118 | 118 | 18 | 18 | 2.8 | 2.73 | rondes 2, chaleur max 0.9, agglutinés max 0.2, morsures 1, rallumées 0, convois 0.00 |
| seul-nomade | 20/40 | 20/40 | 365 | 365 | 0 | 0 | 1.65 | 1.65 | rondes 0, chaleur max 1.0, agglutinés max 0.0, morsures 0, rallumées 0, convois 0.00 |
| compagnons | 27/40 | 26/40 | 365 | 365 | 26 | 28 | 2.25 | 2.45 | rondes 128, chaleur max 3.8, agglutinés max 3.8, morsures 3, rallumées 0, convois 0.00 |
| humains-4 | 26/40 | 26/40 | 365 | 365 | 28 | 30 | 3.15 | 2.9 | rondes 118, chaleur max 3.9, agglutinés max 2.9, morsures 4, rallumées 0, convois 0.00 |
| recrues | 20/40 | 19/40 | 365 | 349 | 19 | 19 | 2.03 | 2.13 | rondes 127, chaleur max 4.3, agglutinés max 2.8, morsures 0, rallumées 0, convois 0.00 |
| sans-recrues | 22/40 | 23/40 | 365 | 365 | 23 | 22 | 1.83 | 1.85 | rondes 96, chaleur max 1.7, agglutinés max 0.8, morsures 0, rallumées 0, convois 0.00 |
| nomade-4 | 19/40 | 19/40 | 303 | 303 | 3 | 3 | 2.73 | 2.73 | rondes 91, chaleur max 2.4, agglutinés max 0.9, morsures 0, rallumées 0, convois 0.00 |
| mixte-4 | 23/40 | 24/40 | 365 | 365 | 20 | 20 | 2.23 | 2.3 | rondes 126, chaleur max 2.9, agglutinés max 1.7, morsures 1, rallumées 0, convois 0.00 |
| rallumer-4 | — | 23/40 | — | 365 | — | 26 | — | 2.83 | rondes 140, chaleur max 4.0, agglutinés max 3.3, morsures 10, rallumées 14 (J95), convois 1.52 |
| sans-rondes-4 | — | 28/40 | — | 365 | — | 32 | — | 2.35 | rondes 0, chaleur max 7.8, agglutinés max 3.3, morsures 0, rallumées 0, convois 0.00 |

#### Série h

| Scénario | Vivants : avant | après | Médiane : avant | après | Autonomes : avant | après | Brèches : avant | après | Le paradis (après) |
|---|---|---|---|---|---|---|---|---|---|
| sedentaire-4 | 12/40 | 10/40 | 206 | 165 | 15 | 14 | 2.55 | 2.85 | rondes 69, chaleur max 2.7, agglutinés max 1.8, morsures 3, rallumées 0, convois 0.00 |
| sedentaire-2 | 14/40 | 14/40 | 171 | 171 | 14 | 14 | 2.3 | 2.28 | rondes 60, chaleur max 2.1, agglutinés max 1.1, morsures 1, rallumées 0, convois 0.00 |
| seul-enracine | 16/40 | 16/40 | 272 | 284 | 31 | 31 | 1.98 | 1.93 | rondes 2, chaleur max 1.2, agglutinés max 0.2, morsures 0, rallumées 0, convois 0.00 |
| seul-sedentaire | 12/40 | 12/40 | 112 | 112 | 16 | 16 | 2.33 | 2.33 | rondes 1, chaleur max 0.9, agglutinés max 0.1, morsures 0, rallumées 0, convois 0.00 |
| seul-nomade | 19/40 | 19/40 | 326 | 326 | 1 | 1 | 1.85 | 1.85 | rondes 0, chaleur max 0.8, agglutinés max 0.0, morsures 0, rallumées 0, convois 0.00 |
| compagnons | 25/40 | 23/40 | 365 | 365 | 28 | 28 | 2.1 | 2.08 | rondes 137, chaleur max 4.0, agglutinés max 3.4, morsures 2, rallumées 0, convois 0.00 |
| humains-4 | 24/40 | 19/40 | 365 | 360 | 24 | 23 | 1.78 | 1.93 | rondes 128, chaleur max 4.1, agglutinés max 3.4, morsures 2, rallumées 0, convois 0.00 |
| recrues | 20/40 | 18/40 | 365 | 339 | 21 | 21 | 2.33 | 2.55 | rondes 139, chaleur max 4.0, agglutinés max 2.8, morsures 1, rallumées 0, convois 0.00 |
| sans-recrues | 17/40 | 17/40 | 297 | 297 | 18 | 18 | 1.63 | 1.65 | rondes 101, chaleur max 1.8, agglutinés max 0.9, morsures 0, rallumées 0, convois 0.00 |
| nomade-4 | 16/40 | 14/40 | 317 | 310 | 1 | 1 | 1.88 | 1.83 | rondes 92, chaleur max 2.5, agglutinés max 1.1, morsures 0, rallumées 0, convois 0.00 |
| mixte-4 | 24/40 | 24/40 | 365 | 365 | 16 | 15 | 2.5 | 2.68 | rondes 119, chaleur max 3.6, agglutinés max 2.7, morsures 2, rallumées 0, convois 0.00 |
| rallumer-4 | — | 27/40 | — | 365 | — | 32 | — | 2.03 | rondes 140, chaleur max 4.3, agglutinés max 3.0, morsures 6, rallumées 17 (J87), convois 1.45 |
| sans-rondes-4 | — | 23/40 | — | 365 | — | 23 | — | 2.5 | rondes 0, chaleur max 6.5, agglutinés max 2.3, morsures 0, rallumées 0, convois 0.00 |

Lecture. Sur quarante parties, une différence de trois ou quatre vivants est dans le bruit (les deux séries se contredisent : humains-4
26 → 26 en g, 24 → 19 en h ; sans-rondes-4 28 en g, 23 en h). Les sondes de 192 parties (§ 6.1) tranchent : l'enraciné × 4 perd 7
parties sur 192 (−4 %), le nomade × 4 en perd 6 (−3 %). `rallumer-4` vit dans 23 et 27 parties sur 40 (humains-4 : 26 et 19), allume
14 et 17 régions (médiane J95 et J87), reçoit un convoi et demi par partie et prend plus de morsures (10 et 6 : les nettoyages se font
au combat). La partie qui rallume n'est ni plus facile ni plus dure que celle qui s'enterre : elle change de menaces.

### 6.4 Les deux limites

(Rééquilibrage d'après les douze lots, `equilibre-3d.md` : sur 240 parties d'un an, la chaleur coupée rend 1,5 sur 40 aux humains × 4
et 1,2 aux compagnons, le prix voulu ; les agglutinés coupés ne changent aucune partie. Aucun chiffre de ce lot n'a été retouché.)


1. **L'enracinement reste tenable** : enraciné × 4 contre nomade × 4, 134/99 avant et 127/93 après sur 192 parties d'un an ; à deux,
   98 contre 97 ; seul, 59 contre 61. Les deux voies gardent leur écart.
2. **Rallumer l'île ne rend pas la longue partie trop facile** : sur les 72 parties où la région s'est allumée, 61 vivants contre 63 pour
   le même groupe qui ne rallume pas ; sur un an, `rallumer-4` 23 et 27 sur 40, au niveau de `humains-4`. Sans contrepoint (aucune
   lumière visible), c'était 37 sur 37 : la pression des bandes est ce qui tient la limite.
