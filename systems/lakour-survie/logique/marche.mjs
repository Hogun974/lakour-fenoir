// Le marché de Fénoir (troc, boutique et carnet de crédit, marché forain et sa trêve, foire), les préjugés des PNJ au marché,
// le Ladi Lafé (la rumeur) et les objets marqués. Logique pure, éprouvée par essais/survie-marche.test.mjs.
// Chiffres et raisons : docs/equilibre-marche.md ; contrat : docs/survie-contrat.md §12.
//
// Principes (validés par Jordan, docs/metissage.md) :
// - Troc seulement, pas de monnaie. Le COURS dit ce que vaut chaque bien en « parts » (une part = un jour de nourriture pour une
//   personne) : il aide à échanger, il ne fait pas payer.
// - Aucune origine ne donne de bonus ni de malus. Un PRÉJUGÉ est un trait d'un PNJ (`system.prejuges` de son acteur), jamais une
//   propriété d'une communauté ; le système ne connaît l'origine de personne : c'est le MJ qui dit quel préjugé du PNJ s'éveille
//   devant tel inconnu (souvent à tort : on est métis). Le préjugé joue sur la PREMIÈRE confiance (prix moins bon, crédit
//   refusé, parole mise en doute) et s'use au contact, aux fêtes partagées et quand les faits le démentent devant lui.
// - Le Ladi Lafé (« il a dit qu'il a fait ») : ce qui se dit de quelqu'un. Une rumeur est publique ; sa vérité, son auteur et
//   sa malveillance sont secrets (monde scellé). Colporter du mal a un coût : un mensonge démenti se sait, et l'auteur devient
//   à son tour le sujet d'une rumeur ; le résultat le signale (`colporteur`) pour la jauge de sens moral, quand elle existera.
import { RESSOURCES } from "./constantes.mjs";
import { message } from "./textes.mjs";
import { normaliserStocks, retirerStocks, ajouterStocks } from "./ressources.mjs";
import { dateDuJour } from "./temps.mjs";

export const STADES_MARCHE = ["troc", "boutique", "forain", "foire"];
// Ce qui se troque : tout sauf l'énergie (des kWh dans des batteries ne passent pas de main en main). Le gaz, les boutures et le
// biocarburant (lot « savoirs ») n'ont pas encore de cours : ils restent hors du troc tant qu'on ne leur en a pas donné un.
export const RESSOURCES_HORS_COURS = ["energie", "gaz", "boutures", "biocarburant"];
export const RESSOURCES_TROC = RESSOURCES.filter(r => !RESSOURCES_HORS_COURS.includes(r));
export const PORTEES_RUMEUR = ["quartier", "region", "voisins", "ile"];
export const PREUVES = ["marque", "temoin", "fait"];

export const REGLES_MARCHE = {
  // Le cours : valeur de base en parts, multiplicateurs de phase et de saison, récolte de la foire, arrondi au demi.
  cours: {
    base: { eau: 1, nourriture: 1, plantes: 1, graines: 2, materiaux: 2, munitions: 3, pieces: 3, carburant: 4, medicaments: 5 },
    phase: {
      "jour-zero": {}, panique: { medicaments: 1.5, munitions: 1.5 },
      effondrement: { medicaments: 1.5, munitions: 1.5, carburant: 1.5 },
      silence: { medicaments: 1.5, munitions: 1.5, carburant: 2, pieces: 1.5 },
      apres: { medicaments: 1.5, carburant: 2.5, pieces: 1.5, graines: 1.5 }
    },
    saison: { pluies: { eau: 0.5 }, seche: { eau: 1.5 } },
    recolte: 0.5,          // la récolte d'une foire vaut moitié moins ce jour-là
    pas: 0.5, minimum: 0.5, maximum: 20
  },
  // La première confiance d'un PNJ envers un inconnu, selon le poids des préjugés en jeu et des rumeurs (0 à 3).
  confiance: {
    poidsMax: 3,
    paliers: [
      { majoration: 0, credit: "plein", parole: 0 },
      { majoration: 0.25, credit: "moitie", parole: 1 },
      { majoration: 0.5, credit: "refuse", parole: 1 },
      { majoration: 1, credit: "refuse", parole: 2 }
    ]
  },
  // L'usure d'un préjugé : un cran de moins par 3 échanges honnêtes, par fête partagée, par démenti vu de ses yeux.
  usure: { echangesParCran: 3, fete: 1, dementi: 1 },
  // Le carnet de crédit de la boutique.
  carnet: { plafond: 10, parAnneeTenue: 5, plafondMax: 30, traine: 30 },
  // La trêve du marché forain : la rompre se sait sur toute l'île et coûte auprès de chaque bastion du conseil.
  treve: { reputation: -3 },
  // Accueillir le marché : la signature de l'abri grandit (bruit le jour du marché, visibilité tant qu'on l'accueille), et chaque
  // mois de marché tenu (4 jours de marché) rapporte un point de réputation auprès de chaque bastion qui y vient.
  accueil: { bruit: 3, signature: 2, joursParPoint: 4, reputation: 1 },
  // Le Ladi Lafé : une rumeur s'éteint après `duree` jours (une trêve rompue : `dureeTreve`) ; au plus `max` rumeurs gardées.
  rumeur: { duree: 90, dureeTreve: 365, max: 60 },
  semaine: 7
};

