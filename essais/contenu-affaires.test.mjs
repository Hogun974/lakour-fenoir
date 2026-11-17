// Le contenu du lot 12 « Affaires, récits et fêtes » (2026-11-17 ; contrat §17) et sa traduction :
// - les 23 affaires du jeu 3D, numérotées, chacune avec ses cinq parts (comment on l'apprend, ce qu'elle demande, comment elle
//   tourne mal, ce qu'elle change, ce qu'on en garde), sa vérité, sa pente, ses issues, ses voix et ses traces ;
// - les sujets délicats (décision de Jordan) : rien de montré, pas de gore, aucun enfant mis en danger ;
// - les rumeurs sur une communauté toujours fausses ; aucun effet lié à une origine ;
// - une ligne d'arrivée par région, les supports de récit sans quête, les figures, les bruits, les Livides en fête (règle de
//   respect) ; la page du livre de l'île ;
// - les fêtes : Pongal et le miel vert (hors du socle), ce qu'on voit et ce qu'on trouve à chaque fête, la foire de Bras-Panon ;
// - l'anglais : tout traduit, rien de français, le glossaire tenu.
// Aucun réseau.  Lancer : npm run essais
import { test } from "node:test";
import assert from "node:assert/strict";
import { DOCUMENTS, donnees } from "../modules/lakour-fenoir/contenu/index.mjs";
import { DONNEES_AFFAIRES, LOT_AFFAIRES, construireAffaires, NOMS_DU_CONTENU } from "../modules/lakour-fenoir/contenu/affaires.mjs";
import { TABLES } from "../modules/lakour-fenoir/contenu/tables.mjs";
import { FOIRES } from "../modules/lakour-fenoir/contenu/marche.mjs";
import { RELIGIONS } from "../modules/lakour-fenoir/contenu/religions.mjs";
import { FETES_FENOIR, FETES_HORS_SOCLE } from "../modules/lakour-fenoir/scripts/fetes.js";
import { MODULE, sansBalises } from "../modules/lakour-fenoir/contenu/aides.mjs";
import { erreursAffaire, FRONTS_CAMPAGNE, TAILLES_AFFAIRE } from "../systems/lakour-survie/logique/affaires.mjs";
import { fabriquer, fabriquerAnglais, verifierDonnees } from "../outils/fabriquer-fenoir.mjs";

const D = donnees();
const docs = fabriquer();
const doc = (pack, cle) => docs.find(x => x.pack === pack && x.doc.flags?.[MODULE]?.cle === cle)?.doc;
const texteAffaire = a => [a.titre, a.apprendre, a.demande, a.malTourner, a.change, a.garde, a.traces, a.ton, ...Object.values(a.verites).map(v => v.texte),
  ...a.pente.crans, ...a.issues.flatMap(i => [i.titre, i.texte]), ...a.voix].join("\n");

// Les titres de l'inventaire (INVENTAIRE-3D-POUR-FVTT.md, lot 12), dans l'ordre.
const TITRES = ["Les lentilles d'octobre", "La treille de Grand Îlet", "La quarantaine du col", "L'îlet où tout va bien", "Le tunnel aux vivres",
  "Les aiguilles de Bourg-Murat", "Les noyés de la passe", "Le vieux chemin pavé", "Le viaduc", "Une seule lampe", "Le kabar du 20 désanm", "Le vœu",
  "Le jour qu'il est", "Le service dans la nuit", "Les derniers arrivés", "Rendre à la lave", "L'alambic du Tévelave", "Zerbaz",
  "La petite centrale de Langevin", "Celui qu'on a refusé", "La liste du Comptable", "Le convoi du lait", "Le cargo"];

