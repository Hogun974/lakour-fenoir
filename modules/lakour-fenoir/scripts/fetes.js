// Les fêtes de Fénoir (contrat §6 et §9) : ce que chaque fête de La Réunion devient dans le monde d'après. Données seules, sans
// dépendance : lues par main.js (déclinaisons auprès du socle des fêtes du moteur, lakour-mj-ia/docs/fetes.md), par le fabricant
// (outils/fabriquer-fenoir.mjs : assets/donnees.json, journal des fêtes) et par les essais.
//
// Toutes les fêtes de Fénoir sont des fêtes du calendrier du moteur (lakour-mj-ia/scripts/fetes-logique.js) : la clé `cle` EST
// l'id de la fête au socle (« noel », « liberte », « fete-nationale »…), celui que l'outil survie_feter du MJ IA passe au
// système. Les dates (fixes, mobiles, lunaires) et les fenêtres viennent du socle seul : rien n'est daté ici.
// La Toussaint n'a pas d'entrée au socle : elle est dans la fenêtre d'Halloween ; Fénoir décline « halloween » sous le nom de
// « La Toussaint et Halloween ».
//
// Gain et coût (lot « fetes », 2026-11-13 ; famille 1 du complément de Fénoir 3D) : chaque fête a les siens (EFFETS ci-dessous,
// forme lue par la logique du système : systems/lakour-survie/logique/fetes.mjs ; chiffres : docs/equilibre-fetes.md), une fois par
// fête et par année, jamais magiques : ils agissent par le moral, le bruit, la lumière, les stocks, l'hygiène, le sang-froid et les
// liens entre abris. Le texte du gain et du coût (gain, cout) est dit aux joueurs dans le journal « Les fêtes de Fénoir ».
// Avant ce lot, l'effet était le même pour toutes (EFFET_FETE : +1 moral, une ration de plus par personne).
// Quatre fêtes s'ajoutent, que le socle du moteur garde « sur demande » (seul un monde qui les décline les voit) : le ramadan,
// l'Aïd el-Kebir, le Nouvel An tamoul et la marche sur le feu. Elles n'ont pas encore d'illustration (IMAGES_FETES).
// communautes : la ou les communautés de l'île au premier plan de la fête (« tous » : tout le monde) ; aller à la fête d'une autre
// communauté tisse des liens (logique/fetes.mjs, participer). Ni la description (carte publique) ni la consigne (ligne pour le
// narrateur) ne disent un secret de partie.
import { ID } from "./identite.js";

// L'identifiant du module qui porte les images (lakour-fenoir ou lakour-fenoir-en : scripts/identite.js).
export const MODULE_FETES = ID;
export const DOSSIER_IMAGES_FETES = `modules/${MODULE_FETES}/assets/fetes`;
export const imageDeFete = cle => `${DOSSIER_IMAGES_FETES}/${cle}.jpg`;
// L'effet d'avant le lot « fetes » (et celui d'une fête sans effet propre) : +1 moral, une ration de plus par personne, du bruit.
export const EFFET_FETE = { moral: 1, rations: 1, bruit: 2 };
// Les fêtes qui ont leur illustration (assets/fetes/<cle>.jpg).
export const IMAGES_FETES = ["noel", "nouvel-an", "paques", "halloween", "musique", "liberte", "fete-nationale", "dipavali", "nouvel-an-chinois", "cavadee", "letchis"];
export const imageSiPeinte = cle => (IMAGES_FETES.includes(cle) ? imageDeFete(cle) : "");
export const ID_MOTEUR = "lakour-mj-ia";

