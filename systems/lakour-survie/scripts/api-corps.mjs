// Le corps, le sommeil et l'hygiène dans l'API game.lakourSurvie (lot « corps », contrat §19). La logique est pure
// (logique/corps.mjs, maladies.mjs) ; ici, on l'applique aux documents et à l'état public.
//
// fonctionsCorps(outils) reçoit les aides internes de api.mjs et rend les fonctions à étaler dans game.lakourSurvie :
// - corps()                                          -> le sommeil de chacun, l'hygiène et l'insalubrité de l'abri (lecture)
// - symptomes({ acteurId })                          -> ce que voient les joueurs d'un survivant ; pour un MJ, en plus, les noms
// - bivouac({ pente, ravine, route, … })             -> le jugement d'un endroit pour la nuit, le sommeil qu'on y aura (lecture)
// - dormir({ acteurId | membres, quarts, lieu })     -> un sommeil que le temps n'a pas compté (une sieste, une nuit dans un camion)
// - soignerMorsure({ acteurId, soigneurId, medicament, decoction }) -> le soin d'une morsure, dont l'issue va au MJ seul
// - chute({ acteurId, hauteur, eau, tester, livide }) -> une chute (blessures, fracture, mort) ; livide : ce que devient un Livide
// - menage({ membres, quarts })                      -> le ménage de l'abri (la souillure baisse)
// - parer({ acteurId, touches })                     -> les dés de parade d'un survivant qui tient un bouclier
// - grisConnu({ connu })                             -> le groupe sait (ou ne sait plus) nommer le Gris (il a vu un mordu se relever)
import * as L from "../logique/index.mjs";
import { t, lireEtat, acteur, survivantsDuGroupe, abriCourant, aPlat } from "./donnees.mjs";

