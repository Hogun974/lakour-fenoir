// Doublure de Foundry en mémoire pour le système lakour-survie (inspirée de lakour-veillees/essais/doublures/foundry-loups.mjs) :
// acteurs et objets incorporés (avec les bornes que les modèles de données de Foundry feraient respecter), réglages (portée monde
// ou client, onChange), socket (destinataires, et identifiant de l'émetteur ajouté comme par le serveur v14), chat (création,
// mise à jour), journaux, crochets appelés pour de bon, utilisateurs et MJ actif réglable.
// Le coffre : celui du MJ IA (sous-module modules/lakour-mj-ia, scripts/coffre.js), le vrai, branché comme dans Foundry sur
// game.modules.get("lakour-mj-ia").api.coffre (option moteur, vraie par défaut ; moteur: false = le module coupé).
// Le contenu : le vrai registre du module lakour-fenoir (assets/donnees.json), versé au crochet « lakourSurvie.enregistrer ».
// Aucun réseau, aucune IA.
import { readFileSync } from "node:fs";
import * as CoffreMoteur from "../../modules/lakour-mj-ia/scripts/coffre.js";

const RACINE = new URL("../../", import.meta.url);
export const FR = JSON.parse(readFileSync(new URL("systems/lakour-survie/lang/fr.json", RACINE), "utf8"));
export const DONNEES = JSON.parse(readFileSync(new URL("modules/lakour-fenoir/assets/donnees.json", RACINE), "utf8"));
export { CoffreMoteur };

// ------------------------------------------------------------------ documents
let compteur = 0;
export const nouvelId = () => `id${String(++compteur).padStart(14, "0")}`;
const chemin = (o, p) => p.split(".").reduce((x, k) => x?.[k], o);
const estObjet = v => v && typeof v === "object" && !Array.isArray(v);
function appliquer(cible, changements) {
  for (const [k, v] of Object.entries(changements ?? {})) {
    if (k.includes(".")) {
      const parties = k.split(".");
      const dernier = parties.pop();
      let o = cible;
      for (const p of parties) o = o[p] ??= {};
      o[dernier] = structuredClone(v);
    } else if (estObjet(v) && estObjet(cible[k])) appliquer(cible[k], v);
    else cible[k] = structuredClone(v);
  }
}

export class Collection extends Map {
  filter(f) { return [...this.values()].filter(f); }
  find(f) { return [...this.values()].find(f); }
  map(f) { return [...this.values()].map(f); }
  some(f) { return [...this.values()].some(f); }
  get contents() { return [...this.values()]; }
}

