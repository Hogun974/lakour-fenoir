# Équilibre du lot « cartes » (2026-11-17)

Lot 3 de l'inventaire du jeu 3D (`images-essais/INVENTAIRE-3D-POUR-FVTT.md`) : « Le jour qu'on croit, les cartes et les
calendriers », tiré de la famille 1 du complément (« Savoir quel jour et quelle heure il est », « Les cartes et les calendriers
se trouvent », « Les déclinaisons… », « Le journal est un livre », « Lire, copier et perdre un journal ») et des chiffres de
`docs/equilibre.md` du 3D (`fenoir_regles::compte`, `donnees/objets/base.json`, `recettes-et-constructions.md`). Ce fichier donne
les chiffres retenus et leurs raisons ; la règle est dans le contrat (`docs/survie-contrat.md` §20) et dans la logique
(`systems/lakour-survie/logique/reperes.mjs`, avec un crochet dans `etat.mjs`).

**Ce qui existait déjà et ne change pas** (lot fêtes du 13 novembre, §11) : la date de jeu, la lune, la clarté, la date **lue dans
la nature** quand le téléphone et la radio sont morts (« début février, lune gibbeuse, les longanis ») ; les renseignements datés
(§2.4) ; la carte de l'île (scène et tableau de bord). Le lot y ajoute ce que le groupe **croit**, sans doublon : le compte des
jours remplace la date exacte tant qu'il tient ; la date lue dans la nature reste ce qu'on a quand il est perdu ; une carte ajoute
des routes « d'après la carte » aux renseignements sans jamais remplacer ce qu'on a vu.

**Laissé de côté (propre au jeu vidéo)** : la carte du joueur ouverte à la touche Tab et le croquis automatique en mailles de 64 m,
le rayon du croquis, la natte d'inventaire, la couverture du journal qui s'use et ses marque-pages, les papiers collés, la page qui
tourne, la disparition du corps au bout de 72 h, la « commande de maître » (elle devient la fenêtre du MJ). Le journal du survivant
de la table est le journal « Histoire de… » du moteur : ce qu'il y faudrait est dans les besoins du MJ IA (fin de ce fichier).

## 1. Le compte des jours

**Le groupe tient un seul compte** (`etat.compte`, public : c'est ce qu'il croit), noté par **un survivant** désigné (`teneur`).
Le 3D tient un compte par survivant ; à la table, le groupe est l'unité du temps (une seule date au bandeau), et c'est celui qui
tient le compte qui le perd s'il tombe malade : une seule personne à regarder, un choix à faire (qui le tient ?).

