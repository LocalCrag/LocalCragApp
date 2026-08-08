import { ChangeDetectorRef, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  GeoJSONSource,
  Map as MaplibreMap,
  MapLayerMouseEvent,
} from 'maplibre-gl';
import { Feature, FeatureCollection, Geometry } from 'geojson';
import { GalleryImage } from '../../../models/gallery-image';
import { ObjectType } from '../../../models/object';
import { Coordinates } from '../../../interfaces/coordinates.interface';
import { GalleryService } from '../../../services/crud/gallery.service';
import { emptyFeatureCollection } from '../../../utility/map/geojson-source';
import { RockExplorerPendingImageService } from '../offline/rock-explorer-pending-image.service';
import { RockExplorerUiService } from '../rock-explorer-ui.service';
import { RockExplorerImageHoverPopup } from './image-hover-popup';
import { RockExplorerMapLayers } from './rock-explorer-map-layers';
import { ROCK_EXPLORER_SOURCES } from './rock-explorer-map.constants';

/** Minimal shape of the panel gallery tab needed to drive map image pins. */
type ImageLocationsGalleryHandle = {
  editMode: boolean;
  images: unknown[];
  getGeotaggedMapFeatures(): Feature[];
  openGalleryById(galleryImageId: string): void;
};

export type RockExplorerImageLocationsHost = {
  map: MaplibreMap | undefined;
  layers: RockExplorerMapLayers | undefined;
  ui: RockExplorerUiService;
  destroyRef: DestroyRef;
  cdr: ChangeDetectorRef;
  /** True when image/parking pick or path draw is active */
  isMapOverlayInteractionActive: boolean;
  /** True while dragging a draft polygon vertex */
  isDraggingVertex: boolean;
  /** Current draw mode is polygon/editPolygon tools */
  isPolygonToolActive: () => boolean;
  getPanelGallery: () => ImageLocationsGalleryHandle | null | undefined;
  getPanelActiveTab: () => string | undefined;
  setPanelActiveTab: (tab: string) => void;
};

/**
 * Owns gallery-image GPS dots on the rock-explorer map: server-side feature
 * pins, pending-upload draft pins, live-record pins, hover/pin popups and
 * cluster expansion. Combines all three sources into one GeoJSON collection
 * pushed to {@link RockExplorerMapLayers}.
 */
export class RockExplorerImageLocations {
  private imageLocationsRequestId = 0;
  /** Gallery GPS dots for the open published/edit feature. */
  private featureImageLocationsData: FeatureCollection<Geometry> =
    emptyFeatureCollection();
  /** Pending IndexedDB geotagged dots for local drafts. */
  private draftImageLocationsData: FeatureCollection<Geometry> =
    emptyFeatureCollection();
  /**
   * Pins uploaded while online during Record — kept separate so refreshing
   * pending-queue dots does not wipe them.
   */
  private liveDraftImageLocationsData: FeatureCollection<Geometry> =
    emptyFeatureCollection();
  private imageLocationsData: FeatureCollection<Geometry> =
    emptyFeatureCollection();
  private readonly imageHover = new RockExplorerImageHoverPopup();
  /** Guards async getClusterLeaves against stale mousemove results. */
  private imageClusterHoverRequestId = 0;
  /** True for the rest of a map click after an image GPS marker pin is handled. */
  private consumingImageLocationClick = false;

  constructor(
    private readonly host: RockExplorerImageLocationsHost,
    private readonly galleryService: GalleryService,
    private readonly pendingImages: RockExplorerPendingImageService,
  ) {
    this.imageHover.setOnImageClick((galleryImageId) => {
      this.openGalleryFromMapImage(galleryImageId);
    });
  }

  /** Combined feature/draft/live-draft GeoJSON currently pushed to the map. */
  get data(): FeatureCollection<Geometry> {
    return this.imageLocationsData;
  }

  /** True for the rest of a map click after an image GPS marker click was handled. */
  get consumingClick(): boolean {
    return this.consumingImageLocationClick;
  }

  hideHover(options?: { force?: boolean }): void {
    this.imageHover.hide(options);
  }

