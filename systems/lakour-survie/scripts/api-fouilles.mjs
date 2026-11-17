// Fouiller, démonter et récolter l'île dans l'API game.lakourSurvie (lot 5 « fouille », contrat §25). La logique est pure
// (logique/fouilles.mjs, actions.mjs) ; ici, on l'applique aux documents et à l'état public.
//
// fonctionsFouilles(outils) reçoit les aides internes de api.mjs et rend :
// - apres(ctx, r, qui)                        -> ce qu'une fouille d'un lieu laisse : les objets trouvés (créés sur le premier fouilleur),
//                                                la bête prise (au groupe) ou l'essaim qui pique (une blessure), le lieu vu (état public)
// - api : les fonctions à étaler dans game.lakourSurvie :
//   lieux({ region })                         -> les lieux de la région par genre (combien, ceux qu'on a vus, ce qu'on en sait) ; au MJ, le
//                                                degré réel des lieux visités
//   gisements({ region })                     -> les milieux et les gisements de la région, ce qui est disponible, ce qui repousse
//   betes()                                   -> les bêtes que le groupe a prises (et le temps qu'il leur reste) ; les mettre en enclos, les
//                                                abattre, les lâcher : mettreEnEnclos, abattre({ beteId }), lacherBetes du lot 8 (api-vivant.mjs)
//   demonter({ installationId, membres })     -> démonter une installation de l'abri : la moitié de ses coûts ; le temps passe
import * as L from "../logique/index.mjs";
import { t, lireEtat, acteur, survivantsDuGroupe, abriCourant, aPlat } from "./donnees.mjs";

