// La fenêtre du MJ (MJ humain, sans IA : le système se joue sans elle) : démarrer la partie, avancer le temps, faire agir le groupe
// (fouiller, explorer, construire, réparer, voyager, déménager), un assaut, une recrue, fêter, demander un test à un joueur ;
// les menaces du jour à résoudre ; et le MONDE RÉEL, au seul MJ actif monde ouvert (jamais ailleurs : c'est le secret).
// Lot « fetes » (2026-11-13) : la lune et la clarté de la nuit ; fêter avec son choix, ses vœux, son cadeau, l'abri qui reçoit ;
// aller à la fête des autres ; un vœu tenu ou rompu ; la relève à la mort d'un survivant de joueur ; l'autel des morts.
// Chaque bouton appelle game.lakourSurvie : les gardes de l'API (MJ actif, monde ouvert) s'appliquent.
import { ID, COMPETENCES, RESSOURCES, NATURE, DIFFICULTES, PRUDENCES, TRANSPORTS } from "../../logique/constantes.mjs";
import * as L from "../../logique/index.mjs";
import { t, lireEtat, sansBalises, localiser, libelleCompetence, libelleRessource, survivantsDuGroupe, abriCourant, erreurLisible } from "../donnees.mjs";
import { estMJActif } from "../canal.mjs";
import { CHEMIN, essayer, lireChamps, options } from "./commun.mjs";
import { jaugeSens, libelleFoi, libelleBande, optionsActes, texteListe } from "./esprit.mjs";

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;
const contenu = () => game.lakourSurvie?.contenu?.() ?? {};
export const ONGLETS_MJ = ["partie", "actions", "groupe", "savoirs", "communaute", "menaces", "marche", "monde"];
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

// L'onglet Marché (contrat §12) : cours du jour, stades, carnets, marchés, rumeurs (et, au MJ actif monde ouvert, leur vérité),
// et ce qu'il faut aux formulaires (PNJ, cibles des préjugés, factions, modèles de marchés, foires, gens du marché).
export function contexteMarche(etat, monde, c = contenu()) {
  const api = game.lakourSurvie;
  const m = L.marcheDe(etat);
  const secret = monde ? L.secretMarcheDe(monde) : null;
  const jour = L.jourDe(etat.horloge?.quart ?? 0);
  const groupe = t("LAKOUR_SURVIE.Marche.LeGroupe");
  const nomSujet = s => (s === "groupe" ? groupe : s);
  const cours = api?.coursDuJour?.() ?? {};
  const pnj = (game.actors?.contents ?? []).filter(a => a.type === "survivant" && !a.system?.livide && !(etat.groupe?.membres ?? []).includes(a.id));
  const jours = [0, 1, 2, 3, 4, 5, 6].map(j => [String(j), t(`LAKOUR_SURVIE.Marche.Jours.${j}`)]);
  return {
    cours: L.RESSOURCES_TROC.map(r => ({ libelle: libelleRessource(r), valeur: cours[r] ?? "?" })),
    stades: (api?.stadesDuMarche?.() ?? []).map(s => ({ ...s, libelle: t(`LAKOUR_SURVIE.Marche.Stades.${s.stade}`) })),
    boutiques: m.boutiques.map(b => ({ nom: b.nom, tenancier: game.actors?.get?.(b.tenancier)?.name ?? b.tenancier ?? "", dette: L.detteDe(b, "groupe"),
      plafond: L.plafondCredit(b, "groupe"), traine: L.dettesQuiTrainent(b, jour).length > 0 || (b.entrees ?? []).some(e => e.debiteur === "groupe" && e.rumeur && e.reste > 0) })),
    marches: m.marches.map(x => ({ nom: x.nom, jour: x.foire ? t("LAKOUR_SURVIE.Marche.MJ.FoireJusqua", { jour: x.jusqua }) : t(`LAKOUR_SURVIE.Marche.Jours.${x.jourSemaine}`),
      hote: x.hote ? nomSujet(x.hote) : "", rompue: Boolean(x.treve?.rompue), bastions: (x.bastions ?? []).map(b => L.factionDe(c, b)?.nom ?? b).join(", ") })),
    rumeurs: [...m.rumeurs].reverse().map(r => {
      const v = secret?.rumeurs?.[r.id];
      return { jour: r.jour, dementie: r.dementie, texte: sansBalises(localiser({ ...r, params: Object.fromEntries(Object.entries(r.params ?? {}).map(([k, x]) => [k, nomSujet(x)])) })),
        verite: v ? `${t(v.vraie ? "LAKOUR_SURVIE.Marche.MJ.Vrai" : "LAKOUR_SURVIE.Marche.MJ.Faux")}${v.auteur ? ` — ${nomSujet(v.auteur)}` : ""}${v.malveillant ? ` — ${t("LAKOUR_SURVIE.Marche.MJ.Malveillant")}` : ""}` : "" };
    }),
    signe: m.signe,
    ressources: L.RESSOURCES_TROC.map(r => ({ cle: r, libelle: libelleRessource(r) })),
    pnj: options([["", "—"], ...pnj.map(a => [a.id, a.name])], ""),
    // Qui joue d'un préjugé pour faire baisser le prix (le sens moral, §14 : il porte l'acte « colporter »).
    porteurs: options([["", "—"], ["groupe", groupe], ...survivantsDuGroupe(etat).map(a => [a.id, a.name])], ""),
    cibles: options(L.liste(c.communautes).map(x => [x.cle, x.nom]), ""),
    factions: options([["", "—"], ...L.liste(c.factions).map(f => [f.cle, f.nom])], ""),
    choixMarches: options([["", "—"], ...m.marches.map(x => [x.cle, x.nom])], ""),
    choixBoutiques: options(m.boutiques.map(b => [b.cle, b.nom]), ""),
    // Lot 10 : la boutique d'un commerçant (sa marge), qui parle, les étals du groupe, les objets à estimer.
    boutiquesTroc: options([["", "—"], ...m.boutiques.map(b => [b.cle, b.nom])], ""),
    parleurs: options([["", groupe], ...survivantsDuGroupe(etat).map(a => [a.id, a.name])], ""),
    marchesForains: options(m.marches.filter(x => !x.foire).map(x => [x.cle, x.nom]), ""),
    etals: (m.etals ?? []).map(e => ({ id: e.id, marche: m.marches.find(x => x.cle === e.marche)?.nom ?? e.marche, gardien: e.gardien,
      reste: texteListe(Object.entries(e.biens ?? {}).map(([ressource, manque]) => ({ ressource, manque }))),
      caisse: texteListe(Object.entries(e.caisse ?? {}).filter(([, q]) => Number(q) >= 1).map(([ressource, q]) => ({ ressource, manque: Math.floor(q) }))) })),
    choixEtals: options((m.etals ?? []).map(e => [e.id, `${e.id} — ${m.marches.find(x => x.cle === e.marche)?.nom ?? e.marche}`]), ""),
    objets: options([...Object.keys(c.bareme?.objets ?? {}).map(k => [k, L.indexer(c).equipements.get(k)?.nom ?? k]),
      ...L.liste(c.recettes).filter(r => r.produit?.equipement).map(r => [r.produit.equipement, L.indexer(c).equipements.get(r.produit.equipement)?.nom ?? r.produit.equipement])]
      .filter((x, i, l) => l.findIndex(y => y[0] === x[0]) === i), ""),
    choixRumeurs: options(m.rumeurs.filter(r => !r.dementie).map(r => [r.id, `J${r.jour} — ${sansBalises(localiser(r)).slice(0, 70)}`]), ""),
    modeles: options([["", "—"], ...L.liste(c.marches).map(x => [x.cle, x.nom])], ""),
    foires: options([["", "—"], ...L.liste(c.foires).map(x => [x.cle, x.nom])], ""),
    marchands: options(L.liste(c.marchands).map(x => [x.cle, x.nom]), ""),
    jours: options(jours, "6"),
    choixStades: options(L.STADES_MARCHE.map(s => [s, t(`LAKOUR_SURVIE.Marche.Stades.${s}`)]), "forain"),
    gestes: options(["accueillir", "rendreAccueil", "rompreTreve", "retablirTreve", "fermer"].map(g => [g, t(`LAKOUR_SURVIE.Marche.Gestes.${g}`)]), "accueillir"),
    preuves: options(L.PREUVES.map(p => [p, t(`LAKOUR_SURVIE.Marche.Preuves.${p}`)]), "fait")
  };
}

