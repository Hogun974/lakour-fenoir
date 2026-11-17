// Les plans (lot 4 du portage du jeu 3D, famille 7 « Les plans » ; contrat §21 ; chiffres : docs/equilibre-plans.md). Ici, le contenu :
// le registre des plans (rareté, lieux où ils se trouvent, plans uniques), les lieux à plans (gardés, ouverts à certains moments), les
// plans propres à certains sites (« le plan se trouve là où le savoir vivait »), l'étagère aux cahiers, les papiers (une copie, deux
// plans uniques), une table par lieu à plans et deux tables d'ambiance, le journal du MJ « Les plans » et une page du guide du joueur.
// La règle est dans le système (logique/plans.mjs). Décision de Jordan du 2026-11-17 : un plan reste un RABAIS, aucune installation
// ni aucune recette ne l'exige.
import { installation, equipement, journal, table, MODULE } from "./aides.mjs";
import { INSTALLATIONS } from "./installations.mjs";
import { RECETTES } from "./recettes.mjs";
import { REGIONS, SITES } from "./monde.mjs";
import { BESTIAIRE } from "./bestiaire.mjs";

// ---------------------------------------------------------------- L'étagère aux cahiers (installation) et les papiers (équipements)
export const INSTALLATIONS_PLANS = [
  installation({ cle: "etagere-aux-cahiers", nom: "Étagère aux cahiers", categorie: "stockage",
    description: `Deux planches contre le mur le plus sec, une caisse à munitions qui ferme, des sachets de riz vides pour garder les feuilles du jus de la case : c'est là qu'on range les plans recopiés, les cahiers et les carnets trouvés. Tout le monde peut y lire, tout le monde peut y apprendre. Une étagère, ça se vole, et ça brûle. Au second niveau, un coffre étanche caché sous le plancher : ni le feu, ni l'eau, et un voleur pressé n'y trouve presque rien.`,
    niveaux: [
      { cout: { materiaux: 2, travail: 3 }, effets: { bibliotheque: { places: 12, protege: false }, bras: null } },
      { cout: { materiaux: 4, pieces: 1, travail: 6 }, effets: { bibliotheque: { places: 24, protege: true }, bras: null } }
    ] })
];

export const EQUIPEMENTS_PLANS = [
  equipement({ cle: "copie-de-plan", nom: "Copie de plan", categorie: "livre", bonus: {}, charge: 0,
    description: `Quelques feuilles pliées en quatre : un schéma coté, la liste de ce qu'il faut, l'ordre des gestes, parfois une main qui a écrit « attention » dans la marge. Celui qui a le savoir-faire qu'il demande le lit et le note au carnet du groupe ; les autres le gardent pour plus tard, ou pour quelqu'un d'autre. Un plan connu fait bâtir avec un quart de matériaux en moins et la moitié du travail. Il se recopie, il se troque.` }),
  equipement({ cle: "carnet-du-fontainier", nom: "Carnet du fontainier", categorie: "livre", bonus: {}, charge: 0, enseigne: ["hydraulique-rurale"],
    description: `Un carnet à spirale gondolé par l'humidité, couvert d'une écriture serrée et de croquis à l'encre bleue : les sources des remparts, où l'eau dort sous la roche, la pente qu'il faut à une conduite de bambou pour ne jamais se boucher, la façon de cuveler un puits dans la terre rouge. Celui qui l'a tenu a passé quarante ans à amener l'eau dans les îlets. Il n'en existe qu'un ; il ne se recopie pas, il se lit à côté de celui qui le tient.` }),
  equipement({ cle: "cahier-de-l-electricien", nom: "Cahier de l'électricien de la centrale", categorie: "livre", bonus: {}, charge: 0, enseigne: ["electricite-solaire"],
    description: `Un registre cartonné de la salle des machines, avec, au dos des relevés de turbine, ce qu'un technicien a noté pour lui seul pendant vingt ans : comment faire tourner une petite turbine sur un filet d'eau, réparer un régulateur, ménager une batterie qui fatigue, câbler des panneaux sans tout griller. Il n'en existe qu'un ; il ne se recopie pas.` })
];
export const OBJET_COPIE = "copie-de-plan";

