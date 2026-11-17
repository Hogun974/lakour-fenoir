// Fouiller, démonter et récolter l'île (lot 5 du portage du jeu 3D ; contrat §25 ; chiffres et raisons : docs/equilibre-fouille.md).
// Ici, le contenu : ce que vaut un objet trouvé en ressources de Fénoir (la table de conversion), les genres de bâtiments et leurs
// lots (portés presque tels quels des tables du jeu 3D, `paquets/base/jeu/fouilles.json`), ce que rend un bâtiment qu'on démonte (la
// moitié de ce qu'il a coûté, `sources.json`), les bêtes vivantes qu'on y trouve, les milieux de l'île et leurs gisements, les outils
// pour prendre une bête (cage, sac de goni, corde, enfumoir) et leurs recettes, une table par genre, le journal du MJ « Fouiller,
// démonter, récolter » et une page du guide du joueur. La règle est dans le système (logique/fouilles.mjs).
//
// Unités : une ressource de Fénoir vaut deux « matériaux » du jeu 3D (une brouette de Fénoir : huit planches, quatre tôles, huit
// parpaings, deux cents clous). Les quantités des lots restent celles du jeu 3D, en objets ; c'est `par` (combien d'objets font une
// unité) qui les ramène aux ressources de Fénoir. Le compte est fait au tirage, à l'unité près (arrondi au hasard).
import { html, journal, table, MODULE } from "./aides.mjs";

// ---------------------------------------------------------------- Ce que vaut un objet trouvé
// { cle, nom, ressource, par } : `par` objets font une unité de la ressource ; ou { equipement, repli: { ressource, par } } : l'objet
// devient un équipement du registre (le repli sert tant que le registre ne l'a pas : les outils du lot 6). convoite : ce que les
// pillards prennent d'abord (les vivres, les soins, les outils, les armes, le carburant). ressource vide : un objet sans valeur de
// ressource (il se raconte).
// Le nom porte une majuscule (le registre le traduit) ; on l'écrit en minuscule après une quantité (`bas`).
const haut = t => t.charAt(0).toUpperCase() + t.slice(1);
export const bas = t => String(t ?? "").charAt(0).toLowerCase() + String(t ?? "").slice(1);
const O = (cle, nom, ressource, par, convoite = false) => ({ cle, nom: haut(nom), ressource, par, convoite });
const E = (cle, nom, equipementCle, repli, convoite = true) => ({ cle, nom: haut(nom), equipement: equipementCle, repli, convoite });
export const OBJETS_FOUILLE = [
  // Vivres
  O("conserve", "boîtes de conserve", "nourriture", 2, true), O("vivres", "vivres secs (riz, grains, sucre)", "nourriture", 2, true),
  O("eau", "bouteilles d'eau", "eau", 2, true), O("sel", "sel", "nourriture", 6, true), O("vinaigre", "vinaigre", "nourriture", 6, true),
  O("rhum", "rhum", "medicaments", 4, true),
  // Soins
  O("pansement", "pansements", "medicaments", 4, true), O("alcool-desinfectant", "alcool désinfectant", "medicaments", 2, true),
  O("solute", "soluté de réhydratation", "medicaments", 2, true), O("attelle", "attelles", "medicaments", 2, true),
  O("baume", "baume", "medicaments", 3, true), O("savon", "savon", "medicaments", 8, true), O("eau-de-javel", "eau de Javel", "medicaments", 6, true),
  E("trousse-de-secours", "une trousse de secours", "trousse-de-secours", { ressource: "medicaments", par: 0.5 }),
  E("moustiquaires", "des moustiquaires", "moustiquaires", { ressource: "materiaux", par: 2 }, false),
  // Matériaux
  O("planche", "planches", "materiaux", 8), O("clous", "clous", "materiaux", 200), O("tole", "tôles", "materiaux", 4), O("ferraille", "ferraille", "materiaux", 8),
  O("fil-de-fer", "fil de fer", "materiaux", 8), O("parpaing", "parpaings", "materiaux", 8), O("moellon", "moellons", "materiaux", 8),
  O("ciment", "sacs de ciment", "materiaux", 4), O("bache", "bâches", "materiaux", 4), O("grillage", "rouleaux de grillage", "materiaux", 3),
  O("tissu", "linge et tissu", "materiaux", 8), O("bocal", "bocaux", "materiaux", 8), O("papier", "papier", "materiaux", 40), O("seau", "seaux", "materiaux", 4),
  O("couverture", "couvertures", "materiaux", 4), O("fut", "fûts vides", "materiaux", 3), O("gants-de-travail", "gants de travail", "materiaux", 6),
  O("savates", "savates", "materiaux", 6), O("engrais", "engrais", "materiaux", 4), O("fumier", "fumier", "materiaux", 4), O("bougie", "bougies", "materiaux", 12),
  O("cire", "cire", "materiaux", 6), O("cahier-vierge", "cahiers vierges", "materiaux", 10), O("encre", "encre", "materiaux", 20), O("vitre", "vitres", "materiaux", 6),
  O("charbon-de-bois", "charbon de bois", "materiaux", 6), O("pierre-a-aiguiser", "pierres à aiguiser", "materiaux", 6),
  // Pièces
  O("visserie", "visserie", "pieces", 8), O("cable", "câbles", "pieces", 4), O("tuyau", "tuyaux", "pieces", 4), O("composants", "composants électroniques", "pieces", 2),
  O("chambre-a-air", "chambres à air", "pieces", 8), O("rustine", "rustines", "pieces", 12), O("roue", "roues", "pieces", 4), O("ressort", "lames de ressort", "pieces", 2),
  O("moteur", "un petit moteur", "pieces", 0.34), O("moteur-electrique", "un moteur électrique", "pieces", 0.5), O("batterie-de-voiture", "une batterie de voiture", "pieces", 1),
  O("cellule-solaire", "cellules solaires", "pieces", 2), O("panneau-solaire", "un panneau solaire", "pieces", 0.5), O("groupe-electrogene", "un groupe électrogène", "pieces", 0.5),
  O("cadre-de-velo", "un cadre de vélo", "pieces", 2),
  // Graines
  O("graines", "sachets de graines", "graines", 2), O("plants", "plants et boutures", "boutures", 1),
  // Carburant, gaz, munitions
  O("carburant", "bidons d'essence ou de gazole", "carburant", 2, true), O("bouteille-de-gaz", "bouteilles de gaz", "gaz", 0.1, true),
  O("cartouches", "cartouches", "munitions", 4, true), O("douilles", "douilles à recharger", "munitions", 10, true),
  // Outils, armes, objets
  E("couteau", "un couteau", "couteau", { ressource: "pieces", par: 2 }), E("sabre-a-canne", "un sabre à canne", "sabre-a-canne", { ressource: "pieces", par: 2 }),
  E("pied-de-biche", "un pied-de-biche", "pied-de-biche", { ressource: "pieces", par: 2 }), E("pelle-pioche", "une pelle et une pioche", "pelle-pioche", { ressource: "pieces", par: 2 }),
  E("tronconneuse", "une tronçonneuse", "tronconneuse", { ressource: "pieces", par: 0.5 }), E("fusil-de-chasse", "un fusil de chasse", "fusil-de-chasse", { ressource: "pieces", par: 1 }),
  E("carabine-22", "une carabine .22", "carabine-22", { ressource: "pieces", par: 1 }), E("pistolet-de-service", "un pistolet de service", "pistolet-de-service", { ressource: "pieces", par: 1 }),
  E("lampe-electrique", "une lampe électrique", "frontale", { ressource: "pieces", par: 2 }, false), E("radio-a-manivelle", "une radio à manivelle", "radio-a-manivelle", { ressource: "pieces", par: 1 }, false),
  E("batterie-nomade", "une batterie nomade", "batterie-nomade", { ressource: "pieces", par: 1 }, false), E("rechaud", "un réchaud", "rechaud", { ressource: "pieces", par: 2 }, false),
  // Les outils que le lot 6 (ateliers) écrit : en attendant leur fiche, leur valeur en pièces.
  E("marteau", "un marteau", "marteau", { ressource: "pieces", par: 2 }), E("scie", "une scie", "scie", { ressource: "pieces", par: 2 }),
  E("pince", "une pince", "pince", { ressource: "pieces", par: 2 }), E("truelle", "une truelle", "truelle", { ressource: "pieces", par: 2 }),
  E("hache", "une hache", "hache", { ressource: "pieces", par: 1 }), E("masse", "une masse", "masse", { ressource: "pieces", par: 2 }),
  // Pour prendre une bête (ce lot)
  E("corde", "une corde", "cordes-de-choka", { ressource: "materiaux", par: 10 }, false), E("sac-de-goni", "un sac de goni", "sac-de-goni", { ressource: "materiaux", par: 8 }, false),
  E("cage", "une cage à volailles", "cage-de-bambou", { ressource: "materiaux", par: 4 }, false),
  // Matières de l'île (la récolte)
  O("bambou", "bambous", "materiaux", 4), O("feuille-de-choka", "feuilles de choka", "materiaux", 12), O("feuille-de-vacoa", "feuilles de vacoa", "materiaux", 25),
  O("noix-de-bancoul", "noix de bancoul", "materiaux", 20), O("terre", "seaux de terre", "materiaux", 6), O("argile", "pains d'argile", "materiaux", 4),
  O("sable", "seaux de sable", "materiaux", 6), O("galet", "galets", "materiaux", 40), O("coquillage", "coquillages", "materiaux", 30),
  O("branche", "branches", "materiaux", 10), O("gaulette", "gaulettes", "materiaux", 40)
];

