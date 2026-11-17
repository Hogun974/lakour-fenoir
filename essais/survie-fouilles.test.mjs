// Lot 5 « fouille » (contrat §25) : la logique pure de logique/fouilles.mjs et son crochet dans fouiller (actions.mjs), avec le VRAI
// contenu de lakour-fenoir : les lieux d'une région, le degré de pillage (jamais vide, il ne redescend pas), le contenu tiré une fois,
// les réserves de la région, le lieu de culte, les bêtes (l'outil, le délai, l'enclos), démonter (un lieu, une installation), la récolte
// des gisements et leur repousse, la vérification du registre.   Lancer : npm run essais
import { test } from "node:test";
import assert from "node:assert/strict";
import * as L from "../systems/lakour-survie/logique/index.mjs";
import { chargerContenu } from "./outils/simuler-parties.mjs";

const contenu = chargerContenu();
const depart = (graine = "fouille-essai", region = "saint-denis") => L.demarrerPartie({ contenu, graine, region, membres: ["a"] });
// Le monde après n jours de simulation (les autres survivants pillent).
function apres(jours, graine = "fouille-essai") {
  let { monde, etat } = depart(graine);
  for (let j = 0; j < jours; j++) monde = L.simulerJour(monde, contenu, L.deriverHasard(graine, "jour", j), j + 1, {}).monde;
  return { monde, etat };
}
const h = (...c) => L.deriverHasard("essai", ...c);

test("les lieux d'une région : selon la population, une part à l'écart ; ni garage, ni station, ni voiture là où ne passe aucune route", () => {
  const sd = L.lieuxDeLaRegion(contenu, "saint-denis"), mafate = L.lieuxDeLaRegion(contenu, "mafate");
  assert.ok(sd.case > mafate.case && sd.pharmacie >= 4 && !mafate.pharmacie);
  for (const g of ["garage", "station-service", "voiture"]) assert.equal(mafate[g], undefined, g);
  assert.ok(mafate["lieu-de-culte"] >= 1 && mafate.ecole >= 1);
  const cases = L.lieuxDuGenre(contenu, "mafate", "case");
  assert.ok(cases.every(l => l.ecart), "Mafate : tout est à l'écart");
  const enVille = L.lieuxDuGenre(contenu, "saint-denis", "case");
  assert.ok(enVille.some(l => l.ecart) && enVille.filter(l => l.ecart).length < enVille.length / 3);
  assert.deepEqual(L.lieuDeCle(contenu, enVille[0].cle), { ...enVille[0], site: "" });
  assert.equal(L.lieuDeCle(contenu, "site:ilet-de-marla")?.genre, "case");
  assert.equal(L.lieuDeCle(contenu, "site:tunnel-du-grand-brule"), null, "un tunnel de lave ne se fouille pas");
});

test("le degré de pillage : rien au jour zéro, il suit la région, la ville plus que l'écart, et se lit en cinq mots", () => {
  const { monde } = depart();
  const reg = L.regionDe(contenu, "saint-denis");
  const ville = L.lieuxDuGenre(contenu, "saint-denis", "maison").find(l => !l.ecart), ecart = L.lieuxDuGenre(contenu, "saint-denis", "maison").find(l => l.ecart);
  assert.ok(L.degrePillage({ graine: monde.graine, lieu: ville, regionDef: reg, regMonde: monde.regions["saint-denis"] }) <= L.REGLES_FOUILLES.pillage.alea);
  const plus = apres(20).monde;
  const dv = L.degrePillage({ graine: plus.graine, lieu: ville, regionDef: reg, regMonde: plus.regions["saint-denis"] });
  const de = L.degrePillage({ graine: plus.graine, lieu: ecart, regionDef: reg, regMonde: plus.regions["saint-denis"] });
  assert.ok(dv >= 0.5, `en ville à J20 : ${dv}`);
  assert.ok(dv - de > 0.1, `l'écart moins pillé (${de}) que la ville (${dv})`);
  assert.deepEqual([0, 0.2, 0.5, 0.7, 0.9].map(L.motDuPillage), ["intact", "a-peine", "deja", "retourne", "sac"]);
  assert.equal(L.prisDeLaRegion(reg, { pillage: {} }), 1);
});

