// Les actions du groupe (§1.7, §2.4, §5, §9) : fouiller, explorer, rencontres et créatures, voyager (véhicules), déménager,
// s'installer, assaut, combat.  Lancer : npm run essais
import { test } from "node:test";
import assert from "node:assert/strict";
import { L, contenuMini, constant, desFixes, I } from "./doublures/survie-outils.mjs";

const C = contenuMini();
const vehicule = cle => L.indexer(C).equipements.get(cle);

test("fouiller : butin pris au pillage réel, prudence (quantité, bruit), monde d'entrée intact", () => {
  const m = L.creerMonde(C, "f");
  const copie = structuredClone(m);
  const butins = {};
  for (const p of ["discret", "normal", "rapide"]) {
    const r = L.fouiller(m, C, constant(0.999), { region: "port-gris", membres: 2, quarts: 1, prudence: p, jour: 3 });
    butins[p] = Object.values(r.butin).reduce((s, x) => s + x, 0);
    assert.equal(r.bruit, { discret: 0, normal: 1, rapide: 3 }[p]);
    assert.equal(r.fouille, true);
    for (const [res, q] of Object.entries(r.butin)) assert.equal(r.monde.regions["port-gris"].pillage[res], m.regions["port-gris"].pillage[res] - q);
    assert.equal(r.renseignements["port-gris"].vu, 3);
  }
  assert.deepEqual(m, copie);
  assert.ok(butins.discret < butins.normal && butins.normal < butins.rapide, JSON.stringify(butins));
  assert.ok(butins.normal <= 12, "au plus 6 par membre et par quart");
  const cible = L.fouiller(m, C, constant(0.999), { region: "port-gris", membres: 2, cible: "medicaments", jour: 3 });
  assert.deepEqual(Object.keys(cible.butin), ["medicaments"]);
  const vide = structuredClone(m);
  for (const r of Object.keys(vide.regions["cote-ouest"].pillage)) vide.regions["cote-ouest"].pillage[r] = 0;
  assert.deepEqual(L.fouiller(vide, C, constant(0.999), { region: "cote-ouest", membres: 4 }).butin, {});
});

test("fouiller les alentours : nature de l'abri, ne compte pas comme une fouille", () => {
  const m = L.creerMonde(C, "n");
  const abri = { site: "hauts-ferme", region: "hauts-verts", nature: { cueillette: 30, gibier: 20, peche: 0, bois: 30 } };
  const r = L.fouiller(m, C, constant(0.999), { region: "hauts-verts", cible: "cueillette", membres: 2, quarts: 1, abri });
  assert.equal(r.butin.nourriture, 3);
  assert.equal(r.abri.nature.cueillette, 27);
  assert.equal(r.fouille, false);
  assert.equal(r.bruit, 0);
  const bois = L.fouiller(m, C, constant(0.999), { region: "hauts-verts", cible: "bois", membres: 2, abri });
  assert.equal(bois.butin.materiaux, 3);
});

test("rencontres : plus la nuit, moins en étant discret ; types de Livides selon la région et le jour", () => {
  const m = L.creerMonde(C, "r");
  m.regions["port-gris"].infestation = 3;
  const taux = opts => {
    let n = 0;
    for (let i = 0; i < 500; i++) if (L.tirerRencontre(m, C, L.creerHasard(`t${i}`), { region: "port-gris", jour: 30, ...opts })) n++;
    return n;
  };
  assert.ok(taux({ moment: "nuit" }) > taux({ moment: "matin" }));
  assert.ok(taux({ prudence: "discret" }) < taux({ prudence: "rapide" }));
  // Livides : le coureur seulement les premiers jours ; le Livide des Hauts seulement en altitude.
  const types = (region, jour) => {
    const vus = new Set();
    for (let i = 0; i < 300; i++) vus.add(L.tirerCreature(C, L.creerHasard(`c${i}`), { espece: "livide", region: L.regionDe(C, region), jour }).cle);
    return vus;
  };
  assert.ok(types("port-gris", 2).has("coureur"));
  assert.ok(!types("port-gris", 30).has("coureur"));
  assert.ok(!types("port-gris", 30).has("livide-des-hauts"));
  assert.ok(types("hauts-verts", 30).has("livide-des-hauts"));
  assert.ok(!types("hauts-verts", 30).has("noye"), "le noyé vit sur le littoral");
  const r = L.tirerRencontre(m, C, constant(0), { region: "port-gris", jour: 30 });
  assert.equal(r.type, "livides");
  assert.ok(r.des >= 1 && r.resistance >= 1 && r.creature);
  assert.deepEqual(L.tirerCreature({}, constant(0), { espece: "livide" }), { ...L.CREATURE_DEFAUT.livide });
});

