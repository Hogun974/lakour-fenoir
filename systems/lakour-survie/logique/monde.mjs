// Le monde réel, SECRET (contrat §2.3) : création et simulation d'un jour. Logique pure et déterministe : simulerJour ne lit
// que ses arguments, ne modifie pas le monde reçu et, pour un même générateur (hasardDuJour(graine, jour)), rend toujours le
// même monde et les mêmes faits.
//
// Nombres retenus (REGLES_MONDE) :
// - Infestation de départ : population × 0,1. Montée vers `population` : chaque jour + (population − infestation) × taux,
//   taux 0,05 au jour zéro, 0,15 en panique, 0,12 en effondrement, 0,03 en silence, 0 ensuite.
//   À partir de « apres » (jour 60) : −0,045 par jour dans les Bas (altitude < 400 m : la chaleur), −0,008 en altitude.
// - Hordes : naissent (5 % par jour) dans une région à infestation ≥ 4 dès l'effondrement (jour 7), taille 1 à 3 (au plus 5) ;
//   à partir de « apres », les Hauts (altitude ≥ 400 m) à infestation ≥ 2,5 en forment aussi (2 % par jour : les troupes lentes
//   des Livides anciens, conservés par le froid) ;
//   chaque jour, une horde qui a un cap y va si la route est toujours praticable, sinon elle se choisit un cap (60 %) parmi les
//   voisines à route ouverte ou difficile (difficile : poids ÷ 2), poids 1 + 2 × bruit de la région ; elle apporte
//   0,1 × taille d'infestation là où elle passe (jusqu'à sa propre densité) ; elle perd 1 de taille avec 3 % de chances par
//   jour (+5 % en saison des pluies, +8 % dans les Bas après le jour 60 : la chaleur).
// - Pillage par les autres : chaque ressource perd réserve × (max(population, 1,5) / 5) × taux de la phase (jour zéro 3 %,
//   panique 8 %, effondrement 5 %, silence 3,5 %, après 2 %) + 0,4 % par point de force de faction hostile, arrondi au hasard
//   (le plancher de population 1,5 : les réfugiés pillent aussi les cirques et les Hauts presque vides).
//   Les réserves ne reviennent jamais ; la nature se régénère (abri.mjs) et les autres y prennent 0,2 × rendement × pop/5.
// - Météo : en saison des pluies (et si l'arrivée y tombe aussi), un cyclone se forme avec 1 % de chances par jour : pré-alerte
//   2 jours avant, orange la veille, rouge le jour (routes coupées, cueillette ÷ 2, hordes −1), passé le lendemain, oublié
//   3 jours après. Fortes pluies : 2 % × climat.pluie par jour en saison des pluies (0,4 % en saison sèche), 1 à 3 jours :
//   les routes dont `coupure` contient l'événement sont coupées, les pistes et sentiers deviennent difficiles. Éruption :
//   0,3 % par jour s'il existe une région à danger « eruption », 5 à 20 jours.
// - Événements du contenu : 25 % de chances par jour d'en tirer un (phase, saison, zone, poids) et d'appliquer ses effets
//   simples ({ infestation, pillage, route, duree, horde, faction, force, nature }). Les événements « meteo » du contenu en sont
//   (éboulements de la route du Littoral, de Cilaos, de Salazie, radiers, houle, incendie de forêt, brouillard…), sauf ceux que
//   la simulation tire elle-même (EVENEMENTS_SIMULES : cyclone, fortes pluies, crue, éruption). Un événement que des régions
//   ont dans leurs `dangers` n'arrive que dans l'une d'elles ; les autres, dans une région de leurs `zones`. Un événement de
//   type « abri » arrive à l'abri du groupe (`contexte.abri.region`) ; sans abri, il n'est pas tiré. Tout événement qui tombe
//   dans la région de l'abri du groupe et porte des `effets.abri` les joint à son fait (`effetsAbri`) : avancer (etat.mjs) en
//   applique les effets simples à l'abri et rend le reste au MJ (abri.mjs, subirEvenementAbri).
// - Factions : croissance (contenu, défaut 0,01/jour) × 1,5 pendant panique et effondrement, si la région n'est pas vide ;
//   −0,01/jour sinon. Une faction de force ≥ 2 essaime vers une voisine ouverte avec 1 % × force par jour (+0,5 là-bas,
//   −0,3 chez elle). Un abri abandonné est occupé par la plus forte faction (force ≥ 1) avec 4 % par jour ; inoccupé, chacune
//   de ses installations s'abîme de 1 avec 2 % par jour. Une faction qui n'est plus dans la région (force < 0,5 : partie,
//   affaiblie, éteinte) libère les abris qu'elle occupait, et emporte ce qu'il y restait : ils redeviennent des abris abandonnés
//   qu'on peut reprendre (sans quoi, sur la durée, l'île se remplit d'abris « occupés » par des factions disparues).
// - Menaces contre l'abri (§1.7), au plus 2 par jour : horde présente (8 % + 4 %/bruit + 2 %/visibilité, force 2 × taille + 1),
//   Livides errants (infestation × 2 % × (1 + bruit/10) + 1 %/visibilité, force = infestation arrondie), bande hostile
//   (0,4 % × force × (1 + visibilité), méfiante ÷ 2, force ceil(1,5 × force) + 1), visite d'une faction neutre ou amicale,
//   chiens errants (2 %, force 2), accident (1 %). (Équilibrage du 2026-11-04, docs/survie-equilibrage.md : avant, 30 %, 4 % et
//   1 % donnaient huit assauts par mois à un abri enraciné.)
// - Faits : `public` selon ce que le groupe perçoit d'où il est (région courante ; fumée et convois des voisines ; nouvelles
//   par la radio, ou par le téléphone tant qu'il marche dans sa région ; ce que toute l'île voit).
// - Textes (textes.mjs) : chaque fait, menace et entrée du journal secret porte `texte` (français, repli) et `cle`/`params` pour
//   la traduction ; le fait d'un événement du contenu garde `cle` = clé de l'événement et met sa clé de texte dans `cleTexte`.
import { CLES_PHASES, ALTITUDE_BAS, NATURE, RESEAUX, JOURNAL_SECRET_MAX, borner, DATE_DEPART } from "./constantes.mjs";
import { creerHasard, deriverHasard, entier, chance, tirerPoids, arrondiHasard, choisir } from "./hasard.mjs";
import { regionsDe, regionDe, factionDe, siteDe, indexer, natureRegion, reservesDepart, sontVoisines } from "./contenu.mjs";
import { cleTexteDe } from "./textes.mjs";
import { natureInitiale, regenererNature } from "./abri.mjs";
import { phaseDuJour, saisonDuJour, dateDuJour } from "./temps.mjs";
import { partPillage, reseauxActifs } from "./renseignements.mjs";

