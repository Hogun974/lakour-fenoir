// Le jour qu'on croit, les cartes et les calendriers (lot « cartes », 2026-11-17 ; lot 3 de l'inventaire du jeu 3D), logique pure :
// le compte des jours (noter, douter, dériver, perdre), le jour reçu d'un autre, la lune lue sur un calendrier, l'heure lue dans le
// ciel, les cartes et les calendriers (année, régions, routes imprimées, trouvailles), le journal d'un mort ; et ce que le temps qui
// passe en fait (avancer).   Lancer : npm run essais
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { L } from "./doublures/survie-outils.mjs";

const D = JSON.parse(readFileSync(new URL("../modules/lakour-fenoir/assets/donnees.json", import.meta.url), "utf8"));
const DEPART = "2026-12-04";
const h = (...cles) => L.deriverHasard("reperes-essai", ...cles);
const vivant = (extra = {}) => ({ vivant: true, livide: false, blessures: 0, fatigue: 0, moral: 4, infection: { atteint: false, stade: 0 }, ...extra });
const def = cle => D.equipements.find(e => e.cle === cle);

// Fait passer n jours au compte, noté (ou non) chaque jour. -> le compte
function jours(c, debut, n, { note = true, support = "", hasard = cle => h("j", cle) } = {}) {
  let x = c;
  for (let j = debut + 1; j <= debut + n; j++) x = L.journeeCompte(x, { jour: j, support, teneur: note ? vivant() : null, present: note, hasard: hasard(j) }).compte;
  return x;
}

// ------------------------------------------------------------------ le compte des jours
test("compte : sur un calendrier de l'année coché chaque jour, il reste sûr ; par encoches, le doute vient au bout de 10 jours (30 sur une planche)", () => {
  const c0 = L.compteDepart(0, "a");
  assert.deepEqual([c0.certitude, c0.jourCru, c0.noteLe, c0.teneur], ["sur", 0, 0, "a"]);
  const cal = jours(c0, 0, 200, { support: "calendrier" });
  assert.deepEqual([cal.certitude, cal.jourCru, cal.marge, cal.encoches], ["sur", 200, 0, 0]);
  let e = c0;
  for (let j = 1; j <= 30; j++) {
    e = L.journeeCompte(e, { jour: j, support: "", teneur: vivant(), present: true, hasard: h(j) }).compte;
    assert.equal(e.jourCru, j, "noter chaque jour ne fait jamais dériver");
    assert.equal(e.certitude, j >= 10 ? "a-peu-pres" : "sur", `jour ${j}`);
  }
  assert.equal(e.marge, 1);
  const p = jours(c0, 0, 29, { support: "planche" });
  assert.equal(p.certitude, "sur");
  assert.equal(jours(p, 29, 1, { support: "planche" }).certitude, "a-peu-pres");
  const ev = L.journeeCompte(jours(c0, 0, 9), { jour: 10, support: "", teneur: vivant(), present: true, hasard: h(10) });
  assert.equal(ev.evenement, "doute");
  assert.equal(L.texteCompte("doute").cle, "compte-doute");
});

