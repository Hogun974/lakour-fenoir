// Le jour qu'on croit, les cartes et les calendriers (lot « cartes », 2026-11-17 ; lot 3 de l'inventaire du jeu 3D, famille 1 du
// complément) : les cartes, les calendriers et la montre à trouver, les quatre fabrications pour tenir le compte des jours, deux
// tables du MJ, le journal du MJ « Le jour qu'on croit » et une page du guide du joueur. Les règles
// sont dans le système (logique/reperes.mjs ; contrat §20 ; chiffres : docs/equilibre-cartes.md) ; ici, le texte et les données.
//
// Le champ `repere` d'un équipement (catégorie « repere ») :
// - type : "carte" | "calendrier" | "montre" | "planche" | "cadran" | "cahier" | "encre" ;
// - rarete : "commune" | "peu-commune" | "rare" (pour le MJ ; la chance de trouver est dans `lieux`) ;
// - lieux : { type de site | "region" (une fouille sans lieu précis) : chance par fouille } ;
// - carte : couvre ("ile" | "region" : la ville où on la trouve | { un: [régions] } : l'une d'elles), terrains (ceux de ses routes),
//   ilYa ([min, max] années depuis l'impression), dechiree (une moitié de l'île), routesImprimees ({ "a|b": état } : ce qu'elle
//   dit d'une route, « ouverte » sinon), notes ({ région: texte } : ce qu'on y lit), annotations ([{ region, texte, vraie }] : l'une
//   d'elles, écrite par un mort ; `vraie` est pour le MJ) ;
// - calendrier : annee ("courante" | "postes" : l'année suivante en novembre et décembre | "passee"), lunes, marees, fetes.
import { equipement, objet, html, table, journal, MODULE } from "./aides.mjs";
import { REGIONS } from "./monde.mjs";

const nomRegion = cle => REGIONS.find(r => r.cle === cle)?.nom ?? cle;
const pct = x => `${Math.round(x * 1000) / 10} %`.replace(".", ",");
const R = (cle, nom, repere, description, charge = 0) => equipement({ cle, nom, categorie: "repere", bonus: {}, charge, repere, description });

