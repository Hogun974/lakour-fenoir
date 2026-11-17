// Lot 7 « Bâtir et défendre » (contrat §26) : la logique pure des matériaux, de l'entretien, des défenses devant les Livides, du feu
// et de la cave qui s'éboule (logique/ouvrages.mjs), et ses crochets dans bilanAbri, journeeAbri, subirCyclone (abri.mjs) et avancer
// (etat.mjs), avec le VRAI contenu de lakour-fenoir.   Lancer : npm run essais
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import * as L from "../systems/lakour-survie/logique/index.mjs";
import { normaliserContenu } from "../systems/lakour-survie/scripts/registre.mjs";

const C = normaliserContenu(JSON.parse(readFileSync(new URL("../modules/lakour-fenoir/assets/donnees.json", import.meta.url), "utf8")));
const def = cle => L.installationDe(C, cle);
const I = (cle, niveau = 1, extra = {}) => L.instanceInstallation(cle, niveau, { termineLe: -365, ...extra });
const suite = valeurs => { let i = 0; return () => valeurs[i++ % valeurs.length]; };
const abriDe = (site, extra = {}) => ({ site, region: L.siteDe(C, site).region, stocks: { eau: 30, nourriture: 30 }, ...extra });

test("matériaux : six familles et leurs parts ; le matériau d'une installation (niveau, définition, lontan, défaut)", () => {
  assert.deepEqual(L.MATERIAUX_CLES.sort(), ["bambou-et-vacoa", "bois-sous-tole", "paille-et-torchis", "parpaing-et-beton", "pierre-seche", "tole-de-recuperation"]);
  assert.equal(L.MATERIAUX["paille-et-torchis"].faiblesses.cyclone, 0.9);
  assert.equal(L.MATERIAUX["pierre-seche"].faiblesses.feu, 0);
  assert.equal(L.materiauDe(def("mur"), 1), "pierre-seche");
  assert.equal(L.materiauDe(def("mur"), 3), "parpaing-et-beton");
  assert.equal(L.materiauDe(def("boucan"), 1), "paille-et-torchis");
  assert.equal(L.materiauDe({ cle: "x", niveaux: [{}] }, 1), "bois-sous-tole", "sans matériau : le bois sous tôle");
  assert.equal(L.materiauDe({ cle: "x", arbre: "lontan", niveaux: [{}] }, 1), "bambou-et-vacoa");
  assert.equal(L.materiauDe({ cle: "x", materiau: "inconnu", niveaux: [{}] }, 1), "bois-sous-tole");
});

test("cyclone : la chance par point suit le matériau (bois sous tôle 25 % comme avant, tôle 40 %, pierre 10 %) ; « expose »", () => {
  assert.equal(L.chanceCyclone({ niveaux: [{}] }, 1), 0.25);
  assert.equal(L.chanceCyclone(def("citerne-de-pluie"), 1), 0.4);
  assert.equal(L.chanceCyclone(def("captage-de-source"), 1), 0.1);
  assert.ok(L.exposeeAuCyclone(def("citerne-de-pluie")) && !L.exposeeAuCyclone(def("dortoir")) && !L.exposeeAuCyclone(def("galerie-souterraine")));
  assert.ok(L.exposeeAuCyclone(def("boucan")), "une paillote est exposée (expose)");
  // Un tirage de 0,3 : la tôle (0,4) prend un point, la pierre (0,1) non ; le bois sous tôle (0,25) non plus.
  const r = L.subirCyclone({ degats: 0 }, [I("citerne-de-pluie"), I("captage-de-source"), I("bouilleur-solaire"), I("dortoir")], C, { force: 1, protection: 0 }, () => 0.3);
  assert.deepEqual(r.endommagees, ["citerne-de-pluie"]);
});

