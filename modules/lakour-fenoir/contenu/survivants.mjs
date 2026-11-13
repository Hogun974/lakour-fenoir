// Prétirés (un par grand profil) et PNJ nommés de Fénoir : acteurs « survivant » (contrat §3.1 et §10.1) avec enfance, passé,
// passions, traits, incapacités ; savoirs et équipement incorporés. Compétences = enfance + passé + traits (budget 10 à 16).
import { survivant } from "./aides.mjs";
import { SAVOIRS } from "./savoirs.mjs";
import { EQUIPEMENTS } from "./equipements.mjs";
import { imageJeton } from "./jetons.mjs";

const sv = cle => SAVOIRS.find(s => s.system.cle === cle);
const eq = cle => EQUIPEMENTS.find(e => e.system.cle === cle);
const objets = (savoirs = [], equipement = []) => [...savoirs.map(sv), ...equipement.map(eq)].map((o, i, l) => {
  if (!o) throw new Error(`survivants.mjs : objet inconnu (${[...savoirs, ...equipement][i]})`);
  return o;
});

// esprit (complément du jeu 3D, familles 2 et 3 ; système : logique/esprit.mjs) : regard, religion (ou ancrage), pratique,
// sens moral (−10 rouge .. +10 bleu), autorité (0..5). Choisis à la main, d'après qui ils sont : jamais d'après leur origine.
const E = (regard, religion, { religions = [], pratique = false, ancrage = "", sensMoral = 0, autorite = 2 } = {}) =>
  ({ regard, religion, religions, pratique, ancrage, sensMoral, autorite });
function pretire({ cle, nom, passe, enfance, age, competences, passions, traits, incapacites = [], savoirs, equipement, notes, lien = "", esprit = {} }) {
  return survivant({ cle, nom, passe, enfance, age, competences, passions, traits, incapacites, lien, statut: "joueur", notes,
    objets: objets(savoirs, equipement), img: imageJeton(cle), extra: { pretire: true }, esprit });
}
function pnj({ cle, nom, passe = "", enfance = "", age, competences, passions = {}, traits = [], incapacites = [], savoirs = [], equipement = [], notes, lien = "", disposition = 0, esprit = {} }) {
  return survivant({ cle, nom, passe, enfance, age, competences, passions, traits, incapacites, lien, statut: "pnj", pnj: true, notes,
    objets: objets(savoirs, equipement), img: imageJeton(cle), disposition, esprit });
}

