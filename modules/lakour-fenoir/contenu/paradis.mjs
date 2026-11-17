// Le paradis et son piège, et « rallumer l'île » (lot 9 du portage de Fénoir 3D, 2026-11-17 ; complément du jeu 3D, famille 5,
// décidée par Jordan, et « 4 quinquies » : rallumer l'île, décidé le 16 novembre ; le reste validé le 17 : « tout maintenant »).
// Les règles sont dans le système (logique/paradis.mjs ; contrat §28 ; chiffres : docs/equilibre-paradis.md) ; ici, le contenu :
// - trois installations : le puits d'air et de jour (sous terre), la haie de bambous et le rideau de filaos (sœurs lontan du
//   camouflage, qui poussent ; au cyclone, le bambou plie, le filao casse) ;
// - les chantiers de région (registre `chantiersRegion`) : rallumer une centrale, un phare, rouvrir une route, réparer un port ;
// - deux corvées de la ronde (la table de gestion du lot 10) ;
// - quatre tables, deux journaux du MJ, deux pages du guide du joueur.
// Ton : sobre. Les corps se disent par ce qu'il faut en faire, jamais par ce qu'on en voit.
import { installation, journal, table, MODULE } from "./aides.mjs";

// ---------------------------------------------------------------- Installations
// Le matériau des haies (lot 7) : bambou et vacoa, celui des installations lontan sans matériau dit, posé sur la définition.
const avecMateriau = docs => { for (const d of docs) if (["haie-de-bambous", "rideau-de-filaos"].includes(d.system.cle)) d.system.materiau = "bambou-et-vacoa"; return docs; };
export const INSTALLATIONS_PARADIS = avecMateriau([
  installation({ cle: "puits-de-jour", nom: "Puits d'air et de jour", categorie: "souterrain",
    description: `Un conduit percé jusqu'au jour depuis la galerie : d'abord un simple tuyau d'air coiffé d'un chapeau de tôle, puis un vrai puits, tubé, fermé d'une plaque de plexiglas ou d'un vieux pare-brise, qui descend un rond de soleil jusqu'en bas. L'air circule, la bougie se tient droite ; le jour tombe sur ceux qui ne remontent plus. Mais ce qui entre sort aussi : le soir, la lueur des lampes monte par le puits, avec la fumée et les voix.`,
    niveaux: [
      { cout: { materiaux: 2, travail: 4 }, requiert: { site: { souterrain: 1 } }, effets: { air: 1, discretion: -1 } },
      { cout: { materiaux: 3, pieces: 1, travail: 6 }, requiert: { site: { souterrain: 1 } }, effets: { air: 1, jour: 1, discretion: -1, visibilite: 1 } }
    ] }),
  // Les haies qui cachent : leur matériau (lot 7) fait leur part des dégâts du cyclone (passageCyclone) ; après lui, le bambou plie et
// se relève, le filao casse (haiesAuCyclone, logique/paradis.mjs). Fusion de la vague 3.
  installation({ cle: "haie-de-bambous", arbre: "lontan", role: "camouflage", rang: 1, nom: "Haie de bambous", categorie: "defense",
    description: `Des touffes de bambou arrachées dans la ravine et replantées serré autour de la cour, comme faisaient les anciens pour casser le vent. Il faut deux mois pour qu'elle ferme, trois pour qu'elle cache vraiment. Au cyclone, elle se couche, et se relève : elle ne casse pas.`,
    niveaux: [
      { cout: { ile: 2, travail: 4 }, effets: { discretion: 1, visibilite: -1, pousse: 60, plie: true } },
      { cout: { ile: 3, travail: 6 }, effets: { discretion: 2, visibilite: -2, pousse: 90, plie: true } }
    ] }),
  installation({ cle: "rideau-de-filaos", arbre: "lontan", role: "camouflage", rang: 2, nom: "Rideau de filaos", categorie: "defense",
    description: `Une rangée de jeunes filaos plantés en quinconce, qui chantent au vent comme ceux des plages. Ils montent vite : un mois, et l'abri se devine à peine. Mais le filao ne plie pas : au cyclone, il casse, et l'on voit à travers jusqu'à ce qu'il repousse.`,
    niveaux: [
      { cout: { ile: 1, graines: 1, travail: 3 }, effets: { discretion: 1, visibilite: -1, pousse: 30, casse: true } },
      { cout: { ile: 2, graines: 1, travail: 4 }, effets: { discretion: 2, visibilite: -2, pousse: 45, casse: true } }
    ] })
]);
// Pas de bras (§10.3) : elles marchent sans personne à la tâche (même forme que installations.mjs).
for (const i of INSTALLATIONS_PARADIS) for (const n of i.system.niveaux) n.effets.bras = null;

