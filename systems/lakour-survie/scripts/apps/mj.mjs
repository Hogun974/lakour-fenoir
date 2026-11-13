// La fenêtre du MJ (MJ humain, sans IA : le système se joue sans elle) : démarrer la partie, avancer le temps, faire agir le groupe
// (fouiller, explorer, construire, réparer, voyager, déménager), un assaut, une recrue, fêter, demander un test à un joueur ;
// les menaces du jour à résoudre ; et le MONDE RÉEL, au seul MJ actif monde ouvert (jamais ailleurs : c'est le secret).
// Chaque bouton appelle game.lakourSurvie : les gardes de l'API (MJ actif, monde ouvert) s'appliquent.
import { ID, COMPETENCES, RESSOURCES, NATURE, DIFFICULTES, PRUDENCES, TRANSPORTS } from "../../logique/constantes.mjs";
import * as L from "../../logique/index.mjs";
import { t, lireEtat, sansBalises, localiser, libelleCompetence, libelleRessource, survivantsDuGroupe, abriCourant, erreurLisible } from "../donnees.mjs";
import { estMJActif } from "../canal.mjs";
import { CHEMIN, essayer, lireChamps, options } from "./commun.mjs";
import { jaugeSens, libelleFoi, libelleBande, optionsActes, texteListe } from "./esprit.mjs";

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;
const contenu = () => game.lakourSurvie?.contenu?.() ?? {};
export const ONGLETS_MJ = ["partie", "actions", "groupe", "communaute", "menaces", "monde"];
const pct = (x, total) => (total > 0 ? Math.round(x / total * 100) : 0);

// Le monde réel résumé (MJ actif seul) : par région l'infestation réelle, ce qui reste à piller, factions, routes abîmées ;
// hordes, cyclone, éruption, journal secret.
export function resumeMonde(monde, c = contenu()) {
  if (!monde) return null;
  const regions = L.regionsDe(c).map(r => {
    const reel = monde.regions?.[r.cle] ?? {};
    const initial = L.reservesDepart(r);
    return {
      nom: r.nom, infestation: Math.round((Number(reel.infestation) || 0) * 10) / 10, bande: t(`LAKOUR_SURVIE.Infestation.${L.bandeInfestation(reel.infestation)}`),
      pillage: pct(L.partPillage(reel.pillage, initial) * 100, 100),
      factions: Object.entries(reel.factions ?? {}).map(([f, x]) => `${L.factionDe(c, f)?.nom ?? f} ${Math.round(x * 10) / 10}`).join(", "),
      routes: Object.entries(reel.routes ?? {}).filter(([, e]) => e !== "ouverte").map(([v, e]) => `${L.regionDe(c, v)?.nom ?? v} : ${t(`LAKOUR_SURVIE.Routes.${e}`)}`).join(", "),
      evenements: (reel.evenements ?? []).map(e => e.cle).join(", "),
      abris: (reel.abrisAbandonnes ?? []).map(a => `${L.siteDe(c, a.site)?.nom ?? a.site}${a.occupe ? ` (${L.factionDe(c, a.occupe)?.nom ?? a.occupe})` : ""}`).join(", ")
    };
  });
  return {
    regions,
    hordes: (monde.hordes ?? []).map(h => ({ region: L.regionDe(c, h.region)?.nom ?? h.region, taille: h.taille, cap: h.cap ? L.regionDe(c, h.cap)?.nom ?? h.cap : "" })),
    cyclone: monde.cyclone ? { ...monde.cyclone, trajectoire: (monde.cyclone.trajectoire ?? []).map(r => L.regionDe(c, r)?.nom ?? r).join(", ") } : null,
    eruption: monde.eruption ? { ...monde.eruption } : null,
    journal: [...(monde.journalSecret ?? [])].reverse().slice(0, 20).map(e => ({ jour: e.jour, texte: sansBalises(localiser(e)) })),
    graine: monde.graine
  };
}

