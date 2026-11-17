// Fouiller, démonter et récolter l'île (lot 5 du portage du jeu 3D ; contrat §25 ; chiffres et raisons : docs/equilibre-fouille.md).
// Logique pure.
//
// - Un LIEU est un bâtiment (ou une épave, des décombres) d'un GENRE (case, pharmacie, quincaillerie… : registre `genresFouille`).
//   Chaque région a ses lieux de passage, en nombre selon sa population (`lieuxDeLaRegion`), dont une part à l'écart ; un site d'abri
//   se fouille aussi comme un lieu, selon son `genre`. Clés : « <région>:<genre>:<n> » ou « site:<site> ».
// - Plus ou moins pillé, jamais vide (décision de Jordan du 2026-11-15) : un DEGRÉ de pillage de 0 à 1, qui suit ce que la région a
//   déjà perdu de ses vivres (les autres survivants), la place du lieu (pleine ville ou écart), le risque (moins là où les Livides
//   tiennent) et un hasard propre au lieu (± 0,2) ; il ne redescend jamais. Il se lit en cinq mots (`MOTS_PILLAGE`).
// - Le contenu d'un lieu est tiré UNE fois, à la première visite (flux « lieu|<clé> », de la graine du monde) : les lots de sa table,
//   chacun à sa chance (plus `risque` par palier de risque de la région). Le pillage emporte d'abord le convoité (vivres, soins, outils,
//   armes, carburant) : 1,1 × degré, au plus 0,9 ; le reste à 0,5 × degré ; un lot resté est entamé de la moitié de cette chance. Il
//   reste toujours au moins un lot (le plus petit d'un lot non convoité). Quand le degré monte entre deux visites, seul l'écart s'applique.
// - Fouiller prend une part du lieu (les quarts-personne faits sur le travail qu'il demande) ; les objets trouvés se comptent en
//   ressources de Fénoir (registre `objetsFouille` : `par` objets pour une unité, au hasard près) ; ce qui se pille se prend sur les
//   réserves de la région (un lieu ne rend pas ce que la région n'a plus), sauf le lot garanti.
// - Démonter (décision du 2026-11-15) : un lieu rend la moitié de ce qu'il a coûté (`demontage` de son genre), au fur et à mesure du
//   travail, avec du bruit ; un lieu pas encore fouillé en entier se fouille d'abord. Une installation de l'abri rend la moitié de ses
//   coûts, tous niveaux compris, pour un tiers de son travail.
// - Les bêtes vivantes (décision du 2026-11-16) : une par lieu au plus, chance × (1 − degré)² ; il faut l'outil qui la prend (le champ
//   `capture` d'un équipement), sinon elle file (l'essaim pique et reste). Prise, elle tient quelques quarts hors d'un enclos.
// - La récolte : les gisements des milieux d'une région (registre `milieux`, `gisements` ; `regions[].milieux`), en nombre, qui
//   repoussent (en saison sèche à 0,4 de la vitesse).
// Rien du jeu 3D qui tient au temps réel ou au serveur (gestes, mètres, cycles) : des quarts-personne, des ressources entières.
import { RESSOURCES_PILLABLES, borner } from "./constantes.mjs";
import { liste, indexer, regionDe, siteDe, reservesDepart, niveauDe } from "./contenu.mjs";
import { deriverHasard, chance, entier, arrondiHasard, tirerPoids } from "./hasard.mjs";
import { saisonDuJour } from "./temps.mjs";
import { message } from "./textes.mjs";
// La qualité d'un outil trouvé : une seule règle, celle du lot 6 (ateliers, logique/armes.mjs ; fusion de la vague 3).
import { qualiteTrouvee, qualiteDe, gammesDe } from "./armes.mjs";
// Les bêtes trouvées sont des espèces du vivant (lot 8) : leur outil, leur viande, leur délai hors d'un enclos, leur enclos.
import { especeDe, porterBete } from "./vivant.mjs";
// Démonter lit le matériau d'un niveau (lot 7).
import { materiauDe } from "./ouvrages.mjs";

