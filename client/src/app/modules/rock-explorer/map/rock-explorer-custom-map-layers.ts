import { Map as MaplibreMap, RasterSourceSpecification } from 'maplibre-gl';
import { RockExplorerMapLayer } from '../../../models/rock-explorer-map-layer';

/**
 * Applies instance-configured raster overlays on Rock Explorer maps only.
 * Call {@link apply} after map load and again after `style.load`.
 */
export class RockExplorerCustomMapLayers {
  private layerIds: string[] = [];

  constructor(private readonly map: MaplibreMap) {}

  apply(
    configs: RockExplorerMapLayer[] | null | undefined,
    masterVisible: boolean,
    opacityOverrides?: Record<string, number> | null,
    layerVisibility?: Record<string, boolean> | null,
  ): void {
    this.layerIds = [];
    if (!Array.isArray(configs) || configs.length === 0) {
      return;
    }
    for (const cfg of configs) {
      if (!cfg?.id || !cfg.url || cfg.type !== 'raster') {
        continue;
      }
      const sourceId = `re-custom-src-${cfg.id}`;
      const layerId = `re-custom-${cfg.id}`;
      const opacity = RockExplorerCustomMapLayers.resolveOpacity(
        cfg,
        opacityOverrides,
      );
      const visible = RockExplorerCustomMapLayers.resolveVisible(
        cfg.id,
        masterVisible,
        layerVisibility,
      );
      if (!this.map.getSource(sourceId) && !this.map.getLayer(layerId)) {
        const tileSize = cfg.tileSize ?? 256;
        const source: RasterSourceSpecification =
          cfg.sourceKind === 'tilejson'
            ? { type: 'raster', url: cfg.url, tileSize }
            : { type: 'raster', tiles: [cfg.url], tileSize };
        this.map.addSource(sourceId, source);
        this.map.addLayer({
          id: layerId,
          type: 'raster',
          source: sourceId,
          paint: { 'raster-opacity': opacity },
          layout: { visibility: visible ? 'visible' : 'none' },
        });
      } else if (this.map.getLayer(layerId)) {
        this.map.setPaintProperty(layerId, 'raster-opacity', opacity);
        this.map.setLayoutProperty(
          layerId,
          'visibility',
          visible ? 'visible' : 'none',
        );
      }
      if (this.map.getLayer(layerId)) {
        this.layerIds.push(layerId);
      }
    }
    // Ensure paint order matches config order (first = bottom).
    this.reorder(configs.map((c) => c.id).filter(Boolean));
  }

  /**
   * Stack custom overlays in `configIds` order (first = bottom, last = top).
   * Caller should bring feature overlays above afterward.
   */
  reorder(configIds: string[]): void {
    const nextIds: string[] = [];
    for (const id of configIds) {
      const layerId = `re-custom-${id}`;
      if (this.map.getLayer(layerId)) {
        this.map.moveLayer(layerId);
        nextIds.push(layerId);
      }
    }
    if (nextIds.length > 0) {
      this.layerIds = nextIds;
    }
  }

  setVisibility(
    masterVisible: boolean,
    layerVisibility?: Record<string, boolean> | null,
  ): void {
    for (const layerId of this.layerIds) {
      if (!this.map.getLayer(layerId)) {
        continue;
      }
      const configId = layerId.replace(/^re-custom-/, '');
      const visible = RockExplorerCustomMapLayers.resolveVisible(
        configId,
        masterVisible,
        layerVisibility,
      );
      this.map.setLayoutProperty(
        layerId,
        'visibility',
        visible ? 'visible' : 'none',
      );
    }
  }

  /** Updates paint opacity for one overlay (`cfg.id`, not the MapLibre layer id). */
  setOpacity(configId: string, opacity: number): void {
    const layerId = `re-custom-${configId}`;
    if (this.map.getLayer(layerId)) {
      this.map.setPaintProperty(
        layerId,
        'raster-opacity',
        RockExplorerCustomMapLayers.clampOpacity(opacity),
      );
    }
  }

  static resolveVisible(
    configId: string,
    masterVisible: boolean,
    layerVisibility?: Record<string, boolean> | null,
  ): boolean {
    if (!masterVisible) {
      return false;
    }
    if (
      layerVisibility &&
      Object.prototype.hasOwnProperty.call(layerVisibility, configId)
    ) {
      return layerVisibility[configId] !== false;
    }
    return true;
  }

  static resolveOpacity(
    cfg: RockExplorerMapLayer,
    opacityOverrides?: Record<string, number> | null,
  ): number {
    const override = opacityOverrides?.[cfg.id];
    return RockExplorerCustomMapLayers.clampOpacity(
      typeof override === 'number' ? override : cfg.opacity,
    );
  }

  static clampOpacity(opacity: number): number {
    if (!Number.isFinite(opacity)) {
      return 0.5;
    }
    return Math.min(1, Math.max(0, opacity));
  }

  removeAll(): void {
    for (const layerId of [...this.layerIds].reverse()) {
      if (this.map.getLayer(layerId)) {
        this.map.removeLayer(layerId);
      }
      const sourceId = layerId.replace(/^re-custom-/, 're-custom-src-');
      if (this.map.getSource(sourceId)) {
        this.map.removeSource(sourceId);
      }
    }
    this.layerIds = [];
  }
}
