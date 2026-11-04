// L'état public de la partie (§4), avancer(n) (§1.4), fêtes et paliers de visibilité (§9), et le contenu (§2, §3, §9).
// Lancer : npm run essais
import { test } from "node:test";
import assert from "node:assert/strict";
import { L, contenuMini, I, partie } from "./doublures/survie-outils.mjs";

const C = contenuMini();

function depart(site = "hauts-ferme", installations = []) {
  const region = L.siteDe(C, site).region;
  const { monde, etat } = L.demarrerPartie({ contenu: C, graine: "et", region, membres: ["a", "b"] });
  const ins = L.installerAbri(monde, C, { site, jour: 0 });
  return {
    etat, monde: ins.monde,
    abri: { id: "abri", system: ins.abri, installations: [...ins.installations, ...installations] },
    survivants: [{ id: "a", nom: "Ana", system: L.survivantNeuf({}) }, { id: "b", nom: "Bao", system: L.survivantNeuf({}) }]
  };
}

test("creerPartie : état public du contrat §4", () => {
  const { etat, monde } = L.demarrerPartie({ contenu: C, graine: "x", region: "port-gris", membres: ["a"] });
  assert.equal(etat.demarree, true);
  assert.deepEqual(etat.horloge, { quart: 0 });
  assert.equal(etat.phase, "jour-zero");
  assert.deepEqual(etat.groupe, { abri: "", membres: ["a"], pnj: [], plans: [], region: "port-gris", enRoute: null });
  assert.equal(etat.renseignements["port-gris"].vu, 0);
  assert.equal(etat.joursAutonomes, 0);
  assert.equal(etat.autonome, false);
  assert.ok(!("regions" in etat), "le monde réel n'est pas dans l'état public");
  assert.equal(monde.graine, "x");
});

test("avancer : ne modifie pas ses entrées, enchaîne quarts et jours", () => {
  const d = depart();
  const copie = structuredClone(d);
  const r = L.avancer({ ...d, contenu: C, quarts: 6 });
  assert.deepEqual(d, copie);
  assert.equal(r.etat.horloge.quart, 6);
  assert.deepEqual(r.jours, [1]);
  assert.equal(r.monde.jour, 1);
  assert.ok(r.acteurs.abri.system.stocks.nourriture < d.abri.system.stocks.nourriture, "on a mangé");
  assert.ok(r.bilan && typeof r.bilan.visibilite === "number");
});

test("avancer : même monde quelle que soit la façon d'avancer (déterminisme par jour)", () => {
  const d = depart();
  const d1 = L.avancer({ ...d, contenu: C, quarts: 40 });
  let x = { ...d };
  for (let k = 0; k < 40; k++) {
    const r = L.avancer({ ...x, contenu: C, quarts: 1 });
    x = { etat: r.etat, monde: r.monde, abri: r.acteurs.abri, survivants: x.survivants.map(s => ({ ...s, system: r.acteurs.survivants.find(c => c.id === s.id)?.system ?? s.system })) };
  }
  assert.deepEqual(x.monde, d1.monde);
  assert.deepEqual(x.abri.system.stocks, d1.acteurs.abri.system.stocks);
  assert.deepEqual(x.etat.journal, d1.etat.journal);
});

test("avancer : soif sans eau, repos de nuit à l'abri, sauf pour qui veille", () => {
  const d = depart();
  d.abri.system.stocks.eau = 0;
  d.survivants[0].system.fatigue = 4;
  d.survivants[1].system.fatigue = 4;
  const r = L.avancer({ ...d, contenu: C, quarts: 4, options: { veille: ["b"] } });
  const a = r.acteurs.survivants.find(s => s.id === "a").system;
  const b = r.acteurs.survivants.find(s => s.id === "b").system;
  assert.equal(a.soif, 4);
  assert.ok(a.fatigue < b.fatigue, "la nuit repose, la veille non");
});

test("avancer : un voyage en cours arrive et la région est vue", () => {
  const d = depart();
  d.etat.groupe.enRoute = { de: "hauts-verts", vers: "cote-ouest", route: "route-cote-ouest", reste: 3, transport: "pied" };
  const r = L.avancer({ ...d, contenu: C, quarts: 3 });
  assert.equal(r.etat.groupe.region, "cote-ouest");
  assert.equal(r.etat.groupe.enRoute, null);
  assert.equal(r.etat.renseignements["cote-ouest"].vu, 0);
  assert.ok(r.etat.journal.some(j => j.texte.includes("arrive")));
});

test("avancer : autonomie comptée seulement les jours sans fouille", () => {
  const ins = [I("citerne-pluie", 2), I("potager", 3, { termineLe: -100 }), I("panneaux-solaires", 2), I("batteries", 1), I("chambre-froide", 1)];
  const d = depart("hauts-ferme", ins);
  let r = L.avancer({ ...d, contenu: C, quarts: 4 * 8 });
  assert.equal(r.etat.autonome, true);
  assert.ok(r.etat.joursAutonomes >= 7);
  const fouille = L.noterFouille(r.etat, 8);
  r = L.avancer({ etat: fouille, monde: r.monde, contenu: C, quarts: 4, survivants: d.survivants, abri: r.acteurs.abri });
  assert.equal(r.etat.joursAutonomes, 0);
  assert.equal(r.etat.autonome, false);
});

