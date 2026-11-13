// Les jointures entre les quatre lots du 2026-11-13 (fusion des lots « fetes », « marche », « savoirs », « moral »), sur la doublure
// de Foundry avec le VRAI contenu de lakour-fenoir :
// - le Ladi Lafé et le marché poussent vers le rouge (contrat §14, acte moral) : colporter du mal, un mensonge démenti, un objet
//   qu'on disait sien démenti par une marque, rompre la trêve (« attaquer »), troquer en jouant d'un préjugé (« colporter ») ;
// - la fête des autres (§11, participer) use les préjugés des PNJ qui y voient le groupe (§12, une fête partagée) ;
// - les jeunes de 16 à 18 ans (§11, peutEtreChef, poidsVote) : pas chef, une demi-voix, pas successeur d'un chef renversé ;
// - les gramounes (§13) et les gens du marché (§12) ont un esprit (§14) écrit d'après leur histoire ; les gramounes, leurs préjugés ;
// - les fêtes du ramadan, de l'Aïd, du Nouvel An tamoul et de la marche sur le feu (§11) sont celles de leur religion (§14).
// Lancer : npm run essais
import { test } from "node:test";
import assert from "node:assert/strict";
import { installerFoundry } from "./doublures/foundry-survie.mjs";
import { charger, monde, survivantTire } from "./doublures/survie-api-outils.mjs";
import * as L from "../systems/lakour-survie/logique/index.mjs";

installerFoundry();
const M0 = await charger();

// Un groupe de deux adultes installé à Saint-Pierre, avec des vivres.
async function partie() {
  const M = await monde(M0);
  const a = await survivantTire(M, { userId: "u1" });
  const b = await survivantTire(M, { statut: "compagnon" });
  for (const x of [a, b]) await x.update({ system: { age: 30, sensMoral: 0, reputation: 0 } });
  await M.api.demarrer({ region: "saint-pierre", membres: [a.id, b.id], graine: "essai-des-jointures", essai: true });
  const ins = await M.api.installer({ site: M.api.contenu().sites.find(s => s.region === "saint-pierre").cle });
  await M.api.ajuster({ stocks: { nourriture: 30, munitions: 10, eau: 10 }, raison: "réserve" });
  return { M, a, b, abri: game.actors.get(ins.abriId) };
}
const sens = a => Number(game.actors.get(a.id).system.sensMoral) || 0;

test("Ladi Lafé : celui qui colporte du mal rougit (acte « colporter ») ; un PNJ inconnu ne porte rien", async () => {
  const { M, a, b } = await partie();
  const r = await M.api.rumeur({ sujet: "Le cousin", texte: "Il a volé une nasse.", vraie: false, malveillant: true, auteur: a.id });
  assert.equal(r.colporteur, a.id);
  assert.equal(sens(a), L.ACTES_MORAUX.colporter, "le colporteur porte l'acte");
  assert.equal(sens(b), 0, "l'autre membre n'a rien dit");
  // Par son nom aussi ; et un auteur qui n'est pas un survivant (un marchand jaloux) ne déplace aucune jauge.
  await M.api.rumeur({ sujet: "Le cousin", texte: "Et il triche aux dominos.", auteur: b.name });
  assert.equal(sens(b), L.ACTES_MORAUX.colporter);
  const x = await M.api.rumeur({ texte: "Ils vendent des vivres gâtés.", vraie: false, malveillant: true, auteur: "Un marchand jaloux" });
  assert.equal(x.sens, null);
  // Le mensonge démenti : son auteur, s'il est du groupe, porte « mentir ».
  const avant = sens(a);
  const d = await M.api.dementir({ id: r.id, preuve: "temoin" });
  assert.equal(d.menteur, a.id);
  assert.equal(sens(a), avant + L.ACTES_MORAUX.mentir);
});

