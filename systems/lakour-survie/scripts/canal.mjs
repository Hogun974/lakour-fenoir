// Le canal socket « system.lakour-survie » (contrat §5), comme aux Veillées (lakour-loups/scripts/canal.mjs).
//
// Ce que fait le serveur de Foundry v14 (handleCustomSocket) : game.socket.emit(CANAL, message, { recipients }) ne livre le
// message qu'à ces utilisateurs ; sans destinataires, à tous les AUTRES navigateurs. Le récepteur reçoit (message, emetteur) :
// l'identifiant de l'émetteur est ajouté par le serveur d'après la session, un joueur ne peut pas le falsifier. C'est lui qui
// fait foi ; message.userId n'est qu'une déclaration, rejetée si elle le contredit.
import { CANAL } from "../logique/constantes.mjs";

export const estMJActif = () => Boolean(game.users?.activeGM) && game.users.activeGM.id === game.user?.id;

// À ces utilisateurs seulement (le navigateur courant est retiré : le serveur ne renvoie rien à l'émetteur) ; à tous si
// destinataires est null (seulement ce qui est public).
export function emettre(message, destinataires = null) {
  if (!game.socket) return;
  if (destinataires === null) { game.socket.emit(CANAL, message); return; }
  const ids = [...new Set(destinataires.filter(Boolean))].filter(id => id !== game.user.id);
  if (ids.length) game.socket.emit(CANAL, message, { recipients: ids });
}

export function versMJ(message) {
  const mj = game.users?.activeGM;
  if (!mj) return false;
  emettre({ ...message, userId: game.user.id }, [mj.id]);
  return true;
}

// L'auteur réel d'un message : l'identifiant donné par le serveur ; null si le message ment sur son auteur, ou s'il arrive sans
// émetteur. Foundry v14 (handleCustomSocket du serveur) ajoute TOUJOURS l'émetteur à un message relayé ; un message sans émetteur
// n'est pas passé par le serveur : il n'a pas d'auteur sûr et n'est pas traité.
export function auteur(message, emetteur) {
  if (!emetteur || typeof emetteur !== "string") return null;
  if (message?.userId && message.userId !== emetteur) return null;
  return emetteur;
}
export const vientDuMJActif = (message, emetteur) => {
  const qui = auteur(message, emetteur);
  return Boolean(qui) && qui === game.users?.activeGM?.id;
};
export const vientDUnMJ = (message, emetteur) => {
  const qui = auteur(message, emetteur);
  return Boolean(qui) && Boolean(game.users?.get(qui)?.isGM);
};

// Appelle le crochet ici et chez tous les autres, avec des arguments PUBLICS seulement.
export function annoncer(nom, args = []) {
  Hooks.callAll(nom, ...args);
  emettre({ type: "hook", nom, args });
}
