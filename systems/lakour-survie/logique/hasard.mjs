// Hasard reproductible (repris des Veillées, renforcé) : une graine (texte ou nombre) donne toujours la même suite. Sans graine :
// Math.random. La simulation du monde tire un générateur PAR JOUR (hasardDuJour) : le monde d'un jour donné ne dépend que de la
// graine et des jours précédents, pas de la façon dont les quarts ont été avancés (1 par 1 ou 40 d'un coup).
//
// Sécurité (le monde réel est secret) : la graine d'une partie est tirée par crypto.getRandomValues (graineSure, 128 bits, 32
// caractères hexadécimaux). Chaque flux (« jour|12 », « radio|12 », « fouille|57|2 »…) part des 128 premiers bits de SHA-256
// (graine|usage) (sha256.mjs, synchrone), puis d'un générateur sfc32 à état de 128 bits. Un joueur qui relève ce que la radio
// annonce ne peut donc ni remonter à la graine (SHA-256 à sens unique, 2^128 graines à essayer) ni d'un flux à un autre.
// Avant (jusqu'au 2026-11-05) : FNV-1a 32 bits puis mulberry32 : 2^32 états seulement, toute la partie se rejouait.
// Une graine courte (partie ancienne, graine d'essai) marche toujours, mais se devine : graineLongue dit si elle est assez longue.
import { sha256Texte } from "./sha256.mjs";

export const GRAINE_LONGUEUR_MIN = 32;

// Une graine sûre : 128 bits tirés par crypto.getRandomValues (navigateur ou Node), en 32 caractères hexadécimaux.
export function graineSure() {
  const c = globalThis.crypto;
  if (!c?.getRandomValues) throw new Error("crypto.getRandomValues indisponible : pas de graine sûre");
  return [...c.getRandomValues(new Uint8Array(16))].map(o => o.toString(16).padStart(2, "0")).join("");
}
// Une graine assez longue pour ne pas se deviner (au moins 32 caractères, comme une graine sûre).
export const graineLongue = graine => typeof graine === "string" && graine.length >= GRAINE_LONGUEUR_MIN;

// Générateur sfc32 (état de 128 bits) : renvoie une fonction () -> [0, 1).
function sfc32(a, b, c, d) {
  return function () {
    const t = (((a + b) | 0) + d) | 0;
    d = (d + 1) | 0;
    a = b ^ (b >>> 9);
    b = (c + (c << 3)) | 0;
    c = (c << 21) | (c >>> 11);
    c = (c + t) | 0;
    return (t >>> 0) / 4294967296;
  };
}

// Graine (texte ou nombre) -> générateur : état = les 128 premiers bits de SHA-256 de la graine.
export function creerHasard(graine) {
  if (graine === undefined || graine === null || graine === "") return Math.random;
  const h = sha256Texte(String(graine));
  return sfc32(h[0] | 0, h[1] | 0, h[2] | 0, h[3] | 0);
}

// Un générateur dérivé de la graine de la partie, propre à un usage (« jour|12 », « creation », « fouille|57|2 »…).
export const deriverHasard = (graine, ...cles) => creerHasard([graine, ...cles].join("|"));
export const hasardDuJour = (graine, jour) => deriverHasard(graine, "jour", jour);

// Mélange de Fisher-Yates, sans toucher au tableau d'origine.
export function melanger(tableau, hasard = Math.random) {
  const copie = [...tableau];
  for (let i = copie.length - 1; i > 0; i--) {
    const j = Math.floor(hasard() * (i + 1));
    [copie[i], copie[j]] = [copie[j], copie[i]];
  }
  return copie;
}

export function choisir(tableau, hasard = Math.random) {
  if (!tableau.length) return undefined;
  return tableau[Math.floor(hasard() * tableau.length)];
}

// Entier uniforme dans [min, max] (bornes incluses).
export const entier = (min, max, hasard = Math.random) => min + Math.floor(hasard() * (max - min + 1));

// Vrai avec la probabilité p.
export const chance = (p, hasard = Math.random) => hasard() < p;

// Tirage pondéré : options [{ poids, … }] (ou [valeur, poids]) -> l'option tirée, undefined si tout pèse 0.
export function tirerPoids(options, hasard = Math.random) {
  const poidsDe = o => Math.max(0, Number(Array.isArray(o) ? o[1] : o.poids) || 0);
  const total = options.reduce((s, o) => s + poidsDe(o), 0);
  if (!(total > 0)) return undefined;
  let x = hasard() * total;
  for (const o of options) {
    x -= poidsDe(o);
    if (x < 0) return Array.isArray(o) ? o[0] : o;
  }
  const dernier = options.filter(o => poidsDe(o) > 0).at(-1);
  return Array.isArray(dernier) ? dernier[0] : dernier;
}

// Arrondi stochastique (2,3 -> 2 ou 3, 3 avec 30 % de chances) : garde les stocks entiers sans biais.
export const arrondiHasard = (x, hasard = Math.random) => Math.floor(x + hasard());