const arrondiPas = (x, pas = REGLES_MARCHE.cours.pas) => Math.round(x / pas) * pas;
const n0 = v => Math.max(0, Number(v) || 0);
const biensPropres = (biens = {}) => Object.fromEntries(Object.entries(biens ?? {})
  .filter(([r, q]) => RESSOURCES_TROC.includes(r) && n0(q) > 0).map(([r, q]) => [r, Math.floor(n0(q))]));

// ------------------------------------------------------------------ les quatre stades
// Ce que le monde permet : -> [{ stade, ouvert, motif }]. Le troc de la main à la main est toujours là ; la boutique demande un
// commerçant resté dans son quartier ; le marché forain, au moins deux communautés dans la région (le groupe compris) et une
// route ouverte entre elles ; la foire, une saison de récolte.
export function stadesDuMarche({ boutique = false, communautes = 1, routeOuverte = false, recolte = false } = {}) {
  return [
    { stade: "troc", ouvert: true, motif: message("marche-stade-troc", {}, "De la main à la main, dès le premier jour.") },
    { stade: "boutique", ouvert: Boolean(boutique), motif: message(boutique ? "marche-stade-boutique" : "marche-stade-sans-boutique", {},
      boutique ? "Un commerçant tient boutique, avec son carnet." : "Aucun commerçant n'a rouvert sa boutique ici.") },
    Number(communautes) >= 2 && routeOuverte
      ? { stade: "forain", ouvert: true, motif: message("marche-stade-forain", { communautes: Number(communautes) },
        `${Number(communautes)} communautés dans la région et une route ouverte : le marché forain peut s'installer.`) }
      : { stade: "forain", ouvert: false, motif: message("marche-stade-sans-forain", { communautes: Number(communautes) || 0 },
        `Il faut deux communautés dans la région et une route ouverte entre elles (${Number(communautes) || 0} pour l'instant).`) },
    { stade: "foire", ouvert: Boolean(recolte), motif: message(recolte ? "marche-stade-foire" : "marche-stade-sans-foire", {},
      recolte ? "Une saison de récolte réunit les bastions." : "Pas de récolte à fêter en ce moment.") }
  ];
}

// ------------------------------------------------------------------ le cours du troc
// -> { ressource: parts } pour chaque bien qui se troque. ajustements : { ressource: ±parts } décidés par le conseil du marché.
export function coursDuJour({ phase = "jour-zero", saison = "pluies", recolte = null, ajustements = {} } = {}) {
  const R = REGLES_MARCHE.cours;
  const cours = {};
  for (const r of RESSOURCES_TROC) {
    let v = R.base[r] ?? 1;
    v *= R.phase[phase]?.[r] ?? 1;
    v *= R.saison[saison]?.[r] ?? 1;
    if (recolte && recolte === r) v *= R.recolte;
    v += Number(ajustements?.[r]) || 0;
    cours[r] = Math.min(R.maximum, Math.max(R.minimum, arrondiPas(v)));
  }
  return cours;
}

// La valeur de biens au cours (parts). Ce qui ne se troque pas (énergie) ne compte pas.
export function valeurBiens(biens = {}, cours = coursDuJour()) {
  return Object.entries(biensPropres(biens)).reduce((s, [r, q]) => s + q * (Number(cours[r]) || 0), 0);
}

// Un troc évalué au cours : le PNJ demande la valeur reçue majorée (sa première confiance), le groupe donne `donne`.
// -> { valeurDonnee, valeurRecue, demandee, ecart (donnée − demandée), accepte, equitable (à 10 % ou une part près, sans majoration) }
export function evaluerTroc({ donne = {}, recoit = {}, cours = coursDuJour(), majoration = 0 } = {}) {
  const valeurDonnee = valeurBiens(donne, cours), valeurRecue = valeurBiens(recoit, cours);
  const demandee = arrondiPas(valeurRecue * (1 + n0(majoration)));
  const ecart = valeurDonnee - demandee;
  const equitable = Math.abs(valeurDonnee - valeurRecue) <= Math.max(1, 0.1 * valeurRecue);
  return { valeurDonnee, valeurRecue, demandee, ecart, accepte: valeurRecue > 0 && ecart >= 0, equitable };
}

