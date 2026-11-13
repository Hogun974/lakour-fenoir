// Les installations d'un abri (contrat §3.2). Les effets d'un niveau sont les effets TOTAUX de l'installation à ce niveau
// (ils remplacent ceux du niveau précédent). Repères d'équilibre : docs/survie-notes-contenu.md.
// - production × climat.pluie (conditions.pluie) ou × soleil (conditions.soleil), × facteur de saison ;
// - un groupe de 4 consomme 4 eau (6 dans les Bas en saison chaude) et 4 nourriture par jour.
import { installation } from "./aides.mjs";

const EAU_BRUTE = ["riviere", "source", "puits"];

export const INSTALLATIONS = [
  // ---------------------------------------------------------------- Défense
  installation({ cle: "barricades", nom: "Barricades", categorie: "defense",
    description: `Meubles, tôles, palettes, carcasses de voitures : on bouche les portes, les fenêtres basses et les passages. C'est laid, c'est bruyant à monter, et ça arrête une poignée de Livides le temps de réagir.`,
    niveaux: [
      { cout: { materiaux: 3, travail: 4 }, effets: { defense: 1, visibilite: 1 } },
      { cout: { materiaux: 6, travail: 8 }, effets: { defense: 2, visibilite: 1 } }
    ] }),
  installation({ cle: "palissade", arbre: "moderne", nom: "Palissade", categorie: "defense",
    description: `Une clôture continue de pieux, de tôles rivetées et de grillage doublé, avec une porte qu'on ferme à la barre. Elle fait le tour du terrain : on dort derrière.`,
    niveaux: [
      { cout: { materiaux: 8, travail: 12 }, effets: { defense: 2, visibilite: 2 } },
      { cout: { materiaux: 12, pieces: 1, travail: 16 }, effets: { defense: 3, visibilite: 2 } }
    ] }),
  installation({ cle: "mur", arbre: "moderne", nom: "Mur d'enceinte", categorie: "defense",
    description: `Un vrai mur de parpaings ou de pierres basaltiques jointoyées, haut de deux mètres puis trois, avec un chemin de ronde. Il faut savoir maçonner, et du ciment, ou de la patience.`,
    niveaux: [
      { cout: { materiaux: 15, travail: 24 }, requiert: { savoirs: ["maconnerie"] }, effets: { defense: 3, visibilite: 1 } },
      { cout: { materiaux: 20, travail: 32 }, requiert: { savoirs: ["maconnerie"] }, effets: { defense: 4, visibilite: 1 } },
      { cout: { materiaux: 30, pieces: 2, travail: 48 }, requiert: { savoirs: ["maconnerie"] }, effets: { defense: 5, visibilite: 1, protectionCyclone: 1 } }
    ] }),
  installation({ cle: "tour-de-guet", arbre: "moderne", nom: "Tour de guet", categorie: "defense",
    description: `Une plateforme sur pilotis, un toit, un garde-corps, une échelle qu'on remonte. De là-haut, la garde voit venir de loin, et voit aussi les fumées des voisins.`,
    niveaux: [
      { cout: { materiaux: 6, travail: 8 }, effets: { defense: 1, visibilite: 2, bonus: { vigilance: 1 } } },
      { cout: { materiaux: 10, travail: 12 }, effets: { defense: 2, visibilite: 2, bonus: { vigilance: 1 } } }
    ] }),
  installation({ cle: "fosse-et-pieges", nom: "Fossé et pièges", categorie: "defense",
    description: `Un fossé creusé devant la clôture, des pieux taillés au fond, des fils tendus avec des boîtes de conserve, des trappes sur les passages. Les Livides tombent dedans ; les vivants, eux, apprennent vite à les éviter.`,
    niveaux: [
      { cout: { materiaux: 3, travail: 12 }, effets: { defense: 1 } },
      { cout: { materiaux: 6, pieces: 1, travail: 20 }, effets: { defense: 2 } }
    ] }),
  installation({ cle: "chiens-de-garde", nom: "Chiens de garde", categorie: "defense",
    description: `Deux ou trois chiens recueillis, nourris, dressés à aboyer à l'approche et à se taire sur ordre. Ils mangent, ils réconfortent, ils entendent ce que la garde n'entend pas.`,
    niveaux: [
      { cout: { nourriture: 5, travail: 4 }, effets: { defense: 1, bruit: 1, moral: 1, consommation: { nourriture: 1 } } },
      { cout: { nourriture: 5, travail: 8 }, requiert: { savoirs: ["elevage"] }, effets: { defense: 2, bruit: 1, moral: 1, consommation: { nourriture: 1 }, bonus: { vigilance: 1 } } }
    ] }),
  installation({ cle: "porte-blindee", nom: "Porte blindée", categorie: "defense",
    description: `Une porte d'acier récupérée sur un local technique, une banque ou une caserne, scellée dans un bâti renforcé, avec ses gonds et ses barres. Le dernier rempart.`,
    niveaux: [
      { cout: { materiaux: 4, pieces: 3, travail: 6 }, requiert: { savoirs: ["maconnerie"] }, effets: { defense: 1 } }
    ] }),
  installation({ cle: "camouflage", nom: "Camouflage", categorie: "defense",
    description: `La voie discrète : toits patinés de boue, vitres masquées, lumières occultées, plantations qui cachent les cultures, fumée filtrée, faux abandon à l'entrée. Ce qu'on ne voit pas, on ne l'attaque pas.`,
    niveaux: [
      { cout: { materiaux: 3, travail: 6 }, effets: { discretion: 1, visibilite: -1 } },
      { cout: { materiaux: 6, travail: 10 }, effets: { discretion: 2, visibilite: -2 } },
      { cout: { materiaux: 10, graines: 2, travail: 16 }, requiert: { savoirs: ["maraichage-tropical"] }, effets: { discretion: 3, visibilite: -3 } }
    ] }),

  // ---------------------------------------------------------------- Eau
  installation({ cle: "citerne-de-pluie", arbre: "moderne", nom: "Citerne de pluie", categorie: "eau",
    description: `Gouttières, descentes, première eau jetée, et une cuve : bidons, cuve de mille litres, puis vraie citerne maçonnée. Dans l'Est, elle déborde ; dans l'Ouest, chaque averse compte.`,
    niveaux: [
      { cout: { materiaux: 4, pieces: 1, travail: 6 }, effets: { production: { eau: 1 }, conditions: { pluie: true }, stockage: { eau: 30 } } },
      { cout: { materiaux: 8, pieces: 1, travail: 10 }, effets: { production: { eau: 2 }, conditions: { pluie: true }, stockage: { eau: 60 } } },
      { cout: { materiaux: 14, pieces: 2, travail: 16 }, requiert: { savoirs: ["plomberie-filtration"] }, effets: { production: { eau: 3 }, conditions: { pluie: true }, stockage: { eau: 120 } } }
    ] }),
  installation({ cle: "filtre-sable-charbon", nom: "Filtre à sable et charbon", categorie: "eau",
    description: `Un fût rempli de gravier, de sable lavé et de charbon de bois, puis une ébullition : l'eau brute de la rivière, du puits ou de la ravine devient buvable. Sans lui, la diarrhée tue plus sûrement que les Livides.`,
    niveaux: [
      { cout: { materiaux: 2, pieces: 1, travail: 4 }, requiert: { site: { eau: EAU_BRUTE } }, effets: { production: { eau: 2 } } },
      { cout: { materiaux: 4, pieces: 2, travail: 8 }, requiert: { savoirs: ["plomberie-filtration"], site: { eau: EAU_BRUTE } }, effets: { production: { eau: 4 }, soins: 0 } }
    ] }),
  installation({ cle: "bouilleur-solaire", nom: "Bouilleur solaire", categorie: "eau",
    description: `Des bacs noirs sous des vitres inclinées : le soleil évapore l'eau saumâtre, l'eau de mer ou l'eau douteuse, la vapeur se condense et coule, pure, dans une gouttière. Lent, silencieux, inépuisable sous le soleil de l'Ouest.`,
    niveaux: [
      { cout: { materiaux: 3, pieces: 1, travail: 4 }, requiert: { site: { soleil: 1 } }, effets: { production: { eau: 1 }, conditions: { soleil: true }, visibilite: 1 } },
      { cout: { materiaux: 6, pieces: 2, travail: 8 }, requiert: { site: { soleil: 1 } }, effets: { production: { eau: 2 }, conditions: { soleil: true }, visibilite: 1 } }
    ] }),
  installation({ cle: "captage-de-source", arbre: "moderne", nom: "Captage de source", categorie: "eau",
    description: `Un petit bassin de pierre à la source ou dans la ravine, une crépine, un tuyau qui descend par gravité jusqu'à l'abri. C'est ainsi que vivent les îlets de Mafate : l'eau arrive seule, sans pompe ni courant.`,
    niveaux: [
      { cout: { materiaux: 4, pieces: 2, travail: 10 }, requiert: { site: { eau: ["source", "riviere"] } }, effets: { production: { eau: 4 } } },
      { cout: { materiaux: 8, pieces: 3, travail: 16 }, requiert: { savoirs: ["hydraulique-rurale"], site: { eau: ["source", "riviere"] } }, effets: { production: { eau: 8 }, stockage: { eau: 40 } } }
    ] }),
  installation({ cle: "pompe-manuelle", arbre: "moderne", nom: "Pompe manuelle", categorie: "eau",
    description: `Une pompe à bras sur le puits, ou une pompe de récupération remontée à la main : vingt minutes de bras le matin, de l'eau pour la journée.`,
    niveaux: [
      { cout: { materiaux: 2, pieces: 2, travail: 6 }, requiert: { site: { eau: ["puits"] } }, effets: { production: { eau: 4 } } },
      { cout: { materiaux: 4, pieces: 4, travail: 10 }, requiert: { savoirs: ["plomberie-filtration"], site: { eau: ["puits"] } }, effets: { production: { eau: 8 } } }
    ] }),

  // ---------------------------------------------------------------- Nourriture
  installation({ cle: "potager", arbre: "moderne", nom: "Potager", categorie: "nourriture",
    description: `Des planches de brèdes, de songes, de patates douces, de manioc, de haricots, de chouchous et de piments. La première récolte de brèdes vient vite ; le reste suit. Un potager se voit, et il boit.`,
    niveaux: [
      { cout: { materiaux: 2, graines: 2, travail: 8 }, requiert: { site: { sol: 1, soleil: 1 } }, effets: { production: { nourriture: 2 }, conditions: { delai: 30 }, consommation: { eau: 1 }, visibilite: 1 } },
      { cout: { materiaux: 4, graines: 4, travail: 12 }, requiert: { savoirs: ["maraichage-tropical"], site: { sol: 1, soleil: 1 } }, effets: { production: { nourriture: 4 }, conditions: { delai: 30 }, consommation: { eau: 2 }, visibilite: 1 } },
      { cout: { materiaux: 6, graines: 6, travail: 20 }, requiert: { savoirs: ["maraichage-tropical"], site: { sol: 2, soleil: 1 }, installations: [{ cle: "compost", niveau: 1 }] }, effets: { production: { nourriture: 6 }, conditions: { delai: 30 }, consommation: { eau: 2 }, visibilite: 2 } }
    ] }),
  installation({ cle: "serre", nom: "Serre", categorie: "nourriture",
    description: `Un tunnel de plastique ou de vitres récupérées sur des arceaux : à l'abri des pluies battantes de l'Est et du froid des Hauts, tomates, salades et semis poussent toute l'année. Le plastique brille au soleil.`,
    niveaux: [
      { cout: { materiaux: 8, pieces: 1, graines: 2, travail: 12 }, requiert: { site: { soleil: 1 }, installations: [{ cle: "potager", niveau: 1 }] }, effets: { production: { nourriture: 2 }, conditions: { delai: 30 }, consommation: { eau: 1 }, visibilite: 2 } },
      { cout: { materiaux: 12, pieces: 2, graines: 4, travail: 16 }, requiert: { savoirs: ["maraichage-tropical"], site: { soleil: 1 }, installations: [{ cle: "potager", niveau: 1 }] }, effets: { production: { nourriture: 4 }, conditions: { delai: 30 }, consommation: { eau: 1 }, visibilite: 2 } }
    ] }),
  installation({ cle: "verger", nom: "Verger", categorie: "nourriture",
    description: `Bananiers et papayers d'abord, qui donnent dans l'année ; puis manguiers, letchis, agrumes, fruits à pain, qu'il faut des années pour voir porter, sauf si l'on s'installe là où quelqu'un les a plantés avant vous.`,
    niveaux: [
      { cout: { materiaux: 1, graines: 3, travail: 10 }, requiert: { site: { sol: 1 } }, effets: { production: { nourriture: 2 }, conditions: { delai: 240 } } },
      { cout: { materiaux: 2, graines: 4, travail: 12 }, requiert: { site: { sol: 1 } }, effets: { production: { nourriture: 4 }, conditions: { delai: 365 } } }
    ] }),
  installation({ cle: "basse-cour", nom: "Basse-cour", categorie: "nourriture",
    description: `Des poules péi, des canards, un coq qui chante trop tôt. Des œufs tous les jours, de la viande les jours de fête, et un réveil que tout le quartier entend.`,
    niveaux: [
      { cout: { materiaux: 3, nourriture: 2, travail: 6 }, effets: { production: { nourriture: 1 }, conditions: { delai: 20 }, bruit: 1, visibilite: 1 } },
      { cout: { materiaux: 5, nourriture: 2, travail: 8 }, requiert: { savoirs: ["elevage"] }, effets: { production: { nourriture: 2 }, conditions: { delai: 20 }, bruit: 1, visibilite: 1 } }
    ] }),
  installation({ cle: "enclos-a-cabris", nom: "Enclos à cabris", categorie: "nourriture",
    description: `Un enclos et un abri pour quelques cabris : du lait, des chevreaux, de la viande pour un cari, du fumier pour le potager. Ils mangent n'importe quoi, et s'échappent dès qu'on regarde ailleurs.`,
    niveaux: [
      { cout: { materiaux: 4, travail: 8 }, effets: { production: { nourriture: 1 }, conditions: { delai: 30 } } },
      { cout: { materiaux: 6, travail: 12 }, requiert: { savoirs: ["elevage"] }, effets: { production: { nourriture: 3 }, conditions: { delai: 60 }, bruit: 1, sol: 0.01 } }
    ] }),
  installation({ cle: "bassin-a-tilapias", nom: "Bassin à tilapias", categorie: "nourriture",
    description: `Un bassin bâché ou maçonné où grossissent des tilapias nourris de déchets et de lentilles d'eau ; au second niveau, l'eau du bassin arrose le potager et revient filtrée par une petite pompe.`,
    niveaux: [
      { cout: { materiaux: 6, pieces: 1, travail: 16 }, effets: { production: { nourriture: 1 }, conditions: { delai: 60 }, consommation: { eau: 1 } } },
      { cout: { materiaux: 8, pieces: 3, travail: 16 }, requiert: { savoirs: ["elevage"], installations: [{ cle: "potager", niveau: 2 }] }, effets: { production: { nourriture: 3 }, conditions: { delai: 60 }, consommation: { eau: 1, energie: 1 } } }
    ] }),
  installation({ cle: "ruches", arbre: "moderne", nom: "Ruches", categorie: "nourriture",
    description: `Quelques ruches d'abeilles, au bord du verger ou sous les baies roses : du miel de letchi ou de forêt, de la cire pour les bougies, et des fleurs qui donnent mieux. Le miel soigne les plaies.`,
    niveaux: [
      { cout: { materiaux: 2, travail: 4 }, effets: { production: { nourriture: 1 }, conditions: { delai: 45 } } },
      { cout: { materiaux: 3, travail: 6 }, requiert: { savoirs: ["elevage"] }, effets: { production: { nourriture: 1, medicaments: 0.1 }, conditions: { delai: 45 }, moral: 1 } }
    ] }),
  installation({ cle: "compost", nom: "Compost", categorie: "nourriture",
    description: `Épluchures, fumier, feuilles, cendres, tout y passe. Sans lui, la terre s'épuise en quelques récoltes ; avec lui, elle s'enrichit chaque saison.`,
    niveaux: [
      { cout: { materiaux: 1, travail: 4 }, effets: { sol: 0.02 } },
      { cout: { materiaux: 2, travail: 6 }, requiert: { savoirs: ["maraichage-tropical"] }, effets: { sol: 0.05 } }
    ] }),

  // ---------------------------------------------------------------- Énergie
  installation({ cle: "panneaux-solaires", nom: "Panneaux solaires", categorie: "energie",
    description: `Des panneaux récupérés sur les toits des voisins, un régulateur, des câbles. Sans batteries, le courant ne sert que le jour ; avec, il éclaire la nuit. Les panneaux brillent au soleil comme des miroirs.`,
    niveaux: [
      { cout: { materiaux: 2, pieces: 4, travail: 6 }, requiert: { site: { soleil: 1 } }, effets: { production: { energie: 2 }, conditions: { soleil: true }, visibilite: 1 } },
      { cout: { materiaux: 4, pieces: 8, travail: 10 }, requiert: { savoirs: ["electricite-solaire"], site: { soleil: 1 } }, effets: { production: { energie: 4 }, conditions: { soleil: true }, visibilite: 1 } },
      { cout: { materiaux: 6, pieces: 12, travail: 14 }, requiert: { savoirs: ["electricite-solaire"], site: { soleil: 2 }, installations: [{ cle: "batteries", niveau: 1 }] }, effets: { production: { energie: 6 }, conditions: { soleil: true }, visibilite: 2 } }
    ] }),
  installation({ cle: "batteries", nom: "Batteries", categorie: "energie",
    description: `Des batteries de voitures, de camping-cars, puis de vraies batteries solaires récupérées dans les îlets ou les maisons équipées : on garde le courant du jour pour la nuit.`,
    niveaux: [
      { cout: { pieces: 3, travail: 4 }, effets: { stockage: { energie: 5 } } },
      { cout: { pieces: 6, travail: 6 }, requiert: { savoirs: ["electricite-solaire"] }, effets: { stockage: { energie: 15 } } },
      { cout: { pieces: 10, travail: 8 }, requiert: { savoirs: ["electricite-solaire"] }, effets: { stockage: { energie: 30 } } }
    ] }),
  installation({ cle: "pico-hydro", nom: "Pico-hydro sur rivière", categorie: "energie",
    description: `Une petite turbine dans une dérivation de la rivière : jour et nuit, pluie ou soleil, elle tourne. Les rivières pérennes des cirques et de l'Est s'y prêtent ; une crue peut tout emporter.`,
    niveaux: [
      { cout: { materiaux: 3, pieces: 6, travail: 16 }, requiert: { savoirs: ["hydraulique-rurale"], site: { eau: ["riviere"] } }, effets: { production: { energie: 4 }, conditions: { riviere: true } } },
      { cout: { materiaux: 6, pieces: 10, travail: 24 }, requiert: { savoirs: ["hydraulique-rurale", "electricite-solaire"], site: { eau: ["riviere"] } }, effets: { production: { energie: 10 }, conditions: { riviere: true } } }
    ] }),
  installation({ cle: "groupe-electrogene", nom: "Groupe électrogène", categorie: "energie",
    description: `Du courant à la demande, beaucoup, tout de suite. Il boit du carburant qui ne reviendra jamais, et il s'entend à un kilomètre.`,
    niveaux: [
      { cout: { pieces: 2, travail: 2 }, effets: { production: { energie: 8 }, consommation: { carburant: 1 }, bruit: 2, visibilite: 1 } }
    ] }),
  installation({ cle: "eolienne", nom: "Éolienne de récupération", categorie: "energie",
    description: `Un alternateur de voiture, des pales taillées dans un fût de plastique, un mât haubané. Elle tourne avec les alizés, la nuit comme le jour ; elle grince, et elle se voit de loin.`,
    niveaux: [
      { cout: { materiaux: 3, pieces: 4, travail: 8 }, effets: { production: { energie: 1 }, visibilite: 2 } },
      { cout: { materiaux: 4, pieces: 6, travail: 10 }, requiert: { savoirs: ["electricite-solaire"] }, effets: { production: { energie: 2 }, visibilite: 2 } }
    ] }),

  // ---------------------------------------------------------------- Stockage
  installation({ cle: "sechoir-fumoir", nom: "Séchoir et fumoir", categorie: "stockage",
    description: `Claies au soleil pour les fruits, les piments, le poisson ; un fumoir de tôle pour la viande boucanée. Ce qui est séché ne se gâte plus.`,
    niveaux: [
      { cout: { materiaux: 3, travail: 6 }, effets: { conservation: true, visibilite: 1 } }
    ] }),
  installation({ cle: "reserve-etanche", arbre: "moderne", nom: "Réserve étanche", categorie: "stockage",
    description: `Fûts à couvercle, bocaux, sacs hermétiques, étagères hors du sol, pièges à rats : la chaleur humide ne pourrit plus les réserves.`,
    niveaux: [
      { cout: { materiaux: 4, pieces: 1, travail: 6 }, effets: { conservation: true, stockage: { nourriture: 100 } } },
      { cout: { materiaux: 8, pieces: 2, travail: 10 }, requiert: { savoirs: ["conserverie"] }, effets: { conservation: true, stockage: { nourriture: 250, medicaments: 50 } } }
    ] }),

  // ---------------------------------------------------------------- Vie
  installation({ cle: "atelier", nom: "Atelier", categorie: "vie",
    description: `Un établi, un étau, des outils rangés, une caisse de pièces triées. On y répare, on y fabrique, on y apprend.`,
    niveaux: [
      { cout: { materiaux: 4, pieces: 2, travail: 8 }, effets: { bonus: { bricolage: 1 } } },
      { cout: { materiaux: 6, pieces: 4, travail: 12 }, requiert: { savoirs: ["mecanique"] }, effets: { bonus: { bricolage: 2 }, consommation: { energie: 1 } } }
    ] }),
  installation({ cle: "infirmerie", nom: "Infirmerie", categorie: "vie",
    description: `Un lit propre, une table, de l'eau bouillie, des bandes, un coin isolé pour les fièvres : de quoi soigner mieux et isoler un malade. Au second niveau, un jardin de simples (ayapana, citronnelle, bois de quivi) fournit tisanes et emplâtres.`,
    niveaux: [
      { cout: { materiaux: 3, medicaments: 2, travail: 6 }, effets: { soins: 1 } },
      { cout: { materiaux: 6, pieces: 2, graines: 1, travail: 10 }, requiert: { savoirs: ["premiers-secours-avances"] }, effets: { soins: 2, production: { medicaments: 0.1 }, consommation: { energie: 1 } } }
    ] }),
  installation({ cle: "dortoir", nom: "Dortoir", categorie: "vie",
    description: `Des lits, des moustiquaires, des cloisons, un peu d'intimité : on dort mieux, et l'on peut accueillir.`,
    niveaux: [
      { cout: { materiaux: 4, travail: 6 }, effets: { capacite: 4, moral: 1 } },
      { cout: { materiaux: 8, travail: 10 }, effets: { capacite: 8, moral: 1 } },
      { cout: { materiaux: 14, travail: 16 }, requiert: { savoirs: ["maconnerie"] }, effets: { capacite: 14, moral: 1 } }
    ] }),
  // L'autel des morts (lot « fetes », 2026-11-13) : effets.autel, lu par le système (logique/releve.mjs : honorerAutel).
  installation({ cle: "autel-des-morts", nom: "Autel des morts", categorie: "vie",
    description: `Une étagère contre le mur le plus calme, une nappe propre, des noms écrits à la craie sur une ardoise ou gravés au couteau dans une planche, une bougie, une assiette. Les noms de ceux que le groupe a perdus. Chacun y vient comme il croit, ou sans croire : on s'y tient ensemble.`,
    niveaux: [
      { cout: { materiaux: 1, travail: 1 }, effets: { autel: true } }
    ] }),
  installation({ cle: "cuisine-commune", arbre: "lontan", nom: "Cuisine commune", categorie: "vie",
    description: `Un feu de bois sous un auvent, de grandes marmites, une table pour tout le monde. Un cari partagé tient un groupe ensemble mieux qu'un discours. La fumée, elle, monte haut.`,
    niveaux: [
      { cout: { materiaux: 3, pieces: 1, travail: 6 }, effets: { moral: 1, visibilite: 1 } }
    ] }),

  // ---------------------------------------------------------------- Communication
  installation({ cle: "poste-radio", nom: "Poste radio", categorie: "communication",
    description: `Un poste à ondes courtes, une radio de bateau, un scanner : on écoute les autres groupes, les dernières émissions, les appels à l'aide, les mensonges. Au second niveau, on émet.`,
    niveaux: [
      { cout: { pieces: 3, travail: 4 }, effets: { renseignements: true, consommation: { energie: 1 } } },
      { cout: { pieces: 6, travail: 8 }, requiert: { savoirs: ["radio"] }, effets: { renseignements: true, consommation: { energie: 1 }, moral: 1 } }
    ] }),
  installation({ cle: "antenne", nom: "Antenne", categorie: "communication",
    description: `Un mât haubané, un fil tendu entre deux arbres ou une parabole détournée : la radio porte sur toute l'île. Elle se voit aussi de loin.`,
    niveaux: [
      { cout: { materiaux: 3, pieces: 3, travail: 6 }, requiert: { installations: [{ cle: "poste-radio", niveau: 1 }] }, effets: { renseignements: true, visibilite: 1, bonus: { parole: 1 } } }
    ] }),

  // ---------------------------------------------------------------- Souterrain
  installation({ cle: "galerie-souterraine", nom: "Galerie souterraine", categorie: "souterrain",
    description: `Creuser sous l'abri, dans le tuf, la scorie ou la roche saine : d'abord une cave étayée, puis une galerie, puis un réseau de salles, enfin un refuge complet où l'on peut vivre caché, au frais, à l'abri des cyclones et des regards.

- Niveau 1, cave étayée ; niveau 2, galerie ; niveau 3, réseau ; niveau 4, refuge complet.`,
    niveaux: [
      { cout: { materiaux: 6, travail: 24 }, requiert: { site: { souterrain: 1 } }, effets: { capacite: 2, discretion: 1, protectionCyclone: 1, conservation: true, stockage: { nourriture: 60 } } },
      { cout: { materiaux: 10, pieces: 1, travail: 40 }, requiert: { savoirs: ["etaiement-galeries"], site: { souterrain: 1 } }, effets: { capacite: 6, discretion: 1, defense: 1, protectionCyclone: 2, conservation: true, stockage: { nourriture: 120 } } },
      { cout: { materiaux: 16, pieces: 2, travail: 60 }, requiert: { savoirs: ["etaiement-galeries"], site: { souterrain: 2 } }, effets: { capacite: 12, discretion: 2, defense: 2, protectionCyclone: 3, conservation: true, visibilite: -1, stockage: { nourriture: 200, eau: 60 } } },
      { cout: { materiaux: 24, pieces: 6, travail: 90 }, requiert: { savoirs: ["etaiement-galeries"], site: { souterrain: 2 }, installations: [{ cle: "batteries", niveau: 1 }] }, effets: { capacite: 20, discretion: 3, defense: 3, protectionCyclone: 3, conservation: true, moral: 1, visibilite: -2, consommation: { energie: 1 }, stockage: { nourriture: 300, eau: 120 } } }
    ] }),
  installation({ cle: "tunnel-de-lave-amenage", nom: "Aménagement d'un tunnel de lave", categorie: "souterrain",
    description: `Un tube de lave existe déjà : il faut en masquer l'entrée, dégager les éboulis, poser des planchers sur les cordes de lave, étayer les voûtes fragiles, ventiler et éclairer. Il n'y a ni eau ni soleil sous la coulée : l'eau se récolte dehors, la nourriture aussi. Mais aucun refuge n'est plus sûr.`,
    niveaux: [
      { cout: { materiaux: 4, travail: 12 }, requiert: { site: { souterrain: 3 } }, effets: { capacite: 6, discretion: 2, protectionCyclone: 3, conservation: true, visibilite: -2 } },
      { cout: { materiaux: 10, pieces: 2, travail: 30 }, requiert: { savoirs: ["etaiement-galeries"], site: { souterrain: 3 } }, effets: { capacite: 12, discretion: 3, defense: 2, protectionCyclone: 3, conservation: true, visibilite: -3, stockage: { nourriture: 300, eau: 100 } } },
      { cout: { materiaux: 18, pieces: 6, travail: 60 }, requiert: { savoirs: ["etaiement-galeries"], site: { souterrain: 3 }, installations: [{ cle: "batteries", niveau: 1 }] }, effets: { capacite: 24, discretion: 4, defense: 3, protectionCyclone: 3, conservation: true, moral: 1, visibilite: -4, consommation: { energie: 1 }, stockage: { nourriture: 500, eau: 200 } } }
    ] }),

  // ---------------------------------------------------------------- Lot « savoirs » : les sœurs à l'ancienne (lontan) et l'eau chaude
  // Chaque sœur lontan porte `role` = la clé de sa sœur moderne : les deux ne s'additionnent pas, la moderne passe d'abord et la
  // lontan prend le relais quand elle est cassée ou à court (abri.mjs). Coût `ile` : matières de l'île, prises sur le bois des
  // alentours (bambou, vacoa, goyavier, vétiver), qui repoussent ; réparées avec elles aussi. Moins performantes, plus discrètes.
  installation({ cle: "palissade-de-bambou", arbre: "lontan", role: "palissade", nom: "Palissade de bambou", categorie: "defense",
    description: `Des cannes de bambou plantées serré, ligaturées à la fibre de choka, doublées de branches épineuses : elle plie sous le vent au lieu de casser, repousse si on la laisse faire, et se fond dans la ravine. Elle arrête moins qu'une palissade de tôle.`,
    niveaux: [
      { cout: { ile: 6, travail: 12 }, effets: { defense: 1, visibilite: 1 } },
      { cout: { ile: 10, travail: 16 }, requiert: { savoirs: ["bambou-vacoa"] }, effets: { defense: 2, visibilite: 1 } }
    ] }),
  installation({ cle: "mur-de-pierres-seches", arbre: "lontan", role: "mur", nom: "Mur de pierres sèches", categorie: "defense",
    description: `Le muret des Hauts et des îlets, monté avec les cailloux du champ, sans un gramme de ciment : il ne coûte que de la peine, ne s'abîme presque jamais et ressemble à tous les vieux murs de l'île. Il monte moins haut qu'un mur maçonné.`,
    niveaux: [
      { cout: { travail: 32 }, requiert: { savoirs: ["pierre-seche"] }, effets: { defense: 2 } },
      { cout: { travail: 48 }, requiert: { savoirs: ["pierre-seche"] }, effets: { defense: 3 } }
    ] }),
  installation({ cle: "guet-dans-un-arbre", arbre: "lontan", role: "tour-de-guet", nom: "Guet dans un grand arbre", categorie: "defense",
    description: `Une plateforme de gaulettes dans la fourche d'un manguier ou d'un tamarin, une échelle de corde qu'on remonte : la garde voit loin, cachée dans le feuillage. Rien de plus, et c'est déjà beaucoup.`,
    niveaux: [
      { cout: { ile: 3, travail: 6 }, requiert: { site: { sol: 1 } }, effets: { bonus: { vigilance: 1 } } }
    ] }),
  installation({ cle: "citerne-lontan", arbre: "lontan", role: "citerne-de-pluie", nom: "Gouttières de bambou et jarres", categorie: "eau",
    description: `Des bambous fendus en gouttières sous le bord du toit, des jarres de terre et des fûts de bois dessous. Les joints fuient un peu, les jarres se fêlent ; on les refait avec ce qui pousse autour.`,
    niveaux: [
      { cout: { ile: 3, travail: 8 }, effets: { production: { eau: 0.5 }, conditions: { pluie: true }, stockage: { eau: 20 } } },
      { cout: { ile: 5, travail: 12 }, requiert: { savoirs: ["bambou-vacoa"] }, effets: { production: { eau: 1.5 }, conditions: { pluie: true }, stockage: { eau: 40 } } }
    ] }),
  installation({ cle: "conduite-de-bambou", arbre: "lontan", role: "captage-de-source", nom: "Conduite de bambou", categorie: "eau",
    description: `Un petit barrage de pierres à la source, et des bambous emboîtés, calés sur des fourches, qui descendent jusqu'à la case. L'eau arrive seule ; il en fuit un peu à chaque joint, et une chèvre peut tout défaire.`,
    niveaux: [
      { cout: { ile: 4, travail: 12 }, requiert: { site: { eau: ["source", "riviere"] } }, effets: { production: { eau: 3 } } },
      { cout: { ile: 8, travail: 18 }, requiert: { savoirs: ["bambou-vacoa"], site: { eau: ["source", "riviere"] } }, effets: { production: { eau: 6 }, stockage: { eau: 20 } } }
    ] }),
  installation({ cle: "puits-a-balancier", arbre: "lontan", role: "pompe-manuelle", nom: "Puits à balancier", categorie: "eau",
    description: `Une longue perche de bois sur une fourche, une pierre au bout pour contrepoids, un seau de l'autre : on puise sans pompe ni pièce, au prix de quelques allers-retours de plus.`,
    niveaux: [
      { cout: { ile: 3, travail: 8 }, requiert: { site: { eau: ["puits"] } }, effets: { production: { eau: 3 } } },
      { cout: { ile: 5, travail: 10 }, requiert: { site: { eau: ["puits"] } }, effets: { production: { eau: 6 } } }
    ] }),
  installation({ cle: "jardin-creole", arbre: "lontan", role: "potager", nom: "Jardin créole", categorie: "nourriture",
    description: `Le jardin de la case, où tout pousse mêlé : bananiers pour l'ombre, chouchou sur la treille, songe, manioc, patates, brèdes, et les zerbaz le long de la clôture. On le plante de boutures, on le paille ; il boit peu, ressemble à une cour à l'abandon, et donne moins qu'un potager bien aligné.`,
    niveaux: [
      { cout: { ile: 2, graines: 1, travail: 8 }, requiert: { site: { sol: 1 } }, effets: { production: { nourriture: 1.5, plantes: 0.2 }, conditions: { delai: 20 } } },
      { cout: { ile: 3, graines: 2, travail: 12 }, requiert: { savoirs: ["jardin-creole"], site: { sol: 1 } }, effets: { production: { nourriture: 3, plantes: 0.3 }, conditions: { delai: 20 } } }
    ] }),
  installation({ cle: "ruches-en-tronc", arbre: "lontan", role: "ruches", nom: "Ruches en tronc", categorie: "nourriture",
    description: `Un tronc creux de bois de natte ou de filao, fermé d'une planche, posé sous un toit de paille : les abeilles s'y installent seules. On récolte moins, en enfumant au vétiver.`,
    niveaux: [
      { cout: { ile: 1, travail: 4 }, effets: { production: { nourriture: 0.4 }, conditions: { delai: 45 } } }
    ] }),
  installation({ cle: "garde-manger-lontan", arbre: "lontan", role: "reserve-etanche", nom: "Garde-manger lontan", categorie: "stockage",
    description: `Un grenier sur pilotis coiffé de vétiver, des jarres fermées de cire, des sacs de vacoa pendus hors de portée des rats : la réserve tient au sec, en plus petit.`,
    niveaux: [
      { cout: { ile: 3, travail: 8 }, effets: { conservation: true, stockage: { nourriture: 50 } } }
    ] }),
  installation({ cle: "gaziniere", arbre: "moderne", role: "cuisine-commune", rang: 0, nom: "Gazinière", categorie: "vie",
    description: `La gazinière d'une cuisine, sa bouteille de treize kilos dessous : on cuit le cari sans fumée, donc sans se faire voir. La bouteille se vide ; quand il n'y a plus de gaz, on retourne au feu de bois (la cuisine commune prend le relais si elle existe).`,
    niveaux: [
      { cout: { materiaux: 1, pieces: 1, travail: 2 }, effets: { moral: 1, consommation: { gaz: 1 } } }
    ] }),
  installation({ cle: "eau-chaude-solaire", arbre: "moderne", role: "eau-chaude", rang: 0, nom: "Chauffe-eau solaire", categorie: "vie",
    description: `Le capteur et le ballon d'un toit de l'Ouest, démontés et remontés : une douche chaude chaque soir de soleil, de l'eau chaude pour laver les plaies. Le capteur brille sur le toit.`,
    niveaux: [
      { cout: { materiaux: 3, pieces: 3, travail: 6 }, requiert: { savoirs: ["plomberie-filtration"], site: { soleil: 1 } }, effets: { moral: 1, visibilite: 1, bonus: { soins: 1 } } }
    ] }),
  installation({ cle: "eau-chaude-gaz", arbre: "moderne", role: "eau-chaude", rang: 1, nom: "Chauffe-eau à gaz", categorie: "vie",
    description: `Un chauffe-eau instantané branché sur une bouteille : de l'eau chaude à toute heure, tant qu'il reste du gaz. Il passe après le soleil.`,
    niveaux: [
      { cout: { materiaux: 1, pieces: 2, travail: 3 }, effets: { moral: 1, bonus: { soins: 1 }, consommation: { gaz: 1 } } }
    ] }),
  installation({ cle: "eau-chaude-feu-de-bois", arbre: "lontan", role: "eau-chaude", rang: 2, nom: "Eau chauffée au feu de bois", categorie: "vie",
    description: `Un fût noirci sur trois pierres, un feu de bois de goyavier : l'eau chaude des anciens, gratuite, longue à venir. La fumée monte, et se voit.`,
    niveaux: [
      { cout: { ile: 2, travail: 3 }, effets: { moral: 1, visibilite: 1, bonus: { soins: 1 } } }
    ] })
];

