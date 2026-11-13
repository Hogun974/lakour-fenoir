// Lot « savoirs » : les deux savoirs (lontan et moderne) et l'île en mouvement (cyclone vécu, chiens, routes sans carburant).
// Ce fichier porte ce qui n'a pas de famille à soi ailleurs : les dépôts du cyclone (registre `depotsCyclone`, lus par la logique
// du système, abri.mjs passageCyclone), les gramounes et gramouns qu'on peut accueillir (registre `gramounes` : des recrues toutes
// faites, métissées comme l'île, docs/metissage.md), les tables du MJ, le journal du MJ et le guide des joueurs. Textes originaux.
// Les chiffres et leurs raisons : docs/equilibre-savoirs.md.
import { journal, table } from "./aides.mjs";

// ---------------------------------------------------------------- Ce que le cyclone dépose dans la cour
// { cle, nom, poids, texte, stocks?: { ressource: n } (posés dans la cour, au plafond), menace?: { type, force } (au MJ, menaces
// du jour), moral?: n (à raconter) }. Ce qui était mal fixé ailleurs : bonnes et mauvaises surprises.
const depot = (cle, nom, poids, texte, extra = {}) => ({ cle, nom, poids, texte, ...extra });
export const DEPOTS_CYCLONE = [
  depot("toles-du-voisin", "des tôles arrachées à un toit voisin", 3, "Trois tôles ondulées, encore clouées à leur chevron, plantées dans le manguier. Quelqu'un, ailleurs, n'a plus de toit.", { stocks: { materiaux: 3 } }),
  depot("bache-et-cordes", "une bâche bleue et ses cordes", 2, "Une bâche de chantier enroulée autour du poteau de la barrière, avec ses cordes. Elle servira.", { stocks: { materiaux: 1 } }),
  depot("panneau-arrache", "un panneau solaire arraché", 1, "Un panneau solaire, le cadre tordu, les cellules intactes, couché dans la boue de la cour.", { stocks: { pieces: 2 } }),
  depot("bouteille-de-gaz", "une bouteille de gaz", 1, "Une bouteille de gaz de treize kilos a roulé jusqu'au mur. Pleine, ou presque.", { stocks: { gaz: 10 } }),
  depot("fut-d-eau", "un fût plein d'eau de pluie", 2, "Un fût bleu, venu on ne sait d'où, plein à ras bord d'eau de pluie.", { stocks: { eau: 8 } }),
  depot("poules-affolees", "des poules affolées", 1, "Trois poules trempées, réfugiées sous la varangue, qui ne veulent plus partir.", { stocks: { nourriture: 3 } }),
  depot("regimes-de-bananes", "des régimes de bananes cassés", 2, "Les bananiers du voisin ont cassé : deux régimes verts dans la cour, à faire mûrir ou cuire vite.", { stocks: { nourriture: 4 } }),
  depot("barque-retournee", "une barque retournée", 1, "Une barque de pêcheur, coque en l'air, au milieu du chemin. Le moteur a disparu ; le bois et les rames restent.", { stocks: { materiaux: 2 } }),
  depot("livide-sous-la-tole", "un Livide coincé sous une tôle", 2, "Une tôle s'est abattue contre la clôture, et dessous, quelque chose bouge encore et gratte.", { menace: { type: "livides", force: 1 } }),
  depot("vache-noyee", "une vache noyée", 1, "Une vache gonflée, coincée contre la barrière : dans deux jours, l'odeur. Il faut la tirer loin, ou la brûler, et la fumée se verra.", { moral: -1 }),
  depot("nid-de-guepes", "un nid de guêpes", 1, "Un nid de guêpes arraché à un arbre, tombé dans la réserve de bois. Elles sont furieuses.", { moral: -1 }),
  depot("malle-d-un-inconnu", "la malle d'un inconnu", 1, "Une petite malle de bois, des photos de famille gondolées, un chapelet, une lettre jamais postée. Certains y voient un signe ; ce n'est qu'une malle.", { moral: 0 }),
  depot("cuve-de-fioul", "une cuve percée", 1, "Une cuve de mazout percée a vidé son fond dans la cour. Le potager boira de l'eau sale quelques jours.", { moral: -1 })
];

