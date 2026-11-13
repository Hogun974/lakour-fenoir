// L'abri et ses installations (contrat §1.6, §1.7, §3.1, §3.2, §3.3). Logique pure : rien n'est modifié en place.
//
// Une installation de l'abri (objet incorporé, « instance ») : { cle, niveau (0 = en chantier), etat 0..3,
// chantier: { fait, requis }, termineLe: jour où le niveau courant a été achevé, actif: Boolean (défaut vrai : un groupe
// électrogène qu'on éteint, par exemple) }. Sa définition (contenu) donne `niveaux[niveau − 1]` : les effets du niveau COURANT
// décrivent toute l'installation à ce niveau (ils ne s'additionnent pas aux niveaux inférieurs).
//
// Nombres retenus :
// - État : facteur de production 1 / 0,75 / 0,5 / 0 (0 intacte … 3 hors service). Hors service : ne compte plus que pour la
//   capacité et le stockage.
// - Pluie : production × climat.pluie × (1 en saison des pluies, 0,5 en saison sèche).
// - Soleil : production × climat.soleil × (1 en saison des pluies, 0,8 en saison sèche) × soleil du site / 3.
// - Rivière : production seulement si le site a une rivière. Délai : rien avant `delai` jours après la PREMIÈRE mise en
//   service (`termineLe`, posé quand le niveau 1 s'achève : agrandir un potager ne remet pas les récoltes à zéro).
// - Eau du site, sans installation : rivière 12 par jour, source 8, puits 5, petite citerne 1 × pluie ; réseau d'eau tant
//   qu'il marche dans la région (conditions.reseaux.eau, site « reseau ») : 60. Électricité du réseau tant qu'elle marche
//   (conditions.reseaux.electricite, tout site sauf tunnel de lave et galerie) : 20 kWh par jour.
// - Eau traitée (pour les maladies, maladies.mjs) : une installation en marche à effet `eauTraitee` (filtre, bouilleur), ou le
//   réseau public encore là sur un site « reseau ».
// - Sol : les installations qui demandent du sol (cultures) produisent × (0,5 + 0,5 × sol restant / sol du site), au plus × 1,25
//   (compost) ; elles usent le sol de 0,004 par niveau et par jour ; le compost (`effets.sol`) en rend chaque jour. Sol 0..3.
// - Énergie disponible = stock (batteries) + production du jour. Si elle manque, les installations consommatrices s'arrêtent
//   dans l'ordre ORDRE_DELESTAGE (confort d'abord, eau en dernier) ; même règle pour le carburant (groupe électrogène), pour
//   l'eau des installations (les personnes boivent d'abord) et pour leur nourriture (les chiens de garde mangent après les
//   personnes ; sans restes, ils ne gardent plus). Une installation arrêtée ne garde que défense, discrétion, capacité,
//   protection cyclonique et stockage.
// - Production du jour : arrondie à l'entier ; une production de moins d'une demi-unité par jour (les médicaments des ruches ou
//   de l'infirmerie) s'accumule d'un jour à l'autre dans `abri.reliquats` et donne une unité chaque fois qu'elle en fait une.
// - Visibilité = ceil(personnes / 2) + visibilité des installations en marche − discrétion totale, bornée 0..10.
//   Défense = défense du site + installations − floor(dégâts / 2).
// - Plans (§3.3) : reconstruire une installation déjà construite coûte 25 % de ressources en moins (arrondi au supérieur sur
//   le reste : 3 → 3, 4 → 3, 10 → 8) et la moitié du travail (arrondi au supérieur).
// - Réparation : 1 point d'état coûte max(1, ceil(travail du niveau / 4)) quarts-personne et 1 matériau ; un point de dégâts de
//   l'abri coûte 2 quarts-personne et 1 matériau. Le travail qui ne finit pas un point s'accumule (`reparation` de l'instance ou
//   de l'abri, au plus un point d'avance s'il manque le matériau) : un survivant seul qui répare un quart par jour finit par y
//   arriver ; une installation (ou un abri) remise à neuf n'en garde rien.
// - Nature des alentours : régénération par jour vers le plafond = rendement × (cueillette 0,25, gibier 0,15, pêche 0,25,
//   bois 0,2) ; cueillette × 0,7 en saison sèche et × bonus des fruits (1,25 en novembre, 1,5 en décembre-janvier).
// - Cyclone : dégâts = force − protection cyclonique (si positif) ; chaque installation exposée (eau, nourriture, énergie,
//   défense) prend 1 point d'état avec 25 % de chances par point de dégâts.
// - Événement du contenu qui touche l'abri (§2.6, subirEvenementAbri) : stocks perdus (jamais sous 0) et dégâts appliqués ;
//   moral, blessures, trouvailles rendus au MJ, à raconter.
// - Bonus d'installation (`effets.bonus`, tour de guet : vigilance) : le meilleur des installations pas hors service (bilan.bonus).
//
// Lot « savoirs » (docs/equilibre-savoirs.md, contrat §11) :
// - Installations sœurs : une installation à l'ancienne (`arbre: "lontan"`) porte `role` = la clé de sa sœur moderne (ou un rôle
//   commun : « eau-chaude ») et un `rang` (défaut 0, 1 pour une lontan : la moderne passe d'abord). Deux sœurs ne s'additionnent
//   pas : chaque jour, seule la première (par rang) qui peut marcher est en service ; les autres attendent en secours
//   (`bilan.secours`), sans rien produire ni consommer, sans défense ni visibilité ; leur stockage et leur capacité restent.
//   Une sœur hors service, éteinte ou arrêtée faute de carburant, de gaz, d'énergie, d'eau ou de nourriture laisse la place à la
//   suivante : le feu de bois quand le gaz manque, les gouttières de bambou quand la citerne est cassée.
// - Gaz (`consommation.gaz`) : servi comme le carburant, par ordre de priorité ; ce qui en manque s'arrête.
// - Matières de l'île (coût `ile`) : prises sur le bois des alentours de l'abri (`abri.nature.bois`), qui repousse ; une
//   installation lontan se répare avec elles au lieu de matériaux.
// - Végétation abattue par un cyclone (`abri.vegetation: { n, depuis }`) : visibilité + n, −1 tous les 15 jours.
// - Veillée à la lumière (`abri.lumiereLe` = le jour) : visibilité +1 ce jour-là (lire le soir se voit de loin).
// - Un chien du groupe présent (`conditions.chien`) : moral +1 (sauf si des chiens de garde sont déjà en service) et
//   vigilance +1 comme une installation ; des objets de confort (`conditions.confort` : leurs `effets.moral`) : moral +1 au plus.
// - Boutures (journeeAbri) : replantées chaque jour dans un potager ou un jardin en service (elles deviennent des graines),
//   sinon un tiers meurt (au supérieur).
// - Alentours au-dessus du plafond (bois et fruits tombés d'un cyclone) : le surplus se perd chaque jour (POURRISSEMENT).
import { ORDRE_DELESTAGE, RESSOURCES, NATURE, SEUIL_AUTONOMIE, COUT_ILE, borner } from "./constantes.mjs";
import { installationDe, regionDe, siteDe, niveauDe, niveauMaxDe, natureRegion, indexer } from "./contenu.mjs";
import { consommationJour, pertesJour, plafonds, joursDeStocks, normaliserStocks, journeeStocks, couvre, retirerStocks } from "./ressources.mjs";
import { saisonDuJour, bonusFruits, dateDuJour } from "./temps.mjs";
import { facteurBras } from "./generation.mjs";
import { message } from "./textes.mjs";
import { tirerPoids } from "./hasard.mjs";

