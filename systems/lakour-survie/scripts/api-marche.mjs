// Le marché dans l'API game.lakourSurvie (contrat §12) : troc au cours, boutique et carnet de crédit, marchés forains et foires,
// trêve, accueil du marché, préjugés des PNJ (première confiance, usure), Ladi Lafé (la rumeur : publique dans etat.marche, sa
// vérité scellée dans monde.marche), objets marqués. La logique est pure (logique/marche.mjs) ; ici, on l'applique aux documents.
//
// fonctionsMarche(outils) reçoit les aides internes de api.mjs (gardes d'écriture, contexte, journal, chat) et rend :
// - api : les fonctions à étaler dans game.lakourSurvie ;
// - journee(ctx, jours) : à chaque nouveau jour d'avancer, les jours de marché, le Nouvel An chinois, les dettes qui traînent.
// Le système ne connaît l'origine de personne : `cibles` (les préjugés du PNJ qui s'éveillent devant l'inconnu) est donné par le MJ.
import * as L from "../logique/index.mjs";
import { RESSOURCES } from "../logique/constantes.mjs";
import { t, lireEtat, aPlat, acteur, abriCourant, MODULE_MJIA, survivantDesigne, survivantsDuGroupe } from "./donnees.mjs";

export const GROUPE = "groupe";
const SUJETS = ["debiteur", "sujet", "par", "auteur"];

