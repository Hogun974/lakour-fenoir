// Maladies et blessures persistantes (contrat §9, systems/lakour-survie/logique/maladies.mjs) : maladies tropicales réelles
// de La Réunion, blessures qui durent, chocs. Objets « affliction » du compendium. Les chiffres sont des choix de jeu, pas
// des données médicales ; les textes décrivent les maladies sans prétendre soigner qui que ce soit.
// { cle, nom, categorie, contagion, incubation, duree, effets: { malus, fatigue }, soin: { competence, difficulte, medicaments },
//   aggravation: { jours, malus, fatigue, duree } | null, declencheur: "eau" | "moustiques" | "ravine" | "chaleur" | null, risque }
//
// Lot « corps » (2026-11-17, contrat §19 ; repris de donnees/maladies/effets.json de Fénoir 3D, validé par Jordan « tout
// maintenant ») : des symptômes, pas des noms. Chaque affliction porte en plus :
//   symptomes: { active: [clé], aggravee: [clé] } (clés de SYMPTOMES), evidente (tout le monde la voit : fracture, brûlure,
//   piqûre, choc), diagnostic: [savoir] (ceux qui la reconnaissent), effetsStade: { active|aggravee: { moral, insomnie } } (le moral
//   perdu quand le stade commence ; insomnie : on dort mal), insalubrite (poids dans le tirage de l'insalubrité), siBlesse
//   (seulement un blessé l'attrape ainsi). Le Gris a sa table à part (GRIS) : il n'est pas une affliction.
import { html, objet } from "./aides.mjs";

const PSA = "premiers-secours-avances", ZERBAZ = "zerbaz";
// Les symptômes, dans l'ordre du jeu 3D (registre « symptomes » : le système les nomme aux joueurs).
export const SYMPTOMES = [
  ["fievre", "Fièvre"], ["frissons", "Frissons"], ["maux-de-tete", "Maux de tête"], ["courbatures", "Courbatures"],
  ["douleurs-articulaires", "Douleurs dans les articulations"], ["eruption", "Boutons sur la peau"], ["jaunisse", "Peau et yeux jaunes"],
  ["saignements", "Saignements des gencives et du nez"], ["nausee", "Nausée"], ["vomissements", "Vomissements"], ["diarrhee", "Ventre qui se vide"],
  ["crampes-de-ventre", "Crampes au ventre"], ["soif-intense", "Une soif qui ne passe pas"], ["vertiges", "Vertiges"], ["confusion", "Confusion"],
  ["demangeaisons", "Démangeaisons"], ["plaie-rouge", "Plaie rouge et chaude"], ["plaie-purulente", "Plaie qui suppure"], ["enflure", "Enflure"],
  ["cloques", "Cloques"], ["douleur-vive", "Douleur vive"], ["membre-inutilisable", "Un membre qui ne sert plus"], ["raideur", "Mâchoire et nuque raides"],
  ["spasmes", "Spasmes"], ["insomnie", "Ne dort plus"], ["cauchemars", "Cauchemars"], ["abattement", "Abattement"], ["faiblesse", "Faiblesse"],
  ["epuisement", "Épuisement"], ["peau-grise", "Peau qui grise"]
].map(([cle, nom]) => ({ cle, nom }));

// Le Gris en six stades visibles (0 à 5 ; au sixième, la mort) : on ne le nomme qu'avec les premiers secours avancés, ou après
// avoir vu un mordu se relever. Avec une soif qui monte (le 3D) : le MJ la fait sentir.
export const GRIS = {
  diagnostic: [PSA],
  stades: [
    { symptomes: ["plaie-rouge"] },
    { symptomes: ["fievre", "plaie-rouge"] },
    { symptomes: ["fievre", "frissons", "peau-grise"] },
    { symptomes: ["fievre", "frissons", "peau-grise", "faiblesse"] },
    { symptomes: ["frissons", "confusion", "peau-grise", "faiblesse"] },
    { symptomes: ["confusion", "peau-grise", "epuisement"] }
  ]
};

