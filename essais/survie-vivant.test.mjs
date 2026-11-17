// Lot 8 « Le vivant de l'abri » (contrat §27) : la logique pure de l'élevage, des cultures hors-sol et des bêtes de l'île
// (logique/vivant.mjs), le chien qui prévient sans attirer (savoirs.mjs), et leurs crochets dans bilanAbri, journeeAbri (abri.mjs) et
// avancer (etat.mjs), avec le VRAI contenu de lakour-fenoir.   Lancer : npm run essais
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import * as L from "../systems/lakour-survie/logique/index.mjs";
import { normaliserContenu } from "../systems/lakour-survie/scripts/registre.mjs";

const contenu = normaliserContenu(JSON.parse(readFileSync(new URL("../modules/lakour-fenoir/assets/donnees.json", import.meta.url), "utf8")));
const def = cle => contenu.installations.find(i => i.cle === cle);
const espece = cle => L.especeDe(contenu, cle);
const toujours = x => () => x;
// Un abri du Tampon (1 000 m) sur la ferme de la Plaine des Cafres (terre, citerne), stocks donnés.
function abriDe(installations, { stocks = { eau: 40, nourriture: 40, graines: 10, plantes: 4 }, vivant, region = "le-tampon", site = "ferme-de-la-plaine-des-cafres" } = {}) {
  return { site, region, stocks, nature: L.natureInitiale(L.regionDe(contenu, region)), sol: 3, ...(vivant ? { vivant } : {}) };
}
const inst = (cle, niveau = 1, extra = {}) => L.instanceInstallation(cle, niveau, { termineLe: -365, ...extra });

test("vivant : un cheptel d'avant le lot (ou trouvé sur un site) est plein ; celui que le groupe vient d'achever a son cheptel de départ", () => {
  const bc = def("basse-cour");
  const vieux = L.etatCheptel({}, inst("basse-cour"), bc, contenu, { jour: 40 });
  assert.deepEqual([vieux.espece, vieux.tetes, vieux.sante, vieux.malade], ["poule", 4, 3, null]);
  const neuf = L.etatCheptel({}, inst("basse-cour", 1, { termineLe: 40 }), bc, contenu, { jour: 40 });
  assert.equal(neuf.tetes, 3, "trois poules au départ");
  assert.equal(L.etatCheptel({}, inst("soue-a-cochons", 1, { termineLe: 40 }), def("soue-a-cochons"), contenu, { jour: 40 }).tetes, 0, "la soue commence vide");
  assert.equal(L.etatCheptel({}, inst("etable", 1, { termineLe: 40 }), def("etable"), contenu, { jour: 40 }).tetes, 0, "l'étable aussi");
  // Ce qui est gardé l'emporte ; une installation sans vivant n'a pas de cheptel.
  assert.equal(L.etatCheptel({ vivant: { "basse-cour": { tetes: 7, sante: 1 } } }, inst("basse-cour"), bc, contenu, { jour: 40 }).tetes, 7);
  assert.equal(L.etatCheptel({}, inst("potager"), def("potager"), contenu), null);
  // Le bassin à camarons : des camarons dans les Bas, des anguilles plus haut.
  assert.equal(L.etatCheptel({}, inst("bassin-a-camarons"), def("bassin-a-camarons"), contenu, { altitude: 250 }).espece, "camaron");
  assert.equal(L.etatCheptel({}, inst("bassin-a-camarons"), def("bassin-a-camarons"), contenu, { altitude: 1000 }).espece, "anguille");
});