test("entretien : la forme d'un niveau ; l'usure faute de soin (un cran par délai) ; le soin courant par la tâche ou le chantier", () => {
  const e = L.entretienDe(def("citerne-de-pluie"), 1);
  assert.deepEqual({ tousLes: e.tousLes, travail: e.travail }, { tousLes: 60, travail: 1 });
  assert.equal(L.entretienDe(def("potager"), 1), null, "une installation à bras n'a pas d'entretien à part");
  // Le premier jour, le suivi se pose : rien ne casse d'un coup (une partie d'avant le lot).
  let inst = [I("citerne-de-pluie")];
  let r = L.journeeOuvrages(inst, C, { jour: 100 });
  assert.equal(r.installations[0].suivi.le, 100);
  assert.equal(r.installations[0].etat, 0);
  // Sans personne au chantier : 60 jours plus tard, un cran perdu (négligence).
  r = L.journeeOuvrages(r.installations, C, { jour: 160 });
  assert.equal(r.installations[0].etat, 1);
  assert.equal(r.installations[0].suivi.negligence, 1);
  assert.deepEqual(r.evenements.map(x => x.cle), ["ouvrage-use"]);
  // Le lendemain, quelqu'un au chantier : le soin rattrape le cran perdu et remet le délai.
  r = L.journeeOuvrages(r.installations, C, { jour: 161, bras: { chantier: 1 } });
  assert.equal(r.installations[0].etat, 0);
  assert.equal(r.installations[0].suivi.negligence, 0);
  assert.equal(r.installations[0].suivi.le, 161);
  assert.equal(r.evenements[0].cle, "ouvrage-soigne");
  // À l'heure, avec quelqu'un au chantier : rien ne s'use.
  r = L.journeeOuvrages(r.installations, C, { jour: 221, bras: { chantier: 1 } });
  assert.equal(r.installations[0].etat, 0);
  // Une casse (un assaut) ne se rattrape pas par le soin : elle se répare.
  const casse = { ...r.installations[0], etat: 2 };
  const s = L.entretenirInstallation(casse, def("citerne-de-pluie"), { quarts: 1, jour: 300 });
  assert.equal(s.instance.etat, 2);
  assert.ok(s.soigne);
});

test("entretien : un soin à moitié fait se garde ; le budget de la tâche va au plus en retard d'abord", () => {
  const d = def("galerie-souterraine");
  const a = L.entretenirInstallation(I("galerie-souterraine", 1, { suivi: { le: 0, negligence: 0 } }), d, { quarts: 1, jour: 70 });
  assert.equal(a.soigne, false);
  assert.equal(a.reste, 1);
  const b = L.entretenirInstallation(a.instance, d, { quarts: 1, jour: 71 });
  assert.ok(b.soigne);
  // Deux dus, un seul quart de chantier : le plus en retard est soigné, l'autre s'use.
  const r = L.journeeOuvrages([I("citerne-de-pluie", 1, { suivi: { le: 0 } }), I("palissade", 1, { suivi: { le: -50 } })], C, { jour: 60, bras: { chantier: 1 } });
  const p = r.installations.find(i => i.cle === "palissade"), c = r.installations.find(i => i.cle === "citerne-de-pluie");
  assert.equal(p.suivi.le, 60, "la palissade (en retard de 20 jours) est soignée");
  assert.equal(c.etat, 1, "la citerne attendait depuis 0 jour : elle s'use");
});

test("encrassement : les panneaux sales produisent la moitié (lavés par la pluie) ; la pico-hydro bouchée s'arrête", () => {
  let r = L.journeeOuvrages([I("panneaux-solaires")], C, { jour: 0 });
  r = L.journeeOuvrages(r.installations, C, { jour: 12 });
  const sale = r.installations[0];
  assert.equal(sale.suivi.encrasse, true);
  assert.equal(sale.etat, 0, "encrassée, pas abîmée");
  assert.equal(r.evenements[0].cle, "ouvrage-encrasse");
  assert.equal(L.facteurEntretien(sale, def("panneaux-solaires"), 1), 0.5);
  const site = "case-de-bellemene";
  const propre = L.bilanAbri(abriDe(site), [I("panneaux-solaires")], C, { jour: 20, personnes: 0, saison: "pluies" });
  const encrassee = L.bilanAbri(abriDe(site), [sale], C, { jour: 20, personnes: 0, saison: "pluies" });
  assert.ok(encrassee.production.energie < propre.production.energie, `${encrassee.production.energie} < ${propre.production.energie}`);
  // La pluie : un jour de pluie recule l'encrassement de deux jours.
  const lave = L.journeeOuvrages([I("panneaux-solaires", 1, { suivi: { le: 0 } })], C, { jour: 11, pluie: 1 });
  assert.equal(lave.installations[0].suivi.le, 2);
  assert.equal(L.facteurEntretien({ niveau: 1, suivi: { encrasse: true } }, def("pico-hydro"), 1), 0, "la pico-hydro s'arrête");
});

