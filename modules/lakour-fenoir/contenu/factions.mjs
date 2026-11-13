// Les factions de Fénoir (contrat §2.5) : groupes humains qui naissent de la crise. Noms et textes inventés.
// croissance : par jour (simulation) ; ressourcesPreferees : ce qu'elles pillent ou échangent d'abord.
import { html } from "./aides.mjs";

// sensMoralChef : le sens moral (−10 rouge .. +10 bleu) de qui mène la bande devant l'abri (complément du jeu 3D, famille 3 ;
// docs/equilibre-moral.md) : il pèse sur ce qu'il décide (attaquer, négocier, passer, ultimatum, demander à rejoindre).
const SENS_CHEFS = { "garnison-du-quai": -2, "cooperative-des-plaines": 1, ferrailleurs: -1, "barques-du-sud": 1, "pelerins-de-la-lave": 0,
  "familles-des-ilets": 1, "dispensaire-du-sud": 6, "sans-lune": -7 };
function faction({ cle, nom, attitude, regionsDepart, croissance, ressourcesPreferees, description, veulent, traiter, chef, signe }) {
  return { cle, nom, attitude, regionsDepart, croissance, ressourcesPreferees, description: html(description), veulent: html(veulent),
    traiter: html(traiter), chef, signe, sensMoralChef: SENS_CHEFS[cle] ?? 0 };
}

