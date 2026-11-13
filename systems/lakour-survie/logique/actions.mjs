// Les actions du groupe sur le monde (contrat §1.4, §1.7, §2.4, §5) : explorer, fouiller, voyager, déménager, s'installer,
// assaut, rencontre et combat simple. Logique pure : chaque action rend un NOUVEAU monde (et de nouveaux renseignements), jamais
// l'entrée modifiée ; le hasard est fourni par l'appelant.
//
// Nombres retenus (REGLES_ACTIONS) :
// - Rencontre : chance = (base + 0,06 × infestation) × moment × prudence × phase, au plus 90 % ; base fouille 10 %,
//   exploration 12 %, route 6 % par région traversée ; moment matin 0,8, après-midi 1, soir 1,2, nuit 1,5 ; prudence discret
//   0,6, normal 1, rapide 1,4 ; jour zéro 0,5, panique 0,8, ensuite 1. Type tiré selon l'infestation (Livides), les factions
//   (humains), la phase (chiens errants dès la panique) et les dangers.
// - Fouille d'une région (pillage réel) : par membre et par quart, chaque ressource rend réserve × 0,8 % (discret), 1,5 %
//   (normal) ou 2,5 % (rapide), × 2,5 si on cherche une ressource précise ; au plus 4 / 6 / 9 unités par membre et par quart ;
//   bruit 0 / 1 / 3. Fouille des alentours (cueillette, gibier, pêche, bois) : ceil(rendement × membres × quarts × 0,5 ×
//   prudence 0,8 / 1 / 1,3) pris dans la nature de l'abri (bois → matériaux, le reste → nourriture). Elle ne compte pas comme
//   une fouille pour l'autonomie. Glanage de passage (équilibrage du 2026-11-05) : une fouille de la région (pillage) ramasse
//   aussi ceil(0,06 × membres × quarts × prudence × (cueillette + pêche + gibier par jour)) de nourriture dans la même nature
//   (celle de l'abri si c'est sa région, sinon celle de la région) : ce qui se renouvelle pour qui bouge.
// - Médicaments (2026-11-05) : une fouille de la région (pillage) a aussi 2,5 % de chances par membre et par quart (× 2,5 si
//   l'on cherche des médicaments, au plus 50 %) de tomber sur une TROUSSE DE SECOURS oubliée (boîte à gants, armoire de salle
//   de bains) : +1 médicament, qui ne vient pas des réserves de la région ; une région sans aucune réserve de médicaments au
//   jour zéro n'en a pas. Fouiller un site de type « hopital » : médicaments × 3.
// - Plantes médicinales, les « zerbaz » (2026-11-05) : cueillir des plantes (cible « plantes ») est une fouille des alentours
//   qui rend ceil(0,5 × membres × quarts × prudence) plantes, × 2 si un des cueilleurs connaît les zerbaz (savoir
//   REGLES_ACTIONS.plantes.savoir), prises dans la cueillette de la nature (une brassée = une unité) ; une cueillette ordinaire
//   (cible « cueillette ») rapporte en plus arrondiHasard(0,2 × membres × quarts, × 2 avec le savoir) plantes, sans entamer la
//   nature. Une tisane (recette du contenu) en fait des médicaments.
// - Voyage : le plus court en quarts sur les routes RÉELLES ; à pied quartsPied (× 1,5 si difficile) sauf par mer ; en véhicule
//   quartsVehicule (× 2 si difficile) sauf sentier et mer ; en bateau seulement par mer. Carburant : 1 unité (10 L) pour 60 km
//   en véhicule, pour 20 km en bateau. Charge : 3 unités par personne à pied, 20 par véhicule (ou bateau).
// - Véhicules et montures (§9, `equipement` de type "vehicule" ou "monture") : { charge, carburantParQuart, bruit, terrains,
//   rapide (motorisé : quartsVehicule), allure (sinon : quartsPied × allure, vélo 0,5, âne 0,8) }. Par mer : quartsVehicule
//   (× 2 si ce n'est pas un moteur). Carburant = ceil(quarts × carburantParQuart). Charge = charge × nombre de véhicules.
//   Le bruit du véhicule augmente les rencontres en route de 10 % par point.
// - Créatures (§9, contenu `creatures`) : { cle, nom, type: "livide" | "animal", des (d6 d'attaque chacun), resistance (succès
//   pour le mettre hors d'état), zones, phases, altitudeMin, altitudeMax, jourMax, poids }. Une rencontre de Livides tire un
//   type parmi ceux qui conviennent (région, phase, jour) ; sans bestiaire : 1 dé, 1 succès.
// - Assaut : défense (abri + meilleure vigilance de la garde, bonus d'outil et d'installation compris comme pour un test, au plus
//   +2 : vigilanceDeGarde) contre force (d6), succès 5–6 ; marge ≥ 0 repoussé (1 dégât si marge 0), −1 une installation
//   endommagée et une blessure, ≤ −2 brèche.
// - Combat : `resistance` succès mettent une créature hors d'état (les moins résistantes d'abord) ; chaque créature restante
//   lance ses `des` d6 : chaque 6 = touche (1 blessure) ; sur une touche de Livide, un d6 de morsure : 6 = morsure (les
//   animaux blessent sans mordre de Gris). Tirer : +2 de bruit par échange.
//
// Lot « savoirs » (docs/equilibre-savoirs.md, contrat §11) :
// - Fouilles « jardins » (les jardins des cases : nourriture, boutures, zerbaz ; savoirs.mjs, JARDINS_CASES) et « livres » (un
//   livre qui apprend un savoir-faire : LIVRES). Toutes deux comptent comme une fouille de la région (rencontres, autonomie).
// - Sur la route, les chiens abandonnés vont en meutes : rencontre « animaux » deux fois plus probable, 3 à 7 bêtes. Un sentier
//   est silencieux : rencontres × 0,7.
// - Véhicules : `source` (ce qu'ils brûlent : carburant, biocarburant pour un moteur modifié, materiaux pour un gazogène, energie
//   pour un véhicule électrique), `lenteur` (moteur modifié : quartsVehicule × lenteur), `pente` ({ descente, montee } : × allure
//   quand l'étape descend ou monte de 300 m ou plus : le vélo descend des Hauts sans bruit et remonte en poussant), `large`
//   (charrette : la route seulement, et les verrous l'arrêtent comme un véhicule).
// - Verrous de la route (savoirs.mjs, tirerVerrous) : seulement en véhicule ; leur temps s'ajoute au voyage, le carburant
//   siphonné aussi ; le MJ raconte les autres façons de passer.
import { NATURE, RESSOURCES_PILLABLES, CLES_PHASES, borner } from "./constantes.mjs";
import { JARDINS_CASES, jardinsDisponibles, chanceLivre, tirerSavoirDeLivre, tirerVerrous } from "./savoirs.mjs";
import { chance, tirerPoids, choisir, arrondiHasard, entier } from "./hasard.mjs";
import { regionDe, siteDe, factionDe, natureRegion, voisinsDe, regionsDe, reservesDepart, liste, indexer } from "./contenu.mjs";
import { lancer, compter, resoudreTest } from "./des.mjs";
import { observer } from "./renseignements.mjs";
import { exploiterNature, installationsDuSite, plafondsAbri } from "./abri.mjs";
import { normaliserStocks, ajouterStocks, plafonner } from "./ressources.mjs";
import { abandonnerAbri, reprendreAbri } from "./monde.mjs";
import { phaseDuJour, momentDe } from "./temps.mjs";
import { message, avecPreposition } from "./textes.mjs";