// Appliquer un troc aux stocks du groupe : il faut avoir ce qu'on donne. -> { ok, stocks, manque, motif }
export function appliquerTroc(stocks = {}, { donne = {}, recoit = {} } = {}) {
  const d = biensPropres(donne), r = biensPropres(recoit);
  const { manque } = retirerStocks(stocks, d);
  if (Object.keys(manque).length) return { ok: false, stocks: normaliserStocks(stocks), manque, motif: message("manque", { manque }, `il manque : ${Object.entries(manque).map(([k, q]) => `${q} ${k}`).join(", ")}`) };
  return { ok: true, stocks: ajouterStocks(retirerStocks(stocks, d).stocks, r), manque: {}, motif: null };
}

// ------------------------------------------------------------------ les préjugés d'un PNJ
// Un préjugé : { cible (clé d'une communauté ou d'un groupe : « zoreils », « gens-d-en-bas »…), poids 1..3, dit (ce qu'il dit),
//   echanges, fetes, dementis (son usure) }.
export function normaliserPrejuge(p = {}) {
  return { cible: String(p.cible ?? "").trim(), poids: Math.max(0, Math.min(3, Math.round(Number(p.poids ?? 1)))), dit: String(p.dit ?? ""),
    echanges: Math.floor(n0(p.echanges)), fetes: Math.floor(n0(p.fetes)), dementis: Math.floor(n0(p.dementis)) };
}
// Ce qu'il pèse encore (0 : il est tombé).
export function poidsPrejuge(p = {}) {
  const x = normaliserPrejuge(p), U = REGLES_MARCHE.usure;
  return Math.max(0, x.poids - Math.floor(x.echanges / U.echangesParCran) - x.fetes * U.fete - x.dementis * U.dementi);
}
// Les préjugés du PNJ qui s'éveillent devant cet inconnu (cibles données par le MJ) et pèsent encore.
export const prejugesEnJeu = (prejuges = [], cibles = []) => (prejuges ?? []).map(normaliserPrejuge)
  .filter(p => p.cible && (cibles ?? []).includes(p.cible) && poidsPrejuge(p) > 0);

// La première confiance d'un PNJ envers un inconnu : préjugés en jeu (cumulés) et rumeurs défavorables entendues sur lui.
// palier : la majoration et le crédit de la réputation d'une faction, s'il traite au nom d'une faction ({ majoration, credit }).
// -> { poids, majoration, credit: "plein" | "moitie" | "refuse", parole (dés de moins aux tests de parole avec lui), enJeu, dits }
export function premiereConfiance({ prejuges = [], cibles = [], rumeurs = 0, palier = null } = {}) {
  const C = REGLES_MARCHE.confiance;
  const enJeu = prejugesEnJeu(prejuges, cibles);
  const poids = Math.min(C.poidsMax, enJeu.reduce((s, p) => s + poidsPrejuge(p), 0) + Math.floor(n0(rumeurs)));
  const p = C.paliers[poids];
  const ordre = ["plein", "moitie", "refuse"];
  const credit = palier?.credit && ordre.indexOf(palier.credit) > ordre.indexOf(p.credit) ? palier.credit : p.credit;
  return { poids, majoration: p.majoration + n0(palier?.majoration), credit, parole: p.parole, enJeu: enJeu.map(x => x.cible), dits: enJeu.map(x => x.dit).filter(Boolean) };
}

// L'usure : `echanges` échanges honnêtes avec quelqu'un que visent ces préjugés, une fête partagée, un démenti vu de ses yeux.
// cibles vides : tous ses préjugés (une fête partagée avec tout le monde, un démenti général). -> { prejuges, uses, tombes }
export function userPrejuges(prejuges = [], { cibles = [], echanges = 0, fete = false, dementi = false } = {}) {
  const uses = [], tombes = [];
  const sortie = (prejuges ?? []).map(normaliserPrejuge).map(p => {
    if (!p.cible || (cibles?.length && !cibles.includes(p.cible))) return p;
    const avant = poidsPrejuge(p);
    if (!avant) return p;
    const q = { ...p, echanges: p.echanges + Math.floor(n0(echanges)), fetes: p.fetes + (fete ? 1 : 0), dementis: p.dementis + (dementi ? 1 : 0) };
    const apres = poidsPrejuge(q);
    if (apres < avant) uses.push(p.cible);
    if (avant > 0 && apres === 0) tombes.push(p.cible);
    return q;
  });
  return { prejuges: sortie, uses, tombes };
}

