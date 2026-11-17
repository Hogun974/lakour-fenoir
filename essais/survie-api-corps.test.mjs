// Lot « corps » (contrat §19) : l'API du système (couche Foundry) sur la doublure en mémoire, avec le VRAI contenu de lakour-fenoir :
// le sommeil et l'hygiène lus par corps() ; ce que voient les joueurs d'un malade (symptomes, la fiche) ; le soin d'une morsure dont
// l'issue va au MJ seul ; les chutes ; le ménage ; le bouclier ; le bivouac ; la fenêtre du MJ.   Lancer : npm run essais
import { test } from "node:test";
import assert from "node:assert/strict";
import { installerFoundry, commeJoueur, messages } from "./doublures/foundry-survie.mjs";
import { charger, monde, survivantTire } from "./doublures/survie-api-outils.mjs";

installerFoundry();
const M0 = await charger();

async function partie(region = "saint-paul") {
  const M = await monde(M0);
  const a = await survivantTire(M, { userId: "u1" });
  const b = await survivantTire(M);
  await M.api.demarrer({ region, membres: [a.id, b.id], graine: "corps-api", essai: true });
  const site = M.api.contenu().regions.find(r => r.cle === region).sites[0];
  const ins = await M.api.installer({ site });
  await M.api.ajuster({ stocks: { nourriture: 80, eau: 60, medicaments: 3, plantes: 3 }, raison: "réserves" });
  return { M, a, b, abri: game.actors.get(ins.abriId) };
}

test("API : les fonctions du lot « corps » existent ; hors du MJ actif, celles qui écrivent refusent", async () => {
  const { M, a } = await partie();
  for (const f of ["corps", "symptomes", "bivouac", "dormir", "soignerMorsure", "chute", "menage", "parer", "grisConnu"]) assert.equal(typeof M.api[f], "function", f);
  for (const [nom, args] of [["dormir", { acteurId: a.id }], ["soignerMorsure", { acteurId: a.id }], ["chute", { acteurId: a.id, hauteur: 6 }], ["menage", {}], ["grisConnu", {}]]) {
    await commeJoueur("u1", () => assert.rejects(() => M.api[nom](args), /PasMJActif/, nom));
  }
});

test("API : le sommeil de chacun (la nuit à l'abri, une veillée), l'hygiène de l'abri ; dormir rattrape ; la fiche dit le sommeil", async () => {
  const { M, a, b, abri } = await partie();
  await M.api.avancer({ quarts: 4, eveilles: [a.id] });
  assert.equal(a.system.veille, 4, "une veillée : une nuit blanche");
  assert.equal(b.system.veille, 0);
  const c = M.api.corps();
  assert.equal(c.membres.find(m => m.id === a.id).sommeil, "epuise");
  assert.ok(c.abri && Number.isInteger(c.abri.hygiene) && Number.isInteger(c.abri.insalubrite));
  assert.ok(typeof c.abri.souillure === "number", "le MJ voit la souillure chiffrée");
  assert.ok("insalubrite" in M.api.etat().bilan && !("souillure" in M.api.etat().bilan), "l'état public : le niveau, pas le chiffre");
  const { contexteSurvivant } = await import("../systems/lakour-survie/scripts/apps/fiches.mjs");
  assert.equal(contexteSurvivant(a, { gm: true }).sommeil.etat, "epuise");
  const r = await M.api.dormir({ acteurId: a.id, quarts: 1 });
  assert.equal(r.lieu, "abri");
  assert.equal(a.system.veille, 0);
  assert.ok(M.api.etat().journal.some(e => e.cle === "Corps.Journal.Dort"));
  assert.ok(abri.system.souillure > 0, "un jour à deux : la souillure monte");
});

test("API : soigner une morsure : le joueur lit « pansée », le résultat va au MJ seul (carte secrète, journal secret)", async () => {
  const { M, a, b } = await partie();
  await M.api.blesser({ acteurId: a.id, n: 1, morsure: true });
  const avant = messages.length;
  const r = await M.api.soignerMorsure({ acteurId: a.id, soigneurId: b.id });
  assert.equal(r.pansee, true);
  assert.equal(r.difficulte, "difficile", "avec un médicament et une décoction");
  assert.equal(r.medicament && r.decoction, true);
  assert.ok(r.mj && typeof r.mj.infecte === "boolean", "le MJ apprend l'issue");
  const nouveaux = messages.slice(avant);
  const secret = nouveaux.find(m => m.flags?.["lakour-survie"]?.test);
  assert.ok(secret?.whisper?.length && secret.whisper.every(id => game.users.get(id)?.isGM), "la carte du test ne va qu'aux MJ");
  assert.ok(nouveaux.some(m => !m.whisper && /pansée|dressed/i.test(m.content)), "la carte publique ne dit que « pansée »");
  assert.deepEqual(a.system.morsure, { quart: M.api.etat().horloge.quart });
  const etat = M.api.etat();
  assert.ok(etat.journal.some(e => e.cle === "Corps.Journal.Pansee"));
  assert.ok(!etat.journal.some(e => /MorsureR/.test(e.cle)), "l'issue n'est pas au journal public");
  assert.ok(M.api.monde().journalSecret.some(e => /Corps\.Journal\.Morsure(Reussie|Ratee)/.test(e.cle)));
  // Ce que voit le joueur : la morsure pansée, rien d'autre (que l'infection ait pris ou non).
  const vu = await commeJoueur("u1", () => M.api.symptomes({ acteurId: a.id }));
  assert.ok(vu.morsure && vu.gris === null && !vu.mj);
  assert.equal(M.api.contenu().afflictions.length > 0, true);
  const { contexteSurvivant } = await import("../systems/lakour-survie/scripts/apps/fiches.mjs");
  const fiche = contexteSurvivant(a, { gm: false, proprietaire: true });
  assert.equal(fiche.infection, null, "le joueur ne voit pas la jauge du Gris");
  assert.ok(fiche.morsure);
});

