// Les deux savoirs et l'île en mouvement (lot « savoirs », docs/equilibre-savoirs.md, contrat §11). Logique pure.
//
// - Deux arbres de savoir-faire : `moderne` (électricité, radio, mécanique, plomberie…) et `lontan` (remèdes, cultures, fabrication à
//   la main). Un savoir du contenu porte `arbre` ; une installation aussi (les sœurs : abri.mjs). L'autonomie complète demande les
//   deux : un abri autonome (7 jours) ET au moins AUTONOMIE_COMPLETE.savoirs savoir-faire de chaque arbre dans le groupe.
// - Apprendre un savoir-faire, veillée après veillée (le soir, à l'abri) : dans un livre trouvé 14 veillées, dans un cahier dicté
//   par une ancienne 7, auprès de quelqu'un qui sait 7, auprès d'une gramoune ou d'un gramoun (60 ans ou plus, un savoir lontan)
//   qui a confiance (3 ou plus) 4 seulement, pour un savoir lontan qu'elle a. Lire prend de la lumière : 1 énergie si l'abri en
//   a, sinon une bougie, et l'abri se voit ce soir-là (abri.lumiereLe, visibilité +1).
// - La confiance (d'une gramoune, d'un chien errant) : 0 à 5 ; une veillée réussie +1 (+2 avec une marge de 2), un test forcé
//   raté −1 (la complication).
// - Écrire sous la dictée d'une gramoune qui a confiance : 6 veillées donnent un cahier manuscrit (savoir rare, unique) qui
//   enseigne ses savoirs lontan et lui survit. Sinon, son savoir meurt avec elle.
// - Gagner la confiance d'un chien errant : une veillée = 1 nourriture et un test de survie ; à 5, le chien est au groupe. Un test
//   forcé raté : il mord (1 blessure, pas de Gris : c'est un chien).
// - Le cyclone vécu quart par quart (deroulementCyclone) : rafales et accalmies ; l'œil (calme total) au-dessus de la région au
//   milieu de la trajectoire d'un cyclone de force 2 ou 3, puis le vent qui revient de l'autre côté. Dehors : malus de dés et de
//   vigilance (on n'y voit rien, on n'entend que le vent), mais bonus de discrétion (les Livides non plus).
// - Les verrous de la route (tirerVerrous) : épaves, éboulis, tunnels à une voie, arbres en travers, que seul un véhicule
//   rencontre (un vélo, un marcheur passent à côté) ; chacun avec ses façons de passer (temps, bruit, carburant siphonné).
import { ARBRES, borner } from "./constantes.mjs";
import { indexer, liste } from "./contenu.mjs";
import { chance, entier, tirerPoids } from "./hasard.mjs";
import { message } from "./textes.mjs";

// ------------------------------------------------------------------ les deux arbres
export const arbreDe = def => (ARBRES.includes(def?.arbre) ? def.arbre : "");
// Les savoir-faire d'un groupe rangés par arbre. -> { moderne: [cle], lontan: [cle], autres: [cle] }
export function savoirsParArbre(cles = [], contenu = {}) {
  const idx = indexer(contenu).savoirs;
  const sortie = { moderne: [], lontan: [], autres: [] };
  for (const cle of new Set(cles ?? [])) {
    const a = arbreDe(idx.get(cle));
    (a ? sortie[a] : sortie.autres).push(cle);
  }
  return sortie;
}
export const AUTONOMIE_COMPLETE = { savoirs: 2 };
// L'autonomie complète : autonome et les deux savoirs. -> { complete, moderne, lontan, manque: { moderne, lontan } }
export function autonomieComplete({ autonome = false, savoirs = [], contenu = {} } = {}) {
  const p = savoirsParArbre(savoirs, contenu);
  const manque = { moderne: Math.max(0, AUTONOMIE_COMPLETE.savoirs - p.moderne.length), lontan: Math.max(0, AUTONOMIE_COMPLETE.savoirs - p.lontan.length) };
  return { complete: Boolean(autonome) && !manque.moderne && !manque.lontan, moderne: p.moderne.length, lontan: p.lontan.length, manque };
}