// ------------------------------------------------------------------ règles
export const MOTS_PILLAGE = ["intact", "a-peine", "deja", "retourne", "sac"];
export const CIBLES_FOUILLES = ["lieu", "demonter", "matieres"];
export const REGLES_FOUILLES = {
  // Le degré : pris × (base + ville × pente) + hasard du lieu − risque × infestation, borné de 0 à 1. pris : la part des vivres de la
  // région (nourriture, eau, médicaments, munitions, carburant) que la région a perdue. ville : 0 (écart isolé) à 1 (pleine ville).
  pillage: { base: 0.6, pente: 0.8, alea: 0.2, risque: 0.03, seuils: [0.15, 0.4, 0.65, 0.85], convoites: ["nourriture", "eau", "medicaments", "munitions", "carburant"] },
  // La place d'un lieu : en ville, 0,3 + 0,15 par point de population (au plus 1) ; à l'écart, 0,1. La part des lieux à l'écart :
  // 0,15 + 0,17 × (5 − population) (Mafate, sans population au jour zéro : tout est à l'écart).
  ville: { base: 0.3, parPopulation: 0.15, ecart: 0.1, partEcart: { base: 0.15, parPoint: 0.17 } },
  // Ce que le pillage emporte (le jeu 3D : 1,1 × degré au plus 0,9 pour le convoité, 0,5 × degré pour le reste ; un lot resté perd la
  // moitié de sa chance d'avoir été emporté).
  emporte: { convoite: 1.1, convoiteMax: 0.9, autre: 0.5, quantite: 0.5 },
  risqueMax: 4,
  // L'allure : le travail fait par quart-personne, et le bruit (comme la fouille d'une région).
  allure: { discret: 0.6, normal: 1, rapide: 1.5 }, bruit: { discret: 0, normal: 1, rapide: 3 },
  // L'abondance des tables (1 : celle du jeu 3D, ramenée en ressources de Fénoir).
  abondance: 1,
  betes: { puissance: 2 },
  // Démonter : sans outil, deux fois plus lent ; une installation rend la moitié de ses coûts, pour un tiers de son travail.
  demontage: { sansOutil: 0.5, outils: ["pied-de-biche", "barre-a-mine", "pelle-pioche", "masse", "tronconneuse", "caisse-a-outils", "marteau", "hache"],
    installation: { rend: 0.5, travail: 1 / 3, ressources: ["materiaux", "pieces", "graines"] },
    // Fusion de la vague 3 (le matériau du lot 7) : ce qu'on reprend d'un niveau selon sa matière. La tôle et le bois sous tôle se
    // démontent comme avant (la moitié) ; la pierre sèche se reprend presque entière ; le bambou, le vacoa et la paille pourrissent ou
    // cassent, le parpaing et le béton se cassent.
    materiau: { "bois-sous-tole": 0.5, "tole-de-recuperation": 0.5, "pierre-seche": 0.75, "bambou-et-vacoa": 0.25, "paille-et-torchis": 0.25, "parpaing-et-beton": 0.25 } },
  // Récolter : sans outil (quand le gisement en demande), deux fois plus lent ; en saison sèche, la repousse à 0,4 de sa vitesse.
  recolte: { sansOutil: 0.5, seche: 0.4 }
  // La qualité d'un outil ou d'une arme trouvé (décision de Jordan du 2026-11-16) : 60 / 30 / 10 % au calme, 43 / 36 / 21 % au
  // palier 4 ; la règle est celle du lot 6 (REGLES_OUTILS.trouvee, qualiteTrouvee de logique/armes.mjs), posée en `qualite`.
};
// ------------------------------------------------------------------ registre
const caches = new WeakMap();
function registre(contenu) {
  if (contenu && typeof contenu === "object" && caches.has(contenu)) return caches.get(contenu);
  const r = {
    genres: new Map(liste(contenu?.genresFouille).map(g => [g.cle, g])),
    objets: new Map(liste(contenu?.objetsFouille).map(o => [o.cle, o])),
    betes: new Map(liste(contenu?.betesTrouvees).map(b => [b.cle, b])),
    gisements: new Map(liste(contenu?.gisements).map(g => [g.cle, g])),
    milieux: new Map(liste(contenu?.milieux).map(m => [m.cle, m]))
  };
  if (contenu && typeof contenu === "object") caches.set(contenu, r);
  return r;
}
export const genresFouille = contenu => [...registre(contenu).genres.values()];
export const genreFouille = (contenu, cle) => registre(contenu).genres.get(cle) ?? null;
export const objetDeFouille = (contenu, cle) => registre(contenu).objets.get(cle) ?? null;
export const beteTrouvee = (contenu, cle) => registre(contenu).betes.get(cle) ?? null;
export const gisementDe = (contenu, cle) => registre(contenu).gisements.get(cle) ?? null;
export const milieuDe = (contenu, cle) => registre(contenu).milieux.get(cle) ?? null;

// L'objet trouvé, vu par le système : { ressource, par } (une ressource, ou le repli d'un équipement que le registre n'a pas) ou
// { equipement } ; convoité ou non.
export function valeurObjetTrouve(contenu, cle) {
  const o = objetDeFouille(contenu, cle);
  if (!o) return { ressource: "", par: 0, equipement: "", convoite: false };
  if (o.equipement) {
    if (indexer(contenu).equipements.has(o.equipement)) return { ressource: "", par: 0, equipement: o.equipement, convoite: Boolean(o.convoite) };
    return { ressource: o.repli?.ressource ?? "", par: Number(o.repli?.par) || 0, equipement: "", convoite: Boolean(o.convoite) };
  }
  return { ressource: o.ressource ?? "", par: Number(o.par) || 0, equipement: "", convoite: Boolean(o.convoite) };
}

