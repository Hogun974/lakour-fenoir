// Lot 7 « Bâtir et défendre » (contrat §26) : la forme du contenu (38 installations, matériaux et entretiens des installations d'avant,
// sœurs, plans, journaux, tables, page du guide) et sa traduction anglaise.   Lancer : npm run essais
import { test } from "node:test";
import assert from "node:assert/strict";
import { DOCUMENTS, donnees } from "../modules/lakour-fenoir/contenu/index.mjs";
import { verifierDonnees, fabriquerAnglais, fabriquer, lireDictionnaires } from "../outils/fabriquer-fenoir.mjs";
import { INSTALLATIONS_OUVRAGES, OUVRAGES_EXISTANTS, PLANS_OUVRAGES, PLANS_OUVRAGES_DES_SITES, JOURNAUX_OUVRAGES, TABLES_OUVRAGES, PAGES_JOUEUR_OUVRAGES }
  from "../modules/lakour-fenoir/contenu/ouvrages.mjs";
import * as L from "../systems/lakour-survie/logique/index.mjs";

const D = donnees();
const def = cle => D.installations.find(i => i.cle === cle);
const sans = t => String(t ?? "").replace(/<[^>]+>/g, " ");

test("installations du lot : 38, saines, chacune son matériau ; les défenses, l'eau, le feu, la vie, les remises, l'énergie", () => {
  assert.equal(INSTALLATIONS_OUVRAGES.length, 38);
  assert.deepEqual(verifierDonnees(D), []);
  assert.deepEqual(L.erreursOuvrages(D), []);
  for (const d of INSTALLATIONS_OUVRAGES) {
    const r = def(d.system.cle);
    assert.ok(r, d.system.cle);
    assert.ok(r.materiau || r.niveaux.every(n => n.materiau), `${r.cle} : un matériau`);
    assert.ok(sans(r.description).length > 80, `${r.cle} : une description`);
    assert.ok(!/\bzombi|walker|rôdeur/i.test(sans(r.description)), r.cle);
  }
  // Ce que chacune apporte, en règles.
  assert.equal(def("chausse-trapes").niveaux[0].effets.piege, 1);
  assert.equal(def("douves").niveaux[0].effets.piege, 2);
  assert.ok(def("chemin-de-ronde").niveaux[0].effets.hauteur);
  assert.ok(def("herse").niveaux[0].effets.porte && def("portail-de-bois-dur").niveaux[0].effets.porte && def("passerelle-relevee").niveaux[0].effets.porte);
  assert.ok(def("cloche-d-alarme").niveaux[0].effets.alarme);
  assert.equal(def("haie-de-choka").niveaux[0].effets.pousse, 180);
  assert.equal(def("touffe-de-bambous").niveaux[0].effets.bois, 0.5);
  assert.deepEqual(def("puits-creuse").niveaux[0].requiert.site.eau, ["aucune", "citerne", "reseau"]);
  assert.equal(def("digesteur-a-biogaz").niveaux[0].effets.production.gaz, 0.5, "le digesteur fait du gaz (ressource du §13)");
  assert.ok(def("lampes-a-huile").niveaux[0].effets.lumiere && def("eclairage-electrique").niveaux[0].effets.lumiere);
  assert.ok(def("salle-verte").niveaux[0].effets.fete === 1 && def("remise-a-charrettes").niveaux[0].effets.remise > 0);
});

test("sœurs : chaque version lontan du lot a sa moderne (rôle, rang), ne coûte ni matériaux ni pièces fouillés", () => {
  const soeurs = { "haie-de-choka": "barricades", "chausse-trapes": "fosse-et-pieges", "portail-de-bois-dur": "herse", "bassin-de-pierre": "cuve-en-hauteur",
    "jarre-filtrante": "filtre-sable-charbon", "foyer-trois-roches": "cuisine-commune", boucan: "sechoir-fumoir", "cellier-de-pierre": "reserve-etanche",
    paillasse: "dortoir", "lampes-a-huile": "eclairage", "remise-a-charrettes": "remise" };
  for (const [cle, role] of Object.entries(soeurs)) {
    const d = def(cle);
    assert.equal(d.arbre, "lontan", cle);
    assert.equal(L.roleDe(d), role, cle);
    for (const n of d.niveaux) assert.ok(!(n.cout.materiaux > 0) && !(n.cout.pieces > 0), `${cle} : rien de fouillé`);
  }
  assert.equal(L.roleDe(def("enceinte-de-palettes")), "palissade");
  assert.ok(L.rangDe(def("pompe-electrique")) < L.rangDe(def("pompe-manuelle")), "la pompe électrique passe avant la pompe à bras");
  // Deux sœurs ne s'additionnent pas : la haie attend tant que les barricades tiennent.
  const I = (cle, niveau = 1) => L.instanceInstallation(cle, niveau, { termineLe: -365 });
  const b = L.bilanAbri({ site: "ferme-de-la-plaine-des-cafres", region: "le-tampon", stocks: {} }, [I("barricades"), I("haie-de-choka")], D, { jour: 400, personnes: 1 });
  assert.ok(b.secours.some(x => x.cle === "haie-de-choka"));
});

