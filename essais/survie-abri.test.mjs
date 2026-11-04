// L'abri et ses installations (§1.6, §1.7, §3.1, §3.2, §3.3) : bilan, conditions, délestage, construire, plans, chantiers,
// dégâts, autonomie, sol, alentours.  Lancer : npm run essais
import { test } from "node:test";
import assert from "node:assert/strict";
import { L, contenuMini, constant, I } from "./doublures/survie-outils.mjs";

const C = contenuMini();
const def = cle => L.installationDe(C, cle);
const abriHauts = (x = {}) => ({ site: "hauts-ferme", region: "hauts-verts", stocks: { eau: 20, nourriture: 20 }, sol: 3, degats: 0, ...x });
const site = cle => L.siteDe(C, cle);

test("bilan : défense, discrétion, capacité, visibilité du site et des installations", () => {
  const b = L.bilanAbri(abriHauts(), [I("palissade", 2), I("galerie", 1), I("potager", 1)], C, { jour: 50, personnes: 4, saison: "pluies" });
  assert.equal(b.defense, 1 + 3);
  assert.equal(b.discretion, 2 + 1);
  assert.equal(b.capacite, 6 + 2);
  assert.equal(b.visibilite, Math.max(0, 2 + 1 + 1 - 3), "ceil(4/2) + palissade + potager − discrétion");
  assert.equal(b.protectionCyclone, 1);
  assert.equal(L.bilanAbri(abriHauts({ degats: 3 }), [I("palissade", 2)], C, { personnes: 1 }).defense, 1 + 3 - 1);
  const tunnel = L.bilanAbri({ site: "sud-tunnel", region: "sud-sauvage" }, [], C, { personnes: 2 });
  assert.equal(tunnel.protectionCyclone, 3);
  assert.equal(tunnel.discretion, 5);
});

test("bilan : pluie × climat × saison, soleil × climat × saison × site, délai, sol", () => {
  const pluies = L.bilanAbri(abriHauts(), [I("citerne-pluie", 2)], C, { jour: 1, personnes: 0, saison: "pluies" });
  assert.equal(pluies.production.eau, 9, "3 × pluie 3");
  const seche = L.bilanAbri(abriHauts(), [I("citerne-pluie", 2)], C, { jour: 1, personnes: 0, saison: "seche" });
  assert.equal(seche.production.eau, 5, "3 × 3 × 0,5 = 4,5 → 5");
  const soleil = L.bilanAbri(abriHauts(), [I("panneaux-solaires", 2)], C, { jour: 1, personnes: 0, saison: "pluies" });
  assert.equal(soleil.production.energie, 4, "2 × soleil 2 × site 3/3");
  const ombre = L.bilanAbri({ site: "hauts-gite", region: "hauts-verts" }, [I("panneaux-solaires", 2)], C, { jour: 1, personnes: 0, saison: "pluies" });
  assert.equal(ombre.production.energie, 1, "site à l'ombre (1/3)");
  const jeune = L.bilanAbri(abriHauts(), [I("potager", 2, { termineLe: 10 })], C, { jour: 39, personnes: 0 });
  assert.equal(jeune.production.nourriture ?? 0, 0, "pas avant 30 jours");
  const pret = L.bilanAbri(abriHauts(), [I("potager", 2, { termineLe: 10 })], C, { jour: 40, personnes: 0 });
  assert.equal(pret.production.nourriture, 4);
  const use = L.bilanAbri(abriHauts({ sol: 0 }), [I("potager", 2)], C, { jour: 40, personnes: 0 });
  assert.equal(use.production.nourriture, 2, "sol épuisé : moitié");
  const riv = L.bilanAbri(abriHauts(), [I("pico-hydro", 1)], C, { personnes: 0 });
  assert.equal(riv.production.energie ?? 0, 0, "pas de rivière ici");
  assert.equal(L.bilanAbri({ site: "cirque-ilet", region: "cirque-perdu" }, [I("pico-hydro", 1)], C, { personnes: 0 }).production.energie, 4);
});

