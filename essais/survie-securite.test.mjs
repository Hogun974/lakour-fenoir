// La sécurité de la couche Foundry du système lakour-survie (revue du 2026-11-05), sur la doublure de Foundry v14 :
// - graine : sûre par défaut, une graine courte refusée (sauf essai), une ancienne partie à graine courte renforcée ;
// - messages : seuls ceux d'un MJ font foi (forcer, demandes de test) ; un joueur ne choisit ni la difficulté ni les marques de
//   son test, sauf réponse à une demande ouverte ; un message sans émetteur donné par le serveur est ignoré ;
// - intégrité : champs réservés au MJ (gmOnlyFields du system.json, vérifiés par le serveur v14) et crochets côté client ;
//   incubations gardées au monde scellé ; création validée chez le MJ ; propositions limitées ;
// - secret : plus de copie du monde réel dans le navigateur du MJ une fois scellé ; notes du MJ sur un abri au coffre ; bilan et
//   météo publics tirés du connu ; HTML nettoyé avant affichage.
// Lancer : npm run essais
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { installerFoundry, messages, calme, commeJoueur, valeur, reglages, DONNEES } from "./doublures/foundry-survie.mjs";
import { charger, monde, survivantTire, SYSTEME } from "./doublures/survie-api-outils.mjs";
import * as L from "../systems/lakour-survie/logique/index.mjs";

installerFoundry();
const M0 = await charger();
const D = await import("../systems/lakour-survie/scripts/demandes.mjs");
const G = await import("../systems/lakour-survie/scripts/garde.mjs");
const { nettoyerHTML } = await import("../systems/lakour-survie/scripts/apps/fiches.mjs");
const { demandeDeTestPourMoi } = await import("../systems/lakour-survie/scripts/signal.mjs");

async function partie(M, { graine = "", essai = false, region = "saint-paul", site = "college-hauts-saint-paul" } = {}) {
  const a = await survivantTire(M, { userId: "u1" });
  await M.api.demarrer({ region, membres: [a.id], ...(graine ? { graine, essai } : {}) });
  if (site) await M.api.installer({ site });
  return { a, abri: game.actors.get(M.api.etat().groupe.abri) };
}
// Une requête d'un joueur, servie par le MJ actif (socket de la doublure).
async function demande(userId, action, donnees) {
  const p = commeJoueur(userId, () => M0.module.requete(action, donnees));
  p.catch(() => null);
  await calme();
  return p;
}

// ------------------------------------------------------------------ E2 : la graine
test("graine : sûre par défaut (128 bits), courte refusée sauf essai, longue acceptée ; une ancienne graine courte est renforcée", async () => {
  const M = await monde(M0);
  const a = await survivantTire(M);
  await M.api.demarrer({ region: "saint-denis", membres: [a.id] });
  assert.match(M.api.monde().graine, /^[0-9a-f]{32}$/, "graine tirée par crypto.getRandomValues");
  await assert.rejects(() => M.api.demarrer({ region: "saint-denis", membres: [a.id], graine: "fenoir" }), /GraineCourte/);
  const longue = "une-graine-choisie-assez-longue-pour-tenir";
  await M.api.demarrer({ region: "saint-denis", membres: [a.id], graine: longue });
  assert.equal(M.api.monde().graine, longue);
  await M.api.demarrer({ region: "saint-denis", membres: [a.id], graine: "essai", essai: true });
  await M.api.avancer({ quarts: 1 });
  assert.equal(M.api.monde().graine, "essai", "une graine d'essai reste");
  // Une partie d'avant (graine courte, sans drapeau d'essai) : la première écriture lui donne une graine sûre.
  const memoire = M.Coffre.mondeEnMemoire();
  memoire.graine = "Xy12ab"; delete memoire.graineEssai;
  await M.api.avancer({ quarts: 1 });
  assert.match(M.api.monde().graine, /^[0-9a-f]{32}$/);
  assert.equal(M.api.monde().graineRenforceeLe, 0);
});