// ------------------------------------------------------------------ les lieux d'une région
const a2 = x => Math.round(x * 100) / 100;
// Les régions où passe une route (une route, une piste) : les garages, les stations, les voitures n'existent que là.
export const aUneRoute = region => (region?.voisins ?? []).some(v => ["route", "piste"].includes(v.terrain));
export function nombreDeLieux(genre, region) {
  if (!genre || !region) return 0;
  if (genre.route && !aUneRoute(region)) return 0;
  const n = genre.nombre ?? {};
  return Math.max(0, Math.round((Number(n.base) || 0) + (Number(n.parPopulation) || 0) * (Number(region.population) || 0)));
}
export const partEcart = region => borner(REGLES_FOUILLES.ville.partEcart.base + REGLES_FOUILLES.ville.partEcart.parPoint * (5 - (Number(region?.population) || 0)), 0, 1);
// Les lieux de passage d'un genre : n de 1 à N ; les derniers (part à l'écart) sont à l'écart. -> [{ cle, genre, n, ecart }]
export function lieuxDuGenre(contenu, regionCle, genreCle) {
  const region = regionDe(contenu, regionCle), genre = genreFouille(contenu, genreCle);
  const N = nombreDeLieux(genre, region);
  const ecarts = Math.round(N * partEcart(region));
  return Array.from({ length: N }, (_, i) => ({ cle: `${regionCle}:${genreCle}:${i + 1}`, region: regionCle, genre: genreCle, n: i + 1, ecart: i >= N - ecarts }));
}
// -> { genre: nombre } (les genres qui ont au moins un lieu)
export function lieuxDeLaRegion(contenu, regionCle) {
  const region = regionDe(contenu, regionCle);
  return Object.fromEntries(genresFouille(contenu).map(g => [g.cle, nombreDeLieux(g, region)]).filter(([, n]) => n > 0));
}
// Une clé de lieu -> { cle, region, genre, n, ecart, site } | null
export function lieuDeCle(contenu, cle) {
  const k = String(cle ?? "");
  if (k.startsWith("site:")) {
    const s = siteDe(contenu, k.slice(5));
    if (!s || !s.genre || !genreFouille(contenu, s.genre)) return null;
    return { cle: k, region: s.region, genre: s.genre, n: 0, ecart: Boolean(s.ecart), site: s.cle };
  }
  const [region, genre, n] = k.split(":");
  const l = lieuxDuGenre(contenu, region, genre).find(x => x.n === Number(n));
  return l ? { ...l, site: "" } : null;
}
// La place d'un lieu : 0 (écart isolé) à 1 (pleine ville).
export function villeDuLieu(lieu, region) {
  const V = REGLES_FOUILLES.ville;
  return lieu?.ecart ? V.ecart : borner(V.base + V.parPopulation * (Number(region?.population) || 0), 0, 1);
}
// La part des vivres de la région déjà perdue (0 au jour zéro).
export function prisDeLaRegion(regionDef, regMonde) {
  const ini = reservesDepart(regionDef);
  const C = REGLES_FOUILLES.pillage.convoites;
  const a = C.reduce((s, r) => s + (ini[r] || 0), 0);
  if (!a) return 1;
  const b = C.reduce((s, r) => s + Math.max(0, Number(regMonde?.pillage?.[r]) || 0), 0);
  return borner(1 - b / a, 0, 1);
}
// Le degré de pillage d'un lieu aujourd'hui (sans le plancher de ce qu'il était : voir fouillerLieu).
export function degrePillage({ graine = "", lieu, regionDef, regMonde }) {
  const P = REGLES_FOUILLES.pillage;
  const alea = (deriverHasard(graine, "pillage", lieu.cle)() * 2 - 1) * P.alea;
  const d = prisDeLaRegion(regionDef, regMonde) * (P.base + P.pente * villeDuLieu(lieu, regionDef)) + alea - P.risque * (Number(regMonde?.infestation) || 0);
  return a2(borner(d, 0, 1));
}
export const motDuPillage = degre => MOTS_PILLAGE[REGLES_FOUILLES.pillage.seuils.filter(s => Number(degre) >= s).length];
export const palierDeRisque = infestation => borner(Math.floor(Number(infestation) || 0), 0, REGLES_FOUILLES.risqueMax);

// ------------------------------------------------------------------ le contenu d'un lieu
const chanceEmportee = (convoite, degre) => {
  const E = REGLES_FOUILLES.emporte;
  return convoite ? Math.min(E.convoiteMax, E.convoite * degre) : E.autre * degre;
};
// Les lots du lieu au calme (avant tout pillage). -> [{ objet, q }]
export function tirerLotsDuLieu(contenu, genre, hasard, palier = 0) {
  const lots = [];
  for (const l of genre?.lots ?? []) {
    if (!chance(Math.min(1, (Number(l.chance) || 0) + (Number(l.risque) || 0) * palier), hasard)) continue;
    const q = entier(Number(l.q?.[0]) || 1, Number(l.q?.[1]) || Number(l.q?.[0]) || 1, hasard);
    if (q > 0) lots.push({ objet: l.objet, q });
  }
  return lots;
}
// Le pillage de d0 à d1 (d1 > d0) : ce qui est emporté entre les deux. Le plancher : un lot garanti. -> lots
export function pillerLots(contenu, genre, lots, d0, d1, hasard) {
  if (!(d1 > d0)) return lots.map(l => ({ ...l }));
  const reste = [];
  for (const l of lots) {
    const conv = valeurObjetTrouve(contenu, l.objet).convoite;
    const p0 = chanceEmportee(conv, d0), p1 = chanceEmportee(conv, d1);
    const p = p0 >= 1 ? 1 : (p1 - p0) / (1 - p0);
    if (chance(p, hasard)) continue;
    const q = Math.max(1, Math.round(l.q * (1 - REGLES_FOUILLES.emporte.quantite * p)));
    reste.push({ objet: l.objet, q, ...(l.garanti ? { garanti: true } : {}) });
  }
  return reste.length ? reste : lotGaranti(contenu, genre, hasard);
}
// Le lot qui reste toujours : tiré parmi les lots non convoités de la table (selon leur chance), à sa plus petite quantité ; d'une table
// qui n'a que du convoité, l'un d'eux.
export function lotGaranti(contenu, genre, hasard) {
  const lots = genre?.lots ?? [];
  if (!lots.length) return [];
  const autres = lots.filter(l => !valeurObjetTrouve(contenu, l.objet).convoite);
  const l = tirerPoids((autres.length ? autres : lots).map(x => ({ ...x, poids: Number(x.chance) || 0.01 })), hasard) ?? lots[0];
  return [{ objet: l.objet, q: Math.max(1, Number(l.q?.[0]) || 1), garanti: true }];
}
// La bête du lieu (une au plus : la première de la liste qui y est), au calme. -> { bete, nombre } | null
export function tirerBeteDuLieu(contenu, genre, hasard) {
  for (const b of genre?.betes ?? []) {
    if (!chance(Number(b.chance) || 0, hasard)) continue;
    const def = beteTrouvee(contenu, b.bete);
    if (!def) continue;
    return { bete: b.bete, nombre: entier(Number(def.nombre?.[0]) || 1, Number(def.nombre?.[1]) || 1, hasard) };
  }
  return null;
}

