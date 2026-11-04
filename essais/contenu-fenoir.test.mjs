// Essais du contenu de lakour-fenoir (contrat docs/survie-contrat.md, notes docs/survie-notes-contenu.md) : documents des
// compendiums et registre conformes, références résolues, voisins symétriques, île connexe, Mafate sans route, voies
// d'autonomie tenables pour 4 personnes, niveaux cohérents, textes non vides, aucun terme interdit, création des survivants (§10).
// Chaque règle est vérifiée sur le vrai contenu, puis sur des copies cassées (mutations).   Lancer : npm run essais
import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import {
  BUDGET, FETES_DE_FENOIR, FETES_MOTEUR, TYPE_PACK, bilanVoie, fabriquer, termesInterdits, verifierDocuments, verifierDonnees, verifierVoie
} from "../outils/fabriquer-fenoir.mjs";
import { verifierJetons } from "../outils/fabriquer-jetons-fenoir.mjs";
import { DOCUMENTS, donnees } from "../modules/lakour-fenoir/contenu/index.mjs";
import { COMPETENCES, MODULE, sansBalises } from "../modules/lakour-fenoir/contenu/aides.mjs";
import { FETES_FENOIR, declinaisons, fetesDuJour } from "../modules/lakour-fenoir/scripts/fetes.js";
import { IDS_FETES, fetesDuJour as calendrierDuSocle, normaliserDeclinaison } from "../modules/lakour-mj-ia/scripts/fetes-logique.js";
import { BRAS } from "../modules/lakour-fenoir/contenu/installations.mjs";
import { verifierModuleDeContenu } from "../modules/lakour-mj-ia/outils/contrat-contenu.mjs";

const RACINE = new URL("../modules/lakour-fenoir/", import.meta.url);
const docs = fabriquer();
const D = donnees();
const copie = () => structuredClone(D);
const attendre = (erreurs, motif) => assert.ok(erreurs.some(e => motif.test(e)), `${motif} attendu, obtenu : ${erreurs.join(" ; ") || "aucune erreur"}`);
const par = (famille, cle) => D[famille].find(o => o.cle === cle);

test("le contenu fabriqué est conforme au contrat (documents et registre)", () => {
  assert.deepEqual(verifierDocuments(docs), []);
  assert.deepEqual(verifierDonnees(D), []);
});

test("le registre passe aussi la vérification du système lakour-survie (s'il est déjà écrit)", async t => {
  const chemin = new URL("../systems/lakour-survie/logique/contenu.mjs", import.meta.url);
  if (!existsSync(chemin)) return t.skip("logique du système absente");
  const { verifierContenu } = await import(chemin);
  assert.deepEqual(verifierContenu(D), []);
});

test("les volumes demandés : 16 régions, une cinquantaine de sites, une trentaine d'installations…", () => {
  assert.equal(D.regions.length, 16);
  assert.ok(D.sites.length >= 48 && D.sites.length <= 56, `${D.sites.length} sites`);
  assert.ok(D.installations.length >= 30, `${D.installations.length} installations`);
  assert.ok(D.savoirs.length >= 12);
  assert.ok(D.passes.length >= 16);
  assert.ok(D.equipements.length >= 30);
  assert.ok(D.factions.length >= 6 && D.factions.length <= 8);
  assert.ok(D.evenements.length >= 40);
  assert.ok(D.recettes.length >= 20);
  assert.ok(D.enfances.length >= 20);
  assert.ok(D.traits.length >= 30);
  for (const r of D.regions) assert.ok(r.sites.length >= 2 && r.sites.length <= 4, `${r.cle} : ${r.sites.length} sites`);
});

