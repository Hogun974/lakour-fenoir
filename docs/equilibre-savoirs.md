# Équilibre du lot « savoirs » (2026-11-13)

Lot tiré du remue-méninges de Fénoir 3D (familles 9 « Les deux savoirs » et 10 « L'île en mouvement », plus l'eau chaude et le
gaz de la famille 5). Ce fichier donne les chiffres retenus et leurs raisons ; la règle est dans le contrat
(`docs/survie-contrat.md` §13) et dans la logique (`systems/lakour-survie/logique/savoirs.mjs`, `abri.mjs`, `actions.mjs`,
`monde.mjs`, `etat.mjs`). Rien n'est retiré ni renommé : une partie en cours continue (stocks et mondes complétés, champs
nouveaux à valeur par défaut).

## 1. Les deux savoirs

**Forme retenue : des installations sœurs.** La version moderne reste l'installation existante, inchangée ; la version
lontan est une installation à part qui porte `role` = la clé de sa sœur moderne (ou un rôle commun : « eau-chaude »), `rang`
et `arbre: "lontan"`. Écarté :

- un **niveau** de plus (le niveau 1 lontan, le 2 moderne…) : il aurait renuméroté les niveaux des abris en cours, des sites
  (`installationsDepart`) et des voies d'autonomie, et interdit d'avoir les deux ;
- une **variante** portée par l'instance (`instance.variante`) : chaque appel (construire, réparer, la fiche, le MJ IA par la
  clé) aurait dû la connaître ; une clé à part passe partout sans rien changer.

**Deux sœurs ne s'additionnent pas** : chaque jour, la première par rang qui peut marcher est en service ; les autres
attendent en secours (ni production, ni consommation, ni défense, ni visibilité ; leur stockage et leur capacité restent).
Une sœur hors service, éteinte ou arrêtée faute de carburant, de gaz, d'énergie, d'eau ou de nourriture laisse la place à la
suivante. Raison : sans cela, bâtir les deux doublerait la citerne, la palissade ou le potager pour quelques bambous ; avec,
la lontan est une assurance (le feu de bois quand le gaz manque, le jardin paillé quand l'arrosage manque, les gouttières de
bambou quand le cyclone casse la citerne) et un départ gratuit.

