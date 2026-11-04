// Le bandeau de survie (repris du bandeau des Veillées), en haut de l'écran, chez tous : jour, moment, date, saison et météo,
// phase de la crise, stocks d'eau et de nourriture en jours, alertes récentes, la tâche de mon survivant ; boutons du tableau
// de bord, de l'atelier, de ma fiche (et de la fenêtre du MJ). Repliable (réglage client). Seulement l'état PUBLIC.
import { ID } from "../../logique/constantes.mjs";
import { t, lireEtat, reglage, monSurvivant, libelleMoment, libellePhase, libelleTache, sansBalises } from "../donnees.mjs";
import { CHEMIN, jours } from "./commun.mjs";

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;
const ICONES_MOMENT = { matin: "fa-sun", "apres-midi": "fa-cloud-sun", soir: "fa-cloud-moon", nuit: "fa-moon" };
const ICONES_METEO = { cyclone: "fa-hurricane", pluie: "fa-cloud-showers-heavy" };

// Le contenu du bandeau pour l'utilisateur courant (pur, éprouvé hors Foundry).
export function contexteBandeau() {
  const etat = lireEtat();
  const replie = reglage("bandeauReplie", false);
  const gm = Boolean(game.user?.isGM);
  if (!etat.demarree) return { demarree: false, gm, replie, titre: t("LAKOUR_SURVIE.Bandeau.Attente") };
  const q = game.lakourSurvie.quand();
  const b = etat.bilan;
  const moi = monSurvivant();
  const recentes = (etat.alertes ?? []).filter(a => Number(a.quart) >= q.quart - 8).slice(-3).reverse();
  const meteo = etat.meteo?.temps ?? "";
  return {
    demarree: true, gm, replie,
    jour: q.jour, moment: libelleMoment(q.moment), momentCle: q.moment, iconeMoment: ICONES_MOMENT[q.moment] ?? "fa-sun", heure: q.heure,
    date: q.dateTexte, saison: t(`LAKOUR_SURVIE.Saisons.${q.saison}`), phase: libellePhase(q.phase), phaseCle: q.phase,
    meteo: meteo ? { cle: meteo, texte: t(`LAKOUR_SURVIE.Meteo.${meteo}`), icone: ICONES_METEO[meteo] } : null,
    fetes: (q.fetes ?? []).map(f => f.nom).join(", "),
    stocks: b ? [
      { cle: "eau", libelle: t("LAKOUR_SURVIE.Ressources.eau"), icone: "fa-droplet", jours: jours(b.joursDeStocks?.eau), bas: Number(b.joursDeStocks?.eau) <= 2 },
      { cle: "nourriture", libelle: t("LAKOUR_SURVIE.Ressources.nourriture"), icone: "fa-bowl-rice", jours: jours(b.joursDeStocks?.nourriture), bas: Number(b.joursDeStocks?.nourriture) <= 2 }
    ] : [],
    autonome: Boolean(etat.autonome), joursAutonomes: etat.joursAutonomes ?? 0,
    enRoute: etat.groupe?.enRoute ? t("LAKOUR_SURVIE.Bandeau.EnRoute", { n: etat.groupe.enRoute.reste }) : "",
    alertes: recentes.map(a => ({ type: a.type, texte: sansBalises(a.texte) })),
    alerteAide: recentes.map(a => sansBalises(a.texte)).join(" — "),
    moi: moi ? { id: moi.id, nom: moi.name, tache: libelleTache(moi.system?.tache) } : null,
    creer: !gm && !moi && reglage("creationOuverte", true)
  };
}

export class BandeauSurvie extends HandlebarsApplicationMixin(ApplicationV2) {
  static DEFAULT_OPTIONS = {
    id: `${ID}-bandeau`,
    classes: [ID, "survie-bandeau"],
    tag: "section",
    window: { frame: false, positioned: false },
    actions: {
      bandeauReplier: async () => { await game.settings.set(ID, "bandeauReplie", !reglage("bandeauReplie", false)); rafraichirBandeau(); },
      bandeauTableau: () => import("./tableau.mjs").then(m => m.ouvrirTableau()),
      bandeauAtelier: () => import("./atelier.mjs").then(m => m.ouvrirAtelier()),
      bandeauMJ: () => import("./mj.mjs").then(m => m.ouvrirFenetreMJ()),
      bandeauFiche: () => monSurvivant()?.sheet?.render({ force: true }),
      bandeauCreer: () => import("./creation.mjs").then(m => m.ouvrirCreation())
    }
  };
  static PARTS = { bandeau: { template: `${CHEMIN}/bandeau.hbs` } };

  async _prepareContext() { return contexteBandeau(); }

  // Au-dessus du canevas, dans l'interface.
  async _insertElement(element) {
    const hote = document.getElementById("interface") ?? document.body;
    const existant = document.getElementById(element.id);
    if (existant) existant.replaceWith(element);
    else hote.append(element);
  }
}

let bandeau = null;
export const bandeauSurvie = () => (bandeau ??= new BandeauSurvie());
export function rafraichirBandeau() {
  if (!reglage("bandeau", true)) { if (bandeau?.rendered) bandeau.close(); return null; }
  return bandeauSurvie().render({ force: true });
}
