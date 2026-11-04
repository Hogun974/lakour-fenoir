# Fénoir — survie à La Réunion

*Un jeu de rôle de survie original pour Foundry VTT : La Réunion, au jour zéro d'un mal inconnu.*

**Fénoir** (« la nuit », en créole) : un mal que personne ne sait nommer, *le Gris*, relève les morts. On les appelle les
**Livides**. Vos personnages vivent à La Réunion et débarquent **au jour zéro** : tout marche encore, rien ne va plus. Les
urgences débordent, la quatre-voies est bouchée, la radio hésite entre deux versions. Puis, région par région, l'électricité,
l'eau, le carburant et le téléphone tombent ; les villes se vident ou grouillent ; des bandes s'organisent ; les cyclones de
l'été austral n'attendent personne, et le volcan non plus.

Le temps avance **avec vos actions**, et le monde avance avec lui. Il faut trouver un abri, l'aménager, vivre de ressources qui
s'épuisent. Deux voies, aussi valables l'une que l'autre :

- **repartir** : quand l'endroit est épuisé ou intenable, déménager, en emportant ce qu'on peut porter, ses compétences et ses
  **plans** (ce qu'on a déjà su construire se reconstruit plus vite) — vers un lieu qui a changé depuis la dernière fois qu'on
  l'a vu ;
- **s'enraciner** : citerne, potager, élevage, panneaux solaires, pico-hydro, galeries souterraines… viser l'**autonomie**. Mais
  la prospérité se voit et s'entend : elle attire bandes et hordes.

Le twist de l'île : la chaleur humide des Bas défait les Livides en quelques mois, le frais des Hauts et des cirques les garde.
Au début, les Hauts semblent sûrs et le littoral est l'enfer ; des mois plus tard, c'est l'inverse. Le « meilleur endroit »
change avec le temps.

Ton : survie réaliste et humaine, entraide et dilemmes, horreur sobre ; la beauté de l'île en contrepoint (cirques, lagon, letchis
de décembre, brume des Hauts) ; du créole en touches légères. Textes originaux ; la géographie réelle de l'île est un fait.

## Ce que contient ce dépôt

| Pièce | Dossier | Ce que c'est |
|---|---|---|
| le **système** `lakour-survie` | `systems/lakour-survie/` | les règles (logique pure, éprouvée), l'horloge et la simulation du monde, les fiches, le bandeau, le tableau de bord, la fenêtre du MJ, l'atelier, la création des survivants |
| le **module de contenu** `lakour-fenoir` | `modules/lakour-fenoir/` | seize régions de l'île et leurs routes, une cinquantaine de sites d'abri, installations, savoir-faire, passés, enfances, traits, équipement, véhicules, recettes, maladies, factions, événements, fêtes, guides, tables, cartes |
| le **moteur commun** `lakour-mj-ia` | `modules/lakour-mj-ia/` (sous-module) | le MJ IA, les compagnons IA, le coffre chiffré qui garde le monde réel secret |

Le contrat entre les trois : [`docs/survie-contrat.md`](docs/survie-contrat.md). Les choix de la logique :
[`docs/survie-notes-logique.md`](docs/survie-notes-logique.md) ; ceux du contenu : [`docs/survie-notes-contenu.md`](docs/survie-notes-contenu.md).

## Jouer

