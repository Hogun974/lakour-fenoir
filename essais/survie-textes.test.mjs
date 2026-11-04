// Les textes de la logique pure suivent la langue de l'utilisateur (logique/textes.mjs, scripts/donnees.mjs localiser) :
// - essai statique : chaque clé que la logique peut produire (CLES_TEXTES) existe dans lang/fr.json ET lang/en.json (Faits.*), avec
//   les mêmes paramètres ; les deux langues ont les mêmes clés ;
// - tout ce que la logique rend (faits, journal, alertes, menaces, journal secret, rencontres, motifs) porte cle/params ET son
//   texte français de repli, et chaque clé produite est dans CLES_TEXTES ;
// - la couche Foundry (localiser) rend le français avec fr.json, l'anglais avec en.json, et reste lisible pour une ancienne entrée
//   à `texte` seul ou une clé inconnue ; les paramètres clés (ressource, compétence, stocks) sont rendus dans la langue.
// Aucun réseau.  Lancer : npm run essais
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { L, contenuMini, partie, constant } from "./doublures/survie-outils.mjs";

const RACINE = new URL("../", import.meta.url);
const lire = f => JSON.parse(readFileSync(new URL(`systems/lakour-survie/lang/${f}.json`, RACINE), "utf8"));
const FR = lire("fr"), EN = lire("en");
const chemin = (o, p) => p.split(".").reduce((x, k) => x?.[k], o);
const parametres = s => [...String(s).matchAll(/\{(\w+)\}/g)].map(m => m[1]).sort();
const feuilles = (o, prefixe = "") => Object.entries(o).flatMap(([k, v]) => (v && typeof v === "object" ? feuilles(v, `${prefixe}${k}.`) : [`${prefixe}${k}`]));

test("textes : chaque clé de la logique existe en français et en anglais, mêmes paramètres", () => {
  for (const cle of L.CLES_TEXTES) {
    const fr = FR.LAKOUR_SURVIE.Faits[cle], en = EN.LAKOUR_SURVIE.Faits[cle];
    assert.equal(typeof fr, "string", `fr.json : Faits.${cle} manque`);
    assert.equal(typeof en, "string", `en.json : Faits.${cle} manque`);
    assert.deepEqual(parametres(en), parametres(fr), `Faits.${cle} : paramètres différents entre les langues`);
  }
  assert.deepEqual(Object.keys(FR.LAKOUR_SURVIE.Faits).sort(), [...L.CLES_TEXTES].sort(), "fr.json : Faits = exactement les clés de la logique");
  assert.deepEqual(Object.keys(EN.LAKOUR_SURVIE.Faits).sort(), Object.keys(FR.LAKOUR_SURVIE.Faits).sort());
  assert.deepEqual(Object.keys(EN.LAKOUR_SURVIE.Creatures).sort(), Object.keys(FR.LAKOUR_SURVIE.Creatures).sort());
  assert.deepEqual(feuilles(EN).sort(), feuilles(FR).sort(), "fr.json et en.json ont les mêmes clés");
  assert.ok(/Pallid/.test(EN.LAKOUR_SURVIE.Faits["menace-livides"]) && /Grey/.test(EN.LAKOUR_SURVIE.Faits["survivant-mort-infection"]), "glossaire");
});

// Un message porte sa clé (connue), ses paramètres et son texte français.
const estMessage = (x, ou) => {
  assert.ok(x && typeof x === "object", ou);
  const cle = L.cleTexteDe(x);
  assert.ok(L.CLES_TEXTES.includes(cle), `${ou} : clé inconnue « ${cle} »`);
  assert.ok(x.params && typeof x.params === "object", `${ou} : params manquent (${cle})`);
  assert.ok(typeof x.texte === "string" && x.texte.length > 3, `${ou} : texte de repli manquant (${cle})`);
  for (const p of parametres(FR.LAKOUR_SURVIE.Faits[cle])) assert.ok(p in x.params, `${ou} : ${cle} sans paramètre {${p}}`);
};

