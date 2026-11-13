// Lot « savoirs » (docs/equilibre-savoirs.md, contrat §13) : les deux savoirs (sœurs lontan, matières de l'île, arbres,
// apprentissage, gramoune, cahier), le jardin créole (boutures, jardins des cases, livres), le gaz et l'eau chaude, le cyclone
// vécu (préparation, fuites, arbres, végétation, dépôt, vacarme, œil), les chiens (meutes, confiance, alertes) et les routes sans
// carburant (vélo en pente, véhicules électriques et modifiés, verrous). Logique pure, sur le VRAI contenu de lakour-fenoir.
// Lancer : npm run essais
import { test } from "node:test";
import assert from "node:assert/strict";
import { L, constant, desFixes } from "./doublures/survie-outils.mjs";
import { chargerContenu } from "./outils/simuler-parties.mjs";

const C = chargerContenu();
const I = (cle, niveau, extra = {}) => L.instanceInstallation(cle, niveau, { termineLe: -365, ...extra });
const abri = (site, extra = {}) => {
  const s = L.siteDe(C, site);
  return { site, region: s.region, stocks: L.normaliserStocks({ eau: 30, nourriture: 30, ...(extra.stocks ?? {}) }), nature: L.natureInitiale(L.regionDe(C, s.region)),
    sol: s.sol, bruit: 0, degats: 0, ...extra, ...(extra.stocks ? { stocks: L.normaliserStocks({ eau: 30, nourriture: 30, ...extra.stocks }) } : {}) };
};
const cond = (extra = {}) => ({ jour: 100, saison: "pluies", personnes: 2, ...extra });
const reussi = (marge = 0) => ({ reussite: true, marge, force: false });
const rate = (force = false) => ({ reussite: false, marge: -1, force });

// ------------------------------------------------------------------ ressources
test("gaz, boutures, carburant maison : nouvelles ressources ; un stock ou un monde d'avant les lit et les complète", () => {
  assert.ok(L.RESSOURCES_PILLABLES.includes("gaz"), "le gaz se pille (une bouteille sous chaque évier)");
  for (const r of ["boutures", "biocarburant"]) assert.ok(L.RESSOURCES.includes(r) && !L.RESSOURCES_PILLABLES.includes(r), r);
  assert.deepEqual([L.STOCKAGE_BASE.gaz, L.STOCKAGE_BASE.boutures, L.STOCKAGE_BASE.biocarburant], [26, 30, 10]);
  const vieux = { eau: 4, nourriture: 2, carburant: 1, medicaments: 0, munitions: 0, materiaux: 0, pieces: 0, graines: 0, plantes: 0, energie: 0 };
  assert.deepEqual(Object.keys(L.normaliserStocks(vieux)), L.RESSOURCES, "un stock d'avant reçoit les nouvelles clés à 0");
  assert.equal(L.normaliserStocks(vieux).gaz, 0);
  // Chaque région a du gaz au jour zéro, selon sa population ; un monde d'avant le gaz le reçoit à la part qui reste.
  for (const r of L.regionsDe(C)) assert.ok(L.reservesDepart(r).gaz > 0, r.cle);
  const m = L.creerMonde(C, "savoirs-gaz", {});
  const avant = structuredClone(m);
  for (const reg of Object.values(avant.regions)) { for (const k of Object.keys(reg.pillage)) reg.pillage[k] = Math.round(reg.pillage[k] / 2); delete reg.pillage.gaz; }
  const complete = L.completerPillage(structuredClone(avant), C);
  const sd = L.reservesDepart(L.regionDe(C, "saint-denis")).gaz;
  assert.ok(Math.abs(complete.regions["saint-denis"].pillage.gaz - sd / 2) <= 2, "à moitié pillé, à moitié de gaz");
  const r = L.simulerJour(avant, C, L.hasardDuJour("savoirs-gaz", 1), 1, {});
  assert.ok(Number.isFinite(r.monde.regions["saint-denis"].pillage.gaz), "la simulation complète un monde d'avant");
});

// ------------------------------------------------------------------ sœurs
test("sœurs : la moderne d'abord, la lontan en secours ; elle prend le relais quand la moderne casse ; rien ne s'additionne", () => {
  const a = abri("ferme-de-la-plaine-des-cafres");
  const b = L.bilanAbri(a, [I("citerne-de-pluie", 2), I("citerne-lontan", 2)], C, cond());
  assert.deepEqual(b.secours.map(x => x.cle), ["citerne-lontan"]);
  const seule = L.bilanAbri(a, [I("citerne-de-pluie", 2)], C, cond());
  assert.equal(b.production.eau, seule.production.eau, "la citerne lontan n'ajoute rien");
  assert.ok(b.plafonds.eau > seule.plafonds.eau, "les jarres gardent leur stockage");
  const cassee = L.bilanAbri(a, [I("citerne-de-pluie", 2, { etat: 3 }), I("citerne-lontan", 2)], C, cond());
  assert.equal(cassee.secours.length, 0);
  assert.ok(cassee.production.eau > 0 && cassee.production.eau < seule.production.eau, "la lontan prend le relais, moins bien");
  // Structurel : deux palissades ne font pas deux défenses.
  const d1 = L.bilanAbri(a, [I("palissade", 2)], C, cond()).defense;
  const d2 = L.bilanAbri(a, [I("palissade", 2), I("palissade-de-bambou", 2)], C, cond()).defense;
  assert.equal(d2, d1);
  const bambou = L.bilanAbri(a, [I("palissade", 2, { etat: 3 }), I("palissade-de-bambou", 2)], C, cond());
  assert.equal(bambou.defense, L.bilanAbri(a, [I("palissade-de-bambou", 2)], C, cond()).defense);
  // Un jardin créole seul : sans arrosage, il produit, des zerbaz aussi (reliquats) ; un potager à sec s'arrête et le jardin prend le relais.
  const sec = abri("ferme-de-la-plaine-des-cafres", { stocks: { eau: 0 } });
  const jardin = L.bilanAbri(sec, [I("potager", 2), I("jardin-creole", 2)], C, cond({ personnes: 4 }));
  assert.ok(jardin.arrets.some(x => x.cle === "potager" && x.raison === "eau"), "le potager s'arrête, faute d'eau");
  assert.ok(jardin.actives.includes("jardin-creole"), "le jardin créole, paillé, ne boit pas");
  assert.ok(jardin.production.nourriture > 0);
});

