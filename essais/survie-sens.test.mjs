// Percevoir dans le noir, le vent et la pluie (lot « sens », 2026-11-17 ; familles 4 et 11 du complément de Fénoir 3D), logique
// pure : la pluie par région et ses tirages, les ravines, la brume, le vent, l'odeur de l'abri et ce qu'elle fait aux menaces,
// l'habitude du noir, la pluie et la brume dehors, approcher un Livide, la Timise, les grenouilles qui se taisent, les corps qui se
// défont, la rue nettoyée, la musique ; et ce que le temps qui passe en fait (avancer).   Lancer : npm run essais
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { L } from "./doublures/survie-outils.mjs";

const D = JSON.parse(readFileSync(new URL("../modules/lakour-fenoir/assets/donnees.json", import.meta.url), "utf8"));
const region = cle => D.regions.find(r => r.cle === cle);
const G = "sens-essai";

function partie(site, { membres = ["a", "b"], stocks = {} } = {}) {
  const reg = L.siteDe(D, site).region;
  const { monde, etat } = L.demarrerPartie({ contenu: D, graine: G, region: reg, membres });
  const ins = L.installerAbri(monde, D, { site, jour: 0 });
  return {
    etat, monde: ins.monde,
    abri: { id: "abri", system: { ...ins.abri, stocks: { ...ins.abri.stocks, eau: 80, nourriture: 80, ...stocks } }, installations: ins.installations },
    survivants: membres.map(id => ({ id, nom: id.toUpperCase(), system: L.survivantNeuf({ moral: 4 }) }))
  };
}

// ------------------------------------------------------------------ la pluie
test("pluie : 30 % par quart en saison des pluies et 10 % en saison sèche pour 1 500 mm, × (mm / 1 500)^0,8, bornée de 2 à 90 %", () => {
  assert.equal(L.chanceDePluie(1500, "pluies"), 0.3);
  assert.equal(L.chanceDePluie(1500, "seche"), 0.1);
  assert.ok(Math.abs(L.chanceDePluie(3000, "pluies") - 0.3 * 2 ** 0.8) < 1e-9);
  assert.equal(L.chanceDePluie(20000, "pluies"), 0.9);
  assert.equal(L.chanceDePluie(10, "seche"), 0.02);
  // Les mm d'une région : des Bas aux Hauts selon l'altitude ; sans pluieAn, d'après climat.pluie.
  assert.equal(L.pluieAnnuelle(region("saint-paul")), 600);
  assert.equal(L.pluieAnnuelle(region("saint-paul"), { hauts: true }), 1500);
  assert.equal(L.pluieAnnuelle(region("cilaos")), 2500);
  assert.equal(L.pluieAnnuelle({ altitude: 0, climat: { pluie: 3 } }), 3500);
  for (const r of D.regions) assert.ok(r.climat.pluieAn.bas > 0 && r.climat.pluieAn.hauts >= r.climat.pluieAn.bas, r.cle);
});

