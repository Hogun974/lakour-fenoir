// Le vivant de l'abri : élevage, cultures hors-sol et bêtes de l'île (lot 8 du portage de Fénoir 3D, contrat §27 ; chiffres et
// raisons : docs/equilibre-vivant.md). Logique pure : rien n'est modifié en place.
//
// Une seule règle pour tout ce qui vit à l'abri (complément du jeu 3D, famille 9, demande de Jordan du 15 novembre) :
// - Un CHEPTEL (ou un bac de plants) est porté par une installation dont un niveau a `effets.vivant` :
//   { espece | especes: [clé], places, plein, depart?, sansPompe? (jours), maladie? (facteur) }. Le bassin à curer, le filtre à
//   changer (fusion de la vague 3) : l'entretien du lot 7 (logique/ouvrages.mjs), `entretien: { tousLes, travail, eau: true, tache }`
//   sur le niveau ; son eau sale (le suivi « encrassé » de l'instance) est le manque « eau-sale ».
//   `places` : ce qu'il peut loger ; `plein` : les têtes qu'il faut pour sa production de base (celle du contenu, inchangée) ;
//   `depart` : les têtes d'une installation que le groupe vient d'achever (une installation trouvée sur un site, ou d'une partie
//   d'avant ce lot, est pleine).
// - Son état (abri.vivant[clé de l'installation]) : { espece, tetes, sante 0..3, malade: { depuis } | null, manques: [mot],
//   naissances (reliquat), sansPompe (jours), depuis (jour) } (un « filtreLe » d'avant la vague 3 est ignoré : l'entretien le suit). Absent : pleine santé, `plein` têtes (ou `depart`
//   si l'installation vient d'être achevée : etatCheptel).
// - Chaque jour (journeeVivant, appelé par journeeAbri), chaque MANQUE ôte 1 de santé : soif (l'installation s'arrête faute d'eau, ou
//   on l'a éteinte),
//   faim (selon ce que mange l'espèce : « restes » quand personne n'a mangé ce jour-là ou que personne n'est là, « herbe » sur un site sans
//   terre quand personne n'est à l'élevage, « solution » sans compost en service), panne (hors service, sans courant), eau sale
//   (filtre ou bassin à curer passé son temps, quand personne n'est à la tâche pour le faire), ombre (des plants sans soleil),
//   surpopulation (plus de têtes que de places). Malade, il perd 1 de santé tous les deux jours. Un jour sans aucun mal lui en rend 1.
//   À 0, un tiers du cheptel meurt chaque jour (au moins une tête).
// - Se reproduire demande une santé de 2 (0,6 du jeu 3D), deux têtes et une place : naissances = couples × taux de l'espèce, par
//   jour (le reliquat s'accumule). Hors de l'altitude de son espèce : production et croissance moitié, aucune naissance.
// - Production : celle du contenu × min(1, têtes ÷ plein) × vigueur (santé 0 : rien ; 1 : moitié ; 2 et 3 : entière). Un cheptel
//   vide ne boit ni ne mange.
// - Maladie : 1 à 3 % par jour selon l'espèce, × l'insalubrité de l'abri (propre ¼, ordinaire ½, sale ¾, insalubre 1 ; lot « corps »).
//   Elle passe seule 1 fois sur 10 par jour ; soignée (tisane pour les bêtes, eau changée pour les poissons, lessive de cendre pour
//   les plants : `remede` de l'espèce, un test de survie), elle cesse.
// - Bruit : un cheptel qui a eu faim ou soif crie (+1 au bruit de l'abri, +2 au plus) ; l'odeur est celle de l'installation (lot « sens »).
// - Abattre : la viande d'une tête (poule, lapin 1 ; cabri 6 ; cochon 10 ; bœuf 20 ; poissons à la part). Le troupeau baisse.
// - Les bêtes PORTÉES (etat.groupe.betes, prises en liberté ou trouvées en fouillant) : chacune tient `horsEnclos` quarts hors d'un
//   enclos de son espèce, puis meurt (une bête morte se mange encore : sa viande).
// - Les bêtes en liberté (bestiaire, catégorie « bete ») : elles n'attaquent pas ; on les prend par un test de survie (facile ou
//   normale) avec l'outil de l'espèce, ou on les chasse ; ratée, la bête file, et les autres avec.
// Rien n'est une monture : la charrette à bœufs reste de la traction ; les animaux s'élèvent, seuls les chiens s'apprivoisent.
import { borner } from "./constantes.mjs";
import { liste, niveauDe, installationDe, regionDe, siteDe } from "./contenu.mjs";
import { message } from "./textes.mjs";
import { chance } from "./hasard.mjs";
import { entretienDe, etatEntretien, suiviDe } from "./ouvrages.mjs";

