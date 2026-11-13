// Le marché de Fénoir (brief du jeu 3D, famille 8 : le marché et les préjugés au marché ; famille 1 : les foires devenues marchés
// de troc saisonniers sous trêve, les oratoires rouges comme boîtes à messages ; famille 3 : le Ladi Lafé). Logique :
// systems/lakour-survie/logique/marche.mjs ; chiffres : docs/equilibre-marche.md ; écriture des préjugés : docs/metissage.md.
//
// Ce que ce fichier donne au registre :
// - COMMUNAUTES : les cibles possibles d'un préjugé (des communautés de l'île, et quelques groupes : gens d'en bas, gens des
//   Hauts, créoles vus par un Zoreil, étrangers au quartier). Un préjugé est un trait d'un PNJ, jamais une propriété de ces
//   communautés : aucune n'a d'effet dans les règles.
// - MARCHANDS : les gens du marché, de toutes les communautés, aucun rôle réservé à une origine ; chacun porte ses propres
//   préjugés (chacun en a sur chacun) et chacun dément par les faits ce qu'on dit de lui (l'événement de marché qui le montre).
// - MARCHES : des marchés forains possibles (jour fixe, terrain à personne, bastions du conseil) ; FOIRES : les foires
//   agricoles d'avant devenues marchés de troc saisonniers, sous trêve.
// - Les tables du marché (étals, ce qui se dit au marché, litiges, oratoires rouges) et les deux journaux (guide du MJ
//   « Le marché et le Ladi Lafé », page du joueur « Troquer ») sont dans tables.mjs et journaux.mjs, qui lisent ce fichier.
import { html } from "./aides.mjs";

// ---------------------------------------------------------------- Les cibles des préjugés
const communaute = (cle, nom, description) => ({ cle, nom, description });
export const COMMUNAUTES = [
  communaute("cafres", "Cafres", "Descendants des esclaves et engagés d'Afrique de l'Est et de Madagascar."),
  communaute("yabs", "Yabs", "Petits blancs des Hauts, créoles blancs des cirques et des plaines."),
  communaute("gros-blancs", "Gros blancs", "Les vieilles familles de planteurs."),
  communaute("zoreils", "Zoreils", "Les métropolitains installés, ou de passage."),
  communaute("malbars", "Malbars", "Tamouls hindous, descendants des engagés de l'Inde du Sud."),
  communaute("zarabes", "Z'arabes", "Musulmans venus du Gujarat, souvent commerçants."),
  communaute("chinois", "Chinois (Sinwa)", "Cantonais et Hakkas, la boutique du quartier."),
  communaute("malgaches", "Malgaches", "Venus de Madagascar, anciens et récents."),
  communaute("comoriens", "Comoriens et Mahorais", "Les derniers arrivés, des Comores et de Mayotte."),
  communaute("creoles", "Créoles (vus par un Zoreil)", "Tous les gens nés ici, vus d'un bloc par qui vient d'ailleurs."),
  communaute("gens-d-en-bas", "Les gens d'en bas", "Ceux de la côte et des villes, vus des Hauts."),
  communaute("gens-des-hauts", "Les gens des Hauts", "Ceux des Hauts et des cirques, vus de la côte."),
  communaute("etrangers-au-quartier", "Les étrangers au quartier", "Quiconque n'est pas d'ici : le premier préjugé d'un boutiquier prudent.")
];

// L'origine d'un marchand (pour le décrire, jamais pour une règle) : une communauté, ou « metis ».
export const ORIGINES = [...COMMUNAUTES.slice(0, 9).map(c => c.cle), "metis"];

// ---------------------------------------------------------------- Les gens du marché
// prejuges : ses préjugés à lui, { cible, poids 1..3, dit } (créole en italique avec son sens) ; onDit : ce qu'on dit de lui au
// marché ; dementi : ce que le jeu montre ; evenement : l'événement de marché qui le montre.
// esprit (lot « moral », fusion des lots) : regard, foi ou ancrage, sens moral, autorité, d'après son histoire (jamais d'après son
// origine) ; posé sur l'acteur que crée creerMarchand.
const marchand = ({ cle, nom, communaute: origine, role, region, apparence, description, prejuges, onDit, dementi, evenement, esprit = {} }) =>
  ({ cle, nom, communaute: origine, role, region, apparence, description: html(description), prejuges, onDit, dementi, evenement, esprit });

