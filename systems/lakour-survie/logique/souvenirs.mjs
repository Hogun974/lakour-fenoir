// Les souvenirs (lot « fetes », 2026-11-13) : ce qu'une fête, un vœu ou l'autel laissent derrière eux pendant quelques jours, et le
// deuil d'un mort à qui l'on n'a pas encore donné le repos. Rien de magique : tout agit par le moral (le plafond où le moral remonte
// chaque jour), par la lumière qu'on laisse voir, par l'hygiène d'un abri tenu propre, par le sang-froid. Logique pure.
//
// État public (etat.souvenirs, liste ; une partie d'avant n'en a pas : aucun effet) :
//   { cle, source, depuis (jour), jusqua (jour, ou null : tant que le MJ ne le clôt pas, un vœu), moral (plafond ±), qui ([ids] ou
//     null : tout le groupe), visibilite (lueur de l'abri, en plus), hygiene (Boolean : risque des maladies × 0,5), sangFroid (dés de
//     défense contre une horde), voeu (Boolean) }
// Deuil (etat.morts, releve.mjs) : un mort du groupe sans repos pèse sur tous : plafond du moral −1 (DEUIL). Le soutien des souvenirs
// se cumule jusqu'à +2 (SOUTIEN_MAX) ; la lueur jusqu'à +4 (LUEUR_MAX).
export const SOUTIEN_MAX = 2;
export const LUEUR_MAX = 4;
export const DEUIL = { plafond: -1, choc: -1 };
export const SOUVENIRS_MAX = 40;

export const souvenirActif = (s, jour) => Number(s?.depuis ?? 0) <= Number(jour) && (s?.jusqua === null || s?.jusqua === undefined || Number(s.jusqua) >= Number(jour));
export const souvenirsActifs = (etat, jour) => (etat?.souvenirs ?? []).filter(s => souvenirActif(s, jour));
const pour = (s, id) => !Array.isArray(s.qui) || !s.qui.length || s.qui.includes(id);

// Un souvenir de plus (les plus anciens finis tombent au-delà de SOUVENIRS_MAX). -> etat
export function ajouterSouvenir(etat, s) {
  const liste = [...(etat?.souvenirs ?? []), { cle: s.cle ?? s.source ?? "souvenir", source: s.source ?? "", depuis: Number(s.depuis) || 0,
    jusqua: s.jusqua === null ? null : Number(s.jusqua ?? s.depuis ?? 0), moral: Number(s.moral) || 0, qui: Array.isArray(s.qui) && s.qui.length ? [...s.qui] : null,
    visibilite: Number(s.visibilite) || 0, hygiene: Boolean(s.hygiene), sangFroid: Number(s.sangFroid) || 0, voeu: Boolean(s.voeu) }];
  return { ...etat, souvenirs: liste.slice(-SOUVENIRS_MAX) };
}
// Les souvenirs finis avant `jour` s'effacent. -> etat
export const oublierSouvenirs = (etat, jour) => (etat?.souvenirs?.length
  ? { ...etat, souvenirs: etat.souvenirs.filter(s => s.jusqua === null || s.jusqua === undefined || Number(s.jusqua) >= Number(jour)) } : etat);
// Clore un souvenir (un vœu tenu ou rompu) : il finit la veille de `jour`. -> etat
export function clore(etat, filtre, jour) {
  return { ...etat, souvenirs: (etat?.souvenirs ?? []).map(s => (filtre(s) && souvenirActif(s, jour) ? { ...s, jusqua: Number(jour) - 1 } : s)) };
}

// Le deuil : un mort du groupe sans repos.
export const deuil = etat => (etat?.morts ?? []).some(m => !m.repos);
// Le plafond du moral d'un survivant ce jour-là : soutien des souvenirs (au plus +2) et deuil (−1).
export function espritDuJour(etat, id, jour) {
  const soutien = Math.min(SOUTIEN_MAX, souvenirsActifs(etat, jour).filter(s => pour(s, id)).reduce((t, s) => t + Math.max(0, s.moral), 0));
  return soutien + (deuil(etat) ? DEUIL.plafond : 0);
}
export const lueurDuJour = (etat, jour) => Math.min(LUEUR_MAX, souvenirsActifs(etat, jour).reduce((t, s) => t + Math.max(0, Number(s.visibilite) || 0), 0));
export const hygieneDuJour = (etat, jour) => souvenirsActifs(etat, jour).some(s => s.hygiene);
export const sangFroidDuJour = (etat, jour) => Math.max(0, ...souvenirsActifs(etat, jour).map(s => Number(s.sangFroid) || 0));
export const voeuxDe = (etat, id, jour) => souvenirsActifs(etat, jour).filter(s => s.voeu && pour(s, id));
