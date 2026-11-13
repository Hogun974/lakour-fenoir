// Le marché dans l'API game.lakourSurvie (scripts/api-marche.mjs, contrat §12), sur la doublure de Foundry avec le VRAI contenu de
// lakour-fenoir et le VRAI coffre du MJ IA :
// - boutique et carnet : crédit (stocks du groupe), plafond, rendre, dette effacée ;
// - troc avec un PNJ qui a un préjugé : majoration, refus, troc accepté, usure après trois échanges honnêtes ; démenti ; fête partagée ;
// - marché forain accueilli : jour de marché au journal, bruit, signature (visibilité), réputation des factions par l'horloge du moteur ;
// - trêve rompue et Ladi Lafé : la rumeur est publique, sa vérité seulement dans le monde scellé ;
// - objets marqués et réclamation ; les gens du marché deviennent des acteurs avec leurs préjugés ; hors du MJ actif, tout refuse.
// Lancer : npm run essais
import { test } from "node:test";
import assert from "node:assert/strict";
import { installerFoundry, commeJoueur, valeur } from "./doublures/foundry-survie.mjs";
import { charger, monde, survivantTire } from "./doublures/survie-api-outils.mjs";

installerFoundry();
const M0 = await charger();

async function partie() {
  const M = await monde(M0);
  const a = await survivantTire(M);
  await M.api.demarrer({ region: "saint-pierre", membres: [a.id], graine: "essai-du-marche", essai: true });
  const ins = await M.api.installer({ site: M.api.contenu().sites.find(s => s.region === "saint-pierre").cle });
  const abri = game.actors.get(ins.abriId);
  await M.api.ajuster({ stocks: { nourriture: 20, munitions: 10, eau: 10 }, raison: "réserve" });
  return { M, a, abri };
}
async function pnj(nom, prejuges = []) {
  return Actor.implementation.create({ name: nom, type: "survivant", system: { statut: "pnj", prejuges } });
}

const FONCTIONS = ["marche", "coursDuJour", "stadesDuMarche", "confiance", "evaluerTroc", "trancherLitige", "evenementDeMarche", "troquer", "ouvrirBoutique",
  "crediter", "rendre", "effacerDette", "solderCarnet", "ouvrirMarche", "fermerMarche", "accueillir", "rompreTreve", "retablirTreve", "rumeur", "dementir",
  "dementirPrejuge", "prejuges", "creerMarchand", "signe", "marquerObjet", "reclamer"];

test("API du marché : toutes ses fonctions ; hors du MJ actif, tout ce qui écrit refuse", async () => {
  const { M } = await partie();
  for (const f of FONCTIONS) assert.equal(typeof M.api[f], "function", f);
  assert.deepEqual(M.api.marche().boutiques, []);
  assert.equal(M.api.coursDuJour().medicaments, 5);
  assert.ok(M.api.stadesDuMarche().find(s => s.stade === "troc").ouvert);
  for (const [nom, args] of [["troquer", { donne: { munitions: 1 }, recoit: { nourriture: 3 } }], ["ouvrirBoutique", { nom: "X" }], ["rumeur", { texte: "x" }],
    ["ouvrirMarche", { modele: "marche-de-bourg-murat" }], ["signe", { signe: "x" }]]) {
    await commeJoueur("u1", () => assert.rejects(() => M.api[nom](args), /PasMJActif/, nom));
  }
});

test("boutique et carnet : prendre à crédit remplit les stocks, le plafond arrête, rendre vide les stocks, la dette s'efface", async () => {
  const { M, abri } = await partie();
  const tenancier = await pnj("Madame Thiaw-Kine", [{ cible: "zoreils", poids: 1, dit: "…" }]);
  await M.api.ouvrirBoutique({ nom: "La boutique Thiaw-Kine", tenancier: tenancier.id });
  const avant = abri.system.stocks.nourriture;
  const c = await M.api.crediter({ biens: { nourriture: 6 } });
  assert.ok(c.ok);
  assert.equal(abri.system.stocks.nourriture, avant + 6);
  assert.equal(c.dette, 6);
  const trop = await M.api.crediter({ biens: { medicaments: 1 } });
  assert.ok(!trop.ok && /plafond/.test(trop.raison));
  const mefiante = await M.api.crediter({ biens: { nourriture: 1 }, cibles: ["zoreils"] });
  assert.ok(!mefiante.ok, "son préjugé éveillé : crédit à moitié (5), déjà 6 dues");
  await assert.rejects(() => M.api.rendre({ biens: { medicaments: 99 } }), /il manque/);
  const r = await M.api.rendre({ biens: { nourriture: 4 } });
  assert.equal(r.reste, 2);
  assert.equal(abri.system.stocks.nourriture, avant + 2);
  await assert.rejects(() => M.api.rendre({ biens: { munitions: 5 } }), /On ne rend pas plus/);
  assert.equal((await M.api.effacerDette({})).efface, 2);
  assert.equal(M.api.marche().boutiques[0].entrees.length, 0);
  assert.ok(M.api.etat().journal.some(e => e.cle === "Marche.Journal.Credit"), "au journal public, traduisible");
});

