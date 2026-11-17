// Les affaires de l'île, les récits sans quête et ce que chaque région laisse comprendre (lot 12 « Affaires, récits et fêtes »,
// 2026-11-17 ; contrat §17). Repris et adapté du jeu 3D (docs/propositions/histoire-et-quetes.md, §2 à §4 et §6), pour un MJ sur
// table ou pour le MJ IA :
// - 23 affaires, des « quêtes » qui n'en ont pas l'air : comment on l'apprend, ce qu'elle demande, comment elle tourne mal, ce
//   qu'elle change, ce qu'on en garde ; sa vérité (tirée et gardée par le MJ), sa pente (ce qu'elle devient si personne ne s'en
//   occupe), ses issues (avec leurs effets dans les règles de Fénoir), ses voix et ses traces. Registre `affaires` (lu par la
//   logique du système : systems/lakour-survie/logique/affaires.mjs) et journal du MJ « Les affaires de l'île » ;
// - la méthode (journal du MJ « Mener une affaire »), les sujets délicats (décision de Jordan du 17 novembre), la règle de respect
//   des fêtes ;
// - les supports de récit sans quête (six tables nouvelles ; la radio et les oratoires ont déjà les leurs), les neuf figures de
//   l'île, les bruits, les Livides en fête ;
// - une ligne d'arrivée par région pour le MJ (registre `regions[].arrivee`) et une page du livre de l'île (les signes des murs).
//
// Tout est écrit une fois, à la main. Les préjugés sont dans la bouche des personnages, jamais confirmés ; aucune origine ne
// joue dans les règles ; la foi n'a aucun effet propre. Les données (DONNEES_AFFAIRES) et la fabrique (construireAffaires) sont
// séparées : la fabrique prend aussi les libellés et les noms, pour que les essais et la traduction la rejouent à l'identique.
import { journal, table, MODULE } from "./aides.mjs";
import { REGIONS, SITES } from "./monde.mjs";
import { FACTIONS } from "./factions.mjs";
import { SAVOIRS } from "./savoirs.mjs";
import { INSTALLATIONS } from "./installations.mjs";
import { FOIRES } from "./marche.mjs";
import { FETES_FENOIR } from "../scripts/fetes.js";

// ---------------------------------------------------------------- Les affaires
// Une affaire : { cle, numero, titre, taille, famille, regions (vide : partout), sites, factions, front, foire,
//   naissance: { mois, phases, fete, cran, declencheurs }, apprendre, demande, malTourner, change, garde,
//   verites: { verite: { poids, texte } }, pente: { tousLes (jours), crans: [texte] }, issues: [{ cle, titre, texte, effets }],
//   voix: [texte], traces, ton }. Les effets d'une issue : logique/affaires.mjs (EFFETS_ISSUE).
const A = (a) => ({ regions: [], sites: [], factions: [], front: "", foire: "", ton: "", ...a,
  naissance: { mois: [], phases: [], fete: "", cran: 0, declencheurs: [], ...a.naissance } });
const PLUS_TARD = ["effondrement", "silence", "apres"];
const SAISON_SECHE = [5, 6, 7, 8, 9, 10, 11];