export const FACTEUR_ETAT = [1, 0.75, 0.5, 0];
export const SAISON_PLUIE = { pluies: 1, seche: 0.5 };
export const SAISON_SOLEIL = { pluies: 1, seche: 0.8 };
export const USURE_SOL = 0.004;
export const SOL_MAX = 3;
export const PLANS = { ressources: 0.75, travail: 0.5 };
export const REGENERATION_NATURE = { cueillette: 0.25, gibier: 0.15, peche: 0.25, bois: 0.2 };
export const SAISON_CUEILLETTE = { pluies: 1, seche: 0.7 };
export const CATEGORIES_EXPOSEES = ["eau", "nourriture", "energie", "defense"];
export const TRAVAIL_DEGAT = 2;
export const EAU_SITE = { riviere: 12, source: 8, puits: 5, citerne: 1, reseau: 0, aucune: 0 };
export const RESEAU_PUBLIC = { eau: 60, electricite: 20 };
const SITES_SANS_COURANT = ["tunnel-de-lave", "galerie"];
// Lot « savoirs ».
export const POURRISSEMENT = { cueillette: 0.25, gibier: 0.1, peche: 0.1, bois: 0.03 };   // part du surplus perdue par jour
export const VEGETATION_REPOUSSE = 15;          // jours pour regagner 1 de visibilité après un cyclone
export const BOUTURES_PERTE = 1 / 3;            // part des boutures qui meurt chaque jour sans jardin
export const JARDINS = ["potager", "jardin-creole", "serre", "verger"];   // où l'on repique les boutures
export const CONFORT_MAX = 1;                   // moral des objets de confort
// Le rôle et le rang d'une installation (sœurs) : rôle = sa propre clé par défaut ; rang 0, 1 pour une lontan.
export const roleDe = def => def?.role || def?.cle || "";
export const rangDe = def => (Number.isFinite(Number(def?.rang)) ? Number(def.rang) : def?.arbre === "lontan" ? 1 : 0);
export const vegetationAbattue = (abri, jour = 0) => {
  const v = abri?.vegetation;
  if (!v || !(Number(v.n) > 0)) return 0;
  return Math.max(0, Number(v.n) - Math.floor(Math.max(0, Number(jour) - Number(v.depuis ?? 0)) / VEGETATION_REPOUSSE));
};

export function instanceInstallation(cle, niveau = 0, extra = {}) {
  return { cle, niveau, etat: 0, chantier: { fait: 0, requis: 0 }, termineLe: 0, actif: true, ...extra };
}

const effetsDe = (def, niveau) => niveauDe(def, niveau)?.effets ?? {};
const demandeSol = (def, niveau) => Number(niveauDe(def, niveau)?.requiert?.site?.sol ?? 0) > 0;
const prioriteDelestage = categorie => {
  const i = ORDRE_DELESTAGE.indexOf(categorie);
  return i < 0 ? ORDRE_DELESTAGE.length : i;
};

// Le cadre d'un bilan : région, site, saison, climat du jour.
function cadre(abri, contenu, conditions = {}) {
  const site = siteDe(contenu, abri?.site) ?? conditions.site ?? {};
  const region = regionDe(contenu, abri?.region ?? site.region) ?? conditions.region ?? {};
  const jour = Number(conditions.jour ?? 0);
  const saison = conditions.saison ?? saisonDuJour(jour, conditions.dateDepart);
  const climat = { soleil: Number(conditions.meteo?.soleil ?? region.climat?.soleil ?? 0), pluie: Number(conditions.meteo?.pluie ?? region.climat?.pluie ?? 0) };
  return { site, region, jour, saison, climat, personnes: Math.max(0, Number(conditions.personnes ?? 0)) };
}

// Ce que les installations ajoutent aux plafonds de stockage (toutes, même hors service). effets : les `effets` des niveaux.
function ajoutsDeStockage(effets) {
  const ajouts = {};
  for (const e of effets) for (const [r, q] of Object.entries(e?.stockage ?? {})) ajouts[r] = (ajouts[r] || 0) + (Number(q) || 0);
  return ajouts;
}

// Les plafonds de stockage d'un abri d'après ses installations (instances), sans tout le bilan : le jour où l'on s'installe.
export function plafondsAbri(installations = [], contenu = {}) {
  const effets = (installations ?? []).filter(i => Number(i?.niveau) >= 1).map(i => effetsDe(installationDe(contenu, i.cle), Number(i.niveau)));
  return plafonds(ajoutsDeStockage(effets));
}

