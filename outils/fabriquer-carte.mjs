// Fabrique la carte de jeu de La Réunion : modules/lakour-fenoir/assets/cartes/reunion.webp (4000 × 3000, nord en haut),
// fond de la scène « Carte de La Réunion » (contenu/cartes.mjs). Aucun modèle d'IA : tout est calculé ici.
//
//   node outils/fabriquer-carte.mjs --telecharger [--brut <dossier>]   (re)construit outils/donnees-carte/ depuis les sources publiques
//   node outils/fabriquer-carte.mjs [--apercu <dossier>]                 dessine la carte (et des aperçus JPEG dans <dossier>)
//   node outils/fabriquer-carte.mjs --langue en                          seulement la version anglaise (fr : seulement la française)
//
// Deux versions, même fond, seuls les textes gravés changent : la française (assets/cartes/reunion.webp) et l'anglaise
// (contenu/en/assets/cartes/reunion.webp, hors du zip français ; outils/fabriquer-fenoir.mjs --langue en la pose à la place de
// assets/cartes/reunion.webp dans lakour-fenoir-en, la scène anglaise garde donc le même chemin). Textes anglais : contenu/en/
// carte.json (cartouche, légende, points cardinaux, échelle, crédits, lignes des régions) ; les noms de lieux réels ne changent
// pas. Un texte français sans traduction arrête tout. Les textes gravés dans l'image anglaise sont notés dans
// donnees-carte/reunion.en.textes.json (l'essai essais/cartes-anglaises.test.mjs les compare au dictionnaire).
//
// Sources (voir outils/donnees-carte/SOURCES.md) : contour IGN Admin Express (france-geojson, Licence ouverte), relief Terrain
// Tiles (AWS Open Data : SRTM, ETOPO1…), routes et sentiers OpenStreetMap (ODbL). Rendu : @resvg/resvg-js (déjà dans
// node_modules) pour le masque de l'île et les surcouches vectorielles, calcul des pixels en JavaScript, encodage WebP par ffmpeg.
// Projection : celle des repères des régions (contenu/regions.mjs) : 1 km ≈ 46 px, 55,216 E -> x 528, 20,87 S -> y 166.
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, realpathSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { gunzipSync, gzipSync, inflateSync } from "node:zlib";
import { repere as repereContenu } from "../modules/lakour-fenoir/contenu/regions.mjs";

const require = createRequire(import.meta.url);
const { Resvg } = require("@resvg/resvg-js");

const DONNEES = new URL("donnees-carte/", import.meta.url);
const REGISTRE = new URL("../modules/lakour-fenoir/assets/donnees.json", import.meta.url);
const SORTIE = new URL("../modules/lakour-fenoir/assets/cartes/reunion.webp", import.meta.url);
export const SORTIE_EN = new URL("../modules/lakour-fenoir/contenu/en/assets/cartes/reunion.webp", import.meta.url);
const SORTIES = { fr: SORTIE, en: SORTIE_EN };
export const LIBELLES_EN = new URL("../modules/lakour-fenoir/contenu/en/carte.json", import.meta.url);
export const TEXTES_GRAVES_EN = new URL("donnees-carte/reunion.en.textes.json", import.meta.url);
const W = 4000, H = 3000, PX_KM = 46;
const POLICE = "Palatino Linotype";

// ---------------------------------------------------------------- Projection (identique à repere() du contenu, sans arrondi)
const KX = 103.9 * PX_KM, KY = 110.6 * PX_KM;
const versX = lon => 528 + (lon - 55.216) * KX;
const versY = lat => 166 + (Math.abs(lat) - 20.87) * KY;
const versLon = x => 55.216 + (x - 528) / KX;
const versLat = y => -(20.87 + (y - 166) / KY);
for (const [lon, lat] of [[55.45, -20.89], [55.7, -21.23]]) {
  const r = repereContenu(lon, lat);
  if (r.x !== Math.round(versX(lon)) || r.y !== Math.round(versY(lat))) throw new Error("La projection ne suit plus repere() de contenu/regions.mjs");
}

// Grille du relief : une maille = 4 px de carte (≈ 87 m), 1000 × 750, altitudes en mètres (Int16, gzip).
const MAILLE = 4, GW = W / MAILLE, GH = H / MAILLE;

const args = process.argv.slice(2);
const option = nom => { const i = args.indexOf(nom); return i >= 0 ? (args[i + 1] ?? true) : null; };

// ================================================================ Téléchargement des sources
const SOURCE_CONTOUR = "https://raw.githubusercontent.com/gregoiredavid/france-geojson/master/departements/974-la-reunion/departement-974-la-reunion.geojson";
const SOURCE_TUILES = (z, x, y) => `https://s3.amazonaws.com/elevation-tiles-prod/terrarium/${z}/${x}/${y}.png`;
const OVERPASS = ["https://overpass-api.de/api/interpreter", "https://overpass.private.coffee/api/interpreter", "https://overpass.kumi.systems/api/interpreter"];
const BBOX = "-21.40,55.20,-20.86,55.85";
const REQUETES = {
  "routes.json": `[out:json][timeout:240];way[highway~"^(motorway|trunk|primary|secondary)$"](${BBOX});out tags geom;`,
  "gr.json": `[out:json][timeout:240];relation[route=hiking][ref~"^GR ?R ?[123]"](${BBOX})->.r;way(r.r);out tags geom;`,
  // Les classes de caractères d'Overpass travaillent sur des octets : alternances plutôt que [ïi] pour les lettres accentuées.
  "chemins.json": `[out:json][timeout:240];(way[highway~"^(path|track|footway|steps)$"][name~"Canalisation des Orangers|Roche.Plate|B(é|e)louve|Ta(ï|i)bit|B(œ|oe)ufs|Rivi(è|e)re des Galets|Dos d.(Â|A)ne|Deux.Bras|Aur(è|e)re|Ma(ï|i)do"](${BBOX});way[highway][ref~"^RF"](${BBOX}););out tags geom;`
};
const AGENT = { "User-Agent": "lakour-fenoir-carte/1.0 (carte de jeu, usage prive)" };

async function telecharger() {
  mkdirSync(DONNEES, { recursive: true });
  // 1. Contour (IGN Admin Express simplifié, via france-geojson).
  const contour = await (await fetch(SOURCE_CONTOUR, { headers: AGENT })).text();
  JSON.parse(contour);
  writeFileSync(new URL("contour-974.geojson", DONNEES), contour);
  console.log("contour : ok");

  // 2. Relief : tuiles Terrarium au zoom 11, rééchantillonnées dans la projection de la carte.
  const z = 11, n = 2 ** z;
  const tx = lon => (lon + 180) / 360 * n;
  const ty = lat => { const r = lat * Math.PI / 180; return (1 - Math.log(Math.tan(r) + 1 / Math.cos(r)) / Math.PI) / 2 * n; };
  const x0 = Math.floor(tx(versLon(0))), x1 = Math.floor(tx(versLon(W))), y0 = Math.floor(ty(versLat(0))), y1 = Math.floor(ty(versLat(H)));
  const mw = (x1 - x0 + 1) * 256, mh = (y1 - y0 + 1) * 256, mosaique = new Float32Array(mw * mh);
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
    const rep = await fetch(SOURCE_TUILES(z, x, y), { headers: AGENT });
    if (!rep.ok) throw new Error(`tuile ${z}/${x}/${y} : ${rep.status}`);
    const img = lirePNG(Buffer.from(await rep.arrayBuffer()));
    for (let j = 0; j < 256; j++) for (let i = 0; i < 256; i++) {
      const k = (j * 256 + i) * img.canaux;
      mosaique[((y - y0) * 256 + j) * mw + (x - x0) * 256 + i] = img.donnees[k] * 256 + img.donnees[k + 1] + img.donnees[k + 2] / 256 - 32768;
    }
  }
  const grille = new Int16Array(GW * GH);
  for (let j = 0; j < GH; j++) for (let i = 0; i < GW; i++) {
    const lon = versLon(i * MAILLE + MAILLE / 2), lat = versLat(j * MAILLE + MAILLE / 2);
    grille[j * GW + i] = Math.round(echantillon(mosaique, mw, mh, (tx(lon) - x0) * 256 - 0.5, (ty(lat) - y0) * 256 - 0.5));
  }
  writeFileSync(new URL("relief-974.bin.gz", DONNEES), gzipSync(Buffer.from(grille.buffer), { level: 9 }));
  console.log(`relief : ${(x1 - x0 + 1) * (y1 - y0 + 1)} tuiles`);

  // 3. Routes et sentiers OpenStreetMap (Overpass), simplifiés.
  const brut = option("--brut");
  const json = {};
  for (const [fichier, requete] of Object.entries(REQUETES)) {
    if (typeof brut === "string" && existsSync(`${brut}/${fichier}`)) { json[fichier] = JSON.parse(readFileSync(`${brut}/${fichier}`, "utf8")); continue; }
    let erreur;
    for (const url of OVERPASS) {
      try {
        const rep = await fetch(url, { method: "POST", headers: { ...AGENT, "Content-Type": "application/x-www-form-urlencoded" }, body: `data=${encodeURIComponent(requete)}` });
        if (!rep.ok) throw new Error(`${url} : ${rep.status}`);
        json[fichier] = await rep.json(); erreur = null; break;
      } catch (e) { erreur = e; }
    }
    if (erreur) throw erreur;
  }
  writeFileSync(new URL("routes-osm.json", DONNEES), `${JSON.stringify(trierOSM(json), null, 0).replace(/\},\{/g, "},\n{")}\n`);
  console.log("routes et sentiers : ok");
}

