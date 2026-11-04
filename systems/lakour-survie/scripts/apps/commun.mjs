// Petits outils communs aux fenêtres (ApplicationV2 + Handlebars) du système.
import { ID } from "../../logique/constantes.mjs";
import { erreurLisible } from "../donnees.mjs";

export const CHEMIN = `systems/${ID}/templates`;

// Les champs nommés d'un conteneur -> { nom: valeur } (cases à cocher en booléens, listes multiples en tableaux, nombres en nombres).
export function lireChamps(racine) {
  const sortie = {};
  for (const el of racine?.querySelectorAll?.("[name]") ?? []) {
    if (el.disabled) continue;
    let v;
    if (el.type === "checkbox") v = el.checked;
    else if (el.multiple) v = [...el.selectedOptions].map(o => o.value);
    else if (el.type === "number" || el.dataset?.type === "number") v = el.value === "" ? null : Number(el.value);
    else v = el.value;
    if (el.type === "checkbox" && el.dataset?.liste) { (sortie[el.name] ??= []); if (el.checked) sortie[el.name].push(el.value); continue; }
    if (el.type === "radio") { if (el.checked) sortie[el.name] = el.value; continue; }
    sortie[el.name] = v;
  }
  return sortie;
}

// Une action qui peut échouer : l'erreur devient une notification lisible.
export async function essayer(fn) {
  try { return await fn(); } catch (e) {
    console.warn(`${ID} |`, e);
    globalThis.ui?.notifications?.error?.(erreurLisible(e));
    return null;
  }
}

// Options d'un <select> : [{ valeur, libelle, choisi }].
export const options = (paires, choisi = "") => paires.map(([valeur, libelle]) => ({ valeur, libelle, choisi: String(valeur) === String(choisi) }));

// Les flammes d'une passion (0, 1 ou 2).
export const flammes = n => (Number(n) >= 2 ? "🔥🔥" : Number(n) === 1 ? "🔥" : "");
export const jours = n => (Number(n) >= 999 ? "∞" : String(n ?? "?"));