// Le bilan d'un jour de l'abri (contrat §3.1 bilanAbri). Rien n'est modifié.
// abri : system de l'acteur abri ({ site, region, stocks, nature, sol, bruit, degats }) ;
// installations : instances ; conditions : { jour, saison?, dateDepart?, personnes, meteo?: { soleil, pluie },
//   reseaux?: { eau, electricite } (réseaux publics encore là dans la région), rations?: { eau, nourriture } (§10.1),
//   travailleurs?: { tache: [{ niveau, passion }] } (§10.3 : une installation à `effets.bras: { tache, nombre, niveau }`
//   produit selon ceux qui y travaillent : generation.mjs, facteurBras) }.
// -> { defense, discretion, capacite, visibilite, bruit, protectionCyclone, soins, moral, conservation, renseignements,
//      bonus: { competence: n } (le meilleur `effets.bonus` des installations qui ne sont pas hors service), plafonds, production, consommation, pertes, net, sol, actives, arrets: [{ cle, raison }], autonome, joursDeStocks }
export function bilanAbri(abri = {}, installations = [], contenu = {}, conditions = {}) {
  const c = cadre(abri, contenu, conditions);
  const stocks = normaliserStocks(abri.stocks);
  const solSite = Math.max(1, Number(c.site.sol ?? 0));
  const solActuel = Number(abri.sol ?? c.site.sol ?? 0);
  const lignes = [];
  for (const inst of installations ?? []) {
    const niveau = Number(inst?.niveau) || 0;
    if (niveau < 1) continue;
    const def = installationDe(contenu, inst.cle);
    if (!def) continue;
    const e = effetsDe(def, niveau);
    const fEtat = FACTEUR_ETAT[borner(Number(inst.etat) || 0, 0, 3)];
    const cond = e.conditions ?? {};
    let f = fEtat;
    if (cond.pluie) f *= c.climat.pluie * SAISON_PLUIE[c.saison];
    if (cond.soleil) f *= c.climat.soleil * SAISON_SOLEIL[c.saison] * (Number(c.site.soleil ?? 3) / 3);
    if (cond.riviere && c.site.eau !== "riviere") f = 0;
    if (Number(cond.delai) > 0 && c.jour - Number(inst.termineLe ?? 0) < Number(cond.delai)) f = 0;
    if (demandeSol(def, niveau)) f *= Math.min(1.25, 0.5 + 0.5 * (solActuel / solSite));
    // Bras : `effets.bras` du niveau, ou `bras: { tache, nombres: [par niveau], niveau }` sur la définition (forme du contenu).
    const bras = e.bras ?? (def.bras?.tache ? { tache: def.bras.tache, nombre: def.bras.nombres?.[niveau - 1] ?? def.bras.nombre ?? 1, niveau: def.bras.niveau } : null);
    if (bras?.tache) f *= facteurBras(bras, conditions.travailleurs?.[bras.tache] ?? []);
    const production = {};
    for (const [r, q] of Object.entries(e.production ?? {})) production[r] = (Number(q) || 0) * f;
    lignes.push({
      cle: inst.cle, categorie: def.categorie, niveau, e, production, horsService: fEtat === 0, role: roleDe(def), rang: rangDe(def),
      consommation: { energie: Number(e.consommation?.energie) || 0, carburant: Number(e.consommation?.carburant) || 0, eau: Number(e.consommation?.eau) || 0,
        nourriture: Number(e.consommation?.nourriture) || 0, gaz: Number(e.consommation?.gaz) || 0 },
      peutMarcher: fEtat > 0 && inst.actif !== false, enMarche: fEtat > 0 && inst.actif !== false, sol: demandeSol(def, niveau)
    });
  }
  // L'eau du site et les réseaux publics : une « ligne » sans installation.
  const siteEau = c.site.eau ?? "aucune";
  const eauSite = (EAU_SITE[siteEau] ?? 0) * (siteEau === "citerne" ? c.climat.pluie * SAISON_PLUIE[c.saison] : 1)
    + (siteEau === "reseau" && conditions.reseaux?.eau ? RESEAU_PUBLIC.eau : 0);
  const courant = conditions.reseaux?.electricite && !SITES_SANS_COURANT.includes(c.site.type) ? RESEAU_PUBLIC.electricite : 0;
  if (eauSite || courant) lignes.push({ cle: "", categorie: "site", niveau: 0, e: {}, production: { eau: eauSite, energie: courant }, horsService: false,
    consommation: { energie: 0, carburant: 0, eau: 0, nourriture: 0, gaz: 0 }, peutMarcher: true, enMarche: true, sol: false, site: true });

  // Les sœurs (lot « savoirs ») : par rôle, la première qui peut marcher est en service, les autres en secours. Si celle qu'on a
  // choisie s'arrête au délestage (plus de gaz, d'énergie…), on recommence sans elle : la suivante prend le relais.
  const parRole = new Map();
  for (const l of lignes) if (!l.site) parRole.set(l.role, [...(parRole.get(l.role) ?? []), l]);
  const soeurs = [...parRole.values()].filter(g => g.length > 1).map(g => [...g].sort((a, b) => a.rang - b.rang));
  const ecartees = new Set();
  const besoin = consommationJour({ personnes: c.personnes, altitude: c.region.altitude, saison: c.saison, rations: conditions.rations ?? null });
  const somme = (cle, filtre = () => true) => lignes.filter(l => l.enMarche && filtre(l)).reduce((s, l) => s + (l.production[cle] || 0), 0);
  let arrets = [];
  for (let essai = 0; essai <= lignes.length; essai++) {
    arrets = [];
    for (const l of lignes) { l.enMarche = l.peutMarcher; l.secours = false; }
    for (const l of lignes) if (l.horsService) arrets.push({ cle: l.cle, raison: "hors-service" });
    for (const g of soeurs) {
      const choisie = g.find(l => l.peutMarcher && !ecartees.has(l)) ?? g.find(l => l.peutMarcher);
      for (const l of g) {
        if (l === choisie || !l.peutMarcher) continue;
        l.enMarche = false;
        // Écartée parce qu'elle s'arrêtait (plus de gaz…) : elle garde sa raison ; sinon, elle attend en secours.
        if (ecartees.has(l)) arrets.push({ cle: l.cle, raison: l.raisonArret ?? "secours" });
        else l.secours = true;
      }
      if (choisie) choisie.choisie = true;
    }
    const arreter = (l, raison) => { if (l.enMarche) { l.enMarche = false; arrets.push({ cle: l.cle, raison }); } };
    // Carburant (groupe électrogène), puis gaz (gazinière, chauffe-eau) : servis par ordre de priorité, ce qui manque s'arrête.
    const parPriorite = [...lignes].sort((a, b) => prioriteDelestage(b.categorie) - prioriteDelestage(a.categorie));
    for (const r of ["carburant", "gaz"]) {
      let reste = stocks[r] + Math.round(somme(r));
      for (const l of parPriorite) if (l.enMarche && l.consommation[r] > 0) {
        if (reste >= l.consommation[r]) reste -= l.consommation[r];
        else arreter(l, r);
      }
    }
    // Énergie : stock + production des installations en marche ; les consommatrices servies par priorité.
    let energie = stocks.energie + Math.round(somme("energie"));
    for (const l of parPriorite) if (l.enMarche && l.consommation.energie > 0) {
      if (energie >= l.consommation.energie) energie -= l.consommation.energie;
      else arreter(l, "energie");
    }
    // Eau : les personnes boivent d'abord ; les installations (arrosage, bassin) se partagent le reste.
    let eau = stocks.eau + Math.round(somme("eau")) - besoin.eau;
    for (const l of parPriorite) if (l.enMarche && l.consommation.eau > 0) {
      if (eau >= l.consommation.eau) eau -= l.consommation.eau;
      else arreter(l, "eau");
    }
    // Nourriture : les personnes mangent d'abord ; les bêtes nourries (chiens de garde) se partagent le reste.
    let vivres = stocks.nourriture + Math.round(somme("nourriture")) - besoin.nourriture;
    for (const l of parPriorite) if (l.enMarche && l.consommation.nourriture > 0) {
      if (vivres >= l.consommation.nourriture) vivres -= l.consommation.nourriture;
      else arreter(l, "nourriture");
    }
    // Une sœur choisie arrêtée faute de quoi marcher, alors qu'une autre attend : on recommence sans elle.
    const relais = soeurs.flatMap(g => g.filter(l => l.choisie && !l.enMarche && l.peutMarcher && g.some(x => x !== l && x.peutMarcher && !ecartees.has(x))));
    for (const l of lignes) l.choisie = false;
    if (!relais.length) break;
    for (const l of relais) { ecartees.add(l); l.raisonArret = arrets.find(a => a.cle === l.cle)?.raison; }
  }
  const secours = lignes.filter(l => l.secours).map(l => ({ cle: l.cle, role: l.role }));

  // Effets. Arrêtée : seulement le structurel ; hors service : capacité et stockage ; en secours : stockage et capacité.
  const actives = lignes.filter(l => l.enMarche && !l.site);
  const structurelles = lignes.filter(l => !l.horsService && !l.site && !l.secours);
  const sommeEffet = (liste, cle) => liste.reduce((s, l) => s + (Number(l.e[cle]) || 0), 0);
  const plafond = plafonds(ajoutsDeStockage(lignes.map(l => l.e)));
  // Bonus de compétence des installations (tour de guet, chiens de garde : vigilance ; §1.1) : le meilleur, tant qu'elle n'est
  // pas hors service (même règle qu'un test à l'abri, scripts/api.mjs modificateursDuTest).
  const bonus = {};
  for (const l of structurelles) for (const [k, n] of Object.entries(l.e.bonus ?? {})) bonus[k] = Math.max(bonus[k] ?? 0, Number(n) || 0);
  // Un chien du groupe présent : il entend avant la garde (vigilance +1, comme une installation).
  if (conditions.chien) bonus.vigilance = Math.max(bonus.vigilance ?? 0, 1);

  const production = {};
  const reliquats = {};
  for (const [r, x] of Object.entries(abri.reliquats ?? {})) if (Number(x) > 0) reliquats[r] = Number(x);
  for (const r of RESSOURCES) {
    const brut = somme(r);
    let p = Math.round(brut);
    if (p === 0 && brut > 0) {
      const total = (reliquats[r] ?? 0) + brut;
      p = Math.floor(total + 1e-9);
      reliquats[r] = Math.round((total - p) * 1000) / 1000;
    }
    if (p) production[r] = p;
  }
  const consommation = {
    eau: besoin.eau + actives.reduce((s, l) => s + l.consommation.eau, 0),
    nourriture: besoin.nourriture + actives.reduce((s, l) => s + l.consommation.nourriture, 0),
    energie: actives.reduce((s, l) => s + l.consommation.energie, 0),
    carburant: actives.reduce((s, l) => s + l.consommation.carburant, 0),
    gaz: actives.reduce((s, l) => s + l.consommation.gaz, 0)
  };
  if (!consommation.gaz) delete consommation.gaz;
  const conservation = actives.some(l => l.e.conservation);
  const pertes = { nourriture: pertesJour(Math.max(0, stocks.nourriture + (production.nourriture || 0) - consommation.nourriture), conservation) };
  const net = {};
  for (const r of ["eau", "nourriture", "energie", "carburant", "medicaments", "gaz"]) net[r] = (production[r] || 0) - (consommation[r] || 0) - (pertes[r] || 0);
  if (!net.gaz) delete net.gaz;

  const discretion = borner((Number(c.site.discretion) || 0) + sommeEffet(structurelles, "discretion"), 0, 10);
  const defense = Math.max(0, (Number(c.site.defense) || 0) + sommeEffet(structurelles, "defense") - Math.floor((Number(abri.degats) || 0) / 2));
  const capacite = (Number(c.site.capacite) || 0) + sommeEffet(lignes, "capacite");
  // Lot « savoirs » : végétation abattue par un cyclone, veillée à la lumière (lecture du soir).
  const devoile = vegetationAbattue(abri, c.jour) + (abri.lumiereLe !== undefined && abri.lumiereLe !== null && Number(abri.lumiereLe) === c.jour ? 1 : 0);
  // lueur (lot « fetes », souvenirs.mjs) : les lampes de la Dipavali, le feu de la marche, la cuisine de nuit du ramadan.
  // conditions.signature : ce que l'abri montre en plus (un marché qu'il accueille : marche.mjs, signatureDuMarche).
  const visibiliteBrute = Math.ceil(c.personnes / 2) + sommeEffet(actives, "visibilite") + Math.max(0, Number(conditions.lueur) || 0)
    + (Number(conditions.signature) || 0) + devoile - discretion;
  // Le chien (sauf chiens de garde en service) et les objets de confort : le moral de l'abri.
  const moralChien = conditions.chien && !actives.some(l => l.cle === "chiens-de-garde") ? 1 : 0;
  const moralObjets = Math.min(CONFORT_MAX, Math.max(0, Number(conditions.confort) || 0));
  const protectionCyclone = Math.min(3, Math.max(c.site.type === "tunnel-de-lave" ? 3 : 0, ...structurelles.map(l => Number(l.e.protectionCyclone) || 0)));
  const usure = lignes.filter(l => l.sol && l.enMarche).reduce((s, l) => s + l.niveau * USURE_SOL, 0);
  const bilan = {
    defense, discretion, capacite,
    visibilite: borner(Math.round(visibiliteBrute), 0, 10),
    bruit: sommeEffet(actives, "bruit"),
    protectionCyclone,
    soins: sommeEffet(actives, "soins"),
    moral: sommeEffet(actives, "moral") + moralChien + moralObjets,
    conservation,
    renseignements: actives.some(l => l.e.renseignements),
    bonus,
    eauTraitee: actives.some(l => l.e.eauTraitee) || (siteEau === "reseau" && Boolean(conditions.reseaux?.eau)),
    plafonds: plafond,
    production, reliquats, consommation, pertes, net,
    sol: sommeEffet(actives, "sol") - usure,
    actives: actives.map(l => l.cle),
    eauSite: Math.round(eauSite), reseauElectrique: courant > 0,
    arrets,
    secours,
    surpeuplement: Math.max(0, c.personnes - capacite),
    autonome: net.eau >= 0 && net.nourriture >= 0 && net.energie >= 0
  };
  bilan.joursDeStocks = joursDeStocks(stocks, net);
  return bilan;
}