// ---------------------------------------------------------------- Cartes
const CARTES = [
  R("carte-routiere-de-l-ile", "Carte routière de l'île", {
    type: "carte", rarete: "rare", couvre: "ile", terrains: ["route"], ilYa: [0, 2],
    lieux: { commerce: 0.04, gite: 0.04, caserne: 0.05, port: 0.03, autre: 0.02, region: 0.005 }
  }, `La carte routière dépliable qu'on achetait à la station-service ou à l'aéroport : les nationales en rouge, les départementales en jaune, les villes, les cols. Presque rien du relief, rien des sentiers. Elle dit les routes telles qu'elles étaient le jour où on l'a imprimée ; ce qui les bouche aujourd'hui, elle ne le sait pas, et elle ne sait rien des Livides.`),
  R("carte-de-randonnee", "Carte de randonnée", {
    type: "carte", rarete: "peu-commune", couvre: { un: ["cilaos", "mafate", "salazie", "fournaise"] }, terrains: ["route", "piste", "sentier"], ilYa: [1, 8],
    lieux: { gite: 0.08, ilet: 0.05, caserne: 0.02, autre: 0.03, region: 0.005 }
  }, `Une carte au 1/25 000 d'un cirque ou du volcan, pliée et repliée par un randonneur : chaque courbe de niveau, chaque sentier, chaque îlet, les gîtes et les points d'eau. C'est la seule qui montre les sentiers. Elle ne sait pas lesquels l'éboulis a emportés depuis.`),
  R("plan-de-ville", "Plan de ville", {
    type: "carte", rarete: "commune", couvre: "region", terrains: ["route"], ilYa: [0, 4],
    lieux: { commerce: 0.06, ecole: 0.04, immeuble: 0.04, gite: 0.03, maison: 0.02, "case-creole": 0.02, autre: 0.03, region: 0.015 }
  }, `Le plan que distribuaient l'office de tourisme et la mairie : les rues, les écoles, la pharmacie de garde, la gendarmerie, les routes qui sortent de la ville. Il ne couvre que la ville où on l'a trouvé.`),
  R("carte-ancienne", "Carte ancienne de l'île", {
    type: "carte", rarete: "commune", couvre: "ile", terrains: ["route", "sentier"], ilYa: [30, 45],
    routesImprimees: { "saint-paul|saint-leu": "difficile", "saint-denis|route-du-littoral": "difficile" },
    notes: {
      "saint-paul": "La carte ne connaît pas la route des Tamarins : entre Saint-Paul et Saint-Leu, seulement la route sinueuse de la côte.",
      "route-du-littoral": "La carte ne montre que la vieille route sous la falaise, celle des éboulis, et pas la nouvelle route sur la mer.",
      "sud-sauvage": "La carte trace la route des Laves comme elle passait avant les grandes coulées : une partie de ce tracé est sous la lave.",
      "fournaise": "Des sentiers marqués au pied du volcan ne mènent plus nulle part : les coulées sont passées dessus."
    },
    lieux: { ecole: 0.06, "case-creole": 0.04, maison: 0.03, autre: 0.03, region: 0.006 }
  }, `Une carte de l'île d'il y a trente ou quarante ans, trouvée dans le placard d'une école ou au fond d'une case : les routes d'alors, des sentiers que plus personne ne prend, et ni la route des Tamarins ni la nouvelle route du Littoral. Elle a l'air sûre d'elle. Elle trompe.`),
  R("moitie-de-carte", "Moitié de carte routière", {
    type: "carte", rarete: "commune", couvre: "ile", dechiree: true, terrains: ["route"], ilYa: [0, 3],
    lieux: { commerce: 0.03, port: 0.02, immeuble: 0.02, maison: 0.02, region: 0.006 }
  }, `Une carte routière déchirée en deux, tachée, gondolée par la pluie : on n'en a qu'une moitié, l'ouest ou l'est. Le reste de l'île s'arrête au bord du papier.`),
  R("carte-annotee", "Carte annotée par un mort", {
    type: "carte", rarete: "rare", couvre: "ile", terrains: ["route", "sentier"], ilYa: [0, 3],
    annotations: [
      { region: "cilaos", vraie: true, texte: "« Îlet à Cordes : la case bleue au bout du chemin, sous le plancher, de quoi tenir un mois. » Au stylo bleu, souligné deux fois." },
      { region: "sainte-marie", vraie: true, texte: "« Gillot : NE PAS PASSER PAR LA ZONE CARGO. » Trois croix rouges autour d'un hangar." },
      { region: "le-tampon", vraie: false, texte: "« Bourg-Murat : ils ont de l'eau et des médicaments, ils accueillent. » Avec une date, juste avant le silence." },
      { region: "salazie", vraie: true, texte: "« Hell-Bourg : derrière les thermes, sous la grille, ça tient. » Une flèche vers la ravine." },
      { region: "saint-pierre", vraie: false, texte: "« Terre-Sainte : un bateau. Ils partent le 15. » Le mois n'est pas écrit." },
      { region: "plaine-des-palmistes", vraie: false, texte: "« Bébour : le gîte est vide, le feu prend bien, personne. » Une autre main a ajouté, au crayon : « menteur »." }
    ],
    lieux: { caserne: 0.02, gite: 0.02, ilet: 0.02, hopital: 0.02, region: 0.004 }
  }, `Une carte routière couverte d'une écriture serrée au stylo bille : des croix, des flèches, des dates, des mots soulignés deux fois. Celui qui l'a annotée est mort ; on l'a trouvée sur lui, ou à côté. Sa note dit une cache, un danger, ou un mensonge, et on ne sait pas lequel.`),
  R("copie-de-carte", "Copie de carte", { type: "carte", rarete: "commune", couvre: "ile", terrains: ["route"], ilYa: [0, 0], copie: true },
    `Une carte recopiée à la main dans un cahier cousu, à l'encre de suie : les routes, les régions, les notes, pas le relief. Elle vaut ce que valait la main qui l'a tracée.`)
];

