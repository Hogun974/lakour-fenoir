// « Créer un survivant » (contrat §10.2) : tirer au sort un survivant cohérent (générateur du système), verrouiller ce qu'on garde
// (nom, âge, enfance, passé, traits), relancer le reste, ou choisir chaque élément ; le budget (somme des niveaux, réglage du MJ)
// et un aperçu : compétences avec flammes de passion, traits avec infobulles, incapacités en rouge, graine d'histoire.
// Le tirage se fait dans le navigateur (le contenu y est) ; la création réelle passe par le MJ actif (socket), qui crée l'acteur
// et en donne la propriété au joueur. Ouverte au joueur sans personnage (bouton dans la barre des acteurs, et au premier chargement).
import { ID, COMPETENCES } from "../../logique/constantes.mjs";
import * as L from "../../logique/index.mjs";
import { t, sansBalises, libelleCompetence, reglage, monSurvivant } from "../donnees.mjs";
import { lireBudget } from "../reglages.mjs";
import { CHEMIN, essayer, flammes, options } from "./commun.mjs";

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;
const contenu = () => game.lakourSurvie?.contenu?.() ?? {};
const ELEMENTS = ["nom", "age", "enfance", "passe", "traits"];

// L'état de la création (pur, éprouvé hors Foundry) : tirage, verrous, préférences.
export function nouvelleCreation() {
  return { tirage: null, verrous: { nom: false, age: false, enfance: false, passe: false, traits: false }, favoriser: [], rejoindre: true, userId: "", statut: "joueur" };
}

// Les verrous à donner au générateur d'après l'état (tout : seules les valeurs dérivées sont recalculées).
export function verrousPour(etat, { tout = false } = {}) {
  const v = {};
  const x = etat.tirage;
  if (!x) return v;
  for (const e of ELEMENTS) if (tout || etat.verrous[e]) v[e] = structuredClone(x[e]);
  return v;
}

export function tirer(etat, { tout = false } = {}) {
  const api = game.lakourSurvie;
  const favoriser = Object.fromEntries(etat.favoriser.map(c => [c, 2]));
  etat.tirage = api.generer({ verrous: verrousPour(etat, { tout }), statut: etat.statut, region: api.etat()?.groupe?.region ?? "", favoriser });
  return etat.tirage;
}

export function contexteCreation(etat) {
  const c = contenu();
  const x = etat.tirage;
  const budget = lireBudget(reglage("budgetCreation", "10-16"));
  const somme = x ? COMPETENCES.reduce((s, k) => s + (Number(x.competences?.[k]) || 0), 0) : 0;
  const def = (f, cle) => L.indexer(c)[f]?.get(cle) ?? null;
  const incap = new Set(x?.incapacites ?? []);
  const interdites = new Set([...incap, ...L.competencesInterdites(x ?? {})]);
  return {
    pret: Boolean(x), gm: game.user.isGM, verrous: etat.verrous, rejoindre: etat.rejoindre,
    nom: x?.nom ?? "", age: x?.age ?? "",
    enfances: options(L.liste(c.enfances).map(e => [e.cle, e.nom]), x?.enfance),
    passes: options(L.liste(c.passes).map(p => [p.cle, p.nom]), x?.passe),
    enfance: x?.enfance ? { nom: def("enfances", x.enfance)?.nom ?? x.enfance, aide: sansBalises(def("enfances", x.enfance)?.description ?? "") } : null,
    passe: x?.passe ? { nom: def("passes", x.passe)?.nom ?? x.passe, aide: sansBalises(def("passes", x.passe)?.description ?? ""), accroche: sansBalises(def("passes", x.passe)?.accroche ?? "") } : null,
    competences: COMPETENCES.map(k => ({ cle: k, libelle: libelleCompetence(k), niveau: Number(x?.competences?.[k]) || 0, pips: [1, 2, 3, 4, 5].map(i => ({ plein: i <= (Number(x?.competences?.[k]) || 0) })),
      flammes: flammes(x?.passions?.[k]), favori: etat.favoriser.includes(k), incapable: interdites.has(k) })),
    traits: (x?.traits ?? []).map(k => ({ cle: k, nom: def("traits", k)?.nom ?? k, aide: sansBalises(def("traits", k)?.description ?? "") })),
    traitsPossibles: options([["", t("LAKOUR_SURVIE.Creation.AjouterTrait")], ...L.liste(c.traits).filter(tr => !(x?.traits ?? []).includes(tr.cle)
      && L.compatibles(tr, x?.traits ?? [], L.indexer(c).traits)).map(tr => [tr.cle, tr.nom])], ""),
    incapacites: [...incap].map(k => t(`LAKOUR_SURVIE.Incapacites.${k}`)),
    equipement: (x?.equipement ?? []).map(k => def("equipements", k)?.nom ?? k),
    savoirs: (x?.savoirs ?? []).map(k => def("savoirs", k)?.nom ?? k),
    graine: x?.graine ?? "",
    budget: { min: budget[0], max: budget[1], somme, ok: somme >= budget[0] && somme <= budget[1] },
    joueurs: game.user.isGM ? options([["", t("LAKOUR_SURVIE.Creation.Personne")], ...game.users.filter(u => !u.isGM).map(u => [u.id, u.name])], etat.userId) : [],
    statuts: game.user.isGM ? options(L.STATUTS.map(s => [s, t(`LAKOUR_SURVIE.Statuts.${s}`)]), etat.statut) : []
  };
}