test("gaz et eau chaude : la gazinière boit le gaz ; à sec, le feu de bois (plus visible) prend le relais ; les chauffe-eau ne s'additionnent pas", () => {
  const a = abri("case-de-bellemene", { stocks: { gaz: 5 } });
  const g = L.bilanAbri(a, [I("gaziniere", 1), I("cuisine-commune", 1)], C, cond());
  assert.ok(g.actives.includes("gaziniere") && !g.actives.includes("cuisine-commune"));
  assert.equal(g.consommation.gaz, 1);
  assert.equal(g.net.gaz, -1);
  const vide = L.bilanAbri({ ...a, stocks: { ...a.stocks, gaz: 0 } }, [I("gaziniere", 1), I("cuisine-commune", 1)], C, cond());
  assert.ok(vide.arrets.some(x => x.cle === "gaziniere" && x.raison === "gaz"), "plus de gaz : la gazinière s'arrête");
  assert.ok(vide.actives.includes("cuisine-commune"), "le feu de bois prend le relais");
  assert.equal(L.bilanAbri({ ...a, stocks: { ...a.stocks, gaz: 0 } }, [I("gaziniere", 1), I("cuisine-commune", 1)], C, cond({ personnes: 12 })).visibilite,
    L.bilanAbri(a, [I("gaziniere", 1), I("cuisine-commune", 1)], C, cond({ personnes: 12 })).visibilite + 1, "la fumée se voit");
  assert.equal(vide.moral, g.moral, "on mange chaud quand même");
  const j = L.journeeAbri(a, [I("gaziniere", 1)], C, cond());
  assert.equal(j.abri.stocks.gaz, 4, "un kilo par jour");
  // Eau chaude : le soleil d'abord, le gaz ensuite, le feu de bois en dernier ; +1 moral et +1 dé aux soins, une seule fois.
  const tout = [I("eau-chaude-solaire", 1), I("eau-chaude-gaz", 1), I("eau-chaude-feu-de-bois", 1)];
  const e = L.bilanAbri(a, tout, C, cond());
  assert.deepEqual(e.secours.map(x => x.cle).sort(), ["eau-chaude-feu-de-bois", "eau-chaude-gaz"]);
  assert.equal(e.moral, 1);
  assert.equal(e.bonus.soins, 1);
  assert.ok(!e.consommation.gaz, "le chauffe-eau à gaz en secours ne consomme rien");
  const sansSoleil = L.bilanAbri(a, [I("eau-chaude-solaire", 1, { etat: 3 }), ...tout.slice(1)], C, cond());
  assert.ok(sansSoleil.actives.includes("eau-chaude-gaz") && sansSoleil.consommation.gaz === 1);
});

test("matières de l'île : prises sur le bois des alentours ; une lontan se répare avec elles", () => {
  const def = L.installationDe(C, "palissade-de-bambou");
  const site = L.siteDe(C, "ferme-de-la-plaine-des-cafres");
  const a = abri("ferme-de-la-plaine-des-cafres", { installations: [] });
  const ok = L.peutConstruire(def, undefined, { stocks: a.stocks, installations: [], nature: a.nature }, site, {});
  assert.equal(ok.ok, true, ok.raisons.join(" ; "));
  assert.equal(ok.cout.ile, 6);
  const sansBois = L.peutConstruire(def, undefined, { stocks: a.stocks, installations: [], nature: { ...a.nature, bois: 2.5 } }, site, {});
  assert.equal(sansBois.ok, false);
  assert.deepEqual(sansBois.motifs[0].params.manque, { ile: 4 });
  const o = L.ouvrirChantier(def, { stocks: a.stocks, installations: [], nature: a.nature }, site, {});
  assert.equal(o.nature.bois, a.nature.bois - 6);
  assert.deepEqual(o.stocks, a.stocks, "aucun matériau fouillé");
  // Réparer : 1 matière de l'île par point, pas de matériaux.
  const r = L.reparerInstallation(I("palissade-de-bambou", 1, { etat: 2 }), def, { quarts: 10, bras: 1, materiaux: 0, ile: 5 });
  assert.equal(r.repares, 2);
  assert.deepEqual(r.cout, { ile: 2, travail: 6 });
  const m = L.reparerInstallation(I("palissade", 1, { etat: 1 }), L.installationDe(C, "palissade"), { quarts: 10, materiaux: 3 });
  assert.equal(m.cout.materiaux, 1, "une moderne reste en matériaux");
  // Plans : un quart de matières de l'île en moins aussi.
  assert.equal(L.coutAvecPlans({ ile: 6, travail: 12 }, true).ile, 5);
});

