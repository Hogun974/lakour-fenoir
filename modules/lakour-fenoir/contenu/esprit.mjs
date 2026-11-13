// L'esprit sur le corps et le sens moral (complément du jeu 3D, familles 2 et 3) : tables du MJ, événements du camp et pages des
// guides. Les règles sont dans le système (logique/esprit.mjs, moralite.mjs, porte.mjs, chefs.mjs ; contrat §14) ; ici, le texte.
// Rien n'y est magique : la foi agit par le moral, le jeu ne confirme rien ; les préjugés sont dans la bouche des personnages.
import { table, MODULE, html, sansBalises } from "./aides.mjs";
import { RELIGIONS, ANCRAGES } from "./religions.mjs";

const T = (cle, nom, description, resultats, drapeaux = {}) => {
  const t = table({ cle, nom, description, resultats });
  Object.assign(t.flags[MODULE], drapeaux);
  return t;
};
const APRES_CHUTE = ["effondrement", "silence", "apres"];

// ---------------------------------------------------------------- Tables
const SIGNES = [
  "Il laisse la moitié de sa gamelle, « pour les enfants ». Il le fait depuis trois jours.",
  "Elle ne répond plus que par oui ou par non, et regarde la route.",
  "Il a donné son couteau à la plus jeune, « il te servira plus qu'à moi ».",
  "Elle a plié ses affaires au carré, comme pour un départ, et ne les a pas rouvertes.",
  "Il ne se lave plus, ne se rase plus, lui qui ne manquait jamais un matin.",
  "Elle parle de son mari au passé, puis au présent, puis plus du tout.",
  "Il a écrit une lettre et demande qui la portera « si jamais ».",
  "Elle s'assoit seule au bord du camp, au coucher du soleil, et reste là après la nuit tombée."
];
const FAUX_BRUITS = [
  "Des pas sur le gravier, derrière la case. Personne.",
  "Une voix qui appelle un prénom, tout bas, dans la ravine.",
  "Le portail qui grince, deux fois. Il est fermé, cadenassé.",
  "Quelqu'un qui gratte à la tôle, juste à côté de sa tête.",
  "Un enfant qui pleure au loin. Le vent tourne, et plus rien.",
  "Le bruit d'un moteur sur la route. La route est vide jusqu'au matin.",
  "Une respiration lente, de l'autre côté de la cloison.",
  "Le tintement des cloches d'alerte. Aucune n'a bougé."
];
const REFUSES = [
  "« *Mi konpran.* » (Je comprends.) Il remet son sac sur l'épaule et repart sans se retourner.",
  "Elle crache par terre : « Vous verrez, quand ce sera votre tour. »",
  "Il demande seulement de l'eau pour la route. Qu'on la lui donne ou non, on s'en souviendra.",
  "Elle note quelque chose dans un carnet, regarde longuement la barrière, et s'en va.",
  "« Dites-moi ce qui vous manque. Je reviendrai avec. »",
  "Il ne dit rien. Le soir, on voit sa silhouette sur la crête, qui observe le camp.",
  "Elle laisse un enfant à la porte, et s'enfuit. (Le MJ décide de la suite : on n'a refusé qu'elle.)",
  "Il rit : « Les Sans-Lune, eux, m'auraient ouvert. » Puis il prend la route du littoral."
];
const ULTIMATUMS = [
  "« Une part de ce que vous produisez, chaque semaine. Et personne ne viendra vous ennuyer. »",
  "« Votre carburant. Tout. Après, on parlera d'amitié. »",
  "« Deux bras pour nos chantiers, un mois. Vous choisissez lesquels. »",
  "« Les médicaments, ou on vient les chercher, et on prendra le reste avec. »",
  "« La moitié de la récolte. On a des enfants aussi. »",
  "« Rien pour cette fois. La prochaine lune, on revient, et vous aurez réfléchi. »",
  "« Votre radio. On veut savoir ce que vous savez. »",
  "« Laissez-nous passer par chez vous, chaque mois, et nourrissez-nous ce jour-là. »"
];
const CYCLONE_OBJETS = [
  "Une statue de saint Expédit, intacte, posée debout dans la boue de la cour.",
  "Une barque retournée sur le toit du poulailler, sans une égratignure.",
  "Une valise fermée, pleine de photos d'une famille que personne ne connaît.",
  "Un coffre de pêcheur coincé dans le manguier, avec des hameçons et du fil neuf.",
  "Une cloche d'église, au milieu du potager, fendue.",
  "Un sac de riz de vingt-cinq kilos, encore sec dans son plastique.",
  "Une poupée de chiffon accrochée au portail, comme si on l'avait posée là.",
  "Une lampe à pétrole intacte, son verre entier, au pied de la porte."
];
const ENFANT_TEMOIN = [
  "Il a tout vu depuis le toit. Il ne dit rien ; il ne mange pas ce soir-là.",
  "Elle rejoue la scène avec ses poupées : celle qui reste dehors, et ceux qui ferment la porte.",
  "Il demande à voix haute, au repas, pourquoi on a fait ça. Personne ne répond.",
  "Elle imite le chef, le menton haut, et répète ses mots à un plus petit qu'elle.",
  "Il a caché du pain sous son matelas : « pour quand ce sera nous ».",
  "Elle s'approche d'un adulte qu'elle aime bien et murmure : « Moi je partirai un jour. »"
];

