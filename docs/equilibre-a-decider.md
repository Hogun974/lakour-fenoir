# Équilibre de Fénoir : à décider

Mesures du 2026-11-05 : 440 parties d'un an (11 scénarios × 40 graines, `node essais/outils/parties-longues.mjs --graines 40`),
après les six corrections de la logique. Rien de ce qui suit n'est appliqué : ce sont des propositions.

| Scénario (365 jours) | Vivants à J365 | Fin médiane | Autonomes (jour médian) | Première cause de mort |
|---|---|---|---|---|
| Sédentaire à 4 | 13/40 | J183 | 17 (J59) | soif (pas de source dans la région) |
| Seul, sédentaire | 12/40 | J88 | 18 (J7) | infection |
| Seul, nomade | 0/40 | J160 | 2 | infection, faim |
| 2 humains + 2 compagnons | 24/40 | J365 | 28 (J61) | infection |
| 4 humains | 26/40 | J365 | 29 (J45) | soif |
| 2 qui recrutent | 17/40 | J304 | 21 (J22) | soif |
| 2 sans recruter | 14/40 | J265 | 25 (J59) | infection |
| Nomade à 4 | 0/40 | J165 | 3 | faim |
| Mixte à 4 | 29/40 | J365 | 17 (J107) | infection |

1. **Le mixte domine, le nomade pur ne tient jamais un an.** Même avec un pillage divisé par 4 après J60, sa fin médiane
   ne passe que de J169 à J228. Piste : une ressource qui se renouvelle pour qui bouge (cueillette, pêche, glanage).
2. **Moins d'assauts** depuis que les événements météo des régions arrivent (ils prennent la place d'autres événements) :
   l'enraciné à 4 passe de 5,0 à 3,9 assauts par mois. Remonter `evenementContenu` de 0,25 à 0,35 le ramène à 4,45
   (2,84 sérieux).
3. **Les factions s'éteignent toutes entre J600 et J720** : la deuxième année, plus de bande ni de visite. Pistes : ne les
   faire décliner que si la nature de la région est épuisée elle aussi, ou un plancher de 0,5 dans leurs régions de départ.
4. **Les recrues comblent mal certains manques** : une recrue venue pour une compétence manquante en a au moins 2 dans 67 %
   des cas pour la survie, mais 21 % pour la vigilance, 16 % pour la discrétion, 29 % pour les soins. Pistes : poids
   « manquant » de 3 à 6, ou un niveau 2 garanti dans une compétence manquante une fois sur deux.
5. **Le budget de départ ne sert qu'à relever** : un joueur fait presque toujours 10 (12 au plus), le plafond de 16 n'est
   jamais atteint. Compagnons et recrues font 9,2 en moyenne (7 au moins).
6. **L'infection tue d'abord les survivants seuls** (18 à 19 morts sur 40) : le test de soins extrême laisse 0 à 11 % de
   chances. Piste : « difficile » avec un médicament ou une infirmerie.

Écarts relevés, non corrigés :
- les effets `abri` des événements du contenu (fuite de citerne −10 eau, rats −6 nourriture, moral, blessures,
  découvertes) ne sont pas appliqués : à quel abri s'appliquent-ils ?
- le jour de l'installation, les stocks peuvent dépasser le plafond (ramenés le lendemain) ;
- le bonus de vigilance de la tour de guet ne compte pas dans un assaut ;
- la table lunaire du moteur s'arrête en 2036 : après mi-2036, Cavadee, Nouvel An chinois et Dipavali ne tombent plus.
