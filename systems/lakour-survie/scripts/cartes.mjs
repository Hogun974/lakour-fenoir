// Les cartes de chat du système : tests (dés colorés, succès, bouton Forcer pour le propriétaire), faits publics du temps qui
// passe, actions du groupe, assauts. Toutes PUBLIQUES : jamais rien du monde réel (un fait secret n'arrive jamais ici).
import { t, echapper, sansBalises, localiser, libelleCompetence, libelleDifficulte, libelleRessource, libelleMoment, libellePhase } from "./donnees.mjs";

const de = (v, force = false) => `<span class="survie-de ${v >= 5 ? "succes" : v === 1 ? "un" : "echec"}${force ? " relance" : ""}">${v}</span>`;

// Le texte court d'un test (pour le MJ IA et le chat).
export function texteTest(nom, competence, r) {
  const issue = r.reussite ? t("LAKOUR_SURVIE.Test.Reussite") : t("LAKOUR_SURVIE.Test.Echec");
  return `${nom}, ${libelleCompetence(competence)} (${libelleDifficulte(r.difficulte)}) : ${r.succes}/${r.requis} — ${issue}`
    + `${r.force ? ` (${t("LAKOUR_SURVIE.Test.Force")})` : ""}${r.complication ? ` — ${t("LAKOUR_SURVIE.Test.Complication")}` : ""}`;
}

// La carte d'un test. info : { nom, competence, titre, monte, niveau }.
export function carteTest(r, info = {}) {
  const finals = r.desForces ?? r.des;
  const lignes = [`<div class="survie-des">${r.des.map(v => de(v)).join("")}</div>`];
  if (r.desForces) lignes.push(`<div class="survie-des forces"><span class="survie-etiquette">${t("LAKOUR_SURVIE.Test.Relance")}</span>${finals.map((v, i) => de(v, v !== r.des[i])).join("")}</div>`);
  const issue = r.reussite ? "reussite" : "echec";
  const marge = r.reussite && r.marge > 0 ? ` <small>(${t("LAKOUR_SURVIE.Test.Marge", { n: r.marge })})</small>` : "";
  const extras = [
    r.force ? `<li><i class="fa-solid fa-person-running"></i> ${t("LAKOUR_SURVIE.Test.FatigueForcee")}</li>` : "",
    r.complication ? `<li class="complication"><i class="fa-solid fa-triangle-exclamation"></i> ${t("LAKOUR_SURVIE.Test.ComplicationTexte")}</li>` : "",
    r.marque ? `<li><i class="fa-solid fa-feather"></i> ${t("LAKOUR_SURVIE.Test.Marque")}</li>` : "",
    info.chance ? `<li class="chance"><i class="fa-solid fa-clover"></i> ${t("LAKOUR_SURVIE.Test.Chance")}</li>` : "",
    info.monte ? `<li class="monte"><i class="fa-solid fa-arrow-up"></i> ${t("LAKOUR_SURVIE.Test.Monte", { competence: libelleCompetence(info.competence), niveau: info.niveau })}</li>` : ""
  ].filter(Boolean).join("");
  const bouton = !r.force && info.forcable !== false ?`<button type="button" class="survie-forcer" data-action="survieForcer"><i class="fa-solid fa-dice"></i> ${t("LAKOUR_SURVIE.Test.Forcer")}</button>` : "";
  return `<div class="lakour-survie survie-carte survie-test ${issue}">`
    + `<header><span class="survie-carte-titre">${echapper(info.titre || libelleCompetence(info.competence))}</span>`
    + `<span class="survie-carte-sous">${echapper(info.nom ?? "")} · ${libelleCompetence(info.competence)} · ${libelleDifficulte(r.difficulte)}</span></header>`
    + lignes.join("")
    + `<p class="survie-issue ${issue}"><strong>${r.succes}</strong> / ${r.requis} — ${r.reussite ? t("LAKOUR_SURVIE.Test.Reussite") : t("LAKOUR_SURVIE.Test.Echec")}${marge}</p>`
    + (extras ? `<ul class="survie-extras">${extras}</ul>` : "")
    + bouton + "</div>";
}

// Les faits et alertes arrivent en { cle, params, texte } : rendus dans la langue de qui écrit la carte (le MJ actif).
const listeFaits = faits => (faits.length ? `<ul class="survie-faits">${faits.map(f => `<li>${echapper(sansBalises(localiser(f)))}</li>`).join("")}</ul>` : "");

