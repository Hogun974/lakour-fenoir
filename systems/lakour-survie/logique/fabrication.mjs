// L'atelier de fabrication (contrat §9, repris de l'établi de Warcraft ; lot 6 « ateliers », contrat §24). Logique pure.
//
// Recette (contenu `recettes`) : { cle, nom, cout: { materiaux, pieces, … }, travail (quarts-personne), competence, difficulte,
//   requiert: { savoirs: [cle], installation: cle | { cle, niveau } | { metier, niveau } }, produit: { equipement: cle | ressource: cle, n }
//   | { traitement: "eau", jours } } ; et, depuis le lot 6 (tout est facultatif, une recette d'avant marche comme avant) :
//   sac (se fait depuis le sac, n'importe où, même en route), lumiere (demande de la lumière la nuit), outils ([gamme] qu'il faut
//   avoir en main : armes.mjs), objets ([{ cle, n }] : des objets faits ou trouvés que la recette consomme, une matière travaillée
//   comme le charbon de bois, ou l'arme qu'on remet en état), bruit (ce que le travail ajoute au bruit de l'abri), metier (la famille
//   d'atelier), arbre (lontan ou moderne) et repond (la recette de l'autre savoir qui répond au même besoin).
//
// Nombres retenus :
// - Le coût est payé en entier au départ ; le travail dure `travail` quarts-personne (÷ bras × vitesse de l'atelier, au supérieur).
// - Test de la compétence de la recette à sa difficulté. Réussite : le produit (n) ; les objets demandés sont consommés. Marge ≥ 2 et
//   produit en ressource : +1. Échec : rien, la moitié du coût (arrondie au supérieur) est rendue (le reste est gâché), et les objets
//   demandés restent (la règle de FVTT, gardée : le jeu 3D fait tout perdre, c'est un écart voulu).
// - Une installation requise doit être en service (état < 3) et au niveau demandé (1 par défaut).
// - Lot 6 : un ATELIER DE MÉTIER (`{ metier, niveau }`) est une installation dont la définition porte `metiers` (l'atelier de FVTT
//   sert d'établi, de mécanique et d'électricité ; la cuisine commune et la gazinière de coin du feu). Au-dessus du niveau demandé,
//   l'atelier fait mieux : +1 dé et × 1,5 de vitesse par niveau en plus, au plus 2 (+2 dés, × 2). Le plafond des aides tient
//   (outil + installation ≤ 2 dés : la couche Foundry compte l'écart dans ce plafond).
// - Sans `sac` ni installation, une recette se fait à l'abri. Hors de l'abri, seules les recettes de sac.
import { resoudreTest } from "./des.mjs";
import { couvre, retirerStocks, ajouterStocks, normaliserStocks } from "./ressources.mjs";
import { COMPETENCES, RESSOURCES } from "./constantes.mjs";
import { message } from "./textes.mjs";
import { GAMMES } from "./armes.mjs";

export const BONUS_MARGE_FABRICATION = 2;
// Lot 6 : les neuf métiers d'atelier (le jeu 3D, famille 9 « Fabriquer ») ; ce qu'un niveau d'atelier en plus apporte.
export const METIERS = ["cuisine", "etabli", "forge", "vannerie", "couture", "tisanerie", "mecanique", "electricite", "distillerie"];
export const REGLES_ATELIER = { ecartMax: 2, desParNiveau: 1, vitesseParNiveau: 0.5 };
export const TRAITEMENTS = ["eau"];

const requisInstallation = r => (typeof r === "string" ? { cle: r, niveau: 1 }
  : r?.metier ? { metier: String(r.metier), niveau: Number(r.niveau) || 1 }
    : r ? { cle: r.cle, niveau: Number(r.niveau) || 1 } : null);
export const requisAtelier = recette => requisInstallation(recette?.requiert?.installation);
const n0 = x => Math.max(0, Number(x) || 0);
// Les objets qu'une recette consomme : [{ cle, n }].
export const objetsDeRecette = recette => (Array.isArray(recette?.objets) ? recette.objets : [])
  .map(o => (typeof o === "string" ? { cle: o, n: 1 } : { cle: String(o?.cle ?? ""), n: Math.max(1, Math.floor(Number(o?.n) || 1)) })).filter(o => o.cle);

