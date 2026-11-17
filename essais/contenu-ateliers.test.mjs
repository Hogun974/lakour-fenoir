// Lot 6 « Les outils, les ateliers et les recettes » (contrat §24) : le contenu de lakour-fenoir et sa traduction — neuf ateliers de
// métier en trois niveaux, douze gammes d'outils en trois qualités (le bonus suit la règle), les suites, les objets que font les
// recettes, la centaine de recettes ajoutées (bien formées, faisables, sans doublon), leurs plans au registre (un rabais, jamais une
// condition), les ateliers déjà là sur des sites, aucune recette qui devienne une rente au marché (même avec son plan et le meilleur
// atelier), les remèdes et ce qu'ils visent ; tout est traduit dans lakour-fenoir-en.   Lancer : npm run essais
import { test } from "node:test";
import assert from "node:assert/strict";
import { donnees, DOCUMENTS } from "../modules/lakour-fenoir/contenu/index.mjs";
import { INSTALLATIONS_ATELIERS, EQUIPEMENTS_ATELIERS, PLANS_ATELIERS, ATELIERS_DES_SITES, TABLES_ATELIERS, JOURNAL_ATELIERS } from "../modules/lakour-fenoir/contenu/ateliers.mjs";
import { RECETTES_ATELIERS } from "../modules/lakour-fenoir/contenu/recettes-3d.mjs";
import { fabriquer, fabriquerAnglais, lireDictionnaires, verifierDonnees } from "../outils/fabriquer-fenoir.mjs";
import * as L from "../systems/lakour-survie/logique/index.mjs";
import { normaliserContenu } from "../systems/lakour-survie/scripts/registre.mjs";

const D = donnees();
const C = normaliserContenu(D);
const eq = cle => D.equipements.find(e => e.cle === cle);
const PHASES = ["jour-zero", "panique", "effondrement", "silence", "apres"];

test("ateliers : neuf métiers, trois niveaux chacun, le premier niveau tiré de l'île ou de la tôle ; l'atelier de FVTT, la cuisine et la gazinière en servent", () => {
  assert.equal(INSTALLATIONS_ATELIERS.length, 9);
  assert.deepEqual(INSTALLATIONS_ATELIERS.map(i => i.system.metiers[0]).sort(), [...L.METIERS].sort());
  for (const i of INSTALLATIONS_ATELIERS) {
    assert.equal(i.system.niveaux.length, 3, i.system.cle);
    const valeur = n => Object.entries(n.cout).filter(([k]) => k !== "travail").reduce((t, [, q]) => t + q, 0);
    assert.ok(valeur(i.system.niveaux[0]) < valeur(i.system.niveaux[1]) && valeur(i.system.niveaux[1]) < valeur(i.system.niveaux[2]), `${i.system.cle} : des niveaux de plus en plus chers`);
    assert.ok(i.system.niveaux.every(n => n.effets.bras === null), "un atelier ne demande pas de bras à la tâche");
  }
  for (const k of ["coin-du-feu", "etabli", "forge", "vannerie", "couture", "tisanerie"]) assert.ok(INSTALLATIONS_ATELIERS.find(i => i.system.cle === k).system.niveaux[0].cout.ile > 0, `${k} : l'île d'abord`);
  assert.deepEqual(D.installations.find(i => i.cle === "atelier").metiers, ["etabli", "mecanique", "electricite"]);
  assert.deepEqual(D.installations.find(i => i.cle === "cuisine-commune").metiers, ["cuisine"]);
  assert.deepEqual(D.installations.find(i => i.cle === "gaziniere").metiers, ["cuisine"]);
  // Chaque niveau qu'une recette demande existe pour son métier.
  const niveaux = Object.fromEntries(L.METIERS.map(m => [m, Math.max(...D.installations.filter(i => (i.metiers ?? []).includes(m)).map(i => i.niveauMax))]));
  for (const r of D.recettes) {
    const ri = L.requisAtelier(r);
    if (ri?.metier) assert.ok(niveaux[ri.metier] >= ri.niveau, `${r.cle} : ${ri.metier} ${ri.niveau}`);
  }
});

