// Les outils et les ateliers dans l'API game.lakourSurvie (lot 6 « ateliers », contrat §24). La logique est pure
// (logique/armes.mjs, fabrication.mjs) ; ici, on l'applique aux objets des survivants.
//
// fonctionsAteliers(outils) reçoit les aides internes de api.mjs et rend :
// - pour api.mjs : optionsFabrication(etat) (ateliers, lumière, outils en main, objets du groupe), apresFabrication(ctx, r) (objets
//   consommés, outils usés, bruit, eau traitée), userItem(item, n), armeDeTir(acteur), remedeDe(etat, affliction), estCasseItem(item),
//   protegeDe(acteur, cle) ;
// - à étaler dans game.lakourSurvie :
//   - outils({ acteurId })                         -> les outils et armes d'un survivant (ou du groupe) : qualité, usages, état (lecture)
//   - userOutil({ acteurId, objetId, usages })     -> un outil sert (un quart de travail, un combat) : il s'use, et peut casser
//   - reparerOutil({ acteurId, objetId, affuter }) -> la réparation de fortune (1 matériau, un quart) ou l'affûtage (pierre à aiguiser)
import * as L from "../logique/index.mjs";
import { t, lireEtat, acteur, survivantsDuGroupe, abriCourant, aPlat } from "./donnees.mjs";

