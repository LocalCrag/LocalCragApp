import { MapStyles } from '../../enums/map-styles';

/** MapTiler style URL for the given map style and API key. */
export function maptilerStyleUrl(apiKey: string, style: MapStyles): string {
  if (style === MapStyles.SATELLITE) {
    return `https://api.maptiler.com/maps/satellite/style.json?key=${apiKey}`;
  }
  return `https://api.maptiler.com/maps/topo-v2/style.json?key=${apiKey}`;
}