const COMPETENCES = ["endurance", "combat", "tir", "discretion", "vigilance", "bricolage", "survie", "soins", "parole", "conduite"];
const RESSOURCES = ["eau", "nourriture", "carburant", "medicaments", "munitions", "materiaux", "pieces", "graines", "energie"];
// Les valeurs initiales des modèles de données (scripts/modeles.mjs), comme Foundry les poserait.
function systemeParDefaut(type) {
  if (type === "survivant") {
    return {
      competences: Object.fromEntries(COMPETENCES.map(c => [c, { niveau: 0, marques: 0 }])), blessures: 0, fatigue: 0, moral: 4, faim: 0, soif: 0,
      infection: { atteint: false, stade: 0, depuis: 0 }, afflictions: [], enfance: "", passe: "", passions: Object.fromEntries(COMPETENCES.map(c => [c, 0])),
      traits: [], incapacites: [], savoirs: [], statut: "joueur", tache: "", joursTache: 0, tacheDepuis: 0, joursSansPassion: 0, joursMoralZero: 0,
      enseigne: { eleve: "", competence: "" }, histoire: { journal: "" }, age: 30, lien: "", vivant: true, livide: false, charge: 0, notes: ""
    };
  }
  if (type === "abri") {
    return { site: "", region: "", installeLe: 0, abandonneLe: null, stocks: Object.fromEntries(RESSOURCES.map(r => [r, 0])),
      nature: { cueillette: 0, gibier: 0, peche: 0, bois: 0 }, sol: 0, bruit: 0, degats: 0, notes: "" };
  }
  if (type === "installation") return { cle: "", categorie: "vie", description: "", niveau: 0, niveauMax: 1, chantier: { fait: 0, requis: 0 }, etat: 0, niveaux: [], termineLe: 0, actif: true };
  return {};
}
// Ce que la validation de Foundry refuserait (bornes et entiers des modèles) : une erreur, comme dans le vrai.
const ENTIERS = (s, chemins) => chemins.every(([p, min, max]) => { const v = chemin(s, p); return v === null || v === undefined || (Number.isInteger(v) && v >= min && v <= max); });
function valider(doc) {
  const s = doc.system;
  let ok = true;
  if (doc.type === "survivant") {
    ok = ENTIERS(s, [["blessures", 0, 4], ["fatigue", 0, 5], ["moral", 0, 5], ["faim", 0, 1e9], ["soif", 0, 1e9], ["infection.stade", 0, 6], ["age", 0, 120]])
      && COMPETENCES.every(c => ENTIERS(s, [[`competences.${c}.niveau`, 0, 5], [`passions.${c}`, 0, 2]]) && Number(s.competences?.[c]?.marques ?? 0) >= 0);
  } else if (doc.type === "abri") {
    ok = ENTIERS(s, [["bruit", 0, 10], ["degats", 0, 1e9]]) && RESSOURCES.every(r => ENTIERS(s, [[`stocks.${r}`, 0, 1e9]]));
  } else if (doc.type === "installation") {
    ok = ENTIERS(s, [["etat", 0, 3], ["niveau", 0, 20]]);
  }
  if (!ok) throw new Error(`validation de Foundry : ${doc.type} « ${doc.name} » hors bornes ${JSON.stringify(s).slice(0, 300)}`);
}

export class FauxObjet {
  constructor(d, parent = null) {
    this.id = d._id ?? nouvelId(); this.name = d.name; this.type = d.type; this.img = d.img ?? "icons/svg/item-bag.svg";
    this.system = { ...systemeParDefaut(d.type), ...structuredClone(d.system ?? {}) };
    this.flags = structuredClone(d.flags ?? {}); this.parent = parent; this.documentName = "Item";
    this.uuid = parent ? `Actor.${parent.id}.Item.${this.id}` : `Item.${this.id}`;
    valider(this);
  }
  get isOwner() { return this.parent?.isOwner ?? globalThis.game.user.isGM; }
  async update(c) { appliquer(this, c); valider(this); return this; }
  async delete() { this.parent?.items.delete(this.id); }
  toObject() { return structuredClone({ _id: this.id, name: this.name, type: this.type, img: this.img, system: this.system, flags: this.flags }); }
}

