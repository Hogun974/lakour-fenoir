// L'état d'un survivant (§1.3), les maladies (§9) et l'atelier (§9).  Lancer : npm run essais
import { test } from "node:test";
import assert from "node:assert/strict";
import { L, contenuMini, desFixes, constant, I } from "./doublures/survie-outils.mjs";

const C = contenuMini();
const def = cle => L.indexer(C).afflictions.get(cle);

test("malus d'état : blessures, fatigue, moral", () => {
  assert.equal(L.malusEtat({ blessures: 1, fatigue: 2, moral: 3 }).total, 0);
  assert.equal(L.malusEtat({ blessures: 2 }).blessures, 1);
  assert.equal(L.malusEtat({ blessures: 3 }).blessures, 2);
  assert.equal(L.malusEtat({ fatigue: 3 }).fatigue, 1);
  assert.equal(L.malusEtat({ fatigue: 4 }).fatigue, 1);
  assert.equal(L.malusEtat({ fatigue: 5 }).fatigue, 2);
  assert.equal(L.malusEtat({ moral: 1 }).moral, 1);
  assert.equal(L.malusEtat({ moral: 0 }).craque, true);
  assert.equal(L.malusEtat({ blessures: 3, fatigue: 5, moral: 1 }).total, 5);
});

test("quart : soif, fatigue de la soif, repos", () => {
  let s = L.survivantNeuf({});
  for (let q = 1; q <= 3; q++) s = L.effetQuart(s, q, {}).system;
  assert.equal(s.soif, 3);
  assert.equal(s.fatigue, 0);
  s = L.effetQuart(s, 4, {}).system;
  assert.equal(s.soif, 4);
  assert.equal(s.fatigue, 1, "soif ≥ 4 quarts : +1 fatigue");
  s = L.effetQuart(s, 5, { boit: true }).system;
  assert.equal(s.soif, 0);
  assert.equal(L.effetQuart({ fatigue: 4 }, 1, { boit: true, repos: "nuit" }).system.fatigue, 2);
  assert.equal(L.effetQuart({ fatigue: 4 }, 1, { boit: true, repos: "quart" }).system.fatigue, 3);
});

test("jour : faim ≥ 2 jours → fatigue et moral ; bien nourri, le moral remonte", () => {
  let s = L.survivantNeuf({ moral: 4 });
  s = L.effetJour(s, { mange: false }).system;
  assert.equal(s.faim, 1);
  assert.equal(s.moral, 4);
  s = L.effetJour(s, { mange: false }).system;
  assert.equal(s.fatigue, 1);
  assert.equal(s.moral, 3);
  s = L.effetJour(s, { mange: true, confort: 1 }).system;
  assert.equal(s.faim, 0);
  assert.equal(s.moral, 4);
  assert.equal(L.effetJour({ moral: 3 }, { mange: true, confort: 0 }).system.moral, 3, "sans confort, pas au-dessus de 3");
});

test("infection : un stade tous les 2 quarts, mort à 6, relève au quart suivant", () => {
  let s = L.infecter(L.survivantNeuf({}), 10);
  assert.equal(s.infection.atteint, true);
  for (let q = 11; q <= 21; q++) s = L.effetQuart(s, q, { boit: true }).system;
  assert.equal(s.infection.stade, 5);
  assert.equal(s.vivant, true);
  const m = L.effetQuart(s, 22, { boit: true });
  assert.equal(m.system.infection.stade, 6);
  assert.equal(m.system.vivant, false);
  assert.ok(m.evenements.some(e => e.cle === "mort" && e.cause === "infection"));
  const r = L.effetQuart(m.system, 23, {});
  assert.equal(r.system.livide, true);
  assert.equal(L.effetQuart(m.system, 23, { corpsTraite: true }).system.livide, false);
});

test("morsure : soins extrême réussi ou infection", () => {
  assert.equal(L.appliquerMorsure({}, { reussite: true }, 5).infecte, false);
  const r = L.appliquerMorsure({}, { reussite: false }, 5);
  assert.equal(r.infecte, true);
  assert.equal(r.system.infection.depuis, 5);
});

