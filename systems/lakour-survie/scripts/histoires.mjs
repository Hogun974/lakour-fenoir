// Les histoires des survivants dans Foundry (contrat §16) : l'histoire d'un acteur, et le portrait de son journal « Histoire de… ».
//
// - histoireDuSurvivant(acteur, contenu) : les phrases gardées à sa création (flags.lakour-survie.phrasesHistoire, relues dans son
//   genre et dans la langue du module de contenu), sinon celles que donne sa fiche (logique/histoires.mjs : même fiche, même
//   histoire), sinon rien. Lecture seule, partout.
// - Le journal « Histoire de <nom> » est créé par le moteur (lakour-mj-ia, histoire.js) avec quatre pages d'aide. Quand il naît pour
//   un survivant, le MJ qui l'a créé écrit l'histoire dans la page « Portrait » (origine, famille, métier, manières), tant que cette
//   page n'a que ses questions d'aide. Le MJ IA l'écrit ensuite à sa façon (« ecrire ») ou la complète (« completer ») : il a les
//   mêmes phrases dans sa graine d'histoire. Rien n'est écrit dans un journal déjà rempli.
// Les fonctions pures (portraitHTML, pageDuPortrait, estAideHistoire, ficheDeLHistoire) s'éprouvent en Node ; le reste ne parle
// à Foundry que par les documents qu'on lui passe.
import * as L from "../logique/index.mjs";
import { ID } from "../logique/constantes.mjs";

const MODULE_MJIA = "lakour-mj-ia";
// Les marques du moteur (histoire-logique.js) : la classe des pages d'aide, la clé et les titres de la page « Portrait ».
export const CLASSE_AIDE_HISTOIRE = "lakour-histoire-aide";
export const PAGE_PORTRAIT = { cle: "qui", noms: ["Portrait", "Qui il est"] };
// Le drapeau où l'acteur garde les clés de ses phrases (« enfance:enfant-de-cilaos/3 ») ; au plus 5.
export const DRAPEAU_PHRASES = "phrasesHistoire";

const echapper = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
export const estAideHistoire = html => !String(html ?? "").trim() || String(html).includes(CLASSE_AIDE_HISTOIRE);
// Le portrait en HTML : un paragraphe, les phrases à la suite.
export const portraitHTML = phrases => (phrases.length ? `<p>${phrases.map(echapper).join(" ")}</p>` : "");
// La page « Portrait » d'un journal d'histoire (par le drapeau du moteur, sinon par son titre).
export function pageDuPortrait(journal) {
  const pages = [...(journal?.pages?.contents ?? journal?.pages?.values?.() ?? journal?.pages ?? [])];
  return pages.find(p => p?.flags?.[MODULE_MJIA]?.page === PAGE_PORTRAIT.cle) ?? pages.find(p => PAGE_PORTRAIT.noms.includes(p?.name)) ?? null;
}
// Les clés de phrases gardées sur un acteur (validées : des chaînes, 5 au plus).
export const clesGardees = acteur => (Array.isArray(acteur?.flags?.[ID]?.[DRAPEAU_PHRASES]) ? acteur.flags[ID][DRAPEAU_PHRASES] : [])
  .filter(c => typeof c === "string" && c.length <= 120).slice(0, L.HISTOIRE.phrasesMax);
// La fiche d'histoire d'un acteur survivant (ce que lit logique/histoires.mjs).
export function ficheDeLHistoire(acteur) {
  const s = acteur?.system ?? {};
  return {
    nom: String(acteur?.name ?? ""), age: Number(s.age) || 0, genre: s.genre ?? "", enfance: s.enfance ?? "", passe: s.passe ?? "",
    traits: [...(s.traits ?? [])], religion: s.religion ?? "", religions: [...(s.religions ?? [])], pratique: Boolean(s.pratique), regard: s.regard ?? ""
  };
}

// L'histoire d'un survivant. -> { phrases: [texte], cles: [id] } (vide pour un autre acteur, ou sans phrases pour lui)
export function histoireDuSurvivant(acteur, contenu) {
  if (acteur?.type !== "survivant") return { phrases: [], cles: [] };
  const fiche = ficheDeLHistoire(acteur);
  const gardees = clesGardees(acteur);
  // Gardées, tant qu'elles vont à sa fiche (le MJ a pu changer son passé depuis) ; sinon celles de sa fiche d'aujourd'hui.
  const relues = L.clesDeLaFiche(contenu, fiche, gardees) ? L.phrasesParCles(contenu, gardees, fiche.genre) : [];
  if (relues.length) return { phrases: relues, cles: gardees };
  return L.composerHistoire(contenu, fiche) ?? { phrases: [], cles: [] };
}

// Écrit l'histoire dans la page « Portrait » d'un journal d'histoire, si elle n'a que ses questions d'aide. -> vrai si écrit
export async function remplirPortrait(journal, acteur, contenu) {
  const page = pageDuPortrait(journal);
  if (!page || !estAideHistoire(page.text?.content)) return false;
  const html = portraitHTML(histoireDuSurvivant(acteur, contenu).phrases);
  if (!html) return false;
  await journal.updateEmbeddedDocuments("JournalEntryPage", [{ _id: page.id ?? page._id, "text.content": html }]);
  return true;
}

// Le crochet : un journal d'histoire vient de naître pour un survivant (chez celui qui l'a créé, un MJ). contenu() : le registre.
export function brancherHistoires(contenu) {
  Hooks.on("createJournalEntry", (journal, _options, userId) => {
    if (userId !== globalThis.game?.user?.id || !globalThis.game?.user?.isGM) return;
    const uuid = journal?.flags?.[MODULE_MJIA]?.histoire?.acteur;
    if (!uuid) return;
    const acteur = globalThis.fromUuidSync?.(uuid) ?? globalThis.game.actors?.get?.(String(uuid).split(".").at(-1));
    if (acteur?.type !== "survivant") return;
    remplirPortrait(journal, acteur, contenu()).catch(e => console.warn(`${ID} | histoire`, e));
  });
}