test("aucune clé dupliquée : documents, familles du registre, identifiants Foundry", () => {
  const doublon = [...DOCUMENTS, DOCUMENTS[0]];
  assert.throws(() => fabriquer(doublon), /Clé en double/);
  const d = copie();
  d.sites.push(structuredClone(d.sites[0]));
  attendre(verifierDonnees(d), /clé en double/);
  for (const famille of ["regions", "sites", "installations", "savoirs", "factions", "evenements", "passes", "equipements", "traits", "enfances"]) {
    const cles = D[famille].map(o => o.cle);
    assert.equal(new Set(cles).size, cles.length, famille);
  }
  const ids = docs.map(x => `${x.pack}:${x.doc._id}`);
  assert.equal(new Set(ids).size, ids.length);
});

test("toutes les références sont résolues (et les mutations sont refusées)", () => {
  let d = copie(); d.sites[0].region = "atlantide"; attendre(verifierDonnees(d), /région inconnue/);
  d = copie(); d.regions[0].factionsDepart.push({ faction: "inconnue", force: 1 }); attendre(verifierDonnees(d), /faction « inconnue »/);
  d = copie(); d.regions[0].dangers.push("meteorite"); attendre(verifierDonnees(d), /danger « meteorite » sans événement/);
  d = copie(); d.passes[0].savoirs.push("telepathie"); attendre(verifierDonnees(d), /savoir inconnu « telepathie »/);
  d = copie(); d.passes[0].equipement.push("sabre-laser"); attendre(verifierDonnees(d), /équipement inconnu/);
  d = copie(); d.recettes[0].produit = { equipement: "jetpack", n: 1 }; attendre(verifierDonnees(d), /produit inconnu/);
  d = copie(); d.sites[0].installationsDepart.push({ installation: "ascenseur-spatial", niveau: 1 }); attendre(verifierDonnees(d), /installation de départ inconnue/);
  d = copie(); d.installations[0].niveaux[0].requiert.installations.push({ cle: "fantome", niveau: 1 }); attendre(verifierDonnees(d), /installation requise inconnue/);
  d = copie(); d.evenements[0].effets.faction = "personne"; attendre(verifierDonnees(d), /faction « personne »/);
});

