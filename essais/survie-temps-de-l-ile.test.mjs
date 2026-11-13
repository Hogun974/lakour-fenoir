// Le temps de l'île et la mort (lot « fetes », 2026-11-13 ; familles 1 et 6 du complément de Fénoir 3D), logique pure : la lune
// et la clarté de la nuit, le ciel qui la cache, ce que la nuit change dehors, la chaleur, les signes du paysage et la date lue ;
// les fêtes et leurs gains et coûts, les liens et la participation aux fêtes des autres ; les souvenirs, le deuil, l'autel, le repos ;
// la relève et les jeunes.  Lancer : npm run essais
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { L, contenuMini } from "./doublures/survie-outils.mjs";

const C = contenuMini();
const D = JSON.parse(readFileSync(new URL("../modules/lakour-fenoir/assets/donnees.json", import.meta.url), "utf8"));
const fete = cle => D.fetes.find(f => f.cle === cle);
const fixe = v => () => v;

function depart(site = "hauts-ferme") {
  const region = L.siteDe(C, site).region;
  const { monde, etat } = L.demarrerPartie({ contenu: C, graine: "temps", region, membres: ["a", "b"] });
  const ins = L.installerAbri(monde, C, { site, jour: 0 });
  return {
    etat, monde: ins.monde,
    abri: { id: "abri", system: { ...ins.abri, stocks: { ...ins.abri.stocks, nourriture: 60, materiaux: 20, graines: 0 } }, installations: ins.installations },
    survivants: [{ id: "a", nom: "Ana", system: L.survivantNeuf({ moral: 3 }) }, { id: "b", nom: "Bao", system: L.survivantNeuf({ moral: 3, statut: "recrue" }) }]
  };
}

// ------------------------------------------------------------------ la lune
test("lune : nouvelles et pleines lunes connues de 2026, à un jour près ; phase, part éclairée", () => {
  for (const iso of ["2026-02-17", "2026-11-09", "2026-12-09"]) {
    const l = L.lune(iso);
    assert.equal(l.phase, "nouvelle", iso);
    assert.ok(l.eclairee < 0.05, iso);
  }
  for (const iso of ["2026-03-03", "2026-11-24", "2026-12-24"]) {
    const l = L.lune(iso);
    assert.equal(l.phase, "pleine", iso);
    assert.ok(l.eclairee > 0.95, iso);
  }
  assert.equal(L.lune("n'importe quoi"), null);
  // Un mois synodique : la même phase revient.
  assert.equal(L.lune("2027-01-08").phase, "nouvelle");
});

test("clarté : le jour rien ; la nuit selon la lune levée, sa part éclairée et le ciel", () => {
  const pleine = L.lune("2026-12-24"), nouvelle = L.lune("2026-12-09");
  assert.equal(L.clarte(pleine, "matin"), null);
  assert.equal(L.clarte(pleine, "apres-midi"), null);
  assert.equal(L.clarte(pleine, "soir"), 3);
  assert.equal(L.clarte(pleine, "nuit"), 3);
  assert.equal(L.clarte(pleine, "nuit", { couvert: true }), 0, "la brume cache la pleine lune");
  assert.equal(L.clarte(nouvelle, "soir"), 0);
  // Un premier croissant s'est couché avant le cœur de la nuit ; une lune décroissante ne se lève que tard.
  const croissant = { age: 4, eclairee: 0.2 };
  assert.equal(L.luneLevee(croissant, "soir"), true);
  assert.equal(L.luneLevee(croissant, "nuit"), false);
  const decroissante = { age: 21, eclairee: 0.6 };
  assert.equal(L.luneLevee(decroissante, "soir"), false);
  assert.equal(L.luneLevee(decroissante, "nuit"), true);
  assert.equal(L.clarte(decroissante, "nuit"), 2);
});

