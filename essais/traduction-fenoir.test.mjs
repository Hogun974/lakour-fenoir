// Module anglais lakour-fenoir-en (outils/fabriquer-fenoir.mjs --langue en, dictionnaires modules/lakour-fenoir/contenu/en/*.json,
// outil commun modules/lakour-mj-ia/outils/traduction.mjs) :
// - mêmes documents et mêmes _id (et _key) que le module français, pack par pack ;
// - aucun uuid, chemin d'image ni portée de drapeaux vers « lakour-fenoir » sans « -en » ; chaque uuid récrit vise un document
//   du module anglais ;
// - les dictionnaires sont à jour (aucune entrée obsolète), complets (aucun texte encore en français) et chaque traduction
//   garde les balises, liens et jets du français ; aucun terme interdit en anglais ;
// - le REGISTRE anglais (assets/donnees.json) : mêmes clés et mêmes nombres que le français, textes anglais, chemins d'images
//   récrits ; il passe la vérification du contenu (fabricant) et celle du système lakour-survie (verifierContenu) ; une
//   simulation de 200 jours du système sur le registre anglais donne le même monde que sur le français (les textes mis à part) ;
// - le glossaire : les Livides sont « the Pallid », le Gris « the Grey », les dix compétences portent les noms du système
//   (lang/en.json de lakour-survie) ; les lieux réels de La Réunion restent en français ;
// - le manifeste anglais : identifiant, conflit avec le module français, étiquettes traduites ;
// - scripts/identite.js lit l'identifiant du module dans son adresse ;
// - sur le disque, si `npm run fabriquer-fenoir-en` a tourné : le contrat des modules de contenu est respecté, plans.json est traduit.
// Aucun réseau.  Lancer : npm run essais
import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
import {
  MODULE_EN, OPTIONS_TRADUCTION, PACK_REGISTRE, TYPE_PACK, extraireTout, fabriquer, fabriquerAnglais, lireDictionnaires, manifesteAnglais,
  traduireFigurants, verifierDocuments, verifierDonnees
} from "../outils/fabriquer-fenoir.mjs";
import { donnees } from "../modules/lakour-fenoir/contenu/index.mjs";
import { COMPETENCES, MODULE } from "../modules/lakour-fenoir/contenu/aides.mjs";
import { ecartsBalises } from "../modules/lakour-mj-ia/outils/traduction.mjs";
import { verifierModuleDeContenu } from "../modules/lakour-mj-ia/outils/contrat-contenu.mjs";
import { verifierContenu } from "../systems/lakour-survie/logique/contenu.mjs";
import { L, partie } from "./doublures/survie-outils.mjs";

const M = MODULE;
const RACINE_EN = new URL(`../modules/${MODULE_EN}/`, import.meta.url);
const francais = fabriquer();
const registreFr = donnees();
const { dictionnaire, packs } = lireDictionnaires();
const { documents: anglais, registre: registreEn, rapport } = fabriquerAnglais(francais, registreFr, dictionnaire);
const texteAnglais = JSON.stringify(anglais.map(d => d.doc));
const texteRegistreEn = JSON.stringify(registreEn);

// Tous les _id d'un document, à toute profondeur.
const ids = v => (Array.isArray(v) ? v.flatMap(ids) : v && typeof v === "object" ? [...(typeof v._id === "string" ? [v._id] : []), ...Object.values(v).flatMap(ids)] : []);
// Les feuilles d'un objet qui ne sont pas des chaînes (nombres, booléens, null), avec leur chemin : la « mécanique » du registre.
const nombres = (v, chemin = "") => {
  if (Array.isArray(v)) return v.flatMap((x, i) => nombres(x, `${chemin}.${i}`));
  if (v && typeof v === "object") return Object.entries(v).flatMap(([k, x]) => nombres(x, `${chemin}.${k}`));
  return typeof v === "string" ? [] : [`${chemin}=${v}`];
};
const cles = v => (Array.isArray(v) ? v.flatMap(cles) : v && typeof v === "object" ? [...(typeof v.cle === "string" ? [v.cle] : []), ...Object.values(v).flatMap(cles)] : []);

