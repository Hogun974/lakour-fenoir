// L'équilibre de Fénoir (docs/survie-equilibrage.md) : le simulateur de parties (essais/outils/simuler-parties.mjs) en mode
// rapide — 20 parties par cas, graine fixe, quatre cas — doit rester dans des bornes LARGES des objectifs du contrat. Ces bornes
// détectent une dérive future des nombres d'équilibre (consommation, pertes, production, pillage, hordes, menaces) sans casser
// au moindre souffle du hasard : les valeurs mesurées à l'écriture sont rappelées en commentaire.   Lancer : npm run essais
// Remesuré le 2026-11-05 après les parties longues (essais/survie-parties-longues.test.mjs) : le simulateur comptait le jour d'un
// déménagement sans faire passer le temps (le nomade gagnait un jour gratuit par départ, ~30 sur 200), et la logique corrigée
// fait manger les chiens de garde et tirer les événements météo du contenu (éboulements…). Mesures entre crochets : avant.
// Remesuré le 2026-11-05 (docs/equilibre.md, « Appliqué ») : glanage de passage, événements du contenu à 35 % par jour, plancher
// des factions, recrues, morsure difficile avec un médicament ou une infirmerie. Mesures entre accolades : avant ces réglages.
// Remesuré le 2026-11-05 (docs/equilibre.md, « Médicaments et zerbaz ») : trousses de secours dans les fouilles, plantes
// médicinales, tisanes, décoction et trousse pour une morsure. Mesures entre chevrons : avant ces ajouts.
// Remesuré le 2026-11-13 (docs/equilibre.md, « Rééquilibrage ») après les quatre lots et leur rééquilibrage (simulateur : repos des
// morts, gaz hors du score des sites ; esprit : au fond à 0, réconfort à 0 tous les 14 jours ; glanage 0,055). Mesures entre
// doubles crochets : après la fusion, avant le rééquilibrage. Les bornes ne changent pas.
import { test } from "node:test";
import assert from "node:assert/strict";
import { simuler, mesurer, jouerPartie, chargerContenu, PARTIES_RAPIDE, scoreSiteEnracine, scoreSiteNomade, STOCKS_NON_JOUES } from "./outils/simuler-parties.mjs";
import * as L from "../systems/lakour-survie/logique/index.mjs";

const CAS = "passif-4,nomade-4,enracine-4,enracine-1";
const resultats = await simuler({ parties: PARTIES_RAPIDE, graine: "1", cas: CAS, fils: 4 });
const m = mesurer(resultats);
const cas = m.cas;
const part = (n, d) => n / Math.max(1, d);

test("équilibre : un groupe de 4 passif tient une à deux semaines (première faim J3–J20, fin médiane J8–J40)", () => {
  const c = cas["passif-4"]; // mesuré : première faim médiane J7, fin médiane J17 [[J8, J18]] ; avant : J7, J16 [les mêmes]
  assert.ok(c.premiereFaim >= 3 && c.premiereFaim <= 20, `première faim médiane J${c.premiereFaim}`);
  assert.ok(c.mediane >= 8 && c.mediane <= 40, `fin médiane J${c.mediane}`);
});

test("équilibre : l'enraciné à 4 tient 200 jours le plus souvent, devient autonome vers J25–J110, et reste menacé", () => {
  const c = cas["enracine-4"]; // mesuré : 18/20 vivants à J200, 14/20 autonomes (médiane J60), 3,9 assauts par mois dont 2,1 sérieux
  // [[15/20, 11/20 (J46), 4,2 dont 2,4]] ; avant : 15/20 vivants à J200, 12/20 autonomes (médiane J57), 4,3 assauts par mois dont 2,5 sérieux
  // <14/20, 14/20 (J61), 4,6 dont 2,8>
  // {18/20, 13/20 (J61), 4,0 dont 2,8} [13/20, 15/20 (J63), 5,6 dont 3,8]
  assert.ok(part(c.survie200, c.parties) >= 0.4, `${c.survie200}/${c.parties} vivants à J200`);
  assert.ok(part(c.autonomie, c.parties) >= 0.4, `${c.autonomie}/${c.parties} autonomes`);
  assert.ok(c.autonomieMediane >= 25 && c.autonomieMediane <= 110, `autonomie médiane J${c.autonomieMediane}`);
  assert.ok(c.serieuxParMoisApres30 >= 0.5, `${c.serieuxParMoisApres30} assaut sérieux par mois après J30`);
  assert.ok(c.assautsParMoisApres30 <= 12, `${c.assautsParMoisApres30} assauts par mois après J30`);
});

