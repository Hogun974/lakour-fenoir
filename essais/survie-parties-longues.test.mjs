// Ce que les parties LONGUES ont révélé (essais/outils/parties-longues.mjs : un an de jeu, plusieurs graines, contrôles chaque
// jour), gardé ici pour que ça ne revienne pas :
// - une nouvelle de la radio rajeunissait tout le renseignement d'une région, y compris le pillage, les routes et les factions
//   vus de ses yeux des semaines plus tôt (« Le Port, par radio, il y a 2 j : pillage entamé ») : ils gardent leur date (vuDirect) ;
// - une réparation trop courte pour finir un point (1 personne, 1 ou 2 quarts sur une installation à 3 quarts-personne par point,
//   ou l'abri à 2 par point) ne servait à rien et se perdait : refaite chaque jour, elle ne finissait jamais. Le travail s'accumule ;
// - et, sur des parties d'un an avec le vrai contenu : aucune valeur impossible, aucun texte sans clé ou sans traduction, aucun
//   chantier fini resté ouvert, ni cyclone ou éruption bloqués.
// Lancer : npm run essais
import { test } from "node:test";
import assert from "node:assert/strict";
import { L, contenuMini, I } from "./doublures/survie-outils.mjs";
import { chargerContenu } from "./outils/simuler-parties.mjs";
import { jouerLongue } from "./outils/parties-longues.mjs";

const C = contenuMini();
const def = cle => L.installationDe(C, cle);

test("renseignements : la radio ne rajeunit pas le pillage, les routes et les factions vus sur place", () => {
  const m = L.creerMonde(C, "radio-date");
  let r = L.renseignementsInitiaux(C, { region: "port-gris", monde: m });
  assert.equal(r["port-gris"].vuDirect, 0);
  r = L.observer(r, m, C, "port-gris", 40, "radio");
  assert.equal(r["port-gris"].source, "radio");
  assert.equal(r["port-gris"].vu, 40, "l'infestation et les réseaux sont du jour 40");
  assert.equal(r["port-gris"].pillage, "intact", "le pillage vu au jour 0 est gardé…");
  assert.equal(r["port-gris"].vuDirect, 0, "… avec sa date");
  assert.equal(L.ageRenseignement(r["port-gris"], 42), 2);
  assert.equal(L.ageDirect(r["port-gris"], 42), 42, "le pillage a 42 jours, pas 2");
  r = L.observer(r, m, C, "port-gris", 50, "vu");
  assert.equal(r["port-gris"].vuDirect, 50);
  // Une région jamais vue de ses yeux : pas d'âge direct ; un ancien renseignement « vu » sans vuDirect est daté par son vu.
  const radio = L.observer(L.renseignementsInitiaux(C, {}), m, C, "hauts-verts", 5, "radio");
  assert.equal(L.ageDirect(radio["hauts-verts"], 9), null);
  assert.equal(L.ageDirect({ vu: 3, source: "vu", pillage: "entame" }, 10), 7);
  const ancien = L.observer({ "port-gris": { ...L.renseignementVide(), vu: 3, source: "vu", pillage: "entame", vuDirect: undefined } }, m, C, "port-gris", 9, "rumeur");
  assert.equal(ancien["port-gris"].vuDirect, 3);
  // Le MJ qui dit « vu » date aussi l'observation directe ; une rumeur ne la touche pas.
  assert.equal(L.renseigner(r, "port-gris", { source: "vu", pillage: "maigre" }, 60)["port-gris"].vuDirect, 60);
  assert.equal(L.renseigner(r, "port-gris", { infestation: "dense" }, 61)["port-gris"].vuDirect, 50);
});

