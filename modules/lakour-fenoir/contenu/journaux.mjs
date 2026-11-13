// Les journaux de Fénoir : compendium « guides » (lisible des joueurs) et « mj » (caché). Règles du contrat §1 en clair,
// création du survivant (§10), régions de l'île, vie au camp, fêtes ; pour le MJ : guide, chronologie, factions, réputations,
// bestiaire, scénario d'ouverture « Jour zéro », one-shot, campagne en fronts, et « Pourquoi les Bas se vident ». Textes originaux.
import { journal, sansBalises } from "./aides.mjs";
import { REGIONS } from "./monde.mjs";
import { FACTIONS } from "./factions.mjs";
import { ENFANCES } from "./enfances.mjs";
import { TRAITS } from "./traits.mjs";
import { PASSES } from "./passes.mjs";
import { BESTIAIRE } from "./bestiaire.mjs";
import { VOIES_AUTONOMIE, INSTALLATIONS } from "./installations.mjs";
import { texteReputations } from "./reputations.mjs";
import { FETES_FENOIR } from "../scripts/fetes.js";
import { COMMUNAUTES, MARCHANDS, MARCHES, FOIRES, COURS_TEXTE } from "./marche.mjs";
import { EVENEMENTS } from "./evenements.mjs";

const nomRegion = cle => REGIONS.find(r => r.cle === cle)?.nom ?? cle;
const nomInstallation = cle => INSTALLATIONS.find(i => i.system.cle === cle)?.name ?? cle;
const ZONES_TEXTE = { littoral: "littoral", hauts: "les Hauts", cirque: "cirque", volcan: "volcan", foret: "forêt" };
const NIVEAU = ["nul", "faible", "moyen", "fort"];