export const GENRES_VIVANT = ["betes", "poissons", "plants", "essaim"];
export const MANGE_VIVANT = ["herbe", "restes", "solution", ""];
export const MANQUES_VIVANT = ["soif", "faim", "panne", "eau-sale", "ombre", "surpopulation"];
export const REGLES_VIVANT = {
  santeMax: 3,
  regain: 1,                       // un jour sans aucun mal
  morts: 1 / 3,                    // à santé 0, part du cheptel qui meurt chaque jour (au moins une tête)
  reproduction: 2,                 // santé qu'il faut pour se reproduire (0,6 du jeu 3D, sur 3)
  vigueur: [0, 0.5, 1, 1],         // production selon la santé
  horsAltitude: 0.5,               // production hors de l'altitude de l'espèce (et aucune naissance)
  maladie: { insalubrite: [0.25, 0.5, 0.75, 1], perteTousLes: 2, guerit: 0.1 },
  cri: { parCheptel: 1, max: 2 },  // bruit d'un cheptel qui a eu faim ou soif
  recent: 1,                       // jours : achevée depuis si peu, une installation commence avec son cheptel de départ
  replanter: { plants: 6, graines: 1 }    // une graine resème six plants (la tâche « cultures », un par jour)
};
// Ce qui s'occupe de chaque genre (la tâche du jour, §10.3) : cure les bassins, change les filtres, coupe l'herbe, resème.
export const TACHE_VIVANT = { betes: "elevage", poissons: "elevage", essaim: "elevage", plants: "cultures" };

const n0 = x => (Number.isFinite(Number(x)) ? Number(x) : 0);
const arrondi = (x, k = 3) => Math.round(n0(x) * 10 ** k) / 10 ** k;

// ------------------------------------------------------------------ définitions
export const especesDe = contenu => liste(contenu?.especes);
// Une espèce par sa clé, ou par un de ses alias (le porcelet et le veau moka des bêtes trouvées en fouillant, lot 5).
export const especeDe = (contenu, cle) => especesDe(contenu).find(e => e.cle === cle) ?? especesDe(contenu).find(e => (e.alias ?? []).includes(cle)) ?? null;
export const cleEspece = (contenu, cle) => especeDe(contenu, cle)?.cle ?? cle;
// L'effet `vivant` d'un niveau d'une installation (null : rien de vivant).
export const vivantDuNiveau = (def, niveau) => {
  const v = niveauDe(def, Math.max(1, n0(niveau)))?.effets?.vivant;
  return v && typeof v === "object" ? v : null;
};
export const estVivante = def => (def?.niveaux ?? []).some(n => n?.effets?.vivant);
// Les espèces qu'une installation peut loger.
export const especesPossibles = v => [...new Set([v?.espece, ...(Array.isArray(v?.especes) ? v.especes : [])].filter(Boolean))];
// L'espèce par défaut d'un cheptel : la première qui vit à cette altitude, sinon la première.
export function especeParDefaut(v, contenu, altitude = 0) {
  const possibles = especesPossibles(v);
  return possibles.find(k => dansSonAltitude(especeDe(contenu, k), altitude)) ?? possibles[0] ?? "";
}
export const dansSonAltitude = (espece, altitude = 0) => {
  const a = Array.isArray(espece?.altitude) ? espece.altitude : null;
  return !a || (n0(altitude) >= n0(a[0]) && n0(altitude) <= (a[1] === null || a[1] === undefined ? Infinity : n0(a[1])));
};

// ------------------------------------------------------------------ état d'un cheptel
// L'état d'un cheptel (copie), avec ses valeurs par défaut. inst : l'instance de l'installation ; def : sa définition.
// jour : aujourd'hui ; altitude : celle de la région de l'abri.
export function etatCheptel(abri = {}, inst = {}, def = null, contenu = {}, { jour = 0, altitude = 0 } = {}) {
  const v = vivantDuNiveau(def, inst?.niveau);
  if (!v) return null;
  const garde = abri?.vivant?.[inst.cle];
  if (garde && typeof garde === "object") {
    const st = structuredClone(garde);
    return { espece: st.espece || especeParDefaut(v, contenu, altitude), tetes: Math.max(0, Math.floor(n0(st.tetes))), sante: borner(Math.round(n0(st.sante ?? 3)), 0, 3),
      malade: st.malade && typeof st.malade === "object" ? { depuis: n0(st.malade.depuis) } : null, manques: Array.isArray(st.manques) ? st.manques : [],
      naissances: n0(st.naissances), sansPompe: n0(st.sansPompe), depuis: n0(st.depuis ?? inst.termineLe) };
  }
  // Pas encore suivi : achevée à l'instant par le groupe, elle a son cheptel de départ ; sinon (un site, une partie d'avant), pleine.
  const v1 = vivantDuNiveau(def, 1) ?? v;
  const recente = n0(inst?.termineLe) >= n0(jour) - REGLES_VIVANT.recent && n0(inst?.termineLe) >= 0;
  const tetes = recente ? Math.max(0, Math.floor(n0(v1.depart ?? v.plein))) : Math.max(0, Math.floor(n0(v.plein)));
  return { espece: especeParDefaut(v, contenu, altitude), tetes, sante: REGLES_VIVANT.santeMax, malade: null, manques: [], naissances: 0,
    sansPompe: 0, depuis: n0(inst?.termineLe) };
}

