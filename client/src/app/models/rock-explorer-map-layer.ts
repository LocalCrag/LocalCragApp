export type RockExplorerMapLayerSourceKind = 'tilejson' | 'tiles';
export type RockExplorerMapLayerType = 'raster';
export type RockExplorerMapLayerTileSize = 256 | 512;

/**
 * Instance-settings JSON overlay definition (not a DB entity / AbstractModel).
 */
export class RockExplorerMapLayer {
  id: string;
  name: string;
  sourceKind: RockExplorerMapLayerSourceKind;
  url: string;
  type: RockExplorerMapLayerType;
  opacity: number;
  tileSize: RockExplorerMapLayerTileSize;
  /** Whether the overlay is visible by default when opening Rock Explorer. */
  defaultOn: boolean;

  public static deserialize(payload: any): RockExplorerMapLayer {
    const layer = new RockExplorerMapLayer();
    layer.id = String(payload?.id ?? '');
    layer.name = String(payload?.name ?? '');
    layer.sourceKind = payload?.sourceKind === 'tiles' ? 'tiles' : 'tilejson';
    layer.url = String(payload?.url ?? '');
    layer.type = 'raster';
    layer.opacity =
      typeof payload?.opacity === 'number' ? payload.opacity : 0.5;
    layer.tileSize = payload?.tileSize === 512 ? 512 : 256;
    layer.defaultOn = payload?.defaultOn !== false;
    return layer;
  }

  public static serialize(layer: RockExplorerMapLayer): any {
    return {
      id: layer.id,
      name: layer.name,
      sourceKind: layer.sourceKind,
      url: layer.url,
      type: 'raster' as RockExplorerMapLayerType,
      opacity: layer.opacity,
      tileSize: (layer.tileSize ?? 256) as RockExplorerMapLayerTileSize,
      defaultOn: layer.defaultOn !== false,
    };
  }
}
