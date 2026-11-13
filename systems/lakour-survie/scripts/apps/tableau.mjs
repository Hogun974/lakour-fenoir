// Le tableau de bord du groupe (chez tous) : le groupe (membres × tâches, besoins), les renseignements DATÉS par région et la
// carte de l'île telle que le groupe la connaît, le journal public, et les propositions d'action des joueurs (envoyées au MJ actif
// et au MJ IA). Seulement l'état PUBLIC : les renseignements sont ce que le groupe croit, pas le réel.
import { ID } from "../../logique/constantes.mjs";
import * as L from "../../logique/index.mjs";
import { t, lireEtat, aPlat, echapper, sansBalises, localiser, libelleTache, libelleCompetence, survivantsDuGroupe, monSurvivant } from "../donnees.mjs";
import { CHEMIN, essayer, lireChamps, options } from "./commun.mjs";

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;
const contenu = () => game.lakourSurvie?.contenu?.() ?? {};
const COULEURS_INFESTATION = { inconnue: "#6d6a63", calme: "#7fae6a", presente: "#e0b04a", dense: "#e07b39", grouillante: "#c8423b" };
const COULEURS_ROUTE = { ouverte: "#9fb79a", difficile: "#e0b04a", coupee: "#c8423b" };
export const ONGLETS = ["groupe", "renseignements", "marche", "journal", "propositions"];

// La carte des régions connue (SVG, d'après les repères de la scène « Carte de La Réunion », 4000 × 3000).
export function carteConnue(etat, c = contenu()) {
  const regions = L.regionsDe(c).filter(r => r.repere);
  if (!regions.length) return "";
  const ici = etat.groupe?.enRoute?.vers ?? etat.groupe?.region;
  const traits = [], vus = new Set();
  for (const r of regions) for (const v of r.voisins ?? []) {
    const b = L.regionDe(c, v.region);
    const cle = [r.cle, v.region].sort().join("|");
    if (!b?.repere || vus.has(cle)) continue;
    vus.add(cle);
    const etatRoute = etat.renseignements?.[r.cle]?.routes?.[v.region] ?? etat.renseignements?.[v.region]?.routes?.[r.cle] ?? null;
    traits.push(`<line x1="${r.repere.x}" y1="${r.repere.y}" x2="${b.repere.x}" y2="${b.repere.y}" stroke="${etatRoute ? COULEURS_ROUTE[etatRoute] : "#5a5650"}" stroke-width="${v.terrain === "route" ? 14 : 8}" ${etatRoute ? "" : "stroke-dasharray=\"30 24\""} ${v.terrain === "mer" ? "opacity=\"0.5\"" : ""}><title>${echapper(v.route ?? "")}</title></line>`);
  }
  const points = regions.map(r => {
    const rs = etat.renseignements?.[r.cle] ?? {};
    const couleur = COULEURS_INFESTATION[rs.infestation ?? "inconnue"] ?? COULEURS_INFESTATION.inconnue;
    const age = L.ageRenseignement(rs, L.jourDe(etat.horloge?.quart ?? 0));
    const bulle = `${r.nom} — ${t(`LAKOUR_SURVIE.Infestation.${rs.infestation ?? "inconnue"}`)}${age === null ? "" : ` (${t("LAKOUR_SURVIE.Renseignements.Age", { n: age })})`}`;
    return `<g class="survie-carte-region${r.cle === ici ? " ici" : ""}"><title>${echapper(bulle)}</title>`
      + `${r.cle === ici ? `<circle cx="${r.repere.x}" cy="${r.repere.y}" r="110" fill="none" stroke="#f3d27a" stroke-width="16"/>` : ""}`
      + `<circle cx="${r.repere.x}" cy="${r.repere.y}" r="70" fill="${couleur}" stroke="#1b1612" stroke-width="10" opacity="${age === null ? 0.55 : 1}"/>`
      + `<text x="${r.repere.x}" y="${r.repere.y + 140}" text-anchor="middle" font-size="86" fill="#efe3c8">${echapper(r.nom)}</text></g>`;
  });
  return `<svg class="survie-carte" viewBox="0 0 4000 3000" role="img" aria-label="${echapper(t("LAKOUR_SURVIE.Tableau.Carte"))}">`
    + `<rect width="4000" height="3000" fill="#0d2a3a"/>${traits.join("")}${points.join("")}</svg>`;
}

