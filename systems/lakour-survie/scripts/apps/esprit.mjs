// L'esprit et le sens moral dans les fenêtres (fiche de survivant, création, fenêtre du MJ, fiche d'abri, tableau de bord) : les
// libellés, ce que chacun a le droit de voir (réglage « Visibilité du sens moral »), les listes des formulaires. Contexte pur.
// Logique : logique/esprit.mjs, moralite.mjs, porte.mjs, chefs.mjs (contrat §11).
import * as L from "../../logique/index.mjs";
import { t, reglage, libelleRessource } from "../donnees.mjs";
import { options } from "./commun.mjs";

const contenu = () => game.lakourSurvie?.contenu?.() ?? {};
export const VISIBILITES_SENS = ["soi", "tous", "mj"];

// Qui voit la couleur (le sens moral) d'un survivant : le MJ toujours ; son propriétaire si « soi » (défaut) ; tous si « tous ».
export function voitSensMoral({ gm = false, proprietaire = false } = {}) {
  const v = reglage("visibiliteSensMoral", "soi");
  return gm || v === "tous" || (v === "soi" && proprietaire);
}

export const libelleBande = bande => t(`LAKOUR_SURVIE.Sens.${bande}`);
// Une jauge −10..+10 en pourcentage (0 % rouge, 100 % bleu) et sa bande.
export const jaugeSens = v => ({ valeur: Number(v) || 0, bande: L.bandeSensMoral(v), libelle: libelleBande(L.bandeSensMoral(v)), pct: Math.round(((Number(v) || 0) + 10) * 5) });

// La foi d'un survivant en clair : « Catholique (pratiquant) », « Plusieurs : … », « Aucune — ancrage : une photo ».
export function libelleFoi(s, c = contenu()) {
  const idx = L.indexer(c);
  const nom = k => idx.religions.get(k)?.nom ?? k;
  let texte = "";
  if (s.religion === L.RELIGION_PLUSIEURS) texte = `${nom(L.RELIGION_PLUSIEURS)} : ${(s.religions ?? []).map(nom).join(", ")}`;
  else if (s.religion) texte = nom(s.religion);
  if ((!s.religion || s.religion === L.RELIGION_AUCUNE) && s.ancrage) texte = `${texte ? `${texte} — ` : ""}${t("LAKOUR_SURVIE.Esprit.Ancrage")} : ${idx.ancrages.get(s.ancrage)?.nom ?? s.ancrage}`;
  const sout = L.soutienDe(s, c);
  if (sout.source) texte += ` (${t(s.pratique ? "LAKOUR_SURVIE.Esprit.Pratiquant" : "LAKOUR_SURVIE.Esprit.NonPratiquant")})`;
  return texte;
}
// L'aide (infobulle) : ce que tient un pratiquant, ou comment s'entretient l'ancrage.
export function aideFoi(s, c = contenu()) {
  const idx = L.indexer(c);
  const sout = L.soutienDe(s, c);
  if (sout.source === "religion") return sout.cles.map(k => idx.religions.get(k)?.observance?.texte).filter(Boolean).join(" ; ");
  if (sout.source === "ancrage") return idx.ancrages.get(s.ancrage)?.texte ?? "";
  return "";
}

// Les listes des formulaires (fiche du MJ, création).
export const optionsRegards = (choisi = "", vide = true) => options([...(vide ? [["", "—"]] : []), ...L.REGARDS.map(r => [r, t(`LAKOUR_SURVIE.Regards.${r}`)])], choisi);
export const optionsReligions = (choisi = "", c = contenu(), vide = true) =>
  options([...(vide ? [["", "—"]] : []), ...L.liste(c.religions).map(r => [r.cle, r.nom])], choisi);
export const optionsReligionsMultiples = (choisies = [], c = contenu()) =>
  L.liste(c.religions).filter(r => !r.special).map(r => ({ valeur: r.cle, libelle: r.nom, choisi: (choisies ?? []).includes(r.cle) }));
export const optionsAncrages = (choisi = "", c = contenu()) => options([["", "—"], ...L.liste(c.ancrages).map(a => [a.cle, a.nom])], choisi);
export const optionsActes = (choisi = "") => options(Object.keys(L.ACTES_MORAUX).map(a => [a, `${t(`LAKOUR_SURVIE.Actes.${a}`)} (${L.ACTES_MORAUX[a] > 0 ? "+" : ""}${L.ACTES_MORAUX[a]})`]), choisi);

// L'esprit d'un survivant pour sa fiche. -> { actif, regard, foi, aideFoi, enFaute, sens (null si caché), reputation, autorite, signes,
//   chance, projet (MJ seul), chef, champs du MJ }
export function contexteEsprit(s, { gm = false, proprietaire = false, chef = false } = {}, c = contenu()) {
  const e = L.espritDe(s);
  const actif = L.espritActif(s);
  return {
    actif, gm,
    regard: s.regard ? t(`LAKOUR_SURVIE.Regards.${s.regard}`) : "", regardAide: s.regard ? t(`LAKOUR_SURVIE.Regards.Aide.${s.regard}`) : "",
    foi: libelleFoi(s, c), aideFoi: aideFoi(s, c), enFaute: actif && e.enFaute,
    sens: voitSensMoral({ gm, proprietaire }) ? jaugeSens(s.sensMoral) : null,
    reputation: jaugeSens(s.reputation),
    autorite: { valeur: L.autoriteDe(s), pct: Math.round(L.autoriteDe(s) / 5 * 100) },
    signes: actif && e.lacher > 0 ? [1, 2, 3].filter(n => n <= e.lacher).map(n => t(`LAKOUR_SURVIE.Esprit.Signes.${n}`)) : [],
    chance: gm ? e.chance : null,
    projet: gm && e.projet ? t(`LAKOUR_SURVIE.Esprit.Projet.${e.projet}`) : "",
    enfant: L.estEnfant(s),
    chef,
    // Le MJ règle tout à la main.
    regards: gm ? optionsRegards(s.regard) : [], religions: gm ? optionsReligions(s.religion, c) : [], religionsMultiples: gm ? optionsReligionsMultiples(s.religions, c) : [],
    plusieurs: s.religion === L.RELIGION_PLUSIEURS, ancrages: gm ? optionsAncrages(s.ancrage, c) : [], pratique: Boolean(s.pratique),
    sensMoral: Number(s.sensMoral) || 0, reputationValeur: Number(s.reputation) || 0, autoriteValeur: L.autoriteDe(s)
  };
}

// La liste à la porte en clair : « eau 6, médicaments 2 ».
export const texteListe = liste => (liste ?? []).map(x => `${libelleRessource(x.ressource)} ${x.manque}`).join(", ");
