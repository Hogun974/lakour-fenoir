// Le vivant de l'abri : élevage, cultures et bêtes de l'île (lot 8 du portage de Fénoir 3D, 2026-11-17 ; complément du jeu 3D,
// familles 9 et 10, décisions de Jordan des 15, 16 et 17 novembre, le reste validé le 17 : « tout maintenant »). Les règles sont dans
// le système (logique/vivant.mjs, savoirs.mjs ; contrat §27 ; chiffres : docs/equilibre-vivant.md) ; ici, le contenu :
// - les espèces élevées (registre `especes`) : ce qu'elles donnent, ce qu'elles mangent, leurs naissances, leur altitude, leur remède,
//   et comment on les prend en liberté ;
// - `effets.vivant` (et l'eau de ceux qui boivent) posés sur la basse-cour, l'enclos à cabris, le bassin à tilapias et les ruches, sans
//   changer leur production de base ; `effets.pluieArrose` sur ce qui pousse à ciel ouvert (potager, jardin créole, verger) ;
// - onze installations nouvelles du vivant (clapier, soue, étable, bassin à camarons, aquaponie, bacs et serre hors-sol, jardin de
//   zerbaz, treille à chouchou, bananeraie, carreau de canne) ;
// - les bêtes retournées sauvages (bestiaire, catégorie « bete » : elles n'attaquent pas), leurs tables par zone ;
// - trois outils de capture (cage de bambou, sac de goni, enfumoir) et leurs recettes ;
// - le journal du MJ « Le vivant de l'abri » et une page du guide du joueur.
// Rien n'est une monture : à part les chiens, les animaux s'élèvent, ils ne s'apprivoisent pas ; la charrette à bœufs reste de la
// traction. Aucune origine ne joue : ce sont les gens et leurs savoirs qui comptent.
import { installation, html, journal, table, MODULE } from "./aides.mjs";

// ---------------------------------------------------------------- Les espèces
// { cle, nom, genre: "betes" | "poissons" | "plants" | "essaim", taux (naissances par jour et par couple), viande (nourriture par
//   tête abattue), mange: "herbe" | "restes" | "solution" | "", maladie (chance par jour, abri insalubre), altitude: [min, max] | null,
//   remede: { cout, texte }, capture: { difficulte, outils: [clé d'équipement], horsEnclos (quarts) } | null, produit (ce qu'on en tire),
//   alias?: [clé] (les clés des bêtes trouvées en fouillant du lot 5 : le porcelet est un cochon, le veau moka un bœuf moka) }
// Les outils : ceux d'ici (cage de bambou, sac de goni, enfumoir), la corde de choka et les nasses qui existaient, et ceux du lot 5
// (« cage », « corde ») s'il les apporte : un seul suffit, prendreBete accepte n'importe lequel de la liste.
const TISANE = { cout: { plantes: 1 }, texte: "une tisane de zerbaz (une brassée)" };
const EAU_CHANGEE = { cout: { eau: 4 }, texte: "l'eau changée, une poignée de sel (quatre d'eau)" };
const LESSIVE = { cout: { ile: 1 }, texte: "de la lessive de cendre (du bois des alentours)" };
export const ESPECES = [
  { cle: "poule", nom: "Poule péi", genre: "betes", taux: 0.08, viande: 1, mange: "restes", maladie: 0.02, altitude: null, remede: TISANE,
    capture: { difficulte: "facile", outils: ["cage-de-bambou", "cage", "sac-de-goni"], horsEnclos: 4 },
    produit: "Des œufs (une ration de nourriture vaut quatre œufs), et une poule au cari les jours de fête." },
  { cle: "lapin", nom: "Lapin", genre: "betes", taux: 0.1, viande: 1, mange: "herbe", maladie: 0.02, altitude: null, remede: TISANE,
    capture: { difficulte: "normale", outils: ["cage-de-bambou", "cage", "sac-de-goni"], horsEnclos: 4 },
    produit: "De la viande sans bruit, du fumier pour le jardin." },
  { cle: "cabri", nom: "Cabri", genre: "betes", taux: 0.02, viande: 6, mange: "herbe", maladie: 0.01, altitude: null, remede: TISANE,
    capture: { difficulte: "normale", outils: ["cordes-de-choka", "corde"], horsEnclos: 6 },
    produit: "Du lait, des chevreaux, du fumier ; un cabri abattu, six rations et une peau." },
  { cle: "cochon", nom: "Cochon", genre: "betes", taux: 0.03, viande: 10, mange: "restes", maladie: 0.01, altitude: null, remede: TISANE, alias: ["porcelet"],
    capture: { difficulte: "normale", outils: ["cordes-de-choka", "corde", "sac-de-goni"], horsEnclos: 5 },
    produit: "Rien chaque jour, sinon le fumier : on l'engraisse aux restes et aux troncs de bananier, et un cochon nourrit le camp dix jours." },
  { cle: "boeuf-moka", nom: "Bœuf moka", genre: "betes", taux: 0.004, viande: 20, mange: "herbe", maladie: 0.01, altitude: null, remede: TISANE, alias: ["veau-moka"],
    capture: { difficulte: "normale", outils: ["cordes-de-choka", "corde"], horsEnclos: 8 },
    produit: "Du lait, du fumier, la traction d'une charrette ; abattu, vingt rations et trois peaux." },
  { cle: "essaim", nom: "Essaim d'abeilles", genre: "essaim", taux: 0, viande: 0, mange: "", maladie: 0.01, altitude: null, remede: TISANE,
    capture: { difficulte: "normale", outils: ["enfumoir"], horsEnclos: 2 },
    produit: "Le miel, la cire des bougies, des fleurs qui donnent mieux." },
  { cle: "tilapia", nom: "Tilapia", genre: "poissons", taux: 0.05, viande: 0.25, mange: "restes", maladie: 0.02, altitude: [0, 900], remede: EAU_CHANGEE,
    capture: { difficulte: "normale", outils: ["collets-et-nasses"], horsEnclos: 2 },
    produit: "Du poisson (quatre tilapias font une ration)." },
  { cle: "camaron", nom: "Camaron", genre: "poissons", taux: 0.02, viande: 0.5, mange: "restes", maladie: 0.02, altitude: [0, 500], remede: EAU_CHANGEE,
    capture: { difficulte: "normale", outils: ["collets-et-nasses"], horsEnclos: 2 },
    produit: "Le camaron de la rivière, le plat des grands jours (deux font une ration)." },
  { cle: "anguille", nom: "Anguille", genre: "poissons", taux: 0.01, viande: 0.5, mange: "restes", maladie: 0.02, altitude: [0, 1200], remede: EAU_CHANGEE,
    capture: { difficulte: "normale", outils: ["collets-et-nasses"], horsEnclos: 2 },
    produit: "L'anguille des bassins, lente à venir (deux font une ration)." },
  { cle: "plants-hors-sol", nom: "Plants hors-sol", genre: "plants", taux: 0, viande: 0, mange: "solution", maladie: 0.03, altitude: null, remede: LESSIVE,
    capture: null,
    produit: "Des brèdes surtout, des salades dans les Hauts, des tomates et des piments dans les Bas." }
];

