// Les ressources du groupe (contrat §1.6) : consommation, pertes, stockage, jours de stocks. Logique pure, stocks entiers.
//
// Nombres retenus :
// - Consommation par personne et par jour : 1 nourriture ; 1 eau, 1,5 dans les Bas (altitude < 400 m) en saison des pluies
//   (total arrondi au supérieur : 4 personnes dans les Bas en été boivent 6).
// - Pertes : sans conservation (réserve étanche, séchoir, chambre froide), 5 % de la nourriture se gâte chaque jour, arrondi
//   à l'entier supérieur dès qu'il y en a (20 → 1, 21 → 2).
// - Stockage de base d'un abri sans aménagement (bidons, baignoire, placards) : eau 40, nourriture 100, carburant 20,
//   médicaments 30, munitions 60, matériaux 60, pièces 30, graines 40, plantes médicinales 12 (elles se fanent : on n'en
//   garde qu'une douzaine de brassées à sécher), énergie 0 (il faut des batteries pour garder des kWh).
//   Les installations ajoutent leur `stockage` à ces plafonds ; au-delà, l'excédent est perdu.
//   Lot « savoirs » : gaz 26 (deux bouteilles de 13 kg sous l'évier), boutures 30 (des seaux et des sacs mouillés), biocarburant
//   10 (quelques bidons).
import { RESSOURCES, ALTITUDE_BAS, JOURS_INFINIS } from "./constantes.mjs";

export const CONSOMMATION = { eau: 1, eauBasEte: 1.5, nourriture: 1 };
export const TAUX_PERTES = 0.05;
export const STOCKAGE_BASE = { eau: 40, nourriture: 100, carburant: 20, medicaments: 30, munitions: 60, materiaux: 60, pieces: 30, graines: 40, plantes: 12, energie: 0,
  gaz: 26, boutures: 30, biocarburant: 10 };

export const stocksVides = () => Object.fromEntries(RESSOURCES.map(r => [r, 0]));

export function normaliserStocks(stocks = {}) {
  return Object.fromEntries(RESSOURCES.map(r => [r, Math.max(0, Math.floor(Number(stocks?.[r]) || 0))]));
}

export function ajouterStocks(a = {}, b = {}) {
  const s = normaliserStocks(a);
  for (const [r, q] of Object.entries(b ?? {})) if (r in s) s[r] = Math.max(0, s[r] + Math.floor(Number(q) || 0));
  return s;
}

// Retire ce qui est demandé ; -> { stocks, manque: { ressource: n } } (le manque n'est jamais retiré en négatif).
export function retirerStocks(a = {}, b = {}) {
  const s = normaliserStocks(a), manque = {};
  for (const [r, q] of Object.entries(b ?? {})) {
    if (!(r in s)) continue;
    const n = Math.max(0, Math.ceil(Number(q) || 0));
    const pris = Math.min(s[r], n);
    s[r] -= pris;
    if (n > pris) manque[r] = n - pris;
  }
  return { stocks: s, manque };
}

export const couvre = (stocks, cout) => Object.entries(cout ?? {}).every(([r, q]) => r === "travail" || (Number(stocks?.[r]) || 0) >= (Number(q) || 0));

// Consommation d'un jour -> { eau, nourriture } (entiers).
// altitude : de la région de l'abri ; saison : "pluies" | "seche" ; rations : { eau, nourriture } = somme des besoins des
// personnes (un gros mangeur compte 1,5, un sobre 0,75 : traits, §10.1) ; défaut : 1 par personne.
export function consommationJour({ personnes = 0, altitude = 0, saison = "seche", rations = null } = {}) {
  const n = Math.max(0, Number(personnes) || 0);
  const eauParPersonne = Number(altitude) < ALTITUDE_BAS && saison === "pluies" ? CONSOMMATION.eauBasEte : CONSOMMATION.eau;
  const re = Number(rations?.eau ?? n), rn = Number(rations?.nourriture ?? n);
  return { eau: Math.ceil(Math.round(re * eauParPersonne * 100) / 100), nourriture: Math.ceil(Math.round(rn * CONSOMMATION.nourriture * 100) / 100) };
}

// Nourriture gâtée en un jour.
export function pertesJour(nourriture, conservation = false) {
  const n = Math.max(0, Number(nourriture) || 0);
  if (conservation || n <= 0) return 0;
  return Math.ceil(n * TAUX_PERTES);
}

// Plafonds de stockage : base + ajouts des installations.
export function plafonds(ajouts = {}) {
  const p = { ...STOCKAGE_BASE };
  for (const [r, q] of Object.entries(ajouts ?? {})) if (r in p) p[r] += Math.max(0, Number(q) || 0);
  return p;
}

// Ramène chaque stock sous son plafond ; -> { stocks, perdus: { ressource: n } }.
export function plafonner(stocks, plafond) {
  const s = normaliserStocks(stocks), perdus = {};
  for (const r of RESSOURCES) {
    const max = Math.floor(plafond?.[r] ?? Infinity);
    if (s[r] > max) { perdus[r] = s[r] - max; s[r] = max; }
  }
  return { stocks: s, perdus };
}

// Jours avant épuisement de l'eau et de la nourriture, au rythme du bilan net (production − consommation − pertes).
// netParJour : { eau, nourriture } (négatif = on puise). Rien ne baisse : JOURS_INFINIS.
export function joursDeStocks(stocks = {}, netParJour = {}) {
  const sortie = {};
  for (const r of ["eau", "nourriture"]) {
    const net = Number(netParJour?.[r]) || 0;
    const q = Math.max(0, Number(stocks?.[r]) || 0);
    sortie[r] = net >= 0 ? (q > 0 || net > 0 ? JOURS_INFINIS : 0) : Math.min(JOURS_INFINIS, Math.floor(q / -net));
  }
  return sortie;
}

// La journée des stocks : production ajoutée, consommation retirée, pertes, plafonds.
// -> { stocks, manque: { eau, nourriture }, pertes, perdus }
export function journeeStocks(stocks, { production = {}, consommation = {}, conservation = false, plafond = null } = {}) {
  let s = ajouterStocks(stocks, production);
  const r = retirerStocks(s, consommation);
  s = r.stocks;
  const pertes = pertesJour(s.nourriture, conservation);
  s.nourriture -= pertes;
  const p = plafonner(s, plafond ?? plafonds());
  return { stocks: p.stocks, manque: r.manque, pertes, perdus: p.perdus };
}