// Une journée de l'abri : le bilan appliqué aux stocks, au sol et aux alentours. -> { abri, bilan, manque, pertes, perdus }
export function journeeAbri(abri = {}, installations = [], contenu = {}, conditions = {}) {
  const bilan = bilanAbri(abri, installations, contenu, conditions);
  const c = cadre(abri, contenu, conditions);
  const r = journeeStocks(abri.stocks, { production: bilan.production, consommation: bilan.consommation, conservation: bilan.conservation, plafond: bilan.plafonds });
  const mois = dateDuJour(c.jour, conditions.dateDepart).mois;
  const b = repiquerBoutures(r.stocks, bilan);
  const nouveau = {
    ...abri,
    stocks: b.stocks,
    reliquats: bilan.reliquats,
    sol: borner(Number(abri.sol ?? c.site.sol ?? 0) + bilan.sol, 0, SOL_MAX),
    nature: regenererNature(abri.nature, c.region, { saison: c.saison, mois })
  };
  return { abri: nouveau, bilan, manque: r.manque, pertes: r.pertes, perdus: r.perdus, boutures: { repiquees: b.repiquees, mortes: b.mortes } };
}

// Les boutures d'un jour (lot « savoirs ») : repiquées dans un jardin en service (potager, jardin créole, serre, verger), elles
// deviennent des graines (« de quoi semer une planche ») jusqu'au plafond, le reste meurt ; sans jardin, un tiers meurt.
// -> { stocks, repiquees, mortes }
export function repiquerBoutures(stocks, bilan = {}) {
  const s = normaliserStocks(stocks);
  const n = s.boutures;
  if (!n) return { stocks: s, repiquees: 0, mortes: 0 };
  if ((bilan.actives ?? []).some(cle => JARDINS.includes(cle))) {
    const place = Math.max(0, Math.floor(Number(bilan.plafonds?.graines ?? Infinity)) - s.graines);
    const repiquees = Math.min(n, place);
    s.graines += repiquees;
    s.boutures = 0;
    return { stocks: s, repiquees, mortes: n - repiquees };
  }
  const mortes = Math.ceil(n * BOUTURES_PERTE);
  s.boutures = n - mortes;
  return { stocks: s, repiquees: 0, mortes };
}

