// Bâtir et défendre (lot 7 du portage du jeu 3D, contrat §26 ; chiffres et raisons : docs/equilibre-batir.md). Logique pure : rien
// n'est modifié en place. Ce fichier porte ce que le lot ajoute aux installations (abri.mjs les fait vivre) :
//
// 1. Les MATÉRIAUX. Une installation est faite d'une des six familles du jeu 3D (`materiau` sur la définition, ou sur un niveau) ;
//    chacune laisse passer une part des dégâts du cyclone, du feu, de la pluie et des Livides. Sans matériau dit : le bois sous tôle,
//    dont la part au cyclone (0,5) redonne la chance d'avant (25 % par point de dégâts).
// 2. L'ENTRETIEN. Un niveau peut porter `entretien: { tousLes (jours), travail (quarts-personne), encrassement (0..1), arret,
//    lavee (la pluie nettoie), panne (chance par jour), vie (jours) }`. Passé son délai sans soin, une installation perd un cran
//    d'état (pleine marche, 75 %, 50 %, hors service) ; une installation qui s'encrasse (panneaux, pico-hydro, roue) ne perd pas
//    d'état mais produit moins (ou plus du tout) jusqu'au nettoyage. Le soin se fait chaque jour par ceux qui sont à la tâche de
//    l'installation (ses bras) ou au chantier, à l'abri ; ou à la demande (entretenirInstallation, API `entretenir`). Une panne se
//    tire chaque jour (flux de hasard à part) ; une installation qui a une `vie` (les batteries) perd un cran tous les `vie` jours.
//    Le suivi d'une instance : `suivi: { le (jour du dernier soin), negligence (crans perdus faute de soin), encrasse, vieLe }`.
//    Une partie d'avant le lot (sans suivi) commence à compter le jour où elle passe ici : rien n'est perdu d'un coup.
// 3. LES DÉFENSES DEVANT LES LIVIDES. `effets.piege` (fosse, chausse-trapes, douves : de la force retirée à un assaut de Livides,
//    la fosse se comble au-delà), `effets.hauteur` (chemin de ronde : un défenseur en hauteur n'est pas frappé, ce sont les appuis
//    qu'on attaque), `effets.porte` (herse, portail, porte blindée : une porte fermée se frappe toujours), `effets.alarme` (la
//    cloche : elle prévient, et elle s'entend). Les Livides s'en prennent à l'enceinte avant le reste, à la pièce la plus faible.
// 4. LE FEU sur un abri (incendieAbri) : la pierre et le parpaing ne brûlent pas.
// 5. LA CAVE QUI S'ÉBOULE : achever un niveau creusé sans le savoir de l'étaiement, ou près d'une eau qui court, peut l'ébouler (une
//    blessure qui ne tue pas, la dernière cellule à recreuser).
// 6. Petits effets lus par abri.mjs : `effets.pousse` (une haie ne défend qu'une fois fermée), `effets.bois` (une touffe de bambous
//    regarnit les alentours), `effets.lumiere` (l'abri est éclairé la nuit : lot « sens »), `effets.remise` (places pour les charrettes
//    et les vélos, lot 6), `effets.fete` (la salle verte, lot 12), `expose` sur la définition (exposée au cyclone quelle que soit sa
//    catégorie).
import { borner } from "./constantes.mjs";
import { installationDe, niveauDe } from "./contenu.mjs";
import { message } from "./textes.mjs";

const n0 = x => Number(x) || 0;

// ------------------------------------------------------------------ 1. les matériaux
// faiblesses : la part des dégâts qui passe (jeu 3D, docs/equilibre.md du 3D, « Bâtir par pièces ») ; lontan : matières de l'île.
export const MATERIAUX = {
  "paille-et-torchis": { lontan: true, faiblesses: { cyclone: 0.9, feu: 1, pluie: 0.6, livides: 0.7 } },
  "bambou-et-vacoa": { lontan: true, faiblesses: { cyclone: 0.7, feu: 0.9, pluie: 0.4, livides: 0.6 } },
  "bois-sous-tole": { lontan: false, faiblesses: { cyclone: 0.5, feu: 0.8, pluie: 0.2, livides: 0.4 } },
  "tole-de-recuperation": { lontan: false, faiblesses: { cyclone: 0.8, feu: 0.1, pluie: 0.3, livides: 0.5 } },
  "pierre-seche": { lontan: true, faiblesses: { cyclone: 0.2, feu: 0, pluie: 0.1, livides: 0.1 } },
  "parpaing-et-beton": { lontan: false, faiblesses: { cyclone: 0.05, feu: 0, pluie: 0, livides: 0.05 } }
};
export const MATERIAUX_CLES = Object.keys(MATERIAUX);
export const MATERIAU_DEFAUT = "bois-sous-tole";
export const CAUSES_DEGATS = ["cyclone", "feu", "pluie", "livides"];