| Chiffre | Valeur | Raison |
|---|---|---|
| Jour exact | le téléphone de la région du groupe, ou la radio de l'abri | Déjà la règle du §11 (`calendrier.exacte`). Le téléphone tombe entre le jour 5 et le jour 14 selon la région ; après, il faut tenir le compte. |
| Noter le jour | chaque jour, de lui-même, si celui qui tient le compte est là et en état | Le 3D fait du geste un clic quotidien ; à la table, le demander chaque jour serait une corvée. Le MJ dit les exceptions (« oublier », « noter » à la main). |
| Empêché | mourant (4 blessures), épuisé (fatigue 5), le Gris au stade 5 (la confusion), mort, séparé du groupe | Les causes du 3D (« maladie, fuite, inconscience ») traduites en états de FVTT. |
| Au fond du trou | moral 0 : il oublie un jour sur trois | Proposition du lot (le 3D dit « oubli » sans chiffre). D'abord essayé à « moral 1 ou moins » : dans un essai de quarante jours sur un chalutier, le compte se perdait trop souvent ; à 0, c'est le survivant qui craque. Mesuré (2 000 tirages) : au moral 0 sans relâche, le compte se perd en 40 jours en moyenne avec un calendrier de l'année, en 13 jours sans. Le remède est dans le jeu : confier le compte à un autre. |
| Doute par encoches | 10 jours (`ENCOCHES_AVANT_LE_DOUTE` du 3D) | Repris tel quel. |
| Doute sur une planche des jours | 30 jours | La recette du 3D dit « une encoche plus longue à chaque lune : pour ne pas perdre le compte », sans chiffre. Une lunaison (29,5 jours) : au-delà, on recompte les lunes, on doute. |
| Calendrier de l'année coché | jamais de doute | Repris du 3D. |
| Un jour non noté | 30 % sauté, 10 % compté deux fois, 60 % juste | Repris du 3D (`CHANCE_D_OUBLIER_UN_JOUR`, `_DE_COMPTER_DEUX_FOIS`) : le compte dérive plutôt en retard. Mesuré : deux jours oubliés font en moyenne −0,4 jour, 0,7 jour d'écart absolu. |
| Perdu | 3 jours de suite sans noter avec un calendrier de l'année, 2 sans | Repris du 3D (`JOURS_SANS_NOTER_AVANT_DE_PERDRE`). |
| Un jour reçu | « à peu près », marge 1, avec son auteur | Repris du 3D (`recevoir`). |
| Un faux jour donné exprès | une rumeur fausse et malveillante au Ladi Lafé, l'auteur au secret ; démentie, l'acte « mentir » | Le 3D : « mentir sur le jour pèse sur le sens moral et passe par Ladi Lafé ». Dans FVTT, « mentir » est déjà l'acte d'**un mensonge démenti** (§14, §15) : on suit cette règle pour ne pas compter deux fois le même mensonge. **À trancher** : voir § 6. |
| La fête des autres | rend le jour (« à peu près ») | Ajout de la table : ceux qui reçoivent savent quel jour ils fêtent (« plusieurs fêtes suivent la lune »). |
| Le journal d'un mort | le jour qu'il croyait + les jours depuis sa mort, marge 1 + 1 tous les 3 jours | La marge dit l'incertitude sur le temps passé depuis (l'état du corps). Proposition du lot. |

Ce que voient les joueurs (bandeau) : la date si on la sait, « vers le … » si le compte est à peu près, la date lue dans la nature
s'il est perdu ; le numéro du jour suit (« Jour ≈ 41 », « Jour ? »). Le MJ voit toujours le vrai jour et l'écart (fenêtre du MJ,
`reperes().compte.ecart`).

