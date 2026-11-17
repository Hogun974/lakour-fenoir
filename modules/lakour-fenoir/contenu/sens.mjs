// Percevoir dans le noir, le vent et la pluie (lot « sens », 2026-11-17 ; familles 4 et 11 du complément de Fénoir 3D) : les tables
// du MJ, le journal du MJ « Percevoir dans le noir », une page du guide du joueur et une page du livre de l'île. Les règles sont dans
// le système (logique/sens.mjs ; contrat §18 ; chiffres : docs/equilibre-sens.md) ; ici, le texte. Rien de magique : les contes sont
// des règles de prudence, la Timise est un oiseau, et le jeu ne confirme aucune croyance.
import { table, journal, MODULE, sansBalises } from "./aides.mjs";
import { REGIONS } from "./monde.mjs";
import { BESTIAIRE } from "./bestiaire.mjs";

const T = (cle, nom, description, resultats) => {
  const t = table({ cle, nom, description, resultats });
  Object.assign(t.flags[MODULE], { sens: cle });
  return t;
};

// ---------------------------------------------------------------- La pluie d'une région (même formule que logique/sens.mjs)
// 30 % par quart en saison des pluies, 10 % en saison sèche, pour 1 500 mm l'an ; × (mm / 1 500)^0,8 ; entre 2 % et 90 %. Les mm
// d'une région vont des Bas (au niveau de la mer) aux Hauts (1 200 m et plus), selon son altitude.
export const pluieDeRegion = r => {
  const { bas, hauts } = r.climat?.pluieAn ?? { bas: 1500, hauts: 1500 };
  return Math.round(bas + (hauts - bas) * Math.min(1, Math.max(0, (Number(r.altitude) || 0) / 1200)));
};
export const chanceParQuart = (mm, saison) => Math.min(0.9, Math.max(0.02, (saison === "seche" ? 0.1 : 0.3) * Math.pow(mm / 1500, 0.8)));
const pct = x => `${Math.round(x * 100)} %`;

