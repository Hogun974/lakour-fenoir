// L'esprit sur le corps (complément du jeu 3D, famille 2) : regard sur la catastrophe, religion ou ancrage, moral nourri par ce
// qu'on croit et par ceux qui nous entourent, faux bruits de la nuit, celui qui lâche, chance du trahi. Logique pure : chaque
// fonction rend un NOUVEL objet et la liste des événements survenus.
//
// Règle d'or : AUCUN EFFET MAGIQUE. La foi et l'ancrage agissent par le moral (le plafond où il remonte, un réconfort) ; le jeu ne
// confirme ni ne dément rien. Un personnage peut voir un signe dans un objet déposé par le cyclone ou dans sa chance : la règle ne
// le dit jamais, elle ne connaît que le moral et un dé de plus.
//
// Champs d'un survivant (contrat §14.1), tous avec une valeur par défaut neutre (une fiche d'avant ce lot ne change pas) :
// - regard : "epreuve" | "refaire" | "vivre" | "" (vide : esprit pas encore tiré ; AUCUN des effets de ce fichier ne s'applique
//   alors : `espritActif`) ;
// - religion : clé d'une religion du contenu, "aucune", "plusieurs" (religions : les clés) ou "" ; pratique : Boolean ;
// - ancrage : clé d'un ancrage du contenu (photo, carnet, routine, sport…) : ce qui fait tenir un non-croyant, au même effet ;
// - esprit : compteurs { joursSansObservance, enFaute, reconfortLe, joursBas, lacher (0..3), chance, joursSansNourriture,
//   nourri: { epreuve, refaire, vivre }, ancragePerdu, revolte, projet, joursNourris, joursFaim } (objet libre, lu par espritDe).
//
// Nombres retenus (REGLES_ESPRIT, docs/equilibre-moral.md) :
// - pratiquant : plafond du moral +1 tant que ses observances tiennent ; 3 jours sans : « en faute », −1 de moral une fois et
//   plafond −1 jusqu'à la prochaine observance tenue. Une observance « calme » se tient à l'abri, ou en route avec un
//   coreligionnaire pratiquant à côté ; un ancrage « objet » (photo, carnet) se tient tant que l'objet n'est pas perdu.
// - non-pratiquant (croyant ou ancrage) : rien chaque jour, jamais de faute ; une fois toutes les deux semaines, quand son moral
//   tombe à 0, il se raccroche à ce qui le fait tenir : +1.
// - regard : tous les deux jours où ce qui le nourrit arrive (épreuve : endurer ; refaire : bâtir ou accueillir ; vivre : un petit
//   plaisir), +1 de moral, sans dépasser le plafond (et seulement à 2 ou plus : au fond, seul le groupe retient). Une semaine
//   sans rien de ce qui le nourrit : plafond −1 (il s'éteint un peu), jusqu'au prochain jour qui le nourrit. 14 jours sans, moral à
//   2 ou moins : le regard bascule vers celui qui a été le plus nourri pendant ce temps.
// - la communauté : entente du groupe (−3..3) ; à 2 ou plus, plafond +1 pour qui n'est pas seul ; à −2 ou moins, plafond −1.
// - faux bruits : la nuit à l'abri, moral 0 : 50 %, 1 : 35 %, 2 : 20 %, moins 10 points par autre présent (au plus 3) ; celui
//   qui en entend dort mal (+1 fatigue).
// - lâcher : moral à 0, un jour de plus « au fond » (sauf si au moins 2 autres sont là et que l'entente n'est pas
//   négative : le groupe le retient) ; moral 1 ou plus : −2. Signes à 2, 4, 6 jours (mange moins : le repas ne lui rend plus de
//   moral ; parle moins :
//   −1 dé en parole ; donne ses affaires) ; à 8, un compagnon, une recrue ou un PNJ part un matin ; un joueur, jamais : le MJ
//   est prévenu.
//
// Lot 10 (2026-11-17, contrat §22, docs/equilibre-communaute.md) :
// - la liste des religions est COMMUNE au jeu 3D ; ses anciennes clés restent des alias (contenu : religion.alias ; cleReligion) ;
//   une religion double (« hindoue catholique », contenu : religion.composee) compte ses deux religions pour prier ensemble et
//   pour les fêtes (religionsDe) ;
// - changer de religion dans un lieu de culte (changerDeReligion) : pendant REGLES_ESPRIT.conversion.jours, on garde une part de
//   l'ancienne et on n'a qu'une part de la nouvelle, SEULEMENT par le moral et les observances : les deux religions comptent pour
//   prier ensemble et pour les fêtes (le bonus provisoire), l'observance la plus exigeante des deux s'impose et le plafond du
//   pratiquant ne monte pas (le malus provisoire). Quitter sa religion, ou en changer souvent, se sait (le Ladi Lafé : l'API lance
//   une rumeur vraie, marche.mjs).
import { borner } from "./constantes.mjs";
import { liste, indexer } from "./contenu.mjs";
import { tirerPoids, choisir, chance, entier } from "./hasard.mjs";
import { message } from "./textes.mjs";

