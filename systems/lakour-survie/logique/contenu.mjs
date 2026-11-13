// Lecture et vérification du contenu (registre rempli par le module lakour-fenoir, contrat §2.1, §2.2, §2.5, §2.6, §3.2, §3.3, §6).
// Logique pure.
//
// Le contenu est { regions, sites, installations, savoirs, factions, evenements, passes, equipements, recettes, afflictions,
// creatures } (les trois dernières : §9) ; chaque famille est une
// liste d'objets à clé `cle` (ou un objet { cle: objet }, accepté aussi). Les objets `installation` et `savoir` peuvent être
// donnés à plat ou sous la forme d'un Item ({ name, system: { cle, … } }) : on lit `system` s'il existe.
//
// Nature d'une région (§2.1 « ressources naturelles par jour et leur plafond ») : un nombre n = ce qu'un groupe tire par jour
// d'alentours intacts ; le plafond vaut alors 10 × n. On accepte aussi [parJour, plafond] ou { parJour, plafond }.
import { ZONES, TERRAINS, NATURE, RESSOURCES_PILLABLES, RESEAUX, TYPES_SITE, EAUX_SITE, CATEGORIES_INSTALLATION, ATTITUDES,
  RESSOURCES, COMPETENCES, DIFFICULTES, TYPES_VEHICULE, CATEGORIES_AFFLICTION, DECLENCHEURS_AFFLICTION, CLES_PHASES, ARBRES, COUT_ILE } from "./constantes.mjs";
import { verifierRecette } from "./fabrication.mjs";

export const FAMILLES = ["regions", "sites", "installations", "savoirs", "factions", "evenements", "passes", "equipements",
  "recettes", "afflictions", "creatures", "enfances", "traits", "religions", "ancrages"];
export const PLAFOND_NATURE = 10; // plafond = 10 × rendement par jour

const aPlat = o => (o && typeof o === "object" && o.system && typeof o.system === "object" ? { nom: o.name, ...o.system } : o);

export function liste(famille) {
  if (!famille) return [];
  if (Array.isArray(famille)) return famille.map(aPlat).filter(Boolean);
  return Object.entries(famille).map(([cle, o]) => ({ cle, ...aPlat(o) }));
}

const caches = new WeakMap();
// Index du contenu : { regions: Map(cle -> objet), sites, … }. Mis en cache par objet contenu (le contenu ne change pas en jeu).
export function indexer(contenu = {}) {
  if (contenu && typeof contenu === "object" && caches.has(contenu)) return caches.get(contenu);
  const index = {};
  for (const f of FAMILLES) index[f] = new Map(liste(contenu?.[f]).map(o => [o.cle, o]));
  if (contenu && typeof contenu === "object") caches.set(contenu, index);
  return index;
}

// Genre d'une enfance, d'un passé ou d'un survivant : "f", "m" ou "" (neutre ou inconnu).
export const GENRES = ["f", "m"];
export const genreDe = o => (GENRES.includes(o?.genre) ? o.genre : "");
// Le libellé d'une enfance ou d'un passé accordé au genre du survivant : `nomAutre` quand l'élément est genré, le survivant
// aussi, et qu'ils diffèrent (« Agricultrice des Hauts » → « Agriculteur des Hauts »), sinon `nom`. C'est l'endroit unique.
export function nomAccorde(def, genre = "") {
  if (!def) return "";
  const g = genreDe(def), s = genreDe({ genre });
  return g && s && g !== s && def.nomAutre ? def.nomAutre : def.nom ?? def.cle ?? "";
}

export const regionDe = (contenu, cle) => indexer(contenu).regions.get(cle) ?? null;
export const siteDe = (contenu, cle) => indexer(contenu).sites.get(cle) ?? null;
export const installationDe = (contenu, cle) => indexer(contenu).installations.get(cle) ?? null;
export const factionDe = (contenu, cle) => indexer(contenu).factions.get(cle) ?? null;
export const regionsDe = contenu => [...indexer(contenu).regions.values()];
export const voisinsDe = (contenu, cle) => regionDe(contenu, cle)?.voisins ?? [];
export const sontVoisines = (contenu, a, b) => voisinsDe(contenu, a).some(v => v.region === b);
export const estDesBas = (region, altitudeBas = 400) => Number(region?.altitude ?? 0) < altitudeBas;

