// Le sens moral et l'autorité (complément du jeu 3D, famille 3 ; logique/moralite.mjs, porte.mjs, chefs.mjs, contrat §11) : la
// jauge et la réputation, les circonstances atténuantes, le vote et qui ne rougit pas, l'enfant témoin, la couleur du groupe et son
// prix, la liste à la porte, le visiteur et la suite du refus, le chef de bande, l'ultimatum et le tribut, l'autorité et ses
// crises, la séparation et la fusion.   Lancer : npm run essais
import { test } from "node:test";
import assert from "node:assert/strict";
import { L, contenuMini } from "./doublures/survie-outils.mjs";
import { chargerContenu } from "./outils/simuler-parties.mjs";

const C = chargerContenu();
const S = (extra = {}) => L.survivantNeuf({ statut: "compagnon", regard: "vivre", religion: "aucune", religions: [], pratique: false, ancrage: "", sensMoral: 0,
  autorite: 2, reputation: 0, esprit: {}, moral: 3, ...extra });

test("le point d'entrée commun : déplacer la jauge et la réputation, bornées à −10..+10 (la rumeur du Ladi Lafé y passe)", () => {
  assert.equal(L.deplacerSensMoral(S({ sensMoral: 9 }), 4).sensMoral, 10);
  assert.equal(L.deplacerSensMoral(S({ sensMoral: -9 }), -4).sensMoral, -10);
  assert.equal(L.deplacerReputation(S(), -2).reputation, -2);
  const c = L.acteMoral(S(), "colporter");
  assert.deepEqual([c.system.sensMoral, c.system.reputation, c.delta], [-1, -1, -1], "colporter du mal rougit celui qui colporte");
  assert.equal(L.acteMoral(S(), "", { delta: 3 }).system.sensMoral, 3, "un déplacement libre");
  assert.deepEqual(Object.keys(L.ACTES_MORAUX).sort(), ["abandonner", "accueillir", "aider", "attaquer", "colporter", "epargner", "exclure", "mentir", "partager", "rendre", "trahir"]);
});

test("circonstances atténuantes : la jauge bouge quand même ; seul le jugement des témoins qui savaient s'adoucit", () => {
  const sans = L.acteMoral(S(), "exclure");
  const avec = L.acteMoral(S(), "exclure", { circonstances: true });
  assert.equal(sans.system.sensMoral, -1);
  assert.equal(avec.system.sensMoral, -1, "exclure pousse vers le rouge même excusé");
  assert.equal(sans.system.reputation, -1);
  assert.equal(avec.system.reputation, 0, "les témoins qui savaient jugent moins sévèrement");
  assert.equal(L.acteMoral(S(), "trahir", { circonstances: true }).system.reputation, -1);
  assert.equal(L.acteMoral(S(), "trahir", { temoins: false }).system.reputation, 0, "sans témoin, la réputation ne bouge pas");
  assert.equal(L.acteMoral(S(), "accueillir").system.sensMoral, 1);
});

test("le vote : qui a voté contre une trahison ne rougit pas ; le chef porte sa décision ; voix des PNJ selon leur jauge", () => {
  const membres = [{ id: "chef", system: S() }, { id: "a", system: S() }, { id: "b", system: S() }, { id: "c", system: S() }];
  const voix = { chef: "contre", a: "pour", b: "contre", c: "abstention" };
  const r = L.acteCollectif(membres, "trahir", { voix, chefId: "chef" });
  const sens = Object.fromEntries(r.membres.map(m => [m.id, m.system.sensMoral]));
  assert.deepEqual(sens, { chef: -3, a: -3, b: 0, c: -3 }, "b a voté contre : il ne rougit pas ; l'abstention laisse faire");
  assert.deepEqual(r.epargnes, ["b"]);
  const v = L.resoudreVote(voix);
  assert.deepEqual([v.pour, v.contre, v.abstention, v.majorite], [1, 2, 1, "contre"]);
  assert.equal(L.resoudreVote({ a: "pour", b: "contre" }).majorite, "egalite");
  assert.equal(L.voixAuto(S({ sensMoral: 4 }), -1), "contre", "un bleu vote contre la trahison");
  assert.equal(L.voixAuto(S({ sensMoral: -4 }), -1), "pour");
  assert.equal(L.voixAuto(S({ sensMoral: -1, regard: "refaire" }), 1), "pour", "qui veut refaire le monde penche vers l'accueil");
  assert.equal(L.voixAuto(S({ sensMoral: 1 }), 1, { circonstances: true }), "contre", "plus de place : les tièdes ferment");
});

