// Les affaires de l'île (lot 12 « Affaires, récits et fêtes », 2026-11-17 ; contrat §17). Logique pure.
//
// Une affaire est un morceau du monde qui existe sans le groupe, qui avance et qui finira, avec ou sans lui (contenu :
// lakour-fenoir, contenu/affaires.mjs, registre `affaires`). Le système ne raconte rien et ne tient pas d'affaire en cours : il dit
// celles qui peuvent naître ici et maintenant (affairesPossibles), en tire une avec sa vérité gardée par le MJ (tirerAffaire), dit
// où en est sa pente après tant de jours (cranDeLaPente) et ce que fait une issue (issueDe). Le MJ, ou le MJ IA avec ses horloges
// (« affaire-<clé> », « front-<front> »), applique les effets avec les outils qui existent (réputation, acteMoral, stocks…).
//
// Forme d'une affaire (registre) : { cle, numero, titre, taille, famille, regions ([] : partout), sites, factions, front, foire,
//   naissance: { mois: [1..12], phases: [phase], fete: clé, cran: n, declencheurs: [declencheur] }, apprendre, demande, malTourner,
//   change, garde, verites: { verite: { poids, texte } }, pente: { tousLes: jours, crans: [texte] },
//   issues: [{ cle, titre, texte, effets }], voix: [texte], traces, ton }.
import { liste } from "./contenu.mjs";
import { CLES_PHASES } from "./constantes.mjs";
import { ACTES_MORAUX } from "./moralite.mjs";

export const TAILLES_AFFAIRE = ["bruit", "affaire", "grande-affaire", "front"];
export const VERITES_AFFAIRE = ["vraie", "exageree", "perimee", "fausse", "piege"];
// Les fronts de la campagne « L'année du Gris » (journal du MJ) ; leur horloge du moteur s'appelle « front-<front> ».
export const FRONTS_CAMPAGNE = ["comptable", "garnison", "hauts", "fournaise", "remede"];
export const CRANS_FRONT = 6;
// Ce qui fait naître une affaire sans dépendre du calendrier : le MJ (ou le MJ IA) le dit.
export const DECLENCHEURS_AFFAIRE = ["refus-a-la-porte", "date-perdue"];
// Les effets d'une issue (tous facultatifs) et leur forme.
export const EFFETS_ISSUE = {
  reputation: "factions",     // { faction: ±n } : horloge rep-<faction>
  acte: "acte",               // un acte moral (ACTES_MORAUX) pour ceux qui ont choisi : acteMoral
  front: "entier",            // ±n crans au front de l'affaire : horloge front-<front>
  stocks: "stocks",           // { ressource: ±n }
  savoir: "texte",            // une clé de savoir appris ou enseigné
  plan: "texte",              // une clé d'installation ajoutée aux plans du groupe
  renom: "entier", moral: "entier", entente: "entier", autorite: "entier", visibilite: "entier",
  recrue: "vrai",             // quelqu'un rejoint le groupe
  depart: "vrai",             // quelqu'un quitte le groupe
  rumeur: "rumeur",           // true : le Ladi Lafé s'en empare ; "dementie" : la rumeur est démentie
  prejuge: "vrai",            // un préjugé d'un PNJ perd un cran
  voie: "voie",               // "ouverte" : une route s'ouvre (au MJ)
  horde: "vrai",              // une horde approche (au MJ)
  fete: "texte",              // une clé de fête : le groupe la fête (feter)
  voeu: "voeu"                // "tenu" | "rompu" : voeu
};
// Les ressources qu'une issue peut donner ou prendre (contrat §1.6 et §13.1).
export const RESSOURCES_ISSUE = ["eau", "nourriture", "carburant", "medicaments", "munitions", "materiaux", "pieces", "graines", "gaz", "plantes", "boutures", "biocarburant"];

const n0 = x => Number(x) || 0;
export const affairesDe = contenu => liste(contenu?.affaires).sort((a, b) => n0(a.numero) - n0(b.numero));
export const affaireDe = (contenu, cle) => affairesDe(contenu).find(a => a.cle === cle) ?? null;

