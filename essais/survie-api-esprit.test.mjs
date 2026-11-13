// L'esprit et le sens moral dans la couche Foundry (complément du jeu 3D, familles 2 et 3 ; contrat §14), sur la doublure : le
// tirage porte l'esprit jusqu'à la fiche, un joueur choisit sa religion mais ne forge pas sa couleur, la porte (frapper, voter,
// accueillir, refuser), le point d'entrée du sens moral (colporter), le chef, sa parole et l'entente, la séparation et la fusion, le
// signe du cyclone, l'esprit tiré pour une fiche d'avant ; la fiche ne montre la couleur qu'à qui doit la voir.
// Lancer : npm run essais
import { test } from "node:test";
import assert from "node:assert/strict";
import { installerFoundry, calme, commeJoueur } from "./doublures/foundry-survie.mjs";
import { charger, monde, survivantTire } from "./doublures/survie-api-outils.mjs";
import * as L from "../systems/lakour-survie/logique/index.mjs";

installerFoundry();
const M0 = await charger();
const nouveauMonde = (options = {}) => monde(M0, options);
const { contexteSurvivant, contexteAbri } = await import("../systems/lakour-survie/scripts/apps/fiches.mjs");
const { contexteMJ } = await import("../systems/lakour-survie/scripts/apps/mj.mjs");
const { contexteCreation, nouvelleCreation, tirer, verrousPour } = await import("../systems/lakour-survie/scripts/apps/creation.mjs");

const FONCTIONS = ["communaute", "acteMoral", "ajusterEsprit", "tirerEsprit", "entente", "chef", "parole", "voter", "decider", "porte", "frapper", "tribut",
  "separer", "fusionner", "lireSigne"];

test("API : les fonctions de l'esprit et de la communauté ; le tirage porte l'esprit jusqu'à la fiche", async () => {
  const M = await nouveauMonde();
  for (const f of FONCTIONS) assert.equal(typeof M.api[f], "function", f);
  const d = M.api.generer({ statut: "joueur" });
  assert.ok(L.REGARDS.includes(d.regard) && d.religion, "regard et religion tirés");
  const a = await survivantTire(M, { userId: "u1" });
  for (const k of ["regard", "religion", "sensMoral", "autorite"]) assert.ok(a.system[k] !== undefined && a.system[k] !== "", k);
  assert.equal(a.system.reputation, 0);
  // Le joueur garde sa religion choisie aux relances (verrou de l'esprit).
  const etat = nouvelleCreation();
  tirer(etat);
  etat.tirage.religion = "plusieurs"; etat.tirage.religions = ["catholique", "hindouisme-tamoul"]; etat.verrous.esprit = true;
  assert.deepEqual(verrousPour(etat).religions, ["catholique", "hindouisme-tamoul"]);
  tirer(etat);
  assert.equal(etat.tirage.religion, "plusieurs");
  const ctx = contexteCreation(etat);
  assert.ok(ctx.esprit.plusieurs && ctx.esprit.religionsMultiples.filter(o => o.choisi).length === 2);
});

test("création par un joueur : il change sa religion avant de valider ; une couleur ou une autorité forgées sont refusées", async () => {
  const M = await nouveauMonde();
  const t = M.api.generer({ statut: "joueur" });
  const choisi = { ...t, religion: "aucune", religions: [], ancrage: "photo", pratique: true };
  const { tirageDuGenerateur } = M.module;
  assert.equal(tirageDuGenerateur(choisi), true, "religion et ancrage changés : accepté");
  assert.equal(tirageDuGenerateur({ ...t, sensMoral: 9 }), false, "sens moral forgé");
  assert.equal(tirageDuGenerateur({ ...t, autorite: 5 }), false, "autorité forgée");
  assert.equal(tirageDuGenerateur({ ...t, reputation: 3 }), false, "réputation forgée");
  assert.equal(tirageDuGenerateur({ ...t, religion: "inconnue" }), false);
  assert.equal(tirageDuGenerateur({ ...t, religion: "plusieurs", religions: ["islam"] }), false, "« plusieurs » avec une seule");
  const demande = commeJoueur("u2", () => M.api.creerSurvivant({ donnees: choisi, rejoindre: false }));
  await calme();
  const cree = game.actors.get((await demande).acteurId);
  assert.deepEqual([cree.system.religion, cree.system.ancrage, cree.system.pratique], ["aucune", "photo", true]);
});