// Classe chaque voie OSM : nationale, departementale, piste (route forestière), sentier.
const SECONDAIRES = new Set(["N 5", "D 48", "D 3", "D 41"]);
// Routes forestières du contenu (route du Volcan, gîte du Volcan, Maïdo, Bébour-Bélouve) ; sentiers nommés hors GR.
const PISTES = new Set(["RF 5", "RF 51", "RF 8", "RF 2", "RF 13"]);
const SENTIERS_NOMMES = /Canalisation des Orangers|Roche.Plate|B(é|e)louve|Ta(ï|i)bit|B(œ|oe)ufs|Rivi(è|e)re des Galets|Dos d.(Â|A)ne|Deux.Bras|Aur(è|e)re|Ma(ï|i)do/i;
function trierOSM(json) {
  const voies = [], vues = new Set();
  const ajouter = (e, classe) => {
    if (vues.has(e.id) || !e.geometry?.length) return;
    vues.add(e.id);
    const pts = douglasPeucker(e.geometry.map(p => [p.lon, p.lat]), 0.00008).map(([a, b]) => [+a.toFixed(5), +b.toFixed(5)]);
    voies.push({ classe, nom: e.tags?.name ?? "", ref: e.tags?.ref ?? "", pts });
  };
  for (const e of json["routes.json"].elements) {
    const h = e.tags.highway, refs = (e.tags.ref ?? "").split(";").map(s => s.trim());
    if (["motorway", "trunk"].includes(h) || (h === "primary" && refs.some(r => r.startsWith("N")))) ajouter(e, "nationale");
    else if (h === "primary" || refs.some(r => SECONDAIRES.has(r))) ajouter(e, "departementale");
  }
  for (const e of json["chemins.json"].elements) {
    const h = e.tags.highway, ref = e.tags.ref ?? "", nom = e.tags.name ?? "";
    if (PISTES.has(ref.replace(/\s+/g, " ")) && !["residential", "service"].includes(h)) ajouter(e, "piste");
    else if (["path", "footway", "track", "steps"].includes(h) && SENTIERS_NOMMES.test(nom)) ajouter(e, "sentier");
  }
  for (const e of json["gr.json"].elements) {
    const h = e.tags?.highway;
    if (["path", "footway", "track", "steps", "bridleway"].includes(h)) ajouter(e, "sentier");
  }
  return voies;
}

function douglasPeucker(pts, tol) {
  if (pts.length < 3) return pts;
  const garde = new Uint8Array(pts.length); garde[0] = garde[pts.length - 1] = 1;
  const pile = [[0, pts.length - 1]];
  while (pile.length) {
    const [a, b] = pile.pop();
    const [ax, ay] = pts[a], [bx, by] = pts[b], dx = bx - ax, dy = by - ay, l = Math.hypot(dx, dy) || 1e-12;
    let max = 0, k = -1;
    for (let i = a + 1; i < b; i++) { const d = Math.abs((pts[i][0] - ax) * dy - (pts[i][1] - ay) * dx) / l; if (d > max) { max = d; k = i; } }
    if (max > tol) { garde[k] = 1; pile.push([a, k], [k, b]); }
  }
  return pts.filter((_, i) => garde[i]);
}

// Décodeur PNG minimal (8 bits, RVB ou RVBA, non entrelacé) : suffit aux tuiles Terrarium.
function lirePNG(buf) {
  let p = 8, w = 0, h = 0, type = 0; const idat = [];
  while (p < buf.length) {
    const len = buf.readUInt32BE(p), nom = buf.toString("latin1", p + 4, p + 8), d = buf.subarray(p + 8, p + 8 + len);
    if (nom === "IHDR") { w = d.readUInt32BE(0); h = d.readUInt32BE(4); type = d[9]; if (d[8] !== 8 || d[12] !== 0) throw new Error("PNG non géré"); }
    else if (nom === "IDAT") idat.push(d);
    else if (nom === "IEND") break;
    p += 12 + len;
  }
  const canaux = type === 6 ? 4 : type === 2 ? 3 : 0;
  if (!canaux) throw new Error(`PNG de type ${type} non géré`);
  const brut = inflateSync(Buffer.concat(idat)), ligne = w * canaux, donnees = new Uint8Array(w * h * canaux);
  for (let y = 0; y < h; y++) {
    const f = brut[y * (ligne + 1)], src = y * (ligne + 1) + 1, dst = y * ligne;
    for (let i = 0; i < ligne; i++) {
      const a = i >= canaux ? donnees[dst + i - canaux] : 0, b = y ? donnees[dst - ligne + i] : 0, c = y && i >= canaux ? donnees[dst - ligne + i - canaux] : 0;
      let v = brut[src + i];
      if (f === 1) v += a; else if (f === 2) v += b; else if (f === 3) v += (a + b) >> 1;
      else if (f === 4) { const pp = a + b - c, pa = Math.abs(pp - a), pb = Math.abs(pp - b), pc = Math.abs(pp - c); v += pa <= pb && pa <= pc ? a : pb <= pc ? b : c; }
      donnees[dst + i] = v & 255;
    }
  }
  return { w, h, canaux, donnees };
}

// Échantillonnage bilinéaire d'une grille (bords recopiés).
function echantillon(g, gw, gh, x, y) {
  x = Math.min(Math.max(x, 0), gw - 1.001); y = Math.min(Math.max(y, 0), gh - 1.001);
  const i = Math.floor(x), j = Math.floor(y), fx = x - i, fy = y - j, k = j * gw + i;
  return (g[k] * (1 - fx) + g[k + 1] * fx) * (1 - fy) + (g[k + gw] * (1 - fx) + g[k + gw + 1] * fx) * fy;
}

// ================================================================ Outils de dessin
function bruitValeur(graine) {
  const h = (i, j) => { let n = (i * 374761393 + j * 668265263 + graine * 2147483647) | 0; n = Math.imul(n ^ (n >>> 13), 1274126177); return ((n ^ (n >>> 16)) >>> 0) / 4294967296; };
  return (x, y) => {
    const i = Math.floor(x), j = Math.floor(y), fx = x - i, fy = y - j, u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy);
    return (h(i, j) * (1 - u) + h(i + 1, j) * u) * (1 - v) + (h(i, j + 1) * (1 - u) + h(i + 1, j + 1) * u) * v;
  };
}
function fbm(graine, octaves) {
  const b = Array.from({ length: octaves }, (_, k) => bruitValeur(graine + k * 101));
  return (x, y) => { let s = 0, a = 0.5, t = 0; for (let k = 0; k < octaves; k++) { s += a * b[k](x * 2 ** k, y * 2 ** k); t += a; a /= 2; } return s / t; };
}
function hasard(graine) { let s = graine >>> 0; return () => { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return s / 4294967296; }; }