test("les 23 affaires : numérotées, titrées comme l'inventaire, bien formées, références connues, au registre et au journal du MJ", () => {
  assert.deepEqual(D.affaires.map(a => a.titre), TITRES);
  assert.deepEqual(D.affaires.map(a => a.numero), TITRES.map((_, i) => i + 1));
  for (const a of D.affaires) {
    assert.deepEqual(erreursAffaire(a, D), [], a.cle);
    for (const k of ["apprendre", "demande", "malTourner", "change", "garde"]) assert.ok(a[k].length > 20, `${a.cle} : ${k}`);
    assert.ok(a.issues.length >= 3 && a.issues.length <= 5, a.cle);
  }
  assert.deepEqual([...new Set(D.affaires.map(a => a.taille))].sort(), ["affaire", "front", "grande-affaire"]);
  assert.ok(TAILLES_AFFAIRE.includes("bruit"), "la plus petite taille vit dans la table des bruits");
  assert.deepEqual([...new Set(D.affaires.map(a => a.front).filter(Boolean))].sort(), ["comptable", "fournaise", "garnison", "remede"].sort());
  for (const f of D.affaires.map(a => a.front).filter(Boolean)) assert.ok(FRONTS_CAMPAGNE.includes(f));
  // Les vingt-trois pages du journal du MJ, une par affaire, plus l'introduction ; la méthode à part.
  const journal = doc("mj", "les-affaires-de-l-ile");
  assert.equal(journal.ownership.default, 0, "journal du MJ seul");
  assert.equal(journal.pages.length, 24);
  for (const a of D.affaires) {
    const p = journal.pages.find(x => x.flags?.[MODULE]?.cle === a.cle);
    assert.ok(p && p.name.startsWith(`${a.numero}. ${a.titre}`), a.cle);
    for (const motif of ["Comment on l'apprend", "Ce qu'elle demande", "Comment elle tourne mal", "Ce qu'elle change", "Ce qu'on en garde", "La vérité", "Les issues", "Effets"]) {
      assert.ok(p.text.content.includes(motif), `${a.cle} : ${motif}`);
    }
  }
  const mener = doc("mj", "mener-une-affaire");
  assert.ok(mener && mener.ownership.default === 0);
  for (const cle of ["principe", "naissance", "tailles", "verite", "pente", "issues", "voix", "sujets-delicats", "respect", "regions", "figures", "supports"]) {
    assert.ok(mener.pages.some(p => p.flags?.[MODULE]?.cle === cle), `Mener une affaire : page ${cle}`);
  }
  // La fabrique rejoue à l'identique (la traduction s'en sert).
  assert.deepEqual(construireAffaires(DONNEES_AFFAIRES, NOMS_DU_CONTENU).affaires, LOT_AFFAIRES.affaires);
});