test("pluie : un tirage par quart et par région, le même à chaque fois ; l'Est plus arrosé que l'Ouest ; la saison sèche plus sèche ; 65 % du temps commun", () => {
  const compte = (reg, debut, n) => { let k = 0; for (let q = debut; q < debut + n; q++) if (L.pleutAuQuart({ graine: G, quart: q, region: reg, contenu: D })) k++; return k / n; };
  const est = compte("est", 0, 400), ouest = compte("saint-paul", 0, 400);
  assert.ok(est > 0.5 && est < 0.8, `Est ${est}`);
  assert.ok(ouest > 0.08 && ouest < 0.22, `Saint-Paul ${ouest}`);
  // Le jour 0 tombe le 4 décembre : 600 quarts plus loin (150 jours), c'est la saison sèche (mai).
  const estSec = compte("est", 4 * 160, 400);
  assert.ok(estSec < est / 2, `saison sèche ${estSec}`);
  assert.equal(L.pleutAuQuart({ graine: G, quart: 17, region: "est", contenu: D }), L.pleutAuQuart({ graine: G, quart: 17, region: "est", contenu: D }));
  // Le temps commun : quand il pleut à Saint-Paul, il pleut bien plus souvent dans l'Est que quand Saint-Paul est au sec.
  const n = { pluie: 0, estPluie: 0, sec: 0, estSec: 0 };
  for (let q = 0; q < 2000; q++) {
    const sp = L.pleutAuQuart({ graine: G, quart: q, region: "saint-paul", contenu: D }), e = L.pleutAuQuart({ graine: G, quart: q, region: "est", contenu: D });
    if (sp) { n.pluie++; if (e) n.estPluie++; } else { n.sec++; if (e) n.estSec++; }
  }
  assert.ok(n.estPluie / n.pluie > n.estSec / n.sec + 0.25, JSON.stringify(n));
  // Une intempérie en cours : il pleut.
  const monde = { regions: { "saint-paul": { evenements: [{ cle: "fortes-pluies", depuis: 3, jusqua: 4 }] } } };
  for (let q = 12; q < 20; q++) assert.equal(L.pleutAuQuart({ graine: G, quart: q, region: "saint-paul", contenu: D, monde }), true);
  assert.equal(L.pluieDuJour({ graine: G, jour: 3, region: "saint-paul", contenu: D, monde }), 1);
});

// ------------------------------------------------------------------ les ravines, la brume, le vent
test("ravines : l'eau des Hauts (8 quarts, chacun moitié du suivant) ; temporaire à sec sous 0,15 ; permanente basse en saison sèche ; en crue sous l'intempérie", () => {
  assert.equal(L.etatRavine({ ravine: "temporaire", eau: 0.1 }), "a-sec");
  assert.equal(L.etatRavine({ ravine: "temporaire", eau: 0.2 }), "coule");
  assert.equal(L.etatRavine({ ravine: "permanente", eau: 0, saison: "seche" }), "basse");
  assert.equal(L.etatRavine({ ravine: "permanente", eau: 0, saison: "pluies" }), "coule");
  assert.equal(L.etatRavine({ ravine: "temporaire", eau: 0, crue: true }), "en-crue");
  const eau = L.eauDesHauts({ graine: G, quart: 50, region: "route-du-littoral", contenu: D });
  assert.ok(eau >= 0 && eau <= 1);
  assert.equal(L.eauDesHauts({ graine: G, quart: 0, region: "route-du-littoral", contenu: D }), 0, "rien avant le jour zéro");
  // En saison sèche, la ravine de la Grande Chaloupe est souvent à sec ; en crue, elle arrête la pico-hydro.
  let sec = 0;
  for (let j = 160; j < 220; j++) if (L.ravineDuJour({ graine: G, jour: j, region: "route-du-littoral", contenu: D, ravine: "temporaire" }).etat === "a-sec") sec++;
  assert.ok(sec > 30, `${sec} jours à sec sur 60`);
  const crue = L.ravineDuJour({ graine: G, jour: 5, region: "route-du-littoral", contenu: D, ravine: "permanente", monde: { regions: { "route-du-littoral": { evenements: [{ cle: "crue", depuis: 5, jusqua: 6 }] } } } });
  assert.deepEqual([crue.etat, crue.hydro, crue.eau], ["en-crue", 0, 1]);
  const sans = L.ravineDuJour({ graine: G, jour: 200, region: "route-du-littoral", contenu: D, ravine: "temporaire" });
  assert.ok(sans.etats.length === 4 && sans.hydro >= 0 && sans.hydro <= 1 && sans.eau >= 0.25 && sans.eau <= 1);
});