// ---------------------------------------------------------------- Ce qui existe déjà passe sous la règle du vivant
// Les places et le plein de chaque niveau, l'eau de ceux qui boivent (décision de Jordan du 16 novembre : « l'eau est exigée pour
// tout ce qui boit »), la pluie qui arrose à ciel ouvert. La production de base ne change pas.
const VIVANT_EXISTANT = {
  "basse-cour": { niveaux: [{ espece: "poule", places: 6, plein: 4, depart: 3 }, { espece: "poule", places: 12, plein: 8 }], eau: 0.5 },
  "enclos-a-cabris": { niveaux: [{ espece: "cabri", places: 4, plein: 2, depart: 2 }, { espece: "cabri", places: 6, plein: 4 }], eau: 1 },
  "bassin-a-tilapias": { niveaux: [{ espece: "tilapia", places: 30, plein: 20, depart: 12, filtre: 20 }, { espece: "tilapia", places: 40, plein: 30, filtre: 8 }] },
  ruches: { niveaux: [{ espece: "essaim", places: 1, plein: 1, depart: 1 }, { espece: "essaim", places: 1, plein: 1 }] },
  "ruches-en-tronc": { niveaux: [{ espece: "essaim", places: 1, plein: 1, depart: 1 }] }
};
export const PLUIE_ARROSE = ["potager", "jardin-creole", "verger"];
// Pose effets.vivant, l'eau et pluieArrose sur les installations du module (les objets du compendium et le registre).
export function vivantDesInstallations(installations = []) {
  for (const i of installations) {
    const cle = i.system?.cle ?? i.cle;
    const niveaux = i.system?.niveaux ?? i.niveaux ?? [];
    const v = VIVANT_EXISTANT[cle];
    if (v) niveaux.forEach((n, k) => {
      n.effets.vivant = { ...(v.niveaux[k] ?? v.niveaux.at(-1)) };
      if (v.eau) n.effets.consommation = { ...n.effets.consommation, eau: (Number(n.effets.consommation?.eau) || 0) + v.eau };
    });
    if (PLUIE_ARROSE.includes(cle)) for (const n of niveaux) n.effets.pluieArrose = true;
  }
  return installations;
}

