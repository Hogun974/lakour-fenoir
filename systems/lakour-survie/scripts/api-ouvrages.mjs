// Bâtir et défendre dans l'API game.lakourSurvie (lot 7, contrat §26). La logique est pure (logique/ouvrages.mjs, avec ses crochets
// dans abri.mjs et etat.mjs) ; ici, on l'applique aux documents.
//
// fonctionsOuvrages(outils) reçoit les aides internes de api.mjs et rend :
// - ouvrages()                                         -> matériau, entretien, défenses de l'abri, risque d'éboulement (lecture)
// - entretenir({ installationId, membres, quarts })    -> un soin à la demande (le délai repart, un cran perdu faute de soin rattrapé)
// - incendie({ force, cause })                         -> le feu sur l'abri (la pierre et le parpaing ne brûlent pas) ; au MJ actif
// et, pour api.mjs : defensesDeLAssaut (les pièges, la hauteur, la porte, la cloche devant un assaut) et eboulementDuChantier (la cave
// qui s'éboule quand on creuse sans savoir étayer, ou près d'une eau qui court).
import * as L from "../logique/index.mjs";
import { t, lireEtat, abriCourant } from "./donnees.mjs";

export function fonctionsOuvrages({ ecriture, ouvrirCtx, terminer, noter, tx, jourCtx, contenu, clair, erreur, chat, carteAction, abriLogique, ecrireAbri,
  membresValides, brasDe, avancerInterne, defDe, aLAbri, savoirsDuGroupe, systemeLogique, ecrireSurvivant }) {
  const nomDe = cle => defDe("installations", cle)?.nom ?? cle;
  const jourDe = etat => Math.floor((Number(etat?.horloge?.quart) || 0) / 4);

  // ---------------------------------------------------------------- lecture
  function ouvrages(etat = lireEtat()) {
    if (!etat?.demarree) return null;
    const ab = abriCourant(etat);
    if (!ab) return { abri: false, installations: [], dus: [], defenses: null };
    const c = contenu();
    const l = abriLogique(ab);
    const jour = jourDe(etat);
    const installations = l.installations.filter(i => i.niveau >= 1).map(i => {
      const def = L.installationDe(c, i.cle);
      const et = def ? L.etatEntretien(i, def, jour) : null;
      const e = def ? L.entretienDe(def, i.niveau) : null;
      return { id: i.id, cle: i.cle, nom: nomDe(i.cle), niveau: i.niveau, etat: i.etat, materiau: L.materiauDe(def, i.niveau),
        entretien: e ? { tousLes: e.tousLes, travail: e.travail, prochain: et?.prochain ?? null, retard: et?.retard ?? null, encrasse: Boolean(et?.encrasse),
          negligence: et?.negligence ?? 0, panne: e.panne, vie: e.vie, tache: L.tacheDeSoin(def, i.niveau) } : null };
    });
    const site = L.siteDe(c, l.system.site) ?? {};
    const chantier = l.installations.find(i => i.chantier?.requis > 0 && L.installationDe(c, i.cle)?.categorie === "souterrain");
    return {
      abri: true, jour, installations,
      dus: L.entretiensDus(l.installations, c, { jour }).map(d => ({ ...d, nom: nomDe(d.cle) })),
      defenses: L.ouvragesDeLAbri(l.installations, c, { jour }),
      eboulement: chantier ? { installation: chantier.cle, chance: L.risqueEboulement({ def: L.installationDe(c, chantier.cle), savoirs: savoirsDuGroupe(etat), site }) } : null
    };
  }

  // ---------------------------------------------------------------- écritures
  async function entretenirInterne(ctx, { installationId = "", membres = [], quarts = 1 } = {}) {
    const ab = abriCourant(ctx.etat);
    if (!ab) throw erreur("SansAbri");
    if (!aLAbri(ctx.etat, ab)) throw erreur("PasALAbri");
    const l = abriLogique(ab);
    const inst = l.installations.find(i => i.id === installationId || i.cle === installationId);
    if (!inst) throw erreur("InstallationAbsente");
    const def = defDe("installations", inst.cle);
    const e = L.entretienDe(def, inst.niveau);
    if (!e?.tousLes) throw clair(t("LAKOUR_SURVIE.Ouvrages.Erreurs.RienAEntretenir", { installation: nomDe(inst.cle) }));
    const q = Math.max(1, Math.min(8, Math.floor(Number(quarts) || 1)));
    const qui = membresValides(ctx, membres);
    const r = L.entretenirInstallation(inst, def, { quarts: q, bras: brasDe(qui, jourCtx(ctx)), jour: jourCtx(ctx) });
    const installations = l.installations.map(i => (i.id === inst.id ? { ...r.instance, id: inst.id } : i));
    await ecrireAbri(ab, { system: {}, installations });
    noter(ctx, tx(r.soigne ? "Ouvrages.Journal.Entretenue" : "Ouvrages.Journal.EntretienEnCours", { installation: nomDe(inst.cle), reste: r.reste }));
    await chat(carteAction({ icone: "fa-screwdriver-wrench", titre: t("LAKOUR_SURVIE.Ouvrages.Entretien", { installation: nomDe(inst.cle) }),
      lignes: [t("LAKOUR_SURVIE.Action.Qui", { noms: qui.map(a => a.name).join(", ") }),
        r.soigne ? t("LAKOUR_SURVIE.Ouvrages.Soignee", { n: r.rattrape ?? 0 }) : t("LAKOUR_SURVIE.Ouvrages.Reste", { reste: r.reste })] }));
    await avancerInterne(ctx, q);
    return { installation: inst.cle, soigne: r.soigne, rattrape: r.rattrape ?? 0, reste: r.reste, etat: r.instance.etat };
  }

  async function incendieInterne(ctx, { force = 1, cause = "" } = {}) {
    const ab = abriCourant(ctx.etat);
    if (!ab) throw erreur("SansAbri");
    const l = abriLogique(ab);
    const f = Math.max(1, Math.min(3, Math.round(Number(force) || 1)));
    const h = L.deriverHasard(ctx.monde?.graine ?? "incendie", "incendie", Number(ctx.etat.horloge?.quart) || 0);
    const r = L.incendieAbri(l.installations, contenu(), { force: f }, h);
    await ecrireAbri(ab, { system: { degats: (Number(l.system.degats) || 0) + r.degatsAbri }, installations: r.installations });
    const brulees = r.brulees.map(b => nomDe(b.cle)).join(", ");
    noter(ctx, tx("Ouvrages.Journal.Incendie", { cause: cause || t("LAKOUR_SURVIE.Ouvrages.FeuInconnu"), brulees: brulees || "—" }));
    await chat(carteAction({ icone: "fa-fire", titre: t("LAKOUR_SURVIE.Ouvrages.Incendie"),
      lignes: [cause || "", brulees ? t("LAKOUR_SURVIE.Ouvrages.Brulees", { installations: brulees }) : t("LAKOUR_SURVIE.Ouvrages.RienBrule"),
        r.degatsAbri ? t("LAKOUR_SURVIE.Ouvrages.DegatsAbri", { n: r.degatsAbri }) : ""] }));
    return { force: f, brulees: r.brulees, epargnees: r.epargnees, degatsAbri: r.degatsAbri };
  }

  // ---------------------------------------------------------------- pour api.mjs
  // Devant un assaut : les pièges retirent de la force aux Livides (ceux qui débordent se comblent), la hauteur évite la brèche, la
  // porte ou l'enceinte prend le coup, la cloche sonne. -> { force, ouvrages, apres(r) -> r', cible(installations, r, h), comblees }
  function defensesDeLAssaut(installations, { force, livides, jour }) {
    const c = contenu();
    const o = L.ouvragesDeLAbri(installations, c, { jour });
    const fo = L.forceDevantOuvrages({ force, livides, ouvrages: o });
    return {
      ouvrages: o, force: fo.force, retire: fo.retire, comblees: fo.comblees,
      apres: (r, garde) => L.issueDevantOuvrages(r, { livides, ouvrages: o, garde }),
      cible: (liste, r, h) => L.cibleDesDegats(liste, c, { livides, appuis: r.appuis, issue: r.issue, hasard: h })
    };
  }

  // Un niveau souterrain qu'on achève : l'éboulement possible (une blessure qui ne tue pas, la dernière cellule à recreuser).
  // avant : l'instance avant ce temps de travail ; resultat : ce qu'a rendu avancerChantier.
  // -> { chance, eboule, blesse: acteurId | null, perdu, resultat } (resultat : le même, ou le chantier rouvert)
  async function eboulementDuChantier(ctx, { def, qui = [], avant, resultat, site = {} }) {
    if (def?.categorie !== "souterrain") return { chance: 0, eboule: false, blesse: null, perdu: 0, resultat };
    const h = L.deriverHasard(ctx.monde?.graine ?? "eboulement", "eboulement", Number(ctx.etat.horloge?.quart) || 0);
    const r = L.eboulement({ def, savoirs: savoirsDuGroupe(ctx.etat), site, avant, resultat, hasard: h });
    if (!r.eboule) return { chance: r.chance, eboule: false, blesse: null, perdu: 0, resultat };
    const victime = qui.length ? qui[Math.floor(h() * qui.length)] : null;
    if (victime) {
      const s = systemeLogique(victime, ctx.monde);
      await ecrireSurvivant(victime, { ...s, blessures: L.blessureQuiNeTuePas(s.blessures) }, ctx);
    }
    noter(ctx, tx("Ouvrages.Journal.Eboulement", { installation: def.nom, nom: victime?.name ?? "—" }));
    return { chance: r.chance, eboule: true, blesse: victime?.id ?? null, perdu: r.perdu, resultat: r.resultat };
  }

  const ecrire = fn => ecriture(async (args = {}) => { const ctx = ouvrirCtx(); const r = await fn(ctx, args); await terminer(ctx); return r; });
  return {
    publiques: { ouvrages: () => ouvrages(), entretenir: ecrire(entretenirInterne), incendie: ecrire(incendieInterne) },
    defensesDeLAssaut, eboulementDuChantier
  };
}
