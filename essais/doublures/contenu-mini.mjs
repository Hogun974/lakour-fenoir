// Un PETIT contenu d'essai pour la logique de lakour-survie : six régions fictives (une île simplifiée), huit sites, seize
// installations, six savoir-faire, trois factions, quelques événements ; et pour le §9 : trois recettes, cinq afflictions,
// six créatures, six véhicules ou montures. Il suit les formes du contrat (docs/survie-contrat.md
// §2.1, §2.2, §2.5, §2.6, §3.2, §3.3) ; le vrai contenu de La Réunion vit dans modules/lakour-fenoir/contenu/.
//
// Carte :
//   port-gris (ville, littoral) ─route─ cote-ouest (sèche, ensoleillée) ─route─ hauts-verts (900 m, soleil et pluie)
//        │  └──────────piste (éboulement)───────────────────────────────────────┘    │            │
//        └─route (crue)─ plaine-est (pluvieuse) ─route─────────────────────────────────┘     sentier (éboulement)
//                           └─route (éruption)─ sud-sauvage (volcan) ~~mer~~ cote-ouest       cirque-perdu (1100 m)

const voisin = (region, terrain, km, quartsPied, quartsVehicule, coupure = []) => ({ region, route: `${terrain}-${region}`, km, terrain, quartsPied, quartsVehicule, coupure });

