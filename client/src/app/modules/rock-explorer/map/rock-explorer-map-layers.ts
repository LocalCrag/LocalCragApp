import { Feature, FeatureCollection, Geometry } from 'geojson';
import { Map as MaplibreMap } from 'maplibre-gl';
import {
  emptyFeatureCollection,
  ensureGeoJsonSource,
  setGeoJsonSourceData,
} from '../../../utility/map/geojson-source';
import { geometryLabelPoint } from '../../../utility/map/geometry-label-point';
import { loadMapImages } from '../../../utility/map/load-map-images';
import { buildMatchExpression } from '../../../utility/map/match-expression';
import {
  MAP_MEDIA_ACCENT,
  LOCAL_DRAFT_FILL,
  LOCAL_DRAFT_OUTLINE,
  PARKING_ICON,
  POTENTIAL_FILL_COLORS,
  POTENTIAL_OUTLINE_COLORS,
  ROCK_EXPLORER_LAYERS as L,
  ROCK_EXPLORER_SOURCES as S,
} from './rock-explorer-map.constants';

/**
 * Owns rock-explorer MapLibre sources and layers.
 * Call {@link addAll} after map load and again after `style.load`.
 */
export class RockExplorerMapLayers {
  private untitledFeatureLabel = 'Untitled feature';
  private untitledDraftLabel = 'Untitled draft';

  constructor(private readonly map: MaplibreMap) {}

  /** Localized fallbacks for empty titles on the map. */
  setUntitledLabels(featureLabel: string, draftLabel: string): void {
    this.untitledFeatureLabel = featureLabel;
    this.untitledDraftLabel = draftLabel;
  }

  /** Ensure parking icon + all feature/draft/overlay layers exist. */
  async addAll(
    features: FeatureCollection<Geometry> = emptyFeatureCollection(),
    imageLocations: FeatureCollection<Geometry> = emptyFeatureCollection(),
  ): Promise<void> {
    try {
      await this.ensureParkingIcon();
    } catch {
      // Feature layers still work without the parking icon.
    }
    this.ensureFeatureSources(features);
    this.ensureFeatureLayers();
    this.ensureLocalDraftLayers();
    this.ensureDraftLayers();
    this.ensureSelectionLayers();
    this.ensureLabelLayer();
    this.ensureImageLocationLayer(imageLocations);
    this.ensureMiscOverlayLayers();
    this.setFeatures(features);
    this.bringOverlaysToFront();
  }

  setFeatures(collection: FeatureCollection<Geometry>): void {
    setGeoJsonSourceData(this.map, S.features, collection);
    this.setFeatureLabels(collection);
  }

  setDraft(collection: FeatureCollection<Geometry>): void {
    setGeoJsonSourceData(this.map, S.draft, collection);
  }

  clearDraft(): void {
    this.setDraft(emptyFeatureCollection());
  }

  setLocalDrafts(collection: FeatureCollection<Geometry>): void {
    ensureGeoJsonSource(this.map, S.localDrafts);
    this.ensureLocalDraftLayers();
    setGeoJsonSourceData(this.map, S.localDrafts, collection);
    this.setLocalDraftLabels(collection);
  }

  clearLocalDrafts(): void {
    this.setLocalDrafts(emptyFeatureCollection());
  }

  setImageLocations(collection: FeatureCollection<Geometry>): void {
    setGeoJsonSourceData(this.map, S.imageLocations, collection);
  }

  setParking(collection: FeatureCollection<Geometry>): void {
    setGeoJsonSourceData(this.map, S.parking, collection);
  }

  setPaths(collection: FeatureCollection<Geometry>): void {
    setGeoJsonSourceData(this.map, S.paths, collection);
  }

  clearMiscOverlays(keepDraft: boolean): void {
    this.setParking(emptyFeatureCollection());
    this.setPaths(emptyFeatureCollection());
    if (!keepDraft) {
      this.clearDraft();
    }
  }

