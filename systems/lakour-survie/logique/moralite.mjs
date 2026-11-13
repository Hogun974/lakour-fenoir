// Le sens moral (complément du jeu 3D, famille 3) : une jauge par survivant, joueur ou PNJ, du rouge (exclure, trahir) au bleu
// (accueillir, aider) ; la réputation, ce que les autres en savent ; la couleur d'un groupe ; le vote ; l'enfant témoin.
// Logique pure.
//
// - sensMoral : −10 (rouge) .. +10 (bleu), 0 par défaut. Chacun ne voit que la sienne (réglage du MJ, contrat §11).
// - reputation : −10 .. +10, 0 par défaut : ce que les témoins ont vu et jugé. La rumeur (le Ladi Lafé, lot voisin) la colporte ;
//   elle peut être fausse. Point d'entrée commun : deplacerSensMoral / deplacerReputation / acteMoral.
// - Un acte pousse la jauge de celui qui le porte, MÊME avec des circonstances atténuantes (plus de place, plus de nourriture) :
//   elles ne changent que le jugement des témoins qui savaient (réputation divisée par deux, vers zéro).
// - Un acte décidé par le groupe : le chef qui décide et tous ceux qui ne s'y sont pas opposés le portent ; qui a voté contre ne
//   rougit pas (ni ne bleuit, pour un acte bleu qu'il refusait).
// - L'enfant témoin (moins de 18 ans) : selon ses compétences, il imite ce qu'il voit (sa jauge suit l'acte) ou il s'en révolte
//   (sa jauge part à l'opposé ; trois révoltes : il veut partir, pour se venger ou pour fonder un ailleurs meilleur). Des adultes
//   bleus, hors du chef, peuvent voir sa révolte et préparer un départ en douce : le MJ est prévenu, rien n'est automatique.
import { borner } from "./constantes.mjs";
import { chance } from "./hasard.mjs";
import { espritDe } from "./esprit.mjs";

export const SENS_MORAL = { min: -10, max: 10 };
export const REPUTATION = { min: -10, max: 10 };
// Bandes : [borne haute incluse, bande].
export const BANDES_SENS_MORAL = [[-6, "rouge"], [-2, "rougeatre"], [1, "neutre"], [5, "bleute"], [Infinity, "bleu"]];
export const bandeSensMoral = v => BANDES_SENS_MORAL.find(([max]) => Number(v) <= max)?.[1] ?? "neutre";

// Ce que chaque acte fait à la jauge de celui qui le porte.
export const ACTES_MORAUX = {
  exclure: -1,      // refuser quelqu'un à la porte, chasser un membre
  colporter: -1,    // colporter du mal sur quelqu'un, à juste titre ou non (le Ladi Lafé)
  mentir: -1,       // un mensonge démenti (un objet rendu qu'on dit sien, une marque, un témoin)
  abandonner: -2,   // laisser quelqu'un derrière soi qu'on pouvait emmener
  attaquer: -2,     // attaquer des gens qui ne menaçaient pas
  trahir: -3,       // prendre ce qu'on apporte puis trahir, livrer quelqu'un
  accueillir: 1,    // ouvrir la porte
  aider: 1,         // soigner, nourrir, guider un inconnu
  partager: 1,      // donner une part de ses stocks
  epargner: 1,      // laisser partir qui pouvait être tué
  rendre: 1         // rendre un objet à son propriétaire
};
export const SENS_DES_ACTES = Object.fromEntries(Object.entries(ACTES_MORAUX).map(([k, v]) => [k, Math.sign(v)]));

const n0 = x => Number(x) || 0;

// Le point d'entrée commun : déplacer la jauge d'un survivant (la rumeur, un acte, le MJ). -> nouveau system
export function deplacerSensMoral(entree, delta = 0) {
  const s = structuredClone(entree ?? {});
  s.sensMoral = borner(Math.round(n0(s.sensMoral) + n0(delta)), SENS_MORAL.min, SENS_MORAL.max);
  return s;
}
export function deplacerReputation(entree, delta = 0) {
  const s = structuredClone(entree ?? {});
  s.reputation = borner(Math.round(n0(s.reputation) + n0(delta)), REPUTATION.min, REPUTATION.max);
  return s;
}

