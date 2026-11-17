// Percevoir dans le noir, le vent et la pluie dans l'API game.lakourSurvie (lot « sens », contrat §18). La logique est pure
// (logique/sens.mjs) ; ici, on l'applique aux documents et à l'état public.
//
// fonctionsSens(outils) reçoit les aides internes de api.mjs et rend les fonctions à étaler dans game.lakourSurvie :
// - sens()                                   -> ce que le groupe perçoit maintenant (public : rien de la graine ni du monde réel)
// - noir({ acteurId, action, nuits })        -> l'habitude du noir d'un survivant : « lumiere » (il allume : un palier de moins
//                                               jusqu'à la fin de la nuit), « nuit » (une nuit dans le noir que le temps n'a pas
//                                               comptée : bivouac, nuit dehors), « regler » (nuits = n)
// - nettoyer({ region, site, tues })         -> une rue, un lieu nettoyé : les rencontres de fouille y baissent, puis il se repeuple
// - jouer({ musiciens, air })                -> une veillée en musique : +1 moral au plus une fois par semaine, du bruit
// - approche({ creature, vent, bruit })      -> les dés de discrétion pour approcher ou fuir un Livide de cette sorte
import * as L from "../logique/index.mjs";
import { borner } from "../logique/constantes.mjs";
import { t, lireEtat, acteur, survivantsDuGroupe, abriCourant, aPlat } from "./donnees.mjs";

