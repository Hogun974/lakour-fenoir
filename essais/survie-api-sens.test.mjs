// Lot « sens » : l'API du système (couche Foundry) sur la doublure en mémoire, avec le VRAI contenu de lakour-fenoir : le temps du
// quart (pluie, brume, vent) dans quand() et l'état public, sans rien du secret ; l'habitude du noir (allumer, une nuit de plus,
// régler) ; la rue nettoyée qui baisse les rencontres ; la veillée en musique ; approcher un Livide ; l'écoute aux tests ; ce que
// montre la fenêtre du MJ ; l'odeur de l'abri au bilan.   Lancer : npm run essais
import { test } from "node:test";
import assert from "node:assert/strict";
import { installerFoundry, commeJoueur } from "./doublures/foundry-survie.mjs";
import { charger, monde, survivantTire } from "./doublures/survie-api-outils.mjs";

installerFoundry();
const M0 = await charger();

async function partie(region = "le-tampon", site = "ferme-de-la-plaine-des-cafres") {
  const M = await monde(M0);
  const a = await survivantTire(M);
  const b = await survivantTire(M);
  await M.api.demarrer({ region, membres: [a.id, b.id], graine: "sens-api", essai: true });
  const ins = await M.api.installer({ site });
  await M.api.ajuster({ stocks: { nourriture: 80, eau: 40 }, raison: "réserves" });
  return { M, a, b, abri: game.actors.get(ins.abriId) };
}

test("API : les fonctions du lot « sens » existent ; hors du MJ actif, celles qui écrivent refusent", async () => {
  const { M, a } = await partie();
  for (const f of ["sens", "noir", "nettoyer", "jouer", "approche"]) assert.equal(typeof M.api[f], "function", f);
  for (const [nom, args] of [["noir", { acteurId: a.id }], ["nettoyer", { tues: 3 }], ["jouer", { musiciens: [a.id] }]]) {
    await commeJoueur("u1", () => assert.rejects(() => M.api[nom](args), /PasMJActif/, nom));
  }
});

test("API : le temps du quart (pluie, brume, vent) dans quand() et l'état public, sans la graine ; la brume des Hauts l'après-midi", async () => {
  const { M } = await partie();
  await M.api.avancer({ quarts: 1 });
  const q = M.api.quand();
  assert.equal(q.moment, "apres-midi");
  assert.equal(typeof q.pluie, "boolean");
  assert.equal(q.brume, true, "Le Tampon (1 000 m), l'après-midi : la brume");
  assert.ok(q.vent && q.vent.vers && q.vent.mot);
  assert.equal(q.voix, "tamarins");
  const etat = M.api.etat();
  assert.equal(etat.temps.quart, etat.horloge.quart);
  assert.ok(!JSON.stringify(etat.temps).includes("sens-api"), "la graine reste secrète");
  assert.ok(["averse", "brume", "pluie", "cyclone"].includes(etat.meteo.temps), etat.meteo.temps);
  const s = M.api.sens();
  assert.equal(s.brume, true);
  assert.ok(s.corps && s.corps.etat === "frais");
  assert.equal(s.accoutumance.length, 2);
  assert.ok(s.odeur && Number.isInteger(s.odeur.odeur));
  const b = M.api.bilan();
  assert.ok("odeur" in b && "odeurBetes" in b);
  assert.ok("odeur" in etat.bilan, "l'instantané public porte l'odeur");
});

test("API : l'habitude du noir (une nuit de plus, régler, allumer) ; la garde de nuit s'habitue d'elle-même ; le palier au journal", async () => {
  const { M, a, b } = await partie();
  let r = await M.api.noir({ acteurId: a.id, action: "nuit" });
  assert.equal(r.nuits, 1);
  r = await M.api.noir({ acteurId: a.id, action: "nuit" });
  assert.equal(r.nuits, 1, "une seule par jour");
  r = await M.api.noir({ acteurId: a.id, action: "regler", nuits: 5 });
  assert.deepEqual([r.nuits, r.palier], [5, 1]);
  r = await M.api.noir({ acteurId: a.id, action: "lumiere" });
  assert.equal(r.effectif, 0, "il a allumé : un palier de moins");
  assert.equal(a.system.noir.nuits, 5);
  await assert.rejects(() => M.api.noir({ acteurId: a.id, action: "danser" }), /danser/);
  await b.update({ system: { tache: "garde" } });
  await M.api.avancer({ quarts: 4 * 2, veille: [b.id] });
  assert.equal(b.system.noir.nuits, 2);
  assert.ok(M.api.etat().journal.some(e => e.cle === "noir-palier-1"));
});

test("API : une rue nettoyée (moins de rencontres, au journal) ; la veillée en musique (+1 moral une fois par semaine, du bruit)", async () => {
  const { M, a, b, abri } = await partie();
  const r = await M.api.nettoyer({ tues: 20 });
  assert.equal(r.facteur, 0.25);
  assert.ok(M.api.etat().nettoyes.length === 1 && M.api.etat().journal.some(e => e.cle === "Percevoir.Journal.Nettoye"));
  await assert.rejects(() => M.api.nettoyer({ tues: 0 }), /Livides|Pallid/);
  assert.equal(M.api.sens().nettoyes[0].facteur, 0.25);
  await a.update({ system: { moral: 2 } });
  await b.update({ system: { moral: 3 } });
  const bruit = Number(abri.system.bruit) || 0;
  const v = await M.api.jouer({ musiciens: [a.id], air: "fort" });
  assert.deepEqual([v.moral, v.bruit], [1, 3]);
  assert.deepEqual([a.system.moral, b.system.moral], [3, 4]);
  assert.equal(abri.system.bruit, Math.min(10, bruit + 3));
  const w = await M.api.jouer({ musiciens: [b.id] });
  assert.equal(w.moral, 0, "une fois par semaine");
  assert.equal(a.system.moral, 3);
  await assert.rejects(() => M.api.jouer({ musiciens: [] }), /joue|playing/);
});

test("API : approcher un Livide ; écouter les yeux fermés donne un dé ; la fenêtre du MJ montre « Les sens »", async () => {
  const { M, a } = await partie();
  assert.equal(M.api.approche({ creature: "coureur", vent: "vers-lui" }).des, -2);
  assert.throws(() => M.api.approche({ creature: "licorne" }), /licorne/);
  const sans = await M.api.test({ acteurId: a.id, competence: "vigilance", dehors: true });
  const yeux = await M.api.test({ acteurId: a.id, competence: "vigilance", dehors: true, ecoute: "yeux-fermes" });
  assert.equal(yeux.noir - sans.noir, 1);
  assert.equal(yeux.bonusOutils - sans.bonusOutils, 1, "un dé de plus à la réserve");
  const joueur = await commeJoueur("u1", () => M.api.test({ acteurId: a.id, competence: "vigilance", dehors: true, ecoute: "yeux-fermes" }).catch(e => e));
  assert.ok(joueur instanceof Error || joueur.noir === 0, "un joueur ne se donne pas le dé de l'écoute");
  const { contexteMJ } = await import("../systems/lakour-survie/scripts/apps/mj.mjs");
  const c = contexteMJ("partie");
  assert.ok(c.sens && c.sens.accoutumance.length === 2 && c.sens.actionsNoir.length === 3 && c.sens.airs.length === 2);
  assert.ok(c.sens.temps.length > 0);
  assert.equal(contexteMJ("monde").sens, null, "seulement dans l'onglet de la partie");
});
