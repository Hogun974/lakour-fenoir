// Percevoir dans le noir, le vent et la pluie (lot « sens », 2026-11-17 ; familles 4 et 11 du complément de Fénoir 3D, traduites pour
// un jeu de table : rien en temps réel, rien d'affiché à l'écran). Logique pure, sans Foundry. Chiffres et raisons :
// docs/equilibre-sens.md ; contrat §18.
//
// - La pluie par région (microclimats) : chaque quart, il pleut avec une chance tirée des mm d'une année de la région (Bas et Hauts,
//   `climat.pluieAn` du contenu ; à défaut, d'après `climat.pluie`), 30 % par quart en saison des pluies et 10 % en saison sèche pour
//   1 500 mm, × (mm / 1 500)^0,8, entre 2 % et 90 %. Le temps vient de la mer pour tous : 65 % du tirage est commun à l'île.
//   Une intempérie en cours dans la région (fortes pluies, crue, éboulement, cyclone) : il pleut.
// - Les ravines : l'eau de leurs Hauts est la pluie des 8 derniers quarts, chacun moitié moins que le suivant. Une ravine
//   temporaire (`site.ravine: "temporaire"`) ne coule que si cette eau passe 0,15 ; une permanente baisse en saison sèche après
//   deux jours sans pluie là-haut (étiage). En crue (intempérie en cours) : la pico-hydro s'arrête, les radiers sont sous l'eau.
// - La brume : au-dessus de 1 000 m, l'après-midi et le soir (de 13 h à 20 h dans le 3D).
// - Le vent : un par quart pour toute l'île, autour des alizés (il souffle vers l'ouest-nord-ouest, ± 50°), plus fort en saison
//   sèche, plus faible le soir et la nuit. Il dit de quel côté l'abri « sent ».
// - L'odeur de l'abri (0 à 4) : ce qui sent au-delà d'un groupe ordinaire (cuisine commune, fumoir, élevage, souillure, sang),
//   moins dans les Hauts (l'air froid porte peu) et sous la pluie. Elle pèse sur les menaces de Livides et de hordes ; celle des
//   bêtes (chiens errants) compte aussi les morts laissés sans repos : les Livides ignorent l'odeur d'un corps.
// - S'habituer au noir : chaque nuit passée debout, dehors ou de garde, sans lumière, compte ; paliers après 2, 6, 14 et 30 nuits.
//   Allumer fait perdre un palier pour le reste de la nuit, et la nuit ne compte pas.
// - La Timise, les grenouilles qui se taisent, les corps qui se défont, la rue nettoyée qui se repeuple, la musique.
import { ALTITUDE_BAS, MOMENTS, QUARTS_PAR_JOUR, borner } from "./constantes.mjs";
import { deriverHasard } from "./hasard.mjs";
import { regionDe, indexer, liste } from "./contenu.mjs";
import { saisonDuJour } from "./temps.mjs";
import { desDeNuit } from "./lune.mjs";
import { message } from "./textes.mjs";

