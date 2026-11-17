// Religions et ancrages de Fénoir (complément du jeu 3D, famille 2 ; système : logique/esprit.mjs, contrat §14 et §22).
// Ce qui fait tenir un survivant : sa religion, ou, pour qui ne croit pas, un ancrage (une photo, un carnet, une routine, le sport).
// AUCUN EFFET MAGIQUE : la foi agit par le moral (un pratiquant gagne plus mais tient ses observances ; un non-pratiquant gagne peu
// et ne risque rien), le jeu ne confirme ni ne dément rien. Les croyances, les doutes et les préjugés sont ceux des personnages.
// Aucune religion n'a d'effet propre : toutes passent par les mêmes règles.
//
// LA LISTE COMMUNE AUX DEUX JEUX (décision de Jordan du 2026-11-17, lot 10 ; contrat §22) : celle que Jordan a validée pour le jeu 3D
// le 14 novembre (catholique 46, hindoue 16, aucune 14, hindoue catholique 10, musulmane 7, protestante 4, bouddhiste 3, sur 100),
// plus le servis kabaré (1, pris sur la part catholique), que La Réunion pratique et que le jeu de table avait déjà. Les clés sont
// celles du jeu 3D ; les anciennes clés de FVTT restent des alias (`alias`) : une fiche, un tirage ou une phrase d'histoire qui les
// porte continue de marcher (logique/esprit.mjs, cleReligion). « Plusieurs à la fois » reste une entrée spéciale, choisie à la main
// (catholique et servis kabaré, bouddhiste et catholique…) : elle ne se tire plus (poids 0), « hindoue catholique » tenant sa place.
//
// Une religion : { cle, nom, description, observance: { besoin: "calme" | "objet" | "rien", texte }, fetes: [clé de fête du socle],
//   poids (fréquence au tirage, sur 100), affinites: { enfance: facteur } (une enfance rend une religion plus probable : jamais une
//   règle), alias: [anciennes clés], composee?: [clés] (une religion double : ses deux religions comptent pour prier ensemble et
//   pour les fêtes) }. Deux entrées spéciales (special) : « aucune » et « plusieurs ». Un ancrage : { cle, nom, description, besoin,
//   texte, poids }.
import { html } from "./aides.mjs";

function religion({ cle, nom, description, observance = null, fetes = [], poids = 1, affinites = {}, special = "", alias = [], composee = [] }) {
  return { cle, nom, description: html(description), ...(observance ? { observance: { besoin: observance.besoin, texte: observance.texte } } : {}), fetes, poids, affinites,
    ...(special ? { special } : {}), ...(alias.length ? { alias } : {}), ...(composee.length ? { composee } : {}) };
}
// bruit (lot « sens ») : ce que l'ancrage ajoute au bruit de l'abri quand un pratiquant y est (l'instrument joué chaque soir).
function ancrage({ cle, nom, description, besoin, texte, poids = 1, bruit = 0 }) {
  return { cle, nom, description: html(description), besoin, texte, poids, ...(bruit ? { bruit } : {}) };
}

// Les enfances venues d'ailleurs où la religion se tire autrement (affinités ; jamais une règle).
const LOIN_DE = f => ({ "enfance-zarab-de-saint-pierre": f, "enfance-a-mayotte": f, "enfance-comorienne-du-chaudron": f });

