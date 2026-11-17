// Lot « cartes » : l'API du système (couche Foundry) sur la doublure en mémoire, avec le VRAI contenu de lakour-fenoir : le compte des
// jours dans l'état public et dans quand() (le bandeau des joueurs dit le jour qu'ils croient, le MJ le vrai), qui le tient, le jour
// reçu ou donné (un mensonge court par le Ladi Lafé), la lune sur un calendrier, les cartes et les calendriers (donnés, trouvés en
// fouillant, recopiés), le journal d'un mort, la fête des autres qui rend le jour, l'affaire « quand la date se perd », la fenêtre
// du MJ, le tableau de bord et la fiche d'objet.   Lancer : npm run essais
import { test } from "node:test";
import assert from "node:assert/strict";
import { installerFoundry, commeJoueur, valeur } from "./doublures/foundry-survie.mjs";
import { charger, monde, survivantTire } from "./doublures/survie-api-outils.mjs";
import * as FL from "../modules/lakour-mj-ia/scripts/fetes-logique.js";

installerFoundry();
const M0 = await charger();
const ID = "lakour-survie";

// Une partie à Saint-Pierre (le 4 décembre 2026), installée ; le téléphone est tombé dès le départ si `coupe` (pas de radio à bord).
async function partie({ coupe = true, site = "chalutier-de-saint-pierre" } = {}) {
  const M = await monde(M0);
  const a = await survivantTire(M, { userId: "u1" });
  const b = await survivantTire(M, { statut: "compagnon" });
  const region = M.api.contenu().sites.find(s => s.cle === site).region;
  await M.api.demarrer({ region, membres: [a.id, b.id], graine: "GRAINE-REPERES-0001", essai: true, dateDepart: "2026-12-04" });
  await M.api.installer({ site });
  await M.api.ajuster({ stocks: { nourriture: 120, eau: 120 } });
  if (coupe) for (const r of Object.keys(M.Coffre.mondeEnMemoire().coupures)) M.Coffre.mondeEnMemoire().coupures[r].telephone = 0;
  return { M, a, b, region, abri: game.actors.get(M.api.etat().groupe.abri) };
}
// L'état public, retouché à la main (comme le MJ actif l'écrirait).
async function retoucher(fn) { const e = valeur(`${ID}.partie`); fn(e); await game.settings.set(ID, "partie", e); }

test("API : les fonctions du lot existent ; hors du MJ actif, celles qui écrivent refusent ; au départ, on sait le jour", async () => {
  const { M, a } = await partie({ coupe: false });
  for (const f of ["reperes", "compte", "donnerDate", "lireLaLune", "donnerRepere", "copierCarte", "lireJournal"]) assert.equal(typeof M.api[f], "function", f);
  for (const [nom, args] of [["compte", { action: "noter" }], ["donnerDate", { de: "x", date: "2026-12-05" }], ["donnerRepere", { acteurId: a.id, cle: "calendrier-des-postes" }]]) {
    await commeJoueur("u1", () => assert.rejects(() => M.api[nom](args), /PasMJActif/, nom));
  }
  const e = M.api.etat();
  assert.deepEqual([e.compte.certitude, e.compte.teneur, e.compte.jourCru], ["sur", a.id, 0]);
  const q = M.api.quand();
  assert.deepEqual([q.compte.certitude, q.dateDuGroupe, q.jourDuGroupe, q.heureLue.cle], ["sur", q.dateTexte, 0, "exacte"]);
  assert.equal(q.heureDuGroupe, q.heure, "le téléphone donne l'heure");
  const r = M.api.reperes();
  assert.deepEqual([r.compte.certitude, r.compte.teneurNom, r.compte.ecart, r.objets.length, r.support], ["sur", a.name, 0, 0, ""]);
});