// Les objets pris -> { butin: { ressource: n }, equipements: [{ cle, n }], garantis: [ressource] } (arrondi au hasard par ressource ; le
// lot garanti d'un lieu pillé compte au moins une unité : « jamais vide »).
export function convertirObjets(contenu, pris, hasard) {
  const brut = {}, equipements = {}, garantis = new Set();
  for (const { objet, q, garanti } of pris) {
    const v = valeurObjetTrouve(contenu, objet);
    if (v.equipement) equipements[v.equipement] = (equipements[v.equipement] ?? 0) + q;
    else if (v.ressource && v.par > 0) { brut[v.ressource] = (brut[v.ressource] ?? 0) + q / v.par; if (garanti) garantis.add(v.ressource); }
  }
  const butin = {};
  for (const [r, x] of Object.entries(brut)) { const n = Math.max(garantis.has(r) ? 1 : 0, arrondiHasard(x * REGLES_FOUILLES.abondance, hasard)); if (n > 0) butin[r] = n; }
  return { butin, equipements: Object.entries(equipements).map(([cle, n]) => ({ cle, n })), garantis: [...garantis] };
}

// ------------------------------------------------------------------ les lieux dans le monde (secret)
export const lieuxDuMonde = monde => (monde?.lieux && typeof monde.lieux === "object" ? monde.lieux : {});
// Le lieu à fouiller : une clé, un site, ou le prochain lieu d'un genre (à l'écart si demandé), pas encore fini ni démonté ; ceux qu'on
// a commencés d'abord. -> lieu | null
export function choisirLieu(monde, contenu, { region, lieu = "", site = "", genre = "", ecart = null, pour = "fouille" } = {}) {
  if (lieu) return lieuDeCle(contenu, lieu);
  if (site) return lieuDeCle(contenu, `site:${site}`);
  if (!genre) return null;
  const m = lieuxDuMonde(monde);
  const libres = lieuxDuGenre(contenu, region, genre).filter(l => !m[l.cle]?.demonte && (pour === "demontage" || !m[l.cle]?.fini) && (ecart === null || l.ecart === Boolean(ecart)));
  const commences = libres.filter(l => m[l.cle] && (pour === "demontage" ? Number(m[l.cle].demontage?.fait) > 0 : Number(m[l.cle].fait) > 0));
  return commences[0] ? { ...commences[0], site: "" } : libres[0] ? { ...libres[0], site: "" } : null;
}

// La visite d'un lieu : on le crée (tirage de son contenu) ou l'on applique le pillage depuis la dernière visite. -> { entree, nouveau }
export function visiterLieu(monde, contenu, lieu, { jour = 0 } = {}) {
  const regMonde = monde?.regions?.[lieu.region];
  const regionDef = regionDe(contenu, lieu.region);
  const genre = genreFouille(contenu, lieu.genre);
  const graine = String(monde?.graine ?? "");
  const deja = lieuxDuMonde(monde)[lieu.cle];
  const aujourdhui = degrePillage({ graine, lieu, regionDef, regMonde });
  if (!deja) {
    const h = deriverHasard(graine, "lieu", lieu.cle);
    const palier = palierDeRisque(regMonde?.infestation);
    const calme = tirerLotsDuLieu(contenu, genre, h, palier);
    const bete = tirerBeteDuLieu(contenu, genre, h);
    const lots = pillerLots(contenu, genre, calme.length ? calme : lotGaranti(contenu, genre, h), 0, aujourdhui, h);
    // Les bêtes partent les premières : chance × (1 − degré)².
    const reste = bete && chance((1 - aujourdhui) ** REGLES_FOUILLES.betes.puissance, h) ? bete : null;
    return { nouveau: true, entree: { region: lieu.region, genre: lieu.genre, n: lieu.n, ecart: lieu.ecart, site: lieu.site ?? "", degre: aujourdhui, lots, bete: reste,
      fait: 0, travail: Number(genre?.travail) || 1, fini: false, demonte: false, demontage: null, vuLe: jour, visites: 0 } };
  }
  const entree = structuredClone(deja);
  if (aujourdhui > entree.degre && !entree.fini) {
    const h = deriverHasard(graine, "lieu", lieu.cle, "repille", jour);
    entree.lots = pillerLots(contenu, genre, entree.lots, entree.degre, aujourdhui, h);
    if (entree.bete && !chance(((1 - aujourdhui) / Math.max(0.01, 1 - entree.degre)) ** REGLES_FOUILLES.betes.puissance, h)) entree.bete = null;
  }
  entree.degre = Math.max(entree.degre, aujourdhui);
  entree.vuLe = jour;
  return { nouveau: false, entree };
}

// Ce que le groupe sait d'un lieu (public) : jamais le degré, ni ce qui reste dedans.
export const lieuPublic = (cle, e) => ({ cle, region: e.region, genre: e.genre, n: e.n, ecart: Boolean(e.ecart), site: e.site ?? "", mot: motDuPillage(e.degre),
  fait: a2(e.fait), travail: e.travail, fini: Boolean(e.fini), demonte: Boolean(e.demonte), demontage: e.demontage ? { fait: a2(e.demontage.fait), travail: e.demontage.travail } : null,
  vuLe: e.vuLe ?? null });

// Qui prend quelle bête : les équipements des fouilleurs dont le champ `capture` la nomme, ou nomme son espèce (fusion de la vague 3 :
// le champ est celui du lot 8, par espèce ; le porcelet trouvé ici est un cochon, le veau moka un bœuf moka).
export function prendBete(contenu, equipements = [], bete) {
  const idx = indexer(contenu).equipements;
  const espece = especeDe(contenu, bete)?.cle ?? bete;
  return (equipements ?? []).find(c => (idx.get(c)?.capture ?? []).some(x => x === bete || x === espece)) ?? null;
}