// Ce qu'un cheptel produit, en facteur de la production de base. -> { facteur, troupeau, vigueur, horsAltitude }
export function facteurCheptel(st, v, espece = null, { altitude = 0 } = {}) {
  if (!st || !v) return { facteur: 1, troupeau: 1, vigueur: 1, horsAltitude: false };
  const plein = Math.max(0, n0(v.plein));
  const troupeau = plein > 0 ? Math.min(1, n0(st.tetes) / plein) : n0(st.tetes) > 0 ? 1 : 0;
  const vigueur = REGLES_VIVANT.vigueur[borner(Math.round(n0(st.sante)), 0, 3)];
  const horsAltitude = espece ? !dansSonAltitude(espece, altitude) : false;
  return { facteur: troupeau * vigueur * (horsAltitude ? REGLES_VIVANT.horsAltitude : 1), troupeau, vigueur, horsAltitude };
}

// Tous les cheptels de l'abri, lus pour un bilan. -> [{ cle, nom, espece, genre, tetes, places, plein, sante, malade, manques,
//   facteur, horsAltitude, filtre (jours restants | null) }]
export function cheptelsDe(abri = {}, installations = [], contenu = {}, { jour = 0, altitude = null } = {}) {
  const alt = altitude ?? n0(regionDe(contenu, abri?.region)?.altitude);
  const sortie = [];
  for (const inst of installations ?? []) {
    if (!(n0(inst?.niveau) >= 1)) continue;
    const def = installationDe(contenu, inst.cle);
    const v = vivantDuNiveau(def, inst.niveau);
    if (!v) continue;
    const st = etatCheptel(abri, inst, def, contenu, { jour, altitude: alt });
    const esp = especeDe(contenu, st.espece);
    const f = facteurCheptel(st, v, esp, { altitude: alt });
    sortie.push({ cle: inst.cle, nom: def?.nom ?? inst.cle, espece: st.espece, especeNom: esp?.nom ?? st.espece, genre: esp?.genre ?? "", tetes: st.tetes,
      places: n0(v.places), plein: n0(v.plein), sante: st.sante, malade: Boolean(st.malade), manques: [...st.manques], facteur: arrondi(f.facteur, 2),
      horsAltitude: f.horsAltitude, filtre: filtreRestant(inst, def, jour) });
  }
  return sortie;
}

// L'eau d'un bassin ou d'un bac : l'entretien du lot 7 qui la dit (`eau`), les jours avant qu'elle se salisse (0 : sale), ou null.
export function filtreRestant(inst, def, jour = 0) {
  const e = entretienDe(def, inst?.niveau);
  if (!e?.eau) return null;
  if (suiviDe(inst)?.encrasse) return 0;
  const et = etatEntretien(inst, def, jour);
  return et ? Math.max(0, et.prochain - n0(jour)) : e.tousLes;
}
export const eauSale = (inst, def) => Boolean(entretienDe(def, inst?.niveau)?.eau && suiviDe(inst)?.encrasse);

// Le fumier que donnent des enclos (fusion de la vague 3 : le digesteur à biogaz du lot 7 lit l'enclos à cabris) : le meilleur troupeau
// (têtes ÷ plein, au plus 1) parmi les installations nommées, à leur niveau ; 0 sans enclos ou enclos vide.
export function fumierDe(abri = {}, installations = [], contenu = {}, cles = [], { jour = 0, altitude = 0 } = {}) {
  let mieux = 0;
  for (const inst of installations ?? []) {
    if (!cles.includes(inst?.cle) || !(n0(inst.niveau) >= 1) || n0(inst.etat) >= 3) continue;
    const def = installationDe(contenu, inst.cle);
    const v = vivantDuNiveau(def, inst.niveau);
    if (!v) continue;
    const st = etatCheptel(abri, inst, def, contenu, { jour, altitude });
    mieux = Math.max(mieux, facteurCheptel(st, v).troupeau);
  }
  return mieux;
}

