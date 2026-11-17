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
import { AFFLICTIONS, SYMPTOMES, GRIS } from "./afflictions.mjs";
import { INSTALLATIONS_HYGIENE, TABLES_CORPS, JOURNAL_CORPS } from "./hygiene.mjs";
import { BESTIAIRE, BESTIAIRE_ACTEURS, CREATURES } from "./bestiaire.mjs";
import { ENFANCES } from "./enfances.mjs";
import { TRAITS } from "./traits.mjs";
import { RELIGIONS, ANCRAGES } from "./religions.mjs";
import { TABLES_ESPRIT } from "./esprit.mjs";
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
import { DEPOTS_CYCLONE, GRAMOUNES, TABLES_SAVOIRS, JOURNAUX_SAVOIRS } from "./deux-savoirs.mjs";
import { HISTOIRES } from "./histoires.mjs";
import { TABLES_SENS, JOURNAL_SENS } from "./sens.mjs";
import { EQUIPEMENTS_REPERES, RECETTES_REPERES, TABLES_REPERES, JOURNAL_REPERES } from "./reperes.mjs";
import { FETES_FENOIR, imageSiPeinte, EFFET_FETE } from "../scripts/fetes.js";
import { LOT_AFFAIRES } from "./affaires.mjs";
import { CORVEES, BAREME, TABLES_COMMUNAUTE } from "./communaute.mjs";
import { INSTALLATIONS_PLANS, EQUIPEMENTS_PLANS, PLANS_REGISTRE, LIEUX_A_PLANS, TABLES_PLANS, JOURNAL_PLANS, sitesAvecPlans } from "./plans.mjs";
import { INSTALLATIONS_ATELIERS, EQUIPEMENTS_ATELIERS, BAREME_ATELIERS, TABLES_ATELIERS, JOURNAL_ATELIERS, sitesAvecAteliers } from "./ateliers.mjs";
import { RECETTES_ATELIERS } from "./recettes-3d.mjs";

// Carte de La Réunion : une épingle par région vers sa page du journal « Les régions de l'île ».
const pagesRegions = Object.fromEntries(REGIONS.map(r => [r.cle, { entryId: idJournal("guides", CLE_JOURNAL_REGIONS), pageId: idPage("guides", CLE_JOURNAL_REGIONS, r.cle) }]));
export const SCENE_REUNION = sceneReunion(REGIONS, pagesRegions);

export const DOCUMENTS = [
  ...INSTALLATIONS, ...INSTALLATIONS_PLANS, ...INSTALLATIONS_HYGIENE, ...INSTALLATIONS_ATELIERS, ...SAVOIRS, ...EQUIPEMENTS, ...EQUIPEMENTS_PLANS, ...EQUIPEMENTS_REPERES, ...EQUIPEMENTS_ATELIERS,
  ...PASSES, ...RECETTES, ...RECETTES_REPERES, ...RECETTES_ATELIERS, ...AFFLICTIONS,
  ...SURVIVANTS, ...BESTIAIRE_ACTEURS,
  ...JOURNAUX, ...JOURNAUX_SAVOIRS, JOURNAL_SENS, JOURNAL_PLANS, JOURNAL_REPERES, JOURNAL_CORPS, JOURNAL_ATELIERS, LIVRE_UNIVERS, ...CAMP.filter(d => d.__pack !== "tables"),
  ...LOT_AFFAIRES.journaux, ...TABLES, ...TABLES_SAVOIRS, ...LOT_AFFAIRES.tables, ...CAMP.filter(d => d.__pack === "tables"), APPELS_RADIO, ...DEMANDES, ...TABLES_ESPRIT,
  ...TABLES_SENS, ...TABLES_COMMUNAUTE, ...TABLES_PLANS, ...TABLES_REPERES, ...TABLES_CORPS, ...TABLES_ATELIERS,
  SCENE_REUNION, ...CARTES_LIEUX
];

// Item -> entrée de registre à plat : { cle, nom, ...system }.
const aPlat = d => ({ nom: d.name, ...structuredClone(d.system) });

// Le registre (contrat §6 ; familles du §5 et des §9-§10).
export function donnees() {
  return {
    module: MODULE, version: 1,
    // Lot 12 : ce qu'on comprend en arrivant dans chaque région (une ligne pour le MJ, contenu/affaires.mjs).
    regions: REGIONS.map(r => ({ ...r, arrivee: LOT_AFFAIRES.arrivees[r.cle] ?? "" })), sites: sitesAvecAteliers(sitesAvecPlans(SITES)), routes: ROUTES.map(({ de, vers, ...r }) => ({ de, vers, ...r })),
    installations: [...INSTALLATIONS, ...INSTALLATIONS_PLANS, ...INSTALLATIONS_HYGIENE, ...INSTALLATIONS_ATELIERS].map(aPlat), savoirs: SAVOIRS.map(aPlat),
    equipements: [...EQUIPEMENTS, ...EQUIPEMENTS_PLANS, ...EQUIPEMENTS_REPERES, ...EQUIPEMENTS_ATELIERS].map(aPlat), passes: PASSES.map(aPlat),
    recettes: [...RECETTES, ...RECETTES_REPERES, ...RECETTES_ATELIERS].map(aPlat), afflictions: AFFLICTIONS.map(aPlat),
    factions: FACTIONS, evenements: EVENEMENTS, creatures: CREATURES, bestiaire: BESTIAIRE, enfances: ENFANCES, traits: TRAITS,
    religions: RELIGIONS, ancrages: ANCRAGES,
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
    communautes: COMMUNAUTES, marchands: MARCHANDS, marches: MARCHES, foires: FOIRES,
    // Lot « savoirs » : ce que le cyclone dépose dans la cour (lu par la logique) ; les gramounes qu'on peut accueillir.
    depotsCyclone: DEPOTS_CYCLONE, gramounes: GRAMOUNES,
    // Lot 11 « histoires » (§16) : les phrases d'histoire des survivants, tirées par le générateur (logique/histoires.mjs).
    histoires: HISTOIRES,
    // Lot 12 « Affaires, récits et fêtes » (contrat §17) : les affaires de l'île, lues par la logique (logique/affaires.mjs) et le MJ IA.
    affaires: LOT_AFFAIRES.affaires,
    // Lot 10 (contrat §22) : les corvées de la table de gestion (logique/gestion.mjs) et le barème des objets en parts (marche.mjs).
    // Lot 6 « ateliers » (contrat §24) : les armes remises en état valent un peu plus que l'arme d'origine.
    corvees: CORVEES, bareme: { ...BAREME, objets: { ...BAREME.objets, ...BAREME_ATELIERS } },
    // Lot 4 « Les plans » (contrat §21 ; logique/plans.mjs) : les plans qu'on trouve (rareté, lieux, plans uniques) et les lieux à plans
    // rares ; les plans propres d'un site sont dans sites[].plans.
    plans: PLANS_REGISTRE, lieuxAPlans: LIEUX_A_PLANS,
    // Lot « corps » (contrat §19) : les symptômes (nommés aux joueurs) et le Gris en six stades visibles (logique/maladies.mjs).
    symptomes: SYMPTOMES, gris: GRIS
  };
}
