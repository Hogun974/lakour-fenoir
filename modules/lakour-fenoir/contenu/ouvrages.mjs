// Bâtir et défendre (lot 7 du portage de Fénoir 3D, 2026-11-17 ; complément du jeu 3D, famille 9 « Bâtir par pièces », « Les
// défenses comme les anciens châteaux » et les constructions de docs/propositions/recettes-et-constructions.md ; décisions de Jordan
// des 15 et 16 novembre, le reste validé le 17 : « tout maintenant »). Les règles sont dans le système (logique/ouvrages.mjs, avec des
// crochets dans abri.mjs et etat.mjs ; contrat §26 ; chiffres : docs/equilibre-batir.md). Ici, le contenu :
// - les MATÉRIAUX et l'ENTRETIEN des installations qui existaient déjà (porterOuvrages : une table par clé, posée sur les documents
//   avant la fabrication ; rien n'est retiré, les chiffres de production ne bougent pas) ;
// - 38 installations nouvelles : défenses « avec les moyens du bord », eau, feu et réserves, couchage et vie commune, lumière,
//   remises, énergie ; celles qui ont une version d'avant (lontan) prennent la forme des sœurs (un rôle partagé, un rang) ;
// - leurs plans (registre des plans du lot 4 : un plan reste un rabais, aucune installation ne l'exige) ;
// - les journaux du MJ « Les Livides devant un abri » et « Bâtir et entretenir », une page du guide du joueur, trois tables.
// Ton : survie réaliste, horreur sobre ; rien de montré pour lui-même.
import { installation, journal, table, MODULE } from "./aides.mjs";

const EAU_BRUTE = ["riviere", "source", "puits"];

// Une installation du lot : le constructeur commun, plus le matériau, l'entretien et les bras de chaque niveau, et `expose`.
// niveaux : [{ cout, requiert, effets, materiau?, entretien?, bras? }] ; materiau, expose : sur la définition.
function ouvrage({ materiau, expose, bras = null, niveaux, ...reste }) {
  const doc = installation({ ...reste, niveaux: niveaux.map(({ materiau: _m, entretien: _e, bras: _b, ...n }) => n) });
  const s = doc.system;
  if (typeof materiau === "string") s.materiau = materiau;
  if (typeof expose === "boolean") s.expose = expose;
  niveaux.forEach((n, k) => {
    const sn = s.niveaux[k];
    if (n.materiau) sn.materiau = n.materiau;
    if (n.entretien) sn.entretien = { ...n.entretien };
    const b = n.bras ?? bras;
    sn.effets.bras = b ? { tache: b.tache, nombre: b.nombre ?? 1 } : null;
  });
  return doc;
}
const E = (tousLes, travail = 1, plus = {}) => ({ tousLes, travail, ...plus });

// ---------------------------------------------------------------- Les installations d'avant : matériau, entretien, défenses
// materiau : une famille, ou une par niveau ; entretien : { tousLes, travail, encrassement, arret, lavee, panne, vie } (les mêmes
// pour tous les niveaux) ; effets : ajoutés à chaque niveau (ou par niveau, en liste). Une installation qui a des bras (le potager,
// le filtre, l'atelier…) n'a pas d'entretien à part : ceux qui y travaillent la tiennent ; l'hygiène a déjà le ménage (§19).
export const OUVRAGES_EXISTANTS = {
  barricades: { materiau: "tole-de-recuperation" },
  palissade: { materiau: "bois-sous-tole", entretien: E(90) },
  mur: { materiau: ["pierre-seche", "parpaing-et-beton", "parpaing-et-beton"] },
  "tour-de-guet": { materiau: "bois-sous-tole" },
  "fosse-et-pieges": { materiau: ["bambou-et-vacoa", "bois-sous-tole"], entretien: E(30), effets: [{ piege: 1 }, { piege: 2 }] },
  "chiens-de-garde": { materiau: "bois-sous-tole" },
  "porte-blindee": { materiau: "parpaing-et-beton", effets: { porte: true } },
  camouflage: { materiau: "paille-et-torchis", entretien: E(30) },
  "citerne-de-pluie": { materiau: ["tole-de-recuperation", "tole-de-recuperation", "parpaing-et-beton"], entretien: E(60) },
  "filtre-sable-charbon": { materiau: "tole-de-recuperation" },
  "bouilleur-solaire": { materiau: "bois-sous-tole", entretien: E(30) },
  "captage-de-source": { materiau: "pierre-seche", entretien: E(60) },
  "pompe-manuelle": { materiau: "tole-de-recuperation" },
  potager: { materiau: ["bambou-et-vacoa", "bambou-et-vacoa", "bois-sous-tole"] },
  serre: { materiau: ["bambou-et-vacoa", "tole-de-recuperation"] },
  verger: { materiau: "bambou-et-vacoa" },
  "basse-cour": { materiau: "bois-sous-tole" },
  "enclos-a-cabris": { materiau: "bois-sous-tole" },
  "bassin-a-tilapias": { materiau: ["pierre-seche", "parpaing-et-beton"] },
  ruches: { materiau: "bois-sous-tole" },
  compost: { materiau: "bois-sous-tole", entretien: E(15) },
  "panneaux-solaires": { materiau: "tole-de-recuperation", entretien: E(12, 1, { encrassement: 0.5, lavee: true, panne: 0.004 }) },
  batteries: { materiau: "tole-de-recuperation", entretien: E(90, 1, { panne: 0.002, vie: 400 }) },
  "pico-hydro": { materiau: "pierre-seche", entretien: E(8, 1, { encrassement: 0.7, arret: true, panne: 0.004 }) },
  "groupe-electrogene": { materiau: "tole-de-recuperation", entretien: E(30, 1, { panne: 0.01 }) },
  eolienne: { materiau: "bois-sous-tole", entretien: E(30, 1, { panne: 0.006 }) },
  "sechoir-fumoir": { materiau: "tole-de-recuperation" },
  "reserve-etanche": { materiau: "tole-de-recuperation", entretien: E(30) },
  atelier: { materiau: "bois-sous-tole" },
  infirmerie: { materiau: "bois-sous-tole" },
  dortoir: { materiau: ["bois-sous-tole", "bois-sous-tole", "parpaing-et-beton"] },
  "autel-des-morts": { materiau: "bois-sous-tole" },
  "cuisine-commune": { materiau: "bois-sous-tole" },
  "poste-radio": { materiau: "tole-de-recuperation" },
  antenne: { materiau: "bois-sous-tole", entretien: E(90) },
  "galerie-souterraine": { materiau: ["bois-sous-tole", "bois-sous-tole", "bois-sous-tole", "parpaing-et-beton"], entretien: E(60, 2) },
  "tunnel-de-lave-amenage": { materiau: "bois-sous-tole", entretien: E(60, 2) },
  "palissade-de-bambou": { materiau: "bambou-et-vacoa", entretien: E(60) },
  "mur-de-pierres-seches": { materiau: "pierre-seche" },
  "guet-dans-un-arbre": { materiau: "bambou-et-vacoa" },
  "citerne-lontan": { materiau: "bambou-et-vacoa", entretien: E(20) },
  "conduite-de-bambou": { materiau: "bambou-et-vacoa", entretien: E(15) },
  "puits-a-balancier": { materiau: "pierre-seche" },
  "jardin-creole": { materiau: "bambou-et-vacoa" },
  "ruches-en-tronc": { materiau: "bambou-et-vacoa" },
  "garde-manger-lontan": { materiau: "bambou-et-vacoa", entretien: E(30) },
  gaziniere: { materiau: "tole-de-recuperation" },
  "eau-chaude-solaire": { materiau: "tole-de-recuperation", entretien: E(60) },
  "eau-chaude-gaz": { materiau: "tole-de-recuperation" },
  "eau-chaude-feu-de-bois": { materiau: "pierre-seche" },
  "etagere-aux-cahiers": { materiau: "bois-sous-tole" },
  feuillees: { materiau: "bambou-et-vacoa" },
  "latrines-seches": { materiau: "bois-sous-tole" },
  "fosse-maconnee": { materiau: "parpaing-et-beton" },
  lavoir: { materiau: "pierre-seche" },
  douche: { materiau: "bois-sous-tole" }
};