export const REGLES_ACTIONS = {
  rencontre: {
    base: { fouille: 0.10, exploration: 0.12, route: 0.06 }, parInfestation: 0.06, max: 0.9,
    moment: { matin: 0.8, "apres-midi": 1, soir: 1.2, nuit: 1.5 },
    prudence: { discret: 0.6, normal: 1, rapide: 1.4 },
    phase: { "jour-zero": 0.5, panique: 0.8, effondrement: 1, silence: 1, apres: 1 }
  },
  fouille: { fraction: { discret: 0.008, normal: 0.015, rapide: 0.025 }, cible: 2.5, plafond: { discret: 4, normal: 6, rapide: 9 }, bruit: { discret: 0, normal: 1, rapide: 3 },
    trousse: 0.015, trousseMax: 0.5, sites: { hopital: { medicaments: 3 } } },
  nature: { parMembre: 0.5, prudence: { discret: 0.8, normal: 1, rapide: 1.3 } },
  plantes: { parMembre: 0.5, cueillette: 0.2, savoir: "zerbaz", connaisseur: 2 },
  glanage: { parMembre: 0.06, prudence: { discret: 0.8, normal: 1, rapide: 1.3 }, nature: ["cueillette", "peche", "gibier"] },
  charge: { pied: 3, vehicule: 20, bateau: 20 },
  kmParCarburant: { vehicule: 60, bateau: 20 },
  lenteur: { pied: 1.5, vehicule: 2, bateau: 1.5 },
  bruitTir: 2,
  // Lot « savoirs ».
  meute: { poids: 2, nombre: [3, 7] }, sentier: 0.7, pente: 300
};

// ------------------------------------------------------------------ rencontres
// contexte : "fouille" | "exploration" | "route". -> null | { type, nombre, faction, attitude, danger, region, texte, cle, params }
// (texte en français, cle/params pour la traduction : textes.mjs ; `creature` des params est vide pour la créature par défaut,
// que la couche Foundry nomme d'après `creatureCle`).
export function tirerRencontre(monde, contenu, hasard, { region, jour = monde?.jour ?? 0, moment = "apres-midi", prudence = "normal", contexte = "fouille", bruit = 0, facteur = 1 } = {}) {
  const R = REGLES_ACTIONS.rencontre;
  const reg = monde?.regions?.[region];
  if (!reg) return null;
  const phase = phaseDuJour(jour);
  const inf = Number(reg.infestation) || 0;
  const p = Math.min(R.max, ((R.base[contexte] ?? R.base.fouille) + R.parInfestation * inf) * (R.moment[moment] ?? 1) * (R.prudence[prudence] ?? 1) * (R.phase[phase] ?? 1) * (1 + 0.1 * Math.max(0, Number(bruit) || 0))
    * Math.max(0, Number(facteur) || 0));
  if (!chance(p, hasard)) return null;
  const def = regionDe(contenu, region);
  const forceFactions = Object.values(reg.factions ?? {}).reduce((s, x) => s + x, 0);
  const humains = forceFactions + (Number(def?.population) || 0) * (CLES_PHASES.indexOf(phase) >= 3 ? 0.2 : 0.1);
  // Les meutes de chiens abandonnés tiennent les routes (lot « savoirs ») : deux fois plus de rencontres d'animaux sur la route.
  const meute = contexte === "route" && CLES_PHASES.indexOf(phase) >= 2;
  const type = tirerPoids([["livides", 0.2 + 2 * inf], ["humains", humains], ["animaux", CLES_PHASES.indexOf(phase) >= 1 ? 0.5 * (meute ? REGLES_ACTIONS.meute.poids : 1) : 0], ["danger", contexte === "route" ? 0.8 : 0.4]], hasard);
  const nom = def?.nom ?? region;
  if (type === "livides") {
    const nombre = Math.max(1, Math.round(inf * (0.5 + hasard())) + (prudence === "rapide" ? 1 : 0));
    const c = tirerCreature(contenu, hasard, { espece: "livide", region: def, jour, phase });
    return { type, nombre, region, creature: c.cle, des: c.des, resistance: c.resistance, texte: `${nombre} × ${c.nom ?? "Livide"} ${avecPreposition("à", nom)}.`,
      ...message("rencontre-livides", { nombre, creature: c.defaut ? "" : c.nom ?? "", creatureCle: c.cle, region: nom }) };
  }
  if (type === "humains") {
    const faction = tirerPoids(Object.entries(reg.factions ?? {}).map(([f, x]) => [f, x]), hasard) ?? null;
    const fdef = faction ? factionDe(contenu, faction) : null;
    const attitude = fdef?.attitude ?? choisir(["neutre", "mefiante"], hasard);
    const nombre = 1 + Math.floor((faction ? reg.factions[faction] : 1) * hasard() * 2);
    return { type, nombre, faction, attitude, region, texte: faction ? `${fdef?.nom ?? faction} : ${nombre} personne${nombre > 1 ? "s" : ""}.` : `Des survivants isolés (${nombre}).`,
      ...(faction ? message("rencontre-humains", { faction: fdef?.nom ?? faction, nombre }) : message("rencontre-isoles", { nombre })) };
  }
  if (type === "animaux") {
    const nombre = meute ? entier(REGLES_ACTIONS.meute.nombre[0], REGLES_ACTIONS.meute.nombre[1], hasard) : entier(2, 5, hasard);
    const c = tirerCreature(contenu, hasard, { espece: "animal", region: def, jour, phase });
    return { type, nombre, region, creature: c.cle, des: c.des, resistance: c.resistance, texte: `${nombre} × ${c.nom ?? "chien errant"}.`,
      ...message("rencontre-animaux", { nombre, creature: c.defaut ? "" : c.nom ?? "", creatureCle: c.cle }) };
  }
  // Les dangers de la région, nommés finement par le contenu (« eboulement-cilaos », « incendie-foret », « radier-submerge ») :
  // leur famille (éboulement, incendie, crue) ; une région sans danger de ces familles en tire un au hasard.
  const dangers = [...new Set((def?.dangers ?? []).map(familleDanger).filter(Boolean))];
  const danger = choisir(dangers.length ? dangers : ["eboulement", "incendie", "crue"], hasard);
  const textes = { crue: "un radier en crue", eboulement: "un éboulement", incendie: "un incendie" };
  return { type: "danger", nombre: 0, danger, region, texte: `Danger : ${textes[danger] ?? danger}.`, ...message(`rencontre-danger-${danger}`, { danger }) };
}