export const REGARDS = ["epreuve", "refaire", "vivre"];
export const RELIGION_AUCUNE = "aucune";
export const RELIGION_PLUSIEURS = "plusieurs";
// Ce qui nourrit chaque regard.
export const NOURRITURE_DU_REGARD = { epreuve: "endure", refaire: "batit", vivre: "plaisir" };
// Les besoins d'une observance (contenu : religion.observance.besoin, ancrage.besoin).
export const BESOINS_OBSERVANCE = ["calme", "objet", "rien"];

export const REGLES_ESPRIT = {
  tirage: {
    regard: { epreuve: 1, refaire: 1, vivre: 1.2 },
    pratique: 0.4, pratiqueAncien: 0.6, ageAncien: 60,
    // Sans contenu de religions : une chance sur quatre d'un ancrage.
    ancrageSansReligion: 0.75
  },
  // Rééquilibrage du 2026-11-13 (docs/equilibre-moral.md § 7) : réconfort tous les 14 jours (7) et seulement au fond, à moral 0
  // (1) ; « au fond », pour celui qui lâche, c'est moral 0 (1).
  foi: { plafondPratique: 1, plafondFaute: -1, joursFaute: 3, moralFaute: -1, reconfortTous: 14, reconfortSeuil: 0 },
  regard: { joursPourUn: 2, moralMin: 2, joursEteint: 7, plafondEteint: -1, joursChangement: 14, moralChangement: 2 },
  entente: { min: -3, max: 3, defaut: 0, seuilBon: 2, seuilMauvais: -2 },
  fauxBruits: { parMoral: [0.5, 0.35, 0.2], parPresent: 0.1, presentsMax: 3, fatigue: 1 },
  lacher: { seuilMoral: 0, signes: [2, 4, 6], depart: 8, retenue: 2, remontee: 2, malusParole: 1 },
  chance: { max: 3, trahi: 1 },
  // Lot 10 : changer de religion. jours : la durée où l'on tient des deux ; plafond : le plafond du pratiquant pendant ce temps
  // (au lieu de +1) ; souvent : deux changements en moins de tant de jours se savent.
  conversion: { jours: 30, plafond: 0, souvent: 365 }
};

const n0 = x => Number(x) || 0;

// L'esprit est-il tiré ? (sinon : fiche d'avant ce lot, aucun effet).
export const espritActif = s => REGARDS.includes(s?.regard);

// Les compteurs, avec leurs valeurs par défaut.
export function espritDe(s = {}) {
  const e = s?.esprit && typeof s.esprit === "object" ? s.esprit : {};
  return {
    joursSansObservance: Math.max(0, n0(e.joursSansObservance)), enFaute: Boolean(e.enFaute),
    reconfortLe: e.reconfortLe === null || e.reconfortLe === undefined || e.reconfortLe === "" || !Number.isFinite(Number(e.reconfortLe)) ? null : Number(e.reconfortLe),
    joursBas: Math.max(0, n0(e.joursBas)), lacher: borner(n0(e.lacher), 0, 3), chance: borner(n0(e.chance), 0, REGLES_ESPRIT.chance.max),
    joursSansNourriture: Math.max(0, n0(e.joursSansNourriture)), nourriSuite: Math.max(0, n0(e.nourriSuite)),
    nourri: { epreuve: Math.max(0, n0(e.nourri?.epreuve)), refaire: Math.max(0, n0(e.nourri?.refaire)), vivre: Math.max(0, n0(e.nourri?.vivre)) },
    ancragePerdu: Boolean(e.ancragePerdu), revolte: Math.max(0, n0(e.revolte)), projet: String(e.projet ?? ""),
    joursNourris: Math.max(0, n0(e.joursNourris)), joursFaim: Math.max(0, n0(e.joursFaim)),
    // Lot 10 : la conversion en cours (religion d'avant, ses religions, le jour du changement) et les jours des changements.
    religionAvant: String(e.religionAvant ?? ""), religionsAvant: Array.isArray(e.religionsAvant) ? e.religionsAvant.filter(Boolean).map(String) : [],
    convertiLe: e.convertiLe === null || e.convertiLe === undefined || e.convertiLe === "" || !Number.isFinite(Number(e.convertiLe)) ? null : Number(e.convertiLe),
    conversions: Array.isArray(e.conversions) ? e.conversions.map(Number).filter(Number.isFinite) : []
  };
}

