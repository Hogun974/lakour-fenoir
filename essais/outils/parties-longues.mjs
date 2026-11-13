// Parties LONGUES de Fénoir (hors suite d'essais) : un an de jeu (ou jusqu'à la mort du groupe), plusieurs graines, avec le
// simulateur de parties (simuler-parties.mjs) et le vrai contenu, et des CONTRÔLES chaque jour pour trouver ce que les parties
// courtes ne montrent pas : impasses, valeurs impossibles (négatif, NaN, au-dessus d'un plafond), chantiers jamais finis,
// cyclone ou éruption bloqués, renseignements qui ne vieillissent pas, textes sans clé ou sans traduction, fêtes qui ne tombent
// pas, recrues qui ne comblent pas les manques, dérive du monde sur la durée (menace qui s'éteint ou explose).
//
//   node essais/outils/parties-longues.mjs                      (tous les scénarios, 40 graines, 365 jours)
//   options : --graines 40  --jours 365  --scenarios sedentaire-4,seul  --json <fichier>  --monde 730 (monde seul, sans groupe)
//             --serie h (graines h0, h1… au lieu de g0, g1… : une autre série pour mesurer le bruit du hasard)
//
// Scénarios : sédentaire (autonomie complète sans jamais déménager), seul (enraciné, sédentaire et nomade à 1), compagnons
// (2 humains + 2 compagnons, enracinés), recrues (2 humains qui recrutent quand une compétence manque), nomade (4, déménage
// souvent), mixte. Les anomalies sont comptées par sorte, avec un exemple (graine, jour, détail).
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import * as L from "../../systems/lakour-survie/logique/index.mjs";
import { chargerContenu, jouerPartie, remedesDe } from "./simuler-parties.mjs";
import { fetesDuJour } from "../../modules/lakour-fenoir/scripts/fetes.js";
import { fetesDuJour as calendrierSocle } from "../../modules/lakour-mj-ia/scripts/fetes-logique.js";

const ICI = dirname(fileURLToPath(import.meta.url));
const LANG = f => JSON.parse(readFileSync(join(ICI, "..", "..", "systems", "lakour-survie", "lang", `${f}.json`), "utf8")).LAKOUR_SURVIE;
const FR = LANG("fr"), EN = LANG("en");
// Les menaces relevées par type (la visite d'une faction neutre ou amicale n'est pas un assaut, mais dit qu'il reste des factions).
const TYPES_MENACES = ["horde", "livides", "bande", "animaux", "visite"];
const parametres = s => [...String(s ?? "").matchAll(/\{(\w+)\}/g)].map(m => m[1]);

export const SCENARIOS = {
  "sedentaire-4": { strategie: "sedentaire", membres: 4 },
  "sedentaire-2": { strategie: "sedentaire", membres: 2 },
  "seul-enracine": { strategie: "enracine", membres: 1 },
  "seul-sedentaire": { strategie: "sedentaire", membres: 1 },
  "seul-nomade": { strategie: "nomade", membres: 1 },
  "compagnons": { strategie: "enracine", membres: 4, compagnons: 2 },
  "humains-4": { strategie: "enracine", membres: 4 },
  "recrues": { strategie: "enracine", membres: 2, recrutement: true },
  "sans-recrues": { strategie: "enracine", membres: 2 },
  "nomade-4": { strategie: "nomade", membres: 4 },
  "mixte-4": { strategie: "mixte", membres: 4 }
};