// ---------------------------------------------------------------- Les installations nouvelles du vivant
export const INSTALLATIONS_VIVANT = [
  installation({ cle: "clapier", nom: "Clapier", categorie: "nourriture",
    description: `Des cases de planches et de grillage, à l'ombre, une litière de paille de canne : quelques lapins nourris d'herbe coupée. De la viande sans bruit, et du fumier pour le jardin.`,
    niveaux: [
      { cout: { materiaux: 3, nourriture: 1, travail: 4 }, effets: { production: { nourriture: 1 }, conditions: { delai: 45 }, consommation: { eau: 0.25 }, sol: 0.005,
        vivant: { espece: "lapin", places: 6, plein: 3, depart: 2 } } },
      { cout: { materiaux: 5, travail: 6 }, requiert: { savoirs: ["elevage"] }, effets: { production: { nourriture: 2 }, conditions: { delai: 45 }, consommation: { eau: 0.5 }, sol: 0.01,
        vivant: { espece: "lapin", places: 10, plein: 6 } } }
    ] }),
  installation({ cle: "soue-a-cochons", nom: "Soue à cochons", categorie: "nourriture",
    description: `Un muret de moellons, une auge, un toit de tôle sur la moitié : deux cochons qu'on engraisse aux épluchures et aux troncs de bananier. Ils ne donnent rien chaque jour, sinon le fumier ; un cochon abattu nourrit le camp dix jours. Il faut d'abord en trouver, ou en prendre un en liberté.`,
    niveaux: [
      { cout: { materiaux: 6, travail: 8 }, requiert: { savoirs: ["elevage"] }, effets: { consommation: { eau: 0.5 }, bruit: 1, odeur: 1, sol: 0.02,
        vivant: { espece: "cochon", places: 4, plein: 2, depart: 0 } } }
    ] }),
  installation({ cle: "etable", arbre: "lontan", nom: "Étable", categorie: "nourriture",
    description: `Un abri de troncs et de gaulettes couvert de chaume, un enclos de pieux autour d'un coin d'herbe : deux bœufs moka, qu'il faut trouver dans les Hauts et mener à la corde. Du lait chaque jour, du fumier, la traction d'une charrette ; ce ne sont pas des montures.`,
    niveaux: [
      { cout: { ile: 6, materiaux: 2, travail: 16 }, requiert: { savoirs: ["elevage"], site: { sol: 1 } }, effets: { production: { nourriture: 1 }, conditions: { delai: 30 },
        consommation: { eau: 1 }, bruit: 1, odeur: 1, sol: 0.02, vivant: { espece: "boeuf-moka", places: 2, plein: 2, depart: 0 } } }
    ] }),
  installation({ cle: "bassin-a-camarons", arbre: "lontan", nom: "Bassin à camarons", categorie: "nourriture",
    description: `Un bassin de galets au bord de la rivière, où l'eau entre et sort par deux rigoles grillagées : des camarons dans les Bas, des anguilles plus haut, pris jeunes dans la ravine. L'eau qui court se renouvelle seule.`,
    niveaux: [
      { cout: { ile: 2, materiaux: 2, travail: 12 }, requiert: { site: { eau: ["riviere", "source"] } }, effets: { production: { nourriture: 1 }, conditions: { delai: 90 },
        vivant: { especes: ["camaron", "anguille"], places: 20, plein: 12, depart: 8 } } }
    ] }),
  installation({ cle: "aquaponie", arbre: "moderne", nom: "Aquaponie", categorie: "nourriture",
    description: `Un bassin à tilapias relié à des bacs de brèdes par une petite pompe : les poissons nourrissent les plantes, les plantes filtrent l'eau des poissons. Le filtre tient un mois ; il faut deux fois moins d'eau qu'un potager. Mais deux jours sans pompe tuent tout.`,
    niveaux: [
      { cout: { materiaux: 8, pieces: 4, travail: 18 }, requiert: { savoirs: ["elevage", "plomberie-filtration"], site: { soleil: 1 } },
        effets: { production: { nourriture: 3 }, conditions: { delai: 60 }, consommation: { eau: 0.5, energie: 1 },
          vivant: { espece: "tilapia", places: 40, plein: 30, depart: 15, filtre: 30, sansPompe: 2 } } }
    ] }),
  installation({ cle: "bacs-de-culture", arbre: "lontan", role: "hors-sol", nom: "Bacs de culture en bambou", categorie: "nourriture",
    description: `Des bambous fendus posés sur des tréteaux, remplis de galets, où courent une eau et le jus du compost : des brèdes, des salades, des piments sans un pouce de terre. Les bacs se bouchent en une douzaine de jours si personne ne les rince.`,
    niveaux: [
      { cout: { ile: 3, graines: 1, travail: 4 }, requiert: { site: { soleil: 1 }, installations: [{ cle: "compost", niveau: 1 }] },
        effets: { production: { nourriture: 1 }, conditions: { delai: 12 }, consommation: { eau: 1 },
          vivant: { espece: "plants-hors-sol", places: 12, plein: 12, depart: 12, filtre: 12 } } }
    ] }),
  installation({ cle: "serre-hydroponique", arbre: "moderne", role: "hors-sol", nom: "Serre hors-sol", categorie: "nourriture",
    description: `Des rampes de tuyaux sous une serre, une pompe, un fût de solution nourricière : soixante plants qui poussent vite et tombent rarement malades, tant que le courant tient et qu'on change le filtre chaque semaine. La serre brille au soleil.`,
    niveaux: [
      { cout: { materiaux: 10, pieces: 4, graines: 2, travail: 16 }, requiert: { savoirs: ["maraichage-tropical", "plomberie-filtration"], site: { soleil: 1 }, installations: [{ cle: "compost", niveau: 1 }] },
        effets: { production: { nourriture: 4 }, conditions: { delai: 20 }, consommation: { eau: 2, energie: 1 }, visibilite: 2,
          vivant: { espece: "plants-hors-sol", places: 60, plein: 60, depart: 60, filtre: 8, maladie: 0.34 } } }
    ] }),
  installation({ cle: "jardin-de-zerbaz", arbre: "lontan", nom: "Jardin de zerbaz", categorie: "nourriture",
    description: `Le carré de plantes à tisane au fond de la cour : ayapana, citronnelle, géranium, et celles que seuls les anciens savent nommer. Une brassée par jour, une fois qu'il a pris.`,
    niveaux: [
      { cout: { ile: 2, graines: 2, travail: 6 }, requiert: { savoirs: ["zerbaz"], site: { sol: 1 } }, effets: { production: { plantes: 1 }, conditions: { delai: 30 },
        consommation: { eau: 1 }, pluieArrose: true } }
    ] }),
  installation({ cle: "treille-a-chouchou", arbre: "lontan", nom: "Treille à chouchou", categorie: "nourriture",
    description: `Une treille de bambou où le chouchou grimpe et retombe : on mange le fruit, la racine et les brèdes. Elle cache aussi une cour sous ses feuilles.`,
    niveaux: [
      { cout: { ile: 3, graines: 1, travail: 4 }, requiert: { site: { sol: 1 } }, effets: { production: { nourriture: 1 }, conditions: { delai: 90 },
        consommation: { eau: 1 }, pluieArrose: true } }
    ] }),
  installation({ cle: "bananeraie", arbre: "lontan", nom: "Bananeraie", categorie: "nourriture",
    description: `Quelques pieds de bananiers paillés, au bord de l'eau ou dans le mouillé : il faut presque une année avant le premier régime, puis chaque pied se remplace par ses rejets. Les troncs nourrissent les cochons.`,
    niveaux: [
      { cout: { ile: 2, graines: 2, travail: 6 }, requiert: { site: { sol: 1 }, installations: [{ cle: "compost", niveau: 1 }] }, effets: { production: { nourriture: 2 }, conditions: { delai: 300 },
        consommation: { eau: 1 }, pluieArrose: true } }
    ] }),
  installation({ cle: "carreau-de-canne", arbre: "lontan", nom: "Carreau de canne", categorie: "nourriture",
    description: `Des boutures de canne en rangs, sur une terre au soleil : il faut une année avant la première coupe, puis elle repousse seule. Du jus, du sucre, de quoi faire du rhum ou du vinaigre à l'alambic ; et la canne haute se voit de loin.`,
    niveaux: [
      { cout: { ile: 2, graines: 2, travail: 8 }, requiert: { site: { sol: 1, soleil: 1 } }, effets: { production: { nourriture: 1 }, conditions: { delai: 365 }, visibilite: 1 } }
    ] })
];
// Les bras (§10.3) : élevage pour les bêtes et les bassins, cultures pour le reste (même forme que installations.mjs).
export const BRAS_VIVANT = { clapier: "elevage", "soue-a-cochons": "elevage", etable: "elevage", "bassin-a-camarons": "elevage", aquaponie: "elevage",
  "bacs-de-culture": "cultures", "serre-hydroponique": "cultures", "jardin-de-zerbaz": "cultures", "treille-a-chouchou": "cultures", bananeraie: "cultures",
  "carreau-de-canne": "cultures" };