export const REGLES_OUVRAGES = {
  // Cyclone : chance par point de dégâts = base × part du matériau (bois sous tôle : 0,5 × 0,5 = 25 %, comme avant le lot).
  cyclone: { base: 0.5, exposeDes: 0.7 },
  // Le feu : chance par point de force = base × part du matériau ; un abri qui brûle prend aussi des dégâts (force ≥ 2).
  feu: { base: 0.5, degatsAbri: 2 },
  // La pluie use le torchis : un jour où il pleut au moins la moitié du jour, son délai d'entretien avance d'un jour de plus.
  pluie: { seuil: 0.5, usure: 0.6 },
  // La pluie lave ce qui s'encrasse dehors (panneaux) : un jour de pluie recule l'encrassement de deux jours.
  lavage: { seuil: 0.5, jours: 2 },
  // Le soin courant : chaque présent à la tâche donne un quart de soin par jour.
  soinParPersonne: 1,
  // Pièges : une fosse se comble au-delà de `comble` fois sa force (« cinq Livides par niveau »).
  piege: { comble: 4 },
  // La cave : sans le savoir de l'étaiement, une chance d'éboulement quand on achève un niveau ; près d'une eau qui court, en plus.
  // Un éboulement rebouche la dernière cellule : `perte` quarts de travail à refaire.
  eboulement: { sansEtai: 0.25, presDeLEau: 0.25, savoir: "etaiement-galeries", perte: 6 }
};

// Le matériau d'une installation à un niveau (le niveau, puis la définition ; une lontan sans matériau : bambou et vacoa).
export function materiauDe(def, niveau = 1) {
  const n = niveauDe(def, Math.max(1, n0(niveau) || 1));
  const m = n?.materiau || def?.materiau || (def?.arbre === "lontan" ? "bambou-et-vacoa" : MATERIAU_DEFAUT);
  return MATERIAUX[m] ? m : MATERIAU_DEFAUT;
}
export const faiblesse = (def, niveau, cause) => Number(MATERIAUX[materiauDe(def, niveau)].faiblesses[cause] ?? 0);

// ------------------------------------------------------------------ cyclone
const CATEGORIES_AU_VENT = ["eau", "nourriture", "energie", "defense"];   // celles d'abri.mjs (CATEGORIES_EXPOSEES)
// Exposée au cyclone : sa catégorie (comme avant), ou `expose: true` sur la définition (une paillote, une tonnelle) ; jamais sous terre.
export function exposeeAuCyclone(def) {
  if (!def || def.categorie === "souterrain") return false;
  if (typeof def.expose === "boolean") return def.expose;
  return CATEGORIES_AU_VENT.includes(def.categorie);
}
export const chanceCyclone = (def, niveau) => REGLES_OUVRAGES.cyclone.base * faiblesse(def, niveau, "cyclone");