// ---------------------------------------------------------------- Calendriers et montre
const CALENDRIERS = [
  R("calendrier-des-postes", "Calendrier des postes", {
    type: "calendrier", rarete: "commune", annee: "postes", lunes: true, marees: false, fetes: false,
    lieux: { "case-creole": 0.1, maison: 0.08, ferme: 0.08, immeuble: 0.06, ilet: 0.06, eglise: 0.05, commerce: 0.03, region: 0.03 }
  }, `L'almanach que le facteur passait vendre en fin d'année, avec ses photos de chatons ou de paysages de l'île : les jours, les saints, les vacances scolaires et les quartiers de lune. En novembre et en décembre, c'est déjà celui de l'année suivante. Il était accroché dans la cuisine de presque toutes les cases.`),
  R("calendrier-de-l-annee", "Calendrier de l'année", {
    type: "calendrier", rarete: "peu-commune", annee: "courante", lunes: false, marees: false, fetes: false,
    lieux: { commerce: 0.05, usine: 0.04, ecole: 0.03, caserne: 0.03, hopital: 0.03, port: 0.03, autre: 0.03, ferme: 0.02, region: 0.01 }
  }, `Un calendrier publicitaire de garage, de quincaillerie ou de boutique chinoise, une photo par mois. Les jours, rien d'autre : pas de lune. Coché chaque soir, il garde le compte des jours de l'année.`),
  R("calendrier-des-marees-et-des-lunes", "Calendrier des marées et des lunes", {
    type: "calendrier", rarete: "rare", annee: "courante", lunes: true, marees: true, fetes: false,
    lieux: { phare: 0.1, port: 0.08, commerce: 0.01, region: 0.003 }
  }, `Le petit livret des pêcheurs et des plaisanciers : pour chaque jour, les heures des marées, le lever et le coucher de la lune, sa phase heure par heure. Avec lui, la lune donne le jour à un jour près.`),
  R("vieux-calendrier", "Vieux calendrier", {
    type: "calendrier", rarete: "commune", annee: "passee", lunes: true, marees: false, fetes: false,
    lieux: { ecole: 0.06, maison: 0.05, "case-creole": 0.05, immeuble: 0.04, ferme: 0.04, region: 0.015 }
  }, `Un calendrier d'une autre année, oublié sur un mur : les jours tombent faux, et les lunes aussi. Celui qui y lit la lune croit retrouver le jour ; il se trompe, sans le savoir.`),
  R("calendrier-des-fetes", "Calendrier des fêtes de l'île", {
    type: "calendrier", rarete: "rare", annee: "courante", lunes: true, marees: false, fetes: true,
    lieux: { ecole: 0.03, commerce: 0.02, autre: 0.02, region: 0.004 }
  }, `Le calendrier d'une association interculturelle, distribué dans les écoles et les mairies : Noël et le 20 désanm, le Nouvel An chinois et la Dipavali, le Cavadee, l'Aïd, le Nouvel An tamoul, Pongal… avec les lunes, puisque tant de fêtes les suivent. On y voit venir les fêtes des autres.`),
  R("montre-a-aiguilles", "Montre à aiguilles", {
    type: "montre", rarete: "peu-commune",
    lieux: { maison: 0.02, "case-creole": 0.02, immeuble: 0.02, commerce: 0.02, caserne: 0.02, hopital: 0.02, region: 0.006 }
  }, `Une montre mécanique, de celles qu'on remonte chaque matin d'un tour de molette : elle ne craint ni la panne de courant ni les piles mortes. Avec elle, on sait l'heure, pas le jour.`)
];

