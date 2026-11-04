// Les traits de caractère (contrat §10.1) : noms et textes originaux. effets :
//   competences: { cle: ±n } (niveaux, au départ) ; moral: ±n (moral de base) ; fatigue: ±n (fatigue de plus par jour d'effort) ;
//   peur: { lieu: "souterrain" | "nuit" | "foule" | "mer" | "hauteur", malus } ; besoins: { nourriture: facteur, eau: facteur } ;
//   taches: { tache: ±n } (bonus de dés à la tâche du jour) ; social: { seuil, moral } (moral quand le groupe dépasse le seuil) ;
//   special: clé d'un effet que la logique ou le MJ applique (voir docs/survie-notes-contenu.md).
// incompatibles : symétriques (vérifié par le fabricant) ; poids : fréquence au tirage.
import { html } from "./aides.mjs";

function trait({ cle, nom, description, effets = {}, incompatibles = [], poids = 1, incapacites = [] }) {
  return { cle, nom, description: html(description), effets: { competences: {}, moral: 0, fatigue: 0, peur: null, besoins: {}, taches: {}, social: null, special: "", ...effets }, incompatibles, incapacites, poids };
}

export const TRAITS = [
  trait({ cle: "doigts-de-terre", nom: "Doigts de terre", poids: 2, effets: { taches: { cultures: 1 } },
    description: `Tout ce qu'il plante prend racine. Il parle aux brèdes, et les brèdes l'écoutent.` }),
  trait({ cle: "sang-de-basalte", nom: "Sang de basalte", poids: 1, effets: { special: "nerfs-d-acier" }, incompatibles: ["coeur-d-artichaut"],
    description: `Quand tout s'effondre, il reste debout. Une fois dans sa vie de survivant, il ne craque pas à moral 0 : il serre les dents et continue.` }),
  trait({ cle: "main-qui-ne-frappe-pas", nom: "La main qui ne frappe pas", poids: 1, incapacites: ["violence"], effets: { moral: 1 }, incompatibles: ["brute-epaisse", "oeil-froid"],
    description: `Il ne lèvera la main sur personne, ni vivant ni Livide. Il soigne, il porte, il construit, il parle ; il ne tue pas. Sa paix intérieure rassure les autres.` }),
  trait({ cle: "peur-du-noir-sous-terre", nom: "Peur des voûtes", poids: 2, effets: { peur: { lieu: "souterrain", malus: 2 } }, incompatibles: ["rat-de-galerie"],
    description: `Sous une voûte de pierre ou de lave, il étouffe : −2 dés à tout dans les galeries et les tunnels de lave, et il refuse d'y dormir.` }),
  trait({ cle: "rat-de-galerie", nom: "Rat de galerie", poids: 1, effets: { taches: { chantier: 1 }, special: "souterrain-a-l-aise" }, incompatibles: ["peur-du-noir-sous-terre"],
    description: `Le noir, l'humidité, la roche au-dessus de la tête : il s'y sent chez lui. +1 dé aux chantiers souterrains, et il ne craint jamais une voûte.` }),
  trait({ cle: "leve-avant-le-coq", nom: "Levé avant le coq", poids: 2, effets: { taches: { garde: 1 }, special: "matin" }, incompatibles: ["oiseau-de-nuit"],
    description: `Debout à quatre heures, efficace jusqu'à midi, endormi à vingt heures. La garde de l'aube est la sienne.` }),
  trait({ cle: "oiseau-de-nuit", nom: "Oiseau de nuit", poids: 1, effets: { taches: { garde: 1 }, special: "nuit" }, incompatibles: ["leve-avant-le-coq"],
    description: `Il revit quand le soleil se couche : la garde de nuit ne lui pèse pas, mais il faut le secouer le matin.` }),
  trait({ cle: "ventre-sans-fond", nom: "Ventre sans fond", poids: 2, effets: { besoins: { nourriture: 1.5 } }, incompatibles: ["oiseau-de-rien"],
    description: `Il mange comme deux, et il a toujours faim : une ration et demie par jour.` }),
  trait({ cle: "oiseau-de-rien", nom: "Mange comme un oiseau", poids: 2, effets: { besoins: { nourriture: 0.75 } }, incompatibles: ["ventre-sans-fond"],
    description: `Une poignée de riz, un fruit, et il tient la journée : trois quarts de ration lui suffisent.` }),
  trait({ cle: "nuits-blanches", nom: "Nuits blanches", poids: 2, effets: { fatigue: 1, taches: { garde: 1 } },
    description: `Il ne dort pas, ou si peu. Il veille volontiers, mais la fatigue s'accumule : +1 fatigue un jour sur deux.` }),
  trait({ cle: "soleil-dedans", nom: "Soleil dedans", poids: 2, effets: { moral: 1 }, incompatibles: ["nuage-noir"],
    description: `Il trouve toujours quelque chose de beau : une mangue mûre, un lever de soleil sur le Piton des Neiges. Son moral de base est plus haut.` }),
  trait({ cle: "nuage-noir", nom: "Nuage noir", poids: 2, effets: { moral: -1 }, incompatibles: ["soleil-dedans"],
    description: `Il voit venir le pire et, souvent, il a raison. Son moral de base est plus bas ; ses avertissements, eux, sauvent des vies.` }),
  trait({ cle: "cuir-de-cabri", nom: "Cuir de cabri", poids: 2, effets: { special: "robuste" }, incompatibles: ["os-de-verre"],
    description: `Dur au mal : la première blessure de chaque combat ne lui coûte qu'une égratignure.` }),
  trait({ cle: "os-de-verre", nom: "Os de verre", poids: 1, effets: { special: "fragile" }, incompatibles: ["cuir-de-cabri"],
    description: `Tout lui fait mal, tout le blesse : chaque blessure reçue compte un cran de plus la première fois.` }),
  trait({ cle: "souffle-court", nom: "Souffle court", poids: 1, effets: { fatigue: 1, special: "asthme" },
    description: `Asthmatique : l'effort, la fumée, la poussière des chantiers lui coupent le souffle. +1 fatigue après une course, un chantier ou un incendie.` }),
  trait({ cle: "ame-de-pelerin", nom: "Âme de pèlerin", poids: 2, effets: { special: "fetes-religieuses" },
    description: `Il prie, il croit, à sa façon : chaque fête religieuse célébrée au camp lui rend 1 moral de plus. Les Pèlerins de la Lave le reconnaissent comme l'un des leurs.` }),
  trait({ cle: "loup-solitaire", nom: "Case à part", poids: 1, effets: { social: { seuil: 6, moral: -1 } }, incompatibles: ["coeur-de-kour"],
    description: `Trop de monde l'étouffe : au-delà de six personnes dans l'abri, il perd 1 moral par semaine. Seul en fouille, il est à son meilleur.` }),
  trait({ cle: "coeur-de-kour", nom: "Cœur de kour", poids: 2, effets: { social: { seuil: 6, moral: 1 }, competences: { parole: 1 } }, incompatibles: ["loup-solitaire"],
    description: `Il aime la cour pleine, les enfants qui courent, le cari pour vingt : plus le groupe est grand, mieux il se porte.` }),
  trait({ cle: "tete-de-bois", nom: "Tête de bois", poids: 2, effets: { special: "tetu" },
    description: `Quand il a décidé, rien ne le fait changer d'avis : il ne se laisse jamais convaincre par la parole d'un étranger… ni par celle de ses amis.` }),
  trait({ cle: "main-ouverte", nom: "Main ouverte", poids: 2, effets: { special: "genereux", moral: 0 }, incompatibles: ["doigts-crochus"],
    description: `Il donne sa ration à l'enfant, sa veste au réfugié, son temps à qui le demande. Le groupe l'aime ; les réserves un peu moins.` }),
  trait({ cle: "doigts-crochus", nom: "Doigts crochus", poids: 1, effets: { taches: { fouille: 1 }, special: "chapardeur" }, incompatibles: ["main-ouverte"],
    description: `Il ramène toujours quelque chose de plus de fouille… et il manque parfois quelque chose dans les réserves.` }),
  trait({ cle: "ancien-fumeur", nom: "Ancien fumeur", poids: 2, effets: { special: "manque" },
    description: `Il avait arrêté. Avec la peur, l'envie revient : sans tabac ni zamal pendant sept jours, −1 moral ; il échangerait beaucoup pour une cigarette.` }),
  trait({ cle: "oeil-froid", nom: "Œil froid", poids: 1, effets: { competences: { tir: 1 }, special: "sang-froid" }, incompatibles: ["main-qui-ne-frappe-pas", "mains-qui-tremblent"],
    description: `Sa main ne tremble pas : il ne perd jamais de dé de tir à cause de la peur ou d'un ami en danger.` }),
  trait({ cle: "mains-qui-tremblent", nom: "Mains qui tremblent", poids: 1, effets: { competences: { bricolage: -1 } }, incompatibles: ["oeil-froid", "touche-a-tout"],
    description: `Maladroit : les vis lui échappent, les clous se tordent, les outils glissent. −1 en bricolage.` }),
  trait({ cle: "touche-a-tout", nom: "Touche-à-tout", poids: 2, effets: { taches: { fouille: 1, atelier: 1 } }, incompatibles: ["mains-qui-tremblent"],
    description: `Débrouillard : il trouve, il bidouille, il fait marcher. +1 dé en fouille et à l'atelier.` }),
  trait({ cle: "bras-tendu", nom: "Bras tendu", poids: 2, effets: { special: "protecteur" },
    description: `Il se met toujours entre le danger et les plus faibles : une fois par combat, il peut prendre pour lui une attaque destinée à un autre.` }),
  trait({ cle: "brute-epaisse", nom: "Brute épaisse", poids: 1, effets: { competences: { combat: 1, parole: -1 } }, incompatibles: ["main-qui-ne-frappe-pas"],
    description: `Il frappe d'abord et parle ensuite, quand il parle. +1 en combat, −1 en parole.` }),
  trait({ cle: "coeur-d-artichaut", nom: "Cœur d'artichaut", poids: 1, effets: { moral: 0, special: "sensible" }, incompatibles: ["sang-de-basalte"],
    description: `Il s'attache à tout le monde, et chaque perte le brise : −2 moral au lieu de −1 à la mort d'un compagnon. Mais il sait consoler : +1 dé pour soigner le choc d'une perte.` }),
  trait({ cle: "creole-de-coeur", nom: "La langue de tout le monde", poids: 2, effets: { competences: { parole: 1 }, special: "langues" },
    description: `Créole, français, un peu de tamoul, de malgache ou de shimaoré : il parle à chacun dans sa langue, et on lui fait confiance plus vite.` }),
  trait({ cle: "jambes-de-cabri", nom: "Jambes de cabri", poids: 2, effets: { competences: { endurance: 1 }, special: "marcheur" }, incompatibles: ["vertige"],
    description: `Les sentiers de montagne ne lui font pas peur : en sentier, il compte un quart de moins sur les longs trajets (au moins un quart).` }),
  trait({ cle: "vertige", nom: "Vertige", poids: 1, effets: { peur: { lieu: "hauteur", malus: 2 } }, incompatibles: ["jambes-de-cabri"],
    description: `Le vide l'aspire : −2 dés sur les remparts, les passages exposés des sentiers et les toits.` }),
  trait({ cle: "peur-de-la-mer", nom: "Peur de la mer", poids: 1, effets: { peur: { lieu: "mer", malus: 2 } },
    description: `Il ne sait pas nager, ou il a vu quelqu'un se noyer : −2 dés en bateau ou dans l'eau, et il refuse la mer s'il peut.` })
];