export const REGLES_SENS = {
  pluie: { reference: 1500, chance: { pluies: 0.3, seche: 0.1 }, exposant: 0.8, min: 0.02, max: 0.9, commun: 0.65, hautsDes: 1200,
    intemperies: ["fortes-pluies", "crue", "eboulement", "cyclone"],
    // Sans `climat.pluieAn` : les mm d'une année d'après climat.pluie (0 à 3), Bas et Hauts.
    parNiveau: [[500, 1200], [800, 2000], [1700, 3000], [3500, 6000]] },
  ravine: { quarts: 8, coule: 0.15, etiage: 0.05, facteurs: { "a-sec": { hydro: 0, eau: 0.25 }, basse: { hydro: 0.75, eau: 1 }, coule: { hydro: 1, eau: 1 }, "en-crue": { hydro: 0, eau: 1 } } },
  brume: { altitude: 1000, moments: ["apres-midi", "soir"] },
  // Le vent : cap où il va (degrés, 0 = nord, 90 = est) ; alizés vers l'ouest-nord-ouest.
  vent: { cap: 292.5, ecart: 50, force: { seche: [0.25, 0.55], pluies: [0.05, 0.4] }, nuit: 0.6, calme: 0.15, brise: 0.35 },
  odeur: { installationsMax: 2, max: 4, morts: 15, menace: { livides: 0.01, horde: 0.02, animaux: 0.005 } },
  noir: { paliers: [2, 6, 14, 30], lumiere: 2 },
  timise: { zones: { littoral: 0.01, hauts: 0.03, cirque: 0.035, foret: 0.03, volcan: 0.02 }, depuis: 60, parMois: 0.5, plafond: 3 },
  corps: { bas: { frais: 20, desseche: 60 }, hauts: { frais: 45, desseche: Infinity }, vitesse: { frais: 1, desseche: 0.8, lambeaux: 0.55 }, releve: 10 },
  nettoyage: { tues: 20, repeuple: 0.07, effet: 0.75, oubli: 0.5 },
  musique: { airs: { doux: 1, fort: 3 }, moral: 1, tousLes: 7 }
};

// Ce qu'on perçoit, et à quelle distance (mètres ; pour le MJ : table du journal « Percevoir dans le noir »).
export const PORTEES = {
  bruit: [10, 30, 90, 270],                                 // un bruit de palier 1, 2, 3, 4
  voix: { chuchoter: 3, parler: 20, crier: 60, livide: 90 }, // un Livide entend un cri à 90 m
  lumiere: { torche: 150, feu: 400 },                       // la nuit
  silhouette: { noir: 3, jour: 70 }, pleineLune: 0.18,       // une silhouette debout ; la pleine lune donne 18 % du jour
  odeurs: { vivant: 6, sang: 25, souillure: 30, cadavre: 60, cuisine: 80, feu: 120 },
  couvre: { pluie: 0.4, mur: 0.5, crete: 1 / 3 },            // ce qui reste d'un bruit
  vent: { sous: 2, au: 0.2 }, hauts: 0.35, pluieOdeur: 0.4   // l'odeur
};

const n0 = v => (Number.isFinite(Number(v)) ? Number(v) : 0);

// ------------------------------------------------------------------ la pluie
// Les mm d'une année d'une région ; hauts : ceux de ses Hauts (au-dessus de 1 200 m). Sinon, selon l'altitude de la région.
export function pluieAnnuelle(region, { hauts = false } = {}) {
  const P = REGLES_SENS.pluie;
  const an = region?.climat?.pluieAn;
  const [bas, haut] = an && Number(an.bas) > 0 ? [Number(an.bas), Number(an.hauts) || Number(an.bas)]
    : P.parNiveau[borner(Math.round(n0(region?.climat?.pluie ?? 1)), 0, 3)];
  if (hauts) return haut;
  const t = borner(n0(region?.altitude) / P.hautsDes, 0, 1);
  return Math.round(bas + (haut - bas) * t);
}
// La chance qu'il pleuve sur un quart.
export function chanceDePluie(mm, saison = "pluies") {
  const P = REGLES_SENS.pluie;
  const base = P.chance[saison] ?? P.chance.pluies;
  return borner(base * Math.pow(Math.max(0, n0(mm)) / P.reference, P.exposant), P.min, P.max);
}
// Les intempéries en cours dans une région un jour donné (événements du monde réel).
export function intemperiesDuJour(monde, region, jour) {
  const evts = monde?.regions?.[region]?.evenements ?? [];
  return evts.some(e => REGLES_SENS.pluie.intemperies.includes(e.cle) && n0(e.depuis) <= jour && (e.jusqua === null || e.jusqua === undefined || n0(e.jusqua) >= jour));
}

// Le tirage d'un quart dans une région (0 à 1) : commun à l'île dans 65 % des cas. Mis en cache (graine, quart, région).
const CACHE = new Map();
const CACHE_MAX = 20000;
function tirageDuQuart(graine, quart, region) {
  const k = `${graine}|${quart}|${region}`;
  if (CACHE.has(k)) return CACHE.get(k);
  const local = deriverHasard(graine, "pluie", quart, region);
  const u = local() < REGLES_SENS.pluie.commun ? deriverHasard(graine, "pluie", quart)() : local();
  if (CACHE.size >= CACHE_MAX) CACHE.clear();
  CACHE.set(k, u);
  return u;
}

