// Les outils et les armes (lot 6 du portage du jeu 3D, « Les outils, les ateliers et les recettes » ; contrat §24 ; chiffres :
// docs/equilibre-ateliers.md). Logique pure.
//
// - Trois QUALITÉS (`qualite` d'un équipement) : « fortune » (pierre, bambou, ligatures : à la main), « recuperation » (tôle,
//   ferraille, ressort, un manche : à l'établi), « forge » (acier : à la forge). Douze GAMMES d'outils et d'armes (`gammes`) : hache,
//   sabre, couteau, marteau, scie, truelle, pelle-pioche, pied-de-biche, masse, pince, gratte, lance. Un objet sans qualité (tout ce
//   qui existait avant ce lot, sauf ce que le contenu range) ne s'use pas et ne change de rien.
// - Le bonus d'un outil est écrit sur l'objet : l'outil forgé garde la valeur de FVTT (le sabre à canne, le couteau, la pelle et
//   pioche, le pied-de-biche d'avant sont rangés « forge »), celui de récupération la même, celui de fortune un dé de moins (jamais
//   sous 0). La qualité fait surtout la SOLIDITÉ : un usage = un quart de travail avec l'outil (abattre, bâtir, une fabrication) ou un
//   combat ; forgé 40 usages, récupération 20, fortune 6 (le 3D : solidité 1, 0,5, 0,15 ; une hache forgée, 400 coups, une
//   trentaine d'arbres). Au bout de ses usages, un outil est CASSÉ : il ne donne plus son bonus et ne compte plus comme l'outil
//   d'une recette, jusqu'à une réparation.
// - La réparation de fortune (un bout de fil de fer ou de corde : 1 matériau, un quart) rend la moitié des usages, puis le quart,
//   puis le huitième ; trois fois au plus. Après, il faut un autre outil.
// - Une ARME À FEU ne casse pas : passé la moitié de ses usages (un usage = un test de tir), elle est USÉE. Elle s'ENRAYE quand le
//   test de tir montre au moins deux 1 (trois 1 si elle a été remise en état) ; usée, les 2 comptent comme des 1. Le 3D disait 4 %
//   par coup pour le fusil, 3 % pour la carabine et le pistolet, 1 % remise en état, et l'usure triple le risque : un test de tir de
//   FVTT est un échange de plusieurs coups (voir docs/equilibre-ateliers.md, les chances à 2, 3, 4 et 5 dés).
// - Un outil trouvé en fouillant est de fortune 60 % du temps, de récupération 30 %, forgé 10 % ; plus le lieu est risqué, plus il
//   est souvent bon (poids 6 ; 3 + 0,5 par palier ; 1 + 0,5 par palier ; au palier 4 : 43 %, 36 %, 21 %). Le lot « fouille » s'en
//   servira ; le MJ a la table « La qualité d'un outil trouvé ».
export const QUALITES = ["fortune", "recuperation", "forge"];
export const GAMMES = ["hache", "sabre", "couteau", "marteau", "scie", "truelle", "pelle-pioche", "pied-de-biche", "masse", "pince", "gratte", "lance"];

export const REGLES_OUTILS = {
  // Usages d'un outil selon sa qualité (quarts de travail ou combats) ; une arme à feu, un bouclier ou un engin à moteur a les siens.
  usages: { fortune: 6, recuperation: 20, forge: 40 },
  // Réparation de fortune : la part des usages rendue à la 1re, 2e, 3e fois ; ce qu'elle coûte.
  reparation: { parts: [0.5, 0.25, 0.125], cout: { materiaux: 1 }, quarts: 1, affutage: 0.25 },
  // Enrayage : le nombre de 1 qui enraye une arme à feu (d'origine, remise en état) ; usée, les dés jusqu'à `faceUsee` comptent.
  enrayage: { uns: { origine: 2, remise: 3 }, faceUsee: 2, usee: 0.5 },
  // La qualité d'un outil trouvé : poids de base et ajout par palier de risque (0 à 4).
  trouvee: { fortune: { poids: 6, parPalier: 0 }, recuperation: { poids: 3, parPalier: 0.5 }, forge: { poids: 1, parPalier: 0.5 } }
};

