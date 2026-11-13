// Le marché de Fénoir (logique systems/lakour-survie/logique/marche.mjs, contrat §12, docs/equilibre-marche.md) :
// - le cours du troc (parts), l'évaluation et l'application d'un troc ;
// - la première confiance d'un PNJ (ses préjugés éveillés par le MJ, les rumeurs, la réputation de sa faction) et l'usure des
//   préjugés (échanges honnêtes, fêtes partagées, démentis) ; aucune origine ne joue dans les règles ;
// - le carnet de crédit (plafond, dette qui traîne, rendre, Nouvel An chinois, dettes effacées) ;
// - le marché forain (jour fixe, foire, trêve, litiges, accueil et signature de l'abri) ;
// - le Ladi Lafé (rumeur publique, vérité secrète, démenti, menteur démasqué, extinction) et les objets marqués ;
// - la journée du marché ; les événements de marché, que la simulation du monde ne tire jamais.
// Aucun réseau.  Lancer : npm run essais
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import * as L from "../systems/lakour-survie/logique/index.mjs";

const RACINE = new URL("../", import.meta.url);
const lire = chemin => readFileSync(new URL(chemin, RACINE), "utf8");
const DONNEES = JSON.parse(lire("modules/lakour-fenoir/assets/donnees.json"));
const { normaliserContenu } = await import("../systems/lakour-survie/scripts/registre.mjs");
const C = normaliserContenu(structuredClone(DONNEES));
const P = (cible, poids = 1, x = {}) => ({ cible, poids, dit: "« … »", ...x });

// ------------------------------------------------------------------ le cours
test("cours : valeurs de base en parts, crise, saison, récolte de foire, ajustements du conseil ; l'énergie ne se troque pas", () => {
  const base = L.coursDuJour({ phase: "jour-zero", saison: "pluies" });
  assert.deepEqual(Object.keys(base).sort(), L.RESSOURCES_TROC.slice().sort());
  assert.ok(!("energie" in base));
  assert.equal(base.nourriture, 1);
  assert.equal(base.eau, 0.5, "l'eau vaut moitié moins sous la pluie");
  assert.equal(base.medicaments, 5);
  assert.equal(L.coursDuJour({ phase: "jour-zero", saison: "seche" }).eau, 1.5);
  const apres = L.coursDuJour({ phase: "apres", saison: "seche" });
  assert.equal(apres.carburant, 10, "le carburant ne revient jamais : ×2,5 dans l'après");
  assert.equal(L.coursDuJour({ phase: "silence", recolte: "nourriture" }).nourriture, 0.5, "la récolte d'une foire vaut moitié moins");
  assert.equal(L.coursDuJour({ ajustements: { medicaments: 2 } }).medicaments, 7, "le conseil ajuste le cours");
  for (const v of Object.values(L.coursDuJour({ ajustements: { eau: -9 } }))) assert.ok(v >= L.REGLES_MARCHE.cours.minimum, "jamais sous le minimum");
});

test("troc : valeur au cours, majoration de la première confiance, équitable, accepté ; appliqué seulement si l'on a ce qu'on donne", () => {
  const cours = L.coursDuJour({ phase: "jour-zero", saison: "seche" });
  assert.equal(L.valeurBiens({ medicaments: 2, nourriture: 3, energie: 50 }, cours), 13, "l'énergie ne compte pas");
  const juste = L.evaluerTroc({ donne: { munitions: 1 }, recoit: { nourriture: 3 }, cours });
  assert.ok(juste.accepte && juste.equitable && juste.ecart === 0);
  const majore = L.evaluerTroc({ donne: { munitions: 1 }, recoit: { nourriture: 3 }, cours, majoration: 0.5 });
  assert.equal(majore.demandee, 4.5);
  assert.ok(!majore.accepte, "un marchand méfiant demande plus");
  assert.ok(L.evaluerTroc({ donne: { munitions: 2 }, recoit: { nourriture: 3 }, cours, majoration: 0.5 }).accepte);
  assert.ok(!L.evaluerTroc({ donne: { munitions: 1 }, recoit: {}, cours }).accepte, "on ne troque pas contre rien");
  const ok = L.appliquerTroc({ munitions: 2, nourriture: 0 }, { donne: { munitions: 1 }, recoit: { nourriture: 3 } });
  assert.ok(ok.ok);
  assert.equal(ok.stocks.munitions, 1);
  assert.equal(ok.stocks.nourriture, 3);
  const non = L.appliquerTroc({ munitions: 0 }, { donne: { munitions: 1 }, recoit: { nourriture: 3 } });
  assert.ok(!non.ok);
  assert.deepEqual(non.manque, { munitions: 1 });
  assert.equal(non.motif.cle, "manque");
});

