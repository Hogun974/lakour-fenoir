// L'état d'un survivant (contrat §1.3, §3.1) : malus, effets d'un quart et d'un jour, blessures, infection. Logique pure :
// chaque fonction rend un NOUVEL objet `system` (jamais l'entrée modifiée) et la liste des événements survenus.
//
// Nombres retenus :
// - Malus d'état (dés retirés à la réserve) : blessures 2 → 1, 3 → 2, 4 (mourant) → 3 ; fatigue 3–4 → 1, 5 → 2 ;
//   moral 1 → 1 (à 0 le personnage craque : `craque`, scène de MJ, malus 1 aussi) ; + malus des maladies et blessures
//   persistantes déclarées (maladies.mjs).
// - Quart : soif +1 sans eau (0 dès qu'on boit) ; soif ≥ 4 → +1 fatigue par quart. Repos d'un quart −1 fatigue, nuit de repos
//   à l'abri −2. Mourant (blessures 4) à la fin d'un quart sans avoir été stabilisé → mort.
// - Infection : stade = floor((quart − depuis) / 2), au plus 6 ; à 6, mort ; au quart suivant, il se relève Livide si rien n'est
//   fait (`corpsTraite`).
// - Jour : faim +1 sans manger (0 dès qu'on mange) ; faim ≥ 2 → +1 fatigue et −1 moral par jour. Bien nourri et reposé
//   (fatigue < 3) : moral +1 jusqu'à 3 + confort de l'abri (au plus 5).
import { COMPETENCES, borner } from "./constantes.mjs";
import { malusAfflictions } from "./maladies.mjs";

export const SEUIL_SOIF = 4;           // quarts sans boire avant la fatigue
export const SEUIL_FAIM = 2;           // jours sans manger avant fatigue et moral
export const QUARTS_PAR_STADE = 2;     // l'infection progresse d'un stade tous les 2 quarts
export const STADE_MORT = 6;
export const MORAL_DEFAUT = 4;

export function survivantNeuf(partiel = {}) {
  const competences = {};
  for (const c of COMPETENCES) {
    const v = partiel.competences?.[c];
    competences[c] = { niveau: borner(Number(v?.niveau ?? (typeof v === "number" ? v : 0)) || 0, 0, 5), marques: Math.max(0, Number(v?.marques) || 0) };
  }
  return {
    ...partiel,
    competences,
    blessures: borner(Number(partiel.blessures) || 0, 0, 4),
    fatigue: borner(Number(partiel.fatigue) || 0, 0, 5),
    moral: borner(Number(partiel.moral ?? MORAL_DEFAUT), 0, 5),
    faim: Math.max(0, Number(partiel.faim) || 0),
    soif: Math.max(0, Number(partiel.soif) || 0),
    infection: {
      atteint: Boolean(partiel.infection?.atteint),
      stade: borner(Number(partiel.infection?.stade) || 0, 0, STADE_MORT),
      depuis: Number(partiel.infection?.depuis) || 0
    },
    savoirs: [...(partiel.savoirs ?? [])],
    afflictions: structuredClone(partiel.afflictions ?? []),
    vivant: partiel.vivant !== false,
    livide: Boolean(partiel.livide),
    charge: Math.max(0, Number(partiel.charge) || 0)
  };
}

// extra : { traits: malus de dés venus des traits (peur d'un lieu, tâche détestée : generation.mjs, modificateursTraits) }.
// -> { total, blessures, fatigue, moral, afflictions, traits, craque }
export function malusEtat(s = {}, extra = {}) {
  const b = Number(s.blessures) || 0, f = Number(s.fatigue) || 0, m = Number(s.moral ?? MORAL_DEFAUT);
  const blessures = b >= 4 ? 3 : b >= 3 ? 2 : b >= 2 ? 1 : 0;
  const fatigue = f >= 5 ? 2 : f >= 3 ? 1 : 0;
  const moral = m <= 1 ? 1 : 0;
  const afflictions = malusAfflictions(s);
  const traits = Math.max(0, Number(extra.traits) || 0);
  return { total: blessures + fatigue + moral + afflictions + traits, blessures, fatigue, moral, afflictions, traits, craque: m <= 0 };
}

export const peutAgir = s => s?.vivant !== false && !s?.livide;