// ------------------------------------------------------------------ contrôles d'une partie
export function controleur(contenu, { graine, scenario }) {
  const idx = L.indexer(contenu);
  const anomalies = new Map(); // sorte -> { n, exemple }
  const signaler = (sorte, jour, detail) => {
    const a = anomalies.get(sorte) ?? { n: 0, exemple: null };
    a.n++;
    if (!a.exemple) a.exemple = { scenario, graine, jour, detail };
    anomalies.set(sorte, a);
  };
  const chantiers = new Map(); // cle -> { fait, depuis }
  const mesures = new Map(); // ce qui n'est pas un bogue mais se mesure (stratégie du simulateur) : sorte -> n
  const mesurer = sorte => mesures.set(sorte, (mesures.get(sorte) ?? 0) + 1);
  const serie = []; // un relevé par jour
  const clesVues = new Set();

  // Nombres impossibles : NaN, infini, négatif (sauf les champs qui peuvent l'être).
  // sensMoral, reputation (−10..10) et entente (−3..3) sont signés par nature (moralite.mjs, esprit.mjs).
  const PEUT_ETRE_NEGATIF = /(^|\.)(termineLe|net\.|sol$|depuis$|actifDepuis$|marge$|sensMoral$|reputation$|entente$)/;
  const scanner = (o, chemin, jour, profondeur = 0) => {
    if (profondeur > 12 || o === null || o === undefined) return;
    if (typeof o === "number") {
      if (!Number.isFinite(o)) signaler("nombre non fini", jour, `${chemin} = ${o}`);
      else if (o < 0 && !PEUT_ETRE_NEGATIF.test(chemin)) signaler("nombre négatif", jour, `${chemin} = ${o}`);
      return;
    }
    if (typeof o !== "object") return;
    if (Array.isArray(o)) { o.forEach((x, i) => scanner(x, `${chemin}[${i}]`, jour, profondeur + 1)); return; }
    for (const [k, v] of Object.entries(o)) {
      if (["journalSecret", "journal", "histoire"].includes(k)) continue;
      scanner(v, chemin ? `${chemin}.${k}` : k, jour, profondeur + 1);
    }
  };
  // Un message (fait, alerte, entrée de journal, menace, rencontre) : clé connue, traduite en fr et en, paramètres fournis, repli.
  const verifierMessage = (x, ou, jour) => {
    if (!x || typeof x !== "object") { signaler(`message invalide (${ou})`, jour, String(x)); return; }
    const cle = L.cleTexteDe(x);
    if (!cle) { signaler(`message sans clé (${ou})`, jour, JSON.stringify(x).slice(0, 160)); return; }
    clesVues.add(cle);
    const fr = cle.includes(".") ? cle.split(".").reduce((o, k) => o?.[k], FR) : FR.Faits[cle];
    const en = cle.includes(".") ? cle.split(".").reduce((o, k) => o?.[k], EN) : EN.Faits[cle];
    // Une clé déclarée en attente de traduction (L.CLES_A_TRADUIRE) est comptée à part : le repli français s'affiche en attendant.
    const enAttente = (L.CLES_A_TRADUIRE ?? []).includes(cle);
    if (typeof fr !== "string") signaler(enAttente ? `traduction en attente, sans français (${ou})` : `clé sans français (${ou})`, jour, cle);
    if (typeof en !== "string") signaler(enAttente ? `traduction en attente, sans anglais (${ou})` : `clé sans anglais (${ou})`, jour, cle);
    if (!(typeof x.texte === "string" && x.texte.trim().length > 2)) signaler(`message sans texte de repli (${ou})`, jour, cle);
    if (/undefined|NaN|\[object Object\]/.test(String(x.texte ?? ""))) signaler(`texte de repli abîmé (${ou})`, jour, `${cle} : ${x.texte}`);
    for (const p of parametres(fr)) {
      if (!x.params || !(p in x.params)) signaler(`paramètre manquant (${ou})`, jour, `${cle} {${p}}`);
      else if (x.params[p] === undefined || x.params[p] === null || (typeof x.params[p] === "number" && !Number.isFinite(x.params[p]))) signaler(`paramètre vide (${ou})`, jour, `${cle} {${p}} = ${x.params[p]}`);
    }
  };

  const controle = (jour, { etat, monde, abri, survivants, avance, actions }) => {
    // 1. Nombres.
    scanner(monde, "monde", jour);
    scanner(etat, "etat", jour);
    if (abri) scanner({ system: abri.system, installations: abri.installations }, "abri", jour);
    for (const s of survivants) scanner(s.system, `survivant.${s.id}`, jour);
    // 2. Monde.
    for (const [cle, r] of Object.entries(monde.regions)) {
      if (!(r.infestation >= 0 && r.infestation <= 5)) signaler("infestation hors [0, 5]", jour, `${cle} ${r.infestation}`);
      for (const [f, x] of Object.entries(r.factions)) if (!(x >= 0 && x <= 5)) signaler("faction hors [0, 5]", jour, `${cle}.${f} ${x}`);
      for (const [res, q] of Object.entries(r.pillage)) if (!Number.isInteger(q)) signaler("pillage non entier", jour, `${cle}.${res} ${q}`);
      for (const e of r.evenements) if (e.jusqua !== null && e.jusqua !== undefined && e.jusqua < jour) signaler("événement expiré resté", jour, `${cle} ${e.cle} jusqu'à ${e.jusqua}`);
      for (const [v, st] of Object.entries(r.routes)) if (st !== "ouverte" && !r.evenements.some(e => e.routes?.[v]) && !monde.regions[v]?.evenements?.some(e => e.routes?.[cle])) signaler("route abîmée sans cause", jour, `${cle}→${v} ${st}`);
    }
    for (const h of monde.hordes) {
      if (!(h.taille >= 1 && h.taille <= 5)) signaler("horde de taille impossible", jour, `${h.id} ${h.taille}`);
      if (!idx.regions.has(h.region)) signaler("horde hors de l'île", jour, `${h.id} ${h.region}`);
    }
    if (monde.cyclone && jour > monde.cyclone.arrivee + 3) signaler("cyclone bloqué", jour, JSON.stringify(monde.cyclone));
    if (monde.eruption && jour > monde.eruption.fin + 1) signaler("éruption bloquée", jour, JSON.stringify(monde.eruption));
    if (monde.jour !== jour) signaler("monde en retard sur le jour", jour, `monde.jour ${monde.jour}`);
    // 3. État public.
    if (Math.floor(etat.horloge.quart / 4) !== jour) signaler("horloge décalée", jour, `quart ${etat.horloge.quart}`);
    if ((etat.journal?.length ?? 0) > L.JOURNAL_MAX) signaler("journal trop long", jour, etat.journal.length);
    if ((monde.journalSecret?.length ?? 0) > L.JOURNAL_SECRET_MAX) signaler("journal secret trop long", jour, monde.journalSecret.length);
    for (const [cle, r] of Object.entries(etat.renseignements)) {
      if (r.vu !== null && r.vu > jour) signaler("renseignement venu du futur", jour, `${cle} vu ${r.vu}`);
      if (!L.SOURCES_RENSEIGNEMENT.includes(r.source)) signaler("source de renseignement inconnue", jour, `${cle} ${r.source}`);
      // Un renseignement « radio » ou « rumeur » ne voit pas le pillage : s'il en garde un, il doit en dire l'âge.
      if (r.source !== "vu" && r.pillage && r.pillage !== "inconnu" && (r.vuDirect === undefined || r.vuDirect === null)) signaler("pillage sans date d'observation directe", jour, `${cle} pillage ${r.pillage} daté ${r.vu} (source ${r.source})`);
      if (r.vuDirect !== null && r.vuDirect !== undefined && !(r.vuDirect <= r.vu)) signaler("observation directe plus récente que la dernière", jour, `${cle} ${r.vuDirect} > ${r.vu}`);
    }
    // 4. Abri.
    if (abri) {
      const bilan = L.bilanAbri(abri.system, abri.installations, contenu, { jour, personnes: survivants.filter(s => L.peutAgir(s.system) && etat.groupe.membres.includes(s.id)).length, dateDepart: monde.dateDepart });
      // Aussi le jour de l'installation : installerAbri ramène tout de suite aux plafonds les stocks du site et ce qu'on apporte.
      for (const [r, q] of Object.entries(abri.system.stocks)) if (q > bilan.plafonds[r]) signaler("stock au-dessus du plafond", jour, `${r} ${q} > ${bilan.plafonds[r]}`);
      for (const i of abri.installations) {
        const def = idx.installations.get(i.cle);
        if (!def) { signaler("installation inconnue", jour, i.cle); continue; }
        if (i.niveau > L.niveauMaxDe(def)) signaler("installation au-delà de son niveau max", jour, `${i.cle} ${i.niveau}`);
        if (!(i.etat >= 0 && i.etat <= 3)) signaler("état d'installation impossible", jour, `${i.cle} ${i.etat}`);
        const ch = i.chantier ?? {};
        if (Number(ch.requis) > 0) {
          if (Number(ch.fait) >= Number(ch.requis)) signaler("chantier fini non clos", jour, `${i.cle} ${ch.fait}/${ch.requis}`);
          const k = `${abri.system.site}|${i.cle}|${i.niveau}`;
          const c = chantiers.get(k);
          if (!c || c.fait !== ch.fait) chantiers.set(k, { fait: ch.fait, depuis: jour });
          else if (jour - c.depuis === 60) mesurer("chantier immobile 60 jours (personne n'y travaille)");
        }
        // Une installation en service, achevée, qui ne fait rien (production nulle, aucun effet) depuis longtemps.
      }
    }
    // 5. Survivants.
    for (const s of survivants) {
      const y = s.system;
      if (!(y.blessures >= 0 && y.blessures <= 4)) signaler("blessures hors [0, 4]", jour, `${s.id} ${y.blessures}`);
      if (!(y.fatigue >= 0 && y.fatigue <= 5)) signaler("fatigue hors [0, 5]", jour, `${s.id} ${y.fatigue}`);
      if (!(y.moral >= 0 && y.moral <= 5)) signaler("moral hors [0, 5]", jour, `${s.id} ${y.moral}`);
      for (const c of L.COMPETENCES) if (!(y.competences[c].niveau >= 0 && y.competences[c].niveau <= 5)) signaler("compétence hors [0, 5]", jour, `${s.id} ${c}`);
      for (const a of y.afflictions ?? []) if (L.peutAgir(y) && a.stade !== "incubation" && !(a.reste > 0)) signaler("affliction sans fin", jour, `${s.id} ${a.cle} reste ${a.reste}`);
      if (!L.peutAgir(y) && etat.groupe.membres.includes(s.id) && s.compte === undefined && jour > 0) { /* compté par finDeJour */ }
    }
    // 6. Messages.
    if (avance) {
      for (const x of avance.faits) verifierMessage(x, "fait", jour);
      for (const x of avance.secrets) verifierMessage(x, "secret", jour);
      for (const x of avance.alertes) verifierMessage(x, "alerte", jour);
      for (const x of avance.menaces) verifierMessage(x, "menace", jour);
      for (const x of avance.etat.journal ?? []) verifierMessage(x, "journal", jour);
      for (const x of (avance.monde.journalSecret ?? []).filter(e => e.jour === jour)) verifierMessage(x, "journal secret", jour);
    }
    for (const x of actions) verifierMessage(x, "action", jour);
    // 7. Relevé du jour (dérives).
    const regions = Object.entries(monde.regions);
    const bas = regions.filter(([c]) => L.estDesBas(idx.regions.get(c)));
    const hauts = regions.filter(([c]) => !L.estDesBas(idx.regions.get(c)));
    const moy = l => (l.length ? l.reduce((t, [, r]) => t + r.infestation, 0) / l.length : 0);
    const ici = etat.groupe.region;
    const ageIci = L.ageRenseignement(etat.renseignements[ici], jour);
    const voisines = L.voisinsDe(contenu, ici).map(v => L.ageRenseignement(etat.renseignements[v.region], jour)).filter(x => x !== null);
    serie.push({
      jour, bas: moy(bas), hauts: moy(hauts), hordes: monde.hordes.length, tailleHordes: monde.hordes.reduce((t, h) => t + h.taille, 0),
      factions: regions.reduce((t, [, r]) => t + Object.values(r.factions).reduce((a, b) => a + b, 0), 0),
      pillage: regions.reduce((t, [c, r]) => t + L.partPillage(r.pillage, L.reservesDepart(idx.regions.get(c))), 0) / regions.length,
      menaces: avance?.menaces?.filter(m => m.force > 0).length ?? 0,
      parType: Object.fromEntries(TYPES_MENACES.map(t => [t, avance?.menaces?.filter(m => m.type === t).length ?? 0])),
      faits: (avance?.faits?.length ?? 0) + (avance?.secrets?.length ?? 0),
      ageIci, ageVoisines: voisines.length ? Math.max(...voisines) : null,
      vivants: survivants.filter(s => L.peutAgir(s.system) && etat.groupe.membres.includes(s.id)).length,
      membres: etat.groupe.membres.length,
      autonome: etat.autonome, stocks: abri ? { eau: abri.system.stocks.eau, nourriture: abri.system.stocks.nourriture } : null,
      saison: L.saisonDuJour(jour, monde.dateDepart)
    });
  };
  return { controle, anomalies, mesures, serie, clesVues };
}

