// L'état PUBLIC de la partie (contrat §4, réglage monde `lakour-survie.partie`) et l'avancée du temps (§1.4 avancer(n)).
// Logique pure : avancer ne modifie aucune de ses entrées et rend les nouveaux état, monde et acteurs.
//
// Extensions au contrat : `fouilleLe` (jour de la dernière fouille du groupe, null sinon) pour savoir si un jour est autonome ;
// `fetes` (clés « fete-annee » déjà fêtées au camp, §9).
//
// Déroulé d'avancer({ quarts: n }) — pour chaque quart qui s'achève :
//   1. effet du quart sur chaque survivant (soif : il boit si le groupe est à l'abri et qu'il reste de l'eau ; hors de l'abri,
//      selon `boitHorsAbri` ;
//      repos : la nuit à l'abri −2 fatigue sauf pour ceux qui veillent, un quart de repos −1 si `repos` ; infection ; mourant) ;
//   2. bruit de l'abri −2, + bruit des installations en marche (groupe électrogène…) ;
//   3. voyage en cours : un quart de moins ; à l'arrivée, la région est vue.
//   À chaque changement de jour (quart multiple de 4), l'effet du jour :
//   4. simulation du monde (hasardDuJour(graine, jour) : le même monde quelle que soit la façon d'avancer) ;
//   5. journée de l'abri (production, consommation des présents et des PNJ, pertes, plafonds, sol, alentours), cyclone ;
//   5 bis. événements du contenu tombés là où est l'abri (§2.6, faits à `effetsAbri`) : stocks perdus (jamais sous 0) et dégâts
//      appliqués, avec un fait `abri-evenement-*` (public si le groupe est à l'abri, sinon au journal secret) ; moral, blessures
//      et trouvailles rendus au MJ, à raconter (`aRaconter`, faits secrets `abri-a-raconter-*`), sans effet automatique ;
//   6. repas : on nourrit les membres présents dans l'ordre, puis les PNJ ; faim, moral ;
//   7. autonomie (net eau, nourriture, énergie ≥ 0 et aucune fouille la veille) ; phase ; radio (une région par jour) ;
//   8. faits publics au journal (200 au plus), alertes (cyclone, horde qui approche ou arrive, réseau qui tombe chez soi,
//      éruption, stocks à 2 jours ou moins) ;
//   9. maladies (§9) : évolution des afflictions de chacun, puis risque du jour (eau traitée, moustiques, infirmerie) et
//      contagion, si le contenu a des `afflictions` ;
//  11. tâches du jour (§10.3) : la garde veille la nuit, le repos repose ; une tâche tenue 7 jours d'affilée donne une marque
//      (× passion, bonus des jeunes) ; une passion pratiquée +1 moral, 7 jours sans −1 ; enseigner : une marque par jour à
//      l'élève (`enseigne: { eleve, competence }`) si le maître a 2 niveaux de plus ; une recrue à moral 0 trois jours s'en va
//      (retirée de groupe.membres, `departs`). Les traits (§10.1) jouent sur les rations, le moral, la fatigue, la peur du lieu.
//  10. paliers de visibilité (§9) : un palier franchi à la hausse depuis la veille donne un fait SECRET `palierVisibilite`
//      { palier, visibilite } (au MJ seulement).
// Journal et alertes : chaque entrée est { quart, texte (français, repli), cle, params } (textes.mjs) ; la couche Foundry affiche
// la traduction de `cle` dans la langue de chaque navigateur. Les anciennes entrées à `texte` seul restent lisibles.
import { JOURNAL_MAX, ALERTES_MAX, QUARTS_PAR_JOUR, MOMENTS, JOURNAL_SECRET_MAX, palierVisibilite } from "./constantes.mjs";
import { evoluerAfflictions, tirerMaladies, contracter } from "./maladies.mjs";
import { indexer, installationDe } from "./contenu.mjs";
import { message, cleTexteDe } from "./textes.mjs";
import { effetsTraits, lieuxAbri, travailleursParTache, competenceDeTache, peutFaire, retirerMembre } from "./generation.mjs";
import { marquer } from "./des.mjs";
import { ajouterStocks } from "./ressources.mjs";
import { hasardDuJour, deriverHasard, choisir } from "./hasard.mjs";
import { regionsDe, regionDe, sontVoisines } from "./contenu.mjs";
import { phaseDuJour, momentIndex, saisonDuJour } from "./temps.mjs";
import { effetQuart, effetJour, peutAgir } from "./survivant.mjs";
import { bilanAbri, journeeAbri, suivreAutonomie, subirCyclone, subirEvenementAbri } from "./abri.mjs";
import { creerMonde, simulerJour } from "./monde.mjs";
import { renseignementsInitiaux, observer, reseauxActifs } from "./renseignements.mjs";

