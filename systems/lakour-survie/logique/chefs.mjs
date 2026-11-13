// Les chefs et l'autorité (complément du jeu 3D, famille 3) : ce que décide un chef de bande PNJ selon son sens moral, l'ultimatum
// qui devient un tribut puis une alliance ou une révolte, l'autorité du chef du groupe (le vote, la parole tenue, les bouches
// nourries ; trop basse : désertions, scission, renversement), et la séparation ou la fusion de deux groupes. Logique pure.
//
// - Le chef joueur reste maître de ses choix : la logique ne décide jamais à sa place ; ses choix agissent sur SA jauge morale
//   (moralite.mjs) et sur son autorité (ici).
// - Le chef de bande PNJ : attaquer (avec sa bande, ou seul s'il est seul), négocier, passer son chemin et fonder ailleurs, poser
//   un ultimatum, demander à rejoindre. Les poids (decisionChefDeBande) : sa jauge (rouge : attaquer, ultimatum ; bleu : négocier,
//   rejoindre, passer), le rapport de forces, sa faim, et ce qu'on dit du groupe (une réputation bleue attire les demandes et les
//   ultimatums : on le croit doux ; une rouge fait réfléchir avant d'attaquer).
// - L'autorité (0..5, 2 par défaut) : +1 parole tenue, −1 parole manquée ; +1 après 7 jours où tout le monde a mangé ; −1 après
//   3 jours de faim ; −1 pour un vote ignoré (−2 contre les deux tiers). À 1 ou moins : chaque semaine, une chance sur trois qu'un
//   compagnon, une recrue ou un PNJ déserte ; à 0 : le MJ est prévenu d'une scission (quatre membres ou plus) ou d'un renversement
//   (le plus écouté prend la tête). En assaut, un chef très écouté (4+) donne +1 dé à la défense, un chef qu'on n'écoute plus (1−) −1.
import { borner, RESSOURCES } from "./constantes.mjs";
import { tirerPoids, chance, entier } from "./hasard.mjs";
import { message } from "./textes.mjs";
import { espritDe } from "./esprit.mjs";
import { bandeSensMoral } from "./moralite.mjs";

export const DECISIONS_CHEF = ["attaquer", "negocier", "passer", "ultimatum", "rejoindre"];
// Le sens moral d'un chef de bande quand sa faction n'en donne pas : d'après son attitude.
export const SENS_PAR_ATTITUDE = { hostile: -6, mefiante: -2, neutre: 0, amicale: 4 };

const n0 = x => Number(x) || 0;

// La décision d'un chef de bande. situation : { sensMoral, force (la bande), forceGroupe (défense de l'abri + valides), faim (0..1),
// seul, reputationGroupe } -> { decision, poids: { decision: n } }
export function poidsChefDeBande({ sensMoral = 0, force = 2, forceGroupe = 3, faim = 0.3, seul = false, reputationGroupe = 0 } = {}) {
  const m = borner(n0(sensMoral) / 5, -2, 2);
  const r = Math.max(0.1, n0(force)) / Math.max(1, n0(forceGroupe));
  const rouge = Math.max(0, -m), bleu = Math.max(0, m);
  const p = {
    attaquer: (r >= 1 ? 2 : 0.5) * (1 + rouge) * (m > 1 ? 0.1 : 1) * (seul ? 0.6 : 1),
    ultimatum: (r >= 0.8 ? 1.5 : 0.3) * (1 + rouge * 0.5) * (m > 1 ? 0.2 : 1) * (seul ? 0.3 : 1),
    negocier: 1 + bleu * 0.5 + (r < 1 ? 0.5 : 0),
    passer: 0.8 + (r < 0.6 ? 1 : 0) + bleu * 0.3,
    rejoindre: (2 * borner(n0(faim), 0, 1) + (seul ? 1 : 0)) * (m >= 0 ? 1 : 0.3) * (r < 1 ? 1 : 0.3)
  };
  const rep = n0(reputationGroupe);
  if (rep >= 2) { p.rejoindre *= 1.5; p.ultimatum *= 1.3; }
  if (rep <= -2) { p.attaquer *= 0.7; p.passer *= 1.3; }
  for (const k of DECISIONS_CHEF) p[k] = Math.round(p[k] * 1000) / 1000;
  return p;
}
export function decisionChefDeBande(situation = {}, hasard = Math.random) {
  const poids = poidsChefDeBande(situation);
  return { decision: tirerPoids(DECISIONS_CHEF.map(d => [d, poids[d]]), hasard) ?? "negocier", poids };
}