test("brume au-dessus de 1 000 m l'après-midi et le soir ; vent des alizés vers l'ouest, plus fort en saison sèche, plus faible la nuit", () => {
  assert.equal(L.brumeAuQuart({ altitude: 1200, moment: "apres-midi" }), true);
  assert.equal(L.brumeAuQuart({ altitude: 1200, moment: "matin" }), false);
  assert.equal(L.brumeAuQuart({ altitude: 900, moment: "soir" }), false);
  const vers = new Map();
  let fortSec = 0, fortPluies = 0;
  for (let q = 0; q < 400; q++) {
    const v = L.ventDuQuart({ graine: G, quart: q });
    assert.ok(v.force >= 0 && v.force <= 0.55 && L.DIRECTIONS_VENT.includes(v.vers) && L.DIRECTIONS_VENT.includes(v.de) && ["calme", "brise", "vent"].includes(v.mot));
    assert.ok(v.cap >= 242 && v.cap <= 343, `cap ${v.cap}`);
    vers.set(v.vers, (vers.get(v.vers) ?? 0) + 1);
    fortPluies += v.force;
    fortSec += L.ventDuQuart({ graine: G, quart: q + 4 * 160 }).force;
  }
  assert.ok([...vers.keys()].every(d => ["ouest", "nord-ouest", "nord", "sud-ouest"].includes(d)) && vers.get("ouest") + vers.get("nord-ouest") > 300, JSON.stringify([...vers]));
  assert.ok(fortSec > fortPluies, "plus fort en saison sèche");
  assert.deepEqual(L.ventDuQuart({ graine: G, quart: 9 }), L.ventDuQuart({ graine: G, quart: 9 }));
});

// ------------------------------------------------------------------ l'odeur de l'abri
test("odeur : installations (2 au plus), souillure, sang ; −1 dans les Hauts, −1 sous la pluie ; les bêtes sentent aussi les morts", () => {
  assert.deepEqual(L.odeurAbri({}), { odeur: 0, betes: 0, sources: [], attenuee: [] });
  assert.equal(L.odeurAbri({ installations: 3, souillure: 1, sang: true }).odeur, 4);
  assert.equal(L.odeurAbri({ installations: 2, altitude: 1000 }).odeur, 1);
  assert.equal(L.odeurAbri({ installations: 2, pluie: 0.5 }).odeur, 1);
  const m = L.odeurAbri({ morts: 1 });
  assert.deepEqual([m.odeur, m.betes], [0, 1], "un corps : rien pour les Livides, un point pour les bêtes");
  // Dans le bilan : la cuisine commune au feu de bois sent ; la gazinière (sa sœur moderne, en service d'abord) non.
  const d = partie("villa-rue-de-paris");
  const avec = L.bilanAbri(d.abri.system, [...d.abri.installations, L.instanceInstallation("cuisine-commune", 1)], D, { jour: 0, personnes: 2 });
  assert.equal(avec.odeur, 1);
  assert.deepEqual(avec.odeurSources, ["installations"]);
  const gaz = L.bilanAbri(d.abri.system, [...d.abri.installations, L.instanceInstallation("cuisine-commune", 1), L.instanceInstallation("gaziniere", 1)], D, { jour: 0, personnes: 2 });
  assert.equal(gaz.odeur, 0, "la gazinière cuit sans fumée");
  const plein = L.bilanAbri(d.abri.system, d.abri.installations, D, { jour: 0, personnes: 40 });
  assert.equal(plein.odeur, 1, "un abri surpeuplé sent");
  assert.equal(L.bilanAbri(d.abri.system, d.abri.installations, D, { jour: 0, personnes: 40, pluie: 1 }).odeur, 0, "la pluie l'efface");
  // Les morts sans repos près de l'abri, depuis moins de quinze jours.
  const etat = { morts: [{ region: "r", retrouve: true, repos: false, livide: false, quart: 0 }, { region: "r", retrouve: true, repos: true, quart: 0 }, { region: "x", retrouve: true, quart: 0 }] };
  assert.equal(L.mortsSansRepos(etat, "r", 10), 1);
  assert.equal(L.mortsSansRepos(etat, "r", 20), 0);
});