// ------------------------------------------------------------------ 2. l'entretien
// L'entretien d'un niveau, complet. -> null (rien à entretenir) | { tousLes, travail, encrassement, arret, lavee, panne, vie }
export function entretienDe(def, niveau = 1) {
  const e = niveauDe(def, Math.max(1, n0(niveau) || 1))?.entretien;
  if (!e || typeof e !== "object") return null;
  const tousLes = Math.max(0, Math.round(n0(e.tousLes)));
  const panne = borner(n0(e.panne), 0, 1), vie = Math.max(0, Math.round(n0(e.vie)));
  if (!tousLes && !panne && !vie) return null;
  return { tousLes, travail: Math.max(1, Math.round(n0(e.travail) || 1)), encrassement: borner(n0(e.encrassement), 0, 1), arret: Boolean(e.arret),
    lavee: Boolean(e.lavee), panne, vie };
}
// Le suivi d'une instance, complet (une partie d'avant le lot : rien, à poser au premier jour).
export function suiviDe(instance) {
  const s = instance?.suivi;
  if (!s || typeof s !== "object") return null;
  const nombreOuNul = x => (x === null || x === undefined || !Number.isFinite(Number(x)) ? null : Number(x));
  return { le: nombreOuNul(s.le), negligence: Math.max(0, Math.round(n0(s.negligence))), encrasse: Boolean(s.encrasse), vieLe: nombreOuNul(s.vieLe),
    ...(n0(s.fait) > 0 ? { fait: n0(s.fait) } : {}), ...(n0(s.avance) > 0 ? { avance: n0(s.avance) } : {}) };
}
// La production d'une installation encrassée : × (1 − encrassement), 0 si elle s'arrête. -> facteur
export function facteurEntretien(instance, def, niveau) {
  const e = entretienDe(def, niveau);
  if (!e || !e.encrassement && !e.arret) return 1;
  if (!suiviDe(instance)?.encrasse) return 1;
  return e.arret ? 0 : 1 - e.encrassement;
}
// La tâche qui soigne une installation : celle de ses bras, sinon le chantier.
export function tacheDeSoin(def, niveau) {
  return niveauDe(def, niveau)?.effets?.bras?.tache || def?.bras?.tache || "chantier";
}
// Où en est l'entretien d'une instance au jour donné. -> { du, retard, encrasse, negligence, prochain } | null
export function etatEntretien(instance, def, jour = 0) {
  const niveau = n0(instance?.niveau);
  const e = niveau >= 1 ? entretienDe(def, niveau) : null;
  if (!e || !e.tousLes) return null;
  const s = suiviDe(instance);
  const le = s?.le ?? n0(jour);
  const retard = n0(jour) - le + n0(s?.avance) - e.tousLes;
  return { du: retard >= 0, retard, encrasse: Boolean(s?.encrasse), negligence: s?.negligence ?? 0, prochain: le + e.tousLes, travail: e.travail };
}
// Les entretiens dus (ou dus d'ici `marge` jours), du plus en retard au moins. -> [{ cle, id, retard, travail, tache }]
export function entretiensDus(installations = [], contenu = {}, { jour = 0, marge = 0 } = {}) {
  const dus = [];
  for (const inst of installations ?? []) {
    const def = installationDe(contenu, inst?.cle);
    const et = def ? etatEntretien(inst, def, jour) : null;
    if (!et || n0(inst.etat) >= 3) continue;
    if (et.retard + marge >= 0 || et.encrasse || et.negligence > 0) dus.push({ cle: inst.cle, id: inst.id ?? null, retard: et.retard, travail: et.travail, tache: tacheDeSoin(def, n0(inst.niveau)),
      encrasse: et.encrasse, negligence: et.negligence });
  }
  return dus.sort((a, b) => b.retard - a.retard);
}

// Un soin (à la demande, ou le soin courant) : -> { instance, soigne, reste } ; soigner remet le délai à zéro, nettoie, et rattrape un
// cran perdu faute de soin (pas une casse : celle-là se répare, reparerInstallation).
export function entretenirInstallation(instance, def, { quarts = 1, bras = 1, jour = 0 } = {}) {
  const i = structuredClone(instance ?? {});
  const e = entretienDe(def, n0(i.niveau));
  if (!e || !e.tousLes || n0(i.niveau) < 1) return { instance: i, soigne: false, reste: 0 };
  const s = suiviDe(i) ?? { le: n0(jour), negligence: 0, encrasse: false, vieLe: null };
  const fait = n0(s.fait) + Math.max(0, n0(quarts)) * Math.max(0, n0(bras));
  if (fait < e.travail) { i.suivi = { ...s, fait }; return { instance: i, soigne: false, reste: e.travail - fait }; }
  const rattrape = s.negligence > 0 && n0(i.etat) > 0 ? 1 : 0;
  i.etat = borner(n0(i.etat) - rattrape, 0, 3);
  // Une installation remise à neuf (réparée entre-temps) n'a plus de cran perdu à rattraper.
  i.suivi = { le: n0(jour), negligence: i.etat > 0 ? Math.min(i.etat, Math.max(0, s.negligence - rattrape)) : 0, encrasse: false, vieLe: s.vieLe };
  return { instance: i, soigne: true, rattrape, reste: 0 };
}

