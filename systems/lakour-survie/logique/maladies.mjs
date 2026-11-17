// Maladies et blessures persistantes (contrat §9, reprises des afflictions de Warcraft). Logique pure.
//
// Affliction (contenu `afflictions`) : { cle, nom, categorie: "maladie" | "blessure" | "psychique", contagion (chance par jour,
//   pour chaque autre personne de l'abri, d'attraper la maladie d'un malade déclaré), incubation (jours), duree (jours de
//   maladie déclarée), effets: { malus (dés), fatigue (par jour) }, soin: { competence, difficulte, medicaments },
//   aggravation: { jours (sans soin réussi), malus, fatigue, duree } | null,
//   declencheur: "eau" | "moustiques" | "ravine" | "chaleur" | null (extension : ce qui fait courir le risque), risque (chance
//   de base par personne et par jour) }.
// Sur le survivant (extension de §3.1, `system.afflictions`) : [{ cle, depuis (jour contracté), stade: "incubation" | "active" |
//   "aggravee", actifDepuis, reste (jours), traitee, malus, fatigue }]. Les malus des afflictions déclarées s'ajoutent aux malus
//   d'état (survivant.mjs, malusEtat).
//
// Nombres retenus (risque du jour = risque × facteurs) :
// - eau : × 1 si l'eau de l'abri n'est pas traitée, × 0,2 si elle l'est (filtre, réseau public encore là) ; × 2 non traitée
//   quand elle est douteuse (les fuites d'un cyclone ont rempli la citerne : eauDouteuse, lot « savoirs ») ;
// - moustiques : × 1 en saison des pluies dans les Bas (< 800 m pour les moustiques), × 0,3 en saison des pluies plus haut,
//   × 0,1 en saison sèche ;
// - ravine (leptospirose) : × 1 en saison des pluies, × 0,3 sinon, × 0,5 si l'eau est traitée ;
// - chaleur : × 1 en saison des pluies dans les Bas (< 400 m), × 0,2 sinon ;
// - une infirmerie en service (soins > 0) : × 0,7 sur tout, contagion comprise.
// - Sans soin réussi, une affliction qui a une aggravation s'aggrave après `aggravation.jours` jours déclarée. Un soin réussi
//   (avec ses médicaments) la marque traitée : plus d'aggravation, la durée restante est divisée par 2 (au supérieur) et une
//   affliction aggravée revient à ses effets de base. Les médicaments sont consommés même si le soin échoue.
//
// Lot « corps » (contrat §19, docs/equilibre-corps.md ; repris de donnees/maladies/effets.json de Fénoir 3D) :
// - Des symptômes, pas des noms : chaque affliction porte `symptomes: { active: [clé], aggravee: [clé] }` (clés du registre
//   `symptomes`), `evidente` (fracture, brûlure, piqûre, choc : tout le monde la voit) et `diagnostic` (les savoirs qui la
//   reconnaissent : « premiers-secours-avances » presque toutes, « zerbaz » les fièvres, la gastro, la gale, les brûlures, les
//   piqûres). Le joueur voit les symptômes d'un mal ; son nom, seulement si le groupe sait le reconnaître (reconnue).
// - Plusieurs points à la fois : `effetsStade: { active: { moral, insomnie }, aggravee: { … } }` : l'insomnie (le sommeil efface un
//   quart de veille en moins : corps.mjs) ; le moral qu'un stade coûte (0 à 2) est à raconter par le MJ (moralDuStade), la logique
//   ne l'applique pas.
// - Le Gris (registre `gris` : { diagnostic, stades: [{ symptomes }] × 6 }) : ce qu'on voit à chaque stade (plaie rouge, fièvre,
//   frissons et peau qui grise, faiblesse, confusion, épuisement). On ne le nomme qu'avec le savoir de soins ou après avoir vu un
//   mordu se relever (grisReconnu).
// - L'insalubrité (corps.mjs) : `insalubrite` (poids du tirage) et `siBlesse` sur les afflictions qu'elle amène ; un abri salubre
//   (`salubre`) : risque de l'eau × 0,5 et contagion × 0,75.
import { ALTITUDE_BAS } from "./constantes.mjs";
import { message } from "./textes.mjs";
import { HYGIENE } from "./corps.mjs";