test("ciel : couvert selon la zone et la saison, toujours sous la pluie forte et le cyclone ; deux tirages par nuit", () => {
  assert.equal(L.chanceCouvert({ zone: "littoral", saison: "seche" }), L.CIEL.littoral.seche);
  assert.ok(L.chanceCouvert({ zone: "hauts", saison: "pluies" }) > L.chanceCouvert({ zone: "littoral", saison: "pluies" }), "la brume des Hauts");
  assert.equal(L.chanceCouvert({ zone: "littoral", evenements: ["cyclone"] }), 1);
  assert.deepEqual(L.cielDeLaNuit(fixe(0.99), { zone: "littoral" }), { soir: false, nuit: false });
  assert.deepEqual(L.cielDeLaNuit(fixe(0), { zone: "littoral" }), { soir: true, nuit: true });
  const suite = [0.9, 0.1];
  assert.deepEqual(L.cielDeLaNuit(() => suite.shift(), { zone: "hauts", saison: "pluies" }), { soir: false, nuit: true }, "une nuit claire devient noire");
});

test("nuit dehors : noir total, −1 dé sauf la discrétion (+1) ; pleine lumière, vigilance +1, discrétion −1", () => {
  assert.equal(L.desDeNuit("tir", 0), -1);
  assert.equal(L.desDeNuit("discretion", 0), 1);
  assert.equal(L.desDeNuit("tir", 2), 0);
  assert.equal(L.desDeNuit("vigilance", 3), 1);
  assert.equal(L.desDeNuit("discretion", 3), -1);
  assert.equal(L.desDeNuit("tir", null), 0, "le jour, rien");
  assert.equal(L.facteurRencontreNuit(3), 1.2, "les Livides y voient aussi");
  assert.equal(L.facteurRencontreNuit(null), 1);
  assert.equal(L.facteurButinNuit(0), 1.25);
});

test("fouiller et rencontrer de nuit : la nuit noire rapporte plus, sans rien changer quand la clarté n'est pas donnée", () => {
  const { monde } = depart();
  const region = Object.keys(monde.regions)[0];
  const args = { region, membres: 3, quarts: 2, prudence: "normal", jour: 3, moment: "nuit" };
  const sans = L.fouiller(monde, C, fixe(0.5), args);
  const jourNul = L.fouiller(monde, C, fixe(0.5), { ...args, clarte: null });
  assert.deepEqual(jourNul.butin, sans.butin, "clarté absente : le même tirage qu'avant le lot");
  const noire = L.fouiller(monde, C, fixe(0.5), { ...args, clarte: 0 });
  const total = b => Object.values(b).reduce((s, x) => s + x, 0);
  assert.ok(total(noire.butin) >= total(sans.butin), `${total(noire.butin)} contre ${total(sans.butin)}`);
  // La chance d'une rencontre : × 1,2 en pleine lumière, × 0,85 en nuit noire. On cherche le seuil du premier tirage (bissection).
  const seuil = clarte => {
    let bas = 0, haut = 1;
    for (let k = 0; k < 40; k++) {
      const v = (bas + haut) / 2;
      let premier = true;
      const h = () => { if (premier) { premier = false; return v; } return 0.5; };
      if (L.tirerRencontre(monde, C, h, { region, jour: 30, moment: "matin", contexte: "fouille", clarte })) bas = v; else haut = v;
    }
    return bas;
  };
  const base = seuil(null);
  assert.ok(base > 0 && base < 0.5, `seuil ${base}`);
  assert.ok(Math.abs(seuil(3) - base * 1.2) < 1e-6, "pleine lumière : les Livides y voient aussi");
  assert.ok(Math.abs(seuil(0) - base * 0.85) < 1e-6, "nuit noire");
  assert.ok(Math.abs(seuil(2) - base) < 1e-6);
});

