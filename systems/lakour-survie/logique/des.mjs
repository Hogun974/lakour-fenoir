// Le test à réserve de d6 (contrat §1.1) et la progression des compétences. Logique pure.
//
// - Réserve = niveau (0..5) + 1 + bonus − malus, au moins 1 dé, au plus 10. `facile` ajoute 1 dé (et demande 1 succès).
// - Chaque 5 ou 6 est un succès. Requis : normale 1, difficile 2, extrême 3. Marge = succès − requis.
// - Forcer (une fois) : on relance tous les dés qui ne sont pas des succès, contre 1 fatigue ; un test forcé qui échoue encore
//   donne une complication (bruit, outil cassé, blessure légère, temps perdu : au MJ de choisir).
// - Un test qui comptait donne une marque s'il est échoué ou forcé ; à 2 × (niveau + 1) marques, la compétence monte de 1
//   (max 5) et les marques repartent à 0.
// - Passions (§10.1) : une marque compte × 1,5 avec un intérêt (1), × 2 avec une passion (2) ; sous 25 ans, une marque de plus
//   toutes les 3 (× 4/3). Les marques peuvent donc être décimales (arrondies au centième).
import { DIFFICULTES, SEUIL_SUCCES, DES_MIN, DES_MAX, NIVEAU_MAX, borner } from "./constantes.mjs";

export const COMPLICATIONS = ["bruit", "outil-casse", "blessure-legere", "temps-perdu"];

export function reserve({ niveau = 0, bonus = 0, malus = 0 } = {}) {
  const n = Number(niveau) + 1 + Number(bonus) - Number(malus);
  return borner(Math.round(n), DES_MIN, DES_MAX);
}

export function lancer(n, hasard = Math.random) {
  return Array.from({ length: Math.max(0, n) }, () => 1 + Math.floor(hasard() * 6));
}

export const estSucces = d => d >= SEUIL_SUCCES;
export const compter = des => des.filter(estSucces).length;

export function difficulteDe(cle) {
  return DIFFICULTES[cle] ?? DIFFICULTES.normale;
}

// Relance des dés qui ne sont pas des succès (forcer).
export function relancer(des, hasard = Math.random) {
  return des.map(d => (estSucces(d) ? d : 1 + Math.floor(hasard() * 6)));
}

// Le test complet. `compte` (défaut vrai) : le test comptait-il (danger, enjeu) ? Sinon il ne donne jamais de marque.
// -> { des, desForces, succes, requis, reussite, marge, force, complication, marque, fatigue, difficulte, reserve }
export function resoudreTest({ niveau = 0, difficulte = "normale", bonus = 0, malus = 0, forcer = false, hasard = Math.random, compte = true } = {}) {
  const d = difficulteDe(difficulte);
  const n = reserve({ niveau, bonus: Number(bonus) + d.bonus, malus });
  const des = lancer(n, hasard);
  const resultat = conclure({ des, desForces: null, requis: d.requis, difficulte: DIFFICULTES[difficulte] ? difficulte : "normale", compte, reserve: n });
  return forcer ? forcerTest(resultat, hasard) : resultat;
}

// Force un test déjà lancé (bouton de la carte de chat) : une seule fois.
export function forcerTest(resultat, hasard = Math.random) {
  if (resultat.force) return resultat;
  const desForces = relancer(resultat.des, hasard);
  return conclure({ ...resultat, desForces, force: true });
}

function conclure({ des, desForces = null, requis, difficulte, compte = true, reserve: n, force = false }) {
  const finals = desForces ?? des;
  const succes = compter(finals);
  const reussite = succes >= requis;
  return {
    des, desForces, succes, requis, reussite, marge: succes - requis, force,
    complication: force && !reussite,
    marque: Boolean(compte) && (!reussite || force),
    fatigue: force ? 1 : 0,
    difficulte, reserve: n, compte: Boolean(compte)
  };
}

// Marques nécessaires pour monter du niveau donné.
export const seuilMarques = niveau => 2 * (Number(niveau) + 1);

export const MULTIPLICATEUR_PASSION = [1, 1.5, 2];
export const AGE_JEUNE = 25, BONUS_JEUNE = 4 / 3;

// Marques réellement gagnées pour n marques données.
export function gainMarques(n = 1, { passion = 0, age = null } = {}) {
  const mult = MULTIPLICATEUR_PASSION[borner(Number(passion) || 0, 0, 2)] * (age !== null && age !== undefined && Number(age) < AGE_JEUNE ? BONUS_JEUNE : 1);
  return Math.round(n * mult * 100) / 100;
}

// Ajoute n marques à une compétence { niveau, marques } -> { niveau, marques, monte }.
// options : { passion: 0 | 1 | 2, age }. Au niveau 5 les marques ne servent plus : elles plafonnent au seuil, rien ne monte.
export function marquer({ niveau = 0, marques = 0 } = {}, n = 1, options = {}) {
  const niv = borner(Number(niveau) || 0, 0, NIVEAU_MAX);
  const m = Math.round((Math.max(0, Number(marques) || 0) + gainMarques(n, options)) * 100) / 100;
  if (niv >= NIVEAU_MAX) return { niveau: niv, marques: Math.min(m, seuilMarques(NIVEAU_MAX)), monte: false };
  // Les marques repartent à 0 (contrat §1.1) : pas de report sur le niveau suivant.
  if (m >= seuilMarques(niv) - 1e-9) return { niveau: niv + 1, marques: 0, monte: true };
  return { niveau: niv, marques: m, monte: false };
}
