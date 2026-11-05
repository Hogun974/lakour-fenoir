// L'API game.lakourSurvie du système lakour-survie (couche Foundry), éprouvée sans Foundry sur une doublure en mémoire
// (essais/doublures/foundry-survie.mjs) avec le VRAI contenu de lakour-fenoir et le VRAI coffre du MJ IA :
// - toutes les fonctions du contrat (§5) et celles que le MJ IA suppose (modules/lakour-mj-ia/docs/survie.md) ;
// - une partie complète : démarrer au jour 0, deux survivants tirés au générateur (l'un créé par la demande d'un joueur), s'installer,
//   fouiller, construire citerne et potager, avancer 30 jours, déménager, recruter, fêter, un assaut, l'atelier, une maladie ;
// - la garde d'écriture hors du MJ actif, le test et la tâche demandés par le joueur propriétaire (socket, émetteur du serveur).
// Lancer : npm run essais
import { test } from "node:test";
import assert from "node:assert/strict";
import { installerFoundry, messages, emissions, journalHooks, calme, erreurs, commeJoueur, valeur } from "./doublures/foundry-survie.mjs";
import { charger, monde, survivantTire } from "./doublures/survie-api-outils.mjs";
import { peutFaire } from "../systems/lakour-survie/logique/index.mjs";

installerFoundry();
const M0 = await charger();
const nouveauMonde = (options = {}) => monde(M0, options);

const FONCTIONS = ["contenu", "etat", "monde", "quand", "demarrer", "avancer", "test", "forcer", "explorer", "fouiller", "installer", "construire",
  "reparer", "voyager", "demenager", "ajuster", "blesser", "soigner", "infecter", "marquer", "assaut", "rencontre", "renseigner", "bilan",
  "fabriquer", "affliction", "feter", "generer", "besoins", "genererRecrue", "recruter", "assigner", "ajouterMembre", "oublier"];

test("API : toutes les fonctions du contrat (§5) et celles que le MJ IA suppose", async () => {
  const M = await nouveauMonde();
  for (const f of FONCTIONS) assert.equal(typeof M.api[f], "function", f);
  const c = M.api.contenu();
  for (const f of ["regions", "sites", "installations", "savoirs", "factions", "evenements", "passes", "equipements", "recettes", "afflictions", "creatures", "enfances", "traits", "fetes"]) {
    assert.ok(Array.isArray(c[f]) && c[f].length, `contenu().${f}`);
  }
  assert.deepEqual(M.registre.erreurs(), [], "le registre normalisé passe verifierContenu");
  assert.equal(M.api.monde(), null, "pas de monde avant la partie");
  assert.equal(M.api.etat().demarree, false);
});

test("hors du MJ actif, tout ce qui écrit refuse (PasMJActif) ; la lecture reste possible", async () => {
  const M = await nouveauMonde();
  const a = await survivantTire(M);
  await M.api.demarrer({ region: "saint-denis", membres: [a.id] });
  for (const [nom, args] of [["avancer", { quarts: 1 }], ["demarrer", { region: "saint-denis" }], ["fouiller", {}], ["explorer", { region: "saint-denis" }],
    ["installer", { site: "villa-rue-de-paris" }], ["ajuster", { stocks: { eau: 3 } }], ["assaut", { force: 2 }], ["feter", { fete: "noel" }],
    ["renseigner", { region: "sainte-marie" }], ["marquer", { acteurId: a.id, competence: "tir" }], ["ajouterMembre", { acteurId: a.id }]]) {
    await commeJoueur("u1", () => assert.rejects(() => M.api[nom](args), /PasMJActif/, nom));
  }
  // Un autre MJ, qui n'est pas l'actif, est refusé aussi.
  game.users.set("mj2", { id: "mj2", name: "Autre MJ", isGM: true, active: true });
  game.users.choisirActif("mj2");
  await assert.rejects(() => M.api.avancer({ quarts: 1 }), /PasMJActif/);
  assert.equal(M.api.monde(), null, "monde() : null hors du MJ actif");
  assert.equal(M.api.etat().horloge.quart, 0, "rien n'a bougé");
  assert.ok(M.api.quand().dateTexte, "quand() reste lisible");
});