// ---------------------------------------------------------------- Gramounes et gramouns (recrues toutes faites)
// Une bibliothèque vivante, fragile : âge, incapacité aux travaux lourds, un trait fragile. Confiance de départ 1 (on ne livre
// pas ses remèdes au premier venu). Le MJ en propose une comme recrue (fenêtre du MJ, « Recrue », gramoune) ; le recrutement se
// fait au test de parole, comme les autres. Les préjugés sont les leurs ; les faits les démentent.
const gramoune = g => ({ incapacites: ["travaux-lourds"], equipement: [], passions: {}, confiance: 1, statut: "recrue", ...g });
export const GRAMOUNES = [
  gramoune({ cle: "gramoune-zelie", nom: "Gramoune Zélie Ah-Kiem", genre: "f", age: 81, enfance: "enfant-de-planteur-de-l-est", passe: "planteur-de-canne",
    competences: { soins: 3, survie: 3, parole: 2, vigilance: 1 }, passions: { soins: 2 }, traits: ["os-de-verre", "coeur-de-kour"],
    savoirs: ["zerbaz", "jardin-creole", "conserverie"],
    raison: "Elle n'a pas voulu quitter sa case de Bras-Panon ; quand la ravine a pris le pont, ce sont ses voisins qui ont dû partir, et elle avec.",
    prix: "Elle marche lentement, il faut la porter dans les sentiers, et elle ne donne ses remèdes qu'à ceux qui l'écoutent.",
    notes: `Fille d'un boutiquier chinois de Bras-Panon et d'une coupeuse de canne cafre, elle a soigné tout le quartier avec son jardin : ayapana, fleur jaune, faham, citronnelle. Elle dit des médecins zoreils qu'« *zot i koné pa nout rimèd* » (ils ne connaissent pas nos remèdes) ; c'est pourtant une infirmière de Lyon qui, la première, a recopié ses recettes dans un cahier, et elle en parle avec tendresse. Elle ne se plaint jamais du dos. Elle se plaint de tout le reste.` }),
  gramoune({ cle: "gramoun-ignace", nom: "Gramoun Ignace Técher", genre: "m", age: 78, enfance: "enfant-de-cilaos", passe: "agricultrice-des-hauts",
    competences: { bricolage: 3, survie: 3, parole: 1, endurance: 1 }, passions: { bricolage: 2 }, traits: ["tete-de-bois", "leve-avant-le-coq"],
    savoirs: ["pierre-seche", "bambou-vacoa", "elevage"],
    raison: "Il gardait encore ses vaches au-dessus de l'îlet ; la dernière est morte, et il est descendu, une canne à la main, sans un mot.",
    prix: "Il commande tout chantier comme s'il était le sien, ne monte plus une échelle, et râle contre « les gens d'en bas ».",
    notes: `Yab de vieille souche, il a monté à la main la moitié des murets de pierre sèche de son îlet. Il répète que « *bann malbar i fé sèrvis* » (les Malbars font des cérémonies) comme s'il s'en méfiait ; l'homme qui lui a appris à poser une boutisse s'appelait Moutoussamy, et c'est à son enterrement qu'Ignace a pleuré pour la dernière fois. Il dort peu, se lève avant le coq, et voudrait qu'on en fasse autant.` }),
  gramoune({ cle: "gramoune-mariamma", nom: "Gramoune Mariamma Moutoussamy", genre: "f", age: 74, enfance: "enfance-tamoule-de-saint-andre", passe: "vendeur-de-bazar",
    competences: { bricolage: 3, survie: 2, parole: 2, soins: 1 }, passions: { bricolage: 2 }, traits: ["soleil-dedans", "main-ouverte"],
    savoirs: ["bambou-vacoa", "jardin-creole", "zerbaz"],
    raison: "Son étal de paniers au bazar de Saint-Louis a brûlé avec le reste ; elle a gardé son couteau à vacoa et son sourire.",
    prix: "Elle ne mangera pas de bœuf, demande un coin pour sa lampe le vendredi, et donne tout ce qu'on lui confie.",
    notes: `Vannière malbare, elle a tressé des milliers de sacs et de chaises de vacoa pour les marchés du Sud. Elle dit des Comoriens qu'« *zot lé dèrnié arivé, zot i pran tout* » (les derniers arrivés prennent tout), puis partage son riz avec la première famille comorienne qui passe, et lui apprend à tresser. Elle chante en tamoul en travaillant ; personne ne comprend les paroles, tout le monde connaît l'air.` }),
  gramoune({ cle: "gramoun-said", nom: "Gramoun Saïd Madi", genre: "m", age: 72, enfance: "enfance-a-mayotte", passe: "pecheur-de-saint-gilles",
    competences: { survie: 3, parole: 2, discretion: 1, endurance: 1 }, passions: { survie: 2 }, traits: ["souffle-court", "creole-de-coeur"],
    savoirs: ["peche-lagon", "bambou-vacoa"],
    raison: "Il a ramené sa pirogue au port avec trois inconnus à bord le soir du jour zéro, et ne l'a plus quittée depuis.",
    prix: "Il tousse la nuit, ne peut plus porter, et refuse de s'éloigner de la mer plus de quelques jours.",
    notes: `Arrivé de Mayotte il y a quarante ans, kofia brodée et barbe blanche, il a pêché au large de Saint-Gilles toute sa vie et tressé ses nasses au bambou. Il se moque des Yabs, « *bann yab i koné pa la mèr* » (les petits blancs des Hauts ne connaissent pas la mer) ; son meilleur ami, un pêcheur de Cilaos descendu à vingt ans, lui a pourtant sauvé la vie un soir de houle. Il prie à l'heure, rit fort, et sait où sont les poissons.` })
];

