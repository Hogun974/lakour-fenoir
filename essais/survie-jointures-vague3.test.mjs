// Fusion de la vague 3 (contrat §29) : les doublons des lots 5 à 9 retirés, et les jointures entre les lots ateliers (§24), fouille
// (§25), bâtir (§26), vivant (§27) et paradis (§28).
// - une seule fiche et une seule recette par outil de capture, une seule clé de corde, une seule règle de qualité d'un outil trouvé ;
// - une seule liste de bêtes portées, une seule expiration, « mettre à l'enclos » du lot 8 ; un seul entretien (le curage du vivant
//   passe par celui du lot 7) ; deux haies (la défense, le camouflage) ;
// - le matériau et l'entretien des installations des lots 6, 8 et 9 ; les plans au registre ; la qualité d'un outil trouvé faite
//   objet ; démonter selon le matériau ; la chaux au four à chaux ; le digesteur et l'enclos à cabris ; les bêtes mortes parmi les
//   corps ; l'agglutiné qui tue une bête ; la salle verte à la fête ; la ronde dans la grille ; le rallumage dans les rencontres.
// Lancer : npm run essais
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { installerFoundry } from "./doublures/foundry-survie.mjs";
import { charger, monde, survivantTire } from "./doublures/survie-api-outils.mjs";
import * as L from "../systems/lakour-survie/logique/index.mjs";
import { creerHasard, deriverHasard } from "../systems/lakour-survie/logique/hasard.mjs";
import { donnees, DOCUMENTS } from "../modules/lakour-fenoir/contenu/index.mjs";
import { CAPTURE_DES_EQUIPEMENTS } from "../modules/lakour-fenoir/contenu/vivant.mjs";
import { OUVRAGES_DES_LOTS } from "../modules/lakour-fenoir/contenu/ouvrages.mjs";

installerFoundry();
const M0 = await charger();
const D = JSON.parse(readFileSync(new URL("../modules/lakour-fenoir/assets/donnees.json", import.meta.url), "utf8"));
const REG = donnees();
const idx = L.indexer(D);
const I = (cle, niveau = 1, extra = {}) => L.instanceInstallation(cle, niveau, { termineLe: -365, ...extra });

// ------------------------------------------------------------------ les doublons
test("doublons : une fiche et une recette par outil de capture, rangée dans son atelier, avec ce qu'il prend ; une seule corde", () => {
  for (const [cle, metier] of [["cage-de-bambou", "vannerie"], ["sac-de-goni", "couture"], ["enfumoir", "etabli"]]) {
    assert.equal(DOCUMENTS.filter(d => d.type === "equipement" && d.system.cle === cle).length, 1, cle);
    const recettes = REG.recettes.filter(r => r.produit?.equipement === cle);
    assert.equal(recettes.length, 1, `une recette pour ${cle}`);
    assert.equal(recettes[0].metier, metier, `${cle} : l'atelier qui convient`);
    assert.equal(recettes[0].sac, true, `${cle} : elle se fait toujours depuis le sac`);
    assert.deepEqual(REG.equipements.find(e => e.cle === cle).capture, CAPTURE_DES_EQUIPEMENTS[cle]);
  }
  for (const cle of ["cage", "corde", "sac-de-goni-cousu"]) {
    assert.ok(!REG.equipements.some(e => e.cle === cle) && !REG.recettes.some(r => r.cle === cle), `plus de « ${cle} »`);
  }
  assert.deepEqual(REG.equipements.find(e => e.cle === "cordes-de-choka").capture, ["cabri", "cochon", "boeuf-moka"]);
  assert.equal(L.objetDeFouille(D, "corde").equipement, "cordes-de-choka", "la corde trouvée est la corde de choka");
  assert.equal(L.objetDeFouille(D, "cage").equipement, "cage-de-bambou");
  // Le lot 5 lit le champ du lot 8 : le porcelet (un cochon) se prend au sac ou à la corde.
  assert.equal(L.prendBete(D, ["sac-de-goni"], "porcelet"), "sac-de-goni");
  assert.equal(L.prendBete(D, ["cordes-de-choka"], "veau-moka"), "cordes-de-choka");
  assert.equal(L.prendBete(D, ["cage-de-bambou"], "veau-moka"), null);
});

