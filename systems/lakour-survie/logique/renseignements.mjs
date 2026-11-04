// Les renseignements (contrat §2.4) : ce que le groupe croit savoir de chaque région, lu dans le monde réel en BANDES au moment
// de l'observation, puis daté. Logique pure.
//
// - Infestation (0..5) : < 1 calme, < 2,5 presente, < 4 dense, sinon grouillante.
// - Pillage (part restante de toutes les réserves pillables de la région) : ≥ 75 % intact, ≥ 40 % entame, ≥ 10 % maigre,
//   sinon vide.
// - Source : "vu" (explorer, fouiller, voyager : tout ce qu'on voit), "radio" (infestation, électricité et eau seulement),
//   "rumeur" (infestation seulement). Une observation moins sûre n'efface pas les champs qu'elle ne couvre pas.
// - Âge : jour courant − jour de l'observation (null si jamais vu).
import { BANDES_INFESTATION, BANDES_PILLAGE, RESEAUX, RESSOURCES_PILLABLES } from "./constantes.mjs";
import { regionsDe, regionDe, reservesDepart } from "./contenu.mjs";

export function bandeInfestation(x) {
  const v = Number(x);
  if (!Number.isFinite(v)) return "inconnue";
  for (const [borne, bande] of BANDES_INFESTATION) if (v < borne) return bande;
  return "grouillante";
}

export function partPillage(pillage = {}, initial = {}) {
  const total = RESSOURCES_PILLABLES.reduce((s, r) => s + (Number(initial?.[r]) || 0), 0);
  if (!(total > 0)) return 0;
  const reste = RESSOURCES_PILLABLES.reduce((s, r) => s + Math.max(0, Number(pillage?.[r]) || 0), 0);
  return reste / total;
}

export function bandePillage(pillage, initial) {
  const p = partPillage(pillage, initial);
  for (const [borne, bande] of BANDES_PILLAGE) if (p >= borne) return bande;
  return "vide";
}

// Les réseaux encore là dans une région au jour donné (coupure tirée au début : null = jamais).
export function reseauxActifs(monde, region, jour) {
  const c = monde?.coupures?.[region] ?? {};
  return Object.fromEntries(RESEAUX.map(r => [r, c[r] === null || c[r] === undefined || Number(jour) < Number(c[r])]));
}

export const renseignementVide = () => ({
  vu: null, source: "rumeur", infestation: "inconnue", pillage: "inconnu", electricite: null, eau: null, routes: {}, factions: [], notes: ""
});

// Ce qu'on lit d'une région réelle, selon la source.
export function lireRegion(monde, contenu, region, jour, source = "vu") {
  const reel = monde?.regions?.[region];
  if (!reel) return null;
  const lecture = { vu: Number(jour), source, infestation: bandeInfestation(reel.infestation) };
  if (source === "vu" || source === "radio") {
    const res = reseauxActifs(monde, region, jour);
    lecture.electricite = res.electricite;
    lecture.eau = res.eau;
  }
  if (source === "vu") {
    lecture.pillage = bandePillage(reel.pillage, reservesDepart(regionDe(contenu, region)));
    lecture.routes = { ...(reel.routes ?? {}) };
    lecture.factions = Object.entries(reel.factions ?? {}).filter(([, f]) => f >= 0.5).map(([cle]) => cle).sort();
  }
  return lecture;
}

// Renseignements de départ : tout est inconnu, sauf la région de départ, vue au jour 0.
export function renseignementsInitiaux(contenu, { region = null, monde = null, jour = 0 } = {}) {
  const r = {};
  for (const reg of regionsDe(contenu)) r[reg.cle] = renseignementVide();
  return region && monde ? observer(r, monde, contenu, region, jour, "vu") : r;
}

// Une observation : renvoie de NOUVEAUX renseignements. Une source moins sûre ne remplace pas un « vu » plus récent ou du même
// jour, et ne touche qu'aux champs qu'elle couvre.
export function observer(renseignements = {}, monde, contenu, region, jour, source = "vu") {
  const lecture = lireRegion(monde, contenu, region, jour, source);
  if (!lecture) return renseignements;
  const ancien = renseignements[region] ?? renseignementVide();
  const rang = s => ({ vu: 3, radio: 2, rumeur: 1 }[s] ?? 0);
  if (ancien.vu !== null && ancien.vu >= jour && rang(ancien.source) > rang(source)) return renseignements;
  const nouveau = { ...structuredClone(ancien), ...lecture, notes: ancien.notes ?? "" };
  return { ...renseignements, [region]: nouveau };
}

// Le MJ corrige ou ajoute un renseignement (radio, rumeur, PNJ) : champs donnés, date et source.
export function renseigner(renseignements = {}, region, champs = {}, jour = 0) {
  const ancien = renseignements[region] ?? renseignementVide();
  return { ...renseignements, [region]: { ...structuredClone(ancien), vu: champs.vu ?? jour, source: champs.source ?? "rumeur", ...champs } };
}

export const ageRenseignement = (r, jour) => (r?.vu === null || r?.vu === undefined ? null : Math.max(0, Number(jour) - Number(r.vu)));

export function vieillir(renseignements = {}, jour) {
  return Object.fromEntries(Object.entries(renseignements).map(([cle, r]) => [cle, ageRenseignement(r, jour)]));
}

// Connu contre réel (pour le MJ et l'IA) : -> [{ champ, connu, reel }].
export function comparer(connu = renseignementVide(), monde, contenu, region, jour) {
  const reel = lireRegion(monde, contenu, region, jour, "vu");
  if (!reel) return [];
  const ecarts = [];
  for (const champ of ["infestation", "pillage", "electricite", "eau"]) {
    if (connu?.[champ] !== reel[champ]) ecarts.push({ champ, connu: connu?.[champ] ?? null, reel: reel[champ] });
  }
  for (const [v, etat] of Object.entries(reel.routes)) {
    const c = connu?.routes?.[v] ?? null;
    if (c !== etat) ecarts.push({ champ: `routes.${v}`, connu: c, reel: etat });
  }
  const fc = [...(connu?.factions ?? [])].sort().join(","), fr = reel.factions.join(",");
  if (fc !== fr) ecarts.push({ champ: "factions", connu: connu?.factions ?? [], reel: reel.factions });
  return ecarts;
}
