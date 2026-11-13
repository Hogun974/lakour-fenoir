// L'API du lot « fetes » (2026-11-13) sur la doublure de Foundry, avec le VRAI contenu de lakour-fenoir : la lune et la date lue dans
// quand(), les tests dehors la nuit, fêter avec son gain et son coût (choix, vœux, cadeau, abri qui reçoit), aller à la fête des
// autres, un vœu tenu ou rompu, le sang-froid contre une horde, la relève (un membre, un PNJ léger) et l'autel des morts.
// Lancer : npm run essais
import { test } from "node:test";
import assert from "node:assert/strict";
import { installerFoundry, messages, journalHooks, calme } from "./doublures/foundry-survie.mjs";
import { charger, monde, survivantTire } from "./doublures/survie-api-outils.mjs";

installerFoundry();
const M0 = await charger();
const nouveauMonde = (options = {}) => monde(M0, options);

// Une partie au 20 décembre 2026 à Saint-Paul, installée à la case de l'Hermitage, avec un joueur, une compagne et une recrue.
async function partie({ dateDepart = "2026-12-20", pnj = [] } = {}) {
  const M = await nouveauMonde();
  const a = await survivantTire(M, { userId: "u1", verrous: { age: 30 } });
  const c = await survivantTire(M, { statut: "compagnon", verrous: { age: 40 } });
  const r = await survivantTire(M, { statut: "recrue", verrous: { age: 17 } });
  await M.api.demarrer({ region: "saint-paul", membres: [a.id, c.id, r.id], graine: "GRAINE-FETES-0001", essai: true, dateDepart, pnj });
  const site = M.api.contenu().sites.find(s => s.region === "saint-paul");
  await M.api.installer({ site: site.cle });
  await M.api.ajuster({ stocks: { nourriture: 60, materiaux: 20 } });
  return { M, a, c, r, abri: game.actors.get(M.api.etat().groupe.abri) };
}

test("quand() : la lune, la clarté de la nuit, les signes du paysage ; la date lue quand téléphone et radio sont morts", async () => {
  const { M } = await partie();
  const q = M.api.quand();
  assert.ok(M.api.logique.PHASES_LUNE.includes(q.lune.phase));
  assert.equal(q.clarte, null, "le matin : pas de clarté");
  assert.ok(q.signes.includes("flamboyants") && q.signes.includes("letchis"));
  assert.equal(q.dateExacte, true, "le téléphone marche encore");
  await M.api.avancer({ quarts: 3 });
  assert.ok([0, 1, 2, 3].includes(M.api.quand().clarte), "la nuit a sa clarté");
  assert.equal(M.api.etat().ciel.region, "saint-paul");
  // Des semaines plus tard, le réseau est tombé : la date se lit dans la nature.
  await M.api.avancer({ quarts: 4 * 40 });
  const tard = M.api.quand();
  assert.equal(M.api.etat().calendrier.exacte, false);
  assert.equal(tard.dateExacte, false);
  assert.match(tard.dateLue, /janvier|février/);
});

test("tests dehors, la nuit : la clarté donne ou ôte un dé ; à l'abri ou le jour, rien", async () => {
  const { M, a } = await partie();
  await M.api.avancer({ quarts: 3 });   // la nuit
  const mods = (competence, dehors) => M.interne.modificateursDuTest(a, M.module.systemeLogique(a), competence, M.api.etat(), { dehors });
  const clarte = M.module.clarteReelle(M.api.monde(), M.api.etat().horloge.quart, "saint-paul");
  const attendu = M.api.logique.desDeNuit("vigilance", clarte);
  assert.equal(mods("vigilance", true).nuit, attendu);
  assert.equal(mods("vigilance", false).nuit, 0, "à l'abri");
  assert.equal(mods("vigilance", null).nuit, 0, "le groupe est à son abri");
  const t = await M.api.test({ acteurId: a.id, competence: "vigilance", dehors: true });
  assert.equal(t.nuit, attendu);
});