// Le chef d'une menace « bande » ou « visite » (monde.mjs tirerMenaces), d'après sa faction (contenu : faction.sensMoralChef, sinon
// l'attitude) à ±2 près. situation : { forceGroupe, reputationGroupe, phase } -> { sensMoral, bande, decision, poids, seul, texte }
export function chefDeLaMenace(menace, faction = null, hasard = Math.random, { forceGroupe = 3, reputationGroupe = 0, phase = "silence" } = {}) {
  const base = faction?.sensMoralChef !== undefined && Number.isFinite(Number(faction.sensMoralChef)) ? Number(faction.sensMoralChef) : SENS_PAR_ATTITUDE[menace?.attitude ?? faction?.attitude] ?? 0;
  const sensMoral = borner(base + entier(-2, 2, hasard), -10, 10);
  const force = Math.max(1, n0(menace?.force) || 2);
  const seul = force <= 2;
  const faim = { "jour-zero": 0, panique: 0.2, effondrement: 0.4, silence: 0.5, apres: 0.6 }[phase] ?? 0.4;
  const { decision, poids } = decisionChefDeBande({ sensMoral, force, forceGroupe, faim, seul, reputationGroupe }, hasard);
  const nom = "";
  return { sensMoral, bande: bandeSensMoral(sensMoral), decision, poids, seul, nom,
    ...message(`chef-${decision}`, { faction: faction?.nom ?? menace?.faction ?? "?", nom }, TEXTES_CHEF[decision](faction?.nom ?? menace?.faction ?? "?")) };
}
const TEXTES_CHEF = {
  attaquer: f => `Le chef de ${f} a décidé d'attaquer.`,
  negocier: f => `Le chef de ${f} veut parler.`,
  passer: f => `Le chef de ${f} passe son chemin : il ira fonder ailleurs.`,
  ultimatum: f => `Le chef de ${f} pose un ultimatum : un tribut, ou la guerre.`,
  rejoindre: f => `Le chef de ${f} demande à rejoindre le groupe.`
};

// ------------------------------------------------------------------ ultimatum et tribut
export const REGLES_TRIBUT = { tousLes: 7, alliance: 4, hausse: 3, sensAlliance: -3, max: 3 };
// Ce que demande la bande : ce que le groupe a le plus (vivres d'abord), deux ressources, selon sa force.
export function demandeTribut(stocks = {}, force = 2) {
  const tri = RESSOURCES.filter(r => r !== "energie").map(r => [r, n0(stocks[r])]).sort((a, b) => b[1] - a[1]);
  const prioritaires = ["nourriture", "carburant", "munitions", "medicaments"].filter(r => n0(stocks[r]) > 0);
  const choisies = [...new Set([...prioritaires, ...tri.map(([r]) => r)])].slice(0, 2);
  const q = Math.max(1, Math.ceil(n0(force) / 2) + 1);
  return Object.fromEntries(choisies.map(r => [r, r === "nourriture" || r === "eau" ? q * 2 : q]));
}
// Un ultimatum accepté : un tribut tous les `tousLes` jours. -> { tribut (public), secret: { sensMoral, force } }
export function poserUltimatum({ id = "t1", bande = "", faction = "", sensMoral = 0, force = 2, demande = {}, jour = 0, tousLes = REGLES_TRIBUT.tousLes } = {}) {
  return {
    tribut: { id, bande, faction, demande: structuredClone(demande), tousLes, depuis: jour, prochain: jour + tousLes, payes: 0, etat: "actif" },
    secret: { sensMoral: n0(sensMoral), force: n0(force) }
  };
}
// Une échéance : payé ou refusé. -> { tribut, issue: "paye" | "hausse" | "alliance" | "revolte" }
// Payé quatre fois à une bande qui n'est pas rouge : l'alliance. Une bande rouge augmente sa demande tous les trois paiements, et
// pousse à la révolte. Refuser, c'est la révolte : la bande attaque (le MJ en fait une menace de sa force).
export function echeanceTribut(tribut, secret = {}, { paye = true, jour = 0 } = {}) {
  const t = structuredClone(tribut);
  if (t.etat !== "actif") return { tribut: t, issue: "" };
  if (!paye) { t.etat = "rompu"; t.rompuLe = jour; return { tribut: t, issue: "revolte" }; }
  t.payes += 1;
  t.prochain = n0(t.prochain) + n0(t.tousLes || REGLES_TRIBUT.tousLes);
  if (t.payes >= REGLES_TRIBUT.alliance && n0(secret.sensMoral) >= REGLES_TRIBUT.sensAlliance) { t.etat = "allie"; t.allieLe = jour; return { tribut: t, issue: "alliance" }; }
  if (n0(secret.sensMoral) < REGLES_TRIBUT.sensAlliance && t.payes % REGLES_TRIBUT.hausse === 0) {
    for (const r of Object.keys(t.demande)) t.demande[r] = n0(t.demande[r]) + 1;
    return { tribut: t, issue: "hausse" };
  }
  return { tribut: t, issue: "paye" };
}
export const tributsDus = (etat, jour) => (etat?.tributs ?? []).filter(t => t.etat === "actif" && n0(t.prochain) <= n0(jour));

