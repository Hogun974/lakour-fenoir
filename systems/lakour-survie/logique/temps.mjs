// Le temps du monde (contrat §1.4, §1.5). Logique pure.
//
// - Unité : le quart (6 h). quart 0 = jour zéro à 6 h. jour = floor(quart / 4), moment = quart % 4
//   (matin 6 h–12 h, après-midi, soir, nuit).
// - La date réelle découle de `dateDepart` (ISO "AAAA-MM-JJ", défaut 2026-12-04). Le calcul se fait en dates CALENDAIRES UTC :
//   le fuseau de la machine n'a aucune influence.
// - Saisons de La Réunion : saison des pluies (été austral, cyclones) de novembre à avril ; saison sèche (hiver austral) de mai
//   à octobre.
// - Fruits de saison (letchis décembre-janvier, mangues novembre-janvier) : multiplicateur de cueillette 1,25 en novembre,
//   1,5 en décembre et janvier, 1 sinon (bonusFruits).
// - Phase de la crise selon le jour : jour-zero 0–1, panique 2–6, effondrement 7–20, silence 21–59, apres 60+.
import { QUARTS_PAR_JOUR, MOMENTS, DATE_DEPART, PHASES } from "./constantes.mjs";

const MS_JOUR = 86400000;
const MOIS = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];
const JOURS_SEMAINE = ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"];
const HEURES = ["6 h", "12 h", "18 h", "0 h"];

export const jourDe = quart => Math.floor(Math.max(0, Number(quart) || 0) / QUARTS_PAR_JOUR);
export const momentIndex = quart => (Math.max(0, Number(quart) || 0)) % QUARTS_PAR_JOUR;
export const momentDe = quart => MOMENTS[momentIndex(quart)];
export const premierQuart = jour => Number(jour) * QUARTS_PAR_JOUR;

// "AAAA-MM-JJ" -> nombre de jours depuis l'époque (UTC). Une date invalide retombe sur la date de départ par défaut.
function jourEpoque(iso) {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(iso ?? ""));
  const [a, mo, j] = m ? [Number(m[1]), Number(m[2]), Number(m[3])] : DATE_DEPART.split("-").map(Number);
  return Math.round(Date.UTC(a, mo - 1, j) / MS_JOUR);
}

export function dateValide(iso) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(iso ?? ""));
  if (!m) return false;
  const d = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])));
  return d.getUTCFullYear() === Number(m[1]) && d.getUTCMonth() === Number(m[2]) - 1 && d.getUTCDate() === Number(m[3]);
}

// La date réelle du jour de jeu `jour` -> { iso, annee, mois (1..12), jourMois, semaine (0 = dimanche) }.
export function dateDuJour(jour, dateDepart = DATE_DEPART) {
  const d = new Date((jourEpoque(dateDepart) + Number(jour || 0)) * MS_JOUR);
  const annee = d.getUTCFullYear(), mois = d.getUTCMonth() + 1, jourMois = d.getUTCDate();
  const iso = `${String(annee).padStart(4, "0")}-${String(mois).padStart(2, "0")}-${String(jourMois).padStart(2, "0")}`;
  return { iso, annee, mois, jourMois, semaine: d.getUTCDay() };
}

export const saisonDuMois = mois => (mois >= 11 || mois <= 4 ? "pluies" : "seche");
export const saisonDuJour = (jour, dateDepart = DATE_DEPART) => saisonDuMois(dateDuJour(jour, dateDepart).mois);

export function bonusFruits(mois) {
  if (mois === 12 || mois === 1) return 1.5;
  if (mois === 11) return 1.25;
  return 1;
}

export function phaseDuJour(jour) {
  let cle = PHASES[0].cle;
  for (const p of PHASES) if (Number(jour) >= p.debut) cle = p.cle;
  return cle;
}

export function dateTexte(jour, dateDepart = DATE_DEPART) {
  const d = dateDuJour(jour, dateDepart);
  return `${JOURS_SEMAINE[d.semaine]} ${d.jourMois === 1 ? "1er" : d.jourMois} ${MOIS[d.mois - 1]} ${d.annee}`;
}

// Tout ce que dit l'horloge pour un quart -> { quart, jour, moment, momentIndex, heure, date, dateTexte, mois, saison, phase, fruits }.
export function quand(quart, dateDepart = DATE_DEPART) {
  const q = Math.max(0, Math.floor(Number(quart) || 0));
  const jour = jourDe(q);
  const d = dateDuJour(jour, dateDepart);
  return {
    quart: q, jour, moment: momentDe(q), momentIndex: momentIndex(q), heure: HEURES[momentIndex(q)],
    date: d.iso, dateTexte: dateTexte(jour, dateDepart), mois: d.mois, saison: saisonDuMois(d.mois), phase: phaseDuJour(jour),
    fruits: bonusFruits(d.mois)
  };
}

// Le premier jour de jeu (≥ depuis) qui tombe à la date "AAAA-MM-JJ" donnée, ou null si elle est passée.
export function jourDeDate(iso, dateDepart = DATE_DEPART) {
  const j = jourEpoque(iso) - jourEpoque(dateDepart);
  return j >= 0 ? j : null;
}
