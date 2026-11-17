// Lot « corps » (contrat §19) : la logique pure du sommeil, du bivouac, des chutes, de l'hygiène, des symptômes et du bouclier
// (logique/corps.mjs, maladies.mjs), et ses crochets dans avancer (etat.mjs), bilanAbri (abri.mjs), resoudreCombat (actions.mjs),
// avec le VRAI contenu de lakour-fenoir.   Lancer : npm run essais
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import * as L from "../systems/lakour-survie/logique/index.mjs";
import { normaliserContenu } from "../systems/lakour-survie/scripts/registre.mjs";

const contenu = normaliserContenu(JSON.parse(readFileSync(new URL("../modules/lakour-fenoir/assets/donnees.json", import.meta.url), "utf8")));
const def = cle => contenu.afflictions.find(a => a.cle === cle);
const suite = valeurs => { let i = 0; return () => valeurs[i++ % valeurs.length]; };

test("sommeil : en manque après 3 quarts, épuisé après 4 (−1 dé), terrassé à 7 (−2 dés, il s'endort de force)", () => {
  assert.equal(L.etatSommeil(0), "repose");
  assert.equal(L.etatSommeil(3), "en-manque");
  assert.equal(L.etatSommeil(4), "epuise");
  assert.equal(L.etatSommeil(7), "terrasse");
  let s = L.survivantNeuf({});
  const evs = [];
  for (let i = 0; i < 7; i++) { const r = L.quartDeSommeil(s, { dort: null }); s = r.system; evs.push(...r.evenements.map(e => e.cle)); }
  assert.equal(s.veille, 7);
  assert.deepEqual(evs, ["epuise", "endormi"]);
  assert.equal(L.malusEtat(s).sommeil, 2);
  // Terrassé : le quart suivant, il dort de force, au sol.
  const r = L.quartDeSommeil(s, { dort: null });
  assert.equal(r.dort, "sol");
  assert.equal(r.force, true);
  assert.equal(r.system.veille, 5);
});

test("sommeil : un quart efface 4 à l'abri, 3 au bivouac, 2 au sol ; l'insomnie un de moins ; fatigue et sommeil au plus −2 dés", () => {
  const s = { ...L.survivantNeuf({}), veille: 6 };
  assert.equal(L.quartDeSommeil(s, { dort: "abri" }).system.veille, 2);
  assert.equal(L.quartDeSommeil(s, { dort: "bivouac" }).system.veille, 3);
  assert.equal(L.quartDeSommeil(s, { dort: "sol" }).system.veille, 4);
  assert.equal(L.quartDeSommeil(s, { dort: "abri", insomnie: true }).system.veille, 3);
  assert.equal(L.dormir(s, { quarts: 2, lieu: "sol" }).veille, 2);
  const epuise = { ...L.survivantNeuf({ fatigue: 5 }), veille: 7 };
  assert.equal(L.malusEtat(epuise).fatigue + L.malusEtat(epuise).sommeil, 2, "au plus −2 dés ensemble");
  assert.equal(L.malusEtat({ ...L.survivantNeuf({ fatigue: 3 }), veille: 4 }).total, 2);
  assert.equal(L.malusEtat(L.survivantNeuf({})).sommeil, 0, "une fiche d'avant (sans veille) : rien");
});

test("sommeil : qui dort, et où (lieuDeSommeil)", () => {
  assert.equal(L.lieuDeSommeil({ nuit: true, aLAbri: true }), "abri");
  assert.equal(L.lieuDeSommeil({ nuit: true, aLAbri: true, garde: true }), null, "la garde veille");
  assert.equal(L.lieuDeSommeil({ matin: true, aLAbri: true, garde: true }), "abri", "la garde dort le matin");
  assert.equal(L.lieuDeSommeil({ matin: true, aLAbri: true, veille: 4 }), "abri", "qui n'a pas dormi de la nuit dort le matin");
  assert.equal(L.lieuDeSommeil({ matin: true, aLAbri: true, veille: 0 }), null);
  assert.equal(L.lieuDeSommeil({ nuit: true, enRoute: true }), null, "en route, la nuit, on marche");
  assert.equal(L.lieuDeSommeil({ nuit: true, bivouac: true }), "bivouac");
  assert.equal(L.lieuDeSommeil({ nuit: true }), "sol");
  assert.equal(L.lieuDeSommeil({ nuit: true, bivouac: true, lieu: "sol" }), "sol", "un endroit dangereux : comme au sol");
  assert.equal(L.lieuDeSommeil({ nuit: true, aLAbri: true, eveille: true }), null, "une veillée");
  assert.equal(L.lieuDeSommeil({ nuit: false, enRoute: true, dort: true, bivouac: true }), "bivouac");
  assert.equal(L.lieuDeSommeil({ repos: true, aLAbri: true }), "abri");
  assert.equal(L.lieuDeSommeil({ veille: 4, bivouac: true }), "bivouac", "épuisé, on rattrape dès qu'on s'arrête");
  assert.equal(L.lieuDeSommeil({ veille: 4, aLAbri: true }), "abri");
  assert.equal(L.lieuDeSommeil({ veille: 4, enRoute: true }), null, "pas en marchant");
  assert.equal(L.lieuDeSommeil({ veille: 4, aLAbri: true, eveille: true }), null);
});