  /** Load gallery GPS dots for a published feature from the server. */
  loadFeature(featureId: string): void {
    const requestId = ++this.imageLocationsRequestId;
    this.galleryService
      .getGalleryImages({
        page: 1,
        per_page: 100,
        'tag-object-type': ObjectType.RockExplorerFeature,
        'tag-object-id': featureId,
      })
      .pipe(takeUntilDestroyed(this.host.destroyRef))
      .subscribe({
        next: (page) => {
          if (
            requestId !== this.imageLocationsRequestId ||
            this.host.ui.editingFeature()?.id !== featureId
          ) {
            return;
          }
          // Don't overwrite live edit-mode GPS previews with a stale server list.
          const gallery = this.host.getPanelGallery();
          if (gallery?.editMode) {
            this.refreshFromGallery();
            return;
          }
          this.setFeatureImageLocations({
            type: 'FeatureCollection',
            features: page.items
              .map((image) => this.galleryImageToMapFeature(image))
              .filter((feature): feature is Feature => feature != null),
          });
        },
        error: () => {
          if (requestId === this.imageLocationsRequestId) {
            this.clearFeature();
          }
        },
      });
  }

  /** Clear the open feature's gallery GPS dots (draft/live-draft pins stay). */
  clearFeature(): void {
    this.imageLocationsRequestId++;
    this.imageHover.hide({ force: true });
    this.featureImageLocationsData = emptyFeatureCollection();
    this.publishCombinedImageLocations();
  }

  /** Prefer in-memory gallery geotags so dots don't vanish while a refetch runs. */
  refreshFromGallery(): void {
    const gallery = this.host.getPanelGallery();
    if (!gallery) {
      return;
    }
    this.setFeatureImageLocations({
      type: 'FeatureCollection',
      features: gallery.getGeotaggedMapFeatures(),
    });
  }

  /** Panel gallery finished loading images — refresh dots if relevant. */
  onGalleryImagesLoaded(): void {
    const gallery = this.host.getPanelGallery();
    if (gallery?.editMode) {
      this.refreshFromGallery();
      return;
    }
    if (gallery && gallery.images.length > 0) {
      this.refreshFromGallery();
    }
  }

  focusCoordinates(coordinates: Coordinates): void {
    if (!this.host.map) {
      return;
    }
    this.imageHover.hide({ force: true });
    this.host.map.flyTo({
      center: [coordinates.lng, coordinates.lat],
      zoom: Math.max(this.host.map.getZoom(), 17),
      duration: 700,
    });
  }

  /**
   * Show pending geotagged images for all local drafts on the map.
   * Does not clear live-uploaded Record pins.
   */
  async refreshDraftPins(): Promise<void> {
    let pins: { id: string; localId: string; lat: number; lng: number }[] = [];
    try {
      pins = await this.pendingImages.listAllGpsPins();
    } catch {
      pins = [];
    }
    this.draftImageLocationsData = {
      type: 'FeatureCollection',
      features: pins.map((pin) => ({
        type: 'Feature' as const,
        geometry: {
          type: 'Point' as const,
          coordinates: [pin.lng, pin.lat],
        },
        properties: {
          pendingImageId: pin.id,
          localId: pin.localId,
          draftImage: true,
          thumbnailUrl: '',
          description: '',
        },
      })),
    };
    this.publishCombinedImageLocations();
  }

  appendLivePin(lat: number, lng: number): void {
    this.liveDraftImageLocationsData = {
      type: 'FeatureCollection',
      features: [
        ...this.liveDraftImageLocationsData.features,
        {
          type: 'Feature',
          geometry: { type: 'Point', coordinates: [lng, lat] },
          properties: {
            draftImage: true,
            liveUpload: true,
            thumbnailUrl: '',
            description: '',
          },
        },
      ],
    };
    this.publishCombinedImageLocations();
  }

  clearLivePins(): void {
    this.liveDraftImageLocationsData = emptyFeatureCollection();
    this.publishCombinedImageLocations();
  }

  /** Legacy alias — treat as feature-layer replacement. */
  setFeatureCollection(collection: FeatureCollection<Geometry>): void {
    this.setFeatureImageLocations(collection);
  }

  /** Re-push the current combined collection onto (a freshly rebuilt) layers. */
  reattachToLayers(): void {
    this.host.layers?.setImageLocations(this.imageLocationsData);
  }

  onMouseMove(event: MapLayerMouseEvent): void {
    if (
      !this.host.map ||
      this.host.isMapOverlayInteractionActive ||
      this.host.isPolygonToolActive()
    ) {
      return;
    }
    const feature = event.features?.[0];
    if (!feature || feature.geometry.type !== 'Point') {
      return;
    }
    const coordinates = (feature.geometry.coordinates as number[]).slice() as [
      number,
      number,
    ];
    const clusterId = feature.properties?.['cluster_id'];
    const pointCount = feature.properties?.['point_count'];
    if (clusterId != null && typeof pointCount === 'number') {
      void this.showClusterImageHover(clusterId, pointCount, coordinates);
      return;
    }
    // Invalidate any in-flight getClusterLeaves so a stale cluster popup
    // cannot overwrite this unclustered hover.
    this.imageClusterHoverRequestId++;
    this.imageHover.show(this.host.map, feature, coordinates);
  }