// ================================================================ Guide du joueur
const GUIDE_JOUEUR = journal({ cle: "guide-du-joueur", nom: "Fénoir — Guide du joueur", pack: "guides", pages: [
  { cle: "bienvenue", titre: "Bienvenue à Fénoir", texte: `**Fénoir**, c'est la nuit, en créole. Un mal que personne ne comprend, *le Gris*, relève les morts : on les appelle les **Livides**. Vous vivez à La Réunion, et la partie commence **au jour zéro** : les lumières sont encore allumées, les téléphones sonnent, les urgences débordent, et rien ne va plus.

Le temps avance avec vos actions, et le monde avance avec lui : les réseaux tombent région par région, les villes se remplissent de Livides puis, des mois plus tard, s'en vident ; des bandes naissent, des cyclones passent, la Fournaise peut se réveiller.

Vous cherchez un **abri**, vous l'aménagez, vous vivez de **ressources** qui s'épuisent. Deux voies, aussi valables l'une que l'autre :
- **Repartir** : quand l'endroit est épuisé ou intenable, déménager ailleurs avec ce qu'on peut porter, ses compétences, et ses **plans** (ce qu'on a su construire se reconstruit plus vite).
- **S'enraciner** : viser l'**autonomie** (eau de pluie, potager, élevage, panneaux, galeries…) pour ne plus jamais bouger. Mais la prospérité se voit et s'entend.` },
  { cle: "test", titre: "Le test", texte: `Quand l'issue est incertaine et qu'il y a un enjeu, on fait un **test**.

- Votre **réserve** : autant de d6 que le **niveau de la compétence** (0 à 5) **+ 1**, plus les bonus (outil adapté +1, aide d'un autre +1, situation ±1 ou ±2), moins les malus d'état. Au moins 1 dé, au plus 10.
- Chaque **5 ou 6** est un **succès**. La difficulté dit combien il en faut : **normale** 1, **difficile** 2, **extrême** 3 ; **facile** : 1 succès avec un dé de plus.
- La **marge** (succès en trop) dit si c'est bien fait.

**Exemple.** Lucie (survie 2) cherche de l'eau potable dans une ravine sèche de l'Ouest : 3 dés, difficile. Elle tire 6, 3, 5 : deux succès, réussite juste.` },
  { cle: "forcer", titre: "Forcer et progresser", texte: `**Forcer** (une fois par test) : relancer tous les dés qui ne sont pas des succès, au prix de **1 fatigue**. Un test forcé qui échoue encore donne une **complication** que choisit le MJ : bruit, outil cassé, blessure légère, temps perdu.

**Progresser** : un test qui comptait (danger, enjeu) donne une **marque** à la compétence s'il est **échoué** ou **forcé** : on apprend de ses erreurs et de ses efforts. Quand les marques atteignent **2 × (niveau + 1)**, la compétence monte de 1 (au plus 5). Le MJ peut aussi donner une marque après une scène marquante. Une **passion** multiplie les marques (×1,5 pour un intérêt, ×2 pour une passion).

**Exemple.** Karim (bricolage 1) force la réparation d'une pompe et échoue quand même : complication (la poignée casse), mais il gagne une marque. À 4 marques, il passera bricolage 2.` },
  { cle: "competences", titre: "Les dix compétences", texte: `- **Endurance** : porter, creuser, courir, résister.
- **Combat** : le corps à corps.
- **Tir** : armes à feu, arc, arbalète, fusil-harpon.
- **Discrétion** : passer sans être vu, fouiller sans bruit.
- **Vigilance** : repérer, monter la garde.
- **Bricolage** : réparer, construire, électricité, mécanique.
- **Survie** : eau, cultures, pêche, chasse, orientation, plantes.
- **Soins** : panser, recoudre, soigner les fièvres.
- **Parole** : convaincre, négocier, apaiser, commander.
- **Conduite** : véhicules, deux-roues, bateau.` },
  { cle: "etat", titre: "L'état d'un survivant", texte: `- **Blessures** (0 à 4) : indemne, égratigné, blessé (−1 dé), grièvement (−2 dés), **mourant** : un test de soins difficile dans le quart, sinon la mort.
- **Fatigue** (0 à 5) : −1 dé à 3 et 4, −2 à 5. Une nuit de repos à l'abri : −2 ; un quart de repos : −1.
- **Moral** (0 à 5) : à 1, −1 dé ; à 0, le personnage **craque** (refuse, fuit, s'effondre).
- **Faim et soif** : au-delà de 4 quarts sans boire, +1 fatigue par quart ; au-delà de 2 jours sans manger, +1 fatigue et −1 moral par jour.
- **Infection** : une **morsure** ou une griffure profonde d'un Livide demande un test de soins **extrême** dans le quart (laver, cauteriser, parfois amputer), **difficile** si le soignant y met un médicament (+1 dé), une décoction de zerbaz (une plante, +1 dé), s'il porte une trousse de secours ou si l'abri a une infirmerie. Échec : le Gris est entré. Il avance toutes les deux quarts ; au bout, la personne meurt et se relève Livide. **Aucun remède connu.**
- **Maladies et blessures qui durent** : dengue, chikungunya, leptospirose, gastro, plaies infectées, fractures… Une eau traitée, des moustiquaires et une infirmerie en réduisent le risque.` },
  { cle: "temps", titre: "Le temps", texte: `Le temps se compte en **quarts** de six heures : matin, après-midi, soir, nuit. Fouiller un lieu prend un quart ; explorer une région, un ou deux ; voyager, selon la route ; construire, selon le chantier (quarts de travail divisés par le nombre de bras).

La partie commence le **4 décembre 2026** (réglage du MJ) : en pleine **saison des pluies et des cyclones** (novembre à avril). L'hiver austral (mai à octobre) est sec et frais ; il gèle au-dessus de 1 500 m. Letchis en décembre-janvier, mangues de novembre à janvier : la cueillette est meilleure.

La crise a ses **phases** : jour zéro (jours 0–1), panique (2–6), effondrement (7–20 : électricité, eau, carburant et téléphone tombent région par région), silence (21–59), puis l'après.` },
  { cle: "abri", titre: "Les ressources et l'abri", texte: `Les stocks de l'abri sont des nombres : **eau** (un jour d'eau pour une personne), **nourriture** (un jour de repas), **carburant** (10 litres), **médicaments**, **munitions**, **matériaux** (une brouette), **pièces** (une caisse), **graines**, **plantes médicinales** (une brassée de zerbaz : elles se cueillent, ne se pillent pas, et l'on n'en garde qu'une douzaine), **énergie** (kWh, plafonnée par les batteries).

Chaque jour, chaque personne boit **1 eau** (1,5 dans les Bas en saison chaude) et mange **1 nourriture**. Sans réserve étanche ni séchoir, **5 %** de la nourriture se gâte chaque jour : la chaleur humide pourrit tout.

Les **installations** produisent, protègent, cachent. Un groupe de quatre consomme 4 eau et 4 nourriture par jour ; à titre de repère, une citerne de pluie donne environ 1 eau par jour et par point de pluie de la région à son premier niveau, un potager environ 2 nourriture par jour après un mois, des panneaux environ 2 kWh par jour et par point de soleil. Un jour où eau, nourriture et énergie nettes sont positives sans aucune fouille est un **jour autonome** ; sept de suite, et l'abri est **autonome**.

Exemples de voies d'autonomie : ${VOIES_AUTONOMIE.map(v => `**${v.nom}** (${v.installations.map(i => `${nomInstallation(i.cle)} ${i.niveau}`).join(", ")})`).join(" ; ")}.` },
  { cle: "zerbaz", titre: "Les tisanes et les zerbaz", texte: `À La Réunion, on soigne depuis toujours avec les **zerbaz**, les plantes des tisaneurs : ayapana, citronnelle, faham, bois de quivi, fleur jaune, géranium, romarin, gingembre. Chaque cour a les siennes, chaque grand-mère ses recettes. Dans Fénoir, quand les pharmacies sont vides, elles comptent.

- **Cueillir.** Une cueillette aux alentours rapporte aussi quelques **plantes médicinales** ; on peut aussi partir cueillir les zerbaz seulement (la fouille « plantes ») : une brassée par personne et par demi-journée (deux quarts), prise sur la cueillette des alentours. Le savoir-faire **Zerbaz et tisanes** double ce qu'on rapporte : on reconnaît ce qui soigne, et ce qui ne se touche pas.
- **Préparer.** À l'atelier, la recette **Tisanes et emplâtres** (deux brassées, un quart de travail, test de survie normal ; +1 dé avec le savoir-faire) donne un **médicament** : pour les fièvres légères, les maux de ventre, une plaie à laver, une maladie qui demande un médicament.
- **Laver une morsure.** Dans l'urgence, une **décoction de zerbaz** (une brassée, bouillie) aide le soignant : le test de soins de la morsure devient **difficile** au lieu d'extrême, avec un dé de plus ; avec un médicament en plus, encore un dé.

Ce sont des **remèdes de jeu**. Les vertus des plantes sont celles que leur prête la tradition, pas un conseil médical. Et dans Fénoir, rien ne guérit du Gris : une tisane aide à laver une morsure à temps, elle ne sauve pas un infecté.` },
  { cle: "bruit", titre: "Bruit, visibilité, menaces", texte: `Le **bruit** de l'abri (0 à 10) retombe de 2 par quart : un coup de feu +2 (rafale +4), un groupe électrogène +2 par quart, un moteur +1, un chantier +1, un cri +2. La **visibilité** (0 à 10) se calcule : lumières la nuit, fumée, cultures, taille du groupe, installations voyantes, moins la discrétion du site et du camouflage.

Bruit et visibilité attirent hordes et bandes. Un **assaut** oppose la **défense** de l'abri (plus la vigilance de la garde) à la **force** de la menace : marge positive, repoussé ; −1, une installation endommagée et un blessé ; −2 ou pire, **brèche**.

**Combat simple** : chaque succès de combat ou de tir met un Livide hors d'état (les Livides anciens des Hauts en demandent deux) ; chaque Livide restant attaque (un d6 : 6 = touche, et un second 6 = morsure). Tirer fait du bruit.` },
  { cle: "voyager", titre: "Voyager et savoir", texte: `L'île est découpée en seize régions reliées par des **routes réelles** : RN1, RN2, route du Littoral, route des Tamarins, route des Plaines, route de Cilaos, route de Salazie, route du Volcan, route des Laves, et les sentiers de Mafate, qui n'a pas de route du tout. Chaque route a ses temps à pied et en véhicule ; fortes pluies, éboulements, houle et éruptions les rendent difficiles ou les coupent.

Ce que vous savez d'une région est **daté** : vu de vos yeux tel jour, entendu à la radio, ou simple rumeur. Le monde change pendant que vous n'y êtes pas. Un déménagement se prépare sur des renseignements qui vieillissent : c'est voulu.` },
  { cle: "deux-voies", titre: "Repartir ou s'enraciner", texte: `**Repartir.** Quand l'endroit s'épuise, qu'une horde approche ou que les Livides des Hauts se rassemblent, on déménage : on emporte ce qu'on peut porter (ou charger), on garde ses compétences et ses **plans** — reconstruire ailleurs coûte un quart de matériaux en moins et la moitié du travail.

**S'enraciner.** On creuse, on plante, on capte, on câble, jusqu'à ne plus dépendre de rien. Mais une serre qui brille, une éolienne qui grince, une fumée chaque soir disent à toute l'île qu'il y a quelque chose à prendre. La **discrétion** (souterrain, camouflage) et la **défense** protègent ce qu'on a bâti.

Le meilleur endroit change avec le temps : au début, les Hauts semblent sûrs et le littoral est l'enfer ; plus tard, ce sera peut-être l'inverse.` },
  { cle: "releve", titre: "La mort, la relève et l'autel", texte: `Un survivant meurt. Le groupe, lui, continue : c'est lui, le vrai personnage.

**La relève.** À la mort de votre survivant, vous choisissez : un **nouveau tirage**, ou **reprendre un autre survivant de votre groupe**, déjà sur place, d'au moins **16 ans** : un compagnon, une recrue, un PNJ. Il arrive avec ses propres compétences, ses traits, son histoire ; vous ne choisissez pas qui il est. Le prix : il **cesse son travail pour le groupe**. Ce qu'il faisait (la garde, le potager, la cuisine), il faudra le reprendre vous-même ou le confier à quelqu'un d'autre. S'il ne reste personne, il reste le nouveau tirage.

**Les jeunes.** De 16 à 18 ans, un survivant porte moins qu'un adulte (deux tiers d'une charge), travaille moins vite (trois quarts d'un adulte), son avis pèse moins dans un vote, et il ne peut pas être chef. À 18 ans, c'est un survivant comme les autres.

**Le deuil.** Chaque mort du groupe ôte 1 de moral à tous les vivants. Tant qu'on ne lui a pas **donné le repos**, son deuil pèse : le moral remonte un cran moins haut. Donner le repos, c'est une courte cérémonie à l'abri (un quart), pour un mort **retrouvé** : un mort qui s'est relevé en Livide doit d'abord être retrouvé. À la **Toussaint**, on le donne à tous les morts retrouvés à la fois.

**L'autel des morts.** Une étagère, une nappe, des noms écrits à la craie, une bougie : l'autel de l'abri porte les noms de ceux que le groupe a perdus. L'**honorer** (un quart, une assiette offerte), une fois par semaine au plus, rend 1 de moral à chacun et soutient le moral du groupe pendant sept jours. Rien n'en revient : c'est le groupe qui se tient.` },
  { cle: "troquer", titre: "Troquer : la boutique, le marché, la foire", texte: `Il n'y a plus de monnaie. On **troque**, et le marché se met en place au fil de la partie :

- **De la main à la main**, dès le premier jour : deux personnes échangent, sans lieu ni règle.
- **La boutique** : un commerçant resté dans son quartier tient un **carnet de crédit**. On prend aujourd'hui, on rend plus tard, et la dette est écrite. Une dette qui traîne (un mois, ou passée le Nouvel An chinois) se sait : le **Ladi Lafé** (« il a dit qu'il a fait », la rumeur) s'en charge, et le crédit s'arrête. Les dettes se soldent au **Nouvel An chinois** : qui a tout rendu voit son crédit grandir.
- **Le marché forain** : quand plusieurs communautés vivent dans une région et qu'une route est ouverte, un marché s'installe un jour fixe de la semaine, sur un terrain qui n'est à personne. Chaque bastion a une voix au **conseil du marché**, qui affiche le cours et règle les litiges. **Trêve** dans son périmètre : la rompre, c'est être connu de toute l'île comme celui qui l'a rompue.
- **La foire**, une fois par an, autour d'une récolte : les lentilles de Cilaos en octobre, les chouchous de Salazie, les goyaviers des Palmistes, le vacoa de Saint-Philippe, les semences du Nouvel An tamoul.

**Le cours** dit ce que vaut chaque chose, en **parts** (une part, c'est un jour de nourriture pour une personne) : il aide à échanger, il ne fait pas payer. De base : eau 1, nourriture 1, plantes 1, graines 2, matériaux 2, munitions 3, pièces 3, carburant 4, médicaments 5. Il bouge avec la crise (le carburant ne revient jamais), la saison (l'eau vaut peu sous la pluie) et la récolte de la foire.

**Accueillir le marché** à son abri rapporte de la réputation auprès des bastions qui y viennent, mais tout se voit et s'entend : du bruit chaque jour de marché, du monde, des lumières.

**Les gens du marché** viennent de toutes les communautés, et chacun a ses préjugés sur les autres. Un préjugé rend un marchand méfiant avec un inconnu : un prix moins bon, un crédit refusé, une parole mise en doute. Il s'use quand on échange honnêtement, quand on fête ensemble, et quand les faits le démentent. Aucune origine ne donne de bonus ni de malus dans les règles. Se servir d'un préjugé, pour refuser quelqu'un ou pour colporter, se paie.

**Marquer ses biens** : un objet marqué du signe de sa communauté se prouve et se réclame. Un voisin qui dit qu'il est à lui est démenti par la marque, et un mensonge démenti se sait.` },
  { cle: "creer", titre: "Créer son survivant", texte: `Un survivant, c'est une **enfance** (où et comment il a grandi), un **passé** (ce qu'il faisait au jour zéro), un **âge** (16 à 75 ans), 1 à 2 **passions**, 1 à 3 **traits** de caractère, parfois des **incapacités**, et une histoire.

**Tirer.** La fenêtre « Créer un survivant » (ou le MJ IA) tire tout au sort, de façon cohérente : les compétences sont la somme des modificateurs de l'enfance, du passé et des traits (au plus 5).

**Verrouiller et relancer.** Gardez ce qui vous plaît (nom, âge, enfance, passé, traits) en le verrouillant, et relancez le reste autant que vous voulez ; ou choisissez chaque élément vous-même.

**Le budget.** La somme des niveaux de compétences doit rester entre **10 et 16** pour un survivant de départ (le MJ peut changer ces bornes). Pas de héros de cinéma : des gens ordinaires.

**Les passions.** Une flamme (intérêt) : les marques comptent une fois et demie. Deux flammes (passion) : elles comptent double, et le survivant gagne 1 de moral les jours où il fait une tâche de sa passion, en perd 1 s'il en est privé sept jours.

**L'âge.** Sous 25 ans, on apprend plus vite (une marque de plus toutes les trois) ; les anciens partent avec plus de niveaux et moins d'endurance.

**Les incapacités** (en rouge) : ce qu'il refuse ou ne sait pas faire — la violence, les soins, les travaux lourds, la conduite…

**Les tâches du jour.** À l'abri, chacun a une tâche : garde, cultures, élevage, chantier, atelier, cuisine, soins, eau, pêche, chasse, fouille, repos, enseigner. Une tâche tenue une semaine donne une marque.

**L'histoire.** Le MJ IA (ou vous) écrit le journal « Histoire de… » : qui il est, son histoire, ce qu'il garde pour lui (Foundry envoie les documents à tous les navigateurs : ce n'est pas un coffre-fort), et les chapitres de la campagne.` },
  { cle: "enfances", titre: "Les enfances", texte: ENFANCES.map(e => `**${e.nom}** (${Object.entries(e.modificateurs).map(([c, n]) => `${c} ${n > 0 ? "+" : ""}${n}`).join(", ")}${e.incapacites.length ? ` ; incapacité : ${e.incapacites.join(", ")}` : ""}) — ${sansBalises(e.description)}`).join("\n\n") },
  { cle: "passes", titre: "Les passés", texte: PASSES.map(p => `**${p.name}** — ${sansBalises(p.system.description)} *Compétences : ${Object.entries(p.system.competences).map(([c, n]) => `${c} ${n}`).join(", ")}.*`).join("\n\n") },
  { cle: "traits", titre: "Les traits", texte: TRAITS.map(t => `**${t.nom}** — ${sansBalises(t.description)}${t.incompatibles.length ? ` *(Incompatible : ${t.incompatibles.map(c => TRAITS.find(x => x.cle === c)?.nom ?? c).join(", ")}.)*` : ""}`).join("\n\n") }
] });