export const TABLES_ESPRIT = [
  T("esprit-signes", "L'esprit — celui qui lâche : les signes", "Il mange moins, il parle moins, il donne ses affaires : ce que le groupe peut remarquer. Le groupe le retient par sa présence ; sinon, un matin, il n'est plus là (rien n'est montré).", SIGNES, { esprit: "signes" }),
  T("esprit-faux-bruits", "L'esprit — les faux bruits de la nuit", "Ce qu'entend, la nuit, celui dont le moral est au plus bas. Le jeu ne dit pas si c'était vrai.", FAUX_BRUITS, { esprit: "faux-bruits" }),
  T("esprit-objet-du-cyclone", "L'esprit — ce que le cyclone a déposé", "Un objet que le vent a laissé là. Le croyant pratiquant y voit un signe (+1 moral) ; celui qui ne pratique pas hésite ; les autres n'y pensent même pas. Le jeu ne tranche pas.", CYCLONE_OBJETS, { esprit: "cyclone" }),
  T("porte-refuse", "La porte — ce que dit le refusé", "Celui à qui l'on a fermé la porte, en partant. Ce qu'il fera ensuite dépend de lui, pas de ce qu'il dit.", REFUSES, { porte: "refuse" }),
  T("chef-ultimatums", "Les chefs de bande — les ultimatums", "Ce qu'exige un chef de bande qui pose un ultimatum. Accepté, il devient un tribut, puis, avec le temps, une alliance ou une révolte.", ULTIMATUMS, { chefs: "ultimatum" }),
  T("enfant-temoin", "L'enfant témoin", "Un enfant a vu ce que le groupe a fait. Selon ce qu'il sait faire, il l'imitera plus tard, ou il s'en révoltera.", ENFANT_TEMOIN, { esprit: "enfant" })
];

// ---------------------------------------------------------------- Événements du camp
const ev = ({ cle, nom, type, phases = APRES_CHUTE, zones = ["littoral", "hauts", "cirque", "volcan", "foret"], saisons = ["pluies", "seche"], poids = 1, texte, effets = {} }) =>
  ({ cle, nom, type, phases, zones, saisons, poids, public: false, texte: html(texte), effets });