// ------------------------------------------------------------------ fouiller un lieu
// equipements : les clés des équipements des fouilleurs (pour prendre une bête). -> { ok, motif, monde, lieu (public), cle, trouve,
// butin, equipements, bete: { cle, nombre, issue: "prise" | "file" | "pique", outil } | null, culte, travail (quarts-personne faits), bruit }
export function fouillerLieu(monde, contenu, hasard, { region, lieu = "", site = "", genre = "", ecart = null, membres = 1, quarts = 1, prudence = "normal", jour = 0, equipements = [] } = {}) {
  const R = REGLES_FOUILLES;
  const refus = (cle, params, texte) => ({ ok: false, motif: message(cle, params, texte), monde, lieu: null, cle: "", trouve: [], butin: {}, equipements: [], bete: null, culte: false, travail: 0, bruit: 0 });
  const l = choisirLieu(monde, contenu, { region, lieu, site, genre, ecart });
  if (!l) return genre && !genreFouille(contenu, genre) ? refus("lieu-genre-inconnu", { genre }, `genre de lieu inconnu : ${genre}`)
    : refus("lieu-aucun", { genre }, "plus aucun lieu de ce genre à fouiller ici");
  if (l.region !== region) return refus("lieu-ailleurs", {}, "ce lieu n'est pas dans la région");
  const nouveau = structuredClone(monde ?? {});
  const v = visiterLieu(nouveau, contenu, l, { jour });
  const e = v.entree;
  if (e.demonte) return refus("lieu-demonte-deja", {}, "ce lieu a été démonté");
  if (e.fini) return refus("lieu-fini", {}, "plus rien à fouiller ici");
  const n = Math.max(0, Number(membres) || 0) * Math.max(0, Number(quarts) || 0) * (R.allure[prudence] ?? 1);
  const resteTravail = Math.max(0, e.travail - e.fait);
  const part = resteTravail > 0 ? Math.min(1, n / resteTravail) : 1;
  const pris = [], restants = [];
  for (const lot of e.lots) {
    const q = part >= 1 ? lot.q : Math.min(lot.q, arrondiHasard(lot.q * part, hasard));
    if (q > 0) pris.push({ objet: lot.objet, q, ...(lot.garanti ? { garanti: true } : {}) });
    if (lot.q - q > 0) restants.push({ objet: lot.objet, q: lot.q - q, ...(lot.garanti ? { garanti: true } : {}) });
  }
  e.lots = restants;
  e.fait = Math.min(e.travail, e.fait + n);
  e.visites = (Number(e.visites) || 0) + 1;
  if (e.fait >= e.travail - 1e-9 || !restants.length) { e.fini = true; e.fait = e.travail; e.lots = []; }
  // Les ressources pillables viennent des réserves de la région (au plus ce qu'il en reste).
  const conv = convertirObjets(contenu, pris, hasard);
  const reg = nouveau.regions?.[l.region];
  if (reg?.pillage) {
    for (const [r, q] of Object.entries(conv.butin)) {
      if (!RESSOURCES_PILLABLES.includes(r)) continue;
      const dispo = Math.max(0, Math.floor(Number(reg.pillage[r]) || 0));
      const garde = conv.garantis.includes(r) ? Math.max(1, Math.min(q, dispo)) : Math.min(q, dispo);
      if (garde > 0) conv.butin[r] = garde; else delete conv.butin[r];
      reg.pillage[r] = Math.max(0, (Number(reg.pillage[r]) || 0) - garde);
    }
  }
  // Jamais vide : un lieu fouillé jusqu'au bout rend au moins une unité, celle du lot qui valait le plus (s'il n'a rien rendu d'autre).
  e.rendu = (Number(e.rendu) || 0) + Object.values(conv.butin).reduce((t, x) => t + x, 0) + conv.equipements.length;
  if (e.fini && e.rendu === 0 && pris.length) {
    const vaut = l => { const v = valeurObjetTrouve(contenu, l.objet); return v.ressource && v.par > 0 ? l.q / v.par : 0; };
    const meilleur = [...pris].sort((a, b) => vaut(b) - vaut(a))[0];
    const r = valeurObjetTrouve(contenu, meilleur.objet).ressource;
    if (r) {
      conv.butin[r] = 1; e.rendu = 1;
      if (reg?.pillage && RESSOURCES_PILLABLES.includes(r)) reg.pillage[r] = Math.max(0, (Number(reg.pillage[r]) || 0) - 1);
    }
  }
  // La bête : rencontrée à la première fouille du lieu ; un essaim resté se prend plus tard, quand on revient avec l'enfumoir.
  let bete = null;
  if (e.bete && (e.visites === 1 || prendBete(contenu, equipements, e.bete.bete))) {
    const def = beteTrouvee(contenu, e.bete.bete);
    const outil = prendBete(contenu, equipements, e.bete.bete);
    if (outil) { bete = { cle: e.bete.bete, nombre: e.bete.nombre, issue: "prise", outil, tient: Number(def?.tient) || 4 }; e.bete = null; }
    else if (def?.sansOutil === "pique") bete = { cle: e.bete.bete, nombre: e.bete.nombre, issue: "pique", outil: "", tient: 0 };
    else { bete = { cle: e.bete.bete, nombre: e.bete.nombre, issue: "file", outil: "", tient: 0 }; e.bete = null; }
  }
  nouveau.lieux = { ...lieuxDuMonde(nouveau), [l.cle]: e };
  const g = genreFouille(contenu, l.genre);
  // La qualité de chaque outil ou arme trouvé (lot 6) : une par objet.
  const palier = palierDeRisque(reg?.infestation);
  for (const x of conv.equipements) x.qualites = Array.from({ length: x.n }, () => qualiteTrouvee(palier, hasard));
  return { ok: true, motif: null, monde: nouveau, cle: l.cle, lieu: lieuPublic(l.cle, e), trouve: pris, butin: conv.butin, equipements: conv.equipements, bete,
    culte: Boolean(g?.culte), travail: n, bruit: R.bruit[prudence] ?? 1 };
}