test("lakour-fenoir-en : mêmes documents, mêmes _id et _key que lakour-fenoir, pack par pack", () => {
  assert.equal(anglais.length, francais.length);
  const parCle = new Map(anglais.map(d => [d.cle, d]));
  for (const fr of francais) {
    const en = parCle.get(fr.cle);
    assert.ok(en, `document absent du module anglais : ${fr.cle}`);
    assert.equal(en.pack, fr.pack);
    assert.equal(en.doc._id, fr.doc._id, `${fr.cle} : _id différent`);
    assert.equal(en.doc._key, fr.doc._key, `${fr.cle} : _key différente`);
    assert.deepEqual(ids(en.doc).sort(), ids(fr.doc).sort(), `${fr.cle} : identifiants embarqués différents`);
  }
});

test("lakour-fenoir-en : aucun uuid, chemin ni drapeau vers le module français ; chaque uuid vise un document anglais", () => {
  assert.ok(!texteAnglais.includes(`Compendium.${M}.`), "uuid vers lakour-fenoir");
  assert.ok(!texteAnglais.includes(`modules/${M}/`), "chemin vers modules/lakour-fenoir/");
  assert.ok(!texteAnglais.includes(`"${M}":`), "portée de drapeaux lakour-fenoir");
  const uuids = new Set(anglais.map(d => `Compendium.${MODULE_EN}.${d.pack}.${TYPE_PACK[d.pack]}.${d.doc._id}`));
  const cites = texteAnglais.match(new RegExp(`Compendium\\.${MODULE_EN}\\.[a-z]+\\.[A-Za-z]+\\.[A-Za-z0-9]{16}`, "g")) ?? [];
  for (const u of cites) assert.ok(uuids.has(u), `uuid inconnu : ${u}`);
  assert.ok(texteAnglais.includes(`modules/${MODULE_EN}/assets/`), "les images du module anglais sont les siennes");
  // Les épingles de la carte visent toujours les pages du journal des régions (mêmes identifiants).
  const carte = anglais.find(d => d.cle === "scenes:carte-de-la-reunion").doc;
  const regions = anglais.find(d => d.pack === "guides" && d.doc.pages.some(p => p.name === "The island")).doc;
  for (const n of carte.notes) { assert.equal(n.entryId, regions._id); assert.ok(regions.pages.some(p => p._id === n.pageId)); }
});

test("dictionnaires contenu/en : un par pack plus le registre, à jour, complets, sans écart de balises ni terme interdit", () => {
  assert.deepEqual(packs.sort(), [...Object.keys(TYPE_PACK), PACK_REGISTRE].sort());
  assert.deepEqual(rapport.obsoletes, [], "le français a changé : relancer node outils/fabriquer-fenoir.mjs --extraire");
  assert.deepEqual(rapport.erreurs, []);
  assert.deepEqual(rapport.manquants, [], "textes encore en français");
  // Chaque entrée du dictionnaire correspond encore à un chemin du document ou du registre (sinon l'extraction l'aurait retirée).
  const { tout } = extraireTout(francais, registreFr);
  for (const [cle, entree] of Object.entries(dictionnaire)) {
    const pack = cle.split("/")[0];
    for (const [chemin, t] of Object.entries(entree)) {
      if (chemin.startsWith("_")) continue;
      assert.equal(tout[pack]?.[cle]?.[chemin]?.fr, t.fr, `${cle}:${chemin} : entrée sans source (relancer --extraire)`);
      assert.ok(t.en, `${cle}:${chemin} : non traduit`);
      assert.deepEqual(ecartsBalises(t.fr, t.en), [], `${cle}:${chemin}`);
    }
  }
  // Les mêmes vérifications qu'en français (termes interdits compris) passent sur les documents anglais.
  assert.deepEqual(verifierDocuments(anglais, { module: MODULE_EN }), []);
});

