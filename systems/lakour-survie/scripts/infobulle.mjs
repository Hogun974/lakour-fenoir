// L'infobulle d'un jeton au survol (hook hoverToken, local) : un survivant (blessures, fatigue, moral, infection connue, tâche)
// ou un abri (stocks en jours). Ce que montrent déjà les fiches (acteurs publics) : rien du monde réel.
import { ID } from "../logique/constantes.mjs";
import { t, echapper, libelleTache, lireEtat } from "./donnees.mjs";
import { indexer } from "../logique/contenu.mjs";

const nomAffliction = cle => { try { return indexer(game.lakourSurvie?.contenu?.() ?? {}).afflictions.get(cle)?.nom ?? cle; } catch { return cle; } };

const BLESSURES = ["Indemne", "Egratigne", "Blesse", "Grievement", "Mourant"];

// Les lignes de l'infobulle d'un acteur (pure, éprouvée hors Foundry). -> null si rien à montrer.
export function contenuInfobulle(acteur) {
  const s = acteur?.system;
  if (!s) return null;
  if (acteur.type === "survivant") {
    const etats = [];
    if (s.livide) etats.push({ cle: "livide", texte: t("LAKOUR_SURVIE.Etat.Livide") });
    else if (s.vivant === false) etats.push({ cle: "mort", texte: t("LAKOUR_SURVIE.Etat.Mort") });
    else {
      etats.push({ cle: `blessures-${s.blessures ?? 0}`, texte: t(`LAKOUR_SURVIE.Blessures.${BLESSURES[s.blessures ?? 0] ?? "Indemne"}`) });
      if ((s.fatigue ?? 0) >= 3) etats.push({ cle: "fatigue", texte: t("LAKOUR_SURVIE.Infobulle.Fatigue", { n: s.fatigue }) });
      if ((s.moral ?? 4) <= 1) etats.push({ cle: "moral", texte: t("LAKOUR_SURVIE.Infobulle.Moral", { n: s.moral }) });
      if (s.infection?.atteint) etats.push({ cle: "infection", texte: t("LAKOUR_SURVIE.Infobulle.Infection", { n: s.infection.stade }) });
      for (const a of (s.afflictions ?? []).filter(x => x.stade === "active" || x.stade === "aggravee")) etats.push({ cle: "affliction", texte: nomAffliction(a.cle) });
    }
    return { nom: acteur.name, etats, ligne: s.tache ? `${t("LAKOUR_SURVIE.Fiche.Tache")} : ${libelleTache(s.tache)}` : "" };
  }
  if (acteur.type === "abri") {
    const b = lireEtat().groupe?.abri === acteur.id ? lireEtat().bilan : null;
    const j = b?.joursDeStocks;
    return { nom: acteur.name, etats: [], ligne: j ? t("LAKOUR_SURVIE.Infobulle.Stocks", { eau: j.eau >= 999 ? "∞" : j.eau, nourriture: j.nourriture >= 999 ? "∞" : j.nourriture }) : "" };
  }
  return null;
}

function element() {
  let el = document.getElementById(`${ID}-infobulle`);
  if (!el) {
    el = document.createElement("div");
    el.id = `${ID}-infobulle`;
    el.className = `${ID} survie-infobulle`;
    el.setAttribute("role", "tooltip");
    (document.getElementById("interface") ?? document.body).append(el);
  }
  return el;
}

export function montrerInfobulle(jeton, survole) {
  const el = element();
  const c = survole ? contenuInfobulle(jeton?.actor) : null;
  if (!c || !globalThis.canvas?.ready) { el.classList.remove("visible"); return; }
  el.innerHTML = `<div class="sib-nom">${echapper(c.nom)}</div>`
    + (c.etats.length ? `<div class="sib-etats">${c.etats.map(e => `<span class="sib-etat ${echapper(e.cle)}">${echapper(e.texte)}</span>`).join("")}</div>` : "")
    + (c.ligne ? `<div class="sib-ligne">${echapper(c.ligne)}</div>` : "");
  const haut = canvas.clientCoordinatesFromCanvas({ x: jeton.center.x, y: jeton.y });
  el.style.left = `${Math.round(haut.x)}px`;
  el.style.top = `${Math.round(haut.y - 10)}px`;
  el.classList.add("visible");
}

export function brancherInfobulle() {
  Hooks.on("hoverToken", (jeton, survole) => montrerInfobulle(jeton, survole));
  Hooks.on("canvasPan", () => document.getElementById(`${ID}-infobulle`)?.classList.remove("visible"));
}
