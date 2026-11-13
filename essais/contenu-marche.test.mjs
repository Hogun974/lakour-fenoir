// Le contenu du marché (modules/lakour-fenoir/contenu/marche.mjs, evenements.mjs, tables.mjs, journaux.mjs) et sa traduction :
// - les gens du marché viennent de toutes les communautés, aucun rôle réservé ; chacun porte ses préjugés (chacun en a sur chacun) ;
// - chaque préjugé dit au marché (le tableau du complément : boutiquier chinois, Zoreil, Yab, commerçant z'arabe, tisaneuse
//   malbare, derniers arrivés, rengaine sur les Cafres, gros blanc) est démenti par un événement de marché ;
// - la rengaine raciste n'est jamais dite par le narrateur : elle est toujours nommée comme une rengaine, dans une bouche ;
// - le cours des textes est celui de la logique ; foires, marchés, PNJ existants cohérents ;
// - l'anglais : rien ne reste en français, le créole est gardé tel quel avec son sens.
// Aucun réseau.  Lancer : npm run essais
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { REGLES_MARCHE } from "../systems/lakour-survie/logique/marche.mjs";
import { COMMUNAUTES, MARCHANDS, MARCHES, FOIRES, COURS_TEXTE } from "../modules/lakour-fenoir/contenu/marche.mjs";
import { EVENEMENTS } from "../modules/lakour-fenoir/contenu/evenements.mjs";
import { SURVIVANTS } from "../modules/lakour-fenoir/contenu/survivants.mjs";
import { DOCUMENTS, donnees } from "../modules/lakour-fenoir/contenu/index.mjs";
import { sansBalises } from "../modules/lakour-fenoir/contenu/aides.mjs";

const RACINE = new URL("../", import.meta.url);
const D = donnees();
const cibles = new Set(COMMUNAUTES.map(c => c.cle));
const evenementsMarche = EVENEMENTS.filter(e => e.type === "marche");

test("gens du marché : toutes les communautés, aucun rôle réservé ni en double, chacun ses préjugés (cibles connues, 1 à 3)", () => {
  const origines = new Set(MARCHANDS.map(m => m.communaute));
  for (const c of ["chinois", "zoreils", "yabs", "zarabes", "malbars", "comoriens", "cafres", "gros-blancs", "malgaches", "metis"]) assert.ok(origines.has(c), c);
  assert.equal(new Set(MARCHANDS.map(m => m.role)).size, MARCHANDS.length, "un rôle par personne");
  for (const m of MARCHANDS) {
    assert.ok(m.prejuges.length >= 1, `${m.cle} : chacun en a sur chacun`);
    for (const p of m.prejuges) {
      assert.ok(cibles.has(p.cible), `${m.cle} : cible ${p.cible}`);
      assert.ok(p.poids >= 1 && p.poids <= 3 && p.dit, m.cle);
      assert.notEqual(p.cible, m.communaute, `${m.cle} : un préjugé sur d'autres que les siens, ici`);
    }
    assert.ok(m.onDit && m.dementi && m.apparence, m.cle);
    // Aucune règle attachée à une origine : un marchand n'a pas d'effet chiffré.
    for (const k of Object.keys(m)) assert.ok(["cle", "nom", "communaute", "role", "region", "apparence", "description", "prejuges", "onDit", "dementi", "evenement", "esprit"].includes(k), `${m.cle} : champ ${k}`);
  }
  // Les registres le portent tel quel.
  assert.equal(D.marchands.length, MARCHANDS.length);
  assert.equal(D.communautes.length, COMMUNAUTES.length);
});