// La communauté (onglet du MJ, contrat §11) : le chef, l'entente, la couleur réelle et la réputation du groupe, chaque membre (regard,
// foi, jauge, réputation, autorité, signes), la porte (la vraie couleur des visiteurs : secret du MJ), les votes, les tributs, les
// communautés séparées. monde : le monde réel (visiteurs, bandes), au seul MJ actif.
export function contexteCommunaute(etat = lireEtat(), monde = null, c = contenu()) {
  const membres = survivantsDuGroupe(etat);
  const vivants = membres.filter(a => L.peutAgir(a.system));
  const sys = vivants.map(a => ({ id: a.id, s: { ...a.system, esprit: a.system.esprit ?? {} } }));
  const couleur = L.couleurDuGroupe(sys.map(x => x.s)), reputation = L.reputationDuGroupe(sys.map(x => x.s));
  const entente = L.ententeDe(etat);
  const ab = abriCourant(etat);
  const b = ab ? (game.lakourSurvie?.bilan?.() ?? etat.bilan) : null;
  const votes = [...(etat.votes ?? [])].reverse();
  return {
    chef: options([["", t("LAKOUR_SURVIE.Communaute.SansChef")], ...vivants.map(a => [a.id, a.name])], etat.groupe?.chef ?? ""),
    entente: { valeur: entente, libelle: t(`LAKOUR_SURVIE.Entente.${entente >= 2 ? "bonne" : entente <= -2 ? "mauvaise" : "moyenne"}`) },
    couleur: { ...jaugeSens(couleur.moyenne), moyenne: couleur.moyenne }, reputation: { ...jaugeSens(reputation.moyenne), moyenne: reputation.moyenne },
    membres: sys.map(({ id, s }) => {
      const e = L.espritDe(s);
      return { id, nom: game.actors.get(id)?.name ?? id, actif: L.espritActif(s), regard: s.regard ? t(`LAKOUR_SURVIE.Regards.${s.regard}`) : "—", foi: libelleFoi(s, c) || "—",
        sens: jaugeSens(s.sensMoral), reputation: jaugeSens(s.reputation), autorite: L.autoriteDe(s), lacher: e.lacher, enFaute: e.enFaute, chance: e.chance,
        projet: e.projet ? t(`LAKOUR_SURVIE.Esprit.Projet.${e.projet}`) : "", enfant: L.estEnfant(s), chef: etat.groupe?.chef === id };
    }),
    membresOptions: options(vivants.map(a => [a.id, a.name]), ""),
    liste: ab ? texteListe(L.listeALaPorte({ stocks: ab.system?.stocks ?? {}, bilan: b, personnes: b?.personnes ?? vivants.length })) : "",
    visiteurs: (etat.porte ?? []).map(v => {
      const sec = monde?.porte?.[v.id]?.survivant ?? null;
      return { id: v.id, nom: v.nom, age: v.age, profil: t(`LAKOUR_SURVIE.Profils.${v.profil}`), demande: sansBalises(localiser(v.demande)), revient: v.revient,
        apporte: Object.keys(v.apporte ?? {}).length ? texteListe(Object.entries(v.apporte).map(([ressource, manque]) => ({ ressource, manque }))) : "",
        secret: sec ? jaugeSens(sec.sensMoral) : null };
    }),
    votes: votes.slice(0, 3).map(v => ({ ...v, acteLibelle: t(`LAKOUR_SURVIE.Actes.${v.acte}`), decideLibelle: v.decide === null ? "" : v.decide ? t(`LAKOUR_SURVIE.Actes.${v.decide}`) : t("LAKOUR_SURVIE.Communaute.Rien") })),
    votesOptions: options([["", t("LAKOUR_SURVIE.Communaute.SansVote")], ...votes.map(v => [v.id, `${v.question || t(`LAKOUR_SURVIE.Actes.${v.acte}`)} (${v.resultat.pour}/${v.resultat.contre})`])], ""),
    actes: optionsActes("exclure"),
    tributs: (etat.tributs ?? []).map(x => ({ ...x, demandeTexte: texteListe(Object.entries(x.demande ?? {}).map(([ressource, manque]) => ({ ressource, manque }))),
      etatLibelle: t(`LAKOUR_SURVIE.Tributs.${x.etat}`), actif: x.etat === "actif", sens: monde?.bandes?.[x.id] ? jaugeSens(monde.bandes[x.id].sensMoral) : null })),
    communautes: options((etat.communautes ?? []).map(x => [x.id, `${x.nom} (${x.membres.length})`]), ""), aDesCommunautes: Boolean((etat.communautes ?? []).length),
    profils: options([["", t("LAKOUR_SURVIE.Communaute.ProfilCouleur")], ...L.PROFILS_VISITEUR.map(p => [p, t(`LAKOUR_SURVIE.Profils.${p}`)])], "")
  };
}