test("fouiller un lieu : le contenu est tiré une fois, la fouille se fait en quarts-personne, puis « plus rien à fouiller »", () => {
  const { monde } = depart();
  const a = L.fouillerLieu(monde, contenu, h(1), { region: "saint-denis", genre: "commerce", membres: 1, quarts: 1 });
  const b = L.fouillerLieu(monde, contenu, h(2), { region: "saint-denis", genre: "commerce", membres: 1, quarts: 1 });
  assert.ok(a.ok && a.cle === b.cle);
  assert.deepEqual(L.lieuxDuMonde(a.monde)[a.cle].lots.length + a.trouve.length >= 1, true);
  const total = l => l.reduce((s, x) => s + x.q, 0);
  const tire = L.visiterLieu(monde, contenu, L.lieuDeCle(contenu, a.cle)).entree.lots;
  assert.equal(total(a.trouve) + total(L.lieuxDuMonde(a.monde)[a.cle].lots), total(tire), "même contenu, partagé entre pris et restant");
  assert.equal(a.lieu.fait, 1);
  assert.equal(a.lieu.fini, false);
  // On reprend où l'on en était, puis c'est fini.
  const c = L.fouillerLieu(a.monde, contenu, h(3), { region: "saint-denis", lieu: a.cle, membres: 3, quarts: 1 });
  assert.ok(c.ok && c.lieu.fini && c.lieu.fait === c.lieu.travail);
  const d = L.fouillerLieu(c.monde, contenu, h(4), { region: "saint-denis", lieu: a.cle });
  assert.equal(d.ok, false);
  assert.equal(d.motif.cle, "lieu-fini");
  // Le genre suivant : on passe au lieu d'après.
  const e = L.fouillerLieu(c.monde, contenu, h(5), { region: "saint-denis", genre: "commerce", membres: 4, quarts: 1 });
  assert.notEqual(e.cle, a.cle);
  // L'allure : vite, plus de travail par quart.
  const vite = L.fouillerLieu(monde, contenu, h(6), { region: "saint-denis", genre: "case", prudence: "rapide" });
  assert.equal(vite.lieu.fait, 1.5);
  assert.equal(vite.bruit, 3);
});

test("ce qui se pille vient des réserves de la région : un lieu ne rend pas ce que la région n'a plus", () => {
  const { monde } = depart();
  const avant = monde.regions["saint-denis"].pillage.nourriture;
  const r = L.fouillerLieu(monde, contenu, h(7), { region: "saint-denis", genre: "commerce", membres: 4, quarts: 1 });
  assert.equal(r.monde.regions["saint-denis"].pillage.nourriture, avant - (r.butin.nourriture ?? 0));
  const vide = structuredClone(monde);
  for (const k of Object.keys(vide.regions["saint-denis"].pillage)) vide.regions["saint-denis"].pillage[k] = 0;
  const s = L.fouillerLieu(vide, contenu, h(8), { region: "saint-denis", genre: "commerce", membres: 4, quarts: 1 });
  assert.ok(s.ok && !(s.butin.nourriture > 1) && !(s.butin.eau > 1), JSON.stringify(s.butin));
});

