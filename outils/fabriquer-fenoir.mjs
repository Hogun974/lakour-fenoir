// Fabrique les compendiums du module lakour-fenoir (système lakour-survie) à partir de modules/lakour-fenoir/contenu/ :
// 1. rassemble les documents et le registre, 2. les vérifie contre le contrat (docs/survie-contrat.md), 3. écrit les sources
// JSON (src/<pack>/), 4. compile en LevelDB (packs/), 5. écrit assets/donnees.json (le registre) et assets/cartes/plans.json.
// Les vérificateurs (verifierDocuments, verifierDonnees, bilanVoie, termesInterdits…) servent aussi aux essais.
// Usage : npm run fabriquer-fenoir        (option --sans-compiler pour vérifier et écrire src/ sans compiler packs/)
//
// Version anglaise (module lakour-fenoir-en, modules/lakour-mj-ia/docs/traduction.md) : mêmes sources, mêmes _id, un
// dictionnaire par pack dans modules/lakour-fenoir/contenu/en/<pack>.json, plus contenu/en/registre.json pour les textes du
// REGISTRE (assets/donnees.json : le système le lit par clés, jamais traduites ; ses textes — noms, descriptions, « après »,
// atouts, phrases d'histoire, fêtes… — sont traduits par le même mécanisme, entrée « registre/<famille>/<clé> » + champ).
//   node outils/fabriquer-fenoir.mjs --extraire     écrit ou met à jour les squelettes contenu/en/*.json (traductions gardées)
//   npm run fabriquer-fenoir-en  (= --langue en)    engendre modules/lakour-fenoir-en/ EN ENTIER (non versionné) : module.json
//     anglais (contenu/en/module.json), src/ et packs/ traduits, assets/donnees.json traduit, copies de lang/, scripts/, assets/
//     (index des jetons récrits, plans.json refait avec les noms traduits ; contenu/en/assets/ posé par-dessus : la carte de l'île
//     en anglais, outils/fabriquer-carte.mjs), CREDITS.md ; puis les mêmes vérifications qu'en
//     français (documents, registre, contrat du contenu). Un écart de balises ou de liens arrête la fabrication.
import { compilePack } from "@foundryvtt/foundryvtt-cli";
import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, realpathSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  ATTITUDES, CATEGORIES, CATEGORIES_EQUIPEMENT, COMPETENCES, EAUX_SITE, EQUILIBRE, INCAPACITES, MODULE, NATURE, PHASES, RESEAUX, RESSOURCES,
  SAISONS, STOCKS, TACHES, TERRAINS, TRANSPORTS, TYPES_EVENEMENT, TYPES_SITE, ZONES, sansBalises
} from "../modules/lakour-fenoir/contenu/aides.mjs";
import { DOCUMENTS, donnees as donneesContenu } from "../modules/lakour-fenoir/contenu/index.mjs";
import { CARTE } from "../modules/lakour-fenoir/contenu/regions.mjs";
import { ecrirePlans } from "../modules/lakour-fenoir/contenu/cartes.mjs";
import { IMAGES_FETES } from "../modules/lakour-fenoir/scripts/fetes.js";
import { COMMUNAUTES } from "../systems/lakour-survie/logique/fetes.mjs";
import { IDS_DECLINABLES, normaliserDeclinaison } from "../modules/lakour-mj-ia/scripts/fetes-logique.js";
import { appliquer, extraire, fusionner, resumerRapport } from "../modules/lakour-mj-ia/outils/traduction.mjs";
import { verifierModuleDeContenu } from "../modules/lakour-mj-ia/outils/contrat-contenu.mjs";

// Écriture atomique (fichier temporaire puis renommage) : un essai ou un serveur qui lit le fichier pendant la fabrication
// ne voit jamais un JSON tronqué (même fonction que dans le fabricant des Veillées).
function ecrire(chemin, texte) {
  const provisoire = `${chemin}.${process.pid}.tmp`;
  writeFileSync(provisoire, texte);
  renameSync(provisoire, chemin);
}

const RACINE_DEPOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const RACINE = join(RACINE_DEPOT, "modules", MODULE);
export const FICHIER_DONNEES = join(RACINE, "assets", "donnees.json");

// ---------------------------------------------------------------- Version anglaise
export const MODULE_EN = `${MODULE}-en`;
const RACINE_EN = join(RACINE_DEPOT, "modules", MODULE_EN);
export const DOSSIER_DICTIONNAIRES = join(RACINE, "contenu", "en");
// Ce que l'extraction regarde (traduction.mjs) : nos drapeaux sous flags.lakour-fenoir ; tout le reste par heuristique.
export const OPTIONS_TRADUCTION = { module: MODULE };
// Le pack fictif du registre dans les dictionnaires (contenu/en/registre.json).
export const PACK_REGISTRE = "registre";
// Familles du registre sans texte à traduire : l'en-tête, et les noms propres (prénoms créoles, surnoms, noms de cyclones).
const FAMILLES_NON_TRADUITES = ["module", "version", "noms"];
// Dossiers et fichiers du module français copiés tels quels dans le module anglais (un zip doit être autonome).
const COPIES = ["CREDITS.md", "lang", "scripts", "assets"];

export const TYPE_PACK = {
  installations: "Item", savoirs: "Item", equipements: "Item", passes: "Item", recettes: "Item", afflictions: "Item",
  survivants: "Actor", bestiaire: "Actor", guides: "JournalEntry", mj: "JournalEntry", tables: "RollTable", scenes: "Scene"
};
export const TYPE_DOCUMENT = {
  installations: "installation", savoirs: "savoir", equipements: "equipement", passes: "passe", recettes: "recette", afflictions: "affliction",
  survivants: "survivant", bestiaire: "survivant"
};
// Fêtes du calendrier du moteur : celles du socle lui-même et ses fêtes « sur demande » (lakour-mj-ia/scripts/fetes-logique.js,
// docs/fetes.md ; lot « fetes » du 2026-11-13 : ramadan, Aïd el-Kebir, Nouvel An tamoul, marche sur le feu).
export const FETES_MOTEUR = IDS_DECLINABLES;
// Les fêtes que Fénoir doit décliner (contrat §9) ; la Toussaint est déclinée sous « halloween ».
export const FETES_DE_FENOIR = ["noel", "nouvel-an", "paques", "halloween", "musique", "liberte", "fete-nationale", "dipavali", "nouvel-an-chinois", "cavadee", "letchis",
  "ramadan", "aid-el-kebir", "nouvel-an-tamoul", "marche-sur-le-feu"];
// La forme d'un effet de fête (systems/lakour-survie/logique/fetes.mjs) : les champs connus.
export const CHAMPS_EFFET_FETE = ["moral", "rations", "cout", "gain", "avecGain", "bruit", "quarts", "soutien", "lueur", "hygiene", "sangFroid", "liens", "renom",
  "refugies", "attache", "voeu", "repos", "fatigue", "options"];
export const DIFFICULTES = ["facile", "normale", "difficile", "extreme"];
export const BUDGET = [10, 16];
// Les vérificateurs lisent les drapeaux et chemins sous l'identifiant du module vérifié (français par défaut, anglais pour
// lakour-fenoir-en : option { module }).
const MODULE_PAR_DEFAUT = MODULE;

// Termes interdits : rien de The Walking Dead, ni du jeu de rôle de Free League, ni d'une autre œuvre de zombies.
// Mots entiers, lettres accentuées comprises (« débiter » ne contient pas « biter »).
const mot = source => new RegExp(`(?<!\\p{L})(?:${source})(?!\\p{L})`, "iu");
export const TERMES_INTERDITS = [
  "walking\\s*dead", "rick", "grimes", "negan", "alexandria", "r[oô]deurs?", "walkers?", "free\\s*league", "daryl", "michonne", "woodbury",
  "hilltop", "chuchoteurs?", "whisperers?", "saviou?rs?", "year\\s*zero", "mordeurs?", "biters?", "zombi(?:e|s|es)?"
].map(mot);
export function termesInterdits(texte) {
  const brut = String(texte).replace(/<[^>]+>/g, " ");
  return TERMES_INTERDITS.filter(t => t.test(brut)).map(t => t.source);
}

