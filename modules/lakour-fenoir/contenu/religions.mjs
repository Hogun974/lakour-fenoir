// Religions et ancrages de Fénoir (complément du jeu 3D, famille 2 ; système : logique/esprit.mjs, contrat §14).
// Ce qui fait tenir un survivant : sa religion, ou, pour qui ne croit pas, un ancrage (une photo, un carnet, une routine, le sport).
// AUCUN EFFET MAGIQUE : la foi agit par le moral (un pratiquant gagne plus mais tient ses observances ; un non-pratiquant gagne peu
// et ne risque rien), le jeu ne confirme ni ne dément rien. Les croyances, les doutes et les préjugés sont ceux des personnages.
//
// Une religion : { cle, nom, description, observance: { besoin: "calme" | "objet" | "rien", texte }, fetes: [clé de fête du socle],
//   poids (fréquence au tirage), affinites: { enfance: facteur } (une enfance rend une religion plus probable : jamais une règle) }.
// Deux entrées spéciales (special) : « aucune » et « plusieurs » (à La Réunion, on va à la messe ET au temple, et personne ne
// trouve ça étrange). Un ancrage : { cle, nom, description, besoin, texte, poids }.
import { html } from "./aides.mjs";

function religion({ cle, nom, description, observance = null, fetes = [], poids = 1, affinites = {}, special = "" }) {
  return { cle, nom, description: html(description), ...(observance ? { observance: { besoin: observance.besoin, texte: observance.texte } } : {}), fetes, poids, affinites,
    ...(special ? { special } : {}) };
}
function ancrage({ cle, nom, description, besoin, texte, poids = 1 }) {
  return { cle, nom, description: html(description), besoin, texte, poids };
}

export const RELIGIONS = [
  religion({ cle: "catholique", nom: "Catholique", poids: 5,
    affinites: { "enfance-zoreil": 1.2, "enfant-des-hauts-de-salazie": 1.3, "enfant-de-cilaos": 1.3, "enfance-yab-des-hauts-de-l-ouest": 1.4, "enfant-de-la-plaine-des-cafres": 1.3,
      "enfance-tamoule-de-saint-andre": 0.4, "enfance-chinoise-de-saint-denis": 0.6, "enfance-zarab-de-saint-pierre": 0.1, "enfance-a-mayotte": 0.1, "enfance-comorienne-du-chaudron": 0.1 },
    fetes: ["noel", "paques", "halloween"],
    observance: { besoin: "calme", texte: "le chapelet du soir, une bougie pour les morts, la prière avant le repas" },
    description: `La foi de la plupart des cases de l'île : la messe du dimanche, les processions, la Vierge noire de la Rivière des Pluies et saint Expédit, dont les petites chapelles rouges bordent encore les routes. Après le jour zéro, on prie dans les églises fermées, on allume des bougies devant les statues, et chacun se demande si c'est la fin des temps ou seulement la fin d'un monde.` }),
  religion({ cle: "hindouisme-tamoul", nom: "Hindouisme tamoul", poids: 1.5,
    affinites: { "enfance-tamoule-de-saint-andre": 6, "enfant-de-planteur-de-l-est": 1.8, "enfance-a-maurice": 2, "enfance-zarab-de-saint-pierre": 0.1, "enfance-a-mayotte": 0.1, "enfance-comorienne-du-chaudron": 0.1, "enfance-zoreil": 0.2 },
    fetes: ["dipavali", "cavadee"],
    observance: { besoin: "calme", texte: "la lampe allumée le soir, une offrande de fleurs ou de riz, le carême avant les fêtes" },
    description: `La religion des Malbars, venue avec les engagés du Sud de l'Inde : les temples aux couleurs vives, les fêtes de la lumière, le feu sur lequel on marche, la Cavadee et ses piercings, le carême qu'on tient avant. Ceux qui ne la connaissent pas parlent de « services » et de sorcellerie ; ceux qui la pratiquent allument une lampe chaque soir et ne demandent à personne de comprendre.` }),
  religion({ cle: "islam", nom: "Islam", poids: 0.6,
    affinites: { "enfance-zarab-de-saint-pierre": 12, "enfance-a-mayotte": 12, "enfance-comorienne-du-chaudron": 12, "enfance-a-madagascar": 0.6, "enfance-tamoule-de-saint-andre": 0.1 },
    fetes: [],
    observance: { besoin: "calme", texte: "les cinq prières, l'eau propre des ablutions, le jeûne du ramadan quand il revient" },
    description: `La foi des Z'arabes de Saint-Denis et de Saint-Pierre, dont la mosquée Noor-e-Islam est la plus ancienne de France, et celle des Comoriens et des Mahorais arrivés plus tard. On prie cinq fois par jour, même dans un abri de tôle, et la question de l'eau propre pour les ablutions devient une question de survie.` }),
  religion({ cle: "culte-chinois", nom: "Culte des ancêtres et temple chinois", poids: 0.4,
    affinites: { "enfance-chinoise-de-saint-denis": 12, "enfance-a-maurice": 1.5, "enfance-zarab-de-saint-pierre": 0.1, "enfance-a-mayotte": 0.1, "enfance-comorienne-du-chaudron": 0.1 },
    fetes: ["nouvel-an-chinois"],
    observance: { besoin: "calme", texte: "l'encens pour les ancêtres, une part du repas posée devant leur photo, le respect des jours de fête" },
    description: `Dans l'arrière-boutique, l'autel des ancêtres avec ses photos et ses bâtons d'encens ; à Saint-Denis et à Saint-Pierre, les temples de Guan Di. Beaucoup de familles chinoises vont aussi à la messe. On n'abandonne pas les siens parce que le monde s'arrête : on les nourrit, même d'une poignée de riz.` }),
  religion({ cle: "evangelique", nom: "Église évangélique", poids: 0.6,
    affinites: { "enfant-de-la-cite-saint-denis": 1.5, "enfant-du-tampon": 1.4, "enfance-a-madagascar": 1.6, "enfance-zarab-de-saint-pierre": 0.1, "enfance-a-mayotte": 0.1, "enfance-comorienne-du-chaudron": 0.1 },
    fetes: ["noel", "paques"],
    observance: { besoin: "objet", texte: "la Bible ouverte chaque jour, les chants, le culte avec les frères et les sœurs" },
    description: `Des églises dans d'anciens entrepôts, des chants qu'on entend de la rue, une Bible annotée qu'on garde sur soi. Les évangéliques se sont multipliés dans les quartiers ; après le jour zéro, certains y voient l'Apocalypse annoncée, d'autres seulement une raison de plus d'ouvrir la porte. Tant qu'il a sa Bible, le pratiquant tient ; s'il la perd, il se sent nu.` }),
  religion({ cle: "ancetres-malgaches", nom: "Servis kabaré, le culte des ancêtres", poids: 0.4,
    affinites: { "enfance-a-madagascar": 8, "enfant-de-planteur-de-l-est": 1.5, "enfant-du-sud-sauvage": 1.5, "enfance-zarab-de-saint-pierre": 0.1, "enfance-a-mayotte": 0.3, "enfance-comorienne-du-chaudron": 0.3 },
    fetes: ["liberte"],
    observance: { besoin: "calme", texte: "le rhum et le tabac posés pour les anciens, leurs noms dits à voix haute, un repas partagé avec eux" },
    description: `Venu de Madagascar et d'Afrique avec les esclaves, transmis en silence pendant des générations : le servis kabaré, le repas offert aux ancêtres, le maloya qui les appelle. On le cachait, on le pratique aujourd'hui plus ouvertement, et souvent en plus de la messe. Dans le monde d'après, dire le nom des morts, c'est aussi se souvenir qu'on vient de loin et qu'on a déjà survécu à pire.` }),
  religion({ cle: "aucune", nom: "Aucune", special: "aucune", poids: 2,
    affinites: { "enfance-zoreil": 1.6, "enfance-en-foyer": 1.5, "enfant-de-militaire": 1.3 },
    description: `Il ne croit pas, ou plus. Ce qui le fait tenir est ailleurs : une photo, un carnet, une routine, le sport. C'est son ancrage, et il compte autant que la foi des autres.` }),
  religion({ cle: "plusieurs", nom: "Plusieurs à la fois", special: "plusieurs", poids: 1.2,
    affinites: { "enfance-tamoule-de-saint-andre": 2, "enfant-de-planteur-de-l-est": 1.5, "enfance-chinoise-de-saint-denis": 1.5, "enfance-a-madagascar": 1.3, "enfance-zarab-de-saint-pierre": 0.1, "enfance-a-mayotte": 0.1, "enfance-comorienne-du-chaudron": 0.1 },
    description: `La messe le dimanche et le temple pour la Dipavali, un cierge à saint Expédit et une offrande pour les anciens : à La Réunion, beaucoup croient à plusieurs choses à la fois, et personne ne trouve ça étrange. Il tient les deux, ou les trois.` })
];

