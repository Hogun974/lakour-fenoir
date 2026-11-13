// L'esprit sur le corps (complément du jeu 3D, famille 2 ; logique/esprit.mjs, contrat §14) : tirage du regard, de la religion ou de
// l'ancrage, du sens moral et de l'autorité ; la foi qui agit par le moral (jamais de magie) ; ce qui nourrit chaque regard ; les
// observances ; le réconfort ; la communauté ; les faux bruits de la nuit ; celui qui lâche ; la chance du trahi ; le signe du
// cyclone. Et une fiche d'avant ce lot (esprit non tiré) qui ne change pas.   Lancer : npm run essais
import { test } from "node:test";
import assert from "node:assert/strict";
import { L, contenuMini, partie } from "./doublures/survie-outils.mjs";
import { chargerContenu } from "./outils/simuler-parties.mjs";

const C = chargerContenu();
const idx = L.indexer(C);
const RELIGIONS = [...idx.religions.keys()];
// Un survivant dont l'esprit est tiré, sans hasard : catholique pratiquant, regard « vivre ».
const esprit = (extra = {}) => L.survivantNeuf({ statut: "compagnon", regard: "vivre", religion: "catholique", religions: [], pratique: true, ancrage: "",
  sensMoral: 0, autorite: 2, reputation: 0, esprit: {}, moral: 3, ...extra });

test("tirerEsprit : 2000 tirages — regards, religions du contenu, « plusieurs » à deux religions, ancrage du non-croyant, bornes de départ", () => {
  const vus = { regard: new Set(), religion: new Set(), ancrage: new Set() };
  for (let i = 0; i < 2000; i++) {
    const s = L.genererSurvivant(C, L.creerHasard(`e${i}`), { statut: "joueur" });
    assert.ok(L.REGARDS.includes(s.regard), s.regard);
    assert.ok(RELIGIONS.includes(s.religion), s.religion);
    if (s.religion === "plusieurs") {
      assert.ok(s.religions.length >= 2 && new Set(s.religions).size === s.religions.length, "deux religions distinctes");
      for (const r of s.religions) assert.ok(idx.religions.has(r) && !idx.religions.get(r).special, r);
    } else assert.deepEqual(s.religions, []);
    if (s.ancrage) assert.equal(s.religion, "aucune", "seul le non-croyant tire un ancrage");
    assert.ok(Math.abs(s.sensMoral) <= L.SENS_DEPART_MAX && Number.isInteger(s.sensMoral));
    assert.ok(s.autorite >= 0 && s.autorite <= L.AUTORITE_DEPART_MAX);
    assert.equal(s.reputation, 0);
    assert.ok(L.espritActif(s));
    vus.regard.add(s.regard); vus.religion.add(s.religion); if (s.ancrage) vus.ancrage.add(s.ancrage);
  }
  assert.equal(vus.regard.size, 3);
  assert.equal(vus.religion.size, RELIGIONS.length, "chaque religion sort, « aucune » et « plusieurs » compris");
  assert.equal(vus.ancrage.size, idx.ancrages.size, "chaque ancrage sort");
});

