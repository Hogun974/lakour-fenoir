// L'API du système : game.lakourSurvie (contrat §5, et ce que le MJ IA suppose en plus : modules/lakour-mj-ia/docs/survie.md).
// Elle appelle la logique pure (logique/*.mjs) et applique ses retours aux documents : acteurs survivants, acteur abri et ses
// installations incorporées, journal et alertes de l'état public, monde réel (secret) scellé au coffre du MJ IA.
//
// Règles :
// - Les fonctions qui écrivent ne marchent que chez le MJ actif (sinon : erreur « LAKOUR_SURVIE.Erreurs.PasMJActif ») ; celles qui
//   touchent l'état de la partie, seulement quand le monde réel est ouvert dans ce navigateur (sinon « MondeFerme » : il est
//   cherché aussitôt au coffre). Une seule écriture à la fois (file).
// - Exceptions demandées par le jeu : un joueur propriétaire lance le test de SON survivant (test, forcer), choisit SA tâche
//   (assigner), propose une action (proposer), crée son survivant (creerSurvivant) : la demande part au MJ actif par le socket
//   (l'émetteur donné par le serveur fait foi), qui l'exécute et répond.
// - Rien du monde réel ne sort d'ici vers les joueurs : ni réglage monde en clair (avec le moteur), ni chat, ni socket. Les
//   rencontres et menaces tirées sont rendues à l'appelant (MJ actif) et gardées dans le monde scellé (monde().menaces).
// - Les erreurs sont des clés de traduction (LAKOUR_SURVIE.Erreurs.*) ou des phrases claires (raisons de la logique).
import * as L from "../logique/index.mjs";
import { ID, COMPETENCES, RESSOURCES, NATURE, DIFFICULTES, BORNES, PALIERS_VISIBILITE, borner } from "../logique/constantes.mjs";
import { creerRegistre } from "./registre.mjs";
import { estMJActif, emettre, versMJ, annoncer, auteur, vientDuMJActif } from "./canal.mjs";
import {
  t, langue, lireEtat, reglage, aPlat, acteur, survivantsDuGroupe, abriCourant, proprietaireDe, MODULE_MJIA, MODULE_CONTENU, sansBalises, localiser, entreeTexte
} from "./donnees.mjs";
import * as Coffre from "./coffre.mjs";
import { carteTest, carteTemps, carteAction, carteAssaut, carteDemandeTest, carteProposition, texteTest, texteStocks } from "./cartes.mjs";
import { fetesDuJeu, trouverFete, suivreFetesDuJeu } from "./fetes.mjs";
import { lireBudget } from "./reglages.mjs";
import { ecrireChroniques, chapitreOuvert } from "./chroniques.mjs";
import { deMJ, trouverDemande, fermerDemande, argumentsDuTestJoueur, propositionPermise } from "./demandes.mjs";

export const registre = creerRegistre();
export const contenu = () => registre.contenu();
export const dateDepart = () => { const d = reglage("dateDepart", L.DATE_DEPART); return L.dateValide(d) ? d : L.DATE_DEPART; };

export const TACHES = Object.keys(L.TACHES);
export const PACKS = { installation: "installations", savoir: "savoirs", equipement: "equipements", passe: "passes", recette: "recettes", affliction: "afflictions" };
const ICONES = { installation: "icons/svg/house.svg", savoir: "icons/svg/book.svg", equipement: "icons/svg/item-bag.svg", passe: "icons/svg/mystery-man.svg",
  recette: "icons/svg/anvil.svg", affliction: "icons/svg/biohazard.svg", enfance: "icons/svg/village.svg", trait: "icons/svg/aura.svg" };
const JETON_PASSE = cle => `modules/${MODULE_CONTENU}/assets/jetons/joueurs/${cle}.svg`;
// Le jeton d'un passé : celui que désigne l'index des jetons de joueur du module de contenu (assets/jetons/index.json : le
// jeton peint, WebP, quand il existe), le SVG du passé sinon (hors de Foundry, index illisible ou passé absent de l'index).
let indexJetons = null;
async function jetonPasse(cle) {
  try {
    indexJetons ??= await (await fetch(foundry.utils.getRoute(`modules/${MODULE_CONTENU}/assets/jetons/index.json`))).json();
    const chemin = indexJetons?.[cle];
    if (typeof chemin === "string" && chemin.startsWith(`modules/${MODULE_CONTENU}/assets/jetons/`)) return chemin;
  } catch { /* SVG en repli */ }
  return JETON_PASSE(cle);
}

const erreur = cle => new Error(`LAKOUR_SURVIE.Erreurs.${cle}`);
const clair = texte => new Error(texte);
const entier = (v, min, max, defaut = min) => borner(Math.round(Number.isFinite(Number(v)) ? Number(v) : defaut), min, max);
const listeObjets = a => [...(a?.items?.contents ?? [])];
const objetsDe = (a, type) => listeObjets(a).filter(i => i.type === type);
const nomRegion = cle => L.regionDe(contenu(), cle)?.nom ?? cle;
const nomSite = cle => L.siteDe(contenu(), cle)?.nom ?? cle;
const defDe = (famille, cle) => L.indexer(contenu())[famille]?.get(cle) ?? null;

// ------------------------------------------------------------------ le temps
// La date de JEU (« AAAA-MM-JJ ») : dateDepart + jour de l'horloge (sans les fêtes, pour le socle des fêtes du moteur).
export const dateDuJeu = (etat = lireEtat()) => L.dateDuJour(L.jourDe(etat?.horloge?.quart ?? 0), dateDepart()).iso;
export function quandDe(etat = lireEtat()) {
  const q = L.quand(etat?.horloge?.quart ?? 0, dateDepart(), langue());   // heure et date dans la langue du client
  return { ...q, fetes: fetesDuJeu(q.date, contenu().fetes ?? []).map(f => ({ cle: f.cle, nom: f.nom, coeur: f.coeur })) };
}

// ------------------------------------------------------------------ la file et les gardes
let file = Promise.resolve();
function enFile(fn) {
  const p = file.then(fn);
  file = p.catch(() => null);
  return p;
}
export const ecrituresEnCours = () => file;

function exigerMJ() {
  if (!estMJActif()) throw erreur("PasMJActif");
}
function exigerMonde({ partie = true } = {}) {
  exigerMJ();
  if (Coffre.ecritureBloquee()) {
    Coffre.ouvrirMonde().catch(e => console.warn(`${ID} | coffre`, e));
    throw erreur("MondeFerme");
  }
  if (partie && !lireEtat().demarree) throw erreur("PasDePartie");
}
// Une fonction qui écrit : gardes, puis la file (gardes revues dans la file : l'état a pu changer entre-temps).
const ecriture = (fn, options = {}) => async (args = {}) => {
  exigerMonde(options);
  return enFile(async () => { exigerMonde(options); return fn(args ?? {}); });
};
const ecritureMJ = fn => async (args = {}) => {
  exigerMJ();
  return enFile(async () => { exigerMJ(); return fn(args ?? {}); });
};

// ------------------------------------------------------------------ contexte d'une écriture
// Une graine courte (partie d'avant le 2026-11-05, ou graine tapée à la main) se devine : à la première écriture, le monde en reçoit
// une sûre (logique/hasard.mjs, graineSure). Les jours déjà simulés restent ce qu'ils sont ; seuls les tirages à venir changent. Une
// graine d'essai demandée explicitement (demarrer({ graine, essai: true }) : essais, simulateur) est gardée telle quelle.
export function renforcerGraine(monde, jour = 0) {
  if (!monde || monde.graineEssai || L.graineLongue(monde.graine)) return monde;
  monde.graine = L.graineSure();
  monde.graineRenforceeLe = jour;
  return monde;
}
function ouvrirCtx() {
  const etat = lireEtat();
  const m = Coffre.mondeEnMemoire();
  const monde = m ? renforcerGraine(structuredClone(m), L.jourDe(etat.horloge?.quart ?? 0)) : null;
  return { etat, monde, faits: [], secrets: [], alertes: [], quarts: 0, paliers: [], departs: [], chroniques: false, raison: "", carteTemps: false };
}
const jourCtx = ctx => L.jourDe(ctx.etat.horloge.quart);
const hasard = (ctx, nom) => (ctx.monde ? L.deriverHasard(ctx.monde.graine, nom, ctx.etat.horloge.quart, ctx.monde.tirages = (Number(ctx.monde.tirages) || 0) + 1) : Math.random);
// Journal et alertes de l'état public : chaque entrée garde { cle, params, texte } (donnees.mjs, entreeTexte) pour que chaque
// navigateur l'affiche dans sa langue. `x` : une chaîne libre, un fait ou message de la logique ({ cle, params, texte }), ou
// tx("Journal.X", params) pour une clé du système.
const tx = (cle, params = {}) => ({ cle, params });
const noter = (ctx, x) => { const e = entreeTexte(x); if (e) ctx.etat = L.ajouterJournal(ctx.etat, [{ quart: ctx.etat.horloge.quart, ...e }]); };
function alerter(ctx, type, x) {
  const a = { quart: ctx.etat.horloge.quart, type, ...(entreeTexte(x) ?? { texte: "" }) };
  ctx.etat = L.ajouterAlertes(ctx.etat, [a]);
  ctx.alertes.push(a);
}
// Un fait public, réduit à ce qui peut se dire (pas d'identifiant de horde, pas de détail du réel) : texte dans la langue du MJ
// actif (repli : le français de la logique), avec sa clé et ses paramètres pour qui veut le retraduire.
const publicFait = f => ({ jour: f.jour, region: f.region ?? "", cle: f.cle ?? "", public: true, texte: sansBalises(localiser(f)),
  ...(f.cleTexte ? { cleTexte: f.cleTexte } : {}), params: structuredClone(f.params ?? {}) });
// Une rencontre ou un motif rendu à l'appelant : son texte dans la langue du MJ.
const lisible = x => (x && typeof x === "object" ? { ...x, texte: localiser(x) } : x ?? null);
const motifLisible = r => (r?.motif ? localiser(r.motif) : r?.raison ?? "");
const motifsLisibles = r => (r?.motifs?.length ? r.motifs : r?.raisons ?? []).map(localiser).join(" ; ");

async function chat(content, { speaker = null, flags = {} } = {}) {
  return ChatMessage.implementation.create({ content, speaker: speaker ?? { alias: t("LAKOUR_SURVIE.Titre") }, flags: { [ID]: { carte: true, ...flags } } });
}
const parlePour = a => {
  try { return ChatMessage.implementation.getSpeaker?.({ actor: a }) ?? { alias: a.name, actor: a.id }; } catch { return { alias: a.name, actor: a.id }; }
};

// ------------------------------------------------------------------ acteurs <-> logique
const CHAMPS_SURVIVANT = ["competences", "blessures", "fatigue", "moral", "faim", "soif", "infection", "afflictions", "vivant", "livide", "tache", "statut",
  "joursTache", "tacheDepuis", "joursSansPassion", "joursMoralZero", "enseigne"];
// L'esprit et le sens moral (contrat §11) : réécrits par l'avancée du temps (observances, regard, lâcher, autorité du chef) et par
// les actes du groupe.
const CHAMPS_ESPRIT = ["regard", "religion", "religions", "pratique", "ancrage", "sensMoral", "reputation", "autorite", "esprit"];
CHAMPS_SURVIVANT.push(...CHAMPS_ESPRIT);

// Les maladies en incubation ne sont pas encore déclarées : ni le joueur ni ses voisins ne doivent les voir (les acteurs sont livrés
// à tous les navigateurs). Elles vivent dans le monde scellé (monde.incubations[acteurId]) ; l'acteur ne porte que les afflictions
// déclarées. systemeLogique les remet ensemble pour la logique (monde : celui de l'écriture en cours, sinon la mémoire du MJ actif).
const enIncubation = x => x?.stade === "incubation";
export function systemeLogique(a, monde = Coffre.mondeEnMemoire()) {
  const s = aPlat(a.system);
  const savoirs = [...new Set([...(s.savoirs ?? []), ...objetsDe(a, "savoir").map(i => i.system?.cle).filter(Boolean)])];
  const cachees = monde?.incubations?.[a.id] ?? [];
  if (cachees.length) {
    const vues = Array.isArray(s.afflictions) ? s.afflictions : [];
    s.afflictions = [...vues, ...structuredClone(cachees).filter(x => !vues.some(v => v.cle === x.cle))];
  }
  return { ...s, nom: a.name, savoirs };
}
export function instancesDe(a) {
  return objetsDe(a, "installation").map(i => ({
    id: i.id, cle: i.system?.cle, niveau: Number(i.system?.niveau) || 0, etat: Number(i.system?.etat) || 0,
    chantier: { fait: Number(i.system?.chantier?.fait) || 0, requis: Number(i.system?.chantier?.requis) || 0 },
    termineLe: Number(i.system?.termineLe) || 0, actif: i.system?.actif !== false, reparation: Number(i.system?.reparation) || 0
  }));
}
export const abriLogique = a => ({ id: a.id, system: aPlat(a.system), installations: instancesDe(a) });

// ctx : l'écriture en cours ; son monde reçoit les incubations (l'acteur, les seules afflictions déclarées). Sans monde (pas de
// partie), tout reste sur l'acteur.
async function ecrireSurvivant(a, system, ctx = null) {
  const maj = {};
  for (const k of CHAMPS_SURVIVANT) if (system[k] !== undefined) maj[k] = structuredClone(system[k]);
  if (Array.isArray(system.afflictions) && ctx?.monde) {
    const cachees = system.afflictions.filter(enIncubation);
    maj.afflictions = structuredClone(system.afflictions.filter(x => !enIncubation(x)));
    const incubations = { ...(ctx.monde.incubations ?? {}) };
    if (cachees.length) incubations[a.id] = structuredClone(cachees); else delete incubations[a.id];
    ctx.monde.incubations = incubations;
  }
  await a.update({ system: maj });
  if (system.afflictions) await synchroniserAfflictions(a, system.afflictions);
}
async function ecrireAbri(a, { system, installations = null }) {
  const s = {};
  for (const k of ["stocks", "reliquats", "nature", "sol", "bruit", "degats", "reparation", "installeLe", "abandonneLe", "site", "region"]) if (system[k] !== undefined) s[k] = structuredClone(system[k]);
  await a.update({ system: s });
  if (!installations) return;
  const avant = new Map(instancesDe(a).map(i => [i.id, i]));
  const majs = installations.filter(i => i.id && avant.has(i.id) && JSON.stringify(avant.get(i.id)) !== JSON.stringify({ ...avant.get(i.id), ...i }))
    .map(i => ({ _id: i.id, system: { niveau: i.niveau, etat: i.etat, chantier: i.chantier, termineLe: i.termineLe, actif: i.actif !== false, reparation: Number(i.reparation) || 0 } }));
  if (majs.length) await a.updateEmbeddedDocuments("Item", majs);
}

// Le groupe : membres valides (ids) parmi ceux demandés, sinon tous les vivants présents.
function membresValides(ctx, ids = []) {
  const groupe = survivantsDuGroupe(ctx.etat).filter(a => L.peutAgir(a.system));
  const demandes = (ids ?? []).map(acteur).filter(a => a?.type === "survivant" && L.peutAgir(a.system));
  return demandes.length ? demandes : groupe;
}
const aLAbri = (etat, a = abriCourant(etat)) => Boolean(a && !etat.groupe.enRoute && etat.groupe.region === a.system.region);
export function savoirsDuGroupe(etat = lireEtat()) {
  return [...new Set(survivantsDuGroupe(etat).filter(a => L.peutAgir(a.system)).flatMap(a => systemeLogique(a).savoirs))];
}

