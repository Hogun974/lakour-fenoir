// Le temps de l'île (lot « fetes », 2026-11-13 ; famille 1 du complément de Fénoir 3D) : la lune, la clarté de la nuit, la brume
// et les nuages qui la cachent, ce que la nuit change dehors, les signes du paysage qui marquent l'année, la chaleur de l'été
// austral, et la date telle qu'on la lit dans la nature quand téléphones et radio sont morts. Logique pure, sans Foundry.
//
// Nombres retenus (docs/equilibre-fetes.md) :
// - Lune : âge (jours depuis la nouvelle lune) et part éclairée, par l'élongation Lune – Soleil (formules abrégées de Meeus,
//   chap. 25 et 47 : à quelques heures près), calculées vers minuit à La Réunion (20 h UTC) du jour de jeu. Elle se lève vers
//   6 h + âge × 24 / 29,53 et reste levée 12 h : un premier croissant s'est couché avant la nuit, une lune décroissante se lève
//   tard.
// - Clarté d'un quart de nuit (soir 18 h – 0 h, mesuré à 21 h ; nuit 0 h – 6 h, mesuré à 3 h), 0 à 3 : 0 « noire » (lune
//   couchée, nouvelle, ou cachée), 1 « sombre » (moins de 40 % éclairée), 2 « claire » (moins de 80 %), 3 « lumineuse ». Le jour
//   (matin, après-midi), pas de clarté (null).
// - Ciel couvert (la lune cachée) : par quart, par région ; chance selon la zone et la saison (CIEL), certaine sous la pluie forte,
//   la crue, le cyclone. Une nuit claire peut devenir noire en plein trajet.
// - La nuit dehors (NUIT) : nuit noire, −1 dé à tout test sauf la discrétion (+1), rencontres × 0,85, dangers (chute, ravine)
//   × 2 dans le tirage, fouille × 1,25 (personne d'autre ne sort : on trouve ce que les autres n'ont pas pris) ; pleine lumière,
//   vigilance +1, discrétion −1, rencontres × 1,2 (on y voit mieux, les Livides aussi).
// - Chaleur de l'été austral (CHALEUR) : de décembre à mars, dans les Bas (altitude < 400 m), l'après-midi dehors : −1 dé en
//   endurance.
// - Date lue : sans téléphone ni radio, la date exacte se perd ; on la lit dans la lune et le paysage : « début, mi- ou fin »
//   d'un mois, la phase de la lune, les signes du moment.
import { ALTITUDE_BAS, borner } from "./constantes.mjs";

const JOUR_MS = 86400000;
export const MOIS_SYNODIQUE = 29.530588853;
const rad = d => (d * Math.PI) / 180;
const angle = x => ((x % 360) + 360) % 360;

// Le jour julien (UTC) d'une date « AAAA-MM-JJ » à une heure UTC donnée ; null si illisible.
function julien(iso, heureUTC = 20) {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(iso ?? ""));
  if (!m) return null;
  return Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]), heureUTC) / JOUR_MS + 2440587.5;
}

// La lune d'un jour de jeu (vers minuit à La Réunion). -> { age (jours, 0 à 29,5), eclairee (0 à 1), phase (clé) } ou null.
export const PHASES_LUNE = ["nouvelle", "premier-croissant", "premier-quartier", "gibbeuse-croissante", "pleine", "gibbeuse-decroissante",
  "dernier-quartier", "dernier-croissant"];
export function lune(iso) {
  const jd = julien(iso);
  if (jd === null) return null;
  const T = (jd - 2451545) / 36525;
  const M = 357.5291 + 35999.0503 * T;
  const soleil = 280.4665 + 36000.7698 * T + 1.9146 * Math.sin(rad(M)) + 0.02 * Math.sin(rad(2 * M));
  const D = 297.8502 + 445267.1115 * T, Mp = 134.9634 + 477198.8676 * T, F = 93.2721 + 483202.0175 * T;
  const astre = 218.3165 + 481267.8813 * T + 6.289 * Math.sin(rad(Mp)) + 1.274 * Math.sin(rad(2 * D - Mp)) + 0.658 * Math.sin(rad(2 * D))
    + 0.214 * Math.sin(rad(2 * Mp)) - 0.186 * Math.sin(rad(M)) - 0.114 * Math.sin(rad(2 * F));
  const elongation = angle(astre - soleil);
  const age = (elongation / 360) * MOIS_SYNODIQUE;
  const eclairee = (1 - Math.cos(rad(elongation))) / 2;
  const phase = PHASES_LUNE[Math.floor((elongation / 360) * 8 + 0.5) % 8];
  return { age: Math.round(age * 10) / 10, eclairee: Math.round(eclairee * 100) / 100, phase };
}

// La lune est-elle levée au milieu de ce quart ? (soir : 21 h, nuit : 3 h ; le jour : on ne la compte pas)
export const HEURE_DU_QUART = { soir: 21, nuit: 3 };
export function luneLevee(l, moment) {
  const h = HEURE_DU_QUART[moment];
  if (h === undefined || !l) return false;
  const lever = (6 + (l.age * 24) / MOIS_SYNODIQUE) % 24;
  return ((h - lever + 24) % 24) < 12;
}

export const NIVEAUX_CLARTE = ["noire", "sombre", "claire", "lumineuse"];
export const estNuit = moment => moment === "soir" || moment === "nuit";
// Clarté (0 à 3) d'un quart, la lune et le ciel donnés ; null le jour.
export function clarte(l, moment, { couvert = false } = {}) {
  if (!estNuit(moment)) return null;
  if (couvert || !luneLevee(l, moment)) return 0;
  const e = Number(l?.eclairee) || 0;
  return e < 0.08 ? 0 : e < 0.4 ? 1 : e < 0.8 ? 2 : 3;
}