// ------------------------------------------------------------------ autonomie (§1.6)
// Un jour autonome : eau, nourriture et énergie nettes ≥ 0 et aucune fouille ce jour-là.
export function suivreAutonomie(joursAutonomes = 0, jourAutonome = false) {
  const n = jourAutonome ? (Number(joursAutonomes) || 0) + 1 : 0;
  return { joursAutonomes: n, autonome: n >= SEUIL_AUTONOMIE };
}

// ------------------------------------------------------------------ construire (§3.2, §3.3)
// Coût réel d'un niveau, plans compris.
export function coutAvecPlans(cout = {}, plan = false) {
  const sortie = {};
  for (const [r, q] of Object.entries(cout ?? {})) {
    const n = Math.max(0, Number(q) || 0);
    if (!plan) sortie[r] = n;
    else if (r === "travail") sortie[r] = Math.ceil(n * PLANS.travail);
    else sortie[r] = Math.ceil(n * PLANS.ressources);
  }
  return sortie;
}

const nomDe = def => def?.nom ?? def?.name ?? def?.cle ?? "?";
const instanceDans = (abri, cle) => (abri?.installations ?? []).find(i => i.cle === cle) ?? null;

// Peut-on construire (ou ouvrir le chantier de) `niveau` de l'installation ? niveau omis : le suivant.
// abri : { stocks, installations: [instances] } ; site : définition du site ; groupe : { savoirs: [cle], plans: [cle] }.
// -> { ok, raisons: [String], motifs: [{ cle, params, texte }] (les mêmes, traduisibles : textes.mjs), cout, plan, niveau, enCours }
export function peutConstruire(def, niveau, abri = {}, site = {}, groupe = {}) {
  const raisons = [], motifs = [];
  const refuser = (texte, cle, params = {}) => { raisons.push(texte); motifs.push(message(cle, params, texte)); };
  if (!def) { refuser("installation inconnue", "installation-inconnue"); return { ok: false, raisons, motifs, cout: {}, plan: false, niveau: 0, enCours: false }; }
  const instance = instanceDans(abri, def.cle);
  const actuel = Number(instance?.niveau) || 0;
  const enCours = Boolean(instance && Number(instance.chantier?.requis) > 0);
  const n = Number(niveau ?? actuel + 1);
  const max = niveauMaxDe(def);
  const nom = nomDe(def);
  if (!(n >= 1 && n <= max)) refuser(`${nom} : le niveau ${n} n'existe pas (1 à ${max})`, "niveau-inexistant", { installation: nom, niveau: n, max });
  else if (n <= actuel) refuser(`${nom} : déjà au niveau ${actuel}`, "niveau-deja", { installation: nom, niveau: actuel });
  else if (n > actuel + 1) refuser(`${nom} : il faut d'abord le niveau ${n - 1}`, "niveau-prealable", { installation: nom, niveau: n - 1 });
  if (instance && Number(instance.etat) >= 3) refuser(`${nom} : hors service, à réparer d'abord`, "hors-service-reparer", { installation: nom });
  const niv = niveauDe(def, n);
  const plan = (groupe.plans ?? []).includes(def.cle);
  if (!niv) return { ok: false, raisons, motifs, cout: {}, plan, niveau: n, enCours };
  const req = niv.requiert ?? {};
  const savoirs = groupe.savoirs ?? [];
  for (const s of req.savoirs ?? []) if (!savoirs.includes(s)) refuser(`savoir-faire manquant : ${s}`, "savoir-manquant", { savoir: s });
  const rs = req.site ?? {};
  if (Array.isArray(rs.eau) && rs.eau.length && !rs.eau.includes(site.eau ?? "aucune")) {
    refuser(`il faut ${rs.eau.join(" ou ")} sur le site (ici : ${site.eau ?? "aucune"})`, "eau-requise", { eau: rs.eau.join(" / "), ici: site.eau ?? "aucune" });
  }
  for (const [cle, texte] of [["sol", "de la terre cultivable"], ["soleil", "du soleil"], ["souterrain", "un sous-sol qui s'y prête"]]) {
    if (Number(rs[cle] ?? 0) > Number(site[cle] ?? 0)) refuser(`il faut ${texte} (${cle} ${rs[cle]} ; ici ${Number(site[cle] ?? 0)})`, `site-${cle}`, { requis: rs[cle], ici: Number(site[cle] ?? 0) });
  }
  for (const r of req.installations ?? []) {
    if (r.cle === def.cle) continue; // le niveau précédent : déjà vérifié
    const autre = instanceDans(abri, r.cle);
    if (!autre || Number(autre.niveau) < Number(r.niveau)) refuser(`il faut d'abord : ${r.cle} niveau ${r.niveau}`, "requiert", { installation: r.cle, niveau: r.niveau });
    else if (Number(autre.etat) >= 3) refuser(`${r.cle} est hors service`, "requiert-hors-service", { installation: r.cle });
  }
  // Un chantier déjà ouvert pour ce niveau est déjà payé.
  const dejaPaye = enCours && n === actuel + 1;
  const cout = dejaPaye ? {} : coutAvecPlans(niv.cout, plan);
  // Les matières de l'île (`ile`) se prennent sur le bois des alentours de l'abri, pas dans les stocks.
  const { [COUT_ILE]: ile = 0, ...coutStocks } = cout;
  const bois = boisDisponible(abri);
  if (!dejaPaye && (!couvre(abri.stocks, coutStocks) || ile > bois)) {
    const manque = Object.fromEntries(Object.entries(coutStocks).filter(([r, q]) => r !== "travail" && (Number(abri.stocks?.[r]) || 0) < q)
      .map(([r, q]) => [r, q - (Number(abri.stocks?.[r]) || 0)]));
    if (ile > bois) manque[COUT_ILE] = ile - bois;
    refuser(`il manque : ${Object.entries(manque).map(([r, q]) => `${q} ${r}`).join(", ")}`, "manque", { manque });
  }
  return { ok: raisons.length === 0, raisons, motifs, cout, plan, niveau: n, enCours: dejaPaye };
}