export const MARCHANDS = [
  marchand({ cle: "madame-thiaw-kine", esprit: { regard: "refaire", religion: "culte-chinois", religions: [], pratique: true, ancrage: "", sensMoral: 2, autorite: 3 },
    nom: "Madame Thiaw-Kine, la boutiquière", communaute: "chinois", role: "Boutique et carnet de crédit", region: "saint-pierre",
    apparence: "Soixante ans, petite, traits d'Asie de l'Est, cheveux gris tirés en chignon, lunettes au bout d'un cordon, blouse à fleurs.",
    description: `Elle tient la boutique d'alimentation générale de la Rivière Saint-Louis depuis quarante ans : une balance romaine, trois étagères, un réchaud au fond, et le **carnet**, un cahier d'écolier à couverture bleue où chaque dette du quartier est écrite au crayon. Elle n'a pas fermé au jour zéro ; elle a juste baissé le rideau à moitié.`,
    prejuges: [{ cible: "zoreils", poids: 1, dit: "« *Zorey i pèy pa, li rant an Frans.* » (Le Zoreil ne paie pas, il rentre en France.)" }],
    onDit: "« *Sinwa i fé crédi k'a son moun.* » (Le Chinois ne fait crédit qu'aux siens.)",
    dementi: "Son carnet est ouvert à quiconque tient parole : il a nourri tout le quartier, et il y a trois noms chinois sur deux cents.",
    evenement: "marche-le-carnet-ouvert" }),
  marchand({ cle: "thomas-lefevre", esprit: { regard: "vivre", religion: "aucune", religions: [], pratique: false, ancrage: "musique", sensMoral: 1, autorite: 2 },
    nom: "Thomas Lefèvre, dit Radio", communaute: "zoreils", role: "Réparateur de radios", region: "le-tampon",
    apparence: "Trente-cinq ans, grand, peau claire brûlée aux pommettes, cheveux châtains en bataille, lunettes rafistolées au chatterton.",
    description: `Ingénieur du son venu de Lyon pour un festival, deux ans avant le jour zéro, il est resté pour une fille de Bras-Panon et n'est jamais reparti. Il parle un créole appliqué qui fait rire tout le monde, et il a sur son étal un fer à souder qui chauffe au panneau solaire.`,
    prejuges: [{ cible: "creoles", poids: 1, dit: "« L'heure créole » : on ne sait jamais quand ils viendront, alors il donne rendez-vous une heure plus tôt." }],
    onDit: "« *Zorey i koné rien fé isi.* » (Le Zoreil ne sait rien faire ici.)",
    dementi: "C'est lui qui répare les radios de tous les bastions : sans lui, l'île ne s'entendrait plus.",
    evenement: "marche-la-radio-du-zoreil" }),
  marchand({ cle: "jean-marie-dijoux", esprit: { regard: "epreuve", religion: "catholique", religions: [], pratique: false, ancrage: "", sensMoral: 0, autorite: 2 },
    nom: "Jean-Marie Dijoux, les lentilles de l'Îlet à Cordes", communaute: "yabs", role: "Marchand de lentilles", region: "cilaos",
    apparence: "Cinquante ans, sec et noueux, peau très claire rougie par le froid, yeux bleus délavés, chapeau de paille tressée.",
    description: `Il cultive les lentilles en terrasse à l'Îlet à Cordes, comme son père et le père de son père. Il descend chaque semaine par la route de Cilaos, un sac de jute sur l'épaule et un fusil sur l'autre, et remonte avant la nuit.`,
    prejuges: [{ cible: "gens-d-en-bas", poids: 1, dit: "« *Moun anba i vé tout pou rien.* » (Les gens d'en bas veulent tout pour rien.)" }],
    onDit: "« *Yab i désann jamé dann ba.* » (Le Yab ne descend jamais de ses Hauts.)",
    dementi: "Il descend chaque semaine, quatre heures de route à pied, avec les meilleures lentilles de l'île.",
    evenement: "marche-les-lentilles-du-yab" }),
  marchand({ cle: "ismael-omarjee", esprit: { regard: "refaire", religion: "islam", religions: [], pratique: true, ancrage: "", sensMoral: 1, autorite: 3 },
    nom: "Ismaël Omarjee, tissus et quincaillerie", communaute: "zarabes", role: "Commerçant", region: "saint-pierre",
    apparence: "Cinquante-cinq ans, peau mate claire, barbe grise taillée court, calotte blanche, chemise repassée malgré tout.",
    description: `Le magasin de tissus de la rue des Bons-Enfants est devenu un étal de quincaillerie : clous redressés, vis triées par taille, bâches, fil de fer. Il discute chaque prix pied à pied, par principe, et tient lui aussi un petit carnet.`,
    prejuges: [{ cible: "chinois", poids: 1, dit: "« *Sinwa i kas lo pri.* » (Les Chinois cassent les prix.)" }],
    onDit: "Le commerçant z'arabe est « dur en affaires » : il ne lâche jamais une part.",
    dementi: "Après le cyclone, il raye de son carnet les dettes de ceux qui ont tout perdu, sans une phrase.",
    evenement: "marche-les-dettes-effacees" }),
  marchand({ cle: "madame-moutoussamy", esprit: { regard: "epreuve", religion: "hindouisme-tamoul", religions: [], pratique: true, ancrage: "", sensMoral: 4, autorite: 3 },
    nom: "Madame Moutoussamy, la tisaneuse", communaute: "malbars", role: "Tisaneuse", region: "est",
    apparence: "Soixante-dix ans, peau très sombre, cheveux blancs nattés, un pottou rouge au front, sari de coton passé.",
    description: `Elle vend des zerbaz séchés en petits paquets de papier journal, des tisanes pour la fièvre, des emplâtres pour les entorses. Elle fait le service au temple de Saint-André depuis cinquante ans et ne s'en cache pas. Elle soigne d'abord, et demande après ce qu'on peut donner.`,
    prejuges: [{ cible: "zoreils", poids: 1, dit: "« *Zorey i kroi in kashé i gèr tout.* » (Les Zoreils croient qu'un cachet guérit tout.)" }],
    onDit: "On en a peur, « à cause du service » : elle ferait des choses la nuit.",
    dementi: "Elle soigne tout le marché, sans demander à personne qui croit en quoi.",
    evenement: "marche-la-tisaneuse" }),
  marchand({ cle: "soilihi-ahamada", esprit: { regard: "vivre", religion: "islam", religions: [], pratique: false, ancrage: "", sensMoral: 1, autorite: 2 },
    nom: "Soilihi Ahamada, le docker", communaute: "comoriens", role: "Porteur et manutentionnaire", region: "le-port",
    apparence: "Trente ans, peau noire, épaules de docker, kofia brodée, un sourire qu'il ne montre pas aux inconnus.",
    description: `Arrivé de Moroni par Mayotte en 2019, docker au Port jusqu'au jour zéro, il porte aujourd'hui les charges des autres au marché pour une part de ce qu'il porte. Sa sœur Zaïnaba, mahoraise par son mari, tresse les cheveux et les nasses.`,
    prejuges: [{ cible: "yabs", poids: 1, dit: "« *Yab i koz pa ek nou.* » (Les Yabs ne nous parlent pas.)" }],
    onDit: "Les derniers arrivés, comoriens et mahorais, sont « accusés de tout » : au moindre vol, on les regarde.",
    dementi: "C'est lui qui rapporte au conseil l'objet marqué que tout le monde cherchait.",
    evenement: "marche-l-objet-rapporte" }),
  marchand({ cle: "rosaire-fontaine", esprit: { regard: "refaire", religion: "plusieurs", religions: ["catholique", "ancetres-malgaches"], pratique: false, ancrage: "", sensMoral: 3, autorite: 3 },
    nom: "Rosaire Fontaine, porteur de Mafate", communaute: "cafres", role: "Porteur du cirque", region: "mafate",
    apparence: "Quarante-cinq ans, peau noire, crâne rasé, mollets de coureur, une hotte de bambou sur le dos.",
    description: `Avant, il ravitaillait les îlets de Mafate quand l'hélicoptère ne volait pas ; aujourd'hui il est le seul ravitaillement. Trente kilos sur le dos, le sentier Scout ou le col des Bœufs, et il revient avec ce que les îlets échangent.`,
    prejuges: [{ cible: "gros-blancs", poids: 1, dit: "« *Gro blan i gard la tèr.* » (Les gros blancs gardent la terre.)" }],
    onDit: "La vieille rengaine raciste sur les Cafres et la paresse, dans la bouche de qui veut la dire.",
    dementi: "Celui qui la répète est contredit devant tous : le porteur qui ravitaille le cirque à dos d'homme est cafre.",
    evenement: "marche-le-porteur-du-cirque" }),
  marchand({ cle: "armand-de-sainte-croix", esprit: { regard: "epreuve", religion: "catholique", religions: [], pratique: true, ancrage: "", sensMoral: -1, autorite: 3 },
    nom: "Monsieur Armand de Sainte-Croix", communaute: "gros-blancs", role: "Propriétaire du terrain du marché", region: "saint-paul",
    apparence: "Soixante-quinze ans, peau claire tachée de soleil, cheveux blancs plaqués, canne à pommeau, costume de lin froissé.",
    description: `Dernier d'une vieille famille de planteurs de l'Ouest, il a vu partir la canne, puis les enfants, puis le monde. Il a gardé la terre, une varangue et des manières. Il a dit des choses qu'on ne dit plus, et il en dit encore.`,
    prejuges: [{ cible: "cafres", poids: 2, dit: "La vieille rengaine raciste sur les Cafres et la paresse, qu'il répète comme son grand-père, jusqu'au jour où on le contredit devant tous." }],
    onDit: "Le gros blanc « *i gard la tèr* » (il garde la terre).",
    dementi: "Le terrain du marché, c'est lui qui l'a ouvert à tous, et il n'en demande rien.",
    evenement: "marche-le-terrain-ouvert" }),
  marchand({ cle: "lalao-rasoanaivo", esprit: { regard: "refaire", religion: "evangelique", religions: [], pratique: true, ancrage: "", sensMoral: 3, autorite: 4 },
    nom: "Lalao Rasoanaivo, la balance du conseil", communaute: "malgaches", role: "Tenante du cours", region: "saint-pierre",
    apparence: "Quarante ans, peau brune, traits des Hautes Terres, cheveux noirs en chignon serré, un crayon derrière l'oreille.",
    description: `Comptable d'une coopérative de vanille avant le jour zéro, elle tient la grande ardoise du cours et la balance du conseil. Personne ne conteste ses pesées : elle pèse devant tout le monde, deux fois.`,
    prejuges: [{ cible: "malbars", poids: 1, dit: "« *Mi tous pa so tizan, na in servis ladan.* » (Je ne touche pas à ses tisanes, il y a un service dedans.)" }],
    onDit: "« *Bann malgas i vol nout travay.* » (Les Malgaches nous volent le travail.)",
    dementi: "Le travail qu'elle fait, personne ne voulait le faire : tenir un cours juste, le même pour tous, et peser deux fois devant tout le monde.",
    evenement: "marche-le-cours-s-affole" }),
  marchand({ cle: "gerard-payet", esprit: { regard: "refaire", religion: "aucune", religions: [], pratique: false, ancrage: "routine", sensMoral: 3, autorite: 4 },
    nom: "Gérard Payet, président du conseil du marché", communaute: "metis", role: "Président du conseil", region: "saint-pierre",
    apparence: "Soixante ans, métis à la peau brune, aux traits d'une grand-mère hakka, moustache grise, voix de stentor.",
    description: `Ancien chef de rayon, élu président du conseil parce que tout le monde le connaît et que personne ne le craint. Il ouvre chaque marché par la même phrase, « *isi la pa pou batay* » (ici, ce n'est pas pour se battre), et il la pense.`,
    prejuges: [{ cible: "comoriens", poids: 2, dit: "« *Dopi zot la arivé, tout i disparé.* » (Depuis qu'ils sont arrivés, tout disparaît.)" }],
    onDit: "Le président « fait passer ses amis d'abord ».",
    dementi: "Au premier litige, il donne raison à un inconnu contre son propre cousin ; et quand l'objet marqué revient, il reconnaît devant le conseil qu'il s'était trompé sur les derniers arrivés.",
    evenement: "marche-le-litige" })
];

