// Fusion vague2 (contrat §23) : les jointures entre les lots corps (§19), cartes (§20), plans (§21) et communauté (§22).
// - la valeur d'un plan est celle du lot plans, comptée au troc et à la boutique du lot communauté ;
// - le journal d'un mort (lot cartes) rend ses plans selon la règle du lot plans, et ses papiers passent à un vivant ;
// - les repères (cartes, calendriers, montre) et la tente ont leur valeur au barème ;
// - un pratiquant à l'ancienne clé de sa religion fête la sienne ; le grand ménage du Nouvel An chinois lave l'abri.
// Lancer : npm run essais
import { test } from "node:test";
import assert from "node:assert/strict";
import { installerFoundry, valeur } from "./doublures/foundry-survie.mjs";
import { charger, monde, survivantTire } from "./doublures/survie-api-outils.mjs";
import * as L from "../systems/lakour-survie/logique/index.mjs";
import { chargerContenu } from "./outils/simuler-parties.mjs";

installerFoundry();
const M0 = await charger();
const C = chargerContenu();
const ID = "lakour-survie";

// Une partie à deux, installée, avec de quoi vivre.
async function partie({ site = "ilet-de-marla", graine = "GRAINE-VAGUE2-0001" } = {}) {
  const M = await monde(M0);
  const a = await survivantTire(M, { userId: "u1" });
  const b = await survivantTire(M, { statut: "compagnon" });
  const region = M.api.contenu().sites.find(s => s.cle === site).region;
  await M.api.demarrer({ region, membres: [a.id, b.id], graine, essai: true, dateDepart: "2026-12-04" });
  await M.api.installer({ site });
  await M.api.ajuster({ stocks: { nourriture: 120, eau: 120, materiaux: 30, pieces: 10 }, raison: "réserves" });
  return { M, a, b, region };
}
async function retoucher(fn) { const e = valeur(`${ID}.partie`); fn(e); await game.settings.set(ID, "partie", e); }
const papiers = a => a.items.contents.filter(i => i.type === "equipement" && (i.system.plans ?? []).length);
const savoirsDe = a => [...(a.system.savoirs ?? []), ...a.items.contents.filter(i => i.type === "savoir").map(i => i.system.cle)];

// ------------------------------------------------------------------ plans × communauté : la valeur d'un plan au marché
test("logique : une seule valeur d'un plan (lot plans), sous ses deux formes ; le troc et la boutique comptent les objets", () => {
  const cahier = L.planDuRegistre(C, "cahier-de-tisanes-de-la-gramoune");
  assert.equal(L.valeurPlan(cahier), L.valeurPlan({ rarete: L.rareteMoyenne(cahier), unique: true }), "la forme du marché donne la même valeur");
  assert.equal(L.valeurPlan({ rarete: 0 }), 3);
  assert.equal(L.valeurPlan({ rarete: 22.5 }), 8, "en parts entières");
  assert.equal(L.REGLES_MARCHE.plan, undefined, "plus de second barème des plans");
  // Le troc : un cahier unique (66 parts) contre 60 rations, accepté ; sans le cahier, rien n'est donné.
  const cours = L.coursDuJour();
  const v = L.valeurPlan(cahier);
  const avec = L.evaluerTroc({ donne: {}, recoit: { nourriture: 30 }, cours, objets: { donne: v } });
  assert.equal(avec.valeurDonnee, v);
  assert.equal(avec.accepte, true);
  assert.equal(L.evaluerTroc({ donne: {}, recoit: { nourriture: 30 }, cours }).accepte, false);
  // Recevoir un plan se paie comme un bien.
  const recu = L.evaluerTroc({ donne: { nourriture: 3 }, recoit: {}, cours, objets: { recoit: 6 } });
  assert.equal(recu.valeurRecue, 6);
  // La boutique : la marge du commerçant s'applique aussi aux objets.
  const b = L.evaluerALaBoutique({ donne: {}, recoit: { nourriture: 4 }, cours, objets: { donne: 20 } });
  assert.equal(b.valeurDonnee, 20);
  assert.equal(b.offerte, Math.round(20 * b.achat / 0.5) * 0.5);
  assert.deepEqual(L.evaluerTroc({ donne: { nourriture: 4 }, recoit: { eau: 2 }, cours }), L.evaluerTroc({ donne: { nourriture: 4 }, recoit: { eau: 2 }, cours, objets: {} }),
    "sans objets, rien ne change");
});

