// Lot 4 « Les plans » (contrat §21) : la logique pure (systems/lakour-survie/logique/plans.mjs) sur le VRAI contenu de lakour-fenoir.
// Clés du carnet, rareté et valeur, lire et connaître, cahier dicté, rabais d'une recette, apprendre par cœur, trouver en fouillant
// (chance, tirage, retour, plans uniques), lieux à plans (fenêtres, tirage, retour), cyclone gardé, étagère aux cahiers, vérification
// du contenu, et ce que fait le temps (avancer : la fenêtre qui s'ouvre au journal secret, l'eau du cyclone sur l'étagère).
// Lancer : npm run essais
import { test } from "node:test";
import assert from "node:assert/strict";
import * as L from "../systems/lakour-survie/logique/index.mjs";
import { donnees } from "../modules/lakour-fenoir/contenu/index.mjs";

const C = donnees();
const zero = () => 0, haut = () => 0.999;
const site = cle => L.siteDe(C, cle);
const lieu = cle => L.lieuAPlansDe(C, cle);
const premierJour = (predicat, depuis = 0) => { for (let j = depuis; j < depuis + 800; j++) if (predicat(j)) return j; return null; };

test("plans : clés du carnet (installation ou « recette:<clé> »), couverture, plan de rareté par défaut, noms", () => {
  assert.equal(L.clePlanRecette("gazogene"), "recette:gazogene");
  assert.deepEqual(L.ciblePlan("recette:gazogene"), { type: "recette", cle: "gazogene" });
  assert.deepEqual(L.ciblePlan("potager"), { type: "installation", cle: "potager" });
  assert.ok(L.cibleExiste(C, "potager") && L.cibleExiste(C, "recette:gazogene") && !L.cibleExiste(C, "recette:licorne"));
  assert.deepEqual(L.couvertureDe(L.planDuRegistre(C, "recette-gazogene")), ["recette:gazogene"]);
  assert.deepEqual(L.couvertureDe(L.planDuRegistre(C, "carnet-du-fontainier")), ["captage-de-source", "conduite-de-bambou", "citerne-lontan", "puits-a-balancier"]);
  // Une installation que le registre ne décrit pas a quand même un plan (on le connaît en la bâtissant) : rareté par défaut.
  const p = L.planPourCle(C, "barricades");
  assert.ok(p.synthetique && p.rarete[0] === 10 && p.rarete[1] === 30);
  assert.equal(L.planPourCle(C, "pico-hydro").cle, "pico-hydro");
  assert.equal(L.planPourCle(C, "licorne"), null);
  assert.equal(L.nomDuPlan(C, "recette:gazogene"), L.indexer(C).recettes.get("gazogene").nom);
});

test("plans : rareté courante (moyenne, puis vers le minimum quand des copies circulent) et valeur au troc en parts (× 3 unique)", () => {
  const potager = L.planDuRegistre(C, "potager");      // [5, 20]
  assert.equal(L.rareteCourante(potager), 12.5);
  assert.equal(L.valeurPlan(potager), Math.round(3 + 0.2 * 12.5));
  const pico = L.planDuRegistre(C, "pico-hydro");     // [65, 90]
  assert.ok(L.estRare(pico) && !L.estRare(potager));
  assert.equal(L.valeurPlan(pico), Math.round(3 + 0.2 * 77.5));
  let circ = {};
  for (let k = 0; k < 2; k++) circ = L.faireCirculer(circ, "pico-hydro");
  assert.equal(L.rareteCourante(pico, circ), Math.round((77.5 - 12.5 * 0.5) * 10) / 10);
  for (let k = 0; k < 6; k++) circ = L.faireCirculer(circ, "pico-hydro");
  assert.equal(L.rareteCourante(pico, circ), 65, "jamais sous le minimum : un plan rare reste rare");
  assert.ok(L.valeurPlan(pico, { circulation: circ }) < L.valeurPlan(pico));
  const cahier = L.planDuRegistre(C, "cahier-de-tisanes-de-la-gramoune");
  assert.equal(L.valeurPlan(cahier), Math.round((3 + 0.2 * 95) * 3));
  assert.equal(L.rareteCourante(cahier, { "cahier-de-tisanes-de-la-gramoune": 9 }), 95, "un plan unique ne circule pas");
});

