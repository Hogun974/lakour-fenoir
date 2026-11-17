// Le corps, le sommeil et l'hygiène (lot 1 du portage de Fénoir 3D, contrat §19 ; chiffres et raisons : docs/equilibre-corps.md).
// Logique pure : chaque fonction rend un NOUVEL objet, jamais l'entrée modifiée ; le hasard est donné par l'appelant.
//
// - Le sommeil, besoin à part de la fatigue (décision de Jordan du 2026-11-14) : `system.veille` compte les quarts passés
//   éveillé depuis le dernier sommeil. En manque après 3 quarts (une journée faite : la nuit qui suit, on bâille), épuisé après 4
//   (une nuit blanche : −1 dé), terrassé à 7 (on s'endort là où l'on est : −2 dés, et l'on dort le quart suivant, de force).
//   Un quart de sommeil efface 4 quarts de veille à l'abri, 3 au bivouac, 2 à même le sol (le 3D : 3 h de veille par heure de
//   sommeil au bivouac, 2 au sol). Le manque de sommeil et la fatigue se cumulent jusqu'à −2 dés, pas au-delà.
// - L'endroit d'un bivouac, jugé en mots (sûr, exposé, dangereux) avant de s'y installer ; dangereux, on y dort mal.
// - Les chutes : une blessure à 3 m, une de plus tous les 3 m, mourant à 12 m, mort à 25 m ; 1,5 m d'eau amortit 15 m.
// - L'hygiène de l'abri : la souillure s'amasse avec les gens (moins avec des latrines), s'efface avec les jours et la pluie ;
//   l'insalubrité (0 à 3) qui en sort amène des maladies (gastro-entérite, plaie infectée, gale, leptospirose).
// - Le bouclier : chaque touche d'un Livide est parée sur un dé (5-6 pour la tôle) ; une touche parée ne blesse pas et ne mord pas.
import { borner } from "./constantes.mjs";
import { tirerPoids } from "./hasard.mjs";
import { lancer } from "./des.mjs";

// ------------------------------------------------------------------ le sommeil
export const SOMMEIL = {
  gene: 3,          // quarts éveillés : en manque (18 h ; le 3D : la gêne commence après 16 h)
  epuise: 4,        // une nuit blanche (24 h)
  terrasse: 7,      // on s'endort malgré soi (42 h ; le 3D : 40 h)
  efface: { abri: 4, bivouac: 3, sol: 2 },   // quarts de veille effacés par quart de sommeil
  malus: { repose: 0, "en-manque": 0, epuise: 1, terrasse: 2 },
  avecFatigue: 2,   // fatigue et manque de sommeil ensemble : au plus −2 dés
  insomnie: 1,      // une maladie qui empêche de dormir : un quart de veille effacé en moins
  maxi: 12          // le compteur ne monte pas au-delà (une borne de rangement : terrassé, on finit toujours par dormir)
};
export const LIEUX_SOMMEIL = ["abri", "bivouac", "sol"];
export const ETATS_SOMMEIL = ["repose", "en-manque", "epuise", "terrasse"];

export const veilleDe = s => borner(Math.floor(Number(s?.veille) || 0), 0, SOMMEIL.maxi);
export function etatSommeil(veille = 0) {
  const v = Number(veille) || 0;
  return v >= SOMMEIL.terrasse ? "terrasse" : v >= SOMMEIL.epuise ? "epuise" : v >= SOMMEIL.gene ? "en-manque" : "repose";
}
// Les dés que retire le manque de sommeil, compte tenu de ceux que retire déjà la fatigue (malusFatigue : 0, 1 ou 2).
export function malusSommeil(s, malusFatigue = 0) {
  const m = SOMMEIL.malus[etatSommeil(veilleDe(s))] ?? 0;
  return Math.max(0, Math.min(m, SOMMEIL.avecFatigue - Math.max(0, Number(malusFatigue) || 0)));
}