  /** Update selection layers to only show selected features. */
  applySelectionFilters(ids: string[]): void {
    const idLiteral: ['literal', string[]] = ['literal', ids];
    for (const layerId of [L.selectedPoints, L.selectedPolygons]) {
      if (this.map.getLayer(layerId)) {
        this.map.setFilter(layerId, [
          'all',
          [
            '==',
            ['geometry-type'],
            layerId === L.selectedPoints ? 'Point' : 'Polygon',
          ],
          ['in', ['get', 'id'], idLiteral],
        ]);
      }
    }
  }

  ensureMiscOverlayLayers(): void {
    void this.ensureParkingIcon();
    ensureGeoJsonSource(this.map, S.parking);
    ensureGeoJsonSource(this.map, S.paths);

    if (!this.map.getLayer(L.paths)) {
      this.map.addLayer({
        id: L.paths,
        type: 'line',
        source: S.paths,
        paint: {
          'line-color': MAP_MEDIA_ACCENT,
          'line-width': 3,
          'line-opacity': 0.9,
          'line-dasharray': [2, 1.5],
        },
      });
    } else {
      this.map.setPaintProperty(L.paths, 'line-color', MAP_MEDIA_ACCENT);
      this.map.setPaintProperty(L.paths, 'line-dasharray', [2, 1.5]);
    }

    if (!this.map.getLayer(L.pathLabels)) {
      this.map.addLayer({
        id: L.pathLabels,
        type: 'symbol',
        source: S.paths,
        layout: {
          'symbol-placement': 'line-center',
          'text-field': ['coalesce', ['get', 'title'], ''],
          'text-size': 12,
          'text-max-width': 14,
          'text-optional': true,
          'text-allow-overlap': true,
          'text-ignore-placement': true,
        },
        paint: {
          'text-color': MAP_MEDIA_ACCENT,
          'text-halo-color': 'rgba(255,255,255,0.92)',
          'text-halo-width': 1.75,
        },
      });
    } else {
      this.map.setPaintProperty(L.pathLabels, 'text-color', MAP_MEDIA_ACCENT);
    }

    if (!this.map.getLayer(L.parking)) {
      this.map.addLayer({
        id: L.parking,
        type: 'symbol',
        source: S.parking,
        layout: {
          'icon-image': PARKING_ICON.name,
          'icon-size': 0.4,
          'icon-allow-overlap': true,
          'icon-ignore-placement': true,
          'text-field': ['coalesce', ['get', 'title'], ''],
          'text-size': 12,
          'text-offset': [0, 1.15],
          'text-anchor': 'top',
          'text-max-width': 12,
          'text-optional': true,
          'text-allow-overlap': true,
          'text-ignore-placement': true,
        },
        paint: {
          'text-color': '#1c1917',
          'text-halo-color': 'rgba(255,255,255,0.92)',
          'text-halo-width': 1.75,
        },
      });
    } else {
      this.map.setLayoutProperty(L.parking, 'text-field', [
        'coalesce',
        ['get', 'title'],
        '',
      ]);
      this.map.setLayoutProperty(L.parking, 'text-size', 12);
      this.map.setLayoutProperty(L.parking, 'text-offset', [0, 1.15]);
      this.map.setLayoutProperty(L.parking, 'text-anchor', 'top');
      this.map.setLayoutProperty(L.parking, 'text-allow-overlap', true);
      this.map.setLayoutProperty(L.parking, 'text-ignore-placement', true);
      this.map.setPaintProperty(L.parking, 'text-color', '#1c1917');
      this.map.setPaintProperty(
        L.parking,
        'text-halo-color',
        'rgba(255,255,255,0.92)',
      );
      this.map.setPaintProperty(L.parking, 'text-halo-width', 1.75);
    }

    this.bringOverlaysToFront();
  }

  ensureParkingIcon(): Promise<void> {
    return loadMapImages(this.map, [PARKING_ICON]);
  }

