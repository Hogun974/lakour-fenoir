// Le paradis et son piège, et « rallumer l'île » (lot 9 du portage de Fénoir 3D, 2026-11-17 ; complément du jeu 3D, famille 5
// « Le paradis et son piège », décidée par Jordan, et « 4 quinquies » : rallumer l'île, décidé le 16 novembre ; le reste validé le
// 17 : « tout maintenant »). Logique pure, sans Foundry. Chiffres et raisons : docs/equilibre-paradis.md ; contrat §28.
//
// Le paradis, c'est l'autonomie (§1.6, l'autonomie complète du §13.4) ; son prix, c'est qu'il faut le garder :
// - LA CHALEUR D'UN LIEU (secret : monde.paradis.lieux[site]) : à quel point le lieu attire les Livides, parce qu'on y reste
//   longtemps et nombreux. Elle monte chaque jour où l'on y vit (× la taille du groupe), redescend par les jours de silence, les
//   camps leurres, les rondes, et refroidit quand plus personne n'y vit (la transhumance : on revient trouver un lieu oublié).
//   Elle s'ajoute aux menaces de HORDES et de Livides errants (jamais à la visibilité, qui reste celle des bandes) et tire les hordes
//   de passage vers la région de l'abri.
// - LE FLUX : chaque jour, des Livides arrivent autour de l'abri, selon la chaleur et l'infestation de la région. LA RONDE (une
//   tâche du jour, vigilance pour les voir, combat pour les abattre) les abat : la chaleur baisse d'autant. Sans ronde, au-dessus du
//   seuil où « ils viennent », ils restent : les AGGLUTINÉS, qui pèsent sur les menaces et attirent les suivants. Une ronde confiée à
//   un PNJ rate selon ses compétences : ce sont ses dés.
// - LES CORPS que laissent les rondes (public : abri.corps, par lots datés) sentent pour les bêtes (chiens errants : l'odeur des
//   morts du lot « sens » ; les Livides, eux, ignorent l'odeur d'un corps) et salissent l'abri (souillure du lot « corps ») tant qu'ils
//   sont frais. On les ENTERRE (lent, sans bruit) ou on les BRÛLE (vite, mais la fumée se voit : visibilité + 2 ce jour-là).
// - SOUS TERRE (galerie, tunnel de lave) : les jours sans soleil de qui ne remonte jamais baissent le plafond du moral ; l'air
//   s'alourdit quand on y est nombreux (la bougie baisse : la nuit repose moins). Un puits d'air, un puits de jour y remédient, au
//   prix de la discrétion (ils laissent sortir la lueur, le bruit, l'odeur).
// - LA HAIE qui cache l'abri : la sœur lontan du camouflage ; elle pousse (effets.pousse : jours) ; au cyclone, le bambou plie et
//   repousse, le filao casse.
// - RALLUMER L'ÎLE (public : etat.ile) : le but d'une longue partie. Une région est REPRISE quand une communauté y tient un abri
//   depuis un mois, en a nettoyé les lieux gardés (ses sites, du lot « sens » : nettoyer) depuis moins de trois mois, n'y laisse plus
//   une infestation dense, et y a ramené la lumière (du courant à l'abri, ou un grand chantier : une centrale relancée, un phare).
//   Elle s'allume la nuit, sur la carte : l'infestation y décroît, les hordes n'y naissent plus et s'y défont, les errants y rôdent
//   moitié moins. Contrepoint : LA LUMIÈRE SE VOIT, ET LES BANDES VIENNENT (convois attirés, visibilité de l'abri pour les bandes).
//   Abandonnée (plus d'abri, plus de lumière), elle s'éteint en dix jours.
// - DES JALONS plutôt qu'un écran de victoire (etat.jalons) : premier abri, première saison des pluies passée, premier cyclone,
//   première fête tenue, première région rallumée, la moitié de l'île, toute l'île. Sans récompense de jeu.
// Ce qui tient aux cycles du serveur du jeu 3D (remise à zéro, abris qui se désagrègent hors connexion) ne sert pas ici.
import { ALTITUDE_BAS, QUARTS_PAR_JOUR, borner } from "./constantes.mjs";
import { deriverHasard, chance, entier, arrondiHasard } from "./hasard.mjs";
import { resoudreTest, lancer } from "./des.mjs";
import { regionDe, regionsDe, indexer, liste, installationDe, niveauDe, sontVoisines, factionDe } from "./contenu.mjs";
import { saisonDuJour } from "./temps.mjs";
import { message } from "./textes.mjs";
import { parer, paradeDe } from "./corps.mjs";
import { facteurNettoyage } from "./sens.mjs";