// ---------------------------------------------------------------- Rassembler
export function fabriquer(documents = DOCUMENTS) {
  const cles = new Set();
  for (const doc of documents) {
    if (!TYPE_PACK[doc.__pack]) throw new Error(`Compendium inconnu pour ${doc.__cle} : ${doc.__pack}`);
    if (cles.has(doc.__cle)) throw new Error(`Clé en double : ${doc.__cle}`);
    cles.add(doc.__cle);
  }
  const propre = doc => Object.fromEntries(Object.entries(doc).filter(([k]) => !k.startsWith("__")));
  return documents.map(doc => ({ pack: doc.__pack, cle: doc.__cle, doc: structuredClone(propre(doc)) }));
}

// ---------------------------------------------------------------- Documents Foundry
export function verifierDocuments(docs, { module: MODULE = MODULE_PAR_DEFAUT } = {}) {
  const erreurs = [];
  const err = (d, m) => erreurs.push(`${d.pack}/${d.doc.name ?? d.cle} : ${m}`);
  const du = pack => docs.filter(d => d.pack === pack);
  const ids = new Set();
  for (const d of docs) {
    const { doc } = d;
    if (!/^[A-Za-z0-9]{16}$/.test(doc._id ?? "")) err(d, `_id invalide ${doc._id}`);
    if (ids.has(`${d.pack}:${doc._id}`)) err(d, "_id en double");
    ids.add(`${d.pack}:${doc._id}`);
    if (doc._id !== doc._key?.split("!")[2]?.split(".").pop()) err(d, "_key et _id ne correspondent pas");
    if (!doc.flags?.[MODULE]?.cle) err(d, `flags.${MODULE}.cle manquant`);
    if (!doc.name) err(d, "sans nom");
    if (TYPE_DOCUMENT[d.pack] && doc.type !== TYPE_DOCUMENT[d.pack]) err(d, `type « ${doc.type} » au lieu de « ${TYPE_DOCUMENT[d.pack]} »`);
    if (TYPE_PACK[d.pack] === "Item" && doc.system?.cle !== doc.flags?.[MODULE]?.cle) err(d, "system.cle différent de la clé du drapeau");
    const interdits = termesInterdits(JSON.stringify(doc));
    if (interdits.length) err(d, `terme interdit (${interdits.join(", ")})`);
    if (TYPE_PACK[d.pack] === "Item" && !sansBalises(doc.system?.description)) err(d, "description vide");
  }
  // Acteurs : objets incorporés bien clés ; prétirés dans le budget.
  for (const d of [...du("survivants"), ...du("bestiaire")]) {
    for (const i of d.doc.items ?? []) if (i._key !== `!actors.items!${d.doc._id}.${i._id}`) err(d, `clé d'objet ${i._key}`);
    const comp = d.doc.system.competences;
    if (COMPETENCES.some(c => !comp[c] || !Number.isInteger(comp[c].niveau) || comp[c].niveau < 0 || comp[c].niveau > 5)) err(d, "compétences incomplètes ou hors de 0..5");
    if (d.doc.flags[MODULE].pretire) {
      const somme = COMPETENCES.reduce((s, c) => s + comp[c].niveau, 0);
      if (somme < BUDGET[0] || somme > BUDGET[1]) err(d, `budget ${somme} hors de ${BUDGET.join("–")}`);
      if (!d.doc.system.enfance || !d.doc.system.passe || !d.doc.system.traits.length) err(d, "prétiré sans enfance, passé ou traits");
    }
    if (!sansBalises(d.doc.system.notes)) err(d, "notes vides");
  }
  // Journaux : visibilité selon le pack, pages non vides, clés.
  for (const pack of ["guides", "mj"]) for (const d of du(pack)) {
    const voulu = pack === "guides" ? 2 : 0;
    if (d.doc.ownership?.default !== voulu) err(d, `visibilité ${d.doc.ownership?.default} au lieu de ${voulu}`);
    if (!d.doc.pages?.length || d.doc.pages.some(p => !sansBalises(p.text?.content))) err(d, "page vide");
    for (const p of d.doc.pages ?? []) if (p._key !== `!journal.pages!${d.doc._id}.${p._id}`) err(d, `clé de page ${p._key}`);
  }
  // Tables : 1dN, plages contiguës, résultats non vides.
  for (const d of du("tables")) {
    const r = d.doc.results;
    if (r.length < 6) err(d, `${r.length} résultats seulement`);
    if (d.doc.formula !== `1d${r.length}`) err(d, `formule ${d.doc.formula}`);
    r.forEach((x, i) => {
      if (x.range[0] !== i + 1 || x.range[1] !== i + 1) err(d, `plage ${x.range} au rang ${i + 1}`);
      if (!sansBalises(x.description)) err(d, `résultat ${i + 1} vide`);
      if (x._key !== `!tables.results!${d.doc._id}.${x._id}`) err(d, `clé de résultat ${x._key}`);
    });
    if (d.doc.flags[MODULE].appels) for (const x of r) {
      const a = x.flags?.[MODULE]?.appel;
      if (!a || !a.type || !a.recompense || !Number.isInteger(a.reputation)) err(d, "résultat d'appel sans données");
      else for (const res of Object.keys(a.recompense)) if (!RESSOURCES.includes(res)) err(d, `récompense inconnue ${res}`);
    }
  }
  // Scènes : épingles vers des journaux et pages qui existent.
  const pages = new Map(du("guides").concat(du("mj")).map(d => [d.doc._id, new Set(d.doc.pages.map(p => p._id))]));
  for (const d of du("scenes")) {
    for (const n of d.doc.notes ?? []) {
      if (!pages.has(n.entryId)) err(d, `épingle vers un journal inconnu ${n.entryId}`);
      else if (n.pageId && !pages.get(n.entryId).has(n.pageId)) err(d, `épingle vers une page inconnue ${n.pageId}`);
      if (n.x < 0 || n.y < 0 || n.x > d.doc.width || n.y > d.doc.height) err(d, `épingle hors de la carte (${n.x}, ${n.y})`);
    }
    for (const dr of d.doc.drawings ?? []) if (!dr.author) err(d, "dessin sans auteur");
  }
  const reunion = du("scenes").find(d => d.doc.flags[MODULE].cle === "carte-de-la-reunion");
  if (!reunion) erreurs.push("scène « Carte de La Réunion » absente");
  else if (reunion.doc.width !== CARTE.largeur || reunion.doc.height !== CARTE.hauteur) err(reunion, "taille différente de 4000 × 3000");
  return erreurs;
}