// La journée des installations (après journeeAbri) : soins courants, usure faute de soin, encrassement, pluie, pannes, vieillesse.
// bras : { tache: nombre de présents à la tâche } ; pluie : la part du jour où il a plu (0..1) ; hasard : un flux à part.
// -> { installations, evenements: [{ cle, installation, ... }] } (cles : ouvrage-soigne, ouvrage-use, ouvrage-encrasse,
//    ouvrage-panne, ouvrage-vieillit)
export function journeeOuvrages(installations = [], contenu = {}, { jour = 0, pluie = 0, bras = {}, hasard = Math.random } = {}) {
  const R = REGLES_OUVRAGES;
  const budget = Object.fromEntries(Object.entries(bras ?? {}).map(([t, n]) => [t, Math.max(0, n0(n)) * R.soinParPersonne]));
  const evenements = [];
  const sorties = (installations ?? []).map(inst => structuredClone(inst));
  // Les plus en retard d'abord : le soin courant va où il presse.
  const retardDe = x => {
    const e = entretienDe(x.def, n0(x.inst.niveau)), s = suiviDe(x.inst);
    return e.tousLes && s?.le !== null && s?.le !== undefined ? n0(jour) - s.le + n0(s.avance) - e.tousLes : -Infinity;
  };
  const ordre = sorties.map((inst, k) => ({ inst, k, def: installationDe(contenu, inst?.cle) }))
    .filter(x => x.def && n0(x.inst.niveau) >= 1 && entretienDe(x.def, n0(x.inst.niveau)))
    .sort((a, b) => retardDe(b) - retardDe(a) || a.k - b.k);
  for (const x of ordre) {
    const { def } = x;
    const niveau = n0(x.inst.niveau);
    const e = entretienDe(def, niveau);
    let s = suiviDe(x.inst);
    // Une installation d'avant le lot, ou neuve : le délai part d'aujourd'hui.
    if (!s || s.le === null) s = { ...(s ?? {}), le: n0(jour), negligence: s?.negligence ?? 0, encrasse: s?.encrasse ?? false, vieLe: s?.vieLe ?? null };
    if (s.vieLe === null && e.vie) s.vieLe = n0(jour);
    const tourne = n0(x.inst.etat) < 3 && x.inst.actif !== false;
    if (e.tousLes) {
      // La pluie : elle use le torchis (un jour d'avance sur son délai), elle lave ce qui s'encrasse dehors.
      if (n0(pluie) >= R.pluie.seuil && faiblesse(def, niveau, "pluie") >= R.pluie.usure) s.avance = n0(s.avance) + 1;
      if (e.lavee && n0(pluie) >= R.lavage.seuil) s.le = Math.min(n0(jour), s.le + R.lavage.jours);
      const du = n0(jour) - s.le + n0(s.avance) >= e.tousLes;
      const tache = tacheDeSoin(def, niveau);
      if ((du || s.encrasse || s.negligence > 0) && n0(x.inst.etat) < 3 && n0(budget[tache]) >= e.travail) {
        budget[tache] -= e.travail;
        const r = entretenirInstallation({ ...x.inst, suivi: s }, def, { quarts: e.travail, bras: 1, jour });
        x.inst.etat = r.instance.etat;
        s = suiviDe(r.instance);
        evenements.push({ cle: "ouvrage-soigne", installation: x.inst.cle, rattrape: r.rattrape ?? 0 });
      } else if (du) {
        if (e.encrassement || e.arret) {
          if (!s.encrasse) evenements.push({ cle: "ouvrage-encrasse", installation: x.inst.cle, arret: e.arret });
          s.encrasse = true;
        } else if (n0(x.inst.etat) < 3) {
          x.inst.etat = borner(n0(x.inst.etat) + 1, 0, 3);
          s.negligence += 1;
          evenements.push({ cle: "ouvrage-use", installation: x.inst.cle, etat: x.inst.etat });
        }
        s.le = n0(jour);
        s.avance = 0;
      }
    }
    // Les pannes : tirées chaque jour pour ce qui tourne (même ordre, même nombre de tirages quel que soit le reste).
    if (e.panne) {
      const tire = hasard();
      if (tourne && tire < e.panne) {
        x.inst.etat = borner(n0(x.inst.etat) + 1, 0, 3);
        evenements.push({ cle: "ouvrage-panne", installation: x.inst.cle, etat: x.inst.etat });
      }
    }
    // La vieillesse (les batteries) : un cran tous les `vie` jours de service.
    if (e.vie && n0(jour) - s.vieLe >= e.vie) {
      x.inst.etat = borner(n0(x.inst.etat) + 1, 0, 3);
      s.vieLe = n0(jour);
      evenements.push({ cle: "ouvrage-vieillit", installation: x.inst.cle, etat: x.inst.etat });
    }
    x.inst.suivi = { le: s.le, negligence: s.negligence, encrasse: s.encrasse, vieLe: s.vieLe, ...(n0(s.fait) > 0 ? { fait: s.fait } : {}),
      ...(n0(s.avance) > 0 ? { avance: s.avance } : {}) };
    sorties[x.k] = x.inst;
  }
  return { installations: sorties, evenements };
}