// ------------------------------------------------------------------ le carnet de crédit de la boutique
// carnet : { cle, nom, tenancier, region, entrees: [{ id, debiteur, pris, valeur, reste, jour, nouvelAn, rumeur, rendus }],
//   parole: { debiteur: années tenues }, soldeLe: année du dernier Nouvel An soldé, prochain: n }
export function carnetVide({ cle = "boutique", nom = "", tenancier = "", region = "" } = {}) {
  return { cle, nom, tenancier, region, entrees: [], parole: {}, soldeLe: null, prochain: 1 };
}
export const detteDe = (carnet, debiteur) => (carnet?.entrees ?? []).filter(e => e.debiteur === debiteur).reduce((s, e) => s + n0(e.reste), 0);
const traine = (e, jour) => n0(e.reste) > 0 && (e.nouvelAn !== null && e.nouvelAn !== undefined || Number(jour) - Number(e.jour) >= REGLES_MARCHE.carnet.traine);

// Le plafond de crédit d'un débiteur : 10 parts, +5 par Nouvel An où il a tout rendu (au plus 30) ; la moitié si le tenancier se
// méfie, rien s'il refuse.
export function plafondCredit(carnet, debiteur, confiance = null) {
  const C = REGLES_MARCHE.carnet;
  const base = Math.min(C.plafondMax, C.plafond + C.parAnneeTenue * n0(carnet?.parole?.[debiteur]));
  const credit = confiance?.credit ?? "plein";
  return credit === "refuse" ? 0 : credit === "moitie" ? Math.floor(base / 2) : base;
}

// Prendre à crédit : la dette est écrite, au cours du jour. Refusé si le tenancier refuse (première confiance), si une dette de ce
// débiteur traîne (30 jours, ou passée le Nouvel An), ou au-delà du plafond. -> { ok, motif, carnet, entree }
export function prendreACredit(carnet, { debiteur = "groupe", biens = {}, cours = coursDuJour(), jour = 0, confiance = null } = {}) {
  const c = structuredClone(carnet ?? carnetVide());
  const refus = (cle, params, texte) => ({ ok: false, motif: message(cle, params, texte), carnet: c, entree: null });
  const pris = biensPropres(biens);
  const valeur = valeurBiens(pris, cours);
  if (!valeur) return refus("carnet-rien", {}, "rien à écrire au carnet");
  if (confiance?.credit === "refuse") return refus("carnet-refuse", { debiteur }, `pas de crédit pour ${debiteur}`);
  if (c.entrees.some(e => e.debiteur === debiteur && traine(e, jour))) return refus("carnet-traine", { debiteur }, `${debiteur} a une dette qui traîne`);
  const plafond = plafondCredit(c, debiteur, confiance);
  const total = detteDe(c, debiteur) + valeur;
  if (total > plafond) return refus("carnet-plafond", { plafond, dette: total - valeur }, `plafond du carnet : ${plafond} parts (déjà ${total - valeur})`);
  const entree = { id: `d${c.prochain++}`, debiteur, pris, valeur, reste: valeur, jour: Number(jour) || 0, nouvelAn: null, rumeur: false, rendus: [] };
  c.entrees.push(entree);
  return { ok: true, motif: null, carnet: c, entree };
}

// Rendre : des biens au cours du jour, qui soldent les dettes les plus anciennes d'abord. -> { carnet, valeur, paye, reste, surplus }
export function rendreAuCarnet(carnet, { debiteur = "groupe", biens = {}, cours = coursDuJour(), jour = 0 } = {}) {
  const c = structuredClone(carnet ?? carnetVide());
  const valeur = valeurBiens(biens, cours);
  let dispo = valeur;
  for (const e of c.entrees.filter(x => x.debiteur === debiteur && n0(x.reste) > 0).sort((a, b) => a.jour - b.jour)) {
    if (dispo <= 0) break;
    const p = Math.min(dispo, e.reste);
    e.reste = arrondiPas(e.reste - p, 0.01);
    e.rendus = [...(e.rendus ?? []), { jour: Number(jour) || 0, valeur: p }];
    dispo -= p;
  }
  return { carnet: c, valeur, paye: valeur - dispo, reste: detteDe(c, debiteur), surplus: dispo };
}

