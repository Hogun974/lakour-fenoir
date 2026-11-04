// Cartes de lieux de Fénoir (contrat §9) : des plans génériques que le MJ IA active quand le récit y mène, pour placer les
// jetons (« près de la citerne », « derrière les caisses »). Case de 1,5 m. Clés « lieu-… » ; les éléments nommés servent de
// repères. Une grande pièce de fond couvre la carte et les bâtiments sont posés par-dessus (seuls leurs bords font des murs).
import { scene } from "./cartes.mjs";

export function rangee(type, cote, x, y, n) {
  const horizontal = cote === "nord" || cote === "sud";
  return Array.from({ length: n }, (_, i) => ({ x: horizontal ? x + i : x, y: horizontal ? y : y + i, cote, type }));
}

export const CARTES_LIEUX = [
  scene({ cle: "lieu-case-creole", nom: "Lieu — Case créole à varangue",
    description: "Une case créole de bois sous tôle, sa varangue ouverte sur la cour, sa salle, ses chambres, sa cuisine au feu de bois à part, sa citerne, son letchi et son poulailler. Pour un premier abri, une visite chez un gramoun, une fouille, une nuit de siège.",
    plan: {
      largeur: 20, hauteur: 16, lumiere: "jour",
      pieces: [
        { nom: "Cour", x: 0, y: 0, l: 20, h: 16, sol: "herbe" },
        { nom: "Varangue", x: 3, y: 3, l: 12, h: 2, sol: "bois" },
        { nom: "Salle", x: 3, y: 5, l: 6, h: 5, sol: "bois" },
        { nom: "Chambres", x: 9, y: 5, l: 6, h: 5, sol: "bois" },
        { nom: "Cuisine au feu de bois", x: 16, y: 6, l: 4, h: 4, sol: "terre" }
      ],
      ouvertures: [
        ...rangee("passage", "nord", 3, 3, 12),
        { x: 5, y: 5, cote: "nord", type: "porte" }, { x: 11, y: 5, cote: "nord", type: "porte" }, { x: 8, y: 7, cote: "est", type: "porte" },
        { x: 16, y: 8, cote: "ouest", type: "porte" }, { x: 3, y: 7, cote: "ouest", type: "fenetre" }, { x: 14, y: 7, cote: "est", type: "fenetre" },
        { x: 6, y: 9, cote: "sud", type: "fenetre" }, { x: 12, y: 9, cote: "sud", type: "fenetre" }
      ],
      lumieres: [{ x: 17, y: 7, rayon: 2, couleur: "#ff9a40" }],
      elements: [
        { nom: "Citerne", x: 1, y: 12, l: 2, h: 2 }, { nom: "Letchi", x: 6, y: 12, l: 3, h: 3 }, { nom: "Poulailler", x: 11, y: 13, l: 3, h: 2 },
        { nom: "Foyer", x: 18, y: 8, l: 1, h: 1 }, { nom: "Table", x: 5, y: 7, l: 2, h: 1 }, { nom: "Lit", x: 12, y: 6, l: 2, h: 2 },
        { nom: "Barrière", x: 0, y: 15, l: 20, h: 1 }
      ]
    } }),

  scene({ cle: "lieu-college", nom: "Lieu — Collège",
    description: "Un collège de l'île : deux bâtiments de classes, une cour, une cantine, une infirmerie, un gymnase et le grillage tout autour. Pour un centre d'accueil débordé, un abri pour beaucoup de monde, une fouille du CDI, une défense de périmètre.",
    plan: {
      largeur: 30, hauteur: 22, lumiere: "jour",
      pieces: [
        { nom: "Cour", x: 0, y: 0, l: 30, h: 22, sol: "pierre" },
        { nom: "Salles de classe", x: 2, y: 2, l: 12, h: 5, sol: "pierre" },
        { nom: "CDI et laboratoire", x: 16, y: 2, l: 12, h: 5, sol: "pierre" },
        { nom: "Infirmerie", x: 2, y: 9, l: 5, h: 4, sol: "pierre" },
        { nom: "Cantine", x: 2, y: 15, l: 10, h: 5, sol: "pierre" },
        { nom: "Gymnase", x: 16, y: 14, l: 12, h: 6, sol: "bois" }
      ],
      ouvertures: [
        { x: 5, y: 6, cote: "sud", type: "porte" }, { x: 11, y: 6, cote: "sud", type: "porte" }, { x: 19, y: 6, cote: "sud", type: "porte" },
        { x: 25, y: 6, cote: "sud", type: "porte" }, { x: 6, y: 10, cote: "est", type: "porte" }, { x: 6, y: 15, cote: "nord", type: "porte" },
        ...rangee("porte", "nord", 21, 14, 2), { x: 2, y: 4, cote: "ouest", type: "fenetre" }, { x: 27, y: 4, cote: "est", type: "fenetre" },
        { x: 11, y: 17, cote: "est", type: "fenetre" }
      ],
      lumieres: [],
      elements: [
        { nom: "Préau", x: 9, y: 9, l: 6, h: 3 }, { nom: "Portail", x: 14, y: 21, l: 3, h: 1 }, { nom: "Rayonnages", x: 18, y: 3, l: 4, h: 1 },
        { nom: "Paillasses de laboratoire", x: 23, y: 4, l: 3, h: 1 }, { nom: "Lit d'infirmerie", x: 3, y: 10, l: 2, h: 1 },
        { nom: "Tables de cantine", x: 4, y: 17, l: 6, h: 1 }, { nom: "Tapis de sol", x: 19, y: 16, l: 5, h: 2 }, { nom: "Jardin pédagogique", x: 24, y: 9, l: 4, h: 3 }
      ]
    } }),

  scene({ cle: "lieu-station-service", nom: "Lieu — Station-service",
    description: "Une station-service de bord de quatre-voies : pistes et pompes sous l'auvent, boutique, atelier de lavage et de vidange, cuves enterrées. Pour la dernière file d'attente, un pillage, une embuscade, une cuve à vider.",
    plan: {
      largeur: 24, hauteur: 16, lumiere: "jour",
      pieces: [
        { nom: "Pistes", x: 0, y: 0, l: 24, h: 16, sol: "pierre" },
        { nom: "Boutique", x: 15, y: 2, l: 7, h: 6, sol: "pierre" },
        { nom: "Atelier", x: 15, y: 9, l: 7, h: 5, sol: "metal" }
      ],
      ouvertures: [
        { x: 15, y: 4, cote: "ouest", type: "porte" }, { x: 15, y: 11, cote: "ouest", type: "passage" }, { x: 15, y: 12, cote: "ouest", type: "passage" },
        { x: 18, y: 7, cote: "sud", type: "porte" }, { x: 15, y: 6, cote: "ouest", type: "fenetre" }, { x: 21, y: 4, cote: "est", type: "verrouillee" }
      ],
      lumieres: [{ x: 7, y: 6, rayon: 4, couleur: "#e8f0ff" }],
      elements: [
        { nom: "Pompes", x: 4, y: 5, l: 1, h: 3 }, { nom: "Pompes", x: 9, y: 5, l: 1, h: 3 }, { nom: "Auvent", x: 2, y: 3, l: 10, h: 1 },
        { nom: "Trappes des cuves", x: 3, y: 12, l: 3, h: 1 }, { nom: "Comptoir", x: 17, y: 3, l: 3, h: 1 }, { nom: "Rayons", x: 17, y: 5, l: 3, h: 1 },
        { nom: "Pont élévateur", x: 18, y: 11, l: 2, h: 2 }, { nom: "Voiture abandonnée", x: 6, y: 9, l: 2, h: 1 }
      ]
    } }),

  scene({ cle: "lieu-supermarche", nom: "Lieu — Supermarché",
    description: "Un supermarché de zone commerciale : parking, surface de vente aux rayons renversés, caisses, réserve, quai de livraison. Pour une fouille dangereuse, une négociation avec ceux qui l'occupent, une alarme qui attire une horde.",
    plan: {
      largeur: 30, hauteur: 22, lumiere: "penombre",
      pieces: [
        { nom: "Parking", x: 0, y: 0, l: 30, h: 22, sol: "pierre" },
        { nom: "Surface de vente", x: 2, y: 2, l: 19, h: 12, sol: "pierre" },
        { nom: "Réserve", x: 21, y: 2, l: 7, h: 12, sol: "metal" },
        { nom: "Quai de livraison", x: 21, y: 14, l: 7, h: 4, sol: "pierre" }
      ],
      ouvertures: [
        ...rangee("porte", "sud", 9, 13, 3), { x: 21, y: 6, cote: "ouest", type: "porte" }, { x: 24, y: 14, cote: "nord", type: "porte" },
        { x: 25, y: 17, cote: "sud", type: "passage" }, { x: 26, y: 17, cote: "sud", type: "passage" }, { x: 27, y: 9, cote: "est", type: "verrouillee" }
      ],
      lumieres: [{ x: 10, y: 8, rayon: 3, couleur: "#d8e8ff" }],
      elements: [
        { nom: "Rayons", x: 4, y: 3, l: 1, h: 7 }, { nom: "Rayons", x: 7, y: 3, l: 1, h: 7 }, { nom: "Rayons", x: 10, y: 3, l: 1, h: 7 },
        { nom: "Rayons", x: 13, y: 3, l: 1, h: 7 }, { nom: "Rayons", x: 16, y: 3, l: 1, h: 7 }, { nom: "Caisses", x: 5, y: 11, l: 12, h: 1 },
        { nom: "Palettes", x: 23, y: 4, l: 3, h: 2 }, { nom: "Chambre froide", x: 23, y: 9, l: 3, h: 3 }, { nom: "Chariots", x: 3, y: 17, l: 2, h: 2 },
        { nom: "Voitures abandonnées", x: 9, y: 17, l: 6, h: 2 }
      ]
    } }),

  scene({ cle: "lieu-gite", nom: "Lieu — Gîte de montagne",
    description: "Un gîte de randonneurs des Hauts ou d'un cirque : salle commune et son poêle, dortoir, sanitaires, citerne, réserve de bois, clairière dans le brouillard. Pour une halte sur un sentier, un refuge assiégé, une rencontre avec d'autres survivants.",
    plan: {
      largeur: 20, hauteur: 14, lumiere: "penombre",
      pieces: [
        { nom: "Clairière", x: 0, y: 0, l: 20, h: 14, sol: "herbe" },
        { nom: "Salle commune", x: 3, y: 3, l: 8, h: 6, sol: "bois" },
        { nom: "Dortoir", x: 11, y: 3, l: 6, h: 6, sol: "bois" },
        { nom: "Sanitaires", x: 11, y: 9, l: 3, h: 2, sol: "pierre" }
      ],
      ouvertures: [
        { x: 6, y: 8, cote: "sud", type: "porte" }, { x: 11, y: 5, cote: "ouest", type: "porte" }, { x: 12, y: 9, cote: "nord", type: "porte" },
        { x: 3, y: 5, cote: "ouest", type: "fenetre" }, { x: 16, y: 5, cote: "est", type: "fenetre" }, { x: 8, y: 3, cote: "nord", type: "fenetre" }
      ],
      lumieres: [{ x: 4, y: 4, rayon: 3, couleur: "#ff9a40" }],
      elements: [
        { nom: "Poêle", x: 4, y: 4, l: 1, h: 1 }, { nom: "Grande table", x: 6, y: 5, l: 3, h: 2 }, { nom: "Lits superposés", x: 12, y: 4, l: 4, h: 1 },
        { nom: "Lits superposés", x: 12, y: 7, l: 4, h: 1 }, { nom: "Citerne", x: 17, y: 10, l: 2, h: 2 }, { nom: "Tas de bois", x: 1, y: 10, l: 3, h: 1 },
        { nom: "Panneau des sentiers", x: 9, y: 12, l: 1, h: 1 }
      ]
    } }),

  scene({ cle: "lieu-tunnel-de-lave", nom: "Lieu — Tunnel de lave",
    description: "Un tube de lave sous une coulée : entrée basse entre deux dalles, galerie aux voûtes lisses, salle plus large, boyau qui s'enfonce dans le noir. Pour un refuge discret, une exploration à la frontale, un Livide égaré dans le noir.",
    plan: {
      largeur: 30, hauteur: 12, lumiere: "nuit",
      pieces: [
        { nom: "Coulée", x: 0, y: 0, l: 30, h: 12, sol: "cendre" },
        { nom: "Entrée basse", x: 2, y: 5, l: 3, h: 2, sol: "cendre" },
        { nom: "Galerie", x: 5, y: 5, l: 12, h: 2, sol: "cendre" },
        { nom: "Grande salle", x: 17, y: 3, l: 6, h: 6, sol: "cendre" },
        { nom: "Boyau", x: 23, y: 6, l: 6, h: 1, sol: "cendre" }
      ],
      ouvertures: [
        { x: 2, y: 5, cote: "ouest", type: "passage" }, { x: 2, y: 6, cote: "ouest", type: "passage" },
        { x: 5, y: 5, cote: "ouest", type: "passage" }, { x: 5, y: 6, cote: "ouest", type: "passage" },
        { x: 17, y: 5, cote: "ouest", type: "passage" }, { x: 17, y: 6, cote: "ouest", type: "passage" }, { x: 23, y: 6, cote: "ouest", type: "passage" }
      ],
      lumieres: [{ x: 3, y: 5, rayon: 2, couleur: "#cfd8e0" }],
      elements: [
        { nom: "Dalles effondrées", x: 9, y: 5, l: 2, h: 1 }, { nom: "Stalactites de lave", x: 19, y: 4, l: 2, h: 1 },
        { nom: "Cordes de lave", x: 13, y: 6, l: 3, h: 1 }, { nom: "Réserve", x: 21, y: 7, l: 2, h: 1 }, { nom: "Puits de lumière", x: 19, y: 7, l: 1, h: 1 }
      ]
    } }),

  scene({ cle: "lieu-ilet", nom: "Lieu — Îlet de Mafate",
    description: "Un îlet de Mafate sur son plateau : quelques cases de bois sous tôle avec leurs panneaux, la petite école, la chapelle, les jardins en terrasse, la source captée, l'aire de l'hélicoptère et le sentier qui plonge vers la ravine. Pour une demande d'entrée, une quarantaine, un troc, une veillée.",
    plan: {
      largeur: 28, hauteur: 20, lumiere: "jour",
      pieces: [
        { nom: "Plateau", x: 0, y: 0, l: 28, h: 20, sol: "herbe" },
        { nom: "Case de l'ancienne", x: 3, y: 3, l: 5, h: 4, sol: "bois" },
        { nom: "Case des voisins", x: 10, y: 3, l: 5, h: 4, sol: "bois" },
        { nom: "École", x: 18, y: 3, l: 7, h: 5, sol: "bois" },
        { nom: "Chapelle", x: 3, y: 12, l: 5, h: 5, sol: "pierre" }
      ],
      ouvertures: [
        { x: 5, y: 6, cote: "sud", type: "porte" }, { x: 12, y: 6, cote: "sud", type: "porte" }, { x: 21, y: 7, cote: "sud", type: "porte" },
        { x: 5, y: 12, cote: "nord", type: "porte" }, { x: 3, y: 4, cote: "ouest", type: "fenetre" }, { x: 24, y: 5, cote: "est", type: "fenetre" }
      ],
      lumieres: [],
      elements: [
        { nom: "Panneaux solaires", x: 4, y: 2, l: 3, h: 1 }, { nom: "Panneaux solaires", x: 11, y: 2, l: 3, h: 1 },
        { nom: "Jardins en terrasse", x: 11, y: 11, l: 7, h: 4 }, { nom: "Source captée", x: 25, y: 12, l: 1, h: 1 },
        { nom: "Aire de l'hélicoptère", x: 20, y: 13, l: 4, h: 4 }, { nom: "Enclos à cabris", x: 9, y: 16, l: 3, h: 2 },
        { nom: "Sentier vers la ravine", x: 26, y: 18, l: 2, h: 2 }
      ]
    } })
];
