// Essais par mutation de la logique de lakour-survie (comme aux Veillées) : chaque règle clé est cassée à son tour, dans une
// copie de la logique, et la batterie de vérifications ci-dessous doit alors échouer.  Lancer : npm run essais
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, writeFileSync, readdirSync, mkdtempSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { pathToFileURL, fileURLToPath } from "node:url";
import { contenuMini } from "./doublures/contenu-mini.mjs";

const SOURCE = fileURLToPath(new URL("../systems/lakour-survie/logique/", import.meta.url));
const C = contenuMini();
const constant = x => () => x;
const desFixes = faces => { let i = 0; return () => (faces[i++ % faces.length] - 1) / 6 + 0.01; };
const I = (L, cle, niveau, extra = {}) => L.instanceInstallation(cle, niveau, { termineLe: 0, ...extra });
const somme = (L, s) => L.COMPETENCES.reduce((t, c) => t + s.competences[c].niveau, 0);

function avancerJours(L, { site, installations = [], survivants, jours, contenu = C, etatAvant = null }) {
  const region = L.siteDe(contenu, site).region;
  const d = L.demarrerPartie({ contenu, graine: "mut", region, membres: survivants.map(s => s.id) });
  const ins = L.installerAbri(d.monde, contenu, { site, apport: { nourriture: 120, eau: 40 } });
  return L.avancer({ etat: etatAvant ? etatAvant(d.etat) : d.etat, monde: ins.monde, contenu, quarts: 4 * jours, survivants,
    abri: { id: "a", system: ins.abri, installations: [...ins.installations, ...installations.map(([c, n, x]) => I(L, c, n, x))] } });
}

