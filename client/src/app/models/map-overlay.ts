import type { ExpressionSpecification } from 'maplibre-gl';

export type MapOverlaySourceKind = 'tilejson' | 'tiles';
export type MapOverlayType = 'raster' | 'vector';
export type MapOverlayTileSize = 256 | 512;
export type MapOverlayPaintMode = 'solid' | 'categorical';

/** One value→color entry for categorical vector paint. */
export class MapOverlayCategoricalStop {
  value: string;
  color: string;

  public static deserialize(payload: any): MapOverlayCategoricalStop {
    const stop = new MapOverlayCategoricalStop();
    stop.value = String(payload?.value ?? '').trim();
    stop.color = String(payload?.color ?? '#2d6a4f');
    return stop;
  }

  public static serialize(stop: MapOverlayCategoricalStop): any {
    return {
      value: stop.value,
      color: stop.color,
    };
  }
}

/** One MapLibre source-layer inside a vector tile set, with solid or categorical color. */
export class MapOverlayVectorLayer {
  /** Display name in Rock Explorer (falls back to sourceLayer). */
  name: string;
  sourceLayer: string;
  /** solid = single fill; categorical = match on a feature property. */
  paintMode: MapOverlayPaintMode;
  /**
   * Solid fill color, or default/fallback color when paintMode is categorical.
   */
  color: string;
  /** Feature property used for categorical match (stringified). */
  categoricalProperty: string;
  categoricalStops: MapOverlayCategoricalStop[];
  /**
   * When the parent overlay is first activated in a Rock Explorer session,
   * this source-layer starts on if true.
   */
  defaultActive: boolean;

  public static deserialize(payload: any): MapOverlayVectorLayer {
    const layer = new MapOverlayVectorLayer();
    layer.sourceLayer = String(payload?.sourceLayer ?? '').trim();
    layer.name = String(payload?.name ?? '').trim() || layer.sourceLayer;
    layer.paintMode =
      payload?.paintMode === 'categorical' ? 'categorical' : 'solid';
    layer.color = String(payload?.color ?? '#2d6a4f');
    layer.categoricalProperty = String(
      payload?.categoricalProperty ?? '',
    ).trim();
    layer.categoricalStops = Array.isArray(payload?.categoricalStops)
      ? payload.categoricalStops
          .map(MapOverlayCategoricalStop.deserialize)
          .filter((stop: MapOverlayCategoricalStop) => stop.value.length > 0)
      : [];
    layer.defaultActive = payload?.defaultActive !== false;
    return layer;
  }

  public static serialize(layer: MapOverlayVectorLayer): any {
    const base = {
      name: layer.name || layer.sourceLayer,
      sourceLayer: layer.sourceLayer,
      paintMode: layer.paintMode === 'categorical' ? 'categorical' : 'solid',
      color: layer.color,
      defaultActive: layer.defaultActive !== false,
    };
    if (base.paintMode === 'categorical') {
      return {
        ...base,
        categoricalProperty: layer.categoricalProperty ?? '',
        categoricalStops: (layer.categoricalStops ?? []).map(
          MapOverlayCategoricalStop.serialize,
        ),
      };
    }
    return base;
  }
}

/**
 * MapLibre fill/line color for a vector sublayer (literal or `match` expression).
 */
export function vectorLayerPaintColor(
  layer: MapOverlayVectorLayer,
): string | ExpressionSpecification {
  const fallback = layer.color || '#2d6a4f';
  if (
    layer.paintMode !== 'categorical' ||
    !layer.categoricalProperty?.trim() ||
    !(layer.categoricalStops?.length > 0)
  ) {
    return fallback;
  }
  const expression = [
    'match',
    ['to-string', ['get', layer.categoricalProperty.trim()]],
    ...layer.categoricalStops.flatMap((stop) => [
      String(stop.value),
      stop.color || fallback,
    ]),
    fallback,
  ] as ExpressionSpecification;
  return expression;
}

/**
 * Resolve the displayed color for a feature under a vector sublayer config.
 */
export function resolveVectorLayerFeatureColor(
  layer: {
    paintMode?: MapOverlayPaintMode | string;
    color?: string;
    categoricalProperty?: string;
    categoricalStops?: { value: string; color: string }[];
  },
  properties: Record<string, unknown> | null | undefined,
): string {
  const fallback = layer.color || '#2d6a4f';
  if (
    layer.paintMode !== 'categorical' ||
    !layer.categoricalProperty?.trim() ||
    !(layer.categoricalStops?.length > 0)
  ) {
    return fallback;
  }
  const raw = properties?.[layer.categoricalProperty.trim()];
  if (raw == null) {
    return fallback;
  }
  const key = String(raw);
  const stop = layer.categoricalStops.find(
    (item) => String(item.value) === key,
  );
  return stop?.color || fallback;
}

/**
 * Instance-settings JSON map overlay definition (not a DB entity / AbstractModel).
 * Raster: XYZ/TileJSON imagery. Vector: MVT from MBTiles/tippecanoe served as TileJSON or XYZ.
 */
export class MapOverlay {
  id: string;
  name: string;
  sourceKind: MapOverlaySourceKind;
  url: string;
  type: MapOverlayType;
  opacity: number;
  /** Raster only. */
  tileSize: MapOverlayTileSize;
  /** Vector only: one entry per source-layer in the tileset. */
  layers: MapOverlayVectorLayer[];

  public static deserialize(payload: any): MapOverlay {
    const layer = new MapOverlay();
    layer.id = String(payload?.id ?? '');
    layer.name = String(payload?.name ?? '');
    layer.sourceKind = payload?.sourceKind === 'tiles' ? 'tiles' : 'tilejson';
    layer.url = String(payload?.url ?? '');
    layer.type = payload?.type === 'vector' ? 'vector' : 'raster';
    layer.opacity =
      typeof payload?.opacity === 'number' ? payload.opacity : 0.5;
    layer.tileSize = payload?.tileSize === 512 ? 512 : 256;
    if (Array.isArray(payload?.layers) && payload.layers.length > 0) {
      layer.layers = payload.layers
        .map(MapOverlayVectorLayer.deserialize)
        .filter((item: MapOverlayVectorLayer) => item.sourceLayer.length > 0);
    } else if (payload?.sourceLayer) {
      // Legacy single sourceLayer/color → layers[]
      layer.layers = [
        MapOverlayVectorLayer.deserialize({
          name: payload.name,
          sourceLayer: payload.sourceLayer,
          color: payload.color,
        }),
      ].filter((item) => item.sourceLayer.length > 0);
    } else {
      layer.layers = [];
    }
    return layer;
  }

  public static serialize(layer: MapOverlay): any {
    const base = {
      id: layer.id,
      name: layer.name,
      sourceKind: layer.sourceKind,
      url: layer.url,
      type: layer.type,
      opacity: layer.opacity,
    };
    if (layer.type === 'vector') {
      return {
        ...base,
        layers: (layer.layers ?? []).map(MapOverlayVectorLayer.serialize),
      };
    }
    return {
      ...base,
      tileSize: (layer.tileSize ?? 256) as MapOverlayTileSize,
    };
  }
}
