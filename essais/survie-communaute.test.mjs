// Lot 10 (contrat §22) : le marché chiffré, la porte, la religion et la table de gestion, dans la logique pure. La liste commune des
// religions et ses alias ; changer de religion (par le moral et les observances seulement) ; les deux défauts de la fusion de la
// vague 1 (le témoin n'est jamais l'auteur ; pas d'homonyme au tirage d'un groupe) ; la marge du commerçant, la valeur d'un objet ou
// d'un plan, l'étal ; la suite d'un refus et l'attitude d'un inconnu ; les rangs et la succession ; les priorités, les quotas, les
// corvées.   Lancer : npm run essais
import { test } from "node:test";
import assert from "node:assert/strict";
import { L } from "./doublures/survie-outils.mjs";
import { chargerContenu } from "./outils/simuler-parties.mjs";

const C = chargerContenu();
const esprit = (extra = {}) => L.survivantNeuf({ statut: "compagnon", regard: "vivre", religion: "catholique", religions: [], pratique: true, ancrage: "",
  sensMoral: 0, autorite: 2, reputation: 0, esprit: {}, moral: 3, ...extra });

// ------------------------------------------------------------------ la liste commune des religions
test("religions : la liste commune aux deux jeux, ses poids sur 100, les anciennes clés en alias, la religion double", () => {
  const tirees = L.liste(C.religions).filter(r => r.poids > 0);
  assert.deepEqual(Object.fromEntries(tirees.map(r => [r.cle, r.poids])),
    { catholique: 45, hindoue: 16, "hindoue-catholique": 10, musulmane: 7, protestante: 4, bouddhiste: 3, "servis-kabare": 1, aucune: 14 });
  assert.equal(tirees.reduce((s, r) => s + r.poids, 0), 100);
  assert.equal(L.indexer(C).religions.get("plusieurs").poids, 0, "« plusieurs » se choisit, ne se tire plus");
  for (const [ancienne, nouvelle] of [["hindouisme-tamoul", "hindoue"], ["islam", "musulmane"], ["evangelique", "protestante"], ["culte-chinois", "bouddhiste"], ["ancetres-malgaches", "servis-kabare"]]) {
    assert.equal(L.cleReligion(ancienne, C), nouvelle, ancienne);
    assert.equal(L.indexer(C).religions.get(ancienne).cle, nouvelle);
  }
  for (const k of ["catholique", "aucune", "plusieurs", "inconnue", ""]) assert.equal(L.cleReligion(k, C), k);
  // Une religion double compte ses deux religions ; une ancienne clé se lit sous la nouvelle.
  assert.deepEqual(L.religionsDe({ religion: "hindoue-catholique" }, C), ["hindoue-catholique", "catholique", "hindoue"]);
  assert.deepEqual(L.religionsDe({ religion: "plusieurs", religions: ["catholique", "ancetres-malgaches"] }, C), ["catholique", "servis-kabare"]);
  assert.deepEqual(L.religionsDe({ religion: "islam" }, C), ["musulmane"]);
  assert.ok(L.coreligionnaires({ religion: "hindoue-catholique" }, { religion: "hindouisme-tamoul" }, C), "on prie ensemble");
  // Les fêtes restent rattachées, Pongal compris.
  const fetes = k => L.indexer(C).religions.get(k).fetes;
  for (const k of ["hindoue", "hindoue-catholique"]) for (const f of ["dipavali", "cavadee", "nouvel-an-tamoul", "marche-sur-le-feu", "pongal"]) assert.ok(fetes(k).includes(f), `${k} : ${f}`);
  assert.deepEqual(fetes("islam"), ["ramadan", "aid-el-kebir"]);
  assert.ok(fetes("bouddhiste").includes("nouvel-an-chinois") && fetes("servis-kabare").includes("liberte") && fetes("protestante").includes("noel"));
});