test("boutures : repiquées le soir dans un jardin en service (elles deviennent des graines), sinon un tiers fane chaque jour", () => {
  const sans = L.repiquerBoutures({ boutures: 9 }, { actives: [] });
  assert.deepEqual([sans.stocks.boutures, sans.mortes], [6, 3]);
  const avec = L.repiquerBoutures({ boutures: 9, graines: 38 }, { actives: ["jardin-creole"], plafonds: { graines: 40 } });
  assert.deepEqual([avec.stocks.boutures, avec.stocks.graines, avec.repiquees, avec.mortes], [0, 40, 2, 7]);
  const a = abri("case-de-bellemene", { stocks: { boutures: 6 } });
  const j = L.journeeAbri(a, [I("potager", 1)], C, cond());
  assert.equal(j.abri.stocks.boutures, 0);
  assert.equal(j.abri.stocks.graines, 6);
});

test("visibilité : végétation abattue (−1 tous les 15 jours), veillée à la lumière ; le chien et les objets de confort au moral", () => {
  const a = abri("case-de-bellemene");
  const nombreux = cond({ personnes: 12 });
  const base = L.bilanAbri(a, [], C, nombreux).visibilite;
  assert.ok(base > 0);
  assert.equal(L.bilanAbri({ ...a, vegetation: { n: 3, depuis: 100 } }, [], C, nombreux).visibilite, base + 3);
  assert.equal(L.bilanAbri({ ...a, vegetation: { n: 3, depuis: 70 } }, [], C, nombreux).visibilite, base + 1);
  assert.equal(L.vegetationAbattue({ vegetation: { n: 3, depuis: 0 } }, 50), 0);
  assert.equal(L.bilanAbri({ ...a, lumiereLe: 100 }, [], C, nombreux).visibilite, base + 1);
  assert.equal(L.bilanAbri({ ...a, lumiereLe: 99 }, [], C, nombreux).visibilite, base);
  const chien = L.bilanAbri(a, [], C, cond({ chien: true }));
  assert.equal(chien.moral, 1);
  assert.equal(chien.bonus.vigilance, 1);
  const garde = L.bilanAbri({ ...a, stocks: { ...a.stocks, nourriture: 30 } }, [I("chiens-de-garde", 1)], C, cond({ chien: true }));
  assert.equal(garde.moral, 1, "le chien du groupe ne double pas les chiens de garde");
  // Par points entiers (rééquilibrage du 2026-11-13) : une natte seule (0,5) ne relève plus le plafond du moral d'un point entier.
  assert.equal(L.bilanAbri(a, [], C, cond({ confort: 0.5 })).moral, 0, "un seul objet à 0,5 ne suffit pas");
  assert.equal(L.bilanAbri(a, [], C, cond({ confort: 0.75 })).moral, 0, "trois paires de pinces à linge (0,25) non plus");
  assert.equal(L.bilanAbri(a, [], C, cond({ confort: 1 })).moral, 1, "deux nattes, ou quatre paires de pinces : +1");
  assert.equal(L.bilanAbri(a, [], C, cond({ confort: 3 })).moral, 1, "les objets de confort : +1 au plus");
  const idx = L.indexer(C);
  const pinces = idx.equipements.get("pinces-a-linge-en-bois"), natte = idx.equipements.get("natte-de-vacoa");
  assert.equal(pinces.effets.moral, 0.25, "les pinces à linge (1 matériau, 1 quart, sans savoir) comptent pour un quart");
  assert.equal(natte.effets.moral, 0.5);
  const dansLeJeu = n => L.effetJour(L.survivantNeuf({ moral: 3 }), { mange: true, confort: L.bilanAbri(a, [], C, cond({ confort: n })).moral }).system.moral;
  assert.equal(dansLeJeu(0.5), 3, "le moral ne monte pas au-dessus de 3 pour un demi-point de confort");
  assert.equal(dansLeJeu(1), 4);
});

