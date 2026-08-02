import { FeatureCollection, Geometry } from 'geojson';
import { GeoJSONSource, Map as MaplibreMap } from 'maplibre-gl';

export function emptyFeatureCollection<
  G extends Geometry = Geometry,
>(): FeatureCollection<G> {
  return { type: 'FeatureCollection', features: [] };
}

/** Ensure a GeoJSON source exists; creates it with the given initial data if missing. */
export function ensureGeoJsonSource(
  map: MaplibreMap,
  sourceId: string,
  data: FeatureCollection = emptyFeatureCollection(),
): GeoJSONSource {
  if (!map.getSource(sourceId)) {
    map.addSource(sourceId, { type: 'geojson', data });
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