// ---------------------------------------------------------------- Le registre des plans
// Plans ordinaires : { cle, installation | recette, rarete: [min, max], lieux: [type de site] }. Un plan dont le minimum atteint 50
// est rare : il ne se trouve que là où le savoir vivait (les plans propres d'un site) et dans les lieux à plans.
// Plans uniques : { cle, unique, nom, description, rarete, couvre: [clé du carnet], objet (l'équipement), enseigne, lieux }.
const I = (cle, rarete, lieux = []) => ({ cle, installation: cle, rarete, lieux });
const R = (cle, rarete, lieux = []) => ({ cle: `recette-${cle}`, recette: cle, rarete, lieux });
export const PLANS_CONSTRUCTION = [
  // Défense
  I("palissade", [5, 20], ["commerce", "usine", "ferme"]),
  I("mur", [15, 35], ["usine", "caserne", "commerce"]),
  I("tour-de-guet", [10, 30], ["caserne", "ferme", "phare"]),
  I("fosse-et-pieges", [10, 30], ["ferme", "caserne"]),
  I("porte-blindee", [30, 55], ["commerce", "caserne", "immeuble"]),
  I("camouflage", [25, 50], ["caserne"]),
  I("palissade-de-bambou", [10, 30], ["case-creole", "ilet", "ferme"]),
  I("mur-de-pierres-seches", [25, 50], ["ilet", "ferme", "gite"]),
  // Eau
  I("citerne-de-pluie", [5, 25], ["case-creole", "maison", "ferme", "commerce"]),
  I("filtre-sable-charbon", [10, 30], ["ecole", "hopital", "commerce", "gite"]),
  I("bouilleur-solaire", [15, 35], ["ecole", "gite"]),
  I("captage-de-source", [35, 60], ["ilet", "ferme", "gite"]),
  I("pompe-manuelle", [20, 40], ["ferme", "commerce", "usine"]),
  I("citerne-lontan", [15, 35], ["case-creole", "ilet"]),
  I("conduite-de-bambou", [30, 55], ["ilet"]),
  I("puits-a-balancier", [30, 55], ["ilet", "case-creole", "ferme"]),
  // Nourriture
  I("potager", [5, 20], ["case-creole", "maison", "ferme", "ecole"]),
  I("serre", [30, 55], ["ferme", "ecole"]),
  I("verger", [10, 30], ["ferme", "case-creole"]),
  I("basse-cour", [5, 20], ["case-creole", "ferme"]),
  I("enclos-a-cabris", [10, 25], ["ferme", "ilet"]),
  I("bassin-a-tilapias", [50, 75]),
  I("ruches", [25, 50], ["ferme", "case-creole"]),
  I("compost", [5, 15], ["ferme", "ecole", "case-creole", "maison"]),
  I("jardin-creole", [15, 35], ["case-creole", "ilet"]),
  // Énergie
  I("panneaux-solaires", [30, 55], ["commerce", "ecole", "immeuble", "usine"]),
  I("batteries", [35, 60], ["commerce", "usine", "port"]),
  I("pico-hydro", [65, 90]),
  I("eolienne", [50, 75]),
  // Stockage, vie, communication, souterrain
  I("sechoir-fumoir", [10, 30], ["ferme", "case-creole", "port"]),
  I("reserve-etanche", [25, 45], ["commerce", "usine"]),
  I("garde-manger-lontan", [15, 35], ["case-creole", "ilet"]),
  I("atelier", [20, 40], ["usine", "commerce"]),
  I("infirmerie", [35, 60], ["hopital", "caserne"]),
  I("dortoir", [5, 20], ["ecole", "caserne", "gite"]),
  I("cuisine-commune", [10, 35], ["case-creole", "ecole"]),
  I("eau-chaude-solaire", [30, 55], ["immeuble", "commerce", "maison"]),
  I("etagere-aux-cahiers", [10, 30], ["ecole", "eglise"]),
  I("poste-radio", [40, 65], ["caserne", "phare", "port"]),
  I("antenne", [60, 85]),
  I("galerie-souterraine", [55, 85]),
  I("tunnel-de-lave-amenage", [70, 95]),
  // Recettes
  R("arbalete", [30, 55], ["commerce", "caserne"]),
  R("filtre-de-poche", [20, 40], ["gite", "commerce"]),
  R("poele-de-masse", [30, 55], ["maison", "case-creole"]),
  R("chauffe-eau", [20, 45], ["maison", "immeuble"]),
  R("velo-cargo", [35, 60], ["commerce", "usine"]),
  R("panneaux-nomades", [45, 70], ["commerce", "gite"]),
  R("radio-de-poche", [40, 65], ["ecole", "caserne"]),
  R("munitions-rechargees", [45, 70], ["caserne", "commerce"]),
  R("alcool-desinfectant", [30, 55], ["hopital", "usine"]),
  R("conserves", [15, 35], ["ecole", "commerce", "ferme"]),
  R("semences", [20, 40], ["ferme"]),
  R("alcool-de-canne", [35, 60], ["usine", "ferme"]),
  R("huile-filtree", [40, 65], ["usine", "port"]),
  R("moteur-a-l-alcool", [60, 90]),
  R("gazogene", [65, 90]),
  // Les plans uniques : un seul exemplaire dans la partie.
  { cle: "cahier-de-tisanes-de-la-gramoune", unique: true, nom: "Cahier de tisanes d'une gramoune", rarete: [90, 100], objet: "cahier-de-gramoune",
    couvre: ["recette:tisanes", "recette:rimed-lontan"], enseigne: ["zerbaz"], lieux: ["case-creole"],
    description: `Un cahier d'écolier aux pages jaunies, retrouvé au fond d'une armoire de case : les tisanes d'une gramoune morte avant le jour zéro, avec ses mots à elle. Ayapana pour le ventre, citronnelle pour la fièvre, bois de quivi, faham, les doses comptées « en cuillères à café de mon fils ». Il n'en existe qu'un.` },
  { cle: "carnet-du-fontainier", unique: true, nom: "Carnet du fontainier", rarete: [85, 100], objet: "carnet-du-fontainier",
    couvre: ["captage-de-source", "conduite-de-bambou", "citerne-lontan", "puits-a-balancier"], enseigne: ["hydraulique-rurale"], lieux: [],
    description: `Le carnet d'un fontainier des îlets : quarante ans à amener l'eau là où les routes ne vont pas. Il n'en existe qu'un, et il ne se trouve qu'au bout des sentiers.` },
  { cle: "cahier-de-l-electricien", unique: true, nom: "Cahier de l'électricien de la centrale", rarete: [85, 100], objet: "cahier-de-l-electricien",
    couvre: ["pico-hydro", "batteries", "panneaux-solaires"], enseigne: ["electricite-solaire"], lieux: [],
    description: `Le registre d'un technicien de la salle des machines, et tout ce qu'il y a noté pour lui seul. Il n'en existe qu'un, et il est resté au fond de la gorge.` }
];

