// Constructeurs communs du module lakour-fenoir (système lakour-survie, Foundry v14) : constantes du contrat
// (docs/survie-contrat.md), identifiants stables, texte -> HTML, objets « installation », « savoir », « equipement »,
// « passe », acteurs « survivant », journaux, tables et scène. Utilisés par outils/fabriquer-fenoir.mjs.
import { createHash } from "node:crypto";

export const MODULE = "lakour-fenoir";
export const SYSTEME = "lakour-survie";
export const STATS = { coreVersion: "14.369", systemId: SYSTEME, systemVersion: "0.1.0" };

// ---------------------------------------------------------------- Vocabulaire du contrat
export const ZONES = ["littoral", "hauts", "cirque", "volcan", "foret"];
export const TERRAINS = ["route", "piste", "sentier", "mer"];
export const TYPES_SITE = ["maison", "case-creole", "immeuble", "ecole", "commerce", "ferme", "gite", "ilet", "caserne", "hopital",
  "port", "phare", "tunnel-de-lave", "galerie", "usine", "eglise", "autre"];
export const EAUX_SITE = ["aucune", "citerne", "riviere", "source", "puits", "reseau"];
export const RESSOURCES = ["eau", "nourriture", "carburant", "medicaments", "munitions", "materiaux", "pieces", "graines"];
// Les stocks de l'abri : les ressources pillables (les réserves des régions), plus ce qui se cueille ou se produit sans se piller.
export const STOCKS = [...RESSOURCES, "plantes", "energie"];
export const NATURE = ["cueillette", "gibier", "peche", "bois"];
export const RESEAUX = ["electricite", "eau", "carburant", "telephone"];
export const CATEGORIES = ["defense", "eau", "nourriture", "energie", "vie", "souterrain", "stockage", "communication"];
export const TYPES_EVENEMENT = ["meteo", "reseau", "horde", "humain", "accident", "decouverte", "abri", "fete"];
export const PHASES = ["jour-zero", "panique", "effondrement", "silence", "apres"];
export const SAISONS = ["pluies", "seche"];
export const ATTITUDES = ["hostile", "mefiante", "neutre", "amicale"];
export const COMPETENCES = ["endurance", "combat", "tir", "discretion", "vigilance", "bricolage", "survie", "soins", "parole", "conduite"];
export const CATEGORIES_EQUIPEMENT = ["arme", "arme-a-feu", "outil", "soin", "transport", "communication", "energie", "vie", "livre"];
export const TRANSPORTS = ["pied", "vehicule", "bateau"];

// Repères d'équilibre (docs/survie-notes-contenu.md) : ce que vise le contenu, pour que la logique s'aligne.
export const EQUILIBRE = {
  groupe: 4,
  consommation: { eau: 1, eauBasSaisonChaude: 1.5, nourriture: 1 },   // par personne et par jour (contrat §1.6)
  facteurSaison: { pluie: { pluies: 1, seche: 0.5 }, soleil: { pluies: 1, seche: 0.8 } },
  altitudeBas: 400,
  pertes: 0.05
};

// ---------------------------------------------------------------- Identifiants et texte
// Identifiant Foundry stable (16 caractères alphanumériques) dérivé de la clé.
const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
export function identifiant(cle) {
  const octets = createHash("sha256").update(`${MODULE}:${cle}`).digest();
  return Array.from(octets.subarray(0, 16), o => ALPHABET[o % ALPHABET.length]).join("");
}