test("compte : un jour non noté dérive (30 % sauté, 10 % compté deux fois) ; 3 jours de suite il est perdu, 2 sans calendrier", () => {
  let retard = 0, avance = 0, juste = 0;
  for (let i = 0; i < 3000; i++) {
    const c = L.finDuJour(L.compteDepart(0), 0, { note: false, support: "calendrier", hasard: h("derive", i) });
    if (c.jourCru === 0) retard++; else if (c.jourCru === 2) avance++; else { assert.equal(c.jourCru, 1); juste++; }
    assert.deepEqual([c.certitude, c.marge, c.joursSansNoter], ["a-peu-pres", 1, 1]);
  }
  assert.ok(retard > 800 && retard < 1000 && avance > 230 && avance < 370 && juste > 1700, `${retard} / ${avance} / ${juste}`);
  // Le jour zéro est déjà noté : la journée du jour 1 le trouve noté ; les jours 1 et 2 ne le sont pas.
  const sans = jours(L.compteDepart(0), 0, 3, { note: false });
  assert.equal(sans.certitude, "perdu", "deux jours sans calendrier");
  const avec = jours(L.compteDepart(0), 0, 3, { note: false, support: "calendrier" });
  assert.equal(avec.certitude, "a-peu-pres");
  assert.equal(jours(avec, 3, 1, { note: false, support: "calendrier" }).certitude, "perdu");
  assert.equal(L.jourConnu(sans), null);
  assert.equal(L.ecartDuCompte(sans, 3), null);
  // Perdu : le jour cru avance toujours (pour le mois qu'on croit), noter n'y change rien.
  const plus = jours(sans, 3, 3);
  assert.deepEqual([plus.certitude, plus.jourCru - sans.jourCru], ["perdu", 3]);
});

test("compte : qui le tient ne note pas s'il est absent, mort, mourant, épuisé, confus par le Gris ; au moral 0, il oublie un jour sur trois", () => {
  const c = L.compteDepart(0, "a");
  const r = (teneur, present = true, hasard = () => 0.9) => L.noteDuJour(c, 1, { teneur, present, hasard }).raison;
  assert.equal(r(vivant()), "tenu");
  assert.equal(r(vivant(), false), "absent");
  assert.equal(r(vivant({ vivant: false })), "mort");
  assert.equal(r(vivant({ blessures: 4 })), "empeche");
  assert.equal(r(vivant({ fatigue: 5 })), "empeche");
  assert.equal(r(vivant({ infection: { atteint: true, stade: 5 } })), "empeche");
  assert.equal(r(vivant({ infection: { atteint: true, stade: 4 } })), "tenu");
  assert.equal(r(vivant({ moral: 0 }), true, () => 0.1), "moral");
  assert.equal(r(vivant({ moral: 0 }), true, () => 0.5), "tenu");
  assert.equal(r(vivant({ moral: 1 }), true, () => 0.1), "tenu", "au moral 1, on note encore");
  assert.equal(L.noteDuJour({ ...c, teneur: "" }, 1, { teneur: vivant(), present: true }).raison, "sans-teneur");
  assert.equal(L.noteDuJour({ ...c, oublieLe: 1 }, 1, { teneur: vivant(), present: true }).raison, "oublie");
  assert.equal(L.noteDuJour({ ...c, noteLe: 1, teneur: "" }, 1, {}).raison, "note", "noté à la main");
  const m = L.journeeCompte(c, { jour: 2, teneur: vivant({ blessures: 4 }), present: true, hasard: h("m") });
  assert.equal(m.evenement, "manque");
  assert.deepEqual(L.texteCompte("manque", { nom: "Lina", raison: m.note.raison }), { cle: "compte-manque-empeche", params: { nom: "Lina" }, texte: "Lina était trop mal pour noter le jour." });
  for (const raison of ["absent", "mort", "empeche", "moral"]) assert.equal(L.texteCompte("manque", { nom: "X", raison }).cle, `compte-manque-${raison}`);
  assert.equal(L.texteCompte("manque", { raison: "sans-teneur" }).cle, "compte-manque-personne");
  for (const cle of [...["retrouve", "doute", "perdu"].map(e => `compte-${e}`), "compte-manque", "compte-manque-personne"]) assert.ok(L.CLES_TEXTES.includes(cle), cle);
});

