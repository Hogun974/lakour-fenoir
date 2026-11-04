// L'atelier de fabrication (contrat §9, repris de l'établi de Warcraft). Logique pure.
//
// Recette (contenu `recettes`) : { cle, nom, cout: { materiaux, pieces, … }, travail (quarts-personne), competence, difficulte,
//   requiert: { savoirs: [cle], installation: cle | { cle, niveau } }, produit: { equipement: cle | ressource: cle, n } }.
//
// Nombres retenus :
// - Le coût est payé en entier au départ ; le travail dure `travail` quarts-personne (÷ bras, arrondi au supérieur).
// - Test de la compétence de la recette à sa difficulté. Réussite : le produit (n). Marge ≥ 2 et produit en ressource : +1.
//   Échec : rien, et la moitié du coût (arrondie au supérieur) est rendue (le reste est gâché).
// - Une installation requise doit être en service (état < 3) et au niveau demandé (1 par défaut).
import { resoudreTest } from "./des.mjs";
import { couvre, retirerStocks, ajouterStocks, normaliserStocks } from "./ressources.mjs";
import { COMPETENCES, RESSOURCES } from "./constantes.mjs";
import { message } from "./textes.mjs";

export const BONUS_MARGE_FABRICATION = 2;

const requisInstallation = r => (typeof r === "string" ? { cle: r, niveau: 1 } : r ? { cle: r.cle, niveau: Number(r.niveau) || 1 } : null);

// -> { ok, raisons: [String], motifs: [{ cle, params, texte }] (les mêmes, traduisibles : textes.mjs), cout, quarts }
export function peutFabriquer(recette, { stocks = {}, installations = [], savoirs = [], bras = 1 } = {}) {
  const raisons = [], motifs = [];
  const refuser = (texte, cle, params = {}) => { raisons.push(texte); motifs.push(message(cle, params, texte)); };
  if (!recette) { refuser("recette inconnue", "recette-inconnue"); return { ok: false, raisons, motifs, cout: {}, quarts: 0 }; }
  for (const s of recette.requiert?.savoirs ?? []) if (!savoirs.includes(s)) refuser(`savoir-faire manquant : ${s}`, "savoir-manquant", { savoir: s });
  const ri = requisInstallation(recette.requiert?.installation);
  if (ri) {
    const i = installations.find(x => x.cle === ri.cle);
    if (!i || Number(i.niveau) < ri.niveau) refuser(`il faut : ${ri.cle} niveau ${ri.niveau}`, "requiert", { installation: ri.cle, niveau: ri.niveau });
    else if (Number(i.etat) >= 3) refuser(`${ri.cle} est hors service`, "requiert-hors-service", { installation: ri.cle });
  }
  const cout = Object.fromEntries(Object.entries(recette.cout ?? {}).map(([r, q]) => [r, Math.max(0, Number(q) || 0)]));
  if (!couvre(stocks, cout)) {
    const manque = Object.fromEntries(Object.entries(cout).filter(([r, q]) => (Number(stocks?.[r]) || 0) < q).map(([r, q]) => [r, q - (Number(stocks?.[r]) || 0)]));
    refuser(`il manque : ${Object.entries(manque).map(([r, q]) => `${q} ${r}`).join(", ")}`, "manque", { manque });
  }
  return { ok: raisons.length === 0, raisons, motifs, cout, quarts: Math.ceil(Math.max(0, Number(recette.travail) || 0) / Math.max(1, bras)) };
}

// Fabrique : -> { ok, raisons, motifs, test, stocks, produit: { equipement?, ressource?, n } | null, quarts, perdu }
// Un produit en ressource est déjà ajouté aux stocks rendus ; un équipement est rendu à part (objet à créer côté Foundry).
export function fabriquer(recette, { stocks = {}, installations = [], savoirs = [], niveau = 0, bonus = 0, malus = 0, forcer = false, bras = 1, hasard = Math.random } = {}) {
  const v = peutFabriquer(recette, { stocks, installations, savoirs, bras });
  if (!v.ok) return { ok: false, raisons: v.raisons, motifs: v.motifs, test: null, stocks: normaliserStocks(stocks), produit: null, quarts: 0, perdu: {} };
  const test = resoudreTest({ niveau, difficulte: recette.difficulte ?? "normale", bonus, malus, forcer, hasard });
  let s = retirerStocks(stocks, v.cout).stocks;
  let produit = null, perdu = { ...v.cout };
  if (test.reussite) {
    perdu = {};
    const n = Math.max(1, Number(recette.produit?.n) || 1);
    if (recette.produit?.ressource) {
      const total = n + (test.marge >= BONUS_MARGE_FABRICATION ? 1 : 0);
      produit = { ressource: recette.produit.ressource, n: total };
      s = ajouterStocks(s, { [recette.produit.ressource]: total });
    } else produit = { equipement: recette.produit?.equipement ?? recette.cle, n };
  } else {
    const rendu = Object.fromEntries(Object.entries(v.cout).map(([r, q]) => [r, Math.ceil(q / 2)]));
    s = ajouterStocks(s, rendu);
    perdu = Object.fromEntries(Object.entries(v.cout).map(([r, q]) => [r, q - rendu[r]]));
  }
  return { ok: true, raisons: [], motifs: [], test, stocks: s, produit, quarts: v.quarts, perdu };
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
  if (ri && !installations.has(ri.cle)) e.push(`${ou} : installation inconnue « ${ri.cle} »`);
  const p = r.produit ?? {};
  if (p.ressource && !RESSOURCES.includes(p.ressource)) e.push(`${ou} : ressource produite inconnue « ${p.ressource} »`);
  if (p.equipement && equipements.size && !equipements.has(p.equipement)) e.push(`${ou} : équipement produit inconnu « ${p.equipement} »`);
  if (!p.ressource && !p.equipement) e.push(`${ou} : aucun produit`);
  return e;
}
