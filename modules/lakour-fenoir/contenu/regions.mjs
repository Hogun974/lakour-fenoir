// Les seize régions de La Réunion pour Fénoir (contrat §2.1) et les routes qui les relient.
// Géographie réelle (communes, routes, cirques, centrales) ; textes originaux. Les repères sont des pixels de la scène
// « Carte de La Réunion » (4000 × 3000, nord en haut), calculés depuis des coordonnées réelles approchées.
// nature : { cueillette, gibier, peche, bois } -> { parJour: rendement par jour, plafond } (voir docs/survie-notes-contenu.md).
import { html, ressources } from "./aides.mjs";

// Projection simple : 1 km ≈ 46 px ; longitude 55,216 E -> x 528 ; latitude 20,87 S -> y 166.
export const CARTE = { largeur: 4000, hauteur: 3000, pxParKm: 46 };
export const repere = (lon, lat) => ({ x: Math.round(528 + (lon - 55.216) * 103.9 * 46), y: Math.round(166 + (Math.abs(lat) - 20.87) * 110.6 * 46) });

const n = (cueillette, gibier, peche, bois) => ({
  cueillette: { parJour: cueillette[0], plafond: cueillette[1] }, gibier: { parJour: gibier[0], plafond: gibier[1] },
  peche: { parJour: peche[0], plafond: peche[1] }, bois: { parJour: bois[0], plafond: bois[1] }
});

// Lot « savoirs » : le gaz des cuisines (1 = un kilo ; une bouteille de 13 kg dans chaque case), selon la population.
export const gazDepart = population => Math.round(10 + 40 * (Number(population) || 0));

function region({ cle, nom, zone, altitude, population, climat, description, apres, ressources: r, nature, infrastructures, dangers, factionsDepart, repere: rp }) {
  return { cle, nom, zone, altitude, population, climat, description: html(description), apres: html(apres),
    ressources: ressources({ gaz: gazDepart(population), ...r }), nature, infrastructures, dangers, factionsDepart, sites: [], voisins: [], repere: rp };
}

