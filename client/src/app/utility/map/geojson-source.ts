import { FeatureCollection, Geometry } from 'geojson';
import { GeoJSONSource, Map as MaplibreMap } from 'maplibre-gl';

export function emptyFeatureCollection<
  G extends Geometry = Geometry,
>(): FeatureCollection<G> {
  return { type: 'FeatureCollection', features: [] };
}

/** Options applied only on first `addSource` (e.g. MapLibre clustering). */
export type GeoJsonSourceCreateOptions = {
  cluster?: boolean;
  clusterRadius?: number;
  clusterMinPoints?: number;
  tolerance?: number;
};

/** Ensure a GeoJSON source exists; creates it with the given initial data if missing. */
export function ensureGeoJsonSource(
  map: MaplibreMap,
  sourceId: string,
  data: FeatureCollection = emptyFeatureCollection(),
  options?: GeoJsonSourceCreateOptions,
): GeoJSONSource {
  if (!map.getSource(sourceId)) {
    map.addSource(sourceId, {
      type: 'geojson',
      data,
      ...options,
    });
  }
  return map.getSource(sourceId) as GeoJSONSource;
}

export function setGeoJsonSourceData(
  map: MaplibreMap | undefined,
  sourceId: string,
  data: FeatureCollection,
): void {
  const source = map?.getSource(sourceId) as GeoJSONSource | undefined;
  source?.setData(data);
}