// Les métiers d'une instance d'installation : écrits sur elle, sinon ceux de sa définition (metiers : Map ou objet cle -> [métier]).
const metiersDe = (i, metiers) => (Array.isArray(i?.metiers) && i.metiers.length ? i.metiers : metiers?.get?.(i?.cle) ?? metiers?.[i?.cle] ?? []);
// Les métiers de chaque installation du contenu : cle -> [métier].
export const metiersDuContenu = installations => Object.fromEntries((Array.isArray(installations) ? installations : Object.values(installations ?? {}))
  .filter(d => Array.isArray(d?.metiers) && d.metiers.length).map(d => [d.cle, [...d.metiers]]));

// L'atelier qui sert une recette : la meilleure installation en service qui fait l'affaire. -> { cle, niveau, requis, ecart, bonus,
// vitesse, horsService } | null (rien ne convient)
export function atelierPour(recette, installations = [], metiers = {}) {
  const ri = requisAtelier(recette);
  if (!ri) return null;
  const R = REGLES_ATELIER;
  const candidates = (installations ?? []).filter(i => (ri.metier ? metiersDe(i, metiers).includes(ri.metier) : i.cle === ri.cle) && Number(i.niveau) >= ri.niveau);
  const enService = candidates.filter(i => Number(i.etat) < 3).sort((a, b) => Number(b.niveau) - Number(a.niveau));
  const i = enService[0] ?? candidates[0];
  if (!i) return null;
  const ecart = ri.metier ? Math.min(R.ecartMax, Math.max(0, Number(i.niveau) - ri.niveau)) : 0;
  return { cle: i.cle, niveau: Number(i.niveau), requis: ri.niveau, ecart, bonus: ecart * R.desParNiveau, vitesse: 1 + ecart * R.vitesseParNiveau,
    horsService: !enService.length };
}

// -> { ok, raisons: [String], motifs: [{ cle, params, texte }] (les mêmes, traduisibles : textes.mjs), cout, quarts, atelier }
// options (lot 6, toutes facultatives) : metiers (cle d'installation -> [métier]), aLAbri (défaut : vrai), nuit, lumiere (une
// lumière est là), outils ([gamme] en main ; null : on ne vérifie pas), objets ({ cle: n } que le groupe a ; null : on ne vérifie pas).
export function peutFabriquer(recette, { stocks = {}, installations = [], savoirs = [], bras = 1, metiers = {}, aLAbri = true, nuit = false, lumiere = true,
  outils = null, objets = null } = {}) {
  const raisons = [], motifs = [];
  const refuser = (texte, cle, params = {}) => { raisons.push(texte); motifs.push(message(cle, params, texte)); };
  if (!recette) { refuser("recette inconnue", "recette-inconnue"); return { ok: false, raisons, motifs, cout: {}, quarts: 0, atelier: null }; }
  for (const s of recette.requiert?.savoirs ?? []) if (!savoirs.includes(s)) refuser(`savoir-faire manquant : ${s}`, "savoir-manquant", { savoir: s });
  const ri = requisAtelier(recette);
  const atelier = ri ? atelierPour(recette, installations, metiers) : null;
  if (ri && !atelier) {
    if (ri.metier) refuser(`il faut un atelier : ${ri.metier} niveau ${ri.niveau}`, "requiert-atelier", { metier: ri.metier, niveau: ri.niveau });
    else refuser(`il faut : ${ri.cle} niveau ${ri.niveau}`, "requiert", { installation: ri.cle, niveau: ri.niveau });
  } else if (atelier?.horsService) refuser(`${atelier.cle} est hors service`, "requiert-hors-service", { installation: atelier.cle });
  if (!aLAbri && !recette.sac) refuser("cela se fait à l'abri, pas depuis le sac", "recette-a-l-abri");
  if (recette.lumiere && nuit && !lumiere) refuser("il faut de la lumière, la nuit", "recette-lumiere");
  if (Array.isArray(outils)) for (const g of recette.outils ?? []) if (!outils.includes(g)) refuser(`il faut en main : ${g}`, "outil-manquant", { outil: g });
  if (objets && typeof objets === "object") {
    for (const o of objetsDeRecette(recette)) if ((Number(objets[o.cle]) || 0) < o.n) refuser(`il faut : ${o.n} ${o.cle}`, "objet-manquant", { objet: o.cle, n: o.n });
  }
  const cout = Object.fromEntries(Object.entries(recette.cout ?? {}).map(([r, q]) => [r, Math.max(0, Number(q) || 0)]));
  if (!couvre(stocks, cout)) {
    const manque = Object.fromEntries(Object.entries(cout).filter(([r, q]) => (Number(stocks?.[r]) || 0) < q).map(([r, q]) => [r, q - (Number(stocks?.[r]) || 0)]));
    refuser(`il manque : ${Object.entries(manque).map(([r, q]) => `${q} ${r}`).join(", ")}`, "manque", { manque });
  }
  return { ok: raisons.length === 0, raisons, motifs, cout, atelier, quarts: quartsDeFabrication(recette, { bras, vitesse: atelier?.vitesse ?? 1 }) };
}
// Les quarts d'une fabrication : travail ÷ (bras × vitesse), au supérieur.
export const quartsDeFabrication = (recette, { bras = 1, vitesse = 1 } = {}) =>
  Math.max(0, Math.ceil(Math.max(0, Number(recette?.travail) || 0) / (Math.max(1, Number(bras) || 1) * Math.max(1, Number(vitesse) || 1)) - 1e-9));