export const regions = [
  {
    cle: "port-gris", nom: "Port-Gris", zone: "littoral", altitude: 10, population: 5, climat: { soleil: 2, pluie: 2 },
    description: "<p>La ville du port.</p>", apres: "<p>Vide de Livides, pleine de bandes.</p>",
    ressources: { nourriture: 600, eau: 400, carburant: 300, medicaments: 80, munitions: 60, materiaux: 300, pieces: 150, graines: 40 },
    nature: { cueillette: 1, gibier: 0, peche: 2, bois: 1 },
    infrastructures: { electricite: [8, 14], eau: [10, 18], carburant: [3, 6], telephone: [7, 12] },
    dangers: ["incendie"], factionsDepart: [{ faction: "recuperateurs", force: 2 }],
    sites: ["port-immeuble", "port-entrepot"],
    voisins: [voisin("cote-ouest", "route", 30, 4, 1), voisin("plaine-est", "route", 40, 5, 1, ["crue"]), voisin("hauts-verts", "piste", 25, 4, 2, ["eboulement"])],
    repere: { x: 100, y: 50 }
  },
  {
    cle: "cote-ouest", nom: "Côte-Ouest", zone: "littoral", altitude: 30, population: 3, climat: { soleil: 3, pluie: 1 },
    description: "<p>Plages et savanes.</p>", apres: "<p>Les pêcheurs tiennent la côte.</p>",
    ressources: { nourriture: 250, eau: 150, carburant: 120, medicaments: 30, munitions: 20, materiaux: 120, pieces: 60, graines: 30 },
    nature: { cueillette: 2, gibier: 0, peche: 3, bois: 1 },
    infrastructures: { electricite: [9, 16], eau: [12, 20], carburant: [4, 8], telephone: [8, 14] },
    dangers: ["incendie"], factionsDepart: [{ faction: "pecheurs", force: 1 }],
    sites: ["ouest-case"],
    voisins: [voisin("port-gris", "route", 30, 4, 1), voisin("hauts-verts", "route", 20, 4, 1), voisin("sud-sauvage", "mer", 60, null, 3)],
    repere: { x: 40, y: 120 }
  },
  {
    cle: "hauts-verts", nom: "Hauts-Verts", zone: "hauts", altitude: 900, population: 2, climat: { soleil: 2, pluie: 3 },
    description: "<p>Prairies, brume et cases isolées.</p>", apres: "<p>De vieux Livides lents dans la brume.</p>",
    ressources: { nourriture: 120, eau: 60, carburant: 40, medicaments: 10, munitions: 15, materiaux: 80, pieces: 25, graines: 40 },
    nature: { cueillette: 3, gibier: 2, peche: 0, bois: 3 },
    infrastructures: { electricite: [10, 20], eau: [14, 30], carburant: [5, 9], telephone: [10, 18] },
    dangers: ["eboulement"], factionsDepart: [{ faction: "planteurs", force: 1 }],
    sites: ["hauts-ferme", "hauts-gite"],
    voisins: [voisin("port-gris", "piste", 25, 4, 2, ["eboulement"]), voisin("cote-ouest", "route", 20, 4, 1), voisin("cirque-perdu", "sentier", 15, 6, null, ["eboulement"]),
      voisin("plaine-est", "route", 30, 5, 2)],
    repere: { x: 120, y: 120 }
  },
  {
    cle: "cirque-perdu", nom: "Cirque perdu", zone: "cirque", altitude: 1100, population: 1, climat: { soleil: 1, pluie: 3 },
    description: "<p>Des îlets au fond des remparts.</p>", apres: "<p>Les familles des îlets tiennent bon.</p>",
    ressources: { nourriture: 40, eau: 30, carburant: 5, medicaments: 5, munitions: 2, materiaux: 20, pieces: 5, graines: 20 },
    nature: { cueillette: 2, gibier: 2, peche: 1, bois: 3 },
    infrastructures: { electricite: null, eau: null, carburant: [3, 6], telephone: [6, 10] },
    dangers: ["eboulement"], factionsDepart: [],
    sites: ["cirque-ilet"],
    voisins: [voisin("hauts-verts", "sentier", 15, 6, null, ["eboulement"])],
    repere: { x: 150, y: 170 }
  },
  {
    cle: "plaine-est", nom: "Plaine de l'Est", zone: "littoral", altitude: 40, population: 3, climat: { soleil: 1, pluie: 3 },
    description: "<p>Cannes et rivières en crue.</p>", apres: "<p>Les cannes ont tout envahi.</p>",
    ressources: { nourriture: 220, eau: 200, carburant: 100, medicaments: 25, munitions: 15, materiaux: 150, pieces: 70, graines: 25 },
    nature: { cueillette: 2, gibier: 1, peche: 2, bois: 2 },
    infrastructures: { electricite: [8, 15], eau: [12, 22], carburant: [4, 7], telephone: [8, 13] },
    dangers: ["crue"], factionsDepart: [{ faction: "recuperateurs", force: 1 }],
    sites: ["est-usine"],
    voisins: [voisin("port-gris", "route", 40, 5, 1, ["crue"]), voisin("hauts-verts", "route", 30, 5, 2), voisin("sud-sauvage", "route", 35, 6, 1, ["eruption"])],
    repere: { x: 200, y: 100 }
  },
  {
    cle: "sud-sauvage", nom: "Sud sauvage", zone: "volcan", altitude: 600, population: 1, climat: { soleil: 2, pluie: 2 },
    description: "<p>Coulées anciennes et forêt.</p>", apres: "<p>Presque personne.</p>",
    ressources: { nourriture: 50, eau: 30, carburant: 20, medicaments: 5, munitions: 5, materiaux: 30, pieces: 10, graines: 10 },
    nature: { cueillette: 2, gibier: 1, peche: 2, bois: 3 },
    infrastructures: { electricite: [12, 20], eau: [15, 25], carburant: [4, 9], telephone: [9, 15] },
    dangers: ["eruption", "incendie"], factionsDepart: [],
    sites: ["sud-tunnel"],
    voisins: [voisin("plaine-est", "route", 35, 6, 1, ["eruption"]), voisin("cote-ouest", "mer", 60, null, 3)],
    repere: { x: 180, y: 200 }
  }
];

const site = (cle, region, type, x) => ({ cle, region, nom: cle, type, description: `<p>${cle}</p>`, atouts: [], defauts: [], installationsDepart: [], ...x });