test("registre anglais : mêmes clés et mêmes nombres que le français, textes anglais, images récrites ; accepté par le fabricant et par le système", () => {
  assert.equal(registreEn.module, MODULE_EN);
  assert.deepEqual(Object.keys(registreEn), Object.keys(registreFr));
  assert.deepEqual(cles(registreEn), cles(registreFr), "les clés du registre ne sont jamais traduites");
  assert.deepEqual(nombres(registreEn), nombres(registreFr), "la mécanique du registre est identique");
  for (const f of ["regions", "sites", "installations", "savoirs", "equipements", "passes", "recettes", "afflictions", "factions", "evenements", "creatures", "enfances", "traits", "fetes"]) {
    assert.equal(registreEn[f].length, registreFr[f].length, f);
    for (let i = 0; i < registreEn[f].length; i++) assert.equal(registreEn[f][i].cle, registreFr[f][i].cle, `${f}[${i}]`);
  }
  // Noms propres gardés tels quels ; textes traduits.
  assert.deepEqual(registreEn.noms, registreFr.noms, "prénoms, surnoms et noms de cyclones restent tels quels");
  assert.equal(registreEn.regions.find(r => r.cle === "saint-denis").nom, "Saint-Denis");
  assert.equal(registreEn.regions.find(r => r.cle === "hauts-de-l-ouest").nom, "The Western Highlands");
  assert.equal(registreEn.factions.find(f => f.cle === "garnison-du-quai").nom, "The Quay Garrison");
  assert.equal(registreEn.installations.find(i => i.cle === "citerne-de-pluie").nom, "Rainwater cistern");
  assert.equal(registreEn.installations.find(i => i.cle === "citerne-de-pluie").nom, anglais.find(d => d.cle === "installations:citerne-de-pluie").doc.name, "même nom dans le compendium et le registre");
  assert.ok(registreEn.sites.every(s => s.atouts.every(a => a !== registreFr.sites.find(x => x.cle === s.cle).atouts[0] || /^[A-Z]/.test(a))));
  for (const f of registreEn.fetes) {
    assert.equal(f.image, registreFr.fetes.find(x => x.cle === f.cle).image ? `modules/${MODULE_EN}/assets/fetes/${f.cle}.jpg` : "");
    assert.ok(f.gain && f.cout && f.gain !== registreFr.fetes.find(x => x.cle === f.cle).gain, `fête ${f.cle} : gain et coût traduits`);
    assert.ok(f.nom.length <= 80 && f.description.length <= 600 && f.consigne.length <= 300, `fête ${f.cle} : textes trop longs`);
    assert.ok(!f.periode.includes("-"), `fête ${f.cle} : période avec un trait d'union`);
  }
  assert.ok(!texteRegistreEn.includes(`modules/${M}/`));
  assert.deepEqual(verifierDonnees(registreEn, { module: MODULE_EN }), []);
  assert.deepEqual(verifierContenu(registreEn), [], "le système lakour-survie accepte le registre anglais");
});

test("glossaire : the Pallid, the Grey, les compétences du système ; les lieux réels restent en français", () => {
  assert.ok(!/\bLivides?\b/.test(texteAnglais) && !/\bLivides?\b/.test(texteRegistreEn), "« Livide » reste dans l'anglais");
  assert.ok(/\bthe Pallid\b/.test(texteAnglais) && /\bthe Grey\b/.test(texteAnglais));
  const langue = JSON.parse(readFileSync(new URL("../systems/lakour-survie/lang/en.json", import.meta.url), "utf8"));
  const guide = anglais.find(d => d.cle === "guides:guide-du-joueur").doc;
  const page = guide.pages.find(p => p.name === "The ten skills").text.content;
  for (const c of COMPETENCES) assert.ok(page.includes(`<strong>${langue.LAKOUR_SURVIE.Competences[c]}</strong>`), `compétence ${c} nommée comme le système`);
  for (const lieu of ["Saint-Denis", "Le Port", "Cilaos", "Plaine des Cafres", "Route des Laves", "Mafate", "Hell-Bourg", "Piton des Neiges"]) {
    assert.ok(texteAnglais.includes(lieu), `lieu réel absent : ${lieu}`);
  }
  assert.ok(texteAnglais.includes("the Highlands") && texteAnglais.includes("the Lowlands"));
  assert.ok(texteAnglais.includes("watch") && texteAnglais.includes("shelter") && texteAnglais.includes("intel"));
});