const n0 = x => Math.max(0, Number(x) || 0);
const def0 = (objet, def) => ({ ...(def ?? {}), ...Object.fromEntries(Object.entries(objet ?? {}).filter(([, v]) => v !== undefined && v !== null && v !== "" && !(Array.isArray(v) && !v.length))) });

export const qualiteDe = (eq, def = null) => (QUALITES.includes(def0(eq, def).qualite) ? def0(eq, def).qualite : "");
// Les gammes qu'un objet sert (une caisse à outils : marteau, pince, scie ; une tronçonneuse : hache, scie).
export const gammesDe = (eq, def = null) => (Array.isArray(def0(eq, def).gammes) ? def0(eq, def).gammes.filter(g => GAMMES.includes(g)) : []);
export const estArmeAFeu = (eq, def = null) => def0(eq, def).categorie === "arme-a-feu";

// Les usages d'un objet : écrits sur lui (une arme, un bouclier, un engin), sinon ceux de sa qualité ; 0 : il ne s'use pas.
export function usagesDe(eq, def = null) {
  const x = def0(eq, def);
  if (Number(x.usages) > 0) return Math.floor(Number(x.usages));
  const q = qualiteDe(eq, def);
  return q ? REGLES_OUTILS.usages[q] : 0;
}
// Cassé : au bout de ses usages (une arme à feu ne casse pas, elle s'use).
export function estCasse(eq, def = null) {
  const u = usagesDe(eq, def);
  return u > 0 && !estArmeAFeu(eq, def) && n0(eq?.usure) >= u;
}
export function estUsee(eq, def = null) {
  const u = usagesDe(eq, def);
  return u > 0 && n0(eq?.usure) >= u * REGLES_OUTILS.enrayage.usee;
}
// L'état d'un objet en mots (clé) : « neuf » (sans usure), « use » (la moitié passée), « casse », ou « » (il ne s'use pas).
export function etatOutil(eq, def = null) {
  const u = usagesDe(eq, def);
  if (!u) return "";
  if (estCasse(eq, def)) return "casse";
  return estUsee(eq, def) ? "use" : "bon";
}
// Ce qu'il reste d'usages.
export const usagesRestants = (eq, def = null) => Math.max(0, usagesDe(eq, def) - n0(eq?.usure));

// Le bonus d'un objet à une compétence : celui qui est écrit, rien s'il est cassé.
export function bonusOutil(eq, competence, def = null) {
  if (estCasse(eq, def)) return 0;
  return Math.max(0, Number(def0(eq, def).bonus?.[competence]) || 0);
}

// User un objet : `n` usages de plus. -> { usure, casse (il vient de casser), use (il vient de passer à usé), etat }
export function userOutil(eq, n = 1, def = null) {
  const avant = { casse: estCasse(eq, def), use: estUsee(eq, def) };
  if (!usagesDe(eq, def)) return { usure: n0(eq?.usure), casse: false, use: false, etat: "" };
  const apres = { ...eq, usure: n0(eq?.usure) + Math.max(0, Math.floor(Number(n) || 0)) };
  return { usure: apres.usure, casse: !avant.casse && estCasse(apres, def), use: !avant.use && estUsee(apres, def), etat: etatOutil(apres, def) };
}

// La réparation de fortune (fil de fer ou corde). -> { ok, motif, usure, reparations, rendu }
export function reparerOutil(eq, def = null) {
  const u = usagesDe(eq, def);
  const r = Math.floor(n0(eq?.reparations));
  const parts = REGLES_OUTILS.reparation.parts;
  if (!u) return { ok: false, motif: "outil-sans-usure", usure: 0, reparations: r, rendu: 0 };
  if (estArmeAFeu(eq, def)) return { ok: false, motif: "outil-arme-a-feu", usure: n0(eq?.usure), reparations: r, rendu: 0 };
  if (!(n0(eq?.usure) > 0)) return { ok: false, motif: "outil-neuf", usure: 0, reparations: r, rendu: 0 };
  if (r >= parts.length) return { ok: false, motif: "outil-trop-repare", usure: n0(eq?.usure), reparations: r, rendu: 0 };
  const rendu = Math.max(1, Math.round(u * parts[r]));
  const usure = Math.max(0, n0(eq?.usure) - rendu);
  return { ok: true, motif: "", usure, reparations: r + 1, rendu: n0(eq?.usure) - usure };
}

