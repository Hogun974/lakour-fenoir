// Tout le contenu du module lakour-fenoir : les documents des compendiums (DOCUMENTS) et le registre que le système charge
// (donnees(), écrit dans assets/donnees.json par outils/fabriquer-fenoir.mjs).
import { idJournal, idPage, MODULE } from "./aides.mjs";
import { REGIONS, SITES } from "./monde.mjs";
import { ROUTES } from "./regions.mjs";
import { INSTALLATIONS, VOIES_AUTONOMIE, VOIE_DEFENSIVE, BRAS } from "./installations.mjs";
import { SAVOIRS } from "./savoirs.mjs";
import { EQUIPEMENTS } from "./equipements.mjs";
import { PASSES } from "./passes.mjs";
import { FACTIONS } from "./factions.mjs";
import { EVENEMENTS } from "./evenements.mjs";
import { RECETTES } from "./recettes.mjs";
import { AFFLICTIONS } from "./afflictions.mjs";
import { BESTIAIRE, BESTIAIRE_ACTEURS, CREATURES } from "./bestiaire.mjs";
import { ENFANCES } from "./enfances.mjs";
import { TRAITS } from "./traits.mjs";
import { REPUTATIONS, PALIERS, HORLOGES_REPUTATION } from "./reputations.mjs";
import { APPELS_RADIO, DEMANDES } from "./appels.mjs";
import { CAMP, ACTIVITES_CAMP } from "./camp.mjs";
import { TABLES, PALIERS_VISIBILITE, DONNEES_TABLES } from "./tables.mjs";
import { JOURNAUX, CLE_JOURNAL_REGIONS } from "./journaux.mjs";
import { LIVRE_UNIVERS } from "./livre-univers.mjs";
import { SURVIVANTS } from "./survivants.mjs";
import { CARTES_LIEUX } from "./lieux-cartes.mjs";
import { COMMUNAUTES, MARCHANDS, MARCHES, FOIRES } from "./marche.mjs";
import { sceneReunion } from "./cartes.mjs";
import { FETES_FENOIR, imageSiPeinte, EFFET_FETE } from "../scripts/fetes.js";

// Carte de La Réunion : une épingle par région vers sa page du journal « Les régions de l'île ».
const pagesRegions = Object.fromEntries(REGIONS.map(r => [r.cle, { entryId: idJournal("guides", CLE_JOURNAL_REGIONS), pageId: idPage("guides", CLE_JOURNAL_REGIONS, r.cle) }]));
export const SCENE_REUNION = sceneReunion(REGIONS, pagesRegions);

export const DOCUMENTS = [
  ...INSTALLATIONS, ...SAVOIRS, ...EQUIPEMENTS, ...PASSES, ...RECETTES, ...AFFLICTIONS,
  ...SURVIVANTS, ...BESTIAIRE_ACTEURS,
  ...JOURNAUX, LIVRE_UNIVERS, ...CAMP.filter(d => d.__pack !== "tables"),
  ...TABLES, ...CAMP.filter(d => d.__pack === "tables"), APPELS_RADIO, ...DEMANDES,
  SCENE_REUNION, ...CARTES_LIEUX
];

// Item -> entrée de registre à plat : { cle, nom, ...system }.
const aPlat = d => ({ nom: d.name, ...structuredClone(d.system) });

// Le registre (contrat §6 ; familles du §5 et des §9-§10).
export function donnees() {
  return {
    module: MODULE, version: 1,
    regions: REGIONS, sites: SITES, routes: ROUTES.map(({ de, vers, ...r }) => ({ de, vers, ...r })),
    installations: INSTALLATIONS.map(aPlat), savoirs: SAVOIRS.map(aPlat), equipements: EQUIPEMENTS.map(aPlat), passes: PASSES.map(aPlat),
    recettes: RECETTES.map(aPlat), afflictions: AFFLICTIONS.map(aPlat),
    factions: FACTIONS, evenements: EVENEMENTS, creatures: CREATURES, bestiaire: BESTIAIRE, enfances: ENFANCES, traits: TRAITS,
    reputations: { paliers: PALIERS, factions: REPUTATIONS, horloges: HORLOGES_REPUTATION },
    visibilite: PALIERS_VISIBILITE.map(p => ({ ...p, table: `tables:visibilite-${p.cle}` })),
    camp: ACTIVITES_CAMP,
    recrues: { raisons: DONNEES_TABLES.raisonsRecrue, prix: DONNEES_TABLES.prixRecrue },
    histoire: { proche: DONNEES_TABLES.histoireProche, matin: DONNEES_TABLES.histoireMatin },
    noms: { prenoms: DONNEES_TABLES.prenoms, prenomsF: DONNEES_TABLES.prenomsF, prenomsM: DONNEES_TABLES.prenomsM, prenomsMixtes: DONNEES_TABLES.prenomsMixtes,
      surnoms: DONNEES_TABLES.surnoms, cyclones: DONNEES_TABLES.cyclones },
    autonomie: { voies: VOIES_AUTONOMIE, voieDefensive: VOIE_DEFENSIVE, bras: BRAS },
    fetes: FETES_FENOIR.map(f => ({ ...f, image: imageSiPeinte(f.cle), effet: f.effet ?? EFFET_FETE })),
    // Le marché (contenu/marche.mjs ; logique systems/lakour-survie/logique/marche.mjs) : les cibles des préjugés, les gens du
    // marché (avec leurs préjugés), des marchés forains possibles, les foires de saison.
    communautes: COMMUNAUTES, marchands: MARCHANDS, marches: MARCHES, foires: FOIRES
  };
}