// ------------------------------------------------------------------ objets (compendium du contenu, sinon registre)
const index = new Map();   // "type:cle" -> uuid
export async function chargerIndex() {
  for (const [type, pack] of Object.entries(PACKS)) {
    const p = game.packs?.get?.(`${MODULE_CONTENU}.${pack}`);
    if (!p?.getIndex) continue;
    try { for (const e of await p.getIndex({ fields: ["system.cle"] })) if (e.system?.cle) index.set(`${type}:${e.system.cle}`, e.uuid); } catch { /* compendium illisible */ }
  }
  const tables = game.packs?.get?.(`${MODULE_CONTENU}.tables`);
  if (tables?.getIndex) {
    try { for (const e of await tables.getIndex({ fields: [`flags.${MODULE_CONTENU}.cle`] })) { const cle = e.flags?.[MODULE_CONTENU]?.cle; if (cle) index.set(`table:${cle}`, { uuid: e.uuid, nom: e.name }); } } catch { /* sans tables */ }
  }
}
async function donneesObjet(type, def, extra = {}) {
  const uuid = index.get(`${type}:${def.cle}`);
  if (uuid && globalThis.fromUuid) {
    try {
      const doc = await fromUuid(uuid);
      if (doc) {
        const d = game.items?.fromCompendium ? game.items.fromCompendium(doc) : doc.toObject();
        return foundry.utils.mergeObject(d, { system: extra }, { inplace: false });
      }
    } catch { /* on retombe sur le registre */ }
  }
  const { nom, poids, type: _type, terrains: _t, rapide: _r, allure: _a, places: _p, carburantParQuart: _c, ...system } = structuredClone(def);
  if (type === "equipement") system.charge = Number(poids ?? def.charge) || 0;
  return { name: nom ?? def.cle, type, img: ICONES[type], system: { ...system, ...extra } };
}
function donneesInstallation(def, instance) {
  return donneesObjet("installation", def, {
    niveau: instance.niveau, etat: instance.etat, chantier: structuredClone(instance.chantier), termineLe: instance.termineLe, actif: instance.actif !== false,
    reparation: Number(instance.reparation) || 0
  });
}
// Les afflictions déclarées (actives ou aggravées) ont leur objet sur l'acteur ; l'incubation reste dans system.afflictions.
async function synchroniserAfflictions(a, afflictions = []) {
  const declarees = afflictions.filter(x => x.stade === "active" || x.stade === "aggravee");
  const objets = objetsDe(a, "affliction");
  const retirer = objets.filter(i => !declarees.some(d => d.cle === i.system?.cle)).map(i => i.id);
  const creer = [], majs = [];
  for (const d of declarees) {
    const o = objets.find(i => i.system?.cle === d.cle);
    if (!o) { const def = defDe("afflictions", d.cle); if (def) creer.push(await donneesObjet("affliction", def, { stade: d.stade, reste: d.reste })); }
    else if (o.system.stade !== d.stade || o.system.reste !== d.reste) majs.push({ _id: o.id, system: { stade: d.stade, reste: d.reste } });
  }
  if (retirer.length) await a.deleteEmbeddedDocuments("Item", retirer);
  if (creer.length) await a.createEmbeddedDocuments("Item", creer);
  if (majs.length) await a.updateEmbeddedDocuments("Item", majs);
}

// ------------------------------------------------------------------ bilan, météo (publics)
// publique : ce que le groupe sait. Loin de l'abri, il ne voit pas si le courant ou l'eau du réseau y marchent encore : on prend
// son dernier renseignement sur la région de l'abri, pas le réel (le MJ, lui, lit le réel : publique faux).
function conditionsAbri(etat, monde, a, { publique = false } = {}) {
  const c = contenu();
  const jour = L.jourDe(etat.horloge.quart);
  const membres = survivantsDuGroupe(etat).map(x => ({ id: x.id, system: systemeLogique(x) }));
  const presents = aLAbri(etat, a) ? membres.filter(m => L.peutAgir(m.system)) : [];
  const pnj = (etat.groupe.pnj ?? []).filter(p => p.etat !== "mort").length;
  const rations = { eau: pnj, nourriture: pnj };
  for (const m of presents) { const b = L.effetsTraits(m.system, c).besoins; rations.eau += b.eau; rations.nourriture += b.nourriture; }
  const connu = etat.renseignements?.[a.system.region] ?? {};
  const r = publique && !aLAbri(etat, a) ? { eau: connu.eau === true, electricite: connu.electricite === true }
    : monde ? L.reseauxActifs(monde, a.system.region, jour) : (etat.bilan?.reseaux ?? {});
  return { jour, dateDepart: dateDepart(), personnes: presents.length + pnj, reseaux: { eau: Boolean(r.eau), electricite: Boolean(r.electricite) }, rations,
    travailleurs: L.travailleursParTache(presents, c) };
}
export function bilanVivant(etat = lireEtat(), monde = Coffre.mondeEnMemoire(), { publique = false } = {}) {
  const a = abriCourant(etat);
  if (!a) return null;
  const conditions = conditionsAbri(etat, monde, a, { publique });
  const b = L.bilanAbri(aPlat(a.system), instancesDe(a), contenu(), conditions);
  return { ...b, reseaux: conditions.reseaux, personnes: conditions.personnes, autonomie: Boolean(etat.autonome), autonome: Boolean(etat.autonome),
    joursAutonomes: etat.joursAutonomes ?? 0, alertes: (etat.alertes ?? []).slice(-5) };
}
const CHAMPS_BILAN = ["production", "consommation", "net", "pertes", "joursDeStocks", "defense", "discretion", "visibilite", "capacite", "bruit",
  "protectionCyclone", "soins", "moral", "conservation", "renseignements", "eauTraitee", "plafonds", "arrets", "surpeuplement", "reseaux", "personnes", "actives"];
// L'instantané PUBLIC du bilan (état de la partie, lu par les joueurs) : ce que le groupe sait, pas le réel à distance.
export function instantaneBilan(etat, monde) {
  const b = bilanVivant(etat, monde, { publique: true });
  return b ? Object.fromEntries(CHAMPS_BILAN.map(k => [k, structuredClone(b[k] ?? null)])) : null;
}
// Le temps qu'il fait là où est le groupe (ce qu'il voit et entend) : « cyclone », « pluie » ou rien. En route, il n'est pas
// encore dans la région d'arrivée : il ne voit que l'alerte rouge d'un cyclone, annoncée à toute l'île.
export function meteoPublique(etat, monde) {
  if (!monde) return etat.meteo ?? null;
  const jour = L.jourDe(etat.horloge.quart);
  const region = etat.groupe.enRoute ? null : etat.groupe.region;
  const reg = region ? monde.regions?.[region] : null;
  const enCours = e => Number(e.depuis) <= jour && (e.jusqua === null || e.jusqua === undefined || Number(e.jusqua) >= jour);
  const evts = (reg?.evenements ?? []).filter(enCours);
  const rouge = monde.cyclone?.alerte === "rouge";
  const cyclone = evts.some(e => e.cle === "cyclone") || (rouge && (!region || (monde.cyclone.trajectoire ?? []).includes(region)));
  const pluie = evts.some(e => ["fortes-pluies", "crue", "eboulement"].includes(e.cle));
  return { temps: cyclone ? "cyclone" : pluie ? "pluie" : "", saison: L.saisonDuJour(jour, dateDepart()), jour };
}

// ------------------------------------------------------------------ terminer une écriture
async function terminer(ctx) {
  ctx.etat.phase = L.phaseDuJour(jourCtx(ctx));
  ctx.etat.bilan = instantaneBilan(ctx.etat, ctx.monde);
  ctx.etat.meteo = meteoPublique(ctx.etat, ctx.monde);
  if (ctx.monde) await Coffre.ecrireMonde(ctx.monde);
  await game.settings.set(ID, "partie", ctx.etat);
  if (ctx.chroniques) await ecrireChroniques(ctx.etat, contenu()).catch(e => console.warn(`${ID} | chroniques`, e));
  if (!ctx.quarts) return;
  const quand = quandDe(ctx.etat);
  const faits = ctx.faits.map(publicFait);
  annoncer("lakourSurvie.avance", [quand, faits]);
  // Paliers de visibilité : au seul MJ actif (secret, jamais diffusé).
  for (const p of ctx.paliers) {
    Hooks.callAll("lakourSurvie.palier", p);
    globalThis.ui?.notifications?.info?.(t("LAKOUR_SURVIE.Palier.Avis", { palier: p.palier }));
  }
  // Ce que l'esprit et l'autorité laissent au MJ (celui qui est au bord, une scission, un renversement) : un avis, au seul MJ actif.
  for (const x of ctx.aRaconter ?? []) if (["esprit", "autorite"].includes(x.evenement)) globalThis.ui?.notifications?.info?.(sansBalises(localiser(x)));
  if (ctx.carteTemps || faits.length || ctx.alertes.length) await chat(carteTemps({ quand, faits, alertes: ctx.alertes, raison: ctx.raison, quarts: ctx.quarts }));
  await suivreFetesDuJeu(quand.date, contenu().fetes ?? []).catch(e => console.warn(`${ID} | fêtes`, e));
}

// ------------------------------------------------------------------ avancer (§1.4)
function palierDe(f) {
  const seuil = PALIERS_VISIBILITE[(Number(f.palier) || 1) - 1];
  const def = (contenu().visibilite ?? []).find(v => Number(v.seuil) === seuil) ?? null;
  const cle = String(def?.table ?? "").replace(/^tables:/, "");
  const table = index.get(`table:${cle}`);
  return { palier: def?.nom ?? String(f.palier), table: table?.nom ?? cle, uuid: table?.uuid ?? "", seuil, visibilite: f.visibilite, jour: f.jour };
}

async function repartirAuto(ctx) {
  if (!reglage("repartitionAuto", false)) return;
  const c = contenu();
  const membres = survivantsDuGroupe(ctx.etat).filter(a => L.peutAgir(a.system));
  const autres = membres.filter(a => !["joueur"].includes(a.system.statut));
  if (!autres.length) return;
  const ab = abriCourant(ctx.etat);
  const besoins = L.besoinsDuGroupe(membres.filter(a => a.system.statut === "joueur").map(a => ({ id: a.id, system: systemeLogique(a) })), ab ? abriLogique(ab) : null, c, ctx.etat);
  const plan = L.repartir(autres.map(a => ({ id: a.id, system: systemeLogique(a) })), besoins, c);
  for (const [id, tache] of Object.entries(plan)) {
    const a = acteur(id);
    if (!a || a.system.tache === tache) continue;
    const r = L.assigner(systemeLogique(a), tache, jourCtx(ctx));
    if (r.ok) await a.update({ system: { tache: r.system.tache, joursTache: r.system.joursTache ?? 0, tacheDepuis: r.system.tacheDepuis ?? jourCtx(ctx) } });
  }
}

// Le chef d'une bande qui vient à l'abri décide selon son sens moral (chefs.mjs) : la décision est gardée avec la menace (secret).
function avecChef(ctx, m) {
  if (!["bande", "visite"].includes(m.type)) return m;
  const etat = ctx.etat;
  const membres = survivantsDuGroupe(etat).filter(a => L.peutAgir(a.system)).map(a => systemeLogique(a, ctx.monde));
  const forceGroupe = (Number(bilanVivant(etat, ctx.monde)?.defense) || 0) + membres.length;
  const chef = L.chefDeLaMenace(m, L.factionDe(contenu(), m.faction), L.deriverHasard(ctx.monde.graine, "chef", m.id), { forceGroupe,
    reputationGroupe: L.reputationDuGroupe(membres).moyenne, phase: etat.phase });
  return { ...m, chef };
}

async function avancerInterne(ctx, quarts, options = {}) {
  const n = entier(quarts, 0, 400, 1);
  if (!n || !ctx.monde) return null;
  const c = contenu();
  await repartirAuto(ctx);
  const membres = survivantsDuGroupe(ctx.etat);
  const survivants = membres.map(a => ({ id: a.id, nom: a.name, system: systemeLogique(a, ctx.monde) }));
  const ab = abriCourant(ctx.etat);
  const r = L.avancer({ etat: ctx.etat, monde: ctx.monde, contenu: c, quarts: n, survivants, abri: ab ? abriLogique(ab) : null,
    options: { dateDepart: dateDepart(), visibiliteVeille: Number(ctx.monde.visibiliteVeille) || 0, ...options } });
  ctx.etat = r.etat;
  ctx.monde = r.monde;
  for (const s of r.acteurs.survivants) {
    const a = acteur(s.id);
    if (!a) continue;
    await ecrireSurvivant(a, s.system, ctx);
    for (const ev of s.evenements ?? []) {
      if (ev.cle === "mort") { const ch = chapitreOuvert(ctx.etat); if (ch) { ch.morts = [...new Set([...(ch.morts ?? []), a.name])]; ctx.chroniques = true; } }
    }
  }
  if (ab && r.acteurs.abri) await ecrireAbri(ab, r.acteurs.abri);
  // Les départs (recrues à bout) : l'acteur reste, sans tâche ; il n'est plus du groupe.
  for (const id of r.departs ?? []) { const a = acteur(id); if (a) await a.update({ system: { tache: "", statut: "pnj" } }); ctx.departs.push(id); }
  // Menaces du jour : gardées au monde (secret) pour le MJ, jamais appliquées d'elles-mêmes.
  const jour = jourCtx(ctx);
  ctx.monde.compteurMenaces = Number(ctx.monde.compteurMenaces) || 0;
  ctx.monde.menaces = [...(ctx.monde.menaces ?? []).filter(m => Number(m.jour) >= jour - 3),
    ...r.menaces.map(m => avecChef(ctx, { id: `m${++ctx.monde.compteurMenaces}`, ...m }))].slice(-20);
  // Les départs de celui qui lâche ou qui déserte (esprit.mjs, chefs.mjs) : au MJ, à raconter.
  ctx.aRaconter = [...(ctx.aRaconter ?? []), ...(r.aRaconter ?? [])];
  // Paliers de visibilité franchis (secrets : au MJ seul).
  for (const f of r.secrets.filter(x => x.cle === "palierVisibilite")) {
    const p = palierDe(f);
    ctx.paliers.push(p);
    ctx.monde.paliers = [...(ctx.monde.paliers ?? []), p].slice(-20);
  }
  ctx.monde.visibiliteVeille = r.bilan?.visibilite ?? (Number(ctx.monde.visibiliteVeille) || 0);
  // Les fêtes du jour de jeu : au journal public et aux alertes (ligne du narrateur par l'état du jeu).
  for (const j of r.jours) {
    const date = L.dateDuJour(j, dateDepart()).iso;
    for (const f of fetesDuJeu(date, c.fetes ?? []).filter(x => x.coeur)) alerter(ctx, "fete", tx("Fete.Alerte", { nom: f.nom, consigne: sansBalises(f.consigne) }));
  }
  ctx.faits.push(...r.faits);
  ctx.secrets.push(...r.secrets);
  ctx.alertes.push(...r.alertes);
  ctx.quarts += n;
  return r;
}

// ------------------------------------------------------------------ tests (§1.1)
// Bonus d'outil (le meilleur équipement), d'installation (atelier, tour de guet, antenne : à l'abri) ; malus d'état et de traits.
function modificateursDuTest(a, sys, competence, etat = lireEtat()) {
  const c = contenu();
  const outil = Math.max(0, ...objetsDe(a, "equipement").map(i => Number(i.system?.bonus?.[competence]) || 0));
  let installation = 0, lieux = [];
  const ab = abriCourant(etat);
  if (ab && aLAbri(etat, ab) && (etat.groupe.membres ?? []).includes(a.id)) {
    const l = abriLogique(ab);
    lieux = L.lieuxAbri(l, c);
    for (const i of l.installations) {
      if (i.niveau < 1 || i.etat >= 3) continue;
      installation = Math.max(installation, Number(L.niveauDe(defDe("installations", i.cle), i.niveau)?.effets?.bonus?.[competence]) || 0);
    }
  }
  const traits = L.modificateursTraits(sys, c, { lieux }).malus;
  const malus = L.malusEtat(sys, { traits });
  // Celui qui lâche parle moins (esprit.mjs, malusEsprit).
  const esprit = L.malusEsprit(sys, competence);
  return { bonus: Math.min(2, outil + installation), malus: malus.total + esprit, outil, installation, etat: malus, esprit };
}

async function appliquerTest(a, competence, r) {
  const s = systemeLogique(a);
  const maj = {};
  let monte = false, niveau = Number(s.competences?.[competence]?.niveau) || 0;
  if (r.fatigue) maj.fatigue = borner((Number(s.fatigue) || 0) + r.fatigue, 0, 5);
  if (r.marque) {
    const m = L.marquer(s.competences?.[competence] ?? { niveau: 0, marques: 0 }, 1, { passion: s.passions?.[competence] ?? 0, age: s.age });
    maj.competences = { ...s.competences, [competence]: { niveau: m.niveau, marques: m.marques } };
    monte = m.monte;
    niveau = m.niveau;
  }
  if (Object.keys(maj).length) await a.update({ system: maj });
  return { monte, niveau };
}

async function testDirect({ acteurId, competence, difficulte = "normale", bonus = 0, malus = 0, forcer = false, titre = "", compte = true, forcable = true } = {}) {
  const a = acteur(acteurId);
  if (!a || a.type !== "survivant") throw erreur("ActeurInconnu");
  if (!COMPETENCES.includes(competence)) throw clair(t("LAKOUR_SURVIE.Erreurs.CompetenceInconnue", { competence }));
  const sys = systemeLogique(a);
  if (!L.peutAgir(sys)) throw clair(t("LAKOUR_SURVIE.Erreurs.HorsEtat", { nom: a.name }));
  const diff = DIFFICULTES[difficulte] ? difficulte : "normale";
  const mods = modificateursDuTest(a, sys, competence);
  const niveau = Number(sys.competences?.[competence]?.niveau) || 0;
  // La chance (esprit.mjs : celui qui a été trahi) : un dé de plus au prochain test qui compte, consommé. Le jeu ne dit pas d'où.
  const chance = compte !== false ? L.utiliserChance(sys) : { bonus: 0 };
  if (chance.bonus) await a.update({ system: { esprit: chance.system.esprit } });
  const r = L.resoudreTest({ niveau, difficulte: diff, bonus: (Number(bonus) || 0) + mods.bonus + chance.bonus, malus: (Number(malus) || 0) + mods.malus, forcer: Boolean(forcer), compte: compte !== false });
  const maj = await appliquerTest(a, competence, r);
  const info = { nom: a.name, competence, titre, monte: maj.monte, niveau: maj.niveau, chance: chance.bonus > 0 };
  const message = await chat(carteTest(r, { ...info, forcable }), { speaker: parlePour(a), flags: { test: { acteurId: a.id, competence, titre, resultat: r, forcable } } });
  return { ...r, competence, acteurId: a.id, niveau, malusEtat: mods.malus, bonusOutils: mods.bonus, chance: chance.bonus, monte: maj.monte, texte: texteTest(a.name, competence, r), messageId: message?.id ?? null };
}