export const ALTITUDE_MOUSTIQUES = 800;
export const FACTEURS_MALADIES = {
  eau: { traitee: 0.2, brute: 1, douteuse: 2 },
  moustiques: { pluiesBas: 1, pluiesHauts: 0.3, seche: 0.1 },
  ravine: { pluies: 1, seche: 0.3, traitee: 0.5 },
  chaleur: { pluiesBas: 1, autre: 0.2 },
  infirmerie: 0.7,
  // Un abri tenu propre (le grand ménage du Nouvel An chinois : souvenirs.mjs, lot « fetes ») : risque et contagion × 0,5.
  hygiene: 0.5
};

// Facteur de risque d'une affliction selon les conditions de vie.
// conditions : { saison, altitude, eauTraitee, infirmerie, hygiene, eauDouteuse, salubre (lot « corps ») }
export function facteurRisque(def, { saison = "pluies", altitude = 0, eauTraitee = false, infirmerie = false, hygiene = false, eauDouteuse = false, salubre = false } = {}) {
  const F = FACTEURS_MALADIES;
  let f;
  switch (def?.declencheur) {
    case "eau": f = (eauTraitee ? F.eau.traitee : eauDouteuse ? F.eau.douteuse : F.eau.brute) * (salubre ? HYGIENE.salubre.eau : 1); break;
    case "moustiques": f = saison === "pluies" ? (Number(altitude) < ALTITUDE_MOUSTIQUES ? F.moustiques.pluiesBas : F.moustiques.pluiesHauts) : F.moustiques.seche; break;
    case "ravine": f = (saison === "pluies" ? F.ravine.pluies : F.ravine.seche) * (eauTraitee ? F.ravine.traitee : 1); break;
    case "chaleur": f = saison === "pluies" && Number(altitude) < ALTITUDE_BAS ? F.chaleur.pluiesBas : F.chaleur.autre; break;
    default: return 0; // blessure, choc : c'est le MJ (ou une rencontre) qui les donne (contracter)
  }
  return f * (infirmerie ? F.infirmerie : 1) * (hygiene ? F.hygiene : 1);
}

export const risqueAffliction = (def, conditions) => Math.min(1, Math.max(0, Number(def?.risque) || 0) * facteurRisque(def, conditions));

export const aAffliction = (s, cle) => (s?.afflictions ?? []).some(a => a.cle === cle);
export const declarees = s => (s?.afflictions ?? []).filter(a => a.stade === "active" || a.stade === "aggravee");
export const malusAfflictions = s => declarees(s).reduce((t, a) => t + (Number(a.malus) || 0), 0);

// Contracter une affliction (rien si déjà atteint de la même). -> system (nouveau)
export function contracter(system, def, jour = 0) {
  const s = { ...structuredClone(system), afflictions: structuredClone(system?.afflictions ?? []) };
  if (!def || aAffliction(s, def.cle)) return s;
  const incubation = Math.max(0, Number(def.incubation) || 0);
  s.afflictions.push({
    cle: def.cle, depuis: jour, stade: incubation > 0 ? "incubation" : "active", actifDepuis: incubation > 0 ? null : jour,
    reste: Math.max(1, Number(def.duree) || 1), traitee: false, malus: Number(def.effets?.malus) || 0, fatigue: Number(def.effets?.fatigue) || 0
  });
  return s;
}

// Un jour d'évolution. defs : Map ou objet { cle: def } ou liste. -> { system, evenements: [{ cle, affliction, texte }] }
export function evoluerAfflictions(system, defs, jour) {
  const parCle = indexDefs(defs);
  const s = { ...structuredClone(system), afflictions: [] };
  const evenements = [];
  for (const a0 of structuredClone(system?.afflictions ?? [])) {
    const a = { ...a0 };
    const def = parCle.get(a.cle);
    const nom = def?.nom ?? a.cle;
    if (a.stade === "incubation") {
      if (jour - a.depuis >= (Number(def?.incubation) || 0)) {
        a.stade = "active";
        a.actifDepuis = jour;
        evenements.push({ cle: "declaree", affliction: a.cle, texte: `tombe malade (${nom})` });
      }
      s.afflictions.push(a);
      continue;
    }
    s.fatigue = Math.min(5, (Number(s.fatigue) || 0) + (Number(a.fatigue) || 0));
    a.reste -= 1;
    const ag = def?.aggravation;
    if (a.stade === "active" && !a.traitee && ag && jour - (a.actifDepuis ?? a.depuis) >= Number(ag.jours ?? 0)) {
      a.stade = "aggravee";
      a.malus += Number(ag.malus) || 0;
      a.fatigue += Number(ag.fatigue) || 0;
      a.reste += Number(ag.duree) || 0;
      evenements.push({ cle: "aggravee", affliction: a.cle, texte: `voit son état s'aggraver (${nom})` });
    }
    if (a.reste <= 0) { evenements.push({ cle: "guerie", affliction: a.cle, texte: `se remet (${nom})` }); continue; }
    s.afflictions.push(a);
  }
  return { system: s, evenements };
}