export const sites = [
  site("port-immeuble", "port-gris", "immeuble", { capacite: 8, defense: 1, discretion: 1, eau: "reseau", sol: 0, soleil: 1, souterrain: 1, acces: 3,
    stocks: { eau: 20, nourriture: 45, medicaments: 2, materiaux: 5, pieces: 2 } }),
  site("port-entrepot", "port-gris", "commerce", { capacite: 6, defense: 2, discretion: 0, eau: "reseau", sol: 0, soleil: 2, souterrain: 0, acces: 3,
    stocks: { nourriture: 80, eau: 30, materiaux: 20, pieces: 10 } }),
  site("ouest-case", "cote-ouest", "case-creole", { capacite: 5, defense: 0, discretion: 2, eau: "citerne", sol: 2, soleil: 3, souterrain: 0, acces: 2,
    stocks: { eau: 15, nourriture: 20, graines: 6 }, installationsDepart: [{ installation: "citerne-pluie", niveau: 1 }] }),
  site("hauts-ferme", "hauts-verts", "ferme", { capacite: 6, defense: 1, discretion: 2, eau: "aucune", sol: 3, soleil: 3, souterrain: 1, acces: 2,
    stocks: { eau: 10, nourriture: 30, graines: 20, materiaux: 20, pieces: 4 } }),
  site("hauts-gite", "hauts-verts", "gite", { capacite: 10, defense: 1, discretion: 3, eau: "source", sol: 1, soleil: 1, souterrain: 2, acces: 1,
    stocks: { nourriture: 15 } }),
  site("cirque-ilet", "cirque-perdu", "ilet", { capacite: 4, defense: 2, discretion: 4, eau: "riviere", sol: 2, soleil: 1, souterrain: 2, acces: 0,
    stocks: { nourriture: 10, graines: 8 }, installationsDepart: [{ installation: "potager", niveau: 1 }] }),
  site("est-usine", "plaine-est", "usine", { capacite: 12, defense: 2, discretion: 0, eau: "riviere", sol: 0, soleil: 1, souterrain: 1, acces: 3,
    stocks: { materiaux: 30, pieces: 20, carburant: 5 } }),
  site("sud-tunnel", "sud-sauvage", "tunnel-de-lave", { capacite: 6, defense: 3, discretion: 5, eau: "aucune", sol: 0, soleil: 0, souterrain: 3, acces: 1, stocks: {} })
];

const niv = (cout, effets = {}, requiert = {}) => ({ cout, requiert, effets });
const inst = (cle, categorie, niveaux) => ({ cle, nom: cle, categorie, description: `<p>${cle}</p>`, niveauMax: niveaux.length, niveaux });