// ------------------------------------------------------------------ gramounes et apprentissage
export const AGE_GRAMOUNE = 60;
export const APPRENTISSAGE = { livre: 14, cahier: 7, maitre: 7, gramoune: 4, confiance: 3 };
export const CONFIANCE_MAX = 5;
export const DICTEE = { veillees: 6, confiance: 3 };
export const SOURCES_APPRENTISSAGE = ["livre", "cahier", "maitre"];

const lontanDe = (contenu, cles = []) => (cles ?? []).filter(s => arbreDe(indexer(contenu).savoirs.get(s)) === "lontan");
// Une gramoune (un gramoun) : 60 ans ou plus et au moins un savoir lontan. Elle est fragile (âge, incapacités du contenu) ; c'est
// une bibliothèque vivante.
export const estGramoune = (system = {}, contenu = {}) => Number(system?.age) >= AGE_GRAMOUNE && lontanDe(contenu, system?.savoirs).length > 0;
export const savoirsLontan = (system = {}, contenu = {}) => lontanDe(contenu, system?.savoirs);

// Combien de veillées pour apprendre `savoir` de cette source. maitre : system de celui qui enseigne (sa confiance compte si c'est
// une gramoune et un savoir lontan).
export function dureeApprentissage({ source = "maitre", savoir = "", maitre = null, contenu = {} } = {}) {
  if (source === "livre") return APPRENTISSAGE.livre;
  if (source === "cahier") return APPRENTISSAGE.cahier;
  const lontan = arbreDe(indexer(contenu).savoirs.get(savoir)) === "lontan";
  if (lontan && estGramoune(maitre, contenu) && Number(maitre?.confiance) >= APPRENTISSAGE.confiance) return APPRENTISSAGE.gramoune;
  return APPRENTISSAGE.maitre;
}

// Une veillée d'apprentissage. eleve : system (savoirs, apprentissage) ; source : livre | cahier | maitre ; maitre : system ;
// livre : { enseigne: [cle] } (un livre ou un cahier) ; energie : énergie de l'abri (pour la lumière).
// -> { ok, motifs, system (de l'élève), fait, requis, termine, lumiere: "energie" | "bougie" | null }
export function veilleeApprentissage(eleve = {}, { savoir = "", source = "maitre", maitre = null, livre = null, contenu = {}, energie = 0 } = {}) {
  const motifs = [];
  const refus = (cle, params = {}, texte = cle) => motifs.push(message(cle, params, texte));
  const def = indexer(contenu).savoirs.get(savoir);
  if (!def) refus("apprendre-savoir-inconnu", { savoir }, `savoir-faire inconnu : ${savoir}`);
  if (!SOURCES_APPRENTISSAGE.includes(source)) refus("apprendre-source", { source }, `source inconnue : ${source}`);
  if ((eleve.savoirs ?? []).includes(savoir)) refus("apprendre-deja", { savoir: def?.nom ?? savoir }, `sait déjà : ${def?.nom ?? savoir}`);
  if (source === "maitre" && !(maitre?.savoirs ?? []).includes(savoir)) refus("apprendre-maitre", { savoir: def?.nom ?? savoir }, `le maître ne sait pas : ${def?.nom ?? savoir}`);
  if ((source === "livre" || source === "cahier") && !(livre?.enseigne ?? []).includes(savoir)) refus("apprendre-livre", { savoir: def?.nom ?? savoir }, `ce livre n'enseigne pas : ${def?.nom ?? savoir}`);
  if (motifs.length) return { ok: false, motifs, system: eleve, fait: 0, requis: 0, termine: false, lumiere: null };
  const requis = dureeApprentissage({ source, savoir, maitre, contenu });
  const avant = eleve.apprentissage && eleve.apprentissage.savoir === savoir ? Number(eleve.apprentissage.fait) || 0 : 0;
  const fait = avant + 1;
  const termine = fait >= requis;
  const lumiere = source === "maitre" ? null : Number(energie) >= 1 ? "energie" : "bougie";
  const system = { ...structuredClone(eleve), apprentissage: termine ? null : { savoir, source, fait, requis } };
  if (termine) system.savoirs = [...new Set([...(eleve.savoirs ?? []), savoir])];
  return { ok: true, motifs: [], system, fait, requis, termine, lumiere };
}

