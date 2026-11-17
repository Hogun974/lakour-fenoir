// Les outils, les ateliers et les recettes (lot 6 du portage du jeu 3D, famille 9 « Fabriquer » du complément ; contrat §24 ;
// chiffres : docs/equilibre-ateliers.md). Ici : les neuf ateliers de métier (trois niveaux chacun, le matériau fait le niveau), les
// outils en trois qualités, leurs suites (armes remises en état, bouclier doublé…), les objets que font les nouvelles recettes
// (vêtements, pêche, lumière, matières travaillées, remèdes, transports, aménagements de véhicule), leurs plans au registre, les
// ateliers déjà là sur certains sites, deux tables du MJ, le journal du MJ « Les ateliers et les outils » et une page du guide du
// joueur. Les recettes sont dans recettes-3d.mjs ; la règle dans le système (logique/armes.mjs et fabrication.mjs).
import { installation, equipement, journal, table, MODULE } from "./aides.mjs";
import { RECETTES_ATELIERS } from "./recettes-3d.mjs";

// ---------------------------------------------------------------- Les neuf ateliers
// Niveau 1 : ce que l'île donne (pierre sèche, bambou, paille et torchis : coût `ile`, le bois et les matières des alentours) ou la
// tôle de récupération ; niveau 2 : bois sous tôle ; niveau 3 : parpaing, ciment, acier (maçonnerie). Au-dessus du niveau qu'une
// recette demande : +1 dé et une fois et demie plus vite, +2 dés et deux fois plus vite (logique/fabrication.mjs).
const A = (cle, nom, metier, description, niveaux, { arbre = "", effets = {} } = {}) => installation({ cle, nom, categorie: "vie", arbre, metiers: [metier], description,
  niveaux: niveaux.map((n, i) => ({ ...n, effets: { ...effets, ...(n.effets ?? {}), bras: null } })) });

export const INSTALLATIONS_ATELIERS = [
  A("coin-du-feu", "Coin du feu", "cuisine", `Le feu de travail, à l'écart de la cuisine : trois roches et un trépied d'abord, puis un foyer sous tôle avec une cheminée de fûts, enfin un fourneau maçonné. On y fait bouillir, réduire, fumer, cuire le savon et le sel. La cuisine commune et la gazinière en servent au premier niveau.`, [
    { cout: { ile: 2, travail: 4 } },
    { cout: { materiaux: 4, travail: 8 } },
    { cout: { materiaux: 5, pieces: 1, travail: 14 }, requiert: { savoirs: ["maconnerie"] } }
  ]),
  A("etabli", "Établi du bois", "etabli", `Un plateau de bambou sur deux tréteaux, puis un vrai établi de planches sous un appentis de tôle, enfin une menuiserie maçonnée avec ses râteliers. On y débite, on y emmanche, on y monte les roues et les charrettes, on y remet les armes en état.`, [
    { cout: { ile: 2, travail: 4 } },
    { cout: { materiaux: 4, travail: 8 } },
    { cout: { materiaux: 5, pieces: 1, travail: 14 }, requiert: { savoirs: ["maconnerie"] } }
  ]),
  A("forge", "Forge", "forge", `Un foyer de pierres sèches et de terre, un soufflet de chambre à air, un rail pour enclume ; puis un abri de tôle et une hotte ; enfin une forge maçonnée qui tient la chaleur. Le marteau s'entend loin, et la fumée monte.`, [
    { cout: { ile: 3, travail: 4 } },
    { cout: { materiaux: 5, pieces: 1, travail: 8 } },
    { cout: { materiaux: 8, pieces: 2, travail: 14 }, requiert: { savoirs: ["maconnerie"] } }
  ]),
  A("vannerie", "Vannerie du vacoa", "vannerie", `Un coin d'ombre où sèchent les feuilles de vacoa fendues en lanières, des bacs pour les blanchir, des gabarits pour les paniers et les nattes. Les anciennes de la côte au vent y passaient des après-midi entières. Au second niveau, un auvent de tôle et des étagères ; au troisième, une pièce maçonnée où rien ne moisit.`, [
    { cout: { ile: 2, travail: 4 } },
    { cout: { materiaux: 4, travail: 8 } },
    { cout: { materiaux: 5, pieces: 1, travail: 14 }, requiert: { savoirs: ["maconnerie"] } }
  ], { arbre: "lontan" }),
  A("couture", "Atelier de couture", "couture", `Une table, des ciseaux, du fil de pêche, des aiguilles de matelassier, puis une machine à coudre à pédale sortie d'une case des Hauts. On y retaille les bâches, on y coud les sacs, on y rapièce ce qui doit encore durer une saison.`, [
    { cout: { ile: 2, travail: 4 } },
    { cout: { materiaux: 4, travail: 8 } },
    { cout: { materiaux: 5, pieces: 1, travail: 14 } }
  ]),
  A("tisanerie", "Case à tisanes", "tisanerie", `Des bottes de zerbaz pendues au plafond d'une case de paille et de torchis, des bocaux étiquetés à la main, une marmite qui ne sert qu'à ça. Plus tard, des étagères et des bocaux par dizaines ; enfin une petite pièce de pierre, fraîche et sèche, où les feuilles gardent leur force. Rien n'y guérit le Gris.`, [
    { cout: { ile: 2, travail: 4 } },
    { cout: { materiaux: 4, travail: 8 } },
    { cout: { ile: 3, materiaux: 4, travail: 14 }, requiert: { savoirs: ["zerbaz"] } }
  ], { arbre: "lontan" }),
  A("atelier-mecanique", "Atelier de mécanique", "mecanique", `Un abri de tôle, un étau, des clés, une fosse ou des chandelles pour passer sous un moteur ; puis un garage de planches avec ses bidons d'huile ; enfin un garage maçonné, avec palan et établi d'acier. On y remet en état ce qui roule et ce qui tire.`, [
    { cout: { materiaux: 3, pieces: 1, travail: 4 } },
    { cout: { materiaux: 5, pieces: 3, travail: 8 }, requiert: { savoirs: ["mecanique"] } },
    { cout: { materiaux: 8, pieces: 4, travail: 14 }, requiert: { savoirs: ["mecanique", "maconnerie"] } }
  ], { arbre: "moderne" }),
  A("atelier-electricite", "Atelier d'électricité", "electricite", `Une table sous tôle, un fer à souder qu'on chauffe au feu ou à la batterie, des boîtes de composants triés ; puis une pièce de planches, sèche, avec son multimètre et ses câbles ; enfin un local maçonné où l'on remet en état les batteries et les régulateurs.`, [
    { cout: { materiaux: 1, pieces: 2, travail: 4 } },
    { cout: { materiaux: 3, pieces: 4, travail: 8 }, requiert: { savoirs: ["electricite-solaire"] } },
    { cout: { materiaux: 5, pieces: 5, travail: 14 }, requiert: { savoirs: ["electricite-solaire", "maconnerie"] } }
  ], { arbre: "moderne" }),
  A("distillerie", "Distillerie", "distillerie", `Un alambic de cocotte et de serpentin sur un foyer de pierres, puis une chaudière de tôle avec sa colonne, enfin une petite distillerie maçonnée. Le jus de canne y devient rhum, désinfectant ou carburant. L'odeur porte loin sous le vent.`, [
    { cout: { ile: 2, materiaux: 1, pieces: 1, travail: 4 } },
    { cout: { materiaux: 4, pieces: 2, travail: 8 }, requiert: { savoirs: ["conserverie"] } },
    { cout: { materiaux: 7, pieces: 3, travail: 14 }, requiert: { savoirs: ["conserverie", "maconnerie"] } }
  ])
];

