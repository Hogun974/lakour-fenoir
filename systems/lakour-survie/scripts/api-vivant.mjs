// Le vivant de l'abri dans l'API game.lakourSurvie (lot 8, contrat §27). La logique est pure (logique/vivant.mjs, savoirs.mjs) ;
// ici, on l'applique aux documents et à l'état public.
//
// fonctionsVivant(outils) reçoit les aides internes de api.mjs et rend les fonctions à étaler dans game.lakourSurvie :
// lecture
// - cheptels()                                        -> les cheptels et bacs de l'abri, les bêtes que le groupe porte, le chien
// - flairDuChien({ distance, nuit, suit })            -> ce que fait le chien devant un Livide (tourne, mène, aboie) et son bruit
// - beteSauvage({ zone, phase })                      -> une rencontre de bêtes en liberté (au MJ)
// écriture (MJ actif, monde ouvert)
// - peupler({ installation, n, espece, portees })     -> des bêtes (portées, données) ou des plants (semés : une graine pour six)
// - mettreEnEnclos({ beteId })                        -> les bêtes portées entrent dans l'enclos de leur espèce
// - abattre({ installation, n })                      -> la viande aux stocks de l'abri ; le troupeau baisse
// - soignerCheptel({ installation, acteurId })        -> un quart, le remède de l'espèce, un test de survie ; réussi, il guérit
// - curer({ installation, membres })                  -> un quart : le bassin curé, le filtre changé
// - capturer({ acteurId, espece, n })                 -> prendre une bête en liberté (l'outil de l'espèce, un test de survie)
// - chasser({ acteurId, espece, competence, fuit })   -> l'abattre (combat ou tir) : sa viande ; un tir s'entend
// - recevoirBete({ espece, n, source })               -> des bêtes données, échangées ou trouvées en fouillant (lot 5)
// - lacherBetes({ beteId })                           -> les rendre à la nature
// - pertesDAssaut(ctx, { marge, force })              -> (interne, assautInterne) un Livide resté près d'un enclos tue une bête
import * as L from "../logique/index.mjs";
import { t, lireEtat, acteur, survivantsDuGroupe, abriCourant, aPlat } from "./donnees.mjs";

