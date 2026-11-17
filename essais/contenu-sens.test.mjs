// Le contenu du lot « sens » (2026-11-17) dans lakour-fenoir et sa traduction : les pluies d'une année des seize régions, la ravine
// temporaire de la Grande Chaloupe, la perception des Livides, l'odeur des installations, le bruit de l'instrument, les tables de la
// nuit, le journal du MJ « Percevoir dans le noir », la page du guide du joueur et celle du livre de l'île ; tout est en anglais
// dans lakour-fenoir-en, avec le créole et son sens ; les chiffres du journal sont ceux de la logique.   Lancer : npm run essais
import { test } from "node:test";
import assert from "node:assert/strict";
import { fabriquer, fabriquerAnglais, lireDictionnaires, verifierDonnees } from "../outils/fabriquer-fenoir.mjs";
import { donnees } from "../modules/lakour-fenoir/contenu/index.mjs";
import { TABLES_SENS, JOURNAL_SENS, pluieDeRegion, chanceParQuart } from "../modules/lakour-fenoir/contenu/sens.mjs";
import { MODULE, sansBalises } from "../modules/lakour-fenoir/contenu/aides.mjs";
import * as L from "../systems/lakour-survie/logique/index.mjs";

const D = donnees();
const docs = fabriquer();
const { documents: anglais, registre: EN } = fabriquerAnglais(docs, D, lireDictionnaires().dictionnaire);
const cleDe = d => d.doc.flags?.[MODULE]?.cle ?? d.doc.flags?.[`${MODULE}-en`]?.cle;

test("registre : seize régions avec leurs pluies, la ravine temporaire, la perception de chaque Livide, l'odeur, l'instrument", () => {
  assert.equal(D.regions.length, 16);
  for (const r of D.regions) assert.ok(r.climat.pluieAn.bas > 0 && r.climat.pluieAn.hauts > r.climat.pluieAn.bas, r.cle);
  assert.ok(D.regions.find(r => r.cle === "est").climat.pluieAn.hauts > D.regions.find(r => r.cle === "saint-paul").climat.pluieAn.hauts * 4, "l'Est bien plus arrosé que l'Ouest");
  const temporaires = D.sites.filter(s => s.ravine === "temporaire");
  assert.deepEqual(temporaires.map(s => s.cle), ["lazaret-de-la-grande-chaloupe"]);
  assert.ok(temporaires.every(s => s.eau === "riviere"));
  for (const b of D.bestiaire.filter(x => x.categorie === "livide")) assert.ok(b.perception && b.perception.vue >= 0 && b.perception.ouie > 0, b.cle);
  assert.equal(D.bestiaire.find(b => b.cle === "livide-des-hauts").perception.odorat, 0, "pas d'odorat");
  assert.equal(D.bestiaire.find(b => b.cle === "livide-des-hauts").perception.froid, true);
  assert.equal(D.bestiaire.find(b => b.cle === "livide-brule").perception.vue, 0, "aveugle");
  assert.equal(D.bestiaire.find(b => b.cle === "coureur").perception.attaques, 2);
  const odeur = cle => D.installations.find(i => i.cle === cle).niveaux.map(n => n.effets.odeur ?? 0);
  assert.deepEqual(odeur("basse-cour"), [1, 1]);
  assert.deepEqual(odeur("enclos-a-cabris"), [1, 1]);
  assert.deepEqual(odeur("sechoir-fumoir"), [1]);
  assert.deepEqual(odeur("cuisine-commune"), [1]);
  assert.deepEqual(odeur("gaziniere"), [0], "la gazinière cuit sans fumée");
  assert.equal(D.ancrages.find(a => a.cle === "musique").bruit, 1);
  assert.deepEqual(verifierDonnees(D), []);
  // Le système les lit : pluies, perception.
  assert.equal(L.pluieAnnuelle(D.regions.find(r => r.cle === "est"), { hauts: true }), 7000);
  assert.ok(L.perceptionDe(D, "coureur"));
});

