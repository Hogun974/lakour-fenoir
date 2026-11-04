// Hasard reproductible (repris des Veillées) : une graine (nombre ou texte) donne toujours la même suite. Sans graine : Math.random.
// La simulation du monde tire un générateur PAR JOUR (hasardDuJour) : le monde d'un jour donné ne dépend que de la graine et
// des jours précédents, pas de la façon dont les quarts ont été avancés (1 par 1 ou 40 d'un coup).

// Graine texte -> entier 32 bits (FNV-1a).
export function hacher(texte) {
  let h = 0x811c9dc5;
  for (const c of String(texte)) {
    h ^= c.codePointAt(0);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h >>> 0;
}

// Générateur mulberry32 : renvoie une fonction () -> [0, 1).
export function creerHasard(graine) {
  if (graine === undefined || graine === null || graine === "") return Math.random;
  let a = (typeof graine === "number" ? graine : hacher(graine)) >>> 0;
  return function () {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
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