// Effet d'un quart qui passe (le quart `quart` vient de s'achever).
// options : { boit: Boolean (eau disponible), repos: "quart" | "nuit" | null, stabilise: Boolean (mourant soigné ce quart),
//             corpsTraite: Boolean (le corps d'un infecté mort a été traité : pas de relève) }
// -> { system, evenements: [{ cle, texte }] }
export function effetQuart(entree, quart, options = {}) {
  const s = survivantNeuf(entree);
  const evenements = [];
  if (s.livide) return { system: s, evenements };
  if (!s.vivant) {
    // Mort de l'infection : se relève Livide au quart suivant si rien n'est fait.
    if (s.infection.atteint && s.infection.stade >= STADE_MORT && !options.corpsTraite) {
      s.livide = true;
      evenements.push({ cle: "releve", texte: "se relève, Livide" });
    }
    return { system: s, evenements };
  }
  // Soif.
  s.soif = options.boit ? 0 : s.soif + 1;
  if (s.soif >= SEUIL_SOIF) { s.fatigue = Math.min(5, s.fatigue + 1); evenements.push({ cle: "soif", texte: "meurt de soif" }); }
  // Repos.
  if (options.repos === "nuit") s.fatigue = Math.max(0, s.fatigue - 2);
  else if (options.repos === "quart") s.fatigue = Math.max(0, s.fatigue - 1);
  // Infection.
  if (s.infection.atteint) {
    const avant = s.infection.stade;
    s.infection.stade = Math.min(STADE_MORT, Math.max(avant, Math.floor((quart - s.infection.depuis) / QUARTS_PAR_STADE)));
    if (s.infection.stade > avant) evenements.push({ cle: "infection", texte: `le Gris gagne (stade ${s.infection.stade})`, stade: s.infection.stade });
    if (s.infection.stade >= STADE_MORT) {
      s.vivant = false;
      evenements.push({ cle: "mort", cause: "infection", texte: "succombe au Gris" });
      return { system: s, evenements };
    }
  }
  // Mourant non stabilisé.
  if (s.blessures >= 4 && !options.stabilise) {
    s.vivant = false;
    evenements.push({ cle: "mort", cause: "blessures", texte: "meurt de ses blessures" });
  }
  return { system: s, evenements };
}

// Effet d'un jour qui passe. options : { mange: Boolean, confort: Number (moral de l'abri), personnes (taille du groupe),
//   traits: { moral, fatigue, social: [{ max, moral }] } (effetsTraits), peurMoral: Number (moral perdu par la peur du lieu) }
// Traits : le plafond du moral bouge de `moral` (un pessimiste redescend vers le sien), `fatigue` s'ajoute chaque jour, un
// solitaire perd `social.moral` au-delà de `social.max` personnes. Une recrue dont le moral reste à 0 trois jours s'en va
// (évènement « depart »).
export function effetJour(entree, options = {}) {
  const s = survivantNeuf(entree);
  const evenements = [];
  if (!peutAgir(s)) return { system: s, evenements };
  const tr = options.traits ?? {};
  if (Number(tr.fatigue) > 0) s.fatigue = Math.min(5, s.fatigue + Number(tr.fatigue));
  for (const so of tr.social ?? []) if ((Number(options.personnes) || 0) > so.max) s.moral = borner(s.moral + so.moral, 0, 5);
  if (Number(options.peurMoral) > 0) s.moral = Math.max(0, s.moral - Number(options.peurMoral));
  s.faim = options.mange ? 0 : s.faim + 1;
  if (s.faim >= SEUIL_FAIM) {
    s.fatigue = Math.min(5, s.fatigue + 1);
    s.moral = Math.max(0, s.moral - 1);
    evenements.push({ cle: "faim", texte: "a faim depuis des jours" });
  } else if (options.mange && s.fatigue < 3 && !options.sansAppetit) {
    // sansAppetit (esprit.mjs) : celui qui lâche mange sans que le repas lui rende rien.
    // plafondEsprit (esprit.mjs, plafondEsprit) : la foi ou l'ancrage d'un pratiquant, l'entente du groupe ; 0 sans esprit tiré.
    const plafond = borner(3 + Math.max(0, Number(options.confort) || 0) + (Number(tr.moral) || 0) + (Number(options.plafondEsprit) || 0), 0, 5);
    if (s.moral < plafond) s.moral += 1;
    else if (s.moral > plafond && (Number(tr.moral) < 0 || Number(options.plafondEsprit) < 0)) s.moral -= 1;
  }
  if (s.moral <= 0) evenements.push({ cle: "craque", texte: "craque" });
  if (s.statut === "recrue") {
    s.joursMoralZero = s.moral <= 0 ? (Number(s.joursMoralZero) || 0) + 1 : 0;
    if (s.joursMoralZero >= 3) evenements.push({ cle: "depart", texte: "s'en va, à bout" });
  }
  return { system: s, evenements };
}