// La confiance après une veillée (test de parole avec une gramoune, de survie avec un chien). -> { confiance, delta }
export function gagnerConfiance(confiance = 0, test = {}) {
  let delta = 0;
  if (test?.reussite) delta = Number(test.marge) >= 2 ? 2 : 1;
  else if (test?.force) delta = -1;
  const c = borner((Number(confiance) || 0) + delta, 0, CONFIANCE_MAX);
  return { confiance: c, delta: c - (Number(confiance) || 0) };
}

// Une veillée de dictée : la gramoune parle, quelqu'un écrit. -> { ok, motifs, system (de la gramoune), fait, requis, termine,
// enseigne: [savoirs lontan du cahier] }
export function veilleeDictee(gramoune = {}, { contenu = {} } = {}) {
  const motifs = [];
  if (!estGramoune(gramoune, contenu)) motifs.push(message("dictee-pas-gramoune", {}, "il faut une ancienne qui garde un savoir lontan"));
  else if (Number(gramoune.confiance) < DICTEE.confiance) motifs.push(message("dictee-confiance", { n: DICTEE.confiance }, `il faut sa confiance (${DICTEE.confiance} au moins)`));
  if (gramoune.dictee?.cahier) motifs.push(message("dictee-faite", {}, "son cahier est déjà écrit"));
  const enseigne = savoirsLontan(gramoune, contenu);
  if (motifs.length) return { ok: false, motifs, system: gramoune, fait: 0, requis: DICTEE.veillees, termine: false, enseigne };
  const fait = (Number(gramoune.dictee?.fait) || 0) + 1;
  const termine = fait >= DICTEE.veillees;
  return { ok: true, motifs: [], system: { ...structuredClone(gramoune), dictee: { fait, requis: DICTEE.veillees, cahier: termine } }, fait, requis: DICTEE.veillees, termine, enseigne };
}

// ------------------------------------------------------------------ chiens errants
export const CHIEN = { seuil: 5, nourriture: 1 };
// Une veillée avec le chien errant : 1 nourriture posée, un test de survie (patience). -> { chien, delta, apprivoise, morsure }
export function veilleeChien(chien = {}, test = {}) {
  const g = gagnerConfiance(chien?.confiance, test);
  return { chien: { ...structuredClone(chien ?? {}), confiance: g.confiance }, delta: g.delta, apprivoise: g.confiance >= CHIEN.seuil, morsure: !test?.reussite && Boolean(test?.force) };
}