const AFFAIRES = [
  // ---------------- Les cirques
  A({ cle: "les-lentilles-d-octobre", numero: 1, titre: "Les lentilles d'octobre", taille: "grande-affaire", famille: "cirques",
    regions: ["cilaos"], sites: ["ferme-d-ilet-a-cordes"], factions: ["familles-des-ilets", "cooperative-des-plaines"], foire: "foire-des-lentilles",
    naissance: { mois: [9, 10], phases: ["silence", "apres"] },
    apprendre: `Dès septembre, tout le Sud répète que Cilaos tiendra sa foire « comme avant », sous trêve. On l'entend au marché de Saint-Pierre, à la radio des Barques, dans la bouche d'un porteur qui redescend du cirque.`,
    demande: `Que la route aux quatre cents virages ou les sentiers soient praticables le jour dit, que quelqu'un garde la trêve, que les îlets descendent leur récolte. On peut escorter un convoi de porteurs, déblayer un éboulis au-dessus du Pavillon (deux jours de chantier, et du bruit), garder la trêve avec le conseil, ou seulement venir troquer.`,
    malTourner: `L'éboulis n'est pas levé, et la foire se tient entre gens du cirque seulement. Une bande vient « compter les sacs » et tâter la trêve. La date circule fausse : des gens montent un jour trop tôt ou trop tard, et dorment dehors.`,
    change: `Si elle a lieu, Cilaos a sa foire (trois jours, onglet Marché) et la Coopérative y garde un étal à l'année.`,
    garde: `Des graines, des nouvelles de toute l'île en une journée, et le souvenir d'avoir vu du monde.`,
    verites: {
      vraie: { poids: 3, texte: `La foire aura lieu si la route est ouverte : le conseil de l'îlet l'a décidé.` },
      perimee: { poids: 1, texte: `On l'a dit en juillet ; depuis, un éboulis a coupé la route au-dessus du Pavillon, et personne ne l'a encore dit en bas.` },
      fausse: { poids: 1, texte: `La date répétée en bas est fausse d'une semaine : quelqu'un s'est trompé en recopiant, ou l'a voulu.` }
    },
    pente: { tousLes: 7, crans: [`Le conseil de l'îlet cherche des bras pour l'éboulis.`, `Les porteurs descendent seuls, chargés ; certains n'arrivent pas.`, `La foire se tient entre gens du cirque ; le Sud ne monte pas.`] },
    issues: [
      { cle: "tenue", titre: "La foire se tient", texte: `La route est ouverte et la trêve tenue : trois jours de troc, des gens de toute l'île.`, effets: { reputation: { "familles-des-ilets": 2, "cooperative-des-plaines": 1 }, moral: 1 } },
      { cle: "entre-soi", titre: "Entre gens du cirque", texte: `L'éboulis tient ; la foire se fait sans le Sud, et sans le groupe s'il n'a pas aidé.`, effets: {} },
      { cle: "treve-rompue", titre: "La trêve rompue", texte: `Une bande compte les sacs, quelqu'un sort une arme : la trêve tombe, la foire se vide, et l'on cherche à qui la faute.`, effets: { reputation: { "familles-des-ilets": -1 }, rumeur: true } }
    ],
    voix: [`« Cette année, Cilaos tient sa foire. Comme avant. Sous trêve. »`, `« Les lentilles ? Si la route passe. Et si la route passe, tout le monde passe. »`,
      `À la craie, sur le mur de la gare routière de Saint-Pierre : « LENTILLES, 3e SAMEDI ».`, `La radio des Barques : « Cilaos cherche des bras pour l'éboulis du Pavillon. Nourris. »`],
    traces: `Un étal de la Coopérative qui reste ; un sentier balisé de cairns pour monter ; la date notée dans les cahiers de dix abris, pas toujours la même.` }),

  A({ cle: "la-treille-de-grand-ilet", numero: 2, titre: "La treille de Grand Îlet", taille: "affaire", famille: "cirques",
    regions: ["salazie"], sites: ["ferme-de-grand-ilet"], factions: ["familles-des-ilets"],
    naissance: { phases: PLUS_TARD },
    apprendre: `Une famille de Grand Îlet fait dire, par les Familles des Îlets, qu'elle ne peut plus monter ses treilles de chouchous seule : le fils est descendu le jour zéro et n'est pas remonté.`,
    demande: `Des bras pendant une semaine, du fil de fer, du bambou, et de la patience : la gramoune ne montre sa façon de faire qu'à celui qui reste jusqu'au bout.`,
    malTourner: `La route emportée a refermé le cirque : on n'y entre que par les cols. Un glissement de terrain menace la parcelle. Celui qui part avant la fin n'apprend rien, et laisse un affront que la famille n'oublie pas.`,
    change: `Le cirque nourrit un abri de plus, ou perd une ferme.`,
    garde: `La façon lontan de monter une treille (le savoir « Jardin créole »), et une famille qui n'oublie ni le service ni l'affront.`,
    verites: {
      vraie: { poids: 4, texte: `La famille a vraiment besoin de bras, et la gramoune enseignera à qui reste.` },
      exageree: { poids: 1, texte: `La famille s'en sortirait seule ; elle cherche surtout des voisins pour l'hiver, et un gendre si possible.` }
    },
    pente: { tousLes: 10, crans: [`Les lianes de chouchou courent par terre et pourrissent.`, `La famille mange ses graines.`, `Elle descend à Hell-Bourg, et la ferme retourne à la brousse.`] },
    issues: [
      { cle: "jusqu-au-bout", titre: "Rester jusqu'au bout", texte: `Sept jours de travail ; la gramoune montre sa façon, et la famille donne de sa récolte.`, effets: { savoir: "jardin-creole", reputation: { "familles-des-ilets": 2 }, stocks: { nourriture: 4 } } },
      { cle: "parti-avant", titre: "Partir avant la fin", texte: `On a aidé trois jours, puis on est parti : la famille le dit à tous les îlets.`, effets: { reputation: { "familles-des-ilets": -1 } } },
      { cle: "glissement", titre: "Le glissement", texte: `La pluie emporte la parcelle avant la fin. La famille n'a plus rien : l'accueillir, c'est trois bouches de plus et une gramoune qui sait.`, effets: { acte: "accueillir", recrue: true } }
    ],
    voix: [`« Grand Îlet cherche des bras pour les treilles. Nourris, logés, et la gramoune qui montre. »`, `« Elle ne montre qu'à ceux qui restent. Les autres, elle les regarde partir. »`,
      `Un sifflet, depuis le col : trois coups longs. À Salazie, cela veut dire qu'on demande de l'aide.`],
    traces: `Une treille montée à la façon d'avant, ou des lianes mortes sur des piquets ; le nom de celui qui est parti, que la famille dit encore.` }),

  A({ cle: "la-quarantaine-du-col", numero: 3, titre: "La quarantaine du col", taille: "affaire", famille: "cirques",
    regions: ["salazie", "mafate"], sites: ["relais-du-col-des-boeufs"], factions: ["familles-des-ilets"],
    naissance: { phases: PLUS_TARD },
    apprendre: `En voulant entrer. Au relais du col des Bœufs, deux guetteurs des Familles arrêtent tout le monde : trois jours d'attente, sous leurs yeux, avec d'autres qui attendent.`,
    demande: `D'attendre trois jours, de travailler pour sa soupe, et de regarder les autres : parmi ceux qui attendent, une femme garde ses manches longues malgré la chaleur.`,
    malTourner: `La dénoncer peut être une erreur : une brûlure de marmite, pas une morsure. Se taire peut laisser entrer le Gris dans le cirque. Partir de nuit par le sentier fait de vous ceux qu'on ne laissera plus jamais entrer.`,
    change: `La confiance des Familles des Îlets, pour longtemps, dans un sens ou dans l'autre.`,
    garde: `L'entrée de Mafate, ou une rumeur tenace sur son propre compte.`,
    verites: {
      vraie: { poids: 1, texte: `Elle a été mordue il y a deux jours, et elle espère que ce n'est rien. Le Gris suit son cours : le MJ dit le stade.` },
      fausse: { poids: 2, texte: `C'est une brûlure de marmite, mal soignée ; elle a honte de la cicatrice.` }
    },
    pente: { tousLes: 1, crans: [`Les guetteurs comptent les jours, sans rien dire.`, `Quelqu'un d'autre a vu les manches, et parle tout bas.`, `Le troisième jour, les guetteurs font retrousser les manches à tout le monde.`] },
    issues: [
      { cle: "denoncer-a-raison", titre: "La dénoncer, à raison", texte: `C'était une morsure : les Familles la mettent à l'écart, et laissent entrer le groupe.`, effets: { reputation: { "familles-des-ilets": 1 } } },
      { cle: "denoncer-a-tort", titre: "La dénoncer, à tort", texte: `C'était une brûlure. Elle est renvoyée quand même, et le Ladi Lafé sait qui l'a désignée.`, effets: { acte: "colporter", rumeur: true } },
      { cle: "se-taire", titre: "Se taire", texte: `Personne ne dit rien. Si c'était une morsure et qu'on apprend que le groupe avait vu, la confiance des Familles tombe.`, effets: { reputation: { "familles-des-ilets": -1 } } },
      { cle: "partir-de-nuit", titre: "Partir de nuit", texte: `Par le sentier, sans attendre la fin : le groupe entre, et tous les îlets le savent le lendemain.`, effets: { reputation: { "familles-des-ilets": -3 }, rumeur: true } }
    ],
    voix: [`« Trois jours au col. Tout le monde. Même ceux qu'on connaît. »`, `Un guetteur, sans lever les yeux : « Vous avez mangé ? Alors vous travaillez. »`,
      `« Celle-là, avec ses manches… *Mi di sa, mi di rien.* » (Je dis ça, je ne dis rien.)`],
    traces: `Une liste de noms au relais, avec des croix ; ce que les Familles disent de vous aux autres îlets.` }),

  A({ cle: "l-ilet-ou-tout-va-bien", numero: 4, titre: "L'îlet où tout va bien", taille: "grande-affaire", famille: "cirques",
    regions: ["mafate"], factions: ["familles-des-ilets"],
    naissance: { phases: ["silence", "apres"] },
    apprendre: `Par recoupement. Personne ne le dit en entier : des gens y sont allés et ne sont pas revenus parce qu'ils y sont bien ; d'autres disent qu'on n'en repart pas. Le livre de l'île le range parmi les mystères qu'on ne numérote pas.`,
    demande: `D'y monter (deux jours de sentier depuis le col), d'y rester assez pour comprendre ce qui fait tenir l'endroit, et de décider si on en parle.`,
    malTourner: `Ce qui le fait tenir peut être très simple, ou ne pas se dire. En parler amène du monde, et le monde le défait.`,
    change: `Un abri modèle reste secret, devient un marché, ou devient une cible.`,
    garde: `Une règle de vie qu'on peut reprendre chez soi, et la question de savoir si on a bien fait de la dire.`,
    verites: {
      vraie: { poids: 2, texte: `Une source qui ne tarit jamais, des terrasses, des panneaux, et un accord strict : on y entre pour toujours ou pas du tout. Tout le monde y est bien, et personne n'a envie de partir.` },
      exageree: { poids: 2, texte: `L'îlet tient par une règle dure : qui ne travaille pas est renvoyé, les vieux comme les autres. On y est bien tant qu'on est utile.` },
      piege: { poids: 1, texte: `L'îlet tient parce qu'il ne laisse repartir personne : ceux qui montent sont désarmés, gardés et mis au travail. On n'en repart pas, en effet.` }
    },
    pente: { tousLes: 14, crans: [`On en parle un peu plus au marché.`, `Une famille monte s'y installer ; d'autres suivent.`, `Trop de monde arrive : l'îlet ferme son sentier, ou s'ouvre et se défait.`] },
    issues: [
      { cle: "garder-le-secret", titre: "Garder le secret", texte: `On en revient avec une règle qu'on reprend chez soi, et l'on n'en dit rien.`, effets: { entente: 1 } },
      { cle: "le-dire", titre: "Le dire", texte: `Le Ladi Lafé s'en empare ; l'îlet devient une destination, et les Familles savent qui a parlé.`, effets: { rumeur: true, reputation: { "familles-des-ilets": -1 } } },
      { cle: "y-rester", titre: "Y rester", texte: `Un membre du groupe choisit d'y vivre, et ne redescend pas.`, effets: { depart: true } },
      { cle: "repartir-sans-permission", titre: "Repartir sans permission", texte: `De nuit, par la crête : on sait désormais ce qu'il y a là-haut, et l'îlet sait qu'on le sait.`, effets: { rumeur: true } }
    ],
    voix: [`« À l'îlet, là-haut, ils ont tout : l'eau, le courant, la paix. Ma cousine y est. Elle ne redescend pas. »`, `« On n'en revient pas, de cet îlet. Prends ça comme tu veux. »`,
      `Un sifflet qui ne répond pas : l'îlet d'en face ne parle à personne.`],
    traces: `Un sentier mieux entretenu que les autres, qui finit sur une barrière ; dans les cahiers, des noms qui ne donnent plus de nouvelles.` }),

  // ---------------- Le volcan
  A({ cle: "le-tunnel-aux-vivres", numero: 5, titre: "Le tunnel aux vivres", taille: "grande-affaire", famille: "volcan",
    regions: ["sud-sauvage"], sites: ["tunnel-du-grand-brule"], factions: ["barques-du-sud", "pelerins-de-la-lave"],
    naissance: { phases: PLUS_TARD },
    apprendre: `C'est la rumeur numéro six du livre de l'île. Une Barque du Sud jure l'avoir vu ; un Pèlerin dit que c'est un tombeau.`,
    demande: `De marcher sur la lave refroidie de la route des Laves, de trouver la bonne bouche parmi dix, de la lumière pour plusieurs quarts sous terre, et de savoir étayer (le savoir « Étaiement et galeries » évite un éboulement).`,
    malTourner: `Elle est vraie une fois sur deux. Fausse : un tunnel vide et frais, bon à aménager. Vraie : quelqu'un y vit encore et garde ses vivres, ou il y est mort, et l'on décide quoi faire de ce qu'il laisse.`,
    change: `Un refuge sous la roche existe pour la prochaine éruption, ou un piège est connu de tous.`,
    garde: `De quoi aménager un tunnel de lave (le plan), et l'emplacement, à donner ou à taire.`,
    verites: {
      vraie: { poids: 1, texte: `Un ancien guide y vit seul depuis le jour zéro, avec des vivres pour des mois, et ne veut voir personne ; ou il y est mort, et ses vivres sont là.` },
      fausse: { poids: 1, texte: `Un tunnel vide et frais, sans un sac : quelqu'un a inventé, ou s'est trompé de bouche.` }
    },
    pente: { tousLes: 10, crans: [`D'autres cherchent la bouche ; on voit leurs traces sur la lave.`, `Quelqu'un a trouvé : les vivres partent, sac par sac.`, `Le tunnel est vide, ou gardé par ceux qui l'ont pris.`] },
    issues: [
      { cle: "les-vivres", titre: "Les vivres", texte: `On trouve la réserve, et personne pour la garder.`, effets: { stocks: { nourriture: 8, eau: 4 }, plan: "tunnel-de-lave-amenage" } },
      { cle: "partager", titre: "Partager avec l'habitant", texte: `Il est vivant. On partage, on l'écoute ; il montre ses galeries, et peut-être vient avec le groupe.`, effets: { acte: "partager", plan: "tunnel-de-lave-amenage" } },
      { cle: "chasser", titre: "Le chasser", texte: `Il est vivant, et seul. On prend ses vivres et l'on garde sa bouche.`, effets: { acte: "attaquer", stocks: { nourriture: 8, eau: 4 }, rumeur: true } },
      { cle: "vide", titre: "Le tunnel vide", texte: `Rien que la roche fraîche : un abri à aménager, que personne ne connaît.`, effets: { plan: "tunnel-de-lave-amenage" } }
    ],
    voix: [`« Un tunnel sous la coulée, plein de sacs de riz. Je l'ai vu, je te dis. Enfin, mon beau-frère l'a vu. »`, `Un Pèlerin, doucement : « Ce trou-là, c'est un tombeau. Laissez-le à la lave. »`,
      `Le livre de l'île, rumeur six : « Personne qui l'ait vu n'en est revenu pour le dire, ce qui peut vouloir dire deux choses. »`],
    traces: `Une bouche marquée d'un cairn, ou bouchée de pierres ; un nom de plus sur la liste de ceux qui sont allés voir.` }),

  A({ cle: "les-aiguilles-de-bourg-murat", numero: 6, titre: "Les aiguilles de Bourg-Murat", taille: "affaire", famille: "volcan",
    regions: ["le-tampon"], factions: ["cooperative-des-plaines", "pelerins-de-la-lave"], front: "fournaise",
    naissance: { phases: PLUS_TARD, cran: 1 },
    apprendre: `Un fermier de la Coopérative le dit au troc du samedi : à l'observatoire de Bourg-Murat, où plus personne ne vient, « les machines des géologues grattent le papier jour et nuit ».`,
    demande: `Quelqu'un qui sache lire les tracés, ou qui trouve le cahier où c'est expliqué ; puis porter la nouvelle à Sainte-Rose avant la fissure : trois jours par la Plaine des Palmistes, ou deux par la route des Laves, qui sera peut-être coupée.`,
    malTourner: `Les Pèlerins ne veulent pas l'entendre : l'épreuve, disent-ils, ne se lit pas sur une aiguille. La nouvelle arrive déformée et vide un village pour rien, ou elle arrive trop tard.`,
    change: `Le front de la Fournaise recule d'un cran si l'Est est prévenu à temps.`,
    garde: `Savoir lire le volcan, que presque personne n'a : le groupe sait désormais une éruption quelques jours avant (le MJ le lui dit).`,
    verites: {
      vraie: { poids: 3, texte: `Les tracés montrent un gonflement qui s'accélère : une éruption dans les semaines qui viennent.` },
      exageree: { poids: 1, texte: `Les aiguilles s'agitent pour une crise sismique qui retombera ; prévenir vide l'Est pour rien.` }
    },
    pente: { tousLes: 7, crans: [`Le papier des enregistreurs s'épuise ; personne ne le change.`, `Les secousses se sentent jusqu'à la Plaine des Cafres.`, `La fissure s'ouvre : le front de la Fournaise avance d'un cran.`] },
    issues: [
      { cle: "a-temps", titre: "L'Est prévenu à temps", texte: `La nouvelle arrive, et elle est crue : les villages bas se vident avant la coulée.`, effets: { front: -1, reputation: { "pelerins-de-la-lave": 1 }, renom: 1 } },
      { cle: "pour-rien", titre: "Un village vidé pour rien", texte: `La nouvelle était exagérée : des familles ont marché sous la pluie pour rien, et s'en souviennent.`, effets: { rumeur: true, renom: -1 } },
      { cle: "trop-tard", titre: "Trop tard", texte: `On arrive avec la coulée.`, effets: { front: 1 } },
      { cle: "pas-entendus", titre: "Pas entendus", texte: `Les Pèlerins écoutent poliment et ne bougent pas ; d'autres, dans l'Est, partent quand même.`, effets: { reputation: { "pelerins-de-la-lave": -1 } } }
    ],
    voix: [`« Les machines des géologues, à Bourg-Murat ? Elles grattent, elles grattent. Personne ne sait lire ça. »`, `Une fermière qui n'a jamais vu d'éruption de près : « Le volcan, c'est pas une aiguille qui va te le dire. C'est les oiseaux. »`,
      `Un rouleau de papier quadrillé trouvé dans une voiture, avec des dates entourées au stylo rouge.`],
    traces: `Un rouleau couvert de traits serrés ; une route des Laves barrée, ou une église vide sur une coulée neuve.` }),

  // ---------------- Le littoral et les routes
  A({ cle: "les-noyes-de-la-passe", numero: 7, titre: "Les noyés de la passe", taille: "affaire", famille: "littoral",
    regions: ["saint-leu"], factions: ["barques-du-sud"],
    naissance: { mois: [5, 6, 7, 8, 9, 10], phases: PLUS_TARD },
    apprendre: `Après une houle australe, les Barques ne veulent plus mouiller devant Saint-Leu : la mer a rendu ses noyés, sur la plage et dans la passe.`,
    demande: `De nettoyer une plage à marée basse, de jour, en silence (un quart dehors), et de décider quoi faire des corps.`,
    malTourner: `La morsure d'un noyé s'infecte toujours. Brûler les corps fait une fumée que toute la côte voit. La mer en rend d'autres à la houle suivante.`,
    change: `Une marine redevient un port sûr pour quelques semaines.`,
    garde: `Un passage par la mer avec les Barques, qui vaut la route des Laves.`,
    verites: {
      vraie: { poids: 3, texte: `Une dizaine de noyés sur la plage et dans la passe, lents, lourds d'eau.` },
      exageree: { poids: 1, texte: `On a dit cinquante ; il y en a quatre, mais une barque s'est échouée au milieu d'eux.` }
    },
    pente: { tousLes: 3, crans: [`Les Barques mouillent plus au sud, et la pêche baisse.`, `Les noyés remontent la ravine vers le bourg.`, `La houle suivante en rend d'autres.`] },
    issues: [
      { cle: "enterres", titre: "La plage nettoyée, les corps enterrés", texte: `Un jour de plus à creuser sous les filaos, en silence ; les Barques s'en souviennent.`, effets: { reputation: { "barques-du-sud": 2 } } },
      { cle: "brules", titre: "Les corps brûlés", texte: `Plus vite ; mais toute la côte voit la fumée.`, effets: { reputation: { "barques-du-sud": 2 }, visibilite: 2 } },
      { cle: "laisser-la-mer", titre: "Laisser la mer faire", texte: `On attend que la houle les reprenne. Les Barques passent au large de Saint-Leu, et ne s'arrêtent plus.`, effets: { reputation: { "barques-du-sud": -1 } } }
    ],
    voix: [`Le patron Grondin, qui ne discute pas : « Pas devant Saint-Leu. Pas tant que la mer rend. »`, `« Marée basse, plein jour, pas un mot. Ils entendent même sous l'eau. »`,
      `Le livre de l'île, rumeur deux : « La mer les rend : les noyés reviennent avec la houle. »`],
    traces: `Des tombes au haut de la plage, sous les filaos, ou une tache noire de feu sur le sable.` }),

  A({ cle: "le-vieux-chemin-pave", numero: 8, titre: "Le vieux chemin pavé", taille: "affaire", famille: "littoral",
    regions: ["route-du-littoral"], sites: ["lazaret-de-la-grande-chaloupe"], factions: ["garnison-du-quai", "dispensaire-du-sud"], front: "garnison",
    naissance: { phases: PLUS_TARD, cran: 1 },
    apprendre: `Une soignante veut rejoindre le Sud sans passer par le contrôle de la Garnison où, dit-elle, « celui qui se dit médecin ne repart pas ».`,
    demande: `De la conduire par le vieux chemin pavé, au-dessus de la falaise, de nuit ou par temps couvert (deux quarts de marche), en passant devant le lazaret.`,
    malTourner: `La livrer à la Garnison rapporte du carburant, et fait rougir. La Garnison a peut-être raison de dire qu'elle sauverait plus de monde au Port. Le chemin est raide, glissant, et le lazaret n'est pas vide.`,
    change: `Le Dispensaire gagne une soignante, ou la Garnison une réquisitionnée.`,
    garde: `La connaissance du chemin (on passe la route du Littoral sans le contrôle), et une dette de l'un des deux camps.`,
    verites: {
      vraie: { poids: 3, texte: `Elle est infirmière, et la Garnison réquisitionne bien les soignants.` },
      exageree: { poids: 1, texte: `Elle est aide-soignante ; la Garnison l'aurait gardée, logée, nourrie, et fait travailler, sans plus.` }
    },
    pente: { tousLes: 2, crans: [`Elle cherche quelqu'un d'autre pour la conduire.`, `Elle tente le chemin seule.`, `La Garnison la trouve sur la route.`] },
    issues: [
      { cle: "au-sud", titre: "Arrivée au Sud", texte: `Elle arrive au Dispensaire ; le groupe connaît le chemin.`, effets: { acte: "aider", reputation: { "dispensaire-du-sud": 2, "garnison-du-quai": -1 }, voie: "ouverte" } },
      { cle: "livree", titre: "Livrée à la Garnison", texte: `On la conduit au poste de la Grande Chaloupe ; on repart avec du carburant.`, effets: { acte: "trahir", reputation: { "garnison-du-quai": 2, "dispensaire-du-sud": -2 }, stocks: { carburant: 4 } } },
      { cle: "refus", titre: "Refuser de l'emmener", texte: `Elle part seule. On apprendra la suite par le Ladi Lafé, ou jamais.`, effets: {} }
    ],
    voix: [`« Celui qui se dit médecin, au contrôle, ne repart pas. On le loge, on le nourrit, on le garde. »`, `Une femme au marché, à voix basse : « Il y a le chemin des anciens, au-dessus de la falaise. Les pavés sont encore là. »`,
      `La radio de la Garnison : « Tout personnel de santé est prié de se présenter au poste de la Grande Chaloupe. »`],
    traces: `Des pavés remis en place sur le chemin, une corde nouée à un passage ; au Dispensaire, une soignante de plus, ou un poste vide.` }),

  A({ cle: "le-viaduc", numero: 9, titre: "Le viaduc", taille: "grande-affaire", famille: "littoral",
    regions: ["saint-paul", "saint-leu"], factions: ["ferrailleurs"],
    naissance: { phases: ["silence", "apres"] },
    apprendre: `Les Ferrailleurs offrent une part à qui les aidera à « ouvrir la route d'en haut » : la route des Tamarins, bouchée d'épaves sur ses viaducs.`,
    demande: `De dégager une voie entre les épaves d'un viaduc, voiture après voiture (des jours de chantier, à plusieurs de préférence) : siphonner, pousser dans le vide (un grand fracas à chaque fois), ou laisser en chicane.`,
    malTourner: `Chaque voiture est une boîte à surprise : un Livide resté attaché à sa ceinture, des gens qui ne sont jamais sortis. Le bruit amène la horde. Une route ouverte sert aussi aux Sans-Lune et aux convois de la Garnison.`,
    change: `L'Ouest et le Sud se rejoignent en charrette ou à vélo en une journée : une vraie modification de la carte (le MJ ouvre la route).`,
    garde: `Des pièces, un droit de passage chez les Ferrailleurs, et la responsabilité de ce qui passera par là.`,
    verites: {
      vraie: { poids: 3, texte: `Trois viaducs bouchés ; le plus long demande une semaine à six.` },
      piege: { poids: 1, texte: `Les Ferrailleurs veulent surtout que le fracas se fasse loin de leur casse : la horde qu'il attire, c'est le groupe qui l'aura sur le dos.` }
    },
    pente: { tousLes: 14, crans: [`Les Ferrailleurs commencent seuls, lentement.`, `Une horde s'installe sous le viaduc, attirée par leur bruit.`, `Ils abandonnent ; la route reste fermée.`] },
    issues: [
      { cle: "route-ouverte", titre: "La route ouverte", texte: `Les épaves sont au fond de la ravine ; on passe en charrette, en camion.`, effets: { voie: "ouverte", reputation: { ferrailleurs: 2 }, stocks: { pieces: 4, carburant: 2 } } },
      { cle: "en-chicane", titre: "En chicane", texte: `Une voie étroite, gardée : on passe à pied et à vélo, pas les convois.`, effets: { voie: "ouverte", reputation: { ferrailleurs: 1 } } },
      { cle: "la-horde", titre: "La horde", texte: `Le fracas amène une horde qui reste sous le viaduc ; le chantier s'arrête.`, effets: { horde: true } }
    ],
    voix: [`Gros Mani : « Une part pour chaque bras. Et la route, après, elle est à tout le monde. Enfin, à nous d'abord. »`, `« Sur le viaduc, il y a encore des gens dans les voitures. Faut pas regarder dedans. »`,
      `Une affiche à la casse de la Rivière des Galets : « ON CHERCHE DES BRAS, ROUTE D'EN HAUT ».`],
    traces: `Un trou dans le parapet et des carcasses au fond de la ravine ; des traces de vélo, puis de charrette, puis de camion.` }),

  // ---------------- Les fêtes
  A({ cle: "une-seule-lampe", numero: 10, titre: "Une seule lampe", taille: "affaire", famille: "fetes",
    naissance: { fete: "dipavali" },
    apprendre: `Une famille malbare du camp, ou des voisins, dit qu'il lui faudrait de l'huile et une mèche pour une lampe, une seule.`,
    demande: `De l'huile (à trouver, à presser, à troquer : une part au cours) et une mèche ; puis de décider, tous ensemble, si on l'allume dehors.`,
    malTourner: `Quelqu'un au camp grince que « *zot i fé servis* » (ils font leur cérémonie, sous-entendu : leur sorcellerie). Chaque flamme attire. Une lampe allumée en cachette ne réunit personne.`,
    change: `Le moral de tout l'abri, et le regard des uns sur les autres : celui qui grinçait vient voir la lampe.`,
    garde: `Rien qui se porte. C'est l'affaire qui dit ce que les fêtes font ici.`,
    verites: { vraie: { poids: 1, texte: `Il n'y a rien à découvrir : une famille veut une lampe.` } },
    pente: { tousLes: 3, crans: [`La famille cherche de l'huile seule.`, `Le jour passe ; on allume une bougie à la place, sans rien dire.`] },
    issues: [
      { cle: "allumee", titre: "La lampe allumée dehors", texte: `Le groupe fête Dipavali : tout le camp vient voir, même celui qui grinçait.`, effets: { fete: "dipavali", prejuge: true } },
      { cle: "cachee", titre: "La lampe cachée", texte: `Allumée derrière une tôle : la famille prie seule, le reste du camp dort.`, effets: {} },
      { cle: "pas-de-lampe", titre: "Pas de lampe", texte: `Le groupe refuse : trop de risques. La famille ne dit rien, et s'en souvient.`, effets: { entente: -1 } }
    ],
    voix: [`« Une lampe. Une seule. Un peu d'huile, une mèche. On la met derrière la tôle, personne ne la verra. »`, `« *Zot i fé servis*, là-bas. » Celui qui le dit n'est jamais allé voir.`,
      `Un enfant du camp demande pourquoi on allume une lampe quand il fait noir partout.`],
    traces: `Une petite lampe de terre noircie, rangée avec soin ; quelqu'un qui ne dit plus « servis » de la même façon.` }),

  A({ cle: "le-kabar-du-20-desanm", numero: 11, titre: "Le kabar du 20 désanm", taille: "affaire", famille: "fetes",
    naissance: { mois: [12], fete: "liberte" },
    apprendre: `Dès le début de décembre, quelqu'un demande qui sait encore tendre une peau sur un rouleur.`,
    demande: `De fabriquer ou de retrouver les instruments (une peau, un fût, des graines pour le kayamb), de trouver une voix, et un endroit d'où le tambour ne trahira pas l'abri.`,
    malTourner: `Le tambour s'entend de très loin. Le jouer sous terre ou pendant un orage change tout. Le taire blesse ceux qui savent ce qu'on fête.`,
    change: `Le moral, l'autorité de celui qui a tranché, et ce que les voisins savent de l'emplacement de l'abri.`,
    garde: `Un instrument, et le premier maloya joué par des survivants.`,
    verites: { vraie: { poids: 1, texte: `Il n'y a rien à découvrir : il y a un choix.` } },
    pente: { tousLes: 7, crans: [`Le rouleur n'a toujours pas de peau.`, `Le 20 décembre passe en silence ; quelqu'un fredonne quand même.`] },
    issues: [
      { cle: "dehors", titre: "Le kabar dehors", texte: `Le groupe fête le 20 décembre, tambour compris.`, effets: { fete: "liberte" } },
      { cle: "a-couvert", titre: "Sous terre, ou sous l'orage", texte: `Le kabar se tient, et le tambour se perd dans la roche ou le tonnerre (au MJ de dire ce qui porte encore).`, effets: { fete: "liberte" } },
      { cle: "se-taire", titre: "Se taire", texte: `Le chef décide de ne pas jouer. Ceux qui savent ce qu'on fête le prennent mal.`, effets: { entente: -1 } }
    ],
    voix: [`« Qui sait encore tendre une peau sur un rouleur ? Mon père savait. »`, `« Le 20 *désanm*, on joue. Même si c'est la fin du monde. Surtout si c'est la fin du monde. »`,
      `« Un tambour, ça s'entend à trois ravines. Tu veux qu'ils viennent danser, les Livides ? »`],
    traces: `Un rouleur pendu au mur, sa peau tendue ; une date gravée sur le fût.` }),

  A({ cle: "le-voeu", numero: 12, titre: "Le vœu", taille: "affaire", famille: "fetes",
    regions: ["est"], naissance: { fete: "cavadee" },
    apprendre: `Un survivant, du groupe ou d'ailleurs, veut tenir un vœu : retrouver quelqu'un, atteindre un lieu.`,
    demande: `Dix jours de carême (le vœu du Cavadee), puis une marche à découvert jusqu'à un temple de l'Est, en groupe si l'on veut l'accompagner.`,
    malTourner: `Celui qu'on cherche est mort, ou Livide, ou ne veut pas être retrouvé. Rompre le carême ne punit de rien, mais le vœu ne soutient plus.`,
    change: `Un moral qui tient tant que le vœu est tenu, et un lieu de culte rouvert.`,
    garde: `La réponse, quelle qu'elle soit. C'est une affaire qui peut finir par un deuil.`,
    verites: {
      vraie: { poids: 2, texte: `Celui qu'on cherche est vivant, quelque part sur la route du temple.` },
      perimee: { poids: 2, texte: `Il était vivant il y a un mois ; il est parti depuis, ou il est mort.` },
      fausse: { poids: 1, texte: `Il est mort le jour zéro ; on ne le saura qu'en arrivant.` }
    },
    pente: { tousLes: 10, crans: [`Le carême fatigue ; le vœu tient.`, `La saison passe, la route se ferme.`, `Le vœu reste en suspens, et pèse.`] },
    issues: [
      { cle: "tenu", titre: "Le vœu tenu", texte: `On arrive au temple ; on retrouve, ou l'on sait.`, effets: { fete: "cavadee", voeu: "tenu" } },
      { cle: "rompu", titre: "Le vœu rompu", texte: `Le carême cède, ou la route. Personne ne reproche rien ; le vœu ne soutient plus.`, effets: { voeu: "rompu" } },
      { cle: "le-deuil", titre: "La réponse, et le deuil", texte: `Ce qu'on trouve est une tombe, ou un Livide qu'on reconnaît. Le vœu est tenu ; le reste se porte.`, effets: { voeu: "tenu", moral: -1 } }
    ],
    voix: [`« J'ai promis. Dix jours sans viande, puis le temple. Si elle est vivante, elle y sera. »`, `« Un vœu, ça ne se rompt pas pour une horde. Ça se rompt pour rien, ou pas du tout. »`,
      `Sous la pierre d'un oratoire : un prénom, une date, et « je viens ».`],
    traces: `Un temple où brûle de nouveau une lampe ; une tombe, peut-être, au bout d'une route.` }),

  A({ cle: "le-jour-qu-il-est", numero: 13, titre: "Le jour qu'il est", taille: "affaire", famille: "fetes",
    regions: ["mafate", "cilaos", "salazie"], factions: ["familles-des-ilets"],
    naissance: { mois: [12], declencheurs: ["date-perdue"] },
    apprendre: `En arrivant quelque part où l'on se dispute sur la date : les uns veulent fêter Noël demain, les autres dans quatre jours.`,
    demande: `De donner le jour qu'on croit, calendrier à l'appui si on en a un, ou de lire la lune et les signes du paysage avec eux.`,
    malTourner: `On peut se tromper de bonne foi, ou mentir. Un faux jour se propage d'îlet en îlet par les sifflets, et revient un mois plus tard dans la bouche d'un inconnu.`,
    change: `Une communauté retrouve le compte des jours, ou le perd pour de bon.`,
    garde: `Une réputation de quelqu'un qui sait, ou qui a menti sur la seule chose que personne ne peut vérifier.`,
    verites: {
      vraie: { poids: 1, texte: `Les uns ont raison : ils ont gardé un calendrier coché chaque soir.` },
      fausse: { poids: 1, texte: `Personne n'a raison : les deux comptes ont dérivé, de deux jours chacun, dans les deux sens.` }
    },
    pente: { tousLes: 4, crans: [`La dispute s'aigrit.`, `On fête Noël deux fois, ou pas du tout.`] },
    issues: [
      { cle: "juste", titre: "Le bon jour, de bonne foi", texte: `On retrouve la date ensemble ; l'îlet s'en souviendra.`, effets: { reputation: { "familles-des-ilets": 1 }, renom: 1 } },
      { cle: "trompe", titre: "Un faux jour, de bonne foi", texte: `On s'est trompé, sans le savoir ; le faux jour court.`, effets: { rumeur: true } },
      { cle: "mensonge", titre: "Un faux jour, exprès", texte: `On a menti, pour une raison ou pour rien ; le Ladi Lafé finira par le dire.`, effets: { acte: "mentir", rumeur: true } }
    ],
    voix: [`« Noël, c'est demain. J'ai coché chaque soir. » « Tu as coché deux fois le soir de la pluie, oui. »`, `Trois coups de sifflet, puis deux : l'îlet d'à côté donne sa date. Personne ne sait d'où il la tient.`,
      `« Demande à la lune. Elle, elle ne ment pas. Elle ne dit pas tout, c'est tout. »`],
    traces: `Un calendrier coché à la porte de l'école de l'îlet ; une date fausse qui court encore.` }),

  // ---------------- La religion et les préjugés
  A({ cle: "le-service-dans-la-nuit", numero: 14, titre: "Le service dans la nuit", taille: "affaire", famille: "religion",
    regions: ["est", "sud-sauvage", "saint-pierre"],
    naissance: { phases: PLUS_TARD },
    apprendre: `Au camp, quelqu'un dit qu'on fait « de la sorcellerie » chez les voisins, la nuit, avec du feu.`,
    demande: `D'aller voir, ou de laisser dire.`,
    malTourner: `C'est toujours autre chose que ce qu'on a dit. Le danger vient de ceux qui y vont armés, et du feu, qui, lui, se voit vraiment de loin.`,
    change: `Deux abris se parlent, ou se ferment. Celui qui a colporté rougit.`,
    garde: `Un voisinage. Le jeu ne donne jamais raison à la rumeur.`,
    verites: { fausse: { poids: 1, texte: `Une veillée pour un mort, une prière pour un malade, ou un repas : jamais ce qu'on a dit. Le MJ choisit ; la rumeur est toujours fausse.` } },
    pente: { tousLes: 3, crans: [`La rumeur grossit : on parle de poules noires.`, `Des gens du camp veulent y aller « voir », armés.`, `Le voisinage se ferme : plus de troc, plus de passage.`] },
    issues: [
      { cle: "aller-voir", titre: "Aller voir, les mains vides", texte: `On est reçu ; on partage le repas ou la veillée, et l'on revient le dire.`, effets: { rumeur: "dementie", prejuge: true } },
      { cle: "y-aller-armes", titre: "Y aller armés", texte: `Une porte enfoncée, un feu renversé, des gens qui n'avaient rien fait.`, effets: { acte: "attaquer", rumeur: true } },
      { cle: "laisser-dire", titre: "Laisser dire", texte: `La rumeur reste, et le chemin entre les deux abris se referme.`, effets: { rumeur: true } }
    ],
    voix: [`« Chez les voisins, la nuit, ils font du feu et ils chantent des choses. *Zot i fé servis.* Moi, je dis rien. »`, `« J'ai vu une poule noire. » Personne d'autre ne l'a vue.`,
      `Une vieille du camp : « *Kosa zot i rakont ? Na in malad lasou.* » (Qu'est-ce que vous racontez ? Il y a un malade, là-bas.)`],
    traces: `Un chemin entre deux abris qui se rouvre, ou une barrière de plus ; le nom du colporteur, que tout le monde finit par savoir.` }),

  A({ cle: "les-derniers-arrives", numero: 15, titre: "Les derniers arrivés", taille: "affaire", famille: "religion",
    regions: ["saint-denis"], sites: ["barre-du-chaudron"], factions: ["sans-lune"],
    naissance: { phases: ["panique", "effondrement", "silence"] },
    apprendre: `C'est la rumeur numéro quatre du livre de l'île : on accuse une famille comorienne du Chaudron d'avoir vidé l'hypermarché du quartier.`,
    demande: `De recouper : des traces de camion sur le parking, des marques à la bombe, un témoin sur un toit du Chaudron.`,
    malTourner: `Pendant qu'on vérifie, d'autres ont déjà décidé. Répéter la rumeur est le plus facile.`,
    change: `Une famille est chassée ou gardée ; les vrais auteurs sont connus, ou non.`,
    garde: `Un pas vers le bleu ou vers le rouge, et la leçon que le Ladi Lafé court plus vite que les faits.`,
    verites: { fausse: { poids: 1, texte: `Ceux qui ont vidé l'hypermarché étaient des Sans-Lune, en camion, le visage noirci de suie ; on retrouve le camion plus loin. La famille n'y est pour rien.` } },
    pente: { tousLes: 2, crans: [`On parle d'aller « leur demander ».`, `La famille est chassée de sa cage d'escalier.`, `Elle a disparu ; personne ne sait où.`] },
    issues: [
      { cle: "la-preuve", titre: "La preuve apportée", texte: `Les traces et le témoin disent qui c'était, devant tout le monde.`, effets: { acte: "aider", rumeur: "dementie", prejuge: true } },
      { cle: "accueillie", titre: "La famille accueillie", texte: `Chassée de son immeuble, elle trouve une place à l'abri.`, effets: { acte: "accueillir", recrue: true } },
      { cle: "chassee", titre: "La famille chassée", texte: `Personne n'a vérifié à temps, ou le groupe a aidé à la chasser.`, effets: { acte: "exclure" } },
      { cle: "repetee", titre: "La rumeur répétée", texte: `Le groupe la répète à son tour : c'est le plus facile.`, effets: { acte: "colporter", rumeur: true } }
    ],
    voix: [`« C'est les Comoriens du Chaudron. Tout le monde le sait. » Celui qui le dit n'a rien vu.`, `Un garçon, depuis un toit : « Moi, j'ai vu un camion. Blanc. Ils avaient de la suie sur la figure. »`,
      `Le livre de l'île, rumeur quatre : « Faux. Mais la rumeur court plus vite qu'eux. »`],
    traces: `Une porte de cage d'escalier repeinte, ou murée ; un camion blanc retrouvé vide sur la RN2.` }),

  A({ cle: "rendre-a-la-lave", numero: 16, titre: "Rendre à la lave", taille: "grande-affaire", famille: "religion",
    regions: ["est"], sites: ["eglise-notre-dame-des-laves"], factions: ["pelerins-de-la-lave", "dispensaire-du-sud"], front: "remede",
    naissance: { phases: ["silence", "apres"] },
    apprendre: `On dit que les Pèlerins nourrissent et soignent sans rien demander. On dit aussi, plus bas, qu'ils « rendent les mordus à la lave ». C'est la rumeur numéro huit du livre de l'île.`,
    demande: `D'y vivre un moment pour savoir (quelques jours à Sainte-Rose, à travailler, à prier ou non : personne n'y est forcé), puis de choisir : se taire, parler, ou faire sortir quelqu'un.`,
    malTourner: `Les deux choses sont vraies le même jour. Frère Expédit laisse prier tout le monde, et croit ce qu'il croit : les mordus qui viennent à eux sont veillés, puis accompagnés, à la fin, vers les coulées, et l'on ne les revoit pas. Certains y vont en paix ; aux autres, on ne demande pas. L'ironie y est plus dangereuse qu'une arme.`,
    change: `Le front du remède, si le Dispensaire l'apprend : la docteure cherche des infectés vivants. L'accueil des Pèlerins, pour tous ceux qui viennent après.`,
    garde: `Un lieu où changer de religion, où rien n'est imposé, et un doute.`,
    verites: {
      vraie: { poids: 3, texte: `Les Pèlerins soignent, nourrissent, et accompagnent les mordus vers les coulées avant qu'ils se relèvent. Rien ne se voit : on le comprend à ce qui manque le matin.` },
      exageree: { poids: 1, texte: `Ils n'accompagnent que ceux qui le demandent ; la rumeur a fait le reste.` }
    },
    pente: { tousLes: 10, crans: [`Un mordu de plus arrive à Sainte-Rose, avec les siens.`, `Le Dispensaire entend la rumeur : le front du remède peut avancer.`, `Les Pèlerins ferment leur porte aux curieux.`] },
    issues: [
      { cle: "se-taire", titre: "Se taire", texte: `On sait, et l'on n'en dit rien ; les Pèlerins continuent de nourrir qui vient.`, effets: { reputation: { "pelerins-de-la-lave": 1 } } },
      { cle: "le-dire-au-dispensaire", titre: "Le dire au Dispensaire", texte: `La docteure veut comprendre ; elle enverra quelqu'un à Sainte-Rose.`, effets: { front: 1, reputation: { "dispensaire-du-sud": 1, "pelerins-de-la-lave": -2 } } },
      { cle: "faire-sortir", titre: "Faire sortir quelqu'un", texte: `Un mordu qui ne veut pas aller aux coulées demande à partir. On l'emmène, et l'on porte avec lui ce qui vient ensuite.`, effets: { acte: "aider", reputation: { "pelerins-de-la-lave": -1 } } },
      { cle: "le-dire-partout", titre: "Le dire partout", texte: `Le Ladi Lafé s'en empare, et les gens cessent de venir à Sainte-Rose, malades compris.`, effets: { rumeur: true, reputation: { "pelerins-de-la-lave": -2 } } }
    ],
    voix: [`« Les Pèlerins ? Ils t'ouvrent, ils te nourrissent, ils te demandent rien. Rien du tout. »`, `Plus bas : « Et les mordus, tu sais ce qu'ils en font ? Ils les rendent à la lave. »`,
      `Frère Expédit, doucement : « Ici, personne ne se relève. Nous y veillons. »`],
    traces: `Une natte roulée au bout d'une rangée ; un sentier usé qui monte vers les coulées, que personne ne prend de jour.`,
    ton: `Rien n'est montré : ni la coulée, ni ce qui s'y passe. Le malaise vient de ce qu'on comprend (une natte vide le matin, un chant qui s'arrête), jamais de ce qu'on voit. Aucun Pèlerin n'est un monstre ni un saint ; la foi n'a aucun effet, ni bon ni mauvais. Aucun enfant n'est en jeu dans cette affaire.` }),

  // ---------------- Les savoirs
  A({ cle: "l-alambic-du-tevelave", numero: 17, titre: "L'alambic du Tévelave", taille: "affaire", famille: "savoirs",
    regions: ["hauts-de-l-ouest"], sites: ["alambic-du-tevelave"], factions: ["ferrailleurs"],
    naissance: { phases: PLUS_TARD },
    apprendre: `Les Ferrailleurs cherchent « quelqu'un qui sache encore cuire le géranium », pour en tirer autre chose que du parfum.`,
    demande: `Du bois de chauffe, une semaine de temps, et l'accord du vieux distillateur, qui n'enseigne qu'en travaillant à côté de lui.`,
    malTourner: `Il meurt avant d'avoir tout montré, et le savoir se perd. La fumée de l'alambic se voit de loin. Les Ferrailleurs vendent ce que vous avez appris au suivant.`,
    change: `L'alcool comme carburant maison existe dans la région.`,
    garde: `Le savoir de l'alambic (« Moteurs de fortune » : l'alcool de canne et ce qui roule avec), de ceux qui valent cher.`,
    verites: {
      vraie: { poids: 3, texte: `Le vieux est vivant, et prêt à montrer à qui travaille.` },
      perimee: { poids: 1, texte: `Le vieux est mort il y a dix jours ; son cahier est dans la case, à moitié brûlé.` }
    },
    pente: { tousLes: 10, crans: [`Le vieux s'affaiblit.`, `Les Ferrailleurs trouvent quelqu'un d'autre.`, `Le vieux meurt ; l'alambic rouille.`] },
    issues: [
      { cle: "appris", titre: "Appris en travaillant", texte: `Une semaine à côté de lui, à la chaleur du foyer ; on repart en sachant.`, effets: { savoir: "moteurs-de-fortune", reputation: { ferrailleurs: 1 } } },
      { cle: "garde-pour-soi", titre: "Gardé pour soi", texte: `On apprend, et l'on n'en dit rien aux Ferrailleurs.`, effets: { savoir: "moteurs-de-fortune", reputation: { ferrailleurs: -1 } } },
      { cle: "perdu", titre: "Le savoir perdu", texte: `Il est mort, le cahier est brûlé : il reste un alambic de cuivre, à démonter.`, effets: { stocks: { pieces: 2 } } }
    ],
    voix: [`« Cuire le géranium. Pas pour le parfum, hein. Pour ce qui brûle. »`, `Le vieux : « Je montre en faisant. Celui qui veut que je raconte, il repart avec rien. »`,
      `Une fumée blanche, un matin, au-dessus du Tévelave : quelqu'un a rallumé l'alambic.`],
    traces: `Un alambic de cuivre qui fume de nouveau, ou qui rouille ; dans un cahier, des temps et des températures écrits d'une main qui tremble.` }),

  A({ cle: "zerbaz", numero: 18, titre: "Zerbaz", taille: "affaire", famille: "savoirs",
    regions: ["plaine-des-palmistes", "hauts-de-l-ouest", "salazie"],
    naissance: { phases: PLUS_TARD },
    apprendre: `Une gramoune donne le nom d'une plante contre la fièvre, et l'étage de la forêt où elle pousse.`,
    demande: `De monter la chercher au bon endroit et à la bonne saison, de la reconnaître, et de la préparer comme elle a dit (une tisane).`,
    malTourner: `Une recette circule fausse : une plante voisine, une dose doublée. La tisane soulage et ne guérit pas tout ; elle ne fait rien contre le Gris.`,
    change: `Un abri sait soigner une fièvre de plus, et reconnaître ce qu'il a.`,
    garde: `Une page de cahier que d'autres voudront copier (le savoir « Zerbaz et tisanes »).`,
    verites: {
      vraie: { poids: 3, texte: `La plante pousse où elle a dit, et soulage les fièvres.` },
      fausse: { poids: 1, texte: `La recette a été recopiée de travers : la plante voisine ne fait rien, ou rend malade.` }
    },
    pente: { tousLes: 14, crans: [`La saison de la plante passe.`, `La gramoune oublie le nom, ou s'en va.`] },
    issues: [
      { cle: "apprise", titre: "La plante trouvée et apprise", texte: `On la reconnaît, on la cueille, on la prépare.`, effets: { savoir: "zerbaz", stocks: { plantes: 3 } } },
      { cle: "la-mauvaise", titre: "La mauvaise plante", texte: `On a cueilli la voisine ; un malade le paie (au MJ de dire comment).`, effets: {} },
      { cle: "la-page-donnee", titre: "La page donnée", texte: `On recopie la page pour un autre abri.`, effets: { acte: "partager", renom: 1 } }
    ],
    voix: [`« Pour la fièvre, il y a une feuille. Pas celle d'en bas : celle d'en haut, sous les tamarins. Et pas trop. »`, `« Ma grand-mère disait : la plante te soigne si tu la cueilles le matin. » Personne ne sait si c'est vrai.`,
      `Une page recopiée, passée de main en main, avec une dose barrée et réécrite.`],
    traces: `Un sachet de feuilles sèches étiqueté à la main ; une page de cahier copiée trois fois.` }),

  A({ cle: "la-petite-centrale-de-langevin", numero: 19, titre: "La petite centrale de Langevin", taille: "grande-affaire", famille: "savoirs",
    regions: ["sud-sauvage"], sites: ["centrale-de-langevin"], factions: ["barques-du-sud"],
    naissance: { mois: SAISON_SECHE, phases: ["silence", "apres"] },
    apprendre: `Par un électricien, ou par un journal trouvé sur un mort : au fond de la ravine, la vieille centrale de Langevin garde de quoi apprendre la pico-hydro.`,
    demande: `D'y descendre à la saison sèche seulement, avec de la corde (le matériel de canyon aide), et de passer ce qui garde le lieu.`,
    malTourner: `Quelqu'un garde l'endroit : un Livide qu'on a connu, peut-être, resté là où il travaillait. La crue remonte vite si l'on se trompe de jour. Ce qu'on trouve n'est pas forcément ce qu'on voulait.`,
    change: `Un abri du Sud a du courant jour et nuit, sans bruit.`,
    garde: `Le plan de la pico-hydro, et la raison de revenir : il reste des pièces.`,
    verites: {
      vraie: { poids: 3, texte: `Les cahiers de l'exploitant sont là, au sec, avec les schémas.` },
      perimee: { poids: 1, texte: `Quelqu'un est passé avant : il reste des pièces, pas les cahiers.` }
    },
    pente: { tousLes: 30, crans: [`La saison des pluies approche : la ravine se ferme.`, `La centrale est pillée par d'autres.`] },
    issues: [
      { cle: "les-cahiers", titre: "Les cahiers", texte: `On remonte avec les schémas et quelques pièces.`, effets: { plan: "pico-hydro", stocks: { pieces: 3 } } },
      { cle: "des-pieces", titre: "Des pièces seulement", texte: `Les cahiers sont partis ; les turbines de rechange sont là.`, effets: { stocks: { pieces: 4 } } },
      { cle: "la-crue", titre: "La crue", texte: `On s'est trompé de jour : la ravine monte, et l'on remonte sans rien.`, effets: {} }
    ],
    voix: [`Un électricien du Sud : « La petite centrale, au fond ? Tout est dedans. Les plans, les turbines de rechange. Si tu descends. »`, `Dans un journal trouvé sur un corps : « Langevin. Saison sèche. Corde. Ne pas y aller seul. »`,
      `« Quand la ravine chante, tu remontes. Tu discutes pas. »`],
    traces: `Une corde à demeure dans la ravine ; plus tard, une lampe qui brille toute la nuit dans un abri du Sud.` }),

  // ---------------- Le sens moral
  A({ cle: "celui-qu-on-a-refuse", numero: 20, titre: "Celui qu'on a refusé", taille: "affaire", famille: "sens-moral",
    naissance: { declencheurs: ["refus-a-la-porte"] },
    apprendre: `Il revient. On l'avait refusé parce qu'il n'y avait plus de place ; il a lu la liste de ce qui manque, à la porte.`,
    demande: `De décider une seconde fois, devant tout le monde (un vote, si l'abri vote), maintenant qu'il apporte ce qui manque.`,
    malTourner: `Prendre ce qu'il apporte et le refuser encore : le groupe rougit, et lui sait ce qu'il y a derrière la porte. L'accueillir alors que le vote disait non : l'autorité du chef baisse.`,
    change: `Un membre de plus, ou quelqu'un, dehors, qui sait ce qu'il y a derrière la porte.`,
    garde: `Un enfant de l'abri a tout vu.`,
    verites: {
      vraie: { poids: 3, texte: `Il apporte vraiment ce qui manque, et ne demande qu'une place.` },
      piege: { poids: 1, texte: `Une bande l'envoie : elle veut savoir ce que l'abri a, et combien il est.` }
    },
    pente: { tousLes: 1, crans: [`Il attend à la porte, un jour.`, `Il repart vers un autre abri, avec ce qu'il sait du vôtre.`] },
    issues: [
      { cle: "accueilli", titre: "Accueilli", texte: `La porte s'ouvre, la deuxième fois.`, effets: { acte: "accueillir", recrue: true } },
      { cle: "refuse-encore", titre: "Refusé encore", texte: `Il n'y a toujours pas de place.`, effets: { acte: "exclure" } },
      { cle: "pris-et-refuse", titre: "Ce qu'il apporte pris, lui refusé", texte: `On garde ce qu'il apporte, et l'on ferme la porte.`, effets: { acte: "trahir" } },
      { cle: "contre-le-vote", titre: "Accueilli contre le vote", texte: `Le chef ouvre quand même.`, effets: { acte: "accueillir", recrue: true, autorite: -1 } }
    ],
    voix: [`« Vous m'avez dit qu'il n'y avait pas de place. J'ai vu la liste. J'ai ce qui vous manque. »`, `Un enfant, tout bas : « C'est le monsieur de l'autre fois. »`,
      `Le Ladi Lafé, plus tard : « Cet abri-là, il prend, et il ferme la porte. » Ou bien : « Cet abri-là, il a ouvert deux fois. »`],
    traces: `Un nom de plus parmi les membres, ou une silhouette qui s'éloigne ; ce que l'enfant en retient (l'enfant témoin, §14).` }),

  A({ cle: "la-liste-du-comptable", numero: 21, titre: "La liste du Comptable", taille: "grande-affaire", famille: "sens-moral",
    regions: ["saint-denis", "sainte-marie"], factions: ["sans-lune", "garnison-du-quai"], front: "comptable",
    naissance: { phases: ["silence", "apres"], cran: 1 },
    apprendre: `Un jeune des Sans-Lune fait savoir, sous la pierre d'un oratoire rouge, qu'il veut partir, et qu'il sait où est le cahier du Comptable.`,
    demande: `De le faire sortir, de voler le cahier, de le recopier, ou de le rendre contre une lune de paix.`,
    malTourner: `C'est un piège une fois sur quatre. Et avoir la liste, c'est savoir ce que doit chaque quartier, et pouvoir le réclamer à sa place.`,
    change: `Le front du Comptable recule, ou change seulement de main.`,
    garde: `La tentation. C'est l'affaire qui montre comment on devient le suivant.`,
    verites: {
      vraie: { poids: 3, texte: `Le garçon veut vraiment partir ; le cahier est dans une boutique murée du centre de Saint-Denis.` },
      piege: { poids: 1, texte: `Le Comptable l'a envoyé : il veut savoir qui, dans le Nord, ose lui prendre quelque chose.` }
    },
    pente: { tousLes: 5, crans: [`Le garçon attend à l'oratoire, de plus en plus inquiet.`, `On le soupçonne ; il ne vient plus.`, `Le tribut monte dans tout le Nord : le front du Comptable avance.`] },
    issues: [
      { cle: "sorti", titre: "Le garçon sorti", texte: `Il quitte la bande, et rejoint le groupe ou part plus loin.`, effets: { acte: "aider", recrue: true, reputation: { "sans-lune": -2 } } },
      { cle: "cahier-detruit", titre: "Le cahier détruit", texte: `Brûlé ou noyé : les dettes du Nord n'ont plus d'écrit.`, effets: { front: -1, reputation: { "sans-lune": -3 } } },
      { cle: "cahier-rendu", titre: "Rendu contre une lune de paix", texte: `Le Comptable reprend son cahier ; le groupe ne paie rien pendant un mois.`, effets: { reputation: { "sans-lune": 1 } } },
      { cle: "la-tentation", titre: "Réclamer à sa place", texte: `On garde la liste, et l'on va réclamer ce que les quartiers doivent.`, effets: { acte: "attaquer", stocks: { nourriture: 6, carburant: 2 }, rumeur: true } }
    ],
    voix: [`Sous la pierre d'un oratoire rouge : « Je veux partir. Je sais où est le cahier. Jeudi, même heure. »`, `« Le Comptable, il oublie rien. Il a tout écrit. Ce que tu dois, ce que ton père devait. »`,
      `Sur une porte de Sainte-Marie, trois traits et un rond à la bombe : ici, on a déjà payé.`],
    traces: `Des portes marquées qu'on repeint, ou de nouvelles marques ; un cahier brûlé, ou recopié, qui circule.` }),

  // ---------------- À plusieurs, et sur toute une campagne
  A({ cle: "le-convoi-du-lait", numero: 22, titre: "Le convoi du lait", taille: "grande-affaire", famille: "plusieurs",
    regions: ["le-tampon", "saint-pierre"], sites: ["ferme-de-la-plaine-des-cafres", "hopital-du-sud"], factions: ["cooperative-des-plaines", "dispensaire-du-sud", "garnison-du-quai"], front: "garnison",
    naissance: { mois: [5, 6, 7, 8, 9, 10], phases: ["silence", "apres"] },
    apprendre: `La Coopérative cherche des gens pour descendre le lait et le fromage au Dispensaire, en charrette à bœufs, par la route des Plaines.`,
    demande: `Au moins deux rôles tenus en même temps : mener les bêtes, lentes et silencieuses, et ouvrir la route devant. Seul, c'est possible, et très long.`,
    malTourner: `Un convoi de la Garnison monte prendre le même lait. Au petit matin, la route des Plaines est pleine de Livides figés par le froid, entre lesquels il faut passer avant le soleil.`,
    change: `L'hôpital tient un mois de plus ; la Coopérative et le Dispensaire deviennent alliés, ou la Garnison se sert.`,
    garde: `Des soins promis au Dispensaire, et un chemin éprouvé entre les Hauts et le Sud.`,
    verites: {
      vraie: { poids: 3, texte: `Le lait est là, la charrette aussi ; le Dispensaire attend.` },
      exageree: { poids: 1, texte: `Le Dispensaire attend surtout les bœufs : il voudrait garder la charrette pour ses navettes.` }
    },
    pente: { tousLes: 3, crans: [`Le lait tourne ; on en fait du fromage.`, `La Garnison apprend qu'il y a du lait.`, `Le convoi de la Garnison monte : le front de l'autorité provisoire avance.`] },
    issues: [
      { cle: "livre", titre: "Le convoi livré", texte: `Le lait arrive à l'hôpital ; la docteure promet des soins à qui l'a descendu.`, effets: { reputation: { "cooperative-des-plaines": 2, "dispensaire-du-sud": 2 }, stocks: { medicaments: 2 } } },
      { cle: "la-garnison-se-sert", titre: "La Garnison se sert", texte: `Le convoi armé arrive le premier.`, effets: { front: 1 } },
      { cle: "partage", titre: "Le lait partagé", texte: `On négocie sur la route : moitié pour l'hôpital, moitié pour le Port.`, effets: { reputation: { "garnison-du-quai": 1, "cooperative-des-plaines": 1, "dispensaire-du-sud": 1 } } }
    ],
    voix: [`Mémé Lucette : « Le lait, il descend. Avec vous ou sans vous. Mais sans vous, il descend pas loin. »`, `« À l'aube, sur la route des Plaines, ils sont plantés là, gelés, comme des piquets. Tu passes entre. Tu respires pas. »`,
      `La radio de la Garnison : « Les denrées des Hauts sont réquisitionnées pour la population du Port. »`],
    traces: `Des traces de roues ferrées entre des silhouettes immobiles ; au Dispensaire, des bidons vides rangés, à rendre.` }),

  A({ cle: "le-cargo", numero: 23, titre: "Le cargo", taille: "front", famille: "plusieurs",
    regions: ["le-port"], sites: ["palangrier-a-quai"], factions: ["garnison-du-quai"], front: "garnison",
    naissance: { phases: ["panique", "effondrement", "silence", "apres"] },
    apprendre: `Dès les premiers jours, à la radio : la Garnison annonce un cargo pour les survivants recensés, avec une date. Puis une autre.`,
    demande: `Rien, d'abord. Puis de choisir : y croire et se faire recenser, tenir sa communauté à l'écart, ou chercher la preuve au poste radio du port.`,
    malTourner: `Ceux qui y vont avec leurs papiers restent : logés, nourris, réquisitionnés. La date glisse pendant toute la campagne.`,
    change: `Selon le cours de la campagne, le cargo vient, ne vient pas, ou vient pour autre chose que prévu.`,
    garde: `La seule nouvelle possible du reste du monde, et elle arrive à la toute fin.`,
    verites: {
      fausse: { poids: 2, texte: `Il n'y a pas de cargo : la commandante y croit à moitié, et la date tient les gens tranquilles.` },
      vraie: { poids: 1, texte: `Un cargo existe, quelque part, et parle à la radio du port une nuit sur dix. Il viendra, mais pas pour tout le monde.` }
    },
    pente: { tousLes: 30, crans: [`Une nouvelle date à la radio.`, `Des familles descendent au Port avec leurs papiers.`, `Le recensement devient obligatoire sur la route du Littoral.`, `La date glisse encore ; certains n'y croient plus, d'autres plus que jamais.`] },
    issues: [
      { cle: "recenses", titre: "Se faire recenser", texte: `Une part du groupe descend au Port avec ses papiers, et y reste.`, effets: { reputation: { "garnison-du-quai": 2 }, depart: true } },
      { cle: "a-l-ecart", titre: "Tenir sa communauté à l'écart", texte: `Personne ne descend ; la Garnison le note.`, effets: { reputation: { "garnison-du-quai": -1 } } },
      { cle: "la-preuve", titre: "La preuve, au poste radio du port", texte: `Une nuit, on entend ce que dit vraiment la radio du port : le MJ dit ce qu'on entend, selon la vérité tirée.`, effets: {} },
      { cle: "il-vient", titre: "Le cargo vient", texte: `À la toute fin de la campagne, et pour ce qu'en décide le MJ.`, effets: {} }
    ],
    voix: [`La radio de la Garnison : « … évacuation par cargo jeudi, apportez vos papiers… » La voix se répète depuis trois semaines.`, `« Mon frère est descendu au Port avec ses papiers. Il est logé. Il travaille. Il ne remonte pas. »`,
      `Le livre de l'île, rumeur trois : « Personne ne l'a vu. »`],
    traces: `Une file de gens à la grille du port, chaque matin ; des papiers qu'on garde au sec, au cas où.` })
];

