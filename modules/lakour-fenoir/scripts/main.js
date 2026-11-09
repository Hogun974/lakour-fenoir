// Le module de contenu « Fénoir » dans un monde lakour-survie (contrat §6, §9) :
// 1. le registre de l'île (assets/donnees.json, écrit par outils/fabriquer-fenoir.mjs) chargé par fetch dès l'« init » et remis au
//    système au crochet « lakourSurvie.enregistrer » (registre.ajouter(donnees)) ;
// 2. les fêtes de Fénoir déclinées auprès du socle des fêtes du moteur (lakour-mj-ia, docs/fetes.md), dans chaque navigateur ;
// 3. les horloges de réputation des factions (rep-<faction>) assurées auprès du moteur, chez le MJ actif ;
// 4. l'installation (MJ actif) : guides des joueurs, journaux du MJ (cachés) et carte de La Réunion importés dans le monde, avec
//    les identifiants du compendium (les épingles de la carte visent les pages du journal « Les régions de l'île ») ; dans un
//    monde déjà installé, les journaux présents reçoivent les pages nouvelles et les pages intactes sont remises à jour
//    (scripts/mise-a-jour.js : une page retouchée par le MJ reste telle quelle).
import { FETES_FENOIR, imageDeFete, fetesDuJour } from "./fetes.js";
import { ID } from "./identite.js";
import { avecEmpreintes, planMiseAJour } from "./mise-a-jour.js";

// ID : « lakour-fenoir » ou « lakour-fenoir-en » (version anglaise engendrée, mêmes scripts) ; tout ce qui porte l'identifiant
// (réglages, drapeaux, compendiums, chemin du registre) passe par lui.
const SYSTEME = "lakour-survie";
const VERSION_CONTENU = "0.2.5"; // = module.json (essais/mise-a-jour-fenoir.test.mjs)
const FICHIER_DONNEES = `modules/${ID}/assets/donnees.json`;

// ---------- 1. Le registre de l'île
let DONNEES = null;
let chargement = null;
function chargerDonnees() {
  chargement ??= fetch(foundry.utils.getRoute(FICHIER_DONNEES), { cache: "no-store" })
    .then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
    .then(d => (DONNEES = d))
    .catch(erreur => {
      console.error(`${ID} | données`, erreur);
      Hooks.once("ready", () => globalThis.ui?.notifications?.error?.(game.i18n.format("LAKOURFENOIR.Erreurs.Donnees", { erreur: erreur.message }), { permanent: true }));
      return null;
    });
  return chargement;
}
Hooks.once("init", () => {
  game.settings.register(ID, "installe", { scope: "world", config: false, type: String, default: "" });
  if (game.system.id === SYSTEME) chargerDonnees();
});

// Le système appelle ce crochet au « setup ». Le fetch lancé à l'« init » est presque toujours fini ; sinon, on remet une promesse
// au registre s'il sait attendre (registre.attendre), et on ajoute les données dès qu'elles arrivent.
Hooks.on("lakourSurvie.enregistrer", registre => {
  if (DONNEES) { registre.ajouter(DONNEES); return; }
  const tardif = chargerDonnees().then(d => { if (d) registre.ajouter(d); return d; });
  registre.attendre?.(tardif);
});

// ---------- 2. Les fêtes (calendrier réel du moteur) : seules celles qui y existent sont déclinées ; les autres vivent au
// calendrier du jeu (donnees.fetes, fetesDuJour) que le système et le MJ IA lisent. Les textes viennent du registre chargé
// (assets/donnees.json : en anglais dans lakour-fenoir-en), à défaut de scripts/fetes.js (français).
export function declinaisonsDeFete(fetes = DONNEES?.fetes ?? FETES_FENOIR) {
  return fetes.filter(f => f.moteur ?? f.cle).map(f => ({ id: `fenoir-${f.cle}`, fete: f.moteur ?? f.cle, nom: f.nom, description: f.description, consigne: f.consigne, decor: f.decor }));
}
export function enregistrerFetes(api) {
  if (game.system.id !== SYSTEME || typeof api?.fetes?.enregistrer !== "function") return 0;
  let n = 0;
  for (const d of declinaisonsDeFete()) {
    try { api.fetes.enregistrer(d); n++; } catch (erreur) { console.warn(`${ID} | fête ${d.id}`, erreur); }
  }
  return n;
}

// ---------- 3. Les horloges de réputation (donnees.reputations.horloges), si le moteur sait en tenir.
export async function assurerReputations(api = game.modules.get("lakour-mj-ia")?.api) {
  const horloges = api?.horloges;
  if (typeof horloges?.assurer !== "function") return 0;
  const d = DONNEES ?? await chargerDonnees();
  let n = 0;
  for (const h of d?.reputations?.horloges ?? []) {
    try { await horloges.assurer(h); n++; } catch (erreur) { console.warn(`${ID} | réputation ${h.id}`, erreur); }
  }
  return n;
}
let reputationsEnCours = null;
function reputationsAuChargement(api) {
  if (game.user !== game.users.activeGM || game.system.id !== SYSTEME) return Promise.resolve(0);
  reputationsEnCours ??= assurerReputations(api).catch(e => { console.warn(`${ID} | réputations`, e); return 0; }).finally(() => { reputationsEnCours = null; });
  return reputationsEnCours;
}
Hooks.once("lakour-mj-ia.pret", async api => {
  if (game.system.id === SYSTEME) await chargerDonnees(); // les textes des fêtes, dans la langue du module
  enregistrerFetes(api);
  if (game.ready) reputationsAuChargement(api);
});