test("l'enfant témoin : il imite le bleu ; devant le rouge, selon ses compétences, il imite ou se révolte ; trois révoltes, un projet", () => {
  const coeur = S({ age: 11, competences: { soins: { niveau: 2 }, parole: { niveau: 1 } } });
  const poing = S({ age: 12, competences: { combat: { niveau: 2 }, discretion: { niveau: 2 } } });
  assert.equal(L.reactionEnfant(coeur, 1).reaction, "imite");
  assert.equal(L.reactionEnfant(coeur, 1).system.sensMoral, 1);
  const r = L.reactionEnfant(poing, -1);
  assert.deepEqual([r.reaction, r.system.sensMoral], ["imite", -1], "il se calque sur ce qu'il voit");
  let s = coeur, fin = null;
  for (let i = 0; i < 3; i++) fin = L.reactionEnfant(s, -1), s = fin.system;
  assert.equal(fin.reaction, "revolte");
  assert.equal(s.sensMoral, 3, "révulsé, il bleuit");
  assert.equal(fin.projet, "ailleurs", "un enfant de cœur veut fonder un ailleurs meilleur");
  let p = S({ age: 15, competences: { combat: { niveau: 3 }, soins: { niveau: 4 } } });
  for (let i = 0; i < 3; i++) p = L.reactionEnfant(p, -1).system;
  assert.equal(L.espritDe(p).projet, "vengeance", "un enfant de poing veut se venger");
  assert.equal(L.reactionEnfant(S({ age: 30 }), -1).reaction, "", "un adulte n'est pas un enfant témoin");
  assert.deepEqual(L.complicesPossibles([{ id: "chef", system: S({ sensMoral: 6 }) }, { id: "x", system: S({ sensMoral: 4 }) }, { id: "y", system: S({ sensMoral: 1 }) }], "chef"), ["x"]);
});

test("la couleur du groupe et son prix : bandes, malaise des gens de bien dans un groupe rouge", () => {
  assert.deepEqual([-8, -3, 0, 3, 8].map(L.bandeSensMoral), ["rouge", "rougeatre", "neutre", "bleute", "bleu"]);
  assert.deepEqual(L.couleurDuGroupe([S({ sensMoral: -6 }), S({ sensMoral: -2 }), S({ sensMoral: 5, vivant: false })]), { moyenne: -4, bande: "rougeatre" });
  assert.equal(L.malaiseCouleur(S({ sensMoral: 5 }), -4), -1);
  assert.equal(L.malaiseCouleur(S({ sensMoral: 5 }), 0), 0);
  assert.equal(L.malaiseCouleur(S({ sensMoral: -5 }), -4), 0);
  assert.deepEqual(L.objetReclame({ ment: true, marque: true }), { dementi: true, acte: "mentir" });
  assert.deepEqual(L.objetReclame({ ment: true }), { dementi: false, acte: "" });
});

test("la liste à la porte : ce qui manque vraiment, d'après les stocks et la consommation, le plus urgent d'abord", () => {
  const l = L.listeALaPorte({ stocks: { eau: 4, nourriture: 30, medicaments: 0, munitions: 5, materiaux: 10, pieces: 3, graines: 4, carburant: 2, plantes: 3 }, bilan: { consommation: { eau: 4, nourriture: 4 } } });
  assert.deepEqual(l.map(x => x.ressource), ["eau", "medicaments"]);
  assert.equal(l[0].manque, 24, "sept jours d'eau pour quatre");
  assert.deepEqual(L.listeALaPorte({ stocks: { eau: 40, nourriture: 40, medicaments: 5, munitions: 5, materiaux: 9, pieces: 9, graines: 9, carburant: 9, plantes: 9 }, personnes: 4 }), []);
  assert.ok(L.listeALaPorte({ stocks: {}, personnes: 2 }).length <= L.REGLES_PORTE.liste.max);
});