for (const i of INSTALLATIONS_VIVANT) for (const n of i.system.niveaux) {
  n.effets.bras = BRAS_VIVANT[i.system.cle] ? { tache: BRAS_VIVANT[i.system.cle], nombre: 1 } : null;
}

// ---------------------------------------------------------------- Les bêtes retournées sauvages (bestiaire, catégorie « bete »)
// Elles n'attaquent pas : elles fuient. On les prend (un test de survie avec l'outil de leur espèce) ou on les chasse (combat, tir).
// { cle, nom, categorie: "bete", espece, groupe: [min, max], zones, phases, poids, des, resistance, vitesse, sens, description,
//   comportement, faiblesse, acteur: false } (pas de jeton peint : le MJ prend celui d'une bête proche).
const bete = ({ cle, nom, espece, groupe, zones, phases = ["effondrement", "silence", "apres"], poids = 1, vitesse = "rapide", sens = "ouïe, odeur", description, comportement, faiblesse }) => ({
  cle, nom, categorie: "bete", espece, groupe, zones, phases, poids, des: 1, resistance: 1, vitesse, sens, acteur: false,
  description: html(description), comportement: html(comportement), faiblesse: html(faiblesse), competences: {} });
export const BETES_SAUVAGES = [
  bete({ cle: "poule-marronne", nom: "Poule marronne", espece: "poule", groupe: [3, 7], zones: ["littoral", "hauts", "foret", "cirque"], poids: 3,
    description: `Les poules des cours abandonnées vivent maintenant dans la canne et les bords de route, un coq devant, qui chante encore trop tôt.`,
    comportement: `Elles grattent, picorent, s'envolent d'un coup quand on court vers elles. Le soir, elles se perchent dans le même manguier.`,
    faiblesse: `Le soir, sur leur perchoir, elles ne bougent plus : un sac de goni, une main tranquille.` }),
  bete({ cle: "lapin-sauvage", nom: "Lapins", espece: "lapin", groupe: [2, 5], zones: ["hauts", "littoral", "cirque"], poids: 2,
    description: `Des lapins échappés des clapiers, qui ont fait des petits dans les talus des cultures et les landes des Hauts.`,
    comportement: `Ils sortent à l'aube et au soir ; au moindre pas, ils disparaissent dans le talus.`,
    faiblesse: `Ils reviennent toujours au même trou : une cage à l'entrée, et de la patience.` }),
  bete({ cle: "cabri-marron", nom: "Cabris marrons", espece: "cabri", groupe: [3, 6], zones: ["cirque", "hauts", "volcan", "foret"], poids: 2,
    description: `Des cabris partis des enclos, qui vivent dans les éboulis, les remparts et les forêts sèches, là où personne ne monte.`,
    comportement: `Ils regardent venir de loin, sautent d'un rocher à l'autre, et vont boire à la même vasque chaque soir.`,
    faiblesse: `La vasque du soir : une corde, quelqu'un qui attend sans bouger.` }),
  bete({ cle: "boeuf-moka-sauvage", nom: "Bœufs moka", espece: "boeuf-moka", groupe: [2, 4], zones: ["hauts", "volcan"], poids: 1, vitesse: "marche",
    description: `Des bœufs moka des fermes de la Plaine des Cafres, lâchés le jour zéro : ils paissent les pâturages et les landes, un tiers de veaux, un vieux taureau devant.`,
    comportement: `Lents, méfiants ; ils ne fuient qu'au dernier moment, et loin. Un taureau qu'on serre de trop près peut charger.`,
    faiblesse: `Le sel, et la voix calme de quelqu'un qui a déjà mené des bêtes : avec l'élevage, on les approche.` })
];
// Le cochon marron du bestiaire est aussi une espèce qu'on peut prendre (il charge quand on le surprend : un test raté peut finir en
// combat, au MJ). completerBestiaire lui donne son espèce, sans rien changer d'autre.
export function completerBestiaire(bestiaire = []) {
  for (const b of bestiaire) if (b.cle === "cochon-marron") Object.assign(b, { espece: "cochon", groupe: [2, 5] });
  return bestiaire;
}

