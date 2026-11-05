// Cartes du module anglais lakour-fenoir-en : aucune image de carte ne porte de texte français connu.
// - La carte de l'île (raster, outils/fabriquer-carte.mjs) a une version anglaise : contenu/en/assets/cartes/reunion.webp
//   (textes de contenu/en/carte.json), posée par outils/fabriquer-fenoir.mjs --langue en à la place de assets/cartes/reunion.webp ;
//   les textes gravés dans l'image anglaise sont notés dans outils/donnees-carte/reunion.en.textes.json au dessin.
// - Les étiquettes des régions suivent le nom anglais du registre ; les noms de lieux réels restent tels quels.
// - Les SVG des cartes (lieux) n'ont pas de texte gravé ; les dessins de texte et les épingles des scènes anglaises sont traduits.
// Aucun réseau, rien n'est dessiné.  Lancer : npm run essais
import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { fabriquer, fabriquerAnglais, lireDictionnaires, MODULE_EN } from "../outils/fabriquer-fenoir.mjs";
import { francaisConnusDeCarte, langueDeCarte, SORTIE_EN, TEXTES_GRAVES_EN, textesDeCarte, textesGraves, verifierTextesDeCarte } from "../outils/fabriquer-carte.mjs";
import { donnees } from "../modules/lakour-fenoir/contenu/index.mjs";
import { MODULE } from "../modules/lakour-fenoir/contenu/aides.mjs";

const RACINE_EN = new URL(`../modules/${MODULE_EN}/`, import.meta.url);
const francais = fabriquer();
const registreFr = donnees();
const { documents: anglais, registre: registreEn } = fabriquerAnglais(francais, registreFr, lireDictionnaires().dictionnaire);
const francaisConnus = new Set(francaisConnusDeCarte());
const lireJson = url => JSON.parse(readFileSync(url, "utf8"));
const normal = t => t.replace(/[:,]/g, " ").replace(/\s+/g, " ").trim().toLocaleLowerCase("fr-FR");

test("carte de l'île en anglais : chaque texte gravé a sa traduction, aucun texte français connu", () => {
  const { textes, manquants } = textesDeCarte("en");
  assert.deepEqual(manquants, [], "textes sans traduction dans contenu/en/carte.json");
  assert.deepEqual(verifierTextesDeCarte("en", textes, manquants), []);
  for (const t of ["LÉGENDE", "Route nationale", "Route départementale", "Route forestière", "Sentier (à pied seulement)", "Rivière, ravine",
    "Sommet (altitude)", "La Réunion — Fénoir", "Carte des routes, des cirques et des Hauts", "ÎLE DE LA RÉUNION · OCÉAN INDIEN", "OCÉAN INDIEN", "O"]) {
    assert.ok(francaisConnus.has(t), `« ${t} » devrait être un texte français connu`);
    assert.ok(!textes.includes(t), `« ${t} » gravé en français`);
  }
  for (const t of ["KEY", "National road", "W", "INDIAN OCEAN", "Réunion — Fénoir", "Map of the roads, the cirques and the Highlands"]) assert.ok(textes.includes(t), t);
  // Les noms de lieux réels ne bougent pas.
  for (const t of ["Piton des Neiges", "Piton de la Fournaise", "Cilaos".toLocaleUpperCase(), "SAINT-DENIS", "Plaine des Sables"]) assert.ok(textes.includes(t), t);
  // Le contrôle mord : un texte sans entrée est signalé.
  const sansLegende = JSON.parse(readFileSync(new URL("../modules/lakour-fenoir/contenu/en/carte.json", import.meta.url), "utf8"));
  delete sansLegende.libelles["LÉGENDE"];
  delete sansLegende.regions.mafate;
  const L = langueDeCarte("en", sansLegende);
  textesDeCarte("en", L);
  assert.ok(L.manquants.includes("LÉGENDE") && L.manquants.some(m => m.includes("mafate")));
});

test("étiquettes des régions : mêmes noms que le registre, en français comme en anglais", () => {
  // Lignes anglaises (contenu/en/carte.json) : le nom anglais de la région, découpé.
  const L = langueDeCarte("en");
  for (const r of registreEn.regions) {
    const lignes = L.lignes(r, [r.nom]);
    assert.equal(normal(lignes.join(" ")), normal(r.nom), `${r.cle} : « ${lignes.join(" / ")} » ≠ « ${r.nom} »`);
  }
  assert.deepEqual(L.manquants, []);
  // Lignes françaises : le nom français (même découpe que la carte dessinée).
  const fr = textesDeCarte("fr").textes.map(normal).join(" ");
  for (const r of registreFr.regions) assert.ok(fr.includes(normal(r.nom)), `${r.cle} : « ${r.nom} » absent de la carte française`);
});

