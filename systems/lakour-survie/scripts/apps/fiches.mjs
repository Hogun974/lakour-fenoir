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
import { contexteEsprit, texteListe } from "./esprit.mjs";

const { HandlebarsApplicationMixin } = foundry.applications.api;
const { ActorSheetV2, ItemSheetV2 } = foundry.applications.sheets;
// Notes et descriptions affichées en HTML ({{{ }}}) : enrichHTML de Foundry v14 n'en retire rien (il les pose tels quels dans un
// élément : client/applications/ux/text-editor.mjs) ; le serveur les nettoie à l'écriture (htmlFields du system.json), mais une
// donnée d'avant, un compendium ou une doublure ne passent pas par lui : on nettoie donc aussi ici (foundry.utils.cleanHTML, la
// liste blanche de Foundry), avant d'enrichir.
export const nettoyerHTML = html => {
  const brut = String(html ?? "");
  const propre = globalThis.foundry?.utils?.cleanHTML;
  return typeof propre === "function" ? propre(brut) : sansBalises(brut);
};
export const enrichir = (html, doc) => foundry.applications.ux.TextEditor.implementation.enrichHTML(nettoyerHTML(html), { relativeTo: doc, secrets: doc.isOwner });
const contenu = () => game.lakourSurvie?.contenu?.() ?? {};
const defDe = (famille, cle) => L.indexer(contenu())[famille]?.get(cle) ?? null;
// Les savoirs que le groupe met au chevet (lot « corps ») : ceux des membres vivants (leurs savoirs écrits sur la fiche), et ceux
// du survivant lui-même. Hors Foundry (essais), ceux de la fiche seule.
function savoirsVus(etat, s) {
  const membres = (etat.groupe?.membres ?? []).map(id => globalThis.game?.actors?.get?.(id)).filter(a => a?.type === "survivant" && L.peutAgir(a.system));
  const objets = a => [...(a.items?.contents ?? [])].filter(i => i.type === "savoir").map(i => i.system?.cle).filter(Boolean);
  return [...new Set([...(s.savoirs ?? []), ...membres.flatMap(a => [...(a.system?.savoirs ?? []), ...objets(a)])])];
}
export const BLESSURES = ["Indemne", "Egratigne", "Blesse", "Grievement", "Mourant"];

