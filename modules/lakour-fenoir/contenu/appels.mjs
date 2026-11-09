// Appels radio et demandes des factions (contrat §9, repris des contrats de Warcraft) : des missions (escorte, récupération,
// réparation, sauvetage, échange) avec récompense en ressources et points de réputation. Chaque résultat de table porte ses
// données pour le moteur dans flags.lakour-fenoir.appel = { type, recompense: { ressource: n }, faction, reputation }.
// Le MJ IA en tire trois par semaine de jeu quand le groupe a une radio (sans doublon : lancer_table). Textes originaux.
import { MODULE, table } from "./aides.mjs";

export const TYPES_APPEL = { escorte: "Escorte", recuperation: "Récupération", reparation: "Réparation", sauvetage: "Sauvetage", echange: "Échange" };

// a = [type, titre, texte, recompense, faction | null, reputation]
function tableAppels(cle, nom, description, appels) {
  const lignes = appels.map(([type, titre, texte, recompense, faction, reputation]) => {
    if (!TYPES_APPEL[type]) throw new Error(`Appel « ${titre} » : type inconnu ${type}`);
    const prix = Object.entries(recompense).map(([r, n]) => `${n} ${r}`).join(", ");
    return { texte: `**${TYPES_APPEL[type]} — ${titre}.** ${texte}\n\n**Récompense :** ${prix}${faction ? ` ; réputation +${reputation}` : ""}.`, appel: { type, recompense, faction, reputation } };
  });
  const t = table({ cle, nom, description, resultats: lignes.map(l => l.texte) });
  t.results.forEach((r, i) => { r.flags = { [MODULE]: { appel: lignes[i].appel } }; });
  t.flags[MODULE].appels = true;
  return t;
}

const DESC = "Le MJ IA tire trois appels par semaine de jeu quand le groupe a une radio (sans doublon) ; le MJ humain en lit un quand la radio grésille.";

export const APPELS_RADIO = tableAppels("appels-radio", "Appels radio", DESC, [
  ["sauvetage", "La famille du onzième étage", "Une voix d'enfant sur une fréquence de talkie : sa famille est bloquée au onzième étage d'un immeuble de Saint-Denis, l'escalier envahi.", { nourriture: 6, materiaux: 4 }, null, 0],
  ["recuperation", "Les médicaments de la pharmacie du bourg", "Le Dispensaire cherche des volontaires pour vider une pharmacie de Saint-Louis avant les Sans-Lune.", { medicaments: 4, munitions: 2 }, "dispensaire-du-sud", 2],
  ["reparation", "La pompe de l'îlet", "Une voix de Mafate : la conduite du captage de l'îlet a sauté après les pluies, il faut des pièces et des bras.", { nourriture: 6, graines: 4 }, "familles-des-ilets", 2],
  ["escorte", "Le convoi de lait", "La Coopérative veut descendre du lait et du fromage au Tampon et demande une escorte jusqu'au marché.", { nourriture: 10 }, "cooperative-des-plaines", 2],
  ["echange", "Carburant contre médicaments", "Un bateau des Barques du Sud propose du gasoil contre des antibiotiques, sur le quai de Saint-Leu, demain à l'aube.", { carburant: 6 }, "barques-du-sud", 1],
  ["sauvetage", "Les randonneurs du Piton", "Trois randonneurs coincés au refuge du Piton des Neiges depuis le jour zéro appellent à l'aide : un blessé, plus de vivres.", { pieces: 3, medicaments: 2 }, null, 0],
  ["recuperation", "Les panneaux de la ferme", "Une agricultrice de Bras-Panon offre la moitié des panneaux de sa ferme abandonnée à qui l'aide à récupérer l'autre moitié.", { pieces: 6 }, null, 0],
  ["escorte", "La docteure en tournée", "Le Dispensaire veut envoyer une médecin soigner les fièvres d'un quartier de l'Est et cherche une escorte.", { medicaments: 3, nourriture: 4 }, "dispensaire-du-sud", 2],
  ["reparation", "L'antenne de la Garnison", "La Garnison du Quai cherche un électricien pour remonter une antenne relais tombée sur la Possession.", { carburant: 5, munitions: 3 }, "garnison-du-quai", 2],
  ["echange", "Le marché aux pièces", "Les Ferrailleurs annoncent un marché sur le parking de Savanna : batteries, pneus, outils contre vivres.", { pieces: 5, materiaux: 3 }, "ferrailleurs", 1],
  ["sauvetage", "L'enfant de Sainte-Rose", "Les Pèlerins cherchent un enfant parti seul vers la coulée ; la radio du presbytère promet de quoi manger à qui le ramène.", { nourriture: 8 }, "pelerins-de-la-lave", 2],
  ["recuperation", "La caisse de la caserne", "Un gendarme blessé, caché dans une brigade du Sud, parle d'une caisse de matériel radio et de rations sous le bureau du chef.", { munitions: 3, nourriture: 6 }, "garnison-du-quai", 1],
  ["sauvetage", "Les cousins de Kawéni", "Une femme parle shimaoré, puis français : ses cousins arrivés de Mayotte la veille du jour zéro sont bloqués dans une case du Chaudron. Ses voisins ont refusé d'y aller, « *pa nout zafèr* » (pas notre affaire) ; elle offre tout ce qu'elle a.", { nourriture: 5, materiaux: 4 }, null, 0],
  ["echange", "Le carnet de Madame Thiaw-Kine", "La boutiquière chinoise de la Rivière Saint-Louis propose son arrière-boutique contre une escorte jusqu'à Cilaos, et raye du carnet les dettes de ceux qui l'aident. On dit qu'elle ne fait crédit qu'aux siens ; son carnet a nourri tout le quartier pendant la grève de 2009.", { nourriture: 8, graines: 2 }, null, 0]
]);