const familleDanger = d => (/^eboulement/.test(d) ? "eboulement" : /^incendie/.test(d) ? "incendie" : /^(crue|radier)/.test(d) ? "crue" : null);

// Les créatures sans bestiaire (`defaut` : la couche Foundry les nomme dans sa langue, LAKOUR_SURVIE.Creatures.<cle>).
export const CREATURE_DEFAUT = { livide: { cle: "livide", nom: "Livide", type: "livide", des: 1, resistance: 1, defaut: true },
  animal: { cle: "chien-errant", nom: "chien errant", type: "animal", des: 1, resistance: 1, defaut: true } };

const borneOk = (x, test) => x === undefined || x === null || test(Number(x));

// Les créatures du contenu qui conviennent (espèce, zone, altitude, phase, jour), tirées selon leur poids.
export function tirerCreature(contenu, hasard, { espece = "livide", region = null, jour = 0, phase = phaseDuJour(jour) } = {}) {
  const alt = Number(region?.altitude ?? 0);
  const possibles = liste(contenu?.creatures).filter(c => (c.type ?? "livide") === espece
    && (!c.zones?.length || c.zones.includes(region?.zone))
    && (!c.phases?.length || c.phases.includes(phase))
    && borneOk(c.altitudeMin, m => alt >= m) && borneOk(c.altitudeMax, m => alt <= m) && borneOk(c.jourMax, m => Number(jour) <= m));
  const c = tirerPoids(possibles.map(x => ({ ...x, poids: Number(x.poids ?? 1) })), hasard) ?? CREATURE_DEFAUT[espece];
  return { ...c, des: Math.max(1, Number(c.des) || 1), resistance: Math.max(1, Number(c.resistance) || 1) };
}

// ------------------------------------------------------------------ explorer
// -> { renseignement, renseignements, rencontre, faits, monde }
export function explorer(monde, contenu, hasard, { region, jour = monde?.jour ?? 0, moment = "apres-midi", prudence = "normal", renseignements = {} } = {}) {
  const rencontre = tirerRencontre(monde, contenu, hasard, { region, jour, moment, prudence, contexte: "exploration" });
  const nouveaux = observer(renseignements, monde, contenu, region, jour, "vu");
  const nom = regionDe(contenu, region)?.nom ?? region;
  return {
    renseignement: nouveaux[region] ?? null, renseignements: nouveaux, rencontre, monde,
    faits: [{ jour, region, cle: "exploration", public: true, texte: `Le groupe explore ${nom}.`, params: { region: nom } }]
  };
}