test("API : valeurPlan sous ses deux formes ; un papier vaut son plan au troc, à la boutique et dans valeurObjet", async () => {
  const { M, a } = await partie();
  assert.equal(M.api.valeurPlan({ rarete: 22.5 }).valeur, 8);
  assert.equal(M.api.valeurPlan({ rarete: 95, unique: true }).valeur, 66);
  const citerne = M.api.valeurPlan({ cle: "citerne-de-pluie" });
  assert.ok(citerne.valeur >= 1 && citerne.nom);
  const r = await M.api.recevoirPlan({ cle: "citerne-de-pluie", acteurId: a.id, de: "un voisin" });
  assert.deepEqual(M.api.valeurObjet({ objetId: r.objetId }).source, "plan");
  assert.equal(M.api.valeurObjet({ objetId: r.objetId }).valeur, M.api.valeurPlan({ cle: "citerne-de-pluie" }).valeur);
  assert.deepEqual(M.api.valeurObjet({ cle: "carnet-du-fontainier" }), { cle: "carnet-du-fontainier", valeur: L.valeurPlan(L.planDuRegistre(C, "carnet-du-fontainier")), source: "plan" });
  // Au troc de la main à la main : le papier donné compte ; un plan reçu se paie.
  const ev = M.api.evaluerTroc({ donne: {}, recoit: { nourriture: 1 }, objetsDonnes: [r.objetId] });
  assert.equal(ev.objets.donne, M.api.valeurPlan({ cle: "citerne-de-pluie" }).valeur);
  assert.equal(ev.objets.detail[0].source, "plan");
  assert.equal(ev.accepte, true);
  const achat = M.api.evaluerTroc({ donne: { nourriture: 1 }, recoit: {}, plansRecus: ["cahier-de-tisanes-de-la-gramoune"] });
  assert.equal(achat.objets.recoit, 66);
  assert.equal(achat.accepte, false, "un cahier unique ne s'achète pas pour une ration");
  // À la boutique : la marge du commerçant.
  const o = await M.api.ouvrirBoutique({ nom: "La boutique du coin" });
  const bt = M.api.evaluerTroc({ donne: {}, recoit: { nourriture: 1 }, objetsDonnes: [r.objetId], boutique: o.boutique.cle, parleurId: a.id });
  assert.equal(bt.valeurDonnee, ev.objets.donne);
  assert.ok(bt.offerte < bt.valeurDonnee, "le commerçant rachète en dessous");
  assert.throws(() => M.api.evaluerTroc({ objetsDonnes: ["rien"] }));
});

// ------------------------------------------------------------------ cartes × plans : le journal d'un mort
test("API : le journal d'un mort garde ce qu'il savait par cœur ; lu sur le corps, ses plans vont au carnet et ses papiers à un vivant", async () => {
  const { M, a, b } = await partie();
  await retoucher(e => { e.groupe.plans = ["atelier"]; });
  await b.update({ system: { plans: ["potager"] } });
  const r = await M.api.recevoirPlan({ cle: "citerne-de-pluie", acteurId: b.id });
  assert.ok(b.items.get(r.objetId));
  await M.api.blesser({ acteurId: b.id, n: 4 });
  for (let i = 0; i < 12 && b.system.vivant !== false; i++) await M.api.avancer({ quarts: 1 });
  assert.equal(b.system.vivant, false);
  const mort = M.api.etat().morts.find(m => m.id === b.id);
  assert.ok(mort.journal.plans.includes("atelier") && mort.journal.plans.includes("potager"), "le carnet et ce qu'il savait par cœur");
  await retoucher(e => { e.groupe.plans = []; });
  const papiersAvant = papiers(a).length;
  const lu = await M.api.lireJournal({ mortId: b.id });
  assert.ok(lu.plans.includes("atelier") && lu.plans.includes("potager"), lu.plans.join(", "));
  assert.ok(M.api.etat().groupe.plans.includes("potager"));
  assert.equal(lu.papiers.length, 1, "le papier qu'il portait");
  assert.equal(papiers(b).length, 0);
  assert.equal(papiers(a).length, papiersAvant + 1);
  assert.ok(M.api.etat().journal.some(j => j.cle === "Plans.Journal.Repris"));
});