// Les bêtes mortes du jour (événements « vivant-morts » de journeeVivant) qui laissent un corps : celles du genre « betes ».
export function corpsDeBetes(evenements = [], vivant = {}, contenu = {}) {
  let n = 0;
  for (const ev of evenements ?? []) {
    if (ev?.cle !== "vivant-morts") continue;
    const espece = vivant?.[ev.installation]?.espece;
    if ((especeDe(contenu, espece)?.genre ?? "betes") === "betes") n += Math.max(0, Math.floor(n0(ev.params?.n)));
  }
  return n;
}

// Le bruit des cheptels qui ont eu faim ou soif (ils crient), au plus REGLES_VIVANT.cri.max.
export function criDuVivant(abri = {}) {
  const n = Object.values(abri?.vivant ?? {}).filter(st => n0(st?.tetes) > 0 && (st?.manques ?? []).some(m => m === "faim" || m === "soif")).length;
  return Math.min(REGLES_VIVANT.cri.max, n * REGLES_VIVANT.cri.parCheptel);
}

// La pluie arrose ce qui pousse à ciel ouvert (`effets.pluieArrose` : potager, jardin, verger, treille, bananeraie, zerbaz) :
// un jour où il a plu au moins la moitié des quarts (conditions.pluie, lot « sens »), il ne prend pas d'eau.
export const SEUIL_PLUIE_ARROSE = 0.5;
export const arroseParLaPluie = (effets = {}, conditions = {}) => Boolean(effets?.pluieArrose) && n0(conditions?.pluie) >= SEUIL_PLUIE_ARROSE;