// Flou de boîte séparable (3 passes ≈ gaussien).
function flou(g, gw, gh, r, passes = 3) {
  let a = Float32Array.from(g), b = new Float32Array(g.length);
  for (let p = 0; p < passes; p++) {
    for (let j = 0; j < gh; j++) { let s = 0; for (let i = -r; i <= r; i++) s += a[j * gw + Math.min(Math.max(i, 0), gw - 1)];
      for (let i = 0; i < gw; i++) { b[j * gw + i] = s / (2 * r + 1); s += a[j * gw + Math.min(i + r + 1, gw - 1)] - a[j * gw + Math.max(i - r, 0)]; } }
    for (let i = 0; i < gw; i++) { let s = 0; for (let j = -r; j <= r; j++) s += b[Math.min(Math.max(j, 0), gh - 1) * gw + i];
      for (let j = 0; j < gh; j++) { a[j * gw + i] = s / (2 * r + 1); s += b[Math.min(j + r + 1, gh - 1) * gw + i] - b[Math.max(j - r, 0) * gw + i]; } }
  }
  return a;
}

// Distance euclidienne exacte (Felzenszwalb) aux pixels où f = 0.
function distance(masque, w, h) {
  const INF = 1e20, d = new Float32Array(w * h), n = Math.max(w, h), f = new Float64Array(n), z = new Float64Array(n + 1), v = new Int32Array(n), out = new Float64Array(n);
  for (let k = 0; k < w * h; k++) d[k] = masque[k] ? 0 : INF;
  const passe = (len) => {
    let k = 0; v[0] = 0; z[0] = -INF; z[1] = INF;
    for (let q = 1; q < len; q++) {
      let s; do { const p = v[k]; s = ((f[q] + q * q) - (f[p] + p * p)) / (2 * q - 2 * p); } while (s <= z[k] && --k >= 0);
      k++; v[k] = q; z[k] = s; z[k + 1] = INF;
    }
    k = 0; for (let q = 0; q < len; q++) { while (z[k + 1] < q) k++; out[q] = (q - v[k]) ** 2 + f[v[k]]; }
  };
  for (let x = 0; x < w; x++) { for (let y = 0; y < h; y++) f[y] = d[y * w + x]; passe(h); for (let y = 0; y < h; y++) d[y * w + x] = out[y]; }
  for (let y = 0; y < h; y++) { for (let x = 0; x < w; x++) f[x] = d[y * w + x]; passe(w); for (let x = 0; x < w; x++) d[y * w + x] = Math.sqrt(out[x]); }
  return d;
}

function rendreSVG(svg) {
  const img = new Resvg(svg, { fitTo: { mode: "original" }, font: { loadSystemFonts: true, defaultFontFamily: POLICE } }).render();
  if (img.width !== W || img.height !== H) throw new Error("rendu SVG à la mauvaise taille");
  return img.pixels; // RVBA prémultiplié
}

// Chemin SVG lissé (courbes par les milieux) d'une suite de points en pixels.
function chemin(pts, ferme = false) {
  if (pts.length < 3) return `M${pts.map(p => p.map(v => v.toFixed(1)).join(" ")).join("L")}${ferme ? "Z" : ""}`;
  const m = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2], f = p => `${p[0].toFixed(1)} ${p[1].toFixed(1)}`;
  if (ferme) {
    let s = `M${f(m(pts.at(-1), pts[0]))}`;
    for (let i = 0; i < pts.length; i++) s += `Q${f(pts[i])} ${f(m(pts[i], pts[(i + 1) % pts.length]))}`;
    return `${s}Z`;
  }
  let s = `M${f(pts[0])}`;
  for (let i = 1; i < pts.length - 1; i++) s += `Q${f(pts[i])} ${f(m(pts[i], pts[i + 1]))}`;
  return `${s}L${f(pts.at(-1))}`;
}
const projeter = pts => pts.map(([lon, lat]) => [versX(lon), versY(lat)]);
const echapper = s => s.replace(/&/g, "&amp;").replace(/</g, "&lt;");

// ================================================================ Langue des textes gravés
// Rend { langue, t(texte), lignes(region, lignesFr), nombre(n), capitales(texte), manquants }. En anglais, t() et lignes()
// prennent contenu/en/carte.json et notent dans manquants tout texte resté sans traduction.
export function langueDeCarte(langue = "fr", dico = langue === "en" ? JSON.parse(readFileSync(LIBELLES_EN, "utf8")) : null) {
  const locale = langue === "en" ? "en-GB" : "fr-FR", manquants = [];
  const L = {
    langue, manquants, t: x => x, lignes: (r, lignesFr) => lignesFr,
    nombre: n => n.toLocaleString(locale).replace(/ /g, " "), capitales: x => x.toLocaleUpperCase(locale)
  };
  if (!dico) return L;
  L.t = x => {
    const en = dico.libelles?.[x];
    if (typeof en === "string" && en.trim()) return en;
    manquants.push(x);
    return x;
  };
  L.lignes = (r, lignesFr) => {
    const lignes = dico.regions?.[r.cle];
    if (Array.isArray(lignes) && lignes.length) return lignes;
    manquants.push(`région ${r.cle} : ${lignesFr.join(" ")}`);
    return lignesFr;
  };
  return L;
}

// Textes gravés d'un SVG (contenu des <text>/<tspan>, entités décodées).
export const textesGraves = svg => [...svg.matchAll(/<(?:text|tspan)\b[^>]*>([^<]*)/g)]
  .map(m => m[1].replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&amp;/g, "&").trim()).filter(Boolean);

// ================================================================ Lieux et étiquettes (coordonnées réelles approchées)
// Sommets : altitudes officielles ; la position est affinée sur le point le plus haut du relief à moins de `cherche` px.
const SOMMETS = [
  { nom: "Piton des Neiges", alt: 3069, lon: 55.4797, lat: -21.0992, cherche: 40, dx: 0, dy: -46 },
  { nom: "Piton de la Fournaise", alt: 2632, lon: 55.7135, lat: -21.2437, cherche: 40, dx: 0, dy: 62 },
  { nom: "Grand Bénare", alt: 2898, lon: 55.4215, lat: -21.1161, cherche: 12, dx: -90, dy: 40, petit: true },
  { nom: "Maïdo", alt: 2190, lon: 55.3830, lat: -21.0720, cherche: 0, dx: -70, dy: -10, petit: true }
];
// Noms de lieux (italique, petits) : pas des régions, seulement des repères du paysage.
const LIEUX = [
  { nom: "Plaine des Sables", lon: 55.652, lat: -21.222, angle: -8 },
  { nom: "Grand Brûlé", lon: 55.785, lat: -21.215, angle: 72 },
  { nom: "Lagon de l'Hermitage", lon: 55.205, lat: -21.090, angle: 62, mer: true },
  { nom: "Baie de Saint-Paul", lon: 55.232, lat: -20.985, mer: true, petit: true },
  { nom: "Rivière des Galets", lon: 55.355, lat: -20.985, angle: 38, petit: true, eau: true },
  { nom: "Rivière du Mât", lon: 55.600, lat: -21.000, angle: 28, petit: true, eau: true },
  { nom: "Rivière des Marsouins", lon: 55.665, lat: -21.075, angle: 20, petit: true, eau: true },
  { nom: "Rivière Langevin", lon: 55.645, lat: -21.330, angle: -70, petit: true, eau: true }
];
// L'Enclos Fouqué : remparts de Bellecombe, de Bois Blanc (nord) et du Tremblet (sud), jusqu'à la mer (calé sur l'estompage).
const ENCLOS = [[55.7035, -21.2080], [55.6890, -21.2200], [55.6820, -21.2355], [55.6810, -21.2530], [55.6850, -21.2690], [55.6990, -21.2785],
  [55.7330, -21.2845], [55.7640, -21.2865], [55.7950, -21.2880], [55.8100, -21.2900], [55.8600, -21.2950], [55.8600, -21.1950],
  [55.8100, -21.1960], [55.7800, -21.1990], [55.7480, -21.2010], [55.7260, -21.2040]];
