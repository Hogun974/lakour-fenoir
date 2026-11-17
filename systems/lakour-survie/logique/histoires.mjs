// Les histoires des survivants (contrat §16 ; lot 11 du portage du jeu 3D). Logique pure : essais/survie-histoires.test.mjs.
//
// Le contenu (lakour-fenoir, contenu/histoires.mjs ; famille du registre `histoires`) range des phrases par ce qu'elles supposent
// du survivant : son enfance, son passé, un trait, sa religion, son regard sur la catastrophe, sa génération. On en tire 3 à 5 pour
// un survivant, dans son genre et dans la langue du module de contenu (le module anglais traduit les mêmes phrases) :
//   1. une phrase de l'enfance qui dit où l'on a grandi (sujet « lieu »), puis une autre de l'enfance ;
//   2. une phrase du passé qui dit le métier (sujet « metier »), puis une autre du passé ;
//   3. 65 fois sur 100, une de plus : un de ses traits, sa foi, son regard ou sa génération.
// Jamais deux phrases du même sujet, ni deux phrases dont l'une exclut une marque de l'autre ; une phrase vaut pour une tranche
// d'âge ; une enfance d'origine « ailleurs » porte la marque « nee-ailleurs » ; une phrase « pratique » ne va qu'à un croyant qui
// pratique, une phrase « foi » qu'à qui a cette religion (l'enfance ne fixe jamais la foi). L'histoire est bornée à 520 caractères
// (on retire par la fin, sans descendre sous 3 phrases).
//
// Le tirage ne dépend que de la fiche (nom, âge, genre, enfance, passé) : un flux À PART (deriverHasard « histoire »), qui ne
// touche à aucun autre tirage du générateur. La même fiche donne la même histoire, au MJ comme au joueur, à la création comme au
// journal. Les phrases choisies se gardent par leurs clés (« enfance:enfant-de-cilaos/3 ») : elles se relisent dans l'autre genre
// ou dans l'autre langue. Sans genre connu, sans phrases pour son enfance ou pour son passé : null (on garde les phrases
// d'histoire de l'enfance et du passé, comme avant). Aucune phrase n'a d'effet de jeu.
import { deriverHasard, choisir, chance } from "./hasard.mjs";
import { liste, indexer, GENRES } from "./contenu.mjs";
import { RELIGION_AUCUNE, RELIGION_PLUSIEURS, REGARDS } from "./esprit.mjs";

export const HISTOIRE = { phrasesMin: 3, phrasesMax: 5, phraseMax: 150, histoireMax: 520, chanceAjout: 0.65 };
export const TYPES_HISTOIRE = ["enfance", "passe", "trait", "religion", "regard", "generation"];
export const SUJET_LIEU = "lieu";
export const SUJET_METIER = "metier";
export const MARQUE_NEE_AILLEURS = "nee-ailleurs";
const AGE_MAX = 120;

// Accorde un texte : « {Elle|Il} est né{e|} » donne « Elle est née » (f) ou « Il est né » (m, et tout autre genre). null si les
// accolades sont mal formées (une accolade sans sa paire, sans barre, avec deux barres, ou imbriquée).
export function accorder(texte, genre) {
  let sortie = "", reste = String(texte ?? "");
  for (;;) {
    const debut = reste.indexOf("{");
    if (debut < 0) break;
    const avant = reste.slice(0, debut);
    if (avant.includes("}")) return null;
    const fin = reste.indexOf("}", debut);
    if (fin < 0) return null;
    const choix = reste.slice(debut + 1, fin);
    const morceaux = choix.split("|");
    if (morceaux.length !== 2 || choix.includes("{")) return null;
    sortie += avant + (genre === "f" ? morceaux[0] : morceaux[1]);
    reste = reste.slice(fin + 1);
  }
  if (reste.includes("}")) return null;
  return sortie + reste;
}

// Les phrases du contenu à plat : [{ id, type, pour, avec, sujet, texte, ageMin, ageMax, marques, exclut, pratique, foi }].
const cache = new WeakMap();
const cles = v => (Array.isArray(v) ? v.filter(x => typeof x === "string" && x) : []);
export function phrasesHistoire(contenu = {}) {
  const groupes = contenu?.histoires;
  if (!Array.isArray(groupes)) return [];
  if (cache.has(groupes)) return cache.get(groupes);
  const toutes = [];
  for (const g of groupes) {
    if (!g || !TYPES_HISTOIRE.includes(g.type)) continue;
    liste(g.phrases).forEach((p, i) => {
      if (!p || typeof p.texte !== "string") return;
      const age = Array.isArray(p.age) ? p.age : [];
      toutes.push({
        id: `${g.cle}/${i}`, type: g.type, pour: cles(g.pour), avec: Array.isArray(g.avec) ? g.avec.map(cles).filter(l => l.length) : [],
        sujet: String(p.sujet ?? ""), texte: p.texte,
        ageMin: Number.isFinite(Number(age[0])) && age.length ? Number(age[0]) : 0,
        ageMax: Number.isFinite(Number(age[1])) && age.length > 1 ? Number(age[1]) : AGE_MAX,
        marques: cles(p.marques), exclut: cles(p.exclut), pratique: Boolean(p.pratique), foi: cles(p.foi)
      });
    });
  }
  cache.set(groupes, toutes);
  return toutes;
}