// ---------------------------------------------------------------- Les chantiers de région (registre)
// { cle, nom, region, type, travail (quarts-personne), cout, requiert, effets: { lumiere, electricite, routes, peche }, affaires, description }
export const CHANTIERS_REGION = [
  { cle: "relancer-la-centrale-de-langevin", nom: "Relancer la petite centrale de Langevin", region: "sud-sauvage", type: "centrale", travail: 90,
    cout: { materiaux: 8, pieces: 10 }, requiert: { savoirs: ["hydraulique-rurale"] }, effets: { lumiere: true, electricite: true },
    affaires: ["la-petite-centrale-de-langevin"],
    description: `Au fond de la ravine, la petite centrale attend qu'on dégage la prise d'eau, qu'on rebobine un alternateur et qu'on retende la ligne jusqu'à la Marine. Un travail de saison sèche, à plusieurs : la crue remonte vite. Fini, le Sud a du courant la nuit, sans bruit, et ses lumières se voient depuis la mer.` },
  { cle: "relancer-la-centrale-de-la-riviere-de-l-est", nom: "Relancer la centrale de la Rivière de l'Est", region: "est", type: "centrale", travail: 140,
    cout: { materiaux: 12, pieces: 16 }, requiert: { savoirs: ["hydraulique-rurale", "mecanique"] }, effets: { lumiere: true, electricite: true },
    description: `La grande centrale de l'Est s'est arrêtée seule, faute de bras. Il faut descendre au pied de la conduite, nettoyer les grilles, remettre une turbine en route et isoler le réseau pour n'éclairer que ce qui vit encore. Le plus long des chantiers, et celui qui allume tout l'Est.` },
  { cle: "rouvrir-la-route-du-littoral", nom: "Rouvrir la route du Littoral", region: "route-du-littoral", type: "route", travail: 160,
    cout: { materiaux: 10, carburant: 6 }, requiert: { savoirs: ["mecanique"] }, effets: { routes: ["saint-denis", "le-port"] },
    description: `Les éboulis de la falaise, les voitures abandonnées en travers, les filets arrachés : il faut tout dégager, pousser les épaves à la mer, étayer les pires endroits. Finie, la route ne se ferme plus qu'aux pires jours : après un éboulement, on passe encore, au pas.` },
  { cle: "rouvrir-la-route-des-tamarins", nom: "Rouvrir la route des Tamarins", region: "saint-paul", type: "route", travail: 120,
    cout: { materiaux: 6, carburant: 4 }, requiert: { savoirs: ["mecanique"] }, effets: { routes: ["saint-leu"] }, affaires: ["le-viaduc"],
    description: `Les viaducs de la route d'en haut sont bouchés d'épaves. Les Ferrailleurs y voient de la ferraille ; d'autres, une route. Il faut les pousser au fond des ravines, une à une, et garder la chaussée ouverte.` },
  { cle: "reparer-le-port-de-saint-pierre", nom: "Réparer le port de Saint-Pierre", region: "saint-pierre", type: "port", travail: 120,
    cout: { materiaux: 14, pieces: 4 }, effets: { lumiere: true, peche: 1 },
    description: `Dégager la passe, renflouer deux barques, réparer la chambre froide à la main et rallumer les feux de l'entrée : les pêcheurs du Sud ressortent. Fini, le port pêche (une part de plus chaque jour à qui y tient un abri, au MJ de la donner) et ses feux se voient du large.` },
  { cle: "rallumer-le-phare-de-bel-air", nom: "Rallumer le phare de Bel-Air", region: "sainte-marie", type: "phare", travail: 40,
    cout: { materiaux: 2, pieces: 4 }, effets: { lumiere: true },
    description: `Le vieux phare de Sainte-Marie n'a besoin que d'un panneau, d'une batterie et de quelqu'un pour monter là-haut. Il ne guide plus aucun bateau ; il dit seulement, chaque nuit, qu'il y a encore des vivants sur cette côte.` }
];