test("voisins symétriques, routes réelles nommées, île entièrement connexe", () => {
  for (const r of D.regions) for (const v of r.voisins) {
    const retour = par("regions", v.region).voisins.find(w => w.region === r.cle);
    assert.ok(retour, `${r.cle} -> ${v.region}`);
    assert.equal(retour.route, v.route);
    assert.equal(retour.km, v.km);
  }
  let d = copie();
  const sd = d.regions.find(r => r.cle === "saint-denis");
  sd.voisins[0].km += 1;
  attendre(verifierDonnees(d), /« km » différent dans l'autre sens/);
  d = copie();
  d.regions.find(r => r.cle === "saint-denis").voisins.pop();
  attendre(verifierDonnees(d), /non symétrique/);
  // Couper Mafate de tout : elle devient inatteignable.
  d = copie();
  for (const r of d.regions) r.voisins = r.voisins.filter(v => v.region !== "mafate");
  d.regions.find(r => r.cle === "mafate").voisins = [];
  attendre(verifierDonnees(d), /mafate : inatteignable/);
  // Routes connues de l'île.
  const routes = D.routes.map(r => r.route).join(" | ");
  for (const nom of ["RN1", "RN2", "RN3", "route du Littoral", "Tamarins", "Cilaos (RN5)", "Salazie", "Maïdo", "route des Laves", "col des Bœufs", "Canalisation des Orangers", "Rivière des Galets", "Taïbit", "route du Volcan"]) {
    assert.ok(routes.toLowerCase().includes(nom.toLowerCase()), `route absente : ${nom}`);
  }
});

test("Mafate n'a pas de route : sentiers à pied, solaire sur chaque case, et un îlet parmi ses sites", () => {
  const m = par("regions", "mafate");
  assert.ok(m.voisins.length >= 4);
  for (const v of m.voisins) { assert.equal(v.terrain, "sentier"); assert.equal(v.quartsVehicule, null); }
  assert.equal(m.infrastructures.electricite, null);
  assert.ok(m.sites.some(s => par("sites", s).type === "ilet"));
  const d = copie();
  const v = d.regions.find(r => r.cle === "mafate").voisins[0];
  v.terrain = "route"; v.quartsVehicule = 1;
  const r = d.regions.find(x => x.cle === v.region).voisins.find(w => w.region === "mafate");
  r.terrain = "route"; r.quartsVehicule = 1;
  attendre(verifierDonnees(d), /Mafate : une liaison n'est pas un sentier/);
});

test("géographie : repères dans la carte et à peu près à leur place (nord en haut)", () => {
  const p = cle => par("regions", cle).repere;
  assert.ok(p("saint-denis").y < p("cilaos").y && p("cilaos").y < p("saint-pierre").y, "Saint-Denis au nord, Saint-Pierre au sud");
  assert.ok(p("saint-paul").x < p("saint-denis").x && p("saint-denis").x < p("est").x, "l'Ouest à gauche, l'Est à droite");
  assert.ok(p("fournaise").x > p("cilaos").x && p("fournaise").y > p("salazie").y, "le volcan au sud-est");
  assert.ok(p("mafate").x < p("salazie").x, "Mafate à l'ouest de Salazie");
  assert.ok(par("regions", "est").climat.pluie > par("regions", "saint-paul").climat.pluie, "l'Est plus pluvieux que l'Ouest");
  assert.ok(par("regions", "saint-paul").climat.soleil > par("regions", "est").climat.soleil, "l'Ouest plus ensoleillé");
  for (const r of D.regions.filter(x => x.zone === "littoral")) assert.ok(r.altitude < 400, `${r.cle} est des Bas`);
  for (const k of ["cilaos", "salazie", "mafate", "le-tampon", "plaine-des-palmistes", "hauts-de-l-ouest", "fournaise"]) assert.ok(par("regions", k).altitude >= 800, `${k} est des Hauts`);
  assert.ok(par("regions", "saint-denis").ressources.nourriture > 10 * par("regions", "mafate").ressources.nourriture, "les villes riches, Mafate pauvre");
  assert.ok(par("regions", "saint-denis").population > par("regions", "mafate").population);
});

test("au moins un tunnel de lave aménageable dans le Sud, et tous les types de sites demandés", () => {
  const tunnels = D.sites.filter(s => s.type === "tunnel-de-lave");
  assert.ok(tunnels.some(s => s.region === "sud-sauvage"));
  for (const t of tunnels) { assert.equal(t.souterrain, 3); assert.equal(t.soleil, 0); assert.equal(t.eau, "aucune"); }
  const d = copie();
  for (const s of d.sites) if (s.type === "tunnel-de-lave") s.type = "autre";
  attendre(verifierDonnees(d), /aucun tunnel de lave/);
  for (const type of ["ilet", "gite", "case-creole", "ecole", "caserne", "commerce", "ferme", "phare", "port", "usine"]) assert.ok(D.sites.some(s => s.type === type), type);
  assert.ok(D.sites.some(s => /sucrerie|distillerie|alambic/i.test(s.nom)));
});

test("installations : niveaux cohérents, galerie en quatre niveaux, tunnel de lave sur un site qui en a un", () => {
  for (const i of D.installations) {
    assert.equal(i.niveauMax, i.niveaux.length, i.cle);
    for (const n of i.niveaux) assert.ok(n.cout.travail > 0, i.cle);
  }
  assert.equal(par("installations", "galerie-souterraine").niveauMax, 4);
  assert.equal(par("installations", "tunnel-de-lave-amenage").niveaux[0].requiert.site.souterrain, 3);
  let d = copie(); d.installations[0].niveauMax = 9; attendre(verifierDonnees(d), /niveauMax/);
  d = copie(); d.installations.find(i => i.cle === "potager").niveaux[1].effets.production.nourriture = 1; attendre(verifierDonnees(d), /produit moins de nourriture/);
  d = copie(); d.installations.find(i => i.cle === "potager").niveaux[0].effets.bras.tache = "sieste"; attendre(verifierDonnees(d), /bras invalides/);
  // Les repères chiffrés des notes.
  assert.equal(par("installations", "citerne-de-pluie").niveaux[0].effets.production.eau, 1);
  assert.equal(par("installations", "potager").niveaux[0].effets.production.nourriture, 2);
  assert.equal(par("installations", "potager").niveaux[0].effets.conditions.delai, 30);
  assert.equal(par("installations", "panneaux-solaires").niveaux[0].effets.production.energie, 2);
});

test("voie d'autonomie : sur un même site, eau, nourriture et énergie nettes ≥ 0 pour 4 personnes, toute l'année", () => {
  const tenables = D.autonomie.voies.filter(v => verifierVoie(v, D).length === 0);
  assert.ok(tenables.length >= 1);
  assert.equal(tenables.length, D.autonomie.voies.length, "toutes les voies du contenu tiennent");
  for (const v of tenables) for (const saison of ["pluies", "seche"]) {
    const b = bilanVoie(v, D, saison, 4);
    for (const r of ["eau", "nourriture", "energie"]) assert.ok(b[r] >= 0, `${v.cle} ${saison} ${r} ${b[r]}`);
  }
  // Mutation : sans citerne ni bouilleur, la ferme des Hauts a soif en saison sèche.
  const d = copie();
  const ferme = d.autonomie.voies.find(v => v.cle === "ferme-des-hauts");
  ferme.installations = ferme.installations.filter(i => !["citerne-de-pluie", "bouilleur-solaire"].includes(i.cle));
  attendre(verifierVoie(ferme, d), /eau net/);
  // Mutation : un potager sur un tunnel de lave (pas de sol) n'est pas constructible.
  attendre(verifierVoie({ cle: "absurde", site: "tunnel-du-grand-brule", installations: [{ cle: "potager", niveau: 1 }] }, D), /demande sol/);
  // La voie défensive et discrète existe aussi.
  for (const k of ["mur", "camouflage", "galerie-souterraine", "tunnel-de-lave-amenage"]) assert.ok(D.autonomie.voieDefensive.includes(k));
});

test("textes non vides partout", () => {
  for (const r of D.regions) { assert.ok(sansBalises(r.description).length > 100, r.cle); assert.ok(sansBalises(r.apres).length > 80, r.cle); }
  for (const s of D.sites) { assert.ok(sansBalises(s.description).length > 60, s.cle); assert.ok(s.atouts.length && s.defauts.length, s.cle); }
  for (const f of ["installations", "savoirs", "equipements", "passes", "factions", "recettes", "afflictions", "traits", "enfances"]) {
    for (const o of D[f]) assert.ok(sansBalises(o.description).length > 20, `${f} ${o.cle}`);
  }
  for (const e of D.evenements) assert.ok(sansBalises(e.texte).length > 20, e.cle);
  for (const x of docs.filter(d => d.pack === "guides" || d.pack === "mj")) for (const p of x.doc.pages) assert.ok(sansBalises(p.text.content), `${x.doc.name} / ${p.name}`);
  for (const x of docs.filter(d => d.pack === "tables")) for (const r of x.doc.results) assert.ok(sansBalises(r.description), x.doc.name);
});

test("aucun terme interdit (œuvres de zombies existantes), en mots entiers", () => {
  assert.deepEqual(termesInterdits(JSON.stringify(DOCUMENTS)), []);
  assert.deepEqual(termesInterdits(JSON.stringify(D)), []);
  for (const f of ["module.json", "lang/fr.json", "lang/en.json"]) assert.deepEqual(termesInterdits(readFileSync(new URL(f, RACINE), "utf8")), [], f);
  for (const t of ["un rôdeur", "The Walking Dead", "Rick", "Negan", "Alexandria", "walker", "Free League", "un zombie"]) assert.ok(termesInterdits(t).length, t);
  for (const t of ["débiter du bois", "une brique", "Patrick", "les Livides", "le Gris"]) assert.deepEqual(termesInterdits(t), [], t);
  const d = copie(); d.regions[0].description += " Un rôdeur passe."; attendre(verifierDonnees(d), /terme interdit/);
});

test("journaux : guides lisibles des joueurs, journaux du MJ cachés, une page par région, le guide de création", () => {
  const journal = cle => docs.find(x => (x.pack === "guides" || x.pack === "mj") && x.doc.flags[MODULE].cle === cle);
  for (const cle of ["guide-du-joueur", "regions-de-l-ile", "vie-au-camp", "fetes-de-fenoir"]) assert.equal(journal(cle)?.doc.ownership.default, 2, cle);
  for (const cle of ["guide-du-mj", "chronologie-de-la-crise", "factions", "reputations", "bestiaire", "jour-zero", "pourquoi-les-bas-se-vident", "one-shot-la-pharmacie-de-l-entre-deux", "campagne-l-annee-du-gris"]) {
    assert.equal(journal(cle)?.doc.ownership.default, 0, cle);
  }
  const regions = journal("regions-de-l-ile").doc.pages.map(p => p.flags[MODULE]?.cle);
  for (const r of D.regions) assert.ok(regions.includes(r.cle), r.cle);
  const guide = journal("guide-du-joueur").doc.pages.map(p => sansBalises(p.text.content)).join(" ");
  for (const mot of ["verrouill", "budget", "passion", "trait", "Forcer", "marque", "autonom"]) assert.ok(guide.toLowerCase().includes(mot.toLowerCase()), mot);
  assert.ok(journal("jour-zero").doc.pages.length >= 6, "plusieurs départs");
  // La page des joueurs ne dit pas ce que devient la région (texte « après », réservé au MJ).
  const pagesJoueurs = journal("regions-de-l-ile").doc.pages.map(p => p.text.content).join(" ");
  for (const r of D.regions) assert.ok(!pagesJoueurs.includes(sansBalises(r.apres).slice(0, 60)), r.cle);
  const mutes = docs.map(x => structuredClone(x));
  mutes.find(x => x.doc.flags[MODULE].cle === "guide-du-mj").doc.ownership.default = 2;
  attendre(verifierDocuments(mutes), /visibilité 2 au lieu de 0/);
});

test("scène « Carte de La Réunion » : 4000 × 3000, une épingle par région vers sa page, repères dans les drapeaux", () => {
  const s = docs.find(x => x.pack === "scenes" && x.doc.flags[MODULE].cle === "carte-de-la-reunion").doc;
  assert.equal(s.width, 4000); assert.equal(s.height, 3000);
  assert.equal(s.levels[0].background.src, `modules/${MODULE}/assets/cartes/reunion.webp`);
  assert.equal(s.notes.length, D.regions.length);
  for (const r of D.regions) assert.deepEqual(s.flags[MODULE].regions[r.cle], r.repere);
  const mutes = docs.map(x => structuredClone(x));
  mutes.find(x => x.pack === "scenes" && x.doc.flags[MODULE].cle === "carte-de-la-reunion").doc.notes[0].pageId = "AAAAAAAAAAAAAAAA";
  attendre(verifierDocuments(mutes), /page inconnue/);
  assert.ok(docs.filter(x => x.pack === "scenes" && x.doc.flags[MODULE].cle.startsWith("lieu-")).length >= 5, "cartes de lieux");
});

test("tables : 1dN, résultats non vides, appels avec leurs données, paliers de visibilité", () => {
  const tables = docs.filter(x => x.pack === "tables").map(x => x.doc);
  const cles = tables.map(t => t.flags[MODULE].cle);
  for (const z of ["littoral", "hauts", "cirque", "volcan", "foret"]) assert.ok(cles.includes(`rencontres-${z}`), z);
  for (const c of ["fouilles", "rumeurs-radio", "complications", "prenoms-creoles", "surnoms-creoles", "cyclones", "appels-radio", "recrues-raison", "recrues-prix", "histoire-proche", "histoire-matin", "generateur-survivant", "generateur-site", "generateur-rumeur", "imprevus-du-camp"]) {
    assert.ok(cles.includes(c), c);
  }
  assert.equal(cles.filter(c => c.startsWith("visibilite-")).length, 4);
  assert.equal(cles.filter(c => c.startsWith("demandes-")).length, D.factions.length);
  for (const t of tables.filter(x => x.flags[MODULE].appels)) for (const r of t.results) {
    const a = r.flags[MODULE].appel;
    assert.ok(a.type && Object.keys(a.recompense).length && (a.faction === null || D.factions.some(f => f.cle === a.faction)), t.name);
  }
});

test("création des survivants (§10) : enfances, traits compatibles et symétriques, prétirés dans le budget", () => {
  for (const t of D.traits) for (const c of t.incompatibles) assert.ok(par("traits", c).incompatibles.includes(t.cle), `${t.cle} / ${c}`);
  const d = copie(); d.traits[0].incompatibles.push(d.traits[5].cle); attendre(verifierDonnees(d), /non symétrique/);
  const d2 = copie(); d2.enfances[0].modificateurs = { magie: 2 }; attendre(verifierDonnees(d2), /compétence inconnue « magie »/);
  assert.ok(D.enfances.filter(e => e.origine === "ailleurs").length >= 4, "des enfances d'ailleurs");
  const pretires = docs.filter(x => x.pack === "survivants" && x.doc.flags[MODULE].pretire).map(x => x.doc);
  assert.equal(pretires.length, 6);
  for (const p of pretires) {
    const somme = COMPETENCES.reduce((s, c) => s + p.system.competences[c].niveau, 0);
    assert.ok(somme >= BUDGET[0] && somme <= BUDGET[1], `${p.name} : ${somme}`);
    assert.ok(D.enfances.some(e => e.cle === p.system.enfance), p.name);
    assert.ok(D.passes.some(x => x.cle === p.system.passe), p.name);
    for (const t of p.system.traits) assert.ok(D.traits.some(x => x.cle === t), `${p.name} : ${t}`);
    for (const [a, b] of p.system.traits.flatMap((t, i, l) => l.slice(i + 1).map(u => [t, u]))) assert.ok(!par("traits", a).incompatibles.includes(b), `${p.name} : ${a} et ${b}`);
    assert.ok(Object.keys(p.system.passions).length >= 1);
  }
  for (const n of docs.filter(x => x.pack === "survivants" && !x.doc.flags[MODULE].pretire)) {
    for (const t of n.doc.system.traits) assert.ok(D.traits.some(x => x.cle === t), `${n.doc.name} : ${t}`);
  }
  assert.ok(docs.filter(x => x.pack === "survivants").length >= 16, "6 prétirés et une dizaine de PNJ");
});

test("fêtes : chaque fête déclinée a une clé connue du socle du moteur, une seule déclinaison par fête", () => {
  assert.deepEqual(FETES_MOTEUR, IDS_FETES);
  assert.deepEqual(FETES_FENOIR.map(f => f.cle).sort(), [...FETES_DE_FENOIR].sort(), "toutes les fêtes de Fénoir, rien de plus");
  const deja = [];
  for (const d of declinaisons()) {
    assert.ok(IDS_FETES.includes(d.fete), `${d.id} : fête « ${d.fete} » inconnue du socle`);
    deja.push(normaliserDeclinaison(d, deja)); // lève si fête inconnue, doublon, décor illisible
  }
  assert.equal(deja.length, FETES_DE_FENOIR.length);
  for (const f of FETES_FENOIR) {
    assert.equal(f.moteur, f.cle, `${f.cle} : alias lu par main.js`);
    assert.equal(f.date, f.periode, `${f.cle} : alias lu par le journal`);
    assert.ok(!f.periode.includes("-"), `${f.cle} : période sans trait d'union`);
  }
  // La Toussaint : déclinée sous « halloween », avec sobriété.
  const toussaint = FETES_FENOIR.find(f => f.cle === "halloween");
  assert.match(toussaint.nom, /Toussaint/);
  assert.match(toussaint.description, /cimeti/);
  assert.match(toussaint.consigne, /sobriété|pudeur/);
});

test("fêtes au registre : image, effet public du §9, aucune date codée en dur", () => {
  assert.equal(D.fetes.length, FETES_DE_FENOIR.length);
  for (const f of D.fetes) {
    assert.equal(f.image, `modules/${MODULE}/assets/fetes/${f.cle}.jpg`);
    assert.deepEqual(f.effet, { moral: 1, cout: { nourriture: 1 }, parPersonne: true, unique: true });
    for (const k of ["date", "dates", "avant", "apres", "moteur"]) assert.ok(!(k in f), `${f.cle} : ${k}`);
    for (const k of ["nom", "description", "consigne", "periode"]) assert.ok(f[k], `${f.cle} : ${k}`);
  }
  const casse = copie();
  casse.fetes[0].cle = "toussaint";
  attendre(verifierDonnees(casse), /clé inconnue du socle/);
  const doublon = copie();
  doublon.fetes.push({ ...doublon.fetes[0] });
  attendre(verifierDonnees(doublon), /déjà (enregistrée|déclinée)/);
  const datee = copie();
  datee.fetes[0].date = "12-25";
  attendre(verifierDonnees(datee), /date codée en dur/);
});

test("fêtes à la date de JEU : le calendrier du socle, déclinaisons de Fénoir seulement", () => {
  const cles = iso => fetesDuJour(iso, calendrierDuSocle).map(f => f.cle);
  assert.deepEqual(cles("2026-12-20"), ["liberte", "noel"], "le 20 décembre passe devant Noël");
  assert.deepEqual(cles("2026-12-25"), ["noel"]);
  assert.deepEqual(cles("2026-12-31"), ["nouvel-an", "noel"]);
  assert.ok(cles("2026-12-13").includes("letchis"));
  assert.deepEqual(cles("2026-11-01"), ["halloween"], "la Toussaint");
  assert.ok(cles("2026-11-08").includes("dipavali"));
  assert.ok(cles("2027-01-22").includes("cavadee"));
  assert.ok(cles("2027-02-06").includes("nouvel-an-chinois"));
  assert.ok(cles("2027-03-28").includes("paques"));
  assert.deepEqual(cles("2027-07-14"), ["fete-nationale"]);
  assert.deepEqual(cles("2027-06-21"), ["musique"]);
  assert.deepEqual(cles("2027-02-14"), [], "Saint-Valentin et Carnaval : non déclinés par Fénoir");
  assert.deepEqual(cles("2027-08-10"), []);
  const noel = fetesDuJour("2026-12-25", calendrierDuSocle)[0];
  assert.equal(noel.coeur, true); assert.equal(noel.debut, "2026-12-01"); assert.equal(noel.fin, "2026-12-31");
  assert.deepEqual(fetesDuJour("2026-12-25"), [], "sans socle (hors Foundry) : rien");
  assert.deepEqual(fetesDuJour("n'importe quoi", calendrierDuSocle), []);
});

test("créatures au registre (famille lue par la logique du système) et bras des installations (§10.3)", async t => {
  const humains = D.bestiaire.filter(b => b.categorie === "humain").map(b => b.cle);
  assert.deepEqual(D.creatures.map(c => c.cle).sort(), D.bestiaire.filter(b => b.categorie !== "humain").map(b => b.cle).sort());
  for (const c of D.creatures) {
    const b = par("bestiaire", c.cle);
    assert.equal(c.type, b.categorie); assert.equal(c.des, b.des); assert.equal(c.resistance, b.resistance);
    assert.ok(c.poids > 0);
  }
  assert.ok(humains.length && humains.every(h => !D.creatures.some(c => c.cle === h)), "les figures humaines restent au bestiaire");
  const sansType = copie();
  sansType.creatures[0].type = "humain";
  attendre(verifierDonnees(sansType), /type « humain »/);
  // Bras : la forme du contrat, effets.bras: { tache, nombre } sur chaque niveau, celle que lit logique/abri.mjs en premier.
  for (const i of D.installations) for (const n of i.niveaux) {
    const b = BRAS[i.cle];
    if (!b) { assert.equal(n.effets.bras, null, i.cle); continue; }
    assert.deepEqual(Object.keys(n.effets.bras).sort(), ["nombre", "tache"], i.cle);
    assert.equal(n.effets.bras.tache, b.tache);
  }
  const chemin = new URL("../systems/lakour-survie/logique/actions.mjs", import.meta.url);
  if (!existsSync(chemin)) return t.skip("logique du système absente");
  const { tirerCreature } = await import(chemin);
  const littoral = D.regions.find(r => r.zone === "littoral");
  const tiree = tirerCreature(D, () => 0, { espece: "livide", region: littoral, jour: 0 });
  assert.ok(D.creatures.some(c => c.cle === tiree.cle), `créature tirée du registre (${tiree.cle})`);
  const animal = tirerCreature(D, () => 0.99, { espece: "animal", region: littoral, jour: 30 });
  assert.ok(D.creatures.some(c => c.cle === animal.cle && c.type === "animal"), `animal tiré du registre (${animal.cle})`);
});

test("module.json : compendiums, langues, dossier de compendiums", () => {
  const m = JSON.parse(readFileSync(new URL("module.json", RACINE), "utf8"));
  assert.equal(m.id, MODULE); assert.equal(m.version, "0.1.0");
  assert.deepEqual(m.compatibility, { minimum: "14", verified: "14.369" });
  assert.equal(m.relationships.systems[0].id, "lakour-survie");
  assert.deepEqual(m.esmodules, ["scripts/main.js"]);
  const packs = Object.fromEntries(m.packs.map(p => [p.name, p]));
  assert.deepEqual(Object.keys(packs).sort(), Object.keys(TYPE_PACK).sort());
  for (const [nom, type] of Object.entries(TYPE_PACK)) {
    assert.equal(packs[nom].type, type, nom);
    if (type === "Item" || type === "Actor") assert.equal(packs[nom].system, "lakour-survie", nom);
  }
  assert.equal(packs.guides.ownership.PLAYER, "OBSERVER");
  for (const n of ["mj", "tables", "scenes", "survivants", "bestiaire"]) assert.equal(packs[n].ownership.PLAYER, "NONE", n);
  assert.deepEqual(m.packFolders[0].packs.sort(), Object.keys(TYPE_PACK).sort());
  const cles = o => Object.entries(o).flatMap(([k, v]) => (typeof v === "object" ? cles(v).map(c => `${k}.${c}`) : [k])).sort();
  const fr = JSON.parse(readFileSync(new URL("lang/fr.json", RACINE), "utf8")), en = JSON.parse(readFileSync(new URL("lang/en.json", RACINE), "utf8"));
  assert.deepEqual(cles(fr), cles(en));
  for (const p of ["scripts/main.js", "scripts/fetes.js", "CREDITS.md"]) assert.ok(existsSync(new URL(p, RACINE)), p);
});

test("fichiers fabriqués à jour : src/, assets/donnees.json, jetons", () => {
  const src = new URL("src/", RACINE);
  if (!existsSync(src)) return;
  for (const pack of Object.keys(TYPE_PACK)) {
    const attendus = docs.filter(x => x.pack === pack).map(x => `${x.cle.split(":")[1]}.json`).sort();
    assert.deepEqual(readdirSync(join(src.pathname.replace(/^\/([A-Z]:)/, "$1"), pack)).sort(), attendus, pack);
  }
  const ecrit = JSON.parse(readFileSync(new URL("assets/donnees.json", RACINE), "utf8"));
  assert.deepEqual(ecrit, JSON.parse(JSON.stringify(D)), "assets/donnees.json périmé : relancer npm run fabriquer-fenoir");
  assert.deepEqual(verifierJetons(), []);
});

test("contrat commun des modules de contenu du MJ IA (sauf l'image de la carte, à produire)", () => {
  const ecarts = verifierModuleDeContenu(new URL(".", RACINE).pathname.replace(/^\/([A-Z]:)/, "$1")).filter(e => !/reunion\.webp absent/.test(e));
  assert.deepEqual(ecarts, []);
});