test("vivant : la production de base ne change pas au plein ; moitié de têtes, moitié ; la vigueur suit la santé ; hors de son altitude, moitié", () => {
  const v = L.vivantDuNiveau(def("enclos-a-cabris"), 2);
  assert.deepEqual([v.places, v.plein], [6, 4]);
  const f = st => L.facteurCheptel({ tetes: 4, sante: 3, ...st }, v, espece("cabri")).facteur;
  assert.equal(f({}), 1);
  assert.equal(f({ tetes: 6 }), 1, "au-dessus du plein : pas plus");
  assert.equal(f({ tetes: 2 }), 0.5);
  assert.equal(f({ sante: 2 }), 1);
  assert.equal(f({ sante: 1 }), 0.5);
  assert.equal(f({ sante: 0 }), 0);
  assert.equal(L.facteurCheptel({ tetes: 20, sante: 3 }, L.vivantDuNiveau(def("bassin-a-tilapias"), 1), espece("tilapia"), { altitude: 1000 }).facteur, 0.5, "un tilapia au-dessus de 900 m");
  // Dans le bilan : l'enclos des cabris au niveau 2 (3 nourriture), deux cabris sur quatre, 1,5 arrondi.
  const insts = [inst("enclos-a-cabris", 2)];
  const eleveur = { travailleurs: { elevage: [{ niveau: 1 }] } };
  const plein = L.bilanAbri(abriDe(insts), insts, contenu, { jour: 100, personnes: 0, ...eleveur });
  assert.equal(plein.production.nourriture, 3, "inchangée au plein");
  const moitie = L.bilanAbri(abriDe(insts, { vivant: { "enclos-a-cabris": { tetes: 2, sante: 3 } } }), insts, contenu, { jour: 100, personnes: 0, ...eleveur });
  assert.equal(moitie.production.nourriture, 2);
  assert.equal(moitie.cheptels[0].tetes, 2);
  assert.equal(moitie.cheptels[0].places, 6);
  // Vide : il ne boit ni ne produit.
  const vide = L.bilanAbri(abriDe(insts, { vivant: { "enclos-a-cabris": { tetes: 0, sante: 3 } } }), insts, contenu, { jour: 100, personnes: 0 });
  assert.equal(vide.production.nourriture ?? 0, 0);
  assert.equal(vide.consommation.eau, 0, "un enclos vide ne boit pas");
  assert.equal(plein.consommation.eau, 1, "un enclos de cabris boit (décision de Jordan du 16 novembre)");
});

test("vivant : la pluie arrose ce qui pousse à ciel ouvert ; un cheptel qui a eu faim ou soif crie (+1 au bruit, +2 au plus)", () => {
  const insts = [inst("potager", 2), inst("serre", 1), inst("basse-cour")];
  const sec = L.bilanAbri(abriDe(insts), insts, contenu, { jour: 100, personnes: 0, pluie: 0 });
  const mouille = L.bilanAbri(abriDe(insts), insts, contenu, { jour: 100, personnes: 0, pluie: 0.75 });
  assert.equal(sec.consommation.eau, 2 + 1 + 0.5);
  assert.equal(mouille.consommation.eau, 1 + 0.5, "le potager ne prend pas d'eau un jour de pluie ; la serre, si");
  const criant = abriDe(insts, { vivant: { "basse-cour": { tetes: 4, sante: 2, manques: ["soif"] } } });
  assert.equal(L.bilanAbri(criant, insts, contenu, { jour: 100 }).bruit, sec.bruit + 1);
  assert.equal(L.criDuVivant({ vivant: { a: { tetes: 2, manques: ["faim"] }, b: { tetes: 2, manques: ["soif"] }, c: { tetes: 3, manques: ["soif"] } } }), 2);
  assert.equal(L.criDuVivant({ vivant: { a: { tetes: 0, manques: ["faim"] } } }), 0, "un enclos vide ne crie pas");
});

