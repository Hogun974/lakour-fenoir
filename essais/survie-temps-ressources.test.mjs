// Le temps (§1.4, §1.5) et les ressources (§1.6).  Lancer : npm run essais
import { test } from "node:test";
import assert from "node:assert/strict";
import { L } from "./doublures/survie-outils.mjs";

test("quart ↔ jour, moment, date réelle (UTC), saison, phase", () => {
  const q = L.quand(0);
  assert.equal(q.jour, 0);
  assert.equal(q.moment, "matin");
  assert.equal(q.date, "2026-12-04");
  assert.equal(q.saison, "pluies");
  assert.equal(q.phase, "jour-zero");
  assert.equal(q.dateTexte, "vendredi 4 décembre 2026");
  const n = L.quand(4 * 28 + 3);
  assert.equal(n.moment, "nuit");
  assert.equal(n.date, "2027-01-01");
  assert.equal(L.quand(4 * 150).date, "2027-05-03");
  assert.equal(L.quand(4 * 150).saison, "seche");
  assert.equal(L.quand(0, "2027-02-28").date, "2027-02-28");
  assert.equal(L.quand(4, "2027-02-28").date, "2027-03-01");
  assert.equal(L.quand(4, "2028-02-28").date, "2028-02-29", "année bissextile");
  assert.equal(L.dateValide("2026-02-30"), false);
  assert.equal(L.jourDeDate("2026-12-20"), 16);
});

test("saisons de La Réunion et fruits", () => {
  for (const m of [11, 12, 1, 2, 3, 4]) assert.equal(L.saisonDuMois(m), "pluies");
  for (const m of [5, 6, 7, 8, 9, 10]) assert.equal(L.saisonDuMois(m), "seche");
  assert.equal(L.bonusFruits(12), 1.5);
  assert.equal(L.bonusFruits(11), 1.25);
  assert.equal(L.bonusFruits(6), 1);
});

test("phases de la crise", () => {
  assert.deepEqual([0, 1, 2, 6, 7, 20, 21, 59, 60, 300].map(L.phaseDuJour),
    ["jour-zero", "jour-zero", "panique", "panique", "effondrement", "effondrement", "silence", "silence", "apres", "apres"]);
});

test("consommation : 1 eau et 1 nourriture, 1,5 eau dans les Bas en saison des pluies", () => {
  assert.deepEqual(L.consommationJour({ personnes: 4, altitude: 10, saison: "pluies" }), { eau: 6, nourriture: 4 });
  assert.deepEqual(L.consommationJour({ personnes: 4, altitude: 10, saison: "seche" }), { eau: 4, nourriture: 4 });
  assert.deepEqual(L.consommationJour({ personnes: 3, altitude: 900, saison: "pluies" }), { eau: 3, nourriture: 3 });
  assert.deepEqual(L.consommationJour({ personnes: 3, altitude: 399, saison: "pluies" }), { eau: 5, nourriture: 3 });
});

test("pertes : 5 % arrondi au supérieur sans conservation, rien avec", () => {
  assert.equal(L.pertesJour(20), 1);
  assert.equal(L.pertesJour(21), 2);
  assert.equal(L.pertesJour(1), 1);
  assert.equal(L.pertesJour(0), 0);
  assert.equal(L.pertesJour(100, true), 0);
});

test("stocks : plafonds, retrait sans négatif, jours de stocks", () => {
  const p = L.plafonds({ eau: 60 });
  assert.equal(p.eau, 100);
  assert.equal(p.energie, 0);
  const { stocks, perdus } = L.plafonner({ eau: 130, energie: 5 }, p);
  assert.equal(stocks.eau, 100);
  assert.deepEqual(perdus, { eau: 30, energie: 5 });
  const r = L.retirerStocks({ eau: 3 }, { eau: 5 });
  assert.equal(r.stocks.eau, 0);
  assert.deepEqual(r.manque, { eau: 2 });
  assert.deepEqual(L.joursDeStocks({ eau: 12, nourriture: 9 }, { eau: -6, nourriture: -4 }), { eau: 2, nourriture: 2 });
  assert.deepEqual(L.joursDeStocks({ eau: 0, nourriture: 5 }, { eau: 0, nourriture: 1 }), { eau: 0, nourriture: L.JOURS_INFINIS });
  const j = L.journeeStocks({ nourriture: 40, eau: 10 }, { production: { eau: 2 }, consommation: { eau: 4, nourriture: 4 } });
  assert.equal(j.stocks.nourriture, 36 - 2);
  assert.equal(j.stocks.eau, 8);
});