test("API : le téléphone tombe ; dix jours d'encoches et l'on doute ; personne ne note, le compte se perd ; les joueurs ne voient plus que ce qu'ils croient", async () => {
  const { M, a } = await partie();
  await M.api.avancer({ quarts: 4 * 12 });
  let q = M.api.quand();
  assert.equal(q.dateExacte, false);
  assert.equal(q.compte.certitude, "a-peu-pres");
  assert.ok(M.api.etat().journal.some(e => e.cle === "compte-doute"));
  assert.match(q.dateDuGroupe, /^vers le /);
  assert.equal(q.heureDuGroupe, "", "sans téléphone ni montre, l'heure n'est plus affichée");
  const { contexteBandeau } = await import("../systems/lakour-survie/scripts/apps/bandeau.mjs");
  assert.match(contexteBandeau().jourTexte, /^Jour \d+$/, "le MJ voit le vrai jour");
  const joueur = await commeJoueur("u1", () => contexteBandeau());
  assert.match(joueur.jourTexte, /≈/);
  assert.match(joueur.date, /^vers le /);
  assert.equal(joueur.heure, "");
  // Personne ne tient plus le compte.
  await M.api.compte({ action: "teneur", acteurId: "" });
  await M.api.avancer({ quarts: 4 * 3 });
  q = M.api.quand();
  assert.equal(q.compte.certitude, "perdu");
  assert.equal(q.jourDuGroupe, null);
  assert.equal(q.dateDuGroupe, q.dateLue);
  assert.ok(M.api.etat().alertes.some(x => x.type === "compte"));
  assert.match((await commeJoueur("u1", () => contexteBandeau())).jourTexte, /\?/);
  assert.ok(M.api.affaires().contexte.declencheurs.includes("date-perdue"), "l'affaire « Le jour qu'il est » peut naître");
  assert.ok(M.api.affaires({ region: "cilaos" }).affaires.some(x => x.cle === "le-jour-qu-il-est"), "en décembre, dans les cirques, elle est possible");
  await assert.rejects(() => M.api.compte({ action: "noter", acteurId: a.id }), /retrouver|found again/);
  await assert.rejects(() => M.api.compte({ action: "danser" }), /danser/);
});

test("API : qui tient le compte ; un jour noté à la main, un jour oublié ; corriger le compte (le MJ)", async () => {
  const { M, a, b } = await partie();
  await M.api.compte({ action: "teneur", acteurId: b.id });
  assert.equal(M.api.etat().compte.teneur, b.id);
  assert.ok(M.api.etat().journal.some(e => e.cle === "Reperes.Journal.Teneur"));
  await assert.rejects(() => M.api.compte({ action: "teneur", acteurId: "inconnu" }), /groupe|group/);
  await M.api.compte({ action: "oublier" });
  await M.api.avancer({ quarts: 4 });
  assert.equal(M.api.etat().compte.certitude, "a-peu-pres", "un jour oublié");
  assert.ok(M.api.etat().journal.some(e => e.cle === "compte-manque"));
  const r = await M.api.compte({ action: "regler", date: "2026-12-05", certitude: "sur" });
  assert.deepEqual([r.certitude, r.jourCru, r.ecart], ["sur", 1, 0]);
  await M.api.compte({ action: "noter", acteurId: a.id });
  assert.equal(M.api.etat().compte.noteLe, 1);
});

test("API : un jour reçu (cru, avec son auteur) ; un jour donné faux court par le Ladi Lafé ; démenti, le menteur porte « mentir »", async () => {
  const { M, a } = await partie();
  await M.api.avancer({ quarts: 4 * 2 });
  const recu = await M.api.donnerDate({ de: "Le vieux des Hauts", date: "2026-12-10" });
  assert.deepEqual([recu.sens, recu.jour, recu.vrai], ["recu", 6, false]);
  const e = M.api.etat();
  assert.deepEqual([e.compte.certitude, e.compte.jourCru, e.compte.recu.de], ["a-peu-pres", 6, "Le vieux des Hauts"]);
  assert.equal(M.api.reperes().compte.ecart, 4, "au MJ : quatre jours d'avance");
  assert.equal(await commeJoueur("u1", () => M.api.reperes().compte.ecart), undefined, "les joueurs ne voient pas l'écart");
  assert.match(M.api.quand().dateDuGroupe, /vers le .*10 décembre 2026/);
  await assert.rejects(() => M.api.donnerDate({ de: "x", date: "2026-13-40" }), /illisible|Unreadable/);
  await assert.rejects(() => M.api.donnerDate({ date: "2026-12-10" }), /qui|Who/);
  // Le groupe donne un autre jour que celui qu'il croit, à l'îlet d'en face : un mensonge.
  const sens = a.system.sensMoral;
  const d = await M.api.donnerDate({ de: a.id, a: "L'îlet d'en face", date: "2026-12-20" });
  assert.deepEqual([d.sens, d.mensonge], ["donne", true]);
  const rumeur = M.api.etat().marche.rumeurs.find(x => x.id === d.rumeur);
  assert.ok(rumeur && !("auteur" in rumeur), "l'auteur reste au secret");
  assert.equal(M.api.monde().marche.rumeurs[d.rumeur].vraie, false);
  const dem = await M.api.dementir({ id: d.rumeur, preuve: "fait" });
  assert.equal(dem.menteur, a.id);
  assert.ok(a.system.sensMoral < sens || a.system.reputation < 0, "le menteur démenti rougit");
  // Donner le jour qu'on croit n'est pas mentir.
  const juste = await M.api.donnerDate({ a: "Une marchande", date: "2026-12-10" });
  assert.deepEqual([juste.mensonge, juste.rumeur], [false, null]);
  await assert.rejects(() => M.api.donnerDate({ de: "Un inconnu", a: "Une marchande", date: "2026-12-10" }), /groupe|group/, "seul le groupe ou l'un des siens donne un jour");
});

