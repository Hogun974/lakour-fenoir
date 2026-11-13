// Celui qui frappe à la porte (complément du jeu 3D, famille 3) : la liste à la porte, les visiteurs que la couleur du groupe
// attire, la réponse du groupe (accueillir, refuser, ou prendre ce qu'il apporte puis le trahir) et la suite du refus.
// Logique pure.
//
// - La liste à la porte : l'abri affiche ce qui lui manque VRAIMENT, d'après ses stocks et sa consommation (listeALaPorte) :
//   c'est le prix d'entrée, et ce que rapporte celui qui revient.
// - Aucune couleur n'est gratuite : le bleu attire les réfugiés (des bouches en plus), le rouge fait fuir les gens de bien et
//   attire les durs (REGLES_PORTE.couleur, .profils).
// - Le refusé : neutre, il part chercher ailleurs ; rancunier (jauge ≤ −3, souvent), il allume un feu près du camp pour y attirer
//   les menaces (bruit de l'abri +4, un à trois jours plus tard) et rougit ; bon (jauge ≥ 3, souvent), il revient deux à cinq
//   jours plus tard avec ce qui manque, pour gagner sa place, et bleuit. Le groupe qui prend ce qu'il apporte puis le trahit rougit
//   (acte « trahir ») ; lui reçoit un point de chance (esprit.mjs : il y voit le ciel, le jeu ne dit rien).
// - État : les visiteurs qui attendent sont publics (etat.porte : ce que le groupe voit d'eux) ; leur fiche entière, jauge comprise,
//   et les suites prévues sont secrètes (monde.porte, monde.porteSuites).
import { RESSOURCES, borner } from "./constantes.mjs";
import { chance, entier, tirerPoids } from "./hasard.mjs";
import { message } from "./textes.mjs";
import { genererSurvivant } from "./generation.mjs";
import { bandeSensMoral, deplacerSensMoral } from "./moralite.mjs";
import { donnerChance } from "./esprit.mjs";

export const PROFILS_VISITEUR = ["refugie", "famille", "blesse", "dur"];
export const DECISIONS_PORTE = ["accueillir", "refuser", "trahir"];
export const SUITES_REFUS = ["part", "feu", "revient"];

export const REGLES_PORTE = {
  // Chance par jour qu'on frappe à la porte (groupe à l'abri), selon la phase, × (1 + 8 % par point de visibilité) × couleur.
  chance: { "jour-zero": 0, panique: 0.05, effondrement: 0.07, silence: 0.06, apres: 0.04 },
  visibilite: 0.08,
  couleur: { bleu: 1.6, bleute: 1.3, neutre: 1, rougeatre: 0.8, rouge: 0.6 },
  profils: {
    bleu: { refugie: 3, famille: 2, blesse: 1.5, dur: 0.3 },
    bleute: { refugie: 2.5, famille: 1.5, blesse: 1.2, dur: 0.6 },
    neutre: { refugie: 2, famille: 1, blesse: 1, dur: 1 },
    rougeatre: { refugie: 1.2, famille: 0.6, blesse: 0.6, dur: 2 },
    rouge: { refugie: 0.6, famille: 0.3, blesse: 0.3, dur: 3 }
  },
  // Un visiteur attend deux jours une réponse, puis repart (neutre).
  attente: 2,
  bouches: [1, 3],              // une famille : un à trois de plus (enfants, anciens), des PNJ à nourrir
  dur: { sensMoral: -3, combat: 1 },
  blesse: { blessures: 2 },
  rancune: -3, bonte: 3,
  suites: {
    rancunier: { feu: 0.7 }, bon: { revient: 0.6 }, neutre: { feu: 0.1, revient: 0.15 },
    feu: { bruit: 4, dans: [1, 3], sens: -1 }, revient: { dans: [2, 5], sens: 1, objets: 2 }
  },
  // La liste à la porte : jours de réserve visés, seuils des autres ressources.
  liste: { jours: 7, seuils: { medicaments: 2, munitions: 2, materiaux: 4, pieces: 2, graines: 2, carburant: 1, plantes: 2 }, max: 4 }
};

const n0 = x => Number(x) || 0;

