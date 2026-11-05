# Équilibre de Fénoir : à décider

Mesures du 2026-11-05 : 440 parties d'un an (11 scénarios × 40 graines, `node essais/outils/parties-longues.mjs --graines 40`),
après les six corrections de la logique. **Remesuré le 2026-11-05** après la correction des trois écarts (effets `abri` des
événements appliqués, stocks plafonnés dès l'installation, tour de guet dans l'assaut) : entre crochets, la mesure d'avant
quand elle a changé. Rien de ce qui suit n'est appliqué : ce sont des propositions.

| Scénario (365 jours) | Vivants à J365 | Fin médiane | Autonomes (jour médian) | Première cause de mort |
|---|---|---|---|---|
| Sédentaire à 4 | 11/40 [13] | J180 [J183] | 18 (J61) [17 (J59)] | soif (pas de source dans la région) |
| Seul, sédentaire | 10/40 [12] | J144 [J88] | 18 (J7) | infection |
| Seul, nomade | 0/40 | J163 [J160] | 2 | infection, faim |
| 2 humains + 2 compagnons | 26/40 [24] | J365 | 29 (J61) [28] | infection |
| 4 humains | 21/40 [26] | J365 | 29 (J45) | soif |
| 2 qui recrutent | 12/40 [17] | J262 [J304] | 21 (J22) | soif |
| 2 sans recruter | 13/40 [14] | J265 | 25 (J59) | infection |
| Nomade à 4 | 0/40 | J163 [J165] | 5 [3] | faim |
| Mixte à 4 | 27/40 [29] | J365 | 17 (J89) [J107] | assaut, soif, infection (5, 4, 3) [infection] |

Ce que coûtent les effets `abri` des événements (fuite de citerne −10 eau, rats −6 nourriture, maladie du potager −4,
sécheresse −5 eau, gel −2, eau trouble −3, pillards −5 ; au moins 2,6 pertes par partie en moyenne) : la même mesure SANS les appliquer
(mais avec les deux autres corrections et le nouveau tirage des événements) donne 159 groupes vivants à J365 sur 440 (base :
157) ; en les appliquant, 141. Les pertes de stocks retirent donc environ 18 survies sur 440 (−4 points), surtout aux
sédentaires et enracinés qui vivent au plus juste (4 humains −4, recrues −4) ; la tour de guet et les plafonds ne changent
rien de visible. Le simulateur rapide (`simuler-parties.mjs --rapide`, 320 parties de 200 jours) reste dans les bornes de
`essais/survie-equilibre.test.mjs` : enraciné à 4, 16/20 vivants à J200, 13/20 autonomes (J62), 4,25 assauts par mois
après J30 dont 2,39 sérieux, 0,45 brèche par partie [0,8] ; nomade à 4, 1/20 vivants, fin médiane J171 [J168] ; solo
enraciné 14/20 [13/20] ; après J90, Hauts 3,24 assauts par mois, Bas 2,09 [3,09 et 2,24]. Piste si c'est trop dur :
réduire les `stocks` des événements `abri` du contenu, ou leur `poids`, plutôt que la règle.

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

Écarts relevés par les parties longues :
- corrigés le 2026-11-05 (contrat §1.6, §1.7, §2.6, §3.2) : les effets `abri` des événements du contenu s'appliquent à
  l'abri où vit le groupe (stocks perdus et dégâts par la logique, moral, blessures et trouvailles au MJ, à raconter) ; les
  stocks sont plafonnés dès l'installation ; le bonus de vigilance de la tour de guet (et des chiens dressés) compte dans un
  assaut ;
- non corrigé : la table lunaire du moteur s'arrête en 2036 : après mi-2036, Cavadee, Nouvel An chinois et Dipavali ne
  tombent plus.