test("tables de la nuit, journal du MJ « Percevoir dans le noir », page du guide du joueur et du livre de l'île", () => {
  assert.equal(TABLES_SENS.length, 7);
  for (const t of TABLES_SENS) {
    const d = docs.find(x => x.pack === "tables" && x.doc._id === t._id);
    assert.ok(d && t.results.length >= 8 && t.flags[MODULE].sens, t.name);
  }
  const j = docs.find(x => x.pack === "mj" && cleDe(x) === "percevoir-dans-le-noir");
  assert.ok(j, "journal du MJ");
  assert.equal(j.doc.ownership.default, 0, "réservé au MJ");
  assert.equal(j.doc.pages.length, 11);
  const texte = j.doc.pages.map(p => sansBalises(p.text.content)).join(" ");
  for (const mot of ["10 m", "270 m", "chuchoter 3 m", "150 m", "400 m", "18 %", "Figé", "Errant", "Intrigué", "En poursuite", "Acharné", "2 nuits", "30 nuits", "7 % par jour", "maloya", "Timise", "Granmèr Kal"]) {
    assert.ok(texte.includes(mot), mot);
  }
  const guide = docs.find(x => x.pack === "guides" && cleDe(x) === "guide-du-joueur").doc;
  assert.ok(guide.pages.some(p => p.name === "La nuit, le vent et la pluie"));
  const livre = docs.find(x => x.pack === "guides" && cleDe(x) === "livre-de-l-ile").doc;
  const page = livre.pages.find(p => p.name === "La nuit et ses voix");
  assert.ok(page && /<blockquote>/.test(page.text.content), "des carnets de survivants");
  assert.ok(/C'est un oiseau/.test(sansBalises(j.doc.pages.find(p => p.name.startsWith("Les signes")).text.content)), "le jeu ne confirme aucun esprit");
});

test("les chiffres du journal sont ceux de la logique (pluie par quart et par saison de chaque région)", () => {
  for (const r of D.regions) {
    assert.equal(pluieDeRegion(r), L.pluieAnnuelle(r), r.cle);
    for (const saison of ["pluies", "seche"]) assert.ok(Math.abs(chanceParQuart(pluieDeRegion(r), saison) - L.chanceDePluie(L.pluieAnnuelle(r), saison)) < 1e-9, `${r.cle} ${saison}`);
  }
  const page = JOURNAL_SENS.pages.find(p => p.name === "La pluie, la brume et les ravines");
  const est = D.regions.find(r => r.cle === "est");
  assert.ok(page.text.content.includes(`${Math.round(L.chanceDePluie(L.pluieAnnuelle(est), "pluies") * 100)} %`));
});

test("traduction : tables, journal, pages et bestiaire en anglais ; le créole reste, avec son sens ; aucun « Livide »", () => {
  const cleEn = d => d.doc.flags?.["lakour-fenoir-en"]?.cle ?? d.doc.flags?.["lakour-fenoir"]?.cle;
  const contes = anglais.find(d => d.pack === "tables" && cleEn(d) === "contes-des-anciens").doc;
  assert.equal(contes.name, "The old people's tales");
  assert.ok(contes.results.some(r => /<em>Siffle pa la nuit\.<\/em>.*\(Don't whistle at night\.\)/.test(r.description)));
  assert.ok(contes.results.some(r => /<em>Ravine i na faim\.<\/em>.*\(The ravine is hungry\.\)/.test(r.description)));
  const j = anglais.find(d => d.pack === "mj" && cleEn(d) === "percevoir-dans-le-noir").doc;
  assert.equal(j.name, "Perceiving in the dark");
  const toutEn = [j, ...TABLES_SENS.map(t => anglais.find(d => d.pack === "tables" && d.doc._id === t._id).doc)].map(d => JSON.stringify(d)).join(" ");
  assert.ok(!/Livide/.test(toutEn), "« the Pallid », jamais « Livide »");
  assert.ok(!/[àâéèêîôûç]{2,}| la nuit | les | des /.test(sansBalises(j.pages.map(p => p.text.content).join(" ")).replace(/Siffle pa la nuit|Granmèr Kal|Ravine i na faim|séga|roulèr|Réunion|Grande Chaloupe|Hauts de Saint-Paul|Plaine des \w+/g, "")), "plus de français dans le journal");
  const guide = anglais.find(d => d.pack === "guides" && cleEn(d) === "guide-du-joueur").doc;
  assert.ok(guide.pages.some(p => p.name === "Night, wind and rain"));
  const livre = anglais.find(d => d.pack === "guides" && cleEn(d) === "livre-de-l-ile").doc;
  assert.ok(livre.pages.some(p => p.name === "The night and its voices"));
  const brule = EN.bestiaire.find(b => b.cle === "livide-brule");
  assert.equal(brule.sens, "sharp hearing, smell");
  assert.deepEqual(brule.perception, D.bestiaire.find(b => b.cle === "livide-brule").perception, "mêmes nombres");
  assert.deepEqual(EN.regions.map(r => r.climat.pluieAn), D.regions.map(r => r.climat.pluieAn));
});
