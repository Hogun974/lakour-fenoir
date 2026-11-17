// Les plans dans l'API game.lakourSurvie (lot 4 « Les plans », contrat §21). La logique est pure (logique/plans.mjs) ; ici, on
// l'applique aux documents (les papiers sont des équipements portés par les survivants) et à l'état de la partie (le carnet du
// groupe, `groupe.plans` ; la circulation des copies et l'étagère aux cahiers, `plans` ; le secret des lieux, `monde.plans`).
//
// fonctionsPlans(outils) reçoit les aides internes de api.mjs et rend :
// - api : les fonctions à étaler dans game.lakourSurvie
//   lecture : plans() (le carnet, ce qui est su par cœur, les papiers, l'étagère), valeurPlan({ cle }), lieuxAPlans() (MJ)
//   écriture (MJ actif, monde ouvert) : lieuAPlans({ lieu, membres, quarts }), lirePlan({ objetId }), copierPlan({ cle, acteurId }),
//     enseignerPlan({ acteurId, cle }), rangerPlan({ objetId }), prendrePlan({ id, acteurId }), perdreEtagere({ cause }),
//     donnerPlan({ objetId, contre, a }), recevoirPlan({ cle, acteurId, contre, de }), noterPlan({ cle }), reprendrePlans({ deId, aId })
// - connusDe(etat) : ce que le groupe connaît (construire et fabriquer s'en servent) ;
// - trouverPapier(ctx, acteur, cleRegistre) : un plan trouvé (la fouille « plans ») ;
// - pertesDeBreche(ctx, type) : une brèche faite par des vivants vide une part de l'étagère ;
// - emporterEtagere(ctx) : au déménagement, les papiers de l'étagère partent avec le groupe.
import * as L from "../logique/index.mjs";
import { t, lireEtat, acteur, survivantsDuGroupe, abriCourant, aPlat } from "./donnees.mjs";

export const OBJET_COPIE = "copie-de-plan";