// Un quart qui passe pour le sommeil. dort : "abri" | "bivouac" | "sol" | null (éveillé) ; insomnie : une maladie l'empêche de
// bien dormir. Terrassé (veille ≥ 7) au début d'un quart où il devait veiller, il dort quand même, là où il est (au sol).
// -> { system, evenements: [{ cle: "epuise" | "endormi" }] } (endormi : il vient de s'endormir malgré lui, à raconter)
export function quartDeSommeil(entree, { dort = null, insomnie = false } = {}) {
  const s = { ...entree };
  const avant = veilleDe(s);
  const evenements = [];
  const lieu = LIEUX_SOMMEIL.includes(dort) ? dort : avant >= SOMMEIL.terrasse ? "sol" : null;
  if (lieu) {
    const efface = Math.max(1, SOMMEIL.efface[lieu] - (insomnie ? SOMMEIL.insomnie : 0));
    s.veille = Math.max(0, avant - efface);
    return { system: s, evenements, dort: lieu, force: !LIEUX_SOMMEIL.includes(dort) };
  }
  s.veille = Math.min(SOMMEIL.maxi, avant + 1);
  if (avant < SOMMEIL.epuise && s.veille >= SOMMEIL.epuise) evenements.push({ cle: "epuise" });
  if (avant < SOMMEIL.terrasse && s.veille >= SOMMEIL.terrasse) evenements.push({ cle: "endormi" });
  return { system: s, evenements, dort: null, force: false };
}

// Dormir n quarts d'un coup (une sieste, une nuit que le temps n'a pas comptée). -> system
export function dormir(entree, { quarts = 1, lieu = "abri", insomnie = false } = {}) {
  let s = { ...entree };
  for (let i = 0; i < Math.max(0, Math.floor(Number(quarts) || 0)); i++) s = quartDeSommeil(s, { dort: LIEUX_SOMMEIL.includes(lieu) ? lieu : "sol", insomnie }).system;
  return s;
}

// Où dort un survivant pendant ce quart (avancer, etat.mjs). nuit : c'est le quart de nuit ; matin : le quart du matin ;
// aLAbri : le groupe est à son abri ; enRoute : il marche ; garde : il veille (tâche « garde » ou veille de la nuit) ;
// repos : quart de repos (tâche « repos » le jour, ou repos demandé) ; bivouac : le groupe porte de quoi bivouaquer ;
// lieu : "bivouac" | "sol" imposé par le MJ ; dort : forcé par le MJ (dorment) ; eveille : le MJ le garde debout (une veillée,
// une nuit blanche) ; veille : ses quarts éveillés avant ce quart.
// Qui n'a pas dormi de la nuit (la garde, une veillée) dort le matin à l'abri ; épuisé, on rattrape au premier quart arrêté ;
// en route, la nuit, on marche (le voyage avance) ; arrêté hors de l'abri, on dort au bivouac (ou au sol sans rien pour bivouaquer).
export function lieuDeSommeil({ nuit = false, matin = false, aLAbri = false, enRoute = false, garde = false, repos = false, bivouac = false, lieu = "",
  dort = false, eveille = false, veille = 0 } = {}) {
  const dehors = LIEUX_SOMMEIL.includes(lieu) && lieu !== "abri" ? lieu : bivouac ? "bivouac" : "sol";
  const ici = aLAbri ? "abri" : dehors;
  if (dort) return ici;
  if (eveille) return null;
  if (nuit) {
    if (garde) return null;
    if (aLAbri) return "abri";
    return enRoute ? null : dehors;
  }
  if (aLAbri && matin && (garde || Number(veille) >= SOMMEIL.gene)) return "abri";
  // Une nuit blanche (en route, une veillée) : dès qu'on s'arrête, de jour, on la rattrape, là où l'on est.
  if (!enRoute && Number(veille) >= SOMMEIL.epuise) return ici;
  if (repos && !enRoute) return ici;
  return null;
}

