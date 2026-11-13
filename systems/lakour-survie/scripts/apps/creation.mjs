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
import { optionsRegards, optionsReligions, optionsReligionsMultiples, optionsAncrages, jaugeSens, libelleFoi, aideFoi } from "./esprit.mjs";

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;
const contenu = () => game.lakourSurvie?.contenu?.() ?? {};
const ELEMENTS = ["nom", "age", "enfance", "passe", "traits"];
// L'esprit que le joueur choisit avant de valider (la religion ou l'ancrage, sa pratique, son regard) : gardé aux relances.
const ESPRIT = ["regard", "religion", "religions", "pratique", "ancrage"];

// L'état de la création (pur, éprouvé hors Foundry) : tirage, verrous, préférences.
export function nouvelleCreation() {
  return { tirage: null, verrous: { nom: false, age: false, enfance: false, passe: false, traits: false, esprit: false }, favoriser: [], rejoindre: true, userId: "", statut: "joueur" };
}

// Les verrous à donner au générateur d'après l'état (tout : seules les valeurs dérivées sont recalculées).
export function verrousPour(etat, { tout = false } = {}) {
  const v = {};
  const x = etat.tirage;
  if (!x) return v;
  for (const e of ELEMENTS) if (tout || etat.verrous[e]) v[e] = structuredClone(x[e]);
  if (etat.verrous.esprit) for (const e of ESPRIT) if (x[e] !== undefined) v[e] = structuredClone(x[e]);
  if (tout && x.genre) v.genre = x.genre; // le genre du tirage suit le nom gardé
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
    nom: x?.nom ?? "", age: x?.age ?? "", genre: x?.genre ?? "",
    // Les listes sont accordées au genre du tirage (« Agriculteur des Hauts » pour un homme), comme les libellés affichés.
    enfances: options(L.liste(c.enfances).map(e => [e.cle, L.nomAccorde(e, x?.genre)]), x?.enfance),
    passes: options(L.liste(c.passes).map(p => [p.cle, L.nomAccorde(p, x?.genre)]), x?.passe),
    enfance: x?.enfance ? { nom: L.nomAccorde(def("enfances", x.enfance), x.genre) || x.enfance, aide: sansBalises(def("enfances", x.enfance)?.description ?? "") } : null,
    passe: x?.passe ? { nom: L.nomAccorde(def("passes", x.passe), x.genre) || x.passe, aide: sansBalises(def("passes", x.passe)?.description ?? ""), accroche: sansBalises(def("passes", x.passe)?.accroche ?? "") } : null,
    competences: COMPETENCES.map(k => ({ cle: k, libelle: libelleCompetence(k), niveau: Number(x?.competences?.[k]) || 0, pips: [1, 2, 3, 4, 5].map(i => ({ plein: i <= (Number(x?.competences?.[k]) || 0) })),
      flammes: flammes(x?.passions?.[k]), favori: etat.favoriser.includes(k), incapable: interdites.has(k) })),
    traits: (x?.traits ?? []).map(k => ({ cle: k, nom: def("traits", k)?.nom ?? k, aide: sansBalises(def("traits", k)?.description ?? "") })),
    traitsPossibles: options([["", t("LAKOUR_SURVIE.Creation.AjouterTrait")], ...L.liste(c.traits).filter(tr => !(x?.traits ?? []).includes(tr.cle)
      && L.compatibles(tr, x?.traits ?? [], L.indexer(c).traits)).map(tr => [tr.cle, tr.nom])], ""),
    incapacites: [...incap].map(k => t(`LAKOUR_SURVIE.Incapacites.${k}`)),
    equipement: (x?.equipement ?? []).map(k => def("equipements", k)?.nom ?? k),
    savoirs: (x?.savoirs ?? []).map(k => def("savoirs", k)?.nom ?? k),
    graine: x?.graine ?? "",
    // L'esprit : regard, religion (ou ancrage) et pratique se choisissent ; la couleur (sens moral) et l'autorité se voient.
    esprit: x ? {
      regards: optionsRegards(x.regard, false), religions: optionsReligions(x.religion, c, false), plusieurs: x.religion === L.RELIGION_PLUSIEURS,
      religionsMultiples: optionsReligionsMultiples(x.religions, c), sansReligion: !x.religion || x.religion === L.RELIGION_AUCUNE,
      ancrages: optionsAncrages(x.ancrage, c), pratique: Boolean(x.pratique), foi: libelleFoi(x, c), aideFoi: aideFoi(x, c),
      regardAide: x.regard ? t(`LAKOUR_SURVIE.Regards.Aide.${x.regard}`) : "",
      sens: jaugeSens(x.sensMoral), autorite: Number(x.autorite ?? L.AUTORITE.defaut), verrou: Boolean(etat.verrous.esprit)
    } : null,
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
    sur("[name=nom]", i => {
      this.etat.tirage.nom = i.value.trim(); this.etat.verrous.nom = Boolean(i.value.trim());
      // Un nouveau nom donne son genre (prénoms du contenu), ou l'oublie ; les libellés affichés suivent.
      this.etat.tirage.genre = L.genreDuNom(contenu(), this.etat.tirage.nom);
    });
    sur("[name=age]", i => { this.etat.tirage.age = Number(i.value) || this.etat.tirage.age; this.etat.verrous.age = true; essayerSync(() => tirer(this.etat, { tout: true })); });
    sur("[name=enfance]", i => { this.etat.tirage.enfance = i.value; this.etat.verrous.enfance = true; essayerSync(() => tirer(this.etat, { tout: true })); });
    sur("[name=passe]", i => { this.etat.tirage.passe = i.value; this.etat.verrous.passe = true; essayerSync(() => tirer(this.etat, { tout: true })); });
    sur("[name=trait]", i => { if (!i.value) return; this.etat.tirage.traits = [...this.etat.tirage.traits, i.value]; this.etat.verrous.traits = true; essayerSync(() => tirer(this.etat, { tout: true })); });
    // L'esprit : modifié sur place (la couleur et l'autorité du tirage restent), puis gardé aux relances.
    const esprit = (champ, valeur) => { this.etat.tirage[champ] = valeur; this.etat.verrous.esprit = true; };
    sur("[name=regard]", i => esprit("regard", i.value));
    sur("[name=religion]", i => {
      esprit("religion", i.value);
      if (i.value === L.RELIGION_PLUSIEURS && (this.etat.tirage.religions ?? []).length < 2) {
        const x = this.etat.tirage;
        this.etat.tirage.religions = L.tirerEsprit(contenu(), Math.random, { traits: x.traits, competences: x.competences, age: x.age, enfance: x.enfance, verrous: { religion: L.RELIGION_PLUSIEURS } }).religions;
      } else if (i.value !== L.RELIGION_PLUSIEURS) this.etat.tirage.religions = [];
      if (i.value && i.value !== L.RELIGION_AUCUNE) this.etat.tirage.ancrage = "";
    });
    sur("[name=religions]", i => esprit("religions", [...i.selectedOptions].map(o => o.value)));
    sur("[name=ancrage]", i => esprit("ancrage", i.value));
    sur("[name=pratique]", i => esprit("pratique", i.checked));
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