test("compte : le téléphone ou la radio le remettent juste ; un jour reçu est cru, noté avec son auteur, « à peu près »", () => {
  const perdu = jours(L.compteDepart(0, "a"), 0, 5, { note: false });
  const r = L.journeeCompte(perdu, { jour: 6, exacte: true });
  assert.deepEqual([r.compte.certitude, r.compte.jourCru, r.compte.teneur, r.evenement], ["sur", 6, "a", "retrouve"]);
  assert.equal(L.journeeCompte(L.compteDepart(0), { jour: 1, exacte: true }).evenement, null);
  const recu = L.recevoirJour(perdu, { jourAnnonce: 9, jour: 6, de: "Le vieux des Hauts" });
  assert.deepEqual([recu.certitude, recu.jourCru, recu.marge, recu.recu.de, recu.recu.le, recu.noteLe], ["a-peu-pres", 9, 1, "Le vieux des Hauts", 6, 6]);
  assert.equal(L.ecartDuCompte(recu, 6), 3, "un faux jour : trois jours d'avance, que seul le MJ voit");
  // Un compte d'avant ce lot : celui que la date du groupe disait.
  assert.equal(L.compteDe({ horloge: { quart: 40 }, groupe: { membres: ["x"] } }).certitude, "sur");
  const ancien = L.compteDe({ horloge: { quart: 40 }, calendrier: { exacte: false }, groupe: { membres: ["x"] } });
  assert.deepEqual([ancien.certitude, ancien.jourCru, ancien.teneur], ["perdu", 10, "x"]);
});

// ------------------------------------------------------------------ la lune et l'heure
test("lune : sur un calendrier de l'année, elle redonne le jour à 2 jours près (1 avec les marées) ; une autre année la fausse ; sans lunes, rien", () => {
  const perdu = { ...L.compteDepart(0), certitude: "perdu", jourCru: 70 };
  for (const jour of [20, 45, 80, 130, 200]) {
    const annee = L.dateDuJour(jour, DEPART).annee;
    for (let i = 0; i < 6; i++) {
      const r = L.lireLaLune({ ...perdu, jourCru: jour + 6 }, { jour, dateDepart: DEPART, calendrier: { annee, lunes: true }, hasard: h("lune", jour, i) });
      assert.ok(r.ok && Math.abs(r.trouve - jour) <= 2, `jour ${jour} : ${r.trouve}`);
      assert.deepEqual([r.compte.certitude, r.compte.marge, r.compte.noteLe, r.autreAnnee], ["a-peu-pres", 2, jour, false]);
    }
    const m = L.lireLaLune(perdu, { jour, dateDepart: DEPART, calendrier: { annee, lunes: true, marees: true }, hasard: h("m", jour) });
    assert.ok(Math.abs(m.trouve - jour) <= 1 && m.compte.marge === 1, `marées, jour ${jour} : ${m.trouve}`);
  }
  // Le compte perdu : le mois se lit dans la nature, même si le jour cru a dérivé loin.
  const loin = L.lireLaLune({ ...perdu, jourCru: 95 }, { jour: 75, dateDepart: DEPART, calendrier: { annee: 2027, lunes: true }, hasard: () => 0.5 });
  assert.ok(Math.abs(loin.trouve - 75) <= 2, `${loin.trouve}`);
  // Un vieux calendrier : ses lunes tombent faux, et le jour trouvé aussi.
  let faux = 0;
  for (const jour of [20, 45, 80, 130, 200]) {
    const r = L.lireLaLune(perdu, { jour, dateDepart: DEPART, calendrier: { annee: 2023, lunes: true }, hasard: () => 0.5 });
    assert.equal(r.autreAnnee, true);
    if (Math.abs(r.trouve - jour) > 2) faux++;
  }
  assert.ok(faux >= 4, `${faux} lectures fausses sur 5`);
  assert.equal(L.lireLaLune(perdu, { jour: 20, dateDepart: DEPART, calendrier: null }).motif.cle, "lune-sans-calendrier");
  assert.equal(L.lireLaLune(perdu, { jour: 20, dateDepart: DEPART, calendrier: { annee: 2026, lunes: false } }).motif.cle, "lune-sans-lunes");
});

