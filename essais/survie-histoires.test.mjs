// Lot 11 « Les histoires des survivants » (contrat §16) : les phrases d'histoire du jeu 3D portées dans lakour-fenoir
// (contenu/histoires.mjs), en français et en anglais, au féminin et au masculin ; leur tirage (logique/histoires.mjs) branché sur
// le générateur de survivants ; l'histoire d'un acteur et le portrait de son journal « Histoire de… » (scripts/histoires.mjs).
// Lancer : npm run essais
import { test } from "node:test";
import assert from "node:assert/strict";
import { donnees } from "../modules/lakour-fenoir/contenu/index.mjs";
import { HISTOIRES } from "../modules/lakour-fenoir/contenu/histoires.mjs";
import { fabriquer, fabriquerAnglais, lireDictionnaires, verifierDonnees, termesInterdits } from "../outils/fabriquer-fenoir.mjs";
import { normaliserContenu } from "../systems/lakour-survie/scripts/registre.mjs";
import { donneesJournalHistoire } from "../modules/lakour-mj-ia/scripts/histoire-logique.js";
import { L, contenuMini } from "./doublures/survie-outils.mjs";
import { installerFoundry, calme } from "./doublures/foundry-survie.mjs";
import { charger, monde } from "./doublures/survie-api-outils.mjs";

const registreFr = donnees();
const { registre: registreEn } = fabriquerAnglais(fabriquer(), registreFr, lireDictionnaires().dictionnaire);
const C = normaliserContenu(registreFr);
const CEn = normaliserContenu(registreEn);
const groupes = type => HISTOIRES.filter(g => g.type === type);
const toutes = HISTOIRES.flatMap(g => g.phrases.map(p => ({ ...p, groupe: g })));

installerFoundry();
const M0 = await charger();

// ------------------------------------------------------------------ le contenu
test("contenu : ~440 phrases ; chaque enfance, passé, trait, religion et regard a les siennes ; forme valide dans les deux genres", () => {
  assert.ok(toutes.length >= 430 && toutes.length <= 470, `${toutes.length} phrases`);
  assert.deepEqual(L.verifierHistoires(C), [], "forme des phrases");
  assert.deepEqual(verifierDonnees(registreFr).filter(e => e.startsWith("histoires")), [], "le fabricant accepte les histoires");
  const pour = type => new Set(groupes(type).flatMap(g => g.pour));
  for (const e of registreFr.enfances) {
    const l = groupes("enfance").find(g => g.pour.includes(e.cle))?.phrases ?? [];
    assert.ok(l.length >= 8 && l.length <= 11, `${e.cle} : ${l.length} phrases`);
    assert.ok(l.some(p => p.sujet === "lieu"), `${e.cle} : un lieu`);
  }
  for (const p of registreFr.passes) {
    const l = groupes("passe").find(g => g.pour.includes(p.cle))?.phrases ?? [];
    assert.ok(l.length >= 7 && l.length <= 8, `${p.cle} : ${l.length} phrases`);
    assert.ok(l.some(x => x.sujet === "metier"), `${p.cle} : un métier`);
  }
  for (const t of registreFr.traits) assert.ok(pour("trait").has(t.cle), `trait ${t.cle}`);
  for (const r of [...registreFr.religions.map(r => r.cle)]) assert.ok(pour("religion").has(r), `religion ${r}`);
  for (const r of L.REGARDS) assert.ok(pour("regard").has(r), `regard ${r}`);
  assert.equal(groupes("generation")[0].phrases.length, 18);
  assert.ok(groupes("generation")[0].phrases.every(p => Array.isArray(p.age)), "une génération a toujours sa tranche d'âge");
  // Le registre porte les histoires telles quelles.
  assert.equal(registreFr.histoires, HISTOIRES);
});