test("partie complète : jour 0, deux survivants tirés, installation, fouille, citerne et potager, 30 jours, déménagement, recrue, fête", async () => {
  const M = await nouveauMonde();
  // 1. Deux survivants par le générateur : l'un créé par le MJ, l'autre demandé par le joueur u2 (socket : le MJ actif le crée).
  const a = await survivantTire(M, { userId: "u1" });
  assert.equal(a.ownership.u1, 3, "le joueur est propriétaire de son survivant");
  assert.equal(game.users.get("u1").character?.id, a.id);
  const tirage = M.api.generer({ statut: "joueur" });
  const somme = Object.values(tirage.competences).reduce((s, n) => s + n, 0);
  assert.ok(somme >= 10 && somme <= 16, `budget de départ : ${somme}`);
  const demande = commeJoueur("u2", () => M.api.creerSurvivant({ donnees: tirage, rejoindre: false }));
  await calme();
  const cree = await demande;
  const b = game.actors.get(cree.acteurId);
  assert.ok(b && b.ownership.u2 === 3, "le survivant du joueur u2 est à lui");
  assert.equal(b.system.statut, "joueur");
  assert.deepEqual(Object.fromEntries(Object.entries(b.system.competences).map(([k, v]) => [k, v.niveau])), tirage.competences);

  // 2. Démarrer au jour 0 à Saint-Leu.
  const d = await M.api.demarrer({ region: "saint-leu", membres: [a.id, b.id], graine: "essai-complet", essai: true, pnj: [{ nom: "Tantine Josette", passe: "retraitee" }] });
  assert.equal(d.quand.jour, 0);
  assert.equal(d.quand.date, "2026-12-04");
  assert.equal(M.api.etat().groupe.pnj[0].nom, "Tantine Josette");
  assert.equal(M.api.etat().renseignements["saint-leu"].vu, 0, "la région de départ est vue au jour 0");
  assert.ok(M.api.monde().coupures["saint-leu"], "le monde réel existe chez le MJ actif");

  // 3. Fouiller des graines (le groupe n'a pas d'abri : il les porte), puis s'installer : le portage entre dans les stocks.
  const f = await M.api.fouiller({ cible: "graines", quarts: 1, prudence: "normal" });
  assert.equal(M.api.etat().horloge.quart, 1, "une fouille coûte un quart");
  const porte = M.api.etat().groupe.porte.graines;
  assert.equal(porte, f.butin.graines ?? 0);
  assert.equal(M.api.etat().fouilleLe, 0, "noterFouille");
  const ins = await M.api.installer({ site: "sucrerie-de-stella" });
  const abri = game.actors.get(ins.abriId);
  assert.equal(abri.type, "abri");
  assert.equal(abri.ownership.default, 2, "les joueurs observent l'abri");
  assert.equal(M.api.etat().groupe.abri, abri.id);
  assert.ok(abri.items.some(i => i.type === "installation" && i.system.cle === "mur"), "installations de départ du site");
  assert.ok(abri.system.stocks.graines >= porte, "le portage est entré dans les stocks");
  assert.equal(game.journal.find(j => j.getFlag("lakour-survie", "chroniques"))?.pages.size, 1, "chroniques : un chapitre par abri");

  // 4. Construire la citerne (payée au premier quart) et le potager.
  if (abri.system.stocks.graines < 2) await M.api.ajuster({ stocks: { graines: 2 }, raison: "un sachet trouvé" });
  const materiaux = abri.system.stocks.materiaux;
  const ci = await M.api.construire({ installation: "citerne-de-pluie", quarts: 3, membres: [a.id, b.id] });
  assert.equal(ci.termine, true, "6 quarts-personne à deux en 3 quarts");
  assert.equal(abri.system.stocks.materiaux, materiaux - 4, "coût payé");
  assert.ok(M.api.etat().groupe.plans.includes("citerne-de-pluie"), "plan acquis");
  const po = await M.api.construire({ installation: "potager", quarts: 2, membres: [a.id, b.id] });
  assert.equal(po.termine, false);
  assert.deepEqual(po.chantier, { fait: 4, requis: 8 });
  const po2 = await M.api.construire({ installation: "potager", quarts: 2, membres: [a.id, b.id] });
  assert.equal(po2.termine, true, "le chantier ouvert n'est pas repayé");
  assert.equal(abri.items.find(i => i.system.cle === "potager").system.niveau, 1);
  await assert.rejects(() => M.api.construire({ installation: "tunnel-de-lave-amenage" }), /Impossible de construire/);

  // Les tâches : chacun la sienne ; le joueur choisit la sienne par le MJ actif.
  await M.api.assigner({ acteurId: a.id, tache: "cultures" });
  // (le survivant de u2 est tiré au hasard : une incapacité, « violence » ou « nuit », peut lui interdire la garde)
  const tacheB = ["garde", "eau", "fouille", "chantier"].find(x => peutFaire(b.system, x));
  const choix = commeJoueur("u2", () => M.api.assigner({ acteurId: b.id, tache: tacheB }));
  await calme();
  assert.equal((await choix).tache, tacheB);
  assert.equal(b.system.tache, tacheB);
  await commeJoueur("u1", () => assert.rejects(() => M.api.assigner({ acteurId: b.id, tache: "repos" }), /PasProprietaire/));

  // 5. Trente jours passent, avec des vivres pour tenir.
  await M.api.ajuster({ stocks: { nourriture: 90, eau: 30 }, raison: "réserve d'une épicerie" });
  const avant = M.api.etat().journal.length;
  const j0 = M.api.quand().jour;
  const av = await M.api.avancer({ quarts: 120, raison: "un mois au camp" });
  assert.equal(av.quand.jour, j0 + 30);
  assert.equal(av.quand.phase, "silence");
  assert.ok(M.api.etat().journal.length > avant, "le journal public avance");
  assert.ok(Array.isArray(M.api.monde().menaces), "les menaces du jour sont gardées au monde réel");
  assert.ok(journalHooks.some(h => h.nom === "lakourSurvie.avance"), "crochet lakourSurvie.avance");
  const h = journalHooks.filter(x => x.nom === "lakourSurvie.avance").at(-1);
  assert.equal(h.args[0].jour, j0 + 30);
  assert.ok(h.args[1].every(f => f.public === true), "le crochet ne porte que des faits publics");
  const bilan = M.api.bilan();
  for (const k of ["production", "consommation", "net", "defense", "discretion", "visibilite", "capacite", "joursDeStocks"]) assert.ok(k in bilan, `bilan.${k}`);
  assert.ok(M.api.etat().bilan?.joursDeStocks, "l'instantané public du bilan (pour les joueurs)");
  for (const s of [a, b]) {
    assert.ok(s.system.moral >= 0 && s.system.moral <= 5);
    assert.ok(s.system.fatigue >= 0 && s.system.fatigue <= 5);
  }

  // 6. Un assaut contre l'abri : carte publique, résolution §1.7.
  const as = await M.api.assaut({ force: 2, type: "Livides errants", description: "Ils grattent au portail." });
  assert.ok(["repoussee", "endommagee", "breche"].includes(as.issue));
  assert.ok(messages.some(m => m.content.includes("survie-assaut")));
  assert.ok(journalHooks.some(x => x.nom === "lakourSurvie.assaut"));

  // 7. L'atelier : une lance (1 matériau, 1 quart).
  const avantMat = abri.system.stocks.materiaux;
  const fab = await M.api.fabriquer({ recette: "lance", acteurId: a.id });
  assert.equal(fab.ok, true);
  assert.ok(abri.system.stocks.materiaux < avantMat || !fab.reussite);
  if (fab.reussite) assert.ok(a.items.some(i => i.type === "equipement" && i.system.cle === "lance-de-fortune"), "l'objet fabriqué est sur l'artisan");

  // 8. Une maladie, donnée puis soignée.
  await M.api.affliction({ acteurId: a.id, cle: "fracture", action: "donner" });
  assert.ok(a.system.afflictions.some(x => x.cle === "fracture"));
  await M.api.ajuster({ stocks: { medicaments: 5 } });
  const soin = await M.api.affliction({ acteurId: a.id, cle: "fracture", action: "soigner", soigneurId: b.id });
  assert.equal(typeof soin.gueri, "boolean");

  // 9. Fêter : une ration par personne, +1 moral, une seule fois par fête et par an.
  await M.api.ajuster({ stocks: { nourriture: 10 }, raison: "un régime de bananes" });
  const moral = b.system.moral;
  const nourriture = abri.system.stocks.nourriture;
  const fe = await M.api.feter({ fete: "noel" });
  assert.equal(fe.ok, true);
  assert.equal(abri.system.stocks.nourriture, nourriture - 3, "deux membres et une PNJ : trois rations");
  assert.equal(b.system.moral, Math.min(5, moral + 1));
  await assert.rejects(() => M.api.feter({ fete: "noel" }), /déjà fêtée/);

  // 10. Recruter une recrue tirée selon les besoins.
  const besoins = M.api.besoins();
  assert.ok(Array.isArray(besoins) && besoins.every(x => x.tache && x.competence && x.couverture));
  const recrue = await M.api.genererRecrue({ region: "saint-leu" });
  assert.ok(recrue.nom && recrue.raison && recrue.prix);
  let recrute = null;
  for (let k = 0; k < 12 && !recrute?.reussite; k++) recrute = await M.api.recruter({ recrue, parleurId: b.id, attitude: "amicale" });
  assert.equal(recrute.reussite, true, "une recrue amicale finit par suivre");
  const r = game.actors.get(recrute.acteurId);
  assert.equal(r.system.statut, "recrue");
  assert.ok(M.api.etat().groupe.membres.includes(r.id));
  assert.equal(M.api.etat().groupe.statuts[r.id], "recrue");

  // 11. Déménager vers les Hauts de l'Ouest : l'abri quitté devient un abri abandonné, le chapitre se ferme.
  const dem = await M.api.demenager({ site: "maison-forestiere-du-maido", emporter: { nourriture: 4, graines: 1 }, transport: "pied" });
  assert.equal(dem.arrivee, true);
  assert.equal(M.api.etat().groupe.region, "hauts-de-l-ouest");
  assert.notEqual(M.api.etat().groupe.abri, abri.id);
  assert.ok(abri.system.abandonneLe !== null, "l'ancien abri est marqué abandonné");
  assert.ok(M.api.monde().regions["saint-leu"].abrisAbandonnes.some(x => x.site === "sucrerie-de-stella"), "abri abandonné au monde réel");
  const nouvel = game.actors.get(M.api.etat().groupe.abri);
  assert.ok(nouvel.system.stocks.nourriture >= dem.emporte.nourriture ?? 0);
  const chroniques = M.api.etat().chroniques;
  assert.equal(chroniques.length, 2);
  assert.ok(chroniques[0].fin !== null && chroniques[0].construit.includes("Citerne de pluie"));
  // Revenir plus tard reprend l'abri abandonné (ses installations sont encore là si personne ne l'a pris).
  assert.ok(M.api.etat().groupe.plans.includes("potager"), "les plans suivent le groupe");

  assert.deepEqual(erreurs(), [], "aucune erreur dans les crochets ni le socket");
});

