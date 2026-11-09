// « Fénoir — Le livre de l'île » : le chapitre d'univers que les joueurs lisent avant de commencer (compendium « guides »,
// lisible des joueurs). L'île avant, le dernier mois ordinaire, le jour zéro, les Livides tels qu'on croit les connaître,
// l'île qui change, les gens d'après, vivre à Fénoir, portraits, rumeurs, lexique, et une première nuit. Écrit comme la
// mémoire d'une Réunion aimée, à la manière d'un livre de règles ; les citations (« > ») sont des carnets de survivants.
// Rien ici ne dévoile ce que le MJ garde : l'origine du Gris reste inconnue, la chronologie n'est pas datée, la règle des
// Bas et des Hauts n'est qu'une rumeur parmi d'autres. Cohérent avec journaux.mjs, factions.mjs, survivants.mjs,
// bestiaire.mjs, regions.mjs et scripts/fetes.js. Textes originaux.
import { journal, idJournal, idPage, MODULE } from "./aides.mjs";
import { CLE_JOURNAL_REGIONS } from "./journaux.mjs";

// Liens vers ce que les joueurs peuvent lire : une page du journal des régions, un journal du pack « guides », une page du
// guide du joueur. Format Foundry v14 : Compendium.<module>.<pack>.<Type>.<id>[.JournalEntryPage.<id>].
const region = (cle, libelle) => `@UUID[Compendium.${MODULE}.guides.JournalEntry.${idJournal("guides", CLE_JOURNAL_REGIONS)}.JournalEntryPage.${idPage("guides", CLE_JOURNAL_REGIONS, cle)}]{${libelle}}`;
const guide = (cle, libelle) => `@UUID[Compendium.${MODULE}.guides.JournalEntry.${idJournal("guides", cle)}]{${libelle}}`;
const pageGuide = (cleJournal, clePage, libelle) => `@UUID[Compendium.${MODULE}.guides.JournalEntry.${idJournal("guides", cleJournal)}.JournalEntryPage.${idPage("guides", cleJournal, clePage)}]{${libelle}}`;

export const CLE_LIVRE = "livre-de-l-ile";