// ------------------------------------------------------------------ 3. les défenses devant les Livides
// Ce que les installations en état (pas hors service) font devant un assaut. installations : instances.
// -> { piege, pieges: [{ cle, id, piege }], hauteur: [{ cle, id }], portes: [{ cle, id }], alarme }
export function ouvragesDeLAbri(installations = [], contenu = {}, { jour = null } = {}) {
  const o = { piege: 0, pieges: [], hauteur: [], portes: [], alarme: false };
  for (const inst of installations ?? []) {
    const niveau = n0(inst?.niveau);
    if (niveau < 1 || n0(inst.etat) >= 3) continue;
    const def = installationDe(contenu, inst.cle);
    const e = niveauDe(def, niveau)?.effets ?? {};
    if (jour !== null && !haieFermee(inst, e, jour)) continue;
    if (n0(e.piege) > 0) { o.pieges.push({ cle: inst.cle, id: inst.id ?? null, piege: n0(e.piege) }); o.piege += n0(e.piege); }
    if (e.hauteur) o.hauteur.push({ cle: inst.cle, id: inst.id ?? null });
    if (e.porte) o.portes.push({ cle: inst.cle, id: inst.id ?? null });
    if (e.alarme) o.alarme = true;
  }
  return o;
}
// Une haie (effets.pousse) ne défend qu'une fois fermée : `pousse` jours après sa plantation.
export const haieFermee = (instance, effets, jour) => !(n0(effets?.pousse) > 0) || n0(jour) - n0(instance?.termineLe) >= n0(effets.pousse);

// Avant les dés : les pièges ôtent de la force à un assaut de Livides ; un piège débordé se comble (un cran d'état, à vider).
// -> { force (au moins 1), retire, comblees: [{ cle, id }] }
export function forceDevantOuvrages({ force = 1, livides = false, ouvrages = null } = {}) {
  const f = Math.max(1, Math.round(n0(force)));
  if (!livides || !ouvrages?.pieges?.length) return { force: f, retire: 0, comblees: [] };
  let reste = f, retire = 0;
  const comblees = [];
  for (const p of ouvrages.pieges) {
    const pris = Math.min(p.piege, Math.max(0, reste - 1));
    retire += pris;
    reste -= pris;
    if (f > REGLES_OUVRAGES.piege.comble * p.piege) comblees.push({ cle: p.cle, id: p.id });
  }
  return { force: Math.max(1, f - retire), retire, comblees };
}

// Après les dés : devant des Livides, des défenseurs en hauteur (une garde présente, un chemin de ronde qui tient) ne sont pas
// frappés : il n'y a pas de brèche, ce sont les appuis qu'on attaque (l'issue devient « endommagée », sans blessé).
// r : le résultat de resoudreAssaut. -> { ...r, hauteurTient, appuis: { cle, id } | null }
export function issueDevantOuvrages(r, { livides = false, ouvrages = null, garde = false } = {}) {
  const h = ouvrages?.hauteur?.[0] ?? null;
  if (!livides || !garde || !h || r.issue !== "breche") return { ...r, hauteurTient: false, appuis: null };
  return { ...r, issue: "endommagee", degats: 1, blesses: 0, installationEndommagee: true, hauteurTient: true, appuis: h };
}