test("doublons : une règle de qualité d'un outil trouvé (celle du lot 6), exportée une fois", () => {
  const h1 = creerHasard("q"), h2 = creerHasard("q");
  const a = Array.from({ length: 50 }, () => L.qualiteTrouvee(4, h1));
  const b = Array.from({ length: 50 }, () => L.qualiteTrouvee(4, h2));
  assert.deepEqual(a, b);
  assert.equal(typeof L.qualiteTrouvee, "function");
  assert.equal(L.REGLES_FOUILLES.qualite, undefined, "plus de seconde table au lot 5");
});

test("doublons : une seule liste de bêtes portées, à la forme du lot 8, et une seule expiration (betesQuiMeurent)", () => {
  const { monde: m, etat } = L.demarrerPartie({ contenu: D, graine: "vague3-betes", region: "mafate", membres: [] });
  const x = L.ajouterBete(etat, { cle: "porcelet", nombre: 1, quart: 0, contenu: D });
  assert.deepEqual(Object.keys(x.bete).sort(), ["abri", "cle", "enclos", "id", "jusqua", "nombre", "prisLe", "source"]);
  assert.equal(x.bete.jusqua, L.especeDe(D, "porcelet").capture.horsEnclos, "le délai de son espèce (le cochon)");
  const r = L.avancer({ etat: x.etat, monde: m, contenu: D, quarts: 6, survivants: [], abri: null });
  assert.equal(r.etat.groupe.betes.length, 0);
  assert.equal(r.etat.journal.filter(j => j.cle === "vivant-portee-morte").length, 1, "une seule mort, dite une fois");
  assert.ok(!r.etat.journal.some(j => j.cle === "bete-morte"));
  assert.equal(r.etat.groupe.porte.nourriture, 10, "la viande du cochon");
  assert.equal(L.expirerBetes, undefined);
  assert.equal(L.enclore, undefined, "« enclore » est devenu mettreEnEnclos (lot 8)");
  // Les enclos des bêtes trouvées : ceux qui prennent leur espèce (le clapier, la soue, l'étable).
  const enclos = Object.fromEntries(D.betesTrouvees.map(b => [b.cle, b.enclos]));
  assert.deepEqual([enclos.lapin, enclos.porcelet, enclos["veau-moka"]], [["clapier"], ["soue-a-cochons"], ["etable"]]);
  for (const b of D.betesTrouvees) for (const k of b.enclos) {
    const v = L.vivantDuNiveau(idx.installations.get(k), 1);
    assert.ok(L.especesPossibles(v).includes(L.cleEspece(D, b.cle)), `${b.cle} → ${k}`);
  }
});

test("doublons : un seul entretien ; le curage d'un bassin est celui du lot 7, son eau sale ne dit pas « encrassée »", () => {
  const def = idx.installations.get("bassin-a-tilapias");
  assert.deepEqual(L.entretienDe(def, 1), { tousLes: 20, travail: 1, encrassement: 0, arret: false, lavee: false, panne: 0, vie: 0, eau: true });
  assert.equal(L.vivantDuNiveau(def, 1).filtre, undefined);
  const b = [I("bassin-a-tilapias", 1, { suivi: { le: 0, negligence: 0, encrasse: false, vieLe: null } })];
  const j = L.journeeOuvrages(b, D, { jour: 21, bras: { elevage: 0 } });
  assert.equal(j.installations[0].suivi.encrasse, true);
  assert.equal(L.facteurEntretien(j.installations[0], def, 1), 1, "une eau sale ne coupe pas la production");
  assert.equal(L.eauSale(j.installations[0], def), true);
  assert.deepEqual(j.evenements, []);
});

test("doublons : deux haies, deux rôles ; celle qui cache cache à mesure qu'elle pousse, celle de choka ne défend qu'une fois fermée", () => {
  const abri = { site: "ferme-de-la-plaine-des-cafres", region: "le-tampon", stocks: {} };
  const sans = L.bilanAbri(abri, [], D, { jour: 30, personnes: 2 });
  const haie = L.bilanAbri(abri, [I("haie-de-bambous", 1, { termineLe: 0 })], D, { jour: 30, personnes: 2 });
  const pleine = L.bilanAbri(abri, [I("haie-de-bambous", 1, { termineLe: 0 })], D, { jour: 61, personnes: 2 });
  assert.ok(haie.discretion > sans.discretion && haie.discretion < pleine.discretion, `${sans.discretion} < ${haie.discretion} < ${pleine.discretion}`);
  const choka = I("haie-de-choka", 1, { termineLe: 0 });
  assert.equal(L.bilanAbri(abri, [choka], D, { jour: 100, personnes: 2 }).defense, sans.defense);
  assert.equal(L.bilanAbri(abri, [choka], D, { jour: 200, personnes: 2 }).defense, sans.defense + 1);
  assert.equal(L.materiauDe(idx.installations.get("haie-de-bambous"), 1), "bambou-et-vacoa");
  assert.equal(L.materiauDe(idx.installations.get("rideau-de-filaos"), 2), "bambou-et-vacoa");
});