export const REGLES_MONDE = {
  infestationDepart: 0.1,
  montee: { "jour-zero": 0.05, panique: 0.15, effondrement: 0.12, silence: 0.03, apres: 0 },
  decroissanceBas: 0.045,
  decroissanceHauts: 0.008,
  horde: { naissance: 0.05, seuil: 4, jourMin: 7, seuilHauts: 2.5, naissanceHauts: 0.02, mouvement: 0.6, apport: 0.1, dispersion: 0.03, dispersionPluies: 0.05, dispersionChaleur: 0.08 },
  pillage: { "jour-zero": 0.03, panique: 0.08, effondrement: 0.05, silence: 0.035, apres: 0.02 },
  pillageFaction: 0.004,
  pillagePopMin: 1.5,
  natureAutres: 0.2,
  cyclone: { chance: 0.01, forces: [[1, 50], [2, 35], [3, 15]] },
  fortesPluies: { pluies: 0.02, seche: 0.004 },
  eruption: 0.003,
  evenementContenu: 0.25,
  faction: { croissance: 0.01, essaimage: 0.01, occupation: 0.04, degradation: 0.02, presence: 0.5 },
  menace: { horde: 0.08, hordeBruit: 0.04, hordeVisibilite: 0.02, livides: 0.02, bande: 0.004 },
  menacesMax: 2
};

// Les événements météo que la simulation tire elle-même (étapes 3 à 5) : ceux du contenu qui portent ces clés n'en donnent que
// le nom, le texte et les effets décrits pour le MJ.
export const EVENEMENTS_SIMULES = ["cyclone", "fortes-pluies", "crue", "eboulement", "eruption"];

const NOMS_CYCLONES = ["Anvalé", "Bérésio", "Calindra", "Dorvane", "Elzéa", "Firmane", "Galoya", "Hédrina", "Isaval", "Jorancé", "Kalinda", "Loréo"];
const PIRE = { ouverte: 0, difficile: 1, coupee: 2 };
const sansBalises = t => String(t ?? "").replace(/<[^>]+>/g, "").trim();

