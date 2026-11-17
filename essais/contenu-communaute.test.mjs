// Le contenu du lot 10 (contrat §22) dans lakour-fenoir et sa traduction : la liste commune des religions (les clés du jeu 3D, les
// anciennes en alias, les fêtes de chacune, une phrase d'histoire pour chacune), les vingt-six corvées, le barème des objets, les
// deux tables du MJ, les pages des guides ; tout est en anglais dans lakour-fenoir-en.   Lancer : npm run essais
import { test } from "node:test";
import assert from "node:assert/strict";
import { fabriquer, fabriquerAnglais, lireDictionnaires, verifierDonnees } from "../outils/fabriquer-fenoir.mjs";
import { donnees } from "../modules/lakour-fenoir/contenu/index.mjs";
import { CORVEES, BAREME, TABLES_COMMUNAUTE } from "../modules/lakour-fenoir/contenu/communaute.mjs";
import { sansBalises } from "../modules/lakour-fenoir/contenu/aides.mjs";
import * as L from "../systems/lakour-survie/logique/index.mjs";

const D = donnees();
const docs = fabriquer();
const { documents: anglais, registre: EN } = fabriquerAnglais(docs, D, lireDictionnaires().dictionnaire);
const ACCENTS = /[àâéèêëîïôûùç]/i;

test("la liste commune des religions : les clés du jeu 3D, plus le servis kabaré ; chaque ancienne clé de FVTT en alias ; une phrase d'histoire pour chacune", () => {
  assert.deepEqual(D.religions.map(r => r.cle), ["catholique", "hindoue", "hindoue-catholique", "musulmane", "protestante", "bouddhiste", "servis-kabare", "aucune", "plusieurs"]);
  assert.deepEqual(D.religions.flatMap(r => r.alias ?? []).sort(), ["ancetres-malgaches", "culte-chinois", "evangelique", "hindouisme-tamoul", "islam"]);
  assert.deepEqual(D.religions.find(r => r.cle === "hindoue-catholique").composee, ["catholique", "hindoue"]);
  assert.deepEqual(verifierDonnees(D).filter(e => /religion|corv|barème/.test(e)), []);
  // Chaque religion (et « aucune », « plusieurs ») a ses phrases d'histoire, sous sa clé d'aujourd'hui.
  const pour = new Set(D.histoires.filter(g => g.type === "religion").flatMap(g => g.pour));
  for (const r of D.religions) assert.ok(pour.has(r.cle), r.cle);
  // Les prétirés, les gens du marché et les gramounes portent les clés d'aujourd'hui.
  const vieilles = new Set(D.religions.flatMap(r => r.alias ?? []));
  const esprits = [...D.marchands.map(m => m.esprit), ...D.gramounes.map(g => g.esprit), ...docs.filter(d => d.pack === "survivants").map(d => d.doc.system)];
  for (const e of esprits) assert.ok(!vieilles.has(e.religion) && !(e.religions ?? []).some(r => vieilles.has(r)), JSON.stringify(e.religion));
});

test("les corvées : vingt-six, aux treize tâches ; le barème des objets en parts ; les tables et les pages du lot", () => {
  assert.equal(CORVEES.length, 26);
  assert.deepEqual(L.verifierCorvees(D), []);
  assert.deepEqual([...new Set(CORVEES.map(c => c.tache))].sort(), ["atelier", "chantier", "cuisine", "cultures", "eau", "elevage", "fouille", "garde", "soins"]);
  assert.ok(CORVEES.every(c => c.description.length > 10));
  assert.deepEqual(D.bareme, BAREME);
  assert.equal(BAREME.objets["fusil-de-chasse"], 20, "40 au barème du jeu 3D, une part = 2");
  for (const k of ["fusil-de-chasse", "carabine-22", "pistolet-de-service", "tronconneuse"]) assert.ok(D.equipements.some(e => e.cle === k), k);
  const tables = docs.filter(d => d.pack === "tables").map(d => d.doc.flags["lakour-fenoir"].cle);
  for (const t of TABLES_COMMUNAUTE) assert.ok(tables.includes(t.flags["lakour-fenoir"].cle));
  const guide = docs.find(d => d.pack === "guides" && d.doc.flags["lakour-fenoir"].cle === "guide-du-joueur").doc;
  const mj = docs.find(d => d.pack === "mj" && d.doc.flags["lakour-fenoir"].cle === "guide-du-mj").doc;
  assert.ok(guide.pages.some(p => p.flags?.["lakour-fenoir"]?.cle === "table-de-gestion"));
  const page = mj.pages.find(p => p.flags?.["lakour-fenoir"]?.cle === "table-de-gestion-et-marche");
  const texte = sansBalises(page.text.content);
  assert.ok(/partir.*fuir.*écouter.*boire.*manger.*dormir.*faire sa tâche.*errer/.test(texte), "la liste de priorités d'un PNJ croisé");
  assert.ok(/sans jamais le punir/.test(texte) && /Aucune religion n'a d'effet propre/.test(texte));
});

test("traduction : religions, corvées, tables et pages du lot 10 en anglais ; mêmes clés et mêmes nombres", () => {
  const nom = (l, cle) => l.find(x => x.cle === cle)?.nom;
  assert.deepEqual(["hindoue", "hindoue-catholique", "musulmane", "protestante", "bouddhiste"].map(k => nom(EN.religions, k)), ["Hindu", "Hindu Catholic", "Muslim", "Protestant", "Buddhist"]);
  assert.equal(nom(EN.religions, "servis-kabare"), "Servis kabaré", "le nom créole du culte reste");
  assert.deepEqual(EN.religions.map(r => [r.cle, r.poids, r.alias ?? [], r.composee ?? []]), D.religions.map(r => [r.cle, r.poids, r.alias ?? [], r.composee ?? []]));
  assert.deepEqual(EN.corvees.map(c => [c.cle, c.tache]), D.corvees.map(c => [c.cle, c.tache]));
  for (const c of EN.corvees) assert.ok(!ACCENTS.test(`${c.nom} ${c.description}`.replace(/brèdes|boucané|gramoune|zerbaz/g, "")), c.cle);
  assert.deepEqual(EN.bareme, D.bareme);
  const cleEn = d => d.doc.flags?.["lakour-fenoir-en"]?.cle ?? d.doc.flags?.["lakour-fenoir"]?.cle;
  const depart = anglais.find(d => d.pack === "tables" && cleEn(d) === "depart-prepare").doc;
  assert.equal(depart.name, "Community — the prepared departure");
  assert.equal(depart.results.length, 8);
  const mjEn = anglais.find(d => d.pack === "mj" && cleEn(d) === "guide-du-mj").doc;
  assert.ok(mjEn.pages.some(p => p.name === "Running the management table, the priced market and the door"));
  const guideEn = anglais.find(d => d.pack === "guides" && cleEn(d) === "guide-du-joueur").doc;
  const religions = guideEn.pages.find(p => /Religions and anchors|religions/i.test(p.name) && /Hindu Catholic/.test(p.text.content));
  assert.ok(religions, "la page des religions en anglais, avec la liste commune");
});
