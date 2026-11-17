// Lot 6 « Les outils, les ateliers et les recettes » (contrat §24) : la logique pure (logique/armes.mjs, fabrication.mjs) — qualités,
// usages, casse, réparation de fortune et affûtage, enrayage, qualité d'un outil trouvé ; ateliers de métier (écart de niveau : dés et
// vitesse), recettes de sac, lumière, outils en main, objets consommés, traitement de l'eau, échec qui rend la moitié et garde les
// objets ; remèdes ; valeur d'un objet fait d'objets ; l'eau traitée au bilan de l'abri ; le bouclier doublé.   Lancer : npm run essais
import { test } from "node:test";
import assert from "node:assert/strict";
import * as L from "../systems/lakour-survie/logique/index.mjs";

const des = suite => { let i = 0; return () => (suite[i++ % suite.length] - 1) / 6 + 1e-9; };   // un hasard qui rend ces faces de d6

test("armes : usages par qualité (6, 20, 40), un objet sans qualité ne s'use pas, la casse ôte le bonus", () => {
  assert.deepEqual(L.REGLES_OUTILS.usages, { fortune: 6, recuperation: 20, forge: 40 });
  assert.equal(L.usagesDe({ qualite: "fortune" }), 6);
  assert.equal(L.usagesDe({ qualite: "forge", usages: 25 }), 25, "des usages écrits l'emportent");
  assert.equal(L.usagesDe({ cle: "batte", bonus: { combat: 1 } }), 0);
  assert.equal(L.estCasse({ usure: 99 }), false, "sans usages, rien ne casse");
  const hache = { qualite: "recuperation", gammes: ["hache"], bonus: { bricolage: 1, combat: 1 }, usure: 19 };
  assert.equal(L.bonusOutil(hache, "combat"), 1);
  const u = L.userOutil(hache, 1);
  assert.deepEqual([u.usure, u.casse, u.etat], [20, true, "casse"]);
  assert.equal(L.bonusOutil({ ...hache, usure: 20 }, "combat"), 0, "cassée : plus de bonus");
  assert.equal(L.etatOutil({ ...hache, usure: 10 }), "use");
  assert.equal(L.etatOutil({ ...hache, usure: 3 }), "bon");
  // La définition complète un objet d'avant (sans qualité ni gammes).
  assert.deepEqual(L.gammesDe({ cle: "couteau" }, { gammes: ["couteau"], qualite: "forge" }), ["couteau"]);
  assert.equal(L.usagesDe({ cle: "couteau" }, { qualite: "forge" }), 40);
});

test("armes : réparation de fortune (½, ¼, ⅛ des usages, trois fois au plus) ; affûtage d'une lame (¼, hors compte)", () => {
  const o = { qualite: "forge", gammes: ["hache"], usure: 40, reparations: 0 };
  const r1 = L.reparerOutil(o);
  assert.deepEqual([r1.ok, r1.usure, r1.reparations, r1.rendu], [true, 20, 1, 20]);
  const r2 = L.reparerOutil({ ...o, usure: 40, reparations: 1 });
  assert.equal(r2.usure, 30);
  const r3 = L.reparerOutil({ ...o, usure: 40, reparations: 2 });
  assert.equal(r3.usure, 35);
  assert.equal(L.reparerOutil({ ...o, reparations: 3 }).motif, "outil-trop-repare");
  assert.equal(L.reparerOutil({ ...o, usure: 0 }).motif, "outil-neuf");
  assert.equal(L.reparerOutil({ categorie: "arme-a-feu", usages: 40, usure: 30 }).motif, "outil-arme-a-feu");
  const a = L.affuterOutil({ ...o, usure: 30 });
  assert.deepEqual([a.ok, a.usure], [true, 20]);
  assert.equal(L.affuterOutil({ qualite: "forge", gammes: ["marteau"], usure: 10 }).motif, "outil-pas-une-lame");
  // Une arme à feu ne casse pas : elle s'use.
  const fusil = { categorie: "arme-a-feu", usages: 40, usure: 40 };
  assert.equal(L.estCasse(fusil), false);
  assert.equal(L.estUsee(fusil), true);
});