// ---------------------------------------------------------------- Bilan théorique d'une voie d'autonomie
// Régime établi (délais passés), règles du système (logique/abri.mjs) : pluie × climat × saison ; soleil × climat × saison ×
// soleil du site / 3 ; rivière seulement si le site en a une ; cultures × 1 avec compost, × 0,5 sans ; eau du site sans
// installation ; conservation requise, sinon 5 % de pertes sur 20 jours de réserve. -> { eau, nourriture, energie, carburant }.
const EAU_SITE = { riviere: 12, source: 8, puits: 5, citerne: 1, reseau: 0, aucune: 0 };
export function bilanVoie(voie, d, saison = "pluies", personnes = EQUILIBRE.groupe) {
  const site = d.sites.find(s => s.cle === voie.site);
  const region = d.regions.find(r => r.cle === site.region);
  const fp = EQUILIBRE.facteurSaison.pluie[saison], fs = EQUILIBRE.facteurSaison.soleil[saison];
  const compost = voie.installations.some(i => i.cle === "compost");
  const net = { eau: EAU_SITE[site.eau] * (site.eau === "citerne" ? region.climat.pluie * fp : 1), nourriture: 0, energie: 0, carburant: 0 };
  let conservation = false;
  for (const { cle, niveau } of voie.installations) {
    const n = d.installations.find(i => i.cle === cle).niveaux[niveau - 1];
    const e = n.effets, c = e.conditions;
    let f = 1;
    if (c.pluie) f *= region.climat.pluie * fp;
    if (c.soleil) f *= region.climat.soleil * fs * site.soleil / 3;
    if (c.riviere && site.eau !== "riviere") f = 0;
    if (n.requiert.site.sol > 0) f *= compost ? 1 : 0.5;
    for (const [r, q] of Object.entries(e.production ?? {})) if (r in net) net[r] += q * f;
    for (const [r, q] of Object.entries(e.consommation ?? {})) if (r in net) net[r] -= q;
    if (e.conservation) conservation = true;
  }
  const basChaud = region.altitude < EQUILIBRE.altitudeBas && saison === "pluies";
  net.eau -= personnes * (basChaud ? EQUILIBRE.consommation.eauBasSaisonChaude : EQUILIBRE.consommation.eau);
  net.nourriture -= personnes * EQUILIBRE.consommation.nourriture;
  if (!conservation) net.nourriture -= Math.ceil(personnes * 20 * EQUILIBRE.pertes);
  return Object.fromEntries(Object.entries(net).map(([k, v]) => [k, Math.round(v * 100) / 100]));
}

// Une voie est-elle constructible sur son site ? -> erreurs.
export function verifierVoie(voie, d) {
  const erreurs = [];
  const site = d.sites.find(s => s.cle === voie.site);
  if (!site) return [`voie ${voie.cle} : site inconnu ${voie.site}`];
  const niveaux = new Map(voie.installations.map(i => [i.cle, i.niveau]));
  for (const { cle, niveau } of voie.installations) {
    const def = d.installations.find(i => i.cle === cle);
    if (!def) { erreurs.push(`voie ${voie.cle} : installation inconnue ${cle}`); continue; }
    for (let k = 1; k <= niveau; k++) {
      const req = def.niveaux[k - 1]?.requiert;
      if (!req) { erreurs.push(`voie ${voie.cle} : ${cle} n'a pas de niveau ${k}`); break; }
      const s = req.site;
      if (s.eau.length && !s.eau.includes(site.eau)) erreurs.push(`voie ${voie.cle} : ${cle} ${k} demande l'eau ${s.eau.join("/")} (site : ${site.eau})`);
      for (const c of ["sol", "soleil", "souterrain"]) if (site[c] < s[c]) erreurs.push(`voie ${voie.cle} : ${cle} ${k} demande ${c} ${s[c]} (site : ${site[c]})`);
      for (const r of req.installations) if ((niveaux.get(r.cle) ?? 0) < r.niveau) erreurs.push(`voie ${voie.cle} : ${cle} ${k} demande ${r.cle} ${r.niveau}`);
    }
  }
  for (const saison of SAISONS) {
    const b = bilanVoie(voie, d, saison);
    for (const r of ["eau", "nourriture", "energie"]) if (b[r] < 0) erreurs.push(`voie ${voie.cle} (${saison}) : ${r} net ${b[r]} < 0`);
    if (b.carburant < 0) erreurs.push(`voie ${voie.cle} : consomme du carburant, pas autonome`);
  }
  return erreurs;
}

