// Lot 10 (contrat §22) dans la couche Foundry, sur la doublure : les deux défauts de la fusion de la vague 1 (un jeune qui colporte
// ne se voit pas colporter ; un nom porté par deux survivants ne désigne personne, et le générateur n'en tire pas d'homonyme) ; la
// table de gestion (priorités, quotas, corvées), les rangs, le passage entre abris, changer de religion ; la boutique et sa marge,
// le carnet selon la réputation, l'étal du groupe ; la fenêtre du MJ.   Lancer : npm run essais
import { test } from "node:test";
import assert from "node:assert/strict";
import { installerFoundry } from "./doublures/foundry-survie.mjs";
import { charger, monde, survivantTire } from "./doublures/survie-api-outils.mjs";
import * as L from "../systems/lakour-survie/logique/index.mjs";

installerFoundry();
const M0 = await charger();
const { contexteMJ } = await import("../systems/lakour-survie/scripts/apps/mj.mjs");

const FONCTIONS = ["tableDeGestion", "corvees", "priorites", "quota", "corvee", "second", "admettre", "passage", "convertir", "tenirEtal", "releverEtal",
  "valeurObjet", "valeurPlan"];

// Trois survivants tirés à graine fixe, adultes, au sens moral et à la réputation nuls, installés à Saint-Pierre avec des vivres.
async function partie(graine = "lot-10") {
  const M = await monde(M0);
  const hasard = L.creerHasard(`${graine}-survivants`);
  const a = await survivantTire(M, { userId: "u1", hasard });
  const b = await survivantTire(M, { statut: "compagnon", hasard });
  const c = await survivantTire(M, { statut: "compagnon", hasard });
  for (const x of [a, b, c]) await x.update({ system: { age: 30, sensMoral: 0, reputation: 0 } });
  await M.api.demarrer({ region: "saint-pierre", membres: [a.id, b.id, c.id], graine, essai: true });
  await M.api.installer({ site: M.api.contenu().sites.find(s => s.region === "saint-pierre").cle });
  await M.api.ajuster({ stocks: { nourriture: 40, eau: 40, munitions: 10, medicaments: 4 }, raison: "réserves" });
  return { M, a, b, c };
}
const sens = a => Number(game.actors.get(a.id).system.sensMoral) || 0;

test("API : les fonctions du lot 10 existent ; le générateur ne tire pas le nom d'un survivant du monde", async () => {
  const { M, a, b, c } = await partie();
  for (const f of FONCTIONS) assert.equal(typeof M.api[f], "function", f);
  assert.equal(new Set([a.name, b.name, c.name]).size, 3, "trois noms différents");
  const noms = new Set((game.actors.contents ?? []).filter(x => x.type === "survivant").map(x => L.cleDeNom(x.name)));
  for (let i = 0; i < 30; i++) assert.ok(!noms.has(L.cleDeNom(M.api.generer({ statut: "compagnon" }).nom)), "pas d'homonyme d'un survivant du monde");
  assert.ok(["amicale", "neutre", "mefiante", "hostile"].includes((await M.api.genererRecrue({})).attitude), "la recrue porte son attitude");
});

test("défaut 1 : un jeune de 17 ans qui colporte porte l'acte et ne réagit pas en témoin ; les autres jeunes, si", async () => {
  const { M, a, b } = await partie("lot-10-temoin");
  await a.update({ system: { age: 17 } });
  await b.update({ system: { age: 16 } });
  const r = await M.api.rumeur({ sujet: "Le cousin", texte: "Il a volé une nasse.", vraie: false, malveillant: true, auteur: a.id });
  assert.equal(sens(a), L.ACTES_MORAUX.colporter, "le colporteur rougit, sans se révolter contre lui-même");
  assert.deepEqual(r.sens.enfants.map(e => e.acteurId), [b.id], "seul l'autre jeune est témoin");
  assert.deepEqual(r.sens.porteurs, [a.id]);
});