test("heure : exacte (téléphone, radio, montre), le cadran au soleil ; sinon ±0,5 h de jour clair, ±1,5 h couvert ou nuit claire, ±3 h nuit couverte, perdue sous terre", () => {
  assert.deepEqual(L.heureLue({ moment: "matin", exacte: true }), { exacte: true, marge: 0, cle: "exacte" });
  assert.deepEqual(L.heureLue({ moment: "apres-midi", cadran: true }), { exacte: true, marge: 0, cle: "cadran" });
  assert.equal(L.heureLue({ moment: "apres-midi", cadran: true, pluie: true }).cle, "jour-couvert", "le cadran sans soleil");
  assert.equal(L.heureLue({ moment: "soir", cadran: true }).cle, "nuit-claire");
  assert.equal(L.heureLue({ moment: "matin" }).marge, 0.5);
  assert.equal(L.heureLue({ moment: "matin", couvert: true }).marge, 1.5);
  assert.equal(L.heureLue({ moment: "nuit" }).marge, 1.5);
  assert.equal(L.heureLue({ moment: "nuit", couvert: true }).marge, 3);
  assert.deepEqual(L.heureLue({ moment: "matin", sousTerre: true }), { exacte: false, marge: null, cle: "sous-terre" });
  assert.deepEqual(L.soleilDuMois(1), { lever: "5 h 36", coucher: "18 h 48" });
  assert.deepEqual(L.soleilDuMois(7), { lever: "6 h 42", coucher: "17 h 48" });
});

// ------------------------------------------------------------------ cartes et calendriers
test("repères du registre : 6 cartes, 5 calendriers, la montre, 4 fabrications et la copie ; forme vérifiée ; la chance par lieu reste sous 30 %", () => {
  const reperes = L.reperesDuContenu(D);
  const par = t => reperes.filter(r => r.repere.type === t).map(r => r.cle);
  assert.equal(par("carte").length, 7, "six cartes à trouver et la copie");
  assert.equal(par("calendrier").length, 5);
  assert.deepEqual([par("montre"), par("planche"), par("cadran"), par("cahier"), par("encre")].map(x => x.length), [1, 1, 1, 1, 1]);
  for (const r of reperes) assert.deepEqual(L.erreursRepere(r, D), [], r.cle);
  for (const lieu of L.LIEUX_REPERE) assert.ok(L.chanceRepere(D, lieu) <= L.CHANCE_REPERE_MAX, lieu);
  assert.ok(L.chanceRepere(D, "case-creole") > 0.15 && L.chanceRepere(D, "tunnel-de-lave") === 0);
  // Les erreurs qu'on attrape.
  const mauvais = { ...def("carte-ancienne"), repere: { ...def("carte-ancienne").repere, routesImprimees: { "saint-paul|cilaos": "ouverte" }, terrains: ["mer"], lieux: { lune: 0.1 } } };
  assert.equal(L.erreursRepere(mauvais, D).length, 3);
  assert.ok(L.erreursRepere({ cle: "x", categorie: "repere" }, D).length === 1);
  assert.ok(L.erreursRepere({ ...def("calendrier-des-postes"), repere: { ...def("calendrier-des-postes").repere, annee: "demain" } }, D).length === 1);
});

