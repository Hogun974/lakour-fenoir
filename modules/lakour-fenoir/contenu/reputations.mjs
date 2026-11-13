// Réputation auprès des factions (contrat §9, repris des réputations de Warcraft) : paliers d'attitude suivis par une horloge
// du moteur (type « reputation », identifiant « rep-<faction> ») que scripts/main.js assure à l'installation, et ce que chaque
// palier ouvre. Gagner : appels et demandes réussis, services, échanges honnêtes ; perdre : vols, trahisons, violences.
import { FACTIONS } from "./factions.mjs";

// Paliers (valeur de l'horloge) : du plus bas au plus haut ; format du moteur : [{ nom, min }].
// marche : ce que le palier fait au troc avec la faction (logique marche.mjs, premiereConfiance({ palier })) : majoration du prix
// demandé et crédit au carnet (« plein », « moitie », « refuse ») ; hostile : aucun échange.
export const PALIERS = [
  { cle: "hostile", nom: "Hostile", min: -20, attitude: "On vous attaque ou on vous chasse à vue. Aucun échange possible.", marche: { majoration: 1, credit: "refuse", echange: false } },
  { cle: "mefiante", nom: "Méfiante", min: -4, attitude: "On vous parle de loin, armes en main ; échanges rares, à prix fort, sans jamais entrer.", marche: { majoration: 0.5, credit: "refuse", echange: true } },
  { cle: "neutre", nom: "Neutre", min: 0, attitude: "Des étrangers parmi d'autres : troc équitable, on vous laisse passer.", marche: { majoration: 0, credit: "moitie", echange: true } },
  { cle: "amicale", nom: "Amicale", min: 5, attitude: "On connaît vos noms ; on vous accueille une nuit, on vous prévient d'un danger.", marche: { majoration: 0, credit: "plein", echange: true } },
  { cle: "alliee", nom: "Alliée", min: 10, attitude: "Vos ennemis sont les leurs : refuge, savoir, aide en cas d'assaut.", marche: { majoration: 0, credit: "plein", echange: true } }
];
export const PALIERS_MOTEUR = PALIERS.map(({ nom, min }) => ({ nom, min }));
const DEPART = { hostile: -8, mefiante: -2, neutre: 0, amicale: 5 };
export const paliersDe = valeur => [...PALIERS].reverse().find(p => valeur >= p.min) ?? PALIERS[0];

// Ce que chaque palier ouvre, faction par faction (troc, refuge, savoir enseigné).
const OUVRE = {
  "garnison-du-quai": {
    neutre: "Laissez-passer pour la route du Littoral ; échange de vivres contre carburant au poste de la Grande Chaloupe.",
    amicale: "Carburant et munitions au troc ; soins à l'infirmerie du port ; renseignements radio sur les hordes.",
    alliee: "Un abri au Port en cas de besoin ; une escorte armée pour un déménagement ; le savoir « radio » enseigné par leurs opérateurs."
  },
  "cooperative-des-plaines": {
    neutre: "Troc du samedi à Bourg-Murat : lait, fromage, légumes contre outils et graines.",
    amicale: "Graines et jeunes plants ; un coup de main pour une récolte ; le savoir « élevage » enseigné.",
    alliee: "Une place dans une ferme de la Plaine ; un cheval ou un âne prêté ; le savoir « maraîchage tropical » enseigné."
  },
  "ferrailleurs": {
    neutre: "Marché aux pièces : pièces et matériaux au troc, à prix de Ferrailleur.",
    amicale: "Prix honnêtes ; un véhicule réparé ; la position d'un dépôt intact.",
    alliee: "Le savoir « mécanique » enseigné ; ils gardent votre abri si vous partez, sans le dépouiller."
  },
  "barques-du-sud": {
    neutre: "Poisson contre carburant ou médicaments sur les quais.",
    amicale: "Une traversée par la mer d'une marine à l'autre ; le savoir « pêche au lagon » enseigné.",
    alliee: "Un bateau prêté ; l'évacuation par la mer si l'abri tombe ; un mouillage sûr pour votre propre barque."
  },
  "pelerins-de-la-lave": {
    neutre: "Un repas et un lit à Notre-Dame-des-Laves pour qui vient en paix.",
    amicale: "Soins gratuits ; le passage de la route des Laves ; des nouvelles du Sud.",
    alliee: "Refuge pour les malades et les enfants ; leurs guetteurs vous préviennent des éruptions et des hordes."
  },
  "familles-des-ilets": {
    neutre: "Entrée dans Mafate après trois jours de quarantaine au col ; troc de graines et de lentilles.",
    amicale: "Le savoir « hydraulique rurale » ou « électricité solaire » enseigné ; un guide pour les sentiers.",
    alliee: "Une case dans un îlet ; leurs sifflets vous préviennent de tout ce qui monte."
  },
  "dispensaire-du-sud": {
    neutre: "Soins contre ce qu'on peut donner ; médicaments au troc.",
    amicale: "Soins gratuits pour les blessés graves ; le savoir « premiers secours avancés » enseigné.",
    alliee: "Une place pour un malade, des médicaments en réserve, et ce qu'ils savent du Gris."
  },
  "sans-lune": {
    neutre: "Un tribut payé achète une lune de tranquillité.",
    amicale: "On vous laisse passer la nuit en ville ; ils vendent ce qu'ils ont pillé.",
    alliee: "Leurs informations sur la ville… et l'hostilité de toutes les autres factions s'ils l'apprennent."
  }
};