test("jamais vide : un lieu mis à sac garde au moins un lot, et rend au moins quelque chose", () => {
  const { monde } = apres(60);
  let rien = 0;
  for (let n = 1; n <= 20; n++) {
    const cle = `saint-denis:maison:${n}`;
    const r = L.fouillerLieu(monde, contenu, h("sac", n), { region: "saint-denis", lieu: cle, membres: 2, quarts: 1 });
    assert.ok(r.ok && r.trouve.length >= 1, cle);
    if (!Object.keys(r.butin).length && !r.equipements.length) rien++;
  }
  assert.equal(rien, 0);
  // Le pillage emporte d'abord le convoité.
  const conv = l => l.filter(x => L.valeurObjetTrouve(contenu, x.objet).convoite).length / Math.max(1, l.length);
  const genre = L.genreFouille(contenu, "commerce");
  let a = 0, b = 0;
  for (let i = 0; i < 200; i++) {
    const lots = L.tirerLotsDuLieu(contenu, genre, h("c", i));
    a += conv(lots); b += conv(L.pillerLots(contenu, genre, lots, 0, 0.9, h("p", i)));
  }
  assert.ok(b < a * 0.6, `convoité avant ${a / 200}, après ${b / 200}`);
  // Le degré ne redescend jamais : un lieu vu pillé reste pillé.
  const v = L.visiterLieu(monde, contenu, L.lieuDeCle(contenu, "saint-denis:maison:1"), { jour: 60 }).entree;
  const m2 = { ...structuredClone(monde), lieux: { "saint-denis:maison:1": v } };
  for (const k of Object.keys(m2.regions["saint-denis"].pillage)) m2.regions["saint-denis"].pillage[k] = 9999;
  assert.equal(L.visiterLieu(m2, contenu, L.lieuDeCle(contenu, "saint-denis:maison:1"), { jour: 61 }).entree.degre, v.degre);
});

test("un lieu de culte : ni outil, ni arme, rien de convoité hors l'eau ; un rappel au journal secret, jamais public", () => {
  const g = L.genreFouille(contenu, "lieu-de-culte");
  assert.ok(g.culte);
  assert.ok(g.lots.every(l => !L.valeurObjetTrouve(contenu, l.objet).equipement));
  assert.ok(g.lots.every(l => !L.valeurObjetTrouve(contenu, l.objet).convoite || L.valeurObjetTrouve(contenu, l.objet).ressource === "eau"));
  const { monde, etat } = depart();
  const r = L.fouiller(monde, contenu, h(9), { region: "saint-denis", cible: "lieu", genre: "lieu-de-culte", renseignements: etat.renseignements });
  assert.ok(r.ok && r.culte);
  const f = r.faits.find(x => x.cle === "fouille-culte");
  assert.equal(f.public, false);
  assert.equal(L.ACTES_MORAUX["prendre-au-culte"], -1);
});

test("les bêtes : chance × (1 − degré)² ; l'outil qui les prend ; sans lui elles filent, l'essaim pique", () => {
  const genre = L.genreFouille(contenu, "hangar");
  let n = 0;
  for (let i = 0; i < 400; i++) if (L.tirerBeteDuLieu(contenu, genre, h("b", i))) n++;
  assert.ok(n > 20 && n < 120, `bêtes dans 400 hangars : ${n}`);
  assert.equal(L.prendBete(contenu, ["cage"], "poule"), "cage");
  assert.equal(L.prendBete(contenu, ["cordes-de-choka"], "cabri"), "cordes-de-choka");
  assert.equal(L.prendBete(contenu, ["cage"], "cabri"), null);
  // Un lieu où vit une bête : on force sa présence.
  const { monde } = depart();
  const lieu = L.lieuDeCle(contenu, "mafate:hangar:1");
  const base = L.visiterLieu(monde, contenu, lieu).entree;
  const avec = (bete, equipements) => {
    const m = { ...structuredClone(monde), lieux: { [lieu.cle]: { ...base, bete: { bete, nombre: 2 } } } };
    return L.fouillerLieu(m, contenu, h("bete"), { region: "mafate", lieu: lieu.cle, equipements });
  };
  assert.equal(avec("poule", ["sac-de-goni"]).bete.issue, "prise");
  assert.equal(avec("poule", []).bete.issue, "file");
  const e = avec("essaim", []);
  assert.equal(e.bete.issue, "pique");
  assert.ok(L.lieuxDuMonde(e.monde)[lieu.cle].bete, "l'essaim reste");
  assert.equal(avec("essaim", ["enfumoir"]).bete.issue, "prise");
});