// Étiquettes des régions : lignes du nom en capitales, décalage (px) depuis le repère (l'épingle Foundry et son nom
// occupent le repère et le dessous : l'étiquette peinte se place au-dessus ou à côté).
const ETIQUETTES = {
  "saint-denis": { dx: 0, dy: -112 },
  "sainte-marie": { dx: 40, dy: -78, lignes: ["Sainte-Marie", "et l'aéroport"] },
  "route-du-littoral": { dx: -40, dy: -84, lignes: ["La route", "du Littoral"] },
  "le-port": { dx: -300, dy: 60, lignes: ["Le Port", "et La Possession"] },
  "saint-paul": { dx: -70, dy: -96, lignes: ["Saint-Paul", "et la côte Ouest"] },
  "hauts-de-l-ouest": { dx: 0, dy: -84, lignes: ["Les Hauts", "de l'Ouest"] },
  "saint-leu": { dx: 70, dy: -96, lignes: ["Saint-Leu", "et l'Étang-Salé"] },
  "saint-pierre": { dx: 0, dy: -100, lignes: ["Saint-Louis", "et Saint-Pierre"] },
  "le-tampon": { dx: 0, dy: -96, lignes: ["Le Tampon et la", "Plaine des Cafres"] },
  "sud-sauvage": { dx: -40, dy: -100, lignes: ["Saint-Joseph et", "le Sud sauvage"] },
  "fournaise": { dx: 30, dy: -150, lignes: ["Le Piton de la Fournaise", "et la Plaine des Sables"] },
  "est": { dx: 150, dy: -120, lignes: ["L'Est", "Saint-André, Saint-Benoît,", "Sainte-Rose"] },
  "plaine-des-palmistes": { dx: 0, dy: -96, lignes: ["La Plaine des Palmistes", "et Bélouve"] },
  "cilaos": { dx: 0, dy: -72 },
  "salazie": { dx: 30, dy: -72 },
  "mafate": { dx: -20, dy: -72 }
};
// Sentiers du contenu absents des GR d'OSM : tracés approchés (lon, lat), dessinés en pointillés seulement si rien d'OSM
// ne passe déjà par là.
const SENTIERS_APPROCHES = [];

