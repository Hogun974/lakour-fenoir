// Lot 8 « Le vivant de l'abri » (contrat §27) : la forme du contenu (espèces, cheptels des installations, installations nouvelles,
// bêtes en liberté, outils de capture, tables, journal et page du guide), ce qui ne change pas (la production de base de ce qui existe),
// et sa traduction anglaise.   Lancer : npm run essais
import { test } from "node:test";
import assert from "node:assert/strict";
import { DOCUMENTS, donnees } from "../modules/lakour-fenoir/contenu/index.mjs";
import { verifierDonnees, fabriquerAnglais } from "../outils/fabriquer-fenoir.mjs";
import { ESPECES, INSTALLATIONS_VIVANT, BETES_SAUVAGES, TABLES_VIVANT, JOURNAL_VIVANT, PAGES_JOUEUR_VIVANT, CAPTURE_DES_EQUIPEMENTS } from "../modules/lakour-fenoir/contenu/vivant.mjs";
import { erreursVivant } from "../systems/lakour-survie/logique/vivant.mjs";
import { VOIES_AUTONOMIE } from "../modules/lakour-fenoir/contenu/installations.mjs";

const D = donnees();
const par = cle => D.installations.find(i => i.cle === cle);
const sans = t => String(t ?? "").replace(/<[^>]+>/g, " ");

test("contenu « vivant » : dix espèces, leurs remèdes et leurs outils ; aucune erreur de forme", () => {
  assert.deepEqual(ESPECES.map(e => e.cle), ["poule", "lapin", "cabri", "cochon", "boeuf-moka", "essaim", "tilapia", "camaron", "anguille", "plants-hors-sol"]);
  assert.deepEqual(D.especes, ESPECES);
  assert.deepEqual(erreursVivant(D), []);
  assert.deepEqual(verifierDonnees(D), []);
  const viande = Object.fromEntries(ESPECES.map(e => [e.cle, e.viande]));
  assert.deepEqual([viande.poule, viande.cabri, viande.cochon, viande["boeuf-moka"]], [1, 6, 10, 20], "les viandes du jeu 3D");
  assert.deepEqual(ESPECES.find(e => e.cle === "tilapia").altitude, [0, 900]);
  assert.deepEqual(ESPECES.find(e => e.cle === "camaron").altitude, [0, 500]);
  for (const e of ESPECES.filter(x => x.capture)) assert.ok(e.capture.outils.some(o => D.equipements.some(q => q.cle === o && (q.capture ?? []).includes(e.cle))), e.cle);
  // Fusion de la vague 3 : les outils de capture n'ont qu'une fiche (celle du lot 6) et une recette ; ce lot dit ce qu'ils prennent.
  for (const cle of ["cage-de-bambou", "sac-de-goni", "enfumoir"]) {
    assert.equal(D.equipements.filter(q => q.cle === cle).length, 1, cle);
    assert.deepEqual(D.equipements.find(q => q.cle === cle).capture, CAPTURE_DES_EQUIPEMENTS[cle], cle);
    assert.equal(D.recettes.filter(r => r.produit?.equipement === cle).length, 1, `une recette pour ${cle}`);
  }
  // Une espèce inconnue sur un cheptel est refusée par le fabricant.
  const mute = structuredClone(D);
  mute.installations.find(i => i.cle === "clapier").niveaux[0].effets.vivant.espece = "dodo";
  assert.ok(verifierDonnees(mute).some(x => /espèce inconnue « dodo »/.test(x)));
});

test("contenu « vivant » : ce qui existe passe sous la règle sans changer sa production de base ; l'eau de ceux qui boivent ; la pluie arrose", () => {
  assert.deepEqual(par("basse-cour").niveaux.map(n => n.effets.production.nourriture), [1, 2]);
  assert.deepEqual(par("enclos-a-cabris").niveaux.map(n => n.effets.production.nourriture), [1, 3]);
  assert.deepEqual(par("bassin-a-tilapias").niveaux.map(n => n.effets.production.nourriture), [1, 3]);
  assert.deepEqual(par("ruches").niveaux.map(n => n.effets.production.nourriture), [1, 1]);
  assert.deepEqual(par("basse-cour").niveaux.map(n => n.effets.consommation.eau), [0.5, 0.5]);
  assert.deepEqual(par("enclos-a-cabris").niveaux.map(n => n.effets.consommation.eau), [1, 1]);
  assert.deepEqual(par("basse-cour").niveaux.map(n => [n.effets.vivant.places, n.effets.vivant.plein]), [[6, 4], [12, 8]]);
  for (const k of ["potager", "jardin-creole", "verger", "jardin-de-zerbaz", "treille-a-chouchou", "bananeraie"]) assert.ok(par(k).niveaux.every(n => n.effets.pluieArrose), k);
  assert.ok(!par("serre").niveaux.some(n => n.effets.pluieArrose), "la serre est couverte");
  // La ferme des Hauts passe l'hiver sec avec le jardin créole, qui boit peu.
  assert.ok(VOIES_AUTONOMIE.find(v => v.cle === "ferme-des-hauts").installations.some(i => i.cle === "jardin-creole"));
});