// ------------------------------------------------------------------ l'autorité du chef
export const AUTORITE = { min: 0, max: 5, defaut: 2 };
export const REGLES_AUTORITE = {
  paroleTenue: 1, paroleManquee: -1,
  nourrir: { jours: 7, delta: 1 }, faim: { jours: 3, delta: -1 },
  voteIgnore: -1, voteIgnoreLarge: -2, large: 2 / 3,
  desertion: { seuil: 1, chance: 0.35, tousLes: 7 }, crise: 0, scissionMembres: 4,
  assaut: { haut: 4, bas: 1 }
};
export const autoriteDe = s => borner(Number.isFinite(Number(s?.autorite)) ? Number(s.autorite) : AUTORITE.defaut, AUTORITE.min, AUTORITE.max);
export function ajusterAutorite(entree, delta = 0) {
  const s = structuredClone(entree ?? {});
  s.autorite = borner(autoriteDe(entree) + Math.round(n0(delta)), AUTORITE.min, AUTORITE.max);
  return s;
}
// La parole donnée par le chef : tenue ou non. -> { system, delta }
export function tenirParole(chef, tenue = true) {
  const d = tenue ? REGLES_AUTORITE.paroleTenue : REGLES_AUTORITE.paroleManquee;
  return { system: ajusterAutorite(chef, d), delta: d };
}
// Le chef suit-il le vote ? resultat : resoudreVote ; decision : ce qu'il a décidé, "pour" (faire) ou "contre" (ne pas faire).
// -> { system, delta, suivi }
export function suivreVote(chef, resultat, decision) {
  const suivi = resultat?.majorite === "egalite" || resultat?.majorite === decision;
  if (suivi) return { system: structuredClone(chef), delta: 0, suivi: true };
  const d = n0(resultat?.part) >= REGLES_AUTORITE.large ? REGLES_AUTORITE.voteIgnoreLarge : REGLES_AUTORITE.voteIgnore;
  return { system: ajusterAutorite(chef, d), delta: d, suivi: false };
}
// Le jour du chef : nourrit-il son monde ? -> { system, delta }
export function autoriteDuJour(chef, { tousNourris = true } = {}) {
  const s = structuredClone(chef ?? {});
  const e = espritDe(s);
  const R = REGLES_AUTORITE;
  let delta = 0;
  if (tousNourris) { e.joursNourris += 1; e.joursFaim = 0; } else { e.joursFaim += 1; e.joursNourris = 0; }
  if (e.joursNourris >= R.nourrir.jours) { delta += R.nourrir.delta; e.joursNourris = 0; }
  if (e.joursFaim >= R.faim.jours) { delta += R.faim.delta; e.joursFaim = 0; }
  s.esprit = e;
  return { system: delta ? ajusterAutorite(s, delta) : s, delta };
}
// Les crises d'une autorité trop basse, une fois par semaine. membres : [{ id, system }] (le chef compris) ; chefId.
// -> { deserteur: id | "", crise: "" | "scission" | "renversement", successeur: id | "" }
export function crisesAutorite({ membres = [], chefId = "", jour = 0, hasard = Math.random } = {}) {
  const R = REGLES_AUTORITE;
  const chef = membres.find(m => m.id === chefId);
  const vide = { deserteur: "", crise: "", successeur: "" };
  if (!chef || jour % R.desertion.tousLes !== 0) return vide;
  const a = autoriteDe(chef.system);
  if (a > R.desertion.seuil) return vide;
  const vivants = membres.filter(m => m.system?.vivant !== false && !m.system?.livide);
  const autres = vivants.filter(m => m.id !== chefId);
  let deserteur = "";
  const candidats = autres.filter(m => m.system?.statut && m.system.statut !== "joueur").sort((x, y) => n0(x.system.moral) - n0(y.system.moral));
  if (candidats.length && chance(R.desertion.chance, hasard)) deserteur = candidats[0].id;
  let crise = "", successeur = "";
  if (a <= R.crise) {
    const restants = autres.filter(m => m.id !== deserteur);
    successeur = [...restants].sort((x, y) => autoriteDe(y.system) - autoriteDe(x.system))[0]?.id ?? "";
    crise = vivants.length >= R.scissionMembres ? "scission" : successeur ? "renversement" : "";
  }
  return { deserteur, crise, successeur };
}
// Le dé de défense que donne (ou retire) l'autorité du chef présent pendant un assaut.
export const bonusAutoriteAssaut = autorite => (n0(autorite) >= REGLES_AUTORITE.assaut.haut ? 1 : n0(autorite) <= REGLES_AUTORITE.assaut.bas ? -1 : 0);