// ------------------------------------------------------------------ religion, ancrage
export const estCroyant = s => Boolean(s?.religion) && s.religion !== RELIGION_AUCUNE;
// La clé d'aujourd'hui d'une religion : une ancienne clé (alias du contenu) rend celle qui la remplace ; « aucune », « plusieurs »,
// une clé inconnue ou un contenu sans religions la rendent telle quelle.
export function cleReligion(cle, contenu = {}) {
  const k = String(cle ?? "");
  if (!k || k === RELIGION_AUCUNE || k === RELIGION_PLUSIEURS) return k;
  return indexer(contenu ?? {}).religions.get(k)?.cle ?? k;
}
// Les religions propres d'un choix (religion, religions de « plusieurs »), sous leurs clés d'aujourd'hui, et pour une religion
// double ses deux religions.
function religionsDuChoix(religion, religions, contenu) {
  const idx = indexer(contenu ?? {});
  const base = religion === RELIGION_PLUSIEURS ? (religions ?? []).filter(Boolean) : religion && religion !== RELIGION_AUCUNE ? [religion] : [];
  const sortie = [];
  for (const r of base.map(x => cleReligion(x, contenu))) sortie.push(r, ...(idx.religions.get(r)?.composee ?? []).map(x => cleReligion(x, contenu)));
  return sortie;
}
// La conversion est-elle en cours (le jour donné) ? (Sans jour : tant qu'une religion d'avant est notée.)
export function enConversion(s = {}, jour = null) {
  const e = espritDe(s);
  if (!e.religionAvant || e.convertiLe === null) return false;
  return jour === null || jour === undefined || n0(jour) - e.convertiLe < REGLES_ESPRIT.conversion.jours;
}
// Les religions d'un survivant (« plusieurs » : celles de `religions`), sous leurs clés d'aujourd'hui avec contenu ; une religion
// double compte aussi ses deux religions ; pendant une conversion (jour donné, ou toute conversion notée), l'ancienne compte encore.
export function religionsDe(s = {}, contenu = null, jour = null) {
  const sortie = religionsDuChoix(s.religion, s.religions, contenu);
  if (enConversion(s, jour)) { const e = espritDe(s); sortie.push(...religionsDuChoix(e.religionAvant, e.religionsAvant, contenu)); }
  return [...new Set(sortie)];
}
// Ce qui le fait tenir : { source: "religion" | "ancrage" | "", cles, pratique, besoin }.
export function soutienDe(s = {}, contenu = {}, jour = null) {
  const idx = indexer(contenu);
  if (estCroyant(s)) {
    const cles = religionsDe(s, contenu, jour);
    // Plusieurs religions : l'observance la plus exigeante compte (« calme » avant « objet » avant « rien »).
    const besoins = cles.map(c => idx.religions.get(c)?.observance?.besoin).filter(b => BESOINS_OBSERVANCE.includes(b));
    const besoin = BESOINS_OBSERVANCE.find(b => besoins.includes(b)) ?? "calme";
    return { source: "religion", cles, pratique: Boolean(s.pratique), besoin };
  }
  if (s.ancrage) {
    const b = idx.ancrages.get(s.ancrage)?.besoin;
    return { source: "ancrage", cles: [s.ancrage], pratique: Boolean(s.pratique), besoin: BESOINS_OBSERVANCE.includes(b) ? b : "calme" };
  }
  return { source: "", cles: [], pratique: false, besoin: "rien" };
}
// Deux survivants partagent-ils une religion ? (prier ensemble sur la route tient l'observance de chacun.)
export const coreligionnaires = (a, b, contenu = null, jour = null) => religionsDe(a, contenu, jour).some(r => religionsDe(b, contenu, jour).includes(r));

