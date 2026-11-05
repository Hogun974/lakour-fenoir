// Mise à jour d'un monde déjà installé (sans Foundry : essais/mise-a-jour-fenoir.test.mjs). Un journal déjà importé n'est
// jamais remplacé en bloc : on compare ses pages à celles du compendium par leur clé (flags.<ID>.cle).
// - une page du compendium absente du journal est ajoutée ;
// - une page que personne n'a retouchée reprend le texte, le nom et le rang du compendium ;
// - une page retouchée à la main reste telle quelle (son nom est rapporté au MJ) ;
// - les pages ajoutées par le MJ (sans clé) ne sont pas regardées.
// « Retouchée » : son texte ne correspond plus à l'empreinte posée à l'import (flags.<ID>.empreinte) ; pour une page importée
// avant les empreintes (contenu 0.2.0 et 0.2.1), sa date de modification diffère de sa date de création.

// Empreinte courte d'un texte (FNV-1a 32 bits) : de quoi reconnaître un texte inchangé, rien de plus.
export function empreinte(texte = "") {
  let h = 0x811c9dc5;
  for (const c of String(texte)) {
    h ^= c.codePointAt(0);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h.toString(36);
}

export function pageIntacte(id, page) {
  const e = page.flags?.[id]?.empreinte;
  if (e) return e === empreinte(page.text?.content ?? "");
  const s = page._stats ?? {};
  return s.createdTime != null && s.createdTime === s.modifiedTime;
}

// Pages d'un journal neuf, prêtes à créer : chacune reçoit son empreinte.
export function avecEmpreintes(id, pages = []) {
  return pages.map(p => ({ ...p, flags: { ...p.flags, [id]: { ...p.flags?.[id], empreinte: empreinte(p.text?.content ?? "") } } }));
}

// actuelles : pages du journal du monde ; modeles : pages du compendium (objets simples, toObject()).
// Rend { creer, maj, gardees } : données des pages à créer, changements (avec _id) des pages à mettre à jour, noms des pages
// retouchées laissées telles quelles.
export function planMiseAJour(id, actuelles = [], modeles = []) {
  const parCle = new Map();
  for (const p of actuelles) {
    const cle = p.flags?.[id]?.cle;
    if (cle && !parCle.has(cle)) parCle.set(cle, p);
  }
  const ids = new Set(actuelles.map(p => p._id));
  const creer = [], maj = [], gardees = [];
  for (const m of modeles) {
    const cle = m.flags?.[id]?.cle;
    if (!cle) continue;
    const contenu = m.text?.content;
    const p = parCle.get(cle);
    if (!p) {
      const { _stats, ...donnees } = structuredClone(m);
      if (ids.has(donnees._id)) delete donnees._id;
      creer.push(avecEmpreintes(id, [donnees])[0]);
      continue;
    }
    if (!pageIntacte(id, p)) {
      if (contenu !== undefined && contenu !== p.text?.content) gardees.push(p.name);
      continue;
    }
    const changements = {};
    if (contenu !== undefined && contenu !== p.text?.content) changements["text.content"] = contenu;
    if (m.name !== p.name) changements.name = m.name;
    if (m.sort !== p.sort) changements.sort = m.sort;
    const e = empreinte(contenu ?? p.text?.content ?? "");
    if (p.flags?.[id]?.empreinte !== e) changements[`flags.${id}.empreinte`] = e;
    if (Object.keys(changements).length) maj.push({ _id: p._id, ...changements });
  }
  return { creer, maj, gardees };
}