test("API : le journal d'un inconnu ; un plan de recette s'y lit, un plan qu'on ne sait pas lire reste une copie à lire", async () => {
  const { M, a, b } = await partie();
  const savoirs = new Set([...savoirsDe(a), ...savoirsDe(b)]);
  const illisible = L.liste(C.installations).map(i => i.cle).find(k => L.savoirsDuPlan(C, k).some(s => !savoirs.has(s)));
  const recette = L.liste(C.recettes).map(r => L.clePlanRecette(r.cle)).find(k => L.peutLirePlan(C, k, [...savoirs]).ok);
  assert.ok(illisible && recette);
  const avant = papiers(a).length + papiers(b).length;
  const r = await M.api.lireJournal({ de: "Un randonneur", date: "2026-12-05", plans: [recette, illisible] });
  assert.deepEqual(r.plans, [recette]);
  assert.ok(M.api.etat().groupe.plans.includes(recette));
  assert.ok(!M.api.etat().groupe.plans.includes(illisible));
  assert.deepEqual(r.papier.plans, [illisible]);
  assert.equal(papiers(a).length + papiers(b).length, avant + 1, "une copie, à lire plus tard");
  await assert.rejects(() => M.api.lireJournal({ de: "x", plans: ["tour-eiffel"] }), /tour-eiffel/);
});

// ------------------------------------------------------------------ cartes, corps × communauté : le barème
test("contenu : chaque repère et la tente ont une valeur au marché ; le barème ne nomme que des objets du jeu ou des bêtes", () => {
  const equipements = L.liste(C.equipements);
  const reperes = equipements.filter(e => e.repere?.type);
  assert.ok(reperes.length >= 15);
  for (const e of reperes) assert.ok(L.valeurObjet(e.cle, C).valeur > 0, e.cle);
  assert.equal(L.valeurObjet("carte-routiere-de-l-ile", C).valeur, 6);
  assert.equal(L.valeurObjet("calendrier-des-postes", C).valeur, 1.5);
  assert.deepEqual(L.valeurObjet("tente", C), { valeur: 5, source: "bareme" });
  for (const e of equipements.filter(x => x.bivouac || x.parade)) assert.ok(L.valeurObjet(e.cle, C).valeur > 0, e.cle);
  const betes = ["poule", "lapin", "cabri", "porcelet", "veau-moka", "essaim"];
  const cles = new Set(equipements.map(e => e.cle));
  for (const k of Object.keys(C.bareme.objets)) assert.ok(cles.has(k) || betes.includes(k), `barème : « ${k} » n'est pas un objet du jeu`);
});

// ------------------------------------------------------------------ communauté × moral × corps : la fête de sa religion, le grand ménage
test("fêtes : au Nouvel An chinois, le bouddhiste pratiquant (même sous l'ancienne clé) gagne 1 de plus ; le grand ménage lave l'abri", () => {
  const fete = L.liste(C.fetes).find(f => f.cle === "nouvel-an-chinois");
  assert.match(fete.gain, /souillure/);
  const { effet } = L.effetDeFete(fete);
  assert.ok(effet.hygiene, "la fête porte le grand ménage");
  const neuf = extra => L.survivantNeuf({ statut: "compagnon", regard: "vivre", religions: [], pratique: true, ancrage: "", moral: 2, ...extra });
  const survivants = [{ id: "a", system: neuf({ religion: "culte-chinois" }) }, { id: "b", system: neuf({ religion: "bouddhiste" }) },
    { id: "c", system: neuf({ religion: "catholique" }) }];
  const etat = { ...L.etatVide(), groupe: { ...L.etatVide().groupe, membres: ["a", "b", "c"] } };
  const abri = { system: { stocks: { nourriture: 20, eau: 20 }, souillure: 40 } };
  const r = L.feter(etat, abri, { fete: "nouvel-an-chinois", annee: 2027, survivants, contenu: C, effet, jour: 5 });
  assert.equal(r.ok, true);
  const moral = id => r.survivants.find(x => x.id === id).system.moral;
  assert.equal(moral("a"), moral("b"), "l'ancienne clé fête comme la nouvelle");
  assert.equal(moral("a") - moral("c"), 1, "sa fête : 1 de plus");
  assert.equal(r.abri.system.souillure, 0, "l'abri lavé");
  assert.ok(L.hygieneDuJour(r.etat, 10), "un mois où les maladies prennent moitié moins");
  assert.ok(L.coreligionnaires(survivants[0].system, survivants[1].system, C), "ils prient ensemble");
});