// ------------------------------------------------------------------ tirage
// L'esprit d'un survivant tiré au sort. options : { traits: [cle], competences: { cle: { niveau } | n }, age, enfance,
// verrous: { regard, religion, religions, pratique, ancrage } } -> { regard, religion, religions, pratique, ancrage, sensMoral,
// autorite, reputation, esprit }.
// Les traits peuvent pencher : effets.sensMoral (±n), effets.autorite (±n), effets.regard ({ regard: poids en plus }),
// effets.croyant (il croit : jamais « aucune » au tirage), effets.pratique (chance de pratiquer en plus).
// Les religions du contenu : { cle, poids, affinites: { enfance: facteur } } (« Aucune origine ne donne de bonus ni de malus » :
// l'affinité ne change que la probabilité du tirage, jamais une règle).
export const SENS_DEPART = [[-2, 1], [-1, 2], [0, 3], [1, 2], [2, 1]];
export const SENS_DEPART_MAX = 6;
export const AUTORITE_DEPART_MAX = 4;
export function tirerEsprit(contenu = {}, hasard = Math.random, { traits = [], competences = {}, age = 30, enfance = "", verrous = {} } = {}) {
  const idx = indexer(contenu);
  const R = REGLES_ESPRIT.tirage;
  const defs = traits.map(t => idx.traits.get(t)).filter(Boolean);
  const niveau = c => n0(typeof competences?.[c] === "object" ? competences[c]?.niveau : competences?.[c]);
  // Regard.
  const poidsRegard = { ...R.regard };
  for (const t of defs) for (const [r, p] of Object.entries(t.effets?.regard ?? {})) if (r in poidsRegard) poidsRegard[r] += n0(p);
  const regard = REGARDS.includes(verrous.regard) ? verrous.regard : tirerPoids(REGARDS.map(r => [r, poidsRegard[r]]), hasard) ?? "vivre";
  // Religion.
  const religions = liste(contenu.religions);
  let religion = "", plusieurs = [];
  const poidsReligion = r => n0(r.poids ?? 1) * Math.max(0, Number(r.affinites?.[enfance] ?? 1));
  if (verrous.religion !== undefined && verrous.religion !== null && verrous.religion !== "") {
    // Une ancienne clé (alias) se garde sous la clé d'aujourd'hui (liste commune, lot 10).
    religion = cleReligion(verrous.religion, contenu);
    if (religion === RELIGION_PLUSIEURS) plusieurs = [...new Set((verrous.religions ?? []).filter(c => idx.religions.has(c)).map(c => cleReligion(c, contenu)))];
  } else if (religions.length) {
    const vraies = religions.filter(r => !r.special);
    const special = cle => religions.find(r => r.special === cle);
    const options = [...vraies.map(r => [r.cle, poidsReligion(r)]), ...[RELIGION_AUCUNE, RELIGION_PLUSIEURS].filter(special).map(k => [k, poidsReligion(special(k))])];
    religion = tirerPoids(options, hasard) ?? RELIGION_AUCUNE;
    // Un trait de croyant (effets.croyant : « Âme de pèlerin ») : il croit, à sa façon.
    if (religion === RELIGION_AUCUNE && defs.some(t => t.effets?.croyant) && vraies.length) religion = tirerPoids(vraies.map(r => [r.cle, poidsReligion(r) || 0.01]), hasard) ?? religion;
  } else religion = RELIGION_AUCUNE;
  if (religion === RELIGION_PLUSIEURS && plusieurs.length < 2) {
    const vraies = religions.filter(r => !r.special && !plusieurs.includes(r.cle));
    while (plusieurs.length < 2 && vraies.length) {
      const r = tirerPoids(vraies.map(x => ({ ...x, poids: poidsReligion(x) || 0.01 })), hasard);
      if (!r) break;
      plusieurs.push(r.cle);
      vraies.splice(vraies.findIndex(x => x.cle === r.cle), 1);
    }
    if (plusieurs.length < 2) { religion = plusieurs[0] ?? RELIGION_AUCUNE; plusieurs = []; }
  }
  if (religion !== RELIGION_AUCUNE && religion !== RELIGION_PLUSIEURS && religion && religions.length && !idx.religions.has(religion)) religion = RELIGION_AUCUNE;
  // Pratique.
  const bonusPratique = defs.reduce((t, d) => t + n0(d.effets?.pratique), 0);
  const pratique = typeof verrous.pratique === "boolean" ? verrous.pratique : chance(Math.min(0.95, (age >= R.ageAncien ? R.pratiqueAncien : R.pratique) + bonusPratique), hasard);
  // Ancrage : le non-croyant (le croyant n'en tire pas ; le joueur ou le MJ peut lui en donner un, sans effet tant qu'il croit).
  let ancrage = "";
  if (verrous.ancrage !== undefined && verrous.ancrage !== null) ancrage = idx.ancrages.has(verrous.ancrage) ? verrous.ancrage : "";
  else if (religion === RELIGION_AUCUNE) {
    const ancrages = liste(contenu.ancrages);
    if (ancrages.length && (religions.length || chance(1 - R.ancrageSansReligion, hasard))) ancrage = tirerPoids(ancrages.map(a => ({ ...a, poids: n0(a.poids ?? 1) })), hasard)?.cle ?? "";
  }
  // Sens moral : un peu autour de zéro, plus les traits ; borné au départ (personne ne naît saint ni monstre).
  let sensMoral = tirerPoids(SENS_DEPART, hasard) ?? 0;
  for (const t of defs) sensMoral += n0(t.effets?.sensMoral);
  sensMoral = borner(sensMoral, -SENS_DEPART_MAX, SENS_DEPART_MAX);
  // Autorité : l'âge et la parole, plus les traits, un peu de hasard.
  let autorite = 1 + (niveau("parole") >= 3 ? 1 : 0) + (age >= 40 ? 1 : 0) + (entier(0, 2, hasard) - 1);
  for (const t of defs) autorite += n0(t.effets?.autorite);
  autorite = borner(autorite, 0, AUTORITE_DEPART_MAX);
  return { regard, religion, religions: religion === RELIGION_PLUSIEURS ? plusieurs : [], pratique: religion === RELIGION_AUCUNE && !ancrage ? false : pratique,
    ancrage, sensMoral, autorite, reputation: 0, esprit: espritDe({}) };
}