// Soigner une affliction (résultat d'un test de la compétence de `def.soin`). Les médicaments sont pris dans `stocks`.
// -> { ok, raison, motif: { cle, params, texte } | null, system, stocks }
export function soignerAffliction(system, def, resultat, stocks = {}) {
  const med = Math.max(0, Number(def?.soin?.medicaments) || 0);
  const refus = (raison, cle, params, sys, st) => ({ ok: false, raison, motif: message(cle, params, raison), system: sys, stocks: st });
  if ((Number(stocks.medicaments) || 0) < med) return refus(`il faut ${med} médicament${med > 1 ? "s" : ""}`, "soin-medicaments", { n: med }, system, stocks);
  const st = { ...stocks, medicaments: (Number(stocks.medicaments) || 0) - med };
  const s = { ...structuredClone(system), afflictions: structuredClone(system?.afflictions ?? []) };
  const a = s.afflictions.find(x => x.cle === def?.cle);
  if (!a) return refus("pas atteint", "soin-pas-atteint", {}, system, stocks);
  if (!resultat?.reussite) return refus("le soin n'a pas pris", "soin-rate", {}, s, st);
  a.traitee = true;
  a.reste = Math.ceil(a.reste / 2);
  if (a.stade === "aggravee") { a.stade = "active"; a.malus = Number(def.effets?.malus) || 0; a.fatigue = Number(def.effets?.fatigue) || 0; }
  return { ok: true, raison: "", motif: null, system: s, stocks: st };
}

// Le tirage du jour pour un groupe : nouvelles afflictions (risque des conditions de vie, puis contagion).
// survivants : [{ id, system }] (vivants) ; -> [{ id, cle }]
export function tirerMaladies(survivants, defs, conditions, hasard, jour = 0) {
  const parCle = indexDefs(defs);
  const nouvelles = [];
  const deja = (id, cle) => nouvelles.some(n => n.id === id && n.cle === cle);
  for (const s of survivants) {
    for (const def of parCle.values()) {
      if (aAffliction(s.system, def.cle) || deja(s.id, def.cle)) continue;
      const p = risqueAffliction(def, conditions);
      if (p > 0 && hasard() < p) nouvelles.push({ id: s.id, cle: def.cle });
    }
  }
  const facteur = (conditions?.infirmerie ? FACTEURS_MALADIES.infirmerie : 1) * (conditions?.hygiene ? FACTEURS_MALADIES.hygiene : 1)
    * (conditions?.salubre ? HYGIENE.salubre.contagion : 1);
  for (const malade of survivants) {
    for (const a of declarees(malade.system)) {
      const def = parCle.get(a.cle);
      const c = Number(def?.contagion) || 0;
      if (!(c > 0)) continue;
      for (const autre of survivants) {
        if (autre.id === malade.id || aAffliction(autre.system, a.cle) || deja(autre.id, a.cle)) continue;
        if (hasard() < c * facteur) nouvelles.push({ id: autre.id, cle: a.cle });
      }
    }
  }
  return nouvelles;
}

function indexDefs(defs) {
  if (defs instanceof Map) return defs;
  if (Array.isArray(defs)) return new Map(defs.map(d => [d.cle, d]));
  return new Map(Object.entries(defs ?? {}).map(([cle, d]) => [cle, { cle, ...d }]));
}

// ------------------------------------------------------------------ lot « corps » : symptômes, diagnostic, effets d'un stade
export const STADES_DECLARES = ["active", "aggravee"];
// Le moral qu'un stade coûte (effetsStade du contenu, 0 à 2) : à raconter par le MJ, la logique ne l'applique pas (mesuré : il
// faisait partir les groupes nomades, docs/equilibre-corps.md §5).
export const moralDuStade = (def, stade) => Math.max(0, Math.min(2, Number(def?.effetsStade?.[stade]?.moral) || 0));
// Les symptômes d'une affliction à son stade (une affliction qui couve ne se voit pas). -> [clé]
export function symptomesAffliction(def, stade = "active") {
  if (!STADES_DECLARES.includes(stade)) return [];
  const t = def?.symptomes ?? {};
  return [...(t[stade] ?? t.active ?? [])];
}
// Le groupe sait-il nommer ce mal ? Évident pour tous, ou reconnu par l'un des savoirs de son diagnostic. Un contenu d'avant le lot
// (ni diagnostic ni « evidente ») : nommé comme avant.
export const reconnue = (def, savoirs = []) => !def || (def.diagnostic === undefined && def.evidente === undefined) || Boolean(def.evidente)
  || (def.diagnostic ?? []).some(k => (savoirs ?? []).includes(k));