// Fusion de la vague 3 : les installations des lots 6 (ateliers), 8 (vivant) et 9 (paradis) ont aussi leur matériau ; celles qui
// n'ont pas de bras (les ateliers, les haies et le puits de jour) ont aussi un entretien, celui des installations d'avant de même
// matière : une construction de bambou, de vacoa ou de paille se reprend tous les deux mois (E(60), comme la palissade de bambou),
// une haie se taille tous les trois mois (E(90), comme la haie de choka) ; la tôle, la pierre et le parpaing tiennent seuls (comme
// l'atelier et l'infirmerie d'avant). Le vivant a ses bras (l'élevage, les cultures) : un matériau seulement, et le curage des
// bassins (contenu/vivant.mjs, curageDuVivant). entretien : le même à tous les niveaux, ou une liste par niveau (null : aucun).
const BAMBOU = "bambou-et-vacoa", BOIS = "bois-sous-tole", TOLE = "tole-de-recuperation", PIERRE = "pierre-seche", PARPAING = "parpaing-et-beton";
export const OUVRAGES_DES_LOTS = {
  // Lot 6 : neuf ateliers en trois niveaux (« le matériau fait le niveau »).
  "coin-du-feu": { materiau: [PIERRE, TOLE, PARPAING] },
  etabli: { materiau: [BAMBOU, BOIS, BOIS], entretien: [E(60), null, null] },
  forge: { materiau: [PIERRE, PIERRE, PARPAING] },
  vannerie: { materiau: [BAMBOU, BAMBOU, BOIS], entretien: [E(60), E(60), null] },
  couture: { materiau: [BAMBOU, BOIS, BOIS], entretien: [E(60), null, null] },
  tisanerie: { materiau: [BAMBOU, BAMBOU, BOIS], entretien: [E(60), E(60), null] },
  "atelier-mecanique": { materiau: [TOLE, TOLE, PARPAING] },
  "atelier-electricite": { materiau: [BOIS, BOIS, PARPAING] },
  distillerie: { materiau: [PIERRE, TOLE, TOLE] },
  // Lot 8 : clapier et soue sous tôle et moellons, l'étable et les bacs de bambou, les bassins de pierre ou de parpaing.
  clapier: { materiau: BOIS },
  "soue-a-cochons": { materiau: PIERRE },
  etable: { materiau: BAMBOU },
  "bassin-a-camarons": { materiau: PIERRE },
  aquaponie: { materiau: PARPAING },
  "bacs-de-culture": { materiau: BAMBOU },
  "serre-hydroponique": { materiau: TOLE },
  "jardin-de-zerbaz": { materiau: BAMBOU },
  "treille-a-chouchou": { materiau: BAMBOU },
  bananeraie: { materiau: BAMBOU },
  "carreau-de-canne": { materiau: BAMBOU },
  // Lot 9 : le puits de jour (un tuyau à garder libre), les haies qui cachent (à tailler).
  "puits-de-jour": { materiau: [BOIS, TOLE], entretien: E(60) },
  "haie-de-bambous": { materiau: BAMBOU, entretien: E(90) },
  "rideau-de-filaos": { materiau: BAMBOU, entretien: E(90) }
};

// Pose les matériaux, l'entretien et les effets du lot sur les documents d'installation déjà écrits (avant la fabrication). Une
// clé absente des tables ne change pas. -> les documents (modifiés en place)
export function porterOuvrages(documents = []) {
  for (const d of documents) {
    const o = OUVRAGES_EXISTANTS[d?.system?.cle] ?? OUVRAGES_DES_LOTS[d?.system?.cle];
    if (!o) continue;
    const niveaux = d.system.niveaux ?? [];
    if (typeof o.materiau === "string") d.system.materiau = o.materiau;
    niveaux.forEach((n, k) => {
      if (Array.isArray(o.materiau)) n.materiau = o.materiau[k] ?? o.materiau.at(-1);
      const en = Array.isArray(o.entretien) ? o.entretien[k] ?? null : o.entretien;
      if (en) n.entretien = { ...en };
      const plus = Array.isArray(o.effets) ? o.effets[k] ?? o.effets.at(-1) : o.effets;
      if (plus) Object.assign(n.effets, plus);
    });
  }
  return documents;
}

