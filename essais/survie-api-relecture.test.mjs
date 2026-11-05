// Relecture de la couche Foundry (2026-11-04) : les bogues trouvés, chacun avec son essai (rouge avant la correction).
// - rien n'est écrit si une action refuse en route : déménager (voyage impossible), s'installer (site occupé), soigner (soigneur hors
//   d'état : le médicament n'est pas consommé) ;
// - le coffre : une copie du navigateur en avance sur l'enveloppe (écriture non scellée avant un rechargement) est scellée à la
//   réouverture ;
// - les demandes d'un joueur : bonus et malus d'un test bornés comme dans la fenêtre ; un tirage de création forgé (budget,
//   équipement, savoir-faire, traits) est refusé.
// Lancer : npm run essais
import { test } from "node:test";
import assert from "node:assert/strict";
import { installerFoundry, calme, commeJoueur, valeur, reglages, erreurs, DONNEES } from "./doublures/foundry-survie.mjs";
import { charger, monde, survivantTire } from "./doublures/survie-api-outils.mjs";
import { creerHasard } from "../systems/lakour-survie/logique/hasard.mjs";

installerFoundry();
const M0 = await charger();

async function partieInstallee(M, { site = "college-hauts-saint-paul", stocks = { nourriture: 30, eau: 30, materiaux: 10, medicaments: 3 } } = {}) {
  const a = await survivantTire(M, { userId: "u1" });
  const b = await survivantTire(M, { userId: "u2" });
  await M.api.demarrer({ region: "saint-paul", membres: [a.id, b.id], graine: "relecture", essai: true });
  await M.api.installer({ site });
  await M.api.ajuster({ stocks });
  return { a, b, abri: game.actors.get(M.api.etat().groupe.abri) };
}

test("déménager : un voyage impossible (pas de carburant pour le véhicule) ne quitte pas l'abri, rien n'est écrit", async () => {
  const M = await monde(M0);
  const { abri } = await partieInstallee(M);
  const quart = M.api.etat().horloge.quart;
  const stocks = structuredClone(abri.system.stocks);
  await assert.rejects(() => M.api.demenager({ site: "centrale-du-port-est", transport: "vehicule", emporter: { nourriture: 5 } }), /carburant/);
  assert.equal(abri.system.abandonneLe, null, "l'abri n'est pas marqué abandonné");
  assert.deepEqual(abri.system.stocks, stocks, "les stocks de l'abri sont intacts");
  assert.equal(M.api.etat().groupe.abri, abri.id, "l'abri courant est inchangé");
  assert.equal(M.api.etat().horloge.quart, quart, "le temps n'a pas bougé");
  assert.equal(M.api.etat().chroniques.at(-1).fin, null, "le chapitre reste ouvert");
  assert.equal((M.api.etat().groupe.porte ?? {}).nourriture ?? 0, 0, "rien n'a été emporté");
  // Le même déménagement à pied passe (c'est bien le carburant qui manquait).
  const r = await M.api.demenager({ site: "centrale-du-port-est", transport: "pied", emporter: { nourriture: 5 } });
  assert.equal(r.arrivee, true);
  assert.equal(M.api.etat().groupe.region, "le-port");
  assert.deepEqual(erreurs(), []);
});

test("s'installer sur un site occupé par une faction refuse AVANT de quitter l'abri courant", async () => {
  const M = await monde(M0);
  const { abri } = await partieInstallee(M);
  // Le monde réel : la case de Bellemène (même région) est tenue par une faction.
  const reel = M.Coffre.mondeEnMemoire();
  reel.regions["saint-paul"].abrisAbandonnes = [...(reel.regions["saint-paul"].abrisAbandonnes ?? []), { site: "case-de-bellemene", depuis: 0, installations: [], occupe: "ferrailleurs", stocks: {} }];
  await assert.rejects(() => M.api.installer({ site: "case-de-bellemene" }), /occupé/);
  assert.equal(abri.system.abandonneLe, null, "l'abri courant n'est pas marqué abandonné");
  assert.equal(M.api.etat().groupe.abri, abri.id);
  // Déménager vers ce site refuse aussi, sans rien écrire.
  await assert.rejects(() => M.api.demenager({ site: "case-de-bellemene" }), /occupé/);
  assert.equal(abri.system.abandonneLe, null);
  assert.equal(M.api.etat().groupe.abri, abri.id);
});