- **Solo** (un humain avec le MJ IA, et des compagnons IA s'il le veut), **groupe d'humains**, ou **1 à 5 humains et des
  compagnons IA**. Le meneur est le MJ IA ou un **MJ humain** : le système se joue entièrement sans IA (fenêtre du MJ).
- **Foundry VTT v14** (vérifié avec la 14.369).
- Le module **MJ IA** est fortement conseillé même sans IA : c'est son **coffre** qui scelle l'état réel du monde (hordes,
  infestation, ce qui reste à piller, ce qui s'est passé hors de vue). Sans lui, le système marche, mais le monde réel est gardé
  en clair dans les réglages du monde, et le MJ en est prévenu en permanence (« les joueurs peuvent lire l'état du monde »).

### Les règles en une minute

- Un **test** : autant de d6 que le niveau de la compétence + 1 (outil, aide : +1 ; état : −1 ou plus) ; chaque 5 ou 6 est un
  succès ; normale 1 succès, difficile 2, extrême 3. On peut **forcer** une fois (relancer les échecs, 1 fatigue ; un échec
  forcé : complication). Un test qui comptait, échoué ou forcé, donne une **marque** ; assez de marques et la compétence monte.
- Le **temps** se compte en **quarts** de six heures (matin, après-midi, soir, nuit). Fouiller un lieu : un quart ; explorer : un
  ou deux ; un chantier : selon l'installation et les bras. Chaque jour, l'abri produit, le groupe mange et boit, la nourriture
  se gâte, le monde se simule.
- Ce que le groupe sait d'une région est un **renseignement daté** (vu, radio, rumeur) : le réel a pu changer depuis.
- Chaque survivant a une **tâche du jour** (garde, cultures, chantier, soins…) ; ses **passions** (🔥) le font progresser plus
  vite ; ses **traits** et **incapacités** pèsent sur le groupe. Les **recrues** comblent ce qui manque, avec un prix.

### Les fenêtres

- **Créer un survivant** (bouton de la barre des acteurs, et au premier chargement pour un joueur sans personnage) : tirer au
  sort, verrouiller ce qu'on garde, relancer, choisir ; le budget de départ ; la création passe par le MJ actif.
- **Fiche de survivant** : compétences (clic : un test), passions, état, infection, maladies, traits, incapacités, enfance et
  passé, équipement, savoirs, tâche du jour, bouton « Histoire » du MJ IA.
- **Fiche d'abri** : stocks et jours de stocks, production, autonomie, défense, discrétion, visibilité, capacité, installations
  et chantiers, alentours, qui fait quoi.
- **Bandeau de survie** (en haut, chez tous, repliable) : jour, moment, date, météo, phase, stocks en jours, alertes.
- **Tableau de bord du groupe** : membres × tâches et besoins, renseignements datés et carte connue de l'île, journal,
  propositions d'action des joueurs.
- **Atelier** : les recettes possibles, et pourquoi pas les autres.
- **Fenêtre du MJ** : démarrer, avancer le temps, faire agir le groupe, assauts, recrues, fêtes, menaces du jour à résoudre, et
  le monde réel (au seul MJ actif).

## Installation (depuis les sources)

```bash
git clone --recurse-submodules <dépôt lakour-fenoir>
cd lakour-fenoir
npm install                 # @foundryvtt/foundryvtt-cli, versions épinglées
npm run fabriquer-fenoir    # vérifie le contenu, écrit src/ et assets/donnees.json, compile les compendiums dans packs/
```

Les compendiums compilés (`modules/lakour-fenoir/packs/`) ne sont pas versionnés : il faut les fabriquer. Copier ensuite
`systems/lakour-survie/` dans `Data/systems/lakour-survie/` (sans rien d'autre à exclure), `modules/lakour-fenoir/` dans
`Data/modules/lakour-fenoir/` (sans `src/` ni `contenu/`, qui ne servent qu'à la fabrication) et `modules/lakour-mj-ia/` dans
`Data/modules/lakour-mj-ia/` (sans `essais/`, `outils/`, `docs/`, `package*.json`).

Créer un monde avec le système **Fénoir — survie à La Réunion**, activer **La Kour — Fénoir** et **La Kour – MJ IA**, accepter
l'installation du contenu (guides, journaux du MJ, carte de La Réunion). Puis : les joueurs créent leur survivant, le MJ démarre
la partie (fenêtre du MJ, ou outil `survie_demarrer` du MJ IA).

Réglages du système : date du jour zéro (défaut 4 décembre 2026 : plein été austral, saison des cyclones), budget de création,
répartition automatique des tâches, création ouverte aux joueurs, fêtes qui suivent la date de jeu, lumière qui suit le moment ;
chez chacun : bandeau, signal « à toi », ambiances sonores (MJ), effets visuels.

## Essais

Tout s'éprouve sans Foundry, en Node (≥ 20), sans réseau ni IA :

```bash
npm run essais    # logique pure, contenu, et couche Foundry sur une doublure en mémoire (essais/doublures/foundry-survie.mjs)
npm run contrat   # le module de contenu respecte le contrat commun des modules de contenu (outil du moteur)
node modules/lakour-mj-ia/outils/valider-foundry.mjs modules/lakour-fenoir lakour-survie <dossier contenant common/ de Foundry v14>
node outils/valider-modeles.mjs <dossier contenant common/ de Foundry v14>   # les données « system » du contenu contre les modèles du système
```

Les essais de la couche Foundry (`essais/survie-api*.test.mjs`, `essais/survie-interface.test.mjs`) jouent une partie complète
(jour 0, survivants tirés au générateur, installation, fouille, citerne et potager, trente jours, assaut, atelier, maladie,
fête, recrue, déménagement), vérifient qu'aucune donnée du monde réel ne fuit vers les joueurs (réglages, chat, état public,
socket), le scellement et la réouverture du coffre du MJ IA, la garde d'écriture hors du MJ actif, et une batterie de mutations
(chaque règle clé cassée doit être détectée). Les essais du moteur : `cd modules/lakour-mj-ia && npm run essais`.

## Crédits

Textes, règles et contenu originaux. Jetons : icônes de [game-icons.net](https://game-icons.net) (CC BY 3.0), voir
[`modules/lakour-fenoir/CREDITS.md`](modules/lakour-fenoir/CREDITS.md). Pour un usage privé à la table.