test("vivant : chaque manque ôte 1 de santé ; un jour sans mal en rend 1 ; à 0, un tiers meurt chaque jour", () => {
  const insts = [inst("basse-cour", 2)];
  const jour = (abri, bilan, conditions = {}) => L.journeeVivant({ abri, installations: insts, contenu, bilan, conditions: { jour: 50, personnes: 4, ...conditions } });
  // Soif : l'installation arrêtée faute d'eau.
  let r = jour(abriDe(insts, { vivant: { "basse-cour": { tetes: 9, sante: 3 } } }), { arrets: [{ cle: "basse-cour", raison: "eau" }] });
  assert.deepEqual([r.vivant["basse-cour"].sante, r.vivant["basse-cour"].manques], [2, ["soif"]]);
  assert.ok(r.evenements.some(x => x.cle === "vivant-soif"));
  // Soif et faim (les restes : le groupe a manqué de vivres) : −2.
  r = L.journeeVivant({ abri: abriDe(insts, { vivant: { "basse-cour": { tetes: 9, sante: 3 } } }), installations: insts, contenu, bilan: { arrets: [{ cle: "basse-cour", raison: "eau" }] },
    conditions: { jour: 50, personnes: 4 }, manqueNourriture: 4 });
  assert.equal(r.vivant["basse-cour"].sante, 1, "personne n'a mangé : plus de restes");
  // Une ration de moins pour quatre : on a cuisiné, il y a des épluchures.
  r = L.journeeVivant({ abri: abriDe(insts, { vivant: { "basse-cour": { tetes: 9, sante: 3 } } }), installations: insts, contenu, bilan: {}, conditions: { jour: 50, personnes: 4 }, manqueNourriture: 1 });
  assert.deepEqual(r.vivant["basse-cour"].manques, []);
  // À 0 : un tiers meurt (au moins une).
  r = jour(abriDe(insts, { vivant: { "basse-cour": { tetes: 9, sante: 1 } } }), { arrets: [{ cle: "basse-cour", raison: "eau" }] });
  assert.deepEqual([r.vivant["basse-cour"].sante, r.vivant["basse-cour"].tetes], [0, 6]);
  assert.ok(r.evenements.some(x => x.cle === "vivant-morts" && x.params.n === 3));
  r = jour(abriDe(insts, { vivant: { "basse-cour": { tetes: 1, sante: 0 } } }), { arrets: [{ cle: "basse-cour", raison: "eau" }] });
  assert.equal(r.vivant["basse-cour"].tetes, 0);
  assert.ok(r.evenements.some(x => x.cle === "vivant-vide"));
  // Un jour sans mal : +1.
  r = jour(abriDe(insts, { vivant: { "basse-cour": { tetes: 9, sante: 1 } } }), {});
  assert.equal(r.vivant["basse-cour"].sante, 2);
  // Personne à l'abri : pas de restes, les poules ont faim.
  r = jour(abriDe(insts, { vivant: { "basse-cour": { tetes: 9, sante: 3 } } }), {}, { personnes: 0 });
  assert.deepEqual(r.vivant["basse-cour"].manques, ["faim"]);
  // Éteinte (on ne s'en occupe plus) : personne ne la remplit, elles ont soif.
  const eteinte = [{ ...inst("basse-cour", 2), actif: false }];
  r = L.journeeVivant({ abri: abriDe(eteinte, { vivant: { "basse-cour": { tetes: 9, sante: 3 } } }), installations: eteinte, contenu, bilan: {}, conditions: { jour: 50, personnes: 4 } });
  assert.deepEqual(r.vivant["basse-cour"].manques, ["soif"]);
  // Surpopulation : plus de têtes que de places.
  r = jour(abriDe(insts, { vivant: { "basse-cour": { tetes: 14, sante: 3 } } }), {});
  assert.ok(r.vivant["basse-cour"].manques.includes("surpopulation"));
});

test("vivant : la faim selon ce que mange l'espèce (l'herbe sur un site sans terre, la solution sans compost)", () => {
  const cabris = [inst("enclos-a-cabris")];
  const beton = { ...abriDe(cabris, { vivant: { "enclos-a-cabris": { tetes: 2, sante: 3 } } }), site: "barre-du-chaudron", region: "saint-denis" };
  assert.equal(L.siteDe(contenu, "barre-du-chaudron").sol, 0);
  const r = L.journeeVivant({ abri: beton, installations: cabris, contenu, bilan: {}, conditions: { jour: 10, personnes: 2 } });
  assert.deepEqual(r.vivant["enclos-a-cabris"].manques, ["faim"], "sans terre et personne à l'élevage");
  const r2 = L.journeeVivant({ abri: beton, installations: cabris, contenu, bilan: {}, conditions: { jour: 10, personnes: 2, travailleurs: { elevage: [{ niveau: 1 }] } } });
  assert.deepEqual(r2.vivant["enclos-a-cabris"].manques, [], "quelqu'un coupe l'herbe ailleurs");
  const bacs = [inst("bacs-de-culture"), inst("compost")];
  const abri = abriDe(bacs, { vivant: { "bacs-de-culture": { tetes: 12, sante: 3, filtreLe: 10 } } });
  const sans = L.journeeVivant({ abri, installations: bacs, contenu, bilan: { actives: ["bacs-de-culture"] }, conditions: { jour: 10, personnes: 2 } });
  assert.deepEqual(sans.vivant["bacs-de-culture"].manques, ["faim"], "sans compost en service");
  const avec = L.journeeVivant({ abri, installations: bacs, contenu, bilan: { actives: ["bacs-de-culture", "compost"] }, conditions: { jour: 10, personnes: 2 } });
  assert.deepEqual(avec.vivant["bacs-de-culture"].manques, []);
});

