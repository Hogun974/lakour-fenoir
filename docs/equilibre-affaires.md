# Équilibre du lot 12 « Affaires, récits et fêtes » (2026-11-17)

Le lot porte dans Fénoir pour Foundry ce que le jeu 3D a écrit pour raconter l'île sans quêtes : les **affaires**
(`docs/propositions/histoire-et-quetes.md`, §3 et §4), les **récits sans quête** (§2), les **figures** (§6.2), et ce qui manquait aux
**fêtes** (`donnees/fetes/base.json`, `crates/fenoir-regles/src/fetes.rs`). Contrat : `docs/survie-contrat.md`, §17.

Ce fichier donne chaque chiffre et sa raison. Tout se change en un seul endroit :
- les affaires : `modules/lakour-fenoir/contenu/affaires.mjs` ;
- les fêtes : `modules/lakour-fenoir/scripts/fetes.js` ;
- la foire : `contenu/marche.mjs`.

Rien n'est magique, aucune origine ne joue dans les règles, et le jeu ne donne jamais raison à un préjugé.

## 1. Les affaires : ce qui ne se chiffre pas

Une affaire n'est **pas un contrat** : elle n'annonce aucune récompense, et le système ne l'applique pas seul. Le MJ, ou le MJ IA,
applique l'issue qui a eu lieu, avec les outils qui existent déjà : réputation `rep-<faction>`, `acteMoral`, stocks, savoirs, plans,
`feter`, `voeu`. C'est pour cela que le lot n'ajoute **aucune règle nouvelle au système** : une logique de lecture seulement
(`logique/affaires.mjs`), qui dit ce qui peut naître et tire une vérité.

| Repère | Valeur | Pourquoi |
|---|---|---|
| Réputation d'une issue | ±1 à ±3, une faction ou plusieurs | Le même ordre que les appels radio (§9 : +1 à +3). Une grande affaire va jusqu'à ±3 : trahir les Familles au col, détruire le cahier du Comptable. |
| Stocks d'une issue | 2 à 8 par ressource | Moins qu'un appel radio (4 à 10) : on ne fait pas une affaire pour être payé. Les vivres du tunnel (8 nourriture, 4 eau) sont l'exception : c'est tout l'enjeu de la rumeur. |
| Front d'une issue | ±1 cran | Un front a six crans (« L'année du Gris ») : une affaire le pousse ou le retient d'un cran, jamais plus. |
| Acte moral | un acte du §14 (`ACTES_MORAUX`) | La jauge existe ; une issue dit seulement lequel. Qui a choisi le porte, avec ses témoins. |
| Savoir et plan | une clé du registre | « Ce qu'on en garde » est souvent un savoir lontan ou un plan : le rabais déjà en place (−25 % de matériaux, la moitié du travail). Aucun plan n'est exigé. |
| Moral, entente, autorité, renom, visibilité | ±1 ou ±2 | Les échelles du §14 et du §11 sont courtes : un cran compte. |
| Issue sans effet | permise | Si le groupe n'y est pour rien, l'issue change le monde, pas ses stocks. |

## 2. Les vingt-trois affaires

Vérité : les poids de chaque vérité possible (le MJ la tire à la naissance et la garde). Pente : un cran tous les *n* jours, et le
nombre de crans. Issues : leurs effets, dans l'ordre.

