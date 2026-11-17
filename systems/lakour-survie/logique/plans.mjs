// Les plans (lot 4 du portage du jeu 3D, famille 7 « Les plans » ; contrat §21 ; chiffres et raisons : docs/equilibre-plans.md).
// Logique pure.
//
// Un plan dit comment bâtir une installation ou fabriquer une recette. Il reste un RABAIS (décision de Jordan du 2026-11-17) : un
// plan connu fait bâtir ou fabriquer avec 25 % de matériaux en moins et la moitié du travail (PLANS d'abri.mjs, comme avant) ;
// aucune installation, aucune recette n'exige un plan trouvé.
//
// - La clé d'un plan au carnet du groupe (`groupe.plans`) : la clé d'une installation (comme avant), ou « recette:<clé> ».
// - Le registre `plans` du contenu : les plans qu'on trouve, avec leur rareté (0 à 100, entre un minimum et un maximum) et les
//   types de sites où ils se trouvent ; les plans UNIQUES (un seul exemplaire dans la partie, ne se copient pas, valent trois fois
//   plus) sont des objets qu'on porte (un cahier, un carnet) et couvrent souvent plusieurs plans.
// - Ce que le groupe connaît (`plansConnus`) : son carnet, ce que ses membres savent par cœur (un plan enseigné survit par celui
//   qui l'a appris, et meurt avec lui), et les plans uniques qu'il a en main (portés par un membre, ou rangés sur l'étagère aux
//   cahiers de l'abri). Une copie (un papier) ne compte pas tant qu'on ne l'a pas lue, et l'on ne lit un plan que si l'on a les
//   savoirs qu'il demande : sinon on la garde, pour plus tard ou pour un autre.
// - La rareté courante part de la moyenne et baisse quand des copies sortent du groupe (données, troquées), jamais sous son
//   minimum : « un plan rare reste un plan rare ». Sa valeur au troc en découle (en parts, comme le cours du marché).
// - Trouver : la fouille « plans » d'un site (chance selon son type), après quoi le site ne rend plus de plan pendant quelques jours ;
//   les plans rares (minimum ≥ 50) ne se trouvent que là où le savoir vivait (les plans propres d'un site) et dans les LIEUX À
//   PLANS, gardés par un milieu hostile ou par des Livides, ouverts à certains moments (saison sèche, nouvelle lune, après un
//   cyclone, entre deux coulées) : on y tire un plan parmi plusieurs, et l'on peut revenir plus tard tenter les autres.
// - L'étagère aux cahiers (installation, effets.bibliotheque) garde les papiers à l'abri : elle se vole (une brèche faite par des
//   vivants) et elle brûle ; son second niveau, un coffre étanche et caché, les protège.
// Rien de ce qui tient aux cycles du serveur du jeu 3D (remise à zéro, verrous, chance de garder un plan) : FVTT n'en a pas.
import { TYPES_SITE, COMPETENCES, DIFFICULTES, SAISONS } from "./constantes.mjs";
import { liste, indexer, niveauDe } from "./contenu.mjs";
import { PLANS, coutAvecPlans } from "./abri.mjs";
import { chance, entier, tirerPoids, melanger } from "./hasard.mjs";
import { dateDuJour, saisonDuJour } from "./temps.mjs";
import { lune, PHASES_LUNE } from "./lune.mjs";
import { message } from "./textes.mjs";