// ------------------------------------------------------------------ les jointures
test("jointure : le matériau et l'entretien des installations des lots 6, 8 et 9 ; l'entretien seulement sans bras", () => {
  for (const cle of Object.keys(OUVRAGES_DES_LOTS)) {
    const def = idx.installations.get(cle);
    assert.ok(def, cle);
    for (let n = 1; n <= def.niveaux.length; n++) {
      assert.ok(L.MATERIAUX_CLES.includes(L.materiauDe(def, n)), `${cle} ${n}`);
      const bras = def.niveaux[n - 1].effets.bras;
      const e = def.niveaux[n - 1].entretien;
      if (bras) assert.ok(!e || e.eau, `${cle} : ses bras la tiennent`);
    }
  }
  assert.deepEqual([1, 2, 3].map(n => L.materiauDe(idx.installations.get("forge"), n)), ["pierre-seche", "pierre-seche", "parpaing-et-beton"]);
  assert.equal(L.entretienDe(idx.installations.get("etabli"), 1).tousLes, 60);
  assert.equal(L.entretienDe(idx.installations.get("etabli"), 2), null);
  assert.equal(L.entretienDe(idx.installations.get("haie-de-bambous"), 1).tousLes, 90);
  assert.equal(L.materiauDe(idx.installations.get("aquaponie"), 1), "parpaing-et-beton");
  assert.deepEqual(L.erreursOuvrages(D), []);
});

test("jointure : les plans des lots 6 et 7 au registre (un rabais, aucun exigé)", () => {
  const plans = new Set(D.plans.map(p => p.cle));
  assert.equal(plans.size, D.plans.length, "aucune clé de plan en double");
  for (const cle of ["recette-charrette-a-bras", "recette-charrette-a-boeufs", "recette-regulateur-de-charge", "recette-utilitaire-electrique",
    "recette-hache-forgee", "recette-sabre-forge", "four-a-chaux", "digesteur-a-biogaz", "salle-verte", "forge"]) assert.ok(plans.has(cle), cle);
  assert.deepEqual(L.erreursPlans(D), []);
});

test("jointure : un outil trouvé devient l'objet de sa qualité (marteau, scie, pince, truelle, hache, masse sont des objets)", () => {
  for (const cle of ["marteau", "scie", "pince", "truelle", "hache", "masse"]) {
    assert.equal(L.valeurObjetTrouve(D, cle).equipement, cle, `${cle} : un objet, plus des pièces`);
    assert.deepEqual(L.outilDeQualite(D, cle, "fortune"), { cle: `${cle}-de-fortune`, qualite: "" });
    assert.deepEqual(L.outilDeQualite(D, cle, "forge"), { cle, qualite: "" });
  }
  assert.deepEqual(L.outilDeQualite(D, "hache", "recuperation"), { cle: "hache-de-recuperation", qualite: "" });
  assert.deepEqual(L.outilDeQualite(D, "sabre-a-canne", "fortune"), { cle: "sabre-a-canne-de-fortune", qualite: "" });
  assert.deepEqual(L.outilDeQualite(D, "fusil-de-chasse", "fortune"), { cle: "fusil-de-chasse", qualite: "fortune" }, "sans sœur, le champ qualite");
});