export const REGLES_PARADIS = {
  chaleur: {
    max: 10,
    parJour: 0.05,              // un groupe de 4 qui vit là, chaque jour
    taille: { exposant: 1.5, max: 2 },// facteur = (personnes / 4)^1,5, au plus 2 : seul, un huitième ; à deux, un tiers ; à huit, 2
    hautsSeche: 1.25,           // les Hauts en saison sèche : le froid rassemble les Livides en troupes
    bruitFort: 0.05,            // un jour où l'abri a fait du bruit fort (4 et plus : coups de feu, groupe électrogène)
    silence: 0.2,               // un jour de silence : elle redescend au lieu de monter
    refroidit: 0.08,            // par jour où personne n'y vit (lieu quitté, groupe parti loin)
    parAbattu: 0.4,             // chaque Livide abattu en ronde
    parRonde: 0.03,             // une ronde (pas la tournée du petit jour), même sans Livide : les traces effacées
    manquee: 0,                 // une ronde manquée au-dessus du seuil : elle ne monte pas plus (ce sont les agglutinés qui pèsent)
    seuilRonde: 2,              // au-dessus, « ils viennent » : sans ronde, ceux qui arrivent restent
    leurre: 2,                  // un camp leurre
    leurreRepos: 7,             // jours avant qu'un autre leurre ne trompe autant (avant : la moitié)
    // Ce que la chaleur ajoute aux menaces (par point) et à l'attrait d'une région pour les hordes de passage.
    menace: { horde: 0.01, livides: 0 },
    hordeAttrait: 0.2
  },
  flux: { seuil: 1, parChaleur: 0.25, infestation: 2, plancher: 0.15, max: 6 },
  // Sans ronde, la moitié de ceux qui arrivent restent ; chaque jour, 15 % des agglutinés repartent d'eux-mêmes ; au plus 8.
  agglutines: { max: 8, reste: 0.4, depart: 0.2, chaleur: 0.005, menace: 0.01, force: 5 },
  ronde: { parEchange: 3, surprise: 1, rate: -1, trouvaille: 10, tournee: 1, frappent: 1 },
  corps: { frais: { bas: 15, hauts: 40 }, hautsCompte: 0.5, souillure: 0.05, beaucoup: 8, enterrer: 3, bruler: 10, boisParBrule: 5, fumee: 2 },
  sousTerre: { paliers: [7, 21], malus: [1, 2], air: { lourd: 0.75 } },
  rallumer: {
    tenu: 30,                   // jours d'abri tenu
    nettoyage: { valable: 90, tues: 1 },
    infestationMax: 2,          // au-dessus (dense), la région ne s'allume pas
    energie: 1,                 // ce que l'abri doit produire (kWh par jour) pour « ramener la lumière »
    eteinte: 10,                // jours sans abri ni lumière avant que la région s'éteigne
    effets: { infestation: 0.03, plafond: 1.5, dispersion: 0.08, livides: 0.5, rencontres: 0.5 },
    lumiere: { visibilite: 3, attire: 0.02, parRegion: 0.25, force: 0.5, depart: 0.3, pression: 4 },
    chantier: { aideParJour: 2 },
    moitie: 8
  }
};
const R = REGLES_PARADIS;
const n0 = v => (Number.isFinite(Number(v)) ? Number(v) : 0);
const arrondi = (x, n = 3) => Math.round(n0(x) * 10 ** n) / 10 ** n;

// ------------------------------------------------------------------ la tâche « ronde »
// La ronde est une tâche du jour (generation.mjs, TACHES : vigilance). Elle est « sur demande » : la répartition automatique et la
// grille par défaut ne la donnent jamais d'elles-mêmes (on la confie), mais un membre qui l'a la fait chaque jour.
export const TACHE_RONDE = "ronde";
export const TACHES_SUR_DEMANDE = [TACHE_RONDE];
// Les tâches qui font sortir au jour (sous terre, le soleil) : celles qui se font dehors.
export const TACHES_DEHORS = ["fouille", "chasse", "peche", "eau", "cultures", "elevage", "garde", "ronde", "chantier"];

// ------------------------------------------------------------------ la chaleur d'un lieu (SECRET)
// monde.paradis = { lieux: { site: { chaleur, le, agglutines, leurreLe } } }.
export const paradisDuMonde = monde => {
  const p = monde?.paradis;
  return { lieux: p?.lieux && typeof p.lieux === "object" ? p.lieux : {} };
};
export function lieuDe(monde, site) {
  const l = paradisDuMonde(monde).lieux[site];
  return { chaleur: n0(l?.chaleur), le: Number.isFinite(Number(l?.le)) && l?.le !== null ? Number(l.le) : null, agglutines: Math.max(0, Math.floor(n0(l?.agglutines))),
    leurreLe: Number.isFinite(Number(l?.leurreLe)) && l?.leurreLe !== null ? Number(l.leurreLe) : null };
}
// Le monde avec ce lieu récrit (copie).
export function avecLieu(monde, site, lieu) {
  const p = paradisDuMonde(monde);
  return { ...monde, paradis: { ...(monde?.paradis ?? {}), lieux: { ...p.lieux, [site]: { chaleur: arrondi(borner(n0(lieu.chaleur), 0, R.chaleur.max)), le: lieu.le ?? null,
    agglutines: borner(Math.floor(n0(lieu.agglutines)), 0, R.agglutines.max), leurreLe: lieu.leurreLe ?? null } } } };
}
// Le lieu tel qu'il est ce jour, refroidi des jours où personne n'y a vécu depuis sa dernière mise à jour (la transhumance).
export function lieuRefroidi(lieu, jour) {
  if (lieu.le === null || lieu.le === undefined) return { ...lieu, le: n0(jour) };
  const absent = Math.max(0, n0(jour) - n0(lieu.le) - 1);
  if (!absent) return lieu;
  // Partis, ceux qui s'agglutinaient se dispersent aussi (un jour sur trois, un s'en va).
  return { ...lieu, chaleur: Math.max(0, lieu.chaleur - R.chaleur.refroidit * absent), agglutines: Math.max(0, lieu.agglutines - Math.ceil(absent / 3)) };
}
// Le facteur de la taille du groupe (personnes présentes, PNJ compris).
export const facteurTaille = personnes => Math.min(R.chaleur.taille.max, Math.pow(Math.max(0, n0(personnes)) / 4, R.chaleur.taille.exposant));
// Le facteur de la saison selon la zone de l'abri.
export const facteurSaison = (region, saison) => (n0(region?.altitude) >= ALTITUDE_BAS && saison === "seche" ? R.chaleur.hautsSeche : 1);

// Un jour de silence : personne ne fait rien qui s'entende (aucune tâche bruyante parmi les présents, pas de fouille, aucun bruit de
// l'abri au-dessus de 1, pas de groupe électrogène) ; le MJ peut aussi le décider (avancer({ silence: true })).
export const TACHES_BRUYANTES = ["chantier", "atelier", "chasse", "fouille"];
export function jourDeSilence({ taches = [], bruitMax = 0, bruitInstallations = 0, fouille = false, decide = null } = {}) {
  if (decide === true) return true;
  if (decide === false) return false;
  return !fouille && n0(bruitMax) <= 1 && n0(bruitInstallations) <= 0 && !taches.some(t => TACHES_BRUYANTES.includes(t));
}

