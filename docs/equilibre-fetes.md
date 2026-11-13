# Équilibre du lot « fetes » (2026-11-13)

Le lot apporte à Fénoir pour Foundry deux familles du remue-méninges de Fénoir 3D : la famille 1, **le temps de l'île** (la lune,
la nuit, le paysage, la chaleur, les fêtes du métissage avec leur gain et leur coût, les liens tissés chez les autres) et une
part de la famille 6, **la mort et ce qui reste** (la relève, les jeunes de 16 à 18 ans, les morts, le deuil, le repos, l'autel).
Ce fichier donne chaque chiffre et sa raison. Ils sont proposés à Jordan : tous se changent en un seul endroit (le nom de la
constante est donné). Rien de magique : tout agit par le moral, le bruit, la lumière, les stocks, l'hygiène, le sang-froid et les
liens.

## 1. La lune et la nuit (`systems/lakour-survie/logique/lune.mjs`)

| Quoi | Chiffre | Pourquoi |
|---|---|---|
| Phase de la lune | élongation Lune – Soleil, formules abrégées de Meeus (chap. 25, 47), vers minuit à La Réunion (20 h UTC) | à quelques heures près : assez pour le jeu, sans table, pour toute année. Vérifié sur les nouvelles et pleines lunes de 2026. |
| Lever de la lune | 6 h + âge × 24 / 29,53 ; levée 12 h | un premier croissant est couché au cœur de la nuit, une lune décroissante ne se lève que tard : les joueurs apprennent à choisir l'heure. |
| Mesure de la clarté | soir à 21 h, nuit à 3 h | le milieu de chaque quart nocturne. Le matin et l'après-midi n'ont pas de clarté. |
| Niveaux de clarté (`clarte`) | part éclairée < 8 % : 0 noire ; < 40 % : 1 sombre ; < 80 % : 2 claire ; sinon 3 lumineuse | quatre niveaux suffisent à la table ; « noire » couvre les deux ou trois nuits autour de la nouvelle lune et toute nuit où la lune est couchée ou cachée. |
| Ciel couvert (`CIEL`) | littoral 30 % (pluies) / 12 % (sèche) ; Hauts et cirques 55 / 35 % ; volcan 50 / 30 % ; forêt 60 / 40 % ; pluie forte, crue, cyclone : 100 % | la brume monte des ravines le soir dans les Hauts ; un tirage par quart (soir, nuit) : une nuit claire peut devenir noire en plein trajet. Flux du hasard propre au jour et à la région (`deriverHasard(graine, "ciel", jour, region)`) : le même ciel quelle que soit la façon d'avancer. |
| Nuit noire, dehors (`NUIT`) | −1 dé à tout test, sauf discrétion +1 ; rencontres × 0,85 ; dangers (chutes, ravines, crues) × 2 dans le tirage ; fouille × 1,25 (fraction et plafond) | « plus dur, mais plus payant » (le complément) : on voit mal, on se cache bien ; personne d'autre ne sort, on trouve ce que les autres n'ont pas pris. 1,25 reste sous l'écart entre prudences « normal » et « rapide » (× 1,67) : une sortie de nuit noire ne remplace pas une fouille rapide, elle la complète. |
| Pleine lumière, dehors | vigilance +1, discrétion −1 ; rencontres × 1,2 | « on y voit mieux, les Livides aussi ». |
| Nuit sombre ou claire | rien | les cas les plus fréquents ne changent pas le jeu d'avant. |
| « Dehors » | par défaut : le groupe n'est pas à son abri ; le MJ peut le dire (`test({ dehors })`) | un test à l'abri la nuit (garde, soins) n'est pas une expédition. |

La logique ne change que si la clarté lui est donnée (`clarte` absente ou nulle : exactement le tirage d'avant) : les simulateurs
d'équilibre (`essais/outils/simuler-parties.mjs`, parties longues) restent comparables ; seule l'API la donne, la nuit.

## 2. La chaleur et le paysage

| Quoi | Chiffre | Pourquoi |
|---|---|---|
| Chaleur de l'été austral (`CHALEUR`) | décembre à mars, dans les Bas (< 400 m), l'après-midi, dehors : −1 dé en endurance | la chaleur pèse sur l'effort, pas sur tout ; s'ajoute à ce qui existait (1,5 eau par jour dans les Bas en saison chaude, coup de chaleur des maladies). |
| Signes du paysage (`SIGNES`) | flamboyants nov.–janv. ; letchis déc.–janv. ; mangues nov.–janv. ; longanis janv.–mars ; chaleur des Bas déc.–mars ; cyclones janv.–mars ; goyaviers avr.–juin (Hauts) ; brume froide juin–août (Hauts) ; coupe de la canne juil.–nov. ; jacarandas oct.–nov. | ce qu'on voit, au bandeau ; ils servent à lire la date. |
| Date lue | sans téléphone dans la région du groupe ni poste radio à l'abri (s'il y est) : « début (1–10), mi- (11–20) ou fin » du mois, la phase de la lune, deux signes | le joueur ne voit plus la date exacte au bandeau (le MJ la voit) ; les fêtes lunaires se retrouvent quand même. |

## 3. Les fêtes : gain et coût (`modules/lakour-fenoir/scripts/fetes.js`, `EFFETS` ; logique `logique/fetes.mjs`)

Une fois par fête et par année (comme avant). Personnes : membres vivants et PNJ légers du groupe. Les souvenirs durent depuis le
jour de la fête (compris).

| Fête | Gain | Coût | Pourquoi |
|---|---|---|---|
| 20 décembre, Fèt Kaf (`liberte`) | +1 moral ; souvenir +1 (plafond) 3 jours | 1 ration/pers. ; bruit +4 | le maloya soude ; le tambour s'entend de très loin (une rafale de tir vaut +4). |
| Noël | +1 moral ; souvenir +1 7 jours ; les recrues présentes (ou celles nommées) deviennent compagnons (ne partent plus à moral 0) | 2 rations/pers. ; bruit +1 | « un surplus de nourriture » ; le cadeau attache. |
| Saint-Sylvestre, Pâques, 14 juillet | +1 moral | 1 ration/pers. ; bruit +2 / +1 / +2 | l'effet d'avant le lot, gardé. |
| Toussaint (`halloween`) | repos à tous les morts retrouvés (lève leur deuil) ; +1 moral | il faut les avoir retrouvés ; bougies : lueur +1 un jour | la Toussaint des cimetières réunionnais ; le coût est structurel (retrouver ses morts). |
| Fête de la musique | en musique : +1 moral, bruit +3 ; en silence : fatigue −1 | 1 ration chaude/pers. | la nuit la plus longue, le froid des Hauts : un vrai choix. |
| Dipavali | +2 moral | 1 ration/pers. ; lueur +3 un jour | « un très grand moral », « chaque flamme attire ». |
| Nouvel An chinois | +1 moral ; hygiène 30 jours (risque et contagion des maladies × 0,5) ; un lien avec l'abri qui reçoit les dons | 2 quarts ; 1 ration/pers. ; bruit +3 | le grand ménage prend du temps ; les pétards. |
| Cavadee | un vœu pour ceux qui le font : souvenir +1 tant qu'il tient (le MJ dit tenu : +1 moral, ou rompu : −1) | fatigue +1 à ceux qui font le vœu ; lueur +2 un jour (marche à découvert) | le carême et la procession. |
| Fête des letchis | +1 moral ; nourriture +3 | 1 quart dehors ; bruit +1 | la cueillette oblige à sortir. |
| Ramadan | souvenir +1 pendant 30 jours | lueur +1 pendant 30 jours (cuisine et lumière de nuit) | « discipline et cohésion du groupe pendant un mois ». |
| Aïd el-Kebir | +1 moral ; renom +1 ; deux liens avec l'abri qui reçoit la part ; des réfugiés viendront (alerte au groupe, au MJ d'en faire une recrue) | 6 nourriture (un cabri) | le cabri de l'élevage ; la réputation court. |
| Nouvel An tamoul | +1 moral ; graines +2, +2 de plus et un lien en échangeant avec un abri voisin | rien | « fin des cyclones, signal des semis, échange de graines » ; le tableau du complément ne lui donne pas de coût. |
| Marche sur le feu | sang-froid 14 jours : +1 dé de défense contre une horde ou des Livides (assaut) | 4 matériaux (bois) ; lueur +3 un jour | « du sang-froid face aux hordes », « beaucoup de bois, une lueur visible de loin ». |