export const REGIONS_BRUTES = [
  region({
    cle: "saint-denis", nom: "Saint-Denis", zone: "littoral", altitude: 150, population: 5, climat: { soleil: 2, pluie: 2 },
    description: `Le chef-lieu s'étale du Barachois jusqu'aux pentes de La Montagne et du Brûlé. Au jour zéro, les bouchons remontent le boulevard Sud et les sirènes ne se taisent plus autour du CHU de Bellepierre. Les cases créoles de la rue de Paris ferment leurs barreaux, les barres du Chaudron allument toutes leurs fenêtres, et sur le front de mer, des familles regardent les avions décoller de Gillot comme on regarde partir le dernier car.

On y trouve de tout : pharmacies, quincailleries, supermarchés, casernes. Et cent cinquante mille personnes qui veulent la même chose que vous.`,
    apres: `La ville tombe vite : densité, hôpital débordé, embouteillages qui deviennent des pièges. Pendant l'effondrement, le centre grouille et des hordes en sortent par la route du Littoral et la RN2. Après deux mois, la chaleur fait son œuvre dans les rues basses : les Livides s'effondrent dans les caniveaux, et ce sont les Sans-Lune qui tiennent les carrefours. Les hauts de La Montagne et du Brûlé, plus frais, gardent leurs morts plus longtemps.`,
    ressources: { nourriture: 1400, eau: 900, carburant: 320, medicaments: 180, munitions: 40, materiaux: 300, pieces: 160, graines: 30 },
    nature: n([2, 40], [0, 5], [1, 20], [1, 30]),
    infrastructures: { electricite: [8, 14], eau: [9, 16], carburant: [3, 7], telephone: [6, 12] },
    dangers: ["horde-de-la-ville", "fortes-pluies", "incendie-urbain"],
    factionsDepart: [{ faction: "sans-lune", force: 2 }, { faction: "dispensaire-du-sud", force: 1 }],
    repere: repere(55.45, -20.89)
  }),
  region({
    cle: "sainte-marie", nom: "Sainte-Marie et l'aéroport", zone: "littoral", altitude: 80, population: 3, climat: { soleil: 2, pluie: 2 },
    description: `De Gillot à Sainte-Suzanne, la plaine littorale du Nord-Est alterne zones commerciales, champs de canne et lotissements. L'aéroport est le cœur battant du jour zéro : files d'attente jusqu'au parking, rotations ajoutées en urgence, rumeurs de passagers malades débarqués de nuit. Plus à l'est, le phare de Bel-Air veille toujours sur la pointe, et la petite marina de Sainte-Marie dandine ses barques.

Les vergers des hauts de Sainte-Marie croulent de letchis en décembre.`,
    apres: `Les pistes de Gillot se vident après la dernière rotation, puis s'encombrent d'avions qui ne repartiront pas. Les zones commerciales sont pillées en une semaine. Plus tard, c'est une région de passage entre la capitale et l'Est : les bandes la traversent, et la plaine de canne, haute et jamais coupée, cache tout ce qui marche.`,
    ressources: { nourriture: 700, eau: 450, carburant: 260, medicaments: 60, munitions: 15, materiaux: 220, pieces: 140, graines: 30 },
    nature: n([3, 50], [1, 10], [2, 30], [2, 40]),
    infrastructures: { electricite: [8, 14], eau: [9, 16], carburant: [4, 8], telephone: [6, 12] },
    dangers: ["fortes-pluies", "radier-submerge", "houle-cyclonique"],
    factionsDepart: [{ faction: "sans-lune", force: 1 }],
    repere: repere(55.53, -20.9)
  }),
  region({
    cle: "route-du-littoral", nom: "La route du Littoral", zone: "littoral", altitude: 20, population: 1, climat: { soleil: 3, pluie: 1 },
    description: `Douze kilomètres coincés entre la falaise et l'océan, de Saint-Denis à La Possession. La nouvelle route du Littoral court sur sa digue et son viaduc jusqu'à la Grande Chaloupe ; au-delà, l'ancienne route serre la falaise sous ses filets et ses merlons. Au jour zéro, c'est un tuyau : deux files immobiles, des klaxons, des gens qui marchent entre les voitures avec leurs enfants sur les épaules.

Au creux de la Grande Chaloupe dorment le vieux lazaret de pierre et la gare d'autrefois. Le chemin des Anglais, pavé il y a deux siècles, passe au-dessus de tout cela.`,
    apres: `La route devient un cimetière de tôle que les éboulements et la houle referment par morceaux. Qui la tient contrôle le passage entre le Nord et l'Ouest : la Garnison du Quai y pose vite des chicanes. Le chemin des Anglais reste la voie des piétons prudents.`,
    ressources: { nourriture: 120, eau: 60, carburant: 180, medicaments: 15, munitions: 5, materiaux: 160, pieces: 90, graines: 2 },
    nature: n([1, 10], [0, 5], [2, 20], [1, 10]),
    infrastructures: { electricite: [6, 12], eau: [5, 10], carburant: [2, 5], telephone: [6, 12] },
    dangers: ["eboulement-littoral", "houle-cyclonique", "embouteillage-mortel"],
    factionsDepart: [{ faction: "garnison-du-quai", force: 1 }],
    repere: repere(55.37, -20.9)
  }),
  region({
    cle: "le-port", nom: "Le Port et La Possession", zone: "littoral", altitude: 30, population: 4, climat: { soleil: 3, pluie: 1 },
    description: `Les grues du port Est, les cuves, les darses et les quais : c'est par ici qu'arrivent le carburant, les conteneurs, presque tout ce que mange l'île. La centrale du Port Est ronronne au bord de l'eau. Au jour zéro, les dockers bloquent l'entrée, des familles supplient pour une place sur un cargo, et la Rivière des Galets roule ses galets sous le pont comme si de rien n'était.

La Possession, plus verte, monte vers Dos d'Âne, d'où l'on voit le rempart de Mafate.`,
    apres: `Le port devient une forteresse : la Garnison du Quai s'y retranche avec ce qui reste d'uniformes et de conteneurs. La centrale s'arrête quand le dernier bioliquide est brûlé. Le lit de la Rivière des Galets reste l'une des portes de Mafate, et beaucoup de réfugiés la prennent.`,
    ressources: { nourriture: 1000, eau: 400, carburant: 600, medicaments: 60, munitions: 60, materiaux: 400, pieces: 300, graines: 10 },
    nature: n([1, 15], [0, 5], [3, 40], [1, 20]),
    infrastructures: { electricite: [9, 16], eau: [8, 14], carburant: [6, 12], telephone: [7, 13] },
    dangers: ["houle-cyclonique", "crue", "incendie-urbain"],
    factionsDepart: [{ faction: "garnison-du-quai", force: 3 }, { faction: "ferrailleurs", force: 1 }],
    repere: repere(55.3, -20.93)
  }),
  region({
    cle: "saint-paul", nom: "Saint-Paul et la côte Ouest", zone: "littoral", altitude: 120, population: 4, climat: { soleil: 3, pluie: 1 },
    description: `La côte sous le vent : l'étang de Saint-Paul et ses brèdes, la zone de Savanna et son hypermarché, puis Boucan, Saint-Gilles et l'Hermitage, avec le seul vrai lagon de l'île derrière sa barrière de corail. Au jour zéro, il fait beau, terriblement beau. Les touristes cherchent un vol, les plagistes ramassent les transats, et sur la route des Tamarins les gyrophares descendent vers le sud sans s'arrêter.

Les hauts de Saint-Paul, Bellemène, Le Guillaume, montent dans les champs et les savanes sèches.`,
    apres: `Le littoral Ouest est une des premières régions que la chaleur nettoie : dès le troisième mois, ses rues sont presque vides de Livides. Il se remplit alors d'humains : Ferrailleurs dans les zones commerciales, pêcheurs au port de Saint-Gilles, bandes qui se disputent les villas. L'eau y est rare : sans réseau, on vit de citernes et de forages.`,
    ressources: { nourriture: 1100, eau: 500, carburant: 320, medicaments: 80, munitions: 25, materiaux: 280, pieces: 140, graines: 25 },
    nature: n([3, 60], [1, 10], [4, 60], [2, 30]),
    infrastructures: { electricite: [8, 15], eau: [8, 14], carburant: [4, 9], telephone: [6, 12] },
    dangers: ["secheresse", "houle-australe", "incendie-foret"],
    factionsDepart: [{ faction: "ferrailleurs", force: 2 }, { faction: "barques-du-sud", force: 1 }],
    repere: repere(55.25, -21.02)
  }),
  region({
    cle: "hauts-de-l-ouest", nom: "Les Hauts de l'Ouest", zone: "hauts", altitude: 1200, population: 2, climat: { soleil: 2, pluie: 2 },
    description: `Au-dessus des savanes, la route du Maïdo grimpe à travers les champs de géranium, les cryptomérias et la forêt de tamarins des Hauts jusqu'au belvédère, à plus de deux mille mètres, d'où l'on plonge sur Mafate. Petite France, Le Guillaume, Trois-Bassins des Hauts, le Tévelave plus au sud : des bourgs de cases en bois sous tôle, des cuves à eau et des chiens qui aboient au moindre bruit de moteur.

Au jour zéro, on y entend la nouvelle à la radio, et on ferme le portail.`,
    apres: `Les Hauts de l'Ouest paraissent un refuge pendant les premières semaines, et beaucoup y montent. Mais le frais conserve les Livides, et les familles qui s'y sont réfugiées puis éteintes deviennent, des mois plus tard, des troupes lentes qui errent dans la brume. Les incendies de saison sèche, sans pompiers, ravagent la forêt.`,
    ressources: { nourriture: 300, eau: 160, carburant: 70, medicaments: 15, munitions: 15, materiaux: 160, pieces: 50, graines: 50 },
    nature: n([2, 40], [2, 30], [0, 0], [4, 80]),
    infrastructures: { electricite: [7, 14], eau: [10, 25], carburant: [3, 7], telephone: [6, 12] },
    dangers: ["incendie-foret", "brouillard-des-hauts", "gel-des-hauts"],
    factionsDepart: [{ faction: "cooperative-des-plaines", force: 1 }],
    repere: repere(55.35, -21.11)
  }),
  region({
    cle: "saint-leu", nom: "Saint-Leu et l'Étang-Salé", zone: "littoral", altitude: 150, population: 3, climat: { soleil: 3, pluie: 1 },
    description: `Saint-Leu, ses ruelles, son port de poche et les parapentes qui tournent au-dessus de la falaise ; plus loin, Les Avirons et l'Étang-Salé avec sa plage de sable noir et sa forêt de filaos. Les murs de l'ancienne sucrerie de Stella dominent la côte. Au jour zéro, les pêcheurs rentrent tôt, les surfeurs restent à l'eau, et la route des Tamarins se bouche à hauteur des échangeurs.`,
    apres: `Une région moyenne en tout : assez peuplée pour être dangereuse au début, assez sèche et chaude pour se vider plus tard. Les forêts de filaos de l'Étang-Salé deviennent un abri pour ceux qui évitent la route. Les pêcheurs du Sud y poussent leurs barques.`,
    ressources: { nourriture: 650, eau: 320, carburant: 200, medicaments: 40, munitions: 15, materiaux: 200, pieces: 80, graines: 25 },
    nature: n([2, 40], [1, 10], [3, 50], [2, 30]),
    infrastructures: { electricite: [8, 15], eau: [9, 15], carburant: [4, 9], telephone: [6, 12] },
    dangers: ["houle-australe", "secheresse", "incendie-foret"],
    factionsDepart: [{ faction: "barques-du-sud", force: 1 }, { faction: "ferrailleurs", force: 1 }],
    repere: repere(55.31, -21.21)
  }),
  region({
    cle: "saint-pierre", nom: "Saint-Louis et Saint-Pierre", zone: "littoral", altitude: 100, population: 5, climat: { soleil: 3, pluie: 1 },
    description: `La capitale du Sud et sa voisine : le front de mer de Saint-Pierre, son port, son marché couvert, le grand hôpital du Sud ; Saint-Louis, la sucrerie et la centrale du Gol, Pierrefonds et son aérodrome, son quartier militaire. Au jour zéro, le Sud est en fête d'un samedi de décembre, puis les urgences débordent sur le parking, et la RN1 se ferme sur un accident que personne ne vient dégager.`,
    apres: `Comme Saint-Denis, la ville tombe tôt et fort. Le quartier militaire de Pierrefonds tient quelques semaines. Après deux mois, la chaleur du Sud vide les rues de leurs Livides ; les Barques du Sud tiennent le port, le Dispensaire tient ce qui reste de l'hôpital, et entre eux se joue un marché fragile de poisson contre médicaments.`,
    ressources: { nourriture: 1300, eau: 700, carburant: 380, medicaments: 200, munitions: 50, materiaux: 320, pieces: 180, graines: 35 },
    nature: n([2, 40], [0, 5], [3, 40], [1, 20]),
    infrastructures: { electricite: [8, 16], eau: [9, 16], carburant: [3, 8], telephone: [6, 12] },
    dangers: ["horde-de-la-ville", "houle-australe", "crue"],
    factionsDepart: [{ faction: "dispensaire-du-sud", force: 2 }, { faction: "barques-du-sud", force: 2 }],
    repere: repere(55.45, -21.32)
  }),
  region({
    cle: "le-tampon", nom: "Le Tampon et la Plaine des Cafres", zone: "hauts", altitude: 1000, population: 3, climat: { soleil: 2, pluie: 2 },
    description: `Le Tampon s'étire en kilomètres numérotés le long de la RN3, du Douzième au Vingt-Troisième, puis la route sort des maisons et monte dans les prairies de la Plaine des Cafres : vaches, barbelés, fermes laitières, Bourg-Murat et son observatoire du volcan. L'Entre-Deux, perché sur son éperon entre deux rivières, garde ses cases créoles et ses jardins. Au jour zéro, il fait frais là-haut, et l'on allume la cheminée.`,
    apres: `Une région à deux visages : la ville du Tampon, très peuplée, tombe comme le littoral mais ne se décompose pas aussi vite ; la Plaine des Cafres, vide et froide, voit la Coopérative des Plaines s'organiser autour des fermes. Le brouillard y est quotidien, et les vieux Livides des Hauts y deviennent légion au fil des mois.`,
    ressources: { nourriture: 800, eau: 420, carburant: 220, medicaments: 60, munitions: 20, materiaux: 260, pieces: 90, graines: 60 },
    nature: n([3, 60], [2, 30], [0, 0], [3, 60]),
    infrastructures: { electricite: [7, 14], eau: [10, 20], carburant: [4, 8], telephone: [6, 12] },
    dangers: ["brouillard-des-hauts", "gel-des-hauts", "fortes-pluies"],
    factionsDepart: [{ faction: "cooperative-des-plaines", force: 2 }],
    repere: repere(55.54, -21.23)
  }),
  region({
    cle: "sud-sauvage", nom: "Saint-Joseph et le Sud sauvage", zone: "foret", altitude: 250, population: 2, climat: { soleil: 2, pluie: 3 },
    description: `Après Saint-Joseph et Petite-Île, la côte devient sauvage : falaises noires, vacoas, forêt de Mare-Longue, champs de vanille sous les arbres, Saint-Philippe et ses marines minuscules, puis le Grand Brûlé, où les coulées de la Fournaise descendent jusqu'à l'océan en coupant la RN2. Il pleut beaucoup, tout pousse, et les gens se connaissent.

Sous les coulées récentes courent des tunnels de lave que seuls quelques guides fréquentent.`,
    apres: `Peu peuplé, humide, chaud en bas : le Sud sauvage n'est jamais un enfer et devient vite l'une des régions les plus vivables de l'île, au prix de l'isolement. Les éruptions y coupent la route des Laves ; les Pèlerins de la Lave y descendent de Sainte-Rose pour prêcher.`,
    ressources: { nourriture: 350, eau: 220, carburant: 90, medicaments: 25, munitions: 10, materiaux: 150, pieces: 60, graines: 45 },
    nature: n([4, 80], [2, 30], [3, 40], [4, 80]),
    infrastructures: { electricite: [9, 18], eau: [12, 26], carburant: [3, 7], telephone: [6, 12] },
    dangers: ["eruption", "fortes-pluies", "radier-submerge"],
    factionsDepart: [{ faction: "barques-du-sud", force: 1 }, { faction: "pelerins-de-la-lave", force: 1 }],
    repere: repere(55.69, -21.37)
  }),
  region({
    cle: "fournaise", nom: "Le Piton de la Fournaise et la Plaine des Sables", zone: "volcan", altitude: 2300, population: 0, climat: { soleil: 2, pluie: 2 },
    description: `La route du Volcan quitte Bourg-Murat, traverse des landes de branles puis la Plaine des Sables, un désert rouge et noir sans un arbre, et s'arrête au Pas de Bellecombe, au bord du rempart. En contrebas, l'Enclos, le cône de la Fournaise, ses cratères et ses fumerolles. Au jour zéro, quelques randonneurs redescendent du sommet sans savoir encore ce qui se passe en bas. Le gîte du volcan affiche complet.`,
    apres: `Personne ne vit là-haut, et c'est sa force comme sa faiblesse : ni eau courante, ni bois, ni cultures possibles, un froid mordant la nuit. Les rares Livides qui y montent y restent des mois, figés par le froid. Quand la Fournaise se réveille, l'Enclos s'illumine, et toute l'île la regarde.`,
    ressources: { nourriture: 30, eau: 20, carburant: 15, medicaments: 5, munitions: 0, materiaux: 20, pieces: 10, graines: 0 },
    nature: n([1, 10], [1, 10], [0, 0], [1, 20]),
    infrastructures: { electricite: [3, 8], eau: [2, 6], carburant: [1, 3], telephone: [5, 10] },
    dangers: ["eruption", "brouillard-des-hauts", "gel-des-hauts"],
    factionsDepart: [],
    repere: repere(55.7, -21.23)
  }),
  region({
    cle: "est", nom: "L'Est : Saint-André, Saint-Benoît, Sainte-Rose", zone: "littoral", altitude: 150, population: 3, climat: { soleil: 1, pluie: 3 },
    description: `La côte au vent : la canne à perte de vue autour de Saint-André et de la sucrerie de Bois-Rouge, les temples tamouls aux couleurs vives, Bras-Panon et ses bichiques, Saint-Benoît au bord de la rivière des Marsouins, puis la route qui longe l'océan jusqu'à Sainte-Rose et Notre-Dame-des-Laves. Il pleut, souvent et fort ; les rivières descendent en torrents. Plus haut, les centrales de Takamaka et de la Rivière de l'Est turbinent l'eau des montagnes.

Au jour zéro, la pluie retient les gens chez eux, ce qui en sauve beaucoup.`,
    apres: `Grâce à l'hydraulique, l'Est garde du courant plus longtemps que le reste de l'île, quelque temps, par îlots. Sa chaleur humide décompose les Livides très vite. Mais ses rivières en crue coupent les routes, et les cyclones y frappent fort. Les Pèlerins de la Lave s'installent à Sainte-Rose.`,
    ressources: { nourriture: 800, eau: 600, carburant: 220, medicaments: 60, munitions: 15, materiaux: 260, pieces: 110, graines: 50 },
    nature: n([4, 80], [2, 30], [3, 50], [4, 80]),
    infrastructures: { electricite: [12, 28], eau: [15, 40], carburant: [4, 9], telephone: [7, 14] },
    dangers: ["fortes-pluies", "crue", "radier-submerge", "cyclone"],
    factionsDepart: [{ faction: "pelerins-de-la-lave", force: 2 }, { faction: "ferrailleurs", force: 1 }],
    repere: repere(55.71, -21.03)
  }),
  region({
    cle: "plaine-des-palmistes", nom: "La Plaine des Palmistes et Bélouve", zone: "foret", altitude: 1050, population: 1, climat: { soleil: 1, pluie: 3 },
    description: `Entre le col de Bellevue et la descente sur Saint-Benoît, la RN3 traverse un bourg de jardins, de goyaviers et de brume. Au-dessus, par la route forestière, les forêts de Bébour et de Bélouve : tamarins des Hauts couverts de mousse, fougères arborescentes, et le gîte de Bélouve au bord du vide, face au cirque de Salazie et au Trou de Fer. Au jour zéro, la pluie fine ne s'arrête pas, et la radio grésille.`,
    apres: `Peu peuplée, très humide, fraîche : la Plaine des Palmistes reste longtemps calme, puis voit passer les réfugiés de l'Est et du Tampon par la route des Plaines. Les forêts offrent bois, gibier et cachettes ; leurs vieux Livides, conservés par le frais, s'y perdent et s'y accumulent lentement.`,
    ressources: { nourriture: 180, eau: 140, carburant: 40, medicaments: 10, munitions: 8, materiaux: 100, pieces: 35, graines: 40 },
    nature: n([3, 60], [2, 40], [1, 10], [5, 100]),
    infrastructures: { electricite: [10, 24], eau: [15, 40], carburant: [3, 7], telephone: [6, 12] },
    dangers: ["brouillard-des-hauts", "fortes-pluies", "cyclone"],
    factionsDepart: [{ faction: "cooperative-des-plaines", force: 1 }],
    repere: repere(55.63, -21.13)
  }),
  region({
    cle: "cilaos", nom: "Cilaos", zone: "cirque", altitude: 1200, population: 1, climat: { soleil: 2, pluie: 2 },
    description: `On y monte par la route aux quatre cents virages depuis Saint-Louis, tunnels à une voie et précipices compris. Au bout, un bourg de cases colorées au pied du Piton des Neiges, ses thermes, ses lentilles, ses vignes en terrasses, ses broderies. Îlet à Cordes et Bras-Sec s'accrochent plus loin sur leurs plateaux. Au jour zéro, le dernier car jaune redescend presque vide, et les éboulis surveillent la route comme toujours.`,
    apres: `Une seule route, fragile : quand elle tombe sous un éboulement, Cilaos devient une île dans l'île. Peu de Livides au début, mais le cirque est frais et les garde ; les années passant, ses chemins se peuplent de silhouettes immobiles qui attendent le soleil. Les terrasses cultivées, elles, nourrissent qui sait s'en occuper.`,
    ressources: { nourriture: 200, eau: 160, carburant: 40, medicaments: 15, munitions: 8, materiaux: 90, pieces: 35, graines: 50 },
    nature: n([2, 40], [2, 30], [1, 15], [3, 60]),
    infrastructures: { electricite: [7, 13], eau: [14, 35], carburant: [2, 6], telephone: [6, 12] },
    dangers: ["eboulement-cilaos", "fortes-pluies", "gel-des-hauts"],
    factionsDepart: [{ faction: "cooperative-des-plaines", force: 1 }],
    repere: repere(55.47, -21.13)
  }),
  region({
    cle: "salazie", nom: "Salazie", zone: "cirque", altitude: 900, population: 1, climat: { soleil: 1, pluie: 3 },
    description: `Le cirque vert : on y entre par la route de Salazie depuis Saint-André, le long de la Rivière du Mât, entre les cascades du Voile de la Mariée. Salazie, Hell-Bourg et ses cases créoles à lambrequins, Grand Îlet sous ses treilles de chouchous, et tout au bout le col des Bœufs, porte de Mafate. Il pleut, la brume monte l'après-midi, et chaque ravine chante.`,
    apres: `Isolée par une route que les crues coupent souvent, Salazie nourrit bien ceux qui y restent : chouchous, cresson, camarons, bois. Ses Livides, conservés par le frais et l'ombre, s'entassent avec le temps au fond des ravines et sur les sentiers. Les Familles des Îlets y descendent troquer.`,
    ressources: { nourriture: 220, eau: 180, carburant: 50, medicaments: 15, munitions: 6, materiaux: 100, pieces: 35, graines: 55 },
    nature: n([4, 80], [2, 30], [2, 20], [4, 80]),
    infrastructures: { electricite: [7, 14], eau: [15, 40], carburant: [2, 6], telephone: [6, 12] },
    dangers: ["eboulement-salazie", "fortes-pluies", "brouillard-des-hauts"],
    factionsDepart: [{ faction: "familles-des-ilets", force: 1 }],
    repere: repere(55.52, -21.05)
  }),
  region({
    cle: "mafate", nom: "Mafate", zone: "cirque", altitude: 1000, population: 0, climat: { soleil: 2, pluie: 2 },
    description: `Le cirque sans route. On y entre à pied par le col des Bœufs, le Maïdo, le col du Taïbit, la canalisation des Orangers ou le lit de la Rivière des Galets ; l'hélicoptère y monte les vivres. Une quinzaine d'îlets, La Nouvelle, Marla, Roche-Plate, Aurère, Îlet à Bourse, quelques centaines d'habitants, des panneaux solaires sur chaque toit, des sources captées et des sentiers que les anciens connaissent les yeux fermés.

Au jour zéro, Mafate apprend la nouvelle par la radio, comme le reste du monde. Puis plus rien ne monte.`,
    apres: `Pauvre en tout ce qui se pille, riche de ce qui se cultive et se capte, Mafate est longtemps l'endroit le plus sûr de l'île : peu de monde, donc peu de morts. Mais les réfugiés y affluent par tous les sentiers, et certains montent malades. Les Familles des Îlets en gardent les cols ; elles accueillent ceux qui travaillent et refoulent ceux qui exigent.`,
    ressources: { nourriture: 60, eau: 30, carburant: 2, medicaments: 6, munitions: 2, materiaux: 40, pieces: 20, graines: 30 },
    nature: n([3, 50], [3, 40], [2, 20], [3, 60]),
    infrastructures: { electricite: null, eau: [30, 90], carburant: [0, 2], telephone: [5, 10] },
    dangers: ["fortes-pluies", "eboulement-sentier", "brouillard-des-hauts"],
    factionsDepart: [{ faction: "familles-des-ilets", force: 2 }],
    repere: repere(55.43, -21.05)
  })
];