// ------------------------------------------------------------------ séparation, fusion
// Partager des stocks entre deux groupes de nA et nB personnes (au prorata ; le reste au plus nombreux). part : la part de A
// (0..1) si on la décide autrement. -> { a, b }
export function partagerStocks(stocks = {}, nA = 1, nB = 1, part = null) {
  const pa = part !== null && part !== undefined ? borner(n0(part), 0, 1) : n0(nA) / Math.max(1, n0(nA) + n0(nB));
  const a = {}, b = {};
  for (const [r, q] of Object.entries(stocks)) {
    const total = Math.max(0, Math.floor(n0(q)));
    const qa = Math.floor(total * pa + 1e-9), qb = Math.floor(total * (1 - pa) + 1e-9);
    const reste = total - qa - qb;
    const versA = part !== null && part !== undefined ? pa >= 0.5 : n0(nA) >= n0(nB);
    a[r] = qa + (versA ? reste : 0); b[r] = qb + (versA ? 0 : reste);
  }
  return { a, b };
}
// Séparer un groupe. membres : [id] ; partants : [id] ; stocks ; plans : [cle] ; abriVaAux : "restants" | "partants" ; part (facultatif).
// Les plans sont du savoir : chacun les garde. -> { restants, partants, stocksRestants, stocksPartants, plansRestants, plansPartants, abri }
export function separerGroupe({ membres = [], partants = [], stocks = {}, plans = [], abriVaAux = "restants", part = null } = {}) {
  const p = membres.filter(id => partants.includes(id));
  const r = membres.filter(id => !p.includes(id));
  const { a, b } = partagerStocks(stocks, r.length, p.length, part);
  return { restants: r, partants: p, stocksRestants: a, stocksPartants: b, plansRestants: [...plans], plansPartants: [...plans], abri: abriVaAux === "partants" ? "partants" : "restants" };
}
// Fusionner deux groupes : membres, stocks et plans réunis ; l'entente part de la plus basse des deux, moins un (il faut se faire
// les uns aux autres). a, b : { membres, stocks, plans, entente }.
export function fusionnerGroupes(a = {}, b = {}) {
  const stocks = { ...(a.stocks ?? {}) };
  for (const [k, v] of Object.entries(b.stocks ?? {})) stocks[k] = n0(stocks[k]) + n0(v);
  return { membres: [...new Set([...(a.membres ?? []), ...(b.membres ?? [])])], stocks, plans: [...new Set([...(a.plans ?? []), ...(b.plans ?? [])])],
    entente: borner(Math.min(n0(a.entente), n0(b.entente)) - 1, -3, 3) };
}