test("installations d'avant : un matériau (le mur de pierre, puis de parpaing), un entretien seulement sans bras, le piège et la porte", () => {
  for (const cle of Object.keys(OUVRAGES_EXISTANTS)) assert.ok(def(cle), `${cle} existe`);
  assert.equal(def("mur").niveaux[0].materiau, "pierre-seche");
  assert.equal(def("mur").niveaux[2].materiau, "parpaing-et-beton");
  assert.equal(def("boucan").materiau, "paille-et-torchis");
  assert.equal(def("citerne-de-pluie").niveaux[0].entretien.tousLes, 60);
  assert.ok(def("panneaux-solaires").niveaux[0].entretien.lavee && def("pico-hydro").niveaux[0].entretien.arret);
  for (const i of D.installations) if (i.niveaux.some(n => n.effets.bras) && OUVRAGES_EXISTANTS[i.cle]) {
    assert.ok(!i.niveaux.some(n => n.entretien), `${i.cle} : ses bras l'entretiennent`);
  }
  assert.deepEqual(def("fosse-et-pieges").niveaux.map(n => n.effets.piege), [1, 2]);
  assert.equal(def("porte-blindee").niveaux[0].effets.porte, true);
  // Les chiffres de production d'avant ne bougent pas.
  assert.equal(def("citerne-de-pluie").niveaux[2].effets.production.eau, 3);
  assert.equal(def("fosse-et-pieges").niveaux[1].effets.defense, 2);
});

test("plans : un par installation du lot, au registre ; les plans rares là où le savoir vivait ; un rabais, jamais une exigence", () => {
  assert.equal(PLANS_OUVRAGES.length, INSTALLATIONS_OUVRAGES.length);
  for (const d of INSTALLATIONS_OUVRAGES) assert.ok(D.plans.some(p => p.installation === d.system.cle), d.system.cle);
  assert.deepEqual(L.erreursPlans(D), []);
  const p = cle => D.plans.find(x => x.installation === cle);
  assert.deepEqual(p("four-a-pain").rarete, [10, 35]);
  assert.deepEqual(p("four-a-chaux").rarete, [25, 55]);
  assert.deepEqual(p("digesteur-a-biogaz").rarete, [70, 95]);
  for (const [site, plans] of Object.entries(PLANS_OUVRAGES_DES_SITES)) for (const k of plans) assert.ok(D.sites.find(s => s.cle === site).plans.includes(k), `${site} : ${k}`);
  for (const d of INSTALLATIONS_OUVRAGES) for (const n of d.system.niveaux) assert.ok(!n.requiert.plan, "aucune n'exige un plan");
});

test("journaux du MJ, tables, page du guide du joueur ; le registre les porte, le compendium aussi", () => {
  assert.deepEqual(JOURNAUX_OUVRAGES.map(j => j.name), ["Les Livides devant un abri", "Bâtir et entretenir"]);
  for (const j of JOURNAUX_OUVRAGES) assert.ok(DOCUMENTS.includes(j));
  assert.ok(JOURNAUX_OUVRAGES[0].pages.some(p => /ne monte pas à l'échelle/.test(p.text.content)));
  assert.equal(TABLES_OUVRAGES.length, 3);
  for (const t of TABLES_OUVRAGES) { assert.ok(DOCUMENTS.includes(t)); assert.ok(t.results.length >= 8); }
  const guide = DOCUMENTS.find(d => d.__cle === "guides:guide-du-joueur");
  assert.ok(guide.pages.some(p => p.name === PAGES_JOUEUR_OUVRAGES[0].titre));
});

test("anglais : les installations, les journaux, les tables et la page du guide du lot sont traduits ; rien de « Livide »", () => {
  const { dictionnaire } = lireDictionnaires();
  const { documents, rapport } = fabriquerAnglais(fabriquer(), donnees(), dictionnaire);
  const doc = cle => documents.find(d => d.cle === cle)?.doc;
  const boucan = documents.find(d => d.doc?.system?.cle === "boucan")?.doc;
  assert.equal(boucan.name, "Boucan");
  assert.match(boucan.system.description, /thatched hut/);
  assert.equal(documents.find(d => d.doc?.system?.cle === "chemin-de-ronde").doc.name, "Wall walk");
  assert.equal(doc("mj:les-livides-devant-un-abri").name, "The Pallid before a shelter");
  assert.equal(doc("tables:livides-devant-l-abri").name, "The Pallid before the shelter — what they do");
  const texte = JSON.stringify([...INSTALLATIONS_OUVRAGES.map(d => documents.find(x => x.doc?._id === d._id)?.doc), doc("mj:les-livides-devant-un-abri"), doc("mj:batir-et-entretenir"),
    ...TABLES_OUVRAGES.map(t => doc(`tables:${t.flags["lakour-fenoir"].cle}`))]);
  assert.ok(!/\bLivides?\b/.test(texte), "« Livide » reste dans l'anglais");
  assert.ok(/the Pallid/.test(texte));
  assert.equal(rapport.manquants.filter(m => /ouvrage|boucan|herse|douves|choka/i.test(String(m))).length, 0);
});