// ---------------------------------------------------------------- Les installations nouvelles
export const INSTALLATIONS_OUVRAGES = [
  // ---- Défense : « comme les anciens châteaux, avec les moyens du bord »
  ouvrage({ cle: "haie-de-choka", arbre: "lontan", role: "barricades", rang: 1, nom: "Haie de choka", categorie: "defense", materiau: "bambou-et-vacoa",
    description: `Des pieds de choka plantés serrés le long de la clôture, leurs feuilles armées d'épines tournées vers l'extérieur. Il faut six mois pour qu'elle ferme ; ensuite elle se garde seule, arrête ce qui marche sans regarder, et sa taille donne de la fibre à tresser (des matières de l'île). Elle prend la place des barricades quand celles-ci tombent.`,
    niveaux: [
      { cout: { ile: 2, travail: 4 }, effets: { defense: 1, pousse: 180, bois: 0.2, conditions: { delai: 180 } }, entretien: E(90) }
    ] }),
  ouvrage({ cle: "chausse-trapes", arbre: "lontan", role: "fosse-et-pieges", rang: 1, nom: "Chausse-trapes de bambou", categorie: "defense", materiau: "bambou-et-vacoa",
    description: `Des pointes de bambou durcies au feu, plantées de biais dans l'herbe des passages. Un Livide qui marche droit s'y prend les pieds, trébuche, se relève plus lentement. Un vivant qui regarde où il pose le pied les voit ; il faut les refaire après la pluie.`,
    niveaux: [
      { cout: { ile: 2, travail: 4 }, effets: { piege: 1 }, entretien: E(30) }
    ] }),
  ouvrage({ cle: "cloche-d-alarme", arbre: "lontan", nom: "Cloche d'alarme", categorie: "defense", materiau: "bois-sous-tole",
    description: `Un bout de rail, une jante ou une tôle épaisse pendue à une potence, et une barre de fer à côté. Tout l'abri l'entend d'un coup, même ceux qui dorment. Les environs aussi : on ne la frappe que quand il le faut.`,
    niveaux: [
      { cout: { materiaux: 1, ile: 1, travail: 2 }, effets: { bonus: { vigilance: 1 }, alarme: true } }
    ] }),
  ouvrage({ cle: "herse", arbre: "moderne", role: "herse", nom: "Herse à contrepoids", categorie: "defense", materiau: "tole-de-recuperation",
    description: `La porte de l'enceinte : une grille de fers à béton et de tôle qu'un fût rempli de pierres fait remonter, et qu'on laisse retomber d'un coup de couteau dans la corde. Plus lourde qu'un portail, elle ne s'ouvre pas en poussant ; les Livides s'acharnent sur elle, toujours, et c'est elle qu'on répare.`,
    niveaux: [
      { cout: { materiaux: 6, pieces: 2, travail: 10 }, effets: { defense: 1, porte: true }, entretien: E(60) }
    ] }),
  ouvrage({ cle: "portail-de-bois-dur", arbre: "lontan", role: "herse", nom: "Portail de bois dur", categorie: "defense", materiau: "bois-sous-tole",
    description: `Deux battants de tamarin ou de bois de natte, chevillés, fermés par une barre qu'il faut deux bras pour lever. Le portail des vieilles cours, refait avec ce qui pousse autour. Il arrête ce qui frappe, et c'est sur lui qu'on frappe.`,
    niveaux: [
      { cout: { ile: 5, travail: 12 }, effets: { defense: 1, porte: true }, entretien: E(90) }
    ] }),
  ouvrage({ cle: "chemin-de-ronde", arbre: "moderne", nom: "Chemin de ronde", categorie: "defense", materiau: "bois-sous-tole",
    description: `Un plancher de planches sur des poteaux, le long de la palissade, à hauteur d'homme au-dessus du sol, et une échelle qu'on remonte. De là-haut, on frappe par-dessus avec une lance ou une barre. Un Livide ne monte pas à l'échelle : il ne peut pas frapper qui se tient au-dessus de lui, alors il s'en prend aux poteaux.`,
    niveaux: [
      { cout: { materiaux: 4, travail: 8 }, requiert: { installations: [{ cle: "palissade", niveau: 1 }] }, effets: { defense: 1, hauteur: true }, entretien: E(90) }
    ] }),
  ouvrage({ cle: "meurtriere-de-basalte", arbre: "lontan", nom: "Meurtrière de basalte", categorie: "defense", materiau: "pierre-seche",
    description: `Une fente étroite ménagée dans un mur de pierres, évasée vers l'intérieur : on voit dehors sans être vu, on tire sans être atteint. Il faut savoir monter la pierre pour qu'elle tienne autour du vide.`,
    niveaux: [
      { cout: { travail: 6 }, requiert: { savoirs: ["pierre-seche"] }, effets: { defense: 1, bonus: { tir: 1 } } }
    ] }),
  ouvrage({ cle: "passerelle-relevee", arbre: "lontan", nom: "Passerelle relevée", categorie: "defense", materiau: "bambou-et-vacoa",
    description: `Le seul passage au-dessus du fossé : quelques bambous liés, une corde qui passe sur une fourche. Le soir, on la relève, et l'abri devient une île. Les Livides s'arrêtent au bord, se pressent, et s'en prennent à ce qui reste de l'entrée.`,
    niveaux: [
      { cout: { ile: 3, travail: 6 }, requiert: { installations: [{ cle: "fosse-et-pieges", niveau: 1 }] }, effets: { defense: 1, porte: true }, entretien: E(60) }
    ] }),
  ouvrage({ cle: "douves", nom: "Douves", categorie: "defense", materiau: "pierre-seche",
    description: `Un fossé profond creusé autour de l'abri et rempli par une dérivation de la ravine, une vanne de planches pour régler l'eau. Un Livide y tombe et n'en ressort pas seul ; les vivants passent par la passerelle. L'eau qui dort amène les moustiques : il faut la faire courir, et curer le fond.`,
    niveaux: [
      { cout: { materiaux: 2, travail: 30 }, requiert: { site: { eau: ["riviere", "source"] } }, effets: { defense: 1, piege: 2 }, entretien: E(60, 2) }
    ] }),
  ouvrage({ cle: "enceinte-de-palettes", role: "palissade", rang: 2, nom: "Enceinte de palettes", categorie: "defense", materiau: "bois-sous-tole",
    description: `Des palettes de chantier dressées et clouées entre elles, calées par des piquets : une clôture en un jour, avec ce que les entrepôts du port et des zones ont laissé. Elle tient moins qu'une palissade, et pourrit vite à la pluie.`,
    niveaux: [
      { cout: { materiaux: 4, travail: 6 }, effets: { defense: 1, visibilite: 2 }, entretien: E(60) }
    ] }),
  ouvrage({ cle: "enceinte-d-epaves", role: "palissade", rang: 3, nom: "Enceinte d'épaves", categorie: "defense", materiau: "tole-de-recuperation",
    description: `Des carcasses de voitures poussées roues contre roues, les vides bouchés de tôles et de grillage. Il faut une route pleine d'épaves à côté, et des bras pour les pousser. Elle arrête bien ; elle se voit de très loin, et elle claque sous le vent.`,
    niveaux: [
      { cout: { materiaux: 3, travail: 20 }, effets: { defense: 2, visibilite: 3 } }
    ] }),

  // ---- Eau
  ouvrage({ cle: "puits-creuse", arbre: "lontan", nom: "Puits creusé", categorie: "eau", materiau: "pierre-seche", bras: { tache: "eau" },
    description: `Creusé à la pioche et à la barre à mine jusqu'à la nappe, cuvelé de galets à mesure qu'on descend, avec un seau et une corde. Là où il n'y a ni source ni ravine, c'est de l'eau tous les jours de l'année, à remonter à bras et à faire bouillir. Au second niveau, une margelle et un treuil.`,
    niveaux: [
      { cout: { ile: 2, travail: 24 }, requiert: { site: { sol: 1, eau: ["aucune", "citerne", "reseau"] } }, effets: { production: { eau: 2 } }, entretien: E(90, 2) },
      { cout: { ile: 2, travail: 10 }, requiert: { savoirs: ["pierre-seche"], site: { sol: 1, eau: ["aucune", "citerne", "reseau"] } }, effets: { production: { eau: 3 } }, entretien: E(90, 2) }
    ] }),
  ouvrage({ cle: "bassin-de-pierre", arbre: "lontan", role: "cuve-en-hauteur", rang: 1, nom: "Bassin de pierre", categorie: "eau", materiau: "pierre-seche",
    description: `Un bassin maçonné à l'argile, au pied du toit ou de la conduite, pour garder l'eau des jours de pluie. Au second niveau, des joints à la chaux : il ne fuit plus.`,
    niveaux: [
      { cout: { ile: 2, travail: 10 }, effets: { stockage: { eau: 40 } }, entretien: E(60) },
      { cout: { travail: 8 }, requiert: { savoirs: ["pierre-seche"] }, effets: { stockage: { eau: 80 } }, entretien: E(90) }
    ] }),
  ouvrage({ cle: "cuve-en-hauteur", arbre: "moderne", role: "cuve-en-hauteur", nom: "Cuve en hauteur", categorie: "eau", materiau: "bois-sous-tole",
    description: `Des fûts sur une charpente, plus haut que le toit, remplis par la citerne : l'eau descend seule jusqu'à la cuisine et à la douche. On ouvre un robinet, et c'est un peu de l'ancienne vie qui revient.`,
    niveaux: [
      { cout: { materiaux: 4, pieces: 1, travail: 12 }, requiert: { savoirs: ["plomberie-filtration"], installations: [{ cle: "citerne-de-pluie", niveau: 1 }] }, effets: { stockage: { eau: 60 }, moral: 1 }, entretien: E(60) }
    ] }),
  ouvrage({ cle: "jarre-filtrante", arbre: "lontan", role: "filtre-sable-charbon", rang: 1, nom: "Jarres filtrantes", categorie: "eau", materiau: "bambou-et-vacoa",
    description: `Deux jarres de terre l'une sur l'autre, la première percée, remplie de sable lavé et de charbon de bois : l'eau passe goutte à goutte et sort claire. Lent, mais il suffit de refaire le charbon de temps en temps.`,
    niveaux: [
      { cout: { ile: 1, travail: 3 }, requiert: { site: { eau: EAU_BRUTE } }, effets: { production: { eau: 1 } }, entretien: E(15) }
    ] }),
  ouvrage({ cle: "pompe-electrique", arbre: "moderne", role: "pompe-manuelle", rang: -1, nom: "Pompe électrique", categorie: "eau", materiau: "tole-de-recuperation",
    description: `Le moteur d'une machine à laver ou d'une pompe de piscine, une crépine, des tuyaux : sur le courant de l'abri, elle remonte l'eau du puits ou de la ravine sans un geste. Sans courant, la pompe à bras reprend le travail. Sa crépine se bouche vite.`,
    niveaux: [
      { cout: { materiaux: 2, pieces: 3, travail: 6 }, requiert: { savoirs: ["plomberie-filtration"], site: { eau: ["puits", "riviere"] } }, effets: { production: { eau: 6 }, consommation: { energie: 1 } },
        entretien: E(10, 1, { encrassement: 0.6, arret: true, panne: 0.006 }) }
    ] }),

  // ---- Feu, cuisine et réserves
  ouvrage({ cle: "foyer-trois-roches", arbre: "lontan", role: "cuisine-commune", rang: 2, nom: "Foyer à trois roches", categorie: "vie", materiau: "pierre-seche", bras: { tache: "cuisine" },
    description: `Trois galets de ravine, une marmite dessus, du bois dessous : la cuisine de toujours, celle des boucans et des cours. Elle fume beaucoup et se voit de loin ; elle ne casse jamais.`,
    niveaux: [
      { cout: { ile: 1, travail: 1 }, effets: { moral: 1, visibilite: 2, odeur: 1 } }
    ] }),
  ouvrage({ cle: "four-a-pain", arbre: "lontan", nom: "Four à pain", categorie: "vie", materiau: "pierre-seche", bras: { tache: "cuisine" },
    description: `Une voûte de pierre et d'argile qu'on chauffe au bois pendant une matinée : pain de manioc, gâteau patate, gâteau maïs. L'odeur du pain chaud fait plus pour un groupe qu'un discours. Elle se sent aussi de loin.`,
    niveaux: [
      { cout: { ile: 3, travail: 12 }, effets: { moral: 1, visibilite: 1, odeur: 1 } }
    ] }),
  ouvrage({ cle: "boucan", arbre: "lontan", role: "sechoir-fumoir", rang: 1, nom: "Boucan", categorie: "stockage", materiau: "paille-et-torchis", expose: true,
    description: `La paillote où l'on cuisine, avec sa claie au-dessus du feu : la viande, le poisson et les piments s'y boucanent des jours durant et ne se gâtent plus. Elle ne coûte que de la paille et des gaulettes ; la pluie use le torchis, le vent l'emporte au premier cyclone.`,
    niveaux: [
      { cout: { ile: 4, travail: 6 }, effets: { conservation: true, visibilite: 1, odeur: 1 }, entretien: E(30) }
    ] }),
  ouvrage({ cle: "claies-de-sechage", arbre: "lontan", nom: "Claies de séchage", categorie: "stockage", materiau: "bambou-et-vacoa", expose: true,
    description: `Des claies de bambou sur des tréteaux, au soleil : les zerbaz, les piments, le café, les graines y sèchent sans moisir. On garde ainsi bien plus de brassées qu'il n'en tient dans la case.`,
    niveaux: [
      { cout: { ile: 1, travail: 2 }, effets: { stockage: { plantes: 12 } }, entretien: E(30) }
    ] }),
  ouvrage({ cle: "cellier-de-pierre", arbre: "lontan", role: "reserve-etanche", rang: 2, nom: "Cellier de pierre", categorie: "stockage", materiau: "pierre-seche",
    description: `Une petite pièce à demi enterrée, aux murs de pierre épais, une porte basse : il y fait frais même en février, les vivres s'y gardent. Rien n'y entre que la main qui sait où chercher.`,
    niveaux: [
      { cout: { ile: 2, travail: 16 }, effets: { conservation: true, stockage: { nourriture: 40 } }, entretien: E(90) }
    ] }),
  ouvrage({ cle: "ratelier-a-bois", arbre: "lontan", nom: "Râtelier à bois", categorie: "stockage", materiau: ["bambou-et-vacoa", "bois-sous-tole"],
    description: `Deux rangs de piquets où l'on couche les troncs, les poutres et les bambous hors de la boue, à l'abri des termites. Au second niveau, un toit de tôle : les planches aussi y tiennent.`,
    niveaux: [
      { cout: { ile: 1, travail: 2 }, effets: { stockage: { materiaux: 10 } }, materiau: "bambou-et-vacoa", entretien: E(60) },
      { cout: { materiaux: 1, travail: 6 }, effets: { stockage: { materiaux: 25 } }, materiau: "bois-sous-tole" }
    ] }),
  ouvrage({ cle: "abri-a-materiaux", nom: "Abri à matériaux", categorie: "stockage", materiau: "bois-sous-tole",
    description: `Un toit de tôle sur quatre poteaux : planches, tôles, parpaings, sacs de ciment et rouleaux de grillage y restent au sec et rangés, au lieu de rouiller dans la cour.`,
    niveaux: [
      { cout: { materiaux: 3, travail: 10 }, effets: { stockage: { materiaux: 40 } } }
    ] }),
  ouvrage({ cle: "four-a-chaux", arbre: "lontan", nom: "Four à chaux", categorie: "vie", materiau: "pierre-seche", bras: { tache: "atelier" },
    description: `Une tour de pierres sèches qu'on remplit de coquillages, de débris de corail mort ramassés sur la plage et de bois, et qu'on fait cuire un jour et une nuit. Il en sort de la chaux, qui fait le mortier et le badigeon : de quoi bâtir sans ciment. Sa fumée blanche monte droit et se voit de toute la côte.`,
    niveaux: [
      { cout: { ile: 4, travail: 12 }, requiert: { savoirs: ["maconnerie"] }, effets: { production: { materiaux: 0.25 }, visibilite: 2, odeur: 1 } }
    ] }),

  // ---- Couchage et vie commune
  ouvrage({ cle: "paillasse", arbre: "lontan", role: "dortoir", rang: 1, nom: "Paillasses", categorie: "vie", materiau: "paille-et-torchis",
    description: `Du chaume sec sous une natte de vacoa, à même le plancher : on y dort, sans plus. Au second niveau, une toile cousue et des nattes doubles. Quand le dortoir manque, on se serre dessus.`,
    niveaux: [
      { cout: { ile: 1, travail: 1 }, effets: { capacite: 2 }, entretien: E(30) },
      { cout: { ile: 2, travail: 2 }, effets: { capacite: 4 }, entretien: E(30) }
    ] }),
  ouvrage({ cle: "lits-de-bois", role: "dortoir", rang: 2, nom: "Lits de bois", categorie: "vie", materiau: "bois-sous-tole",
    description: `Des cadres de planches sanglés de corde, hors du sol : on y dort mieux, loin des scolopendres et de l'eau qui court par terre les nuits d'averse.`,
    niveaux: [
      { cout: { materiaux: 2, travail: 4 }, effets: { capacite: 2, moral: 1 } }
    ] }),
  ouvrage({ cle: "grande-table", nom: "Grande table", categorie: "vie", materiau: "bois-sous-tole",
    description: `Une table où tout l'abri tient en même temps, deux bancs : on y mange ensemble, on y règle ce qui doit se régler, on y joue aux dominos le soir. Ce qui se dit autour d'une table se dit autrement.`,
    niveaux: [
      { cout: { materiaux: 3, travail: 6 }, effets: { moral: 1 } }
    ] }),
  ouvrage({ cle: "coin-de-priere", nom: "Coin de prière", categorie: "vie", materiau: "pierre-seche",
    description: `Une tablette de pierre contre le mur le plus calme, une flamme, un linge propre. Chacun y pose ce que sa foi demande, une image, une lampe, un chapelet, une poignée de riz, ou vient seulement s'y taire un moment. Personne n'y prie à la place d'un autre.`,
    niveaux: [
      { cout: { materiaux: 1, travail: 2 }, effets: { moral: 1 }, entretien: E(14) }
    ] }),
  ouvrage({ cle: "tableau-des-corvees", nom: "Tableau des corvées", categorie: "vie", materiau: "bois-sous-tole",
    description: `Une planche clouée près de la porte et un bout de charbon : qui va à l'eau, qui garde cette nuit, qui fait le cari. Ce qui est écrit se discute moins ; ce qui se discute encore, on l'efface et on recommence.`,
    niveaux: [
      { cout: { materiaux: 1, travail: 1 }, effets: { bonus: { parole: 1 } } }
    ] }),
  ouvrage({ cle: "salle-verte", arbre: "lontan", nom: "Salle verte", categorie: "vie", materiau: "bambou-et-vacoa", expose: true,
    description: `Une tonnelle de bambou couverte de palmes et de feuilles de vacoa, dressée pour les fêtes, les mariages et les veillées, comme dans les cours d'avant. On y mange, on y danse, on y pleure aussi. Elle se voit, et le vent la défait.`,
    niveaux: [
      { cout: { ile: 3, travail: 6 }, effets: { moral: 1, visibilite: 1, fete: 1 }, entretien: E(30) }
    ] }),
  ouvrage({ cle: "lampes-a-huile", arbre: "lontan", role: "eclairage", rang: 1, nom: "Lampes à huile", categorie: "vie", materiau: "bambou-et-vacoa",
    description: `Trois petites flammes dans des boîtes de conserve, une mèche de coton, de l'huile de bancoul ou de coco pressée à la main : la lumière des veillées. Il faut refaire de l'huile chaque semaine. Elles se voient par les fentes.`,
    niveaux: [
      { cout: { ile: 1, travail: 1 }, effets: { moral: 1, visibilite: 1, lumiere: true }, entretien: E(7) }
    ] }),
  ouvrage({ cle: "eclairage-electrique", arbre: "moderne", role: "eclairage", nom: "Éclairage électrique", categorie: "vie", materiau: "tole-de-recuperation",
    description: `Des ampoules de voiture et des rubans de lumière sur le courant de l'abri : on y voit comme avant, on lit, on recoud, la garde voit la cour. Et l'abri se voit de loin, comme une lampe sur la mer.`,
    niveaux: [
      { cout: { materiaux: 1, pieces: 2, travail: 3 }, requiert: { savoirs: ["electricite-solaire"] }, effets: { moral: 1, visibilite: 2, lumiere: true, bonus: { vigilance: 1 }, consommation: { energie: 1 } },
        entretien: E(90, 1, { panne: 0.01 }) }
    ] }),

  // ---- Remises
  ouvrage({ cle: "remise-a-charrettes", arbre: "lontan", role: "remise", rang: 1, nom: "Remise à charrettes", categorie: "stockage", materiau: "paille-et-torchis", expose: true,
    description: `Un toit de chaume sur des poteaux, assez haut pour une charrette chargée : les charrettes, le chariot, le motoculteur et leurs remorques y restent au sec, et l'huile de leurs essieux ne part pas avec la pluie.`,
    niveaux: [
      { cout: { ile: 4, travail: 9 }, effets: { remise: 3 }, entretien: E(60) }
    ] }),
  ouvrage({ cle: "remise-a-velos", arbre: "moderne", role: "remise", nom: "Remise à vélos", categorie: "stockage", materiau: "tole-de-recuperation",
    description: `Un auvent de tôle et des crochets au mur : les vélos, le vélo-cargo et les remorques à l'abri de la pluie et du sel.`,
    niveaux: [
      { cout: { materiaux: 2, travail: 5 }, effets: { remise: 6 } }
    ] }),
  ouvrage({ cle: "borne-de-recharge", arbre: "moderne", nom: "Remise à recharge", categorie: "energie", materiau: "tole-de-recuperation",
    description: `Un abri de tôle câblé sur les batteries, un régulateur de charge : le petit utilitaire électrique s'y recharge la nuit. Elle boit le courant de l'abri ; on l'éteint quand rien ne charge.`,
    niveaux: [
      { cout: { materiaux: 2, pieces: 4, travail: 12 }, requiert: { savoirs: ["electricite-solaire"], installations: [{ cle: "panneaux-solaires", niveau: 2 }, { cle: "batteries", niveau: 1 }] },
        effets: { consommation: { energie: 2 }, remise: 2, recharge: true }, entretien: E(60) }
    ] }),

  // ---- Énergie et matières
  ouvrage({ cle: "roue-a-aubes", nom: "Roue à aubes", categorie: "energie", materiau: "bois-sous-tole",
    description: `Une roue de planches dans le courant de la ravine, un axe, une courroie, l'alternateur d'une voiture : deux unités de courant par jour, jour et nuit, tant que l'eau coule. Les feuilles et les branches la bloquent vite ; à sec ou en crue, elle s'arrête.`,
    niveaux: [
      { cout: { materiaux: 3, pieces: 2, travail: 12 }, requiert: { site: { eau: ["riviere"] } }, effets: { production: { energie: 2 }, conditions: { riviere: true } },
        entretien: E(6, 1, { encrassement: 0.7, arret: true, panne: 0.006 }) }
    ] }),
  ouvrage({ cle: "digesteur-a-biogaz", arbre: "moderne", nom: "Digesteur à biogaz", categorie: "energie", materiau: "parpaing-et-beton",
    description: `Des fûts fermés, enterrés à moitié, où le fumier des cabris fermente avec de l'eau : le gaz monte dans une chambre à air et part par un tuyau jusqu'à la gazinière. Il sent, il demande du fumier frais et de l'eau chaque jour, et il ne s'improvise pas. Au second niveau, une cuve maçonnée.`,
    niveaux: [
      { cout: { materiaux: 4, pieces: 2, travail: 18 }, requiert: { savoirs: ["plomberie-filtration"], installations: [{ cle: "enclos-a-cabris", niveau: 1 }] },
        effets: { production: { gaz: 0.5 }, consommation: { eau: 1 }, odeur: 1, fumier: ["enclos-a-cabris"] }, entretien: E(15) },
      { cout: { materiaux: 3, pieces: 1, travail: 8 }, requiert: { savoirs: ["plomberie-filtration", "maconnerie"], installations: [{ cle: "enclos-a-cabris", niveau: 1 }] },
        effets: { production: { gaz: 1 }, consommation: { eau: 1 }, odeur: 1, fumier: ["enclos-a-cabris"] }, entretien: E(15) }
    ] }),
  ouvrage({ cle: "touffe-de-bambous", arbre: "lontan", nom: "Touffe de bambous", categorie: "stockage", materiau: "bambou-et-vacoa", expose: true,
    description: `Quelques pieds de bambou plantés près de l'eau, au fond de la cour. Pendant six mois, rien ; ensuite, on ne manque plus de cannes pour les gouttières, les claies, les palissades. Le bambou plie au cyclone et repousse.`,
    niveaux: [
      { cout: { ile: 1, travail: 3 }, requiert: { site: { sol: 1 } }, effets: { bois: 0.5, conditions: { delai: 180 } } }
    ] })
];