// ------------------------------------------------------------------ règles
export const PREFIXE_RECETTE = "recette:";
export const REGLES_PLANS = {
  // Rareté (0 à 100) : celle d'un plan que le registre ne décrit pas ; au-dessus de `rare` (son minimum), un plan ne se trouve pas
  // dans les lieux ordinaires.
  rarete: { defaut: [10, 30], rare: 50, max: 100 },
  // Valeur au troc, en parts (une part = un jour de nourriture) : base + parPoint × rareté courante, × unique pour un plan unique.
  // (Le jeu 3D : 6 + 0,4 × rareté au barème où la nourriture vaut 2 ; la moitié, en parts.)
  valeur: { base: 3, parPoint: 0.2, unique: 3 },
  // Une copie sortie du groupe fait baisser la rareté courante d'un quart de l'écart entre la moyenne et le minimum.
  circulation: { pas: 0.25 },
  // La fouille « plans » : chance par type de site (le jeu 3D : quincaillerie 30 %, hangar et garage 25 %, école et entrepôt 20 %,
  // case 8 %), × √(membres × quarts / 2) (au plus × 2), × la prudence, au plus 60 % ; sans site (la région) 4 %.
  fouille: {
    sites: { commerce: 0.25, usine: 0.25, ecole: 0.2, caserne: 0.15, phare: 0.15, port: 0.15, hopital: 0.12, ferme: 0.12, gite: 0.1, ilet: 0.1,
      autre: 0.1, "case-creole": 0.08, maison: 0.08, immeuble: 0.06, eglise: 0.05, galerie: 0.05, "tunnel-de-lave": 0.03 },
    region: 0.04, max: 0.6, equipe: 2, prudence: { discret: 0.75, normal: 1, rapide: 1.25 },
    // Après un plan trouvé, le lieu n'en rend plus pendant ces jours (le jeu 3D : 3 à 5 jours).
    retour: { commerce: 3, usine: 3, ecole: 4, port: 4, caserne: 4, "case-creole": 5, maison: 5, immeuble: 5 }, retourDefaut: 4, retourRegion: 2,
    // Poids au tirage : (110 − rareté moyenne) / 10 ; × duSite pour un plan propre au site ; × connu pour un plan déjà au carnet
    // (on en trouve une copie) ; un plan unique pèse `unique` × la somme des autres (environ un plan trouvé sur onze, là où il dort).
    poids: { duSite: 3, connu: 0.5, unique: 0.1 }
  },
  // Un lieu à plans : on y passe ces quarts (fouiller, redescendre) ; un plan déjà tiré là pèse ce facteur de moins.
  lieu: { quarts: 2, dejaTire: 0.25 },
  // Apprendre un plan par cœur : 1 + rareté moyenne ÷ 25 veillées (1 à 5) ; copier, lire : une veillée.
  enseigner: { base: 1, parRarete: 25 },
  copie: { quarts: 1 },
  lecture: { quarts: 1 },
  // L'étagère : places et protection viennent de l'installation (effets.bibliotheque) ; ce qu'on perd.
  etagere: { vol: [1, 3], volProtege: [0, 1], feu: 0.5, eau: 1 },
  // Les fenêtres des lieux : jours après un cyclone, jours de refroidissement après une éruption.
  fenetres: { apresCyclone: 7, horsEruption: 3 }
};
export const GARDES_LIEU = ["milieu", "livides"];
export const CAUSES_PERTE = ["vol", "feu", "eau"];
export const CHAMPS_FENETRE = ["saison", "lune", "apresCyclone", "horsEruption"];

// ------------------------------------------------------------------ clés
export const estPlanRecette = cle => String(cle ?? "").startsWith(PREFIXE_RECETTE);
export const clePlanRecette = recette => `${PREFIXE_RECETTE}${recette}`;
// La cible d'une clé de carnet. -> { type: "installation" | "recette", cle }
export const ciblePlan = cle => (estPlanRecette(cle) ? { type: "recette", cle: String(cle).slice(PREFIXE_RECETTE.length) } : { type: "installation", cle: String(cle ?? "") });
const defCible = (contenu, cle) => {
  const c = ciblePlan(cle);
  return c.type === "recette" ? indexer(contenu).recettes.get(c.cle) ?? null : indexer(contenu).installations.get(c.cle) ?? null;
};
export const cibleExiste = (contenu, cle) => Boolean(cle) && Boolean(defCible(contenu, cle));
// Les clés de carnet qu'un plan du registre couvre.
export const couvertureDe = def => (Array.isArray(def?.couvre) && def.couvre.length ? [...def.couvre]
  : def?.installation ? [def.installation] : def?.recette ? [clePlanRecette(def.recette)] : def?.cle ? [def.cle] : []);

// ------------------------------------------------------------------ registre
const caches = new WeakMap();
function indexPlans(contenu = {}) {
  if (contenu && typeof contenu === "object" && caches.has(contenu)) return caches.get(contenu);
  const tous = liste(contenu?.plans);
  const index = {
    tous, parCle: new Map(tous.map(p => [p.cle, p])),
    // Le plan ordinaire du registre qui couvre une clé de carnet (seul).
    parCarnet: new Map(tous.filter(p => !p.unique).flatMap(p => couvertureDe(p).map(k => [k, p]))),
    uniques: tous.filter(p => p.unique),
    lieux: new Map(liste(contenu?.lieuxAPlans).map(l => [l.cle, l]))
  };
  if (contenu && typeof contenu === "object") caches.set(contenu, index);
  return index;
}
export const plansDuRegistre = contenu => indexPlans(contenu).tous;
export const planDuRegistre = (contenu, cle) => indexPlans(contenu).parCle.get(cle) ?? null;
export const lieuxAPlansDe = contenu => [...indexPlans(contenu).lieux.values()];
export const lieuAPlansDe = (contenu, cle) => indexPlans(contenu).lieux.get(cle) ?? null;

