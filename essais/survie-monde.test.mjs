// Le monde réel (§2.3) : création, un jour de simulation, menaces ; les renseignements (§2.4).  Lancer : npm run essais
import { test } from "node:test";
import assert from "node:assert/strict";
import { L, contenuMini, constant } from "./doublures/survie-outils.mjs";

const C = contenuMini();

test("creerMonde : coupures dans leurs fenêtres, null = jamais, réserves et nature du contenu", () => {
  for (const g of ["a", "b", "c", "d", "e"]) {
    const m = L.creerMonde(C, g);
    for (const r of L.regionsDe(C)) for (const res of L.RESEAUX) {
      const f = r.infrastructures[res];
      if (f === null) assert.equal(m.coupures[r.cle][res], null);
      else assert.ok(m.coupures[r.cle][res] >= f[0] && m.coupures[r.cle][res] <= f[1], `${r.cle}.${res}`);
    }
  }
  const m = L.creerMonde(C, "x");
  assert.equal(m.regions["port-gris"].pillage.nourriture, 600);
  assert.equal(m.regions["port-gris"].infestation, 0.5);
  assert.equal(m.regions["hauts-verts"].nature.bois, 30);
  assert.equal(m.regions["port-gris"].factions.recuperateurs, 2);
  assert.equal(m.regions["hauts-verts"].routes["cirque-perdu"], "ouverte");
  assert.deepEqual(L.creerMonde(C, "x"), m, "même graine, même monde");
  assert.notDeepEqual(L.creerMonde(C, "y").coupures, m.coupures);
});

test("simulerJour : pur et déterministe", () => {
  const m = L.creerMonde(C, "pur");
  const copie = structuredClone(m);
  const a = L.simulerJour(m, C, L.hasardDuJour("pur", 3), 3, { region: "port-gris" });
  const b = L.simulerJour(m, C, L.hasardDuJour("pur", 3), 3, { region: "port-gris" });
  assert.deepEqual(m, copie, "le monde reçu n'est pas modifié");
  assert.deepEqual(a, b);
  assert.equal(a.monde.jour, 3);
});

test("simulerJour : les réseaux tombent au jour tiré, faits publics chez soi", () => {
  let m = L.creerMonde(C, "res");
  const jourElec = m.coupures["port-gris"].electricite;
  let vu = null;
  for (let j = 1; j <= 20; j++) {
    const r = L.simulerJour(m, C, L.hasardDuJour("res", j), j, { region: "port-gris" });
    m = r.monde;
    const f = r.faits.find(x => x.cle === "reseau-electricite" && x.region === "port-gris");
    if (f) { vu = j; assert.equal(f.public, true); }
  }
  assert.equal(vu, jourElec);
  assert.equal(L.reseauxActifs(m, "port-gris", jourElec - 1).electricite, true);
  assert.equal(L.reseauxActifs(m, "port-gris", jourElec).electricite, false);
  assert.equal(L.reseauxActifs(m, "cirque-perdu", 500).electricite, true, "micro-hydro : jamais");
});

test("simulerJour : infestation qui monte vers la population, puis décroît dans les Bas après le jour 60", () => {
  const m = L.creerMonde(C, "inf");
  const panique = L.simulerJour(m, C, constant(0.999), 3, {}).monde;
  assert.ok(panique.regions["port-gris"].infestation > m.regions["port-gris"].infestation);
  const apres = structuredClone(m);
  apres.regions["port-gris"].infestation = 3;
  apres.regions["hauts-verts"].infestation = 3;
  const r = L.simulerJour(apres, C, constant(0.999), 61, {}).monde;
  assert.ok(Math.abs(r.regions["port-gris"].infestation - 2.955) < 1e-9);
  assert.ok(Math.abs(r.regions["hauts-verts"].infestation - 2.992) < 1e-9);
});