test("marché : rompre la trêve (« attaquer ») et troquer en jouant d'un préjugé (« colporter ») poussent vers le rouge", async () => {
  const { M, a, b } = await partie();
  await M.api.ouvrirMarche({ modele: "marche-du-quai-de-saint-pierre" });
  const t = await M.api.troquer({ donne: { nourriture: 3 }, recoit: { eau: 2 }, accepter: true, prejuge: a.id });
  assert.equal(t.ok, true);
  assert.equal(sens(a), L.ACTES_MORAUX.colporter, "qui joue d'un préjugé porte « colporter »");
  assert.equal(sens(b), 0);
  const sansPrejuge = await M.api.troquer({ donne: { nourriture: 2 }, recoit: { eau: 1 }, accepter: true });
  assert.equal(sansPrejuge.sens, null, "un troc ordinaire ne touche à aucune jauge");
  const r = await M.api.rompreTreve({ marche: "marche-du-quai-de-saint-pierre", par: "groupe" });
  assert.ok(r.sens?.porteurs?.length === 2, "le groupe entier porte la trêve rompue");
  assert.equal(sens(b), L.ACTES_MORAUX.attaquer);
  assert.equal(sens(a), L.ACTES_MORAUX.colporter + L.ACTES_MORAUX.attaquer);
  // Une trêve rompue par une faction ne rougit personne du groupe.
  await M.api.retablirTreve({ marche: "marche-du-quai-de-saint-pierre" });
  const f = await M.api.rompreTreve({ marche: "marche-du-quai-de-saint-pierre", par: "pillards" });
  assert.equal(f.sens, null);
});

test("objet réclamé : la marque d'un autre dément le groupe, et celui qui le disait sien porte « mentir »", async () => {
  const { M, a } = await partie();
  await M.api.signe({ signe: "un letchi gravé" });
  const [o] = await a.createEmbeddedDocuments("Item", [{ name: "Fusil-harpon", type: "equipement", system: { cle: "fusil-harpon", marque: "trois encoches" } }]);
  const v = await M.api.reclamer({ acteurId: a.id, objetId: o.id, reclamant: "Le voisin", signeReclamant: "trois encoches" });
  assert.equal(v.menteur, "possesseur");
  assert.equal(sens(a), L.ACTES_MORAUX.mentir);
});

test("fête des autres : les PNJ qui y voient le groupe perdent un cran de leurs préjugés (une fête partagée)", async () => {
  const { M, a } = await partie();
  const p = await Actor.implementation.create({ name: "Monsieur Payet", type: "survivant",
    system: { statut: "pnj", prejuges: [{ cible: "malbars", poids: 2, dit: "« Les Malbars font des services. »" }] } });
  const faction = L.liste(M.api.contenu().factions)[0].cle;
  const r = await M.api.participer({ fete: "dipavali", communaute: "malbars", faction, membres: [a.id], pnj: [p.id] });
  assert.equal(r.ok, true);
  assert.equal(r.prejuges.length, 1);
  assert.equal(L.poidsPrejuge(p.system.prejuges[0]), 1, "un cran de moins");
  assert.ok(M.api.etat().participations?.length, "la participation reste notée (lot « fetes »)");
});

test("jeunes de 16 à 18 ans : pas chef, une demi-voix au vote ; un chef renversé n'a pas un jeune pour successeur", async () => {
  const { M, a, b } = await partie();
  await b.update({ system: { age: 17, ageJour: 0 } });
  await assert.rejects(() => M.api.chef({ acteurId: b.id }), /ne mène pas le groupe/);
  await M.api.chef({ acteurId: a.id });
  const vote = await M.api.voter({ question: "On ouvre ?", acte: "accueillir", voix: { [a.id]: "contre", [b.id]: "pour" } });
  assert.deepEqual([vote.resultat.pour, vote.resultat.contre, vote.resultat.majorite], [0.5, 1, "contre"], "la voix du jeune compte à moitié");
  // Logique : sans poids, chaque voix compte 1 (comme avant).
  assert.deepEqual([L.resoudreVote({ x: "pour", y: "contre", z: "pour" }).pour, L.resoudreVote({ x: "pour" }).total], [2, 1]);
  // Le successeur d'un chef sans autorité : jamais un jeune, même plus écouté qu'un adulte.
  const membres = [
    { id: "chef", system: { age: 40, autorite: 0 } },
    { id: "jeune", system: { age: 17, ageJour: 0, autorite: 5 } },
    { id: "adulte", system: { age: 30, autorite: 2 } }
  ];
  const c = L.crisesAutorite({ membres, chefId: "chef", jour: 0, hasard: () => 0.99 });
  assert.equal(c.successeur, "adulte");
  assert.equal(L.crisesAutorite({ membres: membres.slice(0, 2), chefId: "chef", jour: 0, hasard: () => 0.99 }).successeur, "", "pas de successeur adulte");
});