test("vivant : l'eau sale passé le temps du filtre, sauf si quelqu'un est à la tâche ; deux jours sans pompe tuent l'aquaponie", () => {
  // Fusion de la vague 3 : le filtre est l'entretien du lot 7 (journeeOuvrages) ; son eau sale, le suivi « encrassé » de l'instance.
  const b0 = [inst("bassin-a-tilapias", 1, { suivi: { le: 0, negligence: 0, encrasse: false, vieLe: null } })];
  const seul = L.journeeOuvrages(b0, contenu, { jour: 25, bras: {} });
  assert.equal(seul.installations[0].suivi.encrasse, true, "passé vingt jours, personne à l'élevage : l'eau se salit");
  assert.ok(!seul.evenements.some(x => x.cle === "ouvrage-encrasse"), "le vivant le dit lui-même");
  assert.equal(seul.installations[0].etat ?? 0, 0, "une eau sale n'abîme pas le bassin");
  const b = seul.installations;
  const sale = L.journeeVivant({ abri: abriDe(b, { region: "sud-sauvage", vivant: { "bassin-a-tilapias": { tetes: 20, sante: 3 } } }), installations: b, contenu, bilan: {},
    conditions: { jour: 26, personnes: 2 } });
  assert.deepEqual(sale.vivant["bassin-a-tilapias"].manques, ["eau-sale"]);
  assert.ok(sale.evenements.some(x => x.cle === "vivant-eau-sale"));
  const cure = L.journeeOuvrages(b0, contenu, { jour: 25, bras: { elevage: 1 } });
  assert.equal(cure.installations[0].suivi.encrasse, false);
  assert.equal(cure.installations[0].suivi.le, 25, "l'éleveur l'a curé");
  const propre = L.journeeVivant({ abri: abriDe(cure.installations, { region: "sud-sauvage", vivant: { "bassin-a-tilapias": { tetes: 20, sante: 3 } } }),
    installations: cure.installations, contenu, bilan: {}, conditions: { jour: 26, personnes: 2 } });
  assert.deepEqual(propre.vivant["bassin-a-tilapias"].manques, []);
  assert.equal(L.cheptelsDe({ region: "sud-sauvage" }, cure.installations, contenu, { jour: 26 })[0].filtre, 19, "dix-neuf jours avant de curer");
  const aq = [inst("aquaponie")];
  const arret = { arrets: [{ cle: "aquaponie", raison: "energie" }] };
  let a = abriDe(aq, { region: "sud-sauvage", vivant: { aquaponie: { tetes: 30, sante: 3, filtreLe: 30 } } });
  let r = L.journeeVivant({ abri: a, installations: aq, contenu, bilan: arret, conditions: { jour: 31, personnes: 2 } });
  assert.deepEqual([r.vivant.aquaponie.tetes, r.vivant.aquaponie.sansPompe], [30, 1]);
  r = L.journeeVivant({ abri: { ...a, vivant: r.vivant }, installations: aq, contenu, bilan: arret, conditions: { jour: 32, personnes: 2 } });
  assert.equal(r.vivant.aquaponie.tetes, 0, "deux jours sans pompe : tout meurt");
  assert.ok(r.evenements.some(x => x.cle === "vivant-sans-pompe"));
});