test("plans : lire demande le savoir-faire du premier niveau (ou de la recette) ; ce que le groupe connaît", () => {
  assert.deepEqual(L.savoirsDuPlan(C, "pico-hydro"), ["hydraulique-rurale"]);
  assert.deepEqual(L.savoirsDuPlan(C, "potager"), []);
  assert.deepEqual(L.savoirsDuPlan(C, "recette:gazogene"), ["moteurs-de-fortune"]);
  assert.deepEqual(L.peutLirePlan(C, "pico-hydro", []), { ok: false, manque: ["hydraulique-rurale"] });
  assert.equal(L.peutLirePlan(C, "pico-hydro", ["hydraulique-rurale"]).ok, true);
  assert.deepEqual(L.plansConnus({ carnet: ["potager"], parCoeur: [["mur"], []], uniques: [["recette:tisanes", "potager"]] }), ["mur", "potager", "recette:tisanes"]);
});

test("plans : le cahier dicté d'une gramoune est un plan unique (installations lontan et recettes de ses savoirs) ; un cahier d'avant aussi", () => {
  const plans = L.plansDuCahierDicte(["zerbaz", "jardin-creole", "conserverie"], C);
  for (const k of ["jardin-creole", "recette:rimed-lontan", "recette:tisanes", "recette:conserves"]) assert.ok(plans.includes(k), k);
  assert.ok(!plans.includes("potager"), "une installation moderne n'en est pas");
  assert.deepEqual(L.plansDuCahierDicte([], C), []);
  const ancien = L.papierDe({ cle: "cahier-de-gramoune", enseigne: ["zerbaz"] }, C);
  assert.equal(ancien.unique, L.CAHIER_DICTE);
  assert.ok(ancien.plans.includes("recette:rimed-lontan"));
  assert.deepEqual(L.papierDe({ cle: "manuel-de-survie", enseigne: ["radio"] }, C), { plans: [], unique: "" }, "un livre n'est pas un papier de plans");
  assert.equal(L.valeurPapier(C, ancien), Math.round((3 + 0.2 * 95) * 3));
});

test("plans : une recette avec son plan coûte un quart de moins et prend la moitié du travail ; sans plan, rien ne change", () => {
  const g = L.indexer(C).recettes.get("gazogene");   // pièces 5, matériaux 6, travail 12
  const sans = L.recetteAvecPlan(g, []);
  assert.deepEqual([sans.cout, sans.travail, sans.plan], [g.cout, g.travail, false]);
  const avec = L.recetteAvecPlan(g, ["recette:gazogene"]);
  assert.deepEqual(avec.cout, { pieces: Math.ceil(5 * 0.75), materiaux: Math.ceil(6 * 0.75) });
  assert.equal(avec.travail, 6);
  assert.equal(avec.plan, true);
  // Une installation : le rabais d'avant, lu depuis ce que le groupe connaît (carnet, par cœur, unique en main).
  const def = L.installationDe(C, "captage-de-source");
  const v = L.peutConstruire(def, 1, { stocks: { materiaux: 10, pieces: 10 } }, site("ilet-de-marla"), { plans: L.plansConnus({ uniques: [L.couvertureDe(L.planDuRegistre(C, "carnet-du-fontainier"))] }) });
  assert.equal(v.plan, true);
  assert.equal(v.cout.travail, Math.ceil(10 * 0.5));
});

test("plans : apprendre par cœur, veillée après veillée (1 + rareté ÷ 25), seulement ce que le groupe connaît et sait comprendre", () => {
  const eleve = { savoirs: [], plans: [], planEnCours: null };
  let r = L.veilleePlan(eleve, { cle: "potager", contenu: C, connus: [] });
  assert.equal(r.ok, false);
  assert.equal(r.motifs[0].cle, "plan-pas-connu");
  r = L.veilleePlan(eleve, { cle: "pico-hydro", contenu: C, connus: ["pico-hydro"] });
  assert.ok(!r.ok && r.motifs.some(m => m.cle === "plan-illisible"));
  const requis = L.veilleesPourApprendre(L.planDuRegistre(C, "pico-hydro"));
  assert.equal(requis, 1 + Math.floor(77.5 / 25));
  let s = { ...eleve, savoirs: ["hydraulique-rurale"] };
  for (let k = 1; k <= requis; k++) {
    r = L.veilleePlan(s, { cle: "pico-hydro", contenu: C, connus: ["pico-hydro"] });
    assert.ok(r.ok);
    s = r.system;
    assert.equal(r.termine, k === requis);
  }
  assert.deepEqual(s.plans, ["pico-hydro"]);
  assert.equal(s.planEnCours, null);
  assert.equal(L.veilleePlan(s, { cle: "pico-hydro", contenu: C, connus: ["pico-hydro"] }).motifs[0].cle, "plan-deja-appris");
});