export function fonctionsSens({ ecriture, ouvrirCtx, terminer, noter, tx, jourCtx, contenu, dateDepart, clair, erreur, chat, carteAction, systemeLogique,
  bilanVivant, mondeMJ, fetesDuJeu, aLAbri }) {
  const nomRegion = cle => L.regionDe(contenu(), cle)?.nom ?? cle;
  const nomSite = cle => L.siteDe(contenu(), cle)?.nom ?? cle;

  // Ce que le groupe perçoit (public). Le temps (pluie, brume, vent) vient de etat.temps, écrit par le MJ actif à chaque écriture.
  function sens(etat = lireEtat(), monde = mondeMJ()) {
    if (!etat?.demarree) return null;
    const c = contenu();
    const quart = Number(etat.horloge?.quart) || 0, jour = L.jourDe(quart), moment = L.momentDe(quart);
    const region = etat.groupe?.enRoute?.vers ?? etat.groupe?.region ?? "";
    const reg = L.regionDe(c, region);
    const temps = etat.temps?.quart === quart && etat.temps?.region === region ? etat.temps : null;
    const b = monde ? bilanVivant(etat, monde) : etat.bilan ?? null;
    const membres = survivantsDuGroupe(etat).filter(a => L.peutAgir(a.system)).map(a => {
      const s = systemeLogique(a, monde);
      const n = L.noirDe(s);
      return { id: a.id, nom: a.name, nuits: n.nuits, palier: L.palierNoir(n.nuits), effectif: L.palierNoirEffectif(s, quart) };
    });
    const d = L.dateDuJour(jour, dateDepart());
    const reposLe = Math.max(-1, ...(etat.morts ?? []).map(m => Number(m.reposLe ?? -1)));
    const mortLe = Math.max(-1, ...(etat.morts ?? []).map(m => L.jourDe(m.quart)));
    const musique = L.momentMusical({ moment, lune: L.lune(d.iso)?.phase ?? "", jour, mois: d.mois, jourMois: d.jourMois,
      reposLe: reposLe >= 0 ? reposLe : null, mortLe: mortLe >= 0 ? mortLe : null,
      autonomeLe: etat.autonome && Number(etat.joursAutonomes) === L.SEUIL_AUTONOMIE ? jour : null,
      fete: (fetesDuJeu(d.iso, c.fetes ?? []) ?? []).find(f => f.coeur)?.cle ?? "" });
    return {
      quart, jour, moment, region,
      pluie: Boolean(temps?.pluie), brume: Boolean(temps?.brume), vent: temps?.vent ?? null,
      voix: reg ? L.voixDeLaRegion(reg) : "", musique,
      odeur: b ? { odeur: Number(b.odeur) || 0, betes: Number(b.odeurBetes) || 0, sources: b.odeurSources ?? [], sousLeVent: temps?.vent?.vers ?? "" } : null,
      ravine: b?.ravine ?? "",
      corps: reg ? L.corpsDesLivides({ jour, altitude: reg.altitude }) : null,
      accoutumance: membres,
      nettoyes: structuredClone(etat.nettoyes ?? []).map(x => ({ ...x, nom: x.site ? nomSite(x.site) : nomRegion(x.region),
        facteur: L.facteurNettoyage(etat.nettoyes, { region: x.region, site: x.site, jour }) })),
      musiqueLe: etat.groupe?.musiqueLe ?? null
    };
  }

  const ACTIONS_NOIR = ["lumiere", "nuit", "regler"];
  async function noirInterne(ctx, { acteurId, action = "lumiere", nuits = 0 } = {}) {
    const a = acteur(acteurId);
    if (!a || a.type !== "survivant") throw erreur("ActeurInconnu");
    if (!ACTIONS_NOIR.includes(action)) throw clair(t("LAKOUR_SURVIE.Percevoir.Erreurs.Action", { action }));
    const quart = Number(ctx.etat.horloge?.quart) || 0;
    const s = systemeLogique(a, ctx.monde);
    let system = s, palierAvant = L.palierNoir(L.noirDe(s).nuits);
    if (action === "lumiere") system = L.allumerDansLeNoir(s, quart);
    else if (action === "regler") system = { ...s, noir: { ...L.noirDe(s), nuits: Math.max(0, Math.floor(Number(nuits) || 0)) } };
    else {
      // Une nuit que le temps n'a pas comptée : on la date du jour courant (une seule par jour).
      const r = L.compterNuitNoire({ ...s, noir: { ...L.noirDe(s), lumiereLe: null } }, { quart, lumiere: false });
      system = { ...r.system, noir: { ...L.noirDe(r.system), lumiereLe: L.noirDe(s).lumiereLe } };
    }
    const n = L.noirDe(system);
    await a.update({ system: { noir: n } });
    const palier = L.palierNoir(n.nuits);
    if (palier > palierAvant) noter(ctx, L.texteNoir(palier, a.name));
    return { acteurId: a.id, nuits: n.nuits, palier, effectif: L.palierNoirEffectif(system, quart), lumiereLe: n.lumiereLe };
  }

  async function nettoyerInterne(ctx, { region = "", site = "", tues = 0 } = {}) {
    const c = contenu();
    const reg = region || ctx.etat.groupe.region;
    if (!L.regionDe(c, reg)) throw clair(t("LAKOUR_SURVIE.Erreurs.RegionInconnue", { region: reg }));
    if (site && !L.siteDe(c, site)) throw clair(t("LAKOUR_SURVIE.Erreurs.SiteInconnu", { site }));
    const n = Math.floor(Number(tues) || 0);
    if (!(n > 0)) throw clair(t("LAKOUR_SURVIE.Percevoir.Erreurs.Tues"));
    const jour = jourCtx(ctx);
    ctx.etat.nettoyes = L.nettoyerLieu(ctx.etat.nettoyes ?? [], { region: reg, site, jour, tues: n });
    noter(ctx, tx("Percevoir.Journal.Nettoye", { lieu: site ? nomSite(site) : nomRegion(reg), n }));
    return { region: reg, site: site || "", tues: n, facteur: L.facteurNettoyage(ctx.etat.nettoyes, { region: reg, site, jour }) };
  }

  async function jouerInterne(ctx, { musiciens = [], air = "doux" } = {}) {
    const membres = survivantsDuGroupe(ctx.etat).filter(a => L.peutAgir(a.system));
    const qui = [musiciens].flat().filter(Boolean).map(acteur).filter(a => a && membres.includes(a));
    if (!qui.length) throw clair(t("LAKOUR_SURVIE.Percevoir.Erreurs.Musicien"));
    const jour = jourCtx(ctx);
    const v = L.veilleeMusique({ air: air === "fort" ? "fort" : "doux", jour, derniere: ctx.etat.groupe?.musiqueLe ?? null });
    if (v.moral) {
      for (const a of membres) await a.update({ system: { moral: borner((Number(a.system.moral) || 0) + v.moral, 0, 5) } });
      ctx.etat.groupe = { ...ctx.etat.groupe, musiqueLe: v.musiqueLe };
    }
    const ab = abriCourant(ctx.etat);
    if (ab && aLAbri(ctx.etat, ab)) await ab.update({ system: { bruit: borner((Number(aPlat(ab.system).bruit) || 0) + v.bruit, 0, 10) } });
    noter(ctx, tx(`Percevoir.Journal.${v.moral ? "Musique" : "MusiqueSansMoral"}`, { noms: qui.map(a => a.name).join(", ") }));
    await chat(carteAction({ icone: "fa-guitar", titre: t("LAKOUR_SURVIE.Percevoir.Musique"),
      lignes: [t("LAKOUR_SURVIE.Action.Qui", { noms: qui.map(a => a.name).join(", ") }), t(`LAKOUR_SURVIE.Percevoir.Airs.${air === "fort" ? "fort" : "doux"}`)] }));
    return { musiciens: qui.map(a => a.id), air: air === "fort" ? "fort" : "doux", moral: v.moral, bruit: v.bruit };
  }

  // Approcher ou fuir un Livide de cette sorte (bestiaire) : les dés de discrétion en plus ou en moins, à ce quart, là où est le groupe.
  function approche({ creature = "livide-frais", vent = "", bruit = false } = {}) {
    const c = contenu();
    const etat = lireEtat();
    const quart = Number(etat.horloge?.quart) || 0;
    const reg = L.regionDe(c, etat.groupe?.enRoute?.vers ?? etat.groupe?.region ?? "");
    const perception = L.perceptionDe(c, creature);
    if (!perception) throw clair(t("LAKOUR_SURVIE.Percevoir.Erreurs.Creature", { creature }));
    return { creature, des: L.desFaceALivide(perception, { nuit: L.estNuit(L.momentDe(quart)), vent, bruit: Boolean(bruit), altitude: reg?.altitude ?? 0 }), perception };
  }

  const ecrire = fn => ecriture(async (args = {}) => { const ctx = ouvrirCtx(); const r = await fn(ctx, args); await terminer(ctx); return r; });
  return {
    sens: () => sens(),
    approche,
    noir: ecrire(noirInterne),
    nettoyer: ecrire(nettoyerInterne),
    jouer: ecrire(jouerInterne)
  };
}