test("une bête prise tient quelques quarts : à l'enclos à temps, sinon elle meurt et l'on mange sa viande (avancer)", () => {
  let { monde, etat } = depart();
  const x = L.ajouterBete(etat, { cle: "cabri", nombre: 1, quart: 0, tient: 2 });
  etat = x.etat;
  assert.equal(L.betesDuGroupe(etat).length, 1);
  const r = L.avancer({ etat, monde, contenu, quarts: 3, survivants: [], abri: null });
  assert.equal(L.betesDuGroupe(r.etat).length, 0);
  assert.equal(r.etat.groupe.porte.nourriture, 6, "un cabri : 6 de nourriture");
  assert.ok(r.etat.journal.some(j => j.cle === "bete-morte"));
  // À l'enclos : il faut l'installation qui la garde.
  const y = L.ajouterBete(etat, { cle: "poule", nombre: 2, quart: 0 });
  assert.equal(L.enclore(y.etat, contenu, y.bete.id, { installations: [] }).motif.cle, "bete-sans-enclos");
  const z = L.enclore(y.etat, contenu, y.bete.id, { installations: [{ cle: "basse-cour", niveau: 1, etat: 0 }], site: "ilet-de-marla" });
  assert.ok(z.ok);
  assert.equal(L.betesDuGroupe(z.etat).find(b => b.id === y.bete.id).jusqua, null);
  assert.equal(L.expirerBetes(z.etat, contenu, 999).mortes.filter(m => m.bete.id === y.bete.id).length, 0, "à l'enclos, elle ne meurt pas de délai");
  const w = L.retirerBete(z.etat, contenu, y.bete.id, { abattre: true });
  assert.equal(w.viande, 2);
});

test("démonter un lieu : il se fouille d'abord, rend la moitié de son coût au fur et à mesure, deux fois plus lent sans outil, puis n'existe plus", () => {
  const { monde } = depart();
  const r = L.demonterLieu(monde, contenu, h(10), { region: "saint-denis", genre: "case", membres: 2, quarts: 3, equipements: ["pied-de-biche"] });
  assert.ok(r.ok && r.fouille && r.lieu.fini, "la fouille d'abord");
  assert.equal(r.lieu.demontage.fait, 4);
  assert.equal(r.rendu.materiaux, Math.floor(12 * 4 / 16));
  const sans = L.demonterLieu(monde, contenu, h(10), { region: "saint-denis", genre: "case", membres: 2, quarts: 3 });
  assert.equal(sans.lieu.demontage.fait, 2);
  const fin = L.demonterLieu(r.monde, contenu, h(11), { region: "saint-denis", lieu: r.cle, membres: 4, quarts: 3, equipements: ["masse"] });
  assert.ok(fin.fini && fin.lieu.demonte);
  assert.equal((r.rendu.materiaux ?? 0) + (fin.rendu.materiaux ?? 0), 12, "la moitié de ce qu'elle a coûté");
  assert.equal(L.fouillerLieu(fin.monde, contenu, h(12), { region: "saint-denis", lieu: r.cle }).motif.cle, "lieu-demonte-deja");
  assert.equal(L.demonterLieu(monde, contenu, h(13), { region: "mafate", site: "ilet-de-marla" }).motif.cle, "lieu-site");
  // Le démontage fait du bruit, donc des rencontres (fouiller, cible « demonter »).
  const f = L.fouiller(monde, contenu, h(14), { region: "saint-denis", cible: "demonter", genre: "maison", membres: 2, quarts: 4 });
  assert.equal(f.bruit, 2);
  assert.ok(f.fouille);
});

test("démonter une installation : la moitié de ses coûts, tous niveaux compris, les matières de l'île en matériaux, un tiers du travail", () => {
  const idx = L.indexer(contenu).installations;
  assert.deepEqual(L.demontageInstallation({ niveau: 2 }, idx.get("palissade")), { rend: { materiaux: 10 }, travail: 10 });
  assert.deepEqual(L.demontageInstallation({ niveau: 1 }, idx.get("panneaux-solaires")), { rend: { materiaux: 1, pieces: 2 }, travail: 2 });
  assert.deepEqual(L.demontageInstallation({ niveau: 2 }, idx.get("palissade-de-bambou")), { rend: { materiaux: 8 }, travail: 10 });
  assert.deepEqual(L.demontageInstallation({ niveau: 0 }, idx.get("mur")).rend, {});
});