// ---------------------------------------------------------------- Tables
const ENTENDRE = [
  "Le vent d'abord, toujours : dans les filaos, sous les tôles, dans les feuilles de bananier. Il couvre tout, puis tombe d'un coup.",
  "Les grenouilles de la ravine, des centaines, qui chantent comme une seule. Tant qu'elles chantent, rien de gros ne passe près d'elles.",
  "Les grillons, et les margouillats qui claquent sur les murs (*tchik, tchik*) : le bruit ordinaire d'une nuit de La Réunion.",
  "Un tangue qui fouille les feuilles mortes en reniflant. On croit à des pas ; c'est une petite bête rayée qui cherche des vers.",
  "Un cri d'enfant, long, qui monte et retombe du côté des remparts. La Timise, le pétrel noir. Celui qui n'a pas encore l'habitude du noir ne le sait pas.",
  "Un chien, très loin, qui aboie trois fois puis se tait d'un coup.",
  "La ravine qui gronde plus fort que tout à l'heure : il a plu là-haut. Demain, le radier sera peut-être sous l'eau.",
  "Des pas qui traînent sur le bitume, réguliers, sans hâte. Un Livide errant. Il ne sait pas que vous êtes là.",
  "Le coq du voisin, à trois heures du matin, qui se trompe d'heure comme avant.",
  "Rien. Le silence complet, d'un coup. Ce n'est pas bon signe (table « La nuit — les signes »)."
];
const SIGNES = [
  "Les grenouilles se taisent d'un coup, et les insectes avec : un trou de silence qui avance dans la ravine. Une horde passe (le système le dit quand c'est le cas).",
  "Le silence se fait par vagues, d'abord au loin, puis plus près : quelque chose remonte le chemin, et c'est beaucoup.",
  "Les oiseaux d'un manguier s'envolent tous ensemble, en pleine nuit, en criant.",
  "Une odeur douceâtre et lourde, portée par le vent : un corps. Un Livide des Bas qui se défait, ou un cabri crevé dans la ravine ; une fois sur deux, c'est une bête, et l'on a eu peur pour rien.",
  "Les chiens de l'abri grognent bas, le nez vers le même coin de nuit, et n'aboient pas.",
  "Plus un bruit de pas ni de voix dans la case d'à côté, alors qu'il y en avait hier soir.",
  "Une lumière qui s'éteint sur la crête d'en face, juste au moment où l'on regarde.",
  "Les grenouilles chantent, les grillons aussi, le vent passe : une nuit ordinaire. On peut dormir."
];
const VENT = [
  "Un cari au feu de bois, quelque part sous le vent : un abri habité, à moins de cent mètres.",
  "La fumée froide d'un fumoir : de la viande boucanée. Quelqu'un a de quoi manger.",
  "L'odeur d'un corps, lourde et sucrée. À vous de savoir si c'est un Livide, un mort ou une bête.",
  "Le poulailler, le bouc, le fumier : des bêtes enfermées, donc des gens pour les garder.",
  "Le rhum d'une distillerie abandonnée, les cuves ouvertes : on le sent à des centaines de mètres.",
  "Le savon, le linge propre : un groupe qui tient, et qui se lave.",
  "Le gazole, l'huile chaude : un moteur a tourné il y a peu.",
  "Rien du tout : le vent vient de la mer, il n'apporte que le sel."
];
const CONTES = [
  "« Rentre avant la nuit, ou Granmèr Kal viendra te prendre. » Ce qu'il faut entendre : on ne traîne pas dehors quand on n'y voit plus.",
  "« *Siffle pa la nuit.* » (Ne siffle pas la nuit.) Ça appelle ce qui rôde, disent les anciens. Ce qu'il faut entendre : la nuit, le moindre bruit porte.",
  "« Si on t'appelle par ton nom dans le noir, ne réponds pas. » Ce qu'il faut entendre : on ne crie pas, on ne se signale pas.",
  "« Ne laisse pas la lampe à la fenêtre, les esprits la voient de loin. » Ce qu'il faut entendre : une lumière se voit à des centaines de mètres.",
  "« Quand la Timise pleure, fais silence. » Ce qu'il faut entendre : quand quelque chose crie dans la nuit, on se tait et on écoute.",
  "« *Ravine i na faim.* » (La ravine a faim.) On ne dort pas dans son lit après la pluie. Ce qu'il faut entendre : une ravine sèche se remplit en un quart d'heure.",
  "« Ne mange pas dehors le soir, l'odeur appelle. » Ce qu'il faut entendre : la cuisine se sent de loin, sous le vent.",
  "« Les grenouilles savent avant toi. » Ce qu'il faut entendre : quand elles se taisent, quelque chose passe."
];
const INTRIGUE = [
  "Il s'arrête, tourne la tête vers le bruit, et reste là une longue minute. Puis il repart, dans l'autre sens.",
  "Il marche vers le bruit, au pas, sans hâte. Arrivé là où il n'y a rien, il tourne en rond, puis se lasse.",
  "Il bute contre la clôture, recommence, recommence encore ; au bout d'un moment, il la longe pour chercher un passage.",
  "Il renifle, la tête levée, et dérive lentement sous le vent : il suit l'odeur, pas le bruit.",
  "Il s'arrête devant la case, longtemps. Il n'a rien vu. S'il entend encore un bruit de dedans, il frappe.",
  "Deux autres le suivent sans avoir rien perçu eux-mêmes : l'éveil passe de l'un à l'autre, comme une onde.",
  "Il passe à trois pas de vous sans vous voir : c'est un Livide des Hauts, ses yeux sont morts de froid.",
  "Il vous voit. Il n'est plus intrigué : il charge, ou il gémit, et les autres viennent."
];
const RAVINE = [
  "L'eau monte d'un mètre en dix minutes, couleur de café au lait, chargée de branches : le radier est infranchissable jusqu'à demain.",
  "La ravine sèche de l'Ouest coule pour la première fois depuis des semaines ; les vasques sont pleines, l'eau est boueuse (à filtrer).",
  "La prise d'eau de la pico-hydro est bouchée de galets et de feuilles : il faudra la dégager à la main (un quart de bricolage).",
  "Un Livide emporté par la crue est coincé dans les branches d'un vacoa, plus bas. Il bouge encore.",
  "Le gué qu'on passait à pied sec a changé de place : la crue a déplacé les galets.",
  "L'eau a déposé sur la berge un bidon, une glacière, une chaise en plastique, des planches : de quoi récupérer.",
  "Les bichiques remontent la ravine après la crue (à l'embouchure, en saison) : de quoi pêcher.",
  "La ravine se tait d'un coup : un éboulis l'a barrée plus haut. Elle rompra le barrage dans la nuit, ou demain."
];
const MUSIQUE = [
  "Un kayamb, tout bas, sous la varangue : un séga lent que tout le monde connaît. Personne ne chante, mais on bat la mesure du pied.",
  "Une guitare grave, après la mort d'un des vôtres : quelques accords, toujours les mêmes, jusqu'à tard.",
  "Un maloya à voix basse, un seau retourné pour roulèr : un repos donné, le 20 décembre, ou une nuit qui compte.",
  "Un bobre, l'arc musical, sa corde et sa calebasse : un ancien qui joue pour lui seul.",
  "Une chanson tamoule, une chanson chinoise, une chanson de Madagascar : chacun la sienne, et on finit par les apprendre.",
  "Le séga à pleine voix, les mains qui claquent : ça fait du bien, et ça s'entend jusqu'à la route (bruit +3).",
  "Un harmonica qu'on se passe de main en main ; chacun ne connaît qu'un air.",
  "Personne ne joue ce soir. Nouvelle lune : on écoute le souffle des autres, et les pas, dehors."
];

