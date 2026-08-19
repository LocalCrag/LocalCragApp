import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  DestroyRef,
  ElementRef,
  HostListener,
  NgZone,
  OnDestroy,
  ViewChild,
  inject,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import {
  GeolocateControl,
  Map as MaplibreMap,
  NavigationControl,
} from 'maplibre-gl';
import { FeatureCollection, Geometry } from 'geojson';
import { Toast } from 'primeng/toast';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ConfirmPopup } from 'primeng/confirmpopup';
import { Dialog } from 'primeng/dialog';
import { Button } from 'primeng/button';
import { Select } from 'primeng/select';
import { InputText } from 'primeng/inputtext';
import { Textarea } from 'primeng/textarea';
import { FormsModule } from '@angular/forms';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { marker } from '@jsverse/transloco-keys-manager/marker';
import { Store } from '@ngrx/store';
import { forkJoin } from 'rxjs';
import { take } from 'rxjs/operators';
import { selectInstanceSettingsState } from '../../../ngrx/selectors/instance-settings.selectors';
import { RockExplorerService } from '../../../services/crud/rock-explorer.service';
import { GalleryService } from '../../../services/crud/gallery.service';
import { ClipboardService } from '../../../services/core/clipboard.service';
import { RockExplorerFeature } from '../../../models/rock-explorer-feature';
import { RockExplorerPotential } from '../../../enums/rock-explorer-potential';
import { RockExplorerRockQuality } from '../../../enums/rock-explorer-rock-quality';
import { RockExplorerRockType } from '../../../enums/rock-explorer-rock-type';
import { RockExplorerPanelComponent } from '../rock-explorer-panel/rock-explorer-panel.component';
import { RockExplorerToolbarComponent } from '../rock-explorer-toolbar/rock-explorer-toolbar.component';
import { RockExplorerSessionsComponent } from '../rock-explorer-sessions/rock-explorer-sessions.component';
import {
  RockExplorerUiService,
  RockExplorerCommand,
  RockExplorerDrawMode,
  RockExplorerFilters,
} from '../rock-explorer-ui.service';
import {
  RockExplorerRecordingFacade,
  RockExplorerRecordingFacadeHost,
} from '../rock-explorer-recording.facade';
import { mockGpsRecording } from '../../../../environments/environment';
import { RockExplorerPendingImageService } from '../offline/rock-explorer-pending-image.service';
import { emptyFeatureCollection } from '../../../utility/map/geojson-source';
import { fitMapToFeatureCollection } from '../../../utility/map/map-bounds';
import {
  pickRockExplorerDefaultBaseLayerId,
  resolveMapBaseLayers,
  styleUrlForBaseLayer,
} from '../../../utility/map/resolve-map-style-url';
import {
  RockExplorerImageLocations,
  RockExplorerImageLocationsHost,
} from '../map/rock-explorer-image-locations';
import {
  RockExplorerMapInteraction,
  RockExplorerMapInteractionHost,
} from '../map/rock-explorer-map-interaction';
import { RockExplorerMapLayers } from '../map/rock-explorer-map-layers';
import { RockExplorerCustomMapLayers } from '../map/rock-explorer-custom-map-layers';
import { MapBaseLayer } from '../../../models/map-base-layer';
import {
  MapOverlay,
  resolveVectorLayerFeatureColor,
} from '../../../models/map-overlay';
import { ROCK_EXPLORER_LAYERS } from '../map/rock-explorer-map.constants';

@Component({
  selector: 'lc-rock-explorer',
  imports: [
    FormsModule,
    Toast,
    ConfirmPopup,
    Dialog,
    Button,
    Select,
    InputText,
    Textarea,
    TranslocoDirective,
    RockExplorerPanelComponent,
    RockExplorerToolbarComponent,
    RockExplorerSessionsComponent,
  ],
  providers: [MessageService, ConfirmationService, RockExplorerUiService],
  templateUrl: './rock-explorer.component.html',
  styleUrl: './rock-explorer.component.scss',
})
export class RockExplorerComponent implements AfterViewInit, OnDestroy {
  @ViewChild('map') private mapContainer?: ElementRef<HTMLElement>;
  @ViewChild(RockExplorerPanelComponent) panel?: RockExplorerPanelComponent;
  @ViewChild('recordImageInput')
  private recordImageInput?: ElementRef<HTMLInputElement>;

  readonly ui = inject(RockExplorerUiService);
  /** Owns Record mode / drafts / publish / sync — dialog fields bound directly from the template. */
  readonly recording: RockExplorerRecordingFacade;

  /** Draw/drag/click/geometry-edit map interaction. */
  private readonly mapInteraction: RockExplorerMapInteraction;
  /** Gallery / draft / live-record image GPS dots on the map. */
  private readonly images: RockExplorerImageLocations;