test("bilan : état des installations, hors service", () => {
  assert.equal(L.bilanAbri(abriHauts(), [I("citerne-pluie", 2, { etat: 2 })], C, { personnes: 0, saison: "pluies" }).production.eau, 5);
  const hs = L.bilanAbri(abriHauts(), [I("palissade", 2, { etat: 3 }), I("citerne-pluie", 2, { etat: 3 })], C, { personnes: 0, saison: "pluies" });
  assert.equal(hs.defense, 1);
  assert.equal(hs.production.eau ?? 0, 0);
  assert.equal(hs.plafonds.eau, 140, "le stockage reste");
});

test("bilan : eau du site et réseaux publics", () => {
  const riv = L.bilanAbri({ site: "cirque-ilet", region: "cirque-perdu" }, [], C, { personnes: 0 });
  assert.equal(riv.production.eau, 12);
  const ville = L.bilanAbri({ site: "port-immeuble", region: "port-gris" }, [], C, { personnes: 4, reseaux: { eau: true, electricite: true } });
  assert.equal(ville.production.eau, 60);
  assert.equal(ville.production.energie, 20);
  assert.equal(ville.eauTraitee, true);
  const coupee = L.bilanAbri({ site: "port-immeuble", region: "port-gris" }, [], C, { personnes: 4, reseaux: { eau: false, electricite: false } });
  assert.equal(coupee.production.eau ?? 0, 0);
  assert.equal(coupee.eauTraitee, false);
  assert.equal(L.bilanAbri(abriHauts(), [I("filtre-sable", 1)], C, { personnes: 1 }).eauTraitee, true);
});

test("bilan : sans énergie, les consommatrices s'arrêtent dans l'ordre (confort d'abord)", () => {
  const ins = [I("radio", 1), I("chambre-froide", 1), I("infirmerie", 1), I("batteries", 1)];
  const assez = L.bilanAbri(abriHauts({ stocks: { energie: 5 } }), ins, C, { personnes: 1 });
  assert.deepEqual(assez.arrets, []);
  assert.equal(assez.conservation, true);
  const peu = L.bilanAbri(abriHauts({ stocks: { energie: 3 } }), ins, C, { personnes: 1 });
  assert.deepEqual(peu.arrets.map(a => a.cle).sort(), ["infirmerie", "radio"], "vie et communication s'arrêtent avant le stockage");
  assert.equal(peu.conservation, true);
  assert.equal(peu.renseignements, false);
  const rien = L.bilanAbri(abriHauts({ stocks: { energie: 0 } }), ins, C, { personnes: 1 });
  assert.equal(rien.arrets.length, 3);
  assert.equal(rien.conservation, false);
  assert.equal(rien.net.energie, 0);
  // Le groupe électrogène tourne s'il y a du carburant, et fait du bruit.
  const ge = L.bilanAbri(abriHauts({ stocks: { carburant: 1 } }), [I("groupe-electrogene", 1), I("chambre-froide", 1)], C, { personnes: 1 });
  assert.equal(ge.production.energie, 8);
  assert.equal(ge.bruit, 2);
  assert.equal(ge.conservation, true);
  const sec = L.bilanAbri(abriHauts({ stocks: { carburant: 0 } }), [I("groupe-electrogene", 1), I("chambre-froide", 1)], C, { personnes: 1 });
  assert.ok(sec.arrets.some(a => a.cle === "groupe-electrogene" && a.raison === "carburant"));
  assert.equal(sec.conservation, false);
});

test("bilan : net, pertes, autonomie, jours de stocks", () => {
  const b = L.bilanAbri(abriHauts({ stocks: { eau: 30, nourriture: 40 } }), [], C, { personnes: 4, saison: "pluies" });
  assert.equal(b.consommation.eau, 4);
  assert.equal(b.pertes.nourriture, 2);
  assert.equal(b.net.nourriture, -6);
  assert.equal(b.autonome, false);
  assert.deepEqual(b.joursDeStocks, { eau: 7, nourriture: 6 });
  const auto = L.bilanAbri(abriHauts({ stocks: { eau: 30, nourriture: 40, energie: 5 } }),
    [I("citerne-pluie", 2), I("potager", 3), I("panneaux-solaires", 2), I("batteries", 1), I("chambre-froide", 1)], C, { jour: 40, personnes: 4, saison: "pluies" });
  assert.equal(auto.autonome, true);
  assert.equal(auto.pertes.nourriture, 0);
  assert.equal(auto.joursDeStocks.nourriture, L.JOURS_INFINIS);
});