test("odeur et menaces : chaque point ajoute 2 % à la horde, 1 % aux errants ; celle des bêtes 0,5 % aux chiens ; nulle, le tirage d'avant", () => {
  const monde = { regions: { r: { infestation: 3, factions: {} } }, hordes: [{ id: "h1", region: "r", taille: 2 }], jour: 30 };
  const frequence = (args, n = 3000) => {
    const h = L.creerHasard("menaces-odeur");
    const c = { horde: 0, livides: 0, animaux: 0 };
    for (let i = 0; i < n; i++) for (const m of L.tirerMenaces(monde, D, h, { region: "r", jour: 30, phase: "silence", ...args })) c[m.type] = (c[m.type] ?? 0) + 1;
    return Object.fromEntries(Object.entries(c).map(([k, v]) => [k, v / n]));
  };
  const zero = frequence({}), quatre = frequence({ odeur: 4, odeurBetes: 4 });
  assert.ok(quatre.horde > zero.horde + 0.04, `horde ${zero.horde} -> ${quatre.horde}`);
  assert.ok(quatre.livides > zero.livides + 0.02, `errants ${zero.livides} -> ${quatre.livides}`);
  assert.ok(quatre.animaux > zero.animaux + 0.01, `chiens ${zero.animaux} -> ${quatre.animaux}`);
  // Une odeur nulle ne change rien : mêmes tirages, mêmes menaces qu'un appel sans odeur.
  const h1 = L.creerHasard("x"), h2 = L.creerHasard("x");
  for (let i = 0; i < 200; i++) assert.deepEqual(L.tirerMenaces(monde, D, h1, { region: "r", bruit: 2, visibilite: 3 }), L.tirerMenaces(monde, D, h2, { region: "r", bruit: 2, visibilite: 3, odeur: 0, odeurBetes: 0 }));
});

// ------------------------------------------------------------------ s'habituer au noir
test("habitude du noir : une nuit par nuit, paliers à 2, 6, 14 et 30 ; la lumière ne compte pas et ôte un palier jusqu'à la fin de la nuit", () => {
  let s = L.survivantNeuf();
  assert.deepEqual(L.noirDe(s), { nuits: 0, nuitLe: null, lumiereLe: null });
  const paliers = [];
  for (let j = 0; j < 31; j++) {
    const r = L.compterNuitNoire(s, { quart: 4 * j + 3 });
    assert.equal(r.compte, true);
    s = r.system;
    assert.equal(L.compterNuitNoire(s, { quart: 4 * j + 3 }).compte, false, "une seule fois par nuit");
    if (r.palier > r.avant) paliers.push([j + 1, r.palier]);
  }
  assert.deepEqual(paliers, [[2, 1], [6, 2], [14, 3], [30, 4]]);
  assert.equal(L.compterNuitNoire(s, { quart: 4 * 40 + 3, lumiere: true }).compte, false);
  const ebloui = L.allumerDansLeNoir(s, 4 * 41 + 2);
  assert.equal(L.palierNoirEffectif(ebloui, 4 * 41 + 3), 3, "un palier de moins cette nuit");
  assert.equal(L.palierNoirEffectif(ebloui, 4 * 42 + 3), 4, "la nuit suivante, l'habitude revient");
  assert.equal(L.compterNuitNoire(ebloui, { quart: 4 * 41 + 3 }).compte, false, "la nuit où l'on a allumé ne compte pas");
  assert.equal(L.texteNoir(2, "Ana").cle, "noir-palier-2");
});