test("repères : l'année d'un calendrier (celui des postes est déjà de l'an prochain en novembre-décembre), les régions d'une carte, sa moitié, son impression", () => {
  const an = (cle, jour) => L.resoudreRepere(def(cle), { jour, dateDepart: DEPART, contenu: D, hasard: h(cle, jour) }).annee;
  assert.equal(an("calendrier-des-postes", 0), 2027, "le 4 décembre 2026 : celui de 2027");
  assert.equal(an("calendrier-des-postes", 60), 2027, "en février 2027");
  assert.equal(an("calendrier-de-l-annee", 0), 2026);
  for (let j = 0; j < 20; j++) { const a = an("vieux-calendrier", 100 + j); assert.ok(a >= 2023 && a <= 2026, `${a}`); }
  const routiere = L.resoudreRepere(def("carte-routiere-de-l-ile"), { jour: 0, dateDepart: DEPART, contenu: D, hasard: h("r") });
  assert.equal(routiere.regions.length, 16);
  assert.ok(routiere.imprimee >= 2024 && routiere.imprimee <= 2026);
  const plan = L.resoudreRepere(def("plan-de-ville"), { jour: 0, dateDepart: DEPART, region: "saint-pierre", contenu: D, hasard: h("p") });
  assert.deepEqual(plan.regions, ["saint-pierre"]);
  const rando = L.resoudreRepere(def("carte-de-randonnee"), { jour: 0, dateDepart: DEPART, region: "mafate", contenu: D, hasard: h("c") });
  assert.deepEqual(rando.regions, ["mafate"], "trouvée à Mafate : la carte de Mafate");
  const ailleurs = L.resoudreRepere(def("carte-de-randonnee"), { jour: 0, dateDepart: DEPART, region: "saint-denis", contenu: D, hasard: h("c2") });
  assert.ok(["cilaos", "mafate", "salazie", "fournaise"].includes(ailleurs.regions[0]));
  const moitie = L.resoudreRepere(def("moitie-de-carte"), { jour: 0, dateDepart: DEPART, contenu: D, hasard: h("m") });
  assert.ok(["ouest", "est"].includes(moitie.moitie) && moitie.regions.length >= 6 && moitie.regions.length <= 10, `${moitie.regions.length}`);
  const ouest = moitie.moitie === "ouest";
  assert.equal(moitie.regions.includes("saint-paul"), ouest);
  assert.equal(moitie.regions.includes("est"), !ouest);
  const vieille = L.resoudreRepere(def("carte-ancienne"), { jour: 0, dateDepart: DEPART, contenu: D, hasard: h("v") });
  assert.ok(vieille.imprimee <= 1996 && vieille.imprimee >= 1981, `${vieille.imprimee}`);
  const annotee = L.resoudreRepere(def("carte-annotee"), { jour: 0, dateDepart: DEPART, contenu: D, hasard: h("a") });
  assert.ok(Number.isInteger(annotee.annotation) && annotee.annotations[annotee.annotation].texte);
  // Ce qu'on a déjà posé ne bouge plus.
  assert.equal(L.resoudreRepere({ repere: { ...def("calendrier-de-l-annee").repere, annee: 2031 } }, { jour: 0, dateDepart: DEPART, contenu: D }).annee, 2031);
});

test("repères : le calendrier de l'année qu'on croit tient le compte, la planche ensuite ; la lune sur le bon d'abord, à marées d'abord", () => {
  const reperes = [{ type: "planche" }, { type: "calendrier", annee: 2026, lunes: true }, { type: "calendrier", annee: 2027, lunes: true }, { type: "calendrier", annee: 2027, lunes: true, marees: true }];
  assert.equal(L.supportDuCompte(reperes, 2027), "calendrier");
  assert.equal(L.supportDuCompte(reperes, 2028), "planche");
  assert.equal(L.supportDuCompte([], 2027), "");
  assert.deepEqual(L.calendrierPourLaLune(reperes, 2027), { type: "calendrier", annee: 2027, lunes: true, marees: true });
  assert.equal(L.calendrierPourLaLune(reperes, 2026).annee, 2026);
  assert.equal(L.calendrierPourLaLune([{ type: "calendrier", annee: 2026, lunes: false }], 2026), null);
  assert.ok(L.aUneMontre([{ type: "montre" }]) && !L.aUneMontre(reperes) && L.aUnCadran([{ type: "cadran" }]));
});