test("test : dés au chat, marque si échoué, forcer une seule fois (bouton du propriétaire), demandé par le joueur", async () => {
  const M = await nouveauMonde();
  const a = await survivantTire(M, { userId: "u1" });
  const r = await M.api.test({ acteurId: a.id, competence: "tir", difficulte: "extreme", compte: true });
  for (const k of ["des", "succes", "requis", "reussite", "marge", "force", "complication", "marque", "texte"]) assert.ok(k in r, k);
  assert.equal(r.requis, 3);
  const m = messages.at(-1);
  assert.ok(m.content.includes("survie-test") && m.flags["lakour-survie"].test.acteurId === a.id);
  // Forcer depuis la carte (le joueur, par le MJ actif).
  const fatigue = a.system.fatigue;
  const f = commeJoueur("u1", () => M.api.forcer({ messageId: m.id }));
  await calme();
  const forcé = await f;
  assert.equal(forcé.force, true);
  assert.equal(a.system.fatigue, Math.min(5, fatigue + 1), "forcer coûte 1 fatigue");
  assert.ok(m.flags["lakour-survie"].test.resultat.force);
  await assert.rejects(() => M.api.forcer({ messageId: m.id }), /DejaForce/);
  // Le test lancé par le joueur propriétaire (bouton de demander_jet du MJ IA) : le MJ actif lance et répond.
  const t = commeJoueur("u1", () => M.api.test({ acteurId: a.id, competence: "survie", difficulte: "normale" }));
  await calme();
  const res = await t;
  assert.equal(res.requis, 1);
  assert.ok(emissions.some(e => e.message.type === "requete" && e.emetteur === "u1" && e.recipients?.[0] === "mj"));
  assert.ok(emissions.some(e => e.message.type === "reponse" && e.recipients?.length === 1 && e.recipients[0] === "u1"), "la réponse ne va qu'au demandeur");
  // Un joueur qui n'est pas propriétaire est refusé, chez lui comme chez le MJ (l'émetteur du serveur fait foi).
  await commeJoueur("u2", () => assert.rejects(() => M.api.test({ acteurId: a.id, competence: "tir" }), /PasProprietaire/));
  const ruse = assert.rejects(commeJoueur("u2", () => M.module.requete("test", { acteurId: a.id, competence: "tir" })), /PasProprietaire/);
  await calme();
  await ruse;
  // Il se fait passer pour u1 : le message est rejeté (il ment sur son auteur).
  const avantTests = messages.length;
  M.traiterMessage({ type: "requete", id: "x", action: "test", donnees: { acteurId: a.id, competence: "tir" }, userId: "u1" }, "u2");
  await calme();
  assert.equal(messages.length, avantTests, "aucun test lancé pour un faux auteur");
});