test("contenu : une phrase de passé ne dit rien de l'enfance ; « né ailleurs » sur les enfances d'ailleurs ; ni couleur de peau, ni terme interdit", () => {
  for (const g of groupes("passe")) for (const p of g.phrases) {
    assert.doesNotMatch(p.texte, /grandi|enfance|ses parents|sa mère|son père|(?<!\p{L})né(?:\{e\|\})?(?!\p{L})/iu, `${g.cle} : ${p.texte}`);
  }
  const ailleurs = new Set(registreFr.enfances.filter(e => e.origine === "ailleurs").map(e => e.cle));
  for (const p of toutes.filter(x => x.marques?.includes(L.MARQUE_NEE_AILLEURS))) assert.ok(p.groupe.type === "enfance" && ailleurs.has(p.groupe.pour[0]), p.texte);
  // Guide du métissage : on ne dit pas l'apparence d'après l'origine (on est métis).
  for (const p of toutes) assert.doesNotMatch(p.texte, /peau (claire|sombre|noire|blanche|brune|mate)|qui rougit|yeux clairs/i, p.texte);
  assert.deepEqual(termesInterdits(JSON.stringify(HISTOIRES)), []);
  // Les préjugés sont dans la bouche des gens, et les faits les démentent.
  const chinoise = groupes("enfance").find(g => g.pour.includes("enfance-chinoise-de-saint-denis")).phrases.map(p => p.texte).join(" ");
  assert.match(chinoise, /On disait que la boutique ne faisait crédit qu'aux siens ; \{elle\|il\} l'a vue nourrir la rue/);
});

test("traduction : chaque phrase a son anglais, accordé dans les deux genres, 150 caractères au plus ; mêmes clés, mêmes nombres", () => {
  assert.equal(registreEn.histoires.length, HISTOIRES.length);
  registreEn.histoires.forEach((g, i) => {
    const fr = HISTOIRES[i];
    assert.equal(g.cle, fr.cle);
    assert.deepEqual(g.pour, fr.pour);
    assert.equal(g.phrases.length, fr.phrases.length, g.cle);
    g.phrases.forEach((p, j) => {
      const q = fr.phrases[j];
      assert.notEqual(p.texte, q.texte, `${g.cle}/${j} : encore en français`);
      assert.deepEqual({ ...p, texte: "" }, { ...q, texte: "" }, `${g.cle}/${j} : la mécanique ne se traduit pas`);
      assert.doesNotMatch(p.texte, /\{Elle\|Il\}|\{elle\|il\}|«|»/, `${g.cle}/${j}`);
      for (const genre of L.GENRES) {
        const t = L.accorder(p.texte, genre);
        assert.ok(t && t.length <= L.HISTOIRE.phraseMax, `${g.cle}/${j} (${genre}) : ${t}`);
      }
    });
  });
  assert.deepEqual(L.verifierHistoires(CEn), []);
  // Créole : le sens à côté.
  const en = registreEn.histoires.flatMap(g => g.phrases.map(p => p.texte)).join(" ");
  for (const glose of ["\"yab kouyon\", hill-country fool", "« lontan », the old days", "pilao, spiced rice", "20 désanm, Abolition Day"]) {
    assert.ok(en.includes(glose.replace("« lontan »", "\"lontan\"")), glose);
  }
});

// ------------------------------------------------------------------ la logique
test("accorder : le féminin d'abord ; accolades mal formées refusées", () => {
  const texte = "{Elle|Il} est né{e|} à Cilaos, {heureuse|heureux}.";
  assert.equal(L.accorder(texte, "f"), "Elle est née à Cilaos, heureuse.");
  assert.equal(L.accorder(texte, "m"), "Il est né à Cilaos, heureux.");
  assert.equal(L.accorder("Sans accord.", "f"), "Sans accord.");
  for (const fautif of ["{Elle|Il est", "Elle} est", "{Elle} est", "{a|b|c}", "{a{b|c}|d}"]) assert.equal(L.accorder(fautif, "f"), null, fautif);
});

