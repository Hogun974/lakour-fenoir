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
// - eau : × 1 si l'eau de l'abri n'est pas traitée, × 0,2 si elle l'est (filtre, réseau public encore là) ;
// - moustiques : × 1 en saison des pluies dans les Bas (< 800 m pour les moustiques), × 0,3 en saison des pluies plus haut,
//   × 0,1 en saison sèche ;
// - ravine (leptospirose) : × 1 en saison des pluies, × 0,3 sinon, × 0,5 si l'eau est traitée ;
// - chaleur : × 1 en saison des pluies dans les Bas (< 400 m), × 0,2 sinon ;
// - une infirmerie en service (soins > 0) : × 0,7 sur tout, contagion comprise.
// - Sans soin réussi, une affliction qui a une aggravation s'aggrave après `aggravation.jours` jours déclarée. Un soin réussi
//   (avec ses médicaments) la marque traitée : plus d'aggravation, la durée restante est divisée par 2 (au supérieur) et une
//   affliction aggravée revient à ses effets de base. Les médicaments sont consommés même si le soin échoue.
import { ALTITUDE_BAS } from "./constantes.mjs";
import { message } from "./textes.mjs";

export const ALTITUDE_MOUSTIQUES = 800;
export const FACTEURS_MALADIES = {
  eau: { traitee: 0.2, brute: 1 },
  moustiques: { pluiesBas: 1, pluiesHauts: 0.3, seche: 0.1 },
  ravine: { pluies: 1, seche: 0.3, traitee: 0.5 },
  chaleur: { pluiesBas: 1, autre: 0.2 },
  infirmerie: 0.7
};

// Facteur de risque d'une affliction selon les conditions de vie.
// conditions : { saison, altitude, eauTraitee, infirmerie }
export function facteurRisque(def, { saison = "pluies", altitude = 0, eauTraitee = false, infirmerie = false } = {}) {
  const F = FACTEURS_MALADIES;
  let f;
  switch (def?.declencheur) {
    case "eau": f = eauTraitee ? F.eau.traitee : F.eau.brute; break;
    case "moustiques": f = saison === "pluies" ? (Number(altitude) < ALTITUDE_MOUSTIQUES ? F.moustiques.pluiesBas : F.moustiques.pluiesHauts) : F.moustiques.seche; break;
    case "ravine": f = (saison === "pluies" ? F.ravine.pluies : F.ravine.seche) * (eauTraitee ? F.ravine.traitee : 1); break;
    case "chaleur": f = saison === "pluies" && Number(altitude) < ALTITUDE_BAS ? F.chaleur.pluiesBas : F.chaleur.autre; break;
    default: return 0; // blessure, choc : c'est le MJ (ou une rencontre) qui les donne (contracter)
  }
  return f * (infirmerie ? F.infirmerie : 1);
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
  const facteur = conditions?.infirmerie ? FACTEURS_MALADIES.infirmerie : 1;
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