test("200 jours du système sur le registre anglais : même monde qu'en français, textes mis à part", () => {
  const graine = "fenoir-en";
  const courir = contenu => {
    let m = L.creerMonde(contenu, graine);
    const faits = [];
    for (let j = 1; j <= 200; j++) {
      const r = L.simulerJour(m, contenu, L.hasardDuJour(graine, j), j, { region: "saint-denis", bruitParRegion: { "saint-denis": j % 7 === 0 ? 6 : 0 }, abri: { region: "saint-denis", visibilite: 3, bruit: 2 } });
      m = r.monde;
      faits.push(...r.faits);
    }
    return { m, faits };
  };
  const fr = courir(registreFr), en = courir(registreEn);
  const sansTextes = m => { const { journalSecret, ...reste } = m; return reste; };
  assert.deepEqual(sansTextes(en.m), sansTextes(fr.m), "le monde simulé ne dépend pas de la langue du registre");
  assert.deepEqual(en.faits.map(f => [f.jour, f.cle, f.region]), fr.faits.map(f => [f.jour, f.cle, f.region]));
  assert.ok(en.faits.length > 50);
  assert.ok(en.faits.some(f => /\b(Horde|Pallid|Pilgrims|Scrappers|Garrison|Moonless|Cooperative|Boats|Dispensary|Families)\b/.test(f.texte)), "les faits citent le contenu en anglais");
  for (const [cle, r] of Object.entries(en.m.regions)) assert.ok(r.infestation >= 0 && r.infestation <= 5, cle);
  // Une partie installée sur un vrai site du registre anglais tient trente jours.
  const p = partie({ contenu: registreEn, site: "ferme-de-la-plaine-des-cafres", jours: 30, graine, apport: { nourriture: 60, eau: 60 } });
  assert.equal(p.historique.length, 30);
  assert.ok(p.historique.at(-1).survivants.every(s => s.vivant));
});

test("manifeste anglais : identifiant, conflit avec le module français, étiquettes et dossier traduits", () => {
  const manifeste = JSON.parse(readFileSync(new URL(`../modules/${M}/module.json`, import.meta.url), "utf8"));
  const traductions = JSON.parse(readFileSync(new URL(`../modules/${M}/contenu/en/module.json`, import.meta.url), "utf8"));
  const en = manifesteAnglais(manifeste, traductions);
  assert.equal(en.id, MODULE_EN);
  assert.equal(en.title, "La Kour — Fénoir (English)");
  assert.notEqual(en.title, manifeste.title, "titre anglais distinct du français dans la liste des modules de Foundry");
  assert.equal(en.version, manifeste.version);
  assert.ok(en.relationships.conflicts.some(c => c.id === M && c.type === "module"));
  assert.deepEqual(en.relationships.systems, manifeste.relationships.systems);
  assert.deepEqual(en.esmodules, manifeste.esmodules);
  assert.equal(en.packs.length, manifeste.packs.length);
  for (const p of en.packs) { assert.equal(p.label, traductions.packs[p.name], p.name); assert.equal(p.path, manifeste.packs.find(q => q.name === p.name).path); }
  assert.ok(en.packFolders[0].name !== manifeste.packFolders[0].name);
  assert.deepEqual(en.packFolders[0].packs, manifeste.packFolders[0].packs);
  assert.ok(!JSON.stringify(en).includes(`Compendium.${M}.`));
});