// ------------------------------------------------------------------ le moral au jour le jour
// Le plafond du moral venu de l'esprit (s'ajoute à 3 + confort + traits, survivant.mjs effetJour) : la foi ou l'ancrage d'un
// pratiquant (+1, ou −1 en faute), l'entente du groupe (±1 quand on n'est pas seul). contexte : { entente, presents (autres) }.
export function plafondEsprit(s = {}, contenu = {}, { entente = 0, presents = 0, jour = null } = {}) {
  if (!espritActif(s)) return 0;
  const F = REGLES_ESPRIT.foi, E = REGLES_ESPRIT.entente;
  let p = 0;
  const sout = soutienDe(s, contenu, jour);
  // Pendant une conversion (lot 10), le pratiquant n'a qu'une part de sa foi : son plafond ne monte pas (la faute pèse toujours).
  if (sout.source && sout.pratique) p += espritDe(s).enFaute ? F.plafondFaute : sout.source === "religion" && enConversion(s, jour) ? REGLES_ESPRIT.conversion.plafond : F.plafondPratique;
  // Une semaine sans rien de ce qui nourrit son regard : il s'éteint un peu (plafond −1), jusqu'au prochain jour qui le nourrit.
  if (espritDe(s).joursSansNourriture >= REGLES_ESPRIT.regard.joursEteint) p += REGLES_ESPRIT.regard.plafondEteint;
  if (Number(presents) >= 1) {
    if (Number(entente) >= E.seuilBon) p += 1;
    else if (Number(entente) <= E.seuilMauvais) p -= 1;
  }
  return p;
}