// ------------------------------------------------------------------ fouiller
// cible : une ressource (fouille ciblée), un élément de nature (cueillette, gibier, peche, bois : alentours de l'abri), ou
// « plantes » (les zerbaz des alentours). abri : system de l'abri (pour la nature des alentours, si la région est celle de
// l'abri). savoirs : ceux des fouilleurs (le savoir des zerbaz double les plantes cueillies).
// -> { butin, glane (nourriture glanée, comprise dans butin), trousse (médicament d'une trousse oubliée, compris dans butin),
//      rencontre, bruit, monde, abri, renseignements, faits, fouille: Boolean (compte pour l'autonomie) }
export const fouilleDesAlentours = cible => NATURE.includes(cible) || cible === "plantes";
export function fouiller(monde, contenu, hasard, { region, site = null, cible = null, membres = 1, quarts = 1, prudence = "normal", jour = monde?.jour ?? 0,
  moment = "apres-midi", abri = null, renseignements = {}, savoirs = [] } = {}) {
  const F = REGLES_ACTIONS.fouille;
  const P = REGLES_ACTIONS.plantes;
  const p = F.fraction[prudence] ? prudence : "normal";
  const n = Math.max(0, Number(membres) || 0) * Math.max(0, Number(quarts) || 0);
  const nom = regionDe(contenu, region)?.nom ?? region;
  const connaisseur = (savoirs ?? []).includes(P.savoir) ? P.connaisseur : 1;
  let nouveauMonde = structuredClone(monde);
  let nouvelAbri = abri ? structuredClone(abri) : null;
  const butin = {};
  let glane = 0, trousse = 0, livre = null;
  if ((cible === "jardins" || cible === "livres") && nouveauMonde.regions[region]) {
    // Lot « savoirs » : les jardins des cases (nourriture, boutures, zerbaz) ou un livre qui apprend un savoir-faire.
    const regMonde = nouveauMonde.regions[region];
    const def = regionDe(contenu, region);
    const s = site ? siteDe(contenu, site) : null;
    if (cible === "jardins") {
      const J = JARDINS_CASES;
      const bonus = s && J.sites.includes(s.type) ? J.bonusSite : 1;
      const demande = Math.min(jardinsDisponibles(def, regMonde, jour), Math.ceil(J.parMembre * n * REGLES_ACTIONS.nature.prudence[p] * bonus));
      if (demande > 0) {
        butin.nourriture = Math.ceil(demande * J.part.nourriture);
        butin.boutures = Math.ceil(demande * J.part.boutures);
        regMonde.jardinsPris = (Number(regMonde.jardinsPris) || 0) + demande;
        const plantes = arrondiHasard(J.plantes * n * connaisseur, hasard);
        if (plantes > 0) butin.plantes = plantes;
      }
    } else if (chance(chanceLivre({ region: def, regMonde, site: s, n }), hasard)) {
      livre = tirerSavoirDeLivre(contenu, hasard);
      if (livre) regMonde.livresTrouves = (Number(regMonde.livresTrouves) || 0) + 1;
    }
  } else if (fouilleDesAlentours(cible)) {
    // Les plantes poussent avec la cueillette : on les prend dans la même nature (une brassée = une unité).
    const element = cible === "plantes" ? "cueillette" : cible;
    const parJour = natureRegion(regionDe(contenu, region))[element].parJour;
    const demande = cible === "plantes"
      ? (parJour > 0 ? Math.ceil(P.parMembre * n * REGLES_ACTIONS.nature.prudence[p] * connaisseur) : 0)
      : Math.ceil(parJour * n * REGLES_ACTIONS.nature.parMembre * REGLES_ACTIONS.nature.prudence[p]);
    const surAbri = nouvelAbri && nouvelAbri.region === region && nouvelAbri.nature;
    const source = surAbri ? nouvelAbri.nature : nouveauMonde.regions[region]?.nature ?? {};
    const { nature, pris } = exploiterNature(source, element, demande);
    if (surAbri) nouvelAbri.nature = nature;
    else if (nouveauMonde.regions[region]) nouveauMonde.regions[region].nature = nature;
    if (pris) butin[cible === "plantes" ? "plantes" : cible === "bois" ? "materiaux" : "nourriture"] = pris;
    // Une cueillette ordinaire rapporte aussi quelques zerbaz (citronnelle, ayapana au bord du chemin), sans entamer la nature.
    if (cible === "cueillette" && pris > 0) {
      const plantes = arrondiHasard(P.cueillette * n * connaisseur, hasard);
      if (plantes > 0) butin.plantes = plantes;
    }
  } else if (nouveauMonde.regions[region]) {
    const pillage = nouveauMonde.regions[region].pillage;
    const res = cible && RESSOURCES_PILLABLES.includes(cible) ? [cible] : RESSOURCES_PILLABLES;
    const facteur = F.fraction[p] * n * (cible ? F.cible : 1);
    const parSite = (site ? F.sites[siteDe(contenu, site)?.type] : null) ?? {};
    for (const r of res) {
      const q = Number(pillage[r]) || 0;
      const pris = Math.min(q, arrondiHasard(q * facteur * (Number(parSite[r]) || 1), hasard));
      if (pris > 0) butin[r] = pris;
    }
    // Plafond de ce qu'on rapporte : on rend d'abord ce qu'il y a le plus.
    const plafond = F.plafond[p] * n;
    let total = Object.values(butin).reduce((s, x) => s + x, 0);
    while (total > plafond) {
      const [r] = Object.entries(butin).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0];
      butin[r] -= 1;
      if (!butin[r]) delete butin[r];
      total -= 1;
    }
    for (const [r, q] of Object.entries(butin)) pillage[r] = Math.max(0, pillage[r] - q);
    // Une trousse de secours oubliée (boîte à gants, armoire de salle de bains) : elle ne vient pas des réserves de la région,
    // que la population vide, mais une région sans aucun médicament au jour zéro (le volcan) n'en cache pas.
    const pT = Math.min(F.trousseMax, F.trousse * n * (cible === "medicaments" ? F.cible : 1));
    if (reservesDepart(regionDe(contenu, region)).medicaments > 0 && chance(pT, hasard)) {
      trousse = 1;
      butin.medicaments = (butin.medicaments ?? 0) + 1;
    }
    // Glanage de passage : en fouillant, on ramasse aussi ce que la nature offre (fruits, un poisson, un tangue), pris dans la
    // nature des alentours de l'abri (si c'est sa région) ou de la région. Ce qu'on glane ne revient qu'à la régénération de la
    // nature : une région où l'on n'a pas glané depuis longtemps est pleine, celle qu'on vient de vider ne rend presque plus rien.
    const G = REGLES_ACTIONS.glanage;
    const parJour = natureRegion(regionDe(contenu, region));
    const demande = Math.ceil(G.parMembre * n * G.prudence[p] * G.nature.reduce((s, k) => s + parJour[k].parJour, 0));
    const surAbri = nouvelAbri && nouvelAbri.region === region && nouvelAbri.nature;
    let source = surAbri ? nouvelAbri.nature : nouveauMonde.regions[region].nature ?? {};
    let reste = demande;
    for (const k of [...G.nature].sort((a, b) => (Number(source[b]) || 0) - (Number(source[a]) || 0) || G.nature.indexOf(a) - G.nature.indexOf(b))) {
      if (reste <= 0) break;
      const e = exploiterNature(source, k, reste);
      source = e.nature;
      reste -= e.pris;
      glane += e.pris;
    }
    if (surAbri) nouvelAbri.nature = source;
    else nouveauMonde.regions[region].nature = source;
    if (glane) butin.nourriture = (butin.nourriture ?? 0) + glane;
  }
  const rencontre = tirerRencontre(nouveauMonde, contenu, hasard, { region, jour, moment, prudence: p, contexte: "fouille" });
  const bruit = fouilleDesAlentours(cible) ? 0 : F.bruit[p];
  const lu = Object.entries(butin).map(([r, q]) => `${q} ${r}`).join(", ") || "rien";
  const nomSite = site ? siteDe(contenu, site)?.nom ?? site : "";
  const nomLivre = livre ? indexer(contenu).savoirs.get(livre)?.nom ?? livre : "";
  return {
    butin, glane, trousse, livre, rencontre, bruit, monde: nouveauMonde, abri: nouvelAbri,
    renseignements: observer(renseignements, nouveauMonde, contenu, region, jour, "vu"),
    fouille: !fouilleDesAlentours(cible),
    faits: [{ jour, region, cle: site ? "fouille" : "fouille-region", public: true, texte: `Fouille ${site ? `${avecPreposition("de", nomSite)} ` : ""}${avecPreposition("à", nom)} : ${lu}.`,
      params: { region: nom, site: nomSite, butin: { ...butin } } },
    ...(livre ? [{ jour, region, cle: "livre-trouve", public: true, texte: `Un livre trouvé : il peut apprendre ${nomLivre}.`, params: { savoir: nomLivre } }] : [])]
  };
}

