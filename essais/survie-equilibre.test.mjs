// L'équilibre de Fénoir (docs/survie-equilibrage.md) : le simulateur de parties (essais/outils/simuler-parties.mjs) en mode
// rapide — 20 parties par cas, graine fixe, quatre cas — doit rester dans des bornes LARGES des objectifs du contrat. Ces bornes
// détectent une dérive future des nombres d'équilibre (consommation, pertes, production, pillage, hordes, menaces) sans casser
// au moindre souffle du hasard : les valeurs mesurées à l'écriture sont rappelées en commentaire.   Lancer : npm run essais
import { test } from "node:test";
import assert from "node:assert/strict";
import { simuler, mesurer, jouerPartie, chargerContenu, PARTIES_RAPIDE } from "./outils/simuler-parties.mjs";

const CAS = "passif-4,nomade-4,enracine-4,enracine-1";
const resultats = await simuler({ parties: PARTIES_RAPIDE, graine: "1", cas: CAS, fils: 4 });
const m = mesurer(resultats);
const cas = m.cas;
const part = (n, d) => n / Math.max(1, d);

test("équilibre : un groupe de 4 passif tient une à deux semaines (première faim J3–J20, fin médiane J8–J40)", () => {
  const c = cas["passif-4"]; // mesuré : première faim médiane J7, fin médiane J16
  assert.ok(c.premiereFaim >= 3 && c.premiereFaim <= 20, `première faim médiane J${c.premiereFaim}`);
  assert.ok(c.mediane >= 8 && c.mediane <= 40, `fin médiane J${c.mediane}`);
});

test("équilibre : l'enraciné à 4 tient 200 jours le plus souvent, devient autonome vers J25–J110, et reste menacé", () => {
  const c = cas["enracine-4"]; // mesuré : 13/20 vivants à J200, 15/20 autonomes (médiane J63), 5,6 assauts par mois dont 3,8 sérieux
  assert.ok(part(c.survie200, c.parties) >= 0.4, `${c.survie200}/${c.parties} vivants à J200`);
  assert.ok(part(c.autonomie, c.parties) >= 0.4, `${c.autonomie}/${c.parties} autonomes`);
  assert.ok(c.autonomieMediane >= 25 && c.autonomieMediane <= 110, `autonomie médiane J${c.autonomieMediane}`);
  assert.ok(c.serieuxParMoisApres30 >= 0.5, `${c.serieuxParMoisApres30} assaut sérieux par mois après J30`);
  assert.ok(c.assautsParMoisApres30 <= 12, `${c.assautsParMoisApres30} assauts par mois après J30`);
});

test("équilibre : le nomade à 4 tient, déménage sans cesse, et finit par manquer après J90", () => {
  const c = cas["nomade-4"]; // mesuré : 10/20 vivants à J200, 30 déménagements, 9 fins sur 10 après J90, 7 par la faim
  assert.ok(part(c.survie200, c.parties) >= 0.1 && part(c.survie200, c.parties) <= 0.85, `${c.survie200}/${c.parties} vivants à J200`);
  assert.ok(c.demenagements >= 8, `${c.demenagements} déménagements par partie`);
  const fins = resultats.filter(r => r.strategie === "nomade" && r.membres === 4 && r.fin !== "vivants");
  assert.ok(part(fins.filter(r => r.jours > 90).length, fins.length) >= 0.5, `${fins.filter(r => r.jours > 90).length}/${fins.length} fins après J90`);
});

test("équilibre : le solo enraciné est viable mais tendu", () => {
  const c = cas["enracine-1"]; // mesuré : 5/20 vivants à J200, médiane J161
  assert.ok(part(c.survie200, c.parties) >= 0.05 && part(c.survie200, c.parties) <= 0.85, `${c.survie200}/${c.parties} vivants à J200`);
  assert.ok(c.mediane >= 60, `médiane J${c.mediane}`);
  assert.ok(cas["enracine-4"].mediane >= c.mediane, "à quatre, on tient au moins aussi longtemps que seul");
});

test("équilibre : après J90, les Hauts sont plus durs que les Bas (Livides conservés par le froid)", () => {
  const { bas, hauts } = m.hautsBas; // mesuré : Hauts 5,0 assauts par mois, Bas 2,6
  assert.ok(bas.joursAbri > 300 && hauts.joursAbri > 300, "assez de jours d'abri de part et d'autre");
  assert.ok(hauts.assautsParMois > bas.assautsParMois, `Hauts ${hauts.assautsParMois} > Bas ${bas.assautsParMois} assauts par mois`);
});

test("équilibre : même graine, même partie (le simulateur est déterministe)", () => {
  const contenu = chargerContenu();
  const options = { strategie: "mixte", membres: 2, region: "saint-leu", graine: "determinisme", jours: 60 };
  const a = jouerPartie(contenu, options), b = jouerPartie(contenu, options);
  assert.deepEqual({ ...a, journal: undefined }, { ...b, journal: undefined });
});