test("sujets délicats (décision de Jordan) : rien de montré, pas de gore, aucun enfant mis en danger ; le front du remède écrit sobrement", () => {
  const gore = /\b(sang|gore|cervelles?|entrailles|viscères|tripes|cadavres? déchiqueté)\b|égorg|éventr|décapit|démemb|dévor/i;
  for (const a of D.affaires) assert.ok(!gore.test(texteAffaire(a)), `${a.cle} : rien de gore`);
  for (const t of [...LOT_AFFAIRES.tables.flatMap(t => t.results.map(r => sansBalises(r.description)))]) assert.ok(!gore.test(t), t);
  // Un enfant n'est jamais dans une phrase de danger.
  const danger = /mord|tué|tuer|bless|sacrifi|cobaye|expérien|danger|noy|brûl/i;
  for (const a of D.affaires) {
    for (const phrase of texteAffaire(a).split(/(?<=[.!?»])\s+/)) {
      if (/enfant/i.test(phrase) && !/^Aucun enfant/.test(phrase)) assert.ok(!danger.test(phrase), `${a.cle} : « ${phrase} »`);
    }
  }
  const lave = D.affaires.find(a => a.cle === "rendre-a-la-lave");
  assert.match(lave.ton, /Rien n'est montré/);
  assert.match(lave.ton, /Aucun enfant/);
  assert.equal(lave.front, "remede");
  const mener = doc("mj", "mener-une-affaire");
  const delicats = sansBalises(mener.pages.find(p => p.flags?.[MODULE]?.cle === "sujets-delicats").text.content);
  assert.match(delicats, /Rien n'est montré/);
  assert.match(delicats, /Aucun enfant n'est mis en danger/);
  assert.match(delicats, /ce qu'on comprend/);
  // Le front du remède de la campagne : l'enfant est une rumeur, protégé, jamais « voulu ».
  const campagne = doc("mj", "campagne-l-annee-du-gris");
  const remede = sansBalises(campagne.pages.find(p => p.flags?.[MODULE]?.cle === "front-remede").text.content);
  assert.ok(!/elle le veut/.test(remede));
  assert.match(remede, /ceux qui le gardent le cachent/);
  assert.match(remede, /jamais en danger sous les yeux des joueurs/);
});

test("préjugés et origines : une rumeur sur une communauté est toujours fausse, aucun effet ne tient à une origine", () => {
  for (const cle of ["le-service-dans-la-nuit", "les-derniers-arrives"]) {
    const a = D.affaires.find(x => x.cle === cle);
    assert.deepEqual(Object.keys(a.verites), ["fausse"], cle);
    assert.ok(a.issues.some(i => i.effets.rumeur === "dementie"), `${cle} : la rumeur se dément`);
    assert.ok(a.issues.some(i => i.effets.acte === "colporter" || i.effets.acte === "attaquer"), `${cle} : qui colporte ou frappe rougit`);
  }
  const communautes = new Set(D.communautes.map(c => c.cle));
  for (const a of D.affaires) for (const i of a.issues) {
    for (const k of Object.keys(i.effets.reputation ?? {})) assert.ok(!communautes.has(k), `${a.cle} : une réputation va à une faction, jamais à une communauté`);
  }
});

test("récits sans quête : une ligne d'arrivée par région, huit supports (six tables neuves, deux qui existaient), figures, bruits, Livides en fête", () => {
  assert.equal(D.regions.length, 16);
  for (const r of D.regions) assert.ok(r.arrivee.length > 40, `${r.cle} : arrivée`);
  assert.match(D.regions.find(r => r.cle === "sainte-marie").arrivee, /tableau des départs/);
  assert.match(D.regions.find(r => r.cle === "mafate").arrivee, /trop bien/);
  const supports = DONNEES_AFFAIRES.supports;
  assert.equal(supports.length, 8);
  assert.equal(supports.filter(s => s.table).length, 6);
  for (const s of supports.filter(s => s.existante)) {
    const t = TABLES.find(x => x.flags[MODULE].cle === s.existante.cle);
    assert.ok(t, `${s.cle} : table ${s.existante.cle}`);
    assert.equal(t.name, s.existante.nom, `${s.cle} : le nom cité est celui de la table`);
  }
  for (const s of supports.filter(s => s.table)) {
    const t = DOCUMENTS.find(d => d.__cle === `tables:recit-${s.cle}`);
    assert.ok(t && t.results.length >= 8, s.cle);
  }
  const tableDe = cle => DOCUMENTS.find(d => d.__cle === `tables:${cle}`);
  assert.equal(tableDe("affaires-ce-qui-se-raconte").results.length, 23);
  assert.equal(tableDe("figures-de-l-ile").results.length, 9);
  assert.ok(tableDe("bruits-de-l-ile").results.length >= 10);
  // Règle de respect : sur un Livide, des objets de fête profanes seulement.
  const livides = tableDe("livides-en-fete").results.map(r => sansBalises(r.description));
  const sacre = /croix|chapelet|rosaire|pottou|kavadi|voile|kofia|calotte|médaille|chapelle|brassard de deuil|ex-voto/i;
  for (const l of livides) assert.ok(!sacre.test(l), l);
  for (const f of FETES_FENOIR) {
    for (const phrase of f.ambiance.split(/(?<=\.)\s+/).filter(p => /Livide/.test(p))) {
      assert.ok(!sacre.test(phrase) && /bonnet|ruban|guirlande|casque/.test(phrase), `${f.cle} : « ${phrase} »`);
    }
  }
  // La page du livre de l'île (joueurs).
  const livre = doc("guides", "livre-de-l-ile");
  const signes = livre.pages.find(p => p.flags?.[MODULE]?.cle === "signes-des-murs");
  assert.ok(signes && /Sans-Lune/.test(signes.text.content));
  assert.equal(livre.pages.at(-1).flags[MODULE].cle, "premiere-nuit", "la première nuit reste la dernière page");
});

test("fêtes du lot 12 : Pongal et le miel vert avec gain, coût et communautés, sans doublon ; ce qu'on voit à chaque fête ; la foire de Bras-Panon", () => {
  assert.deepEqual(FETES_HORS_SOCLE, ["pongal", "fete-du-miel-vert"]);
  const pongal = D.fetes.find(f => f.cle === "pongal"), miel = D.fetes.find(f => f.cle === "fete-du-miel-vert");
  assert.deepEqual(pongal.communautes, ["malbars", "tous"]);
  assert.deepEqual(pongal.effet, { moral: 1, rations: 1, quarts: 1, bruit: 1, soutien: { moral: 1, jours: 4 } });
  assert.deepEqual(miel.communautes, ["tous"]);
  assert.deepEqual(miel.effet.gain, { nourriture: 1, medicaments: 1 });
  assert.equal(pongal.date, "01-14");
  assert.equal(Object.keys(miel.dates).length, 101);
  assert.ok(Object.values(miel.dates).every(d => /^01-(2[5-9]|3[01])$/.test(d)), "le dernier samedi de janvier");
  // Pas de doublon : la fête de la lentille est la foire d'octobre, le Teemeedee la marche sur le feu.
  for (const k of ["fete-de-la-lentille", "teemeedee", "foire-de-bras-panon", "aid-el-fitr"]) assert.ok(!D.fetes.some(f => f.cle === k), k);
  assert.ok(D.foires.some(f => f.cle === "foire-des-lentilles"));
  for (const f of D.fetes) assert.ok(f.ambiance && f.ambiance.length <= 600, `${f.cle} : ambiance`);
  const bp = FOIRES.find(f => f.cle === "foire-de-bras-panon");
  assert.deepEqual([bp.region, bp.mois, bp.recolte], ["est", 5, "nourriture"]);
  assert.ok(RELIGIONS.find(r => r.cle === "hindoue").fetes.includes("pongal"), "un pratiquant y gagne son moral");
  // Le journal des joueurs dit ce qu'on voit, ce qu'on trouve, et la période en mots.
  const journal = doc("guides", "fetes-de-fenoir");
  for (const f of D.fetes) {
    const p = journal.pages.find(x => x.flags?.[MODULE]?.cle === f.cle);
    assert.ok(p.text.content.includes("Ce qu'on voit, ce qu'on trouve"), f.cle);
    assert.ok(sansBalises(p.text.content).includes(`Date : ${f.periode}`), f.cle);
  }
  // Mutations : une fête du socle datée, une fête hors du socle sans date.
  const casse = structuredClone(D);
  delete casse.fetes.find(f => f.cle === "pongal").date;
  assert.ok(verifierDonnees(casse).some(e => /pongal.*sa date/.test(e)));
  const sansAmbiance = structuredClone(D);
  sansAmbiance.fetes[0].ambiance = "";
  assert.ok(verifierDonnees(sansAmbiance).some(e => /ambiance/.test(e)));
  const trou = structuredClone(D);
  trou.affaires.pop();
  trou.affaires[0].numero = 99;
  assert.ok(verifierDonnees(trou).some(e => /numéros de 1 à n/.test(e)));
  const sansArrivee = structuredClone(D);
  sansArrivee.regions[0].arrivee = "";
  assert.ok(verifierDonnees(sansArrivee).some(e => /arrivée/.test(e)));
});

test("l'anglais du lot : affaires, arrivées, fêtes, foire, journaux et tables traduits ; le glossaire tenu", () => {
  const { documents, registre } = fabriquerAnglais(docs, D);
  assert.equal(registre.affaires.length, 23);
  for (const a of registre.affaires) {
    const fr = D.affaires.find(x => x.cle === a.cle);
    assert.deepEqual(a.issues.map(i => [i.cle, i.effets]), fr.issues.map(i => [i.cle, i.effets]), `${a.cle} : la mécanique ne se traduit pas`);
    if (a.cle !== "zerbaz") assert.notEqual(a.titre, fr.titre, a.cle);
    assert.notEqual(a.apprendre, fr.apprendre, a.cle);
    assert.ok(!/\bLivides?\b/.test(JSON.stringify(a)), `${a.cle} : « the Pallid »`);
  }
  assert.equal(registre.affaires.find(a => a.cle === "rendre-a-la-lave").titre, "Giving back to the lava");
  assert.equal(registre.affaires.find(a => a.cle === "la-liste-du-comptable").titre, "The Bookkeeper's list");
  for (const r of registre.regions) assert.ok(r.arrivee && r.arrivee !== D.regions.find(x => x.cle === r.cle).arrivee, r.cle);
  assert.equal(registre.fetes.find(f => f.cle === "pongal").nom, "Pongal, the Tamil harvest");
  assert.equal(registre.fetes.find(f => f.cle === "pongal").date, "01-14", "la date ne se traduit pas");
  assert.equal(registre.foires.find(f => f.cle === "foire-de-bras-panon").nom, "The Bras-Panon fair");
  const en = (pack, cle) => documents.find(x => x.pack === pack && x.doc.flags?.["lakour-fenoir-en"]?.cle === cle)?.doc;
  assert.equal(en("mj", "les-affaires-de-l-ile").name, "The island's affairs");
  assert.equal(en("mj", "mener-une-affaire").name, "Running an affair");
  assert.equal(en("tables", "livides-en-fete").name, "Pallid in holiday dress");
  const page = en("mj", "les-affaires-de-l-ile").pages.find(p => p.flags?.["lakour-fenoir-en"]?.cle === "le-service-dans-la-nuit").text.content;
  assert.match(page, /<em>Zot i fé servis<\/em> \(they're doing their ceremony\)/, "le créole gardé, avec son sens");
  assert.match(page, /Effects: /, "la ponctuation anglaise");
});