export function fonctionsPlans({ ecriture, ouvrirCtx, terminer, noter, tx, jourCtx, contenu, dateDepart, clair, erreur, chat, carteAction, avancerInterne,
  membresValides, donneesObjet, objetsDe, defDe, hasard, motifsLisibles, savoirsDuGroupe, instancesDe, aLAbri, mondeMJ, texteStocks }) {
  const P = k => `LAKOUR_SURVIE.Plans.${k}`;
  const nomRegion = cle => L.regionDe(contenu(), cle)?.nom ?? cle;
  const vivants = etat => survivantsDuGroupe(etat).filter(a => L.peutAgir(a.system));
  const papierDeLObjet = i => L.papierDe(aPlat(i.system), contenu());
  const papiersDe = a => objetsDe(a, "equipement").filter(i => papierDeLObjet(i).plans.length > 0);
  const nomsPlans = cles => (cles ?? []).map(k => L.nomDuPlan(contenu(), k)).join(", ");
  const aLAbriIci = etat => { const ab = abriCourant(etat); return ab && aLAbri(etat, ab) ? ab : null; };

  // Ce que le groupe connaît : son carnet, ce que ses membres vivants savent par cœur, les plans uniques qu'ils portent, et ceux de
  // l'étagère quand le groupe est à l'abri.
  function connusDe(etat = lireEtat()) {
    const c = contenu();
    const v = vivants(etat);
    const uniques = v.flatMap(a => papiersDe(a).map(papierDeLObjet).filter(p => p.unique).map(p => p.plans));
    if (aLAbriIci(etat)) for (const x of L.plansDeLEtat(etat).etagere) { const p = L.papierDe(x.system, c); if (p.unique) uniques.push(p.plans); }
    return L.plansConnus({ carnet: etat.groupe?.plans ?? [], parCoeur: v.map(a => [...(a.system?.plans ?? [])]), uniques });
  }

  // Un papier neuf sur un acteur : une copie ordinaire, ou l'objet d'un plan unique du registre. -> le document créé
  async function creerPapier(a, { def = null, plans = [], unique = "" } = {}) {
    const c = contenu();
    const base = defDe("equipements", def?.unique ? def.objet : OBJET_COPIE)
      ?? { cle: OBJET_COPIE, nom: t(P("CopieSansNom")), categorie: "livre", description: "", charge: 0 };
    const extra = { plans: [...plans], unique: unique || "" };
    if (def?.unique && (def.enseigne ?? []).length) extra.enseigne = [...def.enseigne];
    const o = await donneesObjet("equipement", base, extra);
    const name = def?.unique ? def.nom : t(P("Copie"), { plan: plans.map(k => L.nomDuPlan(c, k)).join(", ") });
    const [doc] = await a.createEmbeddedDocuments("Item", [{ ...o, name }]);
    return doc ?? null;
  }
  // Lire des plans au carnet : ceux que le groupe sait comprendre (les savoirs de ses membres vivants). -> [clé lue]
  function lireAuCarnet(ctx, plans = []) {
    const savoirs = savoirsDuGroupe(ctx.etat);
    const lus = plans.filter(k => L.peutLirePlan(contenu(), k, savoirs).ok && !(ctx.etat.groupe.plans ?? []).includes(k));
    for (const k of lus) ctx.etat = L.ajouterPlan(ctx.etat, k);
    return lus;
  }
  // Un plan trouvé (fouille, lieu à plans, don d'un PNJ) : le papier au premier, puis la lecture si le groupe la sait.
  async function trouverPapier(ctx, a, cleRegistre) {
    const def = L.planDuRegistre(contenu(), cleRegistre);
    if (!def || !a) return null;
    const plans = L.couvertureDe(def);
    const doc = await creerPapier(a, { def, plans, unique: def.unique ? def.cle : "" });
    const lus = def.unique ? [] : lireAuCarnet(ctx, plans);
    const nom = def.unique ? def.nom : nomsPlans(plans);
    noter(ctx, tx("Plans.Journal.Trouve", { nom: a.name, plan: nom }));
    if (lus.length) noter(ctx, tx("Plans.Journal.Lu", { plans: nomsPlans(lus) }));
    else if (!def.unique) noter(ctx, tx("Plans.Journal.ALire", { plan: nom, savoirs: nomsSavoirs(L.savoirsDuPlan(contenu(), plans[0])) }));
    return { plan: def.cle, nom, unique: Boolean(def.unique), objetId: doc?.id ?? "", lus, acteurId: a.id };
  }
  const nomsSavoirs = cles => (cles ?? []).map(s => defDe("savoirs", s)?.nom ?? s).join(", ");

  // Le papier d'un membre vivant du groupe. -> { porteur, objet }
  function papierDuGroupe(ctx, objetId) {
    for (const a of vivants(ctx.etat)) {
      const o = papiersDe(a).find(i => i.id === objetId);
      if (o) return { porteur: a, objet: o };
    }
    throw clair(t(P("Erreurs.PapierInconnu")));
  }
  // La lumière d'une veillée de lecture ou d'écriture (comme apprendre : 1 énergie si l'abri en a, sinon une bougie, et l'abri se voit).
  async function lumiere(ctx) {
    const ab = aLAbriIci(ctx.etat);
    if (!ab) return null;
    const stocks = aPlat(ab.system).stocks;
    if ((Number(stocks?.energie) || 0) >= 1) { await ab.update({ system: { stocks: L.retirerStocks(stocks, { energie: 1 }).stocks } }); return "energie"; }
    await ab.update({ system: { lumiereLe: jourCtx(ctx) } });
    return "bougie";
  }
  const exigerAbri = ctx => {
    const ab = abriCourant(ctx.etat);
    if (!ab) throw erreur("SansAbri");
    if (!aLAbri(ctx.etat, ab)) throw erreur("PasALAbri");
    return ab;
  };
  // Ce que le groupe paie ou reçoit au troc d'un plan (à l'abri si on y est, sinon dans ce qu'il porte).
  async function regler(ctx, delta = {}, signe = 1) {
    const biens = Object.fromEntries(Object.entries(delta ?? {}).filter(([r, q]) => L.RESSOURCES.includes(r) && Number(q) > 0).map(([r, q]) => [r, Math.floor(Number(q))]));
    if (!Object.keys(biens).length) return {};
    const ab = aLAbriIci(ctx.etat);
    const stocks = ab ? aPlat(ab.system).stocks : ctx.etat.groupe.porte ?? {};
    let neufs;
    if (signe > 0) neufs = L.ajouterStocks(stocks, biens);
    else {
      if (!L.couvre(stocks, biens)) throw clair(t(P("Erreurs.Contre"), { manque: texteStocks(Object.fromEntries(Object.entries(biens).map(([r, q]) => [r, Math.max(0, q - (Number(stocks?.[r]) || 0))]))) }));
      neufs = L.retirerStocks(stocks, biens).stocks;
    }
    if (ab) await ab.update({ system: { stocks: neufs } }); else ctx.etat.groupe.porte = neufs;
    return biens;
  }

  // ------------------------------------------------------------------ lecture
  function plans(etat = lireEtat()) {
    if (!etat?.demarree) return null;
    const c = contenu();
    const pe = L.plansDeLEtat(etat);
    const carnet = [...(etat.groupe?.plans ?? [])];
    const savoirs = savoirsDuGroupe(etat);
    const fiche = cle => {
      const d = L.planPourCle(c, cle);
      return { cle, nom: L.nomDuPlan(c, cle), rarete: d ? L.rareteCourante(d, pe.circulation) : 0, valeur: d ? L.valeurPlan(d, { circulation: pe.circulation }) : 0,
        lisible: L.peutLirePlan(c, cle, savoirs).ok, manque: L.peutLirePlan(c, cle, savoirs).manque, auCarnet: carnet.includes(cle) };
    };
    const papier = (system, base) => {
      const p = L.papierDe(system, c);
      return { ...base, plans: p.plans.map(fiche), unique: Boolean(p.unique), valeur: L.valeurPapier(c, p, pe.circulation) };
    };
    const ab = abriCourant(etat);
    const etagere = ab ? L.etagereDeLAbri(instancesDe(ab), c) : { places: 0, protege: false, niveau: 0 };
    return {
      carnet: carnet.map(fiche),
      connus: connusDe(etat),
      parCoeur: vivants(etat).filter(a => (a.system?.plans ?? []).length || a.system?.planEnCours)
        .map(a => ({ acteurId: a.id, nom: a.name, plans: (a.system.plans ?? []).map(fiche), enCours: a.system.planEnCours ?? null })),
      papiers: survivantsDuGroupe(etat).flatMap(a => papiersDe(a).map(i => papier(aPlat(i.system), { acteurId: a.id, porteur: a.name, objetId: i.id, nom: i.name }))),
      etagere: pe.etagere.map(x => papier(x.system, { id: x.id, nom: x.name })),
      places: etagere.places, protege: etagere.protege,
      circulation: pe.circulation
    };
  }
  function valeurPlan({ cle = "" } = {}) {
    const c = contenu();
    const def = L.planDuRegistre(c, cle) ?? L.planPourCle(c, cle);
    if (!def) throw clair(t(P("Erreurs.PlanInconnu"), { plan: cle }));
    const circulation = L.plansDeLEtat(lireEtat()).circulation;
    const couvre = L.couvertureDe(def);
    return { cle: def.cle, nom: def.unique ? def.nom : nomsPlans(couvre), couvre, unique: Boolean(def.unique), rarete: L.rareteCourante(def, circulation),
      bornes: [...(def.rarete ?? L.REGLES_PLANS.rarete.defaut)], valeur: L.valeurPlan(def, { circulation }) };
  }
  // Les lieux à plans (MJ) : la fenêtre, quand on peut y revenir, la garde, ce qu'on peut y tirer.
  function lieuxAPlans() {
    const c = contenu();
    const etat = lireEtat();
    const monde = mondeMJ();
    const jour = L.jourDe(etat.horloge?.quart ?? 0);
    const mp = L.plansDuMonde(monde ?? {});
    return L.lieuxAPlansDe(c).map(l => {
      const f = L.fenetreLieu(l, { jour, dateDepart: dateDepart(), cyclones: mp.cyclones, eruption: monde?.eruption ?? null });
      const e = L.etatLieuAPlans(monde ?? {}, l, jour);
      return { cle: l.cle, nom: l.nom, region: l.region, regionNom: nomRegion(l.region), site: l.site ?? "", ici: etat.groupe?.region === l.region && !etat.groupe?.enRoute,
        description: l.description, garde: structuredClone(l.garde), fenetre: l.fenetreTexte ?? "", ouverte: f.ouverte, motifs: f.motifs, prochain: e.prochain, revenir: e.revenir,
        tirage: (l.tirage ?? []).map(x => { const d = L.planDuRegistre(c, x.plan); return { plan: x.plan, nom: d?.unique ? d.nom : nomsPlans(L.couvertureDe(d ?? {})),
          unique: Boolean(d?.unique), sorti: mp.uniques.includes(x.plan), tire: e.tires.includes(x.plan) }; }) };
    });
  }

  // ------------------------------------------------------------------ écriture
  async function lieuAPlansInterne(ctx, { lieu = "", membres = [], quarts = L.REGLES_PLANS.lieu.quarts } = {}) {
    const c = contenu();
    const l = L.lieuAPlansDe(c, lieu);
    if (!l) throw clair(t(P("Erreurs.LieuInconnu"), { lieu }));
    if (ctx.etat.groupe.enRoute || ctx.etat.groupe.region !== l.region) throw clair(t(P("Erreurs.PasIci"), { lieu: l.nom, region: nomRegion(l.region) }));
    const r = L.tirerDuLieu(ctx.monde, c, l, hasard(ctx, "plans"), { jour: jourCtx(ctx), dateDepart: dateDepart(), connus: connusDe(ctx.etat) });
    if (!r.ok) throw clair(t(P("Erreurs.Lieu"), { lieu: l.nom, raisons: motifsLisibles(r) }));
    ctx.monde = r.monde;
    const qui = membresValides(ctx, membres);
    const trouve = r.plan && qui[0] ? await trouverPapier(ctx, qui[0], r.plan) : null;
    noter(ctx, tx(trouve ? "Plans.Journal.Lieu" : "Plans.Journal.LieuRien", { lieu: l.nom, plan: trouve?.nom ?? "" }));
    await chat(carteAction({ icone: "fa-scroll", titre: t(P("Carte")), lignes: [l.nom, t("LAKOUR_SURVIE.Action.Qui", { noms: qui.map(a => a.name).join(", ") || "—" }),
      trouve ? t(P("CarteTrouve"), { plan: trouve.nom }) : t(P("CarteRien"))] }));
    await avancerInterne(ctx, Math.max(1, Math.min(8, Math.round(Number(quarts) || 1))));
    return { lieu: l.cle, plan: trouve?.plan ?? null, nom: trouve?.nom ?? "", unique: Boolean(trouve?.unique), lus: trouve?.lus ?? [], objetId: trouve?.objetId ?? "", prochain: r.prochain };
  }

  async function lirePlanInterne(ctx, { objetId = "" } = {}) {
    const { objet } = papierDuGroupe(ctx, objetId);
    const p = papierDeLObjet(objet);
    if (p.unique) throw clair(t(P("Erreurs.Unique")));
    const savoirs = savoirsDuGroupe(ctx.etat);
    const illisibles = p.plans.filter(k => !L.peutLirePlan(contenu(), k, savoirs).ok).map(k => ({ plan: k, manque: L.peutLirePlan(contenu(), k, savoirs).manque }));
    const lus = lireAuCarnet(ctx, p.plans);
    if (!lus.length) {
      const raisons = illisibles.length ? illisibles.map(x => t(P("Illisible"), { plan: L.nomDuPlan(contenu(), x.plan), savoirs: nomsSavoirs(x.manque) })).join(" ; ") : t(P("DejaAuCarnet"));
      throw clair(t(P("Erreurs.RienALire"), { raisons }));
    }
    noter(ctx, tx("Plans.Journal.Lu", { plans: nomsPlans(lus) }));
    await avancerInterne(ctx, L.REGLES_PLANS.lecture.quarts);
    return { lus, illisibles };
  }

  async function copierPlanInterne(ctx, { cle = "", acteurId = "" } = {}) {
    exigerAbri(ctx);
    const c = contenu();
    if (!L.cibleExiste(c, cle)) throw clair(t(P("Erreurs.PlanInconnu"), { plan: cle }));
    const scribe = acteur(acteurId) ?? vivants(ctx.etat)[0];
    if (!scribe || !vivants(ctx.etat).includes(scribe)) throw erreur("ActeurInconnu");
    // On copie ce qui est au carnet, ou sur une copie ordinaire qu'un membre porte ; jamais un plan unique.
    const surCopie = vivants(ctx.etat).some(a => papiersDe(a).some(i => { const p = papierDeLObjet(i); return !p.unique && p.plans.includes(cle); }));
    if (!(ctx.etat.groupe.plans ?? []).includes(cle) && !surCopie) throw clair(t(P("Erreurs.Copier"), { plan: L.nomDuPlan(c, cle) }));
    const doc = await creerPapier(scribe, { plans: [cle] });
    const lum = await lumiere(ctx);
    noter(ctx, tx("Plans.Journal.Copie", { nom: scribe.name, plan: L.nomDuPlan(c, cle) }));
    await avancerInterne(ctx, L.REGLES_PLANS.copie.quarts);
    return { objetId: doc?.id ?? "", plan: cle, lumiere: lum };
  }

  async function enseignerPlanInterne(ctx, { acteurId = "", cle = "" } = {}) {
    exigerAbri(ctx);
    const eleve = acteur(acteurId);
    if (!eleve || !vivants(ctx.etat).includes(eleve)) throw erreur("ActeurInconnu");
    const sys = { savoirs: savoirsDe(eleve), plans: [...(eleve.system?.plans ?? [])], planEnCours: eleve.system?.planEnCours ?? null };
    const r = L.veilleePlan(sys, { cle, contenu: contenu(), connus: connusDe(ctx.etat) });
    if (!r.ok) throw clair(t(P("Erreurs.Enseigner"), { raisons: motifsLisibles(r) }));
    await eleve.update({ system: { plans: r.system.plans ?? sys.plans, planEnCours: r.system.planEnCours ?? null } });
    const lum = await lumiere(ctx);
    const plan = L.nomDuPlan(contenu(), cle);
    noter(ctx, tx(r.termine ? "Plans.Journal.Appris" : "Plans.Journal.Veillee", { nom: eleve.name, plan, fait: r.fait, requis: r.requis }));
    await avancerInterne(ctx, 1);
    return { fait: r.fait, requis: r.requis, termine: r.termine, lumiere: lum };
  }
  const savoirsDe = a => [...new Set([...(a.system?.savoirs ?? []), ...objetsDe(a, "savoir").map(i => i.system?.cle).filter(Boolean)])];

  async function rangerPlanInterne(ctx, { objetId = "" } = {}) {
    const ab = exigerAbri(ctx);
    const { porteur, objet } = papierDuGroupe(ctx, objetId);
    const pe = L.plansDeLEtat(ctx.etat);
    const place = L.etagereDeLAbri(instancesDe(ab), contenu());
    const d = objet.toObject();
    const r = L.rangerSurEtagere(pe.etagere, { id: foundry.utils.randomID(), name: d.name, img: d.img, system: structuredClone(d.system) }, { places: place.places });
    if (!r.ok) throw clair(t(P("Erreurs.Etagere"), { raison: motifsLisibles({ motifs: [r.motif] }) }));
    ctx.etat.plans = { ...pe, etagere: r.etagere };
    await porteur.deleteEmbeddedDocuments("Item", [objet.id]);
    noter(ctx, tx("Plans.Journal.Range", { papier: d.name }));
    return { id: r.etagere.at(-1).id, places: place.places, ranges: r.etagere.length };
  }
  async function prendrePlanInterne(ctx, { id = "", acteurId = "" } = {}) {
    exigerAbri(ctx);
    const pe = L.plansDeLEtat(ctx.etat);
    const x = pe.etagere.find(p => p.id === id);
    if (!x) throw clair(t(P("Erreurs.EtagereInconnu")));
    const a = acteur(acteurId) ?? vivants(ctx.etat)[0];
    if (!a || !vivants(ctx.etat).includes(a)) throw erreur("ActeurInconnu");
    const [doc] = await a.createEmbeddedDocuments("Item", [{ name: x.name, type: "equipement", img: x.img, system: structuredClone(x.system) }]);
    ctx.etat.plans = { ...pe, etagere: pe.etagere.filter(p => p.id !== id) };
    noter(ctx, tx("Plans.Journal.Pris", { nom: a.name, papier: x.name }));
    return { objetId: doc?.id ?? "", acteurId: a.id };
  }
  async function perdreEtagereInterne(ctx, { cause = "feu" } = {}) {
    if (!L.CAUSES_PERTE.includes(cause)) throw clair(t(P("Erreurs.Cause"), { cause }));
    const ab = abriCourant(ctx.etat);
    if (!ab) throw erreur("SansAbri");
    const pe = L.plansDeLEtat(ctx.etat);
    const r = L.perteEtagere(pe.etagere, { cause, protege: L.etagereDeLAbri(instancesDe(ab), contenu()).protege, hasard: hasard(ctx, "etagere") });
    ctx.etat.plans = { ...pe, etagere: r.etagere };
    if (r.perdus.length) noter(ctx, tx("Plans.Journal.Perte", { cause: t(P(`Causes.${cause}`)), papiers: r.perdus.map(x => x.name).join(", ") }));
    return { perdus: r.perdus.map(x => x.name), restent: r.etagere.length };
  }
  // Une brèche (assaut) : des vivants qui forcent l'abri emportent des papiers de l'étagère (les Livides, rien).
  async function pertesDeBreche(ctx, type = "") {
    if (/horde|livide|pallid/i.test(String(type ?? ""))) return [];
    const pe = L.plansDeLEtat(ctx.etat);
    if (!pe.etagere.length) return [];
    const ab = abriCourant(ctx.etat);
    const r = L.perteEtagere(pe.etagere, { cause: "vol", protege: ab ? L.etagereDeLAbri(instancesDe(ab), contenu()).protege : false, hasard: hasard(ctx, "etagere") });
    ctx.etat.plans = { ...pe, etagere: r.etagere };
    if (r.perdus.length) noter(ctx, tx("Plans.Journal.Perte", { cause: t(P("Causes.vol")), papiers: r.perdus.map(x => x.name).join(", ") }));
    return r.perdus.map(x => x.name);
  }
  // Au déménagement : les papiers de l'étagère (légers) partent avec le premier membre du groupe.
  async function emporterEtagere(ctx) {
    const pe = L.plansDeLEtat(ctx.etat);
    const a = vivants(ctx.etat)[0];
    if (!pe.etagere.length || !a) return 0;
    await a.createEmbeddedDocuments("Item", pe.etagere.map(x => ({ name: x.name, type: "equipement", img: x.img, system: structuredClone(x.system) })));
    ctx.etat.plans = { ...pe, etagere: [] };
    return pe.etagere.length;
  }

  async function donnerPlanInterne(ctx, { objetId = "", contre = {}, a = "" } = {}) {
    const { porteur, objet } = papierDuGroupe(ctx, objetId);
    const c = contenu();
    const p = papierDeLObjet(objet);
    const pe = L.plansDeLEtat(ctx.etat);
    const valeur = L.valeurPapier(c, p, pe.circulation);
    let circulation = pe.circulation;
    // Une copie qui sort du groupe : le plan circule, sa rareté baisse. Un plan unique change de mains, sans plus.
    if (!p.unique) for (const k of p.plans) { const d = L.planPourCle(c, k); if (d) circulation = L.faireCirculer(circulation, d.cle); }
    const recu = await regler(ctx, contre, +1);
    await porteur.deleteEmbeddedDocuments("Item", [objet.id]);
    ctx.etat.plans = { ...L.plansDeLEtat(ctx.etat), circulation };
    noter(ctx, tx("Plans.Journal.Donne", { papier: objet.name, a: a ? t(P("A"), { a }) : "" }));
    return { valeur, recu, circulation };
  }
  async function recevoirPlanInterne(ctx, { cle = "", acteurId = "", contre = {}, de = "" } = {}) {
    const c = contenu();
    const def = L.planDuRegistre(c, cle) ?? L.planPourCle(c, cle);
    if (!def) throw clair(t(P("Erreurs.PlanInconnu"), { plan: cle }));
    const a = acteur(acteurId) ?? vivants(ctx.etat)[0];
    if (!a || !vivants(ctx.etat).includes(a)) throw erreur("ActeurInconnu");
    if (def.unique) {
      const mp = L.plansDuMonde(ctx.monde);
      if (mp.uniques.includes(def.cle)) throw clair(t(P("Erreurs.UniqueSorti"), { plan: def.nom }));
      ctx.monde.plans = { ...mp, uniques: [...mp.uniques, def.cle] };
    }
    const paye = await regler(ctx, contre, -1);
    const plans = L.couvertureDe(def);
    const doc = await creerPapier(a, { def: def.synthetique ? null : def, plans, unique: def.unique ? def.cle : "" });
    const lus = def.unique ? [] : lireAuCarnet(ctx, plans);
    const nom = def.unique ? def.nom : nomsPlans(plans);
    noter(ctx, tx("Plans.Journal.Recu", { nom: a.name, papier: nom, de: de ? t(P("De"), { de }) : "" }));
    if (lus.length) noter(ctx, tx("Plans.Journal.Lu", { plans: nomsPlans(lus) }));
    else if (!def.unique && !plans.every(k => (ctx.etat.groupe.plans ?? []).includes(k))) noter(ctx, tx("Plans.Journal.ALire", { plan: nom, savoirs: nomsSavoirs(L.savoirsDuPlan(c, plans[0])) }));
    return { objetId: doc?.id ?? "", plan: def.cle, nom, lus, paye, valeur: L.valeurPlan(def, { circulation: L.plansDeLEtat(ctx.etat).circulation }) };
  }
  async function noterPlanInterne(ctx, { cle = "" } = {}) {
    if (!L.cibleExiste(contenu(), cle)) throw clair(t(P("Erreurs.PlanInconnu"), { plan: cle }));
    const deja = (ctx.etat.groupe.plans ?? []).includes(cle);
    ctx.etat = L.ajouterPlan(ctx.etat, cle);
    if (!deja) noter(ctx, tx("Plans.Journal.Note", { plan: L.nomDuPlan(contenu(), cle) }));
    return { cle, deja, carnet: [...ctx.etat.groupe.plans] };
  }
  // Les papiers d'un mort (ou de n'importe qui) passent à un membre du groupe : le lot 3 s'en sert pour le corps retrouvé.
  async function reprendrePlansInterne(ctx, { deId = "", aId = "" } = {}) {
    const de = acteur(deId);
    if (!de || de.type !== "survivant") throw erreur("ActeurInconnu");
    const a = acteur(aId) ?? vivants(ctx.etat)[0];
    if (!a || !vivants(ctx.etat).includes(a) || a === de) throw erreur("ActeurInconnu");
    const papiers = papiersDe(de);
    if (!papiers.length) return { repris: [] };
    await a.createEmbeddedDocuments("Item", papiers.map(i => { const d = i.toObject(); delete d._id; return d; }));
    await de.deleteEmbeddedDocuments("Item", papiers.map(i => i.id));
    noter(ctx, tx("Plans.Journal.Repris", { nom: a.name, mort: de.name, papiers: papiers.map(i => i.name).join(", ") }));
    return { repris: papiers.map(i => i.name) };
  }

  const ecrire = fn => ecriture(async (args = {}) => { const ctx = ouvrirCtx(); const r = await fn(ctx, args); await terminer(ctx); return r; });
  return {
    connusDe, trouverPapier, pertesDeBreche, emporterEtagere,
    api: {
      plans: () => plans(), valeurPlan, lieuxAPlans,
      lieuAPlans: ecrire(lieuAPlansInterne),
      lirePlan: ecrire(lirePlanInterne),
      copierPlan: ecrire(copierPlanInterne),
      enseignerPlan: ecrire(enseignerPlanInterne),
      rangerPlan: ecrire(rangerPlanInterne),
      prendrePlan: ecrire(prendrePlanInterne),
      perdreEtagere: ecrire(perdreEtagereInterne),
      donnerPlan: ecrire(donnerPlanInterne),
      recevoirPlan: ecrire(recevoirPlanInterne),
      noterPlan: ecrire(noterPlanInterne),
      reprendrePlans: ecrire(reprendrePlansInterne)
    }
  };
}