// Les bras (§10.3) des installations du lot, sous la forme de BRAS (installations.mjs) : { cle: { tache, nombres } }.
export const BRAS_OUVRAGES = Object.fromEntries(INSTALLATIONS_OUVRAGES.filter(d => d.system.niveaux.some(n => n.effets.bras))
  .map(d => [d.system.cle, { tache: d.system.niveaux.find(n => n.effets.bras).effets.bras.tache, nombres: d.system.niveaux.map(n => n.effets.bras?.nombre ?? 1) }]));

// ---------------------------------------------------------------- Les plans (registre du lot 4 : un rabais, jamais une exigence)
const P = (cle, rarete, lieux = []) => ({ cle, installation: cle, rarete, lieux });
export const PLANS_OUVRAGES = [
  P("haie-de-choka", [10, 30], ["ferme", "case-creole"]),
  P("chausse-trapes", [10, 30], ["ilet", "ferme"]),
  P("cloche-d-alarme", [5, 20], ["eglise", "ecole", "caserne"]),
  P("herse", [35, 60], ["caserne", "usine"]),
  P("portail-de-bois-dur", [20, 45], ["case-creole", "ferme"]),
  P("chemin-de-ronde", [25, 50], ["caserne"]),
  P("meurtriere-de-basalte", [35, 60], ["ilet", "ferme"]),
  P("passerelle-relevee", [25, 50], ["ilet"]),
  P("douves", [45, 70], ["caserne", "usine"]),
  P("enceinte-de-palettes", [5, 20], ["commerce", "usine", "port"]),
  P("enceinte-d-epaves", [10, 30], ["commerce", "usine"]),
  P("puits-creuse", [30, 60], ["ferme", "ecole"]),
  P("bassin-de-pierre", [20, 40], ["ilet", "ferme"]),
  P("cuve-en-hauteur", [25, 45], ["maison", "ferme", "commerce"]),
  P("jarre-filtrante", [15, 35], ["case-creole", "ilet"]),
  P("pompe-electrique", [40, 65], ["usine", "ferme", "commerce"]),
  P("foyer-trois-roches", [0, 10], ["case-creole", "ilet", "gite"]),
  P("four-a-pain", [10, 35], ["ecole", "case-creole"]),
  P("boucan", [10, 30], ["case-creole", "ilet", "ferme"]),
  P("claies-de-sechage", [5, 20], ["case-creole", "ferme"]),
  P("cellier-de-pierre", [25, 50], ["ilet", "ferme"]),
  P("ratelier-a-bois", [5, 15], ["ferme", "case-creole"]),
  P("abri-a-materiaux", [5, 20], ["commerce", "usine", "ferme"]),
  P("four-a-chaux", [25, 55], ["commerce", "ecole", "port"]),
  P("paillasse", [0, 10], ["case-creole", "ilet"]),
  P("lits-de-bois", [5, 20], ["maison", "gite"]),
  P("grande-table", [5, 15], ["ecole", "gite"]),
  P("coin-de-priere", [5, 20], ["eglise", "case-creole"]),
  P("tableau-des-corvees", [5, 15], ["ecole", "caserne"]),
  P("salle-verte", [10, 30], ["case-creole", "ilet"]),
  P("lampes-a-huile", [5, 20], ["case-creole", "eglise"]),
  P("eclairage-electrique", [30, 55], ["commerce", "immeuble"]),
  P("remise-a-charrettes", [15, 35], ["ferme"]),
  P("remise-a-velos", [10, 25], ["maison", "immeuble"]),
  P("borne-de-recharge", [60, 85]),
  P("roue-a-aubes", [35, 60], ["ferme", "ilet"]),
  P("digesteur-a-biogaz", [70, 95]),
  P("touffe-de-bambous", [5, 20], ["ilet", "ferme"])
];
// Les plans rares du lot, là où le savoir vivait (sites[].plans, lu par le lot 4) : le digesteur dans les fermes d'élevage, la remise à
// recharge à la centrale du Port.
export const PLANS_OUVRAGES_DES_SITES = {
  "ferme-des-palmistes": ["digesteur-a-biogaz"],
  "ferme-de-la-plaine-des-cafres": ["digesteur-a-biogaz"],
  "centrale-du-port-est": ["borne-de-recharge"]
};
export const sitesAvecPlansOuvrages = sites => sites.map(s => (PLANS_OUVRAGES_DES_SITES[s.cle]
  ? { ...s, plans: [...new Set([...(s.plans ?? []), ...PLANS_OUVRAGES_DES_SITES[s.cle]])] } : s));