test("réparations : le travail trop court pour finir un point s'accumule au lieu de se perdre", () => {
  // Palissade : 3 quarts-personne par point. Un survivant seul, un quart à la fois : un point tous les trois quarts.
  let inst = L.endommagerInstallation(I("palissade", 1), 2);
  const etats = [], materiaux = [];
  for (let k = 0; k < 6; k++) {
    const r = L.reparerInstallation(inst, def("palissade"), { quarts: 1, bras: 1, materiaux: 5 });
    inst = r.instance;
    etats.push(inst.etat);
    materiaux.push(r.cout.materiaux);
  }
  assert.deepEqual(etats, [2, 2, 1, 1, 1, 0]);
  assert.deepEqual(materiaux, [0, 0, 1, 0, 0, 1], "un matériau par point réparé, quand il l'est");
  assert.equal(inst.reparation, 0, "réparée : plus de travail en cours");
  // Sans matériau, le travail attend (au plus un point d'avance) ; le matériau arrivé, le point se finit.
  let sans = L.reparerInstallation(L.endommagerInstallation(I("palissade", 1), 1), def("palissade"), { quarts: 8, bras: 1, materiaux: 0 });
  assert.equal(sans.repares, 0);
  assert.equal(sans.instance.reparation, 3);
  sans = L.reparerInstallation(sans.instance, def("palissade"), { quarts: 0, bras: 1, materiaux: 1 });
  assert.equal(sans.instance.etat, 0);
  // Le chantier d'un nouveau niveau remet l'installation à neuf, réparation en cours comprise.
  const ch = L.avancerChantier({ ...L.endommagerInstallation(I("palissade", 1), 1), reparation: 2, chantier: { fait: 0, requis: 1 } }, def("palissade"), { quarts: 1, bras: 1 });
  assert.equal(ch.instance.etat, 0);
  assert.equal(ch.instance.reparation, 0);
  // L'abri : 2 quarts-personne par point de dégâts ; un quart à la fois, un point tous les deux quarts.
  let abri = { degats: 2, stocks: { materiaux: 5 } };
  const degats = [];
  for (let k = 0; k < 4; k++) { abri = L.reparerAbri(abri, { quarts: 1, bras: 1 }).abri; degats.push(abri.degats); }
  assert.deepEqual(degats, [2, 1, 1, 0]);
  assert.equal(abri.stocks.materiaux, 3);
  assert.equal(abri.reparation, 0);
});

// Deux installations du vrai contenu (lakour-fenoir) qui ne faisaient rien de ce qu'elles disent : les chiens de garde mangent
// 1 nourriture par jour, les ruches (niveau 2) donnent 0,1 médicament par jour.
const AVEC_BETES = (() => {
  const base = contenuMini();
  const niv = effets => ({ cout: { materiaux: 1, travail: 1 }, requiert: {}, effets });
  return { ...base, installations: [...base.installations,
    { cle: "chiens", nom: "chiens", categorie: "defense", niveauMax: 1, niveaux: [niv({ defense: 1, consommation: { nourriture: 1 } })] },
    { cle: "ruches", nom: "ruches", categorie: "nourriture", niveauMax: 1, niveaux: [niv({ production: { nourriture: 1, medicaments: 0.1 } })] }] };
})();
const abriBetes = (stocks, extra = {}) => ({ site: "hauts-ferme", region: L.siteDe(AVEC_BETES, "hauts-ferme").region, stocks, sol: 2, ...extra });

test("les chiens de garde mangent (après les personnes) ; sans restes, ils ne gardent plus", () => {
  const b = L.bilanAbri(abriBetes({ nourriture: 20, eau: 20 }), [I("chiens", 1)], AVEC_BETES, { jour: 100, personnes: 2 });
  assert.equal(b.consommation.nourriture, 3, "2 personnes et les chiens");
  assert.equal(b.defense, L.bilanAbri(abriBetes({ nourriture: 20, eau: 20 }), [], AVEC_BETES, { jour: 100, personnes: 2 }).defense + 1);
  const j = L.journeeAbri(abriBetes({ nourriture: 20, eau: 20 }), [I("chiens", 1)], AVEC_BETES, { jour: 100, personnes: 2 });
  assert.equal(j.abri.stocks.nourriture, 20 - 3 - L.pertesJour(17));
  // Juste de quoi nourrir les personnes : les chiens s'arrêtent, personne ne manque.
  const affames = L.bilanAbri(abriBetes({ nourriture: 2, eau: 20 }), [I("chiens", 1)], AVEC_BETES, { jour: 100, personnes: 2 });
  assert.equal(affames.consommation.nourriture, 2);
  assert.ok(affames.arrets.some(a => a.cle === "chiens" && a.raison === "nourriture"));
  assert.deepEqual(L.journeeAbri(abriBetes({ nourriture: 2, eau: 20 }), [I("chiens", 1)], AVEC_BETES, { jour: 100, personnes: 2 }).manque, {});
});

