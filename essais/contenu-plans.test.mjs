// Le contenu du lot 4 « Les plans » (2026-11-17) dans lakour-fenoir et sa traduction : le registre des plans (rareté, lieux, plans
// uniques et leur objet), les plans propres des sites, les sept lieux à plans (garde, fenêtre, tirage), l'étagère aux cahiers, les
// papiers, une table par lieu et deux tables d'ambiance, le journal du MJ « Les plans » et la page du guide du joueur ; tout est en
// anglais dans lakour-fenoir-en ; les chiffres du journal sont ceux de la logique.   Lancer : npm run essais
import { test } from "node:test";
import assert from "node:assert/strict";
import { fabriquer, fabriquerAnglais, lireDictionnaires, verifierDonnees } from "../outils/fabriquer-fenoir.mjs";
import { donnees } from "../modules/lakour-fenoir/contenu/index.mjs";
import { TABLES_PLANS, JOURNAL_PLANS, LIEUX_A_PLANS, PLANS_DES_SITES } from "../modules/lakour-fenoir/contenu/plans.mjs";
import { MODULE, sansBalises } from "../modules/lakour-fenoir/contenu/aides.mjs";
import * as L from "../systems/lakour-survie/logique/index.mjs";

const D = donnees();
const docs = fabriquer();
const { documents: anglais, registre: EN } = fabriquerAnglais(docs, D, lireDictionnaires().dictionnaire);
const cleDe = d => d.doc.flags?.[MODULE]?.cle ?? d.doc.flags?.[`${MODULE}-en`]?.cle;

test("registre : les plans (rareté, lieux, plans uniques et leur objet), les plans des sites, les lieux à plans ; le fabricant les vérifie", () => {
  assert.deepEqual(L.erreursPlans(D), []);
  assert.deepEqual(verifierDonnees(D), []);
  assert.ok(D.plans.length >= 50);
  const uniques = D.plans.filter(p => p.unique);
  assert.deepEqual(uniques.map(p => p.cle).sort(), ["cahier-de-l-electricien", "cahier-de-tisanes-de-la-gramoune", "carnet-du-fontainier"]);
  for (const u of uniques) {
    assert.ok(u.rarete[0] >= 85, u.cle);
    const objet = D.equipements.find(e => e.cle === u.objet);
    assert.ok(objet && objet.categorie === "livre", u.objet);
  }
  // Chaque plan rare se trouve quelque part : dans un lieu à plans, parmi les plans d'un site, ou (plan unique) dans un type de site.
  const quelquePart = new Set([...D.lieuxAPlans.flatMap(l => l.tirage.map(x => x.plan)), ...D.sites.flatMap(s => s.plans ?? [])]);
  for (const p of D.plans.filter(x => L.estRare(x))) assert.ok(quelquePart.has(p.cle) || (p.unique && p.lieux.length), `${p.cle} ne se trouve nulle part`);
  assert.equal(D.sites.filter(s => (s.plans ?? []).length).length, Object.keys(PLANS_DES_SITES).length);
  assert.deepEqual(D.sites.find(s => s.cle === "centrale-de-langevin").plans, ["pico-hydro", "batteries"]);
  // Les sept lieux : leur fenêtre (saison sèche, nouvelle lune, après un cyclone, entre deux coulées, ou toujours), leur garde.
  assert.equal(D.lieuxAPlans.length, 7);
  const fenetres = D.lieuxAPlans.map(l => Object.keys(l.fenetre).join(",") || "toujours").sort();
  assert.deepEqual([...new Set(fenetres)].sort(), ["apresCyclone", "horsEruption", "lune", "saison", "toujours"]);
  assert.deepEqual([...new Set(D.lieuxAPlans.map(l => l.garde.type))].sort(), ["livides", "milieu"]);
  for (const l of D.lieuxAPlans.filter(x => x.garde.rencontre)) assert.ok(D.bestiaire.some(b => b.cle === l.garde.rencontre.creature && b.categorie === "livide"), l.cle);
  // Aucune installation ni recette n'exige un plan (décision de Jordan) : le contenu n'a aucun champ « plan » requis.
  for (const i of D.installations) for (const n of i.niveaux) assert.ok(!("plan" in (n.requiert ?? {})), i.cle);
  for (const r of D.recettes) assert.ok(!("plan" in (r.requiert ?? {})), r.cle);
});

