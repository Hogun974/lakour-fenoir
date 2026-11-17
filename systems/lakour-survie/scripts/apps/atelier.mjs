// L'atelier (contrat §9, repris de l'établi de Warcraft) : les recettes possibles, et pourquoi pas les autres (savoir-faire,
// installation, matières qui manquent). Le MJ fait fabriquer (game.lakourSurvie.fabriquer : test de la compétence de la
// recette, coût payé, produit) ; un joueur le propose au MJ (proposition « fabriquer »).
import { ID } from "../../logique/constantes.mjs";
import * as L from "../../logique/index.mjs";
import { t, lireEtat, sansBalises, localiser, libelleCompetence, libelleRessource, survivantsDuGroupe } from "../donnees.mjs";
import { CHEMIN, essayer, lireChamps, options } from "./commun.mjs";
import { texteAtelierRequis } from "./fiches.mjs";

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;
const contenu = () => game.lakourSurvie?.contenu?.() ?? {};

export function contexteAtelier() {
  const c = contenu();
  const etat = lireEtat();
  const api = game.lakourSurvie;
  const recettes = L.liste(c.recettes).map(r => {
    const v = api.peutFabriquer(r.cle);
    const idx = L.indexer(c);
    const produit = r.produit?.equipement ? (idx.equipements.get(r.produit.equipement)?.nom ?? r.produit.equipement) : r.produit?.ressource ? libelleRessource(r.produit.ressource)
      : r.produit?.traitement ? t("LAKOUR_SURVIE.Ateliers.Traitement", { jours: r.produit.jours ?? 1 }) : "";
    // Lot 6 « ateliers » : les noms des métiers, des outils et des objets dans les motifs de refus ; où se fait la recette.
    const motifs = (v.motifs?.length ? v.motifs : []).map(m => (m.cle === "requiert-atelier" ? { ...m, params: { ...m.params, metier: t(`LAKOUR_SURVIE.Metiers.${m.params.metier}`) } }
      : m.cle === "outil-manquant" ? { ...m, params: { ...m.params, outil: t(`LAKOUR_SURVIE.Gammes.${m.params.outil}`) } }
        : m.cle === "objet-manquant" ? { ...m, params: { ...m.params, objet: idx.equipements.get(m.params.objet)?.nom ?? m.params.objet } } : m));
    const ou = r.requiert?.installation ? texteAtelierRequis(r.requiert.installation) : r.sac ? t("LAKOUR_SURVIE.Ateliers.DepuisLeSac") : t("LAKOUR_SURVIE.Ateliers.ALAbri");
    const besoins = [...(r.outils ?? []).map(g => t(`LAKOUR_SURVIE.Gammes.${g}`)), ...(r.objets ?? []).map(o => `${o.n ?? 1} × ${idx.equipements.get(o.cle)?.nom ?? o.cle}`)].join(", ");
    return {
      cle: r.cle, nom: r.nom, ok: v.ok, raisons: (motifs.length ? motifs : v.raisons ?? []).map(localiser), aide: sansBalises(r.description ?? ""), ou, besoins,
      lumiere: Boolean(r.lumiere),
      cout: Object.entries(r.cout ?? {}).filter(([, q]) => Number(q)).map(([k, q]) => `${q} ${libelleRessource(k).toLowerCase()}`).join(", ") || "—",
      travail: r.travail, competence: libelleCompetence(r.competence ?? "bricolage"), difficulte: t(`LAKOUR_SURVIE.Difficultes.${r.difficulte ?? "normale"}`),
      produit: `${produit}${Number(r.produit?.n) > 1 ? ` × ${r.produit.n}` : ""}`
    };
  }).sort((a, b) => Number(b.ok) - Number(a.ok) || a.nom.localeCompare(b.nom));
  const possibles = recettes.filter(r => r.ok).length;
  return {
    gm: game.user.isGM, demarree: Boolean(etat.demarree), recettes,
    possibles, intro: t("LAKOUR_SURVIE.Atelier.Intro", { n: possibles }),   // par t() : pluriel accordé
    artisans: options([["", t("LAKOUR_SURVIE.Atelier.LeMeilleur")], ...survivantsDuGroupe(etat).filter(a => L.peutAgir(a.system)).map(a => [a.id, a.name])], "")
  };
}

export class Atelier extends HandlebarsApplicationMixin(ApplicationV2) {
  static DEFAULT_OPTIONS = {
    id: `${ID}-atelier`,
    classes: [ID, "survie-atelier"],
    position: { width: 760, height: 700 },
    window: { title: "LAKOUR_SURVIE.Atelier.Titre", icon: "fa-solid fa-screwdriver-wrench", resizable: true },
    actions: { fabriquer: Atelier.#fabriquer }
  };
  static PARTS = { corps: { template: `${CHEMIN}/atelier.hbs`, scrollable: [".survie-corps"] } };

  async _prepareContext() { return contexteAtelier(); }

  static async #fabriquer(event, cible) {
    const cle = cible.dataset.recette;
    const d = lireChamps(this.element.querySelector(".survie-atelier-tete"));
    if (game.user.isGM) await essayer(() => game.lakourSurvie.fabriquer({ recette: cle, acteurId: d.artisan || "" }));
    else {
      const nom = L.indexer(contenu()).recettes.get(cle)?.nom ?? cle;
      const r = await essayer(() => game.lakourSurvie.proposer({ type: "fabriquer", details: nom }));
      if (r) ui.notifications.info(t("LAKOUR_SURVIE.Proposition.Envoyee"));
    }
    this.render();
  }
}

let fenetre = null;
export const atelier = () => (fenetre ??= new Atelier());
export const ouvrirAtelier = () => atelier().render({ force: true });
