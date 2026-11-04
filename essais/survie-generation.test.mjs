// Création « à la RimWorld », recrues, tâches du jour (contrat §10).  Lancer : npm run essais
import { test } from "node:test";
import assert from "node:assert/strict";
import { L, contenuMini, desFixes, constant, I } from "./doublures/survie-outils.mjs";

const C = contenuMini();
const T = L.indexer(C).traits;
const somme = s => L.COMPETENCES.reduce((t, c) => t + s.competences[c].niveau, 0);

test("genererSurvivant : 1000 tirages — budget respecté, jamais de traits incompatibles, 1 à 3 traits, 1 à 2 passions", () => {
  const vus = { enfances: new Set(), passes: new Set(), traits: new Set() };
  for (let i = 0; i < 1000; i++) {
    const s = L.genererSurvivant(C, L.creerHasard(`g${i}`), { statut: "joueur" });
    const n = somme(s);
    assert.ok(n >= 10 && n <= 16, `budget : ${n} (tirage ${i})`);
    assert.ok(s.traits.length >= 1 && s.traits.length <= 3);
    for (const a of s.traits) for (const b of s.traits) if (a !== b) assert.ok(!(T.get(a).incompatibles ?? []).includes(b), `${a} et ${b}`);
    assert.equal(new Set(s.traits).size, s.traits.length);
    const passions = Object.values(s.passions).filter(x => x > 0);
    assert.ok(passions.length >= 1 && passions.length <= 2);
    assert.ok(s.age >= 16 && s.age <= 75);
    for (const c of L.COMPETENCES) assert.ok(s.competences[c].niveau >= 0 && s.competences[c].niveau <= 5);
    if (L.indexer(C).passes.get(s.passe)?.ageMin) assert.ok(s.age >= L.indexer(C).passes.get(s.passe).ageMin);
    vus.enfances.add(s.enfance); vus.passes.add(s.passe); for (const t of s.traits) vus.traits.add(t);
    assert.equal(s.statut, "joueur");
    assert.ok(s.histoire.graine.proche);
  }
  assert.equal(vus.enfances.size, 5);
  assert.equal(vus.passes.size, 6);
  assert.equal(vus.traits.size, T.size);
});

test("genererSurvivant : compétences = enfance + passé + traits ; verrous ; incapacités ; savoirs ; budget réglable", () => {
  const s = L.genererSurvivant(C, L.creerHasard("v"), { statut: "pnj", budget: null, verrous: { age: 30, enfance: "enfant-des-hauts", passe: "infirmiere", traits: ["pacifique"], nom: "Rosemay" } });
  assert.equal(s.nom, "Rosemay");
  assert.equal(s.age, 30);
  assert.equal(s.competences.soins.niveau, 3);
  assert.equal(s.competences.survie.niveau, 2);
  assert.equal(s.competences.parole.niveau, 1);
  assert.equal(s.competences.combat.niveau, 0, "−1 plafonné à 0");
  assert.deepEqual(s.traits, ["pacifique"]);
  assert.ok(s.incapacites.includes("violence"));
  assert.deepEqual(s.savoirs.sort(), ["maraichage", "premiers-secours"]);
  assert.ok(s.histoire.graine.phrases.length === 2);
  const vieux = L.genererSurvivant(C, L.creerHasard("vx"), { budget: null, age: 65, enfance: "fille-de-pecheur", passe: "retraite-marine", traits: [] });
  assert.equal(vieux.competences.endurance.niveau, 0, "endurance 1 − 2 à 65 ans");
  const serre = L.genererSurvivant(C, L.creerHasard("b"), { budget: [6, 8] });
  assert.ok(somme(serre) >= 6 && somme(serre) <= 8);
});

