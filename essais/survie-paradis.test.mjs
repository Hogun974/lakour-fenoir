// Le paradis et son piège, et « rallumer l'île » (lot 9 du portage de Fénoir 3D, 2026-11-17 ; contrat §28), logique pure : la chaleur
// d'un lieu, le flux de Livides, la ronde et la tournée du petit jour, les agglutinés, les corps, sous terre, la haie, rallumer l'île,
// les chantiers de région, les jalons ; et ce que le temps qui passe en fait (avancer, la simulation du monde).   Lancer : npm run essais
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { L } from "./doublures/survie-outils.mjs";

const D = JSON.parse(readFileSync(new URL("../modules/lakour-fenoir/assets/donnees.json", import.meta.url), "utf8"));
const R = L.REGLES_PARADIS;
const G = "paradis-essai";
// Un hasard qui rend toujours la même valeur (0,01 : un 1 sur chaque dé ; 0,7 : un 5 ; 0,99 : un 6), ou une suite de valeurs.
const fixe = v => () => v;
const suite = l => { let i = 0; return () => l[Math.min(i++, l.length - 1)]; };
const survivant = (competences = {}, extra = {}) => L.survivantNeuf({ moral: 4, competences: Object.fromEntries(Object.entries(competences).map(([c, n]) => [c, { niveau: n, marques: 0 }])), ...extra });

function partie(site, { membres = ["a", "b"], stocks = {}, taches = {} } = {}) {
  const reg = L.siteDe(D, site).region;
  const { monde, etat } = L.demarrerPartie({ contenu: D, graine: G, region: reg, membres });
  const ins = L.installerAbri(monde, D, { site, jour: 0 });
  return {
    etat, monde: ins.monde,
    abri: { id: "abri", system: { ...ins.abri, stocks: { ...ins.abri.stocks, eau: 200, nourriture: 200, ...stocks } }, installations: ins.installations },
    survivants: membres.map(id => ({ id, nom: id.toUpperCase(), system: { ...survivant({ vigilance: 3, combat: 3 }), tache: taches[id] ?? "" } }))
  };
}

// ------------------------------------------------------------------ la chaleur d'un lieu
test("chaleur : elle monte chaque jour avec la taille du groupe (seul un huitième, à huit deux fois), plus vite dans les Hauts en saison sèche", () => {
  assert.equal(L.facteurTaille(4), 1);
  assert.equal(L.facteurTaille(1), 0.125);
  assert.ok(Math.abs(L.facteurTaille(2) - Math.pow(0.5, 1.5)) < 1e-9);
  assert.equal(L.facteurTaille(16), R.chaleur.taille.max);
  const lieu = { chaleur: 0, le: 0, agglutines: 0, leurreLe: null };
  const quatre = L.journeeDuLieu(lieu, { jour: 1, personnes: 4, region: { altitude: 100 }, saison: "pluies" });
  assert.equal(quatre.lieu.chaleur, R.chaleur.parJour);
  const hauts = L.journeeDuLieu(lieu, { jour: 1, personnes: 4, region: { altitude: 1200 }, saison: "seche" });
  assert.ok(Math.abs(hauts.lieu.chaleur - R.chaleur.parJour * R.chaleur.hautsSeche) < 1e-3);
  const bruit = L.journeeDuLieu(lieu, { jour: 1, personnes: 4, region: { altitude: 100 }, bruitFort: true });
  assert.ok(bruit.lieu.chaleur > quatre.lieu.chaleur);
  // Un jour de silence la fait redescendre ; personne au lieu : elle refroidit.
  const chaud = { ...lieu, chaleur: 3 };
  assert.equal(L.journeeDuLieu(chaud, { jour: 1, personnes: 4, silence: true }).lieu.chaleur, 3 - R.chaleur.silence);
  assert.equal(L.journeeDuLieu(chaud, { jour: 1, personnes: 0 }).lieu.chaleur, 3 - R.chaleur.refroidit);
  // La transhumance : un lieu quitté refroidit des jours où personne n'y a vécu, et ceux qui s'y agglutinaient s'en vont.
  const quitte = L.lieuRefroidi({ chaleur: 5, le: 10, agglutines: 6, leurreLe: null }, 41);
  assert.equal(quitte.chaleur, Math.max(0, 5 - R.chaleur.refroidit * 30));
  assert.equal(quitte.agglutines, 0);
  assert.equal(L.lieuRefroidi({ chaleur: 5, le: 10, agglutines: 2 }, 11).chaleur, 5, "le lendemain : rien de perdu");
});

test("chaleur : un jour de silence se voit seul (pas de tâche bruyante, pas de fouille, aucun bruit) ou se décide", () => {
  assert.equal(L.jourDeSilence({ taches: ["garde", "repos", "cuisine"], bruitMax: 0 }), true);
  assert.equal(L.jourDeSilence({ taches: ["chantier", "repos"] }), false);
  assert.equal(L.jourDeSilence({ taches: ["repos"], fouille: true }), false);
  assert.equal(L.jourDeSilence({ taches: ["repos"], bruitMax: 3 }), false);
  assert.equal(L.jourDeSilence({ taches: ["repos"], bruitInstallations: 2 }), false, "un groupe électrogène");
  assert.equal(L.jourDeSilence({ taches: ["chantier"], decide: true }), true);
  assert.equal(L.jourDeSilence({ taches: ["repos"], decide: false }), false);
});

