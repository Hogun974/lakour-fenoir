// Le jour qu'on croit, les cartes et les calendriers (lot « cartes », 2026-11-17 ; lot 3 de l'inventaire du jeu 3D, famille 1 du
// complément : « Savoir quel jour et quelle heure il est », « Les cartes et les calendriers se trouvent », « Le journal est un
// livre »). Logique pure, sans Foundry.
//
// Ce que le lot fêtes avait déjà posé (lune.mjs) reste tel quel : la lune, la clarté, et la date LUE DANS LA NATURE quand le
// téléphone et la radio sont morts (« début février, lune gibbeuse, les longanis »). Ce fichier y ajoute ce que le groupe CROIT :
// - le compte des jours (etat.compte) : noté chaque jour par celui qui le tient, il reste sûr ; sans calendrier, il devient
//   incertain au bout de 10 jours d'encoches (30 avec une planche des jours) ; un jour sans le noter le fait dériver (30 % de
//   chances que le jour soit sauté, 10 % qu'il soit compté deux fois) ; 3 jours de suite (2 sans calendrier), il est perdu ;
// - le jour reçu d'un autre (qui peut mentir), la lune lue sur un calendrier (à 2 jours près, 1 avec les marées) ;
// - l'heure lue dans le ciel (à une demi-heure près par beau temps, trois heures par nuit couverte, perdue sous terre) ;
// - les cartes et les calendriers trouvés : ce qu'ils couvrent, de quand ils datent, les routes telles qu'elles étaient imprimées
//   (rien des Livides) ; où l'on en trouve en fouillant ;
// - le journal d'un mort : il reste sur le corps, on le lit sur place.
// Chiffres et raisons : docs/equilibre-cartes.md ; contrat §20.
import { borner } from "./constantes.mjs";
import { dateDuJour, saisonDuMois } from "./temps.mjs";
import { lune, MOIS_SYNODIQUE } from "./lune.mjs";
import { peutAgir } from "./survivant.mjs";
import { message } from "./textes.mjs";
import { liste, regionDe, regionsDe } from "./contenu.mjs";

const JOUR_MS = 86400000;
// "AAAA-MM-JJ" -> jours depuis l'époque (UTC) ; null si illisible.
function epoque(iso) {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(iso ?? ""));
  return m ? Math.round(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])) / JOUR_MS) : null;
}
// Le jour de jeu (depuis dateDepart, négatif avant le jour zéro) d'une date ISO ; null si illisible.
export function jourDeLaDate(iso, dateDepart) {
  const a = epoque(iso), b = epoque(dateDepart);
  return a === null || b === null ? null : a - b;
}
const joursDuMois = (annee, mois) => new Date(Date.UTC(annee, mois, 0)).getUTCDate();
const iso = (a, m, j) => `${String(a).padStart(4, "0")}-${String(m).padStart(2, "0")}-${String(j).padStart(2, "0")}`;

// ================================================================ Le compte des jours
export const CERTITUDES = ["sur", "a-peu-pres", "perdu"];
export const REGLES_COMPTE = {
  // Encoches avant le doute, selon ce sur quoi on compte : rien (le carnet), la planche des jours. Avec un calendrier de l'année
  // qu'on coche, on reste sûr.
  encoches: { "": 10, planche: 30 },
  // Jours de suite sans noter avant de perdre le compte : avec un calendrier de l'année, 3 ; sinon 2.
  perdre: { calendrier: 3, autre: 2 },
  oubli: 0.3,          // un jour non noté : sauté (le compte prend du retard)
  deuxFois: 0.1,       // un jour non noté : compté deux fois (le compte prend de l'avance)
  lune: { marge: 2, erreur: 1, margeMarees: 1, erreurMarees: 0 },
  // Celui qui tient le compte ne note pas le jour s'il est mourant (4 blessures), épuisé (fatigue 5) ou confus (le Gris au stade 5) ;
  // au fond du trou (moral 0), il oublie un jour sur trois.
  empeche: { blessures: 4, fatigue: 5, gris: 5 },
  moral: { seuil: 0, chance: 1 / 3 },
  recu: { marge: 1 },
  // Le journal d'un mort de son groupe : la marge grandit d'un jour tous les 3 jours depuis sa mort (l'état du corps).
  journal: { margeParJours: 3 }
};