export const installations = [
  inst("barricades", "defense", [niv({ materiaux: 4, travail: 4 }, { defense: 1 })]),
  inst("palissade", "defense", [
    niv({ materiaux: 10, travail: 12 }, { defense: 2, visibilite: 1 }),
    niv({ materiaux: 15, pieces: 2, travail: 16 }, { defense: 3, visibilite: 1 }, { installations: [{ cle: "palissade", niveau: 1 }] })
  ]),
  inst("citerne-pluie", "eau", [
    niv({ materiaux: 6, pieces: 1, travail: 6 }, { production: { eau: 2 }, conditions: { pluie: true }, stockage: { eau: 40 } }),
    niv({ materiaux: 10, pieces: 2, travail: 10 }, { production: { eau: 3 }, conditions: { pluie: true }, stockage: { eau: 100 } }, { savoirs: ["plomberie"] })
  ]),
  inst("potager", "nourriture", [
    niv({ materiaux: 3, graines: 4, travail: 8 }, { production: { nourriture: 2 }, conditions: { delai: 30 }, consommation: { eau: 1 }, visibilite: 1 }, { site: { sol: 1 } }),
    niv({ materiaux: 4, graines: 6, travail: 12 }, { production: { nourriture: 4 }, conditions: { delai: 30 }, consommation: { eau: 2 }, visibilite: 1 }, { savoirs: ["maraichage"], site: { sol: 1 } }),
    niv({ materiaux: 6, graines: 8, travail: 16 }, { production: { nourriture: 6 }, conditions: { delai: 30 }, consommation: { eau: 3 }, visibilite: 2 }, { savoirs: ["maraichage"], site: { sol: 2 } })
  ]),
  inst("panneaux-solaires", "energie", [
    niv({ pieces: 4, materiaux: 2, travail: 6 }, { production: { energie: 1 }, conditions: { soleil: true }, visibilite: 1 }, { savoirs: ["electricite-solaire"], site: { soleil: 1 } }),
    niv({ pieces: 8, materiaux: 3, travail: 8 }, { production: { energie: 2 }, conditions: { soleil: true }, visibilite: 1 }, { savoirs: ["electricite-solaire"], site: { soleil: 1 } })
  ]),
  inst("batteries", "energie", [
    niv({ pieces: 4, travail: 4 }, { stockage: { energie: 10 } }, { savoirs: ["electricite-solaire"] }),
    niv({ pieces: 8, travail: 6 }, { stockage: { energie: 25 } }, { savoirs: ["electricite-solaire"] })
  ]),
  inst("chambre-froide", "stockage", [
    niv({ pieces: 6, materiaux: 4, travail: 8 }, { consommation: { energie: 3 }, conservation: true, stockage: { nourriture: 100 } }, { savoirs: ["electricite-solaire"], installations: [{ cle: "batteries", niveau: 1 }] })
  ]),
  inst("reserve-etanche", "stockage", [niv({ materiaux: 8, travail: 8 }, { conservation: true, stockage: { nourriture: 60 } })]),
  inst("galerie", "souterrain", [
    niv({ materiaux: 6, travail: 10 }, { discretion: 1, protectionCyclone: 1, capacite: 2, stockage: { nourriture: 30 } }, { site: { souterrain: 1 } }),
    niv({ materiaux: 10, travail: 20 }, { discretion: 2, defense: 1, protectionCyclone: 2, capacite: 4 }, { savoirs: ["etaiement"], site: { souterrain: 1 } }),
    niv({ materiaux: 15, pieces: 2, travail: 30 }, { discretion: 3, defense: 2, protectionCyclone: 3, capacite: 8 }, { savoirs: ["etaiement"], site: { souterrain: 2 } }),
    niv({ materiaux: 20, pieces: 4, travail: 40 }, { discretion: 4, defense: 3, protectionCyclone: 3, capacite: 12, moral: 1 }, { savoirs: ["etaiement"], site: { souterrain: 3 } })
  ]),
  inst("radio", "communication", [niv({ pieces: 3, travail: 3 }, { consommation: { energie: 1 }, renseignements: true }, { savoirs: ["radio"] })]),
  inst("compost", "nourriture", [niv({ materiaux: 2, travail: 3 }, { sol: 0.02 })]),
  inst("groupe-electrogene", "energie", [niv({ pieces: 5, travail: 3 }, { production: { energie: 8 }, consommation: { carburant: 1 }, bruit: 2, visibilite: 1 })]),
  inst("dortoir", "vie", [niv({ materiaux: 8, travail: 8 }, { capacite: 4, moral: 1 })]),
  inst("infirmerie", "vie", [niv({ materiaux: 4, pieces: 2, medicaments: 2, travail: 6 }, { soins: 1, consommation: { energie: 1 } }, { savoirs: ["premiers-secours"] })]),
  inst("filtre-sable", "eau", [niv({ materiaux: 3, travail: 4 }, { eauTraitee: true }, { savoirs: ["plomberie"] })]),
  inst("atelier", "vie", [niv({ materiaux: 6, pieces: 2, travail: 8 }, { moral: 0 })]),
  inst("jardin-creole", "nourriture", [niv({ materiaux: 2, graines: 3, travail: 6 }, { production: { nourriture: 4 }, bras: { tache: "cultures", nombre: 2, niveau: 2 }, visibilite: 1 }, { site: { sol: 1 } })]),
  inst("pico-hydro", "energie", [niv({ pieces: 6, materiaux: 4, travail: 10 }, { production: { energie: 4 }, conditions: { riviere: true } }, { savoirs: ["electricite-solaire"], site: { eau: ["riviere"] } })])
];

const savoir = cle => ({ cle, nom: cle, description: `<p>${cle}</p>`, apprentissage: "<p>—</p>", effets: "<p>—</p>" });
export const savoirs = ["plomberie", "maraichage", "electricite-solaire", "etaiement", "radio", "premiers-secours"].map(savoir);