// ---------------------------------------------------------------- Les genres de bâtiments
// lots : [objet, min, max, chance, risque] (le jeu 3D : la chance au calme, plus `risque` par palier de risque de la région, 0 à 4).
// gestes : ceux du jeu 3D ; travail : quarts-personne pour fouiller le lieu en entier (environ un pour cinq gestes). nombre : combien
// de lieux de ce genre dans une région, base + parPopulation × population (0 à 5) ; route : seulement là où passe une route.
// demontage : ce qu'il rend (la moitié de ce qu'il a coûté, en ressources de Fénoir), le travail en quarts-personne, le bruit par quart.
// betes : [bête, chance] ; culte : un lieu de culte (rien de rare, rien qui serve d'arme ; y prendre peut peser : acte « prendre-au-culte »).
const L = (objetCle, min, max, chance, risque = 0) => ({ objet: objetCle, q: [min, max], chance, ...(risque ? { risque } : {}) });
const LOTS_CASE = [L("tissu", 2, 5, 0.8), L("bocal", 1, 4, 0.7), L("clous", 10, 30, 0.6), L("vivres", 1, 3, 0.5), L("conserve", 1, 3, 0.4, 0.05), L("papier", 3, 10, 0.5),
  L("corde", 1, 1, 0.4), L("couteau", 1, 1, 0.35, 0.05), L("marteau", 1, 1, 0.3, 0.05), L("scie", 1, 1, 0.2, 0.05), L("sabre-a-canne", 1, 1, 0.25, 0.05),
  L("seau", 1, 1, 0.3), L("savon", 1, 2, 0.25), L("pansement", 1, 3, 0.2, 0.05), L("eau-de-javel", 1, 1, 0.2), L("graines", 1, 4, 0.3), L("bache", 1, 1, 0.25),
  L("fil-de-fer", 1, 3, 0.4), L("visserie", 2, 6, 0.4), L("eau", 1, 3, 0.25), L("alcool-desinfectant", 1, 1, 0.1, 0.05), L("truelle", 1, 1, 0.12, 0.03),
  L("pince", 1, 1, 0.15, 0.04), L("cartouches", 2, 8, 0.05, 0.05), L("fusil-de-chasse", 1, 1, 0.02, 0.04), L("bouteille-de-gaz", 1, 1, 0.08, 0.03),
  L("sac-de-goni", 1, 1, 0.15), L("cage", 1, 1, 0.06)];
const G = (cle, nom, { batiments = [], gestes, travail, nombre, route = false, lots, betes = [], demontage = null, culte = false, description }) =>
  ({ cle, nom, description, batiments, gestes, travail, nombre, ...(route ? { route } : {}), lots, betes: betes.map(([bete, chance]) => ({ bete, chance })), demontage, ...(culte ? { culte } : {}) });
const D = (materiaux, pieces, travail, bruit = 1) => ({ rend: { materiaux, pieces }, travail, bruit });