// Une affaire peut-elle naître dans ce contexte ? ctx : { region, mois (1..12), phase, fetes: [clé de fête à venir ou en cours],
// fronts: { front: cran }, declencheurs: [déclencheur], closes: [clé] }. Un champ du contexte absent ne filtre pas (sauf un
// déclencheur, qui doit être dit).
export function affairePossible(a, ctx = {}) {
  if (!a?.cle || (ctx.closes ?? []).includes(a.cle)) return false;
  const n = a.naissance ?? {};
  if (ctx.region && (a.regions ?? []).length && !a.regions.includes(ctx.region)) return false;
  if (ctx.mois && (n.mois ?? []).length && !n.mois.includes(Number(ctx.mois))) return false;
  if (ctx.phase && (n.phases ?? []).length && !n.phases.includes(ctx.phase)) return false;
  if (n.fete && ctx.fetes && !ctx.fetes.includes(n.fete)) return false;
  if (n0(n.cran) > 0 && a.front && ctx.fronts && n0(ctx.fronts[a.front]) < n0(n.cran)) return false;
  if ((n.declencheurs ?? []).length && !(n.declencheurs.some(d => (ctx.declencheurs ?? []).includes(d)))) return false;
  return true;
}
export const affairesPossibles = (contenu, ctx = {}) => affairesDe(contenu).filter(a => affairePossible(a, ctx));

// Choisir dans une liste pondérée [{ cle, poids }] avec le hasard donné.
function tirerPondere(entrees, hasard = Math.random) {
  const total = entrees.reduce((s, e) => s + Math.max(0, n0(e.poids)), 0);
  if (!(total > 0)) return entrees[0] ?? null;
  let r = hasard() * total;
  for (const e of entrees) { r -= Math.max(0, n0(e.poids)); if (r < 0) return e; }
  return entrees.at(-1);
}
// La vérité d'une affaire, tirée selon ses poids : { cle, texte, poids }.
export function tirerVerite(a, hasard = Math.random) {
  const e = tirerPondere(Object.entries(a?.verites ?? {}).map(([cle, v]) => ({ cle, poids: v.poids, texte: v.texte })), hasard);
  return e ? { cle: e.cle, texte: e.texte ?? "", poids: n0(e.poids) } : null;
}

// Tirer une affaire : parmi celles qui peuvent naître (ou celle qu'on nomme : cle), avec sa vérité (au MJ) et une de ses voix
// (ce qu'on en entend). -> { cle, numero, titre, taille, verite, voix, pente: premier cran, possibles } | null
export function tirerAffaire(contenu, ctx = {}, hasard = Math.random, { cle = "" } = {}) {
  const possibles = affairesPossibles(contenu, ctx);
  const a = cle ? affaireDe(contenu, cle) : possibles[Math.floor(hasard() * possibles.length)] ?? null;
  if (!a) return null;
  const verite = tirerVerite(a, hasard);
  const voix = (a.voix ?? [])[Math.floor(hasard() * (a.voix ?? []).length)] ?? "";
  return { cle: a.cle, numero: a.numero, titre: a.titre, taille: a.taille, front: a.front ?? "", verite, voix, pente: a.pente?.crans?.[0] ?? "", possibles: possibles.length };
}

// Où en est la pente d'une affaire après tant de jours sans que personne ne s'en occupe : { cran (0 : rien encore), texte, fin }.
export function cranDeLaPente(a, jours = 0) {
  const crans = a?.pente?.crans ?? [];
  const tous = Math.max(1, n0(a?.pente?.tousLes) || 1);
  const cran = Math.min(crans.length, Math.floor(Math.max(0, n0(jours)) / tous));
  return { cran, texte: cran ? crans[cran - 1] : "", fin: cran >= crans.length && crans.length > 0 };
}

// Une issue d'une affaire, effets compris (copie) ; null si inconnue.
export function issueDe(a, cle) {
  const i = (a?.issues ?? []).find(x => x.cle === cle);
  return i ? structuredClone({ ...i, effets: i.effets ?? {} }) : null;
}

