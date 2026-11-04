// Les fiches du système (ApplicationV2 + Handlebars) : survivant, abri, et une fiche de lecture claire pour chaque objet
// (installation, savoir, équipement, passé, recette, affliction, enfance, trait).
// - Survivant : compétences avec flammes de passion et marques (clic = test : difficulté, bonus, malus ; forcer ensuite depuis la
//   carte de chat), état, infection, afflictions, traits (infobulles), incapacités, enfance et passé, équipement, savoirs, tâche
//   du jour, bouton « Histoire » du MJ IA s'il est là. Le MJ règle les nombres à la main ; le joueur propriétaire choisit sa tâche
//   (par l'API : elle passe par le MJ actif) et écrit ses notes.
// - Abri : stocks et jours de stocks, production nette, autonomie, défense, discrétion, visibilité, capacité, installations et
//   chantiers, alentours, grille membres × tâches.
import { ID, COMPETENCES, RESSOURCES, NATURE, DIFFICULTES } from "../../logique/constantes.mjs";
import * as L from "../../logique/index.mjs";
import { t, aPlat, lireEtat, echapper, sansBalises, libelleCompetence, libelleRessource, libelleTache, MODULE_MJIA } from "../donnees.mjs";
import { CHEMIN, essayer, lireChamps, flammes, jours, options } from "./commun.mjs";

const { HandlebarsApplicationMixin } = foundry.applications.api;
const { ActorSheetV2, ItemSheetV2 } = foundry.applications.sheets;
const enrichir = (html, doc) => foundry.applications.ux.TextEditor.implementation.enrichHTML(html ?? "", { relativeTo: doc, secrets: doc.isOwner });
const contenu = () => game.lakourSurvie?.contenu?.() ?? {};
const defDe = (famille, cle) => L.indexer(contenu())[famille]?.get(cle) ?? null;
export const BLESSURES = ["Indemne", "Egratigne", "Blesse", "Grievement", "Mourant"];