export const GENRES_FOUILLE = [
  G("case", "Case créole", { batiments: ["case"], gestes: 8, travail: 2, nombre: { base: 8, parPopulation: 6 }, lots: LOTS_CASE,
    betes: [["poule", 0.09], ["lapin", 0.03], ["cabri", 0.02], ["essaim", 0.02], ["porcelet", 0.01]], demontage: D(12, 0, 16),
    description: `Une case de bois sous tôle, sa varangue, sa cour de terre battue et son pied de letchi. Le linge plié dans l'armoire, les bocaux de la cuisine, les outils du jardin sous l'auvent, parfois une poule qui gratte encore la cour.` }),
  G("case-en-tole", "Case en tôle", { batiments: ["case-en-tole"], gestes: 8, travail: 2, nombre: { base: 2, parPopulation: 4 }, lots: LOTS_CASE,
    betes: [["poule", 0.09], ["lapin", 0.03], ["cabri", 0.02], ["essaim", 0.02], ["porcelet", 0.01]], demontage: D(4, 0, 6, 2),
    description: `Une case de tôles clouées sur des gaulettes, au bord d'une ravine ou au bout d'un chemin : on y a peu, mais on y a tout gardé.` }),
  G("maison", "Maison en dur", { batiments: ["maison-en-dur"], gestes: 10, travail: 2, nombre: { base: 2, parPopulation: 8 },
    lots: [L("tissu", 2, 6, 0.8), L("bocal", 2, 5, 0.7), L("conserve", 1, 4, 0.5, 0.05), L("vivres", 1, 3, 0.4), L("papier", 4, 12, 0.6), L("cable", 1, 4, 0.6),
      L("composants", 1, 3, 0.4, 0.05), L("visserie", 2, 8, 0.5), L("tuyau", 1, 3, 0.4), L("vitre", 1, 2, 0.3), L("couteau", 1, 1, 0.4, 0.05), L("marteau", 1, 1, 0.35, 0.05),
      L("scie", 1, 1, 0.25, 0.05), L("pince", 1, 1, 0.3, 0.05), L("truelle", 1, 1, 0.2, 0.03), L("pied-de-biche", 1, 1, 0.15, 0.05), L("savon", 1, 3, 0.4),
      L("pansement", 1, 4, 0.3, 0.05), L("alcool-desinfectant", 1, 2, 0.2, 0.05), L("eau-de-javel", 1, 2, 0.35), L("eau", 1, 4, 0.3), L("bache", 1, 2, 0.3),
      L("ciment", 1, 2, 0.15), L("bouteille-de-gaz", 1, 1, 0.2, 0.03), L("cellule-solaire", 1, 2, 0.05, 0.05), L("panneau-solaire", 1, 1, 0.04, 0.05),
      L("groupe-electrogene", 1, 1, 0.03, 0.04), L("tronconneuse", 1, 1, 0.03, 0.04), L("moteur-electrique", 1, 1, 0.04, 0.04), L("carabine-22", 1, 1, 0.02, 0.04),
      L("pistolet-de-service", 1, 1, 0.01, 0.03), L("cartouches", 3, 10, 0.05, 0.05), L("douilles", 2, 6, 0.05, 0.04), L("sac-de-goni", 1, 1, 0.08)],
    betes: [["poule", 0.04], ["lapin", 0.02], ["essaim", 0.015]], demontage: D(21, 1, 32, 2),
    description: `Parpaings, carrelage, tôle sur charpente : la maison d'une famille qui avait un salaire. Plus de câbles et d'électroménager que de vivres, et un garage où l'on rangeait tout.` }),
  G("immeuble", "Immeuble", { batiments: ["immeuble"], gestes: 16, travail: 3, nombre: { base: 0, parPopulation: 4 },
    lots: [L("tissu", 3, 8, 0.8), L("bocal", 2, 6, 0.7), L("conserve", 2, 6, 0.55, 0.05), L("vivres", 1, 4, 0.45), L("papier", 6, 16, 0.6), L("cable", 2, 6, 0.6),
      L("composants", 1, 4, 0.45, 0.05), L("visserie", 2, 8, 0.5), L("tuyau", 1, 4, 0.4), L("vitre", 1, 3, 0.35), L("couteau", 1, 2, 0.45, 0.05), L("marteau", 1, 1, 0.35, 0.05),
      L("pince", 1, 1, 0.3, 0.05), L("savon", 2, 5, 0.5), L("pansement", 2, 6, 0.4, 0.05), L("alcool-desinfectant", 1, 2, 0.25, 0.05), L("eau-de-javel", 1, 3, 0.4),
      L("eau", 2, 6, 0.35), L("couverture", 1, 2, 0.3), L("bougie", 1, 4, 0.35), L("lampe-electrique", 1, 1, 0.15, 0.04), L("bouteille-de-gaz", 1, 2, 0.25, 0.03),
      L("cadre-de-velo", 1, 1, 0.15, 0.03), L("moteur-electrique", 1, 1, 0.06, 0.04), L("radio-a-manivelle", 1, 1, 0.03, 0.03), L("cartouches", 3, 10, 0.04, 0.05)],
    demontage: D(30, 3, 60, 2),
    description: `Une cage d'escalier, des paliers, des portes enfoncées ou barricadées. Beaucoup d'appartements, peu de chaque chose dans chacun, et des voisins qui n'ont pas tous quitté les lieux.` }),
  G("remise", "Remise, boucan, abri de jardin", { batiments: ["annexe"], gestes: 5, travail: 1, nombre: { base: 4, parPopulation: 3 },
    lots: [L("corde", 1, 1, 0.5), L("graines", 2, 6, 0.4), L("grillage", 1, 2, 0.3), L("fil-de-fer", 2, 5, 0.5), L("clous", 10, 40, 0.5), L("sabre-a-canne", 1, 1, 0.35, 0.05),
      L("pelle-pioche", 1, 1, 0.3, 0.05), L("seau", 1, 1, 0.4), L("bache", 1, 2, 0.3), L("tuyau", 1, 3, 0.3), L("cadre-de-velo", 1, 1, 0.12, 0.03), L("moteur", 1, 1, 0.05, 0.04),
      L("carburant", 1, 3, 0.15, 0.05), L("ciment", 1, 2, 0.15), L("roue", 1, 2, 0.15), L("douilles", 2, 6, 0.05, 0.04), L("fusil-de-chasse", 1, 1, 0.03, 0.04),
      L("sac-de-goni", 1, 2, 0.2), L("cage", 1, 1, 0.08)],
    betes: [["poule", 0.03], ["essaim", 0.03]], demontage: D(2, 0, 4),
    description: `Le boucan au fond de la cour, la cabane à outils, le kiosque du jardin : ce qu'on ne voulait pas dans la maison, et qui sert maintenant le plus.` }),
  G("boutique", "Boutique de quartier", { batiments: ["boutique"], gestes: 12, travail: 2, nombre: { base: 1, parPopulation: 3 },
    lots: [L("conserve", 3, 8, 0.8, 0.04), L("vivres", 2, 6, 0.6), L("eau", 2, 6, 0.6), L("savon", 2, 5, 0.6), L("pansement", 2, 6, 0.4, 0.05), L("alcool-desinfectant", 1, 3, 0.3, 0.05),
      L("eau-de-javel", 1, 3, 0.5), L("tissu", 2, 6, 0.5), L("corde", 1, 1, 0.5), L("bocal", 2, 6, 0.6), L("bache", 1, 3, 0.4), L("graines", 2, 8, 0.5), L("clous", 20, 80, 0.5),
      L("visserie", 4, 12, 0.5), L("fil-de-fer", 2, 6, 0.5), L("carburant", 1, 4, 0.25, 0.05), L("papier", 5, 15, 0.6), L("marteau", 1, 1, 0.3, 0.05), L("scie", 1, 1, 0.25, 0.05),
      L("truelle", 1, 1, 0.2, 0.05), L("pince", 1, 1, 0.25, 0.05), L("pelle-pioche", 1, 1, 0.2, 0.05), L("couteau", 1, 2, 0.35, 0.05), L("sabre-a-canne", 1, 1, 0.3, 0.05),
      L("seau", 1, 2, 0.4), L("bouteille-de-gaz", 1, 2, 0.25, 0.04), L("cartouches", 4, 12, 0.06, 0.06), L("composants", 1, 3, 0.2, 0.05)],
    demontage: D(16, 1, 24, 2),
    description: `La boutique chinoise du coin, celle qui vendait de tout, du riz au marteau, à crédit pour ceux qu'on connaissait. Le rideau de fer a été forcé, ou pas.` }),
  G("commerce", "Supérette, grande surface", { batiments: ["commerce"], gestes: 20, travail: 4, nombre: { base: 0, parPopulation: 1.2 },
    lots: [L("conserve", 6, 16, 0.85, 0.03), L("vivres", 4, 10, 0.6), L("eau", 4, 12, 0.7), L("savon", 3, 8, 0.7), L("eau-de-javel", 2, 5, 0.6), L("pansement", 2, 6, 0.4, 0.05),
      L("alcool-desinfectant", 1, 3, 0.3, 0.05), L("tissu", 3, 8, 0.6), L("bocal", 4, 10, 0.7), L("bache", 1, 4, 0.5), L("corde", 1, 1, 0.5), L("graines", 3, 10, 0.5),
      L("bougie", 2, 8, 0.5), L("sel", 1, 4, 0.5), L("vinaigre", 1, 3, 0.4), L("rhum", 1, 3, 0.35, 0.04), L("papier", 8, 20, 0.6), L("cahier-vierge", 1, 3, 0.3),
      L("seau", 1, 3, 0.5), L("couteau", 1, 3, 0.4, 0.05), L("lampe-electrique", 1, 2, 0.2, 0.05), L("bouteille-de-gaz", 1, 3, 0.35, 0.04), L("rechaud", 1, 1, 0.1, 0.04),
      L("couverture", 1, 3, 0.3), L("savates", 1, 3, 0.3), L("gants-de-travail", 1, 2, 0.25), L("composants", 1, 4, 0.25, 0.05), L("batterie-nomade", 1, 1, 0.03, 0.04)],
    demontage: D(24, 3, 48, 2),
    description: `Les rayons renversés, les caddies, les chambres froides qui sentent. La première chose qu'on a pillée au jour deux ; mais il y a toujours une réserve derrière, un quai de livraison, un rayon qu'on a négligé.` }),
  G("pharmacie", "Pharmacie", { batiments: ["pharmacie"], gestes: 10, travail: 2, nombre: { base: 0, parPopulation: 1 },
    lots: [L("pansement", 4, 12, 0.9, 0.02), L("alcool-desinfectant", 2, 6, 0.75, 0.04), L("savon", 2, 6, 0.7), L("eau-de-javel", 1, 3, 0.4), L("solute", 1, 3, 0.35, 0.06),
      L("attelle", 1, 2, 0.3, 0.05), L("baume", 1, 3, 0.3, 0.04), L("trousse-de-secours", 1, 1, 0.15, 0.07), L("tissu", 1, 4, 0.4), L("bocal", 2, 6, 0.5), L("eau", 1, 4, 0.4),
      L("papier", 3, 8, 0.4), L("moustiquaires", 1, 1, 0.08, 0.04)],
    demontage: D(14, 1, 24, 2),
    description: `La croix verte éteinte, la vitrine étoilée. Les tiroirs des médicaments ont été vidés en premier ; restent les pansements, le désinfectant, les attelles, ce qui ne se revend pas.` }),
  G("sante", "Centre de santé, dispensaire", { batiments: ["sante"], gestes: 16, travail: 3, nombre: { base: 0, parPopulation: 0.4 },
    lots: [L("pansement", 4, 14, 0.8, 0.03), L("alcool-desinfectant", 2, 6, 0.6, 0.05), L("savon", 2, 8, 0.7), L("eau-de-javel", 2, 5, 0.6), L("solute", 1, 4, 0.35, 0.06),
      L("attelle", 1, 3, 0.35, 0.05), L("trousse-de-secours", 1, 2, 0.15, 0.07), L("tissu", 3, 10, 0.7), L("couverture", 1, 4, 0.5), L("eau", 2, 8, 0.5), L("bocal", 2, 6, 0.5),
      L("papier", 5, 14, 0.5), L("cable", 1, 4, 0.4), L("composants", 1, 4, 0.3, 0.05), L("lampe-electrique", 1, 2, 0.2, 0.05), L("bouteille-de-gaz", 1, 2, 0.2, 0.04),
      L("groupe-electrogene", 1, 1, 0.04, 0.05), L("moustiquaires", 1, 2, 0.1, 0.04)],
    demontage: D(24, 3, 48, 2),
    description: `Un dispensaire, une maison médicale, le centre de santé du bourg : les brancards dans le couloir, les dossiers par terre. On y a soigné les premiers mordus ; certains y sont encore.` }),
  G("restaurant", "Restaurant, snack", { batiments: ["restaurant"], gestes: 10, travail: 2, nombre: { base: 0, parPopulation: 1.5 },
    lots: [L("conserve", 2, 8, 0.7, 0.04), L("vivres", 2, 6, 0.5), L("eau", 2, 6, 0.5), L("sel", 1, 4, 0.6), L("vinaigre", 1, 3, 0.5), L("rhum", 1, 4, 0.45, 0.04),
      L("bocal", 3, 8, 0.7), L("couteau", 1, 3, 0.6, 0.04), L("savon", 1, 3, 0.4), L("eau-de-javel", 1, 2, 0.4), L("tissu", 1, 4, 0.5), L("seau", 1, 2, 0.4),
      L("bouteille-de-gaz", 1, 3, 0.45, 0.04), L("rechaud", 1, 1, 0.15, 0.04), L("charbon-de-bois", 1, 4, 0.3), L("bougie", 1, 4, 0.3)],
    demontage: D(10, 1, 20, 2),
    description: `Le camion-bar du front de mer, le snack à samoussas, le restaurant du dimanche avec sa marmite à cari : des bouteilles de gaz, du sel, du rhum, des couteaux.` }),
  G("quincaillerie", "Quincaillerie", { batiments: ["quincaillerie"], gestes: 14, travail: 3, nombre: { base: 0, parPopulation: 0.6 },
    lots: [L("clous", 30, 120, 0.85), L("visserie", 6, 20, 0.8), L("fil-de-fer", 3, 10, 0.7), L("corde", 1, 1, 0.6), L("grillage", 1, 4, 0.5), L("bache", 1, 4, 0.5),
      L("tuyau", 2, 6, 0.5), L("ciment", 1, 4, 0.45), L("tole", 1, 4, 0.35), L("seau", 1, 3, 0.5), L("gants-de-travail", 1, 3, 0.45), L("marteau", 1, 2, 0.55, 0.05),
      L("scie", 1, 2, 0.45, 0.05), L("truelle", 1, 2, 0.45, 0.05), L("pince", 1, 2, 0.45, 0.05), L("pelle-pioche", 1, 2, 0.4, 0.05), L("pied-de-biche", 1, 1, 0.3, 0.05),
      L("sabre-a-canne", 1, 2, 0.4, 0.05), L("hache", 1, 1, 0.2, 0.05), L("masse", 1, 1, 0.15, 0.05), L("pierre-a-aiguiser", 1, 2, 0.3), L("cable", 2, 6, 0.5),
      L("graines", 2, 8, 0.35), L("engrais", 1, 3, 0.3), L("tronconneuse", 1, 1, 0.05, 0.05), L("groupe-electrogene", 1, 1, 0.03, 0.05)],
    demontage: D(20, 2, 40, 2),
    description: `La quincaillerie de la rue principale : les clous au poids, les rouleaux de grillage, les sabres à canne pendus au mur. Ce qu'on pille le plus tard, et ce qui sert le plus longtemps.` }),
  G("garage", "Garage", { batiments: ["garage"], gestes: 12, travail: 2, nombre: { base: 0, parPopulation: 1 }, route: true,
    lots: [L("visserie", 4, 14, 0.8), L("ferraille", 2, 8, 0.7), L("cable", 2, 6, 0.6), L("pince", 1, 2, 0.5, 0.05), L("marteau", 1, 1, 0.35, 0.05), L("pied-de-biche", 1, 1, 0.3, 0.05),
      L("chambre-a-air", 1, 4, 0.5), L("rustine", 1, 4, 0.4), L("roue", 1, 3, 0.45), L("ressort", 1, 3, 0.45, 0.03), L("tuyau", 1, 4, 0.4), L("carburant", 1, 5, 0.4, 0.05),
      L("batterie-de-voiture", 1, 2, 0.3, 0.04), L("gants-de-travail", 1, 2, 0.35), L("tissu", 1, 4, 0.4), L("moteur", 1, 1, 0.1, 0.05), L("cadre-de-velo", 1, 1, 0.15, 0.03),
      L("fut", 1, 1, 0.15)],
    demontage: D(14, 3, 28, 2),
    description: `L'atelier de mécanique avec sa fosse, ses pneus empilés et son odeur d'huile. Des pièces de tout, une batterie, une lame de ressort pour un sabre : le trésor de celui qui sait bricoler.` }),
  G("station-service", "Station-service", { batiments: ["station-service"], gestes: 10, travail: 2, nombre: { base: 0, parPopulation: 0.8 }, route: true,
    lots: [L("carburant", 2, 8, 0.6, 0.07), L("fut", 1, 2, 0.35), L("tuyau", 1, 4, 0.5), L("seau", 1, 2, 0.4), L("conserve", 1, 5, 0.45, 0.04), L("eau", 2, 6, 0.5),
      L("vivres", 1, 4, 0.35), L("tissu", 1, 3, 0.4), L("bache", 1, 2, 0.3), L("chambre-a-air", 1, 3, 0.35), L("rustine", 1, 3, 0.3), L("batterie-de-voiture", 1, 1, 0.2, 0.04),
      L("bouteille-de-gaz", 1, 3, 0.4, 0.04), L("cable", 1, 3, 0.3), L("papier", 2, 8, 0.4)],
    demontage: D(12, 3, 24, 2),
    description: `Les cuves enterrées, les pompes mortes sans courant, la boutique aux vitres brisées. Le gazole ne se tire plus qu'à la main, et tout le monde le sait.` }),
  G("ecole", "École, collège", { batiments: ["ecole"], gestes: 12, travail: 2, nombre: { base: 1, parPopulation: 1.5 },
    lots: [L("papier", 10, 30, 0.9), L("cahier-vierge", 1, 5, 0.6), L("encre", 1, 3, 0.5), L("tissu", 1, 4, 0.4), L("savon", 1, 4, 0.4), L("pansement", 1, 4, 0.3, 0.04),
      L("eau", 1, 5, 0.35), L("bocal", 1, 4, 0.35), L("corde", 1, 1, 0.25), L("cable", 1, 4, 0.4), L("composants", 1, 3, 0.3, 0.05), L("visserie", 1, 5, 0.3),
      L("eau-de-javel", 1, 3, 0.4), L("vivres", 1, 4, 0.25), L("conserve", 1, 4, 0.25, 0.04)],
    betes: [["essaim", 0.02]], demontage: D(20, 2, 40, 2),
    description: `La cour sous les badamiers, les préaux, la cantine. Les dessins encore aux murs. On s'y est réfugié les premiers jours, puis on en est parti.` }),
  G("administration", "Mairie, poste, administration", { batiments: ["administration"], gestes: 12, travail: 2, nombre: { base: 0, parPopulation: 0.8 },
    lots: [L("papier", 10, 30, 0.9), L("cahier-vierge", 1, 4, 0.5), L("encre", 1, 3, 0.45), L("cable", 2, 6, 0.6), L("composants", 1, 4, 0.45, 0.05), L("tissu", 1, 3, 0.35),
      L("eau", 1, 4, 0.35), L("savon", 1, 3, 0.3), L("bougie", 1, 3, 0.25), L("lampe-electrique", 1, 2, 0.2, 0.05), L("radio-a-manivelle", 1, 1, 0.04, 0.04),
      L("batterie-nomade", 1, 1, 0.03, 0.04), L("groupe-electrogene", 1, 1, 0.03, 0.04)],
    demontage: D(20, 2, 40, 2),
    description: `La mairie, la poste, le bureau de l'état civil : des papiers en piles, des registres, des tampons. Un groupe électrogène de secours, parfois, au sous-sol.` }),
  G("caserne", "Gendarmerie, caserne de pompiers", { batiments: ["gendarmerie", "pompiers"], gestes: 14, travail: 3, nombre: { base: 0, parPopulation: 0.6 },
    lots: [L("pansement", 2, 8, 0.6, 0.04), L("alcool-desinfectant", 1, 3, 0.4, 0.05), L("trousse-de-secours", 1, 1, 0.2, 0.07), L("couverture", 1, 4, 0.5), L("corde", 1, 1, 0.6),
      L("lampe-electrique", 1, 2, 0.35, 0.05), L("papier", 5, 14, 0.6), L("cable", 1, 4, 0.4), L("carburant", 1, 5, 0.35, 0.06), L("gants-de-travail", 1, 3, 0.45),
      L("hache", 1, 1, 0.25, 0.05), L("pied-de-biche", 1, 1, 0.3, 0.05), L("conserve", 1, 5, 0.35, 0.04), L("eau", 2, 6, 0.45), L("radio-a-manivelle", 1, 1, 0.1, 0.05),
      L("cartouches", 2, 10, 0.08, 0.07), L("pistolet-de-service", 1, 1, 0.02, 0.05), L("groupe-electrogene", 1, 1, 0.05, 0.05)],
    demontage: D(22, 3, 44, 2),
    description: `La brigade, le centre de secours : du matériel pour tenir, porter, soigner, éclairer. Les armes sont parties avec ceux qui les portaient ; il reste ce qu'ils n'ont pas eu le temps de prendre.` }),
  G("hangar", "Hangar agricole, serre", { batiments: ["hangar-agricole", "serre"], gestes: 10, travail: 2, nombre: { base: 2, parPopulation: 1 },
    lots: [L("sabre-a-canne", 1, 2, 0.5, 0.04), L("pelle-pioche", 1, 2, 0.45, 0.04), L("graines", 3, 12, 0.6), L("engrais", 1, 4, 0.45), L("fumier", 1, 4, 0.35), L("plants", 1, 6, 0.3),
      L("corde", 1, 1, 0.6), L("grillage", 1, 3, 0.45), L("fil-de-fer", 2, 8, 0.6), L("bache", 1, 3, 0.5), L("tuyau", 2, 6, 0.5), L("seau", 1, 3, 0.5), L("fut", 1, 2, 0.3),
      L("carburant", 1, 4, 0.3, 0.05), L("tole", 1, 4, 0.4), L("ferraille", 2, 6, 0.5), L("gants-de-travail", 1, 2, 0.3), L("roue", 1, 2, 0.25), L("pierre-a-aiguiser", 1, 1, 0.25),
      L("moteur", 1, 1, 0.06, 0.04), L("tronconneuse", 1, 1, 0.04, 0.04), L("sac-de-goni", 1, 3, 0.35), L("cage", 1, 1, 0.12)],
    betes: [["cabri", 0.04], ["poule", 0.06], ["porcelet", 0.03], ["veau-moka", 0.02], ["lapin", 0.02], ["essaim", 0.025]], demontage: D(10, 1, 14, 2),
    description: `Le hangar du planteur, la serre à tomates, l'étable vide au bout du chemin : des outils de champ, des semences, et les dernières bêtes qu'on n'a pas eu le cœur d'emmener.` }),
  G("entrepot", "Entrepôt, usine, aérogare", { batiments: ["entrepot", "usine", "aerogare"], gestes: 16, travail: 3, nombre: { base: 0, parPopulation: 1.2 },
    lots: [L("ferraille", 4, 12, 0.8), L("tole", 2, 6, 0.6), L("cable", 2, 8, 0.7), L("tuyau", 2, 6, 0.6), L("visserie", 4, 16, 0.7), L("composants", 1, 5, 0.4, 0.05),
      L("ciment", 1, 4, 0.35), L("parpaing", 2, 8, 0.35), L("bache", 1, 4, 0.5), L("corde", 1, 1, 0.4), L("fut", 1, 3, 0.4), L("gants-de-travail", 1, 3, 0.4),
      L("carburant", 1, 5, 0.3, 0.06), L("ressort", 1, 3, 0.3, 0.03), L("pince", 1, 1, 0.3, 0.05), L("masse", 1, 1, 0.15, 0.05), L("moteur-electrique", 1, 2, 0.12, 0.05),
      L("groupe-electrogene", 1, 1, 0.05, 0.05), L("panneau-solaire", 1, 1, 0.03, 0.05)],
    demontage: D(30, 4, 60, 2),
    description: `Les zones d'activité, les docks, la sucrerie, le terminal de l'aéroport : de grands volumes vides, des palettes, des machines arrêtées. Rien à manger, tout pour bâtir.` }),
  G("hotel", "Hôtel, gîte", { batiments: ["hotel"], gestes: 14, travail: 3, nombre: { base: 0.4, parPopulation: 0.6 },
    lots: [L("tissu", 4, 12, 0.85), L("couverture", 2, 6, 0.6), L("savon", 3, 8, 0.7), L("eau", 2, 8, 0.5), L("conserve", 2, 6, 0.45, 0.04), L("vivres", 1, 5, 0.4),
      L("rhum", 1, 3, 0.35, 0.04), L("bocal", 2, 6, 0.6), L("bougie", 2, 6, 0.45), L("moustiquaires", 1, 2, 0.2, 0.03), L("couteau", 1, 2, 0.4, 0.04), L("eau-de-javel", 1, 3, 0.45),
      L("papier", 3, 10, 0.5), L("cable", 1, 4, 0.4), L("bouteille-de-gaz", 1, 2, 0.3, 0.04)],
    demontage: D(24, 2, 48, 2),
    description: `L'hôtel du bord de mer, le gîte de montagne, la chambre d'hôtes du cirque : des draps, des couvertures, du savon en petites boîtes, le bar, la cuisine au gaz.` }),
  G("gymnase", "Gymnase, tribune", { batiments: ["gymnase", "tribune"], gestes: 8, travail: 2, nombre: { base: 0, parPopulation: 0.6 },
    lots: [L("tissu", 2, 6, 0.6), L("corde", 1, 1, 0.5), L("bache", 1, 3, 0.4), L("eau", 1, 5, 0.4), L("pansement", 1, 4, 0.3, 0.04), L("savon", 1, 3, 0.3), L("cable", 1, 4, 0.4),
      L("grillage", 1, 3, 0.3), L("ferraille", 1, 4, 0.4), L("couverture", 1, 3, 0.2)],
    demontage: D(16, 2, 32, 2),
    description: `Le gymnase où l'on a installé des lits de camp au jour un, le stade et ses tribunes : des couvertures, des bâches, ce qui reste d'un centre d'accueil qui n'a pas tenu.` }),
  G("reservoir", "Château d'eau, réservoir", { batiments: ["reservoir"], gestes: 4, travail: 1, nombre: { base: 1, parPopulation: 0.4 },
    lots: [L("eau", 3, 8, 0.7), L("tuyau", 1, 3, 0.5), L("ferraille", 1, 3, 0.4), L("visserie", 1, 4, 0.3), L("seau", 1, 2, 0.3), L("grillage", 1, 1, 0.2)],
    demontage: D(6, 2, 12, 2),
    description: `La cuve de béton sur la colline, la bâche à eau du quartier. Ce qui reste au fond n'est pas toujours bon à boire tel quel.` }),
  G("lieu-de-culte", "Lieu de culte", { batiments: ["eglise", "temple-hindou", "mosquee", "pagode"], gestes: 6, travail: 1, nombre: { base: 1, parPopulation: 1.5 }, culte: true,
    lots: [L("bougie", 1, 5, 0.7), L("eau", 1, 3, 0.5), L("tissu", 1, 3, 0.4), L("papier", 1, 5, 0.4), L("cire", 1, 2, 0.3), L("bocal", 1, 2, 0.3)],
    betes: [["essaim", 0.04]], demontage: D(16, 0, 40, 2),
    description: `Une église, un temple tamoul, une mosquée, une pagode, une chapelle au bord du chemin. Des bougies, de l'eau, des nappes. On n'y trouve ni outil ni arme, et y prendre quoi que ce soit ne laisse personne indifférent.` }),
  G("voiture", "Voiture à l'abandon", { gestes: 4, travail: 1, nombre: { base: 3, parPopulation: 6 }, route: true,
    lots: [L("tissu", 1, 2, 0.5), L("papier", 1, 4, 0.5), L("cable", 1, 2, 0.3), L("carburant", 1, 3, 0.25, 0.05), L("bache", 1, 1, 0.2), L("pince", 1, 1, 0.15, 0.04),
      L("couteau", 1, 1, 0.1, 0.04), L("conserve", 1, 2, 0.15, 0.04), L("eau", 1, 2, 0.2), L("pansement", 1, 2, 0.15, 0.04), L("corde", 1, 1, 0.2), L("pied-de-biche", 1, 1, 0.1, 0.04),
      L("visserie", 1, 3, 0.3)],
    demontage: D(1, 3, 6, 2),
    description: `Une voiture arrêtée en travers, portières ouvertes, ou une épave poussée dans le fossé : la boîte à gants, le coffre, le réservoir. Démontée, elle rend une batterie, des roues, une lame de ressort.` }),
  G("decombres", "Décombres", { gestes: 5, travail: 1, nombre: { base: 2, parPopulation: 2 },
    lots: [L("planche", 1, 3, 0.6), L("clous", 4, 12, 0.7), L("tole", 1, 2, 0.35), L("ferraille", 1, 4, 0.6), L("fil-de-fer", 1, 3, 0.5), L("visserie", 1, 4, 0.45), L("tissu", 1, 3, 0.45),
      L("bocal", 1, 2, 0.35), L("parpaing", 1, 3, 0.3), L("moellon", 1, 2, 0.3), L("chambre-a-air", 1, 2, 0.2), L("cable", 1, 2, 0.25), L("tuyau", 1, 2, 0.25), L("papier", 2, 6, 0.2),
      L("vivres", 1, 2, 0.2), L("bache", 1, 1, 0.12), L("ciment", 1, 1, 0.08), L("vitre", 1, 1, 0.08), L("grillage", 1, 1, 0.08), L("seau", 1, 1, 0.08), L("roue", 1, 1, 0.06),
      L("eau-de-javel", 1, 1, 0.06), L("conserve", 1, 1, 0.12, 0.03), L("composants", 1, 2, 0.12, 0.05), L("couteau", 1, 1, 0.08, 0.03), L("marteau", 1, 1, 0.08, 0.03),
      L("scie", 1, 1, 0.05, 0.03), L("pelle-pioche", 1, 1, 0.05, 0.03), L("pied-de-biche", 1, 1, 0.05, 0.03), L("sabre-a-canne", 1, 1, 0.05, 0.03), L("pince", 1, 1, 0.05, 0.03),
      L("truelle", 1, 1, 0.04, 0.02), L("ressort", 1, 1, 0.05, 0.03), L("carburant", 1, 2, 0.04, 0.03), L("douilles", 1, 3, 0.03, 0.03), L("cellule-solaire", 1, 1, 0.02, 0.03),
      L("batterie-de-voiture", 1, 1, 0.03, 0.02), L("cadre-de-velo", 1, 1, 0.03, 0.02)],
    betes: [["essaim", 0.01]], demontage: D(3, 0, 6),
    description: `Une case effondrée par le dernier cyclone, un tas de gravats au bord d'un terrain vague, un chantier arrêté au jour un : on y fouille à la main, entre les planches et la ferraille.` })
];

