// Simulateur de parties entières de Fénoir (hors suite d'essais) : joue des parties complètes avec la logique pure du système
// (systems/lakour-survie/logique/) et le VRAI contenu (modules/lakour-fenoir/assets/donnees.json, lu par logique/contenu.mjs
// après la traduction de formes de scripts/registre.mjs), pour mesurer l'équilibre (docs/survie-equilibrage.md).
//
//   node essais/outils/simuler-parties.mjs --parties 200 --graine 1            (12 cas : 4 stratégies × 1, 2, 4, 6 membres… voir --cas)
//   node essais/outils/simuler-parties.mjs --rapide                            (20 parties par cas, pour essais/survie-equilibre.test.mjs)
//   options : --jours 200  --cas nomade-4,enracine-4  --fils 4 (fils d'exécution, défaut : cœurs − 1)  --json <fichier>  --journal (une partie détaillée)
//
// Un GROUPE de 1, 2, 4 ou 6 survivants tirés par le générateur (§10.2, budget 10–16) joue chaque jour selon une STRATÉGIE :
// - « passif » : s'installe sur le site le plus sûr de sa région, monte la garde, et ne fait rien d'autre (la mesure de référence
//   « un groupe de 4 passif en ville tient 7 à 14 jours ») ;
// - « nomade » : fouille sa région tant qu'elle rapporte ; quand les jours de stocks passent sous 3, ou que deux fouilles de suite
//   rapportent moins d'une unité par fouilleur, déménage vers la région voisine la mieux renseignée (pillage intact, infestation
//   calme), à pied ou en véhicule s'il en a un et du carburant ;
// - « enraciné » : choisit le meilleur site accessible (eau, sol, soleil, discrétion ; sa région et ses voisines), s'y installe
//   et construit dans l'ordre (eau, potager, panneaux, batteries, barricades, réserve, compost, …, galerie) ce que le site, les
//   savoir-faire et les stocks permettent ; ne fouille que les alentours (cueillette, pêche, gibier, bois), sauf fouille CIBLÉE de
//   sa région quand il manque un matériau au chantier ou que les stocks d'eau ou de nourriture tombent sous 3 jours ;
// - « mixte » : nomade, puis enraciné après deux déménagements.
// Chaque jour : tâches données par `repartir` (répartition automatique), puis réglées par la stratégie ; deux quarts de travail
// (fouille, chantier, réparations), soins le soir (test de soins, 1 médicament), garde la nuit ; fêtes fêtées (socle des fêtes) ;
// les menaces rendues par `avancer` sont résolues (assaut : resoudreAssaut, brèche : combat, pertes, fuite si la horde reste).
//
// Règles que la logique laisse au MJ et que le simulateur tranche (documentées dans docs/survie-equilibrage.md) :
// - mort de soif après 12 quarts sans boire, mort de faim après 10 jours sans manger (la logique ne fait que fatiguer) ;
// - un survivant dont le moral reste à 0 cinq jours de suite quitte le groupe, sauf s'il a faim (la logique ne fait partir que
//   les recrues) ;
// - rencontre : un seul échange de combat (chacun se bat une fois), puis le groupe se replie ; une morsure vaut un test de soins
//   extrême par le meilleur soigneur, sinon infection ; les corps des morts sont toujours traités (pas de relève) ;
// - brèche : une installation abîmée, l'abri +2 dégâts, un échange de combat contre la force de la menace ; une bande qui entre
//   emporte 30 % des vivres ; si des assaillants restent après l'échange, le groupe FUIT (déménagement forcé) ;
// - un jour de départ (ou de changement de site) est un jour de jeu comme un autre : le temps passe, sans travail ;
// - arrivé dans une région dont tous les sites sont occupés, le groupe repart plus loin ; sans site ni route, la partie s'arrête
//   (fin « impasse », pas « vivants ») ;
// - l'enraciné ne construit une installation qui mange (chiens de garde) que sur un surplus de nourriture produite.
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { cpus } from "node:os";
import { Worker, isMainThread, parentPort, workerData } from "node:worker_threads";
import * as L from "../../systems/lakour-survie/logique/index.mjs";
import { normaliserContenu } from "../../systems/lakour-survie/scripts/registre.mjs";
import { fetesDuJour } from "../../modules/lakour-fenoir/scripts/fetes.js";
import { fetesDuJour as calendrierSocle } from "../../modules/lakour-mj-ia/scripts/fetes-logique.js";

const ICI = dirname(fileURLToPath(import.meta.url));
export const FICHIER_DONNEES = join(ICI, "..", "..", "modules", "lakour-fenoir", "assets", "donnees.json");

export const STRATEGIES = ["passif", "nomade", "enracine", "mixte"];
export const TAILLES = [1, 2, 4, 6];
export const JOURS_DEFAUT = 200;
export const PARTIES_RAPIDE = 20;

// Les règles du simulateur (ce que la logique laisse au MJ).
export const REGLES_SIMULATEUR = {
  mortSoif: 12,            // quarts sans boire
  mortFaim: 10,            // jours sans manger
  joursMoralZero: 5,       // jours de moral 0 avant de partir (sauf si c'est la faim qui le mine)
  joursStocksDepart: 3,    // nomade : déménage sous ce nombre de jours de stocks
  fouillesMaigres: 2,      // nomade : déménage après autant de fouilles qui rapportent moins d'une unité par fouilleur
  demenagementsMixte: 2,   // mixte : s'enracine après autant de déménagements
  partBandeBreche: 0.3,    // ce qu'une bande emporte quand elle entre
  fatigueRepos: 4          // au-dessus, un membre se repose au lieu de travailler
};

// L'ordre de construction de l'enraciné ({ cle, niveau }) : ce que le site, les savoirs et les stocks permettent passe en premier.
export const ORDRE_ENRACINE = [
  ["captage-de-source", 1], ["pompe-manuelle", 1], ["citerne-de-pluie", 1], ["filtre-sable-charbon", 1],
  ["potager", 1], ["panneaux-solaires", 1], ["batteries", 1], ["barricades", 1], ["reserve-etanche", 1], ["sechoir-fumoir", 1],
  ["compost", 1], ["citerne-de-pluie", 2], ["captage-de-source", 2], ["pompe-manuelle", 2], ["basse-cour", 1], ["enclos-a-cabris", 1],
  ["potager", 2], ["galerie-souterraine", 1], ["tunnel-de-lave-amenage", 1], ["camouflage", 1], ["palissade", 1], ["tour-de-guet", 1],
  ["infirmerie", 1], ["dortoir", 1], ["bouilleur-solaire", 1], ["barricades", 2], ["panneaux-solaires", 2], ["batteries", 2],
  ["citerne-de-pluie", 3], ["camouflage", 2], ["galerie-souterraine", 2], ["fosse-et-pieges", 1],
  ["ruches", 1], ["verger", 1], ["serre", 1], ["potager", 3], ["enclos-a-cabris", 2], ["basse-cour", 2], ["mur", 1],
  ["bassin-a-tilapias", 1], ["poste-radio", 1], ["galerie-souterraine", 3], ["tunnel-de-lave-amenage", 2], ["camouflage", 3],
  ["palissade", 2], ["tour-de-guet", 2], ["mur", 2], ["porte-blindee", 1], ["galerie-souterraine", 4], ["mur", 3], ["batteries", 3], ["panneaux-solaires", 3],
  ["chiens-de-garde", 1]
];
const PRIORITE_EMPORT = ["nourriture", "eau", "medicaments", "pieces", "materiaux", "graines", "carburant", "munitions"];
const CAUSES = ["faim", "soif", "assaut", "rencontre", "infection", "maladie", "depart", "impasse", "vivants"];

// ------------------------------------------------------------------ contenu
export function chargerContenu(fichier = FICHIER_DONNEES) {
  const brut = JSON.parse(readFileSync(fichier, "utf8"));
  const contenu = normaliserContenu(brut);
  const erreurs = L.verifierContenu(contenu);
  if (erreurs.length) throw new Error(`Contenu invalide : ${erreurs.slice(0, 5).join(" ; ")}`);
  return contenu;
}