// Ce qui manque vraiment à l'abri : [{ ressource, manque }] (les plus urgents d'abord, au plus REGLES_PORTE.liste.max).
// stocks : ceux de l'abri ; bilan : bilanAbri (consommation, joursDeStocks) ; personnes : à défaut de consommation.
export function listeALaPorte({ stocks = {}, bilan = null, personnes = 1 } = {}) {
  const L = REGLES_PORTE.liste;
  const sortie = [];
  for (const r of ["eau", "nourriture"]) {
    const conso = n0(bilan?.consommation?.[r]) || Math.max(1, n0(personnes));
    const manque = Math.ceil(L.jours * conso - n0(stocks[r]) - Math.max(0, n0(bilan?.production?.[r])) * L.jours);
    if (manque > 0) sortie.push({ ressource: r, manque, urgence: n0(stocks[r]) / conso });
  }
  for (const [r, seuil] of Object.entries(L.seuils)) {
    const manque = seuil - n0(stocks[r]);
    if (manque > 0 && RESSOURCES.includes(r)) sortie.push({ ressource: r, manque, urgence: 10 + n0(stocks[r]) });
  }
  return sortie.sort((a, b) => a.urgence - b.urgence).slice(0, L.max).map(({ ressource, manque }) => ({ ressource, manque }));
}

// La chance qu'on frappe aujourd'hui. couleur : la bande du groupe (bandeSensMoral), ou une jauge moyenne.
export function chanceVisiteur({ phase = "silence", visibilite = 0, couleur = "neutre" } = {}) {
  const R = REGLES_PORTE;
  const bande = typeof couleur === "number" ? bandeSensMoral(couleur) : couleur;
  return Math.min(0.5, n0(R.chance[phase]) * (1 + R.visibilite * Math.max(0, n0(visibilite))) * (R.couleur[bande] ?? 1));
}

const DEMANDES = {
  refugie: (nom) => `${nom} demande un toit et de quoi manger.`,
  famille: (nom, b) => `${nom} demande une place pour les siens (${b} bouche${b > 1 ? "s" : ""} de plus).`,
  blesse: (nom) => `${nom} est blessé et demande qu'on le soigne.`,
  dur: (nom) => `${nom} propose ses bras et ce qu'il porte contre une place.`
};

// Un visiteur tiré au sort. options : { id, jour, couleur (bande), region, besoins, profil } -> { public, secret }
// public : { id, jour, nom, age, genre, profil, bouches, demande: { cle, params, texte }, apporte: {}, revient: false } ;
// secret : { survivant (system complet, jauge comprise), profil, bouches }.
export function tirerVisiteur(contenu, hasard = Math.random, { id = "v1", jour = 0, couleur = "neutre", region = "", besoins = null, profil = null } = {}) {
  const R = REGLES_PORTE;
  const bande = typeof couleur === "number" ? bandeSensMoral(couleur) : couleur;
  const p = PROFILS_VISITEUR.includes(profil) ? profil : tirerPoids(Object.entries(R.profils[bande] ?? R.profils.neutre), hasard) ?? "refugie";
  let s = genererSurvivant(contenu, hasard, { statut: "recrue", region, favoriser: besoins?.profil ?? {}, budget: null });
  if (p === "dur") {
    s = deplacerSensMoral(s, R.dur.sensMoral);
    for (const c of ["combat", "tir"]) s.competences[c] = { ...s.competences[c], niveau: borner(n0(s.competences[c]?.niveau) + R.dur.combat, 0, 5) };
  }
  if (p === "blesse") s.blessures = Math.max(n0(s.blessures), R.blesse.blessures);
  const bouches = p === "famille" ? entier(R.bouches[0], R.bouches[1], hasard) : 0;
  const nom = s.nom || "?";
  return {
    public: { id, jour, nom, age: s.age, genre: s.genre ?? "", profil: p, bouches, demande: message(`porte-demande-${p}`, { nom, n: bouches }, DEMANDES[p](nom, bouches)),
      apporte: {}, revient: false },
    secret: { survivant: s, profil: p, bouches }
  };
}