// Le marché vu par le groupe (état PUBLIC, contrat §12) : le cours du jour, ses dettes aux carnets, les marchés et leurs jours,
// ce qui se dit (les rumeurs encore vivantes ; leur vérité reste au MJ), son signe.
export function marchePublic(etat, c = contenu()) {
  const m = L.marcheDe(etat);
  const jour = L.jourDe(etat.horloge?.quart ?? 0);
  const groupe = t("LAKOUR_SURVIE.Marche.LeGroupe");
  const nomSujet = s => (s === "groupe" ? groupe : s);
  let cours = {};
  try { cours = game.lakourSurvie?.coursDuJour?.() ?? {}; } catch { cours = {}; }
  return {
    cours: L.RESSOURCES_TROC.map(r => ({ libelle: t(`LAKOUR_SURVIE.Ressources.${r}`), valeur: cours[r] ?? "?" })),
    carnets: m.boutiques.map(b => ({ nom: b.nom, dette: L.detteDe(b, "groupe"), plafond: L.plafondCredit(b, "groupe"),
      traine: (b.entrees ?? []).some(e => e.debiteur === "groupe" && Number(e.reste) > 0 && (e.nouvelAn !== null && e.nouvelAn !== undefined || jour - Number(e.jour) >= L.REGLES_MARCHE.carnet.traine)) })),
    marches: m.marches.map(x => ({ nom: x.nom, jour: x.foire ? t("LAKOUR_SURVIE.Marche.MJ.FoireJusqua", { jour: x.jusqua }) : t(`LAKOUR_SURVIE.Marche.Jours.${x.jourSemaine}`),
      hote: x.hote === "groupe", rompue: Boolean(x.treve?.rompue) })),
    rumeurs: [...m.rumeurs].filter(r => L.rumeurActive(r, jour) || r.dementie).reverse()
      .map(r => ({ jour: r.jour, dementie: r.dementie, texte: sansBalises(localiser({ ...r, params: Object.fromEntries(Object.entries(r.params ?? {}).map(([k, x]) => [k, nomSujet(x)])) })) })),
    signe: m.signe
  };
}

export function contexteTableau(onglet = "groupe") {
  const etat = lireEtat();
  const c = contenu();
  const jour = L.jourDe(etat.horloge?.quart ?? 0);
  const moi = monSurvivant();
  const membres = survivantsDuGroupe(etat);
  const groupe = membres.map(a => {
    const s = aPlat(a.system);
    return {
      id: a.id, nom: a.name, img: a.img, statut: t(`LAKOUR_SURVIE.Statuts.${s.statut || "joueur"}`), vivant: s.vivant !== false && !s.livide,
      etat: t("LAKOUR_SURVIE.Tableau.EtatLigne", { b: s.blessures ?? 0, f: s.fatigue ?? 0, m: s.moral ?? 4 }), infecte: Boolean(s.infection?.atteint),
      peutChanger: game.user.isGM || a.isOwner,
      cases: Object.keys(L.TACHES).map(x => ({ tache: x, choisie: s.tache === x, possible: L.peutFaire(s, x) }))
    };
  });
  let besoins = [];
  try { besoins = game.lakourSurvie.besoins().filter(b => b.couverture !== "couvert" || b.urgence); } catch { besoins = []; }
  const renseignements = L.regionsDe(c).map(r => {
    const rs = etat.renseignements?.[r.cle] ?? {};
    const age = L.ageRenseignement(rs, jour);
    // Le pillage (comme les routes et les factions) ne se voit que sur place : une nouvelle de la radio ne le rajeunit pas.
    const ageVu = L.ageDirect(rs, jour);
    const datePillage = rs.pillage && rs.pillage !== "inconnu" && ageVu !== null && ageVu !== age ? ` (${t("LAKOUR_SURVIE.Renseignements.Age", { n: ageVu })})` : "";
    return {
      cle: r.cle, nom: r.nom, zone: t(`LAKOUR_SURVIE.Zones.${r.zone}`), ici: r.cle === etat.groupe?.region,
      age: age === null ? t("LAKOUR_SURVIE.Renseignements.Jamais") : t("LAKOUR_SURVIE.Renseignements.Age", { n: age }), vieux: age !== null && age > 7,
      source: rs.vu === null || rs.vu === undefined ? "" : t(`LAKOUR_SURVIE.Sources.${rs.source ?? "rumeur"}`),
      infestation: t(`LAKOUR_SURVIE.Infestation.${rs.infestation ?? "inconnue"}`), infestationCle: rs.infestation ?? "inconnue",
      pillage: `${t(`LAKOUR_SURVIE.Pillage.${rs.pillage ?? "inconnu"}`)}${datePillage}`,
      electricite: rs.electricite === null || rs.electricite === undefined ? "?" : rs.electricite ? "✔" : "✘",
      eau: rs.eau === null || rs.eau === undefined ? "?" : rs.eau ? "✔" : "✘",
      factions: (rs.factions ?? []).map(f => L.factionDe(c, f)?.nom ?? f).join(", "),
      notes: rs.notes ?? ""
    };
  });
  return {
    onglet, onglets: ONGLETS.map(o => ({ cle: o, libelle: t(`LAKOUR_SURVIE.Tableau.Onglets.${o}`), actif: o === onglet })),
    demarree: Boolean(etat.demarree), gm: game.user.isGM,
    taches: Object.keys(L.TACHES).map(x => ({ cle: x, libelle: libelleTache(x), aide: L.TACHES[x] ? libelleCompetence(L.TACHES[x]) : "" })),
    groupe, besoins: besoins.map(b => ({ ...b, tacheLibelle: libelleTache(b.tache),
      couvertureLibelle: t(`LAKOUR_SURVIE.Besoins.${b.couverture}`), urgenceTexte: typeof b.urgence === "string" ? b.urgence : "" })),
    pnj: (etat.groupe?.pnj ?? []).map(p => ({ nom: p.nom, etat: p.etat })),
    plans: (etat.groupe?.plans ?? []).map(k => L.installationDe(c, k)?.nom ?? k),
    // Lot « fetes » : l'autel (les morts du groupe), ce qui soutient le groupe (souvenirs de fête, vœux, autel), les liens tissés.
    morts: (etat.morts ?? []).map(m => ({ nom: m.nom, etat: t(`LAKOUR_SURVIE.Autel.Etats.${m.repos ? "repos" : m.retrouve ? "deuil" : "perdu"}`) })),
    souvenirs: L.souvenirsActifs(etat, jour).map(x => ({ texte: `${t(`LAKOUR_SURVIE.Souvenirs.${x.cle}`)}${x.qui?.length ? ` (${x.qui.map(id => game.actors.get(id)?.name ?? id).join(", ")})` : ""}`,
      fin: x.jusqua === null || x.jusqua === undefined ? t("LAKOUR_SURVIE.Souvenirs.Tenu") : t("LAKOUR_SURVIE.Souvenirs.Jusqua", { n: x.jusqua }) })),
    liens: [...Object.entries(etat.liens?.communautes ?? {}).map(([k, n]) => `${t(`LAKOUR_SURVIE.Communautes.${k}`)} ${n}`),
      ...Object.entries(etat.liens?.factions ?? {}).map(([k, n]) => `${L.factionDe(c, k)?.nom ?? k} ${n}`),
      ...(Number(etat.liens?.renom) ? [t("LAKOUR_SURVIE.Liens.Renom", { n: etat.liens.renom })] : [])].join(", "),
    renseignements, carte: onglet === "renseignements" ? carteConnue(etat, c) : "",
    marche: onglet === "marche" && etat.demarree ? marchePublic(etat, c) : null,
    journal: [...(etat.journal ?? [])].reverse().slice(0, 80).map(e => ({ jour: L.jourDe(e.quart), moment: t(`LAKOUR_SURVIE.Moments.${L.momentDe(e.quart)}`), texte: sansBalises(localiser(e)) })),
    alertes: [...(etat.alertes ?? [])].reverse().slice(0, 12).map(a => ({ jour: L.jourDe(a.quart), texte: sansBalises(localiser(a)), type: a.type })),
    propositions: [...(etat.propositions ?? [])].reverse().map(p => ({ ...p, jour: L.jourDe(p.quart), typeLibelle: t(`LAKOUR_SURVIE.Proposition.Types.${p.type}`) })),
    typesProposition: ["fouiller", "explorer", "construire", "garde", "repos", "voyager", "fabriquer", "autre"].map(x => ({ cle: x, libelle: t(`LAKOUR_SURVIE.Proposition.Types.${x}`) })),
    moi: moi ? { id: moi.id, nom: moi.name } : null
  };
}