// ================================================================ Les régions de l'île (joueurs)
const REGIONS_DE_L_ILE = journal({ cle: "regions-de-l-ile", nom: "Les régions de l'île", pack: "guides", pages: [
  { cle: "carte", titre: "L'île", texte: `La Réunion fait une soixantaine de kilomètres de long. Le **littoral** concentre les villes et la chaleur ; les **Hauts** sont frais, brumeux, peu peuplés ; trois **cirques** (Cilaos, Salazie, Mafate) s'ouvrent autour du Piton des Neiges ; au sud-est, le **Piton de la Fournaise** est l'un des volcans les plus actifs du monde. L'**Ouest** (côte sous le vent) est sec et ensoleillé ; l'**Est** (côte au vent) est l'un des endroits les plus pluvieux de la planète.

Chaque page dit ce qu'on sait d'une région **au jour zéro**. Le reste, il faudra aller le voir.` },
  ...REGIONS.map(r => ({ cle: r.cle, titre: r.nom, texte: `${sansBalises(r.description)}

- **Zone** : ${ZONES_TEXTE[r.zone]} ; altitude moyenne environ ${r.altitude} m.
- **Climat** : soleil ${NIVEAU[r.climat.soleil]}, pluie ${NIVEAU[r.climat.pluie]}.
- **Routes** : ${r.voisins.map(v => `vers ${nomRegion(v.region)} par ${v.route} (${v.km} km, ${v.terrain}${v.quartsVehicule ? "" : ", à pied seulement"})`).join(" ; ")}.` }))
] });

// ================================================================ Les fêtes (joueurs)
const FETES = journal({ cle: "fetes-de-fenoir", nom: "Les fêtes de Fénoir", pack: "guides", pages: [
  { cle: "principe", titre: "Fêter quand même", texte: `L'île fêtait beaucoup : chaque communauté, chaque saison, et les fêtes des uns étaient celles de tout le monde. Le monde d'après ne fait pas exception : le calendrier du métissage donne encore le tempo de l'année.

**Fêter une fête au camp** se décide en groupe, une fois par fête et par année. Chaque fête a **ce qu'elle apporte** et **ce qu'elle coûte** : du moral, parfois pour plusieurs jours, mais aussi des rations, du bois, du bruit qui porte, de la lumière qui se voit. Aucune n'a d'effet magique : ceux qui croient peuvent y voir un signe, le monde ne confirme rien. La foi tient debout ceux qui l'ont ; c'est déjà beaucoup.` },
  { cle: "chez-les-autres", titre: "Aller à la fête des autres", texte: `À La Réunion, tout le monde allait voir le feu de la Dipavali, le dragon du Nouvel An chinois, le kabar du 20 décembre. Dans le monde d'après, **aller à la fête d'une autre communauté** (un abri voisin, une faction, un quartier qui fête encore) prend deux quarts, rend **+1 de moral** à ceux qui y vont, et **tisse un lien** avec ceux qui reçoivent : un lien de plus avec leur communauté et, s'ils sont d'une faction, avec elle. Avec deux liens, on recrute plus facilement chez eux.

Les préjugés ne tombent pas en un soir. Mais on se méfie moins de ceux avec qui l'on a mangé.` },
  ...FETES_FENOIR.map(f => ({ cle: f.cle, titre: f.nom, texte: `${f.description}${f.gain ? `\n\n**Ce qu'elle apporte.** ${f.gain}` : ""}${f.cout ? `\n\n**Ce qu'elle coûte.** ${f.cout}` : ""}\n\n*Date : ${f.date ? f.date.split("-").reverse().join("/") : Object.entries(f.dates).map(([a, d]) => `${d.split("-").reverse().join("/")}/${a}`).join(", ")}.*` }))
] });

// ================================================================ Le temps de l'île (joueurs ; lot « fetes », 2026-11-13)
const TEMPS_DE_L_ILE = journal({ cle: "temps-de-l-ile", nom: "Le temps de l'île", pack: "guides", pages: [
  { cle: "annee", titre: "L'année réunionnaise", texte: `L'année de Fénoir suit celle de l'île. Les **flamboyants** s'embrasent en fin d'année ; les **letchis** rougissent en décembre, puis viennent les **longanis** ; les mangues tombent de novembre à janvier. De décembre à mars, la **chaleur de l'été austral** écrase les Bas : l'après-midi dehors, un test d'endurance perd un dé, et l'on boit davantage. Les cyclones passent surtout de janvier à mars ; le Nouvel An tamoul, à la mi-avril, en annonce la fin. L'hiver austral rafraîchit les Hauts, la brume y monte chaque soir ; la canne se coupe de juillet à novembre.

Le bandeau dit ce que montre le paysage : c'est aussi comme cela qu'on garde la date, quand plus rien d'autre ne la donne.` },
  { cle: "lune", titre: "La lune et la nuit", texte: `La nuit est vraiment noire. Sa **clarté** suit la **lune** : elle se lève chaque jour un peu plus tard, un premier croissant s'est déjà couché quand la nuit commence, une lune décroissante ne se lève qu'au cœur de la nuit. La **brume et les nuages des Hauts** la cachent souvent : une nuit claire peut devenir noire en plein trajet.

- **Nuit noire** (lune couchée, nouvelle, ou cachée) : dehors, chaque test perd un dé, sauf la discrétion qui en gagne un ; les rencontres sont plus rares, les chutes et les ravines plus fréquentes. Mais **sortir par une nuit de noir total rapporte plus à la fouille** (un quart de plus) : personne d'autre ne sort.
- **Pleine lumière** (pleine lune levée, ciel dégagé) : on y voit mieux, la vigilance gagne un dé ; **les Livides aussi** : la discrétion perd un dé et les rencontres sont plus fréquentes.` },
  { cle: "date", titre: "Quand la date se perd", texte: `Tant qu'un téléphone capte, ou qu'une radio parle, on sait quel jour on est. Quand le réseau tombe et que l'abri n'a pas de poste, la date exacte se perd : on la lit dans la nature et dans la lune. « Début février, la lune décroît, les longanis sont mûrs » : c'est assez pour vivre, pas toujours assez pour un rendez-vous. Plusieurs fêtes suivent la lune (la Dipavali à la nouvelle lune, le Cavadee à la pleine lune, le Nouvel An chinois, le ramadan) : elles se retrouvent quand même.` }
] });