test("bivouac : sûr, exposé, dangereux, en mots ; on dort mal dans un endroit dangereux", () => {
  assert.deepEqual(L.jugerBivouac({ pente: "plat", couvert: true }), { jugement: "sur", raisons: [] });
  const e = L.jugerBivouac({ route: true, feu: true });
  assert.equal(e.jugement, "expose");
  assert.deepEqual(e.raisons, ["route", "feu"]);
  assert.equal(L.jugerBivouac({ ravine: true, couvert: true }).jugement, "dangereux");
  assert.equal(L.jugerBivouac({ livides: true }).jugement, "dangereux");
  assert.equal(L.jugerBivouac({ couvert: false }).jugement, "expose");
  assert.equal(L.sommeilAuBivouac("dangereux", true), "sol");
  assert.equal(L.sommeilAuBivouac("sur", true), "bivouac");
  assert.equal(L.sommeilAuBivouac("sur", false), "sol");
  assert.ok(L.BIVOUAC.rencontre.dangereux > L.BIVOUAC.rencontre.expose && L.BIVOUAC.rencontre.expose > L.BIVOUAC.rencontre.sur);
});

test("chutes : 3 m une blessure, une de plus tous les 3 m, mourant à 12 m, mort à 25 m ; l'eau amortit ; se recevoir ; le Livide rampe", () => {
  assert.equal(L.chute({ hauteur: 2.9 }).blessures, 0);
  assert.equal(L.chute({ hauteur: 3 }).blessures, 1);
  assert.equal(L.chute({ hauteur: 6 }).blessures, 2);
  assert.equal(L.chute({ hauteur: 9 }).blessures, 3);
  assert.equal(L.chute({ hauteur: 12 }).mourant, true);
  assert.equal(L.chute({ hauteur: 24.9 }).mort, false);
  assert.equal(L.chute({ hauteur: 25 }).mort, true);
  assert.equal(L.chute({ hauteur: 20, eau: 1.5 }).blessures, 1, "1,5 m d'eau retire 15 m");
  assert.equal(L.chute({ hauteur: 9, eau: 0.75 }).blessures, 0, "75 cm d'eau : 7,5 m");
  assert.equal(L.chute({ hauteur: 6 }).fracture, true);
  const recu = L.chute({ hauteur: 6, reception: { reussite: true } });
  assert.equal(recu.blessures, 1);
  assert.equal(recu.fracture, false);
  assert.equal(L.chute({ hauteur: 13, reception: { reussite: true } }).blessures, 4, "se recevoir ne sauve pas d'une chute qui rend mourant");
  assert.deepEqual(L.chuteDeLivide({ hauteur: 12 }), { hauteur: 12, chancelle: false, rampe: true });
  assert.equal(L.chuteDeLivide({ hauteur: 4 }).chancelle, true);
  const s = L.appliquerChute(L.survivantNeuf({ blessures: 1 }), L.chute({ hauteur: 30 }));
  assert.equal(s.vivant, false);
  assert.equal(L.appliquerChute(L.survivantNeuf({ blessures: 3 }), L.chute({ hauteur: 6 })).blessures, 4);
});