test("genre : 1000 tirages — jamais un prénom féminin avec un passé ou une enfance masculins, ni l'inverse ; genre exposé", () => {
  const idx = L.indexer(C);
  const genres = { f: new Set(C.prenomsF), m: new Set(C.prenomsM) };
  const vus = { f: 0, m: 0, "": 0 };
  let mixtes = 0;
  for (let i = 0; i < 1000; i++) {
    const s = L.genererSurvivant(C, L.creerHasard(`gn${i}`), { statut: "joueur" });
    assert.ok(s.nom, "un prénom du contenu");
    const gNom = genres.f.has(s.nom) ? "f" : genres.m.has(s.nom) ? "m" : "";
    assert.ok(["f", "m", ""].includes(s.genre));
    if (gNom) assert.equal(s.genre, gNom, `genre « ${s.genre} » pour ${s.nom} (tirage ${i})`); else mixtes++;
    for (const def of [idx.passes.get(s.passe), idx.enfances.get(s.enfance)]) {
      // Un élément genré est toujours du genre du survivant (donc du prénom) : « Christophe, agricultrice » n'existe plus.
      if (def?.genre) assert.equal(def.genre, s.genre, `${s.nom} (${s.genre}), ${def.nom} (tirage ${i})`);
    }
    // Les phrases de la graine viennent d'éléments du genre du survivant.
    assert.ok(s.histoire.graine.phrases.every(p => !(s.genre === "m" && p.startsWith("Elle ")) && !(s.genre === "f" && p.startsWith("Il "))), `phrases genrées (${s.nom})`);
    vus[s.genre]++;
  }
  assert.ok(vus.f > 200 && vus.m > 200, `des deux genres : ${JSON.stringify(vus)}`);
  assert.ok(mixtes >= 1 && mixtes < 300, `des prénoms mixtes, rarement : ${mixtes}`);
});

test("genre : verrous — le nom gardé décide (libellé accordé par nomAccorde), sinon le passé ; genre gardé ; nom inconnu", () => {
  const idx = L.indexer(C);
  const passe = cle => idx.passes.get(cle), enfance = cle => idx.enfances.get(cle);
  // Nom féminin gardé, passé masculin gardé : on garde le nom, le passé s'affiche au féminin, ses phrases (au masculin) sont écartées.
  const a = L.genererSurvivant(C, L.creerHasard("a"), { budget: null, verrous: { nom: "Rosemay Fontaine", passe: "electricien", enfance: "enfant-des-hauts" } });
  assert.equal(a.nom, "Rosemay Fontaine");
  assert.equal(a.genre, "f");
  assert.equal(L.nomAccorde(passe(a.passe), a.genre), "Électricienne");
  assert.deepEqual(a.histoire.graine.phrases, ["A grandi dans la brume, entre les chouchous."]);
  // Le prénom seul suffit (« Christophe Payet » : masculin) ; un nom inconnu laisse le libellé du passé.
  const b = L.genererSurvivant(C, L.creerHasard("b"), { budget: null, verrous: { nom: "Christophe Payet", passe: "infirmiere" } });
  assert.equal(b.genre, "m");
  assert.equal(L.nomAccorde(passe(b.passe), b.genre), "Infirmier");
  const c = L.genererSurvivant(C, L.creerHasard("c"), { budget: null, verrous: { nom: "Alex Dupont", passe: "infirmiere" } });
  assert.equal(c.genre, "f", "nom de genre inconnu : le genre du passé");
  assert.equal(L.nomAccorde(passe(c.passe), c.genre), "Infirmière");
  assert.equal(L.genreDuNom(C, "Alex Dupont"), "");
  assert.equal(L.genreDuNom(C, "Latchimy Vélaye"), "", "mixte");
  // Enfance et passé gardés, contradictoires, sans nom : le genre du passé gagne, l'enfance prend son autre libellé.
  const d = L.genererSurvivant(C, L.creerHasard("d"), { budget: null, verrous: { enfance: "fille-de-pecheur", passe: "planteur" } });
  assert.equal(d.genre, "m");
  assert.ok(C.prenomsM.includes(d.nom));
  assert.equal(L.nomAccorde(enfance(d.enfance), d.genre), "Fils de pêcheur");
  assert.equal(L.nomAccorde(passe(d.passe), d.genre), "Planteur");
  assert.deepEqual(d.histoire.graine.phrases, ["Il coupait la canne depuis vingt ans."]);
  // Enfance gardée seule : le passé tiré est du même genre (ou neutre), 200 fois.
  for (let i = 0; i < 200; i++) {
    const e = L.genererSurvivant(C, L.creerHasard(`e${i}`), { budget: null, verrous: { enfance: "fille-de-pecheur" } });
    assert.ok(!passe(e.passe).genre || passe(e.passe).genre === "f", `${e.passe} avec fille de pêcheur`);
    assert.equal(e.genre, "f");
    assert.ok(C.prenomsF.includes(e.nom) || C.prenomsMixtes.includes(e.nom));
  }
  // Genre gardé : prénom de ce genre, éléments compatibles.
  for (let i = 0; i < 100; i++) {
    const g = L.genererSurvivant(C, L.creerHasard(`g${i}`), { budget: null, genre: "m" });
    assert.ok(C.prenomsM.includes(g.nom) || C.prenomsMixtes.includes(g.nom));
    assert.ok(!passe(g.passe).genre || passe(g.passe).genre === "m");
  }
  // nomAccorde : neutre ou sans genre connu -> le nom tel quel.
  assert.equal(L.nomAccorde(passe("gendarme"), "m"), "Gendarme");
  assert.equal(L.nomAccorde(passe("infirmiere"), ""), "Infirmière");
  assert.equal(L.nomAccorde(null, "f"), "");
  // Sans prénoms rangés par genre (ancien contenu : noms à plat) : un nom quelconque, genre vide.
  const vieux = { ...C, prenomsF: undefined, prenomsM: undefined, prenomsMixtes: undefined, noms: ["Ti Paul"] };
  const h = L.genererSurvivant(vieux, L.creerHasard("h"), { budget: null, verrous: { passe: "gendarme", enfance: "enfant-des-hauts" } });
  assert.equal(h.nom, "Ti Paul");
  assert.equal(h.genre, "");
});