// Ce qui s'est passé dans la journée d'un survivant, pour son regard. jour : { mange, blessures, fatigue, faim, tache, aLAbri,
// enRoute, cyclone, fete, accueil (le groupe a accueilli quelqu'un ces 7 derniers jours), confort, passion (a pratiqué sa passion) }.
export function nourrituresDuJour(j = {}) {
  const endure = !j.mange || n0(j.blessures) >= 2 || Boolean(j.cyclone);
  const batit = (Boolean(j.aLAbri) && ["chantier", "cultures", "elevage", "enseigner", "atelier", "soins"].includes(j.tache)) || Boolean(j.accueil);
  const plaisir = Boolean(j.fete) || Boolean(j.passion) || (Boolean(j.aLAbri) && (["repos", "cuisine", "peche"].includes(j.tache) || n0(j.confort) >= 1) && Boolean(j.mange));
  return { endure, batit, plaisir };
}

// La journée de l'esprit, APRÈS effetJour (le repas, le moral ordinaire) : observances, réconfort, regard, lâcher.
// ctx : { jour, aLAbri, coreligionnaire (un pratiquant de la même religion est là), nourritures (nourrituresDuJour), plafond
//   (le plafond du moral de ce jour, tout compris), presents (autres présents), entente, statut }
// -> { system, evenements: [{ cle, ... }] }
export function journeeEsprit(entree, contenu = {}, ctx = {}) {
  const s = structuredClone(entree ?? {});
  const evenements = [];
  if (!espritActif(s) || s.vivant === false || s.livide) return { system: s, evenements };
  const e = espritDe(s);
  const F = REGLES_ESPRIT.foi, RG = REGLES_ESPRIT.regard, LA = REGLES_ESPRIT.lacher;
  const jour = n0(ctx.jour);
  const plafond = borner(Number(ctx.plafond ?? 5), 0, 5);
  s.moral = borner(Number(s.moral ?? 4), 0, 5);
  // 0. La conversion (lot 10) : son temps fini, l'ancienne religion ne compte plus.
  if (e.religionAvant && e.convertiLe !== null && jour - e.convertiLe >= REGLES_ESPRIT.conversion.jours) {
    e.religionAvant = ""; e.religionsAvant = [];
    evenements.push({ cle: "conversion-faite" });
  }
  s.esprit = e;
  // 1. Observances (pratiquant) ; pendant une conversion, la plus exigeante des deux religions.
  const sout = soutienDe(s, contenu, jour);
  if (sout.source && sout.pratique) {
    const tenue = sout.besoin === "rien" || (sout.besoin === "objet" ? !e.ancragePerdu : Boolean(ctx.aLAbri) || Boolean(ctx.coreligionnaire));
    if (tenue) { e.joursSansObservance = 0; if (e.enFaute) evenements.push({ cle: "observance-reprise" }); e.enFaute = false; }
    else {
      e.joursSansObservance += 1;
      if (e.joursSansObservance >= F.joursFaute && !e.enFaute) {
        e.enFaute = true;
        s.moral = borner(s.moral + F.moralFaute, 0, 5);
        evenements.push({ cle: "observance-manquee" });
      }
    }
  } else if (sout.source && s.moral <= F.reconfortSeuil && (e.reconfortLe === null || jour - e.reconfortLe >= F.reconfortTous)) {
    // 2. Réconfort (non-pratiquant).
    s.moral = Math.min(5, s.moral + 1);
    e.reconfortLe = jour;
    evenements.push({ cle: "reconfort", source: sout.source, cles: sout.cles });
  }
  // 3. Regard : ce qui le nourrit.
  const nour = ctx.nourritures ?? {};
  const nourri = Boolean(nour[NOURRITURE_DU_REGARD[s.regard]]);
  for (const r of REGARDS) if (nour[NOURRITURE_DU_REGARD[r]]) e.nourri[r] += 1;
  if (nourri) {
    e.nourriSuite += 1;
    if (e.nourriSuite >= RG.joursPourUn) { e.nourriSuite = 0; if (s.moral < plafond && s.moral >= RG.moralMin) s.moral += 1; }
    e.joursSansNourriture = 0;
    e.nourri = { epreuve: 0, refaire: 0, vivre: 0 };
  } else {
    e.joursSansNourriture += 1;
    if (e.joursSansNourriture >= RG.joursChangement && s.moral <= RG.moralChangement) {
      const autres = REGARDS.filter(r => r !== s.regard).sort((a, b) => e.nourri[b] - e.nourri[a]);
      if (e.nourri[autres[0]] > 0) {
        evenements.push({ cle: "regard-change", avant: s.regard, apres: autres[0] });
        s.regard = autres[0];
      }
      e.joursSansNourriture = 0;
      e.nourri = { epreuve: 0, refaire: 0, vivre: 0 };
    }
  }
  // 4. Celui qui lâche.
  const avant = e.lacher;
  if (s.moral <= LA.seuilMoral) {
    const retenu = n0(ctx.presents) >= LA.retenue && n0(ctx.entente) >= 0;
    if (!retenu) e.joursBas += 1;
    else if (e.joursBas > 0) evenements.push({ cle: "retenu" });
  } else e.joursBas = Math.max(0, e.joursBas - LA.remontee);
  e.lacher = LA.signes.filter(x => e.joursBas >= x).length;
  if (e.lacher > avant) evenements.push({ cle: `signe-${e.lacher}` });
  if (e.joursBas >= LA.depart) evenements.push({ cle: s.statut === "joueur" ? "au-bord" : "lache" });
  s.esprit = e;
  return { system: s, evenements };
}