export const REPUTATIONS = FACTIONS.map(f => ({
  faction: f.cle, nom: f.nom, horloge: `rep-${f.cle}`, depart: DEPART[f.attitude] ?? 0,
  ouvre: { hostile: "Rien : fuir ou se battre.", mefiante: "Un échange tendu, de loin, à leurs conditions.", ...OUVRE[f.cle] }
}));

// Les horloges à assurer auprès du moteur (api.horloges.assurer), une par faction.
export const HORLOGES_REPUTATION = REPUTATIONS.map(r => ({ id: r.horloge, nom: r.nom, type: "reputation", valeur: r.depart, visible: true, faction: r.faction, paliers: PALIERS_MOTEUR }));

const CREDITS = { plein: "au carnet", moitie: "à moitié du plafond", refuse: "refusé" };
// Texte du journal (MJ) « Réputation auprès des factions ».
export function texteReputations() {
  const paliers = PALIERS.map(p => `- **${p.nom}** (à partir de ${p.min}) : ${p.attitude}`).join("\n");
  const factions = REPUTATIONS.map(r => `# ${r.nom}\n\nHorloge **${r.horloge}**, départ ${r.depart}.\n\n${["neutre", "amicale", "alliee"].map(c => `- **${PALIERS.find(p => p.cle === c).nom}** : ${r.ouvre[c]}`).join("\n")}`).join("\n\n");
  const marche = PALIERS.map(p => `- **${p.nom}** : ${p.marche.echange ? `prix ${p.marche.majoration ? `majoré de ${Math.round(p.marche.majoration * 100)} %` : "au cours"}, crédit ${CREDITS[p.marche.credit]}` : "aucun échange"}.`).join("\n");
  return `# Les paliers\n\nChaque faction a son horloge de réputation (moteur MJ IA, type « réputation »), créée à l'installation. Un appel ou une demande réussi rapporte de 1 à 3 points ; un service rendu sans rien demander, 1 ; un vol, une trahison, un mort de la faction en coûtent de 2 à 6. Les paliers :\n\n${paliers}\n\n# Au marché, et le Ladi Lafé\n\nLa réputation se sait par le **Ladi Lafé** (« il a dit qu'il a fait », la rumeur) : ce qu'on dit du groupe au marché, vrai ou faux, arrive aux factions avant lui. Au troc avec une faction, son palier compte comme la première confiance d'un PNJ (journal « Le marché et le Ladi Lafé ») :\n\n${marche}\n\nAccueillir un marché rapporte un point auprès de chaque bastion qui y vient, par mois de marché tenu ; rompre la trêve d'un marché en coûte 3 auprès de chacun, et toute l'île le sait.\n\n${factions}`;
}
