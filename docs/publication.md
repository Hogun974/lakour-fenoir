# Publication — liste de contrôle

Ce qu'il reste à faire, dans l'ordre, pour passer le dépôt en public et rendre Fénoir installable depuis Foundry. Tout ce qui
est automatisé l'est par `.github/workflows/release.yml`, `outils/empaqueter-paquets.mjs` et l'outil commun du moteur
`modules/lakour-mj-ia/outils/empaqueter-monde.mjs` ; le reste est à la main.

## 1. Avant le passage en public

- [x] **Licence** (décidé par Jordan le 5 novembre 2026) : code MIT, textes et images CC BY-NC-SA 4.0. `LICENSE` (MIT,
      « Copyright (c) 2026 Hogun974 ») et `LICENCE-CONTENU.md` (détail par dossier, attribution « LaKour — Hogun974 »,
      tiers) à la racine ; `TODO` retiré des deux README ; licence rappelée dans `modules/lakour-fenoir/CREDITS.md` ;
      champ `license` de `system.json` et `module.json` à `"LICENSE"` (hérité par `lakour-fenoir-en` ; `monde/world.json`
      le disait déjà), et `outils/empaqueter-paquets.mjs` copie les deux fichiers dans chaque archive ;
      les archives du monde ne les contiendront qu'une fois le sous-module `modules/lakour-mj-ia` mis à jour (`outils/empaqueter-monde.mjs` les copie désormais), et l'étape « Licences dans chaque archive » du workflow refuse la release sans eux.
      Garder les mentions **CC BY 3.0** (game-icons), **licence ouverte** (IGN Admin Express) et **ODbL** (OpenStreetMap :
      l'attribution « © les contributeurs d'OpenStreetMap » est obligatoire) ; dire que les images sont générées par IA
      avec un modèle **non commercial** (FLUX.2 klein 9B) : cela pèse sur le choix de la licence des images.
- [ ] **Captures** : déposer les PNG listés dans `docs/captures/LISEZ-MOI.md` (au moins `carte-de-l-ile`,
      `tableau-de-bord`, `fiche-de-survivant`, `abri`, `livre-de-l-ile`, `fete` : ce sont celles du bandeau du README et
      des `media` des manifestes).
- [ ] **Relire le dépôt pour les fuites** : aucune adresse interne, aucun nom de machine, aucune clé, aucun vrai nom de
      joueur dans les essais, les docs (`docs/survie-contrat.md`, `docs/survie-notes-*.md`), les commentaires, `monde/src/`
      et l'historique git. `git log -p | grep -i -E "172\.|192\.168|\.local|mot de passe|clé"` pour un premier passage.
      `npm run empaqueter-monde -- --verifier` refuse déjà un utilisateur, un message, un acteur de joueur, une IP privée,
      un chemin personnel ou une adresse mail dans le monde vierge. Les documents mentionnent « La Kour », « Jordan » : à
      garder ou non, au choix.
- [ ] **Sous-module** : `.gitmodules` pointe sur `../lakour-mj-ia` (URL relative). Sur GitHub, cela résout vers
      `https://github.com/Hogun974/lakour-mj-ia` : ce dépôt doit **exister et être public** (ou le workflow ne pourra pas le
      récupérer : le jeton `GITHUB_TOKEN` n'a accès qu'au dépôt courant). Le commit du sous-module enregistré ici doit avoir
      été poussé sur GitHub.
- [ ] **Le module MJ IA doit être installable** : `system.json` le recommande et `monde/world.json` l'exige
      (`https://github.com/Hogun974/lakour-mj-ia/releases/latest/download/module.json`, version ≥ 0.40.0). Publier d'abord
      une version de `lakour-mj-ia` (manifeste `module.json` + `lakour-mj-ia.zip` en release), sinon Foundry signalera la
      dépendance introuvable à l'installation du monde. Si l'adresse diffère, la corriger dans `system.json`,
      `monde/world.json` et les deux README.
- [ ] **Branche par défaut** : la branche s'appelle `principale`. Les liens des manifestes utilisent `HEAD`
      (`blob/HEAD/README.md`, `raw.githubusercontent.com/…/HEAD/…`) et marchent quel que soit son nom ; rien à renommer,
      sauf préférence.
