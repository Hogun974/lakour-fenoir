// L'interface du système lakour-survie, hors Foundry : ce que chaque fenêtre montre (contextes du bandeau, du tableau de bord, de la
// création, des fiches, de l'atelier, de la fenêtre du MJ), les traductions (fr et en complètes, toutes les clés employées
// existent), les gabarits Handlebars (blocs équilibrés, clés traduites), le registre du contenu (formes traduites pour la
// logique, attente d'un ajout tardif), les fêtes du jour de JEU branchées au socle du moteur, l'immersion et l'ambiance.
// Rien du monde réel dans ce que voit un joueur.  Lancer : npm run essais
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { installerFoundry, FR, DONNEES, calme, commeJoueur, valeur } from "./doublures/foundry-survie.mjs";
import { charger, monde, survivantTire, SYSTEME } from "./doublures/survie-api-outils.mjs";
import * as L from "../systems/lakour-survie/logique/index.mjs";
import * as FL from "../modules/lakour-mj-ia/scripts/fetes-logique.js";

installerFoundry();
const M0 = await charger();
const EN = JSON.parse(readFileSync(join(SYSTEME, "lang/en.json"), "utf8"));
const { contexteBandeau } = await import("../systems/lakour-survie/scripts/apps/bandeau.mjs");
const { contexteTableau, carteConnue } = await import("../systems/lakour-survie/scripts/apps/tableau.mjs");
const { contexteCreation, nouvelleCreation, tirer, verrousPour } = await import("../systems/lakour-survie/scripts/apps/creation.mjs");
const { contexteSurvivant, contexteAbri, sectionsObjet } = await import("../systems/lakour-survie/scripts/apps/fiches.mjs");
const { contexteAtelier } = await import("../systems/lakour-survie/scripts/apps/atelier.mjs");
const { contexteMJ } = await import("../systems/lakour-survie/scripts/apps/mj.mjs");
const { contenuInfobulle } = await import("../systems/lakour-survie/scripts/infobulle.mjs");
const { obscuriteVoulue, meteoVoulue } = await import("../systems/lakour-survie/scripts/immersion.mjs");
const { ambianceVoulue } = await import("../systems/lakour-survie/scripts/ambiance.mjs");
const { carteTest } = await import("../systems/lakour-survie/scripts/cartes.mjs");
const { creerRegistre, normaliserContenu } = await import("../systems/lakour-survie/scripts/registre.mjs");

const cles = (o, p = "") => Object.entries(o).flatMap(([k, v]) => (v && typeof v === "object" ? cles(v, `${p}${k}.`) : [`${p}${k}`]));
const fichiers = (dossier, ext) => readdirSync(dossier, { recursive: true }).filter(f => f.endsWith(ext)).map(f => join(dossier, f));
const SOURCES = [...fichiers(join(SYSTEME, "scripts"), ".mjs"), join(SYSTEME, "lakour-survie.mjs")].map(f => readFileSync(f, "utf8")).join("\n");
const GABARITS = fichiers(join(SYSTEME, "templates"), ".hbs").map(f => [f, readFileSync(f, "utf8")]);