| Affaire | Taille | Vérité | Pente | Issues |
|---|---|---|---|---|
| 1. Les lentilles d'octobre | grande affaire | vraie 3/5, périmée 1/5, fausse 1/5 | 7 j × 3 | rép. Familles +2, Coopérative +1, moral +1 / — / rép. Familles −1, rumeur |
| 2. La treille de Grand Îlet | affaire | vraie 4/5, exagérée 1/5 | 10 j × 3 | rép. Familles +2, nourriture +4, savoir / rép. Familles −1 / accueillir, recrue |
| 3. La quarantaine du col | affaire | vraie 1/3, fausse 2/3 | 1 j × 3 | rép. Familles +1 / colporter, rumeur / rép. Familles −1 / rép. Familles −3, rumeur |
| 4. L'îlet où tout va bien | grande affaire | vraie 2/5, exagérée 2/5, piège 1/5 | 14 j × 3 | entente +1 / rép. Familles −1, rumeur / départ / rumeur |
| 5. Le tunnel aux vivres | grande affaire | vraie 1/2, fausse 1/2 | 10 j × 3 | nourriture +8, eau +4, plan / partager, plan / nourriture +8, eau +4, attaquer, rumeur / plan |
| 6. Les aiguilles de Bourg-Murat | affaire | vraie 3/4, exagérée 1/4 | 7 j × 3 | rép. Pèlerins +1, front −1, renom +1 / renom −1, rumeur / front +1 / rép. Pèlerins −1 |
| 7. Les noyés de la passe | affaire | vraie 3/4, exagérée 1/4 | 3 j × 3 | rép. Barques +2 / rép. Barques +2, visibilité +2 / rép. Barques −1 |
| 8. Le vieux chemin pavé | affaire | vraie 3/4, exagérée 1/4 | 2 j × 3 | rép. Dispensaire +2, Garnison −1, aider, route / rép. Garnison +2, Dispensaire −2, carburant +4, trahir / — |
| 9. Le viaduc | grande affaire | vraie 3/4, piège 1/4 | 14 j × 3 | rép. Ferrailleurs +2, pièces +4, carburant +2, route / rép. Ferrailleurs +1, route / horde |
| 10. Une seule lampe | affaire | vraie 1/1 | 3 j × 2 | fête, préjugé / — / entente −1 |
| 11. Le kabar du 20 désanm | affaire | vraie 1/1 | 7 j × 2 | fête / fête / entente −1 |
| 12. Le vœu | affaire | vraie 2/5, périmée 2/5, fausse 1/5 | 10 j × 3 | fête, vœu tenu / vœu rompu / vœu tenu, moral −1 |
| 13. Le jour qu'il est | affaire | vraie 1/2, fausse 1/2 | 4 j × 2 | rép. Familles +1, renom +1 / rumeur / mentir, rumeur |
| 14. Le service dans la nuit | affaire | fausse 1/1 | 3 j × 3 | démentie, préjugé / attaquer, rumeur / rumeur |
| 15. Les derniers arrivés | affaire | fausse 1/1 | 2 j × 3 | aider, démentie, préjugé / accueillir, recrue / exclure / colporter, rumeur |
| 16. Rendre à la lave | grande affaire | vraie 3/4, exagérée 1/4 | 10 j × 3 | rép. Pèlerins +1 / rép. Dispensaire +1, Pèlerins −2, front +1 / rép. Pèlerins −1, aider / rép. Pèlerins −2, rumeur |
| 17. L'alambic du Tévelave | affaire | vraie 3/4, périmée 1/4 | 10 j × 3 | rép. Ferrailleurs +1, savoir / rép. Ferrailleurs −1, savoir / pièces +2 |
| 18. Zerbaz | affaire | vraie 3/4, fausse 1/4 | 14 j × 2 | plantes +3, savoir / — / partager, renom +1 |
| 19. La petite centrale de Langevin | grande affaire | vraie 3/4, périmée 1/4 | 30 j × 2 | pièces +3, plan / pièces +4 / — |
| 20. Celui qu'on a refusé | affaire | vraie 3/4, piège 1/4 | 1 j × 2 | accueillir, recrue / exclure / trahir / accueillir, recrue, autorité −1 |
| 21. La liste du Comptable | grande affaire | vraie 3/4, piège 1/4 | 5 j × 3 | rép. Sans-Lune −2, aider, recrue / rép. Sans-Lune −3, front −1 / rép. Sans-Lune +1 / nourriture +6, carburant +2, attaquer, rumeur |
| 22. Le convoi du lait | grande affaire | vraie 3/4, exagérée 1/4 | 3 j × 3 | rép. Coopérative +2, Dispensaire +2, médicaments +2 / front +1 / rép. Garnison +1, Coopérative +1, Dispensaire +1 |
| 23. Le cargo | front | fausse 2/3, vraie 1/3 | 30 j × 4 | rép. Garnison +2, départ / rép. Garnison −1 / — / — |

**Les raisons des vérités.**
- Les poids du jeu 3D sont gardés quand il en donne : le tunnel est vrai une fois sur deux (affaire 5) ; la liste du Comptable est
  un piège une fois sur quatre (affaire 21).
- Ailleurs, on penche vers le vrai (3 sur 4) : une rumeur toujours fausse lasse vite.
- La quarantaine (affaire 3) penche vers la brûlure (2 sur 3) : le jeu punit plus souvent la dénonciation hâtive que le silence.
- **Une rumeur sur une communauté est toujours fausse** (affaires 14 et 15) : c'est la règle du métissage, pas un tirage.
- Le cargo n'est vrai qu'une fois sur trois, et le MJ garde la main : le fil rouge n'est pas dans ce dépôt.

**Les raisons des pentes.**
- Elles vont vite là où le temps presse vraiment : la quarantaine (un jour), celui qu'on a refusé (un jour), la soignante (deux
  jours), les noyés et le lait (trois jours).
- Elles vont lentement là où le monde attend : la centrale de Langevin, qui suit la saison sèche, et le cargo (trente jours).
- La plupart avancent d'un cran par semaine ou par dizaine de jours : le rythme d'une campagne où l'on joue un jour en une soirée.

## 3. La naissance, et ce que lit l'API