// ------------------------------------------------------------------ fêtes du calendrier sur la période
export function fetesDeLaPeriode(dateDepart, jours) {
  const coeur = new Map(); // fête -> jours (au cœur)
  for (let j = 0; j < jours; j++) {
    const d = L.dateDuJour(j, dateDepart);
    for (const f of fetesDuJour(d.iso, calendrierSocle)) if (f.coeur) (coeur.get(f.cle) ?? coeur.set(f.cle, []).get(f.cle)).push(j);
  }
  return coeur;
}

// ------------------------------------------------------------------ une partie longue
export function jouerLongue(contenu, scenario, { graine, jours = 365, region }) {
  const def = SCENARIOS[scenario];
  const c = controleur(contenu, { graine, scenario });
  const stats = jouerPartie(contenu, { ...def, region, graine: `${graine}|${scenario}`, jours, controle: c.controle });
  return { scenario, graine, region, stats, anomalies: c.anomalies, mesures: c.mesures, serie: c.serie, clesVues: c.clesVues };
}

// ------------------------------------------------------------------ le monde seul, sans groupe, sur deux ans
export function mondeSeul(contenu, { graine = "seul", jours = 730 } = {}) {
  const c = controleur(contenu, { graine, scenario: "monde-seul" });
  let monde = L.creerMonde(contenu, graine);
  const releve = [];
  for (let j = 1; j <= jours; j++) {
    const r = L.simulerJour(monde, contenu, L.hasardDuJour(graine, j), j, { region: "saint-denis", radio: true });
    monde = r.monde;
    for (const f of r.faits) if (!L.CLES_TEXTES.includes(L.cleTexteDe(f))) c.anomalies.set("fait du monde à clé inconnue", { n: 1, exemple: { jour: j, detail: f.cle } });
    if (j % 30 === 0) {
      const regions = Object.entries(monde.regions);
      const idx = L.indexer(contenu);
      releve.push({
        jour: j,
        bas: +(regions.filter(([k]) => L.estDesBas(idx.regions.get(k))).reduce((t, [, x]) => t + x.infestation, 0) / regions.filter(([k]) => L.estDesBas(idx.regions.get(k))).length).toFixed(2),
        hauts: +(regions.filter(([k]) => !L.estDesBas(idx.regions.get(k))).reduce((t, [, x]) => t + x.infestation, 0) / regions.filter(([k]) => !L.estDesBas(idx.regions.get(k))).length).toFixed(2),
        hordes: monde.hordes.length,
        factions: +regions.reduce((t, [, x]) => t + Object.values(x.factions).reduce((a, b) => a + b, 0), 0).toFixed(1),
        regionsAvecFaction: regions.filter(([, x]) => Object.keys(x.factions).length).length,
        pillage: +(100 * regions.reduce((t, [k, x]) => t + L.partPillage(x.pillage, L.reservesDepart(idx.regions.get(k))), 0) / regions.length).toFixed(1),
        faits: r.faits.length
      });
    }
  }
  return releve;
}

