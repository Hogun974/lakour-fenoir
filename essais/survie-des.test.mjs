// Le test à réserve de d6 et la progression (contrat §1.1).  Lancer : npm run essais
import { test } from "node:test";
import assert from "node:assert/strict";
import { L, desFixes } from "./doublures/survie-outils.mjs";

test("reserve : niveau + 1 + bonus − malus, entre 1 et 10", () => {
  assert.equal(L.reserve({ niveau: 2 }), 3);
  assert.equal(L.reserve({ niveau: 2, bonus: 2, malus: 1 }), 4);
  assert.equal(L.reserve({ niveau: 0, malus: 5 }), 1);
  assert.equal(L.reserve({ niveau: 5, bonus: 9 }), 10);
});

test("lancer et compter : 5 et 6 sont des succès", () => {
  const des = L.lancer(4, desFixes([1, 4, 5, 6]));
  assert.deepEqual(des, [1, 4, 5, 6]);
  assert.equal(L.compter(des), 2);
  assert.equal(L.compter([4, 4, 4]), 0);
});

test("resoudreTest : requis, marge, facile = +1 dé", () => {
  const r = L.resoudreTest({ niveau: 1, difficulte: "difficile", hasard: desFixes([5, 6]) });
  assert.deepEqual(r.des, [5, 6]);
  assert.equal(r.requis, 2);
  assert.equal(r.reussite, true);
  assert.equal(r.marge, 0);
  assert.equal(r.marque, false, "réussi sans forcer : pas de marque");
  const f = L.resoudreTest({ niveau: 0, difficulte: "facile", hasard: desFixes([1, 5]) });
  assert.equal(f.des.length, 2);
  assert.equal(f.reussite, true);
  const x = L.resoudreTest({ niveau: 2, difficulte: "extreme", hasard: desFixes([5, 6, 6]) });
  assert.equal(x.requis, 3);
  assert.equal(x.reussite, true);
});

test("forcer : relance les non-succès, 1 fatigue, complication si échec ; marque si échoué ou forcé", () => {
  const r = L.resoudreTest({ niveau: 1, forcer: true, hasard: desFixes([6, 2, 5]) });
  assert.deepEqual(r.des, [6, 2]);
  assert.deepEqual(r.desForces, [6, 5]);
  assert.equal(r.force, true);
  assert.equal(r.fatigue, 1);
  assert.equal(r.marque, true);
  assert.equal(r.complication, false);
  const e = L.resoudreTest({ niveau: 0, difficulte: "difficile", forcer: true, hasard: desFixes([1, 2]) });
  assert.equal(e.reussite, false);
  assert.equal(e.complication, true);
  const echec = L.resoudreTest({ niveau: 0, hasard: desFixes([3]) });
  assert.equal(echec.marque, true);
  assert.equal(L.resoudreTest({ niveau: 0, hasard: desFixes([3]), compte: false }).marque, false);
  const deja = L.forcerTest(r, desFixes([6]));
  assert.equal(deja, r, "on ne force qu'une fois");
});

test("marquer : monte à 2 × (niveau + 1) marques, repart à 0, maximum 5", () => {
  assert.deepEqual(L.marquer({ niveau: 0, marques: 0 }), { niveau: 0, marques: 1, monte: false });
  assert.deepEqual(L.marquer({ niveau: 0, marques: 1 }), { niveau: 1, marques: 0, monte: true });
  assert.deepEqual(L.marquer({ niveau: 2, marques: 4 }), { niveau: 2, marques: 5, monte: false });
  assert.deepEqual(L.marquer({ niveau: 2, marques: 5 }), { niveau: 3, marques: 0, monte: true });
  assert.equal(L.marquer({ niveau: 5, marques: 20 }).niveau, 5);
  assert.equal(L.marquer({ niveau: 5, marques: 20 }).monte, false);
  assert.equal(L.seuilMarques(4), 10);
});