// ------------------------------------------------------------------ cyclone
test("cyclone : préparé, rien n'est emporté et +1 de protection ; sinon le vent emporte ; fuites, arbres, fruits, végétation, dépôt", () => {
  const depots = [{ cle: "toles", nom: "des tôles", poids: 1, stocks: { materiaux: 3 } }];
  const a = abri("ferme-de-la-plaine-des-cafres", { stocks: { materiaux: 10, plantes: 4, boutures: 5, eau: 10 } });
  const ins = [I("citerne-de-pluie", 2)];
  const nonPrep = L.passageCyclone(a, ins, C, { force: 2, protection: 0, prepare: false, jour: 40, depots }, constant(0.99));
  assert.deepEqual(nonPrep.emportes, { materiaux: 4, plantes: 2, boutures: 5 });
  assert.equal(nonPrep.abri.stocks.materiaux, 10 - 4 + 3, "emporté, puis le dépôt des tôles");
  assert.equal(nonPrep.eau, 8, "4 eau par point de force");
  assert.equal(nonPrep.abri.eauDouteuse, 43);
  assert.deepEqual(nonPrep.abri.vegetation, { n: 2, depuis: 40 });
  const plafondBois = L.natureRegion(L.regionDe(C, "le-tampon")).bois.plafond;
  assert.equal(nonPrep.abri.nature.bois, a.nature.bois + plafondBois);
  assert.equal(nonPrep.depot.cle, "toles");
  const prep = L.passageCyclone(a, ins, C, { force: 2, protection: 0, prepare: true, jour: 40, depots }, constant(0.99));
  assert.deepEqual(prep.emportes, {});
  assert.equal(prep.protection, 1);
  assert.equal(L.passageCyclone(a, ins, C, { force: 1, protection: 3, prepare: true, jour: 40 }, constant(0)).protection, 3, "jamais plus de 3");
  // Le surplus d'alentours pourrit : le bois lentement, les fruits vite.
  const region = L.regionDe(C, "le-tampon");
  const n = L.natureRegion(region);
  const apres = L.regenererNature({ ...L.natureInitiale(region), bois: n.bois.plafond * 2, cueillette: n.cueillette.plafond * 2 }, region, { saison: "pluies", mois: 1 });
  assert.equal(apres.bois, Math.round((n.bois.plafond * (2 - L.POURRISSEMENT.bois)) * 100) / 100);
  assert.equal(apres.cueillette, Math.round((n.cueillette.plafond * (2 - L.POURRISSEMENT.cueillette)) * 100) / 100, "les fruits tombés pourrissent vite");
  assert.ok(L.POURRISSEMENT.cueillette > 5 * L.POURRISSEMENT.bois);
  // Préparation : valable cinq jours, si le travail est fait.
  assert.equal(L.travailPreparation(4), 6);
  assert.ok(L.preparationValable({ jour: 10, fait: 6, requis: 6 }, 14));
  assert.ok(!L.preparationValable({ jour: 10, fait: 6, requis: 6 }, 16));
  assert.ok(!L.preparationValable({ jour: 10, fait: 5, requis: 6 }, 11));
});

test("cyclone vécu : rafales et accalmies, l'œil au milieu de la trajectoire d'un cyclone fort, puis le vent qui revient ; dehors, les malus", () => {
  const c = { nom: "Essai", force: 3, trajectoire: ["saint-denis", "le-port", "saint-paul"], alerte: "rouge", arrivee: 10 };
  const d = L.deroulementCyclone(c, "le-port", constant(0.1));
  assert.equal(d.length, 4);
  const i = d.findIndex(q => q.vent === "oeil");
  assert.ok(i === 1 || i === 2, "l'œil passe sur la région du milieu");
  assert.equal(d[i + 1].vent, "retour");
  assert.deepEqual(d[i].dehors, L.DEHORS_CYCLONE.oeil);
  assert.ok(L.deroulementCyclone(c, "saint-denis", constant(0.1)).every(q => q.vent !== "oeil"), "pas d'œil sur les bords");
  assert.ok(L.deroulementCyclone({ ...c, force: 1 }, "le-port", constant(0.1)).every(q => q.vent !== "oeil"), "pas d'œil pour un petit cyclone");
  assert.deepEqual(L.deroulementCyclone(c, "mafate", constant(0.1)), []);
  assert.equal(d[0].vent, "rafales");
  assert.ok(L.DEHORS_CYCLONE.rafales.des < 0 && L.DEHORS_CYCLONE.rafales.discretion > 0);
});

test("cyclone : sous le vacarme, le bruit de l'abri ne compte pas ; les arbres coupent pistes et sentiers ; le bois tombe dans la région", () => {
  const m = L.creerMonde(C, "vacarme", {});
  m.cyclone = { nom: "Essai", force: 3, trajectoire: ["mafate"], alerte: "rouge", arrivee: 30 };
  assert.ok(L.sousLeVacarme(m, "mafate", 30));
  assert.ok(!L.sousLeVacarme(m, "mafate", 31) && !L.sousLeVacarme(m, "saint-denis", 30));
  m.regions.mafate.infestation = 3;
  // Avec un hasard fixe juste au-dessus de la chance sans bruit et en dessous de la chance avec bruit 10 : seul le bruit fait la menace.
  const sans = 3 * L.REGLES_MONDE.menace.livides;
  const h = constant(sans + 0.01);
  const bruyant = L.tirerMenaces({ ...m, cyclone: null }, C, h, { region: "mafate", jour: 30, bruit: 10 });
  assert.ok(bruyant.some(x => x.type === "livides"), "par temps calme, le bruit attire");
  assert.ok(!L.tirerMenaces(m, C, h, { region: "mafate", jour: 30, bruit: 10 }).some(x => x.type === "livides"), "sous le cyclone, ils n'entendent rien");
  // La simulation du jour rouge : arbres en travers sur les sentiers, bois au-dessus du plafond.
  const m2 = L.creerMonde(C, "arbres", {});
  m2.cyclone = { nom: "Essai", force: 3, trajectoire: ["mafate"], alerte: "orange", arrivee: 12 };
  const r = L.simulerJour(m2, C, constant(0.01), 12, {});
  const arbres = r.monde.regions.mafate.evenements.find(e => e.cle === "arbres-tombes");
  assert.ok(arbres && Object.values(arbres.routes).every(x => x === "coupee"), "des sentiers coupés par les arbres");
  assert.equal(arbres.jusqua, 12 + 3 * L.REGLES_MONDE.cyclone.joursArbres);
  assert.ok(r.monde.regions.mafate.nature.bois > L.natureRegion(L.regionDe(C, "mafate")).bois.plafond, "du bois pour des semaines");
});