// ---------------------------------------------------------------- Les outils en trois qualités (armes.mjs)
// L'outil forgé garde les valeurs de FVTT (le sabre à canne, le couteau, la pelle et pioche, le pied-de-biche d'avant sont forgés ;
// la lance de fortune d'avant est la lance de fortune) ; celui de récupération a le même bonus et moitié moins d'usages ; celui de
// fortune un dé de moins et six usages.
const O = (cle, nom, qualite, gamme, bonus, description, { categorie = "outil", charge = 1 } = {}) =>
  equipement({ cle, nom, categorie, bonus, charge, qualite, gammes: [gamme], description });

const OUTILS_FORTUNE = [
  O("eclat-de-basalte", "Éclat de basalte", "fortune", "couteau", {}, `Un éclat de galet de basalte, frappé contre un autre jusqu'à trouver le fil : le premier tranchant, à mains nues. Il coupe mal et s'émousse vite, mais il coupe.`, { charge: 0 }),
  O("hache-de-fortune", "Hache de fortune", "fortune", "hache", {}, `Un galet taillé, emmanché dans une branche fendue et serré à la corde : de quoi abattre ses premiers arbres, lentement. Le manche lâche avant la pierre.`),
  O("sabre-a-canne-de-fortune", "Sabre de fortune", "fortune", "sabre", {}, `Une lame de pierre plate ligaturée au bout d'un bambou : elle tranche les lianes et le vétiver, pas grand-chose de plus.`),
  O("marteau-de-fortune", "Marteau de fortune", "fortune", "marteau", {}, `Un galet rond lié à un manche de goyavier. On tape juste, ou on se tape les doigts.`),
  O("scie-de-fortune", "Scie de fortune", "fortune", "scie", {}, `Des éclats de basalte pris dans une branche fendue, en dents : elle râpe plus qu'elle ne scie.`),
  O("truelle-de-fortune", "Truelle de fortune", "fortune", "truelle", {}, `Une pierre plate emmanchée : de quoi lisser la terre d'un torchis ou caler une pierre.`, { charge: 0 }),
  O("pelle-pioche-de-fortune", "Pelle et pic de fortune", "fortune", "pelle-pioche", {}, `Une pelle taillée dans une planche, un pic de bois durci au feu : on creuse, à la sueur.`, { charge: 2 }),
  O("pied-de-biche-de-fortune", "Levier de bois dur", "fortune", "pied-de-biche", {}, `Une branche de bois dur, taillée en biseau : elle soulève une tôle, force un volet, et casse au troisième essai.`),
  O("masse-de-fortune", "Masse de fortune", "fortune", "masse", {}, `Une grosse pierre liée en croix au bout d'un manche : elle casse un parpaing, si l'on a de la patience.`, { charge: 2 }),
  O("pince-de-fortune", "Pince de bambou", "fortune", "pince", {}, `Un bambou fendu, refermé à la corde : il tient ce qui brûle et tord un fil de fer fin.`, { charge: 0 }),
  O("gratte-de-fortune", "Gratte de fortune", "fortune", "gratte", {}, `Une pierre plate emmanchée en travers : la houe d'avant les houes, pour sarcler et butter.`)
];
const OUTILS_RECUPERATION = [
  O("hache-de-recuperation", "Hache de récupération", "recuperation", "hache", { bricolage: 1, combat: 1 }, `Un fer de ferraille découpé au burin, emmanché et goupillé au fil de fer : elle abat un arbre, et le reste.`),
  O("sabre-a-canne-de-recuperation", "Sabre de récupération", "recuperation", "sabre", { combat: 1 }, `Une lame taillée dans une tôle épaisse, affûtée à la meule, un manche de bois : elle coupe la canne comme l'autre.`, { categorie: "arme" }),
  O("couteau-de-recuperation", "Couteau de récupération", "recuperation", "couteau", { survie: 1 }, `Une lame de scie à métaux meulée, un manche de bois et de fil de fer : un vrai couteau, qui tient moins.`, { charge: 0 }),
  O("marteau-de-recuperation", "Marteau de récupération", "recuperation", "marteau", { bricolage: 1 }, `Un écrou de gros boulon serti sur un manche : il plante, il redresse, il arrache.`),
  O("scie-de-recuperation", "Scie de récupération", "recuperation", "scie", { bricolage: 1 }, `Une lame de ressort taillée en dents à la lime, tendue sur un arc de bois : elle débite une planche en un quart.`),
  O("truelle-de-recuperation", "Truelle de récupération", "recuperation", "truelle", { bricolage: 1 }, `Un triangle de tôle riveté sur un manche : on gâche, on lisse, on jointoie.`, { charge: 0 }),
  O("pelle-pioche-de-recuperation", "Pelle et pioche de récupération", "recuperation", "pelle-pioche", { endurance: 1, bricolage: 1 }, `Une pelle de tôle pliée, un fer de pioche fait d'une barre de ferraille : on creuse la tranchée, la fosse, la tombe.`, { charge: 2 }),
  O("pied-de-biche-de-recuperation", "Pied-de-biche de récupération", "recuperation", "pied-de-biche", { bricolage: 1, combat: 1 }, `Une barre de ferraille aplatie et recourbée au feu : elle ouvre, elle soulève, elle cogne.`),
  O("masse-de-recuperation", "Masse de récupération", "recuperation", "masse", { bricolage: 1, combat: 1 }, `Un bloc d'acier de casse, percé et emmanché : il casse le roc et les murs en dur.`, { charge: 2 }),
  O("pince-de-recuperation", "Pince de récupération", "recuperation", "pince", { bricolage: 1 }, `Deux bras de ferraille et un boulon : elle coupe le fil de fer, tient les câbles, démonte une épave.`, { charge: 0 }),
  O("gratte-de-recuperation", "Gratte de récupération", "recuperation", "gratte", { survie: 1 }, `Une lame de tôle sur un manche, comme celle des carreaux de l'île : sarcler, butter, creuser une rigole.`),
  O("lance-de-recuperation", "Lance de récupération", "recuperation", "lance", { combat: 2 }, `Un fer de ferraille forgé à froid, goupillé sur un manche droit : à deux mètres d'une bouche qui mord, on frappe et on recule.`, { categorie: "arme" })
];
const OUTILS_FORGES = [
  O("hache", "Hache forgée", "forge", "hache", { bricolage: 1, combat: 1 }, `Un fer forgé, trempé, emmanché à la main : elle tient une trentaine d'arbres avant qu'on la rafistole.`),
  O("marteau", "Marteau forgé", "forge", "marteau", { bricolage: 1 }, `Une tête d'acier forgée au galet, un manche de goyavier : le premier outil de la forge, et le plus utile.`),
  O("scie", "Scie forgée", "forge", "scie", { bricolage: 1 }, `Une lame de ressort recuite, taillée, avoyée, retrempée : il faut savoir la mécanique pour la réussir.`),
  O("truelle", "Truelle forgée", "forge", "truelle", { bricolage: 1 }, `Une truelle d'acier, pour maçonner à la chaux ou au ciment.`, { charge: 0 }),
  O("masse", "Masse forgée", "forge", "masse", { bricolage: 1, combat: 1 }, `Huit kilos d'acier au bout d'un manche : le roc, les murs en dur, et ce qui se met en travers.`, { charge: 2 }),
  O("pince", "Pince coupante forgée", "forge", "pince", { bricolage: 1 }, `Une vraie pince coupante : le fil de fer, les câbles, les boulons d'une épave.`, { charge: 0 }),
  O("gratte", "Gratte forgée", "forge", "gratte", { survie: 1 }, `La houe des carreaux de l'île, forgée et trempée : pour sarcler, butter, creuser une rigole.`),
  O("lance-forgee", "Lance forgée", "forge", "lance", { combat: 2 }, `Un fer de lance forgé et trempé sur un bambou plein : elle tient à distance, et elle dure.`, { categorie: "arme" })
];
const PIERRE = [
  equipement({ cle: "pierre-a-aiguiser", nom: "Pierre à aiguiser", categorie: "outil", bonus: {}, charge: 0,
    description: `Un galet au grain fin, dressé à plat sur une dalle. Avec elle, on redonne du fil à une lame (hache, sabre, couteau, scie) : l'affûtage rend un quart de ses usages et ne compte pas parmi les trois réparations de fortune.` })
];