// ------------------------------------------------------------------ survivant (contexte pur, éprouvé hors Foundry)
export function contexteSurvivant(a, { gm = false, proprietaire = false } = {}) {
  const s = aPlat(a.system);
  const c = contenu();
  const incap = new Set(s.incapacites ?? []);
  const interdites = new Set([...incap, ...L.competencesInterdites(s)]);
  const competences = COMPETENCES.map(k => {
    const niveau = Number(s.competences?.[k]?.niveau) || 0, marques = Number(s.competences?.[k]?.marques) || 0, seuil = L.seuilMarques(niveau);
    return {
      cle: k, libelle: libelleCompetence(k), niveau, marques: Math.round(marques * 100) / 100, seuil, pct: niveau >= 5 ? 100 : Math.min(100, Math.round(marques / seuil * 100)),
      pips: [1, 2, 3, 4, 5].map(i => ({ plein: i <= niveau })), passion: Number(s.passions?.[k]) || 0, flammes: flammes(s.passions?.[k]),
      incapable: interdites.has(k), aide: t(`LAKOUR_SURVIE.Aides.${k}`)
    };
  });
  const malus = L.malusEtat(s);
  const etat = [
    { cle: "blessures", libelle: t("LAKOUR_SURVIE.Etat.blessures"), valeur: Number(s.blessures) || 0, max: 4, texte: t(`LAKOUR_SURVIE.Blessures.${BLESSURES[s.blessures ?? 0] ?? "Indemne"}`), mauvais: (s.blessures ?? 0) >= 2 },
    { cle: "fatigue", libelle: t("LAKOUR_SURVIE.Etat.fatigue"), valeur: Number(s.fatigue) || 0, max: 5, texte: `${s.fatigue ?? 0} / 5`, mauvais: (s.fatigue ?? 0) >= 3 },
    { cle: "moral", libelle: t("LAKOUR_SURVIE.Etat.moral"), valeur: Number(s.moral ?? 4), max: 5, texte: `${s.moral ?? 4} / 5`, mauvais: (s.moral ?? 4) <= 1, inverse: true },
    { cle: "faim", libelle: t("LAKOUR_SURVIE.Etat.faim"), valeur: Number(s.faim) || 0, max: 5, texte: t("LAKOUR_SURVIE.Fiche.Jours", { n: s.faim ?? 0 }), mauvais: (s.faim ?? 0) >= 2 },
    { cle: "soif", libelle: t("LAKOUR_SURVIE.Etat.soif"), valeur: Number(s.soif) || 0, max: 6, texte: t("LAKOUR_SURVIE.Fiche.Quarts", { n: s.soif ?? 0 }), mauvais: (s.soif ?? 0) >= 4 }
  ].map(e => ({ ...e, borne: ["faim", "soif"].includes(e.cle) ? 99 : e.max, pct: Math.round(Math.min(1, e.valeur / e.max) * 100) }));
  const afflictions = (s.afflictions ?? []).filter(x => gm || x.stade !== "incubation").map(x => {
    const def = defDe("afflictions", x.cle);
    return { cle: x.cle, nom: def?.nom ?? x.cle, stade: t(`LAKOUR_SURVIE.Afflictions.${x.stade}`), reste: x.reste, malus: x.malus, aide: sansBalises(def?.description ?? ""), traitee: x.traitee };
  });
  const traits = (s.traits ?? []).map(k => { const d = defDe("traits", k); return { cle: k, nom: d?.nom ?? k, aide: sansBalises(d?.description ?? "") }; });
  const enfance = defDe("enfances", s.enfance), passe = defDe("passes", s.passe);
  const objets = type => [...(a.items?.contents ?? [])].filter(i => i.type === type).map(i => ({ id: i.id, nom: i.name, img: i.img,
    detail: type === "equipement" ? Object.entries(i.system?.bonus ?? {}).filter(([, n]) => Number(n)).map(([k, n]) => `${libelleCompetence(k)} +${n}`).join(", ") : "" }));
  const taches = options(Object.keys(L.TACHES).filter(x => L.peutFaire(s, x) || x === s.tache).map(x => [x, libelleTache(x)]), s.tache);
  return {
    acteur: { id: a.id, uuid: a.uuid, name: a.name, img: a.img }, system: s, gm, proprietaire, editable: gm || proprietaire,
    competences, etat, malus: malus.total, craque: malus.craque,
    infection: s.infection?.atteint ? { stade: s.infection.stade, pct: Math.round(s.infection.stade / 6 * 100) } : null,
    afflictions, traits, incapacites: [...incap].map(k => ({ cle: k, texte: t(`LAKOUR_SURVIE.Incapacites.${k}`) })),
    enfance: enfance ? { nom: enfance.nom, aide: sansBalises(enfance.description) } : s.enfance ? { nom: s.enfance, aide: "" } : null,
    passe: passe ? { nom: passe.nom, aide: sansBalises(passe.description) } : s.passe ? { nom: s.passe, aide: "" } : null,
    statut: t(`LAKOUR_SURVIE.Statuts.${s.statut || "joueur"}`), age: s.age, lien: s.lien,
    mort: s.vivant === false, livide: Boolean(s.livide),
    equipement: objets("equipement"), savoirs: objets("savoir"),
    taches, tache: libelleTache(s.tache), peutChoisirTache: (gm || proprietaire) && s.vivant !== false && !s.livide,
    histoire: Boolean(game.modules?.get?.(MODULE_MJIA)?.api?.histoire?.ouvrir),
    membre: (lireEtat().groupe?.membres ?? []).includes(a.id),
    difficultes: Object.keys(DIFFICULTES)
  };
}