// ---------------------------------------------------------------- Les corvées de la ronde (table de gestion, lot 10)
const corvee = (cle, tache, nom, description) => ({ cle, nom, tache, description });
export const CORVEES_PARADIS = [
  corvee("faire-le-tour-de-la-cloture", "ronde", "Faire le tour de la clôture", "Longer la clôture et la haie, redresser ce qui penche, regarder ce qui a passé la nuit."),
  corvee("relever-les-traces", "ronde", "Relever les traces", "Suivre les herbes couchées et les pas dans la boue jusqu'au bout du chemin, et abattre ce qu'on trouve.")
];

// ---------------------------------------------------------------- Tables
const T = (cle, nom, description, resultats) => {
  const t = table({ cle, nom, description, resultats });
  Object.assign(t.flags[MODULE], { paradis: cle });
  return t;
};
export const TABLES_PARADIS = [
  T("ronde-ce-qu-on-trouve", "La ronde — ce qu'on trouve", `Quand la ronde voit les Livides à temps, elle relève aussi autre chose (le système donne le numéro ; sinon, tirez).`, [
    "Une fuite : la citerne suinte au pied, une auréole sombre dans la terre. Réparée aujourd'hui, elle ne coûte rien ; laissée, elle coûtera.",
    "Un pieu de la clôture penché, un fil arraché : quelque chose a poussé là, cette nuit, et n'est pas passé.",
    "Des traces fraîches dans la boue du chemin, qui tournent autour de l'abri et repartent vers la ravine. Trois, peut-être quatre.",
    "Une bâche du potager soulevée par le vent ; des poules qui ne sont pas rentrées.",
    "Un corps d'avant-hier que les chiens errants ont traîné jusqu'au bord du chemin. Il faudra l'enterrer plus loin.",
    "Un mot coincé sous une pierre, à l'entrée : quelqu'un est passé, a vu, et demande s'il peut revenir.",
    "La haie a un trou, au ras du sol, assez grand pour un chien, ou pour un enfant.",
    "Une vieille douille, toute neuve : quelqu'un a tiré près d'ici, hier soir. Ce n'était pas vous.",
    "Rien, sinon le silence des oiseaux quand on passe le long de la ravine. Ils savent quelque chose.",
    "Des fruits tombés que personne n'a ramassés, et un manguier qui charge : une bonne nouvelle, pour une fois."
  ]),
  T("sous-terre-la-bougie", "Sous terre — la bougie", `Ce que l'on remarque au fond de la galerie, quand on y vit depuis des jours.`, [
    "La flamme de la bougie penche toujours du même côté : l'air vient de là. On sait où creuser le puits.",
    "La flamme baisse le soir, quand tout le monde est rentré : on dort la tête lourde.",
    "Quelqu'un compte les jours sur le mur à la craie, et s'arrête : il ne sait plus si c'était hier ou avant-hier.",
    "Un enfant demande de quelle couleur est le ciel, aujourd'hui. Personne ne sait.",
    "Les voix portent loin dans la galerie : on se dispute à voix basse, ou pas du tout.",
    "Une goutte qui tombe, toujours au même endroit, toute la nuit. On finit par ne plus l'entendre, ou par ne plus entendre qu'elle."
  ]),
  T("ile-ce-qu-on-voit-la-nuit", "L'île — ce qu'on voit la nuit", `La nuit, d'un point haut, on regarde l'île. Tirez quand le groupe regarde au loin ; les régions rallumées se voient toujours.`, [
    "Rien. Le noir, d'un bout à l'autre, et la lune sur la mer.",
    "Une lumière fixe sur la côte, très loin : quelqu'un a du courant.",
    "Un feu qui bouge, sur une route des Hauts : un convoi qui roule tous phares éteints sauf un.",
    "Le phare, peut-être : un éclat, puis rien, puis un éclat.",
    "Une lueur rouge sur le volcan, qu'on regarde longtemps.",
    "Des lampes dans un îlet de Mafate, minuscules, à l'heure du repas.",
    "Une ville entière dans le noir, sauf une fenêtre.",
    "Vos propres lumières, si votre région est rallumée : de si loin, on dirait d'avant.",
    "Un incendie dans les cannes, qui court sur la pente.",
    "Deux lumières qui se répondent, d'une colline à l'autre, en clignant : quelqu'un se parle."
  ]),
  T("convoi-attire-par-la-lumiere", "Un convoi attiré par la lumière", `La lumière d'une région rallumée se voit de loin : il en vient du monde. Tirez qui arrive (la faction, le système la donne).`, [
    "Des camions qui s'arrêtent à distance, phares éteints, pour regarder un long moment avant d'approcher.",
    "Une bande qui vient « demander sa part » de ce courant qu'on a : elle en veut, ou elle veut tout.",
    "Des familles à pied, attirées comme des papillons : elles demandent seulement à rester près de la lumière.",
    "Des pillards qui ont compris qu'une région éclairée est une région qui a quelque chose à prendre.",
    "Des récupérateurs qui proposent un échange : leurs pièces contre une place sur le réseau.",
    "Un groupe armé qui s'installe dans un abri vide, juste à la limite de la lumière, et attend.",
    "Un vieux qui marche depuis trois jours, seul, parce qu'il a vu la lumière depuis les Hauts.",
    "Personne, cette fois : seulement un bruit de moteur, la nuit, qui s'arrête et repart."
  ])
];