// Une maladie déclarée l'empêche-t-elle de bien dormir (corps.mjs, quartDeSommeil) ? defs : liste, Map ou objet.
export function insomnieDe(system, defs) {
  const parCle = indexDefs(defs);
  return declarees(system).some(a => Boolean(parCle.get(a.cle)?.effetsStade?.[a.stade]?.insomnie));
}
// Le Gris : ce qu'on voit à un stade (0 à 5 ; au-delà, la mort). contenu.gris : { diagnostic, stades: [{ symptomes }] }.
export function symptomesDuGris(contenu, stade = 0) {
  const stades = contenu?.gris?.stades ?? [];
  if (!stades.length) return [];
  return [...(stades[Math.max(0, Math.min(stades.length - 1, Math.floor(Number(stade) || 0)))]?.symptomes ?? [])];
}
// Sans table du Gris (contenu d'avant le lot), il se nomme comme avant.
export const grisReconnu = (contenu, { savoirs = [], temoin = false } = {}) =>
  !contenu?.gris || Boolean(temoin) || (contenu.gris.diagnostic ?? ["premiers-secours-avances"]).some(k => (savoirs ?? []).includes(k));
// Le nom d'un symptôme (registre « symptomes » : { cle, nom }) ; la clé à défaut.
export function nomSymptome(contenu, cle) {
  const l = Array.isArray(contenu?.symptomes) ? contenu.symptomes : Object.entries(contenu?.symptomes ?? {}).map(([k, v]) => ({ cle: k, ...v }));
  return l.find(x => x?.cle === cle)?.nom ?? cle;
}
export const nomsSymptomes = (contenu, cles = []) => [...new Set(cles)].map(k => nomSymptome(contenu, k));
// Une morsure pansée se tait pendant les deux premiers quarts (un stade du Gris) : ni le joueur ni le soignant ne savent si le soin
// a pris (Fénoir 3D : « l'issue n'est dite à personne »). system.morsure : { quart } (la morsure pansée, posée par l'API).
export const QUARTS_MORSURE_MUETTE = 2;
export const morsureMuette = (system, quart = 0) => Boolean(system?.morsure) && Number(quart) - Number(system.morsure.quart ?? 0) < QUARTS_MORSURE_MUETTE;

// Ce que voient les joueurs d'un survivant (sa fiche, le journal public, le MJ IA quand il parle aux joueurs) : des symptômes ;
// le nom d'un mal seulement si le groupe le reconnaît (savoirs) ; le Gris seulement par ses signes, nommé si le groupe a vu un mordu
// se relever (grisConnu) ou par le savoir de soins ; rien pendant que la morsure pansée se tait.
// -> { maux: [{ cle, nom, stade, symptomes, reconnue }], gris: { stade, symptomes, reconnu } | null, morsure: { quart } | null }
//    (cle et nom vides pour un mal que le groupe ne reconnaît pas)
export function ceQueVoientLesJoueurs(system, contenu, { savoirs = [], grisConnu = false, quart = 0 } = {}) {
  const defs = indexDefs(contenu?.afflictions);
  const maux = declarees(system).map(a => {
    const def = defs.get(a.cle);
    const r = reconnue(def, savoirs);
    return { cle: r ? a.cle : "", nom: r ? def?.nom ?? a.cle : "", stade: a.stade, symptomes: symptomesAffliction(def, a.stade), reconnue: r };
  });
  const muette = morsureMuette(system, quart);
  const inf = system?.infection;
  const gris = inf?.atteint && system?.vivant !== false && !system?.livide && !muette
    ? { stade: Number(inf.stade) || 0, symptomes: symptomesDuGris(contenu, inf.stade), reconnu: grisReconnu(contenu, { savoirs, temoin: grisConnu }) }
    : null;
  return { maux, gris, morsure: muette ? { quart: Number(system.morsure.quart) || 0 } : null };
}
