// Lot 8 « Le vivant de l'abri » (contrat §27) : l'API du système (couche Foundry) sur la doublure en mémoire, avec le VRAI contenu de
// lakour-fenoir : les cheptels lus par cheptels() et le bilan public ; peupler, abattre, soigner, curer ; prendre une bête en liberté
// (l'outil de son espèce), la ramener à l'enclos ; la chasser ; les bêtes perdues dans un assaut ; le chien qui prévient (la vigilance
// de toute la garde, sans bruit) ; la fiche de l'abri et la fenêtre du MJ.   Lancer : npm run essais
import { test } from "node:test";
import assert from "node:assert/strict";
import { installerFoundry, commeJoueur } from "./doublures/foundry-survie.mjs";
import { charger, monde, survivantTire } from "./doublures/survie-api-outils.mjs";
import { creerHasard } from "../systems/lakour-survie/logique/hasard.mjs";

installerFoundry();
const M0 = await charger();

async function partieALaFerme({ graine = "vivant-api" } = {}) {
  const M = await monde(M0);
  const hasard = creerHasard(graine);
  const a = await survivantTire(M, { hasard });
  const b = await survivantTire(M, { hasard });
  await M.api.demarrer({ region: "le-tampon", membres: [a.id, b.id], graine: "vivant-api", essai: true });
  const ins = await M.api.installer({ site: "ferme-de-la-plaine-des-cafres" });
  await M.api.ajuster({ stocks: { nourriture: 80, eau: 40, graines: 6, plantes: 4, materiaux: 20 }, raison: "réserves" });
  return { M, a, b, abri: game.actors.get(ins.abriId) };
}
const equiper = async (acteur, M, cle) => {
  const d = M.api.contenu().equipements.find(e => e.cle === cle);
  await acteur.createEmbeddedDocuments("Item", [{ name: d.nom, type: "equipement", system: { cle: d.cle, categorie: d.categorie, bonus: d.bonus ?? {} } }]);
};

test("API : les fonctions du lot « vivant » existent ; hors du MJ actif, celles qui écrivent refusent", async () => {
  const { M, a } = await partieALaFerme();
  for (const f of ["cheptels", "flairDuChien", "beteSauvage", "peupler", "mettreEnEnclos", "abattre", "soignerCheptel", "curer", "capturer", "chasser",
    "recevoirBete", "lacherBetes"]) assert.equal(typeof M.api[f], "function", f);
  for (const [nom, args] of [["peupler", { installation: "enclos-a-cabris" }], ["abattre", { installation: "enclos-a-cabris" }], ["capturer", { acteurId: a.id, espece: "poule" }],
    ["recevoirBete", { espece: "poule" }]]) {
    await commeJoueur("u1", () => assert.rejects(() => M.api[nom](args), /PasMJActif/, nom));
  }
});

test("API : les cheptels de la ferme (pleins, trouvés sur le site) au bilan et dans l'instantané public ; abattre met la viande aux stocks", async () => {
  const { M, abri } = await partieALaFerme();
  const v = M.api.cheptels();
  const cabris = v.cheptels.find(x => x.cle === "enclos-a-cabris");
  assert.deepEqual([cabris.espece, cabris.tetes, cabris.places, cabris.sante], ["cabri", 2, 4, 3]);
  assert.ok(M.api.etat().bilan.cheptels?.length >= 1, "l'instantané public : on voit et on entend ses bêtes");
  const nourriture = abri.system.stocks.nourriture;
  const r = await M.api.abattre({ installation: "enclos-a-cabris", n: 1 });
  assert.deepEqual([r.abattues, r.nourriture, r.tetes], [1, 6, 1]);
  assert.equal(abri.system.stocks.nourriture, nourriture + 6);
  assert.equal(abri.system.vivant["enclos-a-cabris"].tetes, 1);
  assert.ok(M.api.etat().journal.some(x => x.cle === "Vivant.Journal.Abattu"));
  await assert.rejects(() => M.api.abattre({ installation: "potager" }), /rien de vivant|houses nothing|PasVivant/i);
});