// Le genre de chacun des sites d'abri (contrat §2.2) : d'après son type, sauf les sites que leur type ne dit pas assez. Un tunnel de lave
// ou une galerie ne se fouille pas comme un bâtiment (genre vide).
export const GENRE_DES_TYPES = { maison: "maison", "case-creole": "case", immeuble: "immeuble", ecole: "ecole", commerce: "commerce", ferme: "hangar", gite: "hotel",
  ilet: "case", caserne: "caserne", hopital: "sante", port: "entrepot", phare: "administration", usine: "entrepot", eglise: "lieu-de-culte", "tunnel-de-lave": "", galerie: "", autre: "maison" };
const GENRE_DES_SITES = { "lazaret-de-la-grande-chaloupe": "administration", "centre-des-tortues": "administration", "thermes-de-cilaos": "hotel" };
// Les sites des écarts (loin du bâti serré) : îlets, gîtes, fermes, phares, tunnels.
const TYPES_ECART = ["ilet", "gite", "ferme", "phare", "tunnel-de-lave", "galerie"];
export const sitesAvecGenres = sites => sites.map(s => ({ ...s, genre: GENRE_DES_SITES[s.cle] ?? GENRE_DES_TYPES[s.type] ?? "maison", ecart: TYPES_ECART.includes(s.type) }));