export const factions = [
  { cle: "recuperateurs", nom: "Les Récupérateurs", attitude: "hostile", regionsDepart: ["port-gris"], croissance: 0.02, description: "<p>—</p>" },
  { cle: "planteurs", nom: "La coopérative des planteurs", attitude: "amicale", regionsDepart: ["hauts-verts"], croissance: 0.01, description: "<p>—</p>" },
  { cle: "pecheurs", nom: "Les pêcheurs de la côte", attitude: "neutre", regionsDepart: ["cote-ouest"], croissance: 0.01, description: "<p>—</p>" }
];

export const evenements = [
  { cle: "incendie", nom: "Incendie", type: "accident", phases: [], zones: ["littoral", "volcan"], saisons: ["seche"], poids: 2, public: true,
    texte: "<p>Une fumée noire monte.</p>", effets: { pillage: -0.1, route: "difficile", duree: 2 } },
  { cle: "convoi-pillards", nom: "Convoi de pillards", type: "humain", phases: ["effondrement", "silence"], zones: ["littoral"], saisons: [], poids: 1, public: false,
    texte: "<p>Des pick-up chargés passent.</p>", effets: { faction: "recuperateurs", force: 0.5 } },
  { cle: "horde-errante", nom: "Horde errante", type: "horde", phases: ["silence", "apres"], zones: ["hauts", "cirque"], saisons: [], poids: 1, public: true,
    texte: "<p>Une file lente de Livides.</p>", effets: { horde: 2 } },
  { cle: "cache-trouvee", nom: "Cache oubliée", type: "decouverte", phases: [], zones: [], saisons: [], poids: 1, public: false, texte: "<p>—</p>", effets: {} }
];

// §9 — atelier, maladies, véhicules, bestiaire.
export const recettes = [
  { cle: "arc-fleches", nom: "Arc et flèches", cout: { materiaux: 2 }, travail: 2, competence: "bricolage", difficulte: "normale",
    requiert: { savoirs: [], installation: "atelier" }, produit: { equipement: "arc", n: 1 } },
  { cle: "munitions-rechargees", nom: "Munitions rechargées", cout: { pieces: 1, materiaux: 1 }, travail: 2, competence: "bricolage", difficulte: "difficile",
    requiert: { savoirs: [], installation: { cle: "atelier", niveau: 1 } }, produit: { ressource: "munitions", n: 3 } },
  { cle: "filtre-portatif", nom: "Filtre portatif", cout: { materiaux: 1, pieces: 1 }, travail: 1, competence: "survie", difficulte: "normale",
    requiert: { savoirs: ["plomberie"] }, produit: { equipement: "filtre-portatif", n: 1 } }
];

export const afflictions = [
  { cle: "dengue", nom: "Dengue", categorie: "maladie", declencheur: "moustiques", risque: 0.01, contagion: 0, incubation: 4, duree: 7,
    effets: { malus: 1, fatigue: 1 }, soin: { competence: "soins", difficulte: "normale", medicaments: 1 }, aggravation: { jours: 4, malus: 1, fatigue: 0, duree: 3 } },
  { cle: "gastro", nom: "Gastro-entérite", categorie: "maladie", declencheur: "eau", risque: 0.02, contagion: 0.05, incubation: 1, duree: 3,
    effets: { malus: 1, fatigue: 1 }, soin: { competence: "soins", difficulte: "normale", medicaments: 1 }, aggravation: null },
  { cle: "leptospirose", nom: "Leptospirose", categorie: "maladie", declencheur: "ravine", risque: 0.003, contagion: 0, incubation: 7, duree: 10,
    effets: { malus: 1, fatigue: 1 }, soin: { competence: "soins", difficulte: "difficile", medicaments: 2 }, aggravation: { jours: 3, malus: 2, fatigue: 1, duree: 5 } },
  { cle: "fracture", nom: "Fracture", categorie: "blessure", contagion: 0, incubation: 0, duree: 30,
    effets: { malus: 1, fatigue: 0 }, soin: { competence: "soins", difficulte: "difficile", medicaments: 1 }, aggravation: null },
  { cle: "choc", nom: "Choc après une perte", categorie: "psychique", contagion: 0, incubation: 0, duree: 5,
    effets: { malus: 1, fatigue: 0 }, soin: { competence: "parole", difficulte: "normale", medicaments: 0 }, aggravation: null }
];