  private ensureFeatureSources(features: FeatureCollection<Geometry>): void {
    ensureGeoJsonSource(this.map, S.features, features);
    ensureGeoJsonSource(this.map, S.localDrafts);
    ensureGeoJsonSource(this.map, S.localDraftLabels);
    ensureGeoJsonSource(this.map, S.draft);
    ensureGeoJsonSource(
      this.map,
      S.labels,
      this.buildFeatureLabelCollection(features),
    );
  }

  private ensureFeatureLayers(): void {
    if (this.map.getLayer(L.polygonsFill)) {
      return;
    }
    this.map.addLayer({
      id: L.polygonsFill,
      type: 'fill',
      source: S.features,
      filter: ['==', ['geometry-type'], 'Polygon'],
      paint: {
        'fill-color': buildMatchExpression(
          'potential',
          POTENTIAL_FILL_COLORS,
        ) as any,
        'fill-opacity': 0.4,
      },
    });
    this.map.addLayer({
      id: L.polygonsOutline,
      type: 'line',
      source: S.features,
      filter: ['==', ['geometry-type'], 'Polygon'],
      paint: {
        'line-color': buildMatchExpression(
          'potential',
          POTENTIAL_OUTLINE_COLORS,
        ) as any,
        'line-width': 2,
      },
    });
    this.map.addLayer({
      id: L.points,
      type: 'circle',
      source: S.features,
      filter: ['==', ['geometry-type'], 'Point'],
      paint: {
        'circle-radius': 7,
        'circle-color': buildMatchExpression(
          'potential',
          POTENTIAL_FILL_COLORS,
        ) as any,
        'circle-stroke-width': 2,
        'circle-stroke-color': '#fff',
      },
    });
  }

  private ensureLocalDraftLayers(): void {
    if (!this.map.getLayer(L.localDraftsFill)) {
      this.map.addLayer({
        id: L.localDraftsFill,
        type: 'fill',
        source: S.localDrafts,
        filter: ['==', ['geometry-type'], 'Polygon'],
        paint: {
          'fill-color': LOCAL_DRAFT_FILL,
          'fill-opacity': 0.35,
        },
      });
    }
    if (!this.map.getLayer(L.localDraftsOutline)) {
      this.map.addLayer({
        id: L.localDraftsOutline,
        type: 'line',
        source: S.localDrafts,
        filter: ['==', ['geometry-type'], 'Polygon'],
        paint: {
          'line-color': LOCAL_DRAFT_OUTLINE,
          'line-width': 2,
        },
      });
    }
    if (!this.map.getLayer(L.localDraftLabels)) {
      this.map.addLayer({
        id: L.localDraftLabels,
        type: 'symbol',
        source: S.localDraftLabels,
        layout: {
          'text-field': ['get', 'title'],
          'text-size': 12,
          'text-offset': [0, 1.15],
          'text-anchor': 'top',
          'text-max-width': 12,
          'text-optional': true,
          'text-allow-overlap': false,
          'symbol-placement': 'point',
        },
        paint: {
          'text-color': LOCAL_DRAFT_OUTLINE,
          'text-halo-color': 'rgba(255,255,255,0.92)',
          'text-halo-width': 1.75,
        },
      });
    }
  }