// ================================================================ Guide du MJ
const GUIDE_MJ = journal({ cle: "guide-du-mj", nom: "Fénoir — Guide du MJ", pack: "mj", pages: [
  { cle: "mener", titre: "Mener Fénoir", texte: `Fénoir est un jeu de **survie réaliste et humaine** : la faim, la soif, la fatigue, les choix impossibles, l'entraide. L'horreur est sobre : on montre peu, on suggère beaucoup, on ne complaît jamais dans le gore. La beauté de l'île est le contrepoint constant : les cirques au lever du jour, le lagon immobile, les letchis de décembre, la brume des Hauts. Le créole vient en touches légères dans les dialogues, toujours compréhensible.

Le système tient les comptes (stocks, production, réseaux, infestation, hordes, factions, météo) ; vous racontez. Le monde réel est **secret** : vous le voyez, les joueurs ne voient que ce qu'ils savent, daté.` },
  { cle: "temps", titre: "Le temps qui avance", texte: `Rien ne se passe « entre les scènes » sans que le temps avance. Chaque action a un coût en quarts ; quand les joueurs fouillent, explorent, construisent, voyagent ou se reposent, faites avancer l'horloge, et le monde avance avec elle : à chaque jour, la simulation consomme, produit, gâte, pille, propage les hordes, fait tomber les réseaux, déplace les factions, tire la météo et les événements.

Annoncez ce que le groupe voit ou entend (les **faits publics**) ; gardez le reste dans le journal secret, et faites-le surgir plus tard : la fumée d'un incendie à l'horizon, la voix d'une radio, un abri voisin tombé.` },
  { cle: "deux-voies", titre: "Les deux voies", texte: `**Repartir** et **s'enraciner** sont deux façons de gagner. Ne punissez ni l'une ni l'autre.

- Au groupe nomade, donnez des routes vivantes, des lieux qui ont changé, des renseignements périmés, des rencontres, la récompense des **plans** (reconstruire plus vite).
- Au groupe sédentaire, donnez la satisfaction des chantiers, des récoltes, du premier jour autonome — et le prix de la prospérité : la **visibilité** monte, les paliers déclenchent rumeurs, éclaireurs, visites, assauts (tables « Visibilité »).

Le twist du monde (voir « Pourquoi les Bas se vident ») déplace le meilleur endroit au fil des mois : c'est le moteur naturel des déménagements.` },
  { cle: "renseignements", titre: "Les renseignements datés", texte: `Les joueurs ne connaissent d'une région que ce qu'ils y ont vu (avec la date), ce qu'ils ont entendu à la radio (moins fiable) ou une rumeur. Rappelez-le : « La dernière fois que vous êtes passés à Saint-Pierre, il y a vingt jours, le port était aux mains des pêcheurs. » Corrigez ou ajoutez un renseignement quand un PNJ parle, quand la radio grésille, quand une rumeur court (outil renseigner).

Un déménagement doit se préparer sur des informations qui vieillissent : la surprise à l'arrivée fait partie du jeu.` },
  { cle: "ton", titre: "Le ton et les dilemmes", texte: `Les meilleures scènes de Fénoir sont des **dilemmes** :
- Une famille frappe à la porte ; l'un d'eux tousse. On ouvre ?
- La morsure est au poignet. On coupe ?
- Les Sans-Lune demandent un tribut ; payer, c'est survivre cette lune et nourrir la bande.
- Le Dispensaire veut un infecté vivant pour l'étudier. Le vôtre ?
- La citerne est pleine, le voisin a soif.
- Le groupe électrogène sauverait un blessé cette nuit ; il attirerait la horde.

Laissez les joueurs choisir, et que le monde s'en souvienne : réputations, rancunes, dettes.` },
  { cle: "zerbaz", titre: "Médicaments, trousses et zerbaz", texte: `Les médicaments sont rares sans être introuvables : la réserve d'une région se vide vite, mais une fouille tombe parfois sur une **trousse de secours** oubliée (boîte à gants, armoire de salle de bains : +1 médicament), et l'aile d'un hôpital en cache trois fois plus. Un survivant seul n'en a presque jamais : c'est lui que le Gris emporte d'abord.

Les **zerbaz** sont sa chance : une cueillette rapporte quelques plantes, une décoction aide à laver une morsure (test difficile au lieu d'extrême, +1 dé), une tisane préparée vaut un médicament. Racontez-les avec respect : le tisaneur du bourg, la grand-mère qui sait, le cahier de recettes trouvé dans une case. N'en faites pas des potions : ils aident le soignant, ils ne guérissent pas un infecté. Une trousse de secours ou un sac d'intervention que porte le soignant aide aussi, sans s'épuiser ; décidez qu'elle est vide si le groupe n'en prend aucun soin.` },
  { cle: "outils", titre: "Les outils du MJ", texte: `- **Tables** : rencontres par zone et par phase, découvertes de fouille, rumeurs de la radio, complications d'un test forcé, noms et surnoms réunionnais, noms de cyclones, visibilité (une table par palier), générateurs (survivant rencontré, site fouillé, rumeur), recrues (raison, prix), histoire (proche, ce matin-là), imprévus du camp.
- **Appels radio et demandes des factions** : trois par semaine de jeu quand le groupe a une radio ; récompense et réputation dans les données de chaque résultat.
- **Réputations** : une horloge **rep-<faction>** par faction (voir « Réputation auprès des factions »).
- **Bestiaire** : Livides et animaux, avec leurs dés et leur résistance.
- **Cartes** : la carte de La Réunion (une épingle par région) et sept cartes de lieux (case créole, collège, station-service, supermarché, gîte, tunnel de lave, îlet).
- **Le MJ IA** joue tout cela avec ses outils survie_* : il voit le réel et le connu, et ne dit aux joueurs que le connu.` },
  { cle: "temps-de-l-ile", titre: "Le temps de l'île, les fêtes et les morts", texte: `**La lune.** Le système calcule la lune de la date de jeu et, chaque nuit, si la brume ou les nuages la cachent (souvent dans les Hauts le soir, toujours sous la pluie forte et le cyclone) : le bandeau dit la clarté. Une sortie de nuit en tient compte d'elle-même (fouille, voyage, tests dehors : le guide « Le temps de l'île » des joueurs). Une nuit de noir total est celle des expéditions risquées : faites-la sentir (la main sur l'épaule de celui de devant, la ravine qu'on devine au bruit de l'eau).

**La date perdue.** Sans téléphone ni poste radio, les joueurs ne voient plus la date exacte : le bandeau dit « début, mi- ou fin » du mois, la lune et les signes du paysage. Vous la voyez toujours.

**Les fêtes.** Chacune a son gain et son coût, que le système applique quand le groupe la fête (fenêtre du MJ, onglet Partie, ou le MJ IA). Certaines demandent un choix : la fête de la musique en musique ou en silence ; les vœux du Cavadee, ceux qui les font ; le cadeau de Noël, la recrue qu'il attache ; les dons du Nouvel An chinois, l'échange de graines du Nouvel An tamoul, la part de l'Aïd el-Kebir, l'abri voisin qui les reçoit. Un vœu se tient ou se rompt : c'est vous qui le dites (tenu, +1 de moral ; rompu, −1). Racontez la foi avec respect, sans jamais la confirmer ni la moquer.

**Chez les autres.** Aller à la fête d'une autre communauté tisse des liens (onglet Groupe). Les PNJ y portent leurs préjugés, et les faits les démentent : celui qui craignait le « service » des Malbars a vu le feu de la marche et la cuisine partagée après ; c'est à vous de le jouer.

**La mort et la relève.** Quand un survivant de joueur meurt, proposez la relève (onglet Groupe) : un nouveau tirage, ou un autre membre de 16 ans au moins. Celui qu'on reprend lâche son travail : dites-le, et laissez les joueurs le confier. Les morts s'inscrivent d'eux-mêmes sur l'autel du groupe ; ajoutez-y les PNJ légers qui tombent. Un mort relevé en Livide doit être retrouvé avant le repos : c'est une scène.` },
  { cle: "marche", titre: "Le marché", texte: `Le marché est l'endroit où toutes les communautés se croisent : c'est là que l'île d'après se voit vivre, et que les préjugés s'entendent le plus. Faites-le naître lentement, au rythme de la partie (le détail est dans le journal **Le marché et le Ladi Lafé**).

- **Au début, le troc.** De la main à la main : une boîte de cartouches contre un sac de riz, à la barrière d'un abri. Utilisez le **cours** (onglet Marché de la fenêtre du MJ) pour dire si l'échange est juste ; le système ne fait que compter.
- **Puis la boutique.** Un commerçant est resté dans son quartier (Madame Thiaw-Kine, à la Rivière Saint-Louis) : ouvrez sa boutique et son **carnet**. Le groupe prend à crédit, rend plus tard ; une dette qui traîne un mois nourrit le Ladi Lafé tout seul, et le carnet se solde au Nouvel An chinois.
- **Puis le marché forain**, quand deux communautés au moins vivent dans la région et qu'une route est ouverte : un jour fixe, un terrain à personne, un conseil avec une voix par bastion, un cours affiché, une **trêve**. Les jours de marché tombent d'eux-mêmes ; tirez un **événement de marché** et jouez-le.
- **La foire**, une fois l'an, autour d'une récolte : ouvrez-la pour trois jours ; sa récolte vaut moitié moins ce jour-là.

**Les gens du marché** viennent de toutes les communautés, et aucun rôle n'est réservé à une origine. Donnez-leur une voix, des manies, et leurs **préjugés**. Le système ne connaît l'origine de personne : c'est vous qui dites quel préjugé du marchand s'éveille devant tel survivant (souvent à tort : on est métis). Le préjugé pèse sur la **première confiance** (prix majoré, crédit refusé, un dé de moins à la parole) et **s'use** : trois échanges honnêtes, une fête partagée, un démenti vu de ses yeux. **Démentez chaque préjugé par les faits**, devant tout le monde, dans le ton d'une kour : on se chambre, on se méfie, et on finit par partager le cari. Jamais le jeu ne donne raison à un préjugé.

**Le Ladi Lafé** dit la réputation des autres. Il peut mentir, et des gens malveillants le font mentir. Tenez au secret ce qui est vrai ; laissez les joueurs chercher la preuve (une marque, un témoin, un fait). Une rumeur fausse démentie se retourne contre celui qui l'a lancée ; celui qui colporte du mal, même vrai, n'en sort pas grandi.

**Accueillir le marché** est un choix d'enracinement : réputation auprès des bastions, mais bruit, lumière et monde chaque semaine. Rappelez le prix quand la visibilité monte.` },
  { cle: "factions", titre: "Les factions en jeu", texte: `Les factions ne sont pas des méchants de service : chacune a de bonnes raisons. Faites-les **grandir** pendant la panique et l'effondrement, **occuper** les abris abandonnés, **se disputer** les régions. Un groupe qui les aide gagne de la réputation et ce qu'elle ouvre (troc, refuge, savoir enseigné) ; un groupe qui les trahit le paie.` },
  { cle: "gens-de-l-ile", titre: "Les gens de l'île", texte: `La Réunion est une île de **métissage**, et c'est une fierté. Faites-la vivre : une foule, une file de réfugiés, un marché des Ferrailleurs mélangent toujours plusieurs visages, et beaucoup de gens sont un peu de tout à la fois.

# Qui l'on croise

- **Cafres** : descendants des esclaves et engagés d'Afrique de l'Est et de Madagascar, la plus grande part de l'île.
- **Yabs, petits blancs des Hauts** : créoles blancs des Hauts (Cilaos, Plaine des Cafres, Salazie, Le Tampon), descendants des colons pauvres ; **gros blancs** : les vieilles familles de planteurs.
- **Zoreils** : les métropolitains installés, ou de passage, et coincés là depuis le jour zéro.
- **Malbars** : Tamouls hindous, descendants des engagés venus après 1848 ; temples, marche sur le feu, Cavadee, Dipavali.
- **Z'arabes** : musulmans venus du Gujarat, commerçants, la mosquée de Saint-Denis ou de Saint-Pierre.
- **Chinois** (Sinwa) : Cantonais et Hakkas, la boutique du quartier et son carnet de crédit, le Nouvel An.
- **Malgaches**, **Comoriens** et **Mahorais** : les uns anciens, les autres arrivés les derniers.
- **Métis** : presque tout le monde, un peu.

Les noms disent souvent l'origine, pas toujours : Hoarau, Payet, Técher, Grondin (créoles de vieille souche) ; Narayanin, Moutoussamy (malbars) ; Patel, Omarjee (z'arabes) ; Ah-Hong, Thiaw-Kine (chinois) ; Rakotomalala (malgache) ; Ahamada, Saïd, Madi (comoriens) ; Lefèvre, Martin (zoreils). La table des noms réunionnais les mélange.

# Les préjugés

Chaque communauté en a sur les autres, et sur elle-même, et la fin du monde les fait remonter : le Zoreil donneur de leçons, « *i prend tout' bann bon travay* » (il prend tous les bons postes) ; le Chinois de la boutique, « *i res' ant' zot* » (ils restent entre eux), qui ne ferait crédit qu'aux siens ; le Z'arabe dur en affaires ; le « service » malbar qui fait peur à ceux qui ne le connaissent pas ; le « *yab kouyon* » (le petit blanc niais) des Hauts qui ne descend jamais ; les gros blancs, « *i gard' la terre* » (ils gardent la terre) ; les derniers arrivés de Mayotte et des Comores, accusés de tout. Et, dans la bouche d'un personnage qu'on doit contredire, la vieille rengaine raciste des Cafres paresseux.

Trois règles :

- **Les préjugés sont portés par des personnages**, jamais par le narrateur ni par les règles. Un PNJ peut les dire, les penser, s'en servir pour refuser ou accorder sa confiance, demander un prix pour entrer au groupe.
- **Le jeu ne les confirme jamais.** Aucune communauté n'est associée au crime ou au danger ; les pillards, les Sans-Lune et les menteurs viennent de partout. Quand un préjugé est mis à l'épreuve, il tombe : le Zoreil « qui ne sait rien » connaît la radio, la boutique chinoise a nourri tout le quartier, le Yab « arriéré » sait passer l'hiver, les derniers arrivés n'ont pas volé le riz.
- **Le ton est celui d'une kour**, plus *kozman* et moucatage (on se chambre) que haine : on se méfie, on se dispute, et on finit quand même par partager le cari. Pas d'insulte gratuite, aucun mot qui blesse plus qu'il ne raconte.

Les événements du camp (le carnet de la boutique, un service dans la nuit, le Zoreil qui veut tout organiser, les derniers arrivés, le cari qu'on partage, la terre du gros blanc), les imprévus et les prix des recrues mettent ces regards en jeu. Les fêtes aussi : chaque fête a sa communauté au premier plan, et tout le monde vient voir. Au marché, huit événements démentent chacun un préjugé devant tout le monde (journal « Le marché et le Ladi Lafé »).

# Pour le MJ IA

Quand vous décrivez quelqu'un, donnez son apparence en clair (teint, cheveux, traits) plutôt que « un Réunionnais » ; variez les visages d'une scène à l'autre ; faites parler un PNJ avec ses préjugés quand ça sert la scène, puis laissez les faits le contredire. Les origines des personnages nommés sont dans leurs notes.` }
] });

