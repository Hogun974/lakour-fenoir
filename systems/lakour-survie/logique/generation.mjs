// Création des survivants « à la RimWorld », recrues et tâches du jour (contrat §10). Logique pure.
//
// Contenu (§10.4, formes retenues) :
// - enfance : { cle, nom, competences: { cle: ±n }, savoirs, incapacites, equipement, histoire: [phrase], poids } ;
// - passé (§3.4 enrichi) : { cle, nom, competences: { cle: ±n }, savoirs, incapacites, equipement, histoire, poids, ageMin } ;
// - trait : { cle, nom, effets: { competences, moral, fatigue, peur: { lieux, malus, moral }, besoins: { eau, nourriture },
//   taches: { tache: ±n }, social: { max, moral }, special }, incompatibles: [cle], poids } ;
// - facultatifs : noms [String] (prénoms sans genre connu), prenomsF, prenomsM, prenomsMixtes [String], proches [String],
//   raisonsRecrue [String], prixRecrue [String].
// - genre : une enfance ou un passé au libellé genré porte `genre: "f" | "m"` (vide = neutre) et, si le libellé a une forme
//   pour l'autre genre, `nomAutre` (« Agricultrice des Hauts » / « Agriculteur des Hauts »). Le générateur choisit d'abord
//   l'enfance puis un passé du même genre (ou neutre), en déduit le genre du survivant, puis tire un prénom de ce genre.
//   Sous verrous contradictoires (nom gardé d'un genre connu, enfance et passé gardés de genres opposés), le genre du nom
//   gagne, sinon celui du passé ; l'élément qui contredit est affiché par nomAccorde (contenu.mjs) sous son `nomAutre` et
//   ses phrases d'histoire (genrées) ne vont pas dans la graine.
//
// Nombres retenus :
// - Âge 16 à 75 (le plus souvent 20 à 50). Dès 45 ans : +1 à une compétence déjà apprise, −1 en endurance ; dès 60 ans : −2.
// - Traits : 1 (40 %), 2 (40 %) ou 3 (20 %), jamais deux incompatibles (dans un sens ou dans l'autre).
// - Passions : 1 ou 2, tirées avec un poids (niveau + 1) × (1 + préférence) ; la première est une vraie passion (2) une fois
//   sur deux, sinon un intérêt (1).
// - Budget d'un humain de départ (statut « joueur ») : somme des niveaux entre 10 et 16 (réglage `budget`) ; au-dessus on
//   retire aux plus fortes, en dessous on ajoute aux compétences préférées puis aux passions.
// - Recrues : les enfances, passés, traits et passions sont pondérés par 1 + Σ préférence × modificateur, où la préférence
//   vient du profil recherché par besoinsDuGroupe (manquant 3, faible 1,5, urgence +2) : le hasard reste, mais penche.
//   Puis, pour chaque compétence manquante du groupe qu'elle n'a pas (et peut avoir), une chance sur deux de l'avoir au
//   niveau 2 (RECRUE_MANQUE, 2026-11-05).
// - Recrutement : test de parole, normale ; méfiante difficile, hostile extrême, amicale facile ; un cran plus facile si la
//   recrue comble un manque du groupe.
// - Tâches (§10.3) : production des installations à bras × 0,5 sans personne, × 0,75 sous le niveau requis, × 1 au niveau,
//   + 10 % par niveau au-dessus, + 10 % avec la passion (moyenne sur les places). Une tâche tenue 7 jours d'affilée donne une
//   marque (× passion, bonus des jeunes). Passion (2) : +1 moral le jour où on la pratique, −1 après 7 jours sans.
//   Enseigner : une marque par jour à l'élève si le maître a 2 niveaux de plus.
// - Une recrue dont le moral reste à 0 trois jours de suite s'en va.
import { COMPETENCES, NIVEAU_MAX, borner } from "./constantes.mjs";
import { entier, tirerPoids, choisir, chance } from "./hasard.mjs";
import { liste, indexer, installationDe, siteDe, genreDe, GENRES } from "./contenu.mjs";
import { survivantNeuf, peutAgir } from "./survivant.mjs";
import { resoudreTest } from "./des.mjs";
import { message } from "./textes.mjs";

