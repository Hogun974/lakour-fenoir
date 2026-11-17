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
//
// Lot 10 (2026-11-17, contrat §22, docs/equilibre-communaute.md), repris du jeu 3D (famille 7, validé par Jordan) :
// - la MARGE du commerçant : il revend au-dessus du cours et rachète en dessous ; sa confiance suit la RÉPUTATION du client (ce
//   qu'il sait de lui ; le sens moral, il ne le voit pas) et sa parole (confianceDuCommercant, evaluerALaBoutique) ; son carnet
//   prête plus ou moins selon elle (plafondCredit, facteur) ; un commerçant n'est resté que dans 30 % des boutiques
//   (commercantReste) ;
// - la VALEUR d'un objet en parts (valeurObjet) : la valeur écrite au barème du contenu, sinon le coût de sa recette au cours ; celle
//   d'un plan est celle du lot « plans » (valeurPlan, plans.mjs), comptée au troc et à la boutique (`objets`) ;
// - l'ÉTAL : le groupe tient un étal au marché forain, qui vend même quand il n'est pas là, avec une caisse à relever et un risque
//   de vol (creerEtal, journeeEtal, releverEtal ; journeeDuMarche les tient les jours de marché).
import { RESSOURCES } from "./constantes.mjs";
import { chance } from "./hasard.mjs";
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
  // Rééquilibrage du 2026-11-13 (docs/equilibre-marche.md) : les plantes valent 2 (et non 1) et suivent les médicaments dans la
  // crise (× 1,5 dès la panique) : à 1 part, deux brassées (2) faisaient une tisane qui valait un médicament (5, puis 7,5), une
  // rente de 3 à 5 parts par quart de travail ; à 2, la tisane rapporte environ une part par quart, le prix d'un travail.
  cours: {
    base: { eau: 1, nourriture: 1, plantes: 2, graines: 2, materiaux: 2, munitions: 3, pieces: 3, carburant: 4, medicaments: 5 },
    phase: {
      "jour-zero": {}, panique: { medicaments: 1.5, plantes: 1.5, munitions: 1.5 },
      effondrement: { medicaments: 1.5, plantes: 1.5, munitions: 1.5, carburant: 1.5 },
      silence: { medicaments: 1.5, plantes: 1.5, munitions: 1.5, carburant: 2, pieces: 1.5 },
      apres: { medicaments: 1.5, plantes: 1.5, carburant: 2.5, pieces: 1.5, graines: 1.5 }
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
  semaine: 7,
  // Lot 10 : la boutique d'un commerçant (jeu 3D, paquets/base/jeu/bareme.json, validé par Jordan le 17 novembre 2026). Il revend à
  // 1,25 × le cours et rachète à 0,6 × ; sa confiance (1 pour un inconnu) va de 0,75 (réputation −10) à 1,15 (+10) en ligne droite,
  // × (1 + 3 % par niveau de parole au-dessus de 1), bornée entre 0,25 et 1,15 ; elle divise le prix de vente, multiplie le prix
  // d'achat et le plafond du carnet. Un commerçant est resté dans 30 % des boutiques.
  boutique: { presence: 0.3, vente: 1.25, achat: 0.6, confiance: { bleu: 1.15, rouge: 0.75, min: 0.25, max: 1.15 }, parole: 0.03, paroleDe: 1 },
  // L'étal du groupe au marché forain : chaque jour de marché, `ventes` passants s'arrêtent ; chacun prend une unité avec la chance
  // `chance` au cours, × (cours / prix)², au plus `chanceMax` ; payée au cours dans le bien demandé (`contre`), dans la caisse. Sans
  // gardien, une chance `vol` qu'on se serve (`part` du bien le plus fourni) ; avec un gardien, `volGarde`.
  etal: { ventes: 3, chance: 0.5, chanceMax: 0.95, vol: 0.1, volGarde: 0.02, part: 0.25 }
  // La valeur d'un plan est celle du lot « plans » (fusion vague2) : REGLES_PLANS.valeur, valeurPlan dans plans.mjs.
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
// objets (fusion vague2) : { donne, recoit } la valeur en parts des objets qui changent de mains avec les biens (papiers et plans :
// valeurPlan ; objets : valeurObjet), comptée comme les biens.
// -> { valeurDonnee, valeurRecue, demandee, ecart (donnée − demandée), accepte, equitable (à 10 % ou une part près, sans majoration) }
export function evaluerTroc({ donne = {}, recoit = {}, cours = coursDuJour(), majoration = 0, objets = {} } = {}) {
  const valeurDonnee = valeurBiens(donne, cours) + n0(objets.donne), valeurRecue = valeurBiens(recoit, cours) + n0(objets.recoit);
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
// méfie, rien s'il refuse. facteur (lot 10) : la confiance du commerçant (confianceDuCommercant), qui le multiplie (à la demi-part).
export function plafondCredit(carnet, debiteur, confiance = null, facteur = 1) {
  const C = REGLES_MARCHE.carnet;
  const base = Math.min(C.plafondMax, C.plafond + C.parAnneeTenue * n0(carnet?.parole?.[debiteur]));
  const credit = confiance?.credit ?? "plein";
  const brut = credit === "refuse" ? 0 : credit === "moitie" ? Math.floor(base / 2) : base;
  const f = Number(facteur) > 0 ? Number(facteur) : 1;
  return f === 1 ? brut : Math.floor(brut * f * 2) / 2;
}

// Prendre à crédit : la dette est écrite, au cours du jour. Refusé si le tenancier refuse (première confiance), si une dette de ce
// débiteur traîne (30 jours, ou passée le Nouvel An), ou au-delà du plafond. facteur : la confiance du commerçant (lot 10).
// -> { ok, motif, carnet, entree }
export function prendreACredit(carnet, { debiteur = "groupe", biens = {}, cours = coursDuJour(), jour = 0, confiance = null, facteur = 1 } = {}) {
  const c = structuredClone(carnet ?? carnetVide());
  const refus = (cle, params, texte) => ({ ok: false, motif: message(cle, params, texte), carnet: c, entree: null });
  const pris = biensPropres(biens);
  const valeur = valeurBiens(pris, cours);
  if (!valeur) return refus("carnet-rien", {}, "rien à écrire au carnet");
  if (confiance?.credit === "refuse") return refus("carnet-refuse", { debiteur }, `pas de crédit pour ${debiteur}`);
  if (c.entrees.some(e => e.debiteur === debiteur && traine(e, jour))) return refus("carnet-traine", { debiteur }, `${debiteur} a une dette qui traîne`);
  const plafond = plafondCredit(c, debiteur, confiance, facteur);
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

// ------------------------------------------------------------------ la boutique du commerçant (lot 10)
// Un commerçant est-il resté dans cette boutique ? (30 % des boutiques et commerces.)
export const commercantReste = (hasard = Math.random) => chance(REGLES_MARCHE.boutique.presence, hasard);
// Sa confiance envers un client : la réputation du client (−10..10 : ce qu'on dit de lui ; le sens moral, le commerçant ne le voit
// pas) et sa parole (niveau). -> un nombre entre 0,25 et 1,15 (1 : un inconnu à la parole ordinaire)
export function confianceDuCommercant({ reputation = 0, parole = 1 } = {}) {
  const B = REGLES_MARCHE.boutique, C = B.confiance;
  const r = Math.max(-10, Math.min(10, Number(reputation) || 0)) / 10;
  const base = r >= 0 ? 1 + (C.bleu - 1) * r : 1 + (1 - C.rouge) * r;
  const avecParole = base * (1 + B.parole * Math.max(0, (Number(parole) || 0) - B.paroleDe));
  return Math.round(Math.min(C.max, Math.max(C.min, avecParole)) * 1000) / 1000;
}
// Ses prix pour un client, en multiples du cours : { confiance, vente (ce qu'il demande de ce qu'il cède), achat (ce qu'il compte
// de ce qu'on lui cède) }. Tout bleu : 1,09 et 0,69 ; tout rouge : 1,67 et 0,45.
export function prixDuCommercant(client = {}) {
  const B = REGLES_MARCHE.boutique;
  const confiance = confianceDuCommercant(client);
  return { confiance, vente: Math.round(B.vente / confiance * 1000) / 1000, achat: Math.round(B.achat * confiance * 1000) / 1000 };
}
// Un troc à la boutique : le commerçant demande la valeur de ce qu'il cède × vente, et la majoration de sa première confiance
// (préjugés, rumeurs, faction) ; il compte ce qu'on lui cède × achat. Troc seulement : ce qu'on donne en trop est perdu.
// objets : comme pour evaluerTroc (la valeur en parts des papiers, plans et objets échangés), à la même marge que les biens.
// -> { valeurDonnee, valeurRecue (au cours), offerte (ce qu'il en compte), demandee, ecart, accepte, confiance, vente, achat }
export function evaluerALaBoutique({ donne = {}, recoit = {}, cours = coursDuJour(), reputation = 0, parole = 1, majoration = 0, objets = {} } = {}) {
  const p = prixDuCommercant({ reputation, parole });
  const valeurDonnee = valeurBiens(donne, cours) + n0(objets.donne), valeurRecue = valeurBiens(recoit, cours) + n0(objets.recoit);
  const offerte = arrondiPas(valeurDonnee * p.achat);
  const demandee = arrondiPas(valeurRecue * p.vente * (1 + n0(majoration)));
  return { valeurDonnee, valeurRecue, offerte, demandee, ecart: offerte - demandee, accepte: valeurRecue > 0 && offerte >= demandee, ...p };
}

// ------------------------------------------------------------------ la valeur d'un objet, d'un plan (lot 10)
// Un objet : la valeur écrite au barème du contenu (contenu.bareme : { objets: { cle: parts } }, bêtes vivantes comprises), sinon le
// coût de sa recette la moins chère au cours (les ingrédients, sans le travail : comme le jeu 3D), sinon rien (au MJ de dire).
// -> { valeur: parts | null, source: "bareme" | "recette" | "" }
export function valeurObjet(cle, contenu = {}, cours = coursDuJour()) {
  const k = String(cle ?? "");
  const ecrite = contenu?.bareme?.objets?.[k];
  if (ecrite !== undefined && ecrite !== null && Number.isFinite(Number(ecrite))) return { valeur: Math.max(0, Number(ecrite)), source: "bareme" };
  const recettes = (Array.isArray(contenu?.recettes) ? contenu.recettes : Object.values(contenu?.recettes ?? {}))
    .map(r => (r?.system ? { ...r.system } : r)).filter(r => r?.produit?.equipement === k);
  const couts = recettes.map(r => valeurBiens(r.cout ?? {}, cours) / Math.max(1, n0(r.produit?.n) || 1)).filter(v => v > 0);
  if (couts.length) return { valeur: Math.max(REGLES_MARCHE.cours.minimum, arrondiPas(Math.min(...couts))), source: "recette" };
  return { valeur: null, source: "" };
}
// Un plan : sa valeur est celle du lot « plans » (valeurPlan dans plans.mjs : 3 + 0,2 × sa rareté courante, × 3 s'il est unique, en
// parts entières ; le jeu 3D disait 6 + 0,4 × rareté en valeurs du barème, une part = 2 : la même règle). Les plans restent un rabais
// (décision de Jordan du 17 novembre 2026) : leur valeur est ce qu'ils font économiser.

// ------------------------------------------------------------------ l'étal du groupe au marché forain (lot 10)
// Un étal : { id, marche (clé du marché forain), biens: { r: n } (ce qui reste à vendre), prix: { r: parts } (à l'unité ; le cours
// du jour par défaut), contre (le bien qu'on demande en paiement), caisse: { r: n } (les fractions restent), gardien (un nom, ou
// vide), vendus: { r: n }, vols, depuis }. Le groupe y pose des biens de ses stocks et relève la caisse quand il passe.
export function creerEtal({ id = "e1", marche = "", biens = {}, prix = {}, contre = "nourriture", gardien = "", jour = 0 } = {}) {
  return {
    id: String(id), marche: String(marche ?? ""), biens: biensPropres(biens),
    prix: Object.fromEntries(Object.entries(prix ?? {}).filter(([r, v]) => RESSOURCES_TROC.includes(r) && n0(v) > 0).map(([r, v]) => [r, n0(v)])),
    contre: RESSOURCES_TROC.includes(contre) ? contre : "nourriture", caisse: {}, gardien: String(gardien ?? ""), vendus: {}, vols: 0, depuis: Number(jour) || 0
  };
}
const prixEtal = (etal, r, cours) => n0(etal?.prix?.[r]) || n0(cours[r]) || 1;
// La chance qu'un passant prenne une unité à ce prix : la moitié au cours ; plus si c'est moins cher ; un quart à deux fois le cours.
export const chanceVenteEtal = (prix, cours) => Math.min(REGLES_MARCHE.etal.chanceMax, REGLES_MARCHE.etal.chance * (n0(cours) / Math.max(0.01, n0(prix))) ** 2);
// Un jour de marché à l'étal. -> { etal, vendus: { r: n }, recu: { r: n } (dans la caisse), vole: { r: n } }
export function journeeEtal(etal, { cours = coursDuJour(), hasard = Math.random } = {}) {
  const E = REGLES_MARCHE.etal;
  const e = { ...creerEtal(etal), ...structuredClone(etal ?? {}) };
  e.biens = biensPropres(e.biens); e.caisse = { ...(e.caisse ?? {}) }; e.vendus = { ...(e.vendus ?? {}) };
  const vendus = {}, recu = {}, vole = {};
  const contre = RESSOURCES_TROC.includes(e.contre) ? e.contre : "nourriture";
  for (let k = 0; k < E.ventes; k++) {
    const dispo = Object.keys(e.biens).filter(r => n0(e.biens[r]) > 0);
    if (!dispo.length) break;
    const r = dispo[Math.floor(hasard() * dispo.length) % dispo.length];
    const p = prixEtal(e, r, cours);
    if (!chance(chanceVenteEtal(p, cours[r]), hasard)) continue;
    e.biens[r] -= 1;
    vendus[r] = (vendus[r] ?? 0) + 1;
    const paye = Math.round(p / Math.max(REGLES_MARCHE.cours.minimum, n0(cours[contre]) || 1) * 100) / 100;
    e.caisse[contre] = Math.round((n0(e.caisse[contre]) + paye) * 100) / 100;
    recu[contre] = Math.round((n0(recu[contre]) + paye) * 100) / 100;
  }
  if (chance(e.gardien ? E.volGarde : E.vol, hasard)) {
    const [r, q] = Object.entries(e.biens).sort((a, b) => n0(b[1]) - n0(a[1]))[0] ?? [];
    if (r && n0(q) > 0) {
      const n = Math.max(1, Math.ceil(n0(q) * E.part));
      e.biens[r] -= n;
      vole[r] = n;
      e.vols = n0(e.vols) + 1;
    }
  }
  for (const [r, n] of Object.entries(vendus)) e.vendus[r] = n0(e.vendus[r]) + n;
  e.biens = biensPropres(e.biens);
  return { etal: e, vendus, recu, vole };
}
// Relever la caisse : les unités entières vont au groupe, les fractions restent dans la caisse. -> { etal, releve: { r: n } }
export function releverEtal(etal) {
  const e = structuredClone(etal ?? {});
  e.caisse = { ...(e.caisse ?? {}) };
  const releve = {};
  for (const [r, q] of Object.entries(e.caisse)) {
    const n = Math.floor(n0(q) + 1e-9);
    if (n > 0) { releve[r] = n; e.caisse[r] = Math.round((n0(q) - n) * 100) / 100; }
  }
  return { etal: e, releve };
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
// etals (lot 10) : les étals du groupe, chacun sur son marché forain.
export const marcheVide = () => ({ boutiques: [], marches: [], rumeurs: [], signe: "", prochain: 1, etals: [] });
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
// cours, hasard (lot 10) : pour les étals du groupe, les jours de leur marché (sans hasard, les étals attendent).
// -> { marche, secret, faits: [message public], marches: [cle] (jours de marché), bruit, reputation: { bastion: n }, soldes, etals }
export function journeeDuMarche({ marche, secret, jour = 0, dateDepart, fetes = [], debiteur = "groupe", cours = null, hasard = null } = {}) {
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
  // 5. Les étals du groupe (lot 10) : ils vendent les jours de leur marché, même quand le groupe n'y est pas.
  const etals = [];
  if (typeof hasard === "function") {
    const cr = cours ?? coursDuJour();
    m.etals = (m.etals ?? []).map(e => {
      if (!jours.includes(e.marche)) return e;
      const r = journeeEtal(e, { cours: cr, hasard });
      const nom = m.marches.find(x => x.cle === e.marche)?.nom ?? e.marche;
      if (Object.keys(r.vendus).length) faits.push(message("etal-vend", { marche: nom, vendus: r.vendus },
        `${nom} : l'étal du groupe a vendu ${Object.entries(r.vendus).map(([k, q]) => `${q} ${k}`).join(", ")}.`));
      if (Object.keys(r.vole).length) faits.push(message("etal-vole", { marche: nom, vole: r.vole },
        `${nom} : on s'est servi à l'étal du groupe (${Object.entries(r.vole).map(([k, q]) => `${q} ${k}`).join(", ")}).`));
      etals.push({ id: e.id, vendus: r.vendus, recu: r.recu, vole: r.vole });
      return r.etal;
    });
  }
  return { marche: m, secret: s, faits, marches: jours, bruit, reputation, soldes, etals };
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