test("pluie sur le torchis : son délai avance d'un jour de plus ; pannes (flux à part) et vieillesse des batteries", () => {
  const boucan = L.journeeOuvrages([I("boucan", 1, { suivi: { le: 0 } })], C, { jour: 20, pluie: 0.75 });
  assert.equal(boucan.installations[0].suivi.avance, 1);
  assert.equal(boucan.installations[0].suivi.le, 0, "jamais un jour négatif");
  assert.equal(L.etatEntretien(boucan.installations[0], def("boucan"), 29).du, true, "dû un jour plus tôt");
  const paille = L.journeeOuvrages([I("palissade", 1, { suivi: { le: 10 } })], C, { jour: 20, pluie: 0.75 });
  assert.equal(paille.installations[0].suivi.avance, undefined, "le bois sous tôle ne s'use pas plus sous la pluie");
  const panne = L.journeeOuvrages([I("groupe-electrogene", 1, { suivi: { le: 0 } })], C, { jour: 1, hasard: () => 0 });
  assert.equal(panne.installations[0].etat, 1);
  assert.equal(panne.evenements[0].cle, "ouvrage-panne");
  const tient = L.journeeOuvrages([I("groupe-electrogene", 1, { suivi: { le: 0 } })], C, { jour: 1, hasard: () => 0.5 });
  assert.equal(tient.installations[0].etat, 0);
  const vieille = L.journeeOuvrages([I("batteries", 1, { suivi: { le: 399, vieLe: 0 } })], C, { jour: 400, bras: { chantier: 1 }, hasard: () => 0.9 });
  assert.equal(vieille.installations[0].etat, 1);
  assert.ok(vieille.evenements.some(x => x.cle === "ouvrage-vieillit"));
});

test("défenses : pièges (force ôtée aux seuls Livides, la fosse se comble), hauteur (pas de brèche), porte, cloche", () => {
  const inst = [I("fosse-et-pieges", 2, { id: "f" }), I("chemin-de-ronde", 1, { id: "c" }), I("herse", 1, { id: "h" }), I("cloche-d-alarme", 1, { id: "k" }), I("palissade", 1, { id: "p" })];
  const o = L.ouvragesDeLAbri(inst, C, { jour: 0 });
  assert.equal(o.piege, 2);
  assert.deepEqual(o.hauteur.map(x => x.cle), ["chemin-de-ronde"]);
  assert.deepEqual(o.portes.map(x => x.cle), ["herse"]);
  assert.equal(o.alarme, true);
  assert.deepEqual(L.forceDevantOuvrages({ force: 5, livides: true, ouvrages: o }), { force: 3, retire: 2, comblees: [] });
  assert.deepEqual(L.forceDevantOuvrages({ force: 5, livides: false, ouvrages: o }), { force: 5, retire: 0, comblees: [] }, "les vivants voient les pièges");
  assert.equal(L.forceDevantOuvrages({ force: 1, livides: true, ouvrages: o }).force, 1, "jamais sous 1");
  assert.deepEqual(L.forceDevantOuvrages({ force: 9, livides: true, ouvrages: o }).comblees.map(x => x.cle), ["fosse-et-pieges"], "débordée, elle se comble");
  // Hors service : plus rien.
  assert.equal(L.ouvragesDeLAbri([I("fosse-et-pieges", 2, { etat: 3 })], C).piege, 0);
  // La hauteur : une brèche devient « endommagée », sans blessé, si un garde tient le chemin de ronde.
  const breche = { issue: "breche", degats: 2, blesses: 1, installationEndommagee: true, marge: -3 };
  const h = L.issueDevantOuvrages(breche, { livides: true, ouvrages: o, garde: true });
  assert.equal(h.issue, "endommagee");
  assert.equal(h.blesses, 0);
  assert.equal(h.appuis.cle, "chemin-de-ronde");
  assert.equal(L.issueDevantOuvrages(breche, { livides: true, ouvrages: o, garde: false }).issue, "breche", "sans garde là-haut");
  assert.equal(L.issueDevantOuvrages(breche, { livides: false, ouvrages: o, garde: true }).issue, "breche", "une bande grimpe");
  // La cible : les appuis, sinon la porte, sinon l'enceinte ; des vivants : au hasard.
  assert.equal(L.cibleDesDegats(inst, C, { livides: true, appuis: h.appuis, hasard: () => 0.5 }).cle, "chemin-de-ronde");
  assert.equal(L.cibleDesDegats(inst, C, { livides: true, hasard: () => 0.99 }).cle, "herse");
  const sansPorte = [I("citerne-de-pluie"), I("potager"), I("palissade"), I("barricades")];
  for (const x of [0, 0.3, 0.6, 0.99]) assert.ok(["palissade", "barricades"].includes(L.cibleDesDegats(sansPorte, C, { livides: true, hasard: () => x }).cle), "l'enceinte d'abord");
  assert.equal(L.cibleDesDegats(sansPorte, C, { livides: false, hasard: () => 0 }).cle, "citerne-de-pluie", "des vivants : au hasard, comme avant");
});