// ------------------------------------------------------------------ outils
const somme = l => l.reduce((s, x) => s + x, 0);
const quantile = (l, q) => { if (!l.length) return 0; const t = [...l].sort((a, b) => a - b); return t[Math.min(t.length - 1, Math.floor(q * t.length))]; };
const moyenne = l => (l.length ? somme(l) / l.length : 0);
const arrondi = (x, n = 1) => Math.round(x * 10 ** n) / 10 ** n;
const pct = (n, d) => (d ? `${Math.round((100 * n) / d)} %` : "—");

const EAU_SCORE = { source: 5, riviere: 5, puits: 3.5, citerne: 0, reseau: 1.5, aucune: 0 };

// Le meilleur site pour s'enraciner (eau d'abord, sol, soleil, discrétion, ce qui existe déjà), avec ses contraintes.
export function scoreSiteEnracine(site, region, membres) {
  let s = (EAU_SCORE[site.eau] ?? 0) + (site.eau === "citerne" ? 0.8 * Number(region.climat?.pluie ?? 0) : 0);
  if (membres >= 5 && !["source", "riviere"].includes(site.eau)) s -= 2;
  s += Number(site.sol ?? 0) * 1.2 + Number(site.soleil ?? 0) * (Number(region.climat?.soleil ?? 1) / 3);
  s += Number(site.discretion ?? 0) + Number(site.defense ?? 0) * 0.5 + (site.installationsDepart?.length ?? 0) * 1;
  s += Number(site.souterrain ?? 0) * 0.3 + Math.min(3, somme(Object.values(site.stocks ?? {}).map(Number)) / 60);
  const nature = L.natureRegion(region);
  s += (nature.cueillette.parJour + nature.peche.parJour + nature.gibier.parJour) * 0.4;
  if (Number(site.capacite ?? 0) < membres) s -= 2;
  s -= Number(region.population ?? 0) * 0.3;
  return s;
}
// Le site d'un nomade ou d'un passif : sûr, discret, avec des stocks.
export function scoreSiteNomade(site, region, visites = []) {
  const stocks = somme(Object.values(site.stocks ?? {}).map(Number));
  return Number(site.defense ?? 0) + Number(site.discretion ?? 0) + stocks / 20 + (EAU_SCORE[site.eau] ?? 0) * 0.3 + (site.installationsDepart?.length ?? 0) * 0.3
    - (visites.includes(site.cle) ? 3 : 0);
}

const bandeScore = { intact: 4, entame: 3, inconnu: 2.5, maigre: 1, vide: 0 };
const infScore = { calme: 1, inconnue: 0, presente: 0, dense: -1.5, grouillante: -3 };

