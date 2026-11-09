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

function pretire({ cle, nom, passe, enfance, age, competences, passions, traits, incapacites = [], savoirs, equipement, notes, lien = "" }) {
  return survivant({ cle, nom, passe, enfance, age, competences, passions, traits, incapacites, lien, statut: "joueur", notes,
    objets: objets(savoirs, equipement), img: imageJeton(cle), extra: { pretire: true } });
}
function pnj({ cle, nom, passe = "", enfance = "", age, competences, passions = {}, traits = [], incapacites = [], savoirs = [], equipement = [], notes, lien = "", disposition = 0 }) {
  return survivant({ cle, nom, passe, enfance, age, competences, passions, traits, incapacites, lien, statut: "pnj", pnj: true, notes,
    objets: objets(savoirs, equipement), img: imageJeton(cle), disposition });
}

export const PRETIRES = [
  pretire({ cle: "pretire-soignante", nom: "Nadia Patel, infirmière", passe: "infirmiere-du-chu", enfance: "enfance-zarab-de-saint-pierre", age: 38,
    competences: { soins: 3, parole: 3, vigilance: 1, endurance: 1, survie: 1, combat: 1 }, passions: { soins: 2, parole: 1 }, traits: ["bras-tendu", "nuits-blanches"],
    savoirs: ["premiers-secours-avances"], equipement: ["sac-d-intervention", "frontale"],
    notes: `Douze ans d'urgences à Bellepierre. Elle parle doucement et ne lâche jamais. Elle cherche son frère, parti en mer le matin du jour zéro.` }),
  pretire({ cle: "pretire-bricoleur", nom: "Rivo Rakotomalala, électricien", passe: "electricien", enfance: "enfance-a-madagascar", age: 44,
    competences: { bricolage: 4, endurance: 2, conduite: 1, vigilance: 1, parole: 1, survie: 1 }, passions: { bricolage: 2 }, traits: ["touche-a-tout", "tete-de-bois"],
    savoirs: ["electricite-solaire"], equipement: ["caisse-a-outils", "scooter", "panneaux-demontables"],
    notes: `Arrivé de Tamatave à vingt ans, il a câblé la moitié des toits de l'Ouest. Il croit qu'un abri sans courant est un abri mort, et il a souvent raison.` }),
  pretire({ cle: "pretire-combattante", nom: "Marie-Josée Payet, gendarme", passe: "gendarme", enfance: "enfant-de-militaire", age: 33,
    competences: { tir: 3, parole: 2, vigilance: 2, conduite: 1, combat: 1, endurance: 1 }, passions: { tir: 1, vigilance: 2 }, traits: ["oeil-froid", "leve-avant-le-coq"],
    savoirs: ["radio"], equipement: ["pistolet-de-service", "talkies"],
    notes: `Brigadière dans le Sud, fille de militaire, elle a toujours su où était sa place. Plus de hiérarchie, plus d'ordres : il lui reste sa conscience et un chargeur.` }),
  pretire({ cle: "pretire-eclaireur", nom: "Sully Técher, guide de canyon", passe: "guide-de-canyon", enfance: "enfant-de-cilaos", age: 29,
    competences: { endurance: 3, survie: 2, vigilance: 2, discretion: 1, soins: 1, combat: 1 }, passions: { survie: 2, endurance: 1 }, traits: ["jambes-de-cabri", "loup-solitaire"],
    savoirs: ["etaiement-galeries"], equipement: ["materiel-de-canyon", "sac-de-randonnee", "frontale"],
    notes: `Né à Cilaos, il connaît chaque sentier des cirques. Il parle peu, marche vite, et préfère la montagne aux gens.` }),
  pretire({ cle: "pretire-meneur", nom: "Firmin Boyer, retraité de la marine", passe: "retraite-de-la-marine", enfance: "enfance-sur-un-bateau", age: 64,
    competences: { parole: 3, vigilance: 2, conduite: 2, tir: 1, soins: 1, bricolage: 1 }, passions: { parole: 2 }, traits: ["sang-de-basalte", "creole-de-coeur"], incapacites: ["travaux-lourds"],
    savoirs: ["radio"], equipement: ["radio-marine", "jumelles", "carabine-22"],
    notes: `Trente ans de marine, une voix qui porte, un dos qui ne porte plus. Il sait commander sans crier et écouter sans juger.` }),
  pretire({ cle: "pretire-cultivatrice", nom: "Valliamée Narayanin, agricultrice des Hauts", passe: "agricultrice-des-hauts", enfance: "enfant-de-la-plaine-des-cafres", age: 47,
    competences: { survie: 3, endurance: 3, bricolage: 1, conduite: 1, tir: 1, soins: 1 }, passions: { survie: 2 }, traits: ["doigts-de-terre", "coeur-de-kour"],
    savoirs: ["elevage", "maraichage-tropical"], equipement: ["fusil-de-chasse", "cheval-de-la-plaine"],
    notes: `Elle tient une ferme laitière de la Plaine des Cafres avec son frère. Elle sait faire vivre une famille d'une terre, et elle compte bien continuer.` })
];