test("tirage : le lieu ouvre, le métier suit ; 3 à 5 phrases, 520 caractères ; même fiche, même histoire ; dans le genre du survivant", () => {
  const vues = new Set();
  for (let i = 0; i < 400; i++) {
    const s = L.genererSurvivant(C, L.creerHasard(`h${i}`), {});
    const g = s.histoire.graine;
    assert.ok(Array.isArray(g.cles) && g.cles.length === g.phrases.length, `tirage ${i} : des clés`);
    assert.ok(g.phrases.length >= L.HISTOIRE.phrasesMin && g.phrases.length <= L.HISTOIRE.phrasesMax, `tirage ${i} : ${g.phrases.length}`);
    assert.ok(g.phrases.join(" ").length <= L.HISTOIRE.histoireMax + L.HISTOIRE.phrasesMax);
    const parId = new Map(L.phrasesHistoire(C).map(p => [p.id, p]));
    const choisies = g.cles.map(id => parId.get(id));
    assert.equal(choisies[0].type, "enfance");
    assert.equal(choisies[0].sujet, "lieu", `tirage ${i} : le lieu d'abord`);
    assert.ok(choisies[0].pour.includes(s.enfance) && choisies[1].pour.includes(s.enfance));
    assert.equal(choisies[2].type, "passe");
    assert.equal(choisies[2].sujet, "metier", `tirage ${i} : puis le métier`);
    assert.ok(choisies[2].pour.includes(s.passe) && choisies[3].pour.includes(s.passe));
    assert.equal(new Set(choisies.map(p => p.sujet)).size, choisies.length, "jamais deux fois le même sujet");
    for (const p of choisies) assert.ok(s.age >= p.ageMin && s.age <= p.ageMax, `${p.id} à ${s.age} ans`);
    // Le genre : aucune trace de l'autre.
    if (s.genre === "f") assert.ok(g.phrases.every(p => !/^Il /.test(p)), g.phrases.join(" "));
    if (s.genre === "m") assert.ok(g.phrases.every(p => !/^Elle /.test(p)), g.phrases.join(" "));
    // Même fiche, même histoire ; et l'histoire se relit par ses clés.
    const fiche = { nom: s.nom, age: s.age, genre: s.genre, enfance: s.enfance, passe: s.passe, traits: s.traits, religion: s.religion, religions: s.religions, pratique: s.pratique, regard: s.regard };
    assert.deepEqual(L.composerHistoire(C, fiche), { phrases: g.phrases, cles: g.cles });
    assert.deepEqual(L.histoireDe(C, fiche, { cles: g.cles }), g.phrases);
    for (const id of g.cles) vues.add(id);
  }
  assert.ok(vues.size > 250, `${vues.size} phrases différentes vues en 400 tirages`);
});

test("tirage : né ailleurs, pratique, foi, « plusieurs » ; les tranches d'âge", () => {
  const parId = new Map(L.phrasesHistoire(C).map(p => [p.id, p]));
  const base = { nom: "Essai", genre: "f", age: 50, passe: "planteur-de-canne", traits: [], religion: "aucune", regard: "vivre" };
  const histoires = (fiche, n = 300) => Array.from({ length: n }, (_, i) => L.composerHistoire(C, { ...fiche, nom: `Essai ${i}` })).map(h => h.cles.map(id => parId.get(id)));
  // Une enfance d'ailleurs ne se souvient jamais de « toute une vie dans l'île ».
  for (const l of histoires({ ...base, enfance: "enfance-a-maurice", age: 60 })) assert.ok(l.every(p => !p.exclut.includes(L.MARQUE_NEE_AILLEURS)), l.map(p => p.id).join());
  const natifs = histoires({ ...base, enfance: "enfant-de-cilaos", age: 60 }).flat();
  assert.ok(natifs.some(p => p.exclut.includes(L.MARQUE_NEE_AILLEURS)), "un natif peut s'en souvenir");
  // La pratique d'aujourd'hui : seulement pour un pratiquant ; le front cendré : seulement pour la foi hindoue.
  const tamouls = histoires({ ...base, enfance: "enfance-tamoule-de-saint-andre", religion: "islam", pratique: false }).flat();
  assert.ok(tamouls.every(p => !p.pratique && !p.foi.length), "ni pratique ni front cendré sans la foi");
  const hindous = histoires({ ...base, enfance: "enfance-tamoule-de-saint-andre", religion: "hindouisme-tamoul", pratique: true }, 600).flat();
  assert.ok(hindous.some(p => p.foi.length), "le front cendré, pour un hindou");
  assert.ok(hindous.some(p => p.pratique && p.type === "religion"), "la pratique, pour un pratiquant");
  assert.ok(hindous.filter(p => p.type === "religion").every(p => p.pour.includes("hindouisme-tamoul")));
  // « Plusieurs » : la Vierge et Mariamen seulement si catholique ET hindoue.
  const melange = r => histoires({ ...base, enfance: "enfant-de-cilaos", religion: "plusieurs", religions: r, pratique: true }, 600).flat().filter(p => p.type === "religion");
  assert.ok(melange(["catholique", "hindouisme-tamoul"]).some(p => p.pour.includes("plusieurs")));
  assert.ok(melange(["catholique", "culte-chinois"]).every(p => !p.pour.includes("plusieurs")));
  assert.ok(melange(["catholique", "culte-chinois"]).some(p => p.pour.includes("culte-chinois")), "chacune de ses religions parle");
  // Les âges : l'étudiante sur le tard (30 ans et plus) ou en deuxième année (16 à 29).
  const etudes = age => histoires({ ...base, enfance: "enfant-de-cilaos", passe: "etudiante", age }).flat().map(p => p.id);
  assert.ok(!etudes(20).includes("passe:etudiante/0") && etudes(40).includes("passe:etudiante/0"));
  assert.ok(etudes(20).includes("passe:etudiante/1") && !etudes(40).includes("passe:etudiante/1"));
  // Une religion inconnue de l'esprit (fiche d'avant, esprit pas tiré) : ni foi, ni pratique.
  assert.ok(histoires({ ...base, enfance: "enfance-tamoule-de-saint-andre", religion: "", regard: "" }).flat().every(p => !p.pratique && !p.foi.length && !["religion", "regard"].includes(p.type)));
});