// Forcer : seulement la carte d'un test écrite par un MJ (le résultat qu'elle porte fait foi) ; un message écrit par un joueur, avec
// des drapeaux de test à sa façon, n'est pas un test.
async function forcerDirect({ messageId } = {}) {
  const message = game.messages?.get?.(messageId);
  const f = deMJ(message) ? message.flags?.[ID]?.test : null;
  if (!f?.resultat) throw erreur("TestInconnu");
  if (f.resultat.force || f.forcable === false) throw erreur("DejaForce");
  const a = acteur(f.acteurId);
  if (!a) throw erreur("ActeurInconnu");
  const r = L.forcerTest(f.resultat, Math.random);
  // Une seule marque par test : celle de l'échec d'avant compte déjà.
  const r2 = { ...r, marque: r.marque && !f.resultat.marque };
  const maj = await appliquerTest(a, f.competence, r2);
  const info = { nom: a.name, competence: f.competence, titre: f.titre, monte: maj.monte, niveau: maj.niveau };
  await message.update({ content: carteTest(r, info), [`flags.${ID}.test`]: { ...f, resultat: r } });
  return { ...r, competence: f.competence, acteurId: a.id, texte: texteTest(a.name, f.competence, r), monte: maj.monte, messageId };
}

// ------------------------------------------------------------------ requêtes des joueurs (socket)
const enAttente = new Map();
export function requete(action, donnees = {}, delai = 20000) {
  if (!game.users?.activeGM) return Promise.reject(erreur("SansMJ"));
  const id = foundry.utils.randomID();
  return new Promise((resolve, reject) => {
    const minuterie = setTimeout(() => { enAttente.delete(id); reject(erreur("SansReponse")); }, delai);
    minuterie?.unref?.();
    enAttente.set(id, { resolve, reject, minuterie });
    versMJ({ type: "requete", id, action, donnees: structuredClone(donnees) });
  });
}
// Une réponse : seulement du MJ actif, l'émetteur donné par le serveur faisant foi (sans émetteur, elle ne vient pas du serveur).
export function recevoirReponse(message, emetteur) {
  if (!vientDuMJActif(message, emetteur)) return false;
  const p = enAttente.get(message.id);
  if (!p) return false;
  enAttente.delete(message.id);
  clearTimeout(p.minuterie);
  if (message.erreur) p.reject(new Error(message.erreur)); else p.resolve(message.resultat);
  return true;
}
// Chez le MJ actif : une demande d'un joueur. qui : l'émetteur donné par le serveur (il fait foi).
export async function traiterRequete(message, qui) {
  if (!estMJActif()) return false;
  const repondre = (resultat, err = null) => emettre({ type: "reponse", id: message.id, ...(err ? { erreur: err } : { resultat }) }, [qui]);
  try {
    const d = message.donnees ?? {};
    let resultat;
    switch (message.action) {
      case "test": {
        if (!proprietaireDe(acteur(d.acteurId), qui)) throw erreur("PasProprietaire");
        // Le joueur ne choisit ni la difficulté, ni si le test compte, ni de forcer d'emblée : une demande ouverte d'un MJ en décide
        // (une fois), sinon « normale », sans marque, bonus et malus bornés (0 à 4). Voir demandes.mjs.
        resultat = await enFile(async () => {
          const demande = game.users.get(qui)?.isGM ? null : trouverDemande({ messageId: d.demandeId, acteurId: d.acteurId, competence: d.competence });
          const r = await testDirect(game.users.get(qui)?.isGM ? { ...d, forcable: true } : argumentsDuTestJoueur(d, demande));
          if (demande) await fermerDemande(demande, r.messageId);
          return { ...r, demande: Boolean(demande) };
        });
        break;
      }
      case "forcer": {
        const m = game.messages?.get?.(d.messageId);
        const f = deMJ(m) ? m.flags?.[ID]?.test : null;
        if (!f || !proprietaireDe(acteur(f.acteurId), qui)) throw erreur("PasProprietaire");
        resultat = await enFile(() => forcerDirect({ messageId: d.messageId }));
        break;
      }
      case "assigner": {
        if (!proprietaireDe(acteur(d.acteurId), qui)) throw erreur("PasProprietaire");
        resultat = await enFile(() => assignerDirect({ acteurId: d.acteurId, tache: d.tache }));
        break;
      }
      case "proposer": {
        if (!game.users.get(qui)?.isGM && !propositionPermise(qui)) throw erreur("TropDePropositions");
        resultat = await enFile(() => proposerDirect({ type: d.type, details: d.details, userId: qui }));
        break;
      }
      case "creer": {
        if (!reglage("creationOuverte", true) && !game.users.get(qui)?.isGM) throw erreur("CreationFermee");
        const perso = game.users.get(qui)?.character;
        if (perso?.type === "survivant" && perso.system?.vivant !== false && !perso.system?.livide) throw erreur("DejaUnSurvivant");
        if (!game.users.get(qui)?.isGM && !tirageDuGenerateur(d.donnees)) throw erreur("TirageInvalide");
        resultat = await enFile(() => creerSurvivantDirect({ donnees: d.donnees, userId: qui, rejoindre: d.rejoindre !== false }));
        break;
      }
      default: throw erreur("RequeteInconnue");
    }
    repondre(resultat);
    return true;
  } catch (e) {
    repondre(null, String(e?.message ?? e));
    return false;
  }
}

// Un tirage venu d'un joueur (fait dans son navigateur) : rien de plus que ce que le générateur donne, sinon il est forgé. Le budget
// (somme des niveaux, réglage du MJ : le générateur ne le dépasse jamais pour un joueur), les savoir-faire et l'équipement de
// l'enfance et du passé seulement, au plus trois traits connus et compatibles entre eux. Vérifié CHEZ LE MJ (traiterRequete) :
// l'enfance et le passé connus du contenu (le passé permis à cet âge), les passions comme le générateur les donne (une ou deux,
// une seule vraie passion à 2), et toutes les incapacités qu'imposent l'enfance, le passé et les traits (ni plus, ni moins).
export function tirageDuGenerateur(d) {
  if (!d || typeof d !== "object") return false;
  const idx = L.indexer(contenu());
  const niveau = v => entier(typeof v === "object" && v !== null ? v.niveau : v, 0, 5, 0);
  if (COMPETENCES.reduce((s, k) => s + niveau(d.competences?.[k]), 0) > lireBudget(reglage("budgetCreation", "10-16"))[1]) return false;
  if ((idx.enfances.size && !idx.enfances.has(d.enfance)) || (idx.passes.size && !idx.passes.has(d.passe))) return false;
  const enfance = idx.enfances.get(d.enfance) ?? null, passe = idx.passes.get(d.passe) ?? null;
  const age = entier(d.age, 16, 99, 30);
  if (Number(passe?.ageMin) > age) return false;
  const permis = f => new Set([...(enfance?.[f] ?? []), ...(passe?.[f] ?? [])]);
  const dans = (l, p) => (l ?? []).every(x => p.has(x));
  if (!dans(d.savoirs, permis("savoirs")) || !dans(d.equipement, permis("equipement"))) return false;
  const traits = Array.isArray(d.traits) ? d.traits : [];
  if (!(traits.length <= 3 && traits.every((k, i) => idx.traits.has(k) && L.compatibles(idx.traits.get(k), traits.slice(0, i), idx.traits)))) return false;
  const passions = Object.entries(d.passions ?? {});
  if (passions.some(([k, v]) => !COMPETENCES.includes(k) || ![0, 1, 2].includes(Number(v)))) return false;
  const vives = passions.filter(([, v]) => Number(v) > 0);
  if (vives.length > 2 || vives.filter(([, v]) => Number(v) === 2).length > 1) return false;
  const imposees = new Set([...(enfance?.incapacites ?? []), ...(passe?.incapacites ?? []),
    ...traits.flatMap(k => idx.traits.get(k)?.incapacites ?? idx.traits.get(k)?.effets?.incapacites ?? [])]);
  const donnees = new Set(Array.isArray(d.incapacites) ? d.incapacites : []);
  if (!(donnees.size === imposees.size && [...imposees].every(x => donnees.has(x)))) return false;
  // L'esprit : le joueur choisit sa religion (ou son ancrage), sa pratique, son regard ; la jauge et l'autorité restent celles du tirage
  // (dans leurs bornes de départ) et la réputation commence à zéro.
  const esp = espritDuTirage(d);
  if ((d.regard && esp.regard !== d.regard) || (d.religion && esp.religion !== d.religion) || (d.ancrage && esp.ancrage !== d.ancrage)) return false;
  if (d.religion === L.RELIGION_PLUSIEURS && esp.religions.length < 2) return false;
  if (Math.abs(Number(d.sensMoral) || 0) > L.SENS_DEPART_MAX || (Number(d.autorite) || 0) > L.AUTORITE_DEPART_MAX || (Number(d.autorite) || 0) < 0) return false;
  return !(Number(d.reputation) || 0);
}

// ------------------------------------------------------------------ tâches, membres, création (§10)
async function assignerDirect({ acteurId, tache, eleve = "", competence = "" } = {}) {
  const a = acteur(acteurId);
  if (!a || a.type !== "survivant") throw erreur("ActeurInconnu");
  const etat = lireEtat();
  const r = L.assigner(systemeLogique(a), tache, L.jourDe(etat.horloge.quart));
  if (!r.ok) throw clair(motifLisible(r));
  const maj = { tache: r.system.tache, joursTache: Number(r.system.joursTache) || 0, tacheDepuis: Number(r.system.tacheDepuis) || 0 };
  maj.enseigne = tache === "enseigner" && eleve ? { eleve, competence: COMPETENCES.includes(competence) ? competence : "" } : { eleve: "", competence: "" };
  await a.update({ system: maj });
  return { ok: true, acteurId: a.id, tache: r.system.tache };
}

// Un survivant d'après un tirage du générateur. -> l'acteur
async function creerActeurSurvivant(d, { userId = "", statut = null } = {}) {
  const c = contenu();
  const niveau = v => entier(typeof v === "object" && v !== null ? v.niveau : v, 0, 5, 0);
  const competences = Object.fromEntries(COMPETENCES.map(k => [k, { niveau: niveau(d.competences?.[k]), marques: 0 }]));
  const passions = Object.fromEntries(COMPETENCES.map(k => [k, entier(d.passions?.[k] ?? 0, 0, 2, 0)]));
  const st = statut ?? d.statut ?? "joueur";
  const nom = String(d.nom || t("LAKOUR_SURVIE.Creation.SansNom")).slice(0, 80);
  const user = userId ? game.users.get(userId) : null;
  const PROPRIO = globalThis.CONST?.DOCUMENT_OWNERSHIP_LEVELS?.OWNER ?? 3;
  const jeton = L.indexer(c).passes.has(d.passe) ? await jetonPasse(d.passe) : "icons/svg/mystery-man.svg";
  const moteur = game.modules?.get?.(MODULE_MJIA);
  // La graine d'histoire (texte libre, lu par le MJ IA) : sans balises, bornée.
  const graine = sansBalises(typeof d.graine === "string" ? d.graine : "").slice(0, 2000);
  const a = await Actor.implementation.create({
    name: nom, type: "survivant", img: jeton,
    system: {
      competences, passions, enfance: d.enfance ?? "", passe: d.passe ?? "", genre: L.GENRES.includes(d.genre) ? d.genre : "",
      traits: [...(d.traits ?? [])], incapacites: [...(d.incapacites ?? [])],
      statut: st, tache: "repos", age: entier(d.age, 16, 99, 30), lien: String(d.lien ?? "").slice(0, 200), vivant: true, livide: false,
      histoire: { journal: "" }, notes: String(d.notes ?? "").slice(0, 20000),
      ...espritDuTirage(d, c)
    },
    ownership: user && !user.isGM ? { default: 0, [user.id]: PROPRIO } : { default: 0 },
    prototypeToken: { name: nom, actorLink: true, disposition: globalThis.CONST?.TOKEN_DISPOSITIONS?.FRIENDLY ?? 1, sight: { enabled: true }, texture: { src: jeton } },
    flags: { [ID]: { graine }, ...(moteur?.active && graine ? { [MODULE_MJIA]: { graineHistoire: graine } } : {}) }
  });
  const objets = [];
  for (const s of d.savoirs ?? []) { const def = defDe("savoirs", s); if (def) objets.push(await donneesObjet("savoir", def)); }
  for (const e of d.equipement ?? []) { const def = defDe("equipements", e); if (def) objets.push(await donneesObjet("equipement", def)); }
  if (objets.length) await a.createEmbeddedDocuments("Item", objets);
  if (user && !user.isGM && !user.character) await user.update({ character: a.id });
  return a;
}

async function creerSurvivantDirect({ donnees, userId = "", rejoindre = true, statut = null } = {}) {
  if (!donnees || typeof donnees !== "object") throw erreur("TirageManquant");
  const user = userId ? game.users.get(userId) : null;
  const st = statut ?? (user && !user.isGM ? "joueur" : donnees.statut ?? "joueur");
  const a = await creerActeurSurvivant(donnees, { userId, statut: st });
  let membre = false;
  if (rejoindre && lireEtat().demarree && !Coffre.ecritureBloquee()) {
    const ctx = ouvrirCtx();
    ctx.etat = L.ajouterMembre(ctx.etat, a.id, st);
    noter(ctx, tx("Journal.Rejoint", { nom: a.name }));
    await terminer(ctx);
    membre = true;
  }
  return { acteurId: a.id, nom: a.name, membre };
}

async function proposerDirect({ type = "autre", details = "", userId = "" } = {}) {
  const TYPES = ["fouiller", "explorer", "construire", "garde", "repos", "voyager", "fabriquer", "autre"];
  const ty = TYPES.includes(type) ? type : "autre";
  const user = game.users.get(userId);
  const perso = user?.character ?? null;
  const nom = perso?.name ?? user?.name ?? "?";
  const p = { quart: lireEtat().horloge.quart, userId, nom, type: ty, details: String(details ?? "").slice(0, 400) };
  if (lireEtat().demarree && !Coffre.ecritureBloquee()) {
    const ctx = ouvrirCtx();
    ctx.etat.propositions = [...(ctx.etat.propositions ?? []), p].slice(-20);
    await terminer(ctx);
  }
  await chat(carteProposition(p), { speaker: perso ? parlePour(perso) : { alias: nom }, flags: { proposition: true } });
  Hooks.callAll("lakourSurvie.demande", p);
  return p;
}

// L'esprit d'un tirage (regard, religion ou ancrage, sens moral, autorité), borné et réduit à ce que le contenu connaît. Un tirage
// sans esprit (MJ IA d'avant, fiche à la main) le garde vide : aucun effet tant que le MJ ne le tire pas.
export function espritDuTirage(d = {}, c = contenu()) {
  const idx = L.indexer(c);
  const religion = d.religion && (idx.religions.has(d.religion) || [L.RELIGION_AUCUNE, L.RELIGION_PLUSIEURS].includes(d.religion)) ? String(d.religion) : "";
  const religions = religion === L.RELIGION_PLUSIEURS ? [...new Set((Array.isArray(d.religions) ? d.religions : []).filter(r => idx.religions.has(r) && !idx.religions.get(r)?.special))].slice(0, 3) : [];
  return {
    regard: L.REGARDS.includes(d.regard) ? d.regard : "", religion, religions, pratique: Boolean(d.pratique),
    ancrage: d.ancrage && idx.ancrages.has(d.ancrage) ? String(d.ancrage) : "",
    sensMoral: entier(d.sensMoral ?? 0, L.SENS_MORAL.min, L.SENS_MORAL.max, 0), reputation: entier(d.reputation ?? 0, L.REPUTATION.min, L.REPUTATION.max, 0),
    autorite: entier(d.autorite ?? L.AUTORITE.defaut, L.AUTORITE.min, L.AUTORITE.max, L.AUTORITE.defaut), esprit: {}
  };
}