// Vrai si deux phrases peuvent se suivre dans une même histoire.
export function vontEnsemble(a, b) {
  return a.id !== b.id && a.sujet !== b.sujet
    && !a.exclut.some(m => b.marques.includes(m)) && !b.exclut.some(m => a.marques.includes(m));
}

// Le flux de hasard d'une histoire : la fiche seule.
export const hasardDeLHistoire = (fiche = {}) =>
  deriverHasard("histoire", fiche.nom ?? "", Number(fiche.age) || 0, fiche.genre ?? "", fiche.enfance ?? "", fiche.passe ?? "");

// Les religions d'une fiche (la sienne, et celles de « plusieurs »).
function religionsDeFiche(fiche) {
  const r = String(fiche?.religion ?? "");
  return new Set([r, ...(r === RELIGION_PLUSIEURS ? cles(fiche?.religions) : [])].filter(Boolean));
}

// Les phrases choisies pour un survivant, dans l'ordre où elles se lisent, ou null (voir l'en-tête).
// fiche : { nom, age, genre, enfance, passe, traits, religion, religions, pratique, regard } (un system de survivant convient).
export function choisirPhrases(contenu, fiche = {}, hasard = null) {
  if (!GENRES.includes(fiche.genre) || !fiche.enfance || !fiche.passe) return null;
  const toutes = phrasesHistoire(contenu);
  if (!toutes.length) return null;
  const age = Number(fiche.age) || 0;
  const religions = religionsDeFiche(fiche);
  const croyant = [...religions].some(r => r !== RELIGION_AUCUNE);
  // Ce que l'histoire affirme d'avance : né ailleurs, si l'enfance vient d'ailleurs.
  const contexte = indexer(contenu).enfances.get(fiche.enfance)?.origine === "ailleurs" ? [MARQUE_NEE_AILLEURS] : [];
  const permise = p => age >= p.ageMin && age <= p.ageMax && !p.exclut.some(m => contexte.includes(m))
    && (!p.pratique || (croyant && Boolean(fiche.pratique))) && (!p.foi.length || p.foi.some(r => religions.has(r)));
  const de = (type, cle) => toutes.filter(p => p.type === type && p.pour.includes(cle) && permise(p));
  const enfance = de("enfance", fiche.enfance), passe = de("passe", fiche.passe);
  if (!enfance.length || !passe.length) return null;
  const h = hasard ?? hasardDeLHistoire(fiche);
  const choisies = [];
  const va = p => choisies.every(autre => vontEnsemble(p, autre));
  for (const [reserve, sujet] of [[enfance, SUJET_LIEU], [passe, SUJET_METIER]]) {
    // D'abord la phrase qui pose le lieu ou le métier (à défaut, n'importe laquelle), puis une autre.
    let premieres = reserve.filter(p => p.sujet === sujet && va(p));
    if (!premieres.length) premieres = reserve.filter(va);
    const premiere = choisir(premieres, h);
    if (premiere) choisies.push(premiere);
    const seconde = choisir(reserve.filter(p => p.sujet !== sujet && va(p)), h);
    if (seconde) choisies.push(seconde);
  }
  // Parfois une phrase de plus, sur ce que le survivant a de particulier. Une phrase de religion trouvée seulement par
  // « plusieurs » demande aussi les religions de son « avec » (la Vierge et Mariamen : catholique ET hindoue).
  const parPlusieursSeulement = p => !p.pour.some(r => r !== RELIGION_PLUSIEURS && religions.has(r));
  const ajouts = [
    ...cles(fiche.traits).flatMap(t => de("trait", t)),
    ...toutes.filter(p => p.type === "religion" && permise(p) && p.pour.some(r => religions.has(r))
      && (!p.avec.length || !parPlusieursSeulement(p) || p.avec.every(l => l.some(r => religions.has(r))))),
    ...(fiche.regard ? de("regard", fiche.regard) : []),
    ...toutes.filter(p => p.type === "generation" && permise(p))
  ].filter((p, i, l) => l.findIndex(x => x.id === p.id) === i && va(p));
  if (chance(HISTOIRE.chanceAjout, h)) {
    const ajout = choisir(ajouts, h);
    if (ajout) choisies.push(ajout);
  }
  // La place est bornée : on retire par la fin ce qui dépasse, sans descendre sous le minimum.
  choisies.length = Math.min(choisies.length, HISTOIRE.phrasesMax);
  const longueur = () => choisies.reduce((n, p) => n + (accorder(p.texte, fiche.genre) ?? "").length + 1, 0);
  while (choisies.length > HISTOIRE.phrasesMin && longueur() > HISTOIRE.histoireMax) choisies.pop();
  return choisies;
}

