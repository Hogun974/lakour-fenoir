// Lot 5 « fouille » (contrat §25) : l'API du système (couche Foundry) sur la doublure en mémoire, avec le VRAI contenu de
// lakour-fenoir : fouiller un lieu (le lieu vu, son mot, ce qu'on y a trouvé, les objets créés), les lieux d'une région (le degré au MJ
// seul), récolter, démonter une installation de l'abri, les bêtes prises (abattre, relâcher, l'enclos), la fenêtre du MJ.
//   Lancer : npm run essais
import { test } from "node:test";
import assert from "node:assert/strict";
import { installerFoundry, commeJoueur } from "./doublures/foundry-survie.mjs";
import { charger, monde, survivantTire } from "./doublures/survie-api-outils.mjs";
import { creerHasard } from "../systems/lakour-survie/logique/hasard.mjs";

installerFoundry();
const M0 = await charger();

async function partie({ region = "saint-denis", site = "barre-du-chaudron", graine = "fouille-api" } = {}) {
  const M = await monde(M0);
  const hasard = creerHasard(graine);
  const a = await survivantTire(M, { hasard });
  const b = await survivantTire(M, { hasard });
  await M.api.demarrer({ region, membres: [a.id, b.id], graine, essai: true });
  const ins = await M.api.installer({ site });
  await M.api.ajuster({ stocks: { nourriture: 40, eau: 30, materiaux: 20, pieces: 10 }, raison: "réserves" });
  return { M, a, b, abri: game.actors.get(ins.abriId) };
}

test("API : les fonctions de la fouille existent ; hors du MJ actif, celles qui écrivent refusent", async () => {
  const { M } = await partie();
  for (const f of ["lieux", "gisements", "betes", "mettreEnEnclos", "abattre", "lacherBetes", "demonter"]) assert.equal(typeof M.api[f], "function", f);
  for (const [nom, args] of [["demonter", { installationId: "x" }], ["abattre", { id: "x" }], ["fouiller", { cible: "lieu", genre: "case" }]]) {
    await commeJoueur("u1", () => assert.rejects(() => M.api[nom](args), /PasMJActif/, nom));
  }
});

test("API : fouiller un lieu — le lieu vu (son mot, le travail fait), ce qu'on y a trouvé ; lieux() le montre, le degré au MJ seul", async () => {
  const { M, a } = await partie();
  const quart = M.api.etat().horloge.quart;
  const r = await M.api.fouiller({ cible: "lieu", genre: "pharmacie", membres: [a.id], quarts: 1 });
  assert.equal(r.lieu.genre, "pharmacie");
  assert.equal(r.lieu.fait, 1);
  assert.ok(Array.isArray(r.trouve) && r.fouille);
  assert.equal(M.api.etat().horloge.quart, quart + 1);
  const etat = M.api.etat();
  assert.ok(Object.values(etat.lieux).some(x => x.genre === "pharmacie" && x.mot === r.lieu.mot));
  assert.ok(!JSON.stringify(etat.lieux).includes("degre"), "le degré n'est pas public");
  const l = M.api.lieux();
  assert.equal(l.region, "saint-denis");
  assert.ok(l.genres.find(g => g.genre === "pharmacie").vus === 1);
  assert.equal(typeof l.vus[0].degre, "number", "le MJ voit le degré");
  assert.ok(etat.journal.some(j => j.cle === "fouille-lieu"));
  // On reprend le même lieu (le premier commencé), puis il est fini.
  const r2 = await M.api.fouiller({ cible: "lieu", genre: "pharmacie", quarts: 2 });
  assert.equal(r2.lieu.cle ?? Object.keys(M.api.etat().lieux)[0], Object.keys(M.api.etat().lieux)[0]);
  assert.ok(r2.lieu.fini);
  // Un refus ne fait pas passer le temps.
  const q = M.api.etat().horloge.quart;
  await assert.rejects(() => M.api.fouiller({ cible: "lieu", genre: "licorne" }), /genre de lieu inconnu|unknown kind/);
  await assert.rejects(() => M.api.fouiller({ cible: "rien" }), /CibleInconnue|cible|target/i);
  assert.equal(M.api.etat().horloge.quart, q);
});