test("chaleur : le signe (jamais le chiffre) ; la part qui attire les hordes passe le seuil où « ils viennent »", () => {
  assert.equal(L.motChaleur(0), "oublie");
  assert.equal(L.motChaleur(1), "traces");
  assert.equal(L.motChaleur(2.5), "remarques");
  assert.equal(L.motChaleur(0.3, 2), "remarques", "des agglutinés : on vous a remarqués");
  assert.equal(L.motChaleur(5), "viennent");
  assert.equal(L.motChaleur(8), "assieges");
  assert.equal(L.motChaleur(3, 6), "assieges");
  assert.equal(L.chaleurQuiAttire(1.9), 0);
  assert.equal(L.chaleurQuiAttire(5), 5 - R.chaleur.seuilRonde);
  assert.deepEqual(L.menacesDeChaleur({ chaleur: 1.5, agglutines: 0 }), { horde: 0, livides: 0, forceLivides: 0 });
  const m = L.menacesDeChaleur({ chaleur: 7, agglutines: 6 });
  assert.ok(Math.abs(m.horde - R.chaleur.menace.horde * 5) < 1e-9);
  assert.ok(Math.abs(m.livides - R.agglutines.menace * 6) < 1e-9);
  assert.equal(m.forceLivides, 1);
});

test("flux : aucun Livide n'arrive à un lieu encore oublié ; au-dessus, selon la chaleur et ce que la région a encore", () => {
  assert.equal(L.arrivants({ chaleur: 0.9, infestation: 5, hasard: fixe(0.99) }), 0);
  // chaleur 5, infestation 4 : (5 − 1) × 0,25 = 1 par jour.
  assert.equal(L.arrivants({ chaleur: 5, infestation: 4, hasard: fixe(0) }), 1);
  // Une région vidée : il reste toujours des errants (15 %).
  assert.equal(L.arrivants({ chaleur: 10, infestation: 0, hasard: fixe(0.99) }), Math.floor(9 * 0.25 * 0.15 + 0.99));
  assert.ok(L.arrivants({ chaleur: 10, infestation: 5, hasard: fixe(0.99) }) <= R.flux.max);
});

// ------------------------------------------------------------------ la ronde
test("ronde : vus à temps, on abat ceux qu'on peut et l'on recule devant les autres (ils ne frappent pas), avec un indice relevé", () => {
  // 0,7 : chaque dé fait un 5 ; vigilance 3 : trouvés ; combat 3 + 1 : quatre succès.
  const r = L.rondeDuJour({ rondiers: [{ id: "a", nom: "A", system: survivant({ vigilance: 3, combat: 3 }) }], livides: 5, hasard: fixe(0.7) });
  assert.equal(r.faite && r.engagee, true);
  assert.equal(r.abattus, 3, "trois au plus par échange");
  assert.equal(r.restants, 2);
  assert.deepEqual(r.blessures, [], "vus à temps : on recule, ils ne frappent pas");
  assert.ok(r.trouvaille >= 1 && r.trouvaille <= R.ronde.trouvaille);
});

test("ronde : surpris, le plus proche frappe quand l'échange n'en a abattu aucun ; une touche parée ne blesse pas", () => {
  // Les deux dés de la recherche et le dé du combat font 1 (surpris, rien d'abattu) ; le dé de touche et celui de morsure font 6.
  const r = L.rondeDuJour({ rondiers: [{ id: "a", nom: "A", system: survivant({ vigilance: 1, combat: 1 }) }], livides: 3, hasard: suite([0.01, 0.01, 0.01, 0.99, 0.99]) });
  assert.equal(r.abattus, 0);
  assert.equal(r.trouvaille, 0);
  assert.deepEqual(r.blessures, [{ id: "a", nom: "A", n: R.ronde.frappent, morsure: true }]);
  const pare = L.rondeDuJour({ rondiers: [{ id: "a", nom: "A", system: survivant({ vigilance: 1, combat: 1 }), parade: 5 }], livides: 3, hasard: suite([0.01, 0.01, 0.01, 0.99, 0.99]) });
  assert.deepEqual(pare.blessures, [], "le bouclier pare sur 5 ou 6");
  // Sans rondier valide (un grand blessé), pas de ronde.
  assert.equal(L.rondeDuJour({ rondiers: [{ id: "a", system: survivant({}, { blessures: 3 }) }], livides: 2 }).faite, false);
});

test("ronde : la tournée du petit jour de celui qui a veillé : s'il ne les voit pas, il reste derrière la clôture ; jamais d'indice", () => {
  const rate = L.rondeDuJour({ rondiers: [{ id: "g", system: survivant({ vigilance: 2, combat: 3 }) }], livides: 2, tournee: true, hasard: fixe(0.01) });
  assert.equal(rate.engagee, false);
  assert.equal(rate.abattus, 0);
  assert.deepEqual(rate.blessures, []);
  const vue = L.rondeDuJour({ rondiers: [{ id: "g", system: survivant({ vigilance: 3, combat: 3 }) }], livides: 2, tournee: true, hasard: fixe(0.7) });
  assert.equal(vue.engagee, true);
  assert.equal(vue.abattus, 2);
  assert.equal(vue.trouvaille, 0);
});