test("plans : la fouille « plans » (chance selon le site, plafonnée), ce qu'on peut tirer (pas de plan rare hors de son site), le retour", () => {
  assert.equal(L.chanceDePlan({ site: { type: "commerce" }, n: 2 }), 0.25);
  assert.equal(L.chanceDePlan({ site: { type: "commerce" }, n: 8 }), 0.5);
  assert.equal(L.chanceDePlan({ site: { type: "usine" }, n: 40, prudence: "rapide" }), 0.6);
  assert.ok(L.chanceDePlan({ site: { type: "commerce" }, n: 2, prudence: "discret" }) < 0.25);
  assert.equal(L.chanceDePlan({ site: null, n: 2 }), 0.04);
  // Un garage ordinaire : pas de pico-hydro ; la petite centrale de Langevin : la sienne, même rare, trois fois plus.
  const usine = L.plansDuLieu(C, { site: { cle: "x", type: "usine", plans: [] } });
  assert.ok(usine.length && !usine.some(([k]) => k === "pico-hydro"));
  const langevin = L.plansDuLieu(C, { site: site("centrale-de-langevin") });
  assert.ok(langevin.some(([k]) => k === "pico-hydro"));
  // Le cahier de tisanes (unique) dans les cases, une seule fois.
  const cases = L.plansDuLieu(C, { site: site("case-de-bellemene") });
  assert.ok(cases.some(([k]) => k === "cahier-de-tisanes-de-la-gramoune"));
  assert.ok(!L.plansDuLieu(C, { site: site("case-de-bellemene"), uniquesSortis: ["cahier-de-tisanes-de-la-gramoune"] }).some(([k]) => k === "cahier-de-tisanes-de-la-gramoune"));
  // Un plan déjà au carnet pèse moitié moins.
  const poids = (liste, k) => liste.find(([c]) => c === k)?.[1];
  assert.equal(poids(L.plansDuLieu(C, { site: site("hypermarche-de-savanna"), connus: ["mur"] }), "mur") * 2, poids(L.plansDuLieu(C, { site: site("hypermarche-de-savanna") }), "mur"));
});

test("plans : chercherPlan trouve, note le retour du site et les plans uniques sortis ; rien avant le retour", () => {
  const monde = { regions: { "saint-paul": {} } };
  const r = L.chercherPlan(monde, C, zero, { region: "saint-paul", site: site("hypermarche-de-savanna"), n: 2, jour: 10 });
  assert.ok(r.plan && L.planDuRegistre(C, r.plan));
  assert.equal(r.prochain, 13, "un commerce : 3 jours");
  assert.equal(r.monde.plans.lieux["hypermarche-de-savanna"], 13);
  assert.equal(monde.plans, undefined, "le monde donné n'est pas touché");
  const encore = L.chercherPlan(r.monde, C, zero, { region: "saint-paul", site: site("hypermarche-de-savanna"), n: 2, jour: 12 });
  assert.deepEqual([encore.plan, encore.chance], [null, 0]);
  assert.ok(L.chercherPlan(r.monde, C, zero, { region: "saint-paul", site: site("hypermarche-de-savanna"), n: 2, jour: 13 }).plan);
  const rate = L.chercherPlan(monde, C, haut, { region: "saint-paul", site: site("hypermarche-de-savanna"), n: 2, jour: 10 });
  assert.equal(rate.plan, null);
  // Le dernier plan d'une case (hasard haut) : le cahier unique, noté sorti.
  const tirage = L.plansDuLieu(C, { site: site("case-de-bellemene") });
  let i = 0;
  const h = () => (i++ === 0 ? 0 : 0.9999);
  const u = L.chercherPlan(monde, C, h, { region: "saint-paul", site: site("case-de-bellemene"), n: 2, jour: 1 });
  assert.equal(u.plan, tirage.at(-1)[0]);
  if (L.planDuRegistre(C, u.plan)?.unique) assert.deepEqual(u.monde.plans.uniques, [u.plan]);
});