// Le jugement des témoins : l'acte entier, ou à moitié (vers zéro) quand ils connaissaient les circonstances.
export const jugementTemoins = (delta, circonstances = false) => (circonstances ? Math.trunc(n0(delta) / 2) : n0(delta));

// Un acte porté par un survivant. options : { circonstances, temoins (défaut vrai : quelqu'un a vu), contre (il s'y est opposé),
// delta (pour un acte hors de la liste) } -> { system, delta, reputation }
export function acteMoral(entree, acte, { circonstances = false, temoins = true, contre = false, delta = undefined } = {}) {
  const d = delta !== undefined ? n0(delta) : n0(ACTES_MORAUX[acte]);
  if (contre || !d) return { system: structuredClone(entree ?? {}), delta: 0, reputation: 0 };
  let s = deplacerSensMoral(entree, d);
  const r = temoins ? jugementTemoins(d, circonstances) : 0;
  if (r) s = deplacerReputation(s, r);
  return { system: s, delta: d, reputation: r };
}

// ------------------------------------------------------------------ le groupe
const vivant = s => s && s.vivant !== false && !s.livide;
// La couleur d'un groupe : la moyenne des jauges de ses vivants (PNJ légers compris s'ils en ont une). -> { moyenne, bande }
export function couleurDuGroupe(systemes = []) {
  const l = systemes.filter(vivant);
  const moyenne = l.length ? Math.round(l.reduce((t, s) => t + n0(s.sensMoral), 0) / l.length * 10) / 10 : 0;
  return { moyenne, bande: bandeSensMoral(moyenne) };
}
// Ce qu'on dit du groupe : la moyenne des réputations.
export function reputationDuGroupe(systemes = []) {
  const l = systemes.filter(vivant);
  const moyenne = l.length ? Math.round(l.reduce((t, s) => t + n0(s.reputation), 0) / l.length * 10) / 10 : 0;
  return { moyenne, bande: bandeSensMoral(moyenne) };
}

// La voix d'un survivant qu'on ne joue pas (PNJ, compagnon sans avis) sur un acte de sens `sens` (+1 bleu, −1 rouge) : il vote
// pour ce qui va dans le sens de sa jauge ; le regard « refaire » penche vers l'accueil. Les circonstances (plus de place, plus
// de vivres) poussent les tièdes à fermer la porte.
export function voixAuto(s = {}, sens = 0, { circonstances = false } = {}) {
  let score = n0(s.sensMoral) * Math.sign(sens);
  if (s.regard === "refaire" && sens > 0) score += 2;
  if (circonstances) score -= 2 * Math.sign(sens);
  return score >= 0 ? "pour" : "contre";
}

export const VOIX = ["pour", "contre", "abstention"];
// voix : { acteurId: "pour" | "contre" | "abstention" } -> { pour, contre, abstention, total, majorite: "pour" | "contre" | "egalite", part }
export function resoudreVote(voix = {}) {
  const v = Object.values(voix).filter(x => VOIX.includes(x));
  const pour = v.filter(x => x === "pour").length, contre = v.filter(x => x === "contre").length;
  const majorite = pour > contre ? "pour" : contre > pour ? "contre" : "egalite";
  const exprimes = pour + contre;
  return { pour, contre, abstention: v.length - exprimes, total: v.length, majorite, part: exprimes ? Math.max(pour, contre) / exprimes : 0 };
}

// Un acte décidé par le groupe. membres : [{ id, system }] ; voix (facultatif) : { id: "pour" | "contre" | "abstention" } sur la
// question « faire cet acte ? » ; chefId : celui qui décide (il porte l'acte quoi qu'il ait voté).
// -> { membres: [{ id, system, delta, reputation }], porteurs: [id], epargnes: [id] }
export function acteCollectif(membres = [], acte, { voix = null, chefId = "", circonstances = false, temoins = true, delta = undefined } = {}) {
  const porteurs = [], epargnes = [];
  const sortie = membres.map(m => {
    if (!vivant(m.system)) return { ...m, delta: 0, reputation: 0 };
    const contre = m.id !== chefId && voix && voix[m.id] === "contre";
    const r = acteMoral(m.system, acte, { circonstances, temoins, contre, delta });
    (contre ? epargnes : porteurs).push(m.id);
    return { id: m.id, system: r.system, delta: r.delta, reputation: r.reputation };
  });
  return { membres: sortie, porteurs, epargnes };
}

