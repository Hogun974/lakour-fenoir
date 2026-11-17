// Lot 9 « Le paradis et son piège » (contrat §28) : l'API du système (couche Foundry) sur la doublure en mémoire, avec le VRAI contenu
// de lakour-fenoir : paradis() (le signe aux joueurs, la chaleur au MJ seul), la ronde jouée, les corps, le camp leurre, la chaleur
// corrigée, la vie sous terre, rallumer l'île (ile(), rallumer, chantierRegion), les jalons aux Chroniques, la fenêtre du MJ, la carte
// du tableau de bord, la fiche de l'abri.   Lancer : npm run essais
import { test } from "node:test";
import assert from "node:assert/strict";
import { installerFoundry, commeJoueur } from "./doublures/foundry-survie.mjs";
import { charger, monde, survivantTire } from "./doublures/survie-api-outils.mjs";

installerFoundry();
const M0 = await charger();

async function partie(region = "saint-paul", site = "case-de-bellemene") {
  const M = await monde(M0);
  const a = await survivantTire(M, { userId: "u1" });
  const b = await survivantTire(M);
  await M.api.demarrer({ region, membres: [a.id, b.id], graine: "paradis-api", essai: true });
  const ins = await M.api.installer({ site });
  await M.api.ajuster({ stocks: { nourriture: 80, eau: 60, materiaux: 30, pieces: 20, carburant: 10 }, raison: "réserves" });
  return { M, a, b, abri: game.actors.get(ins.abriId) };
}

test("API : les fonctions du lot 9 existent ; hors du MJ actif, celles qui écrivent refusent", async () => {
  const { M, a } = await partie();
  for (const f of ["paradis", "ile", "ronde", "traiterCorps", "leurre", "chaleur", "sousTerre", "rallumer", "chantierRegion"]) assert.equal(typeof M.api[f], "function", f);
  assert.equal(typeof M.api.corps, "function", "la lecture « corps » du lot corps est gardée");
  for (const [nom, args] of [["ronde", { membres: [a.id] }], ["traiterCorps", {}], ["leurre", {}], ["chaleur", { delta: 1 }], ["sousTerre", { vit: true }],
    ["rallumer", { region: "saint-paul" }], ["chantierRegion", { cle: "rallumer-le-phare-de-bel-air" }]]) {
    await commeJoueur("u1", () => assert.rejects(() => M.api[nom](args), /PasMJActif/, nom));
  }
});

test("API : paradis() dit le signe aux joueurs et la chaleur au MJ seul ; chaleur() la corrige ; l'état public n'a jamais le chiffre", async () => {
  const { M, abri } = await partie();
  const c = await M.api.chaleur({ valeur: 5, agglutines: 2 });
  assert.deepEqual(c, { chaleur: 5, agglutines: 2, signe: "viennent" });
  const mj = M.api.paradis();
  assert.equal(mj.mj.chaleur, 5);
  assert.equal(mj.mj.agglutines, 2);
  const joueur = await commeJoueur("u1", () => M.api.paradis());
  assert.equal(joueur.mj, undefined, "le joueur ne voit pas la chaleur");
  assert.ok(joueur.abri.signeTexte);
  await M.api.avancer({ quarts: 4 });
  assert.ok(["viennent", "assieges", "remarques"].includes(abri.system.signeChaleur), "le signe sur l'abri (public)");
  assert.ok(!JSON.stringify(M.api.etat()).includes("\"chaleur\":"), "jamais le chiffre dans l'état public");
  assert.ok(M.api.monde().paradis.lieux["case-de-bellemene"].chaleur > 0);
});