test("éruption : la terre tremble la veille (un chien le sent) ; avancer : le chien s'agite avant le cyclone et le volcan", () => {
  const sauve = L.REGLES_MONDE.eruption;
  try {
    L.REGLES_MONDE.eruption = 1;
    const m = L.creerMonde(C, "premices", {});
    const r = L.simulerJour(m, C, L.hasardDuJour("premices", 3), 3, {});
    assert.equal(r.monde.eruption.debut, 4, "elle commence le lendemain");
    assert.ok(r.faits.some(f => f.cle === "eruption-premices"));
  } finally { L.REGLES_MONDE.eruption = sauve; }
  // Un chien à l'abri : l'alerte avant le ciel, même sans radio.
  const sauveC = L.REGLES_MONDE.cyclone.chance;
  try {
    L.REGLES_MONDE.cyclone.chance = 1;
    let trouve = false;
    for (let k = 0; k < 30 && !trouve; k++) {
      const graine = `chien-${k}`;
      const { monde, etat } = L.demarrerPartie({ contenu: C, graine, region: "le-tampon", membres: ["a"] });
      const ins = L.installerAbri(monde, C, { site: "ferme-de-la-plaine-des-cafres", jour: 0 });
      const e = { ...etat, groupe: { ...etat.groupe, abri: "abri" } };
      const r = L.avancer({ etat: e, monde: ins.monde, contenu: C, quarts: 4, survivants: [{ id: "a", system: L.survivantNeuf({}) }],
        abri: { id: "abri", system: ins.abri, installations: ins.installations }, options: { chien: true } });
      if (!(r.monde.cyclone?.trajectoire ?? []).includes("le-tampon")) continue;
      trouve = true;
      assert.ok(r.alertes.some(x => x.cle === "chien-agite-cyclone"), "le chien s'agite");
      const sans = L.avancer({ etat: e, monde: ins.monde, contenu: C, quarts: 4, survivants: [{ id: "a", system: L.survivantNeuf({}) }],
        abri: { id: "abri", system: ins.abri, installations: ins.installations }, options: {} });
      assert.ok(!sans.alertes.some(x => x.cle === "chien-agite-cyclone"), "sans chien, rien");
    }
    assert.ok(trouve, "une graine met la ferme sur la trajectoire");
  } finally { L.REGLES_MONDE.cyclone.chance = sauveC; }
});

test("avancer : le cyclone passe sur un abri préparé ou non ; la préparation est consommée ; l'eau douteuse double le risque", () => {
  const sauveC = L.REGLES_MONDE.cyclone.chance;
  try {
    L.REGLES_MONDE.cyclone.chance = 1;
    for (let k = 0; k < 30; k++) {
      const graine = `passage-${k}`;
      const { monde, etat } = L.demarrerPartie({ contenu: C, graine, region: "le-tampon", membres: ["a"] });
      const ins = L.installerAbri(monde, C, { site: "ferme-de-la-plaine-des-cafres", jour: 0 });
      const e = { ...etat, groupe: { ...etat.groupe, abri: "abri" } };
      const s = { ...ins.abri, stocks: L.ajouterStocks(ins.abri.stocks, { materiaux: 10, nourriture: 20 }), preparation: { jour: 1, fait: 20, requis: 6 } };
      const r = L.avancer({ etat: e, monde: ins.monde, contenu: C, quarts: 12, survivants: [{ id: "a", system: L.survivantNeuf({}) }],
        abri: { id: "abri", system: s, installations: ins.installations } });
      if (!(r.monde.cyclone?.trajectoire ?? []).includes("le-tampon") && !r.etat.journal.some(j => j.cle === "cyclone-arbres")) continue;
      assert.ok(r.etat.journal.some(j => j.cle === "cyclone-prepare"), "tout était fixé");
      assert.ok(!r.etat.journal.some(j => j.cle === "cyclone-emportes"));
      assert.equal(r.acteurs.abri.system.preparation, null, "la préparation sert une fois");
      assert.ok(r.acteurs.abri.system.vegetation?.n >= 1);
      return;
    }
    assert.fail("aucune graine ne met la ferme sur la trajectoire");
  } finally { L.REGLES_MONDE.cyclone.chance = sauveC; }
});

test("maladies : une eau douteuse non traitée double le risque des maladies de l'eau", () => {
  const gastro = L.indexer(C).afflictions.get("gastro-enterite");
  assert.equal(L.facteurRisque(gastro, { eauDouteuse: true }), 2 * L.facteurRisque(gastro, {}));
  assert.equal(L.facteurRisque(gastro, { eauDouteuse: true, eauTraitee: true }), L.facteurRisque(gastro, { eauTraitee: true }), "un filtre suffit");
});