// ---------------------------------------------------------------- Ce qu'on comprend en arrivant (une ligne par région, pour le MJ)
const ARRIVEES = {
  "saint-denis": `Le début. Les urgences ont débordé sur les parkings ; les premières portes marquées sont ici. Sur les toits du Chaudron, du linge sèche : des gens vivent là-haut et ne descendent pas.`,
  "sainte-marie": `L'espoir de partir. Des valises par centaines, des files figées, un hangar de fret plein de ce que l'île attendait, et un tableau des départs arrêté sur le même vol.`,
  "route-du-littoral": `Ce qu'a donné la fuite : des kilomètres d'épaves entre la falaise et la houle. Plus haut, le vieux chemin pavé que les piétons ont rouvert, et le lazaret où l'on mettait déjà les arrivants en quarantaine il y a plus d'un siècle.`,
  "le-port": `L'ordre qui reste : des murailles de conteneurs, une sirène à heure fixe, des affiches de recensement. Et, au large, un navire qui n'a jamais accosté.`,
  "saint-paul": `La vie d'avant, intacte et vide : les plages, les restaurants, les bateaux de plaisance. Le lagon rend ses noyés ; le marché forain sert aux Ferrailleurs.`,
  "hauts-de-l-ouest": `Ceux qui savaient déjà : l'alambic à géranium, les cases en bois sous tôle, les citernes. Des gens qui n'ont presque rien changé à leur vie, et qui le disent.`,
  "saint-leu": `Le sel, le vent, les filaos. Des pêcheurs qui dorment sur l'eau, et sur le sable noir, des traces qui sortent de la mer.`,
  "saint-pierre": `Ceux qui soignent : le grand hôpital et ses draps peints d'une croix rouge, les ambulances en navette, la sucrerie du Gol arrêtée en pleine campagne, et une adresse répétée chaque soir à la radio.`,
  "le-tampon": `Le froid. Des troupeaux, des clôtures doublées, des cloches aux barrières ; au petit matin, des silhouettes immobiles dans les prés, couvertes de rosée.`,
  "sud-sauvage": `L'île dans l'île. Peu de monde, donc peu de morts ; la vanille, les vacoas, la mer qui prend sans prévenir. Les gens y sont partis les derniers, ou jamais.`,
  fournaise: `Ce qui ne demande l'avis de personne : la Plaine des Sables sans une trace, le gîte et son livre d'or que plus personne ne signe, les instruments qui tournent encore à Bourg-Murat.`,
  est: `La pluie et la foi : des rivières en crue qui charrient tout, la canne haute, les centrales qui ont tenu plus longtemps, l'église que la lave a épargnée et les cierges sur les coulées.`,
  "plaine-des-palmistes": `La forêt qui reprend : des gîtes fermés de l'intérieur, la brume de l'après-midi, des sentiers où l'on se perd à dix mètres de la route.`,
  cilaos: `Une seule route, quatre cents virages, et le car jaune arrêté dans un tunnel. Là-haut, le village a tenu ; chaque éboulis décide s'il reste une île dans l'île.`,
  salazie: `L'eau partout, les cascades, les treilles de chouchous. La route emportée, le cirque refermé, et des cases de Hell-Bourg dont les jardins sont entretenus par on ne sait qui.`,
  mafate: `Le monde d'après ressemblait au monde d'avant : pas de route, des panneaux sur les toits, des sifflets d'îlet en îlet. Et un îlet où tout va bien, trop bien.`
};

