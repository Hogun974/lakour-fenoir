// Les effets `abri` des événements du contenu (§2.6, ajouts du 2026-11-05) : un événement de type « abri » arrive à l'abri du
// groupe (sans abri, il n'est pas tiré) ; tout événement tombé dans la région de l'abri y porte ses `effets.abri` ; avancer en
// applique les effets simples (stocks perdus, jamais sous 0 ; dégâts) avec un fait localisé, et rend au MJ le reste (moral,
// blessures, trouvailles), à raconter, sans effet automatique. Avant la correction, ces effets n'étaient jamais appliqués et
// un événement « abri » tombait dans une région au hasard.   Lancer : npm run essais
import { test } from "node:test";
import assert from "node:assert/strict";
import { L, contenuMini, constant } from "./doublures/survie-outils.mjs";

const ev = (cle, type, effets, extra = {}) => ({ cle, nom: cle, type, phases: [], zones: [], saisons: [], poids: 1, public: false, texte: `<p>${cle}</p>`, effets, ...extra });
// Un contenu d'essai dont les seuls événements sont ceux donnés.
const avecEvenements = evenements => ({ ...contenuMini(), evenements });
const ABRI = { region: "hauts-verts", visibilite: 0, bruit: 0, defense: 0 };

test("simulerJour : un événement « abri » arrive à l'abri du groupe et porte ses effets ; sans abri, il n'est pas tiré", () => {
  const C = avecEvenements([ev("fuite-test", "abri", { abri: { stocks: { eau: -10 } } })]);
  const m = L.creerMonde(C, "ev-abri");
  const avec = L.simulerJour(m, C, constant(0), 10, { region: "port-gris", abri: ABRI });
  const f = avec.faits.find(x => x.cle === "fuite-test");
  assert.ok(f, "l'événement est tiré");
  assert.equal(f.region, "hauts-verts", "dans la région de l'abri, pas au hasard");
  assert.deepEqual(f.effetsAbri, { stocks: { eau: -10 } });
  const sans = L.simulerJour(m, C, constant(0), 10, { region: "port-gris" });
  assert.ok(!sans.faits.some(x => x.cle === "fuite-test"), "sans abri, pas d'événement d'abri");
});

test("simulerJour : un événement régional porte ses effets `abri` seulement s'il tombe dans la région de l'abri", () => {
  const C = avecEvenements([ev("secheresse-test", "meteo", { duree: 2, abri: { stocks: { eau: -5 } } }, { zones: ["hauts"] })]);
  const m = L.creerMonde(C, "ev-region");
  const chez = L.simulerJour(m, C, constant(0), 10, { region: "hauts-verts", abri: ABRI }).faits.find(x => x.cle === "secheresse-test");
  assert.equal(chez.region, "hauts-verts");
  assert.deepEqual(chez.effetsAbri, { stocks: { eau: -5 } });
  const ailleurs = L.simulerJour(m, C, constant(0), 10, { region: "port-gris", abri: { ...ABRI, region: "port-gris" } }).faits.find(x => x.cle === "secheresse-test");
  assert.equal(ailleurs.region, "hauts-verts");
  assert.equal(ailleurs.effetsAbri, undefined, "loin de l'abri : rien à appliquer");
});

test("subirEvenementAbri : stocks perdus jamais sous 0, dégâts appliqués ; moral, blessure, trouvailles à raconter", () => {
  const abri = { site: "hauts-ferme", region: "hauts-verts", stocks: { eau: 3, nourriture: 20 }, degats: 1 };
  const r = L.subirEvenementAbri(abri, { stocks: { eau: -10, nourriture: -6, graines: -2 }, degats: 2, moral: -1, blessure: 1, decouverte: { medicaments: 8 } }, "Fuite");
  assert.equal(r.abri.stocks.eau, 0, "pas sous 0");
  assert.equal(r.abri.stocks.nourriture, 14);
  assert.deepEqual(r.pertes, { eau: 3, nourriture: 6 }, "ce qui a vraiment été perdu (rien à perdre en graines)");
  assert.equal(r.abri.degats, 3);
  assert.deepEqual(abri.stocks, { eau: 3, nourriture: 20 }, "l'entrée n'est pas modifiée");
  assert.deepEqual(r.messages.map(m => m.cle), ["abri-evenement-pertes", "abri-evenement-degats"]);
  assert.deepEqual(r.messages[0].params, { nom: "Fuite", pertes: { eau: 3, nourriture: 6 } });
  assert.deepEqual(r.recits.map(m => m.cle), ["abri-a-raconter-moral", "abri-a-raconter-blessure", "abri-a-raconter-decouverte"]);
  assert.deepEqual(r.recits.map(m => m.params), [{ nom: "Fuite", moral: "-1" }, { nom: "Fuite", n: 1 }, { nom: "Fuite", decouverte: { medicaments: 8 } }]);
  for (const m of [...r.messages, ...r.recits]) assert.ok(L.CLES_TEXTES.includes(m.cle) && m.texte.startsWith("Fuite"), m.cle);
  const rien = L.subirEvenementAbri(abri, { moral: 0 }, "Réfugiés");
  assert.deepEqual([rien.messages, rien.recits, rien.abri.stocks], [[], [], abri.stocks]);
});