// Bras (§10.3) : les installations qui demandent des travailleurs, { tache, nombre } par niveau (nombre de personnes à la
// tâche pour produire à plein ; ×0,5 sans personne). Posé sur chaque niveau (effets.bras).
export const BRAS = {
  potager: { tache: "cultures", nombres: [1, 1, 2] }, serre: { tache: "cultures", nombres: [1, 1] }, verger: { tache: "cultures", nombres: [1, 1] },
  "basse-cour": { tache: "elevage", nombres: [1, 1] }, "enclos-a-cabris": { tache: "elevage", nombres: [1, 1] },
  "bassin-a-tilapias": { tache: "elevage", nombres: [1, 1] }, ruches: { tache: "elevage", nombres: [1, 1] },
  atelier: { tache: "atelier", nombres: [1, 2] }, infirmerie: { tache: "soins", nombres: [1, 1] }, "cuisine-commune": { tache: "cuisine", nombres: [1] },
  "tour-de-guet": { tache: "garde", nombres: [1, 1] }, "chiens-de-garde": { tache: "garde", nombres: [1, 1] },
  "filtre-sable-charbon": { tache: "eau", nombres: [1, 1] }, "pompe-manuelle": { tache: "eau", nombres: [1, 1] },
  "sechoir-fumoir": { tache: "cuisine", nombres: [1] }, "poste-radio": { tache: "garde", nombres: [1, 1] },
  // Lot « savoirs »
  "jardin-creole": { tache: "cultures", nombres: [1, 1] }, "puits-a-balancier": { tache: "eau", nombres: [1, 1] }, "guet-dans-un-arbre": { tache: "garde", nombres: [1] },
  "ruches-en-tronc": { tache: "elevage", nombres: [1] }, gaziniere: { tache: "cuisine", nombres: [1] }, "eau-chaude-feu-de-bois": { tache: "cuisine", nombres: [1] }
};
for (const i of INSTALLATIONS) {
  const b = BRAS[i.system.cle];
  i.system.niveaux.forEach((n, k) => { n.effets.bras = b ? { tache: b.tache, nombre: b.nombres[k] ?? b.nombres.at(-1) } : null; });
}