export const TACHES = {
  garde: "vigilance", cultures: "survie", elevage: "survie", chantier: "bricolage", atelier: "bricolage", cuisine: "survie",
  soins: "soins", eau: "survie", peche: "survie", chasse: "survie", fouille: "discretion", repos: null, enseigner: null
};
export const BUDGET_DEPART = [10, 16];
export const STATUTS = ["joueur", "compagnon", "recrue", "pnj"];
export const JOURS_MARQUE_TACHE = 7;
export const JOURS_SANS_PASSION = 7;
export const JOURS_DEPART_RECRUE = 3;

// Textes par défaut quand le contenu n'en donne pas (proches, raisonsRecrue, prixRecrue) : français, avec leur clé de traduction
// (textes.mjs : proche-n, recrue-raison-n, recrue-prix-n). Chacun est rendu comme les faits, en message { cle, params, texte }
// (procheMessage, raisonMessage, prixMessage) que la couche Foundry affiche dans la langue de chacun ; procheCle, raisonCle et
// prixCle restent pour les anciens appelants. Une liste du contenu peut donner des chaînes (déjà dans la langue du module de
// contenu, lakour-fenoir ou lakour-fenoir-en) ou des { cle, texte } (clé de LAKOUR_SURVIE.Faits, texte de repli).
const PROCHES = ["cherche sa sœur, restée à l'hôpital", "a perdu son père le premier soir", "attend des nouvelles de son fils, parti à la pêche",
  "a laissé sa grand-mère dans les Hauts", "ne sait pas où est sa compagne"];
const RAISONS = ["son groupe a été dispersé", "fuit une bande", "cherche un endroit où dormir", "a entendu la radio", "suit la route depuis des jours"];
const PRIX = ["demande une part égale des stocks", "veut qu'on aide à retrouver un proche", "se méfie de tout le monde", "a un trait difficile", "boit quand il peut"];
// Un texte d'une liste du contenu (chaînes ou { texte | cle }), sinon d'une liste par défaut avec sa clé.
// -> { texte, cle, message: { cle, params, texte } }
function tirerTexte(contenu, famille, defauts, prefixe, hasard) {
  const l = liste(contenu?.[famille]).map(x => (typeof x === "string" ? { texte: x, cle: "" } : { texte: String(x.texte ?? x.cle ?? ""), cle: String(x.cle ?? "") }));
  if (l.length) { const x = choisir(l, hasard); return { ...x, message: message(x.cle, {}, x.texte) }; }
  const i = Math.floor(hasard() * defauts.length) % defauts.length;
  const cle = `${prefixe}-${i + 1}`;
  return { texte: defauts[i], cle, message: message(cle, {}, defauts[i]) };
}

const ajouter = (a, b, k = 1) => { for (const [c, n] of Object.entries(b ?? {})) a[c] = (a[c] ?? 0) + k * (Number(n) || 0); return a; };
const union = (...l) => [...new Set(l.flat().filter(Boolean))];
const prefPour = (mods, favoriser) => 1 + Object.entries(mods ?? {}).reduce((s, [c, n]) => s + (Number(favoriser?.[c]) || 0) * Math.max(0, Number(n) || 0), 0);
const tirerFavorise = (options, favoriser, hasard, modsDe = o => o.competences) =>
  tirerPoids(options.map(o => ({ ...o, poids: Number(o.poids ?? 1) * prefPour(modsDe(o), favoriser) })), hasard);

// Traits compatibles avec ceux déjà pris.
export function compatibles(trait, pris, parCle) {
  return pris.every(c => c !== trait.cle && !(trait.incompatibles ?? []).includes(c) && !(parCle.get(c)?.incompatibles ?? []).includes(trait.cle));
}

// Les prénoms du contenu par genre : { f, m, mixtes } (noms : sans genre connu, rangés avec les mixtes).
const texteDe = n => String(n?.nom ?? n?.cle ?? n ?? "").trim();
export function prenomsDe(contenu) {
  const l = f => liste(contenu?.[f]).map(texteDe).filter(Boolean);
  return { f: l("prenomsF"), m: l("prenomsM"), mixtes: [...l("prenomsMixtes"), ...l("noms")] };
}
// Le genre d'un prénom (ou d'un nom complet) d'après les listes du contenu : "f", "m" ou "" (inconnu, mixte).
export function genreDuNom(contenu, nom) {
  const n = String(nom ?? "").trim().toLowerCase();
  if (!n) return "";
  const p = prenomsDe(contenu);
  const premier = s => s.toLowerCase().split(/\s+/)[0];
  for (const essai of [s => s.toLowerCase() === n, s => premier(s) === premier(n)]) {
    const f = p.f.some(essai), m = p.m.some(essai);
    if (f !== m) return f ? "f" : "m";
    if (f && m) return "";
  }
  return "";
}