// Le plan d'une clé de carnet : celui du registre, sinon un plan ordinaire de rareté par défaut (toute installation et toute recette
// ont un plan, même si l'on ne le trouve qu'en la bâtissant). null si la cible n'existe pas.
export function planPourCle(contenu, cle) {
  const def = indexPlans(contenu).parCarnet.get(cle);
  if (def) return def;
  if (!cibleExiste(contenu, cle)) return null;
  return { cle, couvre: [cle], rarete: [...REGLES_PLANS.rarete.defaut], unique: false, synthetique: true };
}
// Le nom à afficher d'une clé de carnet : celui de l'installation ou de la recette.
export function nomDuPlan(contenu, cle) {
  const d = defCible(contenu, cle);
  return d?.nom ?? d?.name ?? String(cle ?? "");
}

// ------------------------------------------------------------------ rareté et valeur
const bornesRarete = def => {
  const [a, b] = Array.isArray(def?.rarete) ? def.rarete : REGLES_PLANS.rarete.defaut;
  const min = Math.max(0, Math.min(100, Number(a) || 0)), max = Math.max(min, Math.min(100, Number(b) || 0));
  return [min, max];
};
export const rareteMoyenne = def => { const [a, b] = bornesRarete(def); return (a + b) / 2; };
export const estRare = def => bornesRarete(def)[0] >= REGLES_PLANS.rarete.rare;
// La rareté courante : la moyenne, moins un quart de l'écart jusqu'au minimum par copie sortie du groupe (circulation[cle]).
// Un plan unique ne circule pas : sa rareté reste la moyenne.
export function rareteCourante(def, circulation = {}) {
  const [min] = bornesRarete(def);
  const moy = rareteMoyenne(def);
  if (def?.unique) return moy;
  const n = Math.max(0, Number(circulation?.[def?.cle] ?? 0) || 0);
  return Math.round((moy - (moy - min) * Math.min(1, n * REGLES_PLANS.circulation.pas)) * 10) / 10;
}
// Valeur au troc, en parts entières (au moins 1).
export function valeurPlan(def, { circulation = {} } = {}) {
  if (!def) return 0;
  const V = REGLES_PLANS.valeur;
  return Math.max(1, Math.round((V.base + V.parPoint * rareteCourante(def, circulation)) * (def.unique ? V.unique : 1)));
}
// Une copie de plus est sortie du groupe. -> circulation (nouvelle)
export function faireCirculer(circulation = {}, cle) {
  if (!cle) return { ...circulation };
  return { ...circulation, [cle]: (Number(circulation?.[cle]) || 0) + 1 };
}

// ------------------------------------------------------------------ lire, connaître
// Les savoirs qu'un plan demande pour être lu : ceux du premier niveau de l'installation, ou ceux de la recette (ou `savoirs` du
// plan du registre, s'il les donne).
export function savoirsDuPlan(contenu, cle) {
  const reg = indexPlans(contenu).parCarnet.get(cle);
  if (Array.isArray(reg?.savoirs)) return [...reg.savoirs];
  const c = ciblePlan(cle);
  const d = defCible(contenu, cle);
  if (!d) return [];
  return c.type === "recette" ? [...(d.requiert?.savoirs ?? [])] : [...(niveauDe(d, 1)?.requiert?.savoirs ?? [])];
}
// -> { ok, manque: [savoir] }
export function peutLirePlan(contenu, cle, savoirs = []) {
  const manque = savoirsDuPlan(contenu, cle).filter(s => !(savoirs ?? []).includes(s));
  return { ok: manque.length === 0 && cibleExiste(contenu, cle), manque };
}