test("chaque préjugé du tableau du marché est démenti par un événement de marché, joué devant tous", () => {
  const dementis = new Map(evenementsMarche.filter(e => e.effets.dementi).map(e => [e.effets.dementi, e]));
  for (const c of ["chinois", "zoreils", "yabs", "zarabes", "malbars", "comoriens", "cafres", "gros-blancs"]) {
    const e = dementis.get(c);
    assert.ok(e, `démenti manquant : ${c}`);
    assert.ok(sansBalises(e.texte).length > 300, `${e.cle} : une vraie scène`);
  }
  for (const m of MARCHANDS) assert.ok(evenementsMarche.some(e => e.cle === m.evenement), `${m.cle} : son événement`);
  // Le carnet de la boutique du camp existe déjà : le carnet du marché est une autre scène.
  const camp = EVENEMENTS.find(e => e.cle === "carnet-de-la-boutique");
  const marche = EVENEMENTS.find(e => e.cle === "marche-le-carnet-ouvert");
  assert.ok(camp && marche && camp.type === "abri" && marche.type === "marche");
  assert.notEqual(sansBalises(camp.texte), sansBalises(marche.texte));
});

test("la rengaine raciste sur les Cafres n'est jamais dite par le narrateur : toujours nommée comme une rengaine, et contredite", () => {
  const textes = [...DOCUMENTS.map(d => JSON.stringify(d)), JSON.stringify(D)].join(" ");
  for (const m of textes.matchAll(/paress/giu)) {
    const avant = textes.slice(Math.max(0, m.index - 80), m.index);
    assert.match(avant, /rengaine/iu, `« paresse » hors d'une rengaine nommée : …${avant}`);
  }
  const porteur = EVENEMENTS.find(e => e.cle === "marche-le-porteur-du-cirque");
  assert.match(sansBalises(porteur.texte), /répond devant tout le marché/);
});

test("créole : chaque parole en créole est en italique, suivie de son sens entre parenthèses", () => {
  const dits = [...MARCHANDS.flatMap(m => [...m.prejuges.map(p => p.dit), m.onDit]), ...SURVIVANTS.flatMap(s => (s.system.prejuges ?? []).map(p => p.dit))];
  for (const d of dits) {
    if (!/\*[^*]+\*/.test(d)) continue;
    assert.match(d, /\*[^*]+\*[^(]*\([^)]+\)/u, `sens manquant : ${d}`);
  }
});

test("cours, foires, marchés : le cours des textes est celui de la logique ; régions, mois, jours, bastions connus", () => {
  assert.deepEqual(COURS_TEXTE, REGLES_MARCHE.cours.base);
  const regions = new Set(D.regions.map(r => r.cle)), factions = new Set(D.factions.map(f => f.cle));
  for (const f of FOIRES) assert.ok(regions.has(f.region) && f.mois >= 1 && f.mois <= 12 && f.recolte, f.cle);
  assert.ok(FOIRES.some(f => f.cle === "foire-des-lentilles" && f.region === "cilaos" && f.mois === 10), "les lentilles de Cilaos en octobre");
  for (const m of MARCHES) {
    assert.ok(regions.has(m.region) && m.jourSemaine >= 0 && m.jourSemaine <= 6, m.cle);
    for (const b of m.bastions) assert.ok(factions.has(b), `${m.cle} : ${b}`);
  }
  // Le troc du samedi de la Coopérative (factions.mjs, reputations.mjs) est bien un samedi.
  assert.equal(MARCHES.find(m => m.cle === "marche-de-bourg-murat").jourSemaine, 6);
});

test("PNJ existants : leurs préjugés reprennent leurs notes ; tous les acteurs ont le champ, vide par défaut", () => {
  const acteurs = DOCUMENTS.filter(d => d.type === "survivant");
  for (const a of acteurs) assert.ok(Array.isArray(a.system.prejuges), a.name);
  const avec = acteurs.filter(a => a.system.prejuges.length);
  assert.deepEqual(avec.map(a => a.flags["lakour-fenoir"].cle).sort(), ["ancienne-de-la-nouvelle", "memee-lucette", "patron-grondin"]);
  for (const a of avec) for (const p of a.system.prejuges) {
    assert.ok(cibles.has(p.cible), `${a.name} : ${p.cible}`);
    assert.deepEqual([p.echanges, p.fetes, p.dementis], [0, 0, 0]);
  }
  assert.ok(!acteurs.some(a => a.flags["lakour-fenoir"].pretire && a.system.prejuges.length), "les prétirés n'ont pas de préjugé imposé : c'est au joueur");
  for (const e of DOCUMENTS.filter(d => d.type === "equipement")) assert.equal(e.system.marque, "", `${e.name} : pas marqué au compendium`);
});

