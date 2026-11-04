// Petites lectures communes à l'API et à l'interface : traductions, état public, acteurs du groupe. Rien de secret ici.
import { ID } from "../logique/constantes.mjs";
import { etatVide } from "../logique/etat.mjs";

export const MODULE_CONTENU = "lakour-fenoir";
export const MODULE_MJIA = "lakour-mj-ia";

export function t(cle, donnees = null) {
  try {
    if (donnees) return game.i18n.format(cle, donnees);
    return game.i18n.localize(cle);
  } catch { return cle; }
}

// Un message d'erreur lisible : une clé de traduction est traduite (les erreurs de l'API sont des clés, pour le MJ IA).
export function erreurLisible(e) {
  const brut = String(e?.message ?? e ?? "");
  return /^LAKOUR_SURVIE\.[\w.]+$/.test(brut) ? t(brut) : brut;
}

export function lireEtat() {
  try { return { ...etatVide(), ...structuredClone(game.settings.get(ID, "partie") ?? {}) }; } catch { return etatVide(); }
}

export function reglage(cle, defaut = null) {
  try { return game.settings.get(ID, cle) ?? defaut; } catch { return defaut; }
}

export const echapper = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
export const sansBalises = s => String(s ?? "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();

// Les données « à plat » d'un document (TypeDataModel ou objet de la doublure).
export const aPlat = system => (typeof system?.toObject === "function" ? system.toObject() : structuredClone(system ?? {}));

export const acteur = id => (id ? game.actors?.get(id) ?? null : null);
export const survivantsDuGroupe = (etat = lireEtat()) => (etat.groupe?.membres ?? []).map(acteur).filter(a => a?.type === "survivant");
export const abriCourant = (etat = lireEtat()) => {
  const a = acteur(etat.groupe?.abri);
  return a?.type === "abri" ? a : null;
};
// Le survivant de l'utilisateur courant (son personnage, sinon le premier dont il est propriétaire dans le groupe).
export function monSurvivant() {
  const perso = game.user?.character;
  if (perso?.type === "survivant") return perso;
  if (game.user?.isGM) return null;
  return (game.actors?.contents ?? [...(game.actors?.values?.() ?? [])]).find(a => a.type === "survivant" && a.isOwner && !a.system?.livide) ?? null;
}
export const proprietaireDe = (a, userId) => {
  const u = game.users?.get(userId);
  if (!a || !u) return false;
  if (u.isGM) return true;
  if (typeof a.testUserPermission === "function") return a.testUserPermission(u, "OWNER");
  return Number(a.ownership?.[userId]) >= 3;
};

export const libelleCompetence = c => t(`LAKOUR_SURVIE.Competences.${c}`);
export const libelleRessource = r => t(`LAKOUR_SURVIE.Ressources.${r}`);
export const libelleMoment = m => t(`LAKOUR_SURVIE.Moments.${m}`);
export const libellePhase = p => t(`LAKOUR_SURVIE.Phases.${p}`);
export const libelleTache = tache => t(`LAKOUR_SURVIE.Taches.${tache || "aucune"}`);
export const libelleDifficulte = d => t(`LAKOUR_SURVIE.Difficultes.${d}`);

// ------------------------------------------------------------------ textes de la logique, dans la langue de l'utilisateur
// La logique (logique/textes.mjs) rend ses textes en { cle, params, texte } : faits, journal, alertes, menaces, rencontres, motifs
// de refus. Ici on les affiche dans la langue du navigateur : une clé sans point est une clé de LAKOUR_SURVIE.Faits, une clé avec
// point un chemin sous LAKOUR_SURVIE (entrées écrites par l'API : Journal.*, Alertes.*…). Sans clé connue, `texte` (le français de la
// logique, ou le texte d'une ancienne entrée) reste lisible. Une chaîne est rendue telle quelle.
const aTraduction = chemin => { try { return Boolean(game.i18n?.has?.(chemin)); } catch { return false; } };
const PARAMS_A_LIBELLE = { ressource: "Ressources", competence: "Competences", tache: "Taches", transport: "Transports", source: "Sources" };
const texteStocksParam = stocks => Object.entries(stocks ?? {}).filter(([, q]) => Number(q) > 0).map(([r, q]) => `${q} ${libelleRessource(r).toLowerCase()}`).join(", ")
  || t("LAKOUR_SURVIE.Action.Rien");
function rendreParam(cle, valeur, params) {
  if (Array.isArray(valeur)) return valeur.map(v => rendreParam(cle, v, params)).join(", ");
  if (valeur && typeof valeur === "object") return texteStocksParam(valeur);   // des stocks { ressource: n } (butin, manque)
  if (cle === "creature" && !valeur && params.creatureCle) return t(`LAKOUR_SURVIE.Creatures.${params.creatureCle}`);
  const famille = PARAMS_A_LIBELLE[cle];
  if (famille && typeof valeur === "string" && aTraduction(`LAKOUR_SURVIE.${famille}.${valeur}`)) return t(`LAKOUR_SURVIE.${famille}.${valeur}`);
  return valeur === null || valeur === undefined ? "" : String(valeur);
}
export const cheminTexte = cle => (cle ? `LAKOUR_SURVIE.${String(cle).includes(".") ? cle : `Faits.${cle}`}` : "");
export function localiser(x) {
  if (x === null || x === undefined) return "";
  if (typeof x !== "object") return String(x);
  const chemin = cheminTexte(x.cleTexte ?? x.cle);
  if (chemin && aTraduction(chemin)) {
    const params = x.params && typeof x.params === "object" ? x.params : {};
    return t(chemin, Object.fromEntries(Object.entries(params).map(([k, v]) => [k, rendreParam(k, v, params)])));
  }
  return String(x.texte ?? "");
}
// Ce qu'on garde d'un texte dans l'état public (journal, alertes) : { cle, params, texte } ; `texte` est le français de la logique
// ou, pour une entrée écrite par l'API, la traduction au moment de l'écriture (repli des anciens navigateurs). null si vide.
export function entreeTexte(x) {
  if (x === null || x === undefined) return null;
  if (typeof x !== "object") return String(x) ? { texte: String(x) } : null;
  const cle = x.cleTexte ?? x.cle ?? "";
  const e = { texte: String(x.texte ?? localiser(x)) };
  if (cle) { e.cle = String(cle); e.params = x.params && typeof x.params === "object" ? structuredClone(x.params) : {}; }
  return e.texte || e.cle ? e : null;
}