// ---------------------------------------------------------------- Les suites : ce qui ne se fait qu'en un matériau progresse
const SUITES = [
  equipement({ cle: "arc-renforce", nom: "Arc renforcé", categorie: "arme", bonus: { tir: 2 }, charge: 1,
    description: `L'arc de chasse, doublé au dos d'une lame de ressort et d'une corde neuve : il tire plus loin et plus fort. Silencieux, comme avant.` }),
  equipement({ cle: "arbalete-d-acier", nom: "Arbalète d'acier à levier", categorie: "arme", bonus: { tir: 2 }, charge: 2,
    description: `L'arbalète de fortune reprise à la forge : un arc d'acier forgé, un levier pour la tendre en quelques secondes au lieu d'une demi-minute. Silencieuse ; ses carreaux se récupèrent.` }),
  equipement({ cle: "bouclier-double-et-cercle", nom: "Bouclier doublé et cerclé", categorie: "arme", bonus: { combat: 1 }, charge: 3, parade: 4, usages: 30,
    description: `Le bouclier de tôle doublé d'une seconde tôle et cerclé de fer à la forge : il pare une touche de Livide sur deux (4, 5 ou 6 au dé), et une touche parée ne blesse pas et ne mord pas. Plus lourd, il tient plus longtemps.` }),
  equipement({ cle: "fusil-de-chasse-remis-en-etat", nom: "Fusil de chasse remis en état", categorie: "arme-a-feu", bonus: { tir: 3 }, charge: 2, munitions: 1, bruit: 2, usages: 70, remise: true,
    description: `Le fusil démonté, nettoyé, huilé à l'huile de bancoul, son ressort changé : il porte plus juste et ne s'enraye presque plus. Il s'entend toujours à des kilomètres.` }),
  equipement({ cle: "carabine-22-remise-en-etat", nom: "Carabine .22 remise en état", categorie: "arme-a-feu", bonus: { tir: 2 }, charge: 1, munitions: 1, bruit: 1, usages: 100, remise: true,
    description: `La petite carabine reprise pièce à pièce : précise, fiable, et toujours moins bruyante qu'un fusil.` }),
  equipement({ cle: "pistolet-de-service-remis-en-etat", nom: "Pistolet de service remis en état", categorie: "arme-a-feu", bonus: { tir: 2 }, charge: 1, munitions: 1, bruit: 2, usages: 85, remise: true,
    description: `Le pistolet nettoyé, son ressort de chargeur changé : il ne s'enraye presque plus.` }),
  equipement({ cle: "tronconneuse-revisee", nom: "Tronçonneuse révisée", categorie: "outil", bonus: { bricolage: 2 }, charge: 2, bruit: 2, gammes: ["hache", "scie"], usages: 40,
    description: `La tronçonneuse démontée, sa chaîne affûtée, son carburateur réglé, son pot bourré de laine de roche : elle coupe mieux, dure plus, et s'entend un peu moins loin.` })
];

// ---------------------------------------------------------------- Vannerie, couture, pêche, bêtes
const VIE = [
  equipement({ cle: "bertel", nom: "Bertel", categorie: "vie", bonus: { endurance: 1 }, charge: 0, effets: { moral: 0.25 },
    description: `Le sac à dos de vacoa des Hauts, tressé serré, avec ses bretelles de corde : on y porte le manger, les outils, les patates du jardin. Il se refait quand il s'use.` }),
  equipement({ cle: "tente-de-vacoa", nom: "Tente de vacoa", categorie: "vie", bonus: {}, charge: 0, effets: { moral: 0.25 },
    description: `La *tente*, à La Réunion, c'est le panier tressé qu'on porte au marché et au champ, pas l'abri de toile. Celle-ci a deux anses et sent la feuille sèche.` }),
  equipement({ cle: "capeline-de-vacoa", nom: "Capeline de vacoa", categorie: "vie", bonus: {}, charge: 0, protege: ["soleil"],
    description: `Le grand chapeau de vacoa des planteurs : dehors, à l'heure où le soleil tape, il ôte le malus de la chaleur.` }),
  equipement({ cle: "tenue-rapiecee", nom: "Tenue rapiécée", categorie: "vie", bonus: {}, charge: 0, effets: { moral: 0.25 },
    description: `Des vêtements repris, renforcés aux genoux et aux coudes, qui tiendront encore une saison. Être propre et couvert, ça compte.` }),
  equipement({ cle: "gants-de-travail", nom: "Gants de travail", categorie: "vie", bonus: {}, charge: 0,
    description: `Des gants de toile doublée : on déplace le bois et les tôles sans se couper, et sans glisser la main sur une scolopendre (le MJ ne fait pas tirer la piqûre à qui les porte en remuant le bois).` }),
  equipement({ cle: "couverture", nom: "Couverture", categorie: "vie", bonus: {}, charge: 1, bivouac: true, effets: { moral: 0.25 },
    description: `Une couverture cousue de vieux draps et de rideaux : les nuits des Hauts sont froides. Roulée sur le sac, elle fait de quoi bivouaquer.` }),
  equipement({ cle: "cape-de-pluie", nom: "Cape de pluie", categorie: "vie", bonus: {}, charge: 0,
    description: `Une cape taillée dans une bâche, avec une capuche : on marche sous l'averse sans tremper ce qu'on porte, les cartes, les cahiers, les allumettes.` }),
  equipement({ cle: "savates-de-pneu", nom: "Savates de pneu", categorie: "vie", bonus: {}, charge: 0, effets: { moral: 0.25 },
    description: `Des savates deux-doigts découpées dans un pneu, la bride en chambre à air : elles ne s'usent pas, ne glissent pas sur le basalte mouillé, et ne coûtent rien.` }),
  equipement({ cle: "jarre-de-terre-cuite", nom: "Jarre de terre cuite", categorie: "vie", bonus: {}, charge: 2, effets: { stockage: { eau: 4 } },
    description: `Une jarre d'argile montée à la main et cuite au four de la forge : l'eau y reste fraîche et ne croupit pas. Elle garde quatre unités d'eau de plus à l'abri (au MJ).` }),
  equipement({ cle: "vouve", nom: "Vouve", categorie: "outil", bonus: { survie: 1 }, charge: 1,
    description: `La nasse tressée de gaulettes et de vacoa qu'on cale dans le courant, à l'embouchure des rivières, pour les bichiques et les petits poissons. On la pose le soir, on la relève au matin.` }),
  equipement({ cle: "filet-de-peche", nom: "Filet de pêche", categorie: "outil", bonus: { survie: 2 }, charge: 2,
    description: `Un filet noué maille à maille, lesté de galets : long à faire, il nourrit un groupe au lagon ou dans une vasque.` }),
  equipement({ cle: "ligne-de-peche", nom: "Ligne de pêche", categorie: "outil", bonus: { survie: 1 }, charge: 0,
    description: `Un hameçon tordu dans du fil de fer, une ligne, une gaulette : de quoi pêcher depuis les galets.` }),
  equipement({ cle: "pieges-a-rats", nom: "Pièges à rats", categorie: "outil", bonus: {}, charge: 0,
    description: `Deux pièges de planche et de fil de fer. Les rats gâtent les réserves et salissent l'eau : avec eux posés près des stocks, le MJ ne fait pas perdre de vivres aux rats.` }),
  equipement({ cle: "cage-de-bambou", nom: "Cage de bambou", categorie: "outil", bonus: {}, charge: 1,
    description: `Une cage de gaulettes liées : pour emporter vivante une poule ou un lapin trouvés en fouillant. Sans elle, la bête file.` }),
  equipement({ cle: "sac-de-goni", nom: "Sac de goni", categorie: "outil", bonus: {}, charge: 0,
    description: `Le sac de jute des sucreries et des marchés : on y met une bête qui se débat, un porcelet, un cabri tout jeune.` }),
  equipement({ cle: "enfumoir", nom: "Enfumoir", categorie: "outil", bonus: {}, charge: 0,
    description: `Une boîte de conserve percée, du chaume qui fume : on calme un essaim avant de le prendre. Sans lui, l'essaim pique.` })
];

