// Cartes de Fénoir : (1) les cartes de lieux, plans en cases convertis en scènes v14 par le même convertisseur que l'outil
// creer_scene du MJ IA (modules/lakour-mj-ia/scripts/cartes.js), fonds dessinés plat et relief (cartes-rendu.js), plans.json ;
// (2) la carte de La Réunion (fond assets/cartes/reunion.webp, fait plus tard), une épingle par région vers sa page du journal
// « Les régions de l'île », et les repères dans flags.lakour-fenoir.regions.
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { planVersScene } from "../../lakour-mj-ia/scripts/cartes.js";
import { planVersSVG } from "../../lakour-mj-ia/scripts/cartes-rendu.js";
import { MODULE, STATS, identifiant } from "./aides.mjs";

function ecrireSiChange(fichier, texte) {
  let actuel = null;
  try { actuel = readFileSync(fichier, "utf8"); } catch { /* pas encore écrit */ }
  if (actuel !== texte) writeFileSync(fichier, texte);
}

function ecrireFond(cle, plan) {
  for (const style of ["2d", "3d"]) {
    const { erreurs, svg } = planVersSVG(plan, { taille: 100, style });
    if (erreurs.length) throw new Error(`Fond de « ${cle} » (${style}) : ${erreurs.join(" ; ")}`);
    const dossier = new URL(style === "3d" ? "../assets/cartes/3d/" : "../assets/cartes/", import.meta.url);
    mkdirSync(dossier, { recursive: true });
    ecrireSiChange(new URL(`${cle}.svg`, dossier), svg);
  }
  return `modules/${MODULE}/assets/cartes/${cle}.svg`;
}

// Plans de toutes les cartes de lieux (assets/cartes/plans.json), écrits par le fabricant (ecrirePlans).
export const PLANS = {};
export function ecrirePlans() {
  const dossier = new URL("../assets/cartes/", import.meta.url);
  mkdirSync(dossier, { recursive: true });
  ecrireSiChange(new URL("plans.json", dossier), `${JSON.stringify(PLANS, null, 1)}\n`);
}

// Un dessin exige un auteur : auteur fictif fixe, remplacé par le MJ à l'import (scripts/main.js).
export const AUTEUR_CARTES = identifiant("auteur-cartes");

const embarqueur = (cle, _id) => (liste, collection) => liste.map((d, i) => {
  const eid = d._id ?? identifiant(`scenes:${cle}:${collection}:${i}`);
  return { ...d, _id: eid, _key: `!scenes.${collection}!${_id}.${eid}`, flags: d.flags ?? {} };
});

export function scene({ cle, nom, plan, description }) {
  const { erreurs, scene: s } = planVersScene(plan, { taille: 100, distance: 1.5 });
  if (erreurs.length) throw new Error(`Carte « ${nom} » : ${erreurs.join(" ; ")}`);
  s.levels[0].background.src = ecrireFond(cle, plan);
  PLANS[cle] = plan;
  s.drawings = s.drawings.filter(d => d.hidden); // restent les étiquettes de pièces (MJ seulement)
  const _id = identifiant(`scenes:${cle}`);
  const embarquer = embarqueur(cle, _id);
  return {
    __pack: "scenes", __cle: `scenes:${cle}`,
    _id, _key: `!scenes!${_id}`, name: nom, navName: nom, navigation: true, active: false,
    ...s,
    levels: embarquer(s.levels, "levels"), walls: embarquer(s.walls, "walls"),
    drawings: embarquer(s.drawings, "drawings").map(d => ({ ...d, author: AUTEUR_CARTES })), lights: embarquer(s.lights, "lights"),
    sounds: embarquer(s.sounds, "sounds"), notes: embarquer(s.notes, "notes"),
    regions: embarquer(s.regions, "regions").map(r => ({ ...r, behaviors: r.behaviors.map(b => ({ ...b, _key: `!scenes.regions.behaviors!${_id}.${r._id}.${b._id}` })) })),
    tokens: [], tiles: [],
    ownership: { default: 0 }, folder: null, sort: 0,
    flags: { [MODULE]: { cle, description, plan } }, _stats: STATS
  };
}

// ---------------------------------------------------------------- Carte de La Réunion
// regions : [{ cle, nom, repere: { x, y } }] ; pages : { cle de région -> { entryId, pageId } } (journal « Les régions de l'île »).
export const CARTE_REUNION = { cle: "carte-de-la-reunion", fond: `modules/${MODULE}/assets/cartes/reunion.webp`, largeur: 4000, hauteur: 3000 };
export function sceneReunion(regions, pages) {
  const { cle, fond, largeur, hauteur } = CARTE_REUNION;
  const _id = identifiant(`scenes:${cle}`);
  const embarquer = embarqueur(cle, _id);
  const notes = regions.map(r => ({
    _id: identifiant(`scenes:${cle}:note:${r.cle}`),
    entryId: pages[r.cle].entryId, pageId: pages[r.cle].pageId,
    x: r.repere.x, y: r.repere.y, elevation: 0, levels: [], sort: 0, locked: false,
    texture: { src: "icons/svg/village.svg", anchorX: 0.5, anchorY: 0.5, fit: "contain", scaleX: 1, scaleY: 1, tint: "#ffffff" },
    iconSize: 48, text: r.nom, fontFamily: "", fontSize: 28, textAnchor: 1, textColor: "#ffffff", global: true,
    flags: { [MODULE]: { region: r.cle } }
  }));
  return {
    __pack: "scenes", __cle: `scenes:${cle}`,
    _id, _key: `!scenes!${_id}`, name: "Carte de La Réunion", navName: "La Réunion", navigation: true, active: false,
    width: largeur, height: hauteur, padding: 0,
    // Sans grille ; 92 px = 2 km (1 km ≈ 46 px sur cette carte).
    grid: { type: 0, size: 92, distance: 2, units: "km" },
    tokenVision: false,
    environment: { darknessLevel: 0, globalLight: { enabled: true } },
    levels: embarquer([{ _id: "defaultLevel0000", name: "L'île", elevation: { bottom: 0, top: null }, background: { color: "#0d2a3a", src: fond } }], "levels"),
    initialLevel: "defaultLevel0000",
    walls: [], drawings: [], lights: [], sounds: [], regions: [], tokens: [], tiles: [],
    notes: embarquer(notes, "notes"),
    ownership: { default: 0 }, folder: null, sort: 0,
    flags: { [MODULE]: { cle, description: "La Réunion, nord en haut : une épingle par région, vers sa page du journal « Les régions de l'île ».",
      regions: Object.fromEntries(regions.map(r => [r.cle, { ...r.repere }])) } },
    _stats: STATS
  };
}
