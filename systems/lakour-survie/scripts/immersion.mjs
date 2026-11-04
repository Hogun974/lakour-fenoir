// L'immersion de Fénoir (reprise des Veillées), avec le canevas de Foundry v14 :
// - la lumière de la scène suit le moment de la journée (matin et après-midi clairs, soir tombant, nuit noire) : chez le MJ actif,
//   réglage monde « lumiereSuitLeMoment », jamais sur une scène dont l'obscurité est verrouillée (environment.darknessLock) ni
//   sur une scène marquée flags.lakour-survie.lumiere === false ; animée (option animateDarkness de Scene#update) ;
// - la pluie (effet météo de Foundry, CONFIG.weatherEffects : « rain », « rainStorm » au cyclone) chez CHAQUE client, d'après la
//   météo publique de l'état (etat.meteo.temps), seulement sur une scène sans météo à elle ; rien n'est écrit dans la scène ;
// - un léger tremblement de l'écran à un assaut ou une brèche (foundry.canvas.animation.CanvasShakeEffect).
// Rien ne bouge si le joueur a coupé « Effets visuels », si son système demande moins de mouvement, ou en mode photosensible.
import { ID } from "../logique/constantes.mjs";
import { momentDe } from "../logique/temps.mjs";
import { estMJActif } from "./canal.mjs";
import { lireEtat, reglage } from "./donnees.mjs";

export const OBSCURITE = { matin: 0, "apres-midi": 0.05, soir: 0.55, nuit: 0.85 };
export const SECOUSSE = Object.freeze({ duration: 600, maxDisplacement: 7, smoothness: 0.5, returnSpeed: 0.2, invalidateMasks: true });
export const DUREE_LUMIERE = 6000;
let meteoPosee = null;

export function mouvementReduit() {
  try { return Boolean(globalThis.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches); } catch { return false; }
}
export function effetsPermis() {
  return reglage("effetsVisuels", true) !== false && !mouvementReduit() && !globalThis.canvas?.photosensitiveMode;
}
const canevasPret = () => Boolean(globalThis.canvas?.ready && canvas.scene);

// L'obscurité voulue pour l'état public (pure) ; null : partie pas commencée.
export function obscuriteVoulue(etat) {
  if (!etat?.demarree) return null;
  const base = OBSCURITE[momentDe(etat.horloge?.quart ?? 0)] ?? 0;
  return etat.meteo?.temps === "cyclone" ? Math.max(base, 0.6) : etat.meteo?.temps === "pluie" ? Math.max(base, 0.25) : base;
}
// L'effet météo voulu (pure) : clé de CONFIG.weatherEffects, ou "".
export const meteoVoulue = etat => (etat?.meteo?.temps === "cyclone" ? "rainStorm" : etat?.meteo?.temps === "pluie" ? "rain" : "");

// Chez le MJ actif : la lumière de la scène active suit le moment.
export async function suivreLumiere() {
  if (!estMJActif() || !reglage("lumiereSuitLeMoment", true)) return null;
  const scene = game.scenes?.active ?? globalThis.canvas?.scene;
  if (!scene || scene.environment?.darknessLock || scene.getFlag?.(ID, "lumiere") === false) return null;
  const voulue = obscuriteVoulue(lireEtat());
  if (voulue === null || Math.abs((Number(scene.environment?.darknessLevel) || 0) - voulue) < 0.01) return null;
  await scene.update({ "environment.darknessLevel": voulue }, { animateDarkness: DUREE_LUMIERE });
  return voulue;
}

// Chez chacun : la pluie sur le canevas (sans toucher à la scène).
export function suivreMeteo() {
  if (!canevasPret() || !canvas.weather?.initializeEffects) return null;
  const propre = canvas.scene.weather;
  const voulue = effetsPermis() ? meteoVoulue(lireEtat()) : "";
  if (propre) { meteoPosee = null; return null; }   // la scène a sa météo : on n'y touche pas
  if (voulue === meteoPosee) return null;
  meteoPosee = voulue;
  try { canvas.weather.initializeEffects(voulue ? CONFIG.weatherEffects?.[voulue] ?? null : null); } catch (e) { console.warn(`${ID} | météo`, e); }
  return voulue;
}

export function secouer() {
  const C = globalThis.foundry?.canvas?.animation?.CanvasShakeEffect;
  if (!C || !effetsPermis() || !canevasPret() || !canvas.stage) return null;
  try { const s = new C({ target: canvas.stage, ...SECOUSSE }); s.play(); return s; } catch (e) { console.warn(`${ID} | tremblement`, e); return null; }
}

export function brancherImmersion() {
  Hooks.on("lakourSurvie.assaut", () => secouer());
  Hooks.on("canvasReady", () => { meteoPosee = null; suivreMeteo(); suivreLumiere().catch(() => null); });
}
export const oublierImmersion = () => { meteoPosee = null; };
