# Équilibre de la vague 3 : la fusion des lots 5 à 9, mesurée contre `vague2`

La branche `vague3` réunit les lots ateliers (§24), fouille (§25), bâtir (§26), vivant (§27) et paradis (§28), retire leurs doublons
et les branche entre eux (§29). **Aucun chiffre d'équilibre n'est retouché ici** : ce fichier mesure ce que la fusion fait aux
parties simulées, pour la passe d'équilibrage qui suit. Les chiffres de chaque lot et leurs raisons restent dans leur fichier
(`equilibre-ateliers.md`, `equilibre-fouille.md`, `equilibre-batir.md`, `equilibre-vivant.md`, `equilibre-paradis.md`).

## Comment c'est mesuré

Même code de mesure des deux côtés, chacun avec son propre simulateur (celui de `vague2`, celui de `vague3` qui joue les cinq lots) :

- `node essais/outils/simuler-parties.mjs --parties 300 --graine 1`, puis `--graine 2` : 16 cas (4 stratégies × 1, 2, 4, 6
  membres), 300 parties par cas, 200 jours ;
- `node essais/outils/parties-longues.mjs --graines 20` : un an (365 jours), 20 graines par scénario ; `vague3` a deux scénarios de
  plus (`rallumer-4`, `sans-rondes-4`, lot 9).

`vague2` : commit 98790e2. `vague3` : la fusion et ses jointures (commit des jointures, avant ce fichier).

## Ce que la fusion change au jeu simulé (en plus des cinq lots)

- **Le curage** des bassins et des bacs passe par l'entretien du lot 7 : un éleveur (ou un cultivateur) donne un quart de soin par
  jour, partagé entre les installations de sa tâche ; dans le lot 8, un seul éleveur curait tout, chaque jour. L'enraciné bâtit le
  bassin à tilapias, l'aquaponie et les bacs de culture.
- **Les bêtes trouvées** ont la viande de leur espèce (le porcelet 4 → 10, le veau moka 10 → 20) ; le simulateur ne les prend pas.
- **Démonter** lit le matériau (le bambou ¼, la pierre ¾) ; l'enraciné du lot 5 démonte des cases et des remises (lieux, pas des
  installations : sans effet), et pas ses installations.
- **Les haies** du lot 9 cachent à mesure qu'elles poussent (le lot 7 les effaçait jusqu'au dernier jour) ; le simulateur n'en bâtit pas.
- **L'aquaponie** est en parpaing (cyclone 0,05 au lieu de 0,5) ; les autres installations que bâtit l'enraciné gardent leur matière.
- **Les bêtes mortes** d'un enclos s'ajoutent aux corps de l'abri (odeur, souillure) ; **un agglutiné** tue au plus une bête d'enclos
  par jour.
- **La salle verte** compte à la fête (le simulateur ne la bâtit pas) ; **les rencontres en fouille** gardent le facteur de rallumage
  (seulement le scénario `rallumer-4`).
- **Essais** : le marché tire son survivant d'une graine ; l'essai des remèdes compte douze graines par région (quatre donnaient 18 à
  37 % de jours avec un médicament selon les lots fusionnés ; douze : 29 %).

## Les mesures

#### Graine 1 (300 parties par cas) : vague2 → vague3