test("API : un lieu de culte laisse un rappel au journal secret, jamais au journal du groupe", async () => {
  const { M } = await partie();
  await M.api.fouiller({ cible: "lieu", genre: "lieu-de-culte", quarts: 1 });
  assert.ok(!M.api.etat().journal.some(j => j.cle === "fouille-culte"));
  assert.ok(M.api.monde().journalSecret.some(j => j.cle === "fouille-culte"));
});

test("API : récolter un gisement des alentours ; gisements() dit les milieux, ce qui est disponible (au MJ)", async () => {
  const { M } = await partie();
  const g = M.api.gisements();
  assert.ok(g.milieux.some(m => m.cle === "bourg"));
  const bambou = g.gisements.find(x => x.cle === "bambou");
  assert.ok(bambou.recoltable && bambou.disponibles === bambou.nombre);
  const r = await M.api.fouiller({ cible: "matieres", gisement: "bambou", quarts: 1 });
  assert.equal(r.gisement, "bambou");
  assert.equal(r.fouille, false);
  assert.ok(M.api.gisements().gisements.find(x => x.cle === "bambou").disponibles < bambou.nombre);
});

test("API : démonter une installation de l'abri — la moitié de ses coûts, elle disparaît, le temps passe", async () => {
  const { M, abri } = await partie();
  const inst = abri.items.contents.find(i => i.type === "installation" && i.system.cle === "barricades");
  assert.ok(inst, "la barre du Chaudron a ses barricades");
  const avant = abri.system.stocks.materiaux;
  const q = M.api.etat().horloge.quart;
  const r = await M.api.demonter({ installationId: inst.id });
  assert.deepEqual(r.rend, { materiaux: 1 });
  assert.equal(game.actors.get(abri.id).system.stocks.materiaux, avant + 1);
  assert.ok(!game.actors.get(abri.id).items.contents.some(i => i.id === inst.id));
  assert.ok(M.api.etat().horloge.quart > q);
  await assert.rejects(() => M.api.demonter({ installationId: "inconnue" }), /inconnue|Unknown/i);
});

test("API : les bêtes prises — betes(), abattre (la viande à l'abri), relâcher ; l'enclos qu'il faut (les fonctions du lot 8 depuis la vague 3)", async () => {
  const { M, abri } = await partie();
  const etat = M.api.etat();
  const q = etat.horloge.quart;
  await game.settings.set("lakour-survie", "partie", { ...etat, groupe: { ...etat.groupe, betes: [
    { id: "b1", cle: "cabri", nombre: 1, prisLe: q, jusqua: q + 6, enclos: "", abri: "" },
    { id: "b2", cle: "poule", nombre: 2, prisLe: q, jusqua: q + 4, enclos: "", abri: "" }] } });
  const b = M.api.betes();
  assert.equal(b.length, 2);
  assert.equal(b[0].reste, 6);
  // Sans enclos à cabris à l'abri, la bête reste portée.
  const m = await M.api.mettreEnEnclos({ beteId: "b1" });
  assert.equal(m.betes[0].entrent, 0);
  assert.equal(M.api.betes().length, 2);
  const avant = game.actors.get(abri.id).system.stocks.nourriture;
  const r = await M.api.abattre({ beteId: "b1" });
  assert.equal(r.viande, 6);
  assert.equal(game.actors.get(abri.id).system.stocks.nourriture, avant + 6);
  await M.api.lacherBetes({ beteId: "b2" });
  assert.equal(M.api.betes().length, 0);
  assert.ok(M.api.etat().journal.some(j => j.cle === "Faits.bete-abattue" || j.cle === "bete-abattue"));
});

test("fenêtre du MJ : les cibles de la fouille, les genres de la région, les gisements, les installations à démonter", async () => {
  const { M } = await partie();
  const { contexteMJ } = await import("../systems/lakour-survie/scripts/apps/mj.mjs");
  const ctx = await contexteMJ("actions", null);
  for (const c of ["lieu", "demonter", "matieres"]) assert.ok(ctx.cibles.some(o => o.valeur === c), c);
  assert.ok(ctx.genresIci.some(o => o.valeur === "pharmacie"));
  assert.ok(ctx.gisementsIci.some(o => o.valeur === "bambou"));
  assert.ok(!ctx.gisementsIci.some(o => o.valeur === "zerbaz"), "les zerbaz se cueillent (plantes)");
  assert.ok(ctx.aDemonter.length >= 1);
  assert.ok(ctx.fouilles && Array.isArray(ctx.fouilles.betes));
  void M;
});
