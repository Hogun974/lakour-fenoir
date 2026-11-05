// Les fêtes du jour de JEU de Fénoir (contrat §6, §9) : la date de jeu (dateDepart + jour), pas l'horloge du navigateur.
//
// Les dates et les fenêtres viennent du socle des fêtes du moteur (lakour-mj-ia, docs/fetes.md) : api.fetes.calendrier(date) rend
// les fêtes du calendrier à n'importe quelle date ; on lui donne la date de JEU. Le registre du contenu (donnees.fetes) dit ce
// que chaque fête devient à Fénoir (nom, description, consigne), sous la clé de la fête du socle (« noel », « liberte »…). Un
// registre qui daterait lui-même ses fêtes (date « MM-JJ », dates par année, fenêtre avant / après) est lu aussi.
//
// Le socle calcule SA fête du monde d'après la date locale du navigateur, sauf si le monde lui donne sa date
// (api.fetes.sourceDeDate, MJ IA après la 0.41.0) : on la lui donne au crochet « lakour-mj-ia.pret », dans chaque navigateur,
// AVANT son premier calcul (brancherDateDuJeu : la date de JEU si « fetesSuiventLeJeu » est coché, sinon null, la date du
// navigateur), et il revoit sa fête quand la date de jeu change (revoirFeteDuJeu). Sans cela, au chargement d'un monde neuf, il
// posait la carte de la fête de la date RÉELLE (la Dipavali le 5 novembre 2026, pour un jeu au 4 décembre) avant que l'on ait pu
// forcer son réglage. Un moteur plus ancien n'a pas de source de date : son réglage monde « fete » force alors une fête (ou
// « aucune ») ; chez le MJ actif, si « fetesSuiventLeJeu » est coché, on y écrit la fête du jour de JEU quand le monde la
// décline (sinon « aucune »). Avec la source de date, ce réglage revient à « auto ». Décoché : « auto » (une fois).
// Chaque fête du jour de jeu paraît aussi au journal public et dans les alertes (l'état du jeu du narrateur les lit).
import { estMJActif } from "./canal.mjs";
import { reglage, MODULE_MJIA } from "./donnees.mjs";

const MS = 86400000;
const versJour = iso => {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(iso ?? ""));
  return m ? Math.round(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])) / MS) : null;
};
// Le calendrier du socle du moteur (s'il est là) : (Date) -> [{ id, nom, debut, fin, coeur }].
export const calendrierDuMoteur = () => {
  const c = globalThis.game?.modules?.get?.(MODULE_MJIA)?.api?.fetes?.calendrier;
  return typeof c === "function" ? c : null;
};

// Les fêtes de ce jour de jeu (« AAAA-MM-JJ ») -> [{ cle, nom, moteur, coeur, description, consigne }], le cœur d'abord.
export function fetesDuJeu(iso, fetes = [], calendrier = calendrierDuMoteur()) {
  const n = versJour(iso);
  if (n === null) return [];
  const actives = new Map();
  // 1. Le socle du moteur, à la date de jeu (midi, heure locale : le socle lit le jour local).
  if (typeof calendrier === "function") {
    const [a, mo, j] = String(iso).slice(0, 10).split("-").map(Number);
    let jour = [];
    try { jour = calendrier(new Date(a, mo - 1, j, 12)) ?? []; } catch { jour = []; }
    for (const c of jour) {
      const f = (fetes ?? []).find(x => x.cle === c.id || x.moteur === c.id);
      if (f && !actives.has(f.cle)) actives.set(f.cle, { cle: f.cle, nom: f.nom ?? c.nom, moteur: c.id, coeur: Boolean(c.coeur), description: f.description ?? "", consigne: f.consigne ?? "" });
    }
  }
  // 2. Les fêtes que le registre date lui-même.
  const annee = Number(String(iso).slice(0, 4));
  for (const f of fetes ?? []) {
    if (actives.has(f.cle)) continue;
    for (const a of [annee - 1, annee, annee + 1]) {
      const mmjj = f.dates?.[String(a)] ?? f.date;
      if (!mmjj) continue;
      const j = versJour(`${a}-${mmjj}`);
      if (j !== null && n >= j - (Number(f.avant) || 0) && n <= j + (Number(f.apres) || 0)) {
        actives.set(f.cle, { cle: f.cle, nom: f.nom, moteur: f.moteur ?? null, coeur: n === j, description: f.description ?? "", consigne: f.consigne ?? "" });
        break;
      }
    }
  }
  return [...actives.values()].sort((x, y) => Number(y.coeur) - Number(x.coeur));
}