// ---------------------------------------------------------------- Registre (donnees.json)
const entre = (v, a, b) => typeof v === "number" && v >= a && v <= b;
export function verifierDonnees(d, { module: MODULE = MODULE_PAR_DEFAUT } = {}) {
  const erreurs = [];
  const e = m => erreurs.push(m);
  const index = Object.fromEntries(["regions", "sites", "installations", "savoirs", "factions", "evenements", "passes", "equipements", "recettes",
    "afflictions", "bestiaire", "enfances", "traits"].map(f => {
    const m = new Map();
    for (const o of d[f] ?? []) {
      if (!o.cle || !/^[a-z0-9-]+$/.test(o.cle)) e(`${f} : clé invalide « ${o.cle} »`);
      if (m.has(o.cle)) e(`${f} : clé en double « ${o.cle} »`);
      m.set(o.cle, o);
      if (!o.nom) e(`${f} : « ${o.cle} » sans nom`);
      const texte = o.description ?? o.texte;
      if (texte !== undefined && !sansBalises(texte)) e(`${f} : « ${o.cle} » sans texte`);
    }
    return [f, m];
  }));
  const { regions, sites, installations, savoirs, factions, evenements, passes, equipements, recettes, afflictions, enfances, traits } = index;
  const aSavoirs = (ou, l) => { for (const s of l ?? []) if (!savoirs.has(s)) e(`${ou} : savoir inconnu « ${s} »`); };
  const aEquipements = (ou, l) => { for (const s of l ?? []) if (!equipements.has(s)) e(`${ou} : équipement inconnu « ${s} »`); };
  const aCompetences = (ou, o) => { for (const c of Object.keys(o ?? {})) if (!COMPETENCES.includes(c)) e(`${ou} : compétence inconnue « ${c} »`); };
  const aIncapacites = (ou, l) => { for (const i of l ?? []) if (!INCAPACITES[i]) e(`${ou} : incapacité inconnue « ${i} »`); };
  const aTaches = (ou, o) => { for (const t of Object.keys(o ?? {})) if (!TACHES.includes(t)) e(`${ou} : tâche inconnue « ${t} »`); };

  // Régions.
  if (regions.size < 15) e(`${regions.size} régions seulement`);
  for (const r of regions.values()) {
    const ou = `région ${r.cle}`;
    if (!ZONES.includes(r.zone)) e(`${ou} : zone « ${r.zone} »`);
    if (!entre(r.altitude, 0, 3100)) e(`${ou} : altitude ${r.altitude}`);
    if (!entre(r.population, 0, 5)) e(`${ou} : population ${r.population}`);
    for (const c of ["soleil", "pluie"]) if (!entre(r.climat?.[c], 0, 3)) e(`${ou} : climat.${c}`);
    if (!sansBalises(r.apres)) e(`${ou} : texte « après » vide`);
    for (const res of RESSOURCES) if (!Number.isInteger(r.ressources?.[res]) || r.ressources[res] < 0) e(`${ou} : ressource ${res} invalide`);
    for (const n of NATURE) { const v = r.nature?.[n]; if (!v || !(v.parJour >= 0) || !(v.plafond >= v.parJour)) e(`${ou} : nature ${n} invalide`); }
    for (const res of RESEAUX) {
      const f = r.infrastructures?.[res];
      if (f === null) continue;
      if (!Array.isArray(f) || f.length !== 2 || !(f[0] >= 0 && f[0] <= f[1])) e(`${ou} : fenêtre ${res} invalide`);
    }
    for (const k of r.dangers) if (!evenements.has(k)) e(`${ou} : danger « ${k} » sans événement`);
    for (const f of r.factionsDepart) { if (!factions.has(f.faction)) e(`${ou} : faction « ${f.faction} »`); if (!entre(f.force, 0, 5)) e(`${ou} : force ${f.force}`); }
    if (r.sites.length < 2 || r.sites.length > 4) e(`${ou} : ${r.sites.length} sites (2 à 4 attendus)`);
    for (const s of r.sites) if (sites.get(s)?.region !== r.cle) e(`${ou} : site « ${s} » d'une autre région ou inconnu`);
    if (!entre(r.repere?.x, 0, CARTE.largeur) || !entre(r.repere?.y, 0, CARTE.hauteur)) e(`${ou} : repère hors de la carte`);
    const vus = new Set();
    for (const v of r.voisins) {
      const ici = `${ou} → ${v.region}`;
      if (!regions.has(v.region)) { e(`${ici} : région inconnue`); continue; }
      if (vus.has(v.region)) e(`${ici} : voisine en double`);
      vus.add(v.region);
      if (!TERRAINS.includes(v.terrain)) e(`${ici} : terrain « ${v.terrain} »`);
      if (!(v.km > 0) || !Number.isInteger(v.quartsPied) || v.quartsPied < 1) e(`${ici} : km ou quartsPied invalide`);
      if (v.quartsVehicule !== null && (!Number.isInteger(v.quartsVehicule) || v.quartsVehicule < 1 || v.quartsVehicule > v.quartsPied)) e(`${ici} : quartsVehicule invalide`);
      if (v.terrain === "sentier" && v.quartsVehicule !== null) e(`${ici} : un sentier ne se fait pas en véhicule`);
      if (!v.route) e(`${ici} : route sans nom`);
      for (const c of v.coupure) if (!evenements.has(c)) e(`${ici} : coupure « ${c} » sans événement`);
      const retour = regions.get(v.region).voisins.find(w => w.region === r.cle);
      if (!retour) e(`${ici} : voisinage non symétrique`);
      else for (const k of ["route", "km", "terrain", "quartsPied", "quartsVehicule"]) if (retour[k] !== v[k]) e(`${ici} : « ${k} » différent dans l'autre sens`);
    }
  }
  // Graphe connexe.
  if (regions.size) {
    const [depart] = regions.keys();
    const vues = new Set([depart]), file = [depart];
    while (file.length) for (const v of regions.get(file.shift()).voisins) if (regions.has(v.region) && !vues.has(v.region)) { vues.add(v.region); file.push(v.region); }
    for (const k of regions.keys()) if (!vues.has(k)) e(`région ${k} : inatteignable depuis ${depart}`);
  }
  // Mafate : sans route, sans réseau électrique.
  const mafate = regions.get("mafate");
  if (!mafate) e("Mafate absente");
  else {
    if (mafate.voisins.some(v => v.terrain !== "sentier" || v.quartsVehicule !== null)) e("Mafate : une liaison n'est pas un sentier à pied");
    if (mafate.infrastructures.electricite !== null) e("Mafate : l'électricité (solaire des cases) ne doit pas tomber");
    if (mafate.zone !== "cirque") e("Mafate : zone cirque attendue");
  }

  // Sites.
  if (sites.size < 45) e(`${sites.size} sites seulement`);
  for (const s of sites.values()) {
    const ou = `site ${s.cle}`;
    if (!regions.has(s.region)) e(`${ou} : région inconnue`);
    if (!TYPES_SITE.includes(s.type)) e(`${ou} : type « ${s.type} »`);
    if (!EAUX_SITE.includes(s.eau)) e(`${ou} : eau « ${s.eau} »`);
    if (!(s.capacite > 0)) e(`${ou} : capacité`);
    for (const c of ["defense", "discretion"]) if (!entre(s[c], 0, 5)) e(`${ou} : ${c}`);
    for (const c of ["sol", "soleil", "souterrain", "acces"]) if (!entre(s[c], 0, 3)) e(`${ou} : ${c}`);
    if (!s.atouts?.length || !s.defauts?.length) e(`${ou} : atouts ou défauts manquants`);
    for (const r of Object.keys(s.stocks)) if (!STOCKS.includes(r)) e(`${ou} : stock ${r}`);
    for (const i of s.installationsDepart) {
      const def = installations.get(i.installation);
      if (!def) e(`${ou} : installation de départ inconnue « ${i.installation} »`);
      else if (!Number.isInteger(i.niveau) || i.niveau < 1 || i.niveau > def.niveauMax) e(`${ou} : niveau ${i.niveau} de ${i.installation}`);
    }
    if (s.type === "tunnel-de-lave" && s.souterrain !== 3) e(`${ou} : un tunnel de lave a souterrain 3`);
  }
  const tunnels = [...sites.values()].filter(s => s.type === "tunnel-de-lave");
  if (!tunnels.some(s => ["sud-sauvage", "fournaise"].includes(s.region))) e("aucun tunnel de lave dans le Sud ou le Sud-Est");
  for (const t of ["ilet", "gite", "case-creole", "ecole", "caserne", "commerce", "ferme", "phare", "port", "usine"]) if (![...sites.values()].some(s => s.type === t)) e(`aucun site de type ${t}`);

  // Installations.
  if (installations.size < 28) e(`${installations.size} installations seulement`);
  for (const i of installations.values()) {
    const ou = `installation ${i.cle}`;
    if (!CATEGORIES.includes(i.categorie)) e(`${ou} : catégorie « ${i.categorie} »`);
    if (i.niveauMax !== i.niveaux.length || !i.niveaux.length) e(`${ou} : niveauMax ${i.niveauMax} ≠ ${i.niveaux.length} niveaux`);
    if (i.niveau !== 0 || i.chantier.requis !== i.niveaux[0]?.cout.travail) e(`${ou} : niveau 0 et chantier du niveau 1 attendus`);
    i.niveaux.forEach((n, k) => {
      const ici = `${ou} niveau ${k + 1}`;
      if (!(n.cout.travail > 0)) e(`${ici} : travail manquant`);
      for (const [r, q] of Object.entries(n.cout)) if (r !== "travail" && (!RESSOURCES.includes(r) || !(q >= 0))) e(`${ici} : coût ${r}`);
      aSavoirs(ici, n.requiert.savoirs);
      for (const x of n.requiert.site.eau) if (!EAUX_SITE.includes(x)) e(`${ici} : eau de site « ${x} »`);
      for (const r of n.requiert.installations) {
        if (r.cle === i.cle) e(`${ici} : se demande elle-même`);
        const autre = installations.get(r.cle);
        if (!autre) e(`${ici} : installation requise inconnue « ${r.cle} »`);
        else if (!entre(r.niveau, 1, autre.niveauMax)) e(`${ici} : niveau requis ${r.niveau} de ${r.cle}`);
      }
      for (const r of Object.keys(n.effets.production)) if (!STOCKS.includes(r)) e(`${ici} : production ${r}`);
      for (const r of Object.keys(n.effets.consommation)) if (!STOCKS.includes(r)) e(`${ici} : consommation ${r}`);
      if (n.effets.conditions.riviere && !n.requiert.site.eau.includes("riviere")) e(`${ici} : condition rivière sans site à rivière`);
      if (n.effets.bras && (!TACHES.includes(n.effets.bras.tache) || !(n.effets.bras.nombre >= 1))) e(`${ici} : bras invalides`);
      aCompetences(ici, n.effets.bonus);
      // Cohérence : un niveau ne fait pas moins que le précédent.
      const avant = i.niveaux[k - 1]?.effets;
      if (avant) for (const [r, q] of Object.entries(avant.production)) if ((n.effets.production[r] ?? 0) < q) e(`${ici} : produit moins de ${r} que le niveau précédent`);
      if (avant) for (const c of ["defense", "discretion", "capacite", "protectionCyclone"]) if (n.effets[c] < avant[c]) e(`${ici} : ${c} plus bas qu'au niveau précédent`);
    });
  }
  for (const k of ["citerne-de-pluie", "captage-de-source", "potager", "serre", "verger", "basse-cour", "bassin-a-tilapias", "ruches", "compost",
    "panneaux-solaires", "batteries", "pico-hydro", "galerie-souterraine", "tunnel-de-lave-amenage", "reserve-etanche", "sechoir-fumoir", "camouflage", "mur"]) {
    if (!installations.has(k)) e(`installation attendue absente : ${k}`);
  }
  if (installations.get("galerie-souterraine")?.niveauMax !== 4) e("la galerie souterraine a quatre niveaux");
  // Voies d'autonomie.
  if (!d.autonomie?.voies?.length) e("aucune voie d'autonomie");
  for (const v of d.autonomie?.voies ?? []) erreurs.push(...verifierVoie(v, d));
  for (const k of d.autonomie?.voieDefensive ?? []) if (!installations.has(k)) e(`voie défensive : ${k} inconnue`);

  // Genre d'un passé ou d'une enfance (§10) : f, m ou vide ; nomAutre seulement avec un genre (en anglais, souvent le même mot).
  const aGenre = (ou, o) => {
    if (o.genre && !["f", "m"].includes(o.genre)) e(`${ou} : genre inconnu « ${o.genre} » (f, m ou vide)`);
    if (o.nomAutre && !o.genre) e(`${ou} : nomAutre sans genre`);
  };
  // Savoirs, passés, équipements.
  for (const s of savoirs.values()) if (!sansBalises(s.apprentissage) || !sansBalises(s.effets)) e(`savoir ${s.cle} : apprentissage ou effets vides`);
  for (const p of passes.values()) {
    const ou = `passé ${p.cle}`;
    aCompetences(ou, p.competences); aSavoirs(ou, p.savoirs); aEquipements(ou, p.equipement); aIncapacites(ou, p.incapacites);
    if (Object.values(p.competences).some(n => !entre(n, 0, 3))) e(`${ou} : modificateur hors de 0..3`);
    if (p.region && !regions.has(p.region)) e(`${ou} : région « ${p.region} »`);
    if (!p.histoire?.length) e(`${ou} : sans phrases d'histoire`);
    aGenre(ou, p);
  }
  for (const q of equipements.values()) {
    const ou = `équipement ${q.cle}`;
    if (!CATEGORIES_EQUIPEMENT.includes(q.categorie)) e(`${ou} : catégorie « ${q.categorie} »`);
    aCompetences(ou, q.bonus);
    if (q.categorie === "arme-a-feu" && !(q.munitions > 0)) e(`${ou} : arme à feu sans munitions`);
    if (q.transport) {
      if (!TRANSPORTS.includes(q.transport.mode)) e(`${ou} : mode « ${q.transport.mode} »`);
      if (!q.transport.terrains?.length || q.transport.terrains.some(t => !TERRAINS.includes(t))) e(`${ou} : terrains invalides`);
      if (!(q.transport.carburantParQuart >= 0) || !(q.transport.chargeMax > 0)) e(`${ou} : carburant ou charge invalide`);
    }
  }
  if (![...equipements.values()].some(q => q.transport)) e("aucun véhicule ni monture");

  // Recettes, afflictions, bestiaire.
  for (const r of recettes.values()) {
    const ou = `recette ${r.cle}`;
    if (!COMPETENCES.includes(r.competence) || !DIFFICULTES.includes(r.difficulte)) e(`${ou} : compétence ou difficulté`);
    if (!(r.travail > 0)) e(`${ou} : travail`);
    for (const k of Object.keys(r.cout)) if (!STOCKS.includes(k)) e(`${ou} : coût ${k}`);
    aSavoirs(ou, r.requiert.savoirs);
    const ri = typeof r.requiert.installation === "string" ? { cle: r.requiert.installation, niveau: 1 } : r.requiert.installation;
    if (ri && (!installations.has(ri.cle) || ri.niveau > installations.get(ri.cle).niveauMax)) e(`${ou} : installation requise ${ri.cle}`);
    if (r.produit.equipement ? !equipements.has(r.produit.equipement) : !STOCKS.includes(r.produit.ressource)) e(`${ou} : produit inconnu`);
    if (!(r.produit.n >= 1)) e(`${ou} : quantité produite`);
  }
  for (const a of afflictions.values()) {
    const ou = `affliction ${a.cle}`;
    if (!["maladie", "blessure", "psychique"].includes(a.categorie)) e(`${ou} : catégorie`);
    if (!COMPETENCES.includes(a.soin.competence) || !DIFFICULTES.includes(a.soin.difficulte)) e(`${ou} : soin`);
    if (![null, "eau", "moustiques", "ravine", "chaleur"].includes(a.declencheur)) e(`${ou} : déclencheur`);
    if (!(a.duree > 0) || !entre(a.contagion, 0, 1) || !entre(a.risque, 0, 1)) e(`${ou} : durée, contagion ou risque`);
  }
  for (const b of d.bestiaire ?? []) if (!(b.des >= 1) || !(b.resistance >= 1) || !["livide", "animal", "humain"].includes(b.categorie)) e(`bestiaire ${b.cle} : fiche invalide`);
  for (const k of ["livide-frais", "livide-des-hauts", "noye-du-lagon", "livide-brule", "coureur", "chien-errant", "cochon-marron"]) if (!index.bestiaire.has(k)) e(`bestiaire : ${k} absent`);

  // Factions, événements, réputations.
  if (factions.size < 6 || factions.size > 8) e(`${factions.size} factions (6 à 8 attendues)`);
  for (const f of factions.values()) {
    if (!ATTITUDES.includes(f.attitude)) e(`faction ${f.cle} : attitude`);
    for (const r of f.regionsDepart) if (!regions.has(r)) e(`faction ${f.cle} : région « ${r} »`);
    for (const r of f.ressourcesPreferees) if (!RESSOURCES.includes(r)) e(`faction ${f.cle} : ressource « ${r} »`);
    if (!sansBalises(f.veulent) || !sansBalises(f.traiter)) e(`faction ${f.cle} : textes vides`);
  }
  if (evenements.size < 38) e(`${evenements.size} événements seulement`);
  for (const v of evenements.values()) {
    const ou = `événement ${v.cle}`;
    if (!TYPES_EVENEMENT.includes(v.type)) e(`${ou} : type`);
    if (!v.phases.length || v.phases.some(p => !PHASES.includes(p))) e(`${ou} : phases`);
    if (!v.zones.length || v.zones.some(z => !ZONES.includes(z))) e(`${ou} : zones`);
    if (!v.saisons.length || v.saisons.some(s => !SAISONS.includes(s))) e(`${ou} : saisons`);
    if (!(v.poids > 0) || typeof v.public !== "boolean") e(`${ou} : poids ou public`);
    if (v.effets.faction && !factions.has(v.effets.faction)) e(`${ou} : faction « ${v.effets.faction} »`);
    if (v.effets.route && !["difficile", "coupee"].includes(v.effets.route)) e(`${ou} : route « ${v.effets.route} »`);
  }
  for (const t of TYPES_EVENEMENT) if (![...evenements.values()].some(v => v.type === t)) e(`aucun événement de type ${t}`);
  for (const r of d.reputations?.factions ?? []) if (!factions.has(r.faction) || r.horloge !== `rep-${r.faction}`) e(`réputation ${r.faction} : faction ou horloge`);
  if ((d.reputations?.factions ?? []).length !== factions.size) e("une réputation par faction attendue");

  // §10 : enfances, traits.
  if (enfances.size < 18) e(`${enfances.size} enfances seulement`);
  for (const x of enfances.values()) {
    const ou = `enfance ${x.cle}`;
    aCompetences(ou, x.modificateurs); aSavoirs(ou, x.savoirs); aEquipements(ou, x.equipement); aIncapacites(ou, x.incapacites);
    if (Object.values(x.modificateurs).some(n => !Number.isInteger(n) || n < -1 || n > 2 || n === 0)) e(`${ou} : modificateur hors de −1..+2`);
    if (!x.histoire?.length || !(x.poids > 0)) e(`${ou} : histoire ou poids`);
    if (x.region && !regions.has(x.region)) e(`${ou} : région « ${x.region} »`);
    aGenre(ou, x);
  }
  if (traits.size < 28) e(`${traits.size} traits seulement`);
  for (const t of traits.values()) {
    const ou = `trait ${t.cle}`;
    aCompetences(ou, t.effets.competences); aTaches(ou, t.effets.taches); aIncapacites(ou, t.incapacites);
    if (!(t.poids > 0)) e(`${ou} : poids`);
    for (const c of t.incompatibles) {
      if (c === t.cle) e(`${ou} : incompatible avec lui-même`);
      else if (!traits.has(c)) e(`${ou} : incompatible inconnu « ${c} »`);
      else if (!traits.get(c).incompatibles.includes(t.cle)) e(`${ou} : incompatibilité avec « ${c} » non symétrique`);
    }
  }
  if (!d.recrues?.raisons?.length || !d.recrues?.prix?.length || !d.histoire?.proche?.length || !d.histoire?.matin?.length) e("tables des recrues ou de l'histoire vides");

  // Fêtes : chaque clé est une fête du socle du moteur, déclinable telle quelle (une déclinaison par fête), dates au socle seul.
  const declinees = [];
  for (const f of d.fetes ?? []) {
    const ou = `fête ${f.cle}`;
    if (!FETES_MOTEUR.includes(f.cle)) e(`${ou} : clé inconnue du socle des fêtes du moteur`);
    else {
      try { declinees.push(normaliserDeclinaison({ id: `fenoir-${f.cle}`, fete: f.cle, nom: f.nom, description: f.description, consigne: f.consigne, decor: f.decor }, declinees)); }
      catch (x) { e(`${ou} : ${x.message}`); }
    }
    if (!f.nom || f.nom.length > 80 || !f.description || f.description.length > 600 || !f.consigne || f.consigne.length > 300) e(`${ou} : nom, description ou consigne trop longs ou vides`);
    if (!f.periode || f.periode.includes("-")) e(`${ou} : période absente ou avec un trait d'union (le journal la lit telle quelle)`);
    if ("date" in f || "dates" in f) e(`${ou} : date codée en dur (le socle du moteur donne les dates)`);
    if (f.image !== (IMAGES_FETES.includes(f.cle) ? `modules/${MODULE}/assets/fetes/${f.cle}.jpg` : "")) e(`${ou} : chemin d'image`);
    // Gain et coût (lot « fetes ») : un effet de forme connue, et leur texte pour les joueurs.
    const ef = f.effet ?? {};
    for (const k of Object.keys(ef)) if (!CHAMPS_EFFET_FETE.includes(k)) e(`${ou} : champ d'effet inconnu « ${k} »`);
    for (const o of Object.values(ef.options ?? {})) for (const k of Object.keys(o)) if (!CHAMPS_EFFET_FETE.includes(k) || k === "options") e(`${ou} : champ d'option inconnu « ${k} »`);
    if (!f.gain || !f.cout) e(`${ou} : gain ou coût sans texte`);
    if (!(f.communautes ?? []).length || f.communautes.some(c => !COMMUNAUTES.includes(c))) e(`${ou} : communautés absentes ou inconnues`);
  }
  for (const k of FETES_DE_FENOIR) if (!(d.fetes ?? []).some(f => f.cle === k)) e(`fête absente : ${k}`);

  // Le marché (contenu/marche.mjs) : cibles des préjugés connues, gens du marché de toutes les communautés, chaque préjugé dit
  // au marché démenti par un événement, marchés et foires dans des régions connues, événements de marché bien faits.
  const cibles = new Set((d.communautes ?? []).map(c => c.cle));
  const STADES = ["troc", "boutique", "forain", "foire"];
  for (const c of d.communautes ?? []) if (!/^[a-z0-9-]+$/.test(c.cle ?? "") || !c.nom || !c.description) e(`communauté ${c.cle} : clé, nom ou description`);
  for (const m of d.marchands ?? []) {
    const ou = `marchand ${m.cle}`;
    if (!index.regions.has(m.region)) e(`${ou} : région « ${m.region} »`);
    if (m.communaute !== "metis" && !cibles.has(m.communaute)) e(`${ou} : communauté « ${m.communaute} »`);
    if (!m.prejuges?.length) e(`${ou} : sans préjugé (chacun en a sur chacun)`);
    for (const p of m.prejuges ?? []) {
      if (!cibles.has(p.cible)) e(`${ou} : préjugé à cible inconnue « ${p.cible} »`);
      if (!(p.poids >= 1 && p.poids <= 3) || !p.dit) e(`${ou} : préjugé mal formé`);
    }
    if (!m.nom || !m.role || !m.apparence || !sansBalises(m.description) || !m.onDit || !m.dementi) e(`${ou} : textes incomplets`);
    const ev = index.evenements.get(m.evenement);
    if (!ev || ev.type !== "marche") e(`${ou} : événement de marché « ${m.evenement} »`);
  }
  const roles = new Set((d.marchands ?? []).map(m => m.role));
  if (roles.size !== (d.marchands ?? []).length) e("marchands : un rôle par marchand (aucun rôle réservé, aucun rôle en double)");
  for (const m of d.marches ?? []) {
    if (!index.regions.has(m.region) || !(m.jourSemaine >= 0 && m.jourSemaine <= 6) || !m.lieu) e(`marché ${m.cle} : région, jour ou lieu`);
    for (const b of m.bastions ?? []) if (!index.factions.has(b)) e(`marché ${m.cle} : bastion « ${b} »`);
  }
  for (const f of d.foires ?? []) if (!index.regions.has(f.region) || !(f.mois >= 1 && f.mois <= 12) || !RESSOURCES.includes(f.recolte) || !f.produit) e(`foire ${f.cle} : région, mois, récolte ou produit`);
  for (const v of index.evenements.values()) {
    if (v.type !== "marche") { if (v.stades) e(`événement ${v.cle} : stades hors d'un événement de marché`); continue; }
    if (!v.stades?.length || v.stades.some(s => !STADES.includes(s))) e(`événement ${v.cle} : stades`);
    if (v.effets.dementi && !cibles.has(v.effets.dementi)) e(`événement ${v.cle} : démenti « ${v.effets.dementi} »`);
  }

  // Créatures (famille lue par la logique du système) : les Livides et animaux du bestiaire, mêmes dés et résistance.
  const creatures = new Map((d.creatures ?? []).map(c => [c.cle, c]));
  if (creatures.size !== (d.creatures ?? []).length) e("créatures : clé en double");
  for (const c of creatures.values()) {
    const b = index.bestiaire.get(c.cle);
    if (!b) { e(`créature ${c.cle} : absente du bestiaire`); continue; }
    if (!["livide", "animal"].includes(c.type) || c.type !== b.categorie) e(`créature ${c.cle} : type « ${c.type} »`);
    if (c.des !== b.des || c.resistance !== b.resistance || !(c.poids > 0) || !c.nom) e(`créature ${c.cle} : dés, résistance, poids ou nom`);
    if (!c.zones?.length || c.zones.some(z => !ZONES.includes(z)) || !c.phases?.length || c.phases.some(p => !PHASES.includes(p))) e(`créature ${c.cle} : zones ou phases`);
  }
  for (const b of index.bestiaire.values()) if (b.categorie !== "humain" && !creatures.has(b.cle)) e(`créatures : ${b.cle} absente`);

  // Aucun terme interdit dans tout le registre.
  const interdits = termesInterdits(JSON.stringify(d));
  if (interdits.length) e(`registre : terme interdit (${interdits.join(", ")})`);
  return erreurs;
}