test("armes : l'enrayage (deux 1 ; trois remise en état ; usée, les 2 comptent) et ses chances à 3 et 4 dés", () => {
  const neuf = { categorie: "arme-a-feu", usages: 40, usure: 0 };
  assert.equal(L.enrayage([1, 1, 5], neuf).enrayee, true);
  assert.equal(L.enrayage([1, 2, 5], neuf).enrayee, false);
  assert.equal(L.enrayage([1, 2, 5], { ...neuf, usure: 20 }).enrayee, true, "usée : le 2 compte");
  assert.equal(L.enrayage([1, 1, 6], { ...neuf, remise: true }).enrayee, false, "remise en état : il faut trois 1");
  assert.equal(L.enrayage([1, 1, 1], { ...neuf, remise: true }).enrayee, true);
  // Le 3D : 3 à 4 % par coup (un échange de tirs de FVTT en compte plusieurs), 1 % remise en état, × 3 usée.
  assert.ok(Math.abs(L.chanceEnrayage(3) - 0.0741) < 0.001);
  assert.ok(Math.abs(L.chanceEnrayage(4) - 0.1319) < 0.001);
  assert.ok(L.chanceEnrayage(3, { remise: true }) < 0.01);
  const usee = L.chanceEnrayage(3, { usee: true }) / L.chanceEnrayage(3);
  assert.ok(usee > 2.5 && usee < 4, `usée : × ${usee}`);
});

test("armes : la qualité d'un outil trouvé (60/30/10 au calme ; 43/36/21 au palier 4) ; les outils en main, le meilleur par gamme", () => {
  const p0 = L.poidsQualiteTrouvee(0), p4 = L.poidsQualiteTrouvee(4);
  assert.deepEqual(p0, { fortune: 6, recuperation: 3, forge: 1 });
  const t4 = p4.fortune + p4.recuperation + p4.forge;
  assert.deepEqual([p4.fortune / t4, p4.recuperation / t4, p4.forge / t4].map(x => Math.round(x * 100)), [43, 36, 21]);
  const h = L.creerHasard("qualites");
  const n = { fortune: 0, recuperation: 0, forge: 0 };
  for (let i = 0; i < 3000; i++) n[L.qualiteTrouvee(0, h)]++;
  assert.ok(Math.abs(n.fortune / 3000 - 0.6) < 0.04 && Math.abs(n.forge / 3000 - 0.1) < 0.03, JSON.stringify(n));
  const enMain = L.outilsEnMain([
    { cle: "marteau-de-fortune", qualite: "fortune", gammes: ["marteau"] },
    { cle: "marteau", qualite: "forge", gammes: ["marteau"] },
    { cle: "hache", qualite: "forge", gammes: ["hache"], usure: 40 },
    { cle: "caisse-a-outils", gammes: ["marteau", "pince", "scie"] }
  ]);
  assert.equal(enMain.get("marteau").cle, "marteau", "le forgé avant le reste");
  assert.equal(enMain.has("hache"), false, "une hache cassée n'est pas en main");
  assert.ok(enMain.has("pince") && enMain.has("scie"));
});

const forge = { cle: "f", nom: "Forger", cout: { materiaux: 2 }, travail: 4, competence: "bricolage", difficulte: "normale",
  requiert: { savoirs: [], installation: { metier: "forge", niveau: 1 } }, outils: ["marteau"], objets: [{ cle: "charbon-de-bois", n: 1 }],
  produit: { equipement: "hache", n: 1 }, bruit: 3 };

test("fabrication : l'atelier du métier (et son niveau), +1 dé et × 1,5 par niveau au-dessus (au plus +2 et × 2) ; l'atelier de FVTT sert d'établi", () => {
  const metiers = { forge: ["forge"], atelier: ["etabli", "mecanique", "electricite"] };
  const stocks = { materiaux: 10 };
  const base = { stocks, metiers, outils: ["marteau"], objets: { "charbon-de-bois": 1 } };
  const sans = L.peutFabriquer(forge, { ...base, installations: [] });
  assert.equal(sans.ok, false);
  assert.ok(sans.motifs.some(m => m.cle === "requiert-atelier" && m.params.metier === "forge"));
  const n1 = L.peutFabriquer(forge, { ...base, installations: [{ cle: "forge", niveau: 1, etat: 0 }] });
  assert.deepEqual([n1.ok, n1.quarts, n1.atelier.ecart, n1.atelier.bonus], [true, 4, 0, 0]);
  const n2 = L.peutFabriquer(forge, { ...base, installations: [{ cle: "forge", niveau: 2, etat: 0 }] });
  assert.deepEqual([n2.quarts, n2.atelier.bonus], [3, 1], "4 quarts ÷ 1,5 : 3");
  const n3 = L.peutFabriquer(forge, { ...base, installations: [{ cle: "forge", niveau: 3, etat: 0 }] });
  assert.deepEqual([n3.quarts, n3.atelier.bonus], [2, 2]);
  const hs = L.peutFabriquer(forge, { ...base, installations: [{ cle: "forge", niveau: 3, etat: 3 }] });
  assert.ok(hs.motifs.some(m => m.cle === "requiert-hors-service"));
  // Les métiers écrits sur l'instance l'emportent ; l'atelier de FVTT sert d'établi.
  const etabli = { ...forge, requiert: { savoirs: [], installation: { metier: "etabli", niveau: 2 } } };
  assert.equal(L.peutFabriquer(etabli, { ...base, installations: [{ cle: "atelier", niveau: 2, etat: 0 }] }).ok, true);
  assert.equal(L.peutFabriquer(etabli, { ...base, installations: [{ cle: "atelier", niveau: 1, etat: 0 }] }).ok, false);
  assert.equal(L.peutFabriquer(etabli, { ...base, metiers: {}, installations: [{ cle: "x", niveau: 2, etat: 0, metiers: ["etabli"] }] }).ok, true);
  // Une recette d'avant (installation par sa clé) marche comme avant, sans écart.
  const avant = { ...forge, outils: [], objets: [], requiert: { savoirs: [], installation: { cle: "atelier", niveau: 1 } } };
  const v = L.peutFabriquer(avant, { stocks, installations: [{ cle: "atelier", niveau: 2, etat: 0 }] });
  assert.deepEqual([v.ok, v.quarts, v.atelier.bonus], [true, 4, 0]);
});