test("troc avec un PNJ : sa première confiance majore le prix ; refus, troc accepté, usure en trois échanges honnêtes ; démenti ; fête partagée", async () => {
  const { M, abri } = await partie();
  const yab = await pnj("Jean-Marie Dijoux", [{ cible: "gens-d-en-bas", poids: 1, dit: "…" }, { cible: "zoreils", poids: 1, dit: "…" }]);
  const conf = M.api.confiance({ pnjId: yab.id, cibles: ["gens-d-en-bas"] });
  assert.equal(conf.majoration, 0.25);
  const munitions = abri.system.stocks.munitions;
  const refus = await M.api.troquer({ donne: { munitions: 1 }, recoit: { nourriture: 3 }, pnjId: yab.id, cibles: ["gens-d-en-bas"] });
  assert.ok(!refus.ok, "3 parts majorées d'un quart : il en veut 3,5");
  assert.equal(abri.system.stocks.munitions, munitions, "rien n'a bougé");
  for (let i = 0; i < 3; i++) {
    const r = await M.api.troquer({ donne: { munitions: 2 }, recoit: { nourriture: 3 }, pnjId: yab.id, cibles: ["gens-d-en-bas"] });
    assert.ok(r.ok);
  }
  assert.equal(abri.system.stocks.munitions, munitions - 6);
  assert.equal(M.api.confiance({ pnjId: yab.id, cibles: ["gens-d-en-bas"] }).poids, 0, "trois échanges honnêtes : le préjugé est tombé");
  assert.ok(M.api.etat().journal.some(e => e.cle === "Marche.Journal.PrejugeTombe"));
  assert.equal(M.api.confiance({ pnjId: yab.id, cibles: ["zoreils"] }).poids, 1, "l'autre préjugé reste");
  const d = await M.api.dementirPrejuge({ cible: "zoreils" });
  assert.deepEqual(d.pnj, ["Jean-Marie Dijoux"]);
  assert.equal(M.api.confiance({ pnjId: yab.id, cibles: ["zoreils"] }).poids, 0);
  // Une fête partagée use les préjugés des invités.
  const invite = await pnj("Gérard Payet", [{ cible: "comoriens", poids: 1, dit: "…" }]);
  const f = await M.api.feter({ fete: "noel", invites: [invite.id] });
  assert.ok(f.ok);
  assert.deepEqual(f.invites[0].tombes, ["comoriens"]);
  // Une faction hostile ne troque pas.
  await assert.rejects(() => M.api.troquer({ donne: { munitions: 9 }, recoit: { nourriture: 1 }, faction: "sans-lune" }), /hostile/);
});

test("marché forain accueilli : jour de marché, bruit, signature, réputation par les horloges du moteur ; trêve rompue et Ladi Lafé secret", async () => {
  const { M, abri } = await partie();
  const avancees = [];
  game.modules.get("lakour-mj-ia").api.horloges = { avancer: async (id, n) => avancees.push([id, n]), trouver: () => null };
  const o = await M.api.ouvrirMarche({ modele: "marche-de-bourg-murat", hote: "groupe" });
  assert.equal(o.marche.jourSemaine, 6);
  const sans = M.api.bilan().visibilite;
  assert.ok(sans >= 2, "la signature est déjà comptée (accueil dès l'ouverture)");
  await M.api.accueillir({ marche: o.marche.cle, hote: "" });
  assert.equal(M.api.bilan().visibilite, Math.max(0, sans - 2), "plus d'accueil : plus de signature");
  await M.api.accueillir({ marche: o.marche.cle, hote: "groupe" });
  // Quatre samedis : quatre jours de marché au journal, un point de réputation auprès de la Coopérative.
  await M.api.avancer({ quarts: 4 * 28, raison: "quatre semaines" });
  const jours = M.api.etat().journal.filter(e => e.cle === "marche-jour");
  assert.equal(jours.length, 4);
  assert.deepEqual(avancees, [["rep-cooperative-des-plaines", 1]]);
  assert.ok(M.api.etat().alertes.some(a => a.type === "marche"));
  // La trêve rompue par le groupe : -3 auprès de la Coopérative, et toute l'île le sait.
  const t = await M.api.rompreTreve({ marche: o.marche.cle });
  assert.deepEqual(t.reputation, { "cooperative-des-plaines": -3 });
  const etat = valeur("lakour-survie.partie");
  const rumeur = etat.marche.rumeurs.at(-1);
  assert.equal(rumeur.portee, "ile");
  for (const k of ["vraie", "auteur", "malveillant"]) assert.ok(!(k in rumeur), `la rumeur publique ne dit pas « ${k} »`);
  assert.equal(M.api.monde().marche.rumeurs[rumeur.id].vraie, true, "la vérité est au monde scellé");
  assert.ok(!JSON.stringify(etat).includes("\"malveillant\""), "rien de secret dans l'état public");
  // Une rumeur fausse et malveillante sur le groupe, démentie : elle se retourne contre son auteur.
  const r = await M.api.rumeur({ texte: "Ils vendent des vivres gâtés.", vraie: false, malveillant: true, auteur: "Un marchand jaloux" });
  assert.equal(r.colporteur, "Un marchand jaloux");
  assert.equal(M.api.confiance({}).rumeurs, 2, "deux rumeurs contre le groupe pèsent sur la première confiance");
  const d = await M.api.dementir({ id: r.id, preuve: "temoin" });
  assert.equal(d.menteur, "Un marchand jaloux");
  assert.ok(M.api.marche().rumeurs.some(x => x.sujet === "Un marchand jaloux"));
  assert.ok(abri.system.bruit >= 0);
});

