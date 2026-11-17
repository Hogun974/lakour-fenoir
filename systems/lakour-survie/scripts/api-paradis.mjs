// Le paradis et son piège, et « rallumer l'île » dans l'API game.lakourSurvie (lot 9, contrat §28). La logique est pure
// (logique/paradis.mjs) ; ici, on l'applique aux documents, à l'état public et au monde secret.
//
// fonctionsParadis(outils) reçoit les aides internes de api.mjs et rend les fonctions à étaler dans game.lakourSurvie :
// Lecture :
// - paradis()                                   -> ce que coûte de garder le paradis : le signe de la chaleur (et, au MJ, la chaleur et
//                                                  les agglutinés), la ronde, les corps, sous terre, l'air, le prix du paradis
// - ile()                                       -> rallumer l'île : chaque région (rallumée, éteinte, ce qui manque là où l'on tient un
//                                                  abri), les chantiers de région, les jalons
// Écriture (MJ actif, monde ouvert) :
// - ronde({ membres, abattus, livides })        -> une ronde jouée maintenant (en scène : abattus donné ; sinon, tirée)
// - traiterCorps({ action: "enterrer" | "bruler", membres, quarts }) -> enterrer ou brûler les corps des Livides abattus
// - leurre({ membres })                         -> un camp leurre loin de l'abri (la chaleur baisse ; au retour, un test de discrétion)
// - chaleur({ delta, valeur, agglutines })      -> le MJ corrige la chaleur du lieu (une scène bruyante, un incendie)
// - sousTerre({ vit })                          -> le groupe vit sous terre (true), dehors (false), selon le site (null)
// - rallumer({ region, action: "declarer" | "eteindre" }) -> le MJ déclare une région rallumée (une communauté alliée) ou éteinte
// - chantierRegion({ cle, membres, quarts, aide, retirer }) -> travailler à un grand chantier de région, ou y ajouter un allié
import * as L from "../logique/index.mjs";
import { t, lireEtat, acteur, survivantsDuGroupe, abriCourant, aPlat, localiser } from "./donnees.mjs";