test("religions : une fiche d'avant (ancienne clé) marche comme avant : observance, plafond, fête, phrases d'histoire", () => {
  const ancienne = esprit({ religion: "evangelique" }), nouvelle = esprit({ religion: "protestante" });
  assert.deepEqual(L.soutienDe(ancienne, C), { ...L.soutienDe(nouvelle, C), cles: ["protestante"] });
  assert.equal(L.soutienDe(ancienne, C).besoin, "objet", "la Bible");
  assert.equal(L.plafondEsprit(ancienne, C), L.plafondEsprit(nouvelle, C));
  // La fête de sa religion, pour un pratiquant à l'ancienne clé : +1 de plus.
  const s = [{ id: "a", system: esprit({ religion: "hindouisme-tamoul", moral: 2 }) }, { id: "b", system: esprit({ religion: "catholique", moral: 2 }) }];
  const abri = { system: { stocks: { nourriture: 20, eau: 20 } }, installations: [] };
  const f = L.feter({ groupe: {} }, abri, { fete: "pongal", annee: 2027, survivants: s, contenu: C, effet: { moral: 1 } });
  const moral = id => f.survivants.find(x => x.id === id).system.moral;
  assert.equal(moral("a") - moral("b"), 1, "le pratiquant hindou gagne 1 de plus à Pongal");
  // Les phrases d'histoire : la même fiche sous l'ancienne et la nouvelle clé tire la même histoire.
  const fiche = { nom: "Rachida Omarjee", age: 34, genre: "f", enfance: "enfance-zarab-de-saint-pierre", passe: L.liste(C.passes)[0].cle, traits: [], pratique: true, regard: "vivre" };
  for (const [a, b] of [["islam", "musulmane"], ["evangelique", "protestante"], ["culte-chinois", "bouddhiste"], ["hindouisme-tamoul", "hindoue"]]) {
    assert.deepEqual(L.composerHistoire(C, { ...fiche, religion: a }), L.composerHistoire(C, { ...fiche, religion: b }), `${a} -> ${b}`);
  }
  // Une hindoue catholique trouve les phrases de ses deux religions (la Vierge et Mariamen, la médaille de saint Expédit…).
  const vues = new Set();
  for (let i = 0; i < 300; i++) {
    const h = L.composerHistoire(C, { ...fiche, enfance: "enfance-tamoule-de-saint-andre", religion: "hindoue-catholique", nom: `N${i}` });
    for (const k of h?.cles ?? []) if (k.startsWith("religion:")) vues.add(k.split("/")[0]);
  }
  assert.ok(["religion:catholique", "religion:hindouisme-tamoul", "religion:plusieurs"].every(k => vues.has(k)), [...vues].join(", "));
});

// ------------------------------------------------------------------ changer de religion
test("changer de religion : un mois où il tient des deux (prier ensemble, les fêtes, l'observance la plus exigeante, pas de plafond en plus), puis la nouvelle seule", () => {
  let s = esprit({ religion: "catholique", pratique: true });
  const r = L.changerDeReligion(s, { religion: "protestante", jour: 10 }, C);
  assert.ok(r.ok && !r.quitte && !r.souvent);
  s = r.system;
  assert.equal(s.religion, "protestante");
  assert.deepEqual(L.religionsDe(s, C, 20), ["protestante", "catholique"], "le bonus provisoire : les deux");
  assert.equal(L.soutienDe(s, C, 20).besoin, "calme", "le malus provisoire : l'observance la plus exigeante (le chapelet, pas seulement la Bible)");
  assert.equal(L.plafondEsprit(s, C, { jour: 20 }), 0, "sa foi ne le porte pas plus haut pendant la conversion");
  assert.equal(L.plafondEsprit(esprit({ religion: "protestante" }), C, { jour: 20 }), 1);
  // Le mois passé, l'ancienne ne compte plus.
  let fin = null;
  for (let j = 11; j <= 40; j++) {
    const x = L.journeeEsprit(s, C, { jour: j, aLAbri: true, nourritures: { plaisir: true }, plafond: 5 });
    s = x.system;
    if (x.evenements.some(e => e.cle === "conversion-faite")) fin = j;
  }
  assert.equal(fin, 40);
  assert.deepEqual(L.religionsDe(s, C), ["protestante"]);
  assert.equal(L.plafondEsprit(s, C, { jour: 41 }), 1);
  // En changer souvent, ou la quitter, se sait ; changer pour la même, rien ; « plusieurs » demande deux religions.
  const r2 = L.changerDeReligion(s, { religion: "catholique", jour: 100 }, C);
  assert.ok(r2.ok && r2.souvent, "deux changements en moins d'un an");
  const r3 = L.changerDeReligion(esprit(), { religion: "aucune", jour: 5 }, C);
  assert.ok(r3.ok && r3.quitte);
  assert.equal(L.changerDeReligion(esprit(), { religion: "catholique" }, C).ok, false);
  assert.equal(L.changerDeReligion(esprit(), { religion: "islam" }, C).system.religion, "musulmane", "une ancienne clé se garde sous la nouvelle");
  assert.equal(L.changerDeReligion(esprit(), { religion: "plusieurs", religions: ["hindoue"] }, C).ok, false);
  assert.equal(L.changerDeReligion(esprit(), { religion: "inconnue" }, C).ok, false);
  for (const cle of ["conversion-faite"]) assert.ok(L.CLES_TEXTES.includes(`esprit-${cle}`));
});