export const EVENEMENTS_ESPRIT = [
  ev({ cle: "objet-du-cyclone", nom: "Ce que le vent a laissé", type: "decouverte", saisons: ["pluies"],
    texte: `Après la nuit de vent, un objet que personne n'a apporté est là, au milieu de la cour (table « ce que le cyclone a déposé »). Le croyant qui pratique y voit un signe et reprend courage (+1 moral, à raconter) ; celui qui ne pratique plus hésite ; les autres haussent les épaules. Le jeu ne dit pas qui a raison.`,
    effets: { abri: { moral: 1 } } }),
  ev({ cle: "priere-du-soir", nom: "La prière du soir", type: "abri", phases: ["panique", ...APRES_CHUTE],
    texte: `Au coucher du soleil, quelques-uns se retrouvent dans un coin du camp : un chapelet, une lampe malbare, un tapis tourné vers La Mecque, une Bible ouverte, le nom des anciens dit à voix basse. D'autres les regardent sans rien dire ; un ou deux s'approchent. Personne ne promet rien, mais cette nuit-là, on dort mieux.`,
    effets: { abri: { moral: 1 } } }),
  ev({ cle: "celui-qui-ne-mange-plus", nom: "Celui qui ne mange plus", type: "abri",
    texte: `Quelqu'un du groupe laisse sa gamelle à moitié pleine, parle de moins en moins, a donné son couteau (table « celui qui lâche »). Ce n'est pas un bouton qui le retiendra : c'est d'être là, avec lui, le soir. Le MJ choisit qui, et le dit avec tact.`,
    effets: { abri: { moral: -1 } } }),
  ev({ cle: "la-porte-en-debat", nom: "Faut-il ouvrir ?", type: "abri", phases: ["panique", ...APRES_CHUTE],
    texte: `Une famille campe depuis deux jours devant la barrière. Au repas, le ton monte : « *nou nana pa asé pou nou mèm* » (on n'a pas assez pour nous-mêmes), répond quelqu'un à celle qui veut ouvrir. Le chef peut trancher seul, ou demander un vote. Qui a voté contre une trahison ne rougit pas avec les autres.`,
    effets: { abri: { moral: -1 } } })
];

// ---------------------------------------------------------------- Pages des guides
const listeReligions = () => RELIGIONS.map(r => `- **${r.nom}** — ${sansBalises(r.description)}${r.observance ? ` *Ce que tient un pratiquant : ${r.observance.texte}.*` : ""}`).join("\n");
const listeAncrages = () => ANCRAGES.map(a => `- **${a.nom}** — ${sansBalises(a.description)} *Pour l'entretenir : ${a.texte}.*`).join("\n");