// Deux parties identiques (même graine), l'une avec l'événement, l'autre avec le même événement sans effets : au jour où il
// tombe, l'écart de stocks est l'effet appliqué.
function jusquAuFait(evenement, { jours = 80, stocks = { eau: 40, nourriture: 60 } } = {}) {
  const C = avecEvenements([evenement]);
  const T = avecEvenements([{ ...evenement, effets: {} }]);
  const depart = contenu => {
    const { monde, etat } = L.demarrerPartie({ contenu, graine: "ev-avancer", region: "hauts-verts", membres: ["a", "b"] });
    const ins = L.installerAbri(monde, contenu, { site: "hauts-ferme", jour: 0 });
    return { etat: { ...etat, groupe: { ...etat.groupe, abri: "abri" } }, monde: ins.monde, abri: { id: "abri", system: { ...ins.abri, stocks: { ...ins.abri.stocks, ...stocks } }, installations: ins.installations },
      survivants: [{ id: "a", nom: "Ana", system: L.survivantNeuf({}) }, { id: "b", nom: "Bao", system: L.survivantNeuf({}) }] };
  };
  let a = depart(C), t = depart(T);
  for (let j = 1; j <= jours; j++) {
    const ra = L.avancer({ etat: a.etat, monde: a.monde, contenu: C, quarts: 4, survivants: a.survivants, abri: a.abri });
    const rt = L.avancer({ etat: t.etat, monde: t.monde, contenu: T, quarts: 4, survivants: t.survivants, abri: t.abri });
    if ([...ra.faits, ...ra.secrets].some(f => f.cle === evenement.cle)) return { ra, rt, jour: j };
    const suite = (x, r) => ({ etat: r.etat, monde: r.monde, abri: r.acteurs.abri,
      survivants: x.survivants.map(s => ({ ...s, system: r.acteurs.survivants.find(c => c.id === s.id)?.system ?? s.system })) });
    a = suite(a, ra); t = suite(t, rt);
  }
  return null;
}

test("avancer : la fuite de citerne fait perdre 10 eau à l'abri, avec un fait public localisé (le groupe est à l'abri)", () => {
  const r = jusquAuFait(ev("fuite-test", "abri", { abri: { stocks: { eau: -10 } } }));
  assert.ok(r, "l'événement finit par tomber");
  const eauA = r.ra.acteurs.abri.system.stocks.eau, eauT = r.rt.acteurs.abri.system.stocks.eau;
  assert.ok(eauT >= 10, `assez d'eau pour mesurer (${eauT})`);
  assert.equal(eauT - eauA, 10, `jour ${r.jour} : ${eauT} sans l'effet, ${eauA} avec`);
  const f = r.ra.faits.find(x => x.cle === "abri-evenement-pertes");
  assert.ok(f, "un fait localisé");
  assert.deepEqual(f.params, { nom: "fuite-test", pertes: { eau: 10 } });
  assert.equal(f.public, true);
  assert.ok(r.ra.etat.journal.some(e => e.cle === "abri-evenement-pertes"), "au journal public");
});

test("avancer : la dispute au camp est rendue au MJ, à raconter, sans toucher au moral", () => {
  const r = jusquAuFait(ev("dispute-test", "abri", { abri: { moral: -1 } }));
  assert.ok(r, "l'événement finit par tomber");
  assert.deepEqual(r.ra.aRaconter.map(x => [x.cle, x.evenement, x.params.moral]), [["abri-a-raconter-moral", "dispute-test", "-1"]]);
  assert.ok(r.ra.secrets.some(x => x.cle === "abri-a-raconter-moral" && x.public === false), "fait secret, au MJ");
  assert.ok(r.ra.monde.journalSecret.some(x => x.cle === "abri-a-raconter-moral"), "au journal secret");
  assert.deepEqual(r.ra.acteurs.survivants.map(s => s.system.moral), r.rt.acteurs.survivants.map(s => s.system.moral), "moral inchangé");
  assert.deepEqual(r.ra.acteurs.abri.system.stocks, r.rt.acteurs.abri.system.stocks);
});

test("le vrai contenu : chaque événement « abri » a des effets que la logique sait appliquer ou rendre au MJ", async () => {
  const { chargerContenu } = await import("./outils/simuler-parties.mjs");
  const C = chargerContenu();
  const abris = C.evenements.filter(e => e.type === "abri");
  assert.ok(abris.length >= 4, `${abris.length} événements d'abri`);
  for (const e of abris) {
    const r = L.subirEvenementAbri({ stocks: { eau: 50, nourriture: 50 } }, e.effets?.abri ?? {}, e.nom);
    assert.ok(r.messages.length + r.recits.length > 0, `${e.cle} : un effet appliqué ou à raconter`);
  }
  const fuite = L.subirEvenementAbri({ stocks: { eau: 50 } }, C.evenements.find(e => e.cle === "fuite-de-citerne").effets.abri, "Fuite de citerne");
  assert.equal(fuite.abri.stocks.eau, 40);
  const rats = L.subirEvenementAbri({ stocks: { nourriture: 50 } }, C.evenements.find(e => e.cle === "rats-dans-les-reserves").effets.abri, "Rats");
  assert.equal(rats.abri.stocks.nourriture, 44);
});