// Le ciel : chance qu'il soit couvert (brume, nuages) sur un quart de nuit, selon la zone et la saison. Pluie forte, crue, cyclone :
// couvert. Les Hauts, les cirques, le volcan et la forêt se couvrent le soir (la brume monte des ravines).
export const CIEL = {
  littoral: { pluies: 0.3, seche: 0.12 },
  hauts: { pluies: 0.55, seche: 0.35 },
  cirque: { pluies: 0.55, seche: 0.35 },
  volcan: { pluies: 0.5, seche: 0.3 },
  foret: { pluies: 0.6, seche: 0.4 },
  intemperies: ["fortes-pluies", "crue", "cyclone"]
};
export function chanceCouvert({ zone = "littoral", saison = "pluies", evenements = [] } = {}) {
  if ((evenements ?? []).some(e => CIEL.intemperies.includes(e))) return 1;
  const z = CIEL[zone] ?? CIEL.littoral;
  return z[saison] ?? z.pluies;
}

// Le ciel d'une nuit : deux tirages (le soir, la nuit), chacun couvert selon chanceCouvert. hasard : un flux propre au jour et à la
// région (le même ciel quelle que soit la façon d'avancer). -> { soir: Boolean, nuit: Boolean }
export function cielDeLaNuit(hasard, conditions = {}) {
  const p = chanceCouvert(conditions);
  const soir = hasard() < p, nuit = hasard() < p;
  return { soir, nuit };
}

// Ce que la nuit change dehors, par niveau de clarté (0 à 3).
export const NUIT = {
  rencontre: [0.85, 1, 1, 1.2],
  danger: [2, 1, 1, 1],
  butin: [1.25, 1, 1, 1],
  des: [{ tout: -1, discretion: 1 }, {}, {}, { vigilance: 1, discretion: -1 }]
};
// Les dés en plus ou en moins d'un test DEHORS à cette clarté (null : le jour, rien).
export function desDeNuit(competence, niveau) {
  if (niveau === null || niveau === undefined) return 0;
  const d = NUIT.des[borner(Number(niveau) || 0, 0, 3)] ?? {};
  return d[competence] ?? d.tout ?? 0;
}
export const facteurRencontreNuit = niveau => (niveau === null || niveau === undefined ? 1 : NUIT.rencontre[borner(Number(niveau) || 0, 0, 3)]);
export const facteurDangerNuit = niveau => (niveau === null || niveau === undefined ? 1 : NUIT.danger[borner(Number(niveau) || 0, 0, 3)]);
export const facteurButinNuit = niveau => (niveau === null || niveau === undefined ? 1 : NUIT.butin[borner(Number(niveau) || 0, 0, 3)]);

// La chaleur de l'été austral : décembre à mars, dans les Bas, l'après-midi.
export const CHALEUR = { mois: [12, 1, 2, 3], moment: "apres-midi", competence: "endurance", des: -1 };
export const chaleurPese = ({ mois, altitude = 0, moment = "" } = {}) => CHALEUR.mois.includes(Number(mois)) && Number(altitude) < ALTITUDE_BAS && moment === CHALEUR.moment;
export const desDeChaleur = (competence, conditions) => (competence === CHALEUR.competence && chaleurPese(conditions) ? CHALEUR.des : 0);

// Les signes du paysage, mois par mois (clés traduites par la couche Foundry : LAKOUR_SURVIE.Annee.Signes.<cle>). Les zones :
// « bas » (le littoral), « hauts » (tout le reste), vide = partout.
export const SIGNES = [
  { cle: "flamboyants", mois: [11, 12, 1] },
  { cle: "letchis", mois: [12, 1] },
  { cle: "mangues", mois: [11, 12, 1] },
  { cle: "longanis", mois: [1, 2, 3] },
  { cle: "chaleur", mois: [12, 1, 2, 3], zone: "bas" },
  { cle: "cyclones", mois: [1, 2, 3] },
  { cle: "goyaviers", mois: [4, 5, 6], zone: "hauts" },
  { cle: "brume-froide", mois: [6, 7, 8], zone: "hauts" },
  { cle: "canne-coupee", mois: [7, 8, 9, 10, 11] },
  { cle: "jacarandas", mois: [10, 11] }
];
export function signesDuMois(mois, { altitude = 0 } = {}) {
  const bas = Number(altitude) < ALTITUDE_BAS;
  return SIGNES.filter(s => s.mois.includes(Number(mois)) && (!s.zone || (s.zone === "bas") === bas)).map(s => s.cle);
}

// Le tiers du mois : début (1 à 10), mi- (11 à 20), fin (21 et après).
export const tiersDuMois = jourMois => (Number(jourMois) <= 10 ? "debut" : Number(jourMois) <= 20 ? "mi" : "fin");

// La date telle qu'on la sait : exacte tant que le téléphone ou une radio marchent ; sinon lue dans la nature.
// -> { exacte: true } | { exacte: false, tiers, mois, phase, signes }
export function dateSue({ mois, jourMois, iso, telephone = true, radio = false, altitude = 0 } = {}) {
  if (telephone || radio) return { exacte: true };
  return { exacte: false, tiers: tiersDuMois(jourMois), mois: Number(mois), phase: lune(iso)?.phase ?? "", signes: signesDuMois(mois, { altitude }) };
}
