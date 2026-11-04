// La simulation longue (contrat §8) : 200 jours avec une graine fixe et plusieurs graines, invariants du monde ; scénarios
// d'équilibre : sans rien faire en ville, autonomie dans les Hauts, épuisement d'une ville.  Lancer : npm run essais
import { test } from "node:test";
import assert from "node:assert/strict";
import { L, contenuMini, I, partie } from "./doublures/survie-outils.mjs";

const C = contenuMini();
const GRAINES = ["fenoir", "a1", "b2", "c3", "d4", "e5", "f6", "g7", "h8", "i9"];

function deuxCentsJours(graine) {
  let m = L.creerMonde(C, graine);
  const instantanes = [structuredClone(m)];
  const faits = [];
  for (let j = 1; j <= 200; j++) {
    const bruit = { "port-gris": j % 7 === 0 ? 6 : 0 };
    const r = L.simulerJour(m, C, L.hasardDuJour(graine, j), j, { region: "port-gris", bruitParRegion: bruit, abri: { region: "port-gris", visibilite: 3, bruit: 2 } });
    m = r.monde;
    faits.push(...r.faits);
    instantanes.push(m);
  }
  return { m, instantanes, faits };
}
const runs = new Map(GRAINES.map(g => [g, deuxCentsJours(g)]));

test("200 jours : rien de négatif, infestation dans [0, 5], factions dans [0, 5], hordes de taille 1 à 5", () => {
  for (const [g, { instantanes }] of runs) for (const m of instantanes) {
    for (const [cle, r] of Object.entries(m.regions)) {
      assert.ok(r.infestation >= 0 && r.infestation <= 5, `${g} ${cle} infestation ${r.infestation}`);
      for (const [res, q] of Object.entries(r.pillage)) assert.ok(q >= 0 && Number.isInteger(q), `${g} ${cle} pillage.${res} = ${q}`);
      for (const [n, q] of Object.entries(r.nature)) assert.ok(q >= 0, `${g} ${cle} nature.${n}`);
      for (const [f, q] of Object.entries(r.factions)) assert.ok(q >= 0 && q <= 5, `${g} ${cle} faction ${f}`);
    }
    for (const h of m.hordes) assert.ok(h.taille >= 1 && h.taille <= 5);
  }
});

test("200 jours : les hordes restent dans des régions existantes et ne sautent que vers des voisines", () => {
  let vues = 0;
  for (const [g, { instantanes }] of runs) {
    for (let j = 1; j < instantanes.length; j++) {
      const avant = new Map(instantanes[j - 1].hordes.map(h => [h.id, h]));
      for (const h of instantanes[j].hordes) {
        vues++;
        assert.ok(L.regionDe(C, h.region), `${g} : région inconnue ${h.region}`);
        if (h.cap) assert.ok(L.sontVoisines(C, h.region, h.cap), `${g} : cap ${h.cap} non voisin de ${h.region}`);
        const a = avant.get(h.id);
        if (a && a.region !== h.region) assert.ok(L.sontVoisines(C, a.region, h.region), `${g} J${j} : saut ${a.region} → ${h.region}`);
      }
    }
  }
  assert.ok(vues > 100, "des hordes ont bien existé");
});

test("200 jours : chaque réseau tombe dans sa fenêtre, le jour tiré", () => {
  for (const [g, { m, faits }] of runs) {
    for (const r of L.regionsDe(C)) for (const res of L.RESEAUX) {
      const f = r.infrastructures[res], jour = m.coupures[r.cle][res];
      const fait = faits.find(x => x.cle === `reseau-${res}` && x.region === r.cle);
      if (f === null) { assert.equal(jour, null); assert.equal(fait, undefined); continue; }
      assert.ok(jour >= f[0] && jour <= f[1], `${g} ${r.cle}.${res}`);
      assert.equal(fait?.jour, jour, `${g} ${r.cle}.${res} tombé au jour tiré`);
    }
  }
});

test("200 jours : après le jour 60, les Livides des Bas se décomposent ; les Hauts gardent les leurs", () => {
  for (const [g, { instantanes }] of runs) {
    const bas = L.regionsDe(C).filter(r => r.altitude < L.ALTITUDE_BAS).map(r => r.cle);
    const moyenne = (j, cles) => cles.reduce((s, c) => s + instantanes[j].regions[c].infestation, 0) / cles.length;
    assert.ok(moyenne(200, bas) < moyenne(60, bas) - 1, `${g} : Bas ${moyenne(60, bas)} → ${moyenne(200, bas)}`);
    for (const c of bas) if (instantanes[60].regions[c].infestation > 1) assert.ok(instantanes[200].regions[c].infestation < instantanes[60].regions[c].infestation, `${g} ${c}`);
    const hauts = L.regionsDe(C).filter(r => r.altitude >= L.ALTITUDE_BAS).map(r => r.cle);
    assert.ok(moyenne(200, hauts) > moyenne(200, bas), `${g} : au jour 200, les Hauts sont plus infestés que les Bas`);
  }
});