test("API : une ronde jouée en scène (abattus donnés) : la chaleur baisse, les corps s'entassent ; on les enterre, ou on les brûle (fumée)", async () => {
  const { M, a, b, abri } = await partie();
  // Deux adultes reposés : un bras chacun (tirés au hasard, un jeune de moins de 18 ans travaille moins vite, et l'essai comptait
  // parfois deux corps enterrés au lieu de trois ; vague 3).
  for (const x of [a, b]) await x.update({ system: { age: 30, fatigue: 0, blessures: 0 } });
  await M.api.chaleur({ valeur: 4, agglutines: 5 });
  const r = await M.api.ronde({ membres: [a.id], abattus: 4 });
  assert.equal(r.abattus, 4);
  assert.equal(r.restants, 1);
  assert.ok(r.chaleur < 4);
  assert.equal(abri.system.corps.reduce((s, x) => s + x.n, 0), 4);
  assert.equal(abri.system.rondeLe, 0);
  assert.ok(M.api.etat().journal.some(e => e.cle === "ronde-jouee"));
  const e = await M.api.traiterCorps({ action: "enterrer", membres: [a.id], quarts: 1 });
  assert.equal(e.traites, 3);
  assert.equal(e.restent, 1);
  await abri.update({ system: { nature: { ...abri.system.nature, bois: 5 } } });
  const br = await M.api.traiterCorps({ action: "bruler", membres: [b.id], quarts: 1 });
  assert.equal(br.traites, 1);
  assert.equal(br.fumee, true);
  assert.equal(abri.system.fumeeLe, 0);
  assert.ok(M.api.etat().journal.some(x => x.cle === "corps-brules"));
  await assert.rejects(() => M.api.traiterCorps({ action: "enterrer" }), /corps|bodies/i);
});

test("API : une ronde tirée par le système ; le camp leurre (un matériau, deux quarts, un test de discrétion)", async () => {
  const { M, a, abri } = await partie();
  await M.api.chaleur({ valeur: 6, agglutines: 3 });
  const r = await M.api.ronde({ membres: [a.id] });
  assert.equal(r.livides, 3);
  assert.equal(r.abattus + r.restants, 3);
  const mat = abri.system.stocks.materiaux;
  const quart = M.api.etat().horloge.quart;
  const l = await M.api.leurre({ membres: [a.id] });
  assert.equal(typeof l.reussi, "boolean");
  assert.ok(l.effet > 0);
  assert.equal(abri.system.stocks.materiaux, mat - 1);
  assert.equal(M.api.etat().horloge.quart, quart + 2);
  assert.ok(M.api.etat().journal.some(x => x.cle === "leurre" || x.cle === "leurre-rate"));
});

test("API : vivre sous terre (le MJ le dit) ; la fiche du survivant compte les jours sans soleil", async () => {
  const { M, a, abri } = await partie();
  await M.api.sousTerre({ vit: true });
  assert.equal(abri.system.sousTerre, true);
  assert.equal(M.api.paradis().abri.sousTerre, true);
  await M.api.assigner({ acteurId: a.id, tache: "cuisine" });
  await M.api.avancer({ quarts: 4 * 3 });
  assert.equal(a.system.sousTerre.jours, 3);
  const { contexteSurvivant } = await import("../systems/lakour-survie/scripts/apps/fiches.mjs");
  assert.ok(contexteSurvivant(a, { gm: true }).soleil?.texte);
  await M.api.sousTerre({ vit: null });
  assert.equal(abri.system.sousTerre, null);
  assert.equal(M.api.paradis().abri.sousTerre, false, "une case créole n'est pas sous terre");
});