export function contexteMJ(onglet = "partie", resultat = null) {
  const etat = lireEtat();
  const c = contenu();
  const api = game.lakourSurvie;
  const actif = estMJActif();
  const ouvert = Boolean(api?.mondeOuvert?.());
  const monde = actif && ouvert ? api.monde() : null;
  const ici = etat.groupe?.region;
  const ab = abriCourant(etat);
  const survivants = (game.actors?.contents ?? []).filter(a => a.type === "survivant" && !a.system?.livide && a.system?.vivant !== false);
  const membres = survivantsDuGroupe(etat);
  const voisins = (L.regionDe(c, ici)?.voisins ?? []).map(v => v.region);
  const regions = L.regionsDe(c).map(r => [r.cle, `${r.nom}${voisins.includes(r.cle) ? " ↔" : ""}`]);
  const sitesIci = L.liste(c.sites).filter(s => s.region === ici).map(s => [s.cle, s.nom]);
  const instances = ab ? [...ab.items.contents].filter(i => i.type === "installation") : [];
  const constructibles = L.liste(c.installations).map(d => {
    const v = ab ? api.peutConstruire(d.cle) : { ok: false, raisons: [] };
    return [d.cle, `${v.ok ? "✔" : "✘"} ${d.nom}${v.niveau ? ` (${t("LAKOUR_SURVIE.Objet.Niveau")} ${v.niveau})` : ""}`];
  });
  const vehicules = [...new Set(membres.flatMap(a => [...a.items.contents].filter(i => i.type === "equipement" && i.system?.transport).map(i => i.system.cle)))];
  const fetes = api?.fetesDuJour?.() ?? [];
  return {
    onglet, onglets: ONGLETS_MJ.map(o => ({ cle: o, libelle: t(`LAKOUR_SURVIE.MJ.Onglets.${o}`), actif: o === onglet })),
    actif, ouvert, demarree: Boolean(etat.demarree), bloque: Boolean(etat.demarree) && !ouvert,
    quand: etat.demarree ? api.quand() : null,
    resultat,
    regions: options(regions, ici), toutesRegions: options([["", "—"], ...regions], ""),
    sites: options(L.liste(c.sites).map(s => [s.cle, `${L.regionDe(c, s.region)?.nom ?? s.region} — ${s.nom}`]), ""),
    sitesIci: options([["", t("LAKOUR_SURVIE.MJ.Region")], ...sitesIci], ""),
    cibles: options([["", t("LAKOUR_SURVIE.MJ.Tout")], ...RESSOURCES.filter(r => r !== "energie").map(r => [r, libelleRessource(r)]), ...NATURE.map(n => [n, t(`LAKOUR_SURVIE.Nature.${n}`)])], ""),
    prudences: options(PRUDENCES.map(p => [p, t(`LAKOUR_SURVIE.Prudences.${p}`)]), "normal"),
    transports: options([...TRANSPORTS.map(x => [x, t(`LAKOUR_SURVIE.Transports.${x}`)]), ...vehicules.map(v => [v, L.indexer(c).equipements.get(v)?.nom ?? v])], "pied"),
    installations: options(constructibles, ""),
    endommagees: options([["", t("LAKOUR_SURVIE.MJ.Abri")], ...instances.filter(i => Number(i.system?.etat) > 0).map(i => [i.id, `${i.name} (${t(`LAKOUR_SURVIE.EtatInstallation.${i.system.etat}`)})`])], ""),
    survivants: survivants.map(a => ({ id: a.id, nom: a.name, membre: (etat.groupe?.membres ?? []).includes(a.id) })),
    membres: options(membres.map(a => [a.id, a.name]), ""),
    competences: options(COMPETENCES.map(k => [k, libelleCompetence(k)]), "vigilance"),
    difficultes: options(Object.keys(DIFFICULTES).map(d => [d, t(`LAKOUR_SURVIE.Difficultes.${d}`)]), "normale"),
    ressources: RESSOURCES.filter(r => r !== "energie").map(r => ({ cle: r, libelle: libelleRessource(r) })),
    recettes: options(L.liste(c.recettes).map(r => [r.cle, r.nom]), ""),
    afflictions: options(L.liste(c.afflictions).map(a => [a.cle, a.nom]), ""),
    fetes: fetes.map(f => ({ cle: f.cle, nom: f.nom, coeur: f.coeur })),
    dateDepart: game.settings.get(ID, "dateDepart"),
    menaces: (monde?.menaces ?? []).map(m => ({ ...m, typeLibelle: t(`LAKOUR_SURVIE.Menaces.${m.type}`), texte: sansBalises(localiser(m)),
      chef: m.chef ? { texte: sansBalises(localiser(m.chef)), bande: m.chef.bande, bandeLibelle: libelleBande(m.chef.bande), decision: m.chef.decision,
        ultimatum: m.chef.decision === "ultimatum", rejoindre: m.chef.decision === "rejoindre" } : null })),
    communaute: onglet === "communaute" && etat.demarree ? contexteCommunaute(etat, monde, c) : null,
    paliers: [...(monde?.paliers ?? [])].reverse().slice(0, 6),
    monde: onglet === "monde" ? resumeMonde(monde, c) : null,
    recrue: CACHE.recrue
  };
}