// La suite d'un refus, selon la jauge (secrète) du refusé. liste : listeALaPorte (ce qu'il rapportera s'il revient).
// -> { suite: "part" | "feu" | "revient", dans (jours), apporte: { ressource: n }, sens (ce que devient sa jauge) }
export function suiteDuRefus(survivant, hasard = Math.random, { liste = [] } = {}) {
  const R = REGLES_PORTE;
  const sens = n0(survivant?.sensMoral);
  const S = sens <= R.rancune ? R.suites.rancunier : sens >= R.bonte ? R.suites.bon : R.suites.neutre;
  const x = hasard();
  let suite = "part";
  if (x < n0(S.feu)) suite = "feu";
  else if (x < n0(S.feu) + n0(S.revient)) suite = "revient";
  if (suite === "feu") return { suite, dans: entier(R.suites.feu.dans[0], R.suites.feu.dans[1], hasard), apporte: {}, sens: R.suites.feu.sens };
  if (suite === "revient") {
    const apporte = {};
    for (const { ressource, manque } of liste.slice(0, R.suites.revient.objets)) apporte[ressource] = Math.max(1, Math.min(manque, ressource === "eau" || ressource === "nourriture" ? 3 + entier(0, 4, hasard) : 1 + entier(0, 2, hasard)));
    if (!Object.keys(apporte).length) apporte.nourriture = 3;
    return { suite, dans: entier(R.suites.revient.dans[0], R.suites.revient.dans[1], hasard), apporte, sens: R.suites.revient.sens };
  }
  return { suite, dans: 0, apporte: {}, sens: 0 };
}

// La journée de la porte (dans avancer, au changement de jour) : les visiteurs qui n'ont plus attendu repartent, les suites
// prévues arrivent (feu près du camp, retour de celui qui rapporte ce qui manque), un nouveau visiteur peut frapper.
// ctx : { jour, aLAbri, phase, visibilite, couleur (bande), region, liste, besoins } ; hasard : un flux propre à la porte.
// -> { etat, monde, faits: [publics], secrets: [faits du MJ], bruit (à ajouter à l'abri) }
export function journeePorte(etat, monde, contenu, hasard = Math.random, ctx = {}) {
  const e = { ...etat, porte: [...(etat.porte ?? [])] };
  const m = { ...monde, porte: { ...(monde.porte ?? {}) }, porteSuites: [...(monde.porteSuites ?? [])] };
  const jour = n0(ctx.jour);
  const faits = [], secrets = [];
  let bruit = 0;
  // 1. Ceux qui n'ont plus attendu.
  for (const v of e.porte.filter(x => jour - n0(x.jour) >= REGLES_PORTE.attente)) {
    faits.push({ jour, cle: "porte-repart", public: true, params: { nom: v.nom }, texte: `${v.nom} n'a pas attendu davantage : il est reparti.` });
    delete m.porte[v.id];
  }
  e.porte = e.porte.filter(x => jour - n0(x.jour) < REGLES_PORTE.attente);
  // 2. Les suites prévues.
  for (const s of m.porteSuites.filter(x => n0(x.jour) <= jour)) {
    if (s.type === "feu") {
      if (ctx.aLAbri !== false) {
        bruit += REGLES_PORTE.suites.feu.bruit;
        faits.push({ jour, cle: "porte-feu", public: true, params: {}, texte: "Un feu s'allume dans la nuit, tout près du camp. Personne ne l'a vu allumer." });
        secrets.push({ jour, cle: "porte-feu-secret", public: false, params: { nom: s.nom ?? "?" }, texte: `Le feu, c'est ${s.nom ?? "le refusé"}, par rancune.` });
      }
    } else if (s.type === "revient" && s.secret) {
      const v = { id: s.id, jour, nom: s.secret.survivant?.nom ?? "?", age: s.secret.survivant?.age ?? 0, genre: s.secret.survivant?.genre ?? "", profil: s.secret.profil,
        bouches: s.secret.bouches ?? 0, apporte: structuredClone(s.apporte ?? {}), revient: true };
      v.demande = message("porte-revient", { nom: v.nom }, `${v.nom} revient, chargé de ce qui vous manquait, et redemande sa place.`);
      e.porte.push(v);
      m.porte[s.id] = s.secret;
      faits.push({ jour, cle: "porte-revient", public: true, params: { nom: v.nom }, texte: v.demande.texte });
    }
  }
  m.porteSuites = m.porteSuites.filter(x => n0(x.jour) > jour);
  // 3. Quelqu'un frappe.
  if (ctx.aLAbri && chance(chanceVisiteur(ctx), hasard)) {
    m.compteurPorte = n0(m.compteurPorte) + 1;
    const { public: v, secret } = tirerVisiteur(contenu, hasard, { id: `v${m.compteurPorte}`, jour, couleur: ctx.couleur, region: ctx.region, besoins: ctx.besoins });
    e.porte.push(v);
    m.porte[v.id] = secret;
    faits.push({ jour, cle: "porte-frappe", cleTexte: `porte-frappe-${v.profil}`, public: true, params: { nom: v.nom, n: v.bouches }, texte: `Quelqu'un frappe à la porte : ${v.demande.texte}` });
  }
  return { etat: e, monde: m, faits, secrets, bruit };
}