test("blessures : mourant à 4, mort à la fin du quart sans stabilisation ; soins", () => {
  const b = L.blesser({ blessures: 3 }, 2);
  assert.equal(b.system.blessures, 4);
  assert.equal(b.mourant, true);
  assert.equal(L.effetQuart(b.system, 1, { boit: true }).system.vivant, false);
  assert.equal(L.effetQuart(b.system, 1, { boit: true, stabilise: true }).system.vivant, true);
  assert.equal(L.soigner(b.system, { reussite: true, marge: 1 }).system.blessures, 2);
  assert.equal(L.soigner(b.system, { reussite: false }).system.blessures, 4);
});

// ------------------------------------------------------------------ maladies
test("maladies : risque selon l'eau, les moustiques, l'infirmerie", () => {
  const gastro = def("gastro"), dengue = def("dengue");
  assert.equal(L.risqueAffliction(gastro, { eauTraitee: false }), 0.02);
  assert.ok(Math.abs(L.risqueAffliction(gastro, { eauTraitee: true }) - 0.004) < 1e-9);
  assert.equal(L.risqueAffliction(dengue, { saison: "pluies", altitude: 10 }), 0.01);
  assert.ok(L.risqueAffliction(dengue, { saison: "pluies", altitude: 900 }) < 0.01);
  assert.ok(L.risqueAffliction(dengue, { saison: "seche", altitude: 10 }) < L.risqueAffliction(dengue, { saison: "pluies", altitude: 900 }));
  assert.ok(L.risqueAffliction(dengue, { saison: "pluies", altitude: 10, infirmerie: true }) < 0.01);
  assert.equal(L.risqueAffliction(def("fracture"), {}), 0, "une fracture ne s'attrape pas toute seule");
});

test("maladies : incubation, déclaration, malus, fatigue, guérison", () => {
  let s = L.contracter(L.survivantNeuf({}), def("dengue"), 0);
  assert.equal(s.afflictions[0].stade, "incubation");
  assert.equal(L.malusEtat(s).afflictions, 0, "pas de malus en incubation");
  for (let j = 1; j <= 3; j++) s = L.evoluerAfflictions(s, L.indexer(C).afflictions, j).system;
  assert.equal(s.afflictions[0].stade, "incubation");
  const r = L.evoluerAfflictions(s, L.indexer(C).afflictions, 4);
  assert.ok(r.evenements.some(e => e.cle === "declaree"));
  s = r.system;
  assert.equal(L.malusEtat(s).afflictions, 1);
  assert.equal(L.malusEtat(s).total, 1);
  // Soignée : plus d'aggravation, guérit en moins de jours.
  const soin = L.soignerAffliction(s, def("dengue"), { reussite: true }, { medicaments: 2 });
  assert.equal(soin.ok, true);
  assert.equal(soin.stocks.medicaments, 1);
  let t = soin.system;
  let jour = 5;
  while (t.afflictions.length && jour < 30) t = L.evoluerAfflictions(t, L.indexer(C).afflictions, jour++).system;
  assert.equal(t.afflictions.length, 0, "guérie");
  assert.ok(jour <= 10);
  assert.ok(t.fatigue >= 1, "la maladie fatigue");
});

test("maladies : sans soin, l'aggravation ; sans médicaments, pas de soin", () => {
  let s = L.contracter(L.survivantNeuf({}), def("dengue"), 0);
  for (let j = 1; j <= 9; j++) s = L.evoluerAfflictions(s, L.indexer(C).afflictions, j).system;
  assert.equal(s.afflictions[0].stade, "aggravee");
  assert.equal(L.malusEtat(s).afflictions, 2);
  assert.equal(L.soignerAffliction(s, def("dengue"), { reussite: true }, { medicaments: 0 }).ok, false);
  const soin = L.soignerAffliction(s, def("dengue"), { reussite: true }, { medicaments: 1 });
  assert.equal(soin.system.afflictions[0].stade, "active");
  assert.equal(L.malusEtat(soin.system).afflictions, 1);
});