// ---------------------------------------------------------------- Ce qu'on fabrique pour tenir le compte
const FAITS_MAIN = [
  R("planche-des-jours", "Planche des jours", { type: "planche", rarete: "commune" },
    `Une planche et un couteau : une encoche par jour, groupées par cinq, une plus longue à chaque lune. On y perd moins vite le fil qu'avec des traits dans un carnet.`, 1),
  R("cadran-solaire", "Cadran solaire", { type: "cadran", rarete: "commune" },
    `Quatre galets et une baguette plantée bien droite dans la cour : l'ombre dit l'heure quand il y a du soleil. Il ne sert qu'à l'abri, et seulement de jour.`, 2),
  R("encre-de-suie", "Encre de suie", { type: "encre", rarete: "commune" },
    `Du charbon de bois pilé dans un peu d'eau et de sève : de quoi écrire quand les stylos sont morts. Une fiole sert pour une copie.`),
  R("cahier-cousu", "Cahier cousu", { type: "cahier", rarete: "commune" },
    `Des feuilles pliées et cousues au fil de pêche : de quoi recopier une carte, tenir un journal, garder ce qu'on apprend.`)
];

export const EQUIPEMENTS_REPERES = [...CARTES, ...CALENDRIERS, ...FAITS_MAIN];

// ---------------------------------------------------------------- Recettes (le format de recettes.mjs)
function recette({ cle, nom, description, cout, travail, competence = "bricolage", difficulte = "normale", produit }) {
  return objet({ pack: "recettes", type: "recette", cle, nom, img: "icons/svg/anvil.svg",
    system: { description: html(description), cout, travail, competence, difficulte, requiert: { savoirs: [], installation: null }, produit, sac: true } });   // lot 6 : depuis le sac
}
export const RECETTES_REPERES = [
  recette({ cle: "planche-des-jours", nom: "Planche des jours", cout: { materiaux: 1 }, travail: 1, difficulte: "facile", produit: { equipement: "planche-des-jours", n: 1 },
    description: `Une planche, un couteau, un peu de lumière : on taille la première encoche le soir même.` }),
  recette({ cle: "cadran-solaire", nom: "Cadran solaire", cout: { materiaux: 1 }, travail: 2, competence: "survie", difficulte: "difficile", produit: { equipement: "cadran-solaire", n: 1 },
    description: `Quatre galets, une gaulette bien droite, et une journée de soleil pour marquer les heures sur l'ombre. Il faut savoir où est le nord.` }),
  recette({ cle: "encre-de-suie", nom: "Encre de suie", cout: { eau: 1 }, travail: 1, competence: "survie", difficulte: "facile", produit: { equipement: "encre-de-suie", n: 2 },
    description: `Le charbon d'un feu de la veille, pilé fin, un peu d'eau, une goutte de sève pour que ça tienne : deux fioles.` }),
  recette({ cle: "cahier-cousu", nom: "Cahier cousu", cout: { materiaux: 1 }, travail: 1, produit: { equipement: "cahier-cousu", n: 1 },
    description: `Des feuilles récupérées (des cahiers d'école, le dos des affiches), pliées et cousues au fil de pêche.` })
];