// ---------------------------------------------------------------- Tables du MJ
const CYCLONE_HEURE = [
  "Rafales : la tôle du toit claque comme un fusil, toutes les trois secondes. Dehors : −2 dés, on n'entend rien (vigilance −3).",
  "Accalmie de dix minutes : la pluie tombe droit, on entend de nouveau la ravine. Le temps de vérifier une fixation, pas plus.",
  "Une fuite au-dessus du dortoir : on court avec des bassines. Le seau de la cuisine sert de gouttière.",
  "Un arbre tombe quelque part, un craquement sourd, puis plus rien. Le bois de demain, la route coupée d'après-demain.",
  "Le courant (s'il y en avait) saute ; on finit la nuit à la bougie. La lumière ne se voit de nulle part : il n'y a personne dehors.",
  "L'œil passe (si la région est au cœur de la trajectoire) : silence total, ciel clair, étoiles. C'est un piège : le vent revient de l'autre côté.",
  "Le vent tourne : ce qu'on avait calé contre la façade se met à battre de l'autre côté. Une fixation à revoir, dehors, en plein vent.",
  "Une silhouette titube dans la cour, poussée par le vent : un Livide égaré, qui n'entend rien non plus.",
  "Les marmailles ne dorment pas ; quelqu'un raconte une histoire de Ti Jean pour les tenir. Les grands écoutent aussi.",
  "Au matin, la cour est méconnaissable : branches, feuilles, boue, et quelque chose qui n'était pas là hier (table « Ce que le cyclone dépose »)."
];
const VERROUS_ROUTE = [
  "Une voiture en travers, portières ouvertes : on siphonne (épave), on la pousse dans la ravine (grand fracas, +4 bruit), ou on se faufile en chicane.",
  "Trois voitures encastrées sous un pont : une seule passe, et il faut d'abord sortir ce qui reste dedans.",
  "Un bus scolaire couché sur la route de Cilaos : on ne le bouge pas ; à pied, on passe ; en voiture, on fait demi-tour.",
  "Un tunnel à une voie, noir comme un four, la sortie invisible : on attend, on écoute, on allume les phares ou pas.",
  "Un éboulis frais, des cailloux gros comme des cabris : deux heures de pelle, ou le sentier à côté avec ce qu'on porte.",
  "Un arbre en travers après le cyclone : la tronçonneuse (bruit) ou la hache (temps). Les fruits de l'arbre sont à prendre.",
  "Une barricade d'une faction, abandonnée ou pas : des pneus, des fûts, une chaîne. Quelqu'un a peut-être les jumelles sur vous.",
  "Un camion-citerne sur le flanc : il reste peut-être du carburant dans la cuve, et une odeur à ne pas allumer de cigarette.",
  "Un radier noyé : la route continue sous l'eau brune. Attendre que la rivière baisse, ou risquer le moteur.",
  "Une voiture sur cales, roues volées, et un mot sur le pare-brise : « Pa touch, mi rovien » (n'y touchez pas, je reviens). Daté d'il y a des mois."
];
const JARDIN_CASE = [
  "Une treille de chouchous qui a envahi toute la cour : de quoi nourrir le groupe une semaine, et des boutures à repiquer.",
  "Des bananiers en touffe, deux régimes verts : à couper, à cuire, et des rejets à replanter.",
  "Un carré de songes dans le coin humide, sous le robinet qui ne coule plus.",
  "Du manioc à perte de vue sous les mauvaises herbes : il se garde en terre, on le prend au fur et à mesure.",
  "Les zerbaz de la gramoune le long de la clôture : ayapana, citronnelle, fleur jaune (+1 plantes).",
  "Un pied de piment chargé, un pied de combava, un curcuma : de quoi redonner goût au riz.",
  "Des patates douces qui ont couru partout : on en déterre de quoi faire un cari, et des lianes à bouturer.",
  "Un jardin déjà visité : des trous partout, des tiges cassées. Quelqu'un est passé avant vous, il y a peu.",
  "Un pied de letchi ou de manguier chargé en saison : les fruits tombent tout seuls, les chauves-souris en profitent.",
  "Dans la case, sur la table, le cahier de recettes de la grand-mère, écrit au crayon : un livre (un savoir lontan à apprendre)."
];
const PAROLES_GRAMOUNE = [
  "« *Planté dann bon katié la lune, i pous mèm si ou oubli ali.* » (Plante au bon quartier de lune, ça pousse même si tu l'oublies.) Ce qu'elle dit avant chaque semis.",
  "« *Sé pa la marmit i fé la tizan, sé lo kèr.* » (Ce n'est pas la marmite qui fait la tisane, c'est le cœur.) Puis elle donne quand même les doses, exactes.",
  "« *Ayapana pou lo vant, fleur jaune pou lo foi, faham pou lo kèr.* » (L'ayapana pour le ventre, la fleur jaune pour le foie, le faham pour le cœur.)",
  "« *Bambou i pli, li kas pa.* » (Le bambou plie, il ne casse pas.) Elle parle de la palissade ; elle parle aussi du groupe.",
  "« *Kan lo shien i tourn an ron, ramas out linj.* » (Quand le chien tourne en rond, rentre ton linge.) Le cyclone, avant la radio.",
  "« *Mwin la vu siklone 48, mwin la vu Firinga. Ou va vwar la fin Fénoir osi.* » (J'ai vu le cyclone de 48, j'ai vu Firinga. Tu verras la fin de Fénoir aussi.)",
  "« *Mur pyèr sèk, ou mont ali in fwa, ou rekomans pa.* » (Un mur de pierres sèches, on le monte une fois, on ne le recommence pas.)",
  "« *Domoun lé pa rish par sak li gingn, mé par sak li koné fé.* » (On n'est pas riche de ce qu'on gagne, mais de ce qu'on sait faire.)",
  "Elle refuse d'expliquer : « *Gard bien, ou va konprann.* » (Regarde bien, tu comprendras.) Une veillée de plus, sans test.",
  "Elle se tait toute la soirée, fatiguée. Une veillée perdue, à moins de la soigner d'abord (fatigue ou blessure)."
];
const LIVRES_TROUVES = [
  "Un manuel scolaire d'électricité, annoté au crayon par un élève qui n'aimait pas les schémas.",
  "Le guide d'entretien d'un chauffe-eau solaire, avec les plans du circuit.",
  "Un vieux cahier de recettes lontan : rougails, achards, conserves, et dans la marge, des remèdes.",
  "Un livre de vannerie de l'artisanat réunionnais, photos jaunies de sacs et de chapeaux de vacoa.",
  "La revue technique d'une voiture de quinze ans, et un dossier sur la conversion des moteurs à l'éthanol.",
  "Un manuel de secourisme d'association, pages cornées à « hémorragie » et « fracture ».",
  "Un guide des plantes médicinales de l'île, un herbier glissé entre les pages.",
  "Un traité de maçonnerie traditionnelle : les murs en pierre sèche des Hauts, coupe par coupe.",
  "Un manuel de radioamateur, avec la liste des fréquences des autres îles.",
  "Un roman, rien de plus. On le lit quand même, pour les soirs sans rien : +1 moral au groupe, une fois (le MJ le dit)."
];
const CHIEN_ERRANT = [
  "Il regarde de loin, couché à l'ombre d'une épave, les côtes saillantes. Il s'enfuit dès qu'on se lève.",
  "Il s'approche de la nourriture posée, attend qu'on recule de trois pas, mange, repart.",
  "Il grogne, babines retroussées, quand on tend la main : trop tôt.",
  "Il dort à l'entrée de la cour cette nuit, et aboie une fois quand quelque chose passe sur la route.",
  "Il accepte la main sur la tête, en tremblant. Il a un vieux collier, avec un prénom à moitié effacé.",
  "Il suit quelqu'un pendant une fouille, à dix mètres, et grogne vers une porte : il y avait un Livide derrière.",
  "Une meute passe au loin : il hésite, regarde la meute, regarde le groupe. Il reste.",
  "Il mord, de peur, quand on le surprend dans son sommeil (1 blessure, pas de Gris : c'est un chien). Tout est à recommencer, ou presque."
];
const MEUTES = [
  "Une meute de six, menée par un grand chien gris au collier clouté, sur l'aire de repos de la quatre-voies.",
  "Des aboiements qui suivent la voiture le long de la route, puis plus rien. Ils attendent la panne.",
  "Une meute qui dort sous un pont, au milieu de sacs éventrés : leur territoire. On contourne ou on traverse vite.",
  "Deux chiens maigres fouillent une épave ; ils détalent, puis reviennent, à cinq.",
  "La meute a coincé un Livide contre un grillage et le harcèle : elle n'a pas peur des morts, elle a peur du feu.",
  "Un chien de tête blessé, qui boite : la meute se dispute déjà la place.",
  "Une meute qui suit un vélo dans la descente, en silence, jusqu'au virage.",
  "Une chienne avec ses chiots, cachée dans un fossé : elle attaquera pour eux, ou se laissera nourrir."
];