export const PAGES_JOUEUR_ESPRIT = [
  { cle: "esprit", titre: "L'esprit sur le corps", texte: `À Fénoir, le moral compte autant que les vivres. Ce que croit un survivant, et ceux qui l'entourent, changent sa forme. **Rien n'est magique** : la foi agit par le moral ; votre personnage peut y voir la main du ciel, le jeu ne confirme et ne dément jamais rien.

**Le regard.** Chacun vit la catastrophe à sa façon, et c'est ce qui nourrit son moral :

- **une épreuve** : il tient en endurant (la faim, les blessures, le cyclone) ;
- **une chance de refaire le monde** : il tient en bâtissant (chantier, cultures, élevage, atelier, soins, enseigner) et en accueillant ;
- **simplement l'envie de vivre** : il tient par les petits plaisirs (un bon repas à l'abri, le repos, la pêche, la cuisine, une fête, sa passion).

Tous les deux jours où ce qui le nourrit arrive, son moral remonte d'un cran (sans dépasser son plafond). Le regard peut changer : deux semaines sans ce qui le nourrit, le moral bas, et il voit les choses autrement.

**La religion, ou l'ancrage.** Elle est tirée avec le reste du survivant, et vous pouvez la changer avant de valider : une religion de l'île, « aucune » ou « plusieurs à la fois ». Le non-croyant a son **ancrage** (une photo, un carnet, une routine, le sport…), au même effet.

- **Pratiquant** : il gagne plus (son moral peut monter d'un cran plus haut), mais il tient ses observances. Trois jours sans pouvoir les tenir (sur la route, sans un coreligionnaire pour prier avec lui ; l'objet de son ancrage perdu), il se sent en faute : −1 moral, et son plafond baisse d'un cran jusqu'à ce qu'il les reprenne.
- **Non-pratiquant** : il gagne peu et ne risque rien : une fois toutes les deux semaines, quand son moral touche le fond (0), il se raccroche à ce qui le fait tenir (+1).
- Aux fêtes de sa religion, le pratiquant gagne 1 moral de plus que les autres.

**Les autres.** L'**entente** du groupe (de −3 à +3) compte : bonne (+2 ou plus), le moral de chacun peut monter un cran plus haut ; mauvaise (−2 ou moins), un cran plus bas. Seul, on ne profite de rien.

**La nuit.** Plus le moral est bas, plus la nuit ajoute de faux bruits ; la présence des autres les fait taire. Celui qui en entend dort mal (+1 fatigue).

**Celui qui lâche.** Certains ne tiennent pas. Ils donnent des signes avant : ils mangent moins (le repas ne leur rend plus de moral), parlent moins (−1 dé en parole), donnent leurs affaires. Le groupe les retient par sa présence, pas par un bouton : à deux autres au moins autour de lui, avec une entente qui n'est pas mauvaise, il ne s'enfonce pas. Sinon, un matin, un compagnon ou un PNJ n'est plus là. Un personnage de joueur ne part jamais tout seul : c'est à vous et au MJ.

**La chance.** Il arrive qu'un survivant ait de la chance, un dé de plus au moment où ça compte. Lui sait peut-être pourquoi. Le jeu ne le dit pas.` },
  { cle: "religions", titre: "Religions et ancrages", texte: `Les religions de l'île, et ce que tient un pratiquant :

${listeReligions()}

Les ancrages de ceux qui ne croient pas, et comment on les entretient :

${listeAncrages()}

Les croyances, les doutes et les préjugés sur la foi des autres sont ceux des personnages : le jeu traite toutes les religions de la même façon, et n'en confirme aucune.` },
  { cle: "sens-moral", titre: "Le sens moral, la porte et le chef", texte: `**Le sens moral** est une jauge, du **rouge** (exclure, trahir) au **bleu** (accueillir, aider). Chacun voit **sa propre couleur** ; celle des autres, on ne la connaît que par leur **réputation**, ce que les témoins ont vu et répété (et qui peut être faux). Le MJ peut changer qui voit quoi.

- Exclure quelqu'un pousse vers le rouge, l'accueillir vers le bleu, **même avec des circonstances atténuantes** (plus de place, plus de nourriture) : elles ne changent que le jugement des témoins qui savaient.
- Trahir pousse loin vers le rouge ; colporter du mal sur quelqu'un, mentir quand une marque ou un témoin vous dément, aussi.
- **Aucune couleur n'est gratuite.** Le bleu attire les réfugiés : des bouches en plus. Le rouge fait fuir les gens de bien (dans un groupe rouge, un bleu se sent de moins en moins à sa place) et attire les durs.

**La porte.** L'abri affiche **ce qui lui manque vraiment**, d'après ses stocks : c'est la liste à la porte, le prix d'entrée. Quand quelqu'un frappe, le groupe accueille ou refuse ; le chef peut trancher seul ou demander un **vote**, et celui qui a voté contre une trahison ne rougit pas avec les autres. Le refusé peut partir sans rancune, revenir avec ce qui manque pour gagner sa place, ou, rancunier, allumer un feu près du camp pour y attirer les menaces. Le groupe qui prend ce qu'il apporte puis le renvoie rougit ; lui, on dit qu'il a de la chance ensuite.

**Le chef et son autorité.** L'**autorité** dit à quel point un chef est obéi. Elle monte quand il tient parole et que tout le monde mange, elle tombe quand on a faim ou qu'il ignore un vote. Trop basse : des désertions, une scission, un renversement. Un chef très écouté donne un dé de plus à la défense de l'abri ; un chef qu'on n'écoute plus en coûte un.

**Les enfants regardent.** Un enfant témoin imite ce qu'il voit, ou s'en révolte, selon ce qu'il sait faire. Révolté, il peut un jour vouloir partir, pour se venger ou pour fonder un ailleurs meilleur, et des adultes peuvent l'y aider en douce.

**Les autres groupes.** Un chef de bande décide selon son propre sens moral : attaquer, négocier, passer son chemin pour fonder ailleurs, poser un ultimatum (qui devient un tribut, puis une alliance ou une révolte), ou demander à rejoindre. Deux groupes peuvent se séparer (on partage les stocks, chacun garde les plans, l'abri va à l'un des deux) ou se fondre en un seul.` }
];