// ---------------------------------------------------------------- Tables du MJ
const T = (cle, nom, description, resultats) => {
  const t = table({ cle, nom, description, resultats });
  Object.assign(t.flags[MODULE], { reperes: cle });
  return t;
};
const JOUR_DONNE = [
  "Un vieux planteur des Hauts, sûr de lui : « On est le 12. J'ai coché sur le calendrier du facteur, chaque soir. » Il dit vrai, à un jour près.",
  "Une marchande du marché forain : « Le 3, ou le 4… La foire, c'est dans dix jours, ça je sais. » Elle se trompe de deux jours, de bonne foi.",
  "Un îlet qui répond par sifflets, d'une crête à l'autre : trois coups, puis deux. Personne ne sait d'où ils tiennent leur date.",
  "Un gamin qui compte sur ses doigts depuis la dernière pleine lune. Il a raison, à trois jours près.",
  "Un homme qui vend des œufs, et qui gagne à ce qu'on croie que la foire est demain. Il ment.",
  "Un poste de radio qui grésille, une voix lointaine qui donne la date en passant. C'est le vrai jour.",
  "La dame qui tient l'oratoire du chemin et le compte des messes : elle a le bon jour, et le dit à qui passe.",
  "Deux voisins qui se disputent, à quatre jours d'écart. L'un des deux a raison ; aucun ne cédera."
];
const ANNOTATIONS = CARTES.find(c => c.system.cle === "carte-annotee").system.repere.annotations;
export const TABLES_REPERES = [
  T("le-jour-qu-on-vous-donne", "Le jour qu'on vous donne", `Quand le groupe a perdu le compte et demande le jour : qui le donne, et ce que vaut ce qu'il dit (reperes, fenêtre du MJ « Un jour donné ou reçu »).`, JOUR_DONNE),
  T("ce-qu-un-mort-a-ecrit-sur-sa-carte", "Ce qu'un mort a écrit sur sa carte", `Les notes d'une carte trouvée sur un mort : une cache, un danger, ou un mensonge (la carte annotée en porte une).`,
    ANNOTATIONS.map(a => `${nomRegion(a.region)} — ${a.texte}`))
];

// ---------------------------------------------------------------- Le journal du MJ
const LIEUX = { region: "une fouille sans lieu précis (des cases au hasard)", maison: "une maison", "case-creole": "une case créole", immeuble: "un immeuble",
  ecole: "une école", commerce: "un commerce, une station-service", ferme: "une ferme", gite: "un gîte, un hôtel", ilet: "un îlet", caserne: "une caserne",
  hopital: "un hôpital", port: "un port", phare: "un phare", usine: "une usine", eglise: "un lieu de culte", autre: "un autre lieu (mairie, maison forestière, thermes…)" };
const RARETES = { commune: "commune", "peu-commune": "peu commune", rare: "rare" };
const lieuxDe = def => Object.entries(def.system.repere.lieux ?? {}).sort((a, b) => b[1] - a[1]).map(([l, p]) => `${LIEUX[l] ?? l} ${pct(p)}`).join(", ");
const ligneRepere = d => `- **${d.name}** (${RARETES[d.system.repere.rarete] ?? d.system.repere.rarete}) — ${d.system.description.replace(/<[^>]+>/g, "")}${d.system.repere.lieux ? ` *Où on en trouve : ${lieuxDe(d)}.*` : ""}`;
const chancesParLieu = () => Object.keys(LIEUX).map(l => {
  const total = EQUIPEMENTS_REPERES.reduce((s, d) => s + (Number(d.system.repere.lieux?.[l]) || 0), 0);
  return total ? `- ${LIEUX[l]} : ${pct(total)}` : null;
}).filter(Boolean).join("\n");

