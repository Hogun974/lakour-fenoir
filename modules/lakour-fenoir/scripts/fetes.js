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
// Effet public, le même pour toutes : fêter la fête au camp redonne 1 de moral à chacun, une fois par fête, au prix d'une ration
// de nourriture de plus par personne. Jamais de règle cachée. Ni la description (carte publique) ni la consigne (ligne pour le
// narrateur) ne disent un secret de partie.
export const MODULE_FETES = "lakour-fenoir";
export const DOSSIER_IMAGES_FETES = `modules/${MODULE_FETES}/assets/fetes`;
export const imageDeFete = cle => `${DOSSIER_IMAGES_FETES}/${cle}.jpg`;
export const EFFET_FETE = { moral: 1, cout: { nourriture: 1 }, parPersonne: true, unique: true };
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
    decor: { palette: "rose", ornements: ["coeurs"] } }
];

// Deux alias de compatibilité, NON énumérables (absents de assets/donnees.json) : `moteur` (= cle, lu par main.js pour décliner la
// fête) et `date` (= periode, lu par le journal « Les fêtes de Fénoir », contenu/journaux.mjs).
export const FETES_FENOIR = FETES.map(f => Object.defineProperties({ ...f }, {
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