test("chaleur de l'été austral : l'après-midi, dans les Bas, de décembre à mars, −1 dé en endurance", () => {
  assert.equal(L.desDeChaleur("endurance", { mois: 1, altitude: 50, moment: "apres-midi" }), -1);
  assert.equal(L.desDeChaleur("endurance", { mois: 1, altitude: 1200, moment: "apres-midi" }), 0, "les Hauts");
  assert.equal(L.desDeChaleur("endurance", { mois: 7, altitude: 50, moment: "apres-midi" }), 0, "l'hiver austral");
  assert.equal(L.desDeChaleur("endurance", { mois: 1, altitude: 50, moment: "matin" }), 0);
  assert.equal(L.desDeChaleur("tir", { mois: 1, altitude: 50, moment: "apres-midi" }), 0);
});

test("le paysage marque l'année ; la date se lit dans la nature sans téléphone ni radio", () => {
  assert.ok(L.signesDuMois(12).includes("flamboyants") && L.signesDuMois(12).includes("letchis"));
  assert.ok(L.signesDuMois(2).includes("longanis") && !L.signesDuMois(2).includes("letchis"), "les letchis, puis les longanis");
  assert.ok(L.signesDuMois(1, { altitude: 50 }).includes("chaleur"));
  assert.ok(!L.signesDuMois(1, { altitude: 1200 }).includes("chaleur"));
  assert.ok(L.signesDuMois(7, { altitude: 1200 }).includes("brume-froide"));
  assert.deepEqual(L.dateSue({ mois: 2, jourMois: 5, iso: "2027-02-05", telephone: true }), { exacte: true });
  assert.deepEqual(L.dateSue({ mois: 2, jourMois: 5, iso: "2027-02-05", telephone: false, radio: true }), { exacte: true });
  const lue = L.dateSue({ mois: 2, jourMois: 5, iso: "2027-02-05", telephone: false });
  assert.equal(lue.exacte, false);
  assert.equal(lue.tiers, "debut");
  assert.ok(L.PHASES_LUNE.includes(lue.phase));
  assert.equal(L.tiersDuMois(15), "mi");
  assert.equal(L.tiersDuMois(28), "fin");
});

// ------------------------------------------------------------------ les fêtes
test("fêter : chaque fête de Fénoir s'applique, avec son gain et son coût, une fois par an", () => {
  for (const f of D.fetes) {
    const d = depart();
    const { effet } = L.effetDeFete(f);
    const r = L.feter(d.etat, d.abri, { fete: f.cle, annee: 2026, survivants: d.survivants, effet, jour: 5 });
    assert.equal(r.ok, true, `${f.cle} : ${r.raison}`);
    const cout = L.coutDeFete(effet, 2);
    for (const [res, n] of Object.entries(cout)) assert.equal(r.abri.system.stocks[res], d.abri.system.stocks[res] - n + (r.gain[res] ?? 0), `${f.cle} : ${res}`);
    assert.equal(L.feter(r.etat, r.abri, { fete: f.cle, annee: 2026, survivants: r.survivants, effet }).ok, false, `${f.cle} : une fois par an`);
  }
});