// ------------------------------------------------------------------ chemins
const praticable = (v, transport) => {
  if (transport === "bateau") return v.terrain === "mer";
  if (v.terrain === "mer") return false;
  if (transport === "vehicule") return v.terrain !== "sentier" && v.quartsVehicule !== null && v.quartsVehicule !== undefined;
  return true;
};

export const estVehicule = e => Boolean(e && typeof e === "object" && Array.isArray(e.terrains));

// Durée d'une étape (quarts), selon l'état de la route ; Infinity si on ne passe pas.
// transport : "pied" | "vehicule" | "bateau", ou un véhicule (objet equipement : terrains, rapide, allure, lenteur, pente).
// denivele : altitude d'arrivée − altitude de départ (m) ; un véhicule à `pente` va plus vite en descente, plus lentement en montée.
export function dureeEtape(v, transport = "pied", etat = "ouverte", denivele = 0) {
  if (etat === "coupee") return Infinity;
  if (estVehicule(transport)) {
    const ve = transport;
    if (!ve.terrains.includes(v.terrain)) return Infinity;
    let base;
    const d = Number(denivele) || 0, seuil = REGLES_ACTIONS.pente;
    const pente = ve.pente ? (d <= -seuil ? Number(ve.pente.descente) || 1 : d >= seuil ? Number(ve.pente.montee) || 1 : 1) : 1;
    if (v.terrain === "mer") base = Number(v.quartsVehicule) * (ve.rapide ? 1 : 2);
    else if (ve.rapide) base = Math.ceil(Number(v.quartsVehicule) * (Number(ve.lenteur) || 1));
    else base = Math.ceil(Number(v.quartsPied) * (Number(ve.allure) || 1) * pente);
    if (!(base > 0)) return Infinity;
    return etat === "difficile" ? Math.ceil(base * (ve.rapide ? REGLES_ACTIONS.lenteur.vehicule : REGLES_ACTIONS.lenteur.pied)) : base;
  }
  if (!praticable(v, transport)) return Infinity;
  const base = transport === "pied" ? Number(v.quartsPied) : Number(v.quartsVehicule);
  if (!(base > 0)) return Infinity;
  return etat === "difficile" ? Math.ceil(base * REGLES_ACTIONS.lenteur[transport]) : base;
}

// Le plus court chemin (en quarts) de `de` à `vers`. etatRoute(a, b) -> "ouverte" | "difficile" | "coupee".
// -> null | { chemin: [region], etapes: [{ de, vers, quarts, km, etat, terrain }], quarts, km }
export function planifierChemin(contenu, de, vers, transport = "pied", etatRoute = () => "ouverte") {
  const regions = regionsDe(contenu).map(r => r.cle);
  if (!regions.includes(de) || !regions.includes(vers)) return null;
  const dist = new Map(regions.map(r => [r, Infinity])), prec = new Map(), faits = new Set();
  dist.set(de, 0);
  while (faits.size < regions.length) {
    let u = null;
    for (const r of regions) if (!faits.has(r) && (u === null || dist.get(r) < dist.get(u))) u = r;
    if (u === null || dist.get(u) === Infinity) break;
    faits.add(u);
    if (u === vers) break;
    for (const v of voisinsDe(contenu, u)) {
      const etat = etatRoute(u, v.region);
      const denivele = (Number(regionDe(contenu, v.region)?.altitude) || 0) - (Number(regionDe(contenu, u)?.altitude) || 0);
      const d = dureeEtape(v, transport, etat, denivele);
      if (d === Infinity) continue;
      if (dist.get(u) + d < dist.get(v.region)) { dist.set(v.region, dist.get(u) + d); prec.set(v.region, { de: u, v, etat, d }); }
    }
  }
  if (dist.get(vers) === Infinity) return null;
  const etapes = [];
  for (let r = vers; r !== de; r = prec.get(r).de) {
    const p = prec.get(r);
    etapes.unshift({ de: p.de, vers: r, quarts: p.d, km: Number(p.v.km) || 0, etat: p.etat, terrain: p.v.terrain });
  }
  return { chemin: [de, ...etapes.map(e => e.vers)], etapes, quarts: dist.get(vers), km: etapes.reduce((s, e) => s + e.km, 0) };
}