// ------------------------------------------------------------------ savoirs, gramoune, chien
test("les deux arbres : chaque savoir en a un ; l'autonomie complète demande deux savoirs de chaque", () => {
  for (const s of L.liste(C.savoirs)) assert.ok(L.ARBRES.includes(s.arbre), s.cle);
  const p = L.savoirsParArbre(["zerbaz", "electricite-solaire", "jardin-creole", "inconnu"], C);
  assert.deepEqual(p, { moderne: ["electricite-solaire"], lontan: ["zerbaz", "jardin-creole"], autres: ["inconnu"] });
  assert.equal(L.autonomieComplete({ autonome: true, savoirs: ["zerbaz", "jardin-creole", "electricite-solaire"], contenu: C }).complete, false);
  const ok = L.autonomieComplete({ autonome: true, savoirs: ["zerbaz", "jardin-creole", "electricite-solaire", "radio"], contenu: C });
  assert.equal(ok.complete, true);
  assert.equal(L.autonomieComplete({ autonome: false, savoirs: ["zerbaz", "jardin-creole", "electricite-solaire", "radio"], contenu: C }).complete, false);
});

test("apprendre : livre 14 veillées et de la lumière ; maître 7 ; gramoune qui a confiance 4 pour un savoir lontan ; cahier 7", () => {
  const gramoune = { age: 78, savoirs: ["zerbaz", "elevage"], confiance: 3 };
  assert.ok(L.estGramoune(gramoune, C));
  assert.ok(!L.estGramoune({ age: 50, savoirs: ["zerbaz"] }, C) && !L.estGramoune({ age: 80, savoirs: ["radio"] }, C));
  assert.equal(L.dureeApprentissage({ source: "maitre", savoir: "zerbaz", maitre: gramoune, contenu: C }), 4);
  assert.equal(L.dureeApprentissage({ source: "maitre", savoir: "zerbaz", maitre: { ...gramoune, confiance: 2 }, contenu: C }), 7);
  assert.equal(L.dureeApprentissage({ source: "livre", savoir: "radio", contenu: C }), 14);
  assert.equal(L.dureeApprentissage({ source: "cahier", savoir: "zerbaz", contenu: C }), 7);
  let eleve = { savoirs: [] };
  for (let k = 1; k <= 4; k++) {
    const r = L.veilleeApprentissage(eleve, { savoir: "zerbaz", source: "maitre", maitre: gramoune, contenu: C });
    assert.ok(r.ok);
    assert.equal(r.lumiere, null, "une veillée orale ne demande pas de lumière");
    assert.equal(r.termine, k === 4);
    eleve = r.system;
  }
  assert.ok(eleve.savoirs.includes("zerbaz") && eleve.apprentissage === null);
  const livre = { enseigne: ["radio"] };
  const l1 = L.veilleeApprentissage({ savoirs: [] }, { savoir: "radio", source: "livre", livre, contenu: C, energie: 0 });
  assert.equal(l1.lumiere, "bougie");
  assert.equal(L.veilleeApprentissage({ savoirs: [] }, { savoir: "radio", source: "livre", livre, contenu: C, energie: 3 }).lumiere, "energie");
  assert.deepEqual(l1.system.apprentissage, { savoir: "radio", source: "livre", fait: 1, requis: 14 });
  // Refus lisibles.
  const refus = (args, cle) => assert.equal(L.veilleeApprentissage(args.eleve ?? { savoirs: [] }, { contenu: C, ...args }).motifs[0]?.cle, cle);
  refus({ savoir: "radio", source: "livre", livre: { enseigne: [] } }, "apprendre-livre");
  refus({ savoir: "radio", source: "maitre", maitre: gramoune }, "apprendre-maitre");
  refus({ eleve: { savoirs: ["radio"] }, savoir: "radio", source: "livre", livre }, "apprendre-deja");
  refus({ savoir: "nulle-part", source: "livre", livre }, "apprendre-savoir-inconnu");
});

test("confiance, dictée et cahier ; chien errant : veillée après veillée, il mord sur un test forcé raté, il est au groupe à 5", () => {
  assert.deepEqual(L.gagnerConfiance(2, reussi(0)), { confiance: 3, delta: 1 });
  assert.deepEqual(L.gagnerConfiance(2, reussi(2)), { confiance: 4, delta: 2 });
  assert.deepEqual(L.gagnerConfiance(2, rate(true)), { confiance: 1, delta: -1 });
  assert.deepEqual(L.gagnerConfiance(5, reussi(3)), { confiance: 5, delta: 0 });
  assert.deepEqual(L.gagnerConfiance(0, rate(true)), { confiance: 0, delta: 0 });
  // Dictée : il faut sa confiance ; six veillées ; le cahier enseigne ses savoirs lontan, pas les autres.
  const g = { age: 81, savoirs: ["zerbaz", "jardin-creole", "radio"], confiance: 2 };
  assert.equal(L.veilleeDictee(g, { contenu: C }).motifs[0].cle, "dictee-confiance");
  let sys = { ...g, confiance: 3 };
  let r;
  for (let k = 0; k < L.DICTEE.veillees; k++) { r = L.veilleeDictee(sys, { contenu: C }); assert.ok(r.ok); sys = r.system; }
  assert.equal(r.termine, true);
  assert.deepEqual(r.enseigne, ["zerbaz", "jardin-creole"]);
  assert.equal(L.veilleeDictee(sys, { contenu: C }).motifs[0].cle, "dictee-faite");
  assert.equal(L.veilleeDictee({ age: 40, savoirs: ["zerbaz"], confiance: 5 }, { contenu: C }).motifs[0].cle, "dictee-pas-gramoune");
  // Chien.
  let chien = { confiance: 0 };
  for (const t of [reussi(), reussi(2), reussi()]) chien = L.veilleeChien(chien, t).chien;
  assert.equal(chien.confiance, 4);
  const m = L.veilleeChien(chien, rate(true));
  assert.ok(m.morsure && !m.apprivoise && m.chien.confiance === 3);
  assert.ok(L.veilleeChien(chien, reussi()).apprivoise);
});