// Le compte au jour zéro : on sait le jour, il est déjà noté. teneur : l'acteur qui tient le compte ("" : personne).
export const compteDepart = (jour = 0, teneur = "") => ({
  jourCru: Number(jour) || 0, certitude: "sur", noteLe: Number(jour) || 0, oublieLe: null, joursSansNoter: 0, marge: 0, encoches: 0,
  teneur: String(teneur ?? ""), recu: null
});
// Un compte lisible (champs manquants remplis). Sans compte (partie d'avant ce lot) : celui que la date du groupe disait déjà —
// sûr tant que le téléphone ou la radio la donnaient, perdu sinon (la date ne se lisait plus que dans la nature).
export function compteDe(etat, { jour = null } = {}) {
  const j = jour ?? Math.floor((Number(etat?.horloge?.quart) || 0) / 4);
  const c = etat?.compte;
  if (!c || typeof c !== "object") {
    const base = compteDepart(j, etat?.groupe?.membres?.[0] ?? "");
    return etat?.calendrier?.exacte === false ? { ...base, certitude: "perdu", noteLe: null, joursSansNoter: 0 } : base;
  }
  return {
    ...compteDepart(j), ...structuredClone(c),
    certitude: CERTITUDES.includes(c.certitude) ? c.certitude : "sur",
    jourCru: Number.isFinite(Number(c.jourCru)) ? Number(c.jourCru) : j,
    marge: Math.max(0, Number(c.marge) || 0), encoches: Math.max(0, Number(c.encoches) || 0), joursSansNoter: Math.max(0, Number(c.joursSansNoter) || 0)
  };
}
export const jourConnu = c => (c && c.certitude !== "perdu" ? Number(c.jourCru) : null);
// L'écart entre le jour cru et le vrai (au MJ seul) ; null si le compte est perdu.
export const ecartDuCompte = (c, jour) => (c && c.certitude !== "perdu" ? Number(c.jourCru) - Number(jour) : null);

// Peut-il noter le jour ? (vivant, pas mourant, pas épuisé, pas confus par le Gris)
export function peutNoter(s) {
  if (!peutAgir(s)) return false;
  const E = REGLES_COMPTE.empeche;
  return (Number(s?.blessures) || 0) < E.blessures && (Number(s?.fatigue) || 0) < E.fatigue
    && !(s?.infection?.atteint && (Number(s.infection.stade) || 0) >= E.gris);
}

// Le jour `jour` a-t-il été noté ? teneur : le système de celui qui tient le compte (null s'il n'est pas là) ; present : il est
// dans le groupe. -> { note, raison: "note" (à la main) | "tenu" | "oublie" (le MJ l'a dit) | "sans-teneur" | "absent" | "mort" |
// "empeche" | "moral" }. Le hasard ne sert qu'au moral bas.
export function noteDuJour(c, jour, { teneur = null, present = false, hasard = Math.random } = {}) {
  if (c.oublieLe !== null && c.oublieLe !== undefined && Number(c.oublieLe) === Number(jour)) return { note: false, raison: "oublie" };
  if (c.noteLe !== null && c.noteLe !== undefined && Number(c.noteLe) === Number(jour)) return { note: true, raison: "note" };
  if (!c.teneur) return { note: false, raison: "sans-teneur" };
  if (!present || !teneur) return { note: false, raison: "absent" };
  if (!peutAgir(teneur)) return { note: false, raison: "mort" };
  if (!peutNoter(teneur)) return { note: false, raison: "empeche" };
  if ((Number(teneur.moral ?? 4)) <= REGLES_COMPTE.moral.seuil && hasard() < REGLES_COMPTE.moral.chance) return { note: false, raison: "moral" };
  return { note: true, raison: "tenu" };
}

