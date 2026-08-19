import {
  FillLayerSpecification,
  LineLayerSpecification,
  Map as MaplibreMap,
  RasterSourceSpecification,
  VectorSourceSpecification,
} from 'maplibre-gl';
import {
  MapOverlay,
  MapOverlayVectorLayer,
  vectorLayerPaintColor,
} from '../../../models/map-overlay';

/**
 * Applies instance-configured raster/vector overlays on Rock Explorer maps only.
 * Call {@link apply} after map load and again after `style.load`.
 */
export class RockExplorerCustomMapLayers {
  private layerIds: string[] = [];

  constructor(private readonly map: MaplibreMap) {}

  apply(
    configs: MapOverlay[] | null | undefined,
    masterVisible: boolean,
    opacityOverrides?: Record<string, number> | null,
    layerVisibility?: Record<string, boolean> | null,
  ): void {
    this.layerIds = [];
    if (!Array.isArray(configs) || configs.length === 0) {
      return;
    }
    for (const cfg of configs) {
      if (!cfg?.id || !cfg.url) {
        continue;
      }
      if (cfg.type === 'vector') {
        this.applyVector(cfg, masterVisible, opacityOverrides, layerVisibility);
      } else if (cfg.type === 'raster') {
        this.applyRaster(cfg, masterVisible, opacityOverrides, layerVisibility);
      }
    }
    // Ensure paint order matches config order (first = top).
    this.reorder(configs.map((c) => c.id).filter(Boolean));
  }