// ------------------------------------------------------------------ jardins, livres
test("fouilles : les jardins des cases (nourriture, boutures, zerbaz) s'épuisent et tiennent des mois ; les livres sont rares", () => {
  const m = L.creerMonde(C, "jardins", {});
  const r = L.fouiller(m, C, constant(0.5), { region: "saint-denis", site: "villa-rue-de-paris", cible: "jardins", membres: 2, quarts: 2, jour: 30 });
  assert.ok(r.butin.nourriture > 0 && r.butin.boutures > 0, JSON.stringify(r.butin));
  assert.ok(r.fouille, "on fouille la région : ça compte comme une fouille");
  assert.ok(r.monde.regions["saint-denis"].jardinsPris > 0);
  assert.equal(m.regions["saint-denis"].jardinsPris, undefined, "monde d'entrée intact");
  const region = L.regionDe(C, "saint-denis");
  assert.equal(L.jardinsDisponibles(region, {}, 30), L.jardinsDepart(region));
  assert.ok(L.jardinsDisponibles(region, {}, 300) < L.jardinsDepart(region) && L.jardinsDisponibles(region, {}, 300) > 0, "des mois après, il en reste");
  assert.equal(L.jardinsDisponibles(region, { jardinsPris: 10_000 }, 30), 0);
  const l = L.fouiller(m, C, constant(0), { region: "saint-denis", site: "college-de-la-montagne", cible: "livres", membres: 2, quarts: 1, jour: 30 });
  assert.ok(L.indexer(C).savoirs.has(l.livre), `livre : ${l.livre}`);
  assert.equal(l.monde.regions["saint-denis"].livresTrouves, 1);
  assert.ok(l.faits.some(f => f.cle === "livre-trouve"));
  assert.equal(L.fouiller(m, C, constant(0.99), { region: "saint-denis", cible: "livres", membres: 1, quarts: 1 }).livre, null);
  const epuisee = L.chanceLivre({ region, regMonde: { livresTrouves: 99 }, n: 4 });
  assert.equal(epuisee, 0, "une région n'a que quelques livres");
});

// ------------------------------------------------------------------ routes
test("se déplacer : le vélo descend vite et remonte en poussant ; un véhicule électrique boit l'énergie, un moteur modifié le carburant maison", () => {
  const velo = L.indexer(C).equipements.get("velo");
  assert.deepEqual(velo.pente, { descente: 0.6, montee: 2.5 });
  const v = { terrain: "route", quartsPied: 8, quartsVehicule: 2 };
  assert.ok(L.dureeEtape(v, velo, "ouverte", -700) < L.dureeEtape(v, velo, "ouverte", 0));
  assert.ok(L.dureeEtape(v, velo, "ouverte", 700) > L.dureeEtape(v, "pied", "ouverte"), "on remonte plus lentement qu'à pied");
  assert.ok(L.planifierChemin(C, "le-tampon", "saint-pierre", velo).quarts < L.planifierChemin(C, "saint-pierre", "le-tampon", velo).quarts, "presque à sens unique");
  const auto = L.indexer(C).equipements.get("voiture-electrique");
  assert.equal(auto.source, "energie");
  const m = L.creerMonde(C, "elec", {});
  const refus = L.voyager(m, C, constant(0.99), { de: "saint-denis", vers: "sainte-marie", transport: auto, reserves: { energie: 1 } });
  assert.equal(refus.possible, false);
  assert.equal(refus.motif.cle, "voyage-source");
  const ok = L.voyager(m, C, constant(0.99), { de: "saint-denis", vers: "sainte-marie", transport: auto, reserves: { energie: 30 } });
  assert.equal(ok.possible, true);
  assert.equal(ok.source, "energie");
  const alcool = L.indexer(C).equipements.get("voiture-a-l-alcool");
  const voiture = L.indexer(C).equipements.get("voiture");
  assert.equal(alcool.source, "biocarburant");
  assert.ok(L.planifierChemin(C, "saint-denis", "saint-pierre", alcool).quarts >= L.planifierChemin(C, "saint-denis", "saint-pierre", voiture).quarts, "moins bon qu'à l'essence");
  assert.equal(L.voyager(m, C, constant(0.99), { de: "saint-denis", vers: "sainte-marie", transport: alcool, reserves: { carburant: 50, biocarburant: 0 } }).possible, false,
    "un moteur modifié ne roule qu'au carburant maison");
  const charrette = L.indexer(C).equipements.get("charrette-a-boeufs");
  assert.ok(charrette.large && charrette.charge === 40 && charrette.bruit === 0);
});