test("jointure : démonter lit le matériau ; la chaux demande le four à chaux ; le digesteur vit du fumier de l'enclos à cabris", () => {
  assert.deepEqual(L.demontageInstallation({ niveau: 1 }, idx.installations.get("mur")).rend, { materiaux: 11 }, "la pierre sèche se reprend");
  assert.deepEqual(L.demontageInstallation({ niveau: 2 }, idx.installations.get("palissade")).rend, { materiaux: 10 }, "le bois sous tôle : la moitié");
  assert.deepEqual(L.demontageInstallation({ niveau: 2 }, idx.installations.get("palissade-de-bambou")).rend, { materiaux: 4 }, "le bambou : un quart");
  const chaux = D.recettes.find(r => r.cle === "chaux-de-coquillages");
  assert.deepEqual(chaux.requiert.installation, { cle: "four-a-chaux", niveau: 1 });
  assert.equal(L.peutFabriquer(chaux, { stocks: {}, installations: [] }).ok, false);
  assert.equal(L.peutFabriquer(chaux, { stocks: {}, installations: [I("four-a-chaux")] }).ok, true);
  const abri = vivant => ({ site: "ferme-de-la-plaine-des-cafres", region: "le-tampon", stocks: { eau: 50 }, vivant });
  const ins = [I("enclos-a-cabris"), I("digesteur-a-biogaz")];
  const plein = L.bilanAbri(abri(), ins, D, { jour: 10, personnes: 2 });
  const vide = L.bilanAbri(abri({ "enclos-a-cabris": { espece: "cabri", tetes: 0, sante: 3 } }), ins, D, { jour: 10, personnes: 2 });
  const seul = L.bilanAbri(abri(), [I("digesteur-a-biogaz")], D, { jour: 10, personnes: 2 });
  assert.ok(plein.production.gaz > 0, "des cabris : du gaz");
  assert.equal(vide.production.gaz ?? 0, 0, "un enclos vide : pas de fumier");
  assert.equal(seul.production.gaz ?? 0, 0);
});

test("jointure : les bêtes mortes d'un enclos rejoignent les corps de l'abri ; un agglutiné tue une bête d'enclos", () => {
  const ins = [I("enclos-a-cabris")];
  const abri = { site: "ferme-de-la-plaine-des-cafres", region: "le-tampon", stocks: { eau: 50, nourriture: 50 }, sol: 3,
    nature: L.natureInitiale(L.regionDe(D, "le-tampon")), vivant: { "enclos-a-cabris": { espece: "cabri", tetes: 6, sante: 0, manques: [] } } };
  const j = L.journeeAbri(abri, ins, D, { jour: 10, personnes: 0 });
  const morts = j.vivant.filter(e => e.cle === "vivant-morts").reduce((s, e) => s + e.params.n, 0);
  assert.ok(morts > 0);
  assert.equal(L.totalCorps(L.corpsDe(j.abri)), morts);
  // L'agglutiné : avancer d'un jour, huit Livides collés à l'abri, personne en ronde.
  const reg = L.siteDe(D, "ferme-de-la-plaine-des-cafres").region;
  const { monde: m0, etat } = L.demarrerPartie({ contenu: D, graine: "vague3-agglutines", region: reg, membres: ["a"] });
  const inst = L.installerAbri(m0, D, { site: "ferme-de-la-plaine-des-cafres", jour: 0 });
  const ab = { id: "abri", system: { ...inst.abri, stocks: { ...inst.abri.stocks, eau: 200, nourriture: 200 } }, installations: inst.installations };
  const avant = L.cheptelsDe(ab.system, ab.installations, D, { jour: 0 }).filter(c => c.genre === "betes").reduce((s, c) => s + c.tetes, 0);
  assert.ok(avant > 0, "la ferme a ses bêtes");
  const m = L.avecLieu(inst.monde, ab.system.site, { chaleur: 3, le: 0, agglutines: 8, leurreLe: null });
  const survivants = [{ id: "a", nom: "A", system: { ...L.survivantNeuf({ moral: 4 }), tache: "" } }];
  const r = L.avancer({ etat, monde: m, contenu: D, quarts: 4, survivants, abri: ab, options: { tournee: false } });
  assert.ok(r.etat.journal.some(x => x.cle === "agglutine-bete"), "dit au journal du groupe");
  assert.ok(L.totalCorps(L.corpsDe(r.acteurs.abri.system)) >= 1);
});

