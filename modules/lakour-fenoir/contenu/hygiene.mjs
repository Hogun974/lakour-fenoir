// Le corps, le sommeil et l'hygiène (lot 1 du portage de Fénoir 3D, 2026-11-17 ; complément du jeu 3D, famille 2 « L'esprit sur le
// corps », décisions de Jordan des 14 et 16 novembre, le reste validé le 17 : « tout maintenant »). Les règles sont dans le système
// (logique/corps.mjs, maladies.mjs ; contrat §19 ; chiffres : docs/equilibre-corps.md) ; ici, le contenu :
// - cinq installations d'hygiène, en sœurs lontan et modernes (rôle « latrines » : feuillées, latrines sèches, fosse maçonnée ;
//   rôle « toilette » : lavoir, douche), avec `effets.hygiene` ;
// - le journal du MJ « Le corps, le sommeil et l'hygiène », une page du guide du joueur, une table du bivouac.
// Ton : sobre, rien de scatologique à l'écran ; la saleté se dit par ce qu'elle fait (l'odeur, la fièvre, les mouches), pas autrement.
import { installation, journal, table, MODULE } from "./aides.mjs";

// ---------------------------------------------------------------- Installations
export const INSTALLATIONS_HYGIENE = [
  installation({ cle: "feuillees", arbre: "lontan", role: "latrines", rang: 2, nom: "Feuillées", categorie: "vie",
    description: `Une tranchée creusée à l'écart et sous le vent, un paravent de feuilles de vacoa, un seau de cendre et une pelle : une poignée de cendre après chaque passage, et l'on rebouche quand c'est plein, un peu plus loin. Ce que faisaient les anciens dans les écarts, et les soldats partout.`,
    niveaux: [
      { cout: { ile: 1, travail: 2 }, effets: { hygiene: 1 } }
    ] }),
  installation({ cle: "latrines-seches", arbre: "lontan", role: "latrines", rang: 1, nom: "Latrines sèches", categorie: "vie",
    description: `Une cabane de planches refendues et de bambou, un siège, un fût dessous et de la cendre : rien ne va dans l'eau, et le fût plein, laissé à mûrir une saison, finit en compost pour le jardin.`,
    niveaux: [
      { cout: { ile: 3, travail: 4 }, effets: { hygiene: 2, sol: 0.005 } }
    ] }),
  installation({ cle: "fosse-maconnee", arbre: "moderne", role: "latrines", rang: 0, nom: "Fosse maçonnée", categorie: "vie",
    description: `Une fosse en dur, enterrée, avec sa chasse et ses tuyaux, comme celles des cases d'avant : on n'y pense plus, tant qu'il y a de l'eau pour la chasse. Sans eau, on retourne aux latrines sèches ou aux feuillées.`,
    niveaux: [
      { cout: { materiaux: 6, pieces: 1, travail: 10 }, requiert: { savoirs: ["maconnerie", "plomberie-filtration"] }, effets: { hygiene: 3, consommation: { eau: 1 } } }
    ] }),
  installation({ cle: "lavoir", arbre: "lontan", role: "toilette", rang: 1, nom: "Lavoir", categorie: "vie",
    description: `Une pierre à laver penchée sur un bassin de galets jointoyés d'argile, au bord de l'eau ou sous la citerne : on y lave le linge, on s'y lave, on y parle. Le linge bouilli à la cendre ne garde pas la gale.`,
    niveaux: [
      { cout: { ile: 2, travail: 4 }, effets: { hygiene: 1, consommation: { eau: 1 } } }
    ] }),
  installation({ cle: "douche", arbre: "moderne", role: "toilette", rang: 0, nom: "Douche", categorie: "vie",
    description: `Un fût en hauteur, un tuyau, une pomme percée, un paravent de tôle et un caillebotis : se laver chaque soir, laver une plaie à grande eau. Avec un chauffe-eau, elle est chaude.`,
    niveaux: [
      { cout: { materiaux: 3, pieces: 1, travail: 4 }, requiert: { savoirs: ["plomberie-filtration"] }, effets: { hygiene: 2, consommation: { eau: 2 } } }
    ] })
];