// ------------------------------------------------------------------ exécution
const moyenne = l => (l.length ? l.reduce((a, b) => a + b, 0) / l.length : 0);
const q = (l, p) => { if (!l.length) return null; const t = [...l].sort((a, b) => a - b); return t[Math.min(t.length - 1, Math.floor(p * t.length))]; };
const arr = (x, n = 1) => (x === null ? "—" : Math.round(x * 10 ** n) / 10 ** n);

// serie : la lettre des graines (g0, g1… par défaut ; une autre série, h0, h1…, mesure le bruit du hasard).
export function jouerScenarios(contenu, { graines = 40, jours = 365, scenarios = Object.keys(SCENARIOS), serie = "g" } = {}) {
  const regions = L.regionsDe(contenu).map(r => r.cle);
  const sortie = {};
  for (const sc of scenarios) {
    sortie[sc] = [];
    for (let i = 0; i < graines; i++) sortie[sc].push(jouerLongue(contenu, sc, { graine: `${serie}${i}`, jours, region: regions[i % regions.length] }));
  }
  return sortie;
}

export function resumer(parties, jours) {
  const l = parties;
  const fins = l.map(p => p.stats.jours);
  const vivants = l.filter(p => p.stats.fin === "vivants");
  const causes = {};
  for (const p of l) causes[p.stats.fin] = (causes[p.stats.fin] ?? 0) + 1;
  const parMois = (champ, filtre = () => true) => {
    const m = [];
    for (let mo = 0; mo < Math.ceil(jours / 30); mo++) {
      const v = l.flatMap(p => p.serie.filter(x => x.jour > mo * 30 && x.jour <= (mo + 1) * 30 && filtre(x)).map(x => x[champ])).filter(x => x !== null && x !== undefined);
      m.push(v.length ? moyenne(v) : null);
    }
    return m;
  };
  const recrues = l.flatMap(p => p.stats.recrues ?? []);
  return {
    parties: l.length, mediane: q(fins, 0.5), q1: q(fins, 0.25), vivants: vivants.length, causes,
    autonomes: l.filter(p => p.stats.autonomeLe !== null).length, autonomeMediane: q(l.filter(p => p.stats.autonomeLe !== null).map(p => p.stats.autonomeLe), 0.5),
    autonomesFin: l.filter(p => p.serie.at(-1)?.autonome).length,
    demenagements: moyenne(l.map(p => p.stats.demenagements)), installations: moyenne(l.map(p => p.stats.installations)),
    fetes: moyenne(l.map(p => p.stats.fetes)), breches: moyenne(l.map(p => p.stats.breches)),
    joursSansNourriture: moyenne(l.map(p => p.stats.joursSansNourriture)), joursSansEau: moyenne(l.map(p => p.stats.joursSansEau)),
    menacesParMois: parMois("menaces").map(x => (x === null ? null : x * 30)),
    typesParTrimestre: Array.from({ length: Math.max(1, Math.round(jours / 91.25)) }, (_, t) => t).map(t => Object.fromEntries(TYPES_MENACES.map(k => {
      const v = l.flatMap(p => p.serie.filter(x => x.jour > t * 91 && x.jour <= (t + 1) * 91).map(x => x.parType[k]));
      return [k, v.length ? Math.round(30 * 100 * moyenne(v)) / 100 : null];
    }))),
    vivantsParMois: Array.from({ length: Math.ceil(jours / 30) }, (_, mo) => l.filter(p => p.serie.some(x => x.jour === Math.min(jours, (mo + 1) * 30) && x.vivants > 0)).length),
    mesures: l.reduce((t, p) => { for (const [k, n] of p.mesures) t[k] = (t[k] ?? 0) + n; return t; }, {}),
    impasses: l.filter(p => p.stats.impasse !== null).map(p => `${p.graine} J${p.stats.impasse}`),
    ageIciParMois: parMois("ageIci"), ageVoisinesParMois: parMois("ageVoisines"),
    recrues: recrues.length, tentatives: l.reduce((t, p) => t + (p.stats.tentatives ?? 0), 0),
    recruesComblant: recrues.filter(r => r.comble.length).length, sommeRecrues: moyenne(recrues.map(r => r.somme)),
    // Par compétence manquante : combien de recrues venues pendant ce manque l'ont comblé (niveau 2 au moins).
    comblePar: recrues.reduce((t, r) => { for (const c of r.manques) { t[c] ??= [0, 0]; t[c][1]++; if (r.comble.includes(c)) t[c][0]++; } return t; }, {}),
    manquesDebut: l.map(p => p.stats.manquesDebut?.length ?? 0), manquesFin: l.map(p => p.stats.manquesFin?.length ?? 0),
    joursAvecManque: moyenne(l.map(p => p.stats.joursAvecManque ?? 0)),
    morts: l.reduce((t, p) => { for (const [c, n] of Object.entries(p.stats.morts)) t[c] = (t[c] ?? 0) + n; return t; }, {}),
    remedes: remedesDe(l.map(p => p.stats))
  };
}

