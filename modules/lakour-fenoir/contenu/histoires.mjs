// Les histoires des survivants (contrat §16 ; lot 11 du portage du jeu 3D, 2026-11-17) : environ 440 phrases d'histoire écrites
// pour Fénoir 3D (donnees/histoires/, décision de Jordan des 14 et 15 novembre 2026 : « beaucoup plus d'histoires, beaucoup de natifs
// de La Réunion »), reprises pour la table. Le générateur du système (logique/histoires.mjs, appelé par genererSurvivant) en tire 3 à
// 5 par survivant, sans contradiction : la graine d'histoire de la fenêtre de création, du MJ IA et du portrait du journal
// « Histoire de… ». Aucune n'a d'effet de jeu.
//
// Une phrase : { sujet, texte, marques?, exclut?, age?: [min, max], pratique?, foi? }.
// - texte : accordé entre accolades, le féminin d'abord : « {Elle|Il} est né{e|} à Cilaos ». L'anglais suit la même forme
//   (contenu/en/registre.json : « {She|He} was born in Cilaos »).
// - sujet : une histoire ne prend jamais deux phrases du même sujet ; « lieu » (où l'on a grandi) ouvre la part de l'enfance,
//   « metier » celle du passé. Une phrase de passé ne dit rien de l'enfance, des parents ni du lieu de naissance.
// - marques / exclut : ce que la phrase affirme, et ce avec quoi elle ne va pas. « nee-ailleurs » : né hors de l'île ; une enfance
//   d'origine « ailleurs » la porte toujours, et les souvenirs d'une vie entière dans l'île l'excluent.
// - pratique : seulement pour un croyant pratiquant ; foi : seulement si sa religion (ou l'une des siennes) est dans la liste.
//   L'enfance ne fixe jamais la foi : une enfance tamoule peut donner un survivant sans religion, et la phrase du front cendré tombe.
// Un groupe : { cle, type: "enfance" | "passe" | "trait" | "religion" | "regard" | "generation", pour: [clés], avec?, phrases }.
// pour : les clés du contenu à qui le groupe parle ; une religion donne d'abord l'ancienne clé de FVTT (elle fait la clé du groupe,
// que gardent les fiches : « religion:hindouisme-tamoul/1 »), puis celle de la liste commune aux deux jeux (lot 10, contrat §22 :
// les clés du jeu 3D, plus « servis-kabare »). Une religion double (« hindoue-catholique ») trouve aussi les phrases de ses deux
// religions (logique/esprit.mjs, religionsDe). avec (religion « plusieurs ») : de chaque liste, l'une au moins dans ses religions.
//
// Ce qui a changé en route (docs/equilibre-histoires.md) : « Grand Îlet » à la manière de FVTT ; la phrase de l'enfance yab qui
// disait la peau et les yeux devient celle du nom (guide du métissage : on est métis) ; le front cendré de l'enfance tamoule
// demande la foi hindoue ; les religions du jeu 3D vont aux clés de FVTT (hindoue -> hindouisme tamoul, musulmane -> islam,
// protestante -> évangélique, bouddhiste -> culte chinois, hindoue catholique -> plusieurs, catholique et hindouisme tamoul) ; deux
// phrases écrites pour le servis kabaré ; les préjugés restent dans la bouche des gens (« on disait que la boutique… », « on
// l'appelait yab kouyon ») et les faits les démentent.

const p = (sujet, texte, options = {}) => ({ sujet, texte, ...options });
function groupe(type, pour, phrases, options = {}) {
  return { cle: type === "generation" ? "generation" : `${type}:${pour[0]}`, type, pour, ...options, phrases };
}