test("hordes : naissent à infestation ≥ 4, vont vers le bruit par routes ouvertes, jamais par une route coupée", () => {
  const m = L.creerMonde(C, "h");
  m.regions["port-gris"].infestation = 4.5;
  let nees = 0;
  for (let i = 0; i < 100; i++) {
    const n = L.simulerJour(m, C, L.creerHasard(`n${i}`), 8, {});
    nees += n.faits.filter(f => f.cle === "horde-nait").length;
    assert.ok(n.faits.filter(f => f.cle === "horde-nait").every(f => f.region === "port-gris"), "seulement là où l'infestation ≥ 4");
  }
  assert.ok(nees > 2 && nees < 20, `environ 8 % : ${nees}/100`);
  assert.equal(L.simulerJour(m, C, constant(0), 6, {}).faits.filter(f => f.cle === "horde-nait").length, 0, "pas avant l'effondrement");
  // Attirée par le bruit : sur 200 tirages, la voisine bruyante gagne largement.
  const base = structuredClone(m);
  base.hordes = [{ id: "h1", region: "port-gris", taille: 3, cap: null, depuis: 8 }];
  let versBruit = 0;
  for (let i = 0; i < 200; i++) {
    const r = L.simulerJour(base, C, L.creerHasard(`b${i}`), 30, { bruitParRegion: { "cote-ouest": 10 } }).monde;
    const h = r.hordes.find(x => x.id === "h1");
    if (h?.cap === "cote-ouest") versBruit++;
  }
  assert.ok(versBruit > 90, `vers le bruit : ${versBruit}/200`);
  // Route coupée : pas de passage.
  const coupe = structuredClone(base);
  coupe.hordes[0].cap = "plaine-est";
  coupe.regions["port-gris"].evenements.push({ cle: "crue", depuis: 30, jusqua: 40, routes: { "plaine-est": "coupee" } });
  const r = L.simulerJour(coupe, C, constant(0.999), 31, {}).monde;
  assert.equal(r.hordes[0].region, "port-gris");
});

test("pillage : les autres prennent, jamais rien ne revient, plus vite en panique", () => {
  const m = L.creerMonde(C, "p");
  const p = L.simulerJour(m, C, constant(0.5), 3, {}).monde.regions["port-gris"].pillage.nourriture;
  const s = L.simulerJour(m, C, constant(0.5), 30, {}).monde.regions["port-gris"].pillage.nourriture;
  assert.ok(p < s && s < 600);
  assert.equal(600 - p, Math.floor(600 * (0.08 + 2 * 0.004) + 0.5));
});

test("météo : un cyclone seulement en saison des pluies, avec pré-alerte, orange, rouge", () => {
  const m = L.creerMonde(C, "cy");
  const r1 = L.simulerJour(m, C, constant(0), 10, { region: "port-gris" });
  assert.equal(r1.monde.cyclone.alerte, "pre-alerte");
  assert.ok(r1.faits.some(f => f.cle === "cyclone-pre-alerte" && f.public), "la radio et le téléphone le disent");
  const r2 = L.simulerJour(r1.monde, C, constant(0.999), 11, {});
  assert.equal(r2.monde.cyclone.alerte, "orange");
  const r3 = L.simulerJour(r2.monde, C, constant(0.999), 12, {});
  assert.equal(r3.monde.cyclone.alerte, "rouge");
  assert.ok(r3.faits.some(f => f.cle === "cyclone-rouge"));
  const seche = L.creerMonde(C, "cy", { dateDepart: "2027-06-01" });
  assert.equal(L.simulerJour(seche, C, constant(0), 10, {}).monde.cyclone, null);
});

test("fortes pluies : routes coupées selon `coupure`, pistes et sentiers difficiles, puis rouvertes", () => {
  const m = L.creerMonde(C, "pl");
  const r = L.simulerJour(m, C, constant(0), 5, {}).monde;
  assert.equal(r.regions["hauts-verts"].routes["cirque-perdu"], "coupee", "le sentier du cirque (éboulement)");
  assert.equal(r.regions["cirque-perdu"].routes["hauts-verts"], "coupee", "symétrique");
  const ensuite = L.simulerJour(r, C, constant(0.999), 9, {}).monde;
  assert.equal(ensuite.regions["hauts-verts"].routes["cirque-perdu"], "ouverte");
});

test("menaces : grandissent avec la visibilité et le bruit", () => {
  const m = L.creerMonde(C, "men");
  m.regions["port-gris"].infestation = 4;
  m.regions["port-gris"].factions.recuperateurs = 3;
  m.hordes = [{ id: "h1", region: "port-gris", taille: 2, cap: null, depuis: 1 }];
  const compte = (vis, bruit) => {
    let n = 0;
    for (let i = 0; i < 400; i++) n += L.tirerMenaces(m, C, L.creerHasard(`m${i}`), { region: "port-gris", jour: 30, visibilite: vis, bruit }).filter(x => x.type !== "accident").length;
    return n;
  };
  const discret = compte(0, 0), voyant = compte(8, 0), bruyant = compte(0, 10);
  assert.ok(voyant > discret * 1.3, `${voyant} > ${discret}`);
  assert.ok(bruyant > discret, `${bruyant} > ${discret}`);
  const tout = L.tirerMenaces(m, C, constant(0), { region: "port-gris", jour: 30, visibilite: 5 });
  assert.ok(tout.length <= 2);
  assert.equal(tout[0].type, "bande");
  assert.equal(tout[0].force, Math.ceil(1.5 * 3) + 1);
});