// ------------------------------------------------------------------ le bivouac
// L'endroit d'un bivouac, jugé en mots, sans chiffre (le 3D, « fenoir_regles::endroit » ; critères à valider, validés le 17/11).
// criteres : { pente: "plat" | "douce" | "raide", ravine (le lit d'une ravine), route (à moins de 60 m d'une voie), bati (dans le bâti),
//   couvert (à couvert : arbres, rocher), feu, lumiere, bruit, livides (des Livides en vue ou à portée d'oreille), souille (l'endroit
//   est souillé) }. -> { jugement: "sur" | "expose" | "dangereux", raisons: [clé] }
export const JUGEMENTS_BIVOUAC = ["sur", "expose", "dangereux"];
export const BIVOUAC = {
  dangereux: ["pente-raide", "ravine", "livides"],
  expose: ["route", "bati", "a-decouvert", "pente-douce", "feu", "lumiere", "bruit", "souille"],
  // Ce que vaut une rencontre de la nuit dehors (le MJ la tire : actions.mjs, rencontreForcee ; ou la table « La nuit dehors »).
  rencontre: { sur: 0.5, expose: 1, dangereux: 2 }
};
export function jugerBivouac(c = {}) {
  const raisons = [];
  if (c.pente === "raide") raisons.push("pente-raide");
  if (c.ravine) raisons.push("ravine");
  if (c.livides) raisons.push("livides");
  if (c.route) raisons.push("route");
  if (c.bati) raisons.push("bati");
  if (c.couvert === false) raisons.push("a-decouvert");
  if (c.pente === "douce") raisons.push("pente-douce");
  for (const k of ["feu", "lumiere", "bruit", "souille"]) if (c[k]) raisons.push(k);
  const jugement = raisons.some(r => BIVOUAC.dangereux.includes(r)) ? "dangereux" : raisons.length ? "expose" : "sur";
  return { jugement, raisons };
}
// On dort mal dans un endroit dangereux : le sommeil n'y vaut que celui du sol, même avec de quoi bivouaquer.
export const sommeilAuBivouac = (jugement, bivouac = true) => (jugement === "dangereux" || !bivouac ? "sol" : "bivouac");

// ------------------------------------------------------------------ les chutes
// Décision de Jordan du 2026-11-16 (chiffres du 3D, validés le 17/11) : à partir de 3 m, une blessure, puis une de plus tous les
// 3 m ; mourant à 12 m ; mort à 25 m. L'eau amortit : 1,5 m d'eau et plus retire 15 m à la chute (en proportion en deçà).
// reception : le résultat d'un test d'endurance pour se recevoir (facultatif) : réussi, une blessure de moins, sauf pour une chute
// qui rend mourant ou qui tue. Une chute de 6 m et plus casse un os (fracture) si l'on ne s'est pas reçu.
export const CHUTE = { blesse: 3, parBlessure: 3, mourant: 12, tue: 25, eau: { profondeur: 1.5, amortit: 15 }, fracture: 2 };
export function chute({ hauteur = 0, eau = 0, reception = null } = {}) {
  const amorti = Math.min(1, Math.max(0, Number(eau) || 0) / CHUTE.eau.profondeur) * CHUTE.eau.amortit;
  const h = Math.max(0, (Number(hauteur) || 0) - amorti);
  if (h >= CHUTE.tue) return { hauteur: h, amorti, blessures: 4, mourant: false, mort: true, fracture: false, recu: false };
  let blessures = h < CHUTE.blesse ? 0 : Math.min(4, Math.floor(h / CHUTE.parBlessure));
  const recu = Boolean(reception?.reussite) && blessures > 0 && blessures < 4;
  if (recu) blessures -= 1;
  return { hauteur: h, amorti, blessures, mourant: blessures >= 4, mort: false, fracture: !recu && blessures >= CHUTE.fracture, recu };
}
// Un Livide qui tombe : il chancelle dès 3 m ; là où un survivant serait mourant, il se casse les jambes et rampe (décision de
// Jordan du 2026-11-16) : il avance encore, plus lentement, et ne se relève plus sur ses jambes.
export function chuteDeLivide({ hauteur = 0, eau = 0 } = {}) {
  const c = chute({ hauteur, eau });
  return { hauteur: c.hauteur, chancelle: c.blessures > 0 && !c.mourant && !c.mort, rampe: c.mourant || c.mort };
}
// Appliquer une chute à un survivant : blessures (au plus 4), mort (25 m et plus : vivant = false). La fracture est une affliction
// du contenu : l'appelant la donne (maladies.mjs, contracter). -> system
export function appliquerChute(entree, resultat) {
  const s = { ...entree };
  if (s.vivant === false || s.livide) return s;
  s.blessures = Math.min(4, (Number(s.blessures) || 0) + (Number(resultat?.blessures) || 0));
  if (resultat?.mort) s.vivant = false;
  return s;
}