// ---------------------------------------------------------------- Raconter sans quête : les supports
// table : une table neuve (nom, description, resultats ; clé « recit-<cle> ») ; existante : une table qui existe déjà, { cle, nom } (rien à
// dupliquer).
const SUPPORTS = [
  { cle: "lieu-fige", nom: "Le lieu figé", texte: `Une scène laissée telle quelle le jour zéro ou après. Elle dit ce qui s'est passé là, sans un mot. Ne la montrez qu'une fois dans la partie.`,
    table: { nom: "Raconter sans quête : un lieu figé", description: `Une scène laissée telle quelle ; à ne montrer qu'une fois.`, resultats: [
      `Une table mise pour quatre sous une varangue, les assiettes couvertes de moisissure, une chaise renversée en arrière.`,
      `Une voiture portières ouvertes au milieu de la route, le moteur froid, une glacière et des serviettes de plage sur la banquette.`,
      `Une salle de classe, les cartables accrochés aux chaises, la date du 4 décembre au tableau, et dessous : « Contrôle de géographie ».`,
      `Un salon de coiffure : une cliente est partie en plein brushing, le séchoir pend encore au bout de son fil.`,
      `Une station-service, les pistolets décrochés, et une file de voitures vides qui attend un plein qui ne viendra plus.`,
      `Une salle d'opération de clinique, tout rangé avec soin, sauf une chaise calée contre la porte, de l'intérieur.`,
      `Un mariage sous une tente blanche : les nappes, un gâteau effondré, et toutes les chaises poussées d'un seul coup vers la sortie.`,
      `Une case des Hauts où tout est en ordre : le lit fait, la vaisselle lavée, un mot sur la table : « Partis chez Marcel. »`] } },
  { cle: "journal-d-un-mort", nom: "Le journal d'un mort", texte: `Un carnet resté sur un corps : quelques jours d'une vie, où il allait, ce qu'il croyait. Les entrées sont écrites par métier ; certaines sont fausses, et le carnet ne le dit pas (la vérité est entre crochets, pour le MJ).`,
    table: { nom: "Raconter sans quête : le journal d'un mort", description: `Une entrée du carnet trouvé sur un corps ; entre crochets, ce qui est vrai (pour le MJ).`, resultats: [
      `**Le pêcheur.** « Jour 6. La mer est bonne, la terre ne l'est plus. J'ai mis le bateau au mouillage devant Saint-Leu. On y dort bien. » [Vrai, jusqu'à la houle.]`,
      `**L'infirmière.** « On manque de tout, sauf de malades. Le Dispensaire prend tout le monde. Si je meurs, rendez ce carnet à la docteure. » [Vrai.]`,
      `**L'élève de terminale.** « Maman dit qu'on remonte chez tatie à Cilaos demain. J'ai pris mon cahier de maths, je sais pas pourquoi. » [Vrai ; le car jaune ne passe plus le tunnel.]`,
      `**Le chauffeur de car.** « Le car jaune est arrêté dans le tunnel. On a laissé les sacs. Je reviendrai les chercher. » [Vrai : les sacs y sont toujours.]`,
      `**Le vigile.** « L'hypermarché a été vidé par les Comoriens du Chaudron, je les ai vus. » [Faux : il n'a vu qu'un camion. Le préjugé était le sien.]`,
      `**La tisaneuse.** « Pour la fièvre, la feuille d'en haut, trois fois par jour. » [À moitié vrai : la dose a été doublée en recopiant.]`,
      `**Le gendarme.** « Ordre d'évacuer vers le Port. Cargo jeudi. » [Faux : il n'y a pas eu de cargo jeudi.]`,
      `**L'électricien.** « La petite centrale de Langevin tient toujours. Les cahiers de l'exploitant sont dans le bureau, en haut. » [Vrai, si personne n'est passé avant.]`] } },
  { cle: "cahier-commun", nom: "Le cahier commun", texte: `Le livre de l'île, recopié d'abri en abri : chacun le complète. Les exemplaires diffèrent selon les régions ; lire celui d'un autre complète le sien.`,
    table: { nom: "Raconter sans quête : un autre exemplaire du cahier", description: `Ce qu'un autre exemplaire du livre de l'île a de différent.`, resultats: [
      `Un exemplaire de Cilaos : la rumeur un est rayée, et à côté, d'une autre main : « Ils montent très bien. Vu au Pavillon le 3. »`,
      `Un exemplaire de l'Est : une page de plus, sur les crues, avec la hauteur de l'eau à chaque radier.`,
      `Un exemplaire du Port : la page sur la Garnison arrachée proprement, au cutter.`,
      `Un exemplaire de Mafate, recopié à la main sans une faute ; chaque rumeur y porte le nom de l'îlet qui l'a dite.`,
      `Un exemplaire trouvé sur un mort : la page blanche, à la fin, n'est plus blanche ; trois lignes au crayon, que la pluie a rendues illisibles.`,
      `Un exemplaire des Hauts : une onzième rumeur, numérotée : « Les vieux Livides ne craignent pas le feu, ils craignent le soleil. » Personne n'a signé.`,
      `Un exemplaire de Saint-Pierre : des noms de soignants, avec les jours où ils sont au Dispensaire.`,
      `Un exemplaire du Sud sauvage : le lexique est deux fois plus long, et la moitié des mots sont des noms de plantes.`] } },
  { cle: "radio", nom: "La radio", texte: `Tant qu'il y a du courant et un poste : la boucle officielle qui s'arrête au milieu d'une phrase, la Garnison et son cargo, une voix qui lit des histoires le matin, une femme qui répète une adresse et un prénom. Les nouvelles, vraies ou fausses, et le silence du reste du monde.`,
    existante: { cle: "rumeurs-radio", nom: "Rumeurs de la radio" } },
  { cle: "ecrits-des-murs", nom: "L'écrit des murs", texte: `Les marques à la bombe des Sans-Lune sur les portes « déjà payées », les croix rouges du Dispensaire, les flèches, les prénoms et les dates, « PARTIS À CILAOS », les comptes de jours. Les joueurs en apprennent le sens peu à peu (le livre de l'île en donne une page).`,
    table: { nom: "Raconter sans quête : l'écrit des murs", description: `Ce qu'on lit sur un mur ou une porte ; entre crochets, ce que cela veut dire (pour le MJ).`, resultats: [
      `Trois traits et un rond à la bombe, sur une porte. [Les Sans-Lune sont passés ; ici, on a payé.]`,
      `Une porte sans marque, dans une rue où toutes les autres en ont une. [Elle n'a pas payé ; elle n'a plus longtemps.]`,
      `Un drap peint d'une croix rouge à une fenêtre. [Le Dispensaire, ou quelqu'un qui soigne.]`,
      `Une croix noire et un chiffre sur une porte. [Des Livides dedans, et combien. Parfois juste.]`,
      `« PARTIS À CILAOS », et sept prénoms. [Ils sont montés le troisième jour ; quatre sont arrivés.]`,
      `Des bâtons groupés par cinq, qui s'arrêtent au milieu d'un groupe. [Celui qui comptait a cessé.]`,
      `Une flèche et « EAU », à la craie. [Une citerne à deux cents mètres ; l'eau est bonne, ou ne l'est plus.]`,
      `Un prénom et une date, puis d'autres dates en dessous, d'autres mains. [Quelqu'un cherche quelqu'un ; d'autres l'ont vu passer.]`,
      `« ICI 3 VIVANTS », et dessous, plus récent : « 2 ».`,
      `Une affiche de recensement de la Garnison, et quelqu'un a écrit dessus : « ET APRÈS ? »`] } },
  { cle: "oratoire-rouge", nom: "L'oratoire rouge", texte: `Les petits oratoires de saint Expédit au bord des routes : des messages laissés entre gens qui ne se croisent pas, des ex-voto, des demandes. On les lit ; on ne les prend pas.`,
    existante: { cle: "oratoires-rouges", nom: "Oratoires rouges — messages" } },
  { cle: "objet-deplace", nom: "L'objet déplacé", texte: `Ce que le cyclone a redistribué, ce que la mer a rendu, ce qu'un Livide porte encore. Il dit d'où venait celui qu'on vient d'abattre.`,
    table: { nom: "Raconter sans quête : l'objet déplacé", description: `Un objet loin de chez lui ; entre crochets, ce qu'il raconte (pour le MJ).`, resultats: [
      `Un badge d'hôpital au cou d'un Livide : « CHU Sud, brancardier ». [Il venait de Saint-Pierre, à quarante kilomètres.]`,
      `Un brassard orange de la Garnison au bras d'un Livide des Hauts. [Un soldat d'un convoi qui n'est pas redescendu.]`,
      `Une carte d'embarquement pliée dans une poche : vol du 5 décembre. [Il n'a jamais embarqué.]`,
      `Un casque de chantier de la nouvelle route du Littoral, sur une plage de Saint-Paul. [La houle l'a porté.]`,
      `Un gilet de sauvetage d'un navire de croisière, échoué à Saint-Philippe. [Un navire au large, quelque part.]`,
      `Un trousseau de clés au porte-clés de Cilaos, au bord de la mer. [Quelqu'un des Hauts est descendu jusque-là.]`,
      `Une alliance gravée au doigt d'un Livide : deux prénoms et une date. [Le prénom est peut-être sur un mur, quelque part.]`,
      `Un sac de sport du club de foot de Saint-André, accroché à une branche au-dessus d'une ravine en crue. [La crue l'a apporté d'en haut, rien de plus.]`] } },
  { cle: "nature", nom: "La nature", texte: `Les flamboyants rouges, les letchis qui pourrissent sous l'arbre, la canne jamais coupée, les chiens en meute, le silence des grenouilles : la date, l'abandon, le danger qui approche.`,
    table: { nom: "Raconter sans quête : la nature", description: `Ce que dit le paysage, à qui sait le lire.`, resultats: [
      `Les flamboyants rouges, partout : c'est la fin de l'année.`,
      `Des letchis qui pourrissent sous l'arbre : personne n'est passé depuis des semaines.`,
      `Un champ de canne jamais coupé, plus haut qu'un homme : on ne voit rien venir, et rien ne vous voit.`,
      `Des chiens en meute qui traversent la route sans un regard : ils ont mangé ailleurs.`,
      `Les grenouilles se taisent d'un coup, puis les insectes : quelque chose de nombreux passe tout près.`,
      `De l'herbe dans les fissures de la quatre-voies, et des cabris qui y broutent.`,
      `Des oiseaux posés en rangs serrés sur les fils électriques : le courant ne passe plus nulle part.`,
      `Une odeur sucrée et lourde que le vent apporte d'un quartier : on n'y va pas aujourd'hui.`] } }
];