export function etatVide() {
  return {
    partie: "", demarree: false, horloge: { quart: 0 }, phase: "jour-zero",
    groupe: { abri: "", membres: [], pnj: [], plans: [], region: "", enRoute: null },
    renseignements: {}, joursAutonomes: 0, autonome: false, alertes: [], journal: [], fouilleLe: null, fetes: []
  };
}

// Une nouvelle partie : l'état public (la région de départ vue au jour 0 si le monde est donné).
export function creerPartie({ partie = "", contenu = {}, region = "", membres = [], pnj = [], monde = null } = {}) {
  return {
    ...etatVide(), partie, demarree: true,
    groupe: { abri: "", membres: [...membres], pnj: structuredClone(pnj), plans: [], region, enRoute: null },
    renseignements: renseignementsInitiaux(contenu, { region, monde, jour: 0 })
  };
}

// Démarrer d'un coup : monde (secret) et état (public). -> { etat, monde }
export function demarrerPartie({ contenu, graine = "fenoir", dateDepart, region, membres = [], pnj = [], partie = "" } = {}) {
  const monde = creerMonde(contenu, graine, { dateDepart });
  return { monde, etat: creerPartie({ partie, contenu, region, membres, pnj, monde }) };
}

export function ajouterJournal(etat, entrees = []) {
  return { ...etat, journal: [...(etat.journal ?? []), ...entrees].slice(-JOURNAL_MAX) };
}

export function ajouterAlertes(etat, alertes = []) {
  const liste = [...(etat.alertes ?? [])];
  for (const a of alertes) {
    const derniere = liste.at(-1);
    if (derniere && derniere.type === a.type && derniere.texte === a.texte) continue;
    liste.push(a);
  }
  return { ...etat, alertes: liste.slice(-ALERTES_MAX) };
}

export const noterFouille = (etat, jour) => ({ ...etat, fouilleLe: jour });
export const ajouterPlan = (etat, cle) => (etat.groupe.plans.includes(cle) ? etat : { ...etat, groupe: { ...etat.groupe, plans: [...etat.groupe.plans, cle] } });

const TYPES_ALERTE = ["cyclone-pre-alerte", "cyclone-orange", "cyclone-rouge", "eruption"];