// ------------------------------------------------------------------ M3 : messages forgés, demandes de test
test("forcer : une carte de test écrite par un joueur (drapeaux forgés) ne se force pas, ni chez le MJ ni par requête", async () => {
  const M = await monde(M0);
  const { a } = await partie(M, { site: "" });
  const marques = a.system.competences.tir.marques;
  const forge = await commeJoueur("u1", () => ChatMessage.implementation.create({ content: "<p>test</p>", author: "mj",
    flags: { "lakour-survie": { test: { acteurId: a.id, competence: "tir", titre: "", forcable: true,
      resultat: { des: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1], desForces: null, succes: 0, requis: 1, reussite: false, marge: -1, force: false, marque: false, compte: true, difficulte: "normale", reserve: 10 } } } } }));
  assert.equal(forge.author.id, "u1", "le serveur fixe l'auteur");
  await assert.rejects(demande("u1", "forcer", { messageId: forge.id }), /PasProprietaire|TestInconnu/);
  await assert.rejects(() => M.api.forcer({ messageId: forge.id }), /TestInconnu/);
  assert.equal(a.system.competences.tir.marques, marques, "aucune marque gagnée");
  // Une vraie carte (écrite chez le MJ) se force toujours.
  const r = await demande("u1", "test", { acteurId: a.id, competence: "tir" });
  assert.ok((await demande("u1", "forcer", { messageId: r.messageId })).force);
  // Le signal « à toi » ne sonne pas pour une carte de demande forgée.
  const fausse = await commeJoueur("u2", () => ChatMessage.implementation.create({ content: `<button class="survie-lancer" data-action="survieLancer" data-acteur="${a.id}">x</button>` }));
  assert.equal(await commeJoueur("u1", () => demandeDeTestPourMoi(fausse)), false);
});