// ------------------------------------------------------------------ création
// options : { dateDepart, eruption: { debut, fin } | null }
export function creerMonde(contenu, graine = "fenoir", options = {}) {
  const h = deriverHasard(graine, "creation");
  const monde = {
    graine: String(graine), jour: 0, dateDepart: options.dateDepart ?? DATE_DEPART,
    coupures: {}, regions: {}, hordes: [], cyclone: null, eruption: null, journalSecret: [], compteur: 0, cyclones: 0
  };
  for (const r of regionsDe(contenu)) {
    const c = {};
    for (const res of RESEAUX) {
      const f = r.infrastructures?.[res];
      c[res] = Array.isArray(f) ? entier(Number(f[0]), Number(f[1]), h) : null;
    }
    monde.coupures[r.cle] = c;
    const factions = {};
    for (const f of r.factionsDepart ?? []) factions[f.faction] = borner(Number(f.force) || 0, 0, 5);
    monde.regions[r.cle] = {
      infestation: borner(Number(r.population || 0) * REGLES_MONDE.infestationDepart, 0, 5),
      pillage: reservesDepart(r),
      nature: natureInitiale(r),
      factions,
      routes: Object.fromEntries((r.voisins ?? []).map(v => [v.region, "ouverte"])),
      evenements: [],
      abrisAbandonnes: []
    };
  }
  if (options.eruption) monde.eruption = { debut: options.eruption.debut, fin: options.eruption.fin, regions: regionsAEruption(contenu) };
  return monde;
}

const regionsAEruption = contenu => regionsDe(contenu).filter(r => (r.dangers ?? []).includes("eruption")).map(r => r.cle);

// ------------------------------------------------------------------ perception
// contexte : { region (où est le groupe), radio, bruitParRegion, abri: { region, visibilite, bruit, defense } }
function perceptible(fait, monde, contenu, contexte) {
  const ici = contexte?.region;
  if (!ici) return false;
  if (fait.portee === "ile") return true;
  if (fait.region === ici) return true;
  if (fait.portee === "region") return false;
  const voisine = sontVoisines(contenu, ici, fait.region);
  if (fait.portee === "voisins") return voisine;
  // "radio" : les nouvelles circulent (radio du groupe, ou téléphone encore là dans sa région).
  return voisine || Boolean(contexte.radio) || reseauxActifs(monde, ici, fait.jour).telephone;
}

// ------------------------------------------------------------------ routes
function routesDesEvenements(monde) {
  for (const reg of Object.values(monde.regions)) for (const v of Object.keys(reg.routes)) reg.routes[v] = "ouverte";
  const poser = (a, b, etat) => {
    for (const [x, y] of [[a, b], [b, a]]) {
      const r = monde.regions[x];
      if (!r || !(y in r.routes)) continue;
      if (PIRE[etat] > PIRE[r.routes[y]]) r.routes[y] = etat;
    }
  };
  for (const [cle, reg] of Object.entries(monde.regions)) {
    for (const e of reg.evenements) for (const [v, etat] of Object.entries(e.routes ?? {})) poser(cle, v, etat);
  }
}

// Les routes qu'un événement abîme dans une région : coupées si `coupure` le nomme (ou nomme fortes-pluies pour la pluie),
// difficiles pour les pistes et sentiers.
function routesTouchees(region, cleEvenement, { pistes = true } = {}) {
  const routes = {};
  for (const v of region?.voisins ?? []) {
    const coupure = v.coupure ?? [];
    if (coupure.includes(cleEvenement) || (cleEvenement !== "eruption" && coupure.includes("fortes-pluies") && ["crue", "eboulement", "fortes-pluies", "cyclone"].includes(cleEvenement))) routes[v.region] = "coupee";
    else if (pistes && (v.terrain === "piste" || v.terrain === "sentier")) routes[v.region] = "difficile";
  }
  return routes;
}