// Fait passer `quarts` quarts.
// survivants : [{ id, nom?, system }] (membres du groupe) ; abri : { id, system, installations } | null ;
// options : { dateDepart, repos: Boolean, veille: [id], stabilises: [id], corpsTraites: [id], visibiliteVeille (pour les paliers ;
//             défaut : la visibilité au début de l'appel),
//             boitHorsAbri, mangeHorsAbri: Boolean (défaut vrai : hors de l'abri, le groupe vit de ce qu'il porte ; le MJ ajuste) }.
// -> { etat, monde, acteurs: { survivants: [{ id, system, evenements }] (ceux qui ont changé), abri: { id, system, installations } | null },
//      faits (publics), secrets (faits que le groupe ne perçoit pas), alertes (nouvelles), menaces: [{ jour, … }], bilan, jours: [jour],
//      departs: [id], aRaconter: [{ jour, evenement, cle, params, texte }] (effets d'événements laissés au MJ, §2.6) }
export function avancer({ etat, monde, contenu, quarts = 1, survivants = [], abri = null, options = {} } = {}) {
  let e = structuredClone(etat);
  let m = structuredClone(monde);
  const dateDepart = options.dateDepart ?? m?.dateDepart;
  const surv = survivants.map(s => ({ id: s.id, nom: s.nom ?? s.system?.nom ?? s.id, system: structuredClone(s.system), evenements: [] }));
  const avant = new Map(survivants.map(s => [s.id, JSON.stringify(s.system)]));
  let ab = abri ? { id: abri.id, system: structuredClone(abri.system), installations: structuredClone(abri.installations ?? []) } : null;
  const veille = new Set(options.veille ?? []), stabilises = new Set(options.stabilises ?? []), corps = new Set(options.corpsTraites ?? []);
  const faits = [], secrets = [], nouvellesAlertes = [], menaces = [], jours = [], aRaconter = [];
  const auJournalSecret = (jour, f) => { m.journalSecret = [...(m.journalSecret ?? []), { jour, texte: f.texte, cle: cleTexteDe(f), params: f.params ?? {} }].slice(-JOURNAL_SECRET_MAX); };
  const personnesAbri = () => surv.filter(s => peutAgir(s.system) && !departs.includes(s.id) && aLAbri()).length + (e.groupe.pnj ?? []).filter(p => p.etat !== "mort").length;
  const aLAbri = () => Boolean(ab && !e.groupe.enRoute && e.groupe.region === ab.system.region);
  const departs = [];
  const actif = s => peutAgir(s.system) && !departs.includes(s.id);
  const presentsAbri = () => (aLAbri() ? surv.filter(actif) : []);
  const pnjPresents = () => (e.groupe.pnj ?? []).filter(p => p.etat !== "mort").length;
  const rations = () => {
    const r = { eau: pnjPresents(), nourriture: pnjPresents() };
    for (const s of presentsAbri()) { const b = effetsTraits(s.system, contenu).besoins; r.eau += b.eau; r.nourriture += b.nourriture; }
    return r;
  };
  const conditions = jour => ({ jour, dateDepart, personnes: personnesAbri(), reseaux: ab ? reseauxActifs(m, ab.system.region, jour) : {},
    rations: rations(), travailleurs: travailleursParTache(presentsAbri(), contenu) });
  let bilan = ab ? bilanAbri(ab.system, ab.installations, contenu, conditions(Math.floor(e.horloge.quart / QUARTS_PAR_JOUR))) : null;
  let palierVeille = palierVisibilite(options.visibiliteVeille ?? bilan?.visibilite ?? 0);
  // publier(quart, cle, params, texte) : une entrée du journal ; alerter(quart, type, cle, params, texte) : une alerte.
  const publier = (quart, cle, params, texte) => { e = ajouterJournal(e, [{ quart, ...message(cle, params, texte) }]); };
  const alerter = (quart, type, cle, params, texte) => { const a = { quart, type, ...message(cle, params, texte) }; nouvellesAlertes.push(a); e = ajouterAlertes(e, [a]); };
  const nomInstallation = cle => installationDe(contenu, cle)?.nom ?? cle;

  for (let k = 0; k < Math.max(0, Math.floor(quarts)); k++) {
    const q = e.horloge.quart;
    const fin = q + 1;
    // 1. Effet du quart.
    const nuit = MOMENTS[momentIndex(q)] === "nuit";
    for (const s of surv) {
      if (departs.includes(s.id)) continue;
      const ici = aLAbri();
      const boit = ici ? (ab.system.stocks?.eau ?? 0) > 0 : options.boitHorsAbri !== false;
      const garde = veille.has(s.id) || s.system.tache === "garde";
      const repos = nuit && ici && !garde ? "nuit" : options.repos || (!nuit && s.system.tache === "repos") ? "quart" : null;
      const r = effetQuart(s.system, fin, { boit, repos, stabilise: stabilises.has(s.id), corpsTraite: corps.has(s.id) });
      s.system = r.system;
      for (const ev of r.evenements) {
        s.evenements.push({ quart: fin, ...ev });
        if (["mort", "releve", "infection"].includes(ev.cle)) {
          publier(fin, `survivant-${ev.cle}${ev.cause ? `-${ev.cause}` : ""}`, { nom: s.nom, stade: ev.stade ?? "" }, `${s.nom} ${ev.texte}.`);
        }
        if (ev.cle === "releve") alerter(fin, "releve", "alerte-releve", { nom: s.nom }, `${s.nom} s'est relevé, Livide.`);
      }
    }
    // 2. Bruit de l'abri.
    if (ab) ab.system.bruit = Math.min(10, Math.max(0, (Number(ab.system.bruit) || 0) - 2 + (bilan?.bruit ?? 0)));
    // 3. Voyage en cours.
    if (e.groupe.enRoute) {
      const r = { ...e.groupe.enRoute, reste: Math.max(0, (Number(e.groupe.enRoute.reste) || 0) - 1) };
      if (r.reste <= 0) {
        e.groupe = { ...e.groupe, region: r.vers, enRoute: null };
        e.renseignements = observer(e.renseignements, m, contenu, r.vers, Math.floor(fin / QUARTS_PAR_JOUR), "vu");
        const region = regionDe(contenu, r.vers)?.nom ?? r.vers;
        publier(fin, "arrivee", { region }, `Le groupe arrive à ${region}.`);
      } else e.groupe = { ...e.groupe, enRoute: r };
    }
    e.horloge = { quart: fin };
    if (fin % QUARTS_PAR_JOUR !== 0) continue;

    // ---- Effet du jour.
    const jour = fin / QUARTS_PAR_JOUR;
    jours.push(jour);
    // 4. Monde.
    const ctx = {
      region: e.groupe.enRoute ? e.groupe.enRoute.vers : e.groupe.region,
      radio: Boolean(bilan?.renseignements),
      bruitParRegion: ab ? { [ab.system.region]: Math.min(10, (Number(ab.system.bruit) || 0) + (bilan?.bruit ?? 0)) } : {},
      abri: ab ? { region: ab.system.region, visibilite: bilan?.visibilite ?? 0, bruit: ab.system.bruit ?? 0, defense: bilan?.defense ?? 0 } : undefined
    };
    if (!ab) delete ctx.abri;
    const sim = simulerJour(m, contenu, hasardDuJour(m.graine, jour), jour, ctx);
    m = sim.monde;
    for (const f of sim.faits) {
      if (!f.public) { secrets.push(f); continue; }
      faits.push(f);
      publier(fin, cleTexteDe(f), f.params ?? {}, f.texte);
      const chezSoi = f.region === ctx.region;
      if (TYPES_ALERTE.includes(f.cle) || (chezSoi && /^reseau-/.test(f.cle)) || (chezSoi && /^horde-/.test(f.cle) && f.cle !== "horde-dispersee")
        || (f.cle === "horde-nait" && sontVoisines(contenu, ctx.region, f.region))) alerter(fin, f.cle, cleTexteDe(f), f.params ?? {}, f.texte);
    }
    for (const x of sim.menaces) menaces.push({ jour, ...x });

    // 5. Journée de l'abri.
    let manqueNourriture = 0, nourris = 0;
    if (ab) {
      const presents = personnesAbri();
      const j = journeeAbri(ab.system, ab.installations, contenu, conditions(jour - 1));
      ab.system = j.abri;
      bilan = j.bilan;
      manqueNourriture = j.manque.nourriture ?? 0;
      nourris = Math.max(0, presents - manqueNourriture);
      const c = m.cyclone;
      if (c && c.alerte === "rouge" && c.arrivee === jour && c.trajectoire.includes(ab.system.region)) {
        const cy = subirCyclone(ab.system, ab.installations, contenu, { force: c.force, protection: bilan.protectionCyclone }, deriverHasard(m.graine, "abri", jour));
        ab.system = cy.abri;
        ab.installations = cy.installations;
        if (cy.degats) {
          const installations = cy.endommagees.map(nomInstallation).join(", ");
          publier(fin, cy.endommagees.length ? "cyclone-degats-installations" : "cyclone-degats", { cyclone: c.nom, installations },
            `Le cyclone ${c.nom} abîme l'abri${cy.endommagees.length ? ` (${installations})` : ""}.`);
        }
      }
      // 5 bis. Événements du contenu tombés là où est l'abri.
      for (const f of sim.faits) {
        if (!f.effetsAbri || f.region !== ab.system.region) continue;
        const ev = subirEvenementAbri(ab.system, f.effetsAbri, f.params?.nom ?? f.cle);
        ab.system = ev.abri;
        const base = { jour, region: ab.system.region, evenement: f.cle };
        for (const x of ev.messages) {
          const fx = { ...base, ...x, public: aLAbri(), portee: "abri" };
          if (fx.public) { faits.push(fx); publier(fin, x.cle, x.params, x.texte); }
          else { secrets.push(fx); auJournalSecret(jour, fx); }
        }
        for (const x of ev.recits) {
          const fx = { ...base, ...x, public: false, portee: "mj" };
          secrets.push(fx);
          aRaconter.push({ jour, evenement: f.cle, ...x });
          auJournalSecret(jour, fx);
        }
      }
    }
    // 6. Repas.
    let rang = 0;
    const lieux = ab && aLAbri() ? lieuxAbri(ab, contenu) : [];
    const taille = presentsAbri().length + pnjPresents();
    for (const s of surv) {
      if (!actif(s)) continue;
      const mange = aLAbri() ? rang++ < nourris : options.mangeHorsAbri !== false;
      const tr = effetsTraits(s.system, contenu);
      const peurMoral = tr.peurs.filter(p => p.lieux.some(l => lieux.includes(l))).reduce((t, p) => t + p.moral, 0);
      const r = effetJour(s.system, { mange, confort: aLAbri() ? bilan?.moral ?? 0 : 0, traits: tr, personnes: taille, peurMoral });
      s.system = r.system;
      for (const ev of r.evenements) {
        s.evenements.push({ quart: fin, ...ev });
        if (ev.cle === "craque") publier(fin, "survivant-craque", { nom: s.nom }, `${s.nom} craque.`);
        if (ev.cle === "depart") {
          departs.push(s.id); e = retirerMembre(e, s.id);
          publier(fin, "survivant-depart", { nom: s.nom }, `${s.nom} ${ev.texte}.`);
          alerter(fin, "depart", "alerte-depart", { nom: s.nom }, `${s.nom} a quitté le groupe.`);
        }
      }
    }
    // 6 bis. Tâches du jour.
    for (const s of surv) {
      if (!peutAgir(s.system) || departs.includes(s.id) || !s.system.tache) continue;
      const sys = s.system;
      const c = peutFaire(sys, sys.tache) ? competenceDeTache(sys.tache) : null;
      sys.joursTache = (Number(sys.joursTache) || 0) + 1;
      if (c && sys.joursTache % 7 === 0) {
        const r = marquer(sys.competences[c], 1, { passion: sys.passions?.[c] ?? 0, age: sys.age });
        sys.competences[c] = { niveau: r.niveau, marques: r.marques };
        if (r.monte) publier(fin, "progression", { nom: s.nom, competence: c, niveau: r.niveau }, `${s.nom} progresse en ${c} (niveau ${r.niveau}).`);
      }
      if (Object.values(sys.passions ?? {}).some(x => Number(x) >= 2)) {
        if (c && Number(sys.passions?.[c]) >= 2) { sys.moral = Math.min(5, sys.moral + 1); sys.joursSansPassion = 0; }
        else {
          sys.joursSansPassion = (Number(sys.joursSansPassion) || 0) + 1;
          if (sys.joursSansPassion >= 7) { sys.moral = Math.max(0, sys.moral - 1); sys.joursSansPassion = 0; }
        }
      }
      if (sys.tache === "enseigner" && sys.enseigne?.eleve) {
        const eleve = surv.find(x => x.id === sys.enseigne.eleve && peutAgir(x.system));
        const comp = sys.enseigne.competence;
        if (eleve && sys.competences?.[comp] && Number(sys.competences[comp].niveau) >= Number(eleve.system.competences[comp].niveau) + 2) {
          const r = marquer(eleve.system.competences[comp], 1, { passion: eleve.system.passions?.[comp] ?? 0, age: eleve.system.age });
          eleve.system.competences[comp] = { niveau: r.niveau, marques: r.marques };
          if (r.monte) publier(fin, "progression-enseignee", { nom: eleve.nom, competence: comp, maitre: s.nom, niveau: r.niveau }, `${eleve.nom} progresse en ${comp} grâce à ${s.nom} (niveau ${r.niveau}).`);
        }
      }
    }
    // 7. Autonomie, phase, radio.
    const auto = ab ? suivreAutonomie(e.joursAutonomes, Boolean(bilan?.autonome) && e.fouilleLe !== jour - 1) : { joursAutonomes: 0, autonome: false };
    e.joursAutonomes = auto.joursAutonomes;
    e.autonome = auto.autonome;
    e.phase = phaseDuJour(jour);
    if (bilan?.renseignements) {
      const cible = choisir(regionsDe(contenu).map(r => r.cle), deriverHasard(m.graine, "radio", jour));
      if (cible) e.renseignements = observer(e.renseignements, m, contenu, cible, jour, "radio");
    }
    // 8. Stocks bas.
    if (ab && aLAbri()) {
      bilan = bilanAbri(ab.system, ab.installations, contenu, conditions(jour));
      for (const r of ["eau", "nourriture"]) {
        const n = bilan.joursDeStocks[r];
        if (n <= 2) alerter(fin, "stocks-bas", `stocks-bas-${r}`, { n }, `Plus que ${n} jour${n > 1 ? "s" : ""} de ${r}.`);
      }
    }
    if (manqueNourriture > 0) publier(fin, "manque-nourriture", { n: manqueNourriture }, `Pas assez à manger pour tout le monde (${manqueNourriture} part${manqueNourriture > 1 ? "s" : ""} manquent).`);
    // 9. Maladies.
    const defsAfflictions = indexer(contenu).afflictions;
    if (defsAfflictions.size) {
      for (const s of surv) {
        if (!actif(s)) continue;
        const r = evoluerAfflictions(s.system, defsAfflictions, jour);
        s.system = r.system;
        for (const ev of r.evenements) {
          s.evenements.push({ quart: fin, ...ev });
          publier(fin, `survivant-${ev.cle}`, { nom: s.nom, affliction: defsAfflictions.get(ev.affliction)?.nom ?? ev.affliction }, `${s.nom} ${ev.texte}.`);
        }
      }
      const ici = surv.filter(s => actif(s) && aLAbri());
      const regionVie = regionDe(contenu, ab?.system.region ?? e.groupe.region);
      const conditionsVie = { saison: saisonDuJour(jour, dateDepart), altitude: regionVie?.altitude ?? 0, eauTraitee: Boolean(bilan?.eauTraitee), infirmerie: (bilan?.soins ?? 0) > 0 };
      for (const n of tirerMaladies(ici, defsAfflictions, conditionsVie, deriverHasard(m.graine, "maladies", jour), jour)) {
        const s = surv.find(x => x.id === n.id);
        s.system = contracter(s.system, defsAfflictions.get(n.cle), jour);
        s.evenements.push({ quart: fin, cle: "contracte", affliction: n.cle });
      }
    }
    // 10. Paliers de visibilité.
    if (ab && bilan) {
      const palier = palierVisibilite(bilan.visibilite);
      if (palier > palierVeille) {
        const f = { jour, region: ab.system.region, cle: "palierVisibilite", cleTexte: "palier-visibilite", public: false, portee: "mj", palier, visibilite: bilan.visibilite,
          params: { visibilite: bilan.visibilite, palier }, texte: `L'abri devient plus visible (visibilité ${bilan.visibilite}, palier ${palier}).` };
        secrets.push(f);
        m.journalSecret = [...m.journalSecret, { jour, texte: f.texte, cle: f.cleTexte, params: f.params }];
      }
      palierVeille = palier;
    }
  }

  if (ab) bilan = bilanAbri(ab.system, ab.installations, contenu, conditions(Math.floor(e.horloge.quart / QUARTS_PAR_JOUR)));
  const changes = surv.filter(s => JSON.stringify(s.system) !== avant.get(s.id)).map(s => ({ id: s.id, system: s.system, evenements: s.evenements }));
  return { etat: e, monde: m, acteurs: { survivants: changes, abri: ab }, faits, secrets, alertes: nouvellesAlertes, menaces, bilan, jours, departs, aRaconter };
}