// Les Livides qui arrivent autour de l'abri ce jour (le flux) : (chaleur − 1) × 0,25, × la part de la région qui en a encore
// (infestation ÷ 2, au moins 0,15 : il reste toujours des errants). Un lieu encore oublié (chaleur sous 1) n'en attire aucun. -> entier
export function arrivants({ chaleur = 0, infestation = 0, hasard = Math.random } = {}) {
  const part = borner(n0(infestation) / R.flux.infestation, R.flux.plancher, 1);
  return Math.min(R.flux.max, arrondiHasard(Math.max(0, n0(chaleur) - R.flux.seuil) * R.flux.parChaleur * part, hasard));
}

// La ronde du jour. rondiers : [{ id, nom, system, parade? }] (ceux qui la font : tâche « ronde », valides, à l'abri) ; livides : ceux
// qui sont là (agglutinés et arrivants du jour). Un rondier cherche (vigilance, normale : le meilleur des rondiers) ; trouvés à
// temps, on les prend un par un (+1 dé), et ceux qu'on n'abat pas, on les laisse (on recule : ils ne frappent pas) ; sinon ils
// surprennent (−1 dé), un indice échappe, et chaque Livide resté debout frappe (1 d6 : 6 touche ; puis 6 au dé de morsure). Chaque
// rondier, à son tour, fait un échange de combat (au plus trois Livides à la fois). Une touche parée par un bouclier ne blesse ni ne
// mord.
// tournee : la tournée du petit jour de celui qui a veillé (la garde de nuit, quand personne n'a la ronde) : −1 dé à tout, aucun
// indice relevé.
// -> { faite, tournee, livides, abattus, restants, cherche: test, blessures: [{ id, n, morsure }], trouvaille: 1..10 | 0, echanges }
export function rondeDuJour({ rondiers = [], livides = 0, tournee = false, hasard = Math.random } = {}) {
  const valides = rondiers.filter(r => r?.system && r.system.vivant !== false && !r.system.livide && n0(r.system.blessures) < 3);
  if (!valides.length) return { faite: false, tournee: Boolean(tournee), livides: n0(livides), abattus: 0, restants: n0(livides), cherche: null, blessures: [], trouvaille: 0, echanges: 0 };
  const niveau = (s, c) => n0(s?.competences?.[c]?.niveau);
  const fourbu = tournee ? R.ronde.tournee : 0;
  const malusDe = s => (n0(s.blessures) >= 3 ? 2 : n0(s.blessures) >= 2 ? 1 : 0) + (n0(s.fatigue) >= 5 ? 2 : n0(s.fatigue) >= 3 ? 1 : 0) + fourbu;
  const guetteur = [...valides].sort((a, b) => niveau(b.system, "vigilance") - niveau(a.system, "vigilance"))[0];
  const cherche = resoudreTest({ niveau: niveau(guetteur.system, "vigilance"), difficulte: "normale", malus: malusDe(guetteur.system), hasard, compte: false });
  const mod = cherche.reussite ? R.ronde.surprise : R.ronde.rate;
  let restants = Math.max(0, Math.floor(n0(livides)));
  // La tournée de celui qui a veillé : s'il ne les voit pas, il ne va pas les chercher (il reste derrière la clôture).
  if (tournee && !cherche.reussite) {
    return { faite: true, engagee: false, tournee: true, livides: restants, abattus: 0, restants, cherche, blessures: [], trouvaille: 0, echanges: 0, guetteur: guetteur.id };
  }
  const blessures = new Map();
  let echanges = 0;
  for (const r of valides) {
    if (restants <= 0) break;
    const s = r.system;
    const face = Math.min(restants, R.ronde.parEchange);
    const test = resoudreTest({ niveau: Math.max(niveau(s, "combat"), 0), difficulte: "normale", bonus: Math.max(0, mod), malus: malusDe(s) + Math.max(0, -mod), hasard, compte: false });
    echanges++;
    const abat = Math.min(face, test.succes);
    restants -= abat;
    const debout = face - abat;
    // Vus à temps, ceux qu'on n'a pas abattus, on les laisse : on recule, ils ne frappent pas. Surpris, et sans en avoir abattu un
    // seul dans l'échange, le plus proche frappe.
    if (debout <= 0 || cherche.reussite || abat > 0) continue;

    let touches = lancer(Math.min(debout, R.ronde.frappent), hasard).filter(d => d === 6).length;
    if (touches && r.parade) touches = parer(touches, r.parade, hasard).passent;
    if (!touches) continue;
    const morsures = lancer(touches, hasard).filter(d => d === 6).length;
    const b = blessures.get(r.id) ?? { id: r.id, nom: r.nom ?? "", n: 0, morsure: false };
    b.n += touches; b.morsure = b.morsure || morsures > 0;
    blessures.set(r.id, b);
  }
  const abattus = Math.max(0, Math.floor(n0(livides))) - restants;
  const trouvaille = cherche.reussite && !tournee ? entier(1, R.ronde.trouvaille, hasard) : 0;
  return { faite: true, engagee: true, tournee: Boolean(tournee), livides: Math.floor(n0(livides)), abattus, restants, cherche, blessures: [...blessures.values()], trouvaille, echanges, guetteur: guetteur.id };
}