// La batterie : chaque vérification lève une erreur si la règle n'est pas respectée.
const VERIFICATIONS = {
  "succès 5–6": L => { assert.equal(L.compter([4, 5, 6]), 2); assert.equal(L.resoudreTest({ niveau: 0, hasard: desFixes([5]) }).reussite, true); },
  "difficultés": L => assert.equal(L.resoudreTest({ niveau: 1, difficulte: "difficile", hasard: desFixes([5, 4]) }).reussite, false),
  "réserve bornée": L => { assert.equal(L.reserve({ niveau: 0, malus: 4 }), 1); assert.equal(L.reserve({ niveau: 5, bonus: 8 }), 10); },
  "forcer donne une marque": L => assert.equal(L.resoudreTest({ niveau: 1, forcer: true, hasard: desFixes([5, 2, 6]) }).marque, true),
  "seuil des marques": L => { assert.equal(L.marquer({ niveau: 2, marques: 5 }).monte, true); assert.equal(L.marquer({ niveau: 2, marques: 4 }).monte, false); },
  "passions": L => { assert.equal(L.marquer({ niveau: 2 }, 1, { passion: 1 }).marques, 1.5); assert.equal(L.marquer({ niveau: 2 }, 1, { passion: 2 }).marques, 2); },
  "bonus des jeunes": L => { assert.equal(L.marquer({ niveau: 3 }, 3, { age: 20 }).marques, 4); assert.equal(L.marquer({ niveau: 3 }, 3, { age: 40 }).marques, 3); },
  "plans −25 % et ÷ 2": L => assert.deepEqual(L.coutAvecPlans({ materiaux: 10, pieces: 3, travail: 12 }, true), { materiaux: 8, pieces: 3, travail: 6 }),
  "décomposition des Bas": L => {
    const m = L.creerMonde(C, "x");
    m.regions["port-gris"].infestation = 3;
    m.regions["hauts-verts"].infestation = 3;
    const r = L.simulerJour(m, C, constant(0.999), 61, {}).monde;
    assert.ok(Math.abs(r.regions["port-gris"].infestation - 2.97) < 1e-9);
    assert.ok(Math.abs(r.regions["hauts-verts"].infestation - 2.992) < 1e-9);
  },
  "coupures dans la fenêtre": L => {
    for (let g = 0; g < 40; g++) {
      const m = L.creerMonde(C, `g${g}`);
      for (const r of L.regionsDe(C)) for (const res of L.RESEAUX) {
        const f = r.infrastructures[res];
        if (f) assert.ok(m.coupures[r.cle][res] >= f[0] && m.coupures[r.cle][res] <= f[1]);
      }
    }
  },
  "pertes sans conservation": L => { assert.equal(L.pertesJour(21), 2); assert.equal(L.pertesJour(100, true), 0); assert.equal(L.pertesJour(1), 1); },
  "eau des Bas en été": L => assert.equal(L.consommationJour({ personnes: 4, altitude: 10, saison: "pluies" }).eau, 6),
  "soif": L => {
    let s = L.survivantNeuf({});
    for (let q = 1; q <= 3; q++) s = L.effetQuart(s, q, {}).system;
    assert.equal(s.fatigue, 0);
    assert.equal(L.effetQuart(s, 4, {}).system.fatigue, 1);
  },
  "infection": L => {
    let s = L.infecter(L.survivantNeuf({}), 0);
    for (let q = 1; q <= 11; q++) s = L.effetQuart(s, q, { boit: true }).system;
    assert.equal(s.vivant, true);
    assert.equal(L.effetQuart(s, 12, { boit: true }).system.vivant, false);
  },
  "délestage dans l'ordre": L => {
    const b = L.bilanAbri({ site: "hauts-ferme", region: "hauts-verts", stocks: { energie: 3 } },
      [I(L, "radio", 1), I(L, "chambre-froide", 1), I(L, "infirmerie", 1), I(L, "batteries", 1)], C, { personnes: 1 });
    assert.deepEqual(b.arrets.map(a => a.cle).sort(), ["infirmerie", "radio"]);
  },
  "délai des cultures": L => {
    const abri = { site: "hauts-ferme", region: "hauts-verts", sol: 3, stocks: { eau: 10 } };
    assert.equal(L.bilanAbri(abri, [I(L, "potager", 1, { termineLe: 10 })], C, { jour: 39, personnes: 0 }).production.nourriture ?? 0, 0);
    assert.equal(L.bilanAbri(abri, [I(L, "potager", 1, { termineLe: 10 })], C, { jour: 40, personnes: 0 }).production.nourriture, 2);
  },
  "traits jamais incompatibles": L => {
    const T = L.indexer(C).traits;
    for (let i = 0; i < 300; i++) {
      const s = L.genererSurvivant(C, L.creerHasard(`t${i}`), {});
      for (const a of s.traits) for (const b of s.traits) assert.ok(a === b || !(T.get(a).incompatibles ?? []).includes(b));
    }
  },
  "budget de départ": L => { for (let i = 0; i < 300; i++) { const n = somme(L, L.genererSurvivant(C, L.creerHasard(`b${i}`), {})); assert.ok(n >= 10 && n <= 16); } },
  "prénom du genre du passé": L => {
    const idx = L.indexer(C);
    for (let i = 0; i < 300; i++) {
      const s = L.genererSurvivant(C, L.creerHasard(`g${i}`), {});
      const g = C.prenomsF.includes(s.nom) ? "f" : C.prenomsM.includes(s.nom) ? "m" : "";
      for (const def of [idx.passes.get(s.passe), idx.enfances.get(s.enfance)]) if (def?.genre && g) assert.equal(def.genre, g);
    }
    const v = L.genererSurvivant(C, L.creerHasard("v"), { budget: null, verrous: { nom: "Rosemay Fontaine", passe: "electricien" } });
    assert.equal(L.nomAccorde(idx.passes.get(v.passe), v.genre), "Électricienne");
  },
  "recrues qui comblent": L => {
    let f = 0, h = 0;
    for (let i = 0; i < 400; i++) {
      const r = L.genererRecrue(C, L.creerHasard(`r${i}`), { besoins: { profil: { soins: 3, bricolage: 3 } } }).survivant;
      const s = L.genererSurvivant(C, L.creerHasard(`r${i}`), { statut: "recrue", budget: null });
      if (Math.max(r.competences.soins.niveau, r.competences.bricolage.niveau) >= 2) f++;
      if (Math.max(s.competences.soins.niveau, s.competences.bricolage.niveau) >= 2) h++;
    }
    assert.ok(f > h * 1.3);
  },
  "bras": L => { assert.equal(L.facteurBras({ nombre: 2, niveau: 2 }, []), 0.5); assert.equal(L.facteurBras({ nombre: 1, niveau: 2 }, [{ niveau: 2 }]), 1); },
  "gros mangeur": L => assert.deepEqual(L.effetsTraits({ traits: ["gros-mangeur"] }, C).besoins, { eau: 1, nourriture: 1.5 }),
  "eau traitée": L => assert.ok(L.risqueAffliction(L.indexer(C).afflictions.get("gastro"), { eauTraitee: true }) < 0.01),
  "hordes par routes ouvertes": L => {
    const m = L.creerMonde(C, "h");
    const routes = Object.fromEntries(L.voisinsDe(C, "hauts-verts").map(v => [v.region, "coupee"]));
    m.regions["hauts-verts"].evenements.push({ cle: "crue", depuis: 30, jusqua: 40, routes });
    m.hordes = [{ id: "h1", region: "hauts-verts", taille: 5, cap: null, depuis: 1 }];
    const r = L.simulerJour(m, C, constant(0), 30, {}).monde;
    assert.equal(r.hordes[0].cap, null);
  },
  "cyclones en saison des pluies": L => {
    assert.equal(L.simulerJour(L.creerMonde(C, "c", { dateDepart: "2027-06-01" }), C, constant(0), 10, {}).monde.cyclone, null);
    assert.ok(L.simulerJour(L.creerMonde(C, "c"), C, constant(0), 10, {}).monde.cyclone);
  },
  "charge à pied": L => { assert.equal(L.chargeMax({ membres: 2 }), 6); assert.equal(L.chargeMax({ transport: "vehicule", vehicules: 2 }), 40); },
  "résistance des créatures": L => assert.equal(L.resoudreCombat({ niveau: 1, livides: 2, creature: { des: 1, resistance: 2 }, hasard: desFixes([5, 6, 1, 1]) }).neutralises, 1),
  "fête une fois par an": L => {
    const etat = { groupe: { pnj: [] }, fetes: [] }, abri = { system: { stocks: { nourriture: 10 } } };
    const s = [{ id: "a", system: L.survivantNeuf({ moral: 3 }) }];
    const r = L.feter(etat, abri, { fete: "noel", annee: 2026, survivants: s });
    assert.equal(r.survivants[0].system.moral, 4);
    assert.equal(L.feter(r.etat, r.abri, { fete: "noel", annee: 2026, survivants: s }).ok, false);
  },
  "autonomie sans fouille": L => {
    const ins = [["citerne-pluie", 2], ["potager", 3, { termineLe: -100 }], ["panneaux-solaires", 2], ["batteries", 1], ["chambre-froide", 1]];
    const s = () => [{ id: "a", system: L.survivantNeuf({}) }, { id: "b", system: L.survivantNeuf({}) }];
    assert.equal(avancerJours(L, { site: "hauts-ferme", installations: ins, survivants: s(), jours: 8 }).etat.autonome, true);
    assert.equal(avancerJours(L, { site: "hauts-ferme", installations: ins, survivants: s(), jours: 8, etatAvant: e => ({ ...e, fouilleLe: 7 }) }).etat.joursAutonomes, 0);
  },
  "palier de visibilité": L => {
    const r = avancerJours(L, { site: "port-entrepot", installations: [["palissade", 2], ["potager", 1], ["panneaux-solaires", 1]], jours: 1,
      survivants: [1, 2, 3, 4, 5, 6].map(i => ({ id: `s${i}`, system: L.survivantNeuf({}) })) });
    assert.ok(!r.secrets.some(f => f.cle === "palierVisibilite"), "pas de hausse");
    const d = L.demarrerPartie({ contenu: C, graine: "p", region: "port-gris", membres: ["a"] });
    const ins = L.installerAbri(d.monde, C, { site: "port-entrepot" });
    const r2 = L.avancer({ etat: d.etat, monde: ins.monde, contenu: C, quarts: 4, options: { visibiliteVeille: 0 },
      survivants: [1, 2, 3, 4, 5, 6].map(i => ({ id: `s${i}`, system: L.survivantNeuf({}) })),
      abri: { id: "a", system: ins.abri, installations: [I(L, "palissade", 2), I(L, "potager", 1)] } });
    assert.ok(r2.secrets.some(f => f.cle === "palierVisibilite"));
  },
  "tâche de la semaine": L => {
    const r = avancerJours(L, { site: "hauts-ferme", jours: 7, survivants: [
      { id: "e", system: L.survivantNeuf({ age: 30, tache: "cultures", competences: { survie: { niveau: 1 } }, passions: { survie: 0 } }) }] });
    assert.equal(r.acteurs.survivants.find(s => s.id === "e").system.competences.survie.marques, 1);
  },
  "départ des recrues après 3 jours": L => {
    const contenu = contenuMini();
    contenu.traits.push({ cle: "desespere", nom: "Désespéré", effets: { moral: -3 }, incompatibles: [], poids: 0 });
    const recrue = () => [{ id: "r", system: L.survivantNeuf({ statut: "recrue", tache: "repos", moral: 0, traits: ["desespere"] }) }];
    assert.deepEqual(avancerJours(L, { site: "hauts-ferme", jours: 2, contenu, survivants: recrue() }).departs, []);
    assert.deepEqual(avancerJours(L, { site: "hauts-ferme", jours: 3, contenu, survivants: recrue() }).departs, ["r"]);
  }
};