function lireOptions(argv) {
  const o = { graines: 40, jours: 365, scenarios: Object.keys(SCENARIOS), json: null, monde: 730 };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--graines") o.graines = Number(argv[++i]);
    else if (argv[i] === "--jours") o.jours = Number(argv[++i]);
    else if (argv[i] === "--scenarios") o.scenarios = argv[++i].split(",");
    else if (argv[i] === "--json") o.json = argv[++i];
    else if (argv[i] === "--monde") o.monde = Number(argv[++i]);
    else if (argv[i] === "--serie") o.serie = String(argv[++i]);
  }
  return o;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const o = lireOptions(process.argv.slice(2));
  const contenu = chargerContenu();
  const debut = Date.now();
  const tout = jouerScenarios(contenu, o);
  const anomalies = new Map();
  const cles = new Set();
  for (const parties of Object.values(tout)) for (const p of parties) {
    for (const k of p.clesVues) cles.add(k);
    for (const [sorte, a] of p.anomalies) {
      const t = anomalies.get(sorte) ?? { n: 0, parties: 0, exemple: a.exemple };
      t.n += a.n; t.parties++;
      anomalies.set(sorte, t);
    }
  }
  console.log(`## Parties longues (${o.graines} graines × ${o.scenarios.length} scénarios, ${o.jours} jours)\n`);
  console.log("| Scénario | Médiane | Q1 | Vivants à la fin | Autonomes (jour médian) | Autonomes à la fin | Déménagements | Installations | Fêtes | Brèches | Jours sans nourriture | Jours sans eau | Causes |");
  console.log("|---|---|---|---|---|---|---|---|---|---|---|---|---|");
  const resumes = {};
  for (const [sc, parties] of Object.entries(tout)) {
    const r = resumes[sc] = resumer(parties, o.jours);
    console.log(`| ${sc} | ${r.mediane} | ${r.q1} | ${r.vivants}/${r.parties} | ${r.autonomes} (J${r.autonomeMediane ?? "—"}) | ${r.autonomesFin} | ${arr(r.demenagements)} | ${arr(r.installations)} | ${arr(r.fetes)} | ${arr(r.breches, 2)} | ${arr(r.joursSansNourriture)} | ${arr(r.joursSansEau)} | ${Object.entries(r.causes).map(([c, n]) => `${c} ${n}`).join(", ")} |`);
  }
  console.log("\n### Remèdes (morsures : aidées par un médicament, une décoction, une trousse ou une infirmerie, soignées ; par partie : trousses trouvées, plantes cueillies, tisanes ; jours d'abri avec un médicament)\n");
  for (const [sc, r] of Object.entries(resumes)) console.log(`${sc.padEnd(16)} morsures ${r.remedes.morsures}, aidées ${r.remedes.aidees}, soignées ${r.remedes.soignees} ; trousses ${r.remedes.trousses}, plantes ${r.remedes.plantes}, tisanes ${r.remedes.tisanes} ; médicament ${r.remedes.joursAvecMedicament} des jours`);
  console.log("\n### Menaces contre l'abri par mois (moyenne des parties en vie)\n");
  for (const [sc, r] of Object.entries(resumes)) console.log(`${sc.padEnd(16)} ${r.menacesParMois.map(x => arr(x)).join(" ")}`);
  console.log("\n### Menaces par type et par trimestre (par mois ; h horde, l Livides errants, b bande, a animaux, v visite)\n");
  for (const [sc, r] of Object.entries(resumes)) console.log(`${sc.padEnd(16)} ${r.typesParTrimestre.map(t => Object.entries(t).map(([k, v]) => `${k[0]}${v ?? "—"}`).join(" ")).join(" | ")}`);
  console.log("\n### Parties encore en vie à la fin de chaque mois ; impasses ; mesures\n");
  for (const [sc, r] of Object.entries(resumes)) console.log(`${sc.padEnd(16)} ${r.vivantsParMois.join(" ")} ; impasses ${r.impasses.join(", ") || "aucune"} ; ${JSON.stringify(r.mesures)}`);
  console.log("\n### Âge des renseignements (région de l'abri | voisine la plus vieille), par mois\n");
  for (const [sc, r] of Object.entries(resumes)) console.log(`${sc.padEnd(16)} ${r.ageIciParMois.map(x => arr(x, 0)).join(" ")} | ${r.ageVoisinesParMois.map(x => arr(x, 0)).join(" ")}`);
  for (const sc of ["recrues", "sans-recrues", "compagnons", "humains-4"]) if (resumes[sc]) {
    const r = resumes[sc];
    console.log(`\n${sc} : ${r.recrues} recrues sur ${r.tentatives} tentatives, ${r.recruesComblant} comblent un manque, somme des niveaux ${arr(r.sommeRecrues)} ; manques au début ${arr(moyenne(r.manquesDebut))}, à la fin ${arr(moyenne(r.manquesFin))}, jours avec un manque ${arr(r.joursAvecManque)} ; morts ${JSON.stringify(r.morts)}`);
    if (r.recrues) console.log(`  manque comblé par la recrue : ${Object.entries(r.comblePar).map(([c, [n, d]]) => `${c} ${Math.round(100 * n / d)} % (${n}/${d})`).join(", ")}`);
  }
  // Fêtes.
  const coeur = fetesDeLaPeriode(L.DATE_DEPART, o.jours);
  console.log(`\n### Fêtes au cœur sur ${o.jours} jours depuis ${L.DATE_DEPART}\n`);
  console.log([...coeur].map(([f, j]) => `${f} (${j.length} j, J${j[0]})`).join(" ; "));
  // Clés.
  const jamais = L.CLES_TEXTES.filter(k => !cles.has(k));
  console.log(`\n### Clés de texte vues : ${cles.size} ; jamais produites : ${jamais.join(", ")}`);
  console.log("\n### Anomalies\n");
  if (!anomalies.size) console.log("aucune");
  for (const [sorte, a] of [...anomalies].sort((x, y) => y[1].n - x[1].n)) console.log(`- ${sorte} : ${a.n} fois dans ${a.parties} parties ; ex. ${JSON.stringify(a.exemple)}`);
  if (o.monde) {
    console.log(`\n### Le monde seul sur ${o.monde} jours (graines seul-1..3), tous les 30 jours\n`);
    for (const g of ["seul-1", "seul-2", "seul-3"]) {
      const rel = mondeSeul(contenu, { graine: g, jours: o.monde });
      console.log(`${g} : ${rel.map(x => `J${x.jour} bas ${x.bas} hauts ${x.hauts} hordes ${x.hordes} fact ${x.factions}/${x.regionsAvecFaction}r pil ${x.pillage}%`).join(" | ")}`);
    }
  }
  console.log(`\n(${Math.round((Date.now() - debut) / 1000)} s)`);
  if (o.json) writeFileSync(o.json, JSON.stringify({ options: o, resumes, anomalies: Object.fromEntries(anomalies) }, null, 1));
}