test("fabrication : depuis le sac (hors de l'abri), lumière la nuit, outils en main, objets demandés ; sans options, rien n'est vérifié", () => {
  const sac = { cle: "s", cout: { materiaux: 1 }, travail: 1, competence: "survie", requiert: { savoirs: [] }, sac: true, lumiere: true, outils: ["couteau"], produit: { equipement: "torche", n: 2 } };
  const abri = { ...sac, sac: false };
  assert.equal(L.peutFabriquer(sac, { stocks: { materiaux: 1 }, aLAbri: false, outils: ["couteau"] }).ok, true);
  assert.ok(L.peutFabriquer(abri, { stocks: { materiaux: 1 }, aLAbri: false, outils: ["couteau"] }).motifs.some(m => m.cle === "recette-a-l-abri"));
  assert.ok(L.peutFabriquer(sac, { stocks: { materiaux: 1 }, nuit: true, lumiere: false, outils: ["couteau"] }).motifs.some(m => m.cle === "recette-lumiere"));
  assert.equal(L.peutFabriquer(sac, { stocks: { materiaux: 1 }, nuit: true, lumiere: true, outils: ["couteau"] }).ok, true);
  assert.ok(L.peutFabriquer(sac, { stocks: { materiaux: 1 }, outils: [] }).motifs.some(m => m.cle === "outil-manquant" && m.params.outil === "couteau"));
  assert.equal(L.peutFabriquer(sac, { stocks: { materiaux: 1 } }).ok, true, "le simulateur et les recettes d'avant : rien de neuf n'est vérifié");
  const objets = L.peutFabriquer(forge, { stocks: { materiaux: 9 }, installations: [{ cle: "forge", niveau: 1, etat: 0 }], metiers: { forge: ["forge"] }, outils: ["marteau"], objets: {} });
  assert.ok(objets.motifs.some(m => m.cle === "objet-manquant" && m.params.objet === "charbon-de-bois"));
});

test("fabrication : réussite (objets consommés, outils usés, bruit) ; échec (la moitié rendue, les objets gardés) ; traitement de l'eau", () => {
  const opts = { stocks: { materiaux: 4 }, installations: [{ cle: "forge", niveau: 2, etat: 0 }], metiers: { forge: ["forge"] }, outils: ["marteau"], objets: { "charbon-de-bois": 2 } };
  const ok = L.fabriquer(forge, { ...opts, niveau: 3, hasard: des([6]) });
  assert.equal(ok.test.reussite, true);
  assert.deepEqual(ok.consomme, [{ cle: "charbon-de-bois", n: 1 }]);
  assert.deepEqual(ok.outils, ["marteau"]);
  assert.equal(ok.bruit, 3);
  assert.equal(ok.stocks.materiaux, 2);
  assert.equal(ok.test.reserve, 3 + 1 + 1, "niveau 3, +1 dé de la forge de niveau 2");
  const rate = L.fabriquer(forge, { ...opts, niveau: 0, hasard: des([1]) });
  assert.equal(rate.test.reussite, false);
  assert.deepEqual(rate.consomme, [], "sur un échec, les objets restent");
  assert.equal(rate.stocks.materiaux, 3, "la moitié des matériaux rendue (au supérieur)");
  const eau = { cle: "e", cout: { materiaux: 1 }, travail: 1, competence: "survie", difficulte: "facile", requiert: { savoirs: [], installation: { metier: "cuisine", niveau: 1 } },
    produit: { traitement: "eau", jours: 1 } };
  const b = L.fabriquer(eau, { stocks: { materiaux: 1 }, installations: [{ cle: "cuisine-commune", niveau: 1, etat: 0 }], metiers: { "cuisine-commune": ["cuisine"] }, hasard: des([6]) });
  assert.deepEqual(b.produit, { traitement: "eau", jours: 1 });
});