// ---------------------------------------------------------------- Journaux du MJ
const PAGES_PARADIS = [
  { cle: "principe", titre: "Le paradis, et son prix", texte: `Le but d'une longue partie, pour qui s'enracine, c'est **le paradis** : un abri autonome où l'on vit bien, où l'on n'a plus à sortir. Le système le dit déjà (l'autonomie, l'autonomie complète des deux savoirs). Ce journal dit **son prix** : il faut le garder.

- **Plus on reste au même endroit, plus on attire les Livides** : c'est la **chaleur du lieu**. Elle se mesure en secret ; les joueurs n'en voient que des signes.
- **Des rondes** la tiennent : elles abattent ceux qui viennent. Une ronde manquée se paie : ceux qui arrivent restent, et s'agglutinent.
- **Les corps** que laissent les rondes doivent être enterrés, ou brûlés.
- **Sous terre**, l'air et le jour manquent.
- **Une haie** cache l'abri, si on lui laisse le temps de pousser.

Rien de cela n'interdit de s'enraciner : un groupe organisé tient son paradis des années. C'est un groupe qui s'épuise, qui se réduit, qui néglige sa garde, qui se fait prendre. Et la porte reste ouverte : partir, revenir quand le lieu a été oublié.` },
  { cle: "chaleur", titre: "La chaleur du lieu", texte: `**Ce qui la fait monter.** Chaque jour où l'on vit à l'abri : un peu, et bien plus quand le groupe est nombreux (seul, huit fois moins qu'à quatre ; à deux, trois fois moins ; à huit, deux fois plus). Un jour de bruit fort (coups de feu, groupe électrogène) en ajoute. Dans les Hauts, en saison sèche, le froid rassemble les Livides : un quart de plus.

**Ce qui la fait baisser.**
- **Un jour de silence** : personne ne bâtit, ne fouille, ne chasse, ne travaille à l'atelier ; aucun bruit. Le système le voit seul ; vous pouvez aussi le décider (avancer avec silence).
- **La ronde** : chaque Livide abattu efface une piste ; une ronde, même vide, efface des traces.
- **Un camp leurre** : un feu et du bruit loin de l'abri, pour tirer ailleurs ce qui rôde (leurre : deux quarts, un matériau, et un test de discrétion pour rentrer sans être vu ; raté, il ne trompe qu'à moitié). Il trompe moitié moins s'il en a été fait un dans la semaine.
- **Partir** : un lieu où plus personne ne vit refroidit, jour après jour. Revenir dans un lieu qu'on a quitté depuis des mois, c'est revenir dans un lieu oublié. C'est la **transhumance** des anciens : les Hauts à une saison, les Bas à l'autre.

**Ce qu'elle fait.** Dès qu'il reste des traces, elle fait **venir des Livides** autour de l'abri, chaque jour un peu plus. Une fois qu'on vous a remarqués, elle pèse aussi sur les **hordes** : une horde qui passe trouve plus souvent l'abri, et les hordes de passage se tournent vers la région d'un abri chaud. Jamais sur la visibilité : celle-là reste ce que voient les vivants, les bandes.

**Ce qu'en voient les joueurs** (le journal le dit quand ça change) :
- *on vous a oubliés* : rien ;
- *des traces* : quelque chose passe, la nuit ;
- *on vous a remarqués* : il en vient chaque jour un ou deux ;
- *ils viennent* : chaque jour plus nombreux ;
- *assiégés* : ils sont contre la clôture, et ne partent plus.

**Pour le MJ** : paradis() donne la chaleur (de 0 à 10), les agglutinés, les signes ; chaleur({ delta }) la corrige (une scène qui fait du bruit, un incendie) ; leurre({ membres }) fait le camp leurre.` },
  { cle: "ronde", titre: "La ronde", texte: `La **ronde** est une tâche du jour (vigilance pour voir, combat pour abattre). On la confie : ni la répartition automatique ni la grille par défaut ne la donnent d'elles-mêmes. Celui qui l'a la fait chaque jour à l'abri, au matin.

**Comment elle se joue** (le système la tire seul, chaque jour ; vous pouvez la jouer en scène avec ronde({ membres })) :
- les Livides autour de l'abri : ceux du jour (selon la chaleur et ce qu'il reste de Livides dans la région) et ceux qui s'agglutinaient ;
- le meilleur guetteur cherche (vigilance, normale) : **vus à temps**, on les prend un par un (+1 dé au combat), et ceux qu'on n'abat pas, on les laisse — on recule, ils ne frappent pas ; **surpris** (−1 dé), le plus proche frappe quand l'échange n'en a abattu aucun (un 6 touche, un 6 au dé de morsure mord) ;
- chaque rondier fait un échange de combat, trois Livides au plus à la fois ;
- vus à temps, la ronde relève aussi autre chose : la table « La ronde — ce qu'on trouve » (une fuite, une clôture pliée, des traces). C'est là que se **contrôle** le paradis : ce qu'on voit tôt se répare à peu de frais.

**Une ronde confiée à un PNJ** rate selon ses compétences : ce sont ses dés.

**La tournée du petit jour.** Quand personne n'a la ronde, celui qui a veillé la nuit fait le tour au matin, fourbu (−1 dé) : s'il voit quelque chose, il l'abat ; sinon, il reste derrière la clôture. C'est ce qui tient la plupart des abris bien gardés.

**Une ronde manquée** (personne n'a la ronde, ni la garde, alors que le lieu est « remarqué ») : quatre sur dix de ceux qui sont venus restent. Les **agglutinés** (au plus huit) rôdent autour de l'abri : chacun rend une attaque de Livides errants plus probable (1 % par jour), et ils frappent plus fort (un de force tous les cinq). Chaque jour, quelques-uns repartent d'eux-mêmes. Une ronde les reprend tous.

**Une morsure pendant la ronde** : l'alerte le dit ; soignez-la tout de suite (soignerMorsure).` },
  { cle: "corps", titre: "Les corps", texte: `Chaque Livide abattu par une ronde laisse un corps près de l'abri (la fiche de l'abri les compte). Tant qu'il est frais (quinze jours dans les Bas, quarante dans les Hauts, où le froid le garde et où il sent moitié moins) :
- il **sent pour les bêtes** : les chiens errants viennent plus souvent (les Livides, eux, ignorent l'odeur d'un corps) ;
- il **salit l'abri** : un peu de souillure par corps et par jour (les maladies de la saleté).

**Les enterrer** (traiterCorps({ action: "enterrer", membres, quarts })) : trois corps par quart et par personne, sans bruit, loin de l'abri. **Les brûler** (action « bruler ») : dix par quart et par personne, avec du bois des alentours (un pour cinq corps) ; mais **la fumée se voit** : visibilité +2 ce jour-là (les bandes regardent).

Décrivez sobrement : la pelle, la chaux, le bûcher qu'on surveille, ce qu'on se dit en revenant. Jamais ce qu'on voit.` },
  { cle: "sous-terre", titre: "Sous terre : l'air et le jour", texte: `Un groupe qui vit **sous terre** (un tunnel de lave, une galerie, un tunnel de lave aménagé, une galerie au refuge complet ; ou parce que vous le dites : sousTerre({ vit })) :

- **Les jours sans soleil** : celui qui ne remonte jamais (sa tâche ne le fait pas sortir : repos, cuisine, soins, atelier…) compte ses jours. Après **sept**, son moral ne remonte plus aussi haut (plafond −1) ; après **vingt et un**, −2. Un jour dehors (fouille, chasse, pêche, eau, cultures, élevage, garde, ronde, chantier) remet le compte à zéro.
- **L'air** : plus des trois quarts de la place prise, il est **lourd** (la nuit repose moins : +1 de fatigue au matin) ; plus de monde que de place, il est **vicié** (+2, et la bougie s'étouffe : alerte). La table « Sous terre — la bougie » donne ce qu'on en remarque ; la flamme d'une bougie est la seule jauge, sans chiffre.
- **Le puits d'air et de jour** : au premier niveau, l'air passe (un cran de mieux) ; au second, le jour tombe aussi (plus de jours sans soleil). Mais il laisse sortir la lueur, la fumée et les voix : la discrétion baisse.` },
  { cle: "haie", titre: "La haie qui cache l'abri", texte: `Le **camouflage** a ses sœurs lontan : la **haie de bambous** et le **rideau de filaos**, plantés autour de la cour. Comme toutes les sœurs, une seule sert à la fois (le camouflage d'abord, s'il marche).

- Une haie **pousse** : elle ne cache qu'une part de ce qu'elle cachera tant qu'elle n'a pas poussé (deux à trois mois pour le bambou, un mois pour le filao).
- **Au cyclone**, le bambou plie et se relève (il ne s'abîme pas) ; le filao casse (un point d'état de plus) : l'abri se voit à travers jusqu'à la réparation.` },
  { cle: "mener", titre: "Mener le paradis", texte: `- **Dites les signes**, pas le chiffre : des traces, des herbes couchées, un pieu penché, le silence des oiseaux.
- **Faites sentir le choix** : rester, c'est payer des rondes, des corps, du silence ; partir, c'est perdre ce qu'on a bâti — mais un lieu quitté se refroidit, et l'on peut y revenir.
- **Le MJ IA** lit la chaleur dans paradis() et la dit par des signes ; il ne la nomme jamais.
- **Ce qui s'use** : la table « La ronde — ce qu'on trouve » montre ce qui s'use avant que ça casse (une fuite, un pieu penché) ; réparé tôt (reparer), cela ne coûte presque rien. C'est le « contrôle » du paradis.` }

];
export const JOURNAL_PARADIS = journal({ cle: "le-paradis", nom: "Le paradis et son piège", pack: "mj", pages: PAGES_PARADIS });

