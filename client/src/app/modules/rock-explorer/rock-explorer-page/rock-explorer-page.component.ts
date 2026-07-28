import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  DestroyRef,
  ElementRef,
  NgZone,
  OnDestroy,
  ViewChild,
  inject,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import {
  GeolocateControl,
  GeoJSONSource,
  LngLatBounds,
  Map as MaplibreMap,
  MapLayerMouseEvent,
  MapMouseEvent,
  NavigationControl,
  Popup,
} from 'maplibre-gl';
import { Feature, FeatureCollection, Geometry, Position } from 'geojson';
import { Button } from 'primeng/button';
import { Select } from 'primeng/select';
import { MultiSelect } from 'primeng/multiselect';
import { InputText } from 'primeng/inputtext';
import { Textarea } from 'primeng/textarea';
import { Toast } from 'primeng/toast';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ConfirmPopup } from 'primeng/confirmpopup';
import { Badge } from 'primeng/badge';
import { Popover } from 'primeng/popover';
import { Tab, TabList, TabPanel, TabPanels, Tabs } from 'primeng/tabs';
import {
  TranslocoDirective,
  TranslocoPipe,
  TranslocoService,
} from '@jsverse/transloco';
import { marker } from '@jsverse/transloco-keys-manager/marker';
import { Store } from '@ngrx/store';
import { forkJoin } from 'rxjs';
import { take } from 'rxjs/operators';
import { selectInstanceSettingsState } from '../../../ngrx/selectors/instance-settings.selectors';
import { MapStyles } from '../../../enums/map-styles';
import { RockExplorerService } from '../../../services/crud/rock-explorer.service';
import { GalleryService } from '../../../services/crud/gallery.service';
import { ScalesService } from '../../../services/crud/scales.service';
import { GalleryImage } from '../../../models/gallery-image';
import { RockExplorerFeature } from '../../../models/rock-explorer-feature';
import { ObjectType } from '../../../models/object';
import { Searchable } from '../../../models/searchable';
import { Tag } from '../../../models/tag';
import { Grade, Scale } from '../../../models/scale';
import { Coordinates } from '../../../interfaces/coordinates.interface';
import { RockExplorerPotential } from '../../../enums/rock-explorer-potential';
import { RockExplorerRockQuality } from '../../../enums/rock-explorer-rock-quality';
import { RockExplorerRockType } from '../../../enums/rock-explorer-rock-type';
import { RockExplorerAccessIssue } from '../../../enums/rock-explorer-access-issue';
import { LineType } from '../../../enums/line-type';
import { RockExplorerCommentsComponent } from '../rock-explorer-comments/rock-explorer-comments.component';
import { RockExplorerGalleryComponent } from '../rock-explorer-gallery/rock-explorer-gallery.component';
import { RockExplorerMiscComponent } from '../rock-explorer-misc/rock-explorer-misc.component';
import { TranslateSpecialGradesPipe } from '../../shared/pipes/translate-special-grades.pipe';
import { TagComponent } from '../../shared/components/tag/tag.component';
import { TagInputComponent } from '../../shared/forms/controls/tag-input/tag-input.component';
import { HasPermissionDirective } from '../../shared/directives/has-permission.directive';
import { FormDirective } from '../../shared/forms/form.directive';
import { ControlGroupDirective } from '../../shared/forms/control-group.directive';
import { FormControlDirective } from '../../shared/forms/form-control.directive';
import { IfErrorDirective } from '../../shared/forms/if-error.directive';
import { UserAvatarComponent } from '../../shared/components/user-avatar/user-avatar.component';
import { gradeRangeValidator } from '../../../utility/validators/grade-range.validator';
import { RouterLink } from '@angular/router';

type DrawMode = 'select' | 'point' | 'polygon' | 'editPolygon';
type SelectOption = { label: string; value: string };
type PanelTab = 'info' | 'images' | 'comments' | 'misc';

const POTENTIAL_FILL_COLORS: Record<string, string> = {
  // Warm amber/yellow scale — greens disappear into satellite foliage.
  HIGH: '#ea580c',
  MEDIUM: '#f59e0b',
  LOW: '#fde047',
  NONE: '#9ca3af',
  UNEXPLORED: '#3b82f6',
};

const POTENTIAL_OUTLINE_COLORS: Record<string, string> = {
  HIGH: '#9a3412',
  MEDIUM: '#b45309',
  LOW: '#ca8a04',
  NONE: '#6b7280',
  UNEXPLORED: '#1d4ed8',
};

