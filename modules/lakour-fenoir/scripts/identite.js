// Identifiant du module, lu dans l'adresse de ce fichier : « lakour-fenoir » (français) ou « lakour-fenoir-en » (version
// anglaise, engendrée par outils/fabriquer-fenoir.mjs --langue en : mêmes scripts, mêmes _id de documents, même registre
// traduit, drapeaux et réglages sous sa propre portée). Foundry sert chaque module sous /modules/<id>/ ; dans node (fabricant,
// essais), le chemin du dépôt contient aussi modules/<id>/. Tout ce qui porte l'identifiant du module (réglages, drapeaux,
// compendiums « <id>.guides », chemins « modules/<id>/assets/… », assets/donnees.json) passe par ID : les deux modules
// fonctionnent sans autre changement. Voir modules/lakour-mj-ia/docs/traduction.md.
export const ID_FRANCAIS = "lakour-fenoir";
export const ID = /\/modules\/([^/]+)\//.exec(decodeURIComponent(new URL(import.meta.url).pathname))?.[1] ?? ID_FRANCAIS;
// Version anglaise du module ?
export const ANGLAIS = ID !== ID_FRANCAIS;