// ================================================================ Chronologie de la crise (MJ)
const CHRONOLOGIE = journal({ cle: "chronologie-de-la-crise", nom: "Chronologie de la crise", pack: "mj", pages: [
  { cle: "avant", titre: "Avant le jour zéro", texte: `Personne ne sait d'où vient le Gris. Quelques jours avant le jour zéro, des cas de « fièvre grise » sont signalés à bord d'un navire au large et dans un hôpital de l'île ; les autorités parlent d'une intoxication. Les malades meurent en un jour ou deux. Ils ne restent pas morts.

(Au MJ de décider s'il révèle un jour l'origine. Le contenu ne la fixe pas, volontairement.)` },
  { cle: "jour-zero", titre: "Jour zéro (jours 0 et 1)", texte: `- Les premiers morts se relèvent aux urgences de Saint-Denis et de Saint-Pierre, dans des maisons, dans des voitures.
- Les réseaux marchent tous ; le téléphone sature dès le soir.
- Embouteillages monstres vers l'aéroport et vers les Hauts ; accidents sur la RN1 et la RN2.
- Les autorités demandent de rester chez soi, parlent d'un « malaise collectif ».
- Les Hauts, les cirques et Mafate n'ont encore rien vu.` },
  { cle: "panique", titre: "Panique (jours 2 à 6)", texte: `- Couvre-feu, barrages, rotations d'avions et de bateaux pour ceux qui ont des billets, puis plus de rotations.
- Pillages des supermarchés et des stations-service ; files de réfugiés vers les Hauts.
- Premières coupures locales ; la radio officielle tourne en boucle.
- Naissance de la Garnison du Quai (les forces repliées sur le port) et des Sans-Lune (pillages nocturnes à Saint-Denis).
- Coureurs dans les rues : les morts récents courent encore.` },
  { cle: "effondrement", titre: "Effondrement (jours 7 à 20)", texte: `- L'électricité, l'eau courante, le carburant, le téléphone tombent région par région, chacune dans sa fenêtre (voir les régions). L'Est, avec ses centrales hydrauliques, garde du courant plus longtemps ; Mafate ne le perd jamais (panneaux).
- Les villes sont grouillantes ; des **hordes** naissent dans les régions à forte infestation et suivent le bruit le long des routes.
- La Coopérative des Plaines, les Barques du Sud, les Ferrailleurs, le Dispensaire, les Pèlerins de la Lave et les Familles des Îlets s'organisent.` },
  { cle: "silence", titre: "Silence (jours 21 à 59)", texte: `- Plus d'autorité, sinon celle qu'on prend. Les factions se disputent les régions et occupent les abris abandonnés.
- Les hordes errent ; les premiers Livides des Bas commencent à se défaire dans la chaleur.
- Les Hauts se remplissent de réfugiés… qui meurent et se relèvent dans le froid, où ils durent.
- Cyclones possibles (saison des pluies) ; éruption possible de la Fournaise.` },
  { cle: "apres", titre: "L'après (jour 60 et plus)", texte: `- La chaleur humide des Bas décompose les Livides : le littoral se vide d'eux en quelques mois.
- Les bandes humaines dominent le littoral : Sans-Lune au nord, Ferrailleurs à l'ouest, Garnison au Port, Barques au sud.
- Les Hauts et les cirques gardent leurs vieux Livides, lents, nombreux, figés par le froid de l'hiver austral et réveillés par le soleil.
- Les groupes qui ont choisi l'autonomie deviennent les nouveaux villages de l'île — et les nouvelles cibles.` }
] });

// ================================================================ Pourquoi les Bas se vident (MJ)
const POURQUOI = journal({ cle: "pourquoi-les-bas-se-vident", nom: "Pourquoi les Bas se vident", pack: "mj", pages: [
  { cle: "twist", titre: "La règle du monde", texte: `**La chaleur humide décompose les Livides. Le froid les conserve.**

Dans les Bas (sous 400 m environ), l'été austral est une étuve : trente degrés, une humidité qui ne retombe pas, des insectes partout. Un Livide y pourrit en quelques semaines, en quelques mois au plus : ses muscles lâchent, il tombe, il ne se relève plus. À partir du deuxième mois, l'infestation du littoral **décroît** chaque jour.

Dans les Hauts et les cirques, il fait frais, parfois froid ; il gèle en hiver au-dessus de 1 500 m. Les Livides s'y dessèchent au lieu de pourrir : ils deviennent les **Livides des Hauts**, lents, raides, presque impossibles à arrêter d'un coup, et ils durent des années.` },
  { cle: "consequences", titre: "Ce que ça change", texte: `- **Au début**, les Hauts paraissent sûrs : peu de monde, donc peu de morts. Tout le monde y monte. Le littoral est l'enfer.
- **Des mois plus tard**, le littoral se vide de Livides mais se remplit de **bandes humaines** qui s'y battent pour ce qui reste. Les Hauts gardent leurs morts, et ceux de tous les réfugiés qui y sont montés.
- Le « meilleur endroit » change donc avec le temps : c'est le moteur des déménagements.

**Comment le révéler.** Ne l'annoncez pas. Laissez les joueurs le découvrir : des corps effondrés dans les rues de Saint-Paul en février, un Livide figé de givre au bord de la route de la Plaine des Cafres en juillet, une remarque de la docteure du Dispensaire (« ils ne tiennent pas la chaleur »), une rumeur à la radio. Un groupe qui comprend la règle peut l'exploiter : descendre au bon moment, attirer une horde vers les Bas en été.` }
] });

