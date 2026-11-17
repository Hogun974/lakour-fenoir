// Lot « corps » (contrat §19) : la forme du contenu (symptômes, Gris, installations d'hygiène, bouclier, bivouac, journal et table)
// et sa traduction anglaise.   Lancer : npm run essais
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { DOCUMENTS, donnees } from "../modules/lakour-fenoir/contenu/index.mjs";
import { verifierDonnees, fabriquerAnglais } from "../outils/fabriquer-fenoir.mjs";
import { SYMPTOMES, GRIS } from "../modules/lakour-fenoir/contenu/afflictions.mjs";
import { INSTALLATIONS_HYGIENE, JOURNAL_CORPS, TABLES_CORPS, PAGES_JOUEUR_CORPS } from "../modules/lakour-fenoir/contenu/hygiene.mjs";

const D = donnees();
const sans = t => String(t ?? "").replace(/<[^>]+>/g, " ");

test("contenu « corps » : chaque affliction a ses symptômes connus, son diagnostic, ses effets de stade ; le Gris a six stades", () => {
  const cles = new Set(SYMPTOMES.map(s => s.cle));
  assert.equal(cles.size, 30);
  for (const a of D.afflictions) {
    assert.ok(a.symptomes.active.length >= 2, a.cle);
    for (const k of [...a.symptomes.active, ...(a.symptomes.aggravee ?? [])]) assert.ok(cles.has(k), `${a.cle} : ${k}`);
    if (a.aggravation) assert.ok(a.symptomes.aggravee?.length, `${a.cle} aggravée`);
    assert.ok(a.evidente || a.diagnostic.length, a.cle);
  }
  for (const k of ["fracture", "brulure", "piqure-de-scolopendre", "choc-d-une-perte"]) assert.equal(D.afflictions.find(a => a.cle === k).evidente, true, k);
  assert.equal(GRIS.stades.length, 6);
  assert.deepEqual(GRIS.stades[0].symptomes, ["plaie-rouge"]);
  assert.ok(GRIS.stades.slice(2).every(s => s.symptomes.includes("peau-grise")));
  assert.deepEqual(D.gris, GRIS);
  assert.equal(D.symptomes.length, 30);
});

test("contenu « corps » : les installations d'hygiène en sœurs (latrines, toilette), le bouclier, le bivouac", () => {
  const par = cle => D.installations.find(i => i.cle === cle);
  assert.deepEqual(INSTALLATIONS_HYGIENE.map(i => i.system.cle), ["feuillees", "latrines-seches", "fosse-maconnee", "lavoir", "douche"]);
  assert.deepEqual(["feuillees", "latrines-seches", "fosse-maconnee"].map(k => par(k).niveaux[0].effets.hygiene), [1, 2, 3]);
  assert.deepEqual(["feuillees", "latrines-seches", "fosse-maconnee"].map(k => par(k).role), ["latrines", "latrines", "latrines"]);
  assert.deepEqual(["lavoir", "douche"].map(k => par(k).niveaux[0].effets.hygiene), [1, 2]);
  assert.equal(par("fosse-maconnee").arbre, "moderne");
  assert.equal(par("feuillees").arbre, "lontan");
  assert.equal(par("fosse-maconnee").niveaux[0].effets.consommation.eau, 1);
  assert.equal(D.equipements.find(e => e.cle === "bouclier-de-tole").parade, 5);
  assert.ok(D.equipements.filter(e => e.bivouac).map(e => e.cle).includes("tente"));
  assert.deepEqual(verifierDonnees(D), []);
});

test("contenu « corps » : le journal du MJ, la table du bivouac, la page du guide ; sobre, sans gore", () => {
  assert.ok(DOCUMENTS.includes(JOURNAL_CORPS) && TABLES_CORPS.every(t => DOCUMENTS.includes(t)));
  const pages = JOURNAL_CORPS.pages.map(p => p.flags?.["lakour-fenoir"]?.cle);
  for (const k of ["sommeil", "bivouac", "hygiene", "symptomes", "gris", "chutes", "bouclier", "faim-soif"]) assert.ok(pages.includes(k), k);
  assert.equal(TABLES_CORPS[0].results.length, 10);
  const guide = DOCUMENTS.find(d => d.__cle === "guides:guide-du-joueur");
  assert.ok(guide.pages.some(p => p.flags?.["lakour-fenoir"]?.cle === "le-corps"));
  assert.equal(PAGES_JOUEUR_CORPS.length, 1);
  const tout = [JOURNAL_CORPS, ...TABLES_CORPS].map(d => JSON.stringify(d)).join(" ");
  for (const mot of ["sang qui gicle", "excrément", "merde", "viscères"]) assert.ok(!tout.includes(mot), mot);
});

test("traduction « corps » : symptômes, installations, journal, table et page du guide en anglais", () => {
  const { documents, registre } = fabriquerAnglais();
  const sym = registre.symptomes;
  assert.equal(sym.find(s => s.cle === "fievre").nom, "Fever");
  assert.ok(sym.every(s => !/[éèàç]/.test(s.nom)), "les symptômes en anglais");
  const j = documents.find(d => d.cle === "mj:le-corps")?.doc;
  assert.ok(j && !/ sommeil /.test(sans(JSON.stringify(j.pages))), "le journal du MJ traduit");
  const f = documents.find(d => d.cle === "installations:feuillees")?.doc;
  assert.notEqual(f.name, "Feuillées");
  const en = JSON.parse(readFileSync(new URL("../modules/lakour-fenoir/contenu/en/registre.json", import.meta.url), "utf8"));
  assert.ok(en["registre/symptomes/peau-grise"]?.nom?.en);
});