// Les matières de l'île à portée de main : le bois des alentours de l'abri (entier ; lot « savoirs »).
export const boisDisponible = abri => Math.max(0, Math.floor(Number(abri?.nature?.bois) || 0));
// Prendre des matières de l'île sur les alentours. -> nature (nouvelle)
export function prendreIle(nature = {}, n = 0) {
  const q = Math.max(0, Number(n) || 0);
  if (!q) return { ...nature };
  return { ...nature, bois: Math.max(0, Math.round(((Number(nature?.bois) || 0) - q) * 100) / 100) };
}

// Ouvre le chantier du niveau suivant (coûts payés tout de suite, contrat §5 « payés au premier quart »).
// -> { ok, raisons, motifs, instance, stocks, nature (alentours, matières de l'île prises), cout }
export function ouvrirChantier(def, abri = {}, site = {}, groupe = {}) {
  const nature = abri.nature ? { ...abri.nature } : undefined;
  const v = peutConstruire(def, undefined, abri, site, groupe);
  if (!v.ok) return { ok: false, raisons: v.raisons, motifs: v.motifs, instance: instanceDans(abri, def?.cle), stocks: normaliserStocks(abri.stocks), nature, cout: v.cout };
  const ancienne = instanceDans(abri, def.cle);
  if (v.enCours) return { ok: true, raisons: [], motifs: [], instance: structuredClone(ancienne), stocks: normaliserStocks(abri.stocks), nature, cout: {} };
  const { travail = 0, [COUT_ILE]: ile = 0, ...ressources } = v.cout;
  const stocks = retirerStocks(abri.stocks, ressources).stocks;
  const instance = ancienne ? structuredClone(ancienne) : instanceInstallation(def.cle, 0);
  instance.chantier = { fait: 0, requis: Math.max(1, travail) };
  return { ok: true, raisons: [], motifs: [], instance, stocks, nature: ile ? prendreIle(abri.nature, ile) : nature, cout: v.cout };
}

// Avance un chantier ouvert : quarts × bras de travail (+ bonus en quarts-personne, la marge d'un test de bricolage par exemple).
// -> { instance, termine, niveau, reste, plan (clé à ajouter aux plans du groupe si terminé, sinon null) }
export function avancerChantier(instance, def, { quarts = 1, bras = 1, bonus = 0, jour = 0 } = {}) {
  const i = structuredClone(instance);
  const requis = Number(i.chantier?.requis) || 0;
  if (!(requis > 0)) return { instance: i, termine: false, niveau: Number(i.niveau) || 0, reste: 0, plan: null };
  const fait = (Number(i.chantier.fait) || 0) + Math.max(0, quarts) * Math.max(0, bras) + Math.max(0, bonus);
  if (fait >= requis) {
    const premier = !(Number(i.niveau) > 0);
    i.niveau = Math.min(niveauMaxDe(def) || Infinity, (Number(i.niveau) || 0) + 1);
    i.chantier = { fait: 0, requis: 0 };
    if (premier) i.termineLe = jour;
    i.etat = 0;
    i.reparation = 0;
    return { instance: i, termine: true, niveau: i.niveau, reste: 0, plan: def?.cle ?? i.cle };
  }
  i.chantier = { fait, requis };
  return { instance: i, termine: false, niveau: Number(i.niveau) || 0, reste: requis - fait, plan: null };
}

// ------------------------------------------------------------------ dégâts et réparations
export function endommagerInstallation(instance, n = 1) {
  return { ...structuredClone(instance), etat: borner((Number(instance?.etat) || 0) + n, 0, 3) };
}

// Le travail d'une réparation : celui déjà fait (s'il reste à réparer) + quarts × bras ; -> { repares, reste (travail gardé) }.
function travailDeReparation({ aReparer, deja = 0, quarts = 1, bras = 1, parPoint, materiaux = Infinity }) {
  if (!(aReparer > 0)) return { repares: 0, reste: 0 };
  const travail = Math.max(0, Number(deja) || 0) + Math.max(0, Number(quarts) || 0) * Math.max(0, Number(bras) || 0);
  const repares = Math.min(aReparer, Math.floor(travail / parPoint), Math.max(0, Math.floor(Number(materiaux))));
  return { repares, reste: repares >= aReparer ? 0 : Math.min(parPoint, travail - repares * parPoint) };
}