test("soigner : un soigneur hors d'état refuse avant de consommer le médicament", async () => {
  const M = await monde(M0);
  const { a, b, abri } = await partieInstallee(M);
  await M.api.blesser({ acteurId: b.id, n: 2 });
  await a.update({ system: { vivant: false } });
  const avant = abri.system.stocks.medicaments;
  await assert.rejects(() => M.api.soigner({ acteurId: b.id, soigneurId: a.id }), /en état d'agir/);
  assert.equal(abri.system.stocks.medicaments, avant, "le médicament n'a pas été consommé");
  // Avec un soigneur valide, le soin consomme bien un médicament.
  await a.update({ system: { vivant: true } });
  await M.api.soigner({ acteurId: b.id, soigneurId: a.id });
  assert.equal(abri.system.stocks.medicaments, avant - 1);
});

test("coffre : une écriture non scellée (API du moteur pas encore publiée) puis un rechargement : la copie du navigateur est scellée à la réouverture", async () => {
  const M = await monde(M0);
  const { abri } = await partieInstallee(M);
  const revScelle = valeur("lakour-survie.coffre").rev;
  // Le moteur est actif mais son API n'est pas (encore) là : l'écriture passe, en mémoire et dans le navigateur, sans scellement.
  const moteur = game.modules.get("lakour-mj-ia");
  const apiCoffre = moteur.api.coffre;
  moteur.api = {};
  const nourriture = abri.system.stocks.nourriture;
  await M.api.ajuster({ stocks: { nourriture: 7 } });
  assert.equal(valeur("lakour-survie.coffre").rev, revScelle, "pas scellé sans l'API");
  const client = valeur("lakour-survie.monde")[game.world.id][game.user.id];
  assert.ok(client.rev > revScelle, "la copie du navigateur est en avance");
  // Rechargement du navigateur du MJ : la mémoire est vide, le moteur publie son API, le système rouvre le monde.
  moteur.api = { coffre: apiCoffre };
  M.Coffre._reinitialiser();
  assert.equal(await M.Coffre.apresMoteurPret(), true);
  assert.equal(M.api.mondeOuvert(), true);
  assert.equal(valeur("lakour-survie.coffre").rev, client.rev, "l'enveloppe scellée a rattrapé la copie du navigateur");
  assert.equal(abri.system.stocks.nourriture, nourriture + 7);
  assert.deepEqual(valeur("lakour-survie.mondeClair"), {}, "jamais en clair avec le moteur");
});

test("demande d'un joueur : bonus et malus d'un test bornés (0 à 4), un tirage forgé refusé", async () => {
  const M = await monde(M0, { joueurs: 3 });
  const { a } = await partieInstallee(M);
  // Un bonus de 50 dés demandé par le joueur : réserve bornée comme dans la fenêtre du test (4 au plus, et 2 d'outil au plus).
  const niveau = a.system.competences.tir.niveau;
  const r = commeJoueur("u1", () => M.api.test({ acteurId: a.id, competence: "tir", bonus: 50 }));
  await calme();
  const res = await r;
  assert.ok(res.des.length <= niveau + 1 + 4 + 2, `réserve bornée (${res.des.length} dés pour un niveau ${niveau})`);
  // Un tirage forgé (compétences à 5 partout, un 4×4 en poche, un savoir-faire étranger au passé) : refusé au joueur sans survivant.
  // Tirage à graine fixe, et l'objet ou le savoir-faire ajouté est choisi HORS de ce que permettent l'enfance et le passé tirés :
  // un 4×4 est légitime pour un apiculteur, la radio pour un gendarme (environ une fois sur cinq au hasard, l'essai échouait).
  const tirage = M.api.generer({ statut: "joueur", hasard: creerHasard("relecture-tirage-forge") });
  const permis = champ => new Set([DONNEES.enfances, DONNEES.passes].flatMap((l, i) => l.find(x => x.cle === [tirage.enfance, tirage.passe][i])?.[champ] ?? []));
  const etranger = (champ, liste, prefere) => [prefere, ...liste.map(x => x.cle)].find(k => !permis(champ).has(k));
  const objetEtranger = etranger("equipement", DONNEES.equipements, "quatre-quatre");
  const savoirEtranger = etranger("savoirs", DONNEES.savoirs, "radio");
  assert.ok(objetEtranger && savoirEtranger, "un objet et un savoir-faire étrangers à l'enfance et au passé tirés");
  const demande = async donnees => { const p = commeJoueur("u3", () => M.api.creerSurvivant({ donnees, rejoindre: false })); p.catch(() => null); await calme(); return p; };
  await assert.rejects(demande({ ...tirage, competences: Object.fromEntries(Object.keys(tirage.competences).map(k => [k, 5])) }), /TirageInvalide/);
  await assert.rejects(demande({ ...tirage, equipement: [...tirage.equipement, objetEtranger] }), /TirageInvalide/);
  await assert.rejects(demande({ ...tirage, savoirs: [...tirage.savoirs, savoirEtranger] }), /TirageInvalide/);
  await assert.rejects(demande({ ...tirage, traits: ["un-trait-inconnu"] }), /TirageInvalide/);
  // Le tirage honnête passe ; le MJ, lui, crée ce qu'il veut.
  assert.ok((await demande(tirage)).acteurId);
  const forge = { ...tirage, competences: Object.fromEntries(Object.keys(tirage.competences).map(k => [k, 5])) };
  const mj = await M.api.creerSurvivant({ donnees: forge, rejoindre: false, statut: "pnj" });
  assert.ok(mj.acteurId);
  assert.deepEqual(erreurs(), []);
});
