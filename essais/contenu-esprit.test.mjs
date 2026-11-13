// Le contenu de l'esprit et du sens moral (complément du jeu 3D, familles 2 et 3) dans lakour-fenoir et sa traduction : religions
// de l'île (« aucune » et « plusieurs » comprises), ancrages, traits qui penchent au tirage, chefs des factions, prétirés et PNJ dont
// l'esprit est tiré, tables, événements, pages des guides ; tout est en anglais dans lakour-fenoir-en, sans un mot de plus en
// français ; aucune religion n'a d'effet propre dans les règles (pas de bonus ni de malus par origine ou par foi).
// Lancer : npm run essais
import { test } from "node:test";
import assert from "node:assert/strict";
import { fabriquer, fabriquerAnglais, lireDictionnaires, verifierDonnees } from "../outils/fabriquer-fenoir.mjs";
import { donnees } from "../modules/lakour-fenoir/contenu/index.mjs";
import { RELIGIONS, ANCRAGES } from "../modules/lakour-fenoir/contenu/religions.mjs";
import { TABLES_ESPRIT, EVENEMENTS_ESPRIT } from "../modules/lakour-fenoir/contenu/esprit.mjs";
import { sansBalises } from "../modules/lakour-fenoir/contenu/aides.mjs";
import * as L from "../systems/lakour-survie/logique/index.mjs";

const D = donnees();
const docs = fabriquer();
const { documents: anglais, registre: EN } = fabriquerAnglais(docs, D, lireDictionnaires().dictionnaire);

test("religions et ancrages : au registre, « aucune » et « plusieurs » comprises, observances et fêtes connues", () => {
  assert.deepEqual(D.religions.map(r => r.cle), RELIGIONS.map(r => r.cle));
  assert.ok(D.religions.find(r => r.cle === "aucune")?.special === "aucune" && D.religions.find(r => r.cle === "plusieurs")?.special === "plusieurs");
  for (const r of D.religions.filter(x => !x.special)) {
    assert.ok(L.BESOINS_OBSERVANCE.includes(r.observance.besoin) && r.observance.texte, r.cle);
    for (const f of r.fetes) assert.ok(D.fetes.some(x => x.cle === f), `${r.cle} : fête ${f}`);
  }
  assert.ok(ANCRAGES.length >= 6);
  for (const k of ["photo", "carnet", "routine", "sport"]) assert.ok(D.ancrages.some(a => a.cle === k), `ancrage ${k} (le complément les cite)`);
  assert.deepEqual(verifierDonnees(D).filter(e => /religion|ancrage|sensMoral|esprit/.test(e)), []);
  // Le système les lit : clés uniques, indexées.
  const idx = L.indexer(D);
  assert.equal(idx.religions.size, RELIGIONS.length);
  assert.equal(idx.ancrages.size, ANCRAGES.length);
});

test("aucune religion, aucune origine n'a d'effet propre : même plafond, même réconfort, même observance (au besoin près)", () => {
  const s = (religion, extra = {}) => L.survivantNeuf({ regard: "vivre", religion, religions: [], pratique: true, ancrage: "", esprit: {}, ...extra });
  const plafonds = new Set(D.religions.filter(r => !r.special).map(r => L.plafondEsprit(s(r.cle), D)));
  assert.deepEqual([...plafonds], [1]);
  assert.equal(L.plafondEsprit(s("aucune", { ancrage: "photo" }), D), 1, "l'ancrage d'un non-croyant fait le même effet");
  // Ce que les règles lisent d'une religion : son observance (besoin) et ses fêtes, rien d'autre.
  for (const r of D.religions) assert.deepEqual(Object.keys(r).filter(k => !["cle", "nom", "description", "observance", "fetes", "poids", "affinites", "special"].includes(k)), [], r.cle);
});