export const TABLES_SAVOIRS = [
  table({ cle: "cyclone-heure-par-heure", nom: "Cyclone — heure par heure", description: "Le jour où le cyclone frappe : rafales, accalmies, l'œil, le vent qui revient. Un résultat par quart, ou quand les joueurs sortent.", resultats: CYCLONE_HEURE }),
  table({ cle: "cyclone-depots", nom: "Ce que le cyclone dépose dans la cour", description: "Ce qui était mal fixé ailleurs et que le vent dépose chez soi : bonnes et mauvaises surprises (le système en tire un seul et l'applique ; la table sert à en raconter d'autres).", resultats: DEPOTS_CYCLONE.map(d => d.texte) }),
  table({ cle: "verrous-de-la-route", nom: "Verrous de la route", description: "Ce qui barre une route carrossable (le système ajoute le temps d'un verrou au voyage en véhicule) ; un vélo, un marcheur passent à côté.", resultats: VERROUS_ROUTE }),
  table({ cle: "jardin-d-une-case", nom: "Le jardin d'une case", description: "Ce qu'on trouve dans le jardin d'une case abandonnée (fouille « jardins »).", resultats: JARDIN_CASE }),
  table({ cle: "paroles-de-gramoune", nom: "Paroles de gramoune", description: "Ce que dit l'ancienne pendant une veillée d'apprentissage ou de dictée. En créole, avec le sens à côté.", resultats: PAROLES_GRAMOUNE }),
  table({ cle: "livres-trouves", nom: "Livres trouvés", description: "Le livre qu'on rapporte d'une fouille « livres » (le système tire le savoir qu'il apprend ; la table donne le livre).", resultats: LIVRES_TROUVES }),
  table({ cle: "chien-errant-confiance", nom: "Un chien errant, veillée après veillée", description: "Ce que fait le chien errant pendant qu'on gagne sa confiance.", resultats: CHIEN_ERRANT }),
  table({ cle: "meutes-des-routes", nom: "Meutes des routes", description: "Les chiens abandonnés vont en meutes, et tiennent les routes.", resultats: MEUTES })
];