// La fin du jour `jour` (repris du 3D, CompteDesJours::fin_du_jour). support : "calendrier" (un calendrier de l'année qu'on coche),
// "planche" (la planche des jours), "" (des encoches dans un carnet). -> le compte du jour suivant.
export function finDuJour(c, jour, { note = false, support = "", hasard = Math.random } = {}) {
  if (c.certitude === "perdu") return { ...c, jourCru: c.jourCru + 1, joursSansNoter: c.joursSansNoter + 1 };
  if (note) {
    const s = { ...c, jourCru: c.jourCru + 1, joursSansNoter: 0, noteLe: Number(jour) };
    if (support === "calendrier") return { ...s, encoches: 0 };
    s.encoches = c.encoches + 1;
    if (s.certitude === "sur" && s.encoches >= (REGLES_COMPTE.encoches[support] ?? REGLES_COMPTE.encoches[""])) return { ...s, certitude: "a-peu-pres", marge: Math.max(1, s.marge) };
    return s;
  }
  const u = hasard();
  const avance = u < REGLES_COMPTE.oubli ? 0 : u < REGLES_COMPTE.oubli + REGLES_COMPTE.deuxFois ? 2 : 1;
  const joursSansNoter = c.joursSansNoter + 1;
  const seuil = support === "calendrier" ? REGLES_COMPTE.perdre.calendrier : REGLES_COMPTE.perdre.autre;
  return { ...c, jourCru: c.jourCru + avance, certitude: joursSansNoter >= seuil ? "perdu" : "a-peu-pres", joursSansNoter, marge: c.marge + 1 };
}

// Le jour sûr (téléphone, radio) : le compte repart juste, celui qui le tient reste le même.
export const savoirLeJour = (c, jour) => ({ ...compteDepart(jour, c?.teneur ?? ""), noteLe: Number(jour) });

// Un jour reçu de quelqu'un (PNJ, communauté, journal d'un mort) : il est cru et noté, avec son auteur. S'il était faux, on ne le
// découvre qu'en recoupant (la lune sur un calendrier de l'année, un autre qui dit autre chose).
export function recevoirJour(c, { jourAnnonce, jour, de = "", marge = REGLES_COMPTE.recu.marge } = {}) {
  return { ...c, jourCru: Number(jourAnnonce), certitude: "a-peu-pres", noteLe: Number(jour), oublieLe: null, joursSansNoter: 0, marge: Math.max(1, Number(marge) || 1),
    encoches: 0, recu: { de: String(de ?? ""), le: Number(jour), annonce: Number(jourAnnonce) } };
}

// Chaque nouveau jour (etat.mjs, avancer) : `jour` est le jour qui commence. exacte : le téléphone marche là où est le groupe, ou la
// radio de l'abri. -> { compte, note: { note, raison } | null, evenement: "retrouve" | "doute" | "perdu" | "manque" | null }
export function journeeCompte(c, { jour, exacte = false, support = "", teneur = null, present = false, hasard = Math.random } = {}) {
  if (exacte) return { compte: savoirLeJour(c, jour), note: null, evenement: c.certitude === "sur" ? null : "retrouve" };
  const n = noteDuJour(c, jour - 1, { teneur, present, hasard });
  const s = finDuJour(c, jour - 1, { note: n.note, support, hasard });
  let evenement = null;
  if (c.certitude !== "perdu" && s.certitude === "perdu") evenement = "perdu";
  else if (c.certitude === "sur" && s.certitude === "a-peu-pres") evenement = n.note ? "doute" : "manque";
  else if (!n.note && c.certitude !== "perdu" && c.joursSansNoter === 0) evenement = "manque";
  return { compte: s, note: n, evenement };
}

// Le texte d'un événement du compte (journal public). raison : celle de noteDuJour quand le jour n'a pas été noté.
export function texteCompte(evenement, { nom = "", raison = "" } = {}) {
  switch (evenement) {
    case "retrouve": return message("compte-retrouve", {}, "La date revient (le téléphone ou la radio) : le compte des jours repart juste.");
    case "doute": return message("compte-doute", {}, "Les encoches se brouillent : on n'est plus tout à fait sûr du jour.");
    case "perdu": return message("compte-perdu", {}, "Personne n'a noté les jours : on ne sait plus quel jour on est.");
    case "manque": {
      if (raison === "sans-teneur") return message("compte-manque-personne", {}, "Personne ne tient le compte des jours : hier n'a pas été noté.");
      if (nom && ["absent", "mort", "empeche", "moral"].includes(raison)) return message(`compte-manque-${raison}`, { nom }, {
        absent: `${nom} n'était pas là pour noter le jour.`, mort: `Personne n'a repris le compte des jours que tenait ${nom}.`, empeche: `${nom} était trop mal pour noter le jour.`, moral: `${nom} a oublié de noter le jour.` }[raison]);
      return message("compte-manque", {}, "Le jour d'hier n'a pas été noté.");
    }
    default: return null;
  }
}

