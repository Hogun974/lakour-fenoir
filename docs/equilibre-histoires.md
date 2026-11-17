# Équilibre du lot 11 « Les histoires des survivants » (2026-11-17)

Portage des phrases d'histoire de Fénoir 3D (`donnees/histoires/enfances.json`, `passes.json`, `autres.json`, `genres.json` ;
règles du 3D : `crates/fenoir-regles/src/histoires.rs`). La règle est dans le contrat (`docs/survie-contrat.md` §16), le contenu
dans `modules/lakour-fenoir/contenu/histoires.mjs`, le tirage dans `systems/lakour-survie/logique/histoires.mjs`. Aucun chiffre
de ce lot ne touche aux règles : ce sont des phrases, sans dé ni moral.

## 1. Les nombres

| Nombre | Valeur | Raison |
|---|---|---|
| Phrases portées | 440 (438 du 3D, 2 écrites pour FVTT) | tout ce que le 3D a écrit ; le servis kabaré n'avait pas de phrases |
| Par enfance | 8 à 11 (24 enfances) | contre 2 auparavant ; 3 ou 4 lieux par enfance, pour que deux enfants du même cirque ne se ressemblent pas |
| Par passé | 7 ou 8 (17 passés) | 2 ou 3 phrases de métier selon l'âge (l'étudiante sur le tard, le marin à la retraite) |
| Traits, religions, regards, générations | 1 par trait (32), 2 par religion (8), 2 par regard (3), 18 générations | comme le 3D ; une génération ne dépend que de l'âge |
| Phrases par histoire | 3 à 5 : 2 de l'enfance, 2 du passé, et 65 fois sur 100 une de plus | celles du 3D : assez pour un portrait, pas un roman. Mesuré sur 5 000 tirages : 4 phrases 35 %, 5 phrases 65 % |
| Longueur | 150 caractères par phrase, 520 par histoire (on retire par la fin, jamais sous 3) | la place de l'aperçu de la fenêtre de création. Mesuré : 387 caractères en moyenne en français (506 au plus), 366 en anglais (501) ; la borne n'a jamais coupé |
| La phrase de plus | tirée parmi celles des traits, de la foi, du regard et de la génération, à égalité | mesuré sur 3 227 phrases de plus : génération 44 %, regard 20 %, foi 19 %, trait 17 %. Les générations sont nombreuses (3 à 10 selon l'âge) ; c'est le choix du 3D, gardé tel quel |
| Variété | les 440 phrases sortent en 5 000 tirages | aucune n'est inatteignable |

## 2. Ce qui garde une histoire cohérente

- **Les sujets** : jamais deux phrases du même sujet (un seul lieu, un seul métier, une seule école…).
- **« Né ailleurs »** : dans le 3D, seules quelques phrases des enfances d'ailleurs portaient la marque. Dans FVTT, une enfance
  d'origine « ailleurs » (zoreil, Mayotte, Madagascar, Maurice, enfant de militaire, enfance sur un bateau) porte toujours la
  marque, quelle que soit la phrase tirée : un survivant qui a grandi à Maurice ne « se souvient » jamais des coupures d'eau de
  la saison sèche ni de l'île d'avant les quatre-voies. C'est de la biographie, pas un destin : la phrase n'a aucun effet.
- **La foi suit l'esprit, jamais l'enfance** (le §14 tire la religion à part ; une enfance la rend seulement plus probable) :
  - une phrase de religion n'est dite que de sa religion (ou de l'une des siennes, s'il en a « plusieurs ») ;
  - sept phrases disent une pratique d'aujourd'hui (les cinq prières, les versets du matin, l'encens du premier et du quinze, le
    silence du matin, la fleur posée, le temple le vendredi, le petit verre pour les anciens) : seulement pour un pratiquant ;
  - le front cendré de l'enfance tamoule (« un point de cendre au front les jours qui comptent ») demande la foi hindoue : un
    enfant de Saint-André devenu sans religion, ou musulman, ne le porte pas ;
  - une fiche d'avant ce lot, dont l'esprit n'est pas tiré, n'a ni phrase de foi ni phrase de regard.
- **« Plusieurs »** : la Vierge et Mariamen sur la même étagère, le temple le vendredi et la messe le dimanche, seulement pour qui
  est à la fois catholique et hindou ; un catholique qui va aussi au temple chinois reçoit les phrases de chacune de ses deux
  religions, pas celles-là.

## 3. Les religions du 3D vers celles de FVTT

La liste commune est l'affaire du lot 10. En attendant, chaque groupe donne la clé de FVTT puis celle du 3D, et le tirage prend
l'une ou l'autre :

| 3D | FVTT | Pourquoi |
|---|---|---|
| catholique | catholique | la même |
| hindoue | hindouisme tamoul | la même |
| hindoue catholique | plusieurs (catholique ET hindouisme tamoul) | FVTT dit « plusieurs à la fois » |
| musulmane | islam | la même |
| protestante | Église évangélique | « l'assemblée du dimanche », la Bible du matin : les deux disent l'évangélique de l'île |
| bouddhiste | culte des ancêtres et temple chinois | l'encens du premier et du quinze du mois lunaire, le silence du matin |
| aucune | aucune | la même |
| — | servis kabaré | deux phrases écrites pour FVTT, dans le ton de sa description (le rhum posé pour les anciens, les noms des morts dits à voix haute) |

## 4. Les changements du texte

- « Grand-Îlet » devient « Grand Îlet », comme partout ailleurs dans FVTT.
- **Guide du métissage** : la phrase de l'enfance yab « Elle a la peau qui rougit, les yeux clairs, et un nom que la moitié de
  l'île porte aussi » disait l'apparence d'après l'origine ; elle devient « Elle porte un nom que la moitié de l'île porte aussi,
  des Hauts jusqu'à la mer ». Un enfant des Hauts de l'Ouest peut être métis de toutes les nuances, et son jeton vient de son
  passé.
- Les préjugés restent dans la bouche des gens et les faits les démentent : « On disait que la boutique ne faisait crédit qu'aux
  siens ; elle l'a vue nourrir la rue tout un mois de cyclone », « On dit sa famille dure en affaires… », « Au lycée, on
  l'appelait yab kouyon… », « Certains avaient peur du service… », « On dit les gens des Hauts têtus… ». Aucune phrase ne les
  prend à son compte.
- Anglais : les guillemets « » deviennent "…" ; trois mots créoles reçoivent leur sens (pilao, spiced rice ; dholl puri
  flatbreads ; tan rouge, a native tree) ; les autres l'avaient déjà dans le 3D (voulé, nénène, tatie, yab kouyon, lontan,
  20 désanm, cachalot).

## 5. Ce qui n'est pas porté

- **`genres.json`** (l'autre genre des deux anciennes phrases de 22 enfances) : les phrases accordées `{Elle|Il}` le font déjà
  pour toutes, et reprennent la quasi-totalité de ces anciennes phrases. Les deux anciennes phrases de chaque enfance et de
  chaque passé restent dans le registre, inchangées, pour un contenu sans histoires et pour un survivant sans genre.
- **Le hasard du 3D** (`Hasard::deriver`) : FVTT a le sien (`deriverHasard`, SHA-256). La même fiche donne donc une histoire
  différente dans les deux jeux, mais toujours la même dans FVTT.
- **Les ancrages** (photo, carnet, routine, sport, instrument, pied de piment) : propres à FVTT, sans phrases dans le 3D. Un
  non-croyant tire les phrases de « aucune ».