// Les plans d'un cahier dicté par une gramoune (lot « savoirs ») : les installations lontan et les recettes dont un niveau demande un
// des savoirs lontan qu'elle a dictés, et les tisanes si elle sait les zerbaz. Triés, sans doublon.
export function plansDuCahierDicte(enseigne = [], contenu = {}) {
  const sait = new Set(enseigne ?? []);
  if (!sait.size) return [];
  const sortie = new Set();
  for (const i of liste(contenu.installations)) {
    if (i.arbre !== "lontan") continue;
    if ((i.niveaux ?? []).some(n => (n.requiert?.savoirs ?? []).some(s => sait.has(s)))) sortie.add(i.cle);
  }
  for (const r of liste(contenu.recettes)) if ((r.requiert?.savoirs ?? []).some(s => sait.has(s))) sortie.add(clePlanRecette(r.cle));
  if (sait.has("zerbaz") && indexer(contenu).recettes.has("tisanes")) sortie.add(clePlanRecette("tisanes"));
  return [...sortie].sort();
}
export const CAHIER_DICTE = "cahier-dicte";
export const OBJET_CAHIER = "cahier-de-gramoune";
// Un papier (le system d'un équipement) : { plans, unique }. Un cahier dicté d'avant ce lot n'a ni plans ni unique : ses plans se
// déduisent de ce qu'il enseigne.
export function papierDe(system = {}, contenu = {}) {
  const plans = [...(system?.plans ?? [])].filter(Boolean);
  const unique = typeof system?.unique === "string" ? system.unique : "";
  if (system?.cle === OBJET_CAHIER && !plans.length && (system.enseigne ?? []).length) {
    return { plans: plansDuCahierDicte(system.enseigne, contenu), unique: unique || CAHIER_DICTE };
  }
  return { plans, unique };
}
export const estPapier = (system = {}, contenu = {}) => papierDe(system, contenu).plans.length > 0;
// Le plan (du registre, ou un plan unique de rareté haute) qui fait la valeur d'un papier.
export function defDuPapier(contenu, papier = {}) {
  if (papier.unique) return planDuRegistre(contenu, papier.unique) ?? { cle: papier.unique, unique: true, rarete: [90, 100], couvre: [...(papier.plans ?? [])] };
  return planPourCle(contenu, papier.plans?.[0]);
}
export const valeurPapier = (contenu, papier = {}, circulation = {}) => valeurPlan(defDuPapier(contenu, papier), { circulation });

// Ce que le groupe connaît : carnet ∪ par cœur (des membres vivants) ∪ plans uniques en main. -> [cle] trié
export function plansConnus({ carnet = [], parCoeur = [], uniques = [] } = {}) {
  return [...new Set([...(carnet ?? []), ...(parCoeur ?? []).flat(), ...(uniques ?? []).flat()].filter(Boolean))].sort();
}
// Une recette avec son plan : 25 % d'ingrédients en moins et la moitié du travail (arrondis au supérieur), comme une installation.
export function recetteAvecPlan(recette, connus = []) {
  if (!recette) return recette;
  const plan = (connus ?? []).includes(clePlanRecette(recette.cle));
  if (!plan) return { ...recette, plan: false };
  return { ...recette, cout: coutAvecPlans(recette.cout ?? {}, true), travail: Math.max(1, Math.ceil((Number(recette.travail) || 0) * PLANS.travail)), plan: true };
}

// Veillées pour apprendre un plan par cœur.
export const veilleesPourApprendre = def => REGLES_PLANS.enseigner.base + Math.floor(rareteMoyenne(def) / REGLES_PLANS.enseigner.parRarete);
// Une veillée d'apprentissage par cœur. eleve : system (plans, planEnCours, savoirs) ; cle : la clé du carnet ; connus : ce que le
// groupe connaît (on n'apprend que ce que quelqu'un sait, ou ce qu'un plan unique en main montre).
// -> { ok, motifs, system, fait, requis, termine }
export function veilleePlan(eleve = {}, { cle = "", contenu = {}, connus = [] } = {}) {
  const motifs = [];
  const refus = (c, params = {}, texte = c) => motifs.push(message(c, params, texte));
  const nom = nomDuPlan(contenu, cle);
  if (!cibleExiste(contenu, cle)) refus("plan-inconnu", { plan: cle }, `plan inconnu : ${cle}`);
  else if (!(connus ?? []).includes(cle)) refus("plan-pas-connu", { plan: nom }, `personne ici ne connaît ce plan : ${nom}`);
  if ((eleve.plans ?? []).includes(cle)) refus("plan-deja-appris", { plan: nom }, `le sait déjà par cœur : ${nom}`);
  const lu = peutLirePlan(contenu, cle, eleve.savoirs ?? []);
  if (cibleExiste(contenu, cle) && !lu.ok) refus("plan-illisible", { plan: nom, savoirs: lu.manque.join(", ") }, `il lui manque le savoir-faire (${lu.manque.join(", ")}) pour le comprendre`);
  if (motifs.length) return { ok: false, motifs, system: eleve, fait: 0, requis: 0, termine: false };
  const requis = veilleesPourApprendre(planPourCle(contenu, cle));
  const avant = eleve.planEnCours && eleve.planEnCours.plan === cle ? Number(eleve.planEnCours.fait) || 0 : 0;
  const fait = avant + 1;
  const termine = fait >= requis;
  const system = { ...structuredClone(eleve), planEnCours: termine ? null : { plan: cle, fait, requis } };
  if (termine) system.plans = [...new Set([...(eleve.plans ?? []), cle])];
  return { ok: true, motifs: [], system, fait, requis, termine };
}