// Sur les routes RÉELLES du monde.
export const cheminReel = (monde, contenu, de, vers, transport) =>
  planifierChemin(contenu, de, vers, transport, (a, b) => monde?.regions?.[a]?.routes?.[b] ?? "ouverte");

// Sur les routes CONNUES (pour que l'IA planifie) : une route jamais vue est supposée ouverte et signalée incertaine.
export function cheminConnu(contenu, renseignements = {}, de, vers, transport = "pied") {
  const c = planifierChemin(contenu, de, vers, transport, (a, b) => renseignements?.[a]?.routes?.[b] ?? renseignements?.[b]?.routes?.[a] ?? "ouverte");
  if (!c) return null;
  const incertain = c.etapes.filter(e => !(renseignements?.[e.de]?.routes?.[e.vers] ?? renseignements?.[e.vers]?.routes?.[e.de])).map(e => `${e.de}→${e.vers}`);
  return { ...c, incertain };
}

// Carburant d'un trajet : selon les km (transport générique) ou les quarts (véhicule : carburantParQuart).
export function carburantPour(km, transport, quarts = 0) {
  if (estVehicule(transport)) return Math.ceil(Math.max(0, Number(quarts) || 0) * Math.max(0, Number(transport.carburantParQuart) || 0));
  return transport === "pied" ? 0 : Math.max(1, Math.ceil(Number(km) / REGLES_ACTIONS.kmParCarburant[transport]));
}
export function chargeMax({ transport = "pied", membres = 1, vehicules = 1 } = {}) {
  if (estVehicule(transport)) return Math.max(0, Number(transport.charge) || 0) * Math.max(1, vehicules);
  return transport === "pied" ? REGLES_ACTIONS.charge.pied * Math.max(0, membres) : REGLES_ACTIONS.charge[transport] * Math.max(1, vehicules);
}

// ------------------------------------------------------------------ voyager
// transport : "pied" | "vehicule" | "bateau" ou un véhicule du contenu ; vehicules : combien (charge).
// carburant : ce dont dispose le groupe (null = ne pas vérifier). quart : quart de départ (pour les moments des rencontres).
// -> { possible, raison, motif: { cle, params, texte } | null, chemin, etapes, quarts, km, carburant, bruit, rencontres, rencontre,
//      renseignements, faits, cheminConnu }
// reserves : { carburant, biocarburant, materiaux, energie } (lot « savoirs ») : ce que le groupe peut brûler ; le véhicule prend
// dans sa `source` (défaut : carburant). Le résultat dit `source` ; `verrous` (épaves, éboulis, tunnels, arbres : leur temps est
// compris dans `quarts`) et `siphonne` (carburant pris aux épaves).
export function voyager(monde, contenu, hasard, { de, vers, transport = "pied", membres = 1, vehicules = 1, charge = 0, quart = 0, jour = Math.floor(quart / 4),
  renseignements = {}, carburant = null, reserves = null } = {}) {
  const connu = cheminConnu(contenu, renseignements, de, vers, transport);
  const refus = (raison, cle, params = {}) => ({ possible: false, raison, motif: message(cle, params, raison), chemin: [], etapes: [], quarts: 0, km: 0, carburant: 0,
    rencontres: [], rencontre: null, renseignements, faits: [], cheminConnu: connu });
  if (de === vers) return refus("déjà sur place", "voyage-deja-sur-place");
  const max = chargeMax({ transport, membres, vehicules });
  if (Number(charge) > max) return refus(`trop chargé : ${charge} unités pour ${max} au plus`, "voyage-trop-charge", { charge, max });
  const c = cheminReel(monde, contenu, de, vers, transport);
  const nomTransport = estVehicule(transport) ? transport.nom ?? transport.cle : transport;
  if (!c) return transport === "pied" ? refus("aucune route praticable", "voyage-aucune-route") : refus(`aucune route praticable en ${nomTransport}`, "voyage-aucune-route-transport", { transport: nomTransport });
  const besoin = carburantPour(c.km, transport, c.quarts);
  const source = estVehicule(transport) ? transport.source || "carburant" : "carburant";
  const bruit = estVehicule(transport) ? Math.max(0, Number(transport.bruit) || 0) : transport === "pied" ? 0 : 2;
  const dispo = reserves && typeof reserves === "object" ? Number(reserves[source]) || 0 : source === "carburant" && carburant !== null ? Number(carburant) : null;
  if (dispo !== null && besoin > dispo) {
    return source === "carburant" ? refus(`il faut ${besoin} carburant (il y en a ${dispo})`, "voyage-carburant", { besoin, carburant: dispo })
      : refus(`il faut ${besoin} ${source} (il y en a ${dispo})`, "voyage-source", { besoin, source, dispo });
  }
  const rencontres = [];
  let r = renseignements, q = quart;
  for (const e of c.etapes) {
    // Un sentier est silencieux (lot « savoirs ») : moins de rencontres qu'une route.
    const x = tirerRencontre(monde, contenu, hasard, { region: e.vers, jour, moment: momentDe(q), contexte: "route", bruit, facteur: e.terrain === "sentier" ? REGLES_ACTIONS.sentier : 1 });
    if (x) rencontres.push({ ...x, etape: e });
    q += e.quarts;
    r = observer(r, monde, contenu, e.vers, jour, "vu");
  }
  // Les verrous de la route : seulement en véhicule (ou en charrette, trop large pour se faufiler).
  const roule = transport === "vehicule" || (estVehicule(transport) && (transport.rapide || transport.large) && !(transport.terrains ?? []).every(t => t === "mer"));
  const enCours = reg => (monde?.regions?.[reg]?.evenements ?? []).filter(x => Number(x.depuis) <= jour && (x.jusqua === null || x.jusqua === undefined || Number(x.jusqua) >= jour));
  const verrous = tirerVerrous(c.etapes, { vehicule: roule, jour, phase: phaseDuJour(jour), hasard, evenements: enCours });
  const retard = verrous.reduce((s, v) => s + v.quarts, 0), siphonne = verrous.reduce((s, v) => s + v.carburant, 0);
  const quarts = c.quarts + retard;
  const nom = cle => regionDe(contenu, cle)?.nom ?? cle;
  const chemin = c.chemin.map(nom).join(" → ");
  return {
    possible: true, raison: "", motif: null, chemin: c.chemin, etapes: c.etapes, quarts, km: c.km, carburant: besoin, source, bruit,
    rencontres, rencontre: rencontres[0] ?? null, renseignements: r, cheminConnu: connu, verrous, siphonne,
    faits: [{ jour, region: vers, cle: "voyage", public: true, texte: `Le groupe part ${avecPreposition("de", nom(de))} pour ${nom(vers)} (${chemin}, ${quarts} quart${quarts > 1 ? "s" : ""}).`,
      params: { de: nom(de), vers: nom(vers), chemin, quarts } },
    ...verrous.map(v => ({ jour, region: v.vers, cle: `verrou-${v.type}`, public: true, texte: `Sur la route ${avecPreposition("de", nom(v.vers))} : ${({ epave: "une épave en travers", eboulis: "un éboulis", tunnel: "un tunnel à une voie", arbre: "un arbre en travers" })[v.type]} (+${v.quarts} quart${v.quarts > 1 ? "s" : ""}).`,
      params: { region: nom(v.vers), quarts: v.quarts } }))]
  };
}