test("fabrication : la vérification d'une recette (métier, sac et atelier à la fois, outil, objet, traitement)", () => {
  const ctx = { savoirs: new Set(), installations: new Set(["forge"]), equipements: new Set(["hache", "charbon-de-bois"]) };
  assert.deepEqual(L.verifierRecette(forge, ctx), []);
  assert.ok(L.verifierRecette({ ...forge, sac: true }, ctx).some(e => /de sac/.test(e)));
  assert.ok(L.verifierRecette({ ...forge, requiert: { installation: { metier: "boulangerie" } } }, ctx).some(e => /métier/.test(e)));
  assert.ok(L.verifierRecette({ ...forge, outils: ["tournevis"] }, ctx).some(e => /outil inconnu/.test(e)));
  assert.ok(L.verifierRecette({ ...forge, objets: [{ cle: "fantome" }] }, ctx).some(e => /objet demandé/.test(e)));
  assert.ok(L.verifierRecette({ ...forge, produit: { traitement: "air" } }, ctx).some(e => /traitement/.test(e)));
});

test("remèdes : le meilleur pour un mal (celui qui tient lieu d'un médicament d'abord) ; rien pour un autre mal", () => {
  const objets = [
    { cle: "sirop-de-miel", remede: { afflictions: ["dengue"], bonus: 1, remplace: false } },
    { cle: "tisane-de-citronnelle", remede: { afflictions: ["dengue", "chikungunya"], bonus: 1, remplace: true } },
    { cle: "couteau" }
  ];
  assert.equal(L.remedePour("dengue", objets).objet.cle, "tisane-de-citronnelle");
  assert.equal(L.remedePour("dengue", objets).remplace, true);
  assert.equal(L.remedePour("fracture", objets), null);
  const defs = new Map([["attelle", { remede: { afflictions: ["fracture"], bonus: 1, remplace: true } }]]);
  assert.equal(L.remedePour({ cle: "fracture" }, [{ system: { cle: "attelle" } }], defs).bonus, 1, "un objet d'avant lit sa définition");
});

test("marché : un objet fait d'objets vaut aussi ce qu'ils valent ; l'eau traitée au bilan de l'abri jusqu'au jour dit", () => {
  const contenu = { bareme: { objets: {} }, recettes: [
    { cle: "a", cout: { materiaux: 1 }, produit: { equipement: "sel", n: 2 } },
    { cle: "b", cout: { nourriture: 2 }, objets: [{ cle: "sel", n: 2 }], produit: { equipement: "achards", n: 1 } }
  ] };
  const cours = L.coursDuJour();
  assert.equal(L.valeurObjet("sel", contenu, cours).valeur, 1);
  assert.equal(L.valeurObjet("achards", contenu, cours).valeur, 2 + 2);
  const boucle = { recettes: [{ cle: "x", cout: {}, objets: [{ cle: "y" }], produit: { equipement: "x" } }, { cle: "y", cout: {}, objets: [{ cle: "x" }], produit: { equipement: "y" } }] };
  assert.equal(L.valeurObjet("x", boucle, cours).valeur, null, "pas de boucle sans fin");
  const site = { cle: "s", type: "maison", eau: "citerne", sol: 1, soleil: 1, souterrain: 0 };
  const contenuAbri = { sites: [site], installations: [] };
  const abri = { site: "s", stocks: {}, nature: {}, eauTraiteeAvant: 5 };
  assert.equal(L.bilanAbri(abri, [], contenuAbri, { jour: 4 }).eauTraitee, true);
  assert.equal(L.bilanAbri(abri, [], contenuAbri, { jour: 5 }).eauTraitee, false);
  assert.equal(L.bilanAbri({ ...abri, eauTraiteeAvant: 0 }, [], contenuAbri, { jour: 0 }).eauTraitee, false, "un abri d'avant : rien");
});

test("bouclier doublé : il pare sur 4-6 (la moitié), la tôle sur 5-6 (un tiers) ; le meilleur des deux compte", () => {
  assert.equal(L.paradeDe([{ parade: 5 }, { parade: 4 }]), 4);
  const h = L.creerHasard("boucliers");
  let p4 = 0, p5 = 0;
  for (let i = 0; i < 3000; i++) { p4 += L.parer(1, 4, h).parees; p5 += L.parer(1, 5, h).parees; }
  assert.ok(Math.abs(p4 / 3000 - 0.5) < 0.03 && Math.abs(p5 / 3000 - 1 / 3) < 0.03, `${p4} ${p5}`);
});
