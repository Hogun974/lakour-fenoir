// Lot 9 « Le paradis et son piège » (contrat §28) : la forme du contenu (installations, chantiers de région, corvées de la ronde,
// tables, journaux, pages du guide) et sa traduction anglaise.   Lancer : npm run essais
import { test } from "node:test";
import assert from "node:assert/strict";
import { DOCUMENTS, donnees } from "../modules/lakour-fenoir/contenu/index.mjs";
import { verifierDonnees, fabriquerAnglais } from "../outils/fabriquer-fenoir.mjs";
import { INSTALLATIONS_PARADIS, CHANTIERS_REGION, CORVEES_PARADIS, TABLES_PARADIS, JOURNAL_PARADIS, JOURNAL_ILE, PAGES_JOUEUR_PARADIS } from "../modules/lakour-fenoir/contenu/paradis.mjs";
import { L } from "./doublures/survie-outils.mjs";

const D = donnees();
const sans = t => String(t ?? "").replace(/<[^>]+>/g, " ");

test("contenu « paradis » : le puits d'air et de jour, la haie de bambous et le rideau de filaos (sœurs lontan du camouflage)", () => {
  const par = cle => D.installations.find(i => i.cle === cle);
  assert.deepEqual(INSTALLATIONS_PARADIS.map(i => i.system.cle), ["puits-de-jour", "haie-de-bambous", "rideau-de-filaos"]);
  assert.deepEqual(par("puits-de-jour").niveaux.map(n => [n.effets.air, n.effets.jour ?? 0]), [[1, 0], [1, 1]]);
  assert.ok(par("puits-de-jour").niveaux.every(n => n.effets.discretion < 0 && n.requiert.site.souterrain >= 1), "un compromis : la discrétion baisse");
  for (const k of ["haie-de-bambous", "rideau-de-filaos"]) {
    assert.equal(par(k).arbre, "lontan");
    assert.equal(par(k).role, "camouflage", "la sœur lontan du camouflage");
    assert.ok(par(k).niveaux.every(n => n.effets.pousse > 0 && n.cout.ile > 0), k);
  }
  assert.ok(par("haie-de-bambous").niveaux.every(n => n.effets.plie && !n.effets.casse));
  assert.ok(par("rideau-de-filaos").niveaux.every(n => n.effets.casse && !n.effets.plie));
  assert.ok(par("rideau-de-filaos").niveaux[0].effets.pousse < par("haie-de-bambous").niveaux[0].effets.pousse, "le filao pousse plus vite");
  assert.deepEqual(verifierDonnees(D), []);
});

test("contenu « paradis » : six grands chantiers de région, bien formés (lieux réels, affaires du lot 12), deux corvées de la ronde", () => {
  assert.equal(CHANTIERS_REGION.length, 6);
  assert.deepEqual(D.chantiersRegion, CHANTIERS_REGION);
  assert.deepEqual(L.erreursChantiers(D), []);
  assert.ok(CHANTIERS_REGION.some(c => c.effets.electricite), "une centrale donne le courant");
  assert.ok(CHANTIERS_REGION.some(c => c.effets.routes?.length), "une route rouverte");
  assert.deepEqual(CHANTIERS_REGION.find(c => c.cle === "relancer-la-centrale-de-langevin").affaires, ["la-petite-centrale-de-langevin"]);
  assert.deepEqual(CHANTIERS_REGION.find(c => c.cle === "rouvrir-la-route-des-tamarins").affaires, ["le-viaduc"]);
  assert.deepEqual(CORVEES_PARADIS.map(c => c.tache), ["ronde", "ronde"]);
  assert.deepEqual(L.verifierCorvees(D), []);
});

test("contenu « paradis » : quatre tables, deux journaux du MJ, deux pages du guide ; sobre, sans gore", () => {
  assert.ok([JOURNAL_PARADIS, JOURNAL_ILE, ...TABLES_PARADIS].every(d => DOCUMENTS.includes(d)));
  assert.deepEqual(TABLES_PARADIS.map(t => t.flags["lakour-fenoir"].paradis), ["ronde-ce-qu-on-trouve", "sous-terre-la-bougie", "ile-ce-qu-on-voit-la-nuit", "convoi-attire-par-la-lumiere"]);
  assert.equal(TABLES_PARADIS[0].results.length, L.REGLES_PARADIS.ronde.trouvaille, "le numéro que donne la ronde");
  const pages = JOURNAL_PARADIS.pages.map(p => p.flags?.["lakour-fenoir"]?.cle);
  for (const k of ["principe", "chaleur", "ronde", "corps", "sous-terre", "haie", "mener"]) assert.ok(pages.includes(k), k);
  const ile = JOURNAL_ILE.pages.map(p => p.flags?.["lakour-fenoir"]?.cle);
  for (const k of ["but", "effets", "chantiers", "jalons", "campagne"]) assert.ok(ile.includes(k), k);
  const guide = DOCUMENTS.find(d => d.__cle === "guides:guide-du-joueur");
  for (const k of PAGES_JOUEUR_PARADIS.map(p => p.cle)) assert.ok(guide.pages.some(p => p.flags?.["lakour-fenoir"]?.cle === k), k);
  const tout = [JOURNAL_PARADIS, JOURNAL_ILE, ...TABLES_PARADIS].map(d => sans(JSON.stringify(d))).join(" ");
  for (const mot of ["viscères", "cervelle", "sang qui gicle", "pourriture grouillante"]) assert.ok(!tout.includes(mot), mot);
  // La règle du contrepoint est dite : la lumière se voit, et les bandes viennent.
  assert.ok(/les bandes viennent/.test(tout));
});

test("traduction « paradis » : installations, chantiers, corvées, tables, journaux et pages du guide en anglais", () => {
  const { documents, registre } = fabriquerAnglais();
  assert.equal(registre.chantiersRegion.find(c => c.cle === "rallumer-le-phare-de-bel-air").nom, "Relight the Bel-Air lighthouse");
  assert.ok(registre.chantiersRegion.every(c => !/ la | le | les /.test(` ${c.description} `)), "les descriptions des chantiers en anglais");
  assert.equal(registre.corvees.find(c => c.cle === "faire-le-tour-de-la-cloture").nom, "Walk the fence");
  assert.equal(documents.find(d => d.cle === "installations:haie-de-bambous")?.doc.name, "Bamboo hedge");
  const j = documents.find(d => d.cle === "mj:le-paradis")?.doc;
  assert.equal(j.name, "Paradise and its trap");
  assert.ok(!/ chaleur /.test(sans(JSON.stringify(j.pages))), "le journal du MJ traduit");
  assert.equal(documents.find(d => d.cle === "mj:rallumer-l-ile")?.doc.name, "Lighting the island again");
  assert.equal(documents.find(d => d.cle === "tables:convoi-attire-par-la-lumiere")?.doc.name, "A convoy drawn by the light");
  // Les mots du glossaire : les Livides sont les Pallid ; les noms de lieux réels restent en français.
  const ile = sans(JSON.stringify(documents.find(d => d.cle === "mj:rallumer-l-ile").doc.pages));
  assert.ok(/Pallid/.test(ile) && !/Livide/.test(ile));
  assert.ok(/Rivière de l'Est|Rivi\\u00e8re de l'Est/.test(ile) && /Langevin/.test(ile));
});