| Cas | Médiane | Vivants à J200 | Autonomes | Installations | Faim | Soif | Brèche/assaut | Rencontre | Infection | Maladie | Départ |
|---|---|---|---|---|---|---|---|---|---|---|---|
| passif × 1 | 28 | 13 % → 9 % | 37 | 0 | 41 % → 43 % | 35 % → 36 % | 1 % → 0 % | 0 % | 3 % | 7 % → 8 % | 0 % |
| passif × 2 | 22 → 23 | 13 % → 9 % | 31 → 32 | 0 | 45 % → 49 % | 37 % → 36 % | 1 % | 0 % | 2 % | 2 % → 4 % | 0 % |
| passif × 4 | 18 | 12 % → 9 % | 28 → 30 | 0 | 43 % → 45 % | 38 % → 39 % | 1 % | 0 % | 2 % → 1 % | 4 % | 0 % |
| passif × 6 | 15 → 14 | 11 % → 8 % | 21 → 18 | 0 | 34 % → 36 % | 52 % → 54 % | 0 % | 0 % | 1 % → 0 % | 2 % → 1 % | 0 % |
| nomade × 1 | 200 | 56 % → 57 % | 1 → 0 | 0 | 1 % | 0 % | 6 % → 5 % | 5 % | 29 % → 28 % | 3 % | 1 % |
| nomade × 2 | 200 | 72 % → 75 % | 1 → 0 | 0 | 3 % → 4 % | 0 % | 3 % → 2 % | 3 % | 13 % → 11 % | 3 % | 4 % |
| nomade × 4 | 200 | 78 % → 84 % | 3 | 0 | 6 % → 3 % | 1 % | 2 % → 1 % | 2 % → 0 % | 5 % → 3 % | 3 % → 4 % | 3 % → 4 % |
| nomade × 6 | 200 | 82 % → 81 % | 1 → 2 | 0 | 5 % → 6 % | 3 % → 1 % | 1 % | 1 % → 0 % | 3 % → 1 % | 3 % → 4 % | 2 % → 5 % |
| enracine × 1 | 200 | 55 % → 57 % | 70 → 79 | 9.5 → 12.1 | 1 % | 12 % → 8 % | 9 % → 11 % | 5 % → 3 % | 15 % → 17 % | 2 % → 3 % | 1 % |
| enracine × 2 | 200 | 78 % → 73 % | 54 → 58 | 7.8 → 10.2 | 0 % | 7 % → 9 % | 3 % → 2 % | 2 % → 1 % | 7 % → 11 % | 2 % | 1 % |
| enracine × 4 | 200 | 88 % → 83 % | 72 | 17.2 → 21.2 | 0 % → 1 % | 5 % → 7 % | 1 % → 3 % | 0 % → 1 % | 4 % | 1 % | 0 % |
| enracine × 6 | 200 | 84 % | 73 → 68 | 22 → 24.4 | 1 % | 6 % → 4 % | 1 % → 3 % | 1 % | 4 % → 5 % | 2 % | 1 % |
| mixte × 1 | 200 | 58 % → 59 % | 19 → 27 | 1.9 → 3.1 | 1 % → 0 % | 4 % | 3 % → 4 % | 5 % | 28 % → 27 % | 1 % | 0 % → 1 % |
| mixte × 2 | 200 | 74 % → 78 % | 18 → 28 | 2.8 → 4.5 | 2 % → 1 % | 7 % → 5 % | 3 % → 2 % | 3 % → 2 % | 8 % | 2 % | 2 % → 3 % |
| mixte × 4 | 200 | 84 % → 83 % | 37 → 39 | 8.8 → 11.6 | 1 % | 4 % | 1 % | 0 % → 1 % | 5 % → 6 % | 2 % → 1 % | 2 % |
| mixte × 6 | 200 | 86 % → 83 % | 46 → 48 | 14.5 → 16.9 | 1 % | 2 % → 3 % | 2 % → 1 % | 1 % → 0 % | 5 % → 6 % | 1 % → 2 % | 2 % → 3 % |

#### Graine 2 (300 parties par cas) : vague2 → vague3

