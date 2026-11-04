// Valide les données « system » des sources du module de contenu (modules/lakour-fenoir/src/) avec les VRAIS modèles de données
// du système lakour-survie (systems/lakour-survie/scripts/modeles.mjs) et les champs de Foundry v14, en validation stricte : ce que
// le serveur ferait au chargement des compendiums. Complète outils de lakour-mj-ia/valider-foundry.mjs (qui ne vérifie que la
// structure Foundry, pas les données propres au système). Le code de Foundry n'est pas dans le dépôt : indiquer le dossier qui
// contient common/ (copie d'une installation v14).
// Usage : node outils/valider-modeles.mjs <dossier contenant common/> [module=modules/lakour-fenoir]
import { readdirSync, readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL, fileURLToPath } from "node:url";

if (!process.argv[2]) { console.error("Usage : node outils/valider-modeles.mjs <dossier de Foundry contenant common/> [module]"); process.exit(2); }
const foundry = await import(pathToFileURL(join(process.argv[2], "common", "server.mjs")).href);
globalThis.foundry = foundry;
globalThis.CONST = foundry.CONST;
const RACINE = fileURLToPath(new URL("../", import.meta.url));
const { MODELES_ACTEURS, MODELES_OBJETS } = await import(pathToFileURL(join(RACINE, "systems/lakour-survie/scripts/modeles.mjs")).href);
const module = join(RACINE, process.argv[3] ?? "modules/lakour-fenoir");

let n = 0, erreurs = 0;
const valider = (type, systeme, ou) => {
  const Modele = MODELES_ACTEURS[type] ?? MODELES_OBJETS[type];
  if (!Modele) { erreurs++; console.log(`✖ ${ou} : type « ${type} » sans modèle`); return; }
  n++;
  try {
    const m = new Modele(structuredClone(systeme ?? {}), { strict: true });
    // Un champ du contenu qui disparaîtrait au nettoyage (inconnu du modèle) : signalé, pas bloquant.
    const perdus = Object.keys(systeme ?? {}).filter(k => !(k in m._source));
    if (perdus.length) console.log(`· ${ou} : champs ignorés par le modèle ${perdus.join(", ")}`);
  } catch (e) {
    erreurs++;
    console.log(`✖ ${ou} : ${String(e.message ?? e).split("\n").slice(0, 6).join(" | ").slice(0, 500)}`);
  }
};
const src = join(module, "src");
for (const d of existsSync(src) ? readdirSync(src) : []) {
  for (const f of readdirSync(join(src, d))) {
    const doc = JSON.parse(readFileSync(join(src, d, f), "utf8"));
    if (!doc.system) continue;
    valider(doc.type, doc.system, `${d}/${f}`);
    for (const i of doc.items ?? []) if (i.system) valider(i.type, i.system, `${d}/${f} > ${i.name}`);
  }
}
// Et les formes que le système crée lui-même (enfances, traits du registre ; un survivant et un abri vides).
const donnees = JSON.parse(readFileSync(join(module, "assets/donnees.json"), "utf8"));
for (const e of donnees.enfances ?? []) { const { nom, ...s } = e; valider("enfance", s, `registre/enfance ${e.cle}`); }
for (const t of donnees.traits ?? []) { const { nom, ...s } = t; valider("trait", s, `registre/trait ${t.cle}`); }
valider("survivant", {}, "survivant vide");
valider("abri", {}, "abri vide");
console.log(`${n} données système, ${erreurs} en erreur`);
process.exitCode = erreurs ? 1 : 0;