test("besoinsDuGroupe : couverture, urgences, profil recherché", () => {
  const medic = L.genererSurvivant(C, constant(0.5), { budget: null, passe: "infirmiere", enfance: "enfance-protegee", traits: [] });
  const blesse = { ...L.genererSurvivant(C, constant(0.5), { budget: null, passe: "gendarme", enfance: "gamin-du-port", traits: [] }), blessures: 2 };
  const b = L.besoinsDuGroupe([{ id: "m", system: medic }, { id: "b", system: blesse }], { installations: [I("potager", 1), { ...I("palissade", 0), chantier: { fait: 0, requis: 12 } }] }, C,
    { groupe: { region: "port-gris" }, renseignements: { "port-gris": { factions: ["recuperateurs"] } } });
  assert.equal(b.taches.soins.couverture, "couvert");
  assert.equal(b.taches.soins.qui, "m");
  assert.equal(b.taches.soins.urgence, false, "un soigneur est là");
  assert.equal(b.taches.chantier.couverture, "manquant");
  assert.equal(b.taches.chantier.urgence, true);
  assert.equal(b.taches.garde.urgence, false, "le gendarme est couvert en vigilance");
  assert.ok(b.manques.includes("bricolage"));
  assert.ok(b.profil.bricolage >= 3);
  assert.equal(b.profil.soins, undefined);
  assert.equal(b.taches.negociation.couverture, "couvert", "infirmière + enfance protégée : parole 3");
});

test("genererRecrue : comble les manques plus souvent qu'au hasard (1000 tirages)", () => {
  const besoins = { profil: { soins: 3, bricolage: 3 }, manques: ["soins", "bricolage"] };
  let favorise = 0, hasard = 0;
  for (let i = 0; i < 1000; i++) {
    const r = L.genererRecrue(C, L.creerHasard(`r${i}`), { besoins });
    assert.equal(r.survivant.statut, "recrue");
    assert.ok(r.raison && r.prix);
    if (Math.max(r.survivant.competences.soins.niveau, r.survivant.competences.bricolage.niveau) >= 2) favorise++;
    const s = L.genererSurvivant(C, L.creerHasard(`r${i}`), { statut: "recrue", budget: null });
    if (Math.max(s.competences.soins.niveau, s.competences.bricolage.niveau) >= 2) hasard++;
  }
  assert.ok(favorise > hasard * 1.3, `recrues favorisées ${favorise} contre ${hasard} au hasard`);
  assert.ok(favorise < 1000, "des surprises restent");
});

test("recruter : parole contre attitude, un cran plus facile si la recrue comble un manque", () => {
  assert.equal(L.difficulteRecrutement({ attitude: "amicale" }), "facile");
  assert.equal(L.difficulteRecrutement({ attitude: "mefiante" }), "difficile");
  assert.equal(L.difficulteRecrutement({ attitude: "hostile" }), "extreme");
  assert.equal(L.difficulteRecrutement({ attitude: "mefiante", combleUnManque: true }), "normale");
  const recrue = L.genererSurvivant(C, constant(0.3), { budget: null, passe: "electricien", statut: "recrue" });
  const r = L.recruter({ recrue, parleur: { competences: { parole: { niveau: 1 } } }, attitude: "neutre", besoins: { manques: ["bricolage"] }, hasard: desFixes([5, 1, 1]) });
  assert.equal(r.difficulte, "facile");
  assert.equal(r.reussite, true);
  assert.equal(r.recrue.statut, "recrue");
  const etat = L.ajouterMembre({ groupe: { membres: ["a"] } }, "z", "recrue");
  assert.deepEqual(etat.groupe.membres, ["a", "z"]);
  assert.equal(L.ajouterMembre(etat, "z").groupe.membres.length, 2);
});

