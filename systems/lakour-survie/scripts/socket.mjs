// Socket « system.lakour-survie » (contrat §5). Chaque message a ses destinataires ; l'auteur est l'identifiant donné par le
// serveur (second argument du socket), pas ce que le message prétend.
//   joueur -> MJ actif : { type: "requete", id, action: "test" | "forcer" | "assigner" | "proposer" | "creer", donnees, userId }
//   MJ actif -> joueur : { type: "reponse", id, resultat } | { type: "reponse", id, erreur }
//                        { type: "signal", texte }           tintement chez ce joueur (on attend quelque chose de lui)
//   MJ actif -> tous   : { type: "hook", nom, args }         crochets publics (lakourSurvie.avance, .assaut, .nouvellePartie)
// Rien du monde réel n'y passe : les requêtes et leurs réponses ne portent que des tests, des tâches, des propositions.
import { CANAL } from "../logique/constantes.mjs";
import { estMJActif, auteur, vientDUnMJ, vientDuMJActif } from "./canal.mjs";
import { traiterRequete, recevoirReponse } from "./api.mjs";
import { signaler } from "./signal.mjs";

const HOOKS_PUBLICS = ["lakourSurvie.avance", "lakourSurvie.assaut", "lakourSurvie.nouvellePartie"];

export function traiterMessage(message, emetteur) {
  if (!message || typeof message.type !== "string") return false;
  const qui = auteur(message, emetteur);
  if (qui === null) return false;
  switch (message.type) {
    case "requete": return estMJActif() ? traiterRequete(message, qui) : false;
    case "reponse": return vientDuMJActif(message, emetteur) || !emetteur ? recevoirReponse(message, emetteur) : false;
    case "signal":
      if (!vientDUnMJ(message, emetteur)) return false;
      return signaler(String(message.texte ?? ""));
    case "hook":
      if (!vientDUnMJ(message, emetteur) || !HOOKS_PUBLICS.includes(message.nom)) return false;
      Hooks.callAll(message.nom, ...(message.args ?? []));
      return true;
  }
  return false;
}

export function ecouterSocket() {
  game.socket.on(CANAL, (message, emetteur) => {
    try {
      const r = traiterMessage(message, emetteur);
      if (r?.catch) r.catch(e => console.error("lakour-survie | socket", e));
    } catch (e) { console.error("lakour-survie | socket", e); }
  });
}
