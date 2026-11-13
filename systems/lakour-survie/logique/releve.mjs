// La mort et ce qui reste (lot « fetes », 2026-11-13 ; famille 6 du complément de Fénoir 3D) : la RELÈVE (à la mort de son
// survivant, le joueur choisit un nouveau tirage ou un autre survivant de son groupe, d'au moins 16 ans, déjà sur place), les
// JEUNES de 16 à 18 ans, les MORTS du groupe (l'autel de l'abri porte leurs noms), le DEUIL et le REPOS qu'on leur donne. Logique
// pure : chaque fonction rend un nouvel état.
//
// Nombres retenus (docs/equilibre-fetes.md) :
// - Relève : 16 ans au moins (REGLES_RELEVE.ageMin) ; candidats : les membres vivants du groupe qui ne sont pas déjà le survivant
//   d'un joueur (compagnons, recrues, PNJ), et les PNJ légers du groupe (groupe.pnj : le système leur tire alors une fiche, d'après
//   leur nom et leur passé). Le repris cesse son travail pour le groupe : sa tâche revient au joueur (« repos » en attendant).
// - Jeune (moins de 18 ans, l'âge avançant d'un an tous les 365 jours de jeu depuis `ageJour`) : porte 2/3 d'un adulte, travaille
//   aux 3/4 (chantiers, tâches à bras), vote à moitié, ne peut pas être chef (peutEtreChef : pour le lot qui fera les chefs).
// - Morts : chaque mort du groupe s'inscrit (etat.morts) : le choc ôte 1 de moral à chaque vivant du groupe (DEUIL.choc) ; tant
//   qu'il n'a pas reçu le repos, le deuil pèse (plafond du moral −1, souvenirs.mjs). Un mort relevé en Livide n'est pas
//   « retrouvé » : il faut retrouver son corps (ou lui donner le repos, Livide) avant la cérémonie.
// - Repos : une cérémonie à l'abri, un mort retrouvé à la fois (1 quart) ; à la Toussaint (fête « halloween » de Fénoir), tous les
//   morts retrouvés d'un coup.
// - Autel des morts (installation à `effets.autel`) : l'honorer (un quart, une offrande d'une ration) une fois tous les 7 jours au
//   plus : +1 de moral à chacun, et un souvenir qui soutient le moral (+1) pendant 7 jours. Il faut un nom sur l'autel.
import { message } from "./textes.mjs";
import { ajouterSouvenir, DEUIL } from "./souvenirs.mjs";

export const REGLES_RELEVE = { ageMin: 16, ageAdulte: 18, travail: 0.75, charge: 2 / 3, vote: 0.5, statutsRepris: ["compagnon", "recrue", "pnj"] };
export const REGLES_AUTEL = { delai: 7, moral: 1, soutien: { moral: 1, jours: 7 }, offrande: { nourriture: 1 }, quarts: 1 };
export const REGLES_REPOS = { quarts: 1 };
export const MORTS_MAX = 200;

// L'âge d'un survivant au jour de jeu `jour` : son âge noté au jour `ageJour` (0 : le jour zéro), plus un an tous les 365 jours.
export const ageAuJour = (system, jour = 0) => (Number(system?.age) || 0) + Math.max(0, Math.floor((Number(jour) - (Number(system?.ageJour) || 0)) / 365));
export const estJeune = (system, jour = 0) => ageAuJour(system, jour) < REGLES_RELEVE.ageAdulte;
export const peutEtreChef = (system, jour = 0) => !estJeune(system, jour);
export const poidsVote = (system, jour = 0) => (estJeune(system, jour) ? REGLES_RELEVE.vote : 1);
export const poidsTravail = (system, jour = 0) => (estJeune(system, jour) ? REGLES_RELEVE.travail : 1);
export const poidsCharge = (system, jour = 0) => (estJeune(system, jour) ? REGLES_RELEVE.charge : 1);
// Les bras d'une équipe (somme des poids de travail) et ses porteurs (somme des poids de charge). membres : [system].
export const brasDe = (membres = [], jour = 0) => membres.reduce((t, s) => t + poidsTravail(s, jour), 0);
export const porteursDe = (membres = [], jour = 0) => membres.reduce((t, s) => t + poidsCharge(s, jour), 0);

const vivant = s => s?.vivant !== false && !s?.livide;