| Cas | Médiane | Vivants à J200 | Autonomes | Installations | Faim | Soif | Brèche/assaut | Rencontre | Infection | Maladie | Départ |
|---|---|---|---|---|---|---|---|---|---|---|---|
| passif × 1 | 31 → 30 | 15 % → 11 % | 36 | 0 | 40 % → 41 % | 35 % | 0 % | 0 % | 2 % → 3 % | 7 % → 9 % | 1 % |
| passif × 2 | 22 → 24 | 14 % → 12 % | 34 | 0 | 46 % → 47 % | 35 % → 34 % | 1 % → 2 % | 0 % | 1 % | 2 % → 3 % | 0 % |
| passif × 4 | 18 | 13 % → 11 % | 29 | 0 | 45 % → 47 % | 38 % → 36 % | 1 % | 0 % | 1 % → 2 % | 2 % | 0 % → 1 % |
| passif × 6 | 15 → 14 | 11 % → 5 % | 22 → 18 | 0 | 37 % → 39 % | 49 % → 52 % | 1 % | 0 % | 1 % | 1 % → 2 % | 0 % |
| nomade × 1 | 200 | 56 % → 54 % | 2 → 1 | 0 | 1 % | 0 % | 4 % → 5 % | 7 % → 5 % | 30 % → 31 % | 1 % | 2 % → 3 % |
| nomade × 2 | 200 | 74 % | 1 → 2 | 0 | 3 % | 0 % | 2 % → 3 % | 3 % | 10 % | 4 % | 4 % |
| nomade × 4 | 200 | 85 % → 81 % | 4 → 2 | 0 | 4 % → 6 % | 1 % → 0 % | 1 % | 1 % → 2 % | 5 % → 4 % | 2 % | 2 % → 4 % |
| nomade × 6 | 200 | 80 % | 1 → 0 | 0 | 6 % → 10 % | 2 % → 1 % | 1 % → 2 % | 0 % | 1 % → 2 % | 3 % | 6 % → 2 % |
| enracine × 1 | 200 | 54 % → 60 % | 67 → 76 | 9.4 → 12.3 | 1 % | 8 % | 11 % → 10 % | 3 % → 1 % | 19 % → 16 % | 4 % → 3 % | 1 % |
| enracine × 2 | 200 | 74 % | 51 → 53 | 7.5 → 9.7 | 1 % | 10 % → 7 % | 3 % → 2 % | 3 % → 2 % | 7 % → 9 % | 2 % → 3 % | 0 % |
| enracine × 4 | 200 | 84 % → 83 % | 74 → 71 | 17.1 → 20.7 | 0 % → 1 % | 6 % → 8 % | 1 % | 1 % | 6 % → 4 % | 1 % | 1 % |
| enracine × 6 | 200 | 87 % → 84 % | 72 → 67 | 21.6 → 23.8 | 1 % | 3 % → 6 % | 2 % → 1 % | 1 % | 5 % → 3 % | 1 % → 3 % | 1 % |
| mixte × 1 | 200 | 57 % → 59 % | 14 → 36 | 2 → 3.7 | 0 % | 2 % → 4 % | 3 % → 4 % | 5 % | 30 % → 25 % | 3 % → 2 % | 0 % → 1 % |
| mixte × 2 | 200 | 76 % → 78 % | 21 → 28 | 2.9 → 4.3 | 1 % | 5 % | 4 % | 2 % | 10 % → 8 % | 2 % | 0 % |
| mixte × 4 | 200 | 86 % → 83 % | 37 → 42 | 9.2 → 12 | 1 % | 4 % | 0 % → 2 % | 2 % → 1 % | 5 % → 6 % | 1 % → 2 % | 1 % → 2 % |
| mixte × 6 | 200 | 86 % → 84 % | 46 → 41 | 15.1 → 17 | 1 % | 4 % | 2 % → 1 % | 1 % → 2 % | 3 % → 2 % | 2 % → 4 % | 1 % → 2 % |

#### Un an (365 jours, 20 graines par scénario) : vague2 → vague3