const stade = (symptomes, moral = 0, insomnie = false) => ({ symptomes, moral, insomnie });
// Par affliction : diagnostic, évidente, stades (actif, aggravé), insalubrité.
const CORPS = {
  dengue: { diagnostic: [PSA, ZERBAZ], active: stade(["fievre", "maux-de-tete", "courbatures", "eruption"]),
    aggravee: stade(["fievre", "maux-de-tete", "courbatures", "saignements", "epuisement"], 1, true) },
  chikungunya: { diagnostic: [PSA, ZERBAZ], active: stade(["fievre", "douleurs-articulaires", "eruption"]),
    aggravee: stade(["douleurs-articulaires", "epuisement"], 1, true) },
  leptospirose: { diagnostic: [PSA], insalubrite: 1, active: stade(["fievre", "frissons", "maux-de-tete", "courbatures"]),
    aggravee: stade(["fievre", "frissons", "jaunisse", "saignements", "epuisement"], 1) },
  "gastro-enterite": { diagnostic: [PSA, ZERBAZ], insalubrite: 6, active: stade(["nausee", "vomissements", "diarrhee", "crampes-de-ventre"]),
    aggravee: stade(["vomissements", "diarrhee", "crampes-de-ventre", "soif-intense", "faiblesse"], 1) },
  gale: { diagnostic: [PSA, ZERBAZ], insalubrite: 2, active: stade(["demangeaisons", "insomnie"], 0, true) },
  "plaie-infectee": { diagnostic: [PSA], insalubrite: 3, siBlesse: true, active: stade(["plaie-rouge", "enflure"]),
    aggravee: stade(["fievre", "frissons", "plaie-purulente", "enflure"], 1) },
  tetanos: { diagnostic: [PSA], active: stade(["raideur", "spasmes"]), aggravee: stade(["raideur", "spasmes", "epuisement"], 1, true) },
  fracture: { evidente: true, diagnostic: [PSA], active: stade(["douleur-vive", "membre-inutilisable"]),
    aggravee: stade(["fievre", "enflure", "douleur-vive", "membre-inutilisable"], 1, true) },
  brulure: { evidente: true, diagnostic: [PSA, ZERBAZ], active: stade(["cloques", "douleur-vive"]), aggravee: stade(["fievre", "plaie-purulente", "douleur-vive"], 1, true) },
  "piqure-de-scolopendre": { evidente: true, diagnostic: [ZERBAZ], active: stade(["enflure", "douleur-vive"]) },
  "coup-de-chaleur": { diagnostic: [PSA], active: stade(["maux-de-tete", "nausee", "soif-intense", "vertiges"]),
    aggravee: stade(["vomissements", "soif-intense", "confusion", "epuisement"]) },
  "choc-d-une-perte": { evidente: true, diagnostic: [], active: stade(["insomnie", "cauchemars", "abattement"], 1, true),
    aggravee: stade(["insomnie", "abattement", "faiblesse"], 1, true) }
};
function corpsDe(cle) {
  const c = CORPS[cle];
  if (!c) return {};
  const stades = ["active", "aggravee"].filter(s => c[s]);
  return {
    symptomes: Object.fromEntries(stades.map(s => [s, [...c[s].symptomes]])),
    effetsStade: Object.fromEntries(stades.map(s => [s, { moral: c[s].moral, insomnie: c[s].insomnie }])),
    evidente: Boolean(c.evidente), diagnostic: [...c.diagnostic], insalubrite: c.insalubrite ?? 0, siBlesse: Boolean(c.siBlesse)
  };
}

function affliction({ cle, nom, categorie, description, contagion = 0, incubation = 0, duree, effets, soin, aggravation = null, declencheur = null, risque = 0, prevention = "" }) {
  return objet({ pack: "afflictions", type: "affliction", cle, nom, img: categorie === "maladie" ? "icons/svg/biohazard.svg" : categorie === "psychique" ? "icons/svg/daze.svg" : "icons/svg/blood.svg",
    system: { categorie, description: html(description), prevention: html(prevention), contagion, incubation, duree, effets, soin, aggravation, declencheur, risque, ...corpsDe(cle) } });
}