// Le tenancier efface les dettes d'un débiteur (après un cyclone, un deuil : c'est son choix). -> { carnet, efface (parts) }
export function effacerDettes(carnet, debiteur) {
  const c = structuredClone(carnet ?? carnetVide());
  const efface = detteDe(c, debiteur);
  c.entrees = c.entrees.filter(e => e.debiteur !== debiteur);
  return { carnet: c, efface };
}

// Les dettes qui traînent et dont la rumeur n'a pas encore parlé.
export const dettesQuiTrainent = (carnet, jour) => (carnet?.entrees ?? []).filter(e => traine(e, jour) && !e.rumeur);

// Le Nouvel An chinois : le carnet se solde. Une dette rendue en entier sort du carnet, et la parole tenue du débiteur grandit
// (son plafond aussi) ; une dette encore due reste, marquée « passée le Nouvel An » : elle traîne. Le tenancier peut effacer
// des dettes (`remises` : débiteurs, après un cyclone par exemple). Une fois par année.
// -> { carnet, deja, soldes: [debiteur], impayees: [{ debiteur, reste }], remises: [{ debiteur, reste }] }
export function solderAuNouvelAn(carnet, { annee, remises = [] } = {}) {
  const c = structuredClone(carnet ?? carnetVide());
  if (c.soldeLe === annee) return { carnet: c, deja: true, soldes: [], impayees: [], remises: [] };
  const debiteurs = [...new Set(c.entrees.map(e => e.debiteur))];
  const soldes = [], impayees = [], effacees = [];
  for (const d of debiteurs) {
    const reste = detteDe(c, d);
    if (remises.includes(d) && reste > 0) { effacees.push({ debiteur: d, reste }); c.entrees = c.entrees.filter(e => e.debiteur !== d); continue; }
    if (reste <= 0) { soldes.push(d); c.parole[d] = n0(c.parole[d]) + 1; c.entrees = c.entrees.filter(e => e.debiteur !== d); continue; }
    impayees.push({ debiteur: d, reste });
    c.entrees = c.entrees.map(e => (e.debiteur === d && n0(e.reste) > 0 ? { ...e, nouvelAn: e.nouvelAn ?? annee } : e)).filter(e => e.debiteur !== d || n0(e.reste) > 0);
  }
  c.soldeLe = annee;
  return { carnet: c, deja: false, soldes, impayees, remises: effacees };
}

// ------------------------------------------------------------------ le marché forain et sa trêve
// marché : { cle, nom, region, lieu, jourSemaine (0 = dimanche … 6 = samedi), bastions: [nom ou clé de faction], hote: "" | "groupe"
//   | clé de faction, treve: { rompue, par, jour }, ouvertLe, joursTenus, recolte: ressource | null, foire: Boolean, litiges: n }
// Une foire (`foire: true`) se tient chaque jour pendant `duree` jours (3 par défaut), puis se termine (`jusqua`).
export function creerMarche({ cle, nom = "", region = "", lieu = "", jourSemaine = 6, bastions = [], hote = "", jour = 0, recolte = null, foire = false, duree = 3 } = {}) {
  const debut = Number(jour) || 0;
  return { cle: String(cle || nom || "marche"), nom: String(nom || cle || ""), region, lieu, jourSemaine: ((Math.round(Number(jourSemaine) || 0) % 7) + 7) % 7,
    bastions: [...new Set((bastions ?? []).filter(Boolean))], hote: String(hote ?? ""), treve: { rompue: false, par: "", jour: null },
    ouvertLe: debut, joursTenus: 0, recolte: RESSOURCES_TROC.includes(recolte) ? recolte : null, foire: Boolean(foire),
    jusqua: foire ? debut + Math.max(1, Math.round(Number(duree) || 3)) - 1 : null, litiges: 0 };
}
export const marcheOuvert = m => Boolean(m) && !m.treve?.rompue;
export const foireFinie = (m, jour) => Boolean(m?.foire) && m.jusqua !== null && m.jusqua !== undefined && Number(jour) > Number(m.jusqua);
export const estJourDeMarche = (m, jour, dateDepart) => marcheOuvert(m) && !foireFinie(m, jour)
  && (m.foire ? Number(jour) >= Number(m.ouvertLe ?? 0) : dateDuJour(jour, dateDepart).semaine === Number(m.jourSemaine));