// ---------------------------------------------------------------- Les bêtes trouvées en fouillant
// nombre [min, max] ; capture : ce qui la prend (le champ `capture` des équipements) ; tient : quarts hors d'un enclos (le jeu 3D : 12 à
// 48 heures) ; viande : la nourriture qu'elle laisse si elle meurt ou qu'on l'abat ; enclos : les installations où elle se garde ;
// sansOutil : « file » (elle s'échappe, le lieu n'en a plus) ou « pique » (une blessure, l'essaim reste).
const B = (cle, nom, { nombre = [1, 1], tient, viande, enclos, sansOutil = "file", description }) => ({ cle, nom, nombre, tient, viande, enclos, sansOutil, description });
export const BETES_TROUVEES = [
  B("poule", "Poule", { nombre: [1, 3], tient: 4, viande: 1, enclos: ["basse-cour"], description: `Une poule de cour, rousse et maigre, qui gratte encore derrière la case. On l'attrape avec une cage ou un sac de goni ; sinon elle file sous les fourrés.` }),
  B("lapin", "Lapin", { nombre: [1, 2], tient: 4, viande: 1, enclos: ["basse-cour"], description: `Un lapin de clapier resté dans sa caisse, ou qui en est sorti. Une cage ou un sac de goni.` }),
  B("cabri", "Cabri", { tient: 6, viande: 6, enclos: ["enclos-a-cabris"], description: `Un cabri attaché à un piquet qui a mangé tout ce qu'il pouvait atteindre. Il se prend à la corde, et il tire.` }),
  B("porcelet", "Porcelet", { tient: 5, viande: 4, enclos: ["enclos-a-cabris"], description: `Un cochon de lait échappé de sa soue, qui crie dès qu'on l'approche. Une corde ou un sac de goni.` }),
  B("veau-moka", "Veau moka", { tient: 8, viande: 10, enclos: ["enclos-a-cabris"], description: `Un jeune bœuf moka, petit et têtu, resté dans l'étable d'un hangar des Hauts. Il se mène à la corde, lentement.` }),
  B("essaim", "Essaim d'abeilles", { tient: 2, viande: 0, enclos: ["ruches", "ruches-en-tronc"], sansOutil: "pique", description: `Un essaim installé dans un mur creux, un toit, une caisse : on l'entend avant de le voir. Il se prend à l'enfumoir ; sans lui, il pique, et il reste.` })
];

// ---------------------------------------------------------------- Prendre une bête : les outils (champ `capture`) et leurs recettes
// L'outil qui prend chaque sorte de bête (le champ `capture` des équipements). Fusion de la vague 3 : une seule fiche par outil, celle
// du lot 6 (contenu/ateliers.mjs : cage de bambou, sac de goni, enfumoir, avec leur recette dans contenu/recettes-3d.mjs) ; la corde
// est la corde de choka (lot « savoirs »), une seule clé ; ce qu'on trouve en fouillant (« une corde », « une cage à volailles »)
// donne ces objets-là.
export const CAPTURE_DES_EQUIPEMENTS = { "cordes-de-choka": ["cabri", "porcelet", "veau-moka"], "sac-de-goni": ["poule", "lapin", "porcelet"],
  "cage-de-bambou": ["poule", "lapin"], enfumoir: ["essaim"] };
// Les documents d'équipement reçoivent leur champ `capture` (compendium), le même que celui du registre ; posé sur place, pour que
// les documents restent ceux que les autres fichiers exportent.
export function documentsAvecCapture(docs) {
  for (const d of docs) if (CAPTURE_DES_EQUIPEMENTS[d.system?.cle]) d.system.capture = [...CAPTURE_DES_EQUIPEMENTS[d.system.cle]];
  return docs;
}

// ---------------------------------------------------------------- Les gisements et les milieux de l'île (la récolte)
// produits : [objet, min, max] ; parQuart : gisements qu'un survivant exploite en un quart ; repousse : jours de saison des pluies avant
// qu'il revienne (à 0,4 de cette vitesse en saison sèche) ; altitudeMax : au-dessus, il n'y en a pas ; bruit : par quart ; outils : ce
// qui aide (sans eux, deux fois plus lent) ; renvoi : un gisement qui se prend autrement (cueillette, jardins, eau du site, fouille) :
// il se raconte, la récolte ne le prend pas.
const P = (objetCle, min, max) => ({ objet: objetCle, q: [min, max] });
const GI = (cle, nom, { produits = [], parQuart = 2, repousse, altitudeMax = null, bruit = 0, outils = [], renvoi = "", description }) =>
  ({ cle, nom, description, produits, parQuart, repousse, ...(altitudeMax ? { altitudeMax } : {}), bruit, outils, ...(renvoi ? { renvoi } : {}) });