// Blessures : n de plus (au plus 4 = mourant). morsure : une morsure ou griffure profonde de Livide (test de soins extrême à
// faire dans le quart : appliquerMorsure). -> { system, mourant, morsure }
export function blesser(entree, n = 1, { morsure = false } = {}) {
  const s = survivantNeuf(entree);
  if (!peutAgir(s)) return { system: s, mourant: false, morsure: false };
  s.blessures = Math.min(4, s.blessures + Math.max(0, n));
  return { system: s, mourant: s.blessures >= 4, morsure: Boolean(morsure) };
}

// Soins (résultat d'un test de `soins`) : une réussite retire 1 blessure, +1 par point de marge (un mourant soigné n'est plus
// mourant). -> { system, soignees }
export function soigner(entree, resultat) {
  const s = survivantNeuf(entree);
  if (!peutAgir(s) || !resultat?.reussite) return { system: s, soignees: 0 };
  const soignees = Math.min(s.blessures, 1 + Math.max(0, resultat.marge || 0));
  s.blessures -= soignees;
  return { system: s, soignees };
}

// La difficulté du test de soins d'une morsure (§1.3) : extrême ; difficile si le soignant y met un médicament (consommé) ou si
// l'abri a une infirmerie en service (son bonus de soins compte alors, comme pour tout test à l'abri). Depuis le 2026-11-05 :
// l'extrême seul laissait 0 à 11 % de chances et tuait d'abord les survivants seuls. Ajouts du 2026-11-05 (après) :
// - une tisane ou un emplâtre de zerbaz préparé à l'atelier (recette du contenu) est un médicament comme un autre ;
// - trousse : le soignant porte une trousse de secours ou un sac d'intervention (équipement de catégorie « soin ») :
//   désinfectant, garrot, compresses comptent comme un médicament ; la trousse n'est pas consommée (son bonus d'outil compte,
//   comme pour tout test) ;
// - decoction : on lave la morsure à la décoction de zerbaz (DECOCTION.plantes plante de l'abri, consommée) : aide aussi.
export const DECOCTION = { plantes: 1, bonus: 1 };
export function difficulteMorsure({ medicament = false, infirmerie = false, trousse = false, decoction = false } = {}) {
  return medicament || infirmerie || trousse || decoction ? "difficile" : "extreme";
}

// Les dés en plus du test de soins d'une morsure : +1 pour un médicament, +1 pour une décoction de zerbaz (les deux se
// cumulent : c'est ce qui donne une chance à un soignant sans métier), et le bonus d'outil (trousse) et d'installation
// (infirmerie), au plus +2 ensemble comme pour tout test à l'abri (§1.1).
export function bonusMorsure({ medicament = false, decoction = false, outil = 0, infirmerie = 0 } = {}) {
  return (medicament ? 1 : 0) + (decoction ? DECOCTION.bonus : 0) + Math.min(2, Math.max(0, Number(outil) || 0) + Math.max(0, Number(infirmerie) || 0));
}

// Une morsure : le test de soins du quart (difficulteMorsure) a-t-il réussi ? Sinon infecté depuis `quart`.
export function appliquerMorsure(entree, resultatSoins, quart) {
  if (resultatSoins?.reussite) return { system: survivantNeuf(entree), infecte: false };
  return { system: infecter(entree, quart), infecte: true };
}

export function infecter(entree, quart) {
  const s = survivantNeuf(entree);
  if (!s.infection.atteint) s.infection = { atteint: true, stade: 0, depuis: Number(quart) || 0 };
  return s;
}

// Une compétence : niveau et marques (lecture tolérante).
export const competence = (s, cle) => ({ niveau: Number(s?.competences?.[cle]?.niveau) || 0, marques: Number(s?.competences?.[cle]?.marques) || 0 });
export const meilleur = (survivants, cle) => Math.max(0, ...survivants.filter(peutAgir).map(s => competence(s, cle).niveau));