const CACHE = { recrue: null };
const resume = r => {
  if (r === null || r === undefined) return "";
  const lignes = [];
  const dire = (cle, v) => { if (v !== undefined && v !== null && v !== "" && !(Array.isArray(v) && !v.length)) lignes.push(`${cle} : ${typeof v === "object" ? JSON.stringify(v) : v}`); };
  for (const [k, v] of Object.entries(r)) if (!["faits", "etat", "test"].includes(k)) dire(k, v);
  if (r.test) dire("test", `${r.test.succes}/${r.test.requis} ${r.test.reussite ? "✔" : "✘"}`);
  for (const f of r.faits ?? []) lignes.push(`• ${sansBalises(localiser(f))}`);
  return lignes.join("\n");
};

export class FenetreMJ extends HandlebarsApplicationMixin(ApplicationV2) {
  static DEFAULT_OPTIONS = {
    id: `${ID}-mj`,
    classes: [ID, "survie-mj"],
    position: { width: 860, height: 780 },
    window: { title: "LAKOUR_SURVIE.MJ.Titre", icon: "fa-solid fa-hat-wizard", resizable: true },
    actions: {
      onglet: FenetreMJ.#onglet,
      executer: FenetreMJ.#executer,
      menace: FenetreMJ.#menace,
      tirerPalier: FenetreMJ.#tirerPalier,
      ouvrirCoffre: () => game.lakourSurvie && import("../coffre.mjs").then(m => m.ouvrirMonde())
    }
  };
  static PARTS = { corps: { template: `${CHEMIN}/mj.hbs`, scrollable: [".survie-corps"] } };
  onglet = "partie";
  resultat = null;

  async _prepareContext() { return contexteMJ(this.onglet, this.resultat); }
  static #onglet(event, cible) { this.onglet = cible.dataset.onglet; this.render(); }