test("hygiène : la souillure monte avec les gens, moins avec des latrines, s'efface avec les jours et la pluie ; l'insalubrité", () => {
  const jours = (n, o) => { let s = 0; for (let i = 0; i < n; i++) s = L.souillureDuJour({ souillure: s, ...o }); return s; };
  assert.equal(L.insalubrite(jours(2, { personnes: 4 })), 1, "deux jours sans latrines : ordinaire");
  assert.equal(L.insalubrite(jours(5, { personnes: 4 })), 1);
  assert.equal(L.insalubrite(jours(6, { personnes: 4 })), 2, "six jours au sec : sale");
  assert.equal(L.insalubrite(jours(60, { personnes: 4 })), 2, "à quatre, jamais insalubre");
  assert.equal(L.insalubrite(jours(9, { personnes: 6 })), 3, "à six, neuf jours : insalubre");
  assert.equal(L.insalubrite(jours(60, { personnes: 6, latrines: 1 })), 1, "à six avec des feuillées : ordinaire");
  assert.equal(L.insalubrite(jours(60, { personnes: 4, latrines: 1 })), 1, "des feuillées : ordinaire");
  assert.equal(L.insalubrite(jours(60, { personnes: 4, latrines: 2 })), 0, "des latrines sèches : propre");
  assert.ok(jours(60, { personnes: 4, pluie: 1 }) < jours(60, { personnes: 4 }) / 3, "la pluie lave");
  assert.ok(jours(20, { personnes: 4, surpeuplement: 3 }) > jours(20, { personnes: 4 }), "trop de monde salit plus");
  assert.equal(L.souillureDuJour({ souillure: 10, personnes: 0 }), 8.5, "sans personne, elle s'efface");
  assert.deepEqual(L.menage(10, { quarts: 1, bras: 2 }), { souillure: 2, retire: 8 });
  assert.equal(L.niveauHygiene(1, 2), 3);
  assert.equal(L.niveauHygiene(3, 2), 3);
  assert.equal(L.salubre(3, 0), true);
  assert.equal(L.salubre(3, 1), false);
  assert.equal(L.risqueInsalubrite(1), 0);
  assert.equal(L.risqueInsalubrite(3, 2), L.HYGIENE.risque[3] * 0.6);
});

test("hygiène : le tirage de l'insalubrité suit les poids du contenu ; la plaie infectée seulement chez un blessé ; rien d'un abri propre", () => {
  const poids = Object.fromEntries(contenu.afflictions.filter(a => a.insalubrite > 0).map(a => [a.cle, a.insalubrite]));
  assert.deepEqual(poids, { "gastro-enterite": 6, gale: 2, "plaie-infectee": 3, leptospirose: 1 });
  let appels = 0;
  assert.deepEqual(L.tirerInsalubrite([{ id: "a", system: {} }], contenu.afflictions, { niveau: 1 }, () => { appels++; return 0; }), []);
  assert.equal(appels, 0, "un abri ordinaire ne tire rien");
  const compte = {};
  const h = L.creerHasard("insalubre");
  for (let i = 0; i < 4000; i++) for (const n of L.tirerInsalubrite([{ id: "a", system: { blessures: 0, afflictions: [] } }], contenu.afflictions, { niveau: 3 }, h)) compte[n.cle] = (compte[n.cle] ?? 0) + 1;
  assert.equal(compte["plaie-infectee"], undefined, "pas de plaie qui s'infecte sans blessure");
  assert.ok(compte["gastro-enterite"] > compte.gale && compte.gale > (compte.leptospirose ?? 0));
  const total = Object.values(compte).reduce((a, b) => a + b, 0);
  assert.ok(total > 4000 * 0.01 && total < 4000 * 0.02, `insalubre : 1,5 % par jour (${total} / 4000)`);
});

test("abri : l'hygiène des installations (latrines et toilette, sœurs), l'insalubrité au bilan, la souillure de la journée, l'odeur d'un abri sale", () => {
  const abri = { site: "case-de-bellemene", region: contenu.sites.find(s => s.cle === "case-de-bellemene")?.region, stocks: { eau: 40, nourriture: 40 }, souillure: 16 };
  const inst = (cle, niveau = 1) => L.instanceInstallation(cle, niveau);
  let b = L.bilanAbri(abri, [], contenu, { personnes: 4 });
  assert.equal(b.hygiene, 0);
  assert.equal(b.insalubrite, 2);
  assert.ok(b.odeurSources.includes("souillure"), "un abri sale sent");
  b = L.bilanAbri(abri, [inst("feuillees"), inst("latrines-seches"), inst("lavoir")], contenu, { personnes: 4 });
  assert.equal(b.latrines, 2, "les latrines sèches passent avant les feuillées");
  assert.equal(b.toilette, 1);
  assert.equal(b.hygiene, 3);
  assert.ok(b.secours.some(x => x.cle === "feuillees"));
  const sansEau = L.bilanAbri({ ...abri, stocks: { eau: 0, nourriture: 40 } }, [inst("fosse-maconnee"), inst("feuillees")], contenu, { personnes: 4 });
  assert.equal(sansEau.latrines, 1, "sans eau, la fosse s'arrête et les feuillées prennent le relais");
  const j = L.journeeAbri(abri, [inst("latrines-seches")], contenu, { personnes: 4 });
  assert.ok(j.abri.souillure < 16, "avec des latrines sèches, la souillure baisse");
  const propre = L.bilanAbri({ ...abri, souillure: 0 }, [], contenu, { personnes: 4 });
  assert.ok(!propre.odeurSources.includes("souillure"));
});