test("marques : un test qui compte et échoue marque, la compétence monte au seuil", async () => {
  const M = await nouveauMonde();
  const a = await survivantTire(M);
  await a.update({ system: { competences: { tir: { niveau: 0, marques: 0 } }, passions: { tir: 0 }, age: 40 } });
  let monte = false;
  for (let k = 0; k < 20 && !monte; k++) monte = (await M.api.test({ acteurId: a.id, competence: "tir", difficulte: "extreme" })).monte;
  assert.equal(monte, true);
  assert.equal(a.system.competences.tir.niveau, 1);
  const sans = await M.api.test({ acteurId: a.id, competence: "tir", difficulte: "extreme", compte: false });
  assert.equal(sans.marque, false, "un test qui ne compte pas ne marque jamais");
  const r = await M.api.marquer({ acteurId: a.id, competence: "soins" });
  assert.ok("monte" in r && "niveau" in r && "marques" in r);
});

test("blessures, soins, infection : mourant, morsure, le Gris suit sa route", async () => {
  const M = await nouveauMonde();
  const [a, b] = [await survivantTire(M), await survivantTire(M)];
  await M.api.demarrer({ region: "saint-denis", membres: [a.id, b.id] });
  const bl = await M.api.blesser({ acteurId: a.id, n: 4, morsure: true });
  assert.equal(bl.mourant, true);
  assert.ok(M.api.etat().alertes.some(x => x.type === "mourant"));
  assert.ok(M.api.etat().alertes.some(x => x.type === "morsure"));
  const so = await M.api.soigner({ acteurId: a.id, soigneurId: b.id });
  assert.equal(so.test.difficulte, "difficile", "un mourant se soigne en difficile");
  await M.api.infecter({ acteurId: b.id });
  assert.equal(b.system.infection.atteint, true);
  await M.api.avancer({ quarts: 4 });
  assert.equal(b.system.infection.stade, 2, "un stade tous les deux quarts");
  await M.api.avancer({ quarts: 8 });
  assert.equal(b.system.vivant, false, "stade 6 : mort");
});

