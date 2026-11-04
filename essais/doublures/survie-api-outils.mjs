// Outils communs aux essais de l'API du système lakour-survie (couche Foundry), sur la doublure foundry-survie.mjs : charger le
// système (l'original, ou une copie mutée), installer un monde, créer des survivants par le générateur.
import { cpSync, mkdtempSync, readFileSync, writeFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { pathToFileURL, fileURLToPath } from "node:url";
import { installerFoundry, enregistrerContenu, calme } from "./foundry-survie.mjs";

export const SYSTEME = fileURLToPath(new URL("../../systems/lakour-survie/", import.meta.url));

// Les modules du système (à charger APRÈS une première installation de la doublure : ils lisent foundry.* à l'import).
export async function charger(racine = SYSTEME) {
  const m = f => import(pathToFileURL(join(racine, f)).href);
  const [api, reglages, socket, coffre, fetes] = await Promise.all([m("scripts/api.mjs"), m("scripts/reglages.mjs"), m("scripts/socket.mjs"), m("scripts/coffre.mjs"), m("scripts/fetes.mjs")]);
  return { api: api.api, registre: api.registre, interne: api.interne, enregistrerReglages: reglages.enregistrerReglages, ecouterSocket: socket.ecouterSocket,
    traiterMessage: socket.traiterMessage, Coffre: coffre, fetes, module: api };
}

// Un monde neuf : doublure, réglages, socket, contenu, API. -> M (modules) enrichi de { users }
export async function monde(M, options = {}) {
  // Ce que l'essai précédent a laissé en route (messages, déchiffrement) finit dans SON monde, avant la remise à zéro : sinon sa
  // suite tombe dans celui-ci (l'état du coffre du système est partagé par les essais d'un même fichier).
  await calme();
  const { users } = installerFoundry(options);
  M.Coffre._reinitialiser();
  M.enregistrerReglages({ coffre: () => M.Coffre.surCoffreChange() });
  M.ecouterSocket();
  enregistrerContenu(M.registre);
  await M.registre.pret();
  game.lakourSurvie = M.api;
  Hooks.on("lakour-mj-ia.coffreRouvert", () => M.Coffre.ouvrirMonde());
  return { ...M, users };
}

// Un survivant tiré par le générateur, créé par le MJ (confié à userId s'il est donné). -> l'acteur
export async function survivantTire(M, { userId = "", verrous = {}, statut = "joueur" } = {}) {
  const d = M.api.generer({ verrous, statut });
  const r = await M.api.creerSurvivant({ donnees: d, userId, rejoindre: false, statut });
  return game.actors.get(r.acteurId);
}

// Une copie du système avec des remplacements (mutations) : [[fichier relatif, avant, après]]. -> { racine, nettoyer }
export function copieMutee(remplacements) {
  const racine = mkdtempSync(join(tmpdir(), "survie-mutant-"));
  cpSync(SYSTEME, racine, { recursive: true });
  for (const [fichier, avant, apres] of remplacements) {
    const p = join(racine, fichier);
    const texte = readFileSync(p, "utf8");
    if (!texte.includes(avant)) throw new Error(`mutation introuvable dans ${fichier} : ${avant.slice(0, 80)}`);
    writeFileSync(p, texte.replace(avant, apres));
  }
  return { racine, nettoyer: () => rmSync(racine, { recursive: true, force: true }) };
}

export { calme };