// ------------------------------------------------------------------ préjugés
test("première confiance : seuls les préjugés éveillés comptent, cumulés avec les rumeurs, plafonnés à 3 ; la réputation d'une faction s'ajoute", () => {
  const prejuges = [P("zoreils", 1), P("gens-d-en-bas", 2)];
  const rien = L.premiereConfiance({ prejuges, cibles: [] });
  assert.deepEqual([rien.poids, rien.majoration, rien.credit, rien.parole], [0, 0, "plein", 0], "sans préjugé éveillé : confiance pleine");
  const un = L.premiereConfiance({ prejuges, cibles: ["zoreils"] });
  assert.deepEqual([un.poids, un.majoration, un.credit, un.parole], [1, 0.25, "moitie", 1]);
  assert.deepEqual(un.enJeu, ["zoreils"]);
  const deux = L.premiereConfiance({ prejuges, cibles: ["gens-d-en-bas"] });
  assert.equal(deux.credit, "refuse");
  const max = L.premiereConfiance({ prejuges, cibles: ["zoreils", "gens-d-en-bas"], rumeurs: 4 });
  assert.equal(max.poids, 3, "plafonné");
  assert.equal(max.majoration, 1);
  assert.equal(max.parole, 2);
  assert.equal(L.premiereConfiance({ prejuges: [], rumeurs: 1 }).poids, 1, "une rumeur contre l'inconnu pèse seule");
  const faction = L.premiereConfiance({ prejuges: [], palier: { majoration: 0.5, credit: "refuse" } });
  assert.equal(faction.majoration, 0.5);
  assert.equal(faction.credit, "refuse", "une faction méfiante ne fait pas crédit");
});