test("voyager : plus court chemin sur les routes RÉELLES, détour si coupée, renseignements des régions traversées", () => {
  const m = L.creerMonde(C, "v");
  const r = L.voyager(m, C, constant(0.999), { de: "port-gris", vers: "cirque-perdu", membres: 2, quart: 0 });
  assert.equal(r.possible, true);
  assert.deepEqual(r.chemin, ["port-gris", "hauts-verts", "cirque-perdu"]);
  assert.equal(r.quarts, 10);
  assert.equal(r.renseignements["cirque-perdu"].vu, 0);
  const coupe = structuredClone(m);
  coupe.regions["port-gris"].routes["hauts-verts"] = "coupee";
  coupe.regions["hauts-verts"].routes["port-gris"] = "coupee";
  const d = L.voyager(coupe, C, constant(0.999), { de: "port-gris", vers: "hauts-verts", membres: 2 });
  assert.deepEqual(d.chemin, ["port-gris", "cote-ouest", "hauts-verts"]);
  // Le chemin connu (pour l'IA) l'ignore tant qu'on ne l'a pas vu.
  assert.deepEqual(d.cheminConnu.chemin, ["port-gris", "hauts-verts"]);
  assert.ok(d.cheminConnu.incertain.length > 0);
  const difficile = structuredClone(m);
  difficile.regions["hauts-verts"].routes["cirque-perdu"] = "difficile";
  assert.equal(L.voyager(difficile, C, constant(0.999), { de: "hauts-verts", vers: "cirque-perdu" }).quarts, 9);
  assert.equal(L.voyager(m, C, constant(0.999), { de: "hauts-verts", vers: "cirque-perdu", transport: "vehicule" }).possible, false, "pas de véhicule sur un sentier");
});

test("voyager : véhicules et montures (terrains, temps, carburant par quart, charge, bruit)", () => {
  const m = L.creerMonde(C, "veh");
  const auto = L.voyager(m, C, constant(0.999), { de: "port-gris", vers: "plaine-est", transport: vehicule("voiture"), carburant: 5 });
  assert.equal(auto.quarts, 1);
  assert.equal(auto.carburant, 1, "ceil(1 × 0,5)");
  assert.equal(auto.bruit, 3);
  const velo = L.voyager(m, C, constant(0.999), { de: "port-gris", vers: "plaine-est", transport: vehicule("velo-cargo") });
  assert.equal(velo.quarts, 3, "ceil(5 × 0,5)");
  assert.equal(velo.carburant, 0);
  assert.equal(L.voyager(m, C, constant(0.999), { de: "hauts-verts", vers: "cirque-perdu", transport: vehicule("velo-cargo") }).possible, false);
  assert.equal(L.voyager(m, C, constant(0.999), { de: "hauts-verts", vers: "cirque-perdu", transport: vehicule("ane") }).quarts, 5);
  const kayak = L.voyager(m, C, constant(0.999), { de: "cote-ouest", vers: "sud-sauvage", transport: vehicule("kayak") });
  assert.equal(kayak.quarts, 6);
  const barque = L.voyager(m, C, constant(0.999), { de: "cote-ouest", vers: "sud-sauvage", transport: vehicule("barque-moteur"), carburant: 3 });
  assert.equal(barque.quarts, 3);
  assert.equal(barque.carburant, 3);
  const panne = L.voyager(m, C, constant(0.999), { de: "cote-ouest", vers: "sud-sauvage", transport: vehicule("barque-moteur"), carburant: 2 });
  assert.equal(panne.possible, false, "3 carburant pour 3 quarts");
  assert.ok(panne.raison.includes("carburant"));
  assert.equal(L.voyager(m, C, constant(0.999), { de: "port-gris", vers: "plaine-est", transport: vehicule("voiture"), charge: 21 }).possible, false);
  assert.equal(L.voyager(m, C, constant(0.999), { de: "port-gris", vers: "plaine-est", transport: vehicule("voiture"), vehicules: 2, charge: 40 }).possible, true);
  assert.equal(L.voyager(m, C, constant(0.999), { de: "port-gris", vers: "plaine-est", membres: 2, charge: 7 }).possible, false, "3 par personne à pied");
  // Le bruit du véhicule attire les rencontres.
  const rencontres = transport => {
    let n = 0;
    for (let i = 0; i < 400; i++) n += L.voyager(m, C, L.creerHasard(`vv${i}`), { de: "port-gris", vers: "hauts-verts", transport, carburant: 99 }).rencontres.length;
    return n;
  };
  assert.ok(rencontres(vehicule("quatre-quatre")) > rencontres("pied"));
});