// ------------------------------------------------------------------ un jour
// -> { monde, faits: [{ jour, region, cle, public, texte, params, portee, cleTexte? }], menaces: [{ type, force, faction, texte, cle, params }] }
export function simulerJour(mondeEntree, contenu, hasard, jour, contexte = {}) {
  const h = hasard ?? creerHasard(`${mondeEntree?.graine}|jour|${jour}`);
  // Compatibilité avec la signature du contrat (bruitParRegion en 5e argument).
  const ctx = contexte && !("bruitParRegion" in contexte) && !("region" in contexte) && !("abri" in contexte) && !("radio" in contexte)
    ? { bruitParRegion: contexte } : (contexte ?? {});
  const monde = structuredClone(mondeEntree);
  const R = REGLES_MONDE;
  const dateDepart = monde.dateDepart ?? DATE_DEPART;
  const phase = phaseDuJour(jour);
  const saison = saisonDuJour(jour, dateDepart);
  const mois = dateDuJour(jour, dateDepart).mois;
  const bruit = ctx.bruitParRegion ?? {};
  const regions = regionsDe(contenu).filter(r => monde.regions[r.cle]);
  const faits = [];
  // fait(region, cle, texte, portee, extra, params) : `params` nourrit la traduction de `cle` (ou de extra.cleTexte).
  const fait = (region, cle, texte, portee = "region", extra = {}, params = {}) => faits.push({ jour, region, cle, public: false, texte, params, portee, ...extra });
  const nomRegion = cle => regionDe(contenu, cle)?.nom ?? cle;
  const nouvelId = prefixe => `${prefixe}${++monde.compteur}`;

  // 1. Réseaux qui tombent aujourd'hui.
  for (const r of regions) for (const res of RESEAUX) {
    if (monde.coupures[r.cle]?.[res] === jour) {
      const textes = { electricite: "l'électricité est coupée", eau: "l'eau ne coule plus au robinet", carburant: "plus une goutte de carburant à la pompe", telephone: "le téléphone ne passe plus" };
      fait(r.cle, `reseau-${res}`, `${nomRegion(r.cle)} : ${textes[res]}.`, "radio", {}, { region: nomRegion(r.cle) });
    }
  }

  // 2. Événements expirés.
  for (const r of regions) monde.regions[r.cle].evenements = monde.regions[r.cle].evenements.filter(e => e.jusqua === null || e.jusqua === undefined || e.jusqua >= jour);

  // 3. Météo : cyclone.
  const c = monde.cyclone;
  if (c) {
    if (jour === c.arrivee - 1) { c.alerte = "orange"; fait(c.trajectoire[0], "cyclone-orange", `Alerte orange : le cyclone ${c.nom} arrive demain.`, "radio", {}, { cyclone: c.nom }); }
    else if (jour === c.arrivee) {
      c.alerte = "rouge";
      fait(c.trajectoire[0], "cyclone-rouge", `Alerte rouge : le cyclone ${c.nom} frappe l'île.`, "ile", { force: c.force, trajectoire: [...c.trajectoire] }, { cyclone: c.nom });
      for (const cle of c.trajectoire) {
        const reg = monde.regions[cle];
        const routes = {};
        for (const [v, etat] of Object.entries(routesTouchees(regionDe(contenu, cle), "cyclone"))) if (etat === "coupee" || h() < 0.3 * c.force) routes[v] = etat === "coupee" ? "coupee" : "difficile";
        reg.evenements.push({ cle: "cyclone", depuis: jour, jusqua: jour + c.force, routes });
        reg.nature.cueillette = Math.round(reg.nature.cueillette * 50) / 100;
        for (const ho of monde.hordes) if (ho.region === cle) ho.taille -= 1;
      }
    } else if (jour === c.arrivee + 1) { c.alerte = "passe"; fait(c.trajectoire[0], "cyclone-passe", `Le cyclone ${c.nom} s'éloigne.`, "radio", {}, { cyclone: c.nom }); }
    else if (jour >= c.arrivee + 3) monde.cyclone = null;
  } else if (saison === "pluies" && saisonDuJour(jour + 2, dateDepart) === "pluies" && chance(R.cyclone.chance, h) && regions.length) {
    const force = tirerPoids(R.cyclone.forces, h);
    let trajectoire = regions.filter(() => h() < 0.4 + 0.2 * force).map(r => r.cle);
    if (!trajectoire.length) trajectoire = [choisir(regions, h).cle];
    const nom = NOMS_CYCLONES[(monde.cyclones ?? 0) % NOMS_CYCLONES.length];
    monde.cyclones = (monde.cyclones ?? 0) + 1;
    monde.cyclone = { nom, alerte: "pre-alerte", arrivee: jour + 2, force, trajectoire };
    fait(trajectoire[0], "cyclone-pre-alerte", `Pré-alerte cyclonique : ${monde.cyclone.nom} approche, arrivée dans deux jours.`, "radio", { force }, { cyclone: nom });
  }

  // 4. Fortes pluies.
  for (const r of regions) {
    const p = R.fortesPluies[saison] * Number(r.climat?.pluie ?? 0);
    if (!(p > 0) || !chance(p, h)) continue;
    const possibles = (r.dangers ?? []).filter(d => d === "crue" || d === "eboulement");
    const cle = possibles.length ? choisir(possibles, h) : "fortes-pluies";
    const duree = entier(1, 3, h);
    monde.regions[r.cle].evenements.push({ cle, depuis: jour, jusqua: jour + duree - 1, routes: routesTouchees(r, cle) });
    fait(r.cle, cle, `${nomRegion(r.cle)} : fortes pluies, ${cle === "eboulement" ? "éboulements sur la route" : cle === "crue" ? "radiers submergés" : "routes noyées"}.`, "voisins", {}, { region: nomRegion(r.cle) });
  }

  // 5. Éruption.
  const zonesEruption = regionsAEruption(contenu);
  if (!monde.eruption && zonesEruption.length && chance(R.eruption, h)) {
    monde.eruption = { debut: jour, fin: jour + entier(5, 20, h), regions: zonesEruption };
  }
  if (monde.eruption) {
    const e = monde.eruption;
    if (jour === e.debut) {
      for (const cle of e.regions) monde.regions[cle]?.evenements.push({ cle: "eruption", depuis: jour, jusqua: e.fin, routes: routesTouchees(regionDe(contenu, cle), "eruption", { pistes: false }) });
      fait(e.regions[0], "eruption", "Le volcan se réveille : une lueur rouge dans la nuit.", "ile");
    }
    if (jour > e.fin) { fait(e.regions[0], "eruption-fin", "L'éruption s'est calmée.", "radio"); monde.eruption = null; }
  }

  // 6. Un événement du contenu. Un événement « abri » arrive à l'abri du groupe (sa région) : sans abri (ou hors de ses zones),
  // il n'est pas tiré.
  const regionAbriGroupe = ctx.abri?.region ? regions.find(r => r.cle === ctx.abri.region) ?? null : null;
  const dansZones = (e, r) => !e?.zones?.length || e.zones.includes(r.zone);
  const evenements = [...indexer(contenu).evenements.values()].filter(e => e.type !== "fete" && !(e.type === "meteo" && EVENEMENTS_SIMULES.includes(e.cle))
    && (e.type !== "abri" || (regionAbriGroupe && dansZones(e, regionAbriGroupe)))
    && (!e.phases?.length || e.phases.includes(phase)) && (!e.saisons?.length || e.saisons.includes(saison)));
  if (evenements.length && chance(R.evenementContenu, h)) {
    const e = tirerPoids(evenements.map(x => ({ ...x, poids: Number(x.poids ?? 1) })), h);
    const propres = e ? regions.filter(r => (r.dangers ?? []).includes(e.cle)) : [];
    const lieux = e?.type === "abri" ? [regionAbriGroupe] : propres.length ? propres : regions.filter(r => dansZones(e, r));
    const r = lieux.length ? choisir(lieux, h) : null;
    if (e && r) appliquerEvenement(monde, contenu, e, r, jour, h, fait, nouvelId, regionAbriGroupe?.cle ?? null);
  }

  // 7. Routes d'après les événements en cours.
  routesDesEvenements(monde);

  // 8. Infestation.
  for (const r of regions) {
    const reg = monde.regions[r.cle];
    const pop = Number(r.population) || 0;
    if (phase === "apres") reg.infestation -= Number(r.altitude) < ALTITUDE_BAS ? R.decroissanceBas : R.decroissanceHauts;
    else if (reg.infestation < pop) reg.infestation += (pop - reg.infestation) * R.montee[phase];
    reg.infestation = borner(reg.infestation, 0, 5);
  }

  // 9. Hordes : naissance, marche, apport, dispersion.
  if (jour >= R.horde.jourMin) {
    for (const r of regions) {
      const reg = monde.regions[r.cle];
      const hauts = phase === "apres" && Number(r.altitude) >= ALTITUDE_BAS;
      const nait = reg.infestation >= R.horde.seuil ? chance(R.horde.naissance, h) : hauts && reg.infestation >= R.horde.seuilHauts && chance(R.horde.naissanceHauts, h);
      if (nait) {
        const horde = { id: nouvelId("h"), region: r.cle, taille: entier(1, 3, h), cap: null, depuis: jour };
        monde.hordes.push(horde);
        fait(r.cle, "horde-nait", `Une horde se forme à ${nomRegion(r.cle)} (taille ${horde.taille}).`, "voisins", { horde: horde.id }, { region: nomRegion(r.cle), taille: horde.taille });
      }
    }
  }
  for (const ho of monde.hordes) {
    if (ho.taille <= 0) continue;
    const routes = monde.regions[ho.region]?.routes ?? {};
    if (ho.cap && routes[ho.cap] && routes[ho.cap] !== "coupee") {
      const de = ho.region;
      ho.region = ho.cap;
      ho.cap = null;
      fait(ho.region, "horde-arrive", `Une horde venue de ${nomRegion(de)} entre à ${nomRegion(ho.region)}.`, "voisins", { horde: ho.id, de }, { de: nomRegion(de), region: nomRegion(ho.region) });
    } else {
      ho.cap = null;
      if (chance(R.horde.mouvement, h)) {
        const options = Object.entries(routes).filter(([, etat]) => etat !== "coupee")
          .map(([v, etat]) => ({ v, poids: (1 + 2 * (Number(bruit[v]) || 0)) / (etat === "difficile" ? 2 : 1) }));
        const choix = tirerPoids(options, h);
        if (choix) {
          ho.cap = choix.v;
          fait(choix.v, "horde-approche", `Une horde quitte ${nomRegion(ho.region)} vers ${nomRegion(choix.v)}.`, "voisins", { horde: ho.id, de: ho.region }, { de: nomRegion(ho.region), vers: nomRegion(choix.v) });
        }
      }
    }
    const reg = monde.regions[ho.region];
    if (reg && reg.infestation < ho.taille) reg.infestation = borner(Math.min(ho.taille, reg.infestation + R.horde.apport * ho.taille), 0, 5);
    const r = regionDe(contenu, ho.region);
    let p = R.horde.dispersion;
    if (saison === "pluies") p += R.horde.dispersionPluies;
    if (phase === "apres" && Number(r?.altitude) < ALTITUDE_BAS) p += R.horde.dispersionChaleur;
    if (chance(p, h)) ho.taille -= 1;
  }
  for (const ho of monde.hordes) if (ho.taille <= 0) fait(ho.region, "horde-dispersee", `La horde de ${nomRegion(ho.region)} se disperse.`, "region", { horde: ho.id }, { region: nomRegion(ho.region) });
  monde.hordes = monde.hordes.filter(ho => ho.taille > 0).map(ho => ({ ...ho, taille: Math.min(5, ho.taille) }));

  // 10. Pillage par les autres, nature.
  for (const r of regions) {
    const reg = monde.regions[r.cle];
    const pop = Number(r.population) || 0;
    const hostiles = Object.entries(reg.factions).filter(([f]) => factionDe(contenu, f)?.attitude === "hostile").reduce((s, [, x]) => s + x, 0);
    // Les réfugiés montent partout : une région presque vide est pillée comme si elle avait `pillagePopMin` de population.
    const f = (Math.max(pop, R.pillagePopMin) / 5) * R.pillage[phase] + hostiles * R.pillageFaction;
    for (const res of Object.keys(reg.pillage)) {
      const q = reg.pillage[res];
      if (q > 0) reg.pillage[res] = Math.max(0, q - Math.min(q, arrondiHasard(q * f, h)));
    }
    reg.nature = regenererNature(reg.nature, r, { saison, mois });
    const n = natureRegion(r);
    for (const k of NATURE) reg.nature[k] = Math.max(0, Math.round((reg.nature[k] - n[k].parJour * R.natureAutres * (pop / 5)) * 100) / 100);
  }

  // 11. Factions, abris abandonnés.
  for (const r of regions) {
    const reg = monde.regions[r.cle];
    const vide = partPillage(reg.pillage, reservesDepart(r)) < 0.1;
    for (const f of Object.keys(reg.factions)) {
      const def = factionDe(contenu, f);
      const croissance = Number(def?.croissance ?? R.faction.croissance) || 0;
      const facteur = phase === "panique" || phase === "effondrement" ? 1.5 : 1;
      reg.factions[f] = borner(reg.factions[f] + (vide ? -0.01 : croissance * facteur), 0, 5);
      if (reg.factions[f] >= 2 && chance(R.faction.essaimage * reg.factions[f], h)) {
        const ouvertes = Object.entries(reg.routes).filter(([, e]) => e === "ouverte").map(([v]) => v);
        const v = choisir(ouvertes, h);
        if (v && monde.regions[v]) {
          monde.regions[v].factions[f] = borner((monde.regions[v].factions[f] ?? 0) + 0.5, 0, 5);
          reg.factions[f] = borner(reg.factions[f] - 0.3, 0, 5);
          fait(v, "faction-arrive", `Un convoi de ${def?.nom ?? f} arrive à ${nomRegion(v)}.`, "voisins", { faction: f }, { faction: def?.nom ?? f, region: nomRegion(v) });
        }
      }
    }
    for (const f of Object.keys(reg.factions)) if (reg.factions[f] < 0.05) delete reg.factions[f];
    for (const a of reg.abrisAbandonnes) {
      if (a.occupe && !((reg.factions[a.occupe] ?? 0) >= R.faction.presence)) { a.occupe = null; a.libereLe = jour; a.stocks = {}; continue; }
      if (a.occupe) continue;
      const forte = Object.entries(reg.factions).filter(([, x]) => x >= 1).sort((x, y) => y[1] - x[1])[0];
      if (forte && chance(R.faction.occupation, h)) {
        a.occupe = forte[0];
        const nomFaction = factionDe(contenu, forte[0])?.nom ?? forte[0], nomSite = siteDe(contenu, a.site)?.nom ?? a.site;
        fait(r.cle, "abri-occupe", `${nomFaction} s'installe dans un abri abandonné (${nomSite}).`, "region", { site: a.site, faction: forte[0] }, { faction: nomFaction, site: nomSite });
        continue;
      }
      a.installations = (a.installations ?? []).map(i => (chance(R.faction.degradation, h) ? { ...i, etat: Math.min(3, (Number(i.etat) || 0) + 1) } : i));
    }
  }

  // 12. Menaces contre l'abri du groupe.
  const regionAbri = ctx.abri?.region ?? ctx.region;
  const menaces = regionAbri && ctx.abri ? tirerMenaces(monde, contenu, h, { jour, phase, ...ctx.abri, region: regionAbri }) : [];

  // 13. Publicité des faits, journal secret.
  for (const f of faits) f.public = perceptible(f, monde, contenu, ctx);
  for (const f of faits) if (!f.public) monde.journalSecret.push({ jour, texte: f.texte, cle: cleTexteDe(f), params: f.params ?? {} });
  if (monde.journalSecret.length > JOURNAL_SECRET_MAX) monde.journalSecret = monde.journalSecret.slice(-JOURNAL_SECRET_MAX);
  monde.jour = jour;
  return { monde, faits, menaces };
}

