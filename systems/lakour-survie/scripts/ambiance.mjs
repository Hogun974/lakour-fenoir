// Ambiances sonores de Fénoir (reprises des Veillées), chez le MJ actif : si le module MJ IA est actif, sa playlist
// « Ambiances (MJ IA) » et ses sons (modules/lakour-mj-ia/assets/sons/index.json) : « orage » pendant un cyclone, « pluie » par
// fortes pluies, « tension » quelques minutes après un assaut, « nuit » le soir et la nuit ; rien le jour par beau temps.
// Sans le module, ou réglage client « ambiance » décoché : rien. On ne lit que la météo PUBLIQUE et le moment.
import { ID } from "../logique/constantes.mjs";
import { estMJActif } from "./canal.mjs";
import { lireEtat, reglage, MODULE_MJIA } from "./donnees.mjs";
import { momentDe } from "../logique/temps.mjs";

const NOM_PLAYLIST = "Ambiances (MJ IA)";
export const VOLUME = 0.3;
export const DUREE_TENSION = 180000;
let derniere = null;
let tensionJusqua = 0;

// La clé de son voulue pour l'état public (pure).
export function ambianceVoulue(etat, { tension = false } = {}) {
  if (!etat?.demarree) return "";
  if (tension) return "tension";
  const temps = etat.meteo?.temps ?? "";
  if (temps === "cyclone") return "orage";
  if (temps === "pluie") return "pluie";
  const moment = momentDe(etat.horloge?.quart ?? 0);
  return moment === "nuit" || moment === "soir" ? "nuit" : "";
}

export const ambiancesDisponibles = () => Boolean(game.modules?.get?.(MODULE_MJIA)?.active && game.playlists);
export function signalerAssaut() { tensionJusqua = Date.now() + DUREE_TENSION; return suivreAmbiance(); }

export async function suivreAmbiance() {
  if (!estMJActif() || !ambiancesDisponibles() || !reglage("ambiance", true)) return null;
  const voulue = ambianceVoulue(lireEtat(), { tension: Date.now() < tensionJusqua });
  if (voulue === derniere) return null;
  derniere = voulue;
  let playlist = game.playlists.find(p => p.getFlag?.(MODULE_MJIA, "ambiances") || p.name === NOM_PLAYLIST);
  try {
    if (!voulue) {
      if (playlist) for (const s of playlist.sounds.filter(x => x.playing)) await s.update({ playing: false });
      return "";
    }
    const index = await (await fetch(foundry.utils.getRoute(`modules/${MODULE_MJIA}/assets/sons/index.json`), { cache: "no-store" })).json().catch(() => ({}));
    const son = index[voulue];
    if (!son) return null;
    playlist ??= await Playlist.implementation.create({ name: NOM_PLAYLIST, mode: CONST.PLAYLIST_MODES?.DISABLED ?? -1, flags: { [MODULE_MJIA]: { ambiances: true } } });
    let piste = playlist.sounds.find(s => s.getFlag?.(MODULE_MJIA, "ambiance") === voulue);
    if (!piste) [piste] = await playlist.createEmbeddedDocuments("PlaylistSound", [{ name: son.libelle, path: son.fichier, repeat: true, fade: 2000, flags: { [MODULE_MJIA]: { ambiance: voulue } } }]);
    for (const autre of playlist.sounds.filter(s => s.playing && s.id !== piste.id)) await autre.update({ playing: false });
    await piste.update({ playing: true, volume: VOLUME });
    if (voulue === "tension") setTimeout(() => suivreAmbiance().catch(() => null), DUREE_TENSION + 1000);
    return voulue;
  } catch (e) {
    console.warn(`${ID} | ambiance ${voulue}`, e);
    return null;
  }
}

export function oublierAmbiance() { derniere = null; tensionJusqua = 0; }