// ------------------------------------------------------------------ l'hygiène de l'abri
// La souillure de l'abri (`abri.souillure`, un nombre ≥ 0) : chaque jour, chaque personne présente en ajoute selon les latrines en
// service (aucune 1, feuillées 0,3, latrines sèches 0,1, fosse maçonnée 0,03), plus 0,5 par personne au-delà de la capacité ;
// elle s'efface de 15 % par jour au sec, jusqu'à 60 % les jours de pluie (le 3D : une souillure dure 24 h à 120 h, la pluie l'efface
// quatre fois plus vite). L'insalubrité (0 à 3) : propre, ordinaire (6), sale (15), insalubre (30).
// Le niveau d'hygiène (0 à 3) : celui des latrines plus celui de la toilette (lavoir 1, douche 2), au plus 3. Une toilette rend
// l'insalubrité moins dangereuse (× 0,8 par point) ; un abri à 3 d'hygiène et propre (insalubrité 0) est « salubre » : la
// gastro-entérite y est moitié moins fréquente et les maladies s'y passent moins (contagion × 0,75).
export const HYGIENE = {
  apport: [1, 0.3, 0.1, 0.03],
  surpeuplement: 0.5,
  effacement: 0.15,
  pluie: 0.45,
  seuils: [6, 15, 30],
  risque: [0, 0, 0.005, 0.015],
  toilette: 0.2,
  salubre: { eau: 0.5, contagion: 0.75 },
  menage: 4,        // souillure retirée par quart-personne de ménage
  maxi: 40
};
export const ETATS_INSALUBRITE = ["propre", "ordinaire", "sale", "insalubre"];
export const souillureDe = abri => Math.max(0, Number(abri?.souillure) || 0);
export function insalubrite(souillure = 0) {
  const s = Number(souillure) || 0;
  return HYGIENE.seuils.reduce((n, seuil) => (s >= seuil ? n + 1 : n), 0);
}
export const niveauHygiene = (latrines = 0, toilette = 0) => borner(Math.floor(Number(latrines) || 0) + Math.floor(Number(toilette) || 0), 0, 3);
// La souillure du lendemain. personnes : présentes à l'abri ; latrines : 0..3 ; surpeuplement : personnes au-delà de la capacité ;
// pluie : part du jour où il a plu (0..1, sens.mjs pluieDuJour).
export function souillureDuJour({ souillure = 0, personnes = 0, latrines = 0, surpeuplement = 0, pluie = 0 } = {}) {
  const apport = Math.max(0, Number(personnes) || 0) * HYGIENE.apport[borner(Math.floor(Number(latrines) || 0), 0, 3)]
    + Math.max(0, Number(surpeuplement) || 0) * HYGIENE.surpeuplement;
  const efface = Math.min(0.9, HYGIENE.effacement + HYGIENE.pluie * borner(Number(pluie) || 0, 0, 1));
  const s = (Math.max(0, Number(souillure) || 0)) * (1 - efface) + apport;
  return Math.min(HYGIENE.maxi, Math.round(s * 1000) / 1000);
}
// Le ménage : quarts × bras de travail retirent chacun HYGIENE.menage de souillure. -> { souillure, retire }
export function menage(souillure = 0, { quarts = 1, bras = 1 } = {}) {
  const avant = Math.max(0, Number(souillure) || 0);
  const retire = Math.min(avant, Math.max(0, Number(quarts) || 0) * Math.max(0, Number(bras) || 0) * HYGIENE.menage);
  return { souillure: Math.round((avant - retire) * 1000) / 1000, retire: Math.round(retire * 1000) / 1000 };
}
// La chance, par personne et par jour, d'attraper une maladie de l'insalubrité. toilette : 0..2.
export const risqueInsalubrite = (niveau = 0, toilette = 0) =>
  (HYGIENE.risque[borner(Math.floor(Number(niveau) || 0), 0, 3)] ?? 0) * Math.max(0, 1 - HYGIENE.toilette * Math.max(0, Number(toilette) || 0));
