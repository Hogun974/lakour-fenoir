// Batterie de mutations sur la couche Foundry du système lakour-survie : chaque règle clé de l'API (garde du MJ actif, garde du
// monde ouvert, scellement, non-fuite des faits secrets, propriété du survivant, auteur donné par le serveur, une seule poussée,
// une seule marque par test) est cassée dans une copie du système ; la vérification qui la protège doit alors échouer. Le système
// d'origine les passe toutes.  Lancer : npm run essais
import { test } from "node:test";
import assert from "node:assert/strict";
import { installerFoundry, messages, reglagesMonde, ecrituresMonde, calme, commeJoueur } from "./doublures/foundry-survie.mjs";
import { charger, monde, survivantTire, copieMutee } from "./doublures/survie-api-outils.mjs";

installerFoundry();
const GRAINE = "GRAINE-MUTANTE-91c2";

async function debut(M0, { joueur = "u1", graine = GRAINE } = {}) {
  const M = await monde(M0);
  const a = await survivantTire(M, { userId: joueur });
  await M.api.demarrer({ region: "saint-paul", membres: [a.id], graine, essai: true });
  return { M, a };
}

const VERIFICATIONS = {
  // Hors du MJ actif, rien ne s'écrit (erreur PasMJActif).
  async gardeMJ(M0) {
    const { M } = await debut(M0);
    await commeJoueur("u1", () => assert.rejects(() => M.api.avancer({ quarts: 1 }), /PasMJActif/));
  },
  // Monde fermé (mémoire perdue) : rien ne s'écrit (MondeFerme).
  async gardeMonde(M0) {
    const { M } = await debut(M0);
    M.Coffre._reinitialiser();
    await assert.rejects(() => M.api.avancer({ quarts: 1 }), /MondeFerme/);
    await calme();
  },
  // Avec le moteur, le monde n'est jamais en clair dans les réglages du monde.
  async scelle(M0) {
    const { M } = await debut(M0);
    await M.api.avancer({ quarts: 8 });
    assert.ok(!JSON.stringify(reglagesMonde()).includes(GRAINE));
    assert.ok(!JSON.stringify(ecrituresMonde).includes(GRAINE), "jamais écrit en clair, même un instant");
  },
  // Les faits secrets n'arrivent jamais au chat.
  async faitsSecrets(M0) {
    const { M } = await debut(M0);
    await M.api.avancer({ quarts: 160 });
    const publics = new Set(M.api.etat().journal.map(e => e.texte));
    const secrets = M.api.monde().journalSecret.map(e => e.texte).filter(x => !publics.has(x));
    assert.ok(secrets.length > 3);
    const chat = messages.map(m => m.content).join("\n");
    for (const s of secrets) assert.ok(!chat.includes(s), s);
  },
  // Un joueur ne lance que les tests de SON survivant.
  async proprietaire(M0) {
    const { M, a } = await debut(M0);
    const avant = messages.length;
    const r = commeJoueur("u2", () => M.module.requete("test", { acteurId: a.id, competence: "tir" }));
    const verif = assert.rejects(r, /PasProprietaire/);
    verif.catch(() => null);
    await calme();
    await verif;
    assert.equal(messages.length, avant);
  },
  // L'auteur est celui que donne le serveur : un message qui ment sur son auteur est rejeté.
  async auteur(M0) {
    const { M, a } = await debut(M0);
    const avant = messages.length;
    M.traiterMessage({ type: "requete", id: "faux", action: "test", donnees: { acteurId: a.id, competence: "tir" }, userId: "u1" }, "u2");
    await calme();
    assert.equal(messages.length, avant);
  },
  // Sans émetteur donné par le serveur, une requête n'est pas traitée (même si elle se dit d'un joueur).
  async sansEmetteur(M0) {
    const { M, a } = await debut(M0);
    const avant = messages.length;
    M.traiterMessage({ type: "requete", id: "sans", action: "test", donnees: { acteurId: a.id, competence: "tir" }, userId: "u1" }, undefined);
    await calme();
    assert.equal(messages.length, avant);
  },
  // Une carte de test forgée par un joueur (drapeaux à sa façon) ne se force pas.
  async carteForgee(M0) {
    const { M, a } = await debut(M0);
    const forge = await commeJoueur("u1", () => ChatMessage.implementation.create({ content: "", flags: { "lakour-survie": { test: { acteurId: a.id, competence: "tir", forcable: true,
      resultat: { des: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1], succes: 0, requis: 1, reussite: false, force: false, marque: false, compte: true, difficulte: "normale", reserve: 10 } } } } }));
    await assert.rejects(() => M.api.forcer({ messageId: forge.id }), /TestInconnu/);
  },
  // Le test libre d'un joueur : normale, sans marque, jamais forcé d'emblée.
  async testLibre(M0) {
    const { M, a } = await debut(M0);
    const p = commeJoueur("u1", () => M.module.requete("test", { acteurId: a.id, competence: "tir", difficulte: "extreme", forcer: true }));
    await calme();
    const r = await p;
    assert.equal(r.difficulte, "normale");
    assert.equal(r.compte, false);
    assert.equal(r.force, false);
  },
  // Une demande du MJ ne sert qu'une fois.
  async demandeUneFois(M0) {
    const { M, a } = await debut(M0);
    await M.api.demanderTest({ acteurId: a.id, competence: "survie", difficulte: "difficile" });
    const lancer = async () => { const p = commeJoueur("u1", () => M.module.requete("test", { acteurId: a.id, competence: "survie" })); await calme(); return p; };
    assert.equal((await lancer()).compte, true);
    assert.equal((await lancer()).compte, false);
  },
  // Une maladie en incubation ne s'écrit pas sur l'acteur (que son joueur lit).
  async incubation(M0) {
    const { M, a } = await debut(M0);
    await M.api.affliction({ acteurId: a.id, cle: "tetanos", action: "donner" });
    assert.ok(!(a.system.afflictions ?? []).some(x => x.stade === "incubation"));
  },
  // Un test ne se force qu'une fois.
  async uneFois(M0) {
    const { M, a } = await debut(M0);
    await M.api.test({ acteurId: a.id, competence: "tir", difficulte: "normale" });
    const id = messages.at(-1).id;
    await M.api.forcer({ messageId: id });
    await assert.rejects(() => M.api.forcer({ messageId: id }), /DejaForce/);
  },
  // Une seule marque par test, même forcé après un échec.
  async uneMarque(M0) {
    const { M, a } = await debut(M0);
    await a.update({ system: { competences: { tir: { niveau: 0, marques: 0 } }, passions: { tir: 0 }, age: 40 } });
    const r = await M.api.test({ acteurId: a.id, competence: "tir", difficulte: "extreme" });
    assert.equal(r.marque, true);
    await M.api.forcer({ messageId: messages.at(-1).id });
    assert.equal(a.system.competences.tir.niveau, 0);
    assert.equal(a.system.competences.tir.marques, 1);
  }
};