// ---------------------------------------------------------------- La lumière
const LUMIERE = [
  equipement({ cle: "torche", nom: "Torche", categorie: "outil", bonus: {}, charge: 0, eclaire: true, usages: 1,
    description: `Une branche, un chiffon trempé d'huile de bancoul : de la lumière pour une nuit, qui se voit de très loin.` }),
  equipement({ cle: "lampe-a-huile", nom: "Lampe à huile", categorie: "outil", bonus: {}, charge: 0, eclaire: true, usages: 3,
    description: `Un bocal, une mèche de tissu, de l'huile de bancoul : une petite flamme qui fume, pour trois nuits. On la remplit avec une autre bouteille d'huile.` }),
  equipement({ cle: "bougies", nom: "Bougies", categorie: "outil", bonus: {}, charge: 0, eclaire: true, usages: 2,
    description: `La cire des ruches coulée autour d'une mèche : deux nuits d'une lumière douce, qui se voit moins qu'un feu.` }),
  equipement({ cle: "lampe-electrique", nom: "Lampe électrique", categorie: "outil", bonus: {}, charge: 0, eclaire: true,
    description: `Une ampoule de récupération dans un bocal, un câble, une batterie qu'on recharge aux panneaux : une lumière franche et sans fumée, tant qu'il y a du courant.` })
];

// ---------------------------------------------------------------- Les matières travaillées (ce que d'autres recettes demandent)
const M = (cle, nom, description, charge = 0) => equipement({ cle, nom, categorie: "matiere", bonus: {}, charge, description });
const MATIERES = [
  M("charbon-de-bois", "Charbon de bois", `Un sac de charbon tiré d'une meule couverte de terre : le feu de la forge, le four à poterie, le filtre à eau, l'encre. Une forge en brûle un sac par ouvrage.`, 1),
  M("sel", "Sel", `Un bocal de sel de mer, gris et humide, réduit sur le feu : sans sel, pas de boucané, pas d'achards.`),
  M("vinaigre-de-canne", "Vinaigre de canne", `Le jus de canne qu'on a laissé tourner des semaines dans un bocal fermé d'un linge : pour les achards.`),
  M("huile-de-bancoul", "Huile de bancoul", `L'huile à lampe d'autrefois, pressée des noix du bancoulier : elle éclaire, elle graisse les armes, elle entre dans les baumes. Elle ne se mange pas.`),
  M("rhum-de-canne", "Rhum de canne", `Une bouteille du jus fermenté passé une fois à l'alambic : rude. On en fait le rhum arrangé.`),
  M("cendre-tamisee", "Cendre tamisée", `Un seau de cendre de bois fine, passée au tamis : pour la lessive et pour la terre.`, 1),
  M("roue-de-bois", "Roue de bois cerclée", `Une roue de planches chevillées, cerclée de fer à chaud : elle remplace les roues de récupération quand il n'y en a plus.`, 2),
  M("regulateur-de-charge", "Régulateur de charge", `Une petite carte électronique remontée dans un boîtier : sans lui, des panneaux tuent les batteries. Un utilitaire électrique en demande un.`)
];

// ---------------------------------------------------------------- Les remèdes faits à la main (fabrication.mjs : remedePour)
// remede : { afflictions, bonus (dés au soin), remplace (tient lieu d'un médicament) } ; on s'en sert une fois.
const R = (cle, nom, remede, description) => equipement({ cle, nom, categorie: "soin", bonus: {}, charge: 0, remede, description });
const REMEDES = [
  R("tisane-de-la-gramoune", "Tisane de la gramoune", { afflictions: ["gastro-enterite", "dengue", "chikungunya", "coup-de-chaleur"], bonus: 1, remplace: true },
    `La tisane du cahier de la gramoune, ses plantes à elle, ses doses à elle : pour le ventre, les fièvres et les coups de chaleur, elle tient lieu de médicament et donne un dé de plus au soin. Elle ne guérit pas du Gris.`),
  R("tisane-d-ayapana", "Tisane d'ayapana", { afflictions: ["gastro-enterite"], bonus: 1, remplace: true },
    `L'ayapana que les gramounes donnent pour le ventre : pour une gastro-entérite, elle tient lieu de médicament et donne un dé de plus au soin.`),
  R("tisane-de-citronnelle", "Tisane de citronnelle", { afflictions: ["dengue", "chikungunya"], bonus: 1, remplace: true },
    `Celle qu'on boit chaude quand on se sent pris par la fièvre : pour la dengue et le chikungunya, elle tient lieu de médicament et donne un dé de plus au soin.`),
  R("cataplasme-de-feuilles", "Cataplasme de feuilles", { afflictions: ["plaie-infectee", "piqure-de-scolopendre", "brulure"], bonus: 1, remplace: true },
    `Des feuilles pilées, tenues par une lanière de vacoa : sur une plaie qui rougit, une piqûre, une brûlure, il tient lieu de médicament et donne un dé de plus au soin.`),
  R("baume-a-la-cire", "Baume à la cire", { afflictions: ["brulure", "gale"], bonus: 1, remplace: true },
    `Cire d'abeille, huile de bancoul et zerbaz fondus ensemble : pour la peau brûlée ou mangée par la gale, il tient lieu de médicament et donne un dé de plus au soin.`),
  R("sirop-de-miel", "Sirop de miel aux zerbaz", { afflictions: ["dengue", "chikungunya", "leptospirose"], bonus: 1, remplace: false },
    `Du miel et des zerbaz, à la cuillère, pour la gorge et la toux des fièvres : un dé de plus au soin, mais il ne tient pas lieu de médicament.`),
  R("eau-salee-et-sucree", "Eau salée et sucrée", { afflictions: ["gastro-enterite", "coup-de-chaleur"], bonus: 1, remplace: true },
    `De l'eau propre, une pincée de sel, du jus de canne : pour qui se vide ou a pris un coup de chaleur, elle tient lieu de médicament et donne un dé de plus au soin.`),
  R("attelle", "Attelle", { afflictions: ["fracture"], bonus: 1, remplace: true },
    `Deux gaulettes, du tissu, une corde : pour tenir un membre cassé, tout de suite. Elle tient lieu de médicament pour soigner une fracture et donne un dé de plus.`),
  R("lessive-de-cendre", "Lessive de cendre", { afflictions: ["gale"], bonus: 1, remplace: true },
    `De la cendre tamisée et de l'eau chaude : on y fait bouillir le linge et les draps, et la gale s'en va avec. Elle tient lieu de médicament pour la gale et donne un dé de plus.`)
];