// ------------------------------------------------------------------ survivant (contexte pur, éprouvé hors Foundry)
export function contexteSurvivant(a, { gm = false, proprietaire = false, incubations = [] } = {}) {
  const s = aPlat(a.system);
  if (gm && incubations.length) s.afflictions = [...(s.afflictions ?? []), ...incubations.filter(x => !(s.afflictions ?? []).some(y => y.cle === x.cle))];
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
  // Lot « corps » : le joueur voit des symptômes ; le nom d'un mal, seulement si le groupe le reconnaît (savoirs). Le MJ voit tout.
  const etatPartie = lireEtat();
  const vu = L.ceQueVoientLesJoueurs(s, c, { savoirs: savoirsVus(etatPartie, s), grisConnu: Boolean(etatPartie.groupe?.grisConnu), quart: Number(etatPartie.horloge?.quart) || 0 });
  const signes = cles => L.nomsSymptomes(c, cles).join(", ");
  const afflictions = gm ? (s.afflictions ?? []).map(x => {
    const def = defDe("afflictions", x.cle);
    return { cle: x.cle, nom: def?.nom ?? x.cle, stade: t(`LAKOUR_SURVIE.Afflictions.${x.stade}`), reste: x.reste, malus: x.malus, aide: sansBalises(def?.description ?? ""), traitee: x.traitee,
      signes: signes(L.symptomesAffliction(def, x.stade)) };
  }) : vu.maux.map(m => {
    const def = m.cle ? defDe("afflictions", m.cle) : null;
    const x = (s.afflictions ?? []).find(y => y.cle === m.cle) ?? {};
    return { cle: m.cle, nom: m.nom || t("LAKOUR_SURVIE.Corps.MalInconnu"), stade: t(`LAKOUR_SURVIE.Afflictions.${m.stade}`), reste: m.reconnue ? x.reste : null, malus: x.malus,
      aide: def ? sansBalises(def.description ?? "") : "", traitee: Boolean(x.traitee), signes: signes(m.symptomes) };
  });
  const veille = L.veilleDe(s);
  const sommeil = { etat: L.etatSommeil(veille), texte: t(`LAKOUR_SURVIE.Corps.Sommeil.${L.etatSommeil(veille)}`), mauvais: veille >= L.SOMMEIL.epuise, veille };
  const traits = (s.traits ?? []).map(k => { const d = defDe("traits", k); return { cle: k, nom: d?.nom ?? k, aide: sansBalises(d?.description ?? "") }; });
  const enfance = defDe("enfances", s.enfance), passe = defDe("passes", s.passe);
  const objets = type => [...(a.items?.contents ?? [])].filter(i => i.type === type).map(i => ({ id: i.id, nom: i.name, img: i.img,
    detail: type === "equipement" ? Object.entries(i.system?.bonus ?? {}).filter(([, n]) => Number(n)).map(([k, n]) => `${libelleCompetence(k)} +${n}`).join(", ") : "" }));
  const taches = options(Object.keys(L.TACHES).filter(x => L.peutFaire(s, x) || x === s.tache).map(x => [x, libelleTache(x)]), s.tache);
  return {
    acteur: { id: a.id, uuid: a.uuid, name: a.name, img: a.img }, system: s, gm, proprietaire, editable: gm || proprietaire,
    competences, etat, malus: malus.total, craque: malus.craque,
    // Le Gris : le MJ voit le stade ; le joueur, ses signes (nommés s'il le reconnaît), et rien pendant que la morsure pansée se tait.
    infection: gm && s.infection?.atteint ? { stade: s.infection.stade, pct: Math.round(s.infection.stade / 6 * 100) } : null,
    gris: !gm && vu.gris ? { signes: signes(vu.gris.symptomes), nom: vu.gris.reconnu ? t("LAKOUR_SURVIE.Corps.Gris") : t("LAKOUR_SURVIE.Corps.Fievre") } : null,
    morsure: vu.morsure ? t("LAKOUR_SURVIE.Corps.Morsure.Pansee") : "",
    sommeil,
    // Lot « sens » : l'habitude du noir (nuits passées debout sans lumière, palier).
    noir: (() => { const n = L.noirDe(s); return n.nuits > 0 ? { nuits: n.nuits, palier: t(`LAKOUR_SURVIE.Percevoir.Accoutumance.Paliers.${L.palierNoir(n.nuits)}`) } : null; })(),
    // Lot 4 « Les plans » : ce qu'il sait par cœur (le plan survit par lui).
    parCoeur: (s.plans ?? []).length ? t("LAKOUR_SURVIE.Plans.ParCoeurFiche", { plans: s.plans.map(k => L.nomDuPlan(game.lakourSurvie?.contenu?.() ?? {}, k)).join(", ") }) : "",
    afflictions, traits, incapacites: [...incap].map(k => ({ cle: k, texte: t(`LAKOUR_SURVIE.Incapacites.${k}`) })),
    enfance: enfance ? { nom: L.nomAccorde(enfance, s.genre), aide: sansBalises(enfance.description) } : s.enfance ? { nom: s.enfance, aide: "" } : null,
    passe: passe ? { nom: L.nomAccorde(passe, s.genre), aide: sansBalises(passe.description) } : s.passe ? { nom: s.passe, aide: "" } : null,
    statut: t(`LAKOUR_SURVIE.Statuts.${s.statut || "joueur"}`), age: s.age, lien: s.lien,
    mort: s.vivant === false, livide: Boolean(s.livide),
    equipement: objets("equipement"), savoirs: objets("savoir"),
    taches, tache: libelleTache(s.tache), peutChoisirTache: (gm || proprietaire) && s.vivant !== false && !s.livide,
    histoire: Boolean(game.modules?.get?.(MODULE_MJIA)?.api?.histoire?.ouvrir),
    membre: (lireEtat().groupe?.membres ?? []).includes(a.id),
    // L'esprit et le sens moral (contrat §14) : chacun voit sa couleur, les autres sa réputation (réglage du MJ).
    esprit: contexteEsprit(s, { gm, proprietaire, chef: lireEtat().groupe?.chef === a.id }, c),
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
    <p class="survie-aide">${t("LAKOUR_SURVIE.Test.AideDialogue")}</p>${game.user?.isGM ? "" : `<p class="survie-aide">${t("LAKOUR_SURVIE.Test.AideJoueurLibre")}</p>`}</div>`;
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
      histoire: FicheSurvivant.#histoire,
      tirerEsprit: FicheSurvivant.#tirerEsprit
    }
  };
  static PARTS = { fiche: { template: `${CHEMIN}/fiche-survivant.hbs`, scrollable: [".survie-corps"] } };

  async _prepareContext(options) {
    const base = await super._prepareContext(options);
    const a = this.document;
    const incubations = game.user.isGM ? game.lakourSurvie?.monde?.()?.incubations?.[a.id] ?? [] : [];
    const ctx = contexteSurvivant(a, { gm: game.user.isGM, proprietaire: a.isOwner, incubations });
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
  // Une fiche sans esprit (d'avant, ou faite à la main) : le MJ le tire.
  static async #tirerEsprit() { if (game.user.isGM) { await essayer(() => game.lakourSurvie.tirerEsprit({ acteurId: this.document.id })); this.render(); } }
}

// ------------------------------------------------------------------ abri
function porteAbri(etat, s, b) {
  const liste = L.listeALaPorte({ stocks: s.stocks ?? {}, bilan: b, personnes: b?.personnes ?? 1 });
  const visiteurs = (etat.porte ?? []).map(v => ({ nom: v.nom, demande: localiserDemande(v), apporte: Object.keys(v.apporte ?? {}).length ? texteListe(Object.entries(v.apporte).map(([ressource, manque]) => ({ ressource, manque }))) : "" }));
  return { liste: texteListe(liste), vide: !liste.length, visiteurs };
}
const localiserDemande = v => sansBalises(game.lakourSurvie?.localiser?.(v.demande) ?? v.demande?.texte ?? "");

// Lot 7 : ce que la fiche de l'abri dit du matériau et de l'entretien d'une installation. -> { materiau, entretien }
function ouvrageDeLaFiche(def, sys, quart) {
  if (!def || !(Number(sys.niveau) >= 1)) return { materiau: "", entretien: "" };
  const K = k => `LAKOUR_SURVIE.Ouvrages.${k}`;
  const materiau = t(K(`Materiaux.${L.materiauDe(def, sys.niveau)}`));
  const et = L.etatEntretien({ niveau: sys.niveau, suivi: sys.suivi }, def, Math.floor(quart / 4));
  const entretien = !et ? "" : et.encrasse ? t(K("Fiche.Encrassee")) : et.retard >= 0 ? t(K("Fiche.Due")) : t(K("Fiche.Dans"), { n: -et.retard });
  return { materiau, entretien, mauvais: Boolean(et && (et.encrasse || et.retard >= 0)) };
}

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
      categorie: t(`LAKOUR_SURVIE.Categories.${sys.categorie ?? def?.categorie ?? "vie"}`), arret: (b?.arrets ?? []).find(x => x.cle === sys.cle)?.raison ?? "", aide: sansBalises(def?.description ?? ""),
      secours: (b?.secours ?? []).some(x => x.cle === sys.cle), lontan: (def?.arbre ?? sys.arbre) === "lontan",
      // Lot 7 « Bâtir et défendre » : le matériau, l'entretien (encrassée, à soigner dans N jours ou en retard).
      ...ouvrageDeLaFiche(def, sys, Number(etat.horloge?.quart) || 0) };
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
      joursAutonomes: etat.joursAutonomes ?? 0, savoirs: b.savoirs ?? null, surpeuplement: b.surpeuplement ? t("LAKOUR_SURVIE.Abri.Surpeuplement", { n: b.surpeuplement }) : "",
      // Lot « corps » : l'hygiène (0 à 3) et l'insalubrité (propre, ordinaire, sale, insalubre).
      hygiene: Number(b.hygiene) || 0, insalubrite: t(`LAKOUR_SURVIE.Corps.Insalubrite.${L.ETATS_INSALUBRITE[Number(b.insalubrite) || 0] ?? "propre"}`), sale: Number(b.insalubrite) >= 2, production: Object.entries(b.production ?? {}).map(([r, q]) => `${libelleRessource(r)} ${q}`).join(", ") } : null,
    grille, taches: Object.keys(L.TACHES).map(x => ({ cle: x, libelle: libelleTache(x) })), gm: game.user.isGM,
    // La liste à la porte (ce qui manque vraiment, d'après les stocks) et ceux qui attendent devant (ce que le groupe voit d'eux).
    porte: courant ? porteAbri(etat, s, b) : null,
    // Les notes secrètes du MJ (monde scellé, jamais sur l'acteur que les joueurs observent).
    notesMJ: game.user.isGM ? game.lakourSurvie?.notesAbri?.(a.id) ?? "" : "", mondeOuvert: Boolean(game.lakourSurvie?.mondeOuvert?.())
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
  async _onRender(context, options) {
    await super._onRender(context, options);
    // Les notes secrètes du MJ partent au monde scellé par l'API (le formulaire de la fiche ne les envoie pas : pas de nom).
    this.element?.querySelector?.("textarea.survie-notes-mj")?.addEventListener("change", ev => {
      ev.stopPropagation();
      essayer(() => game.lakourSurvie.noterAbri({ abriId: this.document.id, notes: ev.target.value }));
    });
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
  // Lot 4 « Les plans » : l'étagère aux cahiers.
  if (e.bibliotheque?.places) l.push(t("LAKOUR_SURVIE.Plans.EtagereEffet", { places: e.bibliotheque.places }), e.bibliotheque.protege ? t("LAKOUR_SURVIE.Plans.EtagereCoffre") : "");
  if (Number(e.conditions?.delai)) l.push(t("LAKOUR_SURVIE.Objet.Delai", { n: e.conditions.delai }));
  if (e.bras?.tache) l.push(t("LAKOUR_SURVIE.Objet.Bras", { tache: libelleTache(e.bras.tache), n: e.bras.nombre ?? 1 }));
  for (const [k, n] of Object.entries(e.bonus ?? {})) if (Number(n)) l.push(`${libelleCompetence(k)} +${n}`);
  return l;
};

// Lot 4 « Les plans » : les plans qu'un papier porte, et s'il est unique.
const lignesPapier = s => {
  const c = game.lakourSurvie?.contenu?.() ?? {};
  const p = L.papierDe(s, c);
  if (!p.plans.length) return [];
  return [t("LAKOUR_SURVIE.Plans.Objet", { plans: p.plans.map(k => L.nomDuPlan(c, k)).join(", ") }), p.unique ? t("LAKOUR_SURVIE.Plans.ObjetUnique") : ""];
};

// Lot « cartes » (contrat §20) : ce que dit une carte, un calendrier, une montre (ce qu'on lit sur l'objet lui-même : l'année d'un
// calendrier, les régions et l'impression d'une carte, ce qu'on y a écrit ; rien de ce que sait le MJ).
function texteRepere(r) {
  if (!r?.type) return [];
  const R = k => `LAKOUR_SURVIE.Reperes.${k}`;
  const l = [t(R(`Types.${r.type}`))];
  if (r.type === "calendrier") {
    if (Number(r.annee)) l.push(String(r.annee));
    for (const [k, cle] of [["lunes", "AvecLunes"], ["marees", "AvecMarees"], ["fetes", "AvecFetes"]]) if (r[k]) l.push(t(R(cle)));
  }
  if (r.type === "carte") {
    const toutes = L.regionsDe(game.lakourSurvie?.contenu?.() ?? {}).length;
    const regions = Array.isArray(r.regions) ? r.regions : null;
    l.push(!regions || (toutes && regions.length >= toutes) ? t(R("ToutelIle")) : regions.map(k => defDe("regions", k)?.nom ?? k).join(", "));
    if (r.moitie) l.push(t(R(`Moitie.${r.moitie}`)));
    if (Number(r.imprimee)) l.push(t(R("Imprimee"), { annee: r.imprimee }));
    if (r.copie) l.push(t(R("Copie")));
    for (const n of Object.values(r.notes ?? {})) l.push(n);
    const a = Number.isInteger(r.annotation) ? r.annotations?.[r.annotation] : null;
    if (a?.texte) l.push(a.texte);
  }
  return l;
}

// Lot 6 « ateliers » (contrat §24) : la qualité, l'usure et le remède d'un objet ; l'atelier, le sac, les outils et les objets d'une recette.
const nomMetier = m => t(`LAKOUR_SURVIE.Metiers.${m}`);
const nomGamme = g => t(`LAKOUR_SURVIE.Gammes.${g}`);
export function texteAtelierRequis(r) {
  if (r && typeof r === "object" && r.metier) return t("LAKOUR_SURVIE.Ateliers.AtelierNiveau", { metier: nomMetier(r.metier), niveau: r.niveau ?? 1 });
  const cle = r?.cle ?? r;
  return `${defDe("installations", cle)?.nom ?? cle}${r?.niveau > 1 ? ` (${t("LAKOUR_SURVIE.Objet.Niveau")} ${r.niveau})` : ""}`;
}
function lignesOutil(s, def) {
  const x = { ...(def ?? {}), ...Object.fromEntries(Object.entries(s).filter(([, v]) => v !== "" && v !== null && v !== undefined && v !== 0 && !(Array.isArray(v) && !v.length))), usure: s.usure };
  const u = L.usagesDe(x);
  return [
    L.qualiteDe(x) ? t("LAKOUR_SURVIE.Ateliers.Fiche.Qualite", { qualite: t(`LAKOUR_SURVIE.Qualites.${L.qualiteDe(x)}`) }) : "",
    L.gammesDe(x).length ? t("LAKOUR_SURVIE.Ateliers.Fiche.Gammes", { gammes: L.gammesDe(x).map(nomGamme).join(", ") }) : "",
    u ? t("LAKOUR_SURVIE.Ateliers.Fiche.Usure", { usure: Number(x.usure) || 0, usages: u, etat: t(`LAKOUR_SURVIE.Ateliers.Etats.${L.etatOutil(x) || "bon"}`) }) : "",
    x.remise ? t("LAKOUR_SURVIE.Ateliers.Fiche.Remise") : "",
    x.parade ? t("LAKOUR_SURVIE.Ateliers.Fiche.Parade", { seuil: x.parade }) : "",
    x.remede ? t("LAKOUR_SURVIE.Ateliers.Fiche.Remede", { maux: (x.remede.afflictions ?? []).map(a => defDe("afflictions", a)?.nom ?? a).join(", "),
      remplace: x.remede.remplace ? t("LAKOUR_SURVIE.Ateliers.Fiche.Remplace") : "" }) : "",
    x.eclaire ? t("LAKOUR_SURVIE.Ateliers.Fiche.Eclaire") : ""
  ];
}
function lignesRecetteAtelier(s) {
  return [
    s.sac ? t("LAKOUR_SURVIE.Ateliers.DepuisLeSac") : "",
    s.lumiere ? t("LAKOUR_SURVIE.Ateliers.Lumiere") : "",
    (s.outils ?? []).length ? t("LAKOUR_SURVIE.Ateliers.Outils", { outils: s.outils.map(nomGamme).join(", ") }) : "",
    (s.objets ?? []).length ? t("LAKOUR_SURVIE.Ateliers.Objets", { objets: s.objets.map(o => `${o.n ?? 1} × ${defDe("equipements", o.cle)?.nom ?? o.cle}`).join(", ") }) : "",
    s.produit?.traitement ? t("LAKOUR_SURVIE.Ateliers.Traitement", { jours: s.produit.jours ?? 1 }) : ""
  ];
}

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
        ...effetsTexte(s.effets), ...lignesPapier(s), ...texteRepere(s.repere), ...lignesOutil(s, defDe("equipements", s.cle))]);
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
        s.requiert?.installation ? `${t("LAKOUR_SURVIE.Objet.Requiert")} : ${texteAtelierRequis(s.requiert.installation)}` : "",
        ...lignesRecetteAtelier(s),
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