// ------------------------------------------------------------------ les deux défauts de la vague 1
test("défaut 1 : un témoin n'est jamais l'auteur de l'acte (un jeune de 17 ans qui colporte ne se voit pas colporter)", () => {
  const jeune = { id: "j", system: L.survivantNeuf({ age: 17 }) }, enfant = { id: "e", system: L.survivantNeuf({ age: 12 }) }, adulte = { id: "a", system: L.survivantNeuf({ age: 40 }) };
  assert.deepEqual(L.enfantsTemoins([jeune, enfant, adulte], ["j"]).map(m => m.id), ["e"]);
  assert.deepEqual(L.enfantsTemoins([jeune, enfant, adulte], []).map(m => m.id), ["j", "e"]);
  assert.deepEqual(L.enfantsTemoins([jeune, enfant], ["j", "e"]), []);
});

test("défaut 2 : pas d'homonyme au tirage d'un groupe ; sans homonyme, aucun tirage ne change", () => {
  for (let g = 0; g < 40; g++) {
    const noms = [];
    for (let i = 0; i < 12; i++) noms.push(L.genererSurvivant(C, L.creerHasard(`groupe-${g}-${i}`), { statut: "compagnon", nomsPris: noms }).nom);
    assert.equal(new Set(noms.map(L.cleDeNom)).size, noms.length, noms.join(", "));
  }
  // Un nom déjà pris est retiré une fois parmi les autres ; les tirages sans collision sont les mêmes qu'avant.
  for (let i = 0; i < 50; i++) {
    const a = L.genererSurvivant(C, L.creerHasard(`h${i}`), {});
    assert.deepEqual(L.genererSurvivant(C, L.creerHasard(`h${i}`), { nomsPris: ["Personne De Ce Nom"] }), a);
    const b = L.genererSurvivant(C, L.creerHasard(`h${i}`), { nomsPris: [a.nom.toUpperCase()] });
    assert.notEqual(L.cleDeNom(b.nom), L.cleDeNom(a.nom));
  }
  // Un nom gardé par verrou reste le sien.
  assert.equal(L.genererSurvivant(C, L.creerHasard("v"), { verrous: { nom: "Ginette Grondin" }, nomsPris: ["Ginette Grondin"] }).nom, "Ginette Grondin");
  assert.equal(L.cleDeNom("  Thérèse   DIJOUX "), "therese dijoux");
});