// Fêter une fête au camp (§9) : +1 moral à chaque survivant vivant (au plus 5), une ration de plus par personne présente
// (membres et PNJ), une seule fois par fête et par année (clé « fete-annee » dans etat.fetes).
// survivants : [{ id, system }] ; abri : { system } ; personnes : nombre de rations (défaut : survivants vivants + PNJ).
// -> { ok, raison, motif: { cle, params, texte } | null, etat, abri, survivants: [{ id, system }] }
export function feter(etat, abri, { fete, annee, survivants = [], personnes = null } = {}) {
  const cle = `${fete}-${annee}`;
  const rien = (raison, cleMotif, params = {}) => ({ ok: false, raison, motif: message(cleMotif, params, raison), etat, abri, survivants });
  if (!fete || !annee) return rien("fête ou année manquante", "fete-manquante");
  if ((etat.fetes ?? []).includes(cle)) return rien("déjà fêtée cette année", "fete-deja");
  const vivants = survivants.filter(s => peutAgir(s.system));
  const n = personnes ?? vivants.length + (etat.groupe?.pnj ?? []).filter(p => p.etat !== "mort").length;
  const stocks = abri?.system?.stocks ?? {};
  if ((Number(stocks.nourriture) || 0) < n) return rien(`il faut ${n} rations`, "fete-rations", { n });
  const nouvelAbri = { ...abri, system: { ...abri.system, stocks: ajouterStocks(stocks, { nourriture: -n }) } };
  const nouveaux = survivants.map(s => (peutAgir(s.system) ? { id: s.id, system: { ...structuredClone(s.system), moral: Math.min(5, (Number(s.system.moral ?? 4)) + 1) } } : s));
  return { ok: true, raison: "", motif: null, etat: { ...etat, fetes: [...(etat.fetes ?? []), cle] }, abri: nouvelAbri, survivants: nouveaux };
}