// La journée du lieu (avancer, chaque jour, pour l'abri où vit le groupe). lieu : lieuDe(…) ; personnes : présents (PNJ compris) ;
// ronde : le résultat de rondeDuJour (ou null : pas de ronde) ; arrives : arrivants du jour.
// -> { lieu, monte, silence, agglutines (nouveaux), manquee: Boolean }
export function journeeDuLieu(lieu, { jour = 0, personnes = 0, region = null, saison = "pluies", silence = false, bruitFort = false, ronde = null, arrives = 0 } = {}) {
  const C = R.chaleur;
  const l = { ...lieuRefroidi(lieu, jour), le: n0(jour) };
  let monte = 0;
  if (n0(personnes) <= 0) monte = -C.refroidit;
  else if (silence) monte = -C.silence;
  else monte = C.parJour * facteurTaille(personnes) * facteurSaison(region, saison) + (bruitFort ? C.bruitFort : 0);
  let chaleur = l.chaleur + monte;
  // Chaque jour, quelques agglutinés repartent d'eux-mêmes (15 %, arrondi en dessous).
  let agglutines = l.agglutines - Math.floor(l.agglutines * R.agglutines.depart);
  let manquee = false, nouveaux = 0;
  if (ronde?.faite && ronde.engagee !== false) {
    // Une ronde (pas la tournée du petit jour) efface aussi des traces : la chaleur baisse un peu, même sans Livide.
    chaleur -= C.parAbattu * n0(ronde.abattus) + (ronde.tournee ? 0 : C.parRonde);
    // Ceux que la ronde n'a pas abattus restent là (ils étaient comptés avec les agglutinés).
    agglutines = Math.min(R.agglutines.max, Math.max(0, n0(ronde.restants)));
  } else if (n0(personnes) > 0 && l.chaleur >= C.seuilRonde) {
    manquee = true;
    chaleur += C.manquee;
    // La moitié de ceux qui sont arrivés restent (arrondi au plus proche : un sur deux un jour, l'autre le lendemain).
    nouveaux = Math.min(R.agglutines.max - agglutines, Math.max(0, Math.round(n0(arrives) * R.agglutines.reste)));
    agglutines += nouveaux;
  }
  // Les agglutinés attirent les suivants.
  chaleur += R.agglutines.chaleur * agglutines;
  return { lieu: { ...l, chaleur: arrondi(borner(chaleur, 0, C.max)), agglutines: borner(agglutines, 0, R.agglutines.max) }, monte: arrondi(monte), silence: Boolean(silence), agglutines: nouveaux, manquee };
}

// Un camp leurre : un feu, du bruit, loin de l'abri. -> { lieu, effet }
export function campLeurre(lieu, { jour = 0, reussi = true } = {}) {
  const recent = lieu.leurreLe !== null && lieu.leurreLe !== undefined && n0(jour) - n0(lieu.leurreLe) < R.chaleur.leurreRepos;
  const effet = R.chaleur.leurre * (recent ? 0.5 : 1) * (reussi ? 1 : 0.5);
  const partent = Math.ceil(n0(lieu.agglutines) * (reussi ? 0.75 : 0.4));
  return { lieu: { ...lieu, chaleur: arrondi(Math.max(0, n0(lieu.chaleur) - effet)), agglutines: Math.max(0, n0(lieu.agglutines) - partent), leurreLe: n0(jour) }, effet: arrondi(effet), partent, recent };
}

// La chaleur en mots, ce que le groupe en perçoit (jamais le chiffre) : 0 « personne ne sait que vous êtes là », 1 « des traces »,
// 2 « on vous a remarqués », 3 « ils viennent », 4 « assiégés ».
export const MOTS_CHALEUR = ["oublie", "traces", "remarques", "viennent", "assieges"];
export function motChaleur(chaleur = 0, agglutines = 0) {
  const c = n0(chaleur);
  if (n0(agglutines) >= 6 || c >= 7) return "assieges";
  if (c >= R.chaleur.seuilRonde || n0(agglutines) > 0) return c >= 4.5 ? "viennent" : "remarques";
  return c >= 0.75 ? "traces" : "oublie";
}

// Ce que la chaleur et les agglutinés ajoutent aux menaces du jour (monde.mjs, tirerMenaces). -> { horde, livides, forceLivides }
export function menacesDeChaleur({ chaleur = 0, agglutines = 0 } = {}) {
  const c = chaleurQuiAttire(chaleur), a = Math.max(0, Math.floor(n0(agglutines)));
  return { horde: R.chaleur.menace.horde * c, livides: R.chaleur.menace.livides * c + R.agglutines.menace * a, forceLivides: Math.floor(a / R.agglutines.force) };
}
// La part de la chaleur qui attire les hordes : ce qui passe le seuil où « ils viennent » (un lieu seulement remarqué n'en attire pas).
export const chaleurQuiAttire = chaleur => Math.max(0, borner(n0(chaleur), 0, R.chaleur.max) - R.chaleur.seuilRonde);


// ------------------------------------------------------------------ les corps (PUBLIC : abri.corps = [{ jour, n }])
export const corpsDe = abri => (Array.isArray(abri?.corps) ? abri.corps.filter(x => x && n0(x.n) > 0).map(x => ({ jour: n0(x.jour), n: Math.floor(n0(x.n)) })) : []);
export const totalCorps = corps => (corps ?? []).reduce((s, x) => s + n0(x.n), 0);
export function ajouterCorps(corps = [], { jour = 0, n = 0 } = {}) {
  if (!(n0(n) > 0)) return [...corps];
  const meme = corps.find(x => x.jour === n0(jour));
  return meme ? corps.map(x => (x === meme ? { ...x, n: x.n + Math.floor(n0(n)) } : x)) : [...corps, { jour: n0(jour), n: Math.floor(n0(n)) }];
}
// Les corps encore frais (ils sentent pour les bêtes, ils salissent) : 15 jours dans les Bas, 40 dans les Hauts (comptés moitié : le
// froid les garde, ils sentent peu). -> nombre (réel)
export function corpsFrais(corps = [], { jour = 0, altitude = 0 } = {}) {
  const hauts = n0(altitude) >= ALTITUDE_BAS;
  const duree = hauts ? R.corps.frais.hauts : R.corps.frais.bas;
  return (corps ?? []).filter(x => n0(jour) - n0(x.jour) <= duree).reduce((s, x) => s + n0(x.n), 0) * (hauts ? R.corps.hautsCompte : 1);
}
// Les corps qu'on oublie (secs depuis longtemps, ils ne comptent plus) : on les retire de la liste après 90 jours.
export const corpsOublies = (corps = [], jour = 0) => (corps ?? []).filter(x => n0(jour) - n0(x.jour) <= 90);
// Traiter les corps : enterrer (3 par quart et par bras, sans bruit) ou brûler (10, du bois : 1 pour 5 corps ; la fumée se voit).
// Les plus frais d'abord. -> { corps, traites, bois, fumee: Boolean }
export function traiterCorps(corps = [], { action = "enterrer", quarts = 1, bras = 1, bois = Infinity } = {}) {
  const bruler = action === "bruler";
  let capacite = Math.floor(n0(quarts) * Math.max(0, n0(bras)) * (bruler ? R.corps.bruler : R.corps.enterrer));
  if (bruler) capacite = Math.min(capacite, Math.floor(n0(bois)) * R.corps.boisParBrule);
  let reste = Math.max(0, capacite);
  const tries = [...(corps ?? [])].sort((a, b) => b.jour - a.jour);
  const apres = [];
  let traites = 0;
  for (const x of tries) {
    const pris = Math.min(reste, x.n);
    reste -= pris; traites += pris;
    if (x.n - pris > 0) apres.push({ ...x, n: x.n - pris });
  }
  return { corps: apres.sort((a, b) => a.jour - b.jour), traites, bois: bruler ? Math.ceil(traites / R.corps.boisParBrule) : 0, fumee: bruler && traites > 0 };
}
// La fumée d'un bûcher ce jour-là (abri.fumeeLe = jour) : ce qu'elle ajoute à la visibilité.
export const fumeeDuJour = (abri, jour) => (abri?.fumeeLe !== null && abri?.fumeeLe !== undefined && n0(abri.fumeeLe) === n0(jour) ? R.corps.fumee : 0);