function appliquerEvenement(monde, contenu, e, r, jour, h, fait, nouvelId, regionAbri = null) {
  const reg = monde.regions[r.cle];
  const eff = e.effets ?? {};
  const duree = Number(eff.duree) > 0 ? Number(eff.duree) : entier(1, 3, h);
  if (Number.isFinite(Number(eff.infestation)) && eff.infestation !== undefined) reg.infestation = borner(reg.infestation + Number(eff.infestation), 0, 5);
  if (typeof eff.pillage === "number") {
    for (const res of Object.keys(reg.pillage)) reg.pillage[res] = Math.max(0, Math.round(reg.pillage[res] * (1 + Math.max(-1, eff.pillage))));
  } else if (eff.pillage && typeof eff.pillage === "object") {
    for (const [res, d] of Object.entries(eff.pillage)) if (res in reg.pillage) reg.pillage[res] = Math.max(0, reg.pillage[res] + Math.min(0, Math.round(Number(d) || 0)));
  }
  if (eff.route === "difficile" || eff.route === "coupee") {
    const routes = {};
    const nommees = (r.voisins ?? []).filter(v => (v.coupure ?? []).includes(e.cle));
    const cibles = nommees.length ? nommees : [choisir(r.voisins ?? [], h)].filter(Boolean);
    for (const v of cibles) routes[v.region] = eff.route;
    reg.evenements.push({ cle: e.cle, depuis: jour, jusqua: jour + duree - 1, routes });
  } else if (eff.route === undefined) {
    reg.evenements.push({ cle: e.cle, depuis: jour, jusqua: jour + duree - 1 });
  }
  if (Number(eff.horde) > 0) monde.hordes.push({ id: nouvelId("h"), region: r.cle, taille: borner(Number(eff.horde), 1, 5), cap: null, depuis: jour });
  if (eff.faction && factionDe(contenu, eff.faction)) reg.factions[eff.faction] = borner((reg.factions[eff.faction] ?? 0) + (Number(eff.force) || 0.5), 0, 5);
  if (eff.nature && typeof eff.nature === "object") for (const [k, d] of Object.entries(eff.nature)) if (k in reg.nature) reg.nature[k] = Math.max(0, Math.round(reg.nature[k] * (1 + Math.max(-1, Number(d) || 0)) * 100) / 100);
  const region = regionDe(contenu, r.cle)?.nom ?? r.cle, nom = e.nom ?? e.cle, texte = sansBalises(e.texte);
  // L'événement tombe là où est l'abri du groupe : ses effets `abri` le concernent (appliqués par avancer, etat.mjs).
  const touche = regionAbri && r.cle === regionAbri && eff.abri && typeof eff.abri === "object" ? { effetsAbri: structuredClone(eff.abri) } : {};
  fait(r.cle, e.cle, `${region} : ${nom}. ${texte}`.trim(), e.public === false ? "region" : "voisins", { evenement: e.cle, cleTexte: "evenement", ...touche }, { region, nom, texte });
}

