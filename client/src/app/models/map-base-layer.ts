/**
 * Instance-settings JSON base-map definition (MapLibre style URL).
 * Not a DB entity / AbstractModel.
 */
export class MapBaseLayer {
  id: string;
  name: string;
  /** MapLibre style JSON URL (include any API key in the query string if needed). */
  styleUrl: string;
  /** Base map used by all `lc-map` topo maps (exactly one should be true). */
  topoDefault: boolean;
  /** Initial base map when opening Rock Explorer (exactly one should be true). */
  rockExplorerDefault: boolean;
  /** Overlay ids active by default when this base map is selected in Rock Explorer. */
  defaultOverlayIds: string[];

  public static deserialize(payload: any): MapBaseLayer {
    const layer = new MapBaseLayer();
    layer.id = String(payload?.id ?? '');
    layer.name = String(payload?.name ?? '');
    layer.styleUrl = String(payload?.styleUrl ?? '');
    layer.topoDefault = payload?.topoDefault === true;
    layer.rockExplorerDefault = payload?.rockExplorerDefault === true;
    layer.defaultOverlayIds = payload?.defaultOverlayIds ?? [];
    return layer;
  }

  public static serialize(layer: MapBaseLayer): any {
    return {
      id: layer.id,
      name: layer.name,
      styleUrl: layer.styleUrl,
      topoDefault: layer.topoDefault === true,
      rockExplorerDefault: layer.rockExplorerDefault === true,
      defaultOverlayIds: layer.defaultOverlayIds,
    };
  }
}
