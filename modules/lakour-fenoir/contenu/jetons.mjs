// Jetons de Fénoir : quelle silhouette game-icons.net pour qui. Icônes de game-icons.net, licence CC BY 3.0
// (https://creativecommons.org/licenses/by/3.0/) ; le dossier avant le « / » est l'auteur. Seules les icônes déjà copiées
// dans modules/lakour-mj-ia/outils/game-icons/ sont utilisées (pour en ajouter : outils/fabriquer-jetons-fenoir.mjs
// --source <dossier icons-master de l'archive game-icons>). Les images, figurants.json, les index des jetons de joueur et
// le tableau des icônes de CREDITS.md sont écrits par outils/fabriquer-jetons-fenoir.mjs.
export const DOSSIER_JETONS = "modules/lakour-fenoir/assets/jetons";
export const cheminJeton = cle => `${DOSSIER_JETONS}/${cle}.svg`;
export const cheminJeton3d = cle => `${DOSSIER_JETONS}/3d/${cle}.svg`;
export const cheminJetonJoueur = cle => `${DOSSIER_JETONS}/joueurs/${cle}.svg`;
export const cheminJetonJoueur3d = cle => `${DOSSIER_JETONS}/joueurs/3d/${cle}.svg`;
export const INDEX_JOUEURS = { "2d": `${DOSSIER_JETONS}/index.json`, "3d": `${DOSSIER_JETONS}/index-3d.json` };

// Jeton de joueur par passé (clé du passé -> icône).
export const JETONS_PASSES = {
  "infirmiere-du-chu": "lorc/hospital-cross",
  "electricien": "lorc/gear-hammer",
  "pecheur-de-saint-gilles": "lorc/harpoon-trident",
  "planteur-de-canne": "delapouite/farmer",
  "gendarme": "delapouite/police-officer-head",
  "etudiante": "lorc/open-book",
  "guide-de-canyon": "delapouite/miner",
  "mecanicien": "lorc/auto-repair",
  "cuisinier-de-camion-bar": "delapouite/empty-wood-bucket",
  "retraite-de-la-marine": "delapouite/captain-hat-profile",
  "agricultrice-des-hauts": "skoll/goat",
  "ambulancier": "lorc/candle-light",
  "prof-de-svt": "delapouite/teacher",
  "vendeur-de-bazar": "lorc/swap-bag",
  "chauffeur-de-car-jaune": "darkzaitzev/big-gear",
  "apiculteur": "delapouite/herbs-bundle",
  "ilette-de-mafate": "delapouite/well"
};

// Jetons des acteurs (prétirés, PNJ, bestiaire) : clé de l'acteur -> icône.
export const JETONS_ACTEURS = {
  // Bestiaire
  "livide-frais": "delapouite/shambling-zombie",
  "livide-des-hauts": "delapouite/half-dead",
  "noye-du-lagon": "lorc/tentacles-skull",
  "livide-brule": "lorc/fire-silhouette",
  "coureur": "lorc/grasping-claws",
  "chien-errant": "lorc/hound",
  "cochon-marron": "caro-asercion/boar",
  "rat-des-reserves": "delapouite/rat",
  "pillard-sans-lune": "delapouite/bandit",
  "soldat-de-la-garnison": "skoll/brodie-helmet",
  // Prétirés
  "pretire-soignante": "lorc/hospital-cross",
  "pretire-bricoleur": "lorc/gear-hammer",
  "pretire-combattante": "delapouite/police-officer-head",
  "pretire-eclaireur": "delapouite/miner",
  "pretire-meneur": "delapouite/captain-hat-profile",
  "pretire-cultivatrice": "delapouite/farmer",
  // PNJ
  "commandante-hoarau": "lorc/visored-helm",
  "memee-lucette": "skoll/goat",
  "gros-mani": "lorc/auto-repair",
  "patron-grondin": "lorc/anchor",
  "frere-expedit": "delapouite/sun-priest",
  "ancienne-de-la-nouvelle": "delapouite/teacher",
  "docteure-soundirassen": "skoll/pestle-mortar",
  "le-comptable": "darkzaitzev/hooded-figure",
  "ti-zan-l-enfant": "delapouite/baby-face",
  "agent-de-la-riviere-de-l-est": "darkzaitzev/big-gear",
  "radioamatrice-du-brule": "lorc/envelope"
};