// ---------------------------------------------------------------- Les outils de capture
// Fusion de la vague 3 : une seule fiche par outil pour les lots 5, 6 et 8, celle du lot 6 (contenu/ateliers.mjs : cage de bambou,
// sac de goni, enfumoir), et une seule recette, celle du lot 6 (contenu/recettes-3d.mjs) ; la corde est la corde de choka. Ce que
// prend chaque outil (registre et compendium : equipements[].capture) est dit ici, par espèce ; une bête trouvée en fouillant sous
// un alias (le porcelet, le veau moka) est prise par l'outil de son espèce.
export const CAPTURE_DES_EQUIPEMENTS = { "cage-de-bambou": ["poule", "lapin"], "sac-de-goni": ["poule", "lapin", "cochon"], enfumoir: ["essaim"],
  "cordes-de-choka": ["cabri", "cochon", "boeuf-moka"], "collets-et-nasses": ["tilapia", "camaron", "anguille"] };
export function captureDesEquipements(equipements = []) {
  for (const q of equipements) if (CAPTURE_DES_EQUIPEMENTS[q.cle]) q.capture = [...CAPTURE_DES_EQUIPEMENTS[q.cle]];
  return equipements;
}
// Les documents d'équipement (compendium) reçoivent le même champ, posé sur place (les documents restent ceux qu'exportent les autres
// fichiers).
export function documentsAvecCapture(docs = []) {
  for (const d of docs) if (CAPTURE_DES_EQUIPEMENTS[d.system?.cle]) d.system.capture = [...CAPTURE_DES_EQUIPEMENTS[d.system.cle]];
  return docs;
}

// ---------------------------------------------------------------- Tables
const T = (cle, nom, description, resultats) => {
  const t = table({ cle, nom, description, resultats });
  Object.assign(t.flags[MODULE], { vivant: cle });
  return t;
};
export const TABLES_VIVANT = [
  T("betes-de-l-ile-littoral", "Les bêtes de l'île — le littoral", `Ce qu'on croise en battant les cultures, la canne et les écarts des Bas. Une bête en liberté se prend (test de survie avec l'outil de son espèce : cage, sac de goni, corde) ou se chasse ; ratée, elle file, et les autres avec.`, [
    "Rien, sinon des traces de pattes dans la boue d'un chemin de canne.",
    "Une poule marronne et ses poussins, au bord d'un champ de canne (une poule, trois poussins qui suivront la mère).",
    "Cinq poules et un coq dans le manguier d'une cour vide, au crépuscule : elles se perchent.",
    "Deux lapins dans un talus de cultures, au petit matin.",
    "Un essaim pendu sous l'auvent d'une case abandonnée, gros comme un ballon (il faut un enfumoir).",
    "Un chien errant qui suit les poules, lui aussi. Il vous regarde, et ne part pas."
  ]),
  T("betes-de-l-ile-hauts", "Les bêtes de l'île — les Hauts", `Ce qu'on croise dans les pâturages, les landes et les fermes des Hauts.`, [
    "Rien : le brouillard monte, on n'y voit plus à vingt pas.",
    "Trois bœufs moka et un veau dans une prairie de la Plaine des Cafres, un vieux taureau devant (une corde, et de la patience).",
    "Une bande de lapins dans une lande à ajoncs, au soir.",
    "Quatre cabris sur un muret de pierres sèches ; ils vous regardent passer.",
    "Une ferme vide : la porte de l'étable bat, une vache maigre meugle dans l'enclos (un bœuf moka qu'on peut mener).",
    "Des poules marronnes dans les cryptomérias d'un ancien élevage."
  ]),
  T("betes-de-l-ile-cirque", "Les bêtes de l'île — les cirques", `Ce qu'on croise dans les îlets, les éboulis et les sentiers des cirques.`, [
    "Rien : le sentier, la ravine, le bruit de l'eau.",
    "Six cabris marrons dans un éboulis ; ils boivent chaque soir à la même vasque.",
    "Les poules d'un îlet vide, qui vivent maintenant dans les goyaviers.",
    "Un essaim dans le tronc creux d'un tamarin.",
    "Des camarons dans une vasque profonde de la ravine (une nasse : de quoi peupler un bassin).",
    "Deux cochons marrons qui retournent un vieux champ de songes (ils chargent si on les surprend)."
  ]),
  T("betes-de-l-ile-foret", "Les bêtes de l'île — les forêts", `Ce qu'on croise dans les forêts des Bas et des Hauts, les ravines.`, [
    "Rien que des tangues dans les feuilles, et un papangue au-dessus.",
    "Trois cochons marrons dans une ravine (ils chargent quand on les surprend ; un piège ou une fosse suffit).",
    "Un essaim dans une souche, qui bourdonne fort au soleil.",
    "Des cabris marrons sur une crête, à l'aube.",
    "Des anguilles dans un bassin de la rivière, sous les racines.",
    "Des poules marronnes autour d'un ancien boucan."
  ]),
  T("betes-de-l-ile-volcan", "Les bêtes de l'île — le volcan", `Ce qu'on croise dans les landes et les pâturages du volcan. Peu de choses.`, [
    "Rien : le vent, la scorie, les nuages qui passent au ras du sol.",
    "Deux bœufs moka égarés dans la lande, très maigres.",
    "Trois cabris marrons dans les remparts.",
    "Rien, sinon une carcasse de bœuf, ancienne : d'autres sont passés avant vous.",
    "Un essaim dans un mur de pierres sèches d'une ancienne bergerie.",
    "Des traces de cabris jusqu'à une vasque d'eau de pluie."
  ]),
  T("cheptel-ce-qui-arrive", "Un cheptel — ce qui arrive", `Pour donner de la vie à l'élevage, une fois de temps en temps, ou quand un cheptel a eu un manque.`, [
    "Un cabri s'est échappé par un trou de la clôture ; on le retrouve au matin dans le potager des voisins (ou dans le vôtre).",
    "Une poule couve dans un coin où personne ne l'attendait : des poussins dans trois semaines.",
    "Un chien errant tourne la nuit autour de la basse-cour. Le lendemain, il revient.",
    "Une bête boite : une épine, une pierre ; un soin d'une heure, et elle remarche.",
    "Le coq chante trop tôt, trop fort. Quelqu'un propose d'en faire un cari.",
    "Une scolopendre dans la paille du clapier : un lapin en meurt.",
    "L'eau du bassin a verdi en une nuit de chaleur : il faut curer avant que les poissons ne remontent respirer.",
    "Un enfant du groupe a donné un nom à chaque bête. Personne n'ose plus parler d'abattre.",
    "Des voisins viennent proposer un troc : un cabri contre des médicaments.",
    "La nuit, les bêtes se taisent toutes d'un coup, et se serrent dans le fond de l'enclos. Le chien grogne vers la ravine."
  ])
];