| Scénario | Médiane | Vivants à la fin | Autonomes (jour médian) | Installations | Brèches | Jours sans nourriture | Jours sans eau |
|---|---|---|---|---|---|---|---|
| sedentaire-4 | 248 → 133 | 8/20 → 6/20 | 7 (J68) → 7 (J57) | 11 → 11.6 | 2.15 → 2.9 | 78.9 → 67.4 | 3.5 → 2.4 |
| sedentaire-2 | 183 → 188 | 6/20 → 7/20 | 7 (J12) → 10 (J19) | 5.9 → 7.7 | 2.3 → 2.65 | 76.1 → 45.1 | 1.1 |
| seul-enracine | 201 → 209 | 4/20 | 11 (J8) → 14 (J12) | 7.9 → 10.4 | 1.4 → 1.5 | 40.7 → 20.1 | 1.2 → 0.9 |
| seul-sedentaire | 295 → 186 | 6/20 → 2/20 | 8 (J9) → 9 (J12) | 7 → 9.5 | 3.15 → 2.45 | 70.9 → 47.1 | 0.4 → 1 |
| seul-nomade | 365 | 11/20 | 0 (J—) | 0 | 1.45 → 1.6 | 97.4 → 121.8 | 0.5 → 0.3 |
| compagnons | 365 | 14/20 → 10/20 | 12 (J66) → 15 (J68) | 15.4 → 20.3 | 2.6 → 2.85 | 56.6 → 57.6 | 0.5 → 1.2 |
| humains-4 | 365 → 274 | 13/20 → 9/20 | 13 (J50) → 17 (J66) | 13.9 → 18.6 | 3.45 → 2.65 | 74.3 → 17.1 | 0.8 → 0.6 |
| recrues | 365 → 303 | 10/20 → 8/20 | 7 (J20) → 11 (J66) | 12.3 → 15.5 | 1.65 → 1.4 | 117.8 → 46.3 | 1.4 → 1.1 |
| sans-recrues | 365 → 317 | 11/20 → 9/20 | 12 (J35) → 9 (J12) | 7 → 10.3 | 1.7 → 1.85 | 72.3 → 48.9 | 1.4 → 1.3 |
| nomade-4 | 365 → 293 | 10/20 → 9/20 | 1 (J72) | 0 | 2.7 → 1.8 | 111.9 → 111.8 | 0.6 → 0.3 |
| mixte-4 | 365 | 11/20 → 16/20 | 9 (J120) → 12 (J120) | 9.7 → 17.7 | 2.05 → 2.1 | 110.5 → 58.6 | 1 → 0.4 |
| rallumer-4 | — → 365 | — → 12/20 | — → 14 (J54) | — → 18.4 | — → 2.3 | — → 66 | — → 1.1 |
| sans-rondes-4 | — → 365 | — → 10/20 | — → 14 (J74) | — → 21.5 | — → 2.4 | — → 54.7 | — → 1.1 |

## Ce qu'il faut retenir (pour la passe d'équilibrage)

Les écarts sont ceux des cinq lots ensemble et de leurs jointures ; ils ne sont pas séparés lot par lot (chaque lot a mesuré le sien
sur `vague2`). À 300 parties, un écart de 3 points de « vivants » est du bruit ; à 20 graines, un écart de 2 ou 3 parties aussi.

- **Sur 200 jours, la survie tient** (± 5 points pour le nomade, l'enraciné et le mixte, les deux graines). L'enraciné bâtit plus
  (+2,2 à +4 installations) et s'enracine plus souvent seul (× 1 : 70 → 79 % et 67 → 76 % d'autonomes) ; le **mixte** devient bien
  plus souvent autonome (× 1 : 19 → 27 % et 14 → 36 % ; × 2 : 18 → 28 et 21 → 28 %) : la fouille des lieux nourrit sa phase nomade.
- **Le passif** perd 2 à 6 points de vivants à J200 (13 → 9 %, 11 → 5 % pour × 6 à la graine 2), surtout par la faim : il ne fouille
  pas, et le lot 9 fait monter la chaleur de son abri.
- **Sur un an, les groupes qui restent sur place meurent plus** : sédentaire × 4 médiane 248 → 133 (8 → 6 vivants sur 20), seul
  sédentaire 295 → 186 (6 → 2), humains × 4 365 → 274 (13 → 9), compagnons 14 → 10 vivants, recrues et sans recrues −2. Ils ont
  pourtant bien moins de jours sans nourriture (humains × 4 : 74 → 17 ; recrues 118 → 46) : ce qui les tue est l'infection, la soif
  et les assauts, à mesure que la chaleur du lieu (lot 9) monte et que les installations demandent leur entretien (lot 7). Le **mixte
  × 4** au contraire gagne (11 → 16 vivants, 17,7 installations). **À regarder en premier.**
- **Le nomade × 4** sur un an perd sa médiane (365 → 293) à vivants presque égaux (10 → 9) ; ses brèches baissent (2,7 → 1,8).
- **Aucune anomalie** dans les parties longues (ni valeur impossible, ni chantier bloqué, ni impasse), des deux côtés.
- **Les nouveaux scénarios** du lot 9 : `rallumer-4` 12 vivants sur 20, 8 régions rallumées (jour médian 88), 0,95 convoi attiré par
  partie ; `sans-rondes-4` 10 vivants, chaleur du lieu jusqu'à 6,6 (3,9 avec les rondes).
