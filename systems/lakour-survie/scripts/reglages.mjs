// Réglages du système (contrat §4) : l'état public de la partie, le monde réel scellé et ses copies, les choix du MJ et ceux de
// chaque joueur (bandeau, signal, ambiance, effets visuels).
import { ID, DATE_DEPART } from "../logique/constantes.mjs";
import { etatVide } from "../logique/etat.mjs";

export const REGLAGES_MONDE_SECRETS = ["coffre", "mondeClair"];

// rappels : { etat(valeur), coffre(), fetes(), bandeau(), immersion() }
export function enregistrerReglages(rappels = {}) {
  const r = (cle, conf) => game.settings.register(ID, cle, conf);
  // L'état PUBLIC de la partie (§4) : écrit par le seul MJ actif, lu partout.
  r("partie", { scope: "world", config: false, type: Object, default: etatVide(), onChange: v => rappels.etat?.(v) });
  // Le monde réel (§2.3), SECRET : scellé avec le coffre du MJ IA (illisible sans sa clé), réécrit après chaque changement.
  r("coffre", { scope: "world", config: false, type: Object, default: {}, onChange: () => rappels.coffre?.() });
  // Sans le moteur (module coupé) : le monde en clair, avec un avertissement permanent au MJ.
  r("mondeClair", { scope: "world", config: false, type: Object, default: {} });
  // Le monde gardé dans le navigateur du MJ (localStorage), rangé par [monde][userId], jamais envoyé : SEULEMENT le temps qu'une
  // écriture attende d'être scellée (clé du moteur absente), effacé ensuite (coffre.mjs). Sinon vide : le coffre suffit.
  r("monde", { scope: "client", config: false, type: Object, default: {} });

  r("dateDepart", {
    name: "LAKOUR_SURVIE.Reglages.DateDepart.Nom", hint: "LAKOUR_SURVIE.Reglages.DateDepart.Aide",
    scope: "world", config: true, type: String, default: DATE_DEPART, onChange: () => rappels.bandeau?.()
  });
  r("budgetCreation", {
    name: "LAKOUR_SURVIE.Reglages.Budget.Nom", hint: "LAKOUR_SURVIE.Reglages.Budget.Aide",
    scope: "world", config: true, type: String, default: "10-16"
  });
  r("repartitionAuto", {
    name: "LAKOUR_SURVIE.Reglages.RepartitionAuto.Nom", hint: "LAKOUR_SURVIE.Reglages.RepartitionAuto.Aide",
    scope: "world", config: true, type: Boolean, default: false
  });
  r("creationOuverte", {
    name: "LAKOUR_SURVIE.Reglages.CreationOuverte.Nom", hint: "LAKOUR_SURVIE.Reglages.CreationOuverte.Aide",
    scope: "world", config: true, type: Boolean, default: true
  });
  r("fetesSuiventLeJeu", {
    name: "LAKOUR_SURVIE.Reglages.FetesJeu.Nom", hint: "LAKOUR_SURVIE.Reglages.FetesJeu.Aide",
    scope: "world", config: true, type: Boolean, default: true, onChange: () => rappels.fetes?.()
  });
  // Qui voit le sens moral d'un survivant (complément du jeu 3D, famille 3) : chacun le sien (défaut), tout le monde, ou le MJ seul.
  // Les autres se connaissent par la réputation. (Foundry envoie les fiches à tous les navigateurs : ce n'est pas un coffre.)
  r("visibiliteSensMoral", {
    name: "LAKOUR_SURVIE.Reglages.VisibiliteSens.Nom", hint: "LAKOUR_SURVIE.Reglages.VisibiliteSens.Aide",
    scope: "world", config: true, type: String, default: "soi",
    choices: { soi: "LAKOUR_SURVIE.Reglages.VisibiliteSens.soi", tous: "LAKOUR_SURVIE.Reglages.VisibiliteSens.tous", mj: "LAKOUR_SURVIE.Reglages.VisibiliteSens.mj" }
  });
  r("lumiereSuitLeMoment", {
    name: "LAKOUR_SURVIE.Reglages.Lumiere.Nom", hint: "LAKOUR_SURVIE.Reglages.Lumiere.Aide",
    scope: "world", config: true, type: Boolean, default: true
  });
  // Chez chacun.
  r("bandeau", {
    name: "LAKOUR_SURVIE.Reglages.Bandeau.Nom", hint: "LAKOUR_SURVIE.Reglages.Bandeau.Aide",
    scope: "client", config: true, type: Boolean, default: true, onChange: () => rappels.bandeau?.()
  });
  r("bandeauReplie", { scope: "client", config: false, type: Boolean, default: false });
  r("signalTour", {
    name: "LAKOUR_SURVIE.Reglages.Signal.Nom", hint: "LAKOUR_SURVIE.Reglages.Signal.Aide",
    scope: "client", config: true, type: Boolean, default: true
  });
  r("ambiance", {
    name: "LAKOUR_SURVIE.Reglages.Ambiance.Nom", hint: "LAKOUR_SURVIE.Reglages.Ambiance.Aide",
    scope: "client", config: true, type: Boolean, default: true
  });
  r("effetsVisuels", {
    name: "LAKOUR_SURVIE.Reglages.Effets.Nom", hint: "LAKOUR_SURVIE.Reglages.Effets.Aide",
    scope: "client", config: true, type: Boolean, default: true, onChange: () => rappels.immersion?.()
  });
}

// "10-16" -> [10, 16] ; illisible : le budget par défaut.
export function lireBudget(texte) {
  const m = /^\s*(\d+)\s*[-–à]\s*(\d+)\s*$/.exec(String(texte ?? ""));
  if (!m) return [10, 16];
  const a = Number(m[1]), b = Number(m[2]);
  return a <= b ? [a, b] : [b, a];
}
