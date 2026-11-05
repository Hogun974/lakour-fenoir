// Les demandes de test d'un MJ, et ce qu'un joueur peut demander lui-même (contrat §5, « Requêtes des joueurs »).
//
// Un joueur lance le test de SON survivant, mais ne choisit ni la difficulté, ni si le test compte (marques), ni de le forcer
// d'emblée : sans demande, son test est « normale » et ne compte pas (aucune marque ; il peut le forcer depuis sa carte, sans
// marque non plus). Une demande OUVERTE d'un MJ pour ce survivant et cette compétence fixe la difficulté et fait compter le test,
// une seule fois : la carte « Demande de test » du système (demanderTest) ou la carte de jet du MJ IA (data-lakour-jet, ses
// réglages convertis comme le fait le moteur, modules/lakour-mj-ia/scripts/survie-logique.js, reglagesVersTest).
// Seuls comptent les messages écrits par un MJ : l'auteur d'un message est fixé par le serveur de Foundry v14 (un joueur ne peut ni
// créer un message au nom d'un autre, ni changer son auteur), son contenu et ses drapeaux, non.
import { ID, DIFFICULTES, COMPETENCES, borner } from "../logique/constantes.mjs";

const MODULE_MJIA = "lakour-mj-ia";
export const deMJ = message => Boolean(message?.author?.isGM);

// Échelle du MJ IA -> difficulté du système et dés en plus (§7 du contrat ; même table que le moteur).
const CONVERSION_MJIA = {
  aucune: ["normale", 0], "tres-facile": ["normale", 2], facile: ["normale", 1], routiniere: ["normale", 0], exigeante: ["normale", 0],
  normale: ["normale", 0], difficile: ["difficile", 0], ardue: ["extreme", 0], "tres-ardue": ["extreme", 0], extreme: ["extreme", 0]
};
const ent = v => (Number.isFinite(Number(v)) ? Math.trunc(Number(v)) : 0);
export function reglagesMJIA(reglages = {}) {
  const [difficulte, facile] = CONVERSION_MJIA[String(reglages?.difficulte ?? "").trim()] ?? CONVERSION_MJIA.aucune;
  const modif = borner(ent(reglages?.modificateur), -2, 2);
  const bonus = facile + borner(ent(reglages?.avantage), 0, 3) + Math.max(0, modif) + Math.max(0, ent(reglages?.bonus));
  const malus = borner(ent(reglages?.desavantage), 0, 3) + Math.max(0, -modif) + Math.max(0, ent(reglages?.malus));
  return { difficulte, bonus: borner(bonus, 0, 4), malus: borner(malus, 0, 6) };
}

const ENTITES = { "&quot;": "\"", "&#34;": "\"", "&#39;": "'", "&#x27;": "'", "&apos;": "'", "&lt;": "<", "&gt;": ">", "&amp;": "&" };
const decoder = s => String(s ?? "").replace(/&(?:quot|#34|#39|#x27|apos|lt|gt|amp);/g, e => ENTITES[e]);
const attribut = (balise, nom) => { const m = new RegExp(`\\s${nom}="([^"]*)"`).exec(balise); return m ? decoder(m[1]) : null; };
const idActeur = uuid => String(uuid ?? "").split(".").at(-1);

// La demande portée par un message d'un MJ (ouverte ou non). -> { acteurId, competence, difficulte, bonus, malus, titre, source } | null
export function demandeDe(message) {
  if (!deMJ(message)) return null;
  const d = message.flags?.[ID]?.demande;
  if (d?.acteurId && COMPETENCES.includes(d.competence)) {
    return { acteurId: d.acteurId, competence: d.competence, difficulte: DIFFICULTES[d.difficulte] ? d.difficulte : "normale", bonus: 0, malus: 0,
      titre: String(d.titre ?? ""), source: "systeme" };
  }
  if (message.flags?.[MODULE_MJIA]?.ia) {
    const balise = /<button\b[^>]*\bdata-lakour-jet\b[^>]*>/.exec(String(message.content ?? ""))?.[0];
    const competence = balise ? attribut(balise, "data-competence") : null;
    if (!balise || !COMPETENCES.includes(competence)) return null;
    let reglages = {};
    try { reglages = JSON.parse(attribut(balise, "data-reglages") || "{}"); } catch { reglages = {}; }
    return { acteurId: idActeur(attribut(balise, "data-acteur")), competence, ...reglagesMJIA(reglages), titre: String(reglages.titre ?? ""), source: "mjia" };
  }
  return null;
}
export const demandeOuverte = message => (message?.flags?.[ID]?.repondue ? null : demandeDe(message));

// La demande ouverte à laquelle répond le test d'un joueur : celle du message donné s'il convient, sinon la plus récente pour ce
// survivant et cette compétence. -> { …demande, message } | null
export function trouverDemande({ messageId = "", acteurId, competence } = {}, messages = globalThis.game?.messages) {
  const convient = m => { const d = demandeOuverte(m); return d && d.acteurId === acteurId && d.competence === competence ? { ...d, message: m } : null; };
  const donne = messageId ? convient(messages?.get?.(messageId)) : null;
  if (donne) return donne;
  const liste = [...(messages?.contents ?? messages?.values?.() ?? [])];
  for (let i = liste.length - 1; i >= 0; i--) { const d = convient(liste[i]); if (d) return d; }
  return null;
}
// La demande a reçu sa réponse : elle ne sert plus.
export async function fermerDemande(demande, reponseId = "") {
  await demande?.message?.update?.({ [`flags.${ID}.repondue`]: reponseId || true });
}

// Ce qu'un joueur obtient pour son test : la demande ouverte décide ; sans demande, normale et sans marque.
export function argumentsDuTestJoueur(d = {}, demande = null) {
  const borne = v => borner(Math.round(Number.isFinite(Number(v)) ? Number(v) : 0), 0, 4);
  const base = { acteurId: d.acteurId, competence: d.competence, forcer: false, forcable: true };
  if (demande) return { ...base, difficulte: demande.difficulte, bonus: demande.bonus, malus: demande.malus, titre: demande.titre || String(d.titre ?? "").slice(0, 200), compte: true };
  return { ...base, difficulte: "normale", bonus: borne(d.bonus), malus: borne(d.malus), titre: String(d.titre ?? "").slice(0, 200), compte: false };
}

// Les propositions d'un joueur (tableau de bord) : au plus 3 par minute chacun ; le MJ n'a pas de limite.
export const LIMITE_PROPOSITIONS = { nombre: 3, fenetre: 60000 };
const recentes = new Map();
export function propositionPermise(userId, maintenant = Date.now()) {
  const l = (recentes.get(userId) ?? []).filter(x => maintenant - x < LIMITE_PROPOSITIONS.fenetre);
  const ok = l.length < LIMITE_PROPOSITIONS.nombre;
  if (ok) l.push(maintenant);
  recentes.set(userId, l);
  return ok;
}
export const _oublierPropositions = () => recentes.clear();