// ------------------------------------------------------------------ la part secrète du monde
// monde.plans : { lieux: { "<site>" | "region:<région>": jour où il rend de nouveau }, uniques: [clé sortie], rares: { lieu: { prochain,
// tires: [clé] } }, cyclones: { région: jour du dernier cyclone } }. Absent d'un monde d'avant ce lot : vide.
export function plansDuMonde(monde = {}) {
  const p = monde?.plans ?? {};
  return { lieux: { ...(p.lieux ?? {}) }, uniques: [...(p.uniques ?? [])], rares: structuredClone(p.rares ?? {}), cyclones: { ...(p.cyclones ?? {}) } };
}

// ------------------------------------------------------------------ trouver en fouillant
const poidsDeBase = def => Math.max(1, 110 - rareteMoyenne(def)) / 10;
// La chance qu'une fouille « plans » trouve un plan. site : la définition du site (ou null : la région).
export function chanceDePlan({ site = null, n = 1, prudence = "normal" } = {}) {
  const F = REGLES_PLANS.fouille;
  const base = site ? F.sites[site.type] ?? 0.05 : F.region;
  return Math.min(F.max, base * Math.min(F.equipe, Math.sqrt(Math.max(0, Number(n) || 0) / 2)) * (F.prudence[prudence] ?? 1));
}
// Ce qu'on peut tirer à cet endroit -> [[cle du registre, poids]]. Plans ordinaires dont les lieux contiennent le type du site (sans site :
// tous les plans ordinaires qui ne sont pas rares), plans propres au site (même rares), plans uniques pas encore sortis.
export function plansDuLieu(contenu, { site = null, uniquesSortis = [], connus = [] } = {}) {
  const P = REGLES_PLANS.fouille.poids;
  const propres = new Set(site?.plans ?? []);
  const sortie = [], uniques = [];
  for (const def of plansDuRegistre(contenu)) {
    const ici = site ? (def.lieux ?? []).includes(site.type) : !def.unique;
    if (def.unique) {
      if ((ici || propres.has(def.cle)) && !uniquesSortis.includes(def.cle)) uniques.push(def.cle);
      continue;
    }
    const duSite = propres.has(def.cle);
    if (!duSite && (!ici || estRare(def))) continue;
    const connu = couvertureDe(def).every(k => (connus ?? []).includes(k));
    sortie.push([def.cle, poidsDeBase(def) * (duSite ? P.duSite : 1) * (connu ? P.connu : 1)]);
  }
  // Les plans uniques à la fin, chacun un dixième du reste.
  const total = sortie.reduce((x, [, w]) => x + w, 0) || 1;
  return [...sortie, ...uniques.map(k => [k, total * P.unique])];
}
const cleLieuFouille = (region, site) => (site ? site.cle : `region:${region}`);
// La fouille « plans » (actions.mjs, fouiller). -> { plan: clé du registre | null, chance, prochain: jour | null, monde }
export function chercherPlan(monde, contenu, hasard, { region, site = null, n = 1, prudence = "normal", jour = 0, connus = [] } = {}) {
  const F = REGLES_PLANS.fouille;
  const nouveau = structuredClone(monde ?? {});
  const p = plansDuMonde(nouveau);
  const cle = cleLieuFouille(region, site);
  const prochain = Number(p.lieux[cle]);
  if (Number.isFinite(prochain) && jour < prochain) return { plan: null, chance: 0, prochain, monde: nouveau };
  const c = chanceDePlan({ site, n, prudence });
  if (!chance(c, hasard)) return { plan: null, chance: c, prochain: null, monde: nouveau };
  const plan = tirerPoids(plansDuLieu(contenu, { site, uniquesSortis: p.uniques, connus }), hasard) ?? null;
  if (!plan) return { plan: null, chance: c, prochain: null, monde: nouveau };
  const retour = site ? F.retour[site.type] ?? F.retourDefaut : F.retourRegion;
  p.lieux[cle] = jour + retour;
  if (planDuRegistre(contenu, plan)?.unique) p.uniques = [...new Set([...p.uniques, plan])];
  nouveau.plans = p;
  return { plan, chance: c, prochain: jour + retour, monde: nouveau };
}