// ------------------------------------------------------------------ générateur (§10.2) : lecture seule, partout
function versTirage(s, c) {
  const g = s.histoire?.graine ?? {};
  const region = L.regionDe(c, g.region)?.nom ?? "";
  // La phrase de la région suit le genre du survivant (« il était », « elle était », sinon une tournure neutre).
  const cleRegion = `LAKOUR_SURVIE.Creation.GraineRegion${s.genre === "f" ? "F" : s.genre === "m" ? "M" : ""}`;
  const graine = [...(g.phrases ?? []), region ? t(cleRegion, { region }) : "", localiser(g.procheMessage ?? { cle: g.procheCle, texte: g.proche ?? "" })].filter(Boolean).join(" ");
  return {
    nom: s.nom, genre: s.genre ?? "", age: s.age, enfance: s.enfance, passe: s.passe, statut: s.statut,
    competences: Object.fromEntries(COMPETENCES.map(k => [k, Number(s.competences?.[k]?.niveau) || 0])),
    passions: structuredClone(s.passions ?? {}), traits: [...(s.traits ?? [])], incapacites: [...(s.incapacites ?? [])],
    equipement: [...(s.equipement ?? [])], savoirs: [...(s.savoirs ?? [])], graine, histoire: structuredClone(g), region: g.region ?? "",
    regard: s.regard ?? "", religion: s.religion ?? "", religions: [...(s.religions ?? [])], pratique: Boolean(s.pratique), ancrage: s.ancrage ?? "",
    sensMoral: Number(s.sensMoral) || 0, autorite: Number(s.autorite ?? L.AUTORITE.defaut)
  };
}
function nettoyerVerrous(v = {}) {
  const sortie = {};
  if (String(v.nom ?? "").trim()) sortie.nom = String(v.nom).trim();
  if (L.GENRES.includes(v.genre)) sortie.genre = v.genre;
  if (Number(v.age) > 0) sortie.age = entier(v.age, 16, 99, 30);
  if (v.enfance) sortie.enfance = v.enfance;
  if (v.passe) sortie.passe = v.passe;
  if (Array.isArray(v.traits)) sortie.traits = v.traits.filter(Boolean);
  // L'esprit choisi par le joueur avant de valider (la religion surtout ; complément du jeu 3D, famille 2).
  if (L.REGARDS.includes(v.regard)) sortie.regard = v.regard;
  if (typeof v.religion === "string" && v.religion) sortie.religion = v.religion;
  if (Array.isArray(v.religions)) sortie.religions = v.religions.filter(Boolean);
  if (typeof v.pratique === "boolean") sortie.pratique = v.pratique;
  if (typeof v.ancrage === "string") sortie.ancrage = v.ancrage;
  return sortie;
}
export function generer({ verrous = {}, statut = "joueur", region = "", favoriser = {}, budget, hasard: h = Math.random } = {}) {
  const c = contenu();
  const b = budget === null ? null : Array.isArray(budget) ? budget : statut === "joueur" ? lireBudget(reglage("budgetCreation", "10-16")) : null;
  const s = L.genererSurvivant(c, h, { verrous: nettoyerVerrous(verrous), statut, region, favoriser: favoriser ?? {}, budget: b,
    ...(h === Math.random ? { hasardEsprit: Math.random } : {}) });
  return versTirage(s, c);
}

function besoinsBruts(etat = lireEtat()) {
  const membres = survivantsDuGroupe(etat).map(a => ({ id: a.id, system: systemeLogique(a) }));
  const ab = abriCourant(etat);
  return L.besoinsDuGroupe(membres, ab ? abriLogique(ab) : null, contenu(), etat);
}
function profilPour(competence) {
  const passes = L.liste(contenu().passes).filter(p => Number(p.competences?.[competence]) >= 2).slice(0, 3).map(p => p.nom);
  return passes.length ? t("LAKOUR_SURVIE.Besoins.Profil", { competence: t(`LAKOUR_SURVIE.Competences.${competence}`), exemples: passes.join(", ") }) : "";
}
// -> [{ tache, competence, meilleur, qui, couverture, urgence (raison ou false), raison, profil }]
export function besoins() {
  const b = besoinsBruts();
  return Object.entries(b.taches).map(([tache, x]) => ({
    tache, competence: x.competence, meilleur: x.meilleur, qui: x.qui ?? null, couverture: x.couverture,
    urgence: x.urgence ? (localiser(x.motif) || x.raison || true) : false, raison: localiser(x.motif) || x.raison || "", profil: x.couverture !== "couvert" || x.urgence ? profilPour(x.competence) : ""
  }));
}

// ------------------------------------------------------------------ l'API
async function fouillerInterne(ctx, { region, site = null, cible = null, membres = [], quarts = 1, prudence = "normal" }) {
  const c = contenu();
  const reg = region || ctx.etat.groupe.region;
  if (!L.regionDe(c, reg)) throw clair(t("LAKOUR_SURVIE.Erreurs.RegionInconnue", { region: reg }));
  if (cible && !NATURE.includes(cible) && !RESSOURCES.includes(cible)) throw clair(t("LAKOUR_SURVIE.Erreurs.CibleInconnue", { cible }));
  const qui = membresValides(ctx, membres);
  const q = entier(quarts, 1, 8, 1);
  const ab = abriCourant(ctx.etat);
  // Les savoirs des fouilleurs (le savoir des zerbaz double les plantes cueillies).
  const savoirs = [...new Set(qui.flatMap(a => systemeLogique(a).savoirs ?? []))];
  const r = L.fouiller(ctx.monde, c, hasard(ctx, "fouille"), { region: reg, site, cible, membres: Math.max(1, qui.length), quarts: q, prudence,
    jour: jourCtx(ctx), moment: L.momentDe(ctx.etat.horloge.quart), abri: ab ? aPlat(ab.system) : null, renseignements: ctx.etat.renseignements, savoirs });
  ctx.monde = r.monde;
  ctx.etat.renseignements = r.renseignements;
  if (r.fouille) ctx.etat = L.noterFouille(ctx.etat, jourCtx(ctx));
  // Le butin va à l'abri si le groupe y est (ou fouille ses alentours), sinon dans ce qu'il porte.
  if (ab && (aLAbri(ctx.etat, ab) || reg === ab.system.region)) {
    const s = aPlat(ab.system);
    const sys = { stocks: L.ajouterStocks(s.stocks, r.butin), bruit: reg === s.region ? borner((Number(s.bruit) || 0) + r.bruit, 0, 10) : s.bruit };
    if (r.abri?.nature) sys.nature = r.abri.nature;
    await ab.update({ system: sys });
  } else ctx.etat.groupe.porte = L.ajouterStocks(ctx.etat.groupe.porte ?? {}, r.butin);
  for (const f of r.faits) noter(ctx, f);
  await chat(carteAction({ icone: "fa-magnifying-glass", titre: t("LAKOUR_SURVIE.Action.Fouille", { lieu: site ? nomSite(site) : nomRegion(reg) }),
    lignes: [t("LAKOUR_SURVIE.Action.Qui", { noms: qui.map(a => a.name).join(", ") || "—" }), t("LAKOUR_SURVIE.Action.Butin", { butin: texteStocks(r.butin) || t("LAKOUR_SURVIE.Action.Rien") })] }));
  await avancerInterne(ctx, q);
  return { butin: r.butin, rencontre: lisible(r.rencontre), bruit: r.bruit, faits: [...r.faits, ...ctx.faits].map(publicFait), fouille: r.fouille };
}

// Un abri d'avant les notes secrètes (sans le drapeau notesPubliques) : ses notes, écrites par le MJ, vont au monde scellé ; la
// fiche (que les joueurs observent) repart vide et ses notes sont désormais publiques. -> 1 si l'abri a été traité, 0 sinon.
async function secretiserNotesAbri(ctx, a) {
  if (!ctx?.monde || a?.type !== "abri" || a.flags?.[ID]?.notesPubliques) return 0;
  const notes = String(a.system?.notes ?? "");
  if (notes.trim()) {
    const avant = String(ctx.monde.notesAbris?.[a.id] ?? "");
    ctx.monde.notesAbris = { ...(ctx.monde.notesAbris ?? {}), [a.id]: avant ? `${avant}\n${notes}` : notes };
  }
  await a.update({ system: { notes: "" }, flags: { [ID]: { notesPubliques: true } } });
  return 1;
}

async function installerInterne(ctx, { site, abriId = "" }) {
  const c = contenu();
  const s = L.siteDe(c, site);
  if (!s) throw clair(t("LAKOUR_SURVIE.Erreurs.SiteInconnu", { site }));
  if (ctx.etat.groupe.enRoute) throw erreur("EnRoute");
  if (ctx.etat.groupe.region !== s.region) throw clair(t("LAKOUR_SURVIE.Erreurs.PasDansLaRegion", { region: nomRegion(s.region) }));
  const quart = ctx.etat.horloge.quart;
  // Le site d'abord (occupé par une faction ?) : l'abri courant n'est quitté que si l'on peut s'installer (rien n'est écrit sinon).
  const essai = L.installerAbri(ctx.monde, c, { site, jour: jourCtx(ctx), quart });
  if (!essai.ok) throw clair(motifLisible(essai));
  // Un abri déjà occupé ailleurs : il est quitté (tout ce qu'il contient y reste).
  const ancien = abriCourant(ctx.etat);
  if (ancien && ancien.system.site !== site) await quitterAbri(ctx, ancien, {});
  const r = L.installerAbri(ctx.monde, c, { site, jour: jourCtx(ctx), quart, apport: ctx.etat.groupe.porte ?? {} });
  if (!r.ok) throw clair(motifLisible(r));
  ctx.monde = r.monde;
  let a = abriId ? acteur(abriId) : null;
  if (a && (a.type !== "abri" || a.system.site !== site)) a = null;
  a ??= (game.actors?.contents ?? []).find(x => x.type === "abri" && x.system.site === site && x.id !== ancien?.id) ?? (ancien?.system.site === site ? ancien : null);
  const OBS = globalThis.CONST?.DOCUMENT_OWNERSHIP_LEVELS?.OBSERVER ?? 2;
  if (!a) {
    a = await Actor.implementation.create({ name: s.nom, type: "abri", img: "icons/svg/house.svg", system: r.abri, ownership: { default: OBS },
      flags: { [ID]: { notesPubliques: true } } });
  } else {
    // Les notes publiques de l'abri restent ; d'anciennes notes du MJ (d'avant les notes secrètes) partent au monde scellé AVANT que
    // les joueurs ne voient l'abri.
    const { notes: _notes, ...systeme } = r.abri;
    await secretiserNotesAbri(ctx, a);
    await a.update({ system: systeme, ownership: { ...(a.ownership ?? {}), default: OBS } });
    const vieilles = objetsDe(a, "installation").map(i => i.id);
    if (vieilles.length) await a.deleteEmbeddedDocuments("Item", vieilles);
  }
  const objets = [];
  for (const inst of r.installations) { const def = defDe("installations", inst.cle); if (def) objets.push(await donneesInstallation(def, inst)); }
  if (objets.length) await a.createEmbeddedDocuments("Item", objets);
  ctx.etat.groupe.abri = a.id;
  ctx.etat.groupe.porte = {};
  ctx.etat.chroniques = [...(ctx.etat.chroniques ?? []), { id: a.id, site, region: s.region, nom: s.nom, debut: quart, fin: null, morts: [], construit: [] }];
  ctx.chroniques = true;
  noter(ctx, tx(r.repris ? "Journal.Reprend" : "Journal.Installe", { site: s.nom, region: nomRegion(s.region) }));
  await chat(carteAction({ icone: "fa-house-flag", titre: t("LAKOUR_SURVIE.Action.Installe", { site: s.nom }),
    lignes: [t("LAKOUR_SURVIE.Action.Stocks", { stocks: texteStocks(r.abri.stocks) || t("LAKOUR_SURVIE.Action.Rien") }),
      objets.length ? t("LAKOUR_SURVIE.Action.Installations", { liste: objets.map(o => o.name).join(", ") }) : ""] }));
  return { abriId: a.id, repris: r.repris, stocks: r.abri.stocks, installations: objets.map(o => o.name) };
}

// L'abri courant est quitté (déménagement ou installation ailleurs) : il devient un abri abandonné du monde, avec ce qu'on y laisse.
async function quitterAbri(ctx, a, { emporter = {}, transport = "pied", membres = 1 }) {
  const l = abriLogique(a);
  const d = L.demenager(ctx.monde, { abri: l.system, installations: l.installations.map(({ id: _id, ...i }) => i), emporter, transport, membres, jour: jourCtx(ctx) });
  ctx.monde = d.monde;
  await a.update({ system: { abandonneLe: ctx.etat.horloge.quart, stocks: d.laisse } });
  ctx.etat.groupe.abri = "";
  ctx.etat.groupe.porte = L.ajouterStocks(ctx.etat.groupe.porte ?? {}, d.emporte);
  const ch = chapitreOuvert(ctx.etat);
  if (ch) { ch.fin = ctx.etat.horloge.quart; ctx.chroniques = true; }
  noter(ctx, tx("Journal.Quitte", { site: a.name }));
  return d;
}

async function voyagerInterne(ctx, { vers, transport = "pied", membres = [], charge = 0 }) {
  const c = contenu();
  if (!L.regionDe(c, vers)) throw clair(t("LAKOUR_SURVIE.Erreurs.RegionInconnue", { region: vers }));
  if (ctx.etat.groupe.enRoute) throw erreur("EnRoute");
  const qui = membresValides(ctx, membres);
  const vehicule = typeof transport === "string" && !["pied", "vehicule", "bateau"].includes(transport) ? defDe("equipements", transport) : null;
  const moyen = vehicule && L.estVehicule(vehicule) ? vehicule : (["pied", "vehicule", "bateau"].includes(transport) ? transport : "pied");
  const ab = abriCourant(ctx.etat);
  const depuisAbri = aLAbri(ctx.etat, ab);
  const reserve = depuisAbri ? aPlat(ab.system).stocks : (ctx.etat.groupe.porte ?? {});
  const r = L.voyager(ctx.monde, c, hasard(ctx, "voyage"), { de: ctx.etat.groupe.region, vers, transport: moyen, membres: Math.max(1, qui.length),
    charge, quart: ctx.etat.horloge.quart, renseignements: ctx.etat.renseignements, carburant: Number(reserve?.carburant) || 0 });
  if (!r.possible) throw clair(t("LAKOUR_SURVIE.Erreurs.Voyage", { raison: motifLisible(r) }));
  // Carburant et provisions de route (eau et nourriture pour chacun, par jour entamé), pris là où ils sont.
  const jours = Math.ceil(r.quarts / 4);
  const provisions = { eau: qui.length * jours, nourriture: qui.length * jours, carburant: r.carburant };
  const pris = L.retirerStocks(reserve, provisions);
  if (depuisAbri) await ab.update({ system: { stocks: pris.stocks } }); else ctx.etat.groupe.porte = pris.stocks;
  ctx.etat.renseignements = r.renseignements;
  ctx.etat.groupe.enRoute = { de: ctx.etat.groupe.region, vers, route: r.chemin.join(" > "), reste: r.quarts, transport: vehicule?.cle ?? moyen };
  for (const f of r.faits) noter(ctx, f);
  await chat(carteAction({ icone: "fa-route", titre: t("LAKOUR_SURVIE.Action.Voyage", { vers: nomRegion(vers) }),
    lignes: [t("LAKOUR_SURVIE.Action.Chemin", { chemin: r.chemin.map(nomRegion).join(" → "), quarts: r.quarts }), t("LAKOUR_SURVIE.Action.Qui", { noms: qui.map(a => a.name).join(", ") })] }));
  await avancerInterne(ctx, r.quarts, { mangeHorsAbri: !(pris.manque.nourriture > 0), boitHorsAbri: !(pris.manque.eau > 0) });
  return { possible: true, arrivee: !ctx.etat.groupe.enRoute, quarts: r.quarts, chemin: r.chemin, carburant: r.carburant, rencontre: lisible(r.rencontre),
    rencontres: r.rencontres.map(lisible), faits: [...r.faits, ...ctx.faits].map(publicFait), manque: pris.manque };
}