test("journée du lieu : la ronde abat et fait baisser la chaleur ; sans ronde, au-dessus du seuil, quatre sur dix de ceux qui viennent restent", () => {
  const lieu = { chaleur: 4, le: 0, agglutines: 3, leurreLe: null };
  const ronde = { faite: true, engagee: true, abattus: 4, restants: 1, livides: 5 };
  const j = L.journeeDuLieu(lieu, { jour: 1, personnes: 4, ronde, arrives: 2 });
  assert.equal(j.lieu.agglutines, 1);
  assert.ok(Math.abs(j.lieu.chaleur - (4 + R.chaleur.parJour - 4 * R.chaleur.parAbattu - R.chaleur.parRonde + R.agglutines.chaleur * 1)) < 1e-6);
  const sans = L.journeeDuLieu({ ...lieu, agglutines: 0 }, { jour: 1, personnes: 4, arrives: 5 });
  assert.equal(sans.manquee, true);
  assert.equal(sans.agglutines, 2, "4 sur 10 de 5 arrivants");
  // La tournée qui n'a rien vu compte comme une ronde manquée.
  const tournee = L.journeeDuLieu({ ...lieu, agglutines: 0 }, { jour: 1, personnes: 4, arrives: 5, ronde: { faite: true, engagee: false, abattus: 0, restants: 5 } });
  assert.equal(tournee.manquee, true);
  // Sous le seuil, ceux qui passent repartent ; chaque jour, quelques agglutinés s'en vont d'eux-mêmes ; au plus huit.
  assert.equal(L.journeeDuLieu({ chaleur: 1, le: 0, agglutines: 0 }, { jour: 1, personnes: 4, arrives: 3 }).lieu.agglutines, 0);
  assert.equal(L.journeeDuLieu({ chaleur: 1, le: 0, agglutines: 5 }, { jour: 1, personnes: 4 }).lieu.agglutines, 4);
  assert.equal(L.journeeDuLieu({ chaleur: 9, le: 0, agglutines: 8 }, { jour: 1, personnes: 4, arrives: 6 }).lieu.agglutines, R.agglutines.max);
});

test("camp leurre : la chaleur baisse de 2 (moitié si un autre a été fait dans la semaine, ou si l'on a été vu) ; les agglutinés le suivent", () => {
  const a = L.campLeurre({ chaleur: 5, agglutines: 4, leurreLe: null }, { jour: 10 });
  assert.equal(a.lieu.chaleur, 3);
  assert.equal(a.lieu.agglutines, 1);
  const b = L.campLeurre(a.lieu, { jour: 12 });
  assert.equal(b.effet, 1);
  assert.equal(L.campLeurre({ chaleur: 5, agglutines: 0, leurreLe: null }, { jour: 10, reussi: false }).effet, 1);
});

// ------------------------------------------------------------------ les corps
test("corps : frais quinze jours dans les Bas, quarante dans les Hauts (comptés moitié) ; enterrer 3 par quart et par bras, brûler 10 avec du bois", () => {
  let c = L.ajouterCorps([], { jour: 10, n: 4 });
  c = L.ajouterCorps(c, { jour: 10, n: 2 });
  c = L.ajouterCorps(c, { jour: 30, n: 3 });
  assert.deepEqual(c, [{ jour: 10, n: 6 }, { jour: 30, n: 3 }]);
  assert.equal(L.totalCorps(c), 9);
  assert.equal(L.corpsFrais(c, { jour: 30, altitude: 100 }), 3, "ceux du jour 10 ne sentent plus dans les Bas");
  assert.equal(L.corpsFrais(c, { jour: 30, altitude: 1200 }), 4.5, "dans les Hauts, tous, comptés moitié");
  const e = L.traiterCorps(c, { action: "enterrer", quarts: 1, bras: 2 });
  assert.equal(e.traites, 6);
  assert.equal(e.fumee, false);
  assert.deepEqual(e.corps, [{ jour: 10, n: 3 }], "les plus frais d'abord");
  const b = L.traiterCorps(c, { action: "bruler", quarts: 1, bras: 1, bois: 1 });
  assert.equal(b.traites, 5, "un bois brûle cinq corps");
  assert.equal(b.bois, 1);
  assert.equal(b.fumee, true);
  assert.equal(L.fumeeDuJour({ fumeeLe: 7 }, 7), R.corps.fumee);
  assert.equal(L.fumeeDuJour({ fumeeLe: 7 }, 8), 0);
  assert.deepEqual(L.corpsOublies([{ jour: 1, n: 2 }, { jour: 100, n: 1 }], 120), [{ jour: 100, n: 1 }]);
});

