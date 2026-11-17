// Lot 4 « Les plans » (contrat §21) : l'API du système (couche Foundry) sur la doublure en mémoire, avec le VRAI contenu de
// lakour-fenoir : un lieu à plans (un plan parmi plusieurs, puis revenir), le rabais des plans connus au chantier et à l'atelier,
// lire, copier, apprendre par cœur, le troc d'un papier (la rareté baisse), les plans uniques (ils ne se copient pas, une seule fois
// dans la partie), l'étagère aux cahiers (ranger, reprendre, le feu, le déménagement), les papiers d'un mort, la fouille « plans »,
// la fenêtre du MJ et les fiches.   Lancer : npm run essais
import { test } from "node:test";
import assert from "node:assert/strict";
import { installerFoundry, commeJoueur } from "./doublures/foundry-survie.mjs";
import { charger, monde, survivantTire } from "./doublures/survie-api-outils.mjs";
import { creerHasard } from "../systems/lakour-survie/logique/hasard.mjs";
import * as L from "../systems/lakour-survie/logique/index.mjs";

installerFoundry();
const M0 = await charger();

async function partie({ region = "mafate", site = "ilet-de-marla", graine = "plans-api" } = {}) {
  const M = await monde(M0);
  const hasard = creerHasard(graine);
  const a = await survivantTire(M, { hasard });
  const b = await survivantTire(M, { hasard });
  await M.api.demarrer({ region, membres: [a.id, b.id], graine, essai: true });
  const ins = await M.api.installer({ site });
  await M.api.ajuster({ stocks: { nourriture: 60, eau: 30, materiaux: 30, pieces: 10, graines: 10, plantes: 6 }, raison: "réserves" });
  return { M, a, b, abri: game.actors.get(ins.abriId) };
}
const papiers = a => a.items.contents.filter(i => i.type === "equipement" && (i.system.plans ?? []).length);
const savoirsDe = a => a.items.contents.filter(i => i.type === "savoir").map(i => i.system.cle);

test("API : les fonctions des plans existent ; hors du MJ actif, celles qui écrivent refusent", async () => {
  const { M, a } = await partie();
  for (const f of ["plans", "valeurPlan", "lieuxAPlans", "lieuAPlans", "lirePlan", "copierPlan", "enseignerPlan", "rangerPlan", "prendrePlan", "perdreEtagere",
    "donnerPlan", "recevoirPlan", "noterPlan", "reprendrePlans"]) assert.equal(typeof M.api[f], "function", f);
  for (const [nom, args] of [["lieuAPlans", { lieu: "ilet-de-roche-plate" }], ["noterPlan", { cle: "potager" }], ["enseignerPlan", { acteurId: a.id, cle: "potager" }]]) {
    await commeJoueur("u1", () => assert.rejects(() => M.api[nom](args), /PasMJActif/, nom));
  }
});

test("API : un lieu à plans (l'îlet sans route) tire un plan parmi plusieurs, sur le premier du groupe ; il faut ensuite revenir plus tard", async () => {
  const { M, a } = await partie();
  const lieux = M.api.lieuxAPlans();
  assert.equal(lieux.length, 7);
  const ilet = lieux.find(l => l.cle === "ilet-de-roche-plate");
  assert.ok(ilet.ici && ilet.ouverte && !ilet.revenir && ilet.tirage.length >= 3);
  const quart = M.api.etat().horloge.quart;
  const r = await M.api.lieuAPlans({ lieu: "ilet-de-roche-plate", membres: [a.id] });
  assert.ok(r.plan && ilet.tirage.some(x => x.plan === r.plan));
  assert.equal(M.api.etat().horloge.quart, quart + 2, "deux quarts passent");
  assert.equal(papiers(a).length, 1);
  assert.ok(M.api.etat().journal.some(j => j.cle === "Plans.Journal.Lieu"));
  await assert.rejects(() => M.api.lieuAPlans({ lieu: "ilet-de-roche-plate" }), /rien de plus|nothing more/);
  assert.equal(M.api.lieuxAPlans().find(l => l.cle === "ilet-de-roche-plate").revenir, true);
  await assert.rejects(() => M.api.lieuAPlans({ lieu: "salle-des-machines-de-takamaka" }), /pas à|not at/);
  await assert.rejects(() => M.api.lieuAPlans({ lieu: "licorne" }), /inconnu|Unknown/);
});

