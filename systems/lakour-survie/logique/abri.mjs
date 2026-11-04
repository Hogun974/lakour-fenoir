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
//   dans l'ordre ORDRE_DELESTAGE (confort d'abord, eau en dernier) ; même règle pour le carburant (groupe électrogène) et pour
//   l'eau des installations (les personnes boivent d'abord). Une installation arrêtée ne garde que défense, discrétion,
//   capacité, protection cyclonique et stockage.
// - Visibilité = ceil(personnes / 2) + visibilité des installations en marche − discrétion totale, bornée 0..10.
//   Défense = défense du site + installations − floor(dégâts / 2).
// - Plans (§3.3) : reconstruire une installation déjà construite coûte 25 % de ressources en moins (arrondi au supérieur sur
//   le reste : 3 → 3, 4 → 3, 10 → 8) et la moitié du travail (arrondi au supérieur).
// - Réparation : 1 point d'état coûte max(1, ceil(travail du niveau / 4)) quarts-personne et 1 matériau ; un point de dégâts de
//   l'abri coûte 2 quarts-personne et 1 matériau.
// - Nature des alentours : régénération par jour vers le plafond = rendement × (cueillette 0,25, gibier 0,15, pêche 0,25,
//   bois 0,2) ; cueillette × 0,7 en saison sèche et × bonus des fruits (1,25 en novembre, 1,5 en décembre-janvier).
// - Cyclone : dégâts = force − protection cyclonique (si positif) ; chaque installation exposée (eau, nourriture, énergie,
//   défense) prend 1 point d'état avec 25 % de chances par point de dégâts.
import { ORDRE_DELESTAGE, RESSOURCES, NATURE, SEUIL_AUTONOMIE, borner } from "./constantes.mjs";
import { installationDe, regionDe, siteDe, niveauDe, niveauMaxDe, natureRegion, indexer } from "./contenu.mjs";
import { consommationJour, pertesJour, plafonds, joursDeStocks, normaliserStocks, journeeStocks, couvre, retirerStocks } from "./ressources.mjs";
import { saisonDuJour, bonusFruits, dateDuJour } from "./temps.mjs";
import { facteurBras } from "./generation.mjs";
import { message } from "./textes.mjs";

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