// ================================================================ La lune lue sur un calendrier
// L'année et le mois qu'on croit : ceux du jour cru ; si le compte est perdu, le mois se lit dans la nature (le vrai), dans l'année
// la plus proche du jour cru.
function moisCru(c, jour, dateDepart) {
  const cru = dateDuJour(c.jourCru, dateDepart);
  if (c.certitude !== "perdu") return { annee: cru.annee, mois: cru.mois };
  const vrai = dateDuJour(jour, dateDepart);
  const candidats = [cru.annee - 1, cru.annee, cru.annee + 1].map(a => ({ annee: a, d: Math.abs(jourDeLaDate(iso(a, vrai.mois, 15), dateDepart) - c.jourCru) }));
  candidats.sort((x, y) => x.d - y.d);
  return { annee: candidats[0].annee, mois: vrai.mois };
}

// Lire la lune (une nuit où on la voit) sur un calendrier : on cherche, dans le mois qu'on croit, le jour du calendrier où la lune
// a cette tête-là. Sur un calendrier d'une autre année, les lunes tombent faux : le jour trouvé l'est aussi, sans qu'on le sache.
// calendrier : { annee, lunes, marees }. -> { ok, motif, compte, trouve, avant (jour cru d'avant), autreAnnee }
export function lireLaLune(c, { jour, dateDepart, calendrier = null, hasard = Math.random } = {}) {
  const refus = (cle, texte) => ({ ok: false, motif: message(cle, {}, texte), compte: c, trouve: null, avant: c.jourCru, autreAnnee: false });
  if (!calendrier) return refus("lune-sans-calendrier", "il faut un calendrier où les lunes sont marquées");
  if (!calendrier.lunes) return refus("lune-sans-lunes", "ce calendrier ne marque pas les lunes");
  const annee = Number(calendrier.annee);
  if (!Number.isFinite(annee) || annee < 1900) return refus("lune-sans-calendrier", "il faut un calendrier où les lunes sont marquées");
  const vue = lune(dateDuJour(jour, dateDepart).iso)?.age ?? 0;
  const { annee: anneeCrue, mois } = moisCru(c, jour, dateDepart);
  const n = Math.min(joursDuMois(annee, mois), joursDuMois(anneeCrue, mois));
  let meilleur = 1, ecart = Infinity;
  for (let d = 1; d <= n; d++) {
    const brut = (((lune(iso(annee, mois, d))?.age ?? 0) - vue) % MOIS_SYNODIQUE + MOIS_SYNODIQUE) % MOIS_SYNODIQUE;
    const e = Math.min(brut, MOIS_SYNODIQUE - brut);
    if (e < ecart) { ecart = e; meilleur = d; }
  }
  const L = REGLES_COMPTE.lune;
  const erreur = calendrier.marees ? L.erreurMarees : L.erreur;
  const trouve = jourDeLaDate(iso(anneeCrue, mois, meilleur), dateDepart) + (erreur ? Math.floor(hasard() * (2 * erreur + 1)) - erreur : 0);
  const compte = { ...c, jourCru: trouve, certitude: "a-peu-pres", noteLe: Number(jour), oublieLe: null, joursSansNoter: 0, encoches: 0,
    marge: calendrier.marees ? L.margeMarees : L.marge, recu: { de: "lune", le: Number(jour), annonce: trouve } };
  return { ok: true, motif: null, compte, trouve, avant: c.jourCru, autreAnnee: annee !== anneeCrue };
}