// L'objet que devient un outil trouvé selon sa qualité tirée (fusion de la vague 3, jointure du lot 6) : la fiche de la même gamme et
// de cette qualité (« marteau-de-fortune », « hache-de-recuperation » ; le forgé est la fiche de base), sinon la fiche trouvée, à
// laquelle on pose le champ `qualite`. -> { cle, qualite } (qualite : à poser sur l'objet, ou "" quand la fiche la porte déjà)
export function outilDeQualite(contenu, cle, qualite = "") {
  const idx = indexer(contenu).equipements;
  const def = idx.get(cle);
  if (!def || !qualite) return { cle, qualite: "" };
  if (qualiteDe(def) === qualite) return { cle, qualite: "" };
  const gamme = gammesDe(def)[0];
  if (gamme) {
    const base = cle.replace(/-(de-fortune|de-recuperation)$/, "");
    const voulue = qualite === "forge" ? base : `${base}-de-${qualite}`;
    const autre = idx.get(voulue);
    if (autre && qualiteDe(autre) === qualite && gammesDe(autre).includes(gamme)) return { cle: voulue, qualite: "" };
  }
  return { cle, qualite };
}

// ------------------------------------------------------------------ démonter
// outil : un outil qui démonte (REGLES_FOUILLES.demontage.outils) parmi les équipements des démonteurs. Un lieu pas encore fouillé en
// entier se fouille d'abord. -> { ok, motif, monde, lieu, cle, fouille (le résultat de fouillerLieu ou null), butin, equipements, trouve,
// bete, rendu: { materiaux, pieces }, travail, bruit, fini }
export function demonterLieu(monde, contenu, hasard, { region, lieu = "", site = "", genre = "", ecart = null, membres = 1, quarts = 1, prudence = "normal", jour = 0, equipements = [] } = {}) {
  const R = REGLES_FOUILLES;
  const refus = (cle, params, texte) => ({ ok: false, motif: message(cle, params, texte), monde, lieu: null, cle: "", fouille: null, butin: {}, equipements: [], trouve: [], bete: null,
    rendu: {}, travail: 0, bruit: 0, fini: false });
  const l = choisirLieu(monde, contenu, { region, lieu, site, genre, ecart, pour: "demontage" });
  if (!l) return genre && !genreFouille(contenu, genre) ? refus("lieu-genre-inconnu", { genre }, `genre de lieu inconnu : ${genre}`)
    : refus("lieu-aucun", { genre }, "plus aucun lieu de ce genre à démonter ici");
  if (l.region !== region) return refus("lieu-ailleurs", {}, "ce lieu n'est pas dans la région");
  const g = genreFouille(contenu, l.genre);
  if (!g?.demontage) return refus("lieu-indemontable", {}, "ce lieu ne se démonte pas");
  if (l.site) return refus("lieu-site", {}, "un site d'abri ne se démonte pas : on s'y installe");
  let nouveau = structuredClone(monde ?? {});
  let total = Math.max(0, Number(membres) || 0) * Math.max(0, Number(quarts) || 0);
  let fouille = null;
  const v = visiterLieu(nouveau, contenu, l, { jour });
  if (v.entree.demonte) return refus("lieu-demonte-deja", {}, "ce lieu a déjà été démonté");
  nouveau.lieux = { ...lieuxDuMonde(nouveau), [l.cle]: v.entree };
  // D'abord finir la fouille (au rythme normal).
  if (!v.entree.fini) {
    const besoin = Math.max(0, v.entree.travail - v.entree.fait);
    const pourFouille = Math.min(total, besoin);
    if (pourFouille > 0) {
      fouille = fouillerLieu(nouveau, contenu, hasard, { region, lieu: l.cle, membres: 1, quarts: pourFouille, prudence: "normal", jour, equipements });
      if (fouille.ok) nouveau = fouille.monde;
      total -= pourFouille;
    }
  }
  const e = structuredClone(lieuxDuMonde(nouveau)[l.cle]);
  const outil = (equipements ?? []).some(c => R.demontage.outils.includes(c));
  const fait = total * (outil ? 1 : R.demontage.sansOutil);
  const D = g.demontage;
  e.demontage = e.demontage ?? { fait: 0, travail: Number(D.travail) || 1, rendu: { materiaux: 0, pieces: 0 } };
  e.demontage.fait = Math.min(e.demontage.travail, e.demontage.fait + fait);
  const rendu = {};
  for (const r of ["materiaux", "pieces"]) {
    const du = Math.floor((Number(D.rend?.[r]) || 0) * e.demontage.fait / e.demontage.travail);
    const n = Math.max(0, du - (Number(e.demontage.rendu[r]) || 0));
    if (n > 0) { rendu[r] = n; e.demontage.rendu[r] = du; }
  }
  const fini = e.demontage.fait >= e.demontage.travail - 1e-9;
  if (fini) { e.demonte = true; e.fini = true; e.lots = []; e.bete = null; }
  nouveau.lieux = { ...lieuxDuMonde(nouveau), [l.cle]: e };
  const butin = { ...(fouille?.ok ? fouille.butin : {}) };
  for (const [r, n] of Object.entries(rendu)) butin[r] = (butin[r] ?? 0) + n;
  return { ok: true, motif: null, monde: nouveau, cle: l.cle, lieu: lieuPublic(l.cle, e), fouille: fouille?.ok ? fouille : null, butin,
    equipements: fouille?.ok ? fouille.equipements : [], trouve: fouille?.ok ? fouille.trouve : [], bete: fouille?.ok ? fouille.bete : null, culte: Boolean(g.culte),
    rendu, travail: fait, outil, bruit: total > 0 ? (Number(D.bruit) || 1) : (fouille?.bruit ?? 0), fini };
}