// L'installation que l'assaut abîme. Des Livides tenus dehors (l'issue « endommagée ») : une porte fermée d'abord (elle se frappe
// toujours), sinon l'enceinte (les installations de défense), plus souvent sa pièce la plus faible, sinon n'importe quoi, plus souvent ce
// qui est fragile. Des Livides entrés (une brèche) : n'importe quoi, plus souvent ce qui est fragile. Des vivants, des bêtes : au hasard,
// comme avant le lot. installations : instances ; appuis : ce que la hauteur désigne ; issue : celle de l'assaut. -> instance | null
export function cibleDesDegats(installations = [], contenu = {}, { livides = false, appuis = null, issue = "endommagee", hasard = Math.random } = {}) {
  const cibles = (installations ?? []).filter(i => n0(i?.niveau) >= 1 && n0(i.etat) < 3);
  if (!cibles.length) return null;
  if (appuis) { const a = cibles.find(i => (appuis.id && i.id === appuis.id) || i.cle === appuis.cle); if (a) return a; }
  if (!livides) return cibles[Math.floor(hasard() * cibles.length)] ?? null;
  const defs = new Map(cibles.map(i => [i, installationDe(contenu, i.cle)]));
  const effets = i => niveauDe(defs.get(i), n0(i.niveau))?.effets ?? {};
  const dedans = issue === "breche";
  const portes = dedans ? [] : cibles.filter(i => effets(i).porte);
  if (portes.length) return portes[Math.floor(hasard() * portes.length)];
  const fragilite = i => Math.max(0.01, faiblesse(defs.get(i), n0(i.niveau), "livides"));
  const enceinte = dedans ? [] : cibles.filter(i => defs.get(i)?.categorie === "defense" && n0(effets(i).defense) > 0);
  const parmi = enceinte.length ? enceinte : cibles;
  const total = parmi.reduce((t, i) => t + fragilite(i), 0);
  let x = hasard() * total;
  for (const i of parmi) { x -= fragilite(i); if (x < 0) return i; }
  return parmi.at(-1);
}

// ------------------------------------------------------------------ 4. le feu
// Un incendie sur l'abri (force 1 à 3 : un foyer vite éteint, un feu de cour, l'abri qui flambe) : chaque installation, sauf sous
// terre, prend un cran par point de force avec la chance de son matériau (la pierre et le parpaing ne brûlent pas) ; à force 2 et
// plus, l'abri lui-même prend des dégâts. -> { installations, brulees: [{ cle, points }], epargnees: [cle], degatsAbri }
export function incendieAbri(installations = [], contenu = {}, { force = 1 } = {}, hasard = Math.random) {
  const f = borner(Math.round(n0(force)), 0, 3);
  const brulees = [], epargnees = [];
  const sorties = (installations ?? []).map(inst => {
    const def = installationDe(contenu, inst?.cle);
    if (!def || n0(inst.niveau) < 1 || def.categorie === "souterrain") return inst;
    const p = REGLES_OUVRAGES.feu.base * faiblesse(def, n0(inst.niveau), "feu");
    let n = 0;
    for (let k = 0; k < f; k++) if (hasard() < p) n++;
    if (!p) epargnees.push(inst.cle);
    if (!n) return inst;
    brulees.push({ cle: inst.cle, points: n });
    return { ...structuredClone(inst), etat: borner(n0(inst.etat) + n, 0, 3) };
  });
  return { installations: sorties, brulees, epargnees, degatsAbri: f >= 2 ? f - 1 : 0 };
}