// Le bilan d'un jour de l'abri (contrat §3.1 bilanAbri). Rien n'est modifié.
// abri : system de l'acteur abri ({ site, region, stocks, nature, sol, bruit, degats }) ;
// installations : instances ; conditions : { jour, saison?, dateDepart?, personnes, meteo?: { soleil, pluie },
//   reseaux?: { eau, electricite } (réseaux publics encore là dans la région), rations?: { eau, nourriture } (§10.1),
//   travailleurs?: { tache: [{ niveau, passion }] } (§10.3 : une installation à `effets.bras: { tache, nombre, niveau }`
//   produit selon ceux qui y travaillent : generation.mjs, facteurBras) }.
// -> { defense, discretion, capacite, visibilite, bruit, protectionCyclone, soins, moral, conservation, renseignements,
//      plafonds, production, consommation, pertes, net, sol, actives, arrets: [{ cle, raison }], autonome, joursDeStocks }
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
      cle: inst.cle, categorie: def.categorie, niveau, e, production, horsService: fEtat === 0,
      consommation: { energie: Number(e.consommation?.energie) || 0, carburant: Number(e.consommation?.carburant) || 0, eau: Number(e.consommation?.eau) || 0 },
      enMarche: fEtat > 0 && inst.actif !== false, sol: demandeSol(def, niveau)
    });
  }
  // L'eau du site et les réseaux publics : une « ligne » sans installation.
  const siteEau = c.site.eau ?? "aucune";
  const eauSite = (EAU_SITE[siteEau] ?? 0) * (siteEau === "citerne" ? c.climat.pluie * SAISON_PLUIE[c.saison] : 1)
    + (siteEau === "reseau" && conditions.reseaux?.eau ? RESEAU_PUBLIC.eau : 0);
  const courant = conditions.reseaux?.electricite && !SITES_SANS_COURANT.includes(c.site.type) ? RESEAU_PUBLIC.electricite : 0;
  if (eauSite || courant) lignes.push({ cle: "", categorie: "site", niveau: 0, e: {}, production: { eau: eauSite, energie: courant }, horsService: false,
    consommation: { energie: 0, carburant: 0, eau: 0 }, enMarche: true, sol: false, site: true });
  const arrets = [];
  const arreter = (l, raison) => { if (l.enMarche) { l.enMarche = false; arrets.push({ cle: l.cle, raison }); } };
  for (const l of lignes) if (l.horsService) arrets.push({ cle: l.cle, raison: "hors-service" });

  // Carburant (groupe électrogène) : servi par ordre de priorité, ce qui manque s'arrête.
  const parPriorite = [...lignes].sort((a, b) => prioriteDelestage(b.categorie) - prioriteDelestage(a.categorie));
  let carburant = stocks.carburant;
  for (const l of parPriorite) if (l.enMarche && l.consommation.carburant > 0) {
    if (carburant >= l.consommation.carburant) carburant -= l.consommation.carburant;
    else arreter(l, "carburant");
  }
  // Énergie : stock + production des installations en marche ; les consommatrices servies par priorité.
  const somme = (cle, filtre = () => true) => lignes.filter(l => l.enMarche && filtre(l)).reduce((s, l) => s + (l.production[cle] || 0), 0);
  const productionEnergie = Math.round(somme("energie"));
  let energie = stocks.energie + productionEnergie;
  for (const l of parPriorite) if (l.enMarche && l.consommation.energie > 0) {
    if (energie >= l.consommation.energie) energie -= l.consommation.energie;
    else arreter(l, "energie");
  }
  // Eau : les personnes boivent d'abord ; les installations (arrosage, bassin) se partagent le reste.
  const besoin = consommationJour({ personnes: c.personnes, altitude: c.region.altitude, saison: c.saison, rations: conditions.rations ?? null });
  const productionEauAvant = Math.round(somme("eau"));
  let eau = stocks.eau + productionEauAvant - besoin.eau;
  for (const l of parPriorite) if (l.enMarche && l.consommation.eau > 0) {
    if (eau >= l.consommation.eau) eau -= l.consommation.eau;
    else arreter(l, "eau");
  }

  // Effets. Arrêtée : seulement le structurel ; hors service : capacité et stockage.
  const actives = lignes.filter(l => l.enMarche && !l.site);
  const structurelles = lignes.filter(l => !l.horsService && !l.site);
  const sommeEffet = (liste, cle) => liste.reduce((s, l) => s + (Number(l.e[cle]) || 0), 0);
  const ajoutsStockage = {};
  for (const l of lignes) for (const [r, q] of Object.entries(l.e.stockage ?? {})) ajoutsStockage[r] = (ajoutsStockage[r] || 0) + (Number(q) || 0);
  const plafond = plafonds(ajoutsStockage);

  const production = {};
  for (const r of RESSOURCES) {
    const p = Math.round(somme(r));
    if (p) production[r] = p;
  }
  const consommation = {
    eau: besoin.eau + actives.reduce((s, l) => s + l.consommation.eau, 0),
    nourriture: besoin.nourriture,
    energie: actives.reduce((s, l) => s + l.consommation.energie, 0),
    carburant: actives.reduce((s, l) => s + l.consommation.carburant, 0)
  };
  const conservation = actives.some(l => l.e.conservation);
  const pertes = { nourriture: pertesJour(Math.max(0, stocks.nourriture + (production.nourriture || 0) - consommation.nourriture), conservation) };
  const net = {};
  for (const r of ["eau", "nourriture", "energie", "carburant", "medicaments"]) net[r] = (production[r] || 0) - (consommation[r] || 0) - (pertes[r] || 0);

  const discretion = borner((Number(c.site.discretion) || 0) + sommeEffet(structurelles, "discretion"), 0, 10);
  const defense = Math.max(0, (Number(c.site.defense) || 0) + sommeEffet(structurelles, "defense") - Math.floor((Number(abri.degats) || 0) / 2));
  const capacite = (Number(c.site.capacite) || 0) + sommeEffet(lignes, "capacite");
  const visibiliteBrute = Math.ceil(c.personnes / 2) + sommeEffet(actives, "visibilite") - discretion;
  const protectionCyclone = Math.min(3, Math.max(c.site.type === "tunnel-de-lave" ? 3 : 0, ...structurelles.map(l => Number(l.e.protectionCyclone) || 0)));
  const usure = lignes.filter(l => l.sol && l.enMarche).reduce((s, l) => s + l.niveau * USURE_SOL, 0);
  const bilan = {
    defense, discretion, capacite,
    visibilite: borner(Math.round(visibiliteBrute), 0, 10),
    bruit: sommeEffet(actives, "bruit"),
    protectionCyclone,
    soins: sommeEffet(actives, "soins"),
    moral: sommeEffet(actives, "moral"),
    conservation,
    renseignements: actives.some(l => l.e.renseignements),
    eauTraitee: actives.some(l => l.e.eauTraitee) || (siteEau === "reseau" && Boolean(conditions.reseaux?.eau)),
    plafonds: plafond,
    production, consommation, pertes, net,
    sol: sommeEffet(actives, "sol") - usure,
    actives: actives.map(l => l.cle),
    eauSite: Math.round(eauSite), reseauElectrique: courant > 0,
    arrets,
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
  const nouveau = {
    ...abri,
    stocks: r.stocks,
    sol: borner(Number(abri.sol ?? c.site.sol ?? 0) + bilan.sol, 0, SOL_MAX),
    nature: regenererNature(abri.nature, c.region, { saison: c.saison, mois })
  };
  return { abri: nouveau, bilan, manque: r.manque, pertes: r.pertes, perdus: r.perdus };
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
  if (!dejaPaye && !couvre(abri.stocks, cout)) {
    const manque = Object.fromEntries(Object.entries(cout).filter(([r, q]) => r !== "travail" && (Number(abri.stocks?.[r]) || 0) < q)
      .map(([r, q]) => [r, q - (Number(abri.stocks?.[r]) || 0)]));
    refuser(`il manque : ${Object.entries(manque).map(([r, q]) => `${q} ${r}`).join(", ")}`, "manque", { manque });
  }
  return { ok: raisons.length === 0, raisons, motifs, cout, plan, niveau: n, enCours: dejaPaye };
}