test("installation et papiers : l'étagère aux cahiers (12 papiers, puis un coffre de 24) ; la copie et deux plans uniques qui enseignent", () => {
  const e = D.installations.find(i => i.cle === "etagere-aux-cahiers");
  assert.equal(e.categorie, "stockage");
  assert.deepEqual(e.niveaux.map(n => n.effets.bibliotheque), [{ places: 12, protege: false }, { places: 24, protege: true }]);
  const copie = D.equipements.find(x => x.cle === "copie-de-plan");
  assert.ok(copie && copie.charge === 0 && copie.categorie === "livre");
  assert.deepEqual(D.equipements.find(x => x.cle === "carnet-du-fontainier").enseigne, ["hydraulique-rurale"]);
  assert.deepEqual(D.equipements.find(x => x.cle === "cahier-de-l-electricien").enseigne, ["electricite-solaire"]);
});

test("tables : une par lieu à plans (pondérée par le tirage) et deux d'ambiance ; journal « Les plans » et page du guide du joueur", () => {
  assert.equal(TABLES_PLANS.length, LIEUX_A_PLANS.length + 2);
  for (const l of LIEUX_A_PLANS) {
    const t = TABLES_PLANS.find(x => x.flags[MODULE].cle === `plans-${l.cle}`);
    assert.ok(t, l.cle);
    assert.equal(t.results.length, l.tirage.reduce((s, x) => s + x.poids, 0));
  }
  const pages = JOURNAL_PLANS.pages.map(p => p.flags?.[MODULE]?.cle);
  assert.deepEqual(pages, ["un-plan", "trouver", "lieux", "lire-copier-apprendre", "uniques", "etagere", "troc", "systeme"]);
  const texte = JOURNAL_PLANS.pages.map(p => sansBalises(p.text.content)).join(" ");
  assert.ok(!/object Object/.test(texte));
  // Les chiffres du journal sont ceux de la logique.
  const valeurCahier = L.valeurPlan(L.planDuRegistre(D, "cahier-de-tisanes-de-la-gramoune"));
  assert.ok(texte.includes(`${valeurCahier} parts`));
  assert.ok(texte.includes(`${L.REGLES_PLANS.etagere.vol[0]} à ${L.REGLES_PLANS.etagere.vol[1]} papiers`));
  for (const l of LIEUX_A_PLANS) assert.ok(texte.includes(l.nom), l.nom);
  const guide = docs.find(d => d.cle === "guides:guide-du-joueur").doc;
  assert.ok(guide.pages.some(p => p.name === "Les plans"));
  assert.ok(docs.some(d => d.cle === "mj:les-plans"));
});

test("anglais : registre des plans et des lieux, papiers, étagère, tables et journal traduits ; rien de « Livide » ni de « Hauts »", () => {
  for (const l of EN.lieuxAPlans) {
    const fr = D.lieuxAPlans.find(x => x.cle === l.cle);
    for (const k of ["nom", "description"]) assert.notEqual(l[k], fr[k], `${l.cle}.${k}`);
    assert.notEqual(l.garde.texte, fr.garde.texte);
    if (fr.fenetreTexte) assert.notEqual(l.fenetreTexte, fr.fenetreTexte);
  }
  for (const p of EN.plans.filter(x => x.unique)) assert.notEqual(p.description, D.plans.find(x => x.cle === p.cle).description, p.cle);
  assert.equal(EN.installations.find(i => i.cle === "etagere-aux-cahiers").nom, "Notebook shelf");
  assert.equal(EN.equipements.find(e => e.cle === "copie-de-plan").nom, "Plan copy");
  const tables = anglais.filter(d => d.pack === "tables" && String(cleDe(d)).startsWith("plans-"));
  assert.equal(tables.length, TABLES_PLANS.length);
  for (const t of tables) assert.ok(!/rareté|Le plan :/.test(JSON.stringify(t.doc.results)), t.cle);
  const journal = anglais.find(d => d.cle === "mj:les-plans").doc;
  assert.equal(journal.name, "Plans");
  const texte = journal.pages.map(p => p.text.content).join(" ");
  assert.ok(!/\bLivides?\b/.test(texte) && !/\bthe Hauts\b/.test(texte));
  assert.ok(/Highland Pallid/.test(texte) && /The well-keeper's notebook/.test(texte));
  assert.ok(anglais.find(d => d.cle === "guides:guide-du-joueur").doc.pages.some(p => p.name === "Plans"));
});
