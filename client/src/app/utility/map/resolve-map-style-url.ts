import { MapBaseLayer } from '../../models/map-base-layer';

/** Configured base layers with id + styleUrl. */
export function resolveMapBaseLayers(
  configured: MapBaseLayer[] | null | undefined,
): MapBaseLayer[] {
  return (configured ?? []).filter((layer) => layer?.id && layer?.styleUrl);
}

/** Id of the topo base layer for `lc-map` (first `topoDefault`, else first entry). */
export function pickTopoBaseLayerId(layers: MapBaseLayer[]): string | null {
  if (!layers.length) {
    return null;
  }
  const preferred = layers.find((layer) => layer.topoDefault);
  return preferred?.id ?? layers[0].id;
}

/**
 * Id of the Rock Explorer initial base layer
 * (first `rockExplorerDefault`, else first entry).
 */
export function pickRockExplorerDefaultBaseLayerId(
  layers: MapBaseLayer[],
): string | null {
  if (!layers.length) {
    return null;
  }
  const preferred = layers.find((layer) => layer.rockExplorerDefault);
  return preferred?.id ?? layers[0].id;
}

/** Style URL of the topo base layer (for `lc-map`). */
export function styleUrlForTopoBaseLayer(
  layers: MapBaseLayer[],
): string | null {
  return styleUrlForBaseLayer(layers, pickTopoBaseLayerId(layers));
}

/** Resolves the MapLibre style URL for a base-layer id. */
export function styleUrlForBaseLayer(
  layers: MapBaseLayer[],
  layerId: string | null | undefined,
): string | null {
  if (!layers.length) {
    return null;
  }
  const layer =
    layers.find((item) => item.id === layerId) ??
    layers.find((item) => item.rockExplorerDefault) ??
    layers.find((item) => item.topoDefault) ??
    layers[0];
  return layer?.styleUrl || null;
}