// Pleut-il sur ce quart dans cette région ? { graine, quart, region (clé), contenu, dateDepart, monde (facultatif : intempéries),
// hauts (dans les Hauts de la région) } -> Boolean
export function pleutAuQuart({ graine, quart, region, contenu, dateDepart, monde = null, hauts = false } = {}) {
  if (!graine || !region) return false;
  const q = Math.max(0, Math.floor(n0(quart)));
  const jour = Math.floor(q / QUARTS_PAR_JOUR);
  if (monde && intemperiesDuJour(monde, region, jour)) return true;
  const reg = regionDe(contenu, region);
  const chance = chanceDePluie(pluieAnnuelle(reg, { hauts }), saisonDuJour(jour, dateDepart));
  return tirageDuQuart(graine, q, region) < chance;
}
// La part d'un jour où il pleut (0, 0,25… 1).
export function pluieDuJour({ jour, ...reste } = {}) {
  const q0 = Math.max(0, Math.floor(n0(jour))) * QUARTS_PAR_JOUR;
  let n = 0;
  for (let k = 0; k < QUARTS_PAR_JOUR; k++) if (pleutAuQuart({ ...reste, quart: q0 + k })) n++;
  return n / QUARTS_PAR_JOUR;
}

// ------------------------------------------------------------------ les ravines
// L'eau des Hauts d'une région au début d'un quart : la pluie des 8 quarts d'avant, chacun moitié moins que le suivant (0 à 1).
export function eauDesHauts({ quart, ...reste } = {}) {
  const R = REGLES_SENS.ravine;
  let eau = 0, total = 0;
  for (let k = 1; k <= R.quarts; k++) {
    const w = Math.pow(0.5, k - 1);
    total += w;
    if (n0(quart) - k >= 0 && pleutAuQuart({ ...reste, quart: n0(quart) - k, hauts: true })) eau += w;
  }
  return total ? Math.round((eau / total) * 1000) / 1000 : 0;
}
export const ETATS_RAVINE = ["a-sec", "basse", "coule", "en-crue"];
// L'état d'une ravine : { ravine: "permanente" | "temporaire", eau (des Hauts), crue: Boolean, saison }.
export function etatRavine({ ravine = "permanente", eau = 0, crue = false, saison = "pluies" } = {}) {
  const R = REGLES_SENS.ravine;
  if (crue) return "en-crue";
  if (ravine === "temporaire") return n0(eau) > R.coule ? "coule" : "a-sec";
  return saison === "seche" && n0(eau) < R.etiage ? "basse" : "coule";
}
// La ravine d'un site sur un jour : l'état de chaque quart, et ce qu'elle donne en moyenne (facteurs de la pico-hydro et de l'eau du
// site). { graine, jour, region, ravine, contenu, dateDepart, monde } -> { etats: [4], etat (le pire du jour… le plus fréquent),
// hydro, eau }
export function ravineDuJour({ jour, ravine = "permanente", ...reste } = {}) {
  const R = REGLES_SENS.ravine;
  const j = Math.max(0, Math.floor(n0(jour)));
  const crue = reste.monde ? intemperiesDuJour(reste.monde, reste.region, j) : false;
  const saison = saisonDuJour(j, reste.dateDepart);
  const etats = [];
  for (let k = 0; k < QUARTS_PAR_JOUR; k++) {
    const quart = j * QUARTS_PAR_JOUR + k;
    etats.push(etatRavine({ ravine, crue, saison, eau: crue ? 1 : eauDesHauts({ ...reste, quart }) }));
  }
  const moyenne = cle => Math.round(etats.reduce((s, e) => s + R.facteurs[e][cle], 0) / etats.length * 100) / 100;
  const compte = new Map();
  for (const e of etats) compte.set(e, (compte.get(e) ?? 0) + 1);
  const etat = crue ? "en-crue" : [...compte.entries()].sort((a, b) => b[1] - a[1] || ETATS_RAVINE.indexOf(a[0]) - ETATS_RAVINE.indexOf(b[0]))[0][0];
  return { etats, etat, hydro: moyenne("hydro"), eau: moyenne("eau"), ravine };
}