test("explorer, voyager, renseigner : renseignements datés, routes réelles, carburant", async () => {
  const M = await nouveauMonde();
  const a = await survivantTire(M);
  await M.api.demarrer({ region: "saint-paul", membres: [a.id], graine: "voyage", essai: true });
  const ex = await M.api.explorer({ region: "le-port", quarts: 2 });
  assert.equal(ex.renseignement.vu, 0);
  assert.equal(ex.renseignement.source, "vu");
  const v = await M.api.voyager({ vers: "hauts-de-l-ouest", transport: "pied" });
  assert.equal(v.arrivee, true);
  assert.equal(M.api.etat().groupe.region, "hauts-de-l-ouest");
  assert.equal(M.api.etat().groupe.enRoute, null);
  await assert.rejects(() => M.api.voyager({ vers: "fournaise", transport: "vehicule" }), /Voyage impossible/);
  const rs = await M.api.renseigner({ region: "cilaos", source: "radio", infestation: "dense", electricite: false });
  assert.equal(rs.source, "radio");
  assert.equal(rs.infestation, "dense");
  assert.equal(M.api.etat().renseignements.cilaos.vu, M.api.quand().jour);
});

test("menaces du jour : gardées au monde, résolues en assaut ou écartées ; paliers de visibilité au seul MJ", async () => {
  const M = await nouveauMonde();
  const a = await survivantTire(M);
  await M.api.demarrer({ region: "saint-pierre", membres: [a.id], graine: "menaces", essai: true });
  await M.api.installer({ site: M.api.contenu().sites.find(s => s.region === "saint-pierre").cle });
  // Beaucoup de bruit et de jours : des menaces finissent par venir.
  let menaces = [];
  for (let k = 0; k < 12 && !menaces.length; k++) {
    await game.actors.get(M.api.etat().groupe.abri).update({ system: { bruit: 10 } });
    await M.api.avancer({ quarts: 20 });
    menaces = M.api.monde().menaces;
  }
  assert.ok(menaces.length, "des menaces tirées");
  const m = menaces[0];
  const r = await M.api.resoudreMenace({ id: m.id, action: m.force > 0 ? "assaut" : "ecarter" });
  assert.ok(r.issue || r.ecartee);
  assert.ok(!M.api.monde().menaces.some(x => x.id === m.id), "la menace résolue disparaît");
  // Palier : le crochet n'est appelé que chez le MJ, jamais diffusé au socket.
  assert.ok(!emissions.some(e => e.message?.nom === "lakourSurvie.palier"), "jamais de palier au socket");
});