test("jointure : la salle verte donne son moral à la fête ; la ronde est dans la grille ; le rallumage garde les rencontres en fouille", () => {
  const vivants = [{ id: "a", system: { ...L.survivantNeuf({ moral: 2 }) } }];
  const etat = { fetes: [], groupe: { membres: ["a"], pnj: [] }, horloge: { quart: 0 } };
  const abri = installations => ({ system: { stocks: { nourriture: 20 } }, installations });
  const sans = L.feter(etat, abri([]), { fete: "x", annee: 1, survivants: vivants, installations: D });
  const avec = L.feter(etat, abri([I("salle-verte")]), { fete: "x", annee: 1, survivants: vivants, installations: D });
  assert.equal(avec.survivants[0].system.moral, sans.survivants[0].system.moral + 1);
  assert.equal(avec.salle, 1);
  assert.equal(L.feter(etat, abri([I("salle-verte", 1, { etat: 3 })]), { fete: "x", annee: 1, survivants: vivants, installations: D }).salle, 0, "hors service : rien");
  // La ronde : une tâche de la grille, sur demande.
  assert.ok(L.TACHES_GRILLE.includes("ronde"));
  const s = { ...L.survivantNeuf({ competences: { vigilance: { niveau: 2, marques: 0 } } }) };
  assert.equal(L.grilleParDefaut(s, "garde").ronde, 0);
  assert.equal(L.tacheParPriorite(s, { ronde: 1, garde: 2 }, L.travailDisponible({ abri: true }), D), "ronde");
  // Une région rallumée : moitié moins de rencontres, aussi en fouillant un lieu ; un facteur nul n'en tire aucune.
  const e = { ile: { regions: { mafate: { etat: "rallumee", depuis: 0 } } } };
  assert.equal(L.facteurRallumage(e, "mafate"), L.REGLES_PARADIS.rallumer.effets.rencontres);
  const { monde: m } = L.demarrerPartie({ contenu: D, graine: "vague3-rencontres", region: "mafate", membres: [] });
  const rencontres = facteur => {
    let n = 0;
    for (let i = 0; i < 40; i++) {
      const f = L.fouiller(m, D, deriverHasard("vague3", "lieu", i), { region: "mafate", cible: "lieu", genre: "case", membres: 2, quarts: 2, prudence: "rapide",
        facteurRencontre: facteur });
      assert.notEqual(f.ok, false);
      if (f.rencontre) n++;
    }
    return n;
  };
  assert.ok(rencontres(1) > 0, "des rencontres d'ordinaire");
  assert.equal(rencontres(0), 0, "le facteur passe jusqu'à la fouille d'un lieu");
});

// ------------------------------------------------------------------ l'API (doublure de Foundry)
async function partieALaFerme() {
  const M = await monde(M0);
  const hasard = creerHasard("vague3-api");
  const a = await survivantTire(M, { hasard });
  const b = await survivantTire(M, { hasard });
  await M.api.demarrer({ region: "le-tampon", membres: [a.id, b.id], graine: "vague3-api", essai: true });
  const ins = await M.api.installer({ site: "ferme-de-la-plaine-des-cafres" });
  await M.api.ajuster({ stocks: { nourriture: 80, eau: 60, graines: 6, plantes: 4, materiaux: 40, pieces: 10 }, raison: "réserves" });
  return { M, a, b, abri: game.actors.get(ins.abriId) };
}

test("API : abattre une bête portée (abattre({ beteId })), la mettre au cheptel de son espèce ; curer passe par l'entretien du lot 7", async () => {
  const { M, a, b, abri } = await partieALaFerme();
  assert.equal(M.api.enclore, undefined);
  assert.equal(M.api.relacher, undefined);
  await M.api.recevoirBete({ espece: "poule", n: 2 });
  const poule = M.api.etat().groupe.betes[0];
  const avant = abri.system.stocks.nourriture;
  const r = await M.api.abattre({ beteId: poule.id });
  assert.equal(r.viande, 2);
  assert.equal(abri.system.stocks.nourriture, avant + 2);
  assert.equal(M.api.etat().groupe.betes.length, 0);
  // Un porcelet trouvé (alias du cochon) va à la soue.
  await a.update({ system: { savoirs: [...new Set([...(a.system.savoirs ?? []), "elevage"])] } });
  await M.api.construire({ installation: "soue-a-cochons", quarts: 8, membres: [a.id, b.id] });
  await M.api.recevoirBete({ espece: "cochon", n: 1 });
  const e = await M.api.mettreEnEnclos({});
  assert.equal(e.betes[0].entrent, 1);
  assert.equal(M.api.cheptels().cheptels.find(x => x.cle === "soue-a-cochons").tetes, 1);
  // Curer des bacs de culture : un quart d'entretien (lot 7) ; l'eau propre.
  await M.api.construire({ installation: "bacs-de-culture", quarts: 4, membres: [a.id, b.id] });
  const q = M.api.quand().quart;
  const c = await M.api.curer({ installation: "bacs-de-culture", membres: [a.id] });
  assert.equal(c.soigne, true);
  assert.equal(M.api.quand().quart, q + 1);
  const bac = abri.items.contents.find(i => i.type === "installation" && i.system.cle === "bacs-de-culture");
  assert.equal(bac.system.suivi.le, Math.floor(q / 4), "soigné ce jour-là");
  assert.equal(bac.system.suivi.encrasse, false);
  await assert.rejects(() => M.api.curer({ installation: "soue-a-cochons" }), /rien à curer|SansFiltre|nothing to clean/i);
});