export const FACTIONS = [
  faction({ cle: "garnison-du-quai", nom: "La Garnison du Quai", attitude: "mefiante", regionsDepart: ["le-port", "route-du-littoral"], croissance: 0.012,
    ressourcesPreferees: ["carburant", "munitions", "medicaments"],
    chef: "La commandante Hoarau, ancienne officière de port, qui signe ses ordres « pour l'autorité provisoire »",
    signe: "Brassards orange fluo, conteneurs empilés en murailles, sirène du port à heure fixe",
    description: `Ce qui reste de l'ordre au Port : quelques militaires, des gendarmes mobiles coupés de leur hiérarchie, des agents portuaires, des dockers et leurs familles, retranchés derrière des murailles de conteneurs autour des darses, des cuves de carburant et des derniers navires. Ils se disent l'autorité légitime de l'île en attendant « la métropole ». On y croise des Zoreils mutés qui n'ont pas eu d'avion, des dockers cafres et malbars du Port, des gendarmes de toute l'île sous une commandante yab ; dehors, on ricane qu'« *zot i atann la Frans konm in bato i sa vien* » (ils attendent la France comme un bateau qui va venir).`,
    veulent: `Du carburant, des armes, des médecins, des techniciens pour faire tourner ce qui reste de la centrale et des grues ; contrôler la route du Littoral ; recenser les survivants « pour l'évacuation ».`,
    traiter: `Ils respectent l'uniforme, la discipline et les papiers, même faux. On entre chez eux désarmé, on en sort fiché. Ils paient bien en carburant, mais réquisitionnent ce qu'ils jugent nécessaire. Celui qui se dit médecin ou électricien n'est plus jamais tout à fait libre de partir.` }),
  faction({ cle: "cooperative-des-plaines", nom: "La Coopérative des Plaines", attitude: "neutre", regionsDepart: ["le-tampon", "plaine-des-palmistes", "hauts-de-l-ouest", "cilaos"], croissance: 0.01,
    ressourcesPreferees: ["graines", "materiaux", "carburant"],
    chef: "Un conseil de sept fermiers, présidé par une vieille éleveuse que tout le monde appelle Mémé Lucette",
    signe: "Clôtures doublées, cloches de vache aux barrières, troc le samedi à Bourg-Murat",
    description: `Les fermiers et éleveurs des Hauts se sont regroupés autour des fermes de la Plaine des Cafres et des Palmistes : lait, viande, légumes, et des fusils de chasse pour garder les clôtures. Ils travaillent dur, partagent entre eux et se méfient des gens de la ville. Des yabs des Plaines surtout, mais aussi des familles malbares qui élèvent là-haut depuis trois générations et deux Zoreils venus faire du fromage ; en bas, on dit « *bann yab i partaz ant zot* » (les yabs ne partagent qu'entre eux), et la Coopérative répond que la ville n'est jamais montée aider aux foins.`,
    veulent: `Des bras pour les récoltes, des graines, du carburant pour les tracteurs, des soignants ; qu'on les laisse tranquilles.`,
    traiter: `On paie en travail, en savoir ou en graines ; la parole donnée vaut contrat. Un voleur est chassé, un tricheur aussi. Ceux qui restent une saison et tiennent leurs engagements finissent par avoir une place au conseil.` }),
  faction({ cle: "ferrailleurs", nom: "Les Ferrailleurs", attitude: "neutre", regionsDepart: ["le-port", "saint-paul", "saint-leu", "est"], croissance: 0.015,
    ressourcesPreferees: ["pieces", "materiaux", "carburant"],
    chef: "Personne et tout le monde ; on cite souvent « Gros Mani », qui tient la casse de la Rivière des Galets",
    signe: "Pick-up hérissés de tôle, colliers de clés de voiture, marché aux pièces dans les zones commerciales",
    description: `Récupérateurs du littoral : mécaniciens, ferrailleurs, débrouillards, ils démontent tout ce que la ville a laissé, des voitures aux panneaux solaires, et revendent les pièces. Ils ne sont pas cruels, seulement efficaces : un abri abandonné une semaine est dépouillé jusqu'aux gouttières. Cafres du Port, Malgaches des chantiers, un Z'arabe qui tenait la plus grande casse de Saint-Paul : chez eux, on ne demande d'où l'on vient que pour savoir où sont les pièces.`,
    veulent: `Des pièces, du carburant, des véhicules, des informations sur les dépôts intacts ; commercer avec tout le monde.`,
    traiter: `Le troc est roi, la parole aussi longtemps qu'elle rapporte. Ils échangent tout contre tout, renseignements compris, et vendent les vôtres au suivant. Ne laissez rien sans garde.` }),
  faction({ cle: "barques-du-sud", nom: "Les Barques du Sud", attitude: "neutre", regionsDepart: ["saint-pierre", "sud-sauvage", "saint-leu", "saint-paul"], croissance: 0.01,
    ressourcesPreferees: ["carburant", "materiaux", "medicaments"],
    chef: "Le patron Grondin, pêcheur de Saint-Pierre, et une capitaine de Saint-Philippe qu'on appelle « la Marine »",
    signe: "Barques peintes amarrées au large, feux de signal sur les jetées, poisson séché contre tout",
    description: `Les pêcheurs de Saint-Pierre, de Saint-Joseph, de Saint-Philippe et de Saint-Leu se sont organisés en flottille : on dort sur les bateaux, au mouillage, hors de portée des Livides, et l'on vit de la mer. Ils relient les marines du Sud et de l'Ouest et transportent ce qui doit l'être. Familles de pêcheurs créoles de toutes les nuances, ils se moquent des plaisanciers zoreils de Saint-Gilles qui réclament une place à bord, et les prennent quand même quand ils savent réparer un moteur.`,
    veulent: `Du carburant pour les moteurs, de la toile et du cordage, des médicaments ; des ports sûrs ; la paix sur les quais.`,
    traiter: `Ils échangent du poisson et des traversées contre du carburant et des médicaments. Un passage par la mer coûte cher, mais il évite la route des Laves. Toucher à un bateau, c'est la guerre.` }),
  faction({ cle: "pelerins-de-la-lave", nom: "Les Pèlerins de la Lave", attitude: "mefiante", regionsDepart: ["est", "sud-sauvage"], croissance: 0.014,
    ressourcesPreferees: ["nourriture", "medicaments", "eau"],
    chef: "Frère Expédit, ancien catéchiste, voix douce et regard qui ne cille pas",
    signe: "Pierres de lave portées au cou, cierges sur les coulées, chants le soir au bord de la route des Laves",
    description: `Autour de l'église de Sainte-Rose que la lave a épargnée, une communauté s'est formée : des familles de l'Est, des réfugiés, des malades. Ils croient que le volcan protège ceux qui vivent à son pied, que la chaleur purifie, et que le Gris est une épreuve. Ils partagent tout, soignent, accueillent… et attendent qu'on croie. Catholiques de l'Est pour la plupart, ils ont vu arriver des familles malbares avec leurs lampes et leurs dieux, et certains fidèles grincent : « *zot i fé servis dan nout légliz* » (ils font des services dans notre église). Frère Expédit les laisse prier.`,
    veulent: `Des fidèles, des vivres à partager, des soignants ; qu'on respecte leurs rites ; garder la route des Laves.`,
    traiter: `On y est nourri et soigné sans payer, mais on y reste en partageant leur vie. Ils se méfient des armes et de l'ironie. Leur foi peut devenir dangereuse quand ils décident de « rendre à la lave » un infecté, ou un sceptique.` }),
  faction({ cle: "familles-des-ilets", nom: "Les Familles des Îlets", attitude: "mefiante", regionsDepart: ["mafate", "salazie"], croissance: 0.006,
    ressourcesPreferees: ["medicaments", "pieces", "graines"],
    chef: "Les anciens de chaque îlet ; à La Nouvelle, une ancienne institutrice que les sentiers écoutent",
    signe: "Cols gardés par deux guetteurs, sifflets qui se répondent d'îlet en îlet, cases fermées à la nuit",
    description: `Les quelques centaines d'habitants de Mafate, et ceux de Salazie qui les ont rejoints. Ils vivaient déjà sans route, avec leurs panneaux, leurs sources et leurs jardins ; le monde d'après ressemble à leur monde d'avant, en plus dur. Ils gardent les cols et choisissent qui entre. Petits blancs et Cafres des îlets, cousins d'un sentier à l'autre, ils se sont toujours fait traiter d'arriérés par les Bas ; ce sont les seuls à n'avoir presque rien perdu au jour zéro.`,
    veulent: `Des médicaments, des pièces pour leurs panneaux et leurs captages, des graines ; qu'on ne leur amène pas la maladie.`,
    traiter: `On demande à entrer, on ne force pas. Une quarantaine de trois jours au col, un travail à faire, et l'on peut rester. Les Familles n'oublient ni un service ni un affront. Elles enseignent volontiers l'hydraulique et le solaire à qui les aide.` }),
  faction({ cle: "dispensaire-du-sud", nom: "Le Dispensaire du Sud", attitude: "amicale", regionsDepart: ["saint-pierre", "saint-denis"], croissance: 0.008,
    ressourcesPreferees: ["medicaments", "eau", "carburant"],
    chef: "La docteure Soundirassen, urgentiste, épuisée, qui n'a pas quitté l'hôpital depuis le jour zéro",
    signe: "Croix rouge peinte sur des draps, ambulances transformées en navettes, coupons de soin écrits à la main",
    description: `Des soignants qui ont refusé de partir : médecins, infirmières, aides-soignants, pharmaciens, et ceux qui les protègent. Ils tiennent une aile du grand hôpital du Sud et un poste à Saint-Denis, soignent qui vient, étudient le Gris et cherchent un remède qu'ils n'ont pas. Une urgentiste malbare, des infirmières de toute l'île, un pharmacien z'arabe, des internes zoreils qui n'ont pas pu repartir : on s'y dispute sur tout, sauf sur qui soigner.`,
    veulent: `Des médicaments, de l'eau, du carburant pour les groupes électrogènes, des volontaires ; des corps à étudier, des infectés à observer.`,
    traiter: `On y est soigné contre ce qu'on peut donner, et parfois pour rien. Ils sont honnêtes, et à bout. Leur besoin d'étudier le Gris peut les pousser à des demandes dérangeantes : ramener un infecté vivant, un Livide entier, un enfant mordu.` }),
  faction({ cle: "sans-lune", nom: "Les Sans-Lune", attitude: "hostile", regionsDepart: ["saint-denis", "sainte-marie"], croissance: 0.02,
    ressourcesPreferees: ["nourriture", "munitions", "carburant", "medicaments"],
    chef: "Un homme qu'on appelle « le Comptable », qui tient la liste de ce que chaque quartier lui doit",
    signe: "Visages noircis, sortie les nuits sans lune, marques à la bombe sur les portes « déjà payées »",
    description: `Une bande née des pillages de la capitale, grossie de tous ceux qui ont compris qu'on survit mieux en prenant qu'en produisant. Ils sortent la nuit, connaissent la ville par cœur et lèvent un tribut sur les quartiers qu'ils « protègent ». Plus le littoral se vide de Livides, plus ils s'étendent. Ils viennent de tous les quartiers et de toutes les couleurs, et c'est bien la seule chose qu'ils partagent avec le reste de l'île.`,
    veulent: `Tout ce qui se mange, se boit, se tire ou se vend ; la peur des autres ; les abris prospères.`,
    traiter: `On paie, on se cache ou on se bat. Un tribut acheté ne dure qu'une lune. Quelques-uns, jeunes et perdus, peuvent être ramenés de l'autre côté par la parole. Les autres ne comprennent que la force.` })
];