// ---------------------------------------------------------------- Transports de charges (la charge en charges, pas en kilos)
// Une charge ≈ 15 kg : la charrette à bras du jeu 3D (120 kg) porte 8, le chariot 10, la remorque de vélo 4 de plus que le vélo,
// le motoculteur attelé 32, l'utilitaire électrique 20 (36 avec sa remorque). La charrette à bœufs de FVTT (40) se fabrique aussi.
const TRANSPORTS = [
  equipement({ cle: "charrette-a-bras", nom: "Charrette à bras", categorie: "transport", bonus: {}, charge: 0, bruit: 1,
    transport: { mode: "pied", places: 0, chargeMax: 8, carburantParQuart: 0, terrains: ["route", "piste"], bruit: 1, allure: 1.2, pente: { descente: 1, montee: 1.6 }, large: true },
    description: `Un plateau de planches, deux roues de bois cerclées, deux brancards : un survivant y emmène des troncs et des sacs. Ni sentier, ni ravine, ni escalier. Un peu d'huile de bancoul aux moyeux tous les trente jours.` }),
  equipement({ cle: "chariot-de-recuperation", nom: "Chariot de récupération", categorie: "transport", bonus: {}, charge: 0, bruit: 1,
    transport: { mode: "pied", places: 0, chargeMax: 10, carburantParQuart: 0, terrains: ["route", "piste"], bruit: 1, allure: 1.1, pente: { descente: 1, montee: 1.5 }, large: true },
    description: `De la ferraille soudée ou boulonnée, une caisse de tôle, deux roues de brouette ou de chariot de supermarché : vite monté, il roule mieux que la charrette, mais pas dans la boue. Deux rustines tous les trente jours.` }),
  equipement({ cle: "velo-et-remorque", nom: "Vélo et sa remorque", categorie: "transport", bonus: { endurance: 1 }, charge: 0, bruit: 0,
    transport: { mode: "pied", places: 1, chargeMax: 7, carburantParQuart: 0, terrains: ["route", "piste"], bruit: 0, allure: 0.6, pente: { descente: 0.7, montee: 3 } },
    description: `Un vélo tout-terrain avec, accrochée derrière, une remorque de ferraille et de planches : les sacs et les planches suivent, sans un bruit. Les montées des Hauts se font à pied, en poussant. Deux rustines tous les vingt jours.` }),
  equipement({ cle: "motoculteur", nom: "Motoculteur", categorie: "transport", bonus: {}, charge: 0, bruit: 4,
    transport: { mode: "vehicule", places: 1, chargeMax: 2, carburantParQuart: 0.5, terrains: ["route", "piste"], bruit: 4, lenteur: 3 },
    description: `Un petit moteur sur deux roues, remis en état : seul, il ne porte presque rien ; il tire une remorque. Il boit du carburant et s'entend de très loin.` }),
  equipement({ cle: "motoculteur-et-remorque", nom: "Motoculteur et sa remorque", categorie: "transport", bonus: {}, charge: 0, bruit: 4,
    transport: { mode: "vehicule", places: 1, chargeMax: 32, carburantParQuart: 0.5, terrains: ["route", "piste"], bruit: 4, lenteur: 3, large: true },
    description: `Le motoculteur attelé à son plateau de ferraille : il porte presque autant qu'une charrette à bœufs, à l'allure d'un homme qui marche, et tout le monde l'entend venir. Deux boîtes de vis tous les quinze jours.` }),
  equipement({ cle: "utilitaire-electrique", nom: "Petit utilitaire électrique", categorie: "transport", bonus: {}, charge: 0, bruit: 0,
    transport: { mode: "vehicule", places: 2, chargeMax: 20, carburantParQuart: 2, terrains: ["route", "piste"], bruit: 0, lenteur: 1.5, source: "energie" },
    description: `Un châssis de voiturette, un moteur électrique, quatre batteries et son régulateur : silencieux, rechargé par les panneaux de l'abri (deux unités d'énergie par quart de route). Ni boue, ni sentier.` }),
  equipement({ cle: "utilitaire-et-remorque", nom: "Utilitaire électrique et sa remorque", categorie: "transport", bonus: {}, charge: 0, bruit: 0,
    transport: { mode: "vehicule", places: 2, chargeMax: 36, carburantParQuart: 3, terrains: ["route", "piste"], bruit: 0, lenteur: 1.8, source: "energie", large: true },
    description: `Le petit utilitaire et le plateau qu'il tire : il déménage un abri sans un bruit, et vide ses batteries en un trajet (trois unités d'énergie par quart de route).` })
];

// ---------------------------------------------------------------- Aménagements d'un véhicule (au MJ de les poser sur un véhicule du groupe)
const AMENAGEMENTS = [
  equipement({ cle: "blindage-de-tole", nom: "Blindage de tôle et grilles", categorie: "amenagement", bonus: {}, charge: 0, amenagement: { parade: 5 },
    description: `Des tôles boulonnées sur les portières, des grilles de fenêtre sur les vitres : dans le véhicule, chaque touche d'un Livide qui passe la main ou la tête est parée sur 5 ou 6, comme un bouclier de tôle. Le MJ le pose sur un véhicule du groupe ; la voiture est plus lourde et plus lente sur les pentes.` }),
  equipement({ cle: "galerie-de-toit", nom: "Galerie de toit", categorie: "amenagement", bonus: {}, charge: 0, amenagement: { charge: 4 },
    description: `Une galerie de tubes soudés sur le toit, des sangles : quatre charges de plus sur un véhicule du groupe (au MJ), et ce qu'on y met se voit de loin.` }),
  equipement({ cle: "remorque-de-voiture", nom: "Remorque de voiture", categorie: "amenagement", bonus: {}, charge: 0, amenagement: { charge: 10, large: true },
    description: `Un essieu, deux roues, un plateau de tôle, un timon et une boule d'attelage : dix charges de plus derrière une voiture ou un 4×4 (au MJ), mais l'attelage ne se faufile plus entre les épaves.` })
];