**Matières de l'île** (coût `ile`) : prises sur le bois des alentours de l'abri (`nature.bois`, plafond 10 × rendement,
régénération 0,2 × rendement par jour), qui repousse ; une lontan se répare avec elles (1 par point, au lieu d'1 matériau).
Une région de ville (Saint-Denis : bois 1 par jour, plafond 30) n'en offre que pour deux ou trois chantiers à la fois ;
une forêt (Plaine des Palmistes, bois 5) beaucoup plus. Les plans (−25 %) s'appliquent aussi.

| Lontan | Sœur moderne | Niveaux : coût | Effets (moderne entre parenthèses) | Pourquoi |
|---|---|---|---|---|
| Gouttières de bambou et jarres | Citerne de pluie | ile 3, travail 8 / ile 5, 12, bambou-vacoa | eau 0,5 / 1,5 × pluie (1 / 2 / 3), stockage 20 / 40 (30 / 60 / 120) | les joints fuient ; pas de niveau 3 (pas de citerne maçonnée sans ciment) |
| Conduite de bambou | Captage de source | ile 4, 12 / ile 8, 18, bambou-vacoa | eau 3 / 6 (4 / 8) | l'exemple du complément : « qui fuit un peu » |
| Puits à balancier | Pompe manuelle | ile 3, 8 / ile 5, 10 | eau 3 / 6 (4 / 8) | plus d'allers-retours, pas une pièce |
| Jardin créole | Potager | ile 2, graines 1, 8 / ile 3, graines 2, 12, jardin-creole | nourriture 1,5 / 3 + zerbaz 0,2 / 0,3, délai 20, **ne boit pas**, invisible, sol 1 sans soleil (2 / 4 / 6, délai 30, boit 1 / 2, visibilité 1 / 2) | paillé, à l'ombre des bananiers, de boutures |
| Garde-manger lontan | Réserve étanche | ile 3, 8 | conservation, nourriture +50 (+100 / +250) | plus petit |
| Palissade de bambou | Palissade | ile 6, 12 / ile 10, 16, bambou-vacoa | défense 1 / 2, visibilité 1 (2 / 3, visibilité 2) | elle plie, elle arrête moins |
| Mur de pierres sèches | Mur d'enceinte | travail 32 / 48, pierre-seche | défense 2 / 3, visibilité 0 (3 / 4 / 5, visibilité 1) | rien que de la peine ; un vieux mur de plus |
| Guet dans un grand arbre | Tour de guet | ile 3, 6, sol 1 | vigilance +1, visibilité 0 (défense 1 / 2, visibilité 2) | caché dans le feuillage |
| Ruches en tronc | Ruches | ile 1, 4 | nourriture 0,4 (1) | on récolte moins |
| Cuisine commune (existante) | Gazinière | — | moral 1, visibilité 1 (gazinière : moral 1, visibilité 0, 1 gaz par jour) | la cuisine au feu de bois existait : elle devient la sœur lontan |
| Eau chauffée au feu de bois | Chauffe-eau solaire, puis à gaz | ile 2, 3 | moral 1, soins +1, visibilité 1 (solaire : visibilité 1, plomberie ; gaz : 1 gaz par jour) | la fumée se voit |

Pas de version lontan : panneaux solaires, batteries, pico-hydro, éolienne, groupe électrogène, serre (plastique), radio,
antenne, porte blindée, atelier, infirmerie. Déjà lontan sans sœur : séchoir et fumoir, compost, verger, basse-cour, enclos,
barricades, fossé et pièges, galerie étayée.

**Deux arbres.** Moderne (10) : électricité solaire, maraîchage tropical, plomberie et filtration, maçonnerie, mécanique,
premiers secours avancés, étaiement et galeries, radio, hydraulique rurale, moteurs de fortune (nouveau). Lontan (7) : pêche,
élevage, conserverie, zerbaz, bambou-vacoa-vétiver (nouveau), pierre sèche (nouveau), jardin créole (nouveau).
**Autonomie complète** : autonome (7 jours, inchangé) et au moins **2** savoirs de chaque arbre dans le groupe (un indicateur
pour le MJ et les joueurs : la règle de l'autonomie ne change pas).

## 2. Gramoune, livres, cahier

| Chiffre | Valeur | Raison |
|---|---|---|
| Âge d'une gramoune | 60 ans et plus, avec un savoir lontan | le générateur tire des recrues jusqu'à 75 ans ; une gramoune tirée au hasard l'est aussi |
| Veillées pour apprendre | livre 14, cahier 7, quelqu'un qui sait 7, gramoune qui a confiance (≥ 3) 4 | « plus vite qu'un livre » : trois fois et demie ; sans confiance, comme n'importe qui |
| Lumière d'une lecture | 1 énergie si l'abri en a, sinon visibilité +1 ce jour-là | « apprendre le soir se voit de loin » |
| Confiance | 0 à 5 ; réussite +1, marge ≥ 2 : +2 ; test forcé raté −1 | test de parole normal, +1 dé si celui qui parle a un savoir lontan (le respect) |
| Dictée | 6 veillées, confiance ≥ 3 | un cahier par gramoune ; il apprend ses savoirs lontan, en 7 veillées |
| Livres | 8 % par membre et par quart (× 3 école, × 1,5 église ou commerce, × 1,2 case), au plus 60 % ; stock de 2 + population par région | rares : quelques-uns par commune |

Quatre gramounes toutes faites (registre `gramounes`) sont proposées comme recrues, métissées selon `docs/metissage.md` :
Gramoune Zélie Ah-Kiem (sino-cafre de Bras-Panon, tisaneuse), Gramoun Ignace Técher (yab de Cilaos, pierre sèche),
Gramoune Mariamma Moutoussamy (malbare de Saint-Louis, vannière), Gramoun Saïd Madi (mahorais de Saint-Gilles, pêcheur).
Chacune porte un préjugé que sa propre histoire dément. Elles ne sont pas des acteurs du compendium : un acteur demande un
jeton peint, et ce lot ne génère aucune image (§6).

## 3. Jardins, boutures, objets faits main

| Chiffre | Valeur | Raison |
|---|---|---|
| Jardins des cases d'une région | 15 + 25 × population, entiers jusqu'au jour 90, puis −1/600 par jour, jamais sous 30 % | « garde des mois ses plantes solides » |
| Fouille « jardins » | ceil(0,6 × membres × quarts × prudence × 1,5 dans une case, une maison, une ferme, un îlet) prises aux jardins : 60 % en nourriture, 50 % en boutures, plus 0,2 zerbaz par membre et par quart | une sortie de deux personnes rapporte 2 à 4 nourritures et 2 boutures |
| Boutures | plafond 30 ; repiquées le soir dans un potager, jardin créole, serre ou verger en service (→ graines), sinon un tiers meurt par jour | « elles meurent si on ne les replante pas » |
| Rimèd lontan | 3 plantes → 2 médicaments, soins, savoir des zerbaz | mieux que la tisane (2 → 1) pour qui sait |
| Objets de confort | `effets.moral` des équipements des présents (pinces, sac, chaise, natte : 0,5 ; poêle de masse, chauffe-eau de fortune : 1), au plus +1 au moral de l'abri | ces effets étaient décrits sans être appliqués ; ils le sont, plafonnés |

## 4. Gaz et eau chaude

**Le gaz est une ressource à part** (`gaz`, 1 = un kilo, une bouteille en fait 13), pillable. Raisons : pas les mêmes
réserves (les bouteilles des cuisines, pas les cuves des stations), pas les mêmes usages (il ne fait pas rouler un moteur),
et le carburant garde tout son équilibre. Réserves : 10 + 40 × population kilos par région (Saint-Denis 210, Mafate 10 + 40 ×
sa population) ; 13 kg sous l'évier des cases, maisons, fermes et îlets ; plafond de base 26. Une partie d'avant le gaz :
ses stocks le lisent à 0, et ses régions le reçoivent à la part qui reste de leurs autres réserves (`completerPillage`).
Consommation : gazinière 1 par jour, chauffe-eau à gaz 1 par jour (une bouteille dure deux semaines aux deux). Repli : le
feu de bois, en sœur lontan. Pas de biogaz (écarté : le complément veut un gaz qui s'épuise).

## 5. Cyclone, chiens, routes

| Chiffre | Valeur | Raison |
|---|---|---|
| Préparer | 2 quarts-personne + 1 par installation exposée, valable 5 jours | une journée de deux personnes pour un abri équipé |
| Préparé | protection +1 (au plus 3), rien n'est emporté | la force du cyclone ne change pas (« pas de cyclones plus forts ») |
| Pas préparé | emporte 2 × force matériaux, force plantes, toutes les boutures | les tôles, les bâches, ce qui séchait |
| Fuites | eau +4 × force (au plafond), eau douteuse 3 jours : maladies de l'eau × 2 sans eau traitée | « une eau à filtrer » |
| Arbres tombés | bois des alentours +0,5 × force × plafond (pourrit à 3 % du surplus par jour) ; fruits +0,3 × force × plafond (25 % par jour) | du bois pour des semaines, des fruits à conserver vite |
| Pistes et sentiers | coupés par des arbres : 15 % × force chacun, 4 × force jours | la route se dégage d'abord |
| Végétation abattue | visibilité + force, −1 tous les 15 jours | un cyclone de force 3 : six semaines de plus |
| Dépôt dans la cour | un tiré parmi 13 (tôles, bâche, panneau, bouteille de gaz, fût d'eau, poules, bananes, barque ; Livide coincé, vache noyée, guêpes, malle, cuve percée) | bonnes et mauvaises surprises ; le Livide coincé est une menace de force 1 au MJ |
| Vacarme | le jour rouge, le bruit de l'abri ne compte ni pour les menaces ni pour les hordes | « les Livides n'entendent rien » |
| Dehors | rafales et retour −2 dés, vigilance −3, discrétion +2 ; accalmie −1, −1, +1 ; l'œil 0 | l'œil : région du milieu de la trajectoire, force 2 ou 3 |
| Chien errant | 1 nourriture par veillée, test de survie (+1 élevage), confiance 5 ; forcé raté : 1 blessure, −1 | une semaine de patience |
| Chien du groupe | moral +1 (pas en plus des chiens de garde), vigilance +1 (comme une tour), combat +1 au maître | il garde, réconforte, alerte (cyclone, volcan) |
| Meutes | sur la route, dès l'effondrement : animaux × 2, 3 à 7 bêtes ; chien de tête (2 dés, résistance 2) | « dangereuses sur les routes » |
| Sentier | rencontres × 0,7 | lent et silencieux |
| Verrous | en véhicule, après le jour zéro : 25 % par étape de route, 15 % de piste (× 2 après un cyclone ou des pluies) ; épave 4, éboulis 2, tunnel 1, arbre 2 ; temps par défaut 1 à 3 quarts ; siphon 1–2 avant J120, 0–1 ensuite, rien après J240 | la route reste plus rapide qu'un sentier, sans plus être sûre |
| Vélo | allure 0,5, descente × 0,6, montée × 2,5 (de 300 m ou plus) | descend sans bruit, remonte plus lentement qu'à pied |
| Charrette à bœufs | 40 de charge, allure 1,2, montée × 1,5, route et piste, bruit 0, large | lente, silencieuse, porte lourd |
| Électriques | vélo 0,5 énergie par quart (allure 0,4, montée × 0,9), scooter 1, voiture 5 (charge 16) | une voiture vide une batterie de 15 en trois quarts |
| Moteurs modifiés | voiture à l'alcool : biocarburant 1,2 par quart, × 1,25 de temps ; camion à gazogène : 1 matériau (bois sec) par quart, × 1,5, bruit 3, charge 50 | « moins bon qu'à l'essence » |
| Carburant maison | alcool de canne : 4 nourriture → 1 (conserverie) ; huile filtrée : 3 nourriture + 1 matériau → 1 (moteurs de fortune) | cher en vivres : on ne roule pas tous les jours |

## 6. Mesures

Le simulateur (`essais/outils/simuler-parties.mjs`) joue les groupes « raisonnables » du contrat ; il ne bâtit pas de sœur
lontan, ne cuisine pas au gaz et n'apprivoise pas de chien : ce lot ne change donc son équilibre qu'à travers les règles qui
touchent tout le monde (le gaz qui entre dans les fouilles, les meutes et les verrous de la route, le cyclone vécu,
l'éruption annoncée la veille). Depuis ce lot, il **prépare** l'abri quand un cyclone est annoncé sur sa région (ce que ferait
un groupe qui écoute la radio).

Avant → après, même code de mesure, même graine (le code d'avant rejoué depuis la branche principale). Node 25 plante parfois
(erreur de V8) sur les longues séries : les mesures ont été faites avec `node --max-opt=2` ou `--max-opt=1`, qui ne
change rien aux résultats.

| Cas (200 jours) | Graine 7, 120 parties : vivants à J200 | Graine 11, 200 parties : vivants à J200 |
|---|---|---|
| Nomade × 1 | — | 53 % → 59 % |
| Nomade × 4 | 83 % → 91 % | — |
| Enraciné × 1 | 57 % → 48 % | 53 % → 57 % |
| Enraciné × 2 | — | 67 % → 72 % |
| Enraciné × 4 | 84 % → 81 % | 84 % → 80 % |
| Mixte × 4 | 80 % → 83 % | — |

Assauts par mois après J30 (enraciné × 4, graine 7) : 4,46 → 4,20 (sérieux 2,77 → 2,49) ; brèches par partie 1,29 → 1,34.
Les écarts changent de sens d'une graine à l'autre : c'est le bruit du tirage (toute règle qui tire un dé de plus déplace la
suite du hasard), pas un effet du lot. `essais/survie-equilibre.test.mjs` passe sans toucher à ses bornes.

Ce que les nouveautés donnent à un groupe qui s'en sert (calculé, pas simulé) : un jardin créole niveau 2 dans un site à sol
2, sans compost, donne 1,5 à 3 nourritures par jour sans eau ; des gouttières de bambou niveau 2 à pluie 2 donnent 3 eau en
saison des pluies ; un groupe sans matériaux peut donc tenir une voie d'autonomie modeste à deux avec les seules matières de
l'île — c'est le but (le paradis lontan), et il reste moins productif que la voie moderne.

## 7. Reste ouvert

- Le simulateur ne joue ni les sœurs lontan, ni le gaz, ni les veillées, ni le chien : leur effet sur une longue partie n'est pas
  mesuré (§6, calcul seulement).
- Les gramounes n'ont pas de jeton peint (pas d'image générée dans ce lot) : elles prennent le jeton de leur passé.
- Le chien du groupe ne meurt que si le MJ le dit (pas de règle de blessure du chien) ; une meute de chiens n'a pas de règle
  de fuite quand le chien de tête tombe (le MJ la raconte).