// Celui qui lâche mange moins : il laisse sa gamelle (aux autres, ou aux rats : les stocks n'y gagnent rien) et le repas ne lui
// rend plus de moral (survivant.mjs effetJour, sansAppetit) ; il parle moins : le malus de dés de l'esprit.
export const sansAppetit = s => espritActif(s) && espritDe(s).lacher >= 1;
export const malusEsprit = (s, competence) => (espritActif(s) && competence === "parole" && espritDe(s).lacher >= 2 ? REGLES_ESPRIT.lacher.malusParole : 0);

// Un faux bruit cette nuit ? (moral bas, peu de monde autour.) presents : les autres à l'abri.
export function probaFauxBruit(s, presents = 0) {
  if (!espritActif(s) || s?.vivant === false || s?.livide) return 0;
  const FB = REGLES_ESPRIT.fauxBruits;
  const m = borner(Number(s.moral ?? 4), 0, 5);
  const base = FB.parMoral[m] ?? 0;
  return Math.max(0, base - FB.parPresent * Math.min(FB.presentsMax, Math.max(0, n0(presents))));
}
export const fauxBruit = (s, presents = 0, hasard = Math.random) => chance(probaFauxBruit(s, presents), hasard);

// ------------------------------------------------------------------ changer de religion (lot 10)
// Changer de religion, dans un lieu de culte (l'API demande le lieu ; le MJ dit si c'en est un). choix : { religion, religions,
// jour }. -> { ok, motif, system, avant: { religion, religions }, quitte (il ne croit plus), souvent (un autre changement il y a
// moins de REGLES_ESPRIT.conversion.souvent jours) }. Le pratiquant le reste ; ses compteurs de faute repartent de zéro.
export function changerDeReligion(entree, { religion = "", religions = [], jour = 0 } = {}, contenu = {}) {
  const s = structuredClone(entree ?? {});
  const C = REGLES_ESPRIT.conversion;
  const idx = indexer(contenu ?? {});
  const nouvelle = cleReligion(religion, contenu);
  const valide = nouvelle === RELIGION_AUCUNE || nouvelle === RELIGION_PLUSIEURS || idx.religions.has(nouvelle) || !liste(contenu?.religions).length;
  if (!nouvelle || !valide) return { ok: false, motif: message("conversion-inconnue", { religion }, `religion inconnue « ${religion} »`), system: s };
  const multiples = nouvelle === RELIGION_PLUSIEURS ? [...new Set((religions ?? []).map(r => cleReligion(r, contenu)).filter(r => idx.religions.has(r) && !idx.religions.get(r)?.special))] : [];
  if (nouvelle === RELIGION_PLUSIEURS && multiples.length < 2) return { ok: false, motif: message("conversion-plusieurs", {}, "« plusieurs » demande au moins deux religions"), system: s };
  const avant = { religion: cleReligion(s.religion, contenu), religions: (s.religions ?? []).map(r => cleReligion(r, contenu)) };
  const meme = avant.religion === nouvelle && (nouvelle !== RELIGION_PLUSIEURS || [...avant.religions].sort().join() === [...multiples].sort().join());
  if (meme) return { ok: false, motif: message("conversion-meme", {}, "c'est déjà sa religion"), system: s };
  const e = espritDe(s);
  const j = n0(jour);
  const souvent = e.conversions.some(x => j - x < C.souvent);
  const croyaitAvant = Boolean(avant.religion) && avant.religion !== RELIGION_AUCUNE;
  s.esprit = { ...e, religionAvant: croyaitAvant ? avant.religion : "", religionsAvant: croyaitAvant ? avant.religions : [], convertiLe: croyaitAvant ? j : null,
    conversions: [...e.conversions, j].slice(-5), joursSansObservance: 0, enFaute: false };
  s.religion = nouvelle;
  s.religions = multiples;
  return { ok: true, motif: null, system: s, avant, quitte: croyaitAvant && nouvelle === RELIGION_AUCUNE, souvent };
}