test("la porte : on frappe, on vote, on accueille (une recrue, des bouches) ; qui a voté contre ne bleuit pas ; on refuse ensuite", async () => {
  const M = await nouveauMonde();
  const a = await survivantTire(M, { userId: "u1" });
  const b = await survivantTire(M, { statut: "compagnon" });
  const c = await survivantTire(M, { statut: "compagnon" });
  // Trois adultes : le générateur tire parfois un jeune de 16 ou 17 ans, qui serait un enfant témoin de l'acte (moralite.mjs) et un
  // jeune qui ne peut pas mener (releve.mjs) ; les tirages ont bougé à la fusion des lots.
  for (const x of [a, b, c]) if (Number(x.system.age) < 18) await x.update({ system: { age: 30 } });
  await M.api.demarrer({ region: "saint-leu", membres: [a.id, b.id, c.id], graine: "essai-porte", essai: true });
  await M.api.installer({ site: "case-creole-du-piton" }).catch(() => M.api.installer({ site: L.liste(M.api.contenu().sites).find(s => s.region === "saint-leu").cle }));
  await M.api.chef({ acteurId: a.id });
  assert.equal(M.api.etat().groupe.chef, a.id);
  const sens = id => game.actors.get(id).system.sensMoral;
  const avant = { a: sens(a.id), b: sens(b.id), c: sens(c.id) };
  // Un vote : le joueur dit sa voix, les compagnons votent selon leur jauge ; on force ici celle de c « contre ».
  const vote = await M.api.voter({ question: "On ouvre ?", acte: "accueillir", voix: { [a.id]: "pour", [c.id]: "contre" } });
  assert.equal(vote.voix[a.id], "pour");
  assert.ok(["pour", "contre"].includes(vote.voix[b.id]), "la voix du compagnon, d'après sa jauge");
  const v = await M.api.frapper({ profil: "famille" });
  assert.ok(M.api.etat().porte.some(x => x.id === v.id), "le visiteur attend à la porte (public)");
  assert.ok(!JSON.stringify(M.api.etat().porte).includes("sensMoral"), "sa couleur reste au monde scellé");
  assert.ok(M.api.monde().porte[v.id].survivant, "le MJ voit qui il est");
  const r = await M.api.porte({ visiteurId: v.id, decision: "accueillir", voteId: vote.id });
  const recrue = game.actors.get(r.acteurId);
  assert.equal(recrue.system.statut, "recrue");
  assert.ok(M.api.etat().groupe.membres.includes(recrue.id));
  assert.equal(M.api.etat().groupe.pnj.length, r.bouches, "les siens : des bouches en plus");
  assert.equal(sens(a.id), avant.a + 1);
  assert.equal(sens(c.id), avant.c, "c a voté contre l'accueil : il ne bleuit pas");
  assert.equal(M.api.etat().groupe.accueilLe, L.jourDe(M.api.etat().horloge.quart));
  // Un dur, refusé avec des circonstances atténuantes : la jauge rougit, la réputation ne bouge pas.
  const d = await M.api.frapper({ profil: "dur" });
  const rep = game.actors.get(a.id).system.reputation;
  const s2 = sens(a.id);
  await M.api.porte({ visiteurId: d.id, decision: "refuser", circonstances: true });
  assert.equal(sens(a.id), s2 - 1);
  assert.equal(game.actors.get(a.id).system.reputation, rep, "les témoins savaient : plus de place");
  assert.ok(M.api.etat().journal.some(e => e.cle === "porte-refuse"));
  await assert.rejects(() => M.api.porte({ visiteurId: d.id, decision: "accueillir" }), /personne/);
  // La liste à la porte, publique, sur la fiche d'abri.
  const abri = game.actors.get(M.api.etat().groupe.abri);
  assert.ok(contexteAbri(abri).porte, "la fiche d'abri montre la porte");
});

