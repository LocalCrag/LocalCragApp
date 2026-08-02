import { Feature, FeatureCollection, Geometry, Position } from 'geojson';
import { LngLatBounds, Map as MaplibreMap, PaddingOptions } from 'maplibre-gl';

export type FitMapOptions = {
  padding?: number | PaddingOptions;
  maxZoom?: number;
  duration?: number;
};

/** Extend bounds with all coordinates from a geometry (Point / LineString / Polygon). */
export function extendBoundsWithGeometry(
  bounds: LngLatBounds,
  geometry: Geometry,
): boolean {
  if (geometry.type === 'Point') {
    bounds.extend(geometry.coordinates as [number, number]);
    return true;
  }
  if (geometry.type === 'LineString') {
    let hasCoord = false;
    for (const coord of geometry.coordinates) {
      bounds.extend(coord as [number, number]);
      hasCoord = true;
    }
    return hasCoord;
  }
  if (geometry.type === 'Polygon') {
    let hasCoord = false;
    for (const coord of geometry.coordinates[0] ?? []) {
      bounds.extend(coord as [number, number]);
      hasCoord = true;
    }
    return hasCoord;
  }
  return false;
}

/** Fit map to a geometry (Point / LineString / Polygon). */
export function fitMapToGeometry(
  map: MaplibreMap,
  geometry: Geometry,
  options: FitMapOptions = {},
): void {
  const bounds = new LngLatBounds();
  if (!extendBoundsWithGeometry(bounds, geometry) || bounds.isEmpty()) {
    return;
  }
  map.fitBounds(bounds, {
    padding: options.padding ?? 48,
    maxZoom: options.maxZoom ?? (geometry.type === 'Point' ? 17 : 18),
    duration: options.duration ?? 700,
  });
}

/** Fit map to a list of positions. */
export function fitMapToPositions(
  map: MaplibreMap,
  positions: Position[],
  options: FitMapOptions = {},
): void {
  if (positions.length === 0) {
    return;
  }
  const bounds = new LngLatBounds();
  for (const coord of positions) {
    bounds.extend(coord as [number, number]);
  }
  if (bounds.isEmpty()) {
    return;
  }
  map.fitBounds(bounds, {
    padding: options.padding ?? 48,
    maxZoom: options.maxZoom ?? (positions.length === 1 ? 17 : 18),
    duration: options.duration ?? 700,
  });
}

/** Fit map to a feature collection. */
export function fitMapToFeatureCollection(
  map: MaplibreMap,
  collection: FeatureCollection<Geometry>,
  options: FitMapOptions = {},
): void {
  if (collection.features.length === 0) {
    return;
  }
  const bounds = new LngLatBounds();
  let hasCoord = false;
  for (const feature of collection.features) {
    if (extendBoundsWithGeometry(bounds, feature.geometry)) {
      hasCoord = true;
    }
  }
  if (!hasCoord) {
    return;
  }
  map.fitBounds(bounds, {
    padding: options.padding ?? 48,
    maxZoom: options.maxZoom ?? 16,
    duration: options.duration ?? 700,
  });
}

/** Fit map to a list of features. */
export function fitMapToFeatures(
  map: MaplibreMap,
  features: Feature<Geometry>[],
  options: FitMapOptions = {},
): void {
  fitMapToFeatureCollection(
    map,
    { type: 'FeatureCollection', features },
    options,
  );
}