// Routes : chaque liaison une seule fois, développée dans les deux sens (voisins symétriques). Temps en quarts (6 h) :
// environ 12 à 15 km par quart à pied sur route, 5 à 8 en sentier de montagne ; un trajet en véhicule compte au moins un quart.
// variante : un autre passage, plus lent, quand la route principale est coupée (champ ajouté au contrat).
export const ROUTES = [
  { de: "saint-denis", vers: "sainte-marie", route: "RN2, la quatre-voies de l'Est par Gillot", km: 10, terrain: "route", quartsPied: 1, quartsVehicule: 1, coupure: ["fortes-pluies"] },
  { de: "saint-denis", vers: "route-du-littoral", route: "Nouvelle route du Littoral (RN1), digue et viaduc jusqu'à la Grande Chaloupe", km: 8, terrain: "route", quartsPied: 1, quartsVehicule: 1, coupure: ["houle-cyclonique", "cyclone"],
    variante: { route: "Chemin des Anglais par La Montagne", terrain: "sentier", km: 7, quartsPied: 2 } },
  { de: "route-du-littoral", vers: "le-port", route: "Ancienne route du Littoral (RN1) sous la falaise, jusqu'à La Possession", km: 7, terrain: "route", quartsPied: 1, quartsVehicule: 1, coupure: ["eboulement-littoral", "houle-cyclonique"],
    variante: { route: "Chemin des Anglais vers La Possession", terrain: "sentier", km: 6, quartsPied: 2 } },
  { de: "le-port", vers: "saint-paul", route: "RN1, quatre-voies du Port à Saint-Paul par le pont de la Rivière des Galets", km: 11, terrain: "route", quartsPied: 1, quartsVehicule: 1, coupure: ["crue"] },
  { de: "le-port", vers: "mafate", route: "Piste du lit de la Rivière des Galets jusqu'à Deux-Bras, puis sentier vers Aurère", km: 18, terrain: "sentier", quartsPied: 3, quartsVehicule: null, coupure: ["crue", "fortes-pluies"],
    variante: { route: "Sentier de Dos d'Âne, du Cap Noir à Deux-Bras puis Aurère", terrain: "sentier", km: 12, quartsPied: 3 } },
  { de: "saint-paul", vers: "mafate", route: "Canalisation des Orangers depuis Sans-Souci, vers l'Îlet des Orangers", km: 13, terrain: "sentier", quartsPied: 2, quartsVehicule: null, coupure: ["eboulement-sentier", "fortes-pluies"] },
  { de: "saint-paul", vers: "hauts-de-l-ouest", route: "Route du Maïdo par Le Guillaume et Petite France", km: 20, terrain: "route", quartsPied: 2, quartsVehicule: 1, coupure: ["incendie-foret", "brouillard-des-hauts"] },
  { de: "saint-paul", vers: "saint-leu", route: "Route des Tamarins (RN1), ou la route littorale par Saint-Gilles", km: 22, terrain: "route", quartsPied: 2, quartsVehicule: 1, coupure: ["incendie-foret"] },
  { de: "hauts-de-l-ouest", vers: "saint-leu", route: "Route Hubert-Delisle à mi-pente, puis la descente des Avirons", km: 18, terrain: "route", quartsPied: 2, quartsVehicule: 1, coupure: ["incendie-foret", "fortes-pluies"] },
  { de: "hauts-de-l-ouest", vers: "mafate", route: "Sentier du Maïdo : descente du rempart vers Roche-Plate", km: 8, terrain: "sentier", quartsPied: 2, quartsVehicule: null, coupure: ["eboulement-sentier", "brouillard-des-hauts"] },
  { de: "saint-leu", vers: "saint-pierre", route: "RN1 par l'Étang-Salé et Saint-Louis", km: 20, terrain: "route", quartsPied: 2, quartsVehicule: 1, coupure: ["crue"] },
  { de: "saint-pierre", vers: "cilaos", route: "Route de Cilaos (RN5) et ses quatre cents virages, depuis Saint-Louis", km: 37, terrain: "route", quartsPied: 3, quartsVehicule: 1, coupure: ["eboulement-cilaos", "fortes-pluies", "cyclone"] },
  { de: "saint-pierre", vers: "le-tampon", route: "RN3, la quatre-voies de Saint-Pierre au Tampon", km: 12, terrain: "route", quartsPied: 1, quartsVehicule: 1, coupure: [] },
  { de: "saint-pierre", vers: "sud-sauvage", route: "RN2 par Petite-Île et Saint-Joseph", km: 18, terrain: "route", quartsPied: 2, quartsVehicule: 1, coupure: ["radier-submerge", "crue"] },
  { de: "le-tampon", vers: "plaine-des-palmistes", route: "RN3, route des Plaines, par Bourg-Murat et le col de Bellevue", km: 25, terrain: "route", quartsPied: 2, quartsVehicule: 1, coupure: ["brouillard-des-hauts", "fortes-pluies", "cyclone"] },
  { de: "le-tampon", vers: "fournaise", route: "Route du Volcan, de Bourg-Murat au Pas de Bellecombe par la Plaine des Sables", km: 27, terrain: "route", quartsPied: 3, quartsVehicule: 1, coupure: ["eruption", "brouillard-des-hauts"] },
  { de: "fournaise", vers: "sud-sauvage", route: "GR R2 : du gîte du Volcan à Basse-Vallée, sans un point d'eau", km: 18, terrain: "sentier", quartsPied: 2, quartsVehicule: null, coupure: ["eruption", "brouillard-des-hauts"] },
  { de: "sud-sauvage", vers: "est", route: "RN2, route des Laves à travers le Grand Brûlé jusqu'à Sainte-Rose et Saint-Benoît", km: 48, terrain: "route", quartsPied: 4, quartsVehicule: 1, coupure: ["eruption", "fortes-pluies", "radier-submerge"] },
  { de: "est", vers: "sainte-marie", route: "RN2 par Sainte-Suzanne et Saint-André", km: 16, terrain: "route", quartsPied: 2, quartsVehicule: 1, coupure: ["radier-submerge", "crue"] },
  { de: "est", vers: "plaine-des-palmistes", route: "RN3, la montée de Saint-Benoît à la Plaine des Palmistes", km: 16, terrain: "route", quartsPied: 2, quartsVehicule: 1, coupure: ["fortes-pluies", "cyclone"] },
  { de: "est", vers: "salazie", route: "Route de Salazie (RD48) le long de la Rivière du Mât, de Saint-André à Hell-Bourg", km: 26, terrain: "route", quartsPied: 2, quartsVehicule: 1, coupure: ["eboulement-salazie", "crue", "fortes-pluies"] },
  { de: "plaine-des-palmistes", vers: "salazie", route: "Route forestière de Bébour-Bélouve puis le sentier de Bélouve à Hell-Bourg", km: 24, terrain: "sentier", quartsPied: 3, quartsVehicule: null, coupure: ["fortes-pluies", "brouillard-des-hauts"] },
  { de: "salazie", vers: "mafate", route: "Col des Bœufs depuis Grand Îlet, puis la descente vers La Nouvelle", km: 12, terrain: "sentier", quartsPied: 2, quartsVehicule: null, coupure: ["eboulement-sentier", "brouillard-des-hauts"] },
  { de: "cilaos", vers: "mafate", route: "Col du Taïbit, de Cilaos à Marla", km: 10, terrain: "sentier", quartsPied: 2, quartsVehicule: null, coupure: ["eboulement-sentier", "brouillard-des-hauts"] },
  { de: "cilaos", vers: "salazie", route: "GR R1 par le Bloc et la Caverne Dufour, sous le Piton des Neiges", km: 16, terrain: "sentier", quartsPied: 3, quartsVehicule: null, coupure: ["gel-des-hauts", "brouillard-des-hauts"] }
];

// Développe les routes en voisins des deux côtés.
export function voisinsDepuisRoutes(regions, routes = ROUTES) {
  const parCle = new Map(regions.map(r => [r.cle, { ...r, voisins: [] }]));
  for (const { de, vers, ...route } of routes) {
    for (const [a, b] of [[de, vers], [vers, de]]) {
      const r = parCle.get(a);
      if (!r) throw new Error(`Route vers une région inconnue : ${a}`);
      r.voisins.push({ region: b, route: route.route, km: route.km, terrain: route.terrain, quartsPied: route.quartsPied,
        quartsVehicule: route.quartsVehicule, coupure: [...route.coupure], ...(route.variante ? { variante: { ...route.variante } } : {}) });
    }
  }
  return [...parCle.values()];
}