test("fouiller : la cible « plans » rend un plan et le fait « plan-trouve » ; elle compte comme une fouille ; les autres cibles n'en rendent pas", () => {
  const { monde } = L.demarrerPartie({ contenu: C, graine: "plans-fouille", region: "saint-paul", membres: ["a"] });
  const r = L.fouiller(monde, C, zero, { region: "saint-paul", site: "hypermarche-de-savanna", cible: "plans", membres: 2, quarts: 1, jour: 3 });
  assert.ok(r.plan);
  assert.equal(r.fouille, true);
  assert.ok(r.faits.some(f => f.cle === "plan-trouve" && f.public && f.params.plan));
  assert.equal(r.monde.plans.lieux["hypermarche-de-savanna"], 6);
  const autre = L.fouiller(monde, C, zero, { region: "saint-paul", site: "hypermarche-de-savanna", cible: "nourriture", membres: 2, quarts: 1, jour: 3 });
  assert.equal(autre.plan, null);
  assert.ok(!autre.faits.some(f => f.cle === "plan-trouve"));
});

test("lieux à plans : les fenêtres (saison sèche, nouvelle lune, après un cyclone, entre deux coulées) et celles qui s'ouvrent", () => {
  const dateDepart = "2026-12-04";
  const takamaka = lieu("salle-des-machines-de-takamaka");
  assert.equal(L.fenetreLieu(takamaka, { jour: 0, dateDepart }).ouverte, false, "décembre : saison des pluies");
  assert.equal(L.fenetreLieu(takamaka, { jour: 0, dateDepart }).motifs[0].cle, "plans-fenetre-saison-seche");
  const sec = premierJour(j => L.saisonDuJour(j, dateDepart) === "seche");
  assert.equal(L.fenetreLieu(takamaka, { jour: sec, dateDepart }).ouverte, true);
  assert.ok(L.fenetresQuiSouvrent(C, { jour: sec, dateDepart }).some(l => l.cle === takamaka.cle));
  assert.ok(!L.fenetresQuiSouvrent(C, { jour: sec + 1, dateDepart }).some(l => l.cle === takamaka.cle));
  const station = lieu("station-agronomique-de-bassin-plat");
  const nouvelle = premierJour(j => L.lune(L.dateDuJour(j, dateDepart).iso)?.phase === "nouvelle");
  assert.equal(L.fenetreLieu(station, { jour: nouvelle, dateDepart }).ouverte, true);
  assert.equal(L.fenetreLieu(station, { jour: nouvelle + 12, dateDepart }).ouverte, false);
  const port = lieu("conteneurs-du-port-est");
  assert.equal(L.fenetreLieu(port, { jour: 10, dateDepart, cyclones: { "le-port": 10 } }).ouverte, false, "le jour même, non");
  assert.equal(L.fenetreLieu(port, { jour: 11, dateDepart, cyclones: { "le-port": 10 } }).ouverte, true);
  assert.equal(L.fenetreLieu(port, { jour: 18, dateDepart, cyclones: { "le-port": 10 } }).ouverte, false, "une semaine au plus");
  assert.ok(L.fenetresQuiSouvrent(C, { jour: 11, dateDepart, cyclones: { "le-port": 10 } }).some(l => l.cle === port.cle));
  const tunnels = lieu("tunnels-de-l-enclos");
  const eruption = { debut: 20, fin: 30, regions: ["fournaise", "sud-sauvage"] };
  assert.equal(L.fenetreLieu(tunnels, { jour: 25, dateDepart, eruption }).ouverte, false);
  assert.equal(L.fenetreLieu(tunnels, { jour: 33, dateDepart, eruption }).ouverte, false, "la coulée fume encore");
  assert.equal(L.fenetreLieu(tunnels, { jour: 34, dateDepart, eruption }).ouverte, true);
  assert.equal(L.fenetreLieu(lieu("ilet-de-roche-plate"), { jour: 0, dateDepart }).ouverte, true, "sans fenêtre : toujours ouvert");
});

