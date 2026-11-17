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

// Les clés de CLES_TEXTES dont la traduction n'est pas encore dans lang/fr.json et lang/en.json (Faits.*) : la couche Foundry
// affiche leur `texte` français de repli en attendant. Une clé en sort quand ses deux traductions sont écrites (l'essai statique
// les exige alors comme les autres).
export const CLES_A_TRADUIRE = [];

// Toutes les clés que la logique peut produire (essai statique : chacune existe dans lang/fr.json et lang/en.json, Faits.*, sauf
// celles de CLES_A_TRADUIRE tant qu'elles y manquent).
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
  "progression", "progression-enseignee", "stocks-bas-eau", "stocks-bas-nourriture",
  "stocks-vides-eau", "stocks-vides-nourriture", "stocks-moins-un-jour-eau", "stocks-moins-un-jour-nourriture", "manque-nourriture", "palier-visibilite",
  "fete-manquante", "fete-deja", "fete-rations",
  // fetes.mjs, releve.mjs (lot « fetes », 2026-11-13) : fêtes, participation, relève, morts, autel
  "fete-manque", "participation-sans-hote", "participation-sans-personne", "participation-deja",
  "releve-sans-candidat", "releve-sans-fiche", "releve-pas-du-groupe", "mort-inconnu", "mort-deja-repos", "mort-pas-retrouve",
  "autel-absent", "autel-vide", "autel-trop-tot",
  // abri.mjs (subirEvenementAbri, par etat.mjs) : événements du contenu qui touchent l'abri (§2.6)
  "abri-evenement-pertes", "abri-evenement-degats", "abri-a-raconter-moral", "abri-a-raconter-blessure", "abri-a-raconter-decouverte",
  // generation.mjs : tâches, recrues, besoins du groupe (raison d'une urgence)
  "tache-inconnue", "tache-interdite",
  "besoin-soins", "besoin-chantier", "besoin-cultures", "besoin-garde", "besoin-negociation",
  "recrue-raison-1", "recrue-raison-2", "recrue-raison-3", "recrue-raison-4", "recrue-raison-5",
  "recrue-prix-1", "recrue-prix-2", "recrue-prix-3", "recrue-prix-4", "recrue-prix-5",
  "proche-1", "proche-2", "proche-3", "proche-4", "proche-5",
  // maladies.mjs : soins
  "soin-medicaments", "soin-pas-atteint", "soin-rate",
  // abri.mjs, fabrication.mjs : motifs de refus d'un chantier ou d'une recette
  "installation-inconnue", "recette-inconnue", "niveau-inexistant", "niveau-deja", "niveau-prealable", "hors-service-reparer",
  "savoir-manquant", "eau-requise", "site-sol", "site-soleil", "site-souterrain", "requiert", "requiert-hors-service", "manque",
  // marche.mjs : stades, carnet de crédit, jours de marché, foires, Ladi Lafé (la rumeur)
  "marche-stade-troc", "marche-stade-boutique", "marche-stade-sans-boutique", "marche-stade-forain", "marche-stade-sans-forain",
  "marche-stade-foire", "marche-stade-sans-foire",
  "carnet-rien", "carnet-refuse", "carnet-traine", "carnet-plafond", "carnet-nouvel-an",
  "marche-jour", "foire-finie", "marche-dette-rumeur",
  "rumeur", "rumeur-treve", "rumeur-dette", "rumeur-menteur", "rumeur-inconnue", "rumeur-vraie",
  // lot « savoirs » : les deux savoirs, la gramoune, le chien, le cyclone vécu, les routes sans carburant
  "eruption-premices", "livre-trouve", "verrou-epave", "verrou-eboulis", "verrou-tunnel", "verrou-arbre", "voyage-source",
  "savoir-perdu", "chien-agite-cyclone", "chien-agite-volcan", "boutures-mortes",
  // vivant.mjs, etat.mjs (lot 8 « Le vivant de l'abri ») : les cheptels, les bêtes portées, le chien qui grogne
  "vivant-soif", "vivant-faim", "vivant-eau-sale", "vivant-morts", "vivant-vide", "vivant-naissance", "vivant-malade", "vivant-guerie",
  "vivant-sans-pompe", "vivant-portee-morte", "chien-grogne",
  "cyclone-prepare", "cyclone-emportes", "cyclone-citerne", "cyclone-arbres", "cyclone-depot", "menace-depot",
  "apprendre-savoir-inconnu", "apprendre-source", "apprendre-deja", "apprendre-maitre", "apprendre-livre",
  "dictee-pas-gramoune", "dictee-confiance", "dictee-faite",
  // esprit.mjs (par etat.mjs) : l'esprit au jour le jour (complément du jeu 3D, famille 2)
  "esprit-observance-manquee", "esprit-observance-reprise", "esprit-reconfort", "esprit-regard-change", "esprit-retenu",
  "esprit-signe-1", "esprit-signe-2", "esprit-signe-3", "esprit-lache", "esprit-au-bord", "esprit-faux-bruit",
  // etat.mjs, moralite.mjs, chefs.mjs : la couleur du groupe, l'autorité du chef, les tributs (famille 3)
  "malaise-couleur", "autorite-monte", "autorite-baisse", "desertion", "crise-scission", "crise-renversement", "tribut-du",
  // porte.mjs : celui qui frappe à la porte
  "porte-repart", "porte-feu", "porte-feu-secret", "porte-revient",
  "porte-frappe-refugie", "porte-frappe-famille", "porte-frappe-blesse", "porte-frappe-dur",
  "porte-demande-refugie", "porte-demande-famille", "porte-demande-blesse", "porte-demande-dur",
  "porte-accueilli", "porte-refuse", "porte-trahi", "porte-inconnu", "porte-decision", "porte-rien-a-prendre",
  // chefs.mjs : ce que décide le chef d'une bande
  "chef-attaquer", "chef-negocier", "chef-passer", "chef-ultimatum", "chef-rejoindre",
  // sens.mjs (par etat.mjs) : percevoir dans le noir, la Timise, l'alarme naturelle (lot « sens »)
  "noir-palier-1", "noir-palier-2", "noir-palier-3", "noir-palier-4", "grenouilles-silence", "noir-horde-entendue", "timise", "timise-reconnue",
  // Lot 10 (contrat §22) : changer de religion, les rangs, le passage, les quotas, l'étal, ce qui se dit d'une conversion
  "esprit-conversion-faite", "conversion-inconnue", "conversion-plusieurs", "conversion-meme",
  "chef-succede", "chef-perdu", "rang-pas-membre", "rang-deja-chef", "rang-nouveau", "rang-jeune", "rang-seconds-max",
  "passage-inconnu", "passage-ouvert", "passage-ferme", "quota-pas-membre", "etal-vend", "etal-vole",
  "rumeur-quitte-sa-foi", "rumeur-change-souvent",
  // plans.mjs (lot 4 « Les plans ») : un plan trouvé, la fenêtre d'un lieu à plans, l'étagère aux cahiers, les refus
  "plan-trouve", "plans-fenetre", "etagere-perte-eau",
  "plan-inconnu", "plan-pas-connu", "plan-deja-appris", "plan-illisible",
  "plans-fenetre-saison-seche", "plans-fenetre-saison-pluies", "plans-fenetre-lune", "plans-fenetre-cyclone", "plans-fenetre-eruption",
  "plans-lieu-inconnu", "plans-lieu-revenir", "etagere-absente", "etagere-pleine",
  // reperes.mjs (par etat.mjs et l'API) : le compte des jours, la lune lue sur un calendrier, le journal d'un mort (lot « cartes »)
  "compte-retrouve", "compte-doute", "compte-perdu", "compte-manque", "compte-manque-personne", "compte-manque-absent", "compte-manque-mort", "compte-manque-empeche", "compte-manque-moral",
  "lune-sans-calendrier", "lune-sans-lunes", "journal-absent", "journal-enterre", "journal-livide", "journal-loin",
  // corps.mjs, maladies.mjs (par etat.mjs) : le sommeil, les signes d'un mal que le groupe ne sait pas nommer (lot « corps »)
  "survivant-epuise", "survivant-endormi", "survivant-gris-signes", "survivant-mort-fievre",
  "survivant-declaree-signes", "survivant-aggravee-signes", "survivant-guerie-signes",
  // fabrication.mjs, armes.mjs (lot 6 « ateliers ») : refus d'une recette, d'une réparation de fortune
  "requiert-atelier", "recette-a-l-abri", "recette-lumiere", "outil-manquant", "objet-manquant",
  "outil-sans-usure", "outil-arme-a-feu", "outil-neuf", "outil-trop-repare", "outil-pas-une-lame",
  // fouilles.mjs (par actions.mjs, etat.mjs et l'API) : fouiller un lieu, le démonter, récolter, les bêtes trouvées, les refus (lot 5 « fouille »)
  "fouille-lieu", "demontage-lieu", "lieu-demonte", "fouille-culte", "recolte", "bete-prise", "bete-file", "bete-pique", "bete-morte", "bete-enclose", "bete-abattue", "bete-relachee",
  "installation-demontee", "lieu-genre-inconnu", "lieu-aucun", "lieu-ailleurs", "lieu-demonte-deja", "lieu-fini", "lieu-indemontable", "lieu-site",
  "gisement-aucun", "gisement-renvoi", "gisement-epuise", "gisement-rien", "bete-inconnue", "bete-deja-enclose", "bete-sans-enclos",
  // ouvrages.mjs (par etat.mjs) : l'entretien des installations, l'encrassement, les pannes (lot 7 « Bâtir et défendre »)
  "ouvrage-use", "ouvrage-encrasse", "ouvrage-panne", "ouvrage-vieillit", "ouvrage-soigne",
  // paradis.mjs (par etat.mjs, monde.mjs et l'API) : la chaleur d'un lieu, la ronde, les corps, sous terre, la haie, rallumer l'île,
  // les jalons (lot 9 « Le paradis et son piège »)
  "ronde", "ronde-calme", "ronde-blesse", "ronde-morsure", "alerte-ronde-morsure", "ronde-trouvaille", "agglutines",
  "chaleur-oublie", "chaleur-traces", "chaleur-remarques", "chaleur-viennent", "chaleur-assieges", "haie-pliee", "haie-cassee",
  "air-bon", "air-lourd", "air-vicie", "sous-terre-palier-1", "sous-terre-palier-2", "chantier-fini", "region-rallumee", "region-eteinte", "convoi-attire",
  "jalon-premier-abri", "jalon-premiere-saison-des-pluies", "jalon-premier-cyclone", "jalon-premiere-fete", "jalon-premiere-region", "jalon-moitie-de-l-ile",
  "jalon-toute-l-ile", "leurre", "leurre-rate", "corps-enterres", "corps-brules", "corps-rien", "corps-sans-bois", "paradis-sans-abri", "paradis-pas-a-l-abri",
  "chantier-inconnu", "chantier-loin", "chantier-deja-fini", "chantier-avance", "chantier-aide", "ronde-jouee", "rallumer-declaree", "rallumer-eteinte",
  "sous-terre-regle",
  // la fusion de la vague 3 (jointures, contrat §29) : un agglutiné tue une bête d'enclos
  "agglutine-bete"
];