// ---------- 4. L'installation
async function dossier(type, nom) {
  return game.folders.find(f => f.type === type && f.getFlag(ID, "dossier") === nom)
    ?? Folder.implementation.create({ name: nom, type, color: "#2b3a2f", flags: { [ID]: { dossier: nom } } });
}

let installationEnCours = null;
export function installer() {
  installationEnCours ??= installerContenu()
    .catch(erreur => {
      console.error(`${ID} | installation`, erreur);
      ui.notifications.error(game.i18n.format("LAKOURFENOIR.Erreurs.Installation", { erreur: erreur.message }), { permanent: true });
    })
    .finally(() => { installationEnCours = null; });
  return installationEnCours;
}

// Un journal déjà dans le monde : pages nouvelles ajoutées, pages intactes remises à jour (ou retirées si le compendium ne
// les a plus), pages retouchées à la main et pages du MJ IA gardées.
async function mettreAJourJournal(journal, modele) {
  const { creer, maj, supprimer, gardees } = planMiseAJour(ID, journal.pages.contents.map(p => p.toObject()), modele.pages.contents.map(p => p.toObject()));
  if (creer.length) await journal.createEmbeddedDocuments("JournalEntryPage", creer, { keepId: true });
  if (maj.length) await journal.updateEmbeddedDocuments("JournalEntryPage", maj);
  if (supprimer.length) await journal.deleteEmbeddedDocuments("JournalEntryPage", supprimer);
  if (journal.getFlag(ID, "version") !== VERSION_CONTENU) await journal.setFlag(ID, "version", VERSION_CONTENU);
  if (!creer.length && !maj.length && !supprimer.length && !gardees.length) return null;
  let texte = game.i18n.format("LAKOURFENOIR.MisAJour", { journal: journal.name, ajouts: creer.length, maj: maj.length + supprimer.length });
  if (gardees.length) texte += ` ${game.i18n.format("LAKOURFENOIR.Gardees", { liste: gardees.join(", ") })}`;
  return texte;
}

async function installerContenu() {
  if (game.system.id !== SYSTEME) return ui.notifications.warn(game.i18n.localize("LAKOURFENOIR.MauvaisSysteme"));
  const rapport = [];
  const nomDossier = game.i18n.localize("LAKOURFENOIR.Titre");
  // Journaux : guides (lisibles des joueurs) et journaux du MJ (cachés) ; visibilité fixée par le compendium. Même identifiant
  // qu'au compendium quand il est libre : les épingles de la carte le visent.
  for (const pack of ["guides", "mj"]) {
    for (const j of await game.packs.get(`${ID}.${pack}`)?.getDocuments() ?? []) {
      const present = game.journal.find(x => x.getFlag(ID, "cle") === j.getFlag(ID, "cle"));
      if (present) {
        const r = await mettreAJourJournal(present, j);
        if (r) rapport.push(r);
        continue;
      }
      const libre = !game.journal.get(j.id);
      const donnees = foundry.utils.mergeObject(game.journal.fromCompendium(j, { keepId: libre, clearOwnership: false }), { [`flags.${ID}.version`]: VERSION_CONTENU });
      donnees.pages = avecEmpreintes(ID, donnees.pages ?? []);
      await JournalEntry.implementation.create({ ...donnees, folder: (await dossier("JournalEntry", nomDossier)).id }, { keepId: libre });
      rapport.push(j.name);
    }
  }
  // La carte de La Réunion (les cartes de lieux restent au compendium : le MJ IA les active au besoin).
  for (const s of await game.packs.get(`${ID}.scenes`)?.getDocuments() ?? []) {
    if (s.getFlag(ID, "cle") !== "carte-de-la-reunion" || game.scenes.find(x => x.getFlag(ID, "cle") === "carte-de-la-reunion")) continue;
    const donnees = game.scenes.fromCompendium(s, { keepId: !game.scenes.get(s.id) });
    await Scene.implementation.create({ ...donnees, folder: (await dossier("Scene", nomDossier)).id }, { keepId: !game.scenes.get(s.id) });
    rapport.push(s.name);
  }
  const n = await reputationsAuChargement();
  if (n) rapport.push(game.i18n.format("LAKOURFENOIR.Reputations", { n }));
  await game.settings.set(ID, "installe", VERSION_CONTENU);
  ui.notifications.info(game.i18n.format("LAKOURFENOIR.Installe", { liste: rapport.join(", ") || game.i18n.localize("LAKOURFENOIR.RienDeNeuf") }));
}

Hooks.once("ready", async () => {
  game.modules.get(ID).api = { donnees: () => DONNEES, chargerDonnees, installer, fetesDuJour, imageDeFete, declinaisonsDeFete };
  if (game.system.id !== SYSTEME || !game.user.isGM || game.user !== game.users.activeGM) return;
  reputationsAuChargement();
  if (game.settings.get(ID, "installe") === VERSION_CONTENU) return;
  const ok = await foundry.applications.api.DialogV2.confirm({
    window: { title: "LAKOURFENOIR.Titre" },
    content: `<p>${game.settings.get(ID, "installe") ? game.i18n.format("LAKOURFENOIR.ProposerMiseAJour", { version: VERSION_CONTENU }) : game.i18n.localize("LAKOURFENOIR.Proposer")}</p>`,
    rejectClose: false
  });
  if (ok) await installer();
});