// ---------------------------------------------------------------- Le registre vu comme des documents (traduction)
// Le système lit le registre par CLÉS (jamais traduites) ; ses textes passent par le même dictionnaire que les compendiums.
// Chaque fiche d'une famille à clés (regions, sites, installations, factions, fêtes…) devient un pseudo-document
// « registre/<famille>/<clé> » ; une famille sans clés (routes, reputations, recrues, histoire, autonomie) un seul,
// « registre/<famille> » (un tableau est rangé sous « liste »). Rend [{ pack: "registre", cle, doc, famille, indice, nom }].
const aDesCles = v => Array.isArray(v) && v.length > 0 && v.every(o => o && typeof o === "object" && typeof o.cle === "string");
export function registreEnDocuments(registre) {
  const docs = [];
  for (const [famille, valeur] of Object.entries(registre)) {
    if (FAMILLES_NON_TRADUITES.includes(famille)) continue;
    if (aDesCles(valeur)) {
      valeur.forEach((o, indice) => docs.push({ pack: PACK_REGISTRE, cle: `${PACK_REGISTRE}:${famille}/${o.cle}`, famille, indice, nom: o.nom ?? o.cle,
        doc: { _id: `${famille}/${o.cle}`, ...structuredClone(o) } }));
    } else {
      docs.push({ pack: PACK_REGISTRE, cle: `${PACK_REGISTRE}:${famille}`, famille, indice: null, nom: famille,
        doc: { _id: famille, ...(Array.isArray(valeur) ? { liste: structuredClone(valeur) } : structuredClone(valeur)) } });
    }
  }
  return docs;
}
// L'inverse : le registre recomposé (même ordre, familles non traduites reprises telles quelles) à partir des pseudo-documents.
export function documentsEnRegistre(registre, docs) {
  const sortie = structuredClone(registre);
  for (const { famille, indice, doc } of docs) {
    const { _id, ...reste } = doc;
    if (indice === null) sortie[famille] = Array.isArray(registre[famille]) ? reste.liste : reste;
    else sortie[famille][indice] = reste;
  }
  return sortie;
}