test("corps : à l'abri, ils sentent pour les bêtes (pas pour les Livides), salissent l'abri, et le bûcher se voit", () => {
  const d = partie("case-de-bellemene");
  const sans = L.bilanAbri(d.abri.system, d.abri.installations, D, { jour: 5, personnes: 2 });
  const avec = L.bilanAbri({ ...d.abri.system, corps: [{ jour: 5, n: 3 }] }, d.abri.installations, D, { jour: 5, personnes: 2 });
  assert.equal(avec.odeur, sans.odeur, "les Livides ignorent l'odeur d'un corps");
  assert.equal(avec.odeurBetes, Math.min(4, sans.odeurBetes + 1));
  assert.equal(avec.corps, 3);
  assert.equal(avec.corpsFrais, 3);
  const bucher = L.bilanAbri({ ...d.abri.system, fumeeLe: 5 }, d.abri.installations, D, { jour: 5, personnes: 2 });
  assert.equal(bucher.visibilite, Math.min(10, sans.visibilite + R.corps.fumee));
  const j0 = L.journeeAbri(d.abri.system, d.abri.installations, D, { jour: 5, personnes: 2 });
  const j1 = L.journeeAbri({ ...d.abri.system, corps: [{ jour: 5, n: 4 }] }, d.abri.installations, D, { jour: 5, personnes: 2 });
  assert.ok(Math.abs(j1.abri.souillure - j0.abri.souillure - R.corps.souillure * 4) < 1e-6);
});

// ------------------------------------------------------------------ sous terre
test("sous terre : selon le site (tunnel de lave, galerie), un tunnel aménagé, une galerie au refuge complet, ou ce que dit le MJ", () => {
  assert.equal(L.vitSousTerre({}, L.siteDe(D, "tunnel-du-grand-brule"), []), true);
  assert.equal(L.vitSousTerre({}, L.siteDe(D, "case-de-bellemene"), []), false);
  assert.equal(L.vitSousTerre({}, {}, [{ cle: "galerie-souterraine", niveau: 3 }]), false);
  assert.equal(L.vitSousTerre({}, {}, [{ cle: "galerie-souterraine", niveau: 4 }]), true);
  assert.equal(L.vitSousTerre({}, {}, [{ cle: "tunnel-de-lave-amenage", niveau: 1 }]), true);
  assert.equal(L.vitSousTerre({ sousTerre: false }, L.siteDe(D, "tunnel-du-grand-brule"), []), false);
  assert.equal(L.vitSousTerre({ sousTerre: true }, {}, []), true);
});

test("sous terre : les jours sans soleil (−1 au plafond après 7, −2 après 21), remis à zéro par un jour dehors ou un puits de jour ; l'air", () => {
  let s = survivant();
  for (let i = 0; i < 7; i++) s = L.journeeSousTerre(s, { sousTerre: true, dehors: false });
  assert.equal(L.sousTerreDe(s).jours, 7);
  assert.equal(L.malusSousTerre(s), 1);
  for (let i = 0; i < 14; i++) s = L.journeeSousTerre(s, { sousTerre: true });
  assert.equal(L.malusSousTerre(s), 2);
  assert.equal(L.sousTerreDe(L.journeeSousTerre(s, { sousTerre: true, dehors: true })).jours, 0);
  assert.equal(L.sousTerreDe(L.journeeSousTerre(s, { sousTerre: true, puitsJour: true })).jours, 0);
  assert.equal(L.sousTerreDe(L.journeeSousTerre(s, { sousTerre: false })).jours, 0);
  assert.equal(L.journeeSousTerre(survivant(), { sousTerre: false }).sousTerre, undefined, "jamais sous terre : rien d'écrit");
  assert.equal(L.airSousTerre({ sousTerre: true, personnes: 3, capacite: 6 }), "bon");
  assert.equal(L.airSousTerre({ sousTerre: true, personnes: 5, capacite: 6 }), "lourd");
  assert.equal(L.airSousTerre({ sousTerre: true, personnes: 7, capacite: 6 }), "vicie");
  assert.equal(L.airSousTerre({ sousTerre: true, personnes: 7, capacite: 6, puitsAir: true }), "lourd");
  assert.equal(L.airSousTerre({ sousTerre: false, personnes: 9, capacite: 2 }), "bon");
  assert.deepEqual([L.fatigueDeLAir("bon"), L.fatigueDeLAir("lourd"), L.fatigueDeLAir("vicie")], [0, 1, 2]);
});

test("sous terre : le puits d'air et de jour (installation du contenu) donne l'air, puis le jour, au prix de la discrétion", () => {
  const d = partie("tunnel-du-grand-brule");
  const avant = L.bilanAbri(d.abri.system, d.abri.installations, D, { jour: 5, personnes: 2 });
  const p1 = L.bilanAbri(d.abri.system, [...d.abri.installations, L.instanceInstallation("puits-de-jour", 1)], D, { jour: 5, personnes: 2 });
  const p2 = L.bilanAbri(d.abri.system, [...d.abri.installations, L.instanceInstallation("puits-de-jour", 2)], D, { jour: 5, personnes: 2 });
  assert.deepEqual(L.puitsDe(avant), { air: false, jour: false });
  assert.deepEqual(L.puitsDe(p1), { air: true, jour: false });
  assert.deepEqual(L.puitsDe(p2), { air: true, jour: true });
  assert.equal(p1.discretion, avant.discretion - 1);
  assert.equal(p2.discretion, avant.discretion - 1, "le puits de jour laisse sortir la lueur");
  assert.equal(L.niveauDe(L.installationDe(D, "puits-de-jour"), 2).effets.visibilite, 1);
});