test("récolter : les gisements des milieux de la région (bornés par l'altitude), qui repoussent, plus lentement en saison sèche", () => {
  const sd = L.gisementsDeRegion(contenu, "saint-denis");
  assert.ok(sd.bambou > 0 && sd.galets > 0);
  assert.equal(L.gisementsDeRegion(contenu, "fournaise").bambou, undefined, "pas de bambou à 2 300 m");
  const { monde } = depart();
  const r = L.recolterGisement(monde, contenu, h(15), { region: "saint-denis", gisement: "bambou", membres: 2, quarts: 1, jour: 0, equipements: ["sabre-a-canne"] });
  assert.ok(r.ok && r.pris === 4 && r.butin.materiaux >= 2);
  assert.equal(L.gisementsDisponibles(r.monde, contenu, "saint-denis", 0).bambou, sd.bambou - 4);
  assert.equal(L.gisementsDisponibles(r.monde, contenu, "saint-denis", 60).bambou, sd.bambou, "décembre : 60 jours de pluies");
  const sec = L.recolterGisement(monde, contenu, h(16), { region: "saint-denis", gisement: "bambou", membres: 1, quarts: 1, jour: 200 });
  assert.equal(sec.retour, 200 + Math.ceil(60 / 0.4), "saison sèche : 0,4 de la vitesse");
  assert.equal(sec.pris, 1, "sans sabre : deux fois plus lent");
  assert.equal(L.recolterGisement(monde, contenu, h(17), { region: "saint-denis", gisement: "zerbaz" }).motif.cle, "gisement-renvoi");
  const tout = L.recolterGisement(monde, contenu, h(18), { region: "saint-denis", gisement: "coquillages", membres: 8, quarts: 8, jour: 0 });
  assert.equal(L.recolterGisement(tout.monde, contenu, h(19), { region: "saint-denis", gisement: "coquillages", jour: 1 }).motif.cle, "gisement-epuise");
  // Par fouiller : elle ne compte pas comme une fouille de la région.
  const f = L.fouiller(monde, contenu, h(20), { region: "saint-denis", cible: "matieres", membres: 1, quarts: 1 });
  assert.ok(f.ok && !f.fouille && f.faits[0].cle === "recolte");
});

test("fouiller (actions.mjs) : les cibles « lieu », « demonter », « matieres » ; un refus ne fait rien ; les clés de texte sont connues", () => {
  const { monde, etat } = depart();
  const r = L.fouiller(monde, contenu, h(21), { region: "saint-denis", cible: "lieu", genre: "pharmacie", membres: 2, quarts: 1, renseignements: etat.renseignements });
  assert.ok(r.ok && r.fouille && r.lieu.genre === "pharmacie" && r.renseignements["saint-denis"]);
  for (const f of r.faits) assert.ok(L.CLES_TEXTES.includes(f.cle), f.cle);
  const non = L.fouiller(monde, contenu, h(22), { region: "mafate", cible: "lieu", genre: "pharmacie" });
  assert.equal(non.ok, false);
  assert.equal(non.motif.cle, "lieu-aucun");
  assert.equal(non.rencontre, null);
  assert.equal(non.monde, monde);
  // Une fouille de région d'avant ne change pas.
  const avant = L.fouiller(monde, contenu, h(23), { region: "saint-denis", membres: 2, quarts: 1 });
  assert.equal(avant.ok, undefined);
  for (const k of ["fouille-lieu", "demontage-lieu", "lieu-demonte", "fouille-culte", "recolte", "bete-prise", "bete-file", "bete-pique", "bete-morte",
    "lieu-aucun", "lieu-fini", "gisement-renvoi", "gisement-epuise", "bete-sans-enclos"]) assert.ok(L.CLES_TEXTES.includes(k), k);
});

test("le registre : erreursFouilles ne dit rien du vrai contenu et voit un objet ou un genre inconnu", () => {
  assert.deepEqual(L.erreursFouilles(contenu), []);
  const faux = { ...contenu, genresFouille: [{ cle: "x", travail: 0, lots: [{ objet: "licorne", q: [1, 1], chance: 2 }] }], sites: [{ cle: "s", genre: "y" }] };
  const e = L.erreursFouilles(faux).join(" | ");
  assert.match(e, /travail/);
  assert.match(e, /objet inconnu licorne/);
  assert.match(e, /chance/);
  assert.match(e, /genre inconnu y/);
});