const PAGES_ILE = [
  { cle: "but", titre: "Rallumer l'île", texte: `**Le but d'une longue partie : reprendre l'île, région par région.** Pas d'écran de victoire : la nuit, de loin et sur la carte, les régions reprises s'allument.

Une région se **rallume** quand, en même temps :
1. **une communauté y tient un abri depuis un mois** (le groupe, ou une communauté qui s'en est séparée) ;
2. **ses lieux gardés sont nettoyés** : chacun de ses sites (sauf l'abri) nettoyé de ses Livides depuis moins de trois mois (nettoyer, du lot « sens ») ;
3. **l'infestation n'y est plus dense** (le système le sait, les joueurs le sentent) ;
4. **la lumière y est revenue** : l'abri y produit du courant (des panneaux, une pico-hydro, une éolienne), ou un grand chantier de la région y a rallumé quelque chose (une centrale, un phare, les feux d'un port).

Elle **s'éteint** si on l'abandonne : dix jours sans abri tenu ou sans lumière, et le noir revient. On peut la rallumer de nouveau (il suffit de la tenir, de l'éclairer, et que ses lieux soient encore propres).

**Pour le MJ** : ile() dit ce qui manque, région par région ; rallumer({ region, action }) déclare une région rallumée ou éteinte (une communauté alliée qui a fait le travail, une scène). Le tableau de bord montre la carte qui s'allume.` },
  { cle: "effets", titre: "Ce que change une région rallumée", texte: `**Moins de Livides.** Son infestation baisse chaque jour, et ne redevient jamais dense ; aucune horde n'y naît ; celles qui y passent se défont plus vite ; les errants rôdent moitié moins autour de l'abri, et les fouilles y font moitié moins de rencontres.

**La lumière se voit, et les bandes viennent.** C'est le contrepoint, et il ne se négocie pas :
- l'abri d'une région rallumée se voit de loin pour les **bandes** (2 de visibilité de plus pour elles) ;
- chaque nuit, une région rallumée peut **attirer un convoi** : la bande la plus forte d'une région voisine y envoie du monde (table « Un convoi attiré par la lumière ») ; plus il y a de régions rallumées, plus c'est fréquent ;
- toutes les bandes qui viennent à l'abri sont plus fortes à mesure que l'île se rallume (+1 de force par quatre régions).

Rallumer l'île, c'est échanger des Livides contre des vivants. Ce n'est pas plus facile ; c'est autre chose.` },
  { cle: "chantiers", titre: "Les grands chantiers", texte: `Certaines régions ont un **grand chantier** : trop gros pour un groupe seul, il se fait à plusieurs. chantierRegion({ cle, membres, quarts }) y fait travailler le groupe (il faut y être ; le coût se paie au premier quart) ; chantierRegion({ cle, aide }) y ajoute un allié (une faction amie, une communauté) qui avance le travail chaque jour.

- **La petite centrale de Langevin** (Sud sauvage) : la lumière et le courant pour l'abri du Sud. L'affaire « La petite centrale de Langevin » y mène.
- **La centrale de la Rivière de l'Est** : le plus long ; tout l'Est.
- **La route du Littoral** et **la route des Tamarins** (Saint-Paul : l'affaire « Le viaduc ») : une route rouverte ne se coupe plus qu'aux pires jours ; un éboulement la rend difficile, pas fermée.
- **Le port de Saint-Pierre** : ses feux, et la pêche qui reprend (une part de plus par jour, au MJ de la donner).
- **Le phare de Bel-Air** : rien qu'une lumière, chaque nuit, qui dit qu'il y a des vivants.` },
  { cle: "jalons", titre: "Les jalons", texte: `Le système note dans les Chroniques de Fénoir, sans rien donner en échange :
- le **premier abri** ;
- la **première saison des pluies** passée (le premier jour de l'hiver austral) ;
- le **premier cyclone** traversé ;
- la **première fête** tenue ;
- la **première région rallumée** ;
- **la moitié de l'île** ;
- **toute l'île**.

Lisez-les à voix haute, une fois, quand ils tombent.` },
  { cle: "campagne", titre: "Une campagne pour rallumer l'île", texte: `Une campagne au long cours peut se donner ce but, et le dire dès la première séance.

- **Le premier temps** : survivre, trouver un lieu, le tenir. Le paradis vient avant la lumière.
- **Le deuxième temps** : nettoyer la région, lieu par lieu (des scènes de nettoyage, des affaires), y ramener le courant. La première région s'allume.
- **Le troisième temps** : essaimer. Une partie du groupe part tenir une autre région (séparer, et la communauté garde son abri) ; on se prête la main aux grands chantiers ; on négocie avec les bandes que la lumière attire, ou on les combat.
- **La fin** : il n'y en a pas. Une île à moitié rallumée est une victoire qu'on peut perdre en dix nuits.

Le **MJ IA** suit la même règle : il lit ile() à chaque séance, dit ce qui manque en mots de monde (« la caserne est encore pleine », « l'abri n'a pas de courant »), fait venir les convois, et ne déclare jamais une région rallumée de lui-même.` }
];
export const JOURNAL_ILE = journal({ cle: "rallumer-l-ile", nom: "Rallumer l'île", pack: "mj", pages: PAGES_ILE });

