// Lot « savoirs » : l'API du système (couche Foundry) sur la doublure en mémoire, avec le VRAI contenu de lakour-fenoir :
// construire à l'ancienne (matières de l'île prises aux alentours), fouiller les jardins des cases et les livres, accueillir une
// gramoune comme recrue, gagner sa confiance, apprendre auprès d'elle, écrire son cahier, gagner la confiance d'un chien errant,
// préparer le cyclone, et ce que voit le MJ (bilan : sœurs en secours, deux savoirs).   Lancer : npm run essais
import { test } from "node:test";
import assert from "node:assert/strict";
import { installerFoundry, commeJoueur } from "./doublures/foundry-survie.mjs";
import { charger, monde, survivantTire } from "./doublures/survie-api-outils.mjs";

installerFoundry();
const M0 = await charger();

async function partieALaFerme() {
  const M = await monde(M0);
  const a = await survivantTire(M);
  const b = await survivantTire(M);
  await M.api.demarrer({ region: "le-tampon", membres: [a.id, b.id], graine: "savoirs-api", essai: true });
  const ins = await M.api.installer({ site: "ferme-de-la-plaine-des-cafres" });
  await M.api.ajuster({ stocks: { nourriture: 80, eau: 30, graines: 6 }, raison: "réserves" });
  return { M, a, b, abri: game.actors.get(ins.abriId) };
}

test("API : les fonctions du lot « savoirs » existent ; hors du MJ actif, elles refusent", async () => {
  const { M, a } = await partieALaFerme();
  for (const f of ["preparerCyclone", "apprendre", "gagnerConfiance", "dicter", "apprivoiser", "cyclone", "savoirsDuGroupe"]) assert.equal(typeof M.api[f], "function", f);
  for (const [nom, args] of [["preparerCyclone", {}], ["apprendre", { acteurId: a.id, savoir: "zerbaz" }], ["apprivoiser", { acteurId: a.id }]]) {
    await commeJoueur("u1", () => assert.rejects(() => M.api[nom](args), /PasMJActif/, nom));
  }
  assert.equal(M.api.cyclone(), null, "pas de cyclone, rien à dérouler");
  const s = M.api.savoirsDuGroupe();
  assert.ok(Number.isInteger(s.moderne) && Number.isInteger(s.lontan) && s.complete === false);
});

test("API : construire à l'ancienne prend le bois des alentours ; la sœur moderne en service, la lontan en secours sur la fiche", async () => {
  const { M, a, b, abri } = await partieALaFerme();
  const bois = abri.system.nature.bois;
  const materiaux = abri.system.stocks.materiaux;
  const r = await M.api.construire({ installation: "jardin-creole", quarts: 4, membres: [a.id, b.id] });
  assert.equal(r.termine, true);
  assert.equal(r.cout.ile, 2);
  assert.ok(abri.system.nature.bois <= bois - 2 + 1, "le bois des alentours a servi (il repousse un peu dans la journée)");
  assert.equal(abri.system.stocks.materiaux, materiaux, "aucun matériau fouillé");
  const bilan = M.api.bilan();
  assert.ok(bilan.secours.some(x => x.cle === "jardin-creole"), "le potager de la ferme passe d'abord : le jardin attend en secours");
  assert.ok(M.api.etat().bilan.secours, "l'instantané public le dit aussi");
  assert.ok(bilan.savoirs && "complete" in bilan.savoirs);
});

test("API : fouiller les jardins (boutures replantées le soir) et les livres (le livre va au premier fouilleur, il enseigne)", async () => {
  const { M, a, abri } = await partieALaFerme();
  const graines = abri.system.stocks.graines;
  const f = await M.api.fouiller({ cible: "jardins", quarts: 2, membres: [a.id] });
  assert.ok(f.butin.boutures > 0 && f.butin.nourriture > 0, JSON.stringify(f.butin));
  await M.api.avancer({ quarts: 4 });
  assert.equal(abri.system.stocks.boutures, 0, "repiquées dans le potager de la ferme");
  assert.ok(abri.system.stocks.graines > graines, "elles sont devenues des graines");
  let livre = null;
  for (let k = 0; k < 12 && !livre; k++) livre = (await M.api.fouiller({ cible: "livres", quarts: 2, membres: [a.id] })).livre;
  assert.ok(livre, "un livre finit par sortir");
  const objet = a.items.find(i => i.type === "equipement" && (i.system.enseigne ?? []).includes(livre));
  assert.ok(objet, "le livre est dans le sac du fouilleur");
  await assert.rejects(() => M.api.fouiller({ cible: "grimoires" }), /Cible de fouille inconnue/);
});