// ------------------------------------------------------------------ la brume
export function brumeAuQuart({ altitude = 0, moment = "" } = {}) {
  return n0(altitude) >= REGLES_SENS.brume.altitude && REGLES_SENS.brume.moments.includes(moment);
}

// ------------------------------------------------------------------ le vent
export const DIRECTIONS_VENT = ["nord", "nord-est", "est", "sud-est", "sud", "sud-ouest", "ouest", "nord-ouest"];
const directionDe = cap => DIRECTIONS_VENT[Math.round((((cap % 360) + 360) % 360) / 45) % 8];
// Le vent d'un quart (toute l'île) : { cap (où il va, degrés), vers (direction où il porte), de (d'où il vient), force 0..1,
// mot: "calme" | "brise" | "vent" }.
export function ventDuQuart({ graine, quart, dateDepart } = {}) {
  const V = REGLES_SENS.vent;
  const q = Math.max(0, Math.floor(n0(quart)));
  const h = deriverHasard(String(graine ?? ""), "vent", q);
  const cap = Math.round(((V.cap + (h() * 2 - 1) * V.ecart) % 360 + 360) % 360);
  const saison = saisonDuJour(Math.floor(q / QUARTS_PAR_JOUR), dateDepart);
  const [a, b] = V.force[saison] ?? V.force.pluies;
  const moment = MOMENTS[q % QUARTS_PAR_JOUR];
  const force = Math.round((a + (b - a) * h()) * (moment === "soir" || moment === "nuit" ? V.nuit : 1) * 100) / 100;
  return { cap, vers: directionDe(cap), de: directionDe(cap + 180), force, mot: force < V.calme ? "calme" : force < V.brise ? "brise" : "vent" };
}

// ------------------------------------------------------------------ l'odeur de l'abri
// { installations (somme des effets.odeur des installations en marche), souillure (0..3 ; défaut : 0), sang: Boolean, morts (corps
// sans repos près de l'abri), altitude, pluie (part du jour) } -> { odeur (0..4, ce que sentent les Livides), betes (0..4, ce que
// sentent les bêtes : avec les morts), sources: [cle], attenuee: [cle] }
export function odeurAbri({ installations = 0, souillure = 0, sang = false, morts = 0, altitude = 0, pluie = 0 } = {}) {
  const O = REGLES_SENS.odeur;
  const sources = [];
  const inst = borner(Math.round(n0(installations)), 0, O.installationsMax);
  if (inst > 0) sources.push("installations");
  const souille = n0(souillure) > 0 ? 1 : 0;
  if (souille) sources.push("souillure");
  const saigne = sang ? 1 : 0;
  if (saigne) sources.push("sang");
  const attenuee = [];
  let moins = 0;
  if (n0(altitude) >= ALTITUDE_BAS) { moins++; attenuee.push("hauts"); }
  if (n0(pluie) >= 0.5) { moins++; attenuee.push("pluie"); }
  const brut = inst + souille + saigne;
  const corps = n0(morts) > 0 ? 1 : 0;
  if (corps) sources.push("morts");
  return { odeur: borner(brut - moins, 0, O.max), betes: borner(brut + corps - moins, 0, O.max), sources, attenuee };
}
// Les morts du groupe laissés sans repos près de l'abri depuis moins de 15 jours (le corps retrouvé, pas encore honoré).
export function mortsSansRepos(etat, region, jour) {
  return (etat?.morts ?? []).filter(m => m && m.region === region && m.retrouve && !m.repos && !m.livide
    && n0(jour) - Math.floor(n0(m.quart) / QUARTS_PAR_JOUR) <= REGLES_SENS.odeur.morts).length;
}