export const GISEMENTS = [
  GI("bambou", "Touffe de bambous", { produits: [P("bambou", 3, 6)], parQuart: 2, repousse: 60, altitudeMax: 1500, bruit: 1, outils: ["sabre-a-canne", "hache", "scie"],
    description: `Une touffe de bambous au fond d'une ravine ou au bord d'un ruisseau : des perches droites pour une palissade, une conduite, une cage.` }),
  GI("choka", "Pied de choka", { produits: [P("feuille-de-choka", 3, 6)], parQuart: 4, repousse: 60, altitudeMax: 1300, outils: ["sabre-a-canne", "couteau"],
    description: `L'agave des savanes de l'Ouest, aux longues feuilles piquantes : on en tire une fibre qui fait de bonnes cordes.` }),
  GI("vacoa", "Pied de vacoa", { produits: [P("feuille-de-vacoa", 6, 12)], parQuart: 4, repousse: 30, outils: ["sabre-a-canne", "couteau"],
    description: `Le vacoa des bords de mer et des ravines du Sud : ses feuilles tressées font les nattes, les sacs, les toits.` }),
  GI("bancoulier", "Bancoulier", { produits: [P("noix-de-bancoul", 8, 16)], parQuart: 4, repousse: 45, altitudeMax: 800,
    description: `Un grand arbre des Bas aux noix huileuses : on ne les mange pas crues, mais leur huile éclaire une lampe.` }),
  GI("terre", "Talus de terre", { produits: [P("terre", 2, 3)], parQuart: 2, repousse: 30, outils: ["pelle-pioche"],
    description: `Un talus de terre rouge qu'on attaque à la pioche : pour le torchis, les buttes du potager, les jarres.` }),
  GI("argile", "Berge d'argile", { produits: [P("argile", 1, 2)], parQuart: 2, repousse: 20, outils: ["pelle-pioche"],
    description: `Une berge grasse au fond d'une ravine : l'argile des jarres, du torchis, des fours.` }),
  GI("sable", "Banc de sable", { produits: [P("sable", 1, 3)], parQuart: 2, repousse: 10,
    description: `Le sable d'une plage ou d'une ravine : pour le mortier, les filtres à eau.` }),
  GI("galets", "Galets roulés", { produits: [P("galet", 3, 6), P("moellon", 0, 1)], parQuart: 4, repousse: 30,
    description: `Les galets ronds des ravines et des plages de l'Est, qu'on ramasse à la main : murets, foyers, fondations.` }),
  GI("basalte", "Bloc de basalte", { produits: [P("moellon", 3, 5), P("galet", 2, 4)], parQuart: 1, repousse: 120, bruit: 2, outils: ["pelle-pioche", "masse", "barre-a-mine"],
    description: `Une coulée ancienne, un éboulis : la pierre noire de l'île, qu'on débite à la masse pour la pierre sèche.` }),
  GI("coquillages", "Coquillages", { produits: [P("coquillage", 6, 14)], parQuart: 6, repousse: 5,
    description: `Les coquillages roulés sur le sable : brûlés, ils font la chaux des anciens.` }),
  GI("bois-flotte", "Bois flotté", { produits: [P("branche", 2, 4), P("gaulette", 0, 2)], parQuart: 6, repousse: 10,
    description: `Ce que la mer et les ravines en crue rejettent sur la côte : du bois sec, blanchi, qui brûle bien.` }),
  GI("vasque-de-sel", "Vasque de sel", { parQuart: 4, repousse: 7, renvoi: "sel",
    description: `Un creux de rocher où l'eau de mer s'évapore au soleil de l'Ouest : on y gratte une croûte de sel, qui garde le poisson (une recette).` }),
  GI("zerbaz", "Zerbaz", { parQuart: 6, repousse: 15, renvoi: "plantes",
    description: `Ayapana, citronnelle, bois de joli cœur : les plantes qui soignent. Elles se cueillent avec la cible « plantes ».` }),
  GI("jardin-en-friche", "Jardin en friche", { parQuart: 3, repousse: 40, renvoi: "jardins",
    description: `Le jardin d'une case abandonnée, envahi : des graines, quelques légumes, des zerbaz. Il se prend avec la cible « jardins ».` }),
  GI("source", "Source, trou d'eau", { parQuart: 6, repousse: 1, renvoi: "eau",
    description: `Une source au pied d'un rempart, un trou d'eau dans une ravine : l'eau d'un site, d'un captage, d'une citerne ; l'eau d'un trou se boit bouillie.` }),
  GI("decombres", "Décombres", { parQuart: 1, repousse: 1, renvoi: "lieu",
    description: `Un tas de gravats et de planches : il se fouille comme un lieu (genre « Décombres »).` })
];
// gisements : [gisement, part en centièmes] (le jeu 3D : la chance qu'un candidat de 32 m y devienne ce gisement). Le nombre de gisements
// d'une sorte dans une région : la somme des parts de ses milieux.
const M = (cle, nom, gisements, description) => ({ cle, nom, description, gisements: gisements.map(([gisement, part]) => ({ gisement, part })) });
export const MILIEUX = [
  M("foret-des-hauts", "Forêt des Hauts", [["zerbaz", 5], ["terre", 4], ["bambou", 3], ["basalte", 3], ["argile", 1]], `Tamarins, bois de couleur, fougères arborescentes, la mousse sur tout : la forêt humide au-dessus de mille mètres.`),
  M("foret-des-bas", "Forêt des Bas", [["bambou", 7], ["zerbaz", 5], ["terre", 4], ["bancoulier", 4], ["argile", 2], ["basalte", 2]], `Les ravines boisées de l'Est et du Sud, chaudes et mouillées : bambous, bancouliers, lianes.`),
  M("cultures", "Cultures", [["terre", 7], ["zerbaz", 6], ["jardin-en-friche", 5], ["bambou", 4], ["choka", 3], ["decombres", 2], ["argile", 2]], `Les champs de géranium, de légumes, de vanille, les vergers : la terre travaillée, retournée à la friche.`),
  M("canne", "Champs de canne", [["terre", 6], ["zerbaz", 2], ["bambou", 2], ["jardin-en-friche", 2], ["decombres", 1]], `Les cannes qui n'ont pas été coupées cette année, plus hautes qu'un homme : on s'y perd, on s'y cache.`),
  M("savane", "Savane", [["choka", 10], ["terre", 4], ["basalte", 4], ["zerbaz", 3], ["galets", 2]], `Les pentes sèches de l'Ouest, herbe jaune et chokas, sous un soleil qui cogne.`),
  M("foret-seche", "Forêt sèche", [["choka", 10], ["zerbaz", 4], ["basalte", 4], ["terre", 3], ["bancoulier", 1]], `Les reliques de forêt sèche des pentes de l'Ouest : bois noir, tamarins des Bas, épineux.`),
  M("ravine", "Ravine", [["galets", 12], ["sable", 6], ["argile", 6], ["source", 6], ["bambou", 6], ["bancoulier", 2]], `Le lit d'une ravine, à sec ou qui coule : des galets, du sable, de l'argile, des bambous, et l'eau quand il a plu en haut.`),
  M("plage", "Plage", [["sable", 14], ["coquillages", 10], ["bois-flotte", 6], ["galets", 3], ["vasque-de-sel", 2]], `Le sable blanc du lagon de l'Ouest, le sable noir de l'Étang-Salé, les galets de l'Est.`),
  M("cote-rocheuse", "Côte rocheuse", [["galets", 10], ["vasque-de-sel", 8], ["bois-flotte", 6], ["basalte", 5], ["coquillages", 4], ["vacoa", 4], ["choka", 3]], `Les falaises de basalte du Sud sauvage, où la houle cogne, et les vacoas penchés au-dessus de l'écume.`),
  M("bourg", "Bourg", [["decombres", 14], ["jardin-en-friche", 6], ["zerbaz", 3], ["terre", 3], ["bambou", 2], ["bancoulier", 1]], `Les rues, les cours, les terrains vagues d'une ville ou d'un bourg : ce que le bâti a laissé tomber.`),
  M("eboulis", "Éboulis et coulées", [["basalte", 10], ["choka", 6], ["galets", 4]], `Les éboulis au pied des remparts, les coulées de lave anciennes et récentes : de la pierre, et presque rien d'autre.`)
];
// Les milieux de chaque région (le registre les pose sur la région : regions[].milieux).
export const MILIEUX_DES_REGIONS = {
  "saint-denis": ["bourg", "foret-des-bas", "ravine", "cote-rocheuse"], "sainte-marie": ["bourg", "canne", "cultures", "cote-rocheuse"],
  "route-du-littoral": ["cote-rocheuse", "eboulis", "plage"], "le-port": ["bourg", "plage", "savane", "ravine"], "saint-paul": ["bourg", "plage", "savane", "foret-seche", "ravine"],
  "hauts-de-l-ouest": ["foret-des-hauts", "cultures", "savane"], "saint-leu": ["bourg", "plage", "canne", "savane", "cote-rocheuse"],
  "saint-pierre": ["bourg", "canne", "plage", "ravine"], "le-tampon": ["bourg", "cultures", "foret-des-hauts"],
  "sud-sauvage": ["foret-des-bas", "cote-rocheuse", "ravine", "cultures", "eboulis"], fournaise: ["eboulis", "foret-des-hauts"],
  est: ["canne", "foret-des-bas", "ravine", "cote-rocheuse", "bourg"], "plaine-des-palmistes": ["foret-des-hauts", "cultures", "ravine"],
  cilaos: ["eboulis", "ravine", "cultures", "foret-des-hauts"], salazie: ["ravine", "cultures", "foret-des-bas", "bourg"], mafate: ["ravine", "eboulis", "savane", "cultures"]
};
export const regionsAvecMilieux = regions => regions.map(r => ({ ...r, milieux: [...(MILIEUX_DES_REGIONS[r.cle] ?? [])] }));
// Le registre complet d'une famille d'équipements : ce que prend chaque outil de capture (CAPTURE_DES_EQUIPEMENTS).
export const equipementsAvecCapture = equipements => equipements.map(e => (CAPTURE_DES_EQUIPEMENTS[e.cle] ? { ...e, capture: [...CAPTURE_DES_EQUIPEMENTS[e.cle]] } : e));