test("équilibre : le nomade à 4 tient quatre mois, déménage, et finit par manquer après J90", () => {
  // mesuré (2026-11-13, après rééquilibrage) : 18/20 vivants à J200, 6,1 déménagements, 2 fins sur 2 après J90 ; sur 40 tirages de
  // 20 parties (graines 1 à 40, docs/equilibre.md, « Rééquilibrage ») : 667/800 vivants (83 %), 2 tirages hors des bornes, comme
  // avant les lots (680/800, 2) [[17/20, 6,7 déménagements ; 40 tirages : 708/800, 4 hors des bornes]]
  // avant : 19/20 vivants à J200 (81/100 sur 100 parties, l'enraciné 84/100), 6,8 déménagements, 1 fin sur 1 après J90
  // <17/20 (80/100, l'enraciné 79/100), 6,4 déménagements, 3 fins sur 3>. Borne de survie 0,95 au lieu de 0,9 (2026-11-05) : sur
  // 100 parties, le nomade n'a pas bougé (80 → 81 %) ; 19/20 dans ces 20 parties est le hasard d'un petit échantillon (les
  // trousses trouvées changent le tirage). Sur un an, il manque toujours : 9/40 vivants à J365, fin médiane J246.
  // Le glanage de passage le nourrit tant qu'il trouve des alentours frais : il ne meurt plus vers J160 (fin médiane d'un an :
  // J254, 10/40 vivants à J365 dans les parties longues, l'enraciné à 4 17/40), et il reste plus longtemps là où la nature est
  // intacte (6 à 7 déménagements au lieu de 33 à 37 départs affamés) : bornes 0,9 (au lieu de 0,85) et 4 (au lieu de 8).
  // {2/20, J170, 36 déménagements} [10/20 vivants à J200, 30 déménagements, 9 fins sur 10 après J90 : le jour gratuit de chaque
  // départ]
  const c = cas["nomade-4"];
  assert.ok(c.mediane >= 120, `fin médiane J${c.mediane}`);
  assert.ok(part(c.survie200, c.parties) <= 0.95, `${c.survie200}/${c.parties} vivants à J200`);
  assert.ok(c.demenagements >= 4, `${c.demenagements} déménagements par partie`);
  const fins = resultats.filter(r => r.strategie === "nomade" && r.membres === 4 && r.fin !== "vivants");
  assert.ok(part(fins.filter(r => r.jours > 90).length, fins.length) >= 0.5, `${fins.filter(r => r.jours > 90).length}/${fins.length} fins après J90`);
});

test("équilibre : le solo enraciné est viable mais tendu", () => {
  const c = cas["enracine-1"]; // mesuré : 10/20 vivants à J200, médiane J200 [[7/20, J164]] ; avant : 11/20 <10/20> {10/20} [5/20, J161]
  assert.ok(part(c.survie200, c.parties) >= 0.05 && part(c.survie200, c.parties) <= 0.85, `${c.survie200}/${c.parties} vivants à J200`);
  assert.ok(c.mediane >= 60, `médiane J${c.mediane}`);
  assert.ok(cas["enracine-4"].mediane >= c.mediane, "à quatre, on tient au moins aussi longtemps que seul");
});

test("équilibre : après J90, les Hauts sont plus durs que les Bas (Livides conservés par le froid)", () => {
  const { bas, hauts } = m.hautsBas; // mesuré : Hauts 3,2 assauts par mois, Bas 2,5 [[3,3 et 2,9]] ; avant : 3,2 et 2,1 <3,3 et 2,2> {3,3 et 2,2} [5,0 et 2,6]
  assert.ok(bas.joursAbri > 300 && hauts.joursAbri > 300, "assez de jours d'abri de part et d'autre");
  assert.ok(hauts.assautsParMois > bas.assautsParMois, `Hauts ${hauts.assautsParMois} > Bas ${bas.assautsParMois} assauts par mois`);
});

test("équilibre : même graine, même partie (le simulateur est déterministe)", () => {
  const contenu = chargerContenu();
  const options = { strategie: "mixte", membres: 2, region: "saint-leu", graine: "determinisme", jours: 60 };
  const a = jouerPartie(contenu, options), b = jouerPartie(contenu, options);
  assert.deepEqual({ ...a, journal: undefined }, { ...b, journal: undefined });
});

test("simulateur (rééquilibrage du 2026-11-13) : ce qu'il ne joue pas ne fait pas choisir un site ; il donne le repos à ses morts", () => {
  const contenu = chargerContenu();
  const idx = L.indexer(contenu);
  // Les 13 kg de gaz sous l'évier faisaient passer une maison devant un meilleur site (première faim de l'enraciné seul J21 → J78).
  const region = idx.regions.get("saint-denis"), site = idx.sites.get("maison-du-brule");
  assert.ok(Number(site.stocks.gaz) > 0, "la maison a du gaz");
  const sans = { ...site, stocks: Object.fromEntries(Object.entries(site.stocks).filter(([r]) => !STOCKS_NON_JOUES.includes(r))) };
  assert.equal(scoreSiteEnracine(site, region, 1), scoreSiteEnracine(sans, region, 1));
  assert.equal(scoreSiteNomade(site, region), scoreSiteNomade(sans, region));
  // Le deuil (plafond du moral −1 pour tous) ne pèse plus jusqu'à la fin de la partie : le soir, à l'abri, on donne le repos.
  const morts = resultats.filter(r => r.strategie !== "passif");
  assert.ok(morts.reduce((t, r) => t + r.repos, 0) > 0, "des morts ont reçu le repos");
});
