// Lot 10 du portage du jeu 3D (2026-11-17, contrat §22) : le marché chiffré, la porte, la religion et la table de gestion. Le contenu :
// les corvées (sous-tâches des treize tâches), le barème des objets (leur valeur en parts), deux tables du MJ (le départ préparé, ce
// qu'on dit de celui qui change de religion) et les pages des guides. Les règles sont dans le système (logique/gestion.mjs,
// marche.mjs, porte.mjs, esprit.mjs, chefs.mjs ; docs/equilibre-communaute.md).
// Rien n'est magique ; aucune religion, aucune origine ne joue dans les règles ; les préjugés sont dans la bouche des personnages, et
// les faits les démentent.
import { table, MODULE } from "./aides.mjs";

// ---------------------------------------------------------------- Les corvées (jeu 3D, paquets/base/jeu/taches.json)
// { cle, nom, tache (l'une des treize du §10.3), description } : ce que fait au juste celui qui tient la tâche. De la couleur pour la
// table de gestion et le MJ IA : aucune n'a d'effet de jeu.
const corvee = (cle, tache, nom, description) => ({ cle, nom, tache, description });
export const CORVEES = [
  corvee("rapporter-des-troncs", "chantier", "Rapporter des troncs", "Abattre un arbre mort ou couché par le vent, l'ébrancher, le débiter et le traîner jusqu'à l'abri."),
  corvee("rapporter-du-bambou", "chantier", "Rapporter du bambou", "Couper les cannes de bambou de la ravine, les plus droites, et les lier en fagots."),
  corvee("rapporter-du-petit-bois", "chantier", "Rapporter du petit bois", "Des gaulettes et des branches pour les clôtures, les claies et le feu."),
  corvee("rapporter-des-fibres", "chantier", "Rapporter des fibres", "Feuilles de vacoa et de choka, chaume, canne coupée : de quoi tresser, couvrir et lier."),
  corvee("rapporter-des-pierres", "chantier", "Rapporter des pierres", "Les galets de la ravine et les moellons d'un mur effondré, portés à dos ou à la brouette."),
  corvee("rapporter-de-la-terre", "chantier", "Rapporter de la terre", "Terre, argile et sable pour le torchis, les planches du jardin et les sacs de la barricade."),
  corvee("rapporter-de-la-recuperation", "fouille", "Rapporter de la récupération", "Démonter ce qui traîne alentour : tôles, ferraille, fil de fer, clous, tuyaux, câbles."),
  corvee("puiser-de-l-eau", "eau", "Puiser l'eau", "Aller à la source, au bassin ou à la citerne, remplir les bidons et revenir sans rien renverser."),
  corvee("rapporter-des-vivres", "cultures", "Rapporter des vivres", "Cueillir, ramasser les œufs, traire, couper les brèdes, relever les nasses à camarons."),
  corvee("rapporter-des-zerbaz", "soins", "Rapporter des zerbaz", "Les plantes qui soignent, cueillies là où la gramoune a dit, et pas ailleurs."),
  corvee("scier-des-planches", "atelier", "Scier des planches", "Débiter un tronc en planches, à la scie de long, à deux, toute une journée."),
  corvee("tailler-des-poutres", "atelier", "Tailler des poutres", "Équarrir les poutres et fendre les bardeaux pour la charpente et le toit."),
  corvee("tresser-de-la-corde", "atelier", "Tresser de la corde", "Rouler et tresser les fibres de choka ou de coco en cordes qui tiennent."),
  corvee("faire-des-clous", "atelier", "Faire des clous", "Redresser les clous de récupération, tailler des chevilles de bois dur."),
  corvee("preparer-le-mortier", "atelier", "Préparer le mortier", "Gâcher le torchis, éteindre la chaux, monter le mortier à la pelle."),
  corvee("cuisiner", "cuisine", "Cuisiner", "Le cari du soir, le boucané, les achards, les conserves pour les jours sans."),
  corvee("rendre-l-eau-bonne", "eau", "Rendre l'eau bonne", "Filtrer, faire bouillir, laisser reposer : l'eau de pluie et de ravine devient de l'eau à boire."),
  corvee("preparer-des-soins", "soins", "Préparer des soins", "Pansements bouillis et séchés, tisanes, cataplasmes, baumes de la gramoune."),
  corvee("batir", "chantier", "Bâtir", "Monter ce qu'on a décidé : poser, clouer, lier, caler, recommencer."),
  corvee("entretenir-les-installations", "chantier", "Entretenir les installations", "Le tour de ce qui tient l'abri en vie : une charnière, un joint, une planche qui bouge."),
  corvee("nettoyer-les-filtres", "eau", "Nettoyer les filtres", "Rincer le sable, changer le charbon, déboucher les gouttières avant la pluie."),
  corvee("nourrir-les-betes", "elevage", "Nourrir les bêtes", "Le grain des poules, l'herbe des cabris, l'eau de tout le monde, et compter qu'il ne manque personne."),
  corvee("relever-les-productions", "cultures", "Relever les productions", "Faire le tour des planches, des ruches et des enclos, et rapporter ce qu'ils ont donné."),
  corvee("inspecter-les-cables-et-tuyaux", "chantier", "Inspecter les câbles et les tuyaux", "Suivre le tuyau de la source et les fils des panneaux, chercher la fuite ou le fil rongé."),
  corvee("reparer-les-defenses", "chantier", "Réparer les défenses", "Reprendre la barricade, regarnir la palissade, retendre les cloches d'alerte."),
  corvee("monter-la-garde", "garde", "Monter la garde", "La ronde, les yeux sur la route et sur la ravine, l'oreille aux cloches, la nuit entière s'il le faut.")
];