test("API : donner un calendrier, une carte ; un calendrier de l'année garde le compte sûr ; la lune se lit la nuit, ciel dégagé", async () => {
  const { M, a, b } = await partie();
  await assert.rejects(() => M.api.donnerRepere({ acteurId: a.id, cle: "sabre-a-canne" }), /ni une carte|not a map/);
  const cal = await M.api.donnerRepere({ acteurId: a.id, cle: "calendrier-des-postes" });
  assert.equal(cal.repere.annee, 2027, "en décembre, le calendrier des postes est celui de l'an prochain");
  assert.equal(cal.nom, "Calendrier des postes 2027");
  const de = await M.api.donnerRepere({ acteurId: b.id, cle: "calendrier-des-marees-et-des-lunes" });
  assert.equal(de.repere.annee, 2026);
  const r = M.api.reperes();
  assert.deepEqual(r.objets.map(o => [o.type, o.annee, o.valable]).sort(), [["calendrier", 2026, true], ["calendrier", 2027, false]]);
  assert.equal(r.support, "calendrier");
  // Quarante jours ; ceux qui tiennent le compte gardent le moral (au fond du trou, on oublie de noter).
  for (let i = 0; i < 40; i++) {
    for (const x of [a, b]) await x.update({ system: { moral: 4, fatigue: 0, blessures: 0 } });
    await M.api.avancer({ quarts: 4 });
  }
  assert.deepEqual(M.api.etat().journal.filter(e => String(e.cle).startsWith("compte-")).map(e => e.cle), []);
  assert.equal(M.api.etat().compte.certitude, "sur", "coché sur le calendrier de 2026, puis sur celui de 2027 : le compte tient");
  assert.equal(M.api.etat().compte.jourCru, 40);
  // La lune : le matin, refus ; la nuit, ciel dégagé, elle donne le jour (à un jour près avec les marées).
  await assert.rejects(() => M.api.lireLaLune({}), /nuit|night/);
  let lu = null;
  for (let i = 0; i < 30 && !lu; i++) {
    await M.api.avancer({ quarts: i ? 4 : 2 });   // le soir
    await retoucher(e => { e.ciel = { jour: Math.floor(e.horloge.quart / 4), region: e.groupe.region, soir: false, nuit: false }; });
    lu = await M.api.lireLaLune({ objetId: de.objetId }).catch(err => (/levée|risen/.test(err.message) ? null : Promise.reject(err)));
  }
  assert.ok(lu, "une nuit de lune dans le mois");
  assert.ok(lu.autreAnnee === true || Math.abs(lu.ecart) <= 1, `écart ${lu.ecart}`);
  assert.equal(M.api.etat().compte.certitude, "a-peu-pres");
  assert.ok(M.api.etat().journal.some(e => e.cle === "Reperes.Journal.Lune"));
  await retoucher(e => { e.ciel = { ...e.ciel, soir: true }; });
  await assert.rejects(() => M.api.lireLaLune({}), /couvert|overcast/);
});