test("tirage : sans genre, sans phrases pour son enfance ou sans histoires : on garde les phrases de l'enfance et du passé", () => {
  const fiche = { nom: "Alex", age: 30, genre: "", enfance: "enfant-de-cilaos", passe: "mecanicien" };
  assert.equal(L.composerHistoire(C, fiche), null, "sans genre connu");
  assert.equal(L.composerHistoire(C, { ...fiche, genre: "m", enfance: "inconnue" }), null);
  assert.deepEqual(L.histoireDe(C, fiche), []);
  // Le contenu d'essai n'a pas d'histoires : la graine garde les deux phrases de l'enfance et du passé, comme avant.
  const s = L.genererSurvivant(contenuMini(), L.creerHasard("v"), { statut: "pnj", budget: null, verrous: { age: 30, enfance: "enfant-des-hauts", passe: "infirmiere", traits: ["pacifique"], nom: "Rosemay" } });
  assert.equal(s.histoire.graine.phrases.length, 2);
  assert.equal(s.histoire.graine.cles, undefined);
  // Une clé inconnue : rien de relu, on recompose.
  assert.deepEqual(L.phrasesParCles(C, ["enfance:inconnue/0"], "f"), []);
});

test("générateur : les histoires ne changent aucun autre tirage (flux à part) ; l'autre genre et l'autre langue se relisent", () => {
  const sansHistoires = { ...C, histoires: undefined };
  for (let i = 0; i < 100; i++) {
    const a = L.genererSurvivant(C, L.creerHasard(`p${i}`), {});
    const b = L.genererSurvivant(sansHistoires, L.creerHasard(`p${i}`), {});
    const sans = s => ({ ...s, histoire: { ...s.histoire, graine: { ...s.histoire.graine, phrases: [], cles: [] } } });
    assert.deepEqual(sans(a), sans(b), `tirage ${i}`);
  }
  // Les mêmes clés, relues au masculin, puis en anglais.
  const s = L.genererSurvivant(C, L.creerHasard("relire"), { genre: "f" });
  const { cles } = s.histoire.graine;
  const masculin = L.phrasesParCles(C, cles, "m");
  assert.equal(masculin.length, cles.length);
  assert.notDeepEqual(masculin, s.histoire.graine.phrases);
  const anglais = L.phrasesParCles(CEn, cles, "f");
  assert.equal(anglais.length, cles.length);
  assert.ok(anglais.every(p => !/\b(Elle|Il|une|des)\b/.test(p)), anglais.join(" "));
  // Sur le registre anglais, le générateur raconte en anglais, avec les mêmes clés.
  const en = L.genererSurvivant(CEn, L.creerHasard("relire"), { genre: "f" });
  assert.deepEqual(en.histoire.graine.cles, cles);
  assert.deepEqual(en.histoire.graine.phrases, anglais);
});

