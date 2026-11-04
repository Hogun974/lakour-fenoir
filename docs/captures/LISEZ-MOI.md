# Captures d'écran du README

Le README (`README.md`, `README.en.md`) et les manifestes (`media` de `system.json` et de `module.json`) attendent ces
fichiers PNG, à déposer ici. Tant qu'ils manquent, les images du README sont cassées et les captures du catalogue Foundry
aussi (la couverture, elle, existe déjà : `modules/lakour-fenoir/assets/monde/fond.jpg`).

Conseils communs : Foundry en français, fenêtre d'environ 1600 × 900 (ou plus, le README réduit), interface sombre par
défaut, **aucun vrai nom de joueur** (comptes et survivants tirés au générateur : prénoms créoles de la table), **aucune clé
d'API visible**, aucune adresse de serveur dans la barre d'adresse (recadrer). Une partie au jour 10 ou 12, avec trois ou
quatre survivants, un abri installé et deux ou trois chantiers, rend mieux qu'un jour zéro vide.

| Fichier | Contenu | Comment l'obtenir |
|---|---|---|
| `accueil.png` | L'**écran d'accueil** du monde : le fond (La Réunion, le soir du jour zéro), le titre, la description. | Page de connexion du monde `la-kour-fenoir` (ou d'un monde Fénoir), avant d'entrer. Cadrer sans la barre d'adresse. |
| `carte-de-l-ile.png` | La **carte de La Réunion** : seize régions, routes et sentiers, les épingles des régions, le repère du groupe. | Scène « Carte de La Réunion » (installée par le module), zoom arrière pour voir toute l'île ; de préférence avec la pluie sur la carte (effets visuels) et le bandeau en haut. |
| `fiche-de-survivant.png` | La **fiche de survivant** : les dix compétences avec les flammes de passion, l'état (blessures, fatigue, moral, faim, soif, infection), traits et incapacités, enfance et passé, équipement, savoirs, tâche du jour. | Un prétiré ou un survivant tiré au générateur, au jour 10 : un peu de fatigue, une marque ou deux, une blessure légère. Capturer la seule fenêtre. |
| `creation.png` | La fenêtre **Créer un survivant** : tirage, verrous, relance, budget, aperçu de l'histoire, traits avec infobulles. | Bouton de la barre des acteurs (ou premier chargement d'un joueur sans personnage, réglage « Création ouverte »). Verrouiller un ou deux éléments avant de capturer, pour montrer les cadenas. |
| `abri.png` | La **fiche d'abri** : stocks et jours de stocks, production, autonomie, défense, discrétion, visibilité, capacité, installations et chantiers, alentours, qui fait quoi. | Un abri installé (une ferme des Hauts, une case créole) avec citerne, potager et un chantier en cours. |
| `tableau-de-bord.png` | Le **tableau de bord du groupe** : la grille membres × tâches, les besoins (couvert, faible, manquant), les renseignements datés et la carte connue de l'île, le journal, les propositions des joueurs. | Depuis un compte de **joueur** (la vue du MJ montre le réel). Après une exploration et un appel radio, pour avoir des renseignements de sources différentes. |
| `fenetre-du-mj.png` | La **fenêtre du MJ** : démarrer, avancer le temps, faire agir le groupe, assauts, recrues, fêtes, menaces du jour à résoudre, le monde réel (hordes, infestation, réserves). | Compte MJ, partie démarrée depuis dix jours, au moins une menace du jour et une horde proche. Ne rien montrer qu'un joueur ne doive pas voir ailleurs sur l'écran. |
| `atelier.png` | L'**atelier** : les recettes possibles avec leur coût, et celles qui ne le sont pas avec la raison (savoir, matériaux, outil, installation). | Avec un atelier de niveau 1 et quelques matériaux et pièces en stock. |
| `bandeau.png` | Le **bandeau de survie** en haut de l'écran : jour, moment, date, météo, phase, stocks en jours, alertes. | Capture large mais basse (1600 × 200 environ) centrée sur le bandeau, pendant une alerte (cyclone en approche, eau pour deux jours). |
| `livre-de-l-ile.png` | Le **livre de l'île** ouvert : la table des matières et une page (« Les Livides : ce qu'on croit savoir » ou « Le jour zéro »). | Journaux › « Fénoir — Le livre de l'île », chez un joueur. |
| `fete.png` | Un **journal de fête** : l'illustration en tête, ce que la fête devient dans le monde d'après, la règle (1 moral contre une ration). | Journaux › « Les fêtes de Fénoir », page « Noël sous les flamboyants » ou « Le 20 décembre, fête de la liberté ». |
| `mj-ia.png` | Le **MJ IA** en séance avec le **fournisseur factice** : une narration dans le chat, l'outil `survie_etat` ou `survie_avancer` appelé, une réplique de compagnon IA, la console du MJ IA sans clé. | Séance démarrée avec le fournisseur factice (aucun coût, aucune clé) ; masquer le champ de clé s'il est visible. |

Format : PNG, 1200 à 1920 px de large, moins de 1 Mo chacun si possible (`pngquant` ou l'export de l'outil de capture).
`carte-de-l-ile`, `fiche-de-survivant`, `abri`, `tableau-de-bord`, `livre-de-l-ile` et `fete` servent aussi dans les
manifestes (`system.json`, `module.json`, champ `media`) : les garder sous ces noms exacts. Le bandeau du README utilise
`carte-de-l-ile`, `tableau-de-bord`, `fiche-de-survivant`, `abri` et `livre-de-l-ile`.