test("API : rallumer l'île : ile() dit ce qui manque ; le MJ déclare une région rallumée (jalon, Chroniques) ; le tableau de bord l'allume", async () => {
  const { M } = await partie();
  const i = M.api.ile();
  assert.equal(i.total, 16);
  const sp = i.regions.find(r => r.cle === "saint-paul");
  assert.ok(sp.conditions.manque.includes("tenu"));
  assert.ok(sp.conditions.lieux.length >= 2 && sp.conditions.lieux.every(l => l.nom));
  const joueur = await commeJoueur("u1", () => M.api.ile());
  assert.equal(joueur.regions.find(r => r.cle === "saint-paul").conditions.infestation, undefined, "l'infestation réelle reste au MJ");
  const r = await M.api.rallumer({ region: "saint-paul", action: "declarer" });
  assert.deepEqual(r, { region: "saint-paul", etat: "rallumee", jalons: ["premiere-region"] });
  assert.equal(M.api.ile().rallumees, 1);
  assert.ok(M.api.etat().jalons.some(j => j.cle === "premiere-region"));
  const chroniques = game.journal.find(j => j.getFlag?.("lakour-survie", "chroniques"));
  assert.ok(chroniques && [...chroniques.pages.contents ?? chroniques.pages].some(p => /premi|first/i.test(p.text?.content ?? "")), "les jalons aux Chroniques");
  const { carteConnue, contexteTableau } = await import("../systems/lakour-survie/scripts/apps/tableau.mjs");
  assert.ok(carteConnue(M.api.etat()).includes("survie-lumiere"), "la carte s'allume");
  assert.ok(contexteTableau("renseignements").ile.rallumees.length > 0);
  await M.api.rallumer({ region: "saint-paul", action: "eteindre" });
  assert.equal(M.api.ile().regions.find(x => x.cle === "saint-paul").etat, "eteinte");
  await assert.rejects(() => M.api.rallumer({ region: "atlantide" }), /atlantide/);
});

test("API : un grand chantier : il faut être dans sa région ; le coût au premier quart ; un allié avance le travail chaque jour", async () => {
  const { M } = await partie("sainte-marie", "port-de-sainte-marie");
  await assert.rejects(() => M.api.chantierRegion({ cle: "relancer-la-centrale-de-langevin" }), /Sud|région|region/i);
  await assert.rejects(() => M.api.chantierRegion({ cle: "nulle-part" }), /nulle-part/);
  const ab = game.actors.get(M.api.etat().groupe.abri);
  const pieces = ab.system.stocks.pieces;
  const r = await M.api.chantierRegion({ cle: "rallumer-le-phare-de-bel-air", quarts: 2 });
  assert.ok(r.fait > 0 && r.fait < r.requis);
  assert.equal(ab.system.stocks.pieces, pieces - 4, "le coût, une fois");
  await M.api.chantierRegion({ cle: "rallumer-le-phare-de-bel-air", quarts: 1 });
  assert.equal(ab.system.stocks.pieces, pieces - 4, "pas deux fois");
  await M.api.chantierRegion({ cle: "rallumer-le-phare-de-bel-air", aide: "dispensaire-du-sud" });
  assert.deepEqual(M.api.ile().chantiers.find(c => c.cle === "rallumer-le-phare-de-bel-air").aides, ["dispensaire-du-sud"]);
  await M.api.avancer({ quarts: 4 * 20 });
  const ch = M.api.ile().chantiers.find(c => c.cle === "rallumer-le-phare-de-bel-air");
  assert.equal(ch.fini, true);
  assert.ok(M.api.etat().journal.some(e => e.cle === "chantier-fini"));
  await assert.rejects(() => M.api.chantierRegion({ cle: "rallumer-le-phare-de-bel-air" }), /fini|finished/i);
});

test("API : la fenêtre du MJ montre le paradis et l'île ; la fiche de l'abri dit le signe et les corps (jamais la chaleur)", async () => {
  const { M, a, abri } = await partie();
  await M.api.chaleur({ valeur: 3 });
  await M.api.ronde({ membres: [a.id], abattus: 0, livides: 0 });
  const { contexteMJ } = await import("../systems/lakour-survie/scripts/apps/mj.mjs");
  const c = contexteMJ("partie");
  assert.ok(c.paradis && c.paradis.chaleur && c.paradis.rondiers && c.paradis.compte);
  assert.equal(c.paradis.actionsCorps.length, 2);
  assert.ok(c.paradis.chantiersOptions.length === 6);
  assert.equal(contexteMJ("monde").paradis, null);
  await abri.update({ system: { corps: [{ jour: 0, n: 2 }] } });
  const { contexteAbri } = await import("../systems/lakour-survie/scripts/apps/fiches.mjs");
  const f = contexteAbri(abri);
  assert.ok(f.paradis.signe && f.paradis.corps);
  assert.ok(!JSON.stringify(f.paradis).match(/\b3\b.*chaleur/), "pas de chiffre de chaleur sur la fiche");
});
