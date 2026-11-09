// La vie au camp (contrat §9, reprise de « Entre deux mandats » de l'Imperium) : les activités du temps calme, leur test et leur
// coût en quarts, dans un journal visible des joueurs, et la table des imprévus du camp. Textes originaux.
import { journal, table } from "./aides.mjs";

// { cle, nom, tache (§10.3), test: { competence, difficulte } | null, quarts, effet }
export const ACTIVITES_CAMP = [
  { cle: "enseigner", nom: "Enseigner un savoir", tache: "enseigner", test: { competence: "parole", difficulte: "normale" }, quarts: 4,
    effet: "Une marque par jour à l'élève dans la compétence enseignée si le maître a deux niveaux de plus. Une semaine d'enseignement réussi transmet un savoir-faire du maître (test de parole difficile à la fin)." },
  { cle: "reparer", nom: "Réparer", tache: "atelier", test: { competence: "bricolage", difficulte: "normale" }, quarts: 1,
    effet: "Un point d'état d'une installation, ou un point de dégâts de l'abri, par réussite (coûts du système)." },
  { cle: "cultiver", nom: "Cultiver", tache: "cultures", test: { competence: "survie", difficulte: "normale" }, quarts: 4,
    effet: "Les cultures produisent à plein ; une marge de 2 donne 1 nourriture de plus ce jour-là." },
  { cle: "monter-la-garde", nom: "Monter la garde", tache: "garde", test: { competence: "vigilance", difficulte: "normale" }, quarts: 1,
    effet: "La garde ajoute son niveau de vigilance à la défense en cas d'assaut ; un succès repère une menace avant qu'elle ne frappe." },
  { cle: "soigner", nom: "Soigner", tache: "soins", test: { competence: "soins", difficulte: "normale" }, quarts: 1,
    effet: "Un blessé récupère plus vite (une blessure de moins par réussite, avec 1 médicament) ; une affliction traitée ne s'aggrave plus." },
  { cle: "raconter", nom: "Raconter", tache: "repos", test: { competence: "parole", difficulte: "facile" }, quarts: 1,
    effet: "Une veillée de récits, de zistoir lontan, de souvenirs : +1 moral à ceux qui écoutent (une fois par semaine)." },
  { cle: "feter", nom: "Fêter", tache: "cuisine", test: null, quarts: 1,
    effet: "Une fête du calendrier ou une date du groupe : +1 moral à chacun, une fois par fête, au prix d'une ration de plus par personne." },
  { cle: "cuisiner", nom: "Cuisiner pour tous", tache: "cuisine", test: { competence: "survie", difficulte: "normale" }, quarts: 2,
    effet: "Un vrai repas (cari, rougail, riz chaud) : rien de perdu ce jour-là (pas de pertes de nourriture) et +1 moral une fois par semaine." },
  { cle: "pecher-chasser", nom: "Pêcher ou chasser", tache: "peche", test: { competence: "survie", difficulte: "normale" }, quarts: 2,
    effet: "Prendre à la nature des alentours : 1 nourriture par succès, dans la limite de ce que la nature offre." },
  { cle: "se-reposer", nom: "Se reposer", tache: "repos", test: null, quarts: 1,
    effet: "−1 fatigue par quart de repos, −2 pour une nuit à l'abri." },
  { cle: "ecrire-la-chronique", nom: "Écrire la chronique", tache: "repos", test: null, quarts: 1,
    effet: "Un paragraphe dans les Chroniques de Fénoir : où l'on est, ce qu'on a bâti, qui l'on a perdu. Le MJ peut donner une marque après une scène marquante racontée." }
];

const IMPREVUS = ["Une poule s'échappe et file vers la route ; il faut la rattraper avant les chiens.", "La pluie entre par le toit du dortoir : tout est trempé.", "Un enfant du camp a de la fièvre ; est-ce la dengue ?", "Deux membres se disputent la dernière bouteille de rhum arrangé.", "Un oiseau tombe dans la citerne : il faut la vider en partie.", "Un vieux poste de radio se met à grésiller tout seul, sur une fréquence inconnue.", "Le chien du camp ramène une chaussure d'enfant.", "Une scolopendre dans la réserve de bois.", "Un orage coupe le courant des panneaux ; les batteries sont au plus bas.", "Quelqu'un a retrouvé une photo de famille dans une fouille et ne parle plus.", "Les letchis du voisin sont mûrs, juste derrière la clôture.", "Une fumée à l'horizon, dans la direction de l'ancien abri.", "Un membre du groupe chante en travaillant ; les autres reprennent.", "Des fourmis dans le sucre.", "Un Livide solitaire s'est coincé dans la clôture pendant la nuit.", "Un cabri a mis bas : deux petits.", "Deux membres du groupe s'écharpent pour savoir si le vrai rougail saucisse prend des tomates ; le camp prend parti, quartier par quartier.", "Une vieille yab et un jeune Comorien découvrent qu'ils fredonnent le même séga, chacun avec ses paroles.", "Quelqu'un imite l'accent zoreil de la dernière recrue ; la recrue imite en retour l'accent des Hauts, et tout le monde rit, sauf un."];

export const CAMP = [
  journal({ cle: "vie-au-camp", nom: "La vie au camp", pack: "guides", pages: [
    { cle: "principe", titre: "Le temps calme", texte: `Entre deux sorties, la vie continue à l'abri. Chacun a une **tâche du jour** (garde, cultures, élevage, chantier, atelier, cuisine, soins, eau, pêche, chasse, fouille, repos, enseigner) ; le temps calme, ce sont aussi ces activités qu'on choisit en groupe, avec leur test et leur coût en quarts.

Une tâche tenue une semaine donne une marque dans la compétence qui lui sert (deux si c'est une passion). Le MJ peut tirer un **imprévu du camp** chaque jour calme.` },
    { cle: "activites", titre: "Les activités", texte: ACTIVITES_CAMP.map(a => `**${a.nom}** — ${a.test ? `test de ${a.test.competence} (${a.test.difficulte})` : "sans test"}, ${a.quarts} quart${a.quarts > 1 ? "s" : ""}. ${a.effet}`).join("\n\n") },
    { cle: "fetes", titre: "Fêter", texte: `L'île fêtait beaucoup, et le camp aussi : Noël sous les flamboyants, le 20 décembre, le jour de l'an, Dipavali, le Nouvel An chinois, le Cavadee, Pâques, la fête des letchis, la fête de la musique, le 14 juillet, la Toussaint, Halloween. Fêter redonne **1 de moral à chacun**, une fois par fête, au prix d'**une ration de plus par personne**. C'est la seule règle : le reste, c'est à vous de le raconter.` }
  ] }),
  table({ cle: "imprevus-du-camp", nom: "Imprévus du camp", description: "Un petit événement de la vie quotidienne de l'abri, à tirer un jour calme.", resultats: IMPREVUS })
];