export const TABLES_SENS = [
  T("nuit-ce-qu-on-entend", "La nuit — ce qu'on entend", "Les sons de base du noir : d'abord le vent, puis la faune et les insectes. Ce qu'on imagine fait le reste.", ENTENDRE),
  T("nuit-les-signes", "La nuit — les signes", "L'alarme naturelle et les fausses alertes. Quand une horde entre vraiment dans la région, le système le dit (les grenouilles se taisent).", SIGNES),
  T("ce-que-porte-le-vent", "Ce que porte le vent", "Une odeur que le vent apporte. Le vent change à chaque quart ; un humain ne sent guère que la cuisine, la fumée, les bêtes et les corps.", VENT),
  T("contes-des-anciens", "Les contes des anciens", "Ce que racontent les gramounes à la veillée : des règles de prudence déguisées. Les personnages y croient ou non ; le jeu ne dit rien de plus.", CONTES),
  T("livide-intrigue", "Un Livide intrigué — ce qu'il fait", "Un Livide a perçu un bruit ou une odeur, sans rien voir : ce qu'il fait ensuite. Il ne charge que s'il voit, ou s'il sent un vivant tout près.", INTRIGUE),
  T("ravine-apres-la-pluie", "La ravine après la pluie", "Ce que la ravine devient quand il a plu dans ses Hauts.", RAVINE),
  T("musique-du-soir", "La voix de l'île — musique du soir", "Ce qui se joue le soir à l'abri. La musique remonte le moral, et elle s'entend.", MUSIQUE)
];

// ---------------------------------------------------------------- Le journal du MJ « Percevoir dans le noir »
const nomPerception = p => [
  `vue ${p.vue === 0 ? "nulle (aveugle)" : p.vue >= 1 ? "d'un vivant" : p.vue < 0.5 ? "mauvaise" : "moyenne"}`,
  `ouïe ${p.ouie > 1 ? "fine" : "ordinaire"}`,
  `odorat ${p.odorat > 0 ? "oui" : "aucun"}`,
  ...(p.froid ? ["figé par le froid des nuits au-dessus de 400 m"] : []),
  p.obstacle === 0 ? "cherche un autre passage tout de suite" : `frappe un obstacle ${p.obstacle} fois avant de chercher un autre passage`,
  ...(p.attaques > 1 ? [`${p.attaques} attaques`] : [])
].join(", ");
const LIVIDES = BESTIAIRE.filter(b => b.categorie === "livide" && b.perception);