// ================================================================ L'heure lue dans le ciel
// Lever et coucher du soleil à La Réunion (heures décimales), selon la saison (repris du 3D).
export const SOLEIL = { pluies: { lever: 5.6, coucher: 18.8 }, seche: { lever: 6.7, coucher: 17.8 } };
export const MARGES_HEURE = { "jour-clair": 0.5, "jour-couvert": 1.5, "nuit-claire": 1.5, "nuit-couverte": 3 };
// -> { exacte, marge (heures ; null : perdue), cle: "exacte" | "cadran" | "jour-clair" | "jour-couvert" | "nuit-claire" |
// "nuit-couverte" | "sous-terre" }. exacte : téléphone, radio ou montre ; cadran : un cadran solaire à l'abri (le jour, au soleil).
export function heureLue({ moment = "matin", couvert = false, pluie = false, sousTerre = false, exacte = false, cadran = false } = {}) {
  if (exacte) return { exacte: true, marge: 0, cle: "exacte" };
  if (sousTerre) return { exacte: false, marge: null, cle: "sous-terre" };
  const nuit = moment === "soir" || moment === "nuit";
  const bouche = Boolean(couvert || pluie);
  if (!nuit && !bouche && cadran) return { exacte: true, marge: 0, cle: "cadran" };
  const cle = nuit ? (bouche ? "nuit-couverte" : "nuit-claire") : (bouche ? "jour-couvert" : "jour-clair");
  return { exacte: false, marge: MARGES_HEURE[cle], cle };
}
// Le lever et le coucher du soleil d'un mois ("5 h 36", "18 h 48").
const hm = h => `${Math.floor(h)} h ${String(Math.round((h % 1) * 60)).padStart(2, "0")}`;
export const soleilDuMois = mois => { const s = SOLEIL[saisonDuMois(Number(mois))]; return { lever: hm(s.lever), coucher: hm(s.coucher) }; };

// ================================================================ Les cartes et les calendriers
export const TYPES_REPERE = ["carte", "calendrier", "montre", "planche", "cadran", "cahier", "encre"];
export const RARETES_REPERE = ["commune", "peu-commune", "rare"];
export const ANNEES_CALENDRIER = ["courante", "postes", "passee"];
export const TERRAINS_CARTE = ["route", "piste", "sentier"];
// Les lieux où l'on fouille : les types de sites, et « region » (une fouille sans site : des cases au hasard).
export const LIEUX_REPERE = ["region", "maison", "case-creole", "immeuble", "ecole", "commerce", "ferme", "gite", "ilet", "caserne", "hopital", "port",
  "phare", "usine", "eglise", "tunnel-de-lave", "autre"];

// Le repère d'un équipement (définition du registre, ou système d'un objet) ; null s'il n'en a pas.
export const repereDe = o => o?.repere ?? o?.system?.repere ?? null;
// Les équipements du registre qui sont des repères.
export const reperesDuContenu = contenu => liste(contenu?.equipements).filter(e => e?.repere?.type);

// Ce qu'un objet trouvé ou donné garde pour lui (posé sur l'objet au moment où il entre en jeu) : l'année d'un calendrier, les
// régions d'une carte (déchirée : une moitié de l'île ; d'un cirque, d'une ville : laquelle), l'annotation d'un mort, l'année
// d'impression. region : là où on l'a trouvé ; jour, dateDepart : la date de jeu.
// -> le repère complet de l'objet ({ ...def.repere, annee?, regions?, annotation?, imprimee? })
export function resoudreRepere(def, { jour = 0, dateDepart, region = "", contenu = {}, hasard = Math.random } = {}) {
  const r = structuredClone(repereDe(def) ?? {});
  const d = dateDuJour(jour, dateDepart);
  const entre = (min, max) => min + Math.floor(hasard() * (Math.max(min, max) - min + 1));
  if (r.type === "calendrier" && !Number(r.annee)) {
    const regle = ANNEES_CALENDRIER.includes(r.annee) ? r.annee : "courante";
    r.annee = regle === "postes" ? d.annee + (d.mois >= 11 ? 1 : 0) : regle === "passee" ? d.annee - entre(1, 4) : d.annee;
  }
  if (r.type === "carte") {
    const toutes = regionsDe(contenu).map(x => x.cle);
    if (!Array.isArray(r.regions)) {
      const couvre = r.couvre ?? "ile";
      if (couvre === "ile") r.regions = toutes;
      else if (couvre === "region") r.regions = [regionDe(contenu, region) ? region : toutes[Math.floor(hasard() * toutes.length)]].filter(Boolean);
      else if (Array.isArray(couvre?.un) && couvre.un.length) r.regions = [couvre.un.includes(region) ? region : couvre.un[Math.floor(hasard() * couvre.un.length)]];
      else if (Array.isArray(couvre)) r.regions = [...couvre];
      else r.regions = toutes;
      if (r.dechiree) {
        // Une moitié de la carte : l'ouest ou l'est de l'île (d'après les repères de la scène).
        const xs = r.regions.map(k => Number(regionDe(contenu, k)?.repere?.x) || 0).sort((a, b) => a - b);
        const milieu = xs[Math.floor(xs.length / 2)] ?? 0;
        const ouest = hasard() < 0.5;
        r.moitie = ouest ? "ouest" : "est";
        r.regions = r.regions.filter(k => ((Number(regionDe(contenu, k)?.repere?.x) || 0) < milieu) === ouest);
      }
    }
    if (Array.isArray(r.annotations) && r.annotations.length && !Number.isInteger(r.annotation)) r.annotation = Math.floor(hasard() * r.annotations.length);
    if (!Number(r.imprimee)) {
      const [min, max] = Array.isArray(r.ilYa) ? r.ilYa : [1, 3];
      r.imprimee = d.annee - entre(Number(min) || 0, Number(max) || 0);
    }
  }
  return r;
}