// ---------------------------------------------------------------- Tables du MJ
const T = (cle, nom, description, resultats) => {
  const t = table({ cle, nom, description, resultats });
  Object.assign(t.flags[MODULE], { ouvrages: cle });
  return t;
};
export const TABLES_OUVRAGES = [
  T("livides-devant-l-abri", "Les Livides devant l'abri — ce qu'ils font", `Pendant un assaut de Livides, ou quand le groupe regarde par-dessus la palissade. Tirez une fois par moment de l'assaut.`, [
    "Ils longent l'enceinte, la main sur les planches, sans s'arrêter : ils cherchent par où passer. Un trou de soixante mètres plus loin leur suffit.",
    "L'un d'eux s'est arrêté devant la porte et frappe, du plat de la main, sans fin. Les autres viennent se presser derrière lui.",
    "Ils s'en prennent au poteau d'angle, le plus vieux, celui qui penche. Ce soir, il faudra le reprendre.",
    "Le chemin de ronde tient : en dessous, ils lèvent les bras, griffent l'air, et ne comprennent pas l'échelle. Ce sont les poteaux qu'ils secouent.",
    "Le premier tombe dans la fosse, puis le deuxième ; le cinquième marche sur les autres et prend pied au bord.",
    "Le bruit de leurs coups en amène d'autres, du bas de la ravine. Ils ne frappent pas : ils se pressent, et attendent.",
    "Un Livide figé par le froid des Hauts, appuyé contre la barrière depuis l'aube, qui n'a pas bougé. On ne sait pas s'il entend encore.",
    "Ils se taisent d'un coup et se détournent : un bruit plus fort ailleurs, une tôle qui claque, un chien. Le siège se défait.",
    "La cloche a sonné : tout l'abri est debout. Au loin, d'autres silhouettes ont levé la tête vers le son.",
    "Plus un signe de vie dans l'abri depuis une heure : ils s'en vont un à un, sans hâte, vers le prochain bruit."
  ]),
  T("entretien-oublie", "Un entretien oublié — ce qui lâche", `Quand une installation perd un cran faute de soin, ou pour raconter une panne. Tirez une fois.`, [
    "Les joints de la gouttière ont lâché : la moitié de l'averse est passée à côté de la citerne.",
    "Des termites dans les poteaux de la palissade : on enfonce un doigt dans le bois comme dans du pain.",
    "La crépine de la pompe est bouchée de feuilles et de vase. Une heure, les mains dans l'eau froide.",
    "Les panneaux sont gris de poussière et de fientes : ils ne donnent plus que la moitié. Un seau d'eau, un chiffon.",
    "Le torchis de la paillote a coulé avec la pluie : les murs ont des trous où passe le jour.",
    "Une batterie a gonflé, elle sent l'œuf pourri : il faut la sortir, loin, avant qu'elle ne fuie.",
    "Le compost n'a pas été retourné : il sent, il attire les rats, et il ne nourrit plus rien.",
    "La roue à aubes est bloquée par un tronc venu d'en haut. Il faut entrer dans l'eau pour la dégager.",
    "L'étai de la cave a travaillé : une fissure court au plafond, de la terre tombe la nuit.",
    "Rien de cassé, rien de bouché : quelqu'un y a pensé avant vous. Notez qui."
  ]),
  T("feu-a-l-abri", "Le feu à l'abri — d'où il vient", `Pour un incendie de l'abri (API incendie). Tirez une fois ; la force est entre parenthèses.`, [
    "Une lampe à huile renversée par un chat sur une natte (1).",
    "Des braises du foyer emportées par une rafale jusqu'au toit de chaume du boucan (2).",
    "Le groupe électrogène, surchauffé, prend feu au réservoir (2).",
    "Une bande jette des bouteilles enflammées par-dessus la palissade, en pleine nuit (2).",
    "L'incendie des savanes descend la pente, poussé par le vent (3) : tout ce qui est de paille et de bois y passe.",
    "Un court-circuit dans les câbles bricolés de l'éclairage (1).",
    "La graisse du boucan s'enflamme pendant que tout le monde regarde ailleurs (1).",
    "Le feu de la fête, trop haut, trop près de la salle verte (2)."
  ])
];