export class FauxActeur {
  constructor(d) {
    this.id = nouvelId(); this.name = d.name; this.type = d.type; this.img = d.img ?? "icons/svg/mystery-man.svg";
    const base = systemeParDefaut(d.type);
    this.system = structuredClone(base);
    appliquer(this.system, structuredClone(d.system ?? {}));
    this.ownership = structuredClone(d.ownership ?? { default: 0 });
    this.flags = structuredClone(d.flags ?? {});
    this.prototypeToken = structuredClone(d.prototypeToken ?? {});
    this.items = new Collection(); this.uuid = `Actor.${this.id}`; this.documentName = "Actor";
    for (const o of d.items ?? []) { const x = new FauxObjet(o, this); this.items.set(x.id, x); }
    valider(this);
  }
  get isOwner() { return globalThis.game.user.isGM || Number(this.ownership[globalThis.game.user.id]) >= 3; }
  get hasPlayerOwner() { return globalThis.game.users.some(u => !u.isGM && Number(this.ownership[u.id]) >= 3); }
  testUserPermission(user, niveau = "OWNER") {
    if (user?.isGM) return true;
    const n = { NONE: 0, LIMITED: 1, OBSERVER: 2, OWNER: 3 }[niveau] ?? 3;
    return Math.max(Number(this.ownership[user?.id] ?? -1), Number(this.ownership.default ?? 0)) >= n;
  }
  getFlag(scope, cle) { return this.flags?.[scope]?.[cle]; }
  async update(c) {
    const copie = structuredClone({ system: this.system, name: this.name, ownership: this.ownership, flags: this.flags });
    appliquer(this, c);
    try { valider(this); } catch (e) { Object.assign(this, copie); throw e; }
    globalThis.Hooks.callAll("updateActor", this, c);
    return this;
  }
  async delete() { globalThis.game.actors.delete(this.id); return this; }
  async createEmbeddedDocuments(type, liste) {
    const crees = liste.map(d => new FauxObjet(structuredClone(d), this));
    for (const o of crees) this.items.set(o.id, o);
    for (const o of crees) globalThis.Hooks.callAll("createItem", o);
    return crees;
  }
  async updateEmbeddedDocuments(type, majs) {
    const faits = [];
    for (const { _id, ...c } of majs) { const o = this.items.get(_id); if (!o) continue; await o.update(c); faits.push(o); globalThis.Hooks.callAll("updateItem", o, c); }
    return faits;
  }
  async deleteEmbeddedDocuments(type, ids) { for (const id of ids) this.items.delete(id); return ids; }
}

export class FauxJournal {
  constructor(d) {
    this.id = nouvelId(); this.uuid = `JournalEntry.${this.id}`; this.name = d.name; this.flags = structuredClone(d.flags ?? {});
    this.ownership = structuredClone(d.ownership ?? {}); this.pages = new Collection();
    this.ajouter(d.pages ?? []);
  }
  ajouter(pages) { for (const p of pages) { const page = { ...structuredClone(p), id: nouvelId() }; this.pages.set(page.id, page); } }
  getFlag(scope, cle) { return this.flags?.[scope]?.[cle]; }
  async createEmbeddedDocuments(type, pages) { this.ajouter(pages); return pages; }
  async deleteEmbeddedDocuments(type, ids) { for (const id of ids) this.pages.delete(id); return ids; }
}

// L'auteur d'un message, comme le serveur v14 le fixe (DocumentAuthorField) : celui qui l'écrit ; seul un MJ peut en nommer un autre.
class FauxMessage {
  constructor(d) {
    const { author, ...reste } = d ?? {};
    this.id = nouvelId(); Object.assign(this, structuredClone(reste)); this.flags ??= {};
    const u = globalThis.game.user;
    this.author = u?.isGM && typeof author === "string" ? globalThis.game.users.get(author) ?? u : u;
  }
  async update(c) { appliquer(this, c); return this; }
}

// ------------------------------------------------------------------ installation
export let journalHooks = [], emissions = [], messages = [], reglages = new Map(), notifications = [], erreursHooks = [], ecrituresMonde = [];
let ecouteurs = [], enVol = new Set(), erreursSocket = [];
export const erreurs = () => [...erreursSocket, ...erreursHooks];