const MUTATIONS = [
  ["gardeMJ", "scripts/api.mjs", "function exigerMJ() {\n  if (!estMJActif()) throw erreur(\"PasMJActif\");\n}", "function exigerMJ() {}"],
  ["gardeMonde", "scripts/coffre.mjs", "return Boolean(etat.demarree && etat.partie) && !mondeOuvert();", "return false;"],
  ["scelle", "scripts/coffre.mjs", "  const contenu = { partie: memoire.partie, rev: memoire.rev, monde: memoire.monde };",
    "  const contenu = { partie: memoire.partie, rev: memoire.rev, monde: memoire.monde };\n  await game.settings.set(ID, \"mondeClair\", contenu);"],
  ["faitsSecrets", "scripts/api.mjs", "  ctx.faits.push(...r.faits);", "  ctx.faits.push(...r.faits, ...r.secrets);"],
  ["proprietaire", "scripts/api.mjs", "      case \"test\": {\n        if (!proprietaireDe(acteur(d.acteurId), qui)) throw erreur(\"PasProprietaire\");", "      case \"test\": {"],
  ["auteur", "scripts/canal.mjs", "  if (message?.userId && message.userId !== emetteur) return null;\n  return emetteur;",
    "  return message?.userId || emetteur || null;"],
  ["sansEmetteur", "scripts/canal.mjs", "  if (!emetteur || typeof emetteur !== \"string\") return null;\n  if (message?.userId && message.userId !== emetteur) return null;\n  return emetteur;",
    "  if (emetteur && message?.userId && message.userId !== emetteur) return null;\n  return emetteur || message?.userId || null;"],
  ["carteForgee", "scripts/demandes.mjs", "export const deMJ = message => Boolean(message?.author?.isGM);", "export const deMJ = message => Boolean(message);"],
  ["testLibre", "scripts/api.mjs", "await testDirect(game.users.get(qui)?.isGM ? { ...d, forcable: true } : argumentsDuTestJoueur(d, demande));",
    "await testDirect({ ...d, forcable: true });"],
  ["demandeUneFois", "scripts/demandes.mjs", "  await demande?.message?.update?.({ [`flags.${ID}.repondue`]: reponseId || true });", ""],
  ["incubation", "scripts/api.mjs", "    maj.afflictions = structuredClone(system.afflictions.filter(x => !enIncubation(x)));", "    maj.afflictions = structuredClone(system.afflictions);"],
  ["uneFois", "scripts/api.mjs", "  if (f.resultat.force || f.forcable === false) throw erreur(\"DejaForce\");", ""],
  ["uneMarque", "scripts/api.mjs", "  const r2 = { ...r, marque: r.marque && !f.resultat.marque };", "  const r2 = { ...r };"]
];

test("le système d'origine passe toutes les vérifications", async () => {
  const M0 = await charger();
  for (const [nom, verif] of Object.entries(VERIFICATIONS)) {
    try { await verif(M0); } catch (e) { assert.fail(`${nom} : ${e.message}`); }
  }
});

for (const [nom, fichier, avant, apres] of MUTATIONS) {
  test(`mutation détectée : ${nom} (${fichier})`, async () => {
    const copie = copieMutee([[fichier, avant, apres]]);
    try {
      const M0 = await charger(copie.racine);
      await assert.rejects(() => VERIFICATIONS[nom](M0), `la mutation « ${nom} » n'est pas détectée`);
      await calme().catch(() => null);
    } finally { copie.nettoyer(); }
  });
}