test("vivant : les naissances (santé 2, deux bêtes, une place), jamais hors de l'altitude ; les plants se resèment à la tâche « cultures »", () => {
  const bc = [inst("basse-cour", 2)];
  let a = abriDe(bc, { vivant: { "basse-cour": { tetes: 4, sante: 3 } } });
  let nes = 0;
  for (let j = 0; j < 25; j++) {
    const r = L.journeeVivant({ abri: a, installations: bc, contenu, bilan: {}, conditions: { jour: j, personnes: 4 } });
    nes += r.evenements.filter(x => x.cle === "vivant-naissance").reduce((s, x) => s + x.params.n, 0);
    a = { ...a, vivant: r.vivant };
  }
  // 2 couples × 0,08 par jour : 4 en 25 jours (une naissance fait un couple de plus au bout d'un temps).
  assert.ok(nes >= 4 && a.vivant["basse-cour"].tetes === 4 + nes, `naissances : ${nes}`);
  // Malade : pas de naissance.
  const malade = L.journeeVivant({ abri: abriDe(bc, { vivant: { "basse-cour": { tetes: 4, sante: 3, malade: { depuis: 0 }, naissances: 0.99 } } }), installations: bc, contenu, bilan: {},
    conditions: { jour: 1, personnes: 4 } });
  assert.equal(malade.vivant["basse-cour"].tetes, 4);
  // Hors de son altitude (un tilapia à 1 000 m) : aucune naissance.
  const t = [inst("bassin-a-tilapias")];
  const haut = L.journeeVivant({ abri: abriDe(t, { vivant: { "bassin-a-tilapias": { tetes: 10, sante: 3, naissances: 0.9, filtreLe: 0 } } }), installations: t, contenu, bilan: {},
    conditions: { jour: 1, personnes: 4 } });
  assert.equal(haut.vivant["bassin-a-tilapias"].tetes, 10);
  // Les plants : une graine resème six plants par jour, si quelqu'un est aux cultures.
  const bacs = [inst("bacs-de-culture"), inst("compost")];
  const p = L.journeeVivant({ abri: abriDe(bacs, { vivant: { "bacs-de-culture": { tetes: 2, sante: 3, filtreLe: 1 } } }), installations: bacs, contenu, bilan: { actives: ["compost"] },
    conditions: { jour: 2, personnes: 2, travailleurs: { cultures: [{ niveau: 1 }] } } });
  assert.deepEqual([p.vivant["bacs-de-culture"].tetes, p.stocks.graines], [8, 9]);
  const vide = L.journeeVivant({ abri: abriDe(bacs, { vivant: { "bacs-de-culture": { tetes: 0, sante: 0, filtreLe: 1 } } }), installations: bacs, contenu, bilan: { actives: ["compost"] },
    conditions: { jour: 2, personnes: 2, travailleurs: { cultures: [{ niveau: 1 }] } } });
  assert.deepEqual([vide.vivant["bacs-de-culture"].tetes, vide.vivant["bacs-de-culture"].sante, vide.stocks.graines], [6, 3, 9], "un bac vide se resème");
});

test("vivant : la maladie prend selon l'insalubrité (flux à part), passe seule ou se soigne ; malade, le cheptel perd 1 tous les deux jours", () => {
  const bc = [inst("basse-cour")];
  const a = abriDe(bc, { vivant: { "basse-cour": { tetes: 4, sante: 3 } } });
  const prend = L.journeeVivant({ abri: a, installations: bc, contenu, bilan: { insalubrite: 3 }, conditions: { jour: 5, personnes: 2 }, hasard: toujours(0.001) });
  assert.deepEqual(prend.vivant["basse-cour"].malade, { depuis: 5 });
  assert.ok(prend.evenements.some(x => x.cle === "vivant-malade"));
  // 2 % × ¼ dans un abri propre : 0,005 ; un tirage à 0,006 ne la donne pas.
  const propre = L.journeeVivant({ abri: a, installations: bc, contenu, bilan: { insalubrite: 0 }, conditions: { jour: 5, personnes: 2 }, hasard: toujours(0.006) });
  assert.equal(propre.vivant["basse-cour"].malade, null);
  const sansHasard = L.journeeVivant({ abri: a, installations: bc, contenu, bilan: { insalubrite: 3 }, conditions: { jour: 5, personnes: 2 } });
  assert.equal(sansHasard.vivant["basse-cour"].malade, null, "sans flux, pas de maladie");
  let st = { tetes: 4, sante: 3, malade: { depuis: 5 } };
  const santes = [];
  for (let j = 5; j < 9; j++) {
    const r = L.journeeVivant({ abri: abriDe(bc, { vivant: { "basse-cour": st } }), installations: bc, contenu, bilan: {}, conditions: { jour: j, personnes: 2 }, hasard: toujours(0.99) });
    st = r.vivant["basse-cour"];
    santes.push(st.sante);
  }
  assert.deepEqual(santes, [3, 2, 2, 1], "−1 tous les deux jours, rien ne revient");
  const passe = L.journeeVivant({ abri: abriDe(bc, { vivant: { "basse-cour": st } }), installations: bc, contenu, bilan: {}, conditions: { jour: 9, personnes: 2 }, hasard: toujours(0.05) });
  assert.equal(passe.vivant["basse-cour"].malade, null, "une fois sur dix, elle passe");
  assert.equal(L.soignerCheptel(st, { reussite: true }).etat.malade, null);
  assert.ok(L.soignerCheptel(st, { reussite: false }).etat.malade);
  assert.equal(L.soignerCheptel({ ...st, malade: null }, {}).motif, "pas-malade");
});