// ------------------------------------------------------------------ la haie
test("haie : sœurs lontan du camouflage ; elle pousse (le filao en un mois, le bambou en deux) ; au cyclone, le bambou plie, le filao casse", () => {
  const bambou = L.installationDe(D, "haie-de-bambous"), filao = L.installationDe(D, "rideau-de-filaos");
  assert.equal(L.roleDe(bambou), "camouflage");
  assert.equal(L.roleDe(filao), "camouflage");
  assert.equal(bambou.arbre, "lontan");
  assert.equal(L.facteurPousse({ pousse: 60 }, 0, 30), 0.5);
  assert.equal(L.facteurPousse({ pousse: 60 }, 0, 90), 1);
  assert.equal(L.facteurPousse({}, 0, 0), 1);
  const d = partie("case-de-bellemene");
  const haie = [...d.abri.installations, { ...L.instanceInstallation("haie-de-bambous", 1), termineLe: 0 }];
  const jeune = L.bilanAbri(d.abri.system, haie, D, { jour: 1, personnes: 2 });
  const grande = L.bilanAbri(d.abri.system, haie, D, { jour: 60, personnes: 2 });
  assert.ok(grande.discretion > jeune.discretion, "elle cache quand elle a poussé");
  const avant = [{ cle: "haie-de-bambous", niveau: 1, etat: 0 }, { cle: "rideau-de-filaos", niveau: 1, etat: 0 }, { cle: "potager", niveau: 1, etat: 0 }];
  const apres = [{ cle: "haie-de-bambous", niveau: 1, etat: 2 }, { cle: "rideau-de-filaos", niveau: 1, etat: 0 }, { cle: "potager", niveau: 1, etat: 1 }];
  const r = L.haiesAuCyclone(avant, apres, D);
  assert.deepEqual(r.installations.map(i => i.etat), [0, 1, 1]);
  assert.deepEqual(r.pliees, ["haie-de-bambous"]);
  assert.deepEqual(r.cassees, ["rideau-de-filaos"]);
});

// ------------------------------------------------------------------ la tâche « ronde »
test("tâche « ronde » : vigilance ; sur demande (ni les besoins ni la répartition ni la grille par défaut ne la donnent) ; refusée à qui refuse la violence", () => {
  assert.equal(L.TACHES.ronde, "vigilance");
  assert.ok(L.TACHES_GRILLE.includes("ronde"));
  const membres = ["a", "b", "c"].map(id => ({ id, system: survivant({ vigilance: 4, combat: 4 }) }));
  const besoins = L.besoinsDuGroupe(membres, null, D, {});
  assert.equal(besoins.taches.ronde, undefined);
  assert.ok(!Object.values(L.repartir(membres, besoins, D)).includes("ronde"));
  assert.equal(L.grilleParDefaut(membres[0].system, "garde").ronde, 0);
  assert.equal(L.travailDisponible({}).ronde, true);
  assert.equal(L.travailDisponible({ abri: false }).ronde, false);
  assert.equal(L.peutFaire({ incapacites: ["violence"] }, "ronde"), false);
  assert.equal(L.assigner(survivant(), "ronde").ok, true);
});

// ------------------------------------------------------------------ avancer
test("avancer : la chaleur monte jour après jour (secret) ; le signe s'écrit au journal quand il change ; la tournée du petit jour", () => {
  const d = partie("case-de-bellemene", { membres: ["a", "b", "c", "d"], taches: { a: "garde", b: "chantier", c: "chasse", d: "fouille" } });
  const r = L.avancer({ ...d, contenu: D, quarts: 4 * 60 });
  const lieu = L.lieuDe(r.monde, d.abri.system.site);
  assert.ok(lieu.chaleur > 1, `la chaleur a monté (${lieu.chaleur})`);
  assert.ok(lieu.chaleur < 3.5, `la tournée de la garde la tient (${lieu.chaleur})`);
  assert.ok(r.etat.journal.some(e => e.cle === "chaleur-traces"), "le signe au journal");
  assert.ok(["traces", "remarques"].includes(r.acteurs.abri.system.signeChaleur));
  assert.ok(!JSON.stringify(r.etat).includes("\"chaleur\":"), "le chiffre ne va jamais dans l'état public");
  // Le premier abri : un jalon.
  assert.ok(L.jalonsDe(r.etat).some(j => j.cle === "premier-abri"));
  assert.ok(r.paradis.jalons.some(j => j.cle === "premier-abri"), "rendu à l'appelant (le journal public en garde les 200 dernières entrées)");
});