// ================================================================ Factions (MJ)
const FACTIONS_J = journal({ cle: "factions", nom: "Les factions de Fénoir", pack: "mj", pages: FACTIONS.map(f => ({ cle: f.cle, titre: f.nom, texte: `${sansBalises(f.description)}

- **Attitude de départ** : ${f.attitude}. **Régions** : ${f.regionsDepart.map(nomRegion).join(", ")}.
- **Qui commande** : ${f.chef}.
- **À quoi on les reconnaît** : ${f.signe}.
- **Ce qu'ils veulent** : ${sansBalises(f.veulent)}
- **Comment traiter avec eux** : ${sansBalises(f.traiter)}` })) });

const REPUTATIONS_J = journal({ cle: "reputations", nom: "Réputation auprès des factions", pack: "mj", pages: [{ cle: "paliers", titre: "Paliers et horloges", texte: texteReputations() }] });

// ================================================================ Bestiaire (MJ)
const BESTIAIRE_J = journal({ cle: "bestiaire", nom: "Bestiaire de Fénoir", pack: "mj", pages: [
  { cle: "regles", titre: "Combattre", texte: `Chaque succès de combat ou de tir ôte 1 de **résistance** à une créature ; à 0, elle est hors d'état (un Livide ne l'est vraiment que le crâne détruit). Chaque créature encore debout attaque avec ses **dés** : un 6 touche (1 blessure) ; pour un Livide, un second 6 au dé de morsure, c'est une morsure. Tirer fait du bruit. Fuir est souvent la meilleure option.` },
  ...BESTIAIRE.map(b => ({ cle: b.cle, titre: b.nom, texte: `${sansBalises(b.description)}

- **Dés d'attaque** : ${b.des} — **résistance** : ${b.resistance} — **vitesse** : ${b.vitesse} — **sens** : ${b.sens}.
- **Comportement** : ${sansBalises(b.comportement)}
- **Faiblesse** : ${sansBalises(b.faiblesse)}` }))
] });

// ================================================================ Scénario d'ouverture « Jour zéro » (MJ)
const JOUR_ZERO = journal({ cle: "jour-zero", nom: "Scénario d'ouverture — Jour zéro", pack: "mj", pages: [
  { cle: "principe", titre: "Le premier jour", texte: `Une soirée pour lancer la campagne. Chaque personnage commence **là où son passé le place** au matin du 4 décembre, un vendredi de saison des pluies, et l'objectif de la séance est simple : **se retrouver**, ou trouver les autres, et passer la première nuit à l'abri.

**Structure.** Trois temps : *ce matin-là* (une scène courte par personnage, dans sa région), *la bascule* (l'après-midi, quand les morts se relèvent partout), *la nuit* (le groupe réuni quelque part, ou en route). Si les personnages sont loin les uns des autres, le téléphone marche encore : ils peuvent s'appeler, se donner rendez-vous. Le réseau sature à la tombée de la nuit.

**Ce que le système fait.** Démarrez la partie (région de départ du groupe : celle du lieu de rendez-vous), avancez par quarts. Le jour zéro, presque tout marche ; laissez les joueurs le sentir avant que ça ne marche plus.` },
  { cle: "depart-saint-denis", titre: "Départ — Saint-Denis : la garde de nuit", texte: `**Pour** : infirmière, ambulancier, étudiante, toute personne en ville.

*Ce matin-là.* Fin de garde aux urgences de Bellepierre : un patient « décédé » à trois heures du matin a mordu un brancardier. On a mis ça sur le compte d'un réflexe. À sept heures, le brancardier a de la fièvre.

*La bascule.* À midi, les urgences débordent ; à quinze heures, le premier mort se relève dans la salle d'attente. Les portes se ferment de l'intérieur.

*Choix.* Rester soigner (le Dispensaire naîtra de ceux qui restent), fuir par les parkings, emmener un collègue mordu. Lieu de rendez-vous possible : la caserne de La Montagne, au-dessus de la ville, ou une case du Brûlé.` },
  { cle: "depart-ouest", titre: "Départ — La côte Ouest : le grand beau temps", texte: `**Pour** : électricien, pêcheur, prof de SVT, toute personne de l'Ouest.

*Ce matin-là.* Il fait beau, terriblement beau. Le pêcheur rentre au port de Saint-Gilles, l'électricien est sur un toit, la prof surveille la récréation au collège sur la colline.

*La bascule.* La route des Tamarins se fige ; des gens courent entre les voitures. Le collège annonce le confinement ; à seize heures, des parents ne viennent pas chercher leurs enfants.

*Choix.* Le collège devient un abri plein d'enfants (dilemme dès le premier soir), ou la case de Bellemène avec sa citerne, ou le catamaran au mouillage.` },
  { cle: "depart-port", titre: "Départ — Le Port : le dernier cargo", texte: `**Pour** : mécanicien, retraité de la marine, gendarme.

*Ce matin-là.* Le garage ouvre ; le marin écoute sa radio. Un cargo attend au large : on ne le laisse pas accoster, il y aurait des malades à bord.

*La bascule.* La rumeur dit que le cargo évacuera des civils. Une foule converge vers le port ; les dockers ferment les grilles ; des coups de feu. Les premiers brassards orange apparaissent.

*Choix.* Entrer dans le port (et devenir de la Garnison), aider la foule, ou partir vers La Possession et le lit de la Rivière des Galets, porte de Mafate.` },
  { cle: "depart-cilaos", titre: "Départ — La route de Cilaos : le car jaune", texte: `**Pour** : chauffeur de car, guide de canyon, toute personne qui monte ou descend.

*Ce matin-là.* Le car jaune quitte Saint-Louis à neuf heures, plein. Le guide est au fond d'un canyon avec quatre clients.

*La bascule.* À mi-route, dans les virages, un passager du fond s'effondre, puis se relève. Le car s'arrête au bord du vide.

*Choix.* Continuer jusqu'à Cilaos avec ce qu'on a à bord, redescendre vers une ville qui hurle, ou abandonner le car et monter à pied. La nuit tombe vite dans le cirque ; un éboulis peut fermer la route derrière eux.` },
  { cle: "depart-hauts", titre: "Départ — La Plaine des Cafres : le lait qui ne descend pas", texte: `**Pour** : agricultrice, apiculteur, toute personne des Hauts.

*Ce matin-là.* Le camion de collecte du lait ne passe pas. Le brouillard monte à midi.

*La bascule.* Le chauffeur est retrouvé au bord de la route, dans sa cabine, cognant à la vitre. Les voisins appellent : leur fils est rentré de Saint-Pierre avec une morsure.

*Choix.* Rester à la ferme (une voie d'autonomie toute prête), aller chercher quelqu'un en bas, rejoindre les voisins qui parlent déjà de « se regrouper » (la Coopérative des Plaines).` },
  { cle: "depart-est", titre: "Départ — L'Est : la pluie", texte: `**Pour** : planteur, ambulancier, toute personne de l'Est.

*Ce matin-là.* Il pleut à verse depuis l'aube ; les radiers débordent ; on reste chez soi, ce qui en sauve beaucoup.

*La bascule.* Un voisin sort des cannes en titubant. L'ambulance enchaîne les morsures. La rivière en crue emporte un pont.

*Choix.* Se retrancher à la sucrerie de Bois-Rouge, monter à Salazie avant que la route ne tombe, ou rejoindre l'église de Sainte-Rose où un catéchiste rassemble les gens.` },
  { cle: "depart-mafate", titre: "Départ — Mafate : rien ne se passe", texte: `**Pour** : habitant d'un îlet, randonneur, guide.

*Ce matin-là.* Rien. Le soleil, les cabris, l'école, la radio qui parle d'un « malaise » en ville.

*La bascule.* Le lendemain, des randonneurs descendent du Maïdo en racontant ce qu'ils ont vu en bas ; l'un d'eux a été mordu « par un fou » sur le parking.

*Choix.* Accueillir les randonneurs ou les retenir au col ; descendre chercher de la famille en bas ; garder les sentiers. C'est le départ le plus lent, et le plus terrible quand le premier malade arrive.` },
  { cle: "nuit", titre: "La première nuit", texte: `Terminez la séance quand le groupe est réuni à l'abri (ou décide de passer la nuit en route). Faites le premier **bilan** avec le système : stocks, ce que produit le site, ce qui manque. Posez la question qui lancera la campagne : *on reste, ou on part ?*

Tirez une rumeur de la radio pour la fin : les joueurs s'endorment sur une voix qui dit une chose qu'ils voudront vérifier.` }
] });

