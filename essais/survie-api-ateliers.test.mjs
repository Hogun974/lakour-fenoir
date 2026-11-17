// Lot 6 « Les outils, les ateliers et les recettes » (contrat §24) : l'API du système (couche Foundry) sur la doublure en mémoire, avec
// le VRAI contenu de lakour-fenoir — la forge et l'atelier déjà là (sucrerie du Gol), le charbon de bois puis un couteau forgé (objets
// consommés, outils usés, bruit), les refus (outil, objet), l'eau javellisée, un remède qui tient lieu de médicament, l'enrayage au tir,
// la réparation de fortune et l'affûtage, le bouclier doublé qui s'use, la fenêtre de l'atelier et la fiche d'un outil.
// Lancer : npm run essais
import { test } from "node:test";
import assert from "node:assert/strict";
import { installerFoundry, commeJoueur } from "./doublures/foundry-survie.mjs";
import { charger, monde, survivantTire } from "./doublures/survie-api-outils.mjs";

installerFoundry();
const M0 = await charger();

async function partie(site = "sucrerie-du-gol", region = "saint-pierre") {
  const M = await monde(M0);
  const a = await survivantTire(M, { userId: "u1" });
  const b = await survivantTire(M);
  await M.api.demarrer({ region, membres: [a.id, b.id], graine: "ateliers-api", essai: true });
  const ins = await M.api.installer({ site });
  await M.api.ajuster({ stocks: { nourriture: 60, eau: 40, materiaux: 30, pieces: 10, medicaments: 0, plantes: 6 }, raison: "réserves" });
  // Des survivants tirés au hasard portent parfois une caisse à outils ou une tronçonneuse : on les vide, pour savoir quel outil sert.
  for (const x of [a, b]) for (const i of x.items.filter(o => o.type === "equipement")) await i.delete();
  for (const x of [a, b]) await x.update({ system: { competences: { ...x.system.competences, bricolage: { niveau: 5, marques: 0 }, survie: { niveau: 5, marques: 0 }, soins: { niveau: 5, marques: 0 }, tir: { niveau: 2, marques: 0 } } } });
  return { M, a, b, abri: game.actors.get(ins.abriId) };
}
const donner = async (M, x, cle, extra = {}) => {
  const def = M.api.contenu().equipements.find(e => e.cle === cle);
  const { bonus = {}, parade = 0, qualite = "", gammes = [], usages = 0, remede = null } = def;
  const [o] = await x.createEmbeddedDocuments("Item", [{ name: def.nom, type: "equipement", system: { cle, categorie: def.categorie, bonus, parade, qualite, gammes, usages, remede, ...extra } }]);
  return o;
};
const compte = (x, cle) => x.items.filter(i => i.system?.cle === cle).length;
// Fabriquer jusqu'à réussir (le test est aux dés ; niveau 5, une réussite vient vite).
async function reussir(M, args) {
  for (let i = 0; i < 8; i++) { const r = await M.api.fabriquer(args); if (r.reussite) return r; }
  throw new Error(`${args.recette} : jamais réussi`);
}

test("API : les fonctions du lot 6 existent ; hors du MJ actif, celles qui écrivent refusent", async () => {
  const { M, a } = await partie();
  for (const f of ["outils", "userOutil", "reparerOutil"]) assert.equal(typeof M.api[f], "function", f);
  await commeJoueur("u1", () => assert.rejects(() => M.api.userOutil({ acteurId: a.id, cle: "couteau" }), /PasMJActif/));
  await commeJoueur("u1", () => assert.rejects(() => M.api.reparerOutil({ acteurId: a.id, cle: "couteau" }), /PasMJActif/));
});