// ------------------------------------------------------------------ déménager, s'installer
// Ce qu'on emporte (borné par les stocks et la charge), l'abri quitté devient un abri abandonné (avec ses installations et ce
// qu'on laisse) ; la nature de la région garde la trace des alentours exploités (la plus basse des deux). -> { monde, emporte, laisse, capacite, abandonne }
export function demenager(monde, { abri, installations = [], emporter = {}, transport = "pied", membres = 1, vehicules = 1, jour = 0 } = {}) {
  const stocks = normaliserStocks(abri?.stocks);
  const capacite = chargeMax({ transport, membres, vehicules });
  const emporte = {};
  let place = capacite;
  for (const [r, q] of Object.entries(emporter ?? {})) {
    if (r === "energie" || !(r in stocks)) continue;
    const n = Math.max(0, Math.min(Math.floor(Number(q) || 0), stocks[r], place));
    if (n > 0) { emporte[r] = n; place -= n; }
  }
  const laisse = { ...stocks };
  for (const [r, q] of Object.entries(emporte)) laisse[r] -= q;
  laisse.energie = 0;
  let nouveau = abandonnerAbri(monde, abri?.region, { site: abri?.site, installations, jour });
  const a = nouveau.regions?.[abri?.region]?.abrisAbandonnes?.find(x => x.site === abri?.site);
  if (a) a.stocks = laisse;
  // Les alentours qu'on a vidés restent vidés : la nature de la région reprend celle de l'abri quand elle est plus basse (elle
  // se reconstitue ensuite lentement, comme partout). Sans cela, revenir dans une région rendait des alentours intacts.
  const reg = nouveau.regions?.[abri?.region];
  if (reg?.nature && abri?.nature) for (const k of NATURE) if (Number.isFinite(Number(abri.nature[k])) && k in reg.nature) reg.nature[k] = Math.min(reg.nature[k], Number(abri.nature[k]));
  return { monde: nouveau, emporte, laisse, capacite, abandonne: a ? structuredClone(a) : null };
}

// S'installer sur un site : un abri abandonné inoccupé se reprend (installations et stocks laissés) ; sinon on trouve les
// stocks du site, entamés comme la région (pillage réel), une seule fois (monde.regions[r].sitesVisites). Stocks trouvés et
// apport sont ramenés TOUT DE SUITE aux plafonds de l'abri (§1.6 : au-delà, l'excédent est perdu ; `perdus`).
// -> { ok, raison, motif: { cle, params, texte } | null, abri, installations, monde, repris, perdus: { ressource: n } }
export function installerAbri(monde, contenu, { site, jour = 0, quart = jour * 4, apport = {} } = {}) {
  const s = siteDe(contenu, site);
  const refus = (raison, cle, params = {}) => ({ ok: false, raison, motif: message(cle, params, raison), abri: null, installations: [], monde, repris: false, perdus: {} });
  if (!s) return refus("site inconnu", "site-inconnu");
  const region = s.region;
  const reg = monde?.regions?.[region];
  const deja = reg?.abrisAbandonnes?.find(a => a.site === site);
  if (deja?.occupe) { const faction = factionDe(contenu, deja.occupe)?.nom ?? deja.occupe; return refus(`occupé par ${faction}`, "site-occupe", { faction }); }
  let nouveau = structuredClone(monde);
  let stocks, installations, repris = false;
  if (deja) {
    const r = reprendreAbri(nouveau, region, site);
    nouveau = r.monde;
    stocks = ajouterStocks(r.abandonne?.stocks ?? {}, apport);
    installations = structuredClone(r.abandonne?.installations ?? []);
    repris = true;
  } else {
    const visites = nouveau.regions[region].sitesVisites ?? [];
    const initial = reservesDepart(regionDe(contenu, region));
    const trouve = {};
    if (!visites.includes(site)) {
      for (const [r, q] of Object.entries(s.stocks ?? {})) {
        const part = initial[r] > 0 ? Math.min(1, (Number(nouveau.regions[region].pillage[r]) || 0) / initial[r]) : 1;
        trouve[r] = Math.floor((Number(q) || 0) * part);
      }
    }
    nouveau.regions[region].sitesVisites = [...new Set([...visites, site])];
    stocks = ajouterStocks(trouve, apport);
    installations = installationsDuSite(s, contenu, jour);
  }
  const plafonne = plafonner(stocks, plafondsAbri(installations, contenu));
  const abri = {
    site, region, installeLe: quart, abandonneLe: null, stocks: plafonne.stocks,
    nature: { ...(nouveau.regions[region]?.nature ?? {}) }, sol: Number(s.sol) || 0, bruit: 0, degats: 0, notes: ""
  };
  return { ok: true, raison: "", motif: null, abri, installations, monde: nouveau, repris, perdus: plafonne.perdus };
}

