// Les fêtes de Fénoir (contrat §6 et §9) : ce que chaque fête de La Réunion devient dans le monde d'après. Données seules, sans
// dépendance : lues par main.js (enregistrement auprès du socle des fêtes du moteur, lakour-mj-ia/docs/fetes.md), par le
// fabricant (outils/fabriquer-fenoir.mjs : assets/donnees.json, journal des fêtes) et par les essais.
//
// Deux calendriers :
// - le calendrier RÉEL du moteur (date du navigateur du MJ) : seules les fêtes qui y existent (`moteur`) y sont déclinées
//   (Noël, Nouvel An, Pâques, Halloween, Fête de la musique) ; une déclinaison par fête du moteur ;
// - le calendrier DU JEU (date de jeu, à partir de dateDepart) : toutes les fêtes, dates fixes ou datées année par année
//   (`dates`), avec leur fenêtre. Le système et le MJ IA s'en servent : fetesDuJour("2026-12-20").
// Effet public, le même pour toutes : fêter la fête au camp redonne 1 de moral à chacun, une fois par fête, au prix d'une ration
// de nourriture de plus par personne. Jamais de règle cachée.
// Ni la description (carte publique) ni la consigne (ligne pour le narrateur) ne disent un secret de partie.
export const MODULE_FETES = "lakour-fenoir";
export const DOSSIER_IMAGES_FETES = `modules/${MODULE_FETES}/assets/fetes`;
export const imageDeFete = cle => `${DOSSIER_IMAGES_FETES}/${cle}.jpg`;
export const EFFET_FETE = { moral: 1, cout: { nourriture: 1 }, parPersonne: true, unique: true };