// ------------------------------------------------------------------ le marché chiffré
test("la marge du commerçant : 1,25 et 0,6 ; sa confiance suit la réputation et la parole, bornée ; le carnet prête selon elle", () => {
  assert.equal(L.confianceDuCommercant({ reputation: 0, parole: 1 }), 1);
  assert.equal(L.confianceDuCommercant({ reputation: 10, parole: 1 }), 1.15);
  assert.equal(L.confianceDuCommercant({ reputation: -10, parole: 1 }), 0.75);
  assert.equal(L.confianceDuCommercant({ reputation: 10, parole: 5 }), 1.15, "bornée à 1,15");
  assert.equal(L.confianceDuCommercant({ reputation: -10, parole: 4 }), 0.818, "la parole aide : 0,75 × 1,09");
  const bleu = L.prixDuCommercant({ reputation: 10, parole: 1 }), rouge = L.prixDuCommercant({ reputation: -10, parole: 1 });
  assert.deepEqual([bleu.vente, bleu.achat, rouge.vente, rouge.achat], [1.087, 0.69, 1.667, 0.45], "les chiffres du jeu 3D");
  assert.ok(bleu.vente * 1 > bleu.achat, "vendre puis racheter coûte toujours");
  const cours = L.coursDuJour();
  // 4 munitions (12 parts au cours) contre 6 nourritures (6 parts) : un inconnu donne 12 × 0,6 = 7 ; on lui demande 6 × 1,25 = 7,5.
  const ev = L.evaluerALaBoutique({ donne: { munitions: 4 }, recoit: { nourriture: 6 }, cours });
  assert.deepEqual([ev.offerte, ev.demandee, ev.accepte], [7, 7.5, false]);
  assert.equal(L.evaluerALaBoutique({ donne: { munitions: 4 }, recoit: { nourriture: 6 }, cours, reputation: 8, parole: 3 }).accepte, true, "réputation et parole");
  assert.equal(L.evaluerALaBoutique({ donne: { munitions: 4 }, recoit: { nourriture: 6 }, cours, reputation: 8, parole: 3, majoration: 0.5 }).accepte, false, "ses préjugés s'y ajoutent");
  assert.equal(L.plafondCredit(L.carnetVide(), "groupe", null, 1.15), 11.5);
  assert.equal(L.plafondCredit(L.carnetVide(), "groupe", null, 0.75), 7.5);
  assert.equal(L.plafondCredit(L.carnetVide(), "groupe"), 10, "sans facteur, comme avant");
  let restes = 0;
  for (let i = 0; i < 2000; i++) if (L.commercantReste(L.creerHasard(`b${i}`))) restes++;
  assert.ok(restes > 520 && restes < 680, `${restes} sur 2000`);
});

test("la valeur d'un objet (le barème, sinon sa recette au cours) et d'un plan (en parts)", () => {
  assert.deepEqual(L.valeurObjet("fusil-de-chasse", C), { valeur: 20, source: "bareme" });
  assert.deepEqual(L.valeurObjet("cabri", C), { valeur: 10, source: "bareme" });
  const r = L.liste(C.recettes).find(x => x.produit?.equipement === "bouclier-de-tole");
  assert.deepEqual(L.valeurObjet("bouclier-de-tole", C), { valeur: L.valeurBiens(r.cout, L.coursDuJour()), source: "recette" });
  assert.deepEqual(L.valeurObjet("objet-inconnu", C), { valeur: null, source: "" });
  assert.equal(L.valeurPlan({ rarete: 0 }), 3);
  assert.equal(L.valeurPlan({ rarete: 22.5 }), 7.5, "le four à pain du jeu 3D (≈ 15 au barème)");
  assert.equal(L.valeurPlan({ rarete: 95, unique: true }), 66, "le cahier unique (≈ 132)");
});

test("l'étal : il vend les jours de marché, même sans le groupe ; la caisse se relève ; sans gardien, on s'y sert", () => {
  const e = L.creerEtal({ id: "e1", marche: "quai", biens: { medicaments: 3, nourriture: 60, energie: 4 }, contre: "materiaux" });
  assert.deepEqual(e.biens, { medicaments: 3, nourriture: 60 }, "l'énergie ne se troque pas");
  const cours = L.coursDuJour();
  assert.equal(L.chanceVenteEtal(cours.medicaments, cours.medicaments), 0.5);
  assert.equal(L.chanceVenteEtal(cours.medicaments * 2, cours.medicaments), 0.125);
  let x = e, vendus = 0, vols = 0;
  for (let j = 0; j < 30; j++) {
    const r = L.journeeEtal(x, { cours, hasard: L.creerHasard(`etal${j}`) });
    vendus += Object.values(r.vendus).reduce((s, n) => s + n, 0);
    vols += Object.keys(r.vole).length;
    x = r.etal;
  }
  assert.ok(vendus > 4 && vols >= 1, `${vendus} vendus, ${vols} vols`);
  assert.ok(Object.values(x.biens).reduce((s, n) => s + n, 0) < 63);
  assert.ok(Number(x.caisse.materiaux) > 0, "payé en matériaux, au cours");
  const rel = L.releverEtal(x);
  assert.equal(rel.releve.materiaux, Math.floor(x.caisse.materiaux));
  assert.ok(rel.etal.caisse.materiaux < 1, "les fractions restent");
  // Avec un gardien, presque jamais de vol ; à moitié prix, ça part plus vite.
  const garde = L.creerEtal({ biens: { nourriture: 40 }, gardien: "Paul" });
  let v2 = 0;
  for (let j = 0; j < 100; j++) v2 += Object.keys(L.journeeEtal(garde, { cours, hasard: L.creerHasard(`g${j}`) }).vole).length;
  assert.ok(v2 <= 6, `${v2} vols avec gardien`);
  // journeeDuMarche : l'étal vend le jour de son marché (la date de départ : un samedi, jour 0).
  const mk = L.creerMarche({ cle: "quai", nom: "Le quai", jourSemaine: L.dateDuJour(7, "2026-12-05").semaine, jour: 0 });
  const etat = { ...L.marcheVide(), marches: [mk], etals: [L.creerEtal({ id: "e1", marche: "quai", biens: { nourriture: 20 } })] };
  const j = L.journeeDuMarche({ marche: etat, secret: L.secretMarcheVide(), jour: 7, dateDepart: "2026-12-05", cours, hasard: () => 0.01 });
  assert.equal(j.etals.length, 1);
  assert.ok(j.marche.etals[0].biens.nourriture < 20 && j.faits.some(f => f.cle === "etal-vend"));
  assert.deepEqual(L.journeeDuMarche({ marche: etat, secret: L.secretMarcheVide(), jour: 7, dateDepart: "2026-12-05" }).marche.etals, etat.etals, "sans hasard, l'étal attend");
});

