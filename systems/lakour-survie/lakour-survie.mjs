// Système « Fénoir — survie à La Réunion » (lakour-survie) — point d'entrée.
// Contrat commun avec le module de contenu lakour-fenoir et le MJ IA : docs/survie-contrat.md. Logique pure : logique/*.mjs.
import { ID } from "./logique/constantes.mjs";
import { MODELES_ACTEURS, MODELES_OBJETS } from "./scripts/modeles.mjs";
import { enregistrerReglages } from "./scripts/reglages.mjs";
import { api, registre, chargerIndex, quandDe, contenu } from "./scripts/api.mjs";
import { ecouterSocket } from "./scripts/socket.mjs";
import * as Coffre from "./scripts/coffre.mjs";
import { estMJActif } from "./scripts/canal.mjs";
import { t, lireEtat, reglage, erreurLisible, proprietaireDe, MODULE_MJIA } from "./scripts/donnees.mjs";
import { signaler, demandeDeTestPourMoi } from "./scripts/signal.mjs";
import { brancherImmersion, suivreLumiere, suivreMeteo } from "./scripts/immersion.mjs";
import { suivreAmbiance, signalerAssaut } from "./scripts/ambiance.mjs";
import { brancherInfobulle } from "./scripts/infobulle.mjs";
import { suivreFetesDuJeu } from "./scripts/fetes.mjs";
import { FicheSurvivant, FicheAbri, FicheObjet } from "./scripts/apps/fiches.mjs";
import { rafraichirBandeau } from "./scripts/apps/bandeau.mjs";
import { tableauDeBord, ouvrirTableau } from "./scripts/apps/tableau.mjs";
import { fenetreMJ, ouvrirFenetreMJ } from "./scripts/apps/mj.mjs";
import { atelier } from "./scripts/apps/atelier.mjs";
import { ouvrirCreation, doitCreer } from "./scripts/apps/creation.mjs";

// ------------------------------------------------------------------ l'état change (réglage monde « partie », chez tous)
const enSaisie = appli => Boolean(appli.element?.querySelector?.("prose-mirror[open]") || appli.element?.contains?.(document.activeElement));
function quandEtatChange() {
  if (!game.ready) return;
  Hooks.callAll("lakourSurvie.etat", lireEtat());
  rafraichirBandeau();
  for (const f of [tableauDeBord(), fenetreMJ(), atelier()]) if (f.rendered && !enSaisie(f)) f.render();
  for (const appli of foundry.applications.instances.values()) {
    if (appli instanceof FicheAbri && appli.rendered && !enSaisie(appli)) appli.render();
  }
  suivreMeteo();
  if (estMJActif()) {
    suivreLumiere().catch(e => console.warn(`${ID} | lumière`, e));
    suivreAmbiance().catch(e => console.warn(`${ID} | ambiance`, e));
  }
}

// ------------------------------------------------------------------ init
Hooks.once("init", () => {
  Object.assign(CONFIG.Actor.dataModels, MODELES_ACTEURS);
  Object.assign(CONFIG.Item.dataModels, MODELES_OBJETS);
  CONFIG.Actor.trackableAttributes = {
    survivant: { bar: ["vitalite", "forces"], value: ["moral", "blessures", "fatigue"] },
    abri: { bar: [], value: ["bruit", "degats"] }
  };
  const { Actors, Items } = foundry.documents.collections;
  Actors.registerSheet(ID, FicheSurvivant, { types: ["survivant"], makeDefault: true, label: "LAKOUR_SURVIE.Fiche.Survivant" });
  Actors.registerSheet(ID, FicheAbri, { types: ["abri"], makeDefault: true, label: "LAKOUR_SURVIE.Fiche.Abri" });
  Items.registerSheet(ID, FicheObjet, { types: Object.keys(MODELES_OBJETS), makeDefault: true, label: "LAKOUR_SURVIE.Fiche.Objet" });
  enregistrerReglages({
    etat: () => quandEtatChange(),
    coffre: () => Coffre.surCoffreChange(),
    fetes: () => suivreFetesDuJeu(quandDe().date, contenu().fetes ?? [], { bascule: true }).catch(() => null),
    bandeau: () => game.ready && rafraichirBandeau(),
    immersion: () => game.ready && suivreMeteo()
  });
  brancherImmersion();
  brancherInfobulle();
});