export const PRETIRES = [
  pretire({ cle: "pretire-soignante", esprit: E("refaire", "islam", { sensMoral: 3, autorite: 2 }), nom: "Nadia Patel, infirmière", passe: "infirmiere-du-chu", enfance: "enfance-zarab-de-saint-pierre", age: 38,
    competences: { soins: 3, parole: 3, vigilance: 1, endurance: 1, survie: 1, combat: 1 }, passions: { soins: 2, parole: 1 }, traits: ["bras-tendu", "nuits-blanches"],
    savoirs: ["premiers-secours-avances"], equipement: ["sac-d-intervention", "frontale"],
    notes: `Douze ans d'urgences à Bellepierre. Fille de commerçants z'arabes de Saint-Pierre, elle a préféré les gardes de nuit au magasin de tissus ; à qui lui sort « *zot i marie ant' zot* » (vous ne vous mariez qu'entre vous), elle montre l'alliance d'un Maillot de l'Étang-Salé. Elle parle doucement et ne lâche jamais. Elle cherche son frère, parti en mer le matin du jour zéro.` }),
  pretire({ cle: "pretire-bricoleur", esprit: E("refaire", "plusieurs", { religions: ["catholique", "ancetres-malgaches"], sensMoral: 0, autorite: 2 }), nom: "Rivo Rakotomalala, électricien", passe: "electricien", enfance: "enfance-a-madagascar", age: 44,
    competences: { bricolage: 4, endurance: 2, conduite: 1, vigilance: 1, parole: 1, survie: 1 }, passions: { bricolage: 2 }, traits: ["touche-a-tout", "tete-de-bois"],
    savoirs: ["electricite-solaire"], equipement: ["caisse-a-outils", "scooter", "panneaux-demontables"],
    notes: `Arrivé de Tamatave à vingt ans, il a câblé la moitié des toits de l'Ouest. Sur les chantiers, il a assez entendu « *bann malgas i vol nout travay* » (les Malgaches nous volent le travail) pour avoir appris à répondre en créole mieux que ceux qui le disaient. Il croit qu'un abri sans courant est un abri mort, et il a souvent raison.` }),
  pretire({ cle: "pretire-combattante", esprit: E("epreuve", "aucune", { ancrage: "routine", pratique: true, sensMoral: 1, autorite: 3 }), nom: "Marie-Josée Payet, gendarme", passe: "gendarme", enfance: "enfant-de-militaire", age: 33,
    competences: { tir: 3, parole: 2, vigilance: 2, conduite: 1, combat: 1, endurance: 1 }, passions: { tir: 1, vigilance: 2 }, traits: ["oeil-froid", "leve-avant-le-coq"],
    savoirs: ["radio"], equipement: ["pistolet-de-service", "talkies"],
    notes: `Brigadière dans le Sud, fille d'un adjudant zoreil et d'une Payet de Saint-Louis, elle a toujours su où était sa place. Au collège, les uns la disaient zoreil, les autres créole ; elle a fini par répondre « les deux », et par le penser. Plus de hiérarchie, plus d'ordres : il lui reste sa conscience et un chargeur.` }),
  pretire({ cle: "pretire-eclaireur", esprit: E("vivre", "aucune", { ancrage: "sport", pratique: true, sensMoral: 0, autorite: 1 }), nom: "Sully Técher, guide de canyon", passe: "guide-de-canyon", enfance: "enfant-de-cilaos", age: 29,
    competences: { endurance: 3, survie: 2, vigilance: 2, discretion: 1, soins: 1, combat: 1 }, passions: { survie: 2, endurance: 1 }, traits: ["jambes-de-cabri", "loup-solitaire"],
    savoirs: ["etaiement-galeries"], equipement: ["materiel-de-canyon", "sac-de-randonnee", "frontale"],
    notes: `Né à Cilaos, yab de vieille souche, il connaît chaque sentier des cirques. En ville, on l'appelait « *yab kouyon* » (le petit blanc niais des Hauts) ; ceux qui le disaient le suivent aujourd'hui sur les sentiers, en silence. Il parle peu, marche vite, et préfère la montagne aux gens.` }),
  pretire({ cle: "pretire-meneur", esprit: E("epreuve", "catholique", { pratique: true, sensMoral: 2, autorite: 4 }), nom: "Firmin Boyer, retraité de la marine", passe: "retraite-de-la-marine", enfance: "enfance-sur-un-bateau", age: 64,
    competences: { parole: 3, vigilance: 2, conduite: 2, tir: 1, soins: 1, bricolage: 1 }, passions: { parole: 2 }, traits: ["sang-de-basalte", "creole-de-coeur"], incapacites: ["travaux-lourds"],
    savoirs: ["radio"], equipement: ["radio-marine", "jumelles", "carabine-22"],
    notes: `Yab des Hauts de Saint-Joseph par son père, élevé sur le voilier de ses parents, trente ans de marine : une voix qui porte, un dos qui ne porte plus. Aux officiers zoreils qui se plaignaient de « l'heure créole », il répondait que ses matelots réunionnais étaient les premiers au poste par gros temps. Il sait commander sans crier et écouter sans juger.` }),
  pretire({ cle: "pretire-cultivatrice", esprit: E("refaire", "plusieurs", { religions: ["hindouisme-tamoul", "catholique"], pratique: true, sensMoral: 2, autorite: 2 }), nom: "Valliamée Narayanin, agricultrice des Hauts", passe: "agricultrice-des-hauts", enfance: "enfant-de-la-plaine-des-cafres", age: 47,
    competences: { survie: 3, endurance: 3, bricolage: 1, conduite: 1, tir: 1, soins: 1 }, passions: { survie: 2 }, traits: ["doigts-de-terre", "coeur-de-kour"],
    savoirs: ["elevage", "maraichage-tropical"], equipement: ["fusil-de-chasse", "cheval-de-la-plaine"],
    notes: `Elle tient une ferme laitière de la Plaine des Cafres avec son frère, malbars dans un pays de yabs depuis trois générations. Les voisins ont mis vingt ans à cesser de dire qu'« *in malbar i koné la kann, pa la vash* » (un Malbar connaît la canne, pas les vaches) ; son lait a gagné trois fois le concours de Bourg-Murat. Elle sait faire vivre une famille d'une terre, et elle compte bien continuer.` })
];