test("outils : douze gammes en trois qualités ; récupération = forgé, fortune = forgé − 1 (jamais sous 0) ; l'existant rangé", () => {
  for (const g of L.GAMMES) {
    for (const q of L.QUALITES) assert.ok(D.equipements.some(e => e.qualite === q && (e.gammes ?? []).includes(g)), `${g} ${q}`);
    const forge = D.equipements.find(e => e.qualite === "forge" && e.gammes?.[0] === g);
    const recup = D.equipements.find(e => e.qualite === "recuperation" && e.gammes?.[0] === g);
    const fortune = D.equipements.find(e => e.qualite === "fortune" && e.gammes?.[0] === g);
    assert.deepEqual(recup.bonus, forge.bonus, `${g} : récupération`);
    for (const [c, n] of Object.entries(forge.bonus)) assert.equal(Number(fortune.bonus?.[c]) || 0, Math.max(0, n - 1), `${g} : fortune, ${c}`);
  }
  // Ce qui existait avant garde ses valeurs (le forgé de FVTT, la lance de fortune) et y gagne sa qualité.
  assert.deepEqual([eq("sabre-a-canne").qualite, eq("sabre-a-canne").bonus.combat], ["forge", 1]);
  assert.deepEqual([eq("couteau").qualite, eq("pelle-pioche").qualite, eq("pied-de-biche").qualite, eq("lance-de-fortune").qualite], ["forge", "forge", "forge", "fortune"]);
  assert.deepEqual(eq("caisse-a-outils").gammes, ["marteau", "pince", "scie"]);
  // Le bouclier de tôle du lot « corps » ne change pas de parade ; le doublé pare sur 4.
  assert.equal(eq("bouclier-de-tole").parade, 5);
  assert.deepEqual([eq("bouclier-double-et-cercle").parade, eq("bouclier-double-et-cercle").charge], [4, 3]);
  for (const k of ["fusil-de-chasse-remis-en-etat", "carabine-22-remise-en-etat", "pistolet-de-service-remis-en-etat"]) assert.equal(eq(k).remise, true, k);
  assert.ok(eq("tronconneuse-revisee").bruit < eq("tronconneuse").bruit);
});

test("recettes : une centaine ajoutée, bien formée, faisable (outils et objets qu'on sait faire ou trouver), de sac ou d'atelier, sans doublon", () => {
  assert.ok(RECETTES_ATELIERS.length >= 88, `${RECETTES_ATELIERS.length} recettes`);
  assert.deepEqual(L.verifierContenu(C), []);
  assert.deepEqual(verifierDonnees(D), []);
  const cles = D.recettes.map(r => r.cle), noms = D.recettes.map(r => r.nom);
  assert.equal(new Set(cles).size, cles.length, "clés uniques");
  assert.equal(new Set(noms).size, noms.length, "noms uniques");
  const faits = new Set(D.recettes.filter(r => r.produit?.equipement).map(r => r.produit.equipement));
  const gammesFaites = new Set(D.equipements.filter(e => faits.has(e.cle)).flatMap(e => e.gammes ?? []));
  for (const r of RECETTES_ATELIERS.map(x => ({ ...x.system, nom: x.name }))) {
    assert.ok(Boolean(r.sac) !== Boolean(r.requiert.installation) || (!r.sac && !r.requiert.installation), `${r.cle} : de sac ou d'atelier`);
    for (const g of r.outils ?? []) assert.ok(gammesFaites.has(g), `${r.cle} : l'outil ${g} se fabrique`);
    for (const o of r.objets ?? []) assert.ok(faits.has(o.cle) || D.equipements.some(e => e.cle === o.cle && !e.qualite), `${r.cle} : ${o.cle}`);
  }
  // On commence à mains nues : il existe une chaîne depuis rien (éclat → hache de fortune → charbon → forge).
  const premiers = RECETTES_ATELIERS.filter(r => r.system.sac && !(r.system.outils ?? []).length && !(r.system.objets ?? []).length);
  assert.ok(premiers.some(r => r.system.produit.equipement === "eclat-de-basalte") && premiers.some(r => r.system.produit.equipement === "marteau-de-fortune"));
  // Les déplacements de l'inventaire : bocaux, savon et poêle au coin du feu ; l'alcool désinfectant à la distillerie.
  for (const [k, m] of [["conserves", "cuisine"], ["savon", "cuisine"], ["poele-de-masse", "cuisine"], ["alcool-desinfectant", "distillerie"]]) {
    assert.equal(D.recettes.find(r => r.cle === k).requiert.installation.metier, m, k);
  }
  // Toute recette d'avant sans installation reste faisable n'importe où (de sac).
  for (const k of ["lance", "tisanes", "pansements", "collets", "planche-des-jours", "rimed-lontan"]) assert.equal(D.recettes.find(r => r.cle === k).sac, true, k);
});