// Fabrique : -> { ok, raisons, motifs, test, stocks, produit: { equipement?, ressource?, traitement?, n | jours } | null, quarts, perdu,
//   consomme: [{ cle, n }] (les objets à retirer, sur une réussite), outils: [gamme] (les outils qui ont servi : un usage chacun),
//   atelier, bruit }
// Un produit en ressource est déjà ajouté aux stocks rendus ; un équipement est rendu à part (objet à créer côté Foundry), comme un
// traitement (l'eau de l'abri traitée pour `jours` jours, posée par la couche Foundry).
export function fabriquer(recette, { stocks = {}, installations = [], savoirs = [], niveau = 0, bonus = 0, malus = 0, forcer = false, bras = 1, hasard = Math.random,
  ...options } = {}) {
  const v = peutFabriquer(recette, { stocks, installations, savoirs, bras, ...options });
  if (!v.ok) {
    return { ok: false, raisons: v.raisons, motifs: v.motifs, test: null, stocks: normaliserStocks(stocks), produit: null, quarts: 0, perdu: {}, consomme: [], outils: [],
      atelier: v.atelier, bruit: 0 };
  }
  const test = resoudreTest({ niveau, difficulte: recette.difficulte ?? "normale", bonus: (Number(bonus) || 0) + (v.atelier?.bonus ?? 0), malus, forcer, hasard });
  let s = retirerStocks(stocks, v.cout).stocks;
  let produit = null, perdu = { ...v.cout }, consomme = [];
  if (test.reussite) {
    perdu = {};
    consomme = objetsDeRecette(recette);
    const n = Math.max(1, Number(recette.produit?.n) || 1);
    if (recette.produit?.ressource) {
      const total = n + (test.marge >= BONUS_MARGE_FABRICATION ? 1 : 0);
      produit = { ressource: recette.produit.ressource, n: total };
      s = ajouterStocks(s, { [recette.produit.ressource]: total });
    } else if (recette.produit?.traitement) {
      produit = { traitement: recette.produit.traitement, jours: Math.max(1, Math.floor(Number(recette.produit.jours) || 1)) };
    } else produit = { equipement: recette.produit?.equipement ?? recette.cle, n };
  } else {
    const rendu = Object.fromEntries(Object.entries(v.cout).map(([r, q]) => [r, Math.ceil(q / 2)]));
    s = ajouterStocks(s, rendu);
    perdu = Object.fromEntries(Object.entries(v.cout).map(([r, q]) => [r, q - rendu[r]]));
  }
  return { ok: true, raisons: [], motifs: [], test, stocks: s, produit, quarts: v.quarts, perdu, consomme, outils: [...(recette.outils ?? [])], atelier: v.atelier,
    bruit: n0(recette.bruit) };
}