// ---------------------------------------------------------------- Journaux du MJ
const PAGES_LIVIDES = [
  { cle: "principe", titre: "Ce qu'un Livide fait devant un abri", texte: `Un Livide ne s'en prend pas à une case vide. **Il ne frappe que s'il y a un vivant derrière** : il en a vu entrer un, il l'entend, il le sent. Une maison silencieuse, il passe devant.

Devant une clôture, il cherche d'abord à passer : **il longe le mur** et le contourne si le détour fait moins d'une soixantaine de mètres (le tour d'une case, l'entrée de derrière). Sinon, **il s'en prend à la pièce la plus faible** à sa portée : la planche pourrie, le poteau qui penche, la tôle mal clouée. Chaque coup fait du bruit, et le bruit en amène d'autres, qui se pressent derrière sans frapper.

**Une porte fermée se frappe, toujours.** C'est pour cela qu'une herse, un portail lourd ou une porte blindée protègent tout le reste : les coups vont sur elle.

**Un Livide ne monte pas à l'échelle.** Un vivant qui se tient à plus de deux mètres au-dessus de lui n'est plus frappé. Les Livides se pressent dessous, puis s'en prennent à **ce qui porte** : les poteaux du chemin de ronde, les pieds de la tour. Si les appuis tiennent, la garde tient.

**Une fosse se comble.** Les premiers tombent et n'en ressortent pas ; quand il y en a assez au fond, les suivants marchent dessus et passent. Une fosse arrête une poignée de Livides, pas une horde ; après, il faut la vider.

**Le siège cesse** peu après le dernier signe de vie. Se taire, éteindre, attendre : c'est parfois la meilleure défense, et c'est la plus dure.` },
  { cle: "regles", titre: "Ce que le système compte", texte: `Un assaut se règle comme avant (contrat §1.7) : les dés de défense de l'abri et de la garde contre la force de la menace. Devant des **Livides** (une horde, des Livides), les ouvrages jouent en plus :

- **Les pièges** (fossé et pièges, chausse-trapes, douves) ôtent leur force à celle de l'assaut, avant les dés (jamais sous 1). Un piège débordé (une force plus de quatre fois la sienne) se comble : il perd un cran d'état, à vider (réparer).
- **La hauteur** (chemin de ronde) : si un garde est présent et que le chemin de ronde n'est pas hors service, **il n'y a pas de brèche** ; l'issue devient « endommagée », sans blessé, et ce sont les appuis (le chemin de ronde) qui prennent le coup.
- **La porte** (herse, portail de bois dur, passerelle relevée, porte blindée) : tant qu'ils sont dehors, quand une installation est abîmée, c'est elle.
- Sinon, **l'enceinte** (les installations de défense) prend le coup, plus souvent à sa pièce la plus faible (le torchis avant le bambou, le bambou avant la tôle, la tôle avant le bois, le bois avant la pierre) ; sans enceinte, ou une fois entrés (une brèche), le coup tombe sur n'importe quoi, plus souvent ce qui est fragile.
- **La cloche** donne +1 en vigilance (comme une tour de guet) ; quand on la frappe pendant un assaut, l'abri fait +2 de bruit : elle prévient, et elle attire.

Contre des **vivants** (une bande) ou des bêtes, rien de cela : ils voient les pièges, ils prennent ce qu'ils veulent.

**Pour le MJ** : assaut({ force, horde }) fait tout cela ; ouvrages() dit ce que l'abri a de pièges, de hauteur, de portes. La table « Les Livides devant l'abri — ce qu'ils font » donne de quoi raconter.` },
  { cle: "raconter", titre: "Raconter un siège", texte: `Ce qui fait peur, dans un siège, ce n'est pas ce qu'on voit : c'est le bruit. Les coups réguliers sur la tôle, qui ne s'arrêtent pas. Le grattement contre la porte. Le silence, d'un coup, qui est pire.

- Décrivez la clôture, pas les Livides : le poteau qui bouge, la planche qui cède d'un centimètre.
- Donnez aux joueurs des choix : frapper par-dessus, se taire, sonner la cloche, renforcer la porte, attendre.
- Laissez le temps passer : un siège dure. Quelqu'un doit dormir, quelqu'un doit boire, un enfant pleure.
- Après, montrez les dégâts : ce qu'il faudra refaire, et ce que ça coûte.

Rien de gore : un Livide est une silhouette, une main grise sur une planche, une odeur. Les joueurs comblent le reste.` }
];
const PAGES_BATIR = [
  { cle: "materiaux", titre: "Les six matériaux", texte: `Chaque installation est faite d'une famille de matériaux. Elle dit ce qui l'abîme :

- **Paille et torchis** : rien ne coûte moins, rien ne tient moins. Le cyclone l'emporte (0,9), le feu le prend (1), **la pluie l'use chaque jour** (son entretien revient plus vite sous la pluie).
- **Bambou et vacoa** : souple, il plie au vent (0,7) ; il brûle.
- **Bois sous tôle** : la case ordinaire (cyclone 0,5, la mesure d'avant).
- **Tôle de récupération** : elle ne brûle presque pas, mais **le vent l'arrache** (0,8) : une tôle qui s'envole devient un projectile, et elle claque sous la pluie toute la nuit.
- **Pierre sèche** : le cyclone n'y peut presque rien (0,2), **le feu ne la prend pas**.
- **Parpaing et béton** : rien ne l'atteint (0,05), le feu non plus. Mais il faut du ciment, et du savoir.

**Le cyclone** abîme une installation exposée avec une chance par point de dégâts égale à la moitié de cette part (25 % pour le bois sous tôle, 40 % pour la tôle, 10 % pour la pierre). Une paillote, une tonnelle, une remise de chaume sont exposées même si ce ne sont ni des cultures ni des défenses.

**Le feu** (incendie({ force })) : chaque installation, sauf sous terre, prend un cran par point de force avec la moitié de sa part au feu ; la pierre et le parpaing ne brûlent pas. À force 2 et plus, l'abri lui-même est abîmé.` },
  { cle: "entretien", titre: "L'entretien", texte: `**Une installation qu'on ne soigne pas perd un cran** : pleine marche, 75 %, 50 %, hors service. Chacune a son rythme : la citerne tous les 60 jours, la palissade tous les 90, le compost tous les 15, le boucan tous les 30 (plus vite sous la pluie : c'est du torchis).

**Qui soigne.** Ceux qui sont à la tâche de l'installation (le potager, le filtre, l'atelier ont leurs bras : ils la tiennent en travaillant) et, pour les autres, **ceux qui sont au chantier**, à l'abri : chacun donne un quart de soin par jour, à ce qui presse le plus. On peut aussi entretenir à la demande (entretenir({ installationId, membres, quarts })).

**Un soin** remet le délai à zéro, nettoie, et **rattrape un cran perdu faute de soin**. Il ne répare pas une casse (un assaut, un cyclone, une panne) : ça, c'est reparer, avec des matériaux.

**S'encrasser.** Les panneaux se salissent en 12 jours et ne donnent plus que la moitié (la pluie les lave) ; la pico-hydro se bouche en 8 jours, la roue à aubes en 6, la pompe électrique en 10 : elles s'arrêtent. Elles ne perdent pas d'état : il suffit de les nettoyer.

**Les pannes.** Ce qui a un moteur ou de l'électronique tombe en panne de temps en temps (de 0,2 à 1 % par jour : le groupe électrogène le plus, les batteries le moins). Une panne, c'est un cran d'état : à réparer. Les batteries **vieillissent** : un cran tous les 400 jours.

**Une partie d'avant** : les délais partent du jour où le système les voit pour la première fois ; rien ne casse d'un coup.` },
  { cle: "defenses", titre: "Les défenses avec les moyens du bord", texte: `Les anciens châteaux avaient une enceinte, une porte lourde, un chemin de ronde, des douves. Un abri de Fénoir peut avoir tout cela, en tôle, en bambou et en pierre :

- **La haie de choka** : ses épines arrêtent ce qui marche droit, mais **il faut six mois pour qu'elle ferme** ; elle prend la place des barricades quand elles tombent, et donne de la fibre.
- **Les chausse-trapes** de bambou : un piège (−1 à la force des Livides), qui relaie le fossé.
- **La herse** à contrepoids et le **portail de bois dur** : une porte (les coups vont sur elle).
- **Le chemin de ronde**, sur la palissade : la hauteur (pas de brèche tant qu'il tient et qu'un garde y est).
- **La meurtrière de basalte** : +1 en tir à l'abri.
- **La passerelle relevée** au-dessus du fossé : une porte, qu'on remonte le soir.
- **Les douves**, remplies par la ravine : un gros piège (−2).
- **Les enceintes de palettes et d'épaves** : des palissades de fortune, qui la remplacent quand elle manque.
- **La cloche d'alarme** : elle réveille tout le monde, et tout le voisinage.

Et **la cave** : creuser sans savoir étayer, c'est risquer l'éboulement (une fois sur quatre, au moment d'achever un niveau) ; près d'une eau qui court, même en sachant, le risque est là. Un éboulement blesse sans tuer et rebouche la dernière cellule.` },
  { cle: "lontan", titre: "Les deux façons de bâtir", texte: `Presque tout ce qu'on bâtit a sa version d'avant, faite avec ce qui pousse autour (le bois, le bambou, le vacoa, la pierre des champs) : le foyer à trois roches pour la cuisine, le boucan pour le fumoir, le cellier de pierre pour la réserve, les paillasses pour le dortoir, les jarres filtrantes pour le filtre, le bassin de pierre pour la cuve, les lampes à huile pour l'éclairage, la remise de chaume pour celle de tôle. Elles ne s'additionnent pas : la meilleure qui marche est en service, l'autre attend. Elles coûtent des matières de l'île et du travail, pas des matériaux fouillés ; elles tiennent moins, et se refont.

**Le puits creusé** : là où il n'y a ni source ni ravine, on creuse jusqu'à la nappe. Deux, puis trois unités d'eau par jour, à remonter à bras. **La touffe de bambous** regarnit le bois des alentours au bout de six mois. **Le four à chaux** fait de la chaux, donc du mortier, avec des coquillages et du bois.` }
];
export const JOURNAUX_OUVRAGES = [
  journal({ cle: "les-livides-devant-un-abri", nom: "Les Livides devant un abri", pack: "mj", pages: PAGES_LIVIDES }),
  journal({ cle: "batir-et-entretenir", nom: "Bâtir et entretenir", pack: "mj", pages: PAGES_BATIR })
];