// ------------------------------------------------------------------ le cyclone vécu
export const VENTS = ["rafales", "accalmie", "oeil", "retour"];
// Dehors, selon le vent : dés en moins à tout test, vigilance en moins encore (on n'y voit ni n'entend rien), discrétion en plus.
export const DEHORS_CYCLONE = {
  rafales: { des: -2, vigilance: -3, discretion: 2 },
  accalmie: { des: -1, vigilance: -1, discretion: 1 },
  oeil: { des: 0, vigilance: 0, discretion: 0 },
  retour: { des: -2, vigilance: -3, discretion: 2 }
};
const MOMENTS_CYCLONE = ["matin", "apres-midi", "soir", "nuit"];
// Les quatre quarts du jour où le cyclone frappe une région. -> [{ moment, vent, dehors }] ([] si la région n'est pas touchée)
export function deroulementCyclone(cyclone, region, hasard = Math.random) {
  const traj = cyclone?.trajectoire ?? [];
  if (!cyclone || !traj.includes(region)) return [];
  const oeil = Number(cyclone.force) >= 2 && traj[Math.floor(traj.length / 2)] === region ? 1 + Math.floor(hasard() * 2) : -1;
  return MOMENTS_CYCLONE.map((moment, i) => {
    let vent;
    if (i === oeil) vent = "oeil";
    else if (oeil >= 0 && i === oeil + 1) vent = "retour";
    else vent = i === 0 || hasard() < 0.6 ? "rafales" : "accalmie";
    return { moment, vent, dehors: { ...DEHORS_CYCLONE[vent] } };
  });
}
// La préparation : 2 quarts-personne, plus 1 par installation exposée (eau, nourriture, énergie, défense) à rentrer ou fixer.
export const PREPARATION = { base: 2, parInstallation: 1, valable: 5 };
export const travailPreparation = (exposees = 0) => PREPARATION.base + PREPARATION.parInstallation * Math.max(0, Number(exposees) || 0);
// Une préparation compte-t-elle pour un cyclone qui frappe ce jour ? preparation : { jour, fait, requis }.
export const preparationValable = (preparation, jour) => Boolean(preparation && Number(preparation.fait) >= Number(preparation.requis)
  && Number(jour) - Number(preparation.jour ?? -Infinity) <= PREPARATION.valable && Number(jour) >= Number(preparation.jour ?? 0));

// ------------------------------------------------------------------ les verrous de la route
// chance : par étape de route (piste : moins) faite en véhicule, à partir de la panique ; après un cyclone ou de fortes pluies
// dans la région d'arrivée (événement en cours), les arbres et les éboulis en plus.
export const VERROUS = {
  chance: { route: 0.25, piste: 0.15 },
  types: { epave: 4, eboulis: 2, tunnel: 1, arbre: 2 },
  // Chaque façon de passer : quarts perdus, bruit, test (le MJ le demande), carburant siphonné (épave).
  facons: {
    epave: { siphonner: { quarts: 1, bruit: 0, carburant: true }, pousser: { quarts: 0, bruit: 4, test: ["endurance", "difficile"] }, chicane: { quarts: 1, bruit: 0 } },
    eboulis: { degager: { quarts: 3, bruit: 1, test: ["endurance", "normale"] }, contourner: { quarts: 2, bruit: 0, aPied: true } },
    tunnel: { attendre: { quarts: 1, bruit: 0 }, forcer: { quarts: 0, bruit: 2, test: ["conduite", "difficile"] } },
    arbre: { tronconner: { quarts: 1, bruit: 3 }, hacher: { quarts: 2, bruit: 1, test: ["endurance", "normale"] } }
  },
  // La façon qu'on choisit sans le MJ (le temps qu'elle prend s'ajoute au voyage) : la plus discrète.
  defaut: { epave: ["siphonner", "chicane"], eboulis: ["degager"], tunnel: ["attendre"], arbre: ["hacher"] },
  siphon: { jusquA: 120, plein: [1, 2], sec: [0, 1], vide: 240 }
};
// Le carburant qu'on siphonne dans une épave : les réservoirs sèchent avec le temps (évaporation, autres pilleurs).
export function carburantSiphonne(jour = 0, hasard = Math.random) {
  const S = VERROUS.siphon;
  if (jour >= S.vide) return 0;
  return jour < S.jusquA ? entier(S.plein[0], S.plein[1], hasard) : entier(S.sec[0], S.sec[1], hasard);
}
// etapes : celles d'un chemin ({ de, vers, terrain, quarts }) ; vehicule : le groupe roule (un vélo, un marcheur ne compte pas) ;
// evenements(region) : les événements en cours d'une région (arbres tombés, éboulements, pluies).
// -> [{ etape, de, vers, type, facons, defaut: [façons], quarts, bruit, carburant }]
export function tirerVerrous(etapes = [], { vehicule = false, jour = 0, phase = "silence", hasard = Math.random, evenements = () => [] } = {}) {
  if (!vehicule || phase === "jour-zero") return [];
  const sortie = [];
  etapes.forEach((e, i) => {
    const base = VERROUS.chance[e.terrain];
    if (!(base > 0)) return;
    const evts = (evenements(e.vers) ?? []).map(x => x.cle);
    const intemperies = evts.some(c => ["cyclone", "arbres-tombes", "fortes-pluies", "eboulement", "crue"].includes(c));
    if (!chance(Math.min(0.9, base * (intemperies ? 2 : 1)), hasard)) return;
    const poids = { ...VERROUS.types, ...(intemperies ? { arbre: 5, eboulis: 4 } : {}) };
    const type = tirerPoids(Object.entries(poids), hasard);
    const defaut = VERROUS.defaut[type];
    let quarts = 0, bruit = 0, carburant = 0;
    for (const f of defaut) {
      const x = VERROUS.facons[type][f];
      quarts += x.quarts; bruit = Math.max(bruit, x.bruit);
      if (x.carburant) carburant += carburantSiphonne(jour, hasard);
    }
    sortie.push({ etape: i, de: e.de, vers: e.vers, type, facons: Object.keys(VERROUS.facons[type]), defaut: [...defaut], quarts, bruit, carburant });
  });
  return sortie;
}