// ---------------------------------------------------------------- Le plan se trouve là où le savoir vivait : les plans propres d'un site
// (on les trouve même rares, en fouillant ce site, trois fois plus souvent que les autres).
export const PLANS_DES_SITES = {
  "centrale-de-langevin": ["pico-hydro", "batteries"],
  "centrale-de-la-riviere-de-l-est": ["pico-hydro"],
  "centrale-du-port-est": ["batteries", "panneaux-solaires"],
  "sucrerie-du-gol": ["recette-gazogene", "recette-alcool-de-canne"],
  "sucrerie-de-stella": ["sechoir-fumoir", "recette-alcool-de-canne"],
  "sucrerie-de-bois-rouge": ["recette-alcool-de-canne"],
  "alambic-du-tevelave": ["recette-alcool-desinfectant", "recette-alcool-de-canne"],
  "phare-de-bel-air": ["eolienne", "antenne"],
  "maison-forestiere-du-maido": ["verger", "captage-de-source"],
  "maison-forestiere-de-bebour": ["captage-de-source"],
  "caserne-de-la-montagne": ["infirmerie", "porte-blindee"],
  "quartier-de-pierrefonds": ["camouflage", "mur", "recette-munitions-rechargees"],
  "hopital-du-sud": ["infirmerie", "recette-alcool-desinfectant"],
  "ferme-de-la-plaine-des-cafres": ["enclos-a-cabris", "basse-cour", "compost"],
  "ferme-des-palmistes": ["serre", "bassin-a-tilapias"],
  "vanilleraie-de-saint-philippe": ["verger", "jardin-creole"],
  "ferme-de-grand-ilet": ["jardin-creole", "conduite-de-bambou"],
  "ferme-d-ilet-a-cordes": ["jardin-creole", "puits-a-balancier"],
  "ilet-de-marla": ["captage-de-source", "mur-de-pierres-seches"],
  "ilet-a-bourse": ["citerne-lontan", "puits-a-balancier"],
  "ilet-de-la-nouvelle": ["garde-manger-lontan", "palissade-de-bambou"],
  "ecole-d-aurere": ["etagere-aux-cahiers", "bouilleur-solaire"],
  "tunnel-du-grand-brule": ["tunnel-de-lave-amenage"],
  "grotte-du-rempart": ["galerie-souterraine"],
  "base-de-chantier-de-la-digue": ["mur", "atelier"],
  "thermes-de-cilaos": ["eau-chaude-solaire", "captage-de-source"],
  "gite-de-la-caverne-dufour": ["mur-de-pierres-seches"],
  "college-hauts-saint-paul": ["etagere-aux-cahiers", "filtre-sable-charbon"],
  "college-du-quatorzieme": ["serre"],
  "hangar-fret-gillot": ["recette-velo-cargo", "reserve-etanche"],
  "port-de-saint-gilles": ["recette-panneaux-nomades"],
  "marine-de-langevin": ["sechoir-fumoir"],
  "eglise-notre-dame-des-laves": ["etagere-aux-cahiers"],
  "case-de-hell-bourg": ["jardin-creole", "cuisine-commune"]
};

