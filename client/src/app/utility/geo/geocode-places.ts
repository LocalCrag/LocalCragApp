import { Coordinates } from '../../interfaces/coordinates.interface';

/** Normalized place hit from a geocoder. */
export type GeocodePlace = {
  id: string;
  label: string;
  coordinates: Coordinates;
};

/** Minimal Photon GeoJSON feature shape we care about. */
export type PhotonFeature = {
  type?: string;
  geometry?: {
    type?: string;
    coordinates?: number[];
  };
  properties?: {
    osm_id?: number | string;
    osm_type?: string;
    name?: string;
    street?: string;
    housenumber?: string;
    postcode?: string;
    city?: string;
    town?: string;
    village?: string;
    county?: string;
    state?: string;
    country?: string;
    type?: string;
  };
};

/**
 * Builds a Photon forward-geocode URL for addresses and named features.
 * @see https://github.com/komoot/photon
 */
export function buildPhotonGeocodeUrl(
  query: string,
  options?: { limit?: number; language?: string; proximity?: Coordinates },
): string {
  const params = new URLSearchParams();
  params.set('q', query.trim());
  params.set('limit', String(options?.limit ?? 5));
  if (options?.language) {
    params.set('lang', options.language);
  }
  if (options?.proximity) {
    params.set('lat', String(options.proximity.lat));
    params.set('lon', String(options.proximity.lng));
  }
  return `https://photon.komoot.io/api/?${params.toString()}`;
}

/** Maps a Photon feature to a place hit, or null when geometry/label is unusable. */
export function mapPhotonFeatureToPlace(
  feature: PhotonFeature,
  index = 0,
): GeocodePlace | null {
  const coords = feature.geometry?.coordinates;
  if (!coords || coords.length < 2) {
    return null;
  }
  const lng = Number(coords[0]);
  const lat = Number(coords[1]);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return null;
  }
  const label = formatPhotonLabel(feature.properties);
  if (!label) {
    return null;
  }
  const props = feature.properties ?? {};
  const id =
    props.osm_type && props.osm_id != null
      ? `${props.osm_type}:${props.osm_id}`
      : `photon-${index}`;
  return {
    id,
    label,
    coordinates: { lat, lng },
  };
}

/** Maps a Photon FeatureCollection payload to place hits. */
export function mapPhotonResponseToPlaces(payload: unknown): GeocodePlace[] {
  if (!payload || typeof payload !== 'object') {
    return [];
  }
  const features = (payload as { features?: unknown }).features;
  if (!Array.isArray(features)) {
    return [];
  }
  const places: GeocodePlace[] = [];
  features.forEach((feature, index) => {
    const place = mapPhotonFeatureToPlace(feature as PhotonFeature, index);
    if (place) {
      places.push(place);
    }
  });
  return places;
}

function formatPhotonLabel(
  properties: PhotonFeature['properties'] | undefined,
): string {
  if (!properties) {
    return '';
  }
  const streetLine = [properties.housenumber, properties.street]
    .filter(Boolean)
    .join(' ')
    .trim();
  const locality =
    properties.city || properties.town || properties.village || '';
  const parts = [
    properties.name,
    streetLine,
    properties.postcode,
    locality,
    properties.state,
    properties.country,
  ]
    .map((part) => (part ?? '').trim())
    .filter(Boolean);
  // Deduplicate adjacent equal segments (e.g. name === city).
  const unique: string[] = [];
  for (const part of parts) {
    if (unique[unique.length - 1] !== part) {
      unique.push(part);
    }
  }
  return unique.join(', ');
}
