// Le registre du contenu (contrat §6) : le module de contenu (lakour-fenoir) y verse ses données au crochet
// « lakourSurvie.enregistrer » (registre.ajouter(donnees), et registre.attendre(promesse) si elles arrivent plus tard).
// Le système le lit par contenu() : les familles du contrat (§2, §3, §9, §10) dans les formes que la logique pure attend.
// Aucun appel à Foundry ici : éprouvé en Node (essais/survie-api*.test.mjs).
//
// Le contenu de Fénoir garde ses propres formes (docs/survie-notes-contenu.md §2) ; on les traduit pour la logique sans rien
// perdre (les champs d'origine restent) :
// - enfances : `modificateurs` -> `competences` ;
// - traits : `peur: { lieu, malus }` -> `peur: { lieux: [lieu et ses lieux d'abri], malus, moral }`, `social: { seuil, moral }`
//   -> `social: { max, moral }` ;
// - équipement à `transport` (véhicules, montures) -> `type: "vehicule" | "monture"`, `terrains`, `charge` (ce qu'il porte),
//   `rapide` (motorisé), `allure` (sinon), `carburantParQuart`, `bruit` ; le poids de l'objet reste dans `poids` ;
// - bestiaire -> `creatures` (`categorie` -> `type` ; les humains du bestiaire n'en font pas partie) ;
// - noms (`prenoms`) -> `noms` ; histoire.proche -> `proches` ; recrues.raisons / prix -> `raisonsRecrue` / `prixRecrue`.
import { verifierContenu, liste } from "../logique/contenu.mjs";

export const FAMILLES_LISTES = ["regions", "sites", "routes", "installations", "savoirs", "factions", "evenements", "passes", "equipements",
  "recettes", "afflictions", "bestiaire", "creatures", "enfances", "traits", "visibilite", "camp", "fetes"];

// Les lieux d'abri que recouvre chaque peur (type de site, clé ou catégorie d'installation, generation.mjs lieuxAbri).
export const LIEUX_DES_PEURS = {
  souterrain: ["souterrain", "tunnel-de-lave", "galerie", "galerie-souterraine", "tunnel-de-lave-amenage"],
  hauteur: ["hauteur", "immeuble", "phare", "tour-de-guet"],
  mer: ["mer", "port", "phare"]
};
// L'allure d'une monture ou d'un véhicule sans moteur (quartsPied × allure), quand le contenu ne la donne pas.
export const ALLURES = { velo: 0.5, "velo-cargo": 0.6, ane: 0.8, cheval: 0.6, "cheval-de-la-plaine": 0.6 };
export const ALLURE_DEFAUT = 0.7;

const objet = v => (v && typeof v === "object" && !Array.isArray(v) ? v : {});
const tableau = v => (Array.isArray(v) ? v : []);

function normaliserTrait(t) {
  const e = objet(t.effets);
  const peur = e.peur ? {
    ...e.peur,
    lieux: [...new Set([...(e.peur.lieux ?? []), ...(e.peur.lieu ? [e.peur.lieu, ...(LIEUX_DES_PEURS[e.peur.lieu] ?? [])] : [])])],
    malus: Number(e.peur.malus) || 0,
    moral: Number(e.peur.moral) || 0
  } : null;
  const social = e.social ? { ...e.social, max: Number(e.social.max ?? e.social.seuil) || Infinity, moral: Number(e.social.moral) || 0 } : null;
  return { ...t, effets: { ...e, peur, social } };
}

function normaliserEquipement(e) {
  const tr = objet(e.transport);
  if (!e.transport) return { ...e, poids: Number(e.charge) || 0 };
  const motorise = Number(tr.carburantParQuart) > 0;
  const mode = tr.mode ?? "vehicule";
  const terrains = tableau(tr.terrains).length ? [...tr.terrains] : mode === "bateau" ? ["mer"] : ["route"];
  return {
    ...e,
    poids: Number(e.charge) || 0,
    type: mode === "pied" ? "monture" : "vehicule",
    terrains,
    charge: Number(tr.chargeMax ?? tr.charge) || 0,
    places: Number(tr.places) || 1,
    rapide: tr.rapide ?? motorise,
    allure: motorise ? (tr.allure ?? null) : Number(tr.allure ?? ALLURES[e.cle] ?? ALLURE_DEFAUT),
    carburantParQuart: Number(tr.carburantParQuart) || 0,
    bruit: Number(tr.bruit ?? e.bruit) || 0
  };
}