// ================================================================ One-shot (MJ)
const ONE_SHOT = journal({ cle: "one-shot-la-pharmacie-de-l-entre-deux", nom: "One-shot — L'insuline de l'Entre-Deux", pack: "mj", pages: [
  { cle: "accroche", titre: "L'accroche", texte: `Une soirée, une expédition. **Jour 25**, phase de silence. Le groupe vit dans un abri du Tampon (la ferme de la Plaine des Cafres ou un collège du Quatorzième). L'enfant d'une famille alliée est diabétique ; il reste trois jours d'insuline. La radio a parlé d'un pharmacien de l'Entre-Deux, barricadé chez lui avec une glacière alimentée par des panneaux.

**Objectif** : aller à l'Entre-Deux, trouver le pharmacien, ramener l'insuline — et revenir avant que la glacière ou l'enfant ne lâche.` },
  { cle: "route", titre: "La route", texte: `L'Entre-Deux est perché sur son éperon entre le Bras de la Plaine et le Bras de Cilaos : une seule route y monte. Deux options :
- **La route** (un quart en véhicule) : un embouteillage figé au carrefour, trois voitures « habitées », et un barrage de fortune tenu par deux adolescents armés d'un fusil de chasse qui exigent un péage.
- **Les sentiers du Dimitile** (deux quarts à pied) : plus discrets, mais un passage du sentier est emporté (test d'endurance ou matériel de canyon) et une troupe de Livides des Hauts somnole au soleil sur le replat.

Tirez une rencontre de la table « Rencontres — hauts » à mi-chemin.` },
  { cle: "pharmacien", titre: "Le pharmacien", texte: `Monsieur Nativel, soixante-dix ans, a transformé sa case créole en forteresse : barreaux, citerne, panneaux, et une glacière où dorment l'insuline et quelques vaccins. Il est seul depuis que sa femme « est partie » (elle est dans la chambre du fond, attachée au lit : il ne peut pas se résoudre).

Il donnera l'insuline à qui l'aide :
- à **finir ce qu'il ne peut pas faire** (sa femme) ;
- ou à **partir avec eux** (il est lent, il a besoin de sa glacière, il connaît la pharmacie de tout le Sud) ;
- ou contre **un bien précieux** (des panneaux, une batterie, des munitions).

Une bande de Sans-Lune descendus du Nord fouille le bourg pendant ce temps (visibilité, bruit).` },
  { cle: "retour", titre: "Le retour et la fin", texte: `Le retour se fait de nuit ou sous la pluie (tirez la météo). Si le groupe a fait du bruit, une petite horde suit. La glacière doit rester au frais : chaque quart passé au soleil compte.

**Fins possibles** : l'enfant est sauvé et la famille alliée devient une dette d'honneur ; le pharmacien rejoint l'abri (un soignant, un savoir, une bouche de plus) ; ou l'insuline arrive trop tard. Donnez une **marque** à chacun pour la scène la plus difficile, et 2 points de réputation auprès du Dispensaire si l'on rapporte les vaccins.` }
] });

// ================================================================ Campagne en fronts (MJ)
const CAMPAGNE = journal({ cle: "campagne-l-annee-du-gris", nom: "Campagne — L'année du Gris", pack: "mj", pages: [
  { cle: "principe", titre: "Une campagne en fronts", texte: `Une campagne d'environ un an de jeu, faite de **fronts** : des menaces qui avancent avec l'horloge, que les joueurs croisent, retardent ou laissent mûrir. Chaque front a une horloge (moteur MJ IA, type « front ») de six segments ; faites avancer un segment quand le temps passe sans que personne ne s'en occupe, ou quand les joueurs l'aggravent ; reculer quand ils agissent. À six, le **désastre** arrive.

Les fronts se croisent : laissez les joueurs choisir lequel combattre, et montrez ce que coûtent les autres.` },
  { cle: "front-comptable", titre: "Front 1 — Le Comptable", texte: `**Menace** : les Sans-Lune étendent leur tribut à tout le Nord, puis vers l'Est et l'Ouest.
1. Des portes marquées à la bombe à Saint-Denis.
2. Un tribut exigé de chaque abri de Sainte-Marie.
3. Les Sans-Lune prennent un dépôt de carburant.
4. Ils s'allient avec un groupe de la Garnison (déserteurs).
5. Ils attaquent un abri autonome connu, pour l'exemple.
6. **Désastre** : le Comptable tient toute la côte nord ; tout abri du littoral paie ou brûle.
*Leviers* : le jeune des Sans-Lune qui veut partir ; la liste du Comptable ; la Garnison qui le craint.` },
  { cle: "front-garnison", titre: "Front 2 — L'autorité provisoire", texte: `**Menace** : la Garnison du Quai veut « recenser » et « réquisitionner » toute l'île.
1. Contrôles sur la route du Littoral.
2. Recensement des abris de l'Ouest.
3. Réquisition des soignants et des électriciens.
4. Un convoi armé monte vers les Hauts prendre le lait de la Coopérative.
5. La Garnison prend la centrale de la Rivière de l'Est.
6. **Désastre** : un régime de fer, qui protège et qui opprime ; plus de liberté, ou la guerre.
*Leviers* : la commandante Hoarau croit vraiment bien faire ; ses soldats sont fatigués ; un cargo pourrait vraiment venir.` },
  { cle: "front-hauts", titre: "Front 3 — Les Hauts froids", texte: `**Menace** : l'hiver austral rassemble les Livides des Hauts en troupes immenses, figées la nuit, réveillées le jour.
1. Des Livides figés de givre au bord des routes (juin).
2. Une troupe descend la route des Plaines.
3. Une ferme de la Coopérative tombe.
4. La troupe encercle Bourg-Murat.
5. Elle descend vers Le Tampon au premier jour chaud.
6. **Désastre** : la plus grande horde de l'île, lente et inarrêtable, sur la route de Saint-Pierre.
*Leviers* : le froid de la nuit (on passe entre eux à l'aube) ; la chaleur des Bas qui les défera s'ils y descendent… avec tout ce qu'ils écraseront en chemin.` },
  { cle: "front-fournaise", titre: "Front 4 — La Fournaise", texte: `**Menace** : le volcan se réveille.
1. Les géologues de Bourg-Murat enregistrent des séismes.
2. Le sol se gonfle ; les Pèlerins prêchent l'épreuve.
3. Une fissure s'ouvre dans l'Enclos.
4. La coulée descend vers le Grand Brûlé.
5. Elle coupe la route des Laves.
6. **Désastre** : une éruption hors Enclos menace Saint-Philippe ou Sainte-Rose, et les Pèlerins refusent de partir.
*Leviers* : le tunnel de lave aménagé (refuge ou piège) ; les Barques du Sud (évacuation par la mer).` },
  { cle: "front-remede", titre: "Front 5 — Le remède", texte: `**Menace** : la docteure Soundirassen croit tenir une piste… et elle a besoin de cobayes.
1. Elle demande des Livides entiers.
2. Elle demande des infectés vivants.
3. Un enfant mordu ne s'est pas transformé : elle le veut.
4. Les Pèlerins apprennent ce qu'elle fait.
5. Les Pèlerins marchent sur l'hôpital.
6. **Désastre** : le Dispensaire brûle, ou le remède échoue en tuant ceux qu'il devait sauver — ou il marche, à moitié, et tout le monde le veut.
*Le contenu ne fixe pas la vérité sur le Gris : à vous de décider si ce front mène quelque part.*` }
] });

// ================================================================ Le marché et le Ladi Lafé (MJ)
// Le marché en quatre stades, le carnet, le conseil et sa trêve, les foires, le cours, les préjugés et leurs démentis, les gens
// du marché, la rumeur, les objets marqués, les oratoires rouges (contenu/marche.mjs ; logique marche.mjs ; docs/metissage.md).
const nomCommunaute = cle => COMMUNAUTES.find(c => c.cle === cle)?.nom ?? (cle === "metis" ? "métis" : cle);
const JOURS_SEMAINE = ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"];
const MOIS = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];
const NOMS_RESSOURCES = { eau: "eau", nourriture: "nourriture", plantes: "plantes (zerbaz)", graines: "graines", materiaux: "matériaux", munitions: "munitions", pieces: "pièces", carburant: "carburant", medicaments: "médicaments" };
const nomFaction = cle => FACTIONS.find(f => f.cle === cle)?.nom ?? cle;
const EVENEMENTS_MARCHE = EVENEMENTS.filter(e => e.type === "marche");
// Un texte HTML du registre remis en texte brut, sans l'espace que laisse une balise avant une virgule ou un point.
const brut = h => sansBalises(h).replace(/ ([,.])/g, "$1");