// ---------------------------------------------------------------- Dictionnaires de traduction
// Union des dictionnaires contenu/en/<pack>.json (module.json, figurants.json et carte.json à part : manifeste, assets et textes
// gravés de la carte de l'île, outils/fabriquer-carte.mjs). Rend { dictionnaire, packs }.
export function lireDictionnaires(dossier = DOSSIER_DICTIONNAIRES) {
  const dictionnaire = {}, packs = [];
  if (!existsSync(dossier)) return { dictionnaire, packs };
  for (const f of readdirSync(dossier).filter(f => f.endsWith(".json") && !["module.json", "figurants.json", "carte.json"].includes(f)).sort()) {
    Object.assign(dictionnaire, JSON.parse(readFileSync(join(dossier, f), "utf8")));
    packs.push(f.slice(0, -5));
  }
  return { dictionnaire, packs };
}

// Les textes extraits des documents et du registre : { squelette, tout } (traduction.mjs), le registre sous le pack « registre ».
export function extraireTout(docs, registre) {
  const pseudo = registreEnDocuments(registre);
  const { squelette, tout } = extraire([...docs, ...pseudo], OPTIONS_TRADUCTION);
  for (const p of pseudo) {
    const cle = `${PACK_REGISTRE}/${p.doc._id}`;
    if (tout[PACK_REGISTRE]?.[cle]) tout[PACK_REGISTRE][cle]._nom = p.nom;
    if (squelette[PACK_REGISTRE]?.[cle]) squelette[PACK_REGISTRE][cle]._nom = p.nom;
  }
  return { squelette, tout };
}

