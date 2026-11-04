// Le bestiaire de Fénoir (contrat §9) : les Livides, les animaux et quelques figures hostiles. Combat (§1.7) : chaque succès de
// combat ou de tir ôte 1 de résistance ; à 0, la créature est hors d'état. des : nombre de d6 d'attaque (6 = touche).
// Données au registre (donnees.json, famille « bestiaire ») et acteurs « survivant » du compendium bestiaire (livide = true
// pour un Livide ; flags.lakour-fenoir.bestiaire porte la fiche). Textes originaux.
import { COMPETENCES, html, survivant } from "./aides.mjs";
import { cheminJeton } from "./jetons.mjs";

function creature({ cle, nom, categorie, des, resistance, vitesse, sens, zones, phases, description, comportement, faiblesse, competences = {} }) {
  return { cle, nom, categorie, des, resistance, vitesse, sens, zones, phases, description: html(description), comportement: html(comportement), faiblesse: html(faiblesse), competences };
}

export const BESTIAIRE = [
  creature({ cle: "livide-frais", nom: "Livide frais", categorie: "livide", des: 1, resistance: 1, vitesse: "marche", sens: "ouïe, odeur",
    zones: ["littoral", "hauts", "cirque", "foret", "volcan"], phases: ["jour-zero", "panique", "effondrement", "silence"],
    description: `Un mort de quelques jours, encore vêtu de ses habits, la peau grise et marbrée, les yeux voilés de blanc. Il marche comme un homme ivre, mais il ne s'arrête jamais.`,
    comportement: `Va vers le bruit, la lumière et l'odeur des vivants ; s'acharne sur une porte ; se regroupe avec les autres. Mord et griffe.`,
    faiblesse: `Le crâne ; la chaleur humide qui le défait en quelques semaines dans les Bas.` }),
  creature({ cle: "livide-des-hauts", nom: "Livide des Hauts", categorie: "livide", des: 1, resistance: 2, vitesse: "lente", sens: "ouïe",
    zones: ["hauts", "cirque", "volcan", "foret"], phases: ["silence", "apres"],
    description: `Un Livide ancien, conservé par le froid des Hauts : desséché, raide, couvert de rosée ou de givre au petit matin. Lent, mais si dur à abattre qu'on dirait du bois.`,
    comportement: `Immobile au froid, il s'éveille au soleil et suit les autres. Les hordes des Hauts, des mois après le jour zéro, sont faites de ceux-là.`,
    faiblesse: `La nuit froide le fige : on passe entre eux à l'aube, en silence.` }),
  creature({ cle: "noye-du-lagon", nom: "Noyé du lagon", categorie: "livide", des: 1, resistance: 1, vitesse: "lente", sens: "ouïe",
    zones: ["littoral"], phases: ["effondrement", "silence"],
    description: `Un corps gonflé d'eau de mer, rejeté par la houle, couvert d'algues et de crabes. Il se relève dans l'écume et marche vers la plage.`,
    comportement: `Sort de l'eau la nuit, au bord des plages et des ports ; on le croit mort, il ne l'est pas tout à fait.`,
    faiblesse: `Sa chair cède sous un coup ; mais une morsure de noyé s'infecte toujours.` }),
  creature({ cle: "livide-brule", nom: "Livide brûlé", categorie: "livide", des: 1, resistance: 1, vitesse: "marche", sens: "ouïe",
    zones: ["littoral", "hauts"], phases: ["panique", "effondrement", "silence"],
    description: `Pris dans un incendie de quartier ou un véhicule en feu, il en est ressorti noirci, à demi aveugle, qui fume encore parfois.`,
    comportement: `Ne sent ni la douleur ni la chaleur : il traverse les flammes et les barbelés sans ralentir.`,
    faiblesse: `Ses yeux brûlés : il ne suit que les bruits.` }),
  creature({ cle: "coureur", nom: "Coureur", categorie: "livide", des: 2, resistance: 1, vitesse: "rapide", sens: "vue, ouïe",
    zones: ["littoral", "hauts", "cirque", "foret"], phases: ["jour-zero", "panique"],
    description: `Un mort tout récent, relevé depuis quelques heures : il court encore, maladroitement, et se jette sur sa proie. On n'en voit que les premiers jours.`,
    comportement: `Charge dès qu'il voit, crie en courant, attire les autres. Après une semaine, il ralentit et devient un Livide comme les autres.`,
    faiblesse: `Il tombe, il se cogne : un obstacle bien placé le brise.` }),
  creature({ cle: "chien-errant", nom: "Chien errant", categorie: "animal", des: 2, resistance: 1, vitesse: "rapide", sens: "odeur, ouïe",
    zones: ["littoral", "hauts", "foret"], phases: ["effondrement", "silence", "apres"],
    description: `Les chiens abandonnés se sont regroupés en meutes : maigres, malins, ils suivent les groupes, attaquent les poulaillers et les gens seuls.`,
    comportement: `Attaquent en meute, fuient devant un groupe résolu ; un chien nourri peut devenir un ami.`,
    faiblesse: `La faim les rend imprudents ; le feu et les cris les font fuir.` }),
  creature({ cle: "cochon-marron", nom: "Cochon marron", categorie: "animal", des: 2, resistance: 2, vitesse: "rapide", sens: "odeur",
    zones: ["foret", "hauts", "cirque"], phases: ["silence", "apres"],
    description: `Des cochons échappés des élevages, retournés à l'état sauvage dans les forêts et les ravines : lourds, rapides, armés de défenses naissantes.`,
    comportement: `Saccagent les potagers la nuit, chargent quand on les surprend. Un cochon abattu nourrit le camp une semaine.`,
    faiblesse: `Prévisibles : ils reviennent au même champ ; un piège ou une fosse suffit.` }),
  creature({ cle: "rat-des-reserves", nom: "Rats des réserves", categorie: "animal", des: 1, resistance: 1, vitesse: "rapide", sens: "odeur",
    zones: ["littoral", "hauts", "foret", "cirque"], phases: ["effondrement", "silence", "apres"],
    description: `Les rats pullulent dans les villes vidées : ils percent les sacs, souillent l'eau, portent la leptospirose.`,
    comportement: `Une nuée la nuit dans les réserves ; mordent si on les coince.`,
    faiblesse: `Une réserve étanche et des chats.` }),
  creature({ cle: "pillard-sans-lune", nom: "Pillard des Sans-Lune", categorie: "humain", des: 2, resistance: 2, vitesse: "marche", sens: "vue, ouïe",
    zones: ["littoral"], phases: ["effondrement", "silence", "apres"], competences: { combat: 2, tir: 1, discretion: 2, vigilance: 1 },
    description: `Visage noirci, vêtements sombres, un sabre ou un fusil, et la liste du Comptable dans la poche : un homme de la bande qui tient Saint-Denis la nuit.`,
    comportement: `Attaque à plusieurs, de nuit, et se retire si ça coûte trop cher. Négocie un tribut avant de frapper.`,
    faiblesse: `Il tient à sa vie plus qu'à la bande : un coup dur et il fuit.` }),
  creature({ cle: "soldat-de-la-garnison", nom: "Soldat de la Garnison", categorie: "humain", des: 3, resistance: 2, vitesse: "marche", sens: "vue, ouïe",
    zones: ["littoral"], phases: ["panique", "effondrement", "silence", "apres"], competences: { tir: 3, combat: 2, vigilance: 2, discretion: 1 },
    description: `Un militaire ou un gendarme mobile au brassard orange, gilet pare-balles, fusil réglementaire : discipliné, fatigué, et persuadé d'avoir raison.`,
    comportement: `Patrouille à quatre, contrôle, fouille, réquisitionne ; ne tire qu'en dernier recours… ou sur ordre.`,
    faiblesse: `Ses munitions sont comptées, et il obéit : on traite avec ses chefs, pas avec lui.` })
];