// La communauté (onglet du MJ, contrat §14) : le chef, l'entente, la couleur réelle et la réputation du groupe, chaque membre (regard,
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
        projet: e.projet ? t(`LAKOUR_SURVIE.Esprit.Projet.${e.projet}`) : "", enfant: L.estEnfant(s), chef: etat.groupe?.chef === id,
        rang: t(`LAKOUR_SURVIE.Gestion.Rangs.${L.rangDuMembre(etat, id, L.jourDe(etat.horloge?.quart ?? 0)) || "membre"}`),
        conversion: e.religionAvant ? t("LAKOUR_SURVIE.Gestion.EnConversion", { jour: e.convertiLe ?? "?" }) : "" };
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
    communautes: options((etat.communautes ?? []).map(x => [x.id, `${x.nom} (${x.membres.length})${x.passage === undefined ? "" : ` — ${t("LAKOUR_SURVIE.Gestion.Passage")} : ${t(`LAKOUR_SURVIE.Gestion.${x.passage ? "Ouvert" : "Ferme"}`)}`}`]), ""),
    aDesCommunautes: Boolean((etat.communautes ?? []).length),
    // Lot 10 : les seconds (ordre de succession), les religions pour changer de foi.
    seconds: L.secondsDe(etat).map(id => game.actors?.get?.(id)?.name ?? id).join(", "),
    religions: options(L.liste(c.religions).map(r => [r.cle, r.nom]), ""),
    religionsMultiples: L.liste(c.religions).filter(r => !r.special).map(r => ({ valeur: r.cle, libelle: r.nom })),
    profils: options([["", t("LAKOUR_SURVIE.Communaute.ProfilCouleur")], ...L.PROFILS_VISITEUR.map(p => [p, t(`LAKOUR_SURVIE.Profils.${p}`)])], "")
  };
}

