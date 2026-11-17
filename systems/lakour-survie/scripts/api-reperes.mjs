// Le jour qu'on croit, les cartes et les calendriers dans l'API game.lakourSurvie (lot « cartes », contrat §20). La logique est
// pure (logique/reperes.mjs) ; ici, on l'applique aux objets des survivants et à l'état public.
//
// Les cartes et les calendriers sont des ÉQUIPEMENTS (catégorie « repere », champ `repere`) portés par les survivants : ce qu'ils
// disent se lit sur ceux du groupe (perdre l'objet, c'est perdre ce qu'il disait). Le compte des jours est dans l'état public
// (etat.compte : ce que le groupe croit) ; son écart au vrai jour n'est rendu qu'au MJ.
//
// fonctionsReperes(outils) rend :
// - infos(etat)                         -> les repères du groupe (lecture, partout ; interne aussi : quand(), avancer)
// - optionsAvancer(etat)                -> { calendriers: [année], planche } pour logique/etat.mjs (avancer)
// - fixer(ctx)                          -> pose l'année, les régions et l'impression des repères qui ne les ont pas encore (un objet
//                                          glissé depuis le compendium)
// - trouver(ctx, { site, region, qui, fouille }) -> une carte ou un calendrier trouvé en fouillant (fouiller)
// - dateDeLaFete(ctx, { chez, fete })   -> à la fête des autres, on apprend le jour (participer)
// - api : reperes(), compte({ action, acteurId, date, jour, certitude }), donnerDate({ de, a, date, jour, mensonge }),
//         lireLaLune({ objetId }), donnerRepere({ acteurId, cle }), copierCarte({ objetId, acteurId }),
//         lireJournal({ mortId } | { de, date, jour, depuis, plans, renseignements })
import * as L from "../logique/index.mjs";
import { t, lireEtat, acteur, survivantsDuGroupe, abriCourant, aPlat, langue, localiser } from "./donnees.mjs";

export const CATEGORIE_REPERE = "repere";
const ACTIONS_COMPTE = ["teneur", "noter", "oublier", "regler"];