Bornes : le soutien des souvenirs se cumule jusqu'à +2 au plafond du moral (`SOUTIEN_MAX`) ; la lueur jusqu'à +4 de visibilité
(`LUEUR_MAX`) ; 40 souvenirs gardés au plus. Un souvenir relève le **plafond** où le moral remonte chaque jour (3 + confort de
l'abri), il ne donne pas de moral d'un coup : il faut manger et se reposer pour en profiter.

**Calendrier.** Quatre fêtes s'ajoutent au socle du moteur, « sur demande » (seul Fénoir les voit) : ramadan (hégirien tabulaire,
du 1er ramadan au lendemain de l'Aïd el-Fitr), Aïd el-Kebir (veille – surlendemain du 10 dhou al-hijja), Nouvel An tamoul
(13 – 15 avril), marche sur le feu (2 – 12 janvier, cœur le premier dimanche : chaque temple a sa date, les principales au
début de janvier). Elles n'ont pas d'illustration (à peindre, voir le rapport).

## 4. Les liens et la fête des autres (`logique/fetes.mjs`)

| Quoi | Chiffre | Pourquoi |
|---|---|---|
| Aller à la fête d'une autre communauté (`PARTICIPATION`) | 2 quarts ; +1 moral à ceux qui y vont ; +1 lien avec la communauté et avec la faction qui reçoivent ; une fois par fête, par an et par hôte | une soirée dehors ; on revient content ; la répétition compte, pas le nombre de participants. |
| Liens (`LIENS_MAX`) | 0 à 5 par faction, par communauté ; renom de l'abri 0 à 5 | lisible d'un coup d'œil, comme les autres jauges. |
| Recruter chez une faction liée | 2 liens ou plus : l'attitude gagne un cran (méfiante → neutre…) | le premier fruit tangible des liens ; le reste (troc, refuge) passe par les réputations existantes (horloges `rep-<faction>`), que le MJ monte. |
| Préjugés des PNJ | `etat.participations` et `etat.liens.communautes` ; crochet `lakourSurvie.participation` | le point d'accroche pour le lot qui crée les préjugés : chaque participation chez une communauté peut les user. |

## 5. La mort, le deuil, l'autel, le repos (`logique/releve.mjs`, `logique/souvenirs.mjs`)

| Quoi | Chiffre | Pourquoi |
|---|---|---|
| Choc d'une mort (`DEUIL.choc`) | −1 moral à chaque vivant du groupe, par mort | une perte se sent tout de suite ; l'affliction « choc après une perte » du contenu reste au MJ pour les cas graves. |
| Deuil (`DEUIL.plafond`) | plafond du moral −1 pour tous tant qu'un mort n'a pas reçu le repos ; au-dessus, le moral redescend d'un par jour | « lever le deuil » doit valoir quelque chose sans écraser le groupe. Seules les morts survenues pendant le temps qui passe s'inscrivent d'elles-mêmes (une partie d'avant le lot ne prend pas de deuil rétroactif) ; le MJ inscrit les autres. |
| Mort retrouvé | oui s'il meurt au groupe ; non s'il se relève Livide (il faut retrouver son corps, ou donner le repos au Livide) | le complément : « il faut retrouver ses morts ». |
| Donner le repos (`REGLES_REPOS`) | 1 quart, un mort retrouvé ; à la Toussaint, tous les morts retrouvés d'un coup | une cérémonie courte ; la Toussaint la rend plus forte. |
| Autel des morts (installation `autel-des-morts`) | 1 matériau, 1 quart de travail ; `effets.autel` | une étagère, une nappe, des noms : presque rien à bâtir, c'est un geste. |
| Honorer l'autel (`REGLES_AUTEL`) | 1 quart ; une assiette (1 nourriture) ; +1 moral à chaque vivant ; souvenir +1 pendant 7 jours ; une fois par semaine au plus | « l'honorer soude le groupe » ; hebdomadaire pour ne pas devenir une machine à moral. |

