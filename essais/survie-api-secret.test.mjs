// Le secret du monde réel (contrat §4) dans la couche Foundry du système lakour-survie :
// - non-fuite : pendant une partie, RIEN du monde réel dans les réglages du monde (livrés à tous), dans le chat, dans l'état public,
//   dans ce qui part au socket vers les joueurs, ni dans les crochets publics ;
// - scellement : avec le coffre du MJ IA (le vrai), après chaque changement (révision croissante), jamais en clair ;
// - réouverture : rechargement (copie du navigateur du MJ), autre navigateur (clé du moteur), clé absente (rien ne s'écrit, puis la
//   clé revient), coffre plus récent qu'ailleurs (périmé : on n'écrit pas) ;
// - sans le moteur : le monde en clair et un avertissement permanent au MJ.
// Lancer : npm run essais
import { test } from "node:test";
import assert from "node:assert/strict";
import { installerFoundry, messages, emissions, journalHooks, notifications, reglagesMonde, ecrituresMonde, valeur, reglages, calme, commeJoueur, CoffreMoteur } from "./doublures/foundry-survie.mjs";
import { charger, monde, survivantTire } from "./doublures/survie-api-outils.mjs";

installerFoundry();
const M0 = await charger();
const GRAINE = "GRAINE-TRES-SECRETE-7f3a";
const CLES_SECRETES = ["journalSecret", "coupures", "abrisAbandonnes", "sitesVisites", "\"hordes\"", GRAINE];

// Une partie bien remplie : installation, chantiers, fouilles, exploration, voyage, temps qui passe, tests de joueurs.
async function partie(M) {
  const a = await survivantTire(M, { userId: "u1" });
  const b = await survivantTire(M, { userId: "u2" });
  await M.api.demarrer({ region: "saint-paul", membres: [a.id, b.id], graine: GRAINE, essai: true });
  await M.api.installer({ site: "college-hauts-saint-paul" });
  await M.api.ajuster({ stocks: { nourriture: 60, materiaux: 10, pieces: 4 } });
  await M.api.construire({ installation: "citerne-de-pluie", quarts: 3 });
  await M.api.fouiller({ quarts: 1, prudence: "rapide" });
  await M.api.explorer({ region: "le-port", quarts: 1 });
  const t = commeJoueur("u1", () => M.api.test({ acteurId: a.id, competence: "vigilance" }));
  await calme();
  await t;
  await M.api.avancer({ quarts: 90, raison: "trois semaines" });
  await M.api.voyager({ vers: "hauts-de-l-ouest" });
  await M.api.voyager({ vers: "saint-paul" });
  await M.api.avancer({ quarts: 40 });
  await calme();
  return { a, b };
}

// Ce qu'un joueur reçoit : réglages du monde, chat, état public, socket qui lui est livré, crochets diffusés.
function toutCeQueVoitUnJoueur(userId) {
  return JSON.stringify({
    reglages: reglagesMonde(),
    ecritures: ecrituresMonde,
    chat: messages.map(m => ({ content: m.content, flags: m.flags, speaker: m.speaker })),
    socket: emissions.filter(e => e.emetteur !== userId && (!e.recipients || e.recipients.includes(userId))).map(e => e.message)
  });
}

test("non-fuite : rien du monde réel dans les réglages du monde, le chat, l'état public, le socket vers les joueurs", async () => {
  const M = await monde(M0);
  await partie(M);
  const reel = M.api.monde();
  assert.ok(reel.journalSecret.length > 5, "il s'est passé des choses hors de vue");
  assert.equal(reel.graine, GRAINE);
  const publics = new Set(M.api.etat().journal.map(e => e.texte));
  // Les textes secrets (jamais devenus publics) et les menaces non résolues.
  const secrets = [...reel.journalSecret.map(e => e.texte).filter(x => !publics.has(x)), ...reel.menaces.map(m => m.texte)].filter(x => x && x.length > 12);
  for (const u of ["u1", "u2"]) {
    const vu = toutCeQueVoitUnJoueur(u);
    for (const cle of CLES_SECRETES) assert.ok(!vu.includes(cle), `${u} voit « ${cle} »`);
    for (const s of secrets) assert.ok(!vu.includes(s), `${u} voit un fait secret : ${s}`);
  }
  // Le coffre est bien là, scellé ; le clair est vide ; l'état public ne porte que le public.
  const coffre = valeur("lakour-survie.coffre");
  assert.ok(coffre.donnees && coffre.iv && coffre.id && Number(coffre.rev) > 5, "monde scellé, révision croissante");
  assert.deepEqual(valeur("lakour-survie.mondeClair"), {});
  const etat = JSON.stringify(M.api.etat());
  for (const cle of CLES_SECRETES) assert.ok(!etat.includes(cle), `état public : ${cle}`);
  // Les crochets publics ne portent que des faits publics.
  for (const h of journalHooks.filter(x => x.nom === "lakourSurvie.avance")) assert.ok(h.args[1].every(f => f.public === true && !("horde" in f)));
  // Aucun avertissement « en clair » quand le moteur est là.
  assert.ok(!notifications.some(n => /peuvent lire/.test(n.texte)));
});

