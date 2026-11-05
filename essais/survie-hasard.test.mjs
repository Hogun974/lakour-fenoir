// Le hasard de la partie (logique/hasard.mjs, logique/sha256.mjs) : graine de 128 bits, flux dérivés par SHA-256, générateur à
// état de 128 bits. Le monde réel est secret : un joueur qui relève les annonces publiques (radio, coupures) ne doit pas pouvoir
// retrouver la graine en essayant toutes les valeurs, ni rejouer la simulation.  Lancer : npm run essais
import { test } from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import * as L from "../systems/lakour-survie/logique/index.mjs";
import { sha256Hex } from "../systems/lakour-survie/logique/sha256.mjs";
import { contenuMini } from "./doublures/contenu-mini.mjs";

test("SHA-256 : vecteurs de la norme (FIPS 180-4) et accord avec node:crypto (longueurs autour des blocs, UTF-8)", () => {
  assert.equal(sha256Hex(""), "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855");
  assert.equal(sha256Hex("abc"), "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad");
  assert.equal(sha256Hex("abcdbcdecdefdefgefghfghighijhijkijkljklmklmnlmnomnopnopq"), "248d6a61d20638b8e5c026930c3e6039a33ce45964ff2167f6ecedd419db06c1");
  assert.equal(sha256Hex("a".repeat(1000)), createHash("sha256").update("a".repeat(1000)).digest("hex"));
  for (let n = 0; n < 200; n++) {
    const t = Array.from({ length: n }, (_, i) => String.fromCodePoint(32 + ((i * 7919 + n * 31) % 400))).join("") + (n % 3 ? "é|ℝ🌋" : "");
    assert.equal(sha256Hex(t), createHash("sha256").update(t, "utf8").digest("hex"), `longueur ${n}`);
  }
});

test("graine sûre : 128 bits de crypto.getRandomValues (32 caractères hexadécimaux), jamais deux fois la même", () => {
  const vues = new Set();
  for (let i = 0; i < 200; i++) {
    const g = L.graineSure();
    assert.match(g, /^[0-9a-f]{32}$/);
    assert.ok(L.graineLongue(g));
    vues.add(g);
  }
  assert.equal(vues.size, 200);
  assert.equal(L.graineLongue("fenoir"), false);
  assert.equal(L.graineLongue("x".repeat(31)), false);
  // La logique tire une graine sûre quand on ne lui en donne pas.
  const C = contenuMini();
  assert.match(L.creerMonde(C).graine, /^[0-9a-f]{32}$/);
  assert.match(L.demarrerPartie({ contenu: C, region: "port-gris" }).monde.graine, /^[0-9a-f]{32}$/);
});

test("générateur : déterministe pour une graine, dans [0, 1), flux indépendants, moyenne et répartition correctes", () => {
  const a = L.creerHasard("une graine"), b = L.creerHasard("une graine");
  const suite = Array.from({ length: 20 }, () => a());
  assert.deepEqual(Array.from({ length: 20 }, () => b()), suite, "même graine, même suite");
  // Suite figée : la simulation et les essais en dépendent (un changement du générateur doit se voir ici).
  const fige = L.creerHasard("lakour-survie");
  assert.deepEqual(Array.from({ length: 3 }, () => Math.floor(fige() * 1e6)), FIGE);
  const h = L.deriverHasard("graine", "radio", 12);
  let somme = 0;
  const cases = new Array(10).fill(0);
  for (let i = 0; i < 20000; i++) { const x = h(); assert.ok(x >= 0 && x < 1); somme += x; cases[Math.floor(x * 10)]++; }
  assert.ok(Math.abs(somme / 20000 - 0.5) < 0.01, `moyenne ${somme / 20000}`);
  for (const n of cases) assert.ok(n > 1800 && n < 2200, `répartition ${cases}`);
  // Deux usages, deux jours : deux flux différents.
  const premier = f => Array.from({ length: 4 }, () => f());
  assert.notDeepEqual(premier(L.deriverHasard("graine", "radio", 12)), premier(L.deriverHasard("graine", "radio", 13)));
  assert.notDeepEqual(premier(L.deriverHasard("graine", "radio", 12)), premier(L.deriverHasard("graine", "jour", 12)));
  assert.equal(L.creerHasard(""), Math.random);
});

// Avec l'ancien hasard (FNV-1a 32 bits, puis mulberry32 à état de 32 bits), deux graines dont le hachage de 32 bits coïncide
// donnaient EXACTEMENT le même monde, jour après jour (le suffixe « |jour|J » ne change rien à une collision de FNV-1a) : il n'y
// avait que 2^32 mondes possibles, qu'un joueur pouvait tous essayer contre les annonces de la radio. Ces deux graines se
// heurtent en FNV-1a.
const fnv1a = texte => { let h = 0x811c9dc5; for (const c of texte) { h ^= c.codePointAt(0); h = Math.imul(h, 0x01000193) >>> 0; } return h >>> 0; };
test("plus de collision à 32 bits : deux graines de même FNV-1a donnent deux mondes différents", () => {
  const [g1, g2] = ["g2rnw", "gjpba"];
  assert.equal(fnv1a(g1), fnv1a(g2), "les deux graines se heurtent bien en FNV-1a 32 bits");
  assert.equal(fnv1a(`${g1}|jour|3`), fnv1a(`${g2}|jour|3`), "et leurs flux dérivés aussi");
  const premier = f => Array.from({ length: 8 }, () => f());
  assert.notDeepEqual(premier(L.creerHasard(g1)), premier(L.creerHasard(g2)));
  assert.notDeepEqual(premier(L.hasardDuJour(g1, 3)), premier(L.hasardDuJour(g2, 3)));
  const C = contenuMini();
  const m1 = L.creerMonde(C, g1), m2 = L.creerMonde(C, g2);
  assert.notDeepEqual({ coupures: m1.coupures, regions: m1.regions }, { coupures: m2.coupures, regions: m2.regions });
});

const FIGE = [320341, 501200, 502830];