// ------------------------------------------------------------------ les remèdes faits à l'atelier (lot 6)
// Un objet de soin fait à la main porte `remede: { afflictions: [cle], bonus (dés au test de soin), remplace (il tient lieu d'un
// médicament) }` : la tisane d'ayapana pour le ventre, celle de citronnelle pour les fièvres, l'attelle pour une fracture… On s'en
// sert une fois. objets : [{ cle, remede } | { system: … }] ; defs : cle -> définition (pour un objet créé avant que le contenu ne
// lui donne `remede`). -> { objet, bonus, remplace } : le meilleur pour cette affliction (celui qui remplace d'abord), ou null.
export function remedePour(affliction, objets = [], defs = new Map()) {
  const cle = typeof affliction === "string" ? affliction : affliction?.cle;
  const possibles = (objets ?? []).map(o => ({ o, r: (o?.system ?? o)?.remede ?? defs?.get?.((o?.system ?? o)?.cle)?.remede }))
    .filter(x => x.r && (x.r.afflictions ?? []).includes(cle));
  possibles.sort((a, b) => Number(Boolean(b.r.remplace)) - Number(Boolean(a.r.remplace)) || n0(b.r.bonus) - n0(a.r.bonus));
  return possibles[0] ? { objet: possibles[0].o, bonus: n0(possibles[0].r.bonus), remplace: Boolean(possibles[0].r.remplace) } : null;
}

// Vérification d'une recette (pour verifierContenu). -> [String]
export function verifierRecette(r, { savoirs = new Set(), installations = new Set(), equipements = new Set() } = {}) {
  const e = [];
  const ou = `recette « ${r.cle} »`;
  if (r.competence && !COMPETENCES.includes(r.competence)) e.push(`${ou} : compétence inconnue « ${r.competence} »`);
  if (!(Number(r.travail) > 0)) e.push(`${ou} : travail manquant`);
  for (const [res, q] of Object.entries(r.cout ?? {})) if (!RESSOURCES.includes(res) || !(Number(q) >= 0)) e.push(`${ou} : coût invalide « ${res} »`);
  for (const s of r.requiert?.savoirs ?? []) if (!savoirs.has(s)) e.push(`${ou} : savoir inconnu « ${s} »`);
  const ri = requisInstallation(r.requiert?.installation);
  if (ri?.cle && !installations.has(ri.cle)) e.push(`${ou} : installation inconnue « ${ri.cle} »`);
  if (ri?.metier && !METIERS.includes(ri.metier)) e.push(`${ou} : métier d'atelier inconnu « ${ri.metier} »`);
  if (ri && r.sac) e.push(`${ou} : une recette de sac ne demande pas d'atelier`);
  for (const g of r.outils ?? []) if (!GAMMES.includes(g)) e.push(`${ou} : outil inconnu « ${g} »`);
  for (const o of objetsDeRecette(r)) if (equipements.size && !equipements.has(o.cle)) e.push(`${ou} : objet demandé inconnu « ${o.cle} »`);
  const p = r.produit ?? {};
  if (p.ressource && !RESSOURCES.includes(p.ressource)) e.push(`${ou} : ressource produite inconnue « ${p.ressource} »`);
  if (p.equipement && equipements.size && !equipements.has(p.equipement)) e.push(`${ou} : équipement produit inconnu « ${p.equipement} »`);
  if (p.traitement && !TRAITEMENTS.includes(p.traitement)) e.push(`${ou} : traitement inconnu « ${p.traitement} »`);
  if (!p.ressource && !p.equipement && !p.traitement) e.push(`${ou} : aucun produit`);
  return e;
}