**Tirages** : un flux à part, « compte|jour ». Une partie jouée avec ou sans le lot a le même monde, les mêmes rencontres, le même
journal hors du compte (essai « rien d'autre ne bouge »).

## 2. La lune sur un calendrier et l'heure du ciel

| Chiffre | Valeur | Raison |
|---|---|---|
| La lune | dans le mois cru, le jour du calendrier où la lune a cette tête ; marge 2, erreur tirée de −1 à +1 | Repris du 3D (`MARGE_DE_LA_LUNE`, `lire_la_lune`). Mesuré sur une année : 0,7 jour d'écart en moyenne. |
| Avec les marées | marge 1, sans erreur | Le calendrier des marées donne la phase heure par heure : on le distingue ainsi des autres (proposition du lot). |
| Un calendrier d'une autre année | ses lunes sont fausses : le jour trouvé l'est aussi | Le 3D refuse la lecture (`AutreAnnee`) ; l'inventaire dit « lunes fausses ». À la table, l'erreur silencieuse est plus riche : le groupe s'y fie, le MJ sait. Mesuré : 13,7 jours d'écart en moyenne. |
| Compte perdu | le mois se lit dans la nature | Le §11 dit déjà « début février » quand la date est perdue. |
| Quand | la nuit, ciel dégagé, la lune levée (ou nouvelle : son absence se lit) | Le ciel couvert et la lune levée du §11. |
| L'heure | ±0,5 h jour clair ; ±1,5 h jour couvert ou nuit claire ; ±3 h nuit couverte ; perdue sous terre | Repris du 3D. « Sous terre » : un abri dans un tunnel de lave (type de site `tunnel-de-lave`). |
| Lever, coucher | 5 h 36 – 18 h 48 (saison des pluies), 6 h 42 – 17 h 48 (saison sèche) | Repris du 3D. |
| Exacte | téléphone, radio, montre à aiguilles ; le cadran solaire à l'abri, de jour, au soleil | La montre et le cadran viennent du 3D (« une montre ou une horloge en état », la recette du cadran). |

L'heure ne joue sur aucun dé : FVTT compte en quarts de six heures. Elle dit seulement ce qu'on voit (le bandeau ne montre aux joueurs
que le moment du jour quand ils ne la savent pas), et sert au récit.

## 3. Les cartes et les calendriers

Les objets du 3D (`donnees/objets/base.json` : trois cartes, deux calendriers) et la liste du complément (six cartes, quatre
calendriers, leurs raretés), devenus des **équipements** de catégorie `repere` portés par les survivants. Ce qu'ils disent se lit
sur ceux du groupe : les perdre (un troc, un mort) fait perdre ce qu'ils disaient.

| Objet | Rareté | Ce qu'il fait |
|---|---|---|
| Carte routière de l'île | rare | Les routes de toute l'île, imprimées il y a 0 à 2 ans. |
| Carte de randonnée | peu commune | Un cirque ou le volcan (celui où on la trouve, sinon l'un des quatre) : routes, pistes et sentiers. |
| Plan de ville | commune | La région où on le trouve, ses routes de sortie. |
| Carte ancienne de l'île | commune, trompeuse | Routes et sentiers d'il y a 30 à 45 ans : Saint-Paul – Saint-Leu et Saint-Denis – route du Littoral « difficiles » (ni route des Tamarins ni nouvelle route du Littoral), des notes sur la route des Laves et les sentiers du volcan. |
| Moitié de carte routière | commune | L'ouest ou l'est de l'île (d'après les repères de la scène). |
| Carte annotée par un mort | rare | Toute l'île, et une note parmi six (une cache, un danger, un mensonge ; le registre dit au MJ laquelle est vraie). |
| Calendrier des postes | commun | L'année suivante en novembre-décembre (le facteur le vend en fin d'année), les lunes. |
| Calendrier de l'année | peu commun | L'année courante, sans les lunes. |
| Calendrier des marées et des lunes | rare | L'année courante, les lunes à un jour près. |
| Vieux calendrier | commun | Une année passée (1 à 4 ans), les lunes fausses. |
| Calendrier des fêtes de l'île | rare | L'année courante, les lunes, les fêtes des 15 jours qui viennent (depuis le jour cru). |
| Montre à aiguilles | peu commune | L'heure exacte. |

**Une carte dit les routes imprimées** : « ouverte » par défaut, sauf ce que la carte dit d'autre (`routesImprimees`), rien des
Livides, rien de l'état d'aujourd'hui. Elle ne remplace jamais une route vue (tableau de bord : « d'après la carte », pointillé fin
sur la carte de l'île). Plusieurs cartes se complètent ; la plus récente l'emporte. La table n'a pas besoin du croquis du 3D : la
carte de l'île du tableau de bord trace déjà ce que le groupe a vu.

**Où on les trouve** (un seul tirage par fouille d'un lieu, flux « repere|quart|lieu » ; la chance est la somme de celles des
objets) : case créole 23 %, commerce et station-service 26 %, école 22 %, maison 22 %, immeuble 18 %, gîte 17 %, port 16 %, autre
lieu 16 %, ferme et caserne 14 %, îlet 13 %, phare 10 %, hôpital 7 %, lieu de culte 5 %, usine 4 %, tunnel de lave 0 ; une fouille
sans lieu précis 10,9 %. Les lieux du 3D (« station-service, école, administration, hôtel, caserne ») pour les cartes ; les
calendriers dans les cuisines des cases, comme dans l'île. Moins d'une fouille sur trois (`CHANCE_REPERE_MAX` = 30 %) : on en
trouve quelques-uns par mois de fouilles, assez pour que la question se pose, pas assez pour encombrer.

## 4. Les fabrications

Les quatre recettes du 3D (« Tenir le compte des jours »), arrondies en ressources et en quarts de FVTT, sans savoir ni atelier
(« depuis le sac » dans le 3D) :