// ------------------------------------------------------------------ la journée du vivant
// abri : system de l'abri APRÈS la journée des stocks ; installations : instances ; bilan : le bilan du jour (arrêts, actives,
// insalubrité) ; conditions : celles de journeeAbri (jour, personnes, travailleurs, …) ; manqueNourriture : ce que les gens n'ont pas
// mangé ; hasard : flux « vivant|jour » (sans lui : ni maladie, ni guérison spontanée).
// -> { vivant: { clé: état }, stocks (les graines resemées en moins), evenements: [{ cle, params, texte, installation }] }
export function journeeVivant({ abri = {}, installations = [], contenu = {}, bilan = {}, conditions = {}, manqueNourriture = 0, hasard = null } = {}) {
  const R = REGLES_VIVANT;
  const jour = n0(conditions.jour);
  const site = siteDe(contenu, abri?.site) ?? conditions.site ?? {};
  const altitude = n0(regionDe(contenu, abri?.region)?.altitude ?? conditions.region?.altitude);
  const personnes = n0(conditions.personnes);
  const travailleurs = conditions.travailleurs ?? {};
  const aLaTache = tache => (travailleurs?.[tache] ?? []).length > 0;
  const arrets = new Map((bilan?.arrets ?? []).map(a => [a.cle, a.raison]));
  const actives = new Set(bilan?.actives ?? []);
  const compost = [...actives].some(cle => n0(niveauDe(installationDe(contenu, cle), 1)?.effets?.sol) > 0);
  const insalubrite = borner(Math.round(n0(bilan?.insalubrite)), 0, 3);
  const stocks = { ...(abri?.stocks ?? {}) };
  const vivant = {};
  const evenements = [];
  const dire = (cle, params, texte, installation) => evenements.push({ ...message(cle, params, texte), installation });
  // Ce qui était suivi et dont l'installation a disparu ne se garde pas.
  for (const inst of installations ?? []) {
    if (!(n0(inst?.niveau) >= 1)) continue;
    const def = installationDe(contenu, inst.cle);
    const v = vivantDuNiveau(def, inst.niveau);
    if (!v) continue;
    const st = etatCheptel(abri, inst, def, contenu, { jour, altitude });
    const esp = especeDe(contenu, st.espece) ?? {};
    const nom = def?.nom ?? inst.cle;
    const genre = esp.genre ?? "betes";
    if (st.tetes <= 0) {
      // Un bac vide se resème (la tâche « cultures », une graine) ; un enclos vide attend qu'on le peuple.
      const resemer = genre === "plants" && n0(v.plein) > 0 && aLaTache("cultures") && n0(stocks.graines) >= R.replanter.graines;
      if (resemer) stocks.graines = n0(stocks.graines) - R.replanter.graines;
      vivant[inst.cle] = { ...st, tetes: resemer ? Math.min(R.replanter.plants, n0(v.plein)) : 0, sante: R.santeMax, manques: [], malade: null, sansPompe: 0 };
      continue;
    }
    // Le soin de tous les jours (curer le bassin, changer le filtre) est l'entretien du lot 7 (journeeOuvrages : qui est à la tâche).
    // Les manques du jour.
    const raison = arrets.get(inst.cle);
    const manques = [];
    // Sans eau : l'installation arrêtée faute d'eau, ou éteinte (on ne s'en occupe plus : personne ne la remplit).
    if (raison === "eau" || inst.actif === false) manques.push("soif");
    const mange = esp.mange ?? "";
    // Les restes : tant qu'on cuisine quelque chose, il y a des épluchures ; plus rien, quand personne n'a mangé ou que personne n'est là.
    if ((mange === "restes" && (personnes <= 0 || n0(manqueNourriture) >= personnes))
      || (mange === "herbe" && n0(site.sol) < 1 && !aLaTache("elevage"))
      || (mange === "solution" && !compost)) manques.push("faim");
    const panne = n0(inst.etat) >= 3 || raison === "energie" || raison === "hors-service";
    if (panne) manques.push("panne");
    if (eauSale(inst, def)) manques.push("eau-sale");
    if (genre === "plants" && n0(site.soleil) < 1) manques.push("ombre");
    if (st.tetes > n0(v.places)) manques.push("surpopulation");
    // Deux jours sans pompe (aquaponie) : tout meurt d'un coup.
    st.sansPompe = panne && n0(v.sansPompe) > 0 ? st.sansPompe + 1 : 0;
    if (n0(v.sansPompe) > 0 && st.sansPompe >= n0(v.sansPompe)) {
      dire("vivant-sans-pompe", { installation: nom, n: st.tetes }, `${nom} : deux jours sans pompe, l'eau est morte ; plus rien ne vit dans le bassin.`, inst.cle);
      vivant[inst.cle] = { ...st, tetes: 0, sante: R.santeMax, malade: null, manques, sansPompe: 0, naissances: 0 };
      continue;
    }
    // La santé.
    const malPerdu = st.malade && (jour - n0(st.malade.depuis)) % R.maladie.perteTousLes === R.maladie.perteTousLes - 1 ? 1 : 0;
    const perte = manques.length + malPerdu;
    if (perte > 0) st.sante = Math.max(0, st.sante - perte);
    else if (!st.malade) st.sante = Math.min(R.santeMax, st.sante + R.regain);
    if (manques.includes("soif") && !(st.manques ?? []).includes("soif")) dire("vivant-soif", { installation: nom }, `${nom} : les bêtes ont soif ; elles crient.`, inst.cle);
    if (manques.includes("faim") && !(st.manques ?? []).includes("faim")) dire("vivant-faim", { installation: nom }, `${nom} : rien à manger aujourd'hui.`, inst.cle);
    if (manques.includes("eau-sale") && !(st.manques ?? []).includes("eau-sale")) dire("vivant-eau-sale", { installation: nom }, `${nom} : l'eau verdit, il faudrait curer.`, inst.cle);
    // À bout : un tiers meurt.
    if (st.sante <= 0) {
      const morts = Math.min(st.tetes, Math.max(1, Math.ceil(st.tetes * R.morts)));
      st.tetes -= morts;
      dire("vivant-morts", { installation: nom, n: morts, espece: esp.nom ?? st.espece }, `${nom} : ${morts} mort${morts > 1 ? "s" : ""} aujourd'hui.`, inst.cle);
      if (st.tetes <= 0) dire("vivant-vide", { installation: nom }, `${nom} est vide.`, inst.cle);
    }
    // Les naissances (et les plants qu'on resème).
    const horsAltitude = !dansSonAltitude(esp, altitude);
    if (genre === "plants") {
      const R2 = R.replanter;
      if (st.tetes < n0(v.plein) && aLaTache("cultures") && n0(stocks.graines) >= R2.graines && !st.malade) {
        const n = Math.min(R2.plants, n0(v.plein) - st.tetes);
        st.tetes += n;
        stocks.graines = n0(stocks.graines) - R2.graines;
      }
    } else if (st.sante >= R.reproduction && !st.malade && !horsAltitude && n0(esp.taux) > 0 && st.tetes >= 2 && st.tetes < n0(v.places)) {
      st.naissances = arrondi(n0(st.naissances) + Math.floor(st.tetes / 2) * n0(esp.taux));
      const nes = Math.min(Math.floor(st.naissances + 1e-9), n0(v.places) - st.tetes);
      if (nes > 0) {
        st.tetes += nes;
        st.naissances = arrondi(st.naissances - nes);
        dire("vivant-naissance", { installation: nom, n: nes, espece: esp.nom ?? st.espece }, `${nom} : ${nes} naissance${nes > 1 ? "s" : ""}.`, inst.cle);
      }
    }
    // La maladie (flux à part) : elle prend, ou passe d'elle-même.
    if (hasard && st.tetes > 0) {
      if (st.malade) {
        if (chance(R.maladie.guerit, hasard)) {
          st.malade = null;
          dire("vivant-guerie", { installation: nom }, `${nom} : la maladie est passée.`, inst.cle);
        }
      } else {
        const p = n0(esp.maladie) * n0(v.maladie ?? 1) * R.maladie.insalubrite[insalubrite];
        if (p > 0 && chance(p, hasard)) {
          st.malade = { depuis: jour };
          dire("vivant-malade", { installation: nom }, `${nom} : des bêtes malades (abattues, l'œil terne, elles ne mangent plus).`, inst.cle);
        }
      }
    }
    vivant[inst.cle] = { ...st, manques };
  }
  return { vivant, stocks, evenements };
}