test("tirerEsprit : les tirages d'avant ce lot ne changent pas (flux à part) ; verrous ; l'enfance penche sans décider ; le croyant croit", () => {
  for (let i = 0; i < 50; i++) {
    const a = L.genererSurvivant(C, L.creerHasard(`f${i}`), {});
    const b = L.genererSurvivant(C, L.creerHasard(`f${i}`), { hasardEsprit: L.creerHasard(`autre${i}`) });
    const sans = s => Object.fromEntries(Object.entries(s).filter(([k]) => !["regard", "religion", "religions", "pratique", "ancrage", "sensMoral", "autorite", "reputation", "esprit"].includes(k)));
    assert.deepEqual(sans(a), sans(b), "l'esprit est tiré sur son propre flux");
  }
  const v = L.genererSurvivant(C, L.creerHasard("v"), { verrous: { regard: "epreuve", religion: "plusieurs", religions: ["islam", "catholique"], pratique: true } });
  assert.equal(v.regard, "epreuve");
  assert.deepEqual(v.religions, ["islam", "catholique"]);
  assert.equal(v.pratique, true);
  const a = L.genererSurvivant(C, L.creerHasard("a"), { verrous: { religion: "aucune", ancrage: "carnet" } });
  assert.equal(a.ancrage, "carnet");
  // L'enfance tamoule rend l'hindouisme plus probable ; il reste des tamouls catholiques ou sans religion.
  let hindous = 0, autres = 0, base = 0;
  for (let i = 0; i < 600; i++) {
    const t = L.tirerEsprit(C, L.creerHasard(`t${i}`), { enfance: "enfance-tamoule-de-saint-andre" });
    if (t.religion === "hindouisme-tamoul" || t.religions.includes("hindouisme-tamoul")) hindous++; else autres++;
    const z = L.tirerEsprit(C, L.creerHasard(`t${i}`), { enfance: "enfance-zoreil" });
    if (z.religion === "hindouisme-tamoul" || z.religions.includes("hindouisme-tamoul")) base++;
  }
  assert.ok(hindous > 3 * base && autres > 30, `tamoule : ${hindous} hindous, ${autres} autres ; zoreil : ${base}`);
  // « Âme de pèlerin » : jamais « aucune ».
  for (let i = 0; i < 300; i++) assert.notEqual(L.tirerEsprit(C, L.creerHasard(`p${i}`), { traits: ["ame-de-pelerin"] }).religion, "aucune");
  // Sans religions dans le contenu (contenu d'essai) : « aucune », et pas d'erreur.
  const m = L.genererSurvivant(contenuMini(), L.creerHasard("m"), {});
  assert.equal(m.religion, "aucune");
  assert.ok(L.REGARDS.includes(m.regard));
});

test("la foi agit par le moral : plafond du pratiquant (+1, −1 en faute), de l'entente (±1 quand on n'est pas seul) ; rien sans esprit tiré", () => {
  assert.equal(L.plafondEsprit(esprit(), C), 1, "pratiquant");
  assert.equal(L.plafondEsprit(esprit({ pratique: false }), C), 0, "non-pratiquant : rien chaque jour");
  assert.equal(L.plafondEsprit(esprit({ esprit: { enFaute: true } }), C), -1, "en faute");
  assert.equal(L.plafondEsprit(esprit({ religion: "aucune", ancrage: "photo" }), C), 1, "l'ancrage d'un pratiquant fait le même effet");
  assert.equal(L.plafondEsprit(esprit({ religion: "aucune" }), C), 0, "ni foi ni ancrage");
  assert.equal(L.plafondEsprit(esprit(), C, { entente: 2, presents: 2 }), 2);
  assert.equal(L.plafondEsprit(esprit(), C, { entente: -2, presents: 2 }), 0);
  assert.equal(L.plafondEsprit(esprit(), C, { entente: 3, presents: 0 }), 1, "seul : la communauté ne compte pas");
  assert.equal(L.plafondEsprit(L.survivantNeuf({ religion: "catholique", pratique: true }), C, { entente: 3, presents: 3 }), 0, "esprit non tiré : aucun effet");
  assert.equal(L.plafondEsprit(esprit({ pratique: false, esprit: { joursSansNourriture: 7 } }), C), -1, "une semaine sans ce qui nourrit son regard : il s'éteint");
  assert.equal(L.plafondEsprit(esprit({ pratique: false, esprit: { joursSansNourriture: 6 } }), C), 0);
  // Dans effetJour : le plafond monte (moral 4 -> 5 au lieu de rester à 4) ou descend (5 -> 4).
  assert.equal(L.effetJour(L.survivantNeuf({ moral: 4 }), { mange: true, plafondEsprit: 1, confort: 1 }).system.moral, 5);
  assert.equal(L.effetJour(L.survivantNeuf({ moral: 4 }), { mange: true, plafondEsprit: 0, confort: 1 }).system.moral, 4);
  assert.equal(L.effetJour(L.survivantNeuf({ moral: 5 }), { mange: true, plafondEsprit: -1, confort: 1 }).system.moral, 4);
});