function livrer(fn) {
  const p = new Promise(r => setImmediate(r)).then(fn).catch(e => { erreursSocket.push(e); });
  enVol.add(p);
  p.finally(() => enVol.delete(p));
  return p;
}
// Le chiffrement du coffre (WebCrypto) se fait hors du fil JavaScript : sa durée varie avec la charge de la machine. Chaque
// opération en cours est suivie, pour que calme() l'attende aussi au lieu d'un délai fixe (un déchiffrement encore en route à la
// fin d'un essai finissait sinon dans le monde de l'essai suivant).
const cryptoEnVol = new Set();
{
  const subtle = globalThis.crypto.subtle;
  for (const nom of ["encrypt", "decrypt", "digest", "importKey", "exportKey", "generateKey", "deriveKey", "deriveBits", "sign", "verify"]) {
    const original = subtle[nom].bind(subtle);
    subtle[nom] = (...args) => {
      const p = original(...args);
      cryptoEnVol.add(p);
      p.catch(() => null).finally(() => cryptoEnVol.delete(p));
      return p;
    };
  }
}
// Attend que tous les messages du socket soient livrés et traités, et que plus aucun chiffrement ne soit en cours ; « calme » :
// rien en vol, ni après un tour de boucle, ni après une minuterie de 1 ms (les suites posées par setTimeout(…, 0) passent avant).
export async function calme() {
  for (let i = 0; i < 2000; i++) {
    await new Promise(r => setImmediate(r));
    if (!enVol.size && !cryptoEnVol.size) {
      await new Promise(r => setTimeout(r, 1));
      if (!enVol.size && !cryptoEnVol.size) return;
    }
    await Promise.allSettled([...enVol, ...cryptoEnVol]);
  }
  throw new Error("Socket : messages toujours en vol.");
}
// Le message est-il livré au navigateur de cet utilisateur ? (comme handleCustomSocket du serveur v14 : jamais à l'émetteur)
export const livreA = (e, userId) => e.emetteur !== userId && (!e.recipients || e.recipients.includes(userId));

// Un joueur dans ce navigateur le temps d'un appel (le reste de l'essai reste chez le MJ).
export async function commeJoueur(userId, fn) {
  const avant = globalThis.game.user;
  globalThis.game.user = globalThis.game.users.get(userId);
  try { return fn(); } finally { globalThis.game.user = avant; }
}