| Quoi | Valeur | Pourquoi |
|---|---|---|
| Fêtes « à venir » | celles du jour de jeu et des **30 jours** qui suivent (`horizon`) | « Dès le début du mois, quelqu'un demande qui sait tendre une peau » : un mois avant le 20 décembre, l'affaire du kabar peut naître. |
| Crans des fronts | horloges du moteur `front-<front>`, ou donnés | La campagne tient déjà ses fronts en horloges ; sans moteur, le MJ les donne. Un front absent du contexte ne filtre pas. |
| Déclencheurs | `refus-a-la-porte`, `date-perdue`, dits par le MJ | Ce qui ne dépend pas du calendrier ne naît que si l'on dit qu'il a eu lieu. |
| Saisons | lentilles en septembre et octobre ; noyés et lait en hiver austral (mai à octobre) ; Langevin en saison sèche (mai à novembre) | La houle australe et les Livides figés par le froid sont de l'hiver ; la ravine de Langevin ne se descend qu'au sec. |
| Phases | la plupart dès l'effondrement ; les grandes affaires au silence et après ; le cargo dès la panique | Au jour zéro, personne n'a le temps d'une affaire ; la radio du Port parle dès les premiers jours. |

## 4. Les fêtes

| Fête | Gain | Coût | Pourquoi |
|---|---|---|---|
| Pongal (13 au 16 janvier, cœur le 14) | +1 moral ; souvenir +1 pendant 4 jours | 1 ration par personne ; 1 quart ; bruit +1 | Quatre jours de moisson : le souvenir dure le temps de la fête. Moins que Noël (2 rations, 7 jours), plus que le 14 juillet (le moral seul). Le quart : le kolam et la cuisson dehors. Le bruit : le cri quand le pot déborde, sans pétards. |
| Fête du miel vert (dernier samedi et dimanche de janvier) | +1 moral ; nourriture +1, médicaments +1 | 1 quart dehors ; lueur +1 un jour | On enfume une ruche ou un essaim sauvage : un peu de nourriture, un peu de soin (le miel sur les petites plaies). C'est moins que les letchis (nourriture +3), parce que le miel soigne aussi. La fumée de l'enfumoir se voit. |

- **D'abord « hors du socle », puis sur demande.** Le moteur ne connaissait ni Pongal ni le miel vert : les deux fêtes ont d'abord
  porté leur propre date. Depuis le moteur 0.49.0, ce sont des fêtes « sur demande » du socle : leur date codée en dur est partie,
  et Fénoir les décline comme le ramadan et l'Aïd (le moteur pose leur décor). Le gain, le coût et les textes ne changent pas.
- **Les dates** (au socle) : Pongal du 13 au 16 janvier, cœur le 14 ; le miel vert le dernier samedi de janvier et le dimanche.
- **Pongal et la religion.** Elle est ajoutée aux fêtes de l'hindouisme tamoul : un pratiquant y gagne 1 de moral de plus, comme
  pour les autres fêtes de sa religion.
- **Pas de doublon.**
  - La fête de la lentille est la foire d'octobre ; le Teemeedee est la marche sur le feu ; l'Aïd el-Fitr est le cœur du ramadan.
  - La foire de Bras-Panon est une **foire**, pas une fête. Elle se tient dans l'Est, en mai, pour trois jours de troc sous trêve.
  - Sa récolte est la **nourriture** : la vanille ne se troque pas en parts, les fruits et les légumes si.
  - Le Salazie voisin a déjà sa foire du chouchou en mai : les deux foires peuvent se suivre, chacune dans sa région.
- **Ce qu'on voit, ce qu'on trouve.** C'est un texte par fête, sans effet de jeu : le décor, les trouvailles, et ce que portent
  certains Livides.
- **Le bruit des fêtes.** Il est déjà dans leur coût, et le lot ne change aucun chiffre existant :
  - le 20 décembre a bruit +4, comme les pétards et le maloya du jeu 3D (palier 4, 270 m) ;
  - la musique a bruit +3 (palier 3, 90 m) ;
  - le Nouvel An chinois a bruit +3, alors que le 3D met ses pétards au palier 4 (voir les points à trancher).

## 5. Les longueurs

- **Le livre de l'île.** Il passe à 13 pages : la page « Les signes des murs » s'ajoute avant « La première nuit ». L'essai qui
  borne sa longueur passe de 45 000 à 47 000 caractères.
- **Les journaux du MJ.**
  - « Les affaires de l'île » a 24 pages : une introduction et une page par affaire.
  - « Mener une affaire » a 12 pages.
- **Les tables.** Dix tables nouvelles :
  - les affaires, 23 lignes ;
  - six supports de récit, de 8 à 10 lignes ;
  - les figures, 9 lignes ;
  - les bruits, 12 lignes ;
  - les Livides en fête, 6 lignes.

## 6. Ce que Jordan peut vouloir changer

1. **Les dates de Pongal et du miel vert.** Elles viennent du jeu 3D, qui les marque « à vérifier ».
2. **Le bruit du Nouvel An chinois** : +3 aujourd'hui. Le 3D met ses pétards au palier 4, comme le maloya du 20 décembre (+4).
3. **Les poids des vérités** qui ne viennent pas du 3D : le 3 sur 4 vers le vrai, le 2 sur 3 vers la brûlure au col.
