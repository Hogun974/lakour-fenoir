// Le monde réel de Fénoir (contrat §2.3, §4), SECRET, chez le MJ actif seulement.
//
// Foundry v14 livre à TOUS les navigateurs les réglages du monde et les documents : le monde réel n'y est jamais écrit en clair.
// - En mémoire chez le MJ actif ({ partie, rev, iv, monde }), recopié dans le réglage CLIENT « monde » rangé par [monde][userId]
//   (localStorage du navigateur du MJ : rechargement rapide, jamais envoyé au serveur).
// - Scellé avec le coffre du MJ IA (game.modules.get("lakour-mj-ia").api.coffre : sceller / ouvrirScelle / scellerAvec /
//   siRenouvele / siDisponible) dans le réglage monde « coffre » ({ partie, rev, chiffre, id, iv, donnees }) après CHAQUE
//   changement : les actions de Fénoir sont toutes publiques, il n'y a pas de rythme à cacher (aux Veillées, si).
// - Sans le moteur (module coupé) : le réglage monde « mondeClair » ({ partie, rev, monde }) et un avertissement permanent au MJ
//   (« les joueurs peuvent lire l'état du monde »).
// - Révision : chaque écriture porte une révision croissante (rev, en clair dans l'enveloppe). Un navigateur est « à jour » si sa
//   mémoire est au moins aussi récente que l'enveloppe ; sinon il rouvre le coffre. Tant que le monde n'est pas ouvert chez le MJ
//   actif, rien de la partie ne s'écrit (ecritureBloquee), comme aux Veillées : jamais un monde périmé ne remplace le bon.
// - Le moteur renouvelle sa clé (un compte créé, supprimé…) : siRenouvele rescelle avec la nouvelle ; la clé revient (parts des
//   joueurs, autre MJ, clé de secours) : siDisponible et le crochet « lakour-mj-ia.coffreRouvert » rouvrent ce qui attendait.
import { ID } from "../logique/constantes.mjs";
import { estMJActif } from "./canal.mjs";
import { lireEtat, reglage, t, MODULE_MJIA } from "./donnees.mjs";

let memoire = null;          // { partie, rev, iv, monde }
let attente = false;         // le moteur demande les parts de sa clé : on attend
let nonScelle = false;       // une écriture n'a pas pu être scellée (clé absente) : à refaire dès qu'elle revient
let rappelsPoses = null;
let avertis = new Set();
let file = Promise.resolve();

const objet = v => (v && typeof v === "object" && !Array.isArray(v) ? v : {});
const mondeId = () => String(game.world?.id ?? "");

export function coffreDuMoteur() {
  const c = game.modules?.get?.(MODULE_MJIA)?.api?.coffre;
  return c && typeof c.sceller === "function" && typeof c.ouvrirScelle === "function" ? c : null;
}
// Le moteur est-il installé et actif dans ce monde (même si son API n'est pas encore publiée) ?
export const moteurActif = () => Boolean(game.modules?.get?.(MODULE_MJIA)?.active ?? coffreDuMoteur());

function avertirUneFois(cle, texte) {
  if (avertis.has(cle)) return;
  avertis.add(cle);
  globalThis.ui?.notifications?.warn?.(texte, { permanent: true });
}

// ------------------------------------------------------------------ lire
const enveloppe = () => {
  const c = objet(reglage("coffre", {}));
  const clair = objet(reglage("mondeClair", {}));
  const partie = lireEtat().partie;
  const candidats = [c, clair].filter(x => x.partie && x.partie === partie);
  return candidats.sort((a, b) => (Number(b.rev) || 0) - (Number(a.rev) || 0))[0] ?? null;
};
const revEnveloppe = () => Number(enveloppe()?.rev) || 0;

// Le monde en mémoire est-il celui de la partie publique, et au moins aussi récent que ce qui est scellé ?
export function mondeOuvert() {
  const etat = lireEtat();
  if (!etat.demarree || !etat.partie) return false;
  return Boolean(memoire?.monde) && memoire.partie === etat.partie && (Number(memoire.rev) || 0) >= revEnveloppe();
}