// Pas de bras (§10.3) : elles marchent sans personne à la tâche (même forme que installations.mjs).
for (const i of INSTALLATIONS_HYGIENE) for (const n of i.system.niveaux) n.effets.bras = null;

// ---------------------------------------------------------------- Table : la nuit dehors
const T = (cle, nom, description, resultats) => {
  const t = table({ cle, nom, description, resultats });
  Object.assign(t.flags[MODULE], { corps: cle });
  return t;
};
export const TABLES_CORPS = [
  T("bivouac-la-nuit", "Un bivouac — ce qui vient la nuit", `Une nuit dehors. Tirez une fois par nuit ; dans un endroit exposé, tirez deux fois et gardez le pire ; dans un endroit dangereux, tirez deux fois et gardez les deux.`, [
    "Rien. Le vent dans les filaos, les grenouilles qui chantent. On se réveille raide et vivant.",
    "La rosée des Hauts traverse tout : au matin, les mains ne se ferment plus et le feu ne veut pas prendre.",
    "Un tangue qui fouille les feuilles autour du sac de vivres. Il faut se lever trois fois pour le chasser.",
    "Une averse en pleine nuit : la bâche tient, ou ne tient pas. Sans bâche, la nuit ne repose pas (comme dormir au sol).",
    "Des fourmis, des moustiques, une scolopendre dans une chaussure au réveil (secouez-la : sinon, une piqûre).",
    "Des pas sur la route en contrebas, lents, réguliers : un Livide errant qui ne s'arrête pas. Personne ne dort plus.",
    "Une lueur au loin, un autre feu. D'autres vivants bivouaquent dans la même ravine.",
    "La ravine gronde : il a plu là-haut. Dans le lit d'une ravine, c'est le moment de partir, tout de suite.",
    "Un chien qui s'approche, maigre, attiré par l'odeur du repas. Il reste à distance jusqu'au matin.",
    "Le silence complet, d'un coup : une horde passe tout près (rencontre de nuit, au MJ)."
  ])
];