  private ensureDraftLayers(): void {
    if (this.map.getLayer(L.draftLine)) {
      return;
    }
    this.map.addLayer({
      id: L.draftLine,
      type: 'line',
      source: S.draft,
      filter: [
        'all',
        ['==', ['geometry-type'], 'LineString'],
        ['!', ['boolean', ['get', 'closing'], false]],
      ],
      paint: {
        'line-color': [
          'case',
          ['boolean', ['get', 'invalid'], false],
          '#dc2626',
          '#2563eb',
        ],
        'line-width': 2,
      },
    });
    this.map.addLayer({
      id: L.draftFill,
      type: 'fill',
      source: S.draft,
      filter: ['==', ['geometry-type'], 'Polygon'],
      paint: {
        'fill-color': [
          'case',
          ['boolean', ['get', 'invalid'], false],
          '#dc2626',
          '#2563eb',
        ],
        'fill-opacity': 0.15,
      },
    });
    // Dashed last→first preview (auto-close), not a solid polygon outline.
    this.map.addLayer({
      id: L.draftOutline,
      type: 'line',
      source: S.draft,
      filter: [
        'all',
        ['==', ['geometry-type'], 'LineString'],
        ['boolean', ['get', 'closing'], false],
      ],
      paint: {
        'line-color': [
          'case',
          ['boolean', ['get', 'invalid'], false],
          '#dc2626',
          '#2563eb',
        ],
        'line-width': 2,
        'line-dasharray': [2, 2],
      },
    });
    this.map.addLayer({
      id: L.draftPoints,
      type: 'circle',
      source: S.draft,
      filter: ['==', ['geometry-type'], 'Point'],
      paint: {
        'circle-radius': [
          'case',
          ['boolean', ['get', 'selected'], false],
          9,
          7,
        ],
        'circle-color': [
          'case',
          [
            'any',
            ['boolean', ['get', 'selected'], false],
            ['boolean', ['get', 'invalid'], false],
          ],
          '#dc2626',
          '#2563eb',
        ],
        'circle-stroke-width': 2,
        'circle-stroke-color': '#ffffff',
      },
    });
  }

  private ensureSelectionLayers(): void {
    if (this.map.getLayer(L.selectedPoints)) {
      return;
    }
    this.map.addLayer({
      id: L.selectedPoints,
      type: 'circle',
      source: S.features,
      filter: [
        'all',
        ['==', ['geometry-type'], 'Point'],
        ['in', ['get', 'id'], ['literal', []]],
      ],
      paint: {
        'circle-radius': 11,
        'circle-color': buildMatchExpression(
          'potential',
          POTENTIAL_FILL_COLORS,
        ) as any,
        'circle-stroke-width': 2,
        'circle-stroke-color': '#ffffff',
      },
    });
    this.map.addLayer({
      id: L.selectedPolygons,
      type: 'line',
      source: S.features,
      filter: [
        'all',
        ['==', ['geometry-type'], 'Polygon'],
        ['in', ['get', 'id'], ['literal', []]],
      ],
      paint: {
        'line-color': buildMatchExpression(
          'potential',
          POTENTIAL_OUTLINE_COLORS,
        ) as any,
        'line-width': 5,
      },
    });
  }

  private ensureLabelLayer(): void {
    if (this.map.getLayer(L.labels)) {
      return;
    }
    this.map.addLayer({
      id: L.labels,
      type: 'symbol',
      source: S.labels,
      layout: {
        'text-field': ['get', 'title'],
        'text-size': 12,
        'text-offset': [0, 1.15],
        'text-anchor': 'top',
        'text-max-width': 12,
        'text-optional': true,
        'text-allow-overlap': false,
        'symbol-placement': 'point',
      },
      paint: {
        'text-color': '#1c1917',
        'text-halo-color': 'rgba(255,255,255,0.92)',
        'text-halo-width': 1.75,
      },
    });
  }