test("défaut 2 : un nom porté par deux survivants ne désigne personne ; un nom du groupe passe avant un homonyme hors du groupe", async () => {
  const { M, a, b, c } = await partie("lot-10-homonymes");
  await b.update({ name: a.name });
  const r = await M.api.rumeur({ sujet: "Le cousin", texte: "Et il triche aux dominos.", auteur: a.name });
  assert.equal(r.sens, null, "ambigu : personne ne porte l'acte");
  assert.deepEqual([sens(a), sens(b)], [0, 0], "ni le premier ni le second");
  await assert.rejects(() => M.api.acteMoral({ acteurs: [a.name], acte: "colporter" }), /ActeurInconnu/);
  // Un PNJ hors du groupe porte le même nom que c : le nom va au membre du groupe.
  await Actor.implementation.create({ name: c.name, type: "survivant", system: { age: 50 } });
  const r2 = await M.api.rumeur({ sujet: "Le cousin", texte: "Il cache du riz.", auteur: c.name });
  assert.deepEqual(r2.sens.porteurs, [c.id]);
  assert.equal(sens(c), L.ACTES_MORAUX.colporter);
});

test("la table de gestion : priorités, ce que chacun prendrait, quotas suivis au fil des jours, corvées ; la répartition suit la grille", async () => {
  const { M, a, b, c } = await partie("lot-10-gestion");
  let g = M.api.tableDeGestion();
  assert.equal(g.membres.length, 3);
  assert.ok(g.membres.every(m => L.TACHES_GRILLE.every(k => Number.isInteger(m.grille[k]))));
  assert.equal(g.membres.find(m => m.id === a.id).prendrait, "", "le joueur choisit lui-même");
  await M.api.priorites({ acteurId: b.id, grille: { garde: 1, eau: 2 } });
  g = M.api.tableDeGestion();
  const gb = g.membres.find(m => m.id === b.id);
  assert.ok(gb.grillePropre && gb.grille.garde === 1);
  assert.equal(gb.prendrait, "garde");
  // Avancer d'un jour : b prend la tâche de sa grille, même sans la répartition automatique.
  await M.api.quota({ acteurId: b.id, tache: "garde", jours: 3 });
  await M.api.corvee({ acteurId: b.id, corvee: "monter-la-garde" });
  await M.api.avancer({ quarts: 8, raison: "deux jours" });
  assert.equal(game.actors.get(b.id).system.tache, "garde");
  const q = M.api.tableDeGestion().quotas[0];
  assert.ok(q.fait >= 1 && q.jours === 3 && q.nom === b.name);
  assert.equal(M.api.tableDeGestion().membres.find(m => m.id === b.id).corvee, "monter-la-garde");
  await assert.rejects(() => M.api.corvee({ acteurId: b.id, corvee: "voler-des-poules" }), /Corvée inconnue/);
  await M.api.priorites({ acteurId: b.id, effacer: true });
  assert.equal(M.api.tableDeGestion().membres.find(m => m.id === b.id).grillePropre, false);
  await M.api.quota({ retirer: q.id });
  assert.deepEqual(M.api.tableDeGestion().quotas, []);
  assert.ok(M.api.corvees({ tache: "eau" }).some(x => x.cle === "puiser-de-l-eau"));
  // La fenêtre du MJ, onglet Groupe : la grille.
  const mj = contexteMJ("groupe");
  assert.equal(mj.gestion.membres.length, 3);
  assert.equal(mj.gestion.taches.length, L.TACHES_GRILLE.length);
  assert.ok(c);
});

test("les rangs : un second, un nouveau à la porte, la succession quand le chef meurt ; le passage entre abris", async () => {
  const { M, a, b, c } = await partie("lot-10-rangs");
  await M.api.chef({ acteurId: a.id });
  await M.api.second({ acteurId: b.id });
  assert.deepEqual(M.api.communaute().seconds, [b.id]);
  assert.equal(M.api.communaute().rangs[c.id], "membre");
  // Un nouveau, accueilli à la porte : pas encore second.
  const v = await M.api.frapper({ profil: "refugie" });
  const p = await M.api.porte({ visiteurId: v.id, decision: "accueillir" });
  assert.equal(M.api.communaute().rangs[p.acteurId], "nouveau");
  await assert.rejects(() => M.api.second({ acteurId: p.acteurId }), /nouveau/);
  await M.api.admettre({ acteurId: p.acteurId });
  assert.equal(M.api.communaute().rangs[p.acteurId], "membre");
  // Le chef meurt : son second prend la tête au jour qui passe.
  await a.update({ system: { vivant: false } });
  await M.api.avancer({ quarts: 4, raison: "un jour" });
  assert.equal(M.api.communaute().chef, b.id);
  assert.deepEqual(M.api.communaute().seconds, []);
  // Le passage avec une communauté séparée.
  const sep = await M.api.separer({ partants: [c.id], nom: "Ceux du bas" });
  const r = await M.api.passage({ communauteId: sep.communaute.id, ouvert: false });
  assert.equal(r.communaute.passage, false);
  assert.ok(M.api.etat().journal.some(e => e.cle === "passage-ferme"));
  const mj = contexteMJ("communaute");
  assert.ok(mj.communaute.membres.every(m => m.rang));
});