// periode : la date dite en mots, pour le journal des joueurs (sans trait d'union : le journal la lit telle quelle).
const FETES = [
  { cle: "noel", nom: "Noël sous les flamboyants", periode: "tout décembre ; la veillée du 24 au 26",
    description: "Noël tombe en plein été austral, sous les flamboyants en fleur et la chaleur moite des Bas. Pas de neige, jamais : un cari partagé, des letchis, une branche de filao en guise de sapin, des cadeaux taillés au couteau. On se demande où sont ceux qu'on aimait.",
    consigne: "Noël en plein été austral : flamboyants rouges, letchis, chaleur ; les survivants fabriquent de petits cadeaux et partagent un repas, en pensant aux absents",
    decor: { palette: "sapin", ornements: ["guirlandes", "etoiles"] } },
  { cle: "nouvel-an", nom: "La Saint-Sylvestre et le jour de l'an", periode: "du 31 décembre au 2 janvier",
    description: "Avant, la Saint-Sylvestre éclatait de pétards dans toute l'île. Cette année, on se tait à minuit, on compte les vivants, on se souhaite simplement de voir la suivante. Quelque part, un idiot tire une fusée, et toute la côte l'entend.",
    consigne: "Jour de l'an : les survivants se souhaitent de tenir une année de plus ; les pétards d'avant manquent, et le moindre bruit à minuit porte très loin",
    decor: { palette: "nuit", ornements: ["etoiles", "confettis"] } },
  { cle: "paques", nom: "Pâques", periode: "du Vendredi saint au lundi de Pâques (date mobile)",
    description: "À Pâques, on mangeait le cari poulet en famille et les enfants cherchaient les œufs dans la cour. Cette année, les poules du camp ont pondu, et un œuf caché devient un trésor.",
    consigne: "Pâques : un repas en famille, des œufs de la basse-cour cachés pour les plus jeunes, la cloche d'une église qu'on n'ose pas sonner",
    decor: { palette: "printemps", ornements: ["oeufs"] } },
  { cle: "halloween", nom: "La Toussaint et Halloween", periode: "fin octobre : Halloween le 31 octobre, la Toussaint le 1er novembre",
    description: "À La Réunion, la Toussaint était le jour des cimetières : des familles entières venaient nettoyer et blanchir les tombes, fleurir leurs morts, allumer des bougies, et l'on y restait jusqu'au soir. La veille, les enfants couraient les rues déguisés pour Halloween. Aujourd'hui, les morts ne restent pas tous dans leurs tombes, et plus personne ne va au cimetière. Au camp, on dit à voix basse le nom de ceux qu'on a perdus, on pose une fleur et une bougie au pied d'une croix de bois. Personne ne se déguise plus.",
    consigne: "Toussaint et Halloween : au camp, on fleurit des croix de bois et l'on dit le nom des disparus ; les cimetières sont des lieux qu'on évite. Le deuil se raconte avec pudeur et sobriété, jamais comme un spectacle d'horreur ; plus personne ne se déguise en mort",
    decor: { palette: "crepuscule", ornements: ["bougies", "feuilles"] } },
  { cle: "musique", nom: "La fête de la musique", periode: "le 21 juin, au cœur de l'hiver austral",
    description: "Le 21 juin, au cœur de l'hiver austral, l'île jouait du séga et du maloya à tous les coins de rue. Au camp, un rouleur, un kayamb fabriqué avec des tiges de canne et des graines, et une voix qui chante bas, pour ne pas être entendue trop loin.",
    consigne: "Fête de la musique en hiver austral : un kayamb bricolé, un rouleur, un séga chanté à mi-voix ; la musique réchauffe mais porte loin dans la nuit froide",
    decor: { palette: "soleil", ornements: ["notes"] } },
  { cle: "liberte", nom: "Le 20 décembre, fête de la liberté", periode: "le 20 décembre",
    description: "Le 20 décembre, La Réunion fête l'abolition de l'esclavage de 1848 : le maloya résonne, les kabars s'allument, on se souvient de ceux qui ont brisé leurs chaînes. Cette année, quelqu'un a peint « Nou lé pa esklav » sur un mur du camp, et le tambour s'entend malgré tout.",
    consigne: "C'est le 20 décembre, fête de la liberté (abolition de l'esclavage) : les survivants y voient l'écho de leur propre lutte pour ne dépendre de personne ; un tambour de maloya, un kabar à mi-voix autour du feu",
    decor: { palette: "braise", ornements: ["etoiles"] } },
  { cle: "fete-nationale", nom: "Le 14 juillet", periode: "le 14 juillet",
    description: "Le 14 juillet, il y avait le défilé au Barachois et le feu d'artifice sur la mer. Cette année, plus de défilé, plus de République à fêter, peut-être. On se demande si quelqu'un, en métropole, pense encore à l'île.",
    consigne: "14 juillet : plus de défilé ni de feu d'artifice ; les survivants se demandent si la métropole existe encore et pense à eux",
    decor: { palette: "nuit", ornements: ["etoiles"] } },
  { cle: "dipavali", nom: "Dipavali, la fête des lumières", periode: "octobre ou novembre, à la nouvelle lune (date lunaire)",
    description: "Pour Dipavali, la fête des lumières, les familles tamoules allumaient des lampes à huile devant les cases et dans les temples, et Saint-André défilait en couleurs. Au camp, une seule petite lampe de terre, bien abritée : une lumière contre la nuit, mais pas trop visible.",
    consigne: "Dipavali, fête des lumières : une petite lampe à huile protégée, des douceurs partagées ; la lumière contre les ténèbres, en prenant garde qu'elle ne se voie pas de loin",
    decor: { palette: "or", ornements: ["bougies", "etoiles"] } },
  { cle: "nouvel-an-chinois", nom: "Le Nouvel An chinois", periode: "fin janvier ou février, à la fête du Printemps (date lunaire)",
    description: "À Saint-Denis et Saint-Pierre, les familles chinoises de l'île fêtaient le Nouvel An avec la danse du lion et les pétards rouges. Au camp, on suspend une lanterne de papier rouge et l'on souhaite une année meilleure, à la manière des anciens.",
    consigne: "Nouvel An chinois : lanternes rouges de papier, un plat partagé, le souvenir des danses du lion de Saint-Denis ; on se souhaite santé et prospérité",
    decor: { palette: "braise", ornements: ["lanternes"] } },
  { cle: "cavadee", nom: "Le Cavadee", periode: "janvier ou février, à la pleine lune du mois tamoul de Thai (date lunaire)",
    description: "Au Cavadee, les fidèles tamouls de l'île portaient le kavadi en procession après des jours de jeûne et de prière, les joues percées d'aiguilles d'argent. Cette année, ceux qui croient jeûnent, prient en silence, et portent sur l'épaule le poids qu'ils peuvent.",
    consigne: "Cavadee (fête tamoule) : jeûne, prière, offrande ; les fidèles du groupe le vivent avec gravité et pudeur, sans spectacle",
    decor: { palette: "or", ornements: ["bougies"] } },
  { cle: "letchis", nom: "La fête des letchis", periode: "vers le 13 et le 14 décembre, au plus fort de la saison",
    description: "En décembre, les letchis rougissent dans tous les jardins : on en vendait des bouquets au bord des routes, on en offrait aux voisins. Au camp, on monte dans l'arbre, on remplit les paniers, et pour une journée, tout le monde a le menton qui colle.",
    consigne: "Saison des letchis : les arbres croulent de fruits rouges dans les jardins abandonnés ; une cueillette joyeuse et sucrée, qui oblige à sortir",
    decor: { palette: "rose", ornements: ["coeurs"] } },
  // Fêtes « sur demande » du socle (lot « fetes », 2026-11-13).
  { cle: "ramadan", nom: "Le mois de ramadan", periode: "un mois du calendrier musulman, qui recule chaque année d'une dizaine de jours ; il finit par la fête de la rupture du jeûne",
    description: "Pendant le ramadan, les familles z'arabes, comoriennes et mahoraises de l'île jeûnaient du lever au coucher du soleil, et la rupture du jeûne réunissait les voisins autour des samoussas et du thé. Au camp, ceux qui jeûnent ne mangent et ne boivent qu'à la nuit tombée : on cuisine tard, à la lueur d'une lampe qu'il faut cacher, et le groupe se tient serré.",
    consigne: "Ramadan : ceux qui jeûnent tiennent le jour sans manger ni boire et cuisinent la nuit, lumière masquée ; une discipline partagée, sans jugement de ceux qui ne jeûnent pas ; à la fin, on partage ce qu'on a",
    decor: { palette: "nuit", ornements: ["lanternes", "etoiles"] } },
  { cle: "aid-el-kebir", nom: "L'Aïd el-Kebir", periode: "deux mois et dix jours après la fin du ramadan (calendrier musulman)",
    description: "À l'Aïd el-Kebir, chaque famille musulmane de l'île sacrifiait un cabri ou un mouton et en donnait une part aux voisins et aux plus pauvres. Au camp, donner un cabri, c'est se priver ; mais la part donnée court sur les routes plus vite que le groupe, et des gens finissent par frapper à la porte.",
    consigne: "Aïd el-Kebir : un cabri partagé, une part portée à ceux qui n'ont rien ; la nouvelle d'un abri qui donne se répand, et elle attire des affamés autant que de la gratitude",
    decor: { palette: "or", ornements: ["etoiles"] } },
  { cle: "nouvel-an-tamoul", nom: "Le Nouvel An tamoul", periode: "vers le 14 avril, à la fin de la saison des cyclones",
    description: "À la mi-avril, le Nouvel An tamoul ouvrait l'année au temple : kolam de farine de riz devant les portes, riz au lait sucré, habits neufs. La saison des cyclones s'achève, la terre est encore mouillée : c'est le signal des semis, et le moment d'échanger des graines avec ceux qui en ont d'autres.",
    consigne: "Nouvel An tamoul : fin des cyclones, kolam devant la porte, riz au lait ; on sème, et l'on échange des graines avec un abri voisin si l'on ose aller le voir",
    decor: { palette: "printemps", ornements: ["bougies"] } },
  { cle: "marche-sur-le-feu", nom: "La marche sur le feu", periode: "début janvier, après dix huit jours de carême (chaque temple a sa date)",
    description: "Au début de janvier, après dix-huit jours de carême, les fidèles malbars marchaient pieds nus sur un lit de braises, au temple, sous les yeux de toute l'île. Au camp, on allume un grand feu qui brûle le bois d'une semaine ; ceux qui le traversent, ou le regardent, en reviennent avec des nerfs que la nuit n'entame plus. La lueur se voit de très loin.",
    consigne: "Marche sur le feu : un grand feu de bois, des pieds nus sur les braises, la foi de ceux qui croient et le respect des autres ; rien de surnaturel, seulement des nerfs plus solides, et une lueur visible de loin",
    decor: { palette: "braise", ornements: ["bougies"] } }
];