// ------------------------------------------------------------------ assaut, combat (§1.7)
// -> { desDefense, desMenace, succesDefense, succesMenace, marge, issue: "repoussee" | "endommagee" | "breche", degats, blesses }
export function resoudreAssaut({ defense = 0, vigilance = 0, force = 1, hasard = Math.random } = {}) {
  const desDefense = lancer(borner(Math.round(Number(defense) + Number(vigilance)), 1, 15), hasard);
  const desMenace = lancer(borner(Math.round(Number(force)), 1, 15), hasard);
  const succesDefense = compter(desDefense), succesMenace = compter(desMenace);
  const marge = succesDefense - succesMenace;
  let issue = "repoussee", degats = 0, blesses = 0;
  if (marge === 0) degats = 1;
  else if (marge === -1) { issue = "endommagee"; degats = 1; blesses = 1; }
  else if (marge <= -2) { issue = "breche"; degats = 2; blesses = 1; }
  return { desDefense, desMenace, succesDefense, succesMenace, marge, issue, degats, blesses, installationEndommagee: issue !== "repoussee" };
}

// La vigilance de la garde dans un assaut (§1.7) : celle du meilleur garde, avec son bonus comme pour un test à l'abri (§1.1) :
// outil + installations (tour de guet, chiens de garde dressés : bilanAbri(...).bonus.vigilance), au plus +2, moins ses malus.
// Sans garde présent, 0 (la tour ne veille pas seule).
// gardes : [{ niveau, malus?, outil? }] ; installation : le bonus de vigilance des installations de l'abri.
export const BONUS_TEST_MAX = 2;
export function vigilanceDeGarde(gardes = [], { installation = 0 } = {}) {
  return Math.max(0, ...(gardes ?? []).map(g => (Number(g?.niveau) || 0) - (Number(g?.malus) || 0)
    + Math.min(BONUS_TEST_MAX, Math.max(0, Number(g?.outil) || 0) + Math.max(0, Number(installation) || 0))));
}

// Combat simple. competence : "combat" | "tir".
// adversaires : [{ nombre, des, resistance, type: "livide" | "animal", cle }] ; ou, en raccourci, livides (nombre) et creature
// ({ des, resistance, type }, défaut : Livide ordinaire 1 dé, 1 succès).
// -> { test, neutralises, restants, attaques, desMorsure, touches, morsures, blessures, bruit, detail: [{ cle, nombre, neutralises }] }
export function resoudreCombat({ niveau = 0, competence = "combat", livides = 1, creature = null, adversaires = null, bonus = 0, malus = 0, forcer = false, hasard = Math.random } = {}) {
  const groupes = (adversaires ?? [{ nombre: livides, ...(creature ?? CREATURE_DEFAUT.livide) }])
    .map(a => ({ cle: a.cle ?? "livide", type: a.type ?? "livide", nombre: Math.max(0, Number(a.nombre) || 0), des: Math.max(1, Number(a.des) || 1), resistance: Math.max(1, Number(a.resistance) || 1) }));
  const test = resoudreTest({ niveau, difficulte: "normale", bonus, malus, forcer, hasard });
  let succes = test.succes;
  const detail = groupes.map(g => ({ ...g, neutralises: 0 }));
  for (const g of [...detail].sort((x, y) => x.resistance - y.resistance)) {
    const n = Math.min(g.nombre, Math.floor(succes / g.resistance));
    g.neutralises = n;
    succes -= n * g.resistance;
  }
  const attaques = [], desMorsure = [];
  let touches = 0, morsures = 0;
  for (const g of detail) {
    const des = lancer((g.nombre - g.neutralises) * g.des, hasard);
    attaques.push(...des);
    const t = des.filter(d => d === 6).length;
    touches += t;
    if (g.type !== "animal") {
      const m = lancer(t, hasard);
      desMorsure.push(...m);
      morsures += m.filter(d => d === 6).length;
    }
  }
  return {
    test, neutralises: detail.reduce((t, g) => t + g.neutralises, 0), restants: detail.reduce((t, g) => t + g.nombre - g.neutralises, 0),
    attaques, desMorsure, touches, morsures, blessures: touches,
    bruit: competence === "tir" ? REGLES_ACTIONS.bruitTir : 0,
    detail: detail.map(({ cle, nombre, neutralises }) => ({ cle, nombre, neutralises }))
  };
}

// Lecture d'une région pour une rencontre décrite par le MJ (rencontre({ region, type })).
export function rencontreForcee(monde, contenu, hasard, { region, type = null, jour = monde?.jour ?? 0, moment = "apres-midi" } = {}) {
  for (let essai = 0; essai < 50; essai++) {
    const r = tirerRencontre(monde, contenu, hasard, { region, jour, moment, contexte: "fouille", prudence: "rapide" });
    if (r && (!type || r.type === type)) return r;
  }
  return type === "livides" ? { type, nombre: 1, region, texte: "Un Livide isolé.", ...message("rencontre-livide-isole") } : null;
}

