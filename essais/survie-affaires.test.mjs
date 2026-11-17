// Les affaires de l'île (lot 12 « Affaires, récits et fêtes », 2026-11-17 ; contrat §17) : la logique pure
// (systems/lakour-survie/logique/affaires.mjs) sur le VRAI contenu de lakour-fenoir, puis l'API en lecture sur la doublure de Foundry,
// et les fêtes hors du socle (Pongal, le miel vert) que le système date et fête.
// Lancer : npm run essais
import { test } from "node:test";
import assert from "node:assert/strict";
import * as L from "../systems/lakour-survie/logique/index.mjs";
import { donnees } from "../modules/lakour-fenoir/contenu/index.mjs";
import { installerFoundry } from "./doublures/foundry-survie.mjs";
import { charger, monde, survivantTire } from "./doublures/survie-api-outils.mjs";
import * as FL from "../modules/lakour-mj-ia/scripts/fetes-logique.js";

const D = donnees();
const cles = (ctx) => L.affairesPossibles(D, ctx).map(a => a.cle);

test("naissance : la région, le mois, la phase, la fête à venir, le cran d'un front, un déclencheur, les affaires closes", () => {
  // Cilaos en octobre, pendant le silence : la foire aux lentilles ; pas en juin.
  assert.ok(cles({ region: "cilaos", mois: 10, phase: "silence", fetes: [] }).includes("les-lentilles-d-octobre"));
  assert.ok(!cles({ region: "cilaos", mois: 6, phase: "silence", fetes: [] }).includes("les-lentilles-d-octobre"));
  assert.ok(!cles({ region: "cilaos", mois: 10, phase: "panique", fetes: [] }).includes("les-lentilles-d-octobre"), "pas pendant la panique");
  assert.ok(!cles({ region: "mafate", mois: 10, phase: "silence", fetes: [] }).includes("les-lentilles-d-octobre"), "ailleurs, non");
  // Une affaire de fête : seulement quand la fête approche (si le contexte dit les fêtes).
  assert.ok(cles({ region: "saint-paul", mois: 11, phase: "silence", fetes: ["dipavali"] }).includes("une-seule-lampe"));
  assert.ok(!cles({ region: "saint-paul", mois: 11, phase: "silence", fetes: [] }).includes("une-seule-lampe"));
  // Le cran d'un front.
  const tampon = { region: "le-tampon", mois: 7, phase: "silence", fetes: [] };
  assert.ok(!cles({ ...tampon, fronts: { fournaise: 0 } }).includes("les-aiguilles-de-bourg-murat"));
  assert.ok(cles({ ...tampon, fronts: { fournaise: 1 } }).includes("les-aiguilles-de-bourg-murat"));
  // Un déclencheur : il faut que le MJ le dise.
  assert.ok(!cles({ region: "saint-paul", phase: "silence", fetes: [] }).includes("celui-qu-on-a-refuse"));
  assert.ok(cles({ region: "saint-paul", phase: "silence", fetes: [], declencheurs: ["refus-a-la-porte"] }).includes("celui-qu-on-a-refuse"));
  // Close : plus jamais.
  assert.ok(!cles({ region: "cilaos", mois: 10, phase: "silence", fetes: [], closes: ["les-lentilles-d-octobre"] }).includes("les-lentilles-d-octobre"));
  // Sans contexte, tout ce qui n'attend pas un déclencheur.
  assert.equal(cles({}).length, D.affaires.filter(a => !(a.naissance.declencheurs ?? []).length).length);
  // Le cargo est là dès la panique, et partout où le groupe entend la radio du Port (région du Port seulement : il faut y être).
  assert.ok(cles({ region: "le-port", phase: "panique" }).includes("le-cargo"));
});

test("vérité : tirée selon ses poids, gardée par le MJ ; une rumeur sur une communauté est toujours fausse", () => {
  const tunnel = L.affaireDe(D, "le-tunnel-aux-vivres");
  const hasard = L.creerHasard("AFFAIRES-VERITE-0001");
  const compte = { vraie: 0, fausse: 0 };
  for (let i = 0; i < 2000; i++) compte[L.tirerVerite(tunnel, hasard).cle]++;
  assert.ok(compte.vraie > 850 && compte.vraie < 1150, `une fois sur deux : ${compte.vraie}`);
  const liste = L.affaireDe(D, "la-liste-du-comptable");
  let pieges = 0;
  for (let i = 0; i < 2000; i++) if (L.tirerVerite(liste, hasard).cle === "piege") pieges++;
  assert.ok(pieges > 400 && pieges < 600, `un piège une fois sur quatre : ${pieges}`);
  for (const cle of ["le-service-dans-la-nuit", "les-derniers-arrives"]) {
    assert.deepEqual(Object.keys(L.affaireDe(D, cle).verites), ["fausse"], `${cle} : le jeu ne donne jamais raison à la rumeur`);
  }
  assert.equal(L.tirerVerite(tunnel, () => 0).cle, "vraie");
  assert.equal(L.tirerVerite(tunnel, () => 0.99).cle, "fausse");
});