// Écrire la partie est-il interdit ici ? Une partie démarrée dont ce navigateur n'a pas le monde à jour.
export function ecritureBloquee() {
  const etat = lireEtat();
  return Boolean(etat.demarree && etat.partie) && !mondeOuvert();
}

// Une copie du monde réel (MJ actif, monde ouvert), null sinon.
export function mondeReel() {
  if (!estMJActif() || !mondeOuvert()) return null;
  return structuredClone(memoire.monde);
}
// Le monde en mémoire, sans copie (lecture interne de l'API).
export const mondeEnMemoire = () => (mondeOuvert() ? memoire.monde : null);
export const enAttenteDeParts = () => attente;

// ------------------------------------------------------------------ le navigateur du MJ
function lireClient() {
  const tout = objet(reglage("monde", {}));
  return objet(objet(tout[mondeId()])[game.user?.id]);
}
async function ecrireClient(valeur) {
  if (!game.user?.isGM) return;
  try {
    const tout = objet(reglage("monde", {}));
    const parMonde = { ...objet(tout[mondeId()]) };
    if (valeur) parMonde[game.user.id] = valeur; else delete parMonde[game.user.id];
    await game.settings.set(ID, "monde", { ...tout, [mondeId()]: parMonde });
  } catch (e) { console.warn(`${ID} | monde non gardé dans ce navigateur`, e); }
}

// ------------------------------------------------------------------ écrire (chez le MJ actif, dans la file de l'API)
// Une nouvelle partie : la mémoire repart de zéro (révision au-dessus de toute enveloppe d'une autre partie : sans objet).
export function nouvellePartie(partie, monde) {
  memoire = { partie, rev: 0, iv: "", monde: structuredClone(monde) };
  attente = false;
}

// Garde le monde (mémoire, navigateur, coffre ou clair). -> { scelle: Boolean, clair: Boolean }
export async function ecrireMonde(monde) {
  const etat = lireEtat();
  const partie = memoire?.partie ?? etat.partie;
  const rev = Math.max(Number(memoire?.rev) || 0, revEnveloppe()) + 1;
  memoire = { partie, rev, iv: memoire?.iv ?? "", monde: structuredClone(monde) };
  await ecrireClient(memoire);
  return sceller();
}

// Scelle la mémoire (révision courante). Sans moteur : le clair. Sans clé : rien, le MJ est prévenu.
export async function sceller() {
  if (!memoire?.monde || !estMJActif()) return { scelle: false, clair: false };
  const c = brancher();
  const contenu = { partie: memoire.partie, rev: memoire.rev, monde: memoire.monde };
  if (c) {
    const scelle = await c.sceller(contenu);
    if (!scelle) {
      nonScelle = true;
      avertirUneFois(`cle-${memoire.partie}`, t("LAKOUR_SURVIE.Coffre.SansCle"));
      return { scelle: false, clair: false };
    }
    nonScelle = false;
    memoire.iv = scelle.iv;
    await game.settings.set(ID, "coffre", { partie: memoire.partie, rev: memoire.rev, ...scelle });
    // Un ancien clair (le moteur était coupé) n'a plus rien à faire dans le monde.
    if (Object.keys(objet(reglage("mondeClair", {}))).length) await game.settings.set(ID, "mondeClair", {});
    await ecrireClient(memoire);
    return { scelle: true, clair: false };
  }
  if (moteurActif()) {
    // Le moteur est là mais pas encore prêt : on ne publie surtout pas le clair ; il scellera à son « pret ».
    nonScelle = true;
    return { scelle: false, clair: false };
  }
  avertirUneFois("clair", t("LAKOUR_SURVIE.Coffre.SansMoteur"));
  await game.settings.set(ID, "mondeClair", contenu);
  return { scelle: false, clair: true };
}