test("scripts/identite.js : l'identifiant du module vient de l'adresse du script", async () => {
  const fr = await import("../modules/lakour-fenoir/scripts/identite.js");
  assert.equal(fr.ID, M);
  assert.equal(fr.ANGLAIS, false);
  const { MODULE_FETES, imageDeFete } = await import("../modules/lakour-fenoir/scripts/fetes.js");
  assert.equal(MODULE_FETES, M);
  assert.equal(imageDeFete("noel"), `modules/${M}/assets/fetes/noel.jpg`);
  for (const script of ["main.js", "fetes.js"]) {
    const texte = readFileSync(new URL(`../modules/lakour-fenoir/scripts/${script}`, import.meta.url), "utf8");
    assert.ok(texte.includes("./identite.js"), `${script} importe identite.js`);
    assert.ok(!/=\s*"lakour-fenoir"/.test(texte), `${script} ne nomme plus le module en dur`);
  }
});

test("figurants : contenu/en/figurants.json traduit chaque type lu par le MJ IA, sans toucher aux clés ni aux jetons", () => {
  const table = JSON.parse(readFileSync(new URL(`../modules/${M}/assets/jetons/figurants.json`, import.meta.url), "utf8"));
  const libelles = JSON.parse(readFileSync(new URL(`../modules/${M}/contenu/en/figurants.json`, import.meta.url), "utf8"));
  const en = traduireFigurants(table, libelles);
  assert.deepEqual(Object.keys(en), Object.keys(table));
  assert.deepEqual(Object.keys(libelles).filter(k => !k.startsWith("_")).sort(), Object.keys(table).sort(), "un libellé anglais par type, ni plus ni moins");
  for (const [type, f] of Object.entries(en)) {
    assert.equal(f.jeton, table[type].jeton, type);
    assert.equal(f.libelle, libelles[type], type);
    assert.ok(f.libelle.trim() && !/[àâçéèêëïôûùüÿœ]/i.test(f.libelle), `${type} : libellé encore français`);
  }
  assert.equal(en.livide.libelle, "Pallid", "glossaire : Livides -> the Pallid");
  assert.ok(!packs.includes("figurants"), "le dictionnaire des figurants n'entre pas dans les dictionnaires des packs");
});

test("lakour-fenoir-en sur le disque (si fabriqué) : contrat des modules de contenu, identité anglaise, registre, plans et figurants traduits", { skip: !existsSync(new URL("src", RACINE_EN)) && "npm run fabriquer-fenoir-en n'a pas tourné" }, async () => {
  assert.deepEqual(verifierModuleDeContenu(`modules/${MODULE_EN}`), []);
  const figurants = JSON.parse(readFileSync(new URL("assets/jetons/figurants.json", RACINE_EN), "utf8"));
  assert.equal(figurants.livide.libelle, "Pallid");
  assert.equal(figurants.livide.jeton, "livide-frais");
  const identite = await import(pathToFileURL(new URL("scripts/identite.js", RACINE_EN).pathname.replace(/^\/([A-Za-z]:)/, "$1")).href);
  assert.equal(identite.ID, MODULE_EN);
  assert.equal(identite.ANGLAIS, true);
  const registre = JSON.parse(readFileSync(new URL("assets/donnees.json", RACINE_EN), "utf8"));
  assert.deepEqual(registre, registreEn);
  const plans = JSON.parse(readFileSync(new URL("assets/cartes/plans.json", RACINE_EN), "utf8"));
  assert.ok(Object.values(plans).some(p => p.pieces.some(piece => piece.nom === "Veranda")), "plans.json du module anglais : noms traduits");
  const manifeste = JSON.parse(readFileSync(new URL("module.json", RACINE_EN), "utf8"));
  assert.equal(manifeste.id, MODULE_EN);
  for (const f of ["lang/en.json", "lang/fr.json", "scripts/main.js", "scripts/fetes.js", "scripts/identite.js", "CREDITS.md", "assets/cartes/reunion.webp", "assets/fetes/noel.jpg"]) {
    assert.ok(existsSync(new URL(f, RACINE_EN)), f);
  }
  const index = readFileSync(new URL("assets/jetons/index.json", RACINE_EN), "utf8");
  assert.ok(index.includes(`modules/${MODULE_EN}/`) && !index.includes(`modules/${M}/`), "index des jetons récrit");
});