test("test d'un joueur : sans demande, normale et sans marque ; une demande ouverte du MJ (système ou MJ IA) décide, une fois", async () => {
  const M = await monde(M0);
  const { a } = await partie(M, { site: "" });
  const libre = await demande("u1", "test", { acteurId: a.id, competence: "survie", difficulte: "extreme", compte: true, forcer: true, bonus: 9 });
  assert.equal(libre.difficulte, "normale");
  assert.equal(libre.compte, false);
  assert.equal(libre.marque, false);
  assert.equal(libre.force, false);
  assert.equal(libre.demande, false);
  // Demande du système (demanderTest) : difficile, et elle compte.
  await M.api.demanderTest({ acteurId: a.id, competence: "survie", difficulte: "difficile", titre: "Traverser la ravine" });
  const carte = messages.at(-1);
  const repondu = await demande("u1", "test", { acteurId: a.id, competence: "survie", difficulte: "facile", demandeId: carte.id });
  assert.equal(repondu.difficulte, "difficile");
  assert.equal(repondu.compte, true);
  assert.equal(repondu.demande, true);
  assert.ok(carte.flags["lakour-survie"].repondue, "la demande est fermée");
  assert.equal((await demande("u1", "test", { acteurId: a.id, competence: "survie", difficulte: "difficile" })).compte, false, "une seule fois");
  // Carte de jet du MJ IA (écrite chez le MJ) : ses réglages convertis comme le fait le moteur (ardue -> extreme).
  const reglages = JSON.stringify({ difficulte: "ardue", modificateur: 0, avantage: 0, desavantage: 0, titre: "Morsure" }).replace(/"/g, "&quot;");
  await ChatMessage.implementation.create({ content: `<div class="lakour-mjia-jet"><button type="button" data-lakour-jet data-acteur="Actor.${a.id}" data-competence="soins" data-reglages="${reglages}">Soins</button></div>`,
    flags: { "lakour-mj-ia": { ia: true } } });
  const ia = await demande("u1", "test", { acteurId: a.id, competence: "soins", difficulte: "facile", compte: true });
  assert.equal(ia.difficulte, "extreme");
  assert.equal(ia.compte, true);
  // La même carte forgée par un joueur n'ouvre aucune demande.
  await commeJoueur("u1", () => ChatMessage.implementation.create({ content: `<button data-lakour-jet data-acteur="Actor.${a.id}" data-competence="tir" data-reglages="{}">x</button>`, flags: { "lakour-mj-ia": { ia: true } } }));
  assert.equal((await demande("u1", "test", { acteurId: a.id, competence: "tir" })).compte, false);
  assert.deepEqual(D.reglagesMJIA({ difficulte: "facile", avantage: 2, modificateur: -1 }), { difficulte: "normale", bonus: 3, malus: 1 });
});

test("socket : un message sans émetteur donné par le serveur est ignoré (requête comme réponse)", async () => {
  const M = await monde(M0);
  const { a } = await partie(M, { site: "" });
  const avant = messages.length;
  assert.equal(M.traiterMessage({ type: "requete", id: "x", action: "test", donnees: { acteurId: a.id, competence: "tir" }, userId: "u1" }, undefined), false);
  await calme();
  assert.equal(messages.length, avant);
  assert.equal(M.module.recevoirReponse({ type: "reponse", id: "x", resultat: 1 }, undefined), false);
});

test("propositions : au plus trois par minute pour un joueur", async () => {
  const M = await monde(M0);
  await partie(M, { site: "" });
  for (let i = 0; i < 3; i++) await demande("u2", "proposer", { type: "fouiller", details: `essai ${i}` });
  await assert.rejects(demande("u2", "proposer", { type: "fouiller" }), /TropDePropositions/);
  assert.equal(D.propositionPermise("u9", 0), true);
  assert.equal(D.propositionPermise("u9", 1), true);
  assert.equal(D.propositionPermise("u9", 2), true);
  assert.equal(D.propositionPermise("u9", 3), false);
  assert.equal(D.propositionPermise("u9", 60010), true, "une minute plus tard");
});

test("création : passions et incapacités forgées refusées chez le MJ", async () => {
  const M = await monde(M0, { joueurs: 3 });
  await partie(M, { site: "" });
  const t = M.api.generer({ statut: "joueur", hasard: L.creerHasard("securite-creation") });
  const creer = d => demande("u3", "creer", { donnees: d, rejoindre: false });
  const passions = Object.fromEntries(Object.keys(t.passions).map((k, i) => [k, i < 3 ? 2 : 0]));
  await assert.rejects(creer({ ...t, passions }), /TirageInvalide/);
  const sansIncapacite = DONNEES.traits.find(x => (x.incapacites ?? x.effets?.incapacites ?? []).length);
  if (sansIncapacite && L.compatibles(sansIncapacite, [], L.indexer(M.api.contenu()).traits)) {
    await assert.rejects(creer({ ...t, traits: [sansIncapacite.cle], incapacites: [] }), /TirageInvalide/);
  }
  await assert.rejects(creer({ ...t, enfance: "enfance-inventee" }), /TirageInvalide/);
  assert.ok((await creer(t)).acteurId, "le tirage honnête passe");
});

// ------------------------------------------------------------------ M6 : intégrité
test("intégrité : gmOnlyFields du system.json = tous les champs des modèles sauf les notes du survivant ; crochets côté client", async () => {
  const systeme = JSON.parse(readFileSync(join(SYSTEME, "system.json"), "utf8"));
  // Les modèles hors de Foundry : des champs factices suffisent pour lire leurs clés.
  const avant = globalThis.foundry;
  class Champ { constructor(...a) { this.a = a; } }
  globalThis.foundry = { ...avant, data: { fields: new Proxy({}, { get: () => Champ }) }, abstract: { TypeDataModel: class {} } };
  const { MODELES_ACTEURS, MODELES_OBJETS } = await import("../systems/lakour-survie/scripts/modeles.mjs");
  globalThis.foundry = avant;
  const attendu = G.gardesServeur({ Actor: MODELES_ACTEURS, Item: MODELES_OBJETS });
  for (const [doc, types] of Object.entries(attendu)) {
    for (const [type, champs] of Object.entries(types)) {
      assert.deepEqual([...(systeme.documentTypes[doc][type].gmOnlyFields ?? [])].sort(), [...champs].sort(), `${doc}.${type}`);
    }
  }
  assert.ok(!systeme.documentTypes.Actor.survivant.gmOnlyFields.includes("notes"));
  assert.ok(systeme.documentTypes.Actor.survivant.gmOnlyFields.includes("afflictions"));
  // Ce que le joueur peut écrire lui-même.
  assert.equal(G.changementActeurPermis("survivant", { name: "Nouveau nom", img: "x.webp", system: { notes: "<p>mes notes</p>" } }), true);
  assert.equal(G.changementActeurPermis("survivant", { system: { competences: { tir: { niveau: 5 } } } }), false);
  assert.equal(G.changementActeurPermis("survivant", { "system.afflictions": [] }), false);
  assert.equal(G.changementActeurPermis("survivant", { flags: { "lakour-survie": { graine: "x" } } }), false);
  // Les crochets : le joueur est arrêté dans son navigateur ; un objet qu'il a créé est retiré chez le MJ actif.
  const M = await monde(M0);
  const { a } = await partie(M, { site: "" });
  const [objet] = await a.createEmbeddedDocuments("Item", [{ name: "Fusil tombé du ciel", type: "equipement", system: { bonus: { tir: 2 } } }]);
  G._avertissement(() => null);
  G.brancherGarde(Hooks);
  assert.equal(Hooks.call("preUpdateActor", a, { system: { moral: 5 } }, {}, "u1"), false);
  assert.equal(Hooks.call("preUpdateActor", a, { system: { notes: "ok" } }, {}, "u1"), true);
  assert.equal(Hooks.call("preUpdateActor", a, { system: { moral: 5 } }, {}, "mj"), true);
  assert.equal(Hooks.call("preCreateItem", objet, {}, {}, "u1"), false);
  Hooks.callAll("createItem", objet, {}, "u1");
  await calme();
  assert.equal(a.items.get(objet.id), undefined, "retiré par le MJ actif");
});

test("incubation : gardée au monde scellé, absente de l'acteur (que son joueur lit) jusqu'à la déclaration", async () => {
  const M = await monde(M0);
  const { a } = await partie(M);
  await M.api.ajuster({ stocks: { nourriture: 40, eau: 40 } });
  await M.api.affliction({ acteurId: a.id, cle: "leptospirose", action: "donner" });
  assert.ok(!(a.system.afflictions ?? []).some(x => x.cle === "leptospirose"), "rien sur l'acteur");
  assert.ok(!JSON.stringify(a.system).includes("incubation"));
  assert.equal(M.api.monde().incubations[a.id][0].cle, "leptospirose");
  assert.ok(M.module.systemeLogique(a).afflictions.some(x => x.cle === "leptospirose"), "la logique la voit");
  await M.api.avancer({ quarts: 4 * 8 });
  const lepto = (a.system.afflictions ?? []).find(x => x.cle === "leptospirose");
  assert.ok(lepto && lepto.stade !== "incubation", "déclarée : sur l'acteur");
  assert.ok(!(M.api.monde().incubations?.[a.id] ?? []).some(x => x.cle === "leptospirose"));
});

// ------------------------------------------------------------------ M1, F7 : le secret
test("navigateur du MJ : plus de copie du monde réel une fois scellé ; une ancienne copie est effacée à la réouverture", async () => {
  const M = await monde(M0);
  await partie(M, { site: "" });
  await M.api.avancer({ quarts: 2 });
  assert.deepEqual(valeur("lakour-survie.monde")[game.world.id] ?? {}, {}, "rien du monde réel dans le localStorage du MJ");
  // Une copie laissée par une version d'avant (même révision que le coffre) : effacée quand le monde se rouvre.
  const coffre = valeur("lakour-survie.coffre");
  reglages.get("lakour-survie.monde").valeur = { [game.world.id]: { mj: { partie: coffre.partie, rev: coffre.rev, iv: "", monde: M.api.monde() } } };
  M.Coffre._reinitialiser();
  assert.equal(await M.Coffre.ouvrirMonde(), true);
  assert.deepEqual(valeur("lakour-survie.monde")[game.world.id], {});
});

test("abri : les notes secrètes du MJ vont au coffre, jamais sur l'acteur ; d'anciennes notes sont mises au secret", async () => {
  const M = await monde(M0);
  const { abri } = await partie(M);
  assert.equal(abri.flags["lakour-survie"].notesPubliques, true);
  await M.api.noterAbri({ abriId: abri.id, notes: "La trappe de la cave mène au repaire des Sans-Lune." });
  assert.ok(!JSON.stringify(abri).includes("Sans-Lune"));
  assert.match(M.api.notesAbri(abri.id), /Sans-Lune/);
  assert.equal(await commeJoueur("u1", () => M.api.notesAbri(abri.id)), "");
  // Un abri d'avant : ses notes (du MJ) partent au coffre.
  const vieux = await Actor.implementation.create({ name: "Vieil abri", type: "abri", system: { notes: "<p>Cache d'armes sous le plancher</p>" }, ownership: { default: 2 } });
  await M.api.migrerNotesAbris();
  assert.equal(vieux.system.notes, "");
  assert.match(M.api.notesAbri(vieux.id), /plancher/);
});

test("bilan et météo publics : loin de l'abri, ce que le groupe sait ; en route, pas le temps de la région d'arrivée", async () => {
  const M = await monde(M0);
  const { abri } = await partie(M);
  const region = abri.system.region;
  // Le réseau tombe chez l'abri (réel) pendant que le groupe est ailleurs et croit encore au courant.
  const etatAvant = M.api.etat();
  const memoire = M.Coffre.mondeEnMemoire();
  memoire.coupures[region] = { ...memoire.coupures[region], electricite: 0, eau: 0 };
  const loin = { ...etatAvant, groupe: { ...etatAvant.groupe, region: "saint-denis" },
    renseignements: { ...etatAvant.renseignements, [region]: { ...(etatAvant.renseignements[region] ?? {}), electricite: true, eau: true } } };
  const publique = M.module.instantaneBilan(loin, memoire);
  assert.deepEqual(publique.reseaux, { eau: true, electricite: true }, "le connu, pas le réel");
  assert.deepEqual(M.module.bilanVivant(loin, memoire).reseaux, { eau: false, electricite: false }, "le MJ lit le réel");
  // En route vers une région où il pleut à verse : rien tant qu'on n'y est pas.
  memoire.regions["saint-denis"].evenements.push({ cle: "fortes-pluies", depuis: 0, jusqua: 99 });
  const enRoute = { ...etatAvant, groupe: { ...etatAvant.groupe, enRoute: { de: region, vers: "saint-denis", reste: 3 } } };
  assert.equal(M.module.meteoPublique(enRoute, memoire).temps, "");
  const arrive = { ...etatAvant, groupe: { ...etatAvant.groupe, region: "saint-denis", enRoute: null } };
  assert.equal(M.module.meteoPublique(arrive, memoire).temps, "pluie");
});

// ------------------------------------------------------------------ M4 : HTML
test("notes et descriptions : nettoyées (liste blanche de Foundry) avant d'être enrichies et affichées en {{{ }}}", () => {
  const avant = foundry.utils.cleanHTML;
  try {
    foundry.utils.cleanHTML = h => h.replace(/\son\w+="[^"]*"/g, "").replace(/<script[\s\S]*?<\/script>/g, "");
    assert.equal(nettoyerHTML('<p>ok</p><img src="x" onerror="alert(1)"><script>alert(2)</script>'), '<p>ok</p><img src="x">');
  } finally { foundry.utils.cleanHTML = avant; }
  assert.equal(nettoyerHTML('<img src=x onerror="alert(1)">notes'), "notes", "sans Foundry : texte seul");
  const fiches = readFileSync(join(SYSTEME, "scripts/apps/fiches.mjs"), "utf8");
  assert.match(fiches, /enrichHTML\(nettoyerHTML\(html\)/);
  for (const g of ["fiche-survivant.hbs", "fiche-objet.hbs", "fiche-abri.hbs"]) {
    const texte = readFileSync(join(SYSTEME, "templates", g), "utf8");
    for (const m of texte.matchAll(/\{\{\{(\w+)\}\}\}/g)) assert.ok(["notesEnrichies", "html"].includes(m[1]), `${g} : {{{${m[1]}}}} non nettoyé`);
  }
});