// Les survivants que le joueur peut reprendre. membres : [{ id, nom, system }] (le groupe) ; mortId : le survivant qui vient de
// mourir ; jour : le jour de jeu. -> [{ id, nom, source: "membre" | "pnj", statut, age, jeune, tache, passe, travail }]
export function candidatsReleve({ etat, membres = [], mortId = "", jour = 0 } = {}) {
  const ids = new Set(etat?.groupe?.membres ?? []);
  const statuts = etat?.groupe?.statuts ?? {};
  const liste = [];
  for (const m of membres) {
    if (!ids.has(m.id) || m.id === mortId || !vivant(m.system)) continue;
    const statut = m.system?.statut || statuts[m.id] || "pnj";
    if (!REGLES_RELEVE.statutsRepris.includes(statut)) continue;
    const age = ageAuJour(m.system, jour);
    if (age < REGLES_RELEVE.ageMin) continue;
    liste.push({ id: m.id, nom: m.nom ?? m.system?.nom ?? m.id, source: "membre", statut, age, jeune: age < REGLES_RELEVE.ageAdulte, tache: m.system?.tache ?? "" });
  }
  for (const p of etat?.groupe?.pnj ?? []) {
    if (p.etat === "mort" || p.repris) continue;
    liste.push({ id: p.id, nom: p.nom, source: "pnj", statut: "pnj", age: null, jeune: false, tache: "", passe: p.passe ?? "", travail: p.travail !== false });
  }
  return liste;
}

// Le joueur reprend un survivant de son groupe. candidat : { id, source } ; acteurId : l'acteur qui le porte (pour un PNJ léger,
// la fiche que le système vient de lui tirer) ; tache : ce qu'il faisait pour le groupe. -> { ok, motif, etat, tacheLaissee }
export function reprendre(etat, { mortId = "", candidat = null, acteurId = "", tache = "", quart = 0, nom = "" } = {}) {
  const refus = (cle, params = {}, texte = cle) => ({ ok: false, motif: message(cle, params, texte), etat, tacheLaissee: "" });
  if (!candidat?.id) return refus("releve-sans-candidat", {}, "personne à reprendre");
  const e = structuredClone(etat);
  e.groupe = { ...e.groupe, statuts: { ...(e.groupe?.statuts ?? {}) } };
  let tacheLaissee = tache;
  if (candidat.source === "pnj") {
    const p = (e.groupe.pnj ?? []).find(x => x.id === candidat.id);
    if (!p || p.etat === "mort" || p.repris) return refus("releve-sans-candidat", {}, "personne à reprendre");
    if (!acteurId) return refus("releve-sans-fiche", {}, "il faut sa fiche");
    // Le PNJ léger cesse son travail pour le groupe : il quitte la liste des PNJ (il a maintenant sa fiche, parmi les membres).
    tacheLaissee = p.travail !== false ? (p.tache || "travail") : "";
    e.groupe.pnj = (e.groupe.pnj ?? []).filter(x => x.id !== candidat.id);
    if (!(e.groupe.membres ?? []).includes(acteurId)) e.groupe.membres = [...(e.groupe.membres ?? []), acteurId];
  } else if (!(e.groupe.membres ?? []).includes(candidat.id)) return refus("releve-pas-du-groupe", {}, "pas du groupe");
  const id = candidat.source === "pnj" ? acteurId : candidat.id;
  e.groupe.statuts[id] = "joueur";
  e.releves = [...(e.releves ?? []), { quart: Number(quart) || 0, mort: mortId, repris: id, nom, source: candidat.source, tacheLaissee }].slice(-50);
  return { ok: true, motif: null, etat: e, tacheLaissee };
}