export const PNJ = [
  pnj({ cle: "commandante-hoarau", esprit: E("epreuve", "catholique", { sensMoral: -2, autorite: 4 }), nom: "La commandante Hoarau", age: 52, competences: { parole: 3, tir: 3, vigilance: 2 }, traits: ["tete-de-bois", "sang-de-basalte"], disposition: 0,
    lien: "Garnison du Quai", equipement: ["fusil-reglementaire"], notes: `Ancienne officière de port, petite blanche de la Plaine des Grègues descendue à la mer à dix-huit ans, à la tête de la Garnison. Elle croit qu'il faut un ordre pour survivre, et elle a peut-être raison. Elle signe « pour l'autorité provisoire » ; ses dockers la disent « plus zoreil que les Zoreils », avec ses tampons, mais elle a grandi sans électricité, dans une case en bois sous tôle.` }),
  pnj({ cle: "memee-lucette", esprit: E("refaire", "catholique", { pratique: true, sensMoral: 4, autorite: 5 }), nom: "Mémé Lucette", age: 74, competences: { parole: 3, survie: 3, soins: 1 }, traits: ["main-ouverte", "tete-de-bois"], disposition: 1,
    lien: "Coopérative des Plaines", savoirs: ["elevage"], notes: `Éleveuse de la Plaine des Cafres, petite blanche des Hauts, présidente du conseil de la Coopérative. Elle a vu passer tous les cyclones depuis 1948 et n'a peur de rien, sauf de la ville. Elle dit des gens d'en bas qu'« *zot i koné pa trèr in vash* » (ils ne savent pas traire une vache), et elle a pourtant logé sans un mot une famille comorienne du Chaudron montée à pied.` }),
  pnj({ cle: "gros-mani", esprit: E("vivre", "aucune", { ancrage: "photo", sensMoral: -1, autorite: 3 }), nom: "Gros Mani", age: 41, competences: { bricolage: 3, parole: 2, conduite: 2, combat: 2 }, traits: ["doigts-crochus", "touche-a-tout"], disposition: 0,
    lien: "Ferrailleurs", savoirs: ["mecanique"], equipement: ["pied-de-biche"], notes: `Tient la casse de la Rivière des Galets, cafre du Port et fier de l'être. Rit fort, compte vite, n'oublie jamais une dette — ni une faveur. Au client qui lui ressort la vieille rengaine des Cafres paresseux, il montre les mille carcasses démontées à la main, et double le prix.` }),
  pnj({ cle: "patron-grondin", esprit: E("epreuve", "plusieurs", { religions: ["catholique", "ancetres-malgaches"], sensMoral: 1, autorite: 3 }), nom: "Le patron Grondin", age: 58, competences: { survie: 3, conduite: 3, parole: 2 }, traits: ["peur-de-la-mer", "nuage-noir"], disposition: 0,
    lien: "Barques du Sud", savoirs: ["peche-lagon"], equipement: ["barque-a-moteur"], notes: `Pêcheur de Saint-Pierre, métis à la peau sombre, chef de la flottille. Il a peur de la mer depuis qu'il y a perdu son fils, et il y retourne chaque jour. Il en veut aux Zoreils qui ont racheté les cases du front de mer, mais son meilleur matelot est un moniteur de voile breton qui ne parle toujours pas créole.` }),
  pnj({ cle: "frere-expedit", esprit: E("epreuve", "plusieurs", { religions: ["catholique", "hindouisme-tamoul"], pratique: true, sensMoral: 2, autorite: 4 }), nom: "Frère Expédit", age: 49, competences: { parole: 4, soins: 2 }, traits: ["ame-de-pelerin", "main-qui-ne-frappe-pas"], incapacites: ["violence"], disposition: 0,
    lien: "Pèlerins de la Lave", notes: `Ancien catéchiste de Sainte-Rose, métis au visage de Malbar, élevé par une grand-mère qui allait à la messe le dimanche et au temple le vendredi. Voix douce, regard qui ne cille pas. Il croit sincèrement que le volcan protège ceux qui vivent à son pied ; ses fidèles le croient plus encore, et certains murmurent, quand il allume une lampe à huile, qu'il fait « un service » en cachette.` }),
  pnj({ cle: "ancienne-de-la-nouvelle", esprit: E("refaire", "catholique", { pratique: true, sensMoral: 4, autorite: 4 }), nom: "Madame Lauret, l'ancienne de La Nouvelle", age: 68, competences: { parole: 3, survie: 2, soins: 1 }, traits: ["soleil-dedans", "coeur-de-kour"], disposition: 1,
    lien: "Familles des Îlets", savoirs: ["hydraulique-rurale", "electricite-solaire"], notes: `Ancienne institutrice de Mafate, petite blanche d'un îlet qu'aucune route n'a jamais atteint, elle a appris à lire à la moitié du cirque. Les sentiers l'écoutent. Elle décide qui entre. On l'a assez traitée d'arriérée des Hauts, à l'École normale de Saint-Denis, pour savoir ce que valent les diplômes des gens d'en bas quand la pluie coupe le sentier.` }),
  pnj({ cle: "docteure-soundirassen", esprit: E("refaire", "hindouisme-tamoul", { sensMoral: 1, autorite: 3 }), nom: "La docteure Soundirassen", age: 45, competences: { soins: 5, parole: 2, vigilance: 1 }, traits: ["nuits-blanches", "coeur-d-artichaut"], disposition: 1,
    lien: "Dispensaire du Sud", savoirs: ["premiers-secours-avances"], equipement: ["sac-d-intervention"], notes: `Urgentiste au grand hôpital du Sud, fille d'une famille malbare de Saint-André, elle n'en est pas sortie depuis le jour zéro. Elle cherche un remède, et commence à trouver acceptables des choses qui ne l'étaient pas. Sa mère disait des Cafres qu'« *zot i pens pa demain* » (ils ne pensent pas au lendemain) ; c'est un brancardier cafre de la Ravine des Cabris qui garde sa porte depuis le jour zéro, et elle ne laisse plus personne finir cette phrase devant elle.` }),
  pnj({ cle: "le-comptable", esprit: E("refaire", "aucune", { ancrage: "carnet", pratique: true, sensMoral: -6, autorite: 4 }), nom: "Le Comptable", age: 39, competences: { parole: 3, discretion: 3, tir: 2, vigilance: 2 }, traits: ["oeil-froid", "doigts-crochus"], disposition: -1,
    lien: "Sans-Lune", equipement: ["pistolet-de-service"], notes: `Chef des Sans-Lune. Ancien employé de banque, fils d'une boutique chinoise du Chaudron, il tient sur un cahier ce que chaque quartier lui doit. Il ne hausse jamais la voix. Sa mère faisait crédit à tout le quartier, créoles, Comoriens, Malbars, sur un carnet qu'elle déchirait aux enterrements ; elle ne prononce plus le nom de son fils.` }),
  pnj({ cle: "ti-zan-l-enfant", esprit: E("vivre", "islam", { sensMoral: 1, autorite: 0 }), nom: "Ti Zan", age: 9, competences: { discretion: 3, vigilance: 2, endurance: 1 }, traits: ["oiseau-de-rien", "loup-solitaire"], disposition: 0,
    notes: `Un enfant seul, muet depuis le jour zéro, qui suit le groupe à distance avec un doudou en forme de tangue. Sa kofia brodée dit qu'il vient d'une famille comorienne ; au camp, certains disent « *pa nout zafèr* » (pas notre affaire), d'autres lui laissent du riz. Il connaît des passages que personne d'autre ne voit.` }),
  pnj({ cle: "agent-de-la-riviere-de-l-est", esprit: E("epreuve", "plusieurs", { religions: ["catholique", "culte-chinois"], sensMoral: -1, autorite: 2 }), nom: "Josian Robert, agent de la centrale", age: 56, competences: { bricolage: 4, vigilance: 2, parole: 1 }, traits: ["tete-de-bois", "rat-de-galerie"], disposition: 0,
    savoirs: ["hydraulique-rurale", "electricite-solaire"], equipement: ["caisse-a-outils"], notes: `Un des deux agents restés à la centrale de la Rivière de l'Est, fils d'un Robert de Saint-Benoît et d'une Ah-Kiem. Il fait tourner ce qu'il peut, se méfie de tout le monde, et sait que tôt ou tard quelqu'un viendra prendre son courant. Côté Ah-Kiem, on lui a appris à compter, côté Robert à partager, et chaque côté le soupçonne de tenir de l'autre.` }),
  pnj({ cle: "radioamatrice-du-brule", esprit: E("vivre", "aucune", { ancrage: "routine", pratique: true, sensMoral: 3, autorite: 3 }), nom: "Ophélie Turpin, la voix du Brûlé", age: 61, competences: { bricolage: 2, parole: 3, vigilance: 2 }, traits: ["soleil-dedans", "nuits-blanches"], disposition: 1,
    savoirs: ["radio"], equipement: ["radio-marine"], notes: `Radioamatrice dans les hauts de Saint-Denis, petite blanche du Brûlé, elle émet chaque soir les nouvelles qu'elle reçoit, vraies ou fausses, et lit des histoires aux enfants le matin. Beaucoup de groupes la connaissent sans l'avoir vue. Elle ouvre chaque émission par « *tout' bann kaf, yab, malbar, zarab, sinwa, komor, zorey ki ékout amwin* » (tous ceux qui m'écoutent, de toutes les couleurs), et chaque soir quelqu'un râle d'avoir été cité le dernier.` })
];

export const SURVIVANTS = [...PRETIRES, ...PNJ];