// ------------------------------------------------------------------ une partie
// Options des parties longues (essais/outils/parties-longues.mjs), sans effet sur les autres parties (même hasard) :
// - strategie « sedentaire » : un enraciné qui s'installe dans SA région et ne déménage jamais (ni soif, ni fuite) ;
// - compagnons : les n derniers membres sont des compagnons (statut « compagnon », sans budget de départ, §10.2) ;
// - recrutement : chaque semaine passée à l'abri, si le groupe a une compétence manquante (besoinsDuGroupe) et moins de
//   RECRUES.max membres, une recrue se présente (genererRecrue, favorisée par le profil recherché) et le meilleur orateur tente
//   de la convaincre (recruter) ;
// - controle(jour, instantane) : appelé à la fin de chaque jour avec { etat, monde, abri, survivants, avance (dernier avancer),
//   actions: [faits et rencontres des actions du jour] } (lecture seule) : les vérifications d'invariants.
export const STRATEGIES_LONGUES = [...STRATEGIES, "sedentaire"];
export const RECRUES = { max: 8, tousLes: 7 };
export function jouerPartie(contenu, { strategie = "nomade", membres = 4, region, graine = "1", jours = JOURS_DEFAUT, journal = false, compagnons = 0, recrutement = false, controle = null } = {}) {
  const sedentaire = strategie === "sedentaire";
  const R = REGLES_SIMULATEUR;
  const idx = L.indexer(contenu);
  const hasard = (...c) => L.deriverHasard(graine, ...c);
  const lignes = [];
  const noter = (j, t) => { if (journal) lignes.push(`J${j} ${t}`); };

  // Le groupe.
  const ids = Array.from({ length: membres }, (_, i) => `s${i + 1}`);
  const survivants = ids.map((id, i) => ({ id, system: L.genererSurvivant(contenu, hasard("survivant", i), { statut: i >= membres - compagnons ? "compagnon" : "joueur", region }) }));
  for (const s of survivants) s.nom = s.system.nom || s.id;
  const savoirs = [...new Set(survivants.flatMap(s => s.system.savoirs ?? []))];
  const vehicule = survivants.flatMap(s => s.system.equipement ?? []).map(e => idx.equipements.get(e)).find(e => e && e.type === "vehicule" && e.terrains?.includes("route")) ?? null;

  let { monde, etat } = L.demarrerPartie({ contenu, graine: `${graine}|monde`, region, membres: ids });
  let abri = null;
  let porte = {};
  let enracine = strategie === "enracine" || sedentaire;
  let cibleSite = null;
  const stats = {
    strategie, membres, region, jours: jours, fin: "vivants", autonomeLe: null, demenagements: 0, joursSansEau: 0, joursSansNourriture: 0,
    blocages: {}, cyclones: 0, eruptions: 0, hordes: 0, assauts: 0, assautsApres30: 0, serieuxApres30: 0, joursApres30: 0, breches: 0, morts: {},
    recrues: [], tentatives: 0, manquesDebut: null, manquesFin: null, joursAvecManque: 0,
    joursAbri: 0, bas: { jours: 0, assauts: 0, livides: 0 }, hauts: { jours: 0, assauts: 0, livides: 0 }, joursApres90: 0,
    impasse: null, fetes: 0, rencontres: 0, evitees: 0, installations: 0, mortsApres90: 0, fuites: 0, fouillesMaigres: 0, premiereFaim: null
  };
  let fouillesMaigres = 0;
  let actionsDuJour = [];
  let derniereAvance = null;
  const vivants = () => survivants.filter(s => L.peutAgir(s.system) && etat.groupe.membres.includes(s.id));
  const systemes = () => survivants.map(s => s.system);

  // ---- le site.
  const choisirSite = (strat, regionsCandidates, visites, exclure = []) => {
    let meilleur = null;
    for (const rc of regionsCandidates) {
      const reg = idx.regions.get(rc);
      for (const sc of reg?.sites ?? []) {
        const site = idx.sites.get(sc);
        if (!site || exclure.includes(sc)) continue;
        const occupe = monde.regions[rc]?.abrisAbandonnes?.find(a => a.site === sc)?.occupe;
        if (occupe) continue;
        const score = strat === "enracine" ? scoreSiteEnracine(site, reg, membres) : scoreSiteNomade(site, reg, visites);
        if (!meilleur || score > meilleur.score) meilleur = { site: sc, region: rc, score };
      }
    }
    return meilleur;
  };
  const installer = (siteCle, jour) => {
    const r = L.installerAbri(monde, contenu, { site: siteCle, jour, quart: jour * 4, apport: porte });
    if (!r.ok) return false;
    monde = r.monde;
    abri = { id: "abri", system: r.abri, installations: r.installations };
    porte = {};
    etat = { ...etat, groupe: { ...etat.groupe, abri: "abri", region: r.abri.region } };
    noter(jour, `s'installe : ${idx.sites.get(siteCle)?.nom} (${r.abri.region}) stocks ${JSON.stringify(r.abri.stocks)}`);
    return true;
  };

  // ---- combat d'une rencontre ou d'une brèche : un échange par combattant, puis repli. -> { restants }
  const combattre = (combattants, adversaires, quart, h, cause) => {
    let restants = Math.max(0, adversaires.nombre);
    const creature = { des: adversaires.des ?? 1, resistance: adversaires.resistance ?? 1, type: adversaires.type ?? "livide" };
    for (const s of combattants) {
      if (restants <= 0 || !L.peutAgir(s.system)) break;
      const niveau = Math.max(L.competence(s.system, "combat").niveau, L.competence(s.system, "tir").niveau);
      const malus = L.malusEtat(s.system).total;
      const r = L.resoudreCombat({ niveau, livides: Math.min(restants, 4), creature, malus, hasard: h });
      restants -= r.neutralises;
      if (r.blessures > 0) {
        const b = L.blesser(s.system, r.blessures, { morsure: r.morsures > 0 });
        s.system = b.system;
        s.derniereCause = cause;
        if (b.morsure) {
          const soigneur = meilleurSoigneur();
          const bonus = (abri?.system.stocks?.medicaments ?? 0) > 0 ? 1 : 0;
          if (bonus && abri) abri.system.stocks = L.ajouterStocks(abri.system.stocks, { medicaments: -1 });
          const test = L.resoudreTest({ niveau: soigneur?.niveau ?? 0, difficulte: "extreme", bonus, hasard: h, compte: false });
          const m = L.appliquerMorsure(s.system, test, quart);
          s.system = m.system;
          if (m.infecte) s.derniereCause = "infection";
        }
      }
    }
    return { restants };
  };
  const meilleurSoigneur = () => {
    let m = null;
    for (const s of vivants()) {
      if (s.system.incapacites?.includes("soins")) continue;
      const niveau = L.competence(s.system, "soins").niveau - L.malusEtat(s.system).total;
      if (!m || niveau > m.niveau) m = { s, niveau: Math.max(0, niveau) };
    }
    return m;
  };
  const resoudreRencontre = (rencontre, combattants, quart, h) => {
    if (!rencontre) return;
    stats.rencontres++;
    // Dépassés en nombre, on essaie de passer inaperçu (test de discrétion du moins discret) avant de se battre.
    const valides = combattants.filter(x => L.peutAgir(x.system));
    if (rencontre.nombre > valides.length && valides.length) {
      const pire = Math.min(...valides.map(x => L.competence(x.system, "discretion").niveau - L.malusEtat(x.system).total));
      if (L.resoudreTest({ niveau: Math.max(0, pire), difficulte: "normale", hasard: h, compte: false }).reussite) { stats.evitees++; return; }
    }
    if (rencontre.type === "livides") combattre(combattants, { nombre: rencontre.nombre, des: rencontre.des, resistance: rencontre.resistance, type: "livide" }, quart, h, "rencontre");
    else if (rencontre.type === "animaux") combattre(combattants, { nombre: rencontre.nombre, des: rencontre.des, resistance: rencontre.resistance, type: "animal" }, quart, h, "rencontre");
    else if (rencontre.type === "humains" && rencontre.attitude === "hostile") combattre(combattants, { nombre: rencontre.nombre, des: 2, resistance: 2, type: "humain" }, quart, h, "rencontre");
    else if (rencontre.type === "danger") {
      const s = L.choisir(combattants.filter(x => L.peutAgir(x.system)), h);
      if (s && !L.resoudreTest({ niveau: L.competence(s.system, "endurance").niveau, difficulte: "normale", hasard: h, compte: false }).reussite) {
        s.system = L.blesser(s.system, 1).system; s.derniereCause = "rencontre";
      }
    }
  };

  // ---- déménager vers une région (nomade, mixte, fuite) ou vers un autre site de la même région. -> true si parti
  const demenagerVers = (vers, jour, h) => {
    const stocks = abri?.system.stocks ?? porte;
    const carburant = Number(stocks.carburant) || 0;
    if (vers === etat.groupe.region) {
      if (!abri || !cibleSite) return false;
      const emporter = Object.fromEntries(PRIORITE_EMPORT.map(r => [r, Number(stocks[r]) || 0]));
      const d = L.demenager(monde, { abri: abri.system, installations: abri.installations, emporter, transport: vehicule ?? "pied", membres: vivants().length, jour });
      monde = d.monde; porte = d.emporte; abri = null;
      stats.demenagements++;
      const site = cibleSite; cibleSite = null;
      return installer(site, jour);
    }
    let transport = "pied";
    if (vehicule) {
      const essai = L.voyager(monde, contenu, h, { de: etat.groupe.region, vers, transport: vehicule, membres: vivants().length, jour, renseignements: etat.renseignements, carburant });
      if (essai.possible) transport = vehicule;
    }
    const v = L.voyager(monde, contenu, h, { de: etat.groupe.region, vers, transport, membres: vivants().length, jour, quart: jour * 4, renseignements: etat.renseignements, carburant });
    if (!v.possible) return false;
    const emporter = Object.fromEntries(PRIORITE_EMPORT.map(r => [r, Number(stocks[r]) || 0]));
    if (abri) {
      const d = L.demenager(monde, { abri: abri.system, installations: abri.installations, emporter, transport, membres: vivants().length, jour });
      monde = d.monde;
      porte = d.emporte;
    } else porte = emporter;
    porte = L.ajouterStocks(porte, { carburant: -v.carburant });
    abri = null;
    etat = { ...etat, renseignements: v.renseignements, groupe: { ...etat.groupe, abri: "", enRoute: { de: etat.groupe.region, vers, route: v.chemin.join(" → "), reste: v.quarts, transport: transport === "pied" ? "pied" : "vehicule" } } };
    actionsDuJour.push(...v.faits, ...v.rencontres);
    for (const r of v.rencontres) resoudreRencontre(r, vivants(), jour * 4, h);
    stats.demenagements++;
    noter(jour, `déménage vers ${vers} (${v.quarts} quarts, ${transport === "pied" ? "à pied" : "en véhicule"}), emporte ${JSON.stringify(porte)}`);
    return true;
  };
  const regionVoisineChoisie = (h, exclure = []) => {
    const ici = etat.groupe.region;
    const options = L.voisinsDe(contenu, ici).map(v => {
      const r = etat.renseignements[v.region] ?? {};
      const visites = monde.regions[v.region]?.sitesVisites?.length ?? 0;
      const route = r.routes?.[ici] ?? etat.renseignements[ici]?.routes?.[v.region] ?? "ouverte";
      let score = (bandeScore[r.pillage] ?? 2.5) + (infScore[r.infestation] ?? 0) - visites * 1.5 + (v.terrain === "route" ? 0.5 : 0) - v.quartsPied * 0.2;
      if (route === "coupee") score -= 5;
      if (exclure.includes(v.region)) score -= 100;
      return { region: v.region, score: score + h() * 0.5 };
    }).sort((a, b) => b.score - a.score);
    return options;
  };
  const partir = (jour, h, raison) => {
    const exclure = [];
    for (const o of regionVoisineChoisie(h)) {
      if (demenagerVers(o.region, jour, h)) { noter(jour, `part (${raison})`); return true; }
      exclure.push(o.region);
    }
    return false;
  };

  // ---- l'enraciné choisit où s'installer (sa région ou une voisine) : vers une voisine, il y va d'abord.
  const sEnraciner = (jour, h, exclure = []) => {
    if (sedentaire && abri) return false; // ne déménage jamais
    const candidates = sedentaire ? [etat.groupe.region] : [etat.groupe.region, ...L.voisinsDe(contenu, etat.groupe.region).map(v => v.region)];
    const choix = choisirSite("enracine", candidates, [], exclure);
    if (!choix) return false;
    if (abri && choix.site === abri.system.site) return true; // on est déjà au meilleur endroit
    cibleSite = choix.site;
    if (choix.region === etat.groupe.region && !abri) { cibleSite = null; return installer(choix.site, jour); }
    return demenagerVers(choix.region, jour, h);
  };

  // ---- construire (enraciné).
  const installationNourrie = (def, niveau) => Number(L.niveauDe(def, niveau)?.effets?.consommation?.nourriture) > 0;
  const construire = (jour, h) => {
    const site = idx.sites.get(abri.system.site);
    const groupe = { savoirs, plans: etat.groupe.plans };
    const ouvert = abri.installations.find(i => Number(i.chantier?.requis) > 0);
    let besoin = null;
    if (!ouvert) {
      for (const [cle, niveau] of ORDRE_ENRACINE) {
        const def = idx.installations.get(cle);
        const inst = abri.installations.find(i => i.cle === cle);
        if (!def || (Number(inst?.niveau) || 0) !== niveau - 1) continue;
        // Des bêtes à nourrir (chiens de garde) : seulement sur un surplus de nourriture produite.
        if (installationNourrie(def, niveau) && !((abri.bilan?.net?.nourriture ?? -1) >= 1)) continue;
        const v = L.peutConstruire(def, niveau, { stocks: abri.system.stocks, installations: abri.installations }, site, groupe);
        if (v.ok) {
          const o = L.ouvrirChantier(def, { stocks: abri.system.stocks, installations: abri.installations }, site, groupe);
          if (!o.ok) continue;
          abri.system.stocks = o.stocks;
          abri.installations = inst ? abri.installations.map(i => (i.cle === cle ? o.instance : i)) : [...abri.installations, o.instance];
          noter(jour, `ouvre le chantier ${cle} niveau ${niveau} (${o.instance.chantier.requis} quarts-personne)`);
          break;
        }
        if (!besoin && v.motifs.length === 1 && v.motifs[0].cle === "manque") besoin = v.motifs[0].params.manque;
      }
    }
    return besoin;
  };
  const travaillerChantier = (ouvriers, jour) => {
    const ouvert = abri.installations.find(i => Number(i.chantier?.requis) > 0);
    if (!ouvert || !ouvriers.length) return;
    const def = idx.installations.get(ouvert.cle);
    const r = L.avancerChantier(ouvert, def, { quarts: 2, bras: ouvriers.length, jour });
    abri.installations = abri.installations.map(i => (i.cle === ouvert.cle ? r.instance : i));
    if (r.termine) {
      etat = L.ajouterPlan(etat, r.plan);
      stats.installations++;
      noter(jour, `achève ${ouvert.cle} niveau ${r.niveau}`);
    }
  };
  const reparer = (bricoleurs, jour) => {
    if (!bricoleurs.length) return;
    if ((abri.system.degats ?? 0) > 0) {
      const r = L.reparerAbri(abri.system, { quarts: 2, bras: bricoleurs.length });
      abri.system = r.abri;
      return;
    }
    const abimee = abri.installations.find(i => Number(i.etat) > 0 && Number(i.niveau) >= 1);
    if (abimee && (abri.system.stocks.materiaux ?? 0) > 0) {
      const r = L.reparerInstallation(abimee, idx.installations.get(abimee.cle), { quarts: 2, bras: bricoleurs.length, materiaux: abri.system.stocks.materiaux });
      abri.installations = abri.installations.map(i => (i.cle === abimee.cle ? r.instance : i));
      abri.system.stocks = L.ajouterStocks(abri.system.stocks, { materiaux: -r.cout.materiaux });
    }
  };

  // ---- fouilles.
  const prudencePour = regionCle => (["dense", "grouillante"].includes(etat.renseignements[regionCle]?.infestation) ? "discret" : "normal");
  const fouillerRegion = (fouilleurs, cible, jour, h) => {
    if (!fouilleurs.length) return 0;
    const regionCle = abri.system.region;
    const prudence = prudencePour(regionCle);
    const f = L.fouiller(monde, contenu, h, { region: regionCle, cible, membres: fouilleurs.length, quarts: 2, prudence, jour, moment: "matin", abri: abri.system, renseignements: etat.renseignements });
    monde = f.monde;
    abri.system = { ...f.abri, stocks: L.ajouterStocks(f.abri.stocks, f.butin), bruit: Math.min(10, (f.abri.bruit ?? 0) + f.bruit) };
    etat = L.noterFouille({ ...etat, renseignements: f.renseignements }, jour);
    actionsDuJour.push(...f.faits, ...(f.rencontre ? [f.rencontre] : []));
    resoudreRencontre(f.rencontre, fouilleurs, jour * 4, h);
    noter(jour, `fouille ${cible ?? "générale"} (${fouilleurs.length}, ${prudence}) : ${JSON.stringify(f.butin)}${f.rencontre ? ` — rencontre ${f.rencontre.texte}` : ""}`);
    return somme(Object.values(f.butin));
  };
  const fouillerNature = (cueilleurs, jour, h, voulu = null) => {
    if (!cueilleurs.length) return 0;
    const n = abri.system.nature ?? {};
    const parJour = L.natureRegion(idx.regions.get(abri.system.region));
    const ordre = (voulu ? [voulu] : ["cueillette", "peche", "gibier"]).filter(k => parJour[k].parJour > 0 && (n[k] ?? 0) >= 1).sort((a, b) => (n[b] ?? 0) - (n[a] ?? 0));
    const cible = ordre[0] ?? null;
    if (!cible) return 0;
    const f = L.fouiller(monde, contenu, h, { region: abri.system.region, cible, membres: cueilleurs.length, quarts: 2, prudence: prudencePour(abri.system.region), jour, abri: abri.system, renseignements: etat.renseignements });
    monde = f.monde;
    abri.system = { ...f.abri, stocks: L.ajouterStocks(f.abri.stocks, f.butin) };
    actionsDuJour.push(...f.faits, ...(f.rencontre ? [f.rencontre] : []));
    resoudreRencontre(f.rencontre, cueilleurs, jour * 4, h);
    return somme(Object.values(f.butin));
  };

  // ---- soins du soir : chaque blessé (≥ 2) reçoit un test de soins du meilleur soigneur (1 médicament s'il y en a).
  const soigner = (jour, h) => {
    const soigneur = meilleurSoigneur();
    if (!soigneur) return [];
    const stabilises = [];
    for (const s of vivants().filter(x => Number(x.system.blessures) >= 2).sort((a, b) => b.system.blessures - a.system.blessures)) {
      const mourant = s.system.blessures >= 4;
      const bonus = abri && (abri.system.stocks.medicaments ?? 0) > 0 ? 1 : 0;
      if (bonus) abri.system.stocks = L.ajouterStocks(abri.system.stocks, { medicaments: -1 });
      const test = L.resoudreTest({ niveau: soigneur.niveau, difficulte: mourant ? "difficile" : "normale", bonus: bonus + (abri ? Number(abri.bilan?.soins) || 0 : 0), hasard: h, compte: false });
      if (test.reussite) { s.system = L.soigner(s.system, test).system; if (mourant) stabilises.push(s.id); }
      if (soigneur.s.id === s.id && !test.reussite) break;
    }
    return stabilises;
  };

  // ---- les menaces du jour (après avancer).
  const resoudreMenaces = (menaces, jour, h) => {
    if (!abri) return;
    const bilan = L.bilanAbri(abri.system, abri.installations, contenu, { jour, personnes: vivants().length });
    const gardes = vivants().filter(s => s.system.tache === "garde");
    const vigilance = Math.max(0, ...gardes.map(s => L.competence(s.system, "vigilance").niveau - L.malusEtat(s.system).total));
    for (const m of menaces) {
      if (m.type === "horde") stats.hordes++;
      if (m.type === "visite") continue;
      if (m.type === "accident") {
        const s = L.choisir(vivants(), h);
        if (s) { s.system = L.blesser(s.system, 1).system; s.derniereCause = "accident"; }
        continue;
      }
      if (!(m.force > 0)) continue;
      stats.assauts++;
      if (jour > 30) stats.assautsApres30++;
      if (jour > 30 && m.force >= 3) stats.serieuxApres30++;
      const bas = L.estDesBas(idx.regions.get(abri.system.region));
      if (jour > 90) stats[bas ? "bas" : "hauts"].assauts++;
      const a = L.resoudreAssaut({ defense: bilan.defense, vigilance, force: m.force, hasard: h });
      abri.system = L.endommagerAbri(abri.system, a.degats);
      if (a.installationEndommagee) {
        const cibles = abri.installations.filter(i => Number(i.niveau) >= 1);
        const c = L.choisir(cibles, h);
        if (c) abri.installations = abri.installations.map(i => (i === c ? L.endommagerInstallation(i, 1) : i));
      }
      if (a.issue === "endommagee") {
        const s = L.choisir(gardes.length ? gardes : vivants(), h);
        if (s) { s.system = L.blesser(s.system, 1).system; s.derniereCause = "assaut"; }
      }
      if (a.issue === "breche") {
        stats.breches++;
        noter(jour, `BRÈCHE (${m.type}, force ${m.force}, défense ${bilan.defense}+${vigilance})`);
        const adversaires = m.type === "bande" ? { nombre: m.force, des: 2, resistance: 2, type: "humain" } : m.type === "animaux" ? { nombre: m.force, des: 2, resistance: 1, type: "animal" } : { nombre: m.force, des: 1, resistance: 1, type: "livide" };
        const r = combattre(vivants(), adversaires, jour * 4 + 3, h, "assaut");
        if (m.type === "bande") {
          const pris = {};
          for (const res of ["nourriture", "eau", "medicaments", "munitions"]) pris[res] = -Math.floor((abri.system.stocks[res] ?? 0) * R.partBandeBreche);
          abri.system.stocks = L.ajouterStocks(abri.system.stocks, pris);
        }
        // Une bande qui a pris sa part repart ; des Livides ou des chiens qui restent plus nombreux que les valides : on fuit.
        const valides = vivants().filter(s => Number(s.system.blessures) < 3).length;
        if (m.type !== "bande" && r.restants > valides && vivants().length) {
          stats.fuites++;
          noter(jour, `fuit l'abri (${r.restants} assaillants restent, ${valides} valides)`);
          if (sedentaire) noter(jour, "reste malgré la brèche (sédentaire)");
          else if (!partir(jour, h, "fuite")) noter(jour, "ne peut pas fuir : aucune route");
          return;
        }
      }
    }
  };

  // ---- fêtes.
  const feterSiFete = jour => {
    if (!abri) return;
    const d = L.dateDuJour(jour, monde.dateDepart);
    for (const f of fetesDuJour(d.iso, calendrierSocle)) {
      if (!f.coeur) continue;
      const r = L.feter(etat, abri, { fete: f.cle, annee: d.annee, survivants: vivants() });
      if (!r.ok) continue;
      etat = r.etat; abri = { ...abri, system: r.abri.system };
      for (const n of r.survivants) { const s = survivants.find(x => x.id === n.id); if (s) s.system = n.system; }
      stats.fetes++;
    }
  };

  // ------------------------------------------------------------------ la boucle des jours
  // En route : on avance, on mange ce qu'on porte ; à l'arrivée, on s'installe.
  const jourDeRoute = jour => {
    const mange = (porte.nourriture ?? 0) >= vivants().length;
    if (mange) porte = L.ajouterStocks(porte, { nourriture: -vivants().length });
    const r = L.avancer({ etat, monde, contenu, quarts: 4, survivants, abri: null, options: { mangeHorsAbri: mange, corpsTraites: ids } });
    appliquer(r);
    if (!etat.groupe.enRoute) {
      const cible = cibleSite && idx.sites.get(cibleSite)?.region === etat.groupe.region ? cibleSite : choisirSite(enracine ? "enracine" : "nomade", [etat.groupe.region], monde.regions[etat.groupe.region]?.sitesVisites ?? [])?.site;
      cibleSite = null;
      if (cible) installer(cible, jour + 1);
    }
    finDeJour(jour + 1);
  };
  // Un jour de déménagement (départ, ou changement de site dans la région) : le temps passe aussi, sans travail.
  const jourSansTravail = (jour, h) => {
    if (etat.groupe.enRoute) return jourDeRoute(jour);
    const r = L.avancer({ etat, monde, contenu, quarts: 4, survivants, abri, options: { corpsTraites: ids } });
    appliquer(r);
    if (abri) resoudreMenaces(r.menaces, jour + 1, h);
    finDeJour(jour + 1);
  };
  let jour = 0;
  for (jour = 0; jour < jours; jour++) {
    const h = hasard("jour", jour);
    let dernierFouille = 0;
    if (!vivants().length) break;

    if (etat.groupe.enRoute) { jourDeRoute(jour); continue; }

    // Jour 0 (ou arrivée sans site libre) : où s'installer ; tous les sites de la région sont occupés : on repart plus loin.
    // Plus aucun site ni aucune route : impasse, la partie s'arrête là.
    if (!abri) {
      let ok;
      if (enracine) ok = sEnraciner(jour, h);
      else {
        const choix = choisirSite("nomade", [etat.groupe.region], monde.regions[etat.groupe.region]?.sitesVisites ?? []);
        ok = Boolean(choix && installer(choix.site, jour));
      }
      if (!ok) {
        if (sedentaire || !partir(jour, h, "région pleine")) { stats.impasse = jour; break; }
        stats.regionsPleines = (stats.regionsPleines ?? 0) + 1;
      }
      if (!abri) { jourSansTravail(jour, h); continue; }
    }

    // Décision du nomade : partir ?
    const bilan = L.bilanAbri(abri.system, abri.installations, contenu, { jour, personnes: vivants().length, dateDepart: monde.dateDepart });
    if (!enracine && strategie !== "passif") {
      const js = Math.min(bilan.joursDeStocks.eau, bilan.joursDeStocks.nourriture);
      const regionVide = ["maigre", "vide"].includes(etat.renseignements[abri.system.region]?.pillage);
      if ((js < R.joursStocksDepart && regionVide) || fouillesMaigres >= R.fouillesMaigres || (js < 1 && jour > 2)) {
        if (strategie === "mixte" && stats.demenagements >= R.demenagementsMixte) { enracine = true; noter(jour, "s'enracine"); if (sEnraciner(jour, h)) { jourSansTravail(jour, h); continue; } }
        else if (partir(jour, h, `stocks ${js} j, fouilles maigres ${fouillesMaigres}`)) { fouillesMaigres = 0; jourSansTravail(jour, h); continue; }
      }
    }

    // Tâches du jour : la répartition automatique, puis la stratégie garde ce qui sert vraiment (la garde, les bras des
    // installations présentes) et envoie les autres travailler ; les épuisés et les blessés graves se reposent.
    const besoins = L.besoinsDuGroupe(vivants(), abri, contenu, etat);
    const taches = L.repartir(vivants(), besoins, contenu);
    const tachesABras = new Set(abri.installations.filter(i => Number(i.niveau) >= 1).map(i => L.niveauDe(idx.installations.get(i.cle), i.niveau)?.effets?.bras?.tache).filter(Boolean));
    const n = vivants().length;
    const reservees = new Set(n >= 3 ? ["garde", ...tachesABras] : n === 2 ? ["garde"] : []);
    const gardes = new Set();
    for (const s of vivants()) {
      let t = taches[s.id] ?? "repos";
      if (!reservees.has(t)) t = "repos";
      if (t === "garde" && gardes.size >= (n >= 5 ? 2 : 1)) t = "repos";
      if (Number(s.system.fatigue) >= R.fatigueRepos || Number(s.system.blessures) >= 3) t = "repos";
      const a = L.assigner(s.system, t, jour);
      if (a.ok) s.system = a.system;
      if (s.system.tache === "garde") gardes.add(s.id);
    }
    if (!gardes.size && n >= 2) {
      const g = vivants().filter(s => s.system.tache === "repos" && L.peutFaire(s.system, "garde") && Number(s.system.fatigue) < R.fatigueRepos)
        .sort((a, b) => L.competence(b.system, "vigilance").niveau - L.competence(a.system, "vigilance").niveau)[0];
      if (g) { g.system = L.assigner(g.system, "garde", jour).system; gardes.add(g.id); }
    }
    const manqueEau = bilan.joursDeStocks.eau < 3, manqueNourriture = bilan.joursDeStocks.nourriture < 3;
    // Un épuisé se repose, sauf quand l'eau ou la nourriture manque : on va chercher à boire même fourbu.
    const libres = () => vivants().filter(s => s.system.tache === "repos" && Number(s.system.blessures) < 3 && (Number(s.system.fatigue) < R.fatigueRepos || manqueEau || manqueNourriture));
    const poser = (liste, tache) => { for (const s of liste) { const a = L.assigner(s.system, tache, jour); if (a.ok) s.system = a.system; } };

    // Travail.
    let doitPartir = null;
    if (strategie === "passif") {
      // rien
    } else if (enracine) {
      const besoin = construire(jour, h);
      const ouvert = abri.installations.find(i => Number(i.chantier?.requis) > 0);
      let dispo = libres().sort((a, b) => L.competence(b.system, "bricolage").niveau - L.competence(a.system, "bricolage").niveau);
      // Manger et boire d'abord : les alentours, sinon la région (fouille ciblée).
      if (manqueNourriture && dispo.length) {
        const k = Math.ceil(dispo.length / 2);
        const cueilleurs = [...dispo].sort((a, b) => L.competence(b.system, "survie").niveau - L.competence(a.system, "survie").niveau).slice(0, k);
        dispo = dispo.filter(s => !cueilleurs.includes(s));
        poser(cueilleurs, "chasse");
        if (fouillerNature(cueilleurs, jour, h) < cueilleurs.length) { poser(cueilleurs, "fouille"); fouillerRegion(cueilleurs, "nourriture", jour, h); }
      }
      if (manqueEau && dispo.length && (bilan.net.eau ?? 0) < 0) {
        const e = dispo.slice(0, 2); dispo = dispo.slice(2); poser(e, "fouille");
        const trouvee = fouillerRegion(e, "eau", jour, h);
        // Plus d'eau à trouver et le site n'en donne pas assez : on cherche un site avec de l'eau (sa région ou une voisine).
        if (jour > 1 && (abri.system.stocks.eau ?? 0) < bilan.consommation.eau && trouvee < bilan.consommation.eau) doitPartir = `soif (site ${abri.system.site})`;
      }
      if (ouvert && dispo.length) {
        const ouvriers = dispo.slice(0, 2);
        dispo = dispo.slice(2);
        poser(ouvriers, "chantier");
        travaillerChantier(ouvriers, jour);
      } else if (dispo.length && ((abri.system.degats ?? 0) > 0 || abri.installations.some(i => i.etat > 0 && i.niveau >= 1))) {
        poser(dispo.slice(0, 1), "chantier");
        reparer(dispo.slice(0, 1), jour);
        dispo = dispo.slice(1);
      }
      if (besoin && dispo.length) {
        const res = Object.keys(besoin)[0];
        stats.blocages[res] = (stats.blocages[res] ?? 0) + 1;
        const f = dispo.slice(0, 2);
        dispo = dispo.slice(2);
        // Des matériaux : le bois des alentours d'abord, sinon la fouille ciblée de la région.
        if (res === "materiaux" && (abri.system.nature?.bois ?? 0) >= 2) { poser(f, "chasse"); fouillerNature(f, jour, h, "bois"); }
        else { poser(f, "fouille"); fouillerRegion(f, res, jour, h); }
      }
      if (dispo.length) { poser(dispo, "chasse"); fouillerNature(dispo, jour, h); }
      if (doitPartir && sEnraciner(jour, h, [abri.system.site])) { noter(jour, `part (${doitPartir})`); jourSansTravail(jour, h); continue; }
    } else {
      // Nomade : tout le monde fouille, sauf la garde ; ciblé si l'eau ou la nourriture manque ; un cueilleur aux alentours.
      let dispo = libres();
      const cible = manqueEau ? "eau" : manqueNourriture ? "nourriture" : null;
      if (cible && dispo.length > 1) {
        const k = Math.ceil(dispo.length / 2);
        const f = dispo.slice(0, k);
        dispo = dispo.slice(k);
        poser(f, "fouille");
        dernierFouille += fouillerRegion(f, cible, jour, h);
      }
      if (dispo.length > 1) {
        const c = dispo.slice(-1);
        poser(c, "chasse");
        const nat = fouillerNature(c, jour, h);
        dernierFouille += nat;
        if (nat > 0) dispo = dispo.slice(0, -1);
      }
      poser(dispo, "fouille");
      const b = fouillerRegion(dispo, cible, jour, h);
      dernierFouille += b;
      if (dispo.length && b < dispo.length) { fouillesMaigres++; stats.fouillesMaigres++; } else fouillesMaigres = 0;
    }

    // Recrutement (parties longues) : une recrue par semaine se présente si une compétence manque.
    if (recrutement && abri) {
      const b = L.besoinsDuGroupe(vivants(), abri, contenu, etat);
      if (stats.manquesDebut === null) stats.manquesDebut = [...b.manques];
      if (b.manques.length) stats.joursAvecManque++;
      if (jour > 0 && jour % RECRUES.tousLes === 0 && b.manques.length && vivants().length < RECRUES.max) {
        const hr = hasard("recrue", jour);
        const r = L.genererRecrue(contenu, hr, { besoins: b, region: abri.system.region, phase: etat.phase });
        const parleur = [...vivants()].sort((a, c) => L.competence(c.system, "parole").niveau - L.competence(a.system, "parole").niveau)[0];
        const t = L.recruter({ recrue: r.survivant, parleur: parleur?.system, attitude: "neutre", besoins: b, hasard: hr });
        stats.tentatives++;
        const comble = b.manques.filter(c => L.competence(r.survivant, c).niveau >= 2);
        const somme = L.COMPETENCES.reduce((x, c) => x + L.competence(r.survivant, c).niveau, 0);
        if (t.reussite) {
          const id = `r${survivants.length + 1}`;
          survivants.push({ id, nom: t.recrue.nom || id, system: t.recrue });
          etat = L.ajouterMembre(etat, id, "recrue");
          ids.push(id);
          stats.recrues.push({ jour, manques: [...b.manques], comble, somme });
          noter(jour, `recrute ${t.recrue.nom} (manques ${b.manques.join(",")}, comble ${comble.join(",") || "rien"})`);
        }
      }
      stats.manquesFin = [...b.manques];
    }

    // Soir : soins, fête.
    const stabilises = soigner(jour, h);
    feterSiFete(jour);

    // La journée passe.
    const r = L.avancer({ etat, monde, contenu, quarts: 4, survivants, abri, options: { stabilises, corpsTraites: ids, veille: vivants().filter(s => s.system.tache === "garde").map(s => s.id) } });
    appliquer(r);
    if (abri) {
      abri.bilan = r.bilan;
      stats.joursAbri++;
      const bas = L.estDesBas(idx.regions.get(abri.system.region));
      if (jour + 1 > 90) { stats[bas ? "bas" : "hauts"].jours++; stats.joursApres90++; }
      if ((abri.system.stocks.eau ?? 0) <= 0) stats.joursSansEau++;
      if ((abri.system.stocks.nourriture ?? 0) <= 0) stats.joursSansNourriture++;
      if (jour + 1 > 30) stats.joursApres30++;
      for (const m of r.menaces) if (m.type === "livides" && jour + 1 > 90) stats[bas ? "bas" : "hauts"].livides++;
    }
    if (etat.autonome && stats.autonomeLe === null) { stats.autonomeLe = jour + 1; noter(jour + 1, "AUTONOME"); }
    if (stats.premiereFaim === null && survivants.some(s => Number(s.system.faim) >= 1)) stats.premiereFaim = jour + 1;
    for (const f of r.faits) {
      if (f.cle === "cyclone-rouge" && f.trajectoire?.includes(etat.groupe.region)) stats.cyclones++;
      if (f.cle === "eruption") stats.eruptions++;
    }
    resoudreMenaces(r.menaces, jour + 1, h);
    finDeJour(jour + 1);
    if (journal && ((jour + 1) % 10 === 0 || jour < 12) && abri) noter(jour + 1, `stocks ${JSON.stringify(abri.system.stocks)} autonome ${etat.joursAutonomes} j, installations ${abri.installations.filter(i => i.niveau >= 1).map(i => `${i.cle}${i.niveau}`).join(",")}, état ${vivants().map(s => `${s.nom} b${s.system.blessures} f${s.system.fatigue} m${s.system.moral} faim${s.system.faim}`).join(" ; ")}`);
  }

  function appliquer(r) {
    derniereAvance = r;
    etat = { ...r.etat, journal: [], alertes: [] };
    monde = { ...r.monde, journalSecret: [] };
    if (abri && r.acteurs.abri) abri = { ...abri, system: r.acteurs.abri.system, installations: r.acteurs.abri.installations };
    for (const c of r.acteurs.survivants) {
      const s = survivants.find(x => x.id === c.id);
      if (!s) continue;
      s.system = c.system;
      for (const ev of c.evenements) if (ev.cle === "mort") s.derniereCause = ev.cause === "infection" ? "infection" : s.derniereCause ?? "assaut";
    }
  }
  // Fin de jour : morts du simulateur (soif, faim), départs, statistiques de fin.
  function finDeJour(j) {
    const compter = (s, c) => { s.compte = true; s.finLe = j; s.derniereCause = c; stats.morts[c] = (stats.morts[c] ?? 0) + 1; if (j > 90) stats.mortsApres90++; noter(j, `${s.nom} ${c === "depart" ? "s'en va" : `meurt (${c})`}`); };
    for (const s of survivants) {
      if (s.compte || !etat.groupe.membres.includes(s.id)) continue;
      if (!L.peutAgir(s.system)) { compter(s, CAUSES.includes(s.derniereCause) ? s.derniereCause : "assaut"); continue; }
      if (Number(s.system.soif) >= R.mortSoif) { s.system = { ...s.system, vivant: false }; compter(s, "soif"); continue; }
      if (Number(s.system.faim) >= R.mortFaim) { s.system = { ...s.system, vivant: false }; compter(s, "faim"); continue; }
      if ((s.system.afflictions ?? []).some(a => a.stade === "aggravee" && a.malus >= 3) && Number(s.system.fatigue) >= 5 && Number(s.system.faim) >= 2) { s.system = { ...s.system, vivant: false }; compter(s, "maladie"); continue; }
      // Un moral à zéro cinq jours de suite fait partir, sauf quand c'est la faim qui le mine (on reste, et on meurt de faim).
      s.joursMoralZero = Number(s.system.moral) <= 0 && Number(s.system.faim) < 2 ? (s.joursMoralZero ?? 0) + 1 : 0;
      if (s.joursMoralZero >= R.joursMoralZero) { etat = L.retirerMembre(etat, s.id); compter(s, "depart"); }
    }
    stats.jours = j;
    if (controle) controle(j, { etat, monde, abri, survivants, avance: derniereAvance, actions: actionsDuJour, stats });
    actionsDuJour = [];
    derniereAvance = null;
    if (!vivants().length) {
      const dernier = survivants.filter(s => s.compte).sort((a, b) => b.finLe - a.finLe)[0];
      stats.fin = dernier?.derniereCause ?? "assaut";
    }
  }
  if (vivants().length) stats.fin = stats.impasse === null ? "vivants" : "impasse";
  stats.regionFin = abri?.system.region ?? etat.groupe.region;
  stats.installationsFin = abri ? abri.installations.filter(i => i.niveau >= 1).map(i => `${i.cle}${i.niveau}`) : [];
  stats.journal = lignes;
  return stats;
}

