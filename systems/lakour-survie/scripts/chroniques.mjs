// Les Chroniques de Fénoir (repris des Chroniques des Veillées) : un journal que tous peuvent lire, un chapitre par abri — où,
// combien de jours, ce qu'on y a bâti, qui est tombé. Les chapitres vivent dans l'état public (etat.chroniques : [{ id, site,
// region, nom, debut (quart), fin (quart | null), morts: [nom], construit: [nom] }]) ; le journal est récrit d'après eux chez le
// MJ actif (effacé, il revient à l'écriture suivante). Rien de secret : ce que le groupe a vécu.
import { ID } from "../logique/constantes.mjs";
import { jourDe } from "../logique/temps.mjs";
import { regionDe } from "../logique/contenu.mjs";
import { t, echapper, localiser } from "./donnees.mjs";
import { texteJalon } from "../logique/paradis.mjs";

export const chapitreOuvert = etat => [...(etat?.chroniques ?? [])].reverse().find(c => c.fin === null || c.fin === undefined) ?? null;

// La page d'un chapitre (HTML). maintenant : le quart courant (pour un chapitre en cours).
export function pageChapitre(c, contenu, maintenant) {
  const debut = jourDe(c.debut), fin = jourDe(c.fin ?? maintenant);
  const jours = Math.max(0, fin - debut);
  const region = regionDe(contenu, c.region)?.nom ?? c.region;
  const lignes = [
    `<p><strong>${echapper(c.nom)}</strong> — ${echapper(region)}</p>`,
    `<p>${t(c.fin === null || c.fin === undefined ? "LAKOUR_SURVIE.Chroniques.EnCours" : "LAKOUR_SURVIE.Chroniques.Duree", { debut, fin, jours })}</p>`,
    `<h3>${t("LAKOUR_SURVIE.Chroniques.Bati")}</h3>`,
    c.construit?.length ? `<ul>${c.construit.map(n => `<li>${echapper(n)}</li>`).join("")}</ul>` : `<p><em>${t("LAKOUR_SURVIE.Chroniques.Rien")}</em></p>`,
    `<h3>${t("LAKOUR_SURVIE.Chroniques.Tombes")}</h3>`,
    c.morts?.length ? `<ul>${c.morts.map(n => `<li>✝ ${echapper(n)}</li>`).join("")}</ul>` : `<p><em>${t("LAKOUR_SURVIE.Chroniques.Personne")}</em></p>`
  ];
  return `<div class="lakour-survie survie-chronique">${lignes.join("")}</div>`;
}

export function pagesDesChroniques(etat, contenu) {
  const maintenant = etat?.horloge?.quart ?? 0;
  const pages = (etat?.chroniques ?? []).map((c, i) => ({
    name: t("LAKOUR_SURVIE.Chroniques.Chapitre", { n: i + 1, nom: c.nom }), type: "text", sort: (i + 1) * 100,
    text: { content: pageChapitre(c, contenu, maintenant) }
  }));
  // Lot 9 « Rallumer l'île » : les jalons du groupe (premier abri, première saison des pluies, premier cyclone, première fête, première
  // région rallumée, la moitié de l'île, toute l'île), une page à la fin, sans rien d'autre que la date.
  const jalons = Array.isArray(etat?.jalons) ? etat.jalons : [];
  if (jalons.length) pages.push({ name: t("LAKOUR_SURVIE.Paradis.Ile.Jalons"), type: "text", sort: (pages.length + 1) * 100,
    text: { content: `<div class="lakour-survie survie-chronique"><ul>${jalons.map(j => `<li>${t("LAKOUR_SURVIE.Bandeau.Jour", { n: Number(j.jour) || 0 })} — ${echapper(localiser(texteJalon(j.cle, j.params ?? {})))}</li>`).join("")}</ul></div>` } });
  return pages;
}


// Récrit le journal « Chroniques de Fénoir » (MJ actif). -> le journal
export async function ecrireChroniques(etat, contenu) {
  if (!globalThis.JournalEntry || !(etat?.chroniques ?? []).length) return null;
  const pages = pagesDesChroniques(etat, contenu);
  const journal = game.journal?.find?.(j => j.getFlag?.(ID, "chroniques"));
  const OBS = globalThis.CONST?.DOCUMENT_OWNERSHIP_LEVELS?.OBSERVER ?? 2;
  if (!journal) {
    return JournalEntry.implementation.create({ name: t("LAKOUR_SURVIE.Chroniques.Titre"), pages, flags: { [ID]: { chroniques: true } }, ownership: { default: OBS } });
  }
  if (journal.pages.size) await journal.deleteEmbeddedDocuments("JournalEntryPage", journal.pages.map(p => p.id));
  await journal.createEmbeddedDocuments("JournalEntryPage", pages);
  return journal;
}