// ================================================================ Dessin
function dessiner() {
  const registre = JSON.parse(readFileSync(REGISTRE, "utf8"));
  const contour = JSON.parse(readFileSync(new URL("contour-974.geojson", DONNEES), "utf8"));
  const grille = Float32Array.from(new Int16Array(new Uint8Array(gunzipSync(readFileSync(new URL("relief-974.bin.gz", DONNEES)))).buffer));
  const voies = JSON.parse(readFileSync(new URL("routes-osm.json", DONNEES), "utf8"));
  const corrections = REPERES_CORRIGES;
  const regions = registre.regions.map(r => ({ cle: r.cle, nom: r.nom, zone: r.zone, repere: corrections[r.cle] ?? r.repere }));

  // -- Masque de l'île (anticrénelé) par resvg.
  const polygones = contour.geometry.type === "MultiPolygon" ? contour.geometry.coordinates : [contour.geometry.coordinates];
  const traitCote = polygones.map(p => chemin(projeter(p[0].slice(0, -1)), true)).join("");
  const pixMasque = rendreSVG(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}"><path d="${traitCote}" fill="#fff"/></svg>`);
  const terre = new Float32Array(W * H), binaire = new Uint8Array(W * H);
  for (let k = 0; k < W * H; k++) { terre[k] = pixMasque[k * 4 + 3] / 255; binaire[k] = terre[k] >= 0.5 ? 1 : 0; }
  const dMer = distance(binaire, W, H); // distance à la côte, côté mer
  console.log("masque et distances : ok");

  // -- Relief sur la grille : altitude terrestre, estompage, creux (cirques), rivières.
  const terreG = new Uint8Array(GW * GH);
  for (let j = 0; j < GH; j++) for (let i = 0; i < GW; i++) terreG[j * GW + i] = binaire[(j * MAILLE + 2) * W + i * MAILLE + 2];
  reparerRelief(grille, terreG);
  const alt = Float32Array.from(grille, (v, k) => terreG[k] ? Math.max(v, 1) : v);
  const tailleM = MAILLE * 1000 / PX_KM, exag = 1.6;
  const ombre = new Float32Array(GW * GH);
  const az = 315 * Math.PI / 180, el = 42 * Math.PI / 180, lx = Math.cos(el) * Math.sin(az), ly = -Math.cos(el) * Math.cos(az), lz = Math.sin(el);
  const lisse = flou(alt, GW, GH, 1, 1);
  for (let j = 0; j < GH; j++) for (let i = 0; i < GW; i++) {
    const a = (di, dj) => lisse[Math.min(Math.max(j + dj, 0), GH - 1) * GW + Math.min(Math.max(i + di, 0), GW - 1)];
    const dzdx = ((a(1, -1) + 2 * a(1, 0) + a(1, 1)) - (a(-1, -1) + 2 * a(-1, 0) + a(-1, 1))) / (8 * tailleM) * exag;
    const dzdy = ((a(-1, 1) + 2 * a(0, 1) + a(1, 1)) - (a(-1, -1) + 2 * a(0, -1) + a(1, -1))) / (8 * tailleM) * exag;
    const nx = -dzdx, ny = -dzdy, nz = 1, l = Math.hypot(nx, ny, nz);
    ombre[j * GW + i] = (nx * lx + ny * ly + nz * lz) / l;
  }
  const creux = flou(alt, GW, GH, 14); // moyenne sur ≈ 2,5 km
  for (let k = 0; k < GW * GH; k++) creux[k] = alt[k] - creux[k];
  const rivieres = tracerRivieres(alt, terreG);
  console.log("relief : ok");

  // -- Zones du volcan (rouge : l'Enclos, en fer à cheval ouvert sur la mer ; vert : la Plaine des Sables), adoucies.
  const pt = ([lon, lat]) => `${versX(lon).toFixed(0)} ${versY(lat).toFixed(0)}`;
  const volcan = rendreSVG(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}"><rect width="${W}" height="${H}" fill="#000"/>
    <g filter="url(#f)"><path d="M${ENCLOS.map(pt).join("L")}Z" fill="#f00"/><ellipse cx="${versX(55.660)}" cy="${versY(-21.2235)}" rx="${0.026 * KX}" ry="${0.011 * KY}" transform="rotate(-12 ${versX(55.660)} ${versY(-21.2235)})" fill="#0f0"/></g>
    <defs><filter id="f" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="22"/></filter></defs></svg>`);

  // -- Pixels de fond.
  const rvb = new Uint8Array(W * H * 3);
  const papier = fbm(7, 5), grain = bruitValeur(11), vague = fbm(23, 3), coupe = fbm(31, 3), humide = fbm(41, 3), plaque = fbm(53, 4);
  const teinte = (e) => { // altitude -> couleur (verts du littoral, ocres des Hauts, sommets clairs)
    const p = [[0, [96, 128, 70]], [250, [108, 138, 74]], [700, [122, 140, 78]], [1200, [146, 142, 86]], [1700, [170, 148, 98]], [2200, [190, 166, 120]], [2700, [214, 196, 158]], [3100, [232, 222, 196]]];
    for (let i = 1; i < p.length; i++) if (e <= p[i][0]) { const t = (e - p[i - 1][0]) / (p[i][0] - p[i - 1][0]); return p[i - 1][1].map((c, n) => c + (p[i][1][n] - c) * t); }
    return p.at(-1)[1];
  };
  for (let y = 0; y < H; y++) {
    const gy = y / MAILLE - 0.5;
    for (let x = 0; x < W; x++) {
      const k = y * W + x, gx = x / MAILLE - 0.5;
      const e = echantillon(grille, GW, GH, gx, gy);
      // Mer : bleu nuit, plus profond au large et vers les bords, éclairci près des côtes, vagues en lignes concentriques.
      const d = dMer[k], prof = Math.min(Math.max(-e, 0) / 3500, 1);
      const larg = Math.min(d / 900, 1);
      let mr = 22 - 10 * larg - 4 * prof, mv = 52 - 18 * larg - 6 * prof, mb = 78 - 22 * larg - 6 * prof;
      const halo = Math.exp(-d / 60);
      mr += 18 * halo; mv += 40 * halo; mb += 42 * halo;
      const dv = d + 14 * (vague(x / 180, y / 180) - 0.5) * Math.min(d / 40, 1);
      let lignes = 0;
      for (const [r0, a0] of [[16, 0.55], [38, 0.42], [66, 0.32], [100, 0.22], [140, 0.14]]) {
        const ecart = Math.abs(dv - r0);
        if (ecart < 2.2) lignes = Math.max(lignes, a0 * (1 - ecart / 2.2) * (coupe(x / 120, y / 120) > 0.42 ? 1 : 0.25));
      }
      mr += (190 - mr) * lignes; mv += (214 - mv) * lignes; mb += (222 - mb) * lignes;

      // Terre : teinte d'altitude, côte ouest plus sèche, volcan rouille et noir, estompage, cirques assombris.
      const t = terre[k];
      let tr = 0, tv = 0, tb = 0;
      if (t > 0) {
        const ea = Math.max(e, 0);
        [tr, tv, tb] = teinte(ea);
        const sec = Math.min(Math.max((versX(55.50) - x) / 900 + (y - versY(-21.05)) / 2400 - (ea > 900 ? (ea - 900) / 900 : 0), 0), 1) * 0.55
          + 0.12 * (humide(x / 500, y / 500) - 0.5);
        tr += (172 - tr) * sec * 0.6; tv += (150 - tv) * sec * 0.45; tb += (92 - tb) * sec * 0.6;
        // L'Enclos (de Bellecombe à la mer, entre ses remparts nord et sud) : laves sombres, verdies en bas (Grand Brûlé) ;
        // la Plaine des Sables : scories rouille.
        const bord = plaque(x / 60, y / 60) - 0.5;
        const enclos = Math.min(Math.max((volcan[k * 4] / 255 - 0.5) * 2.2 + 0.5 + bord * 0.6, 0), 1);
        const sables = Math.min(Math.max((volcan[k * 4 + 1] / 255 - 0.5) * 2.2 + 0.5 + bord * 0.8, 0), 1);
        const haut = Math.min(Math.max((ea - 900) / 700, 0), 1);
        const lave = Math.min(Math.max((plaque(x / 110, y / 110) - 0.45) / 0.2, 0), 1);
        const lr = 120 + 22 * lave, lv = 106 - 8 * lave, lb = 98 - 18 * lave;
        const fEnclos = enclos * (0.5 + 0.4 * haut);
        tr += (lr - tr) * fEnclos; tv += (lv - tv) * fEnclos; tb += (lb - tb) * fEnclos;
        const fSables = Math.min(Math.max(sables * 1.5 - 0.25 + (plaque(x / 45, y / 45) - 0.5) * 0.7, 0), 1) * 0.7;
        tr += (156 - tr) * fSables; tv += (104 - tv) * fSables; tb += (74 - tb) * fSables;
        const s = echantillon(ombre, GW, GH, gx, gy), c = echantillon(creux, GW, GH, gx, gy);
        const lum = 0.42 + 0.78 * Math.max(s, 0) - Math.min(Math.max(-c / 380, 0), 1) * 0.42 + Math.min(Math.max(c / 700, 0), 1) * 0.08;
        tr *= lum; tv *= lum; tb *= lum;
      }
      let r = mr + (tr - mr) * t, v = mv + (tv - mv) * t, b = mb + (tb - mb) * t;
      // Papier : grain fin et taches légères, vignettage.
      const pap = 0.94 + 0.10 * papier(x / 260, y / 260) + 0.035 * (grain(x / 1.7, y / 1.7) - 0.5);
      const vx = (x - W / 2) / (W / 2), vy = (y - H / 2) / (H / 2), vig = 1 - 0.22 * Math.max(vx * vx + vy * vy - 0.35, 0);
      const m = pap * vig;
      rvb[k * 3] = Math.min(255, r * m); rvb[k * 3 + 1] = Math.min(255, v * m); rvb[k * 3 + 2] = Math.min(255, b * m);
    }
  }
  console.log("fond : ok");

  // -- Une image par langue : même fond, surcouche vectorielle (textes gravés) de la langue.
  const langues = typeof option("--langue") === "string" ? [option("--langue")] : ["fr", "en"];
  for (const langue of langues) {
    if (!SORTIES[langue]) throw new Error(`Langue inconnue : ${langue} (fr ou en)`);
    const L = langueDeCarte(langue);
    const svg = surcouche({ traitCote, voies, rivieres, regions, grille, dMer, L });
    const erreurs = verifierTextesDeCarte(langue, textesGraves(svg), L.manquants);
    if (erreurs.length) throw new Error(`Carte (${langue}) : ${erreurs.join(" ; ")}`);
    const image = rvb.slice();
    const pix = rendreSVG(svg);
    for (let k = 0; k < W * H; k++) {
      const a = pix[k * 4 + 3] / 255;
      if (!a) continue;
      for (let c = 0; c < 3; c++) image[k * 3 + c] = Math.min(255, pix[k * 4 + c] + image[k * 3 + c] * (1 - a));
    }
    console.log(`surcouche (${langue}) : ok`);
    encoder(image, SORTIES[langue], langue);
    if (langue === "en") writeFileSync(TEXTES_GRAVES_EN, `${JSON.stringify(textesGraves(svg), null, 1)}\n`);
  }
  verifierReperes(registre.regions, binaire, grille, creux);
}

// Encodage WebP (et aperçus JPEG si --apercu <dossier> : <dossier>/<langue>-<vue>.jpg).
function encoder(rvb, sortie, langue) {
  mkdirSync(new URL(".", sortie), { recursive: true });
  const qualite = option("--qualite") ?? "90";
  execFileSync("ffmpeg", ["-hide_banner", "-loglevel", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", `${W}x${H}`, "-i", "-",
    "-c:v", "libwebp", "-quality", String(qualite), "-compression_level", "6", "-preset", "picture", fileURLToPath(sortie)], { input: Buffer.from(rvb.buffer), maxBuffer: 1 << 30 });
  console.log(`écrit : ${fileURLToPath(sortie)} (${(readFileSync(sortie).length / 1e6).toFixed(2)} Mo)`);
  const apercu = option("--apercu");
  if (typeof apercu === "string") {
    mkdirSync(apercu, { recursive: true });
    const jpeg = (nom, filtre) => execFileSync("ffmpeg", ["-hide_banner", "-loglevel", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", `${W}x${H}`, "-i", "-",
      "-vf", filtre, "-q:v", "3", `${apercu}/${langue}-${nom}.jpg`], { input: Buffer.from(rvb.buffer), maxBuffer: 1 << 30 });
    jpeg("entier", "scale=2000:1500");
    jpeg("nord-ouest", "crop=1600:1200:300:100");
    jpeg("centre", "crop=1600:1200:1100:700");
    jpeg("sud-est", "crop=1600:1200:2100:1600");
    jpeg("sud-ouest", "crop=1600:1200:0:1800");
    jpeg("nord-est", "crop=1600:1200:2400:0");
  }
}

// ================================================================ Textes gravés (sans dessiner : pour les essais)
// Régions telles que la carte les étiquette (registre du module, repères corrigés).
function regionsDeLaCarte() {
  const registre = JSON.parse(readFileSync(REGISTRE, "utf8"));
  return registre.regions.map(r => ({ cle: r.cle, nom: r.nom, zone: r.zone, repere: REPERES_CORRIGES[r.cle] ?? r.repere }));
}

// Textes que la carte d'une langue grave (mêmes fonctions que le dessin, sommets à leurs coordonnées). Rend { textes, manquants }.
export function textesDeCarte(langue, L = langueDeCarte(langue)) {
  const textes = textesGraves(habillage({ regions: regionsDeLaCarte(), sommets: placerSommets(null), L }));
  return { textes, manquants: L.manquants };
}

// Textes français connus de la carte : ceux du cartouche, de la légende, des points cardinaux… (clés de contenu/en/carte.json
// dont l'anglais diffère) et les lignes françaises des étiquettes de régions qui ont une version anglaise différente.
export function francaisConnusDeCarte() {
  const fr = textesDeCarte("fr").textes, en = new Set(textesDeCarte("en").textes);
  const dico = JSON.parse(readFileSync(LIBELLES_EN, "utf8"));
  const connus = new Set(Object.entries(dico.libelles ?? {}).filter(([f, e]) => f !== e).map(([f]) => f));
  for (const t of fr) if (!en.has(t)) connus.add(t);
  return [...connus];
}

// Écarts des textes gravés d'une carte : textes sans traduction (anglais), textes français connus restés (anglais).
export function verifierTextesDeCarte(langue, textes, manquants = []) {
  if (langue !== "en") return [];
  const francais = new Set(francaisConnusDeCarte());
  return [...manquants.map(m => `« ${m} » sans traduction dans contenu/en/carte.json`),
    ...[...new Set(textes)].filter(t => francais.has(t)).map(t => `« ${t} » gravé en français`)];
}

// Les tuiles ont des pics isolés et un trou (altitude 0) sur les coulées récentes du Grand Brûlé : on écrase les pics par la
// médiane 3 × 3, puis on bouche le trou par diffusion (Laplace) entre la côte (0 m) et le relief connu autour.
function reparerRelief(g, terreG) {
  for (let passe = 0; passe < 2; passe++) {
    const copie = Float32Array.from(g);
    for (let j = 1; j < GH - 1; j++) for (let i = 1; i < GW - 1; i++) {
      const v = []; for (let dj = -1; dj <= 1; dj++) for (let di = -1; di <= 1; di++) v.push(copie[(j + dj) * GW + i + di]);
      v.sort((a, b) => a - b);
      if (Math.abs(copie[j * GW + i] - v[4]) > 250) g[j * GW + i] = v[4];
    }
  }
  const inconnu = new Uint8Array(GW * GH);
  for (let j = 3; j < GH - 3; j++) for (let i = 3; i < GW - 3; i++) {
    const k = j * GW + i; if (!terreG[k] || g[k] > 3) continue;
    let pres = false; for (let dj = -3; dj <= 3 && !pres; dj++) for (let di = -3; di <= 3; di++) if (!terreG[(j + dj) * GW + i + di]) { pres = true; break; }
    if (!pres) inconnu[k] = 1;
  }
  // Tout le voisinage proche du trou est suspect (bord bruité) : on l'élargit de 2 mailles.
  for (let r = 0; r < 2; r++) { const c = Uint8Array.from(inconnu); for (let j = 1; j < GH - 1; j++) for (let i = 1; i < GW - 1; i++) { const k = j * GW + i; if (terreG[k] && !c[k] && (c[k - 1] || c[k + 1] || c[k - GW] || c[k + GW])) inconnu[k] = 1; } }
  const liste = []; for (let k = 0; k < GW * GH; k++) if (inconnu[k]) { liste.push(k); g[k] = 50; }
  const val = q => terreG[q] ? g[q] : 0;
  for (let it = 0; it < 1500; it++) for (const k of liste) g[k] = (val(k - 1) + val(k + 1) + val(k - GW) + val(k + GW)) / 4;
  for (const k of liste) g[k] = Math.max(g[k], 1);
  return liste.length;
}

// Rivières : remplissage des cuvettes (priority-flood), écoulement D8, accumulation ; polylignes des mailles qui drainent
// plus de ≈ 4 km², hors de l'Enclos (laves poreuses, pas de cours d'eau).
function tracerRivieres(alt, terreG) {
  const n = GW * GH, z = Float32Array.from(alt), fait = new Uint8Array(n), tas = [];
  const pousser = (k) => { tas.push(k); let i = tas.length - 1; while (i) { const p = (i - 1) >> 1; if (z[tas[p]] <= z[tas[i]]) break; [tas[p], tas[i]] = [tas[i], tas[p]]; i = p; } };
  const tirer = () => { const h = tas[0], d = tas.pop(); if (tas.length) { tas[0] = d; let i = 0; for (;;) { const a = 2 * i + 1, b = a + 1; let m = i; if (a < tas.length && z[tas[a]] < z[tas[m]]) m = a; if (b < tas.length && z[tas[b]] < z[tas[m]]) m = b; if (m === i) break; [tas[m], tas[i]] = [tas[i], tas[m]]; i = m; } } return h; };
  const V = [[-1, 0], [1, 0], [0, -1], [0, 1], [-1, -1], [1, -1], [-1, 1], [1, 1]];
  for (let k = 0; k < n; k++) if (!terreG[k]) { fait[k] = 1; z[k] = Math.min(z[k], 0); }
  for (let j = 0; j < GH; j++) for (let i = 0; i < GW; i++) {
    const k = j * GW + i; if (!terreG[k]) continue;
    if (V.some(([di, dj]) => { const a = i + di, b = j + dj; return a < 0 || b < 0 || a >= GW || b >= GH || !terreG[b * GW + a]; })) { fait[k] = 1; pousser(k); }
  }
  const recoit = new Int32Array(n).fill(-1), ordre = [];
  while (tas.length) {
    const k = tirer(); ordre.push(k);
    const i = k % GW, j = (k - i) / GW;
    for (const [di, dj] of V) {
      const a = i + di, b = j + dj; if (a < 0 || b < 0 || a >= GW || b >= GH) continue;
      const q = b * GW + a; if (fait[q]) continue;
      fait[q] = 1; z[q] = Math.max(z[q], z[k] + 0.01); recoit[q] = k; pousser(q);
    }
  }
  const acc = new Float32Array(n).fill(1);
  for (let o = ordre.length - 1; o >= 0; o--) { const k = ordre[o]; if (recoit[k] >= 0) acc[recoit[k]] += acc[k]; }
  const SEUIL = 4e6 / (MAILLE * 1000 / PX_KM) ** 2;
  const enclos = (i, j) => { const lon = versLon(i * MAILLE), lat = versLat(j * MAILLE); return lon > 55.675 && lat < -21.17 && lat > -21.31 && !(lon < 55.70 && lat < -21.27); };
  const amont = new Uint8Array(n);
  for (let k = 0; k < n; k++) if (acc[k] >= SEUIL && recoit[k] >= 0) amont[recoit[k]]++;
  const vu = new Uint8Array(n), lignes = [];
  for (let k = 0; k < n; k++) {
    if (acc[k] < SEUIL || amont[k] || !terreG[k]) continue;
    let q = k; const pts = [];
    while (q >= 0) {
      const i = q % GW, j = (q - i) / GW;
      if (enclos(i, j)) { pts.length = 0; break; }
      pts.push([i * MAILLE + 2, j * MAILLE + 2, acc[q]]);
      if (vu[q] || !terreG[q]) break;
      vu[q] = 1; q = recoit[q];
    }
    if (pts.length > 3) lignes.push(pts);
  }
  return lignes;
}

function surcouche({ traitCote, voies, rivieres, regions, grille, dMer, L = langueDeCarte() }) {
  const p = [];
  p.push(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" font-family="${POLICE}">`);
  p.push(`<defs><filter id="flou" x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur stdDeviation="3"/></filter></defs>`);
  // Côte : liseré sombre puis fin trait clair (écume).
  p.push(`<path d="${traitCote}" fill="none" stroke="#10202c" stroke-opacity="0.55" stroke-width="7" stroke-linejoin="round"/>`);
  p.push(`<path d="${traitCote}" fill="none" stroke="#2a2216" stroke-opacity="0.8" stroke-width="2.6" stroke-linejoin="round"/>`);

  // Vaguelettes au large (hors cartouche, rose des vents, légende).
  const alea = hasard(974), libre = (x, y) => !(x < 960 && y < 360) && Math.hypot(x - 3600, y - 520) > 330 && !(x < 1100 && y > 2290) && !(y > 2860);
  for (let n = 0, essais = 0; n < 90 && essais < 5000; essais++) {
    const x = 80 + alea() * (W - 160), y = 80 + alea() * (H - 160);
    if (dMer[Math.round(y) * W + Math.round(x)] < 200 || !libre(x, y)) continue;
    const l = 12 + alea() * 8;
    p.push(`<path d="M${(x - l).toFixed(0)} ${y.toFixed(0)}q${l / 2} -${l / 2.2} ${l} 0q${l / 2} -${l / 2.2} ${l} 0" fill="none" stroke="#9fc0d2" stroke-opacity="0.32" stroke-width="2.2" stroke-linecap="round"/>`);
    n++;
  }

  // Rivières : par tronçons, largeur selon la surface drainée.
  for (const l of rivieres) {
    for (let i = 0; i < l.length - 1; i += 6) {
      const tr = l.slice(i, Math.min(i + 7, l.length)), a = tr[0][2] * (MAILLE * 1000 / PX_KM) ** 2 / 1e6;
      const larg = Math.min(1.6 + Math.log2(a / 4 + 1) * 1.1, 6);
      p.push(`<path d="${chemin(tr.map(q => [q[0], q[1]]))}" fill="none" stroke="#3f7489" stroke-opacity="0.8" stroke-width="${larg.toFixed(1)}" stroke-linecap="round" stroke-linejoin="round"/>`);
    }
  }

  // Routes et sentiers d'OpenStreetMap.
  const parClasse = c => voies.filter(v => v.classe === c).map(v => chemin(projeter(v.pts))).join("");
  const sentiers = parClasse("sentier"), pistes = parClasse("piste"), dep = parClasse("departementale"), nat = parClasse("nationale");
  const approches = SENTIERS_APPROCHES.map(s => chemin(projeter(s.pts))).join("");
  const tousSentiers = sentiers + approches;
  if (tousSentiers) {
    p.push(`<path d="${tousSentiers}" fill="none" stroke="#1d1710" stroke-opacity="0.45" stroke-width="5.5" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="12 9"/>`);
    p.push(`<path d="${tousSentiers}" fill="none" stroke="#f6ead0" stroke-opacity="0.95" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="12 9"/>`);
  }
  for (const [d, cas, coeur, lc, lk] of [[pistes, "#241b12", "#d9c49a", 6, 3], [dep, "#241b12", "#efe3c6", 7.5, 4], [nat, "#21170e", "#f5d58f", 11, 6]]) {
    if (!d) continue;
    p.push(`<path d="${d}" fill="none" stroke="${cas}" stroke-opacity="0.75" stroke-width="${lc}" stroke-linecap="round" stroke-linejoin="round"/>`);
    p.push(`<path d="${d}" fill="none" stroke="${coeur}" stroke-width="${lk}" stroke-linecap="round" stroke-linejoin="round"/>`);
  }

  p.push(habillage({ regions, sommets: placerSommets(grille), L }));
  p.push(`</svg>`);
  return p.join("\n");
}