// Ouvre le chantier du niveau suivant (coûts payés tout de suite, contrat §5 « payés au premier quart »).
// -> { ok, raisons, motifs, instance, stocks, cout }
export function ouvrirChantier(def, abri = {}, site = {}, groupe = {}) {
  const v = peutConstruire(def, undefined, abri, site, groupe);
  if (!v.ok) return { ok: false, raisons: v.raisons, motifs: v.motifs, instance: instanceDans(abri, def?.cle), stocks: normaliserStocks(abri.stocks), cout: v.cout };
  const ancienne = instanceDans(abri, def.cle);
  if (v.enCours) return { ok: true, raisons: [], motifs: [], instance: structuredClone(ancienne), stocks: normaliserStocks(abri.stocks), cout: {} };
  const { travail = 0, ...ressources } = v.cout;
  const stocks = retirerStocks(abri.stocks, ressources).stocks;
  const instance = ancienne ? structuredClone(ancienne) : instanceInstallation(def.cle, 0);
  instance.chantier = { fait: 0, requis: Math.max(1, travail) };
  return { ok: true, raisons: [], motifs: [], instance, stocks, cout: v.cout };
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
    return { instance: i, termine: true, niveau: i.niveau, reste: 0, plan: def?.cle ?? i.cle };
  }
  i.chantier = { fait, requis };
  return { instance: i, termine: false, niveau: Number(i.niveau) || 0, reste: requis - fait, plan: null };
}

// ------------------------------------------------------------------ dégâts et réparations
export function endommagerInstallation(instance, n = 1) {
  return { ...structuredClone(instance), etat: borner((Number(instance?.etat) || 0) + n, 0, 3) };
}

// Répare : -> { instance, repares, cout: { materiaux, travail } } (le travail en trop est perdu).
export function reparerInstallation(instance, def, { quarts = 1, bras = 1, materiaux = Infinity } = {}) {
  const parPoint = Math.max(1, Math.ceil((Number(niveauDe(def, Math.max(1, Number(instance?.niveau) || 1))?.cout?.travail) || 0) / 4));
  const etat = Number(instance?.etat) || 0;
  const repares = Math.min(etat, Math.floor((quarts * bras) / parPoint), Math.max(0, Math.floor(materiaux)));
  return { instance: { ...structuredClone(instance), etat: etat - repares }, repares, cout: { materiaux: repares, travail: repares * parPoint } };
}

export const endommagerAbri = (abri, n = 1) => ({ ...abri, degats: Math.max(0, (Number(abri?.degats) || 0) + n) });

export function reparerAbri(abri, { quarts = 1, bras = 1 } = {}) {
  const degats = Number(abri?.degats) || 0;
  const materiaux = Number(abri?.stocks?.materiaux) || 0;
  const repares = Math.min(degats, Math.floor((quarts * bras) / TRAVAIL_DEGAT), materiaux);
  return { abri: { ...abri, degats: degats - repares, stocks: { ...normaliserStocks(abri?.stocks), materiaux: materiaux - repares } }, repares };
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
    sortie[k] = Math.round(Math.min(n[k].plafond, actuel + gain) * 100) / 100;
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
export function installationsDuSite(site, contenu, jour = 0) {
  const idx = indexer(contenu);
  return (site?.installationsDepart ?? []).filter(i => idx.installations.has(i.installation))
    .map(i => instanceInstallation(i.installation, Number(i.niveau) || 1, { termineLe: jour - 365 }));
}