test("journée de l'abri : stocks, plafonds, sol, alentours", () => {
  const a = abriHauts({ stocks: { eau: 35, nourriture: 10 }, nature: { cueillette: 0, gibier: 0, peche: 0, bois: 0 } });
  const j = L.journeeAbri(a, [I("citerne-pluie", 1), I("potager", 1)], C, { jour: 40, personnes: 2, saison: "pluies" });
  assert.equal(j.abri.stocks.eau, Math.min(80, 35 + 6 - 2 - 1));
  assert.equal(j.abri.stocks.nourriture, 10 + 2 - 2 - 1);
  assert.ok(j.abri.sol < 3, "le potager use le sol");
  assert.ok(j.abri.nature.cueillette > 0, "les alentours repoussent");
  const compost = L.journeeAbri(abriHauts({ sol: 1 }), [I("compost", 1)], C, { jour: 1, personnes: 0 });
  assert.ok(compost.abri.sol > 1);
});

test("construire : savoirs, site, installations requises, coûts, raisons lisibles", () => {
  const groupe = { savoirs: [], plans: [] };
  const v = L.peutConstruire(def("panneaux-solaires"), 1, { stocks: {} }, site("hauts-ferme"), groupe);
  assert.equal(v.ok, false);
  assert.ok(v.raisons.some(r => r.includes("electricite-solaire")));
  assert.ok(v.raisons.some(r => r.startsWith("il manque")));
  const sol = L.peutConstruire(def("potager"), 1, { stocks: { materiaux: 9, graines: 9 } }, site("port-immeuble"), groupe);
  assert.ok(sol.raisons.some(r => r.includes("terre")));
  const eau = L.peutConstruire(def("pico-hydro"), 1, { stocks: { pieces: 9, materiaux: 9 } }, site("hauts-ferme"), { savoirs: ["electricite-solaire"] });
  assert.ok(eau.raisons.some(r => r.includes("riviere")));
  const ordre = L.peutConstruire(def("palissade"), 2, { stocks: { materiaux: 99, pieces: 9 } }, site("hauts-ferme"), groupe);
  assert.ok(ordre.raisons.some(r => r.includes("niveau 1")));
  const froid = L.peutConstruire(def("chambre-froide"), 1, { stocks: { pieces: 9, materiaux: 9 } }, site("hauts-ferme"), { savoirs: ["electricite-solaire"] });
  assert.ok(froid.raisons.some(r => r.includes("batteries")));
  const ok = L.peutConstruire(def("palissade"), 1, { stocks: { materiaux: 10 } }, site("hauts-ferme"), groupe);
  assert.equal(ok.ok, true);
  assert.deepEqual(ok.cout, { materiaux: 10, travail: 12 });
  assert.equal(L.peutConstruire(def("palissade"), 1, { stocks: { materiaux: 10 }, installations: [I("palissade", 1)] }, site("hauts-ferme"), groupe).ok, false);
});

test("plans : −25 % de ressources (arrondi au supérieur), travail ÷ 2", () => {
  assert.deepEqual(L.coutAvecPlans({ materiaux: 10, pieces: 3, graines: 4, travail: 12 }, true), { materiaux: 8, pieces: 3, graines: 3, travail: 6 });
  assert.deepEqual(L.coutAvecPlans({ materiaux: 10, travail: 7 }, false), { materiaux: 10, travail: 7 });
  assert.deepEqual(L.coutAvecPlans({ materiaux: 1, travail: 1 }, true), { materiaux: 1, travail: 1 });
  const v = L.peutConstruire(def("palissade"), 1, { stocks: { materiaux: 8 } }, site("hauts-ferme"), { plans: ["palissade"] });
  assert.equal(v.ok, true);
  assert.deepEqual(v.cout, { materiaux: 8, travail: 6 });
});