// ------------------------------------------------------------------ s'habituer au noir
// system.noir d'un survivant : { nuits, nuitLe (jour de la dernière nuit comptée), lumiereLe (quart où il a allumé) }.
export function noirDe(system) {
  const x = system?.noir && typeof system.noir === "object" ? system.noir : {};
  return { nuits: Math.max(0, Math.floor(n0(x.nuits))), nuitLe: Number.isFinite(Number(x.nuitLe)) && x.nuitLe !== null ? Number(x.nuitLe) : null,
    lumiereLe: Number.isFinite(Number(x.lumiereLe)) && x.lumiereLe !== null ? Number(x.lumiereLe) : null };
}
export const palierNoir = nuits => REGLES_SENS.noir.paliers.filter(p => n0(nuits) >= p).length;
// Le palier qui compte à ce quart : un de moins si l'on a allumé depuis moins de 2 quarts.
export function palierNoirEffectif(system, quart) {
  const n = noirDe(system);
  const ebloui = n.lumiereLe !== null && n0(quart) - n.lumiereLe >= 0 && n0(quart) - n.lumiereLe < REGLES_SENS.noir.lumiere;
  return Math.max(0, palierNoir(n.nuits) - (ebloui ? 1 : 0));
}
// Une nuit debout dans le noir (le quart de nuit) : elle compte une fois par nuit, sauf si l'on a de la lumière (ou si l'on a
// allumé cette nuit). -> { system, compte: Boolean, avant, palier }
export function compterNuitNoire(system, { quart = 0, lumiere = false } = {}) {
  const n = noirDe(system);
  const jour = Math.floor(n0(quart) / QUARTS_PAR_JOUR);
  const avant = palierNoir(n.nuits);
  const allume = n.lumiereLe !== null && n0(quart) - n.lumiereLe >= 0 && n0(quart) - n.lumiereLe < REGLES_SENS.noir.lumiere;
  if (lumiere || allume || n.nuitLe === jour) return { system, compte: false, avant, palier: avant };
  const noir = { ...n, nuits: n.nuits + 1, nuitLe: jour };
  return { system: { ...system, noir }, compte: true, avant, palier: palierNoir(noir.nuits) };
}
// Le texte du journal quand un survivant passe un palier (clés noir-palier-1 à 4 ; repli français).
const TEXTES_NOIR = [
  "{nom} commence à savoir d'où vient un bruit dans le noir. Le cri de la Timise ne l'abuse plus.",
  "{nom} juge maintenant la distance d'un bruit dans le noir : proche, à mi-portée, loin.",
  "{nom} reconnaît ce qui marche dans le noir : un vivant, un Livide, une horde.",
  "{nom} dessine les murs et les vides en claquant la langue ou en frappant du bâton : l'écoute active."
];
export const texteNoir = (palier, nom) => {
  const p = borner(Math.round(n0(palier)), 1, 4);
  return message(`noir-palier-${p}`, { nom }, TEXTES_NOIR[p - 1].replace("{nom}", nom));
};
// Allumer (torche, lampe, feu) : l'habitude se perd un moment.
export const allumerDansLeNoir = (system, quart) => ({ ...system, noir: { ...noirDe(system), lumiereLe: Math.max(0, Math.floor(n0(quart))) } });