// Les menaces du jour contre l'abri (§1.7). abri : { visibilite, bruit, defense }.
export function tirerMenaces(monde, contenu, hasard, { region, jour = monde?.jour ?? 0, phase = phaseDuJour(jour), visibilite = 0, bruit = 0 } = {}) {
  const R = REGLES_MONDE;
  const reg = monde?.regions?.[region];
  if (!reg) return [];
  const vis = borner(Number(visibilite) || 0, 0, 10), br = borner(Number(bruit) || 0, 0, 10);
  const menaces = [];
  for (const ho of monde.hordes ?? []) {
    if (ho.region !== region) continue;
    if (chance(R.menace.horde + R.menace.hordeBruit * br + R.menace.hordeVisibilite * vis, hasard)) menaces.push({ type: "horde", force: 2 * ho.taille + 1, horde: ho.id, texte: `Une horde (taille ${ho.taille}) trouve l'abri.`, cle: "menace-horde", params: { taille: ho.taille } });
  }
  if (reg.infestation > 0.2 && chance(reg.infestation * R.menace.livides * (1 + br / 10) + 0.01 * vis, hasard)) {
    menaces.push({ type: "livides", force: Math.max(1, Math.round(reg.infestation)), texte: "Des Livides errants rôdent autour de l'abri.", cle: "menace-livides", params: {} });
  }
  for (const [f, force] of Object.entries(reg.factions ?? {})) {
    if (force < 0.5) continue;
    const def = factionDe(contenu, f);
    const attitude = def?.attitude ?? "mefiante";
    if (attitude === "hostile" || attitude === "mefiante") {
      const p = R.menace.bande * force * (1 + vis) / (attitude === "mefiante" ? 2 : 1);
      if (chance(p, hasard)) menaces.push({ type: "bande", force: Math.ceil(1.5 * force) + 1, faction: f, attitude, texte: `${def?.nom ?? f} s'intéresse à l'abri.`, cle: "menace-bande", params: { faction: def?.nom ?? f } });
    } else if (chance(0.02 * force * (1 + vis / 2), hasard)) {
      menaces.push({ type: "visite", force: 0, faction: f, attitude, texte: `${def?.nom ?? f} vient à la rencontre du groupe.`, cle: "menace-visite", params: { faction: def?.nom ?? f } });
    }
  }
  if (CLES_PHASES.indexOf(phase) >= 1 && chance(0.02, hasard)) menaces.push({ type: "animaux", force: 2, texte: "Une meute de chiens errants, affamés.", cle: "menace-animaux", params: {} });
  if (chance(0.01, hasard)) menaces.push({ type: "accident", force: 0, texte: "Un accident à l'abri (chute, feu de cuisine, outil qui casse).", cle: "menace-accident", params: {} });
  return menaces.sort((a, b) => b.force - a.force).slice(0, R.menacesMax);
}

// Un abri quitté par le groupe devient un abri abandonné du monde (§2.3), avec ses installations.
export function abandonnerAbri(mondeEntree, region, { site, installations = [], jour = 0 } = {}) {
  const monde = structuredClone(mondeEntree);
  const reg = monde.regions[region];
  if (!reg) return monde;
  reg.abrisAbandonnes = reg.abrisAbandonnes.filter(a => a.site !== site);
  reg.abrisAbandonnes.push({ site, depuis: jour, installations: structuredClone(installations), occupe: null });
  return monde;
}

// Reprendre un abri abandonné (non occupé) : -> { monde, abandonne | null }.
export function reprendreAbri(mondeEntree, region, site) {
  const reg = mondeEntree?.regions?.[region];
  const a = reg?.abrisAbandonnes?.find(x => x.site === site);
  if (!a || a.occupe) return { monde: mondeEntree, abandonne: a ?? null };
  const monde = structuredClone(mondeEntree);
  monde.regions[region].abrisAbandonnes = monde.regions[region].abrisAbandonnes.filter(x => x.site !== site);
  return { monde, abandonne: structuredClone(a) };
}