test("le point d'entrée du sens moral (la rumeur : colporter), le chef, sa parole, l'entente, le signe, séparer et fusionner", async () => {
  const M = await nouveauMonde();
  const ids = [];
  for (let i = 0; i < 4; i++) ids.push((await survivantTire(M, { statut: i ? "compagnon" : "joueur", userId: i ? "" : "u1" })).id);
  await M.api.demarrer({ region: "saint-denis", membres: ids, graine: "essai-communaute", essai: true });
  const [a, b, c, d] = ids.map(id => game.actors.get(id));
  const s0 = a.system.sensMoral, r0 = a.system.reputation;
  const r = await M.api.acteMoral({ acteurId: a.id, acte: "colporter" });
  assert.equal(a.system.sensMoral, Math.max(-10, s0 - 1), "celui qui colporte du mal rougit");
  assert.equal(a.system.reputation, Math.max(-10, r0 - 1));
  assert.equal(r.membres[0].delta, -1);
  await M.api.acteMoral({ acteurId: b.id, delta: 2 });
  await assert.rejects(() => M.api.acteMoral({ acteurId: b.id, acte: "voler" }), /Acte inconnu|ActeInconnu/);
  await M.api.chef({ acteurId: a.id });
  const au = a.system.autorite;
  await M.api.parole({ tenue: true, raison: "les vivres partagés" });
  assert.equal(a.system.autorite, Math.min(5, au + 1));
  await M.api.entente({ delta: 2 });
  assert.equal(M.api.communaute().entente, 2);
  const lec = await M.api.lireSigne();
  assert.equal(lec.lectures.length, 4);
  // Séparer : c et d partent avec leur part ; les plans restent à tous ; puis on se refond.
  await M.api.ajuster({ stocks: { eau: 20, nourriture: 20 } });
  const sep = await M.api.separer({ partants: [c.id, d.id], nom: "Ceux de la ravine" });
  assert.deepEqual(M.api.etat().groupe.membres.sort(), [a.id, b.id].sort());
  assert.equal(sep.communaute.stocks.eau + M.api.etat().groupe.porte.eau, 20, "les stocks partagés");
  assert.equal(c.system.statut, "pnj");
  const fus = await M.api.fusionner({ communauteId: sep.communaute.id });
  assert.equal(fus.membres.length, 4);
  assert.equal(M.api.etat().groupe.porte.eau, 20);
  assert.equal(c.system.statut, "compagnon", "il reprend son statut");
  assert.equal(M.api.etat().communautes.length, 0);
  assert.equal(fus.entente, 1, "l'entente repart de la plus basse, moins un");
  // La fenêtre du MJ : l'onglet de la communauté.
  const mj = contexteMJ("communaute");
  assert.ok(mj.communaute && mj.communaute.membres.length === 4);
  assert.ok(mj.onglets.some(o => o.cle === "communaute"));
});

test("une fiche d'avant : pas d'esprit (aucun effet) ; le MJ le tire ; la fiche ne montre la couleur qu'à qui doit la voir", async () => {
  const M = await nouveauMonde();
  const vieux = await Actor.implementation.create({ name: "Tonton Fred", type: "survivant", system: { competences: {}, moral: 4, age: 50 }, ownership: { default: 0, u1: 3 } });
  assert.equal(L.espritActif(vieux.system), false);
  assert.equal(contexteSurvivant(vieux, { gm: true }).esprit.actif, false);
  const r = await M.api.tirerEsprit({ acteurId: vieux.id });
  assert.ok(L.REGARDS.includes(vieux.system.regard), "tiré par le MJ");
  assert.equal((await M.api.tirerEsprit({ acteurId: vieux.id })).deja, true, "pas deux fois sans forcer");
  assert.equal(r.reputation, 0);
  await M.api.ajusterEsprit({ acteurId: vieux.id, sensMoral: -7, chance: 2 });
  assert.equal(vieux.system.sensMoral, -7);
  assert.equal(L.espritDe(vieux.system).chance, 2);
  // Réglage par défaut « soi » : le propriétaire et le MJ voient la couleur ; un autre joueur, la réputation seulement.
  assert.ok(contexteSurvivant(vieux, { gm: false, proprietaire: true }).esprit.sens);
  assert.equal(contexteSurvivant(vieux, { gm: false, proprietaire: false }).esprit.sens, null);
  assert.ok(contexteSurvivant(vieux, { gm: false, proprietaire: false }).esprit.reputation);
  assert.equal(contexteSurvivant(vieux, { gm: false, proprietaire: true }).esprit.chance, null, "la chance ne se montre pas au joueur");
  await game.settings.set("lakour-survie", "visibiliteSensMoral", "mj");
  assert.equal(contexteSurvivant(vieux, { gm: false, proprietaire: true }).esprit.sens, null, "« seulement le MJ »");
  await game.settings.set("lakour-survie", "visibiliteSensMoral", "tous");
  assert.ok(contexteSurvivant(vieux, { gm: false, proprietaire: false }).esprit.sens, "« tout le monde »");
});