// Un calendrier vaut pour son année : celle qu'on croit vivre.
export const calendrierValable = (rep, annee) => rep?.type === "calendrier" && Number(rep.annee) === Number(annee);
// Sur quoi le groupe compte les jours, l'année qu'il croit vivre étant `annee` : "calendrier" | "planche" | "".
export function supportDuCompte(reperes = [], annee) {
  if (reperes.some(r => calendrierValable(r, annee))) return "calendrier";
  if (reperes.some(r => r?.type === "planche")) return "planche";
  return "";
}
// Le calendrier pour lire la lune : un de l'année qu'on croit, à marées d'abord ; sinon un autre qui marque les lunes (faux).
export function calendrierPourLaLune(reperes = [], annee) {
  const lunes = reperes.filter(r => r?.type === "calendrier" && r.lunes);
  const rang = r => (Number(r.annee) === Number(annee) ? 2 : 0) + (r.marees ? 1 : 0);
  return [...lunes].sort((a, b) => rang(b) - rang(a))[0] ?? null;
}
export const aUneMontre = (reperes = []) => reperes.some(r => r?.type === "montre");
export const aUnCadran = (reperes = []) => reperes.some(r => r?.type === "cadran");

// Les routes telles que les cartes du groupe les montrent (imprimées : avant la crise, rien des Livides). cartes : [{ nom, repere }].
// -> { [region]: { routes: { voisine: etat }, sources: [{ nom, imprimee }], notes: [texte] } } (les régions couvertes seulement).
// Une route se lit sur une carte si l'une de ses deux régions y est et si son terrain y figure ; la carte la plus récente l'emporte.
export function ceQueDisentLesCartes(cartes = [], contenu = {}) {
  const sortie = {};
  const tri = [...cartes].filter(c => repereDe(c)?.type === "carte").sort((a, b) => (Number(repereDe(a).imprimee) || 0) - (Number(repereDe(b).imprimee) || 0));
  for (const c of tri) {
    const r = repereDe(c);
    const terrains = Array.isArray(r.terrains) && r.terrains.length ? r.terrains : ["route"];
    const couvertes = Array.isArray(r.regions) ? r.regions : regionsDe(contenu).map(x => x.cle);
    const imprimees = r.routesImprimees ?? {};
    for (const k of couvertes) {
      const reg = regionDe(contenu, k);
      if (!reg) continue;
      const ici = sortie[k] ??= { routes: {}, sources: [], notes: [] };
      if (!ici.sources.some(s => s.nom === c.nom)) ici.sources.push({ nom: c.nom ?? "", imprimee: Number(r.imprimee) || null });
      for (const v of reg.voisins ?? []) {
        if (!terrains.includes(v.terrain)) continue;
        ici.routes[v.region] = imprimees[`${k}|${v.region}`] ?? imprimees[`${v.region}|${k}`] ?? "ouverte";
      }
      const note = r.notes?.[k];
      if (note && !ici.notes.includes(note)) ici.notes.push(note);
    }
    const a = Number.isInteger(r.annotation) ? r.annotations?.[r.annotation] : null;
    if (a?.region && regionDe(contenu, a.region)) {
      const ici = sortie[a.region] ??= { routes: {}, sources: [], notes: [] };
      if (!ici.notes.includes(a.texte)) ici.notes.push(a.texte);
    }
  }
  return sortie;
}