  private lastFilters: RockExplorerFilters = {};
  private miscEditMode = false;
  public loading = true;
  public noBaseLayer = false;
  /** Right-click identify popover for vector overlays under the cursor. */
  public vectorIdentify: {
    x: number;
    y: number;
    hits: {
      name: string;
      color: string;
      overlayName: string;
      attributeLabel?: string;
      legend?: { value: string; color: string }[];
    }[];
  } | null = null;
  /** Ignore document click that can follow a contextmenu in the same gesture. */
  private ignoreVectorIdentifyDocumentClick = false;
  /** Feature id from the route to open once the map is ready. */
  private pendingDeepLinkFeatureId: string | null = null;
  /** Skip paramMap reactions while we are writing the URL ourselves. */
  private syncingFeatureUrl = false;

  private map?: MaplibreMap;
  private layers?: RockExplorerMapLayers;
  private customLayers?: RockExplorerCustomMapLayers;
  private mapBaseLayers: MapBaseLayer[] = [];
  private mapOverlays: MapOverlay[] = [];
  private features: FeatureCollection<Geometry> = emptyFeatureCollection();
  private draftGeometry: Geometry | null = null;
  private geolocateControl: GeolocateControl | null = null;
  private mobileMediaQuery?: MediaQueryList;
  private mobileMediaListener?: (event: MediaQueryListEvent) => void;

  private destroyRef = inject(DestroyRef);
  private ngZone = inject(NgZone);
  private store = inject(Store);
  private rockExplorerService = inject(RockExplorerService);
  private galleryService = inject(GalleryService);
  private clipboardService = inject(ClipboardService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private cdr = inject(ChangeDetectorRef);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);
  private transloco = inject(TranslocoService);
  private pendingImages = inject(RockExplorerPendingImageService);

  constructor() {
    // Order matters: images has no deps on the others; mapInteraction needs
    // images; recording needs both images and the mapInteraction-owned draw
    // helpers exposed through this host.
    this.images = new RockExplorerImageLocations(
      this.createImageLocationsHost(),
      this.galleryService,
      this.pendingImages,
    );
    this.mapInteraction = new RockExplorerMapInteraction(
      this.createMapInteractionHost(),
    );
    this.recording = new RockExplorerRecordingFacade(
      this.createRecordingHost(),
    );

    this.ui.commands$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((cmd) => this.handleUiCommand(cmd));
    this.route.paramMap
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((params) => {
        if (this.syncingFeatureUrl) {
          return;
        }
        this.onFeatureRouteParam(params.get('featureId'));
      });
  }

  private createImageLocationsHost(): RockExplorerImageLocationsHost {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const c = this;
    return {
      get map() {
        return c.map;
      },
      get layers() {
        return c.layers;
      },
      ui: c.ui,
      destroyRef: c.destroyRef,
      cdr: c.cdr,
      get isMapOverlayInteractionActive() {
        return c.mapInteraction.isMapOverlayInteractionActive;
      },
      get isDraggingVertex() {
        return c.mapInteraction.isDraggingVertex;
      },
      isPolygonToolActive: () => c.ui.isPolygonToolActive(),
      getPanelGallery: () => c.panel?.gallery ?? null,
      getPanelActiveTab: () => c.panel?.panelActiveTab,
      setPanelActiveTab: (tab: string) => {
        if (c.panel) {
          // `panelActiveTab` is a private tab-name union on the panel;
          // the collaborator interface only knows it as `string`.
          c.panel.panelActiveTab =
            tab as RockExplorerPanelComponent['panelActiveTab'];
        }
      },
    };
  }

  private createMapInteractionHost(): RockExplorerMapInteractionHost {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const c = this;
    return {
      get map() {
        return c.map;
      },
      get layers() {
        return c.layers;
      },
      ui: c.ui,
      cdr: c.cdr,
      destroyRef: c.destroyRef,
      ngZone: c.ngZone,
      images: c.images,
      getMiscEditMode: () => c.miscEditMode,
      setMiscEditMode: (active: boolean) => {
        c.miscEditMode = active;
      },
      getDraftGeometry: () => c.draftGeometry,
      setDraftGeometry: (geometry) => {
        c.draftGeometry = geometry;
      },
      getPanelMisc: () => c.panel?.misc,
      getPanelGallery: () => c.panel?.gallery,
      showCreateForm: () => {
        c.panel?.showCreateForm();
      },
      openEditPanel: (id, options) => c.openEditPanel(id, options),
      continueDraft: (localId: string) => {
        void c.recording.continueDraft(localId);
      },
      closePanel: () => c.closePanel(),
      syncFeatureUrl: (featureId) => c.syncFeatureUrl(featureId),
      persistFeatureGeometry: (feature, geometry) =>
        c.persistFeatureGeometry(feature, geometry),
    };
  }