const PAGES_MJ = [
  { cle: "le-compte-des-jours", titre: "Le compte des jours", texte: `Au jour zéro, tout le monde sait quel jour on est : le téléphone le dit. Tant que le **téléphone** marche là où est le groupe, ou que la **radio** de l'abri parle, la date est exacte. Ensuite, il faut la tenir soi-même.

**Celui qui tient le compte.** Un survivant du groupe note le jour, chaque jour : une encoche dans un carnet, un trait sur un mur, une case cochée. Au départ, c'est le premier du groupe ; on en désigne un autre dans la fenêtre du MJ (« Le compte des jours »). Le système note le jour de lui-même tant que celui qui le tient est **là et en état** : il ne le note pas s'il est séparé du groupe, mort, mourant (4 blessures), épuisé (fatigue 5) ou confus par le Gris (stade 5) ; au fond du trou (**moral 0**), il oublie un jour sur trois. Le MJ peut aussi dire qu'un jour n'a pas été noté (une fuite, une nuit de cyclone) ou qu'un autre l'a noté à la main.

**Ce qui se passe quand on note.**
- Sur un **calendrier de l'année** qu'on coche, le compte reste **sûr**.
- Par **encoches** (un carnet), on finit par douter : au bout de **10 jours**, le compte devient « **à peu près** » (à un jour près), même s'il est juste.
- Sur une **planche des jours** (une encoche plus longue à chaque lune), le doute ne vient qu'au bout de **30 jours**.

**Ce qui se passe quand on ne note pas.** Chaque jour oublié rend le compte incertain et le fait dériver : **30 %** de chances que le jour soit sauté (on prend du retard), **10 %** qu'il soit compté deux fois (de l'avance). **Trois jours de suite** sans noter (deux sans calendrier de l'année), et le compte est **perdu** : on ne sait plus quel jour on est. Il ne reste que la date lue dans la nature (« début février, lune gibbeuse, les longanis »), et ce que disent les autres.

**Ce que voient les joueurs.** Le bandeau dit la date si on la sait, « vers le … » si le compte est à peu près, la date lue dans la nature s'il est perdu ; le numéro du jour suit (« Jour ≈ 41 », « Jour ? »). Le MJ voit toujours le vrai jour, et l'écart.

**Ce que le système ne fait pas.** Il ne dit jamais aux joueurs que leur compte est faux. Un compte « à peu près » peut être juste, et un compte faux peut sembler solide : un jour reçu d'un autre reste « à peu près », même s'il était faux.` },
  { cle: "le-jour-des-autres", titre: "Le jour des autres, et le mensonge", texte: `Un compte perdu ne se retrouve que **par d'autres** : un PNJ, une communauté, un journal trouvé sur un mort, la radio si elle revient. **Ils peuvent se tromper, ou mentir.** Le jour reçu est cru et noté, avec le nom de qui l'a donné ; le compte devient « à peu près ». S'il était faux, on ne le découvre qu'en **recoupant** : la lune sur un calendrier de l'année, ou quelqu'un d'autre qui dit autre chose. Le système ne le dit pas aux joueurs.

**Aller à la fête des autres** rend le jour : ceux qui reçoivent savent quel jour ils fêtent.

**Donner un faux jour exprès.** Quand le groupe donne un jour qu'il ne croit pas (fenêtre du MJ, « Un jour donné ou reçu »), le faux jour **court par le Ladi Lafé** : une rumeur fausse et malveillante, dont l'auteur reste au secret. Si elle est **démentie** un jour (un calendrier, un témoin, un fait), le menteur porte l'acte « **mentir** » (vers le rouge, et sa réputation en souffre), comme tout mensonge démenti. Le groupe qui ne sait plus le jour et en donne un ne ment pas : il se trompe.

Table : « Le jour qu'on vous donne ». L'affaire « Le jour qu'il est » naît quand le groupe a perdu le compte.` },
  { cle: "la-lune-sur-un-calendrier", titre: "La lune sur un calendrier", texte: `Une nuit où l'on voit la lune (le ciel dégagé, la lune levée ; une nuit sans lune, à la nouvelle lune, se lit aussi), un calendrier qui **marque les lunes** redonne le jour : on cherche, dans le mois qu'on croit vivre, le jour où la lune avait cette tête-là. Le jour retrouvé l'est **à 2 jours près** (à 1 jour près avec le **calendrier des marées et des lunes**, qui donne la phase heure par heure). Quand le compte est perdu, le mois se lit dans la nature.

**Un calendrier d'une autre année** a ses lunes **fausses** : le jour trouvé l'est aussi, sans que personne le sache. Le système le dit au MJ.

Le calendrier de l'année du garage n'a pas de lunes : il garde le compte, il ne le retrouve pas.` },
  { cle: "l-heure-du-ciel", titre: "L'heure du ciel", texte: `Le téléphone, la radio ou une **montre à aiguilles** donnent l'heure exacte. Sans eux, l'heure se lit dans le ciel :
- de jour, par **beau temps** : à **une demi-heure** près (le **cadran solaire** de l'abri la donne juste) ;
- de jour **sous les nuages** ou la pluie, ou par **nuit claire** : à **une heure et demie** près ;
- par **nuit couverte** : à **trois heures** près ;
- **sous terre** (un abri dans un tunnel de lave) : on ne sait plus l'heure.

Les joueurs ne voient alors que le moment du jour (matin, après-midi, soir, nuit). Le soleil se lève vers **5 h 36** et se couche vers **18 h 48** en saison des pluies ; vers **6 h 42** et **17 h 48** en saison sèche.` },
  { cle: "les-cartes", titre: "Les cartes", texte: `Une carte dit les routes **telles qu'elles étaient imprimées** : avant la crise, sans rien des Livides, sans les éboulis, les épaves et les radiers emportés depuis. Elle s'ajoute aux renseignements du groupe (tableau de bord, onglet des renseignements : les routes « d'après la carte », en pointillés plus fins sur la carte de l'île), sans jamais remplacer ce qu'on a vu. Une carte de routes ne montre que les routes ; une carte de randonnée montre aussi les pistes et les sentiers. Plusieurs cartes se complètent ; la plus récente l'emporte. Perdre la carte (un troc, un mort), c'est perdre ce qu'elle disait.

${CARTES.filter(c => c.system.cle !== "copie-de-carte").map(ligneRepere).join("\n")}

**Recopier une carte** (fenêtre du MJ) demande un cahier cousu et une fiole d'encre de suie (usée), et un quart : la copie garde les routes et les notes, pas le relief.

Table : « Ce qu'un mort a écrit sur sa carte ».` },
  { cle: "les-calendriers", titre: "Les calendriers et la montre", texte: `Un calendrier vaut pour **son année** : celle que le groupe croit vivre. Coché chaque jour, celui de l'année garde le compte **sûr** et laisse **trois jours** au lieu de deux avant de le perdre. S'il marque les lunes, il le retrouve (« La lune sur un calendrier »). Le calendrier des fêtes fait voir venir les fêtes des autres.

${CALENDRIERS.map(ligneRepere).join("\n")}

**Les fabrications** (atelier) : la **planche des jours** (le doute vient après 30 jours d'encoches au lieu de 10), le **cadran solaire** (l'heure juste à l'abri, de jour, au soleil), l'**encre de suie** et le **cahier cousu** (recopier une carte).` },
  { cle: "ou-on-les-trouve", titre: "Où on les trouve", texte: `En fouillant un lieu, le système tire une fois : une carte, un calendrier ou une montre, parfois. L'objet va au premier fouilleur, avec l'année d'un calendrier, la région d'un plan de ville ou d'une carte de randonnée, la moitié d'une carte déchirée, la note d'une carte annotée. La chance d'en trouver un, selon le lieu :

${chancesParLieu()}

Le MJ peut aussi en donner un (une trouvaille racontée, un troc) : fenêtre du MJ, « Une carte ou un calendrier ».` },
  { cle: "le-journal-d-un-mort", titre: "Le journal d'un mort", texte: `Chaque survivant tient son journal : les jours notés, ce qu'il a vu, les plans qu'il a appris. **Il reste sur le corps** : on le lit sur place, on ne l'emporte pas.

- **Le journal d'un mort du groupe** se lit là où il est tombé, tant qu'il n'a pas reçu le repos (il est enterré avec lui) ; celui d'un Livide qu'on n'a pas retrouvé marche avec lui. Il rend le jour qu'il croyait (s'il le savait encore), à une marge qui grandit d'un jour tous les trois jours depuis sa mort, et les plans du groupe à sa mort.
- **Le journal d'un inconnu** (table du lot des affaires, « Récit — le journal d'un mort ») : le MJ dit son dernier jour noté (vrai, faux, ou menteur), depuis combien de jours le corps est là, ses plans, et ce qu'il dit des régions (l'infestation, l'eau, le courant, une note) ; ses renseignements entrent s'ils sont plus récents que ceux du groupe, sous la source « journal ».

Lire prend un quart. Le jour d'un journal n'est pris que si le groupe ne sait pas le jour. Pour le ton : rien à montrer du corps ; ce qui serre le cœur, c'est l'écriture, les jours cochés qui s'arrêtent.` },
  { cle: "systeme", titre: "Ce que fait le système", texte: `- **Chaque jour** : le compte des jours (le téléphone de la région du groupe ou la radio de l'abri le remettent juste ; sinon celui qui le tient note, ou non). Au journal public : le doute, le compte perdu, le jour manqué, la date qui revient ; une alerte quand le compte se perd.
- **Le bandeau** : la date et le jour que le groupe croit ; l'heure seulement si on la sait (téléphone, radio, montre, cadran).
- **Les fouilles** : une carte, un calendrier ou une montre, parfois.
- **La fête des autres** : on y apprend le jour.
- **Les affaires** : « quand la date se perd » s'ouvre de lui-même.
- **API** : reperes() (lecture : le compte, l'heure, les objets du groupe, ce que disent ses cartes, les journaux lisibles ; l'écart au vrai jour au MJ seul), compte({ action: "teneur" | "noter" | "oublier" | "regler", acteurId, date, certitude }), donnerDate({ de, a, date, mensonge }), lireLaLune({ objetId }), donnerRepere({ acteurId, cle }), copierCarte({ objetId, acteurId }), lireJournal({ mortId } ou { de, date, depuis, plans, renseignements }).` }
];
export const JOURNAL_REPERES = journal({ cle: "le-jour-qu-on-croit", nom: "Le jour qu'on croit", pack: "mj", pages: PAGES_MJ });