test("l'image anglaise existe, diffère de la française et a été dessinée avec les textes actuels", () => {
  assert.ok(existsSync(SORTIE_EN), "contenu/en/assets/cartes/reunion.webp absente : node outils/fabriquer-carte.mjs --langue en");
  const en = readFileSync(SORTIE_EN), fr = readFileSync(new URL(`../modules/${MODULE}/assets/cartes/reunion.webp`, import.meta.url));
  assert.equal(en.subarray(0, 4).toString(), "RIFF");
  assert.equal(en.subarray(8, 12).toString(), "WEBP");
  assert.ok(!en.equals(fr), "l'image anglaise est la française");
  const graves = lireJson(TEXTES_GRAVES_EN);
  assert.deepEqual(graves, textesDeCarte("en").textes, "textes de l'image anglaise périmés : node outils/fabriquer-carte.mjs --langue en");
  for (const t of graves) assert.ok(!francaisConnus.has(t), `« ${t} » gravé en français dans reunion.webp (anglais)`);
});

test("SVG des cartes : aucun texte gravé (rien à traduire)", () => {
  const dossier = new URL(`../modules/${MODULE}/assets/cartes/`, import.meta.url);
  const svgs = readdirSync(dossier, { recursive: true }).map(String).filter(f => f.endsWith(".svg"));
  assert.ok(svgs.length > 0);
  for (const f of svgs) assert.deepEqual(textesGraves(readFileSync(new URL(f.replaceAll("\\", "/"), dossier), "utf8")), [], f);
});

test("scènes anglaises : la carte de l'île garde son chemin (image anglaise), dessins de texte et épingles traduits", () => {
  const scenes = anglais.filter(d => d.pack === "scenes").map(d => d.doc);
  const ile = scenes.find(s => s.flags?.[MODULE_EN]?.cle === "carte-de-la-reunion");
  assert.equal(ile.levels[0].background.src, `modules/${MODULE_EN}/assets/cartes/reunion.webp`);
  // Un texte de dessin ou d'épingle identique au français ne doit pas avoir l'air français (noms propres seuls admis).
  const airFrancais = t => /\b(?:le|la|les|des|du|de|et|au|aux)\b/i.test(t.replace(/\b(?:Piton|Plaine|Rivière|Saint|Sainte|Grand|Le Port|La Possession|Le Tampon)\b[^,;:]*/g, ""));
  const scenesFr = new Map(francais.filter(d => d.pack === "scenes").map(d => [d.doc._id, d.doc]));
  for (const s of scenes) {
    const fr = scenesFr.get(s._id);
    for (const [coll, champ] of [["drawings", "text"], ["notes", "text"]]) {
      for (const d of s[coll] ?? []) {
        const t = d[champ], tFr = fr[coll].find(x => x._id === d._id)?.[champ];
        if (t && t === tFr && /\p{L}{3,}/u.test(t)) assert.ok(!airFrancais(t), `${s.name} : ${coll} « ${t} » resté en français`);
      }
    }
  }
});

const surLeDisque = existsSync(new URL("src", RACINE_EN));
test("lakour-fenoir-en sur le disque (si fabriqué) : aucune image de carte ne contient de texte français connu", { skip: !surLeDisque && "npm run fabriquer-fenoir-en n'a pas tourné" }, () => {
  const ile = readFileSync(new URL("assets/cartes/reunion.webp", RACINE_EN));
  assert.ok(ile.equals(readFileSync(SORTIE_EN)), "assets/cartes/reunion.webp du module anglais : relancer npm run fabriquer-fenoir-en");
  const dossier = new URL("assets/", RACINE_EN);
  for (const f of readdirSync(dossier, { recursive: true }).map(String).filter(f => f.endsWith(".svg"))) {
    for (const t of textesGraves(readFileSync(new URL(f.replaceAll("\\", "/"), dossier), "utf8"))) assert.ok(!francaisConnus.has(t), `${f} : « ${t} »`);
  }
  assert.ok(!existsSync(new URL("contenu", RACINE_EN)), "le module anglais n'embarque pas contenu/");
});