// ------------------------------------------------------------------ les lieux à plans
// ctx : { jour, dateDepart, cyclones: { région: jour }, eruption: monde.eruption } -> { ouverte, motifs: [{ cle, params, texte }] }
export function fenetreLieu(lieu, { jour = 0, dateDepart, cyclones = {}, eruption = null } = {}) {
  const f = lieu?.fenetre ?? {};
  const motifs = [];
  const non = (cle, params, texte) => motifs.push(message(cle, params, texte));
  if (f.saison && saisonDuJour(jour, dateDepart) !== f.saison) non(`plans-fenetre-saison-${f.saison}`, {}, f.saison === "seche" ? "seulement en saison sèche" : "seulement en saison des pluies");
  if (f.lune && lune(dateDuJour(jour, dateDepart).iso)?.phase !== f.lune) non("plans-fenetre-lune", {}, "seulement à la nouvelle lune");
  if (f.apresCyclone) {
    const c = Number(cyclones?.[lieu.region]);
    const ecart = Number.isFinite(c) ? jour - c : -1;
    if (!(ecart >= 1 && ecart <= Number(f.apresCyclone))) non("plans-fenetre-cyclone", { n: f.apresCyclone }, `seulement dans les ${f.apresCyclone} jours après un cyclone`);
  }
  if (f.horsEruption && eruption && (eruption.regions ?? []).includes(lieu.region) && jour >= Number(eruption.debut) && jour <= Number(eruption.fin) + Number(f.horsEruption)) {
    non("plans-fenetre-eruption", {}, "pas pendant une éruption, ni tant que la coulée fume");
  }
  return { ouverte: motifs.length === 0, motifs };
}
// Les lieux dont la fenêtre s'ouvre ce jour (fermée la veille). -> [lieu]
export function fenetresQuiSouvrent(contenu, { jour = 0, dateDepart, cyclones = {}, eruption = null } = {}) {
  return lieuxAPlansDe(contenu).filter(l => Object.keys(l.fenetre ?? {}).length
    && fenetreLieu(l, { jour, dateDepart, cyclones, eruption }).ouverte && !fenetreLieu(l, { jour: jour - 1, dateDepart, cyclones, eruption }).ouverte);
}
// Où en est un lieu. -> { prochain: jour | null, revenir: Boolean, tires: [clé] }
export function etatLieuAPlans(monde, lieu, jour = 0) {
  const r = plansDuMonde(monde).rares[lieu?.cle] ?? {};
  const prochain = Number.isFinite(Number(r.prochain)) ? Number(r.prochain) : null;
  return { prochain, revenir: prochain !== null && jour < prochain, tires: [...(r.tires ?? [])] };
}
// Tirer un plan dans un lieu à plans (la garde passée : c'est au MJ). -> { ok, motifs, plan, monde, prochain }
export function tirerDuLieu(monde, contenu, lieu, hasard, { jour = 0, dateDepart, connus = [] } = {}) {
  const nouveau = structuredClone(monde ?? {});
  const p = plansDuMonde(nouveau);
  if (!lieu) return { ok: false, motifs: [message("plans-lieu-inconnu", {}, "lieu à plans inconnu")], plan: null, monde: nouveau, prochain: null };
  const fen = fenetreLieu(lieu, { jour, dateDepart, cyclones: p.cyclones, eruption: nouveau.eruption });
  if (!fen.ouverte) return { ok: false, motifs: fen.motifs, plan: null, monde: nouveau, prochain: null };
  const e = etatLieuAPlans(nouveau, lieu, jour);
  if (e.revenir) return { ok: false, motifs: [message("plans-lieu-revenir", { jour: e.prochain }, `rien de plus à trouver avant le jour ${e.prochain}`)], plan: null, monde: nouveau, prochain: e.prochain };
  const options = (lieu.tirage ?? []).filter(x => {
    const def = planDuRegistre(contenu, x.plan);
    return def && !(def.unique && p.uniques.includes(def.cle));
  }).map(x => {
    const def = planDuRegistre(contenu, x.plan);
    const connu = !def.unique && couvertureDe(def).every(k => (connus ?? []).includes(k));
    return [x.plan, Number(x.poids || 1) * (connu ? REGLES_PLANS.fouille.poids.connu : 1) * (e.tires.includes(x.plan) ? REGLES_PLANS.lieu.dejaTire : 1)];
  });
  const plan = tirerPoids(options, hasard) ?? null;
  const prochain = jour + Math.max(1, Number(lieu.retour) || 30);
  p.rares[lieu.cle] = { prochain, tires: plan ? [...new Set([...e.tires, plan])] : e.tires };
  if (plan && planDuRegistre(contenu, plan)?.unique) p.uniques = [...new Set([...p.uniques, plan])];
  nouveau.plans = p;
  return { ok: true, motifs: [], plan, monde: nouveau, prochain };
}
// Le cyclone qui frappe aujourd'hui (alerte rouge) : ses régions gardent la date (pour les lieux « après un cyclone »).
export function noterCyclone(monde, jour) {
  const c = monde?.cyclone;
  if (!c || c.alerte !== "rouge" || Number(c.arrivee) !== Number(jour)) return monde;
  const p = plansDuMonde(monde);
  for (const r of c.trajectoire ?? []) p.cyclones[r] = jour;
  return { ...monde, plans: p };
}

