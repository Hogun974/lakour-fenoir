// Les fêtes du métissage au camp (lot « fetes », 2026-11-13 ; famille 1 du complément de Fénoir 3D) : chaque fête a un GAIN et un
// COÛT, jamais magiques (elles agissent par le moral, le bruit, la lumière, les stocks, l'hygiène, le sang-froid et les liens entre
// abris), et aller aux fêtes des autres communautés tisse des liens. Logique pure ; les effets eux-mêmes sont du CONTENU
// (lakour-fenoir, scripts/fetes.js : `effet` de chaque fête), normalisés ici. feter (etat.mjs) les applique.
//
// Forme d'un effet (tous les champs facultatifs ; docs/equilibre-fetes.md pour les chiffres de Fénoir) :
//   { moral (tout de suite, à chaque vivant du groupe), rations (nourriture par personne, PNJ compris), cout ({ ressource: n }),
//     gain ({ ressource: n }), bruit (à l'abri), quarts (ce que la fête prend de temps),
//     soutien: { moral, jours } (souvenir : plafond du moral), lueur: { visibilite, jours } (l'abri se voit plus),
//     hygiene: { jours } (risque des maladies × 0,5), sangFroid: { des, jours } (défense contre une horde),
//     liens (avec la faction ou la communauté nommée : `avec`), renom (réputation de l'abri), refugies (des réfugiés viendront : au MJ),
//     attache (les recrues présentes, ou celles de `pour`, deviennent compagnons), voeu: { moral, fatigue } (ceux de `pour`, ou tous :
//     carême, puis un soutien tant que le vœu tient), repos (Toussaint : le repos à tous les morts retrouvés), fatigue (±, à chacun),
//     avecGain ({ ressource: n } de plus si la fête se fait avec un autre abri : `avec`),
//     options: { cle: { ...effet } } (un choix : la fête de la musique, en musique ou en silence ; la première par défaut) }
import { message } from "./textes.mjs";
import { borner } from "./constantes.mjs";

// L'effet d'avant le lot (contrat §9) : +1 de moral, une ration de plus par personne, du bruit.
export const EFFET_DEFAUT = { moral: 1, rations: 1, bruit: 2 };
export const LIENS_MAX = 5;
export const PARTICIPATION = { moral: 1, liens: 1, quarts: 2 };
export const COMMUNAUTES = ["tous", "cafres", "yabs", "zoreils", "malbars", "zarabes", "chinois", "malgaches", "comoriens"];

// L'effet d'une fête du registre, avec l'option choisie (la première si aucune). -> { effet, option }
export function effetDeFete(fete = null, option = "") {
  const base = fete?.effet && typeof fete.effet === "object" ? fete.effet : EFFET_DEFAUT;
  const { options, ...commun } = base;
  const cles = Object.keys(options ?? {});
  if (!cles.length) return { effet: { ...commun }, option: "" };
  const choisie = cles.includes(option) ? option : cles[0];
  return { effet: { ...commun, ...options[choisie] }, option: choisie };
}
export const optionsDeFete = fete => Object.keys(fete?.effet?.options ?? {});

// Ce qu'il faut dans les stocks pour fêter : rations × personnes + coût fixe. -> { ressource: n }
export function coutDeFete(effet = {}, personnes = 0) {
  const c = {};
  const rations = Math.max(0, Number(effet.rations) || 0) * Math.max(0, Number(personnes) || 0);
  if (rations) c.nourriture = rations;
  for (const [r, n] of Object.entries(effet.cout ?? {})) c[r] = (c[r] ?? 0) + Math.max(0, Number(n) || 0);
  return c;
}
export function manqueDe(stocks = {}, cout = {}) {
  const m = {};
  for (const [r, n] of Object.entries(cout)) if ((Number(stocks?.[r]) || 0) < n) m[r] = n - (Number(stocks?.[r]) || 0);
  return m;
}

// Les liens entre abris : { factions: { cle: n }, communautes: { cle: n }, renom: n } (0 à LIENS_MAX).
export const liensVides = () => ({ factions: {}, communautes: {}, renom: 0 });
export function ajouterLiens(etat, { faction = "", communaute = "", n = 1, renom = 0 } = {}) {
  const l = structuredClone(etat?.liens ?? liensVides());
  l.factions ??= {}; l.communautes ??= {}; l.renom = Number(l.renom) || 0;
  if (faction) l.factions[faction] = borner((Number(l.factions[faction]) || 0) + n, 0, LIENS_MAX);
  if (communaute && communaute !== "tous") l.communautes[communaute] = borner((Number(l.communautes[communaute]) || 0) + n, 0, LIENS_MAX);
  if (renom) l.renom = borner(l.renom + renom, 0, LIENS_MAX);
  return { ...etat, liens: l };
}
export const liensAvec = (etat, faction) => Number(etat?.liens?.factions?.[faction]) || 0;
// Le recrutement auprès d'une faction avec qui l'on a tissé des liens (2 ou plus) : l'attitude gagne un cran.
const CRANS = ["hostile", "mefiante", "neutre", "amicale"];
export function attitudeAvecLiens(attitude = "neutre", liens = 0) {
  const i = CRANS.indexOf(attitude);
  if (i < 0 || Number(liens) < 2) return attitude;
  return CRANS[Math.min(CRANS.length - 1, i + 1)];
}

// Aller à la fête d'une autre communauté (un abri voisin, une faction, un quartier qui fête encore) : les participants y passent
// PARTICIPATION.quarts, en reviennent avec +1 de moral, et le groupe gagne un lien avec cette communauté et cette faction, une fois
// par fête, par année et par hôte. C'est le point d'accroche des préjugés des PNJ (un autre lot) : chaque participation est notée
// (etat.participations) et compte dans etat.liens.communautes.
// -> { ok, motif, etat, entree }
export function participer(etat, { fete = "", annee = 0, jour = 0, communaute = "", faction = "", qui = [] } = {}) {
  const refus = (cle, params, texte) => ({ ok: false, motif: message(cle, params, texte), etat, entree: null });
  if (!fete || !annee) return refus("fete-manquante", {}, "fête ou année manquante");
  if (!communaute && !faction) return refus("participation-sans-hote", {}, "chez qui ?");
  if (!(qui ?? []).length) return refus("participation-sans-personne", {}, "personne n'y va");
  const hote = faction || communaute;
  if ((etat?.participations ?? []).some(p => p.fete === fete && p.annee === annee && (p.faction || p.communaute) === hote)) {
    return refus("participation-deja", { fete }, "déjà allés à cette fête cette année");
  }
  const entree = { jour: Number(jour) || 0, fete, annee, communaute: communaute || "", faction: faction || "", qui: [...qui] };
  let e = ajouterLiens(etat, { faction, communaute, n: PARTICIPATION.liens });
  e = { ...e, participations: [...(e.participations ?? []), entree].slice(-50) };
  return { ok: true, motif: null, etat: e, entree };
}
// Combien de fois le groupe est allé aux fêtes d'une communauté (pour les préjugés des PNJ).
export const participationsChez = (etat, communaute) => (etat?.participations ?? []).filter(p => p.communaute === communaute).length;