test("cartes : les routes imprimées (avant la crise, rien des Livides), selon les terrains de la carte ; la vieille carte trompe ; la note d'un mort", () => {
  const avec = (cle, extra = {}) => ({ nom: def(cle).nom, repere: { ...L.resoudreRepere(def(cle), { jour: 0, dateDepart: DEPART, contenu: D, hasard: h(cle) }), ...extra } });
  const routiere = L.ceQueDisentLesCartes([avec("carte-routiere-de-l-ile")], D);
  assert.equal(Object.keys(routiere).length, 16);
  assert.equal(routiere["saint-paul"].routes["saint-leu"], "ouverte");
  assert.equal(routiere["saint-paul"].routes.mafate, undefined, "un sentier : pas sur une carte de routes");
  const rando = L.ceQueDisentLesCartes([avec("carte-de-randonnee", { regions: ["mafate"] })], D);
  assert.deepEqual(Object.keys(rando), ["mafate"]);
  assert.ok(Object.keys(rando.mafate.routes).length >= 4, "les sentiers des cirques");
  const vieille = L.ceQueDisentLesCartes([avec("carte-ancienne")], D);
  assert.equal(vieille["saint-paul"].routes["saint-leu"], "difficile", "sans la route des Tamarins");
  assert.equal(vieille["saint-leu"].routes["saint-paul"], "difficile", "dans les deux sens");
  assert.ok(vieille["sud-sauvage"].notes[0].includes("lave"));
  // La plus récente l'emporte.
  const deux = L.ceQueDisentLesCartes([avec("carte-routiere-de-l-ile"), avec("carte-ancienne")], D);
  assert.equal(deux["saint-paul"].routes["saint-leu"], "ouverte");
  assert.equal(deux["saint-paul"].sources.length, 2);
  const annotee = avec("carte-annotee", { annotation: 0 });
  const a = L.ceQueDisentLesCartes([annotee], D);
  assert.ok(a.cilaos.notes.some(n => n.includes("Îlet à Cordes")));
  assert.deepEqual(L.ceQueDisentLesCartes([], D), {});
});

test("trouvailles : un seul tirage par fouille, la chance du lieu ; rien dans un tunnel de lave", () => {
  const n = 4000;
  for (const lieu of ["case-creole", "commerce", "phare", "region"]) {
    let trouves = 0;
    const cles = new Set();
    for (let i = 0; i < n; i++) { const d = L.tirerRepere(D, { lieu, hasard: h("t", lieu, i) }); if (d) { trouves++; cles.add(d.cle); } }
    const p = L.chanceRepere(D, lieu);
    assert.ok(Math.abs(trouves / n - p) < 0.025, `${lieu} : ${trouves / n} pour ${p}`);
    for (const k of cles) assert.ok(def(k).repere.lieux[lieu] > 0, `${k} à ${lieu}`);
  }
  for (let i = 0; i < 200; i++) assert.equal(L.tirerRepere(D, { lieu: "tunnel-de-lave", hasard: h("tu", i) }), null);
  assert.equal(L.tirerRepere(D, { lieu: "phare", hasard: () => 0.05 }).cle, "calendrier-des-marees-et-des-lunes");
});

// ------------------------------------------------------------------ le journal d'un mort
test("journal d'un mort : sur le corps, là où il est tombé, jusqu'au repos ; le jour qu'il croyait (la marge grandit), les plans", () => {
  const journal = L.journalAuDeces({ jourCru: 30, certitude: "a-peu-pres" }, ["citerne"]);
  const etat = { morts: [{ id: "m1", nom: "Josian", quart: 30 * 4, region: "cilaos", retrouve: true, repos: false, livide: false, journal }] };
  const r = L.lireJournalDuMort(etat, "m1", { jour: 36, region: "cilaos" });
  assert.deepEqual([r.ok, r.jourAnnonce, r.marge, r.plans], [true, 36, 3, ["citerne"]]);
  assert.equal(L.lireJournalDuMort(etat, "Josian", { jour: 36, region: "cilaos" }).ok, true, "par son nom");
  assert.equal(L.lireJournalDuMort(etat, "m1", { jour: 36, region: "mafate" }).motif.cle, "journal-loin");
  const mod = x => ({ morts: [{ ...etat.morts[0], ...x }] });
  assert.equal(L.lireJournalDuMort(mod({ repos: true }), "m1", { region: "cilaos" }).motif.cle, "journal-enterre");
  assert.equal(L.lireJournalDuMort(mod({ livide: true, retrouve: false }), "m1", { region: "cilaos" }).motif.cle, "journal-livide");
  assert.equal(L.lireJournalDuMort(mod({ journal: undefined }), "m1", { region: "cilaos" }).motif.cle, "journal-absent");
  assert.equal(L.lireJournalDuMort(etat, "personne").motif.cle, "mort-inconnu");
  assert.equal(L.lireJournalDuMort(mod({ journal: { ...journal, certitude: "perdu" } }), "m1", { region: "cilaos" }).jourAnnonce, null, "il ne savait plus le jour");
  for (const cle of ["journal-absent", "journal-enterre", "journal-livide", "journal-loin", "lune-sans-calendrier", "lune-sans-lunes"]) assert.ok(L.CLES_TEXTES.includes(cle), cle);
});