// joueurs : nombre de comptes joueurs ; moteur : le MJ IA actif (son coffre) ; mjActif : l'id du MJ actif (null : aucun).
export function installerFoundry({ joueurs = 2, moteur = true } = {}) {
  compteur = 0;
  journalHooks = []; emissions = []; messages = []; reglages = new Map(); notifications = []; erreursHooks = []; ecrituresMonde = [];
  ecouteurs = []; enVol = new Set(); erreursSocket = [];
  const users = new Collection();
  const mj = { id: "mj", name: "Meneur", isGM: true, active: true, character: null, update: async d => Object.assign(mj, d) };
  users.set("mj", mj);
  for (let i = 1; i <= joueurs; i++) {
    const u = { id: `u${i}`, name: `Joueur ${i}`, isGM: false, active: true, character: null };
    u.update = async d => { if ("character" in d) u.character = globalThis.game.actors.get(d.character) ?? null; return u; };
    users.set(u.id, u);
  }
  let actif = "mj";
  Object.defineProperty(users, "activeGM", { get: () => (actif ? users.get(actif) : null), configurable: true });
  users.choisirActif = id => { actif = id; };
  const formater = (cle, d = {}) => {
    const brut = chemin(FR, cle);
    return typeof brut === "string" ? brut.replace(/\{(\w+)\}/g, (_, k) => d[k] ?? `{${k}}`) : cle;
  };
  const actors = new Collection();
  const journal = new Collection();
  const messagesCol = new Collection();
  globalThis.game = {
    user: mj, users, actors, journal, messages: messagesCol, ready: true, system: { id: "lakour-survie", version: "0.1.0" }, world: { id: "fenoir-essai" },
    packs: new Collection(), items: { fromCompendium: d => d.toObject() }, scenes: new Collection(), playlists: null,
    i18n: { localize: c => formater(c), format: formater, has: c => typeof chemin(FR, c) === "string", lang: "fr" },
    settings: {
      settings: new Map(),
      register(id, cle, conf) { reglages.set(`${id}.${cle}`, { valeur: structuredClone(conf.default), conf }); this.settings.set(`${id}.${cle}`, conf); },
      get(id, cle) {
        const r = reglages.get(`${id}.${cle}`);
        if (!r) throw new Error(`réglage non enregistré : ${id}.${cle}`);
        return structuredClone(r.valeur);
      },
      async set(id, cle, v) {
        const r = reglages.get(`${id}.${cle}`);
        if (!r) throw new Error(`réglage non enregistré : ${id}.${cle}`);
        // Comme Foundry : un réglage monde ne s'écrit que par un MJ.
        if (r.conf.scope === "world" && !globalThis.game.user.isGM) throw new Error(`un joueur ne peut pas écrire ${id}.${cle}`);
        r.valeur = structuredClone(v);
        if (r.conf.scope === "world") ecrituresMonde.push({ cle: `${id}.${cle}`, valeur: structuredClone(v) });
        r.conf.onChange?.(structuredClone(v));
        return v;
      }
    },
    socket: {
      emit: (canal, m, options = {}) => {
        const recipients = Array.isArray(options?.recipients) ? [...options.recipients] : null;
        const emetteur = globalThis.game.user.id;
        const e = { canal, message: structuredClone(m), recipients, emetteur };
        emissions.push(e);
        // Un seul « autre navigateur » branché ici : celui qui écoute (le système, chez le MJ ou chez un joueur). Les annonces du MJ
        // à tous (sans destinataires) vont aux navigateurs des joueurs, qui ne sont pas simulés : elles ne lui reviennent pas.
        const pourUnAutre = recipients ? recipients.some(id => id !== emetteur) : !users.get(emetteur)?.isGM;
        if (pourUnAutre) for (const l of ecouteurs.filter(x => x.canal === canal)) livrer(() => l.fn(structuredClone(m), emetteur));
      },
      on: (canal, fn) => { ecouteurs.push({ canal, fn }); }
    }
  };
  // Le MJ IA : son coffre (réglages du moteur, API comme dans scripts/main.js du moteur).
  CoffreMoteur.oublierCoffre();
  game.modules = new Collection();
  if (moteur) {
    const enregistrer = (cle, scope, type, defaut) => game.settings.register("lakour-mj-ia", cle, { scope, config: false, type, default: defaut });
    for (const cle of ["trousseau", "coffreCarnet", "filsScelles"]) enregistrer(cle, "world", Object, {});
    for (const cle of ["cleCarnet", "partCarnet"]) enregistrer(cle, "client", Object, {});
    for (const cle of ["horloges", "enquetes", "contacts"]) enregistrer(cle, "world", Array, []);
    game.settings.register("lakour-mj-ia", "fete", { scope: "world", config: true, type: String, default: "auto" });
    game.modules.set("lakour-mj-ia", { id: "lakour-mj-ia", active: true, api: { coffre: apiCoffreMoteur() } });
  }
  game.modules.set("lakour-fenoir", { id: "lakour-fenoir", active: true, api: {} });

  const ecouteursHooks = new Map();
  const liste = nom => [...(ecouteursHooks.get(nom) ?? [])];
  globalThis.Hooks = {
    events: {},
    callAll: (nom, ...args) => {
      const copie = a => { try { return structuredClone(a); } catch { return "[non clonable]"; } };
      journalHooks.push({ nom, args: args.map(a => (a && typeof a === "object" && a.documentName ? { id: a.id } : copie(a))) });
      for (const e of liste(nom)) {
        if (e.once) ecouteursHooks.get(nom).delete(e);
        try { const r = e.fn(...args); if (r?.catch) r.catch(err => erreursHooks.push(err)); } catch (err) { erreursHooks.push(err); }
      }
      return true;
    },
    call: (nom, ...args) => {
      for (const e of liste(nom)) { try { if (e.fn(...args) === false) return false; } catch (err) { erreursHooks.push(err); } }
      return true;
    },
    on: (nom, fn) => { if (!ecouteursHooks.has(nom)) ecouteursHooks.set(nom, new Set()); const e = { fn }; ecouteursHooks.get(nom).add(e); return e; },
    once: (nom, fn) => { if (!ecouteursHooks.has(nom)) ecouteursHooks.set(nom, new Set()); const e = { fn, once: true }; ecouteursHooks.get(nom).add(e); return e; }
  };
  globalThis.CONST = { DOCUMENT_OWNERSHIP_LEVELS: { NONE: 0, LIMITED: 1, OBSERVER: 2, OWNER: 3 }, TOKEN_DISPOSITIONS: { HOSTILE: -1, NEUTRAL: 0, FRIENDLY: 1 }, PLAYLIST_MODES: { DISABLED: -1 } };
  globalThis.Actor = { implementation: { create: async d => { const a = new FauxActeur(d); game.actors.set(a.id, a); Hooks.callAll("createActor", a); return a; } } };
  globalThis.JournalEntry = { implementation: { create: async d => { const j = new FauxJournal(d); game.journal.set(j.id, j); return j; } } };
  globalThis.ChatMessage = {
    implementation: {
      create: async d => { const m = new FauxMessage(d); messages.push(m); messagesCol.set(m.id, m); Hooks.callAll("createChatMessage", m); return m; },
      getSpeaker: ({ actor } = {}) => ({ alias: actor?.name ?? "?", actor: actor?.id ?? null })
    }
  };
  globalThis.fromUuid = async () => null;
  globalThis.ui = { notifications: { info: t => notifications.push({ niveau: "info", texte: String(t) }), warn: t => notifications.push({ niveau: "warn", texte: String(t) }), error: t => notifications.push({ niveau: "error", texte: String(t) }) } };
  globalThis.canvas = { ready: false, scene: null };
  class ApplicationV2 { constructor(o = {}) { this.options = o; } render() { return this; } close() {} get rendered() { return false; } get element() { return null; } }
  globalThis.foundry = {
    utils: {
      deepClone: o => structuredClone(o), randomID: () => nouvelId().slice(-16), escapeHTML: s => String(s).replace(/</g, "&lt;"), getRoute: r => `/${r}`,
      mergeObject: (a, b, { inplace = true } = {}) => { const c = inplace ? a : structuredClone(a); appliquer(c, b); return c; },
      getProperty: chemin
    },
    applications: {
      api: { ApplicationV2, HandlebarsApplicationMixin: c => c, DialogV2: { wait: async () => null } },
      sheets: { ActorSheetV2: ApplicationV2, ItemSheetV2: ApplicationV2 },
      ux: { TextEditor: { implementation: { enrichHTML: async h => h } } },
      instances: new Map()
    },
    audio: { AudioHelper: { play: () => Promise.resolve() } }
  };
  return { users, mj };
}