const LE_MARCHE = journal({ cle: "le-marche-et-le-ladi-lafe", nom: "Le marché et le Ladi Lafé", pack: "mj", pages: [
  { cle: "stades", titre: "Les quatre stades", texte: `Le marché se met en place au fil de la partie. Troc seulement : **pas de monnaie**. Le système suit chaque stade (fenêtre du MJ, onglet **Marché**) ; vous racontez.

- **1. Le troc de la main à la main**, dès le premier jour : deux personnes échangent, sans lieu ni règle. Le cours dit si c'est juste ; rien n'oblige à le suivre.
- **2. La boutique**, quand un commerçant PNJ est resté dans son quartier et a de quoi tenir : un point d'échange fixe, avec son **carnet de crédit**. C'est ce qui remplace la monnaie.
- **3. Le marché forain**, quand plusieurs communautés vivent dans la même région (le groupe compris) et qu'une route est ouverte entre elles : un jour fixe par semaine, un terrain qui n'est à personne, un **conseil du marché** avec une voix par bastion, un cours affiché, des litiges réglés, une **trêve** dans son périmètre.
- **4. La foire**, une fois par an, autour d'une récolte : les bastions de plusieurs régions se retrouvent pour trois jours, sous trêve.

Un abri peut **accueillir** le marché forain : chaque mois de marché tenu (quatre jours de marché) lui vaut **1 point de réputation** auprès de chaque bastion qui y vient ; mais sa signature grandit : **+3 bruit** chaque jour de marché, **+2 visibilité** tant qu'il l'accueille (du monde, des lumières, des allées et venues).` },
  { cle: "boutique", titre: "La boutique et son carnet", texte: `Le **carnet de crédit** est un cahier : on y écrit ce que chacun prend, au cours du jour, en **parts**. On prend aujourd'hui, on rend plus tard, en n'importe quels biens, au cours du jour où l'on rend ; les dettes les plus anciennes se soldent d'abord.

- **Plafond** : 10 parts par débiteur ; +5 par Nouvel An où il a tout rendu (au plus 30). La moitié si le tenancier se méfie (un préjugé de poids 1, ou une faction neutre) ; rien s'il refuse.
- **Une dette qui traîne** (30 jours, ou passée le Nouvel An chinois) arrête le crédit, et nourrit le **Ladi Lafé** : une rumeur vraie court sur le débiteur (une fois par dette). Elle pèse sur la première confiance de qui l'a entendue, jusqu'à ce qu'elle s'éteigne (90 jours).
- **Le Nouvel An chinois** solde le carnet : une dette rendue en entier sort du carnet et la parole du débiteur grandit ; une dette encore due reste, et traîne. Le tenancier peut **effacer** des dettes (après un cyclone, un deuil) : c'est son choix, et toute l'île s'en souvient.

Le carnet est public : on l'ouvre devant tout le monde, et les joueurs voient le leur sur le tableau de bord.` },
  { cle: "forain", titre: "Le marché forain, son conseil et sa trêve", texte: `Un marché forain se tient un **jour fixe** de la semaine, sur un terrain qui n'est à personne (un carrefour, une place, un front de mer). Chaque bastion qui y vient a **une voix au conseil** ; le conseil affiche le cours (il peut l'ajuster d'une ou deux parts quand une denrée manque) et **tranche les litiges** à la majorité (à égalité : on partage).

**La trêve** : personne n'entre armé, personne ne frappe dans le périmètre. La rompre, c'est **3 points de réputation** de moins auprès de chaque bastion du conseil, une rumeur vraie qui court sur toute l'île pendant un an, et le marché fermé jusqu'à ce que le conseil la rétablisse.

Des marchés possibles :

${MARCHES.map(m => `- **${m.nom}** (${REGIONS.find(r => r.cle === m.region)?.nom ?? m.region}, le ${JOURS_SEMAINE[m.jourSemaine]}, ${m.lieu}) : ${brut(m.description)} Bastions : ${m.bastions.map(nomFaction).join(", ")}.`).join("\n")}` },
  { cle: "foires", titre: "Les foires de saison", texte: `Les foires agricoles d'avant sont devenues des **marchés de troc saisonniers, sous trêve**. Une foire dure trois jours ; sa récolte vaut moitié moins au cours ce jour-là, et l'on vient de plusieurs régions.

${FOIRES.map(f => `- **${f.nom}** (${MOIS[f.mois - 1]}, ${REGIONS.find(r => r.cle === f.region)?.nom ?? f.region}) : ${brut(f.description)}`).join("\n")}` },
  { cle: "cours", titre: "Le cours du troc", texte: `Le cours dit ce que vaut chaque bien en **parts** (une part = un jour de nourriture pour une personne). L'énergie ne se troque pas (des kWh dans des batteries ne passent pas de main en main).

${Object.entries(COURS_TEXTE).map(([r, v]) => `- **${NOMS_RESSOURCES[r]}** : ${v}`).join("\n")}

Il bouge avec la crise et la saison :
- pendant la panique et l'effondrement, les médicaments et les munitions valent une fois et demie plus ; le carburant aussi dès l'effondrement ;
- au silence, le carburant double et les pièces valent une fois et demie plus ; dans l'après, le carburant vaut deux fois et demie plus (il ne revient jamais), les graines aussi grimpent ;
- l'eau vaut moitié moins en saison des pluies, une fois et demie plus en saison sèche ;
- la récolte d'une foire vaut moitié moins ce jour-là.

Un troc est **juste** à une part ou à 10 % près. Un marchand demande la valeur reçue **majorée** selon sa première confiance (préjugés, rumeurs, réputation de sa faction).` },
  { cle: "prejuges", titre: "Les préjugés au marché", texte: `Le marché est l'endroit où toutes les communautés se croisent : c'est là que les préjugés s'entendent le plus. **Aucune origine ne donne de bonus ni de malus dans les règles.** Un préjugé est un **trait d'un PNJ**, jamais une propriété d'une communauté. Le système ne connaît l'origine de personne : c'est le MJ qui dit quel préjugé du PNJ s'éveille devant tel inconnu, souvent à tort (on est métis).

**La première confiance.** Le poids des préjugés en jeu (1 à 3 chacun, cumulés) plus les rumeurs défavorables qu'il a entendues, au plus 3 :
- **0** : prix au cours, crédit au plafond ;
- **1** : prix majoré d'un quart, crédit à moitié, un dé de moins aux tests de parole avec lui ;
- **2** : prix majoré de moitié, crédit refusé, un dé de moins ;
- **3** : prix double, crédit refusé, deux dés de moins.

**L'usure.** Un préjugé perd un cran tous les **trois échanges honnêtes** avec quelqu'un qu'il vise, à chaque **fête partagée**, et chaque fois que **les faits le démentent** sous ses yeux. À zéro, il est tombé : le PNJ ne le dit plus, ou plus devant vous.

**Le joueur qui s'en sert** (pour refuser quelqu'un à la porte, pour faire baisser un prix, pour colporter) se paie : ses voisins s'en souviennent, et sa réputation aussi.

**Le jeu dément chaque préjugé par les faits**, dans le ton d'une kour : on se chambre, on se méfie, et on finit par partager le cari. Ce qui se dit, et ce que le jeu montre :

${MARCHANDS.map(m => `- ${m.onDit} — **${m.nom}** : ${m.dementi}`).join("\n")}` },
  { cle: "gens", titre: "Les gens du marché", texte: `Ils viennent de toutes les communautés ; aucun rôle n'est réservé à une origine. Chacun porte ses propres préjugés : chacun en a sur chacun. Créez-en l'acteur depuis la fenêtre du MJ (onglet Marché) pour qu'il porte ses préjugés.

${MARCHANDS.map(m => `**${m.nom}** — ${m.role} (${REGIONS.find(r => r.cle === m.region)?.nom ?? m.region} ; ${nomCommunaute(m.communaute)}). ${m.apparence} ${brut(m.description)} *Ses préjugés* : ${m.prejuges.map(p => `${p.dit} (sur : ${nomCommunaute(p.cible)})`).join(" ; ")}.`).join("\n\n")}` },
  { cle: "ladi-lafe", titre: "Le Ladi Lafé", texte: `**Ladi Lafé**, en créole, « il a dit qu'il a fait » : la rumeur. C'est par elle qu'on connaît la réputation des autres, et que les autres connaissent la vôtre, avant de vous avoir vus.

- **Elle peut être fausse**, et des gens malveillants la font mentir exprès. Le système garde au secret ce qui est vrai, qui l'a lancée et pourquoi ; les joueurs n'entendent que ce qui se dit.
- **Elle pèse** : chaque rumeur défavorable encore vivante sur quelqu'un compte dans la première confiance de qui l'a entendue. Elle s'éteint en 90 jours (un an pour une trêve rompue).
- **Elle tombe sur une preuve** : une marque sur l'objet, un témoin, un fait. Une rumeur vraie ne se dément pas : le jeu dit vrai. Une rumeur fausse et malveillante démentie se retourne contre son auteur : une rumeur vraie court alors sur lui.
- **Colporter du mal a un coût**, que la rumeur soit vraie ou non : on se souvient de celui qui l'a dite.
- Les réputations des factions passent aussi par elle : voyez « Réputation auprès des factions ».

Tables : « Marché — ce qui se dit (le Ladi Lafé) », avec la vérité entre crochets, et « Générateur — rumeur de bouche à oreille ».` },
  { cle: "marques", titre: "Les objets marqués", texte: `Chaque communauté peut **marquer ses biens** : trois encoches, un letchi gravé, une croix de peinture rouge. Le groupe choisit son **signe** (onglet Marché) et marque ses objets (poinçon de marque).

- Un objet marqué **se prouve et se réclame** : la marque tranche.
- Sans marque, les **témoins** ; sans témoins, **parole contre parole** : le conseil du marché décide, ou un test de parole opposé.
- **Le voisin qui ment.** Quand le groupe rend un objet trouvé, un voisin peut mentir et dire qu'il est à lui. Un mensonge démenti par une marque ou un témoin **se sait** : une rumeur vraie court sur le menteur.` },
  { cle: "oratoires", titre: "Les oratoires rouges", texte: `Au bord des routes de l'île, de petits oratoires peints en rouge, dédiés à saint Expédit : une statuette, des bougies, des fleurs en plastique, des ex-voto. Depuis le jour zéro, on y laisse des **messages** pliés sous une pierre, pour les groupes qui ne se croisent jamais : un rendez-vous, une offre de troc, un avertissement, un nom qu'on cherche.

Personne n'y touche, par respect ou par crainte ; certains y voient la protection du saint, d'autres une habitude ; le jeu ne dit rien de plus. Le groupe peut y laisser un message (le MJ le fera trouver par qui passe) et y lire ceux des autres (table « Oratoires rouges — messages »).` },
  { cle: "evenements", titre: "Les événements de marché", texte: `Un jour de marché, tirez un événement de marché selon le stade (onglet Marché de la fenêtre du MJ ; la simulation du monde ne les tire jamais). Jouez-le, puis, s'il dément un préjugé, appliquez le démenti : le préjugé perd un cran chez les PNJ qui le portent.

${EVENEMENTS_MARCHE.map(e => `- **${e.nom}**${e.effets?.dementi ? ` (dément un préjugé sur : ${nomCommunaute(e.effets.dementi)})` : ""}`).join("\n")}` }
] });

export const JOURNAUX = [GUIDE_JOUEUR, REGIONS_DE_L_ILE, FETES, TEMPS_DE_L_ILE, GUIDE_MJ, CHRONOLOGIE, POURQUOI, FACTIONS_J, REPUTATIONS_J, BESTIAIRE_J, JOUR_ZERO, ONE_SHOT, CAMPAGNE, LE_MARCHE];
export const CLE_JOURNAL_REGIONS = "regions-de-l-ile";