test("passions dans marquer : × 1,5, × 2, bonus des jeunes", () => {
  assert.equal(L.marquer({ niveau: 2, marques: 0 }, 1, { passion: 1 }).marques, 1.5);
  assert.equal(L.marquer({ niveau: 2, marques: 0 }, 1, { passion: 2 }).marques, 2);
  assert.equal(L.marquer({ niveau: 2, marques: 0 }, 3, { age: 20 }).marques, 4);
  assert.equal(L.marquer({ niveau: 2, marques: 0 }, 3, { age: 40 }).marques, 3);
  assert.equal(L.marquer({ niveau: 0, marques: 0 }, 1, { passion: 2 }).monte, true, "seuil 2 atteint d'un coup");
});

test("traits : malus de la peur, rations, moral du pessimiste, solitaire, fatigue de l'insomniaque", () => {
  const claustro = { traits: ["claustrophobe"] };
  const m = L.modificateursTraits(claustro, C, { lieux: L.lieuxAbri({ site: "sud-tunnel", installations: [] }, C) });
  assert.equal(m.malus, 1);
  assert.equal(L.malusEtat({}, { traits: m.malus }).total, 1);
  assert.equal(L.modificateursTraits(claustro, C, { lieux: L.lieuxAbri({ site: "hauts-ferme", installations: [] }, C) }).malus, 0);
  assert.equal(L.modificateursTraits(claustro, C, { lieux: L.lieuxAbri({ site: "hauts-ferme", installations: [I("galerie", 1)] }, C) }).malus, 1);
  assert.equal(L.modificateursTraits({ traits: ["main-verte"] }, C, { tache: "cultures" }).bonus, 1);
  assert.equal(L.modificateursTraits({ traits: ["maladroit"] }, C, { tache: "atelier" }).malus, 1);
  assert.deepEqual(L.effetsTraits({ traits: ["gros-mangeur"] }, C).besoins, { eau: 1, nourriture: 1.5 });
  assert.deepEqual(L.consommationJour({ personnes: 2, rations: { eau: 2, nourriture: 2.5 }, altitude: 900 }), { eau: 2, nourriture: 3 });
  const pess = L.effetJour({ moral: 4 }, { mange: true, traits: L.effetsTraits({ traits: ["pessimiste"] }, C) }).system.moral;
  assert.equal(pess, 3);
  assert.equal(L.effetJour({ moral: 4 }, { mange: true, traits: L.effetsTraits({ traits: ["optimiste"] }, C) }).system.moral, 4 + 0, "plafond 4 : déjà atteint");
  assert.equal(L.effetJour({ moral: 3 }, { mange: true, traits: L.effetsTraits({ traits: ["optimiste"] }, C) }).system.moral, 4);
  assert.equal(L.effetJour({ moral: 4 }, { mange: true, personnes: 8, traits: L.effetsTraits({ traits: ["solitaire"] }, C) }).system.moral, 3);
  assert.equal(L.effetJour({ fatigue: 0 }, { mange: true, traits: L.effetsTraits({ traits: ["insomniaque"] }, C) }).system.fatigue, 1);
});