// ------------------------------------------------------------------ jardins et livres des cases (fouilles)
// Les jardins des cases d'une région : ce qu'ils gardent au jour zéro (chouchou, bananiers, manioc, songe, brèdes), qui tient des
// mois puis s'étiole sous les herbes ; on y prend nourriture, boutures (qui meurent si on ne les replante pas) et zerbaz.
export const JARDINS_CASES = { base: 15, parPopulation: 25, tient: 90, perteParJour: 1 / 600, plancher: 0.3, parMembre: 0.6,
  part: { nourriture: 0.6, boutures: 0.5 }, plantes: 0.2, sites: ["case-creole", "maison", "ferme", "ilet"], bonusSite: 1.5 };
export const jardinsDepart = region => Math.round(JARDINS_CASES.base + JARDINS_CASES.parPopulation * Math.max(0, Number(region?.population) || 0));
export function jardinsDisponibles(region, regMonde = {}, jour = 0) {
  const J = JARDINS_CASES;
  const age = Number(jour) <= J.tient ? 1 : Math.max(J.plancher, 1 - (Number(jour) - J.tient) * J.perteParJour);
  return Math.max(0, Math.floor(jardinsDepart(region) * age - (Number(regMonde?.jardinsPris) || 0)));
}
// Les livres d'une région : quelques-uns par commune, plus dans une école ou une église (bibliothèque paroissiale).
export const LIVRES = { parMembre: 0.08, max: 0.6, sites: { ecole: 3, eglise: 1.5, commerce: 1.5, "case-creole": 1.2, maison: 1.2 }, stock: 2, poids: { moderne: 2, lontan: 1 } };
export function chanceLivre({ region, regMonde = {}, site = null, n = 1 } = {}) {
  const stock = LIVRES.stock + Math.max(0, Number(region?.population) || 0);
  const reste = Math.max(0, 1 - (Number(regMonde?.livresTrouves) || 0) / stock);
  return Math.min(LIVRES.max, LIVRES.parMembre * Math.max(0, n) * (LIVRES.sites[site?.type] ?? 1) * reste);
}
// Le savoir d'un livre trouvé : tous les savoirs peuvent s'écrire (un manuel d'électricité, un cahier de recettes lontan), les
// modernes deux fois plus souvent. -> clé ou null
export function tirerSavoirDeLivre(contenu = {}, hasard = Math.random) {
  const options = liste(contenu.savoirs).filter(s => s.livre !== false).map(s => [s.cle, LIVRES.poids[arbreDe(s)] ?? 1]);
  return tirerPoids(options, hasard) ?? null;
}