// Répare : -> { instance, repares, cout: { materiaux, travail } } (travail : celui des points réparés ; le reste est gardé dans
// instance.reparation pour la suite).
// Une installation lontan (`def.arbre === "lontan"`) se répare avec les matières de l'île (`ile` : le bois des alentours) au lieu
// de matériaux fouillés : cout: { ile, travail } (lot « savoirs »).
export function reparerInstallation(instance, def, { quarts = 1, bras = 1, materiaux = Infinity, ile = Infinity } = {}) {
  const parPoint = Math.max(1, Math.ceil((Number(niveauDe(def, Math.max(1, Number(instance?.niveau) || 1))?.cout?.travail) || 0) / 4));
  const etat = Number(instance?.etat) || 0;
  const lontan = def?.arbre === "lontan";
  const t = travailDeReparation({ aReparer: etat, deja: instance?.reparation, quarts, bras, parPoint, materiaux: lontan ? ile : materiaux });
  return { instance: { ...structuredClone(instance), etat: etat - t.repares, reparation: t.reste }, repares: t.repares,
    cout: { [lontan ? COUT_ILE : "materiaux"]: t.repares, travail: t.repares * parPoint } };
}

export const endommagerAbri = (abri, n = 1) => ({ ...abri, degats: Math.max(0, (Number(abri?.degats) || 0) + n) });

// ------------------------------------------------------------------ événements du contenu qui touchent l'abri (§2.6)
// effets : `effets.abri` d'un événement du contenu ({ stocks: { r: ±n }, degats, moral, blessure, decouverte: { r: n } }) ;
// nom : le nom de l'événement (dans la langue du contenu). Les effets SIMPLES sont appliqués : stocks perdus (jamais sous 0),
// dégâts de l'abri. Le reste est rendu au MJ, à raconter, sans effet automatique : moral, blessures, trouvailles
// (`decouverte`, et une quantité positive de `stocks` : il faut aller la chercher). Les autres champs sont ignorés.
// -> { abri, pertes: { r: n } (ce qui a vraiment été perdu), degats, messages: [{ cle, params, texte }] (effets appliqués),
//      recits: [{ cle, params, texte }] (à raconter par le MJ) }
const texteQuantites = q => Object.entries(q).map(([r, n]) => `${n} ${r}`).join(", ");
export function subirEvenementAbri(abri = {}, effets = {}, nom = "") {
  const retraits = {}, trouvailles = {};
  for (const [r, q] of Object.entries(effets?.stocks ?? {})) {
    const n = Math.round(Number(q) || 0);
    if (n < 0) retraits[r] = -n;
    else if (n > 0) trouvailles[r] = n;
  }
  for (const [r, q] of Object.entries(effets?.decouverte ?? {})) {
    const n = Math.round(Number(q) || 0);
    if (n > 0) trouvailles[r] = (trouvailles[r] ?? 0) + n;
  }
  const avant = normaliserStocks(abri?.stocks);
  const stocks = retirerStocks(avant, retraits).stocks;
  const pertes = Object.fromEntries(Object.keys(retraits).filter(r => r in avant && avant[r] > stocks[r]).map(r => [r, avant[r] - stocks[r]]));
  const degats = Math.max(0, Math.round(Number(effets?.degats) || 0));
  let nouveau = Object.keys(pertes).length ? { ...abri, stocks } : { ...abri };
  if (degats) nouveau = endommagerAbri(nouveau, degats);
  const messages = [], recits = [];
  if (Object.keys(pertes).length) messages.push(message("abri-evenement-pertes", { nom, pertes }, `${nom} : l'abri perd ${texteQuantites(pertes)}.`));
  if (degats) messages.push(message("abri-evenement-degats", { nom, degats }, `${nom} : l'abri est abîmé (${degats} dégât${degats > 1 ? "s" : ""}).`));
  const moral = Math.round(Number(effets?.moral) || 0);
  if (moral) {
    const signe = `${moral > 0 ? "+" : ""}${moral}`;
    recits.push(message("abri-a-raconter-moral", { nom, moral: signe }, `${nom} : moral du groupe ${signe}, à raconter.`));
  }
  const blessure = Math.max(0, Math.round(Number(effets?.blessure) || 0));
  if (blessure) recits.push(message("abri-a-raconter-blessure", { nom, n: blessure }, `${nom} : ${blessure} blessure${blessure > 1 ? "s" : ""} à raconter (qui, comment).`));
  if (Object.keys(trouvailles).length) {
    recits.push(message("abri-a-raconter-decouverte", { nom, decouverte: trouvailles }, `${nom} : une trouvaille à raconter (${texteQuantites(trouvailles)}), à aller chercher.`));
  }
  return { abri: nouveau, pertes, degats, messages, recits };
}

export function reparerAbri(abri, { quarts = 1, bras = 1 } = {}) {
  const degats = Number(abri?.degats) || 0;
  const materiaux = Number(abri?.stocks?.materiaux) || 0;
  const t = travailDeReparation({ aReparer: degats, deja: abri?.reparation, quarts, bras, parPoint: TRAVAIL_DEGAT, materiaux });
  return { abri: { ...abri, degats: degats - t.repares, reparation: t.reste, stocks: { ...normaliserStocks(abri?.stocks), materiaux: materiaux - t.repares } }, repares: t.repares };
}

// Un cyclone sur l'abri. -> { abri, installations, degats, endommagees: [cle] }
export function subirCyclone(abri, installations, contenu, { force = 1, protection = 0 } = {}, hasard = Math.random) {
  const degats = Math.max(0, Number(force) - Number(protection));
  const endommagees = [];
  const nouvelles = (installations ?? []).map(inst => {
    const def = installationDe(contenu, inst.cle);
    if (!degats || !def || !CATEGORIES_EXPOSEES.includes(def.categorie) || !(inst.niveau >= 1)) return inst;
    let n = 0;
    for (let k = 0; k < degats; k++) if (hasard() < 0.25) n++;
    if (!n) return inst;
    endommagees.push(inst.cle);
    return endommagerInstallation(inst, n);
  });
  return { abri: endommagerAbri(abri, degats), installations: nouvelles, degats, endommagees };
}