// Un survivant tiré au sort. options : { age, enfance, passe, traits, region, statut, nom, genre, verrous: { … mêmes clés },
// favoriser: { competence: poids }, budget: [min, max] | null (défaut : BUDGET_DEPART pour un joueur, aucun sinon) }
// -> system complet (survivantNeuf + enfance, passe, passions, traits, incapacites, statut, tache, histoire, age, nom, genre, equipement)
export function genererSurvivant(contenu, hasard = Math.random, options = {}) {
  const v = { ...(options.verrous ?? {}), ...Object.fromEntries(Object.entries(options).filter(([k, x]) => ["age", "enfance", "passe", "traits", "nom", "genre"].includes(k) && x !== undefined)) };
  const idx = indexer(contenu);
  const fav = options.favoriser ?? {};
  const statut = options.statut ?? "joueur";
  const age = v.age ?? (chance(0.8, hasard) ? entier(20, 50, hasard) : choisir([entier(16, 19, hasard), entier(51, 75, hasard)], hasard));
  // Enfance, puis passé du même genre (ou neutre) ; le genre d'un nom gardé l'emporte sur les deux.
  const nomGarde = String(v.nom ?? "").trim();
  const genreVoulu = genreDe({ genre: v.genre }) || (nomGarde ? genreDuNom(contenu, nomGarde) : "");
  const compatible = (o, g) => !g || !genreDe(o) || genreDe(o) === g;
  const choisirParmi = (tous, g) => { const l = tous.filter(o => compatible(o, g)); return tirerFavorise(l.length ? l : tous, fav, hasard) ?? null; };
  const enfance = idx.enfances.get(v.enfance) ?? choisirParmi([...idx.enfances.values()], genreVoulu);
  const passesAge = [...idx.passes.values()].filter(p => !(Number(p.ageMin) > age));
  const passe = idx.passes.get(v.passe) ?? choisirParmi(passesAge.length ? passesAge : [...idx.passes.values()], genreVoulu || genreDe(enfance));
  let genre = genreVoulu || genreDe(passe) || genreDe(enfance);
  // Prénom du genre du survivant ; sans genre, un prénom quelconque donne le sien (un prénom mixte laisse le genre vide).
  let nom = nomGarde;
  if (!nom) {
    const p = prenomsDe(contenu);
    const candidats = genre ? [...p[genre], ...p.mixtes] : [...p.f, ...p.m, ...p.mixtes];
    nom = candidats.length ? choisir(candidats, hasard) : "";
    if (!genre && nom) genre = p.f.includes(nom) && !p.m.includes(nom) ? "f" : p.m.includes(nom) && !p.f.includes(nom) ? "m" : "";
  }
  // Les phrases d'histoire d'un élément pris dans l'autre genre (verrous contradictoires) sont genrées : on les laisse de côté.
  const phrasesDe = o => (compatible(o, genre) ? o?.histoire ?? [] : []);
  // Traits.
  let traits = Array.isArray(v.traits) ? v.traits.filter(t => idx.traits.has(t)) : [];
  if (!Array.isArray(v.traits)) {
    const n = tirerPoids([[1, 40], [2, 40], [3, 20]], hasard);
    for (let k = 0; k < n; k++) {
      const possibles = [...idx.traits.values()].filter(t => compatibles(t, traits, idx.traits));
      const t = tirerFavorise(possibles, fav, hasard, o => o.effets?.competences);
      if (!t) break;
      traits.push(t.cle);
    }
  }
  const defsTraits = traits.map(t => idx.traits.get(t));
  // Compétences.
  const mods = {};
  ajouter(mods, enfance?.competences);
  ajouter(mods, passe?.competences);
  for (const t of defsTraits) ajouter(mods, t?.effets?.competences);
  const niveaux = Object.fromEntries(COMPETENCES.map(c => [c, borner(mods[c] ?? 0, 0, NIVEAU_MAX)]));
  if (age >= 45) {
    const apprises = COMPETENCES.filter(c => c !== "endurance" && niveaux[c] > 0 && niveaux[c] < NIVEAU_MAX);
    const c = choisir(apprises, hasard);
    if (c) niveaux[c] += 1;
    niveaux.endurance = Math.max(0, niveaux.endurance - (age >= 60 ? 2 : 1));
  }
  // Passions.
  const passions = Object.fromEntries(COMPETENCES.map(c => [c, 0]));
  const nPassions = chance(0.5, hasard) ? 2 : 1;
  for (let k = 0; k < nPassions; k++) {
    const c = tirerPoids(COMPETENCES.filter(x => !passions[x]).map(x => [x, (niveaux[x] + 1) * (1 + (Number(fav[x]) || 0))]), hasard);
    if (c) passions[c] = k === 0 && chance(0.5, hasard) ? 2 : 1;
  }
  // Budget.
  const budget = options.budget === undefined ? (statut === "joueur" ? BUDGET_DEPART : null) : options.budget;
  if (budget) {
    const somme = () => COMPETENCES.reduce((s, c) => s + niveaux[c], 0);
    let garde = 0;
    while (somme() > budget[1] && garde++ < 100) {
      const max = Math.max(...COMPETENCES.map(c => niveaux[c]));
      const c = choisir(COMPETENCES.filter(x => niveaux[x] === max), hasard);
      niveaux[c] -= 1;
    }
    while (somme() < budget[0] && garde++ < 200) {
      const c = tirerPoids(COMPETENCES.filter(x => niveaux[x] < NIVEAU_MAX).map(x => [x, 1 + 2 * (Number(fav[x]) || 0) + 2 * passions[x]]), hasard);
      if (!c) break;
      niveaux[c] += 1;
    }
  }
  const competences = Object.fromEntries(COMPETENCES.map(c => [c, { niveau: niveaux[c], marques: 0 }]));
  const incapacites = union(enfance?.incapacites ?? [], passe?.incapacites ?? [], ...defsTraits.map(t => t?.incapacites ?? t?.effets?.incapacites ?? []));
  const proche = tirerTexte(contenu, "proches", PROCHES, "proche", hasard);
  return survivantNeuf({
    nom, genre: GENRES.includes(genre) ? genre : "",
    age, enfance: enfance?.cle ?? "", passe: passe?.cle ?? "", passions, traits, incapacites, statut, tache: "repos",
    competences,
    savoirs: union(enfance?.savoirs ?? [], passe?.savoirs ?? []),
    equipement: union(enfance?.equipement ?? [], passe?.equipement ?? []),
    histoire: {
      journal: "",
      graine: {
        phrases: [...phrasesDe(enfance), ...phrasesDe(passe)],
        region: options.region ?? "", age, proche: proche.texte, procheCle: proche.cle, procheMessage: proche.message
      }
    }
  });
}