// ---------------------------------------------------------------- Journal du MJ
const JOURNAL_MJ = journal({ cle: "deux-savoirs", nom: "Les deux savoirs et l'île en mouvement", pack: "mj", pages: [
  { cle: "deux-savoirs", titre: "Les deux savoirs", texte: `Le savoir d'autrefois vaut le savoir moderne. Les savoir-faire se rangent en deux **arbres** :

- **moderne** : électricité solaire, maraîchage, plomberie et filtration, maçonnerie, mécanique, premiers secours, radio, galeries, hydraulique, moteurs de fortune ;
- **lontan** (d'autrefois) : zerbaz et tisanes, jardin créole, bambou, vacoa et vétiver, pierre sèche, pêche, élevage, conserverie.

**L'autonomie complète** demande les deux : un abri autonome (sept jours de suite) et au moins deux savoir-faire de chaque arbre dans le groupe. La fiche d'abri et le tableau de bord le disent.

**Les installations à l'ancienne.** Plusieurs installations ont une **sœur lontan** faite en matières de l'île (bambou, vacoa, goyavier, vétiver, pierre sèche) : gouttières de bambou et jarres (citerne), conduite de bambou (captage), puits à balancier (pompe), jardin créole (potager), garde-manger lontan (réserve), palissade de bambou, mur de pierres sèches, guet dans un grand arbre (tour), ruches en tronc. La cuisine commune au feu de bois est la sœur lontan de la gazinière ; l'eau chauffée au feu de bois, celle des chauffe-eau. Pas de panneau solaire ni de batterie à l'ancienne.

- Elles se paient en **matières de l'île** (« ile » dans les coûts), prises sur le bois des alentours de l'abri, qui repousse ; elles se réparent avec les mêmes matières, sans matériaux fouillés.
- Elles sont **moins performantes** (une conduite de bambou fuit), souvent **plus discrètes** (un jardin créole ressemble à une cour à l'abandon).
- **Deux sœurs ne s'additionnent pas** : la moderne marche d'abord, la lontan attend en secours et prend le relais quand la moderne est cassée, éteinte ou à court (plus de gaz, plus d'eau d'arrosage). C'est l'intérêt de bâtir les deux.` },
  { cle: "gramoune", titre: "La gramoune, bibliothèque vivante", texte: `Une **gramoune** (un gramoun) a soixante ans ou plus et garde au moins un savoir lontan. Elle est fragile (lente, à soigner, pas de travaux lourds), et c'est la pièce la plus rare de l'île.

- **Sa confiance** va de 0 à 5. Elle se gagne veillée après veillée (fenêtre du MJ, onglet Savoirs : « Gagner sa confiance » : un test de parole, +1 dé si celui qui parle a lui-même un savoir lontan) ; un test forcé raté la fait baisser.
- **Apprendre** : une veillée par soir, à l'abri. Auprès d'une gramoune qui a confiance (3 ou plus), un savoir lontan qu'elle a s'apprend en **4 veillées** ; auprès de quelqu'un d'autre qui sait, en 7 ; dans un livre trouvé, en 14 ; dans le cahier d'une gramoune, en 7.
- **Lire prend de la lumière** : une unité d'énergie si l'abri en a, sinon une bougie, et ce soir-là l'abri se voit de loin (visibilité +1).
- **Le cahier** : écrire sous sa dictée, six veillées, si elle a confiance (3 ou plus). Il n'y en a qu'un ; il apprend ses savoirs lontan et lui survit. **Sinon, son savoir meurt avec elle** : le journal le dit le jour où elle s'en va.
- **Accueillir une gramoune** : la fenêtre du MJ propose quatre anciens de l'île, métissés comme elle (Gramoune Zélie Ah-Kiem, Gramoun Ignace Técher, Gramoune Mariamma Moutoussamy, Gramoun Saïd Madi), comme des recrues : test de parole, prix et raison d'être là. Leurs préjugés sont les leurs ; la partie les dément.` },
  { cle: "jardin", titre: "Le jardin créole, les livres, les objets faits main", texte: `**Les jardins des cases** sont le premier trésor d'une case abandonnée (fouille « jardins » dans une région, mieux dans une case, une maison, une ferme, un îlet). On en rapporte de la nourriture (chouchou, bananes, manioc, songe : ils tiennent des mois après le départ des gens), des **boutures** et des zerbaz.

- Les **boutures** meurent si on ne les replante pas : sans potager, jardin, serre ou verger en service, un tiers fane chaque jour. Avec, elles sont repiquées le soir même et deviennent des graines.
- Quand la pharmacie est vide, le jardin soigne : tisanes (2 plantes → 1 médicament), *rimèd lontan* avec le savoir des zerbaz (3 plantes → 2 médicaments).
- **Les livres** se fouillent (fouille « livres » : une école, une église, un commerce, une case) : un livre apprend un savoir-faire, moderne deux fois plus souvent que lontan. Il est rare, et chaque région en a peu.
- **Les objets faits main** (pinces à linge en bois fendu, sac, chaise et natte de vacoa, cordes de choka) coûtent trois fois rien ; deux d'entre eux à l'abri, ou un poêle de masse, ou un chauffe-eau de fortune, donnent +1 au moral de l'abri (au plus +1).` },
  { cle: "gaz", titre: "Le gaz et l'eau chaude", texte: `**Le gaz** est une ressource à part (en kilos : une bouteille en fait 13). On le trouve en fouillant (une bouteille sous l'évier de chaque case), il s'épuise, et il ne fait pas rouler un moteur. Il ne se range pas avec le carburant : ce ne sont ni les mêmes réserves, ni les mêmes usages.

- La **gazinière** (1 kg par jour) fait la cuisine sans fumée : plus discrète que la cuisine commune au feu de bois, qui prend le relais quand la bouteille est vide.
- L'**eau chaude** : chauffe-eau solaire (d'abord), chauffe-eau à gaz (1 kg par jour, quand le soleil ne suffit pas), eau chauffée au feu de bois (en dernier : la fumée se voit). Chacun donne +1 au moral et +1 dé aux soins à l'abri (on lave les plaies à l'eau chaude) ; ils ne s'additionnent pas.` },
  { cle: "cyclone", titre: "Le cyclone, pas à pas", texte: `Le système tire les cyclones (pré-alerte deux jours avant, orange la veille, rouge le jour) ; ils ne sont pas plus forts qu'avant. Ce qui change, c'est la façon de les vivre.

- **Avant : préparer.** Rentrer ou fixer ce qui s'envole (fenêtre du MJ, « Préparer le cyclone ») : 2 quarts-personne, plus 1 par installation exposée. Préparé dans les cinq jours : +1 de protection, et rien n'est emporté. Sinon, le vent emporte les tôles et les bâches (2 matériaux par point de force), les zerbaz qui séchaient, les boutures.
- **Le chien** du groupe s'agite le jour de la pré-alerte, même sans radio ; et la veille d'une éruption.
- **Pendant** (table « Cyclone — heure par heure ») : rafales et accalmies ; l'œil, si la région est au cœur de la trajectoire d'un cyclone fort ; puis le vent qui revient de l'autre côté. Dehors : −2 dés (−1 dans une accalmie), vigilance −3, mais +2 en discrétion. **Les Livides n'entendent rien sous le vacarme** : c'est le seul jour où l'on peut marteler sans se trahir (le bruit de l'abri ne compte pas).
- **Après** : les fuites ont rempli la citerne (+4 eau par point de force) d'une eau **à filtrer** (trois jours de risque doublé pour les maladies de l'eau sans filtre) ; les arbres tombés donnent du bois pour des semaines et des fruits à conserver vite ; les sentiers et les pistes restent coupés plus longtemps que la route (arbres en travers) ; la végétation abattue rend l'abri visible de plus loin (+force, −1 tous les quinze jours) ; et le vent a déposé dans la cour quelque chose qui était mal fixé ailleurs (bonne ou mauvaise surprise, parfois une menace).` },
  { cle: "chiens", titre: "Les chiens", texte: `Après le jour zéro, les chiens abandonnés vont en **meutes** qui tiennent les routes : sur la route, les rencontres de bêtes sont deux fois plus fréquentes, et nombreuses (3 à 7), parfois menées par un **chien de tête** (bestiaire).

**Gagner la confiance d'un chien errant** : c'est l'exception voulue à la règle qui veut que les animaux s'élèvent sans s'apprivoiser. Une veillée = 1 nourriture posée et un test de survie (+1 dé avec l'élevage) ; la confiance monte de 1 (de 2 avec une belle marge) ; à 5, le chien est au groupe (équipement « Chien du groupe »). Un test forcé raté : il mord (1 blessure, jamais de Gris) et recule.

**Le chien du groupe** : +1 au moral de l'abri (sauf si des chiens de garde y sont déjà), +1 en vigilance comme une installation (assauts compris), +1 dé au combat de son maître ; il peut y rester (le MJ le dit). Il s'agite avant le cyclone et le volcan.` },
  { cle: "routes", titre: "Se déplacer sans carburant", texte: `**La route** est rapide, bruyante, et pleine de **verrous** : une épave en travers (on la siphonne et on passe en chicane, on la pousse dans le vide dans un grand fracas, ou on la laisse), un éboulis, un tunnel à une voie, un arbre tombé. Seul un véhicule les rencontre ; le système ajoute leur temps au voyage et le carburant siphonné aux réserves, le MJ raconte (table « Verrous de la route »). **Le sentier** est lent et silencieux (rencontres × 0,7), on n'y passe que ce qu'on porte. Le pire endroit où tomber en panne : un lieu desservi par une seule route (Cilaos, Salazie, les Hauts).

- **La charrette à bœufs** : lente, silencieuse, porte quarante unités, les bêtes broutent les bas-côtés ; ce ne sont pas des montures ; trop large pour se faufiler entre les épaves.
- **Le vélo** descend des Hauts sans bruit et vite, et remonte en poussant (deux fois plus long qu'à pied) : des trajets presque à sens unique. Le vélo à assistance électrique remonte presque comme il descend.
- **Les véhicules électriques** (vélo, scooter, voiture) se rechargent sur les batteries de l'abri : l'énergie d'un trajet se prend au départ de l'abri.
- **Le carburant maison** : alcool de canne, huile filtrée, et le gazogène qui brûle du bois sec. Il faut d'abord modifier le moteur (savoir « Moteurs de fortune », atelier) ; le véhicule modifié est plus lent, et ne roule plus qu'avec ce carburant.` }
] });

