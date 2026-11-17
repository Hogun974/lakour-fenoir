// La table de gestion de l'abri (lot 10, contrat §22 ; jeu 3D, complément « 4 quinquies bis » et famille 9, décidés par Jordan les
// 15 et 17 novembre 2026) : chacun a ses forces, et le travail se règle par PRIORITÉS. Logique pure.
//
// - La grille membre × tâche (état public : groupe.priorites = { acteurId: { tache: 0..4 } }) : 0, il ne la fait pas ; 1 d'abord,
//   puis 2, 3, 4. Sans grille, celle de la répartition automatique (repartir, generation.mjs) : sa tâche en 1, ce qu'il sait faire
//   en 3, le reste éteint (grilleParDefaut).
// - Chaque membre qu'on ne joue pas (compagnon, recrue, PNJ ; un joueur choisit lui-même) prend la tâche de plus haute priorité qui
//   a du travail et qu'il sait faire ; à égalité, celle où il est le meilleur (repartirParPriorites). Ce qui a du travail
//   (travailDisponible) : la garde, l'eau, la pêche, la chasse, la fouille toujours ; les soins s'il y a un blessé ou un malade ; la
//   cuisine s'il y a des vivres ; le chantier s'il y a un chantier ouvert ou une installation abîmée ; l'atelier s'il y a des
//   recettes et des matériaux ; les cultures et l'élevage s'il y a une installation de ce genre ; enseigner, jamais d'office.
// - Les QUOTAS (groupe.quotas = [{ id, acteurId, tache, jours, semaine, fait }]) : « tant de jours par semaine à telle tâche », une
//   demande suivie et affichée, SANS punition automatique (suivreQuotas, chaque jour d'avancer).
// - Les CORVÉES (contenu.corvees : { cle, nom, tache, description }) : vingt-six sous-tâches des treize tâches (puiser l'eau,
//   rapporter des troncs, nettoyer les filtres…), de la couleur pour dire ce que fait chacun ; aucun effet (groupe.corvees =
//   { acteurId: cle }).
// - Les PNJ apprennent comme les joueurs : une tâche tenue sept jours donne une marque à tout membre, joueur ou non (etat.mjs, déjà).
// Rien d'automatique ne s'impose à un joueur : la grille et les quotas ne règlent que ceux qu'on ne joue pas, et se lisent.
import { TACHES, peutFaire, niveauTache, repartir } from "./generation.mjs";
import { installationDe, liste } from "./contenu.mjs";
import { peutAgir } from "./survivant.mjs";
import { message } from "./textes.mjs";

export const PRIORITE_MAX = 4;
export const PRIORITE_DEFAUT = { repartition: 1, capable: 3 };
// Les tâches que la grille règle (les treize du §10.3).
export const TACHES_GRILLE = Object.keys(TACHES);
const n0 = x => Number(x) || 0;
const borne = p => Math.max(0, Math.min(PRIORITE_MAX, Math.round(n0(p))));

// La grille d'un membre, nettoyée (tâches connues, 0..4). -> { tache: n }
export function grilleDe(etat, id) {
  const g = etat?.groupe?.priorites?.[id];
  if (!g || typeof g !== "object") return null;
  return Object.fromEntries(TACHES_GRILLE.map(t => [t, borne(g[t])]));
}
// La grille par défaut : la tâche de la répartition automatique en 1, ce qu'il sait faire en 3, le reste éteint.
export function grilleParDefaut(system, tacheRepartie = "") {
  return Object.fromEntries(TACHES_GRILLE.map(t => [t, t === tacheRepartie ? PRIORITE_DEFAUT.repartition
    : TACHES[t] && peutFaire(system, t) ? PRIORITE_DEFAUT.capable : 0]));
}
// Régler une priorité (ou toute une grille). -> etat
export function reglerPriorites(etat, id, grille = {}) {
  const avant = etat?.groupe?.priorites?.[id] ?? {};
  const nouvelle = { ...avant };
  for (const [t, p] of Object.entries(grille ?? {})) if (TACHES_GRILLE.includes(t)) nouvelle[t] = borne(p);
  return { ...etat, groupe: { ...(etat?.groupe ?? {}), priorites: { ...(etat?.groupe?.priorites ?? {}), [id]: nouvelle } } };
}
// Effacer la grille d'un membre (il revient à la répartition automatique).
export function effacerPriorites(etat, id) {
  const p = { ...(etat?.groupe?.priorites ?? {}) };
  delete p[id];
  return { ...etat, groupe: { ...(etat?.groupe ?? {}), priorites: p } };
}