export const EQUIPEMENTS_ATELIERS = [...OUTILS_FORTUNE, ...OUTILS_RECUPERATION, ...OUTILS_FORGES, ...PIERRE, ...SUITES, ...VIE, ...LUMIERE, ...MATIERES, ...REMEDES, ...TRANSPORTS, ...AMENAGEMENTS];

// ---------------------------------------------------------------- Le barème (en parts) des objets qui valent plus que leur recette
// Le barème du jeu 3D, ramené en parts (une part = deux de ses valeurs) : une arme remise en état vaut un peu plus que l'arme
// d'origine (FVTT : fusil 20, carabine et pistolet 17,5, tronçonneuse 22,5). Les autres objets valent le coût de leur recette.
export const BAREME_ATELIERS = { "fusil-de-chasse-remis-en-etat": 25, "carabine-22-remise-en-etat": 21, "pistolet-de-service-remis-en-etat": 21, "tronconneuse-revisee": 27 };

// ---------------------------------------------------------------- Des ateliers déjà là dans l'île (installationsDepart des sites)
// La forge d'un chantier ou d'une sucrerie, le garage d'une caserne ou du fret, la cuisine de cantine d'un collège, l'alambic d'une
// distillerie, la vannerie d'une case de la côte au vent.
export const ATELIERS_DES_SITES = {
  "alambic-du-tevelave": [{ installation: "distillerie", niveau: 2 }],
  "sucrerie-de-bois-rouge": [{ installation: "distillerie", niveau: 2 }],
  "sucrerie-de-stella": [{ installation: "distillerie", niveau: 1 }, { installation: "forge", niveau: 1 }],
  "sucrerie-du-gol": [{ installation: "forge", niveau: 2 }],
  "base-de-chantier-de-la-digue": [{ installation: "forge", niveau: 1 }, { installation: "atelier-mecanique", niveau: 1 }],
  "centrale-du-port-est": [{ installation: "atelier-electricite", niveau: 2 }],
  "centrale-de-langevin": [{ installation: "atelier-electricite", niveau: 1 }],
  "centrale-de-la-riviere-de-l-est": [{ installation: "atelier-electricite", niveau: 1 }],
  "hangar-fret-gillot": [{ installation: "atelier-mecanique", niveau: 1 }],
  "quartier-de-pierrefonds": [{ installation: "atelier-mecanique", niveau: 2 }],
  "college-de-la-possession": [{ installation: "coin-du-feu", niveau: 2 }],
  "college-hauts-saint-paul": [{ installation: "coin-du-feu", niveau: 2 }],
  "college-du-quatorzieme": [{ installation: "coin-du-feu", niveau: 2 }],
  "ferme-de-la-plaine-des-cafres": [{ installation: "forge", niveau: 1 }, { installation: "etabli", niveau: 1 }],
  "vanilleraie-de-saint-philippe": [{ installation: "vannerie", niveau: 1 }],
  "maison-de-planteur-de-bras-panon": [{ installation: "vannerie", niveau: 1 }],
  "case-de-bellemene": [{ installation: "tisanerie", niveau: 1 }],
  "case-de-hell-bourg": [{ installation: "tisanerie", niveau: 1 }],
  "ferme-d-ilet-a-cordes": [{ installation: "etabli", niveau: 1 }],
  "palangrier-a-quai": [{ installation: "couture", niveau: 1 }]
};
// Le plan se trouve là où le savoir vivait (lot « plans ») : les plans du lot que l'on trouve en fouillant certains sites.
export const PLANS_DES_SITES_ATELIERS = {
  "centrale-du-port-est": ["recette-regulateur-de-charge", "recette-utilitaire-electrique", "atelier-electricite"],
  "centrale-de-langevin": ["recette-regulateur-de-charge"],
  "hangar-fret-gillot": ["recette-utilitaire-electrique", "recette-remorque-d-utilitaire"],
  "alambic-du-tevelave": ["distillerie", "recette-rhum-de-canne"],
  "sucrerie-du-gol": ["forge", "recette-sabre-forge"],
  "base-de-chantier-de-la-digue": ["forge", "recette-blindage-de-tole"],
  "quartier-de-pierrefonds": ["recette-pistolet-de-service-remis-en-etat", "recette-bouclier-double-et-cercle"],
  "ferme-de-la-plaine-des-cafres": ["recette-charrette-a-boeufs", "recette-motoculteur-remis-en-etat"],
  "vanilleraie-de-saint-philippe": ["vannerie", "recette-bertel"],
  "case-de-bellemene": ["tisanerie", "recette-baume-a-la-cire"]
};
export const sitesAvecAteliers = sites => sites.map(s => {
  const ateliers = ATELIERS_DES_SITES[s.cle] ?? [], plans = PLANS_DES_SITES_ATELIERS[s.cle] ?? [];
  if (!ateliers.length && !plans.length) return s;
  return { ...s,
    ...(ateliers.length ? { installationsDepart: [...(s.installationsDepart ?? []), ...ateliers.filter(a => !(s.installationsDepart ?? []).some(x => x.installation === a.installation))] } : {}),
    ...(plans.length ? { plans: [...new Set([...(s.plans ?? []), ...plans])] } : {}) };
});

// ---------------------------------------------------------------- Les plans des ateliers et des recettes du lot (registre, contenu/plans.mjs)
// Un plan reste un rabais (décision de Jordan du 17 novembre 2026) : un quart de matériaux en moins, la moitié du travail. Les
// plans que le jeu 3D exigeait (hache forgée, sabre forgé, régulateur de charge, charrette à bœufs, utilitaire électrique…) sont
// ici de simples plans, plus ou moins rares.
const I = (cle, rarete, lieux = []) => ({ cle, installation: cle, rarete, lieux });
const P = (cle, rarete, lieux = []) => ({ cle: `recette-${cle}`, recette: cle, rarete, lieux });
export const PLANS_ATELIERS = [
  I("coin-du-feu", [5, 20], ["case-creole", "ecole", "gite"]),
  I("etabli", [5, 20], ["case-creole", "ferme", "commerce"]),
  I("forge", [20, 45], ["usine", "ferme"]),
  I("vannerie", [10, 30], ["case-creole", "ilet"]),
  I("couture", [10, 30], ["commerce", "maison", "case-creole"]),
  I("tisanerie", [20, 45], ["case-creole", "ilet"]),
  I("atelier-mecanique", [25, 50], ["usine", "commerce", "caserne"]),
  I("atelier-electricite", [35, 60], ["usine", "commerce", "ecole"]),
  I("distillerie", [30, 55], ["usine", "ferme"]),
  P("hache-forgee", [10, 40], ["ferme", "commerce"]),
  P("sabre-forge", [20, 50], ["ferme", "usine"]),
  P("scie-forgee", [25, 50], ["usine", "commerce"]),
  P("arbalete-d-acier", [35, 60], ["caserne", "commerce"]),
  P("bouclier-double-et-cercle", [15, 35], ["caserne", "usine"]),
  P("fusil-de-chasse-remis-en-etat", [30, 55], ["commerce", "ferme"]),
  P("carabine-22-remise-en-etat", [30, 55], ["commerce", "ferme"]),
  P("pistolet-de-service-remis-en-etat", [40, 65], ["caserne"]),
  P("tronconneuse-revisee", [20, 45], ["commerce", "ferme", "usine"]),
  P("filet-de-peche", [15, 35], ["port"]),
  P("vouve", [10, 30], ["case-creole", "port"]),
  P("bertel", [10, 30], ["case-creole", "ilet"]),
  P("coudre-un-sac", [15, 35], ["commerce", "maison"]),
  P("achards", [10, 25], ["case-creole", "ecole"]),
  P("vinaigre-de-canne", [15, 35], ["ferme", "case-creole"]),
  P("rhum-de-canne", [20, 45], ["usine", "ferme"]),
  P("baume-a-la-cire", [25, 50], ["case-creole"]),
  P("sirop-de-miel", [20, 45], ["case-creole", "ferme"]),
  P("trousse-de-secours", [20, 40], ["hopital", "caserne", "ecole"]),
  P("eau-javellisee", [5, 20], ["hopital", "ecole", "commerce"]),
  P("jarre-de-terre-cuite", [20, 45], ["case-creole", "ilet"]),
  P("roue-de-bois", [20, 45], ["ferme", "ilet"]),
  P("charrette-a-bras", [10, 30], ["ferme", "case-creole"]),
  P("charrette-a-boeufs", [30, 60], ["ferme"]),
  P("chariot-de-recuperation", [10, 30], ["commerce", "usine"]),
  P("velo-remis-en-etat", [10, 30], ["commerce", "maison"]),
  P("remorque-de-velo", [15, 35], ["commerce"]),
  P("motoculteur-remis-en-etat", [35, 60], ["ferme"]),
  P("remorque-de-motoculteur", [25, 45], ["ferme"]),
  P("utilitaire-electrique", [75, 95]),
  P("remorque-d-utilitaire", [40, 65], ["usine"]),
  P("batterie-remise-en-etat", [25, 50], ["commerce", "usine"]),
  P("regulateur-de-charge", [50, 80]),
  P("lampes-electriques", [15, 35], ["commerce", "ecole"]),
  P("blindage-de-tole", [30, 55], ["caserne", "usine"]),
  P("galerie-de-toit", [10, 30], ["commerce", "usine"]),
  P("remorque-de-voiture", [20, 40], ["commerce", "usine"])
];
// Le cahier de tisanes de la gramoune (plan unique du lot « plans ») couvre aussi sa tisane.
export const COUVRE_CAHIER_GRAMOUNE = ["recette:tisane-de-la-gramoune"];