  private createRecordingHost(): RockExplorerRecordingFacadeHost {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const c = this;
    return {
      get map() {
        return c.map;
      },
      get layers() {
        return c.layers;
      },
      ui: c.ui,
      images: c.images,
      cdr: c.cdr,
      destroyRef: c.destroyRef,
      ngZone: c.ngZone,
      messageService: c.messageService,
      confirmationService: c.confirmationService,
      reloadFeatures: () => c.reloadFeatures(c.lastFilters),
      applyFeatureToPanel: (feature, formActive) =>
        c.applyFeatureToPanel(feature, formActive),
      openEditPanel: (id, options) => c.openEditPanel(id, options),
      closePanel: (options) => c.closePanel(options),
      cancelPathDraw: () => c.mapInteraction.cancelPathDraw(),
      setRockExplorerDrawMode: (mode: RockExplorerDrawMode) =>
        c.mapInteraction.setRockExplorerDrawMode(mode),
      fitMapToPositions: (positions) =>
        c.mapInteraction.fitMapToPositions(positions),
      triggerGeolocate: () => {
        c.geolocateControl?.trigger();
      },
      getRecordImageInputElement: () => c.recordImageInput?.nativeElement,
    };
  }

  /**
   * Handle UI commands from the RockExplorerUiService.
   * @param cmd - The command to handle.
   */
  private handleUiCommand(cmd: RockExplorerCommand): void {
    switch (cmd.type) {
      case 'setDrawMode':
        this.mapInteraction.setRockExplorerDrawMode(cmd.mode);
        break;
      case 'cancelPointDraw':
        this.mapInteraction.cancelPointDraw();
        break;
      case 'undoPolygonVertex':
        this.mapInteraction.undoPolygonVertex();
        break;
      case 'finishPolygon':
        this.mapInteraction.finishPolygon();
        break;
      case 'cancelPolygonDraw':
        this.mapInteraction.cancelPolygonDraw();
        break;
      case 'switchMapStyle':
        this.switchMapStyle(cmd.styleId);
        break;
      case 'toggleCustomMapLayers':
        this.toggleCustomMapLayers();
        break;
      case 'setCustomMapLayerOpacity':
        this.setCustomMapLayerOpacity(cmd.layerId, cmd.opacity);
        break;
      case 'setCustomMapLayerVisible':
        this.setCustomMapLayerVisible(cmd.layerId, cmd.visible);
        break;
      case 'moveCustomMapLayer':
        this.moveCustomMapLayer(cmd.layerId, cmd.direction);
        break;
      case 'filtersChange':
        this.onFiltersChange(cmd.filters);
        break;
      case 'cancelImageCoordinatePick':
        this.mapInteraction.cancelImageCoordinatePick();
        break;
      case 'cancelParkingCoordinatePick':
        this.mapInteraction.cancelParkingCoordinatePick();
        break;
      case 'cancelPathDraw':
        this.mapInteraction.cancelPathDraw();
        break;
      case 'deletePathVertex':
        this.panel?.misc?.deletePathVertex();
        break;
      case 'finishPathDraw':
        this.panel?.misc?.finishPathDraw();
        break;
      case 'closePanel':
        this.closePanel();
        break;
      case 'focusOnMap':
        this.mapInteraction.focusActiveFeature();
        break;
      case 'shareFeature':
        this.shareActiveFeature();
        break;
      case 'editGeometry':
        this.mapInteraction.startPolygonEdit();
        break;
      case 'redrawAsPoint':
        this.mapInteraction.startRedrawAsPoint();
        break;
      case 'redrawAsPolygon':
        this.mapInteraction.startRedrawAsPolygon();
        break;
      case 'redrawFromContent':
        this.mapInteraction.redrawGeometryFromOverlays();
        break;
      case 'deleteRequest':
        this.confirmDelete(cmd.event);
        break;
      case 'saveFeature':
        this.onPanelSaveFeature(cmd.feature);
        break;
      case 'imagesChanged':
        this.onPanelImagesChanged();
        break;
      case 'imageEditModeChange':
        this.mapInteraction.onImageEditModeChange(cmd.editMode);
        break;
      case 'imageMapPickChange':
        this.mapInteraction.onImageMapPickChange(cmd.active);
        break;
      case 'coordinatesPreviewChange':
        this.images.refreshFromGallery();
        break;
      case 'imagesLoaded':
        this.images.onGalleryImagesLoaded();
        break;
      case 'focusCoordinates':
        this.images.focusCoordinates(cmd.coordinates);
        break;
      case 'miscEditModeChange':
        this.mapInteraction.onMiscEditModeChange(cmd.editMode);
        break;
      case 'parkingMapPickChange':
        this.mapInteraction.onParkingMapPickChange(cmd.active);
        break;
      case 'pathDrawChange':
        this.mapInteraction.onPathDrawChange(cmd.active);
        break;
      case 'pathDraftChange':
        this.mapInteraction.onPathDraftChange();
        break;
      case 'miscPreviewChange':
        this.mapInteraction.onMiscPreviewChange();
        break;
      case 'miscSaved':
        this.mapInteraction.onMiscSaved(cmd.feature);
        break;
      case 'focusPathGeometry':
        this.mapInteraction.fitMapToPositions(cmd.positions);
        break;
      case 'enterRecord':
        this.recording.enterRecordMode();
        break;
      case 'exitRecord':
        void this.recording.exitRecordModeAsync();
        break;
      case 'pauseRecording':
        this.recording.pauseRecording();
        break;
      case 'resumeRecording':
        this.recording.resumeRecording();
        break;
      case 'finishRecordPath':
        this.recording.finishRecordPath();
        break;
      case 'newRecordPath':
        this.recording.newRecordPath();
        break;
      case 'syncNow':
        void this.recording.onSyncNow();
        break;
      case 'openSessionsPanel':
        this.recording.openSessionsPanel();
        break;
      case 'closeSessionsPanel':
        this.recording.closeSessionsPanel();
        break;
      case 'continueDraft':
        void this.recording.continueDraft(cmd.localId);
        break;
      case 'publishDraft':
        void this.recording.beginPublishDraft(cmd.localId);
        break;
      case 'showDraftOnMap':
        void this.recording.showDraftOnMap(cmd.localId);
        break;
      case 'addRecordImage':
        this.recording.triggerAddRecordImage();
        break;
      case 'editRecordInfo':
        void this.recording.editRecordInfo();
        break;
      case 'deleteDraft':
        this.recording.confirmDeleteDraft(cmd.localId, cmd.event);
        break;
    }
  }