// date : "MM-JJ" (fixe) ; dates : { "AAAA": "MM-JJ" } pour les fêtes mobiles ; avant / apres : jours de la fenêtre.
export const FETES_FENOIR = [
  { cle: "fete-de-la-liberte", nom: "Le 20 décembre, fête de la liberté", moteur: null, date: "12-20", avant: 0, apres: 0,
    description: "Le 20 décembre, La Réunion fête l'abolition de l'esclavage de 1848 : le maloya résonne, les kabars s'allument, on se souvient de ceux qui ont brisé leurs chaînes. Cette année, quelqu'un a peint « Nou lé pa esklav » sur un mur du camp, et le tambour s'entend malgré tout.",
    consigne: "C'est le 20 décembre, fête de la liberté (abolition de l'esclavage) : les survivants y voient l'écho de leur propre lutte pour ne dépendre de personne ; un tambour de maloya, un kabar à mi-voix autour du feu",
    decor: { palette: "braise", ornements: ["etoiles"] } },
  { cle: "noel", nom: "Noël sous les flamboyants", moteur: "noel", date: "12-25", avant: 1, apres: 1,
    description: "Noël tombe en plein été austral, sous les flamboyants en fleur et la chaleur moite des Bas. Pas de neige, jamais : un cari partagé, des letchis, un letchi en guise de sapin, des cadeaux taillés au couteau. On se demande où sont ceux qu'on aimait.",
    consigne: "Noël en plein été austral : flamboyants rouges, letchis, chaleur ; les survivants fabriquent de petits cadeaux et partagent un repas, en pensant aux absents",
    decor: { palette: "sapin", ornements: ["guirlandes", "etoiles"] } },
  { cle: "nouvel-an", nom: "Le jour de l'an", moteur: "nouvel-an", date: "01-01", avant: 1, apres: 0,
    description: "Avant, la Saint-Sylvestre éclatait de pétards dans toute l'île. Cette année, on se tait à minuit, on compte les vivants, on se souhaite simplement de voir la suivante. Quelque part, un idiot tire une fusée, et toute la côte l'entend.",
    consigne: "Jour de l'an : les survivants se souhaitent de tenir une année de plus ; les pétards d'avant manquent, et le moindre bruit à minuit attire les Livides",
    decor: { palette: "nuit", ornements: ["etoiles", "confettis"] } },
  { cle: "nouvel-an-chinois", nom: "Le Nouvel An chinois", moteur: null, dates: { "2027": "02-06", "2028": "01-26" }, avant: 0, apres: 1,
    description: "À Saint-Denis et Saint-Pierre, les familles chinoises de l'île fêtaient le Nouvel An avec la danse du lion et les pétards rouges. Au camp, on suspend une lanterne de papier rouge et l'on souhaite une année meilleure, à la manière des anciens.",
    consigne: "Nouvel An chinois : lanternes rouges de papier, un plat partagé, le souvenir des danses du lion de Saint-Denis ; on se souhaite santé et prospérité",
    decor: { palette: "braise", ornements: ["lanternes"] } },
  { cle: "cavadee", nom: "Le Cavadee", moteur: null, dates: { "2027": "01-22" }, avant: 0, apres: 0,
    description: "Au Cavadee, les fidèles tamouls de l'île portaient le kavadi en procession après des jours de jeûne et de prière, les joues percées d'aiguilles d'argent. Cette année, ceux qui croient jeûnent, prient en silence, et portent sur l'épaule le poids qu'ils peuvent.",
    consigne: "Cavadee (fête tamoule) : jeûne, prière, offrande ; les fidèles du groupe le vivent avec gravité et pudeur, sans spectacle",
    decor: { palette: "or", ornements: ["bougies"] } },
  { cle: "paques", nom: "Pâques", moteur: "paques", dates: { "2027": "03-28", "2028": "04-16" }, avant: 2, apres: 1,
    description: "À Pâques, on mangeait le cari poulet en famille et les enfants cherchaient les œufs dans la cour. Cette année, les poules du camp ont pondu, et un œuf caché devient un trésor.",
    consigne: "Pâques : un repas en famille, des œufs de la basse-cour cachés pour les plus jeunes, la cloche d'une église qu'on n'ose pas sonner",
    decor: { palette: "printemps", ornements: ["oeufs"] } },
  { cle: "fete-de-la-musique", nom: "La fête de la musique", moteur: "musique", date: "06-21", avant: 0, apres: 0,
    description: "Le 21 juin, au cœur de l'hiver austral, l'île jouait du séga et du maloya à tous les coins de rue. Au camp, un rouleur, un kayamb fabriqué avec des tiges de canne et des graines, et une voix qui chante bas, pour ne pas être entendue trop loin.",
    consigne: "Fête de la musique en hiver austral : un kayamb bricolé, un rouleur, un séga chanté à mi-voix ; la musique réchauffe mais porte loin dans la nuit froide",
    decor: { palette: "soleil", ornements: ["notes"] } },
  { cle: "quatorze-juillet", nom: "Le 14 juillet", moteur: null, date: "07-14", avant: 0, apres: 0,
    description: "Le 14 juillet, il y avait le défilé au Barachois et le feu d'artifice sur la mer. Cette année, plus de défilé, plus de République à fêter, peut-être. On se demande si quelqu'un, en métropole, pense encore à l'île.",
    consigne: "14 juillet : plus de défilé ni de feu d'artifice ; les survivants se demandent si la métropole existe encore et pense à eux",
    decor: { palette: "nuit", ornements: ["etoiles"] } },
  { cle: "dipavali", nom: "Dipavali", moteur: null, dates: { "2026": "11-08", "2027": "10-29", "2028": "10-17" }, avant: 0, apres: 1,
    description: "Pour Dipavali, la fête des lumières, les familles tamoules allumaient des lampes à huile devant les cases et dans les temples, et Saint-André défilait en couleurs. Au camp, une seule petite lampe de terre, bien abritée : une lumière contre la nuit, mais pas trop visible.",
    consigne: "Dipavali, fête des lumières : une petite lampe à huile protégée, des douceurs partagées ; la lumière contre les ténèbres, en prenant garde qu'elle ne se voie pas de loin",
    decor: { palette: "or", ornements: ["bougies", "etoiles"] } },
  { cle: "halloween", nom: "Halloween", moteur: "halloween", date: "10-31", avant: 2, apres: 0,
    description: "Halloween, à La Réunion, c'était des enfants déguisés en morts-vivants qui réclamaient des bonbons. Plus personne ne se déguise. Les enfants du camp en ont peur, ou en rient, ce qui est peut-être pire.",
    consigne: "Halloween : plus personne ne se déguise en mort ; les enfants du camp jouent à faire peur, et les adultes ne rient pas",
    decor: { palette: "braise", ornements: ["citrouilles", "feuilles"] } },
  { cle: "toussaint", nom: "La Toussaint", moteur: null, date: "11-01", avant: 0, apres: 1,
    description: "À la Toussaint, l'île entière allait fleurir ses morts, et les cimetières se couvraient de bougies. Aujourd'hui, les morts ne restent pas toujours dans leurs tombes. On plante une fleur au pied d'une croix de bois pour ceux qu'on a dû achever.",
    consigne: "Toussaint : fleurir les tombes de ceux qu'on a perdus, sous des croix de bois ; les cimetières, eux, sont devenus des lieux qu'on évite",
    decor: { palette: "crepuscule", ornements: ["bougies"] } },
  { cle: "fete-des-letchis", nom: "La fête des letchis", moteur: null, date: "12-15", avant: 14, apres: 30,
    description: "En décembre, les letchis rougissent dans tous les jardins : on en vendait des bouquets au bord des routes, on en offrait aux voisins. Au camp, on monte dans l'arbre, on remplit les paniers, et pour une journée, tout le monde a le menton qui colle.",
    consigne: "Saison des letchis : les arbres croulent de fruits rouges dans les jardins abandonnés ; une cueillette joyeuse et sucrée, qui oblige à sortir",
    decor: { palette: "rose", ornements: ["coeurs"] } }
];

// Fête(s) du jeu à une date ISO "AAAA-MM-JJ" (date de jeu, pas celle du navigateur).
export function fetesDuJour(dateIso, fetes = FETES_FENOIR) {
  const annee = Number(dateIso.slice(0, 4));
  const jour = Date.parse(`${dateIso}T12:00:00Z`);
  // L'année d'avant et celle d'après aussi : une fenêtre peut chevaucher le jour de l'an (letchis).
  return fetes.filter(f => [annee - 1, annee, annee + 1].some(a => {
    const md = f.date ?? f.dates?.[String(a)];
    if (!md) return false;
    const ecart = Math.round((jour - Date.parse(`${a}-${md}T12:00:00Z`)) / 86400000);
    return ecart >= -f.avant && ecart <= f.apres;
  }));
}