test("traits, factions, prétirés et PNJ : ce qui penche au tirage, le chef de chaque faction, des personnages prêts à jouer", () => {
  const traits = new Map(D.traits.map(t => [t.cle, t]));
  assert.equal(traits.get("main-ouverte").effets.sensMoral, 3);
  assert.equal(traits.get("doigts-crochus").effets.sensMoral, -2);
  assert.equal(traits.get("ame-de-pelerin").effets.croyant, true);
  for (const f of D.factions) assert.ok(Number.isInteger(f.sensMoralChef), f.cle);
  assert.ok(D.factions.find(f => f.cle === "sans-lune").sensMoralChef < -5 && D.factions.find(f => f.cle === "dispensaire-du-sud").sensMoralChef > 4);
  const survivants = docs.filter(d => d.pack === "survivants").map(d => d.doc);
  assert.equal(survivants.length, 17);
  for (const a of survivants) {
    assert.ok(L.espritActif(a.system), `${a.name} : esprit tiré`);
    assert.ok(L.liste(D.religions).some(r => r.cle === a.system.religion), `${a.name} : religion`);
  }
  assert.equal(survivants.find(a => a.name === "Ti Zan").system.age, 9, "Ti Zan, l'enfant témoin");
  assert.ok(L.estEnfant(survivants.find(a => a.name === "Ti Zan").system));
  // Les créatures du bestiaire restent sans esprit.
  for (const b of docs.filter(d => d.pack === "bestiaire")) assert.equal(b.doc.system.regard, "");
});

test("tables, événements et pages des guides de l'esprit et du sens moral", () => {
  const tables = docs.filter(d => d.pack === "tables").map(d => d.doc.flags["lakour-fenoir"].cle);
  for (const t of TABLES_ESPRIT) assert.ok(tables.includes(t.flags["lakour-fenoir"].cle));
  for (const e of EVENEMENTS_ESPRIT) assert.ok(D.evenements.some(x => x.cle === e.cle), e.cle);
  const guide = docs.find(d => d.pack === "guides" && d.doc.flags["lakour-fenoir"].cle === "guide-du-joueur").doc;
  for (const k of ["esprit", "religions", "sens-moral"]) assert.ok(guide.pages.some(p => p.flags?.["lakour-fenoir"]?.cle === k), k);
  const mj = docs.find(d => d.pack === "mj" && d.doc.flags["lakour-fenoir"].cle === "guide-du-mj").doc;
  const page = mj.pages.find(p => p.flags?.["lakour-fenoir"]?.cle === "esprit-et-sens-moral");
  assert.ok(/aucune scène|rien de montré/i.test(sansBalises(page.text.content)), "traité sobrement");
  assert.ok(/ne confirme rien|ne confirme et ne dément/i.test(sansBalises(guide.pages.find(p => p.flags["lakour-fenoir"].cle === "esprit").text.content)), "jamais de magie");
});

test("traduction : religions, ancrages, tables, événements et pages en anglais ; le créole reste, avec son sens", () => {
  const nom = (l, cle) => l.find(x => x.cle === cle)?.nom;
  assert.equal(nom(EN.religions, "catholique"), "Catholic");
  assert.equal(nom(EN.religions, "plusieurs"), "Several at once");
  assert.equal(nom(EN.ancrages, "photo"), "A photo");
  assert.ok(/kabaré/.test(nom(EN.religions, "ancetres-malgaches")), "le nom créole du culte reste");
  for (const r of EN.religions) assert.ok(!/[àéèêç]/.test(sansBalises(r.observance?.texte ?? "")), `${r.cle} : observance en anglais`);
  const cleEn = d => d.doc.flags?.["lakour-fenoir-en"]?.cle ?? d.doc.flags?.["lakour-fenoir"]?.cle;
  const tableEn = anglais.find(d => d.pack === "tables" && cleEn(d) === "porte-refuse").doc;
  assert.equal(tableEn.name, "The door — what the one turned away says");
  assert.ok(tableEn.results.some(r => /<em>Mi konpran\.<\/em>.*\(I understand\.\)/.test(r.description)), "créole en italique, sens à côté");
  const guideEn = anglais.find(d => d.pack === "guides" && cleEn(d) === "guide-du-joueur").doc;
  assert.ok(guideEn.pages.some(p => p.name === "Mind over body"));
  const ev = EN.evenements.find(e => e.cle === "la-porte-en-debat");
  assert.ok(/<em>nou nana pa asé pou nou mèm<\/em>.*\(we don't have enough for ourselves\)/.test(ev.texte));
  // Mêmes clés, mêmes nombres que le français.
  assert.deepEqual(EN.religions.map(r => [r.cle, r.poids, r.observance?.besoin ?? null, r.fetes]), D.religions.map(r => [r.cle, r.poids, r.observance?.besoin ?? null, r.fetes]));
});