// Les dés de l'écoute dans le noir, en plus de ceux de la nuit (lune.mjs, desDeNuit), pour un test DEHORS.
// ecoute : "" | "yeux-fermes" (+1 dé à la vigilance, mais rien d'autre n'est possible) | "active" (palier 4, la nuit : +1 dé, du bruit).
// Le palier 2 donne +1 dé à la vigilance de nuit ; la nuit et l'habitude ensemble ne dépassent jamais +1.
// -> { des, bruit, immobile }
export function desDuNoir(competence, { clarte = null, palier = 0, ecoute = "" } = {}) {
  if (competence !== "vigilance") return { des: 0, bruit: 0, immobile: false };
  const nuit = clarte !== null && clarte !== undefined;
  let des = 0, bruit = 0;
  if (nuit) {
    const base = desDeNuit(competence, clarte);
    des += Math.max(0, Math.min(1, base + (palier >= 2 ? 1 : 0)) - base);
    if (ecoute === "active" && palier >= 4) { des += 1; bruit = 1; }
  }
  if (ecoute === "yeux-fermes") des += 1;
  return { des, bruit, immobile: ecoute === "yeux-fermes" };
}
// La pluie et la brume dehors : on entend et voit mal (vigilance −1), on passe mieux inaperçu (discrétion +1).
export function desDuTemps(competence, { pluie = false, brume = false } = {}) {
  if (!pluie && !brume) return 0;
  return competence === "vigilance" ? -1 : competence === "discretion" ? 1 : 0;
}

// ------------------------------------------------------------------ approcher un Livide
// Les dés de discrétion d'un survivant qui approche (ou fuit) un Livide de cette sorte (bestiaire, champ `perception` : { vue,
// ouie, odorat, froid }). { nuit, vent: "vers-lui" | "vers-moi" | "", bruit: Boolean (sol qui craque, pas pressés), altitude }.
export function desFaceALivide(perception = {}, { nuit = false, vent = "", bruit = false, altitude = 0 } = {}) {
  const p = { vue: 0.6, ouie: 1, odorat: 1, ...(perception ?? {}) };
  if (p.froid && nuit && n0(altitude) >= ALTITUDE_BAS) return 2;   // figé par le froid de la nuit : on passe entre eux
  let d = 0;
  if (n0(p.vue) <= 0) d += bruit ? -1 : 1;                         // aveugle : il n'a que l'oreille
  else if (n0(p.vue) < 0.5 && !nuit) d += 1;                       // il voit mal
  else if (n0(p.vue) >= 1) d -= 1;                                 // il voit comme un vivant
  if (n0(p.ouie) > 1 && bruit) d -= 1;
  if (n0(p.odorat) > 0 && vent === "vers-lui") d -= 1;             // le vent lui porte votre odeur
  if (n0(p.odorat) > 0 && vent === "vers-moi") d += 1;
  return borner(d, -2, 2);
}

// Les cinq états d'un Livide (pour le MJ : journal « Percevoir dans le noir »).
export const ETATS_EVEIL = ["fige", "errant", "intrigue", "poursuite", "acharne"];

// ------------------------------------------------------------------ la Timise
// La chance d'entendre la Timise une nuit : selon la zone, et de plus en plus quand l'île éteinte rend la nuit aux pétrels.
export function chanceTimise({ zone = "littoral", jour = 0 } = {}) {
  const T = REGLES_SENS.timise;
  const mois = Math.max(0, n0(jour) - T.depuis) / 30;
  return (T.zones[zone] ?? T.zones.littoral) * Math.min(T.plafond, 1 + T.parMois * mois);
}

// ------------------------------------------------------------------ les corps
// L'état des Livides d'une région un jour donné (la plupart se sont relevés autour du jour 10) : { etat: "frais" | "desseche" |
// "lambeaux", vitesse }.
export function corpsDesLivides({ jour = 0, altitude = 0 } = {}) {
  const C = REGLES_SENS.corps;
  const age = Math.max(0, n0(jour) - C.releve);
  const z = n0(altitude) < ALTITUDE_BAS ? C.bas : C.hauts;
  const etat = age <= z.frais ? "frais" : age <= z.desseche ? "desseche" : "lambeaux";
  return { etat, vitesse: C.vitesse[etat] };
}