export const PAGES_MJ_ESPRIT = [
  { cle: "esprit-et-sens-moral", titre: "Mener l'esprit et le sens moral", texte: `Le système tient les jauges ; vous racontez ce qu'elles veulent dire. Tout se règle dans la **fenêtre du MJ**, onglet **Communauté**, et sur la **fiche de survivant** (regard, religion ou ancrage, pratique, sens moral, réputation, autorité, chance).

# Pas de magie, jamais

La foi agit par le moral. Un objet que le cyclone a laissé dans la cour, une chance inespérée après une trahison : le personnage peut y voir un signe, vous pouvez le laisser y croire, **le jeu ne confirme rien**. Ne décrivez jamais un miracle ; décrivez quelqu'un qui reprend courage.

# Celui qui lâche

Les signes viennent avant (table « celui qui lâche ») : faites-les voir aux joueurs, avec tact. Le groupe le retient par sa présence : rester à l'abri, être plusieurs, s'entendre. Si un compagnon ou un PNJ part, c'est **un matin, il n'est plus là** : aucune scène, rien de montré, pas de corps. Pour un personnage de joueur, le système vous prévient seulement (« au bord ») : c'est une conversation avec son joueur, pas un jet.

# Le sens moral

- La jauge bouge avec les actes, même excusés ; la **réputation** bouge avec ce que les témoins ont vu et compris. Les circonstances atténuantes n'adoucissent que la réputation.
- **Qui voit quoi** : réglage « Visibilité du sens moral » (chacun la sienne, par défaut ; tout le monde ; seulement le MJ). Foundry envoie les fiches à tous les navigateurs : ce n'est pas un coffre-fort.
- **La rumeur** (le Ladi Lafé) colporte les réputations, vraies ou fausses ; celui qui colporte du mal rougit lui aussi. Le système en offre le point d'entrée (acte « colporter »).
- **La porte** : les visiteurs arrivent d'eux-mêmes (plus le groupe est bleu, plus il en vient ; plus il est rouge, plus ce sont des durs). Vous voyez leur vraie couleur, les joueurs non. Ce qu'ils deviennent après un refus dépend d'eux : le feu du rancunier n'est pas annoncé comme tel, le retour du refusé l'est.

# Les chefs

- Le **chef de bande PNJ** décide selon son sens moral (fenêtre du MJ : la décision s'affiche avec la menace). Vous pouvez la suivre ou la changer. Un ultimatum accepté devient un **tribut** : le système vous dit quand il tombe ; payé quatre fois à une bande qui n'est pas rouge, il devient une alliance ; une bande rouge augmente sa demande, et pousse à la révolte.
- Le **chef joueur** reste maître de ses choix. Proposez-lui de demander un **vote** quand la question divise ; s'il passe outre, son autorité baisse, et le système vous le rappelle quand elle devient dangereuse (désertions, scission, renversement : à vous de les mettre en scène).
- **Séparer** ou **fondre** deux groupes se fait d'un clic : les stocks se partagent au prorata, les plans restent à tous, l'abri va à l'un des deux.

# Le ton

Les religions, les ancrages, les préjugés sur la foi des autres (le « service » malbar qui fait peur, l'Apocalypse des uns, le volcan des Pèlerins) sont ceux des personnages. Le jeu les traite toutes de la même façon : aucune religion, aucune origine ne donne de bonus ni de malus.` }
];