// ------------------------------------------------------------------ Foundry : l'acteur, le journal
test("API : le survivant créé garde ses phrases ; histoireDuSurvivant les relit ; le portrait du journal se remplit une fois", async () => {
  const M = await monde(M0);
  const H = await import("../systems/lakour-survie/scripts/histoires.mjs");
  const tirage = M.api.generer({ statut: "joueur", hasard: L.creerHasard("histoire-api") });
  assert.ok(tirage.histoire.cles.length >= 3);
  for (const p of tirage.histoire.phrases) assert.ok(tirage.graine.includes(p), "la graine du MJ IA porte les phrases");
  const r = await M.api.creerSurvivant({ donnees: tirage, rejoindre: false });
  const a = game.actors.get(r.acteurId);
  assert.deepEqual(a.flags["lakour-survie"][H.DRAPEAU_PHRASES], tirage.histoire.cles);
  assert.deepEqual(M.api.histoireDuSurvivant({ acteurId: a.id }), { phrases: tirage.histoire.phrases, cles: tirage.histoire.cles });
  // Une clé forgée n'est pas gardée.
  const forge = await M.api.creerSurvivant({ donnees: { ...tirage, histoire: { ...tirage.histoire, cles: ["enfance:inconnue/9"] } }, rejoindre: false });
  assert.equal(game.actors.get(forge.acteurId).flags["lakour-survie"][H.DRAPEAU_PHRASES], undefined);
  // Un acteur d'avant ce lot (sans clés) : son histoire vient de sa fiche.
  const ancien = game.actors.get(forge.acteurId);
  assert.ok(M.api.histoireDuSurvivant({ acteur: ancien }).phrases.length >= 3);
  // Un tirage dont on a changé le passé (le MJ IA le fait) ne garde pas des phrases d'un autre métier.
  const autrePasse = registreFr.passes.find(p => p.cle !== tirage.passe && !p.ageMin && (!p.genre || p.genre === tirage.genre || p.nomAutre)).cle;
  const change = await M.api.creerSurvivant({ donnees: { ...tirage, passe: autrePasse }, rejoindre: false });
  const ac = game.actors.get(change.acteurId);
  assert.equal(ac.flags["lakour-survie"][H.DRAPEAU_PHRASES], undefined);
  const h = M.api.histoireDuSurvivant({ acteur: ac });
  assert.ok(h.cles.some(id => id.startsWith(`passe:${autrePasse}/`)), "son histoire dit son vrai métier");
  // Le MJ change l'enfance d'un survivant : ses phrases gardées ne vont plus, on recompose.
  const autreEnfance = registreFr.enfances.find(e => e.cle !== a.system.enfance).cle;
  await a.update({ "system.enfance": autreEnfance });
  assert.ok(M.api.histoireDuSurvivant({ acteur: a }).cles.some(id => id.startsWith(`enfance:${autreEnfance}/`)));
  await a.update({ "system.enfance": tirage.enfance });
  assert.deepEqual(M.api.histoireDuSurvivant({ acteurId: "personne" }), { phrases: [], cles: [] });

  // Le journal du moteur (pages d'aide), créé par le MJ : le crochet écrit le portrait.
  H.brancherHistoires(() => M.api.contenu());
  const donneesJ = donneesJournalHistoire({ nom: a.name, acteurUuid: a.uuid, systeme: "lakour-survie" });
  const journal = {
    flags: donneesJ.flags, pages: donneesJ.pages.map((p, i) => ({ ...structuredClone(p), id: `page${i}` })),
    async updateEmbeddedDocuments(_type, majs) { for (const m of majs) this.pages.find(p => p.id === m._id).text.content = m["text.content"]; }
  };
  assert.ok(H.estAideHistoire(H.pageDuPortrait(journal).text.content));
  Hooks.callAll("createJournalEntry", journal, {}, "u1");
  await calme();
  assert.ok(H.estAideHistoire(H.pageDuPortrait(journal).text.content), "un journal créé par un autre n'est pas touché ici");
  Hooks.callAll("createJournalEntry", journal, {}, game.user.id);
  await calme();
  const portrait = H.pageDuPortrait(journal).text.content;
  assert.equal(portrait, H.portraitHTML(tirage.histoire.phrases));
  assert.ok(!H.estAideHistoire(portrait));
  // Les autres pages gardent leurs questions ; une page déjà écrite ne se réécrit pas.
  assert.ok(journal.pages.filter(p => p !== H.pageDuPortrait(journal)).every(p => H.estAideHistoire(p.text.content)));
  H.pageDuPortrait(journal).text.content = "<p>Écrit par le MJ IA.</p>";
  assert.equal(await H.remplirPortrait(journal, a, M.api.contenu()), false);
  assert.equal(H.pageDuPortrait(journal).text.content, "<p>Écrit par le MJ IA.</p>");
  // Le HTML est échappé.
  assert.equal(H.portraitHTML(["A < B & « C »."]), "<p>A &lt; B &amp; « C ».</p>");
});