test("aucune couleur n'est gratuite : le bleu attire les réfugiés, le rouge attire les durs", () => {
  assert.ok(L.chanceVisiteur({ phase: "silence", couleur: "bleu" }) > L.chanceVisiteur({ phase: "silence", couleur: "neutre" }));
  assert.ok(L.chanceVisiteur({ phase: "silence", couleur: "rouge" }) < L.chanceVisiteur({ phase: "silence", couleur: "neutre" }));
  assert.equal(L.chanceVisiteur({ phase: "jour-zero" }), 0);
  const compte = couleur => {
    const n = { refugie: 0, famille: 0, blesse: 0, dur: 0 };
    for (let i = 0; i < 300; i++) n[L.tirerVisiteur(C, L.creerHasard(`${couleur}${i}`), { couleur }).public.profil]++;
    return n;
  };
  const bleu = compte("bleu"), rouge = compte("rouge");
  assert.ok(bleu.refugie + bleu.famille > 3 * (rouge.refugie + rouge.famille) / 2, JSON.stringify({ bleu, rouge }));
  assert.ok(rouge.dur > 3 * bleu.dur, JSON.stringify({ bleu, rouge }));
  const v = L.tirerVisiteur(C, L.creerHasard("dur"), { profil: "dur", id: "v9", jour: 4 });
  assert.equal(v.public.id, "v9");
  assert.ok(v.secret.survivant.sensMoral <= L.SENS_DEPART_MAX - 3 + 0, "un dur est plus rouge");
  assert.ok(!("sensMoral" in v.public), "la couleur du visiteur reste secrète");
  const f = L.tirerVisiteur(C, L.creerHasard("fam"), { profil: "famille" });
  assert.ok(f.public.bouches >= 1 && f.public.bouches <= 3, "une famille : des bouches en plus");
  assert.equal(f.public.demande.cle, "porte-demande-famille");
});

test("le refusé : le rancunier allume un feu, le bon revient avec ce qui manque, le neutre part ; la journée de la porte les fait arriver", () => {
  const liste = [{ ressource: "eau", manque: 10 }, { ressource: "medicaments", manque: 2 }];
  const suites = s => { const n = { part: 0, feu: 0, revient: 0 }; for (let i = 0; i < 400; i++) n[L.suiteDuRefus({ sensMoral: s }, L.creerHasard(`r${s}|${i}`), { liste }).suite]++; return n; };
  const rouge = suites(-5), bleu = suites(5), neutre = suites(0);
  assert.ok(rouge.feu > 230 && rouge.revient === 0, JSON.stringify(rouge));
  assert.ok(bleu.revient > 190 && bleu.feu === 0, JSON.stringify(bleu));
  assert.ok(neutre.part > 250, JSON.stringify(neutre));
  const r = L.suiteDuRefus({ sensMoral: 5 }, () => 0.1, { liste });
  assert.equal(r.suite, "revient");
  assert.deepEqual(Object.keys(r.apporte), ["eau", "medicaments"], "il rapporte ce qui manque");
  assert.ok(r.dans >= 2 && r.dans <= 5);
  // La journée de la porte : le feu prévu fait du bruit, le retour remet le visiteur à la porte, un visiteur trop longtemps sans réponse part.
  const etat = { porte: [{ id: "v1", jour: 0, nom: "Josette" }], groupe: {} };
  const monde = { porte: { v1: { survivant: S() } }, porteSuites: [{ id: "v2", jour: 3, type: "feu", nom: "Paul" }, { id: "v3", jour: 3, type: "revient", nom: "Mina", apporte: { eau: 5 },
    secret: { survivant: S({ nom: "Mina", sensMoral: 5 }), profil: "refugie", bouches: 0 } }] };
  const j = L.journeePorte(etat, monde, C, () => 0.99, { jour: 3, aLAbri: true, phase: "silence" });
  assert.equal(j.bruit, 4, "le feu près du camp");
  assert.deepEqual(j.etat.porte.map(v => v.id), ["v3"], "Josette est repartie, Mina revient");
  assert.deepEqual(j.etat.porte[0].apporte, { eau: 5 });
  assert.ok(j.faits.some(f => f.cle === "porte-feu") && j.secrets.some(f => f.cle === "porte-feu-secret"), "le feu se voit ; qui l'a allumé, seul le MJ le sait");
  assert.deepEqual(j.monde.porteSuites, []);
  const k = L.journeePorte({ porte: [], groupe: {} }, {}, C, () => 0, { jour: 9, aLAbri: true, phase: "silence", couleur: "neutre" });
  assert.equal(k.etat.porte.length, 1, "quelqu'un frappe");
  assert.ok(k.monde.porte[k.etat.porte[0].id].survivant);
});