// ------------------------------------------------------------------ sous terre
// Le groupe vit-il sous terre ? abri.sousTerre (le MJ l'a dit : true ou false), sinon : un site souterrain (galerie, tunnel de lave),
// un tunnel de lave aménagé, ou une galerie au refuge complet (niveau 4).
export const SITES_SOUS_TERRE = ["tunnel-de-lave", "galerie"];
export function vitSousTerre(abri = {}, site = {}, installations = []) {
  if (abri?.sousTerre === true || abri?.sousTerre === false) return abri.sousTerre;
  if (SITES_SOUS_TERRE.includes(site?.type)) return true;
  return (installations ?? []).some(i => (i.cle === "tunnel-de-lave-amenage" && n0(i.niveau) >= 1) || (i.cle === "galerie-souterraine" && n0(i.niveau) >= 4));
}
// Les puits de l'abri (installations en marche, effets.air, effets.jour) : { air, jour }.
export function puitsDe(bilan = {}) {
  return { air: n0(bilan.puitsAir) > 0, jour: n0(bilan.puitsJour) > 0 };
}
// survivant.sousTerre = { jours, depuis } : les jours d'affilée sans voir le soleil.
export const sousTerreDe = system => ({ jours: Math.max(0, Math.floor(n0(system?.sousTerre?.jours))) });
// Le jour d'un survivant : il vit sous terre et n'est pas sorti (sa tâche ne le fait pas sortir, et le groupe est à l'abri), sans
// puits de jour : un jour de plus ; sinon le compte repart à zéro. -> system
export function journeeSousTerre(system = {}, { sousTerre = false, dehors = false, puitsJour = false } = {}) {
  const avant = sousTerreDe(system).jours;
  const jours = sousTerre && !dehors && !puitsJour ? avant + 1 : 0;
  if (jours === avant && (system?.sousTerre !== undefined || !jours)) return system;
  return { ...system, sousTerre: { jours } };
}
// Le palier (0, 1, 2) et ce qu'il retire au plafond du moral.
export const palierSousTerre = jours => R.sousTerre.paliers.filter(p => n0(jours) >= p).length;
export const malusSousTerre = system => { const p = palierSousTerre(sousTerreDe(system).jours); return p ? R.sousTerre.malus[p - 1] : 0; };
// L'air sous terre : « bon », « lourd » (plus des trois quarts de la place prise), « vicie » (plus de monde que de place). Un puits
// d'air le rend d'un cran meilleur. Lourd : la nuit repose moins (+1 fatigue au matin) ; vicié : la bougie baisse (+1 encore).
export const ETATS_AIR = ["bon", "lourd", "vicie"];
export function airSousTerre({ sousTerre = false, personnes = 0, capacite = 0, puitsAir = false } = {}) {
  if (!sousTerre || n0(personnes) <= 0) return "bon";
  const cap = Math.max(1, n0(capacite));
  let cran = n0(personnes) > cap ? 2 : n0(personnes) > cap * R.sousTerre.air.lourd ? 1 : 0;
  if (puitsAir) cran = Math.max(0, cran - 1);
  return ETATS_AIR[cran];
}
export const fatigueDeLAir = air => (air === "vicie" ? 2 : air === "lourd" ? 1 : 0);

// ------------------------------------------------------------------ la haie (bilanAbri, passage du cyclone)
// Une installation qui pousse (effets.pousse : jours) ne cache qu'une part de ce qu'elle cachera : (jours depuis qu'elle est plantée)
// ÷ pousse, au plus 1. termineLe : le jour où le niveau courant a été achevé.
export const facteurPousse = (effets, termineLe = 0, jour = 0) => (n0(effets?.pousse) > 0 ? borner((n0(jour) - n0(termineLe)) / n0(effets.pousse), 0, 1) : 1);
// Après un cyclone (etat.mjs, après passageCyclone) : le bambou plie et repousse (il retrouve l'état d'avant) ; le filao casse (un
// point d'état de plus s'il n'en a pas déjà pris un). avant, apres : instances. -> { installations, pliees: [cle], cassees: [cle] }
export function haiesAuCyclone(avant = [], apres = [], contenu = {}) {
  const pliees = [], cassees = [];
  const installations = apres.map(i => {
    const def = installationDe(contenu, i.cle);
    const e = niveauDe(def, n0(i.niveau))?.effets ?? {};
    const a = avant.find(x => (x.id && x.id === i.id) || x.cle === i.cle);
    if (e.plie && a && n0(i.etat) > n0(a.etat)) { pliees.push(i.cle); return { ...i, etat: n0(a.etat) }; }
    if (e.casse && n0(i.niveau) >= 1 && a && n0(i.etat) <= n0(a.etat)) { cassees.push(i.cle); return { ...i, etat: Math.min(3, n0(i.etat) + 1) }; }
    return i;
  });
  return { installations, pliees, cassees };
}