- [ ] **Description et sujets du dépôt GitHub** : description courte sans accents depuis Git Bash (« Jeu de role de survie
      original a La Reunion, pour Foundry VTT v14 »), sujets `foundry-vtt`, `foundryvtt`, `survival`, `zombie`,
      `game-system`, `reunion`, `french`. Activer les **issues**. Désactiver le wiki si inutile.
- [ ] **Monde vierge** : `monde/src/` doit être extrait d'une copie à jour du monde du serveur après le dernier changement
      de contenu (`npm run empaqueter-monde -- --extraire <Data/worlds/la-kour-fenoir>`), sinon le monde publié installe
      des journaux et une carte d'une version précédente. Vérifier `monde/world.json` : `version` suit celle du module.

## 2. Première publication (release)

Le workflow part à chaque étiquette `v*`. Convention proposée : **l'étiquette porte la version du système** (`v0.1.0`), le
module, le module anglais et le monde suivent avec leurs propres numéros (le script lit chaque manifeste). Les `version`
des manifestes restent la seule source : ne pas les modifier à la main dans la release.

- [ ] Vérifier en local, avant de pousser l'étiquette :
      ```bash
      npm ci && npm run essais && npm run fabriquer-fenoir && npm run fabriquer-fenoir-en
      node outils/empaqueter-paquets.mjs --tag v0.1.0   # écrit dist/ (module anglais lakour-fenoir-en compris)
      npm run empaqueter-monde                          # monde/dist/world.json + monde/dist/la-kour-fenoir.zip, puis vérification
      ```
      et ouvrir les archives (`system.json` / `module.json` à la racine, `packs/` présent dans les modules, ni `src/` ni
      `contenu/` ; dans le monde, `world.json` et `data/` seulement).
- [ ] Pousser le dépôt, puis l'étiquette : `git tag v0.1.0 && git push github v0.1.0` (remote `github`).
- [ ] Suivre l'onglet **Actions** : la release doit contenir `system.json`, `lakour-survie.zip`, `module.json`,
      `lakour-fenoir.zip`, `lakour-fenoir-en.json`, `lakour-fenoir-en.zip`, `world.json`, `la-kour-fenoir.zip` (et
      `world-en.json`, `la-kour-fenoir-en.zip` si le monde anglais est fabriqué). Les manifestes publiés portent
      `manifest` = `releases/latest/download/…` et `download` = `releases/download/v0.1.0/…` (le monde : `latest`).
- [ ] **Essai d'installation à blanc** dans un Foundry v14 vide (pas le serveur de jeu) : installer le système par son
      manifeste, les deux modules, créer un monde, activer les modules, installer le contenu, créer deux survivants au
      générateur, démarrer la partie, fouiller, s'installer, avancer de dix jours, subir un assaut ; puis essayer le monde
      vierge par `world.json`, et le module anglais par `lakour-fenoir-en.json` (en désactivant le français).
- [ ] Vérifier la **mise à jour** : avec une version installée, publier une `v0.1.1` de test (ou attendre la prochaine vraie)
      et voir Foundry la proposer.

Un monde publié doit être **vierge** : aucune partie, aucun compte joueur avec mot de passe, aucune chronique, aucun réglage
client, aucune clé, aucun coffre. L'outil `empaqueter-monde` en est responsable (`--verifier`) ; le contrôler sur l'archive.

## 3. Passage en public

- [ ] GitHub › Settings › General › Danger zone › **Change visibility › Public** pour `lakour-fenoir` ; pareil pour
      `lakour-mj-ia` (ou au minimum ses releases accessibles : un dépôt privé ne sert pas de manifeste public).
- [ ] Vérifier que les adresses `releases/latest/download/system.json`, `module.json`, `world.json` et
      `lakour-fenoir-en.json` répondent sans connexion (navigation privée).
- [ ] Protéger la branche `principale` (relecture avant fusion, pas de force-push) si d'autres contribuent.

## 4. Adresses à donner aux joueurs