test("API : le rabais des plans connus au chantier (carnet) et à l'atelier (une recette) ; noterPlan pour une issue d'affaire", async () => {
  const { M } = await partie();
  const sans = M.api.peutFabriquer("pansements").quarts;
  await M.api.noterPlan({ cle: "recette:pansements" });
  assert.equal(M.api.peutFabriquer("pansements").quarts, Math.ceil(sans / 2));
  const n = await M.api.noterPlan({ cle: "potager" });
  assert.ok(n.carnet.includes("potager") && !n.deja);
  assert.ok((await M.api.noterPlan({ cle: "potager" })).deja);
  await assert.rejects(() => M.api.noterPlan({ cle: "recette:licorne" }), /licorne/);
  const v = M.api.peutConstruire("potager");
  assert.equal(v.plan, true);
  const c = await M.api.construire({ installation: "potager", quarts: 1 });
  assert.equal(c.plan, true);
  assert.equal(c.chantier.requis, Math.ceil(L.niveauDe(L.installationDe(M.api.contenu(), "potager"), v.niveau).cout.travail * 0.5), "la moitié du travail");
  assert.ok(M.api.etat().groupe.plans.includes("recette:pansements"));
  assert.ok(M.api.plans().carnet.some(x => x.cle === "recette:pansements" && x.valeur > 0));
});

test("API : copier un plan (une veillée, de la lumière), le troquer (le papier part, ce qu'on reçoit entre, la rareté baisse)", async () => {
  const { M, a, abri } = await partie();
  await M.api.noterPlan({ cle: "citerne-de-pluie" });
  await assert.rejects(() => M.api.copierPlan({ cle: "serre", acteurId: a.id }), /copie|copied/);
  const avant = M.api.valeurPlan({ cle: "citerne-de-pluie" });
  const c = await M.api.copierPlan({ cle: "citerne-de-pluie", acteurId: a.id });
  assert.ok(["energie", "bougie"].includes(c.lumiere));
  const papier = a.items.get(c.objetId);
  assert.deepEqual(papier.system.plans, ["citerne-de-pluie"]);
  assert.equal(papier.system.unique, "");
  const nourriture = abri.system.stocks.nourriture;
  const d = await M.api.donnerPlan({ objetId: c.objetId, contre: { nourriture: 3 }, a: "les pêcheurs" });
  assert.equal(d.valeur, avant.valeur);
  assert.equal(a.items.get(c.objetId), undefined);
  assert.equal(abri.system.stocks.nourriture, nourriture + 3);
  assert.equal(M.api.etat().plans.circulation["citerne-de-pluie"], 1);
  assert.ok(M.api.valeurPlan({ cle: "citerne-de-pluie" }).rarete < avant.rarete, "une copie qui circule fait baisser la rareté");
  assert.ok(M.api.etat().journal.some(j => j.cle === "Plans.Journal.Donne"));
});