test("observances : à l'abri elles tiennent ; trois jours sur la route sans coreligionnaire, en faute (−1 une fois) ; un objet perdu aussi", () => {
  let s = esprit({ moral: 4 });
  const route = { aLAbri: false, nourritures: {}, plafond: 5 };
  for (let j = 1; j <= 2; j++) s = L.journeeEsprit(s, C, { ...route, jour: j }).system;
  assert.equal(L.espritDe(s).joursSansObservance, 2);
  let r = L.journeeEsprit(s, C, { ...route, jour: 3 });
  assert.ok(r.evenements.some(e => e.cle === "observance-manquee"));
  assert.equal(r.system.moral, 3, "−1 une fois");
  assert.equal(L.espritDe(r.system).enFaute, true);
  r = L.journeeEsprit(r.system, C, { ...route, jour: 4 });
  assert.equal(r.system.moral, 3, "pas deux fois");
  r = L.journeeEsprit(r.system, C, { ...route, jour: 5, aLAbri: true });
  assert.ok(r.evenements.some(e => e.cle === "observance-reprise"));
  assert.equal(L.espritDe(r.system).enFaute, false);
  // Un coreligionnaire pratiquant à côté : on prie ensemble sur la route.
  let c = esprit();
  for (let j = 1; j <= 5; j++) c = L.journeeEsprit(c, C, { ...route, jour: j, coreligionnaire: true }).system;
  assert.equal(L.espritDe(c).enFaute, false);
  // La Bible de l'évangélique (besoin « objet ») tient sur la route, tant qu'elle n'est pas perdue.
  let ev = esprit({ religion: "evangelique" });
  for (let j = 1; j <= 5; j++) ev = L.journeeEsprit(ev, C, { ...route, jour: j }).system;
  assert.equal(L.espritDe(ev).enFaute, false);
  ev = { ...ev, esprit: { ...ev.esprit, ancragePerdu: true } };
  for (let j = 6; j <= 8; j++) ev = L.journeeEsprit(ev, C, { ...route, jour: j }).system;
  assert.equal(L.espritDe(ev).enFaute, true);
  // Le non-pratiquant ne risque rien.
  let np = esprit({ pratique: false, moral: 4 });
  for (let j = 1; j <= 10; j++) np = L.journeeEsprit(np, C, { ...route, jour: j }).system;
  assert.equal(L.espritDe(np).enFaute, false);
  assert.equal(np.moral, 4);
});

test("réconfort du non-pratiquant : une fois par semaine, quand le moral tombe à 1, il se raccroche (+1)", () => {
  let s = esprit({ pratique: false, moral: 1 });
  const r1 = L.journeeEsprit(s, C, { jour: 10, aLAbri: true, nourritures: {}, plafond: 4 });
  assert.equal(r1.system.moral, 2);
  assert.ok(r1.evenements.some(e => e.cle === "reconfort"));
  s = { ...r1.system, moral: 1 };
  assert.equal(L.journeeEsprit(s, C, { jour: 14, aLAbri: true, nourritures: {}, plafond: 4 }).system.moral, 1, "pas avant sept jours");
  assert.equal(L.journeeEsprit(s, C, { jour: 17, aLAbri: true, nourritures: {}, plafond: 4 }).system.moral, 2);
  assert.equal(L.journeeEsprit(esprit({ religion: "aucune", moral: 1, pratique: false }), C, { jour: 1, nourritures: {}, plafond: 4 }).system.moral, 1, "sans foi ni ancrage, rien");
});