// ---------------------------------------------------------------- Tables du MJ
const NOMS_RESSOURCES = { eau: "eau", nourriture: "nourriture", carburant: "carburant", medicaments: "médicaments", munitions: "munitions", materiaux: "matériaux",
  pieces: "pièces", graines: "graines", gaz: "gaz", boutures: "boutures", plantes: "plantes" };
const OBJETS = Object.fromEntries(OBJETS_FOUILLE.map(o => [o.cle, o]));
const pct = x => `${Math.round(x * 100)} %`;
const valeurObjet = o => (o.equipement ? "un objet" : o.ressource ? (o.par >= 1 ? `${o.par} pour 1 ${NOMS_RESSOURCES[o.ressource]}` : `${Math.round(1 / o.par)} ${NOMS_RESSOURCES[o.ressource]} chacun`) : "rien");
const ligneLot = l => {
  const o = OBJETS[l.objet];
  const q = l.q[0] === l.q[1] ? `${l.q[0]}` : `${l.q[0]} à ${l.q[1]}`;
  return `${o.equipement ? o.nom : `${q} ${bas(o.nom)}`} — ${pct(l.chance)}${l.risque ? ` (+${Math.round(l.risque * 100)} % par palier de risque)` : ""} ; ${valeurObjet(o)}`;
};
const NOM_BETE = Object.fromEntries(BETES_TROUVEES.map(b => [b.cle, b.nom.toLowerCase()]));
const T = (cle, nom, description, resultats) => {
  const t = table({ cle, nom, description, resultats });
  Object.assign(t.flags[MODULE], { fouilles: cle });
  return t;
};
const MOTS = [
  "**Personne n'y est passé.** La porte est fermée, la poussière sur le rebord est intacte, les volets tirés. Tout est là.",
  "**On y est à peine passé.** Une vitre cassée, un tiroir ouvert, des pas dans la poussière : quelqu'un est venu vite et n'a pris que ce qui se voyait.",
  "**On y est déjà passé.** Les placards sont ouverts, la cuisine retournée, il manque les conserves et les outils. Le reste traîne par terre.",
  "**Tout a été retourné.** Matelas éventrés, tiroirs vidés au sol, faux plafond arraché : des gens ont cherché longtemps. Il reste ce qui ne se mange pas et ne sert pas d'arme.",
  "**Il ne reste presque rien.** Même les fils électriques ont été arrachés des murs. Mais il y a toujours quelque chose : un rouleau de bâche sous l'escalier, une boîte de clous derrière une plinthe.",
  "**Des traces fraîches.** Une porte qu'on a forcée cette semaine, des braises dans l'évier, des emballages neufs : quelqu'un fouille le quartier en ce moment. Le lieu se lit un cran plus pillé que la dernière fois."
];
// Les lignes qui complètent une table de récolte courte (une table a au moins six lignes).
const RECOLTE_EN_PLUS = [
  "Des traces : quelqu'un a coupé, creusé ou ramassé ici il y a peu. Ce qui reste a été choisi par d'autres.",
  "Rien qui vaille à portée : il faut descendre plus bas dans la ravine, ou monter plus haut, et revenir demain.",
  "Un Livide figé dans les fourrés, à vingt pas : on travaille en silence, ou l'on s'en va."
];
const BETE_COUR = BETES_TROUVEES.map(b => `**${b.nom}** — ${b.description} *Elle tient ${b.tient * 6} heures hors d'un enclos ; morte, elle donne ${b.viande} de nourriture.*`);
export const TABLES_FOUILLE = [
  T("fouille-pillage", "Fouille — ce qu'on lit en arrivant", `Ce que le groupe voit devant un lieu, selon son degré de pillage (logique/fouilles.mjs, motDuPillage). L'API le dit (lieux, fouiller) ; tirez si vous menez sans elle.`, MOTS),
  T("fouille-bete", "Fouille — une bête dans la cour", `La bête qu'on peut trouver en fouillant une case, une remise, un hangar : ce qu'il faut pour la prendre, combien de temps elle tient.`, BETE_COUR),
  ...GENRES_FOUILLE.map(g => T(`fouille-${g.cle}`, `Fouille — ${g.nom}`,
    `${g.description} Fouiller en entier : ${g.travail} quart${g.travail > 1 ? "s" : ""}-personne. Sans l'API, tirez une ligne par quart-personne, et divisez par deux ce qu'on prend d'abord (vivres, soins, outils, armes) si le lieu a déjà été visité.`,
    g.lots.map(ligneLot))),
  ...MILIEUX.map(m => T(`recolte-${m.cle}`, `Récolte — ${m.nom}`, `${m.description} Ce qu'on y trouve, du plus courant au plus rare (la récolte de l'API : recolter, cible « matieres »).`,
    [...[...m.gisements].sort((a, b) => b.part - a.part).map(x => { const g = GISEMENTS.find(y => y.cle === x.gisement); return `**${g.nom}** (${x.part}) — ${g.description}`; }),
      ...RECOLTE_EN_PLUS].slice(0, Math.max(6, m.gisements.length))))
];