// ------------------------------------------------------------------ le prix du paradis
// Ce que coûte de garder le paradis ce jour (lecture, fenêtres et MJ IA) : rondes, corps, chaleur, sous terre.
export function prixDuParadis({ autonome = false, complete = false, rondiers = 0, chaleur = 0, agglutines = 0, corps = 0, sousTerre = 0, membres = 0 } = {}) {
  return { autonome: Boolean(autonome), complete: Boolean(complete), rondiers: n0(rondiers), part: membres ? arrondi(n0(rondiers) / n0(membres), 2) : 0,
    mot: motChaleur(chaleur, agglutines), corps: n0(corps), sousTerre: n0(sousTerre), paradis: Boolean(autonome && complete) };
}

// ------------------------------------------------------------------ rallumer l'île (PUBLIC : etat.ile)
// etat.ile = { regions: { cle: { etat: "rallumee" | "eteinte", depuis, ombreLe } }, chantiers: { cle: { fait, requis, debut, finiLe, aides } } }
// etat.jalons = [{ cle, jour, params }].
export const ETATS_REGION = ["noire", "rallumee", "eteinte"];
export const ileDe = etat => ({ regions: etat?.ile?.regions && typeof etat.ile.regions === "object" ? etat.ile.regions : {},
  chantiers: etat?.ile?.chantiers && typeof etat.ile.chantiers === "object" ? etat.ile.chantiers : {} });
export const etatRegion = (etat, region) => ileDe(etat).regions[region]?.etat ?? "noire";
export const regionsRallumees = etat => Object.entries(ileDe(etat).regions).filter(([, r]) => r?.etat === "rallumee").map(([k]) => k);
export const estRallumee = (etat, region) => etatRegion(etat, region) === "rallumee";
// Le facteur des rencontres d'une fouille dans une région rallumée (moitié moins).
export const facteurRallumage = (etat, region) => (estRallumee(etat, region) ? R.rallumer.effets.rencontres : 1);

// Les chantiers de région du contenu (registre `chantiersRegion`) et leur état.
export const chantiersDuContenu = contenu => liste(contenu?.chantiersRegion);
export const chantierDe = (contenu, cle) => chantiersDuContenu(contenu).find(c => c.cle === cle) ?? null;
export const chantierFini = (etat, cle) => ileDe(etat).chantiers[cle]?.finiLe !== null && ileDe(etat).chantiers[cle]?.finiLe !== undefined;
// Ce que les chantiers finis donnent à une région : { lumiere, electricite, routes: [voisine] }.
export function bienfaitsDeRegion(etat, contenu, region) {
  const finis = chantiersDuContenu(contenu).filter(c => c.region === region && chantierFini(etat, c.cle));
  return { lumiere: finis.some(c => c.effets?.lumiere), electricite: finis.some(c => c.effets?.electricite),
    routes: [...new Set(finis.flatMap(c => c.effets?.routes ?? []))], peche: finis.reduce((s, c) => s + n0(c.effets?.peche), 0), chantiers: finis.map(c => c.cle) };
}
// Les routes que les chantiers finis tiennent ouvertes (monde.mjs, contexte.routesTenues) : [[région, voisine]].
export const routesTenues = (etat, contenu) => chantiersDuContenu(contenu).filter(c => chantierFini(etat, c.cle)).flatMap(c => (c.effets?.routes ?? []).map(v => [c.region, v]));
// Avancer un chantier : quarts × bras de travail. -> { chantier, fini: Boolean }
export function travaillerChantier(chantier = {}, def = {}, { quarts = 1, bras = 1, jour = 0 } = {}) {
  const requis = n0(chantier.requis) || n0(def.travail) || 1;
  const fait = Math.min(requis, n0(chantier.fait) + Math.max(0, n0(quarts)) * Math.max(0, n0(bras)));
  const fini = fait >= requis;
  return { chantier: { ...chantier, requis, fait: arrondi(fait, 2), debut: chantier.debut ?? n0(jour), finiLe: fini ? (chantier.finiLe ?? n0(jour)) : null, aides: [...(chantier.aides ?? [])] }, fini: fini && !(chantier.finiLe !== null && chantier.finiLe !== undefined) };
}