// Sommets placés sur le point le plus haut du relief à moins de `cherche` px (sans relief : à leurs coordonnées).
function placerSommets(grille) {
  return SOMMETS.map(s => {
    const bx = versX(s.lon), by = versY(s.lat);
    let be = -1e9, x = bx, y = by;
    if (grille) for (let dy = -s.cherche; dy <= s.cherche; dy += 4) for (let dx = -s.cherche; dx <= s.cherche; dx += 4) {
      const e = echantillon(grille, GW, GH, (bx + dx) / MAILLE - 0.5, (by + dy) / MAILLE - 0.5);
      if (e > be) { be = e; x = bx + dx; y = by + dy; }
    }
    return { ...s, _x: x, _y: y, _alt: s.alt };
  });
}

// Tout ce qui porte du texte, par-dessus routes et rivières : sommets, lieux, régions, cadre, cartouche, rose des vents,
// légende, échelle, océan, crédits ; textes passés par la langue L (langueDeCarte).
function habillage({ regions, sommets, L }) {
  const p = [];
  // Sommets.
  const halo = (couleur, larg) => `stroke="${couleur}" stroke-width="${larg}" stroke-linejoin="round" paint-order="stroke"`;
  for (const s of sommets) {
    const t = s.petit ? 11 : 15;
    p.push(`<path d="M${s._x} ${s._y - t}L${s._x + t * 0.9} ${s._y + t * 0.6}L${s._x - t * 0.9} ${s._y + t * 0.6}Z" fill="#2a1d12" stroke="#f3e6c8" stroke-width="2.5"/>`);
    const tx = s._x + s.dx, ty = s._y + s.dy;
    p.push(`<text x="${tx}" y="${ty}" text-anchor="middle" font-size="${s.petit ? 24 : 30}" font-style="italic" fill="#fff3d6" ${halo("#1c140c", 5)} stroke-opacity="0.6">${echapper(s.nom)}</text>`);
    p.push(`<text x="${tx}" y="${ty + (s.petit ? 24 : 30)}" text-anchor="middle" font-size="${s.petit ? 20 : 23}" fill="#f0e2c0" ${halo("#1c140c", 4)} stroke-opacity="0.55">${L.nombre(s._alt)} m</text>`);
  }

  // Lieux du paysage.
  for (const l of LIEUX) {
    const x = versX(l.lon), y = versY(l.lat), taille = l.petit ? 21 : 26;
    const couleur = l.eau ? "#bfe0ea" : l.mer ? "#a9c6d6" : "#f6ead0";
    p.push(`<text x="${x}" y="${y}" transform="rotate(${l.angle ?? 0} ${x} ${y})" text-anchor="middle" font-size="${taille}" font-style="italic" letter-spacing="2" fill="${couleur}" fill-opacity="0.9" ${halo("#13202a", 4)} stroke-opacity="0.5">${echapper(l.nom)}</text>`);
  }

  // Noms des régions : capitales espacées, discrètes.
  for (const r of regions) {
    const e = ETIQUETTES[r.cle] ?? { dx: 0, dy: -80 };
    const lignes = L.lignes(r, e.lignes ?? [r.nom]);
    const x = r.repere.x + e.dx, y0 = r.repere.y + e.dy - (lignes.length - 1) * 40;
    lignes.forEach((l, i) => {
      const taille = i === 0 ? 34 : 25, y = y0 + i * 38 + (i ? 4 : 0);
      p.push(`<text x="${x}" y="${y}" text-anchor="middle" font-size="${taille}" letter-spacing="${i === 0 ? 9 : 6}" fill="#fbf3df" fill-opacity="0.9" ${halo("#17120c", 6)} stroke-opacity="0.55">${echapper(L.capitales(l))}</text>`);
    });
  }

  // Cadre.
  p.push(`<rect x="22" y="22" width="${W - 44}" height="${H - 44}" fill="none" stroke="#e9dcb8" stroke-opacity="0.75" stroke-width="3"/>`);
  p.push(`<rect x="34" y="34" width="${W - 68}" height="${H - 68}" fill="none" stroke="#e9dcb8" stroke-opacity="0.45" stroke-width="1.5"/>`);

  // Cartouche du titre (en haut à gauche, sur l'océan).
  p.push(`<g transform="translate(80 80)">`);
  p.push(`<rect x="0" y="0" width="840" height="250" rx="6" fill="#efe3c4" fill-opacity="0.93" stroke="#2a2016" stroke-width="4"/>`);
  p.push(`<rect x="12" y="12" width="816" height="226" rx="3" fill="none" stroke="#2a2016" stroke-width="1.5"/>`);
  p.push(`<text x="420" y="108" text-anchor="middle" font-size="76" letter-spacing="4" fill="#2a1d12">${echapper(L.t("La Réunion — Fénoir"))}</text>`);
  p.push(`<path d="M130 136H710" stroke="#7a2e1c" stroke-width="2.5"/><path d="M400 136l20 -9l20 9l-20 9z" fill="#7a2e1c"/>`);
  p.push(`<text x="420" y="182" text-anchor="middle" font-size="30" font-style="italic" fill="#3b2c1c">${echapper(L.t("Carte des routes, des cirques et des Hauts"))}</text>`);
  p.push(`<text x="420" y="220" text-anchor="middle" font-size="22" letter-spacing="4" fill="#5a4630">${echapper(L.t("ÎLE DE LA RÉUNION · OCÉAN INDIEN"))}</text>`);
  p.push(`</g>`);

  // Rose des vents (en haut à droite).
  p.push(roseDesVents(3600, 520, 250, L));

  // Légende et échelle (en bas à gauche).
  p.push(legende(80, 2330, L));
  p.push(echelle(110, 2880, L));

  // Océan Indien et crédits.
  p.push(`<text x="2450" y="2925" text-anchor="middle" font-size="40" font-style="italic" letter-spacing="22" fill="#9fbfd0" fill-opacity="0.75">${echapper(L.t("OCÉAN INDIEN"))}</text>`);
  p.push(`<text x="3940" y="2952" text-anchor="end" font-size="17" fill="#c9d6dc" fill-opacity="0.7">${echapper(L.t("Contour : IGN Admin Express (Licence ouverte) · Relief : Terrain Tiles, AWS Open Data (SRTM, ETOPO1) · Routes et sentiers : © les contributeurs d'OpenStreetMap (ODbL)"))}</text>`);
  return p.join("\n");
}