// ---------------------------------------------------------------- Le barème des objets (valeur en parts ; une part = un jour de vivres)
// Les valeurs écrites à la main du jeu 3D (paquets/base/jeu/bareme.json, en valeurs du barème : une part = 2), pour les objets qu'on
// ne fabrique pas ou qui valent plus que leur recette, et les bêtes vivantes. Les autres objets valent le coût de leur recette au cours
// (logique/marche.mjs, valeurObjet), sinon ce que dit le MJ.
export const BAREME = {
  objets: {
    tronconneuse: 22.5, "fusil-de-chasse": 20, "carabine-22": 17.5, "pistolet-de-service": 17.5,
    "carte-routiere-de-l-ile": 6, "carte-de-randonnee-de-cilaos": 4, "carte-ancienne-de-l-ile": 3,
    // Les bêtes vivantes (le lot du vivant de l'abri en fera des objets ; leur valeur est déjà là).
    poule: 4, lapin: 4, cabri: 10, porcelet: 12.5, "veau-moka": 20, essaim: 7.5
  }
};

// ---------------------------------------------------------------- Tables du MJ
const T = (cle, nom, description, resultats, drapeaux = {}) => {
  const t = table({ cle, nom, description, resultats });
  Object.assign(t.flags[MODULE], drapeaux);
  return t;
};
const DEPART_PREPARE = [
  "Il manque deux rations de riz, puis trois. Personne n'a rien vu, et chacun regarde son voisin.",
  "Un bidon d'eau a disparu de la citerne ; le cadenas n'est pas forcé.",
  "Deux d'entre eux se taisent quand le chef approche, et parlent bas, le soir, au bout du camp.",
  "La ronde trouve, sous une tôle au bord de la ravine, des bouteilles d'eau et un sac de vivres bien ficelé.",
  "On retrouve un plan dessiné au charbon sur un carton : le chemin vers les Hauts, une croix sur un îlet.",
  "Une petite demande si « tonton » va revenir : elle l'a vu cacher quelque chose derrière le manguier.",
  "Le chef les surprend au portail avant le jour, sacs au dos. Il peut les retenir, les laisser partir, ou partir avec eux.",
  "La cache est vide ce matin. Ils sont partis cette nuit avec ce qu'ils avaient mis de côté, et rien de plus."
];
const CONVERSION = [
  "« Il prie là où on lui donne à manger », dit une voisine. Elle l'a pourtant vu laisser sa part aux enfants, hier soir.",
  "« Une religion, ça ne se change pas comme une chemise. » Celle qui le dit va à la messe et au temple depuis quarante ans.",
  "Au repas, deux soirs de suite, personne ne s'assoit à côté de lui. Le troisième, si.",
  "Le frère qui lisait la Bible lui offre la sienne, sans un mot, et repart.",
  "La grand-mère pose quand même une assiette pour les anciens, et une pour lui : « Les morts, eux, ne font pas d'histoires. »",
  "Un gamin demande si le bon Dieu est fâché. Personne ne sait quoi répondre ; le jeu non plus."
];
export const TABLES_COMMUNAUTE = [
  T("depart-prepare", "La communauté — le départ préparé",
    "Une suite à la désertion : des membres qui n'écoutent plus le chef préparent leur départ en douce. Des stocks manquent peu à peu, une cache se monte hors les murs ; la ronde peut la découvrir ; le chef retient les partants, les laisse partir ou part avec eux. Rien n'est automatique : à jouer.",
    DEPART_PREPARE, { communaute: "depart-prepare" }),
  T("ce-qu-on-dit-d-une-conversion", "La religion — ce qu'on dit de celui qui en change",
    "Quitter sa religion, ou en changer souvent, se sait. Ce que disent les autres : leurs préjugés, que les faits démentent. Le jeu ne dit pas qui a raison.",
    CONVERSION, { esprit: "conversion" })
];