export const LIVRE_UNIVERS = journal({ cle: CLE_LIVRE, nom: "Fénoir — Le livre de l'île", pack: "guides", pages: [
  { cle: "avant-de-lire", titre: "Avant de lire", texte: `Ce livre n'a pas d'auteur. Il a été commencé sur un cahier d'écolier, à la lumière d'une lampe frontale, par des gens qui venaient de passer leur première nuit derrière une porte barricadée et qui avaient besoin d'écrire ce qu'ils savaient, pour ne pas devenir fous. D'autres l'ont recopié, complété, raturé. On y a collé des pages arrachées à des carnets, des mots entendus à la radio, des choses vraies et des choses qu'on croyait vraies. Il circule d'abri en abri, et chacun y ajoute ce qu'il a appris, en disant d'où ça vient.

Si vous le lisez **au jour zéro**, à l'heure où les lumières brillent encore, vous n'en comprendrez pas la moitié. Lisez quand même. Lisez d'abord ce qu'était l'île, parce que c'est ce que vous allez défendre. Lisez ce qu'on sait des Livides, parce que ça vous sauvera peut-être la vie, et ce qu'on n'en sait pas, parce que ça vous empêchera de vous croire en sécurité. Lisez les rumeurs en vous souvenant qu'elles sont des rumeurs. Et gardez la dernière page pour le soir.

**Fénoir**, en créole, c'est la nuit : *i fé noir*, il fait noir. Personne n'a décidé d'appeler ça comme ça. C'est venu tout seul, la première semaine, quand on a compris que le danger, ce n'était pas seulement les morts qui marchent, c'était le moment où l'on n'y voit plus, où le groupe électrogène se tait, où l'on écoute. Les gens disaient « depuis Fénoir » comme on disait avant « depuis le cyclone ».

> On m'a demandé pourquoi j'écrivais ça au lieu de dormir. J'ai dit : parce que demain, quelqu'un aura besoin de savoir qu'il faut laver la morsure tout de suite, pas après. Et parce que je veux qu'on se souvienne de l'odeur des letchis. Les deux.
> *Premier cahier, première page.*

Une dernière chose. Ce livre parle beaucoup de la mort, et pourtant il a été écrit par des vivants, sur une île qu'ils aimaient. N'y cherchez pas le goût du malheur. Cherchez-y ce qui a tenu.` },

  { cle: "l-ile-avant", titre: "L'île, avant", texte: `# Un caillou dans l'océan

La Réunion est une montagne sortie de la mer, à sept cents kilomètres à l'est de Madagascar. Soixante kilomètres de long, quarante-cinq de large, et au milieu, à plus de trois mille mètres, le Piton des Neiges, un vieux volcan éteint que trois effondrements ont creusé en trois **cirques** : ${region("cilaos", "Cilaos")}, ${region("salazie", "Salazie")}, ${region("mafate", "Mafate")}. Au sud-est, le ${region("fournaise", "Piton de la Fournaise")}, lui, est bien vivant : il coule tous les deux ou trois ans, et quand la coulée descend le Grand Brûlé jusqu'à la mer, toute l'île monte la voir, en famille, avec les glacières.

L'île se divise en deux, et cette division explique tout ce qui suit. Les **Bas**, c'est le littoral : la chaleur, les villes, les routes, la canne, les zones commerciales, les quatre cinquièmes des habitants. Les **Hauts**, c'est tout ce qui est au-dessus : les pentes, les plaines d'altitude, les cirques, la forêt de tamarins, la brume de l'après-midi, les cases en bois sous tôle, les vaches de la ${region("le-tampon", "Plaine des Cafres")}, les lentilles de Cilaos, les chouchous de Salazie. On y monte le dimanche pour le frais ; on y gèle en août. Il y a des gens des Hauts et des gens des Bas, et ils ne vivent pas tout à fait le même temps.

# Le vent, la pluie, la mer

L'Est est **au vent** : l'alizé y pousse les nuages contre la montagne, et il y pleut comme nulle part ailleurs, des rivières qui descendent en torrents, une canne haute et grasse. L'Ouest est **sous le vent** : sec, blond, ensoleillé, avec des savanes qui brûlent en octobre, et le seul vrai **lagon** de l'île, de Saint-Gilles à Saint-Leu, derrière sa barrière de corail : une eau immobile, tiède, où l'on apprend à nager à tous les enfants.

Il y a deux saisons. L'**hiver austral**, de mai à octobre : sec, doux en bas, froid en haut, les baleines qui passent au large en juillet. L'**été austral**, de novembre à avril : la chaleur moite, les orages de l'après-midi, les mangues puis les letchis, et la saison des **cyclones**. Chaque famille sait ce que veut dire alerte orange (on remplit les bouteilles, on cloue) et alerte rouge (on ne sort plus, on écoute la radio). Après, on compte les radiers submergés et les toits envolés, et on recommence.

# Les villes et la canne

${region("saint-denis", "Saint-Denis")} au nord, le chef-lieu, avec son front de mer, ses cases de la rue de Paris et ses barres du Chaudron ; ${region("saint-pierre", "Saint-Pierre")} au sud, la rivale, son marché, son port, ses soirées ; ${region("le-port", "Le Port")} à l'ouest, par où arrive tout ce que l'île ne fabrique pas, c'est-à-dire presque tout ; ${region("saint-paul", "Saint-Paul")}, ${region("saint-leu", "Saint-Leu")}, Saint-André, Saint-Benoît, Saint-Joseph : un chapelet de villes reliées par des routes qu'on bouche tous les matins. L'île est petite et l'on y passe sa vie en voiture.

Entre les villes, la **canne à sucre**. On la coupe de juillet à décembre, les camions montent aux sucreries du Gol et de Bois-Rouge, et l'odeur de mélasse flotte sur la plaine. Il reste de la vanille dans le Sud, du géranium dans les Hauts de l'Ouest, des letchis et des mangues dans tous les jardins, des brèdes partout où il y a de l'eau. L'île ne se nourrit pourtant pas elle-même : elle importe son riz, sa farine, son lait, son carburant.

# Les gens

Il n'y avait personne sur cette île il y a quatre siècles. Tout le monde est venu de quelque part, les uns libres, beaucoup enchaînés, puis engagés, puis simplement arrivés, et chacun a gardé son nom dans la kour : les **Cafres**, venus d'Afrique et de Madagascar, les plus nombreux ; les **Yabs**, petits blancs des Hauts, et les **gros blancs** des vieilles familles de planteurs ; les **Malbars**, Tamouls venus couper la canne ; les **Z'arabes** du Gujarat ; les **Chinois** venus de Canton ; les **Malgaches**, les **Comoriens**, les **Mahorais**, les **Zoreils** de métropole. Et surtout tous ceux qui sont un peu de tout cela : un peuple qui se marie entre lui, qui mange le cari de l'un et les samoussas de l'autre, qui va à la messe, au temple, à la mosquée, à la pagode, parfois aux quatre, et qui parle **créole** à la maison et français à l'école.

On se chambre, d'une kour à l'autre : le Zoreil « *i prend tout' bann bon travay* » (il prend tous les bons postes), le Chinois « *i res' ant' zot* » (reste entre les siens), le Malbar fait des « services », le Yab ne descend jamais de ses Hauts, et les derniers arrivés sont accusés de tout. C'est le *kozman* de l'île, moitié rire, moitié méfiance, et Fénoir l'a ravivé. Ce livre ne l'a jamais vu dire vrai sur personne.

La vie quotidienne, avant, c'était ça : la radio dès six heures dans la cuisine, les bouchons, le travail, le marché forain du samedi, le pique-nique du dimanche, les gramouns sur la varangue, les marmailles dans la kour, la boutique du coin qui fait crédit, le kabar du samedi soir, les enterrements où tout le quartier vient. Une vie bruyante, chaude, serrée, qui se plaignait de tout et ne serait partie pour rien au monde.

> Quand je ferme les yeux, ce n'est pas la ville que je vois. C'est la route de Cilaos, le matin, avec les nuages en bas et le soleil en haut, et mon père qui klaxonne avant chaque virage. On a tous un endroit comme ça. Gardez le vôtre. Il va servir.
> *Carnet de Sully, guide.*` },

  { cle: "dernier-mois", titre: "Le dernier mois ordinaire", texte: `Novembre avait été un mois comme les autres, et c'est ce qui rend son souvenir si difficile à supporter.

La **campagne sucrière** touchait à sa fin : les derniers camions de canne montaient aux usines, les champs coupés laissaient voir la terre rouge, et l'on parlait déjà, comme chaque année, du prix de la tonne. Dans les écoles, le premier trimestre s'achevait ; on préparait les **fêtes de fin d'année**, les spectacles, les chorales qui chantent Noël en short. Les familles tamoules avaient allumé les lampes de **Dipavali** au début du mois, et Saint-André avait défilé en couleurs sous une pluie fine. Les premiers orages de l'après-midi étaient arrivés, lourds, courts, avec cette odeur de terre mouillée qui annonce l'été.

Dans les jardins, les **mangues** pliaient les branches et les **letchis** commençaient à rougir. On surveillait l'arbre tous les jours : la fête des letchis, c'est mi-décembre, mais le premier bouquet, on le mange en cachette, au pied de l'arbre, le menton qui colle. Dans les magasins, les guirlandes étaient là depuis la Toussaint, et les enfants écrivaient leurs listes de cadeaux en regardant les **flamboyants** rougir : Noël, ici, c'est le soleil qui tape, le cari sous la varangue et les pétards jusqu'au jour de l'an.

# Le fait divers

Et puis il y a eu cette histoire de **bateau**. Une semaine, peut-être dix jours avant, un navire était arrivé au large du Port et n'avait pas accosté. On disait qu'il y avait des malades à bord, une « intoxication », une « fièvre ». Les autorités parlaient d'une mise en observation, par précaution. Les journaux en ont fait trois lignes. Les gens du Port, eux, racontaient qu'on avait débarqué des gens la nuit, en ambulance, et que les ambulances n'étaient pas revenues par la même route.

Au même moment, on signalait des cas d'une « fièvre grise » dans un hôpital de l'île : des patients qui déclinaient très vite, la peau cendrée, et qui mouraient en un jour ou deux. Le mot **gris** est né là, dans une salle de garde, avant d'être repris par tout le monde. Personne n'a dit ce qu'ils étaient devenus. On a parlé d'une intoxication alimentaire, puis d'un virus importé, puis plus rien, parce que la semaine suivante, il y avait autre chose à dire.

> Ma collègue de la réanimation m'a appelée un soir pour me dire qu'un mort avait bougé. Je lui ai dit de dormir. Je lui ai dit ça. On a tous dit ça, à quelqu'un, cette semaine-là.
> *Carnet de Nadia, infirmière.*

Ce qu'il faut comprendre, c'est que rien n'avait l'air d'une fin. Il y avait des signes, mais des signes, il y en a tous les jours ; on vit au milieu de signes. Le dernier mois ordinaire s'est terminé un vendredi de début décembre, sous un ciel magnifique, et personne ne l'a vu finir.` },

  { cle: "jour-zero", titre: "Le jour zéro", texte: `Ceux qui l'ont vécu ne sont pas d'accord sur l'heure. Pour les uns, ça a commencé la nuit, aux urgences de Bellepierre, à ${region("saint-denis", "Saint-Denis")}, quand un homme déclaré mort à trois heures du matin a mordu un brancardier ; on a mis ça sur le compte d'un réflexe. Pour d'autres, c'est l'après-midi, à ${region("saint-pierre", "Saint-Pierre")}, dans une salle d'attente ; ou dans une voiture arrêtée sur la RN1, dans une maison, dans un car jaune au milieu des virages de ${region("cilaos", "Cilaos")}. La vérité est que ça a commencé partout à peu près en même temps, dans les Bas, là où il y avait des hôpitaux, des morts et du monde.

# Ce qu'on a pu voir

Le matin, rien. Les bouchons habituels, le soleil, les sirènes un peu plus nombreuses autour des hôpitaux. À la radio, on parlait d'un « épisode de malaises » et d'urgences saturées. Vers midi, les premiers messages sur les téléphones : *ne venez pas à l'hôpital*, *ils ferment les portes*, *il y a eu des coups de feu à Saint-Pierre*. Les écoles ont annoncé qu'elles gardaient les enfants ; puis certains parents ne sont pas venus les chercher.

L'après-midi, la **bascule**. Dans les rues des villes, des gens qui couraient, d'autres qui marchaient d'une drôle de façon ; des voitures abandonnées en travers ; les premiers **Coureurs**, ces morts si frais qu'ils couraient encore, et qui se jetaient sur la première personne venue. Les urgences ont débordé sur les parkings. La route des Tamarins s'est figée, puis la RN2, puis tout. Des familles ont pris la direction des Hauts avec ce qu'elles avaient dans le coffre ; d'autres celle de l'aéroport, où les files allaient jusqu'au parking et où l'on parlait de rotations supplémentaires, de passagers malades débarqués de nuit, d'avions qui ne repartaient pas.

Le soir, le **préfet** a parlé. Il a demandé de rester chez soi, de ne pas s'approcher des personnes « en état d'agitation », de laisser les routes aux secours. Il a dit « malaise collectif ». Il n'a pas dit le mot que tout le monde avait déjà en bouche. Le téléphone a saturé à la tombée de la nuit : on composait, on composait, et rien. L'électricité, elle, tenait. L'eau coulait. Les télévisions montraient des images de la métropole où il se passait, en décalé, la même chose. C'est cette nuit-là que les gens ont compris que personne ne viendrait.

# Ce qui marchait encore

Au jour zéro, presque tout. C'est le piège, et c'est la chance. Les stations-service avaient de l'essence, les supermarchés des rayons pleins, les pharmacies leurs stocks, les quincailleries leurs tôles. Les routes étaient bouchées mais pas coupées. Ceux qui ont tenu, plus tard, sont souvent ceux qui ont fait, ce jour-là et le lendemain, trois choses simples : remplir toutes les bouteilles et toutes les baignoires, prendre ce qui se mange, se soigne et se répare, et choisir une **porte** qu'on peut fermer.

> On est partis à cinq dans la voiture de ma mère, avec le chien, deux bidons d'eau et la glacière. On ne savait pas où on allait. On est montés, parce que tout le monde montait. La route de la Montagne était un parking. Derrière nous, Saint-Denis avait toutes ses lumières allumées, comme un soir de fête.
> *Carnet de Lucie, étudiante.*

Dans les Hauts, dans les cirques, à Mafate, ce jour-là, il ne s'est rien passé. On a appris la nouvelle par la radio, on a fermé le portail, on a regardé les voitures monter. Le mal est arrivé plus tard, à pied, avec les réfugiés.` },

  { cle: "les-livides", titre: "Les Livides : ce qu'on croit savoir", texte: `On les a appelés **Livides** à cause de leur couleur : un gris de cendre, marbré, les yeux voilés de blanc. Un médecin a dû employer le mot le premier ; il est resté parce qu'il n'était ni une insulte ni un mot de cinéma. Ce que vous lisez ici, ce sont des observations de survivants, recoupées quand on a pu : **ce qu'on croit savoir**. Les premières semaines ont coûté cher à ceux qui croyaient savoir mieux.

# Ce dont on est à peu près sûrs

- **Ils sont morts.** Pas malades, pas fous : morts. Un Livide ne respire pas, ne saigne pas vraiment, ne sent pas la douleur, ne se fatigue pas. Il ne s'arrête que quand on détruit la tête, et quand on dit « hors d'état », c'est ça qu'on veut dire.
- **La morsure transmet le Gris.** Une morsure, ou une griffure profonde, et la fièvre monte en quelques heures. Il faut **laver tout de suite**, à grande eau, au savon, à l'alcool, cautériser si l'on peut, et parfois couper si c'est un doigt ou une main. Tout de suite : pas après, pas quand on sera à l'abri. Ceux qui ont attendu ont tous fini pareil. Une fois la fièvre installée, on ne connaît **aucun remède**. Le malade décline sur quelques jours, meurt, et se relève. Les gens qui vous aiment devront alors faire ce qu'il faut. Parlez-en avant.
- **Ils sont lents, sauf les tout frais.** Un Livide marche comme un homme ivre, sans jamais s'arrêter. Mais un mort de quelques heures, les premiers jours, **court** encore, maladroitement, et crie en courant : on les appelle les Coureurs. Après une semaine, ils ralentissent et deviennent comme les autres. On n'en a plus revu depuis la première quinzaine.
- **Ils vont vers le bruit, la lumière et l'odeur.** Un moteur, un coup de feu, un cri, une lampe allumée dans une fenêtre la nuit, une cuisine : ils viennent, et ils s'acharnent sur une porte pendant des heures. Ils se regroupent : là où il y en a trois, il y en aura trente.
- **Ils ne grimpent pas, ils ne nagent pas, ils n'ouvrent pas.** Une échelle retirée, une porte solide, un étage, un bateau au mouillage les arrêtent. Un portail mal fermé, non.

# Ce qu'on a observé sans le comprendre

- **La chaleur les abîme.** Dans les Bas, en plein été, un Livide pourrit vite : la peau se fend, les muscles lâchent, il tombe et ne se relève plus. On a vu des rues entières jonchées de corps effondrés, qu'on croyait d'abord des morts ordinaires.
- **Le froid les garde.** Dans les Hauts, on en a vu, des mois après, qui semblaient de bois : desséchés, raides, couverts de rosée le matin, immobiles dans le brouillard jusqu'à ce que le soleil les réveille. Ceux-là sont très durs à abattre. On les appelle les **Livides des Hauts**.
- **La mer les rend.** Les corps emportés par la houle reviennent sur les plages, gonflés, couverts d'algues, et marchent vers les lumières. Une morsure de noyé s'infecte toujours.
- **Les brûlés ne voient plus** et ne suivent que les bruits.
- **Les animaux ne se relèvent pas.** Mais les chiens sans maître se sont regroupés en meutes, et les cochons sont retournés marrons dans les ravines : ce sont d'autres dangers.

> Règle de la maison : on ne discute pas une morsure. On lave, on brûle, on coupe, et on pleure après. J'ai perdu mon mari à discuter.
> *Carnet de Thérèse, Saint-André.*

# Comment on fait

On se tait. On ne sort pas la nuit. On ne tire que si l'on n'a pas le choix, parce qu'un coup de feu s'entend à des kilomètres. On marche à deux au moins. On regarde les mains, les avant-bras, le cou de ceux qu'on accueille. Et l'on se souvient qu'ils ont été des gens, sans pour autant leur ouvrir.` },

  { cle: "ce-qu-on-apprendra", titre: "Ce qu'on apprendra peut-être", texte: `Cette page est laissée **ouverte**. Elle est faite pour être complétée par ceux qui tiendront assez longtemps pour savoir. Ce qui suit, ce sont les questions, et à côté, ce qu'on en dit.

**D'où vient le Gris ?** Personne ne le sait. On a dit : du bateau. On a dit : de l'eau des ravines, d'un moustique, d'un médicament, d'un laboratoire, du ciel, de la colère de quelque chose. On a dit que la métropole l'avait eu en même temps, que Maurice l'avait eu avant, que Madagascar ne l'avait pas. Si quelqu'un l'apprend un jour, qu'il l'écrive ici, avec la preuve.

**Est-ce que ça se transmet autrement que par la morsure ?** On ne croit pas. Des gens ont vécu des semaines avec des infectés sans l'attraper, ont touché des corps, respiré le même air. Mais on ne sait pas pourquoi les premiers malades de novembre l'ont eu, eux, sans morsure. Alors on lave les mains, on couvre les plaies, et on n'embrasse pas les mourants.

**Est-ce que tout le monde se relève ?** Ceux qui meurent du Gris, oui. Ceux qui meurent d'autre chose… On a vu des vieux morts dans leur lit, de leur mort, qui se sont relevés, et d'autres qui ne se sont pas relevés. Ne comptez sur rien : veillez vos morts, attachez-les, ou enterrez-les profond.

**Y a-t-il des gens que ça ne prend pas ?** C'est la rumeur la plus dangereuse de l'île, parce que c'est celle qu'on a le plus envie de croire. On parle d'un enfant mordu qui n'a rien eu. On parle d'une femme du Sud qui est tombée malade et s'est réveillée. Le Dispensaire du Sud voudrait bien les trouver. Jusqu'à preuve, une morsure est une morsure.

**Est-ce que ça finira ?** Si la chaleur les défait vraiment, les villes des Bas seront un jour vides de Livides : vides, mais pas sûres, parce que ce qu'il restera dans les rues, ce seront les vivants. Si le froid les garde vraiment, les Hauts resteront longtemps peuplés de leurs morts anciens, qui s'éveillent au soleil. C'est l'idée qui tourne dans toutes les têtes : **le meilleur endroit change avec le temps.** Ceux qui l'ont mal comprise sont morts au mauvais endroit.

**Est-ce qu'on peut les soigner ?** Non. Pas aujourd'hui. Mais à Saint-Pierre, à l'hôpital, il y a des gens qui n'ont pas renoncé à le chercher, et qui demandent, pour ça, des choses de plus en plus difficiles à donner.

> J'ai laissé une page blanche après celle-ci. Si tu la trouves remplie, c'est que quelqu'un a appris quelque chose. Si tu la trouves blanche, écris au moins la date, et ce que tu as vu.
> *Deuxième cahier.*` },

  { cle: "l-ile-qui-change", titre: "L'île qui change", texte: `Ce qui suit est le récit d'une survivante, recopié tel quel, parce qu'il dit mieux que des listes ce qui est arrivé à l'île. Les dates ont été enlevées : chaque région a eu son calendrier.

> Les premiers jours, on a cru que ça allait s'arranger, parce qu'il y avait encore des **ordres**. Couvre-feu, barrages, des gendarmes qui faisaient demi-tour aux voitures, des avions qui décollaient de Gillot pour ceux qui avaient des billets, puis des cargos au Port pour ceux qui avaient des papiers, puis plus d'avions, puis plus de cargos. On a vu les files monter vers les Hauts, les gens à pied avec les enfants sur les épaules, et les supermarchés vidés en une nuit par des gens qui, la veille, faisaient la queue à la caisse. C'est là que les **Sans-Lune** sont nés, à Saint-Denis, dans le noir, et que les militaires qui restaient se sont repliés sur le port avec leurs conteneurs. La radio officielle répétait la même chose en boucle. Un matin, elle a cessé de la répéter.
>
> Ensuite, les **réseaux** sont tombés. Pas tous le même jour, pas partout pareil : le carburant d'abord, parce que les stations ont été vidées ; puis le téléphone ; puis l'électricité, par quartiers, par villes, un soir on allume et rien ne vient ; et l'eau, en dernier, quand les pompes se sont arrêtées. L'Est a gardé du courant plus longtemps, grâce à ses centrales sur les rivières ; ${region("mafate", "Mafate")} ne l'a jamais perdu, parce qu'il n'en avait pas, seulement des panneaux. Ceux qui avaient une citerne ont compris ce qu'elle valait. Les autres ont appris à aller à la ravine, et la ravine donne la leptospirose à qui ne fait pas bouillir.
>
> Les villes sont devenues des pièges. Dans les rues basses, à chaque carrefour, des dizaines de silhouettes, et chaque bruit en attirait d'autres. Les **hordes** sont nées là, de ces rassemblements, et se sont mises à suivre les routes, lentes, en masse, attirées par n'importe quel moteur. On a vu l'une d'elles descendre la ${region("route-du-littoral", "route du Littoral")} comme une marée ; là-bas, les voitures abandonnées, les éboulis et la houle ont fini par faire une barrière que seuls les piétons franchissent par le vieux chemin pavé, là-haut.
>
> Tout le monde est monté dans les Hauts, et moi aussi. Là-haut, les premières semaines, c'était presque la paix : peu de monde, donc peu de morts ; de l'eau, du bois, des légumes dans les jardins, des gens qui se connaissaient. Et puis les réfugiés sont arrivés par tous les chemins, et certains étaient mordus, et certains ne l'ont pas dit. Les Hauts se sont remplis de nos morts. Et dans le froid, nos morts ne pourrissent pas.
>
> Un jour, il n'y a plus eu d'**autorité** du tout. Pas de coup d'éclat : juste personne au bout de la radio, plus de brassards sur les routes, sauf ceux du Port. Alors les gens se sont organisés, chacun autour de ce qu'il avait : les fermiers autour des fermes, les pêcheurs autour des bateaux, les soignants autour de l'hôpital, les croyants autour d'une église, les habitants des îlets autour de leurs cols, les mécaniciens autour des casses, les pillards autour de la peur. On a eu un cyclone, et la Fournaise a grondé une nuit sans couler. On a appris à vivre avec des **rumeurs** à la place des nouvelles.
>
> Et puis j'ai redescendu la route, un matin, pour chercher des médicaments, et j'ai vu les rues de la côte **presque vides**. Des corps effondrés dans les caniveaux, qui ne bougeaient plus, qui avaient fondu dans la chaleur. J'ai cru que c'était fini. Au premier carrefour, deux hommes au visage noirci m'ont demandé ce que je transportais. Ce n'est pas fini. C'est autre chose.
> *Carnet de Rosemay, Le Tampon.*

Les auteurs de ce livre ajoutent ceci : on ne sait pas si toutes les régions suivront le même chemin. Les ${region("hauts-de-l-ouest", "Hauts de l'Ouest")} et la ${region("plaine-des-palmistes", "Plaine des Palmistes")} ont paru sûrs longtemps, les villes ont été l'enfer tout de suite, le ${region("sud-sauvage", "Sud sauvage")} n'a jamais été ni l'un ni l'autre, et les routes qui semblaient évidentes (celle de ${region("cilaos", "Cilaos")}, celle de ${region("salazie", "Salazie")}, la route des Laves) sont celles qu'un éboulis, une crue ou une coulée coupent en une nuit. Ce que vous savez d'un endroit a une date. Vérifiez avant de partir ; vérifiez encore en arrivant.` },

  { cle: "les-gens-d-apres", titre: "Les gens d'après", texte: `Huit groupes sont sortis de la crise avec un nom, un territoire et des règles. Ce qui suit, c'est ce qu'on en dit **du dehors**, autour des feux ; ce qu'ils sont vraiment, vous le découvrirez en traitant avec eux. Aucun de ces groupes n'est fait de méchants, et aucun n'est fait de saints. Chacun a de bonnes raisons. C'est ce qui rend les choses difficiles.

**La Garnison du Quai.** Ce qui reste de l'ordre, retranché au ${region("le-port", "Port")} derrière des murailles de conteneurs : brassards orange, sirène à heure fixe, papiers à tamponner. Des militaires, des gendarmes mobiles sans hiérarchie, des dockers et leurs familles, et une commandante qui signe « pour l'autorité provisoire ». On dit qu'ils paient bien en carburant, qu'on entre chez eux désarmé et qu'on en sort fiché, et que celui qui se déclare médecin ou électricien n'en ressort pas toujours. On dit qu'ils attendent un cargo, et que ça fait longtemps.

**La Coopérative des Plaines.** Les fermiers des Hauts, de la ${region("le-tampon", "Plaine des Cafres")} aux ${region("plaine-des-palmistes", "Palmistes")} et jusqu'à ${region("cilaos", "Cilaos")}, regroupés autour de leurs fermes, de leurs vaches et de leurs fusils de chasse. Des cloches aux barrières, un troc le samedi à Bourg-Murat, un conseil de sept fermiers présidé par une très vieille éleveuse. On dit qu'on paie en travail, en graines ou en savoir, que la parole donnée vaut contrat et qu'un voleur ne revient pas deux fois. On dit qu'ils se méfient des gens de la ville.

**Les Ferrailleurs.** Les récupérateurs du littoral Ouest : mécaniciens, casseurs, débrouillards en pick-up hérissés de tôle, qui démontent tout ce que les villes ont laissé, des voitures aux panneaux solaires, et tiennent des marchés aux pièces dans les zones commerciales. Pas de chef, ou tout le monde. On dit qu'ils échangent tout contre tout, les renseignements compris, et qu'ils revendent les vôtres au suivant. On dit qu'ils ne sont pas cruels. Seulement efficaces.

**Les Barques du Sud.** Les pêcheurs de ${region("saint-pierre", "Saint-Pierre")}, de Saint-Joseph, de Saint-Philippe et de ${region("saint-leu", "Saint-Leu")}, qui dorment sur leurs bateaux au mouillage, hors de portée de tout ce qui marche, et vivent de la mer. Des barques peintes au large, des feux sur les jetées, du poisson séché contre n'importe quoi. On dit qu'ils transportent ce qui doit l'être d'une marine à l'autre, que ça coûte cher mais que ça évite la route des Laves, et qu'il ne faut jamais toucher à un bateau.

**Les Pèlerins de la Lave.** Autour de l'église de Sainte-Rose que la lave a épargnée autrefois, des familles de l'${region("est", "Est")}, des réfugiés et des malades, menés par un ancien catéchiste à la voix douce. Des pierres de lave au cou, des cierges sur les coulées, des chants le soir au bord de la route. On dit qu'on y est nourri et soigné sans payer, mais qu'on y reste ; qu'ils croient que le volcan protège ceux qui vivent à son pied et que le Gris est une épreuve. On dit, plus bas, ce qu'ils font des mordus. On ne sait pas si c'est vrai.

**Les Familles des Îlets.** Les quelques centaines d'habitants de ${region("mafate", "Mafate")}, et ceux de ${region("salazie", "Salazie")} qui les ont rejoints. Ils vivaient déjà sans route, avec des panneaux sur les toits, des sources captées et des sentiers qu'ils connaissent les yeux fermés : le monde d'après ressemble à leur monde d'avant, en plus dur. Des guetteurs aux cols, des sifflets qui se répondent d'îlet en îlet, une vieille institutrice que les sentiers écoutent. On dit qu'on demande à entrer, qu'on ne force pas, qu'il y a trois jours de quarantaine au col et un travail à faire. On dit qu'ils n'oublient ni un service ni un affront.

**Le Dispensaire du Sud.** Les soignants qui n'ont pas fui : une aile du grand hôpital de Saint-Pierre et un poste à Saint-Denis, une croix rouge peinte sur des draps, des ambulances en navettes, des coupons de soin écrits à la main, et une urgentiste qui n'est pas sortie de l'hôpital depuis le jour zéro. On dit qu'on y est soigné contre ce qu'on peut donner, et parfois pour rien. On dit qu'ils sont honnêtes, et à bout, et qu'ils demandent, pour leur remède, des choses qu'on n'a pas envie d'entendre.

**Les Sans-Lune.** La bande née des pillages de ${region("saint-denis", "Saint-Denis")}, grossie de tous ceux qui ont compris qu'on survit mieux en prenant qu'en produisant. Visages noircis, sorties les nuits sans lune, marques à la bombe sur les portes « déjà payées », et un homme qu'on appelle le Comptable, qui tient sur un cahier ce que chaque quartier lui doit. On dit qu'on paie, qu'on se cache ou qu'on se bat, et qu'un tribut acheté ne dure qu'une lune. On dit que plus la côte se vide de Livides, plus ils s'étendent.

Et puis il y a les autres : les groupes sans nom, les familles dans une case, les enfants seuls, les gens comme vous. On dira de vous ce qu'on dit d'eux : ça dépend des jours.` },

  { cle: "vivre-a-fenoir", titre: "Vivre à Fénoir", texte: `Ce chapitre est le plus utile et le plus ennuyeux : l'eau, la nourriture, le courant, la pluie, la fièvre. Ceux qui l'ont écrit ont appris chaque ligne à leurs dépens. Les règles qui vont avec sont dans le ${guide("guide-du-joueur", "guide du joueur")} et dans ${guide("vie-au-camp", "la vie au camp")} ; ici, c'est la vie.

# L'eau

On boit plus qu'on ne croit : dans la chaleur des Bas, une fois et demie ce qu'il faut dans les Hauts. Quand le réseau tombe, il reste la pluie, qu'il faut recueillir (un toit, une gouttière, une cuve propre), la rivière et la source, qu'il faut **faire bouillir** ou filtrer, parce que l'eau des ravines porte la leptospirose et les gastros, qui tuent plus sûrement qu'un Livide. Une citerne pleine en décembre fait tenir jusqu'en avril ; en saison sèche, dans l'Ouest, elle baisse à vue d'œil.

# La nourriture

Les rayons des supermarchés ont nourri l'île trois semaines, puis ils ont nourri les rats. Sans réserve étanche, sans séchoir ni fumoir, la chaleur humide gâte ce qu'on stocke, un peu chaque jour. Ce qui tient : le riz et les grains tant qu'ils sont secs, les conserves, le poisson séché des Barques, le lait de la Coopérative, et surtout ce qu'on fait pousser. L'île donne beaucoup à qui sait : brèdes, chouchous, patates douces, manioc, bananes, les letchis et les mangues de l'été, le miel, les œufs des poules échappées, les tilapias d'un bassin, un cabri, un cochon marron pris au piège. Un potager demande un mois avant de nourrir ; un verger, des années. On commence le premier jour.

# Le courant

L'île était couverte de panneaux solaires avant Fénoir, et ils marchent toujours : sur les toits des Hauts, des écoles, des hangars. Un panneau, une batterie, un régulateur, et l'on a de la lumière la nuit, une radio, une glacière pour l'insuline. Le groupe électrogène, lui, coûte tout : du carburant qu'on ne retrouvera jamais, et un bruit que toute la vallée entend. On l'allume pour sauver une vie.

# Les cyclones et le volcan

La saison des pluies n'a pas pris de congé. Un cyclone à Fénoir, c'est comme avant, sans la radio pour le nommer : le ciel qui jaunit, la houle qui monte, les oiseaux qui se taisent, et la vieille qui dit « i sa vien ». On remplit, on cloue, on descend dans ce qui est le plus solide, et on attend. Après, les radiers sont sous l'eau, les routes de Cilaos et de Salazie sont coupées, et les Livides que le vent a couchés se relèvent dans la boue. Une galerie dans la roche, un tunnel de lave aménagé, une cave étayée valent toutes les tôles du monde. Quant à la Fournaise, elle ne demande l'avis de personne : quand elle coule, la route des Laves ferme, et le Sud sauvage redevient une île dans l'île.

# La fièvre

La dengue et le chikungunya n'ont pas disparu avec les médecins ; les moustiques, eux, ont gagné des milliers de gouttières pleines d'eau. Une moustiquaire, des cuves couvertes, de l'eau bouillie, une plaie lavée, une fracture bien tenue : voilà la médecine qui reste à la plupart. Il y a mieux à Saint-Pierre, chez le Dispensaire, pour qui a de quoi offrir. Et il y a les fièvres de l'âme : le moral, qu'on perd vite dans le noir, et qui revient avec un repas chaud, une chanson, quelqu'un qui écoute.

# Les fêtes qu'on garde

On a gardé les fêtes, toutes, et celles des voisins avec : fêter, c'est dire qu'on est encore un peuple. Noël sous les flamboyants ; le **20 décembre**, fête de la liberté, où ceux qui ne dépendent plus de personne comprennent ce qu'ils fêtent ; une seule lampe à huile pour Dipavali, et tout le camp vient la voir ; un kayamb bricolé en juin. Tout cela est dans ${guide("fetes-de-fenoir", "les fêtes de Fénoir")}. Ça coûte une ration de plus par personne. Ça vaut toujours le prix.

# Repartir ou s'enraciner

Il y a deux manières de vivre à Fénoir, et ce livre refuse de dire laquelle est la bonne. Les uns **repartent** : quand l'endroit s'épuise, quand une horde descend la route, ils chargent ce qu'ils peuvent, emportent leurs savoir-faire et leurs plans, et vont voir ailleurs. Les autres **s'enracinent** : ils captent, plantent, câblent, creusent, jusqu'au jour où rien ne manque sans que personne n'ait fouillé une maison. Mais une serre brille, une fumée monte chaque soir, et toute l'île sait alors qu'il y a quelque chose à prendre. Les nomades meurent sur les routes ; les sédentaires meurent chez eux. Les deux vivent, aussi, et longtemps. C'est un choix de vie, pas une tactique : voir ${pageGuide("guide-du-joueur", "deux-voies", "Repartir ou s'enraciner")}.

> On est restés. On a creusé la cave, planté, capté la source. Le soixante-dixième jour, personne n'est sorti chercher quoi que ce soit, et on a mangé à notre faim. Ma fille a demandé si c'était ça, gagner. J'ai dit que c'était ça, aujourd'hui.
> *Carnet de Rivo, électricien.*` },

  { cle: "portraits", titre: "Portraits", texte: `On rencontre les mêmes gens d'un bout de l'île à l'autre : les noms changent, les visages pas tant que ça. En voici quelques-uns, tels qu'on les décrit autour des feux. Certains existent vraiment. D'autres sont peut-être déjà morts quand vous lirez ceci. Tous ont une bonne raison.

**La commandante Hoarau**, du Port. Ancienne officière de port, la cinquantaine, une voix qui ne monte jamais. Elle a pris la tête de ce qui restait d'uniformes et en a fait la Garnison du Quai. Elle croit sincèrement qu'il faut un ordre pour survivre, et il n'est pas sûr qu'elle ait tort. Elle signe « pour l'autorité provisoire », et elle y croit encore, au provisoire.

**Mémé Lucette**, de la Plaine des Cafres. Soixante-quatorze ans, éleveuse, présidente du conseil de la Coopérative. Elle a vu passer tous les cyclones depuis sa naissance et n'a peur de rien, sauf de la ville. Elle vous fera asseoir, vous servira un lait chaud, vous demandera ce que vous savez faire, et rien d'autre tant que vous aurez répondu honnêtement.

**Gros Mani**, de la Rivière des Galets. Il tient la grande casse, rit fort, compte vite, n'oublie jamais une dette ni une faveur. On dit qu'il est le chef des Ferrailleurs ; il dit qu'il n'y a pas de chef. Il vous vendra la pièce qu'il vous faut, le renseignement qui va avec, et peut-être le vôtre à quelqu'un d'autre.

**Le patron Grondin**, de Saint-Pierre. Pêcheur, la soixantaine, la flottille des Barques du Sud derrière lui. Il a peur de la mer depuis qu'il y a perdu son fils, et il y retourne chaque jour. Il transporte, il échange, il ne parle pas beaucoup.

**Frère Expédit**, de Sainte-Rose. Ancien catéchiste, la voix douce, le regard qui ne cille pas. Il nourrit et soigne tous ceux qui viennent à l'église Notre-Dame-des-Laves, et il croit, sans une ombre, que le volcan protège ceux qui vivent à son pied. Ses fidèles le croient plus que lui.

**Madame Lauret**, de La Nouvelle, à Mafate. Ancienne institutrice, elle a appris à lire à la moitié du cirque, et les sentiers l'écoutent. C'est elle qui décide qui entre, après la quarantaine du col. Elle vous regardera les mains et les yeux avant les papiers, et enseigne volontiers l'eau et le solaire à qui aide aux jardins.

**La docteure Soundirassen**, du grand hôpital du Sud. Urgentiste, elle n'est pas sortie de l'hôpital depuis le jour zéro, et ça se voit. Elle soigne contre ce qu'on peut donner, et pour rien quand on n'a rien. Elle cherche un remède. Ceux qui l'ont vue récemment disent qu'elle commence à trouver acceptables des choses qui ne l'étaient pas, et qu'elle le sait.

**La voix du Brûlé.** Ophélie Turpin, radioamatrice dans les hauts de Saint-Denis, soixante ans passés. Chaque soir, elle émet les nouvelles qu'elle reçoit, vraies ou fausses, en le disant ; chaque matin, elle lit une histoire aux enfants qui l'écoutent, quelque part. Des centaines de gens la connaissent sans l'avoir vue.

**Le pharmacien de l'Entre-Deux.** Un vieil homme qui a fait de sa case créole une forteresse : barreaux, citerne, panneaux, et une glacière où dort tout ce qui compte dans une pharmacie de montagne. On raconte qu'il connaît les stocks de tout le Sud. On raconte qu'il est seul. On raconte qu'il n'ouvre pas.

**La prof du collège sur la colline.** On la cite sans son nom. Le jour zéro, elle surveillait la récréation ; le soir, des parents ne sont pas venus, et elle est restée avec les enfants qui restaient. Il y a des collèges comme ça dans toute l'île, pleins d'enfants et de dilemmes. Elle a besoin de tout, et d'abord qu'on ne lui mente pas.

**Ti Zan.** Un enfant de neuf ans, seul, muet depuis le jour zéro, qui suit les groupes à distance avec un doudou en forme de tangue. Il connaît des passages que personne d'autre ne voit. Ne lui courez pas après : laissez de la nourriture, et attendez.

**Et vous.** Une infirmière, un électricien, une gendarme sans brigade, un guide, un vieux marin, une fermière, un chauffeur de car, un gamin débrouillard du Port, une étudiante. Au jour zéro, vous étiez ce que vous faisiez. Après, vous êtes ce que vous savez faire, et ce que vous décidez de ne pas faire. Le reste se tire au sort : ${pageGuide("guide-du-joueur", "creer", "créer son survivant")}.` },

  { cle: "rumeurs", titre: "Rumeurs et mystères", texte: `Il n'y a plus de nouvelles. Il y a des rumeurs : ce qu'on a entendu à la radio, ce qu'un homme de passage a dit à la barrière, ce qu'on répète parce qu'on a envie que ce soit vrai. Ce livre les note, avec ce qu'on en sait. **Certaines sont fausses, et on vous le dit.**

1. **« Les Livides ne montent pas au-dessus de mille mètres. »** Faux. On l'a cru les premières semaines, parce que les Hauts étaient calmes : ils le sont parce qu'il y a peu de monde, donc peu de morts. Ils y montent très bien, à pied, avec les réfugiés, et ils y restent.

2. **« Les Livides ne traversent pas l'eau salée. »** À moitié vrai, ce qui est pire que faux. Ils ne nagent pas, et un bateau au mouillage est un bon abri. Mais la mer les rend : les noyés reviennent avec la houle, et marchent sur la plage vers vos lumières.

3. **« Un cargo viendra chercher les survivants au Port. »** La Garnison le dit à la radio depuis des semaines, avec un jour, puis un autre. Personne ne l'a vu. Ceux qui y sont allés avec leurs papiers sont restés : recensés, logés, réquisitionnés.

4. **« Les Comoriens du Chaudron ont vidé l'hypermarché. »** Faux : ceux qui l'ont vidé avaient un camion et des visages noircis. Mais la rumeur court plus vite qu'eux.

5. **« Un enfant mordu ne s'est pas transformé. »** C'est la rumeur qu'on veut le plus croire, et celle qui a fait le plus de morts : des gens qui ont gardé un mordu près d'eux « au cas où ». Le Dispensaire aimerait trouver cet enfant.

6. **« Il y a un tunnel de lave aménagé dans le Grand Brûlé, avec des vivres pour des mois. »** Plausible : il y a des tunnels sous les coulées, frais, sombres, sans eau ni soleil. Personne qui l'ait vu n'en est revenu pour le dire, ce qui peut vouloir dire deux choses.

7. **« Les vieux Livides des Hauts ne bougent plus quand il gèle. »** Vrai, d'après tous ceux qui ont passé l'hiver là-haut. À l'aube, par temps clair, on passe entre eux en silence. Au premier rayon, ils se réveillent. Ne tardez pas.

8. **« Les Pèlerins rendent les mordus à la lave. »** On le dit. Ils disent, eux, qu'ils accueillent les malades et prient. Les deux peuvent être vrais le même jour.

9. **« Quelqu'un lit des histoires aux enfants, le matin, à la radio. »** Vrai. C'est la voix du Brûlé. Cherchez la fréquence.

10. **« Maurice a fermé ses ports et coulé un bateau de réfugiés. »** Un radioamateur l'affirme. Personne n'a pu vérifier. On ne sait rien de Maurice, ni de Madagascar, ni de la métropole, depuis que les antennes se sont tues. Ce silence est peut-être le plus grand mystère de l'île, et le plus simple.

Et puis il y a les mystères qu'on ne numérote pas : un îlet de Mafate où tout va bien, trop bien ; un groupe qui vit sur les toits du Chaudron et ne descend jamais ; une femme qui répète chaque soir à la radio une adresse de Saint-Pierre et le prénom de son fils. Si vous apprenez quelque chose, écrivez-le ici, avec la date et la source.` },

  { cle: "lexique", titre: "Lexique", texte: `# Mots de l'île

Le créole réunionnais se parle plus qu'il ne s'écrit ; les graphies varient. Voici les mots que vous entendrez, avec ce qu'ils veulent dire.

- **Fénoir** (*i fé noir*) : la nuit, l'obscurité. Depuis Fénoir : depuis que tout a basculé.
- **Marmaille** : les enfants. « Rentre les marmailles » : rentre les enfants.
- **Gramoun** : une personne âgée, un ancien ; se dit avec respect.
- **Zoreil** : une personne venue de métropole. Pas une insulte, pas tout à fait un compliment.
- **La kaz, la kour** : la maison, la cour. La kour, c'est aussi la famille élargie, ceux de la maison.
- **Varangue** : la véranda de la case créole, où l'on vit, où l'on reçoit, où le gramoun regarde passer la route.
- **Ravine** : le lit, souvent à sec, d'un torrent ; en crue, un piège mortel.
- **Radier** : un passage bétonné au fond d'une ravine, que les voitures traversent à gué et que la pluie submerge.
- **Îlet** : un replat habité au fond d'un cirque, un hameau sans route.
- **Dalon** : un ami, un camarade.
- **Moun** : les gens. « Na poin moun » : il n'y a personne.
- **Lontan** : autrefois, le temps d'avant.
- **La pli** : la pluie. « La pli i tonm » : il pleut.
- **Oté !** : interjection pour appeler, s'étonner, protester.
- **Tienbo, larg pa** : tiens bon, ne lâche pas. On le dit aux malades, aux marcheurs, à soi-même.
- **Kabar** : une fête, une veillée avec musique, à l'origine le rassemblement autour du maloya.
- **Maloya, séga** : les deux musiques de l'île ; le maloya, lent et grave, né des esclaves ; le séga, vif, qui fait danser.
- **Cari, brèdes, chouchou** : le plat de tous les jours (viande ou poisson en sauce, sur du riz, avec des grains), les feuilles vertes qu'on cuisine, le légume des treilles de Salazie.
- **Tangue** : un petit hérisson des Hauts ; aujourd'hui, le doudou d'un enfant qui ne parle plus.

# Mots des survivants

- **Le Gris** : le mal. « Il a pris le Gris », « elle porte le Gris » : infecté.
- **Livide** : un mort relevé. **Coureur** : un Livide tout frais, qui court encore. **Livide des Hauts** : un Livide ancien, conservé par le froid, raide, très dur à abattre. **Noyé** : un Livide rendu par la mer.
- **Hors d'état** : quand un Livide ne bouge plus pour de bon.
- **Horde** : un rassemblement de Livides qui se déplace en masse, attiré par le bruit.
- **Le quart** : la mesure du temps : matin, après-midi, soir, nuit. « Deux quarts de marche. » « Un quart de garde. »
- **L'abri** : là où l'on dort derrière une porte fermée. **La fouille** : sortir chercher ce qui manque. **Les plans** : ce qu'on a su construire une fois et qu'on saura refaire plus vite.
- **Renseignement daté** : ce qu'on sait d'un endroit, et depuis quand.
- **Jour autonome** : un jour où rien n'a manqué sans que personne ne soit sorti fouiller.
- **Brèche** : quand la porte cède.
- **Tribut** : ce que les Sans-Lune prennent pour ne pas prendre le reste.
- **Brassard orange** : la Garnison. **Coupon de soin** : la monnaie du Dispensaire. **La quarantaine du col** : les trois jours à la porte de Mafate avant d'entrer.
- **Le silence** : le temps, après la panique, où plus personne ne répond à la radio.` },

  { cle: "premiere-nuit", titre: "La première nuit", texte: `Ce texte a été trouvé dans le premier cahier, sans nom. On le recopie en dernier, parce que c'est par là que tout le monde commence.

> On a fermé la porte à huit heures. Pas une grande porte : celle d'une case, avec un verrou, une chaise coincée dessous et l'armoire qu'on a traînée à quatre. Dehors, il faisait encore jour, ce jour de décembre qui n'en finit pas, et les flamboyants de la rue étaient rouges comme s'ils n'avaient rien compris.
>
> Il y avait l'électricité. On a allumé, puis on a éteint tout de suite, parce que la lumière se voyait de la rue, et on a regardé la rue par la jalousie. Il y avait deux voitures arrêtées en travers, portières ouvertes, et un homme debout entre les deux, qui ne bougeait pas, et qui ne bougeait pas. Puis un chien a aboyé quelque part, et il s'est tourné vers le bruit, lentement, comme quelqu'un qui a oublié où il a posé ses clés. On s'est éloignés de la fenêtre.
>
> On a compté ce qu'on avait. Les bouteilles remplies dans l'après-midi, la baignoire pleine, le riz, les boîtes, le gaz, la trousse à pharmacie avec plus de pansements que de médicaments, deux lampes frontales, un couteau de cuisine, la radio de la voiture. Quatre personnes et un chien. On a fait un cari de rien du tout, et on l'a mangé en silence, parce que la cuisinière faisait un bruit de cuisinière et que ça nous paraissait énorme.
>
> La radio a parlé jusqu'à dix heures. Le préfet, encore ; les urgences, encore. Puis une musique, puis la même musique, puis la porteuse. On a essayé les téléphones. Rien. À un moment, quelqu'un a reçu un message de midi, qui arrivait seulement maintenant, d'une personne qui disait qu'elle rentrait. Personne ne lui a répondu.
>
> Vers minuit, des cris dans la rue d'à côté, puis des coups de feu, trois, et après les coups de feu, un bruit que je n'avais jamais entendu : des pas, beaucoup de pas, qui allaient tous dans la même direction. On a tenu la porte à deux, pour rien, parce que rien n'est venu chez nous. On avait éteint. On s'était tus. C'est cette nuit-là qu'on a appris la seule règle qui vaille : à Fénoir, on ne fait pas de bruit.
>
> Le chien a dormi. Nous, non. On a parlé bas, de la mère de l'un qui était à Saint-Pierre, du frère de l'autre qui était en mer, de l'eau qu'il faudrait trouver si le robinet s'arrêtait, de l'endroit où l'on irait si on ne pouvait pas rester, et on n'avait pas d'endroit. On a décidé de garder tour à tour. Celui qui gardait a regardé la rue, et le ciel, qui était plein d'étoiles, parce que les étoiles, elles, ne savaient pas.
>
> À cinq heures et demie, comme tous les matins de sa vie, le coq du voisin a chanté. Il faisait jour. Les flamboyants étaient toujours rouges. L'homme entre les deux voitures n'était plus là, et l'on a compris que ce n'était pas une bonne nouvelle.
>
> On a fait du café, parce qu'il y avait encore du café et encore du gaz, et on l'a bu sur la varangue, assis par terre, sous l'appui de la fenêtre. La lumière montait sur la montagne. Quelqu'un a dit : « Tienbo, larg pa. » Quelqu'un a dit : « On va où ? » Et le livre a commencé là.

Vous en êtes là. Le reste, c'est à vous de l'écrire.` }
] });