test("dés dans le noir : le palier 2 compense la nuit noire, jamais plus de +1 avec la nuit ; yeux fermés +1 ; écoute active (palier 4) +1 et du bruit", () => {
  assert.deepEqual(L.desDuNoir("vigilance", { clarte: 0, palier: 1 }), { des: 0, bruit: 0, immobile: false });
  assert.equal(L.desDuNoir("vigilance", { clarte: 0, palier: 2 }).des, 1, "nuit noire : −1 +1");
  assert.equal(L.desDuNoir("vigilance", { clarte: 1, palier: 3 }).des, 1);
  assert.equal(L.desDuNoir("vigilance", { clarte: 3, palier: 4 }).des, 0, "pleine lumière : déjà +1");
  assert.equal(L.desDuNoir("vigilance", { clarte: null, palier: 4 }).des, 0, "le jour : rien");
  assert.deepEqual(L.desDuNoir("vigilance", { clarte: 0, palier: 4, ecoute: "active" }), { des: 2, bruit: 1, immobile: false });
  assert.equal(L.desDuNoir("vigilance", { clarte: 0, palier: 3, ecoute: "active" }).des, 1, "l'écoute active demande le palier 4");
  assert.deepEqual(L.desDuNoir("vigilance", { clarte: null, ecoute: "yeux-fermes" }), { des: 1, bruit: 0, immobile: true });
  assert.equal(L.desDuNoir("discretion", { clarte: 0, palier: 4 }).des, 0);
  assert.equal(L.desDuTemps("vigilance", { pluie: true }), -1);
  assert.equal(L.desDuTemps("discretion", { brume: true }), 1);
  assert.equal(L.desDuTemps("vigilance", { pluie: true, brume: true }), -1, "pas cumulés");
  assert.equal(L.desDuTemps("combat", { pluie: true }), 0);
});

test("approcher un Livide : il voit mal le jour (+1), l'aveugle (+1 sans bruit, −1 avec), le coureur (−1), le vent, le froid qui fige (+2)", () => {
  const p = cle => L.perceptionDe(D, cle);
  assert.equal(L.desFaceALivide(p("livide-des-hauts"), { nuit: false }), 1);
  assert.equal(L.desFaceALivide(p("livide-des-hauts"), { nuit: true, altitude: 1200 }), 2);
  assert.equal(L.desFaceALivide(p("livide-des-hauts"), { vent: "vers-lui" }), 1, "il n'a pas d'odorat");
  assert.equal(L.desFaceALivide(p("livide-brule"), {}), 1);
  assert.equal(L.desFaceALivide(p("livide-brule"), { bruit: true }), -2);
  assert.equal(L.desFaceALivide(p("coureur"), { vent: "vers-lui" }), -2);
  assert.equal(L.desFaceALivide(p("livide-frais"), { vent: "vers-moi" }), 1);
  assert.equal(L.desFaceALivide(p("livide-frais"), {}), 0);
});

// ------------------------------------------------------------------ Timise, corps, rue nettoyée, musique
test("Timise de plus en plus souvent quand l'île s'éteint ; corps frais, desséchés, en lambeaux (jamais dans les Hauts) ; une rue nettoyée se repeuple", () => {
  assert.ok(L.chanceTimise({ zone: "cirque", jour: 0 }) < L.chanceTimise({ zone: "cirque", jour: 200 }));
  assert.ok(Math.abs(L.chanceTimise({ zone: "cirque", jour: 2000 }) - 0.035 * 3) < 1e-9, "plafond × 3");
  assert.ok(L.chanceTimise({ zone: "littoral" }) < L.chanceTimise({ zone: "hauts" }));
  assert.equal(L.corpsDesLivides({ jour: 20, altitude: 100 }).etat, "frais");
  assert.equal(L.corpsDesLivides({ jour: 50, altitude: 100 }).etat, "desseche");
  assert.deepEqual(L.corpsDesLivides({ jour: 90, altitude: 100 }), { etat: "lambeaux", vitesse: 0.55 });
  assert.equal(L.corpsDesLivides({ jour: 50, altitude: 1200 }).etat, "frais");
  assert.equal(L.corpsDesLivides({ jour: 900, altitude: 1200 }).etat, "desseche");
  let n = L.nettoyerLieu([], { region: "r", site: "", jour: 10, tues: 20 });
  assert.equal(L.facteurNettoyage(n, { region: "r", jour: 10 }), 0.25);
  assert.ok(Math.abs(L.facteurNettoyage(n, { region: "r", jour: 25 }) - 0.75) < 0.02, "une quinzaine de jours");
  assert.ok(L.facteurNettoyage(n, { region: "r", jour: 45 }) > 0.9);
  assert.equal(L.facteurNettoyage(n, { region: "r", site: "ailleurs", jour: 10 }), 1, "un autre lieu n'en sait rien");
  n = L.nettoyerLieu(n, { region: "r", jour: 200, tues: 5 });
  assert.equal(n.length, 1, "un vieux nettoyage oublié");
});