test("symptômes : ce que voient les joueurs (le nom seulement si le groupe reconnaît le mal), le Gris par ses signes, la morsure pansée qui se tait", () => {
  let s = L.contracter(L.survivantNeuf({}), def("dengue"), 0);
  s = L.evoluerAfflictions(s, contenu.afflictions, 6).system;
  let vu = L.ceQueVoientLesJoueurs(s, contenu, { savoirs: [] });
  assert.equal(vu.maux.length, 1);
  assert.equal(vu.maux[0].nom, "");
  assert.deepEqual(vu.maux[0].symptomes, ["fievre", "maux-de-tete", "courbatures", "eruption"]);
  assert.equal(L.ceQueVoientLesJoueurs(s, contenu, { savoirs: ["zerbaz"] }).maux[0].nom, "Dengue");
  const f = L.contracter(L.survivantNeuf({}), def("fracture"), 0);
  assert.equal(L.ceQueVoientLesJoueurs(f, contenu).maux[0].reconnue, true, "une fracture se voit");
  const incube = L.contracter(L.survivantNeuf({}), def("dengue"), 0);
  assert.equal(L.ceQueVoientLesJoueurs(incube, contenu).maux.length, 0, "une maladie qui couve ne se voit pas");
  // Le Gris.
  const mordu = { ...L.infecter(L.survivantNeuf({}), 10), morsure: { quart: 10 } };
  assert.equal(L.ceQueVoientLesJoueurs(mordu, contenu, { quart: 11 }).gris, null, "la morsure pansée se tait");
  assert.deepEqual(L.ceQueVoientLesJoueurs(mordu, contenu, { quart: 11 }).morsure, { quart: 10 });
  const plusTard = { ...mordu, infection: { ...mordu.infection, stade: 2 } };
  vu = L.ceQueVoientLesJoueurs(plusTard, contenu, { quart: 14 });
  assert.deepEqual(vu.gris.symptomes, ["fievre", "frissons", "peau-grise"]);
  assert.equal(vu.gris.reconnu, false);
  assert.equal(L.ceQueVoientLesJoueurs(plusTard, contenu, { quart: 14, grisConnu: true }).gris.reconnu, true, "avoir vu un mordu se relever");
  assert.equal(L.ceQueVoientLesJoueurs(plusTard, contenu, { quart: 14, savoirs: ["premiers-secours-avances"] }).gris.reconnu, true);
  assert.equal(L.symptomesDuGris(contenu, 9).length, 3, "au-delà du dernier stade : le dernier");
  assert.equal(L.nomSymptome(contenu, "peau-grise"), "Peau qui grise");
  // Un contenu d'avant le lot : les noms comme avant.
  assert.equal(L.reconnue({ cle: "x" }, []), true);
  assert.equal(L.grisReconnu({}, {}), true);
});

test("symptômes : plusieurs points à la fois (l'insomnie ; le moral d'un stade, à raconter, n'est pas appliqué)", () => {
  let s = L.survivantNeuf({ moral: 4 });
  s = L.contracter(s, def("choc-d-une-perte"), 0);
  assert.equal(s.moral, 4, "le moral d'un stade est au MJ (mesuré : il faisait partir les nomades)");
  assert.equal(L.moralDuStade(def("choc-d-une-perte"), "active"), 1);
  assert.equal(L.insomnieDe(s, contenu.afflictions), true);
  let d = L.contracter(L.survivantNeuf({ moral: 4 }), def("dengue"), 0);
  d = L.evoluerAfflictions(d, contenu.afflictions, 5).system;
  assert.equal(L.insomnieDe(d, contenu.afflictions), false, "la dengue déclarée : on dort");
  d = L.evoluerAfflictions(d, contenu.afflictions, 9).system;
  assert.equal(d.afflictions[0].stade, "aggravee");
  assert.equal(d.moral, 4);
  assert.equal(L.moralDuStade(def("dengue"), "aggravee"), 1);
  assert.equal(L.insomnieDe(d, contenu.afflictions), true, "aggravée : elle empêche de dormir");
});