export const AFFLICTIONS = [
  affliction({ cle: "dengue", nom: "Dengue", categorie: "maladie", declencheur: "moustiques", risque: 0.006, contagion: 0.02, incubation: 5, duree: 7,
    effets: { malus: 1, fatigue: 1 }, soin: { competence: "soins", difficulte: "normale", medicaments: 1 },
    aggravation: { jours: 4, malus: 2, fatigue: 2, duree: 5 },
    description: `Transmise par le moustique tigre qui pullule dans les Bas à la saison des pluies : forte fièvre, douleurs derrière les yeux, courbatures, éruption. Dans sa forme grave, des saignements et un épuisement qui peut tuer.`,
    prevention: `Moustiquaires, vider les eaux stagnantes (pots, pneus, gouttières bouchées), vivre plus haut.` }),
  affliction({ cle: "chikungunya", nom: "Chikungunya", categorie: "maladie", declencheur: "moustiques", risque: 0.004, contagion: 0.02, incubation: 4, duree: 10,
    effets: { malus: 1, fatigue: 1 }, soin: { competence: "soins", difficulte: "normale", medicaments: 1 },
    aggravation: { jours: 10, malus: 1, fatigue: 1, duree: 30 },
    description: `Le même moustique, une autre fièvre : brutale, avec des douleurs articulaires qui plient les gens en deux. Les anciens de l'île s'en souviennent. Les douleurs peuvent durer des mois.`,
    prevention: `Moustiquaires, eaux stagnantes vidées, manches longues au crépuscule.` }),
  affliction({ cle: "leptospirose", nom: "Leptospirose", categorie: "maladie", declencheur: "ravine", risque: 0.003, incubation: 7, duree: 10,
    effets: { malus: 1, fatigue: 1 }, soin: { competence: "soins", difficulte: "difficile", medicaments: 2 },
    aggravation: { jours: 3, malus: 2, fatigue: 2, duree: 10 },
    description: `La maladie des rats et des eaux douces : on l'attrape en marchant pieds nus dans les ravines, en se baignant dans les bassins, en touchant ce que les rats ont souillé. Fièvre, douleurs musculaires, puis parfois les reins et le foie qui lâchent.`,
    prevention: `Bottes et gants dans l'eau douce, réserves à l'abri des rats, eau traitée.` }),
  affliction({ cle: "gastro-enterite", nom: "Gastro-entérite", categorie: "maladie", declencheur: "eau", risque: 0.01, contagion: 0.08, incubation: 1, duree: 3,
    effets: { malus: 1, fatigue: 1 }, soin: { competence: "soins", difficulte: "normale", medicaments: 1 },
    aggravation: { jours: 2, malus: 2, fatigue: 2, duree: 3 },
    description: `L'eau non traitée, les mains sales, la nourriture tournée : vomissements, diarrhée, fièvre. Sans eau propre à boire, la déshydratation emporte les enfants et les anciens.`,
    prevention: `Eau filtrée et bouillie, savon, latrines loin des citernes.` }),
  affliction({ cle: "gale", nom: "Gale", categorie: "maladie", risque: 0.002, contagion: 0.05, incubation: 10, duree: 14,
    effets: { malus: 0, fatigue: 1 }, soin: { competence: "soins", difficulte: "normale", medicaments: 1 },
    description: `La promiscuité des abris surpeuplés, les couvertures partagées : des démangeaisons qui empêchent de dormir et s'infectent à force de gratter.`,
    prevention: `Laver et faire bouillir le linge, ne pas entasser les gens.` }),
  affliction({ cle: "plaie-infectee", nom: "Plaie infectée", categorie: "blessure", incubation: 2, duree: 7,
    effets: { malus: 1, fatigue: 0 }, soin: { competence: "soins", difficulte: "normale", medicaments: 1 },
    aggravation: { jours: 3, malus: 2, fatigue: 2, duree: 10 },
    description: `Une coupure de tôle, une griffure de ronce, une écharde de bambou : sous la chaleur humide, tout s'infecte. Rougeur, chaleur, pus, puis la fièvre qui monte. (Rien à voir avec le Gris : celui-là ne se soigne pas.)`,
    prevention: `Laver et désinfecter toute plaie le jour même ; alcool, savon, pansements propres.` }),
  affliction({ cle: "tetanos", nom: "Tétanos", categorie: "blessure", incubation: 8, duree: 20,
    effets: { malus: 2, fatigue: 1 }, soin: { competence: "soins", difficulte: "extreme", medicaments: 3 },
    aggravation: { jours: 4, malus: 3, fatigue: 2, duree: 20 },
    description: `Un clou rouillé, une plaie souillée de terre : des semaines plus tard, la mâchoire se raidit, puis les muscles se contractent jusqu'à la douleur. Ceux qui étaient vaccinés ne craignent rien ; les autres…`,
    prevention: `Savoir qui est vacciné ; nettoyer à fond les plaies souillées.` }),
  affliction({ cle: "fracture", nom: "Fracture", categorie: "blessure", duree: 40,
    effets: { malus: 2, fatigue: 0 }, soin: { competence: "soins", difficulte: "difficile", medicaments: 1 },
    aggravation: { jours: 5, malus: 2, fatigue: 1, duree: 60 },
    description: `Une chute dans une ravine, un pied pris entre deux rochers, une barricade qui s'effondre : un os cassé, réduit et immobilisé ou pas. Six semaines d'attelle, au mieux.`,
    prevention: `Une attelle bien posée tout de suite ; ne pas forcer.` }),
  affliction({ cle: "brulure", nom: "Brûlure", categorie: "blessure", duree: 10,
    effets: { malus: 1, fatigue: 1 }, soin: { competence: "soins", difficulte: "normale", medicaments: 1 },
    aggravation: { jours: 3, malus: 2, fatigue: 1, duree: 15 },
    description: `Un feu de cuisine, un incendie, une coulée approchée de trop près, de l'essence qui s'enflamme : la peau à vif, la douleur, l'infection qui guette.`,
    prevention: `Refroidir longuement à l'eau propre, couvrir proprement.` }),
  affliction({ cle: "piqure-de-scolopendre", nom: "Piqûre de scolopendre", categorie: "blessure", duree: 2,
    effets: { malus: 1, fatigue: 1 }, soin: { competence: "soins", difficulte: "normale", medicaments: 0 },
    description: `La scolopendre se cache sous les planches, dans les chaussures et les tas de bois. Sa piqûre brûle comme un fer rouge, la main enfle, la fièvre peut suivre. Rarement grave, toujours mémorable.`,
    prevention: `Secouer chaussures et vêtements, porter des gants pour déplacer le bois.` }),
  affliction({ cle: "coup-de-chaleur", nom: "Coup de chaleur", categorie: "maladie", declencheur: "chaleur", risque: 0.004, duree: 1,
    effets: { malus: 1, fatigue: 2 }, soin: { competence: "soins", difficulte: "normale", medicaments: 0 },
    aggravation: { jours: 1, malus: 2, fatigue: 3, duree: 2 },
    description: `Travailler en plein soleil dans les Bas en été austral, sans boire assez : maux de tête, vertiges, confusion, puis l'effondrement.`,
    prevention: `Travailler le matin et le soir, boire, se mettre à l'ombre aux heures chaudes.` }),
  affliction({ cle: "choc-d-une-perte", nom: "Le choc d'une perte", categorie: "psychique", duree: 7,
    effets: { malus: 1, fatigue: 1 }, soin: { competence: "parole", difficulte: "normale", medicaments: 0 },
    aggravation: { jours: 7, malus: 1, fatigue: 1, duree: 14 },
    description: `Avoir vu mourir un proche, avoir dû achever quelqu'un qu'on aimait : le sommeil s'en va, les gestes se font mécaniques, on se tait. Le temps aide ; les autres aussi, s'ils savent écouter.`,
    prevention: `Parler, veiller ensemble, enterrer ses morts, garder des rites.` })
];
