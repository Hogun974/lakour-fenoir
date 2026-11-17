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
import { OBJETS_FOUILLE, GENRES_FOUILLE, BETES_TROUVEES, GISEMENTS, MILIEUX, TABLES_FOUILLE, JOURNAL_FOUILLES,
  sitesAvecGenres, regionsAvecMilieux } from "./fouilles.mjs";
import { INSTALLATIONS_OUVRAGES, PLANS_OUVRAGES, TABLES_OUVRAGES, JOURNAUX_OUVRAGES, BRAS_OUVRAGES, porterOuvrages, sitesAvecPlansOuvrages } from "./ouvrages.mjs";
import { INSTALLATIONS_PARADIS, CHANTIERS_REGION, CORVEES_PARADIS, TABLES_PARADIS, JOURNAL_PARADIS, JOURNAL_ILE } from "./paradis.mjs";
import { ESPECES, INSTALLATIONS_VIVANT, BETES_SAUVAGES, TABLES_VIVANT, JOURNAL_VIVANT, vivantDesInstallations,
  completerBestiaire, captureDesEquipements, documentsAvecCapture } from "./vivant.mjs";

// Lot 7 « Bâtir et défendre » (contrat §26) : les matériaux, l'entretien et les effets de défense posés sur les installations d'avant.
porterOuvrages([...INSTALLATIONS, ...INSTALLATIONS_PLANS, ...INSTALLATIONS_HYGIENE]);
// Lot 8 « Le vivant de l'abri » (contrat §27) : la basse-cour, l'enclos à cabris, le bassin à tilapias et les ruches passent sous la règle
// du vivant (effets.vivant, l'eau de ceux qui boivent), la pluie arrose ce qui pousse à ciel ouvert ; le cochon marron a son espèce.
vivantDesInstallations(INSTALLATIONS);
completerBestiaire(BESTIAIRE);
// Fusion de la vague 3 : le matériau et l'entretien (lot 7) des installations des lots 6, 8 et 9 (OUVRAGES_DES_LOTS).
porterOuvrages([...INSTALLATIONS_ATELIERS, ...INSTALLATIONS_VIVANT, ...INSTALLATIONS_PARADIS]);

// Carte de La Réunion : une épingle par région vers sa page du journal « Les régions de l'île ».
const pagesRegions = Object.fromEntries(REGIONS.map(r => [r.cle, { entryId: idJournal("guides", CLE_JOURNAL_REGIONS), pageId: idPage("guides", CLE_JOURNAL_REGIONS, r.cle) }]));
export const SCENE_REUNION = sceneReunion(REGIONS, pagesRegions);

export const DOCUMENTS = [
  ...INSTALLATIONS, ...INSTALLATIONS_PLANS, ...INSTALLATIONS_HYGIENE, ...INSTALLATIONS_ATELIERS, ...INSTALLATIONS_OUVRAGES, ...INSTALLATIONS_VIVANT, ...INSTALLATIONS_PARADIS, ...SAVOIRS,
  ...documentsAvecCapture(EQUIPEMENTS), ...EQUIPEMENTS_PLANS, ...EQUIPEMENTS_REPERES, ...documentsAvecCapture(EQUIPEMENTS_ATELIERS),
  ...PASSES, ...RECETTES, ...RECETTES_REPERES, ...RECETTES_ATELIERS, ...AFFLICTIONS,
  ...SURVIVANTS, ...BESTIAIRE_ACTEURS,
  ...JOURNAUX, ...JOURNAUX_SAVOIRS, JOURNAL_SENS, JOURNAL_PLANS, JOURNAL_REPERES, JOURNAL_CORPS, JOURNAL_ATELIERS, JOURNAL_FOUILLES, ...JOURNAUX_OUVRAGES, JOURNAL_VIVANT, JOURNAL_PARADIS, JOURNAL_ILE,
  LIVRE_UNIVERS, ...CAMP.filter(d => d.__pack !== "tables"),
  ...LOT_AFFAIRES.journaux, ...TABLES, ...TABLES_SAVOIRS, ...LOT_AFFAIRES.tables, ...CAMP.filter(d => d.__pack === "tables"), APPELS_RADIO, ...DEMANDES, ...TABLES_ESPRIT,
  ...TABLES_SENS, ...TABLES_COMMUNAUTE, ...TABLES_PLANS, ...TABLES_REPERES, ...TABLES_CORPS, ...TABLES_ATELIERS, ...TABLES_FOUILLE, ...TABLES_OUVRAGES, ...TABLES_VIVANT, ...TABLES_PARADIS,
  SCENE_REUNION, ...CARTES_LIEUX
];

// Item -> entrée de registre à plat : { cle, nom, ...system }.
const aPlat = d => ({ nom: d.name, ...structuredClone(d.system) });