async function assautInterne(ctx, { force = 1, type = "", description = "", menaceId = "" }) {
  const ab = abriCourant(ctx.etat);
  if (!ab) throw erreur("SansAbri");
  const b = bilanVivant(ctx.etat, ctx.monde);
  const presents = aLAbri(ctx.etat, ab) ? survivantsDuGroupe(ctx.etat).filter(a => L.peutAgir(a.system)) : [];
  const garde = presents.filter(a => a.system.tache === "garde");
  // Le meilleur garde, avec son bonus d'outil et celui des installations (tour de guet…), au plus +2 comme pour un test (§1.7).
  const vigilance = L.vigilanceDeGarde((garde.length ? garde : presents).map(a => ({
    niveau: Number(a.system.competences?.vigilance?.niveau) || 0,
    outil: Math.max(0, ...objetsDe(a, "equipement").map(i => Number(i.system?.bonus?.vigilance) || 0))
  })), { installation: Number(b?.bonus?.vigilance) || 0 });
  const h = hasard(ctx, "assaut");
  // Un chef très écouté donne un dé de plus à la défense, un chef qu'on n'écoute plus en coûte un (chefs.mjs).
  const chef = presents.find(a => a.id === ctx.etat.groupe.chef);
  const autorite = chef ? L.bonusAutoriteAssaut(L.autoriteDe(chef.system)) : 0;
  const r = L.resoudreAssaut({ defense: Math.max(0, (b?.defense ?? 0) + autorite), vigilance, force: entier(force, 1, 15, 1), hasard: h });
  const l = abriLogique(ab);
  const degats = [];
  let installations = l.installations;
  if (r.installationEndommagee) {
    const exposees = installations.filter(i => i.niveau >= 1 && i.etat < 3);
    const cible = exposees.length ? exposees[Math.floor(h() * exposees.length)] : null;
    if (cible) { installations = installations.map(i => (i.id === cible.id ? L.endommagerInstallation(i, 1) : i)); degats.push(defDe("installations", cible.cle)?.nom ?? cible.cle); }
  }
  await ecrireAbri(ab, { system: { degats: (Number(l.system.degats) || 0) + r.degats }, installations });
  const blesses = [];
  for (let k = 0; k < r.blesses && presents.length; k++) {
    const a = presents[Math.floor(h() * presents.length)];
    const s = L.blesser(systemeLogique(a, ctx.monde), 1).system;
    await ecrireSurvivant(a, s, ctx);
    blesses.push(a.id);
  }
  if (menaceId && ctx.monde) ctx.monde.menaces = (ctx.monde.menaces ?? []).filter(m => m.id !== menaceId);
  noter(ctx, tx(`Assaut.Journal.${r.issue}`, { type: type || t("LAKOUR_SURVIE.Assaut.Inconnu") }));
  if (r.issue === "breche") alerter(ctx, "breche", tx("Assaut.Breche"));
  await chat(carteAssaut(r, { type, description, degats, blesses: blesses.map(id => acteur(id)?.name ?? id) }));
  annoncer("lakourSurvie.assaut", [{ issue: r.issue, marge: r.marge }]);
  return { marge: r.marge, issue: r.issue, degats, blesses, desDefense: r.desDefense, desMenace: r.desMenace, succesDefense: r.succesDefense, succesMenace: r.succesMenace };
}

async function soinsDe(ctx, { acteurId, soigneurId = "", difficulte = "" }) {
  const patient = acteur(acteurId);
  if (!patient) throw erreur("ActeurInconnu");
  const presents = survivantsDuGroupe(ctx.etat).filter(a => L.peutAgir(a.system));
  const soigneur = acteur(soigneurId) ?? presents.filter(a => a.id !== patient.id).sort((x, y) => (y.system.competences?.soins?.niveau ?? 0) - (x.system.competences?.soins?.niveau ?? 0))[0] ?? patient;
  return { patient, soigneur, difficulte: difficulte || (Number(patient.system.blessures) >= 4 ? "difficile" : "normale") };
}

// ------------------------------------------------------------------ l'esprit, le sens moral, la communauté (contrat §11)
const nomActe = acte => t(`LAKOUR_SURVIE.Actes.${acte}`);
async function ecrireEsprit(a, s) {
  if (!a) return;
  await a.update({ system: Object.fromEntries(CHAMPS_ESPRIT.filter(k => s[k] !== undefined).map(k => [k, structuredClone(s[k])]).concat(s.moral !== undefined ? [["moral", s.moral]] : [])) });
}
const membresPresents = ctx => survivantsDuGroupe(ctx.etat).filter(a => L.peutAgir(a.system));
// Les enfants du groupe ont vu l'acte (moralite.mjs, reactionEnfant) : ils l'imitent ou s'en révoltent ; un projet de départ et les
// adultes qui pourraient l'aider vont au MJ (journal secret), jamais au journal public.
async function temoignageEnfants(ctx, sens) {
  if (!sens) return [];
  const sortie = [];
  const presents = membresPresents(ctx);
  const adultes = presents.map(a => ({ id: a.id, system: systemeLogique(a, ctx.monde) }));
  for (const a of presents) {
    const sys = systemeLogique(a, ctx.monde);
    if (!L.estEnfant(sys)) continue;
    const avant = L.espritDe(sys).projet;
    const r = L.reactionEnfant(sys, sens, hasard(ctx, "enfant"));
    await ecrireEsprit(a, r.system);
    sortie.push({ acteurId: a.id, nom: a.name, reaction: r.reaction, projet: r.projet });
    if (r.projet && !avant) {
      const complices = L.complicesPossibles(adultes, ctx.etat.groupe.chef ?? "").map(id => acteur(id)?.name).filter(Boolean);
      const texte = t(`LAKOUR_SURVIE.Communaute.Projet.${r.projet}`, { nom: a.name, complices: complices.join(", ") || "—" });
      ctx.monde.journalSecret = [...(ctx.monde.journalSecret ?? []), { jour: jourCtx(ctx), texte, cle: "", params: {} }].slice(-L.JOURNAL_SECRET_MAX);
    }
  }
  return sortie;
}
// Un acte porté par des survivants (ou par le groupe, avec un vote) : jauges, réputations, enfants témoins.
async function porterActe(ctx, ids, acte, { voix = null, circonstances = false, temoins = true, delta = undefined } = {}) {
  const membres = ids.map(acteur).filter(a => a?.type === "survivant").map(a => ({ id: a.id, system: systemeLogique(a, ctx.monde) }));
  const r = L.acteCollectif(membres, acte, { voix, chefId: ctx.etat.groupe.chef ?? "", circonstances, temoins, delta });
  for (const m of r.membres) await ecrireEsprit(acteur(m.id), m.system);
  const enfants = await temoignageEnfants(ctx, Math.sign(delta ?? L.ACTES_MORAUX[acte] ?? 0));
  return { membres: r.membres.map(m => ({ acteurId: m.id, nom: acteur(m.id)?.name ?? m.id, sensMoral: m.system.sensMoral, reputation: m.system.reputation, delta: m.delta, deltaReputation: m.reputation })),
    porteurs: r.porteurs, epargnes: r.epargnes, enfants };
}
// Le vote (moralite.mjs) : les voix données, et celles des compagnons, recrues et PNJ qu'on ne joue pas (voixAuto).
function voixDu(ctx, { acte = "", voix = {}, circonstances = false } = {}) {
  const sens = Math.sign(L.ACTES_MORAUX[acte] ?? 0);
  const sortie = {};
  for (const a of membresPresents(ctx)) {
    const v = voix?.[a.id];
    if (L.VOIX.includes(v)) sortie[a.id] = v;
    else sortie[a.id] = a.system.statut === "joueur" ? "abstention" : L.voixAuto(systemeLogique(a, ctx.monde), sens, { circonstances });
  }
  return sortie;
}
// Le chef suit-il le vote ? (autorité, chefs.mjs) -> { delta, suivi } | null
async function suivreLeVote(ctx, vote, acteFait) {
  const chef = acteur(ctx.etat.groupe.chef);
  if (!vote || !chef) return null;
  const r = L.suivreVote(systemeLogique(chef, ctx.monde), vote.resultat, vote.acte === acteFait ? "pour" : "contre");
  vote.decide = acteFait;
  if (r.delta) await chef.update({ system: { autorite: r.system.autorite } });
  if (!r.suivi) { ctx.etat = L.ajusterEntente(ctx.etat, -1); noter(ctx, tx("Journal.VoteIgnore", { nom: chef.name })); }
  else noter(ctx, tx("Journal.VoteSuivi", { nom: chef.name }));
  return { delta: r.delta, suivi: r.suivi };
}
// Les voix d'un vote, vues depuis un autre acte : qui votait pour accueillir s'opposait à l'exclusion.
const voixPour = (vote, acte) => (!vote ? null : vote.acte === acte ? vote.voix
  : Object.fromEntries(Object.entries(vote.voix).map(([id, v]) => [id, v === "pour" ? "contre" : v === "contre" ? "pour" : v])));
function poserTribut(ctx, m) {
  const ab = abriCourant(ctx.etat);
  const stocks = ab ? aPlat(ab.system).stocks : ctx.etat.groupe.porte ?? {};
  ctx.monde.compteurTributs = (Number(ctx.monde.compteurTributs) || 0) + 1;
  const nomBande = L.factionDe(contenu(), m.faction)?.nom ?? m.faction ?? "?";
  const { tribut, secret } = L.poserUltimatum({ id: `t${ctx.monde.compteurTributs}`, bande: nomBande, faction: m.faction ?? "", sensMoral: m.chef?.sensMoral ?? 0,
    force: m.force, demande: L.demandeTribut(stocks, m.force), jour: jourCtx(ctx) });
  ctx.etat.tributs = [...(ctx.etat.tributs ?? []), tribut].slice(-10);
  ctx.monde.bandes = { ...(ctx.monde.bandes ?? {}), [tribut.id]: secret };
  noter(ctx, tx("Journal.Tribut", { bande: nomBande, demande: texteStocks(tribut.demande), n: tribut.tousLes }));
  return { tribut: structuredClone(tribut) };
}
// Quelqu'un frappe à la porte, tout de suite (le MJ, une bande qui demande à rejoindre).
async function faireFrapper(ctx, { profil = null, sensMoral = null } = {}) {
  const ab = abriCourant(ctx.etat);
  const membres = membresPresents(ctx).map(a => systemeLogique(a, ctx.monde));
  ctx.monde.compteurPorte = (Number(ctx.monde.compteurPorte) || 0) + 1;
  const { public: v, secret } = L.tirerVisiteur(contenu(), hasard(ctx, "porte"), { id: `v${ctx.monde.compteurPorte}`, jour: jourCtx(ctx), couleur: L.couleurDuGroupe(membres).bande,
    region: ab?.system.region ?? ctx.etat.groupe.region, profil });
  if (sensMoral !== null && sensMoral !== undefined) secret.survivant.sensMoral = entier(sensMoral, L.SENS_MORAL.min, L.SENS_MORAL.max, 0);
  ctx.etat.porte = [...(ctx.etat.porte ?? []), v];
  ctx.monde.porte = { ...(ctx.monde.porte ?? {}), [v.id]: secret };
  noter(ctx, { cle: "porte-frappe", cleTexte: `porte-frappe-${v.profil}`, params: { nom: v.nom, n: v.bouches }, texte: v.demande.texte });
  return structuredClone(v);
}
const listePorteCtx = ctx => {
  const ab = abriCourant(ctx.etat);
  if (!ab) return [];
  const b = bilanVivant(ctx.etat, ctx.monde);
  return L.listeALaPorte({ stocks: aPlat(ab.system).stocks, bilan: b, personnes: b?.personnes ?? 1 });
};
// Ce que le groupe sait de sa communauté (public), plus la couleur réelle pour le MJ actif.
export function communaute(etat = lireEtat()) {
  const membres = survivantsDuGroupe(etat).filter(a => L.peutAgir(a.system));
  const ab = abriCourant(etat);
  const b = ab ? (estMJActif() && Coffre.mondeOuvert() ? bilanVivant(etat) : etat.bilan) : null;
  return {
    chef: etat.groupe?.chef ?? "", entente: L.ententeDe(etat), reputation: L.reputationDuGroupe(membres.map(a => aPlat(a.system))),
    couleur: game.user?.isGM ? L.couleurDuGroupe(membres.map(a => aPlat(a.system))) : null,
    porte: structuredClone(etat.porte ?? []), tributs: structuredClone(etat.tributs ?? []), votes: structuredClone(etat.votes ?? []),
    communautes: structuredClone(etat.communautes ?? []),
    liste: ab ? L.listeALaPorte({ stocks: aPlat(ab.system).stocks, bilan: b, personnes: b?.personnes ?? membres.length }) : []
  };
}