const PAGES_MJ = [
  { cle: "portees", titre: "Ce qui trahit, et de quelle distance", texte: `Le jour, on voit. La nuit, on écoute et on sent. Ce tableau dit ce que perçoit qui, et de quelle distance : il sert à décrire, et à décider si un Livide (ou une bande) a perçu le groupe. Le système, lui, garde ses paliers de **bruit** et de **visibilité** de l'abri, et y ajoute une **odeur** (page « L'odeur et le vent »).

# Le bruit
- Un bruit porte **10 m** au palier 1 (des pas, une porte), **30 m** au palier 2 (une hache, une voix forte), **90 m** au palier 3 (un moteur, un cri, de la musique à pleine voix), **270 m** au palier 4 (un coup de feu, un groupe électrogène, des pétards).
- La voix : **chuchoter 3 m, parler 20 m, crier 60 m**. Un Livide entend un cri à **90 m**.
- La pluie ôte 60 % à l'ouïe ; un mur divise un bruit par deux ; une crête par trois.

# La vue
- Une torche se voit à **150 m** la nuit ; un feu à **400 m**.
- Une silhouette debout se voit à **3 m** dans le noir, **70 m** en plein jour. La pleine lune donne à peu près **18 % du jour** (une douzaine de mètres) ; les nuages en ôtent presque tout.
- Tapi, on se voit trois fois moins ; immobile, un tiers de moins ; en courant, un tiers de plus. La brume des Hauts et la pluie ôtent la moitié de la vue, ou plus.

# L'odeur
- Un vivant se sent à **6 m**, le sang à **25 m**, une souillure à **30 m**, un cadavre à **60 m**, une cuisine à **80 m**, un feu à **120 m**.
- Le vent **double** l'odeur sous le vent et la ramène au cinquième **au vent**. Dans les Hauts, l'air froid la porte trois fois moins loin. La pluie l'efface (−60 %).
- **Pour un humain**, seule l'odeur d'un cadavre aide vraiment, et pas au début (un Livide frais ne sent pas encore). Une bête morte trompe le nez : fausse alerte.` },
  { cle: "eveil", titre: "Percevoir n'est pas voir : les cinq états d'un Livide", texte: `Un Livide est dans l'un de cinq états. Décrivez l'état ; le système ne le suit pas, il sert à mener une approche ou une fuite.

- **Figé** : immobile, la tête basse, il ne réagit qu'à ce qui le touche presque. Les Livides des Hauts le sont au froid des nuits au-dessus de 400 m.
- **Errant** : il marche sans but, s'arrête, repart, prend la pente qui descend.
- **Intrigué** : il a perçu un bruit, une lumière ou une odeur, **sans rien voir**. Il va voir, **au pas** (table « Un Livide intrigué — ce qu'il fait »). Arrivé là où il n'y a rien, il se lasse vite.
- **En poursuite** : il a **vu** quelqu'un, ou il **sent un vivant à moins de 8 m** (c'est ce qui fait chasser un Livide aveugle). Il charge, à l'allure de sa sorte.
- **Acharné** : il frappe une porte, une tôle, une palissade **parce qu'un vivant est derrière** : on l'a vu entrer, ou l'on fait encore du bruit dedans. Le siège cesse peu après le dernier signe de vie.

**L'éveil court de proche en proche.** Celui qui ne perçoit rien suit un voisin éveillé : la foule se met en marche comme une onde, et retombe de même. Un bruit unique, bref, n'amène que quelques intrigués ; un bruit qui dure (une hache, un moteur, une musique) les amène tous.

**À la table.** Un bruit, une lumière ou une odeur ne déclenchent pas un assaut : ils amènent des Livides intrigués, qui arrivent au pas. C'est le moment de se taire, d'éteindre, de se mettre au vent, ou de partir. Un test de **discrétion** décide si l'on passe ; un test de **vigilance** si l'on a entendu venir.` },
  { cle: "sens-des-livides", titre: "Les sens de chaque Livide", texte: `Chaque sorte perçoit à sa façon. Pour approcher ou fuir un Livide, le test de **discrétion** (normale) gagne ou perd des dés selon sa sorte (le système le calcule : approche({ creature, vent, bruit })) :

- **+1** s'il voit mal et qu'il fait jour (Livide des Hauts, noyé) ; **+1** contre un aveugle si l'on ne fait aucun bruit, **−1** si l'on en fait ;
- **−1** contre un Livide qui voit comme un vivant (le coureur) ;
- **−1** de plus contre une ouïe fine si l'on fait du bruit ;
- **−1** si le vent lui porte votre odeur, **+1** si vous êtes au vent de lui (sauf contre un Livide sans odorat) ;
- **+2** contre un Livide figé par le froid, la nuit, au-dessus de 400 m : on passe entre eux, en silence ;
- jamais plus de 2 dés dans un sens ou dans l'autre.

${LIVIDES.map(b => `- **${b.nom}** : ${nomPerception(b.perception)}.`).join("\n")}

**Devant un obstacle.** Le coureur cherche un passage tout de suite ; les autres frappent d'abord, le brûlé jusqu'à cinq fois. Une palissade qui tient ne les arrête pas longtemps : ils la longent.` },
  { cle: "corps", titre: "Les corps se défont", texte: `La plupart des Livides se sont relevés dans les trois premières semaines. Leur corps suit la règle du monde :

- **Dans les Bas** (moins de 400 m), la chaleur humide les défait : **frais** jusqu'à une vingtaine de jours, **desséchés** jusqu'à deux mois, puis **en lambeaux**.
- **Dans les Hauts**, le frais les garde : frais un mois et demi, puis desséchés, **jamais** en lambeaux.
- Frais, ils marchent d'un bon pas ; desséchés, un cinquième plus lentement ; en lambeaux, à peine plus vite qu'à moitié.

Le système dit l'état des Livides de la région où est le groupe (fenêtre du MJ, bloc « Les sens »). C'est aussi ce qui vide les Bas au fil des mois, et garde aux Hauts leurs vieux Livides, lents et durs.` },
  { cle: "odeur-et-vent", titre: "L'odeur et le vent", texte: `**Le vent** change à chaque quart, pour toute l'île, autour des alizés : il souffle presque toujours vers l'ouest ou le nord-ouest, plus fort en saison sèche, plus faible le soir et la nuit. Le bandeau et la fenêtre du MJ disent où il porte.

**L'odeur de l'abri** (de 0 à 4) dit ce qui sent au-delà d'un groupe ordinaire. Elle monte avec :
- une **cuisine commune** au feu de bois (la gazinière cuit sans fumée et ne compte pas), un **séchoir et fumoir**, une **basse-cour**, un **enclos à cabris** (deux points au plus pour les installations) ;
- la **souillure** (un abri surpeuplé, en attendant les règles d'hygiène) ;
- le **sang** (un blessé qu'on soigne dehors, une bête qu'on abat : au MJ de le dire).

Elle baisse d'un point **dans les Hauts** (l'air froid la porte peu) et d'un point les jours où il pleut la moitié du temps.

**Ce qu'elle fait.** Chaque point ajoute **2 %** par jour aux chances qu'une horde de la région trouve l'abri, et **1 %** à celles des Livides errants. Les **bêtes** (chiens errants) sentent aussi les **morts laissés sans repos** près de l'abri, depuis moins de quinze jours : un point de plus pour elles, et chaque point ajoute 0,5 % par jour aux chiens errants. Les Livides, eux, ignorent l'odeur d'un corps.

**Sous le vent.** L'odeur porte du côté où va le vent : c'est de là que viennent les Livides intrigués. Un groupe qui approche un abri par le côté sous le vent le sent avant de le voir (table « Ce que porte le vent »).` },
  { cle: "habitude-du-noir", titre: "S'habituer au noir", texte: `Le corps s'habitue au noir, nuit après nuit, et cette habitude meurt avec le survivant.

- **Ce qui compte** : une nuit passée **debout dans le noir**, sans lumière sur soi ni à côté : en route la nuit, ou de **garde** à un abri qui n'est pas éclairé. Dormir ne compte pas. Le système compte seul ces nuits ; le MJ en ajoute une pour un bivouac ou une nuit dehors (fenêtre du MJ, « L'habitude du noir »).
- **Les paliers** :
  - **2 nuits** : l'oreille sait **d'où** vient un bruit, et ne prend plus la Timise pour un enfant ;
  - **6 nuits** : elle juge **la distance** (proche, à mi-portée, loin) : **+1 dé en vigilance la nuit dehors** (la nuit et l'habitude ensemble ne donnent jamais plus de +1) ;
  - **14 nuits** : elle reconnaît **ce qui marche** : un vivant, un Livide, une horde (dites-le au joueur) ;
  - **30 nuits** : **l'écoute active** : claquer la langue ou frapper du bâton dessine les murs et les vides : **+1 dé de plus**, mais c'est un bruit qu'un Livide proche entend.
- **Allumer** une torche, une lampe, un feu fait perdre un palier jusqu'à la fin de la nuit, et cette nuit-là ne compte pas.
- **Fermer les yeux** : n'importe qui gagne **+1 dé** à l'écoute (vigilance), mais ne fait rien d'autre ce tour-là : ni marcher, ni frapper, ni fouiller.

Au test : test({ …, dehors: true, ecoute: "yeux-fermes" | "active" }) ; le système ajoute lui-même le palier, la nuit, la pluie et la brume.` },
  { cle: "signes-de-la-nuit", titre: "Les signes de la nuit : grenouilles, Timise et contes", texte: `**L'alarme naturelle.** Grenouilles et insectes se taisent là où passent les Livides. Quand une horde entre dans la région du groupe, le système écrit au journal (une fois par horde) : « les grenouilles se sont tues ». Celui qui a l'habitude du noir au troisième palier entend aussi les pas sous le silence. Un trou de silence qui avance annonce une horde ; un silence qui ne bouge pas, c'est peut-être un chat.

**La Timise.** Le pétrel noir crie la nuit, et son cri ressemble à un gémissement d'enfant ou de Livide. Certaines nuits, le système l'écrit au journal : ceux qui ont l'habitude du noir le reconnaissent, les autres n'osent pas sortir. Mois après mois, l'île éteinte rend la nuit aux pétrels : on l'entend de plus en plus souvent, surtout dans les Hauts, les cirques et les forêts. Les anciens disent que c'est Granmèr Kal qui pleure ; d'autres que c'est un oiseau. C'est un oiseau. Le conte avait raison quand même : la nuit, on rentre.

**Les contes des anciens** (table « Les contes des anciens ») sont des règles de prudence déguisées : rentrer avant la nuit, ne pas siffler, ne pas répondre quand on vous appelle, ne pas laisser de lampe à la fenêtre, se méfier de la ravine après la pluie. Une gramoune qui les raconte à la veillée apprend aux plus jeunes à vivre la nuit ; les personnages y croient ou non, le jeu ne confirme rien.

**Les faux bruits** du moral bas (« L'esprit — les faux bruits de la nuit ») se mêlent à tout cela : à vous de laisser planer le doute.` },
  { cle: "pluie-et-ravines", titre: "La pluie, la brume et les ravines", texte: `**Chaque région a son ciel.** À chaque quart, il pleut ou non, selon les pluies d'une année de la région : environ 30 % des quarts en saison des pluies et 10 % en saison sèche pour 1 500 mm l'an, plus à l'Est et dans les Hauts, beaucoup moins à l'Ouest. Le temps vient de la mer pour tous : quand il pleut quelque part, il pleut souvent ailleurs aussi. Pendant de fortes pluies, une crue ou un cyclone, il pleut toujours.

${REGIONS.map(r => { const mm = pluieDeRegion(r); return `- **${r.nom}** : ${mm} mm l'an ; il pleut ${pct(chanceParQuart(mm, "pluies"))} des quarts en saison des pluies, ${pct(chanceParQuart(mm, "seche"))} en saison sèche.`; }).join("\n")}

**Dehors sous la pluie ou dans la brume** : on entend et l'on voit mal (**−1 dé en vigilance**), on passe mieux inaperçu (**+1 dé en discrétion**). La pluie couvre aussi le ciel la nuit, et efface l'odeur de l'abri les jours où elle dure.

**La brume** monte au-dessus de **1 000 m** l'après-midi et le soir.

**Les ravines.** Certaines coulent toujours, plus ou moins fort ; d'autres ne coulent que quand il a plu dans leurs Hauts, dans les deux jours d'avant. Le système suit la ravine d'un abri bâti au bord de l'eau :
- **à sec** (une ravine temporaire, comme celle de la Grande Chaloupe) : la pico-hydro s'arrête, l'eau du site tombe au quart (les vasques qui restent) ;
- **basse** (une ravine permanente, en saison sèche, deux jours sans pluie là-haut) : la pico-hydro donne les trois quarts ;
- **en crue** (fortes pluies, crue, cyclone dans la région) : la pico-hydro s'arrête (on ferme la prise d'eau), les radiers et les gués sont sous l'eau (les routes coupées le disent).

Table : « La ravine après la pluie ».` },
  { cle: "rue-nettoyee", titre: "Une rue nettoyée se repeuple", texte: `Abattre les Livides d'un lieu le rend calme un temps, puis les errants des alentours y reviennent, à peu près **7 % par jour**. Vingt Livides abattus tiennent une rue calme une quinzaine de jours.

Dans la fenêtre du MJ (« Un lieu nettoyé ») ou par nettoyer({ region, site, tues }) : les rencontres des fouilles **à cet endroit** baissent, jusqu'à **un quart** de la normale juste après vingt Livides abattus, puis remontent peu à peu (les trois quarts au bout de deux semaines, presque tout au bout d'un mois). Le reste de la région n'en sait rien.` },
  { cle: "voix-de-l-ile", titre: "La voix de l'île et la musique", texte: `**Chaque région a sa voix**, ce qu'on entend quand il n'y a rien : le ressac et les filaos sur le littoral, le vent dans les tamarins des Hauts, l'écho des remparts dans les cirques, le grondement près du volcan, la pluie dans les fanjans des forêts. Le système la donne avec le temps du quart.

**Les moments de musique** (le système en propose un au narrateur) :
- le **maloya** après qu'on a donné le repos à un mort, le **20 décembre**, et la première nuit où l'abri devient autonome ;
- la **guitare du soir** suit la journée : grave après une mort, vive après une récolte ;
- le **séga** des bons jours, fêtes et marchés, s'entend de loin, et il attire ;
- la nuit de **nouvelle lune**, la musique se tait : il ne reste que le souffle et les pas ;
- le **roulèr** bat pendant un combat.

**Jouer pour de vrai.** Un survivant qui joue (un kayamb, un bobre, une guitare, un harmonica, un seau retourné) fait une **veillée en musique** : **+1 moral** à tout le groupe, au plus une fois par semaine, et du **bruit** : +1 pour un air tout bas, +3 à pleine voix avec le roulèr. Celui dont l'**ancrage** est un instrument et qui le pratique joue chaque soir, tout bas : son abri fait toujours **un peu de bruit** (+1). Il le sait, et il joue quand même.

Table : « La voix de l'île — musique du soir ».` },
  { cle: "systeme", titre: "Ce que fait le système", texte: `- **Chaque quart** : la pluie et la brume là où est le groupe, le vent de l'île (bandeau : « averse », « brume » ; fenêtre du MJ : bloc « Les sens »). Une nuit où il pleut a le ciel couvert.
- **Chaque jour** : la ravine d'un abri au bord de l'eau (pico-hydro, eau du site), l'odeur de l'abri (menaces de hordes, de Livides errants, de chiens), le musicien.
- **Chaque nuit** : l'habitude du noir de ceux qui veillent sans lumière (avancer({ lumiere: true }) : l'abri reste éclairé ; lumiereEnRoute: true : on marche à la torche), les grenouilles qui se taisent quand une horde arrive, la Timise.
- **Les tests dehors** : la nuit, la chaleur, la pluie, la brume, l'habitude du noir, l'écoute (ecoute).
- **Les fouilles** : un lieu nettoyé a moins de rencontres.
- **API** : sens(), approche({ creature, vent: "vers-lui" | "vers-moi", bruit }), noir({ acteurId, action: "lumiere" | "nuit" | "regler", nuits }), nettoyer({ region, site, tues }), jouer({ musiciens, air: "doux" | "fort" }).` }
];
export const JOURNAL_SENS = journal({ cle: "percevoir-dans-le-noir", nom: "Percevoir dans le noir", pack: "mj", pages: PAGES_MJ });

