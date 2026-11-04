# Notes de la logique pure de `lakour-survie` (choix faits, écarts au contrat proposés)

Logique dans `systems/lakour-survie/logique/` (aucun appel à Foundry, aucune dépendance), essais dans `essais/`
(`npm run essais`). Ce fichier liste ce que le contrat (`docs/survie-contrat.md`) laissait ouvert et comment je l'ai tranché.
Les nombres d'équilibre sont documentés en tête de chaque fichier.

## Formes et signatures

- **`simulerJour(monde, contenu, hasard, jour, contexte)`** : le 5e argument est un objet
  `{ region, radio, bruitParRegion, abri: { region, visibilite, bruit, defense } }`. Pour rester compatible avec le contrat
  (`bruitParRegion` en 5e argument), un objet qui n'a aucune de ces clés est lu comme `bruitParRegion`. Le résultat contient
  en plus `menaces` (§1.7). `monde.jour` = dernier jour simulé ; `creerMonde` le met à 0.
- **Hasard** : la simulation tire un générateur par jour, `hasardDuJour(graine, jour)` ; le monde ne dépend donc pas de la
  façon dont on avance (1 quart à la fois ou 40 d'un coup). Les actions reçoivent un hasard de l'appelant (Foundry peut
  passer `deriverHasard(graine, "fouille", quart, n)` pour des parties rejouables).
- **Monde (secret)** : champs ajoutés `dateDepart`, `compteur` (identifiants de hordes), `cyclones` (compte, pour les noms) ;
  `regions[r].sitesVisites` (stocks d'un site trouvés une seule fois) ; `evenements[i].routes` (les routes que l'événement
  abîme : l'état des routes est recalculé chaque jour à partir des événements en cours) ; `abrisAbandonnes[i].stocks` (ce
  que le groupe a laissé en partant).
- **État public** : champs ajoutés `fouilleLe` (jour de la dernière fouille, pour l'autonomie), `fetes` (« clé-année » déjà
  fêtées, §9), `groupe.statuts` (posé par `ajouterMembre`). `dateDepart` n'est pas dans l'état : c'est le réglage monde,
  passé en option (et gardé dans le monde).
- **Installation incorporée** : champs ajoutés `termineLe` (jour de la PREMIÈRE mise en service : le délai d'un potager ne
  repart pas quand on l'agrandit) et `actif` (défaut vrai : éteindre un groupe électrogène).
- **Survivant** : champs ajoutés `afflictions` (§9, instances `{ cle, depuis, stade, actifDepuis, reste, traitee, malus,
  fatigue }` ; la couche Foundry peut les refléter en objets `affliction`), `joursTache`, `tacheDepuis`, `joursSansPassion`,
  `joursMoralZero`, `enseigne: { eleve, competence }` (§10.3).
- **`peutConstruire(installation, niveau, abri, site, groupe)`** : les installations existantes sont lues dans
  `abri.installations` (le contrat ne les passe pas). `niveau` omis = le suivant. Un chantier déjà ouvert n'est pas repayé.
- **`bilanAbri(abri, installations, contenu, conditions)`** : `conditions = { jour, saison?, dateDepart?, personnes, meteo?,
  reseaux?: { eau, electricite }, rations?, travailleurs? }`. Le bilan rend aussi `joursDeStocks`, `arrets`,
  `eauTraitee`, `eauSite`, `surpeuplement`.

## Règles tranchées

- **Test** : `resoudreTest` prend `compte` (défaut vrai) ; sans lui, jamais de marque. `forcerTest(resultat, hasard)` force
  un test déjà lancé (bouton du chat), une seule fois. Les marques repartent à 0 en montant, sans report.
- **Marques décimales** : passions × 1,5 / × 2 et bonus des jeunes (× 4/3, « une de plus toutes les 3 ») donnent des marques
  au centième.
- **Malus d'état** : mourant (blessures 4) = −3 dés (le contrat ne donne que −1 à 2 et −2 à 3).
- **Mourant** : meurt à la fin du quart (`avancer`) s'il n'a pas été stabilisé (`options.stabilises`). Un soin réussi retire
  1 blessure + 1 par point de marge.
- **Soif et faim** n'ont pas de mort automatique : elles fatiguent (et la faim mine le moral) jusqu'à 5 ; au MJ de trancher
  au-delà (proposé : ajouter une règle si on veut que la soif tue).
- **Pluie** : la production « × climat.pluie » est aussi × 0,5 en saison sèche (le contrat ne met la saison que sur le
  soleil). **Soleil** : × climat.soleil × (1 ou 0,8) × soleil du site / 3.
- **Eau du site et réseaux publics** (non écrits au contrat, indispensables à l'équilibre) : rivière 12/jour, source 8,
  puits 5, petite citerne 1 × pluie ; réseau d'eau public 60/jour et électricité publique 20 kWh/jour tant qu'ils marchent
  dans la région. C'est ce qui fait tenir une ville les premiers jours.
- **Effets d'un niveau** : ceux du niveau courant décrivent toute l'installation (ils ne s'additionnent pas aux niveaux
  inférieurs).
- **Nature d'une région** : un nombre n = rendement par jour d'alentours intacts ; plafond 10 × n (on accepte aussi
  `[parJour, plafond]` ou `{ parJour, plafond }`). Les alentours de l'abri sont entamés par le groupe ; la nature de la
  région l'est par les autres.
- **Fouiller la nature** (`cible` = cueillette, gibier, peche, bois) ne compte pas comme une fouille pour l'autonomie.
- **Plans** : −25 % sur TOUTES les ressources du coût (pas seulement les matériaux), arrondi au supérieur ; travail ÷ 2
  arrondi au supérieur.
- **Stocks d'un site** : trouvés une seule fois, et entamés comme la région (stock × part restante du pillage réel de cette
  ressource) : le supermarché du jour 30 n'a plus grand-chose.
- **Phase de la crise** : selon le jour seulement (« modulée par la simulation » : non fait, la simulation agit sur les
  régions, pas sur la phase).
- **Rencontres en route** : une par région traversée au plus ; `voyager` rend toutes celles tirées et la première.
- **Dates** : calcul en dates calendaires UTC, le fuseau n'a aucune influence.
- **Faits** : champ `portee` ajouté (`region`, `voisins`, `radio`, `ile`, `mj`) ; une nouvelle « radio » est publique si le
  groupe a une radio en marche, ou si le téléphone marche encore dans sa région.
- **Paliers de visibilité** (§9) : seuils 3, 5, 7, 9 ; comparaison avec la visibilité au début de l'appel d'`avancer`
  (ou `options.visibiliteVeille` que Foundry peut garder) ; le fait `palierVisibilite` est secret (`portee: "mj"`).
- **Maladies** (§9) : champs ajoutés aux afflictions du contenu : `declencheur` (`eau`, `moustiques`, `ravine`, `chaleur`)
  et `risque` (chance par personne et par jour). Les blessures et chocs ne s'attrapent pas d'eux-mêmes : le MJ les donne
  (`contracter`). Les médicaments sont consommés même si le soin échoue. Une affliction en incubation figure déjà sur
  l'acteur : la couche Foundry peut la cacher aux joueurs.
- **Véhicules** (§9) : champs `rapide` (motorisé : `quartsVehicule`) et `allure` (sinon : `quartsPied × allure`) ; par mer,
  un véhicule non motorisé met deux fois `quartsVehicule`.
- **Créatures** (§9) : contenu `creatures` (le module les range dans `bestiaire.mjs` : le registre devra les donner sous
  la clé `creatures`). Filtres `zones`, `phases`, `altitudeMin`, `altitudeMax`, `jourMax`.
- **Traits** (§10.1) : effets lus génériquement : `competences` (à la génération), `moral` (déplace le plafond du moral ;
  négatif, il y redescend), `fatigue` (par jour), `besoins` (multiplicateurs de rations), `taches` (dés en plus ou en moins
  pour une tâche, et niveau effectif au travail), `peur: { lieux, malus, moral }` (malus de dés via `modificateursTraits` et
  moral perdu chaque jour dans ces lieux), `social: { max, moral }`. `special` est rendu au MJ, sans règle.
  `incapacites` peut être au niveau du trait ou dans ses effets ; « violence » interdit la garde.
- **Tâches** (§10.3) : `fouille` → discrétion, `chasse` et `peche` → survie. Sous le niveau requis d'une installation à
  bras : × 0,75. Le contenu donne `BRAS = { cle: { tache, nombres: [par niveau] } }` : la logique accepte cette forme posée
  sur la définition de l'installation, ou `effets.bras: { tache, nombre, niveau }` par niveau.
- **Budget** (§10.2) : avec le contenu d'essai, un tirage brut fait 5 à 11 niveaux (moyenne 7,3) : le budget 10–16 complète
  donc presque toujours (vers les compétences préférées et les passions) et ne retire que rarement. Les recrues n'ont pas de
  budget.
- **Recrutement** : un cran plus facile si la recrue a 2 ou plus dans une compétence qui manque au groupe.

## Ce qui reste à la couche Foundry

- Garder `options.visibiliteVeille` d'un appel d'`avancer` à l'autre si l'on veut détecter les paliers franchis entre deux
  appels ; appeler `noterFouille(etat, jour)` après chaque fouille de pillage ; appliquer `departs` aux acteurs.
- Résoudre les `menaces` rendues par `avancer` (assaut, visite) : la logique ne les applique pas d'elle-même.
- Ajouter au bruit de l'abri le bruit rendu par les actions (fouille rapide, tir, véhicule).

## Vérification faite sur le vrai contenu (lecture seule)

En assemblant `modules/lakour-fenoir/contenu/` (régions par `voisinsDepuisRoutes`, sites rattachés à leur région),
`verifierContenu` ne trouve aucune erreur et 200 jours de simulation tournent (Bas presque vides au jour 200, Hauts et
cirques autour de 1 à 2).

## Couche Foundry (systems/lakour-survie/scripts, 2026-11-04)

- **Correction de la logique** : `peutFaire` lit désormais le vocabulaire des incapacités du contenu (`generation.mjs#INCAPACITES`,
  repris de `lakour-fenoir/contenu/aides.mjs`) : « travaux-lourds » interdit le chantier, « violence » la chasse (et la garde,
  choix d'avant gardé), « nuit » la garde, « cultures » les cultures et l'élevage, etc. ; `competencesInterdites` et
  `tachesInterdites` en plus. Avant, seule « violence » → garde était lue.
- **Registre** (`scripts/registre.mjs`) : les formes du contenu sont traduites pour la logique (enfances `modificateurs` →
  `competences`, traits `peur.lieu` → `peur.lieux`, `social.seuil` → `social.max`, véhicules `transport` → `type`, `terrains`,
  `charge`, `rapide`, `allure`, bestiaire → `creatures`, noms → `prenomsF`, `prenomsM`, `prenomsMixtes` (et `noms` pour
  les prénoms sans genre), proches, raisons et prix des recrues).
- **État public, champs ajoutés** : `bilan` (instantané du bilan de l'abri, pour les joueurs qui n'ont pas le monde),
  `meteo` (`{ temps: "cyclone" | "pluie" | "" }` là où est le groupe), `groupe.porte` (ce que le groupe porte sans abri : versé
  à l'abri à l'installation), `chroniques` (un chapitre par abri), `propositions` (des joueurs).
- **Monde réel, champs ajoutés** : `menaces` (menaces du jour en attente, avec `id`, jamais appliquées d'elles-mêmes),
  `paliers` (paliers de visibilité franchis), `visibiliteVeille`, `tirages` et `compteurMenaces` (hasard rejouable des actions).
- **Relecture du 2026-11-04 (`essais/survie-api-relecture.test.mjs`)** : une action qui refuse en route n'écrit rien (`demenager` et
  `installer` vérifient le voyage d'essai et le site d'arrivée avant de quitter l'abri ; `soigner` vérifie le soigneur avant de
  consommer le médicament) ; le coffre rescelle une copie du navigateur en avance sur l'enveloppe à la réouverture ; une demande de
  joueur a ses bonus et malus bornés à 0..4 (comme la fenêtre du test) et son tirage de création doit venir du générateur
  (`tirageDuGenerateur` : budget, savoir-faire et équipement de l'enfance et du passé, traits connus et compatibles, trois au plus),
  sinon `LAKOUR_SURVIE.Erreurs.TirageInvalide`.