// ---------------------------------------------------------------- Le journal du MJ
const PAGES_MJ = [
  { cle: "principe", titre: "Le corps qui tient, ou qui lâche", texte: `Dans Fénoir, le corps est une ressource comme l'eau ou les cartouches. On ne meurt pas de fatigue, ni de faim, ni de soif : ce qui tue, ce sont les blessures et le Gris. Mais un corps épuisé, sale, malade ou en manque de sommeil rate ce qu'il ne devait pas rater, et c'est là que les blessures arrivent.

Ce journal rassemble ce que le système compte pour vous : le **sommeil**, l'**hygiène** de l'abri, les **symptômes** des maladies, les **chutes** et le **bouclier**. Rien n'y est montré pour lui-même : pas de gore, rien de scatologique. On dit ce que voient et sentent les personnages, et ce que ça leur coûte.` },
  { cle: "sommeil", titre: "Le sommeil", texte: `Le sommeil est un besoin à part de la fatigue. La fatigue vient de l'effort, de la faim, de la soif ; le manque de sommeil vient des heures passées debout.

- Le système compte les **quarts éveillés** de chacun (la fiche dit « reposé », « en manque », « épuisé », « terrassé »).
- **En manque** après 3 quarts : une journée faite. Rien aux dés ; on bâille, on s'agace.
- **Épuisé** après 4 quarts : une nuit blanche. **−1 dé** à tout.
- **Terrassé** à 7 quarts : **−2 dés**, et l'on s'endort là où l'on est, au quart suivant, même de garde.
- La fatigue et le manque de sommeil ensemble ne retirent jamais plus de **2 dés**.

**Ce qui efface la veille**, par quart de sommeil : 4 quarts à l'abri, 3 au bivouac, 2 à même le sol. Une nuit à l'abri remet donc à zéro ; une nuit au sol ne rattrape pas une journée (au bout de quatre ou cinq nuits ainsi, on s'effondre). Une nuit au bivouac retire aussi 1 de fatigue ; au sol, rien.

**Qui dort, et quand** (le système le fait seul) :
- la nuit à l'abri, tous ceux qui ne veillent pas ;
- la garde de nuit, et quiconque n'a pas dormi de la nuit, dort le matin à l'abri ;
- épuisé par une nuit blanche (en route, une veillée), on la rattrape au premier quart où l'on s'arrête, là où l'on est ;
- en route, la nuit, on marche : le voyage avance, personne ne dort ;
- arrêté hors de l'abri, on dort au bivouac si quelqu'un porte de quoi (tente, natte), sinon au sol ;
- le quart de repos (tâche « repos »), c'est dormir.

Une maladie qui empêche de dormir (gale, choc d'une perte, fièvres aggravées) efface un quart de veille de moins.

**Pour le MJ** : avancer({ dorment: [ids] }) fait dormir ceux-là ; avancer({ eveilles: [ids] }) les garde debout (une veillée, une nuit blanche) ; dormir({ acteurId, quarts, lieu }) compte un sommeil que le temps n'a pas compté (une sieste dans un camion).` },
  { cle: "bivouac", titre: "Bivouaquer", texte: `Avant de s'installer pour la nuit dehors, un survivant juge l'endroit, sans chiffre : **sûr**, **exposé** ou **dangereux**.

- **Dangereux** : une pente raide, le lit d'une ravine (elle se remplit en un quart d'heure quand il pleut là-haut), des Livides en vue ou à portée d'oreille.
- **Exposé** : à moins de soixante mètres d'une route, dans le bâti, à découvert, sur une pente douce ; un feu, une lumière, du bruit ; un endroit souillé.
- **Sûr** : le reste. Un replat, à couvert, à l'écart.

Ce que ça change :
- dans un endroit dangereux, on dort comme au sol, même sous une tente ;
- la table « Un bivouac — ce qui vient la nuit » : une fois si l'endroit est sûr, deux fois et le pire s'il est exposé, deux fois et les deux s'il est dangereux ;
- une rencontre de nuit, si vous la tirez (rencontre), vaut moitié moins dans un endroit sûr et double dans un endroit dangereux (bivouac() vous rend ce facteur).

**Pour le MJ** : bivouac({ pente, ravine, route, bati, couvert, feu, lumiere, bruit, livides, souille }) rend le jugement, ses raisons et le sommeil qu'on y aura.` },
  { cle: "hygiene", titre: "L'hygiène de l'abri", texte: `Un abri où vivent des gens se salit : c'est la **souillure**. Elle monte chaque jour avec ceux qui sont là, et elle s'efface avec le temps et avec la pluie, qui lave tout quatre fois plus vite.

**L'insalubrité** qui en sort, de 0 à 3 :
- **propre** : rien à dire ;
- **ordinaire** : un camp où l'on vit ; rien de plus que d'habitude ;
- **sale** : les mouches, l'odeur (elle se sent dehors et attire comme un abri surpeuplé), et des maladies : la gastro-entérite surtout, une plaie qui s'infecte chez un blessé, la gale, parfois la leptospirose ;
- **insalubre** : la même chose, trois fois plus souvent.

**Les installations d'hygiène** (sœurs : la meilleure qui marche sert, l'autre attend) :
- **latrines** : feuillées (1), latrines sèches (2, elles font aussi du compost), fosse maçonnée (3, elle prend de l'eau ; sans eau, les latrines sèches prennent le relais). Elles retiennent la souillure : sans rien, chacun en ajoute une part par jour ; avec des feuillées, 0,3 ; des latrines sèches, 0,1 ; une fosse, 0,03 ;
- **toilette** : lavoir (1), douche (2). Se laver rend les maladies de la saleté moins fréquentes (un cinquième de moins par point).

Le **niveau d'hygiène** de l'abri est la somme des deux, au plus 3. Un abri à 3 et **propre** est **salubre** : la gastro-entérite y est moitié moins fréquente, et les maladies s'y passent moins.

Un groupe de quatre sans latrines devient « ordinaire » en deux jours et « sale » en six jours au sec ; à six, « insalubre » en neuf jours. Avec des feuillées, il reste « ordinaire » ; avec des latrines sèches, propre. Trop de monde pour la place salit plus vite.

**Le ménage** : menage({ membres, quarts }) retire 4 de souillure par quart et par personne. Le grand ménage du Nouvel An chinois remet l'abri à neuf.` },
  { cle: "symptomes", titre: "Des symptômes, pas des noms", texte: `Les joueurs ne voient jamais le nom d'une maladie que leur groupe ne sait pas reconnaître : ils voient ses **symptômes** (fièvre, frissons, une plaie rouge et chaude, des boutons sur la peau). Une maladie qui couve ne se voit pas du tout.

- **Premiers secours avancés** reconnaît presque tout ; **Zerbaz et tisanes** reconnaît les fièvres des moustiques, la gastro-entérite, la gale, les brûlures et les piqûres.
- Une **fracture**, une **brûlure**, une **piqûre** de scolopendre et le **choc d'une perte** se voient de tous.
- Au journal public, un mal inconnu se dit par ses signes ; son nom va au journal secret.

Chaque mal touche **plusieurs points à la fois** : des dés en moins, de la fatigue chaque jour ; certains empêchent de **dormir** (le système le compte). Quand un mal s'aggrave (les fièvres aggravées, les plaies qui suppurent, la fracture qui s'infecte), le **moral** en prend un coup : à vous de le raconter, et d'ôter un point de moral si la scène le veut (symptomes() vous le dit) ; le système ne le fait pas de lui-même.

**Pour le MJ** : symptomes({ acteurId }) rend ce que voient les joueurs, et, pour vous, les noms. Décrivez : « Mylène a les gencives qui saignent et ne tient plus debout » vaut mieux que « Mylène a la dengue ».` },
  { cle: "gris", titre: "Le Gris, stade par stade", texte: `Le Gris avance d'un stade tous les deux quarts. Ce qu'on en voit :

- **Stade 0** : une plaie rouge et chaude. Comme n'importe quelle morsure soignée.
- **Stade 1** : la fièvre monte autour de la plaie.
- **Stade 2** : les frissons, et la peau qui commence à griser, autour de la plaie d'abord.
- **Stade 3** : la faiblesse : les jambes ne portent plus, les mains tremblent.
- **Stade 4** : la confusion : il ne reconnaît plus les voix, il appelle des gens qui ne sont pas là.
- **Stade 5** : l'épuisement. Il ne parle plus.
- **Au sixième**, il meurt, et se relève au quart suivant si l'on ne s'occupe pas de son corps.

Tout du long, une soif qui monte : il boit, il redemande.

**On ne nomme le Gris** qu'avec les premiers secours avancés, ou après avoir vu un mordu se relever (le système s'en souvient pour le groupe). Avant, ce n'est « que de la fièvre ».

**La morsure pansée se tait.** Quand on soigne une morsure (soignerMorsure), le test est fait, mais son issue va au MJ seul : le joueur lit « pansée, on ne saura que plus tard ». Pendant deux quarts, la fiche ne montre que la morsure pansée ; ensuite, la fièvre vient, ou ne vient pas.` },
  { cle: "chutes", titre: "Les chutes", texte: `Tomber blesse, et plus on tombe de haut, plus on a mal :

- moins de **3 m** : rien ;
- **3 m** : une blessure ; **6 m** : deux ; **9 m** : trois ;
- **12 m** et plus : **mourant** ;
- **25 m** et plus : **mort**.

**L'eau amortit** : un mètre et demi d'eau, ou plus, retire 15 m à la chute (moitié moins dans 75 cm d'eau). Sauter d'un radier dans une vasque profonde, oui ; dans un filet d'eau, non.

**Se recevoir** : un test d'endurance réussi retire une blessure, sauf pour une chute qui rend mourant ou qui tue. Une chute de 6 m et plus, sans s'être reçu, casse un os (une **fracture**).

**Un Livide qui tombe** chancelle dès 3 m ; là où un survivant serait mourant, il se casse les jambes et **rampe** : il avance encore, plus lentement, et ne se relève plus sur ses jambes. Un fossé profond, un balcon, une ravine : ce sont des armes.

**Pour le MJ** : chute({ acteurId, hauteur, eau, reception }) applique tout cela ; chute({ livide: true, hauteur }) dit ce que devient un Livide.` },
  { cle: "bouclier", titre: "Le bouclier", texte: `Un bouclier tenu en main pare les touches des Livides : chaque touche est parée sur **5 ou 6** au dé pour le bouclier de tôle (une sur trois). **Une touche parée ne blesse pas et ne mord pas.**

Il se manie avec le combat, comme une arme (+1 dé), et l'on ne tire pas en le tenant. Il est lourd et encombrant : deux charges.

**Pour le MJ** : parer({ acteurId, touches }) jette les dés de parade d'un survivant qui porte un bouclier.` },
  { cle: "faim-soif", titre: "La faim et la soif", texte: `La faim pèse sur la vie : elle fatigue et ronge le moral, jour après jour. La soif pèse sur l'endurance : elle fatigue à chaque quart. **Ni l'une ni l'autre ne tue d'elle-même** : ce qui tue, ce sont les blessures et le Gris. Mais un groupe affamé, assoiffé et épuisé ne se défend plus, ne fouille plus, et c'est alors que tout arrive.

Si la situation l'exige (un désert, une ravine sans eau, des jours de siège), c'est à vous de décider qu'un corps lâche : dites-le avant, pour que les joueurs puissent choisir.` }
];
export const JOURNAL_CORPS = journal({ cle: "le-corps", nom: "Le corps, le sommeil et l'hygiène", pack: "mj", pages: PAGES_MJ });