test("abris abandonnés : gardés avec leurs installations, occupés par une faction ou abîmés", () => {
  let m = L.creerMonde(C, "ab");
  m = L.abandonnerAbri(m, "port-gris", { site: "port-immeuble", installations: [{ cle: "palissade", niveau: 1, etat: 0 }], jour: 3 });
  assert.equal(m.regions["port-gris"].abrisAbandonnes.length, 1);
  const occupe = L.simulerJour(m, C, constant(0), 30, {}).monde;
  assert.equal(occupe.regions["port-gris"].abrisAbandonnes[0].occupe, "recuperateurs");
  const seul = structuredClone(m);
  seul.regions["port-gris"].factions = {};
  const abime = L.simulerJour(seul, C, constant(0), 30, {}).monde;
  assert.equal(abime.regions["port-gris"].abrisAbandonnes[0].installations[0].etat, 1);
  const repris = L.reprendreAbri(m, "port-gris", "port-immeuble");
  assert.equal(repris.abandonne.installations[0].cle, "palissade");
  assert.equal(repris.monde.regions["port-gris"].abrisAbandonnes.length, 0);
});

// ------------------------------------------------------------------ renseignements
test("renseignements : bandes, sources, âge, comparaison connu / réel", () => {
  assert.deepEqual([0, 0.99, 1, 2.49, 2.5, 3.99, 4, 5].map(L.bandeInfestation),
    ["calme", "calme", "presente", "presente", "dense", "dense", "grouillante", "grouillante"]);
  assert.equal(L.bandePillage({ nourriture: 80 }, { nourriture: 100 }), "intact");
  assert.equal(L.bandePillage({ nourriture: 50 }, { nourriture: 100 }), "entame");
  assert.equal(L.bandePillage({ nourriture: 10 }, { nourriture: 100 }), "maigre");
  assert.equal(L.bandePillage({ nourriture: 9 }, { nourriture: 100 }), "vide");
  let m = L.creerMonde(C, "ren");
  let r = L.renseignementsInitiaux(C, { region: "port-gris", monde: m });
  assert.equal(r["port-gris"].vu, 0);
  assert.equal(r["port-gris"].pillage, "intact");
  assert.equal(r["hauts-verts"].infestation, "inconnue");
  r = L.observer(r, m, C, "hauts-verts", 5, "radio");
  assert.equal(r["hauts-verts"].source, "radio");
  assert.equal(r["hauts-verts"].pillage, "inconnu", "la radio ne dit pas le pillage");
  assert.equal(L.ageRenseignement(r["hauts-verts"], 12), 7);
  assert.deepEqual(L.vieillir(r, 10)["cirque-perdu"], null);
  m = structuredClone(m);
  m.regions["port-gris"].infestation = 4.5;
  const ecarts = L.comparer(r["port-gris"], m, C, "port-gris", 20);
  assert.ok(ecarts.some(e => e.champ === "infestation" && e.reel === "grouillante"));
  const corrige = L.renseigner(r, "cirque-perdu", { infestation: "calme", notes: "selon un berger" }, 9);
  assert.equal(corrige["cirque-perdu"].vu, 9);
  assert.equal(corrige["cirque-perdu"].source, "rumeur");
});

test("factions : une région vide les affaiblit, mais pas sous 0,5 dans leurs régions de départ (2026-11-05)", () => {
  const m = L.creerMonde(C, "plancher");
  const R = L.REGLES_MONDE.faction;
  for (const reg of Object.values(m.regions)) for (const res of Object.keys(reg.pillage)) reg.pillage[res] = 0;   // l'île est vide
  m.regions["port-gris"].factions = { recuperateurs: 0.52 };    // région de départ des récupérateurs (force 2) : plancher 0,5
  m.regions["cote-ouest"].factions = { recuperateurs: 0.52 };   // pas une région de départ : rien ne les retient
  const sans = { ...C, evenements: [] };
  let monde = m;
  for (let j = 61; j <= 120; j++) monde = L.simulerJour(monde, sans, L.hasardDuJour("plancher", j), j, {}).monde;
  assert.equal(monde.regions["port-gris"].factions.recuperateurs, R.plancher, "au plancher dans sa région de départ");
  assert.equal(monde.regions["cote-ouest"].factions.recuperateurs, undefined, "éteinte ailleurs");
  // Une force de départ plus basse que 0,5 reste son plancher ; au-dessus, le déclin habituel.
  m.regions["port-gris"].factions = { recuperateurs: 2 };
  const r = L.simulerJour(m, sans, L.hasardDuJour("plancher", 61), 61, {}).monde;
  assert.ok(r.regions["port-gris"].factions.recuperateurs < 2 && r.regions["port-gris"].factions.recuperateurs >= 1.69, "déclin de 0,01 (ou essaimage)");
});