// Qui tient la région : le groupe (son abri) ou l'une de ses communautés (§14 : groupes séparés). -> { par, depuis } | null
export function tenueDe(etat, region, { abri = null, jour = 0 } = {}) {
  const tenues = [];
  if (abri?.region === region && !abri.abandonneLe) tenues.push({ par: "groupe", depuis: Math.floor(n0(abri.installeLe) / QUARTS_PAR_JOUR) });
  for (const c of etat?.communautes ?? []) if (c?.region === region && c?.abri) tenues.push({ par: c.id ?? c.nom ?? "communaute", depuis: n0(c.depuis), lumiere: Boolean(c.lumiere) });
  if (!tenues.length) return null;
  return tenues.sort((a, b) => a.depuis - b.depuis)[0];
}
// Les lieux gardés d'une région : ses sites, sauf ceux que tient une communauté (l'abri du groupe). Chacun nettoyé depuis moins de
// 90 jours (etat.nettoyes, lot « sens »). -> { lieux: [{ site, nettoye, le }], tous: Boolean }
export function lieuxGardes(etat, contenu, region, { jour = 0, tenus = [] } = {}) {
  const sites = regionDe(contenu, region)?.sites ?? [];
  const nettoyes = Array.isArray(etat?.nettoyes) ? etat.nettoyes : [];
  const lieux = sites.filter(s => !tenus.includes(s)).map(site => {
    const vus = nettoyes.filter(x => x && x.region === region && (x.site || "") === site && n0(x.tues) >= R.rallumer.nettoyage.tues && n0(jour) - n0(x.jour) <= R.rallumer.nettoyage.valable);
    const le = vus.length ? Math.max(...vus.map(x => n0(x.jour))) : null;
    return { site, nettoye: le !== null, le, facteur: facteurNettoyage(nettoyes, { region, site, jour }) };
  });
  return { lieux, tous: lieux.every(l => l.nettoye) };
}
// Les conditions de la reprise d'une région, ce jour. infestation : la réelle (au MJ) ; lumiere : l'abri du groupe en a (bilan) ;
// abri : système de l'abri du groupe (site, region, installeLe). -> { region, tenue, tenu, nettoyes, lieux, infestation, propre,
// lumiere, toutes, manque: [cle] }
export function conditionsReprise(etat, contenu, region, { jour = 0, abri = null, infestation = 0, lumiereAbri = false } = {}) {
  const tenue = tenueDe(etat, region, { abri, jour });
  const tenu = Boolean(tenue) && n0(jour) - n0(tenue.depuis) >= R.rallumer.tenu;
  const tenus = [abri?.region === region ? abri.site : null, ...(etat?.communautes ?? []).filter(c => c?.region === region).map(c => c.site)].filter(Boolean);
  const g = lieuxGardes(etat, contenu, region, { jour, tenus });
  const propre = n0(infestation) <= R.rallumer.infestationMax;
  const bienfaits = bienfaitsDeRegion(etat, contenu, region);
  const lumiere = Boolean(bienfaits.lumiere) || (tenue?.par === "groupe" ? Boolean(lumiereAbri) : Boolean(tenue?.lumiere));
  const manque = [...(tenu ? [] : ["tenu"]), ...(g.tous ? [] : ["nettoyes"]), ...(propre ? [] : ["infestation"]), ...(lumiere ? [] : ["lumiere"])];
  return { region, tenue, tenu, nettoyes: g.tous, lieux: g.lieux, infestation: n0(infestation), propre, lumiere, toutes: !manque.length, manque };
}
// La lumière de l'abri : il produit du courant (une installation, au moins 1 kWh par jour) ou le réseau marche encore.
export const lumiereDeLAbri = bilan => n0(bilan?.production?.energie) >= R.rallumer.energie || Boolean(bilan?.reseauElectrique);

// La journée de l'île (avancer, chaque jour) : pour chaque région où le groupe ou une communauté tient un abri, et pour chaque
// région déjà rallumée ou éteinte. conditions : { region: conditionsReprise } (celles qu'on a calculées). -> { etat, faits: [{ cle,
// params, texte, region, portee }] }
export function journeeDeLIle(etat, contenu, { jour = 0, conditions = {} } = {}) {
  const ile = ileDe(etat);
  const regions = { ...ile.regions };
  const faits = [];
  const nom = r => regionDe(contenu, r)?.nom ?? r;
  for (const [r, c] of Object.entries(conditions)) {
    const avant = regions[r] ?? null;
    if (c.toutes) {
      if (avant?.etat !== "rallumee") {
        regions[r] = { etat: "rallumee", depuis: n0(jour), ombreLe: null, fois: n0(avant?.fois) + 1 };
        faits.push({ region: r, portee: "ile", ...message("region-rallumee", { region: nom(r) }, `${nom(r)} se rallume : la nuit, on voit ses lumières de loin.`) });
      } else if (avant.ombreLe !== null && avant.ombreLe !== undefined) regions[r] = { ...avant, ombreLe: null };
    }
  }
  // Une région rallumée qui n'a plus d'abri tenu ni de lumière s'éteint au bout de dix jours.
  for (const [r, x] of Object.entries(regions)) {
    if (x?.etat !== "rallumee") continue;
    const c = conditions[r];
    const tient = Boolean(c?.tenue) && Boolean(c?.lumiere);
    if (tient) continue;
    const ombre = x.ombreLe ?? n0(jour);
    if (n0(jour) - ombre >= R.rallumer.eteinte) {
      regions[r] = { ...x, etat: "eteinte", eteinteLe: n0(jour), ombreLe: null };
      faits.push({ region: r, portee: "ile", ...message("region-eteinte", { region: nom(r) }, `Les lumières de ${nom(r)} se sont éteintes : le noir y revient.`) });
    } else if (x.ombreLe === null || x.ombreLe === undefined) regions[r] = { ...x, ombreLe: ombre };
  }
  return { etat: { ...etat, ile: { ...ile, regions } }, faits };
}

// L'aide des alliés aux chantiers ouverts (avancer, chaque jour) : chaque aide (faction amie, communauté) apporte 2 quarts-personne.
// -> { etat, finis: [cle] }
export function journeeDesChantiers(etat, contenu, { jour = 0 } = {}) {
  const ile = ileDe(etat);
  const chantiers = { ...ile.chantiers };
  const finis = [];
  for (const [cle, ch] of Object.entries(chantiers)) {
    if (chantierFini(etat, cle) || !(ch?.aides ?? []).length) continue;
    const def = chantierDe(contenu, cle);
    const r = travaillerChantier(ch, def ?? {}, { quarts: 1, bras: R.rallumer.chantier.aideParJour * ch.aides.length, jour });
    chantiers[cle] = r.chantier;
    if (r.fini) finis.push(cle);
  }
  return { etat: { ...etat, ile: { ...ile, chantiers } }, finis };
}