// L'affûtage (une pierre à aiguiser, pour une lame) : un quart des usages, sans compter parmi les trois réparations.
export const GAMMES_LAMES = ["hache", "sabre", "couteau", "scie"];
export function affuterOutil(eq, def = null) {
  const u = usagesDe(eq, def);
  if (!u) return { ok: false, motif: "outil-sans-usure", usure: 0, rendu: 0 };
  if (!gammesDe(eq, def).some(g => GAMMES_LAMES.includes(g))) return { ok: false, motif: "outil-pas-une-lame", usure: n0(eq?.usure), rendu: 0 };
  if (!(n0(eq?.usure) > 0)) return { ok: false, motif: "outil-neuf", usure: 0, rendu: 0 };
  const usure = Math.max(0, n0(eq?.usure) - Math.max(1, Math.round(u * REGLES_OUTILS.reparation.affutage)));
  return { ok: true, motif: "", usure, rendu: n0(eq?.usure) - usure };
}

// L'enrayage d'une arme à feu, d'après les dés du test de tir. arme : { remise (remise en état), usure, usages… }.
// -> { enrayee, uns (dés qui comptent), requis }
export function enrayage(des = [], arme = {}, def = null) {
  const R = REGLES_OUTILS.enrayage;
  const x = def0(arme, def);
  const requis = x.remise ? R.uns.remise : R.uns.origine;
  const face = estUsee(arme, def) ? R.faceUsee : 1;
  const uns = (des ?? []).filter(d => Number(d) <= face).length;
  return { enrayee: uns >= requis, uns, requis };
}
// La chance qu'une arme s'enraye à un test de `n` dés (pour les tableaux d'équilibre) : P(au moins k dés ≤ face).
export function chanceEnrayage(n, { remise = false, usee = false } = {}) {
  const R = REGLES_OUTILS.enrayage;
  const k = remise ? R.uns.remise : R.uns.origine, p = (usee ? R.faceUsee : 1) / 6;
  let total = 0;
  for (let i = k; i <= n; i++) total += combinaisons(n, i) * p ** i * (1 - p) ** (n - i);
  return total;
}
function combinaisons(n, k) {
  let r = 1;
  for (let i = 1; i <= k; i++) r = (r * (n - k + i)) / i;
  return r;
}

// La qualité d'un outil trouvé en fouillant, selon le palier de risque du lieu (0 à 4).
export function poidsQualiteTrouvee(palier = 0) {
  const p = Math.max(0, Math.min(4, Number(palier) || 0));
  return Object.fromEntries(QUALITES.map(q => [q, REGLES_OUTILS.trouvee[q].poids + REGLES_OUTILS.trouvee[q].parPalier * p]));
}
export function qualiteTrouvee(palier = 0, hasard = Math.random) {
  const poids = poidsQualiteTrouvee(palier);
  const total = Object.values(poids).reduce((s, x) => s + x, 0);
  let t = hasard() * total;
  for (const q of QUALITES) { t -= poids[q]; if (t < 0) return q; }
  return QUALITES.at(-1);
}

// Les gammes d'outils qu'ont en main des survivants (leurs objets, non cassés), et le meilleur objet de chaque gamme (forgé avant
// récupération avant fortune, puis le moins usé). objets : [{ id?, system?: { cle, … } } | { cle, … }] ; defs : cle -> définition.
// -> Map(gamme -> objet)
const RANG_QUALITE = { forge: 3, recuperation: 2, fortune: 1, "": 2.5 };
export function outilsEnMain(objets = [], defs = new Map()) {
  const parGamme = new Map();
  for (const o of objets ?? []) {
    const s = o?.system ?? o;
    const def = defs?.get?.(s?.cle) ?? null;
    if (estCasse(s, def)) continue;
    for (const g of gammesDe(s, def)) {
      const avant = parGamme.get(g);
      const rang = x => RANG_QUALITE[qualiteDe(x.system ?? x, defs?.get?.((x.system ?? x)?.cle))] * 1000 + usagesRestants(x.system ?? x, defs?.get?.((x.system ?? x)?.cle));
      if (!avant || rang(o) > rang(avant)) parGamme.set(g, o);
    }
  }
  return parGamme;
}