// Une fouille trouve-t-elle une carte ou un calendrier ? Un seul tirage : chaque repère du registre a sa chance selon le lieu
// (repere.lieux : { type de site | "region": chance }). -> la définition trouvée, ou null.
export function tirerRepere(contenu, { lieu = "region", hasard = Math.random } = {}) {
  const u = hasard();
  let cumul = 0;
  for (const def of reperesDuContenu(contenu)) {
    cumul += Math.max(0, Number(def.repere.lieux?.[lieu]) || 0);
    if (u < cumul) return def;
  }
  return null;
}
// La chance totale de trouver un repère en fouillant ce lieu.
export const chanceRepere = (contenu, lieu = "region") => reperesDuContenu(contenu).reduce((s, d) => s + Math.max(0, Number(d.repere.lieux?.[lieu]) || 0), 0);

// Les erreurs de forme d'un repère du registre (le fabricant et les essais s'en servent). -> [texte]
export const ETATS_ROUTE_CARTE = ["ouverte", "difficile", "coupee"];
export function erreursRepere(def, contenu = {}) {
  const e = [];
  const r = repereDe(def);
  const ou = `équipement ${def?.cle}`;
  if (!r) return def?.categorie === "repere" ? [`${ou} : catégorie « repere » sans repère`] : [];
  if (def.categorie !== "repere") e.push(`${ou} : un repère doit être de catégorie « repere »`);
  if (!TYPES_REPERE.includes(r.type)) e.push(`${ou} : type de repère « ${r.type} »`);
  if (r.rarete && !RARETES_REPERE.includes(r.rarete)) e.push(`${ou} : rareté « ${r.rarete} »`);
  for (const [l, p] of Object.entries(r.lieux ?? {})) if (!LIEUX_REPERE.includes(l) || !(Number(p) > 0 && Number(p) <= 0.2)) e.push(`${ou} : lieu « ${l} » ou chance ${p}`);
  const existe = k => Boolean(regionDe(contenu, k));
  if (r.type === "carte") {
    if ((r.terrains ?? []).some(x => !TERRAINS_CARTE.includes(x)) || !(r.terrains ?? []).length) e.push(`${ou} : terrains de la carte`);
    const c = r.couvre ?? "ile";
    if (!(c === "ile" || c === "region" || (Array.isArray(c?.un) && c.un.length && c.un.every(existe)) || (Array.isArray(c) && c.every(existe)))) e.push(`${ou} : couvre`);
    if (!Array.isArray(r.ilYa) || r.ilYa.length !== 2 || !(Number(r.ilYa[0]) >= 0 && Number(r.ilYa[1]) >= Number(r.ilYa[0]))) e.push(`${ou} : ilYa`);
    for (const [k, etat] of Object.entries(r.routesImprimees ?? {})) {
      const [a, b] = k.split("|");
      if (!existe(a) || !(regionDe(contenu, a)?.voisins ?? []).some(v => v.region === b) || !ETATS_ROUTE_CARTE.includes(etat)) e.push(`${ou} : route imprimée « ${k} »`);
    }
    for (const k of Object.keys(r.notes ?? {})) if (!existe(k)) e.push(`${ou} : note sur une région inconnue « ${k} »`);
    for (const a of r.annotations ?? []) if (!existe(a.region) || !String(a.texte ?? "").trim() || typeof a.vraie !== "boolean") e.push(`${ou} : annotation`);
  }
  if (r.type === "calendrier") {
    if (!ANNEES_CALENDRIER.includes(r.annee)) e.push(`${ou} : année du calendrier « ${r.annee} »`);
    if (r.marees && !r.lunes) e.push(`${ou} : des marées sans les lunes`);
  }
  return e;
}
// La chance totale par lieu ne dépasse pas cette borne (moins d'une fouille sur trois rend un repère).
export const CHANCE_REPERE_MAX = 0.3;

