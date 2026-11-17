// Lot 5 « fouille » (contrat §25) : la forme du contenu de lakour-fenoir (contenu/fouilles.mjs) et sa traduction : les genres de lieux et
// leurs tables portées du jeu 3D, ce que vaut un objet, le genre des sites, les milieux des régions, les bêtes, les outils qui les prennent,
// l'abondance des tables (en ressources par quart-personne), les documents (tables, journal du MJ, page du guide) et le module anglais.
//   Lancer : npm run essais
import { test } from "node:test";
import assert from "node:assert/strict";
import { donnees, DOCUMENTS } from "../modules/lakour-fenoir/contenu/index.mjs";
import { GENRES_FOUILLE, OBJETS_FOUILLE, TABLES_FOUILLE, JOURNAL_FOUILLES, EQUIPEMENTS_FOUILLE, RECETTES_FOUILLE } from "../modules/lakour-fenoir/contenu/fouilles.mjs";
import { lireDictionnaires, fabriquerAnglais } from "../outils/fabriquer-fenoir.mjs";
import * as L from "../systems/lakour-survie/logique/index.mjs";
import { chargerContenu } from "./outils/simuler-parties.mjs";

const d = donnees();
const contenu = chargerContenu();

test("registre : les familles du lot (objets, genres, bêtes, gisements, milieux), le genre des sites, les milieux des régions", () => {
  assert.equal(d.genresFouille.length, 24);
  assert.ok(d.objetsFouille.length >= 90);
  assert.equal(d.betesTrouvees.length, 6);
  assert.ok(d.milieux.length >= 10 && d.gisements.length >= 15);
  for (const s of d.sites) assert.ok(s.genre === "" ? ["tunnel-de-lave", "galerie"].includes(s.type) : d.genresFouille.some(g => g.cle === s.genre), s.cle);
  for (const r of d.regions) assert.ok(r.milieux.length >= 2, r.cle);
  // Les outils qui prennent une bête.
  const cap = Object.fromEntries(d.equipements.filter(e => e.capture?.length).map(e => [e.cle, e.capture]));
  assert.deepEqual(Object.keys(cap).sort(), ["cage", "corde", "cordes-de-choka", "enfumoir", "sac-de-goni"]);
  for (const b of d.betesTrouvees) assert.ok(Object.values(cap).some(c => c.includes(b.cle)), b.cle);
  assert.deepEqual(L.erreursFouilles(contenu), []);
});

test("les tables portées du jeu 3D : la pharmacie (pansements 4 à 12 à 90 %), les lieux de culte sans outil ni arme, des démontages", () => {
  const ph = GENRES_FOUILLE.find(g => g.cle === "pharmacie");
  assert.deepEqual(ph.lots[0], { objet: "pansement", q: [4, 12], chance: 0.9, risque: 0.02 });
  assert.ok(ph.lots.some(l => l.objet === "trousse-de-secours" && l.chance === 0.15));
  const culte = GENRES_FOUILLE.find(g => g.cle === "lieu-de-culte");
  assert.ok(culte.lots.every(l => !["outil", "arme"].some(x => OBJETS_FOUILLE.find(o => o.cle === l.objet)?.equipement)));
  assert.ok(culte.lots.length <= 6);
  assert.deepEqual(GENRES_FOUILLE.find(g => g.cle === "case").demontage.rend, { materiaux: 12, pieces: 0 });
  assert.deepEqual(GENRES_FOUILLE.find(g => g.cle === "maison").demontage.rend, { materiaux: 21, pieces: 1 });
});

test("l'abondance des tables : au calme, de 0,5 à 6 ressources par quart-personne (la fouille d'une région en rend au plus 6)", () => {
  for (const g of GENRES_FOUILLE) {
    let total = 0;
    for (const l of g.lots) {
      const v = L.valeurObjetTrouve(contenu, l.objet);
      if (v.ressource && v.par > 0 && v.ressource !== "gaz") total += l.chance * (l.q[0] + l.q[1]) / 2 / v.par;
    }
    const parQuart = total / g.travail;
    assert.ok(parQuart >= 0.5 && parQuart <= 6, `${g.cle} : ${parQuart.toFixed(2)}`);
  }
});

test("documents : une table par genre et par milieu (au moins six lignes), le journal du MJ, la page du guide, les outils et leurs recettes", () => {
  assert.equal(TABLES_FOUILLE.length, 2 + GENRES_FOUILLE.length + d.milieux.length);
  for (const t of TABLES_FOUILLE) assert.ok(t.results.length >= 6, t.name);
  for (const doc of [...TABLES_FOUILLE, JOURNAL_FOUILLES, ...EQUIPEMENTS_FOUILLE, ...RECETTES_FOUILLE]) assert.ok(DOCUMENTS.includes(doc), doc.name);
  assert.equal(JOURNAL_FOUILLES.pages.length, 8);
  const guide = DOCUMENTS.find(x => x.__cle === "guides:guide-du-joueur");
  assert.ok(guide.pages.some(p => p.name === "Fouiller, démonter, récolter"));
  for (const r of RECETTES_FOUILLE) assert.ok(d.equipements.some(e => e.cle === r.system.produit.equipement), r.system.cle);
});

test("traduction : le lot est entièrement en anglais (registre, tables, journal, guide), les clés et les nombres inchangés", () => {
  const { registre, documents, rapport } = fabriquerAnglais(undefined, undefined, lireDictionnaires().dictionnaire);
  const restes = rapport.manquants.filter(m => /fouille|Fouille|genresFouille|objetsFouille|betesTrouvees|gisements|milieux/.test(m));
  assert.deepEqual(restes, []);
  assert.equal(registre.genresFouille.find(g => g.cle === "pharmacie").nom, "Pharmacy");
  assert.equal(registre.genresFouille.find(g => g.cle === "pharmacie").lots[0].q[1], 12);
  assert.equal(registre.objetsFouille.find(o => o.cle === "pansement").nom, "Dressings");
  assert.equal(registre.milieux.find(m => m.cle === "ravine").nom, "Ravine");
  const j = documents.map(x => x.doc ?? x).find(x => x._id === JOURNAL_FOUILLES._id);
  assert.equal(j.name, "Searching, taking apart, gathering");
  assert.ok(!/[àéèù]/.test(j.pages[0].text.content.replace(/Fénoir|Étang|îlet|gîte|é/g, "")), "la page anglaise n'est pas en français");
});