// Les créatures de la logique (actions.mjs : livide, animal), d'après le bestiaire du contenu.
export function creaturesDuBestiaire(bestiaire = []) {
  return liste(bestiaire).filter(b => ["livide", "animal"].includes(b.type ?? b.categorie))
    .map(b => ({ ...b, type: b.type ?? b.categorie, des: Math.max(1, Number(b.des) || 1), resistance: Math.max(1, Number(b.resistance) || 1) }));
}

// Le contenu brut (une ou plusieurs données ajoutées) -> le contenu de la logique.
export function normaliserContenu(brut = {}) {
  const c = { ...brut };
  for (const f of FAMILLES_LISTES) if (c[f] !== undefined) c[f] = liste(c[f]);
  c.enfances = liste(c.enfances).map(e => ({ ...e, competences: { ...objet(e.modificateurs), ...objet(e.competences) } }));
  c.traits = liste(c.traits).map(normaliserTrait);
  c.equipements = liste(c.equipements).map(normaliserEquipement);
  c.creatures = [...liste(c.creatures), ...creaturesDuBestiaire(c.bestiaire)]
    .filter((x, i, l) => l.findIndex(y => y.cle === x.cle) === i);
  const noms = c.noms;
  if (noms && !Array.isArray(noms)) {
    c.nomsFenoir = noms;
    // Prénoms par genre pour le générateur (prenomsF, prenomsM, prenomsMixtes) ; `noms` reste la liste entière (sans genre).
    for (const f of ["prenomsF", "prenomsM", "prenomsMixtes"]) if (noms[f] !== undefined) c[f] = [...tableau(noms[f])];
    const ranges = [...tableau(noms.prenomsF), ...tableau(noms.prenomsM), ...tableau(noms.prenomsMixtes)];
    c.noms = ranges.length ? [...tableau(noms.prenoms)].filter(n => !ranges.includes(n)) : [...tableau(noms.prenoms)];
  }
  if (!c.proches && c.histoire?.proche) c.proches = [...tableau(c.histoire.proche)];
  if (!c.raisonsRecrue && c.recrues?.raisons) c.raisonsRecrue = [...tableau(c.recrues.raisons)];
  if (!c.prixRecrue && c.recrues?.prix) c.prixRecrue = [...tableau(c.recrues.prix)];
  for (const f of ["regions", "sites", "installations", "savoirs", "factions", "evenements", "passes", "recettes", "afflictions"]) c[f] = liste(c[f]);
  return c;
}

// Gèle un objet en profondeur (le contenu ne change pas en jeu ; contenu() le rend sans copie).
export function geler(o) {
  if (o && typeof o === "object" && !Object.isFrozen(o)) {
    Object.freeze(o);
    for (const v of Object.values(o)) geler(v);
  }
  return o;
}

// Fusionne deux données : les familles en liste s'ajoutent (une clé déjà là est remplacée), les objets se fusionnent.
function fusionner(a, b) {
  const sortie = { ...a };
  for (const [k, v] of Object.entries(objet(b))) {
    if (["module", "version"].includes(k)) { sortie.sources = [...(sortie.sources ?? []), `${b.module ?? "?"}@${b.version ?? "?"}`]; continue; }
    const avant = sortie[k];
    if (Array.isArray(v) || Array.isArray(avant)) {
      const l = [...liste(avant), ...liste(v)];
      sortie[k] = l.filter((x, i) => !x?.cle || l.findLastIndex(y => y?.cle === x.cle) === i);
    } else if (v && typeof v === "object" && avant && typeof avant === "object") sortie[k] = { ...avant, ...v };
    else sortie[k] = v;
  }
  return sortie;
}

// Le registre : ajouter, attendre, lire. -> { interface (donnée au crochet), contenu(), pret(), erreurs(), vide() }
export function creerRegistre() {
  let brut = {};
  let cache = null;
  const promesses = [];
  const interfaceModule = {
    ajouter(donnees) {
      if (!donnees || typeof donnees !== "object") return false;
      brut = fusionner(brut, structuredClone(donnees));
      cache = null;
      return true;
    },
    attendre(promesse) {
      if (promesse && typeof promesse.then === "function") promesses.push(Promise.resolve(promesse).catch(() => null));
    }
  };
  return {
    interface: interfaceModule,
    ajouter: d => interfaceModule.ajouter(d),
    attendre: p => interfaceModule.attendre(p),
    contenu() {
      cache ??= geler(normaliserContenu(brut));
      return cache;
    },
    async pret() { await Promise.all(promesses); return this.contenu(); },
    vide() { return !liste(brut.regions).length; },
    erreurs() { return this.vide() ? ["aucun contenu enregistré (le module lakour-fenoir est-il actif ?)"] : verifierContenu(this.contenu()); },
    oublier() { brut = {}; cache = null; promesses.length = 0; }
  };
}