// ---------------------------------------------------------------- Le journal du MJ
const PAGES_MJ = [
  { cle: "principe", titre: "Ce qui vit à l'abri", texte: `Un abri qui veut tenir longtemps finit par élever et cultiver : des poules, des cabris, un bassin, des bacs de brèdes. **Rien de tout cela ne marche seul.** Les bêtes boivent, mangent, tombent malades, crient quand elles ont faim ; les bassins verdissent ; les filtres se bouchent. À plusieurs, on tient ; seul, on choisit ce qu'on laisse tomber.

Le système suit chaque **cheptel** (ou chaque bac de plants) pour vous : ses **têtes**, ses **places**, sa **santé** de 0 à 3. Vous racontez ; il compte.

**À part les chiens, les animaux s'élèvent, ils ne s'apprivoisent pas.** Ce ne sont pas des montures : la charrette à bœufs reste une charrette, menée à pied.` },
  { cle: "regle", titre: "Une seule règle pour tout ce qui vit", texte: `Chaque jour, chaque **manque** ôte **1 de santé** au cheptel :

- **la soif** : l'installation n'a pas eu son eau (les personnes boivent d'abord) ;
- **la faim** : les poules, les cochons et les poissons vivent des **restes** du groupe (un jour où personne n'a mangé, ou où personne n'était là, ils ont faim) ; les cabris, les lapins et les bœufs broutent (**l'herbe** : sur un site sans terre, il faut quelqu'un à l'élevage pour en couper ailleurs) ; les plants hors-sol boivent la **solution** du compost (sans compost en service, ils ont faim) ;
- **la panne** : l'installation est hors service, ou n'a plus de courant ;
- **l'eau sale** : un bassin à curer, un filtre à changer, passé son temps (personne à la tâche pour le faire) ;
- **l'ombre** : des plants sans soleil ;
- **la surpopulation** : plus de têtes que de places.

Un jour **sans aucun mal** rend 1 de santé. **Malade**, le cheptel perd 1 de santé tous les deux jours. **À 0**, un tiers du cheptel meurt chaque jour (au moins une bête).

**La production** : celle de l'installation, si le cheptel est au **plein** (le nombre de têtes qu'il lui faut) et en santé (2 ou 3) ; à 1 de santé, la moitié ; à 0, rien. Avec moitié moins de têtes que le plein, moitié moins. Un enclos vide ne boit ni ne mange.

**Les naissances** : un cheptel en santé (2 ou 3), qui a de la place et au moins deux bêtes, grandit chaque jour selon son espèce (une poule tous les douze jours par couple, un lapin tous les dix, un cabri tous les cinquante, un veau en huit mois). **Hors de son altitude** (un tilapia au-dessus de 900 m, un camaron au-dessus de 500), un cheptel donne moitié moins et ne fait pas de petits.

**La maladie** prend un cheptel 1 à 3 fois sur 100 par jour dans un abri insalubre, quatre fois moins dans un abri propre (l'hygiène de l'abri, journal « Le corps, le sommeil et l'hygiène »). Elle passe seule une fois sur dix par jour ; **soignée** (une tisane de zerbaz pour les bêtes, l'eau changée pour les poissons, de la lessive de cendre pour les plants, et un test de survie), elle cesse.

**Qui est à la tâche** fait le soin de tous les jours : à l'élevage, on cure les bassins et on coupe l'herbe ; aux cultures, on rince les bacs et on resème (une graine pour six plants, un semis par jour).` },
  { cle: "installations", titre: "Les installations du vivant", texte: `Ce que chacune loge (ses places, et le plein qu'il lui faut pour donner sa production) et ce qu'elle donne :

- **Basse-cour** : des poules (6 places, plein à 4 ; puis 12 et 8) ; des œufs chaque jour (une ration vaut quatre œufs), elle boit un peu.
- **Clapier** : des lapins (6 et 3 ; puis 10 et 6) ; de la viande sans bruit.
- **Enclos à cabris** : des cabris (4 et 2 ; puis 6 et 4) ; du lait, des chevreaux, du fumier.
- **Soue à cochons** : deux cochons, quatre places ; rien chaque jour, du fumier ; on l'engraisse aux restes, et un cochon abattu nourrit le camp dix jours. Il faut d'abord en trouver, ou en prendre un en liberté.
- **Étable** : deux bœufs moka, qu'il faut trouver dans les Hauts ; du lait et du fumier ; la traction d'une charrette.
- **Bassin à tilapias** : 30 places, plein à 20 (puis 40 et 30) ; à curer tous les 20 jours (tous les 8 avec la pompe).
- **Bassin à camarons** : au bord de la rivière ; des camarons dans les Bas, des anguilles plus haut ; l'eau qui court se renouvelle seule.
- **Aquaponie** : des tilapias et des brèdes ensemble ; deux fois moins d'eau qu'un potager, un filtre qui tient trente jours ; **deux jours sans pompe tuent tout**.
- **Bacs de culture en bambou** (lontan) et **serre hors-sol** (moderne, cinq fois plus de plants, rarement malade) : des plants sans terre, nourris par le compost, à rincer.
- **Ruches** : un essaim.
- **Jardin de zerbaz** : une brassée de plantes par jour, une fois qu'il a pris (trente jours).
- **Treille à chouchou**, **bananeraie** (300 jours avant le premier régime), **carreau de canne** (une année) : ce qui pousse longtemps, et dure.

**L'eau** : tout ce qui boit prend sa part après les personnes (potager, serre, étable, bassins, bacs, enclos). **La pluie arrose** ce qui pousse à ciel ouvert (potager, jardin créole, verger, treille, bananeraie, jardin de zerbaz) : un jour de pluie, ils ne prennent pas d'eau.

**Une installation qu'on vient d'achever** commence avec un petit cheptel (trois poules, deux cabris, deux lapins, une poignée d'alevins, un essaim) ; la soue et l'étable commencent vides. Celles qu'on trouve sur un site sont pleines.` },
  { cle: "produits", titre: "Ce qu'on en tire", texte: `La **production** de chaque jour (œufs, lait, poissons, brèdes) va aux stocks, comme celle d'un potager.

**La viande demande d'abattre une bête**, et le troupeau baisse : une poule ou un lapin, 1 ration ; un cabri, 6 ; un cochon, 10 ; un bœuf moka, 20 ; quatre tilapias, deux camarons ou deux anguilles, 1. Abattre au-dessus du plein ne coûte rien à la production ; en dessous, si. La viande se gâte comme le reste sans réserve étanche ni séchoir.

**Le fumier** enrichit le sol (le potager donne plus), et le **lait** fait partie de la production des cabris et des bœufs. La **peau** se tanne : des sangles, une bretelle de sac, à raconter.

**Pour le MJ** : abattre({ installation, n }) met la viande aux stocks ; peupler({ installation, n }) ajoute des bêtes (données, troquées) ou sème des plants (une graine pour six) ; cheptels() dit tout.` },
  { cle: "trouver", titre: "Trouver des bêtes", texte: `Un élevage se peuple de deux façons : **en liberté** (les bêtes retournées sauvages) et **en fouillant** (un poulailler abandonné, un essaim dans un mur). Rare et précieux : un abri qui veut un élevage doit le chercher, souvent à plusieurs.

**Les bêtes en liberté** n'attaquent pas : poules marronnes, lapins, cabris marrons, bœufs moka, et les cochons marrons (qui, eux, chargent quand on les surprend). Tirez la table « Les bêtes de l'île » de la zone, ou beteSauvage().

- **La prendre** : il faut l'**outil** de son espèce en main (une **cage de bambou** ou un **sac de goni** pour une poule ou un lapin ; une **corde** pour un cabri, un bœuf, un cochon ; un **enfumoir** pour un essaim ; une **nasse** pour des alevins ou des camarons), et un test de **survie**, facile pour une poule, normale pour le reste (+1 dé avec l'élevage). **Ratée, la bête file, et les autres avec.** Sans l'outil, elle file aussi. Un essaim sans enfumoir pique (une blessure) et reste.
- **La chasser** : combat ou tir, normale (difficile si elle fuit déjà) ; abattue, sa viande. Un tir s'entend.
- **La ramener** : une bête prise tient hors d'un enclos une journée (poule, lapin), un jour et demi (cabri), deux jours (bœuf), une demi-journée (essaim, poissons) ; passé ce temps, elle meurt (sa viande se mange encore). Le système la compte dans ce que porte le groupe ; à l'abri, mettreEnEnclos() la met dans l'enclos de son espèce.

**Pour le MJ** : capturer({ acteurId, espece, n }), chasser({ acteurId, espece, competence, fuit }), recevoirBete({ espece, n, source }) (une bête donnée, troquée, trouvée en fouillant), lacherBetes().` },
  { cle: "attirer", titre: "Le bruit, l'odeur et les Livides", texte: `**L'élevage attire.** La basse-cour, l'enclos, la soue et l'étable sentent (l'odeur de l'abri, journal « Percevoir dans le noir ») ; la basse-cour, la soue et l'étable s'entendent. **Un cheptel qui a faim ou soif crie** : +1 au bruit de l'abri (+2 au plus), qui fait venir les hordes.

**Un Livide resté près d'un enclos tue une bête par tour.** Dans un assaut contre l'abri, une défense qui cède d'un rien (marge −1) coûte une bête ; une brèche en coûte autant que la force de la menace (une bande, elle, les emporte). Le système les retire.

**Les bêtes sentent avant vous.** La nuit, quand elles se taisent toutes d'un coup et se serrent au fond de l'enclos, c'est que quelque chose passe.` },
  { cle: "chien", titre: "Le chien qui prévient sans attirer", texte: `Le chien du groupe (gagné patiemment, à la veillée, ou né d'une portée de l'élevage) **prévient sans attirer** : quand un Livide approche, il tourne autour de son maître, agité ; si le maître le suit, il le **mène** vers l'endroit d'où vient le danger et s'arrête à bonne distance (une quinzaine de mètres). Il **grogne** tout bas, un son qui ne porte pas. Il **n'aboie** que pour un Livide tout près (moins de 5 m) : là, ça s'entend.

- Il **flaire** un Livide à une quarantaine de mètres de jour, une vingtaine la nuit.
- **La garde** (à l'abri, au bivouac, en marche) gagne **+1 dé de vigilance** par lui, sans aucun bruit, en plus d'une tour de guet (au plus +2).
- À l'abri, quand une horde ou des Livides viennent, il grogne vers eux : le groupe le sait (une alerte), pas ce que c'est.
- Un chien gagné ne fuit plus les Livides. Il se bat si on le lâche, et peut y rester.
- Il s'agite aussi avant le cyclone et le volcan.

**Pour le MJ** : flairDuChien({ distance, nuit, suit }) vous dit ce qu'il fait ; un aboiement ajoute 2 au bruit de la scène.` },
  { cle: "pour-le-mj", titre: "Pour le MJ", texte: `- **cheptels()** : chaque cheptel (têtes, places, plein, santé, malade, manques, filtre), les bêtes que porte le groupe et le temps qu'il leur reste, le chien, les outils de capture du groupe.
- **peupler**, **mettreEnEnclos**, **abattre**, **soignerCheptel** (un quart, le remède de l'espèce, un test de survie), **curer** (un quart).
- **capturer**, **chasser**, **recevoirBete**, **lacherBetes**, **beteSauvage** (une rencontre tirée, pour vous).
- **flairDuChien** : ce que fait le chien devant un Livide.
- Au journal : les naissances, la soif, les morts, la maladie (à l'abri ; loin de l'abri, au journal secret). La table « Un cheptel — ce qui arrive » donne de la vie à l'élevage.

**Le ton** : un élevage, c'est des noms qu'on donne aux bêtes, un enfant qui pleure le jour du cari, des voisins qui proposent un troc. Pas de détail complaisant quand une bête meurt ; on dit ce qu'on fait du corps.` }
];
export const JOURNAL_VIVANT = journal({ cle: "le-vivant", nom: "Le vivant de l'abri", pack: "mj", pages: PAGES_MJ });