test("tâches : assigner (incapacités), facteur des bras, répartition automatique", () => {
  const paci = L.genererSurvivant(C, constant(0.2), { budget: null, traits: ["pacifique"] });
  assert.equal(L.assigner(paci, "garde").ok, false, "incapable de violence : pas de garde");
  assert.equal(L.assigner(paci, "voler").ok, false);
  const a = L.assigner(paci, "cultures", 3);
  assert.equal(a.ok, true);
  assert.equal(a.system.tache, "cultures");
  assert.equal(a.system.joursTache, 0);
  assert.equal(L.facteurBras({ nombre: 2, niveau: 2 }, []), 0.5);
  assert.equal(L.facteurBras({ nombre: 1, niveau: 2 }, [{ niveau: 2 }]), 1);
  assert.ok(Math.abs(L.facteurBras({ nombre: 1, niveau: 2 }, [{ niveau: 4, passion: 2 }]) - 1.3) < 1e-9);
  assert.equal(L.facteurBras({ nombre: 1, niveau: 2 }, [{ niveau: 1 }]), 0.75);
  assert.equal(L.facteurBras({ nombre: 2, niveau: 2 }, [{ niveau: 2 }]), 0.75);
  const abri = { site: "hauts-ferme", region: "hauts-verts", sol: 3 };
  const seul = L.bilanAbri(abri, [I("jardin-creole", 1)], C, { personnes: 0 });
  assert.equal(seul.production.nourriture, 2);
  const deux = L.bilanAbri(abri, [I("jardin-creole", 1)], C, { personnes: 0, travailleurs: { cultures: [{ niveau: 3 }, { niveau: 2 }] } });
  assert.equal(deux.production.nourriture, Math.round(4 * 1.05));
  const membres = [
    { id: "inf", system: L.genererSurvivant(C, constant(0.5), { budget: null, passe: "infirmiere", enfance: "enfance-protegee", traits: [] }) },
    { id: "elec", system: L.genererSurvivant(C, constant(0.5), { budget: null, passe: "electricien", enfance: "gamin-du-port", traits: [] }) }
  ];
  membres[0].system.blessures = 2;
  const rep = L.repartir(membres, L.besoinsDuGroupe(membres, { installations: [] }, C, {}), C);
  assert.equal(rep.inf, "soins");
  assert.ok(["garde", "chantier", "atelier"].includes(rep.elec));
});

test("avancer : tâche tenue 7 jours → une marque (× passion), passion pratiquée → moral, enseigner, départ d'une recrue", () => {
  const { monde, etat } = L.demarrerPartie({ contenu: C, graine: "t", region: "hauts-verts", membres: ["p", "e", "r"] });
  const ins = L.installerAbri(monde, C, { site: "hauts-ferme", apport: { nourriture: 100, eau: 40 } });
  const prof = L.survivantNeuf({ age: 40, tache: "enseigner", enseigne: { eleve: "e", competence: "soins" }, competences: { soins: { niveau: 4 } }, passions: { soins: 0 } });
  const eleve = L.survivantNeuf({ age: 30, tache: "cultures", competences: { survie: { niveau: 1 }, soins: { niveau: 1 } }, passions: { survie: 2 }, moral: 3 });
  const recrue = L.survivantNeuf({ statut: "recrue", tache: "repos", moral: 0, traits: ["desespere"] });
  const C2 = contenuMini();
  C2.traits.push({ cle: "desespere", nom: "Désespéré", effets: { moral: -3 }, incompatibles: [], poids: 0 });
  const r = L.avancer({ etat, monde: ins.monde, contenu: C2, quarts: 4 * 7, survivants: [{ id: "p", system: prof }, { id: "e", system: eleve }, { id: "r", system: recrue }],
    abri: { id: "a", system: ins.abri, installations: ins.installations } });
  const e = r.acteurs.survivants.find(s => s.id === "e").system;
  assert.equal(e.competences.survie.marques, 2, "une marque × 2 (passion) au 7e jour de cultures");
  assert.equal(e.moral, 5, "la passion pratiquée remonte le moral");
  assert.equal(e.competences.soins.niveau, 2, "7 marques de l'enseignante : niveau 1 → 2");
  assert.deepEqual(r.departs, ["r"]);
  assert.ok(!r.etat.groupe.membres.includes("r"));
  assert.ok(r.etat.alertes.some(a => a.type === "depart"));
});

test("avancer : un gros mangeur mange plus, un claustrophobe perd le moral dans le tunnel", () => {
  const { monde, etat } = L.demarrerPartie({ contenu: C, graine: "gm", region: "sud-sauvage", membres: ["a", "b"] });
  const ins = L.installerAbri(monde, C, { site: "sud-tunnel", apport: { nourriture: 50, eau: 40 } });
  const go = (traits, nourr) => L.avancer({ etat, monde: ins.monde, contenu: C, quarts: 4,
    survivants: [{ id: "a", system: L.survivantNeuf({ traits }) }, { id: "b", system: L.survivantNeuf({ traits: [] }) }],
    abri: { id: "x", system: ins.abri, installations: [] } });
  const normal = go([]), gros = go(["gros-mangeur"]);
  assert.equal(normal.acteurs.abri.system.stocks.nourriture - gros.acteurs.abri.system.stocks.nourriture, 1);
  const claustro = go(["claustrophobe"]);
  const moral = claustro.acteurs.survivants.find(s => s.id === "a")?.system.moral ?? 4;
  assert.ok(moral < 4, `moral ${moral}`);
});