// ------------------------------------------------------------------ traits et tâches
// Les effets cumulés des traits d'un survivant. -> { moral, fatigue, besoins: { eau, nourriture }, taches, peurs, social, special }
export function effetsTraits(system, contenu) {
  const idx = indexer(contenu);
  const e = { moral: 0, fatigue: 0, besoins: { eau: 1, nourriture: 1 }, taches: {}, peurs: [], social: [], special: [] };
  for (const cle of system?.traits ?? []) {
    const t = idx.traits.get(cle)?.effets ?? {};
    e.moral += Number(t.moral) || 0;
    e.fatigue += Number(t.fatigue) || 0;
    for (const r of ["eau", "nourriture"]) if (t.besoins?.[r] !== undefined) e.besoins[r] *= Number(t.besoins[r]);
    ajouter(e.taches, t.taches);
    if (t.peur) e.peurs.push({ lieux: t.peur.lieux ?? [], malus: Number(t.peur.malus) || 0, moral: Number(t.peur.moral) || 0 });
    if (t.social) e.social.push({ max: Number(t.social.max) || Infinity, moral: Number(t.social.moral) || 0 });
    if (t.special) e.special.push(t.special);
  }
  return e;
}

// Les « lieux » de l'abri pour les peurs : type du site et installations en service (clé et catégorie).
export function lieuxAbri(abri, contenu) {
  const s = siteDe(contenu, abri?.system?.site ?? abri?.site);
  const lieux = s?.type ? [s.type] : [];
  for (const i of abri?.installations ?? []) if (Number(i.niveau) >= 1) lieux.push(i.cle, installationDe(contenu, i.cle)?.categorie);
  return union(lieux);
}