// ---------------------------------------------------------------- Guide des joueurs
const GUIDE = journal({ cle: "vivre-sans-l-ancien-monde", nom: "Vivre sans l'ancien monde", pack: "guides", pages: [
  { cle: "lontan", titre: "Le savoir d'autrefois", texte: `Les matériaux de l'ancien monde finissent : le PVC casse, les tôles rouillent, plus personne ne fabrique de câble. Ce que les anciens savaient faire avec le bambou, le vacoa, la pierre et les plantes du jardin, lui, ne s'épuise pas.

- Beaucoup d'installations ont une version **à l'ancienne** : gratuite ou presque (on la bâtit avec le bois et les plantes des alentours), réparable soi-même, moins performante, souvent plus discrète. Bâtie à côté de la moderne, elle prend le relais quand la moderne casse.
- Les savoir-faire se rangent en deux **arbres**, moderne et lontan ; on n'est vraiment autonome qu'avec les deux.
- **Les gramounes** savent ce que plus personne ne sait. Gagnez leur confiance : on apprend plus vite à leurs côtés que dans un livre. Écrivez sous leur dictée, le soir : sinon, leur savoir partira avec elles.
- **Les jardins** des cases abandonnées gardent des mois chouchou, bananiers, manioc et songe. Prenez-y des boutures, et replantez-les le jour même.
- **Lire** prend du temps, et de la lumière : une lampe le soir se voit de loin.` },
  { cle: "cyclone", titre: "Quand le cyclone vient", texte: `- **Préparez** dès la pré-alerte : rentrez ou fixez tout ce qui peut s'envoler. Ce qu'on n'a pas fixé s'envole, et finit dans la cour de quelqu'un d'autre.
- **Pendant**, le vent et la pluie vont par rafales et accalmies. Sortir est possible, trempé, de travers, sourd et presque aveugle. Si le ciel s'ouvre d'un coup, méfiez-vous : c'est peut-être l'œil, et le vent reviendra de l'autre côté.
- Sous le vacarme, rien ne s'entend : ni vous, ni eux.
- **Après**, il y a du bois pour des semaines, des fruits à ramasser vite, des sentiers coupés, de l'eau à filtrer, et l'abri qu'on voit de plus loin tant que la végétation n'a pas repoussé.` },
  { cle: "routes", titre: "Sans carburant", texte: `- La **route** est rapide et bruyante, et chaque épave, chaque éboulis, chaque tunnel est un verrou. Le **sentier** est lent, silencieux, et on n'y passe que ce qu'on porte.
- Le **vélo** descend des Hauts sans un bruit ; il remonte en une journée de poussée.
- Une **charrette à bœufs** porte une case entière, lentement ; les bœufs mangent l'herbe du bord de la route.
- Un **véhicule électrique** se recharge sur les panneaux et les batteries de l'abri ; un moteur **modifié** boit l'alcool de canne, l'huile filtrée ou le bois sec du gazogène.
- Les **chiens errants** vont en meutes sur les routes. Un chien qu'on nourrit, patiemment, peut devenir le vôtre : il garde, il réconforte, il sent venir le cyclone avant le ciel.` }
] });

export const JOURNAUX_SAVOIRS = [GUIDE, JOURNAL_MJ];