test("chantier : coûts payés à l'ouverture, avancement, plan gagné, délai au premier niveau", () => {
  const o = L.ouvrirChantier(def("potager"), { stocks: { materiaux: 10, graines: 10 } }, site("hauts-ferme"), {});
  assert.equal(o.ok, true);
  assert.equal(o.stocks.materiaux, 7);
  assert.equal(o.stocks.graines, 6);
  assert.deepEqual(o.instance.chantier, { fait: 0, requis: 8 });
  let a = L.avancerChantier(o.instance, def("potager"), { quarts: 2, bras: 3, jour: 4 });
  assert.equal(a.termine, false);
  assert.equal(a.reste, 2);
  a = L.avancerChantier(a.instance, def("potager"), { quarts: 1, bras: 2, jour: 5 });
  assert.equal(a.termine, true);
  assert.equal(a.niveau, 1);
  assert.equal(a.plan, "potager");
  assert.equal(a.instance.termineLe, 5);
  // Le chantier déjà ouvert ne se repaie pas.
  const encore = L.ouvrirChantier(def("potager"), { stocks: {}, installations: [o.instance] }, site("hauts-ferme"), {});
  assert.equal(encore.ok, true);
  // Agrandir garde la date de mise en service.
  const n2 = L.ouvrirChantier(def("potager"), { stocks: { materiaux: 9, graines: 9 }, installations: [a.instance] }, site("hauts-ferme"), { savoirs: ["maraichage"] });
  const fini = L.avancerChantier(n2.instance, def("potager"), { quarts: 12, bras: 1, jour: 30 });
  assert.equal(fini.niveau, 2);
  assert.equal(fini.instance.termineLe, 5);
});

test("dégâts, réparations, cyclone", () => {
  const abime = L.endommagerInstallation(I("palissade", 1), 2);
  assert.equal(abime.etat, 2);
  const r = L.reparerInstallation(abime, def("palissade"), { quarts: 3, bras: 2 });
  assert.equal(r.repares, 2);
  assert.equal(r.instance.etat, 0);
  assert.equal(L.reparerInstallation(abime, def("palissade"), { quarts: 1, bras: 1 }).repares, 0, "3 quarts-personne par point");
  const abri = L.reparerAbri({ degats: 3, stocks: { materiaux: 1 } }, { quarts: 4, bras: 2 });
  assert.equal(abri.repares, 1, "limité par les matériaux");
  const cy = L.subirCyclone(abriHauts(), [I("potager", 1), I("galerie", 1)], C, { force: 3, protection: 1 }, constant(0));
  assert.equal(cy.degats, 2);
  assert.deepEqual(cy.endommagees, ["potager"]);
  assert.equal(cy.installations[0].etat, 2);
  assert.equal(L.subirCyclone(abriHauts(), [I("potager", 1)], C, { force: 2, protection: 3 }, constant(0)).degats, 0);
});

test("autonomie : 7 jours consécutifs", () => {
  let a = { joursAutonomes: 0 };
  for (let i = 0; i < 6; i++) a = L.suivreAutonomie(a.joursAutonomes, true);
  assert.equal(a.autonome, false);
  a = L.suivreAutonomie(a.joursAutonomes, true);
  assert.equal(a.autonome, true);
  assert.deepEqual(L.suivreAutonomie(a.joursAutonomes, false), { joursAutonomes: 0, autonome: false });
});

test("alentours : exploitation, régénération vers le plafond, bonus des fruits", () => {
  const region = L.regionDe(C, "hauts-verts");
  const n = L.natureInitiale(region);
  assert.equal(n.cueillette, 30);
  const e = L.exploiterNature(n, "cueillette", 40);
  assert.equal(e.pris, 30);
  const dec = L.regenererNature(e.nature, region, { saison: "pluies", mois: 12 });
  const juin = L.regenererNature(e.nature, region, { saison: "seche", mois: 6 });
  assert.ok(dec.cueillette > juin.cueillette, "letchis de décembre");
  assert.equal(L.regenererNature(n, region, { saison: "pluies", mois: 12 }).cueillette, 30, "plafond");
});