test("répondre à la porte : accueillir (une recrue), refuser (une suite prévue), prendre puis trahir (il lui reste la chance)", () => {
  const base = () => ({ etat: { porte: [{ id: "v1", jour: 1, nom: "Mina", apporte: { eau: 4 } }, { id: "v2", jour: 1, nom: "Paul", apporte: {} }], groupe: {} },
    monde: { porte: { v1: { survivant: S({ nom: "Mina", sensMoral: 4 }), profil: "refugie", bouches: 0 }, v2: { survivant: S({ nom: "Paul", sensMoral: -5 }), profil: "dur", bouches: 0 } } } });
  let b = base();
  const a = L.repondreALaPorte(b.etat, b.monde, () => 0.5, { visiteurId: "v1", decision: "accueillir", jour: 5 });
  assert.equal(a.acte, "accueillir");
  assert.equal(a.recrue.nom, "Mina");
  assert.deepEqual(a.stocks, { eau: 4 }, "ce qu'elle rapporte entre avec elle");
  assert.equal(a.etat.groupe.accueilLe, 5);
  assert.deepEqual(a.etat.porte.map(v => v.id), ["v2"]);
  b = base();
  const r = L.repondreALaPorte(b.etat, b.monde, () => 0.1, { visiteurId: "v2", decision: "refuser", jour: 5 });
  assert.equal(r.acte, "exclure");
  assert.equal(r.suite.suite, "feu");
  assert.equal(r.monde.porteSuites[0].type, "feu");
  assert.equal(r.monde.porteSuites[0].secret.survivant.sensMoral, -6, "le rancunier rougit");
  b = base();
  assert.equal(L.repondreALaPorte(b.etat, b.monde, () => 0.5, { visiteurId: "v2", decision: "trahir" }).ok, false, "rien à prendre");
  const t = L.repondreALaPorte(b.etat, b.monde, () => 0.5, { visiteurId: "v1", decision: "trahir", jour: 6 });
  assert.equal(t.acte, "trahir");
  assert.deepEqual(t.stocks, { eau: 4 });
  assert.equal(L.espritDe(t.monde.trahis[0].survivant).chance, 1, "le trahi a de la chance (le jeu ne dit pas pourquoi)");
  assert.equal(L.repondreALaPorte(b.etat, b.monde, () => 0.5, { visiteurId: "v9", decision: "accueillir" }).ok, false);
});

test("le chef de bande décide selon son sens moral : rouge et fort, il attaque ou pose un ultimatum ; bleu, il négocie, passe ou demande à rejoindre", () => {
  const tirages = situation => { const n = Object.fromEntries(L.DECISIONS_CHEF.map(d => [d, 0])); for (let i = 0; i < 1000; i++) n[L.decisionChefDeBande(situation, L.creerHasard(`c${JSON.stringify(situation)}${i}`)).decision]++; return n; };
  const rouge = tirages({ sensMoral: -8, force: 6, forceGroupe: 3 });
  const bleu = tirages({ sensMoral: 7, force: 2, forceGroupe: 6, faim: 0.6 });
  assert.ok(rouge.attaquer + rouge.ultimatum > 650, JSON.stringify(rouge));
  assert.ok(bleu.attaquer + bleu.ultimatum < 60, JSON.stringify(bleu));
  assert.ok(bleu.negocier + bleu.passer + bleu.rejoindre > 900, JSON.stringify(bleu));
  // Une réputation bleue attire demandes et ultimatums ; une rouge fait réfléchir avant d'attaquer.
  const doux = L.poidsChefDeBande({ sensMoral: 0, force: 3, forceGroupe: 3, reputationGroupe: 3 }), dur = L.poidsChefDeBande({ sensMoral: 0, force: 3, forceGroupe: 3, reputationGroupe: -3 });
  assert.ok(doux.ultimatum > dur.ultimatum && dur.attaquer < doux.attaquer);
  // Le chef d'une menace : le sens moral du chef de sa faction (contenu), à ±2 près.
  const sansLune = L.factionDe(C, "sans-lune");
  for (let i = 0; i < 50; i++) {
    const c = L.chefDeLaMenace({ type: "bande", force: 4, faction: "sans-lune" }, sansLune, L.creerHasard(`m${i}`));
    assert.ok(c.sensMoral >= sansLune.sensMoralChef - 2 && c.sensMoral <= sansLune.sensMoralChef + 2);
    assert.ok(L.DECISIONS_CHEF.includes(c.decision) && c.cle === `chef-${c.decision}`);
  }
  assert.ok(L.chefDeLaMenace({ type: "bande", attitude: "amicale", force: 2 }, null, () => 0.5).sensMoral >= 2, "sans faction connue : d'après l'attitude");
});