// [fichier, texte d'origine, texte muté, règle cassée]
const MUTATIONS = [
  ["constantes.mjs", "export const SEUIL_SUCCES = 5;", "export const SEUIL_SUCCES = 6;", "succès 5–6"],
  ["des.mjs", "marque: Boolean(compte) && (!reussite || force),", "marque: Boolean(compte) && !reussite,", "forcer donne une marque"],
  ["des.mjs", "export const seuilMarques = niveau => 2 * (Number(niveau) + 1);", "export const seuilMarques = niveau => 2 * Number(niveau) + 1;", "seuil des marques"],
  ["des.mjs", "export const MULTIPLICATEUR_PASSION = [1, 1.5, 2];", "export const MULTIPLICATEUR_PASSION = [1, 1, 1];", "passions"],
  ["des.mjs", "Number(age) < AGE_JEUNE ? BONUS_JEUNE : 1", "Number(age) > AGE_JEUNE ? BONUS_JEUNE : 1", "bonus des jeunes"],
  ["constantes.mjs", "difficile: { requis: 2, bonus: 0 },", "difficile: { requis: 1, bonus: 0 },", "difficultés"],
  ["constantes.mjs", "export const DES_MIN = 1, DES_MAX = 10;", "export const DES_MIN = 0, DES_MAX = 12;", "réserve bornée"],
  ["abri.mjs", "export const PLANS = { ressources: 0.75, travail: 0.5 };", "export const PLANS = { ressources: 1, travail: 0.5 };", "plans −25 %"],
  ["abri.mjs", "export const PLANS = { ressources: 0.75, travail: 0.5 };", "export const PLANS = { ressources: 0.75, travail: 1 };", "plans travail ÷ 2"],
  ["abri.mjs", "else sortie[r] = Math.ceil(n * PLANS.ressources);", "else sortie[r] = Math.floor(n * PLANS.ressources);", "plans arrondis au supérieur"],
  ["monde.mjs", "decroissanceBas: 0.03,", "decroissanceBas: 0.008,", "décomposition des Bas"],
  ["monde.mjs", "Number(r.altitude) < ALTITUDE_BAS ? R.decroissanceBas : R.decroissanceHauts", "Number(r.altitude) > ALTITUDE_BAS ? R.decroissanceBas : R.decroissanceHauts", "Bas et Hauts"],
  ["monde.mjs", "entier(Number(f[0]), Number(f[1]), h)", "entier(Number(f[0]), Number(f[1]) + 5, h)", "coupures dans la fenêtre"],
  ["ressources.mjs", "if (conservation || n <= 0) return 0;", "if (n <= 0) return 0;", "pertes : conservation"],
  ["ressources.mjs", "return Math.ceil(n * TAUX_PERTES);", "return Math.floor(n * TAUX_PERTES);", "pertes arrondies au supérieur"],
  ["ressources.mjs", "export const TAUX_PERTES = 0.05;", "export const TAUX_PERTES = 0.1;", "pertes 5 %"],
  ["ressources.mjs", "eauBasEte: 1.5", "eauBasEte: 1", "eau des Bas en été"],
  ["survivant.mjs", "export const SEUIL_SOIF = 4;", "export const SEUIL_SOIF = 5;", "soif"],
  ["survivant.mjs", "export const QUARTS_PAR_STADE = 2;", "export const QUARTS_PAR_STADE = 3;", "infection"],
  ["abri.mjs", "[...lignes].sort((a, b) => prioriteDelestage(b.categorie) - prioriteDelestage(a.categorie))", "[...lignes]", "délestage dans l'ordre"],
  ["abri.mjs", "if (Number(cond.delai) > 0 && c.jour - Number(inst.termineLe ?? 0) < Number(cond.delai)) f = 0;", "", "délai des cultures"],
  ["generation.mjs", "return pris.every(c => c !== trait.cle && !(trait.incompatibles ?? []).includes(c) && !(parCle.get(c)?.incompatibles ?? []).includes(trait.cle));",
    "return pris.every(c => c !== trait.cle);", "traits incompatibles"],
  ["generation.mjs", "while (somme() < budget[0] && garde++ < 200)", "while (false && somme() < budget[0] && garde++ < 200)", "budget de départ (minimum)"],
  ["generation.mjs", "const prefPour = (mods, favoriser) => 1 + ", "const prefPour = (mods, favoriser) => 1 + 0 * ", "recrues qui comblent"],
  ["generation.mjs", "if (!t) { total += 0.5; continue; }", "if (!t) { total += 1; continue; }", "bras"],
  ["generation.mjs", "const candidats = genre ? [...p[genre], ...p.mixtes] : [...p.f, ...p.m, ...p.mixtes];", "const candidats = [...p.f, ...p.m, ...p.mixtes];", "prénom du genre du passé"],
  ["generation.mjs", "const genreVoulu = genreDe({ genre: v.genre }) || (nomGarde ? genreDuNom(contenu, nomGarde) : \"\");", "const genreVoulu = genreDe({ genre: v.genre });", "prénom du genre du passé"],
  ["generation.mjs", "for (const r of [\"eau\", \"nourriture\"]) if (t.besoins?.[r] !== undefined) e.besoins[r] *= Number(t.besoins[r]);", "", "gros mangeur"],
  ["maladies.mjs", "eau: { traitee: 0.2, brute: 1 },", "eau: { traitee: 1, brute: 1 },", "eau traitée"],
  ["monde.mjs", ".filter(([, etat]) => etat !== \"coupee\")\n          .map(([v, etat])", "\n          .map(([v, etat])", "hordes par routes ouvertes"],
  ["monde.mjs", "} else if (saison === \"pluies\" && saisonDuJour(jour + 2, dateDepart) === \"pluies\" && chance(", "} else if (chance(", "cyclones en saison des pluies"],
  ["actions.mjs", "charge: { pied: 3,", "charge: { pied: 4,", "charge à pied"],
  ["actions.mjs", "const n = Math.min(g.nombre, Math.floor(succes / g.resistance));", "const n = Math.min(g.nombre, succes);", "résistance des créatures"],
  ["etat.mjs", "if ((etat.fetes ?? []).includes(cle)) return rien(\"déjà fêtée cette année\", \"fete-deja\");", "", "fête une fois par an"],
  ["etat.mjs", "Boolean(bilan?.autonome) && e.fouilleLe !== jour - 1", "Boolean(bilan?.autonome)", "autonomie sans fouille"],
  ["etat.mjs", "if (palier > palierVeille) {", "if (palier > palierVeille + 9) {", "palier de visibilité"],
  ["etat.mjs", "if (c && sys.joursTache % 7 === 0) {", "if (c && sys.joursTache % 8 === 0) {", "marque de la semaine"],
  ["survivant.mjs", "if (s.joursMoralZero >= 3)", "if (s.joursMoralZero >= 4)", "départ des recrues"]
];