// Ce qui a du travail aujourd'hui. situation : { blesses (un blessé ou un malade), vivres (nourriture au stock), chantier (un
// chantier ouvert), abime (une installation abîmée), atelier (des matériaux et des recettes), cultures, elevage (une installation de
// ce genre en service) } -> { tache: Boolean }
export function travailDisponible(situation = {}) {
  const s = situation ?? {};
  return {
    garde: true, eau: true, peche: true, chasse: true, fouille: true, repos: true,
    soins: Boolean(s.blesses), cuisine: s.vivres !== false, chantier: Boolean(s.chantier || s.abime), atelier: Boolean(s.atelier),
    cultures: Boolean(s.cultures), elevage: Boolean(s.elevage), enseigner: false
  };
}
// La situation de l'abri pour travailDisponible. membres : [{ id, system }] ; abri : { system: { stocks }, installations } | null.
// Une installation en service compte pour la tâche de ses bras (contenu : effets.bras du niveau, ou bras sur la définition).
export function situationDeLAbri(membres = [], abri = null, contenu = {}) {
  const ins = abri?.installations ?? [];
  const stocks = abri?.system?.stocks ?? {};
  const tacheDesBras = i => {
    const def = installationDe(contenu, i.cle);
    return def?.niveaux?.[Number(i.niveau) - 1]?.effets?.bras?.tache ?? def?.bras?.tache ?? "";
  };
  const enService = tache => ins.some(i => Number(i.niveau) >= 1 && tacheDesBras(i) === tache);
  return {
    blesses: membres.some(m => peutAgir(m.system) && (n0(m.system.blessures) >= 1 || (m.system.afflictions ?? []).length)),
    vivres: n0(stocks.nourriture) > 0,
    chantier: ins.some(i => n0(i.chantier?.requis) > 0),
    abime: ins.some(i => n0(i.etat) > 0),
    atelier: n0(stocks.materiaux) > 0 && liste(contenu?.recettes).length > 0,
    cultures: enService("cultures"),
    elevage: enService("elevage")
  };
}

// La tâche que prend un membre selon sa grille : la plus haute priorité (1 d'abord) qui a du travail et qu'il sait faire ; à
// égalité, celle où il est le meilleur. -> tache | "" (aucune : il garde la sienne)
export function tacheParPriorite(system, grille, disponible, contenu = {}) {
  const candidates = TACHES_GRILLE.filter(t => n0(grille?.[t]) >= 1 && disponible?.[t] !== false && peutFaire(system, t));
  if (!candidates.length) return "";
  candidates.sort((a, b) => n0(grille[a]) - n0(grille[b]) || niveauTache(system, b, contenu) - niveauTache(system, a, contenu) || TACHES_GRILLE.indexOf(a) - TACHES_GRILLE.indexOf(b));
  return candidates[0];
}
// La répartition par priorités : pour chaque membre qu'on ne joue pas (statut autre que « joueur »), sa grille (ou la grille par
// défaut, tirée de la répartition automatique) donne sa tâche ; un joueur garde la sienne. -> { id: tache }
export function repartirParPriorites(membres = [], etat = {}, { besoins = { taches: {} }, abri = null, contenu = {}, situation = null } = {}) {
  const actifs = membres.filter(m => peutAgir(m.system));
  const auto = repartir(actifs.filter(m => m.system.statut !== "joueur"), besoins, contenu);
  const dispo = travailDisponible(situation ?? situationDeLAbri(actifs, abri, contenu));
  const sortie = {};
  for (const m of actifs) {
    if (m.system.statut === "joueur") continue;
    const grille = grilleDe(etat, m.id) ?? grilleParDefaut(m.system, auto[m.id] ?? "");
    sortie[m.id] = tacheParPriorite(m.system, grille, dispo, contenu) || auto[m.id] || "repos";
  }
  return sortie;
}