// ------------------------------------------------------------------ les cas
export function casDe(liste) {
  const tous = STRATEGIES.flatMap(s => TAILLES.map(t => ({ strategie: s, membres: t })));
  if (!liste) return tous;
  tous.push(...TAILLES.map(t => ({ strategie: "sedentaire", membres: t })));
  const voulus = String(liste).split(",").map(x => x.trim()).filter(Boolean);
  return tous.filter(c => voulus.includes(`${c.strategie}-${c.membres}`));
}

// Joue `parties` parties d'un cas : la région de départ tourne sur toutes les régions. -> [stats]
export function jouerCas(contenu, cas, { parties, graine, jours }) {
  const regions = L.regionsDe(contenu).map(r => r.cle);
  const sortie = [];
  for (let i = 0; i < parties; i++) {
    const region = regions[i % regions.length];
    sortie.push(jouerPartie(contenu, { ...cas, region, graine: `${graine}|${cas.strategie}|${cas.membres}|${i}`, jours }));
  }
  return sortie;
}

// ------------------------------------------------------------------ mesures
export function mesurer(resultats, { jours = JOURS_DEFAUT } = {}) {
  const parCas = {};
  for (const r of resultats) (parCas[`${r.strategie}-${r.membres}`] ??= []).push(r);
  const cas = {};
  for (const [cle, l] of Object.entries(parCas)) {
    const j = l.map(x => x.jours);
    const causes = {};
    for (const x of l) causes[x.fin] = (causes[x.fin] ?? 0) + 1;
    const autonomes = l.filter(x => x.autonomeLe !== null);
    const vivants30 = l.filter(x => x.jours > 30);
    const blocages = {};
    for (const x of l) for (const [res, n] of Object.entries(x.blocages)) blocages[res] = (blocages[res] ?? 0) + n;
    const limitante = Object.entries({ eau: somme(l.map(x => x.joursSansEau)), nourriture: somme(l.map(x => x.joursSansNourriture)) }).sort((a, b) => b[1] - a[1]);
    cas[cle] = {
      strategie: l[0].strategie, membres: l[0].membres, parties: l.length,
      q1: quantile(j, 0.25), mediane: quantile(j, 0.5), q3: quantile(j, 0.75), moyenne: arrondi(moyenne(j)),
      survie200: l.filter(x => x.fin === "vivants").length, causes,
      premiereFaim: quantile(l.filter(x => x.premiereFaim !== null).map(x => x.premiereFaim), 0.5), premiereFaimQ1: quantile(l.filter(x => x.premiereFaim !== null).map(x => x.premiereFaim), 0.25), premiereFaimQ3: quantile(l.filter(x => x.premiereFaim !== null).map(x => x.premiereFaim), 0.75),
      evitees: arrondi(moyenne(l.map(x => x.evitees)), 1),
      autonomie: autonomes.length, autonomieQ1: quantile(autonomes.map(x => x.autonomeLe), 0.25), autonomieMediane: quantile(autonomes.map(x => x.autonomeLe), 0.5), autonomieQ3: quantile(autonomes.map(x => x.autonomeLe), 0.75),
      demenagements: arrondi(moyenne(l.map(x => x.demenagements))), fuites: somme(l.map(x => x.fuites)),
      cyclones: arrondi(moyenne(l.map(x => x.cyclones)), 2), eruptions: arrondi(moyenne(l.map(x => x.eruptions)), 2), hordes: arrondi(moyenne(l.map(x => x.hordes)), 2),
      assautsParMoisApres30: vivants30.length ? arrondi((30 * somme(vivants30.map(x => x.assautsApres30))) / Math.max(1, somme(vivants30.map(x => x.joursApres30))), 2) : null,
      serieuxParMoisApres30: vivants30.length ? arrondi((30 * somme(vivants30.map(x => x.serieuxApres30))) / Math.max(1, somme(vivants30.map(x => x.joursApres30))), 2) : null,
      breches: arrondi(moyenne(l.map(x => x.breches)), 2), rencontres: arrondi(moyenne(l.map(x => x.rencontres)), 1),
      joursSansEau: arrondi(moyenne(l.map(x => x.joursSansEau))), joursSansNourriture: arrondi(moyenne(l.map(x => x.joursSansNourriture))),
      limitante: limitante[0][1] > 0 ? limitante[0][0] : "—", blocages, installations: arrondi(moyenne(l.map(x => x.installations))),
      morts: l.reduce((t, x) => { for (const [c, n] of Object.entries(x.morts)) t[c] = (t[c] ?? 0) + n; return t; }, {})
    };
  }
  // Régions de départ (toutes stratégies sauf passif).
  const parRegion = {};
  for (const r of resultats.filter(x => x.strategie !== "passif")) (parRegion[r.region] ??= []).push(r);
  const regions = Object.fromEntries(Object.entries(parRegion).map(([cle, l]) => [cle, { parties: l.length, mediane: quantile(l.map(x => x.jours), 0.5), q1: quantile(l.map(x => x.jours), 0.25), survie200: pct(l.filter(x => x.fin === "vivants").length, l.length), autonomie: pct(l.filter(x => x.autonomeLe !== null).length, l.length) }]));
  // Hauts contre Bas après J90 (abris des enracinés et mixtes).
  const hb = { bas: { jours: 0, assauts: 0, livides: 0, morts: 0 }, hauts: { jours: 0, assauts: 0, livides: 0, morts: 0 } };
  for (const r of resultats.filter(x => x.strategie !== "passif")) for (const z of ["bas", "hauts"]) { hb[z].jours += r[z].jours; hb[z].assauts += r[z].assauts; hb[z].livides += r[z].livides; }
  const hautsBas = Object.fromEntries(Object.entries(hb).map(([z, v]) => [z, { joursAbri: v.jours, assautsParMois: v.jours ? arrondi((30 * v.assauts) / v.jours, 2) : null, lividesParMois: v.jours ? arrondi((30 * v.livides) / v.jours, 2) : null }]));
  return { cas, regions, hautsBas, jours, parties: resultats.length };
}

