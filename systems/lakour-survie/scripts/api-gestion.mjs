// La table de gestion, les rangs, le passage entre abris et le changement de religion dans l'API game.lakourSurvie (lot 10, contrat
// §22). La logique est pure (logique/gestion.mjs, chefs.mjs, esprit.mjs) ; ici, on l'applique à l'état public et aux acteurs.
//
// fonctionsGestion(outils) reçoit les aides internes de api.mjs et rend les fonctions à étaler dans game.lakourSurvie :
// - tableDeGestion()                         -> lecture : chaque membre (rang, tâche, corvée, grille de priorités, la tâche qu'elle
//                                               donnerait), les quotas et où ils en sont, les stocks de l'abri (ce qu'on voit à la table)
// - priorites({ acteurId, grille, effacer }) -> la grille d'un membre : { tache: 0..4 } (0 : ne le fait pas ; 1 d'abord)
// - quota({ acteurId, tache, jours, retirer })-> « tant de jours par semaine à telle tâche », suivi sans punition
// - corvee({ acteurId, corvee })             -> la sous-tâche que fait un membre (de la couleur, aucun effet)
// - second({ acteurId, retirer })            -> nommer ou retirer un second (le second succède au chef)
// - admettre({ acteurId })                   -> un nouveau devient membre tout de suite
// - passage({ communauteId, ouvert })        -> l'accord de passage avec une communauté voisine, donné ou retiré
// - convertir({ acteurId, religion, religions, lieu }) -> changer de religion dans un lieu de culte (logique/esprit.mjs)
import * as L from "../logique/index.mjs";
import { t, lireEtat, acteur, survivantsDuGroupe, abriCourant, aPlat, localiser } from "./donnees.mjs";