// ---------------------------------------------------------------- Tables du MJ
const T = (cle, nom, description, resultats) => {
  const t = table({ cle, nom, description, resultats });
  Object.assign(t.flags[MODULE], { ateliers: cle });
  return t;
};
export const TABLES_ATELIERS = [
  T("qualite-d-un-outil-trouve", "La qualité d'un outil trouvé",
    `Quand une fouille rend un outil ou une arme blanche (hache, sabre, couteau, marteau…), sa qualité : de fortune six fois sur dix, de récupération trois, forgé une. Dans un lieu dangereux, relancez une fois un « de fortune » (le système : qualiteTrouvee, logique/armes.mjs).`,
    ["De fortune : une pierre emmanchée, un bout de bois durci, des ligatures qui lâchent.", "De fortune : bricolé par quelqu'un d'autre, qui n'en a plus eu besoin.",
      "De fortune : un manche fendu, rafistolé au fil de fer.", "De fortune : il a déjà beaucoup servi.", "De fortune : fait à la hâte, dans les premiers jours.",
      "De fortune : on reconnaît la main d'un ancien, mais le temps a passé dessus.",
      "De récupération : de la ferraille et un manche, bien goupillés.", "De récupération : sorti d'un atelier de quartier, la marque d'un forgeron à la pointe.",
      "De récupération : un outil d'avant, réparé avec ce qu'il y avait.", "Forgé : un vrai outil d'acier, d'avant ou de la forge d'un autre groupe ; il porte peut-être une marque."]),
  T("ce-qui-reste-d-un-atelier", "Ce qui reste d'un atelier abandonné",
    `Un garage, une forge de quartier, la cuisine d'une cantine, l'alambic d'une ferme : ce qu'on y trouve en arrivant, avant de le remettre en marche.`,
    ["Un établi intact sous une bâche, des outils pendus au mur : quelqu'un a fermé à clé en partant, et n'est pas revenu.",
      "Une forge froide, un tas de charbon de bois mouillé, des fers à moitié faits sur l'enclume.",
      "Un garage pillé : plus un outil, mais la fosse est là, et des pièces sous l'établi que personne n'a vues.",
      "Une cuisine de cantine aux marmites énormes ; le gaz est vide, le fourneau à bois du fond marche encore.",
      "Un alambic de ferme, son serpentin vert-de-grisé, des bouteilles vides alignées : il suffit de le nettoyer.",
      "Un atelier de couture de quartier : une machine à pédale, des bobines, des patrons au mur, une veste qui attend son bouton.",
      "La case d'une gramoune : des bottes de zerbaz séchées au plafond, des bocaux sans étiquette, un cahier qu'on ne trouve pas.",
      "Un atelier occupé : quelqu'un y vit et y travaille, et n'aime pas qu'on entre sans frapper."])
];