export const api = {
  logique: L,
  registre,
  // Un texte de la logique ({ cle, params, texte } : entrée du journal, alerte, fait, menace, rencontre) dans la langue de ce navigateur.
  localiser,

  // ---------------- lecture
  contenu: () => contenu(),
  etat: () => lireEtat(),
  monde: () => Coffre.mondeReel(),
  quand: () => quandDe(),
  bilan: () => (estMJActif() && Coffre.mondeOuvert() ? bilanVivant() : (() => { const e = lireEtat(); return e.bilan ? { ...structuredClone(e.bilan), autonomie: e.autonome, autonome: e.autonome, joursAutonomes: e.joursAutonomes, alertes: (e.alertes ?? []).slice(-5) } : null; })()),
  besoins: () => besoins(),
  generer: (options = {}) => generer(options),
  mondeOuvert: () => Coffre.mondeOuvert(),
  ecritureBloquee: () => Coffre.ecritureBloquee(),
  fetesDuJour: (date = quandDe().date) => fetesDuJeu(date, contenu().fetes ?? []),
  peutConstruire(cle) {
    const etat = lireEtat(), ab = abriCourant(etat);
    const def = defDe("installations", cle);
    if (!ab || !def) return { ok: false, raisons: [t(ab ? "LAKOUR_SURVIE.Erreurs.InstallationInconnue" : "LAKOUR_SURVIE.Erreurs.SansAbri", { installation: cle })] };
    const l = abriLogique(ab);
    return L.peutConstruire(def, undefined, { stocks: l.system.stocks, installations: l.installations }, L.siteDe(contenu(), l.system.site) ?? {}, { savoirs: savoirsDuGroupe(etat), plans: etat.groupe.plans });
  },
  peutFabriquer(cle, { bras = 1 } = {}) {
    const etat = lireEtat(), ab = abriCourant(etat);
    const def = defDe("recettes", cle);
    return L.peutFabriquer(def, { stocks: ab ? aPlat(ab.system).stocks : etat.groupe.porte ?? {}, installations: ab && aLAbri(etat, ab) ? instancesDe(ab) : [], savoirs: savoirsDuGroupe(etat), bras });
  },

  // ---------------- tests (le joueur propriétaire passe par le MJ actif)
  async test(args = {}) {
    if (estMJActif()) return enFile(() => testDirect(args));
    if (!proprietaireDe(acteur(args.acteurId), game.user?.id)) throw erreur("PasProprietaire");
    return requete("test", args);
  },
  async forcer(args = {}) {
    if (estMJActif()) return enFile(() => forcerDirect(args));
    return requete("forcer", args);
  },
  async assigner(args = {}) {
    if (estMJActif()) return enFile(() => assignerDirect(args));
    if (!proprietaireDe(acteur(args.acteurId), game.user?.id)) throw erreur("PasProprietaire");
    return requete("assigner", { acteurId: args.acteurId, tache: args.tache });
  },
  async proposer(args = {}) {
    if (estMJActif()) return enFile(() => proposerDirect({ ...args, userId: game.user.id }));
    return requete("proposer", args);
  },
  async creerSurvivant({ donnees, userId = "", rejoindre = true, statut = null } = {}) {
    if (estMJActif()) return enFile(() => creerSurvivantDirect({ donnees, userId: userId || "", rejoindre, statut }));
    return requete("creer", { donnees, rejoindre });
  },

  // ---------------- la partie
  // graine : vide = une graine sûre de 128 bits (crypto.getRandomValues) ; donnée, 32 caractères au moins (une graine courte se
  // devinerait), sauf essai: true (essais, simulateur : graine courte voulue, gardée telle quelle).
  demarrer: ecritureMJ(async ({ dateDepart: dd = null, graine = "", essai = false, region, membres = [], pnj = [], partie = "" } = {}) => {
    const c = contenu();
    if (!L.regionDe(c, region)) throw clair(t("LAKOUR_SURVIE.Erreurs.RegionInconnue", { region }));
    const g = String(graine ?? "").trim();
    if (g && !L.graineLongue(g) && !essai) throw erreur("GraineCourte");
    if (dd) {
      if (!L.dateValide(dd)) throw erreur("DateInvalide");
      await game.settings.set(ID, "dateDepart", dd);
    }
    const ids = [...new Set(membres)].filter(id => acteur(id)?.type === "survivant");
    const p = String(partie || foundry.utils.randomID());
    const pnjs = (pnj ?? []).map((x, i) => ({ id: x.id ?? `pnj${i + 1}`, nom: x.nom ?? "?", passe: x.passe ?? "", etat: x.etat ?? "", travail: x.travail !== false }));
    const { monde, etat } = L.demarrerPartie({ contenu: c, graine: g || L.graineSure(), dateDepart: dateDepart(), region, membres: ids, pnj: pnjs, partie: p });
    Object.assign(monde, { menaces: [], paliers: [], visibiliteVeille: 0, tirages: 0, compteurMenaces: 0, incubations: {}, notesAbris: {}, ...(g && essai ? { graineEssai: true } : {}) });
    const statutDe = a => a.system.statut || (a.hasPlayerOwner ? "joueur" : a.getFlag?.(MODULE_MJIA, "compagnon") ? "compagnon" : "pnj");
    etat.groupe.statuts = Object.fromEntries(ids.map(id => [id, statutDe(acteur(id))]));
    Object.assign(etat, { chroniques: [], propositions: [] });
    etat.groupe.porte = {};
    Coffre.nouvellePartie(p, monde);
    const ctx = { ...ouvrirCtx(), etat, monde };
    noter(ctx, tx("Journal.Debut", { region: nomRegion(region), date: quandDe(etat).date }));   // date ISO : rendue dans la langue du lecteur
    await terminer(ctx);
    annoncer("lakourSurvie.nouvellePartie", [quandDe(ctx.etat)]);
    await suivreFetesDuJeu(quandDe(ctx.etat).date, c.fetes ?? []).catch(() => null);
    return { partie: p, etat: structuredClone(ctx.etat), quand: quandDe(ctx.etat) };
  }),

  avancer: ecriture(async ({ quarts = 1, raison = "", repos = false, veille = [], stabilises = [], corpsTraites = [] } = {}) => {
    const ctx = ouvrirCtx();
    ctx.raison = String(raison ?? "");
    ctx.carteTemps = true;
    await avancerInterne(ctx, quarts, { repos: Boolean(repos), veille, stabilises, corpsTraites });
    await terminer(ctx);
    return { quand: quandDe(ctx.etat), faits: ctx.faits.map(publicFait), alertes: ctx.alertes, bilan: bilanVivant(ctx.etat, ctx.monde), departs: ctx.departs };
  }),

  explorer: ecriture(async ({ region = "", membres = [], quarts = 1, prudence = "normal" } = {}) => {
    const ctx = ouvrirCtx();
    const c = contenu();
    const reg = region || ctx.etat.groupe.region;
    if (!L.regionDe(c, reg)) throw clair(t("LAKOUR_SURVIE.Erreurs.RegionInconnue", { region: reg }));
    const qui = membresValides(ctx, membres);
    const r = L.explorer(ctx.monde, c, hasard(ctx, "exploration"), { region: reg, jour: jourCtx(ctx), moment: L.momentDe(ctx.etat.horloge.quart), prudence, renseignements: ctx.etat.renseignements });
    ctx.monde = r.monde;
    ctx.etat.renseignements = r.renseignements;
    for (const f of r.faits) noter(ctx, f);
    await chat(carteAction({ icone: "fa-binoculars", titre: t("LAKOUR_SURVIE.Action.Exploration", { region: nomRegion(reg) }), lignes: [t("LAKOUR_SURVIE.Action.Qui", { noms: qui.map(a => a.name).join(", ") || "—" })] }));
    await avancerInterne(ctx, entier(quarts, 1, 8, 1));
    await terminer(ctx);
    return { renseignement: structuredClone(ctx.etat.renseignements[reg] ?? null), rencontre: lisible(r.rencontre), faits: [...r.faits, ...ctx.faits].map(publicFait) };
  }),

  fouiller: ecriture(async (args = {}) => {
    const ctx = ouvrirCtx();
    const r = await fouillerInterne(ctx, args);
    await terminer(ctx);
    return r;
  }),

  installer: ecriture(async ({ site, abriId = "" } = {}) => {
    const ctx = ouvrirCtx();
    const r = await installerInterne(ctx, { site, abriId });
    await terminer(ctx);
    return r;
  }),

  construire: ecriture(async ({ installation, membres = [], quarts = 1 } = {}) => {
    const ctx = ouvrirCtx();
    const ab = abriCourant(ctx.etat);
    if (!ab) throw erreur("SansAbri");
    if (!aLAbri(ctx.etat, ab)) throw erreur("PasALAbri");
    const def = defDe("installations", installation);
    if (!def) throw clair(t("LAKOUR_SURVIE.Erreurs.InstallationInconnue", { installation }));
    const l = abriLogique(ab);
    const site = L.siteDe(contenu(), l.system.site) ?? {};
    const existante = l.installations.find(i => i.cle === def.cle) ?? null;
    let instance = existante;
    let cout = {};
    if (!existante || !(existante.chantier.requis > 0)) {
      const o = L.ouvrirChantier(def, { stocks: l.system.stocks, installations: l.installations }, site, { savoirs: savoirsDuGroupe(ctx.etat), plans: ctx.etat.groupe.plans });
      if (!o.ok) throw clair(t("LAKOUR_SURVIE.Erreurs.Construction", { raisons: motifsLisibles(o) }));
      await ab.update({ system: { stocks: o.stocks } });
      instance = { ...o.instance, id: existante?.id };
      cout = o.cout;
      noter(ctx, tx("Journal.Chantier", { installation: def.nom, niveau: (existante?.niveau ?? 0) + 1 }));
    }
    const qui = membresValides(ctx, membres);
    const q = entier(quarts, 1, 40, 1);
    const ch = L.avancerChantier(instance, def, { quarts: q, bras: Math.max(1, qui.length), jour: jourCtx(ctx) });
    if (existante) await ab.updateEmbeddedDocuments("Item", [{ _id: existante.id, system: { niveau: ch.instance.niveau, chantier: ch.instance.chantier, termineLe: ch.instance.termineLe, etat: ch.instance.etat, reparation: Number(ch.instance.reparation) || 0 } }]);
    else await ab.createEmbeddedDocuments("Item", [await donneesInstallation(def, ch.instance)]);
    await ab.update({ system: { bruit: borner((Number(ab.system.bruit) || 0) + 1, 0, 10) } });
    if (ch.termine) {
      ctx.etat = L.ajouterPlan(ctx.etat, def.cle);
      const chap = chapitreOuvert(ctx.etat);
      if (chap) { chap.construit = [...new Set([...(chap.construit ?? []), def.nom])]; ctx.chroniques = true; }
      noter(ctx, tx("Journal.Termine", { installation: def.nom, niveau: ch.niveau }));
    }
    await chat(carteAction({ icone: "fa-hammer", titre: t("LAKOUR_SURVIE.Action.Chantier", { installation: def.nom }),
      lignes: [t("LAKOUR_SURVIE.Action.Qui", { noms: qui.map(a => a.name).join(", ") }),
        ch.termine ? t("LAKOUR_SURVIE.Action.Termine", { niveau: ch.niveau }) : t("LAKOUR_SURVIE.Action.Avance", { fait: ch.instance.chantier.fait, requis: ch.instance.chantier.requis }),
        Object.keys(cout).length ? t("LAKOUR_SURVIE.Action.Cout", { cout: texteStocks(Object.fromEntries(Object.entries(cout).filter(([k]) => k !== "travail"))) || "—" }) : ""] }));
    await avancerInterne(ctx, q);
    await terminer(ctx);
    return { chantier: structuredClone(ch.instance.chantier), termine: ch.termine, niveau: ch.niveau, reste: ch.reste, cout, plan: (ctx.etat.groupe.plans ?? []).includes(def.cle) };
  }),

  reparer: ecriture(async ({ installationId = "", membres = [], quarts = 1 } = {}) => {
    const ctx = ouvrirCtx();
    const ab = abriCourant(ctx.etat);
    if (!ab) throw erreur("SansAbri");
    const l = abriLogique(ab);
    const q = entier(quarts, 1, 40, 1);
    const bras = Math.max(1, membresValides(ctx, membres).length);
    let stocks = l.system.stocks;
    let resultat;
    if (installationId) {
      const inst = l.installations.find(i => i.id === installationId);
      if (!inst) throw erreur("InstallationAbsente");
      const def = defDe("installations", inst.cle);
      const r = L.reparerInstallation(inst, def, { quarts: q, bras, materiaux: Number(stocks.materiaux) || 0 });
      stocks = L.retirerStocks(stocks, { materiaux: r.cout.materiaux }).stocks;
      await ab.updateEmbeddedDocuments("Item", [{ _id: inst.id, system: { etat: r.instance.etat, reparation: r.instance.reparation } }]);
      await ab.update({ system: { stocks } });
      noter(ctx, tx("Journal.Repare", { installation: def?.nom ?? inst.cle, n: r.repares }));
      resultat = { etat: r.instance.etat, repares: r.repares, cout: r.cout };
    } else {
      const r = L.reparerAbri(l.system, { quarts: q, bras });
      await ab.update({ system: { degats: r.abri.degats, reparation: r.abri.reparation, stocks: r.abri.stocks } });
      noter(ctx, tx("Journal.RepareAbri", { n: r.repares }));
      resultat = { degats: r.abri.degats, repares: r.repares };
    }
    await avancerInterne(ctx, q);
    await terminer(ctx);
    return resultat;
  }),

  voyager: ecriture(async (args = {}) => {
    const ctx = ouvrirCtx();
    const r = await voyagerInterne(ctx, args);
    await terminer(ctx);
    return r;
  }),

  demenager: ecriture(async ({ site, emporter = {}, transport = "pied", membres = [] } = {}) => {
    const ctx = ouvrirCtx();
    const c = contenu();
    const s = L.siteDe(c, site);
    if (!s) throw clair(t("LAKOUR_SURVIE.Erreurs.SiteInconnu", { site }));
    const ab = abriCourant(ctx.etat);
    if (!ab) throw erreur("SansAbri");
    const qui = membresValides(ctx, membres);
    const vehicule = defDe("equipements", transport);
    const moyen = vehicule && L.estVehicule(vehicule) ? vehicule : (["pied", "vehicule", "bateau"].includes(transport) ? transport : "pied");
    const bras = Math.max(1, qui.length);
    // Tout est vérifié AVANT de quitter l'abri (rien n'est écrit si le voyage ou le site refuse) : ce qu'on emporte, le chemin réel,
    // le carburant, le site d'arrivée. Le voyage d'essai tire sur un hasard muet : ses rencontres sont jetées.
    const l = abriLogique(ab);
    const depart = L.demenager(ctx.monde, { abri: l.system, installations: [], emporter, transport: moyen, membres: bras, jour: jourCtx(ctx) });
    const charge = Object.values(depart.emporte).reduce((x, y) => x + y, 0);
    if (s.region !== ctx.etat.groupe.region) {
      const porte = L.ajouterStocks(ctx.etat.groupe.porte ?? {}, depart.emporte);
      const essai = L.voyager(ctx.monde, c, () => 0.5, { de: ctx.etat.groupe.region, vers: s.region, transport: moyen, membres: bras, charge,
        quart: ctx.etat.horloge.quart, renseignements: ctx.etat.renseignements, carburant: Number(porte.carburant) || 0 });
      if (!essai.possible) throw clair(t("LAKOUR_SURVIE.Erreurs.Voyage", { raison: motifLisible(essai) }));
    }
    const arrivee = L.installerAbri(ctx.monde, c, { site, jour: jourCtx(ctx), quart: ctx.etat.horloge.quart });
    if (!arrivee.ok) throw clair(motifLisible(arrivee));
    const d = await quitterAbri(ctx, ab, { emporter, transport: moyen, membres: bras });
    let voyage = null;
    if (s.region !== ctx.etat.groupe.region) voyage = await voyagerInterne(ctx, { vers: s.region, transport, membres: qui.map(a => a.id), charge });
    const inst = await installerInterne(ctx, { site });
    await terminer(ctx);
    return { arrivee: true, emporte: d.emporte, laisse: d.laisse, quarts: voyage?.quarts ?? 0, rencontre: voyage?.rencontre ?? null, rencontres: voyage?.rencontres ?? [], abriId: inst.abriId, faits: voyage?.faits ?? [] };
  }),

  ajuster: ecriture(async ({ stocks = null, acteurId = "", etat: variations = null, raison = "" } = {}) => {
    const ctx = ouvrirCtx();
    const lignes = [];
    const deltas = Object.fromEntries(Object.entries(stocks ?? {}).filter(([r, q]) => RESSOURCES.includes(r) && Number(q)).map(([r, q]) => [r, Math.round(Number(q))]));
    let nouveaux = null;
    if (Object.keys(deltas).length) {
      const ab = abriCourant(ctx.etat);
      if (ab) { nouveaux = L.ajouterStocks(aPlat(ab.system).stocks, deltas); await ab.update({ system: { stocks: nouveaux } }); }
      else { nouveaux = L.ajouterStocks(ctx.etat.groupe.porte ?? {}, deltas); ctx.etat.groupe.porte = nouveaux; }
      lignes.push(Object.entries(deltas).map(([r, q]) => `${q > 0 ? "+" : ""}${q} ${t(`LAKOUR_SURVIE.Ressources.${r}`).toLowerCase()}`).join(", "));
    }
    let etatActeur = null;
    if (acteurId && variations && typeof variations === "object") {
      const a = acteur(acteurId);
      if (!a || a.type !== "survivant") throw erreur("ActeurInconnu");
      const s = systemeLogique(a);
      const LIMITES = { blessures: BORNES.blessures, fatigue: BORNES.fatigue, moral: BORNES.moral, faim: [0, 99], soif: [0, 99] };
      const maj = {};
      for (const [k, [min, max]] of Object.entries(LIMITES)) if (Number(variations[k])) maj[k] = borner((Number(s[k]) || 0) + Math.round(Number(variations[k])), min, max);
      if (Object.keys(maj).length) await a.update({ system: maj });
      etatActeur = { ...Object.fromEntries(Object.keys(LIMITES).map(k => [k, s[k]])), ...maj };
      lignes.push(`${a.name} : ${Object.entries(maj).map(([k, v]) => `${t(`LAKOUR_SURVIE.Etat.${k}`)} ${v}`).join(", ")}`);
    }
    if (lignes.length) noter(ctx, `${raison || t("LAKOUR_SURVIE.Journal.Ajustement")} — ${lignes.join(" ; ")}`);
    await terminer(ctx);
    return { stocks: nouveaux, etat: etatActeur };
  }),

  blesser: ecriture(async ({ acteurId, n = 1, morsure = false } = {}) => {
    const ctx = ouvrirCtx();
    const a = acteur(acteurId);
    if (!a || a.type !== "survivant") throw erreur("ActeurInconnu");
    const r = L.blesser(systemeLogique(a, ctx.monde), entier(n, 1, 4, 1), { morsure: Boolean(morsure) });
    await ecrireSurvivant(a, r.system, ctx);
    noter(ctx, tx(morsure ? "Journal.Mordu" : "Journal.Blesse", { nom: a.name }));
    if (r.mourant) alerter(ctx, "mourant", tx("Alertes.Mourant", { nom: a.name }));
    if (morsure) alerter(ctx, "morsure", tx("Alertes.Morsure", { nom: a.name }));
    await terminer(ctx);
    return { blessures: r.system.blessures, mourant: r.mourant, morsure: r.morsure };
  }),

  soigner: ecriture(async ({ acteurId, soigneurId = "", difficulte = "" } = {}) => {
    const ctx = ouvrirCtx();
    const { patient, soigneur, difficulte: diff } = await soinsDe(ctx, { acteurId, soigneurId, difficulte });
    // Le soigneur doit être en état d'agir AVANT que le médicament soit consommé.
    if (soigneur.type !== "survivant" || !L.peutAgir(systemeLogique(soigneur))) throw clair(t("LAKOUR_SURVIE.Erreurs.HorsEtat", { nom: soigneur.name }));
    const ab = abriCourant(ctx.etat);
    const stocks = ab ? aPlat(ab.system).stocks : null;
    const medicament = (Number(stocks?.medicaments) || 0) > 0;
    if (medicament) await ab.update({ system: { stocks: L.retirerStocks(stocks, { medicaments: 1 }).stocks } });
    const soins = ab && aLAbri(ctx.etat, ab) ? Number(bilanVivant(ctx.etat, ctx.monde)?.soins) || 0 : 0;
    const test = await testDirect({ acteurId: soigneur.id, competence: "soins", difficulte: diff, bonus: (medicament ? 1 : 0) + Math.min(2, soins), titre: t("LAKOUR_SURVIE.Soins.Titre", { nom: patient.name }), forcable: false });
    const r = L.soigner(systemeLogique(patient, ctx.monde), test);
    await ecrireSurvivant(patient, r.system, ctx);
    noter(ctx, tx("Journal.Soigne", { nom: patient.name, soigneur: soigneur.name, n: r.soignees }));
    await terminer(ctx);
    return { test, soignees: r.soignees, blessures: r.system.blessures, medicament };
  }),

  infecter: ecriture(async ({ acteurId } = {}) => {
    const ctx = ouvrirCtx();
    const a = acteur(acteurId);
    if (!a || a.type !== "survivant") throw erreur("ActeurInconnu");
    const s = L.infecter(systemeLogique(a, ctx.monde), ctx.etat.horloge.quart);
    await ecrireSurvivant(a, s, ctx);
    noter(ctx, tx("Journal.Infecte", { nom: a.name }));
    await terminer(ctx);
    return { infection: structuredClone(s.infection) };
  }),

  marquer: ecritureMJ(async ({ acteurId, competence, n = 1 } = {}) => {
    const a = acteur(acteurId);
    if (!a || a.type !== "survivant") throw erreur("ActeurInconnu");
    if (!COMPETENCES.includes(competence)) throw clair(t("LAKOUR_SURVIE.Erreurs.CompetenceInconnue", { competence }));
    const s = systemeLogique(a);
    const r = L.marquer(s.competences?.[competence] ?? { niveau: 0, marques: 0 }, entier(n, 1, 10, 1), { passion: s.passions?.[competence] ?? 0, age: s.age });
    await a.update({ system: { competences: { ...s.competences, [competence]: { niveau: r.niveau, marques: r.marques } } } });
    return r;
  }),

  assaut: ecriture(async (args = {}) => {
    const ctx = ouvrirCtx();
    const r = await assautInterne(ctx, args);
    await terminer(ctx);
    return r;
  }),

  // Une menace du jour (monde().menaces) : la résoudre en assaut, ou l'écarter (le MJ la raconte autrement).
  resoudreMenace: ecriture(async ({ id, action = "assaut" } = {}) => {
    const ctx = ouvrirCtx();
    const m = (ctx.monde?.menaces ?? []).find(x => x.id === id);
    if (!m) throw erreur("MenaceInconnue");
    if (action === "assaut" && m.force > 0) {
      const r = await assautInterne(ctx, { force: m.force, type: t(`LAKOUR_SURVIE.Menaces.${m.type}`), description: localiser(m), menaceId: m.id });
      await terminer(ctx);
      return r;
    }
    // L'ultimatum d'un chef de bande accepté : un tribut (chefs.mjs) ; sa demande à rejoindre : quelqu'un à la porte.
    if (action === "ultimatum") {
      const r = poserTribut(ctx, m);
      ctx.monde.menaces = ctx.monde.menaces.filter(x => x.id !== id);
      await terminer(ctx);
      return r;
    }
    if (action === "rejoindre") {
      const v = await faireFrapper(ctx, { sensMoral: m.chef?.sensMoral, faction: m.faction });
      ctx.monde.menaces = ctx.monde.menaces.filter(x => x.id !== id);
      await terminer(ctx);
      return { visiteur: v };
    }
    ctx.monde.menaces = ctx.monde.menaces.filter(x => x.id !== id);
    await terminer(ctx);
    return { ecartee: true };
  }),

  rencontre: ecriture(async ({ region = "", type = null } = {}) => {
    const etat = lireEtat();
    const reg = region || etat.groupe.region;
    return lisible(L.rencontreForcee(Coffre.mondeEnMemoire(), contenu(), Math.random, { region: reg, type: type || null, jour: L.jourDe(etat.horloge.quart), moment: L.momentDe(etat.horloge.quart) }));
  }),

  renseigner: ecriture(async ({ region, ...champs } = {}) => {
    const ctx = ouvrirCtx();
    if (!L.regionDe(contenu(), region)) throw clair(t("LAKOUR_SURVIE.Erreurs.RegionInconnue", { region }));
    const PERMIS = ["vu", "source", "infestation", "pillage", "electricite", "eau", "routes", "factions", "notes"];
    const ok = Object.fromEntries(Object.entries(champs).filter(([k, v]) => PERMIS.includes(k) && v !== undefined));
    ctx.etat.renseignements = L.renseigner(ctx.etat.renseignements, region, ok, jourCtx(ctx));
    noter(ctx, tx("Journal.Renseignement", { region: nomRegion(region), source: ok.source ?? "rumeur" }));
    await terminer(ctx);
    return structuredClone(ctx.etat.renseignements[region]);
  }),

  // ---------------- §9 : atelier, afflictions, fêtes
  fabriquer: ecriture(async ({ recette, acteurId = "", membres = [], forcer = false } = {}) => {
    const ctx = ouvrirCtx();
    const c = contenu();
    const def = defDe("recettes", recette) ?? L.liste(c.recettes).find(r => r.nom === recette);
    if (!def) throw clair(t("LAKOUR_SURVIE.Erreurs.RecetteInconnue", { recette }));
    const competence = def.competence ?? "bricolage";
    const presents = membresValides(ctx, []);
    const artisan = acteur(acteurId) ?? presents.sort((x, y) => (y.system.competences?.[competence]?.niveau ?? 0) - (x.system.competences?.[competence]?.niveau ?? 0))[0];
    if (!artisan) throw erreur("ActeurInconnu");
    const ab = abriCourant(ctx.etat);
    const ici = aLAbri(ctx.etat, ab);
    const stocks = ab ? aPlat(ab.system).stocks : (ctx.etat.groupe.porte ?? {});
    const sys = systemeLogique(artisan);
    const mods = modificateursDuTest(artisan, sys, competence, ctx.etat);
    const bras = Math.max(1, (membres ?? []).length || 1);
    const r = L.fabriquer(def, { stocks, installations: ici ? instancesDe(ab) : [], savoirs: savoirsDuGroupe(ctx.etat), niveau: Number(sys.competences?.[competence]?.niveau) || 0,
      bonus: mods.bonus, malus: mods.malus, forcer: Boolean(forcer), bras, hasard: hasard(ctx, "atelier") });
    if (!r.ok) throw clair(t("LAKOUR_SURVIE.Erreurs.Fabrication", { raisons: motifsLisibles(r) }));
    if (ab) await ab.update({ system: { stocks: r.stocks } }); else ctx.etat.groupe.porte = r.stocks;
    const maj = await appliquerTest(artisan, competence, r.test);
    await chat(carteTest(r.test, { nom: artisan.name, competence, titre: t("LAKOUR_SURVIE.Atelier.Carte", { recette: def.nom }), monte: maj.monte, niveau: maj.niveau, forcable: false }),
      { speaker: parlePour(artisan), flags: { test: { acteurId: artisan.id, competence, resultat: r.test, forcable: false } } });
    if (r.produit?.equipement) {
      const e = defDe("equipements", r.produit.equipement);
      if (e) await artisan.createEmbeddedDocuments("Item", await Promise.all(Array.from({ length: Math.max(1, r.produit.n) }, () => donneesObjet("equipement", e))));
    }
    noter(ctx, tx(r.test.reussite ? "Journal.Fabrique" : "Journal.FabriqueRate", { nom: artisan.name, recette: def.nom }));
    await avancerInterne(ctx, Math.max(1, r.quarts));
    await terminer(ctx);
    return { ok: true, termine: true, reussite: r.test.reussite, competence, test: { ...r.test, competence }, produit: r.produit, quarts: r.quarts, perdu: r.perdu, acteurId: artisan.id };
  }),

  affliction: ecriture(async ({ acteurId, cle, action = "donner", soigneurId = "" } = {}) => {
    const ctx = ouvrirCtx();
    const a = acteur(acteurId);
    if (!a || a.type !== "survivant") throw erreur("ActeurInconnu");
    const def = defDe("afflictions", cle) ?? L.liste(contenu().afflictions).find(x => x.nom === cle);
    if (!def) throw clair(t("LAKOUR_SURVIE.Erreurs.AfflictionInconnue", { cle }));
    if (action === "donner") {
      const s = L.contracter(systemeLogique(a, ctx.monde), def, jourCtx(ctx));
      await ecrireSurvivant(a, s, ctx);
      noter(ctx, tx("Journal.Affliction", { nom: a.name, affliction: def.nom }));
      await terminer(ctx);
      return { ok: true, donnee: true, stade: s.afflictions.find(x => x.cle === def.cle)?.stade ?? "" };
    }
    if (!L.aAffliction(systemeLogique(a, ctx.monde), def.cle)) throw clair(t("LAKOUR_SURVIE.Erreurs.PasAtteint", { nom: a.name, affliction: def.nom }));
    const soigneur = acteur(soigneurId) ?? (await soinsDe(ctx, { acteurId })).soigneur;
    const ab = abriCourant(ctx.etat);
    const stocks = ab ? aPlat(ab.system).stocks : (ctx.etat.groupe.porte ?? {});
    const med = Math.max(0, Number(def.soin?.medicaments) || 0);
    if ((Number(stocks.medicaments) || 0) < med) throw clair(t("LAKOUR_SURVIE.Erreurs.Medicaments", { n: med }));
    const test = await testDirect({ acteurId: soigneur.id, competence: def.soin?.competence ?? "soins", difficulte: def.soin?.difficulte ?? "normale",
      titre: t("LAKOUR_SURVIE.Soins.Affliction", { nom: a.name, affliction: def.nom }), forcable: false });
    const r = L.soignerAffliction(systemeLogique(a, ctx.monde), def, test, stocks);
    if (ab) await ab.update({ system: { stocks: L.normaliserStocks(r.stocks) } }); else ctx.etat.groupe.porte = L.normaliserStocks(r.stocks);
    await ecrireSurvivant(a, r.system, ctx);
    noter(ctx, tx(r.ok ? "Journal.AfflictionSoignee" : "Journal.AfflictionRate", { nom: a.name, affliction: def.nom }));
    await terminer(ctx);
    return { ok: r.ok, gueri: r.ok, reussite: test.reussite, raison: motifLisible(r), test };
  }),

  feter: ecriture(async ({ fete = "" } = {}) => {
    const ctx = ouvrirCtx();
    const q = quandDe(ctx.etat);
    const f = trouverFete(fete, contenu().fetes ?? []) ?? (fete ? null : fetesDuJeu(q.date, contenu().fetes ?? [])[0] ?? null);
    const cle = f?.cle ?? String(fete ?? "").trim();
    if (!cle) throw erreur("AucuneFete");
    const ab = abriCourant(ctx.etat);
    if (!ab) throw erreur("SansAbri");
    const membres = survivantsDuGroupe(ctx.etat).map(a => ({ id: a.id, system: systemeLogique(a) }));
    const r = L.feter(ctx.etat, { system: aPlat(ab.system) }, { fete: cle, annee: L.dateDuJour(L.jourDe(ctx.etat.horloge.quart), dateDepart()).annee, survivants: membres, contenu: contenu() });
    if (!r.ok) throw clair(t("LAKOUR_SURVIE.Erreurs.Fete", { raison: motifLisible(r) }));
    ctx.etat = r.etat;
    await ab.update({ system: { stocks: r.abri.system.stocks, bruit: borner((Number(ab.system.bruit) || 0) + 2, 0, 10) } });
    for (const s of r.survivants) { const a = acteur(s.id); if (a && s.system.moral !== a.system.moral) await a.update({ system: { moral: s.system.moral } }); }
    const n = (Number(aPlat(ab.system).stocks?.nourriture) || 0);
    const nom = f?.nom ?? cle;
    noter(ctx, tx("Journal.Fete", { fete: nom }));
    await chat(carteAction({ icone: "fa-champagne-glasses", titre: t("LAKOUR_SURVIE.Fete.Carte", { fete: nom }), lignes: [t("LAKOUR_SURVIE.Fete.Effet"), sansBalises(f?.description ?? "")] }));
    await terminer(ctx);
    return { ok: true, fete: cle, texte: t("LAKOUR_SURVIE.Fete.Texte", { fete: nom, nourriture: n }) };
  }),

  // ---------------- §10 : groupe, recrues
  genererRecrue: async ({ region = "" } = {}) => {
    const etat = lireEtat();
    const c = contenu();
    const r = L.genererRecrue(c, Math.random, { besoins: besoinsBruts(etat), region: region || etat.groupe.region, phase: etat.phase });
    return { ...versTirage(r.survivant, c), statut: "recrue", raison: localiser(r.raisonMessage ?? { cle: r.raisonCle, texte: r.raison }), prix: localiser(r.prixMessage ?? { cle: r.prixCle, texte: r.prix }),
      region: region || etat.groupe.region };
  },

  recruter: ecriture(async ({ recrue, parleurId, attitude = "neutre", bonus = 0 } = {}) => {
    if (!recrue || typeof recrue !== "object") throw erreur("TirageManquant");
    const ctx = ouvrirCtx();
    const parleur = acteur(parleurId);
    if (!parleur || parleur.type !== "survivant") throw erreur("ActeurInconnu");
    const b = besoinsBruts(ctx.etat);
    const niveau = v => Number(typeof v === "object" && v !== null ? v.niveau : v) || 0;
    const combleUnManque = (b.manques ?? []).some(k => niveau(recrue.competences?.[k]) >= 2);
    const difficulte = L.difficulteRecrutement({ attitude, combleUnManque });
    const test = await testDirect({ acteurId: parleur.id, competence: "parole", difficulte, bonus, titre: t("LAKOUR_SURVIE.Recrue.Titre", { nom: recrue.nom ?? "?" }), forcable: false });
    let acteurId = "";
    if (test.reussite) {
      const a = await creerActeurSurvivant(recrue, { statut: "recrue" });
      acteurId = a.id;
      ctx.etat = L.ajouterMembre(ctx.etat, a.id, "recrue");
      noter(ctx, tx("Journal.Recrue", { nom: a.name }));
    } else noter(ctx, tx("Journal.RecrueRefuse", { nom: recrue.nom ?? "?" }));
    await terminer(ctx);
    return { test, reussite: test.reussite, acteurId, difficulte };
  }),

  ajouterMembre: ecriture(async ({ acteurId, statut = "compagnon" } = {}) => {
    const ctx = ouvrirCtx();
    const a = acteur(acteurId);
    if (!a || a.type !== "survivant") throw erreur("ActeurInconnu");
    const st = L.STATUTS.includes(statut) ? statut : "compagnon";
    ctx.etat = L.ajouterMembre(ctx.etat, a.id, st);
    await a.update({ system: { statut: st } });
    noter(ctx, tx("Journal.Rejoint", { nom: a.name }));
    await terminer(ctx);
    return { membres: [...ctx.etat.groupe.membres] };
  }),

  retirerMembre: ecriture(async ({ acteurId } = {}) => {
    const ctx = ouvrirCtx();
    ctx.etat = L.retirerMembre(ctx.etat, acteurId);
    noter(ctx, tx("Journal.Quitte", { site: acteur(acteurId)?.name ?? acteurId }));
    await terminer(ctx);
    return { membres: [...ctx.etat.groupe.membres] };
  }),

  // ---------------- §11 : l'esprit, le sens moral, la porte, les chefs (complément du jeu 3D, familles 2 et 3)
  communaute: () => communaute(),
  // Le point d'entrée commun du sens moral (la rumeur du Ladi Lafé y passe : acte « colporter ») : un acte porté par un ou plusieurs
  // survivants, ou un déplacement libre (delta). Avec un vote (voteId), qui a voté contre ne le porte pas.
  acteMoral: ecriture(async ({ acteurId = "", acteurs = [], acte = "", delta, circonstances = false, temoins = true, voteId = "", journal = false } = {}) => {
    const ctx = ouvrirCtx();
    const ids = [...new Set([acteurId, ...(acteurs ?? [])].filter(Boolean))];
    if (!ids.length || ids.some(id => acteur(id)?.type !== "survivant")) throw erreur("ActeurInconnu");
    const libre = delta !== undefined && delta !== null && delta !== "" && Number.isFinite(Number(delta));
    if (!libre && !(acte in L.ACTES_MORAUX)) throw clair(t("LAKOUR_SURVIE.Erreurs.ActeInconnu", { acte }));
    const vote = voteId ? (ctx.etat.votes ?? []).find(v => v.id === voteId) ?? null : null;
    const r = await porterActe(ctx, ids, acte, { voix: voixPour(vote, acte), circonstances: Boolean(circonstances), temoins: temoins !== false, delta: libre ? Math.round(Number(delta)) : undefined });
    const suivi = vote && acte ? await suivreLeVote(ctx, vote, acte) : null;
    if (journal && acte) noter(ctx, tx("Journal.Acte", { noms: r.membres.map(m => m.nom).join(", "), acte: nomActe(acte) }));
    await terminer(ctx);
    return { ...r, vote: suivi };
  }),
  // Le MJ règle l'esprit d'un survivant (valeurs absolues ; la fiche le permet aussi).
  ajusterEsprit: ecritureMJ(async ({ acteurId, ...champs } = {}) => {
    const a = acteur(acteurId);
    if (!a || a.type !== "survivant") throw erreur("ActeurInconnu");
    const s = systemeLogique(a);
    const e = L.espritDe(s);
    const maj = { ...espritDuTirage({ ...s, ...champs }), esprit: { ...e } };
    if (champs.chance !== undefined) maj.esprit.chance = entier(champs.chance, 0, L.REGLES_ESPRIT.chance.max, 0);
    if (champs.ancragePerdu !== undefined) maj.esprit.ancragePerdu = Boolean(champs.ancragePerdu);
    await a.update({ system: maj });
    return { acteurId: a.id, ...maj };
  }),
  // Tirer l'esprit d'une fiche qui n'en a pas (fiche d'avant, PNJ fait à la main) ; forcer : le retirer.
  tirerEsprit: ecritureMJ(async ({ acteurId, forcer = false } = {}) => {
    const a = acteur(acteurId);
    if (!a || a.type !== "survivant") throw erreur("ActeurInconnu");
    const s = systemeLogique(a);
    if (L.espritActif(s) && !forcer) return { acteurId: a.id, deja: true };
    const e = L.tirerEsprit(contenu(), Math.random, { traits: s.traits ?? [], competences: s.competences ?? {}, age: Number(s.age) || 30, enfance: s.enfance ?? "" });
    await a.update({ system: e });
    return { acteurId: a.id, ...e };
  }),
  entente: ecriture(async ({ delta = 0, raison = "" } = {}) => {
    const ctx = ouvrirCtx();
    ctx.etat = L.ajusterEntente(ctx.etat, Math.round(Number(delta) || 0));
    noter(ctx, tx("Journal.Entente", { n: L.ententeDe(ctx.etat), raison: String(raison ?? "") }));
    await terminer(ctx);
    return { entente: L.ententeDe(ctx.etat) };
  }),
  // Le chef du groupe (vide : personne).
  chef: ecriture(async ({ acteurId = "" } = {}) => {
    const ctx = ouvrirCtx();
    if (acteurId && !(ctx.etat.groupe.membres ?? []).includes(acteurId)) throw erreur("PasMembre");
    ctx.etat.groupe = { ...ctx.etat.groupe, chef: acteurId };
    noter(ctx, acteurId ? tx("Journal.Chef", { nom: acteur(acteurId)?.name ?? "?" }) : tx("Journal.SansChef"));
    await terminer(ctx);
    return { chef: acteurId };
  }),
  // La parole du chef : tenue (+1 autorité) ou manquée (−1).
  parole: ecriture(async ({ tenue = true, raison = "" } = {}) => {
    const ctx = ouvrirCtx();
    const a = acteur(ctx.etat.groupe.chef);
    if (!a) throw erreur("SansChef");
    const r = L.tenirParole(systemeLogique(a), Boolean(tenue));
    await a.update({ system: { autorite: r.system.autorite } });
    noter(ctx, tx(tenue ? "Journal.ParoleTenue" : "Journal.ParoleManquee", { nom: a.name, raison: String(raison ?? "") }));
    await terminer(ctx);
    return { autorite: r.system.autorite, delta: r.delta };
  }),
  // Un vote du groupe sur un acte (accueillir, exclure, trahir…) : les voix données, les autres comme le dirait leur jauge.
  voter: ecriture(async ({ question = "", acte = "accueillir", voix = {}, circonstances = false } = {}) => {
    const ctx = ouvrirCtx();
    if (!(acte in L.ACTES_MORAUX)) throw clair(t("LAKOUR_SURVIE.Erreurs.ActeInconnu", { acte }));
    const v = voixDu(ctx, { acte, voix, circonstances });
    const resultat = L.resoudreVote(v);
    ctx.etat.compteurVotes = (Number(ctx.etat.compteurVotes) || 0) + 1;
    const vote = { id: `vote${ctx.etat.compteurVotes}`, quart: ctx.etat.horloge.quart, question: String(question ?? "").slice(0, 200), acte, voix: v, resultat, decide: null };
    ctx.etat.votes = [...(ctx.etat.votes ?? []), vote].slice(-10);
    noter(ctx, tx("Journal.Vote", { question: vote.question || nomActe(acte), pour: resultat.pour, contre: resultat.contre, abstention: resultat.abstention }));
    await terminer(ctx);
    return structuredClone(vote);
  }),
  // Le chef décide après un vote, sans autre acte (un acte du groupe passe par acteMoral ou porte, avec voteId).
  decider: ecriture(async ({ voteId, decision = "pour" } = {}) => {
    const ctx = ouvrirCtx();
    const vote = (ctx.etat.votes ?? []).find(v => v.id === voteId);
    if (!vote) throw erreur("VoteInconnu");
    const r = await suivreLeVote(ctx, vote, decision === "pour" ? vote.acte : "");
    await terminer(ctx);
    return { vote: structuredClone(vote), ...(r ?? {}) };
  }),
  // Quelqu'un à la porte : accueillir, refuser, ou prendre ce qu'il apporte puis le trahir (porte.mjs).
  porte: ecriture(async ({ visiteurId, decision = "accueillir", voteId = "", circonstances = false } = {}) => {
    const ctx = ouvrirCtx();
    const r = L.repondreALaPorte(ctx.etat, ctx.monde, hasard(ctx, "porte"), { visiteurId, decision, jour: jourCtx(ctx), liste: listePorteCtx(ctx) });
    if (!r.ok) throw clair(localiser(r.motif));
    ctx.etat = r.etat;
    ctx.monde = r.monde;
    for (const f of r.faits) noter(ctx, f);
    // Ce qu'on prend (ce qu'il apporte) : à l'abri, sinon dans ce que le groupe porte.
    const ab = abriCourant(ctx.etat);
    if (Object.keys(r.stocks).length) {
      if (ab) await ab.update({ system: { stocks: L.ajouterStocks(aPlat(ab.system).stocks, r.stocks) } });
      else ctx.etat.groupe.porte = L.ajouterStocks(ctx.etat.groupe.porte ?? {}, r.stocks);
    }
    const vote = voteId ? (ctx.etat.votes ?? []).find(v => v.id === voteId) ?? null : null;
    const membres = membresPresents(ctx).map(a => a.id);
    const acte = await porterActe(ctx, membres, r.acte, { voix: voixPour(vote, r.acte), circonstances: Boolean(circonstances) });
    const suivi = vote ? await suivreLeVote(ctx, vote, r.acte) : null;
    let acteurId = "";
    if (r.recrue) {
      const a = await creerActeurSurvivant(versTirage(r.recrue, contenu()), { statut: "recrue" });
      acteurId = a.id;
      ctx.etat = L.ajouterMembre(ctx.etat, a.id, "recrue");
      // Une famille : des bouches en plus (PNJ légers, nourris par l'abri).
      for (let k = 0; k < r.bouches; k++) ctx.etat.groupe.pnj = [...(ctx.etat.groupe.pnj ?? []), { id: `pnj-${a.id}-${k + 1}`, nom: t("LAKOUR_SURVIE.Communaute.Proche", { nom: a.name, n: k + 1 }), passe: "", etat: "", travail: false }];
    }
    await terminer(ctx);
    return { decision, acte: r.acte, acteurId, bouches: r.bouches, pris: r.stocks, suite: r.suite ? r.suite.suite : "", ...acte, vote: suivi };
  }),
  // Le MJ fait frapper quelqu'un à la porte, tout de suite (profil : refugie, famille, blesse, dur ; vide : selon la couleur du groupe).
  frapper: ecriture(async ({ profil = "" } = {}) => {
    const ctx = ouvrirCtx();
    const v = await faireFrapper(ctx, { profil: L.PROFILS_VISITEUR.includes(profil) ? profil : null });
    await terminer(ctx);
    return v;
  }),
  // Le tribut qui tombe : payé ou refusé (chefs.mjs).
  tribut: ecriture(async ({ tributId, paye = true } = {}) => {
    const ctx = ouvrirCtx();
    const i = (ctx.etat.tributs ?? []).findIndex(x => x.id === tributId);
    if (i < 0) throw erreur("TributInconnu");
    const tribut = ctx.etat.tributs[i];
    const secret = ctx.monde.bandes?.[tributId] ?? {};
    if (paye) {
      const ab = abriCourant(ctx.etat);
      const stocks = ab ? aPlat(ab.system).stocks : ctx.etat.groupe.porte ?? {};
      if (!L.couvre(stocks, tribut.demande)) throw clair(t("LAKOUR_SURVIE.Erreurs.TributStocks", { demande: texteStocks(tribut.demande) }));
      const reste = L.retirerStocks(stocks, tribut.demande).stocks;
      if (ab) await ab.update({ system: { stocks: reste } }); else ctx.etat.groupe.porte = reste;
    }
    const r = L.echeanceTribut(tribut, secret, { paye: Boolean(paye), jour: jourCtx(ctx) });
    ctx.etat.tributs = ctx.etat.tributs.map((x, k) => (k === i ? r.tribut : x));
    noter(ctx, tx(`Journal.Tribut_${r.issue || "paye"}`, { bande: tribut.bande, demande: texteStocks(r.tribut.demande) }));
    if (r.issue === "revolte") {
      ctx.monde.compteurMenaces = (Number(ctx.monde.compteurMenaces) || 0) + 1;
      ctx.monde.menaces = [...(ctx.monde.menaces ?? []), { id: `m${ctx.monde.compteurMenaces}`, jour: jourCtx(ctx), type: "bande", force: Math.max(2, Math.ceil(1.5 * (Number(secret.force) || 2)) + 1),
        faction: tribut.faction, attitude: "hostile", cle: "menace-bande", params: { faction: tribut.bande }, texte: `${tribut.bande} s'intéresse à l'abri.` }].slice(-20);
    }
    await terminer(ctx);
    return { tribut: structuredClone(r.tribut), issue: r.issue };
  }),
  // Séparer le groupe : les partants s'en vont avec leur part des stocks (au prorata), tous gardent les plans ; l'abri va à l'un des deux.
  separer: ecriture(async ({ partants = [], abriVaAux = "restants", nom = "" } = {}) => {
    const ctx = ouvrirCtx();
    const membres = [...(ctx.etat.groupe.membres ?? [])];
    const p = (partants ?? []).filter(id => membres.includes(id));
    if (!p.length || p.length === membres.length) throw erreur("SeparationImpossible");
    const ab = abriCourant(ctx.etat);
    const stocks = ab ? aPlat(ab.system).stocks : ctx.etat.groupe.porte ?? {};
    const r = L.separerGroupe({ membres, partants: p, stocks, plans: ctx.etat.groupe.plans ?? [], abriVaAux });
    ctx.etat.compteurCommunautes = (Number(ctx.etat.compteurCommunautes) || 0) + 1;
    const c = { id: `c${ctx.etat.compteurCommunautes}`, nom: String(nom || t("LAKOUR_SURVIE.Communaute.Autres", { n: ctx.etat.compteurCommunautes })).slice(0, 80),
      membres: r.partants, statuts: Object.fromEntries(r.partants.map(id => [id, ctx.etat.groupe.statuts?.[id] ?? acteur(id)?.system.statut ?? "compagnon"])),
      plans: r.plansPartants, region: ab?.system.region ?? ctx.etat.groupe.region, abri: "", depuis: jourCtx(ctx), entente: L.ententeDe(ctx.etat) };
    if (r.abri === "partants" && ab) {
      c.abri = ab.id;
      await ab.update({ system: { stocks: r.stocksPartants } });
      ctx.etat.groupe = { ...ctx.etat.groupe, abri: "", porte: L.ajouterStocks(ctx.etat.groupe.porte ?? {}, r.stocksRestants) };
    } else {
      c.stocks = r.stocksPartants;
      if (ab) await ab.update({ system: { stocks: r.stocksRestants } }); else ctx.etat.groupe.porte = r.stocksRestants;
    }
    ctx.etat.groupe = { ...ctx.etat.groupe, membres: r.restants, ...(r.partants.includes(ctx.etat.groupe.chef) ? { chef: "" } : {}) };
    for (const id of r.partants) { const a = acteur(id); if (a) await a.update({ system: { statut: "pnj", tache: "" } }); }
    ctx.etat.communautes = [...(ctx.etat.communautes ?? []), c].slice(-10);
    noter(ctx, tx("Journal.Separation", { nom: c.nom, noms: r.partants.map(id => acteur(id)?.name ?? id).join(", ") }));
    await terminer(ctx);
    return { communaute: structuredClone(c), restants: r.restants };
  }),
  // Fondre une communauté (séparée plus tôt) dans le groupe : membres, stocks, plans ; l'entente part de la plus basse, moins un.
  fusionner: ecriture(async ({ communauteId } = {}) => {
    const ctx = ouvrirCtx();
    const c = (ctx.etat.communautes ?? []).find(x => x.id === communauteId);
    if (!c) throw erreur("CommunauteInconnue");
    const abC = c.abri ? acteur(c.abri) : null;
    const stocksC = abC ? aPlat(abC.system).stocks : c.stocks ?? {};
    const f = L.fusionnerGroupes({ membres: ctx.etat.groupe.membres, stocks: {}, plans: ctx.etat.groupe.plans, entente: L.ententeDe(ctx.etat) }, { membres: c.membres, stocks: stocksC, plans: c.plans, entente: c.entente ?? 0 });
    let ab = abriCourant(ctx.etat);
    if (!ab && abC) { ctx.etat.groupe = { ...ctx.etat.groupe, abri: abC.id }; ab = abC; }
    else if (ab && abC && abC.id !== ab.id) await abC.update({ system: { stocks: Object.fromEntries(Object.keys(stocksC).map(k => [k, 0])) } });
    if (ab && abC?.id !== ab.id) await ab.update({ system: { stocks: L.ajouterStocks(aPlat(ab.system).stocks, stocksC) } });
    else if (!ab) ctx.etat.groupe.porte = L.ajouterStocks(ctx.etat.groupe.porte ?? {}, stocksC);
    for (const id of c.membres) {
      const a = acteur(id);
      if (!a) continue;
      ctx.etat = L.ajouterMembre(ctx.etat, id, c.statuts?.[id] ?? "compagnon");
      await a.update({ system: { statut: c.statuts?.[id] ?? "compagnon" } });
    }
    ctx.etat.groupe = { ...ctx.etat.groupe, plans: f.plans, entente: f.entente };
    ctx.etat.communautes = (ctx.etat.communautes ?? []).filter(x => x.id !== communauteId);
    noter(ctx, tx("Journal.Fusion", { nom: c.nom }));
    await terminer(ctx);
    return { membres: [...ctx.etat.groupe.membres], plans: [...f.plans], entente: f.entente };
  }),
  // Un objet que le cyclone a laissé, une coïncidence : chacun le lit selon sa foi (esprit.mjs, lireUnSigne). Rien de magique.
  signe: ecriture(async () => {
    const ctx = ouvrirCtx();
    const lectures = [];
    for (const a of membresPresents(ctx)) {
      const r = L.lireUnSigne(systemeLogique(a, ctx.monde));
      if (r.lecture === "signe") { await a.update({ system: { moral: r.system.moral } }); noter(ctx, tx("Journal.Signe", { nom: a.name })); }
      lectures.push({ acteurId: a.id, nom: a.name, lecture: r.lecture });
    }
    await terminer(ctx);
    return { lectures };
  }),

  // Le MJ demande un test à un joueur : carte au chat avec un bouton « Lancer » pour le propriétaire, et un tintement chez lui.
  demanderTest: ecritureMJ(async ({ acteurId, competence, difficulte = "normale", titre = "" } = {}) => {
    const a = acteur(acteurId);
    if (!a || a.type !== "survivant") throw erreur("ActeurInconnu");
    if (!COMPETENCES.includes(competence)) throw clair(t("LAKOUR_SURVIE.Erreurs.CompetenceInconnue", { competence }));
    const diff = DIFFICULTES[difficulte] ? difficulte : "normale";
    // La demande reste ouverte jusqu'au test du joueur (demandes.mjs) : elle fixe la difficulté et fait compter ce test-là.
    await chat(carteDemandeTest({ acteurId: a.id, nom: a.name, competence, difficulte: diff, titre }), { flags: { demande: { acteurId: a.id, competence, difficulte: diff, titre: String(titre ?? "") } } });
    const joueurs = game.users.filter(u => !u.isGM && proprietaireDe(a, u.id)).map(u => u.id);
    emettre({ type: "signal", texte: t("LAKOUR_SURVIE.Signal.Test", { nom: a.name }) }, joueurs);
    return { joueurs };
  }),

  // Les notes SECRÈTES du MJ sur un abri : dans le monde scellé (monde.notesAbris), jamais sur l'acteur (que les joueurs observent).
  // Les notes de la fiche (system.notes) sont lues par les joueurs.
  notesAbri: abriId => (estMJActif() ? String(Coffre.mondeEnMemoire()?.notesAbris?.[abriId] ?? "") : ""),
  noterAbri: ecriture(async ({ abriId, notes = "" } = {}) => {
    const a = acteur(abriId);
    if (!a || a.type !== "abri") throw erreur("ActeurInconnu");
    const ctx = ouvrirCtx();
    ctx.monde.notesAbris = { ...(ctx.monde.notesAbris ?? {}), [a.id]: String(notes ?? "").slice(0, 50000) };
    await terminer(ctx);
    return { abriId: a.id };
  }),
  // Les abris d'avant les notes secrètes : leurs notes (écrites par le MJ) partent au monde scellé, la fiche repart vide.
  migrerNotesAbris: ecriture(async () => {
    const ctx = ouvrirCtx();
    let n = 0;
    for (const a of (game.actors?.contents ?? []).filter(x => x.type === "abri")) n += await secretiserNotesAbri(ctx, a);
    if (n) await terminer(ctx);
    return { abris: n };
  }),

  // Remise à zéro (MJ IA, reinitialiser) : la mémoire du monde et sa copie dans ce navigateur.
  // Tout oublier : la mémoire du monde et sa copie dans ce navigateur, et (MJ actif, sauf reglages: false) l'état public de la
  // partie, le coffre et le clair de secours remis à leur valeur par défaut : le monde revient à « la partie n'a pas commencé ».
  async oublier({ reglages = true } = {}) {
    await Coffre.oublierMonde();
    if (reglages && estMJActif()) {
      for (const cle of ["partie", "coffre", "mondeClair"]) {
        const def = game.settings.settings.get(`${ID}.${cle}`);
        if (def) await game.settings.set(ID, cle, foundry.utils.deepClone(def.default));
      }
    }
    return true;
  }
};

// Pour les essais et l'interface : les fonctions internes utiles.
export const interne = { testDirect, forcerDirect, assignerDirect, creerSurvivantDirect, bilanVivant, quandDe, besoins, savoirsDuGroupe, versTirage, auteur, espritDuTirage, communaute };