// ---------------------------------------------------------------- Les lieux à plans rares
// { cle, nom, region, site?, description, garde: { type: "milieu" | "livides", texte, test?: { competence, difficulte }, rencontre?: {
//   creature, nombre: [min, max] } }, fenetre: { saison?, lune?, apresCyclone?, horsEruption? }, fenetreTexte, tirage: [{ plan, poids }],
//   retour (jours avant d'y retrouver quelque chose) }
export const LIEUX_A_PLANS = [
  { cle: "salle-des-machines-de-takamaka", nom: "La salle des machines de Takamaka", region: "est", retour: 30,
    description: `Au fond de la gorge de la rivière des Marsouins, sous des remparts de six cents mètres qui ruissellent de cascades, la petite centrale de Takamaka : une salle des machines, des bureaux, des armoires de plans et de registres. On y descend par l'ancien escalier des techniciens, des centaines de marches mouillées, puis on longe l'eau. C'est l'endroit le plus humide de l'île ; c'est aussi là qu'on savait faire de la lumière avec une rivière.`,
    garde: { type: "milieu", texte: `La descente et la remontée (une demi-journée chacune, les jambes en feu), les marches couvertes de mousse, et surtout la rivière : il suffit d'une averse dans les Hauts pour qu'elle monte d'un mètre en une heure. Un test d'endurance difficile pour descendre ; sur un échec, une blessure (une glissade) ou une nuit de plus en bas. Si la pluie tombe là-haut pendant qu'on y est, la remontée devient une course.`,
      test: { competence: "endurance", difficulte: "difficile" } },
    fenetre: { saison: "seche" }, fenetreTexte: "en saison sèche, quand la rivière des Marsouins est basse",
    tirage: [{ plan: "pico-hydro", poids: 3 }, { plan: "batteries", poids: 2 }, { plan: "panneaux-solaires", poids: 1 }, { plan: "recette-panneaux-nomades", poids: 1 },
      { plan: "cahier-de-l-electricien", poids: 1 }] },
  { cle: "relais-des-cretes-du-maido", nom: "Le relais des crêtes du Maïdo", region: "hauts-de-l-ouest", retour: 30,
    description: `Au bout de la route du Maïdo, sur l'arête qui tombe à pic sur Mafate, des pylônes, des paraboles et des cabanes de béton pleines d'armoires : les relais qui portaient la radio, la télévision et les téléphones de l'Ouest. Il y a là des classeurs de schémas, des notices de maintenance, des manuels que personne n'a ouverts depuis des années.`,
    garde: { type: "milieu", texte: `La brume monte de Mafate vers midi et noie tout en un quart d'heure ; le rempart est à trois pas, sans garde-corps ; la nuit, il gèle presque. Un test de survie difficile pour s'y retrouver dans la brume et redescendre avant la nuit ; sur un échec, on passe la nuit là-haut (fatigue +2) ou l'on se perd vers le bord. Les Livides des Hauts, conservés par le froid, errent lentement autour des cabanes.`,
      test: { competence: "survie", difficulte: "difficile" }, rencontre: { creature: "livide-des-hauts", nombre: [2, 5] } },
    fenetre: { saison: "seche" }, fenetreTexte: "en saison sèche, les matins clairs où la brume tarde à monter",
    tirage: [{ plan: "antenne", poids: 3 }, { plan: "poste-radio", poids: 2 }, { plan: "eolienne", poids: 2 }, { plan: "recette-radio-de-poche", poids: 1 },
      { plan: "panneaux-solaires", poids: 1 }] },
  { cle: "ilet-de-roche-plate", nom: "L'îlet sans route de Roche-Plate", region: "mafate", retour: 45,
    description: `Au fond de Mafate, sous le Maïdo, un îlet où l'on ne vient qu'à pied par des sentiers à flanc de rempart. Ici, l'eau a toujours été une affaire de patience : captages dans la roche, conduites de bambou, bassins, un vieux fontainier qui savait tout. Les cases se taisent depuis le jour zéro ; dans l'une d'elles, il reste son carnet.`,
    garde: { type: "milieu", texte: `Trois heures de descente par le sentier de la Brèche, autant pour remonter, avec ce qu'on porte. Un test d'endurance difficile ; sur un échec, une cheville tordue (une blessure) ou une journée de plus. Dans les cases du haut, quelques Livides des Hauts, gardés par le froid depuis des mois, attendent sans bouger.`,
      test: { competence: "endurance", difficulte: "difficile" }, rencontre: { creature: "livide-des-hauts", nombre: [1, 4] } },
    fenetre: {}, fenetreTexte: "",
    tirage: [{ plan: "captage-de-source", poids: 3 }, { plan: "conduite-de-bambou", poids: 2 }, { plan: "mur-de-pierres-seches", poids: 2 }, { plan: "puits-a-balancier", poids: 1 },
      { plan: "carnet-du-fontainier", poids: 1 }] },
  { cle: "station-agronomique-de-bassin-plat", nom: "La station agronomique de Bassin-Plat", region: "saint-pierre", retour: 30,
    description: `Sur les pentes au-dessus de Saint-Pierre, une station de recherche agricole : des serres, des bassins d'essai, des vergers numérotés, une bibliothèque de fiches techniques et une banque de semences. Au jour zéro, on y a regroupé des malades des quartiers voisins, en quarantaine dans les logements du personnel. La quarantaine n'a pas tenu.`,
    garde: { type: "livides", texte: `Les anciens malades de la quarantaine errent entre les serres et les logements, une bonne douzaine, et le moindre bruit de verre les rassemble. On traverse à la nuit noire, sans lumière, de serre en serre : un test de discrétion difficile ; sur un échec, ils viennent tous.`,
      test: { competence: "discretion", difficulte: "difficile" }, rencontre: { creature: "livide-frais", nombre: [6, 12] } },
    fenetre: { lune: "nouvelle" }, fenetreTexte: "à la nouvelle lune, quand on traverse les serres sans être vu",
    tirage: [{ plan: "bassin-a-tilapias", poids: 3 }, { plan: "serre", poids: 2 }, { plan: "verger", poids: 2 }, { plan: "recette-semences", poids: 2 }, { plan: "ruches", poids: 1 }] },
  { cle: "distillerie-de-bois-rouge", nom: "Le laboratoire de la distillerie de Bois-Rouge", region: "est", site: "sucrerie-de-bois-rouge", retour: 30,
    description: `Derrière la sucrerie, la distillerie et son laboratoire : alambics, colonnes, cuves de mélasse, et dans un bureau vitré les dossiers des ingénieurs, comment tirer de l'alcool de la canne, comment faire tourner un moteur avec. Le jour zéro tombait en pleine fin de campagne sucrière ; les équipes de nuit ne sont jamais rentrées chez elles.`,
    garde: { type: "livides", texte: `Les ouvriers de la dernière campagne, des dizaines, entre les cuves et sous les colonnes, et parmi eux quelques coureurs qui n'ont rien perdu de leur vitesse. On ne s'y risque que par nuit noire, sans lumière : un test de discrétion difficile ; sur un échec, les coureurs d'abord, puis tous les autres.`,
      test: { competence: "discretion", difficulte: "difficile" }, rencontre: { creature: "coureur", nombre: [2, 4] } },
    fenetre: { lune: "nouvelle" }, fenetreTexte: "à la nouvelle lune, par nuit noire",
    tirage: [{ plan: "recette-moteur-a-l-alcool", poids: 3 }, { plan: "recette-alcool-de-canne", poids: 3 }, { plan: "recette-alcool-desinfectant", poids: 2 },
      { plan: "recette-gazogene", poids: 1 }, { plan: "reserve-etanche", poids: 1 }] },
  { cle: "tunnels-de-l-enclos", nom: "Les tunnels de lave de l'Enclos", region: "fournaise", retour: 40,
    description: `Dans l'Enclos du volcan, sous les coulées récentes, des tunnels de lave où les volcanologues avaient posé des instruments et où des spéléologues tenaient leurs carnets : comment on étaye une voûte de basalte, où l'air circule, comment on aménage une galerie qui ne s'effondre pas. Leur abri de toile est resté au fond, avec les cahiers.`,
    garde: { type: "milieu", texte: `Le noir complet, la roche coupante, les voûtes qui s'effritent, et parfois une poche d'air qui sent le soufre. Un test d'endurance difficile (ramper, porter la lumière, garder son calme) ; sur un échec, une blessure (une chute, une coupure) ou la panique qui fait rebrousser chemin. Jamais pendant une éruption.`,
      test: { competence: "endurance", difficulte: "difficile" } },
    fenetre: { horsEruption: 3 }, fenetreTexte: "entre deux coulées : jamais pendant une éruption, ni dans les trois jours qui suivent",
    tirage: [{ plan: "tunnel-de-lave-amenage", poids: 3 }, { plan: "galerie-souterraine", poids: 3 }, { plan: "reserve-etanche", poids: 1 }, { plan: "recette-filtre-de-poche", poids: 1 }] },
  { cle: "conteneurs-du-port-est", nom: "Les conteneurs éventrés du Port Est", region: "le-port", retour: 20,
    description: `Sur les quais du Port Est, des milliers de conteneurs en piles. La plupart sont fermés, plombés, trop lourds à ouvrir sans grue. Mais quand un cyclone passe, la houle et le vent en couchent des rangées entières sur le quai, et les portes s'ouvrent : du matériel neuf, avec ses notices et ses plans de montage.`,
    garde: { type: "livides", texte: `Les dockers et les marins de garde au jour zéro, et ceux que la mer a ramenés dans la darse : des noyés lents et gonflés qui sortent de l'eau quand on fait du bruit. Ouvrir une porte tordue est un test d'endurance normal, et chaque coup de barre à mine s'entend ; sur un échec, il faut forcer, et ils viennent.`,
      test: { competence: "endurance", difficulte: "normale" }, rencontre: { creature: "noye-du-lagon", nombre: [3, 8] } },
    fenetre: { apresCyclone: 7 }, fenetreTexte: "dans la semaine qui suit un cyclone, quand la houle a couché les piles",
    tirage: [{ plan: "eolienne", poids: 2 }, { plan: "panneaux-solaires", poids: 2 }, { plan: "batteries", poids: 2 }, { plan: "recette-panneaux-nomades", poids: 2 },
      { plan: "recette-velo-cargo", poids: 1 }] }
];