// ------------------------------------------------------------------ ouvrir (MJ actif)
// -> true si le monde de la partie en cours est ouvert dans ce navigateur.
export async function ouvrirMonde() {
  const etat = lireEtat();
  if (!estMJActif() || !etat.demarree || !etat.partie) return mondeOuvert();
  if (mondeOuvert()) return true;
  const env = enveloppe();
  const client = lireClient();
  if (client?.partie === etat.partie && client.monde && (Number(client.rev) || 0) >= (Number(env?.rev) || 0)) {
    memoire = structuredClone(client);
    attente = false;
    // La copie du navigateur est en avance sur l'enveloppe (une écriture n'avait pas pu être scellée avant un rechargement : la
    // clé ou l'API du moteur manquait) : elle est scellée maintenant, ou dès que la clé revient (siDisponible).
    if ((Number(client.rev) || 0) > (Number(env?.rev) || 0)) {
      nonScelle = true;
      if (coffreDuMoteur()) await sceller().catch(e => console.warn(`${ID} | coffre`, e));
    }
    return true;
  }
  const coffre = objet(reglage("coffre", {}));
  if (coffre.partie === etat.partie && coffre.donnees) {
    const c = brancher();
    if (!c) return false;
    const { partie: _p, rev: _r, ...scelle } = coffre;
    const contenu = await c.ouvrirScelle(scelle);
    if (contenu?.partie === etat.partie && contenu.monde) {
      memoire = { partie: contenu.partie, rev: Number(coffre.rev) || Number(contenu.rev) || 0, iv: coffre.iv, monde: contenu.monde };
      attente = false;
      await ecrireClient(memoire);
      Hooks.callAll("lakourSurvie.mondeOuvert");
      return true;
    }
    attente = true;
    return false;
  }
  const clair = objet(reglage("mondeClair", {}));
  if (clair.partie === etat.partie && clair.monde) {
    memoire = { partie: clair.partie, rev: Number(clair.rev) || 0, iv: "", monde: structuredClone(clair.monde) };
    avertirUneFois("clair", t("LAKOUR_SURVIE.Coffre.SansMoteur"));
    await ecrireClient(memoire);
    // Le moteur est revenu : le clair est scellé aussitôt.
    if (coffreDuMoteur()) await sceller();
    return true;
  }
  return false;
}

// Les rappels du moteur, une fois par API publiée.
function brancher() {
  const c = coffreDuMoteur();
  if (!c || rappelsPoses === c) return c;
  rappelsPoses = c;
  c.siRenouvele?.(async cle => {
    if (!memoire?.monde || !estMJActif() || !mondeOuvert()) return;
    const rev = memoire.rev + 1;
    const scelle = await c.scellerAvec({ partie: memoire.partie, rev, monde: memoire.monde }, cle);
    memoire.rev = rev;
    memoire.iv = scelle.iv;
    await game.settings.set(ID, "coffre", { partie: memoire.partie, rev, ...scelle });
    await ecrireClient(memoire);
  });
  c.siDisponible?.(() => {
    setTimeout(() => {
      if (attente) ouvrirMonde().catch(e => console.warn(`${ID} | coffre`, e));
      else if (nonScelle) sceller().catch(e => console.warn(`${ID} | coffre`, e));
    }, 0);
  });
  return c;
}

// Le moteur vient de publier son API (crochet « lakour-mj-ia.pret ») : on rouvre ce qui attendait, on scelle ce qui ne l'était pas.
export async function apresMoteurPret() {
  brancher();
  if (!estMJActif()) return false;
  if (!mondeOuvert()) return ouvrirMonde();
  if (nonScelle) await sceller();
  return true;
}

// Le coffre a changé (réglage monde) : chez le MJ actif, s'il est plus récent que sa mémoire, il le rouvre.
export function surCoffreChange() {
  if (!estMJActif() || mondeOuvert()) return;
  file = file.then(() => ouvrirMonde()).catch(e => console.warn(`${ID} | coffre`, e));
}

// Le MJ actif change : celui qui la perd oublie sa mémoire (elle serait périmée à son retour).
export function perdreLaMain() { memoire = null; attente = false; }

// Remise à zéro (oublier) : la mémoire et la copie de ce navigateur.
export async function oublierMonde() {
  memoire = null;
  attente = false;
  nonScelle = false;
  await ecrireClient(null);
}

// Essais : tout oublier, comme un navigateur neuf.
export function _reinitialiser() {
  memoire = null; attente = false; nonScelle = false; rappelsPoses = null; avertis = new Set(); file = Promise.resolve();
}