// ---------------------------------------------------------------- Le journal du MJ « Fouiller, démonter, récolter »
const nomGenre = c => GENRES_FOUILLE.find(g => g.cle === c)?.nom ?? c;
const ligneGenre = g => `- **${g.nom}** — ${g.travail} quart${g.travail > 1 ? "s" : ""}-personne ; ${g.nombre.base ? `${g.nombre.base} + ` : ""}${g.nombre.parPopulation} par point de population${g.route ? ", là où passe une route" : ""}. Surtout : ${[...g.lots].sort((a, b) => b.chance - a.chance).slice(0, 5).map(l => bas(OBJETS[l.objet].nom)).join(", ")}.${g.betes.length ? ` Bêtes : ${g.betes.map(b => `${NOM_BETE[b.bete]} ${pct(b.chance)}`).join(", ")}.` : ""}${g.demontage ? ` Démonté (${g.demontage.travail} quarts-personne) : ${g.demontage.rend.materiaux} matériaux${g.demontage.rend.pieces ? `, ${g.demontage.rend.pieces} pièces` : ""}.` : ""}`;
const nomsObjets = r => OBJETS_FOUILLE.filter(o => o.ressource === r && o.par).map(o => `${o.par >= 1 ? o.par : `1 (${Math.round(1 / o.par)} unités)`} ${bas(o.nom)}`).join(", ");
const PAGES_MJ = [
  { cle: "fouiller-un-lieu", titre: "Fouiller un lieu", texte: `Fouiller la région au hasard (la fouille d'avant) reste possible. **Fouiller un lieu**, c'est choisir où l'on entre : une pharmacie, une case, la quincaillerie de la rue principale (fenêtre du MJ, Actions, « Chercher : un lieu » et son genre ; ou fouiller({ cible: "lieu", genre })).

**Chaque région a ses lieux** : combien de cases, de boutiques, de pharmacies selon sa population (Saint-Denis : des dizaines de cases, six pharmacies ; Mafate : quelques cases, une école, une chapelle). Une part d'entre eux sont **à l'écart** (une case au bout d'un chemin, loin du bourg) ; on peut le demander (« à l'écart »). Les sites d'abri se fouillent aussi comme un lieu, selon leur genre.

**Un lieu est plus ou moins pillé, jamais vide.** Son degré de pillage suit la région (ce que les autres survivants en ont déjà pris), et la place du lieu : en pleine ville on est passé avant vous, dans un écart beaucoup moins, et là où les Livides sont nombreux, un peu moins aussi. Deux maisons voisines ne se lisent pas pareil. En arrivant, le groupe le **lit en cinq mots** (table « Fouille — ce qu'on lit en arrivant ») : personne n'y est passé, à peine passé, déjà passé, tout a été retourné, il ne reste presque rien.

**Ce que le pillage emporte.** Les pillards prennent d'abord ce qui se mange, ce qui soigne, les outils et les armes, le carburant : chaque lot de ce genre a une chance d'avoir disparu (1,1 × le degré, au plus 9 sur 10) ; les autres lots (linge, papier, tôle, câbles) partent deux fois moins. Un lot resté a pu être entamé. **Il reste toujours au moins un lot** : un lieu pillé n'est jamais vide.

**Le contenu d'un lieu est tiré une fois**, à la première visite : revenir ne le change pas, sauf que d'autres sont peut-être passés entre-temps. On fouille un lieu **en entier en quelques quarts-personne** (deux pour une case, quatre pour une supérette) ; ce qu'on n'a pas eu le temps de fouiller attend, et l'on reprend où l'on en était.

**Ce que rend un lieu** est dit en objets (« 6 boîtes de conserve, 2 pansements, un sabre à canne ») et compté en ressources de Fénoir (page « Ce qu'un objet vaut »). Ce qui se pille se prend sur les réserves de la région : un lieu ne rend pas ce que la région n'a plus. Un outil ou une arme trouvé devient un objet sur le premier fouilleur.

**Le risque** : comme toute fouille, une rencontre possible et du bruit (selon l'allure). **Comme en fouillant la région**, on glane en passant (des fruits, un poisson, un tangue) et l'on tombe parfois sur une trousse de secours oubliée. Ce qui est rare (armes, groupe électrogène, tronçonneuse) se trouve un peu plus là où les Livides tiennent la région : on y est moins allé.

**Une journée dans un écart** rend bien plus de vivres qu'une journée en ville, pour autant de lieux : c'est la raison d'aller loin.` },
  { cle: "les-genres", titre: "Les genres de lieux", texte: `Chaque genre a sa table (tables « Fouille — … »), son travail et son nombre de lieux par région.

${GENRES_FOUILLE.map(ligneGenre).join("\n")}

Les sites d'abri : une case créole, un îlet se fouillent comme une case ; une ferme comme un hangar ; un gîte comme un hôtel ; un port, une usine comme un entrepôt ; un phare comme une administration ; un hôpital comme un centre de santé ; une église comme un lieu de culte. Un tunnel de lave ne se fouille pas.

Les cartes et les calendriers ont leur propre tirage (« Le jour qu'on croit ») ; les plans aussi (cible « plans »).` },
  { cle: "lieux-de-culte", titre: "Les lieux de culte", texte: `Une église, un temple tamoul, une mosquée, une pagode, une chapelle de bord de chemin : leur table est courte, **sans outil, sans arme, sans rien de rare** (des bougies, de l'eau, des nappes, de la cire).

**Y prendre quelque chose ne laisse personne indifférent.** Le système le rappelle au journal secret à chaque fouille d'un lieu de culte ; c'est à vous de juger, selon ce qu'on a pris, comment et devant qui. Si cela pèse, portez l'acte **« Prendre dans un lieu de culte »** (sens moral −1, et la réputation si quelqu'un l'a vu ; à moitié si les témoins savaient pourquoi : des bougies pour veiller un mourant). L'acte est le même pour tous : **aucune religion, aucune origine ne le change**. Un personnage peut y voir un signe ; le jeu ne dit rien.

On peut aussi démonter un lieu de culte : c'est un chantier long et bruyant, et tout le quartier le saura.` },
  { cle: "les-betes", titre: "Les bêtes trouvées en fouillant", texte: `Une case, une remise, un hangar des Hauts ont parfois encore **une bête** : une poule qui gratte la cour, un lapin dans sa caisse, un cabri à son piquet, un essaim dans un mur. Elles partent les premières quand un lieu est pillé : la chance est multipliée par (1 − degré)², seize fois plus rare en pleine ville que dans un écart.

${BETES_TROUVEES.map(b => `- **${b.nom}** (${b.nombre[0] === b.nombre[1] ? b.nombre[0] : `${b.nombre[0]} à ${b.nombre[1]}`}) : ${b.description} Tient ${b.tient} quarts hors d'un enclos ; morte, ${b.viande} nourriture. Se garde : ${b.enclos.join(", ")}.`).join("\n")}

**Il faut l'outil en main** : une cage ou un sac de goni pour les volailles et les lapins, une corde pour un cabri, un porcelet, un veau, un enfumoir pour un essaim. **Sans lui**, la bête file (le lieu n'en a plus) ; l'essaim pique (une blessure au premier fouilleur) et reste.

**Une bête prise** suit le groupe (fiche « Les bêtes » de la fenêtre du MJ ; betes()). Elle tient quelques quarts hors d'un enclos : ramenez-la à une installation qui la garde (« Mettre à l'enclos »), ou abattez-la (la viande va aux stocks). Passé le délai, elle meurt, et l'on mange sa viande. Une bête à l'enclos ne change pas encore la production de l'installation : l'élevage complet viendra avec « le vivant de l'abri ».` },
  { cle: "demonter", titre: "Démonter", texte: `**On récolte aussi en cassant ce qui existe.** Une case, une maison, une épave démontée rend **la moitié de ce qu'elle a coûté** : des planches, des tôles, des clous, des parpaings, des câbles, comptés en matériaux et en pièces (page « Les genres de lieux »). Une case de bois rend 12 matériaux, une maison en dur 21 matériaux et une pièce, une voiture une batterie, des roues et des ressorts (3 pièces).

**C'est lent et bruyant** : de 4 quarts-personne pour une remise à 60 pour un entrepôt ; chaque quart fait du bruit (+1 ou +2, comme un chantier), et les rencontres viennent avec. **Sans outil** (pied-de-biche, barre à mine, pelle-pioche, masse, tronçonneuse, caisse à outils), deux fois plus lent. Ce qu'on démonte se rend au fur et à mesure ; on peut s'arrêter et revenir.

**Un lieu qu'on n'a pas fini de fouiller** se fouille d'abord : le premier travail va à la fouille, la suite au démontage. Un lieu démonté n'existe plus : ni fouille, ni démontage.

**Démonter une installation de l'abri** (« Démonter une installation » ; demonter({ installationId })) rend la moitié de ce qu'elle a coûté, tous niveaux compris (les matières de l'île reviennent en matériaux), pour un tiers du travail qu'elle avait demandé. Le plan reste au carnet : on la rebâtira plus vite ailleurs.` },
  { cle: "recolter", titre: "Récolter l'île", texte: `Les ravines, les savanes, les plages et les éboulis ont leurs **gisements** : touffes de bambous, pieds de choka et de vacoa, talus de terre, berges d'argile, galets, blocs de basalte, coquillages, bois flotté. Ils rendent des **matériaux** (comptés comme le reste : quatre bambous, quarante galets font un matériau), pour les ouvrages lontan, les cordes, le torchis, la chaux. La récolte se fait aux alentours (fenêtre du MJ, Actions, « Chercher : matières de l'île » ; ou fouiller({ cible: "matieres", gisement })).

**Chaque région a ses milieux** (tables « Récolte — … ») et donc ses gisements, en nombre. Un gisement exploité **repousse** : un bambou en 60 jours, un pied de vacoa en 30, des coquillages en 5 ; un bloc de basalte ne revient guère (120 jours). En saison sèche, tout repousse à 0,4 de cette vitesse. Le bambou ne monte pas au-dessus de 1 500 m, le choka de 1 300 m, le bancoulier de 800 m.

**Les outils** aident (un sabre pour le bambou et le vacoa, une pioche pour la terre, une masse pour le basalte) : sans eux, deux fois plus lent. Débiter le basalte s'entend (+2 de bruit par quart) ; couper des bambous un peu.

Ce qui se prend autrement n'est pas récolté : les **zerbaz** (cible « plantes »), les **jardins en friche** (cible « jardins »), l'**eau** d'une source (le site, un captage), les **décombres** (un lieu à fouiller), le **sel** d'une vasque (une recette).` },
  { cle: "ce-qu-un-objet-vaut", titre: "Ce qu'un objet vaut en ressources", texte: `Pour raconter un butin et le compter. Une ressource de Fénoir, c'est une brouette, un jour, une caisse : beaucoup d'objets.

- **Nourriture** : ${nomsObjets("nourriture")}.
- **Eau** : ${nomsObjets("eau")}.
- **Médicaments** : ${nomsObjets("medicaments")}.
- **Matériaux** : ${nomsObjets("materiaux")}.
- **Pièces** : ${nomsObjets("pieces")}.
- **Graines et boutures** : ${nomsObjets("graines")} ; ${nomsObjets("boutures")}.
- **Carburant, gaz, munitions** : ${nomsObjets("carburant")} ; une bouteille de gaz entamée, une dizaine de kilos ; ${nomsObjets("munitions")}.
- **Un tronc** vaut un demi-matériau ; **dix cannes coupées**, une demi-nourriture (la canne se suce, elle ne nourrit pas longtemps).
- **Les outils et les armes** (couteau, sabre à canne, pied-de-biche, fusil…) deviennent des objets. Ceux qui n'ont pas encore de fiche (marteau, scie, pince, truelle, hache, masse) comptent en pièces.` },
  { cle: "systeme", titre: "Ce que fait le système", texte: `- **fouiller({ cible: "lieu", genre, ecart, lieu, site })** : le lieu suivant de ce genre dans la région (« ecart » : à l'écart), un lieu déjà commencé (« lieu »), ou un site d'abri (« site »). Rend le lieu (son genre, le mot du pillage, le travail fait), ce qu'on a trouvé en objets (« trouve ») et en ressources (« butin »), les objets créés, la bête rencontrée.
- **fouiller({ cible: "demonter", … })** : démonter un lieu (il se fouille d'abord s'il n'est pas fini) ; **demonter({ installationId })** : démonter une installation de l'abri.
- **fouiller({ cible: "matieres", gisement })** : récolter un gisement des alentours (sans gisement : le plus abondant).
- **lieux({ region })** : les lieux de la région, ceux qu'on a vus et ce qu'on en sait ; au MJ, le degré réel. **gisements({ region })** : ce que la région a, ce qui repousse.
- **betes()**, **enclore({ id })**, **abattre({ id })**, **relacher({ id })** : les bêtes que le groupe a prises.
- **acteMoral({ acte: "prendre-au-culte" })** : quand prendre dans un lieu de culte pèse.
- Chaque fouille d'un lieu de culte laisse une ligne au journal secret ; une bête prise, perdue, morte, une au journal du groupe.
- Le degré de pillage et le contenu d'un lieu sont secrets (le monde scellé) ; le mot, le travail fait et ce qu'on a trouvé sont publics.` }
];
export const JOURNAL_FOUILLES = journal({ cle: "fouiller-demonter-recolter", nom: "Fouiller, démonter, récolter", pack: "mj", pages: PAGES_MJ });

// ---------------------------------------------------------------- Une page du guide du joueur
export const PAGES_JOUEUR_FOUILLES = [
  { cle: "fouiller-demonter-recolter", titre: "Fouiller, démonter, récolter", texte: `**Fouiller un lieu.** Vous pouvez fouiller la région au hasard, ou choisir où entrer : une pharmacie, une case, une quincaillerie. Chaque lieu a été **plus ou moins pillé** avant vous, jamais tout à fait vidé ; en arrivant, vous voyez si personne n'y est passé, ou s'il ne reste presque rien. Les pillards prennent d'abord les vivres, les soins, les outils et les armes : le linge, les câbles, la tôle restent plus longtemps.

- **En ville**, on est passé avant vous. **Dans les écarts**, au bout des chemins, il reste bien plus : c'est loin, et l'on y est seul.
- Un lieu se fouille en quelques quarts ; on peut s'arrêter et revenir.
- **Une bête** reste parfois dans une cour (une poule, un cabri, un essaim) : il faut l'outil en main (une cage, un sac de goni, une corde, un enfumoir), et la ramener vite à un enclos.
- **Un lieu de culte** n'a ni outil ni arme ; y prendre quoi que ce soit ne laisse personne indifférent.

**Démonter.** Une case, une maison, une épave démontée rend la moitié de ce qu'elle a coûté : des planches, des tôles, des câbles. C'est long, c'est bruyant, et un pied-de-biche aide beaucoup. On peut aussi démonter une installation de l'abri avant de partir.

**Récolter l'île.** Les ravines, les savanes, les plages ont leurs bambous, leurs chokas, leur argile, leurs galets : de quoi bâtir lontan. Ce qu'on a coupé repousse, plus lentement en saison sèche.` }
];