// ---------------------------------------------------------------- Le guide du joueur
export const PAGES_JOUEUR_PARADIS = [
  { cle: "le-paradis", titre: "Le paradis, et ce qu'il coûte", texte: `Un abri autonome, où l'on vit bien : c'est le but de qui s'enracine. Mais **un lieu où l'on reste longtemps se fait remarquer**. On le voit à des signes : des traces, puis un ou deux Livides chaque jour, puis plus.

- **La ronde** les tient : un membre qui l'a pour tâche fait le tour au matin et abat ceux qu'il trouve ; vus à temps, ils ne frappent pas. Celui qui a veillé la nuit fait aussi un tour au petit jour. Sans ronde, ils restent, et s'agglutinent contre la clôture.
- **Les corps** des Livides abattus s'enterrent (lent, sans bruit) ou se brûlent (vite, mais la fumée se voit).
- **Le silence** fait oublier un lieu : un jour où personne ne bâtit, ne fouille ni ne chasse. **Un camp leurre**, loin, tire ailleurs ce qui rôde. **Partir** fait oublier un lieu : on peut y revenir plus tard.
- **Sous terre**, on manque d'air et de jour : sortir chaque jour, ou percer un puits (qui laisse aussi sortir la lueur et le bruit).
- **Une haie** de bambous ou de filaos cache l'abri, quand elle a poussé ; au cyclone, le bambou plie, le filao casse.` },
  { cle: "rallumer", titre: "Rallumer l'île", texte: `Le but d'une longue partie : **reprendre l'île, région par région**. Une région se rallume quand on y tient un abri depuis un mois, qu'on en a nettoyé chaque lieu, que les Livides n'y sont plus nombreux, et qu'on y a ramené la lumière (du courant à l'abri, ou un grand chantier : une centrale, un phare, un port). La nuit, on la voit de loin ; sur la carte du tableau de bord, elle s'allume.

Elle devient moins dangereuse : moins de Livides, et plus aucune horde n'y naît. Mais **la lumière se voit, et les bandes viennent**. Et si on l'abandonne, le noir revient en dix jours.` }
];