// Les créatures que la logique du système tire au sort et fait combattre (registre, famille « creatures » ; lakour-survie,
// logique/actions.mjs tirerCreature et logique/contenu.mjs) : { cle, nom, type: "livide" | "animal", des, resistance, zones,
// phases, poids }. Les Livides et les animaux du bestiaire seulement : les figures humaines viennent des factions (rencontres
// « humains »). poids : fréquence relative du tirage (le coureur est rare, contrat §9).
export const POIDS_CREATURES = { "livide-frais": 4, "livide-des-hauts": 2, "noye-du-lagon": 1, "livide-brule": 1, coureur: 0.5,
  "chien-errant": 3, "cochon-marron": 2, "rat-des-reserves": 1 };
export const CREATURES = BESTIAIRE.filter(b => b.categorie === "livide" || b.categorie === "animal").map(b => ({
  cle: b.cle, nom: b.nom, type: b.categorie, des: b.des, resistance: b.resistance, zones: [...b.zones], phases: [...b.phases],
  poids: POIDS_CREATURES[b.cle] ?? 1
}));

// Acteurs du compendium « bestiaire » : la fiche dans flags.lakour-fenoir.bestiaire ; disposition hostile, sauf les rats.
export const BESTIAIRE_ACTEURS = BESTIAIRE.map(b => survivant({
  cle: b.cle, nom: b.nom, pack: "bestiaire", statut: "pnj", pnj: true, livide: b.categorie === "livide", vivant: b.categorie !== "livide",
  competences: Object.fromEntries(COMPETENCES.map(c => [c, b.competences[c] ?? (c === "combat" ? b.des : 0)])),
  moral: 3, img: cheminJeton(b.cle), disposition: -1,
  notes: `${b.description}\n\n**Comportement.** ${b.comportement.replace(/<[^>]+>/g, "")}\n\n**Faiblesse.** ${b.faiblesse.replace(/<[^>]+>/g, "")}\n\n**Dés d'attaque :** ${b.des} — **résistance :** ${b.resistance} — **vitesse :** ${b.vitesse}.`.replace(/<[^>]+>/g, ""),
  extra: { bestiaire: { categorie: b.categorie, des: b.des, resistance: b.resistance, vitesse: b.vitesse } }
}));