export const salubre = (hygiene = 0, niveauInsalubrite = 0) => Number(hygiene) >= 3 && Number(niveauInsalubrite) <= 0;

// Le tirage du jour de l'insalubrité (etat.mjs, maladies) : chaque personne présente, avec la chance du niveau, attrape l'une des
// maladies du contenu qui portent un poids `insalubrite` (gastro-entérite 6, plaie infectée 3 — seulement un blessé —, gale 2,
// leptospirose 1), sauf celles qu'elle a déjà. survivants : [{ id, system }] ; defs : liste ou Map des afflictions ;
// -> [{ id, cle }]. Un niveau sans risque ne tire rien (le même hasard pour un abri propre).
export function tirerInsalubrite(survivants, defs, { niveau = 0, toilette = 0 } = {}, hasard = Math.random) {
  const p = risqueInsalubrite(niveau, toilette);
  if (!(p > 0)) return [];
  const toutes = (defs instanceof Map ? [...defs.values()] : Array.isArray(defs) ? defs : Object.values(defs ?? {})).filter(d => Number(d?.insalubrite) > 0);
  const nouvelles = [];
  for (const s of survivants ?? []) {
    if (!(hasard() < p)) continue;
    const possibles = toutes.filter(d => !(s.system?.afflictions ?? []).some(a => a.cle === d.cle) && (!d.siBlesse || Number(s.system?.blessures) >= 1));
    const def = tirerPoids(possibles.map(d => ({ ...d, poids: Number(d.insalubrite) })), hasard);
    if (def) nouvelles.push({ id: s.id, cle: def.cle });
  }
  return nouvelles;
}

// ------------------------------------------------------------------ le bouclier
// Décision de Jordan du 2026-11-17 : le bouclier pare 30 % des touches de face (tôle), 45 % (doublé et cerclé) ; une touche parée
// ne mord pas. Au d6 : chaque touche d'un Livide est parée sur un dé ≥ seuil (5 : 5-6, un tiers ; 4 : 4-6, la moitié).
// seuil : la `parade` du bouclier porté (0 : pas de bouclier, rien n'est tiré). -> { parees, passent, des }
export function parer(touches = 0, seuil = 0, hasard = Math.random) {
  const n = Math.max(0, Math.floor(Number(touches) || 0));
  const s = Math.floor(Number(seuil) || 0);
  if (!n || !(s >= 2 && s <= 6)) return { parees: 0, passent: n, des: [] };
  const des = lancer(n, hasard);
  const parees = des.filter(d => d >= s).length;
  return { parees, passent: n - parees, des };
}
// La parade d'un survivant : le meilleur seuil (le plus bas) des boucliers qu'il porte, 0 sans bouclier. equipements : définitions
// ou données d'objets ({ parade }).
export function paradeDe(equipements = []) {
  const seuils = (equipements ?? []).map(e => Math.floor(Number(e?.parade) || 0)).filter(x => x >= 2 && x <= 6);
  return seuils.length ? Math.min(...seuils) : 0;
}