test("textes : faits, journal, alertes, menaces et journal secret d'une longue partie portent cle/params et leur repli français", () => {
  const C = contenuMini();
  const vus = new Set();
  let faits = 0, menaces = 0;
  const p = partie({ contenu: C, site: "port-immeuble", jours: 120, graine: "textes-1", chaqueJour: (ctx, j) => {
    if (j % 9 === 3) {
      const f = L.fouiller(ctx.monde, C, constant(0.2), { region: "port-gris", membres: 2, jour: j, abri: ctx.abri.system });
      ctx.monde = f.monde;
      for (const x of f.faits) { estMessage(x, "fouille"); vus.add(L.cleTexteDe(x)); }
      if (f.rencontre) { estMessage(f.rencontre, "rencontre"); vus.add(f.rencontre.cle); }
    }
    return ctx;
  } });
  for (const h of p.historique) {
    for (const x of h.r.faits) { estMessage(x, "fait"); vus.add(L.cleTexteDe(x)); faits++; }
    for (const x of h.r.secrets) { estMessage(x, "secret"); vus.add(L.cleTexteDe(x)); }
    for (const x of h.r.alertes) { estMessage(x, "alerte"); vus.add(x.cle); }
    for (const x of h.r.menaces) { estMessage(x, "menace"); vus.add(x.cle); menaces++; }
  }
  for (const e of p.etat.journal) estMessage(e, "journal");
  for (const e of p.monde.journalSecret) estMessage(e, "journal secret");
  assert.ok(faits > 20 && menaces > 0, `assez de matière (${faits} faits, ${menaces} menaces)`);
  assert.ok(vus.has("reseau-electricite") && vus.has("horde-nait") && vus.has("menace-livides"), [...vus].join(", "));
  // Une ancienne entrée à texte seul reste admise par le journal.
  const vieux = L.ajouterJournal(p.etat, [{ quart: 1, texte: "une vieille entrée" }]);
  assert.equal(vieux.journal.at(-1).texte, "une vieille entrée");
});

test("textes : rencontres, refus et motifs portent leur clé, les textes par défaut des recrues aussi", () => {
  const C = contenuMini();
  const { monde } = L.demarrerPartie({ contenu: C, graine: "textes-2", region: "port-gris", membres: ["a"] });
  for (const type of ["livides", "humains", "animaux", "danger"]) {
    const r = L.rencontreForcee({ ...monde, regions: { ...monde.regions, "port-gris": { ...monde.regions["port-gris"], infestation: 3, factions: { recuperateurs: 2 } } } },
      C, L.creerHasard(`r-${type}`), { region: "port-gris", type, jour: 20 });
    if (r) estMessage(r, `rencontre ${type}`);
  }
  const loin = L.voyager(monde, C, constant(0.99), { de: "port-gris", vers: "port-gris" });
  estMessage(loin.motif, "voyage sur place");
  assert.equal(loin.motif.texte, loin.raison);
  const lourd = L.voyager(monde, C, constant(0.99), { de: "port-gris", vers: "plaine-est", charge: 99 });
  assert.equal(lourd.motif.cle, "voyage-trop-charge");
  assert.deepEqual(Object.keys(lourd.motif.params).sort(), ["charge", "max"]);
  const ins = L.installerAbri(monde, C, { site: "nulle-part" });
  assert.equal(ins.motif.cle, "site-inconnu");
  const tache = L.assigner(L.survivantNeuf({ nom: "Ana", incapacites: ["violence"] }), "garde");
  assert.equal(tache.motif.cle, "tache-interdite");
  assert.deepEqual(tache.motif.params, { nom: "Ana", tache: "garde" });
  const def = L.installationDe(C, "potager");
  const v = L.peutConstruire(def, 1, { stocks: {}, installations: [] }, {}, { savoirs: [] });
  assert.equal(v.ok, false);
  assert.equal(v.motifs.length, v.raisons.length);
  v.motifs.forEach((m, i) => { estMessage(m, "motif chantier"); assert.equal(m.texte, v.raisons[i]); });
  assert.ok(v.motifs.some(m => m.cle === "manque" && typeof m.params.manque === "object"));
  const fab = L.peutFabriquer({ cle: "x", cout: { materiaux: 5 }, requiert: { savoirs: ["plomberie"] } }, { stocks: {} });
  assert.deepEqual(fab.motifs.map(m => m.cle), ["savoir-manquant", "manque"]);
  const soin = L.soignerAffliction(L.survivantNeuf({}), { cle: "fracture", soin: { medicaments: 2 } }, { reussite: true }, { medicaments: 0 });
  assert.equal(soin.motif.cle, "soin-medicaments");
  const fete = L.feter({ groupe: { pnj: [] }, fetes: [] }, { system: { stocks: { nourriture: 0 } } }, { fete: "noel", annee: 2026, survivants: [{ id: "a", system: L.survivantNeuf({}) }] });
  assert.equal(fete.motif.cle, "fete-rations");
  // Recrues sans listes du contenu : la raison, le prix et le proche viennent des textes par défaut, avec leur clé.
  const sans = { ...C, proches: [], raisonsRecrue: [], prixRecrue: [] };
  const r = L.genererRecrue(sans, L.creerHasard("recrue"), {});
  assert.ok(/^recrue-raison-\d$/.test(r.raisonCle) && /^recrue-prix-\d$/.test(r.prixCle));
  assert.equal(FR.LAKOUR_SURVIE.Faits[r.raisonCle], r.raison);
  assert.equal(FR.LAKOUR_SURVIE.Faits[r.prixCle], r.prix);
  assert.equal(FR.LAKOUR_SURVIE.Faits[r.survivant.histoire.graine.procheCle], r.survivant.histoire.graine.proche);
  // Avec des listes du contenu : pas de clé, le texte du contenu.
  const avec = { ...C, raisonsRecrue: ["vient de loin"], prixRecrue: [{ texte: "veut un lit" }] };
  const r2 = L.genererRecrue(avec, L.creerHasard("recrue"), {});
  assert.deepEqual([r2.raison, r2.prix, r2.raisonCle, r2.prixCle], ["vient de loin", "veut un lit", "", ""]);
});