export function fonctionsCorps({ ecriture, ouvrirCtx, terminer, noter, tx, jourCtx, contenu, clair, erreur, chat, carteAction, systemeLogique,
  ecrireSurvivant, bilanVivant, mondeMJ, aLAbri, savoirsDuGroupe, testDirect, objetsDe, defDe, estMJ, brasDe, journalSecret, ateliers = null }) {
  const survivantDe = id => {
    const a = acteur(id);
    if (!a || a.type !== "survivant") throw erreur("ActeurInconnu");
    return a;
  };
  const presents = etat => survivantsDuGroupe(etat).filter(a => L.peutAgir(a.system));
  const libelleSommeil = e => t(`LAKOUR_SURVIE.Corps.Sommeil.${e}`);

  // ---------------------------------------------------------------- lectures
  function corps(etat = lireEtat(), monde = mondeMJ()) {
    if (!etat?.demarree) return null;
    const b = monde ? bilanVivant(etat, monde) : etat.bilan ?? null;
    const membres = survivantsDuGroupe(etat).map(a => {
      const s = aPlat(a.system);
      const veille = L.veilleDe(s);
      return { id: a.id, nom: a.name, veille, sommeil: L.etatSommeil(veille), malus: L.malusSommeil(s, L.malusEtat(s).fatigue), vivant: L.peutAgir(s) };
    });
    const ab = abriCourant(etat);
    const abri = b ? {
      hygiene: Number(b.hygiene) || 0, latrines: Number(b.latrines) || 0, toilette: Number(b.toilette) || 0, insalubrite: Number(b.insalubrite) || 0,
      etat: L.ETATS_INSALUBRITE[Number(b.insalubrite) || 0], salubre: L.salubre(b.hygiene, b.insalubrite),
      ...(monde && ab ? { souillure: L.souillureDe(aPlat(ab.system)) } : {})
    } : null;
    return { quart: Number(etat.horloge?.quart) || 0, membres, abri, grisConnu: Boolean(etat.groupe?.grisConnu),
      bivouac: survivantsDuGroupe(etat).some(a => porteBivouac(a)) };
  }
  const porteBivouac = a => objetsDe(a, "equipement").some(i => i.system?.bivouac || defDe("equipements", i.system?.cle)?.bivouac);

  // Ce que voient les joueurs d'un survivant (les savoirs du groupe reconnaissent, ou non) ; un MJ voit en plus les noms et le stade.
  function symptomes({ acteurId = "" } = {}) {
    const a = survivantDe(acteurId);
    const etat = lireEtat();
    const c = contenu();
    const s = systemeLogique(a, mondeMJ());
    const vu = L.ceQueVoientLesJoueurs(s, c, { savoirs: savoirsDuGroupe(etat), grisConnu: Boolean(etat.groupe?.grisConnu), quart: Number(etat.horloge?.quart) || 0 });
    const nommer = cles => L.nomsSymptomes(c, cles);
    const r = {
      acteurId: a.id, nom: a.name,
      maux: vu.maux.map(m => ({ ...m, signes: nommer(m.symptomes) })),
      gris: vu.gris ? { ...vu.gris, signes: nommer(vu.gris.symptomes) } : null,
      morsure: vu.morsure,
      sommeil: L.etatSommeil(L.veilleDe(s))
    };
    if (estMJ()) {
      const idx = L.indexer(c).afflictions;
      r.mj = {
        // moral : ce que le stade coûte, à raconter (la logique ne l'applique pas).
        afflictions: (s.afflictions ?? []).map(x => ({ cle: x.cle, nom: idx.get(x.cle)?.nom ?? x.cle, stade: x.stade, reste: x.reste, moral: L.moralDuStade(idx.get(x.cle), x.stade) })),
        infection: s.infection?.atteint ? { stade: s.infection.stade, depuis: s.infection.depuis } : null
      };
    }
    return r;
  }

  function bivouac(criteres = {}) {
    const j = L.jugerBivouac(criteres ?? {});
    const etat = lireEtat();
    const equipe = survivantsDuGroupe(etat).some(a => porteBivouac(a));
    return { ...j, libelle: t(`LAKOUR_SURVIE.Corps.Bivouac.${j.jugement}`), raisons: j.raisons, textes: j.raisons.map(x => t(`LAKOUR_SURVIE.Corps.Bivouac.Raisons.${x}`)),
      sommeil: L.sommeilAuBivouac(j.jugement, equipe), equipe, rencontre: L.BIVOUAC.rencontre[j.jugement] };
  }

  // ---------------------------------------------------------------- écritures
  async function dormirInterne(ctx, { acteurId = "", membres = [], quarts = 1, lieu = "" } = {}) {
    const qui = [acteurId, membres].flat().filter(Boolean).map(survivantDe);
    if (!qui.length) throw clair(t("LAKOUR_SURVIE.Corps.Erreurs.Personne"));
    const ab = abriCourant(ctx.etat);
    const ou = L.LIEUX_SOMMEIL.includes(lieu) ? lieu : ab && aLAbri(ctx.etat, ab) ? "abri" : survivantsDuGroupe(ctx.etat).some(porteBivouac) ? "bivouac" : "sol";
    const n = Math.max(1, Math.min(8, Math.floor(Number(quarts) || 1)));
    const defs = contenu().afflictions;
    const sortie = [];
    for (const a of qui) {
      const s = systemeLogique(a, ctx.monde);
      if (!L.peutAgir(s)) continue;
      const apres = L.dormir(s, { quarts: n, lieu: ou, insomnie: L.insomnieDe(s, defs) });
      await ecrireSurvivant(a, { veille: apres.veille }, ctx);
      sortie.push({ acteurId: a.id, veille: L.veilleDe(apres), sommeil: L.etatSommeil(L.veilleDe(apres)) });
    }
    noter(ctx, tx("Corps.Journal.Dort", { noms: qui.map(a => a.name).join(", "), n, lieu: t(`LAKOUR_SURVIE.Corps.Lieux.${ou}`) }));
    return { lieu: ou, quarts: n, survivants: sortie };
  }

  // Le soin d'une morsure (§1.3) : la difficulté et les dés de difficulteMorsure / bonusMorsure ; le test va au MJ seul (carte
  // secrète, journal secret) ; le joueur lit « pansée, on ne saura que plus tard ». medicament, decoction : on y met un médicament
  // (consommé) ou une décoction de zerbaz (une plante, consommée), s'il y en a.
  async function soignerMorsureInterne(ctx, { acteurId = "", soigneurId = "", medicament = true, decoction = true } = {}) {
    const patient = survivantDe(acteurId);
    if (!L.peutAgir(systemeLogique(patient, ctx.monde))) throw clair(t("LAKOUR_SURVIE.Erreurs.HorsEtat", { nom: patient.name }));
    const groupe = presents(ctx.etat);
    const soigneur = soigneurId ? survivantDe(soigneurId)
      : groupe.filter(a => a.id !== patient.id).sort((x, y) => (y.system.competences?.soins?.niveau ?? 0) - (x.system.competences?.soins?.niveau ?? 0))[0] ?? patient;
    if (!L.peutAgir(systemeLogique(soigneur, ctx.monde))) throw clair(t("LAKOUR_SURVIE.Erreurs.HorsEtat", { nom: soigneur.name }));
    const ab = abriCourant(ctx.etat);
    const ici = Boolean(ab && aLAbri(ctx.etat, ab));
    const stocks = ab ? aPlat(ab.system).stocks : { ...(ctx.etat.groupe.porte ?? {}) };
    const med = Boolean(medicament) && (Number(stocks.medicaments) || 0) > 0;
    const dec = Boolean(decoction) && (Number(stocks.plantes) || 0) >= L.DECOCTION.plantes;
    const retrait = { ...(med ? { medicaments: 1 } : {}), ...(dec ? { plantes: L.DECOCTION.plantes } : {}) };
    const restes = L.retirerStocks(stocks, retrait).stocks;
    if (ab) await ab.update({ system: { stocks: restes } }); else ctx.etat.groupe.porte = restes;
    const soins = ici ? Number(bilanVivant(ctx.etat, ctx.monde)?.soins) || 0 : 0;
    const outil = Math.max(0, ...objetsDe(soigneur, "equipement").map(i => Number(i.system?.bonus?.soins) || 0));
    const trousse = objetsDe(soigneur, "equipement").some(i => (i.system?.categorie ?? defDe("equipements", i.system?.cle)?.categorie) === "soin");
    const difficulte = L.difficulteMorsure({ medicament: med, infirmerie: soins > 0, trousse, decoction: dec });
    // L'outil compte déjà dans le test (testDirect) : on n'ajoute que ce qui manque pour atteindre bonusMorsure.
    const bonus = L.bonusMorsure({ medicament: med, decoction: dec, outil, infirmerie: soins }) - Math.min(2, outil);
    const test = await testDirect({ acteurId: soigneur.id, competence: "soins", difficulte, bonus, secret: true, forcable: false,
      titre: t("LAKOUR_SURVIE.Corps.Morsure.Titre", { nom: patient.name }) });
    const quart = Number(ctx.etat.horloge?.quart) || 0;
    const r = L.appliquerMorsure(systemeLogique(patient, ctx.monde), test, quart);
    await ecrireSurvivant(patient, { ...r.system, morsure: { quart } }, ctx);
    noter(ctx, tx("Corps.Journal.Pansee", { nom: patient.name, soigneur: soigneur.name }));
    journalSecret(ctx, tx(r.infecte ? "Corps.Journal.MorsureRatee" : "Corps.Journal.MorsureReussie", { nom: patient.name, soigneur: soigneur.name }));
    await chat(carteAction({ icone: "fa-kit-medical", titre: t("LAKOUR_SURVIE.Corps.Morsure.Titre", { nom: patient.name }),
      lignes: [t("LAKOUR_SURVIE.Corps.Morsure.Qui", { soigneur: soigneur.name }), t("LAKOUR_SURVIE.Corps.Morsure.Pansee")] }));
    return { acteurId: patient.id, soigneurId: soigneur.id, difficulte, medicament: med, decoction: dec, pansee: true,
      ...(estMJ() ? { mj: { reussite: Boolean(test.reussite), infecte: r.infecte } } : {}) };
  }

  async function chuteInterne(ctx, { acteurId = "", hauteur = 0, eau = 0, tester = false, reception = null, livide = false } = {}) {
    const h = Math.max(0, Number(hauteur) || 0);
    if (livide) return { livide: true, ...L.chuteDeLivide({ hauteur: h, eau }) };
    const a = survivantDe(acteurId);
    const s0 = systemeLogique(a, ctx.monde);
    if (!L.peutAgir(s0)) throw clair(t("LAKOUR_SURVIE.Erreurs.HorsEtat", { nom: a.name }));
    const essai = L.chute({ hauteur: h, eau });
    // Se recevoir : un test d'endurance (normal), seulement quand il peut changer quelque chose.
    let test = reception && typeof reception === "object" ? reception : null;
    if (!test && tester && essai.blessures > 0 && essai.blessures < 4) {
      test = await testDirect({ acteurId: a.id, competence: "endurance", difficulte: "normale", titre: t("LAKOUR_SURVIE.Corps.Chute.Reception", { nom: a.name }) });
    }
    const r = L.chute({ hauteur: h, eau, reception: test });
    let s = L.appliquerChute(systemeLogique(a, ctx.monde), r);
    const fracture = r.fracture ? defDe("afflictions", "fracture") : null;
    if (fracture && s.vivant !== false) s = L.contracter(s, fracture, jourCtx(ctx));
    await ecrireSurvivant(a, s, ctx);
    const cle = r.mort ? "ChuteMort" : r.blessures ? (r.fracture ? "ChuteFracture" : "ChuteBlesse") : "ChuteIndemne";
    noter(ctx, tx(`Corps.Journal.${cle}`, { nom: a.name, hauteur: Math.round(h * 10) / 10, n: r.blessures }));
    return { acteurId: a.id, ...r, test: test ? { reussite: Boolean(test.reussite), succes: test.succes } : null, blessuresTotal: s.blessures, vivant: s.vivant !== false };
  }

  async function menageInterne(ctx, { membres = [], quarts = 1 } = {}) {
    const ab = abriCourant(ctx.etat);
    if (!ab) throw clair(t("LAKOUR_SURVIE.Corps.Erreurs.SansAbri"));
    const groupe = presents(ctx.etat);
    const qui = [membres].flat().filter(Boolean).map(x => groupe.find(a => a.id === x || a.name === x)).filter(Boolean);
    const equipe = qui.length ? qui : groupe.slice(0, 1);
    const q = Math.max(1, Math.min(8, Math.floor(Number(quarts) || 1)));
    const bras = brasDe(equipe, jourCtx(ctx));
    const avant = L.souillureDe(aPlat(ab.system));
    const r = L.menage(avant, { quarts: q, bras });
    await ab.update({ system: { souillure: r.souillure } });
    const niveau = L.insalubrite(r.souillure);
    noter(ctx, tx("Corps.Journal.Menage", { noms: equipe.map(a => a.name).join(", "), etat: t(`LAKOUR_SURVIE.Corps.Insalubrite.${L.ETATS_INSALUBRITE[niveau]}`) }));
    return { quarts: q, bras, retire: r.retire, souillure: r.souillure, insalubrite: niveau };
  }

  async function parerInterne(ctx, { acteurId = "", touches = 1 } = {}) {
    const a = survivantDe(acteurId);
    // Lot 6 « ateliers » : un bouclier brisé ne pare plus ; celui qui pare s'use (un usage par parade qui a servi).
    const boucliers = objetsDe(a, "equipement").filter(i => !ateliers?.estCasseItem(i))
      .map(i => ({ item: i, parade: Number(i.system?.parade) || Number(defDe("equipements", i.system?.cle)?.parade) || 0 }));
    const seuil = L.paradeDe(boucliers);
    if (!seuil) throw clair(t("LAKOUR_SURVIE.Corps.Erreurs.SansBouclier", { nom: a.name }));
    const r = L.parer(touches, seuil, Math.random);
    const tenu = boucliers.find(b => b.parade === seuil);
    if (r.parees > 0 && tenu && ateliers) {
      const u = await ateliers.userItem(tenu.item, 1);
      if (u.casse) noter(ctx, tx("Ateliers.Journal.Casse", { nom: a.name, objet: tenu.item.name }));
    }
    await chat(carteAction({ icone: "fa-shield", titre: t("LAKOUR_SURVIE.Corps.Parade.Titre", { nom: a.name }),
      lignes: [t("LAKOUR_SURVIE.Corps.Parade.Des", { des: r.des.join(" ") || "—", seuil }), t("LAKOUR_SURVIE.Corps.Parade.Resultat", { parees: r.parees, passent: r.passent })] }));
    return { acteurId: a.id, seuil, ...r };
  }

  async function grisConnuInterne(ctx, { connu = true } = {}) {
    ctx.etat.groupe = { ...ctx.etat.groupe, grisConnu: Boolean(connu) };
    return { grisConnu: Boolean(connu) };
  }

  const ecrire = fn => ecriture(async (args = {}) => { const ctx = ouvrirCtx(); const r = await fn(ctx, args); await terminer(ctx); return r; });
  return {
    corps: () => corps(),
    symptomes,
    bivouac,
    dormir: ecrire(dormirInterne),
    soignerMorsure: ecrire(soignerMorsureInterne),
    chute: ecrire(chuteInterne),
    menage: ecrire(menageInterne),
    parer: ecrire(parerInterne),
    grisConnu: ecrire(grisConnuInterne)
  };
}