// Les effets d'une région rallumée sur le monde (monde.mjs, simulerJour). -> { infestation, plafond, dispersion, sansHorde }
export const effetsRallumee = () => ({ ...R.rallumer.effets });
// La pression de la lumière : chaque région rallumée a, chaque jour, 2 % (+ 25 % par autre région rallumée) de chances d'attirer un
// convoi : la faction hostile ou méfiante la plus forte d'une région voisine y envoie du monde (+0,5 de force là-bas, −0,3 chez
// elle). Les bandes du groupe qui rallume se font aussi plus fortes : +1 de force par 4 régions rallumées. Pure, déterministe.
export function chanceConvoi(nRallumees = 1) {
  const L2 = R.rallumer.lumiere;
  return n0(nRallumees) > 0 ? L2.attire * (1 + L2.parRegion * Math.max(0, n0(nRallumees) - 1)) : 0;
}
export const forceDeLaLumiere = nRallumees => Math.floor(n0(nRallumees) / R.rallumer.lumiere.pression);
// La faction qu'attire une région rallumée : la plus forte, hostile ou méfiante, des régions voisines. -> { faction, de } | null
export function factionAttiree(monde, contenu, region) {
  let mieux = null;
  for (const v of regionDe(contenu, region)?.voisins ?? []) {
    for (const [f, force] of Object.entries(monde?.regions?.[v.region]?.factions ?? {})) {
      const att = factionDe(contenu, f)?.attitude ?? "mefiante";
      if (!["hostile", "mefiante"].includes(att) || !(force >= 1)) continue;
      if (!mieux || force > mieux.force) mieux = { faction: f, de: v.region, force };
    }
  }
  return mieux;
}

// ------------------------------------------------------------------ les jalons (PUBLIC : etat.jalons)
export const JALONS = ["premier-abri", "premiere-saison-des-pluies", "premier-cyclone", "premiere-fete", "premiere-region", "moitie-de-l-ile", "toute-l-ile"];
export const jalonsDe = etat => (Array.isArray(etat?.jalons) ? etat.jalons : []);
export const aLeJalon = (etat, cle) => jalonsDe(etat).some(j => j.cle === cle);
// Les jalons franchis ce jour. ctx : { jour, abri (un abri tenu), saison, saisonVeille, cyclone (passé sur l'abri ce jour), fetes
// (nombre de fêtes tenues), rallumees (nombre), regions (nombre de régions de l'île) }. -> [{ cle, jour, params }]
export function jalonsDuJour(etat, { jour = 0, abri = false, saison = "", saisonVeille = "", pluiesVecues = false, cyclone = false, fetes = 0, rallumees = 0, regions = 16 } = {}) {
  const nouveaux = [];
  const poser = (cle, params = {}) => { if (!aLeJalon(etat, cle) && !nouveaux.some(j => j.cle === cle)) nouveaux.push({ cle, jour: n0(jour), params }); };
  if (abri) poser("premier-abri");
  if (pluiesVecues && saisonVeille === "pluies" && saison === "seche") poser("premiere-saison-des-pluies");
  if (cyclone) poser("premier-cyclone");
  if (n0(fetes) > 0) poser("premiere-fete");
  if (n0(rallumees) >= 1) poser("premiere-region");
  if (n0(rallumees) >= Math.ceil(n0(regions) / 2)) poser("moitie-de-l-ile", { n: n0(rallumees) });
  if (n0(regions) > 0 && n0(rallumees) >= n0(regions)) poser("toute-l-ile");
  return nouveaux;
}
export const texteJalon = (cle, params = {}) => message(`jalon-${cle}`, params, ({
  "premier-abri": "Premier abri : un endroit où dormir à l'abri, enfin.",
  "premiere-saison-des-pluies": "Première saison des pluies passée : on a tenu jusqu'à l'hiver.",
  "premier-cyclone": "Premier cyclone : il est passé, et l'on est encore là.",
  "premiere-fete": "Première fête tenue : on a ri, une soirée.",
  "premiere-region": "Première région rallumée : de loin, la nuit, on voit nos lumières.",
  "moitie-de-l-ile": "La moitié de l'île rallumée.",
  "toute-l-ile": "Toute l'île rallumée."
})[cle] ?? cle);

// ------------------------------------------------------------------ vérification du contenu
// Les chantiers de région du registre : { cle, nom, region, type: "route" | "centrale" | "port" | "phare", travail, cout, requiert?,
// effets: { lumiere?, electricite?, routes?: [voisine], peche? }, affaires?: [clé d'affaire], description }. -> [erreur]
export const TYPES_CHANTIER = ["route", "centrale", "port", "phare"];
export function erreursChantiers(contenu = {}) {
  const erreurs = [];
  const idx = indexer(contenu);
  const affaires = new Set(liste(contenu?.affaires).map(a => a.cle));
  const vus = new Set();
  for (const c of chantiersDuContenu(contenu)) {
    const ou = `chantier ${c.cle}`;
    if (!c.cle || vus.has(c.cle)) erreurs.push(`${ou} : clé vide ou en double`);
    vus.add(c.cle);
    if (!idx.regions.has(c.region)) erreurs.push(`${ou} : région inconnue ${c.region}`);
    if (!TYPES_CHANTIER.includes(c.type)) erreurs.push(`${ou} : type inconnu ${c.type}`);
    if (!(n0(c.travail) > 0)) erreurs.push(`${ou} : travail manquant`);
    if (!c.nom || !c.description) erreurs.push(`${ou} : nom ou description manquant`);
    for (const v of c.effets?.routes ?? []) if (!sontVoisines(contenu, c.region, v)) erreurs.push(`${ou} : ${v} n'est pas voisine de ${c.region}`);
    for (const s of c.requiert?.savoirs ?? []) if (!idx.savoirs.has(s)) erreurs.push(`${ou} : savoir inconnu ${s}`);
    for (const a of c.affaires ?? []) if (affaires.size && !affaires.has(a)) erreurs.push(`${ou} : affaire inconnue ${a}`);
    if (!Object.keys(c.effets ?? {}).length) erreurs.push(`${ou} : aucun effet`);
  }
  return erreurs;
}
export const regionsDeLIle = contenu => regionsDe(contenu).map(r => r.cle);
// Un flux de hasard propre au lot (ne change aucun autre tirage).
export const hasardParadis = (graine, nom, jour) => deriverHasard(graine, "paradis", nom, jour);

