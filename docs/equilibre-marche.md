# Équilibre du marché (lot « marche », 2026-11-13)

Les chiffres du marché de Fénoir et leurs raisons. Ils sont tous dans `systems/lakour-survie/logique/marche.mjs`
(`REGLES_MARCHE`), éprouvés par `essais/survie-marche.test.mjs` (logique), `essais/survie-api-marche.test.mjs` (API sur la
doublure de Foundry) et `essais/contenu-marche.test.mjs` (contenu et traduction). Le complément du jeu 3D ne fixait aucun
chiffre : tout ce qui suit est une proposition, à trancher par Jordan (voir la fin).

## L'unité : la part

Troc seulement, pas de monnaie. Le **cours** dit ce que vaut un bien en **parts** ; **une part = un jour de nourriture pour une
personne** (l'unité que tout le monde comprend, et celle des stocks : `nourriture` 1 = un jour de repas, contrat §1.6). Le cours
aide à échanger ; rien n'oblige à le suivre (le MJ peut toujours faire passer un troc, `troquer({ accepter: true })`).

| Bien | Parts | Pourquoi |
|---|---|---|
| eau | 1 | un jour d'eau pour une personne, comme la nourriture |
| nourriture | 1 | l'unité |
| plantes (zerbaz) | 1 | une brassée se cueille en un quart ; deux font une tisane |
| graines | 2 | une planche semée rend 2 nourritures par jour après un mois : la graine vaut plus qu'un repas |
| matériaux | 2 | une brouette de tôle ou de bois : du travail de récupération |
| munitions | 3 | rares, ne se fabriquent qu'à l'atelier (munitions rechargées) |
| pièces | 3 | une caisse d'électronique ou de mécanique : rare, et tout le monde en veut |
| carburant | 4 | dix litres, qui ne reviennent jamais |
| médicaments | 5 | un traitement : le bien le plus précieux du jeu (contrat §1.3, docs/equilibre.md « Médicaments et zerbaz ») |
| énergie | — | des kWh dans des batteries ne passent pas de main en main : elle ne se troque pas |

**Le cours bouge** (multiplicateurs, arrondis à la demi-part, jamais sous ½ ni au-dessus de 20) :

| Moment | Ce qui monte | Pourquoi |
|---|---|---|
| panique | médicaments, munitions × 1,5 | tout le monde fait des réserves |
| effondrement | médicaments, munitions, carburant × 1,5 | les stations ferment, les pharmacies sont pillées |
| silence | médicaments, munitions × 1,5 ; carburant × 2 ; pièces × 1,5 | plus rien ne se produit |
| après | médicaments × 1,5 ; carburant × 2,5 ; pièces × 1,5 ; graines × 1,5 | le carburant ne revient jamais ; on cultive |
| saison des pluies | eau × 0,5 | les citernes débordent |
| saison sèche | eau × 1,5 | l'Ouest sec manque d'eau |
| jour de foire | la récolte de la foire × 0,5 | l'abondance |

Le conseil d'un marché peut ajouter une ou deux parts à un bien qui manque (`ajustements`, l'événement « Le cours s'affole » :
médicaments +2, eau +1).

**À noter** : deux plantes (2 parts) donnent un médicament (5 parts) par la recette des tisanes (un quart, test de survie
normal). C'est voulu : le savoir des zerbaz vaut quelque chose au marché. Si Jordan trouve l'écart trop grand, monter les
plantes à 1,5 suffit.

## Le troc

- Un troc est **juste** à une part ou à 10 % près (le plus grand des deux).
- Un marchand demande la valeur reçue **majorée** selon sa première confiance (ci-dessous). Le troc se fait si le groupe donne
  au moins ce qu'il demande.
- Un troc **honnête** (le groupe donne au moins la valeur reçue au cours) compte comme un échange pour l'usure des préjugés.

## La première confiance (préjugés, rumeurs, réputation)

Un préjugé est un trait d'un PNJ (`system.prejuges` de son acteur) : `{ cible, poids 1..3, dit }`. **Aucune origine ne joue dans
les règles** : le système ne connaît l'origine de personne, c'est le MJ qui dit quels préjugés du PNJ s'éveillent devant le
groupe (`cibles`). Le poids de la première confiance = la somme des préjugés éveillés encore vivants + le nombre de rumeurs
défavorables vivantes sur le groupe, **au plus 3** :

| Poids | Prix demandé | Crédit au carnet | Tests de parole avec lui |
|---|---|---|---|
| 0 | au cours | jusqu'au plafond | — |
| 1 | + 25 % | moitié du plafond | − 1 dé |
| 2 | + 50 % | refusé | − 1 dé |
| 3 | double | refusé | − 2 dés |

