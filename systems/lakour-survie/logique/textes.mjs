// Les textes que la logique pure rend aux humains (faits, alertes, journal, menaces, rencontres, motifs de refus) : du français en
// dur dans `texte` (repli, lisible sans Foundry) ET une clé de traduction `cle` avec ses paramètres `params`, pour que la couche
// Foundry affiche chaque texte dans la langue de l'utilisateur (game.i18n.format("LAKOUR_SURVIE.Faits.<cle>", params)).
// Les noms venus du contenu (régions, sites, factions, créatures, afflictions, événements) sont déjà dans la langue du module de
// contenu (lakour-fenoir ou lakour-fenoir-en) : ils passent en paramètres, jamais dans la clé. Les paramètres qui sont des clés
// du système (ressource, competence, tache, transport) ou des stocks ({ ressource: n }) sont rendus par la couche Foundry.
// Un objet « message » : { cle, params, texte } (sans `texte` si on ne le donne pas : à étaler dans un objet qui a déjà le sien).
export const message = (cle, params = {}, texte = undefined) => (texte === undefined ? { cle, params } : { cle, params, texte });

// Un fait du monde, une entrée de journal ou une alerte porte ses `cle`/`params` à côté du `texte` ; pour un fait dont `cle` est
// déjà le type (clé d'un événement du contenu), `cleTexte` donne la clé du texte.
export const cleTexteDe = x => x?.cleTexte ?? x?.cle ?? "";

// Toutes les clés que la logique peut produire (essai statique : chacune existe dans lang/fr.json et lang/en.json, Faits.*).
export const CLES_TEXTES = [
  // monde.mjs : faits
  "reseau-electricite", "reseau-eau", "reseau-carburant", "reseau-telephone",
  "cyclone-pre-alerte", "cyclone-orange", "cyclone-rouge", "cyclone-passe",
  "crue", "eboulement", "fortes-pluies", "eruption", "eruption-fin",
  "horde-nait", "horde-arrive", "horde-approche", "horde-dispersee", "faction-arrive", "abri-occupe", "evenement",
  // monde.mjs : menaces contre l'abri
  "menace-horde", "menace-livides", "menace-bande", "menace-visite", "menace-animaux", "menace-accident",
  // actions.mjs : rencontres, faits des actions, refus
  "rencontre-livides", "rencontre-humains", "rencontre-isoles", "rencontre-animaux", "rencontre-livide-isole",
  "rencontre-danger-crue", "rencontre-danger-eboulement", "rencontre-danger-incendie",
  "exploration", "fouille", "fouille-region", "voyage",
  "voyage-deja-sur-place", "voyage-trop-charge", "voyage-aucune-route", "voyage-aucune-route-transport", "voyage-carburant",
  "site-inconnu", "site-occupe",
  // etat.mjs : journal et alertes du temps qui passe
  "arrivee", "cyclone-degats", "cyclone-degats-installations",
  "survivant-releve", "alerte-releve", "survivant-infection", "survivant-mort-infection", "survivant-mort-blessures",
  "survivant-craque", "survivant-depart", "alerte-depart", "survivant-declaree", "survivant-aggravee", "survivant-guerie",
  "progression", "progression-enseignee", "stocks-bas-eau", "stocks-bas-nourriture", "manque-nourriture", "palier-visibilite",
  "fete-manquante", "fete-deja", "fete-rations",
  // generation.mjs : tâches, recrues
  "tache-inconnue", "tache-interdite",
  "recrue-raison-1", "recrue-raison-2", "recrue-raison-3", "recrue-raison-4", "recrue-raison-5",
  "recrue-prix-1", "recrue-prix-2", "recrue-prix-3", "recrue-prix-4", "recrue-prix-5",
  "proche-1", "proche-2", "proche-3", "proche-4", "proche-5",
  // maladies.mjs : soins
  "soin-medicaments", "soin-pas-atteint", "soin-rate",
  // abri.mjs, fabrication.mjs : motifs de refus d'un chantier ou d'une recette
  "installation-inconnue", "recette-inconnue", "niveau-inexistant", "niveau-deja", "niveau-prealable", "hors-service-reparer",
  "savoir-manquant", "eau-requise", "site-sol", "site-soleil", "site-souterrain", "requiert", "requiert-hors-service", "manque"
];