export class TableauDeBord extends HandlebarsApplicationMixin(ApplicationV2) {
  static DEFAULT_OPTIONS = {
    id: `${ID}-tableau`,
    classes: [ID, "survie-tableau"],
    position: { width: 900, height: 720 },
    window: { title: "LAKOUR_SURVIE.Tableau.Titre", icon: "fa-solid fa-clipboard-list", resizable: true },
    actions: {
      onglet: TableauDeBord.#onglet,
      assignerCase: TableauDeBord.#assignerCase,
      proposer: TableauDeBord.#proposer,
      ouvrirActeur: (event, cible) => game.actors.get(cible.dataset.acteur)?.sheet?.render({ force: true })
    }
  };
  static PARTS = { corps: { template: `${CHEMIN}/tableau.hbs`, scrollable: [".survie-corps"] } };
  onglet = "groupe";

  async _prepareContext() { return contexteTableau(this.onglet); }
  static #onglet(event, cible) { this.onglet = cible.dataset.onglet; this.render(); }
  static #assignerCase(event, cible) {
    const a = game.actors.get(cible.dataset.acteur);
    if (!a || !(game.user.isGM || a.isOwner)) return;
    essayer(() => game.lakourSurvie.assigner({ acteurId: a.id, tache: cible.dataset.tache }));
  }
  static async #proposer(event, cible) {
    const d = lireChamps(cible.closest(".survie-formulaire"));
    if (!String(d.details ?? "").trim() && d.type === "autre") return;
    const r = await essayer(() => game.lakourSurvie.proposer({ type: d.type, details: d.details }));
    if (r) ui.notifications.info(t("LAKOUR_SURVIE.Proposition.Envoyee"));
    this.render();
  }
}

let fenetre = null;
export const tableauDeBord = () => (fenetre ??= new TableauDeBord());
export const ouvrirTableau = () => tableauDeBord().render({ force: true });