// ---------------------------------------------------------------- Une page du guide du joueur
export const PAGES_JOUEUR_REPERES = [
  { cle: "le-jour-qu-on-croit", titre: "Le jour qu'on croit, les cartes et les calendriers", texte: `Au début, le téléphone dit le jour. Quand il se tait, il faut le tenir soi-même.

- **Noter le jour.** L'un de vous tient le compte, chaque soir. Sur un calendrier de l'année qu'on coche, le compte reste sûr. Avec de simples encoches, on finit par douter au bout de dix jours ; une planche des jours fait tenir un mois.
- **Oublier.** Un jour sans le noter (une fuite, une fièvre, un mauvais soir) fait glisser le compte d'un jour, dans un sens ou dans l'autre. Trois jours de suite, et on ne sait plus quel jour on est. Il reste les signes de la nature : la lune, les fruits, la canne qu'on coupe.
- **Les autres.** Celui qui a perdu le compte ne le retrouve que par d'autres. Ils peuvent se tromper, ou mentir. Un calendrier qui marque les lunes, une nuit claire, et l'on retrouve le jour à deux jours près ; s'il est d'une autre année, ses lunes mentent aussi.
- **L'heure** se lit dans le ciel : à une demi-heure près par beau temps, beaucoup moins bien la nuit ou sous les nuages, plus du tout sous terre. Une montre à aiguilles, ça ne craint pas la panne.
- **Les cartes** se trouvent en fouillant : routière, de randonnée, plan de ville, vieille carte trompeuse, carte déchirée, carte annotée par un mort. Elles disent les routes d'avant, rien des Livides.
- **Le journal d'un mort** reste sur son corps. On le lit sur place.

> Trois jours de fièvre. Quand je me suis relevée, personne n'avait noté. Madame Narayanin a dit samedi, Firmin a dit dimanche. On a pris samedi, parce qu'elle avait l'air plus sûre. On a su plus tard, à la fête de Pongal de l'îlet d'en face, qu'on était lundi.
> *Carnet d'une infirmière, Salazie.*

> Le monsieur du marché m'a dit le 14. Le vieux des Hauts m'a dit le 11. La lune, sur le calendrier des pêcheurs, dit le 12. Je crois la lune.
> *Carnet sans nom, Saint-Pierre.*` }
];
