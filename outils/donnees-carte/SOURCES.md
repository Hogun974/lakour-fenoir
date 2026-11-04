# Données de la carte de La Réunion

Fichiers lus par `outils/fabriquer-carte.mjs` pour dessiner `modules/lakour-fenoir/assets/cartes/reunion.webp`.
Ils se reconstruisent avec `node outils/fabriquer-carte.mjs --telecharger` (sources publiques, sans compte).

| Fichier | Contenu | Source | Licence |
|---|---|---|---|
| `contour-974.geojson` | Contour de l'île (département 974), tel quel | IGN Admin Express COG 2018, simplifié par le dépôt [france-geojson](https://github.com/gregoiredavid/france-geojson) (Grégoire David) | [Licence ouverte Etalab](https://www.etalab.gouv.fr/licence-ouverte-open-licence) : mention « IGN — Admin Express » |
| `relief-974.bin.gz` | Altitudes et profondeurs en mètres, grille 1000 × 750 (une maille = 4 px de carte ≈ 87 m), entiers 16 bits petit-boutistes compressés gzip, déjà dans la projection de la carte | [Terrain Tiles](https://registry.opendata.aws/terrain-tiles/) (Mapzen / Tilezen, AWS Open Data), format Terrarium, zoom 11 ; sources sous-jacentes : SRTM (NASA), ETOPO1 (NOAA), GMTED2010 (USGS) | Données publiques ; attribution demandée : voir [l'attribution de Tilezen](https://github.com/tilezen/joerd/blob/master/docs/attribution.md) |
| `routes-osm.json` | Routes nationales et principales, départementales retenues (RN5, RD48, RD3, RD41), routes forestières (RF5, RF51…), sentiers GR R1, R2, R3 et sentiers nommés du contenu (canalisation des Orangers, Roche-Plate, Bélouve…), simplifiés (Douglas-Peucker ≈ 9 m), en longitude, latitude | [OpenStreetMap](https://www.openstreetmap.org) via l'API Overpass | [ODbL](https://opendatacommons.org/licenses/odbl/) : « © les contributeurs d'OpenStreetMap » |

Projection : celle des repères des régions (`contenu/regions.mjs`, `repere()`), équirectangulaire, 1 km ≈ 46 px,
55,216 E → x 528, 20,87 S → y 166, nord en haut.

Corrections faites au dessin (pas dans les fichiers) : pics isolés du relief écrasés par une médiane 3 × 3, et trou des tuiles
sur les coulées récentes du Grand Brûlé bouché par diffusion entre la côte et le relief connu. Le contour de l'Enclos Fouqué et
de la Plaine des Sables, les noms des sommets et des lieux sont saisis à la main dans l'outil (coordonnées approchées, calées
sur l'estompage du relief).