// ---------------------------------------------------------------- Le journal du MJ
const PAGES_MJ = [
  { cle: "principe", titre: "Fabriquer, à la main et à l'atelier", texte: `Ce qu'on fabrique, dans Fénoir, se fait de deux façons.

- **Depuis le sac** : les petites fabrications (un éclat de basalte, une lance, une torche, une attelle) se font n'importe où, même en route, sur ce que le groupe porte. Certaines demandent de la lumière la nuit.
- **À l'atelier** : les grosses demandent un atelier de leur métier, à l'abri. Il y en a neuf : le **coin du feu**, l'**établi du bois**, la **forge**, la **vannerie du vacoa**, l'**atelier de couture**, la **case à tisanes**, l'**atelier de mécanique**, l'**atelier d'électricité**, la **distillerie**. Chacun a trois niveaux, et c'est le matériau qui fait le niveau : ce que l'île donne d'abord (pierre sèche, bambou, paille et torchis), le bois sous tôle ensuite, le parpaing enfin.

**Un meilleur atelier fait mieux.** Une recette faite à un atelier d'un niveau au-dessus de ce qu'elle demande gagne **un dé** et va **une fois et demie plus vite** ; deux niveaux au-dessus, **deux dés** et **deux fois plus vite**. L'atelier de FVTT d'avant sert d'établi, de mécanique et d'électricité ; la cuisine commune et la gazinière servent de coin du feu.

**Les outils en main.** Beaucoup de recettes demandent un outil : un marteau, une pince, un couteau, une scie, une hache. Un membre du groupe présent doit l'avoir, en état. Une caisse à outils sert de marteau, de pince et de scie ; une tronçonneuse de hache et de scie.

**Les objets qu'une recette consomme.** Certaines demandent un objet fait avant : le charbon de bois de la forge, le sel du boucané, l'huile de bancoul des lampes, l'arme qu'on remet en état. Sur une réussite, il est consommé ; sur un échec, il reste.

**Un échec** rend la moitié des ressources (arrondie au-dessus) ; le reste est gâché. Rien d'autre ne se perd.

**Pour le MJ** : peutFabriquer(cle) dit ce qui manque ; fabriquer({ recette, acteurId }) fait tout (test, coût, objets, outils usés, bruit).` },
  { cle: "outils", titre: "Les outils en trois qualités", texte: `Douze gammes d'outils et d'armes blanches : hache, sabre à canne, couteau, marteau, scie, truelle, pelle et pioche, pied-de-biche, masse, pince coupante, gratte, lance. Chacune existe en trois qualités.

- **De fortune** : pierre, bambou, ligatures, depuis le sac. **Un dé de moins** que l'outil forgé (souvent aucun), et **6 usages**. Il ouvre les recettes qui demandent l'outil : c'est par lui qu'on commence, à mains nues.
- **De récupération** : ferraille, tôle, ressort, un manche, à l'établi. **Le même bonus** que l'outil forgé, **20 usages**.
- **Forgé** : acier, à la forge, avec du charbon de bois. **40 usages** (une hache forgée abat une trentaine d'arbres).

**Un usage**, c'est un quart de travail avec l'outil (abattre, bâtir, fabriquer) ou un combat. Une fabrication use d'un usage chaque outil qu'elle demande ; pour le reste, le MJ use l'outil (userOutil). Au bout de ses usages, l'outil est **cassé** : plus de bonus, et il ne compte plus pour une recette.

**La réparation de fortune** (un bout de fil de fer ou de corde : 1 matériau, un quart) rend la moitié de ses usages, puis le quart, puis le huitième ; **trois fois au plus**. **La pierre à aiguiser** redonne du fil à une lame (hache, sabre, couteau, scie) : un quart des usages, sans compter parmi les trois réparations.

**Ce qu'on trouve** : un outil trouvé en fouillant est de fortune six fois sur dix, de récupération trois, forgé une ; plus le lieu est dangereux, plus il est bon (table « La qualité d'un outil trouvé »).` },
  { cle: "suites", titre: "Les suites : armes remises en état, bouclier doublé", texte: `Ce qui n'existe qu'en un matériau progresse par une version meilleure, faite à l'atelier à partir de l'objet d'origine (consommé) :

- **arc renforcé** (+2 dés au tir) ; **arbalète d'acier à levier** (+2 dés) ;
- **bouclier doublé et cerclé** : il pare chaque touche d'un Livide sur **4, 5 ou 6** (la moitié), contre 5 ou 6 pour la tôle ; trois charges ; 30 usages contre 12 ;
- **fusil de chasse remis en état** (+3 dés), **carabine .22** et **pistolet de service remis en état** (+2) : ils s'enrayent bien moins ;
- **tronçonneuse révisée** : elle dure plus et fait moins de bruit (2 au lieu de 3).

**L'enrayage.** Une arme à feu s'enraye quand le test de tir montre **au moins deux 1** (**trois 1** si elle a été remise en état). Usée (la moitié de ses usages passée, un usage par test de tir), **les 2 comptent comme des 1**. Une arme enrayée ne tire pas : le test est un échec, la munition reste dans l'arme, et il faut la désenrayer avant de tirer de nouveau. À trois dés, une arme d'origine s'enraye environ une fois sur treize ; remise en état, presque jamais.` },
  { cle: "remedes", titre: "Les remèdes faits à la main", texte: `La case à tisanes, le coin du feu et le sac font des remèdes qui ne sont pas des médicaments : une **tisane d'ayapana** pour le ventre, une **tisane de citronnelle** pour les fièvres, un **cataplasme** pour une plaie, un **baume à la cire** pour la peau, une **eau salée et sucrée** pour qui se vide, une **attelle** pour un membre cassé, une **lessive de cendre** contre la gale, un **sirop de miel** pour les fièvres longues.

Quand on soigne une maladie ou une blessure qu'un remède vise, il donne **un dé de plus** au test de soin, et la plupart **tiennent lieu d'un médicament**. On s'en sert une fois. **Aucun ne guérit du Gris**, et le jeu ne promet rien de médical : ce sont des usages de l'île, comme les tisanes et emplâtres d'avant.

**L'eau bouillie** (au coin du feu) et **l'eau javellisée** traitent l'eau de l'abri pour un jour, ou une semaine : les maladies de l'eau baissent comme avec un filtre.` },
  { cle: "transports", titre: "Porter, tirer, rouler", texte: `Les charges se comptent en charges (environ 15 kg) : la **charrette à bras** en porte 8, le **chariot de récupération** 10, le **vélo et sa remorque** 7, le **motoculteur et sa remorque** 32, le **petit utilitaire électrique** 20 (36 avec sa remorque), la **charrette à bœufs** 40. Aucun ne passe les sentiers ; les plus larges ne se faufilent pas entre les épaves.

**Aménager un véhicule** (à l'atelier de mécanique) : un **blindage de tôle et des grilles** (dans le véhicule, chaque touche d'un Livide est parée sur 5 ou 6), une **galerie de toit** (+4 charges), une **remorque** (+10 charges, mais elle ne se faufile plus). Le MJ les pose sur un véhicule du groupe.` }
];
const nomPlanAtelier = p => (p.installation ? INSTALLATIONS_ATELIERS.find(i => i.system.cle === p.installation)?.name
  : `${RECETTES_ATELIERS.find(r => r.system.cle === p.recette)?.name ?? p.recette} (recette)`) ?? p.cle;
PAGES_MJ.push({ cle: "plans", titre: "Les plans des ateliers", texte: `Chaque atelier et les recettes les plus longues ont leur plan, qu'on trouve en fouillant (journal « Les plans »). **Un plan reste un rabais** : avec lui, on bâtit ou on fabrique avec un quart de matériaux en moins et moitié moins de travail. Aucun atelier ni aucune recette ne l'exige. La rareté (0 à 100) dit où on le trouve : à partir de 50, seulement là où le savoir vivait.

${PLANS_ATELIERS.map(p => `- **${nomPlanAtelier(p)}** : rareté ${p.rarete[0]} à ${p.rarete[1]}.`).join(String.fromCharCode(10))}

Le **cahier de tisanes de la gramoune** (plan unique) couvre aussi la tisane de la gramoune.` });
export const JOURNAL_ATELIERS = journal({ cle: "les-ateliers", nom: "Les ateliers et les outils", pack: "mj", pages: PAGES_MJ });

// ---------------------------------------------------------------- Une page du guide du joueur
export const PAGES_JOUEUR_ATELIERS = [
  { cle: "les-ateliers", titre: "Fabriquer et réparer", texte: `On fabrique depuis le sac (une lance, une torche, une attelle) ou à l'atelier, à l'abri. Les neuf ateliers (coin du feu, établi, forge, vannerie, couture, case à tisanes, mécanique, électricité, distillerie) ont chacun trois niveaux ; un atelier au-dessus de ce que demande la recette donne un dé de plus et va plus vite.

- **Les outils** existent de fortune (pierre et bambou : un dé de moins, six usages), de récupération (ferraille : vingt usages) et forgés (quarante). Un outil cassé se rafistole au fil de fer, trois fois au plus ; une pierre à aiguiser redonne du fil aux lames.
- **Beaucoup de recettes** demandent un outil en main, et parfois un objet fait avant (du charbon de bois, du sel, de l'huile de bancoul).
- **Une fabrication ratée** rend la moitié de ce qu'on y a mis.
- **Les armes à feu** s'enrayent : deux 1 au test de tir, et le coup ne part pas. Remises en état, presque plus.
- **Les remèdes** de la case à tisanes (ayapana, citronnelle, cataplasme…) aident à soigner un mal précis et tiennent souvent lieu de médicament. Aucun ne guérit du Gris.` }
];