// ------------------------------------------------------------------ la porte et l'inconnu
test("la porte : le refusé comprend 60 fois sur 100, la rancune et le retour penchent avec sa couleur ; l'attitude d'un inconnu", () => {
  assert.deepEqual(L.chancesDuRefus(0), { part: 0.6, feu: 0.2, revient: 0.2 });
  assert.deepEqual(L.chancesDuRefus(-10), { part: 0.6, feu: 0.4, revient: 0 });
  assert.deepEqual(L.chancesDuRefus(10), { part: 0.6, feu: 0, revient: 0.4 });
  const n = { amicale: 0, neutre: 0, mefiante: 0, hostile: 0 };
  for (let i = 0; i < 4000; i++) n[L.tirerAttitude(L.creerHasard(`att${i}`))]++;
  assert.ok(Math.abs(n.amicale / 40 - 25) < 3 && Math.abs(n.neutre / 40 - 45) < 3 && Math.abs(n.mefiante / 40 - 22) < 3 && Math.abs(n.hostile / 40 - 8) < 2, JSON.stringify(n));
  // La recrue porte son attitude, tirée à part : la recrue elle-même ne change pas.
  const r = L.genererRecrue(C, L.creerHasard("recrue"), {});
  assert.ok(Object.keys(L.ATTITUDES_RENCONTRE).includes(r.attitude));
  assert.deepEqual(L.genererRecrue(C, L.creerHasard("recrue"), {}), r);
  assert.equal(L.TENTATIVES_PAR_JOUR, 1);
});