export function fonctionsGestion({ ecriture, ouvrirCtx, terminer, noter, tx, jourCtx, contenu, clair, erreur, systemeLogique, abriLogique, besoinsBruts }) {
  const membresDe = etat => survivantsDuGroupe(etat);
  const exigerMembre = (ctx, id) => {
    const a = acteur(id);
    if (!a || a.type !== "survivant") throw erreur("ActeurInconnu");
    if (!(ctx.etat.groupe.membres ?? []).includes(a.id)) throw erreur("PasMembre");
    return a;
  };

  // Lecture : la table de gestion de l'abri.
  function tableDeGestion(etat = lireEtat()) {
    if (!etat?.demarree) return null;
    const c = contenu();
    const jour = L.jourDe(etat.horloge?.quart ?? 0);
    const membres = membresDe(etat);
    const ab = abriCourant(etat);
    const abri = ab ? abriLogique(ab) : null;
    const actifs = membres.filter(a => L.peutAgir(a.system)).map(a => ({ id: a.id, system: systemeLogique(a) }));
    const besoins = besoinsBruts(etat);
    const plan = L.repartirParPriorites(actifs, etat, { besoins, abri, contenu: c });
    const auto = L.repartir(actifs.filter(m => m.system.statut !== "joueur"), besoins, c);
    const dispo = L.travailDisponible(L.situationDeLAbri(actifs, abri, c));
    return {
      jour, semaine: L.semaineDe(jour), disponible: dispo,
      membres: membres.map(a => {
        const s = systemeLogique(a);
        const propre = L.grilleDe(etat, a.id);
        return { id: a.id, nom: a.name, statut: s.statut, rang: L.rangDuMembre(etat, a.id, jour), actif: L.peutAgir(s), tache: s.tache ?? "",
          corvee: etat.groupe?.corvees?.[a.id] ?? "", grille: propre ?? L.grilleParDefaut(s, auto[a.id] ?? s.tache ?? ""), grillePropre: Boolean(propre),
          prendrait: plan[a.id] ?? "",
          niveaux: Object.fromEntries(L.TACHES_GRILLE.map(k => [k, L.peutFaire(s, k) ? L.niveauTache(s, k, c) : null])) };
      }),
      quotas: (etat.groupe?.quotas ?? []).map(q => ({ ...q, nom: acteur(q.acteurId)?.name ?? q.acteurId, ...L.etatDuQuota(q) })),
      seconds: L.secondsDe(etat), stocks: ab ? structuredClone(aPlat(ab.system).stocks ?? {}) : structuredClone(etat.groupe?.porte ?? {})
    };
  }

  return {
    tableDeGestion: () => tableDeGestion(),
    // Les corvées du contenu (d'une tâche, ou toutes).
    corvees: ({ tache = "" } = {}) => L.corveesDe(contenu(), tache).map(x => ({ cle: x.cle, nom: x.nom, tache: x.tache, description: x.description ?? "" })),
    priorites: ecriture(async ({ acteurId = "", grille = {}, effacer = false } = {}) => {
      const ctx = ouvrirCtx();
      const a = exigerMembre(ctx, acteurId);
      ctx.etat = effacer ? L.effacerPriorites(ctx.etat, a.id) : L.reglerPriorites(ctx.etat, a.id, grille);
      noter(ctx, tx(effacer ? "Gestion.Journal.GrilleEffacee" : "Gestion.Journal.Grille", { nom: a.name }));
      await terminer(ctx);
      return { acteurId: a.id, grille: L.grilleDe(ctx.etat, a.id) };
    }),
    quota: ecriture(async ({ acteurId = "", tache = "", jours = 1, retirer = "" } = {}) => {
      const ctx = ouvrirCtx();
      if (retirer) {
        ctx.etat = L.retirerQuota(ctx.etat, retirer);
        await terminer(ctx);
        return { retire: retirer };
      }
      const a = exigerMembre(ctx, acteurId);
      const r = L.poserQuota(ctx.etat, { acteurId: a.id, tache, jours, jour: jourCtx(ctx) });
      if (!r.ok) throw clair(localiser(r.motif));
      ctx.etat = r.etat;
      noter(ctx, tx("Gestion.Journal.Quota", { nom: a.name, tache: t(`LAKOUR_SURVIE.Taches.${tache}`), n: r.quota.jours }));
      await terminer(ctx);
      return { quota: structuredClone(r.quota) };
    }),
    corvee: ecriture(async ({ acteurId = "", corvee = "" } = {}) => {
      const ctx = ouvrirCtx();
      const a = exigerMembre(ctx, acteurId);
      const def = corvee ? L.corveesDe(contenu()).find(x => x.cle === corvee) : null;
      if (corvee && !def) throw clair(t("LAKOUR_SURVIE.Gestion.Erreurs.CorveeInconnue"));
      ctx.etat = L.donnerCorvee(ctx.etat, a.id, def?.cle ?? "");
      if (def) noter(ctx, tx("Gestion.Journal.Corvee", { nom: a.name, corvee: def.nom }));
      await terminer(ctx);
      return { acteurId: a.id, corvee: def?.cle ?? "" };
    }),
    // Les rangs (chefs.mjs).
    second: ecriture(async ({ acteurId = "", retirer = false } = {}) => {
      const ctx = ouvrirCtx();
      const a = exigerMembre(ctx, acteurId);
      const r = L.nommerSecond(ctx.etat, a.id, { retirer: Boolean(retirer), jour: jourCtx(ctx), membre: systemeLogique(a) });
      if (!r.ok) throw clair(localiser(r.motif));
      ctx.etat = r.etat;
      noter(ctx, tx(retirer ? "Gestion.Journal.SecondRetire" : "Gestion.Journal.Second", { nom: a.name }));
      await terminer(ctx);
      return { seconds: L.secondsDe(ctx.etat) };
    }),
    admettre: ecriture(async ({ acteurId = "" } = {}) => {
      const ctx = ouvrirCtx();
      const a = exigerMembre(ctx, acteurId);
      ctx.etat = L.admettre(ctx.etat, a.id);
      noter(ctx, tx("Gestion.Journal.Admis", { nom: a.name }));
      await terminer(ctx);
      return { acteurId: a.id, rang: L.rangDuMembre(ctx.etat, a.id, jourCtx(ctx)) };
    }),
    // L'accord de passage avec une communauté voisine (séparée, §14) : le retirer ferme le passage, et les deux le savent.
    passage: ecriture(async ({ communauteId = "", ouvert = true } = {}) => {
      const ctx = ouvrirCtx();
      const r = L.accordDePassage(ctx.etat, communauteId, { ouvert: Boolean(ouvert), jour: jourCtx(ctx) });
      if (!r.ok) throw erreur("GroupeInconnu");
      ctx.etat = r.etat;
      noter(ctx, r.motif);
      await terminer(ctx);
      return { communaute: structuredClone(r.communaute) };
    }),
    // Changer de religion, dans un lieu de culte (le MJ dit si c'en est un : église, temple, mosquée, pagode, chapelle de bord de
    // route…). Pendant un mois, il tient des deux ; quitter sa religion, ou en changer souvent, se sait (une rumeur vraie).
    convertir: ecriture(async ({ acteurId = "", religion = "", religions = [], lieu = "" } = {}) => {
      const ctx = ouvrirCtx();
      const a = acteur(acteurId);
      if (!a || a.type !== "survivant") throw erreur("ActeurInconnu");
      if (!String(lieu ?? "").trim()) throw clair(t("LAKOUR_SURVIE.Gestion.Erreurs.LieuDeCulte"));
      const r = L.changerDeReligion(systemeLogique(a, ctx.monde), { religion, religions, jour: jourCtx(ctx) }, contenu());
      if (!r.ok) throw clair(localiser(r.motif));
      await a.update({ system: { religion: r.system.religion, religions: r.system.religions, esprit: r.system.esprit } });
      const nomReligion = k => L.indexer(contenu()).religions.get(k)?.nom ?? k;
      noter(ctx, tx("Gestion.Journal.Conversion", { nom: a.name, lieu: String(lieu).slice(0, 80), religion: nomReligion(r.system.religion) }));
      let rumeur = null;
      if ((r.quitte || r.souvent) && ctx.monde) {
        const x = L.lancerRumeur(L.marcheDe(ctx.etat), L.secretMarcheDe(ctx.monde), { sujet: a.name, vraie: true, portee: "quartier", source: "conversion", contre: true,
          jour: jourCtx(ctx), texte: { cle: r.quitte ? "rumeur-quitte-sa-foi" : "rumeur-change-souvent", params: { nom: a.name },
            texte: r.quitte ? `${a.name} a quitté sa religion.` : `${a.name} change encore de religion.` } });
        ctx.etat.marche = x.marche;
        ctx.monde.marche = x.secret;
        rumeur = x.rumeur;
        noter(ctx, tx("Marche.Journal.Rumeur", { texte: t(`LAKOUR_SURVIE.Faits.${x.rumeur.cle}`, { nom: a.name }) }));
      }
      await terminer(ctx);
      return { religion: r.system.religion, religions: r.system.religions, avant: r.avant, quitte: r.quitte, souvent: r.souvent, rumeur };
    })
  };
}