test("ajouterMembre, besoins (forme du MJ IA), répartition automatique des tâches", async () => {
  const M = await nouveauMonde();
  const [a, b] = [await survivantTire(M), await survivantTire(M, { statut: "compagnon" })];
  await M.api.demarrer({ region: "saint-denis", membres: [a.id] });
  const r = await M.api.ajouterMembre({ acteurId: b.id, statut: "compagnon" });
  assert.ok(r.membres.includes(b.id));
  assert.equal(M.api.etat().groupe.statuts[b.id], "compagnon");
  const besoins = M.api.besoins();
  assert.ok(besoins.some(x => x.tache === "garde"));
  for (const x of besoins) assert.ok(["couvert", "faible", "manquant"].includes(x.couverture));
  await game.settings.set("lakour-survie", "repartitionAuto", true);
  await M.api.avancer({ quarts: 4 });
  assert.ok(b.system.tache, "le compagnon a reçu une tâche");
});

test("oublier : la mémoire du monde et sa copie dans ce navigateur", async () => {
  const M = await nouveauMonde();
  const a = await survivantTire(M);
  await M.api.demarrer({ region: "saint-denis", membres: [a.id] });
  assert.deepEqual(valeur("lakour-survie.monde")["fenoir-essai"] ?? {}, {}, "scellé : rien du monde réel dans ce navigateur");
  await M.api.oublier();
  assert.equal(M.api.monde(), null);
  assert.deepEqual(valeur("lakour-survie.monde")["fenoir-essai"] ?? {}, {});
  // Et l'état public de la partie revient à « pas commencée » (réglages par défaut), comme le coffre scellé.
  assert.equal(M.api.etat().demarree, false);
  assert.equal(M.api.etat().partie, "");
  assert.deepEqual(valeur("lakour-survie.coffre"), globalThis.game.settings.settings.get("lakour-survie.coffre").default);
});