test("lieux à plans : un plan parmi plusieurs, puis revenir plus tard ; un plan unique une seule fois ; fenêtre fermée : rien", () => {
  const ilet = lieu("ilet-de-roche-plate");
  const r = L.tirerDuLieu({}, C, ilet, zero, { jour: 5, dateDepart: "2026-12-04" });
  assert.ok(r.ok && ilet.tirage.some(x => x.plan === r.plan));
  assert.equal(r.prochain, 5 + ilet.retour);
  const avant = L.tirerDuLieu(r.monde, C, ilet, zero, { jour: 20, dateDepart: "2026-12-04" });
  assert.equal(avant.ok, false);
  assert.equal(avant.motifs[0].cle, "plans-lieu-revenir");
  // Le carnet du fontainier (le dernier du tirage) : sorti une fois, il ne sort plus.
  const u = L.tirerDuLieu({}, C, ilet, haut, { jour: 5, dateDepart: "2026-12-04" });
  assert.equal(u.plan, "carnet-du-fontainier");
  assert.deepEqual(u.monde.plans.uniques, ["carnet-du-fontainier"]);
  const ensuite = L.tirerDuLieu(u.monde, C, ilet, haut, { jour: 5 + ilet.retour, dateDepart: "2026-12-04" });
  assert.ok(ensuite.ok && ensuite.plan !== "carnet-du-fontainier");
  const ferme = L.tirerDuLieu({}, C, lieu("salle-des-machines-de-takamaka"), zero, { jour: 0, dateDepart: "2026-12-04" });
  assert.equal(ferme.ok, false);
  assert.equal(L.etatLieuAPlans(r.monde, ilet, 6).revenir, true);
  assert.equal(L.etatLieuAPlans(r.monde, ilet, 6).tires[0], r.plan);
});

test("lieux à plans : le cyclone du jour (alerte rouge) garde sa date pour les régions de sa trajectoire", () => {
  const monde = { cyclone: { alerte: "rouge", arrivee: 40, trajectoire: ["le-port", "saint-paul"] } };
  assert.deepEqual(L.noterCyclone(monde, 40).plans.cyclones, { "le-port": 40, "saint-paul": 40 });
  assert.equal(L.noterCyclone(monde, 41), monde, "un autre jour : rien");
});

test("étagère aux cahiers : places et coffre selon le niveau en service ; ranger ; ce que le vol, le feu et l'eau emportent", () => {
  assert.deepEqual(L.etagereDeLAbri([], C), { places: 0, protege: false, niveau: 0 });
  assert.deepEqual(L.etagereDeLAbri([{ cle: "etagere-aux-cahiers", niveau: 1, etat: 0 }], C), { places: 12, protege: false, niveau: 1 });
  assert.deepEqual(L.etagereDeLAbri([{ cle: "etagere-aux-cahiers", niveau: 2, etat: 0 }], C), { places: 24, protege: true, niveau: 2 });
  assert.equal(L.etagereDeLAbri([{ cle: "etagere-aux-cahiers", niveau: 2, etat: 3 }], C).places, 0, "hors service");
  assert.equal(L.rangerSurEtagere([], { id: "p" }, { places: 0 }).motif.cle, "etagere-absente");
  const pleine = Array.from({ length: 12 }, (_, i) => ({ id: `p${i}`, name: `P${i}` }));
  assert.equal(L.rangerSurEtagere(pleine, { id: "x" }, { places: 12 }).motif.cle, "etagere-pleine");
  assert.equal(L.rangerSurEtagere(pleine.slice(1), { id: "x" }, { places: 12 }).etagere.length, 12);
  assert.equal(L.perteEtagere(pleine, { cause: "feu" }).perdus.length, 6);
  assert.equal(L.perteEtagere(pleine, { cause: "feu", protege: true }).perdus.length, 0);
  assert.equal(L.perteEtagere(pleine, { cause: "eau" }).perdus.length, 1);
  const vol = L.perteEtagere(pleine, { cause: "vol", hasard: haut });
  assert.equal(vol.perdus.length, 3);
  assert.equal(vol.etagere.length, 9);
  assert.ok(L.perteEtagere(pleine, { cause: "vol", protege: true, hasard: haut }).perdus.length <= 1);
  assert.deepEqual(L.plansDeLEtat({}), { circulation: {}, etagere: [] });
});