test("journal d'un inconnu : ses renseignements entrent s'ils sont plus récents (source « journal » : l'infestation, l'eau, le courant, une note)", () => {
  const avant = { cilaos: { ...L.renseignementVide(), vu: 10, vuDirect: 10, source: "vu", infestation: "calme", pillage: "entame" }, mafate: L.renseignementVide(), salazie: { ...L.renseignementVide(), vu: 30, source: "radio", infestation: "dense" } };
  const r = L.renseignementsDuJournal(avant, {
    cilaos: { vu: 20, infestation: "dense", notes: "Le pont est tombé.", pillage: "vide" },
    mafate: { vu: 15, eau: true },
    salazie: { vu: 25, infestation: "calme" },
    nulle: { vu: 1 }
  }, { jour: 40, contenu: D });
  assert.deepEqual(r.regions.sort(), ["cilaos", "mafate"]);
  assert.deepEqual([r.renseignements.cilaos.infestation, r.renseignements.cilaos.source, r.renseignements.cilaos.vu, r.renseignements.cilaos.vuDirect, r.renseignements.cilaos.pillage],
    ["dense", "journal", 20, 10, "entame"], "le pillage ne se lit que sur place");
  assert.equal(r.renseignements.cilaos.notes, "Le pont est tombé.");
  assert.equal(r.renseignements.salazie.infestation, "dense", "plus vieux que ce qu'on sait : rien ne change");
  assert.ok(L.SOURCES_RENSEIGNEMENT.includes("journal"));
  const futur = L.renseignementsDuJournal({}, { cilaos: { vu: 99, infestation: "calme" } }, { jour: 40, contenu: D });
  assert.equal(futur.renseignements.cilaos.vu, 40, "un journal ne date pas de demain");
});