export const DEMANDES = [
  tableAppels("demandes-garnison-du-quai", "Demandes — La Garnison du Quai", DESC, [
    ["recuperation", "Les cuves de Savanna", "Vider la cuve de carburant d'une station de la zone de Savanna et la ramener au Port.", { carburant: 4, munitions: 2 }, "garnison-du-quai", 2],
    ["escorte", "Le recenseur", "Escorter un sous-officier qui « recense les survivants » dans les hauts de La Possession.", { nourriture: 6 }, "garnison-du-quai", 1],
    ["reparation", "La grue numéro trois", "Remettre en marche le moteur d'une grue pour décharger un cargo arrivé de nuit.", { carburant: 6, pieces: 2 }, "garnison-du-quai", 3],
    ["sauvetage", "La patrouille perdue", "Retrouver une patrouille partie sur la route du Littoral et qui ne répond plus.", { munitions: 4, medicaments: 2 }, "garnison-du-quai", 3],
    ["echange", "Un médecin contre du carburant", "Ils offrent du carburant si un soignant du groupe passe une semaine à leur infirmerie.", { carburant: 8 }, "garnison-du-quai", 2],
    ["recuperation", "Les armes de la brigade", "Récupérer le contenu de l'armurerie d'une brigade abandonnée de l'Ouest avant les Sans-Lune.", { munitions: 5 }, "garnison-du-quai", 3]
  ]),
  tableAppels("demandes-cooperative-des-plaines", "Demandes — La Coopérative des Plaines", DESC, [
    ["escorte", "La transhumance", "Mener vingt vaches d'une ferme menacée de la Plaine des Cafres à une autre, à travers le brouillard.", { nourriture: 10 }, "cooperative-des-plaines", 2],
    ["recuperation", "Les semences de la jardinerie", "Rapporter les sachets de graines d'une jardinerie du Tampon.", { nourriture: 6, graines: 3 }, "cooperative-des-plaines", 2],
    ["reparation", "Le tracteur de Mémé Lucette", "Remettre en marche un vieux tracteur pour les labours avant les pluies.", { nourriture: 8 }, "cooperative-des-plaines", 2],
    ["sauvetage", "Le berger dans la ravine", "Un jeune berger est tombé dans une ravine en poursuivant une génisse.", { nourriture: 6, materiaux: 2 }, "cooperative-des-plaines", 3],
    ["echange", "Fromage contre outils", "Échanger des tommes et du lait contre des outils et des clous.", { nourriture: 8 }, "cooperative-des-plaines", 1],
    ["escorte", "Le marché de Bourg-Murat", "Garder le marché du samedi contre une bande qui rôde.", { nourriture: 6, graines: 2 }, "cooperative-des-plaines", 2]
  ]),
  tableAppels("demandes-ferrailleurs", "Demandes — Les Ferrailleurs", DESC, [
    ["recuperation", "Le dépôt de batteries", "Vider un dépôt de batteries d'un magasin d'autos dans une zone infestée.", { pieces: 6 }, "ferrailleurs", 2],
    ["escorte", "Le camion de la casse", "Escorter un camion chargé de pièces de la Rivière des Galets à Saint-Pierre.", { pieces: 4, carburant: 2 }, "ferrailleurs", 2],
    ["reparation", "Le treuil de la casse", "Réparer le treuil qui soulève les carcasses de voitures.", { pieces: 5 }, "ferrailleurs", 1],
    ["echange", "Les panneaux du lycée", "Ils achètent les panneaux d'un lycée que vous connaissez ; ou vous les vendent.", { pieces: 4, materiaux: 4 }, "ferrailleurs", 1],
    ["sauvetage", "Gros Mani a disparu", "Le chef de la casse n'est pas rentré d'une fouille au Port.", { pieces: 6, munitions: 2 }, "ferrailleurs", 3],
    ["recuperation", "Le bateau échoué", "Démonter le moteur d'un bateau échoué sur les galets de la Rivière des Galets.", { pieces: 5, carburant: 2 }, "ferrailleurs", 2]
  ]),
  tableAppels("demandes-barques-du-sud", "Demandes — Les Barques du Sud", DESC, [
    ["recuperation", "Les filets de la coopérative", "Rapporter les filets et cordages d'un hangar de pêche de Saint-Leu.", { nourriture: 8 }, "barques-du-sud", 2],
    ["escorte", "Le déchargement de nuit", "Garder le quai pendant qu'une barque décharge à Saint-Philippe.", { nourriture: 6, carburant: 2 }, "barques-du-sud", 1],
    ["reparation", "Le hors-bord de la Marine", "Remettre en état un moteur hors-bord noyé par la houle.", { nourriture: 8 }, "barques-du-sud", 2],
    ["sauvetage", "La barque à la dérive", "Une barque à la dérive au large de l'Étang-Salé, son pêcheur blessé à bord.", { nourriture: 10 }, "barques-du-sud", 3],
    ["echange", "Poisson séché contre médicaments", "Échanger des médicaments contre une réserve de poisson séché.", { nourriture: 12 }, "barques-du-sud", 1],
    ["escorte", "Le passage de la route des Laves", "Accompagner par la route une famille de pêcheurs qui rejoint Saint-Philippe.", { nourriture: 6 }, "barques-du-sud", 2]
  ]),
  tableAppels("demandes-pelerins-de-la-lave", "Demandes — Les Pèlerins de la Lave", DESC, [
    ["recuperation", "Les cierges de la cathédrale", "Rapporter cierges et vin de messe d'une église de Saint-Denis.", { nourriture: 6, eau: 6 }, "pelerins-de-la-lave", 2],
    ["sauvetage", "Les fidèles de Saint-Benoît", "Ramener une famille de fidèles coincée dans Saint-Benoît.", { nourriture: 8 }, "pelerins-de-la-lave", 3],
    ["escorte", "La procession", "Protéger une procession qui va prier au bord de la coulée.", { nourriture: 6, medicaments: 1 }, "pelerins-de-la-lave", 2],
    ["reparation", "La citerne du presbytère", "Réparer la citerne fissurée de Notre-Dame-des-Laves.", { eau: 10, nourriture: 4 }, "pelerins-de-la-lave", 2],
    ["echange", "Leur charité contre la vôtre", "Ils offrent de soigner un blessé du groupe si l'un de vous assiste à leurs veillées une semaine.", { medicaments: 3 }, "pelerins-de-la-lave", 1],
    ["sauvetage", "Le prêcheur parti", "Frère Expédit est parti seul vers le volcan ; ses fidèles supplient qu'on le ramène.", { nourriture: 8, eau: 4 }, "pelerins-de-la-lave", 3]
  ]),
  tableAppels("demandes-familles-des-ilets", "Demandes — Les Familles des Îlets", DESC, [
    ["recuperation", "Les médicaments de La Possession", "Monter à La Nouvelle les médicaments d'une pharmacie des Bas.", { nourriture: 6, graines: 4 }, "familles-des-ilets", 3],
    ["reparation", "Le régulateur de l'école", "Remplacer le régulateur solaire de l'école d'Aurère.", { nourriture: 6 }, "familles-des-ilets", 2],
    ["escorte", "La descente au col", "Accompagner des anciens au col des Bœufs pour un troc avec Salazie.", { nourriture: 5, graines: 3 }, "familles-des-ilets", 2],
    ["sauvetage", "Le sentier de la canalisation", "Un porteur est tombé sur la canalisation des Orangers ; il faut le remonter.", { nourriture: 6 }, "familles-des-ilets", 3],
    ["echange", "Lentilles contre pièces", "Des lentilles et des patates contre des pièces électriques.", { nourriture: 10 }, "familles-des-ilets", 1],
    ["reparation", "Le captage emporté", "Refaire le captage d'un îlet emporté par une crue.", { nourriture: 8, graines: 2 }, "familles-des-ilets", 3]
  ]),
  tableAppels("demandes-dispensaire-du-sud", "Demandes — Le Dispensaire du Sud", DESC, [
    ["recuperation", "Le frigo des vaccins", "Rapporter le contenu d'une réserve de pharmacie hospitalière dans une aile infestée.", { medicaments: 6 }, "dispensaire-du-sud", 3],
    ["reparation", "Le groupe électrogène des blocs", "Faire repartir le groupe électrogène des blocs opératoires.", { medicaments: 4, carburant: 2 }, "dispensaire-du-sud", 2],
    ["escorte", "La tournée des fièvres", "Escorter une infirmière dans les quartiers où la dengue progresse.", { medicaments: 3 }, "dispensaire-du-sud", 2],
    ["sauvetage", "Le pharmacien de l'Entre-Deux", "Ramener un pharmacien coincé chez lui avec sa famille.", { medicaments: 5 }, "dispensaire-du-sud", 3],
    ["echange", "Eau propre contre soins", "De l'eau propre en quantité contre des soins pour tout le groupe.", { medicaments: 4 }, "dispensaire-du-sud", 1],
    ["recuperation", "Un Livide entier", "La docteure veut étudier un Livide intact, ramené vivant… si l'on peut dire.", { medicaments: 6, munitions: 2 }, "dispensaire-du-sud", 3]
  ]),
  tableAppels("demandes-sans-lune", "Demandes — Les Sans-Lune", DESC, [
    ["recuperation", "Le coffre de la bijouterie", "Le Comptable veut le contenu d'un coffre du centre-ville.", { munitions: 4, nourriture: 6 }, "sans-lune", 2],
    ["escorte", "Le collecteur", "Accompagner un collecteur de tribut dans un quartier qui refuse de payer.", { nourriture: 8 }, "sans-lune", 2],
    ["echange", "Ce qu'ils ont pris", "Ils vendent ce qu'ils ont pillé : vivres et médicaments contre munitions.", { nourriture: 6, medicaments: 2 }, "sans-lune", 1],
    ["sauvetage", "Un des leurs", "Libérer un jeune de la bande retenu par la Garnison (la Garnison ne l'oubliera pas).", { munitions: 5 }, "sans-lune", 3],
    ["recuperation", "Le stock du grossiste", "Vider l'entrepôt d'un grossiste de Sainte-Marie avant la Coopérative.", { nourriture: 10 }, "sans-lune", 2],
    ["reparation", "Les lampes de la planque", "Faire marcher les panneaux de leur planque.", { munitions: 3, nourriture: 4 }, "sans-lune", 1]
  ])
];