test("maladies : tirage du jour et contagion", () => {
  const groupe = [{ id: "a", system: L.survivantNeuf({}) }, { id: "b", system: L.survivantNeuf({}) }];
  const tout = L.tirerMaladies(groupe, L.indexer(C).afflictions, { saison: "pluies", altitude: 10 }, constant(0), 0);
  assert.ok(tout.some(n => n.cle === "gastro") && tout.some(n => n.cle === "dengue"));
  assert.ok(!tout.some(n => n.cle === "fracture"));
  assert.deepEqual(L.tirerMaladies(groupe, L.indexer(C).afflictions, { saison: "pluies", altitude: 10 }, constant(0.999), 0), []);
  // Contagion : un malade déclaré de gastro la passe (5 tirages de risque : le malade ne peut plus attraper la gastro, puis la contagion).
  const malade = L.contracter(L.survivantNeuf({}), { ...def("gastro"), incubation: 0 }, 0);
  const contagion = L.tirerMaladies([{ id: "a", system: malade }, { id: "b", system: L.survivantNeuf({}) }],
    L.indexer(C).afflictions, { saison: "seche", altitude: 900, eauTraitee: true }, (() => { let i = 0; return () => (i++ < 5 ? 0.9 : 0.01); })(), 0);
  assert.deepEqual(contagion, [{ id: "b", cle: "gastro" }]);
});

// ------------------------------------------------------------------ atelier
test("atelier : peutFabriquer donne ses raisons", () => {
  const r = L.indexer(C).recettes;
  const v = L.peutFabriquer(r.get("arc-fleches"), { stocks: {}, installations: [], savoirs: [] });
  assert.equal(v.ok, false);
  assert.ok(v.raisons.some(x => x.includes("atelier")));
  assert.ok(v.raisons.some(x => x.includes("materiaux")));
  const f = L.peutFabriquer(r.get("filtre-portatif"), { stocks: { materiaux: 1, pieces: 1 }, savoirs: [] });
  assert.ok(f.raisons.some(x => x.includes("plomberie")));
  const ok = L.peutFabriquer(r.get("arc-fleches"), { stocks: { materiaux: 2 }, installations: [I("atelier", 1)] });
  assert.equal(ok.ok, true);
  assert.equal(L.peutFabriquer(r.get("arc-fleches"), { stocks: { materiaux: 2 }, installations: [I("atelier", 1, { etat: 3 })] }).ok, false);
});

test("atelier : fabriquer paie, teste, produit ; l'échec rend la moitié", () => {
  const r = L.indexer(C).recettes;
  const base = { stocks: { materiaux: 5, pieces: 3 }, installations: [I("atelier", 1)] };
  const ok = L.fabriquer(r.get("arc-fleches"), { ...base, niveau: 1, hasard: desFixes([6, 1]) });
  assert.equal(ok.test.reussite, true);
  assert.deepEqual(ok.produit, { equipement: "arc", n: 1 });
  assert.equal(ok.stocks.materiaux, 3);
  const mun = L.fabriquer(r.get("munitions-rechargees"), { ...base, niveau: 3, hasard: desFixes([6, 6, 6, 6]) });
  assert.deepEqual(mun.produit, { ressource: "munitions", n: 4 }, "marge 2 : une de plus");
  assert.equal(mun.stocks.munitions, 4);
  const rate = L.fabriquer(r.get("munitions-rechargees"), { ...base, niveau: 0, hasard: desFixes([1]) });
  assert.equal(rate.produit, null);
  assert.equal(rate.stocks.pieces, 3, "1 pièce : la moitié arrondie au supérieur est rendue");
  assert.equal(rate.stocks.materiaux, 5);
});

test("morsure : test de soins extrême, difficile avec un médicament ou une infirmerie (2026-11-05)", () => {
  assert.equal(L.difficulteMorsure(), "extreme");
  assert.equal(L.difficulteMorsure({ medicament: true }), "difficile");
  assert.equal(L.difficulteMorsure({ infirmerie: true }), "difficile");
  assert.equal(L.difficulteMorsure({ medicament: false, infirmerie: false }), "extreme");
  // Deux succès suffisent alors ; un seul ne suffit jamais.
  const s = L.genererSurvivant(C, constant(0.3));
  const deux = L.resoudreTest({ niveau: 1, difficulte: L.difficulteMorsure({ medicament: true }), hasard: desFixes([5, 6]) });
  assert.equal(L.appliquerMorsure(s, deux, 4).infecte, false);
  const un = L.resoudreTest({ niveau: 1, difficulte: L.difficulteMorsure({ infirmerie: true }), hasard: desFixes([5, 1]) });
  assert.equal(L.appliquerMorsure(s, un, 4).infecte, true);
});