test("tirer une affaire : parmi les possibles, avec sa vérité et une voix ; ou celle qu'on nomme ; rien si rien n'est possible", () => {
  const ctx = { region: "le-port", mois: 3, phase: "panique", fetes: [] };
  const t = L.tirerAffaire(D, ctx, L.creerHasard("AFFAIRES-TIRAGE-0001"));
  assert.ok(L.affairesPossibles(D, ctx).some(a => a.cle === t.cle));
  const a = L.affaireDe(D, t.cle);
  assert.ok(Object.keys(a.verites).includes(t.verite.cle) && a.voix.includes(t.voix));
  assert.equal(t.pente, a.pente.crans[0]);
  const nommee = L.tirerAffaire(D, ctx, () => 0.5, { cle: "rendre-a-la-lave" });
  assert.equal(nommee.cle, "rendre-a-la-lave");
  assert.equal(nommee.front, "remede");
  assert.equal(L.tirerAffaire(D, { region: "mafate", mois: 3, phase: "jour-zero", fetes: [] }, () => 0.5), null, "au jour zéro à Mafate, rien ne naît");
  assert.equal(L.tirerAffaire(D, ctx, () => 0.5, { cle: "inconnue" }), null);
});

test("la pente : un cran tous les tant de jours, jusqu'au dernier ; une issue rend ses effets (copie)", () => {
  const cargo = L.affaireDe(D, "le-cargo");
  assert.deepEqual(L.cranDeLaPente(cargo, 0), { cran: 0, texte: "", fin: false });
  assert.equal(L.cranDeLaPente(cargo, 29).cran, 0);
  assert.equal(L.cranDeLaPente(cargo, 65).cran, 2);
  const fin = L.cranDeLaPente(cargo, 1000);
  assert.equal(fin.cran, cargo.pente.crans.length);
  assert.equal(fin.fin, true);
  assert.equal(fin.texte, cargo.pente.crans.at(-1));
  const viaduc = L.affaireDe(D, "le-viaduc");
  const i = L.issueDe(viaduc, "route-ouverte");
  assert.equal(i.effets.voie, "ouverte");
  i.effets.voie = "fermee";
  assert.equal(L.issueDe(viaduc, "route-ouverte").effets.voie, "ouverte", "une copie");
  assert.equal(L.issueDe(viaduc, "inconnue"), null);
});

test("erreursAffaire : le vrai contenu passe ; chaque règle se casse (mutations)", () => {
  for (const a of D.affaires) assert.deepEqual(L.erreursAffaire(a, D), [], a.cle);
  const base = () => structuredClone(L.affaireDe(D, "le-vieux-chemin-pave"));
  const casse = (f, motif) => { const a = base(); f(a); assert.ok(L.erreursAffaire(a, D).some(e => motif.test(e)), `${motif} : ${L.erreursAffaire(a, D).join(" ; ")}`); };
  casse(a => { a.taille = "enorme"; }, /taille/);
  casse(a => { a.regions = ["atlantide"]; }, /région/);
  casse(a => { a.sites = ["nulle-part"]; }, /site/);
  casse(a => { a.factions = ["les-inconnus"]; }, /faction/);
  casse(a => { a.front = "la-lune"; }, /front/);
  casse(a => { a.naissance.mois = [13]; }, /mois/);
  casse(a => { a.naissance.phases = ["demain"]; }, /phase/);
  casse(a => { a.naissance.fete = "carnaval"; }, /fête/);
  casse(a => { a.naissance.declencheurs = ["une-envie"]; }, /déclencheur/);
  casse(a => { a.verites = {}; }, /aucune vérité/);
  casse(a => { a.verites.vraie.poids = 0; }, /vérité/);
  casse(a => { a.verites.certaine = { poids: 1, texte: "x" }; }, /vérité « certaine »/);
  casse(a => { a.pente.crans = []; }, /pente/);
  casse(a => { a.issues = a.issues.slice(0, 2); }, /issues/);
  casse(a => { a.issues[0].effets.miracle = 3; }, /effet inconnu/);
  casse(a => { a.issues[0].effets.acte = "voler"; }, /acte/);
  casse(a => { a.issues[0].effets.reputation = { "les-inconnus": 1 }; }, /reputation/);
  casse(a => { a.issues[0].effets.stocks = { or: 3 }; }, /stocks/);
  casse(a => { a.issues[0].effets.savoir = "voler"; }, /savoir/);
  casse(a => { a.issues[0].effets.plan = "chateau"; }, /plan/);
  casse(a => { a.front = ""; a.naissance.cran = 0; a.issues[0].effets.front = 1; }, /front/);
  casse(a => { a.voix = a.voix.slice(0, 2); }, /voix/);
  casse(a => { a.apprendre = " "; }, /apprendre vide/);
});