test("fêter : Dipavali, lueur ; Fèt Kaf, bruit et souvenir ; Noël, surplus et cadeau ; Cavadee, vœu ; musique, en silence", () => {
  const d = depart();
  const dip = L.feter(d.etat, d.abri, { fete: "dipavali", annee: 2026, survivants: d.survivants, effet: L.effetDeFete(fete("dipavali")).effet, jour: 4 });
  assert.deepEqual(dip.survivants.map(s => s.system.moral), [5, 5], "+2 de moral");
  assert.equal(L.lueurDuJour(dip.etat, 4), 3, "chaque flamme attire");
  assert.equal(L.lueurDuJour(dip.etat, 5), 0, "une nuit seulement");
  const kaf = L.feter(d.etat, d.abri, { fete: "liberte", annee: 2026, survivants: d.survivants, effet: L.effetDeFete(fete("liberte")).effet, jour: 10 });
  assert.equal(kaf.bruit, 4, "le tambour s'entend de très loin");
  assert.equal(L.espritDuJour(kaf.etat, "a", 12), 1, "le maloya soutient trois jours");
  assert.equal(L.espritDuJour(kaf.etat, "a", 13), 0);
  const noel = L.feter(d.etat, d.abri, { fete: "noel", annee: 2026, survivants: d.survivants, effet: L.effetDeFete(fete("noel")).effet, jour: 0 });
  assert.equal(noel.abri.system.stocks.nourriture, 60 - 4, "deux rations chacun");
  assert.deepEqual(noel.attaches, ["b"], "le cadeau attache la recrue");
  assert.equal(noel.survivants[1].system.statut, "compagnon");
  assert.equal(noel.etat.groupe.statuts.b, "compagnon");
  const cav = L.feter(d.etat, d.abri, { fete: "cavadee", annee: 2027, survivants: d.survivants, effet: L.effetDeFete(fete("cavadee")).effet, pour: ["a"], jour: 20 });
  assert.deepEqual(cav.voeux, ["a"]);
  assert.equal(cav.survivants[0].system.fatigue, 1, "le carême");
  assert.equal(cav.survivants[1].system.fatigue, 0);
  assert.equal(L.espritDuJour(cav.etat, "a", 300), 1, "tant qu'on tient le vœu");
  assert.equal(L.espritDuJour(cav.etat, "b", 300), 0);
  const e = L.effetDeFete(fete("musique"), "silence");
  assert.equal(e.option, "silence");
  const sil = L.feter(d.etat, { ...d.abri, system: { ...d.abri.system } }, { fete: "musique", annee: 2027, survivants: d.survivants.map(s => ({ ...s, system: { ...s.system, fatigue: 2 } })), effet: e.effet });
  assert.equal(sil.bruit, 0);
  assert.deepEqual(sil.survivants.map(s => s.system.fatigue), [1, 1]);
  assert.equal(L.effetDeFete(fete("musique")).option, "musique", "la musique par défaut");
});

test("fêter : Nouvel An chinois (hygiène, deux quarts, lien), Nouvel An tamoul (graines), Aïd el-Kebir (un cabri, renom, réfugiés), marche sur le feu", () => {
  const d = depart();
  const nac = L.feter(d.etat, d.abri, { fete: "nouvel-an-chinois", annee: 2027, survivants: d.survivants, effet: L.effetDeFete(fete("nouvel-an-chinois")).effet, avec: "planteurs", jour: 60 });
  assert.equal(nac.quarts, 2);
  assert.equal(L.hygieneDuJour(nac.etat, 80), true);
  assert.equal(L.hygieneDuJour(nac.etat, 90), false);
  assert.equal(L.liensAvec(nac.etat, "planteurs"), 1);
  const tam = L.feter(d.etat, d.abri, { fete: "nouvel-an-tamoul", annee: 2027, survivants: d.survivants, effet: L.effetDeFete(fete("nouvel-an-tamoul")).effet, avec: "planteurs" });
  assert.equal(tam.abri.system.stocks.graines, 4, "deux mises de côté, deux échangées");
  const seul = L.feter(d.etat, d.abri, { fete: "nouvel-an-tamoul", annee: 2027, survivants: d.survivants, effet: L.effetDeFete(fete("nouvel-an-tamoul")).effet });
  assert.equal(seul.abri.system.stocks.graines, 2);
  const aid = L.feter(d.etat, d.abri, { fete: "aid-el-kebir", annee: 2027, survivants: d.survivants, effet: L.effetDeFete(fete("aid-el-kebir")).effet, avec: "planteurs" });
  assert.equal(aid.abri.system.stocks.nourriture, 54, "un cabri : six rations");
  assert.equal(aid.etat.liens.renom, 1);
  assert.equal(L.liensAvec(aid.etat, "planteurs"), 2);
  assert.equal(aid.refugies, true);
  const pauvre = { ...d.abri, system: { ...d.abri.system, stocks: { ...d.abri.system.stocks, materiaux: 1 } } };
  const feu = L.feter(d.etat, pauvre, { fete: "marche-sur-le-feu", annee: 2027, survivants: d.survivants, effet: L.effetDeFete(fete("marche-sur-le-feu")).effet });
  assert.equal(feu.ok, false, "beaucoup de bois");
  assert.equal(feu.motif.cle, "fete-manque");
  const feu2 = L.feter(d.etat, d.abri, { fete: "marche-sur-le-feu", annee: 2027, survivants: d.survivants, effet: L.effetDeFete(fete("marche-sur-le-feu")).effet, jour: 3 });
  assert.equal(L.sangFroidDuJour(feu2.etat, 16), 1, "deux semaines de sang-froid");
  assert.equal(L.sangFroidDuJour(feu2.etat, 17), 0);
  assert.equal(feu2.abri.system.stocks.materiaux, 16);
});