test("API : accueillir une gramoune (recrue), gagner sa confiance, apprendre auprès d'elle en 4 veillées, écrire son cahier", async () => {
  const { M, a, b, abri } = await partieALaFerme();
  const recrue = await M.api.genererRecrue({ gramoune: "gramoune-zelie" });
  assert.equal(recrue.nom, "Gramoune Zélie Ah-Kiem");
  assert.ok(recrue.savoirs.includes("zerbaz") && recrue.confiance === 1);
  let zelie = null;
  for (let k = 0; k < 30 && !zelie; k++) {
    const r = await M.api.recruter({ recrue, parleurId: a.id, attitude: "amicale" });
    if (r.reussite) zelie = game.actors.get(r.acteurId);
  }
  assert.ok(zelie, "elle finit par suivre le groupe");
  assert.equal(zelie.system.confiance, 1);
  assert.ok(zelie.items.some(i => i.type === "savoir" && i.system.cle === "zerbaz"));
  const c = await M.api.gagnerConfiance({ acteurId: zelie.id, parleurId: b.id });
  assert.equal(zelie.system.confiance, c.confiance);
  await zelie.update({ system: { confiance: 3 } });
  const savoir = ["zerbaz", "jardin-creole", "conserverie"].find(s => !a.items.some(i => i.type === "savoir" && i.system.cle === s));
  let r;
  for (let k = 0; k < 4; k++) r = await M.api.apprendre({ acteurId: a.id, savoir, source: "maitre", maitreId: zelie.id });
  assert.equal(r.requis, 4, "une gramoune qui a confiance : 4 veillées");
  assert.equal(r.termine, true);
  assert.ok(a.items.some(i => i.type === "savoir" && i.system.cle === savoir), "le savoir est appris");
  assert.ok(M.api.etat().journal.some(j => j.cle === "Journal.SavoirAppris"));
  await assert.rejects(() => M.api.apprendre({ acteurId: a.id, savoir, source: "maitre", maitreId: zelie.id }), /Impossible d'apprendre/);
  // Le cahier : six veillées, un objet unique chez celui qui écrit.
  for (let k = 0; k < 6; k++) r = await M.api.dicter({ gramouneId: zelie.id, scribeId: b.id });
  assert.equal(r.termine, true);
  const cahier = b.items.find(i => i.system?.cle === "cahier-de-gramoune");
  assert.ok(cahier && cahier.system.enseigne.includes("zerbaz") && cahier.system.auteur === zelie.name);
  await assert.rejects(() => M.api.dicter({ gramouneId: zelie.id, scribeId: b.id }), /Impossible d'écrire sous la dictée/);
  // Lire le cahier : lumière (une bougie : l'abri se voit ce soir-là).
  const sansZerbaz = a.items.some(i => i.type === "savoir" && i.system.cle === "zerbaz") ? null : a;
  if (sansZerbaz) {
    const l = await M.api.apprendre({ acteurId: a.id, savoir: "zerbaz", source: "cahier" });
    assert.equal(l.requis, 7);
    assert.ok(["bougie", "energie"].includes(l.lumiere));
    if (l.lumiere === "bougie") assert.equal(abri.system.lumiereLe, M.api.quand().jour);
  }
});

test("API : gagner la confiance d'un chien errant (1 nourriture par veillée) ; au groupe, il remonte le moral de l'abri", async () => {
  const { M, a, abri } = await partieALaFerme();
  const moral = M.api.bilan().moral;
  const nourriture = abri.system.stocks.nourriture;
  const r1 = await M.api.apprivoiser({ acteurId: a.id });
  assert.ok(abri.system.stocks.nourriture < nourriture, "une nourriture posée");
  let r = r1;
  for (let k = 0; k < 60 && !r.apprivoise; k++) {
    if (abri.system.stocks.nourriture < 2) await M.api.ajuster({ stocks: { nourriture: 20 } });
    r = await M.api.apprivoiser({ acteurId: a.id });
  }
  assert.ok(r.apprivoise, "le chien finit par suivre");
  assert.ok(a.items.some(i => i.system?.cle === "chien-du-groupe"));
  assert.equal(M.api.etat().groupe.chienErrant, null);
  assert.ok(M.api.bilan().moral >= moral, "le chien au moral de l'abri");
  assert.equal(M.api.bilan().bonus.vigilance >= 1, true, "il entend avant la garde");
});

test("API : préparer le cyclone (le travail s'accumule) ; voyager en voiture électrique sans énergie est refusé", async () => {
  const { M, a, b, abri } = await partieALaFerme();
  const p1 = await M.api.preparerCyclone({ quarts: 1, membres: [a.id] });
  assert.equal(p1.prete, false);
  const p2 = await M.api.preparerCyclone({ quarts: 4, membres: [a.id, b.id] });
  assert.ok(p2.fait > p1.fait);
  assert.equal(p2.prete, true);
  assert.ok(abri.system.preparation?.fait >= abri.system.preparation?.requis);
  await assert.rejects(() => M.api.voyager({ vers: "saint-pierre", transport: "voiture-electrique" }), /Voyage impossible/);
});

test("fenêtre du MJ : l'onglet « Savoirs et cyclone » (veillées, gramounes, cibles de fouille) ; rien du réel chez un joueur", async () => {
  const { M, a } = await partieALaFerme();
  const { contexteMJ, ONGLETS_MJ } = await import("../systems/lakour-survie/scripts/apps/mj.mjs");
  assert.ok(ONGLETS_MJ.includes("savoirs"));
  const s = contexteMJ("savoirs");
  assert.ok(s.savoirsListe.length >= 17 && s.sources.length === 3 && s.membresConfiance.length === 2);
  assert.ok(s.gramounes.some(g => g.valeur === "gramoune-mariamma"));
  assert.ok(s.arbres && "lontan" in s.arbres);
  assert.ok(contexteMJ("actions").cibles.some(c => c.valeur === "jardins") && contexteMJ("actions").cibles.some(c => c.valeur === "livres"));
  assert.ok(contexteMJ("groupe").gramounes.length === 5, "le formulaire des recrues propose les gramounes");
  const joueur = await commeJoueur("u1", () => contexteMJ("savoirs"));
  assert.equal(joueur.cycloneVecu, null, "le déroulé du cyclone est un secret du MJ");
  assert.ok(a);
  M.api.etat();
});