export const HISTOIRES = [
// ---------------------------------------------------------------- Enfances (le sujet « lieu » ouvre l'histoire)
  groupe("enfance", ["enfant-des-hauts-de-salazie"], [
    p("lieu", "{Elle|Il} a grandi à Grand Îlet, où l'on rentrait de l'école à pied sous la pluie."),
    p("lieu", "{Elle|Il} a grandi à Hell-Bourg, dans une case en bois sous tôle dont la varangue donnait sur la brume."),
    p("lieu", "{Elle|Il} vient de Mare à Vieille Place, un écart de Salazie où le chouchou grimpe jusque sur les fils électriques."),
    p("famille", "Sa grand-mère lui a appris le nom de chaque plante de la forêt."),
    p("famille", "Chez {elle|lui}, on vendait le chouchou au bord de la route, dans des gonis posés sur une chaise."),
    p("ecole", "Le car du collège partait avant le jour ; {elle|il} finissait sa nuit contre la vitre."),
    p("geste", "{Elle|Il} sait traverser un radier en crue, et surtout quand il ne faut pas le traverser."),
    p("geste", "{Elle|Il} sait tresser un panier en paille de chouchou, les yeux fermés."),
    p("marque", "{Elle|Il} compte les cascades après la pluie comme d'autres comptent les jours."),
    p("marque", "La pluie ne {la|le} gêne pas : {elle|il} dit qu'à Salazie on naît mouillé."),
    p("ile", "L'année de ses dix ans, un cyclone a coupé la route du cirque trois semaines ; personne n'a manqué de rien.")
  ]),
  groupe("enfance", ["gamin-du-port"], [
    p("lieu", "{Elle|Il} a grandi dans une cité du Port, à l'ombre des grues."),
    p("lieu", "{Elle|Il} a grandi à La Rivière des Galets, du côté où le vent du large apporte la poussière du port."),
    p("lieu", "{Elle|Il} est {une|un} enfant du Port : quatre étages, une cour en béton, et la sirène des bateaux pour horloge."),
    p("famille", "Sa bande d'enfance, c'était sa famille."),
    p("famille", "Son père était docker ; il rentrait avec l'odeur du sucre en vrac sur les mains."),
    p("ecole", "{Elle|Il} a séché plus de cours qu'{elle|il} n'en a suivis, mais sait compter une cargaison d'un coup d'œil."),
    p("geste", "{Elle|Il} pêchait au bout de la jetée, avec un fil et une capsule de bouteille pour plomb."),
    p("geste", "{Elle|Il} sait réparer un vélo avec ce qui traîne, et l'a fait pour toute la cité."),
    p("marque", "{Elle|Il} ne laisse jamais quelqu'un des siens derrière : c'est la seule règle qu'{elle|il} ait gardée."),
    p("marque", "{Elle|Il} reconnaît un bateau à son bruit avant de le voir."),
    p("ile", "Les soirs de maloya sur le front de mer, {elle|il} tenait le kayamb pour les grands.")
  ]),
  groupe("enfance", ["fille-de-pecheur-de-saint-pierre"], [
    p("lieu", "{Elle|Il} a grandi sur le port de Saint-Pierre, entre les filets de son père."),
    p("lieu", "{Elle|Il} a grandi à Terre Sainte, le quartier des pêcheurs, où les barques dorment devant les cases."),
    p("lieu", "{Elle|Il} vient de Terre Sainte : une ruelle, un banian, et la mer au bout."),
    p("famille", "{Elle|Il} savait nager avant de savoir marcher, disait sa mère."),
    p("famille", "Sa mère vendait le poisson sur le quai et ne s'est jamais trompée d'un sou."),
    p("ecole", "À l'école, {elle|il} sentait le poisson le lundi, et a appris à en rire avant les autres."),
    p("geste", "{Elle|Il} sait ramender un filet, vider un thon et lire le ciel de l'après-midi."),
    p("geste", "{Elle|Il} a tenu la barre pour la première fois à neuf ans, un matin sans vent."),
    p("marque", "{Elle|Il} regarde toujours la mer avant de décider quoi que ce soit."),
    p("marque", "{Elle|Il} ne mange pas de poisson le jour où quelqu'un n'est pas rentré."),
    p("ile", "{Elle|Il} a vu la houle australe passer par-dessus la jetée, et les anciens remonter les barques à la main.")
  ]),
  groupe("enfance", ["enfance-zoreil"], [
    p("lieu", "{Elle|Il} est arrivé{e|} de métropole à dix ans et a mis un an à comprendre le créole de la cour de récréation.", { marques: ["nee-ailleurs"] }),
    p("lieu", "{Elle|Il} a débarqué à dix ans d'une ville grise du Nord, avec un anorak qui n'a plus jamais servi.", { marques: ["nee-ailleurs"] }),
    p("lieu", "{Elle|Il} avait dix ans quand la famille a suivi une mutation jusqu'à Saint-Gilles-les-Bains ; cela devait durer trois ans.", { marques: ["nee-ailleurs"] }),
    p("marque", "{Elle|Il} dit toujours qu'{elle|il} est d'ici, et on lui répond toujours que non."),
    p("marque", "{Elle|Il} parle créole avec un accent que tout le monde reconnaît, et le parle quand même."),
    p("ecole", "On l'appelait « zoreil » à l'école ; {elle|il} a fini par répondre au mot comme à un prénom."),
    p("geste", "{Elle|Il} a appris le cari chez la voisine, qui ne lui a jamais donné la recette, seulement les gestes."),
    p("famille", "Ses parents sont repartis ; {elle|il} est resté{e|}, sans jamais bien savoir l'expliquer."),
    p("ile", "{Elle|Il} attrape encore des coups de soleil, et tout le monde le lui fait remarquer.")
  ]),
  groupe("enfance", ["enfant-de-la-cite-saint-denis"], [
    p("lieu", "{Elle|Il} a grandi au dixième étage d'une barre du Chaudron."),
    p("lieu", "{Elle|Il} a grandi au Butor, à Saint-Denis, dans un immeuble dont l'ascenseur n'a jamais marché deux mois de suite."),
    p("lieu", "{Elle|Il} vient d'une cité de Saint-Denis où les mères se parlaient de balcon à balcon."),
    p("marque", "{Elle|Il} connaît chaque raccourci de Saint-Denis, chaque cage d'escalier ouverte."),
    p("marque", "{Elle|Il} dort mieux avec du bruit : le silence des Hauts {la|le} réveille."),
    p("famille", "Sa mère faisait des samoussas pour tout l'étage, et l'étage gardait les enfants en retour."),
    p("ecole", "{Elle|Il} faisait ses devoirs dans l'escalier, là où il y avait de la lumière et pas de petits frères."),
    p("geste", "{Elle|Il} sait ouvrir une porte sans la clé et ne s'en vante pas."),
    p("geste", "{Elle|Il} jouait au foot pieds nus sur le béton, jusqu'à ce que les lampadaires s'allument."),
    p("ile", "Pour le 20 désanm, toute la cité descendait au Barachois, les petits sur les épaules."),
    p("ile", "{Elle|Il} a vu la mer tous les jours de sa vie sans presque jamais s'y baigner.")
  ]),
  groupe("enfance", ["enfance-a-mayotte"], [
    p("lieu", "{Elle|Il} a grandi à Mayotte avant de rejoindre une tante à Saint-Denis.", { marques: ["nee-ailleurs"] }),
    p("lieu", "{Elle|Il} a grandi à Mayotte, dans un village au bord du lagon, et a pris l'avion pour la première fois à quatorze ans.", { marques: ["nee-ailleurs"] }),
    p("famille", "{Elle|Il} parlait shimaoré à sa mère au téléphone, chaque dimanche."),
    p("famille", "Une tante l'a recueilli{e|}, qui comptait un enfant de plus sans jamais compter la dépense."),
    p("ecole", "École coranique le matin, école de la République l'après-midi : {elle|il} a toujours eu deux cartables."),
    p("marque", "On lui a tant demandé ses papiers qu'{elle|il} les garde encore sur {elle|lui}, par réflexe."),
    p("marque", "{Elle|Il} compare encore les deux lagons, et ne dit jamais lequel gagne."),
    p("geste", "{Elle|Il} sait griller le manioc et le poisson sur trois pierres, comme au voulé du dimanche.")
  ]),
  groupe("enfance", ["enfance-comorienne-du-chaudron"], [
    p("lieu", "{Elle|Il} est né{e|} au Chaudron, dans une famille venue de la Grande Comore."),
    p("lieu", "{Elle|Il} a grandi au Chaudron, dans un trois-pièces où l'on était neuf et où il restait toujours une place."),
    p("lieu", "{Elle|Il} vient du Chaudron, de l'immeuble où la cage d'escalier sentait le pilao le vendredi."),
    p("famille", "{Elle|Il} traduisait pour sa grand-mère au guichet, du shikomori au français et retour."),
    p("famille", "Les grands mariages de la famille duraient des jours ; {elle|il} y a appris à servir cent personnes sans rien renverser."),
    p("marque", "Quand on lui demande d'où {elle|il} vient, {elle|il} répond « du Chaudron », et on insiste quand même."),
    p("marque", "{Elle|Il} parle créole, français et shikomori dans la même phrase, sans s'en apercevoir."),
    p("ecole", "{Elle|Il} était en tête de la classe, et en queue de la liste des invités aux anniversaires."),
    p("geste", "{Elle|Il} sait qui prévenir, et dans quel ordre, quand quelqu'un du quartier a besoin d'aide."),
    p("ile", "{Elle|Il} n'a vu les Comores qu'une fois, un été, et s'y est senti{e|} de passage là-bas aussi."),
    p("ile", "{Elle|Il} a appris à se taire quand on parle des « derniers arrivés », et à ne pas oublier qui parlait.")
  ]),
  groupe("enfance", ["enfance-a-madagascar"], [
    p("lieu", "{Elle|Il} a grandi à Madagascar, sur les Hautes Terres, où l'hiver pique plus qu'ici.", { marques: ["nee-ailleurs"] }),
    p("lieu", "{Elle|Il} a grandi à Tamatave, sur la côte est de Madagascar, face à la même mer vue de l'autre côté.", { marques: ["nee-ailleurs"] }),
    p("famille", "{Elle|Il} envoyait chaque mois de l'argent à ses frères restés au pays."),
    p("geste", "{Elle|Il} sait réparer n'importe quoi avec presque rien : là-bas, on n'avait pas le choix."),
    p("geste", "{Elle|Il} sait repiquer le riz, et sourit de voir l'île acheter le sien en sac."),
    p("marque", "{Elle|Il} est arrivé{e|} avec un visa de trois mois et une valise prêtée ; c'était il y a longtemps.", { age: [26, 120] }),
    p("marque", "{Elle|Il} a retrouvé ici des mots malgaches dans le créole, et des noms de famille déjà connus."),
    p("ecole", "{Elle|Il} a appris le français à l'école, dans des livres plus vieux que l'instituteur.")
  ]),
  groupe("enfance", ["enfance-a-maurice"], [
    p("lieu", "{Elle|Il} a grandi à Maurice et a traversé pour suivre {son mari|sa femme}.", { marques: ["nee-ailleurs"], age: [20, 120] }),
    p("lieu", "{Elle|Il} a grandi à Maurice, à Mahébourg, et a traversé à vingt ans pour un travail de six mois.", { marques: ["nee-ailleurs"], age: [21, 120] }),
    p("lieu", "{Elle|Il} a grandi à Maurice, dans un village de canne, avant que la famille ne traverse.", { marques: ["nee-ailleurs"] }),
    p("marque", "{Elle|Il} compare tout à son île natale, et finit toujours par dire que celle-ci n'est pas mal non plus."),
    p("marque", "Son créole n'est pas tout à fait celui d'ici ; on {la|le} comprend, on {la|le} taquine, et {elle|il} taquine en retour."),
    p("famille", "Sa mère parlait bhojpuri à la maison, créole au marché et anglais devant l'administration."),
    p("geste", "{Elle|Il} fait les dholl puri de sa mère, et refuse d'entendre qu'ils ressemblent à autre chose."),
    p("ecole", "{Elle|Il} a appris à lire en anglais et en français à la fois, et mélange encore les deux en comptant.")
  ]),
  groupe("enfance", ["enfant-de-planteur-de-l-est"], [
    p("lieu", "{Elle|Il} a grandi à Cambuston, au milieu de la canne, là où la route est droite et le ciel bas."),
    p("lieu", "{Elle|Il} a grandi à Bras-Panon, dans une case entre la vanille sous ombrière et le champ de canne."),
    p("lieu", "{Elle|Il} vient de Sainte-Anne, sur la côte au vent, où il pleut même quand il fait beau."),
    p("geste", "{Elle|Il} a coupé sa première canne à douze ans, avec le sabre de son père."),
    p("geste", "{Elle|Il} sait féconder la vanille à la main, fleur par fleur, avant que le soleil ne soit haut."),
    p("famille", "Chaque Dipavali, sa famille allumait des lampes jusque dans la cour."),
    p("famille", "Pendant la coupe, toute la famille vivait au rythme du cachalot, le camion qui emporte la canne à l'usine."),
    p("ecole", "{Elle|Il} manquait l'école pendant la coupe ; la maîtresse ne disait rien, ayant grandi là aussi."),
    p("marque", "L'odeur de la bagasse chaude lui manque plus que tout le reste."),
    p("marque", "{Elle|Il} juge une terre en la prenant dans la main."),
    p("ile", "{Elle|Il} a vu la rivière sortir de son lit et emporter un champ entier en une nuit.")
  ]),
  groupe("enfance", ["enfant-de-mafate"], [
    p("lieu", "{Elle|Il} a grandi à La Nouvelle, dans Mafate, où l'école n'avait qu'une classe."),
    p("lieu", "{Elle|Il} a grandi à Roche Plate, sous le rempart du Maïdo, à trois heures de marche de la première route."),
    p("lieu", "{Elle|Il} vient d'Aurère, un îlet de Mafate où ce qui ne pousse pas arrive par hélicoptère ou à dos d'homme."),
    p("marque", "{Elle|Il} est descendu{e|} en ville à quinze ans et n'a jamais aimé le bruit des voitures."),
    p("marque", "{Elle|Il} marche vite et parle peu ; dans le cirque, les deux vont ensemble."),
    p("famille", "Son père portait le courrier d'îlet en îlet, et savait qui attendait quoi."),
    p("ecole", "Pour le collège, il a fallu descendre : la semaine en internat, le sentier le vendredi soir."),
    p("geste", "{Elle|Il} sait porter une charge sur la tête, sur un sentier large comme deux pieds."),
    p("geste", "{Elle|Il} sait où l'eau sort de la roche, même en saison sèche."),
    p("ile", "{Elle|Il} a appris les étoiles avant les lampadaires : l'électricité, c'était un panneau et une batterie."),
    p("ile", "{Elle|Il} connaît le nom de chaque îlet, et celui des familles qui y vivent.")
  ]),
  groupe("enfance", ["enfant-du-tampon"], [
    p("lieu", "{Elle|Il} a grandi au Dix-Septième, dans une case avec un grand jardin."),
    p("lieu", "{Elle|Il} a grandi au Petit-Tampon, là où les rues montent droit vers la brume."),
    p("lieu", "{Elle|Il} vient de Bérive, dans les hauts du Tampon, entre les géraniums et les champs de pommes de terre."),
    p("famille", "Les vacances, c'était la ferme de son oncle, à la Plaine des Cafres."),
    p("famille", "Le dimanche, toute la famille montait pique-niquer au Nez de Boeuf, la marmite de cari dans le coffre."),
    p("ecole", "{Elle|Il} allait à l'école en pull, et se moquait des cousins des Bas qui grelottaient à dix-huit degrés."),
    p("geste", "{Elle|Il} sait faire pousser à peu près tout, pourvu qu'on lui laisse un carré de terre et de la brume."),
    p("marque", "{Elle|Il} donne les adresses en kilomètres, comme tout le monde là-haut : le Quatorzième, le Vingt-Deuxième."),
    p("marque", "{Elle|Il} ne se sent bien qu'avec une pente sous les pieds."),
    p("ile", "À la fête des fleurs du Tampon, {elle|il} tenait le stand de la famille et rendait la monnaie de tête."),
    p("ile", "{Elle|Il} a vu le volcan rougir le ciel depuis la fenêtre de sa chambre, plus d'une nuit.")
  ]),
  groupe("enfance", ["enfant-de-l-ouest"], [
    p("lieu", "{Elle|Il} a grandi à L'Ermitage, et a appris à nager dans le lagon avant d'apprendre à lire."),
    p("lieu", "{Elle|Il} a grandi à La Saline les Bains, à deux rues de la plage et des filaos."),
    p("lieu", "{Elle|Il} a grandi à Saint-Paul, près du marché du front de mer, où l'on vend de tout le vendredi."),
    p("travail", "L'été, {elle|il} vendait des glaces sur la plage aux touristes."),
    p("geste", "{Elle|Il} sait lire la passe et le courant, et à quelle heure le lagon se vide."),
    p("geste", "{Elle|Il} pêchait le zourite à marée basse, avec un bâton et la patience de sa grand-mère."),
    p("famille", "Sa famille louait la case aux vacanciers ; pendant la saison, {elle|il} dormait dans la cuisine."),
    p("marque", "{Elle|Il} a la peau qui ne craint plus le soleil et les pieds qui ne craignent plus le corail."),
    p("marque", "{Elle|Il} trouve qu'il fait froid dès qu'on dépasse Saint-Gilles-les-Hauts."),
    p("ile", "{Elle|Il} se souvient du jour où l'on a interdit la baignade, et de la plage vide ensuite."),
    p("ile", "Les soirs de pique-nique sous les filaos, trois familles partageaient une seule marmite.")
  ]),
  groupe("enfance", ["enfant-de-cilaos"], [
    p("lieu", "{Elle|Il} a grandi à Cilaos, où sa mère brodait des nappes pour les touristes."),
    p("lieu", "{Elle|Il} a grandi à Îlet à Cordes, au bout d'une route qui tient au rempart par habitude."),
    p("lieu", "{Elle|Il} vient de Palmiste Rouge, un écart de Cilaos où le car ne monte que si la route est sèche."),
    p("lieu", "{Elle|Il} a grandi à Bras Sec, entre les carrés de lentilles et les vignes en treille."),
    p("marque", "{Elle|Il} sait qu'une route peut disparaître en une nuit."),
    p("marque", "{Elle|Il} compte encore les virages de la route, les nuits où le sommeil ne vient pas."),
    p("geste", "{Elle|Il} a trié les lentilles sur la table de la cuisine, soir après soir, caillou par caillou."),
    p("geste", "{Elle|Il} sait tirer les fils d'une toile pour un jour de Cilaos, même si ses doigts en ont perdu l'habitude."),
    p("famille", "Son grand-père faisait un vin que personne n'osait dire mauvais."),
    p("ecole", "Quand la route cassait, l'école continuait : la maîtresse habitait à trois cases."),
    p("ile", "{Elle|Il} a vu le Piton des Neiges blanc de givre un matin d'août, et n'en a parlé à personne des Bas.")
  ]),
  groupe("enfance", ["enfance-chinoise-de-saint-denis"], [
    p("lieu", "{Elle|Il} a grandi derrière le comptoir de la boutique de ses parents, à Saint-Denis."),
    p("lieu", "{Elle|Il} a grandi à Saint-Denis, au-dessus de la boutique familiale, dans l'odeur du riz et du pétrole lampant."),
    p("lieu", "{Elle|Il} vient d'une boutique d'angle de Saint-Denis où tout le quartier avait son carnet de crédit."),
    p("famille", "Son grand-père racontait la traversée depuis Canton, chaque Nouvel An."),
    p("famille", "À la maison on parlait hakka, à la boutique créole, et à l'école français."),
    p("ecole", "Le samedi, c'était l'école chinoise ; {elle|il} y a surtout appris à tenir un pinceau sans soupirer."),
    p("geste", "{Elle|Il} savait rendre la monnaie avant de savoir lire."),
    p("geste", "{Elle|Il} tient un carnet de crédit de mémoire : qui doit quoi, et qui il ne faut pas presser."),
    p("marque", "On disait que la boutique ne faisait crédit qu'aux siens ; {elle|il} l'a vue nourrir la rue tout un mois de cyclone."),
    p("ile", "Pour la fête de Guan Di, {elle|il} portait les offrandes au temple, et le dragon passait devant la boutique."),
    p("ile", "{Elle|Il} n'a jamais vu Canton, et connaît par cœur une rue où {elle|il} n'a jamais marché.")
  ]),
  groupe("enfance", ["enfance-zarab-de-saint-pierre"], [
    p("lieu", "{Elle|Il} a grandi à Saint-Pierre, au-dessus du magasin de tissus de la famille."),
    p("lieu", "{Elle|Il} a grandi dans le centre de Saint-Pierre, entre la mosquée et la rue des commerces."),
    p("lieu", "{Elle|Il} vient de Saint-Pierre, d'une maison où le magasin commençait au rez-de-chaussée et finissait à table."),
    p("geste", "{Elle|Il} a appris à compter en rendant la monnaie au magasin de son père."),
    p("geste", "{Elle|Il} sait mesurer un tissu au bras et dire son prix sans toucher l'étiquette."),
    p("famille", "Dans sa famille, une parole donnée vaut un contrat signé."),
    p("famille", "Sa grand-mère parlait encore gujarati, et faisait des samoussas pour la rupture du jeûne de toute la rue."),
    p("ecole", "Après l'école, c'était la médersa ; après la médersa, la caisse du magasin."),
    p("marque", "On dit sa famille dure en affaires ; {elle|il} sait surtout ce que coûte un crédit qu'on ne réclame pas."),
    p("marque", "{Elle|Il} ne marchande jamais un prix juste, et ne paie jamais un prix qui ne l'est pas."),
    p("ile", "Le soir de l'Aïd, les voisins de toutes les religions passaient goûter, et repartaient avec une assiette.")
  ]),
  groupe("enfance", ["enfant-de-militaire"], [
    p("lieu", "{Elle|Il} a changé huit fois d'école avant le collège, au gré des affectations de son père.", { marques: ["nee-ailleurs"] }),
    p("lieu", "{Elle|Il} a grandi de caserne en caserne, et n'a défait ses cartons dans l'île qu'à l'adolescence.", { marques: ["nee-ailleurs"] }),
    p("famille", "Son père l'emmenait au stand de tir le dimanche."),
    p("famille", "À la maison, les lits se faisaient au carré et les repas se prenaient à l'heure."),
    p("marque", "{Elle|Il} se fait des amis vite et les quitte sans bruit : l'habitude."),
    p("marque", "{Elle|Il} range toujours ses affaires comme si l'on partait demain."),
    p("geste", "{Elle|Il} sait lire une carte, plier un sac et attendre un ordre sans le demander deux fois."),
    p("ecole", "À chaque rentrée, {elle|il} arrivait sans connaître personne, et a appris à choisir sa place au fond.")
  ]),
  groupe("enfance", ["enfance-en-foyer"], [
    p("lieu", "{Elle|Il} a connu trois familles d'accueil avant ses quatorze ans."),
    p("lieu", "{Elle|Il} a grandi dans un foyer de Saint-Denis, puis dans un autre à Saint-Louis, sans jamais tout déballer."),
    p("lieu", "{Elle|Il} a grandi dans une famille d'accueil de La Rivière, qui avait déjà six enfants et de la place quand même."),
    p("marque", "{Elle|Il} garde toujours un sac prêt, au cas où."),
    p("marque", "{Elle|Il} retient les prénoms du premier coup : on ne sait jamais combien de temps on reste."),
    p("marque", "{Elle|Il} ne demande rien deux fois, et remercie pour tout."),
    p("famille", "Une éducatrice lui écrivait chaque année pour son anniversaire ; {elle|il} a gardé toutes les cartes."),
    p("famille", "{Elle|Il} appelle « tatie » une femme qui n'est pas de son sang, et ne laisse personne en sourire."),
    p("ecole", "À l'école, {elle|il} disait que ses parents travaillaient loin ; personne n'a jamais vérifié."),
    p("geste", "{Elle|Il} sait faire à manger pour douze avec ce qu'il y a dans un placard de collectivité."),
    p("ile", "{Elle|Il} connaît l'île par ses déménagements : un bout de l'Est, un bout du Sud, jamais longtemps.")
  ]),
  groupe("enfance", ["enfance-protegee"], [
    p("lieu", "{Elle|Il} a grandi dans une villa avec piscine et n'avait jamais porté un sac de ciment."),
    p("lieu", "{Elle|Il} a grandi à La Montagne, au-dessus de Saint-Denis, dans une maison d'où l'on voyait les autres de haut."),
    p("lieu", "{Elle|Il} a grandi à Saint-Gilles-les-Bains, dans une résidence fermée, entre le club de voile et le cours de piano."),
    p("famille", "Ses parents sont partis par l'un des derniers avions ; {elle|il} n'a pas voulu les suivre."),
    p("famille", "Une nénène l'a élevé{e|} plus que ses parents, et lui a appris le créole qu'on ne parlait pas au salon."),
    p("ecole", "{Elle|Il} allait à l'école privée en voiture, tous les jours, pour moins d'un kilomètre."),
    p("marque", "{Elle|Il} apprend vite, maintenant, et n'aime pas qu'on lui rappelle d'où {elle|il} vient."),
    p("marque", "{Elle|Il} dit « s'il vous plaît » à tout le monde, même s'il n'y a plus personne pour l'exiger."),
    p("geste", "{Elle|Il} sait monter à cheval, barrer un dériveur et lire une étiquette de vin : rien de tout cela ne sert."),
    p("ile", "{Elle|Il} n'avait jamais pris le car jaune avant la fin du monde."),
    p("ile", "Le nom de sa famille est sur une usine, une rue et une vieille rancune.")
  ]),
  groupe("enfance", ["enfant-de-la-plaine-des-cafres"], [
    p("lieu", "{Elle|Il} a grandi dans une ferme de La Plaine des Cafres, à mille six cents mètres."),
    p("lieu", "{Elle|Il} a grandi à Bourg Murat, là où la route du volcan quitte les dernières maisons."),
    p("lieu", "{Elle|Il} vient du Vingt-Deuxième, sur la Plaine, où le brouillard arrive à quatre heures comme un voisin."),
    p("geste", "{Elle|Il} montait à cheval avant de savoir faire du vélo."),
    p("geste", "{Elle|Il} trayait les vaches avant l'école, et se réchauffait les mains contre leur flanc."),
    p("famille", "Sa grand-mère mettait une bouillotte dans chaque lit et du rhum arrangé dans chaque grog."),
    p("ecole", "L'hiver, {elle|il} cassait la glace dans l'abreuvoir avant de prendre le car."),
    p("marque", "{Elle|Il} n'aime pas la chaleur des Bas, et trouve que la mer manque d'herbe."),
    p("marque", "{Elle|Il} sent venir le brouillard une heure avant tout le monde."),
    p("ile", "À la foire agricole de la Plaine, {elle|il} menait le veau de la famille au concours, peigné comme pour un mariage."),
    p("ile", "{Elle|Il} a vu passer les voitures vers le volcan à chaque éruption, sans jamais monter voir.")
  ]),
  groupe("enfance", ["enfance-yab-des-hauts-de-l-ouest"], [
    p("lieu", "{Elle|Il} a grandi à Petite France, sur la route du Maïdo, dans l'odeur du géranium."),
    p("lieu", "{Elle|Il} a grandi au Guillaume, à mi-pente, là où l'on voit la mer sans jamais y descendre."),
    p("lieu", "{Elle|Il} vient des hauts des Trois Bassins, d'une case en bardeaux montée par un arrière-grand-père."),
    p("famille", "Son grand-père distillait le géranium dans un alambic de cuivre noirci."),
    p("famille", "Chez {elle|lui}, on tuait le cochon en décembre, et toute la ravine repartait avec un morceau."),
    p("ecole", "Au lycée, on l'appelait « yab kouyon » ; {elle|il} a appris à répondre plus vite que les autres."),
    p("geste", "{Elle|Il} sait couper le bois de chauffe pour l'alambic, et dire à l'odeur quand l'essence est bonne."),
    p("geste", "{Elle|Il} sait monter un mur en pierre sèche qui tient encore après trois cyclones."),
    p("marque", "{Elle|Il} porte un nom que la moitié de l'île porte aussi, des Hauts jusqu'à la mer."),
    p("marque", "On dit les gens des Hauts têtus ; {elle|il} répond qu'il faut bien l'être pour cultiver une pente pareille."),
    p("ile", "Les matins d'hiver, {elle|il} voyait la mer de nuages remplir Mafate depuis le bord du rempart.")
  ]),
  groupe("enfance", ["enfance-tamoule-de-saint-andre"], [
    p("lieu", "{Elle|Il} a grandi à Saint-André, à deux pas du temple, dans une cour où poussaient le margosier et le safran."),
    p("lieu", "{Elle|Il} a grandi à Cambuston, dans une case bleue, entre le champ de canne et la chapelle malbare."),
    p("lieu", "{Elle|Il} vient de Saint-André, d'une rue où chaque famille avait son autel et son manguier."),
    p("famille", "Sa grand-mère soignait les fièvres du quartier avec des plantes du jardin."),
    p("famille", "Son père coupait la canne ; c'était aussi le meilleur conteur de la rue."),
    p("geste", "{Elle|Il} a porté le kavadi à seize ans, pour un vœu qu'{elle|il} n'a jamais dit."),
    p("geste", "{Elle|Il} sait tresser une guirlande de fleurs et faire un cari massalé pour cinquante."),
    p("ecole", "À l'école, on lui demandait si la marche sur le feu brûlait ; {elle|il} répondait « demande à ton cœur »."),
    p("marque", "Certains avaient peur du « service » ; {elle|il} a vu les mêmes venir demander une prière, la nuit."),
    p("marque", "{Elle|Il} garde un point de cendre au front les jours qui comptent.", { foi: ["hindouisme-tamoul", "hindoue"] }),
    p("ile", "Pour le Dipavali, toute la ville descendait dans la rue, et {elle|il} tenait une lampe dans le défilé.")
  ]),
  groupe("enfance", ["enfance-sur-un-bateau"], [
    p("lieu", "{Elle|Il} a fait le tour de l'océan Indien sur le voilier de ses parents.", { marques: ["nee-ailleurs"] }),
    p("lieu", "{Elle|Il} a grandi sur un voilier de onze mètres, d'escale en escale, avant que le bateau ne reste au Port.", { marques: ["nee-ailleurs"] }),
    p("marque", "{Elle|Il} dort mal sur un sol qui ne bouge pas."),
    p("marque", "{Elle|Il} range tout à sa place et l'attache : à bord, ce qui traîne tombe."),
    p("ecole", "L'école, c'était des cahiers par correspondance sur la table à cartes, entre deux quarts."),
    p("geste", "{Elle|Il} sait faire un nœud de chaise d'une main et le point à midi avec un sextant."),
    p("geste", "{Elle|Il} sait faire durer vingt litres d'eau douce une semaine."),
    p("famille", "{Elle|Il} a eu des amis dans dix ports, et aucun plus de trois semaines.")
  ]),
  groupe("enfance", ["enfant-du-sud-sauvage"], [
    p("lieu", "{Elle|Il} a grandi à Saint-Philippe, entre la vanille de son grand-père et les coulées."),
    p("lieu", "{Elle|Il} a grandi au Tremblet, le dernier écart avant les laves, sous les vacoas."),
    p("lieu", "{Elle|Il} vient de Langevin, où la rivière descend froide jusqu'à la mer."),
    p("lieu", "{Elle|Il} a grandi à Manapany-les-Bains, au bord d'un bassin creusé dans le basalte."),
    p("marque", "{Elle|Il} a vu la lave traverser la route trois fois avant ses vingt ans.", { age: [20, 120] }),
    p("marque", "{Elle|Il} ne tourne jamais le dos à la mer : ici, elle prend sans prévenir."),
    p("geste", "{Elle|Il} sait tresser le vacoa : un sac, un chapeau, une natte, dans cet ordre de difficulté."),
    p("geste", "{Elle|Il} pêchait à la gaulette sur les rochers noirs, pieds nus, sans jamais glisser."),
    p("famille", "Sa grand-mère disait que la Vierge au Parasol avait arrêté la coulée ; un oncle disait que c'était la pente."),
    p("ecole", "Le car scolaire faisait demi-tour quand la route fumait encore ; {elle|il} trouvait cela normal."),
    p("ile", "{Elle|Il} a marché sur une terre plus jeune qu'{elle|lui}, encore tiède sous la semelle.")
  ]),
// ---------------------------------------------------------------- Passés (le sujet « metier » ouvre leur part ; rien de l'enfance)
  groupe("passe", ["infirmiere-du-chu"], [
    p("metier", "{Elle|Il} a passé ses nuits aux urgences du CHU, là où l'on apprend à trier avant de consoler."),
    p("metier", "{Elle|Il} travaillait en pédiatrie au CHU, et savait piquer un enfant en lui parlant de tout autre chose."),
    p("habitude", "{Elle|Il} connaît par cœur le bruit des urgences un soir de cyclone."),
    p("habitude", "{Elle|Il} se lave encore les mains jusqu'aux coudes, même à l'eau de pluie."),
    p("marque", "{Elle|Il} a vu arriver les premiers malades du Gris, et sait ce que personne n'a voulu écrire au dossier."),
    p("lien", "D'anciens patients {la|le} reconnaissent encore, et cela lui a ouvert plus d'une porte."),
    p("savoir", "{Elle|Il} sait ce qu'il faut prendre dans une pharmacie quand on ne peut emporter qu'un sac.")
  ]),
  groupe("passe", ["electricien"], [
    p("metier", "{Elle|Il} a monté son entreprise d'électricité sans associé, avec une camionnette et un crédit jamais fini de payer."),
    p("metier", "{Elle|Il} posait des panneaux solaires sur les toits de l'Ouest, du Port à Saint-Leu."),
    p("habitude", "{Elle|Il} dit toujours qu'un toit sans panneau est un toit qui dort."),
    p("habitude", "{Elle|Il} coupe le courant avant de toucher quoi que ce soit, même quand il n'y a plus de courant."),
    p("marque", "{Elle|Il} a rétabli la lumière de tout un quartier après un cyclone, sans attendre qu'on le lui demande."),
    p("savoir", "{Elle|Il} sait ce qu'une batterie peut encore donner, rien qu'à son poids et à son odeur."),
    p("lien", "La moitié de ses clients payaient en retard et l'autre en fruits ; {elle|il} n'a jamais relancé personne.")
  ]),
  groupe("passe", ["pecheur-de-saint-gilles"], [
    p("metier", "{Elle|Il} sortait du port de Saint-Gilles avant le jour, sur une barque de six mètres."),
    p("metier", "{Elle|Il} pêchait la dorade et le thon au large de Saint-Gilles, à la traîne, sans équipage."),
    p("habitude", "Depuis qu'{elle|il} pêche, {elle|il} ne dort pas plus de trois nuits loin de la mer."),
    p("habitude", "{Elle|Il} regarde le ciel de l'ouest à cinq heures, tous les jours, bateau ou pas."),
    p("savoir", "{Elle|Il} sait lire la houle, la couleur de l'eau et le vol des oiseaux au-dessus d'un banc."),
    p("marque", "{Elle|Il} a ramené plus d'un plaisancier en panne, sans jamais demander son nom."),
    p("lien", "Sur le quai, on lui gardait une place à l'ombre ; son poisson était vendu avant que la barque soit amarrée.")
  ]),
  groupe("passe", ["planteur-de-canne"], [
    p("metier", "{Elle|Il} cultivait douze hectares de canne, en pente, là où les machines ne montent pas."),
    p("metier", "{Elle|Il} a repris des terres à canne quand plus personne n'en voulait."),
    p("habitude", "Chaque fin de campagne, {elle|il} invitait tout le quartier au cari."),
    p("habitude", "{Elle|Il} se lève encore à quatre heures pendant les mois de coupe, sans raison."),
    p("savoir", "{Elle|Il} sait affûter un sabre à canne sur une pierre de rivière."),
    p("marque", "{Elle|Il} a compté ses tonnes, ses dettes et les années de l'usine : les trois chiffres baissaient ensemble."),
    p("lien", "{Elle|Il} employait les mêmes coupeurs d'une année sur l'autre, et mangeait avec eux au bord du champ.")
  ]),
  groupe("passe", ["gendarme"], [
    p("metier", "{Elle|Il} était gendarme à la brigade de Saint-Pierre, plus souvent sur la route que derrière un bureau."),
    p("metier", "{Elle|Il} servait au peloton de montagne, celui qu'on appelle quand un sentier ne rend pas quelqu'un."),
    p("marque", "{Elle|Il} a sorti des randonneurs de Mafate en pleine nuit plus d'une fois."),
    p("marque", "{Elle|Il} a rendu son arme de service le dernier jour, puis {elle|il} est retourné{e|} la chercher."),
    p("habitude", "{Elle|Il} regarde encore les mains des gens avant leur visage."),
    p("savoir", "{Elle|Il} sait calmer une dispute de cour avant qu'un sabre ne sorte."),
    p("lien", "Certains lui en veulent encore pour un procès-verbal ; d'autres lui doivent un fils ramené vivant.")
  ]),
  groupe("passe", ["etudiante"], [
    p("metier", "{Elle|Il} avait repris des études sur le tard, au fond de l'amphi parmi des jeunes de vingt ans, et s'en moquait.", { age: [30, 120] }),
    p("metier", "{Elle|Il} était en deuxième année à l'université, au Moufia, quand les cours se sont arrêtés pour de bon.", { age: [16, 29] }),
    p("metier", "{Elle|Il} préparait un concours, des fiches plein les murs, quand tout s'est arrêté."),
    p("lien", "{Elle|Il} partageait un appartement près du Moufia avec deux amies dont {elle|il} n'a plus de nouvelles."),
    p("marque", "Personne dans sa famille n'avait fait d'études avant {elle|lui}."),
    p("habitude", "{Elle|Il} prend encore des notes sur tout, d'une petite écriture serrée."),
    p("savoir", "{Elle|Il} travaillait le soir dans un snack pour payer le loyer, et tient une friteuse aussi bien qu'un cahier."),
    p("savoir", "{Elle|Il} sait apprendre vite dans un livre, ce qui sert plus qu'on ne le croyait.")
  ]),
  groupe("passe", ["guide-de-canyon"], [
    p("metier", "{Elle|Il} emmenait des clients dans les canyons de Cilaos, corde sur l'épaule, de bassin en bassin."),
    p("metier", "{Elle|Il} guidait dans Fleurs Jaunes et Bras Rouge, et savait à quelle cascade les rires s'arrêtent."),
    p("marque", "{Elle|Il} a perdu un client, une fois, dans une crue, et ne prend plus jamais la pluie à la légère."),
    p("savoir", "{Elle|Il} connaît chaque bassin de Cilaos et le nom de chaque cascade."),
    p("savoir", "{Elle|Il} sait faire descendre quelqu'un qui a peur, un mot après l'autre."),
    p("habitude", "{Elle|Il} vérifie deux fois chaque nœud, y compris ceux des autres."),
    p("lien", "Les secours l'appelaient quand il fallait quelqu'un qui connaisse le fond de la ravine.")
  ]),
  groupe("passe", ["mecanicien"], [
    p("metier", "Son garage était la deuxième maison de tout le quartier."),
    p("metier", "{Elle|Il} tenait un garage au Port : deux ponts, une fosse et un transistor toujours allumé."),
    p("savoir", "{Elle|Il} a appris le métier en démontant des mobylettes, et le reste en les remontant."),
    p("savoir", "{Elle|Il} reconnaît une panne au bruit, avant d'ouvrir le capot."),
    p("habitude", "{Elle|Il} ne jette jamais une pièce : tout finit par resservir."),
    p("marque", "{Elle|Il} a les mains noires jusque dans les lignes, et ne cherche plus à les ravoir."),
    p("lien", "{Elle|Il} faisait crédit jusqu'à la fin du mois, et parfois jusqu'à la fin de l'année.")
  ]),
  groupe("passe", ["cuisinier-de-camion-bar"], [
    p("metier", "{Elle|Il} tenait un camion-bar sur le front de mer de Saint-Leu : bouchons, sandwichs gratinés, cari du jour."),
    p("metier", "Son camion-bar ouvrait à onze heures et fermait quand la marmite était vide."),
    p("marque", "Son camion porte un prénom d'enfant, peint en lettres jaunes ; {elle|il} ne dit pas lequel des siens."),
    p("lien", "{Elle|Il} connaît les commandes de tous les habitués, et leurs secrets."),
    p("savoir", "{Elle|Il} sait nourrir quarante personnes avec un sac de riz, des grains et ce que la journée apporte."),
    p("savoir", "{Elle|Il} fait un rougail qui tire des larmes, et jure que le piment est doux cette année."),
    p("habitude", "{Elle|Il} goûte tout avant de servir, même quand il n'y a qu'un seul plat.")
  ]),
  groupe("passe", ["retraite-de-la-marine"], [
    p("metier", "{Elle|Il} a quitté la marine plus tôt que prévu, avec une pension mince et le pied marin.", { age: [16, 47] }),
    p("metier", "{Elle|Il} a vu tous les ports de l'océan Indien, et n'a posé son sac ici que pour ses vieux jours.", { age: [45, 120] }),
    p("metier", "{Elle|Il} a fait trente ans dans la marine, aux machines puis à la passerelle, et en a gardé le pas.", { age: [48, 120] }),
    p("habitude", "{Elle|Il} écoute la radio marine chaque soir, par habitude."),
    p("habitude", "{Elle|Il} se réveille pour le quart de quatre heures, sans bateau ni personne à relever."),
    p("savoir", "{Elle|Il} sait le morse, les pavillons et la manière de dire non à un officier."),
    p("marque", "{Elle|Il} a un tatouage par océan et une histoire par tatouage, jamais deux fois la même."),
    p("lien", "Au Port, les anciens du quai lui gardaient une chaise et le journal de la veille.")
  ]),
  groupe("passe", ["agricultrice-des-hauts"], [
    p("metier", "{Elle|Il} élevait des vaches laitières à La Plaine des Cafres : quarante têtes, et pas un jour de congé."),
    p("metier", "{Elle|Il} cultivait des légumes dans les Hauts, en terrasses, et descendait les vendre au marché forain."),
    p("marque", "{Elle|Il} a sauvé son troupeau du dernier cyclone, sans l'aide de personne."),
    p("habitude", "{Elle|Il} compte en litres de lait, en bottes de foin et en jours sans pluie."),
    p("habitude", "{Elle|Il} parle du temps qu'il fera comme d'autres parlent de politique : avec des preuves."),
    p("savoir", "{Elle|Il} sait aider une vache à vêler, de nuit, à la lampe frontale, sans vétérinaire."),
    p("lien", "Les voisins montaient lui emprunter le tracteur, et redescendaient avec des œufs en plus.")
  ]),
  groupe("passe", ["ambulancier"], [
    p("metier", "{Elle|Il} a conduit des milliers de malades sur les routes de l'Est, sous la pluie, de nuit."),
    p("metier", "{Elle|Il} conduisait l'ambulance entre Saint-Benoît et le CHU, gyrophare ou pas selon l'état du passager."),
    p("savoir", "{Elle|Il} connaît chaque radier qui déborde et chaque raccourci."),
    p("savoir", "{Elle|Il} sait porter un blessé dans un escalier trop étroit sans lui faire plus de mal."),
    p("habitude", "{Elle|Il} parle aux gens pendant qu'{elle|il} conduit, pour qu'ils restent là."),
    p("marque", "{Elle|Il} a vu naître deux enfants sur la banquette arrière, et porte leurs prénoms sur un bracelet."),
    p("lien", "Dans les écarts, on reconnaissait son moteur, et la cour s'ouvrait avant le coup de klaxon.")
  ]),
  groupe("passe", ["prof-de-svt"], [
    p("metier", "{Elle|Il} enseignait les sciences de la vie et de la Terre dans un collège de Saint-Paul."),
    p("metier", "{Elle|Il} enseignait les sciences, emmenait chaque année ses élèves au volcan et ne s'en lassait pas."),
    p("marque", "{Elle|Il} a expliqué le Gris à ses élèves avec un tableau et une craie, le dernier jour de classe."),
    p("savoir", "{Elle|Il} sait reconnaître une plante endémique, une roche et un mensonge d'élève."),
    p("savoir", "{Elle|Il} sait expliquer une chose compliquée trois fois, de trois façons, sans s'énerver."),
    p("habitude", "{Elle|Il} ramasse encore des cailloux et les range par âge."),
    p("lien", "D'anciens élèves lui disent encore « vous », même ceux qui ont de la barbe.")
  ]),
  groupe("passe", ["vendeur-de-bazar"], [
    p("metier", "{Elle|Il} tenait un bazar à Saint-Pierre où l'on trouvait de tout, à condition de demander."),
    p("metier", "{Elle|Il} vendait des marmites, des savates, des piles et des cierges, dans cet ordre sur l'étagère."),
    p("savoir", "{Elle|Il} a toujours su ce que voulait un client avant qu'il ouvre la bouche."),
    p("savoir", "{Elle|Il} connaît le prix de chaque chose, et ce qu'elle vaut maintenant, ce qui n'est plus pareil."),
    p("habitude", "{Elle|Il} range tout ce qu'{elle|il} trouve par usage, et sait où est chaque chose dans le noir."),
    p("marque", "{Elle|Il} a donné son stock le premier mois, vendu le reste le deuxième, et ne regrette que l'ordre."),
    p("lien", "Tout le quartier passait au bazar, pour acheter ou seulement pour dire comment allait la famille.")
  ]),
  groupe("passe", ["chauffeur-de-car-jaune"], [
    p("metier", "{Elle|Il} a fait la route de Cilaos plus de dix mille fois.", { age: [35, 120] }),
    p("metier", "{Elle|Il} conduisait le car jaune de Saint-Louis à Cilaos : quatre cents virages, et des tunnels où l'on passe au centimètre."),
    p("lien", "Les enfants du cirque l'appelaient par son prénom et lui montaient des mangues."),
    p("savoir", "{Elle|Il} sait reculer un car dans un virage, au bord du vide, pour laisser passer un camion."),
    p("savoir", "{Elle|Il} sait d'avance où la route cassera à la prochaine grosse pluie."),
    p("habitude", "{Elle|Il} klaxonne encore avant chaque virage sans visibilité, même à pied."),
    p("marque", "{Elle|Il} a attendu des passagers en retard plus souvent que l'horaire ne le permettait.")
  ]),
  groupe("passe", ["apiculteur"], [
    p("metier", "{Elle|Il} a quitté un bureau de Saint-Denis pour des ruches et ne l'a jamais regretté."),
    p("metier", "{Elle|Il} tenait soixante ruches à La Plaine des Palmistes et les déplaçait au gré des floraisons."),
    p("habitude", "{Elle|Il} parle à ses abeilles, et prétend qu'elles lui répondent."),
    p("habitude", "{Elle|Il} bouge lentement près de tout ce qui pique, mord ou s'énerve."),
    p("savoir", "{Elle|Il} sait quand fleurissent le letchi, le baie rose et le tan rouge, à la semaine près."),
    p("marque", "{Elle|Il} ne compte plus les piqûres, et soigne les rhumatismes des voisins avec."),
    p("lien", "Son miel partait au marché avant dix heures ; les habitués réservaient d'une année sur l'autre.")
  ]),
  groupe("passe", ["ilette-de-mafate"], [
    p("metier", "{Elle|Il} tenait un gîte à La Nouvelle : douze lits, un cari au feu de bois et pas de réseau."),
    p("metier", "{Elle|Il} vivait à Marla, de son jardin, de ses bêtes et du passage des randonneurs."),
    p("habitude", "{Elle|Il} ne descend en ville que pour les papiers, et remonte le soir même."),
    p("savoir", "{Elle|Il} connaît chaque famille du cirque et chaque source."),
    p("savoir", "{Elle|Il} sait ce que pèse un sac de ciment au bout de trois heures de sentier."),
    p("marque", "{Elle|Il} juge les gens à la façon dont ils arrivent en haut de la côte."),
    p("lien", "L'hélicoptère déposait les courses le jeudi ; {elle|il} gardait celles des voisins sans qu'on le lui demande.")
  ]),
// ---------------------------------------------------------------- Traits
  groupe("trait", ["doigts-de-terre"], [
    p("trait", "Tout ce qu'{elle|il} met en terre prend, jusqu'au noyau de mangue jeté par la fenêtre.")
  ]),
  groupe("trait", ["sang-de-basalte"], [
    p("trait", "Quand tout le monde crie, {elle|il} baisse la voix, et c'est {elle|lui} qu'on écoute.")
  ]),
  groupe("trait", ["main-qui-ne-frappe-pas"], [
    p("trait", "{Elle|Il} n'a jamais levé la main sur personne et ne compte pas commencer.")
  ]),
  groupe("trait", ["peur-du-noir-sous-terre"], [
    p("trait", "{Elle|Il} a passé une heure sans lumière dans un tunnel de lave, un jour, et n'y a jamais remis les pieds.")
  ]),
  groupe("trait", ["rat-de-galerie"], [
    p("trait", "{Elle|Il} explorait les tunnels de lave avec une lampe et une pelote de ficelle, pour le plaisir.")
  ]),
  groupe("trait", ["leve-avant-le-coq"], [
    p("trait", "{Elle|Il} a toujours vu le jour se lever, et plaint ceux qui le ratent.")
  ]),
  groupe("trait", ["oiseau-de-nuit"], [
    p("trait", "{Elle|Il} n'a jamais rien fait de bon avant dix heures du matin, ni rien de mauvais après minuit.")
  ]),
  groupe("trait", ["ventre-sans-fond"], [
    p("trait", "{Elle|Il} finit les assiettes des autres, avec un mot d'excuse et aucun remords.")
  ]),
  groupe("trait", ["oiseau-de-rien"], [
    p("trait", "{Elle|Il} oublie de manger quand il y a du travail, et s'étonne qu'on s'en inquiète.")
  ]),
  groupe("trait", ["nuits-blanches"], [
    p("trait", "{Elle|Il} dort trois heures par nuit depuis des années, et connaît tous les bruits de quatre heures.")
  ]),
  groupe("trait", ["soleil-dedans"], [
    p("trait", "{Elle|Il} trouve encore le moyen de rire d'une mangue trop mûre tombée au bon moment.")
  ]),
  groupe("trait", ["nuage-noir"], [
    p("trait", "{Elle|Il} avait prévu le pire bien avant tout le monde, et n'en tire aucune fierté.")
  ]),
  groupe("trait", ["cuir-de-cabri"], [
    p("trait", "{Elle|Il} s'est cassé le bras deux fois sans s'en plaindre, et une fois sans s'en apercevoir.")
  ]),
  groupe("trait", ["os-de-verre"], [
    p("trait", "{Elle|Il} connaît le plâtre mieux que personne, et les salles d'attente par cœur.")
  ]),
  groupe("trait", ["souffle-court"], [
    p("trait", "{Elle|Il} garde un inhalateur vide dans sa poche, pour le geste.")
  ]),
  groupe("trait", ["ame-de-pelerin"], [
    p("trait", "{Elle|Il} allume une bougie en passant devant un oratoire, quel qu'en soit le saint.")
  ]),
  groupe("trait", ["loup-solitaire"], [
    p("trait", "{Elle|Il} a toujours choisi la case du bout du chemin, par goût.")
  ]),
  groupe("trait", ["coeur-de-kour"], [
    p("trait", "Chez {elle|lui}, la marmite était toujours trop grande, exprès.")
  ]),
  groupe("trait", ["tete-de-bois"], [
    p("trait", "On ne {la|le} fait pas changer d'avis : on attend que l'idée vienne d'{elle|lui}.")
  ]),
  groupe("trait", ["main-ouverte"], [
    p("trait", "{Elle|Il} a prêté plus qu'{elle|il} n'a jamais possédé, et ne tient aucun compte.")
  ]),
  groupe("trait", ["doigts-crochus"], [
    p("trait", "Des choses finissent dans ses poches ; {elle|il} s'en étonne avant tout le monde.")
  ]),
  groupe("trait", ["ancien-fumeur"], [
    p("trait", "{Elle|Il} avait arrêté de fumer depuis sept ans, et compte de nouveau les jours.", { age: [26, 120] })
  ]),
  groupe("trait", ["oeil-froid"], [
    p("trait", "{Elle|Il} tirait au ball-trap le dimanche, sans jamais hausser le ton ni rater deux fois de suite.")
  ]),
  groupe("trait", ["mains-qui-tremblent"], [
    p("trait", "{Elle|Il} casse un verre par semaine, et demande pardon chaque fois comme si c'était le premier.")
  ]),
  groupe("trait", ["touche-a-tout"], [
    p("trait", "{Elle|Il} n'a jamais appelé un réparateur de sa vie.")
  ]),
  groupe("trait", ["bras-tendu"], [
    p("trait", "{Elle|Il} s'est toujours battu{e|} pour les autres, jamais pour {elle|lui}.")
  ]),
  groupe("trait", ["brute-epaisse"], [
    p("trait", "{Elle|Il} a réglé plus d'une discussion avec les épaules, et l'a regretté une fois sur deux.")
  ]),
  groupe("trait", ["coeur-d-artichaut"], [
    p("trait", "{Elle|Il} pleure aux mariages, aux enterrements et aux départs de car.")
  ]),
  groupe("trait", ["creole-de-coeur"], [
    p("trait", "{Elle|Il} dit bonjour dans cinq langues, et sait dans laquelle chacun préfère être remercié.")
  ]),
  groupe("trait", ["jambes-de-cabri"], [
    p("trait", "{Elle|Il} a couru le sentier du Taïbit aller et retour, un dimanche, pour le plaisir.")
  ]),
  groupe("trait", ["vertige"], [
    p("trait", "{Elle|Il} n'a jamais pu regarder en bas depuis le Maïdo : {elle|il} regarde ses chaussures.")
  ]),
  groupe("trait", ["peur-de-la-mer"], [
    p("trait", "{Elle|Il} n'entre dans l'eau que jusqu'aux genoux, et seulement dans le lagon.")
  ]),
// ---------------------------------------------------------------- Religions (de la couleur, aucun effet ; « pratique » : seulement pour un pratiquant)
  groupe("religion", ["catholique"], [
    p("foi", "{Elle|Il} allait à la messe de six heures, celle des gens qui travaillent."),
    p("foi", "{Elle|Il} garde une médaille de saint Expédit, pour les affaires urgentes.")
  ]),
  groupe("religion", ["hindouisme-tamoul", "hindoue"], [
    p("foi", "{Elle|Il} jeûnait avant la marche sur le feu, même les années où {elle|il} ne marchait pas."),
    p("foi", "{Elle|Il} dépose une fleur là où d'autres font le signe de croix.", { pratique: true })
  ]),
  groupe("religion", ["plusieurs", "hindoue-catholique"], [
    p("foi", "{Elle|Il} va au temple le vendredi et à la messe le dimanche, et ne voit pas où est la question.", { pratique: true }),
    p("foi", "Chez {elle|lui}, la Vierge et Mariamen partagent la même étagère et les mêmes fleurs.")
  ], { avec: [["catholique"], ["hindouisme-tamoul", "hindoue"]] }),
  groupe("religion", ["islam", "musulmane"], [
    p("foi", "{Elle|Il} fait encore ses cinq prières, à l'heure du soleil puisqu'il n'y a plus d'appel.", { pratique: true }),
    p("foi", "Pendant le ramadan, {elle|il} portait une assiette aux voisins avant de rompre le jeûne.")
  ]),
  groupe("religion", ["evangelique", "protestante"], [
    p("foi", "{Elle|Il} chantait à l'assemblée du dimanche, plus fort que juste."),
    p("foi", "{Elle|Il} lit quelques versets chaque matin, dans une bible dont la couverture ne tient plus.", { pratique: true })
  ]),
  groupe("religion", ["culte-chinois", "bouddhiste"], [
    p("foi", "{Elle|Il} brûle de l'encens le premier et le quinze du mois lunaire, quand il en reste.", { pratique: true }),
    p("foi", "{Elle|Il} s'assoit un moment en silence chaque matin, avant que quiconque ait besoin de quoi que ce soit.", { pratique: true })
  ]),
  groupe("religion", ["aucune"], [
    p("foi", "{Elle|Il} ne croit à rien qui ne se répare ou ne se partage."),
    p("foi", "{Elle|Il} n'a jamais prié, et tient la porte à ceux qui vont le faire.")
  ]),
  groupe("religion", ["ancetres-malgaches", "servis-kabare"], [
    p("foi", "{Elle|Il} pose un petit verre de rhum pour les anciens avant de boire le sien, sans en faire une histoire.", { pratique: true }),
    p("foi", "Une fois l'an, {elle|il} dit à voix haute le nom de ses morts, pour qu'aucun ne se perde en route.")
  ]),
// ---------------------------------------------------------------- Regards sur la catastrophe
  groupe("regard", ["epreuve"], [
    p("regard", "{Elle|Il} pense que tout ceci est une épreuve, et qu'une épreuve se traverse."),
    p("regard", "{Elle|Il} compte les jours comme les marches d'une côte : il y en a un nombre, donc une fin.")
  ]),
  groupe("regard", ["refaire", "refaire-le-monde"], [
    p("regard", "{Elle|Il} dit que le monde d'avant n'était pas si bien, et qu'on tient une chance de faire mieux."),
    p("regard", "{Elle|Il} dessine des plans de village sur des bouts de carton, avec une école au milieu.")
  ]),
  groupe("regard", ["vivre"], [
    p("regard", "{Elle|Il} ne cherche pas de sens à tout cela : {elle|il} veut voir demain, et après-demain."),
    p("regard", "{Elle|Il} dit qu'un cari chaud et un toit sec, c'est déjà une philosophie.")
  ]),
// ---------------------------------------------------------------- Générations (seulement l'âge ; « nee-ailleurs » : avoir toujours vécu dans l'île)
  groupe("generation", [], [
    p("generation", "{Elle|Il} a toujours eu un téléphone dans la main ; ses doigts cherchent encore l'écran.", { age: [16, 24] }),
    p("generation", "{Elle|Il} n'avait pas encore voté quand il n'y a plus eu d'élections.", { age: [16, 19] }),
    p("generation", "{Elle|Il} est de ceux qui n'ont presque rien connu d'autre, et qui s'y font plus vite que les grands.", { age: [16, 22] }),
    p("generation", "{Elle|Il} est de la génération des embouteillages de la route du Littoral, matin et soir.", { age: [25, 55] }),
    p("generation", "{Elle|Il} remboursait un crédit sur vingt-cinq ans ; il en restait dix-neuf.", { age: [28, 45] }),
    p("generation", "{Elle|Il} se souvient de l'année du chikungunya, des genoux de toute l'île et des serpentins qui brûlaient.", { exclut: ["nee-ailleurs"], age: [28, 120] }),
    p("generation", "{Elle|Il} a connu l'île avant les quatre-voies, quand en faire le tour prenait la journée.", { exclut: ["nee-ailleurs"], age: [45, 120] }),
    p("generation", "{Elle|Il} se souvient du temps où la boutique du coin vendait le pain à la moitié et le rhum au verre.", { exclut: ["nee-ailleurs"], age: [45, 120] }),
    p("generation", "{Elle|Il} a connu la case sans électricité, la lampe à pétrole et l'eau à la fontaine du chemin.", { exclut: ["nee-ailleurs"], age: [62, 120] }),
    p("generation", "{Elle|Il} dit « lontan » pour parler de sa jeunesse, et s'aperçoit que lontan revient.", { age: [60, 120] }),
    p("generation", "{Elle|Il} a vu passer plus de cyclones qu'{elle|il} n'a de doigts, et se souvient du nom de chacun.", { exclut: ["nee-ailleurs"], age: [55, 120] }),
    p("generation", "{Elle|Il} est de la génération qui partait étudier « là-bas », et se demandait s'il fallait rentrer.", { exclut: ["nee-ailleurs"], age: [25, 50] }),
    p("generation", "{Elle|Il} se souvient des coupures d'eau de la saison sèche, et des seaux alignés dans la cour.", { exclut: ["nee-ailleurs"], age: [35, 65] }),
    p("generation", "{Elle|Il} a connu plus de contrats courts que d'années de travail, et savait déjà se débrouiller.", { age: [22, 40] }),
    p("generation", "{Elle|Il} a vu les champs de canne devenir des lotissements, un rond-point après l'autre.", { exclut: ["nee-ailleurs"], age: [40, 70] }),
    p("generation", "{Elle|Il} a passé le permis trois fois, et n'a jamais eu de voiture à {elle|lui}.", { age: [20, 35] }),
    p("generation", "{Elle|Il} a encore l'habitude d'écrire les numéros dans un carnet, et le carnet sert de nouveau.", { age: [50, 120] }),
    p("generation", "{Elle|Il} a vu arriver la télévision dans le quartier : un seul poste, et toute la rue devant.", { age: [62, 120] })
  ])
];