// La fenêtre du test d'une compétence : difficulté, bonus, malus, « compte ». -> les réglages, ou null.
export async function demanderReglagesTest(acteurNom, competence) {
  const DialogV2 = foundry.applications.api.DialogV2;
  const choix = Object.keys(DIFFICULTES).map(d => `<option value="${d}" ${d === "normale" ? "selected" : ""}>${t(`LAKOUR_SURVIE.Difficultes.${d}`)}</option>`).join("");
  const contenuHtml = `<div class="lakour-survie survie-dialogue">
    <p>${echapper(acteurNom)} — <strong>${echapper(libelleCompetence(competence))}</strong></p>
    <label>${t("LAKOUR_SURVIE.Test.Difficulte")} <select name="difficulte">${choix}</select></label>
    <label>${t("LAKOUR_SURVIE.Test.Bonus")} <input type="number" name="bonus" value="0" min="0" max="4"></label>
    <label>${t("LAKOUR_SURVIE.Test.Malus")} <input type="number" name="malus" value="0" min="0" max="4"></label>
    <label class="survie-case"><input type="checkbox" name="compte" checked> ${t("LAKOUR_SURVIE.Test.Compte")}</label>
    <p class="survie-aide">${t("LAKOUR_SURVIE.Test.AideDialogue")}</p></div>`;
  return DialogV2.wait({
    window: { title: t("LAKOUR_SURVIE.Test.Titre", { competence: libelleCompetence(competence) }) },
    content: contenuHtml,
    buttons: [{ action: "lancer", label: t("LAKOUR_SURVIE.Test.Lancer"), icon: "fa-solid fa-dice", default: true, callback: (event, bouton) => lireChamps(bouton.form) },
      { action: "annuler", label: t("LAKOUR_SURVIE.Annuler") }],
    rejectClose: false
  }).then(r => (r && typeof r === "object" ? r : null));
}

export async function lancerTestDepuisFiche(acteur, competence) {
  const r = await demanderReglagesTest(acteur.name, competence);
  if (!r) return null;
  return essayer(() => game.lakourSurvie.test({ acteurId: acteur.id, competence, difficulte: r.difficulte, bonus: Number(r.bonus) || 0, malus: Number(r.malus) || 0, compte: r.compte !== false }));
}

export class FicheSurvivant extends HandlebarsApplicationMixin(ActorSheetV2) {
  static DEFAULT_OPTIONS = {
    classes: [ID, "survie-fiche", "survie-fiche-survivant"],
    position: { width: 720, height: 780 },
    window: { resizable: true },
    form: { submitOnChange: true },
    actions: {
      tester: FicheSurvivant.#tester,
      ouvrirObjet: FicheSurvivant.#ouvrirObjet,
      retirerObjet: FicheSurvivant.#retirerObjet,
      histoire: FicheSurvivant.#histoire
    }
  };
  static PARTS = { fiche: { template: `${CHEMIN}/fiche-survivant.hbs`, scrollable: [".survie-corps"] } };

  async _prepareContext(options) {
    const base = await super._prepareContext(options);
    const a = this.document;
    const ctx = contexteSurvivant(a, { gm: game.user.isGM, proprietaire: a.isOwner });
    return { ...base, ...ctx, editable: this.isEditable, notesEnrichies: await enrichir(a.system.notes, a) };
  }

  async _onRender(context, options) {
    await super._onRender(context, options);
    // La tâche passe par l'API (le MJ actif écrit) : le joueur ne modifie pas le document lui-même.
    this.element.querySelector("select.survie-tache")?.addEventListener("change", ev => {
      ev.stopPropagation();
      essayer(() => game.lakourSurvie.assigner({ acteurId: this.document.id, tache: ev.target.value }));
    });
  }

  // Un joueur ne modifie que son nom, son portrait et ses notes ; les nombres sont au MJ.
  _prepareSubmitData(event, form, formData, updateData) {
    const donnees = super._prepareSubmitData(event, form, formData, updateData);
    if (!game.user.isGM && donnees?.system) {
      const notes = donnees.system.notes;
      donnees.system = notes === undefined ? {} : { notes };
    }
    if (donnees?.system) delete donnees.system.tache;
    return donnees;
  }

