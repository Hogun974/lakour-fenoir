// Médicaments et zerbaz (équilibrage du 2026-11-05, docs/equilibre.md « Médicaments et zerbaz ») : trousses de secours dans les
// fouilles, site d'hôpital, plantes médicinales cueillies, recette des tisanes, décoction et trousse pour une morsure, et le
// simulateur qui s'en sert comme un groupe raisonnable.   Lancer : npm run essais
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { L, contenuMini, constant, desFixes } from "./doublures/survie-outils.mjs";
import { chargerContenu, jouerPartie, REMEDES } from "./outils/simuler-parties.mjs";

const C = contenuMini();
const VRAI = chargerContenu();
const P = L.REGLES_ACTIONS.plantes;
const F = L.REGLES_ACTIONS.fouille;

test("plantes médicinales : une ressource de l'abri qui ne se pille pas, plafonnée", () => {
  assert.ok(L.RESSOURCES.includes("plantes"));
  assert.ok(!L.RESSOURCES_PILLABLES.includes("plantes"), "aucune région n'a de réserve de plantes");
  assert.equal(L.STOCKAGE_BASE.plantes, 12);
  assert.equal(L.plafonner({ plantes: 20 }, L.plafonds()).stocks.plantes, 12);
  assert.ok(!("plantes" in L.reservesDepart(L.regionDe(C, "port-gris"))));
});

test("cueillir des plantes : fouille des alentours (sans bruit, pas une fouille), prise dans la cueillette, doublée par le savoir", () => {
  const m = L.creerMonde(C, "plantes");
  const abri = { region: "hauts-verts", nature: { cueillette: 10, gibier: 5, peche: 0, bois: 5 } };
  const r = L.fouiller(m, C, constant(0.999), { region: "hauts-verts", cible: "plantes", membres: 2, quarts: 2, abri });
  const attendu = Math.ceil(P.parMembre * 4);
  assert.deepEqual(r.butin, { plantes: attendu });
  assert.equal(r.abri.nature.cueillette, 10 - attendu, "les plantes poussent avec la cueillette");
  assert.equal(r.bruit, 0);
  assert.equal(r.fouille, false, "cueillir ne compte pas comme une fouille pour l'autonomie");
  const savant = L.fouiller(m, C, constant(0.999), { region: "hauts-verts", cible: "plantes", membres: 2, quarts: 2, abri, savoirs: [P.savoir] });
  assert.equal(savant.butin.plantes, attendu * P.connaisseur);
  // Les alentours vidés ne rendent plus rien ; une région sans cueillette non plus.
  assert.deepEqual(L.fouiller(m, C, constant(0.999), { region: "hauts-verts", cible: "plantes", membres: 2, abri: { ...abri, nature: { cueillette: 0 } } }).butin, {});
  const sansCueillette = structuredClone(C);
  sansCueillette.regions.find(x => x.cle === "port-gris").nature.cueillette = 0;
  assert.deepEqual(L.fouiller(L.creerMonde(sansCueillette, "x"), sansCueillette, constant(0), { region: "port-gris", cible: "plantes", membres: 4 }).butin, {});
});

test("cueillette ordinaire : quelques plantes en plus de la nourriture, sans entamer la nature", () => {
  const m = L.creerMonde(C, "cueillette");
  const abri = { region: "hauts-verts", nature: { cueillette: 20, gibier: 5, peche: 0, bois: 5 } };
  const tout = L.fouiller(m, C, constant(0), { region: "hauts-verts", cible: "cueillette", membres: 2, quarts: 2, abri });
  const nourriture = tout.butin.nourriture;
  assert.ok(nourriture > 0);
  assert.equal(tout.butin.plantes ?? 0, Math.floor(P.cueillette * 4), "0,8 plante arrondi au hasard : 0 avec un tirage bas");
  assert.equal(tout.abri.nature.cueillette, 20 - nourriture, "seule la nourriture est prise dans la nature");
  const rien = L.fouiller(m, C, constant(0.999), { region: "hauts-verts", cible: "cueillette", membres: 2, quarts: 2, abri });
  assert.equal(rien.butin.plantes, 1, "0,8 plante arrondi au hasard : 1 avec un tirage haut");
  const savant = L.fouiller(m, C, constant(0.999), { region: "hauts-verts", cible: "cueillette", membres: 2, quarts: 2, abri, savoirs: [P.savoir] });
  assert.equal(savant.butin.plantes, 2, "1,6 plante avec le savoir des zerbaz");
  assert.equal(L.fouiller(m, C, constant(0.999), { region: "hauts-verts", cible: "peche", membres: 2, abri }).butin.plantes, undefined, "la pêche n'en rapporte pas");
});