// ---------------------------------------------------------------- Une page du guide du joueur
export const PAGES_JOUEUR_SENS = [
  { cle: "la-nuit-et-les-sens", titre: "La nuit, le vent et la pluie", texte: `La nuit, on ne voit plus : on écoute et on sent. Le corps s'y habitue.

- **L'habitude du noir.** Chaque nuit passée debout dans le noir, en route ou de garde sans lumière, compte. Après 2 nuits, on sait d'où vient un bruit ; après 6, à quelle distance (+1 dé de vigilance la nuit dehors) ; après 14, ce qui marche ; après 30, on peut écouter activement (claquer la langue, frapper du bâton : un dé de plus, mais du bruit). Allumer fait perdre l'habitude jusqu'à la fin de la nuit. Elle meurt avec vous.
- **Fermer les yeux** donne un dé de plus pour écouter, mais on ne fait rien d'autre.
- **La pluie et la brume** couvrent les pas : un dé de moins pour guetter, un de plus pour passer inaperçu.
- **L'odeur.** La cuisine au feu de bois, le fumoir, les bêtes, la saleté, le sang se sentent de loin, surtout sous le vent. Les Livides la suivent ; les chiens errants aussi, et eux sentent les morts qu'on n'a pas honorés. Les Hauts et la pluie l'étouffent.
- **Le vent** change à chaque quart, presque toujours vers l'ouest : regardez de quel côté porte votre abri.
- **Les signes.** Quand les grenouilles se taisent d'un coup, quelque chose passe. Le cri d'enfant dans la ravine est un oiseau, la Timise, presque toujours.
- **Les ravines** se remplissent en un quart d'heure quand il a plu là-haut. Celles de l'Ouest restent souvent à sec.
- **La musique** remonte le moral, et elle s'entend de loin.` }
];