test("le regard : ce qui le nourrit (endurer, bâtir et accueillir, petits plaisirs) ; il change après deux semaines sans", () => {
  assert.deepEqual(L.nourrituresDuJour({ mange: false }), { endure: true, batit: false, plaisir: false });
  assert.deepEqual(L.nourrituresDuJour({ mange: true, aLAbri: true, tache: "chantier" }), { endure: false, batit: true, plaisir: false });
  assert.equal(L.nourrituresDuJour({ mange: true, accueil: true }).batit, true, "accueillir nourrit qui veut refaire le monde");
  assert.equal(L.nourrituresDuJour({ mange: true, aLAbri: true, tache: "repos" }).plaisir, true);
  assert.equal(L.nourrituresDuJour({ mange: true, fete: true }).plaisir, true);
  // Tous les deux jours nourris : +1, sans dépasser le plafond ni sauver quelqu'un déjà au fond (moral ≥ 2 requis).
  let s = esprit({ regard: "epreuve", pratique: false, moral: 2 });
  s = L.journeeEsprit(s, C, { jour: 1, nourritures: { endure: true }, plafond: 4, presents: 3 }).system;
  assert.equal(s.moral, 2);
  s = L.journeeEsprit(s, C, { jour: 2, nourritures: { endure: true }, plafond: 4, presents: 3 }).system;
  assert.equal(s.moral, 3);
  const plein = L.journeeEsprit({ ...s, esprit: { ...s.esprit, nourriSuite: 1 }, moral: 4 }, C, { jour: 3, nourritures: { endure: true }, plafond: 4, presents: 3 }).system;
  assert.equal(plein.moral, 4, "plafond");
  const fond = L.journeeEsprit({ ...s, religion: "aucune", esprit: { ...s.esprit, nourriSuite: 1 }, moral: 1 }, C, { jour: 3, nourritures: { endure: true }, plafond: 4, presents: 3 }).system;
  assert.equal(fond.moral, 1, "au fond, seul le groupe retient");
  // Deux semaines de petits plaisirs pour un « épreuve » au moral bas : il voit les choses autrement.
  let v = esprit({ regard: "epreuve", pratique: false, moral: 2 });
  let change = null;
  for (let j = 1; j <= 14 && !change; j++) {
    const r = L.journeeEsprit(v, C, { jour: j, nourritures: { plaisir: true }, plafond: 4, presents: 3 });
    v = { ...r.system, moral: 2 };
    change = r.evenements.find(e => e.cle === "regard-change");
  }
  assert.ok(change, "le regard change");
  assert.equal(v.regard, "vivre");
});

test("celui qui lâche : signes à 2, 4, 6 jours au fond ; retenu par la présence ; un compagnon part à 8, un joueur jamais", () => {
  const fond = (s, presents, entente = 0, jours = 1, depuis = 1) => {
    const evts = [];
    for (let j = depuis; j < depuis + jours; j++) { const r = L.journeeEsprit({ ...s, moral: 1 }, C, { jour: j, presents, entente, nourritures: {}, plafond: 3 }); s = r.system; evts.push(...r.evenements.map(e => e.cle)); }
    return { s, evts };
  };
  let { s, evts } = fond(esprit({ religion: "aucune", pratique: false }), 0, 0, 6);
  assert.deepEqual(evts.filter(e => e.startsWith("signe-")), ["signe-1", "signe-2", "signe-3"]);
  assert.equal(L.sansAppetit(s), true, "il mange moins : le repas ne lui rend plus de moral");
  assert.equal(L.effetJour({ ...s, moral: 2 }, { mange: true, sansAppetit: true }).system.moral, 2);
  assert.equal(L.malusEsprit(s, "parole"), 1, "il parle moins");
  assert.equal(L.malusEsprit(s, "tir"), 0);
  const retenu = fond(s, 2, 0, 5, 7);
  assert.equal(L.espritDe(retenu.s).joursBas, 6, "deux autres là, entente correcte : il ne s'enfonce plus");
  assert.ok(retenu.evts.includes("retenu"));
  assert.equal(L.espritDe(fond(s, 2, -1, 3, 7).s).joursBas, 9, "une entente mauvaise ne retient pas");
  const part = fond(s, 1, 0, 2, 7);
  assert.ok(part.evts.includes("lache"), "un matin, il n'est plus là");
  const joueur = fond({ ...s, statut: "joueur" }, 0, 0, 2, 7);
  assert.ok(joueur.evts.includes("au-bord") && !joueur.evts.includes("lache"), "un joueur ne part jamais tout seul");
  // Le moral remonte : les jours au fond s'effacent, les signes aussi.
  const remonte = L.journeeEsprit({ ...s, moral: 3 }, C, { jour: 20, presents: 3, nourritures: {}, plafond: 4 }).system;
  assert.equal(L.espritDe(remonte).joursBas, 4);
  assert.equal(L.espritDe(remonte).lacher, 2);
});