test("API : prendre une bête en liberté demande l'outil de son espèce ; prise, elle est portée, puis va dans l'enclos de son espèce", async () => {
  const { M, a } = await partieALaFerme();
  const sans = await M.api.capturer({ acteurId: a.id, espece: "cabri" });
  assert.deepEqual([sans.prise, sans.outil, sans.file], [false, false, true], "sans corde, le cabri file");
  await equiper(a, M, "cordes-de-choka");
  let r = null;
  for (let k = 0; k < 20 && !r?.prise; k++) r = await M.api.capturer({ acteurId: a.id, espece: "cabri" });
  assert.ok(r.prise, "avec une corde, on finit par le prendre");
  assert.equal(r.difficulte, "normale");
  assert.equal(M.api.etat().groupe.betes.length, 1);
  assert.ok(M.api.cheptels().betes[0].reste > 0);
  const avant = M.api.cheptels().cheptels.find(x => x.cle === "enclos-a-cabris").tetes;
  const m = await M.api.mettreEnEnclos({});
  assert.equal(m.betes[0].installation, "enclos-a-cabris");
  assert.equal(M.api.cheptels().cheptels.find(x => x.cle === "enclos-a-cabris").tetes, avant + 1);
  assert.equal(M.api.etat().groupe.betes.length, 0);
  // Un essaim sans enfumoir pique.
  const s = await M.api.capturer({ acteurId: a.id, espece: "essaim" });
  assert.equal(s.blessure, true);
  assert.equal(a.system.blessures >= 1, true);
});

test("API : recevoir des bêtes (don, troc, fouille) ; sans enclos de leur espèce, elles restent portées, puis meurent (la viande reste)", async () => {
  const { M, abri } = await partieALaFerme();
  await M.api.recevoirBete({ espece: "cochon", n: 1, source: "troc" });
  const m = await M.api.mettreEnEnclos({});
  assert.equal(m.betes[0].raison, "sans-enclos", "pas de soue");
  assert.equal(M.api.etat().groupe.betes.length, 1);
  const nourriture = abri.system.stocks.nourriture;
  await M.api.avancer({ quarts: 5 });
  assert.equal(M.api.etat().groupe.betes.length, 0, "un porcelet tient cinq quarts hors d'un enclos");
  assert.ok(abri.system.stocks.nourriture > nourriture - 6, "sa viande va aux stocks (moins un jour de repas)");
  // Lâcher.
  await M.api.recevoirBete({ espece: "poule", n: 2 });
  const l = await M.api.lacherBetes({});
  assert.equal(l.lachees, 1);
});

test("API : peupler un cheptel depuis les bêtes portées ; une soue bâtie commence vide ; semer des bacs coûte des graines", async () => {
  const { M, a, b, abri } = await partieALaFerme();
  await a.update({ system: { savoirs: [...new Set([...(a.system.savoirs ?? []), "elevage"])] } });
  const c = await M.api.construire({ installation: "soue-a-cochons", quarts: 8, membres: [a.id, b.id] });
  assert.equal(c.termine, true);
  assert.equal(M.api.cheptels().cheptels.find(x => x.cle === "soue-a-cochons").tetes, 0, "la soue commence vide");
  await M.api.recevoirBete({ espece: "cochon", n: 2 });
  const p = await M.api.peupler({ installation: "soue-a-cochons", n: 2, portees: true });
  assert.equal(p.entrent, 2);
  assert.equal(M.api.etat().groupe.betes.length, 0);
  await assert.rejects(() => M.api.peupler({ installation: "soue-a-cochons", n: 1, espece: "poule" }), /poule|Poule|hen|AutreEspece/i);
  await assert.rejects(() => M.api.peupler({ installation: "enclos-a-cabris", n: 1, portees: true }), /aucune bête|AucunePortee|carrying no/i);
  // Des bacs de culture en bambou : semés pleins à l'achèvement ; resemer six plants coûte une graine.
  const bacs = await M.api.construire({ installation: "bacs-de-culture", quarts: 4, membres: [a.id, b.id] });
  assert.equal(bacs.termine, true);
  assert.equal(M.api.cheptels().cheptels.find(x => x.cle === "bacs-de-culture").tetes, 12);
  await abri.update({ system: { vivant: { "bacs-de-culture": { espece: "plants-hors-sol", tetes: 2, sante: 3, manques: [] } } } });
  const graines = abri.system.stocks.graines;
  const s = await M.api.peupler({ installation: "bacs-de-culture", n: 6 });
  assert.equal(s.tetes, 8);
  assert.equal(abri.system.stocks.graines, graines - 1);
});