test("localiser (couche Foundry) : français, anglais, repli des anciennes entrées, paramètres rendus dans la langue", async () => {
  const { localiser, entreeTexte } = await import("../systems/lakour-survie/scripts/donnees.mjs");
  const avec = (langue, fn) => {
    const dict = langue === "en" ? EN : FR;
    const formater = (cle, d = {}) => { const brut = chemin(dict, cle); return typeof brut === "string" ? brut.replace(/\{(\w+)\}/g, (_, k) => d[k] ?? `{${k}}`) : cle; };
    const avant = globalThis.game;
    globalThis.game = { i18n: { localize: c => formater(c), format: formater, has: c => typeof chemin(dict, c) === "string", lang: langue } };
    try { return fn(); } finally { globalThis.game = avant; }
  };
  const horde = { cle: "horde-nait", params: { region: "Port-Gris", taille: 3 }, texte: "Une horde se forme à Port-Gris (taille 3)." };
  assert.equal(avec("fr", () => localiser(horde)), "Une horde se forme à Port-Gris (taille 3).");
  assert.equal(avec("en", () => localiser(horde)), "A horde is forming in Port-Gris (size 3).");
  // Le fait d'un événement du contenu : sa clé est celle de l'événement, le texte vient de « evenement ».
  const ev = { cle: "pillage-nuit", cleTexte: "evenement", params: { region: "Port-Gris", nom: "Pillage", texte: "Des cris." }, texte: "Port-Gris : Pillage. Des cris." };
  assert.equal(avec("en", () => localiser(ev)), "Port-Gris: Pillage. Des cris.");
  // Repli : une ancienne entrée sans clé, une clé inconnue, une chaîne.
  assert.equal(avec("en", () => localiser({ texte: "vieux texte" })), "vieux texte");
  assert.equal(avec("en", () => localiser({ cle: "inconnue-xyz", params: {}, texte: "repli" })), "repli");
  assert.equal(avec("en", () => localiser("tel quel")), "tel quel");
  assert.equal(avec("en", () => localiser(null)), "");
  // Les paramètres : stocks, ressource, compétence, créature par défaut, source d'un renseignement.
  const fouille = { cle: "fouille-region", params: { region: "Port-Gris", site: "", butin: { eau: 3, nourriture: 2 } } };
  assert.equal(avec("en", () => localiser(fouille)), "Scavenging in Port-Gris: 3 water, 2 food.");
  assert.equal(avec("fr", () => localiser({ cle: "fouille-region", params: { region: "Port-Gris", butin: {} } })), "Fouille à Port-Gris : rien.");
  assert.equal(avec("en", () => localiser({ cle: "progression", params: { nom: "Ana", competence: "bricolage", niveau: 2 } })), "Ana improves at Tinkering (level 2).");
  assert.equal(avec("en", () => localiser({ cle: "rencontre-livides", params: { nombre: 2, creature: "", creatureCle: "livide", region: "Port-Gris" } })), "2 × Pallid in Port-Gris.");
  assert.equal(avec("fr", () => localiser({ cle: "rencontre-animaux", params: { nombre: 3, creature: "", creatureCle: "chien-errant" } })), "3 × chien errant.");
  assert.equal(avec("en", () => localiser({ cle: "rencontre-animaux", params: { nombre: 3, creature: "Wild boar", creatureCle: "sanglier" } })), "3 × Wild boar.");
  assert.equal(avec("en", () => localiser({ cle: "Journal.Renseignement", params: { region: "Port-Gris", source: "radio" } })), "News from Port-Gris (radio).");
  assert.equal(avec("en", () => localiser({ cle: "manque", params: { manque: { materiaux: 4 } } })), "missing: 4 materials");
  // Ce que l'état public garde : clé, paramètres, texte de repli (le français de la logique, ou la traduction à l'écriture).
  assert.deepEqual(entreeTexte(horde), { texte: horde.texte, cle: "horde-nait", params: horde.params });
  assert.deepEqual(avec("en", () => entreeTexte({ cle: "Journal.Quitte", params: { site: "Ferme" } })), { texte: "The group leaves Ferme.", cle: "Journal.Quitte", params: { site: "Ferme" } });
  assert.deepEqual(entreeTexte("libre"), { texte: "libre" });
  assert.equal(entreeTexte(""), null);
});