test("200 jours : les cyclones n'arrivent qu'en saison des pluies, annoncés", () => {
  let cyclones = 0;
  for (const [g, { faits }] of runs) {
    for (const f of faits.filter(x => x.cle.startsWith("cyclone-"))) {
      assert.equal(L.saisonDuJour(f.jour), "pluies", `${g} : ${f.cle} au jour ${f.jour} (${L.quand(f.jour * 4).date})`);
    }
    for (const r of faits.filter(x => x.cle === "cyclone-rouge")) {
      cyclones++;
      assert.ok(faits.some(x => x.cle === "cyclone-pre-alerte" && x.jour === r.jour - 2), `${g} : pré-alerte deux jours avant`);
      assert.ok(faits.some(x => x.cle === "cyclone-orange" && x.jour === r.jour - 1));
    }
  }
  assert.ok(cyclones >= 3, `il y a eu des cyclones sur dix graines (${cyclones})`);
});

test("200 jours : même graine, même monde ; autre graine, autre monde", () => {
  assert.deepEqual(deuxCentsJours("fenoir").m, runs.get("fenoir").m);
  assert.notDeepEqual(runs.get("a1").m, runs.get("b2").m);
});

// ------------------------------------------------------------------ équilibre
test("équilibre : sans rien faire, un groupe de 4 en ville tient une à deux semaines", () => {
  for (const graine of ["s1", "s2", "s3"]) {
    const p = partie({ site: "port-immeuble", jours: 20, graine });
    const premiere = p.historique.find(h => h.survivants.some(s => s.faim >= 1))?.jour;
    assert.ok(premiere >= 7 && premiere <= 14, `${graine} : première faim au jour ${premiere}`);
  }
});

test("scénario d'AUTONOMIE : citerne, potager, panneaux, batteries dans les Hauts — 4 personnes tiennent 120 jours sans fouiller", () => {
  const installations = [I("citerne-pluie", 2), I("potager", 3), I("panneaux-solaires", 2), I("batteries", 1), I("chambre-froide", 1)];
  for (const graine of ["s1", "s2"]) {
    const p = partie({ site: "hauts-ferme", installations, jours: 120, graine, apport: { nourriture: 120 } });
    const premier = p.historique.find(h => h.etat.autonome)?.jour;
    assert.ok(premier >= 30 && premier <= 70, `${graine} : autonome au jour ${premier}`);
    for (const h of p.historique) {
      assert.ok(h.survivants.every(s => s.vivant), `${graine} J${h.jour} : un mort`);
      assert.ok(h.survivants.every(s => s.faim < 2), `${graine} J${h.jour} : la faim`);
      assert.ok(h.survivants.every(s => s.soif < 4), `${graine} J${h.jour} : la soif`);
    }
    assert.equal(p.etat.fouilleLe, null);
    const fin = p.historique.at(-1);
    assert.ok(fin.stocks.nourriture > 20 && fin.stocks.eau > 20, `${graine} : ${JSON.stringify(fin.stocks)}`);
    assert.ok(p.historique.filter(h => h.etat.autonome).length > 60, `${graine} : autonome la plupart du temps`);
  }
});

test("scénario d'ÉPUISEMENT : sans installations, la ville et ses alentours s'épuisent, les jours de stocks tombent à 0", () => {
  const p = partie({
    site: "port-immeuble", jours: 150, graine: "epuise",
    chaqueJour(ctx, j) {
      const h = L.deriverHasard("epuise", "action", j);
      const f = L.fouiller(ctx.monde, ctx.contenu, h, { region: "port-gris", membres: 2, quarts: 1, prudence: "normal", jour: j });
      const n = L.fouiller(f.monde, ctx.contenu, h, { region: "port-gris", cible: "peche", membres: 1, quarts: 1, jour: j, abri: ctx.abri.system });
      const butin = { ...f.butin };
      for (const [r, q] of Object.entries(n.butin)) butin[r] = (butin[r] ?? 0) + q;
      ctx.monde = n.monde;
      ctx.abri = { ...ctx.abri, system: { ...n.abri, stocks: L.ajouterStocks(ctx.abri.system.stocks, butin) } };
      ctx.etat = L.noterFouille(ctx.etat, j);
      (ctx.butins ??= []).push(Object.values(butin).reduce((s, x) => s + x, 0));
      return ctx;
    }
  });
  const debut = p.butins.slice(0, 10).reduce((s, x) => s + x, 0), fin = p.butins.slice(-10).reduce((s, x) => s + x, 0);
  assert.ok(fin < debut / 3, `les fouilles rapportent de moins en moins (${debut} → ${fin})`);
  const reel = p.monde.regions["port-gris"];
  assert.ok(["maigre", "vide"].includes(L.bandePillage(reel.pillage, L.reservesDepart(L.regionDe(C, "port-gris")))), "la ville est vidée");
  assert.ok(p.abri.system.nature.peche < 10, `les alentours sont entamés (${p.abri.system.nature.peche})`);
  const aZero = p.historique.find(h => h.jour > 20 && h.bilan.joursDeStocks.nourriture === 0);
  assert.ok(aZero, "un jour, il n'y a plus rien en stock : il faut partir");
  assert.equal(p.etat.autonome, false);
});