// Les erreurs d'une affaire, contre le contenu donné (régions, sites, factions, savoirs, installations, fêtes, foires). Le fabricant
// du contenu et les essais s'en servent. -> [texte]
export function erreursAffaire(a, contenu = {}) {
  const e = [], ou = `affaire ${a?.cle ?? "?"}`;
  const cles = f => new Set(liste(contenu?.[f]).map(x => x.cle));
  const regions = cles("regions"), sites = cles("sites"), factions = cles("factions"), savoirs = cles("savoirs"), installations = cles("installations"),
    fetes = cles("fetes"), foires = cles("foires");
  if (!/^[a-z0-9-]+$/.test(a?.cle ?? "")) e.push(`${ou} : clé`);
  if (!Number.isInteger(a?.numero) || a.numero < 1) e.push(`${ou} : numéro`);
  if (!TAILLES_AFFAIRE.includes(a?.taille)) e.push(`${ou} : taille « ${a?.taille} »`);
  for (const k of ["titre", "apprendre", "demande", "malTourner", "change", "garde", "traces"]) if (!String(a?.[k] ?? "").trim()) e.push(`${ou} : ${k} vide`);
  for (const r of a?.regions ?? []) if (!regions.has(r)) e.push(`${ou} : région « ${r} »`);
  for (const s of a?.sites ?? []) if (!sites.has(s)) e.push(`${ou} : site « ${s} »`);
  for (const f of a?.factions ?? []) if (!factions.has(f)) e.push(`${ou} : faction « ${f} »`);
  if (a?.front && !FRONTS_CAMPAGNE.includes(a.front)) e.push(`${ou} : front « ${a.front} »`);
  if (a?.foire && !foires.has(a.foire)) e.push(`${ou} : foire « ${a.foire} »`);
  const n = a?.naissance ?? {};
  if ((n.mois ?? []).some(m => !Number.isInteger(m) || m < 1 || m > 12)) e.push(`${ou} : mois de naissance`);
  if ((n.phases ?? []).some(p => !CLES_PHASES.includes(p))) e.push(`${ou} : phase de naissance`);
  if (n.fete && !fetes.has(n.fete)) e.push(`${ou} : fête « ${n.fete} »`);
  if (n0(n.cran) && (!a.front || n.cran < 1 || n.cran > CRANS_FRONT)) e.push(`${ou} : cran de front sans front, ou hors de 1..${CRANS_FRONT}`);
  if ((n.declencheurs ?? []).some(d => !DECLENCHEURS_AFFAIRE.includes(d))) e.push(`${ou} : déclencheur`);
  const verites = Object.entries(a?.verites ?? {});
  if (!verites.length) e.push(`${ou} : aucune vérité`);
  for (const [v, x] of verites) if (!VERITES_AFFAIRE.includes(v) || !(n0(x?.poids) > 0) || !String(x?.texte ?? "").trim()) e.push(`${ou} : vérité « ${v} »`);
  if (!(Number.isInteger(a?.pente?.tousLes) && a.pente.tousLes >= 1) || !(a?.pente?.crans ?? []).length || a.pente.crans.some(c => !String(c).trim())) e.push(`${ou} : pente`);
  const issues = a?.issues ?? [];
  if (issues.length < 3 || issues.length > 5) e.push(`${ou} : ${issues.length} issues (3 à 5)`);
  if (new Set(issues.map(i => i.cle)).size !== issues.length) e.push(`${ou} : issue en double`);
  for (const i of issues) {
    const oui = `${ou}, issue ${i.cle}`;
    if (!/^[a-z0-9-]+$/.test(i.cle ?? "") || !String(i.titre ?? "").trim() || !String(i.texte ?? "").trim()) e.push(`${oui} : clé, titre ou texte`);
    for (const [k, v] of Object.entries(i.effets ?? {})) {
      const forme = EFFETS_ISSUE[k];
      if (!forme) { e.push(`${oui} : effet inconnu « ${k} »`); continue; }
      const ok = {
        factions: () => v && typeof v === "object" && Object.entries(v).every(([f, x]) => factions.has(f) && Number.isInteger(x) && x !== 0),
        acte: () => Object.hasOwn(ACTES_MORAUX, v),
        entier: () => Number.isInteger(v) && v !== 0 && (k !== "front" || Boolean(a.front)),
        stocks: () => v && typeof v === "object" && Object.entries(v).every(([r, x]) => RESSOURCES_ISSUE.includes(r) && Number.isInteger(x) && x !== 0),
        texte: () => (k === "savoir" ? savoirs : k === "plan" ? installations : fetes).has(v),
        vrai: () => v === true,
        rumeur: () => v === true || v === "dementie",
        voie: () => v === "ouverte",
        voeu: () => v === "tenu" || v === "rompu"
      }[forme]();
      if (!ok) e.push(`${oui} : effet « ${k} » mal formé`);
    }
  }
  if ((a?.voix ?? []).length < 3 || a.voix.some(v => !String(v).trim())) e.push(`${ou} : moins de trois voix`);
  return e;
}