  // Un formulaire de la fenêtre : data-forme = la fonction de l'API, ses champs = ses arguments.
  static async #executer(event, cible) {
    const forme = cible.closest("[data-forme]");
    const nom = forme?.dataset.forme;
    const d = lireChamps(forme);
    const api = game.lakourSurvie;
    const membres = Array.isArray(d.membres) ? d.membres : d.membres ? [d.membres] : [];
    const appels = {
      demarrer: () => api.demarrer({ region: d.region, membres, dateDepart: d.dateDepart || null, graine: d.graine || "" }),
      avancer: () => api.avancer({ quarts: Number(d.quarts) || 1, raison: d.raison ?? "", repos: Boolean(d.repos) }),
      fouiller: () => api.fouiller({ region: d.region || "", site: d.site || null, cible: d.cible || null, prudence: d.prudence, quarts: Number(d.quarts) || 1, membres }),
      explorer: () => api.explorer({ region: d.region, prudence: d.prudence, quarts: Number(d.quarts) || 1, membres }),
      installer: () => api.installer({ site: d.site }),
      construire: () => api.construire({ installation: d.installation, quarts: Number(d.quarts) || 1, membres }),
      reparer: () => api.reparer({ installationId: d.installation || "", quarts: Number(d.quarts) || 1, membres }),
      voyager: () => api.voyager({ vers: d.region, transport: d.transport, membres }),
      demenager: () => api.demenager({ site: d.site, transport: d.transport, membres, emporter: Object.fromEntries(RESSOURCES.filter(r => Number(d[`emporter.${r}`]) > 0).map(r => [r, Number(d[`emporter.${r}`])])) }),
      assaut: () => api.assaut({ force: Number(d.force) || 1, type: d.type ?? "", description: d.description ?? "" }),
      ajuster: () => api.ajuster({ stocks: Object.fromEntries(RESSOURCES.filter(r => Number(d[`stock.${r}`])).map(r => [r, Number(d[`stock.${r}`])])), raison: d.raison ?? "" }),
      genererRecrue: async () => { CACHE.recrue = await api.genererRecrue({ region: d.region || "" }); return CACHE.recrue; },
      recruter: async () => { const r = await api.recruter({ recrue: CACHE.recrue, parleurId: d.parleur, attitude: d.attitude || "neutre" }); if (r.reussite) CACHE.recrue = null; return r; },
      feter: () => api.feter({ fete: d.fete ?? "" }),
      demanderTest: () => api.demanderTest({ acteurId: d.acteur, competence: d.competence, difficulte: d.difficulte, titre: d.titre ?? "" }),
      fabriquer: () => api.fabriquer({ recette: d.recette, acteurId: d.acteur || "", membres }),
      affliction: () => api.affliction({ acteurId: d.acteur, cle: d.affliction, action: d.action || "donner" }),
      ajouterMembre: () => api.ajouterMembre({ acteurId: d.acteur, statut: d.statut || "compagnon" }),
      rencontre: () => api.rencontre({ region: d.region || "" }),
      // La communauté (contrat §11).
      chef: () => api.chef({ acteurId: d.chef || "" }),
      entente: () => api.entente({ delta: Number(d.delta) || 0, raison: d.raison ?? "" }),
      parole: () => api.parole({ tenue: d.tenue !== "non", raison: d.raison ?? "" }),
      voter: () => api.voter({ question: d.question ?? "", acte: d.acte || "accueillir", circonstances: Boolean(d.circonstances) }),
      decider: () => api.decider({ voteId: d.vote || "", decision: d.decision || "pour" }),
      acteMoral: () => api.acteMoral({ acteurs: membres, acte: d.acte, circonstances: Boolean(d.circonstances), temoins: d.temoins !== false, voteId: d.vote || "", journal: Boolean(d.journal) }),
      porte: () => api.porte({ visiteurId: d.visiteur, decision: d.decision || "accueillir", voteId: d.vote || "", circonstances: Boolean(d.circonstances) }),
      frapper: () => api.frapper({ profil: d.profil || "" }),
      tribut: () => api.tribut({ tributId: d.tribut, paye: d.paye !== "non" }),
      separer: () => api.separer({ partants: membres, abriVaAux: d.abriVaAux || "restants", nom: d.nom ?? "" }),
      fusionner: () => api.fusionner({ communauteId: d.communaute }),
      signe: () => api.signe({})
    };
    if (!appels[nom]) return;
    cible.disabled = true;
    try {
      const r = await appels[nom]();
      this.resultat = { titre: t(`LAKOUR_SURVIE.MJ.Formes.${nom}`), texte: resume(r), erreur: false };
    } catch (e) {
      this.resultat = { titre: t(`LAKOUR_SURVIE.MJ.Formes.${nom}`), texte: erreurLisible(e), erreur: true };
    }
    this.render();
  }

  static async #menace(event, cible) {
    const r = await essayer(() => game.lakourSurvie.resoudreMenace({ id: cible.dataset.id, action: cible.dataset.mode }));
    if (r) this.resultat = { titre: t("LAKOUR_SURVIE.MJ.Onglets.menaces"), texte: resume(r), erreur: false };
    this.render();
  }

  // La table d'un palier de visibilité, tirée ICI (rien au chat : le palier est secret).
  static async #tirerPalier(event, cible) {
    const table = cible.dataset.uuid ? await fromUuid(cible.dataset.uuid) : null;
    if (!table?.roll) return ui.notifications.warn(t("LAKOUR_SURVIE.Palier.SansTable"));
    const r = await table.roll();
    const texte = (r.results ?? []).map(x => sansBalises(x.description ?? x.text ?? x.name ?? "")).join(" — ");
    this.resultat = { titre: table.name, texte, erreur: false };
    this.render();
  }
}

let fenetre = null;
export const fenetreMJ = () => (fenetre ??= new FenetreMJ());
export const ouvrirFenetreMJ = () => (game.user.isGM ? fenetreMJ().render({ force: true }) : null);