test("contenu : les plans et les lieux à plans du registre sont sains ; une erreur se voit", () => {
  assert.deepEqual(L.erreursPlans(C), []);
  const casse = structuredClone(C);
  casse.plans.push({ cle: "potager-bis", installation: "potager", rarete: [80, 10], lieux: ["lune"] });
  casse.lieuxAPlans[0].tirage = [{ plan: "inconnu", poids: 1 }];
  casse.lieuxAPlans[1].fenetre = { marée: true };
  const e = L.erreursPlans(casse);
  for (const motif of [/rareté/, /type de site inconnu/, /déjà couvert/, /plan inconnu « inconnu »/, /parmi plusieurs/, /fenêtre « marée »/]) assert.ok(e.some(x => motif.test(x)), String(motif));
});

test("avancer : le jour où la fenêtre d'un lieu s'ouvre, le journal secret le dit (au MJ) ; le cyclone du jour est gardé", () => {
  let { monde, etat } = L.demarrerPartie({ contenu: C, graine: "plans-temps", region: "le-port", membres: ["a"] });
  // Un cyclone frappe Le Port au jour 1 (alerte rouge) : la fenêtre des conteneurs s'ouvre au jour 2.
  monde = { ...monde, cyclone: { nom: "Essai", alerte: "pre-alerte", arrivee: 1, force: 1, trajectoire: ["le-port"] } };
  const r = L.avancer({ etat, monde, contenu: C, quarts: 12, survivants: [{ id: "a", system: L.survivantNeuf({}) }] });
  assert.equal(L.plansDuMonde(r.monde).cyclones["le-port"], 1);
  const f = r.secrets.find(x => x.cle === "plans-fenetre" && x.region === "le-port");
  assert.ok(f, "la fenêtre des conteneurs s'ouvre après le cyclone");
  assert.equal(f.public, false);
  assert.ok(r.monde.journalSecret.some(x => x.cle === "plans-fenetre"));
  assert.ok(!r.faits.some(x => x.cle === "plans-fenetre"), "rien de public");
});

test("avancer : un cyclone qui abîme un abri non préparé gâte un papier de l'étagère (pas dans le coffre)", () => {
  const base = L.demarrerPartie({ contenu: C, graine: "plans-eau", region: "saint-paul", membres: ["a"] });
  const ins = L.installerAbri(base.monde, C, { site: "case-de-bellemene", jour: 0 });
  const papiers = [{ id: "p1", name: "Plan : Potager", system: { cle: "copie-de-plan", plans: ["potager"] } }, { id: "p2", name: "Plan : Mur", system: { cle: "copie-de-plan", plans: ["mur"] } }];
  const essai = niveau => {
    const etat = { ...base.etat, groupe: { ...base.etat.groupe, abri: "abri", region: "saint-paul" }, plans: { circulation: {}, etagere: structuredClone(papiers) } };
    const monde = { ...ins.monde, cyclone: { nom: "Essai", alerte: "orange", arrivee: 1, force: 3, trajectoire: ["saint-paul"] } };
    const abri = { id: "abri", system: { ...ins.abri, stocks: { ...ins.abri.stocks, eau: 20, nourriture: 20 } },
      installations: [...ins.installations, L.instanceInstallation("etagere-aux-cahiers", niveau, { termineLe: 0 })] };
    return L.avancer({ etat, monde, contenu: C, quarts: 8, survivants: [{ id: "a", system: L.survivantNeuf({}) }], abri });
  };
  const r = essai(1);
  assert.ok(r.etat.journal.some(j => /cyclone-degats/.test(j.cle ?? "")), "un cyclone de force 3 abîme la case");
  assert.equal(r.etat.plans.etagere.length, 1, "un papier détrempé");
  assert.ok(r.etat.journal.some(j => j.cle === "etagere-perte-eau"));
  assert.equal(essai(2).etat.plans.etagere.length, 2, "le coffre étanche protège");
});