// Démonter une installation de l'abri : une part de ses coûts selon le matériau de chaque niveau (la moitié pour le bois sous tôle et
// la tôle, comme avant ; tous les niveaux jusqu'au sien ; les matières de l'île reviennent en matériaux), pour un tiers de son
// travail. -> { rend: { ressource: n }, travail (quarts-personne) }
export function demontageInstallation(instance, def) {
  const I = REGLES_FOUILLES.demontage.installation;
  const niveau = Math.max(0, Number(instance?.niveau) || 0);
  const somme = {};
  let travail = 0;
  for (let k = 1; k <= niveau; k++) {
    const c = niveauDe(def, k)?.cout ?? {};
    const part = REGLES_FOUILLES.demontage.materiau[materiauDe(def, k)] ?? I.rend;
    for (const [r, q] of Object.entries(c)) {
      if (r === "travail") { travail += Number(q) || 0; continue; }
      const cible = r === "ile" ? "materiaux" : r;
      if (!I.ressources.includes(cible)) continue;
      somme[cible] = (somme[cible] ?? 0) + (Number(q) || 0) * part;
    }
  }
  const rend = {};
  for (const [r, q] of Object.entries(somme)) { const n = Math.floor(q + 1e-9); if (n > 0) rend[r] = n; }
  return { rend, travail: Math.max(1, Math.ceil(travail * I.travail)) };
}

// ------------------------------------------------------------------ récolter
// Les gisements d'une région : { gisement: nombre } (la somme des parts de ses milieux ; l'altitude borne certains).
export function gisementsDeRegion(contenu, regionCle) {
  const region = regionDe(contenu, regionCle);
  const sortie = {};
  for (const m of region?.milieux ?? []) {
    for (const { gisement, part } of milieuDe(contenu, m)?.gisements ?? []) {
      const g = gisementDe(contenu, gisement);
      if (!g) continue;
      if (g.altitudeMax && Number(region.altitude) > Number(g.altitudeMax)) continue;
      sortie[gisement] = (sortie[gisement] ?? 0) + (Number(part) || 0);
    }
  }
  return sortie;
}
export const recoltable = g => Boolean(g && !g.renvoi && (g.produits ?? []).length);
// Ce qui est pris et pas encore revenu : monde.gisements[région][gisement] = [jour de retour].
export function gisementsDisponibles(monde, contenu, regionCle, jour = 0) {
  const tous = gisementsDeRegion(contenu, regionCle);
  const pris = monde?.gisements?.[regionCle] ?? {};
  return Object.fromEntries(Object.entries(tous).map(([g, n]) => [g, Math.max(0, n - (pris[g] ?? []).filter(j => Number(j) > jour).length)]));
}
// -> { ok, motif, monde, gisement, pris (gisements), trouve, butin, bruit, restants }
export function recolterGisement(monde, contenu, hasard, { region, gisement = "", membres = 1, quarts = 1, jour = 0, dateDepart, equipements = [] } = {}) {
  const R = REGLES_FOUILLES.recolte;
  const refus = (cle, params, texte) => ({ ok: false, motif: message(cle, params, texte), monde, gisement, pris: 0, trouve: [], butin: {}, bruit: 0, restants: 0 });
  const dispo = gisementsDisponibles(monde, contenu, region, jour);
  const cle = gisement || Object.entries(dispo).filter(([g, n]) => n > 0 && recoltable(gisementDe(contenu, g))).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0]?.[0] || "";
  const g = gisementDe(contenu, cle);
  if (!g) return refus("gisement-aucun", {}, "aucun gisement à récolter ici");
  if (!recoltable(g)) return refus("gisement-renvoi", { gisement: g.nom, renvoi: g.renvoi }, `${g.nom} : il se prend autrement (${g.renvoi})`);
  if (!(dispo[cle] > 0)) return refus("gisement-epuise", { gisement: g.nom }, `${g.nom} : plus rien à récolter ici pour l'instant`);
  const outil = !(g.outils ?? []).length || (equipements ?? []).some(c => g.outils.includes(c));
  const capacite = Math.max(0, Number(membres) || 0) * Math.max(0, Number(quarts) || 0) * (Number(g.parQuart) || 1) * (outil ? 1 : R.sansOutil);
  const n = Math.min(dispo[cle], arrondiHasard(capacite, hasard));
  if (n <= 0) return refus("gisement-rien", { gisement: g.nom }, `${g.nom} : pas le temps d'en tirer quoi que ce soit`);
  const trouve = {};
  for (let i = 0; i < n; i++) for (const p of g.produits) { const q = entier(Number(p.q[0]) || 0, Number(p.q[1]) || 0, hasard); if (q > 0) trouve[p.objet] = (trouve[p.objet] ?? 0) + q; }
  const liste = Object.entries(trouve).map(([objet, q]) => ({ objet, q }));
  const { butin } = convertirObjets(contenu, liste, hasard);
  const vitesse = saisonDuJour(jour, dateDepart) === "seche" ? R.seche : 1;
  const retour = jour + Math.max(1, Math.ceil((Number(g.repousse) || 1) / vitesse));
  const nouveau = structuredClone(monde ?? {});
  const parRegion = { ...(nouveau.gisements?.[region] ?? {}) };
  parRegion[cle] = [...(parRegion[cle] ?? []).filter(j => Number(j) > jour), ...Array(n).fill(retour)];
  nouveau.gisements = { ...(nouveau.gisements ?? {}), [region]: parRegion };
  return { ok: true, motif: null, monde: nouveau, gisement: cle, pris: n, trouve: liste, butin, bruit: Number(g.bruit) || 0, restants: dispo[cle] - n, retour, outil };
}