// ------------------------------------------------------------------ petite grammaire des textes à trous
// Un nom de lieu (ou de faction, de personne) injecté après « de » ou « à » dans un texte français : la contraction et l'élision
// que la grammaire demande. Les noms qui commencent par un article (« Les Hauts de l'Ouest », « Le Port et La Possession »,
// « La route du Littoral », « L'Est : … », « Une case créole… ») perdent la majuscule de l'article une fois contractés :
//   de + Le → du, de + Les → des, de + La → de la, de + L' → de l', de + Un/Une → d'un/d'une, de + voyelle → d' ;
//   à + Le → au, à + Les → aux, à + La → à la, à + L' → à l', à + Un/Une → à un/à une. Sans article : « de Saint-Denis ».
const ARTICLE = /^(Les|Le|La|Une|Un)(?=\s)|^(L['’])(?=\p{L})/u;
const VOYELLE = /^[AEIOUYÂÀÊÉÈËÎÏÔÛÙÜaeiouyâàêéèëîïôûùü]/u;
export function avecPreposition(preposition, nom) {
  const p = String(preposition ?? "").trim(), n = String(nom ?? "").trim();
  if (!n) return p;
  const maj = p !== p.toLowerCase();   // « De » ou « À » en tête de phrase
  const cap = s => (maj ? s.charAt(0).toUpperCase() + s.slice(1) : s);
  const de = p.toLowerCase() === "de";
  const m = ARTICLE.exec(n);
  if (m) {
    const art = (m[1] ?? m[2]).toLowerCase().replace("’", "'"), reste = n.slice(m[0].length);
    const formes = de ? { le: "du ", les: "des ", la: "de la ", "l'": "de l'", un: "d'un ", une: "d'une " }
      : { le: "au ", les: "aux ", la: "à la ", "l'": "à l'", un: "à un ", une: "à une " };
    return cap(`${formes[art]}${reste.trimStart()}`);
  }
  if (de && VOYELLE.test(n)) return cap(`d'${n}`);
  return `${p} ${n}`;
}

// « 1 jour(s) », « 3 watch(es) », « 2 recette(s) possible(s) » : le pluriel accordé au nombre qui précède (les mots marqués qui se
// suivent). Français : pluriel à partir de 2 (« 0 jour », « 1,5 jour ») ; anglais : pluriel sauf pour 1 (« 0 days », « 1 day »).
// Une marque « (s) » sans nombre devant reste telle quelle.
const MOT_MARQUE = String.raw`[\p{L}'’-]+\((?:s|es)\)`;
const NOMBRE_ET_MOTS = new RegExp(String.raw`(-?\d+(?:[.,]\d+)?)(\s+)(${MOT_MARQUE}(?:\s+${MOT_MARQUE})*)`, "gu");
export function accorderPluriels(texte, langue = "fr") {
  const en = String(langue ?? "").toLowerCase().startsWith("en");
  return String(texte ?? "").replace(NOMBRE_ET_MOTS, (_, n, esp, mots) => {
    const v = Math.abs(Number(String(n).replace(",", ".")));
    const pluriel = en ? v !== 1 : v >= 2;
    return `${n}${esp}${mots.replace(/\((s|es)\)/g, (__, marque) => (pluriel ? marque : ""))}`;
  });
}

// Remplit un texte à trous (« {region} ») avec ses paramètres : contraction après « de »/« à » (avecPreposition), puis pluriels
// accordés (accorderPluriels). Un trou sans paramètre reste tel quel.
export function remplir(gabarit, params = {}, langue = "fr") {
  const p = params && typeof params === "object" ? params : {};
  const a = k => Object.prototype.hasOwnProperty.call(p, k) && p[k] !== undefined && p[k] !== null;
  const texte = String(gabarit ?? "")
    .replace(/(?<![\p{L}'’])(de|De|à|À) \{(\w+)\}/gu, (m, prep, k) => (a(k) ? avecPreposition(prep, p[k]) : m))
    .replace(/\{(\w+)\}/g, (m, k) => (a(k) ? String(p[k]) : m));
  return accorderPluriels(texte, langue);
}