// ------------------------------------------------------------------ le temps qui passe
function partie({ membres = ["a", "b"], site = "case-de-bellemene" } = {}) {
  const reg = L.siteDe(D, site).region;
  const { monde, etat } = L.demarrerPartie({ contenu: D, graine: "reperes-avancer", region: reg, membres, dateDepart: DEPART });
  const ins = L.installerAbri(monde, D, { site, jour: 0 });
  // Le téléphone tombe au jour 3 dans la région, la radio n'est pas là.
  ins.monde.coupures[reg].telephone = 3;
  return { etat: { ...etat, groupe: { ...etat.groupe, abri: "abri" } }, monde: ins.monde, reg,
    abri: { id: "abri", system: { ...ins.abri, stocks: { ...ins.abri.stocks, eau: 200, nourriture: 200 } }, installations: ins.installations },
    survivants: membres.map(id => ({ id, nom: id.toUpperCase(), system: L.survivantNeuf({ moral: 4 }) })) };
}
test("avancer : le compte suit le téléphone, puis celui qui le tient ; sans calendrier il doute au bout de 10 jours ; sans personne il se perd ; le journal le dit", () => {
  const p = partie();
  assert.deepEqual([p.etat.compte.certitude, p.etat.compte.teneur], ["sur", "a"]);
  let r = L.avancer({ etat: p.etat, monde: p.monde, contenu: D, quarts: 4 * 14, survivants: p.survivants, abri: p.abri, options: { dateDepart: DEPART } });
  assert.deepEqual([r.etat.compte.certitude, r.etat.compte.jourCru], ["a-peu-pres", 14], "10 encoches après la chute du téléphone (jour 3)");
  assert.ok(r.etat.journal.some(e => e.cle === "compte-doute"));
  // Avec un calendrier de l'année qu'on croit, le doute ne vient pas.
  const cal = L.avancer({ etat: p.etat, monde: p.monde, contenu: D, quarts: 4 * 30, survivants: p.survivants, abri: p.abri,
    options: { dateDepart: DEPART, reperes: { calendriers: [2026, 2027], planche: false } } });
  assert.deepEqual([cal.etat.compte.certitude, cal.etat.compte.jourCru], ["sur", 30]);
  // Personne ne tient plus le compte : deux jours, et il est perdu ; une alerte.
  const sans = { ...r.etat, compte: { ...r.etat.compte, teneur: "" } };
  const s = L.avancer({ etat: sans, monde: r.monde, contenu: D, quarts: 4 * 2, survivants: r.acteurs.survivants.length ? r.acteurs.survivants : p.survivants, abri: r.acteurs.abri, options: { dateDepart: DEPART } });
  assert.equal(s.etat.compte.certitude, "perdu");
  assert.ok(s.etat.journal.some(e => e.cle === "compte-manque-personne") && s.etat.journal.some(e => e.cle === "compte-perdu"));
  assert.ok(s.alertes.some(a => a.type === "compte"));
  // Le même monde, la même graine : le même compte (flux « compte|jour » à part).
  const bis = L.avancer({ etat: sans, monde: r.monde, contenu: D, quarts: 4 * 2, survivants: r.acteurs.survivants.length ? r.acteurs.survivants : p.survivants, abri: r.acteurs.abri, options: { dateDepart: DEPART } });
  assert.deepEqual(bis.etat.compte, s.etat.compte);
});

test("avancer : rien d'autre ne bouge (le compte tire dans son propre flux) ; un mort garde son journal ; une partie d'avant le lot reçoit son compte", () => {
  const p = partie();
  const r = L.avancer({ etat: p.etat, monde: p.monde, contenu: D, quarts: 4 * 20, survivants: p.survivants, abri: p.abri, options: { dateDepart: DEPART } });
  const { compte: _c, ...etatSans } = p.etat;
  const vieux = L.avancer({ etat: etatSans, monde: p.monde, contenu: D, quarts: 4 * 20, survivants: p.survivants, abri: p.abri, options: { dateDepart: DEPART } });
  const sansCompte = e => { const { compte, journal, alertes, ...reste } = e; return { ...reste, journal: journal.filter(x => !String(x.cle).startsWith("compte-")), alertes: alertes.filter(a => a.type !== "compte") }; };
  assert.deepEqual(sansCompte(vieux.etat), sansCompte(r.etat), "le reste de la partie est le même");
  assert.deepEqual(vieux.monde, r.monde);
  assert.ok(vieux.etat.compte && vieux.etat.compte.certitude !== undefined, "la partie d'avant a reçu son compte");
  // Un membre meurt : son journal reste sur lui, avec le jour qu'il croyait et les plans.
  const mourant = { ...p, etat: { ...p.etat, groupe: { ...p.etat.groupe, plans: ["citerne"] } }, survivants: [{ ...p.survivants[0], system: { ...p.survivants[0].system, blessures: 4 } }, p.survivants[1]] };
  const m = L.avancer({ etat: mourant.etat, monde: p.monde, contenu: D, quarts: 8, survivants: mourant.survivants, abri: p.abri, options: { dateDepart: DEPART } });
  const mort = (m.etat.morts ?? []).find(x => x.id === "a");
  assert.ok(mort, "le mourant non soigné meurt");
  assert.deepEqual([mort.journal.certitude, mort.journal.plans], ["sur", ["citerne"]]);
});