| Recette | Coût | Travail | Test | Produit |
|---|---|---|---|---|
| Planche des jours | 1 matériau (une planche) | 1 | bricolage, facile | le doute après 30 jours d'encoches |
| Cadran solaire | 1 matériau (galets, gaulette) | 2 | survie, difficile (« geste difficile ») | l'heure juste à l'abri, de jour |
| Encre de suie | 1 eau (le charbon est dans les cendres) | 1 | survie, facile | 2 fioles (une copie chacune) |
| Cahier cousu | 1 matériau (papier, fil) | 1 | bricolage | recopier une carte (il n'est pas usé) |

**Recopier une carte** : un cahier cousu et une fiole d'encre de suie (usée), un quart. La copie garde les routes et les notes, pas
le relief ; elle reste au groupe si l'original part.

## 5. Le journal d'un mort

Un membre qui meurt garde sur lui son journal : le jour qu'il croyait, la certitude, les plans du groupe. Il se lit **là où il est
tombé**, tant qu'il n'a pas reçu le repos (le journal est enterré avec lui) ; celui d'un Livide qu'on n'a pas retrouvé marche avec
lui. Les 72 heures du 3D (la disparition du corps) n'ont pas d'équivalent à la table : un corps de FVTT reste jusqu'au repos.
Lire prend un quart. Le jour du journal n'est pris que si le groupe ne le sait pas. Le journal d'un **inconnu** (que le MJ décrit,
table « Récit — le journal d'un mort » du lot 12) donne aussi des renseignements, sous la source « journal », s'ils sont plus
récents que ceux du groupe ; ils ne disent que l'infestation, l'eau, le courant et une note (le pillage, les routes et les
factions ne se lisent que sur place, comme pour la radio).

## 6. Ce que Jordan doit trancher

1. **Le mensonge sur le jour** : l'inventaire dit « porte l'acte mentir » ; FVTT ne fait porter « mentir » qu'au mensonge démenti.
   Le lot suit FVTT (le faux jour court au Ladi Lafé ; démenti, son auteur porte « mentir »). Faut-il aussi un acte au moment même
   (sans témoin : le sens moral seulement) ?
2. **L'oubli au moral 0** (un jour sur trois) : garder, ou ne laisser oublier que sur décision du MJ ?
3. **Un seul compte pour le groupe** (le 3D en a un par survivant) : suffisant pour la table ?
4. **La planche des jours** à 30 jours de doute : le 3D ne donne pas de chiffre.
5. **Le calendrier des postes** de l'année suivante dès novembre : il ne sert donc qu'à partir du 1er janvier pour une partie
   commencée en décembre. C'est la vérité de l'île ; est-ce trop taquin ?
6. **La lecture de la lune sur un calendrier d'une autre année** : silencieusement fausse (lot), ou refusée (3D) ?

## 7. Besoins du MJ IA (moteur `lakour-mj-ia`, non touché)

- **Contexte** : la date que le groupe croit (`quand().dateDuGroupe`, `compte.certitude`), l'écart au vrai jour en secret
  (`reperes().compte.ecart`), qui tient le compte, les cartes et calendriers du groupe (`reperes().objets`), ce que disent ses
  cartes (`reperes().cartes`), les journaux lisibles.
- **Outils** : `survie_compte` (teneur, noter, oublier, régler), `survie_date` (un jour donné ou reçu ; « mensonge » quand un
  survivant ment), `survie_lune` (lire la lune), `survie_repere` (donner une carte, un calendrier ; recopier une carte),
  `survie_journal` (lire le journal d'un mort ou d'un inconnu).
- **Consignes** : ne jamais dire aux joueurs le vrai jour ni l'écart quand le compte n'est pas sûr ; dire la date telle que le
  groupe la croit (« vers le … ») ; un PNJ qui donne un jour peut se tromper ou mentir (table « Le jour qu'on vous donne ») ; une
  carte ne dit rien des Livides ; le journal d'un mort se raconte sobrement (rien du corps, les jours cochés qui s'arrêtent).
- **Journal « Histoire de… »** : y écrire, à la page des jours, les jours notés par celui qui tient le compte (et ceux reçus,
  avec leur auteur) ; à la mort, la dernière page reste celle du dernier jour noté.