test("avancer : celui qui a la ronde abat ceux qui viennent (corps à l'abri, jour de la ronde) ; sans personne, ils s'agglutinent", () => {
  const base = partie("case-de-bellemene", { membres: ["a", "b"], taches: { a: "ronde", b: "repos" } });
  const monde = L.avecLieu(base.monde, base.abri.system.site, { chaleur: 6, le: 0, agglutines: 3 });
  const r = L.avancer({ ...base, monde, contenu: D, quarts: 4 * 5 });
  const s = r.acteurs.abri.system;
  assert.equal(s.rondeLe, 5);
  assert.ok(L.totalCorps(L.corpsDe(s)) > 0, "des corps à l'abri");
  assert.ok(r.paradis.rondes.length >= 1);
  assert.ok(L.lieuDe(r.monde, base.abri.system.site).agglutines < 3);
  const sans = partie("case-de-bellemene", { membres: ["a", "b"], taches: { a: "chantier", b: "repos" } });
  const r2 = L.avancer({ ...sans, monde: L.avecLieu(sans.monde, sans.abri.system.site, { chaleur: 9, le: 0, agglutines: 0 }), contenu: D, quarts: 4 * 5,
    options: { tournee: false } });
  assert.ok(L.lieuDe(r2.monde, sans.abri.system.site).agglutines > 0, "ils s'agglutinent");
  assert.ok(r2.acteurs.abri.system.rondesManquees > 0);
  assert.ok(r2.etat.journal.some(e => e.cle === "agglutines"));
});

test("avancer : un jour de silence décidé fait redescendre la chaleur ; partir la laisse refroidir", () => {
  const d = partie("case-de-bellemene", { membres: ["a", "b", "c", "d"], taches: { a: "chantier" } });
  const monde = L.avecLieu(d.monde, d.abri.system.site, { chaleur: 4, le: 0, agglutines: 0 });
  const bruyant = L.avancer({ ...d, monde, contenu: D, quarts: 4, options: { silence: false, tournee: false } });
  const calme = L.avancer({ ...d, monde, contenu: D, quarts: 4, options: { silence: true, tournee: false } });
  assert.ok(L.lieuDe(calme.monde, d.abri.system.site).chaleur < 4);
  assert.ok(L.lieuDe(bruyant.monde, d.abri.system.site).chaleur > L.lieuDe(calme.monde, d.abri.system.site).chaleur);
});

test("avancer : sous terre, les jours sans soleil se comptent pour qui ne sort pas, et baissent le plafond du moral ; l'air lourd fatigue", () => {
  const d = partie("tunnel-du-grand-brule", { membres: ["a", "b", "c", "d", "e"], taches: { a: "cuisine", b: "chasse", c: "repos", d: "repos", e: "repos" } });
  const r = L.avancer({ ...d, contenu: D, quarts: 4 * 8, options: { tournee: false } });
  const sys = id => r.acteurs.survivants.find(x => x.id === id)?.system ?? d.survivants.find(x => x.id === id).system;
  assert.equal(L.sousTerreDe(sys("a")).jours, 8);
  assert.equal(L.sousTerreDe(sys("b")).jours, 0, "la chasse fait sortir");
  assert.ok(r.etat.journal.some(e => e.cle === "sous-terre-palier-1"));
  assert.equal(r.acteurs.abri.system.air, "lourd", "cinq dans un tunnel de six places");
  assert.ok(r.etat.journal.some(e => e.cle === "air-lourd"));
});

// ------------------------------------------------------------------ rallumer l'île
test("rallumer : les conditions (un abri tenu un mois, les lieux gardés nettoyés, plus d'infestation dense, la lumière)", () => {
  const abri = { site: "case-de-bellemene", region: "saint-paul", installeLe: 0 };
  const sites = L.regionDe(D, "saint-paul").sites.filter(s => s !== abri.site);
  let etat = { nettoyes: [] };
  let c = L.conditionsReprise(etat, D, "saint-paul", { jour: 10, abri, infestation: 1, lumiereAbri: true });
  assert.deepEqual(c.manque, ["tenu", "nettoyes"]);
  assert.equal(c.lieux.length, sites.length, "les sites de la région, sauf l'abri");
  etat = { nettoyes: sites.map(site => ({ region: "saint-paul", site, jour: 20, tues: 3 })) };
  c = L.conditionsReprise(etat, D, "saint-paul", { jour: 40, abri, infestation: 1, lumiereAbri: true });
  assert.equal(c.toutes, true);
  assert.deepEqual(L.conditionsReprise(etat, D, "saint-paul", { jour: 40, abri, infestation: 3, lumiereAbri: true }).manque, ["infestation"]);
  assert.deepEqual(L.conditionsReprise(etat, D, "saint-paul", { jour: 40, abri, infestation: 1, lumiereAbri: false }).manque, ["lumiere"]);
  assert.deepEqual(L.conditionsReprise(etat, D, "saint-paul", { jour: 200, abri, infestation: 1, lumiereAbri: true }).manque, ["nettoyes"], "trois mois après, il faut nettoyer de nouveau");
  // Une communauté séparée tient aussi une région (§14) ; sa lumière, c'est le MJ qui la dit.
  const com = { communautes: [{ id: "k1", region: "cilaos", abri: "x", site: "thermes-de-cilaos", depuis: 0, lumiere: true }], nettoyes: L.regionDe(D, "cilaos").sites.map(site => ({ region: "cilaos", site, jour: 30, tues: 1 })) };
  assert.equal(L.conditionsReprise(com, D, "cilaos", { jour: 40, infestation: 0.5 }).toutes, true);
  assert.equal(L.lumiereDeLAbri({ production: { energie: 2 } }), true);
  assert.equal(L.lumiereDeLAbri({ production: {}, reseauElectrique: false }), false);
});