test("API : un mal que le groupe ne reconnaît pas se lit par ses symptômes ; le MJ voit le nom", async () => {
  const { M, a } = await partie();
  await M.api.affliction({ acteurId: a.id, cle: "brulure" });
  await M.api.affliction({ acteurId: a.id, cle: "coup-de-chaleur" });
  const joueur = await commeJoueur("u1", () => M.api.symptomes({ acteurId: a.id }));
  const brulure = joueur.maux.find(m => m.cle === "brulure");
  assert.ok(brulure && brulure.reconnue, "une brûlure se voit");
  const inconnu = joueur.maux.find(m => !m.reconnue);
  if (inconnu) {
    assert.equal(inconnu.nom, "");
    assert.ok(inconnu.signes.length >= 3);
  }
  const mj = M.api.symptomes({ acteurId: a.id });
  assert.ok(mj.mj.afflictions.some(x => x.cle === "coup-de-chaleur"));
});

test("API : une chute (blessures, fracture, mort ; se recevoir) ; un Livide qui tombe rampe", async () => {
  const { M, a, b } = await partie();
  let r = await M.api.chute({ acteurId: a.id, hauteur: 2 });
  assert.equal(r.blessures, 0);
  r = await M.api.chute({ acteurId: a.id, hauteur: 6, reception: { reussite: false } });
  assert.equal(r.blessures, 2);
  assert.equal(r.fracture, true);
  assert.equal(a.system.blessures, 2);
  assert.ok(a.system.afflictions.some(x => x.cle === "fracture"));
  assert.ok(M.api.etat().journal.some(e => e.cle === "Corps.Journal.ChuteFracture"));
  r = await M.api.chute({ acteurId: b.id, hauteur: 40 });
  assert.equal(r.mort, true);
  assert.equal(b.system.vivant, false);
  assert.deepEqual(await M.api.chute({ livide: true, hauteur: 15 }), { livide: true, hauteur: 15, chancelle: false, rampe: true });
});

test("API : le ménage (la souillure baisse) ; le bivouac jugé ; parer au bouclier ; le Gris nommé", async () => {
  const { M, a, b, abri } = await partie();
  await abri.update({ system: { souillure: 20 } });
  assert.equal(M.api.corps().abri.etat, "sale");
  const m = await M.api.menage({ membres: [a.id, b.id], quarts: 2 });
  assert.equal(m.retire, Math.min(20, 2 * m.bras * 4), "4 par quart et par bras (un jeune de 16 à 18 ans compte 3/4)");
  assert.equal(abri.system.souillure, 20 - m.retire);
  const j = M.api.bivouac({ ravine: true, couvert: true });
  assert.equal(j.jugement, "dangereux");
  assert.equal(j.sommeil, "sol");
  assert.equal(j.textes.length, 1);
  for (const i of a.items.contents.filter(i => i.system?.parade)) await a.deleteEmbeddedDocuments("Item", [i.id]);
  await assert.rejects(() => M.api.parer({ acteurId: a.id, touches: 2 }), /bouclier|shield/i);
  const def = M.api.contenu().equipements.find(e => e.cle === "bouclier-de-tole");
  await a.createEmbeddedDocuments("Item", [{ name: def.nom, type: "equipement", system: { cle: def.cle, categorie: def.categorie, parade: def.parade } }]);
  const p = await M.api.parer({ acteurId: a.id, touches: 3 });
  assert.equal(p.seuil, 5);
  assert.equal(p.parees + p.passent, 3);
  assert.equal((await M.api.grisConnu({ connu: true })).grisConnu, true);
  assert.equal(M.api.corps().grisConnu, true);
});

test("API : avancer sait que le groupe porte de quoi bivouaquer ; la fenêtre du MJ montre « Le corps »", async () => {
  const { M, a } = await partie();
  const tente = M.api.contenu().equipements.find(e => e.cle === "tente");
  assert.equal(tente.bivouac, true);
  await a.createEmbeddedDocuments("Item", [{ name: tente.nom, type: "equipement", system: { cle: tente.cle, categorie: tente.categorie, bivouac: true } }]);
  assert.equal(M.api.corps().bivouac, true);
  const { contexteMJ } = await import("../systems/lakour-survie/scripts/apps/mj.mjs");
  const c = contexteMJ("partie");
  assert.ok(c.corps && c.corps.membres.length === 2 && c.corps.lieux.length === 3 && c.corps.abri);
  assert.equal(contexteMJ("monde").corps, null);
});