test("objets marqués, réclamation, gens du marché, événement de marché", async () => {
  const { M, a } = await partie();
  await M.api.signe({ signe: "un letchi gravé" });
  const [o] = await a.createEmbeddedDocuments("Item", [{ name: "Fusil-harpon", type: "equipement", system: { cle: "fusil-harpon" } }]);
  await M.api.marquerObjet({ acteurId: a.id, objetId: o.id });
  assert.equal(o.system.marque, "un letchi gravé");
  const v = await M.api.reclamer({ acteurId: a.id, objetId: o.id, reclamant: "Le voisin", signeReclamant: "trois encoches" });
  assert.equal(v.issue, "au-possesseur");
  assert.equal(v.menteur, "reclamant");
  assert.ok(M.api.marche().rumeurs.some(r => r.sujet === "Le voisin" && r.cle === "rumeur-menteur"), "un mensonge démenti par une marque se sait");
  const m = await M.api.creerMarchand({ cle: "madame-thiaw-kine" });
  const acteur = game.actors.get(m.acteurId);
  assert.equal(acteur.system.statut, "pnj");
  assert.equal(acteur.system.prejuges[0].cible, "zoreils");
  assert.equal((await M.api.creerMarchand({ cle: "madame-thiaw-kine" })).deja, true, "pas de doublon");
  assert.equal(M.api.evenementDeMarche({ stade: "boutique" }), null, "au jour zéro, pas encore de boutique qui tienne");
  const e = M.api.evenementDeMarche({ stade: "troc" });
  assert.equal(e?.cle, "marche-ce-n-est-pas-a-lui", "le troc, dès le premier jour");
  assert.equal(M.api.trancherLitige({ voix: { a: "b", b: "b" } }).issue, "b");
});

test("fenêtres : l'onglet Marché du MJ montre la vérité des rumeurs ; le tableau de bord des joueurs, jamais", async () => {
  const { contexteMJ } = await import("../systems/lakour-survie/scripts/apps/mj.mjs");
  const { contexteTableau } = await import("../systems/lakour-survie/scripts/apps/tableau.mjs");
  const { M } = await partie();
  await M.api.ouvrirBoutique({ nom: "La boutique Thiaw-Kine" });
  await M.api.crediter({ biens: { nourriture: 3 } });
  await M.api.ouvrirMarche({ modele: "marche-du-quai-de-saint-pierre" });
  await M.api.rumeur({ texte: "Ils ont volé une nasse.", vraie: false, malveillant: true, auteur: "Le cousin" });
  const mj = contexteMJ("marche").marche;
  assert.equal(mj.cours.length, 9);
  assert.equal(mj.boutiques[0].dette, 3);
  assert.equal(mj.marches[0].nom, "Le marché du quai de Saint-Pierre");
  assert.match(mj.rumeurs[0].verite, /faux/i, "le MJ voit que c'est faux");
  assert.match(mj.rumeurs[0].verite, /Le cousin/);
  assert.ok(mj.marchands.length >= 10 && mj.cibles.length >= 9);
  const joueur = await commeJoueur("u1", () => contexteTableau("marche"));
  assert.equal(joueur.marche.carnets[0].dette, 3, "le groupe voit son carnet");
  assert.equal(joueur.marche.rumeurs[0].texte, "Ils ont volé une nasse.");
  const vu = JSON.stringify(joueur);
  for (const secret of ["Le cousin", "malveillant", "\"vraie\"", "verite"]) assert.ok(!vu.includes(secret), `le joueur ne voit pas : ${secret}`);
});