// ------------------------------------------------------------------ tableaux
const nomCause = { faim: "faim", soif: "soif", assaut: "brèche/assaut", rencontre: "rencontre", infection: "infection", maladie: "maladie", depart: "départ de tous", impasse: "impasse", vivants: "vivants à la fin" };
export function tableaux(m) {
  const l = [];
  const cas = Object.values(m.cas).sort((a, b) => STRATEGIES.indexOf(a.strategie) - STRATEGIES.indexOf(b.strategie) || a.membres - b.membres);
  l.push(`### Jours de survie (${m.jours} jours au plus, ${m.parties} parties)`, "",
    "| Cas | Parties | Q1 | Médiane | Q3 | Vivants à J" + m.jours + " | Première faim (médiane, Q1–Q3) | Autonomes (jour médian, Q1–Q3) | Déménagements | Installations |", "|---|---|---|---|---|---|---|---|---|---|");
  for (const c of cas) l.push(`| ${c.strategie} × ${c.membres} | ${c.parties} | ${c.q1} | ${c.mediane} | ${c.q3} | ${pct(c.survie200, c.parties)} | J${c.premiereFaim} (J${c.premiereFaimQ1}–J${c.premiereFaimQ3}) | ${pct(c.autonomie, c.parties)}${c.autonomie ? ` (J${c.autonomieMediane}, J${c.autonomieQ1}–J${c.autonomieQ3})` : ""} | ${c.demenagements} | ${c.installations} |`);
  l.push("", "### Causes de fin", "", "| Cas | " + CAUSES.map(c => nomCause[c]).join(" | ") + " |", "|---|" + CAUSES.map(() => "---").join("|") + "|");
  for (const c of cas) l.push(`| ${c.strategie} × ${c.membres} | ${CAUSES.map(x => pct(c.causes[x] ?? 0, c.parties)).join(" | ")} |`);
  l.push("", "### Menaces vécues et ressources", "", "| Cas | Cyclones / partie | Éruptions / partie | Hordes à l'abri / partie | Assauts par mois après J30 (sérieux : force ≥ 3) | Brèches / partie | Rencontres / partie (évitées) | Jours sans eau | Jours sans nourriture | Ressource limitante | Blocages de chantier |", "|---|---|---|---|---|---|---|---|---|---|---|");
  for (const c of cas) l.push(`| ${c.strategie} × ${c.membres} | ${c.cyclones} | ${c.eruptions} | ${c.hordes} | ${c.assautsParMoisApres30 ?? "—"}${c.assautsParMoisApres30 !== null ? ` (${c.serieuxParMoisApres30})` : ""} | ${c.breches} | ${c.rencontres} (${c.evitees}) | ${c.joursSansEau} | ${c.joursSansNourriture} | ${c.limitante} | ${Object.entries(c.blocages).sort((a, b) => b[1] - a[1]).map(([r, n]) => `${r} ${n}`).join(", ") || "—"} |`);
  l.push("", "### Régions de départ (toutes stratégies sauf passif)", "", "| Région | Parties | Q1 | Médiane | Vivants à la fin | Autonomes |", "|---|---|---|---|---|---|");
  for (const [cle, r] of Object.entries(m.regions).sort((a, b) => b[1].mediane - a[1].mediane)) l.push(`| ${cle} | ${r.parties} | ${r.q1} | ${r.mediane} | ${r.survie200} | ${r.autonomie} |`);
  l.push("", "### Hauts contre Bas après J90 (abris des parties encore en vie)", "", "| Zone | Jours d'abri après J90 | Assauts par mois | Livides errants par mois |", "|---|---|---|---|");
  for (const [z, v] of Object.entries(m.hautsBas)) l.push(`| ${z} | ${v.joursAbri} | ${v.assautsParMois ?? "—"} | ${v.lividesParMois ?? "—"} |`);
  return l.join("\n");
}