// ---------------------------------------------------------------- Pages des guides
export const PAGES_JOUEUR_COMMUNAUTE = [
  { cle: "table-de-gestion", titre: "La table de gestion, les rangs et le marché", texte: `**Les rangs.** Le groupe a un **chef**, des **seconds** (trois au plus, dans l'ordre de la succession), des **membres** et des **nouveaux** (arrivés depuis moins d'une semaine, ou pas encore admis). Le second succède au chef ; un nouveau ne peut être ni chef ni second, un jeune de 16 ou 17 ans non plus. **La mort coûte le rang** : celui qui prend la relève entre simple membre.

**La table de gestion.** Chacun a ses forces. Pour chaque membre, on règle les tâches qu'il fait et dans quel ordre : **1** d'abord, puis **2**, **3**, **4** ; **0**, jamais. Chaque jour, ceux qu'on ne joue pas (compagnons, recrues) prennent la tâche de plus haute priorité qui a du travail, et à égalité celle où ils sont les meilleurs. Votre survivant, vous le menez vous-même. Ce qui a du travail : la garde, l'eau, la pêche, la chasse et la fouille toujours ; les soins s'il y a un blessé ; la cuisine s'il y a des vivres ; le chantier s'il y a un chantier ou une installation abîmée ; l'atelier s'il y a des matériaux ; les cultures et l'élevage s'il y en a.

**Les quotas.** Le chef peut demander « tant de jours par semaine » à une tâche. C'est une demande, suivie et affichée : personne n'est puni par le jeu. Ce que le groupe en pense, c'est à vous de le jouer.

**Les corvées.** Chaque tâche a ses corvées : puiser l'eau, rapporter des troncs, nettoyer les filtres, nourrir les bêtes… Elles disent ce que fait au juste chacun, sans rien changer aux règles.

**Changer de religion.** On peut changer de religion en cours de partie, dans un lieu de culte. Pendant un mois, on tient des deux : on prie avec les uns et les autres, on compte les fêtes des deux, mais l'observance la plus exigeante s'impose et la foi ne porte pas plus haut. Quitter sa religion, ou en changer souvent, se sait. Rien n'est magique : seul le moral bouge.

**La boutique.** Le commerçant revend plus cher qu'il ne rachète. Il ne voit pas ce que vous êtes au fond, seulement ce qu'on dit de vous (votre **réputation**), et il écoute qui parle bien : une bonne réputation et une bonne parole font de meilleurs prix et plus de crédit au carnet.

**L'étal.** Au marché forain, le groupe peut tenir un étal : des biens posés à son prix, payés dans le bien qu'il demande. L'étal vend les jours de marché, même sans vous ; on relève la caisse quand on passe. Sans gardien, on peut s'y servir.` }
];