// ---------------------------------------------------------------- Noms
const nomInstallation = cle => INSTALLATIONS.find(i => i.system.cle === cle)?.name ?? INSTALLATIONS_PLANS.find(i => i.system.cle === cle)?.name ?? cle;
const nomRecette = cle => RECETTES.find(r => r.system.cle === cle)?.name ?? cle;
const nomCible = k => (k.startsWith("recette:") ? `${nomRecette(k.slice(8))} (recette)` : nomInstallation(k));
export const nomPlan = cle => {
  const p = PLANS_CONSTRUCTION.find(x => x.cle === cle);
  if (!p) return cle;
  if (p.unique) return p.nom;
  return p.installation ? nomInstallation(p.installation) : `${nomRecette(p.recette)} (recette)`;
};
const nomRegion = cle => REGIONS.find(r => r.cle === cle)?.nom ?? cle;
const nomSite = cle => SITES.find(s => s.cle === cle)?.nom ?? cle;
const nomCreature = cle => BESTIAIRE.find(b => b.cle === cle)?.nom ?? cle;
const rarete = p => `${p.rarete[0]} à ${p.rarete[1]}`;
// La valeur au troc à la rareté moyenne (même formule que logique/plans.mjs : 3 + 0,2 × rareté, × 3 pour un plan unique).
const valeur = p => Math.max(1, Math.round((3 + 0.2 * (p.rarete[0] + p.rarete[1]) / 2) * (p.unique ? 3 : 1)));
const NOMS_TYPES = { maison: "maisons", "case-creole": "cases créoles", immeuble: "immeubles", ecole: "écoles et collèges", commerce: "commerces et quincailleries",
  ferme: "fermes", gite: "gîtes", ilet: "îlets", caserne: "casernes", hopital: "hôpitaux", port: "ports", phare: "phares", "tunnel-de-lave": "tunnels de lave",
  galerie: "galeries", usine: "usines, hangars et garages", eglise: "églises", autre: "autres lieux" };

// ---------------------------------------------------------------- Tables : une par lieu à plans, et deux tables d'ambiance
const T = (cle, nom, description, resultats) => {
  const t = table({ cle, nom, description, resultats });
  Object.assign(t.flags[MODULE], { plans: cle });
  return t;
};
const ligneTirage = x => {
  const p = PLANS_CONSTRUCTION.find(y => y.cle === x.plan);
  return p?.unique ? `${p.nom} : le plan unique du lieu (une seule fois dans la partie). ${p.description}` : `Le plan : ${nomPlan(x.plan)} (rareté ${rarete(p)}).`;
};
const TABLES_LIEUX = LIEUX_A_PLANS.map(l => T(`plans-${l.cle}`, `Lieu à plans — ${l.nom}`,
  `Ce qu'on tire dans ce lieu à plans (${l.nom}, ${nomRegion(l.region)}), une fois la garde passée. Chaque ligne compte selon son poids. Le système tire lui-même (lieuAPlans) ; cette table sert au MJ qui joue sans l'API.`,
  l.tirage.flatMap(x => Array.from({ length: x.poids }, () => ligneTirage(x)))));