// ---------------------------------------------------------------- Les figures de l'île (des rôles, pas des communautés)
const FIGURES = [
  { nom: "La gramoune qui sait", veut: `Qu'on l'écoute jusqu'au bout.`, cache: `Elle n'enseigne qu'à celui qui reste, et elle n'a pas tout le temps.` },
  { nom: "Celui qui compte", veut: `Que rien ne manque : il tient le cahier des stocks, des dettes, des jours.`, cache: `Il peut devenir un Comptable.` },
  { nom: "Celle qui a gardé les enfants", veut: `Qu'on ne lui mente pas.`, cache: `Elle a besoin de tout et ne demandera rien.` },
  { nom: "Le revenu de la ville", veut: `Qu'on le croie.`, cache: `Ce qu'il raconte date, et il le sait mal.` },
  { nom: "Celui qui organise", veut: `Bien faire, tout de suite, pour tous.`, cache: `Il n'a pas demandé leur avis aux autres, et il a souvent raison sur le fond.` },
  { nom: "Le croyant", veut: `Tenir sa promesse.`, cache: `Sa foi le fait tenir, et peut le fermer aux autres.` },
  { nom: "L'enfant qui regarde", veut: `Comprendre ce que font les grands.`, cache: `Il se calquera sur eux, ou il partira.` },
  { nom: "Le marchand d'entre-deux", veut: `Que tout circule.`, cache: `Vos nouvelles circulent aussi.` },
  { nom: "Celui qui est resté seul", veut: `Qu'on le laisse.`, cache: `Il sait quelque chose que personne d'autre ne sait.` }
];