Pourquoi ces paliers : un préjugé léger (poids 1) doit se sentir sans bloquer (un quart de plus, c'est une boîte de cartouches
pour neuf rations au lieu de six) ; à 2, on ne prête plus à quelqu'un dont on se méfie vraiment ; le prix double reste une
exception (deux préjugés et une rumeur). Un dé de moins à la parole (au plus 2) suit la règle des malus d'état (contrat §1.1).

**Réputation d'une faction** (`reputations.mjs`, champ `marche` de chaque palier) : quand le marchand traite au nom d'une
faction, son palier s'ajoute : hostile, aucun échange ; méfiante, + 50 % et crédit refusé ; neutre, crédit à moitié ; amicale et
alliée, crédit plein. La majoration se cumule avec celle des préjugés ; pour le crédit, le plus méfiant des deux l'emporte.

## L'usure des préjugés

| Ce qui use | Combien |
|---|---|
| des échanges honnêtes avec quelqu'un que le préjugé vise | un cran par **3** échanges |
| une fête partagée (`feter({ invites })`) | un cran par fête |
| un démenti vu de ses yeux (`dementirPrejuge`, événements de marché) | un cran par démenti |

Un préjugé de poids 1 tombe donc en trois samedis de troc honnête, ou une fête, ou une scène de démenti ; un préjugé de poids 2
(Monsieur de Sainte-Croix sur les Cafres, Gérard Payet sur les derniers arrivés) demande une saison de marché, ou un démenti et
une fête. C'est le rythme voulu : le préjugé se sent au premier contact, puis cède aux faits.

## Le carnet de crédit

| Règle | Chiffre | Pourquoi |
|---|---|---|
| plafond par débiteur | **10 parts** | deux jours et demi de nourriture pour un groupe de quatre : un dépannage, pas un train de vie |
| parole tenue | **+5** par Nouvel An où tout est rendu, au plus **30** | la confiance se gagne en années, comme dans une vraie boutique |
| dette qui traîne | **30 jours**, ou passée le Nouvel An chinois | un mois sans rendre, le quartier en parle ; le crédit s'arrête |
| Ladi Lafé d'une dette | une rumeur vraie, une fois par dette | la dette se sait, sans harceler |
| rendre | n'importe quels biens, au cours du jour ; les plus anciennes d'abord ; jamais plus qu'on ne doit | pas de monnaie pour rendre la différence |
| Nouvel An chinois | dettes rendues : sorties du carnet, parole +1 ; dettes dues : marquées, elles traînent | « dettes et trocs soldés » (complément, famille 1) |
| dette effacée | au choix du tenancier (`effacerDette`, remises au Nouvel An) | l'événement « Les dettes effacées » |

## Le marché forain, la foire, la trêve, l'accueil

| Règle | Chiffre | Pourquoi |
|---|---|---|
| jour de marché | un jour fixe par semaine | « un jour fixe par semaine » (complément) |
| foire | **3 jours**, une fois par an | une fête d'avant ; assez pour venir de loin |
| trêve rompue | **− 3** de réputation auprès de chaque bastion du conseil ; rumeur vraie sur **toute l'île**, **un an** ; marché fermé jusqu'au rétablissement | une rupture fait passer une faction neutre à méfiante (− 3) ; deux, à hostile (− 6) |
| accueillir : bruit | **+ 3** le jour du marché | du monde, des voix, des charrettes ; le bruit retombe de 2 par quart |
| accueillir : signature | **+ 2** de visibilité tant qu'on l'accueille (`bilanAbri`, `conditions.signature`) | un abri à 2 ou 3 passe un palier : « on parle de vous », puis des éclaireurs ; c'est le prix de l'enracinement |
| accueillir : réputation | **+ 1** auprès de chaque bastion qui vient, tous les **4** jours de marché tenus | un mois de marché vaut un service rendu ; il faut cinq mois pour passer de neutre à amicale par le seul marché |

## Le Ladi Lafé

| Règle | Chiffre | Pourquoi |
|---|---|---|
| durée d'une rumeur | **90 jours** (une saison) ; **365** pour une trêve rompue | on oublie une dette, pas une trahison |
| rumeurs gardées | **60** au plus | l'état public reste léger |
| démenti | une preuve (marque, témoin, fait) ; une rumeur vraie ne se dément pas | le jeu dit vrai |
| mensonge démenti | une rumeur vraie court sur l'auteur, même portée | « un mensonge démenti se sait » (complément, famille 3) |
| colporter | le résultat désigne le colporteur (`colporteur`) | pour la jauge de sens moral d'un autre lot (vers le rouge) |

## Ce qui reste à trancher (Jordan)

- Les valeurs du cours, surtout l'écart plantes / médicaments (tisanes rentables) et le carburant × 2,5 dans l'après.
- La signature d'un marché accueilli (+ 2 visibilité) : assez pour sentir le prix, sans rendre l'accueil impossible ?
- Le rythme de l'usure (3 échanges par cran) : plus lent si les préjugés tombent trop vite à la table.