test("trousse de secours : +1 médicament hors des réserves de la région, plus souvent en cherchant des médicaments", () => {
  const m = L.creerMonde(C, "trousse");
  const pT = F.trousse * 4; // 2 membres × 2 quarts
  const juste = L.fouiller(m, C, constant(pT - 0.001), { region: "port-gris", membres: 2, quarts: 2, jour: 3 });
  assert.equal(juste.trousse, 1);
  const sans = L.fouiller(m, C, constant(pT + 0.001), { region: "port-gris", membres: 2, quarts: 2, jour: 3 });
  assert.equal(sans.trousse, 0);
  // Même tirage : la trousse ajoute un médicament qui ne sort pas du pillage de la région.
  assert.equal((juste.butin.medicaments ?? 0) - (sans.butin.medicaments ?? 0), 1);
  assert.equal(juste.monde.regions["port-gris"].pillage.medicaments, sans.monde.regions["port-gris"].pillage.medicaments);
  // Chercher des médicaments : chance × 2,5 ; au plus 50 %.
  assert.equal(L.fouiller(m, C, constant(pT * F.cible - 0.001), { region: "port-gris", cible: "medicaments", membres: 2, quarts: 2, jour: 3 }).trousse, 1);
  assert.equal(L.fouiller(m, C, constant(F.trousseMax + 0.001), { region: "port-gris", cible: "medicaments", membres: 8, quarts: 8, jour: 3 }).trousse, 0);
  // Une région sans médicament au jour zéro n'en cache pas ; les alentours non plus.
  const desert = structuredClone(C);
  desert.regions.find(x => x.cle === "port-gris").ressources.medicaments = 0;
  assert.equal(L.fouiller(L.creerMonde(desert, "d"), desert, constant(0), { region: "port-gris", membres: 2, jour: 3 }).trousse, 0);
  assert.equal(L.fouiller(m, C, constant(0), { region: "port-gris", cible: "cueillette", membres: 2, jour: 3 }).trousse, 0);
});

test("fouiller un hôpital : médicaments × 3", () => {
  const H = structuredClone(C);
  const site = H.sites.find(s => s.region === "port-gris");
  site.type = "hopital";
  const m = L.creerMonde(H, "hopital");
  const hasard = constant(0.999);
  const ici = L.fouiller(m, H, hasard, { region: "port-gris", site: site.cle, cible: "medicaments", membres: 1, quarts: 1, jour: 3 });
  const ailleurs = L.fouiller(m, H, hasard, { region: "port-gris", cible: "medicaments", membres: 1, quarts: 1, jour: 3 });
  const q = m.regions["port-gris"].pillage.medicaments;
  assert.equal(ailleurs.butin.medicaments, Math.min(q, Math.floor(q * F.fraction.normal * F.cible + 0.999)));
  assert.equal(ici.butin.medicaments, Math.min(q, Math.floor(q * F.fraction.normal * F.cible * F.sites.hopital.medicaments + 0.999), F.plafond.normal));
  assert.ok(ici.butin.medicaments > ailleurs.butin.medicaments);
});

test("morsure : décoction de zerbaz ou trousse aident comme un médicament ; médicament et décoction se cumulent (+1 dé chacun)", () => {
  assert.equal(L.difficulteMorsure({ decoction: true }), "difficile");
  assert.equal(L.difficulteMorsure({ trousse: true }), "difficile");
  assert.equal(L.difficulteMorsure({ medicament: true, decoction: true }), "difficile", "jamais plus facile que difficile");
  assert.equal(L.difficulteMorsure({}), "extreme");
  assert.equal(L.bonusMorsure({}), 0);
  assert.equal(L.bonusMorsure({ medicament: true }), 1);
  assert.equal(L.bonusMorsure({ medicament: true, decoction: true }), 2);
  assert.equal(L.bonusMorsure({ outil: 2, infirmerie: 2 }), 2, "outil et installation : au plus +2 ensemble");
  assert.equal(L.bonusMorsure({ decoction: true, outil: 1, infirmerie: 1 }), 3);
  // Un soignant sans métier (soins 0) : un dé seul ne peut rien ; avec médicament et décoction, trois dés pour deux succès.
  const s = L.survivantNeuf({});
  const seul = L.resoudreTest({ niveau: 0, difficulte: L.difficulteMorsure({}), hasard: desFixes([6, 6, 6]) });
  assert.equal(seul.des.length, 1);
  assert.equal(L.appliquerMorsure(s, seul, 4).infecte, true);
  const aide = L.resoudreTest({ niveau: 0, difficulte: L.difficulteMorsure({ medicament: true, decoction: true }), bonus: L.bonusMorsure({ medicament: true, decoction: true }), hasard: desFixes([2, 5, 6]) });
  assert.equal(aide.des.length, 3);
  assert.equal(L.appliquerMorsure(s, aide, 4).infecte, false);
});