// Malus et bonus de dés venus des traits pour une tâche ou dans un lieu. -> { malus, bonus }
export function modificateursTraits(system, contenu, { tache = null, lieux = [] } = {}) {
  const e = effetsTraits(system, contenu);
  let malus = 0, bonus = 0;
  for (const p of e.peurs) if (p.lieux.some(l => lieux.includes(l))) malus += p.malus;
  const t = tache ? e.taches[tache] ?? 0 : 0;
  if (t > 0) bonus += t; else malus -= t;
  return { malus, bonus };
}

export const competenceDeTache = tache => TACHES[tache] ?? null;

// Le vocabulaire des incapacités du contenu (lakour-fenoir, contenu/aides.mjs#INCAPACITES) : les compétences et les tâches que
// chacune interdit. « violence » garde aussi la garde (choix de la logique, docs/survie-notes-logique.md). Une incapacité qui est
// elle-même une tâche ou une compétence interdit celle-ci.
export const INCAPACITES = {
  violence: { competences: ["combat", "tir"], taches: ["chasse", "garde"] },
  soins: { competences: ["soins"], taches: ["soins"] },
  "travaux-lourds": { competences: [], taches: ["chantier"] },
  conduite: { competences: ["conduite"], taches: [] },
  parole: { competences: ["parole"], taches: ["enseigner"] },
  cultures: { competences: [], taches: ["cultures", "elevage"] },
  nuit: { competences: [], taches: ["garde"] }
};
export const tachesInterdites = system => [...new Set((system?.incapacites ?? []).flatMap(i => [...(i in TACHES ? [i] : []), ...(INCAPACITES[i]?.taches ?? [])]))];
export const competencesInterdites = system => [...new Set((system?.incapacites ?? []).flatMap(i => INCAPACITES[i]?.competences ?? (Object.values(TACHES).includes(i) ? [i] : [])))];

export function peutFaire(system, tache) {
  if (!(tache in TACHES)) return false;
  const inc = system?.incapacites ?? [];
  if (TACHES[tache] && (inc.includes(TACHES[tache]) || competencesInterdites(system).includes(TACHES[tache]))) return false;
  return !tachesInterdites(system).includes(tache);
}

// Assigner une tâche. -> { ok, raison, motif: { cle, params, texte } | null, system }
export function assigner(system, tache, jour = 0) {
  const refus = (raison, cle, params) => ({ ok: false, raison, motif: message(cle, params, raison), system });
  if (!(tache in TACHES)) return refus(`tâche inconnue « ${tache} »`, "tache-inconnue", { tache });
  if (!peutFaire(system, tache)) return refus(`${system?.nom || "ce survivant"} ne peut pas faire : ${tache}`, "tache-interdite", { nom: system?.nom || "?", tache });
  const s = structuredClone(system);
  if (s.tache !== tache) { s.tache = tache; s.joursTache = 0; s.tacheDepuis = jour; }
  return { ok: true, raison: "", motif: null, system: s };
}

// Niveau effectif d'un travailleur pour une tâche (compétence + traits).
export function niveauTache(system, tache, contenu) {
  const c = competenceDeTache(tache);
  const base = c ? Number(system?.competences?.[c]?.niveau) || 0 : 0;
  return Math.max(0, base + (effetsTraits(system, contenu).taches[tache] ?? 0));
}

// Facteur de production d'une installation à bras ({ tache, nombre, niveau }) selon ses travailleurs [{ niveau, passion }].
export function facteurBras(bras, travailleurs = []) {
  const n = Math.max(1, Number(bras?.nombre) || 1), requis = Number(bras?.niveau ?? 1);
  const tries = [...travailleurs].sort((a, b) => b.niveau - a.niveau);
  let total = 0;
  for (let k = 0; k < n; k++) {
    const t = tries[k];
    if (!t) { total += 0.5; continue; }
    let f = t.niveau < requis ? 0.75 : 1 + 0.1 * (t.niveau - requis);
    if (Number(t.passion) >= 1) f += 0.1;
    total += f;
  }
  return total / n;
}

// Les travailleurs par tâche, pour bilanAbri (conditions.travailleurs).
export function travailleursParTache(membres, contenu) {
  const t = {};
  for (const m of membres) {
    const s = m.system ?? m;
    if (!peutAgir(s) || !s.tache || !peutFaire(s, s.tache)) continue;
    const c = competenceDeTache(s.tache);
    (t[s.tache] ??= []).push({ id: m.id, niveau: niveauTache(s, s.tache, contenu), passion: c ? Number(s.passions?.[c]) || 0 : 0 });
  }
  return t;
}

