// L'île assemblée : régions avec leurs voisins (routes développées dans les deux sens) et la liste de leurs sites.
import { REGIONS_BRUTES, voisinsDepuisRoutes } from "./regions.mjs";
import { SITES } from "./sites.mjs";

export const REGIONS = voisinsDepuisRoutes(REGIONS_BRUTES).map(r => ({ ...r, sites: SITES.filter(s => s.region === r.cle).map(s => s.cle) }));
export { SITES };