test("rallumer : la région se rallume, puis s'éteint au bout de dix jours d'abandon ; les jalons de l'île", () => {
  const toutes = { region: "saint-paul", tenue: { par: "groupe" }, lumiere: true, toutes: true };
  let r = L.journeeDeLIle({}, D, { jour: 50, conditions: { "saint-paul": toutes } });
  assert.equal(L.etatRegion(r.etat, "saint-paul"), "rallumee");
  assert.equal(r.faits[0].cle, "region-rallumee");
  assert.deepEqual(L.regionsRallumees(r.etat), ["saint-paul"]);
  let e = r.etat;
  for (let j = 51; j <= 60; j++) e = L.journeeDeLIle(e, D, { jour: j, conditions: {} }).etat;
  assert.equal(L.etatRegion(e, "saint-paul"), "rallumee", "neuf jours d'ombre : encore allumée");
  r = L.journeeDeLIle(e, D, { jour: 61, conditions: {} });
  assert.equal(L.etatRegion(r.etat, "saint-paul"), "eteinte");
  assert.equal(r.faits[0].cle, "region-eteinte");
  // Les jalons : une fois chacun.
  const j = L.jalonsDuJour({}, { jour: 3, abri: true, rallumees: 1, regions: 16 });
  assert.deepEqual(j.map(x => x.cle), ["premier-abri", "premiere-region"]);
  assert.deepEqual(L.jalonsDuJour({ jalons: j }, { jour: 4, abri: true, rallumees: 8, regions: 16 }).map(x => x.cle), ["moitie-de-l-ile"]);
  assert.deepEqual(L.jalonsDuJour({}, { jour: 148, saisonVeille: "pluies", saison: "seche", pluiesVecues: true }).map(x => x.cle), ["premiere-saison-des-pluies"]);
});

test("rallumer : le monde (une région rallumée se nettoie, plus de horde n'y naît) ; les menaces (errants moitié moins, bandes qui voient la lumière)", () => {
  const { monde } = L.demarrerPartie({ contenu: D, graine: G, region: "saint-denis", membres: ["a"] });
  let m = monde, avec = monde, nees = 0, neesAvec = 0;
  for (let j = 1; j <= 40; j++) {
    const s = L.simulerJour(m, D, L.hasardDuJour(G, j), j, {});
    const t = L.simulerJour(avec, D, L.hasardDuJour(G, j), j, { region: "", rallumees: ["saint-denis"] });
    nees += s.faits.filter(f => f.cle === "horde-nait" && f.region === "saint-denis").length;
    neesAvec += t.faits.filter(f => f.cle === "horde-nait" && f.region === "saint-denis").length;
    m = s.monde; avec = t.monde;
  }
  assert.ok(m.regions["saint-denis"].infestation > R.rallumer.effets.plafond);
  assert.ok(avec.regions["saint-denis"].infestation <= R.rallumer.effets.plafond);
  assert.ok(nees > 0, "sans lumière, Saint-Denis fait naître des hordes");
  assert.equal(neesAvec, 0, "rallumée, aucune");
  // Les menaces : mêmes tirages quand rien n'est rallumé (le hasard rejoué).
  const base = { region: "saint-denis", jour: 30, visibilite: 3 };
  assert.deepEqual(L.tirerMenaces(m, D, L.creerHasard("x"), base), L.tirerMenaces(m, D, L.creerHasard("x"), { ...base, chaleur: 0, agglutines: 0, rallumee: false, rallumees: 0 }));
  // Une bande plus forte quand l'île se rallume (+1 par quatre régions).
  const bande = { ...m, regions: { ...m.regions, "saint-denis": { ...m.regions["saint-denis"], factions: { "sans-lune": 3 }, infestation: 0 } } };
  let vues = 0, vuesLumiere = 0;
  for (let i = 0; i < 400; i++) {
    vues += L.tirerMenaces(bande, D, L.creerHasard(`b${i}`), base).filter(x => x.type === "bande").length;
    vuesLumiere += L.tirerMenaces(bande, D, L.creerHasard(`b${i}`), { ...base, rallumee: true, rallumees: 4 }).filter(x => x.type === "bande").length;
  }
  assert.ok(vuesLumiere > vues, `la lumière se voit (${vues} → ${vuesLumiere})`);
  const forte = L.tirerMenaces(bande, D, () => 0, { ...base, rallumee: true, rallumees: 4 }).find(x => x.type === "bande");
  const faible = L.tirerMenaces(bande, D, () => 0, base).find(x => x.type === "bande");
  assert.equal(forte.force, faible.force + 1);
});