À copier dans Foundry (**Installer un système**, **Installer un module**, **Installer un monde**) :

| Quoi | Adresse |
|---|---|
| Système *Fénoir — survie à La Réunion* | `https://github.com/Hogun974/lakour-fenoir/releases/latest/download/system.json` |
| Module de contenu *La Kour — Fénoir* | `https://github.com/Hogun974/lakour-fenoir/releases/latest/download/module.json` |
| Module de contenu anglais *lakour-fenoir-en* (un seul des deux actif) | `https://github.com/Hogun974/lakour-fenoir/releases/latest/download/lakour-fenoir-en.json` |
| Module *La Kour – MJ IA* (requis pour le coffre, clé d'IA facultative) | `https://github.com/Hogun974/lakour-mj-ia/releases/latest/download/module.json` |
| Monde vierge tout prêt | `https://github.com/Hogun974/lakour-fenoir/releases/latest/download/world.json` |
| Le dépôt, le README, les issues | `https://github.com/Hogun974/lakour-fenoir` |

Pour un joueur qui rejoint une table déjà installée : seulement l'adresse d'invitation du serveur de jeu et son compte ; rien à
installer.

## 5. Soumission facultative au catalogue foundryvtt.com/packages

Ce que le site exige (vérifié le 4 novembre 2026 pour les Veillées ; à revérifier au moment de soumettre) :

- Être **titulaire d'une licence Foundry VTT active** : la soumission se fait connecté à son compte foundryvtt.com, par le
  **formulaire de soumission de paquet** (lien dans la FAQ de la page Packages). Les **systèmes et les modules passent par une
  relecture manuelle** de l'équipe Foundry avant d'apparaître ; compter quelques jours.
- Pour chaque paquet (le système, le module français, le module anglais et le module MJ IA sont **quatre soumissions
  séparées** ; le monde vierge ne se soumet pas au catalogue) : l'identifiant (`lakour-survie`, `lakour-fenoir`,
  `lakour-fenoir-en`, `lakour-mj-ia`), le titre, la description, l'adresse du **manifeste** (stable :
  `releases/latest/download/…`), l'adresse du projet (`url`), les versions de compatibilité (`minimum` 14, `verified`
  14.370), le ou les auteurs, et des **médias** : une image de couverture et des captures (celles des champs `media` des
  manifestes, qui doivent être **publiquement accessibles** : d'où `raw.githubusercontent.com/…/HEAD/docs/captures/…`, à
  déposer avant).
- Le manifeste doit être **public et joignable sans connexion**, son `download` doit pointer sur une **archive zip de la seule
  version** (pas sur `latest`) : c'est ce que fait le script (`releases/download/v…/…zip`). Les champs `readme`, `bugs`,
  `changelog`, `license` sont facultatifs mais remplis.
- Pour un **système** : le site demande en plus ce que le système fait tourner (ici : un jeu original, pas un système édité ;
  préciser qu'aucun contenu sous droits n'est inclus) et qu'il soit **installable sans autre paquet payant** ; indiquer que le
  module `lakour-mj-ia` est recommandé et gratuit.