// ------------------------------------------------------------------ gestes du groupe (API)
// Ce qu'on peut faire d'un cheptel. Chacun rend { ok, motif, etat (nouvel état), … } sans rien modifier.
// Peupler (des bêtes portées, trouvées, données ; des plants semés) : jusqu'aux places (au-delà, la surpopulation est un manque).
export function peuplerCheptel(st, { n = 1, places = Infinity, espece = "", forcer = false } = {}) {
  if (!st) return { ok: false, motif: "pas-vivant" };
  const q = Math.max(0, Math.floor(n0(n)));
  if (!q) return { ok: false, motif: "nombre" };
  if (espece && st.tetes > 0 && st.espece && espece !== st.espece) return { ok: false, motif: "autre-espece" };
  const place = Math.max(0, n0(places) - st.tetes);
  const entrent = forcer ? q : Math.min(q, place);
  if (!entrent) return { ok: false, motif: "plein" };
  return { ok: true, motif: "", etat: { ...st, espece: espece || st.espece, tetes: st.tetes + entrent }, entrent, restent: q - entrent };
}
// Abattre n têtes : la viande en nourriture (poissons : à la part, arrondi à l'entier inférieur ; au moins 1 pour une bête).
export function abattreCheptel(st, espece = {}, { n = 1 } = {}) {
  if (!st) return { ok: false, motif: "pas-vivant" };
  if ((espece?.genre ?? "") === "plants" || (espece?.genre ?? "") === "essaim") return { ok: false, motif: "pas-de-viande" };
  const q = Math.min(st.tetes, Math.max(0, Math.floor(n0(n))));
  if (!q) return { ok: false, motif: "vide" };
  const nourriture = Math.floor(q * n0(espece?.viande) + 1e-9);
  return { ok: true, motif: "", etat: { ...st, tetes: st.tetes - q }, abattues: q, nourriture };
}
// Soigner un cheptel malade (un test de survie ; la difficulté est normale, l'élevage donne +1 dé dans l'API) : réussi, il guérit.
export function soignerCheptel(st, test = {}) {
  if (!st) return { ok: false, motif: "pas-vivant" };
  if (!st.malade) return { ok: false, motif: "pas-malade" };
  return { ok: true, motif: "", gueri: Boolean(test?.reussite), etat: test?.reussite ? { ...st, malade: null } : { ...st } };
}
// Curer un bassin, changer un filtre : l'eau redevient propre (le soin de l'instance est entretenirInstallation, lot 7) ; le cheptel
// n'a plus ce manque.
export function nettoyerCheptel(st) {
  if (!st) return { ok: false, motif: "pas-vivant" };
  return { ok: true, motif: "", etat: { ...st, manques: (st.manques ?? []).filter(m => m !== "eau-sale") } };
}