test("musique : +1 moral au plus une fois par semaine, du bruit (1 ou 3) ; l'ancrage instrument d'un pratiquant ; le moment musical", () => {
  assert.deepEqual(L.veilleeMusique({ air: "doux", jour: 3 }), { bruit: 1, moral: 1, musiqueLe: 3 });
  assert.deepEqual(L.veilleeMusique({ air: "fort", jour: 6, derniere: 3 }), { bruit: 3, moral: 0, musiqueLe: 3 });
  assert.equal(L.veilleeMusique({ jour: 10, derniere: 3 }).moral, 1);
  const musicien = { regard: "vivre", pratique: true, ancrage: "musique" };
  assert.equal(L.bruitDesMusiciens([musicien], D), 1);
  assert.equal(L.bruitDesMusiciens([{ ...musicien, pratique: false }], D), 0);
  assert.equal(L.bruitDesMusiciens([{ ...musicien, regard: "" }], D), 0, "un esprit pas tiré : rien");
  const d = partie("villa-rue-de-paris");
  assert.equal(L.bilanAbri(d.abri.system, d.abri.installations, D, { jour: 0, personnes: 2, musique: 1 }).bruit,
    L.bilanAbri(d.abri.system, d.abri.installations, D, { jour: 0, personnes: 2 }).bruit + 1);
  assert.equal(L.momentMusical({ jour: 5, reposLe: 5 }), "maloya");
  assert.equal(L.momentMusical({ mois: 12, jourMois: 20 }), "maloya");
  assert.equal(L.momentMusical({ moment: "soir", jour: 8, mortLe: 7 }), "guitare-grave");
  assert.equal(L.momentMusical({ moment: "soir", lune: "nouvelle" }), "silence");
  assert.equal(L.momentMusical({ assaut: true }), "rouler");
  assert.equal(L.momentMusical({ fete: "dipavali" }), "sega");
  assert.equal(L.voixDeLaRegion(region("cilaos")), "remparts");
});

// ------------------------------------------------------------------ la ravine dans le bilan
test("ravine du site : à sec, la pico-hydro s'arrête et l'eau du site tombe au quart ; sans ravine, comme avant", () => {
  const d = partie("lazaret-de-la-grande-chaloupe");
  assert.equal(L.siteDe(D, "lazaret-de-la-grande-chaloupe").ravine, "temporaire");
  const insts = [...d.abri.installations, L.instanceInstallation("pico-hydro", 1, { termineLe: 0 })];
  const avant = L.bilanAbri(d.abri.system, insts, D, { jour: 0, personnes: 2 });
  const sec = L.bilanAbri(d.abri.system, insts, D, { jour: 0, personnes: 2, ravine: { hydro: 0, eau: 0.25, etat: "a-sec" } });
  const coule = L.bilanAbri(d.abri.system, insts, D, { jour: 0, personnes: 2, ravine: { hydro: 1, eau: 1, etat: "coule" } });
  assert.equal(avant.production.energie, coule.production.energie);
  assert.ok(!sec.production.energie && avant.production.energie > 0, "pico-hydro arrêtée");
  assert.equal(sec.eauSite, 3);
  assert.equal(coule.eauSite, 12);
  assert.equal(sec.ravine, "a-sec");
  assert.equal(avant.ravine, undefined);
});

