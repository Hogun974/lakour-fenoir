// Modèles de données (TypeDataModel) des acteurs et objets, conformes au contrat (§3.1 à §3.4, §9, §10.1) et à ce que le contenu
// de lakour-fenoir compile dans ses compendiums (src/). Extensions (sans effet si on les laisse vides) : survivant.afflictions,
// savoirs, joursTache, tacheDepuis, joursSansPassion, joursMoralZero, enseigne (logique, docs/survie-notes-logique.md) ;
// installation.termineLe, actif ; affliction.stade, reste (l'instance portée par un survivant) ; survivant.prejuges et
// equipement.marque (le marché, 2026-11-13 : marche.mjs).
import { COMPETENCES, RESSOURCES, NATURE } from "../logique/constantes.mjs";

const { fields } = foundry.data;
const texte = (initial = "") => new fields.StringField({ required: true, blank: true, initial });
const html = () => new fields.HTMLField({ required: true, blank: true, initial: "" });
const entier = (initial = 0, min = 0, max = undefined) => new fields.NumberField({ required: true, nullable: false, integer: true, min, max, initial });
const relatif = (initial = 0) => new fields.NumberField({ required: true, nullable: false, integer: true, initial });
const nombre = (initial = 0, min = 0) => new fields.NumberField({ required: true, nullable: false, min, initial });
const nombreNul = () => new fields.NumberField({ required: false, nullable: true, initial: null });
const bool = (initial = false) => new fields.BooleanField({ initial });
const cles = () => new fields.ArrayField(new fields.StringField({ blank: false }));
const objetLibre = (initial = {}) => new fields.ObjectField({ required: true, initial });
const objetNul = () => new fields.ObjectField({ required: false, nullable: true, initial: null });
const cle = () => texte();

// ------------------------------------------------------------------ acteurs
export class ModeleSurvivant extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    return {
      competences: new fields.SchemaField(Object.fromEntries(COMPETENCES.map(c => [c, new fields.SchemaField({ niveau: entier(0, 0, 5), marques: nombre(0) })]))),
      blessures: entier(0, 0, 4),
      fatigue: entier(0, 0, 5),
      moral: entier(4, 0, 5),
      faim: entier(0),
      soif: entier(0),
      infection: new fields.SchemaField({ atteint: bool(false), stade: entier(0, 0, 6), depuis: relatif(0) }),
      afflictions: new fields.ArrayField(new fields.ObjectField()),
      enfance: texte(),
      passe: texte(),
      genre: texte(), // "f", "m" ou "" : accorde le libellé de l'enfance et du passé (nomAccorde)
      passions: new fields.SchemaField(Object.fromEntries(COMPETENCES.map(c => [c, entier(0, 0, 2)]))),
      traits: cles(),
      incapacites: cles(),
      savoirs: cles(),
      statut: texte("joueur"),
      tache: texte(),
      joursTache: entier(0),
      tacheDepuis: relatif(0),
      joursSansPassion: entier(0),
      joursMoralZero: entier(0),
      enseigne: new fields.SchemaField({ eleve: texte(), competence: texte() }),
      histoire: new fields.SchemaField({ journal: texte() }),
      age: entier(30, 0, 120),
      lien: texte(),
      vivant: bool(true),
      livide: bool(false),
      charge: nombre(0),
      // Les préjugés d'un PNJ (marche.mjs) : [{ cible, poids 1..3, dit, echanges, fetes, dementis }] ; vide pour tous les autres.
      prejuges: new fields.ArrayField(new fields.ObjectField()),
      notes: html()
    };
  }

  // Les barres des jetons : vitalité (4 − blessures) et forces (5 − fatigue).
  prepareDerivedData() {
    super.prepareDerivedData?.();
    this.vitalite = { value: Math.max(0, 4 - (Number(this.blessures) || 0)), max: 4 };
    this.forces = { value: Math.max(0, 5 - (Number(this.fatigue) || 0)), max: 5 };
  }
}

export class ModeleAbri extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    return {
      site: texte(),
      region: texte(),
      installeLe: relatif(0),
      abandonneLe: nombreNul(),
      stocks: new fields.SchemaField(Object.fromEntries(RESSOURCES.map(r => [r, entier(0)]))),
      nature: new fields.SchemaField(Object.fromEntries(NATURE.map(n => [n, nombre(0)]))),
      sol: nombre(0),
      bruit: entier(0, 0, 10),
      degats: entier(0),
      reparation: nombre(0),
      reliquats: new fields.SchemaField(Object.fromEntries(RESSOURCES.map(r => [r, nombre(0)]))),
      notes: html()
    };
  }
}

// ------------------------------------------------------------------ objets
export class ModeleInstallation extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    return {
      cle: cle(),
      categorie: texte("vie"),
      description: html(),
      niveau: entier(0),
      niveauMax: entier(1),
      chantier: new fields.SchemaField({ fait: nombre(0), requis: nombre(0) }),
      etat: entier(0, 0, 3),
      reparation: nombre(0),
      niveaux: new fields.ArrayField(new fields.ObjectField()),
      termineLe: relatif(0),
      actif: bool(true)
    };
  }
}

export class ModeleSavoir extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    return { cle: cle(), description: html(), apprentissage: html(), effets: html() };
  }
}

export class ModeleEquipement extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    return {
      cle: cle(), categorie: texte("outil"), description: html(), bonus: objetLibre({}), charge: nombre(0), usure: nombre(0),
      munitions: nombreNul(), bruit: nombre(0), transport: objetNul(), effets: objetNul(),
      marque: texte()   // le signe d'une communauté sur l'objet (marche.mjs, reclamerObjet) : vide = pas marqué
    };
  }
}

export class ModelePasse extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    return {
      cle: cle(), description: html(), competences: objetLibre({}), savoirs: cles(), equipement: cles(), accroche: html(),
      region: texte(), incapacites: cles(), histoire: new fields.ArrayField(new fields.StringField()),
      genre: texte(), nomAutre: texte()
    };
  }
}

export class ModeleRecette extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    return {
      cle: cle(), description: html(), cout: objetLibre({}), travail: nombre(1), competence: texte("bricolage"), difficulte: texte("normale"),
      requiert: objetLibre({ savoirs: [], installation: null }), produit: objetLibre({})
    };
  }
}

export class ModeleAffliction extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    return {
      cle: cle(), categorie: texte("maladie"), description: html(), prevention: html(), contagion: nombre(0), incubation: nombre(0), duree: nombre(1),
      effets: objetLibre({}), soin: objetLibre({}), aggravation: objetNul(),
      declencheur: new fields.StringField({ required: false, nullable: true, blank: true, initial: null }), risque: nombre(0),
      stade: texte(), reste: nombre(0)
    };
  }
}

export class ModeleEnfance extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    return {
      cle: cle(), origine: texte("reunion"), region: texte(), description: html(), modificateurs: objetLibre({}), savoirs: cles(), incapacites: cles(),
      equipement: cles(), histoire: new fields.ArrayField(new fields.StringField()), poids: nombre(1), genre: texte(), nomAutre: texte()
    };
  }
}

export class ModeleTrait extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    return { cle: cle(), description: html(), effets: objetLibre({}), incompatibles: cles(), incapacites: cles(), poids: nombre(1) };
  }
}

export const MODELES_ACTEURS = { survivant: ModeleSurvivant, abri: ModeleAbri };
export const MODELES_OBJETS = {
  installation: ModeleInstallation, savoir: ModeleSavoir, equipement: ModeleEquipement, passe: ModelePasse, recette: ModeleRecette,
  affliction: ModeleAffliction, enfance: ModeleEnfance, trait: ModeleTrait
};