// Rompre la trêve : le marché ferme jusqu'à ce que le conseil la rétablisse ; la rupture se sait sur toute l'île (rumeur vraie,
// portée « ile ») et coûte de la réputation auprès de chaque bastion du conseil. -> { marche, reputation: { bastion: n }, rumeur }
export function rompreTreve(marche, { par = "", jour = 0 } = {}) {
  const m = structuredClone(marche);
  m.treve = { rompue: true, par: String(par ?? ""), jour: Number(jour) || 0 };
  const reputation = Object.fromEntries((m.bastions ?? []).filter(b => b !== par).map(b => [b, REGLES_MARCHE.treve.reputation]));
  const rumeur = { sujet: String(par ?? ""), vraie: true, malveillant: false, portee: "ile", source: "treve", contre: true,
    texte: message("rumeur-treve", { marche: m.nom, par }, `${par} a rompu la trêve de ${m.nom}.`) };
  return { marche: m, reputation, rumeur };
}
export function retablirTreve(marche) {
  return { ...structuredClone(marche), treve: { rompue: false, par: "", jour: null } };
}

// Un litige porté au conseil : une voix par bastion (« a », « b » ou rien). -> { issue: "a" | "b" | "partage", a, b }
export function trancherLitige({ voix = {} } = {}) {
  const v = Object.values(voix ?? {});
  const a = v.filter(x => x === "a").length, b = v.filter(x => x === "b").length;
  return { issue: a > b ? "a" : b > a ? "b" : "partage", a, b };
}

// Le jour du marché pour l'abri qui l'accueille : bruit, et un point de réputation par bastion tous les quatre jours tenus.
// -> { marche, bruit, reputation: { bastion: n } }
export function tenirJourDeMarche(marche, { hote = "groupe" } = {}) {
  const m = structuredClone(marche);
  if (!marcheOuvert(m) || m.hote !== hote) return { marche: m, bruit: 0, reputation: {} };
  const A = REGLES_MARCHE.accueil;
  m.joursTenus = (Number(m.joursTenus) || 0) + 1;
  const reputation = m.joursTenus % A.joursParPoint === 0 ? Object.fromEntries((m.bastions ?? []).filter(b => b !== hote).map(b => [b, A.reputation])) : {};
  return { marche: m, bruit: A.bruit, reputation };
}
// La signature de l'abri du groupe (visibilité ajoutée) : il accueille au moins un marché ouvert.
export const signatureDuMarche = (etatMarche, hote = "groupe") => ((etatMarche?.marches ?? []).some(m => marcheOuvert(m) && m.hote === hote) ? REGLES_MARCHE.accueil.signature : 0);

// ------------------------------------------------------------------ le Ladi Lafé
// L'état PUBLIC du marché (etat.marche) et sa part SECRÈTE (monde.marche : la vérité des rumeurs).
export const marcheVide = () => ({ boutiques: [], marches: [], rumeurs: [], signe: "", prochain: 1 });
export const secretMarcheVide = () => ({ rumeurs: {} });
export const marcheDe = etat => ({ ...marcheVide(), ...(etat?.marche ?? {}) });
export const secretMarcheDe = monde => ({ ...secretMarcheVide(), ...(monde?.marche ?? {}) });

// Lancer une rumeur : publique (sujet, texte, portée, date), vérité et auteur au secret. contre : elle dit du mal du sujet.
// -> { marche, secret, rumeur, colporteur (l'auteur qui dit du mal : il s'approche du rouge, vrai ou faux) }
export function lancerRumeur(marche, secret, { sujet = "", texte = "", vraie = true, auteur = "", malveillant = false, portee = "region", source = "colporte",
  contre = true, jour = 0 } = {}) {
  const m = { ...marcheVide(), ...structuredClone(marche ?? {}) };
  const s = { ...secretMarcheVide(), ...structuredClone(secret ?? {}) };
  const id = `r${m.prochain++}`;
  const t = typeof texte === "object" && texte ? texte : message("rumeur", { sujet, texte: String(texte ?? "") }, String(texte ?? ""));
  const rumeur = { id, sujet: String(sujet ?? ""), ...t, portee: PORTEES_RUMEUR.includes(portee) ? portee : "region", source, contre: Boolean(contre), jour: Number(jour) || 0, dementie: false };
  m.rumeurs = [...m.rumeurs, rumeur].slice(-REGLES_MARCHE.rumeur.max);
  s.rumeurs = { ...s.rumeurs, [id]: { vraie: Boolean(vraie), auteur: String(auteur ?? ""), malveillant: Boolean(malveillant) } };
  return { marche: m, secret: s, rumeur, colporteur: contre && auteur ? String(auteur) : "" };
}