// ---------------------------------------------------------------- Les bruits (la plus petite taille d'affaire : un moment)
const BRUITS = [
  `Un chien qui gratte à une porte, toujours la même, et qui ne veut pas partir.`,
  `Un drap blanc à un balcon, qui n'y était pas hier.`,
  `Un réveil qui sonne encore chaque matin à six heures dans une case vide, plus faible chaque jour.`,
  `Un cabri debout sur le toit d'une voiture, qui vous regarde passer.`,
  `Des traces de pas fraîches dans la cendre d'un feu éteint.`,
  `Une fumée lointaine qui s'éteint dès qu'on la regarde.`,
  `Un mot cloué à un poteau : « Eau potable, 200 m », et une flèche.`,
  `Une fenêtre qui claque au vent, dans une maison où quelqu'un l'a pourtant fermée.`,
  `Une odeur de cari, quelque part, impossible à situer.`,
  `Une moto au loin, qui descend la route, puis plus rien.`,
  `Un cairn frais au bord du sentier : quelqu'un balise.`,
  `Une sonnerie de téléphone, une seule, dans une voiture abandonnée.`
];

// ---------------------------------------------------------------- Les Livides en fête (règle de respect : objets profanes seulement)
const LIVIDES_EN_FETE = [
  `Un Livide en bonnet de Noël, le pompon traîné dans la boue, qui se cogne doucement à une vitrine décorée.`,
  `Un Livide au ruban rouge noué au cou, qui suit le bruit des pétards jusqu'au bout de la rue.`,
  `Une Livide avec une guirlande lumineuse éteinte enroulée sur l'épaule, prise dans un grillage.`,
  `Un Livide au casque de musique sur les oreilles, le fil arraché, qui tourne la tête vers chaque son.`,
  `Deux Livides en chemises à fleurs du bal du 14 juillet, figés de froid sur la place de Bourg-Murat.`,
  `Un Livide coiffé d'une couronne de papier doré, de travers, dans une galerie marchande vide.`
];