test("API : un plan unique (le cahier de tisanes) se consulte, ne se copie pas, ne sort qu'une fois ; il donne son rabais tant qu'on l'a", async () => {
  const { M, a } = await partie();
  const r = await M.api.recevoirPlan({ cle: "cahier-de-tisanes-de-la-gramoune", acteurId: a.id, de: "une vieille voisine" });
  const cahier = a.items.get(r.objetId);
  assert.equal(cahier.system.unique, "cahier-de-tisanes-de-la-gramoune");
  assert.ok(cahier.system.enseigne.includes("zerbaz"));
  assert.ok(M.api.plans().connus.includes("recette:tisanes"));
  assert.ok(!M.api.etat().groupe.plans.includes("recette:tisanes"), "il ne va pas au carnet");
  await assert.rejects(() => M.api.copierPlan({ cle: "recette:tisanes", acteurId: a.id }), /unique/);
  await assert.rejects(() => M.api.lirePlan({ objetId: r.objetId }), /unique/);
  await assert.rejects(() => M.api.recevoirPlan({ cle: "cahier-de-tisanes-de-la-gramoune", acteurId: a.id }), /qu'un|only one/);
  assert.ok(M.api.lieuxAPlans().length && M.api.valeurPlan({ cle: "cahier-de-tisanes-de-la-gramoune" }).valeur > 50);
  // Le donner : il change de mains, la rareté ne bouge pas.
  await M.api.donnerPlan({ objetId: r.objetId });
  assert.ok(!M.api.plans().connus.includes("recette:tisanes"));
  assert.deepEqual(M.api.etat().plans.circulation, {});
});

test("API : un plan qu'on ne sait pas lire reste un papier ; lu plus tard, quand quelqu'un a le savoir-faire", async () => {
  const { M, a, b } = await partie();
  const savoirs = [...new Set([...savoirsDe(a), ...savoirsDe(b)])];
  const candidat = ["pico-hydro", "recette-gazogene", "recette-munitions-rechargees", "camouflage"].map(k => L.planDuRegistre(M.api.contenu(), k))
    .find(d => L.savoirsDuPlan(M.api.contenu(), L.couvertureDe(d)[0]).some(s => !savoirs.includes(s)));
  assert.ok(candidat, "un plan dont le groupe n'a pas le savoir-faire");
  const cle = L.couvertureDe(candidat)[0];
  const r = await M.api.recevoirPlan({ cle: candidat.cle, acteurId: a.id });
  assert.deepEqual(r.lus, []);
  assert.ok(!M.api.etat().groupe.plans.includes(cle));
  assert.ok(M.api.etat().journal.some(j => j.cle === "Plans.Journal.ALire"));
  assert.ok(M.api.plans().papiers.some(p => p.objetId === r.objetId && p.plans.some(x => !x.lisible)));
  await assert.rejects(() => M.api.lirePlan({ objetId: r.objetId }), /Rien à lire|Nothing to read/);
  const manque = L.savoirsDuPlan(M.api.contenu(), cle).filter(s => !savoirs.includes(s));
  for (const s of manque) await b.createEmbeddedDocuments("Item", [{ name: s, type: "savoir", system: { cle: s } }]);
  const l = await M.api.lirePlan({ objetId: r.objetId });
  assert.deepEqual(l.lus, [cle]);
  assert.ok(M.api.etat().groupe.plans.includes(cle));
});

test("API : apprendre un plan par cœur ; il survit par celui qui l'a appris (le groupe le connaît tant qu'il est là)", async () => {
  const { M, a, b } = await partie();
  const r = await M.api.recevoirPlan({ cle: "carnet-du-fontainier", acteurId: a.id });
  assert.ok(M.api.plans().connus.includes("captage-de-source"));
  const savoirs = savoirsDe(b);
  if (!L.peutLirePlan(M.api.contenu(), "citerne-lontan", savoirs).ok) for (const s of L.savoirsDuPlan(M.api.contenu(), "citerne-lontan")) await b.createEmbeddedDocuments("Item", [{ name: s, type: "savoir", system: { cle: s } }]);
  let e;
  do e = await M.api.enseignerPlan({ acteurId: b.id, cle: "citerne-lontan" }); while (!e.termine);
  assert.equal(e.requis, L.veilleesPourApprendre(L.planPourCle(M.api.contenu(), "citerne-lontan")));
  assert.deepEqual(b.system.plans, ["citerne-lontan"]);
  assert.ok(M.api.plans().parCoeur.some(x => x.acteurId === b.id));
  assert.ok(M.api.etat().journal.some(j => j.cle === "Plans.Journal.Appris"));
  // Le carnet unique change de mains : le plan appris par cœur reste connu, les autres non.
  await M.api.donnerPlan({ objetId: r.objetId });
  const connus = M.api.plans().connus;
  assert.ok(connus.includes("citerne-lontan") && !connus.includes("captage-de-source"));
  await assert.rejects(() => M.api.enseignerPlan({ acteurId: a.id, cle: "captage-de-source" }), /connaît|knows/);
});

test("API : l'étagère aux cahiers (ranger, reprendre, le feu) ; au déménagement, les papiers partent avec le groupe", async () => {
  const { M, a, b } = await partie();
  await M.api.noterPlan({ cle: "potager" });
  await M.api.noterPlan({ cle: "compost" });
  const p1 = await M.api.copierPlan({ cle: "potager", acteurId: a.id });
  const p2 = await M.api.copierPlan({ cle: "compost", acteurId: a.id });
  await assert.rejects(() => M.api.rangerPlan({ objetId: p1.objetId }), /étagère|shelf/);
  const c = await M.api.construire({ installation: "etagere-aux-cahiers", quarts: 3, membres: [a.id, b.id] });
  assert.equal(c.termine, true);
  assert.equal(M.api.plans().places, 12);
  const r1 = await M.api.rangerPlan({ objetId: p1.objetId });
  await M.api.rangerPlan({ objetId: p2.objetId });
  assert.equal(papiers(a).length, 0);
  assert.equal(M.api.plans().etagere.length, 2);
  const pris = await M.api.prendrePlan({ id: r1.id, acteurId: b.id });
  assert.ok(b.items.get(pris.objetId)?.system.plans.includes("potager"));
  await M.api.rangerPlan({ objetId: pris.objetId });
  const feu = await M.api.perdreEtagere({ cause: "feu" });
  assert.equal(feu.perdus.length, 1);
  assert.equal(M.api.etat().plans.etagere.length, 1);
  await assert.rejects(() => M.api.perdreEtagere({ cause: "grêle" }), /grêle/);
  await M.api.demenager({ site: "ilet-a-bourse", membres: [a.id, b.id] });
  assert.equal(M.api.etat().plans.etagere.length, 0);
  assert.equal(papiers(a).length + papiers(b).length, 1, "le papier qui restait part avec le groupe");
});

test("API : les papiers d'un mort passent à un vivant ; la fouille « plans » rend son résultat", async () => {
  const { M, a, b } = await partie();
  await M.api.noterPlan({ cle: "potager" });
  await M.api.copierPlan({ cle: "potager", acteurId: b.id });
  await b.update({ system: { vivant: false } });
  const r = await M.api.reprendrePlans({ deId: b.id, aId: a.id });
  assert.equal(r.repris.length, 1);
  assert.equal(papiers(b).length, 0);
  assert.equal(papiers(a).length, 1);
  assert.ok(M.api.etat().journal.some(j => j.cle === "Plans.Journal.Repris"));
  const f = await M.api.fouiller({ site: "ilet-de-marla", cible: "plans", quarts: 2, membres: [a.id] });
  assert.ok("plan" in f && f.fouille === true);
  if (f.plan) assert.ok(papiers(a).length === 2 && f.plan.nom);
});

test("fenêtre du MJ et fiches : le bloc « Les plans » de l'onglet Savoirs, la cible « plans », un papier dit ses plans", async () => {
  const { M, a } = await partie();
  await M.api.noterPlan({ cle: "potager" });
  const c = await M.api.copierPlan({ cle: "potager", acteurId: a.id });
  const { contexteMJ } = await import("../systems/lakour-survie/scripts/apps/mj.mjs");
  const s = contexteMJ("savoirs");
  assert.ok(s.plans && s.plans.lieux.length === 7 && s.plans.optionsLieux.length === 7);
  assert.ok(s.plans.papiers.length === 1 && s.plans.carnet.length > 0 && s.plans.optionsCopiables.some(o => o.valeur === "potager"));
  assert.ok(s.plans.optionsCibles.some(o => o.valeur === "recette:gazogene"));
  assert.equal(contexteMJ("partie").plans, null);
  assert.ok(contexteMJ("actions").cibles.some(o => o.valeur === "plans"));
  const { sectionsObjet } = await import("../systems/lakour-survie/scripts/apps/fiches.mjs");
  const lignes = sectionsObjet(a.items.get(c.objetId)).flatMap(x => x.lignes);
  assert.ok(lignes.some(l => /Potager|Vegetable/.test(l)), JSON.stringify(lignes));
});