test("aller à la fête des autres : un lien avec la communauté et la faction, une fois par fête, par an et par hôte ; recruter chez eux", () => {
  const d = depart();
  const r = L.participer(d.etat, { fete: "dipavali", annee: 2026, jour: 3, communaute: "malbars", faction: "planteurs", qui: ["a"] });
  assert.equal(r.ok, true);
  assert.equal(r.etat.liens.communautes.malbars, 1);
  assert.equal(L.liensAvec(r.etat, "planteurs"), 1);
  assert.equal(L.participationsChez(r.etat, "malbars"), 1, "le point d'accroche des préjugés");
  assert.equal(L.participer(r.etat, { fete: "dipavali", annee: 2026, communaute: "malbars", faction: "planteurs", qui: ["a"] }).ok, false);
  assert.equal(L.participer(r.etat, { fete: "dipavali", annee: 2026, communaute: "chinois", qui: ["a"] }).ok, true, "un autre hôte");
  assert.equal(L.participer(d.etat, { fete: "dipavali", annee: 2026, communaute: "malbars", qui: [] }).ok, false);
  assert.equal(L.attitudeAvecLiens("mefiante", 1), "mefiante");
  assert.equal(L.attitudeAvecLiens("mefiante", 2), "neutre");
  assert.equal(L.attitudeAvecLiens("amicale", 5), "amicale");
  const pleins = L.ajouterLiens(d.etat, { faction: "planteurs", n: 9 });
  assert.equal(L.liensAvec(pleins, "planteurs"), L.LIENS_MAX);
});

// ------------------------------------------------------------------ souvenirs, deuil, autel, repos
test("avancer : un souvenir de fête relève le plafond du moral ; la lueur se voit ; l'hygiène divise le risque des maladies", () => {
  const d = depart();
  d.survivants[0].system.moral = 3;
  const avec = L.ajouterSouvenir(d.etat, { cle: "soutien", source: "noel", depuis: 0, jusqua: 10, moral: 1 });
  const sans = L.avancer({ ...d, contenu: C, quarts: 8 });
  const r = L.avancer({ ...d, etat: avec, contenu: C, quarts: 8 });
  const moral = x => x.acteurs.survivants.find(s => s.id === "a")?.system.moral ?? 3;
  assert.ok(moral(r) > moral(sans), `${moral(r)} contre ${moral(sans)}`);
  const b0 = L.bilanAbri(d.abri.system, d.abri.installations, C, { personnes: 12 });
  const b1 = L.bilanAbri(d.abri.system, d.abri.installations, C, { personnes: 12, lueur: 3 });
  assert.equal(b1.visibilite, Math.min(10, b0.visibilite + 3));
  const def = { declencheur: "eau", risque: 0.1 };
  assert.equal(L.facteurRisque(def, { hygiene: true }), L.facteurRisque(def, {}) * 0.5);
  // Les souvenirs finis s'effacent.
  assert.equal(r.etat.souvenirs.length, 1);
  const tard = L.avancer({ ...d, etat: avec, contenu: C, quarts: 4 * 13 });
  assert.equal(tard.etat.souvenirs.length, 0);
});