// ------------------------------------------------------------------ bêtes portées (prises en liberté, trouvées en fouillant)
// etat.groupe.betes : [{ id, cle (l'espèce, ou un alias : porcelet, veau-moka), nombre, prisLe (quart), jusqua (quart), enclos: "",
// abri: "", source }] : la forme des bêtes trouvées du lot 5 (fouille), pour que les deux lots partagent la même liste. Le délai hors
// d'un enclos est celui de l'espèce (capture.horsEnclos, en quarts) ; passé, elles meurent (une bête morte se mange encore). Une bête
// mise en enclos rejoint le cheptel de son espèce (peuplerCheptel) et quitte la liste ; une entrée « à l'enclos » (enclos posé, jusqua
// null) d'un autre lot n'est jamais comptée ici.
export const HORS_ENCLOS_DEFAUT = 4;
export const horsEnclosDe = espece => Math.max(1, Math.floor(n0(espece?.capture?.horsEnclos) || HORS_ENCLOS_DEFAUT));
export const betesPortees = betes => (Array.isArray(betes) ? betes : []).filter(b => b && !b.enclos && Number(b.nombre) > 0);
export function porterBete(betes = [], { espece = "", nombre = 1, quart = 0, source = "", contenu = {} } = {}) {
  const liste0 = Array.isArray(betes) ? betes.map(b => ({ ...b })) : [];
  const q = Math.max(0, Math.floor(n0(nombre)));
  if (!espece || !q) return { betes: liste0, bete: null };
  const id = `bete-${quart}-${espece}-${liste0.length + 1}`;
  const bete = { id, cle: espece, nombre: q, prisLe: n0(quart), jusqua: n0(quart) + horsEnclosDe(especeDe(contenu, espece)), enclos: "", abri: "", source };
  return { betes: [...liste0, bete], bete };
}
// Les bêtes portées qui meurent à ce quart. -> { betes (celles qui restent), mortes: [{ ...bete, viande }] }
export function betesQuiMeurent(betes = [], { quart = 0, contenu = {} } = {}) {
  const restent = [], mortes = [];
  for (const b of Array.isArray(betes) ? betes : []) {
    const esp = especeDe(contenu, b.cle);
    const jusqua = b.jusqua === null || b.jusqua === undefined ? null : n0(b.jusqua);
    if (!b.enclos && jusqua !== null && n0(quart) >= jusqua) mortes.push({ ...b, viande: Math.floor(n0(b.nombre) * n0(esp?.viande) + 1e-9) });
    else restent.push({ ...b });
  }
  return { betes: restent, mortes };
}
// L'installation de l'abri qui peut loger une espèce (la première dont un niveau la nomme, avec de la place).
export function enclosPour(installations = [], contenu = {}, espece = "", abri = {}, { jour = 0 } = {}) {
  const altitude = n0(regionDe(contenu, abri?.region)?.altitude);
  for (const inst of installations ?? []) {
    if (!(n0(inst?.niveau) >= 1)) continue;
    const def = installationDe(contenu, inst.cle);
    const v = vivantDuNiveau(def, inst.niveau);
    if (!v || !especesPossibles(v).includes(cleEspece(contenu, espece))) continue;
    const st = etatCheptel(abri, inst, def, contenu, { jour, altitude });
    if (st.tetes > 0 && st.espece && st.espece !== cleEspece(contenu, espece)) continue;
    return { cle: inst.cle, places: n0(v.places), tetes: st.tetes, etat: st };
  }
  return null;
}

// ------------------------------------------------------------------ bêtes en liberté
// Les bêtes en liberté du bestiaire (catégorie « bete ») : { cle, espece, zones, phases, groupe: [min, max], poids }.
export const betesSauvagesDe = contenu => liste(contenu?.bestiaire).filter(b => (b.categorie ?? b.type) === "bete");
// Une rencontre de bêtes en liberté dans une zone (phase : elles retournent à l'état sauvage après le jour zéro).
// -> { cle, nom, espece, nombre } | null
export function tirerBeteSauvage(contenu = {}, { zone = "", phase = "" } = {}, hasard = Math.random) {
  const possibles = betesSauvagesDe(contenu).filter(b => (!zone || (b.zones ?? []).includes(zone)) && (!phase || !(b.phases ?? []).length || b.phases.includes(phase)));
  if (!possibles.length) return null;
  const total = possibles.reduce((s, b) => s + Math.max(0, n0(b.poids ?? 1)), 0);
  let x = hasard() * total;
  let b = possibles.at(-1);
  for (const p of possibles) { x -= Math.max(0, n0(p.poids ?? 1)); if (x < 0) { b = p; break; } }
  const [min, max] = Array.isArray(b.groupe) ? b.groupe : [1, 1];
  const nombre = n0(min) + Math.floor(hasard() * (n0(max) - n0(min) + 1));
  return { cle: b.cle, nom: b.nom, espece: b.espece, nombre: Math.max(1, nombre) };
}
// Prendre une bête : l'outil de son espèce en main, un test de survie (capture.difficulte). Sans l'outil ou raté : elle file, et
// les autres avec ; un essaim sans enfumoir pique (une blessure) et reste. -> { prise, file, blessure, difficulte, outil }
export function prendreBete(espece = {}, { test = null, outils = [] } = {}) {
  const cap = espece?.capture ?? {};
  const voulus = Array.isArray(cap.outils) ? cap.outils : [];
  const outil = voulus.length === 0 || voulus.some(o => (outils ?? []).includes(o));
  const difficulte = cap.difficulte === "facile" ? "facile" : "normale";
  const essaim = espece?.genre === "essaim";
  if (!outil) return { prise: false, file: !essaim, blessure: essaim, difficulte, outil: false };
  const prise = Boolean(test?.reussite);
  return { prise, file: !prise && !essaim, blessure: !prise && essaim && Boolean(test?.force), difficulte, outil: true };
}
// Chasser une bête en liberté (combat ou tir, normale ; difficile si elle fuit déjà) : abattue, sa viande.
export function chasserBete(espece = {}, { test = null } = {}) {
  const abattue = Boolean(test?.reussite);
  return { abattue, viande: abattue ? Math.max(1, Math.floor(n0(espece?.viande))) : 0, file: !abattue };
}