test("fêter : Noël coûte deux rations chacun et attache la recrue ; la musique en silence ; un abri voisin inconnu est refusé", async () => {
  const { M, a, r, abri } = await partie();
  const avant = abri.system.stocks.nourriture;
  const f = await M.api.feter({ fete: "noel" });
  assert.equal(f.ok, true);
  assert.equal(abri.system.stocks.nourriture, avant - 6, "trois personnes, deux rations chacune");
  assert.deepEqual(f.attaches, [r.id]);
  assert.equal(r.system.statut, "compagnon");
  assert.equal(M.api.etat().groupe.statuts[r.id], "compagnon");
  assert.ok(M.api.etat().souvenirs.some(s => s.source === "noel" && s.moral === 1), "une semaine où le moral remonte plus haut");
  assert.ok(messages.some(m => /qu.{0,6}elle co[uû]te/.test(m.content)), "la carte dit le gain et le coût");
  const m = await M.api.feter({ fete: "musique", option: "silence" });
  assert.equal(m.option, "silence");
  assert.equal(m.bruit, 0);
  await assert.rejects(() => M.api.feter({ fete: "dipavali", avec: "personne" }), /Faction inconnue/);
  // Cavadee : le vœu de ceux qui le font, puis tenu.
  const cav = await M.api.feter({ fete: "cavadee", pour: [a.name] });
  assert.deepEqual(cav.voeux, [a.id]);
  const moral = a.system.moral;
  await M.api.voeu({ acteurId: a.id, issue: "tenu" });
  assert.equal(a.system.moral, Math.min(5, moral + 1));
  await assert.rejects(() => M.api.voeu({ acteurId: a.id, issue: "rompu" }), /pas de vœu/);
});

test("fêter : le Nouvel An chinois prend deux quarts et tisse un lien avec l'abri qui reçoit les dons", async () => {
  const { M } = await partie();
  const faction = M.api.contenu().factions[0].cle;
  const q0 = M.api.etat().horloge.quart;
  const r = await M.api.feter({ fete: "nouvel-an-chinois", avec: faction });
  assert.equal(r.quarts, 2);
  assert.equal(M.api.etat().horloge.quart, q0 + 2);
  assert.equal(M.api.etat().liens.factions[faction], 1);
});

test("aller à la fête des autres : deux quarts, +1 de moral, un lien ; le crochet de la participation ; une fois par hôte", async () => {
  const { M, a } = await partie();
  const faction = M.api.contenu().factions[0].cle;
  a.system.moral = 3;
  const q0 = M.api.etat().horloge.quart;
  const r = await M.api.participer({ fete: "dipavali", communaute: "malbars", faction, membres: [a.id] });
  assert.equal(r.ok, true);
  assert.equal(a.system.moral >= 3, true);
  assert.equal(M.api.etat().horloge.quart, q0 + 2);
  assert.equal(M.api.etat().liens.communautes.malbars, 1);
  assert.equal(M.api.etat().liens.factions[faction], 1);
  assert.ok(journalHooks.some(h => h.nom === "lakourSurvie.participation" && h.args[0].communaute === "malbars"));
  await assert.rejects(() => M.api.participer({ fete: "dipavali", communaute: "malbars", faction, membres: [a.id] }), /déjà allé/);
  await assert.rejects(() => M.api.participer({ fete: "dipavali", communaute: "martiens", membres: [a.id] }), /Communauté inconnue/);
  // La communauté de la fête par défaut (les Malbars pour la marche sur le feu).
  const feu = await M.api.participer({ fete: "marche-sur-le-feu", membres: [a.id] });
  assert.equal(feu.communaute, "malbars");
});

test("assaut d'une horde : la marche sur le feu donne un dé de défense de plus pendant deux semaines", async () => {
  const { M } = await partie();
  const sans = await M.api.assaut({ force: 3, horde: true });
  assert.equal(sans.sangFroid, 0);
  await M.api.feter({ fete: "marche-sur-le-feu" });
  const avec = await M.api.assaut({ force: 3, horde: true });
  assert.equal(avec.sangFroid, 1);
  assert.equal(avec.desDefense.length, sans.desDefense.length + 1);
  const bande = await M.api.assaut({ force: 3 });
  assert.equal(bande.sangFroid, 0, "contre une bande, rien");
});