// Écrit ou met à jour les squelettes contenu/en/<pack>.json (traductions existantes conservées, sources changées signalées).
// Rend, par pack, { entrees, traduites, nouvelles, conservees, obsoletes, supprimees }.
export function extraireDictionnaires(docs, registre, dossier = DOSSIER_DICTIONNAIRES) {
  const { squelette, tout } = extraireTout(docs, registre);
  mkdirSync(dossier, { recursive: true });
  const bilan = {};
  for (const pack of [...Object.keys(TYPE_PACK), PACK_REGISTRE]) {
    if (!squelette[pack]) continue;
    const fichier = join(dossier, `${pack}.json`);
    const existant = existsSync(fichier) ? JSON.parse(readFileSync(fichier, "utf8")) : {};
    const { dictionnaire, rapport } = fusionner(squelette[pack], existant, tout[pack]);
    ecrire(fichier, `${JSON.stringify(dictionnaire, null, 2)}\n`);
    const entrees = Object.values(dictionnaire).reduce((n, e) => n + Object.keys(e).filter(k => !k.startsWith("_")).length, 0);
    const traduites = Object.values(dictionnaire).reduce((n, e) => n + Object.values(e).filter(t => t?.en).length, 0);
    bilan[pack] = { entrees, traduites, ...rapport };
  }
  return bilan;
}

// Le module anglais en mémoire : documents traduits (uuid, chemins et drapeaux récrits vers lakour-fenoir-en) et registre
// traduit (mêmes clés, chemins d'images récrits, « module » = lakour-fenoir-en). Rend { documents, registre, rapport }.
export function fabriquerAnglais(docs = fabriquer(), registre = donneesContenu(), dictionnaire = lireDictionnaires().dictionnaire) {
  const pseudo = registreEnDocuments(registre);
  const { documents, rapport } = appliquer([...docs, ...pseudo], dictionnaire, { ...OPTIONS_TRADUCTION, deId: MODULE, versId: MODULE_EN });
  const traduits = documents.filter(d => d.pack !== PACK_REGISTRE);
  const registreEn = documentsEnRegistre(registre, documents.filter(d => d.pack === PACK_REGISTRE));
  registreEn.module = MODULE_EN;
  return { documents: traduits, registre: registreEn, rapport };
}

// Manifeste du module anglais : celui du module français, identifiant, titre, description, étiquettes des packs et dossiers
// pris dans contenu/en/module.json, conflit déclaré avec le module français (mêmes documents : un seul des deux actif).
export function manifesteAnglais(manifeste, traductions) {
  const en = structuredClone(manifeste);
  en.id = MODULE_EN;
  en.title = traductions.title ?? `${manifeste.title} (English)`;
  en.description = traductions.description ?? manifeste.description;
  if (manifeste.manifest) en.manifest = manifeste.manifest.replace(/module\.json$/, `${MODULE_EN}.json`);
  if (manifeste.download) en.download = manifeste.download.replace(`${MODULE}.zip`, `${MODULE_EN}.zip`);
  en.packs = manifeste.packs.map(p => ({ ...p, label: traductions.packs?.[p.name] ?? p.label }));
  en.packFolders = (manifeste.packFolders ?? []).map(f => ({ ...f, name: traductions.packFolders?.[f.name] ?? f.name }));
  en.relationships = { ...manifeste.relationships, conflicts: [...(manifeste.relationships?.conflicts ?? []).filter(c => c.id !== MODULE),
    { id: MODULE, type: "module", reason: `Same documents and identifiers as ${MODULE}: enable only one of the two.` }] };
  return en;
}

// Libellés anglais des types de figurants (assets/jetons/figurants.json, champ « libelle », lu par le MJ IA), appliqués à une
// table { type: { libelle, jeton } } : contenu/en/figurants.json donne { type: "English label" }. Clés et jetons inchangés.
export function traduireFigurants(table, libelles = {}) {
  const sortie = structuredClone(table);
  for (const [type, f] of Object.entries(sortie)) if (typeof libelles[type] === "string" && libelles[type].trim()) f.libelle = libelles[type];
  return sortie;
}

