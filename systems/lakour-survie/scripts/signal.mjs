// Le signal « à toi » (repris des Veillées) : chez le joueur seul, un tintement discret (canal « interface » de Foundry, jamais
// diffusé) et, s'il regarde un autre onglet, le titre de la page qui clignote jusqu'à son retour. Quand on attend quelque chose
// de lui : un test demandé (carte du MJ ou du MJ IA), une tâche à choisir. Le MJ n'en a pas ; réglage client « signalTour ».
import { ID } from "../logique/constantes.mjs";

export const VOLUME = 0.5;
let clignotement = null;

export function signaler(texte) {
  let actif = true;
  try { actif = game.settings.get(ID, "signalTour") !== false; } catch { /* réglage absent */ }
  if (game.user?.isGM || !actif) return false;
  try {
    foundry.audio?.AudioHelper?.play({ src: CONFIG?.sounds?.notification ?? "sounds/notify.wav", volume: VOLUME, autoplay: true, loop: false, channel: "interface" }, false)?.catch?.(() => {});
  } catch { /* sans son : le titre suffit */ }
  globalThis.ui?.notifications?.info?.(texte);
  clignoterTitre(texte);
  return true;
}

function clignoterTitre(texte) {
  if (typeof document === "undefined" || !document.hidden || clignotement) return;
  const origine = document.title;
  let allume = false;
  const retour = () => { if (!document.hidden) arreterClignotement(); };
  clignotement = { origine, retour, minuterie: setInterval(() => { document.title = (allume = !allume) ? `🔔 ${texte}` : origine; }, 1000) };
  document.addEventListener("visibilitychange", retour);
}

export function arreterClignotement() {
  if (!clignotement) return;
  clearInterval(clignotement.minuterie);
  document.title = clignotement.origine;
  document.removeEventListener("visibilitychange", clignotement.retour);
  clignotement = null;
}

// Une carte de chat qui demande un test au survivant de ce joueur (MJ IA : data-lakour-jet ; système : data-action="survieLancer").
// Seulement une carte écrite par un MJ (un joueur ne fait pas sonner les autres avec une carte forgée).
export function demandeDeTestPourMoi(message) {
  if (game.user?.isGM || !message?.author?.isGM) return false;
  const html = String(message?.content ?? "");
  const ids = [...html.matchAll(/data-(?:acteur)="(?:Actor\.)?([A-Za-z0-9]+)"/g)].map(m => m[1]);
  if (!ids.length || !(/data-lakour-jet|survieLancer/.test(html))) return false;
  return ids.some(id => game.actors?.get(id)?.isOwner);
}