// ------------------------------------------------------------------ besoins du groupe
// membres : [{ id, system }] ; abri : { system, installations } | null ; etat : état public (région, renseignements, factions).
// -> { taches: { tache: { competence, meilleur, qui, couverture, urgence, raison } }, manques: [competence], profil: { competence: poids } }
export function besoinsDuGroupe(membres = [], abri = null, contenu = {}, etat = {}) {
  const vivants = membres.filter(m => peutAgir(m.system));
  const taches = {};
  for (const [tache, competence] of Object.entries(TACHES)) {
    if (!competence) continue;
    const capables = vivants.filter(m => peutFaire(m.system, tache));
    const meilleur = Math.max(0, ...capables.map(m => niveauTache(m.system, tache, contenu)));
    const qui = capables.find(m => niveauTache(m.system, tache, contenu) === meilleur)?.id ?? null;
    taches[tache] = { competence, meilleur, qui: meilleur > 0 ? qui : null, couverture: meilleur >= 2 ? "couvert" : meilleur === 1 ? "faible" : "manquant", urgence: false, raison: "" };
  }
  // La raison d'une urgence : en français (raison) et en message { cle, params, texte } (motif) pour la langue de chacun.
  const urgent = (tache, cle, raison) => { if (taches[tache] && taches[tache].couverture !== "couvert") { taches[tache].urgence = true; taches[tache].raison = raison; taches[tache].motif = message(cle, {}, raison); } };
  if (vivants.some(m => Number(m.system.blessures) >= 2 || (m.system.afflictions ?? []).length)) urgent("soins", "besoin-soins", "des blessés ou des malades sans soigneur");
  const ins = abri?.installations ?? [];
  if (ins.some(i => Number(i.chantier?.requis) > 0)) urgent("chantier", "besoin-chantier", "un chantier ouvert sans bricoleur");
  if (ins.some(i => installationDe(contenu, i.cle)?.categorie === "nourriture" && Number(i.niveau) >= 1)) urgent("cultures", "besoin-cultures", "des cultures sans jardinier");
  if (!vivants.some(m => m.system.tache === "garde")) urgent("garde", "besoin-garde", "personne ne garde la nuit");
  // Négocier n'est pas une tâche du jour, mais un besoin : des factions connues dans la région.
  const factions = etat?.renseignements?.[etat?.groupe?.region]?.factions ?? [];
  const parole = Math.max(0, ...vivants.map(m => Number(m.system.competences?.parole?.niveau) || 0));
  taches.negociation = { competence: "parole", meilleur: parole, qui: null, couverture: parole >= 2 ? "couvert" : parole === 1 ? "faible" : "manquant",
    urgence: factions.length > 0 && parole < 2, raison: factions.length && parole < 2 ? "des factions sans négociateur" : "",
    ...(factions.length && parole < 2 ? { motif: message("besoin-negociation", {}, "des factions sans négociateur") } : {}) };
  const profil = {};
  for (const t of Object.values(taches)) {
    const p = (t.couverture === "manquant" ? 3 : t.couverture === "faible" ? 1.5 : 0) + (t.urgence ? 2 : 0);
    if (p > 0) profil[t.competence] = Math.max(profil[t.competence] ?? 0, p);
  }
  const manques = [...new Set(Object.values(taches).filter(t => t.couverture === "manquant").map(t => t.competence))];
  return { taches, manques, profil };
}

// Répartition automatique : chaque tâche urgente puis manquante, puis faible, reçoit le meilleur membre libre et capable ;
// les autres vont à la tâche où ils sont le plus forts. -> { id: tache }
export function repartir(membres = [], besoins = { taches: {} }, contenu = {}) {
  const libres = new Map(membres.filter(m => peutAgir(m.system)).map(m => [m.id, m]));
  const sortie = {};
  const ordre = Object.entries(besoins.taches ?? {}).filter(([t]) => t in TACHES)
    .sort(([, a], [, b]) => (b.urgence - a.urgence) || (rang(b.couverture) - rang(a.couverture)));
  for (const [tache] of ordre) {
    let mieux = null;
    for (const m of libres.values()) if (peutFaire(m.system, tache) && (!mieux || niveauTache(m.system, tache, contenu) > niveauTache(mieux.system, tache, contenu))) mieux = m;
    if (mieux && niveauTache(mieux.system, tache, contenu) > 0) { sortie[mieux.id] = tache; libres.delete(mieux.id); }
  }
  for (const m of libres.values()) {
    const options = Object.keys(TACHES).filter(t => TACHES[t] && peutFaire(m.system, t));
    sortie[m.id] = options.sort((a, b) => niveauTache(m.system, b, contenu) - niveauTache(m.system, a, contenu))[0] ?? "repos";
  }
  return sortie;
}
const rang = c => ({ manquant: 2, faible: 1, couvert: 0 }[c] ?? 0);