test("déménager : charge portable, abri abandonné gardé dans le monde avec ses installations", () => {
  const m = L.creerMonde(C, "d");
  const abri = { site: "hauts-ferme", region: "hauts-verts", stocks: { eau: 30, nourriture: 50, materiaux: 10, energie: 8 } };
  const r = L.demenager(m, { abri, installations: [I("potager", 2)], emporter: { nourriture: 10, eau: 10, energie: 8 }, membres: 4, jour: 12 });
  assert.equal(r.capacite, 12);
  assert.deepEqual(r.emporte, { nourriture: 10, eau: 2 });
  assert.equal(r.laisse.nourriture, 40);
  const a = r.monde.regions["hauts-verts"].abrisAbandonnes[0];
  assert.equal(a.site, "hauts-ferme");
  assert.equal(a.installations[0].cle, "potager");
  assert.equal(a.depuis, 12);
  assert.equal(a.occupe, null);
  assert.equal(m.regions["hauts-verts"].abrisAbandonnes.length, 0, "monde d'entrée intact");
  assert.equal(L.demenager(m, { abri, emporter: { nourriture: 50 }, transport: vehicule("voiture"), vehicules: 2 }).emporte.nourriture, 40);
  // Revenir : on reprend l'abri, ses installations et ce qu'on avait laissé.
  const retour = L.installerAbri(r.monde, C, { site: "hauts-ferme", jour: 40 });
  assert.equal(retour.repris, true);
  assert.equal(retour.installations[0].cle, "potager");
  assert.equal(retour.abri.stocks.nourriture, 40);
  // Occupé par une faction : refusé.
  const occupe = structuredClone(r.monde);
  occupe.regions["hauts-verts"].abrisAbandonnes[0].occupe = "planteurs";
  assert.equal(L.installerAbri(occupe, C, { site: "hauts-ferme" }).ok, false);
});

test("s'installer : stocks du site entamés comme la région, une seule fois ; installations de départ", () => {
  const m = L.creerMonde(C, "i");
  const neuf = L.installerAbri(m, C, { site: "port-immeuble", jour: 0, quart: 0 });
  assert.equal(neuf.abri.stocks.nourriture, 45);
  assert.equal(neuf.abri.sol, 0);
  assert.equal(neuf.abri.nature.peche, 20);
  const pille = structuredClone(m);
  pille.regions["port-gris"].pillage.nourriture = 300;
  assert.equal(L.installerAbri(pille, C, { site: "port-immeuble" }).abri.stocks.nourriture, 22);
  assert.equal(L.installerAbri(neuf.monde, C, { site: "port-immeuble" }).abri.stocks.nourriture, 0, "déjà visité");
  const case_ = L.installerAbri(m, C, { site: "ouest-case", jour: 0 });
  assert.equal(case_.installations[0].cle, "citerne-pluie");
  assert.ok(case_.installations[0].termineLe < 0, "déjà en service");
});

test("assaut : défense + vigilance contre force, marges", () => {
  assert.equal(L.resoudreAssaut({ defense: 2, vigilance: 1, force: 2, hasard: desFixes([5, 5, 1, 1, 1]) }).issue, "repoussee");
  const zero = L.resoudreAssaut({ defense: 1, vigilance: 0, force: 1, hasard: desFixes([5, 6]) });
  assert.equal(zero.marge, 0);
  assert.equal(zero.degats, 1);
  const moins1 = L.resoudreAssaut({ defense: 1, vigilance: 0, force: 2, hasard: desFixes([1, 5, 6]) });
  assert.equal(moins1.marge, -2);
  assert.equal(moins1.issue, "breche");
  const m1 = L.resoudreAssaut({ defense: 1, vigilance: 0, force: 1, hasard: desFixes([1, 6]) });
  assert.equal(m1.issue, "endommagee");
  assert.equal(m1.blesses, 1);
});

test("combat : succès contre résistance, dés d'attaque par créature, morsures seulement des Livides", () => {
  const c = L.resoudreCombat({ niveau: 1, livides: 3, hasard: desFixes([5, 6, 6, 6]) });
  assert.equal(c.neutralises, 2);
  assert.equal(c.restants, 1);
  assert.equal(c.touches, 1);
  assert.equal(c.morsures, 1);
  const dur = L.resoudreCombat({ niveau: 1, livides: 2, creature: { cle: "livide-des-hauts", des: 1, resistance: 2 }, hasard: desFixes([5, 6, 1, 1]) });
  assert.equal(dur.neutralises, 1, "2 succès pour un Livide des Hauts");
  const melange = L.resoudreCombat({ niveau: 2, adversaires: [{ cle: "coureur", nombre: 1, des: 2, resistance: 2 }, { cle: "livide-frais", nombre: 2, des: 1, resistance: 1 }],
    hasard: desFixes([5, 5, 1, 6, 6, 6, 6]) });
  assert.deepEqual(melange.detail, [{ cle: "coureur", nombre: 1, neutralises: 0 }, { cle: "livide-frais", nombre: 2, neutralises: 2 }]);
  assert.equal(melange.attaques.length, 2, "le coureur lance 2 dés");
  const chiens = L.resoudreCombat({ niveau: 0, adversaires: [{ cle: "chiens", type: "animal", nombre: 2, des: 1, resistance: 1 }], hasard: desFixes([1, 6, 6]) });
  assert.equal(chiens.touches, 2);
  assert.equal(chiens.morsures, 0);
  assert.equal(L.resoudreCombat({ competence: "tir", livides: 0, hasard: constant(0) }).bruit, 2);
});

test("explorer : la région vue, une rencontre possible", () => {
  const m = L.creerMonde(C, "e");
  const r = L.explorer(m, C, constant(0.999), { region: "cote-ouest", jour: 4 });
  assert.equal(r.renseignement.vu, 4);
  assert.equal(r.renseignement.source, "vu");
  assert.equal(r.rencontre, null);
  assert.ok(r.faits[0].public);
});