// ---------------------------------------------------------------- Les libellés (la fabrique les reçoit : la traduction les rejoue)
const signe = n => (n > 0 ? `+${n}` : `−${Math.abs(n)}`);
const LIBELLES = {
  tailles: { bruit: "Bruit", affaire: "Affaire", "grande-affaire": "Grande affaire", front: "Front" },
  durees: { bruit: "un moment", affaire: "quelques jours", "grande-affaire": "des semaines", front: "toute la campagne" },
  familles: { cirques: "Les cirques", volcan: "Le volcan", littoral: "Le littoral et les routes", fetes: "Les fêtes", religion: "La religion et les préjugés",
    savoirs: "Les savoirs", "sens-moral": "Le sens moral", plusieurs: "À plusieurs, et sur toute une campagne" },
  verites: { vraie: "Vraie", exageree: "Exagérée", perimee: "Périmée", fausse: "Fausse", piege: "Un piège" },
  fronts: { comptable: "du Comptable", garnison: "de l'autorité provisoire", hauts: "des Hauts froids", fournaise: "de la Fournaise", remede: "du remède" },
  phases: { "jour-zero": "le jour zéro", panique: "la panique", effondrement: "l'effondrement", silence: "le silence", apres: "l'après" },
  mois: ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"],
  declencheurs: { "refus-a-la-porte": "après un refus à la porte", "date-perdue": "quand la date se perd" },
  ressources: { eau: "eau", nourriture: "nourriture", carburant: "carburant", medicaments: "médicaments", munitions: "munitions", materiaux: "matériaux",
    pieces: "pièces", graines: "graines", gaz: "gaz", plantes: "plantes", energie: "énergie", boutures: "boutures", biocarburant: "carburant maison" },
  actes: { exclure: "exclure", colporter: "colporter", mentir: "mentir", abandonner: "abandonner", attaquer: "attaquer", trahir: "trahir",
    accueillir: "accueillir", aider: "aider", partager: "partager", epargner: "épargner", rendre: "rendre" },
  partout: "partout, ou là où se trouve le groupe",
  sections: { quand: "Quand elle naît", ou: "Où", lieux: "Lieux", foire: "Foire", qui: "Qui", apprendre: "Comment on l'apprend", demande: "Ce qu'elle demande", malTourner: "Comment elle tourne mal",
    change: "Ce qu'elle change", garde: "Ce qu'on en garde", verite: "La vérité (au MJ seul)", pente: "Si personne ne s'en occupe", issues: "Les issues",
    voix: "Comment on l'entend dire", traces: "Ce qui en reste", ton: "Le ton", effets: "Effets" },
  liaison: { et: " et ", virgule: ", ", pointVirgule: " ; ", point: " · ", deuxPoints: " : " },
  aToutMoment: "à tout moment de la crise",
  enMois: x => `en ${x}`,
  pendant: x => `pendant ${x}`,
  aLApproche: x => `à l'approche de « ${x} »`,
  auCran: (front, n) => `quand le front ${front} atteint le cran ${n}`,
  front: f => `Front ${f}`,
  poids: (n, t) => `${n} sur ${t}`,
  tousLes: n => `un cran tous les ${n} jour${n > 1 ? "s" : ""}`,
  cran: n => `Cran ${n}`,
  effets: {
    reputation: (nom, n) => `réputation ${signe(n)} (${nom})`,
    acte: a => `acte « ${a} » pour ceux qui ont choisi`,
    front: (f, n) => `front ${f} ${signe(n)}`,
    stocks: (r, n) => `${signe(n)} ${r}`,
    savoir: s => `savoir « ${s} »`,
    plan: p => `plan « ${p} »`,
    renom: n => `renom ${signe(n)}`,
    moral: n => `moral ${signe(n)} à chacun`,
    entente: n => `entente ${signe(n)}`,
    autorite: n => `autorité du chef ${signe(n)}`,
    visibilite: n => `visibilité ${signe(n)}`,
    recrue: "quelqu'un rejoint le groupe",
    depart: "quelqu'un quitte le groupe",
    rumeur: "le Ladi Lafé s'en empare",
    rumeurDementie: "la rumeur est démentie",
    prejuge: "un préjugé perd un cran",
    voie: "une route s'ouvre (au MJ)",
    horde: "une horde approche (au MJ)",
    fete: x => `le groupe fête « ${x} » (son gain et son coût)`,
    voeuTenu: "vœu tenu",
    voeuRompu: "vœu rompu",
    aucun: "rien de plus que ce qui se raconte"
  },
  journaux: {
    affaires: "Les affaires de l'île", mener: "Mener une affaire",
    intro: { titre: "Vingt-trois affaires", texte: `Vingt-trois affaires, rangées par famille. Chacune dit **comment on l'apprend**, **ce qu'elle demande**, **comment elle tourne mal**, **ce qu'elle change** et **ce qu'on en garde** ; puis ce que le MJ garde pour lui : sa **vérité** (tirez-la quand elle naît), sa **pente** (ce qu'elle devient si personne ne s'en occupe), ses **issues** (avec leurs effets dans les règles), ses **voix** et ses **traces**.

Les noms de personnes viennent de Fénoir ou sont des rôles ; les lieux sont de vrais lieux de l'île. Aucune n'est obligatoire, aucune ne se coche : laissez-les venir aux joueurs par la rumeur, et laissez-les finir sans eux s'ils regardent ailleurs. La méthode est dans le journal « Mener une affaire ».` },
    regions: { titre: "Ce que chaque région laisse comprendre", texte: `Ce que les joueurs comprennent en arrivant, rien qu'en regardant. Une ligne à dire au premier passage, avant toute rencontre.` },
    figures: { titre: "Les figures de l'île", texte: `On les retrouve partout. Ce sont des **rôles, pas des communautés** : chacun peut être tenu par n'importe qui de l'île, de n'importe quelle origine. Les personnages nommés de Fénoir (la commandante Hoarau, Mémé Lucette, Gros Mani, le patron Grondin, Frère Expédit, Madame Lauret, la docteure Soundirassen, Ophélie Turpin, le Comptable, Ti Zan) tiennent chacun un lieu et un front ; **aucun n'est un méchant ni un saint**. La table « Figures de l'île » les tire.` },
    supports: { titre: "Raconter sans quête", texte: `Les joueurs doivent pouvoir comprendre l'essentiel sans que personne ne leur parle, rien qu'en regardant. Huit supports, chacun avec sa table.` },
    table: x => `Table « ${x} ».`
  },
  tables: {
    affaires: { nom: "Affaires : ce qui se raconte", description: `Ce qu'on entend dire ; entre parenthèses, l'affaire (journal « Les affaires de l'île »). Tirez sa vérité quand elle naît.` },
    figures: { nom: "Figures de l'île", description: `Un rôle, pas une communauté : n'importe qui de l'île peut le tenir.` },
    bruits: { nom: "Bruits de l'île", description: `La plus petite des affaires : un moment, qui ne demande rien et fait sentir que l'île vit.` },
    livides: { nom: "Livides en fête", description: `Pendant une fête, ce qu'un Livide porte encore : jamais rien de religieux ni de mémoire (règle de respect).` },
    figure: f => `**${f.nom}.** Ce qu'elle veut : ${f.veut} Ce qu'elle cache ou risque : ${f.cache}`
  }
};

// ---------------------------------------------------------------- Les pages écrites du journal « Mener une affaire »
const PAGES_MENER = [
  { cle: "principe", titre: "Ce qu'est une affaire", texte: `Une **affaire**, c'est quelque chose qui se passe sur l'île et dont le groupe a entendu parler. Ce n'est pas une mission qu'on lui confie : c'est un morceau du monde qui existe sans lui, qui avance, et qui finira d'une façon ou d'une autre, avec ou sans lui.

- **Pas de liste de tâches, pas de récompense annoncée.** Les joueurs savent ce qu'ils ont entendu, de qui, vers quel jour, et où. C'est tout.
- **Une affaire peut être fausse** (une erreur, un mensonge), **périmée** (c'était vrai il y a dix jours), **déjà réglée par d'autres**, ou **pire que ce qu'on a dit**. Ne le dites jamais : ils le découvrent en y allant, ou en recoupant.
- **Ce qu'on y gagne est dans le monde** : une route ouverte, un savoir appris, un allié, une dette, de la réputation, un plan, un endroit rendu vivable. Jamais des points.
- **Ne rien faire est une réponse.** L'affaire avance toute seule, et ce qu'elle devient se voit.

Le journal « Les affaires de l'île » en donne vingt-trois, écrites pour une table.` },
  { cle: "naissance", titre: "D'où naît une affaire", texte: `- **Un besoin d'une communauté** : un îlet manque de bras, un abri de pièces ; c'est la liste qu'on lit à la porte.
- **Une fête qui approche** : il faut de l'huile pour la lampe de Dipavali, une peau pour le rouleur du 20 décembre.
- **Un événement annoncé** : le cyclone que la vieille sent venir, la Fournaise qui gronde.
- **Un front qui avance** : un cran de la campagne « L'année du Gris » fait naître une affaire dans les régions touchées.
- **Une rumeur du Ladi Lafé** : un fait, vrai ou non, mis en circulation, déformé à chaque bouche.
- **Un lieu gardé** : une centrale au fond d'une ravine, qu'on n'atteint qu'à la saison sèche.
- **Un mort** : un carnet trouvé sur un corps parle d'une cache.
- **Un acte du groupe** : celui qu'on a refusé à la porte revient.

Chaque affaire dit **quand elle naît** : des mois, des phases de la crise, une fête à venir, le cran d'un front, un déclencheur. Le MJ IA les trouve pour vous ; à la main, tirez la table « Affaires : ce qui se raconte », ou choisissez celle qui sert la table. Une ou deux à la fois suffisent.` },
  { cle: "tailles", titre: "Quatre tailles", texte: `- **Bruit** (un moment) : un chien qui gratte à une porte, un drap blanc à un balcon. Il ne demande rien ; il fait sentir que l'île vit. Table « Bruits de l'île ».
- **Affaire** (quelques jours) : trouver de l'huile pour une lampe, faire passer une soignante par le vieux chemin.
- **Grande affaire** (des semaines) : la foire aux lentilles, l'îlet où tout va trop bien. Une ou deux en même temps, pas plus.
- **Front** (toute la campagne) : le Comptable, la Garnison, les Hauts froids, la Fournaise, le remède, dans la campagne « L'année du Gris ». Le cargo en est un.` },
  { cle: "verite", titre: "La vérité", texte: `Quand une affaire naît, tirez sa **vérité**, et gardez-la pour vous. Chaque affaire dit lesquelles sont possibles, et leur poids :

- **vraie** : c'est comme on l'a dit ;
- **exagérée** : il y a quelque chose, en plus petit ou en plus simple ;
- **périmée** : c'était vrai, il y a dix jours ;
- **fausse** : une erreur, un mensonge, une peur ;
- **un piège** : quelqu'un veut qu'on vienne.

Une rumeur sur une communauté (le « service » des voisins, la famille du Chaudron) est **toujours fausse** : le jeu ne donne jamais raison à un préjugé. La source compte : un témoin se trompe moins qu'un radioamateur, et le Ladi Lafé déforme à chaque passage (un lieu voisin, un nombre grossi, un nom changé).` },
  { cle: "pente", titre: "La pente et l'horloge", texte: `Chaque affaire a une **pente** : ce qu'elle devient si personne ne s'en occupe, cran par cran, un cran tous les tant de jours. Ouvrez une horloge du MJ IA par affaire en cours (identifiant « affaire-<clé> », autant de segments que de crans), ou cochez les crans à la main. Quand les joueurs agissent, l'horloge s'arrête ou recule ; quand ils laissent faire, elle avance, et ce qu'elle annonce se voit dans le monde.

Les fronts de la campagne ont aussi leur horloge : « front-comptable », « front-garnison », « front-hauts », « front-fournaise », « front-remede ». Une affaire de front fait avancer ou reculer la sienne.` },
  { cle: "issues", titre: "Les issues et ce qu'elles changent", texte: `Chaque affaire a trois à cinq **fins**. Chacune dit ses effets, avec les règles de Fénoir :

- **réputation** auprès d'une faction : son horloge « rep-<faction> » ;
- **acte** : le sens moral de ceux qui ont choisi (accueillir, aider, partager, colporter, mentir, trahir…), avec ses témoins ;
- **front** : un cran de plus ou de moins à l'horloge du front de l'affaire ;
- **stocks**, **savoir** (appris ou enseigné), **plan** (ajouté aux plans du groupe : moins de matériaux, moins de travail) ;
- **renom** de l'abri, **moral** de chacun, **entente** du groupe, **autorité** du chef ;
- **quelqu'un rejoint** le groupe, ou le **quitte** ;
- **le Ladi Lafé s'en empare** (une rumeur court), ou **la rumeur est démentie** ; **un préjugé** d'un PNJ perd un cran ;
- **visibilité** de l'abri, **une route s'ouvre**, **une horde approche** ;
- **une fête** se tient (son gain et son coût), **un vœu** est tenu ou rompu.

Appliquez ce qui a eu lieu, pas plus : une issue n'est pas un barème. Si le groupe n'y était pour rien, l'issue change le monde, pas ses stocks.` },
  { cle: "voix", titre: "Les voix et les traces", texte: `Une affaire **s'entend** avant de se voir. Chacune a ses voix : ce qu'on en dit au camp, au marché, à la radio, sur un mur. Donnez la nouvelle avec sa provenance : « Entendu de Mémé Lucette, au troc de Bourg-Murat, vers le 12. » Les joueurs peuvent la noter, la rayer, la donner à d'autres, juste ou fausse.

Le français de l'île d'abord : des phrases courtes et concrètes. Le créole par touches justes, avec son sens à côté. Personne ne parle comme un livre, sauf ceux dont c'était le métier. Chacun parle de ce qu'il sait faire. Et personne ne dit tout.

Quand une affaire finit, elle **laisse des traces** : une tombe, une clôture réparée, une case brûlée, ce que le Ladi Lafé en répète. Une affaire que les joueurs n'ont pas vérifiée reste dans leurs notes comme ils l'avaient entendue, peut-être pour toujours.` },
  { cle: "sujets-delicats", titre: "Les sujets délicats", texte: `Deux sujets se jouent avec une retenue particulière (décision de Jordan) : l'affaire « Rendre à la lave », ce que les Pèlerins font des mordus, et l'enfant du front du remède.

- **Rien n'est montré.** Pas de scène de mort, pas de corps, pas de coulée. On l'apprend à ce qui manque : une natte vide le matin, un chant qui s'arrête, une porte qu'on ne rouvre pas.
- **Aucun enfant n'est mis en danger** sous les yeux des joueurs, ni de façon complaisante. L'enfant mordu qui ne s'est pas transformé est une rumeur, puis un enfant que des adultes protègent ; l'enjeu est de savoir qui le protège, qui décide pour lui, et ce qu'on accepte d'entendre.
- **Le malaise vient de ce qu'on comprend**, pas de ce qu'on voit. Laissez les joueurs faire le chemin ; ne le faites pas à leur place.
- **Ni monstre ni saint.** Frère Expédit croit ce qu'il croit, la docteure Soundirassen cherche ce qu'elle cherche ; la foi n'a aucun effet, ni bon ni mauvais, et le jeu ne confirme rien.
- Si quelqu'un à la table est mal à l'aise, coupez, sans discuter.` },
  { cle: "respect", titre: "Les fêtes et les Livides : la règle de respect", texte: `Pendant une fête, l'île garde ses décors : pieds de Noël, lanternes rouges, lampes à huile, kolam, cannes dressées, feu de kabar. Chaque fête dit ce qu'on voit et ce qu'on trouve (« Les fêtes de Fénoir »). Quelques Livides portent encore ce qu'ils avaient sur eux : un bonnet de Noël, un ruban rouge, une guirlande éteinte, un casque de musique.

**Jamais rien de religieux ni de mémoire sur un Livide** : ni chapelet, ni croix, ni pottou, ni kavadi, ni brassard de deuil. Ce qui est sacré, ou qui touche aux morts, n'apparaît qu'en décor posé avec soin, ou comme un objet qu'on trouve. La table « Livides en fête » donne quelques descriptions qui respectent la règle.

Le bruit d'une fête est dans son coût : pétards, tambour et maloya portent très loin, la musique moins.` }
];