export const ANCRAGES = [
  ancrage({ cle: "photo", nom: "Une photo", besoin: "objet", poids: 3, texte: "la regarder chaque soir, la garder sèche",
    description: `Une photo pliée en quatre dans un portefeuille : des enfants, un mariage, une maison au bord de la mer. Il la regarde chaque soir. Tant qu'il l'a sur lui, il sait pourquoi il se lève.` }),
  ancrage({ cle: "carnet", nom: "Un carnet", besoin: "objet", poids: 2, texte: "écrire quelques lignes chaque soir",
    description: `Un carnet d'écolier où il écrit chaque soir ce qui s'est passé : les noms, les dates, la météo, ce qu'on a mangé. Quelqu'un, un jour, devra savoir. Le perdre, ce serait perdre tout ce qu'il a vu.` }),
  ancrage({ cle: "routine", nom: "Une routine", besoin: "calme", poids: 2, texte: "le café à la même heure, se raser, plier ses affaires",
    description: `Le café à cinq heures et demie, la barbe faite, le lit fait, les affaires pliées : le monde s'écroule, pas ses habitudes. Sur la route, sans abri, tout se dérègle, et lui avec.` }),
  ancrage({ cle: "sport", nom: "Le sport", besoin: "calme", poids: 2, texte: "courir, nager ou faire ses pompes chaque matin",
    description: `Il courait le Grand Raid, ou il jouait au foot le dimanche au stade de son quartier. Il continue : des pompes au lever, une course dans la cour. Le corps fatigué fait taire la tête.` }),
  ancrage({ cle: "musique", nom: "Un instrument", besoin: "objet", poids: 1, texte: "jouer un air le soir, même tout bas",
    description: `Un kayamb, un harmonica, une vieille guitare au vernis écaillé. Le soir, il joue tout bas un séga ou un maloya de son grand-père. Le bruit attire, il le sait ; il joue quand même, pour lui.` }),
  ancrage({ cle: "plante", nom: "Un pied de piment", besoin: "objet", poids: 1, texte: "l'arroser, le mettre au soleil, l'emporter partout",
    description: `Un pied de piment dans un pot de yaourt, ou une bouture de géranium de la case de sa mère. Il l'arrose, il le déplace au soleil, il l'emporte quand on part. Tant qu'il pousse, quelque chose continue.` })
];
