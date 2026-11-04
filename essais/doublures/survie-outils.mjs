// Outils communs aux essais de la logique de lakour-survie : dés truqués, partie complète pilotée jour par jour.
import * as L from "../../systems/lakour-survie/logique/index.mjs";
import { contenuMini } from "./contenu-mini.mjs";

export { L, contenuMini };

// Un « hasard » qui donne les faces de d6 voulues, dans l'ordre (puis recommence).
export function desFixes(faces) {
  let i = 0;
  return () => (faces[i++ % faces.length] - 1) / 6 + 0.01;
}
// Un hasard constant (0 = tout arrive, 0,999 = rien n'arrive).
export const constant = x => () => x;

export const I = (cle, niveau, extra = {}) => L.instanceInstallation(cle, niveau, { termineLe: 0, ...extra });

// Une partie complète : installer le groupe sur un site, puis avancer jour par jour.
// chaqueJour(ctx, jour) peut agir (fouiller…) avant que le jour passe ; il reçoit et rend ctx.
export function partie({ contenu = contenuMini(), site, installations = [], jours = 30, membres = ["a", "b", "c", "d"], graine = "s1", apport = {}, chaqueJour = null } = {}) {
  const region = L.siteDe(contenu, site).region;
  let { monde, etat } = L.demarrerPartie({ contenu, graine, region, membres });
  const ins = L.installerAbri(monde, contenu, { site, jour: 0, apport });
  monde = ins.monde;
  let ctx = {
    contenu, monde, etat,
    abri: { id: "abri", system: ins.abri, installations: [...ins.installations, ...installations] },
    survivants: membres.map(id => ({ id, system: L.survivantNeuf({}) })),
    historique: []
  };
  for (let j = 0; j < jours; j++) {
    if (chaqueJour) ctx = chaqueJour(ctx, j) ?? ctx;
    const r = L.avancer({ etat: ctx.etat, monde: ctx.monde, contenu, quarts: 4, survivants: ctx.survivants, abri: ctx.abri });
    ctx.etat = r.etat; ctx.monde = r.monde; ctx.abri = r.acteurs.abri;
    for (const c of r.acteurs.survivants) ctx.survivants = ctx.survivants.map(s => (s.id === c.id ? { id: s.id, system: c.system } : s));
    ctx.historique.push({ jour: j + 1, etat: ctx.etat, stocks: { ...ctx.abri.system.stocks }, bilan: r.bilan, survivants: ctx.survivants.map(s => s.system), r });
  }
  return ctx;
}