test("une petite production (0,1 médicament par jour) s'accumule au lieu d'être arrondie à zéro chaque jour", () => {
  let abri = abriBetes({ nourriture: 50, eau: 50, medicaments: 0 });
  for (let j = 0; j < 30; j++) abri = L.journeeAbri(abri, [I("ruches", 1)], AVEC_BETES, { jour: 200 + j, personnes: 1 }).abri;
  assert.equal(abri.stocks.medicaments, 3, "trois médicaments en trente jours");
  assert.ok(abri.reliquats.medicaments >= 0 && abri.reliquats.medicaments < 1);
  // Une production d'au moins une demi-unité reste simplement arrondie (rien ne change pour elle).
  const b = L.bilanAbri(abri, [I("ruches", 1)], AVEC_BETES, { jour: 300, personnes: 1 });
  assert.equal(b.production.nourriture, 1);
});

test("un abri abandonné occupé par une faction qui a quitté la région (ou s'y est éteinte) redevient libre", () => {
  let m = L.creerMonde(C, "abri-libre");
  const region = "port-gris";
  m = L.abandonnerAbri(m, region, { site: "port-immeuble", installations: [I("palissade", 1)], jour: 1 });
  const faction = Object.keys(m.regions[region].factions)[0] ?? "pillards";
  m.regions[region].abrisAbandonnes[0].occupe = faction;
  m.regions[region].abrisAbandonnes[0].stocks = { nourriture: 12 };
  // La faction est là : l'abri reste à elle.
  m.regions[region].factions[faction] = 3;
  let r = L.simulerJour(m, C, L.hasardDuJour("abri-libre", 30), 30, {});
  assert.equal(r.monde.regions[region].abrisAbandonnes[0].occupe, faction);
  // Elle n'est plus dans la région : l'abri se libère (ses stocks partis avec elle), on peut le reprendre.
  delete m.regions[region].factions[faction];
  r = L.simulerJour(m, C, L.hasardDuJour("abri-libre", 30), 30, {});
  const a = r.monde.regions[region].abrisAbandonnes[0];
  assert.equal(a.occupe, null);
  assert.deepEqual(L.normaliserStocks(a.stocks), L.normaliserStocks({}));
  assert.ok(L.installerAbri(r.monde, C, { site: "port-immeuble", jour: 31 }).ok, "on peut s'y réinstaller");
});

test("les événements météo du contenu (éboulement d'une route de cirque…) arrivent, là où ils sont un danger de la région", () => {
  // Le vrai contenu décrit 16 événements « meteo » ; la simulation n'en tirait aucun (seuls cyclone, fortes pluies, crue et
  // éruption, qu'elle simule elle-même) : l'éboulement de la route du Littoral, de Cilaos ou de Salazie n'arrivait jamais.
  const base = contenuMini();
  const regions = structuredClone(base.regions).map(r => {
    if (r.cle === "cirque-perdu") { r.dangers = [...r.dangers, "eboulement-col"]; r.voisins = r.voisins.map(v => ({ ...v, coupure: [...(v.coupure ?? []), "eboulement-col"] })); }
    return r;
  });
  const C2 = { ...base, regions, evenements: [...base.evenements,
    { cle: "eboulement-col", nom: "Éboulement du col", type: "meteo", phases: [], zones: ["hauts", "cirque"], saisons: [], poids: 30, public: true, texte: "<p>La route du col est fermée.</p>", effets: { route: "coupee", duree: 20 } },
    { cle: "fortes-pluies", nom: "Fortes pluies", type: "meteo", phases: [], zones: [], saisons: [], poids: 30, public: true, texte: "<p>Il pleut.</p>", effets: { route: "difficile", duree: 2 } }] };
  let m = L.creerMonde(C2, "eboulement");
  const vus = [];
  let coupee = 0;
  for (let j = 1; j <= 200; j++) {
    const r = L.simulerJour(m, C2, L.hasardDuJour("eboulement", j), j, {});
    m = r.monde;
    for (const f of r.faits) if (f.cle === "eboulement-col") vus.push(f.region);
    assert.ok(!r.faits.some(f => f.cle === "fortes-pluies" && f.cleTexte === "evenement"), "les fortes pluies restent celles de la simulation (pas de doublon)");
    if (m.regions["cirque-perdu"].routes["hauts-verts"] === "coupee") coupee++;
  }
  assert.ok(vus.length >= 2, `l'éboulement du col arrive (${vus.length} fois en 200 jours)`);
  assert.deepEqual([...new Set(vus)], ["cirque-perdu"], "seulement dans la région dont c'est un danger");
  assert.ok(coupee >= 20, `la route du col reste coupée (${coupee} jours)`);
});