export function fonctionsVivant({ ecriture, ouvrirCtx, terminer, noter, tx, jourCtx, contenu, clair, erreur, chat, carteAction, systemeLogique,
  ecrireSurvivant, bilanVivant, mondeMJ, aLAbri, testDirect, objetsDe, defDe, avancerInterne, instancesDe, membresValides }) {
  const K = k => `LAKOUR_SURVIE.Vivant.${k}`;
  const survivantDe = id => {
    const a = acteur(id);
    if (!a || a.type !== "survivant") throw erreur("ActeurInconnu");
    if (!L.peutAgir(a.system)) throw clair(t("LAKOUR_SURVIE.Erreurs.HorsEtat", { nom: a.name }));
    return a;
  };
  const especeOuErreur = cle => {
    const e = L.especeDe(contenu(), cle);
    if (!e) throw clair(t(K("Erreurs.Espece"), { espece: cle || "?" }));
    return e;
  };
  const abriIci = ctx => {
    const ab = abriCourant(ctx.etat);
    if (!ab) throw erreur("SansAbri");
    if (!aLAbri(ctx.etat, ab)) throw erreur("PasALAbri");
    return ab;
  };
  const altitudeDe = ab => Number(L.regionDe(contenu(), ab.system.region)?.altitude) || 0;
  // L'installation vivante de l'abri désignée par sa clé (ou son id) : { inst, def, v, st }.
  const cheptelDe = (ab, ref, ctx) => {
    const inst = instancesDe(ab).find(i => (i.cle === ref || i.id === ref) && i.niveau >= 1);
    const def = inst ? defDe("installations", inst.cle) : null;
    const v = def ? L.vivantDuNiveau(def, inst.niveau) : null;
    if (!v) throw clair(t(K("Erreurs.PasVivant"), { installation: ref || "?" }));
    const st = L.etatCheptel(aPlat(ab.system), inst, def, contenu(), { jour: jourCtx(ctx), altitude: altitudeDe(ab) });
    return { inst, def, v, st };
  };
  const ecrireCheptel = async (ab, cle, st) => { await ab.update({ system: { vivant: { [cle]: structuredClone(st) } } }); };
  const stocksIci = (ctx, ab) => (ab && aLAbri(ctx.etat, ab) ? aPlat(ab.system).stocks : { ...(ctx.etat.groupe.porte ?? {}) });
  const poserStocks = async (ctx, ab, stocks) => {
    if (ab && aLAbri(ctx.etat, ab)) await ab.update({ system: { stocks: L.normaliserStocks(stocks) } });
    else ctx.etat.groupe = { ...ctx.etat.groupe, porte: L.normaliserStocks(stocks) };
  };
  const nomEspece = cle => L.especeDe(contenu(), cle)?.nom ?? cle;
  const outilsDe = a => objetsDe(a, "equipement").map(i => i.system?.cle).filter(Boolean);
  // Les outils de capture que portent les membres du groupe (cage, sac de goni, corde, enfumoir, nasse).
  const outilsDuGroupe = etat => survivantsDuGroupe(etat).filter(a => L.peutAgir(a.system)).flatMap(outilsDe);
  const chienAvecLeGroupe = etat => survivantsDuGroupe(etat).filter(a => L.peutAgir(a.system))
    .some(a => objetsDe(a, "equipement").some(i => i.system?.cle === "chien-du-groupe" || i.system?.categorie === "animal"));

  // ---------------------------------------------------------------- lectures
  function cheptels(etat = lireEtat()) {
    if (!etat?.demarree) return null;
    const ab = abriCourant(etat);
    const b = ab ? bilanVivant(etat, mondeMJ()) : null;
    const quart = Number(etat.horloge?.quart) || 0;
    const betes = L.betesPortees(etat.groupe?.betes).map(x => {
      const e = L.especeDe(contenu(), x.cle);
      return { ...x, espece: e?.cle ?? x.cle, nom: e?.nom ?? x.cle, reste: Math.max(0, Number(x.jusqua ?? quart) - quart) };
    });
    return { cheptels: structuredClone(b?.cheptels ?? []), betes, chien: chienAvecLeGroupe(etat), outils: [...new Set(outilsDuGroupe(etat))] };
  }
  function flairDuChien({ distance = 30, nuit = false, suit = false } = {}) {
    const r = L.alerteDuChien({ distance: Number(distance), nuit: Boolean(nuit), suit: Boolean(suit) });
    return { ...r, texte: t(K(`Chien.${r.signal}`), { flair: r.flair, arret: r.arret }) };
  }
  function beteSauvage({ zone = "", phase = "" } = {}) {
    const etat = lireEtat();
    const z = zone || L.regionDe(contenu(), etat.groupe?.region)?.zone || "";
    const r = L.tirerBeteSauvage(contenu(), { zone: z, phase: phase || etat.phase || "" }, Math.random);
    return r ? { ...r, especeNom: nomEspece(r.espece), zone: z } : null;
  }

  // ---------------------------------------------------------------- écritures
  // Peupler un cheptel : des bêtes portées par le groupe (portees : true), ou données par le MJ ; des plants : une graine pour six.
  async function peuplerInterne(ctx, { installation = "", n = 1, espece = "", portees = false } = {}) {
    const ab = abriIci(ctx);
    const { inst, v, st } = cheptelDe(ab, installation, ctx);
    const voulue = espece || st.espece;
    if (!L.especesPossibles(v).includes(voulue)) throw clair(t(K("Erreurs.AutreEspece"), { espece: nomEspece(voulue), installation: inst.cle }));
    const esp = especeOuErreur(voulue);
    let q = Math.max(1, Math.floor(Number(n) || 1));
    let stocks = aPlat(ab.system).stocks;
    if (esp.genre === "plants") {
      const R = L.REGLES_VIVANT.replanter;
      const graines = Math.ceil(q / R.plants) * R.graines;
      if ((Number(stocks.graines) || 0) < graines) throw clair(t(K("Erreurs.Graines"), { n: graines }));
      stocks = L.retirerStocks(stocks, { graines }).stocks;
    } else if (portees) {
      const dispo = L.betesPortees(ctx.etat.groupe.betes).filter(b => L.cleEspece(contenu(), b.cle) === voulue).reduce((s, b) => s + Number(b.nombre), 0);
      if (!dispo) throw clair(t(K("Erreurs.AucunePortee"), { espece: esp.nom }));
      q = Math.min(q, dispo);
    }
    const r = L.peuplerCheptel(st, { n: q, places: v.places, espece: voulue });
    if (!r.ok) throw clair(t(K(`Erreurs.${r.motif}`), { installation: inst.cle }));
    if (esp.genre !== "plants" && portees) {
      let reste = r.entrent;
      ctx.etat.groupe = { ...ctx.etat.groupe, betes: (ctx.etat.groupe.betes ?? []).map(b => {
        if (b.enclos || L.cleEspece(contenu(), b.cle) !== voulue || reste <= 0) return b;
        const pris = Math.min(reste, Number(b.nombre));
        reste -= pris;
        return { ...b, nombre: Number(b.nombre) - pris };
      }).filter(b => b.enclos || Number(b.nombre) > 0) };
    }
    if (esp.genre === "plants") await ab.update({ system: { stocks } });
    await ecrireCheptel(ab, inst.cle, r.etat);
    noter(ctx, tx("Vivant.Journal.Peuple", { installation: defDe("installations", inst.cle)?.nom ?? inst.cle, n: r.entrent, espece: esp.nom }));
    return { installation: inst.cle, entrent: r.entrent, restent: r.restent, tetes: r.etat.tetes, places: v.places };
  }

  // Mettre les bêtes portées dans l'enclos de leur espèce (toutes, ou celles d'une prise).
  async function mettreEnEnclosInterne(ctx, { beteId = "" } = {}) {
    const ab = abriIci(ctx);
    const portees = L.betesPortees(ctx.etat.groupe.betes).filter(b => !beteId || b.id === beteId);
    if (!portees.length) throw clair(t(K("Erreurs.RienAPorter")));
    const sortie = [];
    let restes = (ctx.etat.groupe.betes ?? []).filter(b => !portees.includes(b));
    let systeme = aPlat(ab.system);
    for (const b of portees) {
      const espece = L.cleEspece(contenu(), b.cle);
      const enclos = L.enclosPour(instancesDe(ab), contenu(), espece, systeme, { jour: jourCtx(ctx) });
      if (!enclos) { restes.push(b); sortie.push({ id: b.id, espece, entrent: 0, raison: "sans-enclos" }); continue; }
      const r = L.peuplerCheptel(enclos.etat, { n: b.nombre, places: enclos.places, espece });
      if (!r.ok) { restes.push(b); sortie.push({ id: b.id, espece, entrent: 0, raison: r.motif }); continue; }
      systeme = { ...systeme, vivant: { ...(systeme.vivant ?? {}), [enclos.cle]: r.etat } };
      await ecrireCheptel(ab, enclos.cle, r.etat);
      if (r.restent) restes.push({ ...b, nombre: r.restent });
      sortie.push({ id: b.id, espece, entrent: r.entrent, installation: enclos.cle });
      noter(ctx, tx("Vivant.Journal.Peuple", { installation: defDe("installations", enclos.cle)?.nom ?? enclos.cle, n: r.entrent, espece: nomEspece(espece) }));
    }
    ctx.etat.groupe = { ...ctx.etat.groupe, betes: restes };
    return { betes: sortie, restent: restes.length };
  }

  async function abattreInterne(ctx, { installation = "", n = 1 } = {}) {
    const ab = abriIci(ctx);
    const { inst, def, st } = cheptelDe(ab, installation, ctx);
    const esp = especeOuErreur(st.espece);
    const r = L.abattreCheptel(st, esp, { n });
    if (!r.ok) throw clair(t(K(`Erreurs.${r.motif}`), { installation: def?.nom ?? inst.cle }));
    await ecrireCheptel(ab, inst.cle, r.etat);
    if (r.nourriture) await ab.update({ system: { stocks: L.ajouterStocks(aPlat(ab.system).stocks, { nourriture: r.nourriture }) } });
    noter(ctx, tx("Vivant.Journal.Abattu", { installation: def?.nom ?? inst.cle, n: r.abattues, espece: esp.nom, nourriture: r.nourriture }));
    return { installation: inst.cle, abattues: r.abattues, nourriture: r.nourriture, tetes: r.etat.tetes };
  }

  // Soigner un cheptel malade : le remède de l'espèce (tisane, eau changée, lessive de cendre), un test de survie (normale ; +1 dé
  // avec l'élevage, ou le maraîchage pour des plants), un quart de travail.
  async function soignerCheptelInterne(ctx, { installation = "", acteurId = "" } = {}) {
    const ab = abriIci(ctx);
    const { inst, def, st } = cheptelDe(ab, installation, ctx);
    if (!st.malade) throw clair(t(K("Erreurs.PasMalade"), { installation: def?.nom ?? inst.cle }));
    const esp = especeOuErreur(st.espece);
    const presents = survivantsDuGroupe(ctx.etat).filter(a => L.peutAgir(a.system));
    const a = acteurId ? survivantDe(acteurId)
      : [...presents].sort((x, y) => (y.system.competences?.survie?.niveau ?? 0) - (x.system.competences?.survie?.niveau ?? 0))[0];
    if (!a) throw erreur("ActeurInconnu");
    const cout = esp.remede?.cout ?? {};
    const { ile = 0, ...enStocks } = cout;
    const stocks = aPlat(ab.system).stocks;
    if (!L.couvre(stocks, enStocks) || ile > L.boisDisponible(aPlat(ab.system))) throw clair(t(K("Erreurs.Remede"), { remede: esp.remede?.texte ?? "" }));
    await ab.update({ system: { stocks: L.retirerStocks(stocks, enStocks).stocks, ...(ile ? { nature: L.prendreIle(aPlat(ab.system).nature, ile) } : {}) } });
    const savoir = esp.genre === "plants" ? "maraichage-tropical" : "elevage";
    const bonus = (systemeLogique(a).savoirs ?? []).includes(savoir) ? 1 : 0;
    const test = await testDirect({ acteurId: a.id, competence: "survie", difficulte: "normale", bonus, titre: t(K("Soin.Titre"), { installation: def?.nom ?? inst.cle }) });
    const r = L.soignerCheptel(st, test);
    await ecrireCheptel(ab, inst.cle, r.etat);
    noter(ctx, tx(r.gueri ? "Vivant.Journal.Soigne" : "Vivant.Journal.SoinRate", { installation: def?.nom ?? inst.cle, nom: a.name }));
    await avancerInterne(ctx, 1);
    return { installation: inst.cle, gueri: r.gueri, reussite: Boolean(test.reussite), acteurId: a.id };
  }

  async function curerInterne(ctx, { installation = "", membres = [] } = {}) {
    const ab = abriIci(ctx);
    const { inst, def, v, st } = cheptelDe(ab, installation, ctx);
    if (!(Number(v.filtre) > 0)) throw clair(t(K("Erreurs.SansFiltre"), { installation: def?.nom ?? inst.cle }));
    const qui = membresValides(ctx, membres);
    const r = L.nettoyerCheptel(st, jourCtx(ctx));
    await ecrireCheptel(ab, inst.cle, r.etat);
    noter(ctx, tx("Vivant.Journal.Cure", { installation: def?.nom ?? inst.cle, noms: qui.map(a => a.name).join(", ") }));
    await avancerInterne(ctx, 1);
    return { installation: inst.cle, filtreLe: r.etat.filtreLe };
  }

  // Prendre une bête en liberté : l'outil de son espèce (porté par quelqu'un du groupe), un test de survie (facile ou normale ; +1 dé
  // avec l'élevage). Ratée ou sans l'outil : elle file, et les autres avec ; un essaim sans enfumoir pique (une blessure) et reste.
  async function capturerInterne(ctx, { acteurId = "", espece = "", n = 1 } = {}) {
    const a = survivantDe(acteurId);
    const esp = especeOuErreur(espece);
    const outils = outilsDuGroupe(ctx.etat);
    const essai = L.prendreBete(esp, { test: null, outils });
    let test = null;
    if (essai.outil) {
      const bonus = (systemeLogique(a).savoirs ?? []).includes("elevage") ? 1 : 0;
      test = await testDirect({ acteurId: a.id, competence: "survie", difficulte: essai.difficulte, bonus, titre: t(K("Capture.Titre"), { espece: esp.nom }) });
    }
    const r = L.prendreBete(esp, { test, outils });
    let bete = null;
    if (r.prise) {
      const q = Math.max(1, Math.floor(Number(n) || 1));
      const x = L.porterBete(ctx.etat.groupe.betes ?? [], { espece: esp.cle, nombre: q, quart: ctx.etat.horloge.quart, source: "capture", contenu: contenu() });
      ctx.etat.groupe = { ...ctx.etat.groupe, betes: x.betes };
      bete = x.bete;
      noter(ctx, tx("Vivant.Journal.Prise", { nom: a.name, n: q, espece: esp.nom, quarts: L.horsEnclosDe(esp) }));
    } else if (r.blessure || (!essai.outil && esp.genre === "essaim")) {
      await ecrireSurvivant(a, L.blesser(systemeLogique(a, ctx.monde), 1).system, ctx);
      noter(ctx, tx("Vivant.Journal.Pique", { nom: a.name }));
    } else noter(ctx, tx(r.outil ? "Vivant.Journal.File" : "Vivant.Journal.SansOutil", { nom: a.name, espece: esp.nom }));
    await chat(carteAction({ icone: "fa-paw", titre: t(K("Capture.Titre"), { espece: esp.nom }),
      lignes: [r.prise ? t(K("Capture.Prise"), { quarts: L.horsEnclosDe(esp) }) : r.outil ? t(K("Capture.File")) : t(K("Capture.SansOutil"))] }));
    return { prise: r.prise, file: r.file, outil: r.outil, blessure: Boolean(r.blessure || (!essai.outil && esp.genre === "essaim")), difficulte: essai.difficulte, bete,
      reussite: test ? Boolean(test.reussite) : false };
  }

  // Chasser une bête en liberté : combat ou tir (normale ; difficile si elle fuit déjà) ; abattue, sa viande. Un tir s'entend.
  async function chasserInterne(ctx, { acteurId = "", espece = "", competence = "combat", fuit = false } = {}) {
    const a = survivantDe(acteurId);
    const esp = especeOuErreur(espece);
    const comp = competence === "tir" ? "tir" : "combat";
    const test = await testDirect({ acteurId: a.id, competence: comp, difficulte: fuit ? "difficile" : "normale", titre: t(K("Chasse.Titre"), { espece: esp.nom }) });
    const r = L.chasserBete(esp, { test });
    const ab = abriCourant(ctx.etat);
    if (r.viande) await poserStocks(ctx, ab, L.ajouterStocks(stocksIci(ctx, ab), { nourriture: r.viande }));
    if (comp === "tir" && ab && aLAbri(ctx.etat, ab)) await ab.update({ system: { bruit: Math.min(10, (Number(ab.system.bruit) || 0) + 2) } });
    noter(ctx, tx(r.abattue ? "Vivant.Journal.Chasse" : "Vivant.Journal.Manquee", { nom: a.name, espece: esp.nom, viande: r.viande }));
    return { abattue: r.abattue, viande: r.viande, bruit: comp === "tir" ? 2 : 0, reussite: Boolean(test.reussite) };
  }

  async function recevoirBeteInterne(ctx, { espece = "", n = 1, source = "" } = {}) {
    const esp = especeOuErreur(espece);
    const x = L.porterBete(ctx.etat.groupe.betes ?? [], { espece: esp.cle, nombre: n, quart: ctx.etat.horloge.quart, source: String(source || ""), contenu: contenu() });
    if (!x.bete) throw clair(t(K("Erreurs.nombre")));
    ctx.etat.groupe = { ...ctx.etat.groupe, betes: x.betes };
    noter(ctx, tx("Vivant.Journal.Recue", { n: x.bete.nombre, espece: esp.nom, quarts: L.horsEnclosDe(esp) }));
    return { bete: x.bete };
  }

  async function lacherBetesInterne(ctx, { beteId = "" } = {}) {
    const restent = (ctx.etat.groupe.betes ?? []).filter(b => b.enclos || (beteId && b.id !== beteId));
    const lachees = (ctx.etat.groupe.betes ?? []).length - restent.length;
    ctx.etat.groupe = { ...ctx.etat.groupe, betes: restent };
    if (lachees) noter(ctx, tx("Vivant.Journal.Lachees", { n: lachees }));
    return { lachees };
  }

  // Un assaut (assautInterne) : un Livide resté près d'un enclos tue une bête ; une bande en emporte.
  async function pertesDAssaut(ctx, { marge = 0, force = 1 } = {}) {
    const ab = abriCourant(ctx.etat);
    if (!ab || !(Number(marge) < 0)) return [];
    const r = L.pertesDAssaut(aPlat(ab.system), instancesDe(ab), contenu(), { marge, force, jour: jourCtx(ctx) });
    if (!r.pertes.length) return [];
    await ab.update({ system: { vivant: r.vivant } });
    const noms = r.pertes.map(p => `${defDe("installations", p.cle)?.nom ?? p.cle} (${p.n})`).join(", ");
    noter(ctx, tx("Vivant.Journal.Assaut", { pertes: noms }));
    return r.pertes;
  }

  const ecrire = fn => ecriture(async (args = {}) => { const ctx = ouvrirCtx(); const r = await fn(ctx, args); await terminer(ctx); return r; });
  return {
    pertesDAssaut,
    api: {
      cheptels: () => cheptels(),
      flairDuChien,
      beteSauvage,
      peupler: ecrire(peuplerInterne),
      mettreEnEnclos: ecrire(mettreEnEnclosInterne),
      abattre: ecrire(abattreInterne),
      soignerCheptel: ecrire(soignerCheptelInterne),
      curer: ecrire(curerInterne),
      capturer: ecrire(capturerInterne),
      chasser: ecrire(chasserInterne),
      recevoirBete: ecrire(recevoirBeteInterne),
      lacherBetes: ecrire(lacherBetesInterne)
    }
  };
}