// Nature d'une région -> { cueillette: { parJour, plafond }, … }.
export function natureRegion(region) {
  const sortie = {};
  for (const n of NATURE) {
    const v = region?.nature?.[n];
    let parJour = 0, plafond = 0;
    if (Array.isArray(v)) [parJour, plafond] = [Number(v[0]) || 0, Number(v[1]) || 0];
    else if (v && typeof v === "object") [parJour, plafond] = [Number(v.parJour) || 0, Number(v.plafond) || 0];
    else { parJour = Number(v) || 0; plafond = parJour * PLAFOND_NATURE; }
    sortie[n] = { parJour, plafond };
  }
  return sortie;
}

// Les réserves pillables d'une région au jour zéro (toutes ressources, 0 si absentes).
export function reservesDepart(region) {
  return Object.fromEntries(RESSOURCES_PILLABLES.map(r => [r, Math.max(0, Math.floor(Number(region?.ressources?.[r]) || 0))]));
}

// Les niveaux d'une installation (1..niveauMax) -> objet niveau (index 0 = niveau 1).
export const niveauDe = (def, niveau) => (niveau >= 1 ? def?.niveaux?.[niveau - 1] ?? null : null);
export const niveauMaxDe = def => Number(def?.niveauMax ?? def?.niveaux?.length ?? 0);