export const creatures = [
  { cle: "livide-frais", nom: "Livide frais", type: "livide", des: 1, resistance: 1, poids: 3 },
  { cle: "livide-des-hauts", nom: "Livide des Hauts", type: "livide", des: 1, resistance: 2, altitudeMin: 400, poids: 3 },
  { cle: "noye", nom: "Noyé du lagon", type: "livide", des: 2, resistance: 1, zones: ["littoral"], poids: 1 },
  { cle: "coureur", nom: "Coureur", type: "livide", des: 2, resistance: 2, jourMax: 6, poids: 1 },
  { cle: "chiens-errants", nom: "chien errant", type: "animal", des: 1, resistance: 1, poids: 2 },
  { cle: "cochon-marron", nom: "cochon marron", type: "animal", des: 2, resistance: 2, zones: ["hauts", "cirque", "foret"], poids: 1 }
];

export const equipements = [
  { cle: "voiture", nom: "Voiture", type: "vehicule", charge: 20, carburantParQuart: 0.5, bruit: 3, terrains: ["route", "piste"], rapide: true, places: 5 },
  { cle: "quatre-quatre", nom: "4×4", type: "vehicule", charge: 25, carburantParQuart: 1, bruit: 4, terrains: ["route", "piste"], rapide: true, places: 5 },
  { cle: "velo-cargo", nom: "Vélo-cargo", type: "vehicule", charge: 8, carburantParQuart: 0, bruit: 0, terrains: ["route", "piste"], rapide: false, allure: 0.5, places: 1 },
  { cle: "ane", nom: "Âne", type: "monture", charge: 6, carburantParQuart: 0, bruit: 1, terrains: ["route", "piste", "sentier"], rapide: false, allure: 0.8, places: 0 },
  { cle: "kayak", nom: "Kayak", type: "vehicule", charge: 3, carburantParQuart: 0, bruit: 0, terrains: ["mer"], rapide: false, places: 2 },
  { cle: "barque-moteur", nom: "Barque à moteur", type: "vehicule", charge: 15, carburantParQuart: 1, bruit: 3, terrains: ["mer"], rapide: true, places: 6 },
  { cle: "arc", nom: "Arc", type: "arme", bonus: { tir: 1 }, charge: 1 },
  { cle: "filtre-portatif", nom: "Filtre portatif", type: "outil", bonus: { survie: 1 }, charge: 0 }
];

// §10 — enfances, passés, traits (noms et textes d'essai).
export const enfances = [
  { cle: "enfant-des-hauts", nom: "Enfant des Hauts", competences: { survie: 2, endurance: 1 }, savoirs: ["maraichage"], incapacites: [], equipement: [], histoire: ["A grandi dans la brume, entre les chouchous."], poids: 2 },
  { cle: "gamin-du-port", nom: "Gamin du port", competences: { discretion: 1, combat: 1, parole: 1 }, savoirs: [], incapacites: [], equipement: [], histoire: ["Connaît chaque ruelle du port."], poids: 2 },
  { cle: "fille-de-pecheur", nom: "Fille de pêcheur", competences: { survie: 1, conduite: 1, endurance: 1 }, savoirs: [], incapacites: [], equipement: [], histoire: ["Sait lire la houle."], poids: 2 },
  { cle: "enfance-protegee", nom: "Enfance protégée", competences: { parole: 2, soins: 1, endurance: -1 }, savoirs: ["premiers-secours"], incapacites: ["travaux-lourds"], equipement: [], histoire: ["Des livres, des vacances, peu de corvées."], poids: 1 },
  { cle: "enfant-de-la-cite", nom: "Enfant de la cité", competences: { combat: 1, vigilance: 1, discretion: 1 }, savoirs: [], incapacites: [], equipement: [], histoire: ["A appris à voir venir les ennuis."], poids: 2 }
];