// ---------------------------------------------------------------- Des marchés forains possibles
// Un jour fixe par semaine (0 = dimanche … 6 = samedi), un terrain qui n'est à personne, une voix par bastion au conseil.
const marche = ({ cle, nom, region, lieu, jourSemaine, bastions, description }) => ({ cle, nom, region, lieu, jourSemaine, bastions, description: html(description) });
export const MARCHES = [
  marche({ cle: "marche-de-bourg-murat", nom: "Le marché du samedi à Bourg-Murat", region: "le-tampon", lieu: "le parking du gîte, au bord de la route du Volcan", jourSemaine: 6,
    bastions: ["cooperative-des-plaines"],
    description: `Le troc du samedi de la Coopérative, devenu le marché des Plaines : lait, fromage, légumes des Hauts, contre outils, graines et nouvelles d'en bas. Les fermiers y montent la garde à tour de rôle, cloches de vache aux barrières.` }),
  marche({ cle: "marche-de-savanna", nom: "Le marché aux pièces de Savanna", region: "saint-paul", lieu: "le parking de l'hypermarché, entre les caddies renversés", jourSemaine: 3,
    bastions: ["ferrailleurs"],
    description: `Le mercredi, les Ferrailleurs étalent ce que les villes ont laissé : batteries, pneus, panneaux, outils. On y troque tout contre tout, et on n'y laisse rien sans garde. Le terrain est celui de Monsieur de Sainte-Croix, qui l'a ouvert à tous.` }),
  marche({ cle: "marche-du-quai-de-saint-pierre", nom: "Le marché du quai de Saint-Pierre", region: "saint-pierre", lieu: "le front de mer, sous les filaos, entre le port et la rivière d'Abord", jourSemaine: 0,
    bastions: ["barques-du-sud", "dispensaire-du-sud"],
    description: `Le dimanche matin, avant la chaleur : poisson des Barques, soins du Dispensaire, la boutique Thiaw-Kine qui monte un étal, la tisaneuse, le réparateur de radios. Le conseil s'assoit sous le kiosque ; Gérard Payet le préside, Lalao Rasoanaivo tient le cours.` }),
  marche({ cle: "marche-du-col-des-boeufs", nom: "Le troc du col des Bœufs", region: "salazie", lieu: "le col, entre Salazie et Mafate, là où la route s'arrête", jourSemaine: 5,
    bastions: ["familles-des-ilets"],
    description: `Le vendredi, les Familles des Îlets descendent au col ce que Mafate échange, et repartent avec ce que Salazie apporte. Personne ne monte plus haut sans les trois jours de quarantaine. Rosaire Fontaine y porte la moitié des charges.` })
];