// ------------------------------------------------------------------ recrues
// -> { survivant (system), raison, prix (français ou langue du contenu), raisonMessage, prixMessage ({ cle, params, texte }, à
//      afficher dans la langue de chacun), raisonCle, prixCle (clés seules, vides si le contenu donne des chaînes) }
// Une recrue qui se présente quand une compétence manque au groupe l'a, une fois sur deux, au niveau 2 au moins (RECRUE_MANQUE :
// pour chaque compétence manquante qu'elle n'a pas déjà, et qu'aucune incapacité ne lui interdit) : c'est souvent pour cela
// qu'elle vient. Sans cela, le profil seul ne la comblait que 16 à 37 % du temps pour la discrétion, la vigilance, les soins.
export const RECRUE_MANQUE = { chance: 0.5, niveau: 2 };
export function genererRecrue(contenu, hasard = Math.random, { besoins = null, region = "", phase = "" } = {}) {
  const survivant = genererSurvivant(contenu, hasard, { statut: "recrue", region, favoriser: besoins?.profil ?? {}, budget: null });
  const interdites = [...(survivant.incapacites ?? []), ...competencesInterdites(survivant)];
  for (const c of besoins?.manques ?? []) {
    if (!COMPETENCES.includes(c) || interdites.includes(c) || survivant.competences[c].niveau >= RECRUE_MANQUE.niveau) continue;
    if (chance(RECRUE_MANQUE.chance, hasard)) survivant.competences[c] = { ...survivant.competences[c], niveau: RECRUE_MANQUE.niveau };
  }
  const raison = tirerTexte(contenu, "raisonsRecrue", RAISONS, "recrue-raison", hasard);
  const prix = tirerTexte(contenu, "prixRecrue", PRIX, "recrue-prix", hasard);
  return { survivant, raison: raison.texte, prix: prix.texte, raisonCle: raison.cle, prixCle: prix.cle, raisonMessage: raison.message, prixMessage: prix.message, phase };
}

const CRANS = ["facile", "normale", "difficile", "extreme"];
export function difficulteRecrutement({ attitude = "neutre", combleUnManque = false } = {}) {
  let i = { amicale: 0, neutre: 1, mefiante: 2, hostile: 3 }[attitude] ?? 1;
  if (combleUnManque) i -= 1;
  return CRANS[borner(i, 0, 3)];
}

// Le test de recrutement. parleur : system du survivant qui parle. -> { reussite, test, difficulte, recrue }
export function recruter({ recrue, parleur, attitude = "neutre", besoins = null, bonus = 0, malus = 0, hasard = Math.random } = {}) {
  const combleUnManque = (besoins?.manques ?? []).some(c => Number(recrue?.competences?.[c]?.niveau) >= 2);
  const difficulte = difficulteRecrutement({ attitude, combleUnManque });
  const test = resoudreTest({ niveau: Number(parleur?.competences?.parole?.niveau) || 0, difficulte, bonus, malus, hasard });
  return { reussite: test.reussite, test, difficulte, recrue: test.reussite ? { ...structuredClone(recrue), statut: "recrue" } : null };
}

// Ajouter un survivant existant au groupe (état public). -> etat
export function ajouterMembre(etat, acteurId, statut = "compagnon") {
  if (!acteurId || etat?.groupe?.membres?.includes(acteurId)) return etat;
  return { ...etat, groupe: { ...etat.groupe, membres: [...(etat.groupe?.membres ?? []), acteurId], statuts: { ...(etat.groupe?.statuts ?? {}), [acteurId]: statut } } };
}
export function retirerMembre(etat, acteurId) {
  return { ...etat, groupe: { ...etat.groupe, membres: (etat.groupe?.membres ?? []).filter(x => x !== acteurId) } };
}