export function fonctionsReperes({ ecriture, ouvrirCtx, terminer, noter, tx, jourCtx, contenu, dateDepart, clair, chat, carteAction, quandDe,
  avancerInterne, donneesObjet, aLAbri, fetesDuJeu = () => [], estMJ = () => Boolean(globalThis.game?.user?.isGM) }) {
  const R = cle => `LAKOUR_SURVIE.Reperes.${cle}`;
  const nomRegion = cle => L.regionDe(contenu(), cle)?.nom ?? cle;
  const defRepere = cle => L.reperesDuContenu(contenu()).find(d => d.cle === cle) ?? null;
  const isoDu = jour => L.dateDuJour(jour, dateDepart()).iso;

  // ------------------------------------------------------------------ ce que le groupe porte
  // Le repère d'un objet : celui de sa définition au registre, complété de ce que l'objet garde pour lui (année, régions…).
  function repereObjet(i) {
    const s = aPlat(i.system);
    const def = s.cle ? defRepere(s.cle) : null;
    const propre = s.repere && typeof s.repere === "object" ? s.repere : null;
    if (!propre && !def) return null;
    return { ...structuredClone(def?.repere ?? {}), ...structuredClone(propre ?? {}) };
  }
  // Les repères portés par les survivants vivants du groupe. -> [{ id, nom, cle, porteurId, porteur, repere }]
  function objetsDuGroupe(etat = lireEtat()) {
    const sortie = [];
    for (const a of survivantsDuGroupe(etat).filter(x => L.peutAgir(x.system))) {
      for (const i of a.items?.contents ?? []) {
        if (i.type !== "equipement") continue;
        const r = repereObjet(i);
        if (r?.type) sortie.push({ id: i.id, nom: i.name, cle: i.system?.cle ?? "", porteurId: a.id, porteur: a.name, repere: r });
      }
    }
    return sortie;
  }
  const anneeCrue = (etat, compte = L.compteDe(etat)) => L.dateDuJour(compte.jourCru, dateDepart()).annee;

  // Ce que le groupe a et sait (lecture, partout). L'écart au vrai jour n'est rendu qu'au MJ.
  function infos(etat = lireEtat()) {
    const objets = objetsDuGroupe(etat);
    const reperes = objets.map(o => o.repere);
    const compte = L.compteDe(etat);
    const annee = anneeCrue(etat, compte);
    const ab = abriCourant(etat);
    const ici = Boolean(ab && aLAbri(etat, ab));
    return {
      objets, annee, support: L.supportDuCompte(reperes, annee), calendrierLune: L.calendrierPourLaLune(reperes, annee),
      montre: L.aUneMontre(reperes), cadran: ici && L.aUnCadran(reperes),
      cartes: L.ceQueDisentLesCartes(objets.filter(o => o.repere.type === "carte").map(o => ({ nom: o.nom, repere: o.repere })), contenu())
    };
  }
  // Ce qu'il faut à la logique d'avancer : l'année des calendriers portés, une planche des jours.
  function optionsAvancer(etat = lireEtat()) {
    const reperes = objetsDuGroupe(etat).map(o => o.repere);
    return { calendriers: reperes.filter(r => r.type === "calendrier" && Number(r.annee)).map(r => Number(r.annee)), planche: reperes.some(r => r.type === "planche") };
  }

  // Le nom d'un repère qui entre en jeu : l'année d'un calendrier, la région d'une carte de cirque ou d'un plan de ville, la moitié
  // d'une carte déchirée.
  function nomDuRepere(def, r) {
    const nom = def.nom ?? def.cle;
    if (r.type === "calendrier" && Number(r.annee)) return t(R("NomAnnee"), { nom, annee: r.annee });
    if (r.type === "carte" && r.moitie) return t(R(`NomMoitie.${r.moitie}`), { nom });
    if (r.type === "carte" && (r.couvre === "region" || Array.isArray(r.couvre?.un)) && r.regions?.length === 1) return t(R("NomRegion"), { nom, region: nomRegion(r.regions[0]) });
    return nom;
  }
  // Crée l'objet d'un repère sur un survivant. -> l'objet créé
  async function creerRepere(ctx, a, def, { region = "", jour = jourCtx(ctx), hasard = Math.random, repere = null } = {}) {
    const r = repere ?? L.resoudreRepere(def, { jour, dateDepart: dateDepart(), region, contenu: contenu(), hasard });
    const donnees = await donneesObjet("equipement", def, { repere: r });
    donnees.name = nomDuRepere(def, r);
    const [cree] = await a.createEmbeddedDocuments("Item", [donnees]);
    return cree ?? { name: donnees.name, id: "" };
  }
  // Un objet glissé depuis le compendium n'a ni année ni régions : on les pose au premier passage du temps.
  async function fixer(ctx) {
    const jour = jourCtx(ctx);
    for (const a of survivantsDuGroupe(ctx.etat)) {
      for (const i of a.items?.contents ?? []) {
        if (i.type !== "equipement") continue;
        const r = repereObjet(i);
        if (!r?.type) continue;
        const manque = (r.type === "calendrier" && !Number(r.annee)) || (r.type === "carte" && (!Array.isArray(r.regions) || !Number(r.imprimee)));
        if (!manque) continue;
        const def = defRepere(i.system?.cle) ?? { cle: i.system?.cle, nom: i.name, repere: r };
        const plein = L.resoudreRepere({ ...def, repere: r }, { jour, dateDepart: dateDepart(), region: ctx.etat.groupe.region, contenu: contenu(),
          hasard: ctx.monde?.graine ? L.deriverHasard(ctx.monde.graine, "repere-fixe", i.id) : Math.random });
        await i.update({ system: { repere: plein } });
      }
    }
  }

  // ------------------------------------------------------------------ le compte des jours
  const compteCtx = ctx => L.compteDe(ctx.etat, { jour: jourCtx(ctx) });
  // Ce qui se dit du compte (public), et l'écart au vrai jour (au MJ seul : mj = true).
  function resumeCompte(etat = lireEtat(), { mj = estMJ() } = {}) {
    const c = L.compteDe(etat);
    const jour = L.jourDe(etat?.horloge?.quart ?? 0);
    const teneur = c.teneur ? acteur(c.teneur) : null;
    return {
      certitude: c.certitude, jourCru: c.certitude === "perdu" ? null : c.jourCru, marge: c.marge, encoches: c.encoches,
      dateCrue: c.certitude === "perdu" ? "" : L.dateTexte(c.jourCru, dateDepart(), langue()), dateCrueIso: c.certitude === "perdu" ? "" : isoDu(c.jourCru),
      teneur: c.teneur, teneurNom: teneur?.name ?? "", noteAujourdhui: Number(c.noteLe) === jour, oublieAujourdhui: Number(c.oublieLe) === jour,
      recu: c.recu ? { de: c.recu.de, le: c.recu.le } : null,
      ...(mj ? { ecart: L.ecartDuCompte(c, jour), jourCruReel: c.jourCru } : {})
    };
  }

  // Le calendrier des fêtes de l'année qu'on croit : les fêtes des JOURS_FETES jours qui viennent, comptés depuis le jour cru (si le
  // compte est perdu, il ne sert à rien : on ne sait pas où on en est). -> [{ cle, nom, dans (jours), date (ISO crue) }]
  const JOURS_FETES = 15;
  function fetesAVenir(etat, i, q) {
    const c = q.compte;
    if (!c || c.certitude === "perdu" || !i.objets.some(o => o.repere.type === "calendrier" && o.repere.fetes && L.calendrierValable(o.repere, i.annee))) return [];
    const depart = c.jourCru ?? q.jour;
    const sortie = [], vues = new Set();
    for (let k = 0; k <= JOURS_FETES; k++) {
      const iso = isoDu(depart + k);
      for (const f of fetesDuJeu(iso, contenu().fetes ?? []) ?? []) {
        if (!f.coeur || vues.has(f.cle)) continue;
        vues.add(f.cle);
        sortie.push({ cle: f.cle, nom: f.nom, dans: k, date: iso });
      }
    }
    return sortie;
  }

  function reperes(etat = lireEtat()) {
    if (!etat?.demarree) return null;
    const i = infos(etat);
    const q = quandDe(etat);
    return {
      compte: resumeCompte(etat), heure: q.heureLue, soleil: L.soleilDuMois(q.mois), support: i.support,
      objets: i.objets.map(o => ({ id: o.id, nom: o.nom, cle: o.cle, porteurId: o.porteurId, porteur: o.porteur, type: o.repere.type,
        annee: o.repere.type === "calendrier" ? Number(o.repere.annee) || null : null, valable: o.repere.type === "calendrier" ? L.calendrierValable(o.repere, i.annee) : null,
        lunes: Boolean(o.repere.lunes), marees: Boolean(o.repere.marees), fetes: Boolean(o.repere.fetes),
        regions: o.repere.type === "carte" ? [...(o.repere.regions ?? [])] : [], imprimee: Number(o.repere.imprimee) || null, copie: Boolean(o.repere.copie) })),
      cartes: i.cartes, calendrierLune: i.calendrierLune ? { annee: Number(i.calendrierLune.annee) || null, marees: Boolean(i.calendrierLune.marees) } : null,
      montre: i.montre, cadran: i.cadran, fetesAVenir: fetesAVenir(etat, i, q),
      journaux: (etat.morts ?? []).filter(m => m.journal && !m.repos).map(m => ({ id: m.id, nom: m.nom, region: m.region }))
    };
  }

  async function compteInterne(ctx, { action = "teneur", acteurId = "", date = "", jour = null, certitude = "" } = {}) {
    if (!ACTIONS_COMPTE.includes(action)) throw clair(t(R("Erreurs.Action"), { action }));
    let c = compteCtx(ctx);
    const j = jourCtx(ctx);
    if (action === "teneur") {
      const a = acteurId ? acteur(acteurId) : null;
      if (acteurId && (!a || !(ctx.etat.groupe.membres ?? []).includes(a.id))) throw clair(t(R("Erreurs.Membre"), { nom: a?.name ?? acteurId }));
      c = { ...c, teneur: a?.id ?? "" };
      noter(ctx, a ? tx("Reperes.Journal.Teneur", { nom: a.name }) : tx("Reperes.Journal.SansTeneur"));
    } else if (action === "noter") {
      if (c.certitude === "perdu") throw clair(t(R("Erreurs.Perdu")));
      const a = acteurId ? acteur(acteurId) : null;
      c = { ...c, noteLe: j, oublieLe: null };
      noter(ctx, tx("Reperes.Journal.Note", { nom: a?.name ?? t(R("LeGroupe")) }));
    } else if (action === "oublier") {
      c = { ...c, oublieLe: j, noteLe: Number(c.noteLe) === j ? null : c.noteLe };
      noter(ctx, tx("Reperes.Journal.Oublie"));
    } else {
      const cru = jourDe({ date, jour });
      const cert = L.CERTITUDES.includes(certitude) ? certitude : c.certitude;
      c = { ...c, certitude: cert, ...(cru !== null ? { jourCru: cru } : {}), ...(cert === "sur" ? { marge: 0, encoches: 0, joursSansNoter: 0 } : {}) };
      noter(ctx, tx("Reperes.Journal.Regle"));
    }
    ctx.etat.compte = c;
    return resumeCompte(ctx.etat, { mj: true });
  }
  // Un jour donné par une date ISO ou un numéro de jour de jeu ; null si rien (ou illisible).
  function jourDe({ date = "", jour = null } = {}) {
    if (date) {
      if (!L.dateValide(String(date))) throw clair(t(R("Erreurs.Date"), { date }));
      return L.jourDeLaDate(String(date), dateDepart());
    }
    return jour === null || jour === undefined || jour === "" ? null : L.bornerJours(jour);
  }

  // Donner ou recevoir un jour. a vide (ou « groupe ») : le groupe reçoit le jour de `de` (un nom), le croit et le note. Sinon le
  // groupe (de : « groupe » ou un survivant) le donne à `a` : s'il ne donne pas le jour qu'il croit (mensonge, défaut : vrai quand il
  // le sait et en donne un autre), un faux jour court par le Ladi Lafé (rumeur fausse et malveillante, son auteur au secret) ; s'il
  // est démenti un jour (dementir), le menteur porte l'acte « mentir » (§14, §15).
  async function donnerDateInterne(ctx, { de = "", a = "", date = "", jour = null, mensonge = null } = {}) {
    const annonce = jourDe({ date, jour });
    if (annonce === null) throw clair(t(R("Erreurs.Date"), { date: date || jour || "" }));
    const j = jourCtx(ctx);
    const c = compteCtx(ctx);
    const vrai = annonce === j;
    if (!a || a === "groupe") {
      if (!String(de).trim()) throw clair(t(R("Erreurs.De")));
      ctx.etat.compte = L.recevoirJour(c, { jourAnnonce: annonce, jour: j, de: String(de).trim() });
      noter(ctx, tx("Reperes.Journal.Recu", { de: String(de).trim(), date: isoDu(annonce) }));
      return { sens: "recu", jour: annonce, date: isoDu(annonce), compte: resumeCompte(ctx.etat, { mj: true }), vrai };
    }
    // Celui qui donne : le groupe (de vide ou « groupe »), ou l'un de ses membres.
    const qui = de && de !== "groupe" ? acteur(de) ?? (game.actors?.contents ?? []).find(x => x.type === "survivant" && x.name === de) ?? null : null;
    if (de && de !== "groupe" && !(qui && (ctx.etat.groupe.membres ?? []).includes(qui.id))) throw clair(t(R("Erreurs.Membre"), { nom: qui?.name ?? de }));
    const auteur = qui ? qui.id : "groupe";
    const nomAuteur = qui?.name ?? t(R("LeGroupe"));
    const ment = mensonge === null || mensonge === undefined || mensonge === "" ? c.certitude !== "perdu" && annonce !== c.jourCru : Boolean(mensonge);
    noter(ctx, tx("Reperes.Journal.Donne", { de: nomAuteur, a: String(a), date: isoDu(annonce) }));
    let rumeur = null;
    if (ment) {
      const r = L.lancerRumeur(L.marcheDe(ctx.etat), L.secretMarcheDe(ctx.monde), { jour: j, sujet: String(a), vraie: false, malveillant: true, auteur, portee: "region",
        contre: false, source: "colporte", texte: { cle: "Reperes.Rumeur", params: { a: String(a), date: isoDu(annonce) }, texte: `À ${a}, on dit qu'on est le ${isoDu(annonce)}.` } });
      ctx.etat.marche = r.marche;
      if (ctx.monde) ctx.monde.marche = r.secret;
      rumeur = r.rumeur.id;
    }
    return { sens: "donne", jour: annonce, date: isoDu(annonce), mensonge: ment, rumeur, vrai };
  }

  // Lire la lune sur un calendrier : la nuit, ciel dégagé, la lune levée (ou nouvelle : son absence se lit aussi).
  async function lireLaLuneInterne(ctx, { objetId = "" } = {}) {
    const q = quandDe(ctx.etat);
    if (!L.estNuit(q.moment)) throw clair(t(R("Erreurs.Jour")));
    if (q.couvert) throw clair(t(R("Erreurs.Couvert")));
    if (!L.luneLevee(q.lune, q.moment) && (Number(q.lune?.eclairee) || 0) >= 0.08) throw clair(t(R("Erreurs.PasLevee")));
    const i = infos(ctx.etat);
    const choisi = objetId ? i.objets.find(o => o.id === objetId) ?? null : null;
    if (objetId && !choisi) throw clair(t(R("Erreurs.Objet")));
    const calendrier = choisi ? choisi.repere : i.calendrierLune;
    const j = jourCtx(ctx);
    const c = compteCtx(ctx);
    const r = L.lireLaLune(c, { jour: j, dateDepart: dateDepart(), calendrier: calendrier?.type === "calendrier" ? calendrier : null,
      hasard: ctx.monde?.graine ? L.deriverHasard(ctx.monde.graine, "lune", ctx.etat.horloge.quart) : Math.random });
    if (!r.ok) throw clair(t(R("Erreurs.Lune"), { raison: localiser(r.motif) }));
    ctx.etat.compte = r.compte;
    noter(ctx, tx("Reperes.Journal.Lune", { date: isoDu(r.trouve) }));
    return { ok: true, jour: r.trouve, date: isoDu(r.trouve), autreAnnee: r.autreAnnee, avant: r.avant, ecart: r.trouve - j, compte: resumeCompte(ctx.etat, { mj: true }) };
  }

  // Le MJ donne une carte ou un calendrier à un survivant (une trouvaille racontée, un don, un troc).
  async function donnerRepereInterne(ctx, { acteurId = "", cle = "" } = {}) {
    const a = acteur(acteurId);
    if (!a || a.type !== "survivant") throw clair(t(R("Erreurs.Objet")));
    const def = defRepere(cle);
    if (!def) throw clair(t(R("Erreurs.PasRepere"), { cle }));
    const o = await creerRepere(ctx, a, def, { region: ctx.etat.groupe.region });
    noter(ctx, tx("Reperes.Journal.Recoit", { nom: a.name, objet: o.name }));
    return { acteurId: a.id, objetId: o.id, nom: o.name, repere: structuredClone(aPlat(o.system ?? {}).repere ?? null) };
  }

  // Recopier une carte à la main : un cahier cousu et de l'encre de suie (l'encre est usée). Un quart. La copie garde les routes et
  // les notes, pas le relief ; elle reste au groupe si l'original part (troc, perte, mort).
  async function copierCarteInterne(ctx, { objetId = "", acteurId = "" } = {}) {
    const i = infos(ctx.etat);
    const carte = i.objets.find(o => o.id === objetId && o.repere.type === "carte");
    if (!carte) throw clair(t(R("Erreurs.PasCarte")));
    const cahier = i.objets.find(o => o.repere.type === "cahier");
    const encre = i.objets.find(o => o.repere.type === "encre");
    if (!cahier || !encre) throw clair(t(R("Erreurs.Ecrire")));
    const scribe = (acteurId ? acteur(acteurId) : null) ?? acteur(carte.porteurId);
    const def = defRepere("copie-de-carte");
    if (!def) throw clair(t(R("Erreurs.PasRepere"), { cle: "copie-de-carte" }));
    const repere = { ...structuredClone(carte.repere), type: "carte", copie: true, de: carte.nom };
    delete repere.lieux;
    const donnees = await donneesObjet("equipement", def, { repere });
    donnees.name = t(R("NomCopie"), { nom: carte.nom });
    const [copie] = await scribe.createEmbeddedDocuments("Item", [donnees]);
    await acteur(encre.porteurId)?.deleteEmbeddedDocuments("Item", [encre.id]);
    noter(ctx, tx("Reperes.Journal.Copie", { nom: scribe.name, objet: carte.nom }));
    await avancerInterne(ctx, 1);
    return { objetId: copie?.id ?? "", nom: donnees.name, encreUsee: encre.id };
  }

  // Lire un journal. mortId : celui d'un mort du groupe (il reste sur le corps : on le lit là où il est tombé) ; sinon celui d'un
  // inconnu (de), que le MJ décrit : le dernier jour noté (date ou jour) et depuis combien de jours il ne l'écrit plus (depuis),
  // ses plans (clés d'installations), ses renseignements { region: { vu, infestation, electricite, eau, notes } }. Le jour qu'il
  // donne n'est pris que si le groupe ne sait pas le jour ; un journal peut se tromper, ou mentir. Un quart.
  async function lireJournalInterne(ctx, { mortId = "", de = "", date = "", jour = null, depuis = 0, plans = [], renseignements = null } = {}) {
    const j = jourCtx(ctx);
    const c = compteCtx(ctx);
    const sortie = { ok: true, de: "", jour: null, plans: [], regions: [] };
    let jourAnnonce = null, marge = L.REGLES_COMPTE.recu.marge, auteur = "";
    let lesPlans = [];
    if (mortId) {
      const r = L.lireJournalDuMort(ctx.etat, mortId, { jour: j, region: ctx.etat.groupe.enRoute ? "" : ctx.etat.groupe.region });
      if (!r.ok) throw clair(t(R("Erreurs.Journal"), { raison: localiser(r.motif) }));
      auteur = r.mort.nom; jourAnnonce = r.jourAnnonce; marge = r.marge; lesPlans = r.plans;
      noter(ctx, tx("Reperes.Journal.JournalMort", { nom: auteur }));
    } else {
      if (!String(de).trim()) throw clair(t(R("Erreurs.Rien")));
      auteur = String(de).trim();
      const note = jourDe({ date, jour });
      jourAnnonce = note === null ? null : note + Math.max(0, Math.floor(Number(depuis) || 0));
      lesPlans = [plans].flat().filter(Boolean);
      for (const p of lesPlans) if (!L.installationDe(contenu(), p)) throw clair(t(R("Erreurs.Plans"), { plan: p }));
      if (renseignements && typeof renseignements === "object") {
        const r = L.renseignementsDuJournal(ctx.etat.renseignements, renseignements, { jour: j, contenu: contenu() });
        ctx.etat.renseignements = r.renseignements;
        sortie.regions = r.regions;
      }
      noter(ctx, tx("Reperes.Journal.JournalInconnu", { de: auteur }));
    }
    sortie.de = auteur;
    if (jourAnnonce !== null && c.certitude !== "sur") {
      ctx.etat.compte = L.recevoirJour(c, { jourAnnonce, jour: j, de: auteur, marge });
      sortie.jour = jourAnnonce;
      noter(ctx, tx("Reperes.Journal.Recu", { de: auteur, date: isoDu(jourAnnonce) }));
    }
    for (const p of lesPlans) {
      if ((ctx.etat.groupe.plans ?? []).includes(p)) continue;
      ctx.etat = L.ajouterPlan(ctx.etat, p);
      sortie.plans.push(p);
    }
    await avancerInterne(ctx, 1);
    return sortie;
  }

  // ------------------------------------------------------------------ crochets d'autres fonctions de l'API
  // Une fouille dans un lieu (pas les alentours) : une carte ou un calendrier, parfois (repere.lieux du registre, un seul tirage, flux
  // de hasard à part : « repere|quart|lieu », sans toucher aux autres tirages). L'objet va au premier fouilleur.
  async function trouver(ctx, { site = null, region = "", qui = [], fouille = false } = {}) {
    if (!fouille || !ctx.monde?.graine || !qui[0]) return null;
    const lieu = site ? L.siteDe(contenu(), site)?.type ?? "region" : "region";
    const def = L.tirerRepere(contenu(), { lieu, hasard: L.deriverHasard(ctx.monde.graine, "repere", ctx.etat.horloge.quart, site || region) });
    if (!def) return null;
    const o = await creerRepere(ctx, qui[0], def, { region, hasard: L.deriverHasard(ctx.monde.graine, "repere-objet", ctx.etat.horloge.quart, site || region) });
    noter(ctx, tx("Reperes.Journal.Trouve", { nom: qui[0].name, objet: o.name }));
    return { cle: def.cle, nom: o.name, acteurId: qui[0].id, objetId: o.id };
  }
  // À la fête des autres, ceux qui reçoivent savent quel jour ils fêtent : un groupe qui ne le sait plus l'apprend.
  function dateDeLaFete(ctx, { chez = "", fete = "" } = {}) {
    const c = compteCtx(ctx);
    if (c.certitude === "sur") return false;
    const j = jourCtx(ctx);
    ctx.etat.compte = L.recevoirJour(c, { jourAnnonce: j, jour: j, de: chez || fete });
    noter(ctx, tx("Reperes.Journal.Fete", { chez: chez || fete, date: isoDu(j) }));
    return true;
  }

  const ecrire = fn => ecriture(async (args = {}) => { const ctx = ouvrirCtx(); const r = await fn(ctx, args); await terminer(ctx); return r; });
  return {
    infos, optionsAvancer, fixer, trouver, dateDeLaFete, resumeCompte, objetsDuGroupe,
    api: {
      reperes: () => reperes(),
      compte: ecrire(compteInterne),
      donnerDate: ecrire(donnerDateInterne),
      lireLaLune: ecrire(lireLaLuneInterne),
      donnerRepere: ecrire(donnerRepereInterne),
      copierCarte: ecrire(copierCarteInterne),
      lireJournal: ecrire(lireJournalInterne)
    }
  };
}