// La réponse du groupe à un visiteur (sans les membres : les jauges des membres passent par acteCollectif, moralite.mjs).
// -> { recrue (system | null), stocks: { ressource: n } (ce qu'on prend), suite (refus) | null, acte ("accueillir" | "exclure" |
//      "trahir"), monde, etat, faits }
export function repondreALaPorte(etat, monde, hasard = Math.random, { visiteurId, decision, jour = 0, liste = [] } = {}) {
  const v = (etat.porte ?? []).find(x => x.id === visiteurId);
  const secret = monde?.porte?.[visiteurId];
  if (!v || !secret) return { ok: false, motif: message("porte-inconnu", {}, "personne n'attend à la porte sous ce nom") };
  if (!DECISIONS_PORTE.includes(decision)) return { ok: false, motif: message("porte-decision", { decision }, `réponse inconnue « ${decision} »`) };
  if (decision === "trahir" && !Object.values(v.apporte ?? {}).some(x => n0(x) > 0)) return { ok: false, motif: message("porte-rien-a-prendre", { nom: v.nom }, `${v.nom} n'apporte rien`) };
  const e = { ...etat, porte: (etat.porte ?? []).filter(x => x.id !== visiteurId) };
  const m = { ...monde, porte: { ...(monde.porte ?? {}) }, porteSuites: [...(monde.porteSuites ?? [])] };
  delete m.porte[visiteurId];
  const faits = [];
  let recrue = null, suite = null, stocks = {}, acte = "";
  if (decision === "accueillir") {
    acte = "accueillir";
    recrue = structuredClone(secret.survivant);
    stocks = structuredClone(v.apporte ?? {});
    e.groupe = { ...e.groupe, accueilLe: jour };
    faits.push({ jour, cle: "porte-accueilli", public: true, params: { nom: v.nom }, texte: `${v.nom} est accueilli dans le groupe.` });
  } else if (decision === "refuser") {
    acte = "exclure";
    suite = suiteDuRefus(secret.survivant, hasard, { liste });
    const s = deplacerSensMoral(secret.survivant, suite.sens);
    if (suite.suite !== "part") m.porteSuites.push({ id: visiteurId, jour: jour + suite.dans, type: suite.suite, nom: v.nom, apporte: suite.apporte, secret: { ...secret, survivant: s } });
    faits.push({ jour, cle: "porte-refuse", public: true, params: { nom: v.nom }, texte: `On a refusé la porte à ${v.nom}.` });
  } else {
    acte = "trahir";
    stocks = structuredClone(v.apporte ?? {});
    // Il repart les mains vides ; il y voit le ciel : un point de chance (le jeu ne dit rien de plus).
    suite = { suite: "part", dans: 0, apporte: {}, sens: 0, chance: 1 };
    m.trahis = [...(m.trahis ?? []), { jour, nom: v.nom, survivant: donnerChance(secret.survivant) }].slice(-20);
    faits.push({ jour, cle: "porte-trahi", public: true, params: { nom: v.nom }, texte: `On a pris ce que ${v.nom} apportait, puis on l'a renvoyé.` });
  }
  return { ok: true, recrue, bouches: decision === "accueillir" ? n0(secret.bouches) : 0, stocks, suite, acte, etat: e, monde: m, faits, profil: secret.profil };
}