test("contenu : le savoir des zerbaz, la recette des tisanes (2 plantes → 1 médicament), des enfances et un passé qui le donnent", () => {
  const idx = L.indexer(VRAI);
  const zerbaz = idx.savoirs.get(P.savoir);
  assert.ok(zerbaz, "le savoir de la règle existe dans le contenu");
  const recette = idx.recettes.get(REMEDES.recette);
  assert.deepEqual(recette.cout, { plantes: 2 });
  assert.equal(recette.produit.ressource, "medicaments");
  assert.deepEqual(recette.requiert?.savoirs ?? [], [], "tout le monde sait faire bouillir une tisane ; le savoir donne +1 dé");
  // La recette, avec ses vraies règles de fabrication.
  const ok = L.fabriquer(recette, { stocks: { plantes: 3 }, niveau: 1, hasard: desFixes([6, 1]) });
  assert.equal(ok.stocks.plantes, 1);
  assert.equal(ok.stocks.medicaments, 1);
  const rate = L.fabriquer(recette, { stocks: { plantes: 2 }, niveau: 0, hasard: desFixes([1]) });
  assert.equal(rate.produit, null);
  assert.equal(rate.stocks.plantes, 1, "un échec rend la moitié des plantes");
  assert.equal(L.peutFabriquer(recette, { stocks: { plantes: 1 } }).ok, false);
  assert.ok(VRAI.enfances.filter(e => e.savoirs?.includes(P.savoir)).length >= 2);
  assert.ok(VRAI.passes.some(p => p.savoirs?.includes(P.savoir)));
  assert.ok(VRAI.sites.some(s => Number(s.stocks?.plantes) > 0), "des jardins de zerbaz à trouver");
  // Traductions : le savoir et la ressource.
  const en = JSON.parse(readFileSync(new URL("../modules/lakour-fenoir/contenu/en/savoirs.json", import.meta.url), "utf8"));
  assert.ok(Object.values(en).some(e => e.name?.fr === zerbaz.nom && e.name?.en), "savoir traduit");
  for (const langue of ["fr", "en"]) {
    const lang = JSON.parse(readFileSync(new URL(`../systems/lakour-survie/lang/${langue}.json`, import.meta.url), "utf8")).LAKOUR_SURVIE;
    assert.ok(lang.Ressources.plantes, `Ressources.plantes (${langue})`);
    assert.match(lang.Alertes.Morsure, langue === "fr" ? /décoction/ : /decoction/);
  }
});

test("simulateur : le solo sédentaire cueille des zerbaz, prépare des tisanes et soigne ses morsures avec", () => {
  let plantes = 0, tisanes = 0, morsures = 0, aidees = 0, jours = 0, avecMedicament = 0;
  for (const region of ["salazie", "le-tampon", "saint-paul", "est"]) for (const g of ["a", "b"]) {
    const s = jouerPartie(VRAI, { strategie: "sedentaire", membres: 1, region, graine: `remedes-${g}`, jours: 120 });
    plantes += s.plantes; tisanes += s.tisanes; morsures += s.morsures; aidees += s.morsuresAidees;
    jours += s.joursAbri; avecMedicament += s.joursAvecMedicament;
  }
  assert.ok(plantes > 0 && tisanes > 0, `${plantes} plantes, ${tisanes} tisanes`);
  assert.ok(avecMedicament / jours > 0.2, `un médicament ${Math.round(100 * avecMedicament / jours)} % des jours (2 % avant)`);
  assert.ok(aidees >= morsures / 2, `${aidees}/${morsures} morsures aidées`);
});