// ------------------------------------------------------------------ avancer
test("avancer : la garde de nuit s'habitue au noir (pas dans un abri éclairé) ; le palier passe au journal", () => {
  const d = partie("villa-rue-de-paris");
  d.survivants[0].system.tache = "garde";
  const r = L.avancer({ ...d, contenu: D, quarts: 4 * 7 });
  const a = r.acteurs.survivants.find(s => s.id === "a");
  assert.equal(L.noirDe(a.system).nuits, 7);
  assert.equal(L.noirDe(r.acteurs.survivants.find(s => s.id === "b")?.system ?? d.survivants[1].system).nuits, 0, "qui dort ne s'habitue pas");
  assert.ok(r.etat.journal.some(e => e.cle === "noir-palier-1") && r.etat.journal.some(e => e.cle === "noir-palier-2"));
  const eclaire = L.avancer({ ...d, contenu: D, quarts: 4 * 3, options: { lumiere: true } });
  assert.equal(L.noirDe(eclaire.acteurs.survivants.find(s => s.id === "a")?.system ?? {}).nuits, 0);
});

test("avancer : les grenouilles se taisent une fois quand une horde entre dans la région ; celui qui a le palier 3 entend les pas", () => {
  const d = partie("villa-rue-de-paris");
  d.survivants[0].system = { ...d.survivants[0].system, tache: "garde", noir: { nuits: 20, nuitLe: null, lumiereLe: null } };
  d.monde = { ...d.monde, hordes: [{ id: "hx", region: d.etat.groupe.region, taille: 2, cap: null, depuis: 0 }] };
  const r = L.avancer({ ...d, contenu: D, quarts: 4 });
  const silences = r.etat.journal.filter(e => e.cle === "grenouilles-silence");
  if ((r.monde.hordes ?? []).some(h => h.region === d.etat.groupe.region)) {
    assert.equal(silences.length, 1);
    assert.ok(r.etat.journal.some(e => e.cle === "noir-horde-entendue" && e.params.nom === "A"));
    assert.ok(r.alertes.some(a => a.type === "silence"));
    assert.deepEqual(r.monde.silences, r.monde.hordes.filter(h => h.region === d.etat.groupe.region).map(h => h.id));
    const r2 = L.avancer({ ...d, etat: r.etat, monde: r.monde, contenu: D, quarts: 4 });
    if (r2.monde.hordes.some(h => h.region === d.etat.groupe.region && r.monde.silences.includes(h.id))) assert.ok(!r2.etat.journal.slice(r.etat.journal.length).some(e => e.cle === "grenouilles-silence"), "une fois par horde");
  }
  const sans = L.avancer({ ...partie("villa-rue-de-paris"), contenu: D, quarts: 4 });
  assert.ok(!sans.etat.journal.some(e => e.cle === "grenouilles-silence"), "sans horde, les grenouilles chantent");
});

test("avancer : la Timise crie certaines nuits dans les Hauts ; le cri reconnu par qui a l'habitude ; tout est traduisible", () => {
  const d = partie("ferme-de-la-plaine-des-cafres");
  d.survivants[0].system = { ...d.survivants[0].system, tache: "garde" };
  const r = L.avancer({ ...d, contenu: D, quarts: 4 * 120 });
  const cris = r.etat.journal.filter(e => e.cle === "timise" || e.cle === "timise-reconnue");
  assert.ok(cris.length >= 2, `${cris.length} cris en 120 nuits`);
  assert.ok(r.etat.journal.some(e => e.cle === "timise-reconnue"), "après deux nuits de garde, on la reconnaît");
  for (const cle of ["noir-palier-1", "noir-palier-4", "grenouilles-silence", "noir-horde-entendue", "timise", "timise-reconnue"]) assert.ok(L.CLES_TEXTES.includes(cle), cle);
});

test("avancer : l'odeur de l'abri va aux menaces ; la ravine et la pluie au bilan du jour", () => {
  const d = partie("lazaret-de-la-grande-chaloupe");
  d.abri.installations = [...d.abri.installations, L.instanceInstallation("pico-hydro", 1, { termineLe: 0 }), L.instanceInstallation("cuisine-commune", 1)];
  const r = L.avancer({ ...d, contenu: D, quarts: 4 * 3 });
  assert.equal(r.bilan.odeur, 1);
  assert.ok(["a-sec", "basse", "coule", "en-crue"].includes(r.bilan.ravine));
});