// ------------------------------------------------------------------ les quotas
// Une semaine de jeu commence le jour 0, 7, 14… ; un quota : « tant de jours cette semaine à telle tâche ».
export const semaineDe = jour => Math.floor(n0(jour) / 7);
// Poser un quota (ou le remplacer : un seul par membre et par tâche). jours : 1..7. -> { ok, etat, quota, motif }
export function poserQuota(etat, { acteurId = "", tache = "", jours = 1, jour = 0 } = {}) {
  if (!(etat?.groupe?.membres ?? []).includes(acteurId)) return { ok: false, etat, quota: null, motif: message("quota-pas-membre", {}, "il n'est pas du groupe") };
  if (!TACHES_GRILLE.includes(tache)) return { ok: false, etat, quota: null, motif: message("tache-inconnue", { tache }, `tâche inconnue « ${tache} »`) };
  const quotas = (etat.groupe.quotas ?? []).filter(q => !(q.acteurId === acteurId && q.tache === tache));
  const id = `q${(etat.groupe.quotas ?? []).reduce((n, q) => Math.max(n, Number(String(q.id).slice(1)) || 0), 0) + 1}`;
  const quota = { id, acteurId, tache, jours: Math.max(1, Math.min(7, Math.round(n0(jours)) || 1)), semaine: semaineDe(jour), fait: 0, depuis: n0(jour) };
  return { ok: true, etat: { ...etat, groupe: { ...etat.groupe, quotas: [...quotas, quota] } }, quota, motif: null };
}
export function retirerQuota(etat, id) {
  return { ...etat, groupe: { ...(etat?.groupe ?? {}), quotas: (etat?.groupe?.quotas ?? []).filter(q => q.id !== id) } };
}
// Le jour passe : chaque quota compte un jour de plus si son membre, actif, a tenu la tâche ; une nouvelle semaine repart de zéro.
// Aucune punition : le résultat dit seulement ce qui est tenu et ce qui ne l'est pas, la semaine finie (bilans).
// membres : [{ id, system }]. -> { etat, bilans: [{ id, acteurId, tache, fait, jours, tenu }] } (bilans : les semaines closes)
export function suivreQuotas(etat, membres = [], jour = 0) {
  const quotas = etat?.groupe?.quotas ?? [];
  if (!quotas.length) return { etat, bilans: [] };
  const semaine = semaineDe(jour);
  const bilans = [];
  const suivis = quotas.map(q => {
    let x = { ...q };
    if (n0(x.semaine) < semaine) {
      bilans.push({ id: x.id, acteurId: x.acteurId, tache: x.tache, fait: n0(x.fait), jours: n0(x.jours), tenu: n0(x.fait) >= n0(x.jours) });
      x = { ...x, semaine, fait: 0 };
    }
    const m = membres.find(y => y.id === x.acteurId);
    if (m && peutAgir(m.system) && m.system.tache === x.tache) x.fait = n0(x.fait) + 1;
    return x;
  });
  return { etat: { ...etat, groupe: { ...etat.groupe, quotas: suivis } }, bilans };
}
// Où en est un quota : { fait, jours, reste, tenu }.
export const etatDuQuota = q => ({ fait: n0(q?.fait), jours: n0(q?.jours), reste: Math.max(0, n0(q?.jours) - n0(q?.fait)), tenu: n0(q?.fait) >= n0(q?.jours) });

// ------------------------------------------------------------------ les corvées
// Les corvées d'une tâche (contenu.corvees). -> [corvée]
export const corveesDe = (contenu = {}, tache = "") => liste(contenu?.corvees).filter(c => !tache || c.tache === tache);
// Donner une corvée à un membre (de la couleur : ce qu'il fait au juste ; vide : rien de précis). -> etat
export function donnerCorvee(etat, acteurId, cle = "") {
  const c = { ...(etat?.groupe?.corvees ?? {}) };
  if (cle) c[acteurId] = String(cle); else delete c[acteurId];
  return { ...etat, groupe: { ...(etat?.groupe ?? {}), corvees: c } };
}
// Vérifier les corvées du contenu (forme, tâche connue). -> [texte]
export function verifierCorvees(contenu = {}) {
  const e = [];
  const vues = new Set();
  for (const c of liste(contenu?.corvees)) {
    if (!c?.cle || vues.has(c.cle)) e.push(`corvée ${c?.cle ?? "?"} : clé absente ou en double`);
    vues.add(c?.cle);
    if (!TACHES_GRILLE.includes(c?.tache)) e.push(`corvée ${c?.cle} : tâche « ${c?.tache} » inconnue`);
    if (!String(c?.nom ?? "").trim()) e.push(`corvée ${c?.cle} : sans nom`);
  }
  return e;
}