// Voies d'autonomie : sur un même site, sans jamais déménager, ces installations donnent eau, nourriture et énergie nettes
// ≥ 0 pour un groupe de 4, en saison des pluies comme en saison sèche (vérifié par le fabricant et les essais).
export const VOIES_AUTONOMIE = [
  { cle: "ferme-des-hauts", nom: "La ferme des Hauts", site: "ferme-de-la-plaine-des-cafres",
    installations: [
      { cle: "citerne-de-pluie", niveau: 3 }, { cle: "bouilleur-solaire", niveau: 2 }, { cle: "compost", niveau: 1 }, { cle: "potager", niveau: 2 },
      { cle: "enclos-a-cabris", niveau: 2 }, { cle: "basse-cour", niveau: 1 }, { cle: "reserve-etanche", niveau: 1 }, { cle: "panneaux-solaires", niveau: 1 }, { cle: "batteries", niveau: 1 }
    ] },
  { cle: "ilet-de-mafate", nom: "L'îlet de Mafate", site: "ilet-de-la-nouvelle",
    installations: [
      { cle: "captage-de-source", niveau: 2 }, { cle: "compost", niveau: 1 }, { cle: "potager", niveau: 2 }, { cle: "enclos-a-cabris", niveau: 1 }, { cle: "basse-cour", niveau: 1 },
      { cle: "sechoir-fumoir", niveau: 1 }, { cle: "panneaux-solaires", niveau: 1 }, { cle: "batteries", niveau: 1 }, { cle: "poste-radio", niveau: 1 }
    ] },
  { cle: "case-de-l-ouest", nom: "La case de l'Ouest sec", site: "case-de-bellemene",
    installations: [
      { cle: "citerne-de-pluie", niveau: 3 }, { cle: "bouilleur-solaire", niveau: 2 }, { cle: "compost", niveau: 1 }, { cle: "potager", niveau: 2 }, { cle: "verger", niveau: 2 },
      { cle: "basse-cour", niveau: 1 }, { cle: "sechoir-fumoir", niveau: 1 }, { cle: "panneaux-solaires", niveau: 1 }
    ] },
  { cle: "vallee-de-la-langevin", nom: "La vallée de la Langevin (avec le courant de la rivière)", site: "centrale-de-langevin",
    installations: [
      { cle: "captage-de-source", niveau: 1 }, { cle: "filtre-sable-charbon", niveau: 1 }, { cle: "compost", niveau: 1 }, { cle: "potager", niveau: 2 }, { cle: "bassin-a-tilapias", niveau: 2 },
      { cle: "reserve-etanche", niveau: 1 }, { cle: "pico-hydro", niveau: 1 }, { cle: "infirmerie", niveau: 2 }, { cle: "poste-radio", niveau: 2 }, { cle: "atelier", niveau: 2 }
    ] },
  { cle: "ilet-souterrain", nom: "Le refuge sous la ferme (voie discrète)", site: "ferme-d-ilet-a-cordes",
    installations: [
      { cle: "citerne-de-pluie", niveau: 3 }, { cle: "bouilleur-solaire", niveau: 2 }, { cle: "compost", niveau: 1 }, { cle: "potager", niveau: 3 },
      { cle: "panneaux-solaires", niveau: 2 }, { cle: "batteries", niveau: 1 }, { cle: "galerie-souterraine", niveau: 4 }, { cle: "camouflage", niveau: 3 }
    ] }
];

// Voie défensive et discrète : pour l'abri qui attire les regards par sa prospérité.
export const VOIE_DEFENSIVE = ["barricades", "palissade", "mur", "porte-blindee", "tour-de-guet", "fosse-et-pieges", "chiens-de-garde", "camouflage", "galerie-souterraine", "tunnel-de-lave-amenage"];