// ---------------------------------------------------------------- La page du livre de l'île (joueurs) : les signes des murs
const PAGE_LIVRE = { cle: "signes-des-murs", titre: "Les signes des murs", texte: `On écrit sur les murs depuis le premier jour. Au début, c'était pour dire où l'on allait ; maintenant, c'est aussi pour dire qui tient le quartier. Voici ce qu'on a compris. Recopiez, complétez, et rayez ce qui est faux.

- **Trois traits et un rond**, à la bombe, sur une porte : les Sans-Lune sont passés, et ici, on a payé. Une porte sans marque dans une rue marquée n'a pas payé ; elle n'a plus longtemps.
- **Une croix rouge** peinte sur un drap ou sur un mur : le Dispensaire, ou quelqu'un qui soigne. Venez avec vos malades, pas avec vos armes.
- **Une croix noire** sur une porte, avec un chiffre : des Livides dedans, et combien. N'ouvrez pas.
- **« PARTIS À CILAOS »**, et des prénoms : des gens qui sont montés. Ils sont peut-être arrivés.
- **Des bâtons groupés par cinq** : quelqu'un compte les jours. S'ils s'arrêtent, il a cessé de compter.
- **Une flèche et « EAU »** : une source, un robinet qui coule, une citerne. Faites bouillir quand même.
- **Un prénom et une date** : quelqu'un cherche quelqu'un. Ajoutez la vôtre si vous l'avez vu passer.
- **« ICI 3 VIVANTS »** : ils étaient trois, ce jour-là.

Au bord des routes, sous la pierre des oratoires rouges, on laisse aussi des mots. On les lit ; on ne les prend pas.` };

// Toutes les données du lot, en français : la fabrique les reçoit avec les noms du contenu.
export const DONNEES_AFFAIRES = { affaires: AFFAIRES, arrivees: ARRIVEES, supports: SUPPORTS, figures: FIGURES, bruits: BRUITS, livides: LIVIDES_EN_FETE,
  libelles: LIBELLES, pagesMener: PAGES_MENER, pageLivre: PAGE_LIVRE };

// Les noms des choses citées (factions, régions, sites, savoirs, installations, fêtes, foires), tirés du contenu.
export const NOMS_DU_CONTENU = {
  region: k => REGIONS.find(r => r.cle === k)?.nom ?? k,
  site: k => SITES.find(s => s.cle === k)?.nom ?? k,
  faction: k => FACTIONS.find(f => f.cle === k)?.nom ?? k,
  savoir: k => SAVOIRS.find(s => s.system.cle === k)?.name ?? k,
  installation: k => INSTALLATIONS.find(i => i.system.cle === k)?.name ?? k,
  fete: k => FETES_FENOIR.find(f => f.cle === k)?.nom ?? k,
  foire: k => FOIRES.find(f => f.cle === k)?.nom ?? k
};

// ---------------------------------------------------------------- La fabrique
const maj = t => t.charAt(0).toUpperCase() + t.slice(1);
const liste = (L, x) => (x.length < 2 ? x.join("") : `${x.slice(0, -1).join(L.liaison.virgule)}${L.liaison.et}${x.at(-1)}`);

// Quand l'affaire naît, en mots.
function texteNaissance(a, L, N) {
  const n = a.naissance, morceaux = [];
  if (n.mois.length) morceaux.push(L.enMois(liste(L, n.mois.map(m => L.mois[m - 1]))));
  if (n.phases.length) morceaux.push(L.pendant(liste(L, n.phases.map(p => L.phases[p]))));
  if (n.fete) morceaux.push(L.aLApproche(N.fete(n.fete)));
  if (n.cran) morceaux.push(L.auCran(L.fronts[a.front], n.cran));
  for (const d of n.declencheurs) morceaux.push(L.declencheurs[d]);
  return morceaux.length ? morceaux.join(L.liaison.pointVirgule) : L.aToutMoment;
}

// Les effets d'une issue, en mots.
export function texteEffets(a, effets, L, N) {
  const E = L.effets, t = [];
  for (const [f, n] of Object.entries(effets.reputation ?? {})) t.push(E.reputation(N.faction(f), n));
  if (effets.acte) t.push(E.acte(L.actes[effets.acte] ?? effets.acte));
  if (effets.front) t.push(E.front(L.fronts[a.front], effets.front));
  for (const [r, n] of Object.entries(effets.stocks ?? {})) t.push(E.stocks(L.ressources[r] ?? r, n));
  if (effets.savoir) t.push(E.savoir(N.savoir(effets.savoir)));
  if (effets.plan) t.push(E.plan(N.installation(effets.plan)));
  for (const k of ["renom", "moral", "entente", "autorite", "visibilite"]) if (effets[k]) t.push(E[k](effets[k]));
  if (effets.recrue) t.push(E.recrue);
  if (effets.depart) t.push(E.depart);
  if (effets.rumeur) t.push(effets.rumeur === "dementie" ? E.rumeurDementie : E.rumeur);
  if (effets.prejuge) t.push(E.prejuge);
  if (effets.voie) t.push(E.voie);
  if (effets.horde) t.push(E.horde);
  if (effets.fete) t.push(E.fete(N.fete(effets.fete)));
  if (effets.voeu) t.push(effets.voeu === "rompu" ? E.voeuRompu : E.voeuTenu);
  return t.length ? t.join(L.liaison.pointVirgule) : E.aucun;
}

// La page d'une affaire (texte à balises légères, html() de aides.mjs).
function pageAffaire(a, L, N) {
  const S = L.sections;
  const total = Object.values(a.verites).reduce((s, v) => s + v.poids, 0);
  const noms = (cles, f) => cles.map(f).join(L.liaison.point);
  const tete = [`*${L.tailles[a.taille]} (${L.durees[a.taille]})*`, `**${S.ou}.** ${a.regions.length ? noms(a.regions, N.region) : L.partout}.`,
    ...(a.sites.length ? [`**${S.lieux}.** ${noms(a.sites, N.site)}.`] : []), ...(a.foire ? [`**${S.foire}.** ${N.foire(a.foire)}.`] : []),
    ...(a.factions.length ? [`**${S.qui}.** ${noms(a.factions, N.faction)}.`] : []), ...(a.front ? [`**${L.front(L.fronts[a.front])}.**`] : []),
    `**${S.quand}.** ${maj(texteNaissance(a, L, N))}.`].join("\n");
  return [tete,
    `**${S.apprendre}.** ${a.apprendre}`, `**${S.demande}.** ${a.demande}`, `**${S.malTourner}.** ${a.malTourner}`, `**${S.change}.** ${a.change}`, `**${S.garde}.** ${a.garde}`,
    `# ${S.verite}`,
    Object.entries(a.verites).map(([v, x]) => `- **${L.verites[v]}** (${L.poids(x.poids, total)})${L.liaison.deuxPoints}${x.texte}`).join("\n"),
    `# ${S.pente}`,
    [`*${L.tousLes(a.pente.tousLes)}*`].join(""),
    a.pente.crans.map((c, i) => `- **${L.cran(i + 1)}.** ${c}`).join("\n"),
    `# ${S.issues}`,
    a.issues.map(i => `- **${i.titre}.** ${i.texte} *${S.effets}${L.liaison.deuxPoints}${texteEffets(a, i.effets, L, N)}.*`).join("\n"),
    `# ${S.voix}`,
    a.voix.map(v => `- ${v}`).join("\n"),
    `**${S.traces}.** ${a.traces}`,
    ...(a.ton ? [`**${S.ton}.** ${a.ton}`] : [])
  ].join("\n\n");
}

// Les affaires au registre : les données telles quelles (le système les lit : logique/affaires.mjs ; la traduction en fait les textes).
const versRegistre = a => structuredClone({ cle: a.cle, numero: a.numero, titre: a.titre, taille: a.taille, famille: a.famille, regions: a.regions, sites: a.sites,
  factions: a.factions, front: a.front, foire: a.foire, naissance: a.naissance, apprendre: a.apprendre, demande: a.demande, malTourner: a.malTourner,
  change: a.change, garde: a.garde, verites: a.verites, pente: a.pente, issues: a.issues, voix: a.voix, traces: a.traces, ton: a.ton });

// -> { affaires (registre), arrivees ({ region: texte }), journaux: [Les affaires de l'île, Mener une affaire], tables, pageLivre }
export function construireAffaires(D = DONNEES_AFFAIRES, N = NOMS_DU_CONTENU) {
  const L = D.libelles, J = L.journaux, T = L.tables;
  const familles = Object.keys(L.familles);
  const triees = [...D.affaires].sort((x, y) => x.numero - y.numero);
  const journalAffaires = journal({ cle: "les-affaires-de-l-ile", nom: J.affaires, pack: "mj", pages: [
    { cle: "introduction", titre: J.intro.titre, texte: J.intro.texte },
    ...familles.flatMap(f => triees.filter(a => a.famille === f).map(a => ({ cle: a.cle, titre: `${a.numero}. ${a.titre} (${L.familles[f]})`, texte: pageAffaire(a, L, N) })))
  ] });
  const journalMener = journal({ cle: "mener-une-affaire", nom: J.mener, pack: "mj", pages: [
    ...D.pagesMener,
    { cle: "regions", titre: J.regions.titre, texte: `${J.regions.texte}\n\n${Object.entries(D.arrivees).map(([r, x]) => `- **${N.region(r)}.** ${x}`).join("\n")}` },
    { cle: "figures", titre: J.figures.titre, texte: `${J.figures.texte}\n\n${D.figures.map(f => `- ${T.figure(f)}`).join("\n")}` },
    { cle: "supports", titre: J.supports.titre, texte: `${J.supports.texte}\n\n${D.supports.map(s => `- **${s.nom}.** ${s.texte} ${J.table(s.table ? s.table.nom : s.existante.nom)}`).join("\n")}` }
  ] });
  const t = (cle, nom, description, resultats, drapeaux = {}) => {
    const x = table({ cle, nom, description, resultats });
    Object.assign(x.flags[MODULE], drapeaux);
    return x;
  };
  const tables = [
    t("affaires-ce-qui-se-raconte", T.affaires.nom, T.affaires.description, triees.map(a => `${a.voix[0]} *(${a.numero}. ${a.titre})*`), { affaires: true }),
    ...D.supports.filter(s => s.table).map(s => t(`recit-${s.cle}`, s.table.nom, s.table.description, s.table.resultats, { recit: s.cle })),
    t("figures-de-l-ile", T.figures.nom, T.figures.description, D.figures.map(T.figure), { figures: true }),
    t("bruits-de-l-ile", T.bruits.nom, T.bruits.description, D.bruits, { bruits: true }),
    t("livides-en-fete", T.livides.nom, T.livides.description, D.livides, { fetes: "livides" })
  ];
  return { affaires: triees.map(versRegistre), arrivees: { ...D.arrivees }, journaux: [journalAffaires, journalMener], tables, pageLivre: { ...D.pageLivre } };
}

// Le lot, tel que le module le publie.
export const LOT_AFFAIRES = construireAffaires();