test("journaux : une page du guide du MJ sur le marché, une page du guide du joueur, le journal du marché complet", () => {
  const journal = cle => DOCUMENTS.find(d => d.flags?.["lakour-fenoir"]?.cle === cle);
  const mj = journal("guide-du-mj");
  assert.ok(mj.pages.some(p => p.flags?.["lakour-fenoir"]?.cle === "marche"));
  const joueur = journal("guide-du-joueur");
  assert.ok(joueur.pages.some(p => p.flags?.["lakour-fenoir"]?.cle === "troquer"));
  const lm = journal("le-marche-et-le-ladi-lafe");
  assert.equal(lm.ownership.default, 0, "journal du MJ, caché aux joueurs");
  const cles = lm.pages.map(p => p.flags["lakour-fenoir"].cle);
  for (const k of ["stades", "boutique", "forain", "foires", "cours", "prejuges", "gens", "ladi-lafe", "marques", "oratoires", "evenements"]) assert.ok(cles.includes(k), k);
  const page = cle => sansBalises(lm.pages.find(p => p.flags["lakour-fenoir"].cle === cle).text.content);
  for (const m of MARCHANDS) assert.ok(page("gens").includes(m.nom), m.nom);
  for (const [r, v] of Object.entries(COURS_TEXTE)) assert.match(page("cours"), new RegExp(`: ${v}`), r);
  assert.doesNotMatch(page("gens"), / ,/, "pas d'espace avant une virgule");
});

test("traduction : le marché est en anglais dans le registre et les compendiums ; le créole y reste tel quel", () => {
  const fichier = new URL("modules/lakour-fenoir-en/assets/donnees.json", RACINE);
  if (!existsSync(fichier)) return;
  const en = JSON.parse(readFileSync(fichier, "utf8"));
  const creole = s => [...String(s).matchAll(/\*([^*]+)\*/g)].map(m => m[1]);
  for (const m of en.marchands) {
    const fr = D.marchands.find(x => x.cle === m.cle);
    assert.notEqual(m.role, fr.role, `${m.cle} : rôle traduit`);
    assert.notEqual(m.dementi, fr.dementi, `${m.cle} : démenti traduit`);
    m.prejuges.forEach((p, i) => assert.deepEqual(creole(p.dit), creole(fr.prejuges[i].dit), `${m.cle} : le créole reste`));
    assert.deepEqual(creole(m.onDit), creole(fr.onDit));
  }
  for (const c of en.communautes) assert.ok(c.nom && c.description, c.cle);
  assert.ok(en.communautes.some(c => c.cle === "zoreils" && c.nom === "Zoreils"), "les noms de communautés restent créoles");
  for (const e of en.evenements.filter(x => x.type === "marche")) {
    const fr = D.evenements.find(x => x.cle === e.cle);
    assert.notEqual(e.texte, fr.texte, `${e.cle} : texte encore en français`);
    assert.notEqual(e.nom, fr.nom, `${e.cle} : nom encore en français`);
    const em = h => [...String(h).matchAll(/<em>([^<]+)<\/em>/g)].map(m => m[1]);
    assert.deepEqual(em(e.texte), em(fr.texte), `${e.cle} : le créole reste`);
  }
  for (const f of en.foires) assert.doesNotMatch(f.nom, /^La foire/u, f.cle);
});