// La table de gestion (lot 10, contrat §22 ; onglet Groupe) : chaque membre, son rang, sa tâche, ce que sa grille lui ferait prendre,
// sa grille (0 à 4 par tâche, avec son niveau en infobulle), sa corvée ; les quotas et où ils en sont ; les stocks.
export function contexteGestion(api = game.lakourSurvie, c = contenu()) {
  const g = api?.tableDeGestion?.();
  if (!g) return null;
  const tache = k => (k ? t(`LAKOUR_SURVIE.Taches.${k}`) : "—");
  const corvees = L.liste(c.corvees);
  return {
    taches: L.TACHES_GRILLE.map(k => ({ cle: k, libelle: tache(k) })),
    membres: g.membres.map(m => ({ ...m, rangLibelle: m.rang ? t(`LAKOUR_SURVIE.Gestion.Rangs.${m.rang}`) : "", tacheLibelle: tache(m.tache),
      prendraitLibelle: m.prendrait ? tache(m.prendrait) : "", joueur: m.statut === "joueur",
      cases: L.TACHES_GRILLE.map(k => ({ cle: k, valeur: m.grille[k] ?? 0, niveau: m.niveaux[k], interdit: m.niveaux[k] === null,
        aide: `${tache(k)}${m.niveaux[k] === null ? "" : ` — ${t("LAKOUR_SURVIE.Gestion.Niveau", { n: m.niveaux[k] })}`}` })),
      corveeLibelle: corvees.find(x => x.cle === m.corvee)?.nom ?? "" })),
    quotas: g.quotas.map(q => ({ id: q.id, texte: t("LAKOUR_SURVIE.Gestion.Quota", { nom: q.nom, tache: tache(q.tache), fait: q.fait, jours: q.jours }), tenu: q.tenu })),
    stocks: Object.entries(g.stocks ?? {}).filter(([, n]) => Number(n) > 0).map(([r, n]) => `${libelleRessource(r)} ${n}`).join(" · "),
    membresOptions: options(g.membres.map(m => [m.id, m.nom]), ""),
    tachesOptions: options(L.TACHES_GRILLE.filter(k => k !== "repos").map(k => [k, tache(k)]), "garde"),
    corveesOptions: options([["", "—"], ...corvees.map(x => [x.cle, `${tache(x.tache)} — ${x.nom}`])], ""),
    seconds: g.seconds.map(id => g.membres.find(m => m.id === id)?.nom ?? id).join(", ")
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
  const q = etat.demarree ? api.quand() : null;
  const tous = (game.actors?.contents ?? []).filter(a => a.type === "survivant");
  const mortsDuGroupe = tous.filter(a => (etat.groupe?.membres ?? []).includes(a.id) && (a.system?.vivant === false || a.system?.livide));
  const candidats = api?.candidatsReleve?.({}) ?? [];
  const libelleCandidat = x => `${x.nom}${x.source === "pnj" ? ` (${t("LAKOUR_SURVIE.Releve.PnjLeger")})` : x.age ? ` (${t("LAKOUR_SURVIE.Releve.Ans", { n: x.age })})` : ""}${x.tache && x.tache !== "repos" ? ` — ${t(`LAKOUR_SURVIE.Taches.${x.tache}`)}` : ""}`;
  const joueurs = (game.users?.contents ?? [...(game.users?.values?.() ?? [])]).filter(u => !u.isGM);
  const morts = (etat.morts ?? []).map(m => ({ ...m, etatTexte: t(`LAKOUR_SURVIE.Autel.Etats.${m.repos ? "repos" : m.retrouve ? "deuil" : m.livide ? "livide" : "perdu"}`) }));
  return {
    onglet, onglets: ONGLETS_MJ.map(o => ({ cle: o, libelle: t(`LAKOUR_SURVIE.MJ.Onglets.${o}`), actif: o === onglet })),
    actif, ouvert, demarree: Boolean(etat.demarree), bloque: Boolean(etat.demarree) && !ouvert,
    quand: etat.demarree ? api.quand() : null,
    resultat,
    regions: options(regions, ici), toutesRegions: options([["", "—"], ...regions], ""),
    sites: options(L.liste(c.sites).map(s => [s.cle, `${L.regionDe(c, s.region)?.nom ?? s.region} — ${s.nom}`]), ""),
    sitesIci: options([["", t("LAKOUR_SURVIE.MJ.Region")], ...sitesIci], ""),
    cibles: options([["", t("LAKOUR_SURVIE.MJ.Tout")], ...RESSOURCES.filter(r => r !== "energie").map(r => [r, libelleRessource(r)]), ...NATURE.map(n => [n, t(`LAKOUR_SURVIE.Nature.${n}`)]),
      ...["jardins", "livres"].map(x => [x, t(`LAKOUR_SURVIE.Savoirs.Cibles.${x}`)]), ["plans", t("LAKOUR_SURVIE.Plans.Cible")]], ""),
    prudences: options(PRUDENCES.map(p => [p, t(`LAKOUR_SURVIE.Prudences.${p}`)]), "normal"),
    transports: options([...TRANSPORTS.map(x => [x, t(`LAKOUR_SURVIE.Transports.${x}`)]), ...vehicules.map(v => [v, L.indexer(c).equipements.get(v)?.nom ?? v])], "pied"),
    installations: options(constructibles, ""),
    endommagees: options([["", t("LAKOUR_SURVIE.MJ.Abri")], ...instances.filter(i => Number(i.system?.etat) > 0).map(i => [i.id, `${i.name} (${t(`LAKOUR_SURVIE.EtatInstallation.${i.system.etat}`)})`])], ""),
    survivants: survivants.map(a => ({ id: a.id, nom: a.name, membre: (etat.groupe?.membres ?? []).includes(a.id) })),
    membres: options(membres.map(a => [a.id, a.name]), ""),
    // Les PNJ hors du groupe (invités d'une fête, témoins de la fête des autres : leurs préjugés s'usent, le marché §12).
    pnjHors: options(survivants.filter(a => !(etat.groupe?.membres ?? []).includes(a.id)).map(a => [a.id, a.name]), ""),
    competences: options(COMPETENCES.map(k => [k, libelleCompetence(k)]), "vigilance"),
    difficultes: options(Object.keys(DIFFICULTES).map(d => [d, t(`LAKOUR_SURVIE.Difficultes.${d}`)]), "normale"),
    ressources: RESSOURCES.filter(r => r !== "energie").map(r => ({ cle: r, libelle: libelleRessource(r) })),
    recettes: options(L.liste(c.recettes).map(r => [r.cle, r.nom]), ""),
    afflictions: options(L.liste(c.afflictions).map(a => [a.cle, a.nom]), ""),
    fetes: fetes.map(f => ({ cle: f.cle, nom: f.nom, coeur: f.coeur })),
    toutesFetes: options([["", t("LAKOUR_SURVIE.MJ.FeteDuJour")], ...L.liste(c.fetes).map(f => [f.cle, f.nom])], ""),
    optionsFete: options([["", "—"], ...[...new Set(L.liste(c.fetes).flatMap(f => L.optionsDeFete(f)))].map(o => [o, t(`LAKOUR_SURVIE.Fete.Options.${o}`)])], ""),
    factions: options([["", t("LAKOUR_SURVIE.MJ.Aucune")], ...L.liste(c.factions).map(f => [f.cle, f.nom])], ""),
    communautes: options([["", "—"], ...L.COMMUNAUTES.filter(x => x !== "tous").map(x => [x, t(`LAKOUR_SURVIE.Communautes.${x}`)])], ""),
    lune: q?.lune ? { phase: t(`LAKOUR_SURVIE.Lune.Phases.${q.lune.phase}`), eclairee: Math.round(q.lune.eclairee * 100),
      clarte: q.clarte === null || q.clarte === undefined ? "" : t(`LAKOUR_SURVIE.Lune.Clarte.${q.clarte}`), couvert: q.couvert, chaleur: q.chaleur,
      signes: (q.signes ?? []).map(x => t(`LAKOUR_SURVIE.Annee.Signes.${x}`)).join(", "), dateLue: q.dateLue } : null,
    mortsDuGroupe: options(mortsDuGroupe.map(a => [a.id, a.name]), ""),
    candidats: options(candidats.map(x => [x.id, libelleCandidat(x)]), ""),
    joueurs: options([["", "—"], ...joueurs.map(u => [u.id, u.name])], ""),
    morts, mortsOptions: options(morts.map(m => [m.id, m.nom]), ""), deuil: morts.some(m => !m.repos),
    dateDepart: game.settings.get(ID, "dateDepart"),
    menaces: (monde?.menaces ?? []).map(m => ({ ...m, typeLibelle: t(`LAKOUR_SURVIE.Menaces.${m.type}`), texte: sansBalises(localiser(m)),
      chef: m.chef ? { texte: sansBalises(localiser(m.chef)), bande: m.chef.bande, bandeLibelle: libelleBande(m.chef.bande), decision: m.chef.decision,
        ultimatum: m.chef.decision === "ultimatum", rejoindre: m.chef.decision === "rejoindre" } : null })),
    communaute: onglet === "communaute" && etat.demarree ? contexteCommunaute(etat, monde, c) : null,
    paliers: [...(monde?.paliers ?? [])].reverse().slice(0, 6),
    monde: onglet === "monde" ? resumeMonde(monde, c) : null,
    marche: onglet === "marche" && etat.demarree ? contexteMarche(etat, monde, c) : null,
    recrue: CACHE.recrue ? { ...CACHE.recrue, attitudeLibelle: CACHE.recrue.attitude ? t(`LAKOUR_SURVIE.Attitudes.${CACHE.recrue.attitude}`) : "" } : null,
    attitudes: options(["amicale", "neutre", "mefiante", "hostile"].map(a => [a, t(`LAKOUR_SURVIE.Attitudes.${a}`)]), CACHE.recrue?.attitude || "neutre"),
    // Lot 10 : la table de gestion (onglet Groupe).
    gestion: onglet === "groupe" && etat.demarree ? contexteGestion(api, c) : null,
    sens: onglet === "partie" && etat.demarree ? contexteSens(api) : null,
    // Lot 4 « Les plans » (contrat §21) : le carnet, les papiers, l'étagère, les lieux à plans (onglet Savoirs).
    plans: onglet === "savoirs" && etat.demarree ? contextePlans(api, c) : null,
    reperes: onglet === "partie" && etat.demarree ? contexteReperes(api, c, membres) : null,
    corps: onglet === "partie" && etat.demarree ? contexteCorps(api) : null,
    // Lot 9 (contrat §28) : le paradis et son piège, rallumer l'île.
    paradis: onglet === "partie" && etat.demarree ? contexteParadis(api) : null,
    // Lot « savoirs » : l'onglet Savoirs et cyclone.
    ...(onglet === "savoirs" || onglet === "groupe" ? contexteSavoirs(etat, c, api, membres) : {})
  };
}

// Lot « savoirs » : les deux arbres du groupe, le cyclone vécu (MJ seul), les veillées (apprendre, confiance, dictée, chien).
function contexteSavoirs(etat, c, api, membres) {
  const arbres = api?.savoirsDuGroupe?.() ?? null;
  const cyclone = api?.cyclone?.() ?? null;
  const libelleArbre = a => (a ? ` (${t(`LAKOUR_SURVIE.Savoirs.Arbres.${a}`)})` : "");
  return {
    arbres, chienErrant: etat.groupe?.chienErrant ?? null,
    cycloneVecu: cyclone ? { ...cyclone, quarts: cyclone.quarts.map(q => ({ moment: t(`LAKOUR_SURVIE.Moments.${q.moment}`), vent: t(`LAKOUR_SURVIE.Savoirs.Vents.${q.vent}`),
      dehors: t("LAKOUR_SURVIE.Savoirs.Dehors", q.dehors) })) } : null,
    savoirsListe: options(L.liste(c.savoirs).map(s => [s.cle, `${s.nom}${libelleArbre(s.arbre)}`]), ""),
    sources: options(["maitre", "livre", "cahier"].map(x => [x, t(`LAKOUR_SURVIE.Savoirs.Sources.${x}`)]), "maitre"),
    membresConfiance: options(membres.map(a => [a.id, `${a.name} (${t("LAKOUR_SURVIE.Savoirs.ConfianceCourte", { n: Number(a.system?.confiance) || 0 })})`]), ""),
    gramounes: options([["", "—"], ...(c.gramounes ?? []).map(g => [g.cle, `${g.nom}, ${g.age}`])], "")
  };
}

// Lot « sens » (contrat §18) : ce que le groupe perçoit (temps du quart, odeur de l'abri, ravine, corps des Livides, habitude du
// noir de chacun, lieux nettoyés, moment musical), et ce qu'il faut aux formulaires.
// Lot 9 « Le paradis et son piège » (contrat §28) : la chaleur (chiffre au MJ), la ronde, les corps, sous terre ; l'île (chaque région
// tenue ou rallumée, ce qui lui manque), les chantiers de région, les jalons ; et ce qu'il faut aux formulaires.
export function contexteParadis(api = game.lakourSurvie) {
  const p = api?.paradis?.();
  const i = api?.ile?.();
  if (!p || !i) return null;
  const K = k => `LAKOUR_SURVIE.Paradis.${k}`;
  const a = p.abri;
  return {
    abri: a ? t(K("MJ.Abri"), { signe: a.signeTexte, corps: a.corps, frais: a.corpsFrais, manquees: a.rondesManquees }) : "",
    chaleur: p.mj ? t(K("MJ.Chaleur"), { chaleur: p.mj.chaleur, agglutines: p.mj.agglutines, arrivants: p.mj.arrivants }) : "",
    rondiers: p.rondiers.length ? t(K("MJ.Rondiers"), { noms: p.rondiers.join(", ") }) : t(K("MJ.SansRondier")),
    sousTerre: a?.sousTerre ? t(K("MJ.SousTerre"), { air: a.airTexte, puits: a.puits?.jour ? t(K("Puits.jour")) : a.puits?.air ? t(K("Puits.air")) : t(K("Puits.aucun")) }) : "",
    soleil: p.membres.filter(m => m.joursSansSoleil > 0).map(m => ({ nom: m.nom, jours: m.joursSansSoleil, mauvais: m.palier > 0 })),
    regions: i.regions.filter(r => r.etat !== "noire" || r.conditions).map(r => ({ nom: r.nom, etat: r.etatTexte, allumee: r.etat === "rallumee",
      manque: r.conditions?.manqueTextes?.join(", ") ?? "", lieux: (r.conditions?.lieux ?? []).map(l => `${l.nettoye ? "✔" : "✘"} ${l.nom}`).join(" · ") })),
    compte: t(K("MJ.Compte"), { n: i.rallumees, total: i.total }),
    chantiers: i.chantiers.map(c => ({ nom: c.nom, region: c.regionNom, avance: c.fini ? t(K("MJ.Fini")) : c.ouvert ? `${Math.floor(c.fait)} / ${c.requis}` : t(K("MJ.PasOuvert")),
      aides: c.aides.join(", ") })),
    jalons: i.jalons.map(j => `${t("LAKOUR_SURVIE.Bandeau.Jour", { n: j.jour })} — ${j.texte}`),
    chantiersOptions: options(i.chantiers.filter(c => !c.fini).map(c => [c.cle, `${c.regionNom} — ${c.nom}`]), ""),
    actionsCorps: options([["enterrer", t(K("Corps.enterrer"))], ["bruler", t(K("Corps.bruler"))]], "enterrer"),
    actionsIle: options([["declarer", t(K("Ile.declarer"))], ["eteindre", t(K("Ile.eteindre"))]], "declarer"),
    sousTerreOptions: options([["", t(K("SousTerre.site"))], ["oui", t(K("SousTerre.oui"))], ["non", t(K("SousTerre.non"))]], "")
  };
}

// Lot « corps » (contrat §19) : le sommeil de chacun, l'hygiène et l'insalubrité de l'abri, et ce qu'il faut aux formulaires.
export function contexteCorps(api = game.lakourSurvie) {
  const c = api?.corps?.();
  if (!c) return null;
  const K = k => `LAKOUR_SURVIE.Corps.${k}`;
  return {
    membres: c.membres.filter(m => m.vivant).map(m => ({ nom: m.nom, texte: t(K(`Sommeil.${m.sommeil}`)), mauvais: m.veille >= 4, veille: m.veille })),
    abri: c.abri ? t(K("Hygiene.Ligne"), { n: c.abri.hygiene, etat: t(K(`Insalubrite.${c.abri.etat}`)) }) + (c.abri.salubre ? ` — ${t(K("Hygiene.Salubre"))}` : "") : "",
    gris: c.grisConnu ? t(K("GrisConnu")) : "",
    bivouac: c.bivouac,
    lieux: options(["abri", "bivouac", "sol"].map(x => [x, t(K(`Lieux.${x}`))]), "abri")
  };
}

export function contexteSens(api = game.lakourSurvie) {
  const s = api?.sens?.();
  if (!s) return null;
  const P = k => `LAKOUR_SURVIE.Percevoir.${k}`;
  const dir = d => t(P(`Vent.Directions.${d}`));
  const temps = [];
  if (s.pluie) temps.push(t(P("Pluie")));
  if (s.brume) temps.push(t(P("Brume")));
  if (s.vent) temps.push(t(P("Vent.Texte"), { mot: t(P(`Vent.Mots.${s.vent.mot}`)), vers: dir(s.vent.vers), de: dir(s.vent.de) }));
  if (s.voix) temps.push(t(P(`Voix.${s.voix}`)));
  return {
    temps: temps.join(" · "),
    odeur: s.odeur ? t(P("Odeur.Texte"), { odeur: s.odeur.odeur, betes: s.odeur.betes,
      sources: s.odeur.sources.map(x => t(P(`Odeur.Sources.${x}`))).join(", ") || "—", vers: s.odeur.sousLeVent ? dir(s.odeur.sousLeVent) : "—" }) : "",
    ravine: s.ravine ? t(P("Ravine.Texte"), { etat: t(P(`Ravine.Etats.${s.ravine}`)) }) : "",
    corps: s.corps ? t(P("Corps.Texte"), { etat: t(P(`Corps.Etats.${s.corps.etat}`)) }) : "",
    musique: s.musique ? t(P(`MomentsMusique.${s.musique}`)) : "",
    accoutumance: s.accoutumance.map(x => ({ nom: x.nom, texte: t(P("Accoutumance.Ligne"), { n: x.nuits, palier: t(P(`Accoutumance.Paliers.${x.effectif}`)) }) })),
    nettoyes: s.nettoyes.map(x => ({ nom: x.nom, jour: x.jour, tues: x.tues, facteur: Math.round(x.facteur * 100) })),
    actionsNoir: options(["lumiere", "nuit", "regler"].map(a => [a, t(P(`ActionsNoir.${a}`))]), "lumiere"),
    airs: options(["doux", "fort"].map(a => [a, t(P(`Airs.${a}`))]), "doux")
  };
}

// Lot 4 « Les plans » (contrat §21) : le carnet du groupe, ce que chacun sait par cœur, les papiers et l'étagère, les lieux à plans (avec
// leur fenêtre et leur garde), et les listes des formulaires.
export function contextePlans(api = game.lakourSurvie, c = contenu()) {
  const p = api?.plans?.();
  if (!p) return null;
  const P = k => `LAKOUR_SURVIE.Plans.${k}`;
  const nomSavoir = s => L.indexer(c).savoirs.get(s)?.nom ?? s;
  const fiche = x => t(P("Fiche"), { nom: x.nom, rarete: x.rarete, valeur: x.valeur });
  const aLire = x => x.plans.filter(y => !y.lisible && !y.auCarnet).map(y => t(P("Illisible"), { plan: y.nom, savoirs: (y.manque ?? []).map(nomSavoir).join(", ") }));
  const lignePapier = x => [t(P(x.porteur ? "PapierLigne" : "EtagereLigne"), { nom: x.nom, porteur: x.porteur ?? "", valeur: x.valeur }),
    x.unique ? t(P("Unique")) : "", ...(x.unique ? [] : aLire(x))].filter(Boolean).join(" — ");
  const lieux = api.lieuxAPlans?.() ?? [];
  const copiables = [...new Map([...p.carnet, ...p.papiers.filter(x => !x.unique).flatMap(x => x.plans)].map(y => [y.cle, y.nom])).entries()];
  const uniques = L.plansDuRegistre(c).filter(x => x.unique);
  const survivants = (game.actors?.contents ?? []).filter(a => a.type === "survivant");
  return {
    carnet: p.carnet.map(fiche).join(" · ") || t(P("Rien")),
    parCoeur: p.parCoeur.map(x => `${x.nom} : ${x.plans.map(y => y.nom).join(", ") || t(P("Rien"))}${x.enCours ? ` (${t(P("EnCours"), { plan: L.nomDuPlan(c, x.enCours.plan), fait: x.enCours.fait, requis: x.enCours.requis })})` : ""}`),
    papiers: p.papiers.map(lignePapier),
    etagere: { titre: t(P("Etagere"), { n: p.etagere.length, places: p.places }), protege: p.protege, sans: !p.places, papiers: p.etagere.map(lignePapier) },
    lieux: lieux.map(l => ({ nom: l.nom, region: l.regionNom, ici: l.ici, garde: t(P(`Gardes.${l.garde?.type ?? "milieu"}`)), fenetre: l.fenetre,
      etat: !l.ouverte ? `${t(P("Ferme"))} (${l.motifs.map(m => localiser(m)).join(" ; ")})` : l.revenir ? t(P("Revenir"), { jour: l.prochain }) : t(P("Ouvert")) })),
    optionsLieux: options(lieux.map(l => [l.cle, `${l.ici ? "★ " : ""}${l.nom} — ${l.regionNom}`]), ""),
    optionsPapiers: options(p.papiers.map(x => [x.objetId, `${x.nom} (${x.porteur})`]), ""),
    optionsCopiables: options(copiables, ""),
    optionsConnus: options(p.connus.map(k => [k, L.nomDuPlan(c, k)]), ""),
    optionsEtagere: options(p.etagere.map(x => [x.id, x.nom]), ""),
    optionsCibles: options([...L.liste(c.installations).map(i => [i.cle, i.nom]), ...L.liste(c.recettes).map(r => [L.clePlanRecette(r.cle), t(P("CibleRecette"), { nom: r.nom })])], ""),
    optionsRecevoir: options([...uniques.map(x => [x.cle, `${x.nom} (${t(P("Unique"))})`]), ...L.liste(c.installations).map(i => [i.cle, i.nom]),
      ...L.liste(c.recettes).map(r => [L.clePlanRecette(r.cle), t(P("CibleRecette"), { nom: r.nom })])], ""),
    optionsCauses: options(L.CAUSES_PERTE.map(x => [x, t(P(`Causes.${x}`))]), "feu"),
    optionsSurvivants: options(survivants.map(a => [a.id, `${a.name}${a.system?.vivant === false || a.system?.livide ? " †" : ""}`]), "")
  };
}

// Lot « cartes » (contrat §20) : le vrai jour et celui que le groupe croit, l'écart, qui tient le compte, l'heure, les cartes et
// calendriers du groupe, les journaux qu'on peut lire ; et ce qu'il faut aux formulaires.
export function contexteReperes(api = game.lakourSurvie, c = contenu(), membres = []) {
  const r = api?.reperes?.();
  if (!r) return null;
  const R = k => `LAKOUR_SURVIE.Reperes.${k}`;
  const q = api.quand();
  const k = r.compte;
  const lignes = [t(R("Vrai"), { jour: q.jour, date: q.dateTexte })];
  if (q.compte?.certitude === "sur") lignes.push(t(R("Compte.sur"), { date: q.dateTexte }));
  else if (k.certitude === "perdu") lignes.push(t(R("Compte.perdu"), { lue: q.dateLue || "—" }), t(R("PerduMJ")));
  else lignes.push(t(R("Compte.a-peu-pres"), { date: k.dateCrue, marge: k.marge }), k.ecart ? t(R("Ecart"), { n: k.ecart > 0 ? `+${k.ecart}` : k.ecart }) : t(R("Juste")));
  lignes.push([k.teneurNom ? t(R("Teneur"), { nom: k.teneurNom }) : t(R("SansTeneur")), k.recu?.de && k.recu.de !== "lune" ? t(R("Recu"), { de: k.recu.de }) : "",
    k.encoches ? t(R("Encoches"), { n: k.encoches }) : ""].filter(Boolean).join(" · "));
  lignes.push(`${t(R(`Heure.${r.heure?.cle ?? "jour-clair"}`))}. ${t(R("Soleil"), r.soleil)}`);
  const objets = r.objets.map(o => ({ valeur: o.id, libelle: `${o.nom} (${o.porteur})`, type: o.type }));
  const reperesDuContenu = L.reperesDuContenu(c).filter(d => d.cle !== "copie-de-carte");
  return {
    lignes, objets: objets.map(o => o.libelle),
    journaux: r.journaux.map(j => j.nom),
    actions: options(["teneur", "noter", "oublier", "regler"].map(a => [a, t(R(`Actions.${a}`))]), "teneur"),
    certitudes: options([["", "—"], ...L.CERTITUDES.map(x => [x, t(R(`Certitudes.${x}`))])], ""),
    qui: options([["", "—"], ...membres.map(a => [a.id, a.name])], k.teneur ?? ""),
    mensonges: options(["auto", "oui", "non"].map(x => [x, t(R(`Mensonges.${x}`))]), "auto"),
    calendriers: options([["", "—"], ...objets.filter(o => o.type === "calendrier").map(o => [o.valeur, o.libelle])], ""),
    cartes: options(objets.filter(o => o.type === "carte").map(o => [o.valeur, o.libelle]), ""),
    cles: options(reperesDuContenu.map(d => [d.cle, d.nom]), reperesDuContenu[0]?.cle ?? ""),
    morts: options([["", "—"], ...r.journaux.map(j => [j.id, j.nom])], ""),
    dateCrue: k.dateCrueIso || q.date
  };
}

const CACHE = { recrue: null };
// Les biens d'un formulaire : les champs « <prefixe>.<ressource> » positifs.
const biens = (d, prefixe) => Object.fromEntries(L.RESSOURCES_TROC.filter(r => Number(d[`${prefixe}.${r}`]) > 0).map(r => [r, Number(d[`${prefixe}.${r}`])]));
const liste = v => (Array.isArray(v) ? v : v ? [v] : []).filter(Boolean);
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
    const liste = x => (Array.isArray(x) ? x : x ? [x] : []);
    const membres = liste(d.membres);
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
      genererRecrue: async () => { CACHE.recrue = await api.genererRecrue({ region: d.region || "", gramoune: d.gramoune || "" }); return CACHE.recrue; },
      recruter: async () => {
        const r = await api.recruter({ recrue: CACHE.recrue, parleurId: d.parleur, attitude: d.attitude || "neutre" });
        if (r.reussite) CACHE.recrue = null;
        return r.insiste ? { ...r, insiste: t("LAKOUR_SURVIE.Gestion.Insiste", { n: r.tentative }) } : r;
      },
      // Lot 10 (contrat §22) : la table de gestion, les rangs, le passage, la conversion, la boutique et l'étal.
      priorites: () => api.priorites({ acteurId: d.acteur, effacer: Boolean(d.effacer),
        grille: Object.fromEntries(L.TACHES_GRILLE.filter(k => d[`p.${k}`] !== undefined && d[`p.${k}`] !== null).map(k => [k, Number(d[`p.${k}`]) || 0])) }),
      quota: () => (d.retirer ? api.quota({ retirer: d.retirer }) : api.quota({ acteurId: d.acteur, tache: d.tache, jours: Number(d.jours) || 1 })),
      corvee: () => api.corvee({ acteurId: d.acteur, corvee: d.corvee || "" }),
      second: () => api.second({ acteurId: d.acteur, retirer: d.retirer === "oui" }),
      admettre: () => api.admettre({ acteurId: d.acteur }),
      passage: () => api.passage({ communauteId: d.communaute, ouvert: d.ouvert !== "non" }),
      convertir: () => api.convertir({ acteurId: d.acteur, religion: d.religion, religions: liste(d.religions), lieu: d.lieu ?? "" }),
      tenirEtal: () => api.tenirEtal({ marche: d.marche || "", biens: biens(d, "biens"), contre: d.contre || "nourriture", gardien: d.gardien ?? "" }),
      releverEtal: () => api.releverEtal({ etal: d.etal || "", fermer: Boolean(d.fermer) }),
      valeurObjet: async () => api.valeurObjet({ cle: d.objet || "" }),
      feter: () => api.feter({ fete: d.fete ?? "", option: d.option ?? "", pour: liste(d.pour), avec: d.avec ?? "", invites: liste(d.invites) }),
      participer: () => api.participer({ fete: d.fete ?? "", communaute: d.communaute ?? "", faction: d.faction ?? "", membres, pnj: liste(d.pnj) }),
      voeu: () => api.voeu({ acteurId: d.acteur, issue: d.issue || "tenu" }),
      releve: () => api.releve({ mortId: d.mort, candidat: d.candidat ?? "", userId: d.joueur ?? "", action: d.action || "reprendre" }),
      autel: () => api.autel({ action: d.action || "honorer", mort: d.mort ?? "", nom: d.nom ?? "" }),
      demanderTest: () => api.demanderTest({ acteurId: d.acteur, competence: d.competence, difficulte: d.difficulte, titre: d.titre ?? "" }),
      fabriquer: () => api.fabriquer({ recette: d.recette, acteurId: d.acteur || "", membres }),
      affliction: () => api.affliction({ acteurId: d.acteur, cle: d.affliction, action: d.action || "donner" }),
      ajouterMembre: () => api.ajouterMembre({ acteurId: d.acteur, statut: d.statut || "compagnon" }),
      rencontre: () => api.rencontre({ region: d.region || "" }),
      // Le marché (§12) : biens « donne.<r> », « recoit.<r> », « biens.<r> » ; cibles : liste multiple.
      troquer: () => api.troquer({ donne: biens(d, "donne"), recoit: biens(d, "recoit"), pnjId: d.pnj || "", cibles: liste(d.cibles), faction: d.faction || "", marche: d.marche || "", accepter: Boolean(d.accepter), prejuge: d.prejuge || "",
        boutique: d.boutique || "", parleurId: d.parleur || "" }),
      ouvrirBoutique: () => api.ouvrirBoutique({ nom: d.nom || game.actors?.get?.(d.tenancier)?.name || "", tenancier: d.tenancier || "", tirer: Boolean(d.tirer) }),
      crediter: () => api.crediter({ boutique: d.boutique || "", biens: biens(d, "biens"), cibles: liste(d.cibles) }),
      rendre: () => api.rendre({ boutique: d.boutique || "", biens: biens(d, "biens"), cibles: liste(d.cibles) }),
      effacerDette: () => api.effacerDette({ boutique: d.boutique || "" }),
      ouvrirMarche: () => api.ouvrirMarche({ modele: d.modele || "", foire: d.foire || "", nom: d.nom || "", jourSemaine: Number(d.jourSemaine ?? 6), hote: d.accueil ? "groupe" : "" }),
      gererMarche: () => ({
        accueillir: () => api.accueillir({ marche: d.marche || "", hote: "groupe" }),
        rendreAccueil: () => api.accueillir({ marche: d.marche || "", hote: "" }),
        rompreTreve: () => api.rompreTreve({ marche: d.marche || "", par: d.par || "groupe" }),
        retablirTreve: () => api.retablirTreve({ marche: d.marche || "" }),
        fermer: () => api.fermerMarche({ marche: d.marche || "" })
      })[d.geste ?? "accueillir"]?.(),
      evenementDeMarche: async () => { const e = api.evenementDeMarche({ stade: d.stade || "forain" }); return e ? { nom: e.nom, texte: sansBalises(e.texte), dementi: e.effets?.dementi ?? "" } : { nom: "—" }; },
      dementirPrejuge: () => api.dementirPrejuge({ cible: d.cible || "" }),
      rumeur: () => api.rumeur({ sujet: d.sujet || "groupe", texte: d.texte || "", vraie: Boolean(d.vraie), malveillant: Boolean(d.malveillant), auteur: d.auteur || "" }),
      dementir: () => api.dementir({ id: d.id || "", preuve: d.preuve || "fait" }),
      creerMarchand: () => api.creerMarchand({ cle: d.cle || "" }),
      signe: () => api.signe({ signe: d.signe ?? "" }),
      preparerCyclone: () => api.preparerCyclone({ quarts: Number(d.quarts) || 1, membres }),
      apprendre: () => api.apprendre({ acteurId: d.acteur, savoir: d.savoir, source: d.source || "maitre", maitreId: d.maitre || "" }),
      gagnerConfiance: () => api.gagnerConfiance({ acteurId: d.acteur, parleurId: d.parleur }),
      dicter: () => api.dicter({ gramouneId: d.acteur, scribeId: d.scribe }),
      apprivoiser: () => api.apprivoiser({ acteurId: d.acteur }),
      // La communauté (contrat §14).
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
      lireSigne: () => api.lireSigne({}),
      // Percevoir dans le noir (contrat §18).
      noir: () => api.noir({ acteurId: d.acteur, action: d.action || "lumiere", nuits: Number(d.nuits) || 0 }),
      nettoyer: () => api.nettoyer({ region: d.region || "", site: d.site || "", tues: Number(d.tues) || 0 }),
      jouer: () => api.jouer({ musiciens: liste(d.musiciens), air: d.air || "doux" }),
      // Les plans (contrat §21).
      lieuAPlans: () => api.lieuAPlans({ lieu: d.lieu || "", membres, quarts: Number(d.quarts) || 2 }),
      lirePlan: () => api.lirePlan({ objetId: d.papier || "" }),
      copierPlan: () => api.copierPlan({ cle: d.plan || "", acteurId: d.acteur || "" }),
      enseignerPlan: () => api.enseignerPlan({ acteurId: d.acteur || "", cle: d.plan || "" }),
      rangerPlan: () => api.rangerPlan({ objetId: d.papier || "" }),
      prendrePlan: () => api.prendrePlan({ id: d.rangement || "", acteurId: d.acteur || "" }),
      perdreEtagere: () => api.perdreEtagere({ cause: d.cause || "feu" }),
      donnerPlan: () => api.donnerPlan({ objetId: d.papier || "", contre: biens(d, "contre"), a: d.a ?? "" }),
      recevoirPlan: () => api.recevoirPlan({ cle: d.plan || "", acteurId: d.acteur || "", contre: biens(d, "contre"), de: d.de ?? "" }),
      noterPlan: () => api.noterPlan({ cle: d.plan || "" }),
      reprendrePlans: () => api.reprendrePlans({ deId: d.mort || "", aId: d.acteur || "" }),
      // Le jour qu'on croit, les cartes et les calendriers (contrat §20).
      compte: () => api.compte({ action: d.action || "teneur", acteurId: d.acteur || "", date: d.date || "", certitude: d.certitude || "" }),
      donnerDate: () => api.donnerDate({ de: d.de || "", a: d.a || "", date: d.date || "", mensonge: d.mensonge === "oui" ? true : d.mensonge === "non" ? false : null }),
      lireLaLune: () => api.lireLaLune({ objetId: d.objet || "" }),
      donnerRepere: () => api.donnerRepere({ acteurId: d.acteur, cle: d.cle }),
      copierCarte: () => api.copierCarte({ objetId: d.objet, acteurId: d.acteur || "" }),
      lireJournal: () => api.lireJournal(d.mort ? { mortId: d.mort } : { de: d.de || "", date: d.date || "", depuis: Number(d.depuis) || 0 }),
      // Le corps (contrat §19).
      soignerMorsure: () => api.soignerMorsure({ acteurId: d.acteur, soigneurId: d.soigneur || "", medicament: d.medicament !== "non", decoction: d.decoction !== "non" }),
      chute: () => api.chute({ acteurId: d.acteur, hauteur: Number(d.hauteur) || 0, eau: Number(d.eau) || 0, tester: d.tester !== "non" }),
      menage: () => api.menage({ membres: liste(d.membres), quarts: Number(d.quarts) || 1 }),
      dormir: () => api.dormir({ membres: liste(d.membres), quarts: Number(d.quarts) || 1, lieu: d.lieu || "" }),
      // Le paradis et son piège, rallumer l'île (contrat §28).
      ronde: () => api.ronde({ membres: liste(d.membres), ...(d.abattus !== "" && d.abattus !== undefined ? { abattus: Number(d.abattus) || 0 } : {}),
        ...(d.livides !== "" && d.livides !== undefined ? { livides: Number(d.livides) || 0 } : {}) }),
      traiterCorps: () => api.traiterCorps({ action: d.action || "enterrer", membres: liste(d.membres), quarts: Number(d.quarts) || 1 }),
      leurre: () => api.leurre({ membres: liste(d.membres) }),
      chaleur: () => api.chaleur({ delta: Number(d.delta) || 0 }),
      sousTerre: () => api.sousTerre({ vit: d.vit === "oui" ? true : d.vit === "non" ? false : null }),
      rallumer: () => api.rallumer({ region: d.region || "", action: d.action || "declarer" }),
      chantierRegion: () => api.chantierRegion({ cle: d.chantier || "", membres: liste(d.membres), quarts: Number(d.quarts) || 2, aide: d.aide || "", retirer: d.retirer === "oui" })

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