// ---------------------------------------------------------------- Une page du livre de l'île
export const PAGE_LIVRE_SENS = { cle: "la-nuit-et-ses-voix", titre: "La nuit et ses voix", texte: `La nuit, ce sont les oreilles qui vous gardent en vie. Plusieurs mains ont écrit ces pages, dans plusieurs abris.

> La première semaine, je n'ai pas dormi. Chaque bruit était un Livide. Le vent sous la tôle, un Livide. Le tangue dans les feuilles, un Livide. La troisième nuit de garde, j'ai compris que les grenouilles chantaient toute la nuit, et que tant qu'elles chantaient, je pouvais respirer.
> *Carnet d'un gardien de nuit, dans les Hauts de Saint-Paul.*

> Le cri, la première fois, on a cru à un enfant. Deux hommes sont descendus dans la ravine avec une lampe. Ils ne sont pas remontés. Ce n'était pas l'enfant qui les a eus : c'était la lampe. Le cri, c'était la Timise, le pétrel noir. Ma grand-mère disait que c'était Granmèr Kal qui pleure sur les enfants qui traînent dehors. Elle avait raison sur ce qui compte : on ne traîne pas dehors.
> *Écrit sur la page de garde d'un livre de messe.*

Ce que les anciens racontaient aux enfants, on le répète maintenant aux adultes : rentrer avant la nuit, ne pas siffler, ne pas répondre quand on vous appelle dans le noir, ne pas laisser de lampe à la fenêtre, ne pas dormir au bord de la ravine après la pluie. Personne n'a besoin de croire aux esprits pour obéir à ces contes. Les Livides suffisent.

> On a appris à sentir. Pas comme un chien : un humain ne sent presque rien. Mais un corps, ça se sent, lourd et sucré, à cinquante pas. Une fois sur deux, c'est un cabri crevé. On y va quand même, à pas lents, au vent.
> *Carnet d'une cueilleuse de zerbaz, à Salazie.*

Mois après mois, l'île s'est éteinte, et les pétrels sont revenus. On entend la Timise plus souvent qu'avant le jour zéro. Certains y voient un mauvais signe ; d'autres, la preuve que l'île tient encore. Le livre ne tranche pas.` };