// ---------------------------------------------------------------- Une page du guide du joueur
export const PAGES_JOUEUR_CORPS = [
  { cle: "le-corps", titre: "Dormir, se laver, tomber", texte: `Le corps tient, ou lâche.

- **Dormir.** Le manque de sommeil n'est pas la fatigue. Une nuit blanche coûte un dé ; deux nuits sans dormir, on s'endort où l'on est. Une nuit à l'abri remet d'aplomb ; une nuit au sol ne rattrape pas une journée ; de quoi bivouaquer (une tente, une natte) change tout.
- **Bivouaquer.** Avant de dormir dehors, regardez l'endroit : sûr, exposé (une route, du bâti, à découvert, un feu), dangereux (une pente raide, le lit d'une ravine, des Livides). Dans un endroit dangereux, on ne dort pas vraiment.
- **Se laver.** Un abri où vivent des gens se salit, et la saleté rend malade. Des latrines, même des feuillées, une douche ou un lavoir, et le camp reste sain. La pluie lave tout.
- **Être malade.** On voit des signes : la fièvre, les frissons, une plaie qui rougit. Le nom du mal, seul celui qui sait soigner le connaît.
- **Une morsure.** On la soigne tout de suite. Ensuite, on attend : personne ne sait si le soin a pris, avant que la fièvre vienne, ou ne vienne pas.
- **Tomber.** Dès 3 m, on se blesse ; à 12 m, on se tue presque ; de l'eau profonde amortit. Un Livide qui tombe de haut rampe.
- **Le bouclier.** Il pare une touche de Livide sur trois : une touche parée ne mord pas.
- **La faim et la soif** épuisent ; elles ne tuent pas d'elles-mêmes. Ce qui tue, ce sont les blessures et le Gris.` }
];