// Le temps qui passe : le moment, les faits publics, les alertes.
export function carteTemps({ quand, faits = [], alertes = [], raison = "", quarts = 0 }) {
  return `<div class="lakour-survie survie-carte survie-temps">`
    + `<header><span class="survie-carte-titre"><i class="fa-solid fa-hourglass-half"></i> ${t("LAKOUR_SURVIE.Carte.Temps", { n: quarts })}</span>`
    + `<span class="survie-carte-sous">${t("LAKOUR_SURVIE.Bandeau.Jour", { n: quand.jour })} · ${libelleMoment(quand.moment)} · ${echapper(quand.dateTexte)} · ${libellePhase(quand.phase)}</span></header>`
    + (raison ? `<p class="survie-raison">${echapper(raison)}</p>` : "")
    + listeFaits(faits)
    + (alertes.length ? `<ul class="survie-alertes">${alertes.map(a => `<li><i class="fa-solid fa-bell"></i> ${echapper(sansBalises(localiser(a)))}</li>`).join("")}</ul>` : "")
    + "</div>";
}

// Une action du groupe (fouille, exploration, voyage, chantier, fabrication, fête…).
export function carteAction({ icone = "fa-person-hiking", titre, lignes = [], faits = [] }) {
  return `<div class="lakour-survie survie-carte survie-action">`
    + `<header><span class="survie-carte-titre"><i class="fa-solid ${icone}"></i> ${echapper(titre)}</span></header>`
    + (lignes.length ? `<ul class="survie-lignes">${lignes.filter(Boolean).map(l => `<li>${echapper(l)}</li>`).join("")}</ul>` : "")
    + listeFaits(faits) + "</div>";
}

export const texteStocks = stocks => Object.entries(stocks ?? {}).filter(([, q]) => Number(q) > 0).map(([r, q]) => `${q} ${libelleRessource(r).toLowerCase()}`).join(", ");

// Un assaut contre l'abri (public : ce qui frappe à la porte, tout le groupe le voit).
export function carteAssaut(r, { type = "", description = "", degats = [], blesses = [] } = {}) {
  const issue = r.issue;
  return `<div class="lakour-survie survie-carte survie-assaut ${issue}">`
    + `<header><span class="survie-carte-titre"><i class="fa-solid fa-shield-halved"></i> ${t("LAKOUR_SURVIE.Assaut.Titre")}${type ? ` — ${echapper(type)}` : ""}</span></header>`
    + (description ? `<p>${echapper(sansBalises(description))}</p>` : "")
    + `<div class="survie-duel"><div><span class="survie-etiquette">${t("LAKOUR_SURVIE.Assaut.Defense")}</span><div class="survie-des">${r.desDefense.map(v => de(v)).join("")}</div></div>`
    + `<div><span class="survie-etiquette">${t("LAKOUR_SURVIE.Assaut.Menace")}</span><div class="survie-des menace">${r.desMenace.map(v => de(v)).join("")}</div></div></div>`
    + `<p class="survie-issue ${issue}"><strong>${r.succesDefense}</strong> / <strong>${r.succesMenace}</strong> — ${t(`LAKOUR_SURVIE.Assaut.Issues.${issue}`)}</p>`
    + (degats.length ? `<p><i class="fa-solid fa-hammer"></i> ${echapper(degats.join(", "))}</p>` : "")
    + (blesses.length ? `<p><i class="fa-solid fa-droplet"></i> ${echapper(blesses.join(", "))}</p>` : "")
    + "</div>";
}

// Une demande de test du MJ à un joueur (bouton « Lancer » pour le propriétaire).
export function carteDemandeTest({ acteurId, nom, competence, difficulte, titre = "" }) {
  return `<div class="lakour-survie survie-carte survie-demande">`
    + `<header><span class="survie-carte-titre"><i class="fa-solid fa-dice-six"></i> ${echapper(titre || t("LAKOUR_SURVIE.Test.Demande"))}</span>`
    + `<span class="survie-carte-sous">${echapper(nom)} · ${libelleCompetence(competence)} · ${libelleDifficulte(difficulte)}</span></header>`
    + `<button type="button" class="survie-lancer" data-action="survieLancer" data-acteur="${echapper(acteurId)}" data-competence="${echapper(competence)}" data-difficulte="${echapper(difficulte)}"><i class="fa-solid fa-dice"></i> ${t("LAKOUR_SURVIE.Test.Lancer")}</button>`
    + "</div>";
}

// Une proposition d'action d'un joueur (tableau de bord), relayée au MJ et au MJ IA.
export function carteProposition({ nom, type, details }) {
  return `<div class="lakour-survie survie-carte survie-proposition">`
    + `<header><span class="survie-carte-titre"><i class="fa-solid fa-hand"></i> ${t("LAKOUR_SURVIE.Proposition.Titre", { nom: echapper(nom) })}</span>`
    + `<span class="survie-carte-sous">${t(`LAKOUR_SURVIE.Proposition.Types.${type}`)}</span></header>`
    + (details ? `<p>${echapper(details)}</p>` : "") + "</div>";
}