// ------------------------------------------------------------------ exécution (fils)
function lireOptions(argv) {
  const o = { parties: 200, graine: "1", jours: JOURS_DEFAUT, cas: null, fils: Math.max(1, cpus().length - 1), json: null, journal: false, rapide: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--parties") o.parties = Number(argv[++i]);
    else if (a === "--graine") o.graine = String(argv[++i]);
    else if (a === "--jours") o.jours = Number(argv[++i]);
    else if (a === "--cas") o.cas = argv[++i];
    else if (a === "--fils") o.fils = Number(argv[++i]);
    else if (a === "--json") o.json = argv[++i];
    else if (a === "--journal") o.journal = true;
    else if (a === "--rapide") { o.rapide = true; o.parties = PARTIES_RAPIDE; }
  }
  return o;
}

// Simule tous les cas demandés (en fils d'exécution si fils > 1). -> Promise<[stats]>
export async function simuler({ parties = 200, graine = "1", jours = JOURS_DEFAUT, cas = null, fils = 1 } = {}) {
  const liste = casDe(cas);
  if (fils <= 1) {
    const contenu = chargerContenu();
    return liste.flatMap(c => jouerCas(contenu, c, { parties, graine, jours }));
  }
  const lots = Array.from({ length: Math.min(fils, liste.length) }, () => []);
  liste.forEach((c, i) => lots[i % lots.length].push(c));
  const resultats = await Promise.all(lots.map(lot => new Promise((resoudre, rejeter) => {
    const w = new Worker(fileURLToPath(import.meta.url), { workerData: { lot, parties, graine, jours } });
    w.on("message", resoudre); w.on("error", rejeter);
    w.on("exit", code => { if (code !== 0) rejeter(new Error(`fil terminé avec le code ${code}`)); });
  })));
  return resultats.flat();
}

if (!isMainThread && workerData?.lot) {
  const contenu = chargerContenu();
  parentPort.postMessage(workerData.lot.flatMap(c => jouerCas(contenu, c, workerData)));
} else if (isMainThread && process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const o = lireOptions(process.argv.slice(2));
  const debut = Date.now();
  if (o.journal) {
    const contenu = chargerContenu();
    const c = casDe(o.cas)[0] ?? { strategie: "enracine", membres: 4 };
    const r = jouerPartie(contenu, { ...c, region: L.regionsDe(contenu)[0].cle, graine: o.graine, jours: o.jours, journal: true });
    console.log(r.journal.join("\n"));
    console.log(JSON.stringify({ ...r, journal: undefined }, null, 1));
  } else {
    const resultats = await simuler(o);
    const m = mesurer(resultats, { jours: o.jours });
    console.log(tableaux(m));
    console.log(`\n(${resultats.length} parties, graine ${o.graine}, ${Math.round((Date.now() - debut) / 1000)} s)`);
    if (o.json) writeFileSync(o.json, JSON.stringify({ options: o, mesures: m, resultats: resultats.map(r => ({ ...r, journal: undefined })) }, null, 1));
  }
}