// ------------------------------------------------------------------ morts, deuil, repos
// Les morts du groupe pas encore inscrits (vivant faux ou Livide). membres : [{ id, nom, system }] ; region : où le groupe est.
// -> { etat, nouveaux: [entrée] } ; entrée : { id, nom, quart, region, retrouve (le corps est là : pas relevé), repos, livide }
export function inscrireMorts(etat, membres = [], { quart = 0, region = "" } = {}) {
  const deja = new Set((etat?.morts ?? []).map(m => m.id));
  const ids = new Set(etat?.groupe?.membres ?? []);
  const nouveaux = membres.filter(m => ids.has(m.id) && !deja.has(m.id) && !vivant(m.system))
    .map(m => ({ id: m.id, nom: m.nom ?? m.id, quart: Number(quart) || 0, region, retrouve: !m.system?.livide, repos: false, livide: Boolean(m.system?.livide) }));
  if (!nouveaux.length) return { etat, nouveaux };
  return { etat: { ...etat, morts: [...(etat.morts ?? []), ...nouveaux].slice(-MORTS_MAX) }, nouveaux };
}
// Un nom sur l'autel à la main (un PNJ léger mort, un proche) : { nom, retrouve }. -> etat
export function ajouterMort(etat, { id = "", nom = "", quart = 0, region = "", retrouve = true } = {}) {
  if (!String(nom).trim()) return etat;
  const cle = id || `mort-${(etat?.morts ?? []).length + 1}`;
  if ((etat?.morts ?? []).some(m => m.id === cle)) return etat;
  return { ...etat, morts: [...(etat?.morts ?? []), { id: cle, nom: String(nom).trim().slice(0, 80), quart, region, retrouve: Boolean(retrouve), repos: false, livide: false }].slice(-MORTS_MAX) };
}
export const choc = () => DEUIL.choc;
const trouverMort = (etat, ref) => (etat?.morts ?? []).find(m => m.id === ref || m.nom === ref) ?? null;

// Le corps est retrouvé (ou le Livide qu'il est devenu a reçu le repos). -> { ok, motif, etat }
export function retrouverMort(etat, ref) {
  const m = trouverMort(etat, ref);
  if (!m) return { ok: false, motif: message("mort-inconnu", { nom: ref }, `mort inconnu : ${ref}`), etat };
  return { ok: true, motif: null, etat: { ...etat, morts: etat.morts.map(x => (x === m ? { ...x, retrouve: true } : x)) } };
}
// Donner le repos à un mort retrouvé (cérémonie, REGLES_REPOS.quarts). -> { ok, motif, etat, mort }
export function donnerRepos(etat, ref, { jour = 0 } = {}) {
  const m = trouverMort(etat, ref);
  if (!m) return { ok: false, motif: message("mort-inconnu", { nom: ref }, `mort inconnu : ${ref}`), etat, mort: null };
  if (m.repos) return { ok: false, motif: message("mort-deja-repos", { nom: m.nom }, `${m.nom} repose déjà`), etat, mort: m };
  if (!m.retrouve) return { ok: false, motif: message("mort-pas-retrouve", { nom: m.nom }, `il faut d'abord retrouver ${m.nom}`), etat, mort: m };
  return { ok: true, motif: null, mort: m, etat: { ...etat, morts: etat.morts.map(x => (x === m ? { ...x, repos: true, reposLe: Number(jour) || 0 } : x)) } };
}
// La Toussaint : le repos pour tous les morts retrouvés. -> { etat, reposes: [noms], restent: [noms] (pas retrouvés) }
export function reposerRetrouves(etat, { jour = 0 } = {}) {
  const reposes = [], restent = [];
  const morts = (etat?.morts ?? []).map(m => {
    if (m.repos) return m;
    if (!m.retrouve) { restent.push(m.nom); return m; }
    reposes.push(m.nom);
    return { ...m, repos: true, reposLe: Number(jour) || 0 };
  });
  return { etat: { ...etat, morts }, reposes, restent };
}

// Honorer l'autel des morts. autel : l'abri a un autel en service ; jour : le jour de jeu. -> { ok, motif, etat }
export function honorerAutel(etat, { jour = 0, autel = false, qui = null } = {}) {
  const refus = (cle, params, texte) => ({ ok: false, motif: message(cle, params, texte), etat });
  if (!autel) return refus("autel-absent", {}, "il faut un autel des morts à l'abri");
  if (!(etat?.morts ?? []).length) return refus("autel-vide", {}, "aucun nom sur l'autel");
  const dernier = etat?.autel?.honoreLe;
  if (dernier !== null && dernier !== undefined && Number(jour) - Number(dernier) < REGLES_AUTEL.delai) {
    return refus("autel-trop-tot", { n: REGLES_AUTEL.delai - (Number(jour) - Number(dernier)) }, "trop tôt");
  }
  let e = { ...etat, autel: { ...(etat.autel ?? {}), honoreLe: Number(jour) } };
  e = ajouterSouvenir(e, { cle: "autel", source: "autel", depuis: Number(jour), jusqua: Number(jour) + REGLES_AUTEL.soutien.jours - 1, moral: REGLES_AUTEL.soutien.moral, qui });
  return { ok: true, motif: null, etat: e };
}