test("contenu « vivant » : onze installations nouvelles, en sœurs pour le hors-sol ; la soue et l'étable commencent vides ; rien n'est une monture", () => {
  assert.deepEqual(INSTALLATIONS_VIVANT.map(i => i.system.cle), ["clapier", "soue-a-cochons", "etable", "bassin-a-camarons", "aquaponie", "bacs-de-culture",
    "serre-hydroponique", "jardin-de-zerbaz", "treille-a-chouchou", "bananeraie", "carreau-de-canne"]);
  assert.deepEqual(["bacs-de-culture", "serre-hydroponique"].map(k => [par(k).role, par(k).arbre]), [["hors-sol", "lontan"], ["hors-sol", "moderne"]]);
  assert.equal(par("soue-a-cochons").niveaux[0].effets.vivant.depart, 0);
  assert.equal(par("etable").niveaux[0].effets.vivant.depart, 0);
  assert.equal(par("aquaponie").niveaux[0].effets.vivant.sansPompe, 2);
  assert.equal(par("aquaponie").niveaux[0].effets.vivant.filtre, 30);
  assert.equal(par("bananeraie").niveaux[0].effets.conditions.delai, 300);
  assert.equal(par("carreau-de-canne").niveaux[0].effets.conditions.delai, 365);
  assert.equal(par("jardin-de-zerbaz").niveaux[0].effets.production.plantes, 1);
  for (const i of INSTALLATIONS_VIVANT) assert.ok(i.system.niveaux.every(n => n.effets.bras?.tache), i.system.cle);
  const texte = JSON.stringify([...INSTALLATIONS_VIVANT, JOURNAL_VIVANT]);
  assert.ok(!/se monte|monture qu'on|on le monte/.test(texte));
  assert.ok(/ne sont pas des montures/.test(texte));
});

test("contenu « vivant » : les bêtes en liberté (catégorie « bete », sans jeton) ; le cochon marron a son espèce ; tables, journal, page du guide", () => {
  assert.deepEqual(BETES_SAUVAGES.map(b => [b.cle, b.espece]), [["poule-marronne", "poule"], ["lapin-sauvage", "lapin"], ["cabri-marron", "cabri"], ["boeuf-moka-sauvage", "boeuf-moka"]]);
  assert.ok(BETES_SAUVAGES.every(b => b.categorie === "bete" && b.acteur === false));
  assert.ok(!D.creatures.some(c => BETES_SAUVAGES.some(b => b.cle === c.cle)));
  assert.equal(D.bestiaire.find(b => b.cle === "cochon-marron").espece, "cochon");
  assert.ok(!DOCUMENTS.some(d => d.__pack === "bestiaire" && /marronne|cabri-marron/.test(d.__cle ?? "")), "pas d'acteur au compendium");
  assert.ok(DOCUMENTS.includes(JOURNAL_VIVANT) && TABLES_VIVANT.every(t => DOCUMENTS.includes(t)));
  const pages = JOURNAL_VIVANT.pages.map(p => p.flags?.["lakour-fenoir"]?.cle);
  for (const k of ["principe", "regle", "installations", "produits", "trouver", "attirer", "chien", "pour-le-mj"]) assert.ok(pages.includes(k), k);
  assert.equal(TABLES_VIVANT.length, 6);
  const guide = DOCUMENTS.find(d => d.__cle === "guides:guide-du-joueur");
  assert.ok(guide.pages.some(p => p.flags?.["lakour-fenoir"]?.cle === "le-vivant"));
  assert.equal(PAGES_JOUEUR_VIVANT.length, 1);
  const tout = [JOURNAL_VIVANT, ...TABLES_VIVANT].map(d => JSON.stringify(d)).join(" ");
  for (const mot of ["égorg", "sang qui", "viscères", "entrailles"]) assert.ok(!tout.includes(mot), mot);
});

test("traduction « vivant » : espèces, installations, bêtes en liberté, outils, tables, journal et page du guide en anglais", () => {
  const { documents, registre, rapport } = fabriquerAnglais();
  assert.equal(rapport.manquants.length, 0);
  assert.equal(registre.especes.find(e => e.cle === "cabri").nom, "Goat");
  assert.ok(registre.especes.every(e => e.produit !== ESPECES.find(x => x.cle === e.cle).produit), "ce qu'elles donnent, en anglais");
  assert.equal(registre.bestiaire.find(b => b.cle === "poule-marronne").nom, "Feral hen");
  assert.equal(documents.find(d => d.cle === "installations:clapier")?.doc.name, "Rabbit hutch");
  assert.equal(documents.find(d => d.cle === "equipements:sac-de-goni")?.doc.name, "Goni sack");
  const j = documents.find(d => d.cle === "mj:le-vivant")?.doc;
  assert.ok(j && !/ cheptel /.test(sans(JSON.stringify(j.pages))), "le journal du MJ traduit");
  assert.ok(/Pallid/.test(JSON.stringify(j.pages)), "les Livides : the Pallid");
  const t = documents.find(d => d.cle === "tables:betes-de-l-ile-hauts")?.doc;
  assert.equal(t.name, "Animals of the island — the Highlands");
});