- Une **licence explicite** est attendue dans le dépôt pour un paquet listé (d'où le point 1). Le site a aussi une
  **AI Content Policy** : déclarer honnêtement que les illustrations sont générées par IA (c'est déjà dit dans le README et
  `CREDITS.md`) ; vérifier à la soumission si une case ou une mention est demandée.
- Après acceptation, chaque nouvelle version se déclare sur la page du paquet (formulaire) ou par l'**API de publication**
  (`POST https://foundryvtt.com/_api/packages/release_version/`, en-tête `Authorization: <jeton fvttp_…>` de la page du
  paquet, corps `{ "id", "release": { "version", "manifest" (l'adresse du manifeste DE CETTE version, pas `latest`), "notes",
  "compatibility": { "minimum", "verified" } } }`). L'adresse d'une version précise est celle de l'asset de la release
  (`releases/download/v0.1.0/system.json`), qui convient.

Sans cette soumission, le jeu reste installable par ses manifestes : le catalogue n'apporte que la visibilité et la recherche
depuis Foundry.

## 6. Ensuite

- Tenir `CHANGELOG.md` à jour à chaque version (section « Non publié » puis une section par étiquette).
- Les captures vieillissent : les refaire quand l'interface change.
- Le monde anglais (`monde/world.en.json`) : quand l'outil du moteur saura le fabriquer, le workflow le publie déjà s'il
  trouve `monde/dist/world.en.json` (ou `world-en.json`) et `monde/dist/la-kour-fenoir-en.zip`.

## Release à blanc à la main

Avant de poser une étiquette, on peut rejouer toute la release sur GitHub sans rien publier : onglet **Actions** ›
**Publication** › *Run workflow*, sur `principale` (ou une autre branche). Le workflow fabrique, lance les essais, empaquette
et vérifie exactement comme pour une étiquette, avec la version de `systems/lakour-survie/system.json` (comme si l'étiquette
`v<version>` était posée : hors étiquette, la comparaison étiquette/version ne peut pas échouer). Seule différence : la
release GitHub n'est pas créée, le contenu de `dist/` est déposé en artefact du workflow (à télécharger en bas de la page
du run). La release réelle ne part que sur une étiquette `v*` poussée. À côté, le workflow **Essais** lance la suite
à chaque push et pull request vers `principale`, une fois la variable de dépôt `ESSAIS_AUTOMATIQUES` mise à `oui`
(Settings › Secrets and variables › Actions › Variables) : à faire quand le moteur `lakour-mj-ia` est à jour sur GitHub,
sinon la récupération du sous-module échoue à chaque envoi. À la main (Run workflow), il tourne toujours.

## Release à blanc du 4 novembre 2026

Chaque workflow a été rejoué étape par étape (Ubuntu 24.04 sous WSL, **Node 24.22**, npm 10) dans un clone neuf
`git clone --recurse-submodules`, avec un tag local et les variables `GITHUB_REF_NAME` / `GITHUB_REPOSITORY` du runner ;
les archives produites ont été relues (manifeste à la racine, chemins `/`, `packs/` complets, ni `src/`, ni `contenu/`, ni
`essais/`, ni `node_modules`, ni `.git`, CRC vérifiés). Les actions sont passées en versions Node 24
(`actions/checkout@v5`, `actions/setup-node@v5`, `softprops/action-gh-release@v3` : les v4/v2 tournent encore sous
Node 20, en fin de vie sur les runners GitHub).

Constats et corrections :

- **`package-lock.json` absent** : `actions/setup-node` (`cache: npm`) échoue dès le départ, et `npm ci` aussi. Il a été
  engendré depuis le registre (`npm install --package-lock-only` sur le seul `package.json` : 83 paquets, tous avec
  `resolved` et `integrity`). **À commiter.**
- **Piège trouvé : les scripts ne s'exécutaient pas sous Linux.** La garde « lancé directement ? » écrite
  ``import.meta.url === `file:///${process.argv[1]…}` `` est toujours fausse sur le runner (`argv[1]` commence déjà par
  `/`, d'où `file:////…`) : le script se termine **sans rien faire et sans erreur**. Corrigé dans `outils/empaqueter-paquets.mjs`
  (`resolve(process.argv[1]) === fileURLToPath(import.meta.url)`).
- Nouvelle étape de garde : l'étiquette doit être `v<version de systems/lakour-survie/system.json>` (convention
  ci-dessus) ; une version qui ne change que le contenu exige donc un nouveau numéro de système.
- `actions/checkout` reçoit `token: ${{ secrets.SOUS_MODULE_TOKEN || github.token }}`.
- `fabriquer-fenoir.mjs` a déjà une garde correcte (comparaison de `realpath`).

- [ ] Commiter `package-lock.json` (et le refaire par `npm install --package-lock-only` à chaque changement de
      `package.json`).
- [ ] Essais au vert avant l'étiquette (au rejeu, des essais `survie-api-*` en cours de reprise échouaient).
- [ ] `lakour-mj-ia` public (ou secret `SOUS_MODULE_TOKEN`) avant de pousser l'étiquette.