// ------------------------------------------------------------------ vérification
// -> [String] : erreurs lisibles (vide = contenu sain).
export function verifierContenu(contenu = {}) {
  const erreurs = [];
  const err = t => erreurs.push(t);
  const idx = {};
  for (const f of FAMILLES) {
    const l = liste(contenu?.[f]);
    const vues = new Set();
    for (const o of l) {
      if (!o.cle || typeof o.cle !== "string") { err(`${f} : un élément n'a pas de clé (${o.nom ?? JSON.stringify(o).slice(0, 40)})`); continue; }
      if (vues.has(o.cle)) err(`${f} : clé en double « ${o.cle} »`);
      vues.add(o.cle);
    }
    idx[f] = new Map(l.map(o => [o.cle, o]));
  }
  const { regions, sites, installations, savoirs, factions, evenements } = idx;
  if (!regions.size) err("regions : aucune région");

  // Régions.
  for (const r of regions.values()) {
    const ou = `région « ${r.cle} »`;
    if (!ZONES.includes(r.zone)) err(`${ou} : zone inconnue « ${r.zone} »`);
    if (!Number.isFinite(Number(r.altitude))) err(`${ou} : altitude manquante`);
    if (!(Number(r.population) >= 0 && Number(r.population) <= 5)) err(`${ou} : population hors de 0..5`);
    for (const c of ["soleil", "pluie"]) if (!(Number(r.climat?.[c]) >= 0 && Number(r.climat?.[c]) <= 3)) err(`${ou} : climat.${c} hors de 0..3`);
    for (const [res, q] of Object.entries(r.ressources ?? {})) {
      if (!RESSOURCES_PILLABLES.includes(res)) err(`${ou} : ressource inconnue « ${res} »`);
      else if (!(Number(q) >= 0)) err(`${ou} : ressource « ${res} » négative ou invalide`);
    }
    for (const [res, f] of Object.entries(r.infrastructures ?? {})) {
      if (!RESEAUX.includes(res)) { err(`${ou} : réseau inconnu « ${res} »`); continue; }
      if (f === null) continue;
      if (!Array.isArray(f) || f.length !== 2 || !(Number(f[0]) <= Number(f[1])) || Number(f[0]) < 0) err(`${ou} : fenêtre de « ${res} » invalide (${JSON.stringify(f)})`);
    }
    for (const d of r.dangers ?? []) if (typeof d !== "string") err(`${ou} : danger invalide`);
    for (const f of r.factionsDepart ?? []) {
      if (!factions.has(f.faction)) err(`${ou} : faction inconnue « ${f.faction} »`);
      if (!(Number(f.force) >= 0 && Number(f.force) <= 5)) err(`${ou} : force de « ${f.faction} » hors de 0..5`);
    }
    for (const s of r.sites ?? []) {
      if (!sites.has(s)) err(`${ou} : site inconnu « ${s} »`);
      else if (sites.get(s).region !== r.cle) err(`${ou} : le site « ${s} » appartient à « ${sites.get(s).region} »`);
    }
    const vus = new Set();
    for (const v of r.voisins ?? []) {
      const ici = `${ou} → « ${v.region} »`;
      if (!regions.has(v.region)) { err(`${ici} : région voisine inconnue`); continue; }
      if (v.region === r.cle) err(`${ici} : une région n'est pas sa propre voisine`);
      if (vus.has(v.region)) err(`${ici} : voisine en double`);
      vus.add(v.region);
      if (!TERRAINS.includes(v.terrain)) err(`${ici} : terrain inconnu « ${v.terrain} »`);
      if (!(Number(v.quartsPied) > 0) && v.terrain !== "mer") err(`${ici} : quartsPied manquant`);
      if (v.quartsVehicule !== null && v.quartsVehicule !== undefined && !(Number(v.quartsVehicule) > 0)) err(`${ici} : quartsVehicule invalide`);
      if (v.terrain === "mer" && !(Number(v.quartsVehicule) > 0)) err(`${ici} : une traversée par mer demande quartsVehicule (bateau)`);
      for (const c of v.coupure ?? []) if (typeof c !== "string") err(`${ici} : coupure invalide`);
      const retour = (regions.get(v.region).voisins ?? []).find(w => w.region === r.cle);
      if (!retour) err(`${ici} : voisinage non symétrique (« ${v.region} » ne connaît pas « ${r.cle} »)`);
      else if (retour.terrain !== v.terrain) err(`${ici} : terrain différent dans l'autre sens`);
    }
  }
  // Graphe connexe : chaque région atteignable depuis la première (routes de tout terrain).
  if (regions.size) {
    const depart = regions.keys().next().value;
    const atteintes = new Set([depart]), file = [depart];
    while (file.length) for (const v of regions.get(file.shift())?.voisins ?? []) if (regions.has(v.region) && !atteintes.has(v.region)) { atteintes.add(v.region); file.push(v.region); }
    for (const r of regions.keys()) if (!atteintes.has(r)) err(`région « ${r} » : inatteignable depuis « ${depart} »`);
  }

  // Sites.
  for (const s of sites.values()) {
    const ou = `site « ${s.cle} »`;
    if (!regions.has(s.region)) { err(`${ou} : région inconnue « ${s.region} »`); }
    else if (!(regions.get(s.region).sites ?? []).includes(s.cle)) err(`${ou} : absent de la liste des sites de « ${s.region} »`);
    if (s.type && !TYPES_SITE.includes(s.type)) err(`${ou} : type inconnu « ${s.type} »`);
    if (!(Number(s.capacite) >= 0)) err(`${ou} : capacité invalide`);
    for (const c of ["defense", "discretion"]) if (!(Number(s[c] ?? 0) >= 0 && Number(s[c] ?? 0) <= 5)) err(`${ou} : ${c} hors de 0..5`);
    for (const c of ["sol", "soleil", "souterrain", "acces"]) if (!(Number(s[c] ?? 0) >= 0 && Number(s[c] ?? 0) <= 3)) err(`${ou} : ${c} hors de 0..3`);
    if (s.eau && !EAUX_SITE.includes(s.eau)) err(`${ou} : eau inconnue « ${s.eau} »`);
    for (const [res, q] of Object.entries(s.stocks ?? {})) if (!RESSOURCES.includes(res) || !(Number(q) >= 0)) err(`${ou} : stock invalide « ${res} »`);
    for (const i of s.installationsDepart ?? []) {
      const def = installations.get(i.installation);
      if (!def) err(`${ou} : installation de départ inconnue « ${i.installation} »`);
      else if (!(Number(i.niveau) >= 1 && Number(i.niveau) <= niveauMaxDe(def))) err(`${ou} : niveau ${i.niveau} invalide pour « ${i.installation} »`);
    }
  }

  // Installations.
  for (const d of installations.values()) {
    const ou = `installation « ${d.cle} »`;
    if (!CATEGORIES_INSTALLATION.includes(d.categorie)) err(`${ou} : catégorie inconnue « ${d.categorie} »`);
    const max = niveauMaxDe(d);
    if (!Array.isArray(d.niveaux) || !d.niveaux.length) { err(`${ou} : aucun niveau`); continue; }
    if (max !== d.niveaux.length) err(`${ou} : niveauMax (${d.niveauMax}) ≠ nombre de niveaux (${d.niveaux.length})`);
    d.niveaux.forEach((n, i) => {
      const ici = `${ou} niveau ${i + 1}`;
      if (!(Number(n?.cout?.travail) > 0)) err(`${ici} : coût en travail manquant`);
      for (const [res, q] of Object.entries(n?.cout ?? {})) if (res !== "travail" && res !== COUT_ILE && (!RESSOURCES.includes(res) || !(Number(q) >= 0))) err(`${ici} : coût invalide « ${res} »`);
      for (const s of n?.requiert?.savoirs ?? []) if (!savoirs.has(s)) err(`${ici} : savoir inconnu « ${s} »`);
      for (const r of n?.requiert?.installations ?? []) {
        const autre = installations.get(r.cle);
        if (!autre) err(`${ici} : installation requise inconnue « ${r.cle} »`);
        else if (r.cle === d.cle) {
          if (Number(r.niveau) !== i) err(`${ici} : demande « ${r.cle} » niveau ${r.niveau} (le niveau précédent est implicite)`);
        } else if (!(Number(r.niveau) >= 1 && Number(r.niveau) <= niveauMaxDe(autre))) err(`${ici} : niveau requis ${r.niveau} invalide pour « ${r.cle} »`);
      }
      for (const e of n?.requiert?.site?.eau ?? []) if (!EAUX_SITE.includes(e)) err(`${ici} : eau de site inconnue « ${e} »`);
      if (n?.effets?.conditions?.riviere && !(n?.requiert?.site?.eau ?? []).includes("riviere")) err(`${ici} : condition « rivière » sans site à rivière requis`);
    });
  }

  // Lot « savoirs » : arbres (moderne, lontan) ; une installation qui porte le rôle d'une autre a au moins une sœur.
  for (const d of installations.values()) {
    if (d.arbre && !ARBRES.includes(d.arbre)) err(`installation « ${d.cle} » : arbre inconnu « ${d.arbre} »`);
    if (d.role && d.role !== d.cle && ![...installations.values()].some(x => x !== d && (x.role || x.cle) === d.role)) err(`installation « ${d.cle} » : rôle « ${d.role} » sans sœur`);
  }
  for (const sv of savoirs.values()) if (sv.arbre && !ARBRES.includes(sv.arbre)) err(`savoir « ${sv.cle} » : arbre inconnu « ${sv.arbre} »`);

  // Factions, événements.
  for (const f of factions.values()) {
    if (f.attitude && !ATTITUDES.includes(f.attitude)) err(`faction « ${f.cle} » : attitude inconnue « ${f.attitude} »`);
    for (const r of f.regionsDepart ?? []) if (!regions.has(r)) err(`faction « ${f.cle} » : région de départ inconnue « ${r} »`);
  }
  const clesEvenements = new Set([...evenements.keys(), ...EVENEMENTS_SYSTEME]);
  for (const r of regions.values()) {
    for (const d of r.dangers ?? []) if (!clesEvenements.has(d)) err(`région « ${r.cle} » : danger « ${d} » sans événement`);
    for (const v of r.voisins ?? []) for (const c of v.coupure ?? []) if (!clesEvenements.has(c)) err(`région « ${r.cle} » → « ${v.region} » : coupure « ${c} » sans événement`);
  }
  for (const e of evenements.values()) {
    for (const z of e.zones ?? []) if (!ZONES.includes(z)) err(`événement « ${e.cle} » : zone inconnue « ${z} »`);
    if (e.effets?.faction && !factions.has(e.effets.faction)) err(`événement « ${e.cle} » : faction inconnue « ${e.effets.faction} »`);
  }
  // §9 : recettes, afflictions, créatures, véhicules.
  for (const r of idx.recettes.values()) for (const t of verifierRecette(r, { savoirs: new Set(savoirs.keys()), installations: new Set(installations.keys()), equipements: new Set(idx.equipements.keys()) })) err(t);
  for (const r of idx.recettes.values()) if (r.difficulte && !DIFFICULTES[r.difficulte]) err(`recette « ${r.cle} » : difficulté inconnue « ${r.difficulte} »`);
  for (const a of idx.afflictions.values()) {
    const ou = `affliction « ${a.cle} »`;
    if (!CATEGORIES_AFFLICTION.includes(a.categorie)) err(`${ou} : catégorie inconnue « ${a.categorie} »`);
    if (a.declencheur && !DECLENCHEURS_AFFLICTION.includes(a.declencheur)) err(`${ou} : déclencheur inconnu « ${a.declencheur} »`);
    if (!(Number(a.duree) > 0)) err(`${ou} : durée manquante`);
    if (a.soin?.competence && !COMPETENCES.includes(a.soin.competence)) err(`${ou} : compétence de soin inconnue « ${a.soin.competence} »`);
    if (a.soin?.difficulte && !DIFFICULTES[a.soin.difficulte]) err(`${ou} : difficulté de soin inconnue « ${a.soin.difficulte} »`);
    for (const c of ["contagion", "risque"]) if (a[c] !== undefined && !(Number(a[c]) >= 0 && Number(a[c]) <= 1)) err(`${ou} : ${c} hors de 0..1`);
  }
  for (const c of idx.creatures.values()) {
    const ou = `créature « ${c.cle} »`;
    if (!["livide", "animal"].includes(c.type ?? "livide")) err(`${ou} : type inconnu « ${c.type} »`);
    for (const k of ["des", "resistance"]) if (!(Number(c[k]) >= 1)) err(`${ou} : ${k} manquant (au moins 1)`);
    for (const z of c.zones ?? []) if (!ZONES.includes(z)) err(`${ou} : zone inconnue « ${z} »`);
    for (const p of c.phases ?? []) if (!CLES_PHASES.includes(p)) err(`${ou} : phase inconnue « ${p} »`);
  }
  for (const e of idx.equipements.values()) {
    if (!TYPES_VEHICULE.includes(e.type)) continue;
    const ou = `véhicule « ${e.cle} »`;
    if (!Array.isArray(e.terrains) || !e.terrains.length) err(`${ou} : terrains manquants`);
    for (const t of e.terrains ?? []) if (!TERRAINS.includes(t)) err(`${ou} : terrain inconnu « ${t} »`);
    if (!(Number(e.charge) >= 0)) err(`${ou} : charge invalide`);
    if (!e.rapide && !(Number(e.allure) > 0) && !(e.terrains ?? []).every(t => t === "mer")) err(`${ou} : allure manquante (véhicule non motorisé)`);
  }
  // §10 : enfances, passés, traits.
  for (const f of ["enfances", "passes"]) for (const o of idx[f].values()) {
    for (const c of Object.keys(o.competences ?? {})) if (!COMPETENCES.includes(c)) err(`${f} « ${o.cle} » : compétence inconnue « ${c} »`);
    for (const s of o.savoirs ?? []) if (!savoirs.has(s)) err(`${f} « ${o.cle} » : savoir inconnu « ${s} »`);
    if (o.genre && !GENRES.includes(o.genre)) err(`${f} « ${o.cle} » : genre inconnu « ${o.genre} » (f, m ou vide)`);
    if (o.nomAutre && !o.genre) err(`${f} « ${o.cle} » : nomAutre sans genre`);
  }
  for (const t of idx.traits.values()) {
    for (const c of Object.keys(t.effets?.competences ?? {})) if (!COMPETENCES.includes(c)) err(`trait « ${t.cle} » : compétence inconnue « ${c} »`);
    for (const i of t.incompatibles ?? []) {
      if (!idx.traits.has(i)) err(`trait « ${t.cle} » : trait incompatible inconnu « ${i} »`);
      if (i === t.cle) err(`trait « ${t.cle} » : incompatible avec lui-même`);
    }
  }
  return erreurs;
}

// Clés d'événements que la simulation connaît d'elle-même (météo, éruption…), utilisables dans `dangers` et `coupure` même
// si le contenu ne les décrit pas.
export const EVENEMENTS_SYSTEME = ["fortes-pluies", "crue", "eboulement", "cyclone", "eruption", "incendie", "arbres-tombes"];
