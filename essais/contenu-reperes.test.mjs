// Le contenu du lot « cartes » (2026-11-17) dans lakour-fenoir et sa traduction : les cartes, les calendriers et la montre à trouver
// (forme, lieux, chances), les quatre fabrications et leurs recettes, les deux tables du MJ, le journal du MJ « Le jour qu'on croit »,
// la page du guide du joueur ; tout est en anglais dans lakour-fenoir-en ; les chiffres du journal sont ceux de la logique ; le
// fabricant refuse un repère mal formé.   Lancer : npm run essais
import { test } from "node:test";
import assert from "node:assert/strict";
import { fabriquer, fabriquerAnglais, lireDictionnaires, verifierDonnees } from "../outils/fabriquer-fenoir.mjs";
import { donnees } from "../modules/lakour-fenoir/contenu/index.mjs";
import { EQUIPEMENTS_REPERES, RECETTES_REPERES, TABLES_REPERES, JOURNAL_REPERES, PAGES_JOUEUR_REPERES } from "../modules/lakour-fenoir/contenu/reperes.mjs";
import { MODULE, sansBalises } from "../modules/lakour-fenoir/contenu/aides.mjs";
import * as L from "../systems/lakour-survie/logique/index.mjs";

const D = donnees();
const docs = fabriquer();
const { documents: anglais, registre: EN } = fabriquerAnglais(docs, D, lireDictionnaires().dictionnaire);
const cleDe = d => d.doc.flags?.[MODULE]?.cle ?? d.doc.flags?.[`${MODULE}-en`]?.cle;
const FRANCAIS = /\b(le|la|les|des|une|du|qu'on|est|sont|avec|dans|pour)\b/i;

test("registre : les repères (6 cartes, 5 calendriers, la montre, 4 fabrications, la copie), bien formés, catégorie « repere », trouvés où il faut", () => {
  const reperes = D.equipements.filter(e => e.repere);
  assert.equal(reperes.length, EQUIPEMENTS_REPERES.length);
  assert.equal(reperes.length, 17);
  for (const e of reperes) {
    assert.equal(e.categorie, "repere", e.cle);
    assert.deepEqual(L.erreursRepere(e, D), [], e.cle);
    assert.ok(sansBalises(e.description).length > 60, e.cle);
  }
  assert.deepEqual(verifierDonnees(D), []);
  // Où l'on en trouve : la carte de randonnée dans les gîtes et les îlets, les marées dans les phares, rien dans un tunnel de lave.
  const ou = cle => D.equipements.find(e => e.cle === cle).repere.lieux;
  assert.ok(ou("carte-de-randonnee").gite > 0 && ou("carte-de-randonnee").ilet > 0);
  assert.equal(ou("calendrier-des-marees-et-des-lunes").phare, 0.1);
  assert.equal(L.chanceRepere(D, "tunnel-de-lave"), 0);
  // Chaque site de l'île a un type que les repères connaissent.
  for (const s of D.sites) assert.ok(L.LIEUX_REPERE.includes(s.type), `${s.cle} : ${s.type}`);
  // Le fabricant refuse un repère mal formé.
  const mauvais = structuredClone(D);
  mauvais.equipements.find(e => e.cle === "carte-ancienne").repere.notes.atlantide = "…";
  mauvais.equipements.find(e => e.cle === "calendrier-des-postes").repere.lieux.region = 0.5;
  const erreurs = verifierDonnees(mauvais);
  assert.ok(erreurs.some(x => /atlantide/.test(x)) && erreurs.some(x => /calendrier-des-postes/.test(x)), erreurs.join(" ; "));
});

test("recettes : la planche des jours, le cadran solaire, l'encre de suie, le cahier cousu ; sans savoir ni atelier", () => {
  assert.equal(RECETTES_REPERES.length, 4);
  for (const r of RECETTES_REPERES) {
    const def = D.recettes.find(x => x.cle === r.system.cle);
    assert.ok(def && D.equipements.some(e => e.cle === def.produit.equipement && e.repere), r.name);
    assert.deepEqual(def.requiert, { savoirs: [], installation: null });
    assert.ok(def.travail >= 1 && def.travail <= 2);
  }
  assert.equal(D.recettes.find(r => r.cle === "encre-de-suie").produit.n, 2);
  assert.equal(D.recettes.find(r => r.cle === "cadran-solaire").difficulte, "difficile");
});

test("tables, journal du MJ « Le jour qu'on croit », page du guide du joueur ; les chiffres sont ceux de la logique", () => {
  assert.equal(TABLES_REPERES.length, 2);
  for (const t of TABLES_REPERES) {
    const d = docs.find(x => x.pack === "tables" && x.doc._id === t._id);
    assert.ok(d && t.results.length >= 6 && t.flags[MODULE].reperes, t.name);
  }
  const j = docs.find(x => x.pack === "mj" && cleDe(x) === "le-jour-qu-on-croit");
  assert.ok(j && j.doc._id === JOURNAL_REPERES._id);
  assert.equal(j.doc.ownership.default, 0, "réservé au MJ");
  assert.equal(j.doc.pages.length, 9);
  const texte = sansBalises(j.doc.pages.map(p => p.text.content).join(" "));
  const R = L.REGLES_COMPTE;
  assert.ok(texte.includes(`${R.encoches[""]} jours`) && texte.includes(`${R.encoches.planche} jours`));
  assert.ok(texte.includes(`${Math.round(R.oubli * 100)} %`) && texte.includes(`${Math.round(R.deuxFois * 100)} %`));
  assert.ok(texte.includes(`à ${R.lune.marge} jours près`) && texte.includes(`à ${R.lune.margeMarees} jour près`));
  assert.ok(texte.includes(L.soleilDuMois(1).lever) && texte.includes(L.soleilDuMois(7).coucher));
  assert.ok(texte.includes("Ladi Lafé") && texte.includes("mentir"));
  const guide = docs.find(x => x.pack === "guides" && cleDe(x) === "guide-du-joueur").doc;
  const page = guide.pages.find(p => p.name === PAGES_JOUEUR_REPERES[0].titre);
  assert.ok(page && (page.text.content.match(/<blockquote>/g) ?? []).length === 2);
});

test("anglais : les repères, les recettes, les tables, le journal et la page du guide sont traduits ; le registre anglais garde les mêmes repères", () => {
  for (const e of D.equipements.filter(x => x.repere)) {
    const en = EN.equipements.find(x => x.cle === e.cle);
    assert.ok(en && en.nom !== e.nom && !FRANCAIS.test(en.nom), `${e.cle} : ${en?.nom}`);
    assert.notEqual(en.description, e.description);
    assert.deepEqual(L.erreursRepere(en, EN), [], e.cle);
    assert.deepEqual({ ...en.repere, notes: undefined, annotations: undefined }, { ...e.repere, notes: undefined, annotations: undefined }, "mêmes chiffres");
    for (const [k, n] of Object.entries(en.repere.notes ?? {})) assert.notEqual(n, e.repere.notes[k], `${e.cle} : note ${k}`);
    for (const [i, a] of (en.repere.annotations ?? []).entries()) assert.ok(a.texte !== e.repere.annotations[i].texte && !a.texte.includes("«"), `${e.cle} : annotation ${i}`);
  }
  const doc = (pack, cle) => anglais.find(x => x.pack === pack && cleDe(x) === cle)?.doc;
  assert.equal(doc("mj", "le-jour-qu-on-croit").name, "The day we believe it is");
  assert.equal(doc("tables", "le-jour-qu-on-vous-donne").name, "The day you are given");
  assert.equal(doc("tables", "ce-qu-un-mort-a-ecrit-sur-sa-carte").name, "What a dead man wrote on his map");
  const mj = doc("mj", "le-jour-qu-on-croit").pages.map(p => p.text.content).join(" ");
  assert.ok(/the Pallid/.test(mj) && /the Grey/.test(mj) && !/\bLivides?\b/.test(mj));
  assert.ok(doc("guides", "guide-du-joueur").pages.some(p => p.name === "The day we believe it is, maps and calendars"));
  for (const r of RECETTES_REPERES) assert.ok(!FRANCAIS.test(EN.recettes.find(x => x.cle === r.system.cle).nom), r.name);
});