test("verrous de la route : seulement en véhicule ; leur temps s'ajoute au voyage, le carburant siphonné aussi ; les épaves sèchent", () => {
  const etapes = [{ de: "a", vers: "b", terrain: "route" }, { de: "b", vers: "c", terrain: "sentier" }];
  assert.deepEqual(L.tirerVerrous(etapes, { vehicule: false, hasard: constant(0) }), []);
  const v = L.tirerVerrous(etapes, { vehicule: true, jour: 30, hasard: constant(0) });
  assert.equal(v.length, 1, "pas de verrou sur un sentier");
  assert.ok(v[0].quarts >= 1 && v[0].facons.length >= 2);
  assert.ok(L.carburantSiphonne(30, constant(0.99)) >= 1 && L.carburantSiphonne(300, constant(0.99)) === 0);
  const m = L.creerMonde(C, "verrous", {});
  const sans = L.voyager(m, C, constant(0.99), { de: "saint-denis", vers: "saint-pierre", transport: "vehicule", jour: 30 });
  const avec = L.voyager(m, C, constant(0), { de: "saint-denis", vers: "saint-pierre", transport: "vehicule", jour: 30 });
  assert.equal(sans.verrous.length, 0);
  assert.ok(avec.verrous.length > 0);
  assert.equal(avec.quarts, sans.quarts + avec.verrous.reduce((s, x) => s + x.quarts, 0));
  assert.ok(avec.faits.some(f => /^verrou-/.test(f.cle)));
  const pied = L.voyager(m, C, constant(0), { de: "saint-denis", vers: "saint-pierre", transport: "pied", jour: 30 });
  assert.equal(pied.verrous.length, 0, "à pied, on passe à côté");
});

test("meutes des routes : sur la route, plus de rencontres de chiens, et plus nombreux ; un sentier est plus silencieux", () => {
  const m = L.creerMonde(C, "meutes", {});
  let route = 0, fouille = 0, gros = 0, routeTot = 0, sentier = 0;
  const h = L.creerHasard("meutes");
  for (let k = 0; k < 4000; k++) {
    const r = L.tirerRencontre(m, C, h, { region: "le-tampon", jour: 90, contexte: "route" });
    if (r) routeTot++;
    if (r?.type === "animaux") { route++; if (r.nombre >= 6) gros++; }
    if (L.tirerRencontre(m, C, h, { region: "le-tampon", jour: 90, contexte: "fouille" })?.type === "animaux") fouille++;
    if (L.tirerRencontre(m, C, h, { region: "le-tampon", jour: 90, contexte: "route", facteur: L.REGLES_ACTIONS.sentier })) sentier++;
  }
  assert.ok(route > fouille, `${route} meutes sur la route contre ${fouille} en fouille`);
  assert.ok(gros > 0, "des meutes de 6 ou 7");
  assert.ok(sentier < routeTot, "un sentier est plus discret");
  assert.ok(L.liste(C.creatures).some(c => c.cle === "chien-de-tete" && c.type === "animal"));
});

// ------------------------------------------------------------------ contenu
test("contenu : chaque sœur lontan a sa moderne, ne coûte ni matériaux ni pièces, fait moins ; les gramounes, les dépôts du cyclone", () => {
  const idx = L.indexer(C).installations;
  const lontans = [...idx.values()].filter(d => d.arbre === "lontan" && d.role);
  assert.ok(lontans.length >= 9, `${lontans.length} sœurs lontan`);
  for (const d of lontans) {
    const moderne = [...idx.values()].find(x => x !== d && L.roleDe(x) === d.role && x.arbre !== "lontan");
    assert.ok(moderne, `${d.cle} : sa sœur moderne`);
    assert.ok(L.rangDe(moderne) < L.rangDe(d), `${d.cle} : la moderne passe d'abord`);
    for (const n of d.niveaux) assert.ok(!(n.cout.materiaux > 0) && !(n.cout.pieces > 0), `${d.cle} : rien de fouillé`);
    const prod = n => Object.values(n?.effets?.production ?? {}).reduce((s, x) => s + x, 0);
    d.niveaux.forEach((n, i) => { if (prod(n) && moderne.niveaux[i]) assert.ok(prod(n) <= prod(moderne.niveaux[i]), `${d.cle} ${i + 1} : moins performante`); });
  }
  assert.ok(!idx.has("panneaux-solaires-lontan") && ![...idx.values()].some(d => d.role === "panneaux-solaires" && d.cle !== "panneaux-solaires"), "pas de panneau à l'ancienne");
  // Gramounes : métissées (noms de plusieurs composantes), 60 ans ou plus, un savoir lontan, fragiles.
  assert.equal(C.gramounes.length, 4);
  for (const g of C.gramounes) {
    assert.ok(g.age >= 60 && g.incapacites.includes("travaux-lourds"), g.cle);
    assert.ok(L.estGramoune({ age: g.age, savoirs: g.savoirs }, C), g.cle);
    assert.ok(/\*[^*]+\*/.test(g.notes) && /\(/.test(g.notes), `${g.cle} : un préjugé en créole, avec son sens`);
  }
  assert.ok(new Set(C.gramounes.map(g => g.enfance)).size === 4, "quatre enfances différentes");
  // Dépôts du cyclone : de bonnes et de mauvaises surprises.
  assert.ok(C.depotsCyclone.some(d => d.stocks) && C.depotsCyclone.some(d => d.menace) && C.depotsCyclone.some(d => d.moral < 0));
});