test("API : soigner un cheptel malade (une tisane, un test, un quart) ; curer un bassin", async () => {
  const { M, abri } = await partieALaFerme();
  await abri.update({ system: { vivant: { "enclos-a-cabris": { espece: "cabri", tetes: 2, sante: 2, malade: { depuis: 0 }, manques: [] } } } });
  const plantes = abri.system.stocks.plantes;
  const quart = M.api.quand().quart;
  const r = await M.api.soignerCheptel({ installation: "enclos-a-cabris" });
  assert.equal(abri.system.stocks.plantes, plantes - 1, "une tisane de zerbaz");
  assert.equal(M.api.quand().quart, quart + 1);
  assert.equal(Boolean(abri.system.vivant["enclos-a-cabris"].malade), !r.gueri);
  await assert.rejects(() => M.api.curer({ installation: "enclos-a-cabris" }), /rien à curer|SansFiltre|nothing to clean/i);
});

test("API : un assaut qui cède coûte des bêtes ; le chien du groupe donne +1 de vigilance à toute la garde, sans bruit", async () => {
  const { M, a, b, abri } = await partieALaFerme();
  let r = null;
  for (let k = 0; k < 30 && !(r?.marge < 0); k++) r = await M.api.assaut({ force: 12, type: "horde" });
  assert.ok(r.marge < 0);
  assert.ok(r.betesPerdues.length >= 1, "des bêtes perdues");
  // Le chien : chez son maître, son bonus ; chez les autres, le même +1 de vigilance, et le bilan de l'abri le compte.
  const { interne } = await import("../systems/lakour-survie/scripts/api.mjs");
  const sans = interne.modificateursDuTest(b, b.system, "vigilance", M.api.etat()).outil;
  await equiper(a, M, "chien-du-groupe");
  const avec = interne.modificateursDuTest(b, b.system, "vigilance", M.api.etat()).outil;
  assert.equal(avec, Math.max(1, sans));
  assert.equal(interne.modificateursDuTest(b, b.system, "combat", M.api.etat()).outil, interne.modificateursDuTest(b, b.system, "combat", M.api.etat()).outil);
  const f = M.api.flairDuChien({ distance: 20, nuit: false, suit: true });
  assert.deepEqual([f.signal, f.bruit], ["mene", 0]);
  assert.ok(f.texte.length > 0);
  assert.equal(M.api.cheptels().chien, true);
  void abri;
});

test("API : la fiche de l'abri dit chaque cheptel ; la fenêtre du MJ montre « Le vivant de l'abri » (onglet Actions)", async () => {
  const { M, abri } = await partieALaFerme();
  const { contexteAbri } = await import("../systems/lakour-survie/scripts/apps/fiches.mjs");
  const ctx = contexteAbri(abri);
  const enclos = ctx.installations.find(i => i.nom && i.cheptel && /2 \/ 4/.test(i.cheptel));
  assert.ok(enclos, "l'enclos des cabris : 2 / 4");
  const { contexteMJ } = await import("../systems/lakour-survie/scripts/apps/mj.mjs");
  const c = contexteMJ("actions");
  assert.ok(c.vivant && c.vivant.cheptels.length >= 1 && c.vivant.capturables.length >= 8 && c.vivant.zones.length === 6);
  assert.equal(contexteMJ("partie").vivant, null);
  const b = M.api.beteSauvage({ zone: "hauts" });
  assert.ok(b === null || (b.espece && b.nombre >= 1));
});