test("la haie ne défend qu'une fois fermée (180 jours) ; la touffe de bambous regarnit le bois des alentours", () => {
  const site = "ferme-de-la-plaine-des-cafres";
  const haie = I("haie-de-choka", 1, { termineLe: 0 });
  assert.equal(L.bilanAbri(abriDe(site), [haie], C, { jour: 100, personnes: 1 }).defense, L.bilanAbri(abriDe(site), [], C, { jour: 100, personnes: 1 }).defense);
  assert.equal(L.bilanAbri(abriDe(site), [haie], C, { jour: 200, personnes: 1 }).defense, L.bilanAbri(abriDe(site), [], C, { jour: 200, personnes: 1 }).defense + 1);
  assert.equal(L.ouvragesDeLAbri([haie], C, { jour: 100 }).piege, 0);
  const touffe = I("touffe-de-bambous", 1, { termineLe: 0 });
  const tot = L.bilanAbri(abriDe(site), [touffe], C, { jour: 100, personnes: 1 });
  assert.equal(tot.bois, 0, "rien avant six mois");
  const nature = { cueillette: 0, gibier: 0, peche: 0, bois: 0 };
  const j = L.journeeAbri(abriDe(site, { nature }), [touffe], C, { jour: 200, personnes: 1 });
  assert.equal(j.bilan.bois, 0.5);
  assert.ok(j.abri.nature.bois > L.regenererNature(nature, L.regionDe(C, "le-tampon") ?? L.regionDe(C, L.siteDe(C, site).region)).bois);
});

test("feu : la pierre et le parpaing ne brûlent pas, sous terre non plus ; la paille si ; force 2 et plus abîme l'abri", () => {
  const inst = [I("boucan"), I("mur"), I("galerie-souterraine"), I("palissade")];
  const r = L.incendieAbri(inst, C, { force: 2 }, () => 0.01);
  assert.deepEqual(r.brulees.map(b => b.cle).sort(), ["boucan", "palissade"]);
  assert.ok(r.epargnees.includes("mur"));
  assert.equal(r.installations.find(i => i.cle === "galerie-souterraine").etat, 0);
  assert.equal(r.degatsAbri, 1);
  assert.equal(L.incendieAbri(inst, C, { force: 1 }, () => 0.99).brulees.length, 0);
});