test("faux bruits : plus le moral est bas, plus il y en a ; la présence des autres les fait taire ; rien sans esprit tiré", () => {
  assert.equal(L.probaFauxBruit(esprit({ moral: 0 }), 0), 0.5);
  assert.ok(Math.abs(L.probaFauxBruit(esprit({ moral: 1 }), 1) - 0.25) < 1e-9);
  assert.ok(Math.abs(L.probaFauxBruit(esprit({ moral: 2 }), 1) - 0.1) < 1e-9);
  assert.equal(L.probaFauxBruit(esprit({ moral: 2 }), 3), 0);
  assert.equal(L.probaFauxBruit(esprit({ moral: 3 }), 0), 0);
  assert.equal(L.probaFauxBruit(L.survivantNeuf({ moral: 0 }), 0), 0);
});

test("la chance du trahi : un dé de plus au prochain test, consommé ; au plus 3 ; le signe du cyclone se lit selon la foi", () => {
  let s = L.donnerChance(esprit());
  assert.equal(L.espritDe(s).chance, 1);
  const u = L.utiliserChance(s);
  assert.equal(u.bonus, 1);
  assert.equal(L.espritDe(u.system).chance, 0);
  assert.equal(L.utiliserChance(u.system).bonus, 0);
  for (let i = 0; i < 6; i++) s = L.donnerChance(s);
  assert.equal(L.espritDe(s).chance, 3);
  assert.deepEqual([L.lireUnSigne(esprit({ moral: 3 })).lecture, L.lireUnSigne(esprit({ moral: 3 })).system.moral], ["signe", 4]);
  assert.equal(L.lireUnSigne(esprit({ pratique: false })).lecture, "doute");
  assert.equal(L.lireUnSigne(esprit({ religion: "aucune", ancrage: "photo" })).lecture, "rien");
});

test("avancer : une fiche d'avant (esprit non tiré) ne voit aucun effet de l'esprit ; un groupe tiré a ses faux bruits, son réconfort", () => {
  const avant = partie({ site: "port-immeuble", jours: 40, graine: "esprit-avant" });
  const cles = new Set(avant.historique.flatMap(h => h.etat.journal.map(e => e.cle ?? "")));
  assert.ok(![...cles].some(c => /^esprit-|^porte-|^autorite-|^desertion/.test(c)), [...cles].join(","));
  assert.ok(!(avant.etat.porte ?? []).length, "personne ne frappe chez un groupe sans esprit");
  // Le même groupe, esprit tiré, moral bas, la nuit : des faux bruits au journal.
  const tires = ["a", "b", "c", "d"].map(id => ({ id, system: esprit({ moral: 0, religion: "aucune", pratique: false }) }));
  const C2 = contenuMini();
  let { monde, etat } = L.demarrerPartie({ contenu: C2, graine: "esprit-nuit", region: "port-gris", membres: tires.map(t => t.id) });
  const ins = L.installerAbri(monde, C2, { site: "port-immeuble", jour: 0 });
  const r = L.avancer({ etat, monde: ins.monde, contenu: C2, quarts: 40, survivants: tires, abri: { id: "abri", system: ins.abri, installations: ins.installations } });
  assert.ok(r.etat.journal.some(e => e.cle === "esprit-faux-bruit"), "faux bruits");
});

test("fêter : le pratiquant d'une religion dont c'est la fête gagne 1 moral de plus ; la fête rapproche (entente +1) et marque le jour", () => {
  const etat = { ...L.etatVide(), demarree: true, horloge: { quart: 40 }, groupe: { ...L.etatVide().groupe, pnj: [] } };
  const survivants = [{ id: "a", system: esprit({ moral: 2 }) }, { id: "b", system: esprit({ moral: 2, religion: "islam" }) }, { id: "c", system: esprit({ moral: 2, pratique: false }) }];
  const r = L.feter(etat, { system: { stocks: { nourriture: 10 } } }, { fete: "noel", annee: 2026, survivants, contenu: C });
  assert.deepEqual(r.survivants.map(s => s.system.moral), [4, 3, 3]);
  assert.equal(r.etat.groupe.entente, 1);
  assert.equal(r.etat.groupe.feteLe, 10);
  // Sans contenu (simulateur, anciens appels) : la règle d'avant.
  assert.deepEqual(L.feter(etat, { system: { stocks: { nourriture: 10 } } }, { fete: "noel", annee: 2026, survivants }).survivants.map(s => s.system.moral), [3, 3, 3]);
});