// ---------------------------------------------------------------- Une page du guide du joueur
export const PAGES_JOUEUR_OUVRAGES = [
  { cle: "batir-et-defendre", titre: "Bâtir, entretenir, défendre", texte: `Ce qu'on bâtit s'use, se salit, casse ; et ce qui est fait de paille tient moins que ce qui est fait de pierre.

- **Les matériaux.** La paille et le torchis s'envolent au cyclone et s'usent sous la pluie ; la tôle s'arrache au vent mais ne brûle pas ; la pierre et le parpaing ne craignent presque rien, ni le vent ni le feu.
- **L'entretien.** Une installation qu'on ne soigne pas perd un cran tous les quelques semaines. Quelqu'un au chantier, à l'abri, la soigne en passant. Les panneaux sales, la roue bouchée produisent moins ou plus du tout : un coup de chiffon, et ça repart.
- **Les pannes.** Ce qui a un moteur tombe en panne de temps en temps. Il faut réparer.
- **Les Livides devant l'abri.** Ils ne frappent que s'ils savent quelqu'un derrière. Ils cherchent un passage, puis s'en prennent à ce qui est faible, et à la porte, toujours. Ils ne montent pas aux échelles : d'un chemin de ronde, on les tient. Une fosse en arrête quelques-uns, pas une foule. Le silence les fait partir.
- **Les deux façons.** Presque tout existe en version d'avant, faite de bambou, de paille et de pierre : moins forte, gratuite, qui se refait.
- **Le feu.** Il prend la paille, le bambou et le bois ; la pierre reste.
- **La cave.** Sans savoir étayer, elle s'éboule. Près de l'eau qui court, aussi.` }
];