// ------------------------------------------------------------------ setup : l'API et le registre du contenu (§6)
Hooks.once("setup", () => {
  game.lakourSurvie = api;
  Hooks.callAll("lakourSurvie.enregistrer", registre.interface);
});

// Le coffre du MJ IA ne publie son API qu'à SON « ready » (après celui du système) : on l'attend un peu, sans bloquer.
function quandMoteur(fn) {
  if (Coffre.coffreDuMoteur() || !game.modules.get(MODULE_MJIA)?.active) return fn();
  Hooks.once("lakour-mj-ia.pret", () => fn());
  return null;
}

Hooks.once("ready", async () => {
  game.lakourSurvie = api;
  await registre.pret();
  await chargerIndex();
  ecouterSocket();
  // Le contenu : vérifié (clés uniques, références) ; le MJ est prévenu des erreurs.
  const erreurs = registre.erreurs();
  if (erreurs.length && game.user.isGM) {
    console.warn(`${ID} | contenu`, erreurs);
    ui.notifications.error(t("LAKOUR_SURVIE.Erreurs.Contenu", { n: erreurs.length, premiere: erreurs[0] }), { permanent: true });
  }
  if (estMJActif()) {
    quandMoteur(async () => {
      const ok = await Coffre.apresMoteurPret().catch(e => { console.warn(`${ID} | coffre`, e); return false; });
      if (!ok && lireEtat().demarree) ui.notifications.warn(t(Coffre.enAttenteDeParts() ? "LAKOUR_SURVIE.Coffre.EnAttente" : "LAKOUR_SURVIE.Coffre.Ferme"), { permanent: true });
      quandEtatChange();
      suivreFetesDuJeu(quandDe().date, contenu().fetes ?? []).catch(() => null);
    });
  }
  rafraichirBandeau();
  suivreMeteo();
  if (doitCreer()) setTimeout(() => ouvrirCreation(), 1500);
  Hooks.callAll("lakourSurvie.pret", api);
});

// La clé du moteur est revenue (parts des joueurs, autre MJ, clé de secours) : on rouvre le monde.
Hooks.on("lakour-mj-ia.coffreRouvert", () => {
  if (!estMJActif()) return;
  Coffre.ouvrirMonde().then(ok => { if (ok) { ui.notifications.info(t("LAKOUR_SURVIE.Coffre.Ouvert")); quandEtatChange(); } }).catch(e => console.warn(`${ID} | coffre`, e));
});

// Le MJ actif change : celui qui prend la main ouvre le monde ; celui qui la perd oublie le sien (il serait périmé).
let etaisActif = false;
Hooks.on("userConnected", () => {
  if (!game.user.isGM) return;
  const actif = estMJActif();
  if (actif && !etaisActif) Coffre.ouvrirMonde().then(() => quandEtatChange()).catch(e => console.warn(`${ID} | coffre`, e));
  else if (!actif && etaisActif) Coffre.perdreLaMain();
  etaisActif = actif;
});
Hooks.once("ready", () => { etaisActif = estMJActif(); });

// Un assaut : la tension monte (ambiance du MJ actif) ; le tremblement est dans immersion.mjs.
Hooks.on("lakourSurvie.assaut", () => { if (estMJActif()) signalerAssaut().catch(() => null); });