test("API : la forge du site ; sans marteau ni charbon, refusé ; une meule de charbon, puis un couteau forgé (charbon consommé, marteau usé, bruit)", async () => {
  const { M, a, abri } = await partie();
  assert.ok(abri.items.some(i => i.system?.cle === "forge" && i.system.niveau === 2), "la forge de la sucrerie est déjà là");
  const refus = M.api.peutFabriquer("couteau-forge");
  assert.equal(refus.ok, false);
  assert.ok(refus.motifs.some(m => m.cle === "outil-manquant" && m.params.outil === "marteau"));
  assert.ok(refus.motifs.some(m => m.cle === "objet-manquant" && m.params.objet === "charbon-de-bois"));
  assert.ok(M.api.peutFabriquer("charbon-de-bois").motifs.some(m => m.cle === "outil-manquant" && m.params.outil === "hache"));
  const hache = await donner(M, a, "hache-de-fortune");
  const meule = await reussir(M, { recette: "charbon-de-bois", acteurId: a.id });
  assert.deepEqual(meule.produit, { equipement: "charbon-de-bois", n: 3 });
  assert.equal(compte(a, "charbon-de-bois"), 3, "trois sacs de charbon");
  assert.ok(hache.system.usure >= 1, "la hache a servi");
  const marteau = await donner(M, a, "marteau-de-fortune");
  assert.equal(M.api.peutFabriquer("couteau-forge").ok, true);
  const bruit = Number(abri.system.bruit) || 0;
  const r = await reussir(M, { recette: "couteau-forge", acteurId: a.id });
  assert.equal(r.atelier.cle, "forge");
  assert.equal(r.atelier.bonus, 1, "forge de niveau 2 pour une recette de niveau 1 : un dé de plus");
  assert.ok(compte(a, "charbon-de-bois") < 3, "un sac consommé à la réussite");
  assert.ok(marteau.system.usure >= 1);
  assert.ok(a.items.some(i => i.system?.cle === "couteau"), "le couteau forgé");
  assert.equal(r.bruit, 2, "le marteau s'entend : +2 au bruit de l'abri pendant le travail");
  assert.ok(Number.isFinite(bruit));
  // L'atelier de FVTT (niveau 2) sert d'établi : un outil de récupération.
  assert.equal(M.api.peutFabriquer("hache-de-recuperation").ok, true);
  const vus = M.api.outils({ acteurId: a.id });
  assert.ok(vus.some(o => o.cle === "marteau-de-fortune" && o.qualite === "fortune" && o.usages === 6));
});

test("API : l'eau javellisée traite l'eau de l'abri une semaine ; un remède (une attelle) tient lieu du médicament et s'use", async () => {
  const { M, a, b, abri } = await partie();
  await b.createEmbeddedDocuments("Item", [{ name: "Plomberie", type: "savoir", system: { cle: "plomberie-filtration" } }]);
  await M.api.ajuster({ stocks: { medicaments: 1 } });
  await reussir(M, { recette: "eau-javellisee", acteurId: b.id });
  const jour = Math.floor(M.api.etat().horloge.quart / 4);
  assert.ok(abri.system.eauTraiteeAvant >= jour + 6, `eau traitée jusqu'au jour ${abri.system.eauTraiteeAvant}`);
  assert.ok(M.api.etat().journal.some(e => e.cle === "Ateliers.Journal.EauTraitee"));
  // Une fracture, aucun médicament : l'attelle en tient lieu.
  await M.api.affliction({ acteurId: a.id, cle: "fracture", action: "donner" });
  assert.equal(abri.system.stocks.medicaments, 0);
  await assert.rejects(() => M.api.affliction({ acteurId: a.id, cle: "fracture", action: "soigner", soigneurId: b.id }), /médicament|medicine/i);
  await donner(M, b, "attelle");
  const soin = await M.api.affliction({ acteurId: a.id, cle: "fracture", action: "soigner", soigneurId: b.id });
  assert.equal(typeof soin.gueri, "boolean");
  assert.equal(compte(b, "attelle"), 0, "l'attelle a servi");
  assert.ok(M.api.etat().journal.some(e => e.cle === "Ateliers.Journal.Remede"));
});