test("les dangers d'une rencontre suivent ceux de la région, même nommés finement par le contenu", () => {
  // Le contenu nomme « eboulement-cilaos », « incendie-foret »… ; la logique n'y reconnaissait que « eboulement », « incendie »,
  // « crue » et tirait donc un danger au hasard partout (une crue en pleine sécheresse de l'Ouest).
  const vrai = chargerContenu();
  const m = L.creerMonde(vrai, "dangers");
  const familles = region => new Set(Array.from({ length: 40 }, (_, i) => L.rencontreForcee(m, vrai, L.deriverHasard("danger", region, i), { region, type: "danger" })?.danger).filter(Boolean));
  assert.deepEqual([...familles("cilaos")], ["eboulement"]);
  assert.deepEqual([...familles("saint-paul")], ["incendie"]);
  assert.deepEqual([...familles("est")].sort(), ["crue"]);
});

// ------------------------------------------------------------------ un an de jeu, contrôlé chaque jour
const contenu = chargerContenu();
const PARTIES = [
  ["sedentaire-4", "g1", "hauts-de-l-ouest"], ["seul-sedentaire", "g2", "cilaos"], ["compagnons", "g3", "saint-pierre"],
  ["recrues", "g4", "plaine-des-palmistes"], ["nomade-4", "g5", "saint-denis"], ["mixte-4", "g6", "le-tampon"]
];
const parties = PARTIES.map(([scenario, graine, region]) => jouerLongue(contenu, scenario, { graine, region, jours: 365 }));

test("un an de jeu (6 scénarios) : aucune anomalie relevée par les contrôles du jour", () => {
  for (const p of parties) {
    // Les clés déclarées en attente de traduction (L.CLES_A_TRADUIRE) sont suivies par survie-textes.test.mjs (essai « todo »).
    const liste = [...p.anomalies].filter(([sorte]) => !sorte.startsWith("traduction en attente")).map(([sorte, a]) => `${sorte} ×${a.n} (${JSON.stringify(a.exemple)})`);
    assert.deepEqual(liste, [], `${p.scenario} ${p.graine} : ${liste.join(" ; ")}`);
  }
});

test("un an de jeu : le temps et le monde avancent ensemble (un déménagement prend aussi sa journée)", () => {
  for (const p of parties) {
    const jours = p.serie.map(x => x.jour);
    assert.deepEqual(jours, Array.from({ length: jours.length }, (_, i) => i + 1), `${p.scenario} : un relevé par jour, sans trou`);
  }
  const nomade = parties.find(p => p.scenario === "nomade-4");
  assert.ok(nomade.stats.demenagements >= 3, `le nomade a déménagé (${nomade.stats.demenagements})`);
});

test("un an de jeu : les renseignements de la région vieillissent quand on ne la regarde plus", () => {
  const seul = parties.find(p => p.scenario === "seul-sedentaire");
  const ages = seul.serie.map(x => x.ageVoisines).filter(x => x !== null);
  if (ages.length > 60) assert.ok(Math.max(...ages) > 30, "une voisine jamais revue vieillit");
  const vivants = parties.filter(p => p.serie.length > 100);
  assert.ok(vivants.length >= 3, "assez de parties longues");
});