## 6. La relève et les jeunes (`logique/releve.mjs`)

| Quoi | Chiffre | Pourquoi |
|---|---|---|
| Âge minimum de la relève (`REGLES_RELEVE.ageMin`) | 16 ans | fixé par le coach dans le complément, à la demande de Jordan. |
| Candidats | membres vivants du groupe qui ne sont pas déjà le survivant d'un joueur (compagnon, recrue, PNJ), et les PNJ légers du groupe (`groupe.pnj` : leur fiche est tirée d'après leur nom et leur passé, âge 16 au moins) | « déjà sur place, avec ses propres compétences et son caractère ». |
| Ce que coûte la relève | la tâche du repris revient à « repos » (le joueur choisit), le journal le dit ; un PNJ léger quitte la liste des PNJ (il ne travaille plus pour le groupe) ; un compagnon IA cesse d'en être un | « le PNJ repris cesse son travail pour le groupe ». |
| Jeune (moins de 18 ans) | porte 2/3 d'un adulte (`charge`) ; travaille aux 3/4 (`travail` : chantiers, réparations, installations à bras) ; vote à moitié (`poidsVote`) ; pas chef (`peutEtreChef`) | « porte moins, travaille moins vite, pas chef ». Les votes et les chefs viendront d'un autre lot : les fonctions sont prêtes. |
| L'âge avance | +1 an tous les 365 jours de jeu depuis `ageJour` (le jour où l'âge a été noté ; 0 pour les fiches d'avant) | un jeune de 16 ans devient adulte au bout de deux ans de partie. |

Ces règles s'appliquent à tout survivant de 16 ou 17 ans (le générateur en tire quelques-uns, 16 à 19 ans une fois sur dix) :
leur chantier avance un peu moins vite qu'avant le lot.