// ---------------------------------------------------------------- L'API (lecture) et les fêtes hors du socle, sur la doublure
installerFoundry();
const M0 = await charger();

async function partie({ dateDepart = "2026-12-01", region = "saint-paul" } = {}) {
  const M = await monde(M0);
  const a = await survivantTire(M, { userId: "u1", verrous: { age: 30 } });
  const c = await survivantTire(M, { statut: "compagnon", verrous: { age: 40 } });
  await M.api.demarrer({ region, membres: [a.id, c.id], graine: "GRAINE-AFFAIRES-001", essai: true, dateDepart });
  const site = M.api.contenu().sites.find(s => s.region === region);
  await M.api.installer({ site: site.cle });
  await M.api.ajuster({ stocks: { nourriture: 40 } });
  return { M, a, c, abri: game.actors.get(M.api.etat().groupe.abri) };
}

test("API : les affaires qui peuvent naître ici et maintenant (région du groupe, mois, phase, fêtes à venir, fronts du moteur), et leur tirage", async () => {
  const { M } = await partie();
  // Le moteur : son calendrier des fêtes (le vrai socle) et ses horloges (le front de la Fournaise au cran 1).
  const moteur = game.modules.get("lakour-mj-ia");
  moteur.api.fetes = { calendrier: d => FL.fetesDuJour(d, { aussi: FL.IDS_SUR_DEMANDE }) };
  const cransMoteur = { "front-fournaise": 1 };
  moteur.api.horloges = { trouver: id => (id in cransMoteur ? { id, valeur: cransMoteur[id] } : null) };
  const r = M.api.affaires();
  assert.equal(r.contexte.region, "saint-paul");
  assert.equal(r.contexte.mois, 12);
  assert.equal(r.contexte.phase, "jour-zero");
  assert.ok(r.contexte.fetes.includes("liberte") && r.contexte.fetes.includes("noel"), "les fêtes des trente jours qui viennent");
  assert.ok(r.affaires.some(a => a.cle === "le-kabar-du-20-desanm"), "le 20 décembre approche : qui sait tendre une peau ?");
  assert.ok(!r.affaires.some(a => a.cle === "le-cargo"), "le cargo n'est pas à Saint-Paul");
  assert.ok(!M.api.affaires({ horizon: 0 }).affaires.some(a => a.cle === "le-kabar-du-20-desanm"), "sans horizon, le 20 décembre est trop loin");
  // Le contexte se donne à la main : une autre région, une phase, un front.
  const tampon = M.api.affaires({ region: "le-tampon", phase: "silence" });
  assert.equal(tampon.contexte.fronts.fournaise, 1, "lu dans l'horloge front-fournaise du moteur");
  assert.ok(tampon.affaires.some(a => a.cle === "les-aiguilles-de-bourg-murat"));
  assert.ok(!M.api.affaires({ region: "le-tampon", phase: "silence", fronts: { fournaise: 0 } }).affaires.some(a => a.cle === "les-aiguilles-de-bourg-murat"), "le cran donné l'emporte");
  const t = M.api.tirerAffaire({ cle: "rendre-a-la-lave" });
  assert.ok(["vraie", "exageree"].includes(t.verite.cle));
  assert.equal(M.api.penteAffaire({ cle: "le-cargo", jours: 65 }).cran, 2);
  assert.equal(M.api.issueAffaire({ cle: "le-viaduc", issue: "la-horde" }).effets.horde, true);
  assert.equal(M.api.penteAffaire({ cle: "inconnue" }), null);
  // Lire n'écrit rien dans la partie.
  assert.ok(!("affaires" in M.api.etat()));
});

test("fêtes hors du socle : Pongal et le miel vert se datent eux-mêmes ; on les fête avec leur gain et leur coût", async () => {
  const { M, abri } = await partie({ dateDepart: "2027-01-14" });
  const jour = M.api.fetesDuJour("2027-01-14");
  assert.deepEqual(jour.map(f => [f.cle, f.coeur]), [["pongal", true]]);
  assert.deepEqual(M.api.fetesDuJour("2027-01-30").map(f => f.cle), ["fete-du-miel-vert"]);
  assert.ok(M.api.quand().fetes.some(f => f.cle === "pongal"), "le bandeau dit la fête");
  const avant = abri.system.stocks.nourriture;
  const r = await M.api.feter({ fete: "pongal" });
  assert.equal(r.ok, true);
  assert.equal(r.quarts, 1);
  assert.equal(abri.system.stocks.nourriture, avant - 2, "deux personnes, une ration de riz au lait chacune");
  assert.ok(M.api.etat().souvenirs.some(s => s.source === "pongal"), "quatre jours où le moral remonte plus haut");
  await assert.rejects(() => M.api.feter({ fete: "pongal" }), /déjà|already/i);
  const miel = await M.api.feter({ fete: "fete-du-miel-vert" });
  assert.deepEqual(miel.gain, { nourriture: 1, medicaments: 1 });
});