@Component({
  selector: 'lc-rock-explorer-page',
  imports: [
    ReactiveFormsModule,
    Button,
    Select,
    MultiSelect,
    InputText,
    Textarea,
    Toast,
    ConfirmPopup,
    Badge,
    Popover,
    Tabs,
    TabList,
    Tab,
    TabPanels,
    TabPanel,
    TranslocoDirective,
    TranslocoPipe,
    RockExplorerCommentsComponent,
    RockExplorerGalleryComponent,
    RockExplorerMiscComponent,
    TranslateSpecialGradesPipe,
    TagComponent,
    TagInputComponent,
    HasPermissionDirective,
    FormDirective,
    ControlGroupDirective,
    FormControlDirective,
    IfErrorDirective,
    UserAvatarComponent,
    RouterLink,
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './rock-explorer-page.component.html',
  styleUrl: './rock-explorer-page.component.scss',
})
export class RockExplorerPageComponent implements AfterViewInit, OnDestroy {
  @ViewChild('map') private mapContainer?: ElementRef<HTMLElement>;
  @ViewChild('panelGallery') panelGallery?: RockExplorerGalleryComponent;
  @ViewChild('panelMisc') panelMisc?: RockExplorerMiscComponent;
  @ViewChild(FormDirective) private featureFormDirective?: FormDirective;

  public mapStyle: MapStyles = MapStyles.TOPO;
  public readonly MapStyles = MapStyles;
  public drawMode: DrawMode = 'select';
  public showFilters = false;
  public panelOpen = false;
  /** When false, existing features open in read-only info view (not the edit form). */
  public featureFormActive = false;
  public panelActiveTab: PanelTab = 'info';
  public panelImageCount = 0;
  public panelCommentCount = 0;
  public imageEditMode = false;
  public miscEditMode = false;
  public pickingImageCoordinates = false;
  public pickingParkingCoordinates = false;
  public drawingPath = false;
  /** Mobile: hide the panel while picking so the map can be clicked. */
  public mapPickHidesPanel = false;
  /**
   * True for the rest of a map click after an image GPS pick is handled.
   * Prevents a second layer handler (point + polygon under the same click)
   * from opening a feature once pick mode has already ended.
   */
  private consumingImageMapPick = false;
  private consumingParkingMapPick = false;
  public saving = false;
  public loading = true;
  public noApiKey = false;
  public isMobileViewport = false;
  public overflowMenuOpen = false;

  public potentialOptions: SelectOption[] = [];
  public rockQualityOptions: SelectOption[] = [];
  public rockTypeOptions: SelectOption[] = [];
  public accessIssueOptions: SelectOption[] = [];
  public lineTypeOptions: SelectOption[] = [];
  public scaleOptions: SelectOption[] = [];
  public gradeOptions: Grade[] = [];
  public mapStyleOptions = [
    { value: MapStyles.TOPO, labelKey: marker('rockExplorer.mapStyle.topo') },
    {
      value: MapStyles.SATELLITE,
      labelKey: marker('rockExplorer.mapStyle.satellite'),
    },
  ];

  public filterForm = inject(FormBuilder).group({
    potential: [null as string | null],
    rockQuality: [null as string | null],
    rockType: [null as string | null],
  });

  public featureForm = inject(FormBuilder).group({
    title: ['', [Validators.maxLength(120)]],
    description: [''],
    potential: [null as string | null, Validators.required],
    rockQuality: [null as string | null],
    rockType: [null as string | null],
    gradeLineType: [null as string | null],
    gradeScale: [null as string | null],
    gradeValueMin: [null as number | null],
    gradeValueMax: [null as number | null, gradeRangeValidator()],
    accessIssues: [[] as string[]],
    topoLinks: [[] as Searchable[]],
  });

  public editingFeature: RockExplorerFeature | null = null;

  private map?: MaplibreMap;
  private apiKey = '';
  private features: FeatureCollection<Geometry> = {
    type: 'FeatureCollection',
    features: [],
  };
  private draftGeometry: Geometry | null = null;
  private polygonVertices: Position[] = [];
  /** Feature being reshaped in `editPolygon` mode (panel may be closed). */
  private geometryEditFeature: RockExplorerFeature | null = null;
  private draggingVertexIndex: number | null = null;
  /** True once the pointer moved while dragging a draft vertex. */
  private vertexDragMoved = false;
  private draggingParkingId: string | null = null;
  /** Coalesce map source updates to one per animation frame while dragging. */
  private dragFrameId: number | null = null;
  private pendingDragLngLat: { lat: number; lng: number } | null = null;
  /** Reused FeatureCollection during drag (mutate coords in place, avoid alloc). */
  private dragOverlayCollection: FeatureCollection<Geometry> | null = null;
  private suppressNextMapClick = false;
  private destroyRef = inject(DestroyRef);
  private ngZone = inject(NgZone);
  private store = inject(Store);
  private rockExplorerService = inject(RockExplorerService);
  private galleryService = inject(GalleryService);
  private scalesService = inject(ScalesService);
  private cdr = inject(ChangeDetectorRef);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);
  private transloco = inject(TranslocoService);
  private mobileMediaQuery?: MediaQueryList;
  private mobileMediaListener?: (event: MediaQueryListEvent) => void;
  private groupedScales: Record<LineType, Scale[]> = {
    [LineType.BOULDER]: [],
    [LineType.SPORT]: [],
    [LineType.TRAD]: [],
  };
  private gradeCascadeReady = false;
  private suppressGradeCascade = false;
  private imageLocationsRequestId = 0;
  private imageLocationsData: FeatureCollection<Geometry> = {
    type: 'FeatureCollection',
    features: [],
  };
  private imageHoverPopup: Popup | null = null;
  private imageHoverFeatureKey: string | null = null;

  public get activeFilterCount(): number {
    const value = this.filterForm.getRawValue();
    return [value.potential, value.rockQuality, value.rockType].filter(
      (v) => v != null && v !== '',
    ).length;
  }

  public get hasActiveFilters(): boolean {
    return this.activeFilterCount > 0;
  }

  public get polygonVertexCount(): number {
    return this.polygonVertices.length;
  }

  public get isPolygonToolActive(): boolean {
    return this.drawMode === 'polygon' || this.drawMode === 'editPolygon';
  }

  /** Point or polygon drawing — hides the default toolbar chrome. */
  public get isDrawToolActive(): boolean {
    return this.drawMode === 'point' || this.isPolygonToolActive;
  }

  public get isCoordinatePickActive(): boolean {
    return this.pickingImageCoordinates || this.pickingParkingCoordinates;
  }

  public get isMapOverlayInteractionActive(): boolean {
    return this.isCoordinatePickActive || this.drawingPath;
  }

  ngAfterViewInit() {
    this.bindMobileViewport();
    this.rebuildEnumOptions();
    this.filterForm.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.applyFilters();
        this.cdr.detectChanges();
      });
    this.transloco.langChanges$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.rebuildEnumOptions();
        this.rebuildLineTypeOptions();
        this.cdr.detectChanges();
      });
    forkJoin([
      this.store.select(selectInstanceSettingsState).pipe(take(1)),
      this.rockExplorerService.getFeaturesGeoJSON(),
      this.scalesService.getScales(),
    ])
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ([settings, collection, scales]) => {
          this.apiKey = settings.maptilerApiKey;
          this.features = collection;
          this.initGradeCascade(scales);
          this.loading = false;
          if (!this.apiKey) {
            this.noApiKey = true;
            this.cdr.detectChanges();
            return;
          }
          this.cdr.detectChanges();
          this.initMap();
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
    if (this.mobileMediaQuery && this.mobileMediaListener) {
      this.mobileMediaQuery.removeEventListener(
        'change',
        this.mobileMediaListener,
      );
    }
    this.cancelDragFrame();
    this.hideImageHoverPopup();
    this.map?.remove();
  }

  public setDrawMode(mode: DrawMode) {
    this.endVertexDrag();
    this.cancelImageCoordinatePick();
    this.drawMode = mode;
    this.polygonVertices = [];
    this.geometryEditFeature = null;
    this.clearDraftLayer();
    if (mode === 'point' || mode === 'polygon') {
      this.showFilters = false;
      this.closePanel();
    }
    this.cdr.detectChanges();
  }

  public undoPolygonVertex() {
    if (this.drawMode !== 'polygon' || this.polygonVertices.length === 0) {
      return;
    }
    this.polygonVertices.pop();
    this.renderPolygonDraft();
  }

  public cancelPolygonDraw() {
    const resumeFeatureId = this.geometryEditFeature?.id ?? null;
    this.endVertexDrag();
    this.polygonVertices = [];
    this.clearDraftLayer();
    this.geometryEditFeature = null;
    this.drawMode = 'select';
    if (resumeFeatureId) {
      this.openEditPanel(resumeFeatureId);
    }
    this.cdr.detectChanges();
  }

  public cancelPointDraw() {
    this.setDrawMode('select');
  }

  public startPolygonEdit() {
    const feature = this.editingFeature;
    const geometry = feature?.geometry;
    if (!feature?.id || geometry?.type !== 'Polygon') {
      return;
    }
    const ring = geometry.coordinates[0] ?? [];
    if (ring.length < 4) {
      return;
    }
    // Drop the closing duplicate of the ring.
    this.polygonVertices = ring
      .slice(0, -1)
      .map((coord) => [coord[0], coord[1]]);
    this.geometryEditFeature = feature;
    this.drawMode = 'editPolygon';
    this.showFilters = false;
    this.panelOpen = false;
    this.featureFormActive = false;
    this.renderPolygonDraft();
    this.focusActiveFeature();
    this.cdr.detectChanges();
  }

  private applyTopoLinksToEntity(entity: RockExplorerFeature) {
    const searchables =
      (this.featureForm.getRawValue().topoLinks as Searchable[]) ?? [];
    entity.topoLinks = searchables.map(Tag.fromSearchable);
  }

  private bindMobileViewport() {
    if (typeof window === 'undefined' || !window.matchMedia) {
      return;
    }
    this.mobileMediaQuery = window.matchMedia('(max-width: 640px)');
    this.isMobileViewport = this.mobileMediaQuery.matches;
    this.mobileMediaListener = (event: MediaQueryListEvent) => {
      this.isMobileViewport = event.matches;
      if (!event.matches) {
        this.overflowMenuOpen = false;
      }
      this.cdr.detectChanges();
    };
    this.mobileMediaQuery.addEventListener('change', this.mobileMediaListener);
  }

  public toggleFilters() {
    this.showFilters = !this.showFilters;
  }

  public applyFilters() {
    const value = this.filterForm.getRawValue();
    this.reloadFeatures(
      {
        potential: value.potential || undefined,
        rockQuality: value.rockQuality || undefined,
        rockType: value.rockType || undefined,
      },
      { fit: true },
    );
  }

  public clearFilters() {
    this.filterForm.reset({
      potential: null,
      rockQuality: null,
      rockType: null,
    });
  }

  public switchMapStyle(style: MapStyles) {
    if (!this.map || !this.apiKey || this.mapStyle === style) {
      return;
    }
    this.mapStyle = style;
    const url = this.styleUrl(style);
    this.map.setStyle(url);
    this.map.once('style.load', () => {
      this.loadParkingIcon()
        .catch(() => undefined)
        .finally(() => {
          this.addFeatureLayers();
          this.setFeatureData(this.features);
          if (this.isPolygonToolActive) {
            this.renderPolygonDraft();
          } else if (this.draftGeometry && this.featureFormActive) {
            this.renderDraftGeometry(this.draftGeometry);
          } else if (this.drawingPath) {
            this.refreshMiscOverlays();
          }
          if (this.editingFeature?.id) {
            this.loadFeatureImageLocations(this.editingFeature.id);
            this.refreshMiscOverlays();
          }
        });
    });
  }

  public saveFeature() {
    if (!this.draftGeometry && !this.editingFeature) {
      return;
    }
    if (this.featureForm.invalid) {
      this.featureForm.markAllAsTouched();
      this.featureFormDirective?.markAsTouched();
      return;
    }
    const raw = this.featureForm.getRawValue();
    const feature = this.editingFeature
      ? this.editingFeature
      : new RockExplorerFeature();
    if (!feature.parkingSites) {
      feature.parkingSites = [];
    }
    if (!feature.paths) {
      feature.paths = [];
    }
    feature.title = raw.title?.trim() || null;
    feature.description = raw.description?.trim() || null;
    feature.potential = raw.potential as RockExplorerPotential;
    feature.rockQuality = (raw.rockQuality as RockExplorerRockQuality) || null;
    feature.rockType = (raw.rockType as RockExplorerRockType) || null;
    feature.gradeLineType = (raw.gradeLineType as LineType) || null;
    feature.gradeScale = raw.gradeScale || null;
    feature.gradeValueMin = raw.gradeValueMin;
    feature.gradeValueMax = raw.gradeValueMax;
    feature.accessIssues = (raw.accessIssues ||
      []) as RockExplorerAccessIssue[];
    feature.geometry = (this.draftGeometry ||
      this.editingFeature!.geometry) as Geometry;
    this.applyTopoLinksToEntity(feature);

    this.saving = true;
    const request$ = feature.id
      ? this.rockExplorerService.updateFeature(feature)
      : this.rockExplorerService.createFeature(feature);

    request$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (saved) => {
        this.saving = false;
        this.setDrawMode('select');
        this.reloadFeatures(this.currentFilters());
        this.messageService.add({
          severity: 'success',
          summary: this.transloco.translate(marker('rockExplorer.saveSuccess')),
        });
        if (saved?.id) {
          this.applyFeatureToPanel(saved, false);
        } else {
          this.closePanel();
        }
      },
      error: () => {
        this.saving = false;
        this.messageService.add({
          severity: 'error',
          summary: this.transloco.translate(marker('rockExplorer.saveError')),
        });
      },
    });
  }

  public enterFeatureEdit() {
    if (!this.editingFeature?.id) {
      return;
    }
    this.featureFormActive = true;
    this.patchFeatureForm(this.editingFeature);
    this.cdr.detectChanges();
  }

  public onPanelTabChange(tab: string | number): void {
    if (tab !== 'images' && this.panelGallery?.editMode) {
      this.panelGallery.cancelEdit();
    }
    if (tab !== 'misc' && this.panelMisc?.editMode) {
      this.panelMisc.cancelEdit();
    }
  }

  public onImageEditModeChange(editMode: boolean): void {
    this.imageEditMode = editMode;
    if (!editMode) {
      this.setImageCoordinatePickActive(false);
    }
  }

  public onImageMapPickChange(active: boolean): void {
    if (active) {
      this.cancelParkingCoordinatePick();
      this.cancelPathDraw();
    }
    this.setImageCoordinatePickActive(active);
  }

  public onMiscEditModeChange(editMode: boolean): void {
    this.miscEditMode = editMode;
    if (!editMode) {
      this.cancelParkingCoordinatePick();
      this.cancelPathDraw();
    }
  }

  public onParkingMapPickChange(active: boolean): void {
    if (active) {
      this.cancelImageCoordinatePick();
      this.cancelPathDraw();
    }
    this.setParkingCoordinatePickActive(active);
  }

  public onPathDrawChange(active: boolean): void {
    if (active) {
      this.cancelImageCoordinatePick();
      this.cancelParkingCoordinatePick();
      if (this.drawMode !== 'select') {
        this.setDrawMode('select');
      }
      this.map?.doubleClickZoom.disable();
    } else {
      this.map?.doubleClickZoom.enable();
    }
    this.drawingPath = active;
    this.mapPickHidesPanel = active && this.isMobileViewport;
    if (
      this.map &&
      this.draggingVertexIndex == null &&
      !this.isPolygonToolActive
    ) {
      this.map.getCanvas().style.cursor = active ? 'crosshair' : '';
    }
    this.refreshMiscOverlays();
    this.cdr.detectChanges();
  }

  public onMiscPreviewChange(): void {
    this.refreshMiscOverlays();
    this.cdr.detectChanges();
  }

  public onMiscSaved(feature: RockExplorerFeature): void {
    if (this.editingFeature && feature.id === this.editingFeature.id) {
      this.editingFeature.parkingSites = feature.parkingSites;
      this.editingFeature.paths = feature.paths;
    }
    this.refreshMiscOverlays();
  }

  public cancelParkingCoordinatePick(): void {
    this.panelMisc?.cancelMapPick();
    this.setParkingCoordinatePickActive(false);
  }

  public cancelPathDraw(): void {
    this.panelMisc?.cancelPathDraw();
    this.drawingPath = false;
    this.map?.doubleClickZoom.enable();
    this.mapPickHidesPanel =
      this.isCoordinatePickActive && this.isMobileViewport;
    if (
      this.map &&
      this.draggingVertexIndex == null &&
      !this.isPolygonToolActive
    ) {
      this.map.getCanvas().style.cursor = this.isCoordinatePickActive
        ? 'crosshair'
        : '';
    }
  }

  public cancelImageCoordinatePick(): void {
    this.panelGallery?.cancelMapPick();
    this.setImageCoordinatePickActive(false);
  }

  public refreshImageLocationsFromGallery(): void {
    if (!this.panelGallery) {
      return;
    }
    this.setImageLocationsData({
      type: 'FeatureCollection',
      features: this.panelGallery.getGeotaggedMapFeatures(),
    });
  }

  public onPanelGalleryImagesLoaded(): void {
    // Prefer gallery state once loaded (includes unsaved GPS edits).
    if (this.panelGallery?.editMode) {
      this.refreshImageLocationsFromGallery();
      return;
    }
    // View mode: keep/refresh from gallery items (same geotags as the API list).
    if (this.panelGallery && this.panelGallery.images.length > 0) {
      this.refreshImageLocationsFromGallery();
    }
  }

  public focusImageCoordinates(coordinates: Coordinates): void {
    if (!this.map) {
      return;
    }
    this.hideImageHoverPopup();
    this.map.flyTo({
      center: [coordinates.lng, coordinates.lat],
      zoom: Math.max(this.map.getZoom(), 17),
      duration: 700,
    });
  }

  private setImageCoordinatePickActive(active: boolean): void {
    if (active) {
      this.hideImageHoverPopup();
    }
    this.pickingImageCoordinates = active;
    this.updateMapPickPanelVisibility();
    if (
      this.map &&
      this.draggingVertexIndex == null &&
      !this.isPolygonToolActive
    ) {
      this.map.getCanvas().style.cursor = this.isMapOverlayInteractionActive
        ? 'crosshair'
        : '';
    }
    this.cdr.detectChanges();
  }

  private setParkingCoordinatePickActive(active: boolean): void {
    if (active) {
      this.hideImageHoverPopup();
    }
    this.pickingParkingCoordinates = active;
    this.updateMapPickPanelVisibility();
    if (
      this.map &&
      this.draggingVertexIndex == null &&
      !this.isPolygonToolActive
    ) {
      this.map.getCanvas().style.cursor = this.isMapOverlayInteractionActive
        ? 'crosshair'
        : '';
    }
    this.cdr.detectChanges();
  }

  private updateMapPickPanelVisibility(): void {
    this.mapPickHidesPanel =
      this.isMapOverlayInteractionActive && this.isMobileViewport;
  }

  private applyImageCoordinatePick(lat: number, lng: number): boolean {
    if (!this.pickingImageCoordinates && !this.consumingImageMapPick) {
      return false;
    }
    if (this.pickingImageCoordinates) {
      this.consumingImageMapPick = true;
      this.panelGallery?.applyMapPick(lat, lng);
      setTimeout(() => {
        this.consumingImageMapPick = false;
      }, 0);
    }
    return true;
  }

  private applyParkingCoordinatePick(lat: number, lng: number): boolean {
    if (!this.pickingParkingCoordinates && !this.consumingParkingMapPick) {
      return false;
    }
    if (this.pickingParkingCoordinates) {
      this.consumingParkingMapPick = true;
      this.panelMisc?.applyMapPick(lat, lng);
      setTimeout(() => {
        this.consumingParkingMapPick = false;
      }, 0);
    }
    return true;
  }

  private applyMapOverlayPick(lat: number, lng: number): boolean {
    if (this.applyImageCoordinatePick(lat, lng)) {
      return true;
    }
    if (this.applyParkingCoordinatePick(lat, lng)) {
      return true;
    }
    if (this.drawingPath) {
      this.panelMisc?.applyPathVertex(lng, lat);
      return true;
    }
    return false;
  }

  private onFeatureSelectClick(event: MapLayerMouseEvent) {
    event.originalEvent.stopPropagation();
    if (this.applyMapOverlayPick(event.lngLat.lat, event.lngLat.lng)) {
      return;
    }
    const id = event.features?.[0]?.properties?.['id'];
    if (!id || this.drawMode !== 'select') {
      return;
    }
    this.openEditPanel(String(id));
  }

  public focusActiveFeature() {
    const geometry =
      this.editingFeature?.geometry ?? this.draftGeometry ?? null;
    if (!this.map || !geometry) {
      return;
    }
    const bounds = new LngLatBounds();
    if (geometry.type === 'Point') {
      bounds.extend(geometry.coordinates as [number, number]);
    } else if (geometry.type === 'Polygon') {
      for (const coord of geometry.coordinates[0] ?? []) {
        bounds.extend(coord as [number, number]);
      }
    } else {
      return;
    }
    if (bounds.isEmpty()) {
      return;
    }
    const padding = this.isMobileViewport
      ? { top: 64, bottom: 320, left: 48, right: 48 }
      : { top: 64, bottom: 64, left: 48, right: 380 };
    this.map.fitBounds(bounds, {
      padding,
      maxZoom: geometry.type === 'Point' ? 17 : 18,
      duration: 700,
    });
  }

  public cancelFeatureEdit() {
    if (!this.editingFeature?.id) {
      this.closePanel();
      return;
    }
    this.featureFormActive = false;
    this.patchFeatureForm(this.editingFeature);
    this.cdr.detectChanges();
  }

  public enumLabel(
    group: 'potential' | 'rockQuality' | 'rockType' | 'accessIssue',
    value: string | null | undefined,
  ): string {
    if (!value) {
      return '';
    }
    return this.transloco.translate(`rockExplorer.${group}.${value}`);
  }

  public potentialColor(value: string | null | undefined): string {
    if (!value) {
      return POTENTIAL_FILL_COLORS.NONE;
    }
    return POTENTIAL_FILL_COLORS[value] ?? POTENTIAL_FILL_COLORS.NONE;
  }

  public accessIssuesLabel(issues: string[] | null | undefined): string {
    return (issues ?? [])
      .map((v) => this.enumLabel('accessIssue', v))
      .join(', ');
  }

  public featureGradeLabel(feature: RockExplorerFeature): string | null {
    const parts: string[] = [];
    if (feature.gradeLineType) {
      parts.push(this.transloco.translate(feature.gradeLineType));
    }
    if (feature.gradeScale) {
      parts.push(feature.gradeScale);
    }
    if (feature.gradeValueMin != null || feature.gradeValueMax != null) {
      const minName = this.gradeNameForValue(feature.gradeValueMin);
      const maxName = this.gradeNameForValue(feature.gradeValueMax);
      const min =
        minName ??
        (feature.gradeValueMin != null ? String(feature.gradeValueMin) : '?');
      const max =
        maxName ??
        (feature.gradeValueMax != null ? String(feature.gradeValueMax) : '?');
      parts.push(min === max ? min : `${min}–${max}`);
    }
    return parts.length ? parts.join(' · ') : null;
  }

  private gradeNameForValue(value: number | null | undefined): string | null {
    if (value == null) {
      return null;
    }
    const grade = this.gradeOptions.find((g) => g.value === value);
    return grade?.name ?? null;
  }

  public confirmDelete(event: Event) {
    if (!this.editingFeature?.id) {
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

  public closePanel() {
    this.panelOpen = false;
    this.featureFormActive = false;
    this.imageEditMode = false;
    this.miscEditMode = false;
    this.cancelImageCoordinatePick();
    this.cancelParkingCoordinatePick();
    this.cancelPathDraw();
    this.resetPanelTabs();
    this.editingFeature = null;
    this.draftGeometry = null;
    this.clearDraftLayer();
    this.clearImageLocations();
    this.clearMiscOverlays();
    this.featureForm.reset({
      title: '',
      description: '',
      potential: null,
      rockQuality: null,
      rockType: null,
      gradeLineType: null,
      gradeScale: null,
      gradeValueMin: null,
      gradeValueMax: null,
      accessIssues: [],
      topoLinks: [],
    });
    this.scaleOptions = [];
    this.gradeOptions = [];
    this.applySelectionFilters();
  }

  private resetPanelTabs() {
    this.panelActiveTab = 'info';
    this.panelImageCount = 0;
    this.panelCommentCount = 0;
  }

  public finishPolygon() {
    if (this.drawMode === 'editPolygon') {
      this.finishPolygonEdit();
      return;
    }
    if (this.drawMode !== 'polygon' || this.polygonVertices.length < 3) {
      return;
    }
    const ring = [...this.polygonVertices, this.polygonVertices[0]];
    this.openCreatePanel({ type: 'Polygon', coordinates: [ring] });
    this.polygonVertices = [];
    this.drawMode = 'select';
  }

  private finishPolygonEdit() {
    const feature = this.geometryEditFeature;
    if (!feature?.id || this.polygonVertices.length < 3 || this.saving) {
      return;
    }
    const ring = [...this.polygonVertices, this.polygonVertices[0]];
    feature.geometry = { type: 'Polygon', coordinates: [ring] };
    this.saving = true;
    this.cdr.detectChanges();
    this.rockExplorerService
      .updateFeature(feature)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (saved) => {
          this.saving = false;
          this.endVertexDrag();
          this.polygonVertices = [];
          this.clearDraftLayer();
          this.geometryEditFeature = null;
          this.drawMode = 'select';
          this.reloadFeatures(this.currentFilters());
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
        },
        error: () => {
          this.saving = false;
          this.messageService.add({
            severity: 'error',
            summary: this.transloco.translate(marker('rockExplorer.saveError')),
          });
          this.cdr.detectChanges();
        },
      });
  }

  public onPanelImagesChanged(): void {
    this.reloadFeatures(this.currentFilters());
    // Prefer in-memory gallery geotags so dots don't vanish while a refetch runs.
    if (this.panelGallery) {
      this.refreshImageLocationsFromGallery();
    } else if (this.editingFeature?.id) {
      this.loadFeatureImageLocations(this.editingFeature.id);
    }
  }

  private deleteFeature() {
    if (!this.editingFeature) {
      return;
    }
    this.rockExplorerService
      .deleteFeature(this.editingFeature)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.closePanel();
          this.reloadFeatures(this.currentFilters());
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

  private initMap() {
    const el = this.mapContainer?.nativeElement;
    if (!el) {
      return;
    }
    this.map = new MaplibreMap({
      container: el,
      style: this.styleUrl(this.mapStyle),
      center: [10, 50],
      zoom: 5,
    });
    this.map.addControl(new NavigationControl({}), 'top-right');
    this.map.addControl(
      new GeolocateControl({
        positionOptions: { enableHighAccuracy: true },
        trackUserLocation: true,
      }),
      'top-right',
    );
    this.map.on('load', () => {
      this.loadParkingIcon()
        .then(() => {
          this.addFeatureLayers();
          this.setFeatureData(this.features);
          this.fitToFeatures();
        })
        .catch(() => {
          this.addFeatureLayers();
          this.setFeatureData(this.features);
          this.fitToFeatures();
        });
      // High-frequency handlers stay outside Angular so drag doesn't thrash CD.
      this.ngZone.runOutsideAngular(() => {
        this.map!.on('mousemove', (event) => this.onMapMouseMove(event));
        this.map!.on('mousedown', 'rock-explorer-draft-points', (event) =>
          this.onDraftVertexMouseDown(event),
        );
        this.map!.on('mousedown', 'rock-explorer-parking', (event) =>
          this.onParkingMarkerMouseDown(event),
        );
        this.map!.on('mouseup', () => this.endMapDrag());
        this.map!.on('mouseleave', () => this.endMapDrag());
        this.map!.on('mouseenter', 'rock-explorer-draft-points', () => {
          if ((this.isPolygonToolActive || this.drawingPath) && this.map) {
            this.map.getCanvas().style.cursor = 'grab';
          }
        });
        this.map!.on('mouseleave', 'rock-explorer-draft-points', () => {
          if (this.draggingVertexIndex == null && this.map) {
            this.map.getCanvas().style.cursor = this.drawingPath
              ? 'crosshair'
              : '';
          }
        });
        this.map!.on('mouseenter', 'rock-explorer-parking', () => {
          if (this.canDragParkingMarkers() && this.map) {
            this.map.getCanvas().style.cursor = 'grab';
          }
        });
        this.map!.on('mouseleave', 'rock-explorer-parking', () => {
          if (
            this.draggingParkingId == null &&
            this.draggingVertexIndex == null &&
            this.map &&
            !this.isMapOverlayInteractionActive
          ) {
            this.map.getCanvas().style.cursor = '';
          }
        });
        this.map!.on('mousemove', 'rock-explorer-image-locations', (event) =>
          this.onImageLocationMouseMove(event),
        );
        this.map!.on('mouseleave', 'rock-explorer-image-locations', () =>
          this.onImageLocationMouseLeave(),
        );
      });
      this.map!.on('click', (event) =>
        this.ngZone.run(() => this.onMapClick(event)),
      );
      this.map!.on('click', 'rock-explorer-points', (event) =>
        this.ngZone.run(() => this.onFeatureSelectClick(event)),
      );
      this.map!.on('click', 'rock-explorer-polygons-fill', (event) =>
        this.ngZone.run(() => this.onFeatureSelectClick(event)),
      );
    });
  }

  private onMapClick(event: MapMouseEvent) {
    if (this.suppressNextMapClick) {
      this.suppressNextMapClick = false;
      return;
    }
    if (this.draggingVertexIndex != null || this.draggingParkingId != null) {
      return;
    }
    if (this.applyMapOverlayPick(event.lngLat.lat, event.lngLat.lng)) {
      return;
    }
    if (this.drawMode === 'point') {
      this.drawMode = 'select';
      this.openCreatePanel({
        type: 'Point',
        coordinates: [event.lngLat.lng, event.lngLat.lat],
      });
      return;
    }
    if (this.drawMode === 'polygon') {
      this.polygonVertices.push([event.lngLat.lng, event.lngLat.lat]);
      this.renderPolygonDraft();
    }
  }

  private canDragParkingMarkers(): boolean {
    return (
      this.miscEditMode &&
      !this.pickingParkingCoordinates &&
      !this.drawingPath &&
      !this.isPolygonToolActive
    );
  }

  private onParkingMarkerMouseDown(event: MapLayerMouseEvent) {
    if (!this.canDragParkingMarkers() || !this.map || !this.panelMisc) {
      return;
    }
    const id = event.features?.[0]?.properties?.['id'];
    if (!id) {
      return;
    }
    event.preventDefault();
    this.draggingParkingId = String(id);
    this.suppressNextMapClick = true;
    this.dragOverlayCollection = {
      type: 'FeatureCollection',
      features: this.panelMisc.getParkingMapFeatures(),
    };
    this.map.dragPan.disable();
    this.map.getCanvas().style.cursor = 'grabbing';
  }

  private onDraftVertexMouseDown(event: MapLayerMouseEvent) {
    if ((!this.isPolygonToolActive && !this.drawingPath) || !this.map) {
      return;
    }
    const feature = event.features?.[0];
    const index = Number(feature?.properties?.['vertexIndex']);
    const vertexCount = this.drawingPath
      ? (this.panelMisc?.pathDraftVertices.length ?? 0)
      : this.polygonVertices.length;
    if (!Number.isInteger(index) || index < 0 || index >= vertexCount) {
      return;
    }
    event.preventDefault();
    this.draggingVertexIndex = index;
    this.vertexDragMoved = false;
    this.suppressNextMapClick = true;
    this.dragOverlayCollection = this.drawingPath
      ? (this.panelMisc?.getPathDraftCollection() ?? null)
      : this.buildPolygonDraftCollection();
    this.map.dragPan.disable();
    this.map.getCanvas().style.cursor = 'grabbing';
  }

  private onMapMouseMove(event: MapMouseEvent) {
    if (this.draggingParkingId == null && this.draggingVertexIndex == null) {
      return;
    }
    this.pendingDragLngLat = {
      lat: event.lngLat.lat,
      lng: event.lngLat.lng,
    };
    if (this.dragFrameId != null) {
      return;
    }
    this.dragFrameId = requestAnimationFrame(() => this.flushDragFrame());
  }

  private flushDragFrame() {
    this.dragFrameId = null;
    const ll = this.pendingDragLngLat;
    this.pendingDragLngLat = null;
    if (!ll) {
      return;
    }
    if (this.draggingParkingId) {
      this.panelMisc?.moveParkingSite(
        this.draggingParkingId,
        ll.lat,
        ll.lng,
        true,
      );
      if (this.dragOverlayCollection) {
        this.syncParkingDragCollectionCoords();
        this.setParkingOverlayData(this.dragOverlayCollection);
      }
      return;
    }
    if (this.draggingVertexIndex == null) {
      return;
    }
    this.vertexDragMoved = true;
    if (this.drawingPath) {
      this.panelMisc?.movePathVertex(
        this.draggingVertexIndex,
        ll.lng,
        ll.lat,
        true,
      );
      if (this.dragOverlayCollection) {
        this.setDraftData(this.dragOverlayCollection);
      }
      return;
    }
    this.polygonVertices[this.draggingVertexIndex][0] = ll.lng;
    this.polygonVertices[this.draggingVertexIndex][1] = ll.lat;
    if (this.dragOverlayCollection) {
      this.setDraftData(this.dragOverlayCollection);
    }
  }

  /** Parking features are rebuilt as new objects; refresh coords from model. */
  private syncParkingDragCollectionCoords() {
    if (!this.dragOverlayCollection || !this.panelMisc) {
      return;
    }
    for (const feature of this.dragOverlayCollection.features) {
      if (feature.geometry.type !== 'Point') {
        continue;
      }
      const id = String(feature.properties?.['id'] ?? '');
      const site = this.panelMisc.parkingSites.find((s) => s.id === id);
      if (site?.lng != null && site?.lat != null) {
        feature.geometry.coordinates[0] = site.lng;
        feature.geometry.coordinates[1] = site.lat;
      }
    }
  }

  private endMapDrag() {
    // Apply any pending frame before clearing drag state.
    if (this.dragFrameId != null || this.pendingDragLngLat != null) {
      this.cancelDragFrame();
      this.flushDragFrame();
    }
    this.dragOverlayCollection = null;

    if (this.draggingParkingId) {
      this.draggingParkingId = null;
      this.map?.dragPan.enable();
      if (this.map && !this.isMapOverlayInteractionActive) {
        this.map.getCanvas().style.cursor = '';
      }
      this.ngZone.run(() => {
        this.panelMisc?.onParkingFieldChange();
        this.cdr.detectChanges();
      });
      return;
    }
    this.endVertexDrag();
  }

  private endVertexDrag() {
    if (this.draggingVertexIndex == null) {
      return;
    }
    const index = this.draggingVertexIndex;
    const wasClick = !this.vertexDragMoved;
    this.draggingVertexIndex = null;
    this.vertexDragMoved = false;
    this.dragOverlayCollection = null;
    this.map?.dragPan.enable();
    if (this.map) {
      this.map.getCanvas().style.cursor =
        this.isPolygonToolActive || this.drawingPath ? 'grab' : '';
    }
    if (!this.drawingPath) {
      return;
    }
    // Click selects; drag clears selection and refreshes draft (avoids stale red).
    this.ngZone.run(() => {
      if (wasClick) {
        this.panelMisc?.selectPathVertex(index);
      } else {
        this.panelMisc?.selectPathVertex(null);
      }
    });
  }

  private cancelDragFrame() {
    if (this.dragFrameId != null) {
      cancelAnimationFrame(this.dragFrameId);
      this.dragFrameId = null;
    }
  }

  private openCreatePanel(geometry: Geometry) {
    this.featureFormActive = true;
    this.editingFeature = null;
    this.draftGeometry = geometry;
    this.clearImageLocations();
    this.clearMiscOverlays();
    this.featureForm.reset({
      title: '',
      description: '',
      potential: null,
      rockQuality: null,
      rockType: null,
      gradeLineType: null,
      gradeScale: null,
      gradeValueMin: null,
      gradeValueMax: null,
      accessIssues: [],
      topoLinks: [],
    });
    this.scaleOptions = [];
    this.gradeOptions = [];
    this.panelOpen = true;
    this.renderDraftGeometry(geometry);
    this.applySelectionFilters();
    this.cdr.detectChanges();
  }

  public openEditPanel(id: string) {
    this.rockExplorerService
      .getFeature(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((feature) => {
        this.applyFeatureToPanel(feature, false);
      });
  }

  private applyFeatureToPanel(
    feature: RockExplorerFeature,
    formActive: boolean,
  ) {
    this.featureFormActive = formActive;
    this.resetPanelTabs();
    this.editingFeature = feature;
    this.draftGeometry = feature.geometry;
    this.patchFeatureForm(feature);
    this.panelOpen = true;
    this.applySelectionFilters();
    this.refreshMiscOverlaysFromFeature(feature);
    if (feature.id) {
      this.loadFeatureImageLocations(feature.id);
    }
    this.cdr.detectChanges();
  }

  private patchFeatureForm(feature: RockExplorerFeature) {
    this.suppressGradeCascade = true;
    this.featureForm.patchValue({
      title: feature.title ?? '',
      description: feature.description ?? '',
      potential: feature.potential,
      rockQuality: feature.rockQuality,
      rockType: feature.rockType,
      gradeLineType: feature.gradeLineType,
      gradeScale: feature.gradeScale,
      gradeValueMin: feature.gradeValueMin,
      gradeValueMax: feature.gradeValueMax,
      accessIssues: feature.accessIssues ?? [],
      topoLinks: (feature.topoLinks ?? []).map(Tag.toSearchable),
    });
    this.suppressGradeCascade = false;
    this.loadGradeCascade(
      feature.gradeLineType,
      feature.gradeScale,
      feature.gradeValueMin,
      feature.gradeValueMax,
      this.featureForm,
    );
  }

  private rebuildEnumOptions() {
    this.potentialOptions = Object.values(RockExplorerPotential).map(
      (value) => ({
        value,
        label: this.transloco.translate(`rockExplorer.potential.${value}`),
      }),
    );
    this.rockQualityOptions = Object.values(RockExplorerRockQuality).map(
      (value) => ({
        value,
        label: this.transloco.translate(`rockExplorer.rockQuality.${value}`),
      }),
    );
    this.rockTypeOptions = Object.values(RockExplorerRockType).map((value) => ({
      value,
      label: this.transloco.translate(`rockExplorer.rockType.${value}`),
    }));
    this.accessIssueOptions = Object.values(RockExplorerAccessIssue).map(
      (value) => ({
        value,
        label: this.transloco.translate(`rockExplorer.accessIssue.${value}`),
      }),
    );
  }

  private rebuildLineTypeOptions() {
    this.lineTypeOptions = Object.entries(this.groupedScales)
      .filter(([, scales]) => scales.length > 0)
      .map(([lineType]) => ({
        value: lineType,
        label: this.transloco.translate(lineType),
      }));
  }

  private initGradeCascade(scales: Scale[]) {
    this.groupedScales = {
      [LineType.BOULDER]: [],
      [LineType.SPORT]: [],
      [LineType.TRAD]: [],
    };
    scales
      .sort((a, b) => a.name.localeCompare(b.name))
      .forEach((scale) => this.groupedScales[scale.lineType].push(scale));
    this.rebuildLineTypeOptions();
    if (!this.gradeCascadeReady) {
      this.wireGradeCascade(this.featureForm);
      this.gradeCascadeReady = true;
    }
  }

  private wireGradeCascade(form: FormGroup) {
    form
      .get('gradeLineType')!
      .valueChanges.pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((lineType) => {
        if (this.suppressGradeCascade) {
          return;
        }
        this.onGradeLineTypeChanged(lineType as LineType | null, form);
      });
    form
      .get('gradeScale')!
      .valueChanges.pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((scale) => {
        if (this.suppressGradeCascade) {
          return;
        }
        this.onGradeScaleChanged(
          form.get('gradeLineType')!.value as LineType | null,
          scale,
          form,
          false,
        );
      });
    form
      .get('gradeValueMin')!
      .valueChanges.pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((min) => {
        if (this.suppressGradeCascade) {
          return;
        }
        if (min != null && form.get('gradeValueMax')!.value == null) {
          this.suppressGradeCascade = true;
          form.patchValue({ gradeValueMax: min });
          this.suppressGradeCascade = false;
        }
        form.get('gradeValueMax')!.updateValueAndValidity({ emitEvent: false });
      });
    form
      .get('gradeValueMax')!
      .valueChanges.pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((max) => {
        if (this.suppressGradeCascade || max == null) {
          return;
        }
        if (form.get('gradeValueMin')!.value == null) {
          this.suppressGradeCascade = true;
          form.patchValue({ gradeValueMin: max });
          this.suppressGradeCascade = false;
        }
      });
  }

  private selectableGrades(grades: Grade[]): Grade[] {
    // Exclude CLOSED_PROJECT / OPEN_PROJECT (< 0) and UNGRADED (0).
    return grades.filter((grade) => grade.value > 0);
  }

  private onGradeLineTypeChanged(lineType: LineType | null, form: FormGroup) {
    this.scaleOptions = lineType
      ? this.groupedScales[lineType].map((scale) => ({
          label: scale.name,
          value: scale.name,
        }))
      : [];
    this.gradeOptions = [];
    this.suppressGradeCascade = true;
    form.patchValue({
      gradeScale: null,
      gradeValueMin: null,
      gradeValueMax: null,
    });
    this.suppressGradeCascade = false;
    this.cdr.detectChanges();
  }

  private onGradeScaleChanged(
    lineType: LineType | null,
    scaleName: string | null,
    form: FormGroup,
    preserveValues: boolean,
  ) {
    if (!lineType || !scaleName) {
      this.gradeOptions = [];
      if (!preserveValues) {
        this.suppressGradeCascade = true;
        form.patchValue({ gradeValueMin: null, gradeValueMax: null });
        this.suppressGradeCascade = false;
      }
      this.cdr.detectChanges();
      return;
    }
    this.scalesService
      .getScale(lineType, scaleName)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((scale) => {
        this.gradeOptions = this.selectableGrades(scale.grades);
        if (!preserveValues) {
          this.suppressGradeCascade = true;
          form.patchValue({ gradeValueMin: null, gradeValueMax: null });
          this.suppressGradeCascade = false;
        }
        this.cdr.detectChanges();
      });
  }

  private loadGradeCascade(
    lineType: LineType | null | undefined,
    scaleName: string | null | undefined,
    min: number | null | undefined,
    max: number | null | undefined,
    form: FormGroup,
  ) {
    this.scaleOptions = lineType
      ? this.groupedScales[lineType].map((scale) => ({
          label: scale.name,
          value: scale.name,
        }))
      : [];
    this.gradeOptions = [];
    if (!lineType || !scaleName) {
      return;
    }
    this.scalesService
      .getScale(lineType, scaleName)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((scale) => {
        this.gradeOptions = this.selectableGrades(scale.grades);
        this.suppressGradeCascade = true;
        form.patchValue({
          gradeValueMin: min ?? null,
          gradeValueMax: max ?? null,
        });
        this.suppressGradeCascade = false;
        this.cdr.detectChanges();
      });
  }

  private potentialPaintMatch(colors: Record<string, string>): unknown[] {
    const expression: unknown[] = ['match', ['get', 'potential']];
    for (const [key, color] of Object.entries(colors)) {
      expression.push(key, color);
    }
    expression.push(colors.NONE);
    return expression;
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
        this.setFeatureData(collection);
        if (options.fit) {
          this.fitToFeatures();
        }
      });
  }

  private currentFilters() {
    const value = this.filterForm.getRawValue();
    return {
      potential: value.potential || undefined,
      rockQuality: value.rockQuality || undefined,
      rockType: value.rockType || undefined,
    };
  }

  private styleUrl(style: MapStyles): string {
    if (style === MapStyles.SATELLITE) {
      return `https://api.maptiler.com/maps/satellite/style.json?key=${this.apiKey}`;
    }
    return `https://api.maptiler.com/maps/topo-v2/style.json?key=${this.apiKey}`;
  }

  private addFeatureLayers() {
    if (!this.map) {
      return;
    }
    if (!this.map.getSource('rock-explorer-features')) {
      this.map.addSource('rock-explorer-features', {
        type: 'geojson',
        data: this.features,
      });
    }
    if (!this.map.getSource('rock-explorer-draft')) {
      this.map.addSource('rock-explorer-draft', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
      });
    }
    if (!this.map.getSource('rock-explorer-feature-labels')) {
      this.map.addSource('rock-explorer-feature-labels', {
        type: 'geojson',
        data: this.buildFeatureLabelCollection(this.features),
      });
    }
    if (!this.map.getLayer('rock-explorer-polygons-fill')) {
      this.map.addLayer({
        id: 'rock-explorer-polygons-fill',
        type: 'fill',
        source: 'rock-explorer-features',
        filter: ['==', ['geometry-type'], 'Polygon'],
        paint: {
          'fill-color': this.potentialPaintMatch(POTENTIAL_FILL_COLORS) as any,
          'fill-opacity': 0.4,
        },
      });
      this.map.addLayer({
        id: 'rock-explorer-polygons-outline',
        type: 'line',
        source: 'rock-explorer-features',
        filter: ['==', ['geometry-type'], 'Polygon'],
        paint: {
          'line-color': this.potentialPaintMatch(
            POTENTIAL_OUTLINE_COLORS,
          ) as any,
          'line-width': 2,
        },
      });
      this.map.addLayer({
        id: 'rock-explorer-points',
        type: 'circle',
        source: 'rock-explorer-features',
        filter: ['==', ['geometry-type'], 'Point'],
        paint: {
          'circle-radius': 7,
          'circle-color': this.potentialPaintMatch(
            POTENTIAL_FILL_COLORS,
          ) as any,
          'circle-stroke-width': 2,
          'circle-stroke-color': '#fff',
        },
      });
      this.map.addLayer({
        id: 'rock-explorer-draft-line',
        type: 'line',
        source: 'rock-explorer-draft',
        filter: ['==', ['geometry-type'], 'LineString'],
        paint: {
          'line-color': '#2563eb',
          'line-width': 2,
          'line-dasharray': [2, 1],
        },
      });
      this.map.addLayer({
        id: 'rock-explorer-draft-fill',
        type: 'fill',
        source: 'rock-explorer-draft',
        filter: ['==', ['geometry-type'], 'Polygon'],
        paint: {
          'fill-color': '#2563eb',
          'fill-opacity': 0.15,
        },
      });
      this.map.addLayer({
        id: 'rock-explorer-draft-outline',
        type: 'line',
        source: 'rock-explorer-draft',
        filter: ['==', ['geometry-type'], 'Polygon'],
        paint: {
          'line-color': '#2563eb',
          'line-width': 2,
        },
      });
      this.map.addLayer({
        id: 'rock-explorer-draft-points',
        type: 'circle',
        source: 'rock-explorer-draft',
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
            ['boolean', ['get', 'selected'], false],
            '#dc2626',
            '#2563eb',
          ],
          'circle-stroke-width': 2,
          'circle-stroke-color': '#ffffff',
        },
      });
    }
    if (!this.map.getLayer('rock-explorer-selected-points')) {
      this.map.addLayer({
        id: 'rock-explorer-selected-points',
        type: 'circle',
        source: 'rock-explorer-features',
        filter: [
          'all',
          ['==', ['geometry-type'], 'Point'],
          ['in', ['get', 'id'], ['literal', []]],
        ],
        paint: {
          'circle-radius': 11,
          'circle-color': 'rgba(0,0,0,0)',
          'circle-stroke-width': 3,
          'circle-stroke-color': '#2563eb',
        },
      });
      this.map.addLayer({
        id: 'rock-explorer-selected-polygons',
        type: 'line',
        source: 'rock-explorer-features',
        filter: [
          'all',
          ['==', ['geometry-type'], 'Polygon'],
          ['in', ['get', 'id'], ['literal', []]],
        ],
        paint: { 'line-color': '#2563eb', 'line-width': 4 },
      });
    }
    if (!this.map.getLayer('rock-explorer-labels')) {
      this.map.addLayer({
        id: 'rock-explorer-labels',
        type: 'symbol',
        source: 'rock-explorer-feature-labels',
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
    this.applySelectionFilters();
    // Re-apply label points after style reload / source recreate.
    this.setFeatureLabelData(this.features);
    if (!this.map.getSource('rock-explorer-image-locations')) {
      this.map.addSource('rock-explorer-image-locations', {
        type: 'geojson',
        data: this.imageLocationsData,
      });
    } else {
      this.setImageLocationsData(this.imageLocationsData);
    }
    if (!this.map.getLayer('rock-explorer-image-locations')) {
      this.map.addLayer({
        id: 'rock-explorer-image-locations',
        type: 'circle',
        source: 'rock-explorer-image-locations',
        paint: {
          'circle-radius': 7,
          'circle-color': '#ec4899',
          'circle-stroke-width': 2,
          'circle-stroke-color': '#ffffff',
        },
      });
    } else {
      this.map.setPaintProperty(
        'rock-explorer-image-locations',
        'circle-color',
        '#ec4899',
      );
    }
    // Keep labels above features; image dots above labels for hover.
    if (this.map.getLayer('rock-explorer-labels')) {
      this.map.moveLayer('rock-explorer-labels');
    }
    if (this.map.getLayer('rock-explorer-image-locations')) {
      this.map.moveLayer('rock-explorer-image-locations');
    }
    this.ensureMiscOverlayLayers();
    this.refreshMiscOverlays();
  }

  private applySelectionFilters() {
    const ids = this.editingFeature?.id ? [this.editingFeature.id] : [];
    const idLiteral: ['literal', string[]] = ['literal', ids];
    for (const layerId of [
      'rock-explorer-selected-points',
      'rock-explorer-selected-polygons',
    ]) {
      if (this.map?.getLayer(layerId)) {
        this.map.setFilter(layerId, [
          'all',
          [
            '==',
            ['geometry-type'],
            layerId === 'rock-explorer-selected-points' ? 'Point' : 'Polygon',
          ],
          ['in', ['get', 'id'], idLiteral],
        ]);
      }
    }
  }

  private setFeatureData(collection: FeatureCollection<Geometry>) {
    const source = this.map?.getSource('rock-explorer-features') as
      | GeoJSONSource
      | undefined;
    source?.setData(collection);
    this.setFeatureLabelData(collection);
  }

  private setFeatureLabelData(collection: FeatureCollection<Geometry>) {
    const source = this.map?.getSource('rock-explorer-feature-labels') as
      | GeoJSONSource
      | undefined;
    source?.setData(this.buildFeatureLabelCollection(collection));
  }

  /** One point per titled feature so polygon rings do not repeat labels. */
  private buildFeatureLabelCollection(
    collection: FeatureCollection<Geometry>,
  ): FeatureCollection<Geometry> {
    const features: Feature[] = [];
    for (const feature of collection.features) {
      const title = feature.properties?.['title'];
      if (typeof title !== 'string' || !title.trim()) {
        continue;
      }
      const coordinates = this.geometryLabelPoint(feature.geometry);
      if (!coordinates) {
        continue;
      }
      features.push({
        type: 'Feature',
        geometry: { type: 'Point', coordinates },
        properties: {
          id: feature.properties?.['id'] ?? null,
          title: title.trim(),
        },
      });
    }
    return { type: 'FeatureCollection', features };
  }

  private geometryLabelPoint(geometry: Geometry): [number, number] | null {
    if (geometry.type === 'Point') {
      return geometry.coordinates as [number, number];
    }
    if (geometry.type === 'Polygon') {
      const ring = geometry.coordinates[0] ?? [];
      // Drop the closing duplicate vertex of the ring.
      const points = ring.length > 1 ? ring.slice(0, -1) : ring;
      if (points.length === 0) {
        return null;
      }
      let sumLng = 0;
      let sumLat = 0;
      for (const point of points) {
        sumLng += point[0];
        sumLat += point[1];
      }
      return [sumLng / points.length, sumLat / points.length];
    }
    return null;
  }

  private fitToFeatures() {
    if (!this.map || this.features.features.length === 0) {
      return;
    }
    const bounds = new LngLatBounds();
    let hasCoord = false;
    for (const feature of this.features.features) {
      const geom = feature.geometry;
      if (geom.type === 'Point') {
        bounds.extend(geom.coordinates as [number, number]);
        hasCoord = true;
      } else if (geom.type === 'Polygon') {
        for (const coord of geom.coordinates[0]) {
          bounds.extend(coord as [number, number]);
          hasCoord = true;
        }
      }
    }
    if (hasCoord) {
      this.map.fitBounds(bounds, { padding: 48, maxZoom: 16, duration: 0 });
    }
  }

  private renderPolygonDraft() {
    this.setDraftData(this.buildPolygonDraftCollection());
  }

  private buildPolygonDraftCollection(): FeatureCollection<Geometry> {
    const features: Feature<Geometry>[] = this.polygonVertices.map(
      (coords, index) => ({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: coords },
        properties: { vertexIndex: index },
      }),
    );
    if (this.polygonVertices.length >= 2) {
      features.push({
        type: 'Feature',
        geometry: {
          type: 'LineString',
          coordinates: this.polygonVertices,
        },
        properties: {},
      });
    }
    if (this.polygonVertices.length >= 3) {
      features.push({
        type: 'Feature',
        geometry: {
          type: 'Polygon',
          // Closing ring uses same vertex refs + first point (MapLibre ok with shared refs).
          coordinates: [[...this.polygonVertices, this.polygonVertices[0]]],
        },
        properties: {},
      });
    }
    return { type: 'FeatureCollection', features };
  }

  /** Preview unsaved create geometry (no draggable vertex handles). */
  private renderDraftGeometry(geometry: Geometry) {
    const source = this.map?.getSource('rock-explorer-draft') as
      | GeoJSONSource
      | undefined;
    if (!source) {
      return;
    }
    const features: Feature[] = [{ type: 'Feature', geometry, properties: {} }];
    if (geometry.type === 'Polygon') {
      const ring = geometry.coordinates[0] ?? [];
      for (let i = 0; i < Math.max(ring.length - 1, 0); i++) {
        features.push({
          type: 'Feature',
          geometry: { type: 'Point', coordinates: ring[i] },
          properties: {},
        });
      }
    }
    source.setData({ type: 'FeatureCollection', features });
  }

  private clearDraftLayer() {
    const source = this.map?.getSource('rock-explorer-draft') as
      | GeoJSONSource
      | undefined;
    source?.setData({ type: 'FeatureCollection', features: [] });
  }

  private loadFeatureImageLocations(featureId: string) {
    const requestId = ++this.imageLocationsRequestId;
    this.galleryService
      .getGalleryImages({
        page: 1,
        per_page: 100,
        'tag-object-type': ObjectType.RockExplorerFeature,
        'tag-object-id': featureId,
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (page) => {
          if (
            requestId !== this.imageLocationsRequestId ||
            this.editingFeature?.id !== featureId
          ) {
            return;
          }
          // Don't overwrite live edit-mode GPS previews with a stale server list.
          if (this.panelGallery?.editMode) {
            this.refreshImageLocationsFromGallery();
            return;
          }
          this.setImageLocationsData({
            type: 'FeatureCollection',
            features: page.items
              .map((image) => this.galleryImageToMapFeature(image))
              .filter((feature): feature is Feature => feature != null),
          });
        },
        error: () => {
          if (requestId === this.imageLocationsRequestId) {
            this.clearImageLocations();
          }
        },
      });
  }

  private galleryImageToMapFeature(image: GalleryImage): Feature | null {
    const lat = image.image?.lat;
    const lng = image.image?.lng;
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

  private clearImageLocations() {
    this.imageLocationsRequestId++;
    this.hideImageHoverPopup();
    this.setImageLocationsData({ type: 'FeatureCollection', features: [] });
  }

  private clearMiscOverlays() {
    this.setParkingOverlayData({ type: 'FeatureCollection', features: [] });
    this.setPathsOverlayData({ type: 'FeatureCollection', features: [] });
    if (!this.isPolygonToolActive) {
      this.clearDraftLayer();
    }
  }

  private refreshMiscOverlaysFromFeature(feature: RockExplorerFeature): void {
    this.setParkingOverlayData({
      type: 'FeatureCollection',
      features: (feature.parkingSites ?? [])
        .filter((site) => site.lat != null && site.lng != null)
        .map((site) => ({
          type: 'Feature' as const,
          geometry: {
            type: 'Point' as const,
            coordinates: [site.lng as number, site.lat as number],
          },
          properties: {
            id: site.id,
            title: site.title,
            description: site.description,
            type: 'PARKING',
          },
        })),
    });
    this.setPathsOverlayData({
      type: 'FeatureCollection',
      features: (feature.paths ?? [])
        .filter((path) => (path.geometry?.coordinates?.length ?? 0) >= 2)
        .map((path) => ({
          type: 'Feature' as const,
          geometry: path.geometry,
          properties: {
            id: path.id,
            title: path.title,
            description: path.description,
          },
        })),
    });
  }

  private refreshMiscOverlays(): void {
    if (!this.editingFeature) {
      this.clearMiscOverlays();
      return;
    }
    this.ensureMiscOverlayLayers();
    if (this.panelMisc) {
      this.setParkingOverlayData({
        type: 'FeatureCollection',
        features: this.panelMisc.getParkingMapFeatures(),
      });
      this.setPathsOverlayData({
        type: 'FeatureCollection',
        features: this.panelMisc.getPathMapFeatures(),
      });
      if (this.drawingPath) {
        this.setDraftData(this.panelMisc.getPathDraftCollection());
      } else if (!this.isPolygonToolActive) {
        // Path edit finished/cancelled — don't leave draft vertices (e.g. red selected).
        this.clearDraftLayer();
      }
    } else {
      this.refreshMiscOverlaysFromFeature(this.editingFeature);
    }
  }

  private ensureMiscOverlayLayers(): void {
    if (!this.map) {
      return;
    }
    this.ensureParkingIcon();
    if (!this.map.getSource('rock-explorer-parking')) {
      this.map.addSource('rock-explorer-parking', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
      });
    }
    if (!this.map.getSource('rock-explorer-paths')) {
      this.map.addSource('rock-explorer-paths', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
      });
    }
    if (!this.map.getLayer('rock-explorer-paths')) {
      this.map.addLayer({
        id: 'rock-explorer-paths',
        type: 'line',
        source: 'rock-explorer-paths',
        paint: {
          'line-color': '#0f766e',
          'line-width': 3,
          'line-opacity': 0.9,
          'line-dasharray': [2, 1.5],
        },
      });
    } else {
      this.map.setPaintProperty(
        'rock-explorer-paths',
        'line-dasharray',
        [2, 1.5],
      );
    }
    if (!this.map.getLayer('rock-explorer-path-labels')) {
      this.map.addLayer({
        id: 'rock-explorer-path-labels',
        type: 'symbol',
        source: 'rock-explorer-paths',
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
          'text-color': '#0f766e',
          'text-halo-color': 'rgba(255,255,255,0.92)',
          'text-halo-width': 1.75,
        },
      });
    }
    if (!this.map.getLayer('rock-explorer-parking')) {
      this.map.addLayer({
        id: 'rock-explorer-parking',
        type: 'symbol',
        source: 'rock-explorer-parking',
        layout: {
          'icon-image': 'lc-parking',
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
      this.map.setLayoutProperty('rock-explorer-parking', 'text-field', [
        'coalesce',
        ['get', 'title'],
        '',
      ]);
      this.map.setLayoutProperty('rock-explorer-parking', 'text-size', 12);
      this.map.setLayoutProperty(
        'rock-explorer-parking',
        'text-offset',
        [0, 1.15],
      );
      this.map.setLayoutProperty('rock-explorer-parking', 'text-anchor', 'top');
      this.map.setLayoutProperty(
        'rock-explorer-parking',
        'text-allow-overlap',
        true,
      );
      this.map.setLayoutProperty(
        'rock-explorer-parking',
        'text-ignore-placement',
        true,
      );
      this.map.setPaintProperty(
        'rock-explorer-parking',
        'text-color',
        '#1c1917',
      );
      this.map.setPaintProperty(
        'rock-explorer-parking',
        'text-halo-color',
        'rgba(255,255,255,0.92)',
      );
      this.map.setPaintProperty(
        'rock-explorer-parking',
        'text-halo-width',
        1.75,
      );
    }
    if (this.map.getLayer('rock-explorer-paths')) {
      this.map.moveLayer('rock-explorer-paths');
    }
    if (this.map.getLayer('rock-explorer-path-labels')) {
      this.map.moveLayer('rock-explorer-path-labels');
    }
    if (this.map.getLayer('rock-explorer-parking')) {
      this.map.moveLayer('rock-explorer-parking');
    }
    if (this.map.getLayer('rock-explorer-image-locations')) {
      this.map.moveLayer('rock-explorer-image-locations');
    }
  }

  private ensureParkingIcon(): void {
    void this.loadParkingIcon();
  }

  private loadParkingIcon(): Promise<void> {
    if (!this.map || this.map.hasImage('lc-parking')) {
      return Promise.resolve();
    }
    return new Promise((resolve, reject) => {
      const img = new Image(100, 100);
      img.onload = () => {
        if (this.map && !this.map.hasImage('lc-parking')) {
          this.map.addImage('lc-parking', img);
        }
        resolve();
      };
      img.onerror = () => reject(new Error('Failed to load parking icon'));
      img.src = 'assets/icons/parking.svg';
    });
  }

  private setParkingOverlayData(collection: FeatureCollection<Geometry>): void {
    const source = this.map?.getSource('rock-explorer-parking') as
      | GeoJSONSource
      | undefined;
    source?.setData(collection);
  }

  private setPathsOverlayData(collection: FeatureCollection<Geometry>): void {
    const source = this.map?.getSource('rock-explorer-paths') as
      | GeoJSONSource
      | undefined;
    source?.setData(collection);
  }

  private setDraftData(collection: FeatureCollection<Geometry>): void {
    const source = this.map?.getSource('rock-explorer-draft') as
      | GeoJSONSource
      | undefined;
    source?.setData(collection);
  }

  private setImageLocationsData(collection: FeatureCollection<Geometry>) {
    this.imageLocationsData = collection;
    const source = this.map?.getSource('rock-explorer-image-locations') as
      | GeoJSONSource
      | undefined;
    source?.setData(collection);
  }

  private onImageLocationMouseMove(event: MapLayerMouseEvent) {
    if (
      !this.map ||
      this.isMapOverlayInteractionActive ||
      this.isPolygonToolActive
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
    const featureKey = `${feature.properties?.['galleryImageId'] ?? ''}:${coordinates.join(',')}`;
    if (featureKey === this.imageHoverFeatureKey && this.imageHoverPopup) {
      return;
    }
    this.imageHoverFeatureKey = featureKey;
    this.map.getCanvas().style.cursor = 'pointer';

    const thumbnailUrl = String(feature.properties?.['thumbnailUrl'] ?? '');
    const description = String(feature.properties?.['description'] ?? '');
    if (!thumbnailUrl) {
      this.hideImageHoverPopup();
      return;
    }

    const descriptionHtml = description
      ? `<div class="rock-explorer-image-hover-popup__caption">${this.escapeHtml(description)}</div>`
      : '';
    const html = `<div class="rock-explorer-image-hover-popup__content"><img src="${this.escapeHtml(thumbnailUrl)}" alt="" />${descriptionHtml}</div>`;

    if (!this.imageHoverPopup) {
      this.imageHoverPopup = new Popup({
        closeButton: false,
        closeOnClick: false,
        offset: 14,
        maxWidth: '200px',
        className: 'rock-explorer-image-hover-popup',
      });
    }
    this.imageHoverPopup.setLngLat(coordinates).setHTML(html).addTo(this.map);
  }

  private onImageLocationMouseLeave() {
    this.hideImageHoverPopup();
    if (
      this.map &&
      this.draggingVertexIndex == null &&
      !this.isMapOverlayInteractionActive &&
      !this.isPolygonToolActive
    ) {
      this.map.getCanvas().style.cursor = '';
    }
  }

  private hideImageHoverPopup() {
    this.imageHoverFeatureKey = null;
    this.imageHoverPopup?.remove();
  }

  private escapeHtml(value: string): string {
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }
}