test("rallumer : une région rallumée attire les convois des bandes voisines (flux à part) ; une route rouverte ne se coupe plus", () => {
  const { monde } = L.demarrerPartie({ contenu: D, graine: G, region: "saint-paul", membres: ["a"] });
  const m = { ...monde, regions: { ...monde.regions, "le-port": { ...monde.regions["le-port"], factions: { "sans-lune": 4 } } } };
  assert.deepEqual(L.factionAttiree(m, D, "saint-paul"), { faction: "sans-lune", de: "le-port", force: 4 });
  assert.ok(L.chanceConvoi(1) > 0 && L.chanceConvoi(5) > L.chanceConvoi(1));
  assert.equal(L.chanceConvoi(0), 0);
  let convois = 0, x = m;
  for (let j = 1; j <= 200 && !convois; j++) {
    const s = L.simulerJour(x, D, L.hasardDuJour(G, j), j, { rallumees: ["saint-paul"], region: "saint-paul" });
    convois += s.faits.filter(f => f.cle === "convoi-attire").length;
    x = s.monde;
  }
  assert.ok(convois > 0, "un convoi finit par venir");
  // La route du Littoral rouverte : une coupure devient « difficile ».
  const coupee = { ...monde, regions: { ...monde.regions, "route-du-littoral": { ...monde.regions["route-du-littoral"], evenements: [{ cle: "eboulement", depuis: 1, jusqua: 9, routes: { "saint-denis": "coupee" } }] } } };
  const s0 = L.simulerJour(coupee, D, L.hasardDuJour(G, 2), 2, {});
  const s1 = L.simulerJour(coupee, D, L.hasardDuJour(G, 2), 2, { region: "", routesTenues: [["route-du-littoral", "saint-denis"]] });
  assert.equal(s0.monde.regions["route-du-littoral"].routes["saint-denis"], "coupee");
  assert.equal(s1.monde.regions["route-du-littoral"].routes["saint-denis"], "difficile");
});

test("chantiers de région : le registre est bien formé ; le travail avance ; les alliés y prêtent la main ; ce qu'un chantier fini donne", () => {
  assert.deepEqual(L.erreursChantiers(D), []);
  assert.equal(L.chantiersDuContenu(D).length, 6);
  const def = L.chantierDe(D, "rallumer-le-phare-de-bel-air");
  let r = L.travaillerChantier({}, def, { quarts: 2, bras: 4, jour: 10 });
  assert.equal(r.chantier.fait, 8);
  assert.equal(r.fini, false);
  r = L.travaillerChantier(r.chantier, def, { quarts: 8, bras: 4, jour: 11 });
  assert.equal(r.fini, true);
  assert.equal(r.chantier.finiLe, 11);
  let etat = { ile: { regions: {}, chantiers: { "relancer-la-centrale-de-langevin": { fait: 0, requis: 90, debut: 0, finiLe: null, aides: ["barques-du-sud"] } } } };
  for (let j = 1; j <= 45; j++) etat = L.journeeDesChantiers(etat, D, { jour: j }).etat;
  assert.ok(L.chantierFini(etat, "relancer-la-centrale-de-langevin"), "un allié, deux quarts par jour : 45 jours");
  const b = L.bienfaitsDeRegion(etat, D, "sud-sauvage");
  assert.equal(b.lumiere && b.electricite, true);
  assert.deepEqual(L.routesTenues({ ile: { chantiers: { "rouvrir-la-route-des-tamarins": { finiLe: 3 } } } }, D), [["saint-paul", "saint-leu"]]);
  assert.ok(L.erreursChantiers({ ...D, chantiersRegion: [{ cle: "x", region: "nulle-part", type: "pont", travail: 0, effets: {} }] }).length >= 4);
});

test("avancer : une région tenue, nettoyée, éclairée se rallume ; la carte publique le dit ; les jalons de l'île tombent", () => {
  // Mafate : personne n'y vivait au jour zéro, l'infestation y reste basse.
  const d = partie("ilet-a-bourse", { membres: ["a", "b"], taches: { a: "garde", b: "repos" } });
  const sites = L.regionDe(D, "mafate").sites.filter(s => s !== "ilet-a-bourse");
  const etat = { ...d.etat, nettoyes: sites.map(site => ({ region: "mafate", site, jour: 0, tues: 2 })) };
  const panneaux = [...d.abri.installations, { ...L.instanceInstallation("panneaux-solaires", 1), termineLe: 0 }, { ...L.instanceInstallation("batteries", 1), termineLe: 0 }];
  const r = L.avancer({ ...d, etat, abri: { ...d.abri, installations: panneaux }, contenu: D, quarts: 4 * 32 });
  assert.equal(L.etatRegion(r.etat, "mafate"), "rallumee");
  assert.ok(r.etat.journal.some(e => e.cle === "region-rallumee"));
  assert.ok(L.jalonsDe(r.etat).some(j => j.cle === "premiere-region"));
  assert.ok(r.paradis.jalons.some(j => j.cle === "premiere-region"));
  // Avant un mois d'abri tenu, ou sans nettoyer ses lieux gardés, elle ne s'allume pas.
  assert.equal(L.etatRegion(L.avancer({ ...d, etat, abri: { ...d.abri, installations: panneaux }, contenu: D, quarts: 4 * 20 }).etat, "mafate"), "noire");
  assert.equal(L.etatRegion(L.avancer({ ...d, abri: { ...d.abri, installations: panneaux }, contenu: D, quarts: 4 * 32 }).etat, "mafate"), "noire");
});