test("contenu : l'esprit des gramounes et des gens du marché, les préjugés des gramounes, les fêtes de chaque religion", async () => {
  const c = M0.contenu ?? (await monde(M0)).api.contenu();
  const idx = L.indexer(c);
  const communautes = new Set(L.liste(c.communautes).map(x => x.cle));
  const espritValide = (qui, e) => {
    assert.ok(L.REGARDS.includes(e.regard), `${qui} : regard`);
    assert.ok(idx.religions.has(e.religion), `${qui} : religion ${e.religion}`);
    if (e.religion === L.RELIGION_AUCUNE) assert.ok(idx.ancrages.has(e.ancrage), `${qui} : sans religion, un ancrage`);
    if (e.religion === L.RELIGION_PLUSIEURS) assert.ok(e.religions.length >= 2 && e.religions.every(r => idx.religions.has(r)), `${qui} : plusieurs`);
    assert.ok(e.sensMoral >= L.SENS_MORAL.min && e.sensMoral <= L.SENS_MORAL.max && e.autorite >= L.AUTORITE.min && e.autorite <= L.AUTORITE.max, qui);
  };
  for (const g of L.liste(c.gramounes)) {
    espritValide(g.cle, g.esprit);
    assert.ok(g.prejuges.length >= 1 && g.prejuges.every(p => communautes.has(p.cible) && p.dit), `${g.cle} : ses préjugés, d'après ses notes`);
  }
  for (const m of L.liste(c.marchands)) espritValide(m.cle, m.esprit);
  const fetesDe = cle => idx.religions.get(cle).fetes;
  assert.ok(["ramadan", "aid-el-kebir"].every(f => fetesDe("islam").includes(f)));
  assert.ok(["nouvel-an-tamoul", "marche-sur-le-feu"].every(f => fetesDe("hindouisme-tamoul").includes(f)));
});

test("API : la gramoune recrutée et le marchand créé portent leur esprit ; la gramoune, ses préjugés", async () => {
  const { M, a } = await partie();
  const recrue = await M.api.genererRecrue({ gramoune: "gramoun-said" });
  assert.equal(recrue.religion, "islam");
  assert.equal(recrue.prejuges[0].cible, "yabs");
  let said = null;
  for (let k = 0; k < 30 && !said; k++) {
    const r = await M.api.recruter({ recrue, parleurId: a.id, attitude: "amicale" });
    if (r.reussite) said = game.actors.get(r.acteurId);
  }
  assert.ok(said, "il finit par suivre le groupe");
  assert.deepEqual([said.system.regard, said.system.religion, said.system.pratique, said.system.sensMoral], ["refaire", "islam", true, 4]);
  assert.equal(said.system.prejuges[0].cible, "yabs");
  const m = await M.api.creerMarchand({ cle: "lalao-rasoanaivo" });
  const lalao = game.actors.get(m.acteurId);
  assert.deepEqual([lalao.system.regard, lalao.system.religion, lalao.system.autorite], ["refaire", "evangelique", 4]);
  assert.ok(lalao.system.prejuges.length >= 1, "elle garde ses préjugés");
});