test("API : une montre donne l'heure ; un cadran à l'abri, le jour ; les objets disent ce qu'ils sont (fiche d'objet)", async () => {
  const { M, a } = await partie();
  await M.api.avancer({ quarts: 4 * 2 });
  assert.equal(M.api.quand().heureDuGroupe, "");
  const montre = await M.api.donnerRepere({ acteurId: a.id, cle: "montre-a-aiguilles" });
  assert.equal(M.api.quand().heureLue.cle, "exacte");
  assert.notEqual(M.api.quand().heureDuGroupe, "");
  await a.deleteEmbeddedDocuments("Item", [montre.objetId]);
  await M.api.donnerRepere({ acteurId: a.id, cle: "cadran-solaire" });
  assert.equal(M.api.quand().heureLue.cle, M.api.quand().pluie ? "jour-couvert" : "cadran");
  const carte = await M.api.donnerRepere({ acteurId: a.id, cle: "carte-annotee" });
  const { sectionsObjet } = await import("../systems/lakour-survie/scripts/apps/fiches.mjs");
  const lignes = sectionsObjet(a.items.get(carte.objetId)).flatMap(s => s.lignes).join(" | ");
  assert.match(lignes, /carte \| toute l'île \| imprimée en 20\d\d \| « /);
});

test("API : une fouille trouve parfois une carte ou un calendrier (à part des autres tirages) ; le premier fouilleur l'emporte", async () => {
  const { M, a } = await partie();
  let trouve = null;
  for (let i = 0; i < 25 && !trouve; i++) {
    const r = await M.api.fouiller({ region: "saint-pierre", site: "hopital-du-sud", membres: [a.id] });
    trouve = r.repere;
  }
  assert.ok(trouve, "en 25 fouilles");
  assert.equal(trouve.acteurId, a.id);
  const o = a.items.get(trouve.objetId);
  assert.ok(o && o.system.repere?.type);
  assert.ok(M.api.etat().journal.some(e => e.cle === "Reperes.Journal.Trouve"));
});

test("API : recopier une carte (un cahier cousu, une encre usée) ; les cartes du groupe dans les renseignements et sur la carte de l'île", async () => {
  const { M, a, b } = await partie();
  const carte = await M.api.donnerRepere({ acteurId: a.id, cle: "carte-ancienne" });
  await assert.rejects(() => M.api.copierCarte({ objetId: carte.objetId }), /cahier|notebook/);
  await M.api.donnerRepere({ acteurId: b.id, cle: "cahier-cousu" });
  const encre = await M.api.donnerRepere({ acteurId: b.id, cle: "encre-de-suie" });
  const quart = M.api.etat().horloge.quart;
  const copie = await M.api.copierCarte({ objetId: carte.objetId, acteurId: b.id });
  assert.equal(M.api.etat().horloge.quart, quart + 1, "un quart");
  assert.ok(!b.items.get(encre.objetId), "l'encre est usée");
  const c = b.items.get(copie.objetId);
  assert.ok(c.system.repere.copie && c.name.startsWith("Copie à la main"));
  await assert.rejects(() => M.api.copierCarte({ objetId: "rien" }), /carte|map/);
  const r = M.api.reperes();
  assert.equal(r.cartes["saint-paul"].routes["saint-leu"], "difficile", "la vieille carte trompe");
  const { contexteTableau, carteConnue } = await import("../systems/lakour-survie/scripts/apps/tableau.mjs");
  const t = contexteTableau("renseignements");
  assert.match(t.renseignements.find(x => x.cle === "saint-paul").carte, /D'après la carte/);
  assert.match(t.renseignements.find(x => x.cle === "saint-paul").notes, /Tamarins/);
  assert.ok(carteConnue(M.api.etat(), M.api.contenu(), r.cartes).includes("stroke-dasharray=\"10 30\""), "une route d'après la carte");
  const g = contexteTableau("groupe");
  assert.ok(g.reperes.objets.length === 3 && /On (sait|croit)/.test(g.reperes.compte), "la carte, le cahier, la copie");
});

test("API : le journal d'un mort se lit sur le corps (le jour, les plans) ; celui d'un inconnu (ses renseignements, son jour)", async () => {
  const { M, a, b } = await partie();
  await retoucher(e => { e.groupe.plans = ["atelier"]; });
  await M.api.blesser({ acteurId: b.id, n: 4 });
  for (let i = 0; i < 12 && b.system.vivant !== false; i++) await M.api.avancer({ quarts: 1 });
  assert.equal(b.system.vivant, false);
  const mort = M.api.etat().morts.find(m => m.id === b.id);
  assert.ok(mort.journal && mort.journal.plans.includes("atelier"));
  assert.deepEqual(M.api.reperes().journaux.map(j => j.id), [b.id]);
  await retoucher(e => { e.groupe.plans = []; e.compte = { ...e.compte, certitude: "perdu" }; });
  const r = await M.api.lireJournal({ mortId: b.id });
  assert.deepEqual(r.plans, ["atelier"]);
  assert.ok(M.api.etat().groupe.plans.includes("atelier"));
  assert.equal(M.api.etat().compte.certitude, "a-peu-pres", "le jour qu'il croyait");
  assert.equal(M.api.etat().compte.recu.de, b.name);
  // Un inconnu : son dernier jour noté, depuis combien de jours, ce qu'il dit des régions.
  await retoucher(e => { e.compte = { ...e.compte, certitude: "perdu" }; });
  const i = await M.api.lireJournal({ de: "Un randonneur", date: "2026-12-05", depuis: 2, renseignements: { cilaos: { vu: 1, infestation: "dense", notes: "Le pont est tombé." } }, plans: ["atelier"] });
  assert.deepEqual([i.jour, i.regions], [3, ["cilaos"]]);
  assert.deepEqual([M.api.etat().renseignements.cilaos.source, M.api.etat().renseignements.cilaos.infestation], ["journal", "dense"]);
  await assert.rejects(() => M.api.lireJournal({}), /journal de qui|Whose journal/);
  await assert.rejects(() => M.api.lireJournal({ de: "x", plans: ["tour-eiffel"] }), /tour-eiffel/);
  void a;
});

test("API : à la fête des autres on apprend le jour ; une partie d'avant le lot reçoit son compte ; la fenêtre du MJ montre « Le jour qu'on croit »", async () => {
  const { M } = await partie();
  await retoucher(e => { e.compte = { ...e.compte, certitude: "perdu", jourCru: 40 }; });
  const p = await M.api.participer({ fete: "noel", communaute: "tous" }).catch(err => err);
  if (!(p instanceof Error)) {
    assert.equal(p.jourAppris, true);
    assert.equal(M.api.etat().compte.certitude, "a-peu-pres");
  }
  // Une partie d'avant : ni compte, la date perdue.
  await retoucher(e => { delete e.compte; e.calendrier = { exacte: false }; });
  assert.equal(M.api.quand().compte.certitude, "perdu");
  await M.api.avancer({ quarts: 1 });
  assert.ok(M.api.etat().compte, "elle a reçu son compte");
  const { contexteMJ } = await import("../systems/lakour-survie/scripts/apps/mj.mjs");
  const c = contexteMJ("partie");
  assert.ok(c.reperes && c.reperes.lignes.length >= 4 && c.reperes.actions.length === 4 && c.reperes.cles.length >= 15);
  assert.match(c.reperes.lignes[0], /^Vrai jour/);
  assert.equal(contexteMJ("monde").reperes, null);
});

test("API : le calendrier des fêtes de l'année fait voir venir les fêtes des autres (depuis le jour qu'on croit) ; perdu, il ne sert plus", async () => {
  const { M, a } = await partie();
  // Le socle des fêtes du moteur (0.49.0) date Pongal, fête sur demande que Fénoir décline.
  const moteur = game.modules.get("lakour-mj-ia");
  const fetesMoteur = moteur.api.fetes;
  moteur.api.fetes = { calendrier: d => FL.fetesDuJour(d, { aussi: FL.IDS_SUR_DEMANDE }) };
  await M.api.avancer({ quarts: 4 * 30 });
  await M.api.compte({ action: "regler", date: "2027-01-03", certitude: "sur" });   // le 3 janvier 2027
  assert.deepEqual(M.api.reperes().fetesAVenir, [], "sans le calendrier");
  const c = await M.api.donnerRepere({ acteurId: a.id, cle: "calendrier-des-fetes" });
  assert.equal(c.repere.annee, 2027);
  const f = M.api.reperes().fetesAVenir;
  const pongal = f.find(x => x.cle === "pongal");
  assert.ok(pongal, JSON.stringify(f));
  assert.deepEqual([pongal.date, pongal.dans], ["2027-01-14", 11]);
  const { contexteTableau } = await import("../systems/lakour-survie/scripts/apps/tableau.mjs");
  assert.match(contexteTableau("groupe").reperes.fetes, /Pongal.* dans 11 jours/);
  await retoucher(e => { e.compte = { ...e.compte, certitude: "perdu" }; });
  assert.deepEqual(M.api.reperes().fetesAVenir, []);
  moteur.api.fetes = fetesMoteur;
});