test("l'ultimatum devient un tribut : payé quatre fois à une bande qui n'est pas rouge, une alliance ; une bande rouge augmente ; refuser, la révolte", () => {
  const demande = L.demandeTribut({ nourriture: 30, eau: 50, carburant: 2 }, 3);
  assert.deepEqual(Object.keys(demande).sort(), ["carburant", "nourriture"], "les vivres d'abord, puis le précieux");
  let { tribut, secret } = L.poserUltimatum({ id: "t1", bande: "Les Sans-Lune", sensMoral: 0, force: 3, demande, jour: 10 });
  assert.equal(tribut.prochain, 17);
  assert.deepEqual(L.tributsDus({ tributs: [tribut] }, 17).map(t => t.id), ["t1"]);
  let issue;
  for (let i = 0; i < 4; i++) ({ tribut, issue } = L.echeanceTribut(tribut, secret, { paye: true, jour: 17 + 7 * i }));
  assert.equal(issue, "alliance");
  assert.equal(tribut.etat, "allie");
  ({ tribut, secret } = L.poserUltimatum({ id: "t2", sensMoral: -7, force: 4, demande: { nourriture: 4 }, jour: 0 }));
  for (let i = 0; i < 3; i++) ({ tribut, issue } = L.echeanceTribut(tribut, secret, { paye: true }));
  assert.equal(issue, "hausse");
  assert.equal(tribut.demande.nourriture, 5);
  assert.equal(L.echeanceTribut(tribut, secret, { paye: false, jour: 30 }).issue, "revolte");
});

test("l'autorité : la parole, les bouches nourries, le vote suivi ou ignoré ; trop basse, désertions, scission, renversement ; en assaut", () => {
  assert.equal(L.tenirParole(S({ autorite: 2 }), true).system.autorite, 3);
  assert.equal(L.tenirParole(S({ autorite: 2 }), false).system.autorite, 1);
  assert.equal(L.autoriteDe(L.survivantNeuf({})), 2, "une fiche d'avant : autorité 2");
  const v = L.resoudreVote({ a: "contre", b: "contre", c: "contre", d: "pour" });
  assert.equal(L.suivreVote(S({ autorite: 3 }), v, "contre").suivi, true);
  assert.equal(L.suivreVote(S({ autorite: 3 }), v, "pour").system.autorite, 1, "ignorer les trois quarts : −2");
  assert.equal(L.suivreVote(S({ autorite: 3 }), L.resoudreVote({ a: "contre", b: "contre", c: "contre", d: "pour", e: "pour" }), "pour").system.autorite, 2, "trois contre deux : −1");
  let chef = S({ autorite: 2 });
  for (let j = 0; j < 7; j++) chef = L.autoriteDuJour(chef, { tousNourris: true }).system;
  assert.equal(chef.autorite, 3, "une semaine où tout le monde mange");
  for (let j = 0; j < 3; j++) chef = L.autoriteDuJour(chef, { tousNourris: false }).system;
  assert.equal(chef.autorite, 2, "trois jours de faim");
  const membres = [{ id: "chef", system: S({ autorite: 0, statut: "joueur" }) }, { id: "a", system: S({ moral: 1 }) }, { id: "b", system: S({ autorite: 4, moral: 3 }) },
    { id: "c", system: S({ statut: "joueur" }) }];
  const crise = L.crisesAutorite({ membres, chefId: "chef", jour: 14, hasard: () => 0 });
  assert.deepEqual(crise, { deserteur: "a", crise: "scission", successeur: "b" });
  assert.equal(L.crisesAutorite({ membres, chefId: "chef", jour: 13, hasard: () => 0 }).deserteur, "", "une fois par semaine");
  assert.equal(L.crisesAutorite({ membres: membres.slice(0, 3), chefId: "chef", jour: 7, hasard: () => 0.99 }).crise, "renversement");
  assert.equal(L.crisesAutorite({ membres: [{ id: "chef", system: S({ autorite: 3 }) }, ...membres.slice(1)], chefId: "chef", jour: 7, hasard: () => 0 }).deserteur, "", "un chef écouté");
  assert.deepEqual([5, 3, 1].map(L.bonusAutoriteAssaut), [1, 0, -1]);
});