  static #tester(event, cible) {
    if (!this.document.isOwner && !game.user.isGM) return;
    lancerTestDepuisFiche(this.document, cible.dataset.competence);
  }
  static #ouvrirObjet(event, cible) { this.document.items.get(cible.dataset.itemId)?.sheet?.render({ force: true }); }
  static async #retirerObjet(event, cible) { if (game.user.isGM) await this.document.items.get(cible.dataset.itemId)?.delete(); }
  static #histoire() { essayer(() => game.modules.get(MODULE_MJIA)?.api?.histoire?.ouvrir?.(this.document)); }
}

// ------------------------------------------------------------------ abri
export function contexteAbri(a) {
  const s = aPlat(a.system);
  const etat = lireEtat();
  const courant = etat.groupe?.abri === a.id;
  const b = courant ? (game.lakourSurvie?.bilan?.() ?? etat.bilan) : null;
  const plafonds = b?.plafonds ?? {};
  const stocks = RESSOURCES.map(r => ({
    cle: r, libelle: libelleRessource(r), quantite: Number(s.stocks?.[r]) || 0, plafond: plafonds[r] ?? null,
    net: b?.net?.[r] ?? null, jours: r === "eau" || r === "nourriture" ? jours(b?.joursDeStocks?.[r]) : "",
    alerte: (r === "eau" || r === "nourriture") && Number(b?.joursDeStocks?.[r]) <= 2
  }));
  const installations = [...(a.items?.contents ?? [])].filter(i => i.type === "installation").map(i => {
    const sys = i.system ?? {};
    const def = defDe("installations", sys.cle);
    const enChantier = Number(sys.chantier?.requis) > 0;
    return { id: i.id, nom: i.name, img: i.img, niveau: sys.niveau, niveauMax: sys.niveauMax ?? def?.niveauMax ?? 1, etat: sys.etat, etatTexte: t(`LAKOUR_SURVIE.EtatInstallation.${sys.etat ?? 0}`),
      chantier: enChantier ? { fait: sys.chantier.fait, requis: sys.chantier.requis, pct: Math.round(Math.min(1, sys.chantier.fait / sys.chantier.requis) * 100) } : null,
      categorie: t(`LAKOUR_SURVIE.Categories.${sys.categorie ?? def?.categorie ?? "vie"}`), arret: (b?.arrets ?? []).find(x => x.cle === sys.cle)?.raison ?? "", aide: sansBalises(def?.description ?? "") };
  });
  const nature = NATURE.map(n => ({ cle: n, libelle: t(`LAKOUR_SURVIE.Nature.${n}`), valeur: Math.round((Number(s.nature?.[n]) || 0) * 10) / 10 }));
  const membres = courant ? (etat.groupe.membres ?? []).map(id => game.actors.get(id)).filter(Boolean) : [];
  const grille = membres.map(m => ({ id: m.id, nom: m.name, cases: Object.keys(L.TACHES).map(x => ({ tache: x, choisie: m.system.tache === x, possible: L.peutFaire(aPlat(m.system), x) })) }));
  const site = L.siteDe(contenu(), s.site);
  return {
    acteur: { id: a.id, name: a.name, img: a.img }, system: s, courant, abandonne: s.abandonneLe !== null && s.abandonneLe !== undefined,
    region: L.regionDe(contenu(), s.region)?.nom ?? s.region, site: site ? { nom: site.nom, atouts: site.atouts ?? [], defauts: site.defauts ?? [] } : null,
    stocks, installations, nature, sol: Math.round((Number(s.sol) || 0) * 100) / 100, bruit: s.bruit, degats: s.degats,
    bilan: b ? { defense: b.defense, discretion: b.discretion, visibilite: b.visibilite, capacite: b.capacite, personnes: b.personnes, autonome: Boolean(etat.autonome),
      joursAutonomes: etat.joursAutonomes ?? 0, surpeuplement: b.surpeuplement, production: Object.entries(b.production ?? {}).map(([r, q]) => `${libelleRessource(r)} ${q}`).join(", ") } : null,
    grille, taches: Object.keys(L.TACHES).map(x => ({ cle: x, libelle: libelleTache(x) })), gm: game.user.isGM
  };
}