// ------------------------------------------------------------------ assaut
// Les bêtes perdues dans un assaut contre l'abri (§1.7) : un Livide resté près d'un enclos tue une bête par tour ; une bande prend.
// marge −1 : une tête dans le premier cheptel de bêtes ; brèche (marge ≤ −2) : `force` têtes, cheptel après cheptel. Les plants et
// les essaims ne sont pas pris ; les poissons non plus (un bassin ne se vide pas en une nuit).
// -> { vivant (nouveau), pertes: [{ cle, n }] }
export function pertesDAssaut(abri = {}, installations = [], contenu = {}, { marge = 0, force = 1, jour = 0 } = {}) {
  const pertes = [];
  const vivant = structuredClone(abri?.vivant ?? {});
  if (!(n0(marge) < 0)) return { vivant, pertes };
  let reste = n0(marge) <= -2 ? Math.max(1, Math.floor(n0(force))) : 1;
  const altitude = n0(regionDe(contenu, abri?.region)?.altitude);
  for (const inst of installations ?? []) {
    if (reste <= 0) break;
    if (!(n0(inst?.niveau) >= 1)) continue;
    const def = installationDe(contenu, inst.cle);
    if (!vivantDuNiveau(def, inst.niveau)) continue;
    const st = etatCheptel({ ...abri, vivant }, inst, def, contenu, { jour, altitude });
    if ((especeDe(contenu, st.espece)?.genre ?? "betes") !== "betes" || st.tetes <= 0) continue;
    const n = Math.min(reste, st.tetes);
    vivant[inst.cle] = { ...st, tetes: st.tetes - n };
    pertes.push({ cle: inst.cle, n });
    reste -= n;
  }
  return { vivant, pertes };
}

// ------------------------------------------------------------------ contrôle du contenu
// Les erreurs de forme du vivant (fabricant, essais) : espèces, effets.vivant des installations, bêtes en liberté.
export function erreursVivant(contenu = {}) {
  const e = [];
  const especes = new Map(especesDe(contenu).map(x => [x.cle, x]));
  for (const x of especes.values()) {
    const ou = `espèce ${x.cle}`;
    if (!GENRES_VIVANT.includes(x.genre)) e.push(`${ou} : genre « ${x.genre} »`);
    if (!MANGE_VIVANT.includes(x.mange ?? "")) e.push(`${ou} : mange « ${x.mange} »`);
    if (!(n0(x.taux) >= 0 && n0(x.taux) <= 0.2)) e.push(`${ou} : taux hors de 0..0,2`);
    if (!(n0(x.viande) >= 0)) e.push(`${ou} : viande`);
    if (!(n0(x.maladie) >= 0 && n0(x.maladie) <= 0.05)) e.push(`${ou} : maladie hors de 0..5 %`);
    if (x.altitude && !(Array.isArray(x.altitude) && n0(x.altitude[0]) <= n0(x.altitude[1] ?? Infinity))) e.push(`${ou} : altitude`);
    if (!x.remede || typeof x.remede.cout !== "object") e.push(`${ou} : remède sans coût`);
    if (x.capture && !["facile", "normale"].includes(x.capture.difficulte)) e.push(`${ou} : capture.difficulte`);
  }
  for (const def of liste(contenu?.installations)) {
    (def.niveaux ?? []).forEach((n, k) => {
      const v = n?.effets?.vivant;
      if (!v) return;
      const ou = `installation ${def.cle} niveau ${k + 1}`;
      const possibles = especesPossibles(v);
      if (!possibles.length) e.push(`${ou} : vivant sans espèce`);
      for (const p of possibles) if (!especes.has(p)) e.push(`${ou} : espèce inconnue « ${p} »`);
      if (!(n0(v.places) >= 1) || !(n0(v.plein) >= 0) || n0(v.plein) > n0(v.places)) e.push(`${ou} : places ${v.places}, plein ${v.plein}`);
      if (v.depart !== undefined && !(n0(v.depart) >= 0 && n0(v.depart) <= n0(v.places))) e.push(`${ou} : départ hors des places`);
      const avant = k > 0 ? def.niveaux[k - 1]?.effets?.vivant : null;
      if (avant && n0(v.places) < n0(avant.places)) e.push(`${ou} : moins de places qu'au niveau précédent`);
    });
  }
  for (const b of betesSauvagesDe(contenu)) {
    if (!especes.has(b.espece)) e.push(`bête en liberté ${b.cle} : espèce inconnue « ${b.espece} »`);
    if (!(Array.isArray(b.groupe) && n0(b.groupe[0]) >= 1 && n0(b.groupe[1]) >= n0(b.groupe[0]))) e.push(`bête en liberté ${b.cle} : groupe`);
  }
  return e;
}