test("séparation et fusion : stocks partagés au prorata, les plans à tous, l'abri à l'un des deux ; la fusion réunit tout", () => {
  assert.deepEqual(L.partagerStocks({ eau: 10, nourriture: 7 }, 3, 1), { a: { eau: 8, nourriture: 6 }, b: { eau: 2, nourriture: 1 } });
  assert.deepEqual(L.partagerStocks({ eau: 10 }, 1, 1, 0.3), { a: { eau: 3 }, b: { eau: 7 } });
  const s = L.separerGroupe({ membres: ["a", "b", "c", "d"], partants: ["c", "d"], stocks: { eau: 9 }, plans: ["citerne"], abriVaAux: "partants" });
  assert.deepEqual([s.restants, s.partants, s.abri], [["a", "b"], ["c", "d"], "partants"]);
  assert.equal(s.stocksRestants.eau + s.stocksPartants.eau, 9);
  assert.deepEqual([s.plansRestants, s.plansPartants], [["citerne"], ["citerne"]]);
  const f = L.fusionnerGroupes({ membres: ["a"], stocks: { eau: 2 }, plans: ["citerne"], entente: 2 }, { membres: ["c"], stocks: { eau: 3, pieces: 1 }, plans: ["potager"], entente: 0 });
  assert.deepEqual(f, { membres: ["a", "c"], stocks: { eau: 5, pieces: 1 }, plans: ["citerne", "potager"], entente: -1 });
});

test("avancer : le chef nourrit son monde (autorité), le tribut tombe (alerte), on frappe à la porte d'un groupe à l'esprit tiré", () => {
  const C2 = contenuMini();
  const membres = ["a", "b", "c"].map(id => ({ id, system: S({ moral: 4, statut: id === "a" ? "joueur" : "compagnon" }) }));
  let { monde, etat } = L.demarrerPartie({ contenu: C2, graine: "moral-avancer", region: "port-gris", membres: membres.map(m => m.id) });
  const ins = L.installerAbri(monde, C2, { site: "port-immeuble", jour: 0, apport: { nourriture: 80, eau: 80 } });
  etat = { ...etat, groupe: { ...etat.groupe, chef: "a" }, tributs: [{ id: "t1", bande: "Les Sans-Lune", demande: { nourriture: 2 }, tousLes: 7, prochain: 3, payes: 0, etat: "actif" }] };
  const r = L.avancer({ etat, monde: ins.monde, contenu: C2, quarts: 4 * 24, survivants: membres, abri: { id: "abri", system: ins.abri, installations: ins.installations } });
  assert.ok(r.alertes.some(a => a.cle === "tribut-du"), "le tribut est annoncé le jour où il tombe");
  // Les deux premières semaines, tout le monde mange : on écoute davantage le chef ; quand l'eau puis les vivres manquent, moins.
  const cles = r.etat.journal.map(e => e.cle);
  assert.ok(cles.indexOf("autorite-monte") >= 0 && cles.indexOf("autorite-baisse") > cles.indexOf("autorite-monte"), cles.filter(c => /autorite/.test(c)).join(","));
  assert.ok(r.etat.journal.some(e => /^porte-/.test(e.cle ?? "")), "quelqu'un est venu frapper en trois semaines");
});