// Le passage d'un cyclone sur l'abri, tout entier (lot « savoirs », docs/equilibre-savoirs.md) : les dégâts de subirCyclone, plus
// - préparé (on a rentré ou fixé ce qui s'envole, `prepare`) : +1 de protection (au plus 3), et rien n'est emporté ; sinon le vent
//   emporte ce qui traînait dehors : 2 × force matériaux (tôles, bâches), force plantes, toutes les boutures ;
// - les fuites et les gouttières qui débordent remplissent la citerne : +4 × force eau (au plafond), mais une eau à filtrer :
//   `abri.eauDouteuse` = jour + 3 (maladies de l'eau × 2 si l'eau n'est pas traitée, maladies.mjs) ;
// - les arbres tombés : bois des alentours + 0,5 × force × plafond (du bois pour des semaines, qui pourrit lentement) ; les
//   fruits tombés : cueillette + 0,3 × force × plafond (à ramasser et conserver vite : ils pourrissent en quelques jours) ;
// - la végétation abattue : `abri.vegetation` = { n: force, depuis: jour } (visibilité + force, −1 tous les 15 jours) ;
// - ce que le cyclone a pris mal fixé ailleurs et dépose dans la cour : un dépôt tiré dans `depots` (contenu `depotsCyclone`,
//   { cle, nom, poids, stocks?, menace?: { type, force }, moral? }) ; ses stocks sont posés (au plafond), sa menace et son
//   moral rendus au MJ.
// -> { abri, installations, degats, endommagees, protection, emportes, eau, bois, fruits, depot: { cle, nom, stocks, menace,
//      moral } | null }
export const CYCLONE_ABRI = { eauParForce: 4, eauDouteuse: 3, bois: 0.5, fruits: 0.3, emportes: { materiaux: 2, plantes: 1 } };
export function passageCyclone(abri = {}, installations = [], contenu = {}, { force = 1, protection = 0, prepare = false, jour = 0, depots = [] } = {}, hasard = Math.random) {
  const C = CYCLONE_ABRI;
  const f = Math.max(0, Number(force) || 0);
  const prot = Math.min(3, Math.max(0, Number(protection) || 0) + (prepare ? 1 : 0));
  const cy = subirCyclone(abri, installations, contenu, { force: f, protection: prot }, hasard);
  let a = cy.abri;
  const plafond = plafondsAbri(cy.installations, contenu);
  let stocks = normaliserStocks(a.stocks);
  const emportes = {};
  if (!prepare && f > 0) {
    const voulu = { materiaux: C.emportes.materiaux * f, plantes: C.emportes.plantes * f, boutures: stocks.boutures };
    const r = retirerStocks(stocks, voulu);
    for (const k of Object.keys(voulu)) if (stocks[k] - r.stocks[k] > 0) emportes[k] = stocks[k] - r.stocks[k];
    stocks = r.stocks;
  }
  const avantEau = stocks.eau;
  stocks.eau = Math.min(Math.floor(plafond.eau), stocks.eau + C.eauParForce * f);
  const eau = Math.max(0, stocks.eau - avantEau);
  // Ce que le cyclone dépose dans la cour.
  const liste = (depots ?? []).filter(d => d && d.cle).map(d => ({ ...d, poids: Number(d.poids ?? 1) }));
  const tire = f > 0 && liste.length ? tirerPoids(liste, hasard) : null;
  let depot = null;
  if (tire) {
    const poses = {};
    for (const [r, q] of Object.entries(tire.stocks ?? {})) {
      const n = Math.max(0, Math.round(Number(q) || 0));
      if (!n || !(r in stocks)) continue;
      const avant = stocks[r];
      stocks[r] = Math.min(Math.floor(plafond[r] ?? Infinity), avant + n);
      if (stocks[r] > avant) poses[r] = stocks[r] - avant;
    }
    depot = { cle: tire.cle, nom: tire.nom ?? tire.cle, stocks: poses, menace: tire.menace ?? null, moral: Number(tire.moral) || 0 };
  }
  const region = regionDe(contenu, a.region);
  const n = natureRegion(region);
  const nature = { ...(a.nature ?? natureInitiale(region)) };
  const bois = Math.round(n.bois.plafond * C.bois * f * 100) / 100, fruits = Math.round(n.cueillette.plafond * C.fruits * f * 100) / 100;
  nature.bois = Math.round(((Number(nature.bois) || 0) + bois) * 100) / 100;
  nature.cueillette = Math.round(((Number(nature.cueillette) || 0) + fruits) * 100) / 100;
  const veg = Math.max(f, vegetationAbattue(a, jour));
  a = { ...a, stocks, nature, ...(f > 0 ? { vegetation: { n: veg, depuis: jour }, eauDouteuse: jour + C.eauDouteuse } : {}) };
  return { abri: a, installations: cy.installations, degats: cy.degats, endommagees: cy.endommagees, protection: prot, emportes, eau, bois, fruits, depot };
}

// ------------------------------------------------------------------ nature des alentours
// Alentours intacts d'une région (stocks au plafond).
export function natureInitiale(region) {
  const n = natureRegion(region);
  return Object.fromEntries(NATURE.map(k => [k, n[k].plafond]));
}

// Un jour de régénération vers le plafond de la région.
export function regenererNature(nature = {}, region = {}, { saison = "pluies", mois = 12 } = {}) {
  const n = natureRegion(region);
  const sortie = {};
  for (const k of NATURE) {
    let gain = n[k].parJour * REGENERATION_NATURE[k];
    if (k === "cueillette") gain *= SAISON_CUEILLETTE[saison] * bonusFruits(mois);
    const actuel = Math.max(0, Number(nature?.[k] ?? n[k].plafond));
    // Au-dessus du plafond (bois et fruits tombés d'un cyclone) : rien ne repousse, le surplus pourrit peu à peu.
    if (actuel > n[k].plafond) sortie[k] = Math.round((n[k].plafond + (actuel - n[k].plafond) * (1 - POURRISSEMENT[k])) * 100) / 100;
    else sortie[k] = Math.round(Math.min(n[k].plafond, actuel + gain) * 100) / 100;
  }
  return sortie;
}

// Ce que l'on tire des alentours (la nature reste en nombres décimaux, le butin est entier).
// -> { nature, pris }
export function exploiterNature(nature = {}, cle, demande) {
  const dispo = Math.max(0, Number(nature?.[cle]) || 0);
  const pris = Math.max(0, Math.min(Math.floor(dispo), Math.floor(Number(demande) || 0)));
  return { nature: { ...nature, [cle]: Math.round((dispo - pris) * 100) / 100 }, pris };
}

// Les installations de départ d'un site, en instances achevées depuis longtemps (un verger déjà en rapport : pas de délai).
// Un site trouvé tard est à l'abandon depuis des semaines : ses installations ont pris 1 point d'état par 40 jours écoulés
// après le vingtième (J60 : 1, J100 : 2, J140 et après : 3, hors service, à réparer), comme s'abîme un abri abandonné (monde.mjs).
export const USURE_SITES = { apres: 20, parPoint: 40 };
export const etatInstallationsDuSite = jour => borner(Math.floor(Math.max(0, Number(jour) - USURE_SITES.apres) / USURE_SITES.parPoint), 0, 3);
export function installationsDuSite(site, contenu, jour = 0) {
  const idx = indexer(contenu);
  return (site?.installationsDepart ?? []).filter(i => idx.installations.has(i.installation))
    .map(i => instanceInstallation(i.installation, Number(i.niveau) || 1, { termineLe: jour - 365, etat: etatInstallationsDuSite(jour) }));
}