  ngAfterViewInit() {
    this.bindMobileViewport();
    this.rebuildEnumOptions();
    this.recording.init();
    this.transloco.langChanges$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.rebuildEnumOptions();
        this.applyUntitledMapLabels();
        this.layers?.setFeatures(this.features);
        void this.recording.refreshLocalDraftPolygons();
        this.cdr.detectChanges();
      });
    forkJoin([
      this.store.select(selectInstanceSettingsState).pipe(take(1)),
      this.rockExplorerService.getFeaturesGeoJSON(),
    ])
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ([settings, collection]) => {
          this.mapBaseLayers = resolveMapBaseLayers(settings.mapBaseLayers);
          this.mapOverlays = settings.mapOverlays ?? [];
          const defaultId = pickRockExplorerDefaultBaseLayerId(
            this.mapBaseLayers,
          );
          this.ui.initBaseLayers(this.mapBaseLayers, defaultId);
          const defaultBase = this.mapBaseLayers.find(
            (layer) => layer.id === defaultId,
          );
          this.ui.initCustomMapLayers(
            this.mapOverlays,
            defaultBase?.defaultOverlayIds,
          );
          this.features = collection;
          this.loading = false;
          const styleUrl = styleUrlForBaseLayer(
            this.mapBaseLayers,
            this.ui.mapStyle(),
          );
          if (!styleUrl) {
            this.noBaseLayer = true;
            this.cdr.detectChanges();
            return;
          }
          this.cdr.detectChanges();
          this.initMap(styleUrl);
        },
        error: () => {
          this.loading = false;
          this.messageService.add({
            severity: 'error',
            summary: this.transloco.translate(marker('rockExplorer.loadError')),
          });
          this.cdr.detectChanges();
        },
      });
  }

  ngOnDestroy() {
    this.recording.destroy();
    if (this.mobileMediaQuery && this.mobileMediaListener) {
      this.mobileMediaQuery.removeEventListener(
        'change',
        this.mobileMediaListener,
      );
    }
    this.mapInteraction.cancelDragListeners();
    this.images.hideHover({ force: true });
    this.map?.remove();
  }

  /**
   * Bind the mobile viewport media query to the RockExplorerUiService.
   */
  private bindMobileViewport() {
    if (typeof window === 'undefined' || !window.matchMedia) {
      return;
    }
    this.mobileMediaQuery = window.matchMedia('(max-width: 640px)');
    this.ui.isMobileViewport.set(this.mobileMediaQuery.matches);
    this.mobileMediaListener = (event: MediaQueryListEvent) => {
      this.ui.isMobileViewport.set(event.matches);
      this.cdr.detectChanges();
    };
    this.mobileMediaQuery.addEventListener('change', this.mobileMediaListener);
  }

  public onFiltersChange(filters: RockExplorerFilters) {
    this.lastFilters = filters;
    this.reloadFeatures(filters, { fit: true });
  }

  public switchMapStyle(styleId: string) {
    if (!this.map || this.ui.mapStyle() === styleId) {
      return;
    }
    const styleUrl = styleUrlForBaseLayer(this.mapBaseLayers, styleId);
    if (!styleUrl) {
      return;
    }
    this.ui.mapStyle.set(styleId);
    const base = this.mapBaseLayers.find((layer) => layer.id === styleId);
    this.ui.applyBaseLayerDefaultOverlays(base?.defaultOverlayIds);
    this.map.setStyle(styleUrl);
    this.map.once('style.load', () => {
      void this.rebindMapLayers().then(() => {
        this.mapInteraction.reattachAfterStyleReload();
        const editingId = this.ui.editingFeature()?.id;
        if (editingId) {
          this.images.loadFeature(editingId);
        }
      });
    });
  }

  private toggleCustomMapLayers(): void {
    const next = !this.ui.customMapLayersVisible();
    this.ui.customMapLayersVisible.set(next);
    this.customLayers?.setVisibility(next, this.ui.customMapLayerVisibility());
  }

  private setCustomMapLayerOpacity(layerId: string, opacity: number): void {
    this.ui.setCustomMapLayerOpacity(layerId, opacity);
    this.customLayers?.setOpacity(
      layerId,
      this.ui.customMapLayerOpacities()[layerId] ?? opacity,
    );
  }

  private setCustomMapLayerVisible(layerId: string, visible: boolean): void {
    this.ui.setCustomMapLayerVisible(layerId, visible);
    this.customLayers?.setVisibility(
      this.ui.customMapLayersVisible(),
      this.ui.customMapLayerVisibility(),
    );
  }

  private moveCustomMapLayer(layerId: string, direction: 'up' | 'down'): void {
    const orderedIds = this.ui.moveCustomMapLayer(layerId, direction);
    if (!orderedIds) {
      return;
    }
    const byId = new Map(this.mapOverlays.map((layer) => [layer.id, layer]));
    this.mapOverlays = orderedIds
      .map((id) => byId.get(id))
      .filter((layer): layer is MapOverlay => !!layer);
    this.customLayers?.reorder(orderedIds);
    this.layers?.bringOverlaysToFront();
  }

  private onMapContextMenu(event: {
    point: { x: number; y: number };
    originalEvent: Event;
  }): void {
    const original = event.originalEvent;
    if (!(original instanceof MouseEvent)) {
      return;
    }
    original.preventDefault();
    const featureHits =
      this.customLayers?.queryVectorFeaturesAtPoint(event.point) ?? [];
    const infos = this.ui.customMapLayerInfos();
    const hits: {
      name: string;
      color: string;
      overlayName: string;
      attributeLabel?: string;
      legend?: { value: string; color: string }[];
    }[] = [];
    for (const featureHit of featureHits) {
      const overlayId = RockExplorerCustomMapLayers.configIdFromLayerId(
        featureHit.layerId,
      );
      const index = RockExplorerCustomMapLayers.subLayerIndexFromLayerId(
        featureHit.layerId,
      );
      if (index == null) {
        continue;
      }
      const overlay = infos.find((info) => info.id === overlayId);
      const sub = overlay?.subLayers?.find((layer) => layer.index === index);
      if (!sub) {
        continue;
      }
      const color = resolveVectorLayerFeatureColor(sub, featureHit.properties);
      const property = sub.categoricalProperty?.trim();
      const isCategorical =
        sub.paintMode === 'categorical' &&
        !!property &&
        (sub.categoricalStops?.length ?? 0) > 0;
      const rawValue =
        isCategorical && property
          ? featureHit.properties?.[property]
          : undefined;
      hits.push({
        name: sub.name,
        color,
        overlayName: overlay?.name ?? overlayId,
        attributeLabel:
          rawValue == null || rawValue === '' ? undefined : String(rawValue),
        legend: isCategorical ? (sub.categoricalStops ?? []) : undefined,
      });
    }
    if (hits.length === 0) {
      this.vectorIdentify = null;
      this.cdr.detectChanges();
      return;
    }
    this.ignoreVectorIdentifyDocumentClick = true;
    this.vectorIdentify = {
      x: original.clientX,
      y: original.clientY,
      hits,
    };
    this.cdr.detectChanges();
    queueMicrotask(() => {
      this.ignoreVectorIdentifyDocumentClick = false;
    });
  }

  public closeVectorIdentify(): void {
    if (!this.vectorIdentify) {
      return;
    }
    this.vectorIdentify = null;
  }

  @HostListener('document:keydown.escape')
  onEscapeCloseVectorIdentify(): void {
    this.closeVectorIdentify();
  }

  @HostListener('document:click', ['$event'])
  onDocumentClickCloseVectorIdentify(event: MouseEvent): void {
    if (this.ignoreVectorIdentifyDocumentClick || event.button !== 0) {
      return;
    }
    this.closeVectorIdentify();
  }

  public onPanelSaveFeature(feature: RockExplorerFeature) {
    if (!this.draftGeometry && !this.ui.editingFeature()) {
      return;
    }
    feature.geometry = (this.draftGeometry ||
      this.ui.editingFeature()!.geometry) as Geometry;

    // Keep the in-memory Record session + local draft in sync so Publish
    // can prefill title / potential / description.
    this.recording.syncRecordingSessionFromEditedFeature(feature);

    this.ui.saving.set(true);
    const request$ = feature.id
      ? this.rockExplorerService.updateFeature(feature)
      : this.rockExplorerService.createFeature(feature);

    request$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (saved) => {
        this.ui.saving.set(false);
        this.mapInteraction.setRockExplorerDrawMode('select');
        this.reloadFeatures(this.lastFilters);
        this.messageService.add({
          severity: 'success',
          summary: this.transloco.translate(marker('rockExplorer.saveSuccess')),
        });
        this.recording.syncRecordingSessionFromEditedFeature(saved);
        void this.recording.persistAndSync(true);
        if (saved?.id) {
          this.applyFeatureToPanel(saved, false);
        } else {
          this.closePanel();
        }
      },
      error: () => {
        this.ui.saving.set(false);
        this.messageService.add({
          severity: 'error',
          summary: this.transloco.translate(marker('rockExplorer.saveError')),
        });
      },
    });
  }

  public onPanelImagesChanged(): void {
    this.reloadFeatures(this.lastFilters);
    // Prefer in-memory gallery geotags so dots don't vanish while a refetch runs.
    if (this.panel?.gallery) {
      this.images.refreshFromGallery();
    } else if (this.ui.editingFeature()?.id) {
      this.images.loadFeature(this.ui.editingFeature().id);
    }
  }

  /**
   * Persist `geometry` onto `feature` for the map-interaction collaborator
   * (update request + toasts + feature reload + panel refresh). Resolves
   * true on success so the caller can reset its own draw/edit state.
   */
  private persistFeatureGeometry(
    feature: RockExplorerFeature,
    geometry: Geometry,
  ): Promise<boolean> {
    feature.geometry = geometry;
    this.ui.saving.set(true);
    this.cdr.detectChanges();
    return new Promise<boolean>((resolve) => {
      this.rockExplorerService
        .updateFeature(feature)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (saved) => {
            this.ui.saving.set(false);
            this.reloadFeatures(this.lastFilters);
            this.messageService.add({
              severity: 'success',
              summary: this.transloco.translate(
                marker('rockExplorer.saveSuccess'),
              ),
            });
            if (saved?.id) {
              this.applyFeatureToPanel(saved, false);
            }
            this.cdr.detectChanges();
            resolve(true);
          },
          error: () => {
            this.ui.saving.set(false);
            this.messageService.add({
              severity: 'error',
              summary: this.transloco.translate(
                marker('rockExplorer.saveError'),
              ),
            });
            this.cdr.detectChanges();
            resolve(false);
          },
        });
    });
  }

  private deleteFeature() {
    if (!this.ui.editingFeature()) {
      return;
    }
    this.rockExplorerService
      .deleteFeature(this.ui.editingFeature())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.closePanel();
          this.reloadFeatures(this.lastFilters);
          this.messageService.add({
            severity: 'success',
            summary: this.transloco.translate(
              marker('rockExplorer.deleteSuccess'),
            ),
          });
        },
        error: () => {
          this.messageService.add({
            severity: 'error',
            summary: this.transloco.translate(
              marker('rockExplorer.deleteError'),
            ),
          });
        },
      });
  }

  public confirmDelete(event: Event) {
    if (!this.ui.editingFeature()?.id) {
      return;
    }
    this.confirmationService.confirm({
      target: event.currentTarget ?? event.target,
      message: this.transloco.translate(marker('rockExplorer.deleteConfirm')),
      acceptLabel: this.transloco.translate(
        marker('rockExplorer.imageDeleteYes'),
      ),
      acceptButtonStyleClass: 'p-button-danger',
      rejectLabel: this.transloco.translate(
        marker('rockExplorer.imageDeleteNo'),
      ),
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.deleteFeature();
      },
    });
  }

  public closePanel(options?: { skipUrlSync?: boolean }) {
    this.ui.panelOpen.set(false);
    this.miscEditMode = false;
    this.mapInteraction.cancelImageCoordinatePick();
    this.mapInteraction.cancelParkingCoordinatePick();
    this.mapInteraction.cancelPathDraw();
    this.ui.resetPanelSession();
    this.draftGeometry = null;
    this.layers?.clearDraft();
    this.images.clearFeature();
    this.layers?.clearMiscOverlays(this.ui.isPolygonToolActive());
    this.applySelectionFilters();
    if (!options?.skipUrlSync) {
      this.syncFeatureUrl(null);
    }
  }

  /** Feature panel and sessions panel are mutually exclusive. */
  private closeSessionsPanelIfOpen(): void {
    if (this.ui.sessionsPanelOpen()) {
      this.ui.sessionsPanelOpen.set(false);
    }
  }

  private initMap(styleUrl: string) {
    const el = this.mapContainer?.nativeElement;
    if (!el) {
      return;
    }
    // Create the map outside Angular — otherwise every pointer event (including
    // MapLibre internals) re-enters the zone and thrash-detects the open panel.
    this.ngZone.runOutsideAngular(() => {
      this.map = new MaplibreMap({
        container: el,
        style: styleUrl,
        center: [10, 50],
        zoom: 5,
      });
      this.map.addControl(new NavigationControl({}), 'top-right');
      this.geolocateControl = new GeolocateControl({
        positionOptions: { enableHighAccuracy: true },
        trackUserLocation: true,
        showAccuracyCircle: true,
        fitBoundsOptions: { maxZoom: 30 },
      });
      this.map.addControl(this.geolocateControl, 'top-right');
      if (mockGpsRecording) {
        void this.recording.ensureMockGps().then((mock) => {
          mock?.installNavigatorShim(() => {
            const c = this.map?.getCenter();
            return c ? { lat: c.lat, lng: c.lng } : undefined;
          });
        });
      }
      this.map.on('load', () => {
        void this.rebindMapLayers().then(() => {
          this.fitToFeatures();
          this.flushPendingDeepLink();
        });
        this.map!.on('mousedown', ROCK_EXPLORER_LAYERS.draftPoints, (event) =>
          this.mapInteraction.onDraftVertexMouseDown(event),
        );
        this.map!.on('mousedown', ROCK_EXPLORER_LAYERS.parking, (event) =>
          this.mapInteraction.onParkingMarkerMouseDown(event),
        );
        this.map!.on('mouseenter', ROCK_EXPLORER_LAYERS.draftPoints, () => {
          if (
            (this.ui.isPolygonToolActive() || this.ui.drawingPath()) &&
            this.map
          ) {
            this.map.getCanvas().style.cursor = 'grab';
          }
        });
        this.map!.on('mouseleave', ROCK_EXPLORER_LAYERS.draftPoints, () => {
          if (!this.mapInteraction.isDraggingVertex && this.map) {
            this.map.getCanvas().style.cursor = this.ui.drawingPath()
              ? 'crosshair'
              : '';
          }
        });
        this.map!.on('mouseenter', ROCK_EXPLORER_LAYERS.parking, () => {
          if (this.mapInteraction.canDragParkingMarkers() && this.map) {
            this.map.getCanvas().style.cursor = 'grab';
          }
        });
        this.map!.on('mouseleave', ROCK_EXPLORER_LAYERS.parking, () => {
          if (
            !this.mapInteraction.isDraggingVertex &&
            !this.mapInteraction.isDraggingParking &&
            this.map &&
            !this.mapInteraction.isMapOverlayInteractionActive
          ) {
            this.map.getCanvas().style.cursor = '';
          }
        });
        this.map!.on(
          'mousemove',
          ROCK_EXPLORER_LAYERS.imageLocations,
          (event) => this.images.onMouseMove(event),
        );
        this.map!.on('mouseleave', ROCK_EXPLORER_LAYERS.imageLocations, () =>
          this.images.onMouseLeave(),
        );
        this.map!.on('click', ROCK_EXPLORER_LAYERS.imageLocations, (event) =>
          this.ngZone.run(() => this.images.onClick(event)),
        );
        for (const clusterLayerId of [
          ROCK_EXPLORER_LAYERS.imageClusters,
          ROCK_EXPLORER_LAYERS.imageClusterCount,
        ]) {
          this.map!.on('mouseenter', clusterLayerId, () => {
            if (this.map) {
              this.map.getCanvas().style.cursor = 'pointer';
            }
          });
          this.map!.on('mousemove', clusterLayerId, (event) =>
            this.images.onMouseMove(event),
          );
          this.map!.on('mouseleave', clusterLayerId, () =>
            this.images.onMouseLeave(),
          );
          this.map!.on('click', clusterLayerId, (event) =>
            this.ngZone.run(() => this.images.onClick(event)),
          );
        }
        this.map!.on('click', (event) => {
          this.ngZone.run(() => {
            this.closeVectorIdentify();
            this.mapInteraction.onMapClick(event);
          });
        });
        this.map!.on('contextmenu', (event) => {
          event.preventDefault();
          this.ngZone.run(() => this.onMapContextMenu(event));
        });
        this.map!.on('click', ROCK_EXPLORER_LAYERS.points, (event) =>
          this.ngZone.run(() =>
            this.mapInteraction.onFeatureSelectClick(event),
          ),
        );
        this.map!.on('click', ROCK_EXPLORER_LAYERS.polygonsFill, (event) =>
          this.ngZone.run(() =>
            this.mapInteraction.onFeatureSelectClick(event),
          ),
        );
        this.map!.on('click', ROCK_EXPLORER_LAYERS.localDraftsFill, (event) =>
          this.ngZone.run(() => this.mapInteraction.onLocalDraftClick(event)),
        );
        this.map!.on('mouseenter', ROCK_EXPLORER_LAYERS.localDraftsFill, () => {
          if (this.map) {
            this.map.getCanvas().style.cursor = 'pointer';
          }
        });
        this.map!.on('mouseleave', ROCK_EXPLORER_LAYERS.localDraftsFill, () => {
          if (this.map && !this.ui.isDrawToolActive()) {
            this.map.getCanvas().style.cursor = '';
          }
        });
      });
    });
  }

  private async rebindMapLayers(): Promise<void> {
    if (!this.map) {
      return;
    }
    // Custom rasters first so feature overlays stay above them.
    this.customLayers = new RockExplorerCustomMapLayers(this.map);
    this.customLayers.apply(
      this.mapOverlays,
      this.ui.customMapLayersVisible(),
      this.ui.customMapLayerOpacities(),
      this.ui.customMapLayerVisibility(),
    );
    this.layers = new RockExplorerMapLayers(this.map);
    this.applyUntitledMapLabels();
    await this.layers.addAll(this.features);
    this.images.reattachToLayers();
    this.applySelectionFilters();
    await this.recording.refreshLocalDraftPolygons();
    await this.images.refreshDraftPins();
  }

  private applyUntitledMapLabels(): void {
    this.layers?.setUntitledLabels(
      this.transloco.translate(marker('rockExplorer.untitledFeature')),
      this.transloco.translate(marker('rockExplorer.untitledDraft')),
    );
  }

  public openEditPanel(id: string, options?: { focus?: boolean }) {
    if (this.ui.panelOpen() && this.ui.editingFeature()?.id === id) {
      if (options?.focus) {
        this.mapInteraction.focusActiveFeature();
      }
      return;
    }
    this.rockExplorerService
      .getFeature(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (feature) => {
          this.applyFeatureToPanel(feature, false);
          if (options?.focus) {
            queueMicrotask(() => this.mapInteraction.focusActiveFeature());
          }
        },
        error: () => {
          this.pendingDeepLinkFeatureId = null;
          this.messageService.add({
            severity: 'error',
            summary: this.transloco.translate(
              marker('rockExplorer.featureNotFound'),
            ),
          });
          this.syncFeatureUrl(null);
        },
      });
  }

  private applyFeatureToPanel(
    feature: RockExplorerFeature,
    formActive: boolean,
  ) {
    this.closeSessionsPanelIfOpen();
    this.ui.featureFormActive.set(formActive);
    this.ui.editingFeature.set(feature);
    this.draftGeometry = feature.geometry;
    this.ui.panelOpen.set(true);
    this.applySelectionFilters();
    // No panel misc tab yet for a freshly opened feature — mapInteraction's
    // preview refresh falls back to rendering straight from the feature.
    this.mapInteraction.onMiscPreviewChange();
    if (feature.id) {
      this.images.loadFeature(feature.id);
    }
    this.syncFeatureUrl(feature.id ?? null);
    this.cdr.detectChanges();
    queueMicrotask(() => this.panel?.showFeature(feature, formActive));
  }

  private onFeatureRouteParam(featureId: string | null) {
    const currentId = this.ui.editingFeature()?.id ?? null;
    if (featureId === currentId) {
      return;
    }
    if (featureId) {
      if (!this.map) {
        this.pendingDeepLinkFeatureId = featureId;
        return;
      }
      this.openEditPanel(featureId, { focus: true });
      return;
    }
    this.pendingDeepLinkFeatureId = null;
    if (this.ui.panelOpen() && currentId) {
      this.closePanel({ skipUrlSync: true });
    }
  }

  private flushPendingDeepLink() {
    const id = this.pendingDeepLinkFeatureId;
    if (!id) {
      return;
    }
    this.pendingDeepLinkFeatureId = null;
    this.openEditPanel(id, { focus: true });
  }

  private syncFeatureUrl(featureId: string | null) {
    const current = this.route.snapshot.paramMap.get('featureId');
    if ((featureId ?? null) === (current ?? null)) {
      return;
    }
    this.syncingFeatureUrl = true;
    void this.router
      .navigate(
        featureId ? ['/rock-explorer', featureId] : ['/rock-explorer'],
        {
          replaceUrl: true,
        },
      )
      .finally(() => {
        this.syncingFeatureUrl = false;
      });
  }

  private shareActiveFeature() {
    const id = this.ui.editingFeature()?.id;
    if (!id) {
      return;
    }
    const path = this.router.serializeUrl(
      this.router.createUrlTree(['/rock-explorer', id]),
    );
    this.clipboardService.copyTextToClipboard(
      `${window.location.origin}${path}`,
      {
        successSummary: this.transloco.translate(
          marker('rockExplorer.shareSuccessTitle'),
        ),
        successDetail: this.transloco.translate(
          marker('rockExplorer.shareSuccessDetail'),
        ),
      },
    );
  }

  private rebuildEnumOptions() {
    this.ui.potentialOptions.set(
      Object.values(RockExplorerPotential).map((value) => ({
        value,
        label: this.transloco.translate(`rockExplorer.potential.${value}`),
      })),
    );
    this.ui.rockQualityOptions.set(
      Object.values(RockExplorerRockQuality).map((value) => ({
        value,
        label: this.transloco.translate(`rockExplorer.rockQuality.${value}`),
      })),
    );
    this.ui.rockTypeOptions.set(
      Object.values(RockExplorerRockType).map((value) => ({
        value,
        label: this.transloco.translate(`rockExplorer.rockType.${value}`),
      })),
    );
  }

  private reloadFeatures(
    filters: {
      potential?: string;
      rockQuality?: string;
      rockType?: string;
    } = {},
    options: { fit?: boolean } = {},
  ) {
    this.rockExplorerService
      .getFeaturesGeoJSON(filters)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((collection) => {
        this.features = collection;
        this.layers?.setFeatures(collection);
        if (options.fit) {
          this.fitToFeatures();
        }
      });
  }

  private applySelectionFilters() {
    const id = this.ui.editingFeature()?.id;
    this.layers?.applySelectionFilters(id ? [id] : []);
  }

  private fitToFeatures() {
    if (!this.map) {
      return;
    }
    const combined: FeatureCollection<Geometry> = {
      type: 'FeatureCollection',
      features: [
        ...this.features.features,
        ...this.recording.localDraftFeatures.features,
      ],
    };
    if (combined.features.length === 0) {
      return;
    }
    fitMapToFeatureCollection(this.map, combined, {
      padding: 48,
      maxZoom: 16,
      duration: 700,
    });
  }
}