// Une fête par sa clé, l'id du socle (« noel », « liberte »…) ou l'id de sa déclinaison (« fenoir-<cle> »).
export function trouverFete(reference, fetes = []) {
  const r = String(reference ?? "").trim();
  if (!r) return null;
  return (fetes ?? []).find(f => f.cle === r || `fenoir-${f.cle}` === r || (f.moteur && f.moteur === r)) ?? null;
}

// Le socle des fêtes du moteur (api.fetes) suit-il une date de monde (sourceDeDate) ?
export const fetesDuMoteur = () => globalThis.game?.modules?.get?.(MODULE_MJIA)?.api?.fetes ?? null;
export const moteurSuitLaDate = (fetes = fetesDuMoteur()) => typeof fetes?.sourceDeDate === "function";

// Au crochet « lakour-mj-ia.pret » (api du moteur), dans chaque navigateur : la date des fêtes du moteur devient la date de JEU
// (dateDuJeu : () => « AAAA-MM-JJ »), ou celle du navigateur si « fetesSuiventLeJeu » est décoché. -> true si le moteur l'accepte.
export function brancherDateDuJeu(api, dateDuJeu) {
  if (!moteurSuitLaDate(api?.fetes)) return false;
  api.fetes.sourceDeDate(() => (reglage("fetesSuiventLeJeu", true) ? dateDuJeu() : null));
  return true;
}

// Dans chaque navigateur, quand l'état de la partie change : si la date de jeu a changé, le moteur revoit sa fête (décor, ligne
// du narrateur, carte chez le MJ actif). -> true si une vérification est demandée.
let dateRevue = null;
export function revoirFeteDuJeu(iso, { forcer = false } = {}) {
  const f = fetesDuMoteur();
  if (!moteurSuitLaDate(f) || (iso === dateRevue && !forcer)) return false;
  dateRevue = iso;
  Promise.resolve().then(() => f.verifier?.()).catch(e => console.warn(`${MODULE_MJIA} | fêtes`, e));
  return true;
}

// L'id du calendrier à forcer au moteur pour ce jour de jeu : la fête d'une déclinaison enregistrée, sinon « aucune ».
// declinaisons : api.fetes.lister() du moteur ([{ id, fete }]).
export function feteMoteurPour(fetesDuJour = [], declinaisons = []) {
  for (const f of fetesDuJour) {
    const id = f.moteur ?? f.cle;
    const d = declinaisons.find(x => x.fete === id || x.id === `fenoir-${f.cle}`);
    if (d) return d.fete;
  }
  return "aucune";
}

// Chez le MJ actif : le réglage « fete » du moteur suit la date de jeu. -> la valeur écrite, ou null (rien à faire).
// bascule : le réglage du système vient d'être décoché (on rend « auto » au moteur, une fois ; ensuite, le choix du MJ reste).
export async function suivreFetesDuJeu(iso, fetes, { bascule = false } = {}) {
  if (!estMJActif()) return null;
  const moteur = game.modules?.get?.(MODULE_MJIA);
  const api = moteur?.api?.fetes;
  if (!moteur?.active && !api) return null;
  let actuel;
  try { actuel = game.settings.get(MODULE_MJIA, "fete"); } catch { return null; }
  const suivre = reglage("fetesSuiventLeJeu", true);
  // Le réglage vient de changer : un moteur qui suit la date de jeu la relit (source de date) ; revue de sa fête.
  if (bascule) revoirFeteDuJeu(iso, { forcer: true });
  if (!suivre && !bascule) return null;
  // Avec la source de date, le moteur trouve lui-même la fête du jour de jeu : son réglage reste (ou revient) à « auto ».
  const voulu = suivre && !moteurSuitLaDate(api) ? feteMoteurPour(fetesDuJeu(iso, fetes), api?.lister?.() ?? []) : "auto";
  if (actuel === voulu) return null;
  await game.settings.set(MODULE_MJIA, "fete", voulu);
  return voulu;
}