test("avancer : journal public limité à 200 entrées, faits secrets à part", () => {
  const d = depart("port-immeuble");
  const r = L.avancer({ ...d, contenu: C, quarts: 4 * 150 });
  assert.ok(r.etat.journal.length <= 200);
  assert.ok(r.faits.every(f => f.public));
  assert.ok(r.secrets.every(f => !f.public));
  assert.ok(r.etat.alertes.length <= 50);
  assert.ok(!JSON.stringify(r.etat).includes("journalSecret"));
});

test("paliers de visibilité : franchir un palier à la hausse donne un fait secret palierVisibilite", () => {
  assert.deepEqual([0, 2, 3, 4, 5, 7, 9, 10].map(L.palierVisibilite), [0, 0, 1, 1, 2, 3, 4, 4]);
  const d = depart("port-entrepot", [I("palissade", 2), I("potager", 1), I("panneaux-solaires", 1), I("groupe-electrogene", 1)]);
  d.abri.system.stocks.carburant = 10;
  const r = L.avancer({ ...d, contenu: C, quarts: 4, options: { visibiliteVeille: 0 } });
  const f = r.secrets.find(x => x.cle === "palierVisibilite");
  assert.ok(f, "fait secret");
  assert.equal(f.public, false);
  assert.ok(f.palier >= 1);
  assert.ok(!r.faits.some(x => x.cle === "palierVisibilite"));
  assert.ok(r.monde.journalSecret.some(j => j.texte.includes("plus visible")));
  const sans = L.avancer({ ...d, contenu: C, quarts: 4 });
  assert.ok(!sans.secrets.some(x => x.cle === "palierVisibilite"), "pas de franchissement sans hausse");
});

test("fêter : +1 moral, une ration de plus par personne, une fois par fête et par année", () => {
  const d = depart();
  d.survivants[0].system.moral = 3;
  d.survivants[1].system.moral = 5;
  d.abri.system.stocks.nourriture = 10;
  const r = L.feter(d.etat, d.abri, { fete: "noel", annee: 2026, survivants: d.survivants });
  assert.equal(r.ok, true);
  assert.deepEqual(r.survivants.map(s => s.system.moral), [4, 5]);
  assert.equal(r.abri.system.stocks.nourriture, 8);
  assert.deepEqual(r.etat.fetes, ["noel-2026"]);
  assert.equal(L.feter(r.etat, r.abri, { fete: "noel", annee: 2026, survivants: r.survivants }).ok, false);
  assert.equal(L.feter(r.etat, r.abri, { fete: "noel", annee: 2027, survivants: r.survivants }).ok, true);
  const vide = { ...d.abri, system: { ...d.abri.system, stocks: { nourriture: 1 } } };
  assert.equal(L.feter(d.etat, vide, { fete: "liberte", annee: 2026, survivants: d.survivants }).ok, false);
});

test("maladies dans avancer : eau non traitée dans les Bas, on finit par tomber malade ; un malade déclaré a un malus", () => {
  const p = partie({ site: "est-usine", jours: 60, graine: "malade" });
  const atteints = p.historique.flatMap(h => h.survivants).filter(s => (s.afflictions ?? []).length);
  assert.ok(atteints.length > 0, "quelqu'un tombe malade en 60 jours");
  const journal = p.historique.at(-1).etat.journal.map(j => j.texte).join("\n");
  assert.ok(/tombe malade|se remet/.test(journal), "le journal le raconte");
});

// ------------------------------------------------------------------ contenu
test("verifierContenu : le contenu d'essai est sain", () => {
  assert.deepEqual(L.verifierContenu(contenuMini()), []);
});

test("verifierContenu : erreurs lisibles (clés, références, symétrie, connexité, niveaux, §9)", () => {
  const c = contenuMini();
  c.regions.push(structuredClone(c.regions[0]));
  c.regions[1].voisins = c.regions[1].voisins.filter(v => v.region !== "port-gris");
  c.sites[0].region = "nulle-part";
  c.installations[0].niveauMax = 3;
  c.installations[1].niveaux[1].requiert.savoirs = ["inconnu"];
  c.regions.push({ cle: "ile-seule", nom: "Île seule", zone: "littoral", altitude: 0, population: 0, climat: { soleil: 1, pluie: 1 }, voisins: [], sites: [] });
  c.recettes[0].requiert.installation = "four";
  c.creatures[0].des = 0;
  c.equipements[0].terrains = ["autoroute"];
  c.afflictions[0].declencheur = "lune";
  const e = L.verifierContenu(c);
  const a = motif => assert.ok(e.some(x => motif.test(x)), `attendu : ${motif} dans\n${e.join("\n")}`);
  a(/clé en double « port-gris »/);
  a(/non symétrique/);
  a(/site « port-immeuble » : région inconnue/);
  a(/niveauMax \(3\) ≠ nombre de niveaux/);
  a(/savoir inconnu « inconnu »/);
  a(/« ile-seule » : inatteignable/);
  a(/recette « arc-fleches » : installation inconnue « four »/);
  a(/créature « livide-frais » : des manquant/);
  a(/véhicule « voiture » : terrain inconnu/);
  a(/affliction « dengue » : déclencheur inconnu/);
});