test("traductions : fr et en ont les mêmes clés ; chaque clé employée (code et gabarits) existe", () => {
  const fr = new Set(cles(FR)), en = new Set(cles(EN));
  assert.deepEqual([...fr].filter(k => !en.has(k)), [], "manque en anglais");
  assert.deepEqual([...en].filter(k => !fr.has(k)), [], "manque en français");
  const employees = new Set([...`${SOURCES}\n${GABARITS.map(g => g[1]).join("\n")}`.matchAll(/LAKOUR_SURVIE\.[A-Za-z0-9_.]+[A-Za-z0-9_]/g)].map(m => m[0]));
  // Une clé tronquée par une clé dynamique (« LAKOUR_SURVIE.Competences. » + cle) désigne une famille : elle doit exister comme telle.
  assert.deepEqual([...employees].filter(k => !fr.has(k) && ![...fr].some(x => x.startsWith(`${k}.`))), [], "clés employées sans traduction");
  // Les familles appelées par une clé dynamique.
  const famille = (prefixe, valeurs) => { for (const v of valeurs) assert.ok(fr.has(`LAKOUR_SURVIE.${prefixe}.${v}`), `${prefixe}.${v}`); };
  famille("Competences", L.COMPETENCES); famille("Aides", L.COMPETENCES); famille("Ressources", L.RESSOURCES); famille("Moments", L.MOMENTS);
  famille("Phases", L.CLES_PHASES); famille("Difficultes", Object.keys(L.DIFFICULTES)); famille("Statuts", L.STATUTS); famille("Taches", [...Object.keys(L.TACHES), "negociation", "aucune"]);
  famille("Saisons", L.SAISONS); famille("Zones", L.ZONES); famille("Routes", L.ETATS_ROUTE); famille("Sources", L.SOURCES_RENSEIGNEMENT); famille("Prudences", L.PRUDENCES);
  famille("Transports", L.TRANSPORTS); famille("Nature", L.NATURE); famille("Categories", L.CATEGORIES_INSTALLATION); famille("CategoriesAffliction", L.CATEGORIES_AFFLICTION);
  famille("Infestation", ["inconnue", ...L.BANDES_INFESTATION.map(b => b[1])]); famille("Pillage", ["inconnu", ...L.BANDES_PILLAGE.map(b => b[1])]);
  famille("Incapacites", [...Object.keys(L.INCAPACITES), ...new Set([...DONNEES.enfances, ...DONNEES.passes, ...DONNEES.traits].flatMap(o => o.incapacites ?? []))]);
  famille("Menaces", ["horde", "livides", "bande", "visite", "animaux", "accident"]); famille("Assaut.Issues", ["repoussee", "endommagee", "breche"]);
  famille("Assaut.Journal", ["repoussee", "endommagee", "breche"]); famille("Afflictions", ["incubation", "active", "aggravee"]); famille("EtatInstallation", [0, 1, 2, 3]);
  famille("Attitudes", L.ATTITUDES);
  for (const t of Object.keys(FR.TYPES.Item)) assert.ok(EN.TYPES.Item[t]);
});