export const PAGES_MJ_COMMUNAUTE = [
  { cle: "table-de-gestion-et-marche", titre: "Mener la table de gestion, le marché chiffré et la porte", texte: `Tout se règle dans la **fenêtre du MJ** : onglet **Groupe** (la table de gestion, les rangs, les quotas, les corvées), onglet **Communauté** (les seconds, le passage, changer de religion), onglet **Marché** (la boutique et sa marge, l'étal).

# La table de gestion

- La grille ne règle que ceux qu'on ne joue pas. Un joueur choisit sa tâche ; vous pouvez lui proposer un **quota**, que le système suit sans jamais le punir. Si le quota n'est pas tenu, c'est au groupe d'en parler, pas au jeu de sanctionner.
- Sans grille, un compagnon suit la répartition automatique (réglage du monde). Avec une grille, il la suit chaque jour, même sans ce réglage.
- Les PNJ apprennent comme les joueurs : une tâche tenue une semaine donne une marque à chacun.

# Les rangs et le départ préparé

- Le chef mort, son premier second prend la tête ; sans second, le groupe n'a plus de chef : laissez-le se choisir, ou proposez un vote.
- Une autorité trop basse fait déserter (contrat §14). Pour jouer la désertion sur la durée, tirez dans la table **« le départ préparé »** : des stocks qui manquent, une cache hors les murs que la ronde peut trouver, et le chef qui retient les partants, les laisse partir ou part avec eux.

# Le passage entre abris

Un accord de passage avec une communauté voisine se donne et se retire. Le retirer ferme le passage, et les deux communautés le savent : c'est un geste politique, jouez-en les suites.

# La porte

- Le refusé **comprend** le plus souvent (60 fois sur 100) ; sinon il garde rancune (un feu près du camp) ou revient avec ce qui manque, selon sa couleur. Un tout rouge ne revient jamais, un tout bleu n'est jamais rancunier.
- L'**attitude** d'un inconnu (amicale, neutre, méfiante, hostile) est tirée avec la recrue ; elle règle la difficulté pour le convaincre.
- On n'insiste pas : le système compte les tentatives du jour auprès d'une même recrue. La deuxième, c'est à vous de dire si elle passe encore.

# La religion

Changer de religion se fait dans un lieu de culte (église, temple, mosquée, pagode, chapelle de bord de route). Pendant un mois, le converti tient des deux (prier ensemble, les fêtes) et porte l'observance la plus exigeante ; ensuite seule la nouvelle compte. Quitter sa religion, ou en changer souvent, lance une rumeur vraie (le Ladi Lafé) : la table **« ce qu'on dit de celui qui en change »** donne les voix des autres, que les faits démentent. Aucune religion n'a d'effet propre.

# Le marché chiffré

- **La boutique** : le commerçant revend à 1,25 fois le cours et rachète à 0,6 fois ; sa confiance suit la réputation du client (pas son sens moral, qu'il ne voit pas) et sa parole. Tout bleu, on paie 1,09 fois et on reçoit 0,69 ; tout rouge, 1,67 et 0,45. Ses préjugés s'y ajoutent. Un commerçant n'est resté que dans trois boutiques sur dix.
- **La valeur d'un objet** : le barème pour les armes, les outils rares et les bêtes vivantes ; sinon le coût de sa recette au cours.
- **L'étal** vend les jours de marché, même sans le groupe ; une chance sur dix qu'on s'y serve sans gardien.

# Jouer un PNJ croisé

Ce qu'il fait d'abord, dans l'ordre : **partir** (s'il l'a décidé), **fuir** (un Livide trop près), **écouter** (quelqu'un lui parle), **boire**, **manger**, **dormir**, **faire sa tâche**, et sinon **errer** autour de son coin. Il ne s'arrête pour parler que si rien d'avant ne le presse.` }
];