// ------------------------------------------------------------------ les bêtes prises
// Fusion de la vague 3 : une seule liste de bêtes portées, groupe.betes, à la forme du lot 8 (logique/vivant.mjs : porterBete,
// betesPortees, betesQuiMeurent) = [{ id, cle (l'espèce ou son alias), nombre, prisLe (quart), jusqua (quart), enclos: "", abri: "",
// source }]. Une seule expiration, celle du lot 8 (betesQuiMeurent, dans avancer, à chaque quart). Mettre à l'enclos, c'est
// mettreEnEnclos du lot 8 : la bête rejoint le cheptel de son espèce et quitte la liste (l'ancien « enclore » du lot 5 n'existe plus).
// Le délai hors d'un enclos et la viande sont ceux de l'espèce.
export const betesDuGroupe = etat => (Array.isArray(etat?.groupe?.betes) ? etat.groupe.betes : []);
export function ajouterBete(etat, { cle, nombre = 1, quart = 0, tient = 0, id = "", contenu = null } = {}) {
  const e = structuredClone(etat);
  const x = porterBete(betesDuGroupe(e), { espece: cle, nombre: Math.max(1, Number(nombre) || 1), quart, source: "fouille", contenu: contenu ?? {} });
  const b = { ...x.bete, ...(id ? { id } : {}), ...(Number(tient) > 0 ? { jusqua: quart + Math.floor(Number(tient)) } : {}) };
  e.groupe = { ...e.groupe, betes: [...betesDuGroupe(e), b] };
  return { etat: e, bete: b };
}
// Abattre (la viande de l'espèce) ou relâcher : la bête quitte le groupe. -> { ok, etat, viande }
export function retirerBete(etat, contenu, id, { abattre = false } = {}) {
  const b = betesDuGroupe(etat).find(x => x.id === id);
  if (!b) return { ok: false, motif: message("bete-inconnue", {}, "bête inconnue"), etat, viande: 0 };
  const e = structuredClone(etat);
  e.groupe.betes = betesDuGroupe(e).filter(x => x.id !== id);
  const viande = Math.floor((Number(b.nombre) || 0) * (Number(especeDe(contenu, b.cle)?.viande) || 0) + 1e-9);
  return { ok: true, motif: null, etat: e, viande: abattre ? viande : 0, bete: b };
}

// ------------------------------------------------------------------ vérification du registre (fabricant, essais)
export function erreursFouilles(contenu) {
  const erreurs = [];
  const e = t => erreurs.push(t);
  const R = registre(contenu);
  const idx = indexer(contenu);
  for (const o of R.objets.values()) {
    if (o.equipement) { if (!o.repli?.ressource || !(Number(o.repli.par) > 0)) e(`objet de fouille ${o.cle} : repli manquant`); }
    else if (o.ressource && !(Number(o.par) > 0)) e(`objet de fouille ${o.cle} : par manquant`);
  }
  for (const g of R.genres.values()) {
    if (!(Number(g.travail) >= 1)) e(`genre ${g.cle} : travail`);
    if (!(g.lots ?? []).length) e(`genre ${g.cle} : aucun lot`);
    for (const l of g.lots ?? []) {
      if (!R.objets.has(l.objet)) e(`genre ${g.cle} : objet inconnu ${l.objet}`);
      if (!(Number(l.chance) > 0 && Number(l.chance) <= 1)) e(`genre ${g.cle} : chance de ${l.objet}`);
      if (!(Number(l.q?.[0]) >= 1 && Number(l.q?.[1]) >= Number(l.q?.[0]))) e(`genre ${g.cle} : quantité de ${l.objet}`);
    }
    for (const b of g.betes ?? []) if (!R.betes.has(b.bete)) e(`genre ${g.cle} : bête inconnue ${b.bete}`);
    if (g.culte && (g.lots ?? []).some(l => valeurObjetTrouve(contenu, l.objet).convoite && !["eau"].includes(objetDeFouille(contenu, l.objet)?.ressource)))
      e(`genre ${g.cle} : un lieu de culte ne rend ni outil, ni arme, ni rien de convoité hors l'eau`);
    if (g.demontage && !(Number(g.demontage.travail) >= 1)) e(`genre ${g.cle} : travail du démontage`);
  }
  for (const b of R.betes.values()) for (const i of b.enclos ?? []) if (!idx.installations.has(i)) e(`bête ${b.cle} : enclos inconnu ${i}`);
  for (const g of R.gisements.values()) for (const p of g.produits ?? []) if (!R.objets.has(p.objet)) e(`gisement ${g.cle} : objet inconnu ${p.objet}`);
  for (const m of R.milieux.values()) for (const x of m.gisements ?? []) if (!R.gisements.has(x.gisement)) e(`milieu ${m.cle} : gisement inconnu ${x.gisement}`);
  for (const r of liste(contenu?.regions)) for (const m of r.milieux ?? []) if (!R.milieux.has(m)) e(`région ${r.cle} : milieu inconnu ${m}`);
  for (const s of liste(contenu?.sites)) if (s.genre && !R.genres.has(s.genre)) e(`site ${s.cle} : genre inconnu ${s.genre}`);
  return erreurs;
}