export const PNJ = [
  pnj({ cle: "commandante-hoarau", nom: "La commandante Hoarau", age: 52, competences: { parole: 3, tir: 3, vigilance: 2 }, traits: ["tete-de-bois", "sang-de-basalte"], disposition: 0,
    lien: "Garnison du Quai", equipement: ["fusil-reglementaire"], notes: `Ancienne officière de port, à la tête de la Garnison. Elle croit qu'il faut un ordre pour survivre, et elle a peut-être raison. Elle signe « pour l'autorité provisoire ».` }),
  pnj({ cle: "memee-lucette", nom: "Mémé Lucette", age: 74, competences: { parole: 3, survie: 3, soins: 1 }, traits: ["main-ouverte", "tete-de-bois"], disposition: 1,
    lien: "Coopérative des Plaines", savoirs: ["elevage"], notes: `Éleveuse de la Plaine des Cafres, présidente du conseil de la Coopérative. Elle a vu passer tous les cyclones depuis 1948 et n'a peur de rien, sauf de la ville.` }),
  pnj({ cle: "gros-mani", nom: "Gros Mani", age: 41, competences: { bricolage: 3, parole: 2, conduite: 2, combat: 2 }, traits: ["doigts-crochus", "touche-a-tout"], disposition: 0,
    lien: "Ferrailleurs", savoirs: ["mecanique"], equipement: ["pied-de-biche"], notes: `Tient la casse de la Rivière des Galets. Rit fort, compte vite, n'oublie jamais une dette — ni une faveur.` }),
  pnj({ cle: "patron-grondin", nom: "Le patron Grondin", age: 58, competences: { survie: 3, conduite: 3, parole: 2 }, traits: ["peur-de-la-mer", "nuage-noir"], disposition: 0,
    lien: "Barques du Sud", savoirs: ["peche-lagon"], equipement: ["barque-a-moteur"], notes: `Pêcheur de Saint-Pierre, chef de la flottille. Il a peur de la mer depuis qu'il y a perdu son fils, et il y retourne chaque jour.` }),
  pnj({ cle: "frere-expedit", nom: "Frère Expédit", age: 49, competences: { parole: 4, soins: 2 }, traits: ["ame-de-pelerin", "main-qui-ne-frappe-pas"], incapacites: ["violence"], disposition: 0,
    lien: "Pèlerins de la Lave", notes: `Ancien catéchiste de Sainte-Rose. Voix douce, regard qui ne cille pas. Il croit sincèrement que le volcan protège ceux qui vivent à son pied ; ses fidèles le croient plus encore.` }),
  pnj({ cle: "ancienne-de-la-nouvelle", nom: "Madame Lauret, l'ancienne de La Nouvelle", age: 68, competences: { parole: 3, survie: 2, soins: 1 }, traits: ["soleil-dedans", "coeur-de-kour"], disposition: 1,
    lien: "Familles des Îlets", savoirs: ["hydraulique-rurale", "electricite-solaire"], notes: `Ancienne institutrice de Mafate, elle a appris à lire à la moitié du cirque. Les sentiers l'écoutent. Elle décide qui entre.` }),
  pnj({ cle: "docteure-soundirassen", nom: "La docteure Soundirassen", age: 45, competences: { soins: 5, parole: 2, vigilance: 1 }, traits: ["nuits-blanches", "coeur-d-artichaut"], disposition: 1,
    lien: "Dispensaire du Sud", savoirs: ["premiers-secours-avances"], equipement: ["sac-d-intervention"], notes: `Urgentiste au grand hôpital du Sud, elle n'en est pas sortie depuis le jour zéro. Elle cherche un remède, et commence à trouver acceptables des choses qui ne l'étaient pas.` }),
  pnj({ cle: "le-comptable", nom: "Le Comptable", age: 39, competences: { parole: 3, discretion: 3, tir: 2, vigilance: 2 }, traits: ["oeil-froid", "doigts-crochus"], disposition: -1,
    lien: "Sans-Lune", equipement: ["pistolet-de-service"], notes: `Chef des Sans-Lune. Ancien employé de banque, il tient sur un cahier ce que chaque quartier lui doit. Il ne hausse jamais la voix.` }),
  pnj({ cle: "ti-zan-l-enfant", nom: "Ti Zan", age: 9, competences: { discretion: 3, vigilance: 2, endurance: 1 }, traits: ["oiseau-de-rien", "loup-solitaire"], disposition: 0,
    notes: `Un enfant seul, muet depuis le jour zéro, qui suit le groupe à distance avec un doudou en forme de tangue. Il connaît des passages que personne d'autre ne voit.` }),
  pnj({ cle: "agent-de-la-riviere-de-l-est", nom: "Josian Robert, agent de la centrale", age: 56, competences: { bricolage: 4, vigilance: 2, parole: 1 }, traits: ["tete-de-bois", "rat-de-galerie"], disposition: 0,
    savoirs: ["hydraulique-rurale", "electricite-solaire"], equipement: ["caisse-a-outils"], notes: `Un des deux agents restés à la centrale de la Rivière de l'Est. Il fait tourner ce qu'il peut, se méfie de tout le monde, et sait que tôt ou tard quelqu'un viendra prendre son courant.` }),
  pnj({ cle: "radioamatrice-du-brule", nom: "Ophélie Turpin, la voix du Brûlé", age: 61, competences: { bricolage: 2, parole: 3, vigilance: 2 }, traits: ["soleil-dedans", "nuits-blanches"], disposition: 1,
    savoirs: ["radio"], equipement: ["radio-marine"], notes: `Radioamatrice dans les hauts de Saint-Denis, elle émet chaque soir les nouvelles qu'elle reçoit, vraies ou fausses, et lit des histoires aux enfants le matin. Beaucoup de groupes la connaissent sans l'avoir vue.` })
];

export const SURVIVANTS = [...PRETIRES, ...PNJ];