test("la mort : le mort s'inscrit à l'autel, le choc ôte 1 de moral, le deuil pèse jusqu'au repos ; un Livide relevé n'est pas retrouvé", () => {
  const d = depart();
  d.survivants[0].system.blessures = 4;     // mourant, non stabilisé : mort à la fin du quart
  d.survivants[1].system.moral = 4;
  const r = L.avancer({ ...d, contenu: C, quarts: 1 });
  assert.equal(r.etat.morts.length, 1);
  assert.equal(r.etat.morts[0].nom, "Ana");
  assert.equal(r.etat.morts[0].retrouve, true);
  assert.equal(r.acteurs.survivants.find(s => s.id === "b").system.moral, 3, "le choc");
  assert.equal(L.deuil(r.etat), true);
  assert.equal(L.espritDuJour(r.etat, "b", 1), -1);
  // Un mort d'AVANT (déjà mort au début de l'appel) ne s'inscrit pas de lui-même.
  const deja = { ...d, survivants: [{ ...d.survivants[0], system: L.survivantNeuf({ vivant: false }) }, d.survivants[1]] };
  assert.equal(L.avancer({ ...deja, contenu: C, quarts: 1 }).etat.morts ?? undefined, undefined);
  // Le repos lève le deuil.
  const repos = L.donnerRepos(r.etat, "a", { jour: 2 });
  assert.equal(repos.ok, true);
  assert.equal(L.deuil(repos.etat), false);
  assert.equal(L.donnerRepos(repos.etat, "a").ok, false, "déjà au repos");
  // Un Livide relevé : à retrouver d'abord.
  const livide = L.inscrireMorts({ ...d.etat }, [{ id: "a", nom: "Ana", system: L.survivantNeuf({ vivant: false, livide: true }) }]).etat;
  assert.equal(livide.morts[0].retrouve, false);
  assert.equal(L.donnerRepos(livide, "a").motif.cle, "mort-pas-retrouve");
  const retrouve = L.retrouverMort(livide, "a").etat;
  assert.equal(L.donnerRepos(retrouve, "a").ok, true);
});

test("Toussaint : le repos pour tous les morts retrouvés ; les autres restent", () => {
  const d = depart();
  let e = L.ajouterMort(d.etat, { id: "x", nom: "Gilberte", retrouve: true });
  e = L.ajouterMort(e, { id: "y", nom: "Ti Paul", retrouve: false });
  const r = L.feter(e, d.abri, { fete: "halloween", annee: 2027, survivants: d.survivants, effet: L.effetDeFete(fete("halloween")).effet, jour: 300 });
  assert.deepEqual(r.reposes, ["Gilberte"]);
  assert.deepEqual(r.restent, ["Ti Paul"]);
  assert.equal(L.deuil(r.etat), true, "Ti Paul n'a pas été retrouvé");
});

test("l'autel des morts : il faut un autel et un nom ; une fois par semaine ; il soutient le groupe sept jours", () => {
  const d = depart();
  assert.equal(L.honorerAutel(d.etat, { jour: 1, autel: false }).motif.cle, "autel-absent");
  assert.equal(L.honorerAutel(d.etat, { jour: 1, autel: true }).motif.cle, "autel-vide");
  const e = L.ajouterMort(d.etat, { nom: "Gilberte" });
  const r = L.honorerAutel(e, { jour: 10, autel: true });
  assert.equal(r.ok, true);
  assert.equal(L.espritDuJour(r.etat, "a", 16), 1 - 1, "soutien +1, deuil −1");
  assert.equal(L.honorerAutel(r.etat, { jour: 14, autel: true }).motif.cle, "autel-trop-tot");
  assert.equal(L.honorerAutel(r.etat, { jour: 17, autel: true }).ok, true);
});