test("plans : chaque atelier et les recettes longues ont leur plan au registre, un rabais jamais exigé ; les plans rares se trouvent quelque part", () => {
  for (const p of PLANS_ATELIERS) {
    assert.ok(D.plans.some(x => x.cle === p.cle), p.cle);
    assert.ok(p.installation ? D.installations.some(i => i.cle === p.installation) : D.recettes.some(r => r.cle === p.recette), p.cle);
  }
  for (const i of INSTALLATIONS_ATELIERS) assert.ok(D.plans.some(p => p.installation === i.system.cle), i.system.cle);
  for (const k of ["hache-forgee", "sabre-forge", "regulateur-de-charge", "utilitaire-electrique", "charrette-a-boeufs"]) assert.ok(D.plans.some(p => p.recette === k), k);
  for (const r of D.recettes) assert.ok(!("plan" in (r.requiert ?? {})), r.cle);
  assert.ok(D.plans.find(p => p.cle === "cahier-de-tisanes-de-la-gramoune").couvre.includes("recette:tisane-de-la-gramoune"));
  assert.deepEqual(L.erreursPlans(D), []);
  // Un plan connu fait fabriquer moins cher et plus vite.
  const r = D.recettes.find(x => x.cle === "hache-forgee");
  const avec = L.recetteAvecPlan(r, [L.clePlanRecette("hache-forgee")]);
  assert.ok(avec.travail < r.travail && avec.cout.materiaux <= r.cout.materiaux);
});

test("ateliers déjà là : des forges, des garages, des cuisines de cantine, des alambics sur des sites réels", () => {
  for (const [site, liste] of Object.entries(ATELIERS_DES_SITES)) {
    const s = D.sites.find(x => x.cle === site);
    assert.ok(s, site);
    for (const a of liste) assert.ok(s.installationsDepart.some(x => x.installation === a.installation && x.niveau === a.niveau), `${site} : ${a.installation}`);
  }
  assert.ok(D.sites.find(s => s.cle === "alambic-du-tevelave").installationsDepart.some(x => x.installation === "distillerie"));
});

test("rentes : aucune recette ne rapporte plus de 3 parts par quart, dans aucune phase, avec son plan s'il peut être connu et le meilleur atelier", () => {
  // La borne du lot « marché » (docs/equilibre-marche.md) : au-delà de 3 parts par quart de travail, à l'infini, c'est une rente.
  // Un objet fait à l'atelier vaut le coût de sa recette, sauf s'il a une valeur au barème (les armes remises en état).
  for (const r0 of D.recettes) {
    const planPossible = D.plans.some(p => p.recette === r0.cle || (p.couvre ?? []).includes(L.clePlanRecette(r0.cle))) || (r0.requiert?.savoirs ?? []).length > 0;
    for (const plan of planPossible ? [false, true] : [false]) {
      const r = plan ? L.recetteAvecPlan(r0, [L.clePlanRecette(r0.cle)]) : r0;
      const ri = L.requisAtelier(r);
      const vitesse = ri?.metier ? 1 + 0.5 * Math.min(2, 3 - ri.niveau) : 1;
      for (const phase of PHASES) for (const saison of ["pluies", "seche"]) {
        const c = L.coursDuJour({ phase, saison });
        if (Object.keys(r.cout).some(k => !(k in c))) continue;
        let produit;
        if (r.produit.ressource && r.produit.ressource in c) produit = c[r.produit.ressource] * r.produit.n;
        else if (r.produit.equipement && D.bareme.objets[r.produit.equipement] !== undefined) produit = D.bareme.objets[r.produit.equipement] * r.produit.n;
        else continue;
        const cout = Object.entries(r.cout).reduce((t, [k, q]) => t + q * c[k], 0) + (r.objets ?? []).reduce((t, o) => t + (L.valeurObjet(o.cle, D, c).valeur ?? 0) * (o.n ?? 1), 0);
        const parQuart = (produit - cout) / Math.max(1, L.quartsDeFabrication(r, { vitesse }));
        assert.ok(parQuart <= 3, `${r.cle} (${phase}, ${saison}${plan ? ", plan" : ""}) : ${parQuart} parts par quart`);
      }
    }
  }
});

