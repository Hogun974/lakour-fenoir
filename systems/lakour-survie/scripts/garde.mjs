// Intégrité des fiches : un joueur ne change pas lui-même les nombres de son survivant (compétences, afflictions, état…) ni ne se
// donne des objets. Tout ce qui compte passe par l'API, chez le MJ actif.
//
// Ce qui tourne où (Foundry v14.370, vérifié dans ses sources) :
// - le SERVEUR applique les `documentTypes` du system.json : `gmOnlyFields` (un joueur qui écrit l'un de ces champs voit toute son
//   écriture refusée ; à la création par un joueur, ils sont retirés : common/data/fields.mjs, DataField#_sanitize) et
//   `htmlFields` (HTML nettoyé à l'écriture : dist/database/validators.mjs, cleanHTML). C'est la vraie garde : la console d'un
//   joueur ne la contourne pas. GARDES_SERVEUR ci-dessous en est la liste, que l'essai compare au system.json et aux modèles.
// - preUpdateActor, preCreateItem, preUpdateItem ne tournent QUE dans le navigateur qui écrit (client/data/client-backend.mjs) :
//   ici, un refus clair pour le joueur honnête, avant que le serveur ne refuse ;
// - createItem tourne partout après coup, avec l'utilisateur qui a écrit : chez le MJ actif, un objet créé par un joueur sur un
//   survivant ou un abri est retiré (le serveur l'a vidé de ses champs, mais il resterait, avec son nom).
import { ID } from "../logique/constantes.mjs";
import { estMJActif } from "./canal.mjs";

// Ce qu'un joueur propriétaire peut écrire lui-même sur son acteur (en plus du nom, du portrait et du jeton) : les notes.
export const CHAMPS_JOUEUR = { survivant: ["notes"], abri: [] };
const RACINES_PERMISES = ["_id", "name", "img", "prototypeToken", "ownership", "folder", "sort", "_stats"];
const TYPES_GARDES = ["survivant", "abri"];

const estMJ = userId => Boolean(globalThis.game?.users?.get?.(userId)?.isGM);
const cles = o => (o && typeof o === "object" ? Object.keys(o) : []);
// Les champs de `system` touchés par des changements (forme imbriquée ou « system.x.y »).
export function champsSystemeTouches(changements = {}) {
  const sortie = new Set(cles(changements.system).map(k => k.replace(/^-=/, "").split(".")[0]));
  for (const k of cles(changements)) if (k.startsWith("system.")) sortie.add(k.split(".")[1]);
  return [...sortie];
}
// Un changement d'acteur permis à un joueur ? (les drapeaux du système ne le sont pas).
export function changementActeurPermis(type, changements = {}) {
  if (!TYPES_GARDES.includes(type)) return true;
  const permis = CHAMPS_JOUEUR[type] ?? [];
  if (champsSystemeTouches(changements).some(k => !permis.includes(k))) return false;
  if (cles(changements.flags).includes(ID) || cles(changements).some(k => k.startsWith(`flags.${ID}`))) return false;
  return cles(changements).every(k => k === "system" || k === "flags" || k.startsWith("system.") || k.startsWith("flags.") || RACINES_PERMISES.includes(k.split(".")[0]));
}
// Un objet incorporé à un survivant ou à un abri : seul un MJ le crée ou le change.
export const objetGarde = item => TYPES_GARDES.includes(item?.parent?.type);

let avertir = () => globalThis.ui?.notifications?.warn?.(globalThis.game?.i18n?.localize?.("LAKOUR_SURVIE.Erreurs.ChampReserve") ?? "LAKOUR_SURVIE.Erreurs.ChampReserve");
export function brancherGarde(Hooks = globalThis.Hooks) {
  Hooks.on("preUpdateActor", (doc, changements, _options, userId) => {
    if (estMJ(userId) || changementActeurPermis(doc?.type, changements)) return true;
    avertir();
    return false;
  });
  Hooks.on("preCreateItem", (item, _donnees, _options, userId) => {
    if (estMJ(userId) || !objetGarde(item)) return true;
    avertir();
    return false;
  });
  Hooks.on("preUpdateItem", (item, changements, _options, userId) => {
    if (estMJ(userId) || !objetGarde(item)) return true;
    if (cles(changements).every(k => ["_id", "sort", "_stats"].includes(k))) return true;
    avertir();
    return false;
  });
  // Chez le MJ actif : un objet qu'un joueur a tout de même créé sur un survivant ou un abri est retiré.
  Hooks.on("createItem", (item, _options, userId) => {
    if (!estMJActif() || estMJ(userId) || !objetGarde(item)) return;
    Promise.resolve(item.delete?.()).catch(e => console.warn(`${ID} | garde`, e));
  });
}

// Les champs que le serveur réserve au MJ (system.json, documentTypes.*.*.gmOnlyFields) : tous ceux des modèles, sauf CHAMPS_JOUEUR.
export function gardesServeur(modeles) {
  const sortie = {};
  for (const [doc, types] of Object.entries(modeles)) {
    sortie[doc] = {};
    for (const [type, Modele] of Object.entries(types)) {
      const permis = doc === "Actor" ? CHAMPS_JOUEUR[type] ?? [] : [];
      sortie[doc][type] = Object.keys(Modele.defineSchema()).filter(k => !permis.includes(k));
    }
  }
  return sortie;
}
export const _avertissement = fn => { avertir = fn; };
