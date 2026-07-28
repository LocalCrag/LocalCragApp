import { Coordinates } from '../interfaces/coordinates.interface';
import { LineString } from 'geojson';

/** Parking spot attached to a rock explorer feature. */
export interface RockExplorerParkingSite {
  id: string;
  /** Null while a new site still needs map/manual coordinates. */
  lat: number | null;
  lng: number | null;
  title: string | null;
  description: string | null;
}

/** Approach / access path (LineString) on a rock explorer feature. */
export interface RockExplorerPath {
  id: string;
  title: string | null;
  description: string | null;
  geometry: LineString;
}

export function parkingSiteCoordinates(
  site: RockExplorerParkingSite,
): Coordinates | null {
  if (site.lat == null || site.lng == null) {
    return null;
  }
  return { lat: site.lat, lng: site.lng };
}

export function cloneParkingSites(
  sites: RockExplorerParkingSite[] | null | undefined,
): RockExplorerParkingSite[] {
  return (sites ?? []).map((site) => ({
    id: site.id,
    lat: site.lat ?? null,
    lng: site.lng ?? null,
    title: site.title ?? null,
    description: site.description ?? null,
  }));
}

export function clonePaths(
  paths: RockExplorerPath[] | null | undefined,
): RockExplorerPath[] {
  return (paths ?? []).map((path) => ({
    id: path.id,
    title: path.title ?? null,
    description: path.description ?? null,
    geometry: {
      type: 'LineString',
      coordinates: path.geometry.coordinates.map(
        (c) => [...c] as [number, number],
      ),
    },
  }));
}

export function newParkingSiteId(): string {
  return crypto.randomUUID();
}

export function newPathId(): string {
  return crypto.randomUUID();
}