function roseDesVents(cx, cy, r, L) {
  const p = [`<g transform="translate(${cx} ${cy})">`];
  p.push(`<circle r="${r}" fill="#0b1a26" fill-opacity="0.35" stroke="#e9dcb8" stroke-opacity="0.8" stroke-width="2.5"/>`);
  p.push(`<circle r="${r - 14}" fill="none" stroke="#e9dcb8" stroke-opacity="0.5" stroke-width="1.2"/>`);
  for (let a = 0; a < 360; a += 10) {
    const l = a % 90 === 0 ? 22 : a % 30 === 0 ? 14 : 8, t = a * Math.PI / 180, s = Math.sin(t), c = -Math.cos(t);
    p.push(`<path d="M${(s * (r - 14)).toFixed(1)} ${(c * (r - 14)).toFixed(1)}L${(s * (r - 14 - l)).toFixed(1)} ${(c * (r - 14 - l)).toFixed(1)}" stroke="#e9dcb8" stroke-opacity="0.7" stroke-width="1.5"/>`);
  }
  const branche = (angle, long, larg, clair, sombre) => {
    const t = angle * Math.PI / 180, s = Math.sin(t), c = -Math.cos(t), ps = Math.sin(t + Math.PI / 2), pc = -Math.cos(t + Math.PI / 2);
    const pointe = `${(s * long).toFixed(1)} ${(c * long).toFixed(1)}`, g = `${(ps * larg).toFixed(1)} ${(pc * larg).toFixed(1)}`, dr = `${(-ps * larg).toFixed(1)} ${(-pc * larg).toFixed(1)}`;
    return `<path d="M0 0L${pointe}L${g}Z" fill="${clair}"/><path d="M0 0L${pointe}L${dr}Z" fill="${sombre}"/>`;
  };
  for (const a of [45, 135, 225, 315]) p.push(branche(a, r * 0.55, r * 0.09, "#d9c9a0", "#5b4a33"));
  for (const a of [0, 90, 180, 270]) p.push(branche(a, r * 0.86, r * 0.13, a === 0 ? "#f3e6c4" : "#e6d6ae", a === 0 ? "#8a2f1c" : "#4a3a26"));
  p.push(`<circle r="${r * 0.06}" fill="#efe3c4" stroke="#2a2016" stroke-width="2"/>`);
  const lettre = (txt, x, y, t) => `<text x="${x}" y="${y}" text-anchor="middle" dominant-baseline="central" font-size="${t}" fill="#f3e6c4" stroke="#0b1a26" stroke-width="5" paint-order="stroke" stroke-opacity="0.7">${txt}</text>`;
  p.push(lettre(L.t("N"), 0, -r - 34, 52), lettre(L.t("S"), 0, r + 30, 38), lettre(L.t("E"), r + 30, 0, 38), lettre(L.t("O"), -r - 32, 0, 38));
  p.push(`</g>`);
  return p.join("");
}