export function fonctionsFouilles({ ecriture, ouvrirCtx, terminer, noter, tx, jourCtx, contenu, clair, erreur, chat, carteAction, systemeLogique,
  ecrireSurvivant, avancerInterne, membresValides, donneesObjet, objetsDe, defDe, instancesDe, aLAbri, mondeMJ, texteStocks, journalSecret, motifLisible }) {
  const nomRegion = cle => L.regionDe(contenu(), cle)?.nom ?? cle;
  const nomGenre = cle => L.genreFouille(contenu(), cle)?.nom ?? cle;
  const nomBete = cle => L.beteTrouvee(contenu(), cle)?.nom ?? L.especeDe(contenu(), cle)?.nom ?? cle;
  const nomObjet = cle => { const n = String(L.objetDeFouille(contenu(), cle)?.nom ?? cle); return n.charAt(0).toLowerCase() + n.slice(1); };
  // Les clés des équipements que portent des survivants (pour prendre une bête, démonter, récolter).
  const equipementsDe = qui => [...new Set(qui.flatMap(a => objetsDe(a, "equipement").map(i => i.system?.cle).filter(Boolean)))];
  const lieuxPublics = etat => (etat?.lieux && typeof etat.lieux === "object" ? etat.lieux : {});
  const texteTrouve = trouve => (trouve ?? []).map(x => (L.objetDeFouille(contenu(), x.objet)?.equipement ? nomObjet(x.objet) : `${x.q} ${nomObjet(x.objet)}`)).join(", ");

  // ---------------------------------------------------------------- après une fouille (lieu, démontage, récolte)
  async function apres(ctx, r, qui) {
    const sortie = { objets: [], bete: null, trouve: texteTrouve(r.trouve) };
    if (r.cleLieu && r.lieu) ctx.etat.lieux = { ...lieuxPublics(ctx.etat), [r.cleLieu]: structuredClone(r.lieu) };
    // Les outils et les armes trouvés : des objets sur le premier fouilleur.
    if (qui[0] && (r.equipements ?? []).length) {
      const docs = [];
      for (const { cle, n, qualites = [] } of r.equipements) {
        if (!defDe("equipements", cle)) continue;
        // La qualité tirée (lot 6 « ateliers ») : la fiche de cette qualité dans la même gamme (un marteau de fortune), sinon le champ
        // `qualite` posé sur l'objet (fusion de la vague 3 : outilDeQualite).
        for (let i = 0; i < Math.min(5, n); i++) {
          const o = L.outilDeQualite(contenu(), cle, qualites[i] ?? "");
          docs.push(await donneesObjet("equipement", defDe("equipements", o.cle), o.qualite ? { qualite: o.qualite } : {}));
        }
      }
      if (docs.length) {
        await qui[0].createEmbeddedDocuments("Item", docs);
        sortie.objets = docs.map(d => d.name);
      }
    }
    if (r.bete) {
      const b = r.bete;
      if (b.issue === "prise") {
        const x = L.ajouterBete(ctx.etat, { cle: b.cle, nombre: b.nombre, quart: ctx.etat.horloge.quart, contenu: contenu() });
        ctx.etat = x.etat;
        sortie.bete = { ...x.bete, nom: nomBete(b.cle), issue: "prise" };
      } else if (b.issue === "pique" && qui[0]) {
        const p = L.blesser(systemeLogique(qui[0], ctx.monde), 1);
        await ecrireSurvivant(qui[0], p.system, ctx);
        sortie.bete = { cle: b.cle, nom: nomBete(b.cle), issue: "pique", blesse: qui[0].name };
      } else sortie.bete = { cle: b.cle, nom: nomBete(b.cle), issue: b.issue };
    }
    // Un lieu de culte : le rappel au journal secret (le fait n'est pas public).
    for (const f of r.faits ?? []) if (f.public === false) journalSecret(ctx, f);
    return sortie;
  }
  // Les lignes de la carte de chat d'une fouille de lieu.
  function lignesCarte(r, s) {
    const l = [];
    if (r.lieu) l.push(t("LAKOUR_SURVIE.Fouilles.CarteLieu", { genre: r.lieu.site ? L.siteDe(contenu(), r.lieu.site)?.nom ?? r.lieu.site : nomGenre(r.lieu.genre),
      mot: t(`LAKOUR_SURVIE.Fouilles.Mots.${r.lieu.mot}`), fait: r.lieu.fait, travail: r.lieu.travail }));
    if (r.gisement) l.push(t("LAKOUR_SURVIE.Fouilles.CarteGisement", { gisement: L.gisementDe(contenu(), r.gisement)?.nom ?? r.gisement }));
    if (s.trouve) l.push(t("LAKOUR_SURVIE.Fouilles.Trouve", { objets: s.trouve }));
    if (r.lieu?.demontage) l.push(t("LAKOUR_SURVIE.Fouilles.CarteDemontage", { fait: r.lieu.demontage.fait, travail: r.lieu.demontage.travail }));
    if (s.objets.length) l.push(t("LAKOUR_SURVIE.Fouilles.Objets", { objets: s.objets.join(", ") }));
    if (s.bete) l.push(t(`LAKOUR_SURVIE.Fouilles.Bete.${s.bete.issue}`, { bete: s.bete.nom, nom: s.bete.blesse ?? "" }));
    return l;
  }

  // ---------------------------------------------------------------- lectures
  function lieux({ region = "" } = {}, etat = lireEtat(), monde = mondeMJ()) {
    if (!etat?.demarree) return null;
    const c = contenu();
    const reg = region || etat.groupe?.region || "";
    const vus = Object.entries(lieuxPublics(etat)).filter(([, x]) => x.region === reg);
    const genres = Object.entries(L.lieuxDeLaRegion(c, reg)).map(([genre, nombre]) => {
      const vusGenre = vus.filter(([, x]) => x.genre === genre && !x.site);
      return { genre, nom: nomGenre(genre), nombre, ecarts: L.lieuxDuGenre(c, reg, genre).filter(l => l.ecart).length,
        vus: vusGenre.length, finis: vusGenre.filter(([, x]) => x.fini).length, demontes: vusGenre.filter(([, x]) => x.demonte).length };
    });
    const reels = monde ? L.lieuxDuMonde(monde) : {};
    return { region: reg, nom: nomRegion(reg), genres,
      vus: vus.map(([cle, x]) => ({ ...structuredClone(x), cle, nom: x.site ? L.siteDe(c, x.site)?.nom ?? x.site : `${nomGenre(x.genre)} ${x.n}${x.ecart ? ` (${t("LAKOUR_SURVIE.Fouilles.Ecart")})` : ""}`,
        ...(reels[cle] ? { degre: reels[cle].degre, bete: reels[cle].bete ? nomBete(reels[cle].bete.bete) : "" } : {}) })) };
  }
  function gisements({ region = "" } = {}, etat = lireEtat(), monde = mondeMJ()) {
    if (!etat?.demarree) return null;
    const c = contenu();
    const reg = region || etat.groupe?.region || "";
    const jour = L.jourDe(Number(etat.horloge?.quart) || 0);
    const dispo = monde ? L.gisementsDisponibles(monde, c, reg, jour) : null;
    return { region: reg, nom: nomRegion(reg), milieux: (L.regionDe(c, reg)?.milieux ?? []).map(m => ({ cle: m, nom: L.milieuDe(c, m)?.nom ?? m })),
      gisements: Object.entries(L.gisementsDeRegion(c, reg)).map(([g, n]) => {
        const def = L.gisementDe(c, g);
        return { cle: g, nom: def?.nom ?? g, nombre: n, recoltable: L.recoltable(def), renvoi: def?.renvoi ?? "", ...(dispo ? { disponibles: dispo[g] ?? 0 } : {}) };
      }) };
  }
  function betes(etat = lireEtat()) {
    if (!etat?.demarree) return [];
    const q = Number(etat.horloge?.quart) || 0;
    return L.betesDuGroupe(etat).map(b => ({ ...structuredClone(b), nom: nomBete(b.cle), reste: b.jusqua === null || b.jusqua === undefined ? null : Math.max(0, b.jusqua - q),
      enclosNom: b.enclos ? defDe("installations", b.enclos)?.nom ?? b.enclos : "" }));
  }

  const api = {
    lieux: (args = {}) => lieux(args),
    gisements: (args = {}) => gisements(args),
    betes: () => betes(),
    // Démonter une installation de l'abri (la moitié de ses coûts, tous niveaux compris ; un tiers de son travail ; le plan reste au carnet).
    demonter: ecriture(async ({ installationId, membres = [] } = {}) => {
      const ctx = ouvrirCtx();
      const ab = abriCourant(ctx.etat);
      if (!ab) throw erreur("SansAbri");
      if (!aLAbri(ctx.etat, ab)) throw erreur("PasALAbri");
      const inst = instancesDe(ab).find(i => i.id === installationId);
      const def = inst ? defDe("installations", inst.cle) : null;
      if (!inst || !def) throw clair(t("LAKOUR_SURVIE.Erreurs.InstallationInconnue", { installation: installationId }));
      const qui = membresValides(ctx, membres);
      const d = L.demontageInstallation(inst, def);
      const quarts = Math.max(1, Math.ceil(d.travail / Math.max(1, qui.length)));
      await ab.update({ system: { stocks: L.ajouterStocks(aPlat(ab.system).stocks, d.rend), bruit: Math.min(10, (Number(ab.system.bruit) || 0) + 1) } });
      await ab.deleteEmbeddedDocuments("Item", [installationId]);
      noter(ctx, tx("Faits.installation-demontee", { installation: def.nom ?? inst.cle, butin: { ...d.rend } }));
      await chat(carteAction({ icone: "fa-screwdriver-wrench", titre: t("LAKOUR_SURVIE.Fouilles.DemonterInstallation", { installation: def.nom ?? inst.cle }),
        lignes: [t("LAKOUR_SURVIE.Action.Qui", { noms: qui.map(a => a.name).join(", ") || "—" }), t("LAKOUR_SURVIE.Action.Butin", { butin: texteStocks(d.rend) || t("LAKOUR_SURVIE.Action.Rien") })] }));
      await avancerInterne(ctx, quarts);
      await terminer(ctx);
      return { ok: true, rend: d.rend, travail: d.travail, quarts };
    })
  };
  return { apres, lignesCarte, equipementsDe, api };
}