// ------------------------------------------------------------------ 5. la cave qui s'éboule
// La chance qu'un niveau creusé (galerie, tunnel : catégorie « souterrain ») s'éboule au moment de l'achever. -> 0..1
export function risqueEboulement({ def = null, savoirs = [], site = {} } = {}) {
  if (def?.categorie !== "souterrain") return 0;
  const R = REGLES_OUVRAGES.eboulement;
  return Math.min(1, ((savoirs ?? []).includes(R.savoir) ? 0 : R.sansEtai) + (site?.eau === "riviere" ? R.presDeLEau : 0));
}
// « À la fin du creusement » (le 3D) : un tirage quand un niveau souterrain s'achève (avancerChantier rend `termine`). Éboulé, le niveau
// n'est pas fini : la dernière cellule est à recreuser (`perte` quarts), et l'un de ceux qui creusaient prend une blessure qui ne tue pas.
// avant : l'instance avant ce temps de travail ; resultat : ce qu'a rendu avancerChantier.
// -> { chance, eboule, blesse, perdu, resultat } (resultat : celui d'avancerChantier, ou le chantier rouvert)
export function eboulement({ def = null, savoirs = [], site = {}, avant = null, resultat = null, hasard = Math.random } = {}) {
  const chance = resultat?.termine ? risqueEboulement({ def, savoirs, site }) : 0;
  if (!chance || !(hasard() < chance)) return { chance: resultat?.termine ? chance : risqueEboulement({ def, savoirs, site }), eboule: false, blesse: false, perdu: 0, resultat };
  const requis = Math.max(1, n0(avant?.chantier?.requis) || n0(resultat?.instance?.chantier?.requis));
  const perdu = Math.min(requis, REGLES_OUVRAGES.eboulement.perte);
  const instance = { ...structuredClone(avant ?? resultat.instance), chantier: { fait: requis - perdu, requis } };
  return { chance, eboule: true, blesse: true, perdu,
    resultat: { instance, termine: false, niveau: n0(instance.niveau), reste: perdu, plan: null } };
}
// Une blessure qui ne tue pas : au plus jusqu'à 3 (« grièvement blessé », pas mourant).
export const blessureQuiNeTuePas = blessures => Math.min(3, Math.max(n0(blessures), n0(blessures) + 1));

// ------------------------------------------------------------------ textes
// Les faits de la journée des installations, en messages (nom : celui de l'installation dans la langue du contenu).
export function messageOuvrage(ev, nom = ev?.installation ?? "") {
  switch (ev?.cle) {
    case "ouvrage-use": return message("ouvrage-use", { installation: nom }, `${nom} : faute d'entretien, elle tourne moins bien.`);
    case "ouvrage-encrasse": return message("ouvrage-encrasse", { installation: nom }, `${nom} s'encrasse : il faut la nettoyer.`);
    case "ouvrage-panne": return message("ouvrage-panne", { installation: nom }, `${nom} tombe en panne.`);
    case "ouvrage-vieillit": return message("ouvrage-vieillit", { installation: nom }, `${nom} a fait son temps : elle tient moins.`);
    case "ouvrage-soigne": return message("ouvrage-soigne", { installation: nom }, `${nom} est entretenue.`);
    default: return message(String(ev?.cle ?? ""), { installation: nom }, nom);
  }
}

// Vérification du contenu (fabricant, essais) : matériaux connus, entretiens bien formés, effets du lot. -> [erreur]
export function erreursOuvrages(contenu = {}) {
  const erreurs = [];
  for (const def of contenu?.installations ?? []) {
    const ou = `installation ${def.cle}`;
    if (def.materiau && !MATERIAUX[def.materiau]) erreurs.push(`${ou} : matériau « ${def.materiau} »`);
    if (def.expose !== undefined && typeof def.expose !== "boolean") erreurs.push(`${ou} : expose doit être vrai ou faux`);
    (def.niveaux ?? []).forEach((n, k) => {
      const ici = `${ou} niveau ${k + 1}`;
      if (n.materiau && !MATERIAUX[n.materiau]) erreurs.push(`${ici} : matériau « ${n.materiau} »`);
      const e = n.entretien;
      if (e) {
        if (!(n0(e.tousLes) >= 0) || (n0(e.tousLes) && n0(e.tousLes) < 3)) erreurs.push(`${ici} : entretien tous les ${e.tousLes} jours`);
        if (n0(e.travail) < 0 || n0(e.travail) > 8) erreurs.push(`${ici} : entretien de ${e.travail} quarts`);
        if (!(n0(e.panne) >= 0 && n0(e.panne) <= 0.05)) erreurs.push(`${ici} : panne ${e.panne}`);
        if (!(n0(e.encrassement) >= 0 && n0(e.encrassement) <= 1)) erreurs.push(`${ici} : encrassement ${e.encrassement}`);
      }
      const f = n.effets ?? {};
      if (f.piege !== undefined && !(n0(f.piege) >= 0 && n0(f.piege) <= 4)) erreurs.push(`${ici} : piège ${f.piege}`);
      if (f.pousse !== undefined && !(n0(f.pousse) >= 0)) erreurs.push(`${ici} : pousse ${f.pousse}`);
      if (f.bois !== undefined && !(n0(f.bois) >= 0 && n0(f.bois) <= 2)) erreurs.push(`${ici} : bois ${f.bois}`);
    });
  }
  return erreurs;
}