test("relève : le joueur reprend la compagne (elle lâche sa tâche) ; refusée à un vivant ; un compagnon IA cesse d'en être un", async () => {
  const { M, a, c } = await partie();
  await M.api.assigner({ acteurId: c.id, tache: "cultures" });
  await c.update({ "flags.lakour-mj-ia.compagnon": { actif: true } });
  await assert.rejects(() => M.api.releve({ mortId: a.id, candidat: c.id }), /vivant/);
  await a.update({ system: { vivant: false } });
  const candidats = M.api.candidatsReleve({ mortId: a.id });
  assert.ok(candidats.some(x => x.id === c.id));
  assert.ok(!candidats.some(x => x.id === a.id));
  const r = await M.api.releve({ mortId: a.id, candidat: c.id });
  assert.equal(r.ok, true);
  assert.equal(r.tacheLaissee, "cultures");
  assert.equal(c.system.statut, "joueur");
  assert.equal(c.system.tache, "repos");
  assert.equal(c.ownership.u1, 3, "le joueur du mort en devient propriétaire");
  assert.equal(game.users.get("u1").character?.id, c.id);
  assert.ok(!c.flags["lakour-mj-ia"]?.compagnon, "plus un compagnon IA");
  assert.equal(M.api.etat().groupe.statuts[c.id], "joueur");
  assert.ok(M.api.etat().journal.some(e => e.cle === "Journal.ReleveTache"));
});

test("relève : un PNJ léger reçoit sa fiche (son nom, son passé) ; le nouveau tirage prévient le joueur ; un jeune est signalé", async () => {
  const { M, a, r } = await partie({ pnj: [{ id: "pnj1", nom: "Mémé Lucette", passe: "", travail: true }] });
  await a.update({ system: { vivant: false } });
  const candidats = M.api.candidatsReleve({ mortId: a.id });
  assert.ok(candidats.some(x => x.source === "pnj" && x.nom === "Mémé Lucette"));
  const jeune = candidats.find(x => x.id === r.id);
  assert.equal(jeune.jeune, true, "la recrue a 17 ans");
  const p = await M.api.releve({ mortId: a.id, candidat: "pnj1" });
  const fiche = game.actors.get(p.acteurId);
  assert.equal(fiche.name, "Mémé Lucette");
  assert.ok(fiche.system.age >= 16);
  assert.ok(M.api.etat().groupe.membres.includes(fiche.id));
  assert.ok(!(M.api.etat().groupe.pnj ?? []).some(x => x.id === "pnj1"), "elle ne travaille plus comme PNJ du groupe");
  const t = await M.api.releve({ mortId: a.id, action: "tirage" });
  assert.equal(t.joueur, "u1");
  await calme();
});

test("l'autel des morts : il faut l'autel ; l'honorer une fois par semaine ; le repos lève le deuil", async () => {
  const { M, a, c, abri } = await partie();
  // Ana meurt pendant le temps qui passe : elle s'inscrit d'elle-même sur l'autel.
  await a.update({ system: { blessures: 4 } });
  await M.api.avancer({ quarts: 1 });
  assert.equal(a.system.vivant, false);
  assert.deepEqual(M.api.morts().map(m => m.id), [a.id]);
  await assert.rejects(() => M.api.autel({ action: "honorer" }), /autel des morts/);
  await M.api.construire({ installation: "autel-des-morts", quarts: 1 });
  const nourriture = abri.system.stocks.nourriture;
  const moral = c.system.moral;
  const h = await M.api.autel({ action: "honorer" });
  assert.equal(h.ok, true);
  assert.ok(abri.system.stocks.nourriture <= nourriture - 1, "une assiette offerte");
  assert.ok(c.system.moral >= Math.min(5, moral), "le groupe se tient");
  await assert.rejects(() => M.api.autel({ action: "honorer" }), /moins d'une semaine/);
  assert.equal(M.api.logique.deuil(M.api.etat()), true);
  const rep = await M.api.autel({ action: "repos", mort: a.id });
  assert.equal(rep.deuil, false);
  await M.api.autel({ action: "inscrire", nom: "Gaby", retrouve: false });
  await assert.rejects(() => M.api.autel({ action: "repos", mort: "Gaby" }), /retrouver/);
  await M.api.autel({ action: "retrouver", mort: "Gaby" });
  assert.equal((await M.api.autel({ action: "repos", mort: "Gaby" })).ok, true);
});