test("oublier({ reglages: false }) : la mémoire seulement, la partie publique reste", async () => {
  const M = await nouveauMonde();
  const a = await survivantTire(M);
  await M.api.demarrer({ region: "saint-denis", membres: [a.id] });
  await M.api.oublier({ reglages: false });
  assert.equal(M.api.monde(), null);
  assert.equal(M.api.etat().demarree, true);
});

test("assaut : la tour de guet ajoute son bonus de vigilance à la garde (§1.7, comme pour un test)", async () => {
  const M = await nouveauMonde();
  const a = await survivantTire(M);
  await M.api.demarrer({ region: "sainte-marie", membres: [a.id] });
  await M.api.installer({ site: "phare-de-bel-air" });   // tour de guet niveau 2 (bonus vigilance 1) parmi ses installations
  await a.update({ system: { tache: "garde" } });
  const b = M.api.bilan();
  assert.equal(b.bonus?.vigilance, 1, "le bilan donne le bonus de la tour");
  const niveau = Number(a.system.competences?.vigilance?.niveau) || 0;
  const outil = Math.max(0, ...a.items.filter(i => i.type === "equipement").map(i => Number(i.system?.bonus?.vigilance) || 0));
  const as = await M.api.assaut({ force: 1, type: "Livides errants" });
  assert.equal(as.desDefense.length, Math.min(15, Math.max(1, b.defense + niveau + Math.min(2, outil + 1))), `défense ${b.defense}, vigilance ${niveau}, outil ${outil}`);
});

test("générateur : la phrase de la région suit le genre (il, elle, tournure neutre) et contracte le nom (« du côté des Hauts… »)", async () => {
  const M = await nouveauMonde();
  const c = M.api.contenu();
  const s = genre => ({ nom: "X", genre, histoire: { graine: { phrases: [], region: "hauts-de-l-ouest" } } });
  assert.equal(M.interne.versTirage(s("m"), c).graine, "Au jour zéro, il était du côté des Hauts de l'Ouest.");
  assert.equal(M.interne.versTirage(s("f"), c).graine, "Au jour zéro, elle était du côté des Hauts de l'Ouest.");
  assert.equal(M.interne.versTirage(s(""), c).graine, "Au jour zéro, sa route passait du côté des Hauts de l'Ouest.");
  const sd = { nom: "Y", genre: "f", histoire: { graine: { phrases: [], region: "saint-denis" } } };
  assert.equal(M.interne.versTirage(sd, c).graine, "Au jour zéro, elle était du côté de Saint-Denis.");
});
