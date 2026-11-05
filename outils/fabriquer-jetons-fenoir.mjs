// Fabrique les jetons du module lakour-fenoir : un SVG autonome de 400 × 400 par acteur (prétirés, PNJ, bestiaire) et par figurant,
// en version plate (assets/jetons/<cle>.svg) et en relief (assets/jetons/3d/<cle>.svg) ; un jeton de joueur par passé
// (assets/jetons/joueurs/<cle>.svg et joueurs/3d/) avec leurs index (assets/jetons/index.json et index-3d.json : clé du passé ->
// chemin) ; figurants.json ; et CREDITS.md. Dessin et lecture des icônes : aides communes du moteur
// (modules/lakour-mj-ia/outils/jetons-commun.mjs). Correspondances : modules/lakour-fenoir/contenu/jetons.mjs.
// Usage : node outils/fabriquer-jetons-fenoir.mjs [--source <dossier icons-master de l'archive game-icons>]   (puis fabriquer-fenoir)
import { rmSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { argumentSource, controleurJetons, dessinerJetons, ecrivainDisque, lanceDirectement, lecteurDisque, tableauCredits } from "../modules/lakour-mj-ia/outils/jetons-commun.mjs";
import { SURVIVANTS } from "../modules/lakour-fenoir/contenu/survivants.mjs";
import { BESTIAIRE_ACTEURS } from "../modules/lakour-fenoir/contenu/bestiaire.mjs";
import { PASSES } from "../modules/lakour-fenoir/contenu/passes.mjs";
import {
  AUTEURS, COULEURS_ANNEAU, DOSSIER_JETONS, INDEX_JOUEURS, JETONS_ACTEURS, JETONS_FIGURANTS, JETONS_PASSES, LISERE_LIVIDE, TYPES_FIGURANTS,
  cheminJeton, cheminJeton3d, cheminJetonJoueur, cheminJetonJoueur3d
} from "../modules/lakour-fenoir/contenu/jetons.mjs";

const RACINE = join(dirname(fileURLToPath(import.meta.url)), "..");
const MODULE = "lakour-fenoir";
export const FICHIER_FIGURANTS = `${DOSSIER_JETONS}/figurants.json`;
const ACTEURS = [...SURVIVANTS, ...BESTIAIRE_ACTEURS];

export function listeJetons() {
  const acteurs = ACTEURS.map(d => {
    const cle = d.flags[MODULE].cle;
    const disposition = d.flags[MODULE].pretire ? "joueur" : String(d.prototypeToken.disposition);
    return { cle, titre: d.name, icone: JETONS_ACTEURS[cle], anneau: COULEURS_ANNEAU[disposition], lisere: d.system.livide ? LISERE_LIVIDE : null,
      plat: cheminJeton(cle), relief: cheminJeton3d(cle) };
  });
  const figurants = Object.entries(JETONS_FIGURANTS).map(([cle, f]) => ({ cle, titre: f.titre, icone: f.icone, anneau: COULEURS_ANNEAU["0"], plat: cheminJeton(cle), relief: cheminJeton3d(cle) }));
  const passes = PASSES.map(p => ({ cle: p.system.cle, titre: `Passé — ${p.name}`, icone: JETONS_PASSES[p.system.cle], anneau: COULEURS_ANNEAU.joueur,
    plat: cheminJetonJoueur(p.system.cle), relief: cheminJetonJoueur3d(p.system.cle) }));
  for (const j of [...acteurs, ...figurants, ...passes]) {
    if (!j.icone) throw new Error(`Aucune icône pour ${j.cle} : ajouter la ligne dans contenu/jetons.mjs`);
    if (!j.anneau) throw new Error(`${j.cle} : disposition sans couleur d'anneau`);
  }
  const cles = new Set(acteurs.map(a => a.cle));
  for (const cle of Object.keys(JETONS_ACTEURS)) if (!cles.has(cle)) throw new Error(`contenu/jetons.mjs cite ${cle}, qui n'est pas un acteur`);
  for (const [type, f] of Object.entries(TYPES_FIGURANTS)) if (!cles.has(f.jeton) && !JETONS_FIGURANTS[f.jeton]) throw new Error(`Type de figurant ${type} : jeton ${f.jeton} inconnu`);
  return { acteurs, figurants, passes };
}
export const indexJoueurs = (passes, style) => Object.fromEntries(passes.map(p => [p.cle, style === "3d" ? cheminJetonJoueur3d(p.cle) : cheminJetonJoueur(p.cle)]));

// Vérification (essais) : chaque jeton présent, bien formé, de la bonne couleur ; index et figurants.json cohérents.
export function verifierJetons(lire = lecteurDisque(RACINE)) {
  const erreurs = [];
  const controler = controleurJetons(lire, erreurs);
  const { acteurs, figurants, passes } = listeJetons();
  for (const j of [...acteurs, ...figurants, ...passes]) { controler(j.plat, j.titre, j.anneau.couleur); controler(j.relief, `${j.titre} (3D)`, j.anneau.couleur); }
  for (const style of ["2d", "3d"]) {
    const brut = lire(INDEX_JOUEURS[style]);
    if (brut === null) { erreurs.push(`${INDEX_JOUEURS[style]} absent`); continue; }
    if (JSON.stringify(JSON.parse(brut)) !== JSON.stringify(indexJoueurs(passes, style))) erreurs.push(`${INDEX_JOUEURS[style]} périmé`);
  }
  const fig = lire(FICHIER_FIGURANTS);
  if (fig === null) erreurs.push(`${FICHIER_FIGURANTS} absent`);
  else if (JSON.stringify(JSON.parse(fig)) !== JSON.stringify(TYPES_FIGURANTS)) erreurs.push("figurants.json périmé");
  return erreurs;
}

export function credits(liste) {
  const { lignes, auteurs } = tableauCredits([...liste.acteurs, ...liste.figurants, ...liste.passes], AUTEURS);
  return `# Crédits — La Kour, Fénoir

Module de contenu original pour un usage non commercial. Tous les textes (régions, sites, installations, savoirs, passés,
enfances, traits, factions, événements, fêtes, guides, scénarios, tables) sont **originaux** : rien n'est repris de *The Walking
Dead* (série, bande dessinée, jeux), du jeu de rôle de Free League, ni d'aucune autre œuvre de morts-vivants. La mécanique de
création des survivants s'inspire de celle de *RimWorld* (tirage cohérent, passions, traits) sans en reprendre ni texte ni nom.

## La Réunion

La géographie de l'île (communes, cirques, routes, sentiers, centrales, sites naturels) est réelle et nommée comme telle ;
les bâtiments, occupants, personnages et factions sont inventés. Aucune marque commerciale n'est nommée. Les distances, durées et
altitudes sont des approximations de jeu, vérifiées sur des sources publiques (Parc national de La Réunion, topo-guides de
randonnée, bilans énergétiques de l'île, ARS et Office de l'eau pour l'eau potable) ; elles ne remplacent ni une carte ni un guide.

## Images

Carte de l'île (\`assets/cartes/reunion.webp\`) : fabriquée par programme (\`outils/fabriquer-carte.mjs\`) à partir de données
ouvertes : contour IGN Admin Express (Licence ouverte), relief Terrain Tiles d'AWS Open Data (SRTM, ETOPO1), routes et
sentiers © les contributeurs d'OpenStreetMap (ODbL).
Illustrations (fond du monde \`assets/monde/fond.jpg\`, images des fêtes \`assets/fetes/*.jpg\`) : générées localement par IA
par l'auteur, avec le modèle FLUX.2 klein 9B (modèle non commercial), sans service distant.
Les fonds des cartes de lieux (\`assets/cartes/lieu-*.svg\`) sont dessinés par le rendu commun du moteur La Kour.

## Icônes des jetons

Les silhouettes des jetons (\`assets/jetons/\`) sont des icônes de **[game-icons.net](https://game-icons.net)**, publiées sous licence
**Creative Commons Attribution 3.0 (CC BY 3.0)** : <https://creativecommons.org/licenses/by/3.0/>. Source : <https://github.com/game-icons/icons>.

Icons made by ${auteurs}, from game-icons.net (CC BY 3.0).

Modifications : tracés recolorés et composés dans un médaillon (anneau selon l'attitude, bleu acier pour les jetons de joueur,
liseré cendre pour les Livides, version en relief). Fichiers produits par \`outils/fabriquer-jetons-fenoir.mjs\`.

| Icône | Auteur | Utilisée pour |
|---|---|---|
${lignes}

## Licence

Les textes et les images originaux de ce module sont sous licence **CC BY-NC-SA 4.0**
(<https://creativecommons.org/licenses/by-nc-sa/4.0/>), attribution « LaKour — Hogun974 » ; son code (scripts, gabarits,
styles, \`lang/\`) est sous licence **MIT**. Le détail et les mentions des tiers sont dans \`LICENCE-CONTENU.md\` et
\`LICENSE\`, livrés dans l'archive avec ce fichier. Les icônes de game-icons.net créditées ci-dessus restent sous CC BY 3.0 ; la carte de
l'île garde les mentions de ses données (IGN Admin Express, licence ouverte ; © les contributeurs d'OpenStreetMap, ODbL).
Foundry VTT est une marque de Foundry Gaming, LLC ; ce module n'y est pas affilié.
`;
}

export function fabriquerJetons({ source } = {}) {
  const liste = listeJetons();
  const ecrire = ecrivainDisque(RACINE);
  rmSync(join(RACINE, DOSSIER_JETONS), { recursive: true, force: true });
  dessinerJetons([...liste.acteurs, ...liste.figurants, ...liste.passes], { ecrire, auteurs: AUTEURS, source });
  for (const style of ["2d", "3d"]) ecrire(INDEX_JOUEURS[style], `${JSON.stringify(indexJoueurs(liste.passes, style), null, 2)}\n`);
  ecrire(FICHIER_FIGURANTS, `${JSON.stringify(TYPES_FIGURANTS, null, 2)}\n`);
  ecrire(`modules/${MODULE}/CREDITS.md`, credits(liste));
  return liste;
}

if (lanceDirectement(import.meta.url)) {
  const { acteurs, figurants, passes } = fabriquerJetons({ source: argumentSource() });
  console.log(`${acteurs.length} jetons d'acteurs, ${figurants.length} de figurants, ${passes.length} de joueurs (un par passé), plats et en relief, dans ${DOSSIER_JETONS}/`);
}