// Le registre (contrat §6 ; familles du §5 et des §9-§10).
export function donnees() {
  return {
    module: MODULE, version: 1,
    // Lot 12 : ce qu'on comprend en arrivant dans chaque région (une ligne pour le MJ, contenu/affaires.mjs).
    regions: regionsAvecMilieux(REGIONS.map(r => ({ ...r, arrivee: LOT_AFFAIRES.arrivees[r.cle] ?? "" }))),
    sites: sitesAvecGenres(sitesAvecAteliers(sitesAvecPlansOuvrages(sitesAvecPlans(SITES)))), routes: ROUTES.map(({ de, vers, ...r }) => ({ de, vers, ...r })),
    installations: [...INSTALLATIONS, ...INSTALLATIONS_PLANS, ...INSTALLATIONS_HYGIENE, ...INSTALLATIONS_ATELIERS, ...INSTALLATIONS_OUVRAGES, ...INSTALLATIONS_VIVANT, ...INSTALLATIONS_PARADIS].map(aPlat),
    savoirs: SAVOIRS.map(aPlat),
    equipements: captureDesEquipements([...EQUIPEMENTS, ...EQUIPEMENTS_PLANS, ...EQUIPEMENTS_REPERES, ...EQUIPEMENTS_ATELIERS].map(aPlat)), passes: PASSES.map(aPlat),
    recettes: [...RECETTES, ...RECETTES_REPERES, ...RECETTES_ATELIERS].map(aPlat), afflictions: AFFLICTIONS.map(aPlat),
    factions: FACTIONS, evenements: EVENEMENTS, creatures: CREATURES, bestiaire: [...BESTIAIRE, ...BETES_SAUVAGES], enfances: ENFANCES, traits: TRAITS,
    religions: RELIGIONS, ancrages: ANCRAGES,
    reputations: { paliers: PALIERS, factions: REPUTATIONS, horloges: HORLOGES_REPUTATION },
    visibilite: PALIERS_VISIBILITE.map(p => ({ ...p, table: `tables:visibilite-${p.cle}` })),
    camp: ACTIVITES_CAMP,
    recrues: { raisons: DONNEES_TABLES.raisonsRecrue, prix: DONNEES_TABLES.prixRecrue },
    histoire: { proche: DONNEES_TABLES.histoireProche, matin: DONNEES_TABLES.histoireMatin },
    noms: { prenoms: DONNEES_TABLES.prenoms, prenomsF: DONNEES_TABLES.prenomsF, prenomsM: DONNEES_TABLES.prenomsM, prenomsMixtes: DONNEES_TABLES.prenomsMixtes,
      surnoms: DONNEES_TABLES.surnoms, cyclones: DONNEES_TABLES.cyclones },
    autonomie: { voies: VOIES_AUTONOMIE, voieDefensive: VOIE_DEFENSIVE, bras: { ...BRAS, ...BRAS_OUVRAGES } },
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
    // Lot 6 « ateliers » (contrat §24) : les armes remises en état valent un peu plus que l'arme d'origine. Lot 9 (contrat §28) : les
    // corvées de la ronde s'ajoutent à celles du lot 10.
    corvees: [...CORVEES, ...CORVEES_PARADIS], bareme: { ...BAREME, objets: { ...BAREME.objets, ...BAREME_ATELIERS } },
    // Lot 4 « Les plans » (contrat §21 ; logique/plans.mjs) : les plans qu'on trouve (rareté, lieux, plans uniques) et les lieux à plans
    // rares ; les plans propres d'un site sont dans sites[].plans.
    plans: [...PLANS_REGISTRE, ...PLANS_OUVRAGES], lieuxAPlans: LIEUX_A_PLANS,
    // Lot « corps » (contrat §19) : les symptômes (nommés aux joueurs) et le Gris en six stades visibles (logique/maladies.mjs).
    symptomes: SYMPTOMES, gris: GRIS,
    // Lot 5 « fouille » (contrat §25 ; logique/fouilles.mjs) : ce que vaut un objet trouvé, les genres de lieux et leurs tables, les bêtes
    // qu'on y trouve, les gisements et les milieux de l'île (les milieux d'une région sont dans regions[].milieux, le genre d'un site
    // dans sites[].genre).
    objetsFouille: OBJETS_FOUILLE, genresFouille: GENRES_FOUILLE, betesTrouvees: BETES_TROUVEES, gisements: GISEMENTS, milieux: MILIEUX,
    // Lot 8 « Le vivant de l'abri » (contrat §27 ; logique/vivant.mjs) : les espèces élevées et ce qu'on en sait.
    especes: ESPECES,
    // Lot 9 « Le paradis et son piège » (contrat §28 ; logique/paradis.mjs) : les grands chantiers de région (rallumer l'île).
    chantiersRegion: CHANTIERS_REGION
  };

}