// ---------------------------------------------------------------- Une page du guide du joueur
export const PAGES_JOUEUR_VIVANT = [
  { cle: "le-vivant", titre: "Élever, cultiver, prendre une bête", texte: `Ce qui vit à l'abri demande du soin, tous les jours.

- **Les bêtes boivent et mangent.** Les poules, les cochons et les poissons vivent de vos restes ; les cabris, les lapins et les bœufs broutent. Un jour de soif ou de faim, elles s'affaiblissent, et elles crient (ça s'entend de loin). Trop affaiblies, elles meurent.
- **En santé, elles font des petits**, tant qu'il y a de la place. Un enclos qu'on vient de bâtir commence avec quelques bêtes ; il faut du temps, ou en trouver d'autres, pour qu'il donne à plein.
- **Les bassins et les bacs** se curent et se rincent : quelqu'un à l'élevage ou aux cultures s'en occupe chaque jour.
- **Une bête malade** se soigne : une tisane de zerbaz, de l'eau changée pour les poissons.
- **La viande**, il faut abattre. Le troupeau baisse.
- **La pluie arrose** le potager et le jardin : un jour de pluie, ils ne prennent pas d'eau.
- **Les bêtes en liberté** fuient : on les prend avec le bon outil (une cage, un sac de goni, une corde, un enfumoir) et un peu d'adresse ; ratée, elle file avec les autres. Une bête prise tient un jour ou deux hors d'un enclos.
- **Le chien du groupe prévient sans attirer** : il tourne autour de vous, grogne bas, vous mène vers ce qui vient, et n'aboie que quand c'est tout près. Avec lui, la garde voit venir.` }
];