// Texte -> HTML : paragraphes séparés par une ligne vide, **gras**, *italique*, listes « - », titres « # », citations « > »
// (un bloc dont chaque ligne commence par « > » devient un <blockquote> : les carnets de survivants du livre de l'île).
export function html(texte = "") {
  const enLigne = t => t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>").replace(/\*(.+?)\*/g, "<em>$1</em>");
  return String(texte).trim().split(/\n\s*\n/).filter(Boolean).map(bloc => {
    const lignes = bloc.trim().split("\n");
    if (lignes.every(l => /^\s*>\s?/.test(l))) return `<blockquote><p>${lignes.map(l => enLigne(l.replace(/^\s*>\s?/, ""))).join("<br>")}</p></blockquote>`;
    if (lignes.every(l => /^\s*-\s+/.test(l))) return `<ul>${lignes.map(l => `<li>${enLigne(l.replace(/^\s*-\s+/, ""))}</li>`).join("")}</ul>`;
    const titre = /^(#{1,3})\s+(.*)$/.exec(bloc.trim());
    if (titre && lignes.length === 1) return `<h${titre[1].length + 1}>${enLigne(titre[2])}</h${titre[1].length + 1}>`;
    return `<p>${lignes.map(enLigne).join("<br>")}</p>`;
  }).join("");
}
export const sansBalises = h => String(h ?? "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();

// Ressources complètes (zéros pour celles qu'on ne cite pas).
export const ressources = (r = {}, cles = RESSOURCES) => Object.fromEntries(cles.map(c => [c, r[c] ?? 0]));

// ---------------------------------------------------------------- Images
const IMG = {
  installation: "icons/svg/house.svg", savoir: "icons/svg/book.svg", equipement: "icons/svg/item-bag.svg",
  passe: "icons/svg/mystery-man.svg", survivant: "icons/svg/mystery-man.svg"
};
export const IMAGES_CATEGORIE = {
  defense: "icons/svg/shield.svg", eau: "icons/svg/waterfall.svg", nourriture: "icons/svg/oak.svg", energie: "icons/svg/lightning.svg",
  vie: "icons/svg/house.svg", souterrain: "icons/svg/cave.svg", stockage: "icons/svg/chest.svg", communication: "icons/svg/sound.svg"
};

// ---------------------------------------------------------------- Objets (Item)
export function objet({ pack, type, cle, nom, img, system }) {
  const _id = identifiant(`${pack}:${cle}`);
  return {
    __pack: pack, __cle: `${pack}:${cle}`,
    _id, _key: `!items!${_id}`, name: nom, type, img: img ?? IMG[type],
    system: { cle, ...system },
    effects: [], folder: null, sort: 0, ownership: { default: 0 },
    flags: { [MODULE]: { cle } }, _stats: STATS
  };
}

// Niveau d'installation : cout, requiert, effets (effets TOTAUX du niveau atteint, pas des ajouts au niveau précédent).
function niveauInstallation(n = {}) {
  return {
    cout: { materiaux: 0, pieces: 0, graines: 0, ...n.cout, travail: n.cout?.travail ?? 0 },
    requiert: {
      savoirs: n.requiert?.savoirs ?? [],
      site: { eau: n.requiert?.site?.eau ?? [], sol: n.requiert?.site?.sol ?? 0, soleil: n.requiert?.site?.soleil ?? 0, souterrain: n.requiert?.site?.souterrain ?? 0 },
      installations: n.requiert?.installations ?? []
    },
    effets: {
      production: n.effets?.production ?? {},
      conditions: { pluie: false, soleil: false, riviere: false, delai: 0, ...n.effets?.conditions },
      consommation: n.effets?.consommation ?? {},
      defense: 0, discretion: 0, capacite: 0, visibilite: 0, bruit: 0, stockage: {}, protectionCyclone: 0,
      soins: 0, moral: 0, conservation: false, sol: 0, renseignements: false, bonus: {},
      ...Object.fromEntries(Object.entries(n.effets ?? {}).filter(([k]) => !["production", "conditions", "consommation"].includes(k)))
    }
  };
}

export function installation({ cle, nom, categorie, description, niveaux }) {
  const nv = niveaux.map(niveauInstallation);
  return objet({
    pack: "installations", type: "installation", cle, nom, img: IMAGES_CATEGORIE[categorie],
    system: {
      categorie, description: html(description), niveau: 0, niveauMax: nv.length,
      chantier: { fait: 0, requis: nv[0]?.cout.travail ?? 0 }, etat: 0, niveaux: nv
    }
  });
}

export function savoir({ cle, nom, description, apprentissage, effets }) {
  return objet({ pack: "savoirs", type: "savoir", cle, nom, system: { description: html(description), apprentissage: html(apprentissage), effets: html(effets) } });
}

// Équipement. Champs ajoutés au contrat (§3.4, voir docs/survie-notes-contenu.md) : categorie, bruit (ajouté au bruit
// quand on s'en sert), transport ({ mode, places, chargeMax, carburant } pour un véhicule), effets (comme une installation,
// pour les panneaux démontables), munitions = unités de munitions consommées par échange de tirs (null hors arme à feu).
export function equipement({ cle, nom, categorie, description, bonus = {}, charge = 1, usure = 0, munitions = null, bruit = 0, transport = null, effets = null, img }) {
  return objet({
    pack: "equipements", type: "equipement", cle, nom, img,
    system: { categorie, description: html(description), bonus, charge, usure, munitions, bruit, transport, effets }
  });
}

// Passé de jour zéro. Champs ajoutés : accroche (où et comment le jour zéro le surprend), region (région de départ suggérée).
// Ajouts du §10 : incapacites (tâches refusées), histoire (phrases pour la graine d histoire).
// genre : "f" | "m" quand le libellé (ou le texte) est genré, "" sinon ; nomAutre : le libellé pour l'autre genre, s'il diffère
// (« Infirmière du CHU » / « Infirmier du CHU »). Le système accorde l'affichage au genre du survivant (nomAccorde).
export function passe({ cle, nom, description, competences, savoirs = [], equipement = [], accroche = "", region = "", incapacites = [], histoire = [], genre = "", nomAutre = "" }) {
  return objet({
    pack: "passes", type: "passe", cle, nom,
    system: { description: html(description), competences, savoirs, equipement, accroche: html(accroche), region, incapacites, histoire, genre, nomAutre }
  });
}

// ---------------------------------------------------------------- Acteurs « survivant » (§3.1 et §10.1)
// pack : "survivants" (prétirés, PNJ) ou "bestiaire" (Livides, animaux, figures hostiles : livide = true pour un Livide).
// img : jeton (assets/jetons/<cle>.svg) ; disposition : -1 hostile, 0 neutre, 1 allié.
export function survivant({ cle, nom, pack = "survivants", passe = "", enfance = "", age = 30, lien = "", competences = {}, passions = {}, traits = [],
  incapacites = [], statut = "pnj", moral = 4, notes = "", objets = [], pnj = false, livide = false, vivant = true, img = IMG.survivant,
  disposition = null, extra = {} }) {
  const _id = identifiant(`${pack}:${cle}`);
  const comp = Object.fromEntries(COMPETENCES.map(c => [c, { niveau: competences[c] ?? 0, marques: 0 }]));
  return {
    __pack: pack, __cle: `${pack}:${cle}`,
    _id, _key: `!actors!${_id}`, name: nom, type: "survivant", img,
    system: {
      competences: comp, blessures: 0, fatigue: 0, moral, faim: 0, soif: 0,
      infection: { atteint: false, stade: 0, depuis: 0 },
      enfance, passe, passions, traits, incapacites, statut, tache: "", histoire: { journal: "" },
      age, lien, vivant, livide, charge: 0, notes: html(notes)
    },
    // Objets incorporés : copies des savoirs et équipements du compendium, clé « !actors.items!acteur.objet ».
    items: objets.map(o => {
      const iid = identifiant(`${pack}:${cle}:${o.__cle}`);
      const copie = Object.fromEntries(Object.entries(structuredClone(o)).filter(([k]) => !k.startsWith("__")));
      return { ...copie, _id: iid, _key: `!actors.items!${_id}.${iid}`, flags: { [MODULE]: { cle: o.system.cle, source: o._id } } };
    }),
    effects: [],
    prototypeToken: {
      name: nom, actorLink: !pnj && !livide, disposition: disposition ?? (pnj ? 0 : 1), displayName: 20, displayBars: 0, width: 1, height: 1,
      texture: { src: img, fit: "contain", scaleX: 1, scaleY: 1 }, bar1: { attribute: null }, bar2: { attribute: null }
    },
    folder: null, sort: 0, ownership: { default: 0 },
    flags: { [MODULE]: { cle, pnj, ...extra } }, _stats: STATS
  };
}

// ---------------------------------------------------------------- Journaux
// pack : "guides" (lisible des joueurs) ou "mj" (caché). Une page { titre, texte } ; cle de page facultative (stable).
export function journal({ cle, nom, pack, pages }) {
  const _id = identifiant(`${pack}:${cle}`);
  const visible = pack === "guides";
  return {
    __pack: pack, __cle: `${pack}:${cle}`,
    _id, _key: `!journal!${_id}`, name: nom, folder: null, sort: 0, categories: [],
    ownership: { default: visible ? 2 : 0 }, flags: { [MODULE]: { cle, visible } }, _stats: STATS,
    pages: pages.map((p, i) => {
      const pid = identifiant(`${pack}:${cle}:${p.cle ?? i}`);
      return {
        _id: pid, _key: `!journal.pages!${_id}.${pid}`, name: p.titre, type: "text", sort: (i + 1) * 100,
        title: { show: true, level: 1 }, text: { content: html(p.texte), format: 1 }, ownership: { default: -1 },
        flags: p.cle ? { [MODULE]: { cle: p.cle } } : {}
      };
    })
  };
}
export const idPage = (pack, cleJournal, clePage) => identifiant(`${pack}:${cleJournal}:${clePage}`);
export const idJournal = (pack, cle) => identifiant(`${pack}:${cle}`);

// ---------------------------------------------------------------- Tables aléatoires : une ligne par résultat, 1dN.
export function table({ cle, nom, description = "", resultats }) {
  const _id = identifiant(`tables:${cle}`);
  return {
    __pack: "tables", __cle: `tables:${cle}`,
    _id, _key: `!tables!${_id}`, name: nom, img: "icons/svg/d20-black.svg", description: html(description),
    formula: `1d${resultats.length}`, replacement: true, displayRoll: true, folder: null, sort: 0, ownership: { default: 0 },
    flags: { [MODULE]: { cle } }, _stats: STATS,
    results: resultats.map((texte, i) => {
      const rid = identifiant(`tables:${cle}:${i}`);
      return {
        _id: rid, _key: `!tables.results!${_id}.${rid}`, type: "text", name: "", description: html(texte),
        range: [i + 1, i + 1], weight: 1, drawn: false, img: null, flags: {}
      };
    })
  };
}

// ---------------------------------------------------------------- §10 : tâches du jour et incapacités
export const TACHES = ["garde", "cultures", "elevage", "chantier", "atelier", "cuisine", "soins", "eau", "peche", "chasse", "fouille", "repos", "enseigner"];
// Compétence qui sert à chaque tâche (besoinsDuGroupe).
export const COMPETENCE_TACHE = { garde: "vigilance", cultures: "survie", elevage: "survie", chantier: "bricolage", atelier: "bricolage", cuisine: "survie",
  soins: "soins", eau: "bricolage", peche: "survie", chasse: "tir", fouille: "discretion", repos: null, enseigner: "parole" };
// Incapacité -> compétences et tâches qu'elle interdit.
export const INCAPACITES = {
  violence: { competences: ["combat", "tir"], taches: ["chasse"] },
  soins: { competences: ["soins"], taches: ["soins"] },
  "travaux-lourds": { competences: [], taches: ["chantier"] },
  conduite: { competences: ["conduite"], taches: [] },
  parole: { competences: ["parole"], taches: ["enseigner"] },
  cultures: { competences: [], taches: ["cultures", "elevage"] },
  nuit: { competences: [], taches: ["garde"] }
};