// ------------------------------------------------------------------ les rangs
test("les rangs : chef, seconds, membres, nouveaux ; le second succède au chef ; la mort coûte le rang", () => {
  const sys = (extra = {}) => L.survivantNeuf({ age: 35, ...extra });
  let etat = { groupe: { membres: ["c", "s", "m", "n", "j"], chef: "c" } };
  etat = L.noterArrivee(etat, "n", 10);
  assert.deepEqual(["c", "s", "m", "n", "x"].map(id => L.rangDuMembre(etat, id, 12)), ["chef", "membre", "membre", "nouveau", ""]);
  assert.equal(L.rangDuMembre(etat, "n", 17), "membre", "une semaine plus tard");
  assert.equal(L.nommerSecond(etat, "n", { jour: 12 }).motif.cle, "rang-nouveau");
  assert.equal(L.nommerSecond(etat, "c", { jour: 12 }).motif.cle, "rang-deja-chef");
  assert.equal(L.nommerSecond(etat, "j", { jour: 12, membre: sys({ age: 16, ageJour: 12 }) }).motif.cle, "rang-jeune");
  etat = L.nommerSecond(etat, "s", { jour: 12, membre: sys() }).etat;
  etat = L.nommerSecond(etat, "m", { jour: 12, membre: sys() }).etat;
  assert.deepEqual(L.secondsDe(etat), ["s", "m"]);
  assert.equal(L.rangDuMembre(L.admettre(etat, "n"), "n", 12), "membre");
  // Le chef meurt : son premier second prend la tête ; un second mort perd son rang.
  const survivants = ["c", "s", "m", "n", "j"].map(id => ({ id, nom: id.toUpperCase(), system: sys({ vivant: id !== "c" }) }));
  const r = L.rangsDuJour(etat, survivants, { jour: 13 });
  assert.equal(r.etat.groupe.chef, "s");
  assert.deepEqual(L.secondsDe(r.etat), ["m"]);
  assert.ok(r.faits.some(f => f.cle === "chef-succede" && f.params.nom === "S" && f.params.ancien === "C"));
  // Sans second : plus de chef, le MJ le sait.
  const r2 = L.rangsDuJour({ groupe: { membres: ["c", "m"], chef: "c" } }, survivants, { jour: 13 });
  assert.equal(r2.etat.groupe.chef, "");
  assert.ok(r2.faits.some(f => f.cle === "chef-perdu"));
  // Rien ne bouge : l'état est rendu tel quel.
  const calme = { groupe: { membres: ["s", "m"], chef: "s" } };
  assert.equal(L.rangsDuJour(calme, survivants, { jour: 13 }).etat, calme);
  // Un renversement désigne d'abord un second.
  const membres = ["c", "s", "m"].map(id => ({ id, system: sys({ autorite: id === "m" ? 5 : id === "c" ? 0 : 1, statut: "joueur" }) }));
  assert.equal(L.crisesAutorite({ membres, chefId: "c", jour: 7, seconds: ["s"], hasard: () => 0.99 }).successeur, "s");
  assert.equal(L.crisesAutorite({ membres, chefId: "c", jour: 7, hasard: () => 0.99 }).successeur, "m", "sans second, le plus écouté (comme avant)");
  // L'accord de passage avec une communauté voisine.
  const p = L.accordDePassage({ communautes: [{ id: "c1", nom: "Ceux du bas" }] }, "c1", { ouvert: false, jour: 4 });
  assert.ok(p.ok && p.communaute.passage === false && p.motif.cle === "passage-ferme");
  assert.equal(L.accordDePassage({ communautes: [] }, "c9").ok, false);
});

// ------------------------------------------------------------------ la table de gestion
test("la table de gestion : la grille par défaut, la priorité puis le meilleur, ce qui a du travail ; un joueur garde sa tâche", () => {
  const s = (competences, extra = {}) => L.survivantNeuf({ statut: "compagnon", competences: Object.fromEntries(Object.entries(competences).map(([k, n]) => [k, { niveau: n, marques: 0 }])), ...extra });
  const g = L.grilleParDefaut(s({ survie: 2 }), "eau");
  assert.equal(g.eau, 1);
  assert.equal(g.garde, 3);
  assert.equal(g.repos, 0, "le repos n'a pas de compétence");
  const dispo = L.travailDisponible({ vivres: true });
  assert.deepEqual([dispo.soins, dispo.cuisine, dispo.chantier, dispo.garde, dispo.enseigner], [false, true, false, true, false]);
  // Priorité d'abord ; à égalité, là où il est le meilleur ; une tâche sans travail est sautée.
  const pierre = s({ soins: 3, vigilance: 1, survie: 2 });
  assert.equal(L.tacheParPriorite(pierre, { soins: 1, garde: 2 }, dispo), "garde", "pas de blessé : les soins attendent");
  assert.equal(L.tacheParPriorite(pierre, { soins: 1, garde: 2 }, L.travailDisponible({ blesses: true })), "soins");
  assert.equal(L.tacheParPriorite(pierre, { garde: 2, cuisine: 2 }, dispo), "cuisine", "à égalité, la survie (2) passe la vigilance (1)");
  assert.equal(L.tacheParPriorite(pierre, {}, dispo), "");
  // La répartition par priorités : une grille réglée l'emporte ; un joueur n'est jamais réglé par elle.
  const membres = [{ id: "p", system: pierre }, { id: "j", system: s({ survie: 4 }, { statut: "joueur", tache: "peche" }) }, { id: "k", system: s({ vigilance: 3 }) }];
  let etat = { groupe: { membres: ["p", "j", "k"] } };
  etat = L.reglerPriorites(etat, "p", { garde: 1, cuisine: 2, inconnue: 1, soins: 9 });
  assert.deepEqual([L.grilleDe(etat, "p").garde, L.grilleDe(etat, "p").soins, "inconnue" in L.grilleDe(etat, "p")], [1, 4, false]);
  const plan = L.repartirParPriorites(membres, etat, { contenu: C, situation: { vivres: true } });
  assert.equal(plan.p, "garde");
  assert.equal("j" in plan, false, "le joueur choisit sa tâche");
  assert.ok(L.TACHES_GRILLE.includes(plan.k));
  assert.equal(L.grilleDe(L.effacerPriorites(etat, "p"), "p"), null);
  // La situation de l'abri : un potager en service donne du travail aux cultures.
  const abri = { system: { stocks: { nourriture: 3, materiaux: 2 } }, installations: [{ cle: "potager", niveau: 1, etat: 0 }] };
  const sit = L.situationDeLAbri(membres, abri, C);
  assert.ok(sit.cultures && sit.vivres && sit.atelier && !sit.elevage && !sit.chantier);
});