// ---------------------------------------------------------------- Les foires de saison (sous trêve)
// mois : 1..12 ; recolte : la ressource qui vaut moitié moins ce jour-là (le cours du troc) ; produit : ce qu'on y fête.
const foire = ({ cle, nom, region, mois, recolte, produit, description }) => ({ cle, nom, region, mois, recolte, produit, description: html(description) });
export const FOIRES = [
  foire({ cle: "foire-des-lentilles", nom: "La foire des lentilles de Cilaos", region: "cilaos", mois: 10, recolte: "nourriture", produit: "les lentilles",
    description: `En octobre, Cilaos fêtait ses lentilles. La fête est devenue une foire de troc sous trêve : les terrasses de l'Îlet à Cordes donnent leur récolte, les bastions montent de toute l'île par la route aux quatre cents virages, et pendant trois jours personne ne lève la main sur personne dans le cirque.` }),
  foire({ cle: "foire-du-chouchou", nom: "La foire du chouchou de Salazie", region: "salazie", mois: 5, recolte: "nourriture", produit: "les chouchous",
    description: `Les treilles de chouchous croulent dans le cirque le plus vert de l'île. On en fait des gratins, des achards, on en troque des sacs entiers. Hell-Bourg rouvre ses cases créoles pour trois jours.` }),
  foire({ cle: "foire-des-goyaviers", nom: "La foire des goyaviers de la Plaine des Palmistes", region: "plaine-des-palmistes", mois: 6, recolte: "nourriture", produit: "les goyaviers",
    description: `En juin, les goyaviers rougissent toute la Plaine : on les cueille par paniers, on en fait des confitures et du rhum arrangé, et l'on troque le reste sous la pluie fine des Palmistes.` }),
  foire({ cle: "foire-du-vacoa", nom: "La foire du vacoa de Saint-Philippe", region: "sud-sauvage", mois: 8, recolte: "materiaux", produit: "les feuilles de vacoa tressées",
    description: `Les tresseuses du Sud sauvage sortent leurs feuilles de vacoa séchées : nattes, paniers, chapeaux, cordes, toitures. Tout ce qui se tresse se troque, et l'on mange les cœurs de palmiste du Sud.` }),
  foire({ cle: "foire-aux-semences", nom: "La foire aux semences du Nouvel An tamoul", region: "est", mois: 4, recolte: "graines", produit: "les semences",
    description: `En avril, la fin des cyclones et le Nouvel An tamoul : le signal des semis. Les abris de l'Est échangent leurs graines devant le temple de Saint-André, sachet contre sachet, et chacun repart avec de quoi semer ce qu'il n'avait pas.` })
];

// ---------------------------------------------------------------- Le cours de base (pour les textes : la logique le calcule)
// Doit rester égal à REGLES_MARCHE.cours.base de systems/lakour-survie/logique/marche.mjs (un essai le vérifie).
export const COURS_TEXTE = { eau: 1, nourriture: 1, plantes: 1, graines: 2, materiaux: 2, munitions: 3, pieces: 3, carburant: 4, medicaments: 5 };