export const passes = [
  { cle: "infirmiere", nom: "Infirmière", competences: { soins: 3, parole: 1 }, savoirs: ["premiers-secours"], incapacites: [], equipement: [], histoire: ["Était de garde au jour zéro."], poids: 1 },
  { cle: "electricien", nom: "Électricien", competences: { bricolage: 3, vigilance: 1 }, savoirs: ["electricite-solaire"], incapacites: [], equipement: [], histoire: ["Posait des panneaux sur les toits de l'Ouest."], poids: 1 },
  { cle: "planteur", nom: "Planteur", competences: { survie: 2, endurance: 2 }, savoirs: ["maraichage"], incapacites: [], equipement: [], histoire: ["Coupait la canne depuis vingt ans."], poids: 1 },
  { cle: "gendarme", nom: "Gendarme", competences: { tir: 2, vigilance: 2, conduite: 1 }, savoirs: [], incapacites: [], equipement: [], histoire: ["Tenait un barrage le premier soir."], poids: 1 },
  { cle: "etudiante", nom: "Étudiante", competences: { parole: 1, soins: 1, discretion: 1 }, savoirs: ["radio"], incapacites: [], equipement: [], histoire: ["Révisait ses partiels."], poids: 1 },
  { cle: "retraite-marine", nom: "Retraité de la marine", competences: { conduite: 2, bricolage: 2, vigilance: 1 }, savoirs: [], incapacites: [], equipement: [], histoire: ["Quarante ans de mer."], poids: 1, ageMin: 50 }
];

export const traits = [
  { cle: "main-verte", nom: "Main verte", effets: { taches: { cultures: 1 } }, incompatibles: [], poids: 2 },
  { cle: "pacifique", nom: "Pacifique", effets: { competences: { combat: -1 } }, incapacites: ["violence", "combat"], incompatibles: ["bagarreur", "sang-froid"], poids: 1 },
  { cle: "bagarreur", nom: "Bagarreur", effets: { competences: { combat: 1 }, moral: 0 }, incompatibles: ["pacifique"], poids: 1 },
  { cle: "claustrophobe", nom: "Claustrophobe", effets: { peur: { lieux: ["galerie", "tunnel-de-lave", "souterrain"], malus: 1, moral: 1 } }, incompatibles: [], poids: 1 },
  { cle: "gros-mangeur", nom: "Gros mangeur", effets: { besoins: { nourriture: 1.5 } }, incompatibles: ["sobre"], poids: 1 },
  { cle: "sobre", nom: "Sobre", effets: { besoins: { nourriture: 0.75 } }, incompatibles: ["gros-mangeur"], poids: 1 },
  { cle: "optimiste", nom: "Optimiste", effets: { moral: 1 }, incompatibles: ["pessimiste"], poids: 1 },
  { cle: "pessimiste", nom: "Pessimiste", effets: { moral: -1 }, incompatibles: ["optimiste"], poids: 1 },
  { cle: "insomniaque", nom: "Insomniaque", effets: { fatigue: 1 }, incompatibles: [], poids: 1 },
  { cle: "solitaire", nom: "Solitaire", effets: { social: { max: 6, moral: -1 } }, incompatibles: [], poids: 1 },
  { cle: "sang-froid", nom: "Sang-froid", effets: { competences: { tir: 1 } }, incompatibles: ["pacifique"], poids: 1 },
  { cle: "maladroit", nom: "Maladroit", effets: { competences: { bricolage: -1 }, taches: { atelier: -1, chantier: -1 } }, incompatibles: [], poids: 1 },
  { cle: "debrouillard", nom: "Débrouillard", effets: { taches: { fouille: 1 } }, incompatibles: [], poids: 1 }
];

export const contenuMini = () => structuredClone({ regions, sites, installations, savoirs, factions, evenements, passes, equipements, recettes, afflictions, creatures, enfances, traits });
export default contenuMini;