// ------------------------------------------------------------------ l'enfant témoin
export const AGE_ENFANT = 18;
export const estEnfant = s => vivant(s) && Number(s?.age) > 0 && Number(s.age) < AGE_ENFANT;
const niv = (s, c) => n0(s?.competences?.[c]?.niveau ?? s?.competences?.[c]);
export const REGLES_ENFANT = { revoltes: 3, imitation: 1, revolte: 1 };
// La réaction d'un enfant qui voit un acte de sens `sens` (le signe de ACTES_MORAUX). Ce qu'il sait faire décide : un enfant de
// cœur et de mots (soins, parole, survie) se révolte contre le rouge ; un enfant de muscles et d'ombre (combat, tir, discrétion)
// l'imite. Le bleu, il l'imite toujours. À égalité, le hasard.
// -> { system, reaction: "imite" | "revolte", projet: "" | "vengeance" | "ailleurs" }
export function reactionEnfant(entree, sens, hasard = Math.random) {
  let s = structuredClone(entree ?? {});
  if (!estEnfant(s) || !sens) return { system: s, reaction: "", projet: "" };
  const coeur = niv(s, "soins") + niv(s, "parole") + niv(s, "survie");
  const poing = niv(s, "combat") + niv(s, "tir") + niv(s, "discretion");
  const revolte = sens < 0 && (coeur > poing || (coeur === poing && chance(0.5, hasard)));
  const e = espritDe(s);
  let projet = e.projet;
  if (!revolte) s = deplacerSensMoral(s, Math.sign(sens) * REGLES_ENFANT.imitation);
  else {
    s = deplacerSensMoral(s, REGLES_ENFANT.revolte);
    e.revolte += 1;
    if (e.revolte >= REGLES_ENFANT.revoltes && !projet) projet = poing >= niv(s, "parole") + niv(s, "survie") ? "vengeance" : "ailleurs";
  }
  s.esprit = { ...espritDe(s), revolte: e.revolte, projet };
  return { system: s, reaction: revolte ? "revolte" : "imite", projet };
}
// Les adultes qui voient la révolte d'un enfant et pourraient préparer un départ à l'insu du chef : bleus (jauge ≥ 3), pas le chef.
export const complicesPossibles = (adultes = [], chefId = "") => adultes.filter(a => vivant(a.system) && !estEnfant(a.system) && a.id !== chefId && n0(a.system.sensMoral) >= 3).map(a => a.id);

// ------------------------------------------------------------------ objets rendus, marques
// Rendre un objet à un voisin : il peut mentir et dire qu'il est à lui. Un mensonge démenti (une marque sur l'objet, un témoin)
// rougit le menteur. -> { dementi, acte: "mentir" | "" }
export function objetReclame({ ment = false, marque = false, temoin = false } = {}) {
  const dementi = Boolean(ment) && (Boolean(marque) || Boolean(temoin));
  return { dementi, acte: dementi ? "mentir" : "" };
}

// ------------------------------------------------------------------ aucune couleur n'est gratuite
// Les gens de bien fuient un groupe rouge : chaque semaine, un membre bleu (jauge ≥ 4) dans un groupe dont la couleur est −3 ou
// moins perd 1 de moral. -> delta de moral (0 ou −1)
export const MALAISE = { bleu: 4, groupe: -3, moral: -1 };
export const malaiseCouleur = (s, couleurGroupe) => (vivant(s) && n0(s.sensMoral) >= MALAISE.bleu && n0(couleurGroupe) <= MALAISE.groupe ? MALAISE.moral : 0);