async function chargerMutant(fichier, avant, apres) {
  const dossier = mkdtempSync(join(tmpdir(), "survie-mutant-"));
  for (const f of readdirSync(SOURCE)) {
    let texte = readFileSync(join(SOURCE, f), "utf8");
    if (f === fichier) {
      assert.ok(texte.includes(avant), `mutation introuvable dans ${f} : ${avant}`);
      texte = texte.replace(avant, apres);
    }
    writeFileSync(join(dossier, f), texte);
  }
  try { return await import(pathToFileURL(join(dossier, "index.mjs")).href); }
  finally { rmSync(dossier, { recursive: true, force: true }); }
}

function echecs(L) {
  const liste = [];
  for (const [nom, verifier] of Object.entries(VERIFICATIONS)) {
    try { verifier(L); } catch { liste.push(nom); }
  }
  return liste;
}

test("mutations : la logique d'origine passe toute la batterie", async () => {
  const L = await import("../systems/lakour-survie/logique/index.mjs");
  assert.deepEqual(echecs(L), []);
});

for (const [fichier, avant, apres, regle] of MUTATIONS) {
  test(`mutation « ${regle} » (${fichier}) : détectée`, async () => {
    const L = await chargerMutant(fichier, avant, apres);
    assert.ok(echecs(L).length > 0, `la règle « ${regle} » cassée passe inaperçue`);
  });
}