test("vivant : peupler jusqu'aux places, abattre (la viande, le troupeau baisse), curer ; les plants et les essaims ne s'abattent pas", () => {
  const st = { espece: "cabri", tetes: 3, sante: 3, malade: null, manques: [] };
  const p = L.peuplerCheptel(st, { n: 5, places: 6, espece: "cabri" });
  assert.deepEqual([p.ok, p.entrent, p.restent, p.etat.tetes], [true, 3, 2, 6]);
  assert.equal(L.peuplerCheptel({ ...st, tetes: 6 }, { n: 1, places: 6 }).motif, "plein");
  assert.equal(L.peuplerCheptel(st, { n: 1, places: 6, espece: "poule" }).motif, "autre-espece");
  const ab = L.abattreCheptel(st, espece("cabri"), { n: 1 });
  assert.deepEqual([ab.abattues, ab.nourriture, ab.etat.tetes], [1, 6, 2]);
  assert.equal(L.abattreCheptel({ ...st, espece: "tilapia", tetes: 10 }, espece("tilapia"), { n: 4 }).nourriture, 1, "quatre tilapias, une ration");
  assert.equal(L.abattreCheptel(st, espece("plants-hors-sol"), { n: 1 }).motif, "pas-de-viande");
  assert.equal(L.abattreCheptel(st, espece("essaim"), { n: 1 }).motif, "pas-de-viande");
  assert.equal(L.abattreCheptel({ ...st, tetes: 0 }, espece("cabri"), { n: 1 }).motif, "vide");
  assert.deepEqual(L.nettoyerCheptel({ ...st, manques: ["eau-sale"] }).etat.manques, []);
});

test("vivant : les bêtes portées tiennent leur délai hors d'un enclos, puis meurent (leur viande se mange) ; l'enclos de leur espèce", () => {
  let b = L.porterBete([], { espece: "cabri", nombre: 2, quart: 10, source: "capture", contenu }).betes;
  b = L.porterBete(b, { espece: "poule", nombre: 3, quart: 12, contenu }).betes;
  assert.equal(b.length, 2);
  assert.deepEqual(Object.keys(b[0]).sort(), ["abri", "cle", "enclos", "id", "jusqua", "nombre", "prisLe", "source"], "la forme des bêtes trouvées du lot 5");
  assert.deepEqual([b[0].jusqua, b[1].jusqua], [16, 16]);
  let r = L.betesQuiMeurent(b, { quart: 15, contenu });
  assert.equal(r.mortes.length, 0, "15 − 10 < 6 quarts pour un cabri, 15 − 12 < 4 pour une poule");
  r = L.betesQuiMeurent(b, { quart: 16, contenu });
  assert.deepEqual(r.mortes.map(x => [x.cle, x.viande]), [["cabri", 12], ["poule", 3]]);
  assert.equal(r.betes.length, 0);
  // Une entrée « à l'enclos » d'un autre lot (enclos posé, jusqua null) ne meurt pas ; un porcelet (alias) est un cochon.
  assert.equal(L.betesQuiMeurent([{ id: "x", cle: "poule", nombre: 2, prisLe: 0, jusqua: null, enclos: "basse-cour" }], { quart: 99, contenu }).mortes.length, 0);
  assert.equal(L.especeDe(contenu, "porcelet").cle, "cochon");
  assert.equal(L.especeDe(contenu, "veau-moka").cle, "boeuf-moka");
  assert.equal(L.betesQuiMeurent([{ id: "p", cle: "porcelet", nombre: 1, prisLe: 0, jusqua: 5 }], { quart: 5, contenu }).mortes[0].viande, 10);
  const insts = [inst("basse-cour"), inst("enclos-a-cabris")];
  assert.equal(L.enclosPour(insts, contenu, "cabri", abriDe(insts)).cle, "enclos-a-cabris");
  assert.equal(L.enclosPour(insts, contenu, "lapin", abriDe(insts)), null);
  // Dans avancer : 6 quarts plus tard, le cabri porté est mort ; sa viande va aux stocks de l'abri.
  const { monde, etat } = L.demarrerPartie({ contenu, graine: "vivant|portees", region: "le-tampon", membres: ["a"] });
  const ins = L.installerAbri(monde, contenu, { site: "ferme-de-la-plaine-des-cafres", jour: 0, quart: 0 });
  const abri = { id: "abri", system: ins.abri, installations: ins.installations };
  const e = { ...etat, groupe: { ...etat.groupe, abri: "abri", region: ins.abri.region, betes: L.porterBete([], { espece: "cabri", nombre: 1, quart: 0, contenu }).betes } };
  const avant = abri.system.stocks.nourriture;
  const s = L.avancer({ etat: e, monde: ins.monde, contenu, quarts: 6, survivants: [{ id: "a", system: L.survivantNeuf({}) }], abri });
  assert.equal(s.etat.groupe.betes.length, 0);
  assert.ok(s.etat.journal.some(x => x.cle === "vivant-portee-morte"));
  assert.ok(s.acteurs.abri.system.stocks.nourriture >= avant + 6 - 2, "la viande du cabri, moins ce qu'on a mangé");
});