// ------------------------------------------------------------------ une rue nettoyée se repeuple
// etat.nettoyes : [{ region, site (clé ou ""), jour, tues }]. Ce qui reste de l'effet d'un nettoyage, en « Livides tenus à l'écart ».
const tenus = (x, jour) => n0(x.tues) * Math.pow(1 - REGLES_SENS.nettoyage.repeuple, Math.max(0, n0(jour) - n0(x.jour)));
// Le facteur des rencontres d'une fouille à cet endroit (1 : rien n'a été nettoyé ; 0,25 au mieux, juste après vingt Livides tués).
export function facteurNettoyage(nettoyes = [], { region, site = "", jour = 0 } = {}) {
  const N = REGLES_SENS.nettoyage;
  const ici = (nettoyes ?? []).filter(x => x && x.region === region && (x.site || "") === (site || ""));
  const total = ici.reduce((s, x) => s + tenus(x, jour), 0);
  return Math.round((1 - N.effet * Math.min(1, total / N.tues)) * 100) / 100;
}
export function nettoyerLieu(nettoyes = [], { region, site = "", jour = 0, tues = 0 } = {}) {
  const N = REGLES_SENS.nettoyage;
  const garde = (nettoyes ?? []).filter(x => x && tenus(x, jour) >= N.oubli);
  return n0(tues) > 0 ? [...garde, { region, site: site || "", jour: n0(jour), tues: Math.floor(n0(tues)) }] : garde;
}

// ------------------------------------------------------------------ la musique
// L'ancrage « instrument » (contenu : ancrage.bruit) d'un pratiquant présent : il joue chaque soir, tout bas ; le bruit de l'abri
// en tient compte (le plus fort des musiciens, pas la somme). systemes : ceux des présents.
export function bruitDesMusiciens(systemes = [], contenu = {}) {
  const ancrages = indexer(contenu).ancrages;
  let b = 0;
  for (const s of systemes ?? []) {
    if (!s?.regard || !s.pratique || !s.ancrage) continue;
    b = Math.max(b, n0(ancrages.get(s.ancrage)?.bruit));
  }
  return b;
}
// Une veillée en musique : { air: "doux" | "fort", jour, derniere (jour de la dernière veillée qui a remonté le moral) }
// -> { bruit, moral (0 ou 1), musiqueLe }
export function veilleeMusique({ air = "doux", jour = 0, derniere = null } = {}) {
  const M = REGLES_SENS.musique;
  const bruit = M.airs[air] ?? M.airs.doux;
  const peut = derniere === null || derniere === undefined || n0(jour) - n0(derniere) >= M.tousLes;
  return { bruit, moral: peut ? M.moral : 0, musiqueLe: peut ? n0(jour) : derniere };
}

// La voix d'une région (pour l'ambiance : ce qu'on entend quand il n'y a rien), et le moment musical du jour, pour le narrateur.
export const VOIX_DES_ZONES = { littoral: "ressac", hauts: "tamarins", cirque: "remparts", volcan: "grondement", foret: "fanjans" };
export const voixDeLaRegion = region => VOIX_DES_ZONES[region?.zone] ?? VOIX_DES_ZONES.littoral;
// { moment, lune (phase), jour, reposLe (jour d'un repos donné), mortLe (jour d'une mort), autonomeDepuis (jour où l'abri est devenu
//   autonome), fete (clé de fête du jour), marche (jour de marché), assaut: Boolean, recolte: Boolean } -> clé ou ""
export function momentMusical({ moment = "", lune = "", jour = 0, mois = 0, jourMois = 0, reposLe = null, mortLe = null, autonomeLe = null, fete = "", marche = false, assaut = false, recolte = false } = {}) {
  if (assaut) return "rouler";
  const soir = moment === "soir" || moment === "nuit";
  if (reposLe !== null && n0(reposLe) === n0(jour)) return "maloya";
  if (n0(mois) === 12 && n0(jourMois) === 20) return "maloya";
  if (soir && autonomeLe !== null && n0(autonomeLe) === n0(jour)) return "maloya";
  if (soir && mortLe !== null && n0(jour) - n0(mortLe) <= 1) return "guitare-grave";
  if (fete || marche) return "sega";
  if (soir && recolte) return "guitare-vive";
  if (soir && lune === "nouvelle") return "silence";
  return "";
}

// Le bestiaire du contenu (registre, famille « bestiaire ») : la perception d'une sorte.
export const perceptionDe = (contenu, cle) => liste(contenu?.bestiaire).find(b => b.cle === cle)?.perception ?? null;