export class CreationSurvivant extends HandlebarsApplicationMixin(ApplicationV2) {
  static DEFAULT_OPTIONS = {
    id: `${ID}-creation`,
    classes: [ID, "survie-creation"],
    position: { width: 760, height: 760 },
    window: { title: "LAKOUR_SURVIE.Creation.Titre", icon: "fa-solid fa-dice-d20", resizable: true },
    actions: {
      tirer: CreationSurvivant.#tirer,
      verrou: CreationSurvivant.#verrou,
      favori: CreationSurvivant.#favori,
      retirerTrait: CreationSurvivant.#retirerTrait,
      creer: CreationSurvivant.#creer
    }
  };
  static PARTS = { corps: { template: `${CHEMIN}/creation.hbs`, scrollable: [".survie-corps"] } };

  etat = nouvelleCreation();

  async _prepareContext() {
    if (!this.etat.tirage) essayerSync(() => tirer(this.etat));
    return contexteCreation(this.etat);
  }

  async _onRender(context, options) {
    await super._onRender(context, options);
    const el = this.element;
    const sur = (sel, fn) => el.querySelector(sel)?.addEventListener("change", ev => { fn(ev.target); this.render(); });
    sur("[name=nom]", i => { this.etat.tirage.nom = i.value.trim(); this.etat.verrous.nom = Boolean(i.value.trim()); });
    sur("[name=age]", i => { this.etat.tirage.age = Number(i.value) || this.etat.tirage.age; this.etat.verrous.age = true; essayerSync(() => tirer(this.etat, { tout: true })); });
    sur("[name=enfance]", i => { this.etat.tirage.enfance = i.value; this.etat.verrous.enfance = true; essayerSync(() => tirer(this.etat, { tout: true })); });
    sur("[name=passe]", i => { this.etat.tirage.passe = i.value; this.etat.verrous.passe = true; essayerSync(() => tirer(this.etat, { tout: true })); });
    sur("[name=trait]", i => { if (!i.value) return; this.etat.tirage.traits = [...this.etat.tirage.traits, i.value]; this.etat.verrous.traits = true; essayerSync(() => tirer(this.etat, { tout: true })); });
    sur("[name=rejoindre]", i => { this.etat.rejoindre = i.checked; });
    sur("[name=joueur]", i => { this.etat.userId = i.value; });
    sur("[name=statut]", i => { this.etat.statut = i.value; });
  }

  static #tirer() { essayerSync(() => tirer(this.etat)); this.render(); }
  static #verrou(event, cible) { const e = cible.dataset.element; if (e in this.etat.verrous) this.etat.verrous[e] = !this.etat.verrous[e]; this.render(); }
  static #favori(event, cible) {
    const k = cible.dataset.competence;
    this.etat.favoriser = this.etat.favoriser.includes(k) ? this.etat.favoriser.filter(x => x !== k) : [...this.etat.favoriser, k];
    this.render();
  }
  static #retirerTrait(event, cible) {
    this.etat.tirage.traits = this.etat.tirage.traits.filter(x => x !== cible.dataset.trait);
    this.etat.verrous.traits = true;
    essayerSync(() => tirer(this.etat, { tout: true }));
    this.render();
  }
  static async #creer() {
    const x = this.etat.tirage;
    if (!x) return;
    const r = await essayer(() => game.lakourSurvie.creerSurvivant({ donnees: x, rejoindre: this.etat.rejoindre, userId: this.etat.userId, statut: game.user.isGM ? this.etat.statut : null }));
    if (!r) return;
    ui.notifications.info(t("LAKOUR_SURVIE.Creation.Cree", { nom: r.nom }));
    this.close();
    setTimeout(() => game.actors.get(r.acteurId)?.sheet?.render({ force: true }), 300);
  }
}

function essayerSync(fn) {
  try { return fn(); } catch (e) { console.warn(`${ID} | création`, e); globalThis.ui?.notifications?.error?.(String(e?.message ?? e)); return null; }
}

let fenetre = null;
export function ouvrirCreation() {
  fenetre ??= new CreationSurvivant();
  return fenetre.render({ force: true });
}

// Un joueur sans survivant vivant (et la création ouverte) ?
export const doitCreer = () => {
  if (game.user.isGM || !reglage("creationOuverte", true)) return false;
  const m = monSurvivant();
  return !m || m.system?.vivant === false || Boolean(m.system?.livide);
};