// ------------------------------------------------------------------ la relève, les jeunes
test("relève : les membres vivants de 16 ans au moins qui ne sont pas des joueurs, et les PNJ légers ; le repris lâche sa tâche", () => {
  const d = depart();
  const etat = { ...d.etat, groupe: { ...d.etat.groupe, membres: ["mort", "j2", "c", "jeune", "enfant", "loin"], statuts: { j2: "joueur", c: "compagnon" },
    pnj: [{ id: "p1", nom: "Mémé Lucette", passe: "eleveuse", etat: "", travail: true }, { id: "p2", nom: "Gaby", etat: "mort" }] } };
  const membres = [
    { id: "mort", nom: "Ana", system: L.survivantNeuf({ vivant: false, statut: "joueur", age: 30 }) },
    { id: "j2", nom: "Bao", system: L.survivantNeuf({ statut: "joueur", age: 30 }) },
    { id: "c", nom: "Céline", system: L.survivantNeuf({ statut: "compagnon", age: 40, tache: "cultures" }) },
    { id: "jeune", nom: "Dylan", system: L.survivantNeuf({ statut: "pnj", age: 16 }) },
    { id: "enfant", nom: "Ti Zan", system: L.survivantNeuf({ statut: "pnj", age: 15 }) }
  ];
  const c = L.candidatsReleve({ etat, membres, mortId: "mort", jour: 0 });
  assert.deepEqual(c.map(x => x.id), ["c", "jeune", "p1"]);
  assert.equal(c.find(x => x.id === "jeune").jeune, true);
  // L'enfant de 15 ans devient candidat un an plus tard (l'âge avance avec les jours de jeu).
  assert.ok(L.candidatsReleve({ etat, membres, mortId: "mort", jour: 365 }).some(x => x.id === "enfant"));
  const r = L.reprendre(etat, { mortId: "mort", candidat: c[0], tache: "cultures", quart: 40 });
  assert.equal(r.ok, true);
  assert.equal(r.tacheLaissee, "cultures");
  assert.equal(r.etat.groupe.statuts.c, "joueur");
  assert.equal(r.etat.releves.at(-1).repris, "c");
  // Un PNJ léger : il a besoin de sa fiche, puis quitte la liste des PNJ pour les membres.
  assert.equal(L.reprendre(etat, { candidat: c[2] }).motif.cle, "releve-sans-fiche");
  const p = L.reprendre(etat, { mortId: "mort", candidat: c[2], acteurId: "neuf" });
  assert.ok(p.etat.groupe.membres.includes("neuf"));
  assert.ok(!p.etat.groupe.pnj.some(x => x.id === "p1"));
  assert.equal(p.tacheLaissee, "travail");
});

test("jeunes de 16 à 18 ans : portent 2/3, travaillent aux 3/4, votent à moitié, pas chefs ; à 18 ans, comme les autres", () => {
  const jeune = { age: 16 }, adulte = { age: 30 };
  assert.equal(L.estJeune(jeune), true);
  assert.equal(L.estJeune(jeune, 730), false, "deux ans plus tard");
  assert.equal(L.estJeune({ age: 17, ageJour: 400 }, 700), true, "l'âge noté au jour 400");
  assert.equal(L.peutEtreChef(jeune), false);
  assert.equal(L.peutEtreChef(adulte), true);
  assert.equal(L.poidsVote(jeune), 0.5);
  assert.equal(L.brasDe([jeune, adulte]), 1.75);
  assert.equal(L.porteursDe([jeune, adulte]), 1 + 2 / 3);
  assert.equal(L.chargeMax({ membres: L.porteursDe([jeune, jeune, jeune]) }), 6);
  // Une installation à bras : un jeune y travaille aux 3/4.
  const t = L.travailleursParTache([{ id: "j", system: { ...L.survivantNeuf({ age: 16, tache: "cultures", competences: { survie: { niveau: 1 } } }) } }], C, 0);
  assert.equal(t.cultures[0].poids, 0.75);
  assert.equal(L.facteurBras({ nombre: 1, niveau: 1 }, t.cultures), 0.75);
  const ta = L.travailleursParTache([{ id: "a", system: L.survivantNeuf({ age: 30, tache: "cultures", competences: { survie: { niveau: 1 } } }) }], C, 0);
  assert.equal(ta.cultures[0].poids, undefined, "un adulte : rien ne change");
  assert.equal(L.facteurBras({ nombre: 1, niveau: 1 }, ta.cultures), 1);
});
