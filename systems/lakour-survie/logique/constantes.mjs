// Constantes partagées par la logique pure et par Foundry (système lakour-survie, monde « Fénoir »). Aucun appel à Foundry ici.
// Source de vérité : docs/survie-contrat.md (§1 règles, §2 monde, §3 documents, §4 état de la partie).

export const ID = "lakour-survie";
export const CANAL = `system.${ID}`;

// §1.2 — les dix compétences, clés stables.
export const COMPETENCES = ["endurance", "combat", "tir", "discretion", "vigilance", "bricolage", "survie", "soins", "parole", "conduite"];
export const NIVEAU_MAX = 5;

// §1.6 — les ressources (stocks entiers de l'abri). `energie` (kWh) ne se pille pas : elle se produit et se stocke. `plantes`
// (plantes médicinales, les « zerbaz » : 1 = une brassée, de quoi une tisane) ne se pillent pas non plus : elles se cueillent
// aux alentours (actions.mjs, REGLES_ACTIONS.plantes ; depuis le 2026-11-05).
export const RESSOURCES = ["eau", "nourriture", "carburant", "medicaments", "munitions", "materiaux", "pieces", "graines", "plantes", "energie"];
export const RESSOURCES_NON_PILLABLES = ["energie", "plantes"];
export const RESSOURCES_PILLABLES = RESSOURCES.filter(r => !RESSOURCES_NON_PILLABLES.includes(r));
// §2.1 — ressources naturelles (renouvelables) des alentours.
export const NATURE = ["cueillette", "gibier", "peche", "bois"];

// §1.4 — le temps : le quart (6 heures), quatre par jour, le quart 0 = jour zéro à 6 h.
export const QUARTS_PAR_JOUR = 4;
export const MOMENTS = ["matin", "apres-midi", "soir", "nuit"];
export const DATE_DEPART = "2026-12-04";
export const SAISONS = ["pluies", "seche"];

// §1.5 — phases de la crise : clé et premier jour.
export const PHASES = [
  { cle: "jour-zero", debut: 0 },
  { cle: "panique", debut: 2 },
  { cle: "effondrement", debut: 7 },
  { cle: "silence", debut: 21 },
  { cle: "apres", debut: 60 }
];
export const CLES_PHASES = PHASES.map(p => p.cle);

// §1.1 — difficultés : succès requis et dés offerts (`facile` : 1 succès avec +1 dé).
export const DIFFICULTES = {
  facile: { requis: 1, bonus: 1 },
  normale: { requis: 1, bonus: 0 },
  difficile: { requis: 2, bonus: 0 },
  extreme: { requis: 3, bonus: 0 }
};
export const SEUIL_SUCCES = 5;          // chaque 5 ou 6 est un succès
export const DES_MIN = 1, DES_MAX = 10; // bornes de la réserve

// §2.1, §2.2 — vocabulaire du contenu.
export const ZONES = ["littoral", "hauts", "cirque", "volcan", "foret"];
export const TERRAINS = ["route", "piste", "sentier", "mer"];
export const ETATS_ROUTE = ["ouverte", "difficile", "coupee"];
export const TRANSPORTS = ["pied", "vehicule", "bateau"];
export const RESEAUX = ["electricite", "eau", "carburant", "telephone"];
export const TYPES_SITE = ["maison", "case-creole", "immeuble", "ecole", "commerce", "ferme", "gite", "ilet", "caserne", "hopital",
  "port", "phare", "tunnel-de-lave", "galerie", "usine", "eglise", "autre"];
export const EAUX_SITE = ["aucune", "citerne", "riviere", "source", "puits", "reseau"];
export const CATEGORIES_INSTALLATION = ["defense", "eau", "nourriture", "energie", "vie", "souterrain", "stockage", "communication"];
export const ATTITUDES = ["hostile", "mefiante", "neutre", "amicale"];
// « marche » (2026-11-13) : les événements de marché, que la simulation du monde ne tire jamais (marche.mjs, evenementsDeMarche).
export const TYPES_EVENEMENT = ["meteo", "reseau", "horde", "humain", "accident", "decouverte", "abri", "fete", "marche"];
export const PRUDENCES = ["discret", "normal", "rapide"];

// La décomposition des Livides (§0, §2.3) : sous cette altitude moyenne, une région est « des Bas » (chaleur humide).
export const ALTITUDE_BAS = 400;

// §2.4 — bandes de renseignements, lues dans le réel au moment de l'observation.
// Infestation (0..5) : [borne haute exclue, bande].
export const BANDES_INFESTATION = [
  [1, "calme"],
  [2.5, "presente"],
  [4, "dense"],
  [Infinity, "grouillante"]
];
// Pillage : part restante des réserves pillables de la région (toutes ressources confondues) : [borne basse incluse, bande].
export const BANDES_PILLAGE = [
  [0.75, "intact"],
  [0.4, "entame"],
  [0.1, "maigre"],
  [-Infinity, "vide"]
];
export const SOURCES_RENSEIGNEMENT = ["vu", "radio", "rumeur"];

// L'ordre dans lequel les installations consommatrices d'énergie s'arrêtent quand l'énergie manque (§3.2) : la première
// catégorie de la liste s'éteint d'abord ; l'eau et le souterrain (ventilation) tiennent le plus longtemps.
export const ORDRE_DELESTAGE = ["vie", "communication", "stockage", "defense", "nourriture", "energie", "souterrain", "eau"];

// Bornes d'état d'un survivant (§1.3) et de l'abri (§1.7).
export const BORNES = {
  blessures: [0, 4], fatigue: [0, 5], moral: [0, 5], bruit: [0, 10], visibilite: [0, 10], infestation: [0, 5],
  stade: [0, 6], etatInstallation: [0, 3], force: [0, 5], tailleHorde: [1, 5]
};

// État public : longueurs maximales (§4).
export const JOURNAL_MAX = 200;
export const ALERTES_MAX = 50;
export const JOURNAL_SECRET_MAX = 500;
// « Autant de jours que l'on veut » : valeur rendue par joursDeStocks quand rien ne baisse.
export const JOURS_INFINIS = 999;
// §1.6 — jours autonomes consécutifs qui font un abri autonome.
export const SEUIL_AUTONOMIE = 7;

// Paliers de visibilité de l'abri (§9, repris de l'Exposition d'Imperium) : franchir un palier à la hausse donne au MJ une
// carte privée (rumeurs, éclaireurs, visite, assaut). Palier = nombre de seuils atteints (0 à 4).
export const PALIERS_VISIBILITE = [3, 5, 7, 9];
export const palierVisibilite = v => PALIERS_VISIBILITE.filter(s => Number(v) >= s).length;

// Types d'équipement qui se conduisent ou se montent (§9).
export const TYPES_VEHICULE = ["vehicule", "monture"];
export const CATEGORIES_AFFLICTION = ["maladie", "blessure", "psychique"];
export const DECLENCHEURS_AFFLICTION = ["eau", "moustiques", "ravine", "chaleur"];

export const borner = (x, min, max) => Math.min(max, Math.max(min, x));