// ------------------------------------------------------------------ cartes de chat
Hooks.on("renderChatMessageHTML", (message, html) => {
  const f = message.flags?.[ID];
  const forcer = html.querySelector?.(".survie-forcer");
  if (forcer) {
    const a = game.actors.get(f?.test?.acteurId);
    if (!a || !(game.user.isGM || a.isOwner) || f?.test?.resultat?.force || f?.test?.forcable === false) forcer.remove();
    else forcer.addEventListener("click", async ev => {
      ev.preventDefault();
      forcer.disabled = true;
      try { await api.forcer({ messageId: message.id }); } catch (e) { ui.notifications.error(erreurLisible(e)); forcer.disabled = false; }
    });
  }
  for (const b of html.querySelectorAll?.(".survie-lancer") ?? []) {
    const a = game.actors.get(b.dataset.acteur);
    if (!a || !(game.user.isGM || a.isOwner)) { b.remove(); continue; }
    b.addEventListener("click", async ev => {
      ev.preventDefault();
      try { await api.test({ acteurId: a.id, competence: b.dataset.competence, difficulte: b.dataset.difficulte }); } catch (e) { ui.notifications.error(erreurLisible(e)); }
    });
  }
});

// Une carte qui demande un test au survivant de ce joueur (MJ IA ou fenêtre du MJ) : le signal chez lui.
Hooks.on("createChatMessage", message => {
  if (demandeDeTestPourMoi(message)) signaler(t("LAKOUR_SURVIE.Signal.Jet"));
});

// ------------------------------------------------------------------ barre des acteurs, contrôles de scène
Hooks.on("renderActorDirectory", (app, html) => {
  const racine = html instanceof HTMLElement ? html : html?.[0];
  if (!racine || racine.querySelector(".survie-creer-survivant")) return;
  if (!game.user.isGM && !reglage("creationOuverte", true)) return;
  const bouton = document.createElement("button");
  bouton.type = "button";
  bouton.className = "survie-creer-survivant";
  bouton.innerHTML = `<i class="fa-solid fa-dice-d20"></i> ${t("LAKOUR_SURVIE.Creation.Bouton")}`;
  bouton.addEventListener("click", () => ouvrirCreation());
  (racine.querySelector(".header-actions") ?? racine.querySelector(".directory-header") ?? racine).append(bouton);
});

Hooks.on("getSceneControlButtons", controles => {
  const jetons = controles.tokens ?? controles.token;
  if (!jetons?.tools) return;
  const n = Object.keys(jetons.tools).length;
  jetons.tools.lakourSurvieTableau = { name: "lakourSurvieTableau", title: "LAKOUR_SURVIE.Tableau.Titre", icon: "fa-solid fa-clipboard-list", order: n, button: true, visible: true, onChange: () => ouvrirTableau() };
  jetons.tools.lakourSurvieMJ = { name: "lakourSurvieMJ", title: "LAKOUR_SURVIE.MJ.Titre", icon: "fa-solid fa-hat-wizard", order: n + 1, button: true, visible: game.user.isGM, onChange: () => ouvrirFenetreMJ() };
});

// Un survivant créé à la main : jeton lié, amical ; un abri : visible des joueurs.
Hooks.on("preCreateActor", (acteur, donnees) => {
  if (acteur.type === "survivant" && donnees.prototypeToken?.actorLink === undefined) {
    acteur.updateSource({ "prototypeToken.actorLink": true, "prototypeToken.disposition": CONST.TOKEN_DISPOSITIONS.FRIENDLY });
  }
});

// Les fenêtres suivent les acteurs et leurs objets.
for (const evenement of ["updateActor", "createItem", "updateItem", "deleteItem"]) {
  Hooks.on(evenement, doc => {
    if (!game.ready) return;
    const a = doc.documentName === "Actor" ? doc : doc.parent;
    if (!a || !["survivant", "abri"].includes(a.type)) return;
    rafraichirBandeau();
    for (const f of [tableauDeBord(), atelier()]) if (f.rendered && !enSaisie(f)) f.render();
  });
}

export { api, proprietaireDe };