  private ensureImageLocationLayer(
    imageLocations: FeatureCollection<Geometry>,
  ): void {
    ensureGeoJsonSource(this.map, S.imageLocations, imageLocations, {
      cluster: true,
      clusterRadius: 50,
      clusterMinPoints: 2,
      tolerance: 0,
    });
    if (!this.map.getLayer(L.imageLocations)) {
      this.map.addLayer({
        id: L.imageLocations,
        type: 'circle',
        source: S.imageLocations,
        filter: ['!', ['has', 'point_count']],
        paint: {
          'circle-radius': 7,
          'circle-color': MAP_MEDIA_ACCENT,
          'circle-stroke-width': 2,
          'circle-stroke-color': '#ffffff',
        },
      });
    } else {
      this.map.setPaintProperty(
        L.imageLocations,
        'circle-color',
        MAP_MEDIA_ACCENT,
      );
      this.map.setFilter(L.imageLocations, ['!', ['has', 'point_count']]);
    }

    if (!this.map.getLayer(L.imageClusters)) {
      this.map.addLayer({
        id: L.imageClusters,
        type: 'circle',
        source: S.imageLocations,
        filter: ['has', 'point_count'],
        paint: {
          'circle-color': MAP_MEDIA_ACCENT,
          'circle-radius': 14,
          'circle-stroke-width': 2,
          'circle-stroke-color': '#ffffff',
        },
      });
    } else {
      this.map.setPaintProperty(
        L.imageClusters,
        'circle-color',
        MAP_MEDIA_ACCENT,
      );
      this.map.setPaintProperty(L.imageClusters, 'circle-radius', 14);
    }

    if (!this.map.getLayer(L.imageClusterCount)) {
      this.map.addLayer({
        id: L.imageClusterCount,
        type: 'symbol',
        source: S.imageLocations,
        filter: ['has', 'point_count'],
        layout: {
          'text-field': '{point_count}',
          'text-size': 12,
        },
        paint: {
          'text-color': '#ffffff',
        },
      });
    } else {
      this.map.setLayoutProperty(L.imageClusterCount, 'text-size', 12);
    }
  }

  private setFeatureLabels(collection: FeatureCollection<Geometry>): void {
    setGeoJsonSourceData(
      this.map,
      S.labels,
      this.buildFeatureLabelCollection(collection),
    );
  }

  /** One point per feature; empty titles use the untitled fallback. */
  private buildFeatureLabelCollection(
    collection: FeatureCollection<Geometry>,
  ): FeatureCollection<Geometry> {
    const features: Feature[] = [];
    for (const feature of collection.features) {
      const raw = feature.properties?.['title'];
      const title =
        typeof raw === 'string' && raw.trim()
          ? raw.trim()
          : this.untitledFeatureLabel;
      const coordinates = geometryLabelPoint(feature.geometry);
      if (!coordinates) {
        continue;
      }
      features.push({
        type: 'Feature',
        geometry: { type: 'Point', coordinates },
        properties: {
          id: feature.properties?.['id'] ?? null,
          title,
        },
      });
    }
    return { type: 'FeatureCollection', features };
  }

  private setLocalDraftLabels(collection: FeatureCollection<Geometry>): void {
    ensureGeoJsonSource(this.map, S.localDraftLabels);
    const features: Feature[] = [];
    for (const feature of collection.features) {
      if (feature.geometry?.type !== 'Polygon') {
        continue;
      }
      const raw = feature.properties?.['title'];
      const title =
        typeof raw === 'string' && raw.trim()
          ? raw.trim()
          : this.untitledDraftLabel;
      const coordinates = geometryLabelPoint(feature.geometry);
      if (!coordinates) {
        continue;
      }
      features.push({
        type: 'Feature',
        geometry: { type: 'Point', coordinates },
        properties: {
          localId: feature.properties?.['localId'] ?? null,
          title,
        },
      });
    }
    setGeoJsonSourceData(this.map, S.localDraftLabels, {
      type: 'FeatureCollection',
      features,
    });
  }

  /** Keep domain overlays above basemap/custom rasters after custom reorder. */
  bringOverlaysToFront(): void {
    for (const layerId of [
      L.localDraftsFill,
      L.localDraftsOutline,
      L.localDraftLabels,
      L.labels,
      L.paths,
      L.pathLabels,
      L.parking,
      L.imageLocations,
      L.imageClusters,
      L.imageClusterCount,
    ]) {
      if (this.map.getLayer(layerId)) {
        this.map.moveLayer(layerId);
      }
    }
  }
}