// L'histoire d'un survivant : { phrases: [texte accordé], cles: [id] }, ou null. options.hasard remplace le flux de la fiche.
export function composerHistoire(contenu, fiche = {}, { hasard = null } = {}) {
  const choisies = choisirPhrases(contenu, fiche, hasard);
  if (!choisies) return null;
  const phrases = choisies.map(p => accorder(p.texte, fiche.genre)).filter(Boolean);
  return phrases.length === choisies.length ? { phrases, cles: choisies.map(p => p.id) } : null;
}

// Des phrases gardées par leurs clés, relues dans un genre (et dans la langue du contenu). [] si une clé manque.
export function phrasesParCles(contenu, ids = [], genre = "") {
  const parId = new Map(phrasesHistoire(contenu).map(p => [p.id, p]));
  const l = cles(ids).map(id => parId.get(id));
  if (!l.length || l.some(p => !p)) return [];
  const textes = l.map(p => accorder(p.texte, genre));
  return textes.every(Boolean) ? textes : [];
}

// Vrai si des phrases gardées vont toujours à la fiche : chacune connue, de son enfance, de son passé, d'un de ses traits, de sa
// foi, de son regard ou de son âge (une fiche changée depuis, ou un tirage dont on a changé le passé, ne garde pas les siennes).
export function clesDeLaFiche(contenu, fiche = {}, ids = []) {
  const parId = new Map(phrasesHistoire(contenu).map(p => [p.id, p]));
  const l = cles(ids).map(id => parId.get(id));
  if (!GENRES.includes(fiche.genre) || !l.length || l.some(p => !p)) return false;
  const age = Number(fiche.age) || 0;
  const religions = religionsDeFiche(fiche);
  const de = {
    enfance: p => p.pour.includes(fiche.enfance), passe: p => p.pour.includes(fiche.passe), trait: p => p.pour.some(t => cles(fiche.traits).includes(t)),
    religion: p => p.pour.some(r => religions.has(r)), regard: p => p.pour.includes(fiche.regard), generation: () => true
  };
  return l.every(p => de[p.type]?.(p) && age >= p.ageMin && age <= p.ageMax);
}

// L'histoire à montrer d'un survivant : ses phrases gardées (cles), sinon celles que donne sa fiche, sinon []. -> [texte]
export function histoireDe(contenu, fiche = {}, { cles: ids = [] } = {}) {
  if (clesDeLaFiche(contenu, fiche, ids)) {
    const gardees = phrasesParCles(contenu, ids, fiche.genre);
    if (gardees.length) return gardees;
  }
  return composerHistoire(contenu, fiche)?.phrases ?? [];
}

// Les erreurs de forme de la famille `histoires` d'un contenu (fabricant, essais). -> [texte]
export function verifierHistoires(contenu = {}) {
  const erreurs = [];
  const groupes = contenu?.histoires;
  if (groupes === undefined) return erreurs;
  if (!Array.isArray(groupes)) return ["histoires : une liste de groupes"];
  const idx = indexer(contenu);
  const connues = {
    enfance: idx.enfances, passe: idx.passes, trait: idx.traits,
    religion: new Set([...idx.religions.keys(), RELIGION_AUCUNE, RELIGION_PLUSIEURS]), regard: new Set(REGARDS)
  };
  const vues = new Set();
  for (const g of groupes) {
    const ou = `histoires ${g?.cle ?? "?"}`;
    if (!g?.cle || vues.has(g.cle)) erreurs.push(`${ou} : clé absente ou en double`);
    vues.add(g?.cle);
    if (!TYPES_HISTOIRE.includes(g?.type)) { erreurs.push(`${ou} : type « ${g?.type} » inconnu`); continue; }
    const pour = cles(g.pour);
    if (g.type !== "generation" && !pour.some(k => connues[g.type].has(k))) erreurs.push(`${ou} : aucune clé connue dans « pour »`);
    const phrases = liste(g.phrases);
    if (!phrases.length) erreurs.push(`${ou} : aucune phrase`);
    if (g.type === "enfance" && !phrases.some(p => p?.sujet === SUJET_LIEU)) erreurs.push(`${ou} : aucune phrase de lieu`);
    if (g.type === "passe" && !phrases.some(p => p?.sujet === SUJET_METIER)) erreurs.push(`${ou} : aucune phrase de métier`);
    phrases.forEach((p, i) => {
      const ici = `${ou}/${i}`;
      if (!p?.sujet || typeof p.texte !== "string" || !p.texte.trim()) { erreurs.push(`${ici} : sujet ou texte manquant`); return; }
      for (const genre of GENRES) {
        const t = accorder(p.texte, genre);
        if (t === null) erreurs.push(`${ici} : accolades mal formées`);
        else if (t.length > HISTOIRE.phraseMax) erreurs.push(`${ici} : plus de ${HISTOIRE.phraseMax} caractères`);
      }
      if (p.age !== undefined && !(Array.isArray(p.age) && p.age.length === 2 && p.age[0] <= p.age[1] && p.age.every(Number.isFinite))) erreurs.push(`${ici} : âge [min, max]`);
      for (const f of ["marques", "exclut", "foi"]) if (p[f] !== undefined && !Array.isArray(p[f])) erreurs.push(`${ici} : ${f} est une liste`);
    });
  }
  return erreurs;
}