  private applyRaster(
    cfg: MapOverlay,
    masterVisible: boolean,
    opacityOverrides?: Record<string, number> | null,
    layerVisibility?: Record<string, boolean> | null,
  ): void {
    const sourceId = RockExplorerCustomMapLayers.sourceId(cfg.id);
    const layerId = RockExplorerCustomMapLayers.rasterLayerId(cfg.id);
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

  private applyVector(
    cfg: MapOverlay,
    masterVisible: boolean,
    opacityOverrides?: Record<string, number> | null,
    layerVisibility?: Record<string, boolean> | null,
  ): void {
    const vectorLayers = (cfg.layers ?? []).filter(
      (item) => !!item?.sourceLayer?.trim(),
    );
    if (vectorLayers.length === 0) {
      return;
    }
    const sourceId = RockExplorerCustomMapLayers.sourceId(cfg.id);
    const opacity = RockExplorerCustomMapLayers.resolveOpacity(
      cfg,
      opacityOverrides,
    );

    if (!this.map.getSource(sourceId)) {
      const source: VectorSourceSpecification =
        cfg.sourceKind === 'tilejson'
          ? { type: 'vector', url: cfg.url }
          : { type: 'vector', tiles: [cfg.url] };
      this.map.addSource(sourceId, source);
    }

    vectorLayers.forEach((vectorLayer, index) => {
      const visible = RockExplorerCustomMapLayers.resolveSubLayerVisible(
        cfg.id,
        index,
        masterVisible,
        layerVisibility,
      );
      this.applyVectorSubLayer(
        cfg.id,
        sourceId,
        index,
        vectorLayer,
        opacity,
        visible ? 'visible' : 'none',
      );
    });
  }

  private applyVectorSubLayer(
    configId: string,
    sourceId: string,
    index: number,
    vectorLayer: MapOverlayVectorLayer,
    opacity: number,
    visibility: 'visible' | 'none',
  ): void {
    const sourceLayer = vectorLayer.sourceLayer.trim();
    const color = vectorLayerPaintColor(vectorLayer);
    const fillId = RockExplorerCustomMapLayers.fillLayerId(configId, index);
    const outlineId = RockExplorerCustomMapLayers.outlineLayerId(
      configId,
      index,
    );

    if (!this.map.getLayer(fillId)) {
      const fill: FillLayerSpecification = {
        id: fillId,
        type: 'fill',
        source: sourceId,
        'source-layer': sourceLayer,
        paint: {
          'fill-color': color,
          'fill-opacity': opacity,
        },
        layout: { visibility },
      };
      this.map.addLayer(fill);
    } else {
      this.map.setPaintProperty(fillId, 'fill-color', color);
      this.map.setPaintProperty(fillId, 'fill-opacity', opacity);
      this.map.setLayoutProperty(fillId, 'visibility', visibility);
    }

    if (!this.map.getLayer(outlineId)) {
      const outline: LineLayerSpecification = {
        id: outlineId,
        type: 'line',
        source: sourceId,
        'source-layer': sourceLayer,
        paint: {
          'line-color': color,
          'line-opacity': Math.min(1, opacity + 0.25),
          'line-width': 1.5,
        },
        layout: { visibility },
      };
      this.map.addLayer(outline);
    } else {
      this.map.setPaintProperty(outlineId, 'line-color', color);
      this.map.setPaintProperty(
        outlineId,
        'line-opacity',
        Math.min(1, opacity + 0.25),
      );
      this.map.setLayoutProperty(outlineId, 'visibility', visibility);
    }

    if (this.map.getLayer(fillId)) {
      this.layerIds.push(fillId);
    }
    if (this.map.getLayer(outlineId)) {
      this.layerIds.push(outlineId);
    }
  }

  /**
   * Stack custom overlays in `configIds` order (first = top, last = bottom).
   * Within a vector overlay, lower source-layer indices are also above higher ones.
   * Caller should bring feature overlays above afterward.
   */
  reorder(configIds: string[]): void {
    const nextIds: string[] = [];
    // moveLayer without a beforeId raises to the top — process bottom entries first.
    for (const id of [...configIds].reverse()) {
      const matching = this.layerIds
        .filter(
          (layerId) =>
            RockExplorerCustomMapLayers.configIdFromLayerId(layerId) === id,
        )
        .sort(RockExplorerCustomMapLayers.compareLayerIdsBottomFirst);
      for (const layerId of matching) {
        if (this.map.getLayer(layerId)) {
          this.map.moveLayer(layerId);
          nextIds.push(layerId);
        }
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
      const configId = RockExplorerCustomMapLayers.configIdFromLayerId(layerId);
      const subIndex =
        RockExplorerCustomMapLayers.subLayerIndexFromLayerId(layerId);
      const visible =
        subIndex == null
          ? RockExplorerCustomMapLayers.resolveVisible(
              configId,
              masterVisible,
              layerVisibility,
            )
          : RockExplorerCustomMapLayers.resolveSubLayerVisible(
              configId,
              subIndex,
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
    const clamped = RockExplorerCustomMapLayers.clampOpacity(opacity);
    const matching = this.layerIds.filter(
      (layerId) =>
        RockExplorerCustomMapLayers.configIdFromLayerId(layerId) === configId,
    );
    for (const layerId of matching) {
      const layer = this.map.getLayer(layerId);
      if (!layer) {
        continue;
      }
      if (layer.type === 'raster') {
        this.map.setPaintProperty(layerId, 'raster-opacity', clamped);
      } else if (layer.type === 'fill') {
        this.map.setPaintProperty(layerId, 'fill-opacity', clamped);
      } else if (layer.type === 'line') {
        this.map.setPaintProperty(
          layerId,
          'line-opacity',
          Math.min(1, clamped + 0.25),
        );
      }
    }
  }

  /**
   * Fill layer ids currently applied for vector overlays (for identify / query).
   */
  vectorFillLayerIds(): string[] {
    return this.layerIds.filter((layerId) => {
      if (layerId.endsWith('-outline')) {
        return false;
      }
      return (
        RockExplorerCustomMapLayers.subLayerIndexFromLayerId(layerId) != null
      );
    });
  }

  /**
   * Vector fill features at `point` (top-most layer first; one hit per fill layer).
   */
  queryVectorFeaturesAtPoint(point: { x: number; y: number }): {
    layerId: string;
    properties: Record<string, unknown>;
  }[] {
    const layers = this.vectorFillLayerIds().filter(
      (layerId) => !!this.map.getLayer(layerId),
    );
    if (layers.length === 0) {
      return [];
    }
    const features = this.map.queryRenderedFeatures([point.x, point.y], {
      layers,
    });
    const seen = new Set<string>();
    const hits: { layerId: string; properties: Record<string, unknown> }[] = [];
    for (const feature of features) {
      const layerId = feature.layer?.id;
      if (!layerId || seen.has(layerId)) {
        continue;
      }
      seen.add(layerId);
      hits.push({
        layerId,
        properties: (feature.properties ?? {}) as Record<string, unknown>,
      });
    }
    return hits;
  }

  static sourceId(configId: string): string {
    return `re-custom-src-${configId}`;
  }

  static rasterLayerId(configId: string): string {
    return `re-custom-${configId}`;
  }

  static fillLayerId(configId: string, index: number): string {
    return `re-custom-${configId}--${index}`;
  }

  static outlineLayerId(configId: string, index: number): string {
    return `re-custom-${configId}--${index}-outline`;
  }

  static subLayerVisibilityId(configId: string, index: number): string {
    return `${configId}--${index}`;
  }

  static configIdFromLayerId(layerId: string): string {
    const withoutPrefix = layerId.replace(/^re-custom-/, '');
    const splitAt = withoutPrefix.indexOf('--');
    if (splitAt >= 0) {
      return withoutPrefix.slice(0, splitAt);
    }
    return withoutPrefix.replace(/-outline$/, '');
  }

  static subLayerIndexFromLayerId(layerId: string): number | null {
    const match = /^re-custom-.+--(\d+)(?:-outline)?$/.exec(layerId);
    return match ? Number(match[1]) : null;
  }

  /** Sort key for moveLayer passes: later list entries first (end up under earlier ones). */
  static compareLayerIdsBottomFirst(a: string, b: string): number {
    const indexA = RockExplorerCustomMapLayers.subLayerIndexFromLayerId(a);
    const indexB = RockExplorerCustomMapLayers.subLayerIndexFromLayerId(b);
    if (indexA == null && indexB == null) {
      return 0;
    }
    if (indexA == null) {
      return -1;
    }
    if (indexB == null) {
      return 1;
    }
    if (indexA !== indexB) {
      return indexB - indexA;
    }
    const outlineA = a.endsWith('-outline') ? 1 : 0;
    const outlineB = b.endsWith('-outline') ? 1 : 0;
    return outlineA - outlineB;
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

  static resolveSubLayerVisible(
    configId: string,
    index: number,
    masterVisible: boolean,
    layerVisibility?: Record<string, boolean> | null,
  ): boolean {
    if (
      !RockExplorerCustomMapLayers.resolveVisible(
        configId,
        masterVisible,
        layerVisibility,
      )
    ) {
      return false;
    }
    return RockExplorerCustomMapLayers.resolveVisible(
      RockExplorerCustomMapLayers.subLayerVisibilityId(configId, index),
      true,
      layerVisibility,
    );
  }

  static resolveOpacity(
    cfg: MapOverlay,
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
    }
    const sourceIds = new Set(
      this.layerIds.map((layerId) => {
        const configId =
          RockExplorerCustomMapLayers.configIdFromLayerId(layerId);
        return RockExplorerCustomMapLayers.sourceId(configId);
      }),
    );
    for (const sourceId of sourceIds) {
      if (this.map.getSource(sourceId)) {
        this.map.removeSource(sourceId);
      }
    }
    this.layerIds = [];
  }
}