// ------------------------------------------------------------------ l'étagère aux cahiers
// Ses places et sa protection : la meilleure installation en service qui a effets.bibliotheque. -> { places, protege, niveau }
export function etagereDeLAbri(installations = [], contenu = {}) {
  let sortie = { places: 0, protege: false, niveau: 0 };
  for (const i of installations ?? []) {
    if (!(Number(i.niveau) >= 1) || Number(i.etat) >= 3) continue;
    const def = indexer(contenu).installations.get(i.cle);
    const b = niveauDe(def, Number(i.niveau))?.effets?.bibliotheque;
    if (b && Number(b.places) > sortie.places) sortie = { places: Number(b.places), protege: Boolean(b.protege), niveau: Number(i.niveau) };
  }
  return sortie;
}
// Ce que la partie publique garde des plans : etat.plans = { circulation: { cle: n }, etagere: [{ id, name, system }] }.
export function plansDeLEtat(etat = {}) {
  const p = etat?.plans ?? {};
  return { circulation: { ...(p.circulation ?? {}) }, etagere: structuredClone(p.etagere ?? []) };
}
// Ranger un papier. -> { ok, motif, etagere }
export function rangerSurEtagere(etagere = [], papier, { places = 0 } = {}) {
  if (!(places > 0)) return { ok: false, motif: message("etagere-absente", {}, "il n'y a pas d'étagère aux cahiers en service à l'abri"), etagere };
  if (etagere.length >= places) return { ok: false, motif: message("etagere-pleine", { n: places }, `l'étagère est pleine (${places} papiers)`), etagere };
  return { ok: true, motif: null, etagere: [...etagere, structuredClone(papier)] };
}
// Ce qu'on perd : vol (une brèche faite par des vivants), feu, eau (un cyclone qui abîme l'abri). Protégée (le coffre) : rien au feu
// ni à l'eau, au plus un papier volé. -> { etagere, perdus: [papier] }
export function perteEtagere(etagere = [], { cause = "vol", protege = false, hasard = Math.random } = {}) {
  const E = REGLES_PLANS.etagere;
  if (!etagere.length) return { etagere: [], perdus: [] };
  let n = 0;
  if (cause === "vol") n = protege ? entier(E.volProtege[0], E.volProtege[1], hasard) : entier(E.vol[0], E.vol[1], hasard);
  else if (cause === "feu") n = protege ? 0 : Math.ceil(etagere.length * E.feu);
  else if (cause === "eau") n = protege ? 0 : E.eau;
  n = Math.min(etagere.length, Math.max(0, n));
  if (!n) return { etagere: structuredClone(etagere), perdus: [] };
  const ordre = melanger(etagere.map((_, i) => i), hasard).slice(0, n);
  return { etagere: etagere.filter((_, i) => !ordre.includes(i)), perdus: ordre.map(i => structuredClone(etagere[i])) };
}