const dureeRumeur = r => (r.source === "treve" ? REGLES_MARCHE.rumeur.dureeTreve : REGLES_MARCHE.rumeur.duree);
export const rumeurActive = (r, jour) => !r.dementie && Number(jour) - Number(r.jour) < dureeRumeur(r);
// Les rumeurs défavorables encore vivantes sur un sujet (ce qui pèse sur sa première confiance).
export const rumeursContre = (marche, sujet, jour) => (marche?.rumeurs ?? []).filter(r => r.contre && r.sujet === sujet && rumeurActive(r, jour));

// Démentir une rumeur par une preuve (une marque sur l'objet, un témoin, un fait). Une rumeur vraie ne se dément pas : le jeu
// dit vrai. Une rumeur fausse tombe ; si elle était malveillante, son auteur devient le sujet d'une rumeur vraie (un mensonge
// démenti se sait). -> { ok, marche, secret, motif, menteur, rumeur (la nouvelle, contre le menteur) }
export function dementirRumeur(marche, secret, { id, preuve = "fait", jour = 0 } = {}) {
  let m = { ...marcheVide(), ...structuredClone(marche ?? {}) };
  let s = { ...secretMarcheVide(), ...structuredClone(secret ?? {}) };
  const r = m.rumeurs.find(x => x.id === id);
  if (!r) return { ok: false, marche: m, secret: s, motif: message("rumeur-inconnue", { id }, "rumeur inconnue"), menteur: "", rumeur: null };
  const verite = s.rumeurs[id] ?? { vraie: true, auteur: "", malveillant: false };
  if (verite.vraie) return { ok: false, marche: m, secret: s, motif: message("rumeur-vraie", {}, "c'est vrai : on ne dément pas un fait"), menteur: "", rumeur: null };
  r.dementie = true;
  r.preuve = PREUVES.includes(preuve) ? preuve : "fait";
  let nouvelle = null, menteur = "";
  if (verite.malveillant && verite.auteur) {
    menteur = verite.auteur;
    const x = lancerRumeur(m, s, { sujet: menteur, vraie: true, portee: r.portee, source: "mensonge", contre: true, jour,
      texte: message("rumeur-menteur", { auteur: menteur, sujet: r.sujet }, `${menteur} a menti sur ${r.sujet}.`) });
    m = x.marche; s = x.secret; nouvelle = x.rumeur;
  }
  return { ok: true, marche: m, secret: s, motif: null, menteur, rumeur: nouvelle };
}

// ------------------------------------------------------------------ objets marqués
// Une réclamation : l'objet porte-t-il une marque ? Celle du réclamant ou celle du possesseur ? Sinon, les témoins ; à égalité,
// parole contre parole (le conseil tranche, ou un test de parole opposé).
// -> { issue: "au-reclamant" | "au-possesseur" | "parole-contre-parole", prouve, menteur: "reclamant" | "possesseur" | "" }
export function reclamerObjet({ marque = "", signeReclamant = "", signePossesseur = "", temoins = { reclamant: 0, possesseur: 0 } } = {}) {
  const mq = String(marque ?? "").trim();
  if (mq) {
    if (mq === String(signeReclamant ?? "").trim()) return { issue: "au-reclamant", prouve: true, menteur: "possesseur" };
    if (mq === String(signePossesseur ?? "").trim()) return { issue: "au-possesseur", prouve: true, menteur: "reclamant" };
  }
  const a = n0(temoins?.reclamant), b = n0(temoins?.possesseur);
  if (a > b) return { issue: "au-reclamant", prouve: false, menteur: "possesseur" };
  if (b > a) return { issue: "au-possesseur", prouve: false, menteur: "reclamant" };
  return { issue: "parole-contre-parole", prouve: false, menteur: "" };
}