// Figurants à part (foule que le MJ IA pose et retire) : anneau neutre.
export const JETONS_FIGURANTS = {
  "figurant-refugie": { titre: "Réfugié", icone: "delapouite/pilgrim-hat" },
  "figurant-enfant": { titre: "Enfant", icone: "delapouite/baby-face" },
  "figurant-pelerin": { titre: "Pèlerin de la Lave", icone: "lorc/prayer" },
  "figurant-pecheur": { titre: "Pêcheur", icone: "lorc/anchor" },
  "figurant-fermier": { titre: "Fermier des Hauts", icone: "delapouite/farmer" },
  "figurant-soignant": { titre: "Soignant", icone: "lorc/hospital-cross" },
  "figurant-ferrailleur": { titre: "Ferrailleur", icone: "lorc/gear-hammer" },
  "figurant-ilette": { titre: "Habitant d'un îlet", icone: "delapouite/well" },
  "figurant-chien": { titre: "Chien du camp", icone: "delapouite/sitting-dog" },
  "figurant-malade": { titre: "Malade masqué", icone: "skoll/gas-mask" }
};

// Types de figurants proposés au MJ IA (assets/jetons/figurants.json) : jeton d'un acteur ou d'un figurant à part.
export const TYPES_FIGURANTS = {
  livide: { libelle: "Livide", jeton: "livide-frais" },
  "livide-ancien": { libelle: "Livide des Hauts", jeton: "livide-des-hauts" },
  noye: { libelle: "Noyé du lagon", jeton: "noye-du-lagon" },
  refugie: { libelle: "Réfugié", jeton: "figurant-refugie" },
  enfant: { libelle: "Enfant", jeton: "figurant-enfant" },
  pillard: { libelle: "Pillard", jeton: "pillard-sans-lune" },
  soldat: { libelle: "Soldat de la Garnison", jeton: "soldat-de-la-garnison" },
  pelerin: { libelle: "Pèlerin de la Lave", jeton: "figurant-pelerin" },
  pecheur: { libelle: "Pêcheur", jeton: "figurant-pecheur" },
  fermier: { libelle: "Fermier des Hauts", jeton: "figurant-fermier" },
  soignant: { libelle: "Soignant", jeton: "figurant-soignant" },
  ferrailleur: { libelle: "Ferrailleur", jeton: "figurant-ferrailleur" },
  ilette: { libelle: "Habitant d'un îlet", jeton: "figurant-ilette" },
  chien: { libelle: "Chien errant", jeton: "chien-errant" },
  malade: { libelle: "Malade", jeton: "figurant-malade" }
};

// Dossier game-icons -> nom de l'auteur (license.txt de l'archive).
export const AUTEURS = {
  "lorc": "Lorc", "delapouite": "Delapouite", "skoll": "Skoll", "darkzaitzev": "DarkZaitzev", "cathelineau": "Cathelineau",
  "caro-asercion": "Caro Asercion", "carl-olsen": "Carl Olsen", "kier-heyl": "Kier Heyl"
};

// Couleur de l'anneau selon l'attitude (prototypeToken.disposition), bleu acier pour les joueurs ; mêmes teintes que les autres mondes.
export const COULEURS_ANNEAU = {
  "-1": { attitude: "hostile", couleur: "#8a1414" },
  "0": { attitude: "neutre", couleur: "#c8871a" },
  "1": { attitude: "allié", couleur: "#2e7d36" },
  joueur: { attitude: "joueur", couleur: "#4b6b8a" }
};
// Liseré : gris cendre pour les Livides.
export const LISERE_LIVIDE = "#9aa3a8";