test("gabarits : blocs Handlebars équilibrés, chaque gabarit déclaré existe", () => {
  for (const [f, h] of GABARITS) {
    const pile = [];
    for (const m of h.matchAll(/\{\{([#/])(if|each|unless|with)\b/g)) {
      if (m[1] === "#") pile.push(m[2]);
      else assert.equal(pile.pop(), m[2], `${f} : {{/${m[2]}}} mal fermé`);
    }
    assert.deepEqual(pile, [], `${f} : blocs non fermés`);
  }
  const declares = [...SOURCES.matchAll(/\$\{CHEMIN\}\/([\w-]+\.hbs)/g)].map(m => m[1]);
  for (const d of declares) assert.ok(GABARITS.some(([f]) => f.endsWith(d)), d);
});

test("system.json : types du contenu déclarés, socket, langues, compatibilité 14.370", () => {
  const sys = JSON.parse(readFileSync(join(SYSTEME, "system.json"), "utf8"));
  assert.equal(sys.id, "lakour-survie");
  assert.equal(sys.compatibility.verified, "14.370");
  assert.equal(sys.socket, true);
  const types = new Set();
  const src = fileURLToPath(new URL("../modules/lakour-fenoir/src/", import.meta.url));
  for (const d of readdirSync(src)) for (const f of readdirSync(join(src, d))) {
    const doc = JSON.parse(readFileSync(join(src, d, f), "utf8"));
    if (["Item", "Actor"].includes(doc._key?.startsWith("!items") ? "Item" : doc._key?.startsWith("!actors") ? "Actor" : "")) types.add(`${doc._key.startsWith("!items") ? "Item" : "Actor"}:${doc.type}`);
    for (const i of doc.items ?? []) types.add(`Item:${i.type}`);
  }
  for (const t of types) { const [doc, type] = t.split(":"); assert.ok(sys.documentTypes[doc][type], `type ${t} non déclaré`); }
  for (const type of ["enfance", "trait"]) assert.ok(sys.documentTypes.Item[type]);
  for (const l of sys.languages) assert.ok(readFileSync(join(SYSTEME, l.path), "utf8"));
});

test("registre : les formes du contenu traduites pour la logique ; un ajout tardif attendu (attendre)", async () => {
  const c = normaliserContenu(structuredClone(DONNEES));
  const enfance = c.enfances[0];
  assert.deepEqual(enfance.competences, enfance.modificateurs);
  const peur = c.traits.find(t => t.effets.peur);
  assert.ok(peur.effets.peur.lieux.includes(peur.effets.peur.lieu));
  const voiture = c.equipements.find(e => e.cle === "voiture");
  assert.ok(L.estVehicule(voiture) && voiture.rapide && voiture.charge === 20);
  assert.ok(c.creatures.every(x => ["livide", "animal"].includes(x.type)));
  assert.ok(c.prenomsF.length > 10 && c.prenomsM.length > 10 && c.prenomsMixtes.length >= 1, "prénoms rangés par genre");
  assert.deepEqual(c.noms, [], "tous les prénoms de Fénoir sont rangés : aucun sans genre");
  assert.ok(c.proches.length && c.raisonsRecrue.length && c.prixRecrue.length);
  assert.deepEqual(L.verifierContenu(c), []);
  // Le module a ses données après le crochet : il donne une promesse, le système l'attend.
  const r = creerRegistre();
  let resoudre;
  r.attendre(new Promise(ok => { resoudre = ok; }).then(() => r.ajouter(DONNEES)));
  assert.equal(r.vide(), true);
  const p = r.pret();
  resoudre();
  await p;
  assert.equal(r.vide(), false);
  assert.ok(Object.isFrozen(r.contenu().regions), "le contenu est gelé (contenu() sans copie)");
});

test("incapacités du contenu : interdisent leurs tâches et compétences (vocabulaire de lakour-fenoir)", () => {
  assert.equal(L.peutFaire({ incapacites: ["travaux-lourds"] }, "chantier"), false);
  assert.equal(L.peutFaire({ incapacites: ["violence"] }, "chasse"), false);
  assert.equal(L.peutFaire({ incapacites: ["violence"] }, "garde"), false);
  assert.equal(L.peutFaire({ incapacites: ["nuit"] }, "garde"), false);
  assert.equal(L.peutFaire({ incapacites: ["cultures"] }, "elevage"), false);
  assert.equal(L.peutFaire({ incapacites: ["conduite"] }, "cultures"), true);
  assert.deepEqual(L.competencesInterdites({ incapacites: ["violence"] }).sort(), ["combat", "tir"]);
});

test("fenêtres : bandeau, tableau de bord, fiches, atelier, fenêtre du MJ ; rien du réel chez le joueur", async () => {
  const M = await monde(M0);
  const a = await survivantTire(M, { userId: "u1" });
  assert.equal(contexteBandeau().demarree, false);
  await M.api.demarrer({ region: "saint-paul", membres: [a.id], graine: "GRAINE-INTERFACE-SECRETE" });
  await M.api.installer({ site: "college-hauts-saint-paul" });
  await M.api.avancer({ quarts: 6 });
  const abri = game.actors.get(M.api.etat().groupe.abri);
  // Bandeau.
  const b = await commeJoueur("u1", () => contexteBandeau());
  assert.equal(b.demarree, true);
  assert.equal(b.jour, 1);
  assert.equal(b.stocks.length, 2);
  assert.equal(b.moi.id, a.id);
  // Tableau de bord : groupe, renseignements (carte SVG), journal, propositions.
  const tg = await commeJoueur("u1", () => contexteTableau("groupe"));
  assert.equal(tg.groupe[0].id, a.id);
  assert.ok(tg.groupe[0].cases.length === Object.keys(L.TACHES).length);
  const tr = await commeJoueur("u1", () => contexteTableau("renseignements"));
  assert.ok(tr.carte.startsWith("<svg") && tr.carte.includes("Saint-Paul"));
  assert.equal(tr.renseignements.length, 16);
  assert.ok(tr.renseignements.find(r => r.cle === "saint-paul").ici);
  const tj = await commeJoueur("u1", () => contexteTableau("journal"));
  assert.ok(tj.journal.length > 1);
  // Rien du réel dans ce que voit le joueur.
  const vu = JSON.stringify([b, tg, tr, tj, await commeJoueur("u1", () => contexteMJ("monde"))]);
  assert.ok(!vu.includes("GRAINE-INTERFACE-SECRETE") && !vu.includes("journalSecret"));
  assert.equal((await commeJoueur("u1", () => contexteMJ("monde"))).monde, null);
  // Fiches.
  const fs = contexteSurvivant(a, { gm: false, proprietaire: true });
  assert.equal(fs.competences.length, 10);
  assert.ok(fs.etat.some(e => e.cle === "moral"));
  assert.ok(fs.taches.length >= 1);
  const fa = contexteAbri(abri);
  assert.equal(fa.courant, true);
  assert.ok(fa.installations.length >= 1 && fa.stocks.length === 9 && fa.bilan);
  for (const i of abri.items.contents) assert.ok(Array.isArray(sectionsObjet(i)));
  for (const type of ["equipement", "savoir"]) for (const i of a.items.contents.filter(x => x.type === type)) sectionsObjet(i);
  // Atelier : chaque recette dit si elle est possible, et sinon pourquoi.
  const at = contexteAtelier();
  assert.equal(at.recettes.length, DONNEES.recettes.length);
  assert.ok(at.recettes.every(r => r.ok || r.raisons.length));
  // Fenêtre du MJ, chez le MJ actif : le monde réel résumé.
  const mj = contexteMJ("monde");
  assert.ok(mj.actif && mj.ouvert && mj.monde.regions.length === 16 && mj.monde.graine === "GRAINE-INTERFACE-SECRETE");
  assert.ok(contexteMJ("actions").installations.length === DONNEES.installations.length);
  // Infobulle d'un jeton.
  const ib = contenuInfobulle(a);
  assert.equal(ib.nom, a.name);
  assert.ok(contenuInfobulle(abri).ligne);
});

test("création : tirer, verrouiller, choisir ; le budget ; la demande part au MJ actif", async () => {
  const M = await monde(M0);
  const etat = nouvelleCreation();
  await commeJoueur("u1", () => tirer(etat));
  const premier = structuredClone(etat.tirage);
  etat.verrous.nom = true; etat.verrous.passe = true;
  assert.deepEqual(Object.keys(verrousPour(etat)).sort(), ["nom", "passe"]);
  for (let k = 0; k < 5; k++) {
    tirer(etat);
    assert.equal(etat.tirage.nom, premier.nom);
    assert.equal(etat.tirage.passe, premier.passe);
  }
  const ctx = await commeJoueur("u1", () => contexteCreation(etat));
  assert.ok(ctx.budget.somme >= ctx.budget.min && ctx.budget.somme <= ctx.budget.max, "dans le budget");
  assert.equal(ctx.competences.length, 10);
  assert.ok(ctx.graine.length > 20, "une graine d'histoire");
  // Choisir une enfance : tout le reste est gardé, seules les valeurs dérivées sont recalculées.
  const enfance = DONNEES.enfances.find(e => e.cle !== etat.tirage.enfance).cle;
  etat.tirage.enfance = enfance;
  tirer(etat, { tout: true });
  assert.equal(etat.tirage.enfance, enfance);
  assert.equal(etat.tirage.nom, premier.nom);
  // Libellés accordés au genre : un nom féminin gardé avec un passé masculin donne « Électricienne » partout (fenêtre, fiche).
  etat.tirage.nom = "Rosemay Fontaine"; etat.tirage.genre = L.genreDuNom(M.api.contenu(), etat.tirage.nom); etat.tirage.passe = "electricien";
  tirer(etat, { tout: true });
  assert.equal(etat.tirage.genre, "f");
  assert.equal(etat.tirage.passe, "electricien");
  const ctxF = await commeJoueur("u1", () => contexteCreation(etat));
  assert.equal(ctxF.passe.nom, "Électricienne");
  assert.equal(ctxF.passes.find(o => o.valeur === "electricien").libelle, "Électricienne");
  assert.equal(ctxF.passes.find(o => o.valeur === "infirmiere-du-chu").libelle, "Infirmière du CHU");
  const creeF = await M.api.creerSurvivant({ donnees: etat.tirage, rejoindre: false });
  const acteurF = game.actors.get(creeF.acteurId);
  assert.equal(acteurF.system.genre, "f");
  assert.equal(contexteSurvivant(acteurF, { gm: true, proprietaire: false }).passe.nom, "Électricienne");
  await acteurF.delete();
  etat.tirage.nom = premier.nom; etat.tirage.genre = premier.genre; etat.tirage.passe = premier.passe; etat.tirage.enfance = enfance;
  tirer(etat, { tout: true });
  const r = commeJoueur("u1", () => M.api.creerSurvivant({ donnees: etat.tirage, rejoindre: false }));
  await calme();
  const cree = await r;
  assert.equal(game.actors.get(cree.acteurId).system.enfance, enfance);
  assert.equal(game.users.get("u1").character.id, cree.acteurId);
  // Un second survivant vivant pour le même joueur : refusé.
  const r2 = commeJoueur("u1", () => M.api.creerSurvivant({ donnees: etat.tirage }));
  const verif = assert.rejects(r2, /DejaUnSurvivant/);
  await calme();
  await verif;
});

test("cartes : un test forcé ou non forçable n'a pas de bouton Forcer ; dés colorés", () => {
  const r = L.resoudreTest({ niveau: 2, difficulte: "normale", hasard: () => 0.9 });
  assert.ok(carteTest(r, { nom: "A", competence: "tir" }).includes("survie-forcer"));
  assert.ok(!carteTest(r, { nom: "A", competence: "tir", forcable: false }).includes("survie-forcer"));
  assert.ok(!carteTest(L.forcerTest(r, () => 0.9), { nom: "A", competence: "tir" }).includes("survie-forcer"));
  assert.ok(carteTest(r, { nom: "A", competence: "tir" }).includes("survie-de succes"));
});

test("fêtes du jour de JEU : le calendrier du socle à la date de jeu ; le réglage « fete » du moteur la suit", async () => {
  const fetes = DONNEES.fetes;
  const calendrier = date => FL.fetesDuJour(date);
  assert.ok(M0.fetes.fetesDuJeu("2026-12-20", fetes, calendrier).some(f => f.cle === "liberte" && f.coeur), "le 20 décembre de JEU");
  assert.ok(M0.fetes.fetesDuJeu("2026-11-08", fetes, calendrier).some(f => f.cle === "dipavali"));
  assert.deepEqual(M0.fetes.fetesDuJeu("2026-09-03", fetes, calendrier), []);
  assert.deepEqual(M0.fetes.fetesDuJeu("2026-12-20", fetes, null).filter(f => !f.moteur), [], "sans socle et sans dates : rien");
  assert.equal(M0.fetes.fetesDuJeu("2027-07-14", [{ cle: "x", nom: "X", date: "07-14" }], null)[0].cle, "x", "un registre daté est lu aussi");
  assert.equal(M0.fetes.trouverFete("fenoir-noel", fetes).cle, "noel");
  assert.equal(M0.fetes.feteMoteurPour([{ cle: "noel", moteur: "noel" }], [{ id: "fenoir-noel", fete: "noel" }]), "noel");
  assert.equal(M0.fetes.feteMoteurPour([{ cle: "liberte", moteur: "liberte" }], [{ id: "fenoir-noel", fete: "noel" }]), "aucune");
  // Chez le MJ actif, le réglage du moteur suit la date de jeu (et revient à « auto » quand on décoche).
  const M = await monde(M0);
  game.modules.get("lakour-mj-ia").api.fetes = { calendrier, lister: () => fetes.map(f => ({ id: `fenoir-${f.cle}`, fete: f.cle })) };
  const a = await survivantTire(M);
  await game.settings.set("lakour-survie", "dateDepart", "2026-12-24");
  await M.api.demarrer({ region: "saint-denis", membres: [a.id] });
  assert.equal(valeur("lakour-mj-ia.fete"), "noel", "Noël au jour de jeu : le moteur le suit");
  assert.ok(M.api.quand().fetes.some(f => f.cle === "noel"));
  await M.api.avancer({ quarts: 4 * 40 });
  assert.equal(valeur("lakour-mj-ia.fete"), "aucune", "début février de jeu : aucune fête déclinée ce jour-là");
  await game.settings.set("lakour-survie", "fetesSuiventLeJeu", false);
  await M0.fetes.suivreFetesDuJeu(M.api.quand().date, fetes, { bascule: true });
  assert.equal(valeur("lakour-mj-ia.fete"), "auto");
  // Le jour d'une fête du calendrier de jeu : une alerte publique (la ligne du narrateur passe par l'état du jeu).
  await game.settings.set("lakour-survie", "dateDepart", "2026-12-18");
  await M.api.demarrer({ region: "saint-denis", membres: [a.id] });
  await M.api.avancer({ quarts: 8 });
  assert.ok(M.api.etat().alertes.some(x => x.type === "fete" && /liberté/.test(x.texte)));
  // Fêter la fête du jour, sans la nommer.
  await M.api.installer({ site: "villa-rue-de-paris" });
  await M.api.ajuster({ stocks: { nourriture: 5 } });
  assert.equal((await M.api.feter({})).fete, "liberte");
});

test("immersion et ambiance : lumière selon le moment, pluie et cyclone, sons", () => {
  const e = q => ({ demarree: true, horloge: { quart: q }, meteo: null });
  assert.equal(obscuriteVoulue(e(0)), 0);
  assert.ok(obscuriteVoulue(e(3)) > 0.8);
  assert.equal(obscuriteVoulue({ demarree: false }), null);
  assert.equal(meteoVoulue({ meteo: { temps: "cyclone" } }), "rainStorm");
  assert.equal(meteoVoulue({ meteo: { temps: "pluie" } }), "rain");
  assert.equal(ambianceVoulue({ ...e(3) }), "nuit");
  assert.equal(ambianceVoulue({ ...e(1), meteo: { temps: "cyclone" } }), "orage");
  assert.equal(ambianceVoulue(e(1), { tension: true }), "tension");
  assert.equal(ambianceVoulue(e(1)), "");
});

test("point d'entrée : init, setup, ready branchent modèles, fiches, réglages, registre et API, puis « lakourSurvie.pret »", async () => {
  installerFoundry();
  // Des champs de données factices (les vrais sont éprouvés par outils/valider-modeles.mjs contre Foundry v14).
  const Champ = class { constructor(...a) { this.args = a; } };
  const fields = new Proxy({}, { get: () => Champ });
  const feuilles = [];
  Object.assign(globalThis.foundry, {
    data: { fields }, abstract: { TypeDataModel: class {} },
    documents: { collections: { Actors: { registerSheet: (...a) => feuilles.push(a[2].types) }, Items: { registerSheet: (...a) => feuilles.push(a[2].types) } } }
  });
  globalThis.CONFIG = { Actor: { dataModels: {} }, Item: { dataModels: {} } };
  await import("../systems/lakour-survie/lakour-survie.mjs");
  Hooks.on("lakourSurvie.enregistrer", r => r.ajouter(DONNEES));
  Hooks.callAll("init");
  Hooks.callAll("setup");
  assert.deepEqual(Object.keys(CONFIG.Actor.dataModels).sort(), ["abri", "survivant"]);
  assert.equal(Object.keys(CONFIG.Item.dataModels).length, 8);
  assert.equal(feuilles.length, 3);
  assert.equal(typeof game.lakourSurvie.demarrer, "function");
  const pret = new Promise(r => Hooks.once("lakourSurvie.pret", r));
  Hooks.callAll("ready");
  assert.equal(await pret, game.lakourSurvie);
  assert.equal(game.lakourSurvie.contenu().regions.length, 16);
  for (const cle of ["partie", "coffre", "mondeClair", "monde", "dateDepart", "budgetCreation", "repartitionAuto", "bandeau", "signalTour", "ambiance", "effetsVisuels"]) {
    assert.ok(game.settings.settings.has(`lakour-survie.${cle}`), cle);
  }
});