test("vivant : avancer suit les cheptels jour après jour (abri.vivant) ; la ferme des Hauts garde ses cabris et ses poules", () => {
  const { monde, etat } = L.demarrerPartie({ contenu, graine: "vivant|jours", region: "le-tampon", membres: ["a", "b"] });
  const ins = L.installerAbri(monde, contenu, { site: "ferme-de-la-plaine-des-cafres", jour: 0, quart: 0 });
  let abri = { id: "abri", system: { ...ins.abri, stocks: { ...ins.abri.stocks, eau: 30, nourriture: 30 } }, installations: [...ins.installations, inst("basse-cour", 1, { termineLe: 0 })] };
  let e = { ...etat, groupe: { ...etat.groupe, abri: "abri", region: ins.abri.region } };
  let survivants = [{ id: "a", system: L.survivantNeuf({ tache: "elevage" }) }, { id: "b", system: L.survivantNeuf({}) }];
  const r = L.avancer({ etat: e, monde: ins.monde, contenu, quarts: 4 * 10, survivants, abri });
  const v = r.acteurs.abri.system.vivant;
  assert.ok(v["enclos-a-cabris"] && v["basse-cour"], "les deux cheptels sont suivis");
  assert.equal(v["enclos-a-cabris"].espece, "cabri");
  assert.ok(v["basse-cour"].tetes >= 3, "la basse-cour neuve a commencé avec trois poules");
  assert.ok(r.bilan.cheptels.length === 2);
  // Loin de l'abri, ce qui arrive aux cheptels va au journal secret.
  const loin = { ...r.etat, groupe: { ...r.etat.groupe, region: "saint-pierre" } };
  const r2 = L.avancer({ etat: loin, monde: r.monde, contenu, quarts: 4 * 3, survivants: r.acteurs.survivants.map(s => ({ id: s.id, system: s.system })), abri: r.acteurs.abri });
  assert.ok(r2.acteurs.abri.system.vivant["basse-cour"].manques.includes("faim"), "personne à l'abri : pas de restes");
  assert.ok(!r2.etat.journal.slice(-30).some(x => x.cle === "vivant-faim"), "pas au journal public");
  assert.ok((r2.monde.journalSecret ?? []).some(x => x.cle === "vivant-faim"));
});

test("vivant : les pertes d'un assaut (marge −1 : une bête ; brèche : la force de la menace) ; ni plants, ni poissons, ni essaims", () => {
  const insts = [inst("bassin-a-tilapias"), inst("basse-cour"), inst("enclos-a-cabris")];
  const abri = abriDe(insts);
  assert.deepEqual(L.pertesDAssaut(abri, insts, contenu, { marge: 0, force: 3 }).pertes, []);
  assert.deepEqual(L.pertesDAssaut(abri, insts, contenu, { marge: -1, force: 3 }).pertes, [{ cle: "basse-cour", n: 1 }]);
  const breche = L.pertesDAssaut(abri, insts, contenu, { marge: -3, force: 5 });
  assert.deepEqual(breche.pertes, [{ cle: "basse-cour", n: 4 }, { cle: "enclos-a-cabris", n: 1 }]);
  assert.equal(breche.vivant["basse-cour"].tetes, 0);
  assert.equal(breche.vivant["bassin-a-tilapias"], undefined, "le bassin ne se vide pas en une nuit");
});