// Le registre du contenu, comme au « setup » : le module répond au crochet par registre.ajouter(donnees).
export function enregistrerContenu(registre, donnees = DONNEES) {
  registre.oublier?.();
  const fn = r => r.ajouter(structuredClone(donnees));
  Hooks.on("lakourSurvie.enregistrer", fn);
  Hooks.callAll("lakourSurvie.enregistrer", registre.interface);
}

// L'API du coffre du MJ IA, telle que son main.js la publie (game.modules.get("lakour-mj-ia").api.coffre).
export function apiCoffreMoteur() {
  const api = {
    etat: () => CoffreMoteur.etatCoffre(),
    sceller: contenu => CoffreMoteur.scellerPourAutre(contenu),
    scellerEnPartant: contenu => CoffreMoteur.scellerEnPartant(contenu),
    ouvrirScelle: scelle => CoffreMoteur.ouvrirPourAutre(scelle),
    scellerAvec: (contenu, cle) => CoffreMoteur.scellerAvec(contenu, cle),
    siRenouvele: fn => CoffreMoteur.siRenouvele(cle => (enPlace() ? fn(cle) : undefined)),
    siDisponible: fn => CoffreMoteur.siCleDisponible((...a) => (enPlace() ? fn(...a) : undefined))
  };
  const enPlace = () => globalThis.game?.modules?.get?.("lakour-mj-ia")?.api?.coffre === api;
  return api;
}

// Les réglages de portée monde (livrés à tous les navigateurs) et leurs valeurs.
export const reglagesMonde = () => [...reglages.entries()].filter(([, r]) => r.conf?.scope === "world").map(([k, r]) => [k, structuredClone(r.valeur)]);
export const valeur = cle => structuredClone(reglages.get(cle)?.valeur);