// ------------------------------------------------------------------ vérification du contenu (fabricant, essais)
export function erreursPlans(contenu = {}) {
  const e = [];
  const idx = indexer(contenu);
  const vus = new Set(), carnet = new Map();
  for (const p of plansDuRegistre(contenu)) {
    const ou = `plan « ${p.cle} »`;
    if (!p.cle) { e.push("plan sans clé"); continue; }
    if (vus.has(p.cle)) e.push(`${ou} : clé en double`);
    vus.add(p.cle);
    const r = p.rarete;
    if (!Array.isArray(r) || r.length !== 2 || !(Number(r[0]) >= 0) || !(Number(r[1]) <= 100) || !(Number(r[0]) <= Number(r[1]))) e.push(`${ou} : rareté [min, max] entre 0 et 100`);
    const couvre = couvertureDe(p);
    if (!couvre.length) e.push(`${ou} : ne couvre rien`);
    for (const k of couvre) if (!cibleExiste(contenu, k)) e.push(`${ou} : cible inconnue « ${k} »`);
    for (const t of p.lieux ?? []) if (!TYPES_SITE.includes(t)) e.push(`${ou} : type de site inconnu « ${t} »`);
    for (const s of p.savoirs ?? []) if (!idx.savoirs.has(s)) e.push(`${ou} : savoir inconnu « ${s} »`);
    if (p.unique) {
      if (!p.nom || !p.description) e.push(`${ou} : un plan unique a un nom et une description`);
      if (!idx.equipements.has(p.objet)) e.push(`${ou} : objet inconnu « ${p.objet} »`);
      for (const s of p.enseigne ?? []) if (!idx.savoirs.has(s)) e.push(`${ou} : enseigne un savoir inconnu « ${s} »`);
    } else {
      if (couvre.length !== 1) e.push(`${ou} : un plan ordinaire couvre une seule cible`);
      for (const k of couvre) { if (carnet.has(k)) e.push(`${ou} : « ${k} » déjà couvert par « ${carnet.get(k)} »`); carnet.set(k, p.cle); }
      if (!estRare(p) && !(p.lieux ?? []).length) e.push(`${ou} : un plan qui n'est pas rare se trouve quelque part (lieux)`);
    }
  }
  for (const s of liste(contenu.sites)) for (const k of s.plans ?? []) if (!vus.has(k)) e.push(`site ${s.cle} : plan inconnu « ${k} »`);
  for (const l of liste(contenu.lieuxAPlans)) {
    const ou = `lieu à plans « ${l.cle} »`;
    if (!idx.regions.has(l.region)) e.push(`${ou} : région inconnue « ${l.region} »`);
    if (l.site && idx.sites.get(l.site)?.region !== l.region) e.push(`${ou} : site « ${l.site} » hors de sa région`);
    if (!l.nom || !l.description) e.push(`${ou} : nom et description`);
    if (!GARDES_LIEU.includes(l.garde?.type) || !l.garde?.texte) e.push(`${ou} : garde (milieu ou livides, avec son texte)`);
    if (l.garde?.test && (!COMPETENCES.includes(l.garde.test.competence) || !(l.garde.test.difficulte in DIFFICULTES))) e.push(`${ou} : test de garde`);
    if (l.garde?.rencontre && !liste(contenu.bestiaire).some(b => b.cle === l.garde.rencontre.creature)) e.push(`${ou} : créature inconnue « ${l.garde.rencontre.creature} »`);
    for (const k of Object.keys(l.fenetre ?? {})) if (!CHAMPS_FENETRE.includes(k)) e.push(`${ou} : fenêtre « ${k} »`);
    if (l.fenetre?.saison && !SAISONS.includes(l.fenetre.saison)) e.push(`${ou} : saison « ${l.fenetre.saison} »`);
    if (l.fenetre?.lune && !PHASES_LUNE.includes(l.fenetre.lune)) e.push(`${ou} : lune « ${l.fenetre.lune} »`);
    if (Object.keys(l.fenetre ?? {}).length && !l.fenetreTexte) e.push(`${ou} : la fenêtre se dit (fenetreTexte)`);
    if (!(Number(l.retour) >= 1)) e.push(`${ou} : retour en jours`);
    if ((l.tirage ?? []).length < 3) e.push(`${ou} : on y tire un plan parmi plusieurs (3 au moins)`);
    for (const x of l.tirage ?? []) {
      const def = planDuRegistre(contenu, x.plan);
      if (!def) e.push(`${ou} : plan inconnu « ${x.plan} »`);
      if (!(Number(x.poids) > 0)) e.push(`${ou} : poids de « ${x.plan} »`);
    }
    if (!(l.tirage ?? []).some(x => estRare(planDuRegistre(contenu, x.plan) ?? {}))) e.push(`${ou} : un lieu à plans rares tire au moins un plan rare`);
  }
  return e;
}