test("remèdes : chacun vise des maux qui existent ; le bouclier, la lumière, la capeline, les matières et les transports sont bien formés", () => {
  const afflictions = new Set(D.afflictions.map(a => a.cle));
  const remedes = D.equipements.filter(e => e.remede);
  assert.ok(remedes.length >= 9);
  for (const e of remedes) {
    assert.equal(e.categorie, "soin", e.cle);
    for (const a of e.remede.afflictions) assert.ok(afflictions.has(a), `${e.cle} : ${a}`);
    assert.ok(!e.remede.afflictions.includes("gris"), "aucun remède ne guérit du Gris");
  }
  assert.equal(eq("attelle").remede.afflictions[0], "fracture");
  for (const k of ["torche", "lampe-a-huile", "bougies", "lampe-electrique", "frontale"]) assert.equal(eq(k).eclaire, true, k);
  assert.deepEqual(eq("capeline-de-vacoa").protege, ["soleil"]);
  for (const k of ["charbon-de-bois", "sel", "huile-de-bancoul", "rhum-de-canne", "roue-de-bois"]) assert.equal(eq(k).categorie, "matiere", k);
  for (const k of ["charrette-a-bras", "chariot-de-recuperation", "velo-et-remorque", "motoculteur-et-remorque", "utilitaire-electrique", "utilitaire-et-remorque"]) {
    const t = C.equipements.find(e => e.cle === k);
    assert.ok(t.charge > 0 && t.terrains.length && !t.terrains.includes("sentier"), k);
  }
  assert.equal(C.equipements.find(e => e.cle === "utilitaire-electrique").source, "energie");
  assert.equal(D.recettes.filter(r => r.produit.traitement === "eau").length, 2);
});

test("journal, tables, guide : le journal du MJ « Les ateliers et les outils », deux tables, une page du guide ; tout est traduit en anglais", () => {
  assert.equal(JOURNAL_ATELIERS.pages.length, 6);
  assert.equal(TABLES_ATELIERS.length, 2);
  const guide = DOCUMENTS.find(d => d.__cle === "guides:guide-du-joueur");
  assert.ok(guide.pages.some(p => p.name === "Fabriquer et réparer"));
  const { dictionnaire } = lireDictionnaires();
  const { documents: anglais, rapport } = fabriquerAnglais(fabriquer(), D, dictionnaire);
  assert.equal(rapport.restants ?? 0, 0);
  const en = cle => anglais.find(d => d.cle === cle)?.doc;
  for (const doc of [...INSTALLATIONS_ATELIERS, ...EQUIPEMENTS_ATELIERS, ...RECETTES_ATELIERS, JOURNAL_ATELIERS, ...TABLES_ATELIERS]) {
    const d = en(doc.__cle);
    // Les noms : traduits, sauf ceux qui s'écrivent pareil (Forge, Bertel, Vouve, Achards, Torches, Rhum arrangé…).
    assert.ok(d && (d.name !== doc.name || /^(Forge|Bertel|Vouve|Achards|Torches|Rhum arrangé)$/.test(doc.name)), `${doc.__cle} : nom anglais`);
    if (doc.system?.description) assert.notEqual(d.system.description, doc.system.description, `${doc.__cle} : description anglaise`);
  }
  assert.equal(en("equipements:tente-de-vacoa").name, "Vacoa tente");
  assert.match(en("equipements:bouclier-double-et-cercle").system.description, /Pallid/);
  assert.match(en("mj:les-ateliers").pages.find(p => p.name === "Upgrades: restored weapons, doubled shield").text.content, /jams/);
});