// Copie le dossier du module français (COPIES) dans le module anglais : JSON des assets récrits (« modules/lakour-fenoir/ » ->
// « modules/lakour-fenoir-en/ »), libellés des figurants traduits (contenu/en/figurants.json), plans.json refait avec les
// plans traduits des scènes, registre traduit.
function copierModule(documents, registre) {
  for (const element of COPIES) {
    const source = join(RACINE, element), cible = join(RACINE_EN, element);
    if (!existsSync(source)) continue;
    rmSync(cible, { recursive: true, force: true });
    cpSync(source, cible, { recursive: true });
  }
  const recrireJson = dossier => {
    for (const f of readdirSync(dossier, { withFileTypes: true })) {
      const chemin = join(dossier, f.name);
      if (f.isDirectory()) recrireJson(chemin);
      else if (f.name.endsWith(".json")) ecrire(chemin, readFileSync(chemin, "utf8").replaceAll(`modules/${MODULE}/`, `modules/${MODULE_EN}/`));
    }
  };
  // Assets propres au module anglais (contenu/en/assets/, hors du zip français) : remplacent ceux du français au même chemin,
  // donc sans rien changer aux documents (la carte de l'île en anglais : assets/cartes/reunion.webp).
  const assetsAnglais = join(DOSSIER_DICTIONNAIRES, "assets");
  if (existsSync(assetsAnglais)) cpSync(assetsAnglais, join(RACINE_EN, "assets"), { recursive: true });
  recrireJson(join(RACINE_EN, "assets"));
  const figurants = join(RACINE_EN, "assets", "jetons", "figurants.json"), libelles = join(DOSSIER_DICTIONNAIRES, "figurants.json");
  if (existsSync(figurants) && existsSync(libelles)) {
    const table = traduireFigurants(JSON.parse(readFileSync(figurants, "utf8")), JSON.parse(readFileSync(libelles, "utf8")));
    ecrire(figurants, `${JSON.stringify(table, null, 2)}\n`);
  }
  const plans = {};
  for (const { pack, doc } of documents) if (pack === "scenes" && doc.flags?.[MODULE_EN]?.plan) plans[doc.flags[MODULE_EN].cle] = doc.flags[MODULE_EN].plan;
  ecrire(join(RACINE_EN, "assets", "cartes", "plans.json"), `${JSON.stringify(plans, null, 1)}\n`);
  ecrire(join(RACINE_EN, "assets", "donnees.json"), `${JSON.stringify(registre, null, 1)}\n`);
}

// ---------------------------------------------------------------- Fabrication
// Écrit src/<pack>/*.json puis compile packs/ pour un module (racine), à partir de documents { pack, cle, doc }.
async function ecrireEtCompiler(docs, racine, compiler) {
  const parPack = Object.groupBy(docs, d => d.pack);
  for (const [pack, liste] of Object.entries(parPack)) {
    const dossier = join(racine, "src", pack);
    rmSync(dossier, { recursive: true, force: true });
    mkdirSync(dossier, { recursive: true });
    for (const { cle, doc } of liste) ecrire(join(dossier, `${cle.split(":")[1]}.json`), `${JSON.stringify(doc, null, 2)}\n`);
    console.log(`${pack.padEnd(14)} ${liste.length} documents`);
  }
  if (compiler) {
    for (const pack of Object.keys(parPack)) {
      rmSync(join(racine, "packs", pack), { recursive: true, force: true });
      await compilePack(join(racine, "src", pack), join(racine, "packs", pack));
    }
    console.log("compendiums compilés dans", join(racine, "packs"));
  }
}

const lanceDirectement = () => {
  try { return realpathSync(fileURLToPath(import.meta.url)) === realpathSync(resolve(process.argv[1] ?? "")); } catch { return false; }
};

if (lanceDirectement()) {
  const docs = fabriquer();
  const registre = donneesContenu();
  const erreurs = [...verifierDocuments(docs), ...verifierDonnees(registre)];
  if (erreurs.length) {
    console.error(`Contenu non conforme au contrat :\n- ${erreurs.join("\n- ")}`);
    process.exit(1);
  }
  const langue = process.argv.includes("--langue") ? process.argv[process.argv.indexOf("--langue") + 1] : "fr";
  const compiler = !process.argv.includes("--sans-compiler");

  if (process.argv.includes("--extraire")) {
    // Squelettes des dictionnaires : un fichier par pack (et registre.json), traductions existantes conservées.
    const bilan = extraireDictionnaires(docs, registre);
    for (const [pack, b] of Object.entries(bilan)) {
      console.log(`${pack.padEnd(14)} ${String(b.traduites).padStart(4)}/${String(b.entrees).padEnd(4)} traduites, ${b.nouvelles} nouvelle(s)`
        + `${b.obsoletes.length ? `, ${b.obsoletes.length} obsolète(s) (enAncien à vérifier)` : ""}${b.supprimees.length ? `, ${b.supprimees.length} retirée(s)` : ""}`);
      for (const o of b.obsoletes) console.warn(`  obsolète : ${o}`);
    }
    console.log(`dictionnaires dans ${DOSSIER_DICTIONNAIRES}`);
  } else if (langue === "fr") {
    await ecrireEtCompiler(docs, RACINE, compiler);
    mkdirSync(dirname(FICHIER_DONNEES), { recursive: true });
    ecrire(FICHIER_DONNEES, `${JSON.stringify(registre, null, 1)}\n`);
    ecrirePlans();
    console.log(`registre       ${Object.entries(registre).filter(([, v]) => Array.isArray(v)).map(([k, v]) => `${k} ${v.length}`).join(", ")}`);
  } else if (langue === "en") {
    const { dictionnaire } = lireDictionnaires();
    const { documents, registre: registreEn, rapport } = fabriquerAnglais(docs, registre, dictionnaire);
    console.log(resumerRapport(rapport));
    for (const o of rapport.obsoletes) console.warn(`avertissement : traduction obsolète (le français a changé, relancer --extraire) : ${o}`);
    if (rapport.erreurs.length) {
      console.error(`${rapport.erreurs.length} traduction(s) en écart de balises ou de liens :`);
      for (const e of rapport.erreurs) console.error(`- ${e.cle}:${e.chemin}\n    ${e.ecarts.join("\n    ")}`);
      process.exit(1);
    }
    // Les mêmes vérifications qu'en français, sur les documents et le registre anglais (termes interdits compris).
    const erreursEn = [...verifierDocuments(documents, { module: MODULE_EN }), ...verifierDonnees(registreEn, { module: MODULE_EN })];
    if (erreursEn.length) { console.error(`Contenu anglais non conforme au contrat :\n- ${erreursEn.join("\n- ")}`); process.exit(1); }
    const manifeste = JSON.parse(readFileSync(join(RACINE, "module.json"), "utf8"));
    const fichierManifeste = join(DOSSIER_DICTIONNAIRES, "module.json");
    const traductions = existsSync(fichierManifeste) ? JSON.parse(readFileSync(fichierManifeste, "utf8")) : {};
    mkdirSync(RACINE_EN, { recursive: true });
    ecrire(join(RACINE_EN, "module.json"), `${JSON.stringify(manifesteAnglais(manifeste, traductions), null, 2)}\n`);
    copierModule(documents, registreEn);
    await ecrireEtCompiler(documents, RACINE_EN, compiler);
    const ecarts = verifierModuleDeContenu(RACINE_EN);
    if (ecarts.length) { console.error(`${RACINE_EN} : ${ecarts.length} écart(s) au contrat des modules de contenu :\n- ${ecarts.join("\n- ")}`); process.exit(1); }
    console.log(`${RACINE_EN} : module anglais complet (contrat du contenu respecté) ; ${rapport.manquants.length} texte(s) encore en français`);
  } else {
    console.error(`Langue inconnue : ${langue} (fr ou en)`);
    process.exit(2);
  }
}