test("aucune origine dans les règles : la logique du marché ne lit ni l'enfance, ni le passé, ni l'origine de personne", () => {
  for (const f of ["systems/lakour-survie/logique/marche.mjs", "systems/lakour-survie/scripts/api-marche.mjs"]) {
    const code = lire(f).split("\n").filter(l => !/^\s*\/\//.test(l)).join("\n");
    for (const interdit of [/\.enfance\b/, /\.origine\b/, /\.communaute\b/, /\.passe\b/]) assert.doesNotMatch(code, interdit, `${f} : ${interdit}`);
  }
  // La même première confiance, quel que soit le survivant : seuls les préjugés du PNJ et ce que le MJ dit éveillé comptent.
  const a = L.premiereConfiance({ prejuges: [P("chinois", 2)], cibles: ["chinois"] });
  const b = L.premiereConfiance({ prejuges: [P("chinois", 2)], cibles: ["chinois"], enfance: "enfance-chinoise-de-saint-denis" });
  assert.deepEqual(a, b);
});

test("usure : un cran par trois échanges honnêtes, par fête partagée, par démenti ; tombé à zéro ; les autres préjugés restent", () => {
  let p = [P("zoreils", 2), P("malbars", 1)];
  let r = L.userPrejuges(p, { cibles: ["zoreils"], echanges: 2 });
  assert.deepEqual(r.uses, [], "deux échanges ne suffisent pas");
  r = L.userPrejuges(r.prejuges, { cibles: ["zoreils"], echanges: 1 });
  assert.deepEqual(r.uses, ["zoreils"]);
  assert.equal(L.poidsPrejuge(r.prejuges[0]), 1);
  assert.equal(L.poidsPrejuge(r.prejuges[1]), 1, "le préjugé sur une autre cible ne bouge pas");
  r = L.userPrejuges(r.prejuges, { cibles: ["zoreils"], dementi: true });
  assert.deepEqual(r.tombes, ["zoreils"]);
  assert.equal(L.premiereConfiance({ prejuges: r.prejuges, cibles: ["zoreils"] }).poids, 0, "tombé : il ne joue plus");
  p = L.userPrejuges(r.prejuges, { fete: true }).prejuges;
  assert.equal(L.poidsPrejuge(p[1]), 0, "une fête partagée use tous ses préjugés");
  assert.deepEqual(L.normaliserPrejuge({ cible: " x ", poids: 9 }), { cible: "x", poids: 3, dit: "", echanges: 0, fetes: 0, dementis: 0 });
});

// ------------------------------------------------------------------ carnet
test("carnet : crédit au cours, plafond, méfiance, refus, dette qui traîne, rendre (les plus anciennes d'abord)", () => {
  const cours = L.coursDuJour({ phase: "silence", saison: "seche" });
  let c = L.carnetVide({ cle: "thiaw-kine", nom: "La boutique Thiaw-Kine" });
  let r = L.prendreACredit(c, { biens: { nourriture: 6 }, cours, jour: 10 });
  assert.ok(r.ok);
  assert.equal(r.entree.valeur, 6);
  c = r.carnet;
  r = L.prendreACredit(c, { biens: { medicaments: 1 }, cours, jour: 11 });
  assert.ok(!r.ok, "6 + 7,5 dépasse le plafond de 10");
  assert.equal(r.motif.cle, "carnet-plafond");
  assert.equal(L.plafondCredit(c, "groupe", { credit: "moitie" }), 5);
  assert.equal(L.prendreACredit(L.carnetVide(), { biens: { nourriture: 6 }, cours, confiance: { credit: "moitie" } }).ok, false, "méfiant : la moitié du plafond");
  assert.equal(L.prendreACredit(L.carnetVide(), { biens: { nourriture: 1 }, cours, confiance: { credit: "refuse" } }).motif.cle, "carnet-refuse");
  assert.equal(L.prendreACredit(c, { biens: { nourriture: 1 }, cours, jour: 40 }).motif.cle, "carnet-traine", "30 jours plus tard, la dette traîne");
  c = L.prendreACredit(c, { biens: { nourriture: 2 }, cours, jour: 12 }).carnet;
  const rendu = L.rendreAuCarnet(c, { biens: { munitions: 1 }, cours, jour: 13 });
  assert.equal(rendu.paye, 4.5);
  assert.equal(rendu.reste, 3.5);
  assert.equal(rendu.carnet.entrees[0].reste, 1.5, "la plus ancienne d'abord");
  assert.equal(rendu.carnet.entrees[1].reste, 2);
  assert.equal(L.rendreAuCarnet(rendu.carnet, { biens: { medicaments: 1 }, cours }).surplus, 4, "le surplus est rendu à part");
  assert.equal(L.dettesQuiTrainent(rendu.carnet, 41).length, 1, "l'entrée du jour 10 traîne au jour 41");
  const efface = L.effacerDettes(rendu.carnet, "groupe");
  assert.equal(efface.efface, 3.5);
  assert.equal(L.detteDe(efface.carnet, "groupe"), 0);
});

test("Nouvel An chinois : qui a tout rendu voit sa parole et son plafond grandir ; une dette encore due traîne ; une fois par an ; remises", () => {
  const cours = L.coursDuJour();
  let c = L.carnetVide();
  c = L.prendreACredit(c, { debiteur: "groupe", biens: { nourriture: 4 }, cours, jour: 5 }).carnet;
  c = L.prendreACredit(c, { debiteur: "Payet", biens: { nourriture: 4 }, cours, jour: 5 }).carnet;
  c = L.prendreACredit(c, { debiteur: "Ahamada", biens: { nourriture: 4 }, cours, jour: 5 }).carnet;
  c = L.rendreAuCarnet(c, { debiteur: "groupe", biens: { nourriture: 4 }, cours, jour: 20 }).carnet;
  const r = L.solderAuNouvelAn(c, { annee: 2027, remises: ["Ahamada"] });
  assert.deepEqual(r.soldes, ["groupe"]);
  assert.deepEqual(r.impayees, [{ debiteur: "Payet", reste: 4 }]);
  assert.deepEqual(r.remises, [{ debiteur: "Ahamada", reste: 4 }]);
  assert.equal(L.plafondCredit(r.carnet, "groupe"), 15, "parole tenue : +5");
  assert.equal(L.dettesQuiTrainent(r.carnet, 6).length, 1, "passée le Nouvel An, la dette de Payet traîne tout de suite");
  assert.ok(L.solderAuNouvelAn(r.carnet, { annee: 2027 }).deja, "une seule fois par année");
  let max = L.carnetVide();
  max.parole.groupe = 99;
  assert.equal(L.plafondCredit(max, "groupe"), 30);
});

// ------------------------------------------------------------------ marché forain, trêve, accueil
test("marché forain : jour fixe, foire de trois jours, trêve rompue (rumeur de toute l'île, réputation), litiges, accueil et signature", () => {
  const m = L.creerMarche({ cle: "bourg-murat", nom: "Le marché du samedi à Bourg-Murat", jourSemaine: 6, bastions: ["cooperative-des-plaines", "groupe"] });
  assert.equal(L.dateDuJour(1).semaine, 6, "le jour 1 (5 décembre 2026) est un samedi");
  assert.ok(L.estJourDeMarche(m, 1) && L.estJourDeMarche(m, 8) && !L.estJourDeMarche(m, 2));
  const foire = L.creerMarche({ cle: "lentilles", nom: "La foire des lentilles", foire: true, jour: 10, recolte: "nourriture" });
  assert.ok(L.estJourDeMarche(foire, 10) && L.estJourDeMarche(foire, 12) && !L.estJourDeMarche(foire, 13));
  assert.ok(L.foireFinie(foire, 13));
  const t = L.rompreTreve(m, { par: "groupe", jour: 9 });
  assert.ok(!L.estJourDeMarche(t.marche, 15), "trêve rompue : plus de marché");
  assert.deepEqual(t.reputation, { "cooperative-des-plaines": -3 }, "chaque bastion du conseil, sauf celui qui l'a rompue");
  assert.equal(t.rumeur.portee, "ile");
  assert.equal(t.rumeur.vraie, true);
  assert.ok(L.estJourDeMarche(L.retablirTreve(t.marche), 15));
  assert.deepEqual(L.trancherLitige({ voix: { a: "a", b: "a", c: "b" } }).issue, "a");
  assert.equal(L.trancherLitige({ voix: { a: "a", b: "b" } }).issue, "partage");
  // Accueillir : bruit chaque jour de marché, réputation tous les quatre jours tenus, signature (visibilité) tant qu'on l'accueille.
  let accueil = { ...m, hote: "groupe" };
  const reps = [];
  for (let i = 0; i < 4; i++) { const x = L.tenirJourDeMarche(accueil, { hote: "groupe" }); accueil = x.marche; reps.push(x.reputation); assert.equal(x.bruit, 3); }
  assert.deepEqual(reps.slice(0, 3), [{}, {}, {}]);
  assert.deepEqual(reps[3], { "cooperative-des-plaines": 1 });
  assert.equal(L.signatureDuMarche({ marches: [accueil] }), 2);
  assert.equal(L.signatureDuMarche({ marches: [m] }), 0);
  assert.equal(L.tenirJourDeMarche(m, { hote: "groupe" }).bruit, 0, "un marché qu'on n'accueille pas ne fait pas de bruit chez soi");
});

test("signature : un marché accueilli rend l'abri plus visible (bilanAbri, conditions.signature) ; sans marché, rien ne change", () => {
  const site = L.liste(C.sites)[0];
  const abri = { site: site.cle, region: site.region, stocks: {}, nature: {}, sol: site.sol ?? 0, bruit: 0, degats: 0 };
  const sans = L.bilanAbri(abri, [], C, { jour: 0, personnes: 4 });
  const avec = L.bilanAbri(abri, [], C, { jour: 0, personnes: 4, signature: 2 });
  assert.equal(avec.visibilite, Math.min(10, sans.visibilite + 2));
});

// ------------------------------------------------------------------ Ladi Lafé
test("Ladi Lafé : la rumeur est publique, sa vérité secrète ; elle pèse, s'éteint ; une rumeur vraie ne se dément pas ; un mensonge démenti se retourne", () => {
  let m = L.marcheVide(), s = L.secretMarcheVide();
  const fausse = L.lancerRumeur(m, s, { sujet: "groupe", texte: "Ils ont vendu des vivres gâtés.", vraie: false, malveillant: true, auteur: "Un marchand jaloux", jour: 5 });
  m = fausse.marche; s = fausse.secret;
  assert.equal(fausse.colporteur, "Un marchand jaloux", "colporter du mal a un coût : l'auteur est signalé");
  for (const r of m.rumeurs) for (const k of ["vraie", "auteur", "malveillant"]) assert.ok(!(k in r), `la rumeur publique ne dit pas « ${k} »`);
  assert.deepEqual(s.rumeurs[fausse.rumeur.id], { vraie: false, auteur: "Un marchand jaloux", malveillant: true });
  const vraie = L.lancerRumeur(m, s, { sujet: "groupe", texte: "Ils doivent au carnet.", vraie: true, jour: 6 });
  m = vraie.marche; s = vraie.secret;
  assert.equal(L.rumeursContre(m, "groupe", 10).length, 2);
  assert.equal(L.rumeursContre(m, "groupe", 200).length, 0, "elles s'éteignent");
  assert.equal(L.dementirRumeur(m, s, { id: vraie.rumeur.id }).motif.cle, "rumeur-vraie", "le jeu dit vrai");
  const d = L.dementirRumeur(m, s, { id: fausse.rumeur.id, preuve: "temoin", jour: 9 });
  assert.ok(d.ok);
  assert.equal(d.menteur, "Un marchand jaloux");
  assert.equal(d.rumeur.sujet, "Un marchand jaloux", "une rumeur vraie court maintenant sur le menteur");
  assert.equal(d.secret.rumeurs[d.rumeur.id].vraie, true);
  assert.equal(L.rumeursContre(d.marche, "groupe", 10).length, 1, "la rumeur démentie ne pèse plus");
  assert.equal(L.dementirRumeur(m, s, { id: "r999" }).motif.cle, "rumeur-inconnue");
});

test("objets marqués : la marque tranche, puis les témoins, puis parole contre parole ; le menteur est désigné", () => {
  assert.deepEqual(L.reclamerObjet({ marque: "trois encoches", signeReclamant: "un letchi", signePossesseur: "trois encoches" }), { issue: "au-possesseur", prouve: true, menteur: "reclamant" });
  assert.deepEqual(L.reclamerObjet({ marque: "un letchi", signeReclamant: "un letchi", signePossesseur: "trois encoches" }), { issue: "au-reclamant", prouve: true, menteur: "possesseur" });
  assert.equal(L.reclamerObjet({ temoins: { reclamant: 0, possesseur: 2 } }).menteur, "reclamant");
  assert.equal(L.reclamerObjet({}).issue, "parole-contre-parole");
});

// ------------------------------------------------------------------ la journée du marché
test("journée du marché : jour de marché (fait), accueil (bruit, réputation), dette qui traîne (une rumeur, une fois), Nouvel An chinois, foire finie", () => {
  const cours = L.coursDuJour();
  let marche = { ...L.marcheVide(), marches: [L.creerMarche({ cle: "m", nom: "Le marché du samedi", jourSemaine: 6, bastions: ["ferrailleurs"], hote: "groupe" }),
    L.creerMarche({ cle: "f", nom: "La foire des lentilles", foire: true, jour: 0, duree: 1 })] };
  marche.boutiques = [L.prendreACredit(L.carnetVide({ cle: "b", nom: "La boutique Thiaw-Kine" }), { biens: { nourriture: 3 }, cours, jour: 0 }).carnet];
  let secret = L.secretMarcheVide();
  const j1 = L.journeeDuMarche({ marche, secret, jour: 1 });
  assert.deepEqual(j1.marches, ["m"]);
  assert.equal(j1.bruit, 3);
  assert.ok(j1.faits.some(f => f.cle === "marche-jour"));
  assert.ok(j1.faits.some(f => f.cle === "foire-finie") && !j1.marche.marches.some(m => m.cle === "f"), "la foire d'un jour est finie au jour 1");
  for (const f of j1.faits) assert.ok(L.CLES_TEXTES.includes(f.cle) && f.texte, f.cle);
  marche = j1.marche; secret = j1.secret;
  const j30 = L.journeeDuMarche({ marche, secret, jour: 30 });
  assert.equal(j30.marche.rumeurs.length, 1, "la dette qui traîne nourrit le Ladi Lafé");
  assert.equal(j30.marche.rumeurs[0].cle, "rumeur-dette");
  assert.equal(j30.secret.rumeurs[j30.marche.rumeurs[0].id].vraie, true);
  const j31 = L.journeeDuMarche({ marche: j30.marche, secret: j30.secret, jour: 31 });
  assert.equal(j31.marche.rumeurs.length, 1, "une fois par dette");
  const na = L.journeeDuMarche({ marche: j31.marche, secret: j31.secret, jour: 64, fetes: ["nouvel-an-chinois"] });
  assert.equal(na.soldes.length, 1);
  assert.ok(na.faits.some(f => f.cle === "carnet-nouvel-an"));
  assert.equal(na.marche.boutiques[0].soldeLe, 2027);
  // Quatre samedis accueillis : un point de réputation auprès des Ferrailleurs.
  let x = { marche: L.marcheVide(), secret };
  x.marche.marches = [L.creerMarche({ cle: "m", nom: "M", jourSemaine: 6, bastions: ["ferrailleurs"], hote: "groupe" })];
  let rep = {};
  for (let j = 1; j <= 28; j++) { x = L.journeeDuMarche({ marche: x.marche, secret: x.secret, jour: j }); for (const [b, n] of Object.entries(x.reputation)) rep[b] = (rep[b] ?? 0) + n; }
  assert.deepEqual(rep, { ferrailleurs: 1 });
});

// ------------------------------------------------------------------ événements de marché et simulation
test("événements de marché : tirés selon le stade ; la simulation du monde n'en tire jamais", () => {
  const forain = L.evenementsDeMarche(C, { stade: "forain" });
  const boutique = L.evenementsDeMarche(C, { stade: "boutique" });
  assert.ok(forain.length >= 10 && boutique.length >= 3);
  assert.ok(boutique.every(e => e.stades.includes("boutique")));
  assert.ok(!L.evenementsDeMarche(C, { stade: "boutique", saison: "seche" }).some(e => e.cle === "marche-les-dettes-effacees"), "les dettes effacées suivent un cyclone");
  const cles = new Set(L.liste(C.evenements).filter(e => e.type === "marche").map(e => e.cle));
  let m = L.creerMonde(C, "essai-du-marche-sans-tirage-de-marche-00");
  for (let j = 1; j <= 150; j++) {
    const r = L.simulerJour(m, C, L.hasardDuJour(m.graine, j), j, {});
    m = r.monde;
    for (const f of r.faits) assert.ok(!cles.has(f.params?.evenement) && !cles.has(f.cle), `jour ${j} : ${f.cle}`);
  }
});
