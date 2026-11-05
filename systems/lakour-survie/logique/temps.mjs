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
// Les mots de la date et de l'heure, par langue (la langue du client Foundry, passée en paramètre : la logique ne lit pas `game`).
// Une langue inconnue retombe sur le français.
const CALENDRIERS = {
  fr: {
    mois: ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"],
    semaine: ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"],
    heures: ["6 h", "12 h", "18 h", "0 h"],
    date: (j, d, m, a) => `${j} ${d === 1 ? "1er" : d} ${m} ${a}`
  },
  en: {
    mois: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
    semaine: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
    heures: ["6 am", "noon", "6 pm", "midnight"],
    date: (j, d, m, a) => `${j} ${d} ${m} ${a}`
  }
};
// "en", "en-GB", "EN" -> "en" ; ce qui n'est pas connu -> "fr".
export const langueCalendrier = langue => {
  const l = String(langue ?? "").toLowerCase().split(/[-_]/)[0];
  return l in CALENDRIERS ? l : "fr";
};

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

// La date du jour de jeu en toutes lettres, dans la langue donnée (« samedi 5 décembre 2026 », « Saturday 5 December 2026 »).
export function dateTexte(jour, dateDepart = DATE_DEPART, langue = "fr") {
  const d = dateDuJour(jour, dateDepart);
  const c = CALENDRIERS[langueCalendrier(langue)];
  return c.date(c.semaine[d.semaine], d.jourMois, c.mois[d.mois - 1], d.annee);
}
// La même chose depuis une date ISO "AAAA-MM-JJ" (un paramètre de texte gardé en ISO, rendu dans la langue du lecteur).
export const dateTexteIso = (iso, langue = "fr") => dateTexte(0, iso, langue);
// L'heure d'un moment (index 0..3) dans la langue donnée.
export const heureTexte = (index, langue = "fr") => CALENDRIERS[langueCalendrier(langue)].heures[Number(index) % QUARTS_PAR_JOUR] ?? "";

// Tout ce que dit l'horloge pour un quart -> { quart, jour, moment, momentIndex, heure, date, dateTexte, mois, saison, phase, fruits }.
// `langue` (défaut français) : celle de `heure` et `dateTexte`.
export function quand(quart, dateDepart = DATE_DEPART, langue = "fr") {
  const q = Math.max(0, Math.floor(Number(quart) || 0));
  const jour = jourDe(q);
  const d = dateDuJour(jour, dateDepart);
  return {
    quart: q, jour, moment: momentDe(q), momentIndex: momentIndex(q), heure: heureTexte(momentIndex(q), langue),
    date: d.iso, dateTexte: dateTexte(jour, dateDepart, langue), mois: d.mois, saison: saisonDuMois(d.mois), phase: phaseDuJour(jour),
    fruits: bonusFruits(d.mois)
  };
}

// Le premier jour de jeu (≥ depuis) qui tombe à la date "AAAA-MM-JJ" donnée, ou null si elle est passée.
export function jourDeDate(iso, dateDepart = DATE_DEPART) {
  const j = jourEpoque(iso) - jourEpoque(dateDepart);
  return j >= 0 ? j : null;
}