// ================================================================ Le journal d'un mort
// Ce qu'un mort du groupe emporte dans son journal (posé à sa mort sur son entrée de etat.morts) : le jour qu'il croyait, la
// certitude, et les plans du groupe.
export const journalAuDeces = (compte, plans = []) => ({ jourCru: Number(compte?.jourCru) || 0, certitude: compte?.certitude ?? "sur", plans: [...plans] });

// Lire le journal d'un mort du groupe : il reste sur le corps, on le lit sur place (la région où il est mort ; pas un Livide qu'on
// n'a pas retrouvé ; pas après le repos, il est enterré avec lui). -> { ok, motif, mort, jourAnnonce (null : son compte était
// perdu), marge, plans }
export function lireJournalDuMort(etat, ref, { jour = 0, region = "" } = {}) {
  const m = (etat?.morts ?? []).find(x => x.id === ref || x.nom === ref) ?? null;
  const refus = (cle, params, texte) => ({ ok: false, motif: message(cle, params, texte), mort: m, jourAnnonce: null, marge: 0, plans: [] });
  if (!m) return refus("mort-inconnu", { nom: ref }, `mort inconnu : ${ref}`);
  if (!m.journal) return refus("journal-absent", { nom: m.nom }, `${m.nom} n'avait pas de journal`);
  if (m.repos) return refus("journal-enterre", { nom: m.nom }, `le journal de ${m.nom} est parti avec lui`);
  if (m.livide && !m.retrouve) return refus("journal-livide", { nom: m.nom }, `le journal est sur ${m.nom}, qui marche encore`);
  if (region && m.region && m.region !== region) return refus("journal-loin", { nom: m.nom }, `le corps de ${m.nom} n'est pas ici`);
  const depuis = Math.max(0, Number(jour) - Math.floor((Number(m.quart) || 0) / 4));
  const perdu = m.journal.certitude === "perdu";
  return { ok: true, motif: null, mort: m, jourAnnonce: perdu ? null : Number(m.journal.jourCru) + depuis,
    marge: REGLES_COMPTE.recu.marge + Math.floor(depuis / REGLES_COMPTE.journal.margeParJours), plans: [...(m.journal.plans ?? [])] };
}

// Un journal trouvé (d'un inconnu) : ses renseignements s'ajoutent à ceux du groupe s'ils sont plus récents (source « journal » :
// l'infestation, l'eau, le courant et une note ; le pillage, les routes et les factions ne se lisent que sur place).
// lus : { region: { vu (jour de jeu de l'entrée), infestation?, electricite?, eau?, notes? } }. -> { renseignements, regions: [cle] }
export const CHAMPS_JOURNAL = ["infestation", "electricite", "eau", "notes"];
export function renseignementsDuJournal(renseignements = {}, lus = {}, { jour = 0, contenu = {} } = {}) {
  const sortie = structuredClone(renseignements);
  const regions = [];
  for (const [k, l] of Object.entries(lus ?? {})) {
    if (!regionDe(contenu, k) || !l || typeof l !== "object") continue;
    const vu = Math.min(Number(jour), Number.isFinite(Number(l.vu)) ? Number(l.vu) : Number(jour));
    const ancien = sortie[k] ?? {};
    if (ancien.vu !== null && ancien.vu !== undefined && Number(ancien.vu) >= vu) continue;
    const champs = Object.fromEntries(CHAMPS_JOURNAL.filter(c => l[c] !== undefined && l[c] !== null && l[c] !== "").map(c => [c, l[c]]));
    if (champs.notes && ancien.notes) champs.notes = `${ancien.notes} ${champs.notes}`;
    const vuDirect = ancien.vuDirect ?? (ancien.source === "vu" ? ancien.vu ?? null : null);
    sortie[k] = { routes: {}, factions: [], pillage: "inconnu", infestation: "inconnue", electricite: null, eau: null, notes: "", ...ancien, ...champs, vu, source: "journal", vuDirect };
    regions.push(k);
  }
  return { renseignements: sortie, regions };
}

// Les bornes d'un nombre de jours donné par le MJ.
export const bornerJours = n => borner(Math.floor(Number(n) || 0), -3650, 3650);