// ------------------------------------------------------------------ la journée du marché (à chaque nouveau jour)
// Les jours de marché, la signature de l'abri qui accueille, les dettes qui traînent (le Ladi Lafé s'en empare), le Nouvel An
// chinois (le carnet se solde), les rumeurs qui s'éteignent.
// fetes : clés des fêtes au cœur ce jour-là (« nouvel-an-chinois » solde les carnets). debiteur : le nom du groupe dans les carnets.
// -> { marche, secret, faits: [message public], marches: [cle] (jours de marché), bruit, reputation: { bastion: n }, soldes }
export function journeeDuMarche({ marche, secret, jour = 0, dateDepart, fetes = [], debiteur = "groupe" } = {}) {
  let m = { ...marcheVide(), ...structuredClone(marche ?? {}) };
  let s = { ...secretMarcheVide(), ...structuredClone(secret ?? {}) };
  const faits = [], jours = [], reputation = {}, soldes = [];
  let bruit = 0;
  const ajouterRep = rep => { for (const [b, n] of Object.entries(rep)) reputation[b] = (reputation[b] ?? 0) + n; };
  // 1. Les foires terminées s'en vont ; les marchés du jour se tiennent.
  m.marches = m.marches.filter(mk => {
    if (!foireFinie(mk, jour)) return true;
    faits.push(message("foire-finie", { marche: mk.nom }, `${mk.nom} : c'est fini, chacun rentre chez soi.`));
    return false;
  });
  m.marches = m.marches.map(mk => {
    if (!estJourDeMarche(mk, jour, dateDepart)) return mk;
    jours.push(mk.cle);
    faits.push(message("marche-jour", { marche: mk.nom, lieu: mk.lieu }, `Jour de marché : ${mk.nom}.`));
    const t = tenirJourDeMarche(mk, { hote: debiteur });
    bruit += t.bruit;
    ajouterRep(t.reputation);
    return t.marche;
  });
  // 2. Le Nouvel An chinois : chaque carnet se solde.
  if ((fetes ?? []).includes("nouvel-an-chinois")) {
    const annee = dateDuJour(jour, dateDepart).annee;
    m.boutiques = m.boutiques.map(b => {
      const r = solderAuNouvelAn(b, { annee });
      if (r.deja) return b;
      soldes.push({ boutique: b.cle, ...r });
      faits.push(message("carnet-nouvel-an", { boutique: b.nom, soldes: r.soldes.length, impayees: r.impayees.length },
        `Nouvel An chinois : le carnet ${b.nom ? `de ${b.nom} ` : ""}se solde (${r.soldes.length} compte(s) soldé(s), ${r.impayees.length} dette(s) encore due(s)).`));
      return r.carnet;
    });
  }
  // 3. Les dettes qui traînent nourrissent le Ladi Lafé (une fois par dette).
  for (const b of m.boutiques) {
    for (const e of dettesQuiTrainent(b, jour)) {
      e.rumeur = true;
      const x = lancerRumeur(m, s, { sujet: e.debiteur, vraie: true, portee: "region", source: "dette", contre: true, jour,
        texte: message("rumeur-dette", { debiteur: e.debiteur, boutique: b.nom, reste: e.reste }, `${e.debiteur} doit encore ${e.reste} part(s) au carnet de ${b.nom}.`) });
      m = { ...x.marche, boutiques: m.boutiques };
      s = x.secret;
      faits.push(message("marche-dette-rumeur", { debiteur: e.debiteur, boutique: b.nom }, `On parle de la dette de ${e.debiteur} au carnet de ${b.nom}.`));
    }
  }
  // 4. Les rumeurs éteintes sortent de la liste (leur vérité aussi).
  const vivantes = m.rumeurs.filter(r => Number(jour) - Number(r.jour) < dureeRumeur(r));
  const gardees = new Set(vivantes.map(r => r.id));
  m.rumeurs = vivantes;
  s.rumeurs = Object.fromEntries(Object.entries(s.rumeurs).filter(([id]) => gardees.has(id)));
  return { marche: m, secret: s, faits, marches: jours, bruit, reputation, soldes };
}

// ------------------------------------------------------------------ un événement de marché tiré au jour du marché
// Les événements de type « marche » du contenu (la simulation du monde ne les tire jamais) : selon le stade, la saison, la phase.
export function evenementsDeMarche(contenu, { stade = "forain", saison = null, phase = null } = {}) {
  const evts = Array.isArray(contenu?.evenements) ? contenu.evenements : Object.values(contenu?.evenements ?? {});
  return evts.filter(e => e?.type === "marche" && (!e.stades?.length || e.stades.includes(stade))
    && (!saison || !e.saisons?.length || e.saisons.includes(saison)) && (!phase || !e.phases?.length || e.phases.includes(phase)));
}

// Vérifier un préjugé du contenu (cible connue, poids 1..3, ce qu'il dit). -> [String]
export function verifierPrejuges(prejuges = [], cibles = new Set(), ou = "") {
  const e = [];
  for (const p of prejuges ?? []) {
    if (!p?.cible || (cibles.size && !cibles.has(p.cible))) e.push(`${ou} : préjugé à cible inconnue « ${p?.cible} »`);
    if (!(Number(p?.poids) >= 1 && Number(p?.poids) <= 3)) e.push(`${ou} : poids de préjugé hors de 1..3`);
    if (!String(p?.dit ?? "").trim()) e.push(`${ou} : préjugé sans parole (dit)`);
  }
  return e;
}