const A_QUOI = [
  "Une liasse de photocopies agrafées, tachées de café, les cotes reprises au feutre rouge par quelqu'un qui s'était trompé une fois.",
  "Le classeur d'un artisan, ses pochettes plastiques, et dans chacune un chantier fini : la photo, le croquis, la liste de ce qu'il avait acheté.",
  "Le carnet à spirale d'un maçon, plein de croquis à main levée et de calculs dans la marge, avec la date de chaque chantier.",
  "Un plan roulé dans un tube de carton, tamponné « bon pour exécution », que l'humidité a gondolé sans l'effacer.",
  "Une notice de montage en quatre langues, pliée en accordéon, à laquelle quelqu'un a ajouté au crayon tout ce qu'elle ne dit pas.",
  "Des pages arrachées à un manuel de lycée technique, retenues par une pince à linge, avec un nom d'élève sur la première.",
  "Un schéma au stylo bille sur le dos d'un calendrier de l'an passé, et en bas : « pour Jean-Max, si je suis pas là ».",
  "Un cahier d'écolier où une main d'enfant a recopié, au propre, ce que son grand-père lui dictait en montrant du doigt."
];
const CE_QUI_SE_RACONTE = [
  ...LIEUX_A_PLANS.map(l => `${l.nom} (${nomRegion(l.region)}) : « Paraît qu'il reste là-bas tout ce qu'il faut savoir, sur papier. » ${l.fenetreTexte ? `Ceux qui y sont allés disent qu'il faut y aller ${l.fenetreTexte}.` : "Ceux qui y sont allés disent que le chemin coûte plus que ce qu'on rapporte, sauf quand on rapporte le bon cahier."}`),
  "Un marchand jure qu'il a vu, sur un étal du marché, le carnet d'un fontainier de Mafate, et qu'on en voulait plus qu'un cabri.",
  "« Les plans, ça se garde au sec et ça se recopie deux fois. Celui qui a qu'un exemplaire en a zéro. » (Un vieux du Tampon, qui a perdu les siens dans un incendie.)",
  "Un groupe des Hauts échangerait, dit-on, une copie de n'importe quel plan contre des graines, à condition qu'on lui en apprenne un autre à la veillée."
];
export const TABLES_PLANS = [
  ...TABLES_LIEUX,
  T("plans-a-quoi-ca-ressemble", "Plans — à quoi ça ressemble",
    "Un plan trouvé, en fouillant ou dans un lieu à plans : ce que le groupe tient entre les mains.", A_QUOI),
  T("plans-ce-qui-se-raconte", "Plans — ce qui se raconte",
    "Ce qu'on entend sur les lieux à plans et sur le troc des plans, au marché, à la radio, à la veillée. Le MJ en fait courir un quand une fenêtre s'ouvre (journal secret : « La fenêtre s'ouvre »).", CE_QUI_SE_RACONTE)
];

// ---------------------------------------------------------------- Le journal du MJ « Les plans »
const ordinaires = PLANS_CONSTRUCTION.filter(p => !p.unique);
const rares = ordinaires.filter(p => p.rarete[0] >= 50);
const ligneSite = ([cle, plans]) => `- **${nomSite(cle)}** (${nomRegion(SITES.find(s => s.cle === cle)?.region)}) : ${plans.map(nomPlan).join(", ")}.`;
const ligneLieu = l => `### ${l.nom}

*${nomRegion(l.region)}${l.site ? `, ${nomSite(l.site)}` : ""}. ${l.garde.type === "milieu" ? "Gardé par l'île" : "Gardé par des Livides"}${l.fenetreTexte ? ` ; ouvert ${l.fenetreTexte}` : " ; toujours ouvert"}. On peut y revenir après ${l.retour} jours.*

${l.description}

**La garde.** ${l.garde.texte}${l.garde.rencontre ? ` (Rencontre : ${l.garde.rencontre.nombre[0]} à ${l.garde.rencontre.nombre[1]} × ${nomCreature(l.garde.rencontre.creature)}.)` : ""}

**Ce qu'on y tire** : ${l.tirage.map(x => `${nomPlan(x.plan)} (${x.poids})`).join(", ")}.`;

const PAGES_MJ = [
  { cle: "un-plan", titre: "Ce qu'est un plan", texte: `Un plan dit comment bâtir une installation ou fabriquer une recette : un schéma coté, la liste de ce qu'il faut, l'ordre des gestes. **Un plan connu fait bâtir avec un quart de matériaux en moins et la moitié du travail** (fabriquer aussi, pour une recette). C'est tout : **aucune installation, aucune recette n'exige un plan.** Un groupe qui n'en a aucun bâtit tout ce que ses savoirs lui permettent, au prix plein.

**Le carnet du groupe.** Ce que le groupe a déjà bâti une fois y entre de lui-même (comme avant : c'est la meilleure compétence qu'on emporte en déménageant). Un plan trouvé y entre quand quelqu'un du groupe sait le lire, c'est-à-dire a le savoir-faire qu'il demande (celui du premier niveau de l'installation, ou celui de la recette). Sinon on garde le papier, **pour plus tard ou pour un autre**. Le carnet ne se perd pas : c'est ce que le groupe sait, il suit le groupe partout, et chacun le garde quand un groupe se sépare.

**Ce que le groupe connaît**, et qui donne le rabais : son carnet ; ce qu'un de ses membres vivants sait **par cœur** ; les **plans uniques** qu'il a en main (un membre les porte, ou ils sont sur l'étagère aux cahiers de l'abri où le groupe se trouve).

**La rareté** (0 à 100) dit où un plan se trouve et ce qu'il vaut. Un plan dont le minimum atteint 50 est **rare** : il ne se trouve que là où le savoir vivait. Les plans rares de l'île : ${rares.map(p => nomPlan(p.cle)).join(", ")}.

**Fabriquer une recette ne l'inscrit pas au carnet** : seul un papier lu, un plan unique ou ce qu'on a appris par cœur donne le rabais d'une recette.` },
  { cle: "trouver", titre: "Trouver un plan", texte: `**La fouille « plans ».** On fouille un site en cherchant des plans (fenêtre du MJ, Actions, « Chercher : plans » ; ou fouiller({ cible: "plans" })). La chance dépend du type du site : commerces et quincailleries 25 %, usines, hangars et garages 25 %, écoles 20 %, casernes, phares et ports 15 %, hôpitaux et fermes 12 %, gîtes et îlets 10 %, cases et maisons 8 %, églises 5 % ; sans site, en fouillant la région, 4 %. Elle monte avec le monde qui cherche et le temps passé (jusqu'à deux fois plus), un peu en allant vite, un peu moins en restant discret, et ne dépasse jamais 60 %. Un plan déjà au carnet se trouve deux fois moins souvent : on en trouve alors une copie, qui se troque.

**Après un plan trouvé**, le site n'en rend plus pendant quelques jours (3 pour un commerce ou une usine, 4 pour une école, 5 pour une case).

**Où se trouve quoi.**
${Object.entries(Object.groupBy(ordinaires.filter(p => p.lieux.length), p => p.lieux[0])).map(([type, ps]) => `- Surtout dans les ${NOMS_TYPES[type]} : ${ps.map(p => nomPlan(p.cle)).join(", ")}.`).join("\n")}

**Le plan se trouve là où le savoir vivait.** Ces sites gardent leurs propres plans, même rares, et les rendent trois fois plus souvent :
${Object.entries(PLANS_DES_SITES).map(ligneSite).join("\n")}

**À quoi ça ressemble** : table « Plans — à quoi ça ressemble ».` },
  { cle: "lieux", titre: "Les lieux à plans", texte: `Les plans les plus rares dorment dans des lieux **gardés** : par l'île elle-même (une gorge, une crête, un tunnel), ou par des Livides plus nombreux et plus dangereux qu'ailleurs. Certains ne s'atteignent qu'à certains moments : en saison sèche, à la nouvelle lune, entre deux coulées, juste après un cyclone. Le système dit au journal secret quand une **fenêtre s'ouvre** ; à vous d'en faire courir le bruit (table « Plans — ce qui se raconte »).

**Comment on joue.** Le groupe s'y rend (il doit être dans la région du lieu). Vous jouez la **garde** : le test qu'elle demande, la rencontre si elle en a une. S'il passe, appelez **« Un lieu à plans »** (fenêtre du MJ, onglet Savoirs ; ou lieuAPlans({ lieu })) : le système **tire un plan parmi plusieurs**, le pose sur le premier du groupe, le lit au carnet si l'on sait, et fait passer deux quarts. On peut **revenir** plus tard tenter les autres (un plan déjà tiré là sort quatre fois moins souvent) ; un plan unique n'en sort qu'une fois dans la partie.

${LIEUX_A_PLANS.map(ligneLieu).join("\n\n")}` },
  { cle: "lire-copier-apprendre", titre: "Lire, copier, apprendre par cœur", texte: `**Lire** (une veillée) : un papier que personne ne savait lire le jour où on l'a trouvé ; quelqu'un a appris depuis le savoir-faire qu'il demande. Le plan entre au carnet.

**Copier** (une veillée, à l'abri, avec de la lumière : une unité d'énergie si l'abri en a, sinon une bougie, et l'abri se voit ce soir-là) : on recopie un plan du carnet, ou d'une copie qu'un membre porte, sur un papier neuf. La copie sert à **troquer**, à **donner** à un autre groupe, à garder en double sur l'étagère. **Un plan unique ne se copie pas.**

**Apprendre par cœur** (une veillée par cran, à l'abri, avec de la lumière) : 1 veillée pour un plan courant, 4 pour un plan rare ou unique (1 + rareté ÷ 25). Il faut le savoir-faire qu'il demande. Le plan **survit par celui qui l'a appris** : tant qu'il vit et reste au groupe, le groupe le connaît, même si le papier brûle ou si le cahier unique est volé. Il meurt avec lui. Une recrue qui savait des plans par cœur les apporte avec elle (à noter sur sa fiche).

**Les papiers d'un mort** restent sur son corps : « Reprendre les papiers d'un mort » (reprendrePlans) les passe à un membre du groupe. Un plan unique se prend sur le corps ; le mort le perd.` },
  { cle: "uniques", titre: "Les plans uniques", texte: `Il en existe peu, un seul exemplaire chacun dans la partie. Un plan unique **ne se copie pas** et ne va pas au carnet : il se consulte, tant qu'on l'a en main (porté par un membre, ou sur l'étagère de l'abri où le groupe se trouve). Il couvre souvent plusieurs plans, il apprend parfois un savoir-faire (veillées de lecture, comme un livre), et il vaut **trois fois plus** au troc. On peut en apprendre le contenu par cœur pour qu'il survive à sa perte.

${PLANS_CONSTRUCTION.filter(p => p.unique).map(p => `- **${p.nom}** (rareté ${rarete(p)}, ${valeur(p)} parts) : ${p.description} *Couvre : ${p.couvre.map(nomCible).join(", ")}.*`).join("\n")}

**Le cahier dicté d'une gramoune** (lot « savoirs ») est lui aussi un plan unique : il couvre les installations lontan et les recettes que demandent les savoirs qu'elle a dictés (et les tisanes, si elle sait les zerbaz). Un cahier écrit avant ce lot l'est aussi, sans rien faire.` },
  { cle: "etagere", titre: "L'étagère aux cahiers", texte: `Une installation de stockage : deux planches et une caisse (niveau 1, **12 papiers**), puis un coffre étanche caché sous le plancher (niveau 2, **24 papiers**). On y **range** les papiers de l'abri pour qu'ils n'aillent pas en fouille avec leurs porteurs, et pour que tout le monde y lise. Les plans uniques qui y sont comptent quand le groupe est à l'abri.

**Elle se vole** : une **brèche** faite par des vivants (pas des Livides) emporte 1 à 3 papiers (au plus 1 dans le coffre). **Elle brûle** : un incendie de l'abri (« L'étagère brûle ou est volée », à décider par vous : le feu du rancunier à la porte, une lampe renversée) en perd la moitié, rien dans le coffre. **L'eau** : un cyclone qui abîme un abri qu'on n'a pas préparé gâte un papier, rien dans le coffre.

Au **déménagement**, les papiers de l'étagère partent avec le groupe (ils ne pèsent rien).` },
  { cle: "troc", titre: "Le troc des plans", texte: `Un plan vaut au troc **3 parts + 0,2 par point de rareté**, trois fois plus s'il est unique (une part, c'est un jour de nourriture). La rareté part de la moyenne du plan ; chaque **copie qui sort du groupe** (donnée, troquée) la fait baisser d'un quart de l'écart jusqu'au minimum : un plan qui circule vaut moins, mais un plan rare reste un plan rare.

Quelques valeurs, à la rareté moyenne : ${[...ordinaires.filter(p => ["potager", "citerne-de-pluie", "cuisine-commune", "panneaux-solaires", "infirmerie"].includes(p.cle)), ...rares.slice(0, 4), ...PLANS_CONSTRUCTION.filter(p => p.unique)].map(p => `${nomPlan(p.cle)} ${valeur(p)}`).join(" ; ")} parts.

Le prix se discute comme tout troc (le marché, ses préjugés, la confiance). « Donner ou troquer un papier » et « Recevoir un plan » (fenêtre du MJ ; donnerPlan, recevoirPlan) déplacent le papier et ce qui va en échange ; valeurPlan({ cle }) dit ce que le plan vaut aujourd'hui. Au marché, evaluerTroc le compte avec le reste, au troc comme à la boutique (à la marge du commerçant) : objetsDonnes pour les papiers que le groupe cède, plansRecus pour ceux qu'il reçoit.` },
  { cle: "systeme", titre: "Ce que fait le système", texte: `- **Construire** et **fabriquer** appliquent le rabais des plans connus (carnet, par cœur, plans uniques en main).
- **Fouiller** avec la cible « plans » : un plan selon le type du site, puis le site se repose quelques jours.
- **Chaque jour**, la date d'un cyclone qui frappe une région est gardée ; un lieu à plans dont la fenêtre s'ouvre va au **journal secret** (« La fenêtre s'ouvre »).
- **Une brèche** faite par des vivants vole des papiers de l'étagère ; **un cyclone** sur un abri non préparé en gâte un ; **un déménagement** les emporte.
- **API** : plans(), valeurPlan({ cle }), lieuxAPlans(), lieuAPlans({ lieu, membres, quarts }), lirePlan({ objetId }), copierPlan({ cle, acteurId }), enseignerPlan({ acteurId, cle }), rangerPlan({ objetId }), prendrePlan({ id, acteurId }), perdreEtagere({ cause: "vol" | "feu" | "eau" }), donnerPlan({ objetId, contre, a }), recevoirPlan({ cle, acteurId, contre, de }), noterPlan({ cle }) (une issue d'affaire qui donne un plan), reprendrePlans({ deId, aId }).
- Une clé de plan au carnet : celle de l'installation, ou « recette:<clé> » pour une recette.` }
];
export const JOURNAL_PLANS = journal({ cle: "les-plans", nom: "Les plans", pack: "mj", pages: PAGES_MJ });

// ---------------------------------------------------------------- Une page du guide du joueur
export const PAGES_JOUEUR_PLANS = [
  { cle: "les-plans", titre: "Les plans", texte: `Ce que vous avez déjà su bâtir une fois se rebâtit plus vite : c'est le **carnet** du groupe. On y ajoute aussi les **plans trouvés** : un schéma coté, une notice annotée, le carnet d'un artisan.

- **Un plan connu** fait bâtir (ou fabriquer) avec **un quart de matériaux en moins et la moitié du travail**. Aucun plan n'est obligatoire : sans plan, on bâtit au prix plein.
- **Lire un plan** demande le savoir-faire qu'il suppose. Sinon, gardez le papier : pour plus tard, quand quelqu'un aura appris, ou pour un autre groupe.
- **Où chercher** : les quincailleries, les garages, les écoles, les casernes, et surtout **là où le savoir vivait** (une centrale, une distillerie, un îlet de fontainiers). Les plus rares dorment dans des lieux dangereux, qui ne s'ouvrent qu'à certains moments.
- **Copier** un plan (une veillée, avec de la lumière) donne un papier à troquer ou à garder en double. **Apprendre par cœur** fait survivre un plan à la perte du papier, tant que celui qui l'a appris vit.
- **Les plans uniques** (le cahier de tisanes d'une gramoune, le carnet d'un fontainier) ne se copient pas, et valent très cher.
- **L'étagère aux cahiers** garde les papiers à l'abri. Elle se vole, elle brûle ; un coffre étanche et caché les protège.` }
];

// Le registre : sites et plans (contenu/index.mjs les fusionne).
export const sitesAvecPlans = sites => sites.map(s => (PLANS_DES_SITES[s.cle] ? { ...s, plans: [...PLANS_DES_SITES[s.cle]] } : s));
