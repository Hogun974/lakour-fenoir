// La mise à jour d'un monde déjà installé (modules/lakour-fenoir/scripts/mise-a-jour.js) : pages nouvelles ajoutées, pages
// intactes remises à jour, pages retouchées laissées au MJ ; et le numéro que l'installateur compare suit module.json.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { empreinte, pageIntacte, planMiseAJour, avecEmpreintes } from "../modules/lakour-fenoir/scripts/mise-a-jour.js";

const ID = "lakour-fenoir";
const page = (id, cle, contenu, sort, extra = {}) => ({ _id: id, name: `Page ${cle}`, type: "text", sort, text: { content: contenu, format: 1 }, flags: { [ID]: { cle } }, ...extra });
const neuve = { createdTime: 1000, modifiedTime: 1000 };
const retouchee = { createdTime: 1000, modifiedTime: 2000 };

test("empreinte : stable, sensible au texte", () => {
  assert.equal(empreinte("<p>Bonjour</p>"), empreinte("<p>Bonjour</p>"));
  assert.notEqual(empreinte("<p>Bonjour</p>"), empreinte("<p>Bonjour.</p>"));
  assert.equal(typeof empreinte(), "string");
});

test("page intacte : par l'empreinte, sinon par les dates", () => {
  const p = page("a", "x", "<p>A</p>", 100);
  assert.equal(pageIntacte(ID, { ...p, _stats: neuve }), true);
  assert.equal(pageIntacte(ID, { ...p, _stats: retouchee }), false);
  assert.equal(pageIntacte(ID, p), false, "sans dates ni empreinte : on ne touche pas");
  const marquee = avecEmpreintes(ID, [p])[0];
  assert.equal(pageIntacte(ID, { ...marquee, _stats: retouchee }), true, "l'empreinte prime sur les dates");
  assert.equal(pageIntacte(ID, { ...marquee, text: { content: "<p>A modifié</p>" } }), false);
});

test("plan : ajoute, met à jour l'intact, garde le retouché, ignore les pages du MJ", () => {
  const actuelles = [
    page("p1", "etat", "<p>ancien état</p>", 500, { _stats: neuve }),
    page("p2", "abri", "<p>abri retouché par le MJ</p>", 700, { _stats: retouchee }),
    page("p3", "bruit", "<p>bruit</p>", 800, { _stats: neuve }),
    { _id: "mj1", name: "Notes du MJ", type: "text", sort: 50, text: { content: "<p>à moi</p>" }, flags: {} }
  ];
  const modeles = [
    page("p1", "etat", "<p>nouvel état</p>", 500, { _stats: { createdTime: 1 } }),
    page("p2", "abri", "<p>nouvel abri</p>", 700),
    page("z1", "zerbaz", "<p>zerbaz</p>", 800, { _stats: { createdTime: 1 } }),
    page("p3", "bruit", "<p>bruit</p>", 900)
  ];
  const { creer, maj, gardees } = planMiseAJour(ID, actuelles, modeles);
  assert.equal(creer.length, 1);
  assert.equal(creer[0]._id, "z1");
  assert.equal(creer[0]._stats, undefined, "pas de dates du compendium");
  assert.equal(creer[0].flags[ID].cle, "zerbaz");
  assert.equal(creer[0].flags[ID].empreinte, empreinte("<p>zerbaz</p>"));
  assert.deepEqual(maj.find(m => m._id === "p1"), { _id: "p1", "text.content": "<p>nouvel état</p>", [`flags.${ID}.empreinte`]: empreinte("<p>nouvel état</p>") });
  assert.deepEqual(maj.find(m => m._id === "p3"), { _id: "p3", sort: 900, [`flags.${ID}.empreinte`]: empreinte("<p>bruit</p>") });
  assert.equal(maj.some(m => m._id === "p2" || m._id === "mj1"), false);
  assert.deepEqual(gardees, ["Page abri"]);
});

test("plan : une seconde passe ne change plus rien", () => {
  const modeles = [page("p1", "etat", "<p>état</p>", 500), page("z1", "zerbaz", "<p>zerbaz</p>", 800)];
  const actuelles = avecEmpreintes(ID, modeles).map(p => ({ ...p, _stats: retouchee }));
  assert.deepEqual(planMiseAJour(ID, actuelles, modeles), { creer: [], maj: [], gardees: [] });
});

test("plan : un identifiant de page déjà pris n'est pas réutilisé", () => {
  const actuelles = [{ _id: "z1", name: "Autre", type: "text", text: { content: "" }, flags: {} }];
  const { creer } = planMiseAJour(ID, actuelles, [page("z1", "zerbaz", "<p>zerbaz</p>", 800)]);
  assert.equal(creer[0]._id, undefined);
});

test("le numéro de contenu de l'installateur suit module.json (sinon la mise à jour n'est jamais proposée)", () => {
  const main = readFileSync(new URL("../modules/lakour-fenoir/scripts/main.js", import.meta.url), "utf8");
  const module = JSON.parse(readFileSync(new URL("../modules/lakour-fenoir/module.json", import.meta.url), "utf8"));
  assert.equal(main.match(/const VERSION_CONTENU = "([^"]+)"/)?.[1], module.version);
});