test("API : au tir, l'arme s'use et s'enraye sur deux 1 (le test échoue, il ne se force pas) ; remise en état, il en faut trois", async () => {
  const { M, a } = await partie();
  const fusil = await donner(M, a, "fusil-de-chasse");
  const hasard = Math.random;
  try {
    Math.random = () => 0;   // tous les dés font 1
    const t = await M.api.test({ acteurId: a.id, competence: "tir" });
    assert.ok(t.enrayee && t.enrayee.uns >= 2, "deux 1 : enrayée");
    assert.equal(t.reussite, false);
    assert.equal(fusil.system.usure, 1, "un usage par test de tir");
    await fusil.delete();
    const remis = await donner(M, a, "fusil-de-chasse-remis-en-etat", { remise: true });
    Math.random = (() => { const f = [0, 0, 0.9, 0.9, 0.9, 0.9]; let i = 0; return () => f[i++ % f.length]; })();   // deux 1, le reste 6
    const t2 = await M.api.test({ acteurId: a.id, competence: "tir" });
    assert.equal(t2.enrayee, null, "remise en état : deux 1 ne suffisent pas");
    assert.equal(remis.system.usure, 1);
  } finally { Math.random = hasard; }
  const t3 = await M.api.test({ acteurId: a.id, competence: "vigilance" });
  assert.equal(t3.enrayee, null, "hors du tir, rien");
});

test("API : la réparation de fortune (1 matériau, la moitié des usages, trois fois) ; l'affûtage à la pierre ; un outil cassé ne donne plus son bonus", async () => {
  const { M, a, abri } = await partie();
  const hache = await donner(M, a, "hache", { usure: 40 });
  const t0 = await M.api.test({ acteurId: a.id, competence: "combat" });
  const mat = abri.system.stocks.materiaux;
  const r = await M.api.reparerOutil({ acteurId: a.id, objetId: hache.id });
  assert.deepEqual([r.usure, r.reparations, r.etat], [20, 1, "use"]);
  assert.equal(abri.system.stocks.materiaux, mat - 1);
  const t1 = await M.api.test({ acteurId: a.id, competence: "combat" });
  assert.ok(t1.bonusOutils > t0.bonusOutils || t1.bonusOutils >= 1, "réparée : son bonus revient");
  await assert.rejects(() => M.api.reparerOutil({ acteurId: a.id, objetId: hache.id, affuter: true }), /pierre|whetstone/i);
  await donner(M, a, "pierre-a-aiguiser");
  const af = await M.api.reparerOutil({ acteurId: a.id, objetId: hache.id, affuter: true });
  assert.deepEqual([af.usure, af.reparations], [10, 1], "l'affûtage ne compte pas parmi les trois");
  await hache.update({ system: { reparations: 3, usure: 30 } });
  await assert.rejects(() => M.api.reparerOutil({ acteurId: a.id, objetId: hache.id }), /trois fois|three times/i);
  const u = await M.api.userOutil({ acteurId: a.id, objetId: hache.id, usages: 15 });
  assert.equal(u.casse, true);
  assert.ok(M.api.etat().journal.some(e => e.cle === "Ateliers.Journal.Casse"));
});

test("API : le bouclier doublé pare sur 4 et s'use quand il pare ; brisé, il ne pare plus", async () => {
  const { M, a } = await partie();
  const b = await donner(M, a, "bouclier-double-et-cercle", { parade: 4 });
  const hasard = Math.random;
  try {
    Math.random = () => 0.6;   // des 4
    const p = await M.api.parer({ acteurId: a.id, touches: 2 });
    assert.deepEqual([p.seuil, p.parees], [4, 2]);
  } finally { Math.random = hasard; }
  assert.equal(b.system.usure, 1);
  await b.update({ system: { usure: 30 } });
  await assert.rejects(() => M.api.parer({ acteurId: a.id, touches: 1 }), /bouclier|shield/i);
});

test("fenêtre de l'atelier et fiches : où se fait chaque recette, ce qu'il faut en main ; la qualité et l'usure d'un outil", async () => {
  const { M, a } = await partie();
  const { contexteAtelier } = await import("../systems/lakour-survie/scripts/apps/atelier.mjs");
  const ctx = contexteAtelier();
  const couteau = ctx.recettes.find(r => r.cle === "couteau-forge");
  assert.ok(couteau.ou && couteau.besoins, "où et avec quoi");
  assert.ok(couteau.raisons.length > 0, "les raisons du refus, lisibles");
  const lance = ctx.recettes.find(r => r.cle === "lance");
  assert.ok(lance.ou.length > 0);
  const o = await donner(M, a, "hache-de-recuperation", { usure: 5 });
  const { sectionsObjet } = await import("../systems/lakour-survie/scripts/apps/fiches.mjs");
  const lignes = sectionsObjet(o).flatMap(s => s.lignes).join(" | ");
  assert.match(lignes, /5 \/ 20/);
});