// ---------------------------------------------------------------- Gains et coûts (lot « fetes »)
// effet : la forme lue par la logique du système (logique/fetes.mjs) ; gain, cout : ce qu'en lisent les joueurs (journal des fêtes).
const EFFETS = {
  liberte: { communautes: ["cafres", "tous"], effet: { moral: 1, rations: 1, bruit: 4, soutien: { moral: 1, jours: 3 } },
    gain: "Le maloya remonte le moral de tout l'abri : +1 de moral à chacun, et trois jours où il remonte plus haut.",
    cout: "Une ration de plus par personne ; le tambour s'entend de très loin (bruit +4 à l'abri)." },
  noel: { communautes: ["tous"], effet: { moral: 1, rations: 2, bruit: 1, soutien: { moral: 1, jours: 7 }, attache: true },
    gain: "Un repas partagé : +1 de moral, et une semaine où il remonte plus haut ; un cadeau attache une recrue au groupe (elle devient compagnon et ne part plus, même à bout de forces).",
    cout: "Un vrai surplus : deux rations de plus par personne." },
  "nouvel-an": { communautes: ["tous"], effet: { moral: 1, rations: 1, bruit: 2 },
    gain: "On se souhaite de voir l'année suivante : +1 de moral à chacun.",
    cout: "Une ration de plus par personne ; à minuit, le moindre bruit porte loin (bruit +2)." },
  paques: { communautes: ["tous"], effet: { moral: 1, rations: 1, bruit: 1 },
    gain: "Un repas en famille, des œufs cachés pour les plus jeunes : +1 de moral à chacun.",
    cout: "Une ration de plus par personne (bruit +1)." },
  halloween: { communautes: ["tous"], effet: { moral: 1, repos: true, lueur: { visibilite: 1, jours: 1 } },
    gain: "On donne le repos à tous ses morts retrouvés : leur deuil se lève ; +1 de moral à chacun.",
    cout: "Il faut avoir retrouvé ses morts (le corps d'un mort relevé en Livide doit être retrouvé d'abord) ; les bougies se voient la nuit (visibilité +1)." },
  musique: { communautes: ["tous"], effet: { rations: 1, options: { musique: { moral: 1, bruit: 3 }, silence: { fatigue: -1 } } },
    gain: "La nuit la plus longue de l'année, dans le froid des Hauts : en musique, +1 de moral à chacun ; en silence, on dort serrés (fatigue −1).",
    cout: "Une ration chaude de plus par personne ; si l'on joue, la musique porte loin (bruit +3)." },
  "fete-nationale": { communautes: ["tous"], effet: { moral: 1, rations: 1, bruit: 2 },
    gain: "Un verre levé à ceux d'en face : +1 de moral à chacun.",
    cout: "Une ration de plus par personne (bruit +2)." },
  dipavali: { communautes: ["malbars", "tous"], effet: { moral: 2, rations: 1, lueur: { visibilite: 3, jours: 1 } },
    gain: "Une nuit de lampes à huile : +2 de moral à chacun.",
    cout: "Une ration de plus par personne ; chaque flamme attire (visibilité +3 cette nuit)." },
  "nouvel-an-chinois": { communautes: ["chinois", "tous"], effet: { moral: 1, rations: 1, bruit: 3, quarts: 2, hygiene: { jours: 30 }, liens: 1 },
    gain: "Le grand ménage de l'abri : un mois où les maladies prennent moitié moins ; dettes et trocs soldés ; un don à un abri voisin installe la confiance (un lien de plus avec lui) ; +1 de moral à chacun.",
    cout: "Deux quarts de travail, une ration de plus par personne, et les pétards (bruit +3)." },
  cavadee: { communautes: ["malbars"], effet: { voeu: { moral: 1, fatigue: 1 }, lueur: { visibilite: 2, jours: 1 } },
    gain: "Après dix jours de carême, un vœu (retrouver quelqu'un, atteindre un lieu) qui soutient le moral de ceux qui l'ont fait tant qu'ils le tiennent.",
    cout: "Les privations (fatigue +1 à ceux qui font le vœu) ; la marche à découvert (visibilité +2 ce jour-là)." },
  letchis: { communautes: ["tous"], effet: { moral: 1, quarts: 1, bruit: 1, gain: { nourriture: 3 } },
    gain: "Une cueillette joyeuse : +1 de moral à chacun et trois paniers de letchis (nourriture +3).",
    cout: "Il faut sortir et grimper aux arbres (un quart dehors ; bruit +1)." },
  ramadan: { communautes: ["zarabes", "comoriens"], effet: { soutien: { moral: 1, jours: 30 }, lueur: { visibilite: 1, jours: 30 } },
    gain: "Un mois de discipline et de cohésion : le moral de chacun remonte plus haut pendant tout le mois.",
    cout: "On ne mange et ne boit qu'à la nuit : cuisine et lumière nocturnes (visibilité +1 pendant le mois)." },
  "aid-el-kebir": { communautes: ["zarabes", "comoriens"], effet: { moral: 1, cout: { nourriture: 6 }, liens: 2, renom: 1, refugies: true },
    gain: "La part donnée aux démunis bâtit la réputation de l'abri (renom +1, deux liens de plus avec l'abri à qui l'on porte une part) ; des réfugiés viendront ; +1 de moral à chacun.",
    cout: "Un cabri de l'élevage (six rations)." },
  "nouvel-an-tamoul": { communautes: ["malbars"], effet: { moral: 1, gain: { graines: 2 }, avecGain: { graines: 2 }, liens: 1 },
    gain: "Fin de la saison des cyclones, signal des semis : deux graines mises de côté, et deux de plus en les échangeant avec un abri voisin (un lien de plus avec lui) ; +1 de moral à chacun.",
    cout: "Rien d'autre que d'oser aller voir les voisins." },
  "marche-sur-le-feu": { communautes: ["malbars"], effet: { sangFroid: { des: 1, jours: 14 }, cout: { materiaux: 4 }, lueur: { visibilite: 3, jours: 1 } },
    gain: "Du sang-froid face aux hordes : deux semaines où la défense de l'abri a un dé de plus contre une horde.",
    cout: "Beaucoup de bois (quatre matériaux) ; une lueur visible de loin (visibilité +3 cette nuit)." }
};