export class FicheAbri extends HandlebarsApplicationMixin(ActorSheetV2) {
  static DEFAULT_OPTIONS = {
    classes: [ID, "survie-fiche", "survie-fiche-abri"],
    position: { width: 760, height: 760 },
    window: { resizable: true },
    form: { submitOnChange: true },
    actions: { ouvrirObjet: FicheAbri.#ouvrirObjet, assignerCase: FicheAbri.#assignerCase }
  };
  static PARTS = { fiche: { template: `${CHEMIN}/fiche-abri.hbs`, scrollable: [".survie-corps"] } };

  async _prepareContext(options) {
    const base = await super._prepareContext(options);
    return { ...base, ...contexteAbri(this.document), editable: this.isEditable, notesEnrichies: await enrichir(this.document.system.notes, this.document) };
  }
  static #ouvrirObjet(event, cible) { this.document.items.get(cible.dataset.itemId)?.sheet?.render({ force: true }); }
  static #assignerCase(event, cible) {
    const a = game.actors.get(cible.dataset.acteur);
    if (!a || !(game.user.isGM || a.isOwner)) return;
    essayer(() => game.lakourSurvie.assigner({ acteurId: a.id, tache: cible.dataset.tache }));
  }
}

// ------------------------------------------------------------------ objets : lecture claire
const liste = l => (l ?? []).filter(Boolean);
const coutTexte = cout => Object.entries(cout ?? {}).filter(([, q]) => Number(q)).map(([r, q]) => `${r === "travail" ? t("LAKOUR_SURVIE.Objet.Travail") : libelleRessource(r)} ${q}`).join(", ");
const effetsTexte = e => {
  if (!e) return [];
  const l = [];
  for (const [r, q] of Object.entries(e.production ?? {})) if (Number(q)) l.push(`${t("LAKOUR_SURVIE.Objet.Produit")} ${q} ${libelleRessource(r).toLowerCase()}/j`);
  for (const [r, q] of Object.entries(e.consommation ?? {})) if (Number(q)) l.push(`${t("LAKOUR_SURVIE.Objet.Consomme")} ${q} ${libelleRessource(r).toLowerCase()}/j`);
  for (const k of ["defense", "discretion", "capacite", "visibilite", "bruit", "protectionCyclone", "soins", "moral"]) if (Number(e[k])) l.push(`${t(`LAKOUR_SURVIE.Objet.Effets.${k}`)} ${e[k] > 0 ? "+" : ""}${e[k]}`);
  for (const [r, q] of Object.entries(e.stockage ?? {})) if (Number(q)) l.push(`${t("LAKOUR_SURVIE.Objet.Stockage")} ${libelleRessource(r).toLowerCase()} +${q}`);
  if (e.conservation) l.push(t("LAKOUR_SURVIE.Objet.Conservation"));
  if (e.renseignements) l.push(t("LAKOUR_SURVIE.Objet.Radio"));
  if (Number(e.conditions?.delai)) l.push(t("LAKOUR_SURVIE.Objet.Delai", { n: e.conditions.delai }));
  if (e.bras?.tache) l.push(t("LAKOUR_SURVIE.Objet.Bras", { tache: libelleTache(e.bras.tache), n: e.bras.nombre ?? 1 }));
  for (const [k, n] of Object.entries(e.bonus ?? {})) if (Number(n)) l.push(`${libelleCompetence(k)} +${n}`);
  return l;
};