test("scellement : réécrit après chaque changement, révision croissante ; le coffre se rouvre ailleurs avec la clé du moteur", async () => {
  const M = await monde(M0);
  const a = await survivantTire(M);
  await M.api.demarrer({ region: "saint-denis", membres: [a.id], graine: GRAINE, essai: true });
  const rev1 = valeur("lakour-survie.coffre").rev;
  await M.api.avancer({ quarts: 1 });
  const rev2 = valeur("lakour-survie.coffre").rev;
  assert.ok(rev2 > rev1, "une écriture = un scellement");
  const reel = M.api.monde();

  // 1. Rechargement de la page du MJ : la mémoire est perdue, la copie de son navigateur la rend (sans demander la clé).
  M.Coffre._reinitialiser();
  assert.equal(M.api.mondeOuvert(), false);
  await assert.rejects(() => M.api.avancer({ quarts: 1 }), /MondeFerme/);
  await calme();
  assert.equal(await M.Coffre.ouvrirMonde(), true);
  assert.deepEqual(M.api.monde(), reel);

  // 2. Un autre navigateur du MJ : ni mémoire, ni copie, mais la clé du moteur (son navigateur la garde) : le coffre s'ouvre.
  M.Coffre._reinitialiser();
  reglages.get("lakour-survie.monde").valeur = {};
  CoffreMoteur.oublierCoffre();
  assert.equal(await M.Coffre.ouvrirMonde(), true);
  assert.deepEqual(M.api.monde(), reel);
  await M.api.avancer({ quarts: 1 });

  // 3. Sans la clé : rien ne s'ouvre, rien ne s'écrit ; la clé revient (parts, autre MJ, clé de secours) : le monde s'ouvre.
  const cle = structuredClone(reglages.get("lakour-mj-ia.cleCarnet").valeur);
  const quart = M.api.etat().horloge.quart;
  M.Coffre._reinitialiser();
  reglages.get("lakour-survie.monde").valeur = {};
  reglages.get("lakour-mj-ia.cleCarnet").valeur = {};
  CoffreMoteur.oublierCoffre();
  assert.equal(await M.Coffre.ouvrirMonde(), false);
  assert.equal(M.api.ecritureBloquee(), true);
  await assert.rejects(() => M.api.avancer({ quarts: 1 }), /MondeFerme/);
  await assert.rejects(() => M.api.fouiller({}), /MondeFerme/);
  assert.equal(M.api.etat().horloge.quart, quart, "rien n'a été écrit");
  assert.equal(M.api.monde(), null);
  reglages.get("lakour-mj-ia.cleCarnet").valeur = cle;
  CoffreMoteur.oublierCoffre();
  // On attend l'événement (le monde rouvert : déchiffrement par WebCrypto, durée variable sous charge), pas un délai fixe ; la
  // minuterie ne sert qu'à échouer clairement au lieu de pendre si le monde ne se rouvre jamais.
  const rouvert = new Promise(r => Hooks.once("lakourSurvie.mondeOuvert", r));
  Hooks.callAll("lakour-mj-ia.coffreRouvert");
  let garde;
  await Promise.race([rouvert, new Promise((_, ko) => { garde = setTimeout(() => ko(new Error("le monde ne s'est pas rouvert")), 10000); })])
    .finally(() => clearTimeout(garde));
  await calme();
  assert.equal(M.api.mondeOuvert(), true);
  assert.equal(M.api.monde().jour, reel.jour);
});

test("un navigateur périmé (un autre MJ a scellé depuis) n'écrase rien : il rouvre le coffre", async () => {
  const M = await monde(M0);
  const a = await survivantTire(M);
  await M.api.demarrer({ region: "saint-denis", membres: [a.id] });
  await M.api.avancer({ quarts: 2 });
  // Le coffre porte une révision plus récente que la mémoire de ce navigateur (écrite ailleurs).
  const c = valeur("lakour-survie.coffre");
  reglages.get("lakour-survie.coffre").valeur = { ...c, rev: c.rev + 5 };
  assert.equal(M.api.mondeOuvert(), false, "plus récent ailleurs : pas à jour ici");
  await assert.rejects(() => M.api.avancer({ quarts: 1 }), /MondeFerme/);
  await calme();
});

test("sans le moteur : le monde en clair dans les réglages, un avertissement permanent au MJ", async () => {
  const M = await monde(M0, { moteur: false });
  const a = await survivantTire(M);
  await M.api.demarrer({ region: "saint-denis", membres: [a.id], graine: GRAINE, essai: true });
  await M.api.avancer({ quarts: 4 });
  const clair = valeur("lakour-survie.mondeClair");
  assert.equal(clair.monde.graine, GRAINE, "le monde est en clair");
  assert.ok(notifications.some(n => n.niveau === "warn" && /peuvent lire l'état du monde/.test(n.texte)), "le MJ est prévenu");
  assert.deepEqual(valeur("lakour-survie.coffre"), {});
  // Rechargement : il se rouvre depuis le clair.
  M.Coffre._reinitialiser();
  reglages.get("lakour-survie.monde").valeur = {};
  assert.equal(await M.Coffre.ouvrirMonde(), true);
});

test("garde : un joueur ne lit jamais monde() et ne peut rien écrire ; ses requêtes ne disent rien du réel", async () => {
  const M = await monde(M0);
  const a = await survivantTire(M, { userId: "u1" });
  await M.api.demarrer({ region: "saint-paul", membres: [a.id], graine: GRAINE, essai: true });
  await commeJoueur("u1", async () => {
    assert.equal(M.api.monde(), null);
    await assert.rejects(() => game.settings.set("lakour-survie", "partie", {}), /un joueur ne peut pas/);
  });
  const t = commeJoueur("u1", () => M.api.test({ acteurId: a.id, competence: "survie" }));
  await calme();
  await t;
  const reponses = emissions.filter(e => e.message.type === "reponse").map(e => JSON.stringify(e.message));
  assert.ok(reponses.length);
  for (const r of reponses) for (const cle of CLES_SECRETES) assert.ok(!r.includes(cle));
});