export function fonctionsAteliers({ ecriture, ouvrirCtx, terminer, noter, tx, contenu, clair, erreur, objetsDe, defDe, avancerInterne, aLAbri, quandDe, instancesDe }) {
  const presents = etat => survivantsDuGroupe(etat).filter(a => L.peutAgir(a.system));
  const defItem = item => defDe("equipements", item?.system?.cle);
  // Le system d'un objet, complété par sa définition (un objet créé avant ce lot n'a ni qualité ni gammes).
  const sysItem = item => {
    const def = defItem(item) ?? {};
    const s = item?.system ?? {};
    const vide = v => v === undefined || v === null || v === "" || v === 0 || v === false || (Array.isArray(v) && !v.length);
    const sortie = { ...def };
    for (const [k, v] of Object.entries(s)) if (!vide(v) || k === "usure" || k === "reparations") sortie[k] = v;
    return sortie;
  };
  const estCasseItem = item => L.estCasse(sysItem(item));
  // Les objets de tous les présents : [{ acteur, item, system }].
  const objetsDuGroupe = etat => presents(etat).flatMap(a => objetsDe(a, "equipement").map(item => ({ acteur: a, item, system: sysItem(item) })));
  const comptes = liste => liste.reduce((o, x) => ({ ...o, [x.system.cle]: (o[x.system.cle] ?? 0) + 1 }), {});

  // Une lumière : un objet qui éclaire (non usé jusqu'au bout) chez un présent, ou, à l'abri, de l'énergie ou un feu de travail.
  function lumiereDe(etat, ab, ici) {
    const porte = objetsDuGroupe(etat).filter(x => x.system.eclaire && !L.estCasse(x.system));
    if (porte.some(x => !L.usagesDe(x.system))) return { lumiere: true, source: null };
    if (ici && ab) {
      const s = aPlat(ab.system);
      if ((Number(s.stocks?.energie) || 0) > 0) return { lumiere: true, source: null };
      const metiers = L.metiersDuContenu(contenu().installations);
      if (instancesDe(ab).some(i => i.niveau >= 1 && i.etat < 3 && (metiers[i.cle] ?? []).includes("cuisine"))) return { lumiere: true, source: null };
    }
    return porte.length ? { lumiere: true, source: porte[0] } : { lumiere: false, source: null };
  }

  // Tout ce que la logique de fabrication demande, pour l'état courant.
  function optionsFabrication(etat = lireEtat()) {
    const ab = abriCourant(etat);
    const ici = Boolean(ab && aLAbri(etat, ab));
    const objets = objetsDuGroupe(etat);
    const enMain = L.outilsEnMain(objets.map(x => ({ ...x, system: x.system })), new Map());
    const q = quandDe(etat);
    const lum = lumiereDe(etat, ab, ici);
    return {
      metiers: L.metiersDuContenu(contenu().installations), aLAbri: ici, nuit: q.moment === "nuit", lumiere: lum.lumiere,
      outils: [...enMain.keys()], objets: comptes(objets), _enMain: enMain, _source: lum.source
    };
  }

  // Un objet sert : n usages de plus. -> { casse, use, etat, usure }
  async function userItem(item, n = 1) {
    const s = sysItem(item);
    if (!L.usagesDe(s)) return { casse: false, use: false, etat: "", usure: Number(s.usure) || 0 };
    const r = L.userOutil(s, n);
    await item.update({ system: { usure: r.usure } });
    return r;
  }

  // Après une fabrication réussie ou non : les outils qui ont servi s'usent (un usage), la lumière portée la nuit aussi ; sur une
  // réussite, les objets demandés sont retirés ; le bruit du travail s'ajoute à celui de l'abri ; un traitement d'eau est posé.
  async function apresFabrication(ctx, r, opts) {
    const notes = [];
    for (const g of r.outils ?? []) {
      const x = opts._enMain?.get(g);
      if (!x?.item) continue;
      const u = await userItem(x.item, 1);
      if (u.casse) notes.push(tx("Ateliers.Journal.Casse", { nom: x.acteur.name, objet: x.item.name }));
    }
    if (opts.nuit && opts._source?.item && r.recetteLumiere) await userItem(opts._source.item, 1);
    if (r.test?.reussite) {
      for (const o of r.consomme ?? []) {
        let reste = o.n;
        for (const x of objetsDuGroupe(ctx.etat).filter(y => y.system.cle === o.cle)) {
          if (reste <= 0) break;
          await x.acteur.deleteEmbeddedDocuments("Item", [x.item.id]);
          reste -= 1;
        }
      }
      if (r.produit?.traitement === "eau") {
        const ab = abriCourant(ctx.etat);
        if (ab) {
          const jour = Math.floor((Number(ctx.etat.horloge?.quart) || 0) / L.QUARTS_PAR_JOUR);
          await ab.update({ system: { eauTraiteeAvant: Math.max(Number(ab.system.eauTraiteeAvant) || 0, jour + r.produit.jours) } });
          notes.push(tx("Ateliers.Journal.EauTraitee", { jours: r.produit.jours }));
        }
      }
    }
    if (r.bruit && opts.aLAbri) {
      const ab = abriCourant(ctx.etat);
      if (ab) await ab.update({ system: { bruit: L.borner((Number(ab.system.bruit) || 0) + r.bruit, 0, 10) } });
    }
    for (const n of notes) noter(ctx, n);
    return notes;
  }

  // La meilleure arme à feu d'un survivant (bonus de tir le plus haut), avec son system complété. -> { item, system } | null
  function armeDeTir(a) {
    const armes = objetsDe(a, "equipement").map(item => ({ item, system: sysItem(item) })).filter(x => L.estArmeAFeu(x.system));
    armes.sort((x, y) => (Number(y.system.bonus?.tir) || 0) - (Number(x.system.bonus?.tir) || 0));
    return armes[0] ?? null;
  }
  // Le meilleur remède du groupe pour une affliction. -> { objet: { acteur, item }, bonus, remplace } | null
  function remedeDe(etat, affliction) {
    const objets = objetsDuGroupe(etat).map(x => ({ ...x, remede: x.system.remede }));
    const r = L.remedePour(affliction, objets);
    return r ? { ...r, objet: { acteur: r.objet.acteur, item: r.objet.item } } : null;
  }
  const protegeDe = (a, cle) => objetsDe(a, "equipement").some(item => (sysItem(item).protege ?? []).includes(cle));

  // ---------------------------------------------------------------- lectures et écritures de l'API
  const survivantDe = id => {
    const a = acteur(id);
    if (!a || a.type !== "survivant") throw erreur("ActeurInconnu");
    return a;
  };
  const vue = (a, item) => {
    const s = sysItem(item);
    return { acteurId: a.id, objetId: item.id, cle: s.cle, nom: item.name, qualite: L.qualiteDe(s), gammes: L.gammesDe(s), usages: L.usagesDe(s),
      usure: Number(s.usure) || 0, restants: L.usagesRestants(s), reparations: Number(s.reparations) || 0, etat: L.etatOutil(s), remise: Boolean(s.remise) };
  };
  function outils({ acteurId = "" } = {}) {
    const etat = lireEtat();
    const qui = acteurId ? [survivantDe(acteurId)] : presents(etat);
    return qui.flatMap(a => objetsDe(a, "equipement").filter(i => L.usagesDe(sysItem(i)) || L.gammesDe(sysItem(i)).length).map(i => vue(a, i)));
  }
  const itemDe = (a, { objetId = "", cle = "" }) => {
    const item = objetsDe(a, "equipement").find(i => i.id === objetId) ?? objetsDe(a, "equipement").find(i => i.system?.cle === cle);
    if (!item) throw clair(t("LAKOUR_SURVIE.Ateliers.Erreurs.ObjetInconnu", { nom: a.name }));
    return item;
  };

  async function userOutilInterne(ctx, { acteurId = "", objetId = "", cle = "", usages = 1 } = {}) {
    const a = survivantDe(acteurId);
    const item = itemDe(a, { objetId, cle });
    const n = Math.max(1, Math.min(20, Math.floor(Number(usages) || 1)));
    const r = await userItem(item, n);
    if (r.casse) noter(ctx, tx("Ateliers.Journal.Casse", { nom: a.name, objet: item.name }));
    else if (r.use && L.estArmeAFeu(sysItem(item))) noter(ctx, tx("Ateliers.Journal.Usee", { nom: a.name, objet: item.name }));
    return { ...vue(a, item), casse: r.casse, devenueUsee: r.use };
  }

  async function reparerOutilInterne(ctx, { acteurId = "", objetId = "", cle = "", affuter = false } = {}) {
    const a = survivantDe(acteurId);
    const item = itemDe(a, { objetId, cle });
    const s = sysItem(item);
    const ab = abriCourant(ctx.etat);
    if (affuter) {
      const lame = L.gammesDe(s).some(g => L.GAMMES_LAMES.includes(g));
      if (!lame) throw clair(t("LAKOUR_SURVIE.Ateliers.Erreurs.PasUneLame", { objet: item.name }));
      if (!objetsDuGroupe(ctx.etat).some(x => x.system.cle === "pierre-a-aiguiser")) throw clair(t("LAKOUR_SURVIE.Ateliers.Erreurs.SansPierre"));
      const r = L.affuterOutil(s);
      if (!r.ok) throw clair(t(`LAKOUR_SURVIE.Faits.${r.motif}`, { objet: item.name }));
      await item.update({ system: { usure: r.usure } });
      noter(ctx, tx("Ateliers.Journal.Affute", { nom: a.name, objet: item.name }));
      await avancerInterne(ctx, 1);
      return { ...vue(a, item), rendu: r.rendu, affute: true };
    }
    const r = L.reparerOutil(s);
    if (!r.ok) throw clair(t(`LAKOUR_SURVIE.Faits.${r.motif}`, { objet: item.name }));
    const cout = L.REGLES_OUTILS.reparation.cout;
    const stocks = ab ? aPlat(ab.system).stocks : (ctx.etat.groupe.porte ?? {});
    const p = L.retirerStocks(stocks, cout);
    if (Object.keys(p.manque).length) throw clair(t("LAKOUR_SURVIE.Ateliers.Erreurs.SansMateriau"));
    if (ab) await ab.update({ system: { stocks: p.stocks } }); else ctx.etat.groupe.porte = p.stocks;
    await item.update({ system: { usure: r.usure, reparations: r.reparations } });
    noter(ctx, tx("Ateliers.Journal.Repare", { nom: a.name, objet: item.name, fois: r.reparations }));
    await avancerInterne(ctx, L.REGLES_OUTILS.reparation.quarts);
    return { ...vue(a, item), rendu: r.rendu };
  }

  const ecrire = fn => ecriture(async (args = {}) => { const ctx = ouvrirCtx(); const r = await fn(ctx, args); await terminer(ctx); return r; });
  return {
    interne: { optionsFabrication, apresFabrication, userItem, armeDeTir, remedeDe, estCasseItem, protegeDe, sysItem },
    api: { outils, userOutil: ecrire(userOutilInterne), reparerOutil: ecrire(reparerOutilInterne) }
  };
}