export const RELIGIONS = [
  religion({ cle: "catholique", nom: "Catholique", poids: 45,
    affinites: { "enfance-zoreil": 1.2, "enfant-des-hauts-de-salazie": 1.3, "enfant-de-cilaos": 1.3, "enfance-yab-des-hauts-de-l-ouest": 1.4, "enfant-de-la-plaine-des-cafres": 1.3,
      "enfance-tamoule-de-saint-andre": 0.4, "enfance-chinoise-de-saint-denis": 0.6, ...LOIN_DE(0.1) },
    fetes: ["noel", "paques", "halloween"],
    observance: { besoin: "calme", texte: "le chapelet du soir, une bougie pour les morts, la prière avant le repas" },
    description: `La foi de la plupart des cases de l'île : la messe du dimanche, les processions, la Vierge noire de la Rivière des Pluies et saint Expédit, dont les petites chapelles rouges bordent encore les routes. Après le jour zéro, on prie dans les églises fermées, on allume des bougies devant les statues, et chacun se demande si c'est la fin des temps ou seulement la fin d'un monde.` }),
  religion({ cle: "hindoue", nom: "Hindoue", poids: 16, alias: ["hindouisme-tamoul"],
    affinites: { "enfance-tamoule-de-saint-andre": 6, "enfant-de-planteur-de-l-est": 1.8, "enfance-a-maurice": 2, "enfance-zoreil": 0.2, ...LOIN_DE(0.1) },
    // Le Nouvel An tamoul et la marche sur le feu : fêtes du lot « fetes » ; Pongal (moisson tamoule) : fête du lot 12, hors du socle.
    fetes: ["dipavali", "cavadee", "nouvel-an-tamoul", "marche-sur-le-feu", "pongal"],
    observance: { besoin: "calme", texte: "la lampe allumée le soir, une offrande de fleurs ou de riz, le carême avant les fêtes" },
    description: `La religion des Malbars, venue avec les engagés du Sud de l'Inde : les temples aux couleurs vives, les fêtes de la lumière, le feu sur lequel on marche, la Cavadee et ses piercings, le carême qu'on tient avant. Ceux qui ne la connaissent pas parlent de « services » et de sorcellerie ; ceux qui la pratiquent allument une lampe chaque soir et ne demandent à personne de comprendre.` }),
  religion({ cle: "hindoue-catholique", nom: "Hindoue catholique", poids: 10, composee: ["catholique", "hindoue"],
    affinites: { "enfance-tamoule-de-saint-andre": 4, "enfant-de-planteur-de-l-est": 1.8, "enfance-a-maurice": 1.5, "enfance-zoreil": 0.2, ...LOIN_DE(0.1) },
    fetes: ["noel", "paques", "halloween", "dipavali", "cavadee", "nouvel-an-tamoul", "marche-sur-le-feu", "pongal"],
    observance: { besoin: "calme", texte: "un cierge à saint Expédit et une lampe pour Mariamen, la messe du dimanche et le carême du temple" },
    description: `La messe le dimanche et le temple le vendredi, la Vierge et Mariamen sur la même étagère, sous les mêmes fleurs : beaucoup de familles malbares sont les deux à la fois depuis des générations, et personne dans l'île ne trouve ça étrange. Le curé a fini par venir bénir la marche sur le feu ; la grand-mère a toujours su à quelle porte frapper pour quelle peine.` }),
  // Rééquilibrage d'après les douze lots (docs/equilibre-3d.md) : × 2 au lieu de × 12. Le poids 7 compte déjà les Z'arabes, les Comoriens
  // et les Mahorais de l'île : à × 12, quatre sur cinq de ces enfances tiraient l'islam et la part musulmane montait à 13,3 % ; à × 2
  // (et ces trois enfances deux fois moins souvent tirées, enfances.mjs), 8 % sur 75 000 tirages, et deux sur cinq de ces enfances.
  religion({ cle: "musulmane", nom: "Musulmane", poids: 7, alias: ["islam"],
    affinites: { ...LOIN_DE(2), "enfance-a-madagascar": 0.6, "enfance-tamoule-de-saint-andre": 0.1 },
    // Le ramadan et l'Aïd el-Kebir : fêtes du lot « fetes ».
    fetes: ["ramadan", "aid-el-kebir"],
    observance: { besoin: "calme", texte: "les cinq prières, l'eau propre des ablutions, le jeûne du ramadan quand il revient" },
    description: `La foi des Z'arabes de Saint-Denis et de Saint-Pierre, dont la mosquée Noor-e-Islam est la plus ancienne de France, et celle des Comoriens et des Mahorais arrivés plus tard. On prie cinq fois par jour, même dans un abri de tôle, et la question de l'eau propre pour les ablutions devient une question de survie.` }),
  religion({ cle: "protestante", nom: "Protestante", poids: 4, alias: ["evangelique"],
    affinites: { "enfant-de-la-cite-saint-denis": 1.5, "enfant-du-tampon": 1.4, "enfance-a-madagascar": 1.6, ...LOIN_DE(0.1) },
    fetes: ["noel", "paques"],
    observance: { besoin: "objet", texte: "la Bible ouverte chaque jour, les chants, le culte avec les frères et les sœurs" },
    description: `Surtout des églises évangéliques : des salles dans d'anciens entrepôts, des chants qu'on entend de la rue, une Bible annotée qu'on garde sur soi ; et quelques vieux temples de l'Église réformée. Les assemblées se sont multipliées dans les quartiers ; après le jour zéro, certains y voient l'Apocalypse annoncée, d'autres seulement une raison de plus d'ouvrir la porte. Tant qu'il a sa Bible, le pratiquant tient ; s'il la perd, il se sent nu.` }),
  religion({ cle: "bouddhiste", nom: "Bouddhiste", poids: 3, alias: ["culte-chinois"],
    affinites: { "enfance-chinoise-de-saint-denis": 12, "enfance-a-maurice": 1.5, ...LOIN_DE(0.1) },
    fetes: ["nouvel-an-chinois"],
    observance: { besoin: "calme", texte: "l'encens le premier et le quinze du mois lunaire, un moment de silence le matin, une part du repas posée devant l'autel" },
    description: `Les pagodes de Saint-Denis et de Saint-Pierre, l'autel de la maison où brûlent les bâtons d'encens, les photos des anciens posées à côté : la foi de bien des familles chinoises de l'île, qui vont aussi parfois à la messe. On s'assoit en silence avant que la journée commence, on ne laisse pas les siens sans offrande parce que le monde s'arrête : une poignée de riz suffit.` }),
  religion({ cle: "servis-kabare", nom: "Servis kabaré", poids: 1, alias: ["ancetres-malgaches"],
    affinites: { "enfance-a-madagascar": 8, "enfant-de-planteur-de-l-est": 1.5, "enfant-du-sud-sauvage": 1.5, "enfance-zarab-de-saint-pierre": 0.1, "enfance-a-mayotte": 0.3, "enfance-comorienne-du-chaudron": 0.3 },
    fetes: ["liberte"],
    observance: { besoin: "calme", texte: "le rhum et le tabac posés pour les anciens, leurs noms dits à voix haute, un repas partagé avec eux" },
    description: `Venu de Madagascar et d'Afrique avec les esclaves, transmis en silence pendant des générations : le servis kabaré, le repas offert aux ancêtres, le maloya qui les appelle. On le cachait, on le pratique aujourd'hui plus ouvertement, et souvent en plus de la messe. Dans le monde d'après, dire le nom des morts, c'est aussi se souvenir qu'on vient de loin et qu'on a déjà survécu à pire.` }),
  religion({ cle: "aucune", nom: "Aucune", special: "aucune", poids: 14,
    affinites: { "enfance-zoreil": 1.6, "enfance-en-foyer": 1.5, "enfant-de-militaire": 1.3 },
    description: `Il ne croit pas, ou plus. Ce qui le fait tenir est ailleurs : une photo, un carnet, une routine, le sport. C'est son ancrage, et il compte autant que la foi des autres.` }),
  religion({ cle: "plusieurs", nom: "Plusieurs à la fois", special: "plusieurs", poids: 0,
    description: `Une messe et une offrande pour les anciens, l'encens de la pagode et un cierge à saint Expédit : à La Réunion, beaucoup croient à plusieurs choses à la fois, et personne ne trouve ça étrange. Il tient les deux, ou les trois. (Se choisit sur la fiche : le tirage donne « hindoue catholique », la plus répandue.)` })
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
  ancrage({ cle: "musique", nom: "Un instrument", besoin: "objet", poids: 1, bruit: 1, texte: "jouer un air le soir, même tout bas",
    description: `Un kayamb, un harmonica, une vieille guitare au vernis écaillé. Le soir, il joue tout bas un séga ou un maloya de son grand-père. Le bruit attire, il le sait ; il joue quand même, pour lui.` }),
  ancrage({ cle: "plante", nom: "Un pied de piment", besoin: "objet", poids: 1, texte: "l'arroser, le mettre au soleil, l'emporter partout",
    description: `Un pied de piment dans un pot de yaourt, ou une bouture de géranium de la case de sa mère. Il l'arrose, il le déplace au soleil, il l'emporte quand on part. Tant qu'il pousse, quelque chose continue.` })
];