// ------------------------------------------------------------------ chance, signes
// La chance du trahi : des points, un dé de plus au prochain test qui compte (consommé). Le jeu ne dit pas d'où elle vient.
export function donnerChance(entree, n = REGLES_ESPRIT.chance.trahi) {
  const s = structuredClone(entree ?? {});
  const e = espritDe(s);
  e.chance = borner(e.chance + n0(n), 0, REGLES_ESPRIT.chance.max);
  s.esprit = e;
  return s;
}
// -> { system, bonus } : un dé de plus si le survivant a de la chance (un point consommé).
export function utiliserChance(entree) {
  const e = espritDe(entree);
  if (e.chance <= 0) return { system: entree, bonus: 0 };
  const s = structuredClone(entree);
  s.esprit = { ...e, chance: e.chance - 1 };
  return { system: s, bonus: 1 };
}

// Un objet que le cyclone a déposé là, une coïncidence : le croyant pratiquant y voit un signe (+1 moral), le croyant qui ne
// pratique pas hésite, les autres n'y pensent même pas. -> { lecture: "signe" | "doute" | "rien", system }
export function lireUnSigne(entree) {
  const s = structuredClone(entree ?? {});
  if (!espritActif(s) || !estCroyant(s)) return { lecture: "rien", system: s };
  if (!s.pratique) return { lecture: "doute", system: s };
  s.moral = Math.min(5, Number(s.moral ?? 4) + 1);
  return { lecture: "signe", system: s };
}

// ------------------------------------------------------------------ l'entente du groupe
export const ententeDe = etat => borner(n0(etat?.groupe?.entente ?? REGLES_ESPRIT.entente.defaut), REGLES_ESPRIT.entente.min, REGLES_ESPRIT.entente.max);
export function ajusterEntente(etat, delta = 0) {
  const E = REGLES_ESPRIT.entente;
  return { ...etat, groupe: { ...(etat?.groupe ?? {}), entente: borner(ententeDe(etat) + n0(delta), E.min, E.max) } };
}

// Le texte d'un événement de l'esprit (journal) : { cle, params, texte }. nom : le survivant.
const TEXTES_ESPRIT = {
  "observance-manquee": n => `${n} n'a pas pu tenir ce qui le tient debout depuis des jours ; il se sent en faute.`,
  "observance-reprise": n => `${n} a retrouvé ses habitudes.`,
  reconfort: n => `${n} se raccroche à ce qui le fait tenir.`,
  "regard-change": n => `${n} ne voit plus les choses de la même façon.`,
  retenu: n => `Les autres sont là, autour de ${n}. Ça compte.`,
  "signe-1": n => `${n} mange moins.`,
  "signe-2": n => `${n} parle de moins en moins.`,
  "signe-3": n => `${n} donne ses affaires.`,
  lache: n => `Un matin, ${n} n'est plus là.`,
  "au-bord": n => `${n} est au bord de lâcher.`,
  "faux-bruit": n => `${n} a entendu quelque chose dans la nuit. Personne d'autre.`,
  "conversion-faite": n => `${n} ne tient plus que de sa nouvelle foi.`
};
export const CLES_ESPRIT = Object.keys(TEXTES_ESPRIT);
export function texteEsprit(cle, nom) {
  const f = TEXTES_ESPRIT[cle];
  return f ? message(`esprit-${cle}`, { nom }, f(nom)) : null;
}
// Les événements de l'esprit que tout le groupe voit (journal public) ; les autres vont au MJ.
export const ESPRIT_PUBLICS = ["regard-change", "signe-1", "signe-2", "signe-3", "lache", "faux-bruit", "reconfort"];