test("maladies : un abri salubre divise le risque de l'eau par deux et la contagion par 4/3 ; rien d'autre ne bouge", () => {
  const g = def("gastro-enterite");
  assert.equal(L.facteurRisque(g, { salubre: true }), L.facteurRisque(g, {}) * 0.5);
  assert.equal(L.facteurRisque(def("dengue"), { salubre: true }), L.facteurRisque(def("dengue"), {}));
});

test("bouclier : chaque touche d'un Livide parée sur 5-6 (tôle) ; une touche parée ne blesse ni ne mord ; sans bouclier, le même hasard", () => {
  assert.deepEqual(L.parer(3, 5, suite([0.9, 0.1, 0.7])), { parees: 2, passent: 1, des: [6, 1, 5] });
  assert.deepEqual(L.parer(2, 0, () => { throw new Error("rien à tirer"); }), { parees: 0, passent: 2, des: [] });
  const bouclier = contenu.equipements.find(e => e.cle === "bouclier-de-tole");
  assert.equal(bouclier.parade, 5);
  assert.equal(L.paradeDe([{ parade: 5 }, { parade: 4 }, {}]), 4);
  assert.equal(L.paradeDe([{}]), 0);
  // Combat : un Livide qui touche (6), la parade sur 6, rien ne passe.
  const des = [0.0, 0.99, 0.99];   // test de combat (1 dé : 1, aucun succès) ; attaque : 6 ; parade : 6
  const r = L.resoudreCombat({ niveau: 0, livides: 1, parade: 5, hasard: suite(des) });
  assert.equal(r.parees, 1);
  assert.equal(r.touches, 0);
  assert.equal(r.morsures, 0);
  const sans = L.resoudreCombat({ niveau: 0, livides: 1, hasard: suite([0.0, 0.99, 0.0]) });
  assert.equal(sans.touches, 1, "sans bouclier : la touche passe (et le dé suivant est celui de la morsure)");
  assert.deepEqual(sans.desParade, []);
  // Les animaux ne sont pas parés (le bouclier du 3D vaut contre les Livides).
  const chien = L.resoudreCombat({ niveau: 0, adversaires: [{ nombre: 1, des: 1, resistance: 1, type: "animal" }], parade: 5, hasard: suite([0.0, 0.99, 0.99]) });
  assert.equal(chien.parees, 0);
});

test("avancer : la nuit à l'abri efface la journée ; la garde veille puis dort le matin ; en route, la nuit, on marche et l'on est épuisé", () => {
  const { monde, etat } = L.demarrerPartie({ contenu, graine: "corps|sommeil", region: "le-tampon", membres: ["a", "b"] });
  const ins = L.installerAbri(monde, contenu, { site: contenu.regions.find(r => r.cle === "le-tampon").sites[0], jour: 0, quart: 0 });
  const abri = { id: "abri", system: ins.abri, installations: ins.installations };
  const e = { ...etat, groupe: { ...etat.groupe, abri: "abri", region: ins.abri.region } };
  const survivants = [{ id: "a", system: L.survivantNeuf({}) }, { id: "b", system: L.survivantNeuf({ tache: "garde" }) }];
  let r = L.avancer({ etat: e, monde: ins.monde, contenu, quarts: 3, survivants, abri });
  const sys = id => r.acteurs.survivants.find(s => s.id === id)?.system;
  assert.equal(sys("a").veille, 3, "matin, après-midi, soir : en manque le soir");
  r = L.avancer({ etat: r.etat, monde: r.monde, contenu, quarts: 1, survivants: r.acteurs.survivants.map(s => ({ id: s.id, system: s.system })), abri: r.acteurs.abri });
  assert.equal(sys("a").veille, 0, "la nuit à l'abri");
  assert.equal(sys("b").veille, 3, "la garde a veillé (elle avait dormi le matin)");
  r = L.avancer({ etat: r.etat, monde: r.monde, contenu, quarts: 1, survivants: r.acteurs.survivants.map(s => ({ id: s.id, system: s.system })), abri: r.acteurs.abri });
  assert.equal(sys("b").veille, 0, "la garde dort le matin");
  // En route la nuit : on marche.
  const route = { ...e, groupe: { ...e.groupe, abri: "", enRoute: { de: "le-tampon", vers: "le-tampon", reste: 8 } } };
  const r2 = L.avancer({ etat: route, monde: ins.monde, contenu, quarts: 4, survivants: [{ id: "a", system: L.survivantNeuf({}) }], abri: null });
  assert.equal(r2.acteurs.survivants[0].system.veille, 4);
  assert.ok(r2.etat.journal.some(j => j.cle === "survivant-epuise"));
  // Arrêté dehors, avec de quoi bivouaquer : on dort, et la nuit retire 1 de fatigue.
  const dehors = { ...e, groupe: { ...e.groupe, abri: "" } };
  const r3 = L.avancer({ etat: dehors, monde: ins.monde, contenu, quarts: 4, survivants: [{ id: "a", system: L.survivantNeuf({ fatigue: 2 }) }], abri: null, options: { bivouac: true } });
  assert.equal(r3.acteurs.survivants[0].system.veille, 0);
  assert.equal(r3.acteurs.survivants[0].system.fatigue, 1);
  // Une veillée : eveilles.
  const r4 = L.avancer({ etat: e, monde: ins.monde, contenu, quarts: 4, survivants: [{ id: "a", system: L.survivantNeuf({}) }], abri, options: { eveilles: ["a"] } });
  assert.equal(r4.acteurs.survivants[0].system.veille, 4);
});