test("changer de religion dans un lieu de culte : un mois des deux ; la quitter se sait (une rumeur vraie)", async () => {
  const { M, b } = await partie("lot-10-religion");
  await M.api.ajusterEsprit({ acteurId: b.id, regard: "vivre", religion: "islam", pratique: true });
  assert.equal(game.actors.get(b.id).system.religion, "musulmane", "une ancienne clé s'écrit sous la nouvelle");
  await assert.rejects(() => M.api.convertir({ acteurId: b.id, religion: "catholique" }), /lieu de culte/);
  const r = await M.api.convertir({ acteurId: b.id, religion: "catholique", lieu: "L'église de la Rivière Saint-Louis" });
  assert.equal(r.religion, "catholique");
  assert.equal(r.rumeur, null, "un premier changement ne se colporte pas");
  const s = game.actors.get(b.id).system;
  assert.deepEqual(L.religionsDe(s, M.api.contenu()), ["catholique", "musulmane"]);
  const q = await M.api.convertir({ acteurId: b.id, religion: "aucune", lieu: "Chez lui" });
  assert.ok(q.quitte && q.rumeur && q.rumeur.cle === "rumeur-quitte-sa-foi");
  assert.ok(M.api.marche().rumeurs.some(x => x.sujet === b.name));
});

test("la boutique : la marge du commerçant selon la réputation et la parole ; le carnet prête selon elle ; l'étal vend les jours de marché", async () => {
  const { M, a } = await partie("lot-10-boutique");
  const o = await M.api.ouvrirBoutique({ nom: "La boutique du coin" });
  assert.ok(o.ok);
  // 4 munitions contre 6 nourritures : à la boutique, refusé pour un inconnu ; accepté au troc de la main à la main.
  const ev = M.api.evaluerTroc({ donne: { munitions: 4 }, recoit: { nourriture: 6 }, boutique: o.boutique.cle, parleurId: a.id });
  assert.equal(ev.accepte, ev.offerte >= ev.demandee);
  assert.ok(ev.vente > ev.achat && ev.offerte < ev.valeurDonnee, "le commerçant prend sa marge");
  assert.equal(M.api.evaluerTroc({ donne: { munitions: 4 }, recoit: { nourriture: 6 } }).accepte, true);
  await a.update({ system: { reputation: -10 } });
  const t = await M.api.troquer({ donne: { munitions: 4 }, recoit: { nourriture: 6 }, boutique: o.boutique.cle, parleurId: a.id });
  assert.equal(t.ok, false, "une mauvaise réputation, de mauvais prix");
  const cr = await M.api.crediter({ boutique: o.boutique.cle, biens: { nourriture: 9 }, parleurId: a.id });
  assert.equal(cr.ok, false, "son carnet prête moins à qui a mauvaise réputation");
  assert.ok(cr.facteur < 1);
  // L'étal au marché forain : posé, il vend le jour du marché ; on relève la caisse.
  const mk = await M.api.ouvrirMarche({ modele: "marche-du-quai-de-saint-pierre" });
  const avant = M.api.etat().groupe;
  const e = await M.api.tenirEtal({ marche: mk.marche.cle, biens: { nourriture: 20 }, contre: "eau", gardien: "Ti Paul" });
  assert.equal(e.etal.biens.nourriture, 20);
  await M.api.avancer({ quarts: 4 * 8, raison: "une semaine" });
  const etal = M.api.marche().etals[0];
  assert.ok(etal.biens.nourriture < 20, "il a vendu le jour du marché");
  const rel = await M.api.releverEtal({ etal: etal.id, fermer: true });
  assert.ok(rel.rendus.nourriture === etal.biens.nourriture);
  assert.deepEqual(M.api.marche().etals, []);
  assert.ok(avant);
  assert.equal(M.api.valeurObjet({ cle: "fusil-de-chasse" }).valeur, 20);
  assert.ok(contexteMJ("marche").marche.boutiquesTroc.length >= 2);
});
