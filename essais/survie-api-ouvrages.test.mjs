// Lot 7 « Bâtir et défendre » (contrat §26) : l'API du système (couche Foundry) sur la doublure en mémoire, avec le VRAI contenu de
// lakour-fenoir : ouvrages() (matériaux, entretiens, défenses), entretenir, le feu, l'assaut devant les ouvrages (pièges, cloche),
// la cave qui s'éboule, la fenêtre du MJ et la fiche de l'abri.   Lancer : npm run essais
import { test } from "node:test";
import assert from "node:assert/strict";
import { installerFoundry, commeJoueur } from "./doublures/foundry-survie.mjs";
import { charger, monde, survivantTire } from "./doublures/survie-api-outils.mjs";

installerFoundry();
const M0 = await charger();

async function partie(site = "case-de-bellemene") {
  const M = await monde(M0);
  const a = await survivantTire(M, { userId: "u1" });
  const b = await survivantTire(M);
  await M.api.demarrer({ region: "saint-paul", membres: [a.id, b.id], graine: "ouvrages-api", essai: true });
  const ins = await M.api.installer({ site });
  await M.api.ajuster({ stocks: { nourriture: 80, eau: 60, materiaux: 40, pieces: 10 }, raison: "réserves" });
  return { M, a, b, abri: game.actors.get(ins.abriId) };
}
const instance = (abri, cle) => abri.items.contents.find(i => i.type === "installation" && i.system.cle === cle);

test("API : les fonctions du lot existent ; hors du MJ actif, celles qui écrivent refusent", async () => {
  const { M } = await partie();
  for (const f of ["ouvrages", "entretenir", "incendie"]) assert.equal(typeof M.api[f], "function", f);
  for (const [nom, args] of [["entretenir", { installationId: "x" }], ["incendie", { force: 1 }]]) {
    await commeJoueur("u1", () => assert.rejects(() => M.api[nom](args), /PasMJActif/, nom));
  }
});

test("API : ouvrages() dit le matériau et l'entretien ; entretenir soigne (le délai repart) et fait passer le temps", async () => {
  const { M, a, abri } = await partie();
  await M.api.avancer({ quarts: 4 });
  const o = M.api.ouvrages();
  assert.equal(o.abri, true);
  const citerne = o.installations.find(i => i.cle === "citerne-de-pluie");
  assert.equal(citerne.materiau, "tole-de-recuperation");
  assert.equal(citerne.entretien.tousLes, 60);
  assert.ok(citerne.entretien.prochain >= 60, "le délai part du premier jour vu");
  const avant = M.api.etat().horloge.quart;
  const r = await M.api.entretenir({ installationId: instance(abri, "citerne-de-pluie").id, membres: [a.id], quarts: 2 });
  assert.equal(r.soigne, true);
  assert.equal(M.api.etat().horloge.quart, avant + 2, "le temps passe");
  assert.ok(Number.isFinite(instance(abri, "citerne-de-pluie").system.suivi?.le));
  await assert.rejects(() => M.api.entretenir({ installationId: instance(abri, "verger").id }), /entretien/i, "le verger a ses bras");
  const { contexteMJ } = await import("../systems/lakour-survie/scripts/apps/mj.mjs");
  const c = contexteMJ("partie");
  assert.ok(c.ouvrages && Array.isArray(c.ouvrages.dus) && c.ouvrages.aEntretenir.length >= 1);
  assert.equal(contexteMJ("monde").ouvrages, null);
  const { contexteAbri } = await import("../systems/lakour-survie/scripts/apps/fiches.mjs");
  const ligne = contexteAbri(abri).installations.find(i => i.nom && i.materiau && i.entretien);
  assert.ok(ligne, "la fiche de l'abri dit le matériau et l'entretien");
});

test("API : un assaut de Livides passe devant les pièges et la cloche ; une bande, non", async () => {
  const { M, a, b, abri } = await partie();
  // Assez de quarts pour finir, même si l'un d'eux n'a que 16 ou 17 ans (il travaille aux 3/4).
  const f = await M.api.construire({ installation: "fosse-et-pieges", quarts: 8, membres: [a.id, b.id] });
  assert.equal(f.termine, true);
  const k = await M.api.construire({ installation: "cloche-d-alarme", quarts: 2, membres: [a.id, b.id] });
  assert.equal(k.termine, true);
  const bruitAvant = Number(abri.system.bruit) || 0;
  const horde = await M.api.assaut({ force: 3, horde: true });
  assert.equal(horde.pieges, 1);
  assert.equal(horde.force, 2);
  assert.equal(horde.cloche, true);
  assert.ok(Number(abri.system.bruit) >= Math.min(10, bruitAvant + 2) - 2, "la cloche s'est entendue");
  assert.ok(M.api.etat().journal.some(e => e.cle === "Ouvrages.Journal.Pieges"));
  const bande = await M.api.assaut({ force: 3 });
  assert.equal(bande.pieges, 0);
  assert.equal(bande.force, 3);
});

test("API : le feu à l'abri (la pierre tient) ; creuser sans l'étaiement : le risque d'éboulement est rendu", async () => {
  const { M, a, b } = await partie();
  const r = await M.api.incendie({ force: 3, cause: "un essai" });
  assert.equal(r.force, 3);
  assert.equal(r.degatsAbri, 2);
  assert.ok(M.api.etat().journal.some(e => e.cle === "Ouvrages.Journal.Incendie"));
  const etai = [a, b].some(x => (x.system.savoirs ?? []).includes("etaiement-galeries"));
  const g = await M.api.construire({ installation: "galerie-souterraine", quarts: 4, membres: [a.id] });
  if (etai) assert.equal(g.eboulement, null, "le groupe sait étayer : aucun risque");
  else {
    assert.ok(g.eboulement && g.eboulement.chance === 0.25, "sans le savoir de l'étaiement : 25 % par jour");
    if (!g.termine) assert.equal(M.api.ouvrages().eboulement.chance, 0.25);
  }
});