test("les quotas : une demande suivie jour après jour, la semaine close fait son bilan, sans punition ; les corvées", () => {
  const sys = tache => L.survivantNeuf({ tache });
  let etat = { groupe: { membres: ["a", "b"] } };
  const q = L.poserQuota(etat, { acteurId: "a", tache: "garde", jours: 3, jour: 7 });
  assert.ok(q.ok);
  etat = q.etat;
  assert.equal(L.poserQuota(etat, { acteurId: "z", tache: "garde" }).ok, false);
  assert.equal(L.poserQuota(etat, { acteurId: "a", tache: "voler" }).motif.cle, "tache-inconnue");
  for (let j = 7; j <= 13; j++) etat = L.suivreQuotas(etat, [{ id: "a", system: sys(j < 9 ? "garde" : "eau") }, { id: "b", system: sys("garde") }], j).etat;
  assert.deepEqual(L.etatDuQuota(etat.groupe.quotas[0]), { fait: 2, jours: 3, reste: 1, tenu: false });
  const r = L.suivreQuotas(etat, [{ id: "a", system: sys("garde") }], 14);
  assert.deepEqual(r.bilans, [{ id: q.quota.id, acteurId: "a", tache: "garde", fait: 2, jours: 3, tenu: false }]);
  assert.equal(r.etat.groupe.quotas[0].fait, 1, "la nouvelle semaine repart de zéro");
  assert.equal(L.retirerQuota(r.etat, q.quota.id).groupe.quotas.length, 0);
  // Les corvées : vingt-six, chacune à l'une des treize tâches.
  assert.equal(L.corveesDe(C).length, 26);
  assert.deepEqual(L.verifierCorvees(C), []);
  assert.ok(L.corveesDe(C, "eau").map(c => c.cle).includes("nettoyer-les-filtres"));
  assert.deepEqual(L.donnerCorvee({ groupe: {} }, "a", "puiser-de-l-eau").groupe.corvees, { a: "puiser-de-l-eau" });
  assert.deepEqual(L.donnerCorvee({ groupe: { corvees: { a: "x" } } }, "a", "").groupe.corvees, {});
});

test("avancer : la mort coûte le rang (le second prend la tête), les quotas se suivent ; un groupe sans rangs ni quotas ne bouge pas", () => {
  const contenu = C;
  const site = L.liste(contenu.sites)[0];
  let { monde, etat } = L.demarrerPartie({ contenu, graine: "rangs-du-jour", region: site.region, membres: ["c", "s", "m"] });
  const ins = L.installerAbri(monde, contenu, { site: site.cle, jour: 0, apport: { nourriture: 30, eau: 30 } });
  monde = ins.monde;
  etat = { ...etat, groupe: { ...etat.groupe, chef: "c", seconds: ["s"], quotas: [{ id: "q1", acteurId: "m", tache: "garde", jours: 2, semaine: 0, fait: 0 }] } };
  const survivants = ["c", "s", "m"].map(id => ({ id, nom: id.toUpperCase(), system: L.survivantNeuf({ age: 40, vivant: id !== "c", tache: id === "m" ? "garde" : "repos" }) }));
  const r = L.avancer({ etat, monde, contenu, quarts: 4, survivants, abri: { id: "abri", system: ins.abri, installations: ins.installations } });
  assert.equal(r.etat.groupe.chef, "s");
  assert.deepEqual(r.etat.groupe.seconds, []);
  assert.equal(r.etat.groupe.quotas[0].fait, 1);
  assert.ok(r.etat.journal.some(e => e.cle === "chef-succede"));
});