  onMouseLeave(): void {
    this.imageClusterHoverRequestId++;
    this.imageHover.hide();
    if (
      this.host.map &&
      !this.host.isDraggingVertex &&
      !this.host.isMapOverlayInteractionActive &&
      !this.host.isPolygonToolActive()
    ) {
      this.host.map.getCanvas().style.cursor = '';
    }
  }

  onClick(event: MapLayerMouseEvent): void {
    if (
      !this.host.map ||
      this.host.isMapOverlayInteractionActive ||
      this.host.isPolygonToolActive() ||
      this.host.ui.drawMode() !== 'select'
    ) {
      return;
    }
    const feature = event.features?.[0];
    if (!feature || feature.geometry.type !== 'Point') {
      return;
    }
    const coordinates = (feature.geometry.coordinates as number[]).slice() as [
      number,
      number,
    ];
    const clusterId = feature.properties?.['cluster_id'];
    if (clusterId != null) {
      void this.expandImageCluster(clusterId, coordinates);
      this.consumingImageLocationClick = true;
      setTimeout(() => {
        this.consumingImageLocationClick = false;
      }, 0);
      return;
    }
    this.imageHover.show(this.host.map, feature, coordinates, { pin: true });
    this.consumingImageLocationClick = true;
    setTimeout(() => {
      this.consumingImageLocationClick = false;
    }, 0);
  }

  private galleryImageToMapFeature(image: GalleryImage): Feature | null {
    const lat = image.lat;
    const lng = image.lng;
    if (lat == null || lng == null || !image.image) {
      return null;
    }
    const thumbnailUrl =
      image.image.thumbnailM ||
      image.image.thumbnailS ||
      image.image.path ||
      '';
    return {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [lng, lat] },
      properties: {
        galleryImageId: image.id,
        thumbnailUrl,
        description: image.description ?? '',
      },
    };
  }

  private setFeatureImageLocations(collection: FeatureCollection<Geometry>) {
    this.featureImageLocationsData = collection;
    this.publishCombinedImageLocations();
  }

  private publishCombinedImageLocations() {
    this.imageLocationsData = {
      type: 'FeatureCollection',
      features: [
        ...this.featureImageLocationsData.features,
        ...this.draftImageLocationsData.features,
        ...this.liveDraftImageLocationsData.features,
      ],
    };
    this.host.layers?.setImageLocations(this.imageLocationsData);
  }

  private async showClusterImageHover(
    clusterId: number | string,
    pointCount: number,
    coordinates: [number, number],
  ): Promise<void> {
    if (!this.host.map) {
      return;
    }
    const requestId = ++this.imageClusterHoverRequestId;
    const featureKey = `cluster:${clusterId}`;
    const source = this.host.map.getSource(
      ROCK_EXPLORER_SOURCES.imageLocations,
    ) as GeoJSONSource | undefined;
    if (!source) {
      return;
    }
    try {
      const leaves = await source.getClusterLeaves(Number(clusterId), 1, 0);
      if (
        requestId !== this.imageClusterHoverRequestId ||
        !this.host.map ||
        this.host.isMapOverlayInteractionActive ||
        this.host.isPolygonToolActive()
      ) {
        return;
      }
      const leaf = leaves[0];
      if (!leaf) {
        return;
      }
      this.imageHover.show(this.host.map, leaf, coordinates, {
        count: pointCount,
        featureKey,
      });
    } catch {
      // Ignore transient cluster-leaf errors during rapid hover / style switch.
    }
  }

  private async expandImageCluster(
    clusterId: number | string,
    coordinates: [number, number],
  ): Promise<void> {
    if (!this.host.map) {
      return;
    }
    const source = this.host.map.getSource(
      ROCK_EXPLORER_SOURCES.imageLocations,
    ) as GeoJSONSource | undefined;
    if (!source) {
      return;
    }
    try {
      const zoom = await source.getClusterExpansionZoom(Number(clusterId));
      if (!this.host.map) {
        return;
      }
      this.host.map.easeTo({
        center: coordinates,
        zoom,
      });
    } catch {
      // Ignore if cluster no longer exists after data/style refresh.
    }
  }

  private openGalleryFromMapImage(galleryImageId: string): void {
    this.imageHover.hide({ force: true });
    const gallery = this.host.getPanelGallery();
    if (!gallery) {
      return;
    }
    if (this.host.getPanelActiveTab() !== 'images') {
      this.host.setPanelActiveTab('images');
    }
    gallery.openGalleryById(galleryImageId);
    this.host.cdr.detectChanges();
  }
}