test("vivant : les bêtes en liberté se tirent par zone ; on les prend avec l'outil de leur espèce, sinon elles filent (un essaim pique)", () => {
  const sauvages = L.betesSauvagesDe(contenu);
  assert.ok(sauvages.length >= 4 && sauvages.every(b => b.categorie === "bete"));
  assert.ok(!contenu.creatures.some(c => sauvages.some(b => b.cle === c.cle)), "elles ne combattent pas : pas des créatures");
  for (let i = 0; i < 30; i++) {
    const r = L.tirerBeteSauvage(contenu, { zone: "volcan", phase: "silence" }, L.deriverHasard("bete", i));
    assert.ok(["boeuf-moka-sauvage", "cabri-marron"].includes(r.cle), r.cle);
    assert.ok(r.nombre >= 2 && r.nombre <= 6);
  }
  assert.equal(L.tirerBeteSauvage(contenu, { zone: "littoral", phase: "jour-zero" }, Math.random), null, "le jour zéro, rien n'est encore sauvage");
  const poule = espece("poule");
  assert.deepEqual(L.prendreBete(poule, { test: { reussite: true }, outils: ["sac-de-goni"] }), { prise: true, file: false, blessure: false, difficulte: "facile", outil: true });
  assert.equal(L.prendreBete(poule, { test: { reussite: false }, outils: ["cage-de-bambou"] }).file, true, "ratée, elle file");
  assert.deepEqual(L.prendreBete(espece("cabri"), { test: { reussite: true }, outils: ["sac-de-goni"] }).outil, false, "un cabri se prend à la corde");
  const essaim = L.prendreBete(espece("essaim"), { test: null, outils: [] });
  assert.deepEqual([essaim.prise, essaim.file, essaim.blessure], [false, false, true], "sans enfumoir, l'essaim pique et reste");
  assert.deepEqual(L.chasserBete(espece("boeuf-moka"), { test: { reussite: true } }), { abattue: true, viande: 20, file: false });
});

test("le chien prévient sans attirer : il tourne, il mène, il n'aboie que tout près ; +1 de vigilance à la garde, en plus d'une tour, au plus +2", () => {
  assert.equal(L.alerteDuChien({ distance: 50 }).signal, "rien");
  assert.deepEqual([L.alerteDuChien({ distance: 30 }).signal, L.alerteDuChien({ distance: 30 }).bruit], ["tourne", 0]);
  assert.equal(L.alerteDuChien({ distance: 30, nuit: true }).signal, "rien", "22 m la nuit");
  assert.equal(L.alerteDuChien({ distance: 20, suit: true }).signal, "mene");
  assert.deepEqual([L.alerteDuChien({ distance: 3 }).signal, L.alerteDuChien({ distance: 3 }).bruit], ["aboie", 2]);
  assert.equal(L.vigilanceAvecChien(0, true), 1);
  assert.equal(L.vigilanceAvecChien(1, true), 2);
  assert.equal(L.vigilanceAvecChien(2, true), 2);
  assert.equal(L.vigilanceAvecChien(1, false), 1);
  const insts = [inst("tour-de-guet")];
  const avec = L.bilanAbri(abriDe(insts), insts, contenu, { jour: 10, personnes: 2, chien: true });
  const sans = L.bilanAbri(abriDe(insts), insts, contenu, { jour: 10, personnes: 2 });
  assert.deepEqual([sans.bonus.vigilance, avec.bonus.vigilance], [1, 2], "le chien s'ajoute à la tour de guet");
  assert.equal(avec.bruit, sans.bruit, "sans aucun bruit");
});

test("le chien grogne quand une horde ou des Livides viennent vers l'abri (une alerte, sans bruit)", () => {
  // Une région grouillante, un abri bruyant : on avance jusqu'à une menace de Livides ou de horde.
  const { monde, etat } = L.demarrerPartie({ contenu, graine: "vivant|chien", region: "saint-denis", membres: ["a"] });
  const ins = L.installerAbri(monde, contenu, { site: contenu.regions.find(r => r.cle === "saint-denis").sites[0], jour: 0, quart: 0 });
  let abri = { id: "abri", system: { ...ins.abri, bruit: 10, stocks: { ...ins.abri.stocks, eau: 99, nourriture: 99 } }, installations: ins.installations };
  let e = { ...etat, groupe: { ...etat.groupe, abri: "abri", region: ins.abri.region } };
  let m = ins.monde, survivants = [{ id: "a", system: L.survivantNeuf({}) }];
  let vu = false;
  for (let j = 0; j < 40 && !vu; j++) {
    const r = L.avancer({ etat: e, monde: m, contenu, quarts: 4, survivants, abri, options: { chien: true } });
    const viennent = r.menaces.some(x => ["horde", "livides"].includes(x.type));
    const grogne = r.alertes.some(x => x.cle === "chien-grogne");
    assert.equal(grogne, viennent, `jour ${j}`);
    vu = viennent;
    e = r.etat; m = r.monde; abri = { ...r.acteurs.abri, system: { ...r.acteurs.abri.system, bruit: 10 } };
    survivants = r.acteurs.survivants.map(s => ({ id: s.id, system: { ...s.system, faim: 0, soif: 0, fatigue: 0 } }));
  }
  assert.ok(vu, "une menace de Livides en quarante jours à Saint-Denis");
});