test("avancer : la souillure de l'abri monte jour après jour ; un mal inconnu se dit par ses signes au journal public, son nom au journal secret", () => {
  const { monde, etat } = L.demarrerPartie({ contenu, graine: "corps|hygiene", region: "saint-paul", membres: ["a", "b", "c", "d"] });
  const site = contenu.regions.find(r => r.cle === "saint-paul").sites[0];
  const ins = L.installerAbri(monde, contenu, { site, jour: 0, quart: 0 });
  const abri = { id: "abri", system: { ...ins.abri, stocks: { ...ins.abri.stocks, eau: 200, nourriture: 200 } }, installations: ins.installations };
  const e = { ...etat, groupe: { ...etat.groupe, abri: "abri", region: ins.abri.region } };
  const survivants = ["a", "b", "c", "d"].map(id => ({ id, system: L.survivantNeuf({}) }));
  survivants[0].system = L.contracter(survivants[0].system, def("gastro-enterite"), 0);
  const r = L.avancer({ etat: e, monde: ins.monde, contenu, quarts: 4 * 6, survivants, abri });
  assert.ok(r.acteurs.abri.system.souillure > 5, `six jours à quatre sans latrines (${r.acteurs.abri.system.souillure})`);
  assert.ok(r.bilan.insalubrite >= 1);
  const signes = r.etat.journal.find(j => j.cle === "survivant-declaree-signes");
  assert.ok(signes, "la gastro déclarée se dit par ses signes");
  assert.ok(!JSON.stringify(signes).includes("Gastro"), "sans son nom");
  assert.ok(r.monde.journalSecret.some(j => j.cle === "survivant-declaree" && j.params.affliction === "Gastro-entérite"));
});

test("avancer : le Gris se dit par ses signes tant que le groupe ne sait pas le nommer ; un mordu qui se relève le lui apprend", () => {
  const { monde, etat } = L.demarrerPartie({ contenu, graine: "corps|gris", region: "le-tampon", membres: ["a", "b"] });
  const survivants = [{ id: "a", system: L.infecter(L.survivantNeuf({}), 0) }, { id: "b", system: L.survivantNeuf({}) }];
  const r = L.avancer({ etat, monde, contenu, quarts: 14, survivants, abri: null });
  assert.ok(r.etat.journal.some(j => j.cle === "survivant-gris-signes"));
  assert.ok(!r.etat.journal.some(j => j.cle === "survivant-infection"), "le stade va au MJ");
  assert.ok(r.monde.journalSecret.some(j => j.cle === "survivant-infection"));
  assert.ok(r.etat.journal.some(j => j.cle === "survivant-mort-fievre"));
  assert.equal(r.etat.groupe.grisConnu, true, "il s'est relevé devant eux");
});

test("fêtes : le grand ménage (effet hygiene) remet l'abri à neuf", () => {
  const etat = { ...L.etatVide(), groupe: { ...L.etatVide().groupe, membres: ["a"] } };
  const r = L.feter(etat, { system: { stocks: { nourriture: 20 }, souillure: 30 } }, { fete: "nouvel-an-chinois", annee: 2027, survivants: [{ id: "a", system: L.survivantNeuf({}) }],
    effet: { moral: 1, hygiene: { jours: 10 } } });
  assert.equal(r.ok, true);
  assert.equal(r.abri.system.souillure, 0);
});