export function fonctionsMarche({ ecriture, ouvrirCtx, terminer, noter, alerter, tx, jourCtx, contenu, dateDepart, quandDe, fetesDuJeu, erreur, clair, localiser, chat, carteAction, sansBalises,
  porterActe = null, membresPresents = () => [], espritDuTirage = () => ({}), valeurPapier = () => null, valeurPlanDeCle = () => null }) {
  const c = () => contenu();
  const etatMarche = ctx => L.marcheDe(ctx.etat);
  const secretMarche = ctx => L.secretMarcheDe(ctx.monde);
  const leGroupe = () => t("LAKOUR_SURVIE.Marche.LeGroupe");
  // Les paramètres qui désignent le groupe (« groupe ») sont écrits dans la langue du MJ (les autres sont des noms).
  const lisible = x => {
    if (!x || typeof x !== "object") return x;
    const params = { ...(x.params ?? {}) };
    for (const k of SUJETS) if (params[k] === GROUPE) params[k] = leGroupe();
    const texte = typeof x.texte === "string" ? x.texte.replace(/(^|\s)groupe(\s|$)/, `$1${leGroupe()}$2`) : x.texte;
    return { ...x, params, texte };
  };
  const biens = o => Object.fromEntries(Object.entries(o ?? {}).filter(([r, q]) => L.RESSOURCES_TROC.includes(r) && Number(q) > 0).map(([r, q]) => [r, Math.floor(Number(q))]));
  const texteBiens = o => Object.entries(biens(o)).map(([r, q]) => `${q} ${t(`LAKOUR_SURVIE.Ressources.${r}`).toLowerCase()}`).join(", ") || "—";
  const listeIds = v => (Array.isArray(v) ? v : v ? String(v).split(",").map(s => s.trim()).filter(Boolean) : []);
  const trouverBoutique = (m, ref) => m.boutiques.find(b => b.cle === ref || b.nom === ref) ?? (m.boutiques.length === 1 && !ref ? m.boutiques[0] : null);
  const trouverMarche = (m, ref) => m.marches.find(x => x.cle === ref || x.nom === ref) ?? (m.marches.length === 1 && !ref ? m.marches[0] : null);
  const cleLibre = (base, pris) => { let k = base || "marche", i = 2; while (pris.includes(k)) k = `${base}-${i++}`; return k; };
  const slug = s => String(s ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "marche";

  // Les stocks du groupe : ceux de l'abri, sinon ce qu'il porte.
  // La valeur des objets d'un troc (fusion vague2) : -> { donne, recoit, detail: [{ sens, objet, valeur, source }] }
  function valeurDesObjets(etat, cr, { objetsDonnes = [], plansRecus = [], objetsRecus = [] } = {}) {
    const detail = [];
    const porteurs = survivantsDuGroupe(etat);
    for (const id of listeIds(objetsDonnes)) {
      const i = porteurs.map(a => a.items?.get?.(id)).find(Boolean);
      if (!i) throw erreur("ActeurInconnu");
      const vp = valeurPapier(i);
      const v = vp !== null && vp !== undefined ? { valeur: vp, source: "plan" } : L.valeurObjet(aPlat(i.system).cle, c(), cr);
      detail.push({ sens: "donne", objet: i.name, valeur: Number(v.valeur) || 0, source: v.source });
    }
    for (const k of listeIds(plansRecus)) {
      const v = valeurPlanDeCle(k);
      detail.push({ sens: "recoit", objet: k, valeur: Number(v) || 0, source: v === null || v === undefined ? "" : "plan" });
    }
    for (const k of listeIds(objetsRecus)) {
      const v = L.valeurObjet(k, c(), cr);
      detail.push({ sens: "recoit", objet: k, valeur: Number(v.valeur) || 0, source: v.source });
    }
    const somme = sens => detail.filter(x => x.sens === sens).reduce((s, x) => s + x.valeur, 0);
    return { donne: somme("donne"), recoit: somme("recoit"), detail };
  }
  const stocksDuGroupe = ctx => { const ab = abriCourant(ctx.etat); return ab ? aPlat(ab.system).stocks : (ctx.etat.groupe.porte ?? {}); };
  async function ecrireStocks(ctx, stocks) {
    const ab = abriCourant(ctx.etat);
    if (ab) await ab.update({ system: { stocks: L.normaliserStocks(stocks) } });
    else ctx.etat.groupe.porte = L.normaliserStocks(stocks);
  }

  // Le cours du jour : phase et saison du jour de jeu, récolte d'une foire ouverte.
  function cours(etat = lireEtat(), { recolte = null, ajustements = {} } = {}) {
    const jour = L.jourDe(etat.horloge?.quart ?? 0);
    return L.coursDuJour({ phase: L.phaseDuJour(jour), saison: L.saisonDuJour(jour, dateDepart()), recolte, ajustements });
  }
  const recolteDe = mk => (mk?.foire ? mk.recolte : null);

  // La réputation d'une faction (horloge rep-<faction> du moteur) -> ce que son palier fait au troc ({ majoration, credit, echange }).
  function palierFaction(faction) {
    if (!faction) return null;
    const h = game.modules?.get?.(MODULE_MJIA)?.api?.horloges;
    const horloge = typeof h?.trouver === "function" ? h.trouver(`rep-${faction}`) : null;
    const paliers = c().reputations?.paliers ?? [];
    const v = Number(horloge?.valeur ?? (c().reputations?.factions ?? []).find(r => r.faction === faction)?.depart ?? 0);
    const p = [...paliers].reverse().find(x => v >= Number(x.min)) ?? paliers[0];
    return p?.marche ? { ...p.marche, palier: p.cle } : null;
  }
  // Appliquer des points de réputation aux horloges des factions (les bastions qui ne sont pas des factions : rien à tenir).
  async function appliquerReputation(rep = {}) {
    const h = game.modules?.get?.(MODULE_MJIA)?.api?.horloges;
    const faites = {};
    for (const [b, n] of Object.entries(rep)) {
      if (!Number(n) || !L.factionDe(c(), b) || typeof h?.avancer !== "function") continue;
      try { await h.avancer(`rep-${b}`, Number(n)); faites[b] = Number(n); } catch (e) { console.warn("lakour-survie | réputation", b, e); }
    }
    return faites;
  }

  // La première confiance d'un PNJ (acteur) envers le groupe : ses préjugés que le MJ dit éveillés, les rumeurs contre le groupe.
  function confianceDe(etat, { pnjId = "", cibles = [], faction = "", sujet = GROUPE } = {}) {
    const a = acteur(pnjId);
    const prejuges = a?.type === "survivant" ? aPlat(a.system).prejuges ?? [] : [];
    const jour = L.jourDe(etat.horloge?.quart ?? 0);
    const rumeurs = L.rumeursContre(L.marcheDe(etat), sujet, jour).length;
    return { ...L.premiereConfiance({ prejuges, cibles: listeIds(cibles), rumeurs, palier: palierFaction(faction) }), rumeurs, pnj: a?.name ?? "" };
  }
  // Le client d'une boutique (lot 10) : celui qui parle (sa réputation, sa parole), sinon le groupe (la moyenne des réputations de
  // ses vivants, la meilleure parole). Le commerçant ne voit jamais le sens moral, seulement ce qu'on dit de lui.
  function clientDe(etat, parleurId = "") {
    const p = acteur(parleurId);
    const niveauParole = a => Number(aPlat(a.system).competences?.parole?.niveau) || 0;
    if (p?.type === "survivant") return { reputation: Number(p.system.reputation) || 0, parole: niveauParole(p), nom: p.name };
    const vivants = survivantsDuGroupe(etat).filter(a => L.peutAgir(aPlat(a.system)));
    const reputation = L.reputationDuGroupe(vivants.map(a => aPlat(a.system))).moyenne;
    return { reputation, parole: Math.max(0, ...vivants.map(niveauParole)), nom: "" };
  }
  const boutiqueDe = (etat, ref) => (ref ? trouverBoutique(L.marcheDe(etat), ref) : null);
  async function userPrejugesDe(a, options) {
    if (!a || a.type !== "survivant") return { uses: [], tombes: [] };
    const avant = aPlat(a.system).prejuges ?? [];
    const r = L.userPrejuges(avant, options);
    // Les échanges comptent même avant de faire tomber un cran : on écrit dès que l'usure a bougé.
    if (JSON.stringify(r.prejuges) !== JSON.stringify(avant.map(L.normaliserPrejuge))) await a.update({ system: { prejuges: r.prejuges } });
    return r;
  }
  const noterUsure = (ctx, a, r) => {
    for (const cible of r.tombes) noter(ctx, tx("Marche.Journal.PrejugeTombe", { pnj: a.name, cible: nomCible(cible) }));
  };
  const nomCible = cle => L.liste(c().communautes).find(x => x.cle === cle)?.nom ?? cle;

  // Lancer une rumeur dans le contexte d'une écriture (publique au journal, vérité au monde scellé).
  // Le sens moral (lot « moral », contrat §14) : qui porte un acte du marché. qui : « groupe » (ses membres présents), l'id ou le nom
  // d'un survivant ; un PNJ inconnu ou une faction ne portent rien ici. -> le résultat de porterActe, ou null.
  // Un nom se cherche d'abord dans le groupe ; un nom que portent deux survivants ne désigne personne (lot 10 : jamais le mauvais).
  function porteursDe(qui, ctx = null) {
    if (!qui) return [];
    const a = survivantDesigne(qui, ctx ? survivantsDuGroupe(ctx.etat) : []);
    return a ? [a.id] : [];
  }
  async function acteDuMarche(ctx, qui, acte) {
    const ids = qui === GROUPE ? membresPresents(ctx).map(a => a.id) : porteursDe(qui, ctx);
    return ids.length && porterActe ? porterActe(ctx, ids, acte) : null;
  }

  function rumeurCtx(ctx, options) {
    const r = L.lancerRumeur(etatMarche(ctx), secretMarche(ctx), { jour: jourCtx(ctx), ...options });
    ctx.etat.marche = r.marche;
    if (ctx.monde) ctx.monde.marche = r.secret;
    noter(ctx, tx("Marche.Journal.Rumeur", { texte: sansBalises(localiser(lisible(r.rumeur))) }));
    return r;
  }

  // ------------------------------------------------------------------ chaque nouveau jour (avancer)
  async function journee(ctx, jours = []) {
    if (!ctx.monde) return;
    const ab = abriCourant(ctx.etat);
    let bruit = 0;
    const rep = {};
    for (const j of jours) {
      const date = L.dateDuJour(j, dateDepart()).iso;
      const fetes = fetesDuJeu(date, c().fetes ?? []).filter(f => f.coeur).map(f => f.cle);
      // Les étals du groupe (lot 10) vendent au cours du jour, sur un flux de hasard propre au jour.
      const r = L.journeeDuMarche({ marche: etatMarche(ctx), secret: secretMarche(ctx), jour: j, dateDepart: dateDepart(), fetes, debiteur: GROUPE,
        cours: L.coursDuJour({ phase: L.phaseDuJour(j), saison: L.saisonDuJour(j, dateDepart()) }), hasard: L.deriverHasard(ctx.monde.graine ?? "", "etal", j) });
      ctx.etat.marche = r.marche;
      ctx.monde.marche = r.secret;
      bruit += r.bruit;
      for (const [b, n] of Object.entries(r.reputation)) rep[b] = (rep[b] ?? 0) + n;
      for (const f of r.faits.map(lisible)) {
        noter(ctx, f);
        ctx.faits.push({ jour: j, region: "", public: true, ...f });
      }
      if (r.marches.length) alerter(ctx, "marche", tx("Marche.Alerte", { marches: r.marches.map(k => r.marche.marches.find(m => m.cle === k)?.nom ?? k).join(", ") }));
    }
    if (bruit && ab) await ab.update({ system: { bruit: Math.min(10, (Number(ab.system.bruit) || 0) + bruit) } });
    const faites = await appliquerReputation(rep);
    if (Object.keys(faites).length) noter(ctx, tx("Marche.Journal.ReputationAccueil", { factions: Object.keys(faites).map(f => L.factionDe(c(), f)?.nom ?? f).join(", ") }));
  }

  // ------------------------------------------------------------------ l'API
  const api = {
    // Lecture : l'état public du marché (boutiques et carnets, marchés, rumeurs, signe du groupe).
    marche: () => structuredClone(L.marcheDe(lireEtat())),
    // Le cours du jour, en parts (récolte d'une foire, ajustements du conseil).
    coursDuJour: ({ recolte = null, ajustements = {}, marche = "" } = {}) => {
      const etat = lireEtat();
      const mk = marche ? trouverMarche(L.marcheDe(etat), marche) : null;
      return cours(etat, { recolte: recolte ?? recolteDe(mk), ajustements });
    },
    // Les stades que le monde permet dans une région (ce que le groupe sait : renseignements publics).
    stadesDuMarche: ({ region = "" } = {}) => {
      const etat = lireEtat();
      const reg = region || etat.groupe?.region || "";
      const m = L.marcheDe(etat);
      const connu = etat.renseignements?.[reg] ?? {};
      const mois = L.dateDuJour(L.jourDe(etat.horloge?.quart ?? 0), dateDepart()).mois;
      const communautes = 1 + new Set([...(connu.factions ?? []), ...m.marches.filter(x => x.region === reg).flatMap(x => x.bastions)]).size;
      const routeOuverte = Object.values(connu.routes ?? {}).some(e => e === "ouverte") || (L.regionDe(c(), reg)?.voisins ?? []).length > 0 && !Object.keys(connu.routes ?? {}).length;
      const recolte = L.liste(c().foires).some(f => Number(f.mois) === mois);
      return L.stadesDuMarche({ boutique: m.boutiques.some(b => !b.region || b.region === reg), communautes, routeOuverte, recolte })
        .map(s => ({ ...s, texte: localiser(s.motif) }));
    },
    // La première confiance d'un PNJ envers le groupe (cibles : les préjugés du PNJ que le MJ dit éveillés devant lui).
    confiance: ({ pnjId = "", cibles = [], faction = "" } = {}) => confianceDe(lireEtat(), { pnjId, cibles, faction }),
    // Évaluer un troc sans rien changer.
    // boutique (lot 10) : un troc avec le commerçant d'une boutique, à sa marge (selon la réputation et la parole de parleurId).
    // Fusion vague2 : des objets peuvent changer de mains avec les biens. objetsDonnes : des objets portés par le groupe (un papier vaut
    // ses plans, valeurPlan du lot « plans » ; un autre objet, valeurObjet) ; plansRecus : des clés de plans ; objetsRecus : des clés
    // d'objets. Un objet sans valeur connue compte pour rien (au MJ de dire).
    evaluerTroc: ({ donne = {}, recoit = {}, pnjId = "", cibles = [], faction = "", marche = "", boutique = "", parleurId = "",
      objetsDonnes = [], plansRecus = [], objetsRecus = [] } = {}) => {
      const etat = lireEtat();
      const b = boutiqueDe(etat, boutique);
      const conf = confianceDe(etat, { pnjId: pnjId || b?.tenancier || "", cibles, faction });
      const mk = marche ? trouverMarche(L.marcheDe(etat), marche) : null;
      const cr = cours(etat, { recolte: recolteDe(mk) });
      const objets = valeurDesObjets(etat, cr, { objetsDonnes, plansRecus, objetsRecus });
      const o = { donne: objets.donne, recoit: objets.recoit };
      if (b) return { ...L.evaluerALaBoutique({ donne, recoit, cours: cr, ...clientDe(etat, parleurId), majoration: conf.majoration, objets: o }), boutique: b.cle, confiance: conf, cours: cr, objets };
      return { ...L.evaluerTroc({ donne, recoit, cours: cr, majoration: conf.majoration, objets: o }), confiance: conf, cours: cr, objets };
    },
    // Ce que vaut un objet (équipement, bête vivante) en parts : le barème du contenu, sinon sa recette au cours (lot 10).
    valeurObjet: ({ cle = "" } = {}) => ({ cle, ...L.valeurObjet(cle, c(), cours(lireEtat())) }),
    // Ce que vaut un plan en parts : valeurPlan({ cle } ou { rarete, unique }) est celle du lot « plans » (api-plans.mjs ; fusion vague2).
    // Un litige au conseil : une voix par bastion (« a », « b » ou rien).
    trancherLitige: ({ voix = {} } = {}) => L.trancherLitige({ voix }),
    // Un événement de marché tiré selon le stade, la saison et la phase (à jouer ; le démenti s'applique avec dementirPrejuge).
    evenementDeMarche: ({ stade = "forain" } = {}) => {
      const etat = lireEtat();
      const jour = L.jourDe(etat.horloge?.quart ?? 0);
      const liste = L.evenementsDeMarche(c(), { stade, saison: L.saisonDuJour(jour, dateDepart()), phase: L.phaseDuJour(jour) });
      const e = liste.length ? L.tirerPoids(liste.map(x => ({ ...x, poids: Number(x.poids ?? 1) })), Math.random) : null;
      return e ? { cle: e.cle, nom: e.nom, texte: e.texte, effets: structuredClone(e.effets ?? {}) } : null;
    },

    // Troquer au cours : le PNJ demande sa majoration ; refusé s'il n'y trouve pas son compte, sauf `accepter` (le MJ passe outre).
    // Un échange honnête (au moins au cours) use d'un échange les préjugés éveillés du PNJ.
    // prejuge : qui joue d'un préjugé pour faire baisser le prix (« groupe » ou un survivant) : il porte l'acte « colporter » (§14).
    // boutique, parleurId (lot 10) : à la boutique d'un commerçant, sa marge s'ajoute (il revend au-dessus du cours, rachète en
    // dessous), selon la réputation et la parole de qui parle (le groupe, sans lui).
    troquer: ecriture(async ({ donne = {}, recoit = {}, pnjId = "", cibles = [], faction = "", marche = "", accepter = false, prejuge = "", boutique = "", parleurId = "" } = {}) => {
      const ctx = ouvrirCtx();
      const b = boutique ? trouverBoutique(etatMarche(ctx), boutique) : null;
      if (boutique && !b) throw clair(t("LAKOUR_SURVIE.Marche.Erreurs.Boutique"));
      pnjId = pnjId || b?.tenancier || "";
      const conf = confianceDe(ctx.etat, { pnjId, cibles, faction });
      if (faction && palierFaction(faction)?.echange === false) throw clair(t("LAKOUR_SURVIE.Marche.Erreurs.Hostile"));
      const mk = marche ? trouverMarche(etatMarche(ctx), marche) : null;
      const cr = cours(ctx.etat, { recolte: recolteDe(mk) });
      const ev = b ? L.evaluerALaBoutique({ donne, recoit, cours: cr, ...clientDe(ctx.etat, parleurId), majoration: conf.majoration })
        : L.evaluerTroc({ donne, recoit, cours: cr, majoration: conf.majoration });
      const donnee = b ? ev.offerte : ev.valeurDonnee;
      if (!ev.accepte && !accepter) return { ok: false, ...ev, confiance: conf, raison: t("LAKOUR_SURVIE.Marche.Refuse", { demandee: ev.demandee, donnee }) };
      const r = L.appliquerTroc(stocksDuGroupe(ctx), { donne, recoit });
      if (!r.ok) throw clair(localiser(r.motif));
      await ecrireStocks(ctx, r.stocks);
      const a = acteur(pnjId);
      let usure = { uses: [], tombes: [] };
      if (a && ev.valeurDonnee >= ev.valeurRecue) { usure = await userPrejugesDe(a, { cibles: listeIds(cibles), echanges: 1 }); noterUsure(ctx, a, usure); }
      noter(ctx, tx("Marche.Journal.Troc", { donne: texteBiens(donne), recoit: texteBiens(recoit), avec: a?.name ?? (faction ? L.factionDe(c(), faction)?.nom ?? faction : "—") }));
      const sens = prejuge ? await acteDuMarche(ctx, prejuge, "colporter") : null;
      await terminer(ctx);
      return { ok: true, ...ev, confiance: conf, stocks: r.stocks, usure, sens };
    }),

    // La boutique et son carnet.
    // tirer (lot 10) : on ne sait pas si quelqu'un a rouvert cette boutique : un commerçant n'est resté que dans 30 % des boutiques ;
    // sinon, rien ne s'ouvre ({ ok: false }).
    ouvrirBoutique: ecriture(async ({ nom = "", tenancier = "", region = "", cle = "", tirer = false } = {}) => {
      const ctx = ouvrirCtx();
      if (tirer && !L.commercantReste(Math.random)) { await terminer(ctx); return { ok: false, boutique: null, raison: t("LAKOUR_SURVIE.Gestion.PasDeCommercant") }; }
      const m = etatMarche(ctx);
      const k = cleLibre(cle || slug(nom), m.boutiques.map(b => b.cle));
      const b = L.carnetVide({ cle: k, nom: nom || k, tenancier, region: region || ctx.etat.groupe.region });
      ctx.etat.marche = { ...m, boutiques: [...m.boutiques, b] };
      noter(ctx, tx("Marche.Journal.Boutique", { boutique: b.nom }));
      await terminer(ctx);
      return { ok: true, boutique: structuredClone(b) };
    }),

    // L'étal du groupe au marché forain (lot 10) : des biens de ses stocks posés à son prix (le cours par défaut), payés en `contre` ;
    // il vend les jours du marché, même sans le groupe ; un gardien décourage les voleurs.
    tenirEtal: ecriture(async ({ marche = "", biens: poses = {}, prix = {}, contre = "nourriture", gardien = "" } = {}) => {
      const ctx = ouvrirCtx();
      const m = etatMarche(ctx);
      const mk = trouverMarche(m, marche);
      if (!mk || mk.foire) throw clair(t("LAKOUR_SURVIE.Marche.Erreurs.Marche"));
      if (!Object.keys(biens(poses)).length) throw clair(t("LAKOUR_SURVIE.Gestion.EtalVide"));
      const s = L.retirerStocks(stocksDuGroupe(ctx), biens(poses));
      if (Object.keys(s.manque).length) throw clair(localiser({ cle: "manque", params: { manque: s.manque }, texte: "" }));
      const id = `e${(m.etals ?? []).reduce((n, e) => Math.max(n, Number(String(e.id).slice(1)) || 0), 0) + 1}`;
      const e = L.creerEtal({ id, marche: mk.cle, biens: poses, prix, contre, gardien, jour: jourCtx(ctx) });
      ctx.etat.marche = { ...m, etals: [...(m.etals ?? []), e] };
      await ecrireStocks(ctx, s.stocks);
      noter(ctx, tx("Gestion.Journal.Etal", { marche: mk.nom, biens: texteBiens(e.biens) }));
      await terminer(ctx);
      return { etal: structuredClone(e) };
    }),
    // Relever la caisse de l'étal ; fermer : ce qui reste revient aussi aux stocks.
    releverEtal: ecriture(async ({ etal = "", fermer = false } = {}) => {
      const ctx = ouvrirCtx();
      const m = etatMarche(ctx);
      const e = (m.etals ?? []).find(x => x.id === etal) ?? ((m.etals ?? []).length === 1 && !etal ? m.etals[0] : null);
      if (!e) throw clair(t("LAKOUR_SURVIE.Gestion.EtalInconnu"));
      const r = L.releverEtal(e);
      const rendus = { ...r.releve };
      if (fermer) for (const [k, q] of Object.entries(r.etal.biens ?? {})) rendus[k] = (rendus[k] ?? 0) + q;
      ctx.etat.marche = { ...m, etals: fermer ? m.etals.filter(x => x.id !== e.id) : m.etals.map(x => (x.id === e.id ? r.etal : x)) };
      await ecrireStocks(ctx, L.ajouterStocks(stocksDuGroupe(ctx), rendus));
      noter(ctx, tx(fermer ? "Gestion.Journal.EtalFerme" : "Gestion.Journal.Caisse", { biens: texteBiens(r.releve), rendus: texteBiens(rendus) }));
      await terminer(ctx);
      return { releve: r.releve, rendus, etal: fermer ? null : structuredClone(r.etal) };
    }),
    crediter: ecriture(async ({ boutique = "", biens: pris = {}, pnjId = "", cibles = [], faction = "", parleurId = "" } = {}) => {
      const ctx = ouvrirCtx();
      const m = etatMarche(ctx);
      const b = trouverBoutique(m, boutique);
      if (!b) throw clair(t("LAKOUR_SURVIE.Marche.Erreurs.Boutique"));
      const conf = confianceDe(ctx.etat, { pnjId: pnjId || b.tenancier, cibles, faction });
      // Lot 10 : le carnet prête selon la confiance du commerçant (la réputation et la parole du client).
      const facteur = L.confianceDuCommercant(clientDe(ctx.etat, parleurId));
      const r = L.prendreACredit(b, { debiteur: GROUPE, biens: pris, cours: cours(ctx.etat), jour: jourCtx(ctx), confiance: conf, facteur });
      if (!r.ok) return { ok: false, raison: localiser(lisible(r.motif)), confiance: conf, facteur };
      ctx.etat.marche = { ...m, boutiques: m.boutiques.map(x => (x.cle === b.cle ? r.carnet : x)) };
      await ecrireStocks(ctx, L.ajouterStocks(stocksDuGroupe(ctx), biens(pris)));
      noter(ctx, tx("Marche.Journal.Credit", { boutique: b.nom, biens: texteBiens(pris), valeur: r.entree.valeur }));
      await terminer(ctx);
      return { ok: true, entree: r.entree, dette: L.detteDe(r.carnet, GROUPE), plafond: L.plafondCredit(r.carnet, GROUPE, conf, facteur), confiance: conf, facteur };
    }),
    rendre: ecriture(async ({ boutique = "", biens: rendus = {}, cibles = [] } = {}) => {
      const ctx = ouvrirCtx();
      const m = etatMarche(ctx);
      const b = trouverBoutique(m, boutique);
      if (!b) throw clair(t("LAKOUR_SURVIE.Marche.Erreurs.Boutique"));
      const s = L.retirerStocks(stocksDuGroupe(ctx), biens(rendus));
      if (Object.keys(s.manque).length) throw clair(localiser({ cle: "manque", params: { manque: s.manque }, texte: "" }));
      const r = L.rendreAuCarnet(b, { debiteur: GROUPE, biens: rendus, cours: cours(ctx.etat), jour: jourCtx(ctx) });
      // On ne rend pas plus qu'on ne doit (pas de monnaie pour rendre la différence).
      if (r.surplus > 0) throw clair(t("LAKOUR_SURVIE.Marche.Erreurs.TropRendu", { dette: L.detteDe(b, GROUPE), valeur: r.valeur }));
      ctx.etat.marche = { ...m, boutiques: m.boutiques.map(x => (x.cle === b.cle ? r.carnet : x)) };
      await ecrireStocks(ctx, s.stocks);
      const a = acteur(b.tenancier);
      if (a && r.paye > 0) noterUsure(ctx, a, await userPrejugesDe(a, { cibles: listeIds(cibles), echanges: 1 }));
      noter(ctx, tx("Marche.Journal.Rendu", { boutique: b.nom, paye: r.paye, reste: r.reste }));
      await terminer(ctx);
      return { ok: true, paye: r.paye, reste: r.reste, surplus: r.surplus };
    }),
    // Le tenancier efface une dette (après un cyclone, un deuil) ; ou le carnet se solde d'un coup (Nouvel An passé sans l'horloge).
    effacerDette: ecriture(async ({ boutique = "", debiteur = GROUPE } = {}) => {
      const ctx = ouvrirCtx();
      const m = etatMarche(ctx);
      const b = trouverBoutique(m, boutique);
      if (!b) throw clair(t("LAKOUR_SURVIE.Marche.Erreurs.Boutique"));
      const r = L.effacerDettes(b, debiteur);
      ctx.etat.marche = { ...m, boutiques: m.boutiques.map(x => (x.cle === b.cle ? r.carnet : x)) };
      noter(ctx, lisible(tx("Marche.Journal.Efface", { boutique: b.nom, debiteur, parts: r.efface })));
      await terminer(ctx);
      return { efface: r.efface };
    }),
    solderCarnet: ecriture(async ({ boutique = "", remises = [] } = {}) => {
      const ctx = ouvrirCtx();
      const m = etatMarche(ctx);
      const b = trouverBoutique(m, boutique);
      if (!b) throw clair(t("LAKOUR_SURVIE.Marche.Erreurs.Boutique"));
      const annee = L.dateDuJour(jourCtx(ctx), dateDepart()).annee;
      const r = L.solderAuNouvelAn(b, { annee, remises: listeIds(remises) });
      ctx.etat.marche = { ...m, boutiques: m.boutiques.map(x => (x.cle === b.cle ? r.carnet : x)) };
      if (!r.deja) noter(ctx, { cle: "carnet-nouvel-an", params: { boutique: b.nom, soldes: r.soldes.length, impayees: r.impayees.length }, texte: "" });
      await terminer(ctx);
      return { deja: r.deja, soldes: r.soldes, impayees: r.impayees, remises: r.remises };
    }),

    // Les marchés forains et les foires.
    ouvrirMarche: ecriture(async ({ modele = "", foire = "", nom = "", region = "", lieu = "", jourSemaine = 6, bastions = [], hote = "", recolte = null, duree = 3 } = {}) => {
      const ctx = ouvrirCtx();
      const m = etatMarche(ctx);
      const preset = modele ? L.liste(c().marches).find(x => x.cle === modele) : null;
      const f = foire ? L.liste(c().foires).find(x => x.cle === foire) : null;
      if ((modele && !preset) || (foire && !f)) throw clair(t("LAKOUR_SURVIE.Marche.Erreurs.Modele"));
      const base = f ? { cle: f.cle, nom: f.nom, region: f.region, lieu: lieu || "", jourSemaine: 0, bastions: listeIds(bastions), recolte: f.recolte, foire: true, duree }
        : preset ? { cle: preset.cle, nom: preset.nom, region: preset.region, lieu: preset.lieu, jourSemaine: preset.jourSemaine, bastions: [...preset.bastions, ...listeIds(bastions)] }
        : { cle: slug(nom), nom, region: region || ctx.etat.groupe.region, lieu, jourSemaine: Number(jourSemaine), bastions: listeIds(bastions), recolte, foire: false };
      if (!base.nom) throw clair(t("LAKOUR_SURVIE.Marche.Erreurs.Nom"));
      const mk = L.creerMarche({ ...base, cle: cleLibre(base.cle, m.marches.map(x => x.cle)), hote, jour: jourCtx(ctx) });
      ctx.etat.marche = { ...m, marches: [...m.marches, mk] };
      noter(ctx, tx(mk.foire ? "Marche.Journal.Foire" : "Marche.Journal.Marche", { marche: mk.nom, jour: t(`LAKOUR_SURVIE.Marche.Jours.${mk.jourSemaine}`) }));
      await terminer(ctx);
      return { marche: structuredClone(mk) };
    }),
    fermerMarche: ecriture(async ({ marche = "" } = {}) => {
      const ctx = ouvrirCtx();
      const m = etatMarche(ctx);
      const mk = trouverMarche(m, marche);
      if (!mk) throw clair(t("LAKOUR_SURVIE.Marche.Erreurs.Marche"));
      ctx.etat.marche = { ...m, marches: m.marches.filter(x => x.cle !== mk.cle) };
      noter(ctx, tx("Marche.Journal.Ferme", { marche: mk.nom }));
      await terminer(ctx);
      return { ferme: mk.cle };
    }),
    // Accueillir le marché à son abri (hote « groupe ») ou le rendre (hote vide) : signature et réputation (logique marche.mjs).
    accueillir: ecriture(async ({ marche = "", hote = GROUPE } = {}) => {
      const ctx = ouvrirCtx();
      const m = etatMarche(ctx);
      const mk = trouverMarche(m, marche);
      if (!mk) throw clair(t("LAKOUR_SURVIE.Marche.Erreurs.Marche"));
      ctx.etat.marche = { ...m, marches: m.marches.map(x => (x.cle === mk.cle ? { ...x, hote: String(hote ?? "") } : x)) };
      noter(ctx, tx(hote === GROUPE ? "Marche.Journal.Accueil" : "Marche.Journal.FinAccueil", { marche: mk.nom }));
      await terminer(ctx);
      return { marche: mk.cle, hote, signature: L.signatureDuMarche(ctx.etat.marche) };
    }),
    // Rompre la trêve : rumeur vraie sur toute l'île ; si c'est le groupe, -3 de réputation auprès de chaque faction du conseil.
    rompreTreve: ecriture(async ({ marche = "", par = GROUPE } = {}) => {
      const ctx = ouvrirCtx();
      const m = etatMarche(ctx);
      const mk = trouverMarche(m, marche);
      if (!mk) throw clair(t("LAKOUR_SURVIE.Marche.Erreurs.Marche"));
      const r = L.rompreTreve(mk, { par, jour: jourCtx(ctx) });
      ctx.etat.marche = { ...m, marches: m.marches.map(x => (x.cle === mk.cle ? r.marche : x)) };
      rumeurCtx(ctx, { ...r.rumeur, auteur: "" });
      const faites = par === GROUPE ? await appliquerReputation(r.reputation) : {};
      alerter(ctx, "treve", lisible(r.rumeur.texte));
      // Le sens moral (§14) : rompre la trêve, c'est frapper dans le périmètre des gens qui ne menaçaient pas (acte « attaquer »).
      const sens = await acteDuMarche(ctx, par, "attaquer");
      await terminer(ctx);
      return { marche: mk.cle, reputation: faites, sens };
    }),
    retablirTreve: ecriture(async ({ marche = "" } = {}) => {
      const ctx = ouvrirCtx();
      const m = etatMarche(ctx);
      const mk = trouverMarche(m, marche);
      if (!mk) throw clair(t("LAKOUR_SURVIE.Marche.Erreurs.Marche"));
      ctx.etat.marche = { ...m, marches: m.marches.map(x => (x.cle === mk.cle ? L.retablirTreve(x) : x)) };
      noter(ctx, tx("Marche.Journal.Treve", { marche: mk.nom }));
      await terminer(ctx);
      return { marche: mk.cle };
    }),

    // Le Ladi Lafé. sujet « groupe » : une rumeur sur le groupe. vraie, malveillant, auteur : au secret (monde scellé).
    // -> { id, colporteur } : colporteur = l'auteur qui dit du mal (vers le rouge quand le sens moral existera).
    rumeur: ecriture(async ({ sujet = GROUPE, texte = "", vraie = true, malveillant = false, auteur = "", portee = "region", contre = true } = {}) => {
      const ctx = ouvrirCtx();
      if (!String(texte).trim()) throw clair(t("LAKOUR_SURVIE.Marche.Erreurs.Texte"));
      const r = rumeurCtx(ctx, { sujet, texte: String(texte), vraie: Boolean(vraie), malveillant: Boolean(malveillant), auteur, portee, contre: Boolean(contre), source: "colporte" });
      // Le sens moral (§14) : le colporteur, s'il est un survivant (ou le groupe), porte l'acte « colporter ».
      const sens = r.colporteur ? await acteDuMarche(ctx, r.colporteur, "colporter") : null;
      await terminer(ctx);
      return { id: r.rumeur.id, colporteur: r.colporteur, sens };
    }),
    dementir: ecriture(async ({ id = "", preuve = "fait" } = {}) => {
      const ctx = ouvrirCtx();
      const r = L.dementirRumeur(etatMarche(ctx), secretMarche(ctx), { id, preuve, jour: jourCtx(ctx) });
      if (!r.ok) return { ok: false, raison: localiser(r.motif) };
      ctx.etat.marche = r.marche;
      ctx.monde.marche = r.secret;
      noter(ctx, tx("Marche.Journal.Dementie", { preuve: t(`LAKOUR_SURVIE.Marche.Preuves.${L.PREUVES.includes(preuve) ? preuve : "fait"}`) }));
      if (r.rumeur) noter(ctx, tx("Marche.Journal.Rumeur", { texte: sansBalises(localiser(lisible(r.rumeur))) }));
      // Le sens moral (§14) : un mensonge démenti, si son auteur est un survivant (ou le groupe), est l'acte « mentir ».
      const sens = r.menteur ? await acteDuMarche(ctx, r.menteur, "mentir") : null;
      await terminer(ctx);
      return { ok: true, menteur: r.menteur, sens };
    }),
    // Les faits démentent un préjugé sous les yeux des PNJ (tous ceux qui le portent, ou ceux qu'on nomme) : un cran de moins.
    dementirPrejuge: ecriture(async ({ cible = "", pnj = [] } = {}) => {
      const ctx = ouvrirCtx();
      if (!cible) throw clair(t("LAKOUR_SURVIE.Marche.Erreurs.Cible"));
      const ids = listeIds(pnj);
      const acteurs = (ids.length ? ids.map(acteur) : (game.actors?.contents ?? []))
        .filter(a => a?.type === "survivant" && (aPlat(a.system).prejuges ?? []).some(p => p.cible === cible));
      const touches = [];
      for (const a of acteurs) {
        const r = await userPrejugesDe(a, { cibles: [cible], dementi: true });
        if (r.uses.length) touches.push(a.name);
        noterUsure(ctx, a, r);
      }
      noter(ctx, tx("Marche.Journal.Dementi", { cible: nomCible(cible), n: touches.length }));
      await terminer(ctx);
      return { cible, pnj: touches };
    }),
    // Les préjugés d'un PNJ (le MJ les écrit) : [{ cible, poids 1..3, dit }].
    prejuges: ecriture(async ({ acteurId = "", prejuges = [] } = {}) => {
      const a = acteur(acteurId);
      if (!a || a.type !== "survivant") throw erreur("ActeurInconnu");
      const liste = (prejuges ?? []).map(L.normaliserPrejuge).filter(p => p.cible);
      await a.update({ system: { prejuges: liste } });
      return { prejuges: liste };
    }, { partie: false }),
    // Un des gens du marché (registre « marchands ») devient un acteur PNJ, avec ses préjugés.
    creerMarchand: ecriture(async ({ cle = "" } = {}) => {
      const def = L.liste(c().marchands).find(x => x.cle === cle);
      if (!def) throw clair(t("LAKOUR_SURVIE.Marche.Erreurs.Marchand"));
      const deja = (game.actors?.contents ?? []).find(a => a.type === "survivant" && a.flags?.["lakour-survie"]?.marchand === cle);
      if (deja) return { acteurId: deja.id, deja: true };
      const a = await Actor.implementation.create({ name: def.nom, type: "survivant", img: "icons/svg/mystery-man.svg",
        system: { statut: "pnj", lien: def.role, notes: `<p>${def.apparence}</p>${def.description}`, prejuges: def.prejuges.map(L.normaliserPrejuge),
          // Son esprit (le lot moral, §14 : regard, foi ou ancrage, sens moral, autorité), écrit d'après son histoire.
          ...(def.esprit ? espritDuTirage(def.esprit, c()) : {}) },
        flags: { "lakour-survie": { marchand: cle } }, prototypeToken: { name: def.nom, actorLink: true, disposition: 0 } });
      return { acteurId: a.id, deja: false };
    }, { partie: false }),

    // Les objets marqués : le signe du groupe, marquer un objet, réclamer un objet (marque, témoins, parole contre parole).
    signe: ecriture(async ({ signe = "" } = {}) => {
      const ctx = ouvrirCtx();
      ctx.etat.marche = { ...etatMarche(ctx), signe: String(signe ?? "").trim().slice(0, 80) };
      noter(ctx, tx("Marche.Journal.Signe", { signe: ctx.etat.marche.signe || "—" }));
      await terminer(ctx);
      return { signe: ctx.etat.marche.signe };
    }),
    marquerObjet: ecriture(async ({ acteurId = "", objetId = "", signe = null } = {}) => {
      const a = acteur(acteurId);
      const o = a?.items?.get?.(objetId);
      if (!o || o.type !== "equipement") throw erreur("ActeurInconnu");
      const marque = String(signe ?? L.marcheDe(lireEtat()).signe ?? "").trim();
      if (!marque) throw clair(t("LAKOUR_SURVIE.Marche.Erreurs.Signe"));
      await o.update({ system: { marque } });
      return { marque };
    }),
    // reclamant : qui réclame (un nom de PNJ) ; son signe ; témoins : { reclamant, possesseur }. L'objet est au groupe.
    reclamer: ecriture(async ({ acteurId = "", objetId = "", reclamant = "", signeReclamant = "", temoins = {} } = {}) => {
      const ctx = ouvrirCtx();
      const o = acteur(acteurId)?.items?.get?.(objetId);
      if (!o) throw erreur("ActeurInconnu");
      const v = L.reclamerObjet({ marque: o.system?.marque ?? "", signeReclamant, signePossesseur: etatMarche(ctx).signe, temoins });
      if (v.menteur === "reclamant" && reclamant) {
        rumeurCtx(ctx, { sujet: reclamant, vraie: true, contre: true, portee: "region", source: "mensonge",
          texte: { cle: "rumeur-menteur", params: { auteur: reclamant, sujet: o.name }, texte: `${reclamant} a menti sur ${o.name}.` } });
      }
      noter(ctx, tx("Marche.Journal.Reclamation", { objet: o.name, issue: t(`LAKOUR_SURVIE.Marche.Issues.${v.issue}`) }));
      // Le sens moral (§14) : un objet qu'on disait sien, démenti par une marque ou des témoins, est l'acte « mentir » de qui le porte.
      const sens = v.menteur === "possesseur" ? await acteDuMarche(ctx, acteurId, "mentir") : null;
      await terminer(ctx);
      return { ...v, sens };
    })
  };

  // Une fête partagée (feter({ invites })) : chaque préjugé des PNJ invités perd un cran. -> [{ pnj, uses, tombes }]
  async function feteInvites(ctx, invites = []) {
    const sortie = [];
    for (const id of listeIds(invites)) {
      const a = acteur(id);
      if (!a || a.type !== "survivant") continue;
      const r = await userPrejugesDe(a, { fete: true });
      noterUsure(ctx, a, r);
      sortie.push({ pnj: a.name, uses: r.uses, tombes: r.tombes });
    }
    if (sortie.length) noter(ctx, tx("Marche.Journal.FetePartagee", { invites: sortie.map(x => x.pnj).join(", ") }));
    return sortie;
  }

  return { api, journee, feteInvites, palierFaction, confianceDe, cours };
}