function legende(x, y, L) {
  const p = [`<g transform="translate(${x} ${y})">`];
  p.push(`<rect width="560" height="420" rx="6" fill="#efe3c4" fill-opacity="0.9" stroke="#2a2016" stroke-width="3"/>`);
  p.push(`<text x="280" y="50" text-anchor="middle" font-size="30" letter-spacing="8" fill="#2a1d12">${echapper(L.t("LÉGENDE"))}</text>`);
  const ligne = (i, dessin, txt) => { const yy = 100 + i * 52; p.push(`<g transform="translate(40 ${yy})">${dessin}</g><text x="170" y="${yy + 9}" font-size="25" fill="#2a1d12">${echapper(L.t(txt))}</text>`); };
  ligne(0, `<path d="M0 0H100" stroke="#21170e" stroke-width="11" stroke-linecap="round"/><path d="M0 0H100" stroke="#f5d58f" stroke-width="6" stroke-linecap="round"/>`, "Route nationale");
  ligne(1, `<path d="M0 0H100" stroke="#241b12" stroke-width="7.5" stroke-linecap="round"/><path d="M0 0H100" stroke="#efe3c6" stroke-width="4" stroke-linecap="round"/>`, "Route départementale");
  ligne(2, `<path d="M0 0H100" stroke="#241b12" stroke-width="6" stroke-linecap="round"/><path d="M0 0H100" stroke="#d9c49a" stroke-width="3" stroke-linecap="round"/>`, "Route forestière");
  ligne(3, `<path d="M0 0H100" stroke="#1d1710" stroke-opacity="0.6" stroke-width="5.5" stroke-dasharray="12 9"/><path d="M0 0H100" stroke="#8a6a3a" stroke-width="2.6" stroke-dasharray="12 9"/>`, "Sentier (à pied seulement)");
  ligne(4, `<path d="M0 0C30 -10 60 10 100 0" fill="none" stroke="#3f7489" stroke-width="4" stroke-linecap="round"/>`, "Rivière, ravine");
  ligne(5, `<path d="M50 -14L63 8L37 8Z" fill="#2a1d12" stroke="#2a2016" stroke-width="1"/>`, "Sommet (altitude)");
  p.push(`</g>`);
  return p.join("");
}

function echelle(x, y, L) {
  const km = 20, seg = 5, p = [`<g transform="translate(${x} ${y})">`];
  p.push(`<rect x="-30" y="-58" width="${km * PX_KM + 120}" height="104" rx="6" fill="#efe3c4" fill-opacity="0.9" stroke="#2a2016" stroke-width="3"/>`);
  for (let i = 0; i < km / seg; i++) p.push(`<rect x="${i * seg * PX_KM}" y="0" width="${seg * PX_KM}" height="14" fill="${i % 2 ? "#efe3c4" : "#2a1d12"}" stroke="#2a1d12" stroke-width="2"/>`);
  for (let k = 0; k <= km; k += seg) p.push(`<text x="${k * PX_KM}" y="-14" text-anchor="middle" font-size="24" fill="#2a1d12">${k}</text>`);
  p.push(`<text x="${km * PX_KM + 34}" y="12" text-anchor="middle" font-size="24" fill="#2a1d12">${echapper(L.t("km"))}</text>`);
  p.push(`<text x="${km * PX_KM / 2}" y="40" text-anchor="middle" font-size="18" font-style="italic" fill="#4a3a26">${echapper(L.t(`1 km ≈ ${PX_KM} px`))}</text>`);
  p.push(`</g>`);
  return p.join("");
}

// Repères : contrôle sur la vraie géographie (terre ou mer, altitude, creux de cirque).
// REPERES_CORRIGES : positions retenues pour les étiquettes de la carte quand le repère du contenu tombe mal ; à reporter dans
// contenu/regions.mjs (le fabricant ne les modifie pas).
const REPERES_CORRIGES = {};
function verifierReperes(regions, binaire, grille, creux) {
  console.log("\nRepères des régions (contenu) :");
  for (const r of regions) {
    const { x, y } = r.repere, k = Math.round(y) * W + Math.round(x);
    const e = echantillon(grille, GW, GH, x / MAILLE - 0.5, y / MAILLE - 0.5), c = echantillon(creux, GW, GH, x / MAILLE - 0.5, y / MAILLE - 0.5);
    let dTerre = 0;
    if (!binaire[k]) { for (let rr = 1; rr < 400 && !dTerre; rr++) for (let a = 0; a < 64; a++) { const xx = Math.round(x + rr * Math.cos(a / 64 * 2 * Math.PI)), yy = Math.round(y + rr * Math.sin(a / 64 * 2 * Math.PI)); if (binaire[yy * W + xx]) { dTerre = rr; break; } } }
    const corr = REPERES_CORRIGES[r.cle] ? ` -> corrigé ${REPERES_CORRIGES[r.cle].x},${REPERES_CORRIGES[r.cle].y}` : "";
    console.log(`  ${r.cle.padEnd(22)} ${String(x).padStart(4)},${String(y).padStart(4)}  ${binaire[k] ? "terre" : `MER (côte à ${dTerre} px)`}  alt ${Math.round(e)} m  creux ${Math.round(c)} m  [${r.zone}]${corr}`);
  }
}

// ================================================================ Lancé directement (importé par les essais : rien ne se dessine)
const lanceDirectement = () => {
  try { return realpathSync(fileURLToPath(import.meta.url)) === realpathSync(resolve(process.argv[1] ?? "")); } catch { return false; }
};
if (lanceDirectement()) {
  if (args.includes("--telecharger")) await telecharger();
  else dessiner();
  process.exit(0);
}