test("la cave s'éboule sans l'étaiement (25 % au moment d'achever un niveau), près d'une eau qui court aussi ; une blessure qui ne tue pas", () => {
  const g = def("galerie-souterraine");
  assert.equal(L.risqueEboulement({ def: g, savoirs: [], site: { eau: "citerne" } }), 0.25);
  assert.equal(L.risqueEboulement({ def: g, savoirs: ["etaiement-galeries"], site: { eau: "citerne" } }), 0);
  assert.equal(L.risqueEboulement({ def: g, savoirs: ["etaiement-galeries"], site: { eau: "riviere" } }), 0.25);
  assert.equal(L.risqueEboulement({ def: def("potager"), savoirs: [] }), 0, "on ne creuse que sous terre");
  // Le tirage se fait quand le niveau s'achève (« à la fin du creusement ») : éboulé, il n'est pas fini (6 quarts à recreuser).
  const avant = I("galerie-souterraine", 0, { chantier: { fait: 20, requis: 24 } });
  const fini = L.avancerChantier(avant, g, { quarts: 4, bras: 1, jour: 5 });
  assert.equal(fini.termine, true);
  const e = L.eboulement({ def: g, savoirs: [], site: {}, avant, resultat: fini, hasard: () => 0.1 });
  assert.deepEqual({ eboule: e.eboule, perdu: e.perdu, termine: e.resultat.termine, niveau: e.resultat.instance.niveau, fait: e.resultat.instance.chantier.fait },
    { eboule: true, perdu: 6, termine: false, niveau: 0, fait: 18 });
  assert.equal(L.eboulement({ def: g, savoirs: [], site: {}, avant, resultat: fini, hasard: () => 0.5 }).resultat, fini, "il tient");
  const enCours = L.avancerChantier(I("galerie-souterraine", 0, { chantier: { fait: 0, requis: 24 } }), g, { quarts: 4, bras: 1 });
  assert.equal(L.eboulement({ def: g, savoirs: [], site: {}, avant, resultat: enCours, hasard: () => 0 }).eboule, false, "rien avant la fin du niveau");
  assert.equal(L.blessureQuiNeTuePas(0), 1);
  assert.equal(L.blessureQuiNeTuePas(3), 3);
});

test("avancer : faute de soin, une installation s'use et le journal le dit ; la lumière d'une lampe compte la nuit", () => {
  const { monde, etat } = L.demarrerPartie({ contenu: C, graine: "ouvrages|usure", region: "le-tampon", membres: ["a"] });
  const ins = L.installerAbri(monde, C, { site: C.regions.find(r => r.cle === "le-tampon").sites[0], jour: 0, quart: 0 });
  const abri = { id: "abri", system: ins.abri, installations: [...ins.installations.filter(i => i.cle !== "compost"), I("compost", 1, { suivi: { le: -20 } })] };
  const e = { ...etat, groupe: { ...etat.groupe, abri: "abri", region: ins.abri.region } };
  const r = L.avancer({ etat: e, monde: ins.monde, contenu: C, quarts: 4, survivants: [{ id: "a", system: L.survivantNeuf({ tache: "chasse" }) }], abri });
  const compost = r.acteurs.abri.installations.find(i => i.cle === "compost");
  assert.equal(compost.etat, 1);
  assert.ok(r.etat.journal.some(x => x.cle === "ouvrage-use"), "le journal le dit");
  // Le même jour, quelqu'un au chantier : soigné.
  const r2 = L.avancer({ etat: e, monde: ins.monde, contenu: C, quarts: 4, survivants: [{ id: "a", system: L.survivantNeuf({ tache: "chantier" }) }], abri });
  assert.equal(r2.acteurs.abri.installations.find(i => i.cle === "compost").etat, 0);
  // Une lampe à huile en service : l'abri est éclairé (bilan.lumiere).
  const b = L.bilanAbri(ins.abri, [I("lampes-a-huile")], C, { jour: 1, personnes: 1 });
  assert.equal(b.lumiere, true);
});

test("contenu : matériaux, entretiens et effets du lot sont sains (erreursOuvrages) ; une erreur se voit", () => {
  assert.deepEqual(L.erreursOuvrages(C), []);
  const faux = structuredClone(C);
  faux.installations.find(i => i.cle === "boucan").materiau = "carton";
  faux.installations.find(i => i.cle === "palissade").niveaux[0].entretien.tousLes = 1;
  const e = L.erreursOuvrages(faux);
  assert.ok(e.some(x => /carton/.test(x)) && e.some(x => /tous les 1 jours/.test(x)), e.join(" ; "));
});
