export type MapOverlaySourceKind = 'tilejson' | 'tiles';
export type MapOverlayType = 'raster';
export type MapOverlayTileSize = 256 | 512;

/**
 * Instance-settings JSON map overlay definition (not a DB entity / AbstractModel).
 */
export class MapOverlay {
  id: string;
  name: string;
  sourceKind: MapOverlaySourceKind;
  url: string;
  type: MapOverlayType;
  opacity: number;
  tileSize: MapOverlayTileSize;

  public static deserialize(payload: any): MapOverlay {
    const layer = new MapOverlay();
    layer.id = String(payload?.id ?? '');
    layer.name = String(payload?.name ?? '');
    layer.sourceKind = payload?.sourceKind === 'tiles' ? 'tiles' : 'tilejson';
    layer.url = String(payload?.url ?? '');
    layer.type = 'raster';
    layer.opacity =
      typeof payload?.opacity === 'number' ? payload.opacity : 0.5;
    layer.tileSize = payload?.tileSize === 512 ? 512 : 256;
    return layer;
  }

  public static serialize(layer: MapOverlay): any {
    return {
      id: layer.id,
      name: layer.name,
      sourceKind: layer.sourceKind,
      url: layer.url,
      type: 'raster' as MapOverlayType,
      opacity: layer.opacity,
      tileSize: (layer.tileSize ?? 256) as MapOverlayTileSize,
    };
  }
}