// Deux alias de compatibilité, NON énumérables (absents de assets/donnees.json) : `moteur` (= cle, lu par main.js pour décliner la
// fête) et `date` (= periode, lu par le journal « Les fêtes de Fénoir », contenu/journaux.mjs).
export const FETES_FENOIR = FETES.map(f => Object.defineProperties({ ...f, ...(EFFETS[f.cle] ?? { communautes: ["tous"], effet: EFFET_FETE, gain: "", cout: "" }) }, {
  moteur: { value: f.cle, enumerable: false },
  date: { value: f.periode, enumerable: false }
}));

// Les déclinaisons remises au socle (api.fetes.enregistrer) : une par fête, id « fenoir-<cle> ».
export const declinaisons = () => FETES_FENOIR.map(f => ({ id: `fenoir-${f.cle}`, fete: f.cle, nom: f.nom, description: f.description, consigne: f.consigne, decor: f.decor }));

// Le calendrier du socle dans Foundry (api.fetes.calendrier, la logique de fetes-logique.js), ou null.
const calendrierDuMoteur = () => globalThis.game?.modules?.get?.(ID_MOTEUR)?.api?.fetes?.calendrier ?? null;

// Les fêtes de Fénoir à une date de JEU « AAAA-MM-JJ » (pas celle du navigateur), de la plus prioritaire à la moins, avec leur
// fenêtre : [{ ...fête, debut, fin, coeur }]. Les dates viennent du socle : `calendrier(date)` est fetesDuJour de
// fetes-logique.js (ou api.fetes.calendrier du moteur, par défaut dans Foundry). Sans socle : [].
export function fetesDuJour(dateIso, calendrier = calendrierDuMoteur()) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(dateIso ?? ""));
  if (!m || typeof calendrier !== "function") return [];
  // Midi, heure locale : le socle lit le jour local de la date.
  const jour = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]), 12);
  return calendrier(jour).map(c => {
    const f = FETES_FENOIR.find(x => x.cle === c.id);
    return f ? { ...f, debut: c.debut, fin: c.fin, coeur: c.coeur } : null;
  }).filter(Boolean);
}