// Les sections d'une fiche d'objet selon son type -> [{ titre, lignes: [texte], html }].
export function sectionsObjet(i) {
  const s = aPlat(i.system);
  const S = [];
  const ajout = (titre, lignes = [], html = "") => { if (liste(lignes).length || html) S.push({ titre: t(`LAKOUR_SURVIE.Objet.Sections.${titre}`), lignes: liste(lignes), html }); };
  switch (i.type) {
    case "installation":
      ajout("Etat", [`${t("LAKOUR_SURVIE.Objet.Niveau")} ${s.niveau} / ${s.niveauMax}`, t(`LAKOUR_SURVIE.Categories.${s.categorie}`), t(`LAKOUR_SURVIE.EtatInstallation.${s.etat ?? 0}`),
        Number(s.chantier?.requis) > 0 ? t("LAKOUR_SURVIE.Action.Avance", { fait: s.chantier.fait, requis: s.chantier.requis }) : ""]);
      (s.niveaux ?? []).forEach((n, k) => ajout("Niveau", [`${t("LAKOUR_SURVIE.Objet.Niveau")} ${k + 1}`, `${t("LAKOUR_SURVIE.Objet.Cout")} : ${coutTexte(n.cout)}`,
        n.requiert?.savoirs?.length ? `${t("LAKOUR_SURVIE.Objet.Savoirs")} : ${n.requiert.savoirs.map(x => defDe("savoirs", x)?.nom ?? x).join(", ")}` : "",
        ...effetsTexte(n.effets)]));
      break;
    case "equipement":
      ajout("Usage", [Object.entries(s.bonus ?? {}).filter(([, n]) => Number(n)).map(([k, n]) => `${libelleCompetence(k)} +${n}`).join(", "),
        Number(s.bruit) ? `${t("LAKOUR_SURVIE.Objet.Effets.bruit")} ${s.bruit}` : "", s.munitions ? t("LAKOUR_SURVIE.Objet.Munitions", { n: s.munitions }) : "",
        s.transport ? t("LAKOUR_SURVIE.Objet.Transport", { places: s.transport.places ?? 1, charge: s.transport.chargeMax ?? 0, terrains: (s.transport.terrains ?? []).join(", ") }) : "",
        ...effetsTexte(s.effets)]);
      break;
    case "passe": case "enfance": {
      const mods = s.competences ?? s.modificateurs ?? {};
      ajout("Competences", Object.entries(mods).filter(([, n]) => Number(n)).map(([k, n]) => `${libelleCompetence(k)} ${n > 0 ? "+" : ""}${n}`));
      ajout("Savoirs", (s.savoirs ?? []).map(x => defDe("savoirs", x)?.nom ?? x));
      ajout("Equipement", (s.equipement ?? []).map(x => defDe("equipements", x)?.nom ?? x));
      ajout("Incapacites", (s.incapacites ?? []).map(x => t(`LAKOUR_SURVIE.Incapacites.${x}`)));
      ajout("Histoire", s.histoire ?? []);
      break;
    }
    case "recette":
      ajout("Fabrication", [`${t("LAKOUR_SURVIE.Objet.Cout")} : ${coutTexte(s.cout)}`, `${t("LAKOUR_SURVIE.Objet.Travail")} : ${s.travail}`,
        `${libelleCompetence(s.competence)} (${t(`LAKOUR_SURVIE.Difficultes.${s.difficulte}`)})`,
        s.requiert?.installation ? `${t("LAKOUR_SURVIE.Objet.Requiert")} : ${defDe("installations", s.requiert.installation?.cle ?? s.requiert.installation)?.nom ?? s.requiert.installation}` : "",
        s.produit?.equipement ? `${t("LAKOUR_SURVIE.Objet.Produit")} : ${defDe("equipements", s.produit.equipement)?.nom ?? s.produit.equipement} × ${s.produit.n ?? 1}` : "",
        s.produit?.ressource ? `${t("LAKOUR_SURVIE.Objet.Produit")} : ${s.produit.n ?? 1} ${libelleRessource(s.produit.ressource).toLowerCase()}` : ""]);
      break;
    case "affliction":
      ajout("Mal", [t(`LAKOUR_SURVIE.CategoriesAffliction.${s.categorie}`), t("LAKOUR_SURVIE.Objet.Incubation", { n: s.incubation }), t("LAKOUR_SURVIE.Objet.Duree", { n: s.duree }),
        s.effets?.malus ? t("LAKOUR_SURVIE.Objet.MalusDes", { n: s.effets.malus }) : "", s.effets?.fatigue ? t("LAKOUR_SURVIE.Objet.FatigueJour", { n: s.effets.fatigue }) : "",
        s.contagion ? t("LAKOUR_SURVIE.Objet.Contagion", { n: Math.round(s.contagion * 100) }) : "", s.stade ? t(`LAKOUR_SURVIE.Afflictions.${s.stade}`) : ""]);
      ajout("Soin", s.soin ? [`${libelleCompetence(s.soin.competence ?? "soins")} (${t(`LAKOUR_SURVIE.Difficultes.${s.soin.difficulte ?? "normale"}`)})`, t("LAKOUR_SURVIE.Objet.Medicaments", { n: s.soin.medicaments ?? 0 })] : []);
      break;
    case "trait": {
      const e = s.effets ?? {};
      ajout("Effets", [...Object.entries(e.competences ?? {}).filter(([, n]) => Number(n)).map(([k, n]) => `${libelleCompetence(k)} ${n > 0 ? "+" : ""}${n}`),
        Number(e.moral) ? `${t("LAKOUR_SURVIE.Etat.moral")} ${e.moral > 0 ? "+" : ""}${e.moral}` : "", Number(e.fatigue) ? `${t("LAKOUR_SURVIE.Etat.fatigue")} +${e.fatigue}/j` : "",
        ...Object.entries(e.taches ?? {}).map(([k, n]) => `${libelleTache(k)} ${n > 0 ? "+" : ""}${n}`),
        e.peur ? t("LAKOUR_SURVIE.Objet.Peur", { lieu: e.peur.lieu ?? (e.peur.lieux ?? []).join(", ") }) : "",
        (s.incompatibles ?? []).length ? `${t("LAKOUR_SURVIE.Objet.Incompatible")} : ${s.incompatibles.map(x => defDe("traits", x)?.nom ?? x).join(", ")}` : ""]);
      ajout("Incapacites", (s.incapacites ?? []).map(x => t(`LAKOUR_SURVIE.Incapacites.${x}`)));
      break;
    }
    default: break;
  }
  return S;
}

export class FicheObjet extends HandlebarsApplicationMixin(ItemSheetV2) {
  static DEFAULT_OPTIONS = {
    classes: [ID, "survie-fiche", "survie-fiche-objet"],
    position: { width: 560, height: 640 },
    window: { resizable: true },
    form: { submitOnChange: true }
  };
  static PARTS = { fiche: { template: `${CHEMIN}/fiche-objet.hbs`, scrollable: [".survie-corps"] } };

  get isEditable() { return super.isEditable && game.user.isGM; }

  async _prepareContext(options) {
    const base = await super._prepareContext(options);
    const i = this.document;
    const textes = [];
    for (const champ of ["description", "accroche", "apprentissage", "effets", "prevention"]) {
      const v = i.system?.[champ];
      if (typeof v === "string" && v.trim()) textes.push({ champ, titre: t(`LAKOUR_SURVIE.Objet.Champs.${champ}`), html: await enrichir(v, i) });
    }
    return { ...base, objet: { id: i.id, name: i.name, img: i.img, type: t(`TYPES.Item.${i.type}`) }, editable: this.isEditable, textes, sections: sectionsObjet(i) };
  }
}
