# Licence du contenu — La Kour, Fénoir

*English summary at the end.*

Ce dépôt réunit du **code** et du **contenu de jeu**, sous deux licences :

| Quoi | Licence |
|---|---|
| Le code : système `lakour-survie`, scripts, outils, essais, gabarits, styles, traductions de l'interface | **MIT** : voir [`LICENSE`](LICENSE) |
| Les textes et les images originaux écrits ou produits pour LaKour | **CC BY-NC-SA 4.0** : ce fichier |
| Ce qui vient de tiers (icônes des jetons, données de la carte de l'île) | **sa licence d'origine** : voir plus bas |

Titulaire des droits sur le code et le contenu original : **Hogun974**, 2026.

## Sous CC BY-NC-SA 4.0 : les textes et les images

Licence Creative Commons **Attribution – Pas d'utilisation commerciale – Partage dans les mêmes conditions 4.0
International** : <https://creativecommons.org/licenses/by-nc-sa/4.0/> (résumé en français :
<https://creativecommons.org/licenses/by-nc-sa/4.0/deed.fr> ; texte juridique :
<https://creativecommons.org/licenses/by-nc-sa/4.0/legalcode.fr>).

Sont sous cette licence :

- `modules/lakour-fenoir/contenu/` : les textes et les données de jeu (livre de l'île, régions, sites, installations,
  savoirs, passés, enfances, traits, survivants, factions, réputations, événements, appels, fêtes, guides, scénarios,
  aides de jeu, tables, recettes, équipements, afflictions, bestiaire, camp…), y compris les dictionnaires anglais de
  `contenu/en/` ;
- `modules/lakour-fenoir/src/` et `modules/lakour-fenoir/packs/` : les compendiums engendrés de `contenu/` ;
- `modules/lakour-fenoir-en/` (module anglais engendré, non versionné) : le même contenu, traduit ;
- `monde/` : les sources du monde vierge (journaux, scène, dossiers, réglages, titre et description de `world.json` et
  `world.en.json`) ;
- les images produites pour le projet : `modules/lakour-fenoir/assets/monde/` (fond du monde), `assets/fetes/` (images
  des fêtes), `assets/cartes/` (cartes de lieux dessinées par programme, et la carte de l'île `reunion.webp`, sous
  réserve des mentions de ses données ci-dessous) et la mise en forme des jetons de `assets/jetons/` (médaillons,
  couleurs, relief ; les silhouettes restent sous CC BY 3.0, voir plus bas), ainsi que les données de `assets/`
  (`donnees.json`, figurants, plans).

Quand un même fichier mêle code et texte (les `.mjs` de `contenu/`), les textes, noms et données de jeu qu'il contient
sont sous CC BY-NC-SA 4.0 et le code JavaScript qui les assemble sous MIT.

### Attribution attendue

Créditer **« LaKour — Hogun974 »**, avec le lien vers le dépôt (<https://github.com/Hogun974/lakour-fenoir>), le nom
et le lien de la licence, et l'indication des modifications. Par exemple :

> D'après *La Kour — Fénoir*, LaKour — Hogun974 (https://github.com/Hogun974/lakour-fenoir), licence CC BY-NC-SA 4.0
> (https://creativecommons.org/licenses/by-nc-sa/4.0/). Modifié.

Pas d'utilisation commerciale ; une adaptation se partage sous la même licence. Une reprise de la carte de l'île garde
aussi les mentions de ses données (IGN, OpenStreetMap, Terrain Tiles).

## Sous MIT : le code

`systems/lakour-survie/` (tout le système : logique, scripts, gabarits, styles, traductions de l'interface `lang/`,
`system.json`), `modules/lakour-fenoir/scripts/`, `lang/`, `module.json`, `outils/` (sauf les données de
`outils/donnees-carte/`, voir plus bas), `essais/`, `docs/` (documentation du code), `.github/`, `package.json`.

## Sous licence tierce

| Quoi | Où | Licence | Mention |
|---|---|---|---|
| Silhouettes des jetons : icônes de [game-icons.net](https://game-icons.net) | `modules/lakour-fenoir/assets/jetons/` | [CC BY 3.0](https://creativecommons.org/licenses/by/3.0/) | auteurs icône par icône dans `modules/lakour-fenoir/CREDITS.md` |
| Contour de l'île (IGN Admin Express COG 2018, simplifié par france-geojson) | `outils/donnees-carte/contour-974.geojson`, dessiné dans `reunion.webp` | [Licence ouverte Etalab](https://www.etalab.gouv.fr/licence-ouverte-open-licence) | « IGN — Admin Express » |
| Relief (Terrain Tiles, AWS Open Data : SRTM, ETOPO1, GMTED2010) | `outils/donnees-carte/relief-974.bin.gz`, dessiné dans `reunion.webp` | données publiques | [attribution de Tilezen](https://github.com/tilezen/joerd/blob/master/docs/attribution.md) |
| Routes et sentiers (OpenStreetMap, API Overpass) | `outils/donnees-carte/routes-osm.json` (la base extraite reste sous ODbL), dessinés dans `reunion.webp` | [ODbL 1.0](https://opendatacommons.org/licenses/odbl/) | « © les contributeurs d'OpenStreetMap » (obligatoire) |

Détail des sources de la carte : [`outils/donnees-carte/SOURCES.md`](outils/donnees-carte/SOURCES.md).

Les illustrations (`assets/monde/`, `assets/fetes/`) ont été générées localement avec le modèle d'IA FLUX.2 klein 9B,
publié sous licence non commerciale : elles sont partagées sous CC BY-NC-SA 4.0 dans la mesure où le projet détient des
droits sur elles, et leur usage reste aussi soumis aux conditions de ce modèle. Les sons d'ambiance viennent du moteur
`modules/lakour-mj-ia` (sous-module), qui a son propre dépôt et sa propre licence (MIT).

Fénoir est une œuvre originale : rien n'est repris de *The Walking Dead*, du jeu de rôle de Free League ni de *RimWorld*,
et ce projet n'est affilié à aucun de leurs ayants droit. Foundry VTT (Foundry Virtual Tabletop) est une marque de
Foundry Gaming, LLC ; ce projet n'est ni affilié à Foundry Gaming ni approuvé par elle.

## English summary

The **code** in this repository (the `lakour-survie` system, scripts, tools, tests, templates, styles, interface
translations) is under the **MIT** licence (see `LICENSE`). The **original texts and images** written or made for LaKour
— `contenu/` and its English dictionaries, `src/`, `packs/`, the generated `lakour-fenoir-en` module, `monde/` and the
images and data in `assets/` — are under **Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International**
(<https://creativecommons.org/licenses/by-nc-sa/4.0/>). Credit **"LaKour — Hogun974"** with a link to the repository and
to the licence, and indicate changes; no commercial use; adaptations are shared under the same licence. Third-party
material keeps its own licence: game-icons.net icons (CC BY 3.0), the island outline from IGN Admin Express (Etalab Open
Licence), Terrain Tiles elevation data, and OpenStreetMap roads and trails (ODbL, "© OpenStreetMap contributors",
mandatory). The illustrations were generated locally with the non-commercial FLUX.2 klein 9B model. Foundry VTT is a
trademark of Foundry Gaming, LLC; this project is not affiliated with or endorsed by it.