export function fonctionsParadis({ ecriture, ouvrirCtx, terminer, noter, alerter, tx, jourCtx, contenu, clair, erreur, chat, carteAction, systemeLogique,
  ecrireSurvivant, bilanVivant, mondeMJ, aLAbri, testDirect, objetsDe, defDe, estMJ, brasDe, journalSecret, avancerInterne }) {
  const P = k => `LAKOUR_SURVIE.Paradis.${k}`;
  const presents = etat => survivantsDuGroupe(etat).filter(a => L.peutAgir(a.system));
  const equipeDe = (etat, membres = []) => {
    const groupe = presents(etat);
    const qui = [membres].flat().filter(Boolean).map(x => groupe.find(a => a.id === x || a.name === x)).filter(Boolean);
    return qui.length ? qui : groupe.slice(0, 1);
  };
  const exigerAbri = (ctx, { ici = true } = {}) => {
    const ab = abriCourant(ctx.etat);
    if (!ab) throw clair(t(P("Erreurs.SansAbri")));
    if (ici && !aLAbri(ctx.etat, ab)) throw clair(t(P("Erreurs.PasALAbri")));
    return ab;
  };
  const nomRegion = r => L.regionDe(contenu(), r)?.nom ?? r;

  // ---------------------------------------------------------------- lectures
  function paradis(etat = lireEtat(), monde = mondeMJ()) {
    if (!etat?.demarree) return null;
    const ab = abriCourant(etat);
    const c = contenu();
    const jour = L.jourDe(etat.horloge?.quart ?? 0);
    const b = ab ? (monde ? bilanVivant(etat, monde) : etat.bilan ?? null) : null;
    const s = ab ? aPlat(ab.system) : null;
    const site = s ? L.siteDe(c, s.site) : null;
    const membres = survivantsDuGroupe(etat);
    const sousTerre = Boolean(s && L.vitSousTerre(s, site ?? {}, ab ? objetsDe(ab, "installation").map(i => ({ cle: i.system?.cle, niveau: Number(i.system?.niveau) || 0 })) : []));
    const altitude = L.regionDe(c, s?.region)?.altitude ?? 0;
    const corps = s ? L.corpsDe(s) : [];
    const signe = s?.signeChaleur || "oublie";
    const rondiers = membres.filter(a => L.peutAgir(a.system) && a.system.tache === L.TACHE_RONDE).map(a => a.name);
    const savoirs = L.autonomieComplete({ autonome: etat.autonome, savoirs: [...new Set(membres.flatMap(a => systemeLogique(a).savoirs ?? []))], contenu: c });
    const r = {
      quart: Number(etat.horloge?.quart) || 0,
      abri: s ? {
        nom: ab.name, site: s.site, region: s.region, signe, signeTexte: t(P(`Signes.${signe}`)),
        corps: L.totalCorps(corps), corpsFrais: Math.round(L.corpsFrais(corps, { jour, altitude }) * 10) / 10,
        rondeLe: s.rondeLe ?? null, rondesManquees: Number(s.rondesManquees) || 0, fumee: L.fumeeDuJour(s, jour) > 0,
        sousTerre, air: s.air || "bon", airTexte: t(P(`Air.${s.air || "bon"}`)), puits: L.puitsDe(b ?? {})
      } : null,
      rondiers,
      membres: membres.filter(a => L.peutAgir(a.system)).map(a => { const j = L.sousTerreDe(aPlat(a.system)).jours; return { id: a.id, nom: a.name, joursSansSoleil: j, palier: L.palierSousTerre(j) }; }),
      prix: L.prixDuParadis({ autonome: etat.autonome, complete: savoirs?.complete ?? false, rondiers: rondiers.length, corps: L.totalCorps(corps),
        sousTerre: sousTerre ? 1 : 0, membres: membres.filter(a => L.peutAgir(a.system)).length })
    };
    if (estMJ() && monde && s) {
      const lieu = L.lieuRefroidi(L.lieuDe(monde, s.site), jour);
      r.mj = { chaleur: lieu.chaleur, agglutines: lieu.agglutines, leurreLe: lieu.leurreLe, seuil: L.REGLES_PARADIS.chaleur.seuilRonde,
        arrivants: Math.round(Math.max(0, lieu.chaleur - L.REGLES_PARADIS.flux.seuil) * L.REGLES_PARADIS.flux.parChaleur * 100) / 100 };
      r.prix = { ...r.prix, mot: L.motChaleur(lieu.chaleur, lieu.agglutines) };
    }
    return r;
  }

  // Les bandes d'infestation des renseignements, en nombre (ce que croit le groupe) : pour juger « plus dense » sans le monde.
  const INFESTATION_CONNUE = { calme: 0.5, presente: 1.5, dense: 3, grouillante: 4.5 };
  function ile(etat = lireEtat(), monde = mondeMJ()) {
    if (!etat?.demarree) return null;
    const c = contenu();
    const jour = L.jourDe(etat.horloge?.quart ?? 0);
    const ab = abriCourant(etat);
    const s = ab ? aPlat(ab.system) : null;
    const reg = L.ileDe(etat);
    const mj = estMJ() && Boolean(monde);
    const b = s ? (monde ? bilanVivant(etat, monde) : etat.bilan ?? null) : null;
    const tenues = new Set([...(s ? [s.region] : []), ...(etat.communautes ?? []).filter(x => x?.region && x?.abri).map(x => x.region)]);
    const regions = L.regionsDe(c).map(r => {
      const x = reg.regions[r.cle] ?? null;
      const ligne = { cle: r.cle, nom: r.nom, etat: x?.etat ?? "noire", etatTexte: t(P(`Regions.${x?.etat ?? "noire"}`)), depuis: x?.depuis ?? null, ombreLe: x?.ombreLe ?? null,
        repere: r.repere ?? null };
      if (tenues.has(r.cle) || x) {
        const connue = INFESTATION_CONNUE[etat.renseignements?.[r.cle]?.infestation];
        const infestation = mj ? Number(monde.regions?.[r.cle]?.infestation) || 0 : connue ?? 0;
        const cond = L.conditionsReprise(etat, c, r.cle, { jour, abri: s, infestation, lumiereAbri: L.lumiereDeLAbri(b) });
        ligne.conditions = { ...cond, lieux: cond.lieux.map(l => ({ ...l, nom: L.siteDe(c, l.site)?.nom ?? l.site })),
          manqueTextes: cond.manque.map(k => t(P(`Manque.${k}`))), infestationConnue: mj || connue !== undefined };
        if (!mj) delete ligne.conditions.infestation;
      }
      return ligne;
    });
    const chantiers = L.chantiersDuContenu(c).map(d => {
      const x = reg.chantiers[d.cle] ?? {};
      return { cle: d.cle, nom: d.nom, region: d.region, regionNom: nomRegion(d.region), type: d.type, description: d.description, cout: d.cout ?? {},
        requiert: d.requiert ?? {}, effets: d.effets ?? {}, affaires: d.affaires ?? [], fait: Number(x.fait) || 0, requis: Number(x.requis) || Number(d.travail) || 0,
        fini: L.chantierFini(etat, d.cle), finiLe: x.finiLe ?? null, aides: x.aides ?? [], ouvert: x.debut !== undefined && x.debut !== null };
    });
    const jalons = L.jalonsDe(etat).map(j => ({ ...j, texte: localiser(L.texteJalon(j.cle, j.params ?? {})) }));
    return { jour, regions, chantiers, jalons, rallumees: L.regionsRallumees(etat).length, total: regions.length };
  }

  // ---------------------------------------------------------------- écritures
  // Une ronde jouée maintenant. abattus (une scène jouée à la main) : combien sont tombés, et livides : combien il y en avait ;
  // sinon, la logique tire la ronde comme chaque jour (rondeDuJour), avec les blessures et les morsures.
  async function rondeInterne(ctx, { membres = [], abattus = null, livides = null } = {}) {
    const ab = exigerAbri(ctx);
    const equipe = equipeDe(ctx.etat, membres);
    const jour = jourCtx(ctx);
    const s = aPlat(ab.system);
    const lieu = L.lieuRefroidi(L.lieuDe(ctx.monde, s.site), jour);
    const presentsN = livides === null || livides === undefined ? lieu.agglutines : Math.max(0, Math.floor(Number(livides) || 0));
    let r;
    if (abattus !== null && abattus !== undefined) {
      const tues = Math.max(0, Math.min(presentsN, Math.floor(Number(abattus) || 0)));
      r = { faite: true, engagee: true, livides: presentsN, abattus: tues, restants: presentsN - tues, blessures: [], trouvaille: 0 };
    } else {
      const defs = L.indexer(contenu()).equipements;
      const rondiers = equipe.map(a => ({ id: a.id, nom: a.name, system: systemeLogique(a, ctx.monde),
        parade: L.paradeDe(objetsDe(a, "equipement").map(i => ({ parade: i.system?.parade ?? defs.get(i.system?.cle)?.parade }))) }));
      r = L.rondeDuJour({ rondiers, livides: presentsN, hasard: L.hasardParadis(ctx.monde.graine, `ronde-jouee|${ctx.etat.horloge.quart}`, jour) });
    }
    const chaleur = Math.max(0, lieu.chaleur - L.REGLES_PARADIS.chaleur.parAbattu * r.abattus - (r.engagee ? L.REGLES_PARADIS.chaleur.parRonde : 0));
    ctx.monde = L.avecLieu(ctx.monde, s.site, { ...lieu, chaleur, agglutines: r.restants, le: jour });
    await ab.update({ system: { rondeLe: jour, rondesManquees: 0, corps: L.ajouterCorps(L.corpsDe(s), { jour, n: r.abattus }) } });
    const morsures = [];
    for (const bl of r.blessures ?? []) {
      const a = acteur(bl.id);
      if (!a) continue;
      const sys = systemeLogique(a, ctx.monde);
      await ecrireSurvivant(a, { ...sys, blessures: Math.min(4, (Number(sys.blessures) || 0) + bl.n) }, ctx);
      if (bl.morsure) { morsures.push(a.id); alerter(ctx, "morsure", tx("alerte-ronde-morsure", { nom: a.name })); }
    }
    const noms = equipe.map(a => a.name).join(", ");
    noter(ctx, tx("ronde-jouee", { noms, abattus: r.abattus, restants: r.restants }));
    await chat(carteAction({ icone: "fa-person-walking-dashed-line-arrow-right", titre: t(P("Ronde.Titre")), lignes: [
      t(P("Ronde.Ligne"), { noms, abattus: r.abattus, restants: r.restants }),
      ...(r.blessures ?? []).map(bl => t(P(bl.morsure ? "Ronde.Morsure" : "Ronde.Blesse"), { nom: acteur(bl.id)?.name ?? bl.nom }))] }));
    return { abattus: r.abattus, restants: r.restants, livides: r.livides, morsures, trouvaille: r.trouvaille ?? 0, ...(estMJ() ? { chaleur: Math.round(chaleur * 100) / 100 } : {}) };
  }

  async function corpsInterne(ctx, { action = "enterrer", membres = [], quarts = 1 } = {}) {
    const ab = exigerAbri(ctx);
    const bruler = action === "bruler";
    const s = aPlat(ab.system);
    const corps = L.corpsDe(s);
    if (!L.totalCorps(corps)) throw clair(t(P("Erreurs.SansCorps")));
    const equipe = equipeDe(ctx.etat, membres);
    const q = Math.max(1, Math.min(8, Math.floor(Number(quarts) || 1)));
    const bras = brasDe(equipe, jourCtx(ctx));
    const bois = L.boisDisponible(s);
    if (bruler && bois < 1) throw clair(t(P("Erreurs.SansBois")));
    const r = L.traiterCorps(corps, { action: bruler ? "bruler" : "enterrer", quarts: q, bras, bois });
    const maj = { corps: r.corps };
    if (bruler) { maj.fumeeLe = jourCtx(ctx); maj.nature = L.prendreIle(s.nature, r.bois); }
    await ab.update({ system: maj });
    noter(ctx, tx(bruler ? "corps-brules" : "corps-enterres", { noms: equipe.map(a => a.name).join(", "), n: r.traites }));
    return { action: bruler ? "bruler" : "enterrer", traites: r.traites, restent: L.totalCorps(r.corps), bois: r.bois, fumee: r.fumee };
  }

  // Un camp leurre : deux quarts, un matériau ; au retour, un test de discrétion (normale) du meilleur : raté, le leurre ne trompe
  // qu'à moitié et l'on a été vus (au MJ d'en tirer une rencontre).
  async function leurreInterne(ctx, { membres = [] } = {}) {
    const ab = exigerAbri(ctx);
    const s = aPlat(ab.system);
    if ((Number(s.stocks?.materiaux) || 0) < 1) throw clair(t(P("Erreurs.SansMateriaux")));
    const equipe = equipeDe(ctx.etat, membres);
    const meilleur = [...equipe].sort((x, y) => (y.system.competences?.discretion?.niveau ?? 0) - (x.system.competences?.discretion?.niveau ?? 0))[0];
    const test = await testDirect({ acteurId: meilleur.id, competence: "discretion", difficulte: "normale", dehors: true, titre: t(P("Leurre.Test")) });
    const jour = jourCtx(ctx);
    const lieu = L.lieuRefroidi(L.lieuDe(ctx.monde, s.site), jour);
    const r = L.campLeurre(lieu, { jour, reussi: Boolean(test.reussite) });
    ctx.monde = L.avecLieu(ctx.monde, s.site, { ...r.lieu, le: jour });
    await ab.update({ system: { stocks: L.ajouterStocks(s.stocks, { materiaux: -1 }) } });
    noter(ctx, tx(test.reussite ? "leurre" : "leurre-rate", { noms: equipe.map(a => a.name).join(", ") }));
    journalSecret(ctx, tx("Paradis.Journal.Leurre", { effet: r.effet, partent: r.partent }));
    await avancerInterne(ctx, 2);
    return { reussi: Boolean(test.reussite), ...(estMJ() ? { effet: r.effet, partent: r.partent, recent: r.recent } : {}) };
  }

  async function chaleurInterne(ctx, { delta = null, valeur = null, agglutines = null } = {}) {
    const ab = exigerAbri(ctx, { ici: false });
    const s = aPlat(ab.system);
    const jour = jourCtx(ctx);
    const lieu = L.lieuRefroidi(L.lieuDe(ctx.monde, s.site), jour);
    const chaleur = valeur !== null && valeur !== undefined ? Number(valeur) || 0 : lieu.chaleur + (Number(delta) || 0);
    const ag = agglutines !== null && agglutines !== undefined ? Math.max(0, Math.floor(Number(agglutines) || 0)) : lieu.agglutines;
    ctx.monde = L.avecLieu(ctx.monde, s.site, { ...lieu, chaleur, agglutines: ag, le: jour });
    const apres = L.lieuDe(ctx.monde, s.site);
    journalSecret(ctx, tx("Paradis.Journal.Chaleur", { chaleur: apres.chaleur, agglutines: apres.agglutines }));
    return { chaleur: apres.chaleur, agglutines: apres.agglutines, signe: L.motChaleur(apres.chaleur, apres.agglutines) };
  }

  async function sousTerreInterne(ctx, { vit = null } = {}) {
    const ab = exigerAbri(ctx, { ici: false });
    const v = vit === true || vit === false ? vit : null;
    await ab.update({ system: { sousTerre: v } });
    noter(ctx, tx("sous-terre-regle", { vit: t(P(`SousTerre.${v === null ? "site" : v ? "oui" : "non"}`)) }));
    return { sousTerre: v };
  }

  async function rallumerInterne(ctx, { region = "", action = "declarer" } = {}) {
    if (!L.regionDe(contenu(), region)) throw clair(t("LAKOUR_SURVIE.Erreurs.RegionInconnue", { region }));
    const ile0 = L.ileDe(ctx.etat);
    const jour = jourCtx(ctx);
    const etat = action === "eteindre" ? "eteinte" : "rallumee";
    const avant = ile0.regions[region] ?? {};
    ctx.etat = { ...ctx.etat, ile: { ...ile0, regions: { ...ile0.regions, [region]: { ...avant, etat, depuis: etat === "rallumee" ? jour : avant.depuis ?? null, ombreLe: null,
      ...(etat === "eteinte" ? { eteinteLe: jour } : { fois: (Number(avant.fois) || 0) + 1 }), declare: true } } } };
    noter(ctx, tx(etat === "rallumee" ? "rallumer-declaree" : "rallumer-eteinte", { region: nomRegion(region) }));
    // Les jalons de l'île (première région, la moitié, toute l'île) : comme chaque jour.
    const jalons = L.jalonsDuJour(ctx.etat, { jour, rallumees: L.regionsRallumees(ctx.etat).length, regions: L.regionsDe(contenu()).length });
    if (jalons.length) { ctx.etat = { ...ctx.etat, jalons: [...L.jalonsDe(ctx.etat), ...jalons] }; for (const j of jalons) noter(ctx, L.texteJalon(j.cle, j.params)); ctx.chroniques = true; }
    return { region, etat, jalons: jalons.map(j => j.cle) };
  }

  // Travailler à un grand chantier (il faut être dans sa région ; son coût se paie au premier quart, sur l'abri s'il y est, sinon sur ce
  // que le groupe porte), ou y ajouter (retirer) un allié qui avance le travail chaque jour.
  async function chantierInterne(ctx, { cle = "", membres = [], quarts = 2, aide = "", retirer = false } = {}) {
    const c = contenu();
    const def = L.chantierDe(c, cle);
    if (!def) throw clair(localiser(L.message("chantier-inconnu", { cle }, `chantier inconnu « ${cle} »`)));
    if (L.chantierFini(ctx.etat, cle)) throw clair(localiser(L.message("chantier-deja-fini", {}, "ce chantier est déjà fini")));
    const ile0 = L.ileDe(ctx.etat);
    const jour = jourCtx(ctx);
    let ch = ile0.chantiers[cle] ?? null;
    const poser = x => { ctx.etat = { ...ctx.etat, ile: { ...L.ileDe(ctx.etat), chantiers: { ...L.ileDe(ctx.etat).chantiers, [cle]: x } } }; };
    if (aide) {
      const base = ch ?? { fait: 0, requis: Number(def.travail) || 1, debut: jour, finiLe: null, aides: [] };
      const aides = retirer ? (base.aides ?? []).filter(x => x !== aide) : [...new Set([...(base.aides ?? []), aide])];
      poser({ ...base, aides });
      if (!retirer) noter(ctx, tx("chantier-aide", { aide: L.factionDe(c, aide)?.nom ?? aide, nom: def.nom }));
      return { cle, aides };
    }
    if (ctx.etat.groupe.enRoute || ctx.etat.groupe.region !== def.region) throw clair(localiser(L.message("chantier-loin", { region: nomRegion(def.region) }, `il faut être dans la région du chantier (${nomRegion(def.region)})`)));
    const equipe = equipeDe(ctx.etat, membres);
    if (!ch) {
      // Le coût, une fois : sur l'abri s'il est dans la région, sinon sur ce que porte le groupe.
      const ab = abriCourant(ctx.etat);
      const surAbri = Boolean(ab && aPlat(ab.system).region === def.region);
      const stocks = surAbri ? aPlat(ab.system).stocks : { ...(ctx.etat.groupe.porte ?? {}) };
      const retrait = L.retirerStocks(stocks, def.cout ?? {});
      if (Object.keys(retrait.manque ?? {}).length) throw clair(localiser(L.message("manque", { manque: Object.entries(retrait.manque ?? {}).map(([r, n]) => `${n} ${r}`).join(", ") }, "il manque des ressources")));
      if (surAbri) await ab.update({ system: { stocks: retrait.stocks } }); else ctx.etat.groupe = { ...ctx.etat.groupe, porte: retrait.stocks };
      ch = { fait: 0, requis: Number(def.travail) || 1, debut: jour, finiLe: null, aides: [] };
    }
    const q = Math.max(1, Math.min(8, Math.floor(Number(quarts) || 1)));
    const r = L.travaillerChantier(ch, def, { quarts: q, bras: brasDe(equipe, jour), jour });
    poser(r.chantier);
    noter(ctx, tx("chantier-avance", { noms: equipe.map(a => a.name).join(", "), nom: def.nom, fait: Math.floor(r.chantier.fait), requis: r.chantier.requis }));
    if (r.fini) { noter(ctx, tx("chantier-fini", { nom: def.nom, region: nomRegion(def.region) })); alerter(ctx, "ile", tx("chantier-fini", { nom: def.nom, region: nomRegion(def.region) })); }
    await avancerInterne(ctx, q);
    return { cle, fait: r.chantier.fait, requis: r.chantier.requis, fini: Boolean(r.chantier.finiLe !== null && r.chantier.finiLe !== undefined) };
  }

  const ecrire = fn => ecriture(async (args = {}) => { const ctx = ouvrirCtx(); const r = await fn(ctx, args); await terminer(ctx); return r; });
  return {
    paradis: () => paradis(),
    ile: () => ile(),
    ronde: ecrire(rondeInterne),
    traiterCorps: ecrire(corpsInterne),
    leurre: ecrire(leurreInterne),
    chaleur: ecrire(chaleurInterne),
    sousTerre: ecrire(sousTerreInterne),
    rallumer: ecrire(rallumerInterne),
    chantierRegion: ecrire(chantierInterne)
  };
}
